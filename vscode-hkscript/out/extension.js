"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
let diagnosticCollection;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('hksscript');
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validateDocument), vscode.workspace.onDidSaveTextDocument(validateDocument), vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document)), vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor)
            validateDocument(editor.document);
    }));
    if (vscode.window.activeTextEditor)
        validateDocument(vscode.window.activeTextEditor.document);
}
function deactivate() { }
async function validateDocument(document) {
    if (document.languageId !== 'hksscript')
        return;
    const diagnostics = [];
    const text = document.getText();
    try {
        const errors = await parseHksScript(text);
        for (const err of errors) {
            const range = new vscode.Range(Math.max(0, err.line - 1), err.column, Math.max(0, err.line - 1), err.column + Math.max(1, err.length));
            diagnostics.push(new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error));
        }
    }
    catch (e) {
        diagnostics.push(new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), `Parser error: ${e.message}`, vscode.DiagnosticSeverity.Error));
    }
    diagnosticCollection.set(document.uri, diagnostics);
}
async function parseHksScript(text) {
    const antlr4 = await Promise.resolve().then(() => __importStar(require('antlr4')));
    const HksScriptLexer = (await Promise.resolve().then(() => __importStar(require('./parser/HksScriptLexer')))).default;
    const HksScriptParser = (await Promise.resolve().then(() => __importStar(require('./parser/HksScriptParser')))).default;
    const errors = [];
    const collector = Object.assign(new antlr4.ErrorListener(), {
        syntaxError(recognizer, offendingSymbol, line, column, msg, e) {
            errors.push({
                message: msg,
                line,
                column,
                length: offendingSymbol ? (offendingSymbol.stop - offendingSymbol.start + 1) : 1
            });
        }
    });
    try {
        const chars = new antlr4.InputStream(text);
        const lexer = new HksScriptLexer(chars);
        const tokens = new antlr4.CommonTokenStream(lexer);
        lexer.removeErrorListeners();
        lexer.addErrorListener(collector);
        tokens.fill();
        const parser = new HksScriptParser(tokens);
        parser.removeErrorListeners();
        parser.addErrorListener(collector);
        parser.buildParseTrees = false;
        parser.program();
    }
    catch (e) {
        errors.push({ message: e.message, line: 1, column: 0, length: 1 });
    }
    return errors;
}
//# sourceMappingURL=extension.js.map