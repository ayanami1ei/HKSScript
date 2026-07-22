# HKS脚本语法

## 一、语法规则

大部分语句无需写分号，用缩进表示代码块。

### 1. 赋值语句

`=` 表示赋值，类型由编译器自动推导，第一次使用时自动声明。

```python
a = 1                 # int
b = 3.14              # float
c = load("test.png")  # Mat
images = load("batch/*.png")  # Set<Mat>
```

### 2. query 语句

从集合中筛选符合条件的元素，支持两种等价写法：

```python
# 语法糖：可读性更好
res = query from circles with area > 10

# 函数调用：与其他函数风格一致
res = query(circles, area > 10)
```

两种写法在 lowering 时会统一为同一个 HIR。

### 3. if 语句

```python
if condition:
    stmts
elif condition:
    stmts
else:
    stmts
```

### 4. 函数

```python
# 定义时用 -> 标注返回值类型，不写则无返回值
def find_circles(img) -> Set<Circle>:
    return algo_run(img)

def log(msg):
    print(msg)

res = find_circles(img)  # res 类型为 Set<Circle>
```

### 5. 链式调用（pipe）

`a => f() => g(x)` — 上一步结果自动匹配到下一步的第一个类型兼容的参数。

```python
# 单图处理
load("test.png") => find_circles() => query(area > 10)

# 批量处理同样写法，函数内部自动遍历集合
load("batch/*.png") => find_circles() => query(area > 10)

# 保存结果
save(result, "output.png")

# pipe 链中保存也一样
load("batch/*.png") => find_circles() => save("result.txt")
```

### 6. import 语句

```python
import find_circle
import locator
import find_circle, locator
```

导入算法模块。只有 import 了的模块才会被初始化，代码提示也只会出现已导入模块的函数。

## 二、类型系统

| 类型 | 说明 | 示例 |
|------|------|------|
| `int` | 整数 | `1`, `-5`, `1000` |
| `float` | 浮点数 | `3.14`, `-0.5` |
| `string` | 字符串 | `"test.png"` |
| `bool` | 布尔 | `true`, `false` |
| `Mat` | 图像 | `load("a.png")` 的结果 |
| `Set<T>` | 集合 | `load("batch/*.png")` → `Set<Mat>` |
| `Range` | 整数范围 | `range(col)` → `0..len(col)-1` |

### Set 操作

| 操作 | 写法 | 说明 |
|------|------|------|
| 长度 | `len(col)` | 返回元素个数 |
| 筛选 | `query from col with cond` | 过滤元素 |
| 并集 | `a \| b` | 合并两个集合（去重） |
| 交集 | `a & b` | 取公共元素 |
| 差集 | `a - b` | 取在 a 不在 b 的元素 |

`\|`, `&`, `-` 是运算符语法糖，内部转为对应的 HIR 指令。与数值运算共享符号，由类型推导区分。

## 三、内置函数

| 函数 | 说明 |
|------|------|
| `load(path)` | 加载文件，含通配符时返回集合 |
| `save(img, path)` | 保存图像到文件 |
| `print(...)` | 打印到终端 |
| `query from col with cond` | 从集合中筛选元素 |
| `range(col)` | 返回索引范围 |
| `len(col)` | 返回集合元素个数 |
| `sql(conn, stmt)` | 执行 SQL 查询 |

所有函数接受单值或集合，统一签名：

```python
# 单图
load("a.png") => find_circles() => query(area > 10)

# 批量（自动遍历）
load("*.png") => find_circles() => query(area > 10)
```

## 四、编译过程

```
源码 → Token → AST → 类型推导 → HIR → 目标代码
```

详细实现见 [Doc/compilation.md](Doc/compilation.md)。

## 五、未来规划

### 中文支持

支持中文关键字和中文标识符，脚本可完全用中文编写：

```python
# 未来可能的写法
从 路径 加载 "test.png"   => 找圆()   => 筛选(面积 > 10)
如果 条件:
    打印("合格")
```

实现方式：
- ID token 增加中文字符支持（UTF-8 范围）
- 关键字表增加中文别名：`如果`/`否则`/`定义`/`导入`/`从`/`筛选`等
- TokenStreamFilter / AST / HIR 层不需要改动，关键字在词法分析时映射为内部 token
- VS Code 扩展也需要增加中文语法高亮
