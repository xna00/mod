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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/stableEditorScroll", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines", "vs/editor/common/core/editOperation", "vs/editor/common/core/lineRange", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/editorWorker", "vs/editor/common/viewModel", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/contrib/chat/common/chatWordCounter", "vs/workbench/contrib/inlineChat/browser/inlineChatFileCreationWidget", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/base/common/types", "vs/editor/common/services/model", "./utils", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration"], function (require, exports, dom_1, arrays_1, event_1, lazy_1, lifecycle_1, themables_1, stableEditorScroll_1, renderLines_1, editOperation_1, lineRange_1, range_1, model_1, textModel_1, editorWorker_1, viewModel_1, nls_1, contextkey_1, instantiation_1, progress_1, chatWordCounter_1, inlineChatFileCreationWidget_1, inlineChatSession_1, inlineChat_1, types_1, model_2, utils_1, accessibility_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LiveStrategy = exports.PreviewStrategy = exports.EditModeStrategy = void 0;
    class EditModeStrategy {
        static { this._decoBlock = textModel_1.ModelDecorationOptions.register({
            description: 'inline-chat',
            showIfCollapsed: false,
            isWholeLine: true,
            className: 'inline-chat-block-selection',
        }); }
        constructor(_session, _editor, _zone) {
            this._session = _session;
            this._editor = _editor;
            this._zone = _zone;
            this._store = new lifecycle_1.DisposableStore();
            this._onDidAccept = this._store.add(new event_1.Emitter());
            this._onDidDiscard = this._store.add(new event_1.Emitter());
            this._editCount = 0;
            this.onDidAccept = this._onDidAccept.event;
            this.onDidDiscard = this._onDidDiscard.event;
        }
        dispose() {
            this._store.dispose();
        }
        cancel() {
            return this._session.hunkData.discardAll();
        }
        async acceptHunk() {
            this._onDidAccept.fire();
        }
        async discardHunk() {
            this._onDidDiscard.fire();
        }
        async _makeChanges(edits, obs, opts, progress) {
            // push undo stop before first edit
            if (++this._editCount === 1) {
                this._editor.pushUndoStop();
            }
            if (opts) {
                // ASYNC
                const durationInSec = opts.duration / 1000;
                for (const edit of edits) {
                    const wordCount = (0, chatWordCounter_1.countWords)(edit.text ?? '');
                    const speed = wordCount / durationInSec;
                    // console.log({ durationInSec, wordCount, speed: wordCount / durationInSec });
                    const asyncEdit = (0, utils_1.asProgressiveEdit)(new dom_1.WindowIntervalTimer(this._zone.domNode), edit, speed, opts.token);
                    await (0, utils_1.performAsyncTextEdit)(this._session.textModelN, asyncEdit, progress, obs);
                }
            }
            else {
                // SYNC
                obs.start();
                this._session.textModelN.pushEditOperations(null, edits, (undoEdits) => {
                    progress?.report(undoEdits);
                    return null;
                });
                obs.stop();
            }
        }
        getWholeRangeDecoration() {
            const ranges = [this._session.wholeRange.value];
            const newDecorations = ranges.map(range => range.isEmpty() ? undefined : ({ range, options: EditModeStrategy._decoBlock }));
            (0, arrays_1.coalesceInPlace)(newDecorations);
            return newDecorations;
        }
    }
    exports.EditModeStrategy = EditModeStrategy;
    let PreviewStrategy = class PreviewStrategy extends EditModeStrategy {
        constructor(session, editor, zone, modelService, contextKeyService, instaService) {
            super(session, editor, zone);
            this._ctxDocumentChanged = inlineChat_1.CTX_INLINE_CHAT_DOCUMENT_CHANGED.bindTo(contextKeyService);
            const baseModel = modelService.getModel(session.targetUri);
            event_1.Event.debounce(baseModel.onDidChangeContent.bind(baseModel), () => { }, 350)(_ => {
                if (!baseModel.isDisposed() && !session.textModel0.isDisposed()) {
                    this._ctxDocumentChanged.set(session.hasChangedText);
                }
            }, undefined, this._store);
            this._previewZone = new lazy_1.Lazy(() => instaService.createInstance(inlineChatFileCreationWidget_1.InlineChatFileCreatePreviewWidget, editor));
        }
        dispose() {
            this._ctxDocumentChanged.reset();
            this._previewZone.rawValue?.dispose();
            super.dispose();
        }
        async apply() {
            // (1) ensure the editor still shows the original text
            // (2) accept all pending hunks (moves changes from N to 0)
            // (3) replace editor model with textModel0
            const textModel = this._editor.getModel();
            if (textModel?.equalsTextBuffer(this._session.textModel0.getTextBuffer())) {
                this._session.hunkData.getInfo().forEach(item => item.acceptChanges());
                const newText = this._session.textModel0.getValue();
                const range = textModel.getFullModelRange();
                textModel.pushStackElement();
                textModel.pushEditOperations(null, [editOperation_1.EditOperation.replace(range, newText)], () => null);
                textModel.pushStackElement();
            }
            if (this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse) {
                const { untitledTextModel } = this._session.lastExchange.response;
                if (untitledTextModel && !untitledTextModel.isDisposed() && untitledTextModel.isDirty()) {
                    await untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ });
                }
            }
        }
        async makeChanges(edits, obs) {
            return this._makeChanges(edits, obs, undefined, undefined);
        }
        async makeProgressiveChanges(edits, obs, opts) {
            await this._makeChanges(edits, obs, opts, new progress_1.Progress(() => {
                this._zone.widget.showEditsPreview(this._session.hunkData, this._session.textModel0, this._session.textModelN);
            }));
        }
        async undoChanges(altVersionId) {
            const { textModelN } = this._session;
            await undoModelUntil(textModelN, altVersionId);
        }
        async renderChanges(response) {
            if (response.allLocalEdits.length > 0) {
                this._zone.widget.showEditsPreview(this._session.hunkData, this._session.textModel0, this._session.textModelN);
            }
            else {
                this._zone.widget.hideEditsPreview();
            }
            if (response.untitledTextModel && !response.untitledTextModel.isDisposed()) {
                this._previewZone.value.showCreation(this._session.wholeRange.value.getStartPosition().delta(-1), response.untitledTextModel);
            }
            else {
                this._previewZone.rawValue?.hide();
            }
        }
        hasFocus() {
            return this._zone.widget.hasFocus();
        }
    };
    exports.PreviewStrategy = PreviewStrategy;
    exports.PreviewStrategy = PreviewStrategy = __decorate([
        __param(3, model_2.IModelService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, instantiation_1.IInstantiationService)
    ], PreviewStrategy);
    let LiveStrategy = class LiveStrategy extends EditModeStrategy {
        constructor(session, editor, zone, contextKeyService, _editorWorkerService, _accessibilityService, _configService, _instaService) {
            super(session, editor, zone);
            this._editorWorkerService = _editorWorkerService;
            this._accessibilityService = _accessibilityService;
            this._configService = _configService;
            this._instaService = _instaService;
            this._decoInsertedText = textModel_1.ModelDecorationOptions.register({
                description: 'inline-modified-line',
                className: 'inline-chat-inserted-range-linehighlight',
                isWholeLine: true,
                overviewRuler: {
                    position: model_1.OverviewRulerLane.Full,
                    color: (0, themables_1.themeColorFromId)(inlineChat_1.overviewRulerInlineChatDiffInserted),
                }
            });
            this._decoInsertedTextRange = textModel_1.ModelDecorationOptions.register({
                description: 'inline-chat-inserted-range-linehighlight',
                className: 'inline-chat-inserted-range',
                stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            });
            this.acceptHunk = () => super.acceptHunk();
            this.discardHunk = () => super.discardHunk();
            this._hunkDisplayData = new Map();
            this._ctxCurrentChangeHasDiff = inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF.bindTo(contextKeyService);
            this._ctxCurrentChangeShowsDiff = inlineChat_1.CTX_INLINE_CHAT_CHANGE_SHOWS_DIFF.bindTo(contextKeyService);
            this._progressiveEditingDecorations = this._editor.createDecorationsCollection();
            this._previewZone = new lazy_1.Lazy(() => _instaService.createInstance(inlineChatFileCreationWidget_1.InlineChatFileCreatePreviewWidget, editor));
        }
        dispose() {
            this._resetDiff();
            this._previewZone.rawValue?.dispose();
            super.dispose();
        }
        _resetDiff() {
            this._ctxCurrentChangeHasDiff.reset();
            this._ctxCurrentChangeShowsDiff.reset();
            this._zone.widget.updateStatus('');
            this._progressiveEditingDecorations.clear();
            for (const data of this._hunkDisplayData.values()) {
                data.remove();
            }
        }
        async apply() {
            this._resetDiff();
            if (this._editCount > 0) {
                this._editor.pushUndoStop();
            }
            if (!(this._session.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse)) {
                return;
            }
            const { untitledTextModel } = this._session.lastExchange.response;
            if (untitledTextModel && !untitledTextModel.isDisposed() && untitledTextModel.isDirty()) {
                await untitledTextModel.save({ reason: 1 /* SaveReason.EXPLICIT */ });
            }
        }
        cancel() {
            this._resetDiff();
            return super.cancel();
        }
        async undoChanges(altVersionId) {
            const { textModelN } = this._session;
            await undoModelUntil(textModelN, altVersionId);
        }
        async makeChanges(edits, obs) {
            return this._makeChanges(edits, obs, undefined, undefined);
        }
        async makeProgressiveChanges(edits, obs, opts) {
            // add decorations once per line that got edited
            const progress = new progress_1.Progress(edits => {
                const newLines = new Set();
                for (const edit of edits) {
                    lineRange_1.LineRange.fromRange(edit.range).forEach(line => newLines.add(line));
                }
                const existingRanges = this._progressiveEditingDecorations.getRanges().map(lineRange_1.LineRange.fromRange);
                for (const existingRange of existingRanges) {
                    existingRange.forEach(line => newLines.delete(line));
                }
                const newDecorations = [];
                for (const line of newLines) {
                    newDecorations.push({ range: new range_1.Range(line, 1, line, Number.MAX_VALUE), options: this._decoInsertedText });
                }
                this._progressiveEditingDecorations.append(newDecorations);
            });
            return this._makeChanges(edits, obs, opts, progress);
        }
        async renderChanges(response) {
            if (response.untitledTextModel && !response.untitledTextModel.isDisposed()) {
                this._previewZone.value.showCreation(this._session.wholeRange.value.getStartPosition().delta(-1), response.untitledTextModel);
            }
            else {
                this._previewZone.rawValue?.hide();
            }
            this._progressiveEditingDecorations.clear();
            const renderHunks = () => {
                let widgetData;
                changeDecorationsAndViewZones(this._editor, (decorationsAccessor, viewZoneAccessor) => {
                    const keysNow = new Set(this._hunkDisplayData.keys());
                    widgetData = undefined;
                    for (const hunkData of this._session.hunkData.getInfo()) {
                        keysNow.delete(hunkData);
                        const hunkRanges = hunkData.getRangesN();
                        let data = this._hunkDisplayData.get(hunkData);
                        if (!data) {
                            // first time -> create decoration
                            const decorationIds = [];
                            for (let i = 0; i < hunkRanges.length; i++) {
                                decorationIds.push(decorationsAccessor.addDecoration(hunkRanges[i], i === 0
                                    ? this._decoInsertedText
                                    : this._decoInsertedTextRange));
                            }
                            const acceptHunk = () => {
                                hunkData.acceptChanges();
                                renderHunks();
                            };
                            const discardHunk = () => {
                                hunkData.discardChanges();
                                renderHunks();
                            };
                            // original view zone
                            const mightContainNonBasicASCII = this._session.textModel0.mightContainNonBasicASCII();
                            const mightContainRTL = this._session.textModel0.mightContainRTL();
                            const renderOptions = renderLines_1.RenderOptions.fromEditor(this._editor);
                            const originalRange = hunkData.getRanges0()[0];
                            const source = new renderLines_1.LineSource(lineRange_1.LineRange.fromRangeInclusive(originalRange).mapToLineArray(l => this._session.textModel0.tokenization.getLineTokens(l)), [], mightContainNonBasicASCII, mightContainRTL);
                            const domNode = document.createElement('div');
                            domNode.className = 'inline-chat-original-zone2';
                            const result = (0, renderLines_1.renderLines)(source, renderOptions, [new viewModel_1.InlineDecoration(new range_1.Range(originalRange.startLineNumber, 1, originalRange.startLineNumber, 1), '', 0 /* InlineDecorationType.Regular */)], domNode);
                            const viewZoneData = {
                                afterLineNumber: -1,
                                heightInLines: result.heightInLines,
                                domNode,
                            };
                            const toggleDiff = () => {
                                const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(this._editor);
                                changeDecorationsAndViewZones(this._editor, (_decorationsAccessor, viewZoneAccessor) => {
                                    (0, types_1.assertType)(data);
                                    if (!data.viewZoneId) {
                                        const [hunkRange] = hunkData.getRangesN();
                                        viewZoneData.afterLineNumber = hunkRange.startLineNumber - 1;
                                        data.viewZoneId = viewZoneAccessor.addZone(viewZoneData);
                                    }
                                    else {
                                        viewZoneAccessor.removeZone(data.viewZoneId);
                                        data.viewZoneId = undefined;
                                    }
                                });
                                this._ctxCurrentChangeShowsDiff.set(typeof data?.viewZoneId === 'string');
                                scrollState.restore(this._editor);
                            };
                            const remove = () => {
                                changeDecorationsAndViewZones(this._editor, (decorationsAccessor, viewZoneAccessor) => {
                                    (0, types_1.assertType)(data);
                                    for (const decorationId of data.decorationIds) {
                                        decorationsAccessor.removeDecoration(decorationId);
                                    }
                                    if (data.viewZoneId) {
                                        viewZoneAccessor.removeZone(data.viewZoneId);
                                    }
                                    data.decorationIds = [];
                                    data.viewZoneId = undefined;
                                });
                            };
                            const move = (next) => {
                                (0, types_1.assertType)(widgetData);
                                const candidates = [];
                                for (const item of this._session.hunkData.getInfo()) {
                                    if (item.getState() === 0 /* HunkState.Pending */) {
                                        candidates.push(item.getRangesN()[0].getStartPosition().delta(-1));
                                    }
                                }
                                if (candidates.length < 2) {
                                    return;
                                }
                                for (let i = 0; i < candidates.length; i++) {
                                    if (candidates[i].equals(widgetData.position)) {
                                        let newPos;
                                        if (next) {
                                            newPos = candidates[(i + 1) % candidates.length];
                                        }
                                        else {
                                            newPos = candidates[(i + candidates.length - 1) % candidates.length];
                                        }
                                        this._zone.updatePositionAndHeight(newPos);
                                        renderHunks();
                                        break;
                                    }
                                }
                            };
                            const zoneLineNumber = this._zone.position.lineNumber;
                            const myDistance = zoneLineNumber <= hunkRanges[0].startLineNumber
                                ? hunkRanges[0].startLineNumber - zoneLineNumber
                                : zoneLineNumber - hunkRanges[0].endLineNumber;
                            data = {
                                hunk: hunkData,
                                decorationIds,
                                viewZoneId: '',
                                viewZone: viewZoneData,
                                distance: myDistance,
                                position: hunkRanges[0].getStartPosition().delta(-1),
                                acceptHunk,
                                discardHunk,
                                toggleDiff: !hunkData.isInsertion() ? toggleDiff : undefined,
                                remove,
                                move,
                            };
                            this._hunkDisplayData.set(hunkData, data);
                        }
                        else if (hunkData.getState() !== 0 /* HunkState.Pending */) {
                            data.remove();
                        }
                        else {
                            // update distance and position based on modifiedRange-decoration
                            const zoneLineNumber = this._zone.position.lineNumber;
                            const modifiedRangeNow = hunkRanges[0];
                            data.position = modifiedRangeNow.getStartPosition().delta(-1);
                            data.distance = zoneLineNumber <= modifiedRangeNow.startLineNumber
                                ? modifiedRangeNow.startLineNumber - zoneLineNumber
                                : zoneLineNumber - modifiedRangeNow.endLineNumber;
                        }
                        if (hunkData.getState() === 0 /* HunkState.Pending */ && (!widgetData || data.distance < widgetData.distance)) {
                            widgetData = data;
                        }
                    }
                    for (const key of keysNow) {
                        const data = this._hunkDisplayData.get(key);
                        if (data) {
                            this._hunkDisplayData.delete(key);
                            data.remove();
                        }
                    }
                });
                if (widgetData) {
                    this._zone.updatePositionAndHeight(widgetData.position);
                    this._editor.revealPositionInCenterIfOutsideViewport(widgetData.position);
                    const remainingHunks = this._session.hunkData.pending;
                    this._updateSummaryMessage(remainingHunks, this._session.hunkData.size);
                    const mode = this._configService.getValue("inlineChat.accessibleDiffView" /* InlineChatConfigKeys.AccessibleDiffView */);
                    if (mode === 'on' || mode === 'auto' && this._accessibilityService.isScreenReaderOptimized()) {
                        this._zone.widget.showAccessibleHunk(this._session, widgetData.hunk);
                    }
                    this._ctxCurrentChangeHasDiff.set(Boolean(widgetData.toggleDiff));
                    this.toggleDiff = widgetData.toggleDiff;
                    this.acceptHunk = async () => widgetData.acceptHunk();
                    this.discardHunk = async () => widgetData.discardHunk();
                    this.move = next => widgetData.move(next);
                }
                else if (this._hunkDisplayData.size > 0) {
                    // everything accepted or rejected
                    let oneAccepted = false;
                    for (const hunkData of this._session.hunkData.getInfo()) {
                        if (hunkData.getState() === 1 /* HunkState.Accepted */) {
                            oneAccepted = true;
                            break;
                        }
                    }
                    if (oneAccepted) {
                        this._onDidAccept.fire();
                    }
                    else {
                        this._onDidDiscard.fire();
                    }
                }
                return widgetData;
            };
            return renderHunks()?.position;
        }
        _updateSummaryMessage(remaining, total) {
            const needsReview = this._configService.getValue("inlineChat.acceptedOrDiscardBeforeSave" /* InlineChatConfigKeys.AcceptedOrDiscardBeforeSave */);
            let message;
            if (total === 0) {
                message = (0, nls_1.localize)('change.0', "Nothing changed.");
            }
            else if (remaining === 1) {
                message = needsReview
                    ? (0, nls_1.localize)('review.1', "$(info) Accept or Discard 1 change.")
                    : (0, nls_1.localize)('change.1', "1 change");
            }
            else {
                message = needsReview
                    ? (0, nls_1.localize)('review.N', "$(info) Accept or Discard {0} changes.", remaining)
                    : (0, nls_1.localize)('change.N', "{0} changes", total);
            }
            let title;
            if (needsReview) {
                title = (0, nls_1.localize)('review', "Review (accept or discard) all changes before continuing.");
            }
            this._zone.widget.updateStatus(message, { title });
        }
        hasFocus() {
            return this._zone.widget.hasFocus();
        }
        getWholeRangeDecoration() {
            // don't render the blue in live mode
            return [];
        }
    };
    exports.LiveStrategy = LiveStrategy;
    exports.LiveStrategy = LiveStrategy = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, accessibility_1.IAccessibilityService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService)
    ], LiveStrategy);
    async function undoModelUntil(model, targetAltVersion) {
        while (targetAltVersion < model.getAlternativeVersionId() && model.canUndo()) {
            await model.undo();
        }
    }
    function changeDecorationsAndViewZones(editor, callback) {
        editor.changeDecorations(decorationsAccessor => {
            editor.changeViewZones(viewZoneAccessor => {
                callback(decorationsAccessor, viewZoneAccessor);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFN0cmF0ZWdpZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0U3RyYXRlZ2llcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQ2hHLE1BQXNCLGdCQUFnQjtpQkFFcEIsZUFBVSxHQUFHLGtDQUFzQixDQUFDLFFBQVEsQ0FBQztZQUM3RCxXQUFXLEVBQUUsYUFBYTtZQUMxQixlQUFlLEVBQUUsS0FBSztZQUN0QixXQUFXLEVBQUUsSUFBSTtZQUNqQixTQUFTLEVBQUUsNkJBQTZCO1NBQ3hDLENBQUMsQUFMeUIsQ0FLeEI7UUFhSCxZQUNvQixRQUFpQixFQUNqQixPQUFvQixFQUNwQixLQUEyQjtZQUYzQixhQUFRLEdBQVIsUUFBUSxDQUFTO1lBQ2pCLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDcEIsVUFBSyxHQUFMLEtBQUssQ0FBc0I7WUFkNUIsV0FBTSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQy9CLGlCQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3BELGtCQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBRTlELGVBQVUsR0FBVyxDQUFDLENBQUM7WUFFeEIsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDbkQsaUJBQVksR0FBZ0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7UUFRMUQsQ0FBQztRQUVMLE9BQU87WUFDTixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FB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