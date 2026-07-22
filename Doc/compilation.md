# HKS脚本编译实现

## 整体流程

```
HksScript 源码
    │
    ▼
┌──────────────┐
│  1. 词法分析  │  源码 → Token 序列
│  (划 token)  │
└──────────────┘
    │
    ▼
┌──────────────┐
│  2. 语法分析  │  Token 序列 → 语法树 (AST)
│  (建树)      │
└──────────────┘
    │
    ▼
┌──────────────┐
│  3. 类型推导  │  检查类型错误，构建符号表
│  (语义分析)  │
└──────────────┘
    │
    ▼
┌──────────────┐
│  4. 生成 HIR  │  AST → 中间表示 (指令序列)
│  (Lowering)  │
└──────────────┘
    │
    ┌────────────────────┐
    │                    │
    ▼                    ▼
┌──────────┐      ┌──────────┐
│ 解释执行   │      │ 代码生成  │
│ (开发期)  │      │ (生产期)  │
└──────────┘      └──────────┘
                        │
                  ┌─────┴─────┐
                  ▼           ▼
              ┌──────┐   ┌──────┐
              │ C++  │   │ C#   │
              └──────┘   └──────┘
```

### 快速导航

| 章节 | 内容 |
|------|------|
| [1. 词法分析](#1-词法分析划-token) | Token 类型表、ANTLR .g4 文件、TokenStreamFilter |
| [2. 语法分析](#2-语法分析建树) | AST 节点定义、ParseTree→AST 转换 |
| [3. 类型推导](#3-类型推导) | 推导规则、符号表、错误报告 |
| [4. 生成 HIR](#4-生成-hir中间表示) | HIR 指令定义、Lowering 规则表、Pack\<T\> |
| [5. 解释执行](#5-解释执行) | HIR 解释器、Return 控制流 |
| [6. 代码生成](#6-代码生成hir--c--c) | C++ 后端、C# 后端 |
| [7. 优化](#7-优化todo--后续版本实现) | 常量折叠、死代码删除、变量内联 |

## 1. 词法分析（划 token）

把源码字符串切成一个个最小有意义单元，叫 token。

### 输入

```python
img = load("test.png")
```

### 输出

```
ID("img")   → 变量名
OP("=")     → 赋值
ID("load")  → 函数名
OP("(")     → 左括号
STR("test.png") → 字符串
OP(")")     → 右括号
```

每个 token 还附带它在源码中的**位置**（行号、列号），这样报错时能指出"第 3 行第 5 列有错误"。

### 换行处理（语句跨行）

HksScript 用换行分隔语句（不像 C 语言用分号），但长语句需要能跨多行。规则如下：

**规则一：括号不匹配时自动换行**

```
# 左括号未闭合，继续读下一行
result = query from circles with (
    area > 10 and radius < 50 or
    area < 5
)

# 多层圆括号嵌套也没问题
result = f(a, g(b,
    h(c)))
```

词法分析器维护一个括号栈（当前只需要 `()` 圆括号），遇到 `(` 入栈，遇到 `)` 出栈。换行时栈为空则语句结束，栈非空则继续读下一行。

**规则二：行末是运算符时自动换行**

```
# 行末是 + - * / | & and or not 等运算符或逻辑关键字时，表达式未结束
total = a + b + c -
    d + e

# 逻辑条件跨行
result = query from circles with area > 10 and
    radius < 50 or
    not (x < 5)

# 管道运算符行首续行
load("batch/*.png") => find_circles() => query(area > 10)
```

实现方式：词法分析器看到换行符时，检查前一个 token 的类型：
- 如果前一个 token 是运算符或逻辑关键字（`+` `-` `*` `/` `|` `&` `=>` `and` `or` `not` `,` `(` `[` `{`）→ 跳过换行
- 如果前一个 token 是普通 token（ID、字面量、`)`）→ 换行即语句结束

**规则三：行首以运算符开头也续行**

```
result = big_query_result_arg1
        + arg2 + arg3
```

实现方式：如果换行后第一个非空 token 是运算符，跳过换行，把运算符接到上一行末尾。

**三种规则的优先级**（按顺序检查）：

```
遇到换行符 → 
  1. 括号计数器 > 0？                  → 跳过换行
  2. 前一个 token 是运算符？            → 跳过换行
  3. 下一行的第一个有效 token 是运算符？ → 跳过换行
  4. 否则                             → 换行 = 语句结束
```

### Token 定义

词法分析器输出以下 token 供语法分析使用：

| Token | 来源 | 说明 |
|-------|------|------|
| `ID` | `letter+` | 变量名、函数名 |
| `INT` | `digit+` | 整数 |
| `FLOAT` | `digit+.digit+` | 浮点数 |
| `STRING` | `"..."` | 字符串 |
| `OP` | `+ - * / = \| & > < >= <= == !=` | 运算符 |
| `PIPE` | `=>` | 管道运算符 |
| `LPAREN` | `(` | 左括号 |
| `RPAREN` | `)` | 右括号 |
| `COMMA` | `,` | 逗号 |
| `COLON` | `:` | 冒号 |
| `NEWLINE` | `\n` | 行尾，语句分隔 |
| `INDENT` | 缩进增加 | 块开始 |
| `DEDENT` | 缩进减少 | 块结束 |
| `KEYWORD` | `if` `elif` `else` `def` `import` `query` `from` `with` `and` `or` `not` | 关键字 |

### ANTLR .g4 文件

在 `.g4` 中定义词法和语法规则，ANTLR 自动生成 `Lexer.cs` 和 `Parser.cs`：

```
grammar HksScript;

// 词法规则
NEWLINE: '\r'?'\n';
WS: [ \t]+ -> skip;
COMMENT: '#' ~[\r\n]* -> skip;
INDENT: [ \t]+;  // 不由 ANTLR 处理，由自定义过滤器接管

INT: DIGIT+;
FLOAT: DIGIT+ '.' DIGIT+;
STRING: '"' (~["\\] | '\\' .)* '"';
ID: LETTER (LETTER | DIGIT)*;

OP: '+' | '-' | '*' | '/' | '|' | '&' | '=' | '>' | '<' | '>=' | '<=' | '==' | '!=';
PIPE: '=>';
LPAREN: '('; RPAREN: ')'; COMMA: ','; COLON: ':';

KW_IF: 'if'; KW_ELIF: 'elif'; KW_ELSE: 'else';
KW_DEF: 'def'; KW_IMPORT: 'import'; KW_QUERY: 'query';
KW_FROM: 'from'; KW_WITH: 'with'; KW_AND: 'and'; KW_OR: 'or'; KW_NOT: 'not';

fragment DIGIT: [0-9];
fragment LETTER: [a-zA-Z_];

// 语法规则（使用 INDENT/DEDENT）
program: statement* EOF;

statement
    : NEWLINE                                          // 空行
    | importStmt NEWLINE
    | assignStmt NEWLINE
    | exprStmt NEWLINE
    | ifStmt
    | funcDef
    ;

block: INDENT statement+ DEDENT;

importStmt: KW_IMPORT ID (',' ID)*;
assignStmt: ID '=' expr;
exprStmt: expr;

ifStmt: KW_IF expr COLON NEWLINE block
        (KW_ELIF expr COLON NEWLINE block)*
        (KW_ELSE COLON NEWLINE block)?;

funcDef: KW_DEF ID '(' ')' COLON NEWLINE block;

expr: ...
```

注意点：
- `INDENT` 和 `DEDENT` 不由 ANTLR 词法分析器产生，而是由自定义的 `TokenStreamFilter` 插入
- `NEWLINE` 需要在续行规则中被删除
- `WS` 和 `COMMENT` 直接跳过，缩进信息由 `INDENT` 和 `DEDENT` 携带

### TokenStreamFilter（词法分析器和语法分析器之间的过滤器）

ANTLR 的词法分析器是上下文无关的，无法原生处理 Python 风格的 INDENT/DEDENT。需要在词法分析器和语法分析器之间加一个自定义过滤器：

```
ANTLR Lexer → 原始 Token 流 → TokenStreamFilter → 干净 Token 流 → ANTLR Parser
```

过滤器的工作流程：

```
function Filter(originalTokens):
    stack = [0]        // 缩进栈，初始为 0
    result = []
    i = 0

    while i < len(originalTokens):
        tok = originalTokens[i]

        // 1. 跳过注释和空格（已在 ANTLR 中 skip，此处仅做安全处理）
        if tok is COMMENT or tok is WS: i++; continue

        // 2. 续行判断
        if tok is NEWLINE:
            // 检查括号栈
            if bracketStack > 0:
                i++; continue
            // 检查前一个 token
            if prevToken is OP or PIPE or COMMA or COLON or AND or OR:
                i++; continue
            // 检查后一个 token
            if nextNonWhitespace is OP or PIPE or AND or OR:
                i++; continue

            // 有效 NEWLINE — 处理缩进
            indentLevel = countIndent(nextLine)
            if indentLevel > stack[-1]:
                result.push(INDENT)
                stack.push(indentLevel)
            elif indentLevel < stack[-1]:
                while indentLevel < stack[-1]:
                    result.push(DEDENT)
                    stack.pop()
            result.push(NEWLINE)
            i++; continue

        // 3. 普通 token，直接输出
        result.push(tok)
        prevToken = tok
        i++

    // 文件结束，弹出剩余缩进
    while len(stack) > 1:
        result.push(DEDENT)
        stack.pop()

    return result
```

这个过滤器实现三个功能：
1. **续行处理** — 括号栈、行末/行首运算符检查，决定是否跳过 NEWLINE
2. **缩进处理** — 遇到有效 NEWLINE 时，计算行缩进并与栈顶比较，插入 INDENT/DEDENT
3. **块结束** — 文件末尾自动补齐 DEDENT 确保所有块闭合

ANTLR 中可以通过继承 `TokenStreamRewriter` 或自定义 `ITokenStream` 接口来实现这个过滤器。

把第一步得到的 token 序列，按照语法规则搭成**树状结构**，叫 AST（Abstract Syntax Tree，抽象语法树）。

### 为什么是树不是序列

因为代码有嵌套结构：

```python
a = 1 + 2 * 3
```

如果线性处理 token，不知道先加还是先乘。搭成树之后，树的结构天然表达了优先级：

```
    =
   / \
  a   +
     / \
    1   *
       / \
      2   3
```

遍历时先走子树（`2 * 3`），再算父节点（`+`），优先级自然正确。

### 对于 query 语法糖

```python
res = query from circles with area > 10
```

搭成 AST 后，`query from ... with ...` 这种特殊写法会变成一个 `QueryExpr` 节点，和函数调用 `query(circles, area > 10)` 是不同的 AST 节点。到第 4 步 Lowering 才会把它们统一。

### AST 节点定义

ANTLR 生成的 ParseTree 是具体的语法树，包含了很多括号、分号等冗余信息。我们会在语法分析之后把 ParseTree 转成更干净的 AST。以下是 AST 的节点定义（C# record）：

```csharp
// 程序 = 一组语句
record Program(List<Stmt> Statements);

// 语句基类
abstract record Stmt();

// 赋值语句：a = 1 + 2
record Assign(string Name, Expr Value) : Stmt();

// 函数定义：def fn(a, b) -> Set<Circle>: body
// ReturnType 为 null 表示无返回值
record FuncDef(string Name, List<string> Params, Type? ReturnType, List<Stmt> Body) : Stmt();

// 导入语句：import find_circle
record Import(string Name) : Stmt();
record Import(List<string> Names) : Stmt();  // import a, b, c 的批量写法

// If 语句
record If(Expr Condition, List<Stmt> Then, List<ElifClause> Elifs, List<Stmt>? Else) : Stmt();

record ElifClause(Expr Condition, List<Stmt> Body);

// Return 语句：return x
// 函数没有 return 则无返回值，等同于 return void
record Return(Expr? Value) : Stmt();

// 表达式基类
abstract record Expr();

// 字面量：1, 3.14, "hello", true
record Literal(object Value) : Expr();

// 变量引用：img, circles, area
record Variable(string Name) : Expr();

// 二元运算：a + b, area > 10, 1 + 2 * 3
record Binary(BinaryOp Op, Expr Left, Expr Right) : Expr();

enum BinaryOp { Add, Sub, Mul, Div, Lt, Gt, Eq, Neq, Le, Ge, And, Or }

// 一元运算：-x, not condition
record Unary(UnaryOp Op, Expr Operand) : Expr();

enum UnaryOp { Neg, Not }

// 函数调用：load("test.png"), find_circles(img)
record Call(string Name, List<Expr> Args) : Expr();

// query 语法糖：query from circles with area > 10
// 等价于 Call("query", [circles, area > 10])，但 AST 保留原始写法
record QueryFrom(Expr Collection, Expr Condition) : Expr();

// 管道：a => f(b)  →  上一步结果自动填入 f 的第一个类型兼容参数
// 等价于 f(pipe_result, b)，即使 f 只有一个参数也要写 f()
record Pipe(Expr Left, Expr Right) : Expr();

// --- 集合运算（运算符语法糖）---
// a | b → Union(a, b),  a & b → Intersect(a, b),  a - b → Diff(a, b)
// 三者与数值运算共享词法符号，类型推导时根据操作数类型区分

// --- 集合相关 ---

// 范围：range(col)
record Range(Expr? Start, Expr? End) : Expr();  // 省略 start 则从 0 开始

```

### 在项目里怎么做

同样用 ANTLR，在 `.g4` 文件里定义语法规则：

```
expr
    : expr '=>' expr          # pipeExpr
    | expr '+' expr           # addExpr
    | ID '(' exprList? ')'    # callExpr
    ...
```

ANTLR 自动生成 `Parser.cs` 和 Visitor 接口。你写的 `Evaluator.cs` 就是继承 Visitor，遍历 AST 节点做处理。

当前 Evaluator 的处理方式：

```csharp
// 访问加法节点
VisitAddExpr(ctx) {
    left = Visit(ctx.expr(0));   // 先算左边
    right = Visit(ctx.expr(1));  // 再算右边
    return left + right;         // 返回结果
}
```

---

## 3. 类型推导

AST 搭建完了，但还不知道每个节点的**类型**。类型推导就是遍历 AST 给每个表达式算出类型，同时检查有没有类型错误。

### 推导方式

从已知的东西往未知推：

```
已知:
  - 字面量 "test.png" 类型是 string
  - load 函数接受 string，返回 Mat
  - area 是特征函数，类型是 Circle → float

推导:
  load("test.png")  →  返回 Mat          所以 img 是 Mat
  find_circles(img) →  返回 Set<Circle>  所以 circles 是 Set<Circle>
  area > 10        →  area(Circle) > 10  所以结果是 bool
                     query (筛选条件)
```

### 报错

```
a = 1 + "hello"    # 错误：整数 + 字符串，不匹配
b = unknown        # 错误：未定义的变量
```

### 符号表

类型推导过程中会维护一个**符号表**，记录所有变量名及其类型：

| 变量名 | 类型 |
|--------|------|
| img | Mat |
| circles | List\<Circle\> |
| area | Circle → float |
| res | List\<Circle\> |

后续步骤（Lowering、代码生成）都会查这个符号表。

---

## 4. 生成 HIR（中间表示）

AST 包含了太多**语法细节**——比如 `query from ... with ...` 和 `query(...)` 在 AST 里是两种节点，但它们做的事情完全一样。代码生成时不想关心这些区别，所以需要 HIR（High-level Intermediate Representation，高层次中间表示）。

### HIR 是什么

HIR 是一个**扁平的指令序列**，每条指令做一件事，不嵌套。

**AST**（树状，有嵌套）：

```
        =
       / \
     img load
           |
       "test.png"
```

**HIR**（扁平，每条指令有编号）：

```
t0 = Load("test.png")
t1 = Let("img", t0)
```

### 为什么用 HIR

| 对比 | AST | HIR |
|------|-----|-----|
| 结构 | 树，有嵌套 | 列表，扁平 |
| 语法糖 | 保留原始写法 | 已经被统一 |
| 类型 | 可能未推导 | 每条指令都带类型 |
| 代码生成 | 要递归遍历，麻烦 | 顺序遍历，直接对映到目标代码 |

### 以 query 语法的两种写法为例

写法一：

```python
r = query from circles with area > 10
```

写法二：

```python
r = query(circles, area > 10)
```

在 AST 里，写法一是 `QueryFromStmt` 节点，写法二是 `CallExpr` 节点，完全不同。

但 Lowering 之后，两者变成**相同的 HIR**：

```
t0 = Load("test.png")
t1 = Call(find_circles, t0)
t2 = Let("circles", t1)
t3 = Filter(t2, area > 10)     ← 两种写法的统一产物
t4 = Let("r", t3)
```

代码生成器只需要认识 `Filter` 指令，不需要关心用户当初用的是语法糖还是函数调用。

### HIR 指令定义

每条 HIR 指令都有一个唯一的 `Id` 编号，表示这条指令产生的结果。后续指令可以通过编号引用前面的结果。

HIR 只保留最核心的控制流和运算，所有 IO、集合操作、打印等一律用函数调用表示。

```csharp
// 程序 = 指令序列
record ProgramHIR(List<HirBasicNode> Instructions);

// 指令基类
abstract record class HirBasicNode
{
    HirType Type;  // 指令类型
    int Id;        // 结果编号 t0, t1...
}
```

HirType 只分 6 种：

```csharp
public enum HirType
{
    Call,           // 函数调用（涵盖所有运算、IO、集合操作）
    Return,         // 函数返回
    Branch,         // 条件分支

    Assign,         // 变量赋值
    New,            // 声明变量

    Import,         // 导入模块
}
```

每个 HIR 节点是一个独立的 record class，继承 `HirBasicNode`：

```csharp
// 函数调用：Call(id, "find_circles", [argId0, argId1])
// 所有运算（加减乘除/比较/逻辑）、IO、集合操作都统一走 Call
record class Call(int Id, string Name, int[] Args) : HirBasicNode;

// 变量赋值：Assign(id, rhsId, lhsId)
record class Assign(int Id, int Rhs, int Lhs) : HirBasicNode;

// 声明变量：New(id, varId, "Mat")
record class New(int Id, int Var, string VarType) : HirBasicNode;

// 条件分支：Branch(condId, thenBlock, elseBlock?)
// then 和 else 是嵌套的 HIR 指令数组，执行完后自动回到外层
record class Branch(int Id, int Cond, HirBasicNode[] Then, HirBasicNode[]? Else = null) : HirBasicNode;

// 函数返回：Return(id, blockId, varId)
record class Return(int Id, int Block, int Var) : HirBasicNode;

// 模块导入：Import(id, ["find_circle"])
record class Import(int Id, string[] Imported) : HirBasicNode;
```

算数、比较、逻辑运算不设独立 HIR 指令，转为内置函数调用：

```
a + b     →  Call("__add", [aId, bId])
a > 5     →  Call("__gt", [aId, New(5)])
not cond  →  Call("__not", [condId])
```

这些 `__add`、`__gt`、`__not` 函数在启动时注册到 FunctionTable，与其他函数无区别。

这里的 `Let("img", t0)` 意思是给 t0 的结果起个别名叫 "img"。之后代码里提到 `img` 就会查到实际指向 t0。

### Lowering 规则（AST → HIR 的映射表）

| AST 节点 | 生成的 HIR |
|----------|-----------|
| `import a` | `t0 = Import("a")` |
| `import a, b` | `t0 = Import("a")` `t1 = Import("b")` |
| `a = 1` | `t0 = New("a")` `t1 = Assign(t0)` |
| `a = b + c` | `t0 = Call("__add", [bId, cId])` `t1 = Assign(t0)` |
| `not cond` | `t0 = Call("__not", [condId])` |
| `fn(a, b)` | `t0 = Call("fn", [aId, bId])` |
| `a => f()` | `t0 = Call("f", [aId])` |
| `if cond: ... else: ...` | `t0 = Branch(condId, [...]thenBlock...[], [...]elseBlock...[])` |
| `return x` | `t0 = Return(blockId, xId)` |
| `return` | `t0 = Return(blockId)` |

所有 IO 操作、集合操作、query、import 等一律走 `Call`：

| 语法 | 生成的 HIR |
|------|-----------|
| `a + b` | `t0 = Call("__add", [a, b])` |
| `a - b` | `t0 = Call("__sub", [a, b])` |
| `a * b` | `t0 = Call("__mul", [a, b])` |
| `a / b` | `t0 = Call("__div", [a, b])` |
| `a > b` | `t0 = Call("__gt", [a, b])` |
| `a and b` | `t0 = Call("__and", [a, b])` |
| `not cond` | `t0 = Call("__not", [cond])` |
| `a \| b` （集合） | `t0 = Call("__union", [a, b])` |
| `a & b` （集合） | `t0 = Call("__intersect", [a, b])` |
| `a - b` （集合） | `t0 = Call("__diff", [a, b])` |
| `load("x.png")` | `t0 = Call("load", ["x.png"])` |
| `save(img, p)` | `t0 = Call("save", [img, p])` |
| `print(x)` | `t0 = Call("print", [x])` |
| `query from x with c` | `t0 = Call("query", [x, c])` |
| `range(x)` | `t0 = Call("range", [x])` |
| `sql(conn, stmt)` | `t0 = Call("sql", [conn, stmt])` |

每条 HIR 指令的记录格式：

```csharp
record HIRInst
{
    Id Dest;         // 结果编号 (t0, t1, t2...)
    OpKind Op;       // 操作类型 (Load, Call, Filter, Add...)
    Type ResultType; // 结果类型 (Mat, Set<Circle>, int...)
    object[] Args;   // 参数列表 (可以是 Id 引用，也可以是常量)
}
```

### Pack<T> 统一容器

所有运行时数据用 `Pack<T>` 封装，消除单值/多值的类型系统差异：

```csharp
abstract record Pack<T>;
record One<T>(T Value)        : Pack<T>;  // 单值
record Many<T>(List<T> Items) : Pack<T>;  // 多值
```

函数签名只写一套：

```
find_circles : Pack<Mat> → Pack<Circle>
query        : Pack<T>, Expr → Pack<T>
```

函数内部检查 `Pack` 类型：
- `One<T>` → 直接处理单值
- `Many<T>` → 遍历每个元素处理，可自动并行

执行引擎对 `Many<T>` 且算子无副作用时，自动分片并行：

```
load("batch/*.png")     → Many<Mat>
  => find_circles()     → 4 线程并行执行
  => query(area > 10)   → 并行筛选
```

并行策略由执行器/代码生成器自行决定，不作为 HIR 语义的一部分（后续可加注解机制）。

### 类型与运行时

类型推导得到的类型字符串在编译期和运行时各有用处：

**编译期** — 类型推导用类型字符串做安全检查：

```
# 脚本层
def find_circles(img: Mat) -> Set<Circle>

find_circles("hello")  ← 类型推导报错，参数需要 Mat，实际是 string
                       ← 不生成 HIR，不执行
```

编译通过就保证了：运行时传给每个函数的 `object?` 一定是正确的底层类型。

**解释器** — 只传 `object?`，不碰具体类型：

```
脚本函数的参数 img: Mat  → 类型推导检查通过
                          → 运行时 values[imgId] 一定存的是 Mat 对象
                          → 解释器不管它，只做 object? → object? 转发

NativeFunction("find_circles")  → 接收 object?[]
                                 → 内部 (Mat)args[0] 强转
                                 → 这是算法库的人写的代码，他知道类型
```

调用链：

```
脚本: find_circles(img)
  → HIR: Call("find_circles", [imgId])
    → 解释器: args = [values[imgId]]         ← object?[]
      → NativeFunction.Impl(args):
            Mat img = (Mat)args[0]!;          ← 算法库的人写的强转
            return FindCirclesNative(img);    ← 调用 C++ 算法
```

**解释器全程不需要做 `(Mat)` 这种强转。** 它只负责把 `object?` 从一个指令的结果传给下一个指令的参数。`.NET` 的 `object?` 保留对象的真实类型，`(Mat)args[0]` 在 NativeFunction 内部由 CLR 完成类型检查，不需要反射。

**类型字符串的三个用途总结：**

| 阶段 | 作用 | 方式 |
|------|------|------|
| 类型推导 | 检查参数/返回值是否匹配，报错 | 字符串比较 `"Mat" != "string"` |
| 解释执行 | 不需要类型信息 | 只传 `object?` |
| C++ 代码生成 | 生成类型声明 | 字符串直接嵌入 C++ |

---

## 5. 解释执行

HIR 不需要编译成机器码，可以直接用一个循环逐条执行。

### 函数查找

Call 指令需要一个函数查找系统。不直接用 C# 反射，而是自定义注册表：

```csharp
// 函数统一抽象
abstract record Function;

// 原生函数：C# 直接实现，或通过 P/Invoke 调 C++ 算法库
record NativeFunction(string Name, Func<object?[], object?> Impl) : Function;

// 脚本函数：用户用 def 定义的
record ScriptFunction(FuncDef Def, Dictionary<string, object?> Closure) : Function;

// 函数注册表
class FunctionTable
{
    Dictionary<string, Function> _funcs = new();

    public void Register(string name, Function func)
        => _funcs[name] = func;

    public Function? Find(string name)
        => _funcs.TryGetValue(name, out var f) ? f : null;

    // 内置函数注册
    public void RegisterBuiltins()
    {
        Register("load",  new NativeFunction("load",  args => Mat.FromFile((string)args[0]!)));
        Register("save",  new NativeFunction("save",  args => { /* 保存文件 */ return null; }));
        Register("print", new NativeFunction("print", args => { Console.WriteLine(args[0]); return null; }));
        Register("query", new NativeFunction("query", args => { /* 筛选集合 */ return null; }));
        Register("union", new NativeFunction("union", args => { /* 并集 */ return null; }));
        // ...
    }

    // import 时注册模块函数
    public void ImportModule(string name)
    {
        // 扫描 plugins/ 目录加载算法模块，注册其导出函数
    }
}
```

调用时不使用反射：

```csharp
case HirType.Call:
    var fn = funcTable.Find(inst.Name);
    switch (fn)
    {
        case NativeFunction nf:
            values[inst.Dest] = nf.Impl(resolveArgs(inst.Args));
            break;
        case ScriptFunction sf:
            values[inst.Dest] = executeScriptFunc(sf, resolveArgs(inst.Args));
            break;
    }
    break;
```

这样所有函数（内置、C++算法、脚本定义）都通过同一个注册表查找，没有反射开销。

### 怎么做

解释器按 HirType 分发，每类节点对应一个执行分支：

```csharp
// 全局值表：Id → 运行时值
Dictionary<int, object?> values = new();
// 变量环境：变量名 → Id
Dictionary<string, int> env = new();

void Execute(HirBasicNode[] program)
{
    foreach (var node in program)
    {
        switch (node.Type)
        {
            case HirType.Call:
                var fn = (Call)node;
                var func = funcTable.Find(fn.Name);
                var args = fn.Args.Select(a => values[a]).ToArray();
                values[fn.Id] = func switch
                {
                    NativeFunction nf => nf.Impl(args),
                    ScriptFunction sf => ExecuteScriptFunc(sf, args),
                    _ => throw new Exception($"Unknown function: {fn.Name}")
                };
                break;

            case HirType.New:
                var n = (New)node;
                env[n.Var] = n.Id;
                values[n.Id] = null;  // 占位，后续 Assign 填值
                break;

            case HirType.Assign:
                var a = (Assign)node;
                values[a.Lhs] = values[a.Rhs];
                break;

            case HirType.Branch:
                var br = (Branch)node;
                if ((bool)values[br.Cond]!)
                    Execute(br.Then);
                else if (br.Else != null)
                    Execute(br.Else);
                // 执行完后自动回到外层循环继续下一条指令
                break;

            case HirType.Return:
                var ret = (Return)node;
                _returned = true;
                _returnValue = values[ret.Var];
                break;

            case HirType.Import:
                var imp = (Import)node;
                foreach (var mod in imp.Imported)
                    funcTable.ImportModule(mod);
                break;
        }
    }
}
```

### Return 的处理

函数调用遇到 `Return` 时立即停止执行。在解释器中用一个标记实现控制流跳出：

```csharp
// 全局返回标记，遇到 return 时设置
private bool _returned = false;
private object? _returnValue = null;

void ExecuteFunction(FuncDef func, object?[] args)
{
    env.EnterScope();
    foreach (var (param, arg) in func.Params.Zip(args))
        env[param] = arg;

    _returned = false;
    _returnValue = null;

    foreach (var inst in func.Body)
    {
        Execute(inst);
        if (_returned) break;  // 遇到 return 跳出循环
    }

    env.ExitScope();
    return _returnValue;  // 没有 return 则返回 null
}

// Return 指令的执行：
case HirType.Return:
    var ret = (Return)node;
    _returned = true;
    _returnValue = values[ret.Var];
    break;
```

在 HIR 解释器的循环中，`Return` 不做值传递，只设置标记。上层函数执行器检查标记后停止执行。

这和当前 `Evaluator.cs` 做的事情本质上一样，只是现在的 Evaluator 是递归走 AST，改成走 HIR 列表更简单。

---

## 6. 代码生成（HIR → C++ / C#）

### 基本思路

遍历 HIR 指令列表，每条指令对应生成几行目标语言代码。

### HIR → C++ 示例

```python
# HksScript 源码
img = load("test.png")
circles = find_circles(img)
r = query from circles with area > 10
```

```csharp
// HIR
t0 = Load("test.png")
t1 = Let("img", t0)
t2 = Call("find_circles", t1)
t3 = Let("circles", t2)
t4 = Filter(t3, area > 10)
t5 = Let("r", t4)
```

```cpp
// 生成的 C++
auto t0 = cv::imread("test.png");
auto img = t0;
auto t2 = find_circles(t0);  // 传给 C++ 算法库
auto circles = t2;
auto t4 = filter(circles, [](const Circle& c) { return c.area > 10; });
auto r = t4;
```

### HIR → C# 示例

```csharp
// 生成的 C#
var t0 = Mat.FromFile("test.png");
var img = t0;
var t2 = Find.FindCircle(t0);  // P/Invoke 调 C++ 算法库
var circles = t2;
var t4 = circles.Where(c => c.Area > 10).ToList();
var r = t4;
```

### 代码生成器的结构

```csharp
class CodeGenCpp
{
    string Generate(Program program)
    {
        StringBuilder sb = new();
        int nextId = 0;

        foreach (var inst in program.Instructions)
        {
            sb.AppendLine(inst switch
            {
                Load(var path) =>
                    $"  auto t{nextId++} = cv::imread(\"{path}\");",

                Call(var func, var args) =>
                    $"  auto t{nextId++} = {func}({Join(args)});",

                Filter(var source, var cond) =>
                    $"  auto t{nextId++} = filter({source}, {EmitCondition(cond)});",

                Let(var name, var source) =>
                    $"  auto {name} = {source};",

                _ => throw new NotSupportedException()
            });
        }

        return sb.ToString();
    }
}
```

关键点：

- **每条 HIR 指令独立生成一行或多行代码**
- 不需要考虑上下文，因为上下文已经被 HIR 扁平化了
- 指令之间的数据依赖通过 `t0`、`t1` 这样的临时变量名传递

---

## 7. 优化（TODO — 后续版本实现）

> **当前状态**：以下优化策略是设计规划，短期内不会实现。
> 第一期先实现完整的 HIR 生成和代码正确性，优化在后续版本逐步加入。
> 当前解释执行阶段可直接运行 HIR，不需要优化。

HIR 是扁平指令序列，可以做简单的优化。优化**不能改变程序的计算顺序**（图像处理顺序必须保留），但可以去掉无用计算和合并操作。

### 常量折叠

```
# 原始 HIR
t0 = Const(10)
t1 = Const(20)
t2 = Add(t0, t1)

# 优化后（编译时直接算出 30）
t2 = Const(30)
```

### 死代码删除

如果一个 `tN` 从来没有被引用，删掉它：

```
# 原始
t0 = Load("a.png")    # 没用过，删掉
t1 = Load("b.png")
t2 = find_circles(t1)

# 优化后
t1 = Load("b.png")
t2 = find_circles(t1)
```

### 冗余变量消除

如果一个变量只是另一个变量的别名，直接用原名：

```
# 原始
t2 = Call(find_circles, t1)
t3 = Let("circles", t2)
t4 = Filter(t3, ...)

# 优化后
t2 = Call(find_circles, t1)
t4 = Filter(t2, ...)    # 直接用 t2，跳过 "circles"
```

### 变量内联（目标语言相关）

内联决定代码可读性的上限。但不同目标语言的语义模型不同，内联策略必须区分：

```csharp
// HIR
t0 = Load("test.png")
t1 = Call("find_circles", t0)
t2 = Filter(t1, area > 10)
```

#### C# 后端（引用语义）— 激进内联

C# 全是引用，临时对象不存在生命周期问题，多层嵌套就是多层函数调用：

```csharp
auto circles = find_circles(Mat.FromFile("test.png"));
var r = circles.Where(c => c.Area > 10).ToList();
```

规则：
- 只被引用一次的 `tN` 全部内联
- 被多个指令共享的 `tN` 保留具名变量
- 用户自定义的变量名保留不内联（`Let("img", ...)` 中的 `img`）

#### C++ 后端（值语义）— 保守内联

C++ 的临时对象生命周期只到表达式末尾，无脑内联会导致：

```cpp
// 无脑内联后的 C++：
auto r = filter(
    find_circles(cv::imread("test.png")),  // Mat 临时对象
    [](auto& c) { return c.area > 10; }
);
// ↑ imread 返回的 Mat 在这个分号之前就析构了
// ↑ 如果 find_circles 内部持有 Mat 的引用，就悬空了
```

规则：

| 类型 | 内联策略 | 举例 |
|------|---------|------|
| POD（int/float/bool） | 激进内联 | `t0 = Const(42)` → 直接 `42` |
| 对象（Mat/Circle/List） | 保留具名变量 | `auto img = cv::imread(...)` |
| 函数参数 | 只看一层的浅内联 | `fn(a + b, c)` 可内联，`fn(load(path))` 不内联 |
| 被多次引用的 | 总保留 | `auto t0 = imread(...)` |

生成：

```cpp
auto img = cv::imread("test.png");
auto circles = find_circles(img);  // 保留具名，生命周期明确
auto r = filter(circles, [](auto& c) { return c.area > 10; });
```

#### 两条后端路径总结

```
HIR → [目标无关优化] → 内联决策 → 代码生成
                            ↑
                ┌───────────┴───────────┐
                │                       │
            C# 后端                  C++ 后端
          激进内联                  保守内联
         只看引用计数              还要看类型语义
```

---

## 总结

```
源码 → Token → AST → [类型推导] → HIR → 目标代码

开发期：HIR → 逐条解释执行（当前 Evaluator 思路）
生产期：HIR → C++/C# 代码编译成 native（极致性能）
```

核心思路：**语法写的多样性在 AST 里保留，在往 HIR 转化时统一，代码生成器只认识 HIR，不用管源语法的花样。**
