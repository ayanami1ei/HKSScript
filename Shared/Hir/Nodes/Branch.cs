namespace HksScript.Hir;

public record class Branch : HirBasicNode
{
    private int blockId;

    public Branch(int id, int block)
    {
        type = HirType.Branch;
        this.id = id;
        blockId = block;
    }

    public int Block{
        set{ blockId = value; }
    }
}