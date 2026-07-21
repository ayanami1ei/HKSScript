# HKS脚本语法

### 一、语法规则

大部分语句无需写分号，用缩进表示代码块。

1. 赋值语句<br>
`=` 表示赋值，类型由编译器自动推导，第一次使用时自动声明。
```
a = 1                 # int
b = 3.14              # float
c = load("test.png")  # Mat
images = load("batch/*.png")  # Set<Mat>
```

2. query 语句<br>
从集合中筛选符合条件的元素，支持两种写法：
```
# 语法糖：可读性更好
res = query from circles with area > 10

# 函数调用：与其他函数风格一致
res = query(circles, area > 10)
```
两种写法语义等价，lowering 时会统一变成同一个 HIR。

3. if 语句
```
if condition:
    stmts
elif condition:
    stmts
else:
    stmts
```

4. 函数
```
# 定义时用 -> 标注返回值类型，不写则无返回值
def find_circles(img) -> Set<Circle>:
    return algo_run(img)

def log(msg):
    print(msg)

res = find_circles(img)  # res 类型为 Set<Circle>
```

# 链式调用（pipe）：a => f() => g(x)
# 上一步的结果自动匹配到下一步的第一个类型兼容的参数
# 用户不需要写这个参数

# 单图处理
load("test.png") => find_circles() => query(area > 10)

# 批量处理同样写法，函数内部自动遍历集合
load("batch/*.png") => find_circles() => query(area > 10)

# 保存结果
save(result, "output.png")

# pipe 链中保存也一样
load("batch/*.png") => find_circles() => save("result.txt")
```

5. import 语句
```
import find_circle
import locator
import find_circle, locator
```
导入算法模块。只有 import 了的模块才会被初始化，代码提示也只会出现已导入模块的函数。

### 二、类型系统

| 类型 | 说明 | 示例值 |
|------|------|--------|
| `int` | 整数 | `1`, `-5`, `1000` |
| `float` | 浮点数 | `3.14`, `-0.5` |
| `string` | 字符串 | `"test.png"` |
| `bool` | 布尔 | `true`, `false` |
| `Mat` | 图像 | `load("a.png")` 的结果 |
| `Set<T>` | 集合，包含多个 T 类型元素 | `load("batch/*.png")` 是 `Set<Mat>` |
| `Range` | 整数范围，常由 `range(col)` 产生 | `range(0, 10)` |

集合 `Set<T>` 是核心类型，支持以下操作：

| 操作 | 写法 | 说明 |
|------|------|------|
| 长度 | `len(col)` | 返回元素个数 |
| 筛选 | `query from col with cond` | 过滤元素 |
| 并集 | `a \| b` | 合并两个集合（去重） |
| 交集 | `a & b` | 取两个集合的公共元素 |
| 差集 | `a - b` | 取在 a 中但不在 b 中的元素 |
| 链式 | `a => f => g` | pipe 运算，`g(f(a))` |

### 三、内置函数

| 函数 | 说明 |
|------|------|
| `load(path)` | 加载文件，路径含通配符时返回集合 |
| `save(img, path)` | 保存图像到文件 |
| `print(...)` | 打印到终端 |
| `query from col with cond` | 从集合中筛选元素 |
| `query(col, cond)` | 同上，函数调用写法 |
| `range(col)` | 返回 `0..len(col)-1` 的索引范围 |
| `len(col)` | 返回集合元素个数 |
| `sql(conn, stmt)` | 执行 SQL 查询 |

所有函数接受**单值或集合**，统一签名，两种调用方式一致：

```
# 单图
load("a.png") => find_circles() => query(area > 10)

# 批量（自动遍历）
load("*.png") => find_circles() => query(area > 10)
```

集合运算 `\|`、`&`、`-` 是运算符语法糖，内部会转为对应的 HIR 指令。

### 三、编译过程

以下是编译器/解释器前端的基本过程，C# 有很多成熟的库可以通过配置文件完成 1、2 步。

1. 划 token<br>
将源代码划为标识符、关键字、符号、字面量等 token，保留位置信息以便纠错。
可直接用一个循环依次判断，或者使用正则表达式，但不得直接用不可见字符划分。

2. 构建语法树<br>
将 token 按语法规则搭建语法树，按 token 类型检查语法。

3. 类型推导和报错<br>
所有变量都是从已知变量经过表达式推导得到。已知变量的类型已知，表达式的运算过程已知，则可推出变量的类型。
若变量在不同地方类型不一致，或遇到未定义的标识符，则报错。
这一步需要构建符号表。

4. 生成中间表示（IR）<br>
这是生成其他语言代码的必要步骤。IR 只表示语义，剔除语法细节，可视为虚拟指令集。遍历语法树，根据节点生成即可。
```
举例：C# 使用引用语义，变量是对象的指针。"变量 = 变量" 在语法上赋值，语义上是指针复制。
```

5. IR 使用<br>
IR 既可以被执行引擎直接解释执行，也可以逆向生成其他语言代码。