"use strict";
// Generated from /home/ayanami/HKSScript/Grammar/HksScript.g4 by ANTLR 4.13.2
// jshint ignore: start
const antlr4 = require('antlr4');
const serializedATN = [4, 1, 38, 150, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7,
    4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12,
    1, 0, 5, 0, 28, 8, 0, 10, 0, 12, 0, 31, 9, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 41, 8,
    1, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 47, 8, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 5,
    1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 3, 5, 69, 8, 5, 1, 5, 1, 5, 3, 5, 73, 8, 5, 1, 5, 1,
    5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1,
    5, 1, 5, 1, 5, 1, 5, 1, 5, 3, 5, 99, 8, 5, 1, 5, 5, 5, 102, 8, 5, 10, 5, 12, 5, 105, 9, 5, 1, 6, 1, 6, 1,
    7, 1, 7, 1, 7, 5, 7, 112, 8, 7, 10, 7, 12, 7, 115, 9, 7, 1, 8, 1, 8, 1, 8, 5, 8, 120, 8, 8, 10, 8, 12,
    8, 123, 9, 8, 1, 9, 1, 9, 1, 9, 3, 9, 128, 8, 9, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10, 1, 10,
    3, 10, 138, 8, 10, 1, 11, 1, 11, 1, 11, 5, 11, 143, 8, 11, 10, 11, 12, 11, 146, 9, 11, 1, 12, 1, 12,
    1, 12, 0, 1, 10, 13, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 0, 5, 1, 0, 4, 8, 1, 0, 10, 15, 1,
    0, 16, 17, 1, 0, 18, 19, 2, 0, 25, 26, 31, 33, 157, 0, 29, 1, 0, 0, 0, 2, 40, 1, 0, 0, 0, 4, 42, 1, 0,
    0, 0, 6, 51, 1, 0, 0, 0, 8, 53, 1, 0, 0, 0, 10, 72, 1, 0, 0, 0, 12, 106, 1, 0, 0, 0, 14, 108, 1, 0, 0,
    0, 16, 116, 1, 0, 0, 0, 18, 127, 1, 0, 0, 0, 20, 137, 1, 0, 0, 0, 22, 139, 1, 0, 0, 0, 24, 147, 1, 0,
    0, 0, 26, 28, 3, 2, 1, 0, 27, 26, 1, 0, 0, 0, 28, 31, 1, 0, 0, 0, 29, 27, 1, 0, 0, 0, 29, 30, 1, 0, 0,
    0, 30, 32, 1, 0, 0, 0, 31, 29, 1, 0, 0, 0, 32, 33, 5, 0, 0, 1, 33, 1, 1, 0, 0, 0, 34, 35, 3, 4, 2, 0, 35,
    36, 5, 35, 0, 0, 36, 41, 1, 0, 0, 0, 37, 38, 3, 8, 4, 0, 38, 39, 5, 35, 0, 0, 39, 41, 1, 0, 0, 0, 40,
    34, 1, 0, 0, 0, 40, 37, 1, 0, 0, 0, 41, 3, 1, 0, 0, 0, 42, 43, 5, 1, 0, 0, 43, 46, 5, 34, 0, 0, 44, 45,
    5, 2, 0, 0, 45, 47, 3, 6, 3, 0, 46, 44, 1, 0, 0, 0, 46, 47, 1, 0, 0, 0, 47, 48, 1, 0, 0, 0, 48, 49, 5,
    3, 0, 0, 49, 50, 3, 10, 5, 0, 50, 5, 1, 0, 0, 0, 51, 52, 7, 0, 0, 0, 52, 7, 1, 0, 0, 0, 53, 54, 3, 10,
    5, 0, 54, 9, 1, 0, 0, 0, 55, 56, 6, 5, -1, 0, 56, 57, 5, 17, 0, 0, 57, 73, 3, 10, 5, 8, 58, 59, 5, 23,
    0, 0, 59, 73, 5, 33, 0, 0, 60, 61, 5, 21, 0, 0, 61, 62, 3, 10, 5, 0, 62, 63, 5, 22, 0, 0, 63, 73, 1,
    0, 0, 0, 64, 73, 3, 24, 12, 0, 65, 66, 5, 34, 0, 0, 66, 68, 5, 21, 0, 0, 67, 69, 3, 22, 11, 0, 68, 67,
    1, 0, 0, 0, 68, 69, 1, 0, 0, 0, 69, 70, 1, 0, 0, 0, 70, 73, 5, 22, 0, 0, 71, 73, 5, 34, 0, 0, 72, 55,
    1, 0, 0, 0, 72, 58, 1, 0, 0, 0, 72, 60, 1, 0, 0, 0, 72, 64, 1, 0, 0, 0, 72, 65, 1, 0, 0, 0, 72, 71, 1,
    0, 0, 0, 73, 103, 1, 0, 0, 0, 74, 75, 10, 12, 0, 0, 75, 76, 5, 9, 0, 0, 76, 102, 3, 10, 5, 13, 77, 78,
    10, 11, 0, 0, 78, 79, 7, 1, 0, 0, 79, 102, 3, 10, 5, 12, 80, 81, 10, 10, 0, 0, 81, 82, 7, 2, 0, 0, 82,
    102, 3, 10, 5, 11, 83, 84, 10, 9, 0, 0, 84, 85, 7, 3, 0, 0, 85, 102, 3, 10, 5, 10, 86, 87, 10, 7, 0,
    0, 87, 88, 5, 20, 0, 0, 88, 89, 5, 30, 0, 0, 89, 90, 5, 21, 0, 0, 90, 91, 3, 12, 6, 0, 91, 92, 5, 22,
    0, 0, 92, 102, 1, 0, 0, 0, 93, 94, 10, 6, 0, 0, 94, 95, 5, 20, 0, 0, 95, 96, 5, 34, 0, 0, 96, 98, 5,
    21, 0, 0, 97, 99, 3, 22, 11, 0, 98, 97, 1, 0, 0, 0, 98, 99, 1, 0, 0, 0, 99, 100, 1, 0, 0, 0, 100, 102,
    5, 22, 0, 0, 101, 74, 1, 0, 0, 0, 101, 77, 1, 0, 0, 0, 101, 80, 1, 0, 0, 0, 101, 83, 1, 0, 0, 0, 101,
    86, 1, 0, 0, 0, 101, 93, 1, 0, 0, 0, 102, 105, 1, 0, 0, 0, 103, 101, 1, 0, 0, 0, 103, 104, 1, 0, 0,
    0, 104, 11, 1, 0, 0, 0, 105, 103, 1, 0, 0, 0, 106, 107, 3, 14, 7, 0, 107, 13, 1, 0, 0, 0, 108, 113,
    3, 16, 8, 0, 109, 110, 5, 27, 0, 0, 110, 112, 3, 16, 8, 0, 111, 109, 1, 0, 0, 0, 112, 115, 1, 0, 0,
    0, 113, 111, 1, 0, 0, 0, 113, 114, 1, 0, 0, 0, 114, 15, 1, 0, 0, 0, 115, 113, 1, 0, 0, 0, 116, 121,
    3, 18, 9, 0, 117, 118, 5, 28, 0, 0, 118, 120, 3, 18, 9, 0, 119, 117, 1, 0, 0, 0, 120, 123, 1, 0, 0,
    0, 121, 119, 1, 0, 0, 0, 121, 122, 1, 0, 0, 0, 122, 17, 1, 0, 0, 0, 123, 121, 1, 0, 0, 0, 124, 125,
    5, 29, 0, 0, 125, 128, 3, 18, 9, 0, 126, 128, 3, 20, 10, 0, 127, 124, 1, 0, 0, 0, 127, 126, 1, 0,
    0, 0, 128, 19, 1, 0, 0, 0, 129, 130, 5, 21, 0, 0, 130, 131, 3, 12, 6, 0, 131, 132, 5, 22, 0, 0, 132,
    138, 1, 0, 0, 0, 133, 134, 3, 10, 5, 0, 134, 135, 7, 1, 0, 0, 135, 136, 3, 10, 5, 0, 136, 138, 1,
    0, 0, 0, 137, 129, 1, 0, 0, 0, 137, 133, 1, 0, 0, 0, 138, 21, 1, 0, 0, 0, 139, 144, 3, 10, 5, 0, 140,
    141, 5, 24, 0, 0, 141, 143, 3, 10, 5, 0, 142, 140, 1, 0, 0, 0, 143, 146, 1, 0, 0, 0, 144, 142, 1,
    0, 0, 0, 144, 145, 1, 0, 0, 0, 145, 23, 1, 0, 0, 0, 146, 144, 1, 0, 0, 0, 147, 148, 7, 4, 0, 0, 148,
    25, 1, 0, 0, 0, 13, 29, 40, 46, 68, 72, 98, 101, 103, 113, 121, 127, 137, 144];
const atn = new antlr4.ATNDeserializer().deserialize(serializedATN);
const decisionsToDFA = atn.decisionToState.map((ds, index) => new antlr4.DFA(ds, index));
const sharedContextCache = new antlr4.PredictionContextCache();
class HksScriptParser extends antlr4.Parser {
    constructor(input) {
        super(input);
        this._interp = new antlr4.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = HksScriptParser.ruleNames;
        this.literalNames = HksScriptParser.literalNames;
        this.symbolicNames = HksScriptParser.symbolicNames;
    }
    sempred(localctx, ruleIndex, predIndex) {
        switch (ruleIndex) {
            case 5:
                return this.expr_sempred(localctx, predIndex);
            default:
                throw "No predicate with index:" + ruleIndex;
        }
    }
    expr_sempred(localctx, predIndex) {
        switch (predIndex) {
            case 0:
                return this.precpred(this._ctx, 12);
            case 1:
                return this.precpred(this._ctx, 11);
            case 2:
                return this.precpred(this._ctx, 10);
            case 3:
                return this.precpred(this._ctx, 9);
            case 4:
                return this.precpred(this._ctx, 7);
            case 5:
                return this.precpred(this._ctx, 6);
            default:
                throw "No predicate with index:" + predIndex;
        }
    }
    ;
    program() {
        let localctx = new ProgramContext(this, this._ctx, this.state);
        this.enterRule(localctx, 0, HksScriptParser.RULE_program);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 29;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while ((((_la) & ~0x1f) === 0 && ((1 << _la) & 2258763778) !== 0) || ((((_la - 32)) & ~0x1f) === 0 && ((1 << (_la - 32)) & 7) !== 0)) {
                this.state = 26;
                this.statement();
                this.state = 31;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
            this.state = 32;
            this.match(HksScriptParser.EOF);
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    statement() {
        let localctx = new StatementContext(this, this._ctx, this.state);
        this.enterRule(localctx, 2, HksScriptParser.RULE_statement);
        try {
            this.state = 40;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    this.state = 34;
                    this.letStmt();
                    this.state = 35;
                    this.match(HksScriptParser.SEMI);
                    break;
                case 17:
                case 21:
                case 23:
                case 25:
                case 26:
                case 31:
                case 32:
                case 33:
                case 34:
                    this.enterOuterAlt(localctx, 2);
                    this.state = 37;
                    this.exprStmt();
                    this.state = 38;
                    this.match(HksScriptParser.SEMI);
                    break;
                default:
                    throw new antlr4.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    letStmt() {
        let localctx = new LetStmtContext(this, this._ctx, this.state);
        this.enterRule(localctx, 4, HksScriptParser.RULE_letStmt);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 42;
            this.match(HksScriptParser.T__0);
            this.state = 43;
            this.match(HksScriptParser.ID);
            this.state = 46;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            if (_la === 2) {
                this.state = 44;
                this.match(HksScriptParser.T__1);
                this.state = 45;
                this.type_();
            }
            this.state = 48;
            this.match(HksScriptParser.T__2);
            this.state = 49;
            this.expr(0);
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    type_() {
        let localctx = new Type_Context(this, this._ctx, this.state);
        this.enterRule(localctx, 6, HksScriptParser.RULE_type_);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 51;
            _la = this._input.LA(1);
            if (!((((_la) & ~0x1f) === 0 && ((1 << _la) & 496) !== 0))) {
                this._errHandler.recoverInline(this);
            }
            else {
                this._errHandler.reportMatch(this);
                this.consume();
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    exprStmt() {
        let localctx = new ExprStmtContext(this, this._ctx, this.state);
        this.enterRule(localctx, 8, HksScriptParser.RULE_exprStmt);
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 53;
            this.expr(0);
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    expr(_p) {
        if (_p === undefined) {
            _p = 0;
        }
        const _parentctx = this._ctx;
        const _parentState = this.state;
        let localctx = new ExprContext(this, this._ctx, _parentState);
        let _prevctx = localctx;
        const _startState = 10;
        this.enterRecursionRule(localctx, 10, HksScriptParser.RULE_expr, _p);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 72;
            this._errHandler.sync(this);
            var la_ = this._interp.adaptivePredict(this._input, 4, this._ctx);
            switch (la_) {
                case 1:
                    localctx = new UnaryExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 56;
                    this.match(HksScriptParser.T__16);
                    this.state = 57;
                    this.expr(8);
                    break;
                case 2:
                    localctx = new LoadExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 58;
                    this.match(HksScriptParser.T__22);
                    this.state = 59;
                    this.match(HksScriptParser.STRING);
                    break;
                case 3:
                    localctx = new ParenExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 60;
                    this.match(HksScriptParser.T__20);
                    this.state = 61;
                    this.expr(0);
                    this.state = 62;
                    this.match(HksScriptParser.T__21);
                    break;
                case 4:
                    localctx = new LiteralExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 64;
                    this.literal();
                    break;
                case 5:
                    localctx = new CallExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 65;
                    this.match(HksScriptParser.ID);
                    this.state = 66;
                    this.match(HksScriptParser.T__20);
                    this.state = 68;
                    this._errHandler.sync(this);
                    _la = this._input.LA(1);
                    if (((((_la - 17)) & ~0x1f) === 0 && ((1 << (_la - 17)) & 246609) !== 0)) {
                        this.state = 67;
                        this.exprList();
                    }
                    this.state = 70;
                    this.match(HksScriptParser.T__21);
                    break;
                case 6:
                    localctx = new VarExprContext(this, localctx);
                    this._ctx = localctx;
                    _prevctx = localctx;
                    this.state = 71;
                    this.match(HksScriptParser.ID);
                    break;
            }
            this._ctx.stop = this._input.LT(-1);
            this.state = 103;
            this._errHandler.sync(this);
            var _alt = this._interp.adaptivePredict(this._input, 7, this._ctx);
            while (_alt != 2 && _alt != antlr4.ATN.INVALID_ALT_NUMBER) {
                if (_alt === 1) {
                    if (this._parseListeners !== null) {
                        this.triggerExitRuleEvent();
                    }
                    _prevctx = localctx;
                    this.state = 101;
                    this._errHandler.sync(this);
                    var la_ = this._interp.adaptivePredict(this._input, 6, this._ctx);
                    switch (la_) {
                        case 1:
                            localctx = new PipeExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 74;
                            if (!(this.precpred(this._ctx, 12))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 12)");
                            }
                            this.state = 75;
                            this.match(HksScriptParser.T__8);
                            this.state = 76;
                            this.expr(13);
                            break;
                        case 2:
                            localctx = new CompExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 77;
                            if (!(this.precpred(this._ctx, 11))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 11)");
                            }
                            this.state = 78;
                            localctx.op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!((((_la) & ~0x1f) === 0 && ((1 << _la) & 64512) !== 0))) {
                                localctx.op = this._errHandler.recoverInline(this);
                            }
                            else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 79;
                            this.expr(12);
                            break;
                        case 3:
                            localctx = new AddExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 80;
                            if (!(this.precpred(this._ctx, 10))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 10)");
                            }
                            this.state = 81;
                            localctx.op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 16 || _la === 17)) {
                                localctx.op = this._errHandler.recoverInline(this);
                            }
                            else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 82;
                            this.expr(11);
                            break;
                        case 4:
                            localctx = new MulExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 83;
                            if (!(this.precpred(this._ctx, 9))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 9)");
                            }
                            this.state = 84;
                            localctx.op = this._input.LT(1);
                            _la = this._input.LA(1);
                            if (!(_la === 18 || _la === 19)) {
                                localctx.op = this._errHandler.recoverInline(this);
                            }
                            else {
                                this._errHandler.reportMatch(this);
                                this.consume();
                            }
                            this.state = 85;
                            this.expr(10);
                            break;
                        case 5:
                            localctx = new QueryExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 86;
                            if (!(this.precpred(this._ctx, 7))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 7)");
                            }
                            this.state = 87;
                            this.match(HksScriptParser.T__19);
                            this.state = 88;
                            this.match(HksScriptParser.QUERY);
                            this.state = 89;
                            this.match(HksScriptParser.T__20);
                            this.state = 90;
                            this.condition();
                            this.state = 91;
                            this.match(HksScriptParser.T__21);
                            break;
                        case 6:
                            localctx = new MethodCallExprContext(this, new ExprContext(this, _parentctx, _parentState));
                            this.pushNewRecursionContext(localctx, _startState, HksScriptParser.RULE_expr);
                            this.state = 93;
                            if (!(this.precpred(this._ctx, 6))) {
                                throw new antlr4.FailedPredicateException(this, "this.precpred(this._ctx, 6)");
                            }
                            this.state = 94;
                            this.match(HksScriptParser.T__19);
                            this.state = 95;
                            this.match(HksScriptParser.ID);
                            this.state = 96;
                            this.match(HksScriptParser.T__20);
                            this.state = 98;
                            this._errHandler.sync(this);
                            _la = this._input.LA(1);
                            if (((((_la - 17)) & ~0x1f) === 0 && ((1 << (_la - 17)) & 246609) !== 0)) {
                                this.state = 97;
                                this.exprList();
                            }
                            this.state = 100;
                            this.match(HksScriptParser.T__21);
                            break;
                    }
                }
                this.state = 105;
                this._errHandler.sync(this);
                _alt = this._interp.adaptivePredict(this._input, 7, this._ctx);
            }
        }
        catch (error) {
            if (error instanceof antlr4.RecognitionException) {
                localctx.exception = error;
                this._errHandler.reportError(this, error);
                this._errHandler.recover(this, error);
            }
            else {
                throw error;
            }
        }
        finally {
            this.unrollRecursionContexts(_parentctx);
        }
        return localctx;
    }
    condition() {
        let localctx = new ConditionContext(this, this._ctx, this.state);
        this.enterRule(localctx, 12, HksScriptParser.RULE_condition);
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 106;
            this.condOr();
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    condOr() {
        let localctx = new CondOrContext(this, this._ctx, this.state);
        this.enterRule(localctx, 14, HksScriptParser.RULE_condOr);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 108;
            this.condAnd();
            this.state = 113;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 27) {
                this.state = 109;
                this.match(HksScriptParser.OR);
                this.state = 110;
                this.condAnd();
                this.state = 115;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    condAnd() {
        let localctx = new CondAndContext(this, this._ctx, this.state);
        this.enterRule(localctx, 16, HksScriptParser.RULE_condAnd);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 116;
            this.condNot();
            this.state = 121;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 28) {
                this.state = 117;
                this.match(HksScriptParser.AND);
                this.state = 118;
                this.condNot();
                this.state = 123;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    condNot() {
        let localctx = new CondNotContext(this, this._ctx, this.state);
        this.enterRule(localctx, 18, HksScriptParser.RULE_condNot);
        try {
            this.state = 127;
            this._errHandler.sync(this);
            switch (this._input.LA(1)) {
                case 29:
                    this.enterOuterAlt(localctx, 1);
                    this.state = 124;
                    this.match(HksScriptParser.NOT);
                    this.state = 125;
                    this.condNot();
                    break;
                case 17:
                case 21:
                case 23:
                case 25:
                case 26:
                case 31:
                case 32:
                case 33:
                case 34:
                    this.enterOuterAlt(localctx, 2);
                    this.state = 126;
                    this.condPrimary();
                    break;
                default:
                    throw new antlr4.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    condPrimary() {
        let localctx = new CondPrimaryContext(this, this._ctx, this.state);
        this.enterRule(localctx, 20, HksScriptParser.RULE_condPrimary);
        var _la = 0;
        try {
            this.state = 137;
            this._errHandler.sync(this);
            var la_ = this._interp.adaptivePredict(this._input, 11, this._ctx);
            switch (la_) {
                case 1:
                    this.enterOuterAlt(localctx, 1);
                    this.state = 129;
                    this.match(HksScriptParser.T__20);
                    this.state = 130;
                    this.condition();
                    this.state = 131;
                    this.match(HksScriptParser.T__21);
                    break;
                case 2:
                    this.enterOuterAlt(localctx, 2);
                    this.state = 133;
                    this.expr(0);
                    this.state = 134;
                    localctx.op = this._input.LT(1);
                    _la = this._input.LA(1);
                    if (!((((_la) & ~0x1f) === 0 && ((1 << _la) & 64512) !== 0))) {
                        localctx.op = this._errHandler.recoverInline(this);
                    }
                    else {
                        this._errHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 135;
                    this.expr(0);
                    break;
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    exprList() {
        let localctx = new ExprListContext(this, this._ctx, this.state);
        this.enterRule(localctx, 22, HksScriptParser.RULE_exprList);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 139;
            this.expr(0);
            this.state = 144;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 24) {
                this.state = 140;
                this.match(HksScriptParser.T__23);
                this.state = 141;
                this.expr(0);
                this.state = 146;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
    literal() {
        let localctx = new LiteralContext(this, this._ctx, this.state);
        this.enterRule(localctx, 24, HksScriptParser.RULE_literal);
        var _la = 0;
        try {
            this.enterOuterAlt(localctx, 1);
            this.state = 147;
            _la = this._input.LA(1);
            if (!(((((_la - 25)) & ~0x1f) === 0 && ((1 << (_la - 25)) & 451) !== 0))) {
                this._errHandler.recoverInline(this);
            }
            else {
                this._errHandler.reportMatch(this);
                this.consume();
            }
        }
        catch (re) {
            if (re instanceof antlr4.RecognitionException) {
                localctx.exception = re;
                this._errHandler.reportError(this, re);
                this._errHandler.recover(this, re);
            }
            else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localctx;
    }
}
HksScriptParser.grammarFileName = "HksScript.g4";
HksScriptParser.literalNames = [null, "'let'", "':'", "'='", "'int'", "'float'",
    "'string'", "'bool'", "'Mat'", "'|>'", "'<'",
    "'>'", "'=='", "'<>'", "'<='", "'>='", "'+'",
    "'-'", "'*'", "'/'", "'.'", "'('", "')'", "'load'",
    "','", "'true'", "'false'", "'or'", "'and'",
    "'not'", "'query'", null, null, null, null,
    "';'"];
HksScriptParser.symbolicNames = [null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null,
    null, null, null, "OR", "AND", "NOT", "QUERY",
    "INT", "FLOAT", "STRING", "ID", "SEMI", "WS",
    "LINE_COMMENT", "BLOCK_COMMENT"];
HksScriptParser.ruleNames = ["program", "statement", "letStmt", "type_", "exprStmt",
    "expr", "condition", "condOr", "condAnd", "condNot",
    "condPrimary", "exprList", "literal"];
HksScriptParser.EOF = antlr4.Token.EOF;
HksScriptParser.T__0 = 1;
HksScriptParser.T__1 = 2;
HksScriptParser.T__2 = 3;
HksScriptParser.T__3 = 4;
HksScriptParser.T__4 = 5;
HksScriptParser.T__5 = 6;
HksScriptParser.T__6 = 7;
HksScriptParser.T__7 = 8;
HksScriptParser.T__8 = 9;
HksScriptParser.T__9 = 10;
HksScriptParser.T__10 = 11;
HksScriptParser.T__11 = 12;
HksScriptParser.T__12 = 13;
HksScriptParser.T__13 = 14;
HksScriptParser.T__14 = 15;
HksScriptParser.T__15 = 16;
HksScriptParser.T__16 = 17;
HksScriptParser.T__17 = 18;
HksScriptParser.T__18 = 19;
HksScriptParser.T__19 = 20;
HksScriptParser.T__20 = 21;
HksScriptParser.T__21 = 22;
HksScriptParser.T__22 = 23;
HksScriptParser.T__23 = 24;
HksScriptParser.T__24 = 25;
HksScriptParser.T__25 = 26;
HksScriptParser.OR = 27;
HksScriptParser.AND = 28;
HksScriptParser.NOT = 29;
HksScriptParser.QUERY = 30;
HksScriptParser.INT = 31;
HksScriptParser.FLOAT = 32;
HksScriptParser.STRING = 33;
HksScriptParser.ID = 34;
HksScriptParser.SEMI = 35;
HksScriptParser.WS = 36;
HksScriptParser.LINE_COMMENT = 37;
HksScriptParser.BLOCK_COMMENT = 38;
HksScriptParser.RULE_program = 0;
HksScriptParser.RULE_statement = 1;
HksScriptParser.RULE_letStmt = 2;
HksScriptParser.RULE_type_ = 3;
HksScriptParser.RULE_exprStmt = 4;
HksScriptParser.RULE_expr = 5;
HksScriptParser.RULE_condition = 6;
HksScriptParser.RULE_condOr = 7;
HksScriptParser.RULE_condAnd = 8;
HksScriptParser.RULE_condNot = 9;
HksScriptParser.RULE_condPrimary = 10;
HksScriptParser.RULE_exprList = 11;
HksScriptParser.RULE_literal = 12;
class ProgramContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.statement = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(StatementContext);
            }
            else {
                return this.getTypedRuleContext(StatementContext, i);
            }
        };
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_program;
    }
    EOF() {
        return this.getToken(HksScriptParser.EOF, 0);
    }
    ;
}
class StatementContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_statement;
    }
    letStmt() {
        return this.getTypedRuleContext(LetStmtContext, 0);
    }
    ;
    SEMI() {
        return this.getToken(HksScriptParser.SEMI, 0);
    }
    ;
    exprStmt() {
        return this.getTypedRuleContext(ExprStmtContext, 0);
    }
    ;
}
class LetStmtContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_letStmt;
    }
    ID() {
        return this.getToken(HksScriptParser.ID, 0);
    }
    ;
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
    type_() {
        return this.getTypedRuleContext(Type_Context, 0);
    }
    ;
}
class Type_Context extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_type_;
    }
}
class ExprStmtContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_exprStmt;
    }
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
}
class ExprContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_expr;
    }
    copyFrom(ctx) {
        super.copyFrom(ctx);
    }
}
class LoadExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    STRING() {
        return this.getToken(HksScriptParser.STRING, 0);
    }
    ;
}
HksScriptParser.LoadExprContext = LoadExprContext;
class VarExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    ID() {
        return this.getToken(HksScriptParser.ID, 0);
    }
    ;
}
HksScriptParser.VarExprContext = VarExprContext;
class MethodCallExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
    ID() {
        return this.getToken(HksScriptParser.ID, 0);
    }
    ;
    exprList() {
        return this.getTypedRuleContext(ExprListContext, 0);
    }
    ;
}
HksScriptParser.MethodCallExprContext = MethodCallExprContext;
class PipeExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        super.copyFrom(ctx);
    }
}
HksScriptParser.PipeExprContext = PipeExprContext;
class UnaryExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
}
HksScriptParser.UnaryExprContext = UnaryExprContext;
class AddExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        this.op = null;
        ;
        super.copyFrom(ctx);
    }
}
HksScriptParser.AddExprContext = AddExprContext;
class LiteralExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    literal() {
        return this.getTypedRuleContext(LiteralContext, 0);
    }
    ;
}
HksScriptParser.LiteralExprContext = LiteralExprContext;
class CompExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        this.op = null;
        ;
        super.copyFrom(ctx);
    }
}
HksScriptParser.CompExprContext = CompExprContext;
class MulExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        this.op = null;
        ;
        super.copyFrom(ctx);
    }
}
HksScriptParser.MulExprContext = MulExprContext;
class QueryExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
    QUERY() {
        return this.getToken(HksScriptParser.QUERY, 0);
    }
    ;
    condition() {
        return this.getTypedRuleContext(ConditionContext, 0);
    }
    ;
}
HksScriptParser.QueryExprContext = QueryExprContext;
class CallExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    ID() {
        return this.getToken(HksScriptParser.ID, 0);
    }
    ;
    exprList() {
        return this.getTypedRuleContext(ExprListContext, 0);
    }
    ;
}
HksScriptParser.CallExprContext = CallExprContext;
class ParenExprContext extends ExprContext {
    constructor(parser, ctx) {
        super(parser);
        super.copyFrom(ctx);
    }
    expr() {
        return this.getTypedRuleContext(ExprContext, 0);
    }
    ;
}
HksScriptParser.ParenExprContext = ParenExprContext;
class ConditionContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_condition;
    }
    condOr() {
        return this.getTypedRuleContext(CondOrContext, 0);
    }
    ;
}
class CondOrContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.condAnd = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(CondAndContext);
            }
            else {
                return this.getTypedRuleContext(CondAndContext, i);
            }
        };
        this.OR = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTokens(HksScriptParser.OR);
            }
            else {
                return this.getToken(HksScriptParser.OR, i);
            }
        };
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_condOr;
    }
}
class CondAndContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.condNot = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(CondNotContext);
            }
            else {
                return this.getTypedRuleContext(CondNotContext, i);
            }
        };
        this.AND = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTokens(HksScriptParser.AND);
            }
            else {
                return this.getToken(HksScriptParser.AND, i);
            }
        };
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_condAnd;
    }
}
class CondNotContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_condNot;
    }
    NOT() {
        return this.getToken(HksScriptParser.NOT, 0);
    }
    ;
    condNot() {
        return this.getTypedRuleContext(CondNotContext, 0);
    }
    ;
    condPrimary() {
        return this.getTypedRuleContext(CondPrimaryContext, 0);
    }
    ;
}
class CondPrimaryContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_condPrimary;
        this.op = null;
    }
    condition() {
        return this.getTypedRuleContext(ConditionContext, 0);
    }
    ;
}
class ExprListContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.expr = function (i) {
            if (i === undefined) {
                i = null;
            }
            if (i === null) {
                return this.getTypedRuleContexts(ExprContext);
            }
            else {
                return this.getTypedRuleContext(ExprContext, i);
            }
        };
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_exprList;
    }
}
class LiteralContext extends antlr4.ParserRuleContext {
    constructor(parser, parent, invokingState) {
        if (parent === undefined) {
            parent = null;
        }
        if (invokingState === undefined || invokingState === null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = HksScriptParser.RULE_literal;
    }
    INT() {
        return this.getToken(HksScriptParser.INT, 0);
    }
    ;
    FLOAT() {
        return this.getToken(HksScriptParser.FLOAT, 0);
    }
    ;
    STRING() {
        return this.getToken(HksScriptParser.STRING, 0);
    }
    ;
}
HksScriptParser.ProgramContext = ProgramContext;
HksScriptParser.StatementContext = StatementContext;
HksScriptParser.LetStmtContext = LetStmtContext;
HksScriptParser.Type_Context = Type_Context;
HksScriptParser.ExprStmtContext = ExprStmtContext;
HksScriptParser.ExprContext = ExprContext;
HksScriptParser.ConditionContext = ConditionContext;
HksScriptParser.CondOrContext = CondOrContext;
HksScriptParser.CondAndContext = CondAndContext;
HksScriptParser.CondNotContext = CondNotContext;
HksScriptParser.CondPrimaryContext = CondPrimaryContext;
HksScriptParser.ExprListContext = ExprListContext;
HksScriptParser.LiteralContext = LiteralContext;
module.exports = HksScriptParser;
//# sourceMappingURL=HksScriptParser.js.map