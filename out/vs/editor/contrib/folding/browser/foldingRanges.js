/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingRegion = exports.FoldingRegions = exports.MAX_LINE_NUMBER = exports.MAX_FOLDING_REGIONS = exports.foldSourceAbbr = exports.FoldSource = void 0;
    var FoldSource;
    (function (FoldSource) {
        FoldSource[FoldSource["provider"] = 0] = "provider";
        FoldSource[FoldSource["userDefined"] = 1] = "userDefined";
        FoldSource[FoldSource["recovered"] = 2] = "recovered";
    })(FoldSource || (exports.FoldSource = FoldSource = {}));
    exports.foldSourceAbbr = {
        [0 /* FoldSource.provider */]: ' ',
        [1 /* FoldSource.userDefined */]: 'u',
        [2 /* FoldSource.recovered */]: 'r',
    };
    exports.MAX_FOLDING_REGIONS = 0xFFFF;
    exports.MAX_LINE_NUMBER = 0xFFFFFF;
    const MASK_INDENT = 0xFF000000;
    class BitField {
        constructor(size) {
            const numWords = Math.ceil(size / 32);
            this._states = new Uint32Array(numWords);
        }
        get(index) {
            const arrayIndex = (index / 32) | 0;
            const bit = index % 32;
            return (this._states[arrayIndex] & (1 << bit)) !== 0;
        }
        set(index, newState) {
            const arrayIndex = (index / 32) | 0;
            const bit = index % 32;
            const value = this._states[arrayIndex];
            if (newState) {
                this._states[arrayIndex] = value | (1 << bit);
            }
            else {
                this._states[arrayIndex] = value & ~(1 << bit);
            }
        }
    }
    class FoldingRegions {
        constructor(startIndexes, endIndexes, types) {
            if (startIndexes.length !== endIndexes.length || startIndexes.length > exports.MAX_FOLDING_REGIONS) {
                throw new Error('invalid startIndexes or endIndexes size');
            }
            this._startIndexes = startIndexes;
            this._endIndexes = endIndexes;
            this._collapseStates = new BitField(startIndexes.length);
            this._userDefinedStates = new BitField(startIndexes.length);
            this._recoveredStates = new BitField(startIndexes.length);
            this._types = types;
            this._parentsComputed = false;
        }
        ensureParentIndices() {
            if (!this._parentsComputed) {
                this._parentsComputed = true;
                const parentIndexes = [];
                const isInsideLast = (startLineNumber, endLineNumber) => {
                    const index = parentIndexes[parentIndexes.length - 1];
                    return this.getStartLineNumber(index) <= startLineNumber && this.getEndLineNumber(index) >= endLineNumber;
                };
                for (let i = 0, len = this._startIndexes.length; i < len; i++) {
                    const startLineNumber = this._startIndexes[i];
                    const endLineNumber = this._endIndexes[i];
                    if (startLineNumber > exports.MAX_LINE_NUMBER || endLineNumber > exports.MAX_LINE_NUMBER) {
                        throw new Error('startLineNumber or endLineNumber must not exceed ' + exports.MAX_LINE_NUMBER);
                    }
                    while (parentIndexes.length > 0 && !isInsideLast(startLineNumber, endLineNumber)) {
                        parentIndexes.pop();
                    }
                    const parentIndex = parentIndexes.length > 0 ? parentIndexes[parentIndexes.length - 1] : -1;
                    parentIndexes.push(i);
                    this._startIndexes[i] = startLineNumber + ((parentIndex & 0xFF) << 24);
                    this._endIndexes[i] = endLineNumber + ((parentIndex & 0xFF00) << 16);
                }
            }
        }
        get length() {
            return this._startIndexes.length;
        }
        getStartLineNumber(index) {
            return this._startIndexes[index] & exports.MAX_LINE_NUMBER;
        }
        getEndLineNumber(index) {
            return this._endIndexes[index] & exports.MAX_LINE_NUMBER;
        }
        getType(index) {
            return this._types ? this._types[index] : undefined;
        }
        hasTypes() {
            return !!this._types;
        }
        isCollapsed(index) {
            return this._collapseStates.get(index);
        }
        setCollapsed(index, newState) {
            this._collapseStates.set(index, newState);
        }
        isUserDefined(index) {
            return this._userDefinedStates.get(index);
        }
        setUserDefined(index, newState) {
            return this._userDefinedStates.set(index, newState);
        }
        isRecovered(index) {
            return this._recoveredStates.get(index);
        }
        setRecovered(index, newState) {
            return this._recoveredStates.set(index, newState);
        }
        getSource(index) {
            if (this.isUserDefined(index)) {
                return 1 /* FoldSource.userDefined */;
            }
            else if (this.isRecovered(index)) {
                return 2 /* FoldSource.recovered */;
            }
            return 0 /* FoldSource.provider */;
        }
        setSource(index, source) {
            if (source === 1 /* FoldSource.userDefined */) {
                this.setUserDefined(index, true);
                this.setRecovered(index, false);
            }
            else if (source === 2 /* FoldSource.recovered */) {
                this.setUserDefined(index, false);
                this.setRecovered(index, true);
            }
            else {
                this.setUserDefined(index, false);
                this.setRecovered(index, false);
            }
        }
        setCollapsedAllOfType(type, newState) {
            let hasChanged = false;
            if (this._types) {
                for (let i = 0; i < this._types.length; i++) {
                    if (this._types[i] === type) {
                        this.setCollapsed(i, newState);
                        hasChanged = true;
                    }
                }
            }
            return hasChanged;
        }
        toRegion(index) {
            return new FoldingRegion(this, index);
        }
        getParentIndex(index) {
            this.ensureParentIndices();
            const parent = ((this._startIndexes[index] & MASK_INDENT) >>> 24) + ((this._endIndexes[index] & MASK_INDENT) >>> 16);
            if (parent === exports.MAX_FOLDING_REGIONS) {
                return -1;
            }
            return parent;
        }
        contains(index, line) {
            return this.getStartLineNumber(index) <= line && this.getEndLineNumber(index) >= line;
        }
        findIndex(line) {
            let low = 0, high = this._startIndexes.length;
            if (high === 0) {
                return -1; // no children
            }
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                if (line < this.getStartLineNumber(mid)) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low - 1;
        }
        findRange(line) {
            let index = this.findIndex(line);
            if (index >= 0) {
                const endLineNumber = this.getEndLineNumber(index);
                if (endLineNumber >= line) {
                    return index;
                }
                index = this.getParentIndex(index);
                while (index !== -1) {
                    if (this.contains(index, line)) {
                        return index;
                    }
                    index = this.getParentIndex(index);
                }
            }
            return -1;
        }
        toString() {
            const res = [];
            for (let i = 0; i < this.length; i++) {
                res[i] = `[${exports.foldSourceAbbr[this.getSource(i)]}${this.isCollapsed(i) ? '+' : '-'}] ${this.getStartLineNumber(i)}/${this.getEndLineNumber(i)}`;
            }
            return res.join(', ');
        }
        toFoldRange(index) {
            return {
                startLineNumber: this._startIndexes[index] & exports.MAX_LINE_NUMBER,
                endLineNumber: this._endIndexes[index] & exports.MAX_LINE_NUMBER,
                type: this._types ? this._types[index] : undefined,
                isCollapsed: this.isCollapsed(index),
                source: this.getSource(index)
            };
        }
        static fromFoldRanges(ranges) {
            const rangesLength = ranges.length;
            const startIndexes = new Uint32Array(rangesLength);
            const endIndexes = new Uint32Array(rangesLength);
            let types = [];
            let gotTypes = false;
            for (let i = 0; i < rangesLength; i++) {
                const range = ranges[i];
                startIndexes[i] = range.startLineNumber;
                endIndexes[i] = range.endLineNumber;
                types.push(range.type);
                if (range.type) {
                    gotTypes = true;
                }
            }
            if (!gotTypes) {
                types = undefined;
            }
            const regions = new FoldingRegions(startIndexes, endIndexes, types);
            for (let i = 0; i < rangesLength; i++) {
                if (ranges[i].isCollapsed) {
                    regions.setCollapsed(i, true);
                }
                regions.setSource(i, ranges[i].source);
            }
            return regions;
        }
        /**
         * Two inputs, each a FoldingRegions or a FoldRange[], are merged.
         * Each input must be pre-sorted on startLineNumber.
         * The first list is assumed to always include all regions currently defined by range providers.
         * The second list only contains the previously collapsed and all manual ranges.
         * If the line position matches, the range of the new range is taken, and the range is no longer manual
         * When an entry in one list overlaps an entry in the other, the second list's entry "wins" and
         * overlapping entries in the first list are discarded.
         * Invalid entries are discarded. An entry is invalid if:
         * 		the start and end line numbers aren't a valid range of line numbers,
         * 		it is out of sequence or has the same start line as a preceding entry,
         * 		it overlaps a preceding entry and is not fully contained by that entry.
         */
        static sanitizeAndMerge(rangesA, rangesB, maxLineNumber) {
            maxLineNumber = maxLineNumber ?? Number.MAX_VALUE;
            const getIndexedFunction = (r, limit) => {
                return Array.isArray(r)
                    ? ((i) => { return (i < limit) ? r[i] : undefined; })
                    : ((i) => { return (i < limit) ? r.toFoldRange(i) : undefined; });
            };
            const getA = getIndexedFunction(rangesA, rangesA.length);
            const getB = getIndexedFunction(rangesB, rangesB.length);
            let indexA = 0;
            let indexB = 0;
            let nextA = getA(0);
            let nextB = getB(0);
            const stackedRanges = [];
            let topStackedRange;
            let prevLineNumber = 0;
            const resultRanges = [];
            while (nextA || nextB) {
                let useRange = undefined;
                if (nextB && (!nextA || nextA.startLineNumber >= nextB.startLineNumber)) {
                    if (nextA && nextA.startLineNumber === nextB.startLineNumber) {
                        if (nextB.source === 1 /* FoldSource.userDefined */) {
                            // a user defined range (possibly unfolded)
                            useRange = nextB;
                        }
                        else {
                            // a previously folded range or a (possibly unfolded) recovered range
                            useRange = nextA;
                            useRange.isCollapsed = nextB.isCollapsed && nextA.endLineNumber === nextB.endLineNumber;
                            useRange.source = 0 /* FoldSource.provider */;
                        }
                        nextA = getA(++indexA); // not necessary, just for speed
                    }
                    else {
                        useRange = nextB;
                        if (nextB.isCollapsed && nextB.source === 0 /* FoldSource.provider */) {
                            // a previously collapsed range
                            useRange.source = 2 /* FoldSource.recovered */;
                        }
                    }
                    nextB = getB(++indexB);
                }
                else {
                    // nextA is next. The user folded B set takes precedence and we sometimes need to look
                    // ahead in it to check for an upcoming conflict.
                    let scanIndex = indexB;
                    let prescanB = nextB;
                    while (true) {
                        if (!prescanB || prescanB.startLineNumber > nextA.endLineNumber) {
                            useRange = nextA;
                            break; // no conflict, use this nextA
                        }
                        if (prescanB.source === 1 /* FoldSource.userDefined */ && prescanB.endLineNumber > nextA.endLineNumber) {
                            // we found a user folded range, it wins
                            break; // without setting nextResult, so this nextA gets skipped
                        }
                        prescanB = getB(++scanIndex);
                    }
                    nextA = getA(++indexA);
                }
                if (useRange) {
                    while (topStackedRange
                        && topStackedRange.endLineNumber < useRange.startLineNumber) {
                        topStackedRange = stackedRanges.pop();
                    }
                    if (useRange.endLineNumber > useRange.startLineNumber
                        && useRange.startLineNumber > prevLineNumber
                        && useRange.endLineNumber <= maxLineNumber
                        && (!topStackedRange
                            || topStackedRange.endLineNumber >= useRange.endLineNumber)) {
                        resultRanges.push(useRange);
                        prevLineNumber = useRange.startLineNumber;
                        if (topStackedRange) {
                            stackedRanges.push(topStackedRange);
                        }
                        topStackedRange = useRange;
                    }
                }
            }
            return resultRanges;
        }
    }
    exports.FoldingRegions = FoldingRegions;
    class FoldingRegion {
        constructor(ranges, index) {
            this.ranges = ranges;
            this.index = index;
        }
        get startLineNumber() {
            return this.ranges.getStartLineNumber(this.index);
        }
        get endLineNumber() {
            return this.ranges.getEndLineNumber(this.index);
        }
        get regionIndex() {
            return this.index;
        }
        get parentIndex() {
            return this.ranges.getParentIndex(this.index);
        }
        get isCollapsed() {
            return this.ranges.isCollapsed(this.index);
        }
        containedBy(range) {
            return range.startLineNumber <= this.startLineNumber && range.endLineNumber >= this.endLineNumber;
        }
        containsLine(lineNumber) {
            return this.startLineNumber <= lineNumber && lineNumber <= this.endLineNumber;
        }
        hidesLine(lineNumber) {
            return this.startLineNumber < lineNumber && lineNumber <= this.endLineNumber;
        }
    }
    exports.FoldingRegion = FoldingRegion;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9sZGluZ1Jhbmdlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvZm9sZGluZy9icm93c2VyL2ZvbGRpbmdSYW5nZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLElBQWtCLFVBSWpCO0lBSkQsV0FBa0IsVUFBVTtRQUMzQixtREFBWSxDQUFBO1FBQ1oseURBQWUsQ0FBQTtRQUNmLHFEQUFhLENBQUE7SUFDZCxDQUFDLEVBSmlCLFVBQVUsMEJBQVYsVUFBVSxRQUkzQjtJQUVZLFFBQUEsY0FBYyxHQUFHO1FBQzdCLDZCQUFxQixFQUFFLEdBQUc7UUFDMUIsZ0NBQXdCLEVBQUUsR0FBRztRQUM3Qiw4QkFBc0IsRUFBRSxHQUFHO0tBQzNCLENBQUM7SUFVVyxRQUFBLG1CQUFtQixHQUFHLE1BQU0sQ0FBQztJQUM3QixRQUFBLGVBQWUsR0FBRyxRQUFRLENBQUM7SUFFeEMsTUFBTSxXQUFXLEdBQUcsVUFBVSxDQUFDO0lBRS9CLE1BQU0sUUFBUTtRQUViLFlBQVksSUFBWTtZQUN2QixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFTSxHQUFHLENBQUMsS0FBYTtZQUN2QixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxL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