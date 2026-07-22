"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    console.log('HKS: activate() called');
    const dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.3)'
    });
    context.subscriptions.push(dec);
    function update(editor) {
        if (!editor) {
            console.log('HKS: no editor');
            return;
        }
        console.log('HKS: editor lang=' + editor.document.languageId + ' uri=' + editor.document.uri.toString());
        if (editor.document.languageId !== 'hkscript')
            return;
        const line = editor.document.lineAt(0);
        console.log('HKS: applying decoration to line 0');
        editor.setDecorations(dec, [new vscode.Range(line.range.start, line.range.end)]);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor?.document === e.document)
            update(vscode.window.activeTextEditor);
    }));
    console.log('HKS: handlers registered');
    console.log('HKS: current editor=' + (vscode.window.activeTextEditor ? 'yes' : 'no'));
    if (vscode.window.activeTextEditor)
        update(vscode.window.activeTextEditor);
}
//# sourceMappingURL=extension.js.map