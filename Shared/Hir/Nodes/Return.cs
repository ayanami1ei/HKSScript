public record class Return : HirBasicNode
{
    private int blockId;
    private int varId;

    public Return(int id, int block, int var)
    {
        type = HirType.Return;
        this.id = id;
        blockId = block;
        varId = var;
    }

    public int Block
    {
        get { return blockId; }
    }
    public int Var
    {
        get { return varId; }
    }
}