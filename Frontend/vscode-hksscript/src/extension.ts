import * as vscode from 'vscode';
import { CompilerClient } from './compiler/CompilerClient';
import { SemanticHighlighter } from './decorations/SemanticHighlighter';
import { HoverProvider } from './providers/HoverProvider';
import { InlayHintsProvider } from './providers/InlayHintsProvider';
import { SignatureHelpProvider } from './providers/SignatureHelpProvider';
import { RunCodeLensProvider, registerRunCommand } from './providers/CodeLensProvider';
import { CompletionProvider } from './providers/CompletionProvider';

let highlighter: SemanticHighlighter;
let compiler: CompilerClient;
let diagnostic: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    compiler = new CompilerClient();
    highlighter = new SemanticHighlighter(context);
    diagnostic = vscode.languages.createDiagnosticCollection('hkscript');
    context.subscriptions.push(diagnostic);

    // 高亮
    const updateDecoration = (editor: vscode.TextEditor | undefined) => {
        if (editor) highlighter.update(editor);
    };

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(updateDecoration),
        vscode.workspace.onDidChangeTextDocument(e => {
            const editor = vscode.window.activeTextEditor;
            if (editor?.document === e.document) highlighter.update(editor);
        })
    );

    // 诊断
    const runDiagnose = (filePath: string) => {
        if (!diagnostic) return;
        const errors = compiler.runDiagnose(filePath);
        const uri = vscode.Uri.file(filePath);
        if (!errors || errors.length === 0) { diagnostic.set(uri, []); return; }
        diagnostic.set(uri, errors.map((e: any) => {
            const line = Math.max(0, (e.line || 1) - 1);
            return new vscode.Diagnostic(
                new vscode.Range(line, 0, line, 1000),
                e.message,
                vscode.DiagnosticSeverity.Error
            );
        }));
    };

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(doc => {
            if (doc.languageId === 'hkscript') runDiagnose(doc.uri.fsPath);
        }),
        vscode.window.onDidChangeActiveTextEditor(ed => {
            if (ed && ed.document.languageId === 'hkscript') runDiagnose(ed.document.uri.fsPath);
        })
    );

    // Providers
    context.subscriptions.push(
        vscode.languages.registerInlayHintsProvider({ pattern: '**/*.hks' }, new InlayHintsProvider(compiler)),
        vscode.languages.registerHoverProvider({ scheme: 'file', pattern: '**/*.hks' }, new HoverProvider(compiler)),
        vscode.languages.registerSignatureHelpProvider({ pattern: '**/*.hks' }, new SignatureHelpProvider(compiler), '(', ','),
        vscode.languages.registerCodeLensProvider({ pattern: '**/*.hks' }, new RunCodeLensProvider(compiler)),
        vscode.languages.registerCompletionItemProvider({ pattern: '**/*.hks' }, new CompletionProvider(compiler)),
    );

    registerRunCommand(context, compiler);

    // 初始加载
    setTimeout(() => {
        const ed = vscode.window.activeTextEditor;
        if (ed) {
            highlighter.update(ed);
            runDiagnose(ed.document.uri.fsPath);
        }
    }, 500);
}

export function deactivate() {
    if (diagnostic) diagnostic.dispose();
    if (highlighter) highlighter.dispose();
}
