#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENERATOR="$ROOT_DIR/Frontend/regenerate-grammar.sh"
GRAMMAR_DIR="$ROOT_DIR/Frontend/Grammar"

fail() {
  echo "测试失败：$1"
  exit 1
}

# 测试1：生成脚本存在并且可以执行
[[ -x "$GENERATOR" ]] || fail "生成脚本不存在或不能执行"

# 测试2：从项目目录以外运行，检查路径处理
(
  cd /tmp
  "$GENERATOR"
)

# 测试3：检查所有预期文件是否生成且非空
EXPECTED_FILES=(
  "HksScriptLexer.cs"
  "HksScriptParser.cs"
  "HksScriptListener.cs"
  "HksScriptBaseListener.cs"
  "HksScriptVisitor.cs"
  "HksScriptBaseVisitor.cs"
)

for file in "${EXPECTED_FILES[@]}"; do
  [[ -s "$GRAMMAR_DIR/$file" ]] || fail "没有生成 $file"
done

# 测试4：检查生成的文件中确实包含 Lexer 和 Parser
grep -q "class HksScriptLexer" \
  "$GRAMMAR_DIR/HksScriptLexer.cs" ||
  fail "Lexer 文件内容不正确"

grep -q "class HksScriptParser" \
  "$GRAMMAR_DIR/HksScriptParser.cs" ||
  fail "Parser 文件内容不正确"

# 测试5：检查临时文件已被 Git 忽略
git -C "$ROOT_DIR" check-ignore -q \
  "$GRAMMAR_DIR/HksScript.interp" ||
  fail ".interp 文件没有被忽略"

git -C "$ROOT_DIR" check-ignore -q \
  "$GRAMMAR_DIR/HksScript.tokens" ||
  fail ".tokens 文件没有被忽略"

echo "全部测试通过"