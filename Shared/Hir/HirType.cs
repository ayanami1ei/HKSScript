public enum BinaryOp
{
    Add, Sub, Mul, Div,
    And, Or,
    Eq, Neq, Gr, Ls, Ge, Le,
}

public enum HirType
{
    Const,          //字面常量
    Binary,         //二元运算，详见 BinaryOp
    Unary,          //一元运算 (Not)

    //控制流
    Call,           //函数调用
    Return,         //函数返回
    Branch,         //条件分支

    //变量
    Assign,         //变量赋值
    New,            //声明变量

    Import,         //导入模块
}
