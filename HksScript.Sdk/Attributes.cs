namespace HksScript;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class HksFuncAttribute : Attribute
{
    public string? Alias { get; set; }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false)]
public class HksTypeAttribute : Attribute
{
    public string? Alias { get; set; }
}
