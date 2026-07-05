using NLua;

namespace HKSScript;

/// <summary>
/// C# 侧 Job 执行器，供生成库调用
/// </summary>
public class JobRunner : IDisposable
{
    private readonly Lua _lua = new();
    private Dictionary<string, Job> _jobs = new();
    private List<string> _jobNames = new();

    public void Initialize()
    {
        _lua.LoadCLRPackage();
        _lua.DoString("package.path = './?.lua;' .. package.path");

        var f = typeof(ScriptGlobals);
        _lua.RegisterFunction("NewJob", null, f.GetMethod(nameof(ScriptGlobals.NewJob))!);
        _lua.RegisterFunction("NewTool", null, f.GetMethod(nameof(ScriptGlobals.NewTool))!);

        _lua["Jobs"] = CreateSampleJobs();
        _lua["JobNames"] = new[] { "DataClean", "DataExport" };
        _lua["lua_args"] = Array.Empty<string>();

        _jobs = CreateSampleJobs();
        _jobNames = new() { "DataClean", "DataExport" };

        try { _lua.DoFile("test.lua"); } catch { }
    }

    public int RunJob(string name)
    {
        try
        {
            _lua.DoString($"if Jobs['{name}'] then require('hks').RunJob('{name}') end");
            return 0;
        }
        catch { return -1; }
    }

    public int RunAll()
    {
        try
        {
            _lua.DoString("require('hks').RunAll()");
            return 0;
        }
        catch { return -1; }
    }

    public int GetJobCount() => _jobNames.Count;

    public void Dispose() => _lua.Dispose();

    private static Dictionary<string, Job> CreateSampleJobs()
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
}

public static class ScriptGlobals
{
    public static Job NewJob() => new();
    public static Tool NewTool() => new();
}
