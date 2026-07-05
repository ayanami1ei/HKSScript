-- ========================================
--  主脚本：业务编排
-- ========================================
---@type HKS
local hks = require("hks")

hks.ListJobs()

local selection = hks.GetSelection()
print("Selected: " .. selection)

if selection == "all" then
    hks.RunAll()
else
    hks.RunJob(selection)
end

local a=hks.Job()
a.Name = "test"
print(a.Name)