import * as vscode from 'vscode';
import { CompilerClient } from '../compiler/CompilerClient';

export class HoverProvider implements vscode.HoverProvider {
    constructor(private compiler: CompilerClient) {}

    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
        const info = this.compiler.getHint(document.uri.fsPath, position.line + 1, position.character);
        if (!info || info.kind === '?') return null;
        return new vscode.Hover(`**${info.name}**  \`${info.type}\`  \n${info.kind}`);
    }
}
