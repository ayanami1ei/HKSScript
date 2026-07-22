import * as vscode from 'vscode';

const keywords = new Set(['import','def','if','elif','else','return','query','from','with','and','or','not','true','false']);
const types    = new Set(['int','float','string','bool','Mat','Set','Circle','Range','void']);
const builtins = new Set(['load','save','print','len','range']);

export function activate(context: vscode.ExtensionContext) {
    const provider = new HkscriptSemanticTokensProvider();
    context.subscriptions.push(
        vscode.languages.registerDocumentSemanticTokensProvider(
            { language: 'hkscript' },
            provider,
            provider.legend
        )
    );
}

class HkscriptSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    readonly legend = new vscode.SemanticTokensLegend(
        ['function', 'variable', 'type', 'keyword'],
        []
    );

    provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
        const builder = new vscode.SemanticTokensBuilder(this.legend);
        const text = document.getText();
        const lines = text.split('\n');

        for (let line = 0; line < lines.length; line++) {
            const l = lines[line];

            // 关键字
            for (const kw of keywords) {
                const re = new RegExp('\\b' + kw + '\\b', 'g');
                let m: RegExpExecArray | null;
                while ((m = re.exec(l)) !== null)
                    builder.push(line, m.index, m[0].length, 3, 0);
            }

            // 类型
            for (const t of types) {
                const re = new RegExp('\\b' + t + '\\b', 'g');
                let m: RegExpExecArray | null;
                while ((m = re.exec(l)) !== null)
                    builder.push(line, m.index, m[0].length, 2, 0);
            }

            // 内置函数
            for (const fn of builtins) {
                const re = new RegExp('\\b' + fn + '\\b', 'g');
                let m: RegExpExecArray | null;
                while ((m = re.exec(l)) !== null)
                    builder.push(line, m.index, m[0].length, 0, 0);
            }

            // 函数调用: ID + '('
            const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
            let m2: RegExpExecArray | null;
            while ((m2 = callRe.exec(l)) !== null) {
                const name = m2[1];
                if (keywords.has(name) || types.has(name) || builtins.has(name)) continue;
                builder.push(line, m2.index, name.length, 0, 0);
            }
        }

        return builder.build();
    }
}
