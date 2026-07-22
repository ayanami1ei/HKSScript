grammar HksScript;

// ─── 语法规则 ───

program: statement* EOF;

statement
    : NEWLINE                                          // 空行
    | importStmt NEWLINE
    | assignStmt NEWLINE
    | exprStmt NEWLINE
    | ifStmt
    | funcDef
    ;

block: INDENT statement+ DEDENT;

importStmt: KW_IMPORT ID (',' ID)*;

assignStmt: ID '=' expr;

exprStmt: expr;

ifStmt: KW_IF expr ':' NEWLINE block
        (KW_ELIF expr ':' NEWLINE block)*
        (KW_ELSE ':' NEWLINE block)?;

funcDef: KW_DEF ID '(' paramList? ')' ('->' type_)? ':' NEWLINE block;

paramList: param (',' param)*;
param: ID ':' type_;

type_: ID ('<' type_ '>')?;  // Mat, int, Set<Circle>

expr
    : expr PIPE expr                           # pipeExpr
    | expr KW_OR expr                          # orExpr
    | expr KW_AND expr                         # andExpr
    | KW_NOT expr                              # notExpr
    | expr op=('<'|'>'|'=='|'!='|'<='|'>=') expr # compExpr
    | expr op=('+'|'-') expr                   # addExpr
    | expr op=('*'|'/') expr                   # mulExpr
    | expr '|' expr                            # unionExpr
    | expr '&' expr                            # intersectExpr
    | KW_QUERY KW_FROM expr KW_WITH condition   # queryFromExpr
    | ID '(' exprList? ')'                     # callExpr
    | ID                                       # varExpr
    | literal                                  # literalExpr
    | '(' expr ')'                             # parenExpr
    ;

condition: condOr;
condOr: condAnd (KW_OR condAnd)*;
condAnd: condNot (KW_AND condNot)*;
condNot: KW_NOT condNot | condPrimary;
condPrimary
    : '(' condition ')'
    | expr op=('<'|'>'|'=='|'!='|'<='|'>=') expr
    ;

exprList: expr (',' expr)*;

literal
    : INT
    | FLOAT
    | STRING
    | 'true'
    | 'false'
    ;

// ─── 词法规则 ───

NEWLINE: '\r'?'\n';
WS: [ \t]+ -> skip;
LINE_COMMENT: '#' ~[\r\n]* -> skip;
BLOCK_COMMENT: '(*' .*? '*)' -> skip;
INDENT: [ \t]+;  // 不由 ANTLR 处理，由 TokenStreamFilter 接管

// 关键字
KW_IMPORT: 'import';
KW_DEF: 'def';
KW_IF: 'if';
KW_ELIF: 'elif';
KW_ELSE: 'else';
KW_QUERY: 'query';
KW_FROM: 'from';
KW_WITH: 'with';
KW_AND: 'and';
KW_OR: 'or';
KW_NOT: 'not';
KW_RETURN: 'return';

PIPE: '=>';

INT: DIGIT+;
FLOAT: DIGIT+ '.' DIGIT+;
STRING: '"' (~["\\] | '\\' .)* '"';
ID: LETTER (LETTER | DIGIT)*;

OP: '+' | '-' | '*' | '/' | '|' | '&' | '=' | '>' | '<' | '>=' | '<=' | '==' | '!=';
LPAREN: '('; RPAREN: ')'; COMMA: ','; COLON: ':';

fragment DIGIT: [0-9];
fragment LETTER: [a-zA-Z_];
