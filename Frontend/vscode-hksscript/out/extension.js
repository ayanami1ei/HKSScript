"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
// 模块作用域，不会被GC
const kwColor = { color: '#b784e0', fontWeight: 'bold' };
const tpColor = { color: '#7ecf7e' };
const fnColor = { color: '#e8c86a' };
const vaColor = { color: '#7ab8e0' };
const coColor = { color: '#4a8a4a', fontStyle: 'italic' };
const stColor = { color: '#6aa8e0' };
const nuColor = { color: '#e09860' };
let kwDec;
let tpDec;
let fnDec;
let vaDec;
let coDec;
let stDec;
let nuDec;
function activate(context) {
    console.log('HKS: activate');
    kwDec = vscode.window.createTextEditorDecorationType(kwColor);
    tpDec = vscode.window.createTextEditorDecorationType(tpColor);
    fnDec = vscode.window.createTextEditorDecorationType(fnColor);
    vaDec = vscode.window.createTextEditorDecorationType(vaColor);
    coDec = vscode.window.createTextEditorDecorationType(coColor);
    stDec = vscode.window.createTextEditorDecorationType(stColor);
    nuDec = vscode.window.createTextEditorDecorationType(nuColor);
    context.subscriptions.push(kwDec, tpDec, fnDec, coDec, stDec, nuDec, vaDec);
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);
    function update(editor) {
        if (!editor) {
            console.log('HKS: no editor');
            return;
        }
        const text = editor.document.getText();
        const kwR = [];
        const tpR = [];
        const fnR = [];
        const vaR = [];
        const coR = [];
        const stR = [];
        const nuR = [];
        let m;
        const strRe = /"(\\.|[^"\\])*"/g;
        while ((m = strRe.exec(text)) !== null)
            stR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        const comRe = /#[^\n]*/g;
        while ((m = comRe.exec(text)) !== null)
            coR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        const numRe = /\b\d+(\.\d+)?\b/g;
        while ((m = numRe.exec(text)) !== null)
            nuR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // keywords
        for (const w of ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                kwR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }
        // types
        for (const w of ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                tpR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }
        // functions
        for (const w of ['load', 'save', 'print', 'len', 'range']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        }
        // function calls: word + (
        const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
        while ((m = callRe.exec(text)) !== null)
            fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[1].length)));
        // variables: standalone words not matched above
        const varRe = /\b[a-zA-Z_]\w*\b/g;
        const kws = new Set(['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false',
            'int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void',
            'load', 'save', 'print', 'len', 'range']);
        while ((m = varRe.exec(text)) !== null) {
            const w = m[0];
            if (kws.has(w))
                continue;
            // check if this position is already colored as function
            const pos = m.index;
            const after = text.substring(pos + w.length).trimStart();
            if (after.startsWith('('))
                continue; // function call
            vaR.push(new vscode.Range(editor.document.positionAt(pos), editor.document.positionAt(pos + w.length)));
        }
        editor.setDecorations(kwDec, kwR);
        editor.setDecorations(tpDec, tpR);
        editor.setDecorations(fnDec, fnR);
        editor.setDecorations(vaDec, vaR);
        editor.setDecorations(coDec, coR);
        editor.setDecorations(stDec, stR);
        editor.setDecorations(nuDec, nuR);
        console.log('HKS: ' + (kwR.length + tpR.length + fnR.length + coR.length + stR.length + nuR.length) + ' ranges');
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor?.document === e.document)
            update(vscode.window.activeTextEditor);
    }));
    setTimeout(() => update(vscode.window.activeTextEditor), 500);
}
//# sourceMappingURL=extension.js.map