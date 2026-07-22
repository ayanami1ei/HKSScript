using NUnit.Framework;
using HksScript.Hir;
using HksScript.Interpreter;
using System.Collections.Generic;

[TestFixture]
public class InterpreterTests
{
    private FunctionTable MakeTable()
    {
        var t = new FunctionTable();
        t.Register("__add", new ExternalFunction("__add", args =>
            (int)args[0]! + (int)args[1]!));
        t.Register("__gt", new ExternalFunction("__gt", args =>
            (int)args[0]! > (int)args[1]!));
        t.Register("__not", new ExternalFunction("__not", args =>
            !(bool)args[0]!));
        return t;
    }

    // ─── 基础: New + Assign ───

    [Test]
    public void New_WithConst_StoresValue()
    {
        // a = 42
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 42),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(42, vm.GetRegister(0));
    }

    [Test]
    public void Assign_CopiesValue()
    {
        // a = 42; b = a
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 42),
            new New(1, 1, "int"),
            new Assign(2, 0, 1),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(42, vm.GetRegister(1));
    }

    [Test]
    public void New_OverwritesVar()
    {
        // a = 1; a = 42  (同一个 Var, 后面的覆盖前面的)
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 1),
            new New(1, 0, "int", 42),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(42, vm.GetRegister(0));
    }

    // ─── Call 函数 ───

    [Test]
    public void Call_ExternalFunction_ReturnsValue()
    {
        // r = __add(42, 8)
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 42),
            new New(1, 1, "int", 8),
            new Call(2, "__add", [0, 1]),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(50, vm.GetRegister(2));
    }

    [Test]
    public void Call_Nested_Works()
    {
        // r = __add(__add(10, 20), 5)  → 35
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 10),
            new New(1, 1, "int", 20),
            new Call(2, "__add", [0, 1]),        // t2 = 30
            new New(3, 3, "int", 5),
            new Call(4, "__add", [2, 3]),         // t4 = 35
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(35, vm.GetRegister(4));
    }

    // ─── Branch ───

    [Test]
    public void Branch_True_RunsThen()
    {
        // if (true) { r = 1 } else { r = 2 }
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "bool", true),
            new Branch(1, 0,
                then: [new New(2, 2, "int", 1)],
                els:  [new New(3, 3, "int", 2)]),
        };
        // 验证 then 块中的 New 执行了
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(1, vm.GetRegister(2));
        Assert.IsNull(vm.GetRegister(3));  // else 没执行
    }

    [Test]
    public void Branch_False_RunsElse()
    {
        // if (false) { r = 1 } else { r = 2 }
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "bool", false),
            new Branch(1, 0,
                then: [new New(2, 2, "int", 1)],
                els:  [new New(3, 3, "int", 2)]),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.IsNull(vm.GetRegister(2));  // then 没执行
        Assert.AreEqual(2, vm.GetRegister(3));
    }

    [Test]
    public void Branch_Nested_Works()
    {
        // if (5 > 3) { r = 10 } else { r = 20 }
        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 5),
            new New(1, 1, "int", 3),
            new Call(2, "__gt", [0, 1]),         // t2 = true
            new Branch(3, 2,
                then: [new New(4, 4, "int", 10)],
                els:  [new New(5, 5, "int", 20)]),
        };
        var vm = new Interpreter(hir, MakeTable());
        vm.Run();
        Assert.AreEqual(10, vm.GetRegister(4));
        Assert.IsNull(vm.GetRegister(5));
    }

    // ─── ScriptFunction ───

    [Test]
    public void Call_ScriptFunction_ReturnsValue()
    {
        // fn add(a, b) { return __add(a, b) }
        // r = add(3, 7)
        var body = new HirBasicNode[]
        {
            new Call(10, "__add", [0, 1]),
            new Return(11, -1, 10),
        };
        var table = MakeTable();
        table.Register("add", new ScriptFunction("add",
            ["a", "b"], [0, 1], body));

        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 3),
            new New(1, 1, "int", 7),
            new Call(2, "add", [0, 1]),
        };
        var vm = new Interpreter(hir, table);
        vm.Run();
        Assert.AreEqual(10, vm.GetRegister(2));
    }

    [Test]
    public void Call_ScriptFunction_Nested()
    {
        // fn twice(x) { return __add(x, x) }
        // r = twice(twice(5))
        var twiceBody = new HirBasicNode[]
        {
            new Call(10, "__add", [0, 0]),
            new Return(11, -1, 10),
        };
        var table = MakeTable();
        table.Register("twice", new ScriptFunction("twice", ["x"], [0], twiceBody));

        var hir = new HirBasicNode[]
        {
            new New(0, 0, "int", 5),
            new Call(1, "twice", [0]),       // t1 = 10
            new Call(2, "twice", [1]),       // t2 = 20
        };
        var vm = new Interpreter(hir, table);
        vm.Run();
        Assert.AreEqual(10, vm.GetRegister(1));
        Assert.AreEqual(20, vm.GetRegister(2));
    }

    // ─── 复合场景 ───

    [Test]
    public void Pipeline_SingleImage()
    {
        // load + find_circles + filter
        var table = MakeTable();
        table.Register("load", new ExternalFunction("load", _ => "img_data"));
        table.Register("find_circles", new ExternalFunction("find_circles",
            args => new List<string> { "c1", "c2" }));
        table.Register("filter", new ExternalFunction("filter", args =>
        {
            var list = (List<string>)args[0]!;
            return list.FindAll(c => true);
        }));

        var hir = new HirBasicNode[]
        {
            new New(0, 0, "string", "test.png"),
            new Call(1, "load", [0]),
            new Call(2, "find_circles", [1]),
            new Call(3, "filter", [2]),
        };
        var vm = new Interpreter(hir, table);
        vm.Run();
        Assert.AreEqual("img_data", vm.GetRegister(1));
        Assert.AreEqual(2, ((List<string>)vm.GetRegister(2)!).Count);
    }
}
