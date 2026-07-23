using HksScript.Ast;

namespace HksScript.Module;

public record FunctionSig(string Name, string[] ParamTypes, string ReturnType);

public class SymbolTable
{
    // 变量（作用域嵌套）
    private readonly Stack<Dictionary<string, TypeRef>> scopes = new();
    // 函数签名（全局）
    private readonly Dictionary<string, List<FunctionSig>> functions = new();

    public SymbolTable()
    {
        scopes.Push(new Dictionary<string, TypeRef>());
    }

    // ─── 变量 ───

    public void EnterScope() => scopes.Push(new Dictionary<string, TypeRef>());
    public void ExitScope() => scopes.Pop();

    public void DefineVariable(string name, TypeRef type)
    {
        scopes.Peek()[name] = type;
    }

    public TypeRef? ResolveVariable(string name)
    {
        foreach (var scope in scopes)
            if (scope.TryGetValue(name, out var type)) return type;
        return null;
    }

    // ─── 函数 ───

    public void RegisterFunction(string name, string[] paramTypes, string returnType)
    {
        if (!functions.ContainsKey(name))
            functions[name] = new List<FunctionSig>();
        functions[name].Add(new FunctionSig(name, paramTypes, returnType));
    }

    public FunctionSig? FindFunction(string name, string[] argTypes)
    {
        if (!functions.TryGetValue(name, out var sigs)) return null;
        return sigs.FirstOrDefault(s =>
            s.ParamTypes.Length == argTypes.Length &&
            s.ParamTypes.SequenceEqual(argTypes));
    }

    public string? ResolveFuncType(string name)
    {
        if (functions.TryGetValue(name, out var sigs) && sigs.Count > 0)
        {
            var s = sigs[0];
            return $"({string.Join(",", s.ParamTypes)})->{s.ReturnType}";
        }
        return null;
    }

    public bool IsFunction(string name) => functions.ContainsKey(name);
}
