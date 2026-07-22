"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
function activate(context) {
    const provider = new HkscriptSemanticTokensProvider();
    context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'hksscript' }, provider, provider.legend));
}
class HkscriptSemanticTokensProvider {
    constructor() {
        this.legend = new vscode.SemanticTokensLegend(['function', 'variable', 'type', 'keyword'], ['declaration', 'readonly']);
    }
    async provideDocumentSemanticTokens(document, _token) {
        const filePath = document.uri.fsPath;
        // 查找项目根目录（包含 .csproj 的目录）
        const projectRoot = findProjectRoot(filePath);
        if (!projectRoot) {
            return new vscode.SemanticTokens(new Uint32Array(0));
        }
        // 调用 dotnet run -- code-present
        const symbols = await runCodePresent(projectRoot, filePath);
        if (symbols.length === 0) {
            return new vscode.SemanticTokens(new Uint32Array(0));
        }
        const builder = new vscode.SemanticTokensBuilder(this.legend);
        for (const sym of symbols) {
            const line = sym.line - 1; // VS Code 是 0-indexed
            const col = sym.column;
            const len = sym.length;
            let tokenType = 'variable';
            let tokenModifiers = 0;
            if (sym.kind === 'function') {
                tokenType = 'function';
            }
            else if (sym.kind === 'variable') {
                tokenType = 'variable';
            }
            const typeIdx = this.legend.tokenTypes.indexOf(tokenType);
            const modIdx = this.legend.tokenModifiers.indexOf('readonly');
            if (typeIdx >= 0) {
                builder.push(line, col, len, typeIdx, tokenModifiers);
            }
        }
        return builder.build();
    }
}
async function runCodePresent(projectRoot, filePath) {
    return new Promise((resolve, reject) => {
        const cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
        const args = ['run', '--', 'code-present', filePath];
        const child = cp.spawn(cmd, args, { cwd: projectRoot });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => stdout += d.toString());
        child.stderr.on('data', (d) => stderr += d.toString());
        child.on('close', (code) => {
            if (code !== 0) {
                resolve([]);
                return;
            }
            try {
                const data = JSON.parse(stdout);
                resolve(data);
            }
            catch {
                resolve([]);
            }
        });
        child.on('error', () => resolve([]));
    });
}
function findProjectRoot(filePath) {
    let dir = path.dirname(filePath);
    while (dir !== path.dirname(dir)) {
        if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return null;
}
//# sourceMappingURL=extension.js.map