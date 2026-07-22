namespace HksScript.Hir;

public record class Branch : HirBasicNode
{
    private int condId;
    private HirBasicNode[] then;
    private HirBasicNode[]? els;

    public Branch(int id, int cond, HirBasicNode[] then, HirBasicNode[]? els = null)
    {
        type = HirType.Branch;
        this.id = id;
        condId = cond;
        this.then = then;
        this.els = els;
    }

    public int Cond => condId;
    public HirBasicNode[] Then => then;
    public HirBasicNode[]? Else => els;
}
