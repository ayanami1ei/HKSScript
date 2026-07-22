grammar HksScript;

// ─── 语法规则 ───

program: statement* EOF;

statement
    : NEWLINE
    | importStmt NEWLINE
    | assignStmt NEWLINE
    | exprStmt NEWLINE
    | returnStmt NEWLINE
    | ifStmt
    | funcDef
    ;

block: INDENT statement+ DEDENT;

importStmt: KW_IMPORT ID (COMMA ID)*;
assignStmt: ID ASSIGN expr;
exprStmt: expr;
returnStmt: KW_RETURN expr?;

ifStmt: KW_IF expr COLON NEWLINE block
        (KW_ELIF expr COLON NEWLINE block)*
        (KW_ELSE COLON NEWLINE block)?;

funcDef: KW_DEF ID LPAREN paramList? RPAREN (ARROW type_)? COLON NEWLINE block;

paramList: param (COMMA param)*;
param: ID COLON type_;

type_: ID (LT type_ GT)?;

expr
    : expr PIPE expr                           # pipeExpr
    | expr KW_OR expr                          # orExpr
    | expr KW_AND expr                         # andExpr
    | KW_NOT expr                              # notExpr
    | expr compOp expr                         # compExpr
    | expr addOp expr                          # addExpr
    | expr mulOp expr                          # mulExpr
    | expr PIPE2 expr                          # unionExpr
    | expr AMP expr                            # intersectExpr
    | expr SUB expr                            # diffExpr
    | KW_QUERY KW_FROM expr KW_WITH condition   # queryFromExpr
    | ID LPAREN exprList? RPAREN               # callExpr
    | KW_QUERY LPAREN exprList? RPAREN          # queryCallExpr
    | ID                                       # varExpr
    | literal                                  # literalExpr
    | LPAREN expr RPAREN                       # parenExpr
    ;

compOp: LT | GT | EQ | NEQ | LE | GE;
addOp: PLUS | SUB;
mulOp: MUL | DIV;

condition: condOr;
condOr: condAnd (KW_OR condAnd)*;
condAnd: condNot (KW_AND condNot)*;
condNot: KW_NOT condNot | condPrimary;
condPrimary
    : LPAREN condition RPAREN
    | expr compOp expr
    ;

exprList: expr (COMMA expr)*;

literal
    : INT
    | FLOAT
    | STRING
    | KW_TRUE
    | KW_FALSE
    ;

// ─── 词法规则 ───

NEWLINE: '\r'?'\n';
WS: [ \t]+ -> skip;
LINE_COMMENT: '#' ~[\r\n]* -> skip;
BLOCK_COMMENT: '(*' .*? '*)' -> skip;
INDENT: [ \t]+;

// 关键字
KW_IMPORT: 'import'; KW_DEF: 'def'; KW_IF: 'if';
KW_ELIF: 'elif'; KW_ELSE: 'else';
KW_QUERY: 'query'; KW_FROM: 'from'; KW_WITH: 'with';
KW_AND: 'and'; KW_OR: 'or'; KW_NOT: 'not'; KW_RETURN: 'return';
KW_TRUE: 'true'; KW_FALSE: 'false';

// 运算符
PIPE: '=>';
PIPE2: '|';
AMP: '&';
ASSIGN: '=';
PLUS: '+'; SUB: '-'; MUL: '*'; DIV: '/';
LT: '<'; GT: '>'; EQ: '=='; NEQ: '!='; LE: '<='; GE: '>=';
ARROW: '->';

LPAREN: '('; RPAREN: ')'; COMMA: ','; COLON: ':';

INT: DIGIT+;
FLOAT: DIGIT+ '.' DIGIT+;
STRING: '"' (~["\\] | '\\' .)* '"';
ID: LETTER (LETTER | DIGIT)*;

fragment DIGIT: [0-9];
fragment LETTER: [a-zA-Z_];
