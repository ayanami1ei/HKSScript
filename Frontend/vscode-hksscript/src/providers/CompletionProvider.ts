import * as vscode from 'vscode';
import { CompilerClient } from '../compiler/CompilerClient';

export class CompletionProvider implements vscode.CompletionItemProvider {
    constructor(private compiler: CompilerClient) {}

    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]> {
        const items = this.compiler.getCompletions(document.uri.fsPath);
        if (!items) return [];

        return items.map((item: any) => {
            const ci = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Function);
            ci.detail = item.detail;
            ci.insertText = item.label;
            return ci;
        });
    }
}
