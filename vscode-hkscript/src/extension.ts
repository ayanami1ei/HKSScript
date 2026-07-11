import * as vscode from 'vscode';

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('hksscript');
    context.subscriptions.push(diagnosticCollection);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(validateDocument),
        vscode.workspace.onDidSaveTextDocument(validateDocument),
        vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document)),
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) validateDocument(editor.document);
        })
    );

    if (vscode.window.activeTextEditor)
        validateDocument(vscode.window.activeTextEditor.document);
}

export function deactivate() {}

async function validateDocument(document: vscode.TextDocument) {
    if (document.languageId !== 'hksscript') return;

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    try {
        const errors = await parseHksScript(text);
        for (const err of errors) {
            const range = new vscode.Range(
                Math.max(0, err.line - 1), err.column,
                Math.max(0, err.line - 1), err.column + Math.max(1, err.length)
            );
            diagnostics.push(new vscode.Diagnostic(
                range, err.message, vscode.DiagnosticSeverity.Error
            ));
        }
    } catch (e: any) {
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            `Parser error: ${e.message}`,
            vscode.DiagnosticSeverity.Error
        ));
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

interface ParseError {
    message: string;
    line: number;
    column: number;
    length: number;
}

async function parseHksScript(text: string): Promise<ParseError[]> {
    const antlr4 = await import('antlr4');
    const HksScriptLexer = (await import('./parser/HksScriptLexer')).default;
    const HksScriptParser = (await import('./parser/HksScriptParser')).default;

    const errors: ParseError[] = [];

    const collector = Object.assign(new antlr4.ErrorListener(), {
        syntaxError(recognizer: any, offendingSymbol: any, line: number, column: number, msg: string, e: any) {
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
    } catch (e: any) {
        errors.push({ message: e.message, line: 1, column: 0, length: 1 });
    }

    return errors;
}
