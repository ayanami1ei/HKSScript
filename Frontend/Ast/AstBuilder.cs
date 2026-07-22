using HksScript.Ast;

namespace HksScript.Lexer;

public class AstBuilder : HksScriptBaseVisitor<object?>
{
    public override object? VisitProgram(HksScriptParser.ProgramContext ctx)
    {
        var stmts = new List<Stmt>();
        foreach (var s in ctx.statement())
        {
            var result = Visit(s);
            if (result is Stmt stmt)
                stmts.Add(stmt);
        }
        return new Ast.Program(stmts);
    }

    public override object? VisitStatement(HksScriptParser.StatementContext ctx)
    {
        // 找到第一个 Stmt 子节点. VisitChildren 会返回最后一个子节点的结果
        // 但 statement: importStmt NEWLINE 中 NEWLINE 返回 null
        foreach (var child in ctx.children)
        {
            var result = Visit(child);
            if (result is Stmt) return result;
        }
        return null;
    }

    // ─── 语句 ───

    public override object? VisitImportStmt(HksScriptParser.ImportStmtContext ctx)
    {
        var names = ctx.ID().Select(id => id.GetText()).ToList();
        return new Import(names);
    }

    public override object? VisitAssignStmt(HksScriptParser.AssignStmtContext ctx)
    {
        var name = ctx.ID().GetText();
        var value = (Expr)Visit(ctx.expr())!;
        return new Assign(name, value);
    }

    public override object? VisitExprStmt(HksScriptParser.ExprStmtContext ctx)
    {
        var expr = (Expr)Visit(ctx.expr())!;
        return new ExprStmt(expr);
    }

    public override object? VisitReturnStmt(HksScriptParser.ReturnStmtContext ctx)
    {
        var value = ctx.expr() != null ? (Expr)Visit(ctx.expr())! : null;
        return new Return(value);
    }

    public override object? VisitIfStmt(HksScriptParser.IfStmtContext ctx)
    {
        int eidx = 0, bidx = 0;
        var cond = (Expr)Visit(ctx.expr(eidx++))!;
        var then = VisitBlock(ctx.block(bidx++));

        var elifs = new List<ElifClause>();
        while (eidx < ctx.expr().Length)
        {
            var econd = (Expr)Visit(ctx.expr(eidx++))!;
            var ebody = VisitBlock(ctx.block(bidx++));
            elifs.Add(new ElifClause(econd, ebody));
        }

        List<Stmt>? elseBody = ctx.KW_ELSE() != null
            ? VisitBlock(ctx.block(bidx))
            : null;

        return new If(cond, then, elifs, elseBody);
    }

    public override object? VisitFuncDef(HksScriptParser.FuncDefContext ctx)
    {
        var name = ctx.ID().GetText();
        var parms = ctx.paramList()?.param()
            .Select(p => VisitParam(p))
            .ToList() ?? new();
        var body = VisitBlock(ctx.block());

        TypeRef? retType = ctx.type_() != null
            ? VisitType_(ctx.type_())
            : null;

        return new FuncDef(name, parms, retType, body);
    }

    public ParamDef VisitParam(HksScriptParser.ParamContext ctx)
    {
        var name = ctx.ID().GetText();
        var type = VisitType_(ctx.type_());
        return new ParamDef(name, type);
    }

    public TypeRef VisitType_(HksScriptParser.Type_Context ctx)
    {
        var name = ctx.ID().GetText();
        TypeRef? generic = ctx.type_() != null
            ? VisitType_(ctx.type_())
            : null;
        return new TypeRef(name, generic);
    }

    private List<Stmt> VisitBlock(HksScriptParser.BlockContext ctx)
    {
        return ctx.statement()
            .Select(s => (Stmt)Visit(s)!)
            .ToList();
    }

    // ─── 表达式 ───

    public override object? VisitLiteralExpr(HksScriptParser.LiteralExprContext ctx)
    {
        var lit = ctx.literal();
        if (lit.INT() != null)    return new Literal(int.Parse(lit.INT().GetText()));
        if (lit.FLOAT() != null)  return new Literal(float.Parse(lit.FLOAT().GetText()));
        if (lit.STRING() != null) return new Literal(Unquote(lit.STRING().GetText()));
        if (lit.KW_TRUE() != null)  return new Literal(true);
        if (lit.KW_FALSE() != null) return new Literal(false);
        throw new Exception($"未知字面量: {lit.GetText()}");
    }

    public override object? VisitVarExpr(HksScriptParser.VarExprContext ctx)
    {
        return new Variable(ctx.ID().GetText());
    }

    public override object? VisitCallExpr(HksScriptParser.CallExprContext ctx)
    {
        var name = ctx.ID().GetText();
        var args = ctx.exprList()?.expr()
            .Select(e => (Expr)Visit(e)!)
            .ToList() ?? new();
        return new Call(name, args);
    }

    public override object? VisitQueryCallExpr(HksScriptParser.QueryCallExprContext ctx)
    {
        var args = ctx.exprList()?.expr()
            .Select(e => (Expr)Visit(e)!)
            .ToList() ?? new();
        return new Call("query", args);
    }

    public override object? VisitParenExpr(HksScriptParser.ParenExprContext ctx)
    {
        return Visit(ctx.expr());
    }

    // ─── 二元运算 ───

    public override object? VisitAddExpr(HksScriptParser.AddExprContext ctx)
    {
        var op = ctx.addOp().PLUS() != null ? BinaryOp.Add : BinaryOp.Sub;
        return new Binary(op, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitMulExpr(HksScriptParser.MulExprContext ctx)
    {
        var op = ctx.mulOp().MUL() != null ? BinaryOp.Mul : BinaryOp.Div;
        return new Binary(op, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitCompExpr(HksScriptParser.CompExprContext ctx)
    {
        var op = ctx.compOp() switch
        {
            var c when c.LT() != null => BinaryOp.Ls,
            var c when c.GT() != null => BinaryOp.Gr,
            var c when c.EQ() != null => BinaryOp.Eq,
            var c when c.NEQ() != null => BinaryOp.Neq,
            var c when c.LE() != null => BinaryOp.Le,
            var c when c.GE() != null => BinaryOp.Ge,
            _ => throw new Exception($"未知比较运算符")
        };
        return new Binary(op, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitOrExpr(HksScriptParser.OrExprContext ctx)
    {
        return new Binary(BinaryOp.Or,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitAndExpr(HksScriptParser.AndExprContext ctx)
    {
        return new Binary(BinaryOp.And,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitNotExpr(HksScriptParser.NotExprContext ctx)
    {
        return new Unary(UnaryOp.Not, (Expr)Visit(ctx.expr())!);
    }

    public override object? VisitUnionExpr(HksScriptParser.UnionExprContext ctx)
    {
        return new Binary(BinaryOp.Union,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitIntersectExpr(HksScriptParser.IntersectExprContext ctx)
    {
        return new Binary(BinaryOp.Intersect,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitDiffExpr(HksScriptParser.DiffExprContext ctx)
    {
        return new Binary(BinaryOp.Diff,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitPipeExpr(HksScriptParser.PipeExprContext ctx)
    {
        return new Pipe(
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!);
    }

    public override object? VisitQueryFromExpr(HksScriptParser.QueryFromExprContext ctx)
    {
        return new QueryFrom(
            (Expr)Visit(ctx.expr())!, (Expr)Visit(ctx.condition())!);
    }

    // ─── 工具 ───

    private static string Unquote(string s) => s[1..^1];
}
