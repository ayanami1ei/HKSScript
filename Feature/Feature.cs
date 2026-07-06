public interface Feature
{
    String GetName();
    FeatureValue Execute(Circle input);
}