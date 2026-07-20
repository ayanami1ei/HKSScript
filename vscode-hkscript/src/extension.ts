import * as vscode from 'vscode';
import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let diagnosticCollection: vscode.DiagnosticCollection;
let log: vscode.OutputChannel;

const tokenTypes = ['function', 'type'];
const tokenModifiers: string[] = [];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

interface SymbolEntry { line: number; column: number; length: number; semanticType: string; }
interface SymbolTable { symbols: SymbolEntry[]; errors: { line: number; column: number; length: number; message: string }[]; }

interface Request {
    resolve: (r: SymbolTable) => void;
    text: string;
    timer: NodeJS.Timeout;
}

let server: ChildProcess | null = null;
let serverResolve: ((r: SymbolTable) => void) | null = null;
let buf = '';
let serverOk = false;
let requestQueue: Request[] = [];
let processing = false;
const onDidChangeSemanticTokensEvent = new vscode.EventEmitter<void>();

export function activate(context: vscode.ExtensionContext) {
    log = vscode.window.createOutputChannel('HksScript');
    log.appendLine('Extension activated');

    startServer(context);

    diagnosticCollection = vscode.languages.createDiagnosticCollection('hksscript');
    context.subscriptions.push(diagnosticCollection, log, onDidChangeSemanticTokensEvent);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(validateDocument),
        vscode.workspace.onDidSaveTextDocument(validateDocument),
        vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document)),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) validateDocument(editor.document);
        }),
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'hksscript' },
            { onDidChangeSemanticTokens: onDidChangeSemanticTokensEvent.event, provideDocumentSemanticTokens },
            legend
        )
    );

    context.subscriptions.push({ dispose: () => { server?.stdin?.write('---EXIT---\n'); server?.kill(); } });

    if (vscode.window.activeTextEditor)
        validateDocument(vscode.window.activeTextEditor.document);
}

export function deactivate() {
    server?.stdin?.write('---EXIT---\n');
    server?.kill();
}

function findDll(context: vscode.ExtensionContext): string | null {
    const cfg = vscode.workspace.getConfiguration('hkscript');
    const user = cfg.get<string>('compilerPath') || '';
    if (user && fs.existsSync(user)) { log.appendLine(`Found DLL from config: ${user}`); return path.resolve(user); }

    const candidates: string[] = [
        path.join(context.extensionPath, '..', 'bin', 'Debug', 'net10.0', 'HKSScript.dll'),
        path.join(context.extensionPath, 'bin', 'HKSScript.dll'),
    ];
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (ws) {
        candidates.push(path.join(ws, 'bin', 'Debug', 'net10.0', 'HKSScript.dll'));
        candidates.push(path.join(ws, 'HKSScript', 'bin', 'Debug', 'net10.0', 'HKSScript.dll'));
    }

    for (const c of candidates) {
        const r = path.resolve(c);
        log.appendLine(`Trying DLL path: ${r}`);
        if (fs.existsSync(r)) { log.appendLine(`Found DLL: ${r}`); return r; }
    }
    log.appendLine('DLL not found');
    return null;
}

function startServer(context: vscode.ExtensionContext) {
    try {
        execSync('dotnet --version', { stdio: 'pipe' });
    } catch {
        log.appendLine('dotnet not found on PATH');
        vscode.window.showWarningMessage(
            '.NET SDK not found. Install .NET SDK or set "hkscript.compilerPath".',
            'Open Settings'
        ).then(b => { if (b === 'Open Settings') vscode.commands.executeCommand('workbench.action.openSettings', 'hkscript.compilerPath'); });
        return;
    }

    const dll = findDll(context);
    if (!dll) {
        vscode.window.showWarningMessage(
            'HKSScript.dll not found. Run "dotnet build" in the project directory, or set "hkscript.compilerPath".',
            'Open Settings'
        ).then(b => { if (b === 'Open Settings') vscode.commands.executeCommand('workbench.action.openSettings', 'hkscript.compilerPath'); });
        return;
    }

    try {
        log.appendLine(`Starting server: dotnet ${dll} server`);
        const proc = spawn('dotnet', [dll, 'server'], { stdio: ['pipe', 'pipe', 'pipe'] });

        proc.stdout!.on('data', (d: Buffer) => {
            buf += d.toString();
            const nl = buf.indexOf('\n');
            if (nl >= 0) {
                const line = buf.substring(0, nl).trim();
                buf = buf.substring(nl + 1);
                if (line) {
                        log.appendLine(`Server response received (${line.length} chars)`);
                        const resolve = serverResolve;
                        serverResolve = null;
                        processing = false;
                        if (requestQueue.length > 0) {
                            clearTimeout(requestQueue[0].timer);
                            requestQueue.shift();
                        }
                        if (resolve) {
                            try { resolve(JSON.parse(line)); } catch (e) { log.appendLine(`JSON parse error: ${e}`); }
                        }
                        processQueue();
                    }
            }
        });

        proc.stderr!.on('data', (d: Buffer) => log.appendLine(`[server] ${d.toString().trim()}`));
        proc.on('error', (e) => { log.appendLine(`Server error: ${e.message}`); cleanup(); });
        proc.on('exit', (code) => { log.appendLine(`Server exited with code ${code}`); cleanup(); });

        server = proc;
        serverOk = true;
        log.appendLine('Server started successfully');
        onDidChangeSemanticTokensEvent.fire();
    } catch (e) {
        log.appendLine(`Failed to start server: ${e}`);
    }
}

function cleanup() {
    server = null; serverOk = false;
    serverResolve = null; processing = false;
    // Fail all queued requests
    for (const req of requestQueue) {
        clearTimeout(req.timer);
        req.resolve({ symbols: [], errors: [] });
    }
    requestQueue = [];
    log.appendLine('Server cleaned up');
}

function processQueue() {
    if (processing || requestQueue.length === 0 || !server || !serverOk) return;
    processing = true;
    const req = requestQueue[0];
    serverResolve = req.resolve;
    log.appendLine(`Sending ${req.text.length} chars to server (${requestQueue.length} queued)`);
    server.stdin!.write('---BEGIN---\n' + req.text + '\n---END---\n');
}

function analyze(text: string): Promise<SymbolTable> {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            log.appendLine('Server response timeout');
            // Only act if this request is still at the front of the queue
            if (processing && requestQueue.length > 0 && requestQueue[0].timer === timer) {
                processing = false;
                serverResolve = null;
                requestQueue.shift();
                processQueue();
            }
            resolve({ symbols: [], errors: [] });
        }, 5000);
        requestQueue.push({ resolve, text, timer });
        processQueue();
    });
}

async function provideDocumentSemanticTokens(document: vscode.TextDocument): Promise<vscode.SemanticTokens> {
    const builder = new vscode.SemanticTokensBuilder(legend);
    if (!serverOk || !server) { log.appendLine('provideDocumentSemanticTokens: server not ready'); return builder.build(); }

    try {
        log.appendLine('provideDocumentSemanticTokens: requesting analysis');
        const table = await analyze(document.getText());
        log.appendLine(`Got ${table.symbols.length} symbols, ${table.errors.length} errors`);
        for (const sym of table.symbols) {
            const idx = tokenTypes.indexOf(sym.semanticType);
            if (idx >= 0) builder.push(sym.line - 1, sym.column, sym.length, idx);
        }
    } catch (e) { log.appendLine(`provideDocumentSemanticTokens error: ${e}`); }
    return builder.build();
}

async function validateDocument(document: vscode.TextDocument) {
    if (document.languageId !== 'hksscript') return;
    const diagnostics: vscode.Diagnostic[] = [];
    if (!serverOk || !server) { diagnosticCollection.set(document.uri, diagnostics); return; }

    try {
        log.appendLine('validateDocument: requesting analysis');
        const table = await analyze(document.getText());
        for (const err of table.errors) {
            const range = new vscode.Range(
                Math.max(0, err.line - 1), err.column,
                Math.max(0, err.line - 1), err.column + Math.max(1, err.length)
            );
            diagnostics.push(new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error));
        }
    } catch (e) { log.appendLine(`validateDocument error: ${e}`); }
    diagnosticCollection.set(document.uri, diagnostics);
}
