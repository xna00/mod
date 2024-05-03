/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/model/editing", "vs/workbench/contrib/mergeEditor/browser/model/lineRange", "vs/workbench/contrib/mergeEditor/browser/utils", "vs/base/common/observable"], function (require, exports, arrays_1, errors_1, lifecycle_1, mapping_1, editing_1, lineRange_1, utils_1, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelDiffState = exports.TextModelDiffChangeReason = exports.TextModelDiffs = void 0;
    class TextModelDiffs extends lifecycle_1.Disposable {
        get isApplyingChange() {
            return this._barrier.isActive;
        }
        constructor(baseTextModel, textModel, diffComputer) {
            super();
            this.baseTextModel = baseTextModel;
            this.textModel = textModel;
            this.diffComputer = diffComputer;
            this._recomputeCount = 0;
            this._state = (0, observable_1.observableValue)(this, 1 /* TextModelDiffState.initializing */);
            this._diffs = (0, observable_1.observableValue)(this, []);
            this._barrier = new utils_1.ReentrancyBarrier();
            this._isDisposed = false;
            this._isInitializing = true;
            const recomputeSignal = (0, observable_1.observableSignal)('recompute');
            this._register((0, observable_1.autorun)(reader => {
                /** @description Update diff state */
                recomputeSignal.read(reader);
                this._recompute(reader);
            }));
            this._register(baseTextModel.onDidChangeContent(this._barrier.makeExclusive(() => {
                recomputeSignal.trigger(undefined);
            })));
            this._register(textModel.onDidChangeContent(this._barrier.makeExclusive(() => {
                recomputeSignal.trigger(undefined);
            })));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this._isDisposed = true;
            }));
        }
        get state() {
            return this._state;
        }
        /**
         * Diffs from base to input.
        */
        get diffs() {
            return this._diffs;
        }
        _recompute(reader) {
            this._recomputeCount++;
            const currentRecomputeIdx = this._recomputeCount;
            if (this._state.get() === 1 /* TextModelDiffState.initializing */) {
                this._isInitializing = true;
            }
            (0, observable_1.transaction)(tx => {
                /** @description Starting Diff Computation. */
                this._state.set(this._isInitializing ? 1 /* TextModelDiffState.initializing */ : 3 /* TextModelDiffState.updating */, tx, 0 /* TextModelDiffChangeReason.other */);
            });
            const result = this.diffComputer.computeDiff(this.baseTextModel, this.textModel, reader);
            result.then((result) => {
                if (this._isDisposed) {
                    return;
                }
                if (currentRecomputeIdx !== this._recomputeCount) {
                    // There is a newer recompute call
                    return;
                }
                (0, observable_1.transaction)(tx => {
                    /** @description Completed Diff Computation */
                    if (result.diffs) {
                        this._state.set(2 /* TextModelDiffState.upToDate */, tx, 1 /* TextModelDiffChangeReason.textChange */);
                        this._diffs.set(result.diffs, tx, 1 /* TextModelDiffChangeReason.textChange */);
                    }
                    else {
                        this._state.set(4 /* TextModelDiffState.error */, tx, 1 /* TextModelDiffChangeReason.textChange */);
                    }
                    this._isInitializing = false;
                });
            });
        }
        ensureUpToDate() {
            if (this.state.get() !== 2 /* TextModelDiffState.upToDate */) {
                throw new errors_1.BugIndicatingError('Cannot remove diffs when the model is not up to date');
            }
        }
        removeDiffs(diffToRemoves, transaction, group) {
            this.ensureUpToDate();
            diffToRemoves.sort((0, arrays_1.compareBy)((d) => d.inputRange.startLineNumber, arrays_1.numberComparator));
            diffToRemoves.reverse();
            let diffs = this._diffs.get();
            for (const diffToRemove of diffToRemoves) {
                // TODO improve performance
                const len = diffs.length;
                diffs = diffs.filter((d) => d !== diffToRemove);
                if (len === diffs.length) {
                    throw new errors_1.BugIndicatingError();
                }
                this._barrier.runExclusivelyOrThrow(() => {
                    const edits = diffToRemove.getReverseLineEdit().toEdits(this.textModel.getLineCount());
                    this.textModel.pushEditOperations(null, edits, () => null, group);
                });
                diffs = diffs.map((d) => d.outputRange.isAfter(diffToRemove.outputRange)
                    ? d.addOutputLineDelta(diffToRemove.inputRange.lineCount - diffToRemove.outputRange.lineCount)
                    : d);
            }
            this._diffs.set(diffs, transaction, 0 /* TextModelDiffChangeReason.other */);
        }
        /**
         * Edit must be conflict free.
         */
        applyEditRelativeToOriginal(edit, transaction, group) {
            this.ensureUpToDate();
            const editMapping = new mapping_1.DetailedLineRangeMapping(edit.range, this.baseTextModel, new lineRange_1.LineRange(edit.range.startLineNumber, edit.newLines.length), this.textModel);
            let firstAfter = false;
            let delta = 0;
            const newDiffs = new Array();
            for (const diff of this.diffs.get()) {
                if (diff.inputRange.touches(edit.range)) {
                    throw new errors_1.BugIndicatingError('Edit must be conflict free.');
                }
                else if (diff.inputRange.isAfter(edit.range)) {
                    if (!firstAfter) {
                        firstAfter = true;
                        newDiffs.push(editMapping.addOutputLineDelta(delta));
                    }
                    newDiffs.push(diff.addOutputLineDelta(edit.newLines.length - edit.range.lineCount));
                }
                else {
                    newDiffs.push(diff);
                }
                if (!firstAfter) {
                    delta += diff.outputRange.lineCount - diff.inputRange.lineCount;
                }
            }
            if (!firstAfter) {
                firstAfter = true;
                newDiffs.push(editMapping.addOutputLineDelta(delta));
            }
            this._barrier.runExclusivelyOrThrow(() => {
                const edits = new editing_1.LineRangeEdit(edit.range.delta(delta), edit.newLines).toEdits(this.textModel.getLineCount());
                this.textModel.pushEditOperations(null, edits, () => null, group);
            });
            this._diffs.set(newDiffs, transaction, 0 /* TextModelDiffChangeReason.other */);
        }
        findTouchingDiffs(baseRange) {
            return this.diffs.get().filter(d => d.inputRange.touches(baseRange));
        }
        getResultLine(lineNumber, reader) {
            let offset = 0;
            const diffs = reader ? this.diffs.read(reader) : this.diffs.get();
            for (const diff of diffs) {
                if (diff.inputRange.contains(lineNumber) || diff.inputRange.endLineNumberExclusive === lineNumber) {
                    return diff;
                }
                else if (diff.inputRange.endLineNumberExclusive < lineNumber) {
                    offset = diff.resultingDeltaFromOriginalToModified;
                }
                else {
                    break;
                }
            }
            return lineNumber + offset;
        }
        getResultLineRange(baseRange, reader) {
            let start = this.getResultLine(baseRange.startLineNumber, reader);
            if (typeof start !== 'number') {
                start = start.outputRange.startLineNumber;
            }
            let endExclusive = this.getResultLine(baseRange.endLineNumberExclusive, reader);
            if (typeof endExclusive !== 'number') {
                endExclusive = endExclusive.outputRange.endLineNumberExclusive;
            }
            return lineRange_1.LineRange.fromLineNumbers(start, endExclusive);
        }
    }
    exports.TextModelDiffs = TextModelDiffs;
    var TextModelDiffChangeReason;
    (function (TextModelDiffChangeReason) {
        TextModelDiffChangeReason[TextModelDiffChangeReason["other"] = 0] = "other";
        TextModelDiffChangeReason[TextModelDiffChangeReason["textChange"] = 1] = "textChange";
    })(TextModelDiffChangeReason || (exports.TextModelDiffChangeReason = TextModelDiffChangeReason = {}));
    var TextModelDiffState;
    (function (TextModelDiffState) {
        TextModelDiffState[TextModelDiffState["initializing"] = 1] = "initializing";
        TextModelDiffState[TextModelDiffState["upToDate"] = 2] = "upToDate";
        TextModelDiffState[TextModelDiffState["updating"] = 3] = "updating";
        TextModelDiffState[TextModelDiffState["error"] = 4] = "error";
    })(TextModelDiffState || (exports.TextModelDiffState = TextModelDiffState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsRGlmZnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvbW9kZWwvdGV4dE1vZGVsRGlmZnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQWEsY0FBZSxTQUFRLHNCQUFVO1FBUTdDLElBQVcsZ0JBQWdCO1lBQzFCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDL0IsQ0FBQztRQUVELFlBQ2tCLGFBQXlCLEVBQ3pCLFNBQXFCLEVBQ3JCLFlBQWdDO1lBRWpELEtBQUssRUFBRSxDQUFDO1lBSlMsa0JBQWEsR0FBYixhQUFhLENBQVk7WUFDekIsY0FBUyxHQUFULFNBQVMsQ0FBWTtZQUNyQixpQkFBWSxHQUFaLFlBQVksQ0FBb0I7WUFkMUMsb0JBQWUsR0FBRyxDQUFDLENBQUM7WUFDWCxXQUFNLEdBQUcsSUFBQSw0QkFBZSxFQUFnRCxJQUFJLDBDQUFrQyxDQUFDO1lBQy9HLFdBQU0sR0FBRyxJQUFBLDRCQUFlLEVBQXdELElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUxRixhQUFRLEdBQUcsSUFBSSx5QkFBaUIsRUFBRSxDQUFDO1lBQzVDLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1lBbURwQixvQkFBZSxHQUFHLElBQUksQ0FBQztZQXRDOUIsTUFBTSxlQUFlLEdBQUcsSUFBQSw2QkFBZ0IsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUV0RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsb0JBQU8sRUFBQyxNQUFNLENBQUMsRUFBRTtnQkFDL0IscUNBQXFDO2dCQUNyQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FB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