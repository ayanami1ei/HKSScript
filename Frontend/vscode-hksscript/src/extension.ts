import * as vscode from 'vscode';

export function activate(_context: vscode.ExtensionContext) {
    // 只激活，不做任何额外操作
    // 语法高亮由 TextMate grammar 提供
    // 颜色由 "HKS Script" 主题提供
    console.log('HKS Script extension activated');
}
