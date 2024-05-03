/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/amdX", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/eolCounter", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/model/textModelTokens", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/workbench/services/textMate/browser/arrayOperation"], function (require, exports, amdX_1, lifecycle_1, observable_1, eolCounter_1, lineRange_1, range_1, textModelTokens_1, contiguousMultilineTokensBuilder_1, arrayOperation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextMateWorkerTokenizerController = void 0;
    class TextMateWorkerTokenizerController extends lifecycle_1.Disposable {
        static { this._id = 0; }
        constructor(_model, _worker, _languageIdCodec, _backgroundTokenizationStore, _configurationService, _maxTokenizationLineLength) {
            super();
            this._model = _model;
            this._worker = _worker;
            this._languageIdCodec = _languageIdCodec;
            this._backgroundTokenizationStore = _backgroundTokenizationStore;
            this._configurationService = _configurationService;
            this._maxTokenizationLineLength = _maxTokenizationLineLength;
            this.controllerId = TextMateWorkerTokenizerController._id++;
            this._pendingChanges = [];
            /**
             * These states will eventually equal the worker states.
             * _states[i] stores the state at the end of line number i+1.
             */
            this._states = new textModelTokens_1.TokenizationStateStore();
            this._loggingEnabled = observableConfigValue('editor.experimental.asyncTokenizationLogging', false, this._configurationService);
            this._register((0, observable_1.keepObserved)(this._loggingEnabled));
            this._register(this._model.onDidChangeContent((e) => {
                if (this._shouldLog) {
                    console.log('model change', {
                        fileName: this._model.uri.fsPath.split('\\').pop(),
                        changes: changesToString(e.changes),
                    });
                }
                this._worker.acceptModelChanged(this.controllerId, e);
                this._pendingChanges.push(e);
            }));
            this._register(this._model.onDidChangeLanguage((e) => {
                const languageId = this._model.getLanguageId();
                const encodedLanguageId = this._languageIdCodec.encodeLanguageId(languageId);
                this._worker.acceptModelLanguageChanged(this.controllerId, languageId, encodedLanguageId);
            }));
            const languageId = this._model.getLanguageId();
            const encodedLanguageId = this._languageIdCodec.encodeLanguageId(languageId);
            this._worker.acceptNewModel({
                uri: this._model.uri,
                versionId: this._model.getVersionId(),
                lines: this._model.getLinesContent(),
                EOL: this._model.getEOL(),
                languageId,
                encodedLanguageId,
                maxTokenizationLineLength: this._maxTokenizationLineLength.get(),
                controllerId: this.controllerId,
            });
            this._register((0, observable_1.autorun)(reader => {
                /** @description update maxTokenizationLineLength */
                const maxTokenizationLineLength = this._maxTokenizationLineLength.read(reader);
                this._worker.acceptMaxTokenizationLineLength(this.controllerId, maxTokenizationLineLength);
            }));
        }
        dispose() {
            super.dispose();
            this._worker.acceptRemovedModel(this.controllerId);
        }
        requestTokens(startLineNumber, endLineNumberExclusive) {
            this._worker.retokenize(this.controllerId, startLineNumber, endLineNumberExclusive);
        }
        /**
         * This method is called from the worker through the worker host.
         */
        async setTokensAndStates(controllerId, versionId, rawTokens, stateDeltas) {
            if (this.controllerId !== controllerId) {
                // This event is for an outdated controller (the worker didn't receive the delete/create messages yet), ignore the event.
                return;
            }
            // _states state, change{k}, ..., change{versionId}, state delta base & rawTokens, change{j}, ..., change{m}, current renderer state
            //                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^                                ^^^^^^^^^^^^^^^^^^^^^^^^^
            //                | past changes                                                   | future states
            let tokens = contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder.deserialize(new Uint8Array(rawTokens));
            if (this._shouldLog) {
                console.log('received background tokenization result', {
                    fileName: this._model.uri.fsPath.split('\\').pop(),
                    updatedTokenLines: tokens.map((t) => t.getLineRange()).join(' & '),
                    updatedStateLines: stateDeltas.map((s) => new lineRange_1.LineRange(s.startLineNumber, s.startLineNumber + s.stateDeltas.length).toString()).join(' & '),
                });
            }
            if (this._shouldLog) {
                const changes = this._pendingChanges.filter(c => c.versionId <= versionId).map(c => c.changes).map(c => changesToString(c)).join(' then ');
                console.log('Applying changes to local states', changes);
            }
            // Apply past changes to _states
            while (this._pendingChanges.length > 0 &&
                this._pendingChanges[0].versionId <= versionId) {
                const change = this._pendingChanges.shift();
                this._states.acceptChanges(change.changes);
            }
            if (this._pendingChanges.length > 0) {
                if (this._shouldLog) {
                    const changes = this._pendingChanges.map(c => c.changes).map(c => changesToString(c)).join(' then ');
                    console.log('Considering non-processed changes', changes);
                }
                const curToFutureTransformerTokens = arrayOperation_1.MonotonousIndexTransformer.fromMany(this._pendingChanges.map((c) => fullLineArrayEditFromModelContentChange(c.changes)));
                // Filter tokens in lines that got changed in the future to prevent flickering
                // These tokens are recomputed anyway.
                const b = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
                for (const t of tokens) {
                    for (let i = t.startLineNumber; i <= t.endLineNumber; i++) {
                        const result = curToFutureTransformerTokens.transform(i - 1);
                        // If result is undefined, the current line got touched by an edit.
                        // The webworker will send us new tokens for all the new/touched lines after it received the edits.
                        if (result !== undefined) {
                            b.add(i, t.getLineTokens(i));
                        }
                    }
                }
                tokens = b.finalize();
                // Apply future changes to tokens
                for (const change of this._pendingChanges) {
                    for (const innerChanges of change.changes) {
                        for (let j = 0; j < tokens.length; j++) {
                            tokens[j].applyEdit(innerChanges.range, innerChanges.text);
                        }
                    }
                }
            }
            const curToFutureTransformerStates = arrayOperation_1.MonotonousIndexTransformer.fromMany(this._pendingChanges.map((c) => fullLineArrayEditFromModelContentChange(c.changes)));
            if (!this._applyStateStackDiffFn || !this._initialState) {
                const { applyStateStackDiff, INITIAL } = await (0, amdX_1.importAMDNodeModule)('vscode-textmate', 'release/main.js');
                this._applyStateStackDiffFn = applyStateStackDiff;
                this._initialState = INITIAL;
            }
            // Apply state deltas to _states and _backgroundTokenizationStore
            for (const d of stateDeltas) {
                let prevState = d.startLineNumber <= 1 ? this._initialState : this._states.getEndState(d.startLineNumber - 1);
                for (let i = 0; i < d.stateDeltas.length; i++) {
                    const delta = d.stateDeltas[i];
                    let state;
                    if (delta) {
                        state = this._applyStateStackDiffFn(prevState, delta);
                        this._states.setEndState(d.startLineNumber + i, state);
                    }
                    else {
                        state = this._states.getEndState(d.startLineNumber + i);
                    }
                    const offset = curToFutureTransformerStates.transform(d.startLineNumber + i - 1);
                    if (offset !== undefined) {
                        // Only set the state if there is no future change in this line,
                        // as this might make consumers believe that the state/tokens are accurate
                        this._backgroundTokenizationStore.setEndState(offset + 1, state);
                    }
                    if (d.startLineNumber + i >= this._model.getLineCount() - 1) {
                        this._backgroundTokenizationStore.backgroundTokenizationFinished();
                    }
                    prevState = state;
                }
            }
            // First set states, then tokens, so that events fired from set tokens don't read invalid states
            this._backgroundTokenizationStore.setTokens(tokens);
        }
        get _shouldLog() { return this._loggingEnabled.get(); }
    }
    exports.TextMateWorkerTokenizerController = TextMateWorkerTokenizerController;
    function fullLineArrayEditFromModelContentChange(c) {
        return new arrayOperation_1.ArrayEdit(c.map((c) => new arrayOperation_1.SingleArrayEdit(c.range.startLineNumber - 1, 
        // Expand the edit range to include the entire line
        c.range.endLineNumber - c.range.startLineNumber + 1, (0, eolCounter_1.countEOL)(c.text)[0] + 1)));
    }
    function changesToString(changes) {
        return changes.map(c => range_1.Range.lift(c.range).toString() + ' => ' + c.text).join(' & ');
    }
    function observableConfigValue(key, defaultValue, configurationService) {
        return (0, observable_1.observableFromEvent)((handleChange) => configurationService.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration(key)) {
                handleChange(e);
            }
        }), () => configurationService.getValue(key) ?? defaultValue);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1hdGVXb3JrZXJUb2tlbml6ZXJDb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGV4dE1hdGUvYnJvd3Nlci9iYWNrZ3JvdW5kVG9rZW5pemF0aW9uL3RleHRNYXRlV29ya2VyVG9rZW5pemVyQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQWEsaUNBQWtDLFNBQVEsc0JBQVU7aUJBQ2pELFFBQUcsR0FBRyxDQUFDLEFBQUosQ0FBSztRQWdCdkIsWUFDa0IsTUFBa0IsRUFDbEIsT0FBbUMsRUFDbkMsZ0JBQWtDLEVBQ2xDLDRCQUEwRCxFQUMxRCxxQkFBNEMsRUFDNUMsMEJBQStDO1lBRWhFLEtBQUssRUFBRSxDQUFDO1lBUFMsV0FBTSxHQUFOLE1BQU0sQ0FBWTtZQUNsQixZQUFPLEdBQVAsT0FBTyxDQUE0QjtZQUNuQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ2xDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBOEI7WUFDMUQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQXFCO1lBcEJqRCxpQkFBWSxHQUFHLGlDQUFpQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3RELG9CQUFlLEdBQWdDLEVBQUUsQ0FBQztZQUVuRTs7O2VBR0c7WUFDYyxZQUFPLEdBQUcsSUFBSSx3Q0FBc0IsRUFBYyxDQUFDO1lBRW5ELG9CQUFlLEdBQUcscUJBQXFCLENBQUMsOENBQThDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBZTNJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBWSxFQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxD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