"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    console.log('HKS: activate');
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);
    function update(editor) {
        if (!editor)
            return;
        console.log('HKS: update, lang=' + editor.document.languageId);
        const text = editor.document.getText();
        const kwR = [];
        const tpR = [];
        const fnR = [];
        const coR = [];
        const stR = [];
        const nuR = [];
        let m;
        // strings
        while ((m = /"(\\.|[^"\\])*"/g.exec(text)) !== null)
            stR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // comments
        while ((m = /#[^\n]*/g.exec(text)) !== null)
            coR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // numbers
        while ((m = /\b\d+(\.\d+)?\b/g.exec(text)) !== null)
            nuR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // keywords
        for (const w of ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                kwR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // types
        for (const w of ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                tpR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // functions
        for (const w of ['load', 'save', 'print', 'len', 'range'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
        // function calls: word + (
        while ((m = /\b([a-zA-Z_]\w*)\s*\(/g.exec(text)) !== null)
            fnR.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[1].length)));
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(203,166,247,0.3)', isWholeLine: true }), kwR);
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(166,227,161,0.3)', isWholeLine: true }), tpR);
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(249,226,175,0.3)', isWholeLine: true }), fnR);
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(108,112,134,0.3)', isWholeLine: true }), coR);
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(137,180,250,0.3)', isWholeLine: true }), stR);
        editor.setDecorations(vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(250,179,135,0.3)', isWholeLine: true }), nuR);
        console.log('HKS: done');
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor?.document === e.document)
            update(vscode.window.activeTextEditor);
    }));
    setTimeout(() => update(vscode.window.activeTextEditor), 500);
}
//# sourceMappingURL=extension.js.map