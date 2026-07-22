import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('HKS: activate');

    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);

    const kwDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(203,166,247,0.3)', isWholeLine: true });
    const tpDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(166,227,161,0.3)', isWholeLine: true });
    const fnDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(249,226,175,0.3)', isWholeLine: true });
    const coDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(108,112,134,0.3)', isWholeLine: true });
    const stDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(137,180,250,0.3)', isWholeLine: true });
    const nuDec = vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(250,179,135,0.3)', isWholeLine: true });
    context.subscriptions.push(kwDec, tpDec, fnDec, coDec, stDec, nuDec);

    function update(editor: vscode.TextEditor | undefined) {
        console.log('HKS: update called, editor=' + (editor ? 'yes' : 'no'));
        if (!editor) return;
        console.log('HKS: lang=|' + editor.document.languageId + '|');
        // 不检查语言，直接尝试高亮

        console.log('HKS: starting highlight');

        try {
            const text = editor.document.getText();
            console.log('HKS: got text len=' + text.length);

            // 简化测试：只涂第一行
            const line = editor.document.lineAt(0);
            const testDec = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(255,0,0,0.3)',
                isWholeLine: true
            });
            editor.setDecorations(testDec, [line.range]);
            context.subscriptions.push(testDec);
            console.log('HKS: test decoration set');
        } catch (e) {
            console.log('HKS: ERROR: ' + String(e));
        }

        const text = editor.document.getText();

        const posAt = (offset: number) => editor.document.positionAt(offset);
        const kw: vscode.Range[] = [];
        const tp: vscode.Range[] = [];
        const fn: vscode.Range[] = [];
        const co: vscode.Range[] = [];
        const st: vscode.Range[] = [];
        const nu: vscode.Range[] = [];

        let m: RegExpExecArray | null;

        // strings
        while ((m = /"(\\.|[^"\\])*"/g.exec(text)) !== null)
            st.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // comments
        while ((m = /#[^\n]*/g.exec(text)) !== null)
            co.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // numbers
        while ((m = /\b\d+(\.\d+)?\b/g.exec(text)) !== null)
            nu.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // keywords
        for (const w of ['import','def','if','elif','else','return','query','from','with','and','or','not','true','false'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                kw.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // types
        for (const w of ['int','float','string','bool','Mat','Set','Circle','Range','void'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                tp.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // functions
        for (const w of ['load','save','print','len','range'])
            while ((m = new RegExp('\\b' + w + '\\b', 'g').exec(text)) !== null)
                fn.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));

        // function calls: word + (
        while ((m = /\b([a-zA-Z_]\w*)\s*\(/g.exec(text)) !== null)
            fn.push(new vscode.Range(posAt(m.index), posAt(m.index + m[1].length)));

        editor.setDecorations(kwDec, kw);
        editor.setDecorations(tpDec, tp);
        editor.setDecorations(fnDec, fn);
        editor.setDecorations(coDec, co);
        editor.setDecorations(stDec, st);
        editor.setDecorations(nuDec, nu);

        console.log('HKS: applied ' + (kw.length + tp.length + fn.length + co.length + st.length + nu.length) + ' ranges');
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document)
                update(vscode.window.activeTextEditor);
        })
    );

    setTimeout(() => update(vscode.window.activeTextEditor), 100);
}
