public record class Unary : HirBasicNode
{
    private int operand;

    public Unary(int id, int operand)
    {
        type = HirType.Unary;
        this.id = id;
        this.operand = operand;
    }

    public int Operand
    {
        get { return operand; }
    }
}
