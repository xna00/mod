/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/async", "vs/base/common/observable", "vs/base/common/platform", "vs/editor/common/core/lineRange", "vs/editor/common/model/mirrorTextModel", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/lineTokens", "vs/workbench/services/textMate/browser/tokenizationSupport/textMateTokenizationSupport", "vs/workbench/services/textMate/browser/tokenizationSupport/tokenizationSupportWithLineLimit"], function (require, exports, amdX_1, async_1, observable_1, platform_1, lineRange_1, mirrorTextModel_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, lineTokens_1, textMateTokenizationSupport_1, tokenizationSupportWithLineLimit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateWorkerTokenizer = void 0;
    class TextMateWorkerTokenizer extends mirrorTextModel_1.MirrorTextModel {
        constructor(uri, lines, eol, versionId, _host, _languageId, _encodedLanguageId, maxTokenizationLineLength) {
            super(uri, lines, eol, versionId);
            this._host = _host;
            this._languageId = _languageId;
            this._encodedLanguageId = _encodedLanguageId;
            this._tokenizerWithStateStore = null;
            this._isDisposed = false;
            this._maxTokenizationLineLength = (0, observable_1.observableValue)(this, -1);
            this._tokenizeDebouncer = new async_1.RunOnceScheduler(() => this._tokenize(), 10);
            this._maxTokenizationLineLength.set(maxTokenizationLineLength, undefined);
            this._resetTokenization();
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
        onLanguageId(languageId, encodedLanguageId) {
            this._languageId = languageId;
            this._encodedLanguageId = encodedLanguageId;
            this._resetTokenization();
        }
        onEvents(e) {
            super.onEvents(e);
            this._tokenizerWithStateStore?.store.acceptChanges(e.changes);
            this._tokenizeDebouncer.schedule();
        }
        acceptMaxTokenizationLineLength(maxTokenizationLineLength) {
            this._maxTokenizationLineLength.set(maxTokenizationLineLength, undefined);
        }
        retokenize(startLineNumber, endLineNumberExclusive) {
            if (this._tokenizerWithStateStore) {
                this._tokenizerWithStateStore.store.invalidateEndStateRange(new lineRange_1.LineRange(startLineNumber, endLineNumberExclusive));
                this._tokenizeDebouncer.schedule();
            }
        }
        async _resetTokenization() {
            this._tokenizerWithStateStore = null;
            const languageId = this._languageId;
            const encodedLanguageId = this._encodedLanguageId;
            const r = await this._host.getOrCreateGrammar(languageId, encodedLanguageId);
            if (this._isDisposed || languageId !== this._languageId || encodedLanguageId !== this._encodedLanguageId || !r) {
                return;
            }
            if (r.grammar) {
                const tokenizationSupport = new tokenizationSupportWithLineLimit_1.TokenizationSupportWithLineLimit(this._encodedLanguageId, new textMateTokenizationSupport_1.TextMateTokenizationSupport(r.grammar, r.initialState, false, undefined, () => false, (timeMs, lineLength, isRandomSample) => {
                    this._host.reportTokenizationTime(timeMs, languageId, r.sourceExtensionId, lineLength, isRandomSample);
                }, false), this._maxTokenizationLineLength);
                this._tokenizerWithStateStore = new textModelTokens_1.TokenizerWithStateStore(this._lines.length, tokenizationSupport);
            }
            else {
                this._tokenizerWithStateStore = null;
            }
            this._tokenize();
        }
        async _tokenize() {
            if (this._isDisposed || !this._tokenizerWithStateStore) {
                return;
            }
            if (!this._diffStateStacksRefEqFn) {
                const { diffStateStacksRefEq } = await (0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js');
                this._diffStateStacksRefEqFn = diffStateStacksRefEq;
            }
            const startTime = new Date().getTime();
            while (true) {
                let tokenizedLines = 0;
                const tokenBuilder = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
                const stateDeltaBuilder = new StateDeltaBuilder();
                while (true) {
                    const lineToTokenize = this._tokenizerWithStateStore.getFirstInvalidLine();
                    if (lineToTokenize === null || tokenizedLines > 200) {
                        break;
                    }
                    tokenizedLines++;
                    const text = this._lines[lineToTokenize.lineNumber - 1];
                    const r = this._tokenizerWithStateStore.tokenizationSupport.tokenizeEncoded(text, true, lineToTokenize.startState);
                    if (this._tokenizerWithStateStore.store.setEndState(lineToTokenize.lineNumber, r.endState)) {
                        const delta = this._diffStateStacksRefEqFn(lineToTokenize.startState, r.endState);
                        stateDeltaBuilder.setState(lineToTokenize.lineNumber, delta);
                    }
                    else {
                        stateDeltaBuilder.setState(lineToTokenize.lineNumber, null);
                    }
                    lineTokens_1.LineTokens.convertToEndOffset(r.tokens, text.length);
                    tokenBuilder.add(lineToTokenize.lineNumber, r.tokens);
                    const deltaMs = new Date().getTime() - startTime;
                    if (deltaMs > 20) {
                        // yield to check for changes
                        break;
                    }
                }
                if (tokenizedLines === 0) {
                    break;
                }
                const stateDeltas = stateDeltaBuilder.getStateDeltas();
                this._host.setTokensAndStates(this._versionId, tokenBuilder.serialize(), stateDeltas);
                const deltaMs = new Date().getTime() - startTime;
                if (deltaMs > 20) {
                    // yield to check for changes
                    (0, platform_1.setTimeout0)(() => this._tokenize());
                    return;
                }
            }
        }
    }
    exports.TextMateWorkerTokenizer = TextMateWorkerTokenizer;
    class StateDeltaBuilder {
        constructor() {
            this._lastStartLineNumber = -1;
            this._stateDeltas = [];
        }
        setState(lineNumber, stackDiff) {
            if (lineNumber === this._lastStartLineNumber + 1) {
                this._stateDeltas[this._stateDeltas.length - 1].stateDeltas.push(stackDiff);
            }
            else {
                this._stateDeltas.push({ startLineNumber: lineNumber, stateDeltas: [stackDiff] });
            }
            this._lastStartLineNumber = lineNumber;
        }
        getStateDeltas() {
            return this._stateDeltas;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVXb3JrZXJUb2tlbml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0TWF0ZS9icm93c2VyL2JhY2tncm91bmRUb2tlbml6YXRpb24vd29ya2VyL3RleHRNYXRlV29ya2VyVG9rZW5pemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlCaEcsTUFBYSx1QkFBd0IsU0FBUSxpQ0FBZTtRQU8zRCxZQUNDLEdBQVEsRUFDUixLQUFlLEVBQ2YsR0FBVyxFQUNYLFNBQWlCLEVBQ0EsS0FBaUMsRUFDMUMsV0FBbUIsRUFDbkIsa0JBQThCLEVBQ3RDLHlCQUFpQztZQUVqQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFMakIsVUFBSyxHQUFMLEtBQUssQ0FBNEI7WUFDMUMsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFZO1lBYi9CLDZCQUF3QixHQUErQyxJQUFJLENBQUM7WUFDNUUsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUFDcEIsK0JBQTBCLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXZELHVCQUFrQixHQUFHLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBYXRGLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJ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