"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    const provider = new HkscriptSemanticTokensProvider();
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'hkscript' }, provider, provider.legend));
}
class HkscriptSemanticTokensProvider {
    constructor() {
        this.legend = new vscode.SemanticTokensLegend(['function', 'variable', 'type', 'keyword'], ['declaration', 'modification']);
    }
    provideDocumentSemanticTokens(document) {
        const text = document.getText();
        const lines = text.split('\n');
        const tokens = [];
        let prevLine = 0;
        let prevChar = 0;
        function push(line, char, len, type, mod) {
            tokens.push(line - prevLine);
            tokens.push(line === prevLine ? char - prevChar : char);
            tokens.push(len);
            tokens.push(type);
            tokens.push(mod);
            prevLine = line;
            prevChar = char;
        }
        for (let line = 0; line < lines.length; line++) {
            const l = lines[line];
            // keyword
            for (const kw of ['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false']) {
                const re = new RegExp('\\b' + kw + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 3, 0);
            }
            // type
            for (const t of ['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void']) {
                const re = new RegExp('\\b' + t + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 2, 0);
            }
            // builtin function
            for (const fn of ['load', 'save', 'print', 'len', 'range']) {
                const re = new RegExp('\\b' + fn + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 0, 0);
            }
            // function call: ID + '('
            const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
            let m2;
            while ((m2 = callRe.exec(l)) !== null) {
                const name = m2[1];
                if (['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false'].includes(name))
                    continue;
                if (['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void'].includes(name))
                    continue;
                push(line, m2.index, name.length, 0, 0);
            }
        }
        return new vscode.SemanticTokens(new Uint32Array(tokens));
    }
}
//# sourceMappingURL=extension.js.map