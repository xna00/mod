/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/workbench/contrib/mergeEditor/browser/model/editing", "vs/workbench/contrib/mergeEditor/browser/model/mapping", "vs/workbench/contrib/mergeEditor/browser/utils"], function (require, exports, arrays_1, errors_1, strings_1, position_1, range_1, editing_1, mapping_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputState = exports.ModifiedBaseRangeState = exports.ModifiedBaseRangeStateUnrecognized = exports.ModifiedBaseRangeStateBoth = exports.ModifiedBaseRangeStateInput2 = exports.ModifiedBaseRangeStateInput1 = exports.ModifiedBaseRangeStateBase = exports.AbstractModifiedBaseRangeState = exports.ModifiedBaseRangeStateKind = exports.ModifiedBaseRange = void 0;
    exports.getOtherInputNumber = getOtherInputNumber;
    /**
     * Describes modifications in input 1 and input 2 for a specific range in base.
     *
     * The UI offers a mechanism to either apply all changes from input 1 or input 2 or both.
     *
     * Immutable.
    */
    class ModifiedBaseRange {
        static fromDiffs(diffs1, diffs2, baseTextModel, input1TextModel, input2TextModel) {
            const alignments = mapping_1.MappingAlignment.compute(diffs1, diffs2);
            return alignments.map((a) => new ModifiedBaseRange(a.inputRange, baseTextModel, a.output1Range, input1TextModel, a.output1LineMappings, a.output2Range, input2TextModel, a.output2LineMappings));
        }
        constructor(baseRange, baseTextModel, input1Range, input1TextModel, 
        /**
         * From base to input1
        */
        input1Diffs, input2Range, input2TextModel, 
        /**
         * From base to input2
        */
        input2Diffs) {
            this.baseRange = baseRange;
            this.baseTextModel = baseTextModel;
            this.input1Range = input1Range;
            this.input1TextModel = input1TextModel;
            this.input1Diffs = input1Diffs;
            this.input2Range = input2Range;
            this.input2TextModel = input2TextModel;
            this.input2Diffs = input2Diffs;
            this.input1CombinedDiff = mapping_1.DetailedLineRangeMapping.join(this.input1Diffs);
            this.input2CombinedDiff = mapping_1.DetailedLineRangeMapping.join(this.input2Diffs);
            this.isEqualChange = (0, arrays_1.equals)(this.input1Diffs, this.input2Diffs, (a, b) => a.getLineEdit().equals(b.getLineEdit()));
            this.smartInput1LineRangeEdit = null;
            this.smartInput2LineRangeEdit = null;
            this.dumbInput1LineRangeEdit = null;
            this.dumbInput2LineRangeEdit = null;
            if (this.input1Diffs.length === 0 && this.input2Diffs.length === 0) {
                throw new errors_1.BugIndicatingError('must have at least one diff');
            }
        }
        getInputRange(inputNumber) {
            return inputNumber === 1 ? this.input1Range : this.input2Range;
        }
        getInputCombinedDiff(inputNumber) {
            return inputNumber === 1 ? this.input1CombinedDiff : this.input2CombinedDiff;
        }
        getInputDiffs(inputNumber) {
            return inputNumber === 1 ? this.input1Diffs : this.input2Diffs;
        }
        get isConflicting() {
            return this.input1Diffs.length > 0 && this.input2Diffs.length > 0;
        }
        get canBeCombined() {
            return this.smartCombineInputs(1) !== undefined;
        }
        get isOrderRelevant() {
            const input1 = this.smartCombineInputs(1);
            const input2 = this.smartCombineInputs(2);
            if (!input1 || !input2) {
                return false;
            }
            return !input1.equals(input2);
        }
        getEditForBase(state) {
            const diffs = [];
            if (state.includesInput1 && this.input1CombinedDiff) {
                diffs.push({ diff: this.input1CombinedDiff, inputNumber: 1 });
            }
            if (state.includesInput2 && this.input2CombinedDiff) {
                diffs.push({ diff: this.input2CombinedDiff, inputNumber: 2 });
            }
            if (diffs.length === 0) {
                return { edit: undefined, effectiveState: ModifiedBaseRangeState.base };
            }
            if (diffs.length === 1) {
                return { edit: diffs[0].diff.getLineEdit(), effectiveState: ModifiedBaseRangeState.base.withInputValue(diffs[0].inputNumber, true, false) };
            }
            if (state.kind !== ModifiedBaseRangeStateKind.both) {
                throw new errors_1.BugIndicatingError();
            }
            const smartCombinedEdit = state.smartCombination ? this.smartCombineInputs(state.firstInput) : this.dumbCombineInputs(state.firstInput);
            if (smartCombinedEdit) {
                return { edit: smartCombinedEdit, effectiveState: state };
            }
            return {
                edit: diffs[getOtherInputNumber(state.firstInput) - 1].diff.getLineEdit(),
                effectiveState: ModifiedBaseRangeState.base.withInputValue(getOtherInputNumber(state.firstInput), true, false),
            };
        }
        smartCombineInputs(firstInput) {
            if (firstInput === 1 && this.smartInput1LineRangeEdit !== null) {
                return this.smartInput1LineRangeEdit;
            }
            else if (firstInput === 2 && this.smartInput2LineRangeEdit !== null) {
                return this.smartInput2LineRangeEdit;
            }
            const combinedDiffs = (0, utils_1.concatArrays)(this.input1Diffs.flatMap((diffs) => diffs.rangeMappings.map((diff) => ({ diff, input: 1 }))), this.input2Diffs.flatMap((diffs) => diffs.rangeMappings.map((diff) => ({ diff, input: 2 })))).sort((0, arrays_1.tieBreakComparators)((0, arrays_1.compareBy)((d) => d.diff.inputRange, range_1.Range.compareRangesUsingStarts), (0, arrays_1.compareBy)((d) => (d.input === firstInput ? 1 : 2), arrays_1.numberComparator)));
            const sortedEdits = combinedDiffs.map(d => {
                const sourceTextModel = d.input === 1 ? this.input1TextModel : this.input2TextModel;
                return new editing_1.RangeEdit(d.diff.inputRange, sourceTextModel.getValueInRange(d.diff.outputRange));
            });
            const result = editsToLineRangeEdit(this.baseRange, sortedEdits, this.baseTextModel);
            if (firstInput === 1) {
                this.smartInput1LineRangeEdit = result;
            }
            else {
                this.smartInput2LineRangeEdit = result;
            }
            return result;
        }
        dumbCombineInputs(firstInput) {
            if (firstInput === 1 && this.dumbInput1LineRangeEdit !== null) {
                return this.dumbInput1LineRangeEdit;
            }
            else if (firstInput === 2 && this.dumbInput2LineRangeEdit !== null) {
                return this.dumbInput2LineRangeEdit;
            }
            let input1Lines = this.input1Range.getLines(this.input1TextModel);
            let input2Lines = this.input2Range.getLines(this.input2TextModel);
            if (firstInput === 2) {
                [input1Lines, input2Lines] = [input2Lines, input1Lines];
            }
            const result = new editing_1.LineRangeEdit(this.baseRange, input1Lines.concat(input2Lines));
            if (firstInput === 1) {
                this.dumbInput1LineRangeEdit = result;
            }
            else {
                this.dumbInput2LineRangeEdit = result;
            }
            return result;
        }
    }
    exports.ModifiedBaseRange = ModifiedBaseRange;
    function editsToLineRangeEdit(range, sortedEdits, textModel) {
        let text = '';
        const startsLineBefore = range.startLineNumber > 1;
        let currentPosition = startsLineBefore
            ? new position_1.Position(range.startLineNumber - 1, textModel.getLineMaxColumn(range.startLineNumber - 1))
            : new position_1.Position(range.startLineNumber, 1);
        for (const edit of sortedEdits) {
            const diffStart = edit.range.getStartPosition();
            if (!currentPosition.isBeforeOrEqual(diffStart)) {
                return undefined;
            }
            let originalText = textModel.getValueInRange(range_1.Range.fromPositions(currentPosition, diffStart));
            if (diffStart.lineNumber > textModel.getLineCount()) {
                // assert diffStart.lineNumber === textModel.getLineCount() + 1
                // getValueInRange doesn't include this virtual line break, as the document ends the line before.
                // endsLineAfter will be false.
                originalText += '\n';
            }
            text += originalText;
            text += edit.newText;
            currentPosition = edit.range.getEndPosition();
        }
        const endsLineAfter = range.endLineNumberExclusive <= textModel.getLineCount();
        const end = endsLineAfter ? new position_1.Position(range.endLineNumberExclusive, 1) : new position_1.Position(range.endLineNumberExclusive - 1, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        const originalText = textModel.getValueInRange(range_1.Range.fromPositions(currentPosition, end));
        text += originalText;
        const lines = (0, strings_1.splitLines)(text);
        if (startsLineBefore) {
            if (lines[0] !== '') {
                return undefined;
            }
            lines.shift();
        }
        if (endsLineAfter) {
            if (lines[lines.length - 1] !== '') {
                return undefined;
            }
            lines.pop();
        }
        return new editing_1.LineRangeEdit(range, lines);
    }
    var ModifiedBaseRangeStateKind;
    (function (ModifiedBaseRangeStateKind) {
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["base"] = 0] = "base";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["input1"] = 1] = "input1";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["input2"] = 2] = "input2";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["both"] = 3] = "both";
        ModifiedBaseRangeStateKind[ModifiedBaseRangeStateKind["unrecognized"] = 4] = "unrecognized";
    })(ModifiedBaseRangeStateKind || (exports.ModifiedBaseRangeStateKind = ModifiedBaseRangeStateKind = {}));
    function getOtherInputNumber(inputNumber) {
        return inputNumber === 1 ? 2 : 1;
    }
    class AbstractModifiedBaseRangeState {
        constructor() { }
        get includesInput1() { return false; }
        get includesInput2() { return false; }
        includesInput(inputNumber) {
            return inputNumber === 1 ? this.includesInput1 : this.includesInput2;
        }
        isInputIncluded(inputNumber) {
            return inputNumber === 1 ? this.includesInput1 : this.includesInput2;
        }
        toggle(inputNumber) {
            return this.withInputValue(inputNumber, !this.includesInput(inputNumber), true);
        }
        getInput(inputNumber) {
            if (!this.isInputIncluded(inputNumber)) {
                return 0 /* InputState.excluded */;
            }
            return 1 /* InputState.first */;
        }
    }
    exports.AbstractModifiedBaseRangeState = AbstractModifiedBaseRangeState;
    class ModifiedBaseRangeStateBase extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.base; }
        toString() { return 'base'; }
        swap() { return this; }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 1) {
                return value ? new ModifiedBaseRangeStateInput1() : this;
            }
            else {
                return value ? new ModifiedBaseRangeStateInput2() : this;
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.base;
        }
    }
    exports.ModifiedBaseRangeStateBase = ModifiedBaseRangeStateBase;
    class ModifiedBaseRangeStateInput1 extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.input1; }
        get includesInput1() { return true; }
        toString() { return '1✓'; }
        swap() { return new ModifiedBaseRangeStateInput2(); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 1) {
                return value ? this : new ModifiedBaseRangeStateBase();
            }
            else {
                return value ? new ModifiedBaseRangeStateBoth(1, smartCombination) : new ModifiedBaseRangeStateInput2();
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.input1;
        }
    }
    exports.ModifiedBaseRangeStateInput1 = ModifiedBaseRangeStateInput1;
    class ModifiedBaseRangeStateInput2 extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.input2; }
        get includesInput2() { return true; }
        toString() { return '2✓'; }
        swap() { return new ModifiedBaseRangeStateInput1(); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (inputNumber === 2) {
                return value ? this : new ModifiedBaseRangeStateBase();
            }
            else {
                return value ? new ModifiedBaseRangeStateBoth(2, smartCombination) : new ModifiedBaseRangeStateInput2();
            }
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.input2;
        }
    }
    exports.ModifiedBaseRangeStateInput2 = ModifiedBaseRangeStateInput2;
    class ModifiedBaseRangeStateBoth extends AbstractModifiedBaseRangeState {
        constructor(firstInput, smartCombination) {
            super();
            this.firstInput = firstInput;
            this.smartCombination = smartCombination;
        }
        get kind() { return ModifiedBaseRangeStateKind.both; }
        get includesInput1() { return true; }
        get includesInput2() { return true; }
        toString() {
            return '2✓';
        }
        swap() { return new ModifiedBaseRangeStateBoth(getOtherInputNumber(this.firstInput), this.smartCombination); }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (value) {
                return this;
            }
            return inputNumber === 1 ? new ModifiedBaseRangeStateInput2() : new ModifiedBaseRangeStateInput1();
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.both && this.firstInput === other.firstInput && this.smartCombination === other.smartCombination;
        }
        getInput(inputNumber) {
            return inputNumber === this.firstInput ? 1 /* InputState.first */ : 2 /* InputState.second */;
        }
    }
    exports.ModifiedBaseRangeStateBoth = ModifiedBaseRangeStateBoth;
    class ModifiedBaseRangeStateUnrecognized extends AbstractModifiedBaseRangeState {
        get kind() { return ModifiedBaseRangeStateKind.unrecognized; }
        toString() { return 'unrecognized'; }
        swap() { return this; }
        withInputValue(inputNumber, value, smartCombination = false) {
            if (!value) {
                return this;
            }
            return inputNumber === 1 ? new ModifiedBaseRangeStateInput1() : new ModifiedBaseRangeStateInput2();
        }
        equals(other) {
            return other.kind === ModifiedBaseRangeStateKind.unrecognized;
        }
    }
    exports.ModifiedBaseRangeStateUnrecognized = ModifiedBaseRangeStateUnrecognized;
    var ModifiedBaseRangeState;
    (function (ModifiedBaseRangeState) {
        ModifiedBaseRangeState.base = new ModifiedBaseRangeStateBase();
        ModifiedBaseRangeState.unrecognized = new ModifiedBaseRangeStateUnrecognized();
    })(ModifiedBaseRangeState || (exports.ModifiedBaseRangeState = ModifiedBaseRangeState = {}));
    var InputState;
    (function (InputState) {
        InputState[InputState["excluded"] = 0] = "excluded";
        InputState[InputState["first"] = 1] = "first";
        InputState[InputState["second"] = 2] = "second";
        InputState[InputState["unrecognized"] = 3] = "unrecognized";
    })(InputState || (exports.InputState = InputState = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kaWZpZWRCYXNlUmFuZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21lcmdlRWRpdG9yL2Jyb3dzZXIvbW9kZWwvbW9kaWZpZWRCYXNlUmFuZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdVFoRyxrREFFQztJQTNQRDs7Ozs7O01BTUU7SUFDRixNQUFhLGlCQUFpQjtRQUN0QixNQUFNLENBQUMsU0FBUyxDQUN0QixNQUEyQyxFQUMzQyxNQUEyQyxFQUMzQyxhQUF5QixFQUN6QixlQUEyQixFQUMzQixlQUEyQjtZQUUzQixNQUFNLFVBQVUsR0FBRywwQkFBZ0IsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVELE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FDcEIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksaUJBQWlCLENBQzNCLENBQUMsQ0FBQyxVQUFVLEVBQ1osYUFBYSxFQUNiLENBQUMsQ0FBQyxZQUFZLEVBQ2QsZUFBZSxFQUNmLENBQUMsQ0FBQyxtQkFBbUIsRUFDckIsQ0FBQyxDQUFDLFlBQVksRUFDZCxlQUFlLEVBQ2YsQ0FBQyxDQUFDLG1CQUFtQixDQUNyQixDQUNELENBQUM7UUFDSCxDQUFDO1FBTUQsWUFDaUIsU0FBb0IsRUFDcEIsYUFBeUIsRUFDekIsV0FBc0IsRUFDdEIsZUFBMkI7UUFFM0M7O1VBRUU7UUFDYyxXQUFnRCxFQUNoRCxXQUFzQixFQUN0QixlQUEyQjtRQUUzQzs7VUFFRTtRQUNjLFdBQWdEO1lBZmhELGNBQVMsR0FBVCxTQUFTLENBQVc7WUFDcEIsa0JBQWEsR0FBYixhQUFhLENBQVk7WUFDekIsZ0JBQVcsR0FBWCxXQUFXLENBQVc7WUFDdEIsb0JBQWUsR0FBZixlQUFlLENBQVk7WUFLM0Is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