# CMakeLists.txt

cmake_minimum_required(VERSION 3.20)
project(HKSScript C)

# 1. 先发布 C# 项目为 NativeAOT 共享库
#    dotnet publish ../HKSScript.csproj \
#        -p:PublishAot=true \
#        -p:NativeLib=Shared \
#        -p:CustomNativeMain=false \
#        -o ./lib

# 2. 再编译 C 宿主
add_executable(hks_host hks_host.c)
target_include_directories(hks_host PRIVATE ${CMAKE_CURRENT_SOURCE_DIR})

# 链接生成的 C# 原生库
target_link_directories(hks_host PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/lib)

if(WIN32)
    target_link_libraries(hks_host HKSScript)
else()
    target_link_libraries(hks_host HKSScript dl pthread)
endif()
