/*
 * hks_api.h — 由 HKSScript 自动生成
 * Lua 脚本定义流程，此头文件提供 C 调用接口
 */

#ifndef HKS_API_H
#define HKS_API_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* --- 数据类型 --- */

typedef struct {
    const char* name;
} hks_tool_t;

typedef struct {
    const char*  name;
    hks_tool_t** tools;
    int32_t      tool_count;
} hks_job_t;

/* --- 生命周期 --- */

// 初始化运行时
int32_t hks_init(const char* runtime_path);

// 关闭运行时
void    hks_shutdown(void);

/* --- Job 操作 --- */

int32_t hks_get_job_count(void);
char*   hks_get_job_name(int32_t index);
int32_t hks_get_tool_count(const char* job_name);
char*   hks_get_tool_name(const char* job_name, int32_t index);

/* --- 执行 --- */

int32_t hks_run_job(const char* job_name);
int32_t hks_run_all(void);

/* --- 动态构建 --- */

int32_t hks_add_job(const char* name);
int32_t hks_add_tool(const char* job_name, const char* tool_name);

/* --- 内存管理 --- */

void hks_free_string(char* str);

#ifdef __cplusplus
}
#endif

#endif // HKS_API_H

/*
 * ============ 便捷宏（按实际 Job 生成） ============
 */
#define HKS_JOB_DATACLEAN "DataClean"
#define HKS_JOB_DATAEXPORT "DataExport"

#define hks_run_dataclean()  hks_run_job(HKS_JOB_DATACLEAN)
#define hks_run_dataexport()  hks_run_job(HKS_JOB_DATAEXPORT)
