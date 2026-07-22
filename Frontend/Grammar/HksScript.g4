grammar HksScript;

program: statement* EOF;

statement
    : letStmt SEMI
    | exprStmt SEMI
    ;

letStmt: 'let' ID (':' type_)? '=' expr;

type_: 'int' | 'float' | 'string' | 'bool' | 'Mat';

exprStmt: expr;

expr
    : expr '|>' expr                            # pipeExpr
    | expr op=('<'|'>'|'=='|'<>'|'<='|'>=') expr # compExpr
    | expr op=('+'|'-') expr                    # addExpr
    | expr op=('*'|'/') expr                    # mulExpr
    | '-' expr                                  # unaryExpr
    | expr '.' QUERY '(' condition ')'          # queryExpr
    | expr '.' ID '(' exprList? ')'             # methodCallExpr
    | 'load' STRING                             # loadExpr
    | '(' expr ')'                              # parenExpr
    | literal                                   # literalExpr
    | ID '(' exprList? ')'                      # callExpr
    | ID                                        # varExpr
    ;

condition: condOr;

condOr: condAnd ('or' condAnd)*;

condAnd: condNot ('and' condNot)*;

condNot: 'not' condNot | condPrimary;

condPrimary
    : '(' condition ')'
    | expr op=('<'|'>'|'=='|'<>'|'<='|'>=') expr
    ;

exprList: expr (',' expr)*;

literal
    : INT
    | FLOAT
    | STRING
    | 'true'
    | 'false'
    ;

fragment DIGIT: [0-9];
fragment LETTER: [a-zA-Z_];

OR: 'or';
AND: 'and';
NOT: 'not';
QUERY: 'query';
INT: DIGIT+;
FLOAT: DIGIT+ '.' DIGIT+;
STRING: '"' (~["\\] | '\\' .)* '"';
ID: LETTER (LETTER | DIGIT)*;
SEMI: ';';
WS: [ \t\r\n]+ -> skip;
LINE_COMMENT: '//' ~[\r\n]* -> skip;
BLOCK_COMMENT: '(*' .*? '*)' -> skip;
