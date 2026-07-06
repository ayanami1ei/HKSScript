using System.Xml;

public class Query
{
    private List<QueryNode> ExecuteList = [];

    public Query Circle()
    {
        return this;
    }

    public Query Where(Feature feature, CompareOp op, FeatureValue value)
    {
        FeatureNode fn = new(feature.GetName());
        CompareNode cn = new(fn, op, value);

        this.ExecuteList.Add(fn);
        this.ExecuteList.Add(cn);

        return this;
    }

    public List<Circle> Execute(List<Circle> circles)
    {
        List<Circle> res = [];
        foreach (QueryNode node in ExecuteList)
        {
            foreach(Circle c in circles)
            {
                Console.WriteLine("query a circle");
            }
        }

        return res;
    }
}