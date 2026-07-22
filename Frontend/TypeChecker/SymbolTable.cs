using HksScript.Ast;

namespace HksScript.TypeChecker;

public class SymbolTable
{
    private readonly Stack<Dictionary<string, TypeRef>> scopes = new();

    public SymbolTable()
    {
        scopes.Push(new Dictionary<string, TypeRef>());
    }

    public void EnterScope()
    {
        scopes.Push(new Dictionary<string, TypeRef>());
    }

    public void ExitScope()
    {
        scopes.Pop();
    }

    public void Define(string name, TypeRef type)
    {
        scopes.Peek()[name] = type;
    }

    public bool IsDefined(string name)
    {
        foreach (var scope in scopes)
        {
            if (scope.ContainsKey(name))
                return true;
        }
        return false;
    }

    public TypeRef? Resolve(string name)
    {
        foreach (var scope in scopes)
        {
            if (scope.TryGetValue(name, out var type))
                return type;
        }
        return null;
    }
}
