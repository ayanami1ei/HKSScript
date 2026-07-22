public record class Call : HirBasicNode
{
    private int blockId;

    public Call(int id, int block)
    {
        type = HirType.Call;
        this.id = id;
        this.blockId = block;
    }

    public int Block{
        set{ blockId = value; }
    }
}