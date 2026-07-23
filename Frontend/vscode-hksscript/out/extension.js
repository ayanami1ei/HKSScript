"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const CompilerClient_1 = require("./compiler/CompilerClient");
const SemanticHighlighter_1 = require("./decorations/SemanticHighlighter");
const HoverProvider_1 = require("./providers/HoverProvider");
const InlayHintsProvider_1 = require("./providers/InlayHintsProvider");
const SignatureHelpProvider_1 = require("./providers/SignatureHelpProvider");
const CodeLensProvider_1 = require("./providers/CodeLensProvider");
const CompletionProvider_1 = require("./providers/CompletionProvider");
let highlighter;
let compiler;
let diagnostic;
function activate(context) {
    compiler = new CompilerClient_1.CompilerClient();
    highlighter = new SemanticHighlighter_1.SemanticHighlighter(context);
    diagnostic = vscode.languages.createDiagnosticCollection('hkscript');
    context.subscriptions.push(diagnostic);
    // 高亮
    const updateDecoration = (editor) => {
        if (editor)
            highlighter.update(editor);
    };
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateDecoration), vscode.workspace.onDidChangeTextDocument(e => {
        const editor = vscode.window.activeTextEditor;
        if (editor?.document === e.document)
            highlighter.update(editor);
    }));
    // 诊断
    const runDiagnose = (filePath) => {
        if (!diagnostic)
            return;
        const errors = compiler.runDiagnose(filePath);
        const uri = vscode.Uri.file(filePath);
        if (!errors || errors.length === 0) {
            diagnostic.set(uri, []);
            return;
        }
        diagnostic.set(uri, errors.map((e) => {
            const line = Math.max(0, (e.line || 1) - 1);
            return new vscode.Diagnostic(new vscode.Range(line, 0, line, 1000), e.message, vscode.DiagnosticSeverity.Error);
        }));
    };
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
        if (doc.languageId === 'hkscript')
            runDiagnose(doc.uri.fsPath);
    }), vscode.window.onDidChangeActiveTextEditor(ed => {
        if (ed && ed.document.languageId === 'hkscript')
            runDiagnose(ed.document.uri.fsPath);
    }));
    // Providers
    context.subscriptions.push(vscode.languages.registerInlayHintsProvider({ pattern: '**/*.hks' }, new InlayHintsProvider_1.InlayHintsProvider(compiler)), vscode.languages.registerHoverProvider({ scheme: 'file', pattern: '**/*.hks' }, new HoverProvider_1.HoverProvider(compiler)), vscode.languages.registerSignatureHelpProvider({ pattern: '**/*.hks' }, new SignatureHelpProvider_1.SignatureHelpProvider(compiler), '(', ','), vscode.languages.registerCodeLensProvider({ pattern: '**/*.hks' }, new CodeLensProvider_1.RunCodeLensProvider(compiler)), vscode.languages.registerCompletionItemProvider({ pattern: '**/*.hks' }, new CompletionProvider_1.CompletionProvider(compiler)));
    (0, CodeLensProvider_1.registerRunCommand)(context, compiler);
    // 初始加载
    setTimeout(() => {
        const ed = vscode.window.activeTextEditor;
        if (ed) {
            highlighter.update(ed);
            runDiagnose(ed.document.uri.fsPath);
        }
    }, 500);
}
function deactivate() {
    if (diagnostic)
        diagnostic.dispose();
    if (highlighter)
        highlighter.dispose();
}
//# sourceMappingURL=extension.js.map