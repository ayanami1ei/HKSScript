"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
function activate(context) {
    // 调试：在状态栏显示扩展已激活
    const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusItem.text = "$(symbol-color) HKS";
    statusItem.tooltip = "HKS Script 扩展已激活";
    statusItem.show();
    context.subscriptions.push(statusItem);
    // 调试命令：检查语义高亮
    context.subscriptions.push(vscode.commands.registerCommand('hkscript.debugTokens', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const tokens = editor.document.getText();
        vscode.window.showInformationMessage(`HKS: 文档 ${tokens.length} 字符`);
    }));
    // 语义高亮提供器
    const legend = new vscode.SemanticTokensLegend(['function', 'variable', 'type', 'keyword'], ['declaration']);
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'hkscript' }, new HkscriptSemanticTokensProvider(legend), legend));
    // 调试：输出激活信息
    console.log('HKS Script 扩展已激活');
    console.error('HKS Script 错误日志测试');
}
class HkscriptSemanticTokensProvider {
    constructor(legend) {
        this.legend = legend;
    }
    provideDocumentSemanticTokens(document) {
        const text = document.getText();
        const lines = text.split('\n');
        const data = [];
        let prevLine = 0;
        let prevChar = 0;
        function push(line, char, len, type, mod) {
            data.push(line - prevLine);
            data.push(line === prevLine ? char - prevChar : char);
            data.push(len);
            data.push(type);
            data.push(mod);
            prevLine = line;
            prevChar = char;
        }
        const keywords = new Set(['import', 'def', 'if', 'elif', 'else', 'return', 'query', 'from', 'with', 'and', 'or', 'not', 'true', 'false']);
        const typeNames = new Set(['int', 'float', 'string', 'bool', 'Mat', 'Set', 'Circle', 'Range', 'void']);
        const builtins = new Set(['load', 'save', 'print', 'len', 'range']);
        for (let line = 0; line < lines.length; line++) {
            const l = lines[line];
            // 关键字 → type 3 (keyword)
            for (const kw of keywords) {
                const re = new RegExp('\\b' + kw + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 3, 0);
            }
            // 类型名 → type 2 (type)
            for (const t of typeNames) {
                const re = new RegExp('\\b' + t + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 2, 0);
            }
            // 内置函数 → type 0 (function)
            for (const fn of builtins) {
                const re = new RegExp('\\b' + fn + '\\b', 'g');
                let m;
                while ((m = re.exec(l)) !== null)
                    push(line, m.index, m[0].length, 0, 0);
            }
            // 函数调用: word + '(' → type 0 (function)
            const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
            let m2;
            while ((m2 = callRe.exec(l)) !== null) {
                const name = m2[1];
                if (keywords.has(name) || typeNames.has(name) || builtins.has(name))
                    continue;
                push(line, m2.index, name.length, 0, 0);
            }
        }
        const result = new vscode.SemanticTokens(new Uint32Array(data));
        console.log(`HKS: 生成了 ${data.length / 5} 个语义token`);
        return result;
    }
}
//# sourceMappingURL=extension.js.map