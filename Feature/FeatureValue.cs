public class FeatureValue
{
    public FeatureValueType Type { get; }

    private readonly object _value;

    public FeatureValue(object value, FeatureValueType type)
    {
        _value = value;
        Type = type;
    }

    public T As<T>() => (T)_value;
}