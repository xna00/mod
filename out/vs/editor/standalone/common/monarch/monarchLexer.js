/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/standalone/common/monarch/monarchCommon", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, languages, nullTokenize_1, monarchCommon, configuration_1) {
    "use strict";
    var MonarchTokenizer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MonarchTokenizer = void 0;
    const CACHE_STACK_DEPTH = 5;
    /**
     * Reuse the same stack elements up to a certain depth.
     */
    class MonarchStackElementFactory {
        static { this._INSTANCE = new MonarchStackElementFactory(CACHE_STACK_DEPTH); }
        static create(parent, state) {
            return this._INSTANCE.create(parent, state);
        }
        constructor(maxCacheDepth) {
            this._maxCacheDepth = maxCacheDepth;
            this._entries = Object.create(null);
        }
        create(parent, state) {
            if (parent !== null && parent.depth >= this._maxCacheDepth) {
                // no caching above a certain depth
                return new MonarchStackElement(parent, state);
            }
            let stackElementId = MonarchStackElement.getStackElementId(parent);
            if (stackElementId.length > 0) {
                stackElementId += '|';
            }
            stackElementId += state;
            let result = this._entries[stackElementId];
            if (result) {
                return result;
            }
            result = new MonarchStackElement(parent, state);
            this._entries[stackElementId] = result;
            return result;
        }
    }
    class MonarchStackElement {
        constructor(parent, state) {
            this.parent = parent;
            this.state = state;
            this.depth = (this.parent ? this.parent.depth : 0) + 1;
        }
        static getStackElementId(element) {
            let result = '';
            while (element !== null) {
                if (result.length > 0) {
                    result += '|';
                }
                result += element.state;
                element = element.parent;
            }
            return result;
        }
        static _equals(a, b) {
            while (a !== null && b !== null) {
                if (a === b) {
                    return true;
                }
                if (a.state !== b.state) {
                    return false;
                }
                a = a.parent;
                b = b.parent;
            }
            if (a === null && b === null) {
                return true;
            }
            return false;
        }
        equals(other) {
            return MonarchStackElement._equals(this, other);
        }
        push(state) {
            return MonarchStackElementFactory.create(this, state);
        }
        pop() {
            return this.parent;
        }
        popall() {
            let result = this;
            while (result.parent) {
                result = result.parent;
            }
            return result;
        }
        switchTo(state) {
            return MonarchStackElementFactory.create(this.parent, state);
        }
    }
    class EmbeddedLanguageData {
        constructor(languageId, state) {
            this.languageId = languageId;
            this.state = state;
        }
        equals(other) {
            return (this.languageId === other.languageId
                && this.state.equals(other.state));
        }
        clone() {
            const stateClone = this.state.clone();
            // save an object
            if (stateClone === this.state) {
                return this;
            }
            return new EmbeddedLanguageData(this.languageId, this.state);
        }
    }
    /**
     * Reuse the same line states up to a certain depth.
     */
    class MonarchLineStateFactory {
        static { this._INSTANCE = new MonarchLineStateFactory(CACHE_STACK_DEPTH); }
        static create(stack, embeddedLanguageData) {
            return this._INSTANCE.create(stack, embeddedLanguageData);
        }
        constructor(maxCacheDepth) {
            this._maxCacheDepth = maxCacheDepth;
            this._entries = Object.create(null);
        }
        create(stack, embeddedLanguageData) {
            if (embeddedLanguageData !== null) {
                // no caching when embedding
                return new MonarchLineState(stack, embeddedLanguageData);
            }
            if (stack !== null && stack.depth >= this._maxCacheDepth) {
                // no caching above a certain depth
                return new MonarchLineState(stack, embeddedLanguageData);
            }
            const stackElementId = MonarchStackElement.getStackElementId(stack);
            let result = this._entries[stackElementId];
            if (result) {
                return result;
            }
            result = new MonarchLineState(stack, null);
            this._entries[stackElementId] = result;
            return result;
        }
    }
    class MonarchLineState {
        constructor(stack, embeddedLanguageData) {
            this.stack = stack;
            this.embeddedLanguageData = embeddedLanguageData;
        }
        clone() {
            const embeddedlanguageDataClone = this.embeddedLanguageData ? this.embeddedLanguageData.clone() : null;
            // save an object
            if (embeddedlanguageDataClone === this.embeddedLanguageData) {
                return this;
            }
            return MonarchLineStateFactory.create(this.stack, this.embeddedLanguageData);
        }
        equals(other) {
            if (!(other instanceof MonarchLineState)) {
                return false;
            }
            if (!this.stack.equals(other.stack)) {
                return false;
            }
            if (this.embeddedLanguageData === null && other.embeddedLanguageData === null) {
                return true;
            }
            if (this.embeddedLanguageData === null || other.embeddedLanguageData === null) {
                return false;
            }
            return this.embeddedLanguageData.equals(other.embeddedLanguageData);
        }
    }
    class MonarchClassicTokensCollector {
        constructor() {
            this._tokens = [];
            this._languageId = null;
            this._lastTokenType = null;
            this._lastTokenLanguage = null;
        }
        enterLanguage(languageId) {
            this._languageId = languageId;
        }
        emit(startOffset, type) {
            if (this._lastTokenType === type && this._lastTokenLanguage === this._languageId) {
                return;
            }
            this._lastTokenType = type;
            this._lastTokenLanguage = this._languageId;
            this._tokens.push(new languages.Token(startOffset, type, this._languageId));
        }
        nestedLanguageTokenize(embeddedLanguageLine, hasEOL, embeddedLanguageData, offsetDelta) {
            const nestedLanguageId = embeddedLanguageData.languageId;
            const embeddedModeState = embeddedLanguageData.state;
            const nestedLanguageTokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
            if (!nestedLanguageTokenizationSupport) {
                this.enterLanguage(nestedLanguageId);
                this.emit(offsetDelta, '');
                return embeddedModeState;
            }
            const nestedResult = nestedLanguageTokenizationSupport.tokenize(embeddedLanguageLine, hasEOL, embeddedModeState);
            if (offsetDelta !== 0) {
                for (const token of nestedResult.tokens) {
                    this._tokens.push(new languages.Token(token.offset + offsetDelta, token.type, token.language));
                }
            }
            else {
                this._tokens = this._tokens.concat(nestedResult.tokens);
            }
            this._lastTokenType = null;
            this._lastTokenLanguage = null;
            this._languageId = null;
            return nestedResult.endState;
        }
        finalize(endState) {
            return new languages.TokenizationResult(this._tokens, endState);
        }
    }
    class MonarchModernTokensCollector {
        constructor(languageService, theme) {
            this._languageService = languageService;
            this._theme = theme;
            this._prependTokens = null;
            this._tokens = [];
            this._currentLanguageId = 0 /* LanguageId.Null */;
            this._lastTokenMetadata = 0;
        }
        enterLanguage(languageId) {
            this._currentLanguageId = this._languageService.languageIdCodec.encodeLanguageId(languageId);
        }
        emit(startOffset, type) {
            const metadata = this._theme.match(this._currentLanguageId, type) | 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */;
            if (this._lastTokenMetadata === metadata) {
                return;
            }
            this._lastTokenMetadata = metadata;
            this._tokens.push(startOffset);
            this._tokens.push(metadata);
        }
        static _merge(a, b, c) {
            const aLen = (a !== null ? a.length : 0);
            const bLen = b.length;
            const cLen = (c !== null ? c.length : 0);
            if (aLen === 0 && bLen === 0 && cLen === 0) {
                return new Uint32Array(0);
            }
            if (aLen === 0 && bLen === 0) {
                return c;
            }
            if (bLen === 0 && cLen === 0) {
                return a;
            }
            const result = new Uint32Array(aLen + bLen + cLen);
            if (a !== null) {
                result.set(a);
            }
            for (let i = 0; i < bLen; i++) {
                result[aLen + i] = b[i];
            }
            if (c !== null) {
                result.set(c, aLen + bLen);
            }
            return result;
        }
        nestedLanguageTokenize(embeddedLanguageLine, hasEOL, embeddedLanguageData, offsetDelta) {
            const nestedLanguageId = embeddedLanguageData.languageId;
            const embeddedModeState = embeddedLanguageData.state;
            const nestedLanguageTokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
            if (!nestedLanguageTokenizationSupport) {
                this.enterLanguage(nestedLanguageId);
                this.emit(offsetDelta, '');
                return embeddedModeState;
            }
            const nestedResult = nestedLanguageTokenizationSupport.tokenizeEncoded(embeddedLanguageLine, hasEOL, embeddedModeState);
            if (offsetDelta !== 0) {
                for (let i = 0, len = nestedResult.tokens.length; i < len; i += 2) {
                    nestedResult.tokens[i] += offsetDelta;
                }
            }
            this._prependTokens = MonarchModernTokensCollector._merge(this._prependTokens, this._tokens, nestedResult.tokens);
            this._tokens = [];
            this._currentLanguageId = 0;
            this._lastTokenMetadata = 0;
            return nestedResult.endState;
        }
        finalize(endState) {
            return new languages.EncodedTokenizationResult(MonarchModernTokensCollector._merge(this._prependTokens, this._tokens, null), endState);
        }
    }
    let MonarchTokenizer = MonarchTokenizer_1 = class MonarchTokenizer extends lifecycle_1.Disposable {
        constructor(languageService, standaloneThemeService, languageId, lexer, _configurationService) {
            super();
            this._configurationService = _configurationService;
            this._languageService = languageService;
            this._standaloneThemeService = standaloneThemeService;
            this._languageId = languageId;
            this._lexer = lexer;
            this._embeddedLanguages = Object.create(null);
            this.embeddedLoaded = Promise.resolve(undefined);
            // Set up listening for embedded modes
            let emitting = false;
            this._register(languages.TokenizationRegistry.onDidChange((e) => {
                if (emitting) {
                    return;
                }
                let isOneOfMyEmbeddedModes = false;
                for (let i = 0, len = e.changedLanguages.length; i < len; i++) {
                    const language = e.changedLanguages[i];
                    if (this._embeddedLanguages[language]) {
                        isOneOfMyEmbeddedModes = true;
                        break;
                    }
                }
                if (isOneOfMyEmbeddedModes) {
                    emitting = true;
                    languages.TokenizationRegistry.handleChange([this._languageId]);
                    emitting = false;
                }
            }));
            this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: this._languageId
            });
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.maxTokenizationLineLength')) {
                    this._maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                        overrideIdentifier: this._languageId
                    });
                }
            }));
        }
        getLoadStatus() {
            const promises = [];
            for (const nestedLanguageId in this._embeddedLanguages) {
                const tokenizationSupport = languages.TokenizationRegistry.get(nestedLanguageId);
                if (tokenizationSupport) {
                    // The nested language is already loaded
                    if (tokenizationSupport instanceof MonarchTokenizer_1) {
                        const nestedModeStatus = tokenizationSupport.getLoadStatus();
                        if (nestedModeStatus.loaded === false) {
                            promises.push(nestedModeStatus.promise);
                        }
                    }
                    continue;
                }
                if (!languages.TokenizationRegistry.isResolved(nestedLanguageId)) {
                    // The nested language is in the process of being loaded
                    promises.push(languages.TokenizationRegistry.getOrCreate(nestedLanguageId));
                }
            }
            if (promises.length === 0) {
                return {
                    loaded: true
                };
            }
            return {
                loaded: false,
                promise: Promise.all(promises).then(_ => undefined)
            };
        }
        getInitialState() {
            const rootState = MonarchStackElementFactory.create(null, this._lexer.start);
            return MonarchLineStateFactory.create(rootState, null);
        }
        tokenize(line, hasEOL, lineState) {
            if (line.length >= this._maxTokenizationLineLength) {
                return (0, nullTokenize_1.nullTokenize)(this._languageId, lineState);
            }
            const tokensCollector = new MonarchClassicTokensCollector();
            const endLineState = this._tokenize(line, hasEOL, lineState, tokensCollector);
            return tokensCollector.finalize(endLineState);
        }
        tokenizeEncoded(line, hasEOL, lineState) {
            if (line.length >= this._maxTokenizationLineLength) {
                return (0, nullTokenize_1.nullTokenizeEncoded)(this._languageService.languageIdCodec.encodeLanguageId(this._languageId), lineState);
            }
            const tokensCollector = new MonarchModernTokensCollector(this._languageService, this._standaloneThemeService.getColorTheme().tokenTheme);
            const endLineState = this._tokenize(line, hasEOL, lineState, tokensCollector);
            return tokensCollector.finalize(endLineState);
        }
        _tokenize(line, hasEOL, lineState, collector) {
            if (lineState.embeddedLanguageData) {
                return this._nestedTokenize(line, hasEOL, lineState, 0, collector);
            }
            else {
                return this._myTokenize(line, hasEOL, lineState, 0, collector);
            }
        }
        _findLeavingNestedLanguageOffset(line, state) {
            let rules = this._lexer.tokenizer[state.stack.state];
            if (!rules) {
                rules = monarchCommon.findRules(this._lexer, state.stack.state); // do parent matching
                if (!rules) {
                    throw monarchCommon.createError(this._lexer, 'tokenizer state is not defined: ' + state.stack.state);
                }
            }
            let popOffset = -1;
            let hasEmbeddedPopRule = false;
            for (const rule of rules) {
                if (!monarchCommon.isIAction(rule.action) || rule.action.nextEmbedded !== '@pop') {
                    continue;
                }
                hasEmbeddedPopRule = true;
                let regex = rule.resolveRegex(state.stack.state);
                const regexSource = regex.source;
                if (regexSource.substr(0, 4) === '^(?:' && regexSource.substr(regexSource.length - 1, 1) === ')') {
                    const flags = (regex.ignoreCase ? 'i' : '') + (regex.unicode ? 'u' : '');
                    regex = new RegExp(regexSource.substr(4, regexSource.length - 5), flags);
                }
                const result = line.search(regex);
                if (result === -1 || (result !== 0 && rule.matchOnlyAtLineStart)) {
                    continue;
                }
                if (popOffset === -1 || result < popOffset) {
                    popOffset = result;
                }
            }
            if (!hasEmbeddedPopRule) {
                throw monarchCommon.createError(this._lexer, 'no rule containing nextEmbedded: "@pop" in tokenizer embedded state: ' + state.stack.state);
            }
            return popOffset;
        }
        _nestedTokenize(line, hasEOL, lineState, offsetDelta, tokensCollector) {
            const popOffset = this._findLeavingNestedLanguageOffset(line, lineState);
            if (popOffset === -1) {
                // tokenization will not leave nested language
                const nestedEndState = tokensCollector.nestedLanguageTokenize(line, hasEOL, lineState.embeddedLanguageData, offsetDelta);
                return MonarchLineStateFactory.create(lineState.stack, new EmbeddedLanguageData(lineState.embeddedLanguageData.languageId, nestedEndState));
            }
            const nestedLanguageLine = line.substring(0, popOffset);
            if (nestedLanguageLine.length > 0) {
                // tokenize with the nested language
                tokensCollector.nestedLanguageTokenize(nestedLanguageLine, false, lineState.embeddedLanguageData, offsetDelta);
            }
            const restOfTheLine = line.substring(popOffset);
            return this._myTokenize(restOfTheLine, hasEOL, lineState, offsetDelta + popOffset, tokensCollector);
        }
        _safeRuleName(rule) {
            if (rule) {
                return rule.name;
            }
            return '(unknown)';
        }
        _myTokenize(lineWithoutLF, hasEOL, lineState, offsetDelta, tokensCollector) {
            tokensCollector.enterLanguage(this._languageId);
            const lineWithoutLFLength = lineWithoutLF.length;
            const line = (hasEOL && this._lexer.includeLF ? lineWithoutLF + '\n' : lineWithoutLF);
            const lineLength = line.length;
            let embeddedLanguageData = lineState.embeddedLanguageData;
            let stack = lineState.stack;
            let pos = 0;
            let groupMatching = null;
            // See https://github.com/microsoft/monaco-editor/issues/1235
            // Evaluate rules at least once for an empty line
            let forceEvaluation = true;
            while (forceEvaluation || pos < lineLength) {
                const pos0 = pos;
                const stackLen0 = stack.depth;
                const groupLen0 = groupMatching ? groupMatching.groups.length : 0;
                const state = stack.state;
                let matches = null;
                let matched = null;
                let action = null;
                let rule = null;
                let enteringEmbeddedLanguage = null;
                // check if we need to process group matches first
                if (groupMatching) {
                    matches = groupMatching.matches;
                    const groupEntry = groupMatching.groups.shift();
                    matched = groupEntry.matched;
                    action = groupEntry.action;
                    rule = groupMatching.rule;
                    // cleanup if necessary
                    if (groupMatching.groups.length === 0) {
                        groupMatching = null;
                    }
                }
                else {
                    // otherwise we match on the token stream
                    if (!forceEvaluation && pos >= lineLength) {
                        // nothing to do
                        break;
                    }
                    forceEvaluation = false;
                    // get the rules for this state
                    let rules = this._lexer.tokenizer[state];
                    if (!rules) {
                        rules = monarchCommon.findRules(this._lexer, state); // do parent matching
                        if (!rules) {
                            throw monarchCommon.createError(this._lexer, 'tokenizer state is not defined: ' + state);
                        }
                    }
                    // try each rule until we match
                    const restOfLine = line.substr(pos);
                    for (const rule of rules) {
                        if (pos === 0 || !rule.matchOnlyAtLineStart) {
                            matches = restOfLine.match(rule.resolveRegex(state));
                            if (matches) {
                                matched = matches[0];
                                action = rule.action;
                                break;
                            }
                        }
                    }
                }
                // We matched 'rule' with 'matches' and 'action'
                if (!matches) {
                    matches = [''];
                    matched = '';
                }
                if (!action) {
                    // bad: we didn't match anything, and there is no action to take
                    // we need to advance the stream or we get progress trouble
                    if (pos < lineLength) {
                        matches = [line.charAt(pos)];
                        matched = matches[0];
                    }
                    action = this._lexer.defaultToken;
                }
                if (matched === null) {
                    // should never happen, needed for strict null checking
                    break;
                }
                // advance stream
                pos += matched.length;
                // maybe call action function (used for 'cases')
                while (monarchCommon.isFuzzyAction(action) && monarchCommon.isIAction(action) && action.test) {
                    action = action.test(matched, matches, state, pos === lineLength);
                }
                let result = null;
                // set the result: either a string or an array of actions
                if (typeof action === 'string' || Array.isArray(action)) {
                    result = action;
                }
                else if (action.group) {
                    result = action.group;
                }
                else if (action.token !== null && action.token !== undefined) {
                    // do $n replacements?
                    if (action.tokenSubst) {
                        result = monarchCommon.substituteMatches(this._lexer, action.token, matched, matches, state);
                    }
                    else {
                        result = action.token;
                    }
                    // enter embedded language?
                    if (action.nextEmbedded) {
                        if (action.nextEmbedded === '@pop') {
                            if (!embeddedLanguageData) {
                                throw monarchCommon.createError(this._lexer, 'cannot pop embedded language if not inside one');
                            }
                            embeddedLanguageData = null;
                        }
                        else if (embeddedLanguageData) {
                            throw monarchCommon.createError(this._lexer, 'cannot enter embedded language from within an embedded language');
                        }
                        else {
                            enteringEmbeddedLanguage = monarchCommon.substituteMatches(this._lexer, action.nextEmbedded, matched, matches, state);
                        }
                    }
                    // state transformations
                    if (action.goBack) { // back up the stream..
                        pos = Math.max(0, pos - action.goBack);
                    }
                    if (action.switchTo && typeof action.switchTo === 'string') {
                        let nextState = monarchCommon.substituteMatches(this._lexer, action.switchTo, matched, matches, state); // switch state without a push...
                        if (nextState[0] === '@') {
                            nextState = nextState.substr(1); // peel off starting '@'
                        }
                        if (!monarchCommon.findRules(this._lexer, nextState)) {
                            throw monarchCommon.createError(this._lexer, 'trying to switch to a state \'' + nextState + '\' that is undefined in rule: ' + this._safeRuleName(rule));
                        }
                        else {
                            stack = stack.switchTo(nextState);
                        }
                    }
                    else if (action.transform && typeof action.transform === 'function') {
                        throw monarchCommon.createError(this._lexer, 'action.transform not supported');
                    }
                    else if (action.next) {
                        if (action.next === '@push') {
                            if (stack.depth >= this._lexer.maxStack) {
                                throw monarchCommon.createError(this._lexer, 'maximum tokenizer stack size reached: [' +
                                    stack.state + ',' + stack.parent.state + ',...]');
                            }
                            else {
                                stack = stack.push(state);
                            }
                        }
                        else if (action.next === '@pop') {
                            if (stack.depth <= 1) {
                                throw monarchCommon.createError(this._lexer, 'trying to pop an empty stack in rule: ' + this._safeRuleName(rule));
                            }
                            else {
                                stack = stack.pop();
                            }
                        }
                        else if (action.next === '@popall') {
                            stack = stack.popall();
                        }
                        else {
                            let nextState = monarchCommon.substituteMatches(this._lexer, action.next, matched, matches, state);
                            if (nextState[0] === '@') {
                                nextState = nextState.substr(1); // peel off starting '@'
                            }
                            if (!monarchCommon.findRules(this._lexer, nextState)) {
                                throw monarchCommon.createError(this._lexer, 'trying to set a next state \'' + nextState + '\' that is undefined in rule: ' + this._safeRuleName(rule));
                            }
                            else {
                                stack = stack.push(nextState);
                            }
                        }
                    }
                    if (action.log && typeof (action.log) === 'string') {
                        monarchCommon.log(this._lexer, this._lexer.languageId + ': ' + monarchCommon.substituteMatches(this._lexer, action.log, matched, matches, state));
                    }
                }
                // check result
                if (result === null) {
                    throw monarchCommon.createError(this._lexer, 'lexer rule has no well-defined action in rule: ' + this._safeRuleName(rule));
                }
                const computeNewStateForEmbeddedLanguage = (enteringEmbeddedLanguage) => {
                    // support language names, mime types, and language ids
                    const languageId = (this._languageService.getLanguageIdByLanguageName(enteringEmbeddedLanguage)
                        || this._languageService.getLanguageIdByMimeType(enteringEmbeddedLanguage)
                        || enteringEmbeddedLanguage);
                    const embeddedLanguageData = this._getNestedEmbeddedLanguageData(languageId);
                    if (pos < lineLength) {
                        // there is content from the embedded language on this line
                        const restOfLine = lineWithoutLF.substr(pos);
                        return this._nestedTokenize(restOfLine, hasEOL, MonarchLineStateFactory.create(stack, embeddedLanguageData), offsetDelta + pos, tokensCollector);
                    }
                    else {
                        return MonarchLineStateFactory.create(stack, embeddedLanguageData);
                    }
                };
                // is the result a group match?
                if (Array.isArray(result)) {
                    if (groupMatching && groupMatching.groups.length > 0) {
                        throw monarchCommon.createError(this._lexer, 'groups cannot be nested: ' + this._safeRuleName(rule));
                    }
                    if (matches.length !== result.length + 1) {
                        throw monarchCommon.createError(this._lexer, 'matched number of groups does not match the number of actions in rule: ' + this._safeRuleName(rule));
                    }
                    let totalLen = 0;
                    for (let i = 1; i < matches.length; i++) {
                        totalLen += matches[i].length;
                    }
                    if (totalLen !== matched.length) {
                        throw monarchCommon.createError(this._lexer, 'with groups, all characters should be matched in consecutive groups in rule: ' + this._safeRuleName(rule));
                    }
                    groupMatching = {
                        rule: rule,
                        matches: matches,
                        groups: []
                    };
                    for (let i = 0; i < result.length; i++) {
                        groupMatching.groups[i] = {
                            action: result[i],
                            matched: matches[i + 1]
                        };
                    }
                    pos -= matched.length;
                    // call recursively to initiate first result match
                    continue;
                }
                else {
                    // regular result
                    // check for '@rematch'
                    if (result === '@rematch') {
                        pos -= matched.length;
                        matched = ''; // better set the next state too..
                        matches = null;
                        result = '';
                        // Even though `@rematch` was specified, if `nextEmbedded` also specified,
                        // a state transition should occur.
                        if (enteringEmbeddedLanguage !== null) {
                            return computeNewStateForEmbeddedLanguage(enteringEmbeddedLanguage);
                        }
                    }
                    // check progress
                    if (matched.length === 0) {
                        if (lineLength === 0 || stackLen0 !== stack.depth || state !== stack.state || (!groupMatching ? 0 : groupMatching.groups.length) !== groupLen0) {
                            continue;
                        }
                        else {
                            throw monarchCommon.createError(this._lexer, 'no progress in tokenizer in rule: ' + this._safeRuleName(rule));
                        }
                    }
                    // return the result (and check for brace matching)
                    // todo: for efficiency we could pre-sanitize tokenPostfix and substitutions
                    let tokenType = null;
                    if (monarchCommon.isString(result) && result.indexOf('@brackets') === 0) {
                        const rest = result.substr('@brackets'.length);
                        const bracket = findBracket(this._lexer, matched);
                        if (!bracket) {
                            throw monarchCommon.createError(this._lexer, '@brackets token returned but no bracket defined as: ' + matched);
                        }
                        tokenType = monarchCommon.sanitize(bracket.token + rest);
                    }
                    else {
                        const token = (result === '' ? '' : result + this._lexer.tokenPostfix);
                        tokenType = monarchCommon.sanitize(token);
                    }
                    if (pos0 < lineWithoutLFLength) {
                        tokensCollector.emit(pos0 + offsetDelta, tokenType);
                    }
                }
                if (enteringEmbeddedLanguage !== null) {
                    return computeNewStateForEmbeddedLanguage(enteringEmbeddedLanguage);
                }
            }
            return MonarchLineStateFactory.create(stack, embeddedLanguageData);
        }
        _getNestedEmbeddedLanguageData(languageId) {
            if (!this._languageService.isRegisteredLanguageId(languageId)) {
                return new EmbeddedLanguageData(languageId, nullTokenize_1.NullState);
            }
            if (languageId !== this._languageId) {
                // Fire language loading event
                this._languageService.requestBasicLanguageFeatures(languageId);
                languages.TokenizationRegistry.getOrCreate(languageId);
                this._embeddedLanguages[languageId] = true;
            }
            const tokenizationSupport = languages.TokenizationRegistry.get(languageId);
            if (tokenizationSupport) {
                return new EmbeddedLanguageData(languageId, tokenizationSupport.getInitialState());
            }
            return new EmbeddedLanguageData(languageId, nullTokenize_1.NullState);
        }
    };
    exports.MonarchTokenizer = MonarchTokenizer;
    exports.MonarchTokenizer = MonarchTokenizer = MonarchTokenizer_1 = __decorate([
        __param(4, configuration_1.IConfigurationService)
    ], MonarchTokenizer);
    /**
     * Searches for a bracket in the 'brackets' attribute that matches the input.
     */
    function findBracket(lexer, matched) {
        if (!matched) {
            return null;
        }
        matched = monarchCommon.fixCase(lexer, matched);
        const brackets = lexer.brackets;
        for (const bracket of brackets) {
            if (bracket.open === matched) {
                return { token: bracket.token, bracketType: 1 /* monarchCommon.MonarchBracket.Open */ };
            }
            else if (bracket.close === matched) {
                return { token: bracket.token, bracketType: -1 /* monarchCommon.MonarchBracket.Close */ };
            }
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uYXJjaExleGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3Ivc3RhbmRhbG9uZS9jb21tb24vbW9uYXJjaC9tb25hcmNoTGV4ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlCaEcsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7SUFFNUI7O09BRUc7SUFDSCxNQUFNLDBCQUEwQjtpQkFFUCxjQUFTLEdBQUcsSUFBSSwwQkFBMEIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9FLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBa0MsRUFBRSxLQUFhO1lBQ3JFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFLRCxZQUFZLGFBQXFCO1lBQ2hDLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRU0sTUFBTSxDQUFDLE1BQWtDLEVBQUUsS0FBYTtZQUM5RCxJQUFJLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVELG1DQUFtQztnQkFDbkMsT0FBTyxJQUFJLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMvQyxDQUFDO1lBQ0QsSUFBSSxjQUFjLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDbkUsSUFBSSxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQixjQUFjLElBQUksR0FBRyxDQUFD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