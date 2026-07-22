using Antlr4.Runtime;
using Antlr4.Runtime.Misc;

namespace HksScript.Lexer;

public class FilteredTokenSource : ITokenSource
{
    private readonly IList<IToken> tokens;
    private int pos;

    public FilteredTokenSource(IList<IToken> tokens)
    {
        this.tokens = tokens;
    }

    public int Line => tokens[pos]?.Line ?? 0;
    public int Column => tokens[pos]?.Column ?? 0;
    public ICharStream InputStream => tokens[0]?.TokenSource?.InputStream!;
    public string SourceName => tokens[0]?.TokenSource?.SourceName ?? "";
    public ITokenFactory TokenFactory { get; set; } = CommonTokenFactory.Default;

    public IToken NextToken()
    {
        if (pos >= tokens.Count)
            return new CommonToken(IntStreamConstants.EOF, "");
        return tokens[pos++];
    }

    public int Count => tokens.Count;
}

public class TokenStreamFilter
{
    private readonly HksScriptLexer lexer;
    private readonly Stack<int> indentStack = new();
    private int bracketDepth;
    private int prevTokenType = -1;

    public const int DEDENT = 43;

    public TokenStreamFilter(HksScriptLexer lexer)
    {
        this.lexer = lexer;
        indentStack.Push(0);
    }

    // 返回过滤后的 token 列表
    public List<IToken> Filter()
    {
        // 读取所有原始 token
        List<IToken> raw = new();
        IToken t;
        do
        {
            t = lexer.NextToken();
            raw.Add(t);
        } while (t.Type != IntStreamConstants.EOF);

        return Process(raw);
    }

    private List<IToken> Process(List<IToken> raw)
    {
        List<IToken> result = new();
        int i = 0;

        while (i < raw.Count)
        {
            var tok = raw[i];
            int type = tok.Type;

            // 跳过隐藏通道（注释）
            if (tok.Channel != 0)
            {
                i++;
                continue;
            }

            if (type == IntStreamConstants.EOF)
                break;

            // 跟踪括号
            if (type == HksScriptLexer.LPAREN) bracketDepth++;
            else if (type == HksScriptLexer.RPAREN) bracketDepth--;

            // 换行处理
            if (type == HksScriptLexer.NEWLINE)
            {
                if (bracketDepth > 0) { i++; continue; }
                if (IsContinuation(prevTokenType)) { i++; continue; }
                if (i + 1 < raw.Count && IsContinuation(raw[i + 1].Type)) { i++; continue; }

                // 先输出 NEWLINE，再处理缩进（语法规则要求 NEWLINE 在 INDENT 前）
                result.Add(tok);
                int indent = GetIndentLevel(raw, i);
                EmitIndent(indent, result);
                i++;
                continue;
            }

            prevTokenType = type;
            result.Add(tok);
            i++;
        }

        // 文件结束弹出缩进，追加EOF
        while (indentStack.Count > 1)
        {
            result.Add(MakeToken(DEDENT));
            indentStack.Pop();
        }
        var eof = raw.FirstOrDefault(t => t.Type == IntStreamConstants.EOF);
        if (eof != null) result.Add(eof);
        return result;
    }

    private void EmitIndent(int level, List<IToken> result)
    {
        if (level > indentStack.Peek())
        {
            indentStack.Push(level);
            result.Add(MakeToken(HksScriptLexer.INDENT));
        }
        else
        {
            while (level < indentStack.Peek())
            {
                result.Add(MakeToken(DEDENT));
                indentStack.Pop();
            }
        }
    }

    private int GetIndentLevel(List<IToken> raw, int newlineIndex)
    {
        for (int j = newlineIndex + 1; j < raw.Count; j++)
        {
            var t = raw[j];
            if (t.Channel != 0) continue;
            if (t.Type == HksScriptLexer.NEWLINE
                || t.Type == HksScriptLexer.LINE_COMMENT
                || t.Type == HksScriptLexer.BLOCK_COMMENT)
                continue;
            return t.Column;
        }
        return 0;
    }

    private bool IsContinuation(int type)
    {
        return type switch
        {
            // 所有运算符、逗号、冒号、逻辑关键字都是续行标记
            HksScriptLexer.PIPE or HksScriptLexer.PIPE2 or HksScriptLexer.AMP
            or HksScriptLexer.ASSIGN or HksScriptLexer.PLUS or HksScriptLexer.SUB
            or HksScriptLexer.MUL or HksScriptLexer.DIV
            or HksScriptLexer.LT or HksScriptLexer.GT or HksScriptLexer.EQ
            or HksScriptLexer.NEQ or HksScriptLexer.LE or HksScriptLexer.GE
            or HksScriptLexer.COMMA
            or HksScriptLexer.KW_AND or HksScriptLexer.KW_OR
            or HksScriptLexer.KW_NOT => true,
            _ => false
        };
    }

    private static IToken MakeToken(int type) => new CommonToken(type, "");
}
