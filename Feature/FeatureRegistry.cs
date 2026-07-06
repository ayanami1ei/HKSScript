public class FeatureRegistry
{
    private Dictionary<string, Feature> features = [];

    public void Register(Feature feature)
    {
        features.Add(feature.GetName(), feature);
    }

    public FeatureValue Call(string name, Circle input)
    {
        return features[name].Execute(input);
    }
}