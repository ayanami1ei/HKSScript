# Details

Date : 2026-07-22 16:30:13

Directory /home/ayanami/HKSScript

Total : 57 files,  10347 codes, 1522 comments, 1256 blanks, all 13125 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [Backend/Interpreter/FunctionTable.cs](/Backend/Interpreter/FunctionTable.cs) | C# | 41 | 4 | 15 | 60 |
| [Backend/Interpreter/Interpreter.cs](/Backend/Interpreter/Interpreter.cs) | C# | 84 | 8 | 20 | 112 |
| [Backend/Interpreter/Test.cs](/Backend/Interpreter/Test.cs) | C# | 196 | 19 | 21 | 236 |
| [Backend/Module/Algorithm/BasicAlgo.cs](/Backend/Module/Algorithm/BasicAlgo.cs) | C# | 72 | 11 | 13 | 96 |
| [Backend/Module/Algorithm/BasicAlgoTests.cs](/Backend/Module/Algorithm/BasicAlgoTests.cs) | C# | 69 | 1 | 10 | 80 |
| [Backend/Module/Algorithm/ModuleInit.cs](/Backend/Module/Algorithm/ModuleInit.cs) | C# | 33 | 0 | 14 | 47 |
| [Backend/Module/Pack.cs](/Backend/Module/Pack.cs) | C# | 21 | 0 | 9 | 30 |
| [Cli/BuiltinRegistry.cs](/Cli/BuiltinRegistry.cs) | C# | 57 | 8 | 10 | 75 |
| [Cli/Cli.cs](/Cli/Cli.cs) | C# | 126 | 3 | 23 | 152 |
| [Cli/Program.cs](/Cli/Program.cs) | C# | 2 | 0 | 2 | 4 |
| [Code.md](/Code.md) | Markdown | 37 | 0 | 7 | 44 |
| [Doc/README.md](/Doc/README.md) | Markdown | 21 | 0 | 6 | 27 |
| [Doc/architecture.puml](/Doc/architecture.puml) | PlantUML | 18 | 0 | 6 | 24 |
| [Doc/compilation.html](/Doc/compilation.html) | HTML | 969 | 0 | 119 | 1,088 |
| [Doc/compilation.md](/Doc/compilation.md) | Markdown | 844 | 0 | 274 | 1,118 |
| [Frontend/Ast/AstBuilder.cs](/Frontend/Ast/AstBuilder.cs) | C# | 192 | 6 | 39 | 237 |
| [Frontend/Ast/AstNodes.cs](/Frontend/Ast/AstNodes.cs) | C# | 28 | 2 | 24 | 54 |
| [Frontend/Grammar/HksScriptBaseListener.cs](/Frontend/Grammar/HksScriptBaseListener.cs) | C# | 94 | 439 | 7 | 540 |
| [Frontend/Grammar/HksScriptBaseVisitor.cs](/Frontend/Grammar/HksScriptBaseVisitor.cs) | C# | 51 | 378 | 5 | 434 |
| [Frontend/Grammar/HksScriptLexer.cs](/Frontend/Grammar/HksScriptLexer.cs) | C# | 174 | 14 | 21 | 209 |
| [Frontend/Grammar/HksScriptListener.cs](/Frontend/Grammar/HksScriptListener.cs) | C# | 87 | 354 | 5 | 446 |
| [Frontend/Grammar/HksScriptParser.cs](/Frontend/Grammar/HksScriptParser.cs) | C# | 2,383 | 14 | 74 | 2,471 |
| [Frontend/Grammar/HksScriptVisitor.cs](/Frontend/Grammar/HksScriptVisitor.cs) | C# | 49 | 225 | 5 | 279 |
| [Frontend/Grammar/README.md](/Frontend/Grammar/README.md) | Markdown | 112 | 0 | 44 | 156 |
| [Frontend/Lexer/TokenStreamFilter.cs](/Frontend/Lexer/TokenStreamFilter.cs) | C# | 135 | 8 | 25 | 168 |
| [Frontend/Lowering/LoweringPass.cs](/Frontend/Lowering/LoweringPass.cs) | C# | 184 | 0 | 32 | 216 |
| [Frontend/TypeChecker/SymbolTable.cs](/Frontend/TypeChecker/SymbolTable.cs) | C# | 40 | 0 | 9 | 49 |
| [Frontend/TypeChecker/TypeChecker.cs](/Frontend/TypeChecker/TypeChecker.cs) | C# | 251 | 2 | 40 | 293 |
| [Frontend/regenerate-grammar.sh](/Frontend/regenerate-grammar.sh) | Shell Script | 14 | 1 | 5 | 20 |
| [Frontend/vscode-hksscript/.vscodeignore](/Frontend/vscode-hksscript/.vscodeignore) | Ignore | 4 | 0 | 1 | 5 |
| [Frontend/vscode-hksscript/README.md](/Frontend/vscode-hksscript/README.md) | Markdown | 14 | 0 | 9 | 23 |
| [Frontend/vscode-hksscript/language-configuration.json](/Frontend/vscode-hksscript/language-configuration.json) | JSON | 17 | 0 | 1 | 18 |
| [Frontend/vscode-hksscript/out/api-types.js](/Frontend/vscode-hksscript/out/api-types.js) | JavaScript | 83 | 1 | 0 | 84 |
| [Frontend/vscode-hksscript/out/extension.js](/Frontend/vscode-hksscript/out/extension.js) | JavaScript | 235 | 3 | 0 | 238 |
| [Frontend/vscode-hksscript/out/parser/HksScriptLexer.js](/Frontend/vscode-hksscript/out/parser/HksScriptLexer.js) | JavaScript | 152 | 3 | 0 | 155 |
| [Frontend/vscode-hksscript/out/parser/HksScriptParser.js](/Frontend/vscode-hksscript/out/parser/HksScriptParser.js) | JavaScript | 1,332 | 3 | 0 | 1,335 |
| [Frontend/vscode-hksscript/package-lock.json](/Frontend/vscode-hksscript/package-lock.json) | JSON | 70 | 0 | 1 | 71 |
| [Frontend/vscode-hksscript/package.json](/Frontend/vscode-hksscript/package.json) | JSON | 77 | 0 | 1 | 78 |
| [Frontend/vscode-hksscript/src/api-types.ts](/Frontend/vscode-hksscript/src/api-types.ts) | TypeScript | 94 | 0 | 7 | 101 |
| [Frontend/vscode-hksscript/src/extension.ts](/Frontend/vscode-hksscript/src/extension.ts) | TypeScript | 191 | 2 | 29 | 222 |
| [Frontend/vscode-hksscript/src/parser/HksScriptLexer.js](/Frontend/vscode-hksscript/src/parser/HksScriptLexer.js) | JavaScript | 151 | 2 | 13 | 166 |
| [Frontend/vscode-hksscript/src/parser/HksScriptParser.js](/Frontend/vscode-hksscript/src/parser/HksScriptParser.js) | JavaScript | 1,248 | 2 | 256 | 1,506 |
| [Frontend/vscode-hksscript/syntaxes/hksscript.tmLanguage.json](/Frontend/vscode-hksscript/syntaxes/hksscript.tmLanguage.json) | JSON | 74 | 0 | 1 | 75 |
| [Frontend/vscode-hksscript/tsconfig.json](/Frontend/vscode-hksscript/tsconfig.json) | JSON with Comments | 18 | 0 | 1 | 19 |
| [HKSScript.csproj](/HKSScript.csproj) | XML | 17 | 0 | 4 | 21 |
| [README.md](/README.md) | Markdown | 5 | 0 | 4 | 9 |
| [Shared/Hir/HirRunner.cs](/Shared/Hir/HirRunner.cs) | C# | 5 | 0 | 2 | 7 |
| [Shared/Hir/HirType.cs](/Shared/Hir/HirType.cs) | C# | 9 | 2 | 3 | 14 |
| [Shared/Hir/Nodes/Assign.cs](/Shared/Hir/Nodes/Assign.cs) | C# | 21 | 0 | 3 | 24 |
| [Shared/Hir/Nodes/Branch.cs](/Shared/Hir/Nodes/Branch.cs) | C# | 18 | 0 | 4 | 22 |
| [Shared/Hir/Nodes/Call.cs](/Shared/Hir/Nodes/Call.cs) | C# | 15 | 0 | 4 | 19 |
| [Shared/Hir/Nodes/HirBasicNode.cs](/Shared/Hir/Nodes/HirBasicNode.cs) | C# | 14 | 0 | 3 | 17 |
| [Shared/Hir/Nodes/Import.cs](/Shared/Hir/Nodes/Import.cs) | C# | 15 | 0 | 3 | 18 |
| [Shared/Hir/Nodes/New.cs](/Shared/Hir/Nodes/New.cs) | C# | 18 | 0 | 4 | 22 |
| [Shared/Hir/Nodes/Return.cs](/Shared/Hir/Nodes/Return.cs) | C# | 21 | 0 | 3 | 24 |
| [Tests/test-regenerate-grammar.sh](/Tests/test-regenerate-grammar.sh) | Shell Script | 37 | 6 | 12 | 55 |
| [regenerate-grammar.sh](/regenerate-grammar.sh) | Shell Script | 8 | 1 | 3 | 12 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)