import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

const kwColor = { color: '#b784e0', fontWeight: 'bold' as const };
const tpColor = { color: '#7ecf7e' };
const fnColor = { color: '#e8c86a' };
const vaColor = { color: '#7ab8e0' };
const coColor = { color: '#4a8a4a', fontStyle: 'italic' as const };
const stColor = { color: '#6aa8e0' };
const nuColor = { color: '#e09860' };

let kwDec: vscode.TextEditorDecorationType;
let tpDec: vscode.TextEditorDecorationType;
let fnDec: vscode.TextEditorDecorationType;
let vaDec: vscode.TextEditorDecorationType;
let coDec: vscode.TextEditorDecorationType;
let stDec: vscode.TextEditorDecorationType;
let nuDec: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    const diagnostic = vscode.languages.createDiagnosticCollection('hkscript');
    context.subscriptions.push(diagnostic);

    kwDec = vscode.window.createTextEditorDecorationType(kwColor);
    tpDec = vscode.window.createTextEditorDecorationType(tpColor);
    fnDec = vscode.window.createTextEditorDecorationType(fnColor);
    vaDec = vscode.window.createTextEditorDecorationType(vaColor);
    coDec = vscode.window.createTextEditorDecorationType(coColor);
    stDec = vscode.window.createTextEditorDecorationType(stColor);
    nuDec = vscode.window.createTextEditorDecorationType(nuColor);
    context.subscriptions.push(kwDec, tpDec, fnDec, coDec, stDec, nuDec, vaDec);

    function update(editor: vscode.TextEditor | undefined) {
        if (!editor) return;
        const text = editor.document.getText();
        const uri = editor.document.uri.fsPath;

        const kwR: vscode.Range[] = [];
        const tpR: vscode.Range[] = [];
        const fnR: vscode.Range[] = [];
        const vaR: vscode.Range[] = [];
        const coR: vscode.Range[] = [];
        const stR: vscode.Range[] = [];
        const nuR: vscode.Range[] = [];

        let m: RegExpExecArray | null;

        const symbols = getSymbols(uri);
        const fnPos = new Set<number>();
        const vaPos = new Set<number>();

        if (symbols) {
            for (const sym of symbols) {
                const off = editor.document.offsetAt(new vscode.Position(sym.line - 1, sym.column));
                if (sym.kind === 'function') {
                    fnPos.add(off);
                    fnR.push(new vscode.Range(editor.document.positionAt(off), editor.document.positionAt(off + sym.length)));
                } else if (sym.kind === 'variable') {
                    vaPos.add(off);
                    vaR.push(new vscode.Range(editor.document.positionAt(off), editor.document.positionAt(off + sym.length)));
                }
            }
        }

        function covered(pos: number) { return fnPos.has(pos) || vaPos.has(pos); }

        const strRe = /"(\\.|[^"\\])*"/g;
        while ((m = strRe.exec(text)) !== null)
            stR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        const comRe = /#[^\n]*/g;
        while ((m = comRe.exec(text)) !== null)
            coR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        const numRe = /\b\d+(\.\d+)?\b/g;
        while ((m = numRe.exec(text)) !== null) { if (!covered(m.index)) nuR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length))); }
        for (const w of ['import','def','if','elif','else','return','query','from','with','and','or','not','true','false']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null) kwR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }
        for (const w of ['int','float','string','bool','Mat','Set','Circle','Range','void']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null) tpR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }

        if (!symbols || symbols.length === 0) {
            for (const w of ['load','save','print','len','range']) {
                const re = new RegExp('\\b' + w + '\\b', 'g');
                while ((m = re.exec(text)) !== null) fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
            const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
            const skip = new Set(['import','def','if','elif','else','return','query','from','with','and','or','not','true','false','int','float','string','bool','Mat','Set','Circle','Range','void']);
            while ((m = callRe.exec(text)) !== null) { if (!skip.has(m[1])) fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[1].length))); }
            const varRe = /\b[a-zA-Z_]\w*\b/g;
            const skip2 = new Set([...skip, 'load','save','print','len','range']);
            while ((m = varRe.exec(text)) !== null) { if (!skip2.has(m[0]) && !text.substring(m.index + m[0].length).trimStart().startsWith('(')) vaR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length))); }
        }

        editor.setDecorations(kwDec, kwR);
        editor.setDecorations(tpDec, tpR);
        editor.setDecorations(fnDec, fnR);
        editor.setDecorations(vaDec, vaR);
        editor.setDecorations(coDec, coR);
        editor.setDecorations(stDec, stR);
        editor.setDecorations(nuDec, nuR);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.workspace.onDidSaveTextDocument(doc => {
            console.log('HKS: onSave lang=' + doc.languageId);
            if (doc.languageId === 'hkscript' || doc.fileName.endsWith('.hks')) {
                console.log('HKS: saved');
                runDiagnose(doc.uri.fsPath, diagnostic);
                const ed = vscode.window.activeTextEditor;
                if (ed?.document === doc) update(ed);
                console.log('HKS: save done');
            }
        }),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document) update(vscode.window.activeTextEditor);
        })
    );
    // ─── 类型提示 ───
    console.log('HKS: registering hover');
    context.subscriptions.push(
        vscode.languages.registerHoverProvider({ language: 'hkscript' }, {
            provideHover(document, position) {
                console.log('HKS: hover at ' + document.languageId + ' ' + position.line + ',' + position.character);
                const info = getHint(document.uri.fsPath, position);
                if (!info || info.kind === '?') {
                    console.log('HKS: hover no info');
                    return null;
                }
                return new vscode.Hover(`**${info.name}**  \`${info.type}\`  \n${info.kind}`);
            }
        })
    );

    // ─── 函数参数提示 ───
    context.subscriptions.push(
        vscode.languages.registerSignatureHelpProvider({ language: 'hkscript' }, {
            provideSignatureHelp(document, position) {
                // 往前找函数调用
                const textBefore = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
                const callMatch = textBefore.match(/(\w+)\s*\([^)]*$/);
                if (!callMatch) return null;

                const info = getHint(document.uri.fsPath, position);
                if (!info || info.kind !== 'function') return null;

                const help = new vscode.SignatureHelp();
                help.signatures = [new vscode.SignatureInformation(
                    `${info.name}(${info.type.match(/\((.*)\)/)?.[1] || ''})`,
                    info.type
                )];
                help.activeSignature = 0;
                help.activeParameter = 0;
                return help;
            }
        }, '(', ',')
    );

    setTimeout(() => {
        console.log('HKS: timeout');
        const ed = vscode.window.activeTextEditor;
        console.log('HKS: editor=' + (ed ? ed.document.uri.fsPath : 'none'));
        if (ed) {
            update(ed);
            try { runDiagnose(ed.document.uri.fsPath, diagnostic); }
            catch (e) { console.log('HKS: diagnose error: ' + e); }
        }
    }, 500);

    interface SymbolInfo {
        name: string; kind: string; type: string;
        line: number; column: number; length: number;
    }

    function getSymbols(filePath: string): SymbolInfo[] | null {
        try {
            const config = vscode.workspace.getConfiguration('hkscript');
            const compilerPath = config.get<string>('compilerPath') || '';
            let cmd: string;
            let args: string[];
            const opts: any = { timeout: 15000, encoding: 'utf-8' as const };

            if (compilerPath) {
                if (compilerPath.endsWith('.dll')) {
                    cmd = 'dotnet';
                    args = [compilerPath, 'code-present', filePath];
                } else {
                    cmd = compilerPath;
                    args = ['code-present', filePath];
                }
            } else {
                const root = findProjectRoot(filePath);
                if (!root) return null;
                cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
                args = ['run', '--', 'code-present', filePath];
                opts.cwd = root;
            }

            const result = cp.spawnSync(cmd, args, opts);
            if (result.status !== 0) return null;
            return JSON.parse(result.stdout) as SymbolInfo[];
        } catch { return null; }
    }

    function findProjectRoot(filePath: string): string | null {
        try {
            let dir = path.dirname(filePath);
            while (dir !== path.dirname(dir)) {
                if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj'))) return dir;
                dir = path.dirname(dir);
            }
        } catch {}
        return null;
    }

    function getHint(filePath: string, pos: vscode.Position): any | null {
        try {
            const config = vscode.workspace.getConfiguration('hkscript');
            const compilerPath = config.get<string>('compilerPath') || '';
            let cmd: string;
            let args: string[];
            const opts: any = { timeout: 15000, encoding: 'utf-8' as const };

            if (compilerPath) {
                if (compilerPath.endsWith('.dll')) {
                    cmd = 'dotnet';
                    args = [compilerPath, 'hint', filePath, String(pos.line + 1), String(pos.character)];
                } else {
                    cmd = compilerPath;
                    args = ['hint', filePath, String(pos.line + 1), String(pos.character)];
                }
            } else {
                const root = findProjectRoot(filePath);
                if (!root) return null;
                cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
                args = ['run', '--', 'hint', filePath, String(pos.line + 1), String(pos.character)];
                opts.cwd = root;
            }

            const result = cp.spawnSync(cmd, args, opts);
            if (result.status !== 0) return null;
            const data = JSON.parse(result.stdout);
            if (!data || data.kind === '?') return null;
            return data;
        } catch { return null; }
    }

    function runDiagnose(filePath: string, collection: vscode.DiagnosticCollection) {
        try {
            const config = vscode.workspace.getConfiguration('hkscript');
            const compilerPath = config.get<string>('compilerPath') || '';
            let cmd: string;
            let args: string[];
            const opts: any = { timeout: 15000, encoding: 'utf-8' as const };

            if (compilerPath) {
                if (compilerPath.endsWith('.dll')) {
                    cmd = 'dotnet';
                    args = [compilerPath, 'diagnose', filePath];
                } else {
                    cmd = compilerPath;
                    args = ['diagnose', filePath];
                }
            } else {
                const root = findProjectRoot(filePath);
                if (!root) return;
                cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
                args = ['run', '--', 'diagnose', filePath];
                opts.cwd = root;
            }

            const result = cp.spawnSync(cmd, args, opts);
            if (result.status !== 0) {
                console.log('HKS: diagnose exit=' + result.status + ' stderr=' + (result.stderr || '').substring(0, 200));
                return;
            }

            const errors: any[] = JSON.parse(result.stdout);
            if (!errors || errors.length === 0) {
                collection.set(vscode.Uri.file(filePath), []);
                return;
            }

            const uri = vscode.Uri.file(filePath);
            const diags: vscode.Diagnostic[] = [];

            for (const err of errors) {
                const line = Math.max(0, (err.line || 1) - 1);
                const range = new vscode.Range(line, 0, line, 1000);
                diags.push(new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error));
            }

            collection.set(uri, diags);
            console.log('HKS: diagnose set ' + diags.length + ' errors');
        } catch (e) {
            console.log('HKS: diagnose error: ' + String(e));
        }
    }
}
