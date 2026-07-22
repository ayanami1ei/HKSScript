using HksScript.Interpreter;
using HksScript.Algorithms;
using HksScript.Lexer;
using HksScript.TypeChecker;
using HksScript.Lowering;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;
using System.Text.Json;

namespace HksScript.Cli;

public class Cli
{
    private FunctionTable funcTable = new();

    // ANSI 颜色
    const string Red    = "\u001b[31m";
    const string Green  = "\u001b[32m";
    const string Yellow = "\u001b[33m";
    const string Cyan   = "\u001b[36m";
    const string Bold   = "\u001b[1m";
    const string Reset  = "\u001b[0m";

    public Cli()
    {
        BuiltinRegistry.RegisterBuiltins(funcTable);
        ModuleInit.RegisterAll(funcTable);
    }

    public void Run(string[] args)
    {
        if (args.Length == 0) { PrintHelp(); return; }
        switch (args[0])
        {
            case "list":          ListFunctions();       break;
            case "check":         CheckFile(args[1]);    break;
            case "run":           RunFile(args[1]);      break;
            case "code-present":  CodePresent(args[1]);  break;
            default:              PrintHelp();           break;
        }
    }

    // ─── 管线 ───

    private (Ast.Program? ast, HksScriptParser.ProgramContext? tree) BuildAst(string path)
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
            Console.Error.WriteLine($"{Red}解析失败: {ex.Message}{Reset}");
            return (null, null);
        }

        return (ast, tree);
    }

    // ─── check 命令 ───

    private void CheckFile(string path)
    {
        var code = File.ReadAllText(path);
        var lines = code.Split('\n');
        var (ast, tree) = BuildAst(path);
        if (ast == null) return;

        var checker = new TypeChecker.TypeChecker();
        var result = checker.Check(ast);

        if (!result.HasErrors)
        {
            Console.WriteLine($"{Green}检查通过{Reset}");
            return;
        }

        foreach (var err in result.Errors)
        {
            int lineNum = FindErrorLine(err.Message, tree, lines);
            Console.Write($"{Red}error{Reset}");

            if (lineNum > 0)
                Console.Write($" {Cyan}{path}:{lineNum}{Reset}");

            Console.WriteLine($" {Bold}{err.Message}{Reset}");

            if (lineNum > 0 && lineNum <= lines.Length)
            {
                var line = lines[lineNum - 1].Replace("\r", "");
                Console.WriteLine($"  {Cyan}{lineNum,4} |{Reset} {line}");
                Console.WriteLine($"       {Yellow}^{Reset}");
            }
        }

        Console.WriteLine($"\n{Red}发现 {result.Errors.Count} 个错误{Reset}");
    }

    private static int FindErrorLine(string message, HksScriptParser.ProgramContext? tree, string[] lines)
    {
        // 从错误消息中提取标识符名称
        var name = "";
        foreach (var prefix in new[] { "未定义的变量: ", "未定义的函数: " })
        {
            if (message.StartsWith(prefix))
            {
                name = message[prefix.Length..].Trim();
                break;
            }
        }
        if (string.IsNullOrEmpty(name)) return -1;

        // 在源码中逐行查找
        for (int i = 0; i < lines.Length; i++)
        {
            if (lines[i].Contains(name))
                return i + 1;
        }
        return -1;
    }

    // ─── run 命令 ───

    private void RunFile(string path)
    {
        var (ast, _) = BuildAst(path);
        if (ast == null) return;

        var checker = new TypeChecker.TypeChecker();
        var result = checker.Check(ast);

        if (result.HasErrors)
        {
            Console.WriteLine($"{Red}类型错误，终止执行:{Reset}");
            foreach (var err in result.Errors)
                Console.WriteLine($"  {err.Message}");
            return;
        }

        var lowerer = new LoweringPass(funcTable);
        var hir = lowerer.Lower(ast);

        var vm = new HksScript.Interpreter.Interpreter(hir, funcTable);
        vm.Run();

        Console.WriteLine($"{Green}执行完成{Reset}");
    }

    // ─── code-present ───

    private void CodePresent(string path)
    {
        var presenter = new CodePresenter();
        var symbols = presenter.Present(path);
        var json = JsonSerializer.Serialize(symbols, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        Console.WriteLine(json);
    }

    private void ListFunctions()
    {
        Console.WriteLine("已注册的函数:");
        var names = new[] { "imread", "imwrite", "gray", "gaussian_blur", "median_blur", "canny",
                            "erode", "dilate", "threshold", "hough_circles",
                            "resize", "__init_basic" };
        foreach (var name in names)
        {
            try { funcTable.Find(name); Console.WriteLine($"  {name}"); }
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
