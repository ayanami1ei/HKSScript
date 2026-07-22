import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('HKS: activate() called');

    // 最简单的测试：把第一行涂成红色
    const dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.3)'
    });
    context.subscriptions.push(dec);

    function update(editor: vscode.TextEditor | undefined) {
        if (!editor || editor.document.languageId !== 'hkscript') return;
        const line = editor.document.lineAt(0);
        editor.setDecorations(dec, [new vscode.Range(line.range.start, line.range.end)]);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document) update(vscode.window.activeTextEditor);
        })
    );

    if (vscode.window.activeTextEditor) update(vscode.window.activeTextEditor);
}
