"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const keywordColor = { color: '#cba6f7', fontWeight: 'bold' };
const typeColor = { color: '#a6e3a1' };
const functionColor = { color: '#f9e2af' };
const commentColor = { color: '#6c7086', fontStyle: 'italic' };
const stringColor = { color: '#89b4fa' };
const numberColor = { color: '#fab387' };
let decKeyword;
let decType;
let decFunc;
let decComment;
let decString;
let decNumber;
function activate(context) {
    decKeyword = vscode.window.createTextEditorDecorationType({ ...keywordColor });
    decType = vscode.window.createTextEditorDecorationType({ ...typeColor });
    decFunc = vscode.window.createTextEditorDecorationType({ ...functionColor });
    decComment = vscode.window.createTextEditorDecorationType({ ...commentColor });
    decString = vscode.window.createTextEditorDecorationType({ ...stringColor });
    decNumber = vscode.window.createTextEditorDecorationType({ ...numberColor });
    context.subscriptions.push(decKeyword, decType, decFunc, decComment, decString, decNumber);
    const update = (editor) => {
        if (!editor || editor.document.languageId !== 'hkscript')
            return;
        highlight(editor);
    };
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.workspace.onDidChangeTextDocument(e => {
        if (vscode.window.activeTextEditor?.document === e.document)
            highlight(vscode.window.activeTextEditor);
    }));
    // 推迟执行，等待编辑器就绪
    setTimeout(() => update(vscode.window.activeTextEditor), 500);
}
function highlight(editor) {
    const text = editor.document.getText();
    const kw = [];
    const tp = [];
    const fn = [];
    const co = [];
    const st = [];
    const nu = [];
    // 字符串区域，避免内部匹配
    const strRanges = [];
    const strRe = /"(\\.|[^"\\])*"/g;
    let m;
    while ((m = strRe.exec(text)) !== null) {
        strRanges.push({ start: m.index, end: m.index + m[0].length });
        st.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
    }
    const inStr = (pos) => strRanges.some(r => pos >= r.start && pos < r.end);
    // 注释
    const commentRe = /#[^\n]*/g;
    while ((m = commentRe.exec(text)) !== null) {
        co.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
    }
    // 数字
    const numRe = /\b\d+(\.\d+)?\b/g;
    while ((m = numRe.exec(text)) !== null) {
        if (!inStr(m.index))
            nu.push(posRange(editor, m.index, m[0].length));
    }
    // 关键字
    const kws = ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false'];
    for (const kwName of kws) {
        const re = new RegExp('\\b' + kwName + '\\b', 'g');
        while ((m = re.exec(text)) !== null) {
            if (!inStr(m.index))
                kw.push(posRange(editor, m.index, m[0].length));
        }
    }
    // 类型名
    const typeNames = ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void'];
    for (const tn of typeNames) {
        const re = new RegExp('\\b' + tn + '\\b', 'g');
        while ((m = re.exec(text)) !== null) {
            if (!inStr(m.index))
                tp.push(posRange(editor, m.index, m[0].length));
        }
    }
    // 内置函数
    const builtins = ['load', 'save', 'print', 'len', 'range'];
    for (const built of builtins) {
        const re = new RegExp('\\b' + built + '\\b', 'g');
        while ((m = re.exec(text)) !== null) {
            if (!inStr(m.index))
                fn.push(posRange(editor, m.index, m[0].length));
        }
    }
    // 函数调用: word + '('
    const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
    while ((m = callRe.exec(text)) !== null) {
        if (inStr(m.index))
            continue;
        const name = m[1];
        if (kws.includes(name) || typeNames.includes(name) || builtins.includes(name))
            continue;
        fn.push(posRange(editor, m.index, name.length));
    }
    editor.setDecorations(decKeyword, kw);
    editor.setDecorations(decType, tp);
    editor.setDecorations(decFunc, fn);
    editor.setDecorations(decComment, co);
    editor.setDecorations(decString, st);
    editor.setDecorations(decNumber, nu);
}
function posRange(editor, offset, length) {
    return new vscode.Range(editor.document.positionAt(offset), editor.document.positionAt(offset + length));
}
//# sourceMappingURL=extension.js.map