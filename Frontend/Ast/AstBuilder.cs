using HksScript.Ast;
using Antlr4.Runtime;

namespace HksScript.Lexer;

public class AstBuilder : HksScriptBaseVisitor<object?>
{
    public override object? VisitProgram(HksScriptParser.ProgramContext ctx)
    {
        var stmts = new List<Stmt>();
        foreach (var s in ctx.statement())
        {
            var result = Visit(s);
            if (result is Stmt stmt) stmts.Add(stmt);
        }
        return new Ast.Program(stmts);
    }

    public override object? VisitStatement(HksScriptParser.StatementContext ctx)
    {
        foreach (var child in ctx.children)
        {
            var result = Visit(child);
            if (result is Stmt) return result;
        }
        return null;
    }

    public override object? VisitImportStmt(HksScriptParser.ImportStmtContext ctx)
    {
        var names = ctx.ID().Select(id => id.GetText()).ToList();
        return new Import(names) { Position = Pos(ctx) };
    }

    public override object? VisitAssignStmt(HksScriptParser.AssignStmtContext ctx)
    {
        return new Assign(ctx.ID().GetText(), (Expr)Visit(ctx.expr())!) { Position = Pos(ctx) };
    }

    public override object? VisitExprStmt(HksScriptParser.ExprStmtContext ctx)
    {
        return new ExprStmt((Expr)Visit(ctx.expr())!) { Position = Pos(ctx) };
    }

    public override object? VisitReturnStmt(HksScriptParser.ReturnStmtContext ctx)
    {
        var value = ctx.expr() != null ? (Expr)Visit(ctx.expr())! : null;
        return new Return(value) { Position = Pos(ctx) };
    }

    public override object? VisitIfStmt(HksScriptParser.IfStmtContext ctx)
    {
        int eidx = 0, bidx = 0;
        var cond = (Expr)Visit(ctx.expr(eidx++))!;
        var then = VisitBlock(ctx.block(bidx++));
        var elifs = new List<ElifClause>();
        while (eidx < ctx.expr().Length)
        {
            elifs.Add(new ElifClause((Expr)Visit(ctx.expr(eidx++))!, VisitBlock(ctx.block(bidx++))));
        }
        List<Stmt>? elseBody = ctx.KW_ELSE() != null ? VisitBlock(ctx.block(bidx)) : null;
        return new If(cond, then, elifs, elseBody) { Position = Pos(ctx) };
    }

    public override object? VisitFuncDef(HksScriptParser.FuncDefContext ctx)
    {
        var name = ctx.ID().GetText();
        var parms = ctx.paramList()?.param().Select(p => VisitParam(p)).ToList() ?? new();
        var body = VisitBlock(ctx.block());
        TypeRef? retType = ctx.type_() != null ? VisitType_(ctx.type_()) : null;
        return new FuncDef(name, parms, retType, body) { Position = Pos(ctx) };
    }

    public ParamDef VisitParam(HksScriptParser.ParamContext ctx)
        => new(ctx.ID().GetText(), VisitType_(ctx.type_()));

    public TypeRef VisitType_(HksScriptParser.Type_Context ctx)
    {
        var name = ctx.ID().GetText();
        TypeRef? generic = ctx.type_() != null ? VisitType_(ctx.type_()) : null;
        return new TypeRef(name, generic);
    }

    private List<Stmt> VisitBlock(HksScriptParser.BlockContext ctx)
        => ctx.statement().Select(s => (Stmt)Visit(s)!).ToList();

    public override object? VisitLiteralExpr(HksScriptParser.LiteralExprContext ctx)
    {
        var lit = ctx.literal();
        object? val = lit.INT() != null ? int.Parse(lit.INT().GetText())
            : lit.FLOAT() != null ? float.Parse(lit.FLOAT().GetText())
            : lit.STRING() != null ? Unquote(lit.STRING().GetText())
            : lit.KW_TRUE() != null ? true
            : lit.KW_FALSE() != null ? false
            : throw new Exception($"未知字面量: {lit.GetText()}");
        return new Literal(val) { Position = Pos(ctx) };
    }

    public override object? VisitVarExpr(HksScriptParser.VarExprContext ctx)
        => new Variable(ctx.ID().GetText()) { Position = Pos(ctx) };

    public override object? VisitCallExpr(HksScriptParser.CallExprContext ctx)
    {
        var args = ctx.exprList()?.expr().Select(e => (Expr)Visit(e)!).ToList() ?? new();
        return new Call(ctx.ID().GetText(), args) { Position = Pos(ctx) };
    }

    public override object? VisitQueryCallExpr(HksScriptParser.QueryCallExprContext ctx)
    {
        var args = ctx.exprList()?.expr().Select(e => (Expr)Visit(e)!).ToList() ?? new();
        return new Call("query", args) { Position = Pos(ctx) };
    }

    public override object? VisitParenExpr(HksScriptParser.ParenExprContext ctx)
        => Visit(ctx.expr());

    public override object? VisitAddExpr(HksScriptParser.AddExprContext ctx)
        => new Binary(ctx.addOp().PLUS() != null ? BinaryOp.Add : BinaryOp.Sub,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitMulExpr(HksScriptParser.MulExprContext ctx)
        => new Binary(ctx.mulOp().MUL() != null ? BinaryOp.Mul : BinaryOp.Div,
            (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

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
        return new Binary(op, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };
    }

    public override object? VisitOrExpr(HksScriptParser.OrExprContext ctx)
        => new Binary(BinaryOp.Or, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitAndExpr(HksScriptParser.AndExprContext ctx)
        => new Binary(BinaryOp.And, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitNotExpr(HksScriptParser.NotExprContext ctx)
        => new Unary(UnaryOp.Not, (Expr)Visit(ctx.expr())!) { Position = Pos(ctx) };

    public override object? VisitUnionExpr(HksScriptParser.UnionExprContext ctx)
        => new Binary(BinaryOp.Union, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitIntersectExpr(HksScriptParser.IntersectExprContext ctx)
        => new Binary(BinaryOp.Intersect, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitDiffExpr(HksScriptParser.DiffExprContext ctx)
        => new Binary(BinaryOp.Diff, (Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitPipeExpr(HksScriptParser.PipeExprContext ctx)
        => new Pipe((Expr)Visit(ctx.expr(0))!, (Expr)Visit(ctx.expr(1))!) { Position = Pos(ctx) };

    public override object? VisitQueryFromExpr(HksScriptParser.QueryFromExprContext ctx)
        => new QueryFrom((Expr)Visit(ctx.expr())!, (Expr)Visit(ctx.condition())!) { Position = Pos(ctx) };

    private static SourcePosition Pos(ParserRuleContext ctx) => new(ctx.Start.Line, ctx.Start.Column);
    private static string Unquote(string s) => s[1..^1];
}
