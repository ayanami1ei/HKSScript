namespace HksScript.Hir;

public record class Import : HirBasicNode
{
    private String[]? imported =null;

    public Import(int id, String[]? imported)
    {
        type = HirType.Import;
        this.id = id;
        this.imported = imported;
    }

    public String[]? Imported
    {
        get{ return imported; }
    }
}