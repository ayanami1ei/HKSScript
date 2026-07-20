# HKS脚本语法

### 一、语法规则
&emsp; &emsp; 大部分语句无需写分号
1. 赋值语句<br>
使用let关键字表示赋值，类型由编译器自动推导
```
    let a = 1 //自动推导为整数类型
```

2. query语句<br>
所有可以表示某些数据的集合的对象都可以使用query方法，用于表示从这些对象里筛选出一部分符合条件的
```
    let res = circles.query condition //res类型为圆的集合，仅包含符合condition的圆
```

3. 函数
函数是一类特殊表达式，可以连续计算多个简单的表达式，可以赋给变量，调用时直接写参数即可，声明时需写上参数列表，语句结尾必须加分号;，最后一段表达式为该函数的返回值。
```
    let fn a b = 
                b = a + b
                b + 1; //声明

    let res = fn 1 2 //res为4

```

### 二、库
脚本自带一些基本的函数和算法

1. load string<br>
从第一个参数表示的路径里加载文件
2. save Mat string<br>
把图像保存到指定路径
3. print string<br>
打印到终端
4. println string<br>
打印到终端并换行
5. sql string string<br>
第一个参数表示连接到数据库的命令，第二个参数是sql语句
