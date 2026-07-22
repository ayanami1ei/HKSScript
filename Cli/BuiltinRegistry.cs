using HksScript.Interpreter;
using System.Collections;

namespace HksScript.Cli;

public static class BuiltinRegistry
{
    public static void RegisterBuiltins(FunctionTable table)
    {
        // 图像 IO（简化实现，不依赖 OpenCvSharp）
        table.Register("load", new ExternalFunction("load",
            args => $"[Mat: {args[0]}]"));
        table.Register("save", new ExternalFunction("save",
            args => { Console.WriteLine($"save: {args[1]}"); return null; }));

        // 打印
        table.Register("print", new ExternalFunction("print",
            args => { Console.WriteLine(args[0]?.ToString()); return null; }));

        // 算法（简化）
        table.Register("find_circles", new ExternalFunction("find_circles",
            args => new List<string> { "circle_1", "circle_2" }));

        // 集合查询
        table.Register("query", new ExternalFunction("query",
            args => args[0]));
        table.Register("range", new ExternalFunction("range",
            args => Enumerable.Range(0, args[0] is int i ? i : 0)));
        table.Register("len", new ExternalFunction("len",
            args => args[0] is System.Collections.ICollection c ? c.Count : 0));

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
            args => ((Many<object>)args[0]!).Union((Many<object>)args[1]!)));
        table.Register("__intersect", new ExternalFunction("__intersect",
            args => ((Many<object>)args[0]!).Intersect((Many<object>)args[1]!)));
        table.Register("__diff", new ExternalFunction("__diff",
            args => ((Many<object>)args[0]!).Diff((Many<object>)args[1]!)));
    }
}
