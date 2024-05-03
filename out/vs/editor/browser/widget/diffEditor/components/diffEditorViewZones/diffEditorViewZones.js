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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/base/common/themables", "vs/base/common/types", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/widget/diffEditor/registrations.contribution", "vs/editor/browser/widget/diffEditor/diffEditorViewModel", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/inlineDiffDeletedCodeMargin", "vs/editor/browser/widget/diffEditor/components/diffEditorViewZones/renderLines", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/core/position", "vs/editor/common/viewModel", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextview/browser/contextView"], function (require, exports, dom_1, arrays_1, async_1, codicons_1, lifecycle_1, observable_1, themables_1, types_1, domFontInfo_1, registrations_contribution_1, diffEditorViewModel_1, inlineDiffDeletedCodeMargin_1, renderLines_1, utils_1, lineRange_1, position_1, viewModel_1, clipboardService_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorViewZones = void 0;
    /**
     * Ensures both editors have the same height by aligning unchanged lines.
     * In inline view mode, inserts viewzones to show deleted code from the original text model in the modified code editor.
     * Synchronizes scrolling.
     *
     * Make sure to add the view zones!
     */
    let DiffEditorViewZones = class DiffEditorViewZones extends lifecycle_1.Disposable {
        constructor(_targetWindow, _editors, _diffModel, _options, _diffEditorWidget, _canIgnoreViewZoneUpdateEvent, _origViewZonesToIgnore, _modViewZonesToIgnore, _clipboardService, _contextMenuService) {
            super();
            this._targetWindow = _targetWindow;
            this._editors = _editors;
            this._diffModel = _diffModel;
            this._options = _options;
            this._diffEditorWidget = _diffEditorWidget;
            this._canIgnoreViewZoneUpdateEvent = _canIgnoreViewZoneUpdateEvent;
            this._origViewZonesToIgnore = _origViewZonesToIgnore;
            this._modViewZonesToIgnore = _modViewZonesToIgnore;
            this._clipboardService = _clipboardService;
            this._contextMenuService = _contextMenuService;
            this._originalTopPadding = (0, observable_1.observableValue)(this, 0);
            this._originalScrollOffset = (0, observable_1.observableValue)(this, 0);
            this._originalScrollOffsetAnimated = (0, utils_1.animatedObservable)(this._targetWindow, this._originalScrollOffset, this._store);
            this._modifiedTopPadding = (0, observable_1.observableValue)(this, 0);
            this._modifiedScrollOffset = (0, observable_1.observableValue)(this, 0);
            this._modifiedScrollOffsetAnimated = (0, utils_1.animatedObservable)(this._targetWindow, this._modifiedScrollOffset, this._store);
            const state = (0, observable_1.observableValue)('invalidateAlignmentsState', 0);
            const updateImmediately = this._register(new async_1.RunOnceScheduler(() => {
                state.set(state.get() + 1, undefined);
            }, 0));
            this._register(this._editors.original.onDidChangeViewZones((_args) => { if (!this._canIgnoreViewZoneUpdateEvent()) {
                updateImmediately.schedule();
            } }));
            this._register(this._editors.modified.onDidChangeViewZones((_args) => { if (!this._canIgnoreViewZoneUpdateEvent()) {
                updateImmediately.schedule();
            } }));
            this._register(this._editors.original.onDidChangeConfiguration((args) => {
                if (args.hasChanged(146 /* EditorOption.wrappingInfo */) || args.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateImmediately.schedule();
                }
            }));
            this._register(this._editors.modified.onDidChangeConfiguration((args) => {
                if (args.hasChanged(146 /* EditorOption.wrappingInfo */) || args.hasChanged(67 /* EditorOption.lineHeight */)) {
                    updateImmediately.schedule();
                }
            }));
            const originalModelTokenizationCompleted = this._diffModel.map(m => m ? (0, observable_1.observableFromEvent)(m.model.original.onDidChangeTokens, () => m.model.original.tokenization.backgroundTokenizationState === 2 /* BackgroundTokenizationState.Completed */) : undefined).map((m, reader) => m?.read(reader));
            const alignments = (0, observable_1.derived)((reader) => {
                /** @description alignments */
                const diffModel = this._diffModel.read(reader);
                const diff = diffModel?.diff.read(reader);
                if (!diffModel || !diff) {
                    return null;
                }
                state.read(reader);
                const renderSideBySide = this._options.renderSideBySide.read(reader);
                const innerHunkAlignment = renderSideBySide;
                return computeRangeAlignment(this._editors.original, this._editors.modified, diff.mappings, this._origViewZonesToIgnore, this._modViewZonesToIgnore, innerHunkAlignment);
            });
            const alignmentsSyncedMovedText = (0, observable_1.derived)((reader) => {
                /** @description alignmentsSyncedMovedText */
                const syncedMovedText = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                if (!syncedMovedText) {
                    return null;
                }
                state.read(reader);
                const mappings = syncedMovedText.changes.map(c => new diffEditorViewModel_1.DiffMapping(c));
                // TODO dont include alignments outside syncedMovedText
                return computeRangeAlignment(this._editors.original, this._editors.modified, mappings, this._origViewZonesToIgnore, this._modViewZonesToIgnore, true);
            });
            function createFakeLinesDiv() {
                const r = document.createElement('div');
                r.className = 'diagonal-fill';
                return r;
            }
            const alignmentViewZonesDisposables = this._register(new lifecycle_1.DisposableStore());
            this.viewZones = (0, observable_1.derivedWithStore)(this, (reader, store) => {
                alignmentViewZonesDisposables.clear();
                const alignmentsVal = alignments.read(reader) || [];
                const origViewZones = [];
                const modViewZones = [];
                const modifiedTopPaddingVal = this._modifiedTopPadding.read(reader);
                if (modifiedTopPaddingVal > 0) {
                    modViewZones.push({
                        afterLineNumber: 0,
                        domNode: document.createElement('div'),
                        heightInPx: modifiedTopPaddingVal,
                        showInHiddenAreas: true,
                        suppressMouseDown: true,
                    });
                }
                const originalTopPaddingVal = this._originalTopPadding.read(reader);
                if (originalTopPaddingVal > 0) {
                    origViewZones.push({
                        afterLineNumber: 0,
                        domNode: document.createElement('div'),
                        heightInPx: originalTopPaddingVal,
                        showInHiddenAreas: true,
                        suppressMouseDown: true,
                    });
                }
                const renderSideBySide = this._options.renderSideBySide.read(reader);
                const deletedCodeLineBreaksComputer = !renderSideBySide ? this._editors.modified._getViewModel()?.createLineBreaksComputer() : undefined;
                if (deletedCodeLineBreaksComputer) {
                    const originalModel = this._editors.original.getModel();
                    for (const a of alignmentsVal) {
                        if (a.diff) {
                            for (let i = a.originalRange.startLineNumber; i < a.originalRange.endLineNumberExclusive; i++) {
                                // `i` can be out of bound when the diff has not been updated yet.
                                // In this case, we do an early return.
                                // TODO@hediet: Fix this by applying the edit directly to the diff model, so that the diff is always valid.
                                if (i > originalModel.getLineCount()) {
                                    return { orig: origViewZones, mod: modViewZones };
                                }
                                deletedCodeLineBreaksComputer?.addRequest(originalModel.getLineContent(i), null, null);
                            }
                        }
                    }
                }
                const lineBreakData = deletedCodeLineBreaksComputer?.finalize() ?? [];
                let lineBreakDataIdx = 0;
                const modLineHeight = this._editors.modified.getOption(67 /* EditorOption.lineHeight */);
                const syncedMovedText = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                const mightContainNonBasicASCII = this._editors.original.getModel()?.mightContainNonBasicASCII() ?? false;
                const mightContainRTL = this._editors.original.getModel()?.mightContainRTL() ?? false;
                const renderOptions = renderLines_1.RenderOptions.fromEditor(this._editors.modified);
                for (const a of alignmentsVal) {
                    if (a.diff && !renderSideBySide) {
                        if (!a.originalRange.isEmpty) {
                            originalModelTokenizationCompleted.read(reader); // Update view-zones once tokenization completes
                            const deletedCodeDomNode = document.createElement('div');
                            deletedCodeDomNode.classList.add('view-lines', 'line-delete', 'monaco-mouse-cursor-text');
                            const originalModel = this._editors.original.getModel();
                            // `a.originalRange` can be out of bound when the diff has not been updated yet.
                            // In this case, we do an early return.
                            // TODO@hediet: Fix this by applying the edit directly to the diff model, so that the diff is always valid.
                            if (a.originalRange.endLineNumberExclusive - 1 > originalModel.getLineCount()) {
                                return { orig: origViewZones, mod: modViewZones };
                            }
                            const source = new renderLines_1.LineSource(a.originalRange.mapToLineArray(l => originalModel.tokenization.getLineTokens(l)), a.originalRange.mapToLineArray(_ => lineBreakData[lineBreakDataIdx++]), mightContainNonBasicASCII, mightContainRTL);
                            const decorations = [];
                            for (const i of a.diff.innerChanges || []) {
                                decorations.push(new viewModel_1.InlineDecoration(i.originalRange.delta(-(a.diff.original.startLineNumber - 1)), registrations_contribution_1.diffDeleteDecoration.className, 0 /* InlineDecorationType.Regular */));
                            }
                            const result = (0, renderLines_1.renderLines)(source, renderOptions, decorations, deletedCodeDomNode);
                            const marginDomNode = document.createElement('div');
                            marginDomNode.className = 'inline-deleted-margin-view-zone';
                            (0, domFontInfo_1.applyFontInfo)(marginDomNode, renderOptions.fontInfo);
                            if (this._options.renderIndicators.read(reader)) {
                                for (let i = 0; i < result.heightInLines; i++) {
                                    const marginElement = document.createElement('div');
                                    marginElement.className = `delete-sign ${themables_1.ThemeIcon.asClassName(registrations_contribution_1.diffRemoveIcon)}`;
                                    marginElement.setAttribute('style', `position:absolute;top:${i * modLineHeight}px;width:${renderOptions.lineDecorationsWidth}px;height:${modLineHeight}px;right:0;`);
                                    marginDomNode.appendChild(marginElement);
                                }
                            }
                            let zoneId = undefined;
                            alignmentViewZonesDisposables.add(new inlineDiffDeletedCodeMargin_1.InlineDiffDeletedCodeMargin(() => (0, types_1.assertIsDefined)(zoneId), marginDomNode, this._editors.modified, a.diff, this._diffEditorWidget, result.viewLineCounts, this._editors.original.getModel(), this._contextMenuService, this._clipboardService));
                            for (let i = 0; i < result.viewLineCounts.length; i++) {
                                const count = result.viewLineCounts[i];
                                // Account for wrapped lines in the (collapsed) original editor (which doesn't wrap lines).
                                if (count > 1) {
                                    origViewZones.push({
                                        afterLineNumber: a.originalRange.startLineNumber + i,
                                        domNode: createFakeLinesDiv(),
                                        heightInPx: (count - 1) * modLineHeight,
                                        showInHiddenAreas: true,
                                        suppressMouseDown: true,
                                    });
                                }
                            }
                            modViewZones.push({
                                afterLineNumber: a.modifiedRange.startLineNumber - 1,
                                domNode: deletedCodeDomNode,
                                heightInPx: result.heightInLines * modLineHeight,
                                minWidthInPx: result.minWidthInPx,
                                marginDomNode,
                                setZoneId(id) { zoneId = id; },
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                        const marginDomNode = document.createElement('div');
                        marginDomNode.className = 'gutter-delete';
                        origViewZones.push({
                            afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: a.modifiedHeightInPx,
                            marginDomNode,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                    else {
                        const delta = a.modifiedHeightInPx - a.originalHeightInPx;
                        if (delta > 0) {
                            if (syncedMovedText?.lineRangeMapping.original.delta(-1).deltaLength(2).contains(a.originalRange.endLineNumberExclusive - 1)) {
                                continue;
                            }
                            origViewZones.push({
                                afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                                domNode: createFakeLinesDiv(),
                                heightInPx: delta,
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                        else {
                            if (syncedMovedText?.lineRangeMapping.modified.delta(-1).deltaLength(2).contains(a.modifiedRange.endLineNumberExclusive - 1)) {
                                continue;
                            }
                            function createViewZoneMarginArrow() {
                                const arrow = document.createElement('div');
                                arrow.className = 'arrow-revert-change ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.arrowRight);
                                store.add((0, dom_1.addDisposableListener)(arrow, 'mousedown', e => e.stopPropagation()));
                                store.add((0, dom_1.addDisposableListener)(arrow, 'click', e => {
                                    e.stopPropagation();
                                    _diffEditorWidget.revert(a.diff);
                                }));
                                return (0, dom_1.$)('div', {}, arrow);
                            }
                            let marginDomNode = undefined;
                            if (a.diff && a.diff.modified.isEmpty && this._options.shouldRenderOldRevertArrows.read(reader)) {
                                marginDomNode = createViewZoneMarginArrow();
                            }
                            modViewZones.push({
                                afterLineNumber: a.modifiedRange.endLineNumberExclusive - 1,
                                domNode: createFakeLinesDiv(),
                                heightInPx: -delta,
                                marginDomNode,
                                showInHiddenAreas: true,
                                suppressMouseDown: true,
                            });
                        }
                    }
                }
                for (const a of alignmentsSyncedMovedText.read(reader) ?? []) {
                    if (!syncedMovedText?.lineRangeMapping.original.intersect(a.originalRange)
                        || !syncedMovedText?.lineRangeMapping.modified.intersect(a.modifiedRange)) {
                        // ignore unrelated alignments outside the synced moved text
                        continue;
                    }
                    const delta = a.modifiedHeightInPx - a.originalHeightInPx;
                    if (delta > 0) {
                        origViewZones.push({
                            afterLineNumber: a.originalRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: delta,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                    else {
                        modViewZones.push({
                            afterLineNumber: a.modifiedRange.endLineNumberExclusive - 1,
                            domNode: createFakeLinesDiv(),
                            heightInPx: -delta,
                            showInHiddenAreas: true,
                            suppressMouseDown: true,
                        });
                    }
                }
                return { orig: origViewZones, mod: modViewZones };
            });
            let ignoreChange = false;
            this._register(this._editors.original.onDidScrollChange(e => {
                if (e.scrollLeftChanged && !ignoreChange) {
                    ignoreChange = true;
                    this._editors.modified.setScrollLeft(e.scrollLeft);
                    ignoreChange = false;
                }
            }));
            this._register(this._editors.modified.onDidScrollChange(e => {
                if (e.scrollLeftChanged && !ignoreChange) {
                    ignoreChange = true;
                    this._editors.original.setScrollLeft(e.scrollLeft);
                    ignoreChange = false;
                }
            }));
            this._originalScrollTop = (0, observable_1.observableFromEvent)(this._editors.original.onDidScrollChange, () => /** @description original.getScrollTop */ this._editors.original.getScrollTop());
            this._modifiedScrollTop = (0, observable_1.observableFromEvent)(this._editors.modified.onDidScrollChange, () => /** @description modified.getScrollTop */ this._editors.modified.getScrollTop());
            // origExtraHeight + origOffset - origScrollTop = modExtraHeight + modOffset - modScrollTop
            // origScrollTop = origExtraHeight + origOffset - modExtraHeight - modOffset + modScrollTop
            // modScrollTop = modExtraHeight + modOffset - origExtraHeight - origOffset + origScrollTop
            // origOffset - modOffset = heightOfLines(1..Y) - heightOfLines(1..X)
            // origScrollTop >= 0, modScrollTop >= 0
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll modified */
                const newScrollTopModified = this._originalScrollTop.read(reader)
                    - (this._originalScrollOffsetAnimated.get() - this._modifiedScrollOffsetAnimated.read(reader))
                    - (this._originalTopPadding.get() - this._modifiedTopPadding.read(reader));
                if (newScrollTopModified !== this._editors.modified.getScrollTop()) {
                    this._editors.modified.setScrollTop(newScrollTopModified, 1 /* ScrollType.Immediate */);
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update scroll original */
                const newScrollTopOriginal = this._modifiedScrollTop.read(reader)
                    - (this._modifiedScrollOffsetAnimated.get() - this._originalScrollOffsetAnimated.read(reader))
                    - (this._modifiedTopPadding.get() - this._originalTopPadding.read(reader));
                if (newScrollTopOriginal !== this._editors.original.getScrollTop()) {
                    this._editors.original.setScrollTop(newScrollTopOriginal, 1 /* ScrollType.Immediate */);
                }
            }));
            this._register((0, observable_1.autorun)(reader => {
                /** @description update editor top offsets */
                const m = this._diffModel.read(reader)?.movedTextToCompare.read(reader);
                let deltaOrigToMod = 0;
                if (m) {
                    const trueTopOriginal = this._editors.original.getTopForLineNumber(m.lineRangeMapping.original.startLineNumber, true) - this._originalTopPadding.get();
                    const trueTopModified = this._editors.modified.getTopForLineNumber(m.lineRangeMapping.modified.startLineNumber, true) - this._modifiedTopPadding.get();
                    deltaOrigToMod = trueTopModified - trueTopOriginal;
                }
                if (deltaOrigToMod > 0) {
                    this._modifiedTopPadding.set(0, undefined);
                    this._originalTopPadding.set(deltaOrigToMod, undefined);
                }
                else if (deltaOrigToMod < 0) {
                    this._modifiedTopPadding.set(-deltaOrigToMod, undefined);
                    this._originalTopPadding.set(0, undefined);
                }
                else {
                    setTimeout(() => {
                        this._modifiedTopPadding.set(0, undefined);
                        this._originalTopPadding.set(0, undefined);
                    }, 400);
                }
                if (this._editors.modified.hasTextFocus()) {
                    this._originalScrollOffset.set(this._modifiedScrollOffset.get() - deltaOrigToMod, undefined, true);
                }
                else {
                    this._modifiedScrollOffset.set(this._originalScrollOffset.get() + deltaOrigToMod, undefined, true);
                }
            }));
        }
    };
    exports.DiffEditorViewZones = DiffEditorViewZones;
    exports.DiffEditorViewZones = DiffEditorViewZones = __decorate([
        __param(8, clipboardService_1.IClipboardService),
        __param(9, contextView_1.IContextMenuService)
    ], DiffEditorViewZones);
    function computeRangeAlignment(originalEditor, modifiedEditor, diffs, originalEditorAlignmentViewZones, modifiedEditorAlignmentViewZones, innerHunkAlignment) {
        const originalLineHeightOverrides = new arrays_1.ArrayQueue(getAdditionalLineHeights(originalEditor, originalEditorAlignmentViewZones));
        const modifiedLineHeightOverrides = new arrays_1.ArrayQueue(getAdditionalLineHeights(modifiedEditor, modifiedEditorAlignmentViewZones));
        const origLineHeight = originalEditor.getOption(67 /* EditorOption.lineHeight */);
        const modLineHeight = modifiedEditor.getOption(67 /* EditorOption.lineHeight */);
        const result = [];
        let lastOriginalLineNumber = 0;
        let lastModifiedLineNumber = 0;
        function handleAlignmentsOutsideOfDiffs(untilOriginalLineNumberExclusive, untilModifiedLineNumberExclusive) {
            while (true) {
                let origNext = originalLineHeightOverrides.peek();
                let modNext = modifiedLineHeightOverrides.peek();
                if (origNext && origNext.lineNumber >= untilOriginalLineNumberExclusive) {
                    origNext = undefined;
                }
                if (modNext && modNext.lineNumber >= untilModifiedLineNumberExclusive) {
                    modNext = undefined;
                }
                if (!origNext && !modNext) {
                    break;
                }
                const distOrig = origNext ? origNext.lineNumber - lastOriginalLineNumber : Number.MAX_VALUE;
                const distNext = modNext ? modNext.lineNumber - lastModifiedLineNumber : Number.MAX_VALUE;
                if (distOrig < distNext) {
                    originalLineHeightOverrides.dequeue();
                    modNext = {
                        lineNumber: origNext.lineNumber - lastOriginalLineNumber + lastModifiedLineNumber,
                        heightInPx: 0,
                    };
                }
                else if (distOrig > distNext) {
                    modifiedLineHeightOverrides.dequeue();
                    origNext = {
                        lineNumber: modNext.lineNumber - lastModifiedLineNumber + lastOriginalLineNumber,
                        heightInPx: 0,
                    };
                }
                else {
                    originalLineHeightOverrides.dequeue();
                    modifiedLineHeightOverrides.dequeue();
                }
                result.push({
                    originalRange: lineRange_1.LineRange.ofLength(origNext.lineNumber, 1),
                    modifiedRange: lineRange_1.LineRange.ofLength(modNext.lineNumber, 1),
                    originalHeightInPx: origLineHeight + origNext.heightInPx,
                    modifiedHeightInPx: modLineHeight + modNext.heightInPx,
                    diff: undefined,
                });
            }
        }
        for (const m of diffs) {
            const c = m.lineRangeMapping;
            handleAlignmentsOutsideOfDiffs(c.original.startLineNumber, c.modified.startLineNumber);
            let first = true;
            let lastModLineNumber = c.modified.startLineNumber;
            let lastOrigLineNumber = c.original.startLineNumber;
            function emitAlignment(origLineNumberExclusive, modLineNumberExclusive) {
                if (origLineNumberExclusive < lastOrigLineNumber || modLineNumberExclusive < lastModLineNumber) {
                    return;
                }
                if (first) {
                    first = false;
                }
                else if (origLineNumberExclusive === lastOrigLineNumber || modLineNumberExclusive === lastModLineNumber) {
                    return;
                }
                const originalRange = new lineRange_1.LineRange(lastOrigLineNumber, origLineNumberExclusive);
                const modifiedRange = new lineRange_1.LineRange(lastModLineNumber, modLineNumberExclusive);
                if (originalRange.isEmpty && modifiedRange.isEmpty) {
                    return;
                }
                const originalAdditionalHeight = originalLineHeightOverrides
                    .takeWhile(v => v.lineNumber < origLineNumberExclusive)
                    ?.reduce((p, c) => p + c.heightInPx, 0) ?? 0;
                const modifiedAdditionalHeight = modifiedLineHeightOverrides
                    .takeWhile(v => v.lineNumber < modLineNumberExclusive)
                    ?.reduce((p, c) => p + c.heightInPx, 0) ?? 0;
                result.push({
                    originalRange,
                    modifiedRange,
                    originalHeightInPx: originalRange.length * origLineHeight + originalAdditionalHeight,
                    modifiedHeightInPx: modifiedRange.length * modLineHeight + modifiedAdditionalHeight,
                    diff: m.lineRangeMapping,
                });
                lastOrigLineNumber = origLineNumberExclusive;
                lastModLineNumber = modLineNumberExclusive;
            }
            if (innerHunkAlignment) {
                for (const i of c.innerChanges || []) {
                    if (i.originalRange.startColumn > 1 && i.modifiedRange.startColumn > 1) {
                        // There is some unmodified text on this line before the diff
                        emitAlignment(i.originalRange.startLineNumber, i.modifiedRange.startLineNumber);
                    }
                    const originalModel = originalEditor.getModel();
                    // When the diff is invalid, the ranges might be out of bounds (this should be fixed in the diff model by applying edits directly).
                    const maxColumn = i.originalRange.endLineNumber <= originalModel.getLineCount() ? originalModel.getLineMaxColumn(i.originalRange.endLineNumber) : Number.MAX_SAFE_INTEGER;
                    if (i.originalRange.endColumn < maxColumn) {
                        // // There is some unmodified text on this line after the diff
                        emitAlignment(i.originalRange.endLineNumber, i.modifiedRange.endLineNumber);
                    }
                }
            }
            emitAlignment(c.original.endLineNumberExclusive, c.modified.endLineNumberExclusive);
            lastOriginalLineNumber = c.original.endLineNumberExclusive;
            lastModifiedLineNumber = c.modified.endLineNumberExclusive;
        }
        handleAlignmentsOutsideOfDiffs(Number.MAX_VALUE, Number.MAX_VALUE);
        return result;
    }
    function getAdditionalLineHeights(editor, viewZonesToIgnore) {
        const viewZoneHeights = [];
        const wrappingZoneHeights = [];
        const hasWrapping = editor.getOption(146 /* EditorOption.wrappingInfo */).wrappingColumn !== -1;
        const coordinatesConverter = editor._getViewModel().coordinatesConverter;
        const editorLineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
        if (hasWrapping) {
            for (let i = 1; i <= editor.getModel().getLineCount(); i++) {
                const lineCount = coordinatesConverter.getModelLineViewLineCount(i);
                if (lineCount > 1) {
                    wrappingZoneHeights.push({ lineNumber: i, heightInPx: editorLineHeight * (lineCount - 1) });
                }
            }
        }
        for (const w of editor.getWhitespaces()) {
            if (viewZonesToIgnore.has(w.id)) {
                continue;
            }
            const modelLineNumber = w.afterLineNumber === 0 ? 0 : coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(w.afterLineNumber, 1)).lineNumber;
            viewZoneHeights.push({ lineNumber: modelLineNumber, heightInPx: w.height });
        }
        const result = (0, utils_1.joinCombine)(viewZoneHeights, wrappingZoneHeights, v => v.lineNumber, (v1, v2) => ({ lineNumber: v1.lineNumber, heightInPx: v1.heightInPx + v2.heightInPx }));
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclZpZXdab25lcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvY29tcG9uZW50cy9kaWZmRWRpdG9yVmlld1pvbmVzL2RpZmZFZGl0b3JWaWV3Wm9uZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJoRzs7Ozs7O09BTUc7SUFDSSxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBYWxELFlBQ2tCLGFBQXFCLEVBQ3JCLFFBQTJCLEVBQzNCLFVBQXdELEVBQ3hELFFBQTJCLEVBQzNCLGlCQUFtQyxFQUNuQyw2QkFBNEMsRUFDNUMsc0JBQW1DLEVBQ25DLHFCQUFrQyxFQUNoQyxpQkFBcUQsRUFDbkQsbUJBQXlEO1lBRTlFLEtBQUssRUFBRSxDQUFDO1lBWFMsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsZUFBVSxHQUFWLFVBQVUsQ0FBOEM7WUFDeEQsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFrQjtZQUNuQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWU7WUFDNUMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFhO1lBQ25DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBYTtZQUNmLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDbEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQXRCOUQsd0JBQW1CLEdBQUcsSUFBQSw0QkFBZSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUvQywwQkFBcUIsR0FBRyxJQUFBLDRCQUFlLEVBQWtCLElBQUksRUFBRSxDQUFDLENBQUMsQ0FB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