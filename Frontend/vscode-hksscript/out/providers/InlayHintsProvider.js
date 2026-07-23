"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlayHintsProvider = void 0;
const vscode = require("vscode");
class InlayHintsProvider {
    constructor(compiler) {
        this.compiler = compiler;
    }
    provideInlayHints(document, _range) {
        const map = this.compiler.getSymbols(document.uri.fsPath);
        if (!map)
            return [];
        const hints = [];
        for (const sym of map) {
            if (sym.kind !== 'variable')
                continue;
            const lineText = document.lineAt(sym.line - 1).text;
            if (lineText.substring(sym.column + sym.length).trim().startsWith(':'))
                continue;
            const hint = new vscode.InlayHint(new vscode.Position(sym.line - 1, sym.column + sym.length), `: ${sym.type}`, vscode.InlayHintKind.Type);
            hints.push(hint);
        }
        return hints;
    }
}
exports.InlayHintsProvider = InlayHintsProvider;
//# sourceMappingURL=InlayHintsProvider.js.map