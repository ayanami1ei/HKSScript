using System.Text.Json;

namespace HksScript.Module;

public class ModuleFunctionDef
{
    public string ScriptName { get; set; } = "";
    public string Method { get; set; } = "";
    public string[] Params { get; set; } = [];
    public string Returns { get; set; } = "";
}

public class ModuleDefinition
{
    public string Module { get; set; } = "";
    public string Assembly { get; set; } = "";
    public List<ModuleFunctionDef> Functions { get; set; } = [];
}
