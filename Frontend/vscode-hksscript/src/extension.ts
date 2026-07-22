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

        // ─── 编译前端符号 ───

        const symbols = getSymbols(uri);
        const fnPositions = new Set<number>();
        const vaPositions = new Set<number>();

        if (symbols) {
            for (const sym of symbols) {
                const off = editor.document.offsetAt(new vscode.Position(sym.line - 1, sym.column));
                if (sym.kind === 'function') {
                    fnPositions.add(off);
                    fnR.push(new vscode.Range(
                        editor.document.positionAt(off),
                        editor.document.positionAt(off + sym.length)
                    ));
                } else if (sym.kind === 'variable') {
                    vaPositions.add(off);
                    vaR.push(new vscode.Range(
                        editor.document.positionAt(off),
                        editor.document.positionAt(off + sym.length)
                    ));
                }
            }
        }

        // ─── 正则补充（不覆盖编译前端符号） ───

        function isCovered(pos: number): boolean {
            return fnPositions.has(pos) || vaPositions.has(pos);
        }

        // strings
        const strRe = /"(\\.|[^"\\])*"/g;
        while ((m = strRe.exec(text)) !== null)
            stR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));

        // comments
        const comRe = /#[^\n]*/g;
        while ((m = comRe.exec(text)) !== null)
            coR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));

        // numbers
        const numRe = /\b\d+(\.\d+)?\b/g;
        while ((m = numRe.exec(text)) !== null) {
            if (isCovered(m.index)) continue;
            nuR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }

        // keywords (always, compiler doesn't provide these)
        for (const w of ['import','def','if','elif','else','return','query','from','with','and','or','not','true','false']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                kwR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }

        // types (always)
        for (const w of ['int','float','string','bool','Mat','Set','Circle','Range','void']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                tpR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }

        // 如果编译前端不可用，用正则兜底
        if (!symbols || symbols.length === 0) {
            // builtin functions
            for (const w of ['load','save','print','len','range']) {
                const re = new RegExp('\\b' + w + '\\b', 'g');
                while ((m = re.exec(text)) !== null)
                    fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
            // function calls
            const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
            while ((m = callRe.exec(text)) !== null) {
                const kws = new Set(['import','def','if','elif','else','return','query','from','with','and','or','not','true','false',
                                     'int','float','string','bool','Mat','Set','Circle','Range','void']);
                if (kws.has(m[1])) continue;
                fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[1].length)));
            }
            // variables fallback
            const varRe = /\b[a-zA-Z_]\w*\b/g;
            const skip = new Set(['import','def','if','elif','else','return','query','from','with','and','or','not','true','false',
                                 'int','float','string','bool','Mat','Set','Circle','Range','void',
                                 'load','save','print','len','range']);
            while ((m = varRe.exec(text)) !== null) {
                if (skip.has(m[0])) continue;
                if (text.substring(m.index + m[0].length).trimStart().startsWith('(')) continue;
                vaR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
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
            if (doc.languageId === 'hkscript') {
                symbolCache = null; // 清除缓存
                const editor = vscode.window.activeTextEditor;
                if (editor?.document === doc) update(editor);
            }
        }),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document)
                update(vscode.window.activeTextEditor);
        })
    );

    setTimeout(() => update(vscode.window.activeTextEditor), 500);
}

// ─── 调用编译前端 ───

interface SymbolInfo {
    name: string; kind: string; type: string;
    line: number; column: number; length: number;
}

let symbolCache: { path: string; symbols: SymbolInfo[] } | null = null;

function getSymbols(filePath: string): SymbolInfo[] | null {
    const projectRoot = findProjectRoot(filePath);
    if (!projectRoot) return null;

    // 缓存同名文件
    if (symbolCache?.path === filePath) return symbolCache.symbols;

    try {
        const cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
        const result = cp.spawnSync(cmd, ['run', '--', 'code-present', filePath], {
            cwd: projectRoot,
            timeout: 10000,
            encoding: 'utf-8'
        });
        if (result.status !== 0) return null;
        const symbols = JSON.parse(result.stdout) as SymbolInfo[];
        symbolCache = { path: filePath, symbols };
        return symbols;
    } catch {
        return null;
    }
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
