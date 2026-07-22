public record class Assign : HirBasicNode
{
    private int rhsId;
    private int lhsId;

    public Assign(int id, int rhsId, int lhsId)
    {
        type = HirType.Assign;
        this.id = id;
        this.rhsId = rhsId;
        this.lhsId = lhsId;
    }

    public int Rhs
    {
        get { return rhsId; }
    }
    public int Lhs
    {
        get { return lhsId; }
    }
}