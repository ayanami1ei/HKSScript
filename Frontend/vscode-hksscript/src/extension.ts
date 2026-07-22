import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('HKS: activate');

    // 测试1: 弹窗
    vscode.window.showInformationMessage('HKS 扩展已加载!');

    // 测试2: 状态栏
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    item.text = 'HKS ✓';
    item.show();
    context.subscriptions.push(item);

    // 测试3: 输入框提示
    vscode.window.showInputBox({ prompt: 'HKS 测试 - 按回车继续' });
}
