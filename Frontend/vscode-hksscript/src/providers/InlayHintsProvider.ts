import * as vscode from 'vscode';
import { CompilerClient } from '../compiler/CompilerClient';

export class InlayHintsProvider implements vscode.InlayHintsProvider {
    constructor(private compiler: CompilerClient) {}

    provideInlayHints(document: vscode.TextDocument, _range: vscode.Range): vscode.InlayHint[] {
        const map = this.compiler.getSymbols(document.uri.fsPath);
        if (!map) return [];

        const hints: vscode.InlayHint[] = [];
        for (const sym of map) {
            if (sym.kind !== 'variable') continue;
            const lineText = document.lineAt(sym.line - 1).text;
            if (lineText.substring(sym.column + sym.length).trim().startsWith(':')) continue;
            const hint = new vscode.InlayHint(
                new vscode.Position(sym.line - 1, sym.column + sym.length),
                `: ${sym.type}`,
                vscode.InlayHintKind.Type
            );
            hints.push(hint);
        }
        return hints;
    }
}
