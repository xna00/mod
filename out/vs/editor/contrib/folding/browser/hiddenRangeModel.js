/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/event", "vs/editor/common/core/range", "vs/editor/common/core/eolCounter"], function (require, exports, arraysFind_1, event_1, range_1, eolCounter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HiddenRangeModel = void 0;
    class HiddenRangeModel {
        get onDidChange() { return this._updateEventEmitter.event; }
        get hiddenRanges() { return this._hiddenRanges; }
        constructor(model) {
            this._updateEventEmitter = new event_1.Emitter();
            this._hasLineChanges = false;
            this._foldingModel = model;
            this._foldingModelListener = model.onDidChange(_ => this.updateHiddenRanges());
            this._hiddenRanges = [];
            if (model.regions.length) {
                this.updateHiddenRanges();
            }
        }
        notifyChangeModelContent(e) {
            if (this._hiddenRanges.length && !this._hasLineChanges) {
                this._hasLineChanges = e.changes.some(change => {
                    return change.range.endLineNumber !== change.range.startLineNumber || (0, eolCounter_1.countEOL)(change.text)[0] !== 0;
                });
            }
        }
        updateHiddenRanges() {
            let updateHiddenAreas = false;
            const newHiddenAreas = [];
            let i = 0; // index into hidden
            let k = 0;
            let lastCollapsedStart = Number.MAX_VALUE;
            let lastCollapsedEnd = -1;
            const ranges = this._foldingModel.regions;
            for (; i < ranges.length; i++) {
                if (!ranges.isCollapsed(i)) {
                    continue;
                }
                const startLineNumber = ranges.getStartLineNumber(i) + 1; // the first line is not hidden
                const endLineNumber = ranges.getEndLineNumber(i);
                if (lastCollapsedStart <= startLineNumber && endLineNumber <= lastCollapsedEnd) {
                    // ignore ranges contained in collapsed regions
                    continue;
                }
                if (!updateHiddenAreas && k < this._hiddenRanges.length && this._hiddenRanges[k].startLineNumber === startLineNumber && this._hiddenRanges[k].endLineNumber === endLineNumber) {
                    // reuse the old ranges
                    newHiddenAreas.push(this._hiddenRanges[k]);
                    k++;
                }
                else {
                    updateHiddenAreas = true;
                    newHiddenAreas.push(new range_1.Range(startLineNumber, 1, endLineNumber, 1));
                }
                lastCollapsedStart = startLineNumber;
                lastCollapsedEnd = endLineNumber;
            }
            if (this._hasLineChanges || updateHiddenAreas || k < this._hiddenRanges.length) {
                this.applyHiddenRanges(newHiddenAreas);
            }
        }
        applyHiddenRanges(newHiddenAreas) {
            this._hiddenRanges = newHiddenAreas;
            this._hasLineChanges = false;
            this._updateEventEmitter.fire(newHiddenAreas);
        }
        hasRanges() {
            return this._hiddenRanges.length > 0;
        }
        isHidden(line) {
            return findRange(this._hiddenRanges, line) !== null;
        }
        adjustSelections(selections) {
            let hasChanges = false;
            const editorModel = this._foldingModel.textModel;
            let lastRange = null;
            const adjustLine = (line) => {
                if (!lastRange || !isInside(line, lastRange)) {
                    lastRange = findRange(this._hiddenRanges, line);
                }
                if (lastRange) {
                    return lastRange.startLineNumber - 1;
                }
                return null;
            };
            for (let i = 0, len = selections.length; i < len; i++) {
                let selection = selections[i];
                const adjustedStartLine = adjustLine(selection.startLineNumber);
                if (adjustedStartLine) {
                    selection = selection.setStartPosition(adjustedStartLine, editorModel.getLineMaxColumn(adjustedStartLine));
                    hasChanges = true;
                }
                const adjustedEndLine = adjustLine(selection.endLineNumber);
                if (adjustedEndLine) {
                    selection = selection.setEndPosition(adjustedEndLine, editorModel.getLineMaxColumn(adjustedEndLine));
                    hasChanges = true;
                }
                selections[i] = selection;
            }
            return hasChanges;
        }
        dispose() {
            if (this.hiddenRanges.length > 0) {
                this._hiddenRanges = [];
                this._updateEventEmitter.fire(this._hiddenRanges);
            }
            if (this._foldingModelListener) {
                this._foldingModelListener.dispose();
                this._foldingModelListener = null;
            }
        }
    }
    exports.HiddenRangeModel = HiddenRangeModel;
    function isInside(line, range) {
        return line >= range.startLineNumber && line <= range.endLineNumber;
    }
    function findRange(ranges, line) {
        const i = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(ranges, r => line < r.startLineNumber) - 1;
        if (i >= 0 && ranges[i].endLineNumber >= line) {
            return ranges[i];
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlkZGVuUmFuZ2VNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL2hpZGRlblJhbmdlTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsZ0JBQWdCO1FBUTVCLElBQVcsV0FBVyxLQUFzQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLElBQVcsWUFBWSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFFeEQsWUFBbUIsS0FBbUI7WUFOckIsd0JBQW1CLEdBQUcsSUFBSSxlQUFPLEVBQVksQ0FBQztZQUN2RCxvQkFBZSxHQUFZLEtBQUssQ0FBQztZQU14QyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUMzQixJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7WUFDL0UsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVNLHdCQUF3QixDQUFDLENBQTRCO1lBQzNELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQzlDLE9BQU8s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