import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';
import { SymbolInfo } from '../types';

export class CompilerClient {
    private projectRootCache = new Map<string, string | null>();

    getSymbols(filePath: string): SymbolInfo[] | null {
        return this.exec('code-present', filePath);
    }

    getHint(filePath: string, line: number, col: number): any | null {
        return this.exec('hint', filePath, String(line), String(col));
    }

    runDiagnose(filePath: string): any[] | null {
        return this.exec('diagnose', filePath);
    }

    getCompletions(filePath: string): any[] | null {
        return this.exec('complete', filePath);
    }

    getCompilerPath(): string {
        return vscode.workspace.getConfiguration('hkscript').get<string>('compilerPath') || '';
    }

    private resolveCompiler(compilerPath: string): string {
        if (!compilerPath) return '';
        // .dll 时优先找同目录下的原生可执行文件
        if (compilerPath.endsWith('.dll')) {
            const dir = path.dirname(compilerPath);
            const base = path.basename(compilerPath, '.dll');
            // Windows: .exe, Linux/macOS: 无扩展名
            for (const exe of [base + '.exe', base, base + '.cmd', base + '.bat']) {
                const full = path.join(dir, exe);
                if (require('fs').existsSync(full)) return full;
            }
        }
        return compilerPath;
    }

    private exec(subCmd: string, filePath: string, ...rest: string[]): any | null {
        try {
            const rawPath = this.getCompilerPath();
            const opts: any = { timeout: 15000, encoding: 'utf-8' as const };
            let cmd: string;
            let args: string[];

            if (rawPath) {
                cmd = this.resolveCompiler(rawPath);
                args = [subCmd, filePath, ...rest];
            } else {
                // 尝试 PATH 中的 hks 命令
                cmd = 'hks';
                args = [subCmd, filePath, ...rest];
            }

            const result = cp.spawnSync(cmd, args, opts);
            if (result.status !== 0) return null;
            return JSON.parse(result.stdout);
        } catch {
            return null;
        }
    }

    private findProjectRoot(filePath: string): string | null {
        const cached = this.projectRootCache.get(filePath);
        if (cached !== undefined) return cached;
        try {
            let dir = path.dirname(filePath);
            while (dir !== path.dirname(dir)) {
                if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj'))) {
                    this.projectRootCache.set(filePath, dir);
                    return dir;
                }
                dir = path.dirname(dir);
            }
        } catch {}
        this.projectRootCache.set(filePath, null);
        return null;
    }
}
