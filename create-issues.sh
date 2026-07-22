#!/bin/bash
set -e
cd "$(dirname "$0")"

# 创建需要的 label（忽略已存在的错误）
for label in setup lexer ast type-check hir runtime interpreter codegen cli integration optimization refactor enhancement; do
    gh label create "$label" --color "0366d6" 2>/dev/null || true
done

# ─── 项目搭建 ───

gh issue create --title "搭建项目：创建 .csproj + 目录结构" --label "setup" --body "
创建新的 .csproj 项目文件，添加 ANTLR 依赖：
- dotnet new console
- 添加 Antlr4.Runtime.Standard NuGet 包
- 保留现有目录结构（Algorithm/ DataType/ Feature/ Grammar/ Query/ Runtime/ Doc/ Tools/）
- 确认 dotnet build 能通过（即使还没有业务代码）
"

gh issue create --title "搭建项目：配置 ANTLR 代码生成" --label "setup" --body "
在 Tools/ 下有 antlr-4.13.2-complete.jar，配置构建脚本自动从 .g4 生成 C# 解析器：
- 编写 regenerate-grammar.sh 脚本
- java -jar Tools/antlr-*.jar -Dlanguage=CSharp Grammar/HksScript.g4 -visitor
- 生成的 .cs 文件输出到 Grammar/ 目录
- 更新 .gitignore 排除 .interp / .tokens
"

# ─── 词法分析 ───

gh issue create --title "词法分析：重写 .g4 词法规则" --label "lexer" --body "
参考 Doc/compilation.md 第150-204行。重写 Grammar/HksScript.g4 的词法规则。

新增 Token 类型：
- NEWLINE, INDENT, DEDENT, PIPE(=>)
- 关键字：if, elif, else, def, import, query, from, with, and, or, not
- 注释：# 行注释

INDENT/DEDENT 不由 ANTLR 处理（由 TokenStreamFilter 接管）。
WS 和 COMMENT 直接 skip。
"

gh issue create --title "词法分析：重写 .g4 语法规则" --label "lexer" --body "
参考 Doc/compilation.md 第179-203行。重写语法规则为缩进风格。

规则：
- program → statement* EOF
- statement → importStmt / assignStmt / exprStmt / ifStmt / funcDef
- block → INDENT statement+ DEDENT
- importStmt → 'import' ID (',' ID)*
- ifStmt → 'if' expr ':' NEWLINE block ('elif' ...)* ('else' ...)?
- funcDef → 'def' ID '(' params? ')' ('->' type)? ':' NEWLINE block
- expr → pipe / comparison / arithmetic / call / literal / variable

使用 '=>' 作为管道运算符，不要 '.' 方法调用。
"

gh issue create --title "词法分析：实现 TokenStreamFilter" --label "lexer" --body "
参考 Doc/compilation.md 第211-275行。

实现 TokenStreamFilter（继承 ITokenStream），夹在 Lexer 和 Parser 之间：
1. 续行规则：括号栈、行末运算符、行首运算符三种情况跳过 NEWLINE
2. 缩进规则：遇到有效 NEWLINE 时计算缩进，与栈顶比较，插入 INDENT/DEDENT
3. 文件末尾自动补齐 DEDENT

输入：ANTLR Lexer 原始 token 流 → 过滤器 → 输出到 Parser。
"

# ─── AST ───

gh issue create --title "AST：定义节点 record 类型" --label "ast" --body "
参考 Doc/compilation.md 第309-379行。

定义 AST 节点（C# record）：
- Program(List<Stmt>)
- Stmt: Assign, FuncDef, Import, If(ElifClause), Return
- Expr: Literal, Variable, Binary(Op), Unary(Op), Call, QueryFrom, Pipe, Range
- 集合运算：Union, Intersect, Diff（运算符语法糖）

所有节点用 record 实现，自动获得值比较和 ToString。
"

gh issue create --title "AST：实现 ANTLR ParseTree → AST 转换" --label "ast" --body "
实现 ASTBuilder（继承 ANTLR 的 HksScriptBaseVisitor），将 ANTLR 生成的 ParseTree 转为干净的 AST。

每个 Visit* 方法返回对应的 AST 节点：
- VisitAssignStmt → Assign
- VisitIfStmt → If + ElifClause
- VisitCallExpr → Call
- VisitQueryFrom → QueryFrom（保留语法糖结构，lowering 时统一）
- VisitPipeExpr → Pipe
- VisitBinaryExpr → Binary

ANTLR 的 ParseTree 包含括号/分号等冗余，转换后丢弃。
"

# ─── 类型推导 ───

gh issue create --title "类型推导：实现符号表" --label "type-check" --body "
参考 Doc/compilation.md 第436-447行。

实现符号表 SymbolTable：
- 支持作用域嵌套（EnterScope / ExitScope）
- 记录 变量名 → 类型 映射
- 类型包括：int, float, string, bool, Mat, Set<T>, (T → U) 函数类型
- import 语句将模块中的函数加入符号表
"

gh issue create --title "类型推导：实现类型检查遍历" --label "type-check" --body "
参考 Doc/compilation.md 第408-435行。

实现 TypeChecker，遍历 AST 给每个表达式推导类型：
- 字面量：INT→int, FLOAT→float, STRING→string, true/false→bool
- 变量：查符号表
- 函数调用：取函数签名返回类型
- Pipe：上一步结果类型匹配下一步第一个参数类型
- Binary：检查两边类型是否兼容（int+float 自动提升）
- 报错：类型不匹配、未定义变量

Pipe 链的类型匹配是关键——决定 pipe 结果填入哪个参数位置。
"

# ─── HIR ───

gh issue create --title "HIR：定义指令 record 类型" --label "hir" --body "
参考 Doc/compilation.md 第513-577行。

定义 HIR 指令（C# record）：
- ProgramHIR(List<HIRInst>)
- Id = int（指令编号别名）
- 基类 HIRInst { Id Dest }
- Const, Load, Save, Call(Type RetTy), Filter(Expr), Branch, Let, Print, Return
- 集合：Range, Union, Intersect, Diff
- InitModule（import 用）

每条指令有唯一 Id 编号，参数用 Id 引用前面指令的结果。
"

gh issue create --title "HIR：实现 Lowering pass（AST → HIR）" --label "hir" --body "
参考 Doc/compilation.md 第589-613行 Lowering 规则表。

实现 LoweringPass，遍历 AST 生成 HIR 指令序列：
- Assign(a, 1+2) → t0=Const(1), t1=Const(2), t2=Add(t0,t1), t3=Let(a,t2)
- Call(load, x.png) → t0=Load(x.png)
- QueryFrom(col, cond) → t0=Filter(col, cond)  (与 Call(query) 统一)
- Pipe(a, f()) → t0=f(a)  (pipe 结果填入 f 第一个参数)
- 集合运算 a|b → t0=Union(a,b)
- If → Branch
- Return → Return
- Import → InitModule

输出 ProgramHIR，可用 PrintHIR() 调试输出。
"

# ─── Pack<T> 运行时 ───

gh issue create --title "运行时：实现 Pack<T> 统一容器" --label "runtime" --body "
参考 Doc/compilation.md 第627-661行。

实现 Pack<T> 容器类型：
- Pack<T> 抽象基类
- One<T>(T Value) : Pack<T> — 单值
- Many<T>(IEnumerable<T> Items) : Pack<T> — 多值

实现辅助方法：
- Map(fn) — Many 遍历调用 fn，One 直接调用 fn
- Filter(pred) — 同 Map 逻辑
- ToList() — 展开为 List<T>
- Count()
"

gh issue create --title "运行时：实现 Set 运算" --label "runtime" --body "
实现 Set<T> 集合运算：
- Union(a, b) — 并集，元素去重
- Intersect(a, b) — 交集
- Diff(a, b) — 差集（在 a 不在 b）

C# 用 HashSet<T> 实现底层存储。
对应的 HIR 指令：Union, Intersect, Diff。
"

# ─── 解释执行 ───

gh issue create --title "执行引擎：实现 HIR 解释器" --label "interpreter" --body "
参考 Doc/compilation.md 第665-741行。

实现 HIR Interpreter：
- values: Dictionary<Id, object?> 存运行时值
- env: 变量名 → Id 映射（支持作用域嵌套）
- 主循环：foreach(var inst in program) switch(inst.Op)
- 每种 OpKind 实现对应的执行逻辑

需要处理：
- Load/ Save — I/O 操作
- Call — 查找注册的函数并调用
- Filter — 构建谓词，筛选 Set
- Branch — 条件判断，跳转到对应 block
- Return — 设置 _returned + _returnValue 标记
- InitModule — 加载并初始化模块
"

gh issue create --title "执行引擎：实现函数定义和 return 控制流" --label "interpreter" --body "
参考 Doc/compilation.md 第704-741行。

实现函数调用和 return：
- 函数定义 FuncDef 存储在 env 中
- 调用时：EnterScope → 绑定参数 → 执行 body → ExitScope
- Return 指令设置 _returned = true + _returnValue
- body 执行循环检查 _returned 标记，标记为 true 时跳出
- 没有 return 的函数返回 null
- 支持递归调用
"

gh issue create --title "执行引擎：实现 import 模块加载" --label "interpreter" --body "
实现 import 模块系统：
- 扫描 plugins/ 目录下已注册的算法模块
- import a 时：查找模块 → 调用初始化 → 注册函数到符号表
- 未 import 的模块函数报错"未定义的函数"
- 支持 import a, b 批量导入

模块定义由 C++ 算法层提供（通过 P/Invoke 加载）。
"

# ─── 代码生成 ───

gh issue create --title "代码生成：实现 C++ 后端" --label "codegen" --body "
参考 Doc/compilation.md 第751-778行。

实现 CodeGenCpp，HIR → C++ 代码：
- Load → cv::imread()
- Save → cv::imwrite()
- Call → find_circles() 等 native 函数调用
- Filter → lambda + erase_if / std::views::filter
- Let → auto var = expr;
- Return → return value;
- Branch → if/else
- Union/Intersect/Diff → 手动循环或 STL 算法

输出字符串，可写入 .cpp 文件后用 clang++ 编译。
"

gh issue create --title "代码生成：实现 C# 后端" --label "codegen" --body "
参考 Doc/compilation.md 第780-831行。

实现 CodeGenCSharp，HIR → C# 代码：
- Load → Mat.FromFile()
- Save → Mat.Save()
- Call → Find.FindCircle() (P/Invoke 调 C++ 库)
- Filter → LINQ .Where()
- Let → var name = value;
- Return → return value;
- Branch → if/else
- Union/Intersect/Diff → LINQ .Union()/.Intersect()/.Except()

输出字符串，可写入 .cs 文件后用 dotnet build 编译。
"

# ─── CLI ───

gh issue create --title "CLI：实现三种运行模式" --label "cli" --body "
实现命令行入口，支持三种模式：
1. dotnet run -- run demo.hks — 执行脚本（词法→语法→类型推导→HIR→解释执行）
2. dotnet run -- analyze demo.hks — 分析脚本（输出语法树+符号表+类型信息）
3. dotnet run -- server — 启动语言服务器（stdin/stdout JSON 协议，供 VS Code 扩展使用）

参考原有 Runtime/Cli.cs 的功能，但改为走新 pipeline。
"

# ─── 集成 ───

gh issue create --title "集成：更新 VS Code 扩展" --label "integration" --body "
vscode-hksscript 扩展需要适配新语法：
- 更新 TextMate 语法高亮（syntaxes/hksscript.tmLanguage.json）
  新关键字：import, def, query, from, with 等
  新运算符：=>
  新注释：# 行注释
- 更新语言服务器通信协议（server 模式输出 JSON）
- 更新语义 token 着色
- 测试：打开 .hks 文件能看到正确高亮

不需要修改扩展的架构（仍然是 subprocess 调用 dotnet server）。
"

# ─── 后续 ───

gh issue create --title "优化：常量折叠 + 死代码删除 + 变量内联" --label "optimization" --body "
TODO — 后续版本实现。

参考 Doc/compilation.md 第835-951行。

1. 常量折叠：编译时计算 Const(10) + Const(20) → Const(30)
2. 死代码删除：未被引用的 tN 直接删除
3. 冗余变量消除：Let(x, t0) 后直接用 t0 替代 x
4. 变量内联（后端相关）：
   - C#：激进内联，追求可读
   - C++：保守内联，POD 内联，对象保留具名变量
"

echo "全部 19 个 issue 创建完成！"
