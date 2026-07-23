using HksScript.Interpreter;

namespace HksScript.Cli;

public static class BuiltinRegistry
{
    public static void RegisterBuiltins(FunctionTable table)
    {
        // 打印
        table.Register("print", new ExternalFunction("print",
            args => { Console.WriteLine(args[0]?.ToString()); return null; }));

        // 集合查询
        table.Register("query", new ExternalFunction("query",
            args => args[0]));
        table.Register("range", new ExternalFunction("range",
            args => Enumerable.Range(0, (int)args[0]!).ToList()));
        table.Register("len", new ExternalFunction("len",
            args => args[0] is ScriptSet s ? s.Len
                  : args[0] is System.Collections.ICollection c ? c.Count
                  : 0));

        // 算术
        table.Register("__add", new ExternalFunction("__add",
            args => Convert.ToDouble(args[0]) + Convert.ToDouble(args[1])));
        table.Register("__sub", new ExternalFunction("__sub",
            args => Convert.ToDouble(args[0]) - Convert.ToDouble(args[1])));
        table.Register("__mul", new ExternalFunction("__mul",
            args => Convert.ToDouble(args[0]) * Convert.ToDouble(args[1])));
        table.Register("__div", new ExternalFunction("__div",
            args => Convert.ToDouble(args[0]) / Convert.ToDouble(args[1])));

        // 比较
        table.Register("__gt", new ExternalFunction("__gt",
            args => Convert.ToDouble(args[0]) > Convert.ToDouble(args[1])));
        table.Register("__ls", new ExternalFunction("__ls",
            args => Convert.ToDouble(args[0]) < Convert.ToDouble(args[1])));
        table.Register("__eq", new ExternalFunction("__eq",
            args => Equals(args[0], args[1])));
        table.Register("__neq", new ExternalFunction("__neq",
            args => !Equals(args[0], args[1])));
        table.Register("__le", new ExternalFunction("__le",
            args => Convert.ToDouble(args[0]) <= Convert.ToDouble(args[1])));
        table.Register("__ge", new ExternalFunction("__ge",
            args => Convert.ToDouble(args[0]) >= Convert.ToDouble(args[1])));

        // 逻辑
        table.Register("__and", new ExternalFunction("__and",
            args => (bool)args[0]! && (bool)args[1]!));
        table.Register("__or", new ExternalFunction("__or",
            args => (bool)args[0]! || (bool)args[1]!));
        table.Register("__not", new ExternalFunction("__not",
            args => !(bool)args[0]!));

        // 集合
        table.Register("__union", new ExternalFunction("__union",
            args => ((ScriptSet)args[0]!).Union((ScriptSet)args[1]!)));
        table.Register("__intersect", new ExternalFunction("__intersect",
            args => ((ScriptSet)args[0]!).Intersect((ScriptSet)args[1]!)));
        table.Register("__diff", new ExternalFunction("__diff",
            args => ((ScriptSet)args[0]!).Diff((ScriptSet)args[1]!)));
    }
}
