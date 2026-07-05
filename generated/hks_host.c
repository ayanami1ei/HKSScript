/*
 * hks_host.c — C 宿主示例
 * 演示如何从 C 调用 HKSScript
 */

#include "hks_api.h"
#include <stdio.h>
#include <string.h>

int main(int argc, char** argv)
{
    if (hks_init(NULL) != 0)
    {
        fprintf(stderr, "Failed to init HKSScript\n");
        return 1;
    }

    const char* target = argc > 1 ? argv[1] : NULL;

    if (target == NULL)
    {
        int count = hks_get_job_count();
        printf("Available Jobs (%d):\n", count);
        for (int i = 0; i < count; i++)
        {
            char* name = hks_get_job_name(i);
            printf("  - %s\n", name);
            hks_free_string(name);
        }
        hks_shutdown();
        return 0;
    }

    if (strcmp(target, "dataclean") == 0)
        return hks_run_dataclean();

    if (strcmp(target, "all") == 0)
        return hks_run_all();

    // 通用：按名称执行
    int result = hks_run_job(target);
    hks_shutdown();
    return result;
}
