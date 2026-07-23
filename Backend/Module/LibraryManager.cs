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
    private SymbolTable? _symbols;

    public SymbolTable? Symbols => _symbols;

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
                    var def = JsonSerializer.Deserialize<ModuleDefinition>(File.ReadAllText(file), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (def != null && !string.IsNullOrEmpty(def.Module))
                        _modules.TryAdd(def.Module, def);
                }
                catch { }
            }
        }
    }

    // 注册所有模块的函数签名到共享符号表
    public SymbolTable RegisterSymbols()
    {
        if (_symbols != null) return _symbols;
        _symbols = new SymbolTable();
        foreach (var def in _modules.Values)
            foreach (var fn in def.Functions)
                _symbols.RegisterFunction(fn.ScriptName, fn.ParamTypes, fn.Returns);
        return _symbols;
    }

    // 也注册到指定的 TypeChecker（兼容旧方式）
    public void RegisterSymbols(TypeChecker.TypeChecker checker)
    {
        var syms = RegisterSymbols();
        // 已经直接注册到 _symbols 了，不需要额外操作
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
            var methodStr = fn.Method;
            var isInstance = methodStr.EndsWith("|instance");
            if (isInstance) methodStr = methodStr[..^"|instance".Length];

            var dot = methodStr.LastIndexOf('.');
            var typeName = methodStr[..dot];
            var methodName = methodStr[(dot + 1)..];
            var type = asm.GetType(typeName);
            if (type == null) continue;

            // 构造器 (methodName == short type name)
            if (string.Equals(methodName, type.Name, StringComparison.OrdinalIgnoreCase))
            {
                table.Register(fn.ScriptName, new ExternalFunction(fn.ScriptName, args =>
                {
                    var typedArgs = args.Select((a, i) => ConvertArg(a, fn.ParamTypes[i])).ToArray();
                    return Activator.CreateInstance(type, typedArgs);
                }));
                continue;
            }

            // 字段 get/set
            if (methodName.StartsWith("get_"))
            {
                var fieldName = methodName[4..];
                var field = type.GetField(fieldName, BindingFlags.Public | BindingFlags.Instance);
                if (field == null) continue;
                table.Register(fn.ScriptName, new ExternalFunction(fn.ScriptName, args =>
                {
                    return field.GetValue(args[0]);
                }));
                continue;
            }

            if (methodName.StartsWith("set_"))
            {
                var fieldName = methodName[4..];
                var field = type.GetField(fieldName, BindingFlags.Public | BindingFlags.Instance);
                if (field == null) continue;
                table.Register(fn.ScriptName, new ExternalFunction(fn.ScriptName, args =>
                {
                    var val = ConvertArg(args[1], fn.ParamTypes[1]);
                    field.SetValue(args[0], val);
                    return null;
                }));
                continue;
            }

            // 实例方法
            if (isInstance)
            {
                var method = type.GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
                if (method == null) continue;
                table.Register(fn.ScriptName, new ExternalFunction(fn.ScriptName, args =>
                {
                    var instance = args[0];
                    var typedArgs = new object?[args.Length - 1];
                    for (int i = 1; i < args.Length; i++)
                        typedArgs[i - 1] = ConvertArg(args[i], fn.ParamTypes[i]);
                    return method.Invoke(instance, typedArgs);
                }));
                continue;
            }

            // 静态方法
            var staticMethod = type.GetMethod(methodName, BindingFlags.Public | BindingFlags.Static);
            if (staticMethod == null) continue;
            table.Register(fn.ScriptName, new ExternalFunction(fn.ScriptName, args =>
            {
                var typedArgs = new object?[args.Length];
                for (int i = 0; i < args.Length; i++)
                    typedArgs[i] = ConvertArg(args[i], fn.ParamTypes[i]);
                return staticMethod.Invoke(null, typedArgs);
            }));
        }
    }

    public List<string> ListModules() => _modules.Keys.ToList();
    public ModuleDefinition? GetModule(string name) => _modules.GetValueOrDefault(name);

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
