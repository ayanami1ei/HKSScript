namespace HksScript.Ast;

public record SourcePosition(int Line, int Column);

// ─── 语句 ───

public abstract record Stmt
{
    public SourcePosition? Position { get; init; }
}

public record Program(List<Stmt> Statements);

public record Assign(string Name, Expr Value) : Stmt();

public record FuncDef(string Name, List<ParamDef> Params, TypeRef? ReturnType, List<Stmt> Body) : Stmt();

public record ParamDef(string Name, TypeRef Type);

public record TypeRef(string Name, TypeRef? GenericArg = null);

public record Import(List<string> Names) : Stmt();

public record If(Expr Condition, List<Stmt> Then, List<ElifClause> Elifs, List<Stmt>? Else) : Stmt();

public record ElifClause(Expr Condition, List<Stmt> Body);

public record Return(Expr? Value) : Stmt();

public record ExprStmt(Expr Value) : Stmt();

// ─── 表达式 ───

public abstract record Expr
{
    public SourcePosition? Position { get; init; }
}

public record Literal(object Value) : Expr();

public record Variable(string Name) : Expr();

public record Call(string Name, List<Expr> Args) : Expr();

public record Binary(BinaryOp Op, Expr Left, Expr Right) : Expr();

public enum BinaryOp
{
    Add, Sub, Mul, Div,
    And, Or,
    Eq, Neq, Gr, Ls, Ge, Le,
    Union, Intersect, Diff,
}

public record Unary(UnaryOp Op, Expr Operand) : Expr();

public enum UnaryOp { Not }

public record QueryFrom(Expr Collection, Expr Condition) : Expr();

public record Pipe(Expr Left, Expr Right) : Expr
{
    // 类型推断后设置：pipe 结果应插入到函数参数的第几个位置（0-based）
    public int PipeArgIndex { get; set; } = 0;
}
