using HksScript.Interpreter;
using HksScript.Algorithms;
using HksScript.Lexer;
using HksScript.TypeChecker;
using HksScript.Lowering;
using HksScript.Module;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;
using System.Text.Json;
using System.Reflection;

namespace HksScript.Cli;

public class Cli
{
    private FunctionTable funcTable = new();
    private LibraryManager libManager = new();
    private Module.SymbolTable? _symbols;

    // 共享符号表，供代码生成等使用
    public Module.SymbolTable Symbols =>
        _symbols ??= libManager.RegisterSymbols();

    // ANSI 颜色
    const string Red    = "\u001b[31m";
    const string Green  = "\u001b[32m";
    const string Yellow = "\u001b[33m";
    const string Cyan   = "\u001b[36m";
    const string Bold   = "\u001b[1m";
    const string Reset  = "\u001b[0m";

    public Cli()
    {
        libManager.ScanModules();
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
            case "diagnose":      DiagnoseFile(args[1]); break;
            case "run":           RunFile(args[1]);      break;
            case "code-present":  CodePresent(args[1]);  break;
            case "hint":
                if (args.Length >= 4)
                    HintFile(args[1], int.Parse(args[2]), int.Parse(args[3]));
                else
                    Console.Error.WriteLine("用法: hint <文件> <行号> <列号>");
                break;
            case "install":
                if (args.Length >= 3)
                    InstallModule(args[1], args[2]);
                else
                    Console.Error.WriteLine("用法: install <std|global|project> <dll路径>");
                break;
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

    private TypeChecker.TypeChecker MakeChecker()
    {
        return new TypeChecker.TypeChecker(libManager.RegisterSymbols());
    }

    private void CheckFile(string path)
    {
        var code = File.ReadAllText(path);
        var lines = code.Split('\n');
        var (ast, tree) = BuildAst(path);
        if (ast == null) return;

        var checker = MakeChecker();
        var result = checker.Check(ast);

        if (!result.HasErrors)
        {
            Console.WriteLine($"{Green}检查通过{Reset}");
            return;
        }

        foreach (var err in result.Errors)
        {
            int lineNum = err.Line > 0 ? err.Line : FindErrorLine(err.Message, tree, lines);
            if (lineNum <= 0) lineNum = 1;
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

    // ─── diagnose 命令（JSON 格式错误）───

    private void DiagnoseFile(string path)
    {
        var (ast, tree) = BuildAst(path);
        var errors = new List<object>();

        if (ast != null)
        {
        var checker = MakeChecker();
            var result = checker.Check(ast);

            // 遍历 ANTLR 树，收集所有标识符的位置
            var idPositions = new Dictionary<string, (int line, int col)>();
            if (tree != null)
            {
                var walker = new ParseTreeWalker();
                walker.Walk(new IdPositionListener(idPositions), tree);
            }

            foreach (var err in result.Errors)
            {
                // 优先用 AST 位置，其次用 ANTLR 树查标识符
                int line = err.Line > 0 ? err.Line : 1;
                if (line <= 1)
                {
                    foreach (var prefix in new[] { "未定义的变量: ", "未定义的函数: " })
                    {
                        if (err.Message.StartsWith(prefix))
                        {
                            var name = err.Message[prefix.Length..].Trim();
                            if (idPositions.TryGetValue(name, out var pos))
                                line = pos.line;
                            break;
                        }
                    }
                }
                errors.Add(new { message = err.Message, line, column = 0 });
            }
        }

        Console.WriteLine(JsonSerializer.Serialize(errors));
    }

    class IdPositionListener : HksScriptBaseListener
    {
        private readonly Dictionary<string, (int line, int col)> _positions;
        public IdPositionListener(Dictionary<string, (int line, int col)> positions) => _positions = positions;

        public override void EnterVarExpr(HksScriptParser.VarExprContext ctx)
        {
            var id = ctx.ID();
            var name = id.GetText();
            if (!string.IsNullOrEmpty(name) && !_positions.ContainsKey(name))
                _positions[name] = (id.Symbol.Line, id.Symbol.Column);
        }

        public override void EnterCallExpr(HksScriptParser.CallExprContext ctx)
        {
            var id = ctx.ID();
            var name = id.GetText();
            if (!string.IsNullOrEmpty(name) && !_positions.ContainsKey(name))
                _positions[name] = (id.Symbol.Line, id.Symbol.Column);
        }
    }

    // ─── run 命令 ───

    private void RunFile(string path)
    {
        var (ast, _) = BuildAst(path);
        if (ast == null) return;

        var checker = MakeChecker();
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

        var vm = new HksScript.Interpreter.Interpreter(hir, funcTable, libManager);
        vm.Run();

        Console.WriteLine($"{Green}执行完成{Reset}");
    }

    // ─── install 命令 ───

    private void InstallModule(string tier, string dllPath)
    {
        if (!File.Exists(dllPath))
        {
            Console.Error.WriteLine($"文件不存在: {dllPath}");
            return;
        }

        // 确定目标目录
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var targetDir = (tier.ToLower()) switch
        {
            "std"     => Path.GetFullPath("./lib/std/"),
            "global"  => Path.GetFullPath(Path.Combine(home, ".hks", "lib")),
            "project" => Path.GetFullPath("./lib/"),
            _ => throw new Exception($"未知层级: {tier}，可用: std, global, project")
        };
        Directory.CreateDirectory(targetDir);

        // 加载 DLL，扫描 [HksFunc]
        var asm = Assembly.LoadFrom(dllPath);
        var methods = asm.GetTypes()
            .SelectMany(t => t.GetMethods(BindingFlags.Public | BindingFlags.Static))
            .Where(m => m.GetCustomAttribute<HksFuncAttribute>() != null)
            .ToList();

        if (methods.Count == 0)
        {
            Console.Error.WriteLine($"DLL 中未找到标记了 [HksFunc] 的方法");
            return;
        }

        var moduleName = Path.GetFileNameWithoutExtension(dllPath).ToLower()
            .Replace(".", "_").Replace(" ", "_");
        var functions = new List<object>();

        foreach (var m in methods)
        {
            var attr = m.GetCustomAttribute<HksFuncAttribute>()!;
            var scriptName = attr.Alias ?? ToSnakeCase(m.Name);
            var paramTypes = m.GetParameters().Select(p => p.ParameterType.Name switch
            {
                "Int32" => "int",
                "Double" or "Single" => "float",
                "String" => "string",
                "Boolean" => "bool",
                _ when p.ParameterType.Name.Contains("List") => "Set<" + p.ParameterType.GetGenericArguments()[0].Name + ">",
                _ => p.ParameterType.Name
            }).ToArray();
            var returnType = m.ReturnType.Name switch
            {
                "Int32" => "int",
                "Double" or "Single" => "float",
                "String" => "string",
                "Boolean" => "bool",
                "Void" => "void",
                _ when m.ReturnType.Name.Contains("List") => "Set<" + m.ReturnType.GetGenericArguments()[0].Name + ">",
                _ => m.ReturnType.Name
            };

            functions.Add(new { scriptName, method = $"{m.DeclaringType!.FullName}.{m.Name}", paramTypes, returns = returnType });
        }

        // 生成模块定义 JSON
        var def = new { module = moduleName, assembly = Path.GetFullPath(dllPath), functions };
        var json = JsonSerializer.Serialize(def, new JsonSerializerOptions { WriteIndented = true });
        var jsonPath = Path.Combine(targetDir, moduleName + ".json");
        File.WriteAllText(jsonPath, json);

        Console.WriteLine($"已安装模块 '{moduleName}' 到 {tier} ({methods.Count} 个函数)");
        Console.WriteLine($"  定义文件: {jsonPath}");
    }

    private static string ToSnakeCase(string name) =>
        string.Concat(name.Select((c, i) => i > 0 && char.IsUpper(c) ? "_" + c.ToString() : c.ToString())).ToLower();

    // ─── hint 命令 ───

    private void HintFile(string path, int line, int col)
    {
        var (ast, tree) = BuildAst(path);
        if (ast == null) return;

        var checker = MakeChecker();
        checker.Check(ast);

        // 在 ANTLR 树中查找指定位置的标识符
        var symbol = FindSymbolAtPosition(tree, line, col);
        if (symbol == null) { Console.WriteLine("null"); return; }

        var info = new { name = symbol, kind = "", type = "" };
        var type = checker.ResolveType(symbol) ?? checker.ResolveFuncType(symbol);
        var kind = checker.ResolveFuncType(symbol) != null ? "function" : "variable";

        Console.WriteLine(JsonSerializer.Serialize(new { name = symbol, kind, type = type ?? "?" }));
    }

    private static string? FindSymbolAtPosition(HksScriptParser.ProgramContext? tree, int line, int col)
    {
        if (tree == null) return null;
        var stack = new Stack<ParserRuleContext>();
        stack.Push(tree);
        while (stack.Count > 0)
        {
            var ctx = stack.Pop();
            foreach (var child in ctx.children)
            {
                if (child is Antlr4.Runtime.Tree.ITerminalNode term)
                {
                    var t = term.Symbol;
                    if (t.Type == HksScriptLexer.ID && t.Line == line &&
                        t.Column <= col && col < t.Column + t.Text.Length)
                        return t.Text;
                }
                if (child is ParserRuleContext childCtx)
                    stack.Push(childCtx);
            }
        }
        return null;
    }

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
