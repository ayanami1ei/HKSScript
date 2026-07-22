using HksScript.Interpreter;
using HksScript.Algorithms;
using HksScript.Lexer;
using HksScript.TypeChecker;
using HksScript.Lowering;
using Antlr4.Runtime;

namespace HksScript.Cli;

public class Cli
{
    private FunctionTable funcTable = new();

    public Cli()
    {
        BuiltinRegistry.RegisterBuiltins(funcTable);
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
            case "check":
                CheckFile(args[1]);
                break;
            case "run":
                RunFile(args[1]);
                break;
            default:
                PrintHelp();
                break;
        }
    }

    // ─── 管线：源码 → AST ───

    private Ast.Program? BuildAst(string path, out CheckResult? checkResult)
    {
        checkResult = null;
        var code = File.ReadAllText(path);
        var stream = new AntlrInputStream(code);
        var lexer = new HksScriptLexer(stream);
        var filter = new TokenStreamFilter(lexer);
        var filtered = filter.Filter();
        var source = new FilteredTokenSource(filtered);
        var tokens = new CommonTokenStream(source);
        var parser = new HksScriptParser(tokens);
        parser.BuildParseTree = true;
        parser.RemoveErrorListeners();

        var tree = parser.program();
        var builder = new AstBuilder();
        Ast.Program? ast = null;
        try
        {
            ast = (Ast.Program)builder.Visit(tree)!;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"解析失败: {ex.Message}");
            return null;
        }

        var checker = new TypeChecker.TypeChecker();
        checkResult = checker.Check(ast);
        return ast;
    }

    // ─── check 命令 ───

    private void CheckFile(string path)
    {
        var ast = BuildAst(path, out var checkResult);
        if (ast == null) return;

        bool hasError = false;

        if (checkResult!.HasErrors)
        {
            Console.WriteLine("类型错误:");
            foreach (var err in checkResult.Errors)
            {
                Console.WriteLine($"  {err}");
                hasError = true;
            }
        }

        if (!hasError)
            Console.WriteLine("检查通过");
    }

    // ─── run 命令 ───

    private void RunFile(string path)
    {
        var ast = BuildAst(path, out var checkResult);
        if (ast == null) return;

        if (checkResult!.HasErrors)
        {
            Console.WriteLine("类型错误，终止执行:");
            foreach (var err in checkResult.Errors)
                Console.WriteLine($"  {err}");
            return;
        }

        var lowerer = new LoweringPass(funcTable);
        var hir = lowerer.Lower(ast);

        var vm = new HksScript.Interpreter.Interpreter(hir, funcTable);
        vm.Run();

        Console.WriteLine("执行完成");
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
        Console.WriteLine("用法: dotnet run -- <命令> [参数]");
        Console.WriteLine("命令:");
        Console.WriteLine("  list             列出已注册的算法函数");
        Console.WriteLine("  check <文件>     检查脚本类型");
        Console.WriteLine("  run <文件>       执行脚本");
    }
}
