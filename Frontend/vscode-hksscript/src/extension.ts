import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const diagnostic = vscode.languages.createDiagnosticCollection('hkscript');
    context.subscriptions.push(diagnostic);

    // 语义高亮
    const provider = new HkscriptSemanticTokensProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'hkscript' },
            provider,
            provider.legend
        )
    );

    // 文件变更时自动诊断
    const validate = (document: vscode.TextDocument) => {
        if (document.languageId !== 'hkscript') return;
        runDiagnose(document.uri.fsPath, diagnostic);
    };

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(validate),
        vscode.workspace.onDidChangeTextDocument(e => validate(e.document))
    );

    // 对已打开的文件执行一次诊断
    vscode.window.visibleTextEditors.forEach(e => validate(e.document));
}

// ─── 语义高亮 ───

class HkscriptSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    readonly legend = new vscode.SemanticTokensLegend(
        ['function', 'variable'],
        []
    );

    async provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): Promise<vscode.SemanticTokens> {
        const projectRoot = findProjectRoot(document.uri.fsPath);
        if (!projectRoot) return new vscode.SemanticTokens(new Uint32Array(0));

        const symbols = await runDotnet(projectRoot, ['code-present', document.uri.fsPath]) as SymbolInfo[];
        if (!symbols || symbols.length === 0) return new vscode.SemanticTokens(new Uint32Array(0));

        const builder = new vscode.SemanticTokensBuilder(this.legend);
        for (const sym of symbols) {
            const typeIdx = this.legend.tokenTypes.indexOf(sym.kind === 'function' ? 'function' : 'variable');
            if (typeIdx >= 0)
                builder.push(sym.line - 1, sym.column, sym.length, typeIdx, 0);
        }
        return builder.build();
    }
}

// ─── 诊断 ───

interface DiagInfo {
    message: string;
    line: number;
    column: number;
}

async function runDiagnose(filePath: string, collection: vscode.DiagnosticCollection) {
    const projectRoot = findProjectRoot(filePath);
    if (!projectRoot) return;

    const results = await runDotnet(projectRoot, ['diagnose', filePath]) as DiagInfo[];
    if (!results) return;

    const uri = vscode.Uri.file(filePath);
    const diagnostics: vscode.Diagnostic[] = [];

    for (const r of results) {
        const range = new vscode.Range(r.line - 1, r.column, r.line - 1, 1000);
        const diag = new vscode.Diagnostic(range, r.message, vscode.DiagnosticSeverity.Error);
        diagnostics.push(diag);
    }

    collection.set(uri, diagnostics);
}

// ─── 工具 ───

interface SymbolInfo {
    name: string; kind: string; type: string;
    line: number; column: number; length: number;
}

function runDotnet(projectRoot: string, args: string[]): Promise<any[]> {
    return new Promise(resolve => {
        const cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
        const child = cp.spawn(cmd, ['run', '--', ...args], { cwd: projectRoot });
        let stdout = '';

        child.stdout.on('data', (d: Buffer) => stdout += d.toString());
        child.on('close', () => {
            try { resolve(JSON.parse(stdout)); }
            catch { resolve([]); }
        });
        child.on('error', () => resolve([]));
    });
}

function findProjectRoot(filePath: string): string | null {
    let dir = path.dirname(filePath);
    while (dir !== path.dirname(dir)) {
        if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj')))
            return dir;
        dir = path.dirname(dir);
    }
    return null;
}
