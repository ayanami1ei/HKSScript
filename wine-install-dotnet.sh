#!/bin/bash
# 在 wine 中安装 .NET SDK 8.0 (直接下载 zip)
set -e
WINEPREFIX="${WINEPREFIX:-$HOME/.wine}"
DOTNET_DIR="$WINEPREFIX/drive_c/dotnet"
SDK_VER="8.0.404"
ZIP_URL="https://builds.dotnet.microsoft.com/dotnet/Sdk/$SDK_VER/dotnet-sdk-$SDK_VER-win-x64.zip"
ZIP_FILE="/tmp/dotnet-sdk-$SDK_VER-win-x64.zip"

echo "=== 在 wine 中安装 .NET SDK $SDK_VER ==="
mkdir -p "$DOTNET_DIR"

if [ ! -f "$ZIP_FILE" ]; then
    echo "下载 SDK zip (约 200MB)..."
    wget -O "$ZIP_FILE" "$ZIP_URL" 2>&1 | tail -3 || curl -L -o "$ZIP_FILE" "$ZIP_URL"
fi

if [ -f "$ZIP_FILE" ]; then
    echo "解压..."
    unzip -q -o "$ZIP_FILE" -d "$DOTNET_DIR"
fi

if [ -f "$DOTNET_DIR/dotnet.exe" ]; then
    echo "验证:"
    wine "$DOTNET_DIR/dotnet.exe" --list-sdks 2>/dev/null | grep -v "libEGL\|pci id" || wine "$DOTNET_DIR/dotnet.exe" --list-runtimes 2>/dev/null | grep -v "libEGL\|pci id"
    echo ""
    echo "=== 安装完成 ==="
    echo "编译: WINEDEBUG=-all wine $DOTNET_DIR/dotnet.exe build 项目.csproj -c Release"
else
    echo "下载失败, 请手动下载:"
    echo "  $ZIP_URL"
    echo "解压到: $DOTNET_DIR"
fi
