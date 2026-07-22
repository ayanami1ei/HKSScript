public record class New : HirBasicNode
{
    private int varId;
    private String varType;

    public New(int id, int var, String type)
    {
        this.type = HirType.New;
        this.id = id;
        varId = var;
        varType = type;
    }

    public int Var
    {
        get { return varId; }
    }
    
    public String VarType
    {
        get{ return varType; }
    }
}