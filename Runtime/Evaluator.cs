using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;

public class Evaluator : HksScriptBaseVisitor<object?>
{
    private readonly Dictionary<string, object?> env = new();

    public override object? VisitProgram(HksScriptParser.ProgramContext context)
    {
        foreach (var stmt in context.statement())
            Visit(stmt);
        return null;
    }

    public override object? VisitLetStmt(HksScriptParser.LetStmtContext context)
    {
        string name = context.ID().GetText();
        object? value = Visit(context.expr());
        env[name] = value;
        PrintValue(name, value);
        return value;
    }

    public override object? VisitExprStmt(HksScriptParser.ExprStmtContext context)
        => Visit(context.expr());

    public override object? VisitParenExpr(HksScriptParser.ParenExprContext context)
        => Visit(context.expr());

    public override object? VisitLiteralExpr(HksScriptParser.LiteralExprContext context)
    {
        var lit = context.literal();
        if (lit.INT() != null)
            return int.Parse(lit.INT().GetText());
        if (lit.FLOAT() != null)
            return float.Parse(lit.FLOAT().GetText());
        if (lit.STRING() != null)
            return Unquote(lit.STRING().GetText());
        string text = lit.GetText();
        if (text == "true") return true;
        if (text == "false") return false;
        throw new Exception($"Unknown literal: {text}");
    }

    public override object? VisitVarExpr(HksScriptParser.VarExprContext context)
    {
        string name = context.ID().GetText();
        if (env.TryGetValue(name, out object? val))
            return val;
        if (IsEnumName(name, out object? enumVal))
            return enumVal;
        throw new Exception($"Undefined variable: {name}");
    }

    public override object? VisitLoadExpr(HksScriptParser.LoadExprContext context)
    {
        string path = Unquote(context.STRING().GetText());
        Console.WriteLine($">>> load image: {path}");
        return Mat.FromFile(path);
    }

    public override object? VisitCallExpr(HksScriptParser.CallExprContext context)
    {
        string name = context.ID().GetText();
        object?[] args = context.exprList()?.expr()
            .Select(e => Visit(e))
            .ToArray() ?? Array.Empty<object?>();

        if (name == "print")
        {
            Console.WriteLine(string.Join(" ", args.Select(FormatValue)));
            return null;
        }

        if (name.EndsWith(".new"))
        {
            string className = name[..^4];
            return Activator.CreateInstance(ResolveType(className));
        }

        if (name.Contains('.'))
        {
            string[] parts = name.Split('.');
            Type? type = ResolveType(parts[0]);
            if (type != null)
            {
                var flags = BindingFlags.Public | BindingFlags.Static | BindingFlags.IgnoreCase;
                foreach (var method in type.GetMethods(flags).Where(m => string.Equals(m.Name, parts[1], StringComparison.OrdinalIgnoreCase)))
                {
                    try { return method.Invoke(null, ConvertArgs(method, args)); }
                    catch { }
                }
            }
        }

        throw new Exception($"Unknown function: {name}");
    }

    public override object? VisitMethodCallExpr(HksScriptParser.MethodCallExprContext context)
    {
        string? objName = null;
        if (context.expr() is HksScriptParser.VarExprContext varCtx)
            objName = varCtx.ID().GetText();

        // Resolve obj, possibly as a static type
        Type? staticType = objName != null ? ResolveTypeOrNull(objName) : null;
        object? obj = null;

        if (staticType != null)
        {
            string methodName = context.ID().GetText();
            object?[] args = context.exprList()?.expr()
                .Select(e => Visit(e))
                .ToArray() ?? Array.Empty<object?>();

            if (string.Equals(methodName, "new", StringComparison.OrdinalIgnoreCase))
                return Activator.CreateInstance(staticType);

            var flags = BindingFlags.Public | BindingFlags.Static | BindingFlags.IgnoreCase;
            foreach (var method in staticType.GetMethods(flags).Where(m => string.Equals(m.Name, methodName, StringComparison.OrdinalIgnoreCase)))
            {
                try { return method.Invoke(null, ConvertArgs(method, args)); }
                catch { }
            }
            throw new Exception($"No matching static method {methodName} on {objName}");
        }

        // Instance method call
        obj = Visit(context.expr());
        string mName = context.ID().GetText();

        object?[] mArgs = context.exprList()?.expr()
            .Select(e => Visit(e))
            .ToArray() ?? Array.Empty<object?>();

        if (obj == null)
            throw new Exception($"Cannot call method {mName} on null");

        Type type = obj.GetType();
        var instanceFlags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase;
        foreach (var method in type.GetMethods(instanceFlags).Where(m => string.Equals(m.Name, mName, StringComparison.OrdinalIgnoreCase)))
        {
            try { return method.Invoke(obj, ConvertArgs(method, mArgs)); }
            catch { }
        }

        throw new Exception($"No matching method {mName} on {type.Name}");
    }

    public override object? VisitQueryExpr(HksScriptParser.QueryExprContext context)
    {
        object? obj = Visit(context.expr());
        var circles = obj as List<Circle>
            ?? throw new Exception(".query() can only be called on a list of circles");

        var predicate = BuildPredicate(context.condition());
        return circles.Where(c => predicate(c)).ToList();
    }

    private Func<Circle, bool> BuildPredicate(ParserRuleContext ctx)
    {
        if (ctx is HksScriptParser.ConditionContext condCtx)
            return BuildPredicate(condCtx.condOr());
        if (ctx is HksScriptParser.CondOrContext orCtx)
        {
            var preds = orCtx.condAnd().Select(c => BuildPredicate(c)).ToList();
            return circle => preds.Any(p => p(circle));
        }
        if (ctx is HksScriptParser.CondAndContext andCtx)
        {
            var preds = andCtx.condNot().Select(c => BuildPredicate(c)).ToList();
            return circle => preds.All(p => p(circle));
        }
        if (ctx is HksScriptParser.CondNotContext notCtx)
        {
            if (notCtx.NOT() != null)
            {
                var inner = BuildPredicate(notCtx.condNot());
                return circle => !inner(circle);
            }
            else
            {
                return BuildPredicate(notCtx.condPrimary());
            }
        }
        if (ctx is HksScriptParser.CondPrimaryContext primCtx)
        {
            if (primCtx.condition() != null)
                return BuildPredicate(primCtx.condition());

            string featureName = primCtx.expr(0).GetText();
            CompareOp op = ParseCompareOp(primCtx.op.Text);
            object? target = Visit(primCtx.expr(1));
            Feature feature = ResolveFeature(featureName);
            return circle => CompareFeature(feature, circle, op, target);
        }

        throw new Exception($"Invalid condition: ctx type={ctx.GetType().Name} text='{ctx.GetText()}'");
    }

    private static bool CompareFeature(Feature feature, Circle circle, CompareOp op, object? target)
    {
        FeatureValue fv = feature.Execute(circle);
        int cmp = Comparer<object?>.Default.Compare(fv.As<object>(), target);
        return op switch
        {
            CompareOp.Less => cmp < 0,
            CompareOp.Greater => cmp > 0,
            CompareOp.Equal => cmp == 0,
            CompareOp.NotEqual => cmp != 0,
            CompareOp.LessEqual => cmp <= 0,
            CompareOp.GreaterEqual => cmp >= 0,
            _ => throw new Exception($"Unknown operator: {op}")
        };
    }

    private static CompareOp ParseCompareOp(string text)
    {
        return text switch
        {
            "<" => CompareOp.Less,
            ">" => CompareOp.Greater,
            "==" => CompareOp.Equal,
            "<>" => CompareOp.NotEqual,
            "<=" => CompareOp.LessEqual,
            ">=" => CompareOp.GreaterEqual,
            _ => throw new Exception($"Unknown operator: {text}")
        };
    }

    private Feature ResolveFeature(string name)
    {
        if (env.TryGetValue(name, out var obj) && obj is Feature f)
            return f;
        throw new Exception($"Feature not found: {name}");
    }

    public override object? VisitPipeExpr(HksScriptParser.PipeExprContext context)
    {
        object? left = Visit(context.expr(0));

        if (context.expr(1) is HksScriptParser.CallExprContext call)
        {
            string name = call.ID().GetText();
            object?[] args = call.exprList()?.expr()
                .Select(e => Visit(e))
                .ToArray() ?? Array.Empty<object?>();

            object?[] withPipe = new object?[args.Length + 1];
            withPipe[0] = left;
            Array.Copy(args, 0, withPipe, 1, args.Length);

            if (name.Contains('.'))
            {
                string[] parts = name.Split('.');
                Type? type = ResolveType(parts[0]);
                if (type != null)
                {
                    MethodInfo? method = type.GetMethod(parts[1],
                        BindingFlags.Public | BindingFlags.Static);
                    if (method != null)
                        return method.Invoke(null, ConvertArgs(method, withPipe));
                }
            }
            throw new Exception($"Cannot pipe to function {name}");
        }

        if (context.expr(1) is HksScriptParser.MethodCallExprContext methodCall)
        {
            string methodName = methodCall.ID().GetText();
            object?[] args = methodCall.exprList()?.expr()
                .Select(e => Visit(e))
                .ToArray() ?? Array.Empty<object?>();

            return CallMethodDynamic(left, methodName, args);
        }

        object? right = Visit(context.expr(1));
        if (right is Delegate d)
            return d.DynamicInvoke(left);

        throw new Exception("Pipe target must be a function or method call");
    }

    public override object? VisitAddExpr(HksScriptParser.AddExprContext context)
    {
        object? l = Visit(context.expr(0));
        object? r = Visit(context.expr(1));
        string op = context.op.Text;

        if (l is int il && r is int ir)
            return op == "+" ? il + ir : il - ir;
        if (l is float fl && r is float fr)
            return op == "+" ? fl + fr : fl - fr;
        if (l is int il2 && r is float fr2)
            return op == "+" ? il2 + fr2 : il2 - fr2;
        if (l is float fl2 && r is int ir2)
            return op == "+" ? fl2 + ir2 : fl2 - ir2;

        throw new Exception($"Cannot apply {op} to {l?.GetType()} and {r?.GetType()}");
    }

    public override object? VisitMulExpr(HksScriptParser.MulExprContext context)
    {
        object? l = Visit(context.expr(0));
        object? r = Visit(context.expr(1));
        string op = context.op.Text;

        if (l is int il && r is int ir)
            return op == "*" ? il * ir : il / ir;
        if (l is float fl && r is float fr)
            return op == "*" ? fl * fr : fl / fr;
        if (l is int il2 && r is float fr2)
            return op == "*" ? il2 * fr2 : il2 / fr2;
        if (l is float fl2 && r is int ir2)
            return op == "*" ? fl2 * ir2 : fl2 / ir2;

        throw new Exception($"Cannot apply {op} to {l?.GetType()} and {r?.GetType()}");
    }

    public override object? VisitUnaryExpr(HksScriptParser.UnaryExprContext context)
    {
        object? v = Visit(context.expr());
        if (v is int i) return -i;
        if (v is float f) return -f;
        throw new Exception($"Cannot negate {v?.GetType()}");
    }

    public override object? VisitCompExpr(HksScriptParser.CompExprContext context)
    {
        object? l = Visit(context.expr(0));
        object? r = Visit(context.expr(1));
        string op = context.op.Text;

        int cmp = Comparer<object?>.Default.Compare(l, r);
        return op switch
        {
            "<" => cmp < 0,
            ">" => cmp > 0,
            "==" => cmp == 0,
            "<>" => cmp != 0,
            "<=" => cmp <= 0,
            ">=" => cmp >= 0,
            _ => throw new Exception($"Unknown operator: {op}")
        };
    }

    private object? CallMethodDynamic(object? obj, string methodName, object?[] args)
    {
        if (obj == null)
            throw new Exception($"Cannot call method {methodName} on null");

        Type type = obj.GetType();
        var flags = BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase;
        foreach (var method in type.GetMethods(flags).Where(m => string.Equals(m.Name, methodName, StringComparison.OrdinalIgnoreCase)))
        {
            try
            {
                return method.Invoke(obj, ConvertArgs(method, args));
            }
            catch { }
        }

        throw new Exception($"No matching method {methodName} on {type.Name}");
    }

    private Type ResolveType(string name)
    {
        return ResolveTypeOrNull(name) ?? throw new Exception($"Unknown type: {name}");
    }

    private Type? ResolveTypeOrNull(string name)
    {
        return name switch
        {
            "Find" => typeof(Find),
            "Query" => typeof(Query),
            "Mat" => typeof(Mat),
            "FeatureRegistry" => typeof(FeatureRegistry),
            "Area" => typeof(Area),
            "Circle" => typeof(Circle),
            "FeatureValue" => typeof(FeatureValue),
            _ => Type.GetType(name)
        };
    }

    private object?[] ConvertArgs(MethodInfo method, object?[] args)
    {
        var parameters = method.GetParameters();
        var result = new object?[Math.Min(args.Length, parameters.Length)];
        for (int i = 0; i < result.Length; i++)
            result[i] = ConvertArg(args[i], parameters[i].ParameterType);
        return result;
    }

    private object? ConvertArg(object? value, Type targetType)
    {
        if (value == null) return null;
        if (targetType.IsInstanceOfType(value)) return value;

        if (targetType.IsEnum && value is string s)
            return Enum.Parse(targetType, s, ignoreCase: true);

        if (targetType == typeof(FeatureValue))
        {
            if (value is int i) return new FeatureValue(i, FeatureValueType.Int);
            if (value is float f) return new FeatureValue(f, FeatureValueType.Float);
            if (value is bool b) return new FeatureValue(b, FeatureValueType.Bool);
        }

        try { return Convert.ChangeType(value, targetType); }
        catch { throw new Exception($"Cannot convert {value} ({value?.GetType()}) to {targetType.Name}"); }
    }

    private bool IsEnumName(string name, out object? value)
    {
        value = null;
        foreach (CompareOp op in Enum.GetValues<CompareOp>())
        {
            if (string.Equals(op.ToString(), name, StringComparison.OrdinalIgnoreCase))
            {
                value = op;
                return true;
            }
        }
        foreach (FeatureValueType t in Enum.GetValues<FeatureValueType>())
        {
            if (string.Equals(t.ToString(), name, StringComparison.OrdinalIgnoreCase))
            {
                value = t;
                return true;
            }
        }
        return false;
    }

    private static string Unquote(string s)
        => s[1..^1];

    private static string FormatValue(object? v)
    {
        if (v == null) return "null";
        if (v is Mat) return "<Mat>";
        if (v is List<Circle> list) return $"<List<Circle> count={list.Count}>";
        if (v is System.Collections.IEnumerable e && !(v is string))
        {
            var items = e.Cast<object>().Select(FormatValue);
            return $"[{string.Join(", ", items)}]";
        }
        return v.ToString() ?? "";
    }

    private static void PrintValue(string name, object? value)
    {
        string valStr = value switch
        {
            Mat => "<Mat>",
            List<Circle> list => $"<List<Circle> count={list.Count}>",
            _ => FormatValue(value)
        };
        Console.WriteLine($"  {name} = {valStr}");
    }
}
