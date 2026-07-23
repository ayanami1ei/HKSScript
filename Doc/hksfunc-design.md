# HksFunc 代码生成器设计方案

## 目标

通过 C# 特性标注，自动将 .NET 方法注册为脚本可调用的外部函数，省去手动写 `ExternalFunction` 注册代码。

## 用法示例

```csharp
using HksScript;

public class MyAlgo
{
    [HksFunc]
    public static Mat Gray(Mat src) { ... }

    [HksFunc(alias = "blur")]
    public static Mat GaussianBlur(Mat src, double sigma) { ... }

    [HksFunc]
    public static List<Circle> FindCircles(Mat img, double minR, double maxR) { ... }
}
```

生成器自动生成：

```csharp
// 自动生成的注册代码
public static partial class HksFuncRegistry
{
    public static void RegisterAll(FunctionTable table)
    {
        table.Register("gray", new ExternalFunction("gray",
            args => MyAlgo.Gray((Mat)args[0]!)));

        table.Register("blur", new ExternalFunction("blur",
            args => MyAlgo.GaussianBlur((Mat)args[0]!, (double)args[1]!)));

        table.Register("find_circles", new ExternalFunction("find_circles",
            args => MyAlgo.FindCircles((Mat)args[0]!, (double)args[1]!, (double)args[2]!)));
    }
}
```

脚本中使用：

```python
import find_circle

img = load("test.png")
circles = find_circles(img)    # 对应 [HksFunc] FindCircles
blurred = blur(img, 1.5)       # 对应 [HksFunc(alias="blur")] GaussianBlur
```

## 组件

### 1. HksFuncAttribute

```csharp
// HksFuncAttribute.cs — 放在 Shared/ 中，脚本引擎和算法项目都能引用
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class HksFuncAttribute : Attribute
{
    public string? Alias { get; set; }  // 可选，指定脚本中的函数名，不指定则用方法名
}
```

### 2. 源生成器（Source Generator）

使用 Roslyn 源生成器，在编译时扫描 `[HksFunc]` 标记的方法，生成注册代码。

**扫描目标**：所有被 `[HksFunc]` 标记的 `public static` 方法。

**生成内容**：一个 `partial class HksFuncRegistry`，包含 `RegisterAll(FunctionTable)` 方法。

**类型映射**：

| C# 类型 | 脚本类型 | 强转方式 | 说明 |
|---------|---------|---------|------|
| `int` | `int` | `(int)args[i]!` | 基础 |
| `double` / `float` | `float` | `(double)args[i]!` | 基础 |
| `string` | `string` | `(string)args[i]!` | 基础 |
| `bool` | `bool` | `(bool)args[i]!` | 基础 |
| `Mat` | `Mat` | `(Mat)args[i]!` | 图像 |
| `List<T>` | `Set<T>` | `(List<T>)args[i]!` | 集合 |
| `void` 返回 | `void` | `return null;` | 无返回值 |
| `[HksType]` 标记的类 | 自定义类型名 | 自动处理 | 用户自定义 |

#### 自定义类型 [HksType]

用户可能需要返回自己的结果类型，而不仅是引擎内置的类型。用 `[HksType]` 标记类或结构体，生成器会将其注册到脚本的类型系统。

```csharp
[HksType]
public class DetectionResult
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Confidence { get; set; }
}
```

生成器会自动注册此类型，并生成字段访问函数的映射：

```csharp
// 自动生成
table.RegisterType("DetectionResult", typeof(DetectionResult));
// 字段访问转为函数调用:
// result.x  →  Call("__get_DetectionResult_x", result)
```

脚本中使用：

```python
import my_algo

res = detect_defects(img)
print(res.confidence)   # 内部转为 __get_DetectionResult_confidence(res)
```

`[HksType]` 支持的成员：

| C# 成员 | 脚本访问 | 说明 |
|---------|---------|------|
| `public` 属性 | `obj.Property` | 自动生成 `__get_Type_Property` 函数 |
| `public` 字段 | `obj.Field` | 同上 |

如果类型名与脚本已有类型冲突，可用 `alias` 重命名：

```csharp
[HksType(alias = "Defect")]
public class DetectionResult { ... }
```

脚本中：

```python
res: Defect = detect_defects(img)
```

### 3. 注册调用

在程序启动时调用生成的注册代码：

```csharp
// 在 Cli 或 Program.Main 中
var table = new FunctionTable();
HksFuncRegistry.RegisterAll(table);  // 由源生成器生成
BuiltinRegistry.RegisterBuiltins(table);
ModuleInit.RegisterAll(table);
```

### 4. 库加载模块（LibraryManager）

库的查询、加载、注册功能不应耦合在 CLI 或 FunctionTable 里。提取为独立的 `LibraryManager` 类，任何外壳（CLI、REPL、GUI、代码生成器）都能使用。

```
┌─────────────┐   install/import    ┌────────────────┐
│  CLI / REPL │ ──────────────────→ │ LibraryManager  │
│  代码生成器   │                    │                │
│   VS Code   │                    │ · 扫描库路径    │
└─────────────┘                    │ · 加载 DLL     │
                                   │ · 注册函数     │
                                   │ · 缓存模块     │
                                   └───────┬────────┘
                                           │
                         ┌─────────────────┼────────────┐
                         ▼                 ▼            ▼
                   ┌──────────┐    ┌────────────┐  ┌──────────┐
                   │Function  │    │ TypeChecker │  │ 代码生成  │
                   │ Table    │    │ (前端符号)   │  │ (C++/C#) │
                   └──────────┘    └────────────┘  └──────────┘
```

#### LibraryManager 接口

```csharp
public class LibraryManager
{
    // 构造函数：从命令行选项或配置文件初始化
    public LibraryManager(LibraryConfig config);

    // 扫描库路径，返回所有可用模块列表
    public List<ModuleDef> ListModules();

    // 安装一个 DLL 到指定层级
    public void InstallModule(string tier, string dllPath);

    // 导入模块到指定的 FunctionTable
    public void ImportModule(string moduleName, FunctionTable table);

    // 批量导入所有已安装的模块
    public void ImportAll(FunctionTable table);

    // 获取模块定义（供代码生成器使用）
    public ModuleDef? GetModuleDef(string moduleName);
}
```

#### LibraryConfig

配置来源可以是配置文件或程序化构造，不耦合于 CLI：

```csharp
public class LibraryConfig
{
    public string StdLibPath    { get; set; } = "./lib/std/";
    public string GlobalLibPath { get; set; } = "~/.hks/lib/";
    public string ProjectLibPath { get; set; } = "./lib/";

    // 从 hksconfig.json 加载
    public static LibraryConfig Load(string configPath);

    // 跨平台展开路径
    public string[] GetSearchPaths();
}
```

#### 三个库层级

函数库分为三层，按优先级从高到低：

| 层级 | 目录 | 说明 | 谁维护 |
|------|------|------|--------|
| 标准库 (std) | `lib/std/` | 最基础的函数：`__add`/`__sub` 等表达式操作、`load`/`save`/`print`、`query`、`len`、`range`、集合运算 | 引擎开发者 |
| 用户全局库 (global) | `~/.hks/lib/` | 用户自己编写或安装的通用算法库，所有项目可用 | 用户 |
| 项目库 (project) | `<project>/lib/` | 只在当前项目里有意义的函数 | 项目开发者 |

查找顺序：std → global → project，同名时 project 覆盖 global 覆盖 std。

#### 库路径（跨平台）

路径由配置文件 `hksconfig.json` 决定，放在可执行文件同目录。安装包部署时自动生成。

```json
{
  "libPaths": {
    "std":     "lib/std",
    "global":  "~/.hks/lib",
    "project": "lib"
  }
}
```

**平台默认展开**：

| 平台 | std 展开 | global 展开 |
|------|---------|------------|
| Linux | `./lib/std/` | `/home/user/.hks/lib/` |
| Windows | `.\lib\std\` | `C:\Users\user\.hks\lib\` |
| macOS | `./lib/std/` | `/Users/user/.hks/lib/` |

**FunctionTable 中的路径解析**：

```csharp
string[] GetLibPaths()
{
    var config = JsonSerializer.Deserialize<Config>(File.ReadAllText("hksconfig.json"));
    var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    return config.LibPaths.Values
        .Select(p => Path.GetFullPath(p.Replace("~", home)))
        .ToArray();
}
```

用户如需自定义，编辑可执行文件同目录的 `hksconfig.json` 即可。

#### CLI install 命令

用户写好带 `[HksFunc]` 的 C# 类，**不需要重新编译脚本引擎**。只要编译成 DLL，然后用 CLI 安装即可。

```bash
# 1. 用户写好自己的算法
```

```csharp
// MyFilter.cs — 用户自己写的，和引擎无关的项目
using HksScript;

public class MyFilter
{
    [HksFunc]
    public static Mat CustomFilter(Mat src, double intensity)
    {
        // 用户自己的算法逻辑
    }

    [HksFunc(alias = "enhance")]
    public static Mat EdgeEnhance(Mat src)
    {
        // 用户自己的算法逻辑
    }
}
```

```bash
# 2. 编译成 DLL（用户自己的项目，不需要引用引擎）
dotnet build -c Release -o out/

# 3. 用引擎的 CLI 安装
dotnet HKSScript.dll install global ./out/MyFilter.dll

# 4. 脚本中直接使用
```

```python
import my_filter          # 从 global 库加载

img = load("test.png")
result = custom_filter(img, 0.5)   # 对应 [HksFunc] CustomFilter
enhanced = enhance(img)            # 对应 [HksFunc(alias="enhance")] EdgeEnhance
```

`install` 命令的工作流程：

```
1. 加载指定的 .dll
2. 扫描其中所有标记了 [HksFunc] 的 public static 方法
3. 读取方法签名（名称、参数类型、返回类型）和 Alias
4. 生成一个模块定义文件到对应库目录
```

模块定义文件格式（JSON）：

```json
{
  "module": "my_algo",
  "assembly": "/path/to/MyAlgo.dll",
  "functions": [
    { "scriptName": "gray",       "method": "MyAlgo.Gray",       "params": ["Mat"],          "returns": "Mat" },
    { "scriptName": "blur",       "method": "MyAlgo.GaussianBlur","params": ["Mat","float"],  "returns": "Mat" },
    { "scriptName": "find_circles","method": "MyAlgo.FindCircles","params": ["Mat","float","float"], "returns": "Set<Circle>" }
  ]
}
```

#### 脚本中的 import 加载机制

```python
import std_algo        # 从 std 库查找 std_algo.json
import my_global_lib   # 从 global 库查找 my_global_lib.json
import project_specific # 从 project 库查找 project_specific.json
```

import 执行时（`LibraryManager.ImportModule` 内部）：

```
1. 在三个库目录中按 std → global → project 顺序查找 <name>.json
2. 加载对应的 .dll（如果尚未加载）
3. 注册模块定义文件中列出的所有函数到 FunctionTable
4. 如果同名函数已存在，按优先级覆盖（project > global > std）
```

#### FunctionTable 对接

`FunctionTable` 不再直接管理库路径。由 `LibraryManager` 统一加载，然后注册到 `FunctionTable`：

```csharp
// 任何外壳中的用法都一致
var config = LibraryConfig.Load("hksconfig.json");
var lib = new LibraryManager(config);
var table = new FunctionTable();

// 注册内置函数
BuiltinRegistry.RegisterBuiltins(table);

// 注册 std 库（基础运算符、load/save/print 等）
lib.ImportAll(table);

// 按需导入特定模块
lib.ImportModule("my_algo", table);
```

代码生成器不需要 `FunctionTable`，直接用 `LibraryManager.GetModuleDef()` 获取模块定义：

```csharp
var lib = new LibraryManager(config);
var def = lib.GetModuleDef("my_algo");
// def.Functions → 生成 C++ 函数声明
// def.Assembly  → 引用原 DLL
```
        var asm = Assembly.LoadFrom(def.Assembly);
        foreach (var fn in def.Functions)
        {
            var method = asm.GetType(fn.Method.Split('.')[0])
                ?.GetMethod(fn.Method.Split('.')[1]);
            if (method == null) continue;

            var func = new ExternalFunction(fn.ScriptName, args => {
                var typedArgs = args.Select((a, i) => ConvertArg(a, fn.Params[i])).ToArray();
                return method.Invoke(null, typedArgs);
            });
            Register(fn.ScriptName, func);
        }
    }
}
```

这样 `[HksFunc]` 标记的方法只需要编译一次，之后通过 `dotnet HKSScript.dll install <层级> <dll路径>` 注册，脚本里 `import 模块名` 即可使用。不需要重新编译脚本引擎。

## 项目结构

```
HksScript/
├── HksScript.Kernel/                   ← 内核库（被所有外壳引用）
│   ├── HksScript.Kernel.csproj
│   ├── Frontend/                       ← 词法/语法/类型推导/Lowering
│   ├── Backend/
│   │   ├── Interpreter/               ← HIR 解释器
│   │   ├── CodeGen/                   ← C++/C# 代码生成
│   │   └── Runtime/                   ← Pack<T>, ScriptSet, FunctionTable
│   └── LibraryManager/               ← 库加载模块（独立于外壳）
│       ├── LibraryManager.cs
│       └── LibraryConfig.cs
├── HksScript.Cli/                      ← CLI 外壳（引用 Kernel）
│   ├── HksScript.Cli.csproj
│   ├── Cli.cs                          ← 命令行解析，调 Kernel API
│   ├── BuiltinRegistry.cs             ← 内置函数注册
│   └── ModuleInit.cs                  ← OpenCV 算法注册
├── HksScript.LanguageServer/           ← 语言服务器（引用 Kernel）
│   ├── HksScript.LanguageServer.csproj
│   └── Server.cs                       ← stdin/stdout JSON 协议
├── HksScript.Sdk/                      ← NuGet 包（用户引用）
│   ├── HksScript.Sdk.csproj
│   ├── HksFuncAttribute.cs
│   └── HksFuncRegistry.cs
├── HksFuncGenerator/                   ← 源生成器
│   ├── HksFuncGenerator.csproj
│   └── HksFuncGenerator.cs
└── vscode-hksscript/                   ← VS Code 扩展（通过语言服务器通信）
```

### 架构与数据流

```
                    ┌─────────────────────────┐
                    │   VS Code 扩展           │
                    │   (vscode-hksscript)    │
                    └────────┬───────────────┘
                             │ JSON 协议 (stdin/stdout)
                             ▼
                    ┌─────────────────────────┐
                    │  HksScript.LanguageServer│
                    │  (引用 Kernel)           │
                    └────────┬───────────────┘
                             │ 直接 API 调用
                             ▼
┌────────────┐     ┌─────────────────────────┐
│ HksScript  │     │  HksScript.Kernel       │
│ .Cli       │────→│  ┌───────────────────┐  │
│ (外壳)     │     │  │ Frontend          │  │
└────────────┘     │  │ · Lexer/Parser    │  │
                   │  │ · TypeChecker     │  │
                   │  │ · Lowering        │  │
                   │  ├───────────────────┤  │
                   │  │ Backend           │  │
                   │  │ · Interpreter     │  │
                   │  │ · CodeGen (C++/#) │  │
                   │  │ · FunctionTable   │  │
                   │  ├───────────────────┤  │
                   │  │ LibraryManager    │  │
                   │  │ · 库加载/缓存     │  │
                   │  └───────────────────┘  │
                   └─────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
       ┌──────────────┐          ┌──────────────┐
       │ 库 JSON 定义  │          │ C++ 编译器    │
       │ (std/global/  │          │ (代码生成产物) │
       │  project)     │          └──────────────┘
       └──────────────┘
```

### 各项目职责

| 项目 | 类型 | 职责 |
|------|------|------|
| `HksScript.Kernel` | 类库 | 编译前端、解释器、代码生成、库管理。无入口点，纯 API。 |
| `HksScript.Cli` | 可执行文件 | 命令行外壳：`check`/`run`/`diagnose`/`install`/`code-present`/`hint`。引用 Kernel。 |
| `HksScript.LanguageServer` | 可执行文件 | stdin/stdout JSON 协议，供 VS Code 扩展通信。引用 Kernel。 |
| `HksScript.Sdk` | NuGet 包 | `[HksFunc]` / `[HksType]` 特性定义，用户引用。 |
| `HksFuncGenerator` | 源生成器 | Roslyn 分析器，编译时生成 `HksFuncRegistry.RegisterAll`。 |
| `vscode-hksscript` | VS Code 扩展 | 通过 `HksScript.LanguageServer` 获取符号、诊断、提示。 |

### 为什么这样拆分

1. **内核不依赖外壳** — Kernel 不知道 CLI、语言服务器或 VS Code 的存在，只暴露 API
2. **外壳可以换** — 未来可以加 REPL、Web API、GUI 等，都只需引用 Kernel
3. **语言服务器直调 Kernel** — 不需要再 spawn `dotnet run`，直接进程内调用，性能好
4. **代码生成器也走 LibraryManager** — C++ 代码生成器调 `GetModuleDef()` 拿函数签名，不需要跑解释器

用户在自己的项目中引用此包即可使用 `[HksFunc]` 和 `[HksType]`：

```bash
dotnet add package HksScript.Sdk
```

```csharp
using HksScript;

public class MyAlgo
{
    [HksFunc]
    public static Mat CustomFilter(Mat src, double sigma) { ... }

    [HksType]
    public class MyResult
    {
        public double Value { get; set; }
    }
}
```

包内容：

| 文件 | 说明 |
|------|------|
| `HksFuncAttribute.cs` | `[HksFunc(alias="xxx")]` 特性 |
| `HksTypeAttribute.cs` | `[HksType(alias="xxx")]` 特性 |
| `HksFuncRegistry.cs` | `partial class HksFuncRegistry` 声明，供生成器补充 |
| `HksScript.Sdk.props` | MSBuild 属性，自动引用源生成器 |

引擎自身的 `BasicAlgo.cs` 也通过引用 `HksScript.Sdk` 来使用标签，和第三方用户无区别。

## 注意事项

- 源生成器项目需要引用 `Microsoft.CodeAnalysis.CSharp` 和 `Microsoft.CodeAnalysis.Analyzers`
- 生成器需要在编译时运行，所以 `HksFuncGenerator.csproj` 需要配置为 `Analyzer`
- 生成的 `HksFuncRegistry` 是 `partial class`，允许用户手写补充
- 参数数量、类型不匹配时，编译阶段由生成器报错提示
- `alias` 为空时使用方法名（首字母小写 + 下划线分隔）
