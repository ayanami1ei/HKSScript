-- ========================================
--  C# 类型声明（EmmyLua 注解）
-- ========================================

--- C# 注入的 luanet 桥接表
---@class NLuaBridge
---@field load_assembly fun(name: string)
---@field import_type fun(name: string): table
luanet = {}

--- C# 注册的工厂函数
---@type fun(): Job
NewJob = nil

---@type fun(): Tool
NewTool = nil

--- C# 注入的数据
---@type table<string, Job>
Jobs = {}

---@type string[]
JobNames = {}

---@type string[]
lua_args = {}

--- Tool 节点
---@class Tool
---@field Name string

--- Job 包含 Tool 链
---@class Job
---@field Name string
---@field Tools Tool[]

--- HKS 库返回类型
---@class HKS
---@field Console table
---@field SB table
---@field Job table
---@field Tool table
---@field NewJob fun(): Job
---@field NewTool fun(): Tool
---@field Jobs table<string, Job>
---@field JobNames string[]
---@field LuaArgs string[]
---@field RunChain fun(job: Job)
---@field RunJob fun(name: string)
---@field RunAll fun()
---@field ListJobs fun()
---@field GetSelection fun(): string
