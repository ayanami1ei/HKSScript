using HksScript.Interpreter;
using HksScript.Algorithms;
using HksScript.Lexer;
using HksScript.TypeChecker;
using HksScript.Lowering;
using HksScript.Hir;
using Antlr4.Runtime;

namespace HksScript.Cli;

public class Cli
{
    private FunctionTable funcTable = new();

    public Cli()
    {
        ModuleInit.RegisterAll(funcTable);
    }

    public void Run(string[] args)
    {
        if (args.Length == 0)
        {
            PrintHelp();
            return;
        }

        switch (args[0])
        {
            case "list":
                ListFunctions();
                break;
            case "parse":
                ParseFile(args[1]);
                break;
            case "run":
                Console.Error.WriteLine("TODO: 执行脚本");
                break;
            default:
                PrintHelp();
                break;
        }
    }

    private void ParseFile(string path)
    {
        var code = File.ReadAllText(path);
        var stream = new AntlrInputStream(code);
        var lexer = new HksScriptLexer(stream);
        var filter = new TokenStreamFilter(lexer);
        var filtered = filter.Filter();
        var source = new FilteredTokenSource(filtered);
        var tokens = new CommonTokenStream(source);
        var parser = new HksScriptParser(tokens);
        parser.BuildParseTree = true;

        var tree = parser.program();
        var builder = new AstBuilder();
        Ast.Program? ast = null;
        try
        {
            ast = (Ast.Program)builder.Visit(tree)!;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"AST 构建失败: {ex.Message}");
            return;
        }

        Console.WriteLine("=== AST ===");
        PrintAst(Console.Out, ast, 0);

        var checker = new TypeChecker.TypeChecker();
        var checkResult = checker.Check(ast);
        if (checkResult.HasErrors)
        {
            Console.WriteLine("\n=== 类型错误 ===");
            foreach (var err in checkResult.Errors)
                Console.WriteLine($"  {err}");
        }
        else
        {
            Console.WriteLine("\n类型检查通过");
        }

        // Lowering → HIR
        var lowerer = new LoweringPass();
        var hir = lowerer.Lower(ast);
        Console.WriteLine($"\n=== HIR ({hir.Length} 条指令) ===");
        foreach (var node in hir)
        {
            var name = node.Type.ToString();
            var extra = node switch
            {
                Call c     => $"{c.Name}({string.Join(", ", c.Args)})",
                New n      => $"var{n.Var}={n.ConstValue?.ToString() ?? "?"}",
                Assign a   => $"{a.Lhs} <- {a.Rhs}",
                Branch b   => $"if t{b.Cond} then[{b.Then.Length}] else[{b.Else?.Length}]",
                Return r   => $"t{r.Var}",
                Import im  => $"[{string.Join(", ", im.Imported ?? [])}]",
                _          => ""
            };
            Console.WriteLine($"  t{node.Id,-3} {name,-8} {extra}");
        }
    }

    static void PrintAst(TextWriter w, object? node, int depth)
    {
        if (node == null) return;
        var i = new string(' ', depth * 2);
        w.Write(i);

        switch (node)
        {
            case Ast.Program p:
                w.WriteLine("Program");
                foreach (var s in p.Statements) PrintAst(w, s, depth + 1);
                break;

            case Ast.Import imp:
                w.WriteLine($"Import [{string.Join(", ", imp.Names)}]");
                break;

            case Ast.Assign a:
                w.Write($"Assign {a.Name} = ");
                PrintAst(w, a.Value, 0);
                w.WriteLine();
                break;

            case Ast.Return r:
                w.Write("Return ");
                PrintAst(w, r.Value, 0);
                w.WriteLine();
                break;

            case Ast.If iff:
                w.Write("If ");
                PrintAst(w, iff.Condition, 0);
                w.WriteLine();
                foreach (var s in iff.Then) PrintAst(w, s, depth + 1);
                foreach (var e in iff.Elifs)
                {
                    w.Write($"{i}  Elif ");
                    PrintAst(w, e.Condition, 0);
                    w.WriteLine();
                    foreach (var s in e.Body) PrintAst(w, s, depth + 2);
                }
                if (iff.Else != null)
                {
                    w.WriteLine($"{i}  Else:");
                    foreach (var s in iff.Else) PrintAst(w, s, depth + 2);
                }
                break;

            case Ast.FuncDef f:
                var ps = string.Join(", ", f.Params.Select(p => $"{p.Name}: {p.Type.Name}"));
                w.WriteLine($"FuncDef {f.Name}({ps}) -> {f.ReturnType?.Name ?? "void"}");
                foreach (var s in f.Body) PrintAst(w, s, depth + 1);
                break;

            case Ast.Call c:
                w.Write($"Call {c.Name}({string.Join(", ", c.Args.Select(a => AstStr(a)))})");
                break;

            case Ast.Binary b:
                w.Write($"({AstStr(b.Left)} {b.Op} {AstStr(b.Right)})");
                break;

            case Ast.Unary u:
                w.Write($"(not {AstStr(u.Operand)})");
                break;

            case Ast.Variable v:
                w.Write(v.Name);
                break;

            case Ast.Literal l:
                w.Write(l.Value?.ToString() ?? "nil");
                break;

            case Ast.QueryFrom q:
                w.Write($"query from {AstStr(q.Collection)} with {AstStr(q.Condition)}");
                break;

            case Ast.Pipe p:
                w.Write($"({AstStr(p.Left)} => {AstStr(p.Right)})");
                break;

            case Ast.ExprStmt es:
                w.WriteLine($"Expr {AstStr(es.Value)}");
                break;
        }
    }

    static string AstStr(object? node)
    {
        var sw = new StringWriter();
        PrintAst(sw, node, 0);
        return sw.ToString()!.TrimEnd();
    }

    private void ListFunctions()
    {
        Console.WriteLine("已注册的函数:");
        var names = new[] { "imread", "imwrite", "gray", "gaussian_blur", "median_blur", "canny",
                            "erode", "dilate", "threshold", "hough_circles",
                            "resize", "__init_basic" };
        foreach (var name in names)
        {
            try
            {
                funcTable.Find(name);
                Console.WriteLine($"  {name}");
            }
            catch { }
        }
    }

    private void PrintHelp()
    {
        Console.WriteLine("用法: dotnet run -- <命令>");
        Console.WriteLine("命令:");
        Console.WriteLine("  list      列出已注册的算法函数");
        Console.WriteLine("  parse <文件>  解析脚本并输出AST");
        Console.WriteLine("  run <文件>    执行脚本（待实现）");
    }
}
