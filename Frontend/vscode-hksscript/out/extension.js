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
function activate(context) {
    // 装饰类型
    const decKeyword = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...keywordColor });
    const decType = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...typeColor });
    const decFunc = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...functionColor });
    const decComment = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...commentColor });
    const decString = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...stringColor });
    const decNumber = vscode.window.createTextEditorDecorationType({ rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed, ...numberColor });
    context.subscriptions.push(decKeyword, decType, decFunc, decComment, decString, decNumber);
    function update(editor) {
        if (!editor || editor.document.languageId !== 'hkscript')
            return;
        const text = editor.document.getText();
        const kwRanges = [];
        const typeRanges = [];
        const funcRanges = [];
        const commentRanges = [];
        const stringRanges = [];
        const numRanges = [];
        const keywords = ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false'];
        const typeNames = ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void'];
        const builtins = ['load', 'save', 'print', 'len', 'range'];
        // 先标记字符串区域，避免内部匹配
        const stringRegions = [];
        const strRe = /"(\\.|[^"\\])*"/g;
        let sm;
        while ((sm = strRe.exec(text)) !== null) {
            stringRegions.push({ start: sm.index, end: sm.index + sm[0].length });
            stringRanges.push(new vscode.Range(editor.document.positionAt(sm.index), editor.document.positionAt(sm.index + sm[0].length)));
        }
        function isInString(pos) {
            return stringRegions.some(r => pos >= r.start && pos < r.end);
        }
        // 注释
        const commentRe = /#[^\n]*|\(\*[\s\S]*?\*\)/g;
        let cm;
        while ((cm = commentRe.exec(text)) !== null) {
            commentRanges.push(new vscode.Range(editor.document.positionAt(cm.index), editor.document.positionAt(cm.index + cm[0].length)));
        }
        // 数字
        const numRe = /\b\d+(\.\d+)?\b/g;
        let nm;
        while ((nm = numRe.exec(text)) !== null) {
            if (isInString(nm.index))
                continue;
            numRanges.push(new vscode.Range(editor.document.positionAt(nm.index), editor.document.positionAt(nm.index + nm[0].length)));
        }
        // 关键字
        for (const kw of keywords) {
            const re = new RegExp('\\b' + kw + '\\b', 'g');
            let m;
            while ((m = re.exec(text)) !== null) {
                if (isInString(m.index))
                    continue;
                kwRanges.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
        }
        // 类型
        for (const t of typeNames) {
            const re = new RegExp('\\b' + t + '\\b', 'g');
            let m;
            while ((m = re.exec(text)) !== null) {
                if (isInString(m.index))
                    continue;
                typeRanges.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
        }
        // 内置函数
        for (const fn of builtins) {
            const re = new RegExp('\\b' + fn + '\\b', 'g');
            let m;
            while ((m = re.exec(text)) !== null) {
                if (isInString(m.index))
                    continue;
                funcRanges.push(new vscode.Range(editor.document.positionAt(m.index), editor.document.positionAt(m.index + m[0].length)));
            }
        }
        // 函数调用: word + '('
        const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
        let m2;
        while ((m2 = callRe.exec(text)) !== null) {
            const name = m2[1];
            if (keywords.includes(name) || typeNames.includes(name) || builtins.includes(name))
                continue;
            if (isInString(m2.index))
                continue;
            funcRanges.push(new vscode.Range(editor.document.positionAt(m2.index), editor.document.positionAt(m2.index + name.length)));
        }
        editor.setDecorations(decKeyword, kwRanges);
        editor.setDecorations(decType, typeRanges);
        editor.setDecorations(decFunc, funcRanges);
        editor.setDecorations(decComment, commentRanges);
        editor.setDecorations(decString, stringRanges);
        editor.setDecorations(decNumber, numRanges);
    }
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(update), vscode.workspace.onDidChangeTextDocument(e => {
        const editor = vscode.window.activeTextEditor;
        if (editor && e.document === editor.document)
            update(editor);
    }));
    // 初始更新
    if (vscode.window.activeTextEditor)
        update(vscode.window.activeTextEditor);
}
//# sourceMappingURL=extension.js.map