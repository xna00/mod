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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/diffProviderFactoryService", "vs/editor/browser/widget/diffEditor/utils", "vs/editor/common/core/lineRange", "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer", "vs/editor/common/diff/rangeMapping", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/combineTextEditInfos", "vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations", "vs/base/common/types", "vs/base/common/arrays", "vs/base/common/assert"], function (require, exports, async_1, cancellation_1, lifecycle_1, observable_1, diffProviderFactoryService_1, utils_1, lineRange_1, defaultLinesDiffComputer_1, rangeMapping_1, beforeEditPositionMapper_1, combineTextEditInfos_1, heuristicSequenceOptimizations_1, types_1, arrays_1, assert_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RevealPreference = exports.UnchangedRegion = exports.DiffMapping = exports.DiffState = exports.DiffEditorViewModel = void 0;
    let DiffEditorViewModel = class DiffEditorViewModel extends lifecycle_1.Disposable {
        setActiveMovedText(movedText) {
            this._activeMovedText.set(movedText, undefined);
        }
        setHoveredMovedText(movedText) {
            this._hoveredMovedText.set(movedText, undefined);
        }
        constructor(model, _options, _diffProviderFactoryService) {
            super();
            this.model = model;
            this._options = _options;
            this._diffProviderFactoryService = _diffProviderFactoryService;
            this._isDiffUpToDate = (0, observable_1.observableValue)(this, false);
            this.isDiffUpToDate = this._isDiffUpToDate;
            this._diff = (0, observable_1.observableValue)(this, undefined);
            this.diff = this._diff;
            this._unchangedRegions = (0, observable_1.observableValue)(this, undefined);
            this.unchangedRegions = (0, observable_1.derived)(this, r => {
                if (this._options.hideUnchangedRegions.read(r)) {
                    return this._unchangedRegions.read(r)?.regions ?? [];
                }
                else {
                    // Reset state
                    (0, observable_1.transaction)(tx => {
                        for (const r of this._unchangedRegions.get()?.regions || []) {
                            r.collapseAll(tx);
                        }
                    });
                    return [];
                }
            });
            this.movedTextToCompare = (0, observable_1.observableValue)(this, undefined);
            this._activeMovedText = (0, observable_1.observableValue)(this, undefined);
            this._hoveredMovedText = (0, observable_1.observableValue)(this, undefined);
            this.activeMovedText = (0, observable_1.derived)(this, r => this.movedTextToCompare.read(r) ?? this._hoveredMovedText.read(r) ?? this._activeMovedText.read(r));
            this._cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._diffProvider = (0, observable_1.derived)(this, reader => {
                const diffProvider = this._diffProviderFactoryService.createDiffProvider({
                    diffAlgorithm: this._options.diffAlgorithm.read(reader)
                });
                const onChangeSignal = (0, observable_1.observableSignalFromEvent)('onDidChange', diffProvider.onDidChange);
                return {
                    diffProvider,
                    onChangeSignal,
                };
            });
            this._register((0, lifecycle_1.toDisposable)(() => this._cancellationTokenSource.cancel()));
            const contentChangedSignal = (0, observable_1.observableSignal)('contentChangedSignal');
            const debouncer = this._register(new async_1.RunOnceScheduler(() => contentChangedSignal.trigger(undefined), 200));
            this._register((0, observable_1.autorun)(reader => {
                /** @description collapse touching unchanged ranges */
                const lastUnchangedRegions = this._unchangedRegions.read(reader);
                if (!lastUnchangedRegions || lastUnchangedRegions.regions.some(r => r.isDragged.read(reader))) {
                    return;
                }
                const lastUnchangedRegionsOrigRanges = lastUnchangedRegions.originalDecorationIds
                    .map(id => model.original.getDecorationRange(id))
                    .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                const lastUnchangedRegionsModRanges = lastUnchangedRegions.modifiedDecorationIds
                    .map(id => model.modified.getDecorationRange(id))
                    .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                const updatedLastUnchangedRegions = lastUnchangedRegions.regions.map((r, idx) => (!lastUnchangedRegionsOrigRanges[idx] || !lastUnchangedRegionsModRanges[idx]) ? undefined :
                    new UnchangedRegion(lastUnchangedRegionsOrigRanges[idx].startLineNumber, lastUnchangedRegionsModRanges[idx].startLineNumber, lastUnchangedRegionsOrigRanges[idx].length, r.visibleLineCountTop.read(reader), r.visibleLineCountBottom.read(reader))).filter(types_1.isDefined);
                const newRanges = [];
                let didChange = false;
                for (const touching of (0, arrays_1.groupAdjacentBy)(updatedLastUnchangedRegions, (a, b) => a.getHiddenModifiedRange(reader).endLineNumberExclusive === b.getHiddenModifiedRange(reader).startLineNumber)) {
                    if (touching.length > 1) {
                        didChange = true;
                        const sumLineCount = touching.reduce((sum, r) => sum + r.lineCount, 0);
                        const r = new UnchangedRegion(touching[0].originalLineNumber, touching[0].modifiedLineNumber, sumLineCount, touching[0].visibleLineCountTop.get(), touching[touching.length - 1].visibleLineCountBottom.get());
                        newRanges.push(r);
                    }
                    else {
                        newRanges.push(touching[0]);
                    }
                }
                if (didChange) {
                    const originalDecorationIds = model.original.deltaDecorations(lastUnchangedRegions.originalDecorationIds, newRanges.map(r => ({ range: r.originalUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                    const modifiedDecorationIds = model.modified.deltaDecorations(lastUnchangedRegions.modifiedDecorationIds, newRanges.map(r => ({ range: r.modifiedUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                    (0, observable_1.transaction)(tx => {
                        this._unchangedRegions.set({
                            regions: newRanges,
                            originalDecorationIds,
                            modifiedDecorationIds
                        }, tx);
                    });
                }
            }));
            const updateUnchangedRegions = (result, tx, reader) => {
                const newUnchangedRegions = UnchangedRegion.fromDiffs(result.changes, model.original.getLineCount(), model.modified.getLineCount(), this._options.hideUnchangedRegionsMinimumLineCount.read(reader), this._options.hideUnchangedRegionsContextLineCount.read(reader));
                // Transfer state from cur state
                let visibleRegions = undefined;
                const lastUnchangedRegions = this._unchangedRegions.get();
                if (lastUnchangedRegions) {
                    const lastUnchangedRegionsOrigRanges = lastUnchangedRegions.originalDecorationIds
                        .map(id => model.original.getDecorationRange(id))
                        .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                    const lastUnchangedRegionsModRanges = lastUnchangedRegions.modifiedDecorationIds
                        .map(id => model.modified.getDecorationRange(id))
                        .map(r => r ? lineRange_1.LineRange.fromRangeInclusive(r) : undefined);
                    const updatedLastUnchangedRegions = (0, utils_1.filterWithPrevious)(lastUnchangedRegions.regions
                        .map((r, idx) => {
                        if (!lastUnchangedRegionsOrigRanges[idx] || !lastUnchangedRegionsModRanges[idx]) {
                            return undefined;
                        }
                        const length = lastUnchangedRegionsOrigRanges[idx].length;
                        return new UnchangedRegion(lastUnchangedRegionsOrigRanges[idx].startLineNumber, lastUnchangedRegionsModRanges[idx].startLineNumber, length, 
                        // The visible area can shrink by edits -> we have to account for this
                        Math.min(r.visibleLineCountTop.get(), length), Math.min(r.visibleLineCountBottom.get(), length - r.visibleLineCountTop.get()));
                    }).filter(types_1.isDefined), (cur, prev) => !prev || (cur.modifiedLineNumber >= prev.modifiedLineNumber + prev.lineCount && cur.originalLineNumber >= prev.originalLineNumber + prev.lineCount));
                    let hiddenRegions = updatedLastUnchangedRegions.map(r => new rangeMapping_1.LineRangeMapping(r.getHiddenOriginalRange(reader), r.getHiddenModifiedRange(reader)));
                    hiddenRegions = rangeMapping_1.LineRangeMapping.clip(hiddenRegions, lineRange_1.LineRange.ofLength(1, model.original.getLineCount()), lineRange_1.LineRange.ofLength(1, model.modified.getLineCount()));
                    visibleRegions = rangeMapping_1.LineRangeMapping.inverse(hiddenRegions, model.original.getLineCount(), model.modified.getLineCount());
                }
                const newUnchangedRegions2 = [];
                if (visibleRegions) {
                    for (const r of newUnchangedRegions) {
                        const intersecting = visibleRegions.filter(f => f.original.intersectsStrict(r.originalUnchangedRange) && f.modified.intersectsStrict(r.modifiedUnchangedRange));
                        newUnchangedRegions2.push(...r.setVisibleRanges(intersecting, tx));
                    }
                }
                else {
                    newUnchangedRegions2.push(...newUnchangedRegions);
                }
                const originalDecorationIds = model.original.deltaDecorations(lastUnchangedRegions?.originalDecorationIds || [], newUnchangedRegions2.map(r => ({ range: r.originalUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                const modifiedDecorationIds = model.modified.deltaDecorations(lastUnchangedRegions?.modifiedDecorationIds || [], newUnchangedRegions2.map(r => ({ range: r.modifiedUnchangedRange.toInclusiveRange(), options: { description: 'unchanged' } })));
                this._unchangedRegions.set({
                    regions: newUnchangedRegions2,
                    originalDecorationIds,
                    modifiedDecorationIds
                }, tx);
            };
            this._register(model.modified.onDidChangeContent((e) => {
                const diff = this._diff.get();
                if (diff) {
                    const textEdits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    const result = applyModifiedEdits(this._lastDiff, textEdits, model.original, model.modified);
                    if (result) {
                        this._lastDiff = result;
                        (0, observable_1.transaction)(tx => {
                            this._diff.set(DiffState.fromDiffResult(this._lastDiff), tx);
                            updateUnchangedRegions(result, tx);
                            const currentSyncedMovedText = this.movedTextToCompare.get();
                            this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                        });
                    }
                }
                this._isDiffUpToDate.set(false, undefined);
                debouncer.schedule();
            }));
            this._register(model.original.onDidChangeContent((e) => {
                const diff = this._diff.get();
                if (diff) {
                    const textEdits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    const result = applyOriginalEdits(this._lastDiff, textEdits, model.original, model.modified);
                    if (result) {
                        this._lastDiff = result;
                        (0, observable_1.transaction)(tx => {
                            this._diff.set(DiffState.fromDiffResult(this._lastDiff), tx);
                            updateUnchangedRegions(result, tx);
                            const currentSyncedMovedText = this.movedTextToCompare.get();
                            this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                        });
                    }
                }
                this._isDiffUpToDate.set(false, undefined);
                debouncer.schedule();
            }));
            this._register((0, observable_1.autorunWithStore)(async (reader, store) => {
                /** @description compute diff */
                // So that they get recomputed when these settings change
                this._options.hideUnchangedRegionsMinimumLineCount.read(reader);
                this._options.hideUnchangedRegionsContextLineCount.read(reader);
                debouncer.cancel();
                contentChangedSignal.read(reader);
                const documentDiffProvider = this._diffProvider.read(reader);
                documentDiffProvider.onChangeSignal.read(reader);
                (0, utils_1.readHotReloadableExport)(defaultLinesDiffComputer_1.DefaultLinesDiffComputer, reader);
                (0, utils_1.readHotReloadableExport)(heuristicSequenceOptimizations_1.optimizeSequenceDiffs, reader);
                this._isDiffUpToDate.set(false, undefined);
                let originalTextEditInfos = [];
                store.add(model.original.onDidChangeContent((e) => {
                    const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    originalTextEditInfos = (0, combineTextEditInfos_1.combineTextEditInfos)(originalTextEditInfos, edits);
                }));
                let modifiedTextEditInfos = [];
                store.add(model.modified.onDidChangeContent((e) => {
                    const edits = beforeEditPositionMapper_1.TextEditInfo.fromModelContentChanges(e.changes);
                    modifiedTextEditInfos = (0, combineTextEditInfos_1.combineTextEditInfos)(modifiedTextEditInfos, edits);
                }));
                let result = await documentDiffProvider.diffProvider.computeDiff(model.original, model.modified, {
                    ignoreTrimWhitespace: this._options.ignoreTrimWhitespace.read(reader),
                    maxComputationTimeMs: this._options.maxComputationTimeMs.read(reader),
                    computeMoves: this._options.showMoves.read(reader),
                }, this._cancellationTokenSource.token);
                if (this._cancellationTokenSource.token.isCancellationRequested) {
                    return;
                }
                result = normalizeDocumentDiff(result, model.original, model.modified);
                result = applyOriginalEdits(result, originalTextEditInfos, model.original, model.modified) ?? result;
                result = applyModifiedEdits(result, modifiedTextEditInfos, model.original, model.modified) ?? result;
                (0, observable_1.transaction)(tx => {
                    /** @description write diff result */
                    updateUnchangedRegions(result, tx);
                    this._lastDiff = result;
                    const state = DiffState.fromDiffResult(result);
                    this._diff.set(state, tx);
                    this._isDiffUpToDate.set(true, tx);
                    const currentSyncedMovedText = this.movedTextToCompare.get();
                    this.movedTextToCompare.set(currentSyncedMovedText ? this._lastDiff.moves.find(m => m.lineRangeMapping.modified.intersect(currentSyncedMovedText.lineRangeMapping.modified)) : undefined, tx);
                });
            }));
        }
        ensureModifiedLineIsVisible(lineNumber, preference, tx) {
            if (this.diff.get()?.mappings.length === 0) {
                return;
            }
            const unchangedRegions = this._unchangedRegions.get()?.regions || [];
            for (const r of unchangedRegions) {
                if (r.getHiddenModifiedRange(undefined).contains(lineNumber)) {
                    r.showModifiedLine(lineNumber, preference, tx);
                    return;
                }
            }
        }
        ensureOriginalLineIsVisible(lineNumber, preference, tx) {
            if (this.diff.get()?.mappings.length === 0) {
                return;
            }
            const unchangedRegions = this._unchangedRegions.get()?.regions || [];
            for (const r of unchangedRegions) {
                if (r.getHiddenOriginalRange(undefined).contains(lineNumber)) {
                    r.showOriginalLine(lineNumber, preference, tx);
                    return;
                }
            }
        }
        async waitForDiff() {
            await (0, observable_1.waitForState)(this.isDiffUpToDate, s => s);
        }
        serializeState() {
            const regions = this._unchangedRegions.get();
            return {
                collapsedRegions: regions?.regions.map(r => ({ range: r.getHiddenModifiedRange(undefined).serialize() }))
            };
        }
        restoreSerializedState(state) {
            const ranges = state.collapsedRegions?.map(r => lineRange_1.LineRange.deserialize(r.range));
            const regions = this._unchangedRegions.get();
            if (!regions || !ranges) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                for (const r of regions.regions) {
                    for (const range of ranges) {
                        if (r.modifiedUnchangedRange.intersect(range)) {
                            r.setHiddenModifiedRange(range, tx);
                            break;
                        }
                    }
                }
            });
        }
    };
    exports.DiffEditorViewModel = DiffEditorViewModel;
    exports.DiffEditorViewModel = DiffEditorViewModel = __decorate([
        __param(2, diffProviderFactoryService_1.IDiffProviderFactoryService)
    ], DiffEditorViewModel);
    function normalizeDocumentDiff(diff, original, modified) {
        return {
            changes: diff.changes.map(c => new rangeMapping_1.DetailedLineRangeMapping(c.original, c.modified, c.innerChanges ? c.innerChanges.map(i => normalizeRangeMapping(i, original, modified)) : undefined)),
            moves: diff.moves,
            identical: diff.identical,
            quitEarly: diff.quitEarly,
        };
    }
    function normalizeRangeMapping(rangeMapping, original, modified) {
        let originalRange = rangeMapping.originalRange;
        let modifiedRange = rangeMapping.modifiedRange;
        if ((originalRange.endColumn !== 1 || modifiedRange.endColumn !== 1) &&
            originalRange.endColumn === original.getLineMaxColumn(originalRange.endLineNumber)
            && modifiedRange.endColumn === modified.getLineMaxColumn(modifiedRange.endLineNumber)
            && originalRange.endLineNumber < original.getLineCount()
            && modifiedRange.endLineNumber < modified.getLineCount()) {
            originalRange = originalRange.setEndPosition(originalRange.endLineNumber + 1, 1);
            modifiedRange = modifiedRange.setEndPosition(modifiedRange.endLineNumber + 1, 1);
        }
        return new rangeMapping_1.RangeMapping(originalRange, modifiedRange);
    }
    class DiffState {
        static fromDiffResult(result) {
            return new DiffState(result.changes.map(c => new DiffMapping(c)), result.moves || [], result.identical, result.quitEarly);
        }
        constructor(mappings, movedTexts, identical, quitEarly) {
            this.mappings = mappings;
            this.movedTexts = movedTexts;
            this.identical = identical;
            this.quitEarly = quitEarly;
        }
    }
    exports.DiffState = DiffState;
    class DiffMapping {
        constructor(lineRangeMapping) {
            this.lineRangeMapping = lineRangeMapping;
            /*
            readonly movedTo: MovedText | undefined,
            readonly movedFrom: MovedText | undefined,
    
            if (movedTo) {
                assertFn(() =>
                    movedTo.lineRangeMapping.modifiedRange.equals(lineRangeMapping.modifiedRange)
                    && lineRangeMapping.originalRange.isEmpty
                    && !movedFrom
                );
            } else if (movedFrom) {
                assertFn(() =>
                    movedFrom.lineRangeMapping.originalRange.equals(lineRangeMapping.originalRange)
                    && lineRangeMapping.modifiedRange.isEmpty
                    && !movedTo
                );
            }
            */
        }
    }
    exports.DiffMapping = DiffMapping;
    class UnchangedRegion {
        static fromDiffs(changes, originalLineCount, modifiedLineCount, minHiddenLineCount, minContext) {
            const inversedMappings = rangeMapping_1.DetailedLineRangeMapping.inverse(changes, originalLineCount, modifiedLineCount);
            const result = [];
            for (const mapping of inversedMappings) {
                let origStart = mapping.original.startLineNumber;
                let modStart = mapping.modified.startLineNumber;
                let length = mapping.original.length;
                const atStart = origStart === 1 && modStart === 1;
                const atEnd = origStart + length === originalLineCount + 1 && modStart + length === modifiedLineCount + 1;
                if ((atStart || atEnd) && length >= minContext + minHiddenLineCount) {
                    if (atStart && !atEnd) {
                        length -= minContext;
                    }
                    if (atEnd && !atStart) {
                        origStart += minContext;
                        modStart += minContext;
                        length -= minContext;
                    }
                    result.push(new UnchangedRegion(origStart, modStart, length, 0, 0));
                }
                else if (length >= minContext * 2 + minHiddenLineCount) {
                    origStart += minContext;
                    modStart += minContext;
                    length -= minContext * 2;
                    result.push(new UnchangedRegion(origStart, modStart, length, 0, 0));
                }
            }
            return result;
        }
        get originalUnchangedRange() {
            return lineRange_1.LineRange.ofLength(this.originalLineNumber, this.lineCount);
        }
        get modifiedUnchangedRange() {
            return lineRange_1.LineRange.ofLength(this.modifiedLineNumber, this.lineCount);
        }
        constructor(originalLineNumber, modifiedLineNumber, lineCount, visibleLineCountTop, visibleLineCountBottom) {
            this.originalLineNumber = originalLineNumber;
            this.modifiedLineNumber = modifiedLineNumber;
            this.lineCount = lineCount;
            this._visibleLineCountTop = (0, observable_1.observableValue)(this, 0);
            this.visibleLineCountTop = this._visibleLineCountTop;
            this._visibleLineCountBottom = (0, observable_1.observableValue)(this, 0);
            this.visibleLineCountBottom = this._visibleLineCountBottom;
            this._shouldHideControls = (0, observable_1.derived)(this, reader => /** @description isVisible */ this.visibleLineCountTop.read(reader) + this.visibleLineCountBottom.read(reader) === this.lineCount && !this.isDragged.read(reader));
            this.isDragged = (0, observable_1.observableValue)(this, undefined);
            const visibleLineCountTop2 = Math.max(Math.min(visibleLineCountTop, this.lineCount), 0);
            const visibleLineCountBottom2 = Math.max(Math.min(visibleLineCountBottom, this.lineCount - visibleLineCountTop), 0);
            (0, assert_1.softAssert)(visibleLineCountTop === visibleLineCountTop2);
            (0, assert_1.softAssert)(visibleLineCountBottom === visibleLineCountBottom2);
            this._visibleLineCountTop.set(visibleLineCountTop2, undefined);
            this._visibleLineCountBottom.set(visibleLineCountBottom2, undefined);
        }
        setVisibleRanges(visibleRanges, tx) {
            const result = [];
            const hiddenModified = new lineRange_1.LineRangeSet(visibleRanges.map(r => r.modified)).subtractFrom(this.modifiedUnchangedRange);
            let originalStartLineNumber = this.originalLineNumber;
            let modifiedStartLineNumber = this.modifiedLineNumber;
            const modifiedEndLineNumberEx = this.modifiedLineNumber + this.lineCount;
            if (hiddenModified.ranges.length === 0) {
                this.showAll(tx);
                result.push(this);
            }
            else {
                let i = 0;
                for (const r of hiddenModified.ranges) {
                    const isLast = i === hiddenModified.ranges.length - 1;
                    i++;
                    const length = (isLast ? modifiedEndLineNumberEx : r.endLineNumberExclusive) - modifiedStartLineNumber;
                    const newR = new UnchangedRegion(originalStartLineNumber, modifiedStartLineNumber, length, 0, 0);
                    newR.setHiddenModifiedRange(r, tx);
                    result.push(newR);
                    originalStartLineNumber = newR.originalUnchangedRange.endLineNumberExclusive;
                    modifiedStartLineNumber = newR.modifiedUnchangedRange.endLineNumberExclusive;
                }
            }
            return result;
        }
        shouldHideControls(reader) {
            return this._shouldHideControls.read(reader);
        }
        getHiddenOriginalRange(reader) {
            return lineRange_1.LineRange.ofLength(this.originalLineNumber + this._visibleLineCountTop.read(reader), this.lineCount - this._visibleLineCountTop.read(reader) - this._visibleLineCountBottom.read(reader));
        }
        getHiddenModifiedRange(reader) {
            return lineRange_1.LineRange.ofLength(this.modifiedLineNumber + this._visibleLineCountTop.read(reader), this.lineCount - this._visibleLineCountTop.read(reader) - this._visibleLineCountBottom.read(reader));
        }
        setHiddenModifiedRange(range, tx) {
            const visibleLineCountTop = range.startLineNumber - this.modifiedLineNumber;
            const visibleLineCountBottom = (this.modifiedLineNumber + this.lineCount) - range.endLineNumberExclusive;
            this.setState(visibleLineCountTop, visibleLineCountBottom, tx);
        }
        getMaxVisibleLineCountTop() {
            return this.lineCount - this._visibleLineCountBottom.get();
        }
        getMaxVisibleLineCountBottom() {
            return this.lineCount - this._visibleLineCountTop.get();
        }
        showMoreAbove(count = 10, tx) {
            const maxVisibleLineCountTop = this.getMaxVisibleLineCountTop();
            this._visibleLineCountTop.set(Math.min(this._visibleLineCountTop.get() + count, maxVisibleLineCountTop), tx);
        }
        showMoreBelow(count = 10, tx) {
            const maxVisibleLineCountBottom = this.lineCount - this._visibleLineCountTop.get();
            this._visibleLineCountBottom.set(Math.min(this._visibleLineCountBottom.get() + count, maxVisibleLineCountBottom), tx);
        }
        showAll(tx) {
            this._visibleLineCountBottom.set(this.lineCount - this._visibleLineCountTop.get(), tx);
        }
        showModifiedLine(lineNumber, preference, tx) {
            const top = lineNumber + 1 - (this.modifiedLineNumber + this._visibleLineCountTop.get());
            const bottom = (this.modifiedLineNumber - this._visibleLineCountBottom.get() + this.lineCount) - lineNumber;
            if (preference === 0 /* RevealPreference.FromCloserSide */ && top < bottom || preference === 1 /* RevealPreference.FromTop */) {
                this._visibleLineCountTop.set(this._visibleLineCountTop.get() + top, tx);
            }
            else {
                this._visibleLineCountBottom.set(this._visibleLineCountBottom.get() + bottom, tx);
            }
        }
        showOriginalLine(lineNumber, preference, tx) {
            const top = lineNumber - this.originalLineNumber;
            const bottom = (this.originalLineNumber + this.lineCount) - lineNumber;
            if (preference === 0 /* RevealPreference.FromCloserSide */ && top < bottom || preference === 1 /* RevealPreference.FromTop */) {
                this._visibleLineCountTop.set(Math.min(this._visibleLineCountTop.get() + bottom - top, this.getMaxVisibleLineCountTop()), tx);
            }
            else {
                this._visibleLineCountBottom.set(Math.min(this._visibleLineCountBottom.get() + top - bottom, this.getMaxVisibleLineCountBottom()), tx);
            }
        }
        collapseAll(tx) {
            this._visibleLineCountTop.set(0, tx);
            this._visibleLineCountBottom.set(0, tx);
        }
        setState(visibleLineCountTop, visibleLineCountBottom, tx) {
            visibleLineCountTop = Math.max(Math.min(visibleLineCountTop, this.lineCount), 0);
            visibleLineCountBottom = Math.max(Math.min(visibleLineCountBottom, this.lineCount - visibleLineCountTop), 0);
            this._visibleLineCountTop.set(visibleLineCountTop, tx);
            this._visibleLineCountBottom.set(visibleLineCountBottom, tx);
        }
    }
    exports.UnchangedRegion = UnchangedRegion;
    var RevealPreference;
    (function (RevealPreference) {
        RevealPreference[RevealPreference["FromCloserSide"] = 0] = "FromCloserSide";
        RevealPreference[RevealPreference["FromTop"] = 1] = "FromTop";
        RevealPreference[RevealPreference["FromBottom"] = 2] = "FromBottom";
    })(RevealPreference || (exports.RevealPreference = RevealPreference = {}));
    function applyOriginalEdits(diff, textEdits, originalTextModel, modifiedTextModel) {
        return undefined;
        /*
        TODO@hediet
        if (textEdits.length === 0) {
            return diff;
        }
    
        const diff2 = flip(diff);
        const diff3 = applyModifiedEdits(diff2, textEdits, modifiedTextModel, originalTextModel);
        if (!diff3) {
            return undefined;
        }
        return flip(diff3);*/
    }
    /*
    function flip(diff: IDocumentDiff): IDocumentDiff {
        return {
            changes: diff.changes.map(c => c.flip()),
            moves: diff.moves.map(m => m.flip()),
            identical: diff.identical,
            quitEarly: diff.quitEarly,
        };
    }
    */
    function applyModifiedEdits(diff, textEdits, originalTextModel, modifiedTextModel) {
        return undefined;
        /*
        TODO@hediet
        if (textEdits.length === 0) {
            return diff;
        }
        if (diff.changes.some(c => !c.innerChanges) || diff.moves.length > 0) {
            // TODO support these cases
            return undefined;
        }
    
        const changes = applyModifiedEditsToLineRangeMappings(diff.changes, textEdits, originalTextModel, modifiedTextModel);
    
        const moves = diff.moves.map(m => {
            const newModifiedRange = applyEditToLineRange(m.lineRangeMapping.modified, textEdits);
            return newModifiedRange ? new MovedText(
                new SimpleLineRangeMapping(m.lineRangeMapping.original, newModifiedRange),
                applyModifiedEditsToLineRangeMappings(m.changes, textEdits, originalTextModel, modifiedTextModel),
            ) : undefined;
        }).filter(isDefined);
    
        return {
            identical: false,
            quitEarly: false,
            changes,
            moves,
        };*/
    }
});
/*
function applyEditToLineRange(range: LineRange, textEdits: TextEditInfo[]): LineRange | undefined {
    let rangeStartLineNumber = range.startLineNumber;
    let rangeEndLineNumberEx = range.endLineNumberExclusive;

    for (let i = textEdits.length - 1; i >= 0; i--) {
        const textEdit = textEdits[i];
        const textEditStartLineNumber = lengthGetLineCount(textEdit.startOffset) + 1;
        const textEditEndLineNumber = lengthGetLineCount(textEdit.endOffset) + 1;
        const newLengthLineCount = lengthGetLineCount(textEdit.newLength);
        const delta = newLengthLineCount - (textEditEndLineNumber - textEditStartLineNumber);

        if (textEditEndLineNumber < rangeStartLineNumber) {
            // the text edit is before us
            rangeStartLineNumber += delta;
            rangeEndLineNumberEx += delta;
        } else if (textEditStartLineNumber > rangeEndLineNumberEx) {
            // the text edit is after us
            // NOOP
        } else if (textEditStartLineNumber < rangeStartLineNumber && rangeEndLineNumberEx < textEditEndLineNumber) {
            // the range is fully contained in the text edit
            return undefined;
        } else if (textEditStartLineNumber < rangeStartLineNumber && textEditEndLineNumber <= rangeEndLineNumberEx) {
            // the text edit ends inside our range
            rangeStartLineNumber = textEditEndLineNumber + 1;
            rangeStartLineNumber += delta;
            rangeEndLineNumberEx += delta;
        } else if (rangeStartLineNumber <= textEditStartLineNumber && textEditEndLineNumber < rangeStartLineNumber) {
            // the text edit starts inside our range
            rangeEndLineNumberEx = textEditStartLineNumber;
        } else {
            rangeEndLineNumberEx += delta;
        }
    }

    return new LineRange(rangeStartLineNumber, rangeEndLineNumberEx);
}

function applyModifiedEditsToLineRangeMappings(changes: readonly LineRangeMapping[], textEdits: TextEditInfo[], originalTextModel: ITextModel, modifiedTextModel: ITextModel): LineRangeMapping[] {
    const diffTextEdits = changes.flatMap(c => c.innerChanges!.map(c => new TextEditInfo(
        positionToLength(c.originalRange.getStartPosition()),
        positionToLength(c.originalRange.getEndPosition()),
        lengthOfRange(c.modifiedRange).toLength(),
    )));

    const combined = combineTextEditInfos(diffTextEdits, textEdits);

    let lastOriginalEndOffset = lengthZero;
    let lastModifiedEndOffset = lengthZero;
    const rangeMappings = combined.map(c => {
        const modifiedStartOffset = lengthAdd(lastModifiedEndOffset, lengthDiffNonNegative(lastOriginalEndOffset, c.startOffset));
        lastOriginalEndOffset = c.endOffset;
        lastModifiedEndOffset = lengthAdd(modifiedStartOffset, c.newLength);

        return new RangeMapping(
            Range.fromPositions(lengthToPosition(c.startOffset), lengthToPosition(c.endOffset)),
            Range.fromPositions(lengthToPosition(modifiedStartOffset), lengthToPosition(lastModifiedEndOffset)),
        );
    });

    const newChanges = lineRangeMappingFromRangeMappings(
        rangeMappings,
        originalTextModel.getLinesContent(),
        modifiedTextModel.getLinesContent(),
    );
    return newChanges;
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvclZpZXdNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvd2lkZ2V0L2RpZmZFZGl0b3IvZGlmZkVkaXRvclZpZXdNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFnQzNDLGtCQUFrQixDQUFDLFNBQWdDO1lBQ3pELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFTSxtQkFBbUIsQ0FBQyxTQUFnQztZQUMxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBZUQsWUFDaUIsS0FBdUIsRUFDdEIsUUFBMkIsRUFDZiwyQkFBeUU7WUFFdEcsS0FBSyxFQUFFLENBQUM7WUFKUSxVQUFLLEdBQUwsS0FBSyxDQUFrQjtZQUN0QixhQUFRLEdBQVIsUUFBUSxDQUFtQjtZQUNFLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUF2RHRGLG9CQUFlLEdBQUcsSUFBQSw0QkFBZSxFQUFVLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxtQkFBYyxHQUF5QixJQUFJLENBQUMsZUFBZSxDQUFDO1lBRzNELFVBQUssR0FBRyxJQUFBLDRCQUFlLEVBQXdCLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNqRSxTQUFJLEdBQXVDLElBQUksQ0FBQyxLQUFLLENBQUM7WUFFckQsc0JBQWlCLEdBQUcsSUFBQSw0QkFBZSxFQUErRyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDcEsscUJBQWdCLEdBQW1D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