import * as vscode from 'vscode';

const keywordColor   = { backgroundColor: 'rgba(203,166,247,0.2)', fontWeight: 'bold' as const };
const typeColor      = { backgroundColor: 'rgba(166,227,161,0.2)' };
const functionColor  = { backgroundColor: 'rgba(249,226,175,0.2)' };
const commentColor   = { backgroundColor: 'rgba(108,112,134,0.2)', fontStyle: 'italic' as const };
const stringColor    = { backgroundColor: 'rgba(137,180,250,0.2)' };
const numberColor    = { backgroundColor: 'rgba(250,179,135,0.2)' };

let decKeyword: vscode.TextEditorDecorationType;
let decType: vscode.TextEditorDecorationType;
let decFunc: vscode.TextEditorDecorationType;
let decComment: vscode.TextEditorDecorationType;
let decString: vscode.TextEditorDecorationType;
let decNumber: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    console.log('HKS: activate');

    // 状态栏
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);
    console.log('HKS: status bar created');

    // 装饰器
    decKeyword = vscode.window.createTextEditorDecorationType({ ...keywordColor });
    decType    = vscode.window.createTextEditorDecorationType({ ...typeColor });
    decFunc    = vscode.window.createTextEditorDecorationType({ ...functionColor });
    decComment = vscode.window.createTextEditorDecorationType({ ...commentColor });
    decString  = vscode.window.createTextEditorDecorationType({ ...stringColor });
    decNumber  = vscode.window.createTextEditorDecorationType({ ...numberColor });
    context.subscriptions.push(decKeyword, decType, decFunc, decComment, decString, decNumber);
    console.log('HKS: decorations created');

    const update = (editor: vscode.TextEditor | undefined) => {
        if (!editor) return;
        console.log('HKS: update lang=' + editor.document.languageId);
        if (editor.document.languageId !== 'hkscript') return;
        console.log('HKS: about to call highlight');
        doHighlight(editor);
    };

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(update),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor?.document === e.document)
                doHighlight(vscode.window.activeTextEditor);
        })
    );
    console.log('HKS: listeners registered');

    // 延迟执行，等编辑器就绪
    setTimeout(() => {
        console.log('HKS: timeout fired, editor=' + (vscode.window.activeTextEditor ? 'yes' : 'no'));
        update(vscode.window.activeTextEditor);
    }, 1000);
}

function doHighlight(editor: vscode.TextEditor) {
    console.log('HKS: doHighlight start');
    const text = editor.document.getText();
    console.log('HKS: text length=' + text.length);
    const kw: vscode.Range[] = [];
    const tp: vscode.Range[] = [];
    const fn: vscode.Range[] = [];
    const co: vscode.Range[] = [];
    const st: vscode.Range[] = [];
    const nu: vscode.Range[] = [];

    // 先标记字符串区域
    const strRanges: { start: number; end: number }[] = [];
    const strRe = /"(\\.|[^"\\])*"/g;
    let m: RegExpExecArray | null;
    while ((m = strRe.exec(text)) !== null) {
        strRanges.push({ start: m.index, end: m.index + m[0].length });
        st.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
    }
    console.log('HKS: strings=' + st.length);
    const inStr = (pos: number) => strRanges.some(r => pos >= r.start && pos < r.end);

    // 注释
    const commentRe = /#[^\n]*/g;
    while ((m = commentRe.exec(text)) !== null) {
        co.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
    }
    console.log('HKS: comments=' + co.length);

    // 数字
    const numRe = /\b\d+(\.\d+)?\b/g;
    while ((m = numRe.exec(text)) !== null) {
        if (!inStr(m.index)) nu.push(posRange(editor, m.index, m[0].length));
    }
    console.log('HKS: numbers=' + nu.length);

    // 关键字
    const kws = ['import','def','if','elif','else','return','query','from','with','and','or','not','true','false'];
    for (const kwName of kws) {
        const re = new RegExp('\\b' + kwName + '\\b', 'g');
        while ((m = re.exec(text)) !== null) { if (!inStr(m.index)) kw.push(posRange(editor, m.index, m[0].length)); }
    }
    console.log('HKS: keywords=' + kw.length);

    // 类型名
    const typeNames = ['int','float','string','bool','Mat','Set','Circle','Range','void'];
    for (const tn of typeNames) {
        const re = new RegExp('\\b' + tn + '\\b', 'g');
        while ((m = re.exec(text)) !== null) { if (!inStr(m.index)) tp.push(posRange(editor, m.index, m[0].length)); }
    }
    console.log('HKS: types=' + tp.length);

    // 内置函数
    const builtins = ['load','save','print','len','range'];
    for (const built of builtins) {
        const re = new RegExp('\\b' + built + '\\b', 'g');
        while ((m = re.exec(text)) !== null) { if (!inStr(m.index)) fn.push(posRange(editor, m.index, m[0].length)); }
    }

    // 函数调用
    const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
    while ((m = callRe.exec(text)) !== null) {
        if (inStr(m.index)) continue;
        const name = m[1];
        if (kws.includes(name) || typeNames.includes(name) || builtins.includes(name)) continue;
        fn.push(posRange(editor, m.index, name.length));
    }
    console.log('HKS: functions=' + fn.length);

    console.log('HKS: setting decorations');
    editor.setDecorations(decKeyword, kw);
    editor.setDecorations(decType, tp);
    editor.setDecorations(decFunc, fn);
    editor.setDecorations(decComment, co);
    editor.setDecorations(decString, st);
    editor.setDecorations(decNumber, nu);
    console.log('HKS: done');
}

function posRange(editor: vscode.TextEditor, offset: number, length: number): vscode.Range {
    return new vscode.Range(editor.document.positionAt(offset), editor.document.positionAt(offset + length));
}
