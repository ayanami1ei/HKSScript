// hks_exports.cs — 自动生成的 C# 导出层
// 配合 NativeAOT 编译为 .so/.dll 供 C 调用

using System.Runtime.InteropServices;
using HKSScript;

namespace HKSScript.Exports;

public static class HksNative
{
    private static JobRunner? _runner;

    [UnmanagedCallersOnly(EntryPoint = "hks_init")]
    public static int Init(IntPtr runtimePath)
    {
        try { _runner = new JobRunner(); _runner.Initialize(); return 0; }
        catch { return -1; }
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_shutdown")]
    public static void Shutdown()
    {
        _runner?.Dispose();
        _runner = null;
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_run_job")]
    public static int RunJob(IntPtr namePtr)
    {
        var name = Marshal.PtrToStringUTF8(namePtr) ?? "";
        return _runner?.RunJob(name) ?? -1;
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_run_all")]
    public static int RunAll()
    {
        return _runner?.RunAll() ?? -1;
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_get_job_count")]
    public static int GetJobCount()
    {
        return _runner?.GetJobCount() ?? 0;
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_run_dataclean")]
    public static int Run_DataClean()
    {
        return _runner?.RunJob("DataClean") ?? -1;
    }

    [UnmanagedCallersOnly(EntryPoint = "hks_run_dataexport")]
    public static int Run_DataExport()
    {
        return _runner?.RunJob("DataExport") ?? -1;
    }
}
