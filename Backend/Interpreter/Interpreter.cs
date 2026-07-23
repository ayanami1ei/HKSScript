using HksScript.Hir;
using HksScript.Module;

namespace HksScript.Interpreter;
public class Interpreter : HirRunner
{
    private HirBasicNode[] nodes;
    private Dictionary<int, object?> varRegister = [];
    private FunctionTable funcTable;
    private LibraryManager? libManager;

    public Interpreter(HirBasicNode[] nodes, FunctionTable funcTable, LibraryManager? libManager = null)
    {
        this.nodes = nodes;
        this.funcTable = funcTable;
        this.libManager = libManager;
    }

    // 供测试/外部取结果
    public object? GetRegister(int id) =>
        varRegister.TryGetValue(id, out var v) ? v : null;

    public T? Get<T>(int id) where T : class =>
        GetRegister(id) as T;

    public void Run()
    {
        foreach (HirBasicNode hir in nodes)
            Route(hir);
    }

    private void Route(HirBasicNode hir)
    {
        switch (hir.Type)
        {
            case HirType.Call:   RunCall((Call)hir);   break;
            case HirType.Branch: RunBranch((Branch)hir); break;
            case HirType.Assign: RunAssign((Assign)hir); break;
            case HirType.New:    RunNew((New)hir);     break;
            case HirType.Import: RunImport((Import)hir); break;
        }
    }

    // ─── 函数调用 ───

    private void RunCall(Call hir)
    {
        var args = hir.Args.Select(a => varRegister[a]).ToArray();
        var result = CallFunction(hir.Name, args);
        varRegister[hir.Id] = result;
    }

    private object? CallFunction(string name, object?[] args)
    {
        var func = funcTable.Find(name);
        return func switch
        {
            ExternalFunction ext => ext.Impl(args),
            ScriptFunction sf    => ExecuteScript(sf, args),
            _ => throw new Exception($"无法执行的函数: {name}")
        };
    }

    // ─── 执行脚本函数体 ───

    private object? ExecuteScript(ScriptFunction sf, object?[] args)
    {
        // 绑定参数到对应的 Id
        for (int i = 0; i < sf.Params.Length; i++)
            varRegister[sf.ParamIds[i]] = args[i];

        // 执行函数体，逐条指令
        for (int pc = 0; pc < sf.Body.Length; pc++)
        {
            var node = sf.Body[pc];
            if (node.Type == HirType.Return)
                break;  // 遇到 Return 直接跳出
            Route(node);
        }

        // 取出 Return 指定的变量的值
        return varRegister[((Return)sf.Body.Last()).Var];
    }

    // ─── Branch ───

    private void RunBranch(Branch hir)
    {
        if ((bool)varRegister[hir.Cond]!)
            foreach (var node in hir.Then)
                Route(node);
        else if (hir.Else != null)
            foreach (var node in hir.Else)
                Route(node);
    }

    // ─── 变量 ───

    private void RunAssign(Assign hir)
    {
        varRegister[hir.Lhs] = varRegister[hir.Rhs];
    }

    private void RunNew(New hir)
    {
        varRegister[hir.Var] = hir.ConstValue;
    }

    private void RunImport(Import hir)
    {
        foreach (var mod in hir.Imported)
        {
            if (libManager != null)
            {
                try
                {
                libManager.Import(mod, funcTable);
                }
                catch (Exception ex)
                {
                    throw new Exception($"导入模块失败 '{mod}': {ex.Message}");
                }
            }
        }
    }
}
