/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/languages/supports", "vs/editor/common/languages/supports/richEditBrackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/bracketPairsTree"], function (require, exports, arrays_1, event_1, lifecycle_1, range_1, supports_1, richEditBrackets_1, bracketPairsTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketPairsTextModelPart = void 0;
    class BracketPairsTextModelPart extends lifecycle_1.Disposable {
        get canBuildAST() {
            const maxSupportedDocumentLength = /* max lines */ 50_000 * /* average column count */ 100;
            return this.textModel.getValueLength() <= maxSupportedDocumentLength;
        }
        constructor(textModel, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.languageConfigurationService = languageConfigurationService;
            this.bracketPairsTree = this._register(new lifecycle_1.MutableDisposable());
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.bracketsRequested = false;
            this._register(this.languageConfigurationService.onDidChange(e => {
                if (!e.languageId || this.bracketPairsTree.value?.object.didLanguageChange(e.languageId)) {
                    this.bracketPairsTree.clear();
                    this.updateBracketPairsTree();
                }
            }));
        }
        //#region TextModel events
        handleDidChangeOptions(e) {
            this.bracketPairsTree.clear();
            this.updateBracketPairsTree();
        }
        handleDidChangeLanguage(e) {
            this.bracketPairsTree.clear();
            this.updateBracketPairsTree();
        }
        handleDidChangeContent(change) {
            this.bracketPairsTree.value?.object.handleContentChanged(change);
        }
        handleDidChangeBackgroundTokenizationState() {
            this.bracketPairsTree.value?.object.handleDidChangeBackgroundTokenizationState();
        }
        handleDidChangeTokens(e) {
            this.bracketPairsTree.value?.object.handleDidChangeTokens(e);
        }
        //#endregion
        updateBracketPairsTree() {
            if (this.bracketsRequested && this.canBuildAST) {
                if (!this.bracketPairsTree.value) {
                    const store = new lifecycle_1.DisposableStore();
                    this.bracketPairsTree.value = createDisposableRef(store.add(new bracketPairsTree_1.BracketPairsTree(this.textModel, (languageId) => {
                        return this.languageConfigurationService.getLanguageConfiguration(languageId);
                    })), store);
                    store.add(this.bracketPairsTree.value.object.onDidChange(e => this.onDidChangeEmitter.fire(e)));
                    this.onDidChangeEmitter.fire();
                }
            }
            else {
                if (this.bracketPairsTree.value) {
                    this.bracketPairsTree.clear();
                    // Important: Don't call fire if there was no change!
                    this.onDidChangeEmitter.fire();
                }
            }
        }
        /**
         * Returns all bracket pairs that intersect the given range.
         * The result is sorted by the start position.
        */
        getBracketPairsInRange(range) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketPairsInRange(range, false) || arrays_1.CallbackIterable.empty;
        }
        getBracketPairsInRangeWithMinIndentation(range) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketPairsInRange(range, true) || arrays_1.CallbackIterable.empty;
        }
        getBracketsInRange(range, onlyColorizedBrackets = false) {
            this.bracketsRequested = true;
            this.updateBracketPairsTree();
            return this.bracketPairsTree.value?.object.getBracketsInRange(range, onlyColorizedBrackets) || arrays_1.CallbackIterable.empty;
        }
        findMatchingBracketUp(_bracket, _position, maxDuration) {
            const position = this.textModel.validatePosition(_position);
            const languageId = this.textModel.getLanguageIdAtPosition(position.lineNumber, position.column);
            if (this.canBuildAST) {
                const closingBracketInfo = this.languageConfigurationService
                    .getLanguageConfiguration(languageId)
                    .bracketsNew.getClosingBracketInfo(_bracket);
                if (!closingBracketInfo) {
                    return null;
                }
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(_position, _position)).findLast((b) => closingBracketInfo.closes(b.openingBracketInfo));
                if (bracketPair) {
                    return bracketPair.openingBracketRange;
                }
                return null;
            }
            else {
                // Fallback to old bracket matching code:
                const bracket = _bracket.toLowerCase();
                const bracketsSupport = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                if (!bracketsSupport) {
                    return null;
                }
                const data = bracketsSupport.textIsBracket[bracket];
                if (!data) {
                    return null;
                }
                return stripBracketSearchCanceled(this._findMatchingBracketUp(data, position, createTimeBasedContinueBracketSearchPredicate(maxDuration)));
            }
        }
        matchBracket(position, maxDuration) {
            if (this.canBuildAST) {
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(position, position)).filter((item) => item.closingBracketRange !== undefined &&
                    (item.openingBracketRange.containsPosition(position) ||
                        item.closingBracketRange.containsPosition(position))).findLastMaxBy((0, arrays_1.compareBy)((item) => item.openingBracketRange.containsPosition(position)
                    ? item.openingBracketRange
                    : item.closingBracketRange, range_1.Range.compareRangesUsingStarts));
                if (bracketPair) {
                    return [bracketPair.openingBracketRange, bracketPair.closingBracketRange];
                }
                return null;
            }
            else {
                // Fallback to old bracket matching code:
                const continueSearchPredicate = createTimeBasedContinueBracketSearchPredicate(maxDuration);
                return this._matchBracket(this.textModel.validatePosition(position), continueSearchPredicate);
            }
        }
        _establishBracketSearchOffsets(position, lineTokens, modeBrackets, tokenIndex) {
            const tokenCount = lineTokens.getCount();
            const currentLanguageId = lineTokens.getLanguageId(tokenIndex);
            // limit search to not go before `maxBracketLength`
            let searchStartOffset = Math.max(0, position.column - 1 - modeBrackets.maxBracketLength);
            for (let i = tokenIndex - 1; i >= 0; i--) {
                const tokenEndOffset = lineTokens.getEndOffset(i);
                if (tokenEndOffset <= searchStartOffset) {
                    break;
                }
                if ((0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(i)) || lineTokens.getLanguageId(i) !== currentLanguageId) {
                    searchStartOffset = tokenEndOffset;
                    break;
                }
            }
            // limit search to not go after `maxBracketLength`
            let searchEndOffset = Math.min(lineTokens.getLineContent().length, position.column - 1 + modeBrackets.maxBracketLength);
            for (let i = tokenIndex + 1; i < tokenCount; i++) {
                const tokenStartOffset = lineTokens.getStartOffset(i);
                if (tokenStartOffset >= searchEndOffset) {
                    break;
                }
                if ((0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(i)) || lineTokens.getLanguageId(i) !== currentLanguageId) {
                    searchEndOffset = tokenStartOffset;
                    break;
                }
            }
            return { searchStartOffset, searchEndOffset };
        }
        _matchBracket(position, continueSearchPredicate) {
            const lineNumber = position.lineNumber;
            const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
            const lineText = this.textModel.getLineContent(lineNumber);
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            if (tokenIndex < 0) {
                return null;
            }
            const currentModeBrackets = this.languageConfigurationService.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex)).brackets;
            // check that the token is not to be ignored
            if (currentModeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex))) {
                let { searchStartOffset, searchEndOffset } = this._establishBracketSearchOffsets(position, lineTokens, currentModeBrackets, tokenIndex);
                // it might be the case that [currentTokenStart -> currentTokenEnd] contains multiple brackets
                // `bestResult` will contain the most right-side result
                let bestResult = null;
                while (true) {
                    const foundBracket = richEditBrackets_1.BracketsUtils.findNextBracketInRange(currentModeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!foundBracket) {
                        // there are no more brackets in this text
                        break;
                    }
                    // check that we didn't hit a bracket too far away from position
                    if (foundBracket.startColumn <= position.column && position.column <= foundBracket.endColumn) {
                        const foundBracketText = lineText.substring(foundBracket.startColumn - 1, foundBracket.endColumn - 1).toLowerCase();
                        const r = this._matchFoundBracket(foundBracket, currentModeBrackets.textIsBracket[foundBracketText], currentModeBrackets.textIsOpenBracket[foundBracketText], continueSearchPredicate);
                        if (r) {
                            if (r instanceof BracketSearchCanceled) {
                                return null;
                            }
                            bestResult = r;
                        }
                    }
                    searchStartOffset = foundBracket.endColumn - 1;
                }
                if (bestResult) {
                    return bestResult;
                }
            }
            // If position is in between two tokens, try also looking in the previous token
            if (tokenIndex > 0 && lineTokens.getStartOffset(tokenIndex) === position.column - 1) {
                const prevTokenIndex = tokenIndex - 1;
                const prevModeBrackets = this.languageConfigurationService.getLanguageConfiguration(lineTokens.getLanguageId(prevTokenIndex)).brackets;
                // check that previous token is not to be ignored
                if (prevModeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(prevTokenIndex))) {
                    const { searchStartOffset, searchEndOffset } = this._establishBracketSearchOffsets(position, lineTokens, prevModeBrackets, prevTokenIndex);
                    const foundBracket = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(prevModeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    // check that we didn't hit a bracket too far away from position
                    if (foundBracket && foundBracket.startColumn <= position.column && position.column <= foundBracket.endColumn) {
                        const foundBracketText = lineText.substring(foundBracket.startColumn - 1, foundBracket.endColumn - 1).toLowerCase();
                        const r = this._matchFoundBracket(foundBracket, prevModeBrackets.textIsBracket[foundBracketText], prevModeBrackets.textIsOpenBracket[foundBracketText], continueSearchPredicate);
                        if (r) {
                            if (r instanceof BracketSearchCanceled) {
                                return null;
                            }
                            return r;
                        }
                    }
                }
            }
            return null;
        }
        _matchFoundBracket(foundBracket, data, isOpen, continueSearchPredicate) {
            if (!data) {
                return null;
            }
            const matched = (isOpen
                ? this._findMatchingBracketDown(data, foundBracket.getEndPosition(), continueSearchPredicate)
                : this._findMatchingBracketUp(data, foundBracket.getStartPosition(), continueSearchPredicate));
            if (!matched) {
                return null;
            }
            if (matched instanceof BracketSearchCanceled) {
                return matched;
            }
            return [foundBracket, matched];
        }
        _findMatchingBracketUp(bracket, position, continueSearchPredicate) {
            // console.log('_findMatchingBracketUp: ', 'bracket: ', JSON.stringify(bracket), 'startPosition: ', String(position));
            const languageId = bracket.languageId;
            const reversedBracketRegex = bracket.reversedRegex;
            let count = -1;
            let totalCallCount = 0;
            const searchPrevMatchingBracketInRange = (lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(reversedBracketRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    if (bracket.isOpen(hitText)) {
                        count++;
                    }
                    else if (bracket.isClose(hitText)) {
                        count--;
                    }
                    if (count === 0) {
                        return r;
                    }
                    searchEndOffset = r.startColumn - 1;
                }
                return null;
            };
            for (let lineNumber = position.lineNumber; lineNumber >= 1; lineNumber--) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = tokenCount - 1;
                let searchStartOffset = lineText.length;
                let searchEndOffset = lineText.length;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                }
                let prevSearchInToken = true;
                for (; tokenIndex >= 0; tokenIndex--) {
                    const searchInToken = (lineTokens.getLanguageId(tokenIndex) === languageId && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchStartOffset
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchPrevMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return r;
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchPrevMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return r;
                    }
                }
            }
            return null;
        }
        _findMatchingBracketDown(bracket, position, continueSearchPredicate) {
            // console.log('_findMatchingBracketDown: ', 'bracket: ', JSON.stringify(bracket), 'startPosition: ', String(position));
            const languageId = bracket.languageId;
            const bracketRegex = bracket.forwardRegex;
            let count = 1;
            let totalCallCount = 0;
            const searchNextMatchingBracketInRange = (lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(bracketRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    if (bracket.isOpen(hitText)) {
                        count++;
                    }
                    else if (bracket.isClose(hitText)) {
                        count--;
                    }
                    if (count === 0) {
                        return r;
                    }
                    searchStartOffset = r.endColumn - 1;
                }
                return null;
            };
            const lineCount = this.textModel.getLineCount();
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const searchInToken = (lineTokens.getLanguageId(tokenIndex) === languageId && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchNextMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return r;
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchNextMatchingBracketInRange(lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return r;
                    }
                }
            }
            return null;
        }
        findPrevBracket(_position) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                this.bracketsRequested = true;
                this.updateBracketPairsTree();
                return this.bracketPairsTree.value?.object.getFirstBracketBefore(position) || null;
            }
            let languageId = null;
            let modeBrackets = null;
            let bracketConfig = null;
            for (let lineNumber = position.lineNumber; lineNumber >= 1; lineNumber--) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = tokenCount - 1;
                let searchStartOffset = lineText.length;
                let searchEndOffset = lineText.length;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex >= 0; tokenIndex--) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (modeBrackets && bracketConfig && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchStartOffset
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = richEditBrackets_1.BracketsUtils.findPrevBracketInRange(modeBrackets.reversedRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return this._toFoundBracket(bracketConfig, r);
                    }
                }
            }
            return null;
        }
        findNextBracket(_position) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                this.bracketsRequested = true;
                this.updateBracketPairsTree();
                return this.bracketPairsTree.value?.object.getFirstBracketAfter(position) || null;
            }
            const lineCount = this.textModel.getLineCount();
            let languageId = null;
            let modeBrackets = null;
            let bracketConfig = null;
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        bracketConfig = this.languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew;
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return this._toFoundBracket(bracketConfig, r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (bracketConfig && modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return this._toFoundBracket(bracketConfig, r);
                    }
                }
            }
            return null;
        }
        findEnclosingBrackets(_position, maxDuration) {
            const position = this.textModel.validatePosition(_position);
            if (this.canBuildAST) {
                const range = range_1.Range.fromPositions(position);
                const bracketPair = this.getBracketPairsInRange(range_1.Range.fromPositions(position, position)).findLast((item) => item.closingBracketRange !== undefined && item.range.strictContainsRange(range));
                if (bracketPair) {
                    return [bracketPair.openingBracketRange, bracketPair.closingBracketRange];
                }
                return null;
            }
            const continueSearchPredicate = createTimeBasedContinueBracketSearchPredicate(maxDuration);
            const lineCount = this.textModel.getLineCount();
            const savedCounts = new Map();
            let counts = [];
            const resetCounts = (languageId, modeBrackets) => {
                if (!savedCounts.has(languageId)) {
                    const tmp = [];
                    for (let i = 0, len = modeBrackets ? modeBrackets.brackets.length : 0; i < len; i++) {
                        tmp[i] = 0;
                    }
                    savedCounts.set(languageId, tmp);
                }
                counts = savedCounts.get(languageId);
            };
            let totalCallCount = 0;
            const searchInRange = (modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset) => {
                while (true) {
                    if (continueSearchPredicate && (++totalCallCount) % 100 === 0 && !continueSearchPredicate()) {
                        return BracketSearchCanceled.INSTANCE;
                    }
                    const r = richEditBrackets_1.BracketsUtils.findNextBracketInRange(modeBrackets.forwardRegex, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (!r) {
                        break;
                    }
                    const hitText = lineText.substring(r.startColumn - 1, r.endColumn - 1).toLowerCase();
                    const bracket = modeBrackets.textIsBracket[hitText];
                    if (bracket) {
                        if (bracket.isOpen(hitText)) {
                            counts[bracket.index]++;
                        }
                        else if (bracket.isClose(hitText)) {
                            counts[bracket.index]--;
                        }
                        if (counts[bracket.index] === -1) {
                            return this._matchFoundBracket(r, bracket, false, continueSearchPredicate);
                        }
                    }
                    searchStartOffset = r.endColumn - 1;
                }
                return null;
            };
            let languageId = null;
            let modeBrackets = null;
            for (let lineNumber = position.lineNumber; lineNumber <= lineCount; lineNumber++) {
                const lineTokens = this.textModel.tokenization.getLineTokens(lineNumber);
                const tokenCount = lineTokens.getCount();
                const lineText = this.textModel.getLineContent(lineNumber);
                let tokenIndex = 0;
                let searchStartOffset = 0;
                let searchEndOffset = 0;
                if (lineNumber === position.lineNumber) {
                    tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
                    searchStartOffset = position.column - 1;
                    searchEndOffset = position.column - 1;
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        resetCounts(languageId, modeBrackets);
                    }
                }
                let prevSearchInToken = true;
                for (; tokenIndex < tokenCount; tokenIndex++) {
                    const tokenLanguageId = lineTokens.getLanguageId(tokenIndex);
                    if (languageId !== tokenLanguageId) {
                        // language id change!
                        if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return stripBracketSearchCanceled(r);
                            }
                            prevSearchInToken = false;
                        }
                        languageId = tokenLanguageId;
                        modeBrackets = this.languageConfigurationService.getLanguageConfiguration(languageId).brackets;
                        resetCounts(languageId, modeBrackets);
                    }
                    const searchInToken = (!!modeBrackets && !(0, supports_1.ignoreBracketsInToken)(lineTokens.getStandardTokenType(tokenIndex)));
                    if (searchInToken) {
                        // this token should be searched
                        if (prevSearchInToken) {
                            // the previous token should be searched, simply extend searchEndOffset
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                        else {
                            // the previous token should not be searched
                            searchStartOffset = lineTokens.getStartOffset(tokenIndex);
                            searchEndOffset = lineTokens.getEndOffset(tokenIndex);
                        }
                    }
                    else {
                        // this token should not be searched
                        if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                            const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                            if (r) {
                                return stripBracketSearchCanceled(r);
                            }
                        }
                    }
                    prevSearchInToken = searchInToken;
                }
                if (modeBrackets && prevSearchInToken && searchStartOffset !== searchEndOffset) {
                    const r = searchInRange(modeBrackets, lineNumber, lineText, searchStartOffset, searchEndOffset);
                    if (r) {
                        return stripBracketSearchCanceled(r);
                    }
                }
            }
            return null;
        }
        _toFoundBracket(bracketConfig, r) {
            if (!r) {
                return null;
            }
            let text = this.textModel.getValueInRange(r);
            text = text.toLowerCase();
            const bracketInfo = bracketConfig.getBracketInfo(text);
            if (!bracketInfo) {
                return null;
            }
            return {
                range: r,
                bracketInfo
            };
        }
    }
    exports.BracketPairsTextModelPart = BracketPairsTextModelPart;
    function createDisposableRef(object, disposable) {
        return {
            object,
            dispose: () => disposable?.dispose(),
        };
    }
    function createTimeBasedContinueBracketSearchPredicate(maxDuration) {
        if (typeof maxDuration === 'undefined') {
            return () => true;
        }
        else {
            const startTime = Date.now();
            return () => {
                return (Date.now() - startTime <= maxDuration);
            };
        }
    }
    class BracketSearchCanceled {
        static { this.INSTANCE = new BracketSearchCanceled(); }
        constructor() {
            this._searchCanceledBrand = undefined;
        }
    }
    function stripBracketSearchCanceled(result) {
        if (result instanceof BracketSearchCanceled) {
            return null;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldFBhaXJzSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC9icmFja2V0UGFpcnNUZXh0TW9kZWxQYXJ0L2JyYWNrZXRQYWlyc0ltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUJoRyxNQUFhLHlCQUEwQixTQUFRLHNCQUFVO1FBTXhELElBQVksV0FBVztZQUN0QixNQUFNLDBCQUEwQixHQUFHLGVBQWUsQ0FBQyxNQUFNLEdBQUcsMEJBQTBCLENBQUMsR0FBRyxDQUFDO1lBQzNGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsSUFBSSwwQkFBMEIsQ0FBQztRQUN0RSxDQUFDO1FBSUQsWUFDa0IsU0FBb0IsRUFDcEIsNEJBQTJEO1lBRTVFLEtBQUssRUFBRSxDQUFDO1lBSFMsY0FBUyxHQUFULFNBQVMsQ0FBVztZQUNwQixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBZDVELHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBZ0MsQ0FBQyxDQUFDO1lBRXpGLHVCQUFrQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDMUMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBT3BELHNCQUFpQixHQUFHLEtBQUssQ0FBQztZQVFqQyxJQUFJLENBQUMsU0FBUyxDQUNiLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pELElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO29CQUMxRixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUMvQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQ0YsQ0FBQztRQUNILENBQUM7UUFFRCwwQkFBMEI7UUFFbkIsc0JBQXNCLENBQUMsQ0FBNEI7WUFDekQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFFTSx1QkFBdUIsQ0FBQyxDQUE2QjtZQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUVNLHNCQUFzQixDQUFDLE1BQWlDO1lBQzlELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTSwwQ0FBMEM7WUFDaEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsMENBQTBDLEVBQUUsQ0FBQztRQUNsRixDQUFDO1FBRU0scUJBQXFCLENBQUMsQ0FBMkI7WUFDdkQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELFlBQVk7UUFFSixzQkFBc0I7WUFDN0IsSUFBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNsQyxNQUFNLEtBQUssR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztvQkFFcEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssR0FBRyxtQkFBbUIsQ0FDaEQsS0FBSyxDQUFDLEdBQUcsQ0FDUixJQUFJLG1DQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRTt3QkFDbkQsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQy9FLENBQUMsQ0FBQyxDQUNGLEVBQ0QsS0FBSyxDQUNMLENBQUM7b0JBQ0YsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzlCLHFEQUFxRDtvQkFDckQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRDs7O1VBR0U7UUFDSyxzQkFBc0IsQ0FBQyxLQUFZO1lBQ3pDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUkseUJBQWdCLENBQUMsS0FBSyxDQUFDO1FBQzNHLENBQUM7UUFFTSx3Q0FBd0MsQ0FBQyxLQUFZO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUkseUJBQWdCLENBQUMsS0FBSyxDQUFDO1FBQzFHLENBQUM7UUFFTSxrQkFBa0IsQ0FBQyxLQUFZLEVBQUUsd0JBQWlDLEtBQUs7WUFDN0UsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQztZQUM5QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUM5QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxJQUFJLHlCQUFnQixDQUFDLEtBQUssQ0FBQztRQUN2SCxDQUFDO1FBRU0scUJBQXFCLENBQUMsUUFBZ0IsRUFBRSxTQUFvQixFQUFFLFdBQW9CO1lBQ3hGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVoRyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsNEJBQTRCO3FCQUMxRCx3QkFBd0IsQ0FBQyxVQUFVLENBQUM7cUJBQ3BDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFOUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3pCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQUssQ0FBQyxhQUFhLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDekcsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUMvQyxDQUFDO2dCQUVGLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sV0FBVyxDQUFDLG1CQUFtQixDQUFDO2dCQUN4QyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHlDQUF5QztnQkFDekMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUV2QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUV4RyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3RCLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFcEQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBRUQsT0FBTywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSw2Q0FBNkMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUksQ0FBQztRQUNGLENBQUM7UUFFTSxZQUFZLENBQUMsUUFBbUIsRUFBRSxXQUFvQjtZQUM1RCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxXQUFXLEdBQ2hCLElBQUksQ0FBQyxzQkFBc0IsQ0FDMUIsYUFBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQ3ZDLENBQUMsTUFBTSxDQUNQLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDUixJQUFJLENBQUMsbUJBQW1CLEtBQUssU0FBUztvQkFDdEMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO3dCQUNuRCxJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FDdEQsQ0FBQyxhQUFhLENBQ2QsSUFBQSxrQkFBUyxFQUNSLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDUixJQUFJLENBQUMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO29CQUNsRCxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQjtvQkFDMUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFDNUIsYUFBSyxDQUFDLHdCQUF3QixDQUM5QixDQUNELENBQUM7Z0JBQ0gsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLENBQUMsbUJBQW9CLENBQUMsQ0FBQztnQkFDNUUsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7aUJBQU0sQ0FBQztnQkFDUCx5Q0FBeUM7Z0JBQ3pDLE1BQU0sdUJBQXVCLEdBQUcsNkNBQTZDLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzNGLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDL0YsQ0FBQztRQUNGLENBQUM7UUFFTyw4QkFBOEIsQ0FBQyxRQUFrQixFQUFFLFVBQXNCLEVBQUUsWUFBOEIsRUFBRSxVQUFrQjtZQUNwSSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDekMsTUFBTSxpQkFBaUIsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRS9ELG1EQUFtRDtZQUNuRCxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3pGLEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELElBQUksY0FBYyxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQ3pDLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxJQUFJLElBQUEsZ0NBQXFCLEVBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxpQkFBaUIsRUFBRSxDQUFDO29CQUNwSCxpQkFBaUIsR0FBRyxjQUFjLENBQUM7b0JBQ25DLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFFRCxrREFBa0Q7WUFDbEQsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3hILEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEQsSUFBSSxnQkFBZ0IsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDekMsTUFBTTtnQkFDUCxDQUFDO2dCQUNELElBQUksSUFBQSxnQ0FBcUIsRUFBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLGlCQUFpQixFQUFFLENBQUM7b0JBQ3BILGVBQWUsR0FBRyxnQkFBZ0IsQ0FBQztvQkFDbkMsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUMvQyxDQUFDO1FBRU8sYUFBYSxDQUFDLFFBQWtCLEVBQUUsdUJBQXVEO1lBQ2hHLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFDdkMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTNELE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzFFLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBRXRJLDRDQUE0QztZQUM1QyxJQUFJLG1CQUFtQixJQUFJLENBQUMsSUFBQSxnQ0FBcUIsRUFBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUVoRyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxFQUFFLEdBQUcsSUFBSSxDQUFDLDhCQUE4QixDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBRXhJLDhGQUE4RjtnQkFDOUYsdURBQXVEO2dCQUN2RCxJQUFJLFVBQVUsR0FBMEIsSUFBSSxDQUFDO2dCQUM3QyxPQUFPLElBQUksRUFBRSxDQUFDO29CQUNiLE1BQU0sWUFBWSxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3RKLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDbkIsMENBQTBDO3dCQUMxQyxNQUFNO29CQUNQLENBQUM7b0JBRUQsZ0VBQWdFO29CQUNoRSxJQUFJLFlBQVksQ0FBQyxXQUFXLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDOUYsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLFlBQVksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ3BILE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO3dCQUN2TCxJQUFJLENBQUMsRUFBRSxDQUFDOzRCQUNQLElBQUksQ0FBQyxZQUFZLHFCQUFxQixFQUFFLENBQUM7Z0NBQ3hDLE9BQU8sSUFBSSxDQUFDOzRCQUNiLENBQUM7NEJBQ0QsVUFBVSxHQUFHLENBQUMsQ0FBQzt3QkFDaEIsQ0FBQztvQkFDRixDQUFDO29CQUVELGlCQUFpQixHQUFHLFlBQVksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUVELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE9BQU8sVUFBVSxDQUFDO2dCQUNuQixDQUFDO1lBQ0YsQ0FBQztZQUVELCtFQUErRTtZQUMvRSxJQUFJLFVBQVUsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsS0FBSyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyRixNQUFNLGNBQWMsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUV2SSxpREFBaUQ7Z0JBQ2pELElBQUksZ0JBQWdCLElBQUksQ0FBQyxJQUFBLGdDQUFxQixFQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBRWpHLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFFM0ksTUFBTSxZQUFZLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFFcEosZ0VBQWdFO29CQUNoRSxJQUFJLFlBQVksSUFBSSxZQUFZLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxZQUFZLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQzlHLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxZQUFZLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNwSCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQzt3QkFDakwsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDUCxJQUFJLENBQUMsWUFBWSxxQkFBcUIsRUFBRSxDQUFDO2dDQUN4QyxPQUFPLElBQUksQ0FBQzs0QkFDYixDQUFDOzRCQUNELE9BQU8sQ0FBQyxDQUFDO3dCQUNWLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLGtCQUFrQixDQUFDLFlBQW1CLEVBQUUsSUFBcUIsRUFBRSxNQUFlLEVBQUUsdUJBQXVEO1lBQzlJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxDQUNmLE1BQU07Z0JBQ0wsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLGNBQWMsRUFBRSxFQUFFLHVCQUF1QixDQUFDO2dCQUM3RixDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSx1QkFBdUIsQ0FBQyxDQUM5RixDQUFDO1lBRUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksT0FBTyxZQUFZLHFCQUFxQixFQUFFLENBQUM7Z0JBQzlDLE9BQU8sT0FBTyxDQUFDO1lBQ2hCLENBQUM7WUFFRCxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxPQUF3QixFQUFFLFFBQWtCLEVBQUUsdUJBQXVEO1lBQ25JLHNIQUFzSDtZQUV0SCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQ3RDLE1BQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUNuRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVmLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixNQUFNLGdDQUFnQyxHQUFHLENBQUMsVUFBa0IsRUFBRSxRQUFnQixFQUFFLGlCQUF5QixFQUFFLGVBQXVCLEVBQXdDLEVBQUU7Z0JBQzNLLE9BQU8sSUFBSSxFQUFFLENBQUM7b0JBQ2IsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQzt3QkFDN0YsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7b0JBQ3ZDLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUMvSCxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ1IsTUFBTTtvQkFDUCxDQUFDO29CQUVELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDckYsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQzdCLEtBQUssRUFBRSxDQUFDO29CQUNULENBQUM7eUJBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ3JDLEtBQUssRUFBRSxDQUFDO29CQUNULENBQUM7b0JBRUQsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ2pCLE9BQU8sQ0FBQyxDQUFDO29CQUNWLENBQUM7b0JBRUQsZUFBZSxHQUFHLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO2dCQUVELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO1lBRUYsS0FBSyxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUUzRCxJQUFJLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3hDLElBQUksZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3RDLElBQUksVUFBVSxLQUFLLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDeEMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUVELElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDO2dCQUM3QixPQUFPLFVBQVUsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDdEMsTUFBTSxhQUFhLEdBQUcsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLElBQUEsZ0NBQXFCLEVBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFbkosSUFBSSxhQUFhLEVBQUUsQ0FBQzt3QkFDbkIsZ0NBQWdDO3dCQUNoQyxJQUFJLGlCQUFpQixFQUFFLENBQUM7NEJBQ3ZCLHlFQUF5RTs0QkFDekUsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDM0QsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLDRDQUE0Qzs0QkFDNUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDMUQsZUFBZSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3ZELENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLG9DQUFvQzt3QkFDcEMsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQzs0QkFDaEUsTUFBTSxDQUFDLEdBQUcsZ0NBQWdDLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQzs0QkFDckcsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQ0FDUCxPQUFPLENBQUMsQ0FBQzs0QkFDVixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxpQkFBaUIsR0FBRyxhQUFhLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQztvQkFDaEUsTUFBTSxDQUFDLEdBQUcsZ0NBQWdDLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDckcsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDUCxPQUFPLENBQUMsQ0FBQztvQkFDVixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sd0JBQXdCLENBQUMsT0FBd0IsRUFBRSxRQUFrQixFQUFFLHVCQUF1RDtZQUNySSx3SEFBd0g7WUFFeEgsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUN0QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBQzFDLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVkLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixNQUFNLGdDQUFnQyxHQUFHLENBQUMsVUFBa0IsRUFBRSxRQUFnQixFQUFFLGlCQUF5QixFQUFFLGVBQXVCLEVBQXdDLEVBQUU7Z0JBQzNLLE9BQU8sSUFBSSxFQUFFLENBQUM7b0JBQ2IsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQzt3QkFDN0YsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7b0JBQ3ZDLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDdkgsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNSLE1BQU07b0JBQ1AsQ0FBQztvQkFFRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3JGLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUM3QixLQUFLLEVBQUUsQ0FBQztvQkFDVCxDQUFDO3lCQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNyQyxLQUFLLEVBQUUsQ0FBQztvQkFDVCxDQUFDO29CQUVELElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUNqQixPQUFPLENBQUMsQ0FBQztvQkFDVixDQUFDO29CQUVELGlCQUFpQixHQUFHLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO2dCQUVELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO1lBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNoRCxLQUFLLElBQUksVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxJQUFJLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO2dCQUNsRixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3pFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRTNELElBQUksVUFBVSxHQUFHLENBQUMsQ0FBQztnQkFDbkIsSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxVQUFVLEtBQUssUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUN4QyxVQUFVLEdBQUcsVUFBVSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3BFLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUN4QyxlQUFlLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLE9BQU8sVUFBVSxHQUFHLFVBQVUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUM5QyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsSUFBQSxnQ0FBcUIsRUFBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUVuSixJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNuQixnQ0FBZ0M7d0JBQ2hDLElBQUksaUJBQWlCLEVBQUUsQ0FBQzs0QkFDdkIsdUVBQXVFOzRCQUN2RSxlQUFlLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDdkQsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLDRDQUE0Qzs0QkFDNUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDMUQsZUFBZSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3ZELENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLG9DQUFvQzt3QkFDcEMsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQzs0QkFDaEUsTUFBTSxDQUFDLEdBQUcsZ0NBQWdDLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQzs0QkFDckcsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQ0FDUCxPQUFPLENBQUMsQ0FBQzs0QkFDVixDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxpQkFBaUIsR0FBRyxhQUFhLENBQUM7Z0JBQ25DLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQztvQkFDaEUsTUFBTSxDQUFDLEdBQUcsZ0NBQWdDLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztvQkFDckcsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDUCxPQUFPLENBQUMsQ0FBQztvQkFDVixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sZUFBZSxDQUFDLFNBQW9CO1lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFNUQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO2dCQUM5QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztZQUNwRixDQUFDO1lBRUQsSUFBSSxVQUFVLEdBQWtCLElBQUksQ0FBQztZQUNyQyxJQUFJLFlBQVksR0FBNEIsSUFBSSxDQUFDO1lBQ2pELElBQUksYUFBYSxHQUF5QyxJQUFJLENBQUM7WUFDL0QsS0FBSyxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDMUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUUzRCxJQUFJLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3hDLElBQUksZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3RDLElBQUksVUFBVSxLQUFLLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDeEMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDcEMsVUFBVSxHQUFHLGVBQWUsQ0FBQzt3QkFDN0IsWUFBWSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUM7d0JBQy9GLGFBQWEsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUNwRyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLE9BQU8sVUFBVSxJQUFJLENBQUMsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUN0QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUU3RCxJQUFJLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDcEMsc0JBQXNCO3dCQUN0QixJQUFJLFlBQVksSUFBSSxhQUFhLElBQUksaUJBQWlCLElBQUksaUJBQWlCLEtBQUssZUFBZSxFQUFFLENBQUM7NEJBQ2pHLE1BQU0sQ0FBQyxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNySSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNQLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQy9DLENBQUM7NEJBQ0QsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO3dCQUMzQixDQUFDO3dCQUNELFVBQVUsR0FBRyxlQUFlLENBQUM7d0JBQzdCLFlBQVksR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUMvRixhQUFhLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztvQkFDcEcsQ0FBQztvQkFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFBLGdDQUFxQixFQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBRTlHLElBQUksYUFBYSxFQUFFLENBQUM7d0JBQ25CLGdDQUFnQzt3QkFDaEMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDOzRCQUN2Qix5RUFBeUU7NEJBQ3pFLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQzNELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCw0Q0FBNEM7NEJBQzVDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQzFELGVBQWUsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUN2RCxDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxvQ0FBb0M7d0JBQ3BDLElBQUksYUFBYSxJQUFJLFlBQVksSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQzs0QkFDakcsTUFBTSxDQUFDLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7NEJBQ3JJLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQ1AsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDL0MsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7b0JBRUQsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO2dCQUNuQyxDQUFDO2dCQUVELElBQUksYUFBYSxJQUFJLFlBQVksSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQztvQkFDakcsTUFBTSxDQUFDLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3JJLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ1AsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDL0MsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVNLGVBQWUsQ0FBQyxTQUFvQjtZQUMxQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRTVELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO2dCQUM5QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDbkYsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFaEQsSUFBSSxVQUFVLEdBQWtCLElBQUksQ0FBQztZQUNyQyxJQUFJLFlBQVksR0FBNEIsSUFBSSxDQUFDO1lBQ2pELElBQUksYUFBYSxHQUF5QyxJQUFJLENBQUM7WUFDL0QsS0FBSyxJQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLFVBQVUsSUFBSSxTQUFTLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDbEYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUUzRCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLElBQUksaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQixJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksVUFBVSxLQUFLLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNwRSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDeEMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUN0QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM3RCxJQUFJLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDcEMsVUFBVSxHQUFHLGVBQWUsQ0FBQzt3QkFDN0IsWUFBWSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUM7d0JBQy9GLGFBQWEsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxDQUFDO29CQUNwRyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLE9BQU8sVUFBVSxHQUFHLFVBQVUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUM5QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUU3RCxJQUFJLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDcEMsc0JBQXNCO3dCQUN0QixJQUFJLGFBQWEsSUFBSSxZQUFZLElBQUksaUJBQWlCLElBQUksaUJBQWlCLEtBQUssZUFBZSxFQUFFLENBQUM7NEJBQ2pHLE1BQU0sQ0FBQyxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNwSSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNQLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQy9DLENBQUM7NEJBQ0QsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO3dCQUMzQixDQUFDO3dCQUNELFVBQVUsR0FBRyxlQUFlLENBQUM7d0JBQzdCLFlBQVksR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUMvRixhQUFhLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixDQUFDLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDLFdBQVcsQ0FBQztvQkFDcEcsQ0FBQztvQkFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFBLGdDQUFxQixFQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzlHLElBQUksYUFBYSxFQUFFLENBQUM7d0JBQ25CLGdDQUFnQzt3QkFDaEMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDOzRCQUN2Qix1RUFBdUU7NEJBQ3ZFLGVBQWUsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUN2RCxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsNENBQTRDOzRCQUM1QyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUMxRCxlQUFlLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDdkQsQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1Asb0NBQW9DO3dCQUNwQyxJQUFJLGFBQWEsSUFBSSxZQUFZLElBQUksaUJBQWlCLElBQUksaUJBQWlCLEtBQUssZUFBZSxFQUFFLENBQUM7NEJBQ2pHLE1BQU0sQ0FBQyxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNwSSxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNQLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7NEJBQy9DLENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDO29CQUVELGlCQUFpQixHQUFHLGFBQWEsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxJQUFJLGFBQWEsSUFBSSxZQUFZLElBQUksaUJBQWlCLElBQUksaUJBQWlCLEtBQUssZUFBZSxFQUFFLENBQUM7b0JBQ2pHLE1BQU0sQ0FBQyxHQUFHLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO29CQUNwSSxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUNQLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQy9DLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxxQkFBcUIsQ0FBQyxTQUFvQixFQUFFLFdBQW9CO1lBQ3RFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFNUQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sS0FBSyxHQUFHLGFBQUssQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sV0FBVyxHQUNoQixJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQzVFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEtBQUssU0FBUyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQ3pGLENBQUM7Z0JBQ0gsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxXQUFXLENBQUMsbUJBQW9CLENBQUMsQ0FBQztnQkFDNUUsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxNQUFNLHVCQUF1QixHQUFHLDZDQUE2QyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDaEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQW9CLENBQUM7WUFFaEQsSUFBSSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzFCLE1BQU0sV0FBVyxHQUFHLENBQUMsVUFBa0IsRUFBRSxZQUFxQyxFQUFFLEVBQUU7Z0JBQ2pGLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQ2xDLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQztvQkFDZixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQzt3QkFDckYsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDWixDQUFDO29CQUNELFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO2dCQUNELE1BQU0sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBRSxDQUFDO1lBQ3ZDLENBQUMsQ0FBQztZQUVGLElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztZQUN2QixNQUFNLGFBQWEsR0FBRyxDQUFDLFlBQThCLEVBQUUsVUFBa0IsRUFBRSxRQUFnQixFQUFFLGlCQUF5QixFQUFFLGVBQXVCLEVBQWlELEVBQUU7Z0JBQ2pNLE9BQU8sSUFBSSxFQUFFLENBQUM7b0JBQ2IsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEVBQUUsQ0FBQzt3QkFDN0YsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLENBQUM7b0JBQ3ZDLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEdBQUcsZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ3BJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDUixNQUFNO29CQUNQLENBQUM7b0JBRUQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNyRixNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNwRCxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUNiLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDOzRCQUM3QixNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3pCLENBQUM7NkJBQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7NEJBQ3JDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDekIsQ0FBQzt3QkFFRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDbEMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsdUJBQXVCLENBQUMsQ0FBQzt3QkFDNUUsQ0FBQztvQkFDRixDQUFDO29CQUVELGlCQUFpQixHQUFHLENBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO2dCQUNELE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQyxDQUFDO1lBRUYsSUFBSSxVQUFVLEdBQWtCLElBQUksQ0FBQztZQUNyQyxJQUFJLFlBQVksR0FBNEIsSUFBSSxDQUFDO1lBQ2pELEtBQUssSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxVQUFVLElBQUksU0FBUyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ2xGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekUsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN6QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFM0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQixJQUFJLGlCQUFpQixHQUFHLENBQUMsQ0FBQztnQkFDMUIsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO2dCQUN4QixJQUFJLFVBQVUsS0FBSyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ3hDLFVBQVUsR0FBRyxVQUFVLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDcEUsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ3hDLGVBQWUsR0FBRyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFDdEMsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDN0QsSUFBSSxVQUFVLEtBQUssZUFBZSxFQUFFLENBQUM7d0JBQ3BDLFVBQVUsR0FBRyxlQUFlLENBQUM7d0JBQzdCLFlBQVksR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUMvRixXQUFXLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUN2QyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzdCLE9BQU8sVUFBVSxHQUFHLFVBQVUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUM5QyxNQUFNLGVBQWUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUU3RCxJQUFJLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQzt3QkFDcEMsc0JBQXNCO3dCQUN0QixJQUFJLFlBQVksSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsS0FBSyxlQUFlLEVBQUUsQ0FBQzs0QkFDaEYsTUFBTSxDQUFDLEdBQUcsYUFBYSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNoRyxJQUFJLENBQUMsRUFBRSxDQUFDO2dDQUNQLE9BQU8sMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQ3RDLENBQUM7NEJBQ0QsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO3dCQUMzQixDQUFDO3dCQUNELFVBQVUsR0FBRyxlQUFlLENBQUM7d0JBQzdCLFlBQVksR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsd0JBQXdCLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDO3dCQUMvRixXQUFXLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO29CQUN2QyxDQUFDO29CQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLElBQUEsZ0NBQXFCLEVBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUcsSUFBSSxhQUFhLEVBQUUsQ0FBQzt3QkFDbkIsZ0NBQWdDO3dCQUNoQyxJQUFJLGlCQUFpQixFQUFFLENBQUM7NEJBQ3ZCLHVFQUF1RTs0QkFDdkUsZUFBZSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3ZELENBQUM7NkJBQU0sQ0FBQzs0QkFDUCw0Q0FBNEM7NEJBQzVDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7NEJBQzFELGVBQWUsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUN2RCxDQUFDO29CQUNGLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxvQ0FBb0M7d0JBQ3BDLElBQUksWUFBWSxJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixLQUFLLGVBQWUsRUFBRSxDQUFDOzRCQUNoRixNQUFNLENBQUMsR0FBRyxhQUFhLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7NEJBQ2hHLElBQUksQ0FBQyxFQUFFLENBQUM7Z0NBQ1AsT0FBTywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdEMsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7b0JBRUQsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO2dCQUNuQyxDQUFDO2dCQUVELElBQUksWUFBWSxJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixLQUFLLGVBQWUsRUFBRSxDQUFDO29CQUNoRixNQUFNLENBQUMsR0FBRyxhQUFhLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7b0JBQ2hHLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ1AsT0FBTywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVPLGVBQWUsQ0FBQyxhQUE0QyxFQUFFLENBQVE7WUFDN0UsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNSLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFMUIsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELE9BQU87Z0JBQ04sS0FBSyxFQUFFLENBQUM7Z0JBQ1IsV0FBVzthQUNYLENBQUM7UUFDSCxDQUFDO0tBQ0Q7SUFyeUJELDhEQXF5QkM7SUFFRCxTQUFTLG1CQUFtQixDQUFJLE1BQVMsRUFBRSxVQUF3QjtRQUNsRSxPQUFPO1lBQ04sTUFBTTtZQUNOLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFO1NBQ3BDLENBQUM7SUFDSCxDQUFDO0lBSUQsU0FBUyw2Q0FBNkMsQ0FBQyxXQUErQjtRQUNyRixJQUFJLE9BQU8sV0FBVyxLQUFLLFdBQVcsRUFBRSxDQUFDO1lBQ3hDLE9BQU8sR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ25CLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzdCLE9BQU8sR0FBRyxFQUFFO2dCQUNYLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxJQUFJLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQztRQUNILENBQUM7SUFDRixDQUFDO0lBRUQsTUFBTSxxQkFBcUI7aUJBQ1osYUFBUSxHQUFHLElBQUkscUJBQXFCLEVBQUUsQUFBOUIsQ0FBK0I7UUFFckQ7WUFEQSx5QkFBb0IsR0FBRyxTQUFTLENBQUM7UUFDVCxDQUFDOztJQUcxQixTQUFTLDBCQUEwQixDQUFJLE1BQXdDO1FBQzlFLElBQUksTUFBTSxZQUFZLHFCQUFxQixFQUFFLENBQUM7WUFDN0MsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDIn0=