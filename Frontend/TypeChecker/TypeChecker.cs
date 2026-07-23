using HksScript.Ast;
using HksScript.Module;

namespace HksScript.TypeChecker;

public class TypeError
{
    public string Message { get; set; } = "";
    public int Line { get; set; } = -1;

    public TypeError(string message, int line = -1)
    {
        Message = message;
        Line = line;
    }
}

public class CheckResult
{
    public List<TypeError> Errors { get; } = new();
    public bool HasErrors => Errors.Count > 0;
    public void Error(string message, int line = -1)
        => Errors.Add(new TypeError(message, line));
}

public class TypeChecker
{
    private readonly Module.SymbolTable symbols;
    private readonly CheckResult result = new();

    public TypeChecker() : this(new Module.SymbolTable()) { }

    public TypeChecker(Module.SymbolTable? existing)
    {
        symbols = existing ?? new Module.SymbolTable();
        RegisterBuiltins();
    }

    public CheckResult Check(Ast.Program program)
    {
        foreach (var stmt in program.Statements)
            VisitStmt(stmt);
        return result;
    }

    public string? ResolveType(string name)
        => symbols.ResolveVariable(name)?.Name;

    public string? ResolveFuncType(string name)
        => symbols.ResolveFuncType(name);

    public void EnterScope() => symbols.EnterScope();
    public void ExitScope() => symbols.ExitScope();
    public void DefineSymbol(string name, TypeRef type) => symbols.DefineVariable(name, type);

    private static int Line(Expr? e) => e?.Position?.Line ?? -1;
    private static int Line(Stmt? s) => s?.Position?.Line ?? -1;

    private void RegisterBuiltins()
    {
        // 内置运算符
        RegisterFunc("print",      new[] { "string" },             "void");
        RegisterFunc("print",      new[] { "int" },                "void");
        RegisterFunc("print",      new[] { "float" },              "void");
        RegisterFunc("print",      new[] { "bool" },               "void");
        RegisterFunc("query",      new[] { "Set<Circle>", "bool" },"Set<Circle>");
        RegisterFunc("range",      new[] { "Set<Circle>" },        "Range");
        RegisterFunc("len",        new[] { "Set<Circle>" },        "int");

        // 内置运算符
        RegisterFunc("__add",   new[] { "int", "int" },  "int");
        RegisterFunc("__sub",   new[] { "int", "int" },  "int");
        RegisterFunc("__mul",   new[] { "int", "int" },  "int");
        RegisterFunc("__div",   new[] { "int", "int" },  "int");
        RegisterFunc("__gt",    new[] { "int", "int" },  "bool");
        RegisterFunc("__ls",    new[] { "int", "int" },  "bool");
        RegisterFunc("__eq",    new[] { "int", "int" },  "bool");
        RegisterFunc("__neq",   new[] { "int", "int" },  "bool");
        RegisterFunc("__le",    new[] { "int", "int" },  "bool");
        RegisterFunc("__ge",    new[] { "int", "int" },  "bool");
        RegisterFunc("__and",   new[] { "bool", "bool" },"bool");
        RegisterFunc("__or",    new[] { "bool", "bool" },"bool");
        RegisterFunc("__not",   new[] { "bool" },        "bool");
        RegisterFunc("__union", new[] { "Set", "Set" },  "Set");
        RegisterFunc("__intersect", new[] { "Set", "Set" },"Set");
        RegisterFunc("__diff",  new[] { "Set", "Set" },  "Set");
    }

    public void RegisterFunc(string name, string[] paramTypes, string returnType)
    {
        symbols.RegisterFunction(name, paramTypes, returnType);
    }

    private void VisitStmt(Stmt stmt)
    {
        switch (stmt)
        {
            case Import i:       VisitImport(i);     break;
            case Assign a:       VisitAssign(a);     break;
            case FuncDef f:      VisitFuncDef(f);    break;
            case Return r:       VisitReturn(r);     break;
            case If ifStmt:      VisitIf(ifStmt);    break;
            case ExprStmt es:    InferExpr(es.Value); break;
        }
    }

    private void VisitImport(Import imp) { }

    private void VisitAssign(Assign assign)
    {
        var type = InferExpr(assign.Value);
        if (type != null)
            symbols.DefineVariable(assign.Name, type);
    }

    private void VisitFuncDef(FuncDef funcDef)
    {
        var paramTypes = funcDef.Params.Select(p => p.Type.Name).ToArray();
        var returnType = funcDef.ReturnType?.Name ?? "void";
        RegisterFunc(funcDef.Name, paramTypes, returnType);

        symbols.EnterScope();
        foreach (var param in funcDef.Params)
            symbols.DefineVariable(param.Name, param.Type);
        foreach (var stmt in funcDef.Body)
            VisitStmt(stmt);
        symbols.ExitScope();
    }

    private void VisitReturn(Return ret)
    {
        if (ret.Value != null) InferExpr(ret.Value);
    }

    private void VisitIf(If ifStmt)
    {
        InferExpr(ifStmt.Condition);
        symbols.EnterScope();
        foreach (var s in ifStmt.Then) VisitStmt(s);
        symbols.ExitScope();
        foreach (var elif in ifStmt.Elifs)
        {
            InferExpr(elif.Condition);
            symbols.EnterScope();
            foreach (var s in elif.Body) VisitStmt(s);
            symbols.ExitScope();
        }
        if (ifStmt.Else != null)
        {
            symbols.EnterScope();
            foreach (var s in ifStmt.Else) VisitStmt(s);
            symbols.ExitScope();
        }
    }

    private TypeRef? InferExpr(Expr expr)
    {
        return expr switch
        {
            Literal lit    => InferLiteral(lit),
            Variable var   => InferVariable(var),
            Call call      => InferCall(call),
            Binary bin     => InferBinary(bin),
            Unary unary    => InferUnary(unary),
            QueryFrom qf   => InferQueryFrom(qf),
            Pipe pipe      => InferPipe(pipe),
            _ => null
        };
    }

    private static TypeRef InferLiteral(Literal lit)
    {
        return lit.Value switch
        {
            int    => new TypeRef("int"),
            float  => new TypeRef("float"),
            string => new TypeRef("string"),
            bool   => new TypeRef("bool"),
            _      => new TypeRef("unknown")
        };
    }

    private TypeRef? InferVariable(Variable var)
    {
        var resolved = symbols.ResolveVariable(var.Name);
        if (resolved == null)
            result.Error($"未定义的变量: {var.Name}", Line(var));
        return resolved;
    }

    private TypeRef? InferCall(Call call)
    {
        var argTypes = call.Args.Select(a => InferExpr(a)).ToList();
        if (argTypes.Any(t => t == null)) return null;
        var argNames = argTypes.Select(t => t!.Name).ToArray();

        var matched = symbols.FindFunction(call.Name, argNames);
        if (matched == null)
        {
            // 尝试获取第一个签名用于错误信息
            var first = symbols.ResolveFuncType(call.Name);
            if (first == null)
            {
                result.Error($"未定义的函数: {call.Name}", Line(call));
                return null;
            }
            result.Error($"函数 {call.Name} 参数不匹配: 需要 {first}, 实际 ({string.Join(", ", argNames)})", Line(call));
            return null;
        }

        return new TypeRef(matched.ReturnType);
    }

    private TypeRef? InferBinary(Binary bin)
    {
        var left = InferExpr(bin.Left);
        var right = InferExpr(bin.Right);
        if (left == null || right == null) return null;

        if (left.Name == "int" && right.Name == "int")
        {
            if (IsComparison(bin.Op) || IsLogical(bin.Op))
                return new TypeRef("bool");
            return new TypeRef("int");
        }
        if (left.Name == "float" && right.Name == "float")
        {
            if (IsComparison(bin.Op)) return new TypeRef("bool");
            return new TypeRef("float");
        }
        if (left.Name == "bool" && right.Name == "bool" && IsLogical(bin.Op))
            return new TypeRef("bool");
        if (IsSetOp(bin.Op) && left.Name == right.Name)
            return left;
        if (IsComparison(bin.Op))
            return new TypeRef("bool");

        result.Error($"类型不匹配: {left.Name} {bin.Op} {right.Name}", Line(bin));
        return null;
    }

    private TypeRef? InferUnary(Unary unary)
    {
        var op = InferExpr(unary.Operand);
        if (op != null && op.Name != "bool")
            result.Error($"not 需要 bool 类型，实际 {op.Name}", Line(unary));
        return new TypeRef("bool");
    }

    private TypeRef? InferQueryFrom(QueryFrom qf)
    {
        InferExpr(qf.Collection);
        InferExpr(qf.Condition);
        return new TypeRef("Set<Circle>");
    }

    private TypeRef? InferPipe(Pipe pipe)
    {
        if (pipe.Right is Call call)
        {
            var leftType = InferExpr(pipe.Left);
            var funcType = symbols.ResolveFuncType(call.Name);
            if (funcType == null)
            {
                result.Error($"未定义的函数: {call.Name}", Line(call));
                return null;
            }

            // 从类型字符串 "(int,int)->int" 提取参数列表
            var paramMatch = System.Text.RegularExpressions.Regex.Match(funcType, @"\(([^)]*)\)");
            var paramNames = paramMatch.Success
                ? paramMatch.Groups[1].Value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                : [];

            // 找第一个类型匹配的参数位置
            var leftTypeName = leftType?.Name ?? "?";
            int insertAt = -1;
            for (int i = 0; i < paramNames.Length; i++)
            {
                if (paramNames[i] == leftTypeName)
                {
                    insertAt = i;
                    break;
                }
            }
            if (insertAt < 0) insertAt = 0;

            // 构建完整参数列表
            var argTypes = new List<TypeRef?>();
            for (int i = 0; i < paramNames.Length; i++)
            {
                if (i == insertAt)
                    argTypes.Add(leftType);
                else if (call.Args.Count > (i < insertAt ? i : i - 1))
                    argTypes.Add(InferExpr(call.Args[i < insertAt ? i : i - 1]));
                else
                    argTypes.Add(null);
            }

            pipe.PipeArgIndex = insertAt;

            var argNames = argTypes.Select(t => t?.Name ?? "?").ToArray();
            var matched = symbols.FindFunction(call.Name, argNames);

            if (matched == null)
            {
                result.Error($"pipe {call.Name} 参数不匹配: 需要 {funcType}, 实际 ({string.Join(", ", argNames)})", Line(pipe));
                return null;
            }

            return new TypeRef(matched.ReturnType);
        }

        return InferExpr(pipe.Right) ?? InferExpr(pipe.Left);
    }

    private static bool IsComparison(BinaryOp op) => op is
        BinaryOp.Ls or BinaryOp.Gr or BinaryOp.Eq
        or BinaryOp.Neq or BinaryOp.Le or BinaryOp.Ge;

    private static bool IsLogical(BinaryOp op) => op is
        BinaryOp.And or BinaryOp.Or;

    private static bool IsSetOp(BinaryOp op) => op is
        BinaryOp.Union or BinaryOp.Intersect or BinaryOp.Diff;
}

public record FunctionSig(string Name, string[] ParamTypes, string ReturnType);
