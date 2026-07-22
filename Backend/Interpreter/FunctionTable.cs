using System.Text.Json;
using HksScript.Hir;

namespace HksScript.Interpreter;

public abstract record Function(string Name);

public record ExternalFunction(string Name, Func<object?[], object?> Impl) : Function(Name);

public record ScriptFunction(string Name, string[] Params, int[] ParamIds, HirBasicNode[] Body) : Function(Name);

public class FunctionTable
{
    private Dictionary<string, Function> funcs = [];

    public void Register(string name, Function func) => funcs[name] = func;

    public Function Find(string name) => funcs.TryGetValue(name, out var f) ? f
        : throw new Exception($"未定义的函数: {name}");

    // 从 JSON 配置加载外部函数
    public static FunctionTable LoadConfig(string configPath)
    {
        var table = new FunctionTable();

        var json = File.ReadAllText(configPath);
        var config = JsonSerializer.Deserialize<Config>(json);

        if (config == null)
        {
            throw new Exception("config dosen't exist");
        }

        foreach (var algo in config.Algorithms)
            table.RegisterAlgo(algo);

        return table;
    }

    private void RegisterAlgo(string name)
    {
        // 扫描 plugins/{name}.dll 或 .so，注册其导出函数
        // 具体实现由算法层提供
    }
}

class Config
{
    public string[] Algorithms { get; set; } = [];
}
