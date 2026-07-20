class Area : Feature
{
    public FeatureValue Execute(Circle input)
    {
        Console.WriteLine("  call area feature");
        return new FeatureValue(0, FeatureValueType.Int);
    }

    public string GetName()
    {
        return "area";
    }
}

class Demo
{
    public static void Main(string[] args)
    {
        int exitCode = HksScriptCli.Run(args);
        System.Environment.Exit(exitCode);
    }
}
