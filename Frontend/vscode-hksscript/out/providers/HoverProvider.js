"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverProvider = void 0;
const vscode = require("vscode");
class HoverProvider {
    constructor(compiler) {
        this.compiler = compiler;
    }
    provideHover(document, position) {
        const info = this.compiler.getHint(document.uri.fsPath, position.line + 1, position.character);
        if (!info || info.kind === '?')
            return null;
        return new vscode.Hover(`**${info.name}**  \`${info.type}\`  \n${info.kind}`);
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=HoverProvider.js.map