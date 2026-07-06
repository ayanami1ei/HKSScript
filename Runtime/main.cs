using System;
using System.IO;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;

class Area : Feature
{
    public FeatureValue Execute(Circle input)
    {
        Console.WriteLine("  call area feature");
        return new FeatureValue(0, FeatureValueType.Int);
    }

    public string GetName()
    {
        return "area";
    }
}

class Demo
{
    public static void Main()
    {
        string scriptPath = "demo.hks";
        if (!File.Exists(scriptPath))
        {
            Console.Error.WriteLine($"Script file not found: {scriptPath}");
            return;
        }

        string source = File.ReadAllText(scriptPath);
        Console.WriteLine("=== HksScript Demo ===");
        Console.WriteLine("Script:");
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
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error: {ex.Message}");
            Console.Error.WriteLine(ex.StackTrace);
        }
    }
}
