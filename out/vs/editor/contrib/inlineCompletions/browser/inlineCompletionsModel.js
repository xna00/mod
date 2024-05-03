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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/inlineCompletions/browser/ghostText", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsSource", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/browser/utils", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit", "vs/editor/common/core/textLength"], function (require, exports, arrays_1, arraysFind_1, errors_1, lifecycle_1, observable_1, strings_1, types_1, editOperation_1, position_1, range_1, selection_1, languages_1, languageConfigurationRegistry_1, ghostText_1, inlineCompletionsSource_1, textEdit_1, utils_1, snippetController2_1, commands_1, instantiation_1, singleTextEdit_1, textLength_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionsModel = exports.VersionIdChangeReason = void 0;
    exports.getSecondaryEdits = getSecondaryEdits;
    var VersionIdChangeReason;
    (function (VersionIdChangeReason) {
        VersionIdChangeReason[VersionIdChangeReason["Undo"] = 0] = "Undo";
        VersionIdChangeReason[VersionIdChangeReason["Redo"] = 1] = "Redo";
        VersionIdChangeReason[VersionIdChangeReason["AcceptWord"] = 2] = "AcceptWord";
        VersionIdChangeReason[VersionIdChangeReason["Other"] = 3] = "Other";
    })(VersionIdChangeReason || (exports.VersionIdChangeReason = VersionIdChangeReason = {}));
    let InlineCompletionsModel = class InlineCompletionsModel extends lifecycle_1.Disposable {
        get isAcceptingPartially() { return this._isAcceptingPartially; }
        constructor(textModel, selectedSuggestItem, textModelVersionId, _positions, _debounceValue, _suggestPreviewEnabled, _suggestPreviewMode, _inlineSuggestMode, _enabled, _instantiationService, _commandService, _languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.selectedSuggestItem = selectedSuggestItem;
            this.textModelVersionId = textModelVersionId;
            this._positions = _positions;
            this._debounceValue = _debounceValue;
            this._suggestPreviewEnabled = _suggestPreviewEnabled;
            this._suggestPreviewMode = _suggestPreviewMode;
            this._inlineSuggestMode = _inlineSuggestMode;
            this._enabled = _enabled;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._languageConfigurationService = _languageConfigurationService;
            this._source = this._register(this._instantiationService.createInstance(inlineCompletionsSource_1.InlineCompletionsSource, this.textModel, this.textModelVersionId, this._debounceValue));
            this._isActive = (0, observable_1.observableValue)(this, false);
            this._forceUpdateSignal = (0, observable_1.observableSignal)('forceUpdate');
            // We use a semantic id to keep the same inline completion selected even if the provider reorders the completions.
            this._selectedInlineCompletionId = (0, observable_1.observableValue)(this, undefined);
            this._primaryPosition = (0, observable_1.derived)(this, reader => this._positions.read(reader)[0] ?? new position_1.Position(1, 1));
            this._isAcceptingPartially = false;
            this._preserveCurrentCompletionReasons = new Set([
                VersionIdChangeReason.Redo,
                VersionIdChangeReason.Undo,
                VersionIdChangeReason.AcceptWord,
            ]);
            this._fetchInlineCompletions = (0, observable_1.derivedHandleChanges)({
                owner: this,
                createEmptyChangeSummary: () => ({
                    preserveCurrentCompletion: false,
                    inlineCompletionTriggerKind: languages_1.InlineCompletionTriggerKind.Automatic
                }),
                handleChange: (ctx, changeSummary) => {
                    /** @description fetch inline completions */
                    if (ctx.didChange(this.textModelVersionId) && this._preserveCurrentCompletionReasons.has(ctx.change)) {
                        changeSummary.preserveCurrentCompletion = true;
                    }
                    else if (ctx.didChange(this._forceUpdateSignal)) {
                        changeSummary.inlineCompletionTriggerKind = ctx.change;
                    }
                    return true;
                },
            }, (reader, changeSummary) => {
                this._forceUpdateSignal.read(reader);
                const shouldUpdate = (this._enabled.read(reader) && this.selectedSuggestItem.read(reader)) || this._isActive.read(reader);
                if (!shouldUpdate) {
                    this._source.cancelUpdate();
                    return undefined;
                }
                this.textModelVersionId.read(reader); // Refetch on text change
                const itemToPreserveCandidate = this.selectedInlineCompletion.get();
                const itemToPreserve = changeSummary.preserveCurrentCompletion || itemToPreserveCandidate?.forwardStable
                    ? itemToPreserveCandidate : undefined;
                const suggestWidgetInlineCompletions = this._source.suggestWidgetInlineCompletions.get();
                const suggestItem = this.selectedSuggestItem.read(reader);
                if (suggestWidgetInlineCompletions && !suggestItem) {
                    const inlineCompletions = this._source.inlineCompletions.get();
                    (0, observable_1.transaction)(tx => {
                        /** @description Seed inline completions with (newer) suggest widget inline completions */
                        if (!inlineCompletions || suggestWidgetInlineCompletions.request.versionId > inlineCompletions.request.versionId) {
                            this._source.inlineCompletions.set(suggestWidgetInlineCompletions.clone(), tx);
                        }
                        this._source.clearSuggestWidgetInlineCompletions(tx);
                    });
                }
                const cursorPosition = this._primaryPosition.read(reader);
                const context = {
                    triggerKind: changeSummary.inlineCompletionTriggerKind,
                    selectedSuggestionInfo: suggestItem?.toSelectedSuggestionInfo(),
                };
                return this._source.fetch(cursorPosition, context, itemToPreserve);
            });
            this._filteredInlineCompletionItems = (0, observable_1.derived)(this, reader => {
                const c = this._source.inlineCompletions.read(reader);
                if (!c) {
                    return [];
                }
                const cursorPosition = this._primaryPosition.read(reader);
                const filteredCompletions = c.inlineCompletions.filter(c => c.isVisible(this.textModel, cursorPosition, reader));
                return filteredCompletions;
            });
            this.selectedInlineCompletionIndex = (0, observable_1.derived)(this, (reader) => {
                const selectedInlineCompletionId = this._selectedInlineCompletionId.read(reader);
                const filteredCompletions = this._filteredInlineCompletionItems.read(reader);
                const idx = this._selectedInlineCompletionId === undefined ? -1
                    : filteredCompletions.findIndex(v => v.semanticId === selectedInlineCompletionId);
                if (idx === -1) {
                    // Reset the selection so that the selection does not jump back when it appears again
                    this._selectedInlineCompletionId.set(undefined, undefined);
                    return 0;
                }
                return idx;
            });
            this.selectedInlineCompletion = (0, observable_1.derived)(this, (reader) => {
                const filteredCompletions = this._filteredInlineCompletionItems.read(reader);
                const idx = this.selectedInlineCompletionIndex.read(reader);
                return filteredCompletions[idx];
            });
            this.lastTriggerKind = this._source.inlineCompletions.map(this, v => v?.request.context.triggerKind);
            this.inlineCompletionsCount = (0, observable_1.derived)(this, reader => {
                if (this.lastTriggerKind.read(reader) === languages_1.InlineCompletionTriggerKind.Explicit) {
                    return this._filteredInlineCompletionItems.read(reader).length;
                }
                else {
                    return undefined;
                }
            });
            this.state = (0, observable_1.derivedOpts)({
                owner: this,
                equalityComparer: (a, b) => {
                    if (!a || !b) {
                        return a === b;
                    }
                    return (0, ghostText_1.ghostTextsOrReplacementsEqual)(a.ghostTexts, b.ghostTexts)
                        && a.inlineCompletion === b.inlineCompletion
                        && a.suggestItem === b.suggestItem;
                }
            }, (reader) => {
                const model = this.textModel;
                const suggestItem = this.selectedSuggestItem.read(reader);
                if (suggestItem) {
                    const suggestCompletionEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(suggestItem.toSingleTextEdit(), model);
                    const augmentation = this._computeAugmentation(suggestCompletionEdit, reader);
                    const isSuggestionPreviewEnabled = this._suggestPreviewEnabled.read(reader);
                    if (!isSuggestionPreviewEnabled && !augmentation) {
                        return undefined;
                    }
                    const fullEdit = augmentation?.edit ?? suggestCompletionEdit;
                    const fullEditPreviewLength = augmentation ? augmentation.edit.text.length - suggestCompletionEdit.text.length : 0;
                    const mode = this._suggestPreviewMode.read(reader);
                    const positions = this._positions.read(reader);
                    const edits = [fullEdit, ...getSecondaryEdits(this.textModel, positions, fullEdit)];
                    const ghostTexts = edits
                        .map((edit, idx) => (0, singleTextEdit_1.computeGhostText)(edit, model, mode, positions[idx], fullEditPreviewLength))
                        .filter(types_1.isDefined);
                    const primaryGhostText = ghostTexts[0] ?? new ghostText_1.GhostText(fullEdit.range.endLineNumber, []);
                    return { edits, primaryGhostText, ghostTexts, inlineCompletion: augmentation?.completion, suggestItem };
                }
                else {
                    if (!this._isActive.read(reader)) {
                        return undefined;
                    }
                    const inlineCompletion = this.selectedInlineCompletion.read(reader);
                    if (!inlineCompletion) {
                        return undefined;
                    }
                    const replacement = inlineCompletion.toSingleTextEdit(reader);
                    const mode = this._inlineSuggestMode.read(reader);
                    const positions = this._positions.read(reader);
                    const edits = [replacement, ...getSecondaryEdits(this.textModel, positions, replacement)];
                    const ghostTexts = edits
                        .map((edit, idx) => (0, singleTextEdit_1.computeGhostText)(edit, model, mode, positions[idx], 0))
                        .filter(types_1.isDefined);
                    if (!ghostTexts[0]) {
                        return undefined;
                    }
                    return { edits, primaryGhostText: ghostTexts[0], ghostTexts, inlineCompletion, suggestItem: undefined };
                }
            });
            this.ghostTexts = (0, observable_1.derivedOpts)({
                owner: this,
                equalityComparer: ghostText_1.ghostTextsOrReplacementsEqual
            }, reader => {
                const v = this.state.read(reader);
                if (!v) {
                    return undefined;
                }
                return v.ghostTexts;
            });
            this.primaryGhostText = (0, observable_1.derivedOpts)({
                owner: this,
                equalityComparer: ghostText_1.ghostTextOrReplacementEquals
            }, reader => {
                const v = this.state.read(reader);
                if (!v) {
                    return undefined;
                }
                return v?.primaryGhostText;
            });
            this._register((0, observable_1.recomputeInitiallyAndOnChange)(this._fetchInlineCompletions));
            let lastItem = undefined;
            this._register((0, observable_1.autorun)(reader => {
                /** @description call handleItemDidShow */
                const item = this.state.read(reader);
                const completion = item?.inlineCompletion;
                if (completion?.semanticId !== lastItem?.semanticId) {
                    lastItem = completion;
                    if (completion) {
                        const i = completion.inlineCompletion;
                        const src = i.source;
                        src.provider.handleItemDidShow?.(src.inlineCompletions, i.sourceInlineCompletion, i.insertText);
                    }
                }
            }));
        }
        async trigger(tx) {
            this._isActive.set(true, tx);
            await this._fetchInlineCompletions.get();
        }
        async triggerExplicitly(tx) {
            (0, observable_1.subtransaction)(tx, tx => {
                this._isActive.set(true, tx);
                this._forceUpdateSignal.trigger(tx, languages_1.InlineCompletionTriggerKind.Explicit);
            });
            await this._fetchInlineCompletions.get();
        }
        stop(tx) {
            (0, observable_1.subtransaction)(tx, tx => {
                this._isActive.set(false, tx);
                this._source.clear(tx);
            });
        }
        _computeAugmentation(suggestCompletion, reader) {
            const model = this.textModel;
            const suggestWidgetInlineCompletions = this._source.suggestWidgetInlineCompletions.read(reader);
            const candidateInlineCompletions = suggestWidgetInlineCompletions
                ? suggestWidgetInlineCompletions.inlineCompletions
                : [this.selectedInlineCompletion.read(reader)].filter(types_1.isDefined);
            const augmentedCompletion = (0, arraysFind_1.mapFindFirst)(candidateInlineCompletions, completion => {
                let r = completion.toSingleTextEdit(reader);
                r = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(r, model, range_1.Range.fromPositions(r.range.getStartPosition(), suggestCompletion.range.getEndPosition()));
                return (0, singleTextEdit_1.singleTextEditAugments)(r, suggestCompletion) ? { completion, edit: r } : undefined;
            });
            return augmentedCompletion;
        }
        async _deltaSelectedInlineCompletionIndex(delta) {
            await this.triggerExplicitly();
            const completions = this._filteredInlineCompletionItems.get() || [];
            if (completions.length > 0) {
                const newIdx = (this.selectedInlineCompletionIndex.get() + delta + completions.length) % completions.length;
                this._selectedInlineCompletionId.set(completions[newIdx].semanticId, undefined);
            }
            else {
                this._selectedInlineCompletionId.set(undefined, undefined);
            }
        }
        async next() {
            await this._deltaSelectedInlineCompletionIndex(1);
        }
        async previous() {
            await this._deltaSelectedInlineCompletionIndex(-1);
        }
        async accept(editor) {
            if (editor.getModel() !== this.textModel) {
                throw new errors_1.BugIndicatingError();
            }
            const state = this.state.get();
            if (!state || state.primaryGhostText.isEmpty() || !state.inlineCompletion) {
                return;
            }
            const completion = state.inlineCompletion.toInlineCompletion(undefined);
            editor.pushUndoStop();
            if (completion.snippetInfo) {
                editor.executeEdits('inlineSuggestion.accept', [
                    editOperation_1.EditOperation.replaceMove(completion.range, ''),
                    ...completion.additionalTextEdits
                ]);
                editor.setPosition(completion.snippetInfo.range.getStartPosition(), 'inlineCompletionAccept');
                snippetController2_1.SnippetController2.get(editor)?.insert(completion.snippetInfo.snippet, { undoStopBefore: false });
            }
            else {
                const edits = state.edits;
                const selections = getEndPositionsAfterApplying(edits).map(p => selection_1.Selection.fromPositions(p));
                editor.executeEdits('inlineSuggestion.accept', [
                    ...edits.map(edit => editOperation_1.EditOperation.replaceMove(edit.range, edit.text)),
                    ...completion.additionalTextEdits
                ]);
                editor.setSelections(selections, 'inlineCompletionAccept');
            }
            if (completion.command) {
                // Make sure the completion list will not be disposed.
                completion.source.addRef();
            }
            // Reset before invoking the command, since the command might cause a follow up trigger.
            (0, observable_1.transaction)(tx => {
                this._source.clear(tx);
                // Potentially, isActive will get set back to true by the typing or accept inline suggest event
                // if automatic inline suggestions are enabled.
                this._isActive.set(false, tx);
            });
            if (completion.command) {
                await this._commandService
                    .executeCommand(completion.command.id, ...(completion.command.arguments || []))
                    .then(undefined, errors_1.onUnexpectedExternalError);
                completion.source.removeRef();
            }
        }
        async acceptNextWord(editor) {
            await this._acceptNext(editor, (pos, text) => {
                const langId = this.textModel.getLanguageIdAtPosition(pos.lineNumber, pos.column);
                const config = this._languageConfigurationService.getLanguageConfiguration(langId);
                const wordRegExp = new RegExp(config.wordDefinition.source, config.wordDefinition.flags.replace('g', ''));
                const m1 = text.match(wordRegExp);
                let acceptUntilIndexExclusive = 0;
                if (m1 && m1.index !== undefined) {
                    if (m1.index === 0) {
                        acceptUntilIndexExclusive = m1[0].length;
                    }
                    else {
                        acceptUntilIndexExclusive = m1.index;
                    }
                }
                else {
                    acceptUntilIndexExclusive = text.length;
                }
                const wsRegExp = /\s+/g;
                const m2 = wsRegExp.exec(text);
                if (m2 && m2.index !== undefined) {
                    if (m2.index + m2[0].length < acceptUntilIndexExclusive) {
                        acceptUntilIndexExclusive = m2.index + m2[0].length;
                    }
                }
                return acceptUntilIndexExclusive;
            }, 0 /* PartialAcceptTriggerKind.Word */);
        }
        async acceptNextLine(editor) {
            await this._acceptNext(editor, (pos, text) => {
                const m = text.match(/\n/);
                if (m && m.index !== undefined) {
                    return m.index + 1;
                }
                return text.length;
            }, 1 /* PartialAcceptTriggerKind.Line */);
        }
        async _acceptNext(editor, getAcceptUntilIndex, kind) {
            if (editor.getModel() !== this.textModel) {
                throw new errors_1.BugIndicatingError();
            }
            const state = this.state.get();
            if (!state || state.primaryGhostText.isEmpty() || !state.inlineCompletion) {
                return;
            }
            const ghostText = state.primaryGhostText;
            const completion = state.inlineCompletion.toInlineCompletion(undefined);
            if (completion.snippetInfo || completion.filterText !== completion.insertText) {
                // not in WYSIWYG mode, partial commit might change completion, thus it is not supported
                await this.accept(editor);
                return;
            }
            const firstPart = ghostText.parts[0];
            const ghostTextPos = new position_1.Position(ghostText.lineNumber, firstPart.column);
            const ghostTextVal = firstPart.text;
            const acceptUntilIndexExclusive = getAcceptUntilIndex(ghostTextPos, ghostTextVal);
            if (acceptUntilIndexExclusive === ghostTextVal.length && ghostText.parts.length === 1) {
                this.accept(editor);
                return;
            }
            const partialGhostTextVal = ghostTextVal.substring(0, acceptUntilIndexExclusive);
            const positions = this._positions.get();
            const cursorPosition = positions[0];
            // Executing the edit might free the completion, so we have to hold a reference on it.
            completion.source.addRef();
            try {
                this._isAcceptingPartially = true;
                try {
                    editor.pushUndoStop();
                    const replaceRange = range_1.Range.fromPositions(cursorPosition, ghostTextPos);
                    const newText = editor.getModel().getValueInRange(replaceRange) + partialGhostTextVal;
                    const primaryEdit = new textEdit_1.SingleTextEdit(replaceRange, newText);
                    const edits = [primaryEdit, ...getSecondaryEdits(this.textModel, positions, primaryEdit)];
                    const selections = getEndPositionsAfterApplying(edits).map(p => selection_1.Selection.fromPositions(p));
                    editor.executeEdits('inlineSuggestion.accept', edits.map(edit => editOperation_1.EditOperation.replaceMove(edit.range, edit.text)));
                    editor.setSelections(selections, 'inlineCompletionPartialAccept');
                }
                finally {
                    this._isAcceptingPartially = false;
                }
                if (completion.source.provider.handlePartialAccept) {
                    const acceptedRange = range_1.Range.fromPositions(completion.range.getStartPosition(), textLength_1.TextLength.ofText(partialGhostTextVal).addToPosition(ghostTextPos));
                    // This assumes that the inline completion and the model use the same EOL style.
                    const text = editor.getModel().getValueInRange(acceptedRange, 1 /* EndOfLinePreference.LF */);
                    completion.source.provider.handlePartialAccept(completion.source.inlineCompletions, completion.sourceInlineCompletion, text.length, {
                        kind,
                    });
                }
            }
            finally {
                completion.source.removeRef();
            }
        }
        handleSuggestAccepted(item) {
            const itemEdit = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(item.toSingleTextEdit(), this.textModel);
            const augmentedCompletion = this._computeAugmentation(itemEdit, undefined);
            if (!augmentedCompletion) {
                return;
            }
            const inlineCompletion = augmentedCompletion.completion.inlineCompletion;
            inlineCompletion.source.provider.handlePartialAccept?.(inlineCompletion.source.inlineCompletions, inlineCompletion.sourceInlineCompletion, itemEdit.text.length, {
                kind: 2 /* PartialAcceptTriggerKind.Suggest */,
            });
        }
    };
    exports.InlineCompletionsModel = InlineCompletionsModel;
    exports.InlineCompletionsModel = InlineCompletionsModel = __decorate([
        __param(9, instantiation_1.IInstantiationService),
        __param(10, commands_1.ICommandService),
        __param(11, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], InlineCompletionsModel);
    function getSecondaryEdits(textModel, positions, primaryEdit) {
        if (positions.length === 1) {
            // No secondary cursor positions
            return [];
        }
        const primaryPosition = positions[0];
        const secondaryPositions = positions.slice(1);
        const primaryEditStartPosition = primaryEdit.range.getStartPosition();
        const primaryEditEndPosition = primaryEdit.range.getEndPosition();
        const replacedTextAfterPrimaryCursor = textModel.getValueInRange(range_1.Range.fromPositions(primaryPosition, primaryEditEndPosition));
        const positionWithinTextEdit = (0, utils_1.subtractPositions)(primaryPosition, primaryEditStartPosition);
        if (positionWithinTextEdit.lineNumber < 1) {
            (0, errors_1.onUnexpectedError)(new errors_1.BugIndicatingError(`positionWithinTextEdit line number should be bigger than 0.
			Invalid subtraction between ${primaryPosition.toString()} and ${primaryEditStartPosition.toString()}`));
            return [];
        }
        const secondaryEditText = substringPos(primaryEdit.text, positionWithinTextEdit);
        return secondaryPositions.map(pos => {
            const posEnd = (0, utils_1.addPositions)((0, utils_1.subtractPositions)(pos, primaryEditStartPosition), primaryEditEndPosition);
            const textAfterSecondaryCursor = textModel.getValueInRange(range_1.Range.fromPositions(pos, posEnd));
            const l = (0, strings_1.commonPrefixLength)(replacedTextAfterPrimaryCursor, textAfterSecondaryCursor);
            const range = range_1.Range.fromPositions(pos, pos.delta(0, l));
            return new textEdit_1.SingleTextEdit(range, secondaryEditText);
        });
    }
    function substringPos(text, pos) {
        let subtext = '';
        const lines = (0, strings_1.splitLinesIncludeSeparators)(text);
        for (let i = pos.lineNumber - 1; i < lines.length; i++) {
            subtext += lines[i].substring(i === pos.lineNumber - 1 ? pos.column - 1 : 0);
        }
        return subtext;
    }
    function getEndPositionsAfterApplying(edits) {
        const sortPerm = arrays_1.Permutation.createSortPermutation(edits, (edit1, edit2) => range_1.Range.compareRangesUsingStarts(edit1.range, edit2.range));
        const edit = new textEdit_1.TextEdit(sortPerm.apply(edits));
        const sortedNewRanges = edit.getNewRanges();
        const newRanges = sortPerm.inverse().apply(sortedNewRanges);
        return newRanges.map(range => range.getEndPosition());
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaW5saW5lQ29tcGxldGlvbnMvYnJvd3Nlci9pbmxpbmVDb21wbGV0aW9uc01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZkaEcsOENBOEJDO0lBOWRELElBQVkscUJBS1g7SUFMRCxXQUFZLHFCQUFxQjtRQUNoQyxpRUFBSSxDQUFBO1FBQ0osaUVBQUksQ0FBQTtRQUNKLDZFQUFVLENBQUE7UUFDVixtRUFBSyxDQUFBO0lBQ04sQ0FBQyxFQUxXLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBS2hDO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQVVyRCxJQUFXLG9CQUFvQixLQUFLLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUV4RSxZQUNpQixTQUFxQixFQUNyQixtQkFBNkQsRUFDN0Qsa0JBQThELEVBQzdELFVBQTRDLEVBQzVDLGNBQTJDLEVBQzNDLHNCQUE0QyxFQUM1QyxtQkFBdUUsRUFDdkUsa0JBQXNFLEVBQ3RFLFFBQThCLEVBQ3hCLHFCQUE2RCxFQUNuRSxlQUFpRCxFQUNuQyw2QkFBNkU7WUFFNUcsS0FBSyxFQUFFLENBQUM7WUFiUSxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ3JCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBMEM7WUFDN0QsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE0QztZQUM3RCxlQUFVLEdBQVYsVUFBVSxDQUFrQztZQUM1QyxtQkFBYyxHQUFkLGNBQWMsQ0FBNkI7WUFDM0MsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFzQjtZQUM1Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9E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