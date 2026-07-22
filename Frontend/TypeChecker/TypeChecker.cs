using HksScript.Ast;

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
    private readonly SymbolTable symbols = new();
    private readonly CheckResult result = new();
    private readonly Dictionary<string, List<FunctionSig>> functions = new();

    public TypeChecker()
    {
        RegisterBuiltins();
    }

    public CheckResult Check(Ast.Program program)
    {
        foreach (var stmt in program.Statements)
            VisitStmt(stmt);
        return result;
    }

    public string? ResolveType(string name)
        => symbols.Resolve(name)?.Name;

    public string? ResolveFuncType(string name)
    {
        if (functions.TryGetValue(name, out var sigs) && sigs.Count > 0)
        {
            var s = sigs[0];
            return $"({string.Join(",", s.ParamTypes)})->{s.ReturnType}";
        }
        return null;
    }

    private static int Line(Expr? e) => e?.Position?.Line ?? -1;
    private static int Line(Stmt? s) => s?.Position?.Line ?? -1;

    private void RegisterBuiltins()
    {
        RegisterFunc("load",       new[] { "string" },             "Mat");
        RegisterFunc("imread",     new[] { "string" },             "Mat");
        RegisterFunc("imwrite",    new[] { "string", "Mat" },      "void");
        RegisterFunc("gray",       new[] { "Mat" },                "Mat");
        RegisterFunc("gaussian_blur", new[] { "Mat", "float" },    "Mat");
        RegisterFunc("median_blur",  new[] { "Mat", "int" },      "Mat");
        RegisterFunc("canny",      new[] { "Mat", "float", "float" },"Mat");
        RegisterFunc("erode",      new[] { "Mat", "int" },         "Mat");
        RegisterFunc("dilate",     new[] { "Mat", "int" },         "Mat");
        RegisterFunc("threshold",  new[] { "Mat", "float", "float" },"Mat");
        RegisterFunc("hough_circles", new[] { "Mat", "float", "float" },"Set<Circle>");
        RegisterFunc("resize",     new[] { "Mat", "float" },       "Mat");
        RegisterFunc("find_circles", new[] { "Mat" },              "Set<Circle>");
        RegisterFunc("save",       new[] { "Mat", "string" },      "void");
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
        if (!functions.ContainsKey(name))
            functions[name] = new List<FunctionSig>();
        functions[name].Add(new FunctionSig(name, paramTypes, returnType));
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
            symbols.Define(assign.Name, type);
    }

    private void VisitFuncDef(FuncDef funcDef)
    {
        var paramTypes = funcDef.Params.Select(p => p.Type.Name).ToArray();
        var returnType = funcDef.ReturnType?.Name ?? "void";
        RegisterFunc(funcDef.Name, paramTypes, returnType);

        symbols.EnterScope();
        foreach (var param in funcDef.Params)
            symbols.Define(param.Name, param.Type);
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
        var resolved = symbols.Resolve(var.Name);
        if (resolved == null)
            result.Error($"未定义的变量: {var.Name}", Line(var));
        return resolved;
    }

    private TypeRef? InferCall(Call call)
    {
        if (!functions.TryGetValue(call.Name, out var sigs))
        {
            result.Error($"未定义的函数: {call.Name}", Line(call));
            return null;
        }

        var argTypes = call.Args.Select(a => InferExpr(a)).ToList();
        if (argTypes.Any(t => t == null)) return null;

        var argNames = argTypes.Select(t => t!.Name).ToArray();

        var matched = sigs.FirstOrDefault(s =>
            s.ParamTypes.Length == argNames.Length &&
            s.ParamTypes.SequenceEqual(argNames));

        if (matched == null)
        {
            var expected = sigs[0].ParamTypes.Length == argNames.Length
                ? string.Join(", ", sigs[0].ParamTypes)
                : $"{sigs[0].ParamTypes.Length}个参数";
            result.Error($"函数 {call.Name} 参数不匹配: 需要 ({expected}), 实际 ({string.Join(", ", argNames)})", Line(call));
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
        // a => f(b) → 类型检查时模拟 lowering: f(左值类型, 右参数类型)
        if (pipe.Right is Call call)
        {
            var leftType = InferExpr(pipe.Left);
            var argTypes = new List<TypeRef?> { leftType };
            argTypes.AddRange(call.Args.Select(InferExpr));

            if (!functions.TryGetValue(call.Name, out var sigs))
            {
                result.Error($"未定义的函数: {call.Name}", Line(call));
                return null;
            }

            var argNames = argTypes.Select(t => t?.Name ?? "?").ToArray();
            var matched = sigs.FirstOrDefault(s =>
                s.ParamTypes.Length == argNames.Length &&
                s.ParamTypes.SequenceEqual(argNames));

            if (matched == null)
            {
                result.Error($"pipe {call.Name} 参数不匹配: 需要 ({string.Join(", ", sigs[0].ParamTypes)}), 实际 ({string.Join(", ", argNames)})", Line(pipe));
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
