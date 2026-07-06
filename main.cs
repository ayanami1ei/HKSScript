class Area : Feature
{
    public FeatureValue Execute(Circle input)
    {
        Console.WriteLine("call area feature");
        return new FeatureValue(0, FeatureValueType.Int);
    }

    public string GetName()
    {
        return "area";
    }
}

public class Mat { }

class Demo
{
    public static void Main()
    {
        Mat image = new();
        List<Circle> c = Find.FindCircle(image);

        FeatureRegistry fr = new();
        Area af = new();
        fr.Register(af);

        Query q = new();
        q.Circle()
        .Where(af, CompareOp.Less, new FeatureValue(0, FeatureValueType.Int))
        .Execute(c);
    }
}