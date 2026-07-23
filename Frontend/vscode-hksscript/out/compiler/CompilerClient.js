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
        return this.exec('code-present', filePath);
    }
    getHint(filePath, line, col) {
        return this.exec('hint', filePath, String(line), String(col));
    }
    runDiagnose(filePath) {
        return this.exec('diagnose', filePath);
    }
    getCompletions(filePath) {
        return this.exec('complete', filePath);
    }
    getCompilerPath() {
        return vscode.workspace.getConfiguration('hkscript').get('compilerPath') || '';
    }
    exec(subCmd, filePath, ...rest) {
        try {
            const compilerPath = this.getCompilerPath();
            const opts = { timeout: 15000, encoding: 'utf-8' };
            let cmd = 'dotnet';
            let args;
            if (compilerPath) {
                if (compilerPath.endsWith('.dll'))
                    args = ['exec', compilerPath, subCmd, filePath, ...rest];
                else
                    args = [subCmd, filePath, ...rest];
            }
            else {
                const root = this.findProjectRoot(filePath);
                if (root) {
                    args = ['run', '--', subCmd, filePath, ...rest];
                    opts.cwd = root;
                }
                else {
                    // 尝试 PATH 中的 hks 命令
                    cmd = 'hks';
                    args = [subCmd, filePath, ...rest];
                }
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