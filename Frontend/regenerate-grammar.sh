#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GRAMMAR_DIR="$SCRIPT_DIR/Grammar"
ANTLR_JAR="$SCRIPT_DIR/Tools/antlr-4.13.2-complete.jar"

(
  cd "$GRAMMAR_DIR"

  java -jar "$ANTLR_JAR" \
    -Dlanguage=CSharp \
    -visitor \
    -Xexact-output-dir \
    -o "$GRAMMAR_DIR" \
    HksScript.g4
)

echo "ANTLR C# files generated in: $GRAMMAR_DIR"