"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompilerClient = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
class CompilerClient {
    constructor() {
        this.projectRootCache = new Map();
    }
    getSymbols(filePath) {
        return this.exec(filePath, 'code-present');
    }
    getHint(filePath, line, col) {
        return this.exec(filePath, 'hint', String(line), String(col));
    }
    runDiagnose(filePath) {
        return this.exec(filePath, 'diagnose');
    }
    getCompilerPath() {
        return vscode.workspace.getConfiguration('hkscript').get('compilerPath') || '';
    }
    exec(filePath, ...extraArgs) {
        try {
            const compilerPath = this.getCompilerPath();
            const opts = { timeout: 15000, encoding: 'utf-8' };
            let cmd;
            let args;
            if (compilerPath) {
                if (compilerPath.endsWith('.dll')) {
                    cmd = 'dotnet';
                    args = [compilerPath, ...extraArgs, filePath];
                }
                else {
                    cmd = compilerPath;
                    args = [...extraArgs, filePath];
                }
            }
            else {
                const root = this.findProjectRoot(filePath);
                if (!root)
                    return null;
                cmd = process.platform === 'win32' ? 'dotnet.exe' : 'dotnet';
                args = ['run', '--', ...extraArgs, filePath];
                opts.cwd = root;
            }
            const result = cp.spawnSync(cmd, args, opts);
            if (result.status !== 0)
                return null;
            return JSON.parse(result.stdout);
        }
        catch {
            return null;
        }
    }
    findProjectRoot(filePath) {
        const cached = this.projectRootCache.get(filePath);
        if (cached !== undefined)
            return cached;
        try {
            let dir = path.dirname(filePath);
            while (dir !== path.dirname(dir)) {
                if (require('fs').existsSync(path.join(dir, 'HKSScript.csproj'))) {
                    this.projectRootCache.set(filePath, dir);
                    return dir;
                }
                dir = path.dirname(dir);
            }
        }
        catch { }
        this.projectRootCache.set(filePath, null);
        return null;
    }
}
exports.CompilerClient = CompilerClient;
//# sourceMappingURL=CompilerClient.js.map