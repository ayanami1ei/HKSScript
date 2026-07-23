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
            let cmd: string;
            let args: string[];

            if (compilerPath) {
                if (compilerPath.endsWith('.dll')) {
                    cmd = 'dotnet';
                    args = [compilerPath, subCmd, filePath, ...rest];
                } else {
                    cmd = compilerPath;
                    args = [subCmd, filePath, ...rest];
                }
            } else {
                const root = this.findProjectRoot(filePath);
                if (!root) return null;
                cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
                args = ['run', '--', subCmd, filePath, ...rest];
                opts.cwd = root;
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
