namespace HksScript.Hir;

public abstract record class HirBasicNode
{
    protected HirType type;
    protected int id;

    public HirType Type
    {
        get { return type; }
    }

    public int Id
    {
        get { return id; }
    }
}