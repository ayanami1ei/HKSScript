using System.Collections;

public class ScriptSet : IEnumerable
{
    private readonly List<object?> _items;

    public int Len => _items.Count;

    public ScriptSet() => _items = new();
    public ScriptSet(IEnumerable<object?> items) => _items = items.ToList();

    public ScriptSet Query(Func<object?, bool> pred)
        => new(_items.Where(pred));

    public ScriptSet Union(ScriptSet other)
    {
        var set = new HashSet<object?>(_items);
        set.UnionWith(other._items);
        return new ScriptSet(set);
    }

    public ScriptSet Intersect(ScriptSet other)
        => new(_items.Intersect(other._items));

    public ScriptSet Diff(ScriptSet other)
        => new(_items.Except(other._items));

    public IEnumerator GetEnumerator() => _items.GetEnumerator();
}
