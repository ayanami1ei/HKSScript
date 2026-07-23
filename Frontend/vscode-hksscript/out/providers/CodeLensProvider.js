"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunCodeLensProvider = void 0;
exports.registerRunCommand = registerRunCommand;
const vscode = require("vscode");
class RunCodeLensProvider {
    constructor(compiler) {
        this.compiler = compiler;
    }
    provideCodeLenses() {
        const runCmd = {
            title: '▶ Run',
            command: 'hkscript.runScript',
            tooltip: '执行此脚本'
        };
        return [new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), runCmd)];
    }
}
exports.RunCodeLensProvider = RunCodeLensProvider;
function registerRunCommand(context, compiler) {
    context.subscriptions.push(vscode.commands.registerCommand('hkscript.runScript', (filePath) => {
        const editor = vscode.window.activeTextEditor;
        const target = filePath || editor?.document.uri.fsPath;
        if (!target)
            return;
        const compilerPath = compiler.getCompilerPath();
        const term = vscode.window.createTerminal('HKS Script');
        term.show();
        if (compilerPath) {
            const exe = compilerPath.endsWith('.dll') ? `dotnet exec "${compilerPath}"` : `"${compilerPath}"`;
            term.sendText(`${exe} run "${target}"`);
        }
        else {
            term.sendText(`hks run "${target}"`);
        }
    }));
}
//# sourceMappingURL=CodeLensProvider.js.map