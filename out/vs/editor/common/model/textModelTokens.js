/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/stopwatch", "vs/editor/common/core/eolCounter", "vs/editor/common/core/lineRange", "vs/editor/common/core/offsetRange", "vs/editor/common/languages/nullTokenize", "vs/editor/common/model/fixedArray", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/lineTokens"], function (require, exports, async_1, errors_1, platform_1, stopwatch_1, eolCounter_1, lineRange_1, offsetRange_1, nullTokenize_1, fixedArray_1, contiguousMultilineTokensBuilder_1, lineTokens_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultBackgroundTokenizer = exports.RangePriorityQueueImpl = exports.TokenizationStateStore = exports.TrackingTokenizationStateStore = exports.TokenizerWithStateStoreAndTextModel = exports.TokenizerWithStateStore = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["CHEAP_TOKENIZATION_LENGTH_LIMIT"] = 2048] = "CHEAP_TOKENIZATION_LENGTH_LIMIT";
    })(Constants || (Constants = {}));
    class TokenizerWithStateStore {
        constructor(lineCount, tokenizationSupport) {
            this.tokenizationSupport = tokenizationSupport;
            this.initialState = this.tokenizationSupport.getInitialState();
            this.store = new TrackingTokenizationStateStore(lineCount);
        }
        getStartState(lineNumber) {
            return this.store.getStartState(lineNumber, this.initialState);
        }
        getFirstInvalidLine() {
            return this.store.getFirstInvalidLine(this.initialState);
        }
    }
    exports.TokenizerWithStateStore = TokenizerWithStateStore;
    class TokenizerWithStateStoreAndTextModel extends TokenizerWithStateStore {
        constructor(lineCount, tokenizationSupport, _textModel, _languageIdCodec) {
            super(lineCount, tokenizationSupport);
            this._textModel = _textModel;
            this._languageIdCodec = _languageIdCodec;
        }
        updateTokensUntilLine(builder, lineNumber) {
            const languageId = this._textModel.getLanguageId();
            while (true) {
                const lineToTokenize = this.getFirstInvalidLine();
                if (!lineToTokenize || lineToTokenize.lineNumber > lineNumber) {
                    break;
                }
                const text = this._textModel.getLineContent(lineToTokenize.lineNumber);
                const r = safeTokenize(this._languageIdCodec, languageId, this.tokenizationSupport, text, true, lineToTokenize.startState);
                builder.add(lineToTokenize.lineNumber, r.tokens);
                this.store.setEndState(lineToTokenize.lineNumber, r.endState);
            }
        }
        /** assumes state is up to date */
        getTokenTypeIfInsertingCharacter(position, character) {
            // TODO@hediet: use tokenizeLineWithEdit
            const lineStartState = this.getStartState(position.lineNumber);
            if (!lineStartState) {
                return 0 /* StandardTokenType.Other */;
            }
            const languageId = this._textModel.getLanguageId();
            const lineContent = this._textModel.getLineContent(position.lineNumber);
            // Create the text as if `character` was inserted
            const text = (lineContent.substring(0, position.column - 1)
                + character
                + lineContent.substring(position.column - 1));
            const r = safeTokenize(this._languageIdCodec, languageId, this.tokenizationSupport, text, true, lineStartState);
            const lineTokens = new lineTokens_1.LineTokens(r.tokens, text, this._languageIdCodec);
            if (lineTokens.getCount() === 0) {
                return 0 /* StandardTokenType.Other */;
            }
            const tokenIndex = lineTokens.findTokenIndexAtOffset(position.column - 1);
            return lineTokens.getStandardTokenType(tokenIndex);
        }
        /** assumes state is up to date */
        tokenizeLineWithEdit(position, length, newText) {
            const lineNumber = position.lineNumber;
            const column = position.column;
            const lineStartState = this.getStartState(lineNumber);
            if (!lineStartState) {
                return null;
            }
            const curLineContent = this._textModel.getLineContent(lineNumber);
            const newLineContent = curLineContent.substring(0, column - 1)
                + newText + curLineContent.substring(column - 1 + length);
            const languageId = this._textModel.getLanguageIdAtPosition(lineNumber, 0);
            const result = safeTokenize(this._languageIdCodec, languageId, this.tokenizationSupport, newLineContent, true, lineStartState);
            const lineTokens = new lineTokens_1.LineTokens(result.tokens, newLineContent, this._languageIdCodec);
            return lineTokens;
        }
        hasAccurateTokensForLine(lineNumber) {
            const firstInvalidLineNumber = this.store.getFirstInvalidEndStateLineNumberOrMax();
            return (lineNumber < firstInvalidLineNumber);
        }
        isCheapToTokenize(lineNumber) {
            const firstInvalidLineNumber = this.store.getFirstInvalidEndStateLineNumberOrMax();
            if (lineNumber < firstInvalidLineNumber) {
                return true;
            }
            if (lineNumber === firstInvalidLineNumber
                && this._textModel.getLineLength(lineNumber) < 2048 /* Constants.CHEAP_TOKENIZATION_LENGTH_LIMIT */) {
                return true;
            }
            return false;
        }
        /**
         * The result is not cached.
         */
        tokenizeHeuristically(builder, startLineNumber, endLineNumber) {
            if (endLineNumber <= this.store.getFirstInvalidEndStateLineNumberOrMax()) {
                // nothing to do
                return { heuristicTokens: false };
            }
            if (startLineNumber <= this.store.getFirstInvalidEndStateLineNumberOrMax()) {
                // tokenization has reached the viewport start...
                this.updateTokensUntilLine(builder, endLineNumber);
                return { heuristicTokens: false };
            }
            let state = this.guessStartState(startLineNumber);
            const languageId = this._textModel.getLanguageId();
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const text = this._textModel.getLineContent(lineNumber);
                const r = safeTokenize(this._languageIdCodec, languageId, this.tokenizationSupport, text, true, state);
                builder.add(lineNumber, r.tokens);
                state = r.endState;
            }
            return { heuristicTokens: true };
        }
        guessStartState(lineNumber) {
            let nonWhitespaceColumn = this._textModel.getLineFirstNonWhitespaceColumn(lineNumber);
            const likelyRelevantLines = [];
            let initialState = null;
            for (let i = lineNumber - 1; nonWhitespaceColumn > 1 && i >= 1; i--) {
                const newNonWhitespaceIndex = this._textModel.getLineFirstNonWhitespaceColumn(i);
                // Ignore lines full of whitespace
                if (newNonWhitespaceIndex === 0) {
                    continue;
                }
                if (newNonWhitespaceIndex < nonWhitespaceColumn) {
                    likelyRelevantLines.push(this._textModel.getLineContent(i));
                    nonWhitespaceColumn = newNonWhitespaceIndex;
                    initialState = this.getStartState(i);
                    if (initialState) {
                        break;
                    }
                }
            }
            if (!initialState) {
                initialState = this.tokenizationSupport.getInitialState();
            }
            likelyRelevantLines.reverse();
            const languageId = this._textModel.getLanguageId();
            let state = initialState;
            for (const line of likelyRelevantLines) {
                const r = safeTokenize(this._languageIdCodec, languageId, this.tokenizationSupport, line, false, state);
                state = r.endState;
            }
            return state;
        }
    }
    exports.TokenizerWithStateStoreAndTextModel = TokenizerWithStateStoreAndTextModel;
    /**
     * **Invariant:**
     * If the text model is retokenized from line 1 to {@link getFirstInvalidEndStateLineNumber}() - 1,
     * then the recomputed end state for line l will be equal to {@link getEndState}(l).
     */
    class TrackingTokenizationStateStore {
        constructor(lineCount) {
            this.lineCount = lineCount;
            this._tokenizationStateStore = new TokenizationStateStore();
            this._invalidEndStatesLineNumbers = new RangePriorityQueueImpl();
            this._invalidEndStatesLineNumbers.addRange(new offsetRange_1.OffsetRange(1, lineCount + 1));
        }
        getEndState(lineNumber) {
            return this._tokenizationStateStore.getEndState(lineNumber);
        }
        /**
         * @returns if the end state has changed.
         */
        setEndState(lineNumber, state) {
            if (!state) {
                throw new errors_1.BugIndicatingError('Cannot set null/undefined state');
            }
            this._invalidEndStatesLineNumbers.delete(lineNumber);
            const r = this._tokenizationStateStore.setEndState(lineNumber, state);
            if (r && lineNumber < this.lineCount) {
                // because the state changed, we cannot trust the next state anymore and have to invalidate it.
                this._invalidEndStatesLineNumbers.addRange(new offsetRange_1.OffsetRange(lineNumber + 1, lineNumber + 2));
            }
            return r;
        }
        acceptChange(range, newLineCount) {
            this.lineCount += newLineCount - range.length;
            this._tokenizationStateStore.acceptChange(range, newLineCount);
            this._invalidEndStatesLineNumbers.addRangeAndResize(new offsetRange_1.OffsetRange(range.startLineNumber, range.endLineNumberExclusive), newLineCount);
        }
        acceptChanges(changes) {
            for (const c of changes) {
                const [eolCount] = (0, eolCounter_1.countEOL)(c.text);
                this.acceptChange(new lineRange_1.LineRange(c.range.startLineNumber, c.range.endLineNumber + 1), eolCount + 1);
            }
        }
        invalidateEndStateRange(range) {
            this._invalidEndStatesLineNumbers.addRange(new offsetRange_1.OffsetRange(range.startLineNumber, range.endLineNumberExclusive));
        }
        getFirstInvalidEndStateLineNumber() { return this._invalidEndStatesLineNumbers.min; }
        getFirstInvalidEndStateLineNumberOrMax() {
            return this.getFirstInvalidEndStateLineNumber() || Number.MAX_SAFE_INTEGER;
        }
        allStatesValid() { return this._invalidEndStatesLineNumbers.min === null; }
        getStartState(lineNumber, initialState) {
            if (lineNumber === 1) {
                return initialState;
            }
            return this.getEndState(lineNumber - 1);
        }
        getFirstInvalidLine(initialState) {
            const lineNumber = this.getFirstInvalidEndStateLineNumber();
            if (lineNumber === null) {
                return null;
            }
            const startState = this.getStartState(lineNumber, initialState);
            if (!startState) {
                throw new errors_1.BugIndicatingError('Start state must be defined');
            }
            return { lineNumber, startState };
        }
    }
    exports.TrackingTokenizationStateStore = TrackingTokenizationStateStore;
    class TokenizationStateStore {
        constructor() {
            this._lineEndStates = new fixedArray_1.FixedArray(null);
        }
        getEndState(lineNumber) {
            return this._lineEndStates.get(lineNumber);
        }
        setEndState(lineNumber, state) {
            const oldState = this._lineEndStates.get(lineNumber);
            if (oldState && oldState.equals(state)) {
                return false;
            }
            this._lineEndStates.set(lineNumber, state);
            return true;
        }
        acceptChange(range, newLineCount) {
            let length = range.length;
            if (newLineCount > 0 && length > 0) {
                // Keep the last state, even though it is unrelated.
                // But if the new state happens to agree with this last state, then we know we can stop tokenizing.
                length--;
                newLineCount--;
            }
            this._lineEndStates.replace(range.startLineNumber, length, newLineCount);
        }
        acceptChanges(changes) {
            for (const c of changes) {
                const [eolCount] = (0, eolCounter_1.countEOL)(c.text);
                this.acceptChange(new lineRange_1.LineRange(c.range.startLineNumber, c.range.endLineNumber + 1), eolCount + 1);
            }
        }
    }
    exports.TokenizationStateStore = TokenizationStateStore;
    class RangePriorityQueueImpl {
        constructor() {
            this._ranges = [];
        }
        getRanges() {
            return this._ranges;
        }
        get min() {
            if (this._ranges.length === 0) {
                return null;
            }
            return this._ranges[0].start;
        }
        removeMin() {
            if (this._ranges.length === 0) {
                return null;
            }
            const range = this._ranges[0];
            if (range.start + 1 === range.endExclusive) {
                this._ranges.shift();
            }
            else {
                this._ranges[0] = new offsetRange_1.OffsetRange(range.start + 1, range.endExclusive);
            }
            return range.start;
        }
        delete(value) {
            const idx = this._ranges.findIndex(r => r.contains(value));
            if (idx !== -1) {
                const range = this._ranges[idx];
                if (range.start === value) {
                    if (range.endExclusive === value + 1) {
                        this._ranges.splice(idx, 1);
                    }
                    else {
                        this._ranges[idx] = new offsetRange_1.OffsetRange(value + 1, range.endExclusive);
                    }
                }
                else {
                    if (range.endExclusive === value + 1) {
                        this._ranges[idx] = new offsetRange_1.OffsetRange(range.start, value);
                    }
                    else {
                        this._ranges.splice(idx, 1, new offsetRange_1.OffsetRange(range.start, value), new offsetRange_1.OffsetRange(value + 1, range.endExclusive));
                    }
                }
            }
        }
        addRange(range) {
            offsetRange_1.OffsetRange.addRange(range, this._ranges);
        }
        addRangeAndResize(range, newLength) {
            let idxFirstMightBeIntersecting = 0;
            while (!(idxFirstMightBeIntersecting >= this._ranges.length || range.start <= this._ranges[idxFirstMightBeIntersecting].endExclusive)) {
                idxFirstMightBeIntersecting++;
            }
            let idxFirstIsAfter = idxFirstMightBeIntersecting;
            while (!(idxFirstIsAfter >= this._ranges.length || range.endExclusive < this._ranges[idxFirstIsAfter].start)) {
                idxFirstIsAfter++;
            }
            const delta = newLength - range.length;
            for (let i = idxFirstIsAfter; i < this._ranges.length; i++) {
                this._ranges[i] = this._ranges[i].delta(delta);
            }
            if (idxFirstMightBeIntersecting === idxFirstIsAfter) {
                const newRange = new offsetRange_1.OffsetRange(range.start, range.start + newLength);
                if (!newRange.isEmpty) {
                    this._ranges.splice(idxFirstMightBeIntersecting, 0, newRange);
                }
            }
            else {
                const start = Math.min(range.start, this._ranges[idxFirstMightBeIntersecting].start);
                const endEx = Math.max(range.endExclusive, this._ranges[idxFirstIsAfter - 1].endExclusive);
                const newRange = new offsetRange_1.OffsetRange(start, endEx + delta);
                if (!newRange.isEmpty) {
                    this._ranges.splice(idxFirstMightBeIntersecting, idxFirstIsAfter - idxFirstMightBeIntersecting, newRange);
                }
                else {
                    this._ranges.splice(idxFirstMightBeIntersecting, idxFirstIsAfter - idxFirstMightBeIntersecting);
                }
            }
        }
        toString() {
            return this._ranges.map(r => r.toString()).join(' + ');
        }
    }
    exports.RangePriorityQueueImpl = RangePriorityQueueImpl;
    function safeTokenize(languageIdCodec, languageId, tokenizationSupport, text, hasEOL, state) {
        let r = null;
        if (tokenizationSupport) {
            try {
                r = tokenizationSupport.tokenizeEncoded(text, hasEOL, state.clone());
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        if (!r) {
            r = (0, nullTokenize_1.nullTokenizeEncoded)(languageIdCodec.encodeLanguageId(languageId), state);
        }
        lineTokens_1.LineTokens.convertToEndOffset(r.tokens, text.length);
        return r;
    }
    class DefaultBackgroundTokenizer {
        constructor(_tokenizerWithStateStore, _backgroundTokenStore) {
            this._tokenizerWithStateStore = _tokenizerWithStateStore;
            this._backgroundTokenStore = _backgroundTokenStore;
            this._isDisposed = false;
            this._isScheduled = false;
        }
        dispose() {
            this._isDisposed = true;
        }
        handleChanges() {
            this._beginBackgroundTokenization();
        }
        _beginBackgroundTokenization() {
            if (this._isScheduled || !this._tokenizerWithStateStore._textModel.isAttachedToEditor() || !this._hasLinesToTokenize()) {
                return;
            }
            this._isScheduled = true;
            (0, async_1.runWhenGlobalIdle)((deadline) => {
                this._isScheduled = false;
                this._backgroundTokenizeWithDeadline(deadline);
            });
        }
        /**
         * Tokenize until the deadline occurs, but try to yield every 1-2ms.
         */
        _backgroundTokenizeWithDeadline(deadline) {
            // Read the time remaining from the `deadline` immediately because it is unclear
            // if the `deadline` object will be valid after execution leaves this function.
            const endTime = Date.now() + deadline.timeRemaining();
            const execute = () => {
                if (this._isDisposed || !this._tokenizerWithStateStore._textModel.isAttachedToEditor() || !this._hasLinesToTokenize()) {
                    // disposed in the meantime or detached or finished
                    return;
                }
                this._backgroundTokenizeForAtLeast1ms();
                if (Date.now() < endTime) {
                    // There is still time before reaching the deadline, so yield to the browser and then
                    // continue execution
                    (0, platform_1.setTimeout0)(execute);
                }
                else {
                    // The deadline has been reached, so schedule a new idle callback if necessary
                    this._beginBackgroundTokenization();
                }
            };
            execute();
        }
        /**
         * Tokenize for at least 1ms.
         */
        _backgroundTokenizeForAtLeast1ms() {
            const lineCount = this._tokenizerWithStateStore._textModel.getLineCount();
            const builder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            const sw = stopwatch_1.StopWatch.create(false);
            do {
                if (sw.elapsed() > 1) {
                    // the comparison is intentionally > 1 and not >= 1 to ensure that
                    // a full millisecond has elapsed, given how microseconds are rounded
                    // to milliseconds
                    break;
                }
                const tokenizedLineNumber = this._tokenizeOneInvalidLine(builder);
                if (tokenizedLineNumber >= lineCount) {
                    break;
                }
            } while (this._hasLinesToTokenize());
            this._backgroundTokenStore.setTokens(builder.finalize());
            this.checkFinished();
        }
        _hasLinesToTokenize() {
            if (!this._tokenizerWithStateStore) {
                return false;
            }
            return !this._tokenizerWithStateStore.store.allStatesValid();
        }
        _tokenizeOneInvalidLine(builder) {
            const firstInvalidLine = this._tokenizerWithStateStore?.getFirstInvalidLine();
            if (!firstInvalidLine) {
                return this._tokenizerWithStateStore._textModel.getLineCount() + 1;
            }
            this._tokenizerWithStateStore.updateTokensUntilLine(builder, firstInvalidLine.lineNumber);
            return firstInvalidLine.lineNumber;
        }
        checkFinished() {
            if (this._isDisposed) {
                return;
            }
            if (this._tokenizerWithStateStore.store.allStatesValid()) {
                this._backgroundTokenStore.backgroundTokenizationFinished();
            }
        }
        requestTokens(startLineNumber, endLineNumberExclusive) {
            this._tokenizerWithStateStore.store.invalidateEndStateRange(new lineRange_1.LineRange(startLineNumber, endLineNumberExclusive));
        }
    }
    exports.DefaultBackgroundTokenizer = DefaultBackgroundTokenizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsVG9rZW5zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL3RleHRNb2RlbFRva2Vucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLElBQVcsU0FFVjtJQUZELFdBQVcsU0FBUztRQUNuQixrR0FBc0MsQ0FBQTtJQUN2QyxDQUFDLEVBRlUsU0FBUyxLQUFULFNBQVMsUUFFbkI7SUFFRCxNQUFhLHVCQUF1QjtRQUtuQyxZQUNDLFNBQWlCLEVBQ0QsbUJBQXlDO1lBQXpDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFOekMsaUJBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFZLENBQUM7WUFRcEYsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLDhCQUE4QixDQUFTLFNBQVMsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFTSxhQUFhLENBQUMsVUFBa0I7WUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFTSxtQkFBbUI7WUFDekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQ0Q7SUFuQkQsMERBbUJDO0lBRUQsTUFBYSxtQ0FBb0UsU0FBUSx1QkFBK0I7UUFDdkgsWUFDQyxTQUFpQixFQUNqQixtQkFBeUMsRUFDekIsVUFBc0IsRUFDdEIsZ0JBQWtDO1lBRWxELEtBQUssQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUh0QixlQUFVLEdBQVYsVUFBVSxDQUFZO1lBQ3RCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7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