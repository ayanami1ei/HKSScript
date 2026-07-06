class WhereNode : QueryNode
{
    public required string FeatureName;
    public required Func<FeatureValue, bool> Predicate;
}