using System.Text.Json;
using System.Text.Json.Serialization;
using HksScript.Lexer;

namespace HksScript.Cli;

public class SymbolInfo
{
    [JsonPropertyName("name")]   public string Name { get; set; } = "";
    [JsonPropertyName("kind")]   public string Kind { get; set; } = "";
    [JsonPropertyName("type")]   public string Type { get; set; } = "";
    [JsonPropertyName("line")]   public int Line { get; set; }
    [JsonPropertyName("column")] public int Column { get; set; }
    [JsonPropertyName("length")] public int Length { get; set; }
}

public class CodePresenter
{
    public List<SymbolInfo> Present(string sourcePath)
    {
        var code = File.ReadAllText(sourcePath);
        var stream = new Antlr4.Runtime.AntlrInputStream(code);
        var lexer = new HksScriptLexer(stream);
        var filter = new TokenStreamFilter(lexer);
        var filtered = filter.Filter();
        var source = new FilteredTokenSource(filtered);
        var tokens = new Antlr4.Runtime.CommonTokenStream(source);
        var parser = new HksScriptParser(tokens);
        parser.BuildParseTree = true;

        var tree = parser.program();
        var builder = new AstBuilder();
        var ast = (Ast.Program)builder.Visit(tree)!;

        var checker = new TypeChecker.TypeChecker();
        checker.Check(ast);

        var symbols = new List<SymbolInfo>();

        // 从 ANTLR parse tree 收集符号位置
        var walker = new Antlr4.Runtime.Tree.ParseTreeWalker();
        var collector = new SymbolCollector(symbols, checker, ast);
        walker.Walk(collector, tree);

        return symbols;
    }
}

class SymbolCollector : HksScriptBaseListener
{
    private readonly List<SymbolInfo> symbols;
    private readonly TypeChecker.TypeChecker checker;

    public SymbolCollector(List<SymbolInfo> symbols, TypeChecker.TypeChecker checker, Ast.Program ast)
    {
        this.symbols = symbols;
        this.checker = checker;
    }

    public override void EnterAssignStmt(HksScriptParser.AssignStmtContext ctx)
    {
        var id = ctx.ID();
        var name = id.GetText();
        var type = checker.ResolveType(name) ?? "?";

        symbols.Add(new SymbolInfo
        {
            Name = name, Kind = "variable", Type = type,
            Line = id.Symbol.Line, Column = id.Symbol.Column,
            Length = name.Length
        });
    }

    public override void EnterFuncDef(HksScriptParser.FuncDefContext ctx)
    {
        var id = ctx.ID();
        var name = id.GetText();
        var retType = ctx.type_()?.GetText() ?? "void";
        var paramTypes = ctx.paramList()?.param()
            .Select(p => $"{p.ID()}:{p.type_().GetText()}")
            .ToList() ?? new();

        symbols.Add(new SymbolInfo
        {
            Name = name, Kind = "function",
            Type = $"({string.Join(",", paramTypes)})->{retType}",
            Line = id.Symbol.Line, Column = id.Symbol.Column,
            Length = name.Length
        });

        // 收集参数
        if (ctx.paramList() != null)
        {
            foreach (var p in ctx.paramList().param())
            {
                var pid = p.ID();
                var pname = pid.GetText();
                symbols.Add(new SymbolInfo
                {
                    Name = pname, Kind = "variable",
                    Type = p.type_().GetText(),
                    Line = pid.Symbol.Line, Column = pid.Symbol.Column,
                    Length = pname.Length
                });
            }
        }
    }

    public override void EnterExprStmt(HksScriptParser.ExprStmtContext ctx)
    {
        // 表达式语句中的函数调用
        if (ctx.expr() is HksScriptParser.CallExprContext call)
        {
            var id = call.ID();
            var name = id.GetText();
            var resolved = checker.ResolveType(name);

            symbols.Add(new SymbolInfo
            {
                Name = name, Kind = "function", Type = checker.ResolveFuncType(name) ?? "?",
                Line = id.Symbol.Line, Column = id.Symbol.Column,
                Length = name.Length
            });
        }
    }

    public override void EnterVarExpr(HksScriptParser.VarExprContext ctx)
    {
        var id = ctx.ID();
        var name = id.GetText();
        if (string.IsNullOrEmpty(name)) return;

        var kind = checker.ResolveFuncType(name) != null ? "function" : "variable";
        var type = kind == "function"
            ? checker.ResolveFuncType(name) ?? "?"
            : checker.ResolveType(name) ?? "?";

        symbols.Add(new SymbolInfo
        {
            Name = name, Kind = kind, Type = type,
            Line = id.Symbol.Line, Column = id.Symbol.Column,
            Length = name.Length
        });
    }
}
