# HKS Script 工具包

## 文件说明

| 文件 | 说明 |
|------|------|
| `HKSScript.dll` | CLI 主程序（dotnet 运行） |
| `hkscript-0.1.0.vsix` | VS Code 扩展（直接安装） |

## CLI 用法

```bash
# 检查脚本类型
dotnet HKSScript.dll check demo.hks

# 执行脚本
dotnet HKSScript.dll run demo.hks

# 输出符号位置（供 VS Code 扩展使用）
dotnet HKSScript.dll code-present demo.hks
```

## VS Code 扩展

通过 `Extensions: Install from VSIX...` 安装 `hksscript-0.1.0.vsix`。

推荐在 `.vscode/settings.json` 中设置编译器路径以加快符号获取：

```json
{
  "hkscript.compilerPath": "/path/to/HKSScript.dll"
}
```

不设置也能用，但每次会走 `dotnet run`（需要编译），比直接调 dll 慢。
