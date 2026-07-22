namespace HksScript.Hir;

public record class New : HirBasicNode
{
    private int varId;
    private string varType;
    private object? constValue;

    public New(int id, int var, string type, object? constValue = null)
    {
        this.type = HirType.New;
        this.id = id;
        varId = var;
        varType = type;
        this.constValue = constValue;
    }

    public int Var => varId;
    public string VarType => varType;
    public object? ConstValue => constValue;
}
