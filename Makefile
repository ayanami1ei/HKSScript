CONFIG=Release
RELEASE_DIR=release/hkscript_v0.2.0
RELEASE_ARCHIVE=release/hkscript_v0.2.0.tar.gz

.PHONY: build build-win build-linux build-nuget build-vsix release wine-test clean list install run

default: build release

# ─── 编译 ───
build:
	dotnet restore
	dotnet build HKSScript.csproj -c $(CONFIG) --no-dependencies

build-win:
	cd HksFuncGenerator && dotnet restore -r win-x64; cd ..
	dotnet restore -r win-x64
	dotnet publish HKSScript.csproj -c $(CONFIG) -r win-x64 --no-self-contained -p:PublishSingleFile=true -o /tmp/hks_win

build-linux:
	cd HksFuncGenerator && dotnet restore -r linux-x64; cd ..
	dotnet restore -r linux-x64
	dotnet publish HKSScript.csproj -c $(CONFIG) -r linux-x64 --no-self-contained -p:PublishSingleFile=true -o /tmp/hks_linux

build-nuget:
	dotnet build HksScript.Sdk/HksScript.Sdk.csproj -c $(CONFIG)
	dotnet pack HksScript.Sdk/HksScript.Sdk.csproj -c $(CONFIG) -o ./

build-vsix:
	cd Frontend/vscode-hksscript && npx vsce package

# ─── 打包 release ───
release: build build-win build-linux build-nuget build-vsix
	mkdir -p $(RELEASE_DIR)
	cp -f /tmp/hks_linux/HKSScript $(RELEASE_DIR)/ 2>/dev/null || true
	cp -f /tmp/hks_win/HKSScript.exe $(RELEASE_DIR)/ 2>/dev/null || true
	cp -f bin/$(CONFIG)/net10.0/HKSScript.dll $(RELEASE_DIR)/
	cp -f bin/$(CONFIG)/net10.0/HKSScript.runtimeconfig.json $(RELEASE_DIR)/
	cp -f bin/$(CONFIG)/net10.0/HksScript.Sdk.dll $(RELEASE_DIR)/
	cp -f HksScript.Sdk.*.nupkg $(RELEASE_DIR)/ 2>/dev/null || true
	cp -f Frontend/vscode-hksscript/hksscript-*.vsix $(RELEASE_DIR)/ 2>/dev/null || true
	cp -f run_csharp.sh $(RELEASE_DIR)/ 2>/dev/null || true
	tar czf $(RELEASE_ARCHIVE) -C release hkscript_v0.2.0/
	@echo "=== release: $(RELEASE_ARCHIVE) ==="

# ─── Wine 测试 ───
wine-test:
	wine explorer /desktop=hks,1280x720 /tmp/hks_win/HKSScript.exe $(ARGS)

wine-install:
	wine explorer /desktop=hks,1280x720 /tmp/hks_win/HKSScript.exe install global $(DLL)

# ─── 其它 ───
clean:
	rm -rf obj bin release/hkscript_v0.2.0 Frontend/vscode-hkscript/*.vsix

list:
	./bin/$(CONFIG)/net10.0/HKSScript list

install:
	./bin/$(CONFIG)/net10.0/HKSScript install global $(DLL)

run:
	./bin/$(CONFIG)/net10.0/HKSScript run $(FILE)

check:
	./bin/$(CONFIG)/net10.0/HKSScript check $(FILE)
