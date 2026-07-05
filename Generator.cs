using NLua;

namespace HKSScript;

/// <summary>
/// 从 Lua 脚本 + C# 类型自动生成 C 可用的库代码
/// </summary>
public static class Generator
{
    public static void Generate(string outputDir, Dictionary<string, Job> jobs, string[]? luaScripts = null)
    {
        Directory.CreateDirectory(outputDir);

        var jobNames = new List<string>();
        var toolsByJob = new Dictionary<string, List<string>>();

        foreach (var (name, job) in jobs)
        {
            jobNames.Add(name);
            var toolList = new List<string>();
            foreach (var tool in job.Tools)
                toolList.Add(tool.Name);
            toolsByJob[name] = toolList;
        }

        // 可选：从 Lua 脚本提取额外信息
        var luaFunctions = new List<string>();
        if (luaScripts != null)
        {
            foreach (var script in luaScripts)
            {
                if (!File.Exists(script)) continue;
                var content = File.ReadAllText(script);
                // 提取 function M.xxx 定义
                foreach (var line in content.Split('\n'))
                {
                    var trimmed = line.Trim();
                    if (trimmed.StartsWith("function M."))
                    {
                        var funcName = trimmed[11..].Split('(')[0].Trim();
                        if (!luaFunctions.Contains(funcName))
                            luaFunctions.Add(funcName);
                    }
                }
            }
        }

        WriteHeader(outputDir, jobNames, toolsByJob);
        WriteCSharpExports(outputDir, jobNames, toolsByJob);
        WriteCHost(outputDir, jobNames);
        WriteBuildFile(outputDir, jobNames);
    }

    private static void WriteHeader(string dir, List<string> jobNames, Dictionary<string, List<string>> toolsByJob)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("/*");
        sb.AppendLine(" * hks_api.h — 由 HKSScript 自动生成");
        sb.AppendLine(" * Lua 脚本定义流程，此头文件提供 C 调用接口");
        sb.AppendLine(" */");
        sb.AppendLine();
        sb.AppendLine("#ifndef HKS_API_H");
        sb.AppendLine("#define HKS_API_H");
        sb.AppendLine();
        sb.AppendLine("#include <stdint.h>");
        sb.AppendLine();
        sb.AppendLine("#ifdef __cplusplus");
        sb.AppendLine("extern \"C\" {");
        sb.AppendLine("#endif");
        sb.AppendLine();

        sb.AppendLine("/* --- 数据类型 --- */");
        sb.AppendLine();
        sb.AppendLine("typedef struct {");
        sb.AppendLine("    const char* name;");
        sb.AppendLine("} hks_tool_t;");
        sb.AppendLine();
        sb.AppendLine("typedef struct {");
        sb.AppendLine("    const char*  name;");
        sb.AppendLine("    hks_tool_t** tools;");
        sb.AppendLine("    int32_t      tool_count;");
        sb.AppendLine("} hks_job_t;");
        sb.AppendLine();

        sb.AppendLine("/* --- 生命周期 --- */");
        sb.AppendLine();
        sb.AppendLine("// 初始化运行时");
        sb.AppendLine("int32_t hks_init(const char* runtime_path);");
        sb.AppendLine();
        sb.AppendLine("// 关闭运行时");
        sb.AppendLine("void    hks_shutdown(void);");
        sb.AppendLine();

        sb.AppendLine("/* --- Job 操作 --- */");
        sb.AppendLine();
        sb.AppendLine("int32_t hks_get_job_count(void);");
        sb.AppendLine("char*   hks_get_job_name(int32_t index);");
        sb.AppendLine("int32_t hks_get_tool_count(const char* job_name);");
        sb.AppendLine("char*   hks_get_tool_name(const char* job_name, int32_t index);");
        sb.AppendLine();

        sb.AppendLine("/* --- 执行 --- */");
        sb.AppendLine();
        sb.AppendLine("int32_t hks_run_job(const char* job_name);");
        sb.AppendLine("int32_t hks_run_all(void);");
        sb.AppendLine();

        sb.AppendLine("/* --- 动态构建 --- */");
        sb.AppendLine();
        sb.AppendLine("int32_t hks_add_job(const char* name);");
        sb.AppendLine("int32_t hks_add_tool(const char* job_name, const char* tool_name);");
        sb.AppendLine();

        sb.AppendLine("/* --- 内存管理 --- */");
        sb.AppendLine();
        sb.AppendLine("void hks_free_string(char* str);");
        sb.AppendLine();

        sb.AppendLine("#ifdef __cplusplus");
        sb.AppendLine("}");
        sb.AppendLine("#endif");
        sb.AppendLine();
        sb.AppendLine("#endif // HKS_API_H");

        // 便捷宏
        sb.AppendLine();
        sb.AppendLine("/*");
        sb.AppendLine(" * ============ 便捷宏（按实际 Job 生成） ============");
        sb.AppendLine(" */");
        foreach (var job in jobNames)
        {
            var upper = job.ToUpperInvariant();
            sb.AppendLine($"#define HKS_JOB_{upper} \"{job}\"");
        }
        sb.AppendLine();
        foreach (var job in jobNames)
        {
            sb.AppendLine($"#define hks_run_{job.ToLowerInvariant()}()  hks_run_job(HKS_JOB_{job.ToUpperInvariant()})");
        }

        File.WriteAllText(Path.Combine(dir, "hks_api.h"), sb.ToString());
        Console.WriteLine($"  Generated: hks_api.h ({jobNames.Count} jobs)");
    }

    private static void WriteCSharpExports(string dir, List<string> jobs, Dictionary<string, List<string>> tools)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("// hks_exports.cs — 自动生成的 C# 导出层");
        sb.AppendLine("// 配合 NativeAOT 编译为 .so/.dll 供 C 调用");
        sb.AppendLine();
        sb.AppendLine("using System.Runtime.InteropServices;");
        sb.AppendLine("using HKSScript;");
        sb.AppendLine();
        sb.AppendLine("namespace HKSScript.Exports;");
        sb.AppendLine();
        sb.AppendLine("public static class HksNative");
        sb.AppendLine("{");
        sb.AppendLine("    private static JobRunner? _runner;");
        sb.AppendLine();
        sb.AppendLine("    [UnmanagedCallersOnly(EntryPoint = \"hks_init\")]");
        sb.AppendLine("    public static int Init(IntPtr runtimePath)");
        sb.AppendLine("    {");
        sb.AppendLine("        try { _runner = new JobRunner(); _runner.Initialize(); return 0; }");
        sb.AppendLine("        catch { return -1; }");
        sb.AppendLine("    }");
        sb.AppendLine();
        sb.AppendLine("    [UnmanagedCallersOnly(EntryPoint = \"hks_shutdown\")]");
        sb.AppendLine("    public static void Shutdown()");
        sb.AppendLine("    {");
        sb.AppendLine("        _runner?.Dispose();");
        sb.AppendLine("        _runner = null;");
        sb.AppendLine("    }");
        sb.AppendLine();
        sb.AppendLine("    [UnmanagedCallersOnly(EntryPoint = \"hks_run_job\")]");
        sb.AppendLine("    public static int RunJob(IntPtr namePtr)");
        sb.AppendLine("    {");
        sb.AppendLine("        var name = Marshal.PtrToStringUTF8(namePtr) ?? \"\";");
        sb.AppendLine("        return _runner?.RunJob(name) ?? -1;");
        sb.AppendLine("    }");
        sb.AppendLine();
        sb.AppendLine("    [UnmanagedCallersOnly(EntryPoint = \"hks_run_all\")]");
        sb.AppendLine("    public static int RunAll()");
        sb.AppendLine("    {");
        sb.AppendLine("        return _runner?.RunAll() ?? -1;");
        sb.AppendLine("    }");
        sb.AppendLine();
        sb.AppendLine("    [UnmanagedCallersOnly(EntryPoint = \"hks_get_job_count\")]");
        sb.AppendLine("    public static int GetJobCount()");
        sb.AppendLine("    {");
        sb.AppendLine("        return _runner?.GetJobCount() ?? 0;");
        sb.AppendLine("    }");

        // 为每个 Job 生成专属导出
        foreach (var job in jobs)
        {
            var safe = job.Replace(" ", "_");
            sb.AppendLine();
            sb.AppendLine($"    [UnmanagedCallersOnly(EntryPoint = \"hks_run_{safe.ToLowerInvariant()}\")]");
            sb.AppendLine($"    public static int Run_{safe}()");
            sb.AppendLine("    {");
            sb.AppendLine($"        return _runner?.RunJob(\"{job}\") ?? -1;");
            sb.AppendLine("    }");
        }

        sb.AppendLine("}");

        File.WriteAllText(Path.Combine(dir, "hks_exports.cs"), sb.ToString());
        Console.WriteLine($"  Generated: hks_exports.cs");
    }

    private static void WriteCHost(string dir, List<string> jobs)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("/*");
        sb.AppendLine(" * hks_host.c — C 宿主示例");
        sb.AppendLine(" * 演示如何从 C 调用 HKSScript");
        sb.AppendLine(" */");
        sb.AppendLine();
        sb.AppendLine("#include \"hks_api.h\"");
        sb.AppendLine("#include <stdio.h>");
        sb.AppendLine("#include <string.h>");
        sb.AppendLine();
        sb.AppendLine("int main(int argc, char** argv)");
        sb.AppendLine("{");
        sb.AppendLine("    if (hks_init(NULL) != 0)");
        sb.AppendLine("    {");
        sb.AppendLine("        fprintf(stderr, \"Failed to init HKSScript\\n\");");
        sb.AppendLine("        return 1;");
        sb.AppendLine("    }");
        sb.AppendLine();
        sb.AppendLine("    const char* target = argc > 1 ? argv[1] : NULL;");
        sb.AppendLine();
        sb.AppendLine("    if (target == NULL)");
        sb.AppendLine("    {");
        sb.AppendLine("        int count = hks_get_job_count();");
        sb.AppendLine("        printf(\"Available Jobs (%d):\\n\", count);");
        sb.AppendLine("        for (int i = 0; i < count; i++)");
        sb.AppendLine("        {");
        sb.AppendLine("            char* name = hks_get_job_name(i);");
        sb.AppendLine("            printf(\"  - %s\\n\", name);");
        sb.AppendLine("            hks_free_string(name);");
        sb.AppendLine("        }");
        sb.AppendLine("        hks_shutdown();");
        sb.AppendLine("        return 0;");
        sb.AppendLine("    }");
        sb.AppendLine();

        if (jobs.Count > 0)
        {
            sb.AppendLine($"    if (strcmp(target, \"{jobs[0].ToLowerInvariant()}\") == 0)");
            sb.AppendLine($"        return hks_run_{jobs[0].ToLowerInvariant()}();");
        }
        sb.AppendLine();
        sb.AppendLine("    if (strcmp(target, \"all\") == 0)");
        sb.AppendLine("        return hks_run_all();");
        sb.AppendLine();
        sb.AppendLine("    // 通用：按名称执行");
        sb.AppendLine("    int result = hks_run_job(target);");
        sb.AppendLine("    hks_shutdown();");
        sb.AppendLine("    return result;");
        sb.AppendLine("}");

        File.WriteAllText(Path.Combine(dir, "hks_host.c"), sb.ToString());
        Console.WriteLine($"  Generated: hks_host.c");
    }

    private static void WriteBuildFile(string dir, List<string> jobs)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# CMakeLists.txt");
        sb.AppendLine();
        sb.AppendLine("cmake_minimum_required(VERSION 3.20)");
        sb.AppendLine("project(HKSScript C)");
        sb.AppendLine();
        sb.AppendLine("# 1. 先发布 C# 项目为 NativeAOT 共享库");
        sb.AppendLine("#    dotnet publish ../HKSScript.csproj \\");
        sb.AppendLine("#        -p:PublishAot=true \\");
        sb.AppendLine("#        -p:NativeLib=Shared \\");
        sb.AppendLine("#        -p:CustomNativeMain=false \\");
        sb.AppendLine("#        -o ./lib");
        sb.AppendLine();
        sb.AppendLine("# 2. 再编译 C 宿主");
        sb.AppendLine("add_executable(hks_host hks_host.c)");
        sb.AppendLine("target_include_directories(hks_host PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})");
        sb.AppendLine();
        sb.AppendLine("# 链接生成的 C# 原生库");
        sb.AppendLine("target_link_directories(hks_host PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/lib)");
        sb.AppendLine();
        sb.AppendLine("if(WIN32)");
        sb.AppendLine("    target_link_libraries(hks_host HKSScript)");
        sb.AppendLine("else()");
        sb.AppendLine("    target_link_libraries(hks_host HKSScript dl pthread)");
        sb.AppendLine("endif()");

        File.WriteAllText(Path.Combine(dir, "CMakeLists.txt"), sb.ToString());
        Console.WriteLine($"  Generated: CMakeLists.txt");
    }
}
