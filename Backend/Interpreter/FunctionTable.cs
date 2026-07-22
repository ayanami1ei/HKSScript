using System.Text.Json;
using HksScript.Hir;

namespace HksScript.Interpreter;

public abstract record Function(string Name);

public record ExternalFunction(string Name, Func<object?[], object?> Impl) : Function(Name);

public record ScriptFunction(string Name, string[] Params, int[] ParamIds, HirBasicNode[] Body) : Function(Name);

public class ModuleConfig
{
    public Dictionary<string, ModuleDef> Modules { get; set; } = [];
}

public class ModuleDef
{
    public string Init { get; set; } = "";       // 初始化函数名
    public string[] Functions { get; set; } = []; // 模块提供的函数列表
}

public class FunctionTable
{
    private Dictionary<string, Function> funcs = [];
    private ModuleConfig? moduleConfig;

    public void Register(string name, Function func) => funcs[name] = func;

    public Function Find(string name) =>
        funcs.TryGetValue(name, out var f) ? f
            : throw new Exception($"未定义的函数: {name}");

    public bool IsImported(string name) => funcs.ContainsKey(name);

    // 从 JSON 加载模块配置
    public void LoadModules(string configPath)
    {
        var json = File.ReadAllText(configPath);
        moduleConfig = JsonSerializer.Deserialize<ModuleConfig>(json);
    }

    // 执行 import：调用模块的初始化函数
    public void ImportModule(string name)
    {
        if (moduleConfig?.Modules.TryGetValue(name, out var mod) != true)
            throw new Exception($"未定义的模块: {name}");

        // 调用初始化函数
        if (!string.IsNullOrEmpty(mod.Init))
        {
            var initFunc = Find(mod.Init);
            if (initFunc is ExternalFunction ext)
                ext.Impl([]);
        }

        // 注册模块的所有函数（实际注册在初始化函数内部完成）
    }
}
