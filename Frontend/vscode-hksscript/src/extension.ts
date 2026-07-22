import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('HKS: activate() called');

    const dec = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255,0,0,0.3)'
    });
    context.subscriptions.push(dec);

    function update(editor: vscode.TextEditor | undefined) {
        if (!editor) { console.log('HKS: no editor'); return; }
        console.log('HKS: editor lang=' + editor.document.languageId + ' uri=' + editor.document.uri.toString());
        if (editor.document.languageId !== 'hkscript') return;
        try {
            const line = editor.document.lineAt(0);
            console.log('HKS: line 0 text=' + line.text.substring(0, 20));
            editor.setDecorations(dec, [line.range]);
            console.log('HKS: decoration applied');
        } catch (e) {
            console.log('HKS: ERROR: ' + String(e));
            console.log('HKS: stack: ' + (e instanceof Error ? e.stack : 'none'));
        }
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document) update(vscode.window.activeTextEditor);
        })
    );

    console.log('HKS: handlers registered');
    console.log('HKS: current editor=' + (vscode.window.activeTextEditor ? 'yes' : 'no'));
    if (vscode.window.activeTextEditor) update(vscode.window.activeTextEditor);
}
