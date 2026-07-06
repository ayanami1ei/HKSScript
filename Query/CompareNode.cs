class CompareNode : QueryNode
{
    public FeatureNode FeatureName;
    public CompareOp Op;
    public FeatureValue Value;

    public CompareNode(FeatureNode fn, CompareOp op, FeatureValue value)
    {
        this.FeatureName = fn;
        Op = op;
        Value = value;
    }
}