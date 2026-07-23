import * as vscode from 'vscode';
import { CompilerClient } from '../compiler/CompilerClient';

export class RunCodeLensProvider implements vscode.CodeLensProvider {
    constructor(private compiler: CompilerClient) {}

    provideCodeLenses(): vscode.CodeLens[] {
        const runCmd: vscode.Command = {
            title: '▶ Run',
            command: 'hkscript.runScript',
            tooltip: '执行此脚本'
        };
        return [new vscode.CodeLens(new vscode.Range(0, 0, 0, 0), runCmd)];
    }
}

export function registerRunCommand(context: vscode.ExtensionContext, compiler: CompilerClient) {
    context.subscriptions.push(
        vscode.commands.registerCommand('hkscript.runScript', (filePath?: string) => {
            const editor = vscode.window.activeTextEditor;
            const target = filePath || editor?.document.uri.fsPath;
            if (!target) return;

            const compilerPath = compiler.getCompilerPath();
            const term = vscode.window.createTerminal('HKS Script');
            term.show();

            if (compilerPath) {
                if (compilerPath.endsWith('.dll'))
                    term.sendText(`dotnet exec "${compilerPath}" run "${target}"`);
                else
                    term.sendText(`"${compilerPath}" run "${target}"`);
            } else {
                term.sendText(`dotnet run -- run "${target}"`);
            }
        })
    );
}
