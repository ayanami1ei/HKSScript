public abstract class Pack<T>;

public class One<T>(T Value) : Pack<T>
{
    public T Value { get; } = Value;
}

public class Many<T>(IEnumerable<T> items) : Pack<T>
{
    private readonly List<T> _items = items.ToList();

    public IReadOnlyList<T> Values => _items;
    public int Len => _items.Count;

    public Many<T> Map(Func<T, T> fn)
    {
        return new Many<T>(_items.Select(fn));
    }

    public Many<T> Query(Func<T, bool> pred)
    {
        return new Many<T>(_items.Where(pred));
    }

    public T? First() => _items.FirstOrDefault();
    public List<T> ToList() => new(_items);

    public Many<T> Union(Many<T> other)
    {
        var set = new HashSet<T>(_items);
        set.UnionWith(other._items);
        return new Many<T>(set);
    }

    public Many<T> Intersect(Many<T> other)
    {
        return new Many<T>(_items.Intersect(other._items));
    }

    public Many<T> Diff(Many<T> other)
    {
        return new Many<T>(_items.Except(other._items));
    }
}
