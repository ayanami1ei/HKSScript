"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
// 模块作用域，不会被GC
let kwDec;
let tpDec;
let fnDec;
let coDec;
let stDec;
let nuDec;
function activate(context) {
    console.log('HKS: activate');
    // 创建装饰器
    kwDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(203,166,247,0.3)' });
    tpDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(166,227,161,0.3)' });
    fnDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(249,226,175,0.3)' });
    coDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(108,112,134,0.3)' });
    stDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(137,180,250,0.3)' });
    nuDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(250,179,135,0.3)' });
    context.subscriptions.push(kwDec, tpDec, fnDec, coDec, stDec, nuDec);
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);
    function update(editor) {
        if (!editor)
            return;
        const text = editor.document.getText();
        const kwR = [];
        const tpR = [];
        const fnR = [];
        const coR = [];
        const stR = [];
        const nuR = [];
        let m;
        while ((m = /"(\\.|[^"\\])*"/g.exec(text)) !== null)
            stR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        while ((m = /#[^\n]*/g.exec(text)) !== null)
            coR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        while ((m = /\b\d+(\.\d+)?\b/g.exec(text)) !== null)
            nuR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        for (const w of ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                kwR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        for (const w of ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                tpR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        for (const w of ['load', 'save', 'print', 'len', 'range'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        while ((m = /\b([a-zA-Z_]\w*)\s*\(/g.exec(text)) !== null)
            fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[1].length)));
        editor.setDecorations(kwDec, kwR);
        editor.setDecorations(tpDec, tpR);
        editor.setDecorations(fnDec, fnR);
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