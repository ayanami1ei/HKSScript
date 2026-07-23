namespace HksScript;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class HksFuncAttribute : Attribute
{
    public string? Alias { get; set; }
}
