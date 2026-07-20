using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Antlr4.Runtime;
using Antlr4.Runtime.Tree;

public class TokenAnnotation
{
    public int Line { get; set; }
    public int Column { get; set; }
    public int Length { get; set; }
    public string SemanticType { get; set; } = "";
}

public class AnalyzeResult
{
    public List<TokenAnnotation> Symbols { get; set; } = new();
    public List<AnalyzeError> Errors { get; set; } = new();
}

public class AnalyzeError
{
    public int Line { get; set; }
    public int Column { get; set; }
    public int Length { get; set; }
    public string Message { get; set; } = "";
}

public class TypeAnalyzer
{
    private readonly HashSet<string> apiTypes;
    private readonly Dictionary<string, Dictionary<string, string>> apiReturnTypes;
    private readonly Dictionary<string, string> varTypes = new();
    public readonly AnalyzeResult Result = new();

    public TypeAnalyzer(ApiDef? apiDef)
    {
        apiTypes = new HashSet<string>();
        apiReturnTypes = new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        if (apiDef != null)
        {
            foreach (var key in apiDef.Types.Keys)
            {
                apiTypes.Add(key);
                var def = apiDef.Types[key];
                if (def.Methods != null)
                {
                    var methods = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    foreach (var (mname, mdef) in def.Methods)
                        methods[mname] = mdef.ReturnType;
                    apiReturnTypes[key] = methods;
                }
            }
            foreach (var key in apiDef.Builtins.Keys)
                apiTypes.Add(key);
        }
    }

    public void Analyze(string source)
    {
        try
        {
            var input = new AntlrInputStream(source);
            var lexer = new HksScriptLexer(input);
            var tokenStream = new CommonTokenStream(lexer);
            tokenStream.Fill();

            var parser = new HksScriptParser(tokenStream);
            parser.RemoveErrorListeners();
            parser.AddErrorListener(new AnalyzeErrorListener(Result));
            parser.BuildParseTree = true;
            var tree = parser.program();

            var walker = new ParseTreeWalker();
            walker.Walk(new TypeListener(this), tree);
        }
        catch (Exception ex)
        {
            Result.Errors.Add(new AnalyzeError { Message = ex.Message, Line = 0, Column = 0, Length = 1 });
        }
    }

    private class TypeListener : HksScriptBaseListener
    {
        private readonly TypeAnalyzer owner;

        public TypeListener(TypeAnalyzer owner) => this.owner = owner;

        public override void EnterLetStmt(HksScriptParser.LetStmtContext context)
        {
            string varName = context.ID().GetText();
            if (context.type_() != null)
            {
                owner.varTypes[varName] = context.type_().GetText();
            }
            else
            {
                owner.varTypes[varName] = owner.InferExprType(context.expr());
            }
            owner.AnnotateToken(context.ID().Symbol, "variable");
        }

        public override void EnterType_(HksScriptParser.Type_Context context)
        {
            owner.AnnotateToken(context.Start, "type");
        }

        public override void EnterVarExpr(HksScriptParser.VarExprContext context)
        {
            string name = context.ID().GetText();
            if (owner.apiTypes.Contains(name))
            {
                owner.AnnotateToken(context.ID().Symbol, "type");
            }
            else if (owner.varTypes.ContainsKey(name))
            {
                owner.AnnotateToken(context.ID().Symbol, "variable");
            }
        }

        public override void EnterCallExpr(HksScriptParser.CallExprContext context)
        {
            owner.AnnotateToken(context.ID().Symbol, "function");
        }

        public override void EnterMethodCallExpr(HksScriptParser.MethodCallExprContext context)
        {
            owner.AnnotateToken(context.ID().Symbol, "function");
        }

        public override void EnterQueryExpr(HksScriptParser.QueryExprContext context)
        {
            owner.AnnotateToken(context.QUERY().Symbol, "function");
        }
    }

    private string InferExprType(IParseTree node)
    {
        if (node is HksScriptParser.LiteralExprContext litCtx)
        {
            var lit = litCtx.literal();
            if (lit.INT() != null) return "int";
            if (lit.FLOAT() != null) return "float";
            if (lit.STRING() != null) return "string";
            string t = lit.GetText();
            if (t == "true" || t == "false") return "bool";
            return "unknown";
        }
        if (node is HksScriptParser.VarExprContext vc)
        {
            string id = vc.ID().GetText();
            if (varTypes.TryGetValue(id, out var t)) return t;
            if (apiTypes.Contains(id)) return id;
            return "unknown";
        }
        if (node is HksScriptParser.LoadExprContext) return "Mat";
        if (node is HksScriptParser.CallExprContext cc)
        {
            string funcName = cc.ID().GetText();
            int dot = funcName.IndexOf('.');
            if (dot > 0)
            {
                string typeName = funcName[..dot];
                string methodName = funcName[(dot + 1)..];
                if (apiReturnTypes.TryGetValue(typeName, out var methods)
                    && methods.TryGetValue(methodName, out var rt))
                    return rt;
            }
            if (funcName == "print") return "void";
            return "unknown";
        }
        if (node is HksScriptParser.MethodCallExprContext mc)
        {
            string subjectType = InferExprType(mc.expr());
            string methodName = mc.ID().GetText();
            if (apiReturnTypes.TryGetValue(subjectType, out var methods)
                && methods.TryGetValue(methodName, out var rt))
                return rt;
            return "unknown";
        }
        if (node is HksScriptParser.QueryExprContext qc)
            return InferExprType(qc.expr());
        if (node is HksScriptParser.ParenExprContext pc)
            return InferExprType(pc.expr());
        if (node is HksScriptParser.PipeExprContext pipe)
        {
            string rt = InferExprType(pipe.expr(1));
            return rt != "unknown" ? rt : InferExprType(pipe.expr(0));
        }
        if (node is HksScriptParser.UnaryExprContext uc)
            return InferExprType(uc.expr());
        if (node is HksScriptParser.AddExprContext add)
        {
            string l = InferExprType(add.expr(0));
            string r = InferExprType(add.expr(1));
            if (l == "float" || r == "float") return "float";
            if (l == "int" || r == "int") return "int";
            return "unknown";
        }
        if (node is HksScriptParser.MulExprContext mul)
        {
            string l = InferExprType(mul.expr(0));
            string r = InferExprType(mul.expr(1));
            if (l == "float" || r == "float") return "float";
            if (l == "int" || r == "int") return "int";
            return "unknown";
        }
        if (node is HksScriptParser.CompExprContext) return "bool";
        return "unknown";
    }

    private void AnnotateToken(IToken token, string semanticType)
    {
        if (token == null) return;
        Result.Symbols.Add(new TokenAnnotation
        {
            Line = token.Line,
            Column = token.Column,
            Length = token.StopIndex - token.StartIndex + 1,
            SemanticType = semanticType
        });
    }

    public string ToJson()
    {
        return JsonSerializer.Serialize(Result, new JsonSerializerOptions
        {
            WriteIndented = false,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }
}

public class AnalyzeErrorListener : IAntlrErrorListener<IToken>
{
    private readonly AnalyzeResult result;
    public AnalyzeErrorListener(AnalyzeResult r) => result = r;

    public void SyntaxError(TextWriter output, IRecognizer recognizer, IToken offendingSymbol, int line, int col, string msg, RecognitionException e)
    {
        result.Errors.Add(new AnalyzeError
        {
            Line = line,
            Column = col,
            Length = offendingSymbol?.StopIndex - offendingSymbol?.StartIndex + 1 ?? 1,
            Message = msg
        });
    }
}

public class ApiDef
{
    public string Version { get; set; } = "";
    public string Description { get; set; } = "";
    public Dictionary<string, ApiTypeDef> Types { get; set; } = new();
    public Dictionary<string, ApiBuiltinDef> Builtins { get; set; } = new();
}

public class ApiTypeDef
{
    public string? Description { get; set; }
    public Dictionary<string, ApiMethodDef>? Methods { get; set; }
    public Dictionary<string, string>? Fields { get; set; }
}

public class ApiMethodDef
{
    public string ReturnType { get; set; } = "";
    public List<ApiArgDef> Args { get; set; } = new();
    public bool Static { get; set; }
}

public class ApiArgDef
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
}

public class ApiBuiltinDef
{
    public string Description { get; set; } = "";
}
