"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticHighlighter = void 0;
const vscode = require("vscode");
const COLORS = {
    keyword: { color: '#b784e0', fontWeight: 'bold' },
    type: { color: '#7ecf7e' },
    function: { color: '#e8c86a' },
    variable: { color: '#7ab8e0' },
    comment: { color: '#4a8a4a', fontStyle: 'italic' },
    string: { color: '#6aa8e0' },
    number: { color: '#e09860' },
};
class SemanticHighlighter {
    constructor(context) {
        this.decKeyword = vscode.window.createTextEditorDecorationType(COLORS.keyword);
        this.decType = vscode.window.createTextEditorDecorationType(COLORS.type);
        this.decFunc = vscode.window.createTextEditorDecorationType(COLORS.function);
        this.decVar = vscode.window.createTextEditorDecorationType(COLORS.variable);
        this.decComment = vscode.window.createTextEditorDecorationType(COLORS.comment);
        this.decString = vscode.window.createTextEditorDecorationType(COLORS.string);
        this.decNumber = vscode.window.createTextEditorDecorationType(COLORS.number);
        context.subscriptions.push(this.decKeyword, this.decType, this.decFunc, this.decVar, this.decComment, this.decString, this.decNumber);
    }
    update(editor) {
        const text = editor.document.getText();
        const posAt = (offset) => editor.document.positionAt(offset);
        const kwR = [];
        const tpR = [];
        const fnR = [];
        const vaR = [];
        const coR = [];
        const stR = [];
        const nuR = [];
        let m;
        // strings
        const strRe = /"(\\.|[^"\\])*"/g;
        while ((m = strRe.exec(text)) !== null)
            stR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        // comments
        const comRe = /#[^\n]*/g;
        while ((m = comRe.exec(text)) !== null)
            coR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        // numbers
        const numRe = /\b\d+(\.\d+)?\b/g;
        while ((m = numRe.exec(text)) !== null)
            nuR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        // keywords
        for (const w of ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                kwR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        }
        // types
        for (const w of ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                tpR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        }
        // builtins
        for (const w of ['load', 'save', 'print', 'len', 'range', 'imread', 'imwrite', 'gray', 'gaussian_blur', 'median_blur', 'canny', 'erode', 'dilate', 'threshold', 'hough_circles', 'resize', 'find_circles']) {
            const re = new RegExp('\\b' + w + '\\b', 'g');
            while ((m = re.exec(text)) !== null)
                fnR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        }
        // function calls
        const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
        const skip = new Set(['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false',
            'int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void']);
        while ((m = callRe.exec(text)) !== null) {
            if (!skip.has(m[1]))
                fnR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[1].length)));
        }
        // variables
        const varRe = /\b[a-zA-Z_]\w*\b/g;
        const skip2 = new Set([...skip, 'load', 'save', 'print', 'len', 'range', 'imread', 'imwrite', 'gray', 'gaussian_blur', 'median_blur', 'canny', 'erode', 'dilate', 'threshold', 'hough_circles', 'resize', 'find_circles']);
        while ((m = varRe.exec(text)) !== null) {
            if (!skip2.has(m[0]) && !text.substring(m.index + m[0].length).trimStart().startsWith('('))
                vaR.push(new vscode.Range(posAt(m.index), posAt(m.index + m[0].length)));
        }
        editor.setDecorations(this.decKeyword, kwR);
        editor.setDecorations(this.decType, tpR);
        editor.setDecorations(this.decFunc, fnR);
        editor.setDecorations(this.decVar, vaR);
        editor.setDecorations(this.decComment, coR);
        editor.setDecorations(this.decString, stR);
        editor.setDecorations(this.decNumber, nuR);
    }
    dispose() {
        this.decKeyword.dispose();
        this.decType.dispose();
        this.decFunc.dispose();
        this.decVar.dispose();
        this.decComment.dispose();
        this.decString.dispose();
        this.decNumber.dispose();
    }
}
exports.SemanticHighlighter = SemanticHighlighter;
//# sourceMappingURL=SemanticHighlighter.js.map