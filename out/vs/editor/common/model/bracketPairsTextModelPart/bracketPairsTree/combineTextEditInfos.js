/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/beforeEditPositionMapper", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, arrays_1, beforeEditPositionMapper_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.combineTextEditInfos = combineTextEditInfos;
    function combineTextEditInfos(textEditInfoFirst, textEditInfoSecond) {
        if (textEditInfoFirst.length === 0) {
            return textEditInfoSecond;
        }
        if (textEditInfoSecond.length === 0) {
            return textEditInfoFirst;
        }
        // s0: State before any edits
        const s0ToS1Map = new arrays_1.ArrayQueue(toLengthMapping(textEditInfoFirst));
        // s1: State after first edit, but before second edit
        const s1ToS2Map = toLengthMapping(textEditInfoSecond);
        s1ToS2Map.push({ modified: false, lengthBefore: undefined, lengthAfter: undefined }); // Copy everything from old to new
        // s2: State after both edits
        let curItem = s0ToS1Map.dequeue();
        /**
         * @param s1Length Use undefined for length "infinity"
         */
        function nextS0ToS1MapWithS1LengthOf(s1Length) {
            if (s1Length === undefined) {
                const arr = s0ToS1Map.takeWhile(v => true) || [];
                if (curItem) {
                    arr.unshift(curItem);
                }
                return arr;
            }
            const result = [];
            while (curItem && !(0, length_1.lengthIsZero)(s1Length)) {
                const [item, remainingItem] = curItem.splitAt(s1Length);
                result.push(item);
                s1Length = (0, length_1.lengthDiffNonNegative)(item.lengthAfter, s1Length);
                curItem = remainingItem ?? s0ToS1Map.dequeue();
            }
            if (!(0, length_1.lengthIsZero)(s1Length)) {
                result.push(new LengthMapping(false, s1Length, s1Length));
            }
            return result;
        }
        const result = [];
        function pushEdit(startOffset, endOffset, newLength) {
            if (result.length > 0 && (0, length_1.lengthEquals)(result[result.length - 1].endOffset, startOffset)) {
                const lastResult = result[result.length - 1];
                result[result.length - 1] = new beforeEditPositionMapper_1.TextEditInfo(lastResult.startOffset, endOffset, (0, length_1.lengthAdd)(lastResult.newLength, newLength));
            }
            else {
                result.push({ startOffset, endOffset, newLength });
            }
        }
        let s0offset = length_1.lengthZero;
        for (const s1ToS2 of s1ToS2Map) {
            const s0ToS1Map = nextS0ToS1MapWithS1LengthOf(s1ToS2.lengthBefore);
            if (s1ToS2.modified) {
                const s0Length = (0, length_1.sumLengths)(s0ToS1Map, s => s.lengthBefore);
                const s0EndOffset = (0, length_1.lengthAdd)(s0offset, s0Length);
                pushEdit(s0offset, s0EndOffset, s1ToS2.lengthAfter);
                s0offset = s0EndOffset;
            }
            else {
                for (const s1 of s0ToS1Map) {
                    const s0startOffset = s0offset;
                    s0offset = (0, length_1.lengthAdd)(s0offset, s1.lengthBefore);
                    if (s1.modified) {
                        pushEdit(s0startOffset, s0offset, s1.lengthAfter);
                    }
                }
            }
        }
        return result;
    }
    class LengthMapping {
        constructor(
        /**
         * If false, length before and length after equal.
         */
        modified, lengthBefore, lengthAfter) {
            this.modified = modified;
            this.lengthBefore = lengthBefore;
            this.lengthAfter = lengthAfter;
        }
        splitAt(lengthAfter) {
            const remainingLengthAfter = (0, length_1.lengthDiffNonNegative)(lengthAfter, this.lengthAfter);
            if ((0, length_1.lengthEquals)(remainingLengthAfter, length_1.lengthZero)) {
                return [this, undefined];
            }
            else if (this.modified) {
                return [
                    new LengthMapping(this.modified, this.lengthBefore, lengthAfter),
                    new LengthMapping(this.modified, length_1.lengthZero, remainingLengthAfter)
                ];
            }
            else {
                return [
                    new LengthMapping(this.modified, lengthAfter, lengthAfter),
                    new LengthMapping(this.modified, remainingLengthAfter, remainingLengthAfter)
                ];
            }
        }
        toString() {
            return `${this.modified ? 'M' : 'U'}:${(0, length_1.lengthToObj)(this.lengthBefore)} -> ${(0, length_1.lengthToObj)(this.lengthAfter)}`;
        }
    }
    function toLengthMapping(textEditInfos) {
        const result = [];
        let lastOffset = length_1.lengthZero;
        for (const textEditInfo of textEditInfos) {
            const spaceLength = (0, length_1.lengthDiffNonNegative)(lastOffset, textEditInfo.startOffset);
            if (!(0, length_1.lengthIsZero)(spaceLength)) {
                result.push(new LengthMapping(false, spaceLength, spaceLength));
            }
            const lengthBefore = (0, length_1.lengthDiffNonNegative)(textEditInfo.startOffset, textEditInfo.endOffset);
            result.push(new LengthMapping(true, lengthBefore, textEditInfo.newLength));
            lastOffset = textEditInfo.endOffset;
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tYmluZVRleHRFZGl0SW5mb3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJzVGV4dE1vZGVsUGFydC9icmFja2V0UGFpcnNUcmVlL2NvbWJpbmVUZXh0RWRpdEluZm9zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLG9EQXlFQztJQXpFRCxTQUFnQixvQkFBb0IsQ0FBQyxpQkFBaUMsRUFBRSxrQkFBa0M7UUFDekcsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDcEMsT0FBTyxrQkFBa0IsQ0FBQztRQUMzQixDQUFDO1FBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDckMsT0FBTyxpQkFBaUIsQ0FBQztRQUMxQixDQUFDO1FBRUQsNkJBQTZCO1FBQzdCLE1BQU0sU0FBUyxHQUFHLElBQUksbUJBQVUsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLHFEQUFxRDtRQUNyRCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsa0JBQWtCLENBQTZGLENBQUM7UUFDbEosU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtDQUFrQztRQUN4SCw2QkFBNkI7UUFFN0IsSUFBSSxPQUFPLEdBQThCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU3RDs7V0FFRztRQUNILFNBQVMsMkJBQTJCLENBQUMsUUFBNEI7WUFDaEUsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sR0FBRyxHQUFHLFNBQVMs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