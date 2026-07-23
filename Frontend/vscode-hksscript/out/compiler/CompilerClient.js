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
    resolveCompiler(compilerPath) {
        if (!compilerPath)
            return '';
        // .dll 时优先找同目录下的原生可执行文件
        if (compilerPath.endsWith('.dll')) {
            const dir = path.dirname(compilerPath);
            const base = path.basename(compilerPath, '.dll');
            // Windows: .exe, Linux/macOS: 无扩展名
            for (const exe of [base + '.exe', base, base + '.cmd', base + '.bat']) {
                const full = path.join(dir, exe);
                if (require('fs').existsSync(full))
                    return full;
            }
        }
        return compilerPath;
    }
    exec(subCmd, filePath, ...rest) {
        try {
            const rawPath = this.getCompilerPath();
            const opts = { timeout: 15000, encoding: 'utf-8' };
            let cmd;
            let args;
            if (rawPath) {
                cmd = this.resolveCompiler(rawPath);
                args = [subCmd, filePath, ...rest];
            }
            else {
                // 尝试 PATH 中的 hks 命令
                cmd = 'hks';
                args = [subCmd, filePath, ...rest];
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