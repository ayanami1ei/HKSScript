using System.Text.Json;
using System.Reflection;
using HksScript.Interpreter;

namespace HksScript.Module;

public class LibraryConfig
{
    public string StdPath { get; set; } = "./lib/std/";
    public string GlobalPath { get; set; } = "~/.hks/lib/";
    public string ProjectPath { get; set; } = "./lib/";

    public string[] GetSearchPaths()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        return [
            Path.GetFullPath(ProjectPath.Replace("~", home)),
            Path.GetFullPath(GlobalPath.Replace("~", home)),
            Path.GetFullPath(StdPath.Replace("~", home)),
        ];
    }

    public static LibraryConfig Default => new();
}

public class LibraryManager
{
    private readonly LibraryConfig _config;
    private readonly Dictionary<string, ModuleDefinition> _modules = new();
    private readonly Dictionary<string, Assembly> _loaded = new();

    public LibraryManager(LibraryConfig? config = null)
    {
        _config = config ?? LibraryConfig.Default;
    }

    // 扫描库路径，注册符号（不加载 DLL）
    public void ScanModules()
    {
        _modules.Clear();
        foreach (var dir in _config.GetSearchPaths())
        {
            if (!Directory.Exists(dir)) continue;
            foreach (var file in Directory.GetFiles(dir, "*.json"))
            {
                try
                {
                    var def = JsonSerializer.Deserialize<ModuleDefinition>(File.ReadAllText(file));
                    if (def != null && !string.IsNullOrEmpty(def.Module))
                        _modules.TryAdd(def.Module, def);
                }
                catch { }
            }
        }
    }

    // 注册所有模块的函数签名到 TypeChecker
    public void RegisterSymbols(TypeChecker.TypeChecker checker)
    {
        foreach (var def in _modules.Values)
            foreach (var fn in def.Functions)
                checker.RegisterFunc(fn.ScriptName, fn.Params, fn.Returns);
    }

    // 导入模块：加载 DLL，注册函数到 FunctionTable
    public void Import(string moduleName, FunctionTable table)
    {
        if (!_modules.TryGetValue(moduleName, out var def))
            throw new Exception($"未找到模块: {moduleName}");

        if (_loaded.ContainsKey(moduleName))
            return; // 已加载

        var asm = Assembly.LoadFrom(def.Assembly);
        _loaded[moduleName] = asm;

        foreach (var fn in def.Functions)
        {
            var typeName = fn.Method[..fn.Method.LastIndexOf('.')];
            var methodName = fn.Method[(fn.Method.LastIndexOf('.') + 1)..];
            var type = asm.GetType(typeName);
            var method = type?.GetMethod(methodName, BindingFlags.Public | BindingFlags.Static);
            if (method == null) continue;

            var extFn = new ExternalFunction(fn.ScriptName, args =>
            {
                var typedArgs = new object?[args.Length];
                for (int i = 0; i < args.Length; i++)
                    typedArgs[i] = ConvertArg(args[i], fn.Params[i]);
                return method.Invoke(null, typedArgs);
            });

            table.Register(fn.ScriptName, extFn);
        }
    }

    public List<string> ListModules() => _modules.Keys.ToList();

    private static object? ConvertArg(object? value, string targetType) => targetType switch
    {
        "int" => Convert.ToInt32(value),
        "float" => Convert.ToDouble(value),
        "string" => (string)value!,
        "bool" => (bool)value!,
        "Mat" => value, // 保持原类型
        _ => value
    };
}
