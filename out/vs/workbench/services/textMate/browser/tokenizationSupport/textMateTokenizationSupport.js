/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/editor/common/encodedTokenAttributes", "vs/editor/common/languages"], function (require, exports, event_1, lifecycle_1, stopwatch_1, encodedTokenAttributes_1, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateTokenizationSupport = void 0;
    class TextMateTokenizationSupport extends lifecycle_1.Disposable {
        constructor(_grammar, _initialState, _containsEmbeddedLanguages, _createBackgroundTokenizer, _backgroundTokenizerShouldOnlyVerifyTokens, _reportTokenizationTime, _reportSlowTokenization) {
            super();
            this._grammar = _grammar;
            this._initialState = _initialState;
            this._containsEmbeddedLanguages = _containsEmbeddedLanguages;
            this._createBackgroundTokenizer = _createBackgroundTokenizer;
            this._backgroundTokenizerShouldOnlyVerifyTokens = _backgroundTokenizerShouldOnlyVerifyTokens;
            this._reportTokenizationTime = _reportTokenizationTime;
            this._reportSlowTokenization = _reportSlowTokenization;
            this._seenLanguages = [];
            this._onDidEncounterLanguage = this._register(new event_1.Emitter());
            this.onDidEncounterLanguage = this._onDidEncounterLanguage.event;
        }
        get backgroundTokenizerShouldOnlyVerifyTokens() {
            return this._backgroundTokenizerShouldOnlyVerifyTokens();
        }
        getInitialState() {
            return this._initialState;
        }
        tokenize(line, hasEOL, state) {
            throw new Error('Not supported!');
        }
        createBackgroundTokenizer(textModel, store) {
            if (this._createBackgroundTokenizer) {
                return this._createBackgroundTokenizer(textModel, store);
            }
            return undefined;
        }
        tokenizeEncoded(line, hasEOL, state) {
            const isRandomSample = Math.random() * 10_000 < 1;
            const shouldMeasure = this._reportSlowTokenization || isRandomSample;
            const sw = shouldMeasure ? new stopwatch_1.StopWatch(true) : undefined;
            const textMateResult = this._grammar.tokenizeLine2(line, state, 500);
            if (shouldMeasure) {
                const timeMS = sw.elapsed();
                if (isRandomSample || timeMS > 32) {
                    this._reportTokenizationTime(timeMS, line.length, isRandomSample);
                }
            }
            if (textMateResult.stoppedEarly) {
                console.warn(`Time limit reached when tokenizing line: ${line.substring(0, 100)}`);
                // return the state at the beginning of the line
                return new languages_1.EncodedTokenizationResult(textMateResult.tokens, state);
            }
            if (this._containsEmbeddedLanguages) {
                const seenLanguages = this._seenLanguages;
                const tokens = textMateResult.tokens;
                // Must check if any of the embedded languages was hit
                for (let i = 0, len = (tokens.length >>> 1); i < len; i++) {
                    const metadata = tokens[(i << 1) + 1];
                    const languageId = encodedTokenAttributes_1.TokenMetadata.getLanguageId(metadata);
                    if (!seenLanguages[languageId]) {
                        seenLanguages[languageId] = true;
                        this._onDidEncounterLanguage.fire(languageId);
                    }
                }
            }
            let endState;
            // try to save an object if possible
            if (state.equals(textMateResult.ruleStack)) {
                endState = state;
            }
            else {
                endState = textMateResult.ruleStack;
            }
            return new languages_1.EncodedTokenizationResult(textMateResult.tokens, endState);
        }
    }
    exports.TextMateTokenizationSupport = TextMateTokenizationSupport;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVUb2tlbml6YXRpb25TdXBwb3J0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvYnJvd3Nlci90b2tlbml6YXRpb25TdXBwb3J0L3RleHRNYXRlVG9rZW5pemF0aW9uU3VwcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSwyQkFBNEIsU0FBUSxzQkFBVTtRQUsxRCxZQUNrQixRQUFrQixFQUNsQixhQUF5QixFQUN6QiwwQkFBbUMsRUFDbkMsMEJBQStJLEVBQy9JLDBDQUF5RCxFQUN6RCx1QkFBOEYsRUFDOUYsdUJBQWdDO1lBRWpELEtBQUssRUFBRSxDQUFDO1lBUlMsYUFBUSxHQUFSLFFBQVEsQ0FBVTtZQUNsQixrQkFBYSxHQUFiLGFBQWEsQ0FBWTtZQUN6QiwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQVM7WUFDbkMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFxSDtZQUMvSSwrQ0FBMEMsR0FBMUMsMENBQTBDLENBQWU7WUFDekQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF1RTtZQUM5Riw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQVM7WUFYakMsbUJBQWMsR0FBYyxFQUFFLENBQUM7WUFDL0IsNEJBQXVCLEdBQXdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQzFGLDJCQUFzQixHQUFzQixJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1FBWS9GLENBQUM7UUFFRCxJQUFXLHlDQUF5QztZQUNuRCxPQUFPLElBQUksQ0FBQywwQ0FBMEMsRUFBRSxDQUFDO1FBQzFELENBQUM7UUFFTSxlQUFlO1lBQ3JCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUMzQixDQUFDO1FBRU0s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