using AstNode = HksScript.Ast;
using HirNode = HksScript.Hir;
using HksScript.Interpreter;

namespace HksScript.Lowering;

public class LoweringPass
{
    private int nextId;
    private readonly Dictionary<string, int> env = new();
    private readonly FunctionTable? funcTable;

    public LoweringPass(FunctionTable? funcTable = null)
    {
        this.funcTable = funcTable;
    }

    public HirNode.HirBasicNode[] Lower(AstNode.Program program)
    {
        var result = new List<HirNode.HirBasicNode>();
        foreach (var stmt in program.Statements)
            LowerStmt(stmt, result);
        return result.ToArray();
    }

    private int NewId() => nextId++;

    private void LowerStmt(AstNode.Stmt stmt, List<HirNode.HirBasicNode> result)
    {
        switch (stmt)
        {
            case AstNode.Import i:       LowerImport(i, result);   break;
            case AstNode.Assign a:       LowerAssign(a, result);   break;
            case AstNode.FuncDef f:      LowerFuncDef(f);          break;
            case AstNode.Return r:       LowerReturn(r, result);   break;
            case AstNode.If ifStmt:      LowerIf(ifStmt, result);  break;
            case AstNode.ExprStmt es:    LowerExpr(es.Value, result); break;
        }
    }

    private void LowerImport(AstNode.Import imp, List<HirNode.HirBasicNode> result)
    {
        result.Add(new HirNode.Import(NewId(), imp.Names.ToArray()));
    }

    private void LowerAssign(AstNode.Assign assign, List<HirNode.HirBasicNode> result)
    {
        var rhsId = LowerExpr(assign.Value, result);

        if (env.TryGetValue(assign.Name, out var lhsId))
            result.Add(new HirNode.Assign(NewId(), rhsId, lhsId));
        else
            env[assign.Name] = rhsId;
    }

    private void LowerFuncDef(AstNode.FuncDef funcDef)
    {
        if (funcTable == null) return;

        var bodyLowerer = new LoweringPass(null);
        bodyLowerer.nextId = nextId;

        var paramIds = new List<int>();
        foreach (var param in funcDef.Params)
        {
            var id = bodyLowerer.NewId();
            bodyLowerer.env[param.Name] = id;
            paramIds.Add(id);
        }

        var body = new List<HirNode.HirBasicNode>();
        foreach (var s in funcDef.Body)
            bodyLowerer.LowerStmt(s, body);

        nextId = bodyLowerer.nextId;

        var scriptFunc = new ScriptFunction(
            funcDef.Name,
            funcDef.Params.Select(p => p.Name).ToArray(),
            paramIds.ToArray(),
            body.ToArray());

        funcTable.Register(funcDef.Name, scriptFunc);
    }

    private void LowerReturn(AstNode.Return ret, List<HirNode.HirBasicNode> result)
    {
        int varId = ret.Value != null ? LowerExpr(ret.Value, result) : -1;
        result.Add(new HirNode.Return(NewId(), -1, varId));
    }

    private void LowerIf(AstNode.If ifStmt, List<HirNode.HirBasicNode> result)
    {
        var condId = LowerExpr(ifStmt.Condition, result);

        var thenBlock = new List<HirNode.HirBasicNode>();
        foreach (var s in ifStmt.Then) LowerStmt(s, thenBlock);

        List<HirNode.HirBasicNode>? elseBlock = null;
        if (ifStmt.Else != null)
        {
            elseBlock = new List<HirNode.HirBasicNode>();
            foreach (var s in ifStmt.Else) LowerStmt(s, elseBlock);
        }

        result.Add(new HirNode.Branch(NewId(), condId,
            thenBlock.ToArray(), elseBlock?.ToArray()));
    }

    private int LowerExpr(AstNode.Expr expr, List<HirNode.HirBasicNode> result)
    {
        return expr switch
        {
            AstNode.Literal lit    => LowerLiteral(lit, result),
            AstNode.Variable var   => LowerVariable(var),
            AstNode.Call call      => LowerCall(call, result),
            AstNode.Binary bin     => LowerBinary(bin, result),
            AstNode.Unary unary    => LowerUnary(unary, result),
            AstNode.QueryFrom qf   => LowerQueryFrom(qf, result),
            AstNode.Pipe pipe      => LowerPipe(pipe, result),
            _ => throw new Exception($"不支持的表达式: {expr.GetType()}")
        };
    }

    private int LowerLiteral(AstNode.Literal lit, List<HirNode.HirBasicNode> result)
    {
        var id = NewId();
        var typeName = lit.Value switch
        {
            int    => "int",
            float  => "float",
            string => "string",
            bool   => "bool",
            _      => "unknown"
        };
        result.Add(new HirNode.New(id, id, typeName, lit.Value));
        return id;
    }

    private int LowerVariable(AstNode.Variable var)
    {
        if (env.TryGetValue(var.Name, out var id))
            return id;
        throw new Exception($"未定义的变量: {var.Name}");
    }

    private int LowerCall(AstNode.Call call, List<HirNode.HirBasicNode> result)
    {
        var argIds = call.Args.Select(a => LowerExpr(a, result)).ToArray();
        var id = NewId();
        result.Add(new HirNode.Call(id, call.Name, argIds));
        return id;
    }

    private int LowerBinary(AstNode.Binary bin, List<HirNode.HirBasicNode> result)
    {
        var leftId = LowerExpr(bin.Left, result);
        var rightId = LowerExpr(bin.Right, result);
        var name = bin.Op switch
        {
            AstNode.BinaryOp.Add       => "__add",
            AstNode.BinaryOp.Sub       => "__sub",
            AstNode.BinaryOp.Mul       => "__mul",
            AstNode.BinaryOp.Div       => "__div",
            AstNode.BinaryOp.Gr        => "__gt",
            AstNode.BinaryOp.Ls        => "__ls",
            AstNode.BinaryOp.Eq        => "__eq",
            AstNode.BinaryOp.Neq       => "__neq",
            AstNode.BinaryOp.Le        => "__le",
            AstNode.BinaryOp.Ge        => "__ge",
            AstNode.BinaryOp.And       => "__and",
            AstNode.BinaryOp.Or        => "__or",
            AstNode.BinaryOp.Union     => "__union",
            AstNode.BinaryOp.Intersect => "__intersect",
            AstNode.BinaryOp.Diff      => "__diff",
            _ => throw new Exception($"未知运算符: {bin.Op}")
        };
        var id = NewId();
        result.Add(new HirNode.Call(id, name, [leftId, rightId]));
        return id;
    }

    private int LowerUnary(AstNode.Unary unary, List<HirNode.HirBasicNode> result)
    {
        var operandId = LowerExpr(unary.Operand, result);
        var id = NewId();
        result.Add(new HirNode.Call(id, "__not", [operandId]));
        return id;
    }

    private int LowerQueryFrom(AstNode.QueryFrom qf, List<HirNode.HirBasicNode> result)
    {
        var collId = LowerExpr(qf.Collection, result);
        var condId = LowerExpr(qf.Condition, result);
        var id = NewId();
        result.Add(new HirNode.Call(id, "query", [collId, condId]));
        return id;
    }

    private int LowerPipe(AstNode.Pipe pipe, List<HirNode.HirBasicNode> result)
    {
        var leftId = LowerExpr(pipe.Left, result);

        if (pipe.Right is AstNode.Call call)
        {
            var allArgs = new List<int>();
            for (int i = 0; i < call.Args.Count + 1; i++)
            {
                if (i == pipe.PipeArgIndex)
                    allArgs.Add(leftId);
                else
                    allArgs.Add(LowerExpr(call.Args[i < pipe.PipeArgIndex ? i : i - 1], result));
            }
            var id = NewId();
            result.Add(new HirNode.Call(id, call.Name, allArgs.ToArray()));
            return id;
        }

        throw new Exception("pipe 右侧必须是函数调用");
    }
}
