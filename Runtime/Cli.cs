using System;
using System.IO;
using System.Text.Json;
using Antlr4.Runtime;

public class HksScriptCli
{
    public static int Run(string[] args)
    {
        if (args.Length == 0)
        {
            Console.Error.WriteLine("Usage: hksscript <command> [args...]");
            Console.Error.WriteLine("Commands:");
            Console.Error.WriteLine("  run <file>        Evaluate a script");
            Console.Error.WriteLine("  analyze <file>    Output JSON type information");
            Console.Error.WriteLine("  server            Start in server mode (stdin/stdout protocol)");
            return 1;
        }

        string command = args[0].ToLowerInvariant();
        var apiDef = LoadApiDef();

        switch (command)
        {
            case "run":
                return RunScript(args.Length > 1 ? args[1] : "demo.hks");
            case "analyze":
                return AnalyzeScript(args.Length > 1 ? args[1] : "demo.hks", apiDef);
            case "server":
                return RunServer(apiDef);
            default:
                Console.Error.WriteLine($"Unknown command: {command}");
                return 1;
        }
    }

    private static int RunScript(string path)
    {
        if (!File.Exists(path))
        {
            Console.Error.WriteLine($"Script file not found: {path}");
            return 1;
        }

        string source = File.ReadAllText(path);
        Console.WriteLine("=== HksScript Run ===");
        Console.WriteLine(source);
        Console.WriteLine("--- Evaluation ---");

        try
        {
            var input = new AntlrInputStream(source);
            var lexer = new HksScriptLexer(input);
            var tokens = new CommonTokenStream(lexer);
            tokens.Fill();

            var parser = new HksScriptParser(tokens);
            var tree = parser.program();

            var evaluator = new Evaluator();
            evaluator.Visit(tree);

            Console.WriteLine("--- Done ---");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
            return 1;
        }
    }

    private static int AnalyzeScript(string path, ApiDef? apiDef)
    {
        if (!File.Exists(path))
        {
            var err = new AnalyzeResult();
            err.Errors.Add(new AnalyzeError { Message = $"Script file not found: {path}", Line = 0, Column = 0, Length = 1 });
            Console.WriteLine(JsonSerializer.Serialize(err, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            return 1;
        }

        string source = File.ReadAllText(path);
        var analyzer = new TypeAnalyzer(apiDef);
        analyzer.Analyze(source);
        Console.WriteLine(analyzer.ToJson());
        return analyzer.Result.Errors.Count > 0 ? 1 : 0;
    }

    private static int RunServer(ApiDef? apiDef)
    {
        string? line;
        while ((line = Console.In.ReadLine()) != null)
        {
            if (line.Trim() == "---BEGIN---")
            {
                string source = "";
                while ((line = Console.In.ReadLine()) != null && line.Trim() != "---END---")
                    source += line + "\n";

                var analyzer = new TypeAnalyzer(apiDef);
                analyzer.Analyze(source);
                Console.WriteLine(analyzer.ToJson());
                Console.Out.Flush();
            }
            else if (line.Trim() == "---EXIT---")
            {
                break;
            }
        }
        return 0;
    }

    public static ApiDef? LoadApiDef()
    {
        string[] paths =
        {
            "api-types.json",
            Path.Combine("..", "api-types.json"),
            Path.Combine("..", "..", "api-types.json"),
        };

        foreach (var p in paths)
        {
            if (File.Exists(p))
            {
                try
                {
                    string json = File.ReadAllText(p);
                    return JsonSerializer.Deserialize<ApiDef>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }
                catch { }
            }
        }
        return null;
    }
}
