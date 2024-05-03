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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/observable", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/nls", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/textModelDiffs", "vs/workbench/contrib/mergeEditor/browser/utils", "./modifiedBaseRange"], function (require, exports, arrays_1, errors_1, observable_1, range_1, language_1, nls_1, undoRedo_1, editorModel_1, lineRange_1, mapping_1, textModelDiffs_1, utils_1, modifiedBaseRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergeEditorModelState = exports.MergeEditorModel = void 0;
    let MergeEditorModel = class MergeEditorModel extends editorModel_1.EditorModel {
        constructor(base, input1, input2, resultTextModel, diffComputer, options, telemetry, languageService, undoRedoService) {
            super();
            this.base = base;
            this.input1 = input1;
            this.input2 = input2;
            this.resultTextModel = resultTextModel;
            this.diffComputer = diffComputer;
            this.options = options;
            this.telemetry = telemetry;
            this.languageService = languageService;
            this.undoRedoService = undoRedoService;
            this.input1TextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.input1.textModel, this.diffComputer));
            this.input2TextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.input2.textModel, this.diffComputer));
            this.resultTextModelDiffs = this._register(new textModelDiffs_1.TextModelDiffs(this.base, this.resultTextModel, this.diffComputer));
            this.modifiedBaseRanges = (0, observable_1.derived)(this, (reader) => {
                const input1Diffs = this.input1TextModelDiffs.diffs.read(reader);
                const input2Diffs = this.input2TextModelDiffs.diffs.read(reader);
                return modifiedBaseRange_1.ModifiedBaseRange.fromDiffs(input1Diffs, input2Diffs, this.base, this.input1.textModel, this.input2.textModel);
            });
            this.modifiedBaseRangeResultStates = (0, observable_1.derived)(this, reader => {
                const map = new Map(this.modifiedBaseRanges.read(reader).map((s) => [
                    s, new ModifiedBaseRangeData(s)
                ]));
                return map;
            });
            this.resultSnapshot = this.resultTextModel.createSnapshot();
            this.baseInput1Diffs = this.input1TextModelDiffs.diffs;
            this.baseInput2Diffs = this.input2TextModelDiffs.diffs;
            this.baseResultDiffs = this.resultTextModelDiffs.diffs;
            this.input1ResultMapping = (0, observable_1.derived)(this, reader => {
                return this.getInputResultMapping(this.baseInput1Diffs.read(reader), this.baseResultDiffs.read(reader), this.input1.textModel.getLineCount());
            });
            this.resultInput1Mapping = (0, observable_1.derived)(this, reader => this.input1ResultMapping.read(reader).reverse());
            this.input2ResultMapping = (0, observable_1.derived)(this, reader => {
                return this.getInputResultMapping(this.baseInput2Diffs.read(reader), this.baseResultDiffs.read(reader), this.input2.textModel.getLineCount());
            });
            this.resultInput2Mapping = (0, observable_1.derived)(this, reader => this.input2ResultMapping.read(reader).reverse());
            this.baseResultMapping = (0, observable_1.derived)(this, reader => {
                const map = new mapping_1.DocumentLineRangeMap(this.baseResultDiffs.read(reader), -1);
                return new mapping_1.DocumentLineRangeMap(map.lineRangeMappings.map((m) => m.inputRange.isEmpty || m.outputRange.isEmpty
                    ? new mapping_1.LineRangeMapping(
                    // We can do this because two adjacent diffs have one line in between.
                    m.inputRange.deltaStart(-1), m.outputRange.deltaStart(-1))
                    : m), map.inputLineCount);
            });
            this.resultBaseMapping = (0, observable_1.derived)(this, reader => this.baseResultMapping.read(reader).reverse());
            this.diffComputingState = (0, observable_1.derived)(this, reader => {
                const states = [
                    this.input1TextModelDiffs,
                    this.input2TextModelDiffs,
                    this.resultTextModelDiffs,
                ].map((s) => s.state.read(reader));
                if (states.some((s) => s === 1 /* TextModelDiffState.initializing */)) {
                    return 1 /* MergeEditorModelState.initializing */;
                }
                if (states.some((s) => s === 3 /* TextModelDiffState.updating */)) {
                    return 3 /* MergeEditorModelState.updating */;
                }
                return 2 /* MergeEditorModelState.upToDate */;
            });
            this.inputDiffComputingState = (0, observable_1.derived)(this, reader => {
                const states = [
                    this.input1TextModelDiffs,
                    this.input2TextModelDiffs,
                ].map((s) => s.state.read(reader));
                if (states.some((s) => s === 1 /* TextModelDiffState.initializing */)) {
                    return 1 /* MergeEditorModelState.initializing */;
                }
                if (states.some((s) => s === 3 /* TextModelDiffState.updating */)) {
                    return 3 /* MergeEditorModelState.updating */;
                }
                return 2 /* MergeEditorModelState.upToDate */;
            });
            this.isUpToDate = (0, observable_1.derived)(this, reader => this.diffComputingState.read(reader) === 2 /* MergeEditorModelState.upToDate */);
            this.onInitialized = (0, observable_1.waitForState)(this.diffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */).then(() => { });
            this.firstRun = true;
            this.unhandledConflictsCount = (0, observable_1.derived)(this, reader => {
                const map = this.modifiedBaseRangeResultStates.read(reader);
                let unhandledCount = 0;
                for (const [_key, value] of map) {
                    if (!value.handled.read(reader)) {
                        unhandledCount++;
                    }
                }
                return unhandledCount;
            });
            this.hasUnhandledConflicts = this.unhandledConflictsCount.map(value => /** @description hasUnhandledConflicts */ value > 0);
            this._register((0, observable_1.keepObserved)(this.modifiedBaseRangeResultStates));
            this._register((0, observable_1.keepObserved)(this.input1ResultMapping));
            this._register((0, observable_1.keepObserved)(this.input2ResultMapping));
            const initializePromise = this.initialize();
            this.onInitialized = this.onInitialized.then(async () => {
                await initializePromise;
            });
            initializePromise.then(() => {
                let shouldRecomputeHandledFromAccepted = true;
                this._register((0, observable_1.autorunHandleChanges)({
                    handleChange: (ctx) => {
                        if (ctx.didChange(this.modifiedBaseRangeResultStates)) {
                            shouldRecomputeHandledFromAccepted = true;
                        }
                        return ctx.didChange(this.resultTextModelDiffs.diffs)
                            // Ignore non-text changes as we update the state directly
                            ? ctx.change === 1 /* TextModelDiffChangeReason.textChange */
                            : true;
                    },
                }, (reader) => {
                    /** @description Merge Editor Model: Recompute State From Result */
                    const states = this.modifiedBaseRangeResultStates.read(reader);
                    if (!this.isUpToDate.read(reader)) {
                        return;
                    }
                    const resultDiffs = this.resultTextModelDiffs.diffs.read(reader);
                    (0, observable_1.transaction)(tx => {
                        /** @description Merge Editor Model: Recompute State */
                        this.updateBaseRangeAcceptedState(resultDiffs, states, tx);
                        if (shouldRecomputeHandledFromAccepted) {
                            shouldRecomputeHandledFromAccepted = false;
                            for (const [_range, observableState] of states) {
                                const state = observableState.accepted.get();
                                const handled = !(state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base || state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized);
                                observableState.handledInput1.set(handled, tx);
                                observableState.handledInput2.set(handled, tx);
                            }
                        }
                    });
                }));
            });
        }
        async initialize() {
            if (this.options.resetResult) {
                await this.reset();
            }
        }
        async reset() {
            await (0, observable_1.waitForState)(this.inputDiffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */);
            const states = this.modifiedBaseRangeResultStates.get();
            (0, observable_1.transaction)(tx => {
                /** @description Set initial state */
                for (const [range, state] of states) {
                    let newState;
                    let handled = false;
                    if (range.input1Diffs.length === 0) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true);
                        handled = true;
                    }
                    else if (range.input2Diffs.length === 0) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
                        handled = true;
                    }
                    else if (range.isEqualChange) {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
                        handled = true;
                    }
                    else {
                        newState = modifiedBaseRange_1.ModifiedBaseRangeState.base;
                        handled = false;
                    }
                    state.accepted.set(newState, tx);
                    state.computedFromDiffing = false;
                    state.previousNonDiffingState = undefined;
                    state.handledInput1.set(handled, tx);
                    state.handledInput2.set(handled, tx);
                }
                this.resultTextModel.pushEditOperations(null, [{
                        range: new range_1.Range(1, 1, Number.MAX_SAFE_INTEGER, 1),
                        text: this.computeAutoMergedResult()
                    }], () => null);
            });
        }
        computeAutoMergedResult() {
            const baseRanges = this.modifiedBaseRanges.get();
            const baseLines = this.base.getLinesContent();
            const input1Lines = this.input1.textModel.getLinesContent();
            const input2Lines = this.input2.textModel.getLinesContent();
            const resultLines = [];
            function appendLinesToResult(source, lineRange) {
                for (let i = lineRange.startLineNumber; i < lineRange.endLineNumberExclusive; i++) {
                    resultLines.push(source[i - 1]);
                }
            }
            let baseStartLineNumber = 1;
            for (const baseRange of baseRanges) {
                appendLinesToResult(baseLines, lineRange_1.LineRange.fromLineNumbers(baseStartLineNumber, baseRange.baseRange.startLineNumber));
                baseStartLineNumber = baseRange.baseRange.endLineNumberExclusive;
                if (baseRange.input1Diffs.length === 0) {
                    appendLinesToResult(input2Lines, baseRange.input2Range);
                }
                else if (baseRange.input2Diffs.length === 0) {
                    appendLinesToResult(input1Lines, baseRange.input1Range);
                }
                else if (baseRange.isEqualChange) {
                    appendLinesToResult(input1Lines, baseRange.input1Range);
                }
                else {
                    appendLinesToResult(baseLines, baseRange.baseRange);
                }
            }
            appendLinesToResult(baseLines, lineRange_1.LineRange.fromLineNumbers(baseStartLineNumber, baseLines.length + 1));
            return resultLines.join(this.resultTextModel.getEOL());
        }
        hasBaseRange(baseRange) {
            return this.modifiedBaseRangeResultStates.get().has(baseRange);
        }
        get isApplyingEditInResult() { return this.resultTextModelDiffs.isApplyingChange; }
        getInputResultMapping(inputLinesDiffs, resultDiffs, inputLineCount) {
            const map = mapping_1.DocumentLineRangeMap.betweenOutputs(inputLinesDiffs, resultDiffs, inputLineCount);
            return new mapping_1.DocumentLineRangeMap(map.lineRangeMappings.map((m) => m.inputRange.isEmpty || m.outputRange.isEmpty
                ? new mapping_1.LineRangeMapping(
                // We can do this because two adjacent diffs have one line in between.
                m.inputRange.deltaStart(-1), m.outputRange.deltaStart(-1))
                : m), map.inputLineCount);
        }
        translateInputRangeToBase(input, range) {
            const baseInputDiffs = input === 1 ? this.baseInput1Diffs.get() : this.baseInput2Diffs.get();
            const map = new mapping_1.DocumentRangeMap(baseInputDiffs.flatMap(d => d.rangeMappings), 0).reverse();
            return map.projectRange(range).outputRange;
        }
        translateBaseRangeToInput(input, range) {
            const baseInputDiffs = input === 1 ? this.baseInput1Diffs.get() : this.baseInput2Diffs.get();
            const map = new mapping_1.DocumentRangeMap(baseInputDiffs.flatMap(d => d.rangeMappings), 0);
            return map.projectRange(range).outputRange;
        }
        getLineRangeInResult(baseRange, reader) {
            return this.resultTextModelDiffs.getResultLineRange(baseRange, reader);
        }
        translateResultRangeToBase(range) {
            const map = new mapping_1.DocumentRangeMap(this.baseResultDiffs.get().flatMap(d => d.rangeMappings), 0).reverse();
            return map.projectRange(range).outputRange;
        }
        translateBaseRangeToResult(range) {
            const map = new mapping_1.DocumentRangeMap(this.baseResultDiffs.get().flatMap(d => d.rangeMappings), 0);
            return map.projectRange(range).outputRange;
        }
        findModifiedBaseRangesInRange(rangeInBase) {
            // TODO use binary search
            return this.modifiedBaseRanges.get().filter(r => r.baseRange.intersects(rangeInBase));
        }
        updateBaseRangeAcceptedState(resultDiffs, states, tx) {
            const baseRangeWithStoreAndTouchingDiffs = (0, utils_1.leftJoin)(states, resultDiffs, (baseRange, diff) => baseRange[0].baseRange.touches(diff.inputRange)
                ? arrays_1.CompareResult.neitherLessOrGreaterThan
                : lineRange_1.LineRange.compareByStart(baseRange[0].baseRange, diff.inputRange));
            for (const row of baseRangeWithStoreAndTouchingDiffs) {
                const newState = this.computeState(row.left[0], row.rights);
                const data = row.left[1];
                const oldState = data.accepted.get();
                if (!oldState.equals(newState)) {
                    if (!this.firstRun && !data.computedFromDiffing) {
                        // Don't set this on the first run - the first run might be used to restore state.
                        data.computedFromDiffing = true;
                        data.previousNonDiffingState = oldState;
                    }
                    data.accepted.set(newState, tx);
                }
            }
            if (this.firstRun) {
                this.firstRun = false;
            }
        }
        computeState(baseRange, conflictingDiffs) {
            if (conflictingDiffs.length === 0) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base;
            }
            const conflictingEdits = conflictingDiffs.map((d) => d.getLineEdit());
            function editsAgreeWithDiffs(diffs) {
                return (0, arrays_1.equals)(conflictingEdits, diffs.map((d) => d.getLineEdit()), (a, b) => a.equals(b));
            }
            if (editsAgreeWithDiffs(baseRange.input1Diffs)) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true);
            }
            if (editsAgreeWithDiffs(baseRange.input2Diffs)) {
                return modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true);
            }
            const states = [
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true).withInputValue(2, true, true),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true).withInputValue(1, true, true),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(1, true).withInputValue(2, true, false),
                modifiedBaseRange_1.ModifiedBaseRangeState.base.withInputValue(2, true).withInputValue(1, true, false),
            ];
            for (const s of states) {
                const { edit } = baseRange.getEditForBase(s);
                if (edit) {
                    const resultRange = this.resultTextModelDiffs.getResultLineRange(baseRange.baseRange);
                    const existingLines = resultRange.getLines(this.resultTextModel);
                    if ((0, arrays_1.equals)(edit.newLines, existingLines, (a, b) => a === b)) {
                        return s;
                    }
                }
            }
            return modifiedBaseRange_1.ModifiedBaseRangeState.unrecognized;
        }
        getState(baseRange) {
            const existingState = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            return existingState.accepted;
        }
        setState(baseRange, state, _markInputAsHandled, tx, _pushStackElement = false) {
            if (!this.isUpToDate.get()) {
                throw new errors_1.BugIndicatingError('Cannot set state while updating');
            }
            const existingState = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (!existingState) {
                throw new errors_1.BugIndicatingError('object must be from this instance');
            }
            const conflictingDiffs = this.resultTextModelDiffs.findTouchingDiffs(baseRange.baseRange);
            const group = new undoRedo_1.UndoRedoGroup();
            if (conflictingDiffs) {
                this.resultTextModelDiffs.removeDiffs(conflictingDiffs, tx, group);
            }
            const { edit, effectiveState } = baseRange.getEditForBase(state);
            existingState.accepted.set(effectiveState, tx);
            existingState.previousNonDiffingState = undefined;
            existingState.computedFromDiffing = false;
            const input1Handled = existingState.handledInput1.get();
            const input2Handled = existingState.handledInput2.get();
            if (!input1Handled || !input2Handled) {
                this.undoRedoService.pushElement(new MarkAsHandledUndoRedoElement(this.resultTextModel.uri, new WeakRef(this), new WeakRef(existingState), input1Handled, input2Handled), group);
            }
            if (edit) {
                this.resultTextModel.pushStackElement();
                this.resultTextModelDiffs.applyEditRelativeToOriginal(edit, tx, group);
                this.resultTextModel.pushStackElement();
            }
            // always set conflict as handled
            existingState.handledInput1.set(true, tx);
            existingState.handledInput2.set(true, tx);
        }
        resetDirtyConflictsToBase() {
            (0, observable_1.transaction)(tx => {
                /** @description Reset Unknown Base Range States */
                this.resultTextModel.pushStackElement();
                for (const range of this.modifiedBaseRanges.get()) {
                    if (this.getState(range).get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                        this.setState(range, modifiedBaseRange_1.ModifiedBaseRangeState.base, false, tx, false);
                    }
                }
                this.resultTextModel.pushStackElement();
            });
        }
        isHandled(baseRange) {
            return this.modifiedBaseRangeResultStates.get().get(baseRange).handled;
        }
        isInputHandled(baseRange, inputNumber) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            return inputNumber === 1 ? state.handledInput1 : state.handledInput2;
        }
        setInputHandled(baseRange, inputNumber, handled, tx) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (state.handled.get() === handled) {
                return;
            }
            const dataRef = new WeakRef(ModifiedBaseRangeData);
            const modelRef = new WeakRef(this);
            this.undoRedoService.pushElement({
                type: 0 /* UndoRedoElementType.Resource */,
                resource: this.resultTextModel.uri,
                code: 'setInputHandled',
                label: (0, nls_1.localize)('setInputHandled', "Set Input Handled"),
                redo() {
                    const model = modelRef.deref();
                    const data = dataRef.deref();
                    if (model && !model.isDisposed() && data) {
                        (0, observable_1.transaction)(tx => {
                            if (inputNumber === 1) {
                                state.handledInput1.set(handled, tx);
                            }
                            else {
                                state.handledInput2.set(handled, tx);
                            }
                        });
                    }
                },
                undo() {
                    const model = modelRef.deref();
                    const data = dataRef.deref();
                    if (model && !model.isDisposed() && data) {
                        (0, observable_1.transaction)(tx => {
                            if (inputNumber === 1) {
                                state.handledInput1.set(!handled, tx);
                            }
                            else {
                                state.handledInput2.set(!handled, tx);
                            }
                        });
                    }
                },
            });
            if (inputNumber === 1) {
                state.handledInput1.set(handled, tx);
            }
            else {
                state.handledInput2.set(handled, tx);
            }
        }
        setHandled(baseRange, handled, tx) {
            const state = this.modifiedBaseRangeResultStates.get().get(baseRange);
            if (state.handled.get() === handled) {
                return;
            }
            state.handledInput1.set(handled, tx);
            state.handledInput2.set(handled, tx);
        }
        setLanguageId(languageId, source) {
            const language = this.languageService.createById(languageId);
            this.base.setLanguage(language, source);
            this.input1.textModel.setLanguage(language, source);
            this.input2.textModel.setLanguage(language, source);
            this.resultTextModel.setLanguage(language, source);
        }
        getInitialResultValue() {
            const chunks = [];
            while (true) {
                const chunk = this.resultSnapshot.read();
                if (chunk === null) {
                    break;
                }
                chunks.push(chunk);
            }
            return chunks.join();
        }
        async getResultValueWithConflictMarkers() {
            await (0, observable_1.waitForState)(this.diffComputingState, state => state === 2 /* MergeEditorModelState.upToDate */);
            if (this.unhandledConflictsCount.get() === 0) {
                return this.resultTextModel.getValue();
            }
            const resultLines = this.resultTextModel.getLinesContent();
            const input1Lines = this.input1.textModel.getLinesContent();
            const input2Lines = this.input2.textModel.getLinesContent();
            const states = this.modifiedBaseRangeResultStates.get();
            const outputLines = [];
            function appendLinesToResult(source, lineRange) {
                for (let i = lineRange.startLineNumber; i < lineRange.endLineNumberExclusive; i++) {
                    outputLines.push(source[i - 1]);
                }
            }
            let resultStartLineNumber = 1;
            for (const [range, state] of states) {
                if (state.handled.get()) {
                    continue;
                }
                const resultRange = this.resultTextModelDiffs.getResultLineRange(range.baseRange);
                appendLinesToResult(resultLines, lineRange_1.LineRange.fromLineNumbers(resultStartLineNumber, Math.max(resultStartLineNumber, resultRange.startLineNumber)));
                resultStartLineNumber = resultRange.endLineNumberExclusive;
                outputLines.push('<<<<<<<');
                if (state.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized) {
                    // to prevent loss of data, use modified result as "ours"
                    appendLinesToResult(resultLines, resultRange);
                }
                else {
                    appendLinesToResult(input1Lines, range.input1Range);
                }
                outputLines.push('=======');
                appendLinesToResult(input2Lines, range.input2Range);
                outputLines.push('>>>>>>>');
            }
            appendLinesToResult(resultLines, lineRange_1.LineRange.fromLineNumbers(resultStartLineNumber, resultLines.length + 1));
            return outputLines.join('\n');
        }
        get conflictCount() {
            return arrayCount(this.modifiedBaseRanges.get(), r => r.isConflicting);
        }
        get combinableConflictCount() {
            return arrayCount(this.modifiedBaseRanges.get(), r => r.isConflicting && r.canBeCombined);
        }
        get conflictsResolvedWithBase() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base);
        }
        get conflictsResolvedWithInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1);
        }
        get conflictsResolvedWithInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2);
        }
        get conflictsResolvedWithSmartCombination() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && state.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualNone() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => r.isConflicting &&
                s.accepted.get().kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized);
        }
        get manuallySolvedConflictCountThatEqualSmartCombine() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && state.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1;
            });
        }
        get manuallySolvedConflictCountThatEqualInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && s.computedFromDiffing && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBase() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.base;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithInput1() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input1;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithInput2() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.input2;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBothNonSmart() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && !s.previousNonDiffingState?.smartCombination;
            });
        }
        get manuallySolvedConflictCountThatEqualNoneAndStartedWithBothSmart() {
            return arrayCount(this.modifiedBaseRangeResultStates.get().entries(), ([r, s]) => {
                const state = s.accepted.get();
                return r.isConflicting && state.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.unrecognized && s.previousNonDiffingState?.kind === modifiedBaseRange_1.ModifiedBaseRangeStateKind.both && s.previousNonDiffingState?.smartCombination;
            });
        }
    };
    exports.MergeEditorModel = MergeEditorModel;
    exports.MergeEditorModel = MergeEditorModel = __decorate([
        __param(7, language_1.ILanguageService),
        __param(8, undoRedo_1.IUndoRedoService)
    ], MergeEditorModel);
    function arrayCount(array, predicate) {
        let count = 0;
        for (const value of array) {
            if (predicate(value)) {
                count++;
            }
        }
        return count;
    }
    class ModifiedBaseRangeData {
        constructor(baseRange) {
            this.baseRange = baseRange;
            this.accepted = (0, observable_1.observableValue)(`BaseRangeState${this.baseRange.baseRange}`, modifiedBaseRange_1.ModifiedBaseRangeState.base);
            this.handledInput1 = (0, observable_1.observableValue)(`BaseRangeHandledState${this.baseRange.baseRange}.Input1`, false);
            this.handledInput2 = (0, observable_1.observableValue)(`BaseRangeHandledState${this.baseRange.baseRange}.Input2`, false);
            this.computedFromDiffing = false;
            this.previousNonDiffingState = undefined;
            this.handled = (0, observable_1.derived)(this, reader => this.handledInput1.read(reader) && this.handledInput2.read(reader));
        }
    }
    var MergeEditorModelState;
    (function (MergeEditorModelState) {
        MergeEditorModelState[MergeEditorModelState["initializing"] = 1] = "initializing";
        MergeEditorModelState[MergeEditorModelState["upToDate"] = 2] = "upToDate";
        MergeEditorModelState[MergeEditorModelState["updating"] = 3] = "updating";
    })(MergeEditorModelState || (exports.MergeEditorModelState = MergeEditorModelState = {}));
    class MarkAsHandledUndoRedoElement {
        constructor(resource, mergeEditorModelRef, stateRef, input1Handled, input2Handled) {
            this.resource = resource;
            this.mergeEditorModelRef = mergeEditorModelRef;
            this.stateRef = stateRef;
            this.input1Handled = input1Handled;
            this.input2Handled = input2Handled;
            this.code = 'undoMarkAsHandled';
            this.label = (0, nls_1.localize)('undoMarkAsHandled', 'Undo Mark As Handled');
            this.type = 0 /* UndoRedoElementType.Resource */;
        }
        redo() {
            const mergeEditorModel = this.mergeEditorModelRef.deref();
            if (!mergeEditorModel || mergeEditorModel.isDisposed()) {
                return;
            }
            const state = this.stateRef.deref();
            if (!state) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                state.handledInput1.set(true, tx);
                state.handledInput2.set(true, tx);
            });
        }
        undo() {
            const mergeEditorModel = this.mergeEditorModelRef.deref();
            if (!mergeEditorModel || mergeEditorModel.isDisposed()) {
                return;
            }
            const state = this.stateRef.deref();
            if (!state) {
                return;
            }
            (0, observable_1.transaction)(tx => {
                state.handledInput1.set(this.input1Handled, tx);
                state.handledInput2.set(this.input2Handled, tx);
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tb2RlbC9tZXJnZUVkaXRvck1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSx5QkFBVztRQXFCaEQsWUFDVSxJQUFnQixFQUNoQixNQUFpQixFQUNqQixNQUFpQixFQUNqQixlQUEyQixFQUNuQixZQUFnQyxFQUNoQyxPQUFpQyxFQUNsQyxTQUErQixFQUM3QixlQUFrRCxFQUNsRCxlQUFrRDtZQUVwRSxLQUFLLEVBQUUsQ0FBQztZQVZDLFNBQUksR0FBSixJQUFJLENBQVk7WUFDaEIsV0FBTSxHQUFOLE1BQU0sQ0FBVztZQUNqQixXQUFNLEdBQU4sTUFBTSxDQUFXO1lBQ2pCLG9CQUFlLEdBQWYsZUFBZSxDQUFZO1lBQ25CLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtZQUNoQyxZQUFPLEdBQVAsT0FBTyxDQUEwQjtZQUNsQyxjQUFTLEdBQVQsU0FBUyxDQUFzQjtZQUNaLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNqQyxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUE3QnBELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwrQkFBYyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDL0cseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLCtCQUFjLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMvRyx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksK0JBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7WUFDL0csdUJBQWtCLEdBQUcsSUFBQSxvQkFBTyxFQUFzQixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDbEYsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRSxPQUFPLHFDQUFpQixDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2SCxDQUFDLENBQUMsQ0FBQztZQUVjLGtDQUE2QixHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ3ZFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUNsQixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBNkMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzRixDQUFDLEVBQUUsSUFBSSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7aUJBQy9CLENBQUMsQ0FDRixDQUFDO2dCQUNGLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQyxDQUFDLENBQUM7WUFFYyxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxFQUFFLENBQUM7WUF3SnhELG9CQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUVsRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFDbEQsb0JBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRWxELHdCQUFtQixHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQzVELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUNwQyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFYSx3QkFBbUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRS9GLHdCQUFtQixHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQzVELE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUNoQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDakMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQ2pDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUNwQyxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFYSx3QkFBbUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBa0IvRixzQkFBaUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUMxRCxNQUFNLEdBQUcsR0FBRyxJQUFJLDhCQUFvQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVFLE9BQU8sSUFBSSw4QkFBb0IsQ0FDOUIsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQy9CLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTztvQkFDNUMsQ0FBQyxDQUFDLElBQUksMEJBQWdCO29CQUNyQixzRUFBc0U7b0JBQ3RFLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzNCLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQzVCO29CQUNELENBQUMsQ0FBQyxDQUFDLENBQ0osRUFDRCxHQUFHLENBQUMsY0FBYyxDQUNsQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7WUFFYSxzQkFBaUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBaUMzRix1QkFBa0IsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUMzRCxNQUFNLE1BQU0sR0FBRztvQkFDZCxJQUFJLENBQUMsb0JBQW9CO29CQUN6QixJQUFJLENBQUMsb0JBQW9CO29CQUN6QixJQUFJLENBQUMsb0JBQW9CO2lCQUN6QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFbkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDRDQUFvQyxDQUFDLEVBQUUsQ0FBQztvQkFDL0Qsa0RBQTBDO2dCQUMzQyxDQUFDO2dCQUNELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyx3Q0FBZ0MsQ0FBQyxFQUFFLENBQUM7b0JBQzNELDhDQUFzQztnQkFDdkMsQ0FBQztnQkFDRCw4Q0FBc0M7WUFDdkMsQ0FBQyxDQUFDLENBQUM7WUFFYSw0QkFBdUIsR0FBRyxJQUFBLG9CQUFPLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNoRSxNQUFNLE1BQU0sR0FBRztvQkFDZCxJQUFJLENBQUMsb0JBQW9CO29CQUN6QixJQUFJLENBQUMsb0JBQW9CO2lCQUN6QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFFbkMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLDRDQUFvQyxDQUFDLEVBQUUsQ0FBQztvQkFDL0Qsa0RBQTBDO2dCQUMzQyxDQUFDO2dCQUNELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyx3Q0FBZ0MsQ0FBQyxFQUFFLENBQUM7b0JBQzNELDhDQUFzQztnQkFDdkMsQ0FBQztnQkFDRCw4Q0FBc0M7WUFDdkMsQ0FBQyxDQUFDLENBQUM7WUFFYSxlQUFVLEdBQUcsSUFBQSxvQkFBTyxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLDJDQUFtQyxDQUFDLENBQUM7WUFFOUcsa0JBQWEsR0FBRyxJQUFBLHlCQUFZLEVBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSywyQ0FBbUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVqSSxhQUFRLEdBQUcsSUFBSSxDQUFDO1lBd05SLDRCQUF1QixHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVELElBQUksY0FBYyxHQUFHLENBQUMsQ0FBQztnQkFDdkIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsY0FBYyxFQUFFLENBQUM7b0JBQ2xCLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxPQUFPLGNBQWMsQ0FBQztZQUN2QixDQUFDLENBQUMsQ0FBQztZQUVhLDBCQUFxQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyx5Q0FBeUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUF6ZXRJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBWSxFQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFZLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEseUJBQVksRUFBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBRXZELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRTVDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZELE1BQU0saUJBQWlCLENBQUM7WUFDekIsQ0FBQyxDQUFDLENBQUM7WUFFSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUMzQixJQUFJLGtDQUFrQyxHQUFHLElBQUksQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFNBQVMsQ0FDYixJQUFBLGlDQUFvQixFQUNuQjtvQkFDQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDckIsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxFQUFFLENBQUM7NEJBQ3ZELGtDQUFrQyxHQUFHLElBQUksQ0FBQzt3QkFDM0MsQ0FBQzt3QkFDRCxPQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQzs0QkFDcEQsMERBQTBEOzRCQUMxRCxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0saURBQXlDOzRCQUNyRCxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNULENBQUM7aUJBQ0QsRUFDRCxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUNWLG1FQUFtRTtvQkFDbkUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ25DLE9BQU87b0JBQ1IsQ0FBQztvQkFDRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDakUsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO3dCQUNoQix1REFBdUQ7d0JBRXZELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUUzRCxJQUFJLGtDQUFrQyxFQUFFLENBQUM7NEJBQ3hDLGtDQUFrQyxHQUFHLEtBQUssQ0FBQzs0QkFDM0MsS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFLGVBQWUsQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dDQUNoRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dDQUM3QyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQ0FDNUgsZUFBZSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dDQUMvQyxlQUFlLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ2hELENBQUM7d0JBQ0YsQ0FBQztvQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDLENBQ0QsQ0FDRCxDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sS0FBSyxDQUFDLFVBQVU7WUFDdkIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztRQUVNLEtBQUssQ0FBQyxLQUFLO1lBQ2pCLE1BQU0sSUFBQSx5QkFBWSxFQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssMkNBQW1DLENBQUMsQ0FBQztZQUNwRyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFeEQsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNoQixxQ0FBcUM7Z0JBRXJDLEtBQUssTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxRQUFnQyxDQUFDO29CQUNyQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ3BCLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLFFBQVEsR0FBRywwQ0FBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDL0QsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDaEIsQ0FBQzt5QkFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUMzQyxRQUFRLEdBQUcsMENBQXNCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQy9ELE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBQ2hCLENBQUM7eUJBQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ2hDLFFBQVEsR0FBRywwQ0FBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDL0QsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDaEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFFBQVEsR0FBRywwQ0FBc0IsQ0FBQyxJQUFJLENBQUM7d0JBQ3ZDLE9BQU8sR0FBRyxLQUFLLENBQUM7b0JBQ2pCLENBQUM7b0JBRUQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNqQyxLQUFLLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO29CQUNsQyxLQUFLLENBQUMsdUJBQXVCLEdBQUcsU0FBUyxDQUFDO29CQUMxQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3JDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztnQkFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO3dCQUM5QyxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO3dCQUNsRCxJQUFJLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO3FCQUNwQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sdUJBQXVCO1lBQzlCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVqRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzlDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRTVELE1BQU0sV0FBVyxHQUFhLEVBQUUsQ0FBQztZQUNqQyxTQUFTLG1CQUFtQixDQUFDLE1BQWdCLEVBQUUsU0FBb0I7Z0JBQ2xFLEtBQUssSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ25GLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBRTVCLEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3BDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxxQkFBUyxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BILG1CQUFtQixHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUM7Z0JBRWpFLElBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3pELENBQUM7cUJBQU0sSUFBSSxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxJQUFJLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDcEMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7WUFDRixDQUFDO1lBRUQsbUJBQW1CLENBQUMsU0FBUyxFQUFFLHFCQUFTLENBQUMsZUFBZSxDQUFDLG1CQUFtQixFQUFFLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVyRyxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTSxZQUFZLENBQUMsU0FBNEI7WUFDL0MsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFNRCxJQUFXLHNCQUFzQixLQUFjLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQXFCM0YscUJBQXFCLENBQUMsZUFBMkMsRUFBRSxXQUF1QyxFQUFFLGNBQXNCO1lBQ3pJLE1BQU0sR0FBRyxHQUFHLDhCQUFvQixDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlGLE9BQU8sSUFBSSw4QkFBb0IsQ0FDOUIsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQy9CLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTztnQkFDNUMsQ0FBQyxDQUFDLElBQUksMEJBQWdCO2dCQUNyQixzRUFBc0U7Z0JBQ3RFLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzNCLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQzVCO2dCQUNELENBQUMsQ0FBQyxDQUFDLENBQ0osRUFDRCxHQUFHLENBQUMsY0FBYyxDQUNsQixDQUFDO1FBQ0gsQ0FBQztRQW9CTSx5QkFBeUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtZQUMxRCxNQUFNLGNBQWMsR0FBRyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzdGLE1BQU0sR0FBRyxHQUFHLElBQUksMEJBQWdCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1RixPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQzVDLENBQUM7UUFFTSx5QkFBeUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtZQUMxRCxNQUFNLGNBQWMsR0FBRyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQzdGLE1BQU0sR0FBRyxHQUFHLElBQUksMEJBQWdCLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRixPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQzVDLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxTQUFvQixFQUFFLE1BQWdCO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRU0sMEJBQTBCLENBQUMsS0FBWTtZQUM3QyxNQUFNLEdBQUcsR0FBRyxJQUFJLDBCQUFnQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hHLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDNUMsQ0FBQztRQUVNLDBCQUEwQixDQUFDLEtBQVk7WUFDN0MsTUFBTSxHQUFHLEdBQUcsSUFBSSwwQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RixPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBQzVDLENBQUM7UUFFTSw2QkFBNkIsQ0FBQyxXQUFzQjtZQUMxRCx5QkFBeUI7WUFDekIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBc0NPLDRCQUE0QixDQUFDLFdBQXVDLEVBQUUsTUFBcUQsRUFBRSxFQUFnQjtZQUNwSixNQUFNLGtDQUFrQyxHQUFHLElBQUEsZ0JBQVEsRUFDbEQsTUFBTSxFQUNOLFdBQVcsRUFDWCxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUNuQixTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUM5QyxDQUFDLENBQUMsc0JBQWEsQ0FBQyx3QkFBd0I7Z0JBQ3hDLENBQUMsQ0FBQyxxQkFBUyxDQUFDLGNBQWMsQ0FDekIsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFDdEIsSUFBSSxDQUFDLFVBQVUsQ0FDZixDQUNILENBQUM7WUFFRixLQUFLLE1BQU0sR0FBRyxJQUFJLGtDQUFrQyxFQUFFLENBQUM7Z0JBQ3RELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7d0JBQ2pELGtGQUFrRjt3QkFDbEYsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQzt3QkFDaEMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFFBQVEsQ0FBQztvQkFDekMsQ0FBQztvQkFDRCxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLENBQUM7UUFDRixDQUFDO1FBRU8sWUFBWSxDQUFDLFNBQTRCLEVBQUUsZ0JBQTRDO1lBQzlGLElBQUksZ0JBQWdCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLDBDQUFzQixDQUFDLElBQUksQ0FBQztZQUNwQyxDQUFDO1lBQ0QsTUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBRXRFLFNBQVMsbUJBQW1CLENBQUMsS0FBMEM7Z0JBQ3RFLE9BQU8sSUFBQSxlQUFNLEVBQ1osZ0JBQWdCLEVBQ2hCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUNqQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQ3JCLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsT0FBTywwQ0FBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQ0QsSUFBSSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDaEQsT0FBTywwQ0FBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUc7Z0JBQ2QsMENBQXNCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2dCQUNqRiwwQ0FBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7Z0JBQ2pGLDBDQUFzQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztnQkFDbEYsMENBQXNCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDO2FBQ2xGLENBQUM7WUFFRixLQUFLLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUN4QixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDVixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN0RixNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFFakUsSUFBSSxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUM3RCxPQUFPLENBQUMsQ0FBQztvQkFDVixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTywwQ0FBc0IsQ0FBQyxZQUFZLENBQUM7UUFDNUMsQ0FBQztRQUVNLFFBQVEsQ0FBQyxTQUE0QjtZQUMzQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxJQUFJLDJCQUFrQixDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDbkUsQ0FBQztZQUNELE9BQU8sYUFBYSxDQUFDLFFBQVEsQ0FBQztRQUMvQixDQUFDO1FBRU0sUUFBUSxDQUNkLFNBQTRCLEVBQzVCLEtBQTZCLEVBQzdCLG1CQUEwQyxFQUMxQyxFQUFnQixFQUNoQixvQkFBNkIsS0FBSztZQUVsQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO2dCQUM1QixNQUFNLElBQUksMkJBQWtCLENBQUMsaUNBQWlDLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBRUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sSUFBSSwyQkFBa0IsQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FDbkUsU0FBUyxDQUFDLFNBQVMsQ0FDbkIsQ0FBQztZQUNGLE1BQU0sS0FBSyxHQUFHLElBQUksd0JBQWEsRUFBRSxDQUFDO1lBQ2xDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUVqRSxhQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDL0MsYUFBYSxDQUFDLHVCQUF1QixHQUFHLFNBQVMsQ0FBQztZQUNsRCxhQUFhLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBRTFDLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUV4RCxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUMvQixJQUFJLDRCQUE0QixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsRUFDdkksS0FBSyxDQUNMLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDekMsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxhQUFhLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFTSx5QkFBeUI7WUFDL0IsSUFBQSx3QkFBVyxFQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUNoQixtREFBbUQ7Z0JBQ25ELElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDeEMsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDbkQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLEVBQUUsQ0FBQzt3QkFDakYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsMENBQXNCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3JFLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sU0FBUyxDQUFDLFNBQTRCO1lBQzVDLE9BQU8sSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUUsQ0FBQyxPQUFPLENBQUM7UUFDekUsQ0FBQztRQUVNLGNBQWMsQ0FBQyxTQUE0QixFQUFFLFdBQXdCO1lBQzNFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFFLENBQUM7WUFDdkUsT0FBTyxXQUFXLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBQ3RFLENBQUM7UUFFTSxlQUFlLENBQUMsU0FBNEIsRUFBRSxXQUF3QixFQUFFLE9BQWdCLEVBQUUsRUFBZ0I7WUFDaEgsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUUsQ0FBQztZQUN2RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVuQyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQztnQkFDaEMsSUFBSSxzQ0FBOEI7Z0JBQ2xDLFFBQVEsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUc7Z0JBQ2xDLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQztnQkFDdkQsSUFBSTtvQkFDSCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQy9CLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQzFDLElBQUEsd0JBQVcsRUFBQyxFQUFFLENBQUMsRUFBRTs0QkFDaEIsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0NBQ3ZCLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQzs0QkFDdEMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNQLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQzs0QkFDdEMsQ0FBQzt3QkFDRixDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSTtvQkFDSCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQy9CLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQzFDLElBQUEsd0JBQVcsRUFBQyxFQUFFLENBQUMsRUFBRTs0QkFDaEIsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0NBQ3ZCLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDOzRCQUN2QyxDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBQ3ZDLENBQUM7d0JBQ0YsQ0FBQyxDQUFDLENBQUM7b0JBQ0osQ0FBQztnQkFDRixDQUFDO2FBQ0QsQ0FBQyxDQUFDO1lBRUgsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZCLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7UUFDRixDQUFDO1FBRU0sVUFBVSxDQUFDLFNBQTRCLEVBQUUsT0FBZ0IsRUFBRSxFQUFnQjtZQUNqRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRSxDQUFDO1lBQ3ZFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDckMsT0FBTztZQUNSLENBQUM7WUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFlTSxhQUFhLENBQUMsVUFBa0IsRUFBRSxNQUFlO1lBQ3ZELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsTUFBTSxNQUFNLEdBQWEsRUFBRSxDQUFDO1lBQzVCLE9BQU8sSUFBSSxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDekMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3BCLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN0QixDQUFDO1FBRU0sS0FBSyxDQUFDLGlDQUFpQztZQUM3QyxNQUFNLElBQUEseUJBQVksRUFBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLDJDQUFtQyxDQUFDLENBQUM7WUFFL0YsSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMzRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM1RCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUU1RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFeEQsTUFBTSxXQUFXLEdBQWEsRUFBRSxDQUFDO1lBQ2pDLFNBQVMsbUJBQW1CLENBQUMsTUFBZ0IsRUFBRSxTQUFvQjtnQkFDbEUsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDbkYsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUM7WUFFOUIsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNyQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztvQkFDekIsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRWxGLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxxQkFBUyxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLHFCQUFxQixFQUFFLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pKLHFCQUFxQixHQUFHLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQztnQkFFM0QsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDM0UseURBQXlEO29CQUN6RCxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQy9DLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNyRCxDQUFDO2dCQUNELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzVCLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ3BELFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0IsQ0FBQztZQUVELG1CQUFtQixDQUFDLFdBQVcsRUFBRSxxQkFBUyxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0csT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxJQUFXLGFBQWE7WUFDdkIsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFDRCxJQUFXLHVCQUF1QjtZQUNqQyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBRUQsSUFBVyx5QkFBeUI7WUFDbkMsT0FBTyxVQUFVLENBQ2hCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDbEQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQ1YsQ0FBQyxDQUFDLGFBQWE7Z0JBQ2YsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEtBQUssOENBQTBCLENBQUMsSUFBSSxDQUMxRCxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQVcsMkJBQTJCO1lBQ3JDLE9BQU8sVUFBVSxDQUNoQixJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQ2xELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNWLENBQUMsQ0FBQyxhQUFhO2dCQUNmLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxLQUFLLDhDQUEwQixDQUFDLE1BQU0sQ0FDNUQsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFXLDJCQUEyQjtZQUNyQyxPQUFPLFVBQVUsQ0FDaEIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUNsRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDVixDQUFDLENBQUMsYUFBYTtnQkFDZixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxNQUFNLENBQzVELENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBVyxxQ0FBcUM7WUFDL0MsT0FBTyxVQUFVLENBQ2hCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDbEQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQTZDLEVBQUUsRUFBRTtnQkFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssOENBQTBCLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztZQUNwRyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFXLHdDQUF3QztZQUNsRCxPQUFPLFVBQVUsQ0FDaEIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUNsRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FDVixDQUFDLENBQUMsYUFBYTtnQkFDZixDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLENBQ2xFLENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBVyxnREFBZ0Q7WUFDMUQsT0FBTyxVQUFVLENBQ2hCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDbEQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQTZDLEVBQUUsRUFBRTtnQkFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxtQkFBbUIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLDhDQUEwQixDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUM7WUFDN0gsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBVywwQ0FBMEM7WUFDcEQsT0FBTyxVQUFVLENBQ2hCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDbEQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQTZDLEVBQUUsRUFBRTtnQkFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxtQkFBbUIsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLDhDQUEwQixDQUFDLE1BQU0sQ0FBQztZQUNyRyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFXLDBDQUEwQztZQUNwRCxPQUFPLFVBQVUsQ0FDaEIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUNsRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBNkMsRUFBRSxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixPQUFPLENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLG1CQUFtQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssOENBQTBCLENBQUMsTUFBTSxDQUFDO1lBQ3JHLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQztRQUVELElBQVcsMERBQTBEO1lBQ3BFLE9BQU8sVUFBVSxDQUNoQixJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQ2xELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUE2QyxFQUFFLEVBQUU7Z0JBQ3RELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLDhDQUEwQixDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxLQUFLLDhDQUEwQixDQUFDLElBQUksQ0FBQztZQUN6SixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFXLDREQUE0RDtZQUN0RSxPQUFPLFVBQVUsQ0FDaEIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUNsRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBNkMsRUFBRSxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixPQUFPLENBQUMsQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDLHVCQUF1QixFQUFFLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxNQUFNLENBQUM7WUFDM0osQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDO1FBQ0QsSUFBVyw0REFBNEQ7WUFDdEUsT0FBTyxVQUFVLENBQ2hCLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDbEQsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQTZDLEVBQUUsRUFBRTtnQkFDdEQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssOENBQTBCLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLEtBQUssOENBQTBCLENBQUMsTUFBTSxDQUFDO1lBQzNKLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQVcsa0VBQWtFO1lBQzVFLE9BQU8sVUFBVSxDQUNoQixJQUFJLENBQUMsNkJBQTZCLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQ2xELENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUE2QyxFQUFFLEVBQUU7Z0JBQ3RELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQy9CLE9BQU8sQ0FBQyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLDhDQUEwQixDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxLQUFLLDhDQUEwQixDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyx1QkFBdUIsRUFBRSxnQkFBZ0IsQ0FBQztZQUN6TSxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUM7UUFDRCxJQUFXLCtEQUErRDtZQUN6RSxPQUFPLFVBQVUsQ0FDaEIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUNsRCxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBNkMsRUFBRSxFQUFFO2dCQUN0RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQixPQUFPLENBQUMsQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxZQUFZLElBQUksQ0FBQyxDQUFDLHVCQUF1QixFQUFFLElBQUksS0FBSyw4Q0FBMEIsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLHVCQUF1QixFQUFFLGdCQUFnQixDQUFDO1lBQ3hNLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUExc0JZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBNkIxQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEsMkJBQWdCLENBQUE7T0E5Qk4sZ0JBQWdCLENBMHNCNUI7SUFFRCxTQUFTLFVBQVUsQ0FBSSxLQUFrQixFQUFFLFNBQWdDO1FBQzFFLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNkLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxFQUFFLENBQUM7WUFDM0IsSUFBSSxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsS0FBSyxFQUFFLENBQUM7WUFDVCxDQUFDO1FBQ0YsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0scUJBQXFCO1FBQzFCLFlBQTZCLFNBQTRCO1lBQTVCLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBRWxELGFBQVEsR0FBZ0QsSUFBQSw0QkFBZSxFQUFDLGlCQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxFQUFFLDBDQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xKLGtCQUFhLEdBQWlDLElBQUEsNEJBQWUsRUFBQyx3QkFBd0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoSSxrQkFBYSxHQUFpQyxJQUFBLDRCQUFlLEVBQUMsd0JBQXdCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFaEksd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQzVCLDRCQUF1QixHQUF1QyxTQUFTLENBQUM7WUFFL0QsWUFBTyxHQUFHLElBQUEsb0JBQU8sRUFBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBVHpELENBQUM7S0FVOUQ7SUFFRCxJQUFrQixxQkFJakI7SUFKRCxXQUFrQixxQkFBcUI7UUFDdEMsaUZBQWdCLENBQUE7UUFDaEIseUVBQVksQ0FBQTtRQUNaLHlFQUFZLENBQUE7SUFDYixDQUFDLEVBSmlCLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBSXRDO0lBRUQsTUFBTSw0QkFBNEI7UUFNakMsWUFDaUIsUUFBYSxFQUNaLG1CQUE4QyxFQUM5QyxRQUF3QyxFQUN4QyxhQUFzQixFQUN0QixhQUFzQjtZQUp2QixhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ1osd0JBQW1CLEdBQW5CLG1CQUFtQixDQUEyQjtZQUM5QyxhQUFRLEdBQVIsUUFBUSxDQUFnQztZQUN4QyxrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUN0QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQVZ4QixTQUFJLEdBQUcsbUJBQW1CLENBQUM7WUFDM0IsVUFBSyxHQUFHLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFFOUQsU0FBSSx3Q0FBZ0M7UUFRaEQsQ0FBQztRQUVFLElBQUk7WUFDVixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMxRCxJQUFJLENBQUMsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDeEQsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFBQyxPQUFPO1lBQUMsQ0FBQztZQUN2QixJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25DLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNNLElBQUk7WUFDVixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMxRCxJQUFJLENBQUMsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDeEQsT0FBTztZQUNSLENBQUM7WUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFBQyxPQUFPO1lBQUMsQ0FBQztZQUN2QixJQUFBLHdCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQ2hCLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ2hELEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QifQ==