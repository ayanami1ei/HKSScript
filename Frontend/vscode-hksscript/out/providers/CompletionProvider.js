"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionProvider = void 0;
const vscode = require("vscode");
class CompletionProvider {
    constructor(compiler) {
        this.compiler = compiler;
    }
    async provideCompletionItems(document, position) {
        const items = this.compiler.getCompletions(document.uri.fsPath);
        if (!items)
            return [];
        return items.map((item) => {
            const ci = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Function);
            ci.detail = item.detail;
            ci.insertText = item.label;
            return ci;
        });
    }
}
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=CompletionProvider.js.map