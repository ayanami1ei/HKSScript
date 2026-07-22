#!/bin/bash
set -e
cd "$(dirname "$0")"

java -jar Frontend/Tools/antlr-4.13.2-complete.jar \
    -Dlanguage=CSharp \
    Frontend/Grammar/HksScript.g4 \
    -visitor \
    -o Frontend/Grammar/

echo "Done"
