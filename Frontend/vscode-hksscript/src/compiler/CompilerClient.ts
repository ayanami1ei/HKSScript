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

    private exec(subCmd: string, filePath: string, ...rest: string[]): any | null {
        try {
            const compilerPath = this.getCompilerPath();
            const opts: any = { timeout: 15000, encoding: 'utf-8' as const };
            let cmd: string = 'dotnet';
            let args: string[];

            if (compilerPath) {
                if (compilerPath.endsWith('.dll'))
                    args = ['exec', compilerPath, subCmd, filePath, ...rest];
                else
                    args = [subCmd, filePath, ...rest];
            } else {
                const root = this.findProjectRoot(filePath);
                if (root) {
                    args = ['run', '--', subCmd, filePath, ...rest];
                    opts.cwd = root;
                } else {
                    // 尝试 PATH 中的 hks 命令
                    cmd = 'hks';
                    args = [subCmd, filePath, ...rest];
                }
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
