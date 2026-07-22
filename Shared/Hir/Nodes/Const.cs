public record class Const : HirBasicNode
{
    private string constType;
    private object constValue;

    public Const(int id, string type, object value)
    {
        this.type = HirType.Const;
        this.id = id;
        constType = type;
        constValue = value;
    }

    public string ConstType
    {
        get { return constType; }
    }

    public object ConstValue
    {
        get { return constValue; }
    }
}
