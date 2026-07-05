-- ========================================
--  HKSScript C# 桥接库
--  用法: local hks = require("hks")
-- ========================================
---@diagnostic disable: undefined-global

local M = {}

luanet.load_assembly('System')
luanet.load_assembly('System.Collections')
luanet.load_assembly('System.Console')
luanet.load_assembly('HKSScript')

M.Console = luanet.import_type('System.Console')
M.SB = luanet.import_type('System.Text.StringBuilder')
M.Job = luanet.import_type('HKSScript.Job')
M.Tool = luanet.import_type('HKSScript.Tool')

-- C# 注入的数据
M.NewJob = NewJob
M.NewTool = NewTool
M.Jobs = Jobs
M.JobNames = JobNames
M.LuaArgs = lua_args

-- ========================================
--  API
-- ========================================

--- 执行一个 Job 的 Tool 链
---@param job Job
function M.RunChain(job)
    M.Console.WriteLine("========================================")
    M.Console.WriteLine("Job: " .. job.Name)
    M.Console.WriteLine("Tool chain: " .. job.Tools.Count .. " steps")
    M.Console.WriteLine("========================================")

    for i = 0, job.Tools.Count - 1 do
        local tool = job.Tools[i]
        print(string.format("  [%d/%d] %s", i + 1, job.Tools.Count, tool.Name))
    end

    M.Console.WriteLine("Result: " .. job.Name .. " completed!\n")
end

--- 按名称运行单个 Job
---@param name string
function M.RunJob(name)
    if M.Jobs[name] then
        M.RunChain(M.Jobs[name])
    else
        print("Job not found: " .. name)
    end
end

--- 运行所有 Job
function M.RunAll()
    for i = 0, M.JobNames.Length - 1 do
        M.RunChain(M.Jobs[M.JobNames[i]])
    end
end

--- 列出可用 Job
function M.ListJobs()
    print("Available Jobs:")
    for i = 0, M.JobNames.Length - 1 do
        print("  - " .. M.JobNames[i])
    end
    print()
end

--- 解析命令行参数
---@return string
function M.GetSelection()
    if M.LuaArgs ~= nil and M.LuaArgs.Length > 0 then
        return M.LuaArgs[0]
    end
    return "DataClean"
end

return M
