import * as vscode from 'vscode';
import { CompilerClient } from '../compiler/CompilerClient';

export class SignatureHelpProvider implements vscode.SignatureHelpProvider {
    constructor(private compiler: CompilerClient) {}

    provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position): vscode.SignatureHelp | null {
        const textBefore = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
        const callMatch = textBefore.match(/(\w+)\s*\([^)]*$/);
        if (!callMatch) return null;

        const info = this.compiler.getHint(document.uri.fsPath, position.line + 1, position.character);
        if (!info || info.kind !== 'function') return null;

        const help = new vscode.SignatureHelp();
        const paramList = info.type.match(/\((.*)\)/)?.[1] || '';
        help.signatures = [new vscode.SignatureInformation(`${info.name}(${paramList})`, info.type)];
        help.activeSignature = 0;
        help.activeParameter = 0;
        return help;
    }
}
