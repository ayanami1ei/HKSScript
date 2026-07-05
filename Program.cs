using NLua;
using HKSScript;

// --gen [output]        → 从 Lua 脚本生成 C 可用库
// --gen                 → 输出到 ./generated/
if (args.Length > 0 && args[0] == "--gen")
{
    var outputDir = args.Length > 1 ? args[1] : "./generated";
    Console.WriteLine($"Generating C library to: {outputDir}");
    Generator.Generate(outputDir, CreateSampleJobs(),
        new[] { "hks.lua", "test.lua" });
    Console.WriteLine("Done.");
    return;
}

// --- 正常运行模式 ---
using var lua = new Lua();
lua.LoadCLRPackage();
lua.DoString("package.path = './?.lua;' .. package.path");

var f = typeof(Factory);
lua.RegisterFunction("NewJob", null, f.GetMethod(nameof(Factory.NewJob))!);
lua.RegisterFunction("NewTool", null, f.GetMethod(nameof(Factory.NewTool))!);

lua["lua_args"] = args;
lua["Jobs"] = CreateSampleJobs();
lua["JobNames"] = new[] { "DataClean", "DataExport" };

try { lua.DoFile("test.lua"); }
catch (Exception ex) { Console.Error.WriteLine($"Error: {ex.Message}"); Environment.Exit(1); }

static Dictionary<string, Job> CreateSampleJobs()
{
    return new()
    {
        ["DataClean"] = new Job
        {
            Name = "DataClean",
            Tools = new()
            {
                new Tool { Name = "Validate" },
                new Tool { Name = "Normalize" },
                new Tool { Name = "Deduplicate" }
            }
        },
        ["DataExport"] = new Job
        {
            Name = "DataExport",
            Tools = new()
            {
                new Tool { Name = "Query" },
                new Tool { Name = "Format" },
                new Tool { Name = "Upload" }
            }
        }
    };
}

public static class Factory
{
    public static Job NewJob() => new();
    public static Tool NewTool() => new();
}
