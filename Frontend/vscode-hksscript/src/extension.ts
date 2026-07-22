import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // 状态栏
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);

    // 延迟执行，等编辑器就绪
    setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { console.log('HKS: no editor'); return; }
        console.log('HKS: lang=' + editor.document.languageId);

        // 1. 测试 lineAt
        const line = editor.document.lineAt(0);
        console.log('HKS: first line: "' + line.text.substring(0, 30) + '"');

        // 2. 测试 decoration
        const dec = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255,0,0,0.5)',
            isWholeLine: true
        });
        editor.setDecorations(dec, [line.range]);
        console.log('HKS: decoration set');
        context.subscriptions.push(dec);
    }, 1000);
}
