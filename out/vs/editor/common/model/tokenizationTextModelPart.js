/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/eolCounter", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/core/wordHelper", "vs/editor/common/languages", "vs/editor/common/model/textModelPart", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/contiguousTokensStore", "vs/editor/common/tokens/sparseTokensStore"], function (require, exports, arrays_1, async_1, errors_1, event_1, lifecycle_1, eolCounter_1, lineRange_1, position_1, wordHelper_1, languages_1, textModelPart_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, contiguousTokensStore_1, sparseTokensStore_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenizationTextModelPart = void 0;
    class TokenizationTextModelPart extends textModelPart_1.TextModelPart {
        constructor(_languageService, _languageConfigurationService, _textModel, _bracketPairsTextModelPart, _languageId, _attachedViews) {
            super();
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._textModel = _textModel;
            this._bracketPairsTextModelPart = _bracketPairsTextModelPart;
            this._languageId = _languageId;
            this._attachedViews = _attachedViews;
            this._semanticTokens = new sparseTokensStore_1.SparseTokensStore(this._languageService.languageIdCodec);
            this._onDidChangeLanguage = this._register(new event_1.Emitter());
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._onDidChangeLanguageConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeLanguageConfiguration = this._onDidChangeLanguageConfiguration.event;
            this._onDidChangeTokens = this._register(new event_1.Emitter());
            this.onDidChangeTokens = this._onDidChangeTokens.event;
            this.grammarTokens = this._register(new GrammarTokens(this._languageService.languageIdCodec, this._textModel, () => this._languageId, this._attachedViews));
            this._register(this._languageConfigurationService.onDidChange(e => {
                if (e.affects(this._languageId)) {
                    this._onDidChangeLanguageConfiguration.fire({});
                }
            }));
            this._register(this.grammarTokens.onDidChangeTokens(e => {
                this._emitModelTokensChangedEvent(e);
            }));
            this._register(this.grammarTokens.onDidChangeBackgroundTokenizationState(e => {
                this._bracketPairsTextModelPart.handleDidChangeBackgroundTokenizationState();
            }));
        }
        _hasListeners() {
            return (this._onDidChangeLanguage.hasListeners()
                || this._onDidChangeLanguageConfiguration.hasListeners()
                || this._onDidChangeTokens.hasListeners());
        }
        handleDidChangeContent(e) {
            if (e.isFlush) {
                this._semanticTokens.flush();
            }
            else if (!e.isEolChange) { // We don't have to do anything on an EOL change
                for (const c of e.changes) {
                    const [eolCount, firstLineLength, lastLineLength] = (0, eolCounter_1.countEOL)(c.text);
                    this._semanticTokens.acceptEdit(c.range, eolCount, firstLineLength, lastLineLength, c.text.length > 0 ? c.text.charCodeAt(0) : 0 /* CharCode.Null */);
                }
            }
            this.grammarTokens.handleDidChangeContent(e);
        }
        handleDidChangeAttached() {
            this.grammarTokens.handleDidChangeAttached();
        }
        /**
         * Includes grammar and semantic tokens.
         */
        getLineTokens(lineNumber) {
            this.validateLineNumber(lineNumber);
            const syntacticTokens = this.grammarTokens.getLineTokens(lineNumber);
            return this._semanticTokens.addSparseTokens(lineNumber, syntacticTokens);
        }
        _emitModelTokensChangedEvent(e) {
            if (!this._textModel._isDisposing()) {
                this._bracketPairsTextModelPart.handleDidChangeTokens(e);
                this._onDidChangeTokens.fire(e);
            }
        }
        // #region Grammar Tokens
        validateLineNumber(lineNumber) {
            if (lineNumber < 1 || lineNumber > this._textModel.getLineCount()) {
                throw new errors_1.BugIndicatingError('Illegal value for lineNumber');
            }
        }
        get hasTokens() {
            return this.grammarTokens.hasTokens;
        }
        resetTokenization() {
            this.grammarTokens.resetTokenization();
        }
        get backgroundTokenizationState() {
            return this.grammarTokens.backgroundTokenizationState;
        }
        forceTokenization(lineNumber) {
            this.validateLineNumber(lineNumber);
            this.grammarTokens.forceTokenization(lineNumber);
        }
        hasAccurateTokensForLine(lineNumber) {
            this.validateLineNumber(lineNumber);
            return this.grammarTokens.hasAccurateTokensForLine(lineNumber);
        }
        isCheapToTokenize(lineNumber) {
            this.validateLineNumber(lineNumber);
            return this.grammarTokens.isCheapToTokenize(lineNumber);
        }
        tokenizeIfCheap(lineNumber) {
            this.validateLineNumber(lineNumber);
            this.grammarTokens.tokenizeIfCheap(lineNumber);
        }
        getTokenTypeIfInsertingCharacter(lineNumber, column, character) {
            return this.grammarTokens.getTokenTypeIfInsertingCharacter(lineNumber, column, character);
        }
        tokenizeLineWithEdit(position, length, newText) {
            return this.grammarTokens.tokenizeLineWithEdit(position, length, newText);
        }
        // #endregion
        // #region Semantic Tokens
        setSemanticTokens(tokens, isComplete) {
            this._semanticTokens.set(tokens, isComplete);
            this._emitModelTokensChangedEvent({
                semanticTokensApplied: tokens !== null,
                ranges: [{ fromLineNumber: 1, toLineNumber: this._textModel.getLineCount() }],
            });
        }
        hasCompleteSemanticTokens() {
            return this._semanticTokens.isComplete();
        }
        hasSomeSemanticTokens() {
            return !this._semanticTokens.isEmpty();
        }
        setPartialSemanticTokens(range, tokens) {
            if (this.hasCompleteSemanticTokens()) {
                return;
            }
            const changedRange = this._textModel.validateRange(this._semanticTokens.setPartial(range, tokens));
            this._emitModelTokensChangedEvent({
                semanticTokensApplied: true,
                ranges: [
                    {
                        fromLineNumber: changedRange.startLineNumber,
                        toLineNumber: changedRange.endLineNumber,
                    },
                ],
            });
        }
        // #endregion
        // #region Utility Methods
        getWordAtPosition(_position) {
            this.assertNotDisposed();
            const position = this._textModel.validatePosition(_position);
            const lineContent = this._textModel.getLineContent(position.lineNumber);
            const lineTokens = this.getLineTokens(position.lineNumber);
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            // (1). First try checking right biased word
            const [rbStartOffset, rbEndOffset] = TokenizationTextModelPart._findLanguageBoundaries(lineTokens, tokenIndex);
            const rightBiasedWord = (0, wordHelper_1.getWordAtText)(position.column, this.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex)).getWordDefinition(), lineContent.substring(rbStartOffset, rbEndOffset), rbStartOffset);
            // Make sure the result touches the original passed in position
            if (rightBiasedWord &&
                rightBiasedWord.startColumn <= _position.column &&
                _position.column <= rightBiasedWord.endColumn) {
                return rightBiasedWord;
            }
            // (2). Else, if we were at a language boundary, check the left biased word
            if (tokenIndex > 0 && rbStartOffset === position.column - 1) {
                // edge case, where `position` sits between two tokens belonging to two different languages
                const [lbStartOffset, lbEndOffset] = TokenizationTextModelPart._findLanguageBoundaries(lineTokens, tokenIndex - 1);
                const leftBiasedWord = (0, wordHelper_1.getWordAtText)(position.column, this.getLanguageConfiguration(lineTokens.getLanguageId(tokenIndex - 1)).getWordDefinition(), lineContent.substring(lbStartOffset, lbEndOffset), lbStartOffset);
                // Make sure the result touches the original passed in position
                if (leftBiasedWord &&
                    leftBiasedWord.startColumn <= _position.column &&
                    _position.column <= leftBiasedWord.endColumn) {
                    return leftBiasedWord;
                }
            }
            return null;
        }
        getLanguageConfiguration(languageId) {
            return this._languageConfigurationService.getLanguageConfiguration(languageId);
        }
        static _findLanguageBoundaries(lineTokens, tokenIndex) {
            const languageId = lineTokens.getLanguageId(tokenIndex);
            // go left until a different language is hit
            let startOffset = 0;
            for (let i = tokenIndex; i >= 0 && lineTokens.getLanguageId(i) === languageId; i--) {
                startOffset = lineTokens.getStartOffset(i);
            }
            // go right until a different language is hit
            let endOffset = lineTokens.getLineContent().length;
            for (let i = tokenIndex, tokenCount = lineTokens.getCount(); i < tokenCount && lineTokens.getLanguageId(i) === languageId; i++) {
                endOffset = lineTokens.getEndOffset(i);
            }
            return [startOffset, endOffset];
        }
        getWordUntilPosition(position) {
            const wordAtPosition = this.getWordAtPosition(position);
            if (!wordAtPosition) {
                return { word: '', startColumn: position.column, endColumn: position.column, };
            }
            return {
                word: wordAtPosition.word.substr(0, position.column - wordAtPosition.startColumn),
                startColumn: wordAtPosition.startColumn,
                endColumn: position.column,
            };
        }
        // #endregion
        // #region Language Id handling
        getLanguageId() {
            return this._languageId;
        }
        getLanguageIdAtPosition(lineNumber, column) {
            const position = this._textModel.validatePosition(new position_1.Position(lineNumber, column));
            const lineTokens = this.getLineTokens(position.lineNumber);
            return lineTokens.getLanguageId(lineTokens.findTokenIndexAtOffset(position.column - 1));
        }
        setLanguageId(languageId, source = 'api') {
            if (this._languageId === languageId) {
                // There's nothing to do
                return;
            }
            const e = {
                oldLanguage: this._languageId,
                newLanguage: languageId,
                source
            };
            this._languageId = languageId;
            this._bracketPairsTextModelPart.handleDidChangeLanguage(e);
            this.grammarTokens.resetTokenization();
            this._onDidChangeLanguage.fire(e);
            this._onDidChangeLanguageConfiguration.fire({});
        }
    }
    exports.TokenizationTextModelPart = TokenizationTextModelPart;
    class GrammarTokens extends lifecycle_1.Disposable {
        get backgroundTokenizationState() {
            return this._backgroundTokenizationState;
        }
        constructor(_languageIdCodec, _textModel, getLanguageId, attachedViews) {
            super();
            this._languageIdCodec = _languageIdCodec;
            this._textModel = _textModel;
            this.getLanguageId = getLanguageId;
            this._tokenizer = null;
            this._defaultBackgroundTokenizer = null;
            this._backgroundTokenizer = this._register(new lifecycle_1.MutableDisposable());
            this._tokens = new contiguousTokensStore_1.ContiguousTokensStore(this._languageIdCodec);
            this._debugBackgroundTokenizer = this._register(new lifecycle_1.MutableDisposable());
            this._backgroundTokenizationState = 1 /* BackgroundTokenizationState.InProgress */;
            this._onDidChangeBackgroundTokenizationState = this._register(new event_1.Emitter());
            /** @internal, should not be exposed by the text model! */
            this.onDidChangeBackgroundTokenizationState = this._onDidChangeBackgroundTokenizationState.event;
            this._onDidChangeTokens = this._register(new event_1.Emitter());
            /** @internal, should not be exposed by the text model! */
            this.onDidChangeTokens = this._onDidChangeTokens.event;
            this._attachedViewStates = this._register(new lifecycle_1.DisposableMap());
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => {
                const languageId = this.getLanguageId();
                if (e.changedLanguages.indexOf(languageId) === -1) {
                    return;
                }
                this.resetTokenization();
            }));
            this.resetTokenization();
            this._register(attachedViews.onDidChangeVisibleRanges(({ view, state }) => {
                if (state) {
                    let existing = this._attachedViewStates.get(view);
                    if (!existing) {
                        existing = new AttachedViewHandler(() => this.refreshRanges(existing.lineRanges));
                        this._attachedViewStates.set(view, existing);
                    }
                    existing.handleStateChange(state);
                }
                else {
                    this._attachedViewStates.deleteAndDispose(view);
                }
            }));
        }
        resetTokenization(fireTokenChangeEvent = true) {
            this._tokens.flush();
            this._debugBackgroundTokens?.flush();
            if (this._debugBackgroundStates) {
                this._debugBackgroundStates = new textModelTokens_1.TrackingTokenizationStateStore(this._textModel.getLineCount());
            }
            if (fireTokenChangeEvent) {
                this._onDidChangeTokens.fire({
                    semanticTokensApplied: false,
                    ranges: [
                        {
                            fromLineNumber: 1,
                            toLineNumber: this._textModel.getLineCount(),
                        },
                    ],
                });
            }
            const initializeTokenization = () => {
                if (this._textModel.isTooLargeForTokenization()) {
                    return [null, null];
                }
                const tokenizationSupport = languages_1.TokenizationRegistry.get(this.getLanguageId());
                if (!tokenizationSupport) {
                    return [null, null];
                }
                let initialState;
                try {
                    initialState = tokenizationSupport.getInitialState();
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                    return [null, null];
                }
                return [tokenizationSupport, initialState];
            };
            const [tokenizationSupport, initialState] = initializeTokenization();
            if (tokenizationSupport && initialState) {
                this._tokenizer = new textModelTokens_1.TokenizerWithStateStoreAndTextModel(this._textModel.getLineCount(), tokenizationSupport, this._textModel, this._languageIdCodec);
            }
            else {
                this._tokenizer = null;
            }
            this._backgroundTokenizer.clear();
            this._defaultBackgroundTokenizer = null;
            if (this._tokenizer) {
                const b = {
                    setTokens: (tokens) => {
                        this.setTokens(tokens);
                    },
                    backgroundTokenizationFinished: () => {
                        if (this._backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) {
                            // We already did a full tokenization and don't go back to progressing.
                            return;
                        }
                        const newState = 2 /* BackgroundTokenizationState.Completed */;
                        this._backgroundTokenizationState = newState;
                        this._onDidChangeBackgroundTokenizationState.fire();
                    },
                    setEndState: (lineNumber, state) => {
                        if (!this._tokenizer) {
                            return;
                        }
                        const firstInvalidEndStateLineNumber = this._tokenizer.store.getFirstInvalidEndStateLineNumber();
                        // Don't accept states for definitely valid states, the renderer is ahead of the worker!
                        if (firstInvalidEndStateLineNumber !== null && lineNumber >= firstInvalidEndStateLineNumber) {
                            this._tokenizer?.store.setEndState(lineNumber, state);
                        }
                    },
                };
                if (tokenizationSupport && tokenizationSupport.createBackgroundTokenizer && !tokenizationSupport.backgroundTokenizerShouldOnlyVerifyTokens) {
                    this._backgroundTokenizer.value = tokenizationSupport.createBackgroundTokenizer(this._textModel, b);
                }
                if (!this._backgroundTokenizer.value && !this._textModel.isTooLargeForTokenization()) {
                    this._backgroundTokenizer.value = this._defaultBackgroundTokenizer =
                        new textModelTokens_1.DefaultBackgroundTokenizer(this._tokenizer, b);
                    this._defaultBackgroundTokenizer.handleChanges();
                }
                if (tokenizationSupport?.backgroundTokenizerShouldOnlyVerifyTokens && tokenizationSupport.createBackgroundTokenizer) {
                    this._debugBackgroundTokens = new contiguousTokensStore_1.ContiguousTokensStore(this._languageIdCodec);
                    this._debugBackgroundStates = new textModelTokens_1.TrackingTokenizationStateStore(this._textModel.getLineCount());
                    this._debugBackgroundTokenizer.clear();
                    this._debugBackgroundTokenizer.value = tokenizationSupport.createBackgroundTokenizer(this._textModel, {
                        setTokens: (tokens) => {
                            this._debugBackgroundTokens?.setMultilineTokens(tokens, this._textModel);
                        },
                        backgroundTokenizationFinished() {
                            // NO OP
                        },
                        setEndState: (lineNumber, state) => {
                            this._debugBackgroundStates?.setEndState(lineNumber, state);
                        },
                    });
                }
                else {
                    this._debugBackgroundTokens = undefined;
                    this._debugBackgroundStates = undefined;
                    this._debugBackgroundTokenizer.value = undefined;
                }
            }
            this.refreshAllVisibleLineTokens();
        }
        handleDidChangeAttached() {
            this._defaultBackgroundTokenizer?.handleChanges();
        }
        handleDidChangeContent(e) {
            if (e.isFlush) {
                // Don't fire the event, as the view might not have got the text change event yet
                this.resetTokenization(false);
            }
            else if (!e.isEolChange) { // We don't have to do anything on an EOL change
                for (const c of e.changes) {
                    const [eolCount, firstLineLength] = (0, eolCounter_1.countEOL)(c.text);
                    this._tokens.acceptEdit(c.range, eolCount, firstLineLength);
                    this._debugBackgroundTokens?.acceptEdit(c.range, eolCount, firstLineLength);
                }
                this._debugBackgroundStates?.acceptChanges(e.changes);
                if (this._tokenizer) {
                    this._tokenizer.store.acceptChanges(e.changes);
                }
                this._defaultBackgroundTokenizer?.handleChanges();
            }
        }
        setTokens(tokens) {
            const { changes } = this._tokens.setMultilineTokens(tokens, this._textModel);
            if (changes.length > 0) {
                this._onDidChangeTokens.fire({ semanticTokensApplied: false, ranges: changes, });
            }
            return { changes: changes };
        }
        refreshAllVisibleLineTokens() {
            const ranges = lineRange_1.LineRange.joinMany([...this._attachedViewStates].map(([_, s]) => s.lineRanges));
            this.refreshRanges(ranges);
        }
        refreshRanges(ranges) {
            for (const range of ranges) {
                this.refreshRange(range.startLineNumber, range.endLineNumberExclusive - 1);
            }
        }
        refreshRange(startLineNumber, endLineNumber) {
            if (!this._tokenizer) {
                return;
            }
            startLineNumber = Math.max(1, Math.min(this._textModel.getLineCount(), startLineNumber));
            endLineNumber = Math.min(this._textModel.getLineCount(), endLineNumber);
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            const { heuristicTokens } = this._tokenizer.tokenizeHeuristically(builder, startLineNumber, endLineNumber);
            const changedTokens = this.setTokens(builder.finalize());
            if (heuristicTokens) {
                // We overrode tokens with heuristically computed ones.
                // Because old states might get reused (thus stopping invalidation),
                // we have to explicitly request the tokens for the changed ranges again.
                for (const c of changedTokens.changes) {
                    this._backgroundTokenizer.value?.requestTokens(c.fromLineNumber, c.toLineNumber + 1);
                }
            }
            this._defaultBackgroundTokenizer?.checkFinished();
        }
        forceTokenization(lineNumber) {
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            this._tokenizer?.updateTokensUntilLine(builder, lineNumber);
            this.setTokens(builder.finalize());
            this._defaultBackgroundTokenizer?.checkFinished();
        }
        hasAccurateTokensForLine(lineNumber) {
            if (!this._tokenizer) {
                return true;
            }
            return this._tokenizer.hasAccurateTokensForLine(lineNumber);
        }
        isCheapToTokenize(lineNumber) {
            if (!this._tokenizer) {
                return true;
            }
            return this._tokenizer.isCheapToTokenize(lineNumber);
        }
        tokenizeIfCheap(lineNumber) {
            if (this.isCheapToTokenize(lineNumber)) {
                this.forceTokenization(lineNumber);
            }
        }
        getLineTokens(lineNumber) {
            const lineText = this._textModel.getLineContent(lineNumber);
            const result = this._tokens.getTokens(this._textModel.getLanguageId(), lineNumber - 1, lineText);
            if (this._debugBackgroundTokens && this._debugBackgroundStates && this._tokenizer) {
                if (this._debugBackgroundStates.getFirstInvalidEndStateLineNumberOrMax() > lineNumber && this._tokenizer.store.getFirstInvalidEndStateLineNumberOrMax() > lineNumber) {
                    const backgroundResult = this._debugBackgroundTokens.getTokens(this._textModel.getLanguageId(), lineNumber - 1, lineText);
                    if (!result.equals(backgroundResult) && this._debugBackgroundTokenizer.value?.reportMismatchingTokens) {
                        this._debugBackgroundTokenizer.value.reportMismatchingTokens(lineNumber);
                    }
                }
            }
            return result;
        }
        getTokenTypeIfInsertingCharacter(lineNumber, column, character) {
            if (!this._tokenizer) {
                return 0 /* StandardTokenType.Other */;
            }
            const position = this._textModel.validatePosition(new position_1.Position(lineNumber, column));
            this.forceTokenization(position.lineNumber);
            return this._tokenizer.getTokenTypeIfInsertingCharacter(position, character);
        }
        tokenizeLineWithEdit(position, length, newText) {
            if (!this._tokenizer) {
                return null;
            }
            const validatedPosition = this._textModel.validatePosition(position);
            this.forceTokenization(validatedPosition.lineNumber);
            return this._tokenizer.tokenizeLineWithEdit(validatedPosition, length, newText);
        }
        get hasTokens() {
            return this._tokens.hasTokens;
        }
    }
    class AttachedViewHandler extends lifecycle_1.Disposable {
        get lineRanges() { return this._lineRanges; }
        constructor(_refreshTokens) {
            super();
            this._refreshTokens = _refreshTokens;
            this.runner = this._register(new async_1.RunOnceScheduler(() => this.update(), 50));
            this._computedLineRanges = [];
            this._lineRanges = [];
        }
        update() {
            if ((0, arrays_1.equals)(this._computedLineRanges, this._lineRanges, (a, b) => a.equals(b))) {
                return;
            }
            this._computedLineRanges = this._lineRanges;
            this._refreshTokens();
        }
        handleStateChange(state) {
            this._lineRanges = state.visibleLineRanges;
            if (state.stabilized) {
                this.runner.cancel();
                this.update();
            }
            else {
                this.runner.schedule();
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemF0aW9uVGV4dE1vZGVsUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9tb2RlbC90b2tlbml6YXRpb25UZXh0TW9kZWxQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStCaEcsTUFBYSx5QkFBMEIsU0FBUSw2QkFBYTtRQWMzRCxZQUNrQixnQkFBa0MsRUFDbEMsNkJBQTRELEVBQzVELFVBQXFCLEVBQ3JCLDBCQUFxRCxFQUM5RCxXQUFtQixFQUNWLGNBQTZCO1lBRTlDLEtBQUssRUFBRSxDQUFDO1lBUFMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQStCO1lBQzVELGVBQVUsR0FBVixVQUFVLENBQVc7WUFDckIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUEyQjtZQUM5RCxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNWLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1lBbkI5QixvQkFBZSxHQUFzQixJQUFJLHFDQUFpQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUVsRyx5QkFBb0IsR0FBd0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEIsQ0FBQyxDQUFDO1lBQ3ZILHdCQUFtQixHQUFzQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRXhGLHNDQUFpQyxHQUFxRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEyQyxDQUFDLENBQUM7WUFDOUoscUNBQWdDLEdBQW1ELElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxLQUFLLENBQUM7WUFFL0gsdUJBQWtCLEdBQXNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTRCLENBQUMs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