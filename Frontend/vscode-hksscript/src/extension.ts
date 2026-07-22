import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

// 默认颜色（当 dotnet run 无法获取符号时使用）
const keywords = ['import','def','if','elif','else','return','query','from','with','and','or','not','true','false'];
const types = ['int','float','string','bool','Mat','Set','Circle','Range','void'];
const builtins = ['load','save','print','len','range'];

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

    async provideDocumentSemanticTokens(
        document: vscode.TextDocument
    ): Promise<vscode.SemanticTokens> {
        const projectRoot = findProjectRoot(document.uri.fsPath);
        if (projectRoot) {
            const symbols = await runCodePresent(projectRoot, document.uri.fsPath);
            if (symbols.length > 0)
                return buildTokens(symbols, this.legend);
        }

        // Fallback: 基于正则的内置高亮
        return buildFallbackTokens(document.getText(), this.legend);
    }
}

// ─── 编译前端符号 → 语义 tokens ───

interface SymbolInfo {
    name: string; kind: string; type: string;
    line: number; column: number; length: number;
}

function buildTokens(symbols: SymbolInfo[], legend: vscode.SemanticTokensLegend): vscode.SemanticTokens {
    const builder = new vscode.SemanticTokensBuilder(legend);
    for (const sym of symbols) {
        let typeIdx: number;
        switch (sym.kind) {
            case 'function': typeIdx = 0; break;
            case 'variable': typeIdx = 1; break;
            default: continue;
        }
        builder.push(sym.line - 1, sym.column, sym.length, typeIdx, 0);
    }
    return builder.build();
}

async function runCodePresent(projectRoot: string, filePath: string): Promise<SymbolInfo[]> {
    return new Promise(resolve => {
        try {
            const cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
            const child = cp.spawn(cmd, ['run', '--', 'code-present', filePath], { cwd: projectRoot });
            let stdout = '';
            child.stdout.on('data', (d: Buffer) => stdout += d.toString());
            child.on('close', () => {
                try { resolve(JSON.parse(stdout)); }
                catch { resolve([]); }
            });
            child.on('error', () => resolve([]));
        } catch { resolve([]); }
    });
}

// ─── Fallback 高亮（基于正则）───

function buildFallbackTokens(text: string, legend: vscode.SemanticTokensLegend): vscode.SemanticTokens {
    const builder = new vscode.SemanticTokensBuilder(legend);
    const lines = text.split('\n');

    for (let line = 0; line < lines.length; line++) {
        const l = lines[line];

        // 关键字
        for (const kw of keywords) {
            const re = new RegExp('\\b' + kw + '\\b', 'g');
            let m: RegExpExecArray | null;
            while ((m = re.exec(l)) !== null) {
                builder.push(line, m.index, m[0].length, 3, 0); // 3 = keyword
            }
        }

        // 类型
        for (const t of types) {
            const re = new RegExp('\\b' + t + '\\b', 'g');
            let m: RegExpExecArray | null;
            while ((m = re.exec(l)) !== null) {
                const idx = m.index;
                // 确保不是关键字的一部分
                if (idx > 0 && /\w/.test(l[idx - 1])) continue;
                builder.push(line, idx, m[0].length, 2, 0); // 2 = type
            }
        }

        // 内置函数
        for (const fn of builtins) {
            const re = new RegExp('\\b' + fn + '\\b', 'g');
            let m: RegExpExecArray | null;
            while ((m = re.exec(l)) !== null) {
                builder.push(line, m.index, m[0].length, 0, 0); // 0 = function
            }
        }

        // 函数调用: ID + '('
        const callRe = /\b([a-zA-Z_]\w*)\s*\(/g;
        let m2: RegExpExecArray | null;
        while ((m2 = callRe.exec(l)) !== null) {
            const name = m2[1];
            if (keywords.includes(name) || types.includes(name)) continue;
            builder.push(line, m2.index, name.length, 0, 0); // 0 = function
        }

        // 注释 # 和 (* *)
        const commentRe = /#.*$|\(\*[\s\S]*?\*\)/g;
        let m3: RegExpExecArray | null;
        while ((m3 = commentRe.exec(l)) !== null) {
            builder.push(line, m3.index, m3[0].length, 3, 0); // 3 = keyword (gray)
        }
    }

    return builder.build();
}

// ─── 工具 ───

function findProjectRoot(filePath: string): string | null {
    try {
        let dir = path.dirname(filePath);
        while (dir !== path.dirname(dir)) {
            if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj'))) return dir;
            dir = path.dirname(dir);
        }
    } catch {}
    return null;
}
