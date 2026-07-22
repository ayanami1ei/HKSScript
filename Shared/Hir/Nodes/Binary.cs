public record class Binary : HirBasicNode
{
    private BinaryOp op;
    private int left;
    private int right;

    public Binary(int id, BinaryOp op, int left, int right)
    {
        type = HirType.Binary;
        this.id = id;
        this.op = op;
        this.left = left;
        this.right = right;
    }

    public BinaryOp Op   { get { return op; } }
    public int Left      { get { return left; } }
    public int Right     { get { return right; } }
}
