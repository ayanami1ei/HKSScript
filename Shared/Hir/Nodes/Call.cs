namespace HksScript.Hir;

public record class Call : HirBasicNode
{
    private string name;
    private int[] args;

    public Call(int id, string name, int[] args)
    {
        type = HirType.Call;
        this.id = id;
        this.name = name;
        this.args = args;
    }

    public string Name => name;
    public int[] Args => args;
}
