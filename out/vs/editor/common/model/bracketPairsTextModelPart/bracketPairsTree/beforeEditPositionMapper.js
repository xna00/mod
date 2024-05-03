/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "./length"], function (require, exports, range_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BeforeEditPositionMapper = exports.TextEditInfo = void 0;
    class TextEditInfo {
        static fromModelContentChanges(changes) {
            // Must be sorted in ascending order
            const edits = changes.map(c => {
                const range = range_1.Range.lift(c.range);
                return new TextEditInfo((0, length_1.positionToLength)(range.getStartPosition()), (0, length_1.positionToLength)(range.getEndPosition()), (0, length_1.lengthOfString)(c.text));
            }).reverse();
            return edits;
        }
        constructor(startOffset, endOffset, newLength) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.newLength = newLength;
        }
        toString() {
            return `[${(0, length_1.lengthToObj)(this.startOffset)}...${(0, length_1.lengthToObj)(this.endOffset)}) -> ${(0, length_1.lengthToObj)(this.newLength)}`;
        }
    }
    exports.TextEditInfo = TextEditInfo;
    class BeforeEditPositionMapper {
        /**
         * @param edits Must be sorted by offset in ascending order.
        */
        constructor(edits) {
            this.nextEditIdx = 0;
            this.deltaOldToNewLineCount = 0;
            this.deltaOldToNewColumnCount = 0;
            this.deltaLineIdxInOld = -1;
            this.edits = edits.map(edit => TextEditInfoCache.from(edit));
        }
        /**
         * @param offset Must be equal to or greater than the last offset this method has been called with.
        */
        getOffsetBeforeChange(offset) {
            this.adjustNextEdit(offset);
            return this.translateCurToOld(offset);
        }
        /**
         * @param offset Must be equal to or greater than the last offset this method has been called with.
         * Returns null if there is no edit anymore.
        */
        getDistanceToNextChange(offset) {
            this.adjustNextEdit(offset);
            const nextEdit = this.edits[this.nextEditIdx];
            const nextChangeOffset = nextEdit ? this.translateOldToCur(nextEdit.offsetObj) : null;
            if (nextChangeOffset === null) {
                return null;
            }
            return (0, length_1.lengthDiffNonNegative)(offset, nextChangeOffset);
        }
        translateOldToCur(oldOffsetObj) {
            if (oldOffsetObj.lineCount === this.deltaLineIdxInOld) {
                return (0, length_1.toLength)(oldOffsetObj.lineCount + this.deltaOldToNewLineCount, oldOffsetObj.columnCount + this.deltaOldToNewColumnCount);
            }
            else {
                return (0, length_1.toLength)(oldOffsetObj.lineCount + this.deltaOldToNewLineCount, oldOffsetObj.columnCount);
            }
        }
        translateCurToOld(newOffset) {
            const offsetObj = (0, length_1.lengthToObj)(newOffset);
            if (offsetObj.lineCount - this.deltaOldToNewLineCount === this.deltaLineIdxInOld) {
                return (0, length_1.toLength)(offsetObj.lineCount - this.deltaOldToNewLineCount, offsetObj.columnCount - this.deltaOldToNewColumnCount);
            }
            else {
                return (0, length_1.toLength)(offsetObj.lineCount - this.deltaOldToNewLineCount, offsetObj.columnCount);
            }
        }
        adjustNextEdit(offset) {
            while (this.nextEditIdx < this.edits.length) {
                const nextEdit = this.edits[this.nextEditIdx];
                // After applying the edit, what is its end offset (considering all previous edits)?
                const nextEditEndOffsetInCur = this.translateOldToCur(nextEdit.endOffsetAfterObj);
                if ((0, length_1.lengthLessThanEqual)(nextEditEndOffsetInCur, offset)) {
                    // We are after the edit, skip it
                    this.nextEditIdx++;
                    const nextEditEndOffsetInCurObj = (0, length_1.lengthToObj)(nextEditEndOffsetInCur);
                    // Before applying the edit, what is its end offset (considering all previous edits)?
                    const nextEditEndOffsetBeforeInCurObj = (0, length_1.lengthToObj)(this.translateOldToCur(nextEdit.endOffsetBeforeObj));
                    const lineDelta = nextEditEndOffsetInCurObj.lineCount - nextEditEndOffsetBeforeInCurObj.lineCount;
                    this.deltaOldToNewLineCount += lineDelta;
                    const previousColumnDelta = this.deltaLineIdxInOld === nextEdit.endOffsetBeforeObj.lineCount ? this.deltaOldToNewColumnCount : 0;
                    const columnDelta = nextEditEndOffsetInCurObj.columnCount - nextEditEndOffsetBeforeInCurObj.columnCount;
                    this.deltaOldToNewColumnCount = previousColumnDelta + columnDelta;
                    this.deltaLineIdxInOld = nextEdit.endOffsetBeforeObj.lineCount;
                }
                else {
                    // We are in or before the edit.
                    break;
                }
            }
        }
    }
    exports.BeforeEditPositionMapper = BeforeEditPositionMapper;
    class TextEditInfoCache {
        static from(edit) {
            return new TextEditInfoCache(edit.startOffset, edit.endOffset, edit.newLength);
        }
        constructor(startOffset, endOffset, textLength) {
            this.endOffsetBeforeObj = (0, length_1.lengthToObj)(endOffset);
            this.endOffsetAfterObj = (0, length_1.lengthToObj)((0, length_1.lengthAdd)(startOffset, textLength));
            this.offsetObj = (0, length_1.lengthToObj)(startOffset);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVmb3JlRWRpdFBvc2l0aW9uTWFwcGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyc1RleHRNb2RlbFBhcnQvYnJhY2tldFBhaXJzVHJlZS9iZWZvcmVFZGl0UG9zaXRpb25NYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsWUFBWTtRQUNqQixNQUFNLENBQUMsdUJBQXVCLENBQUMsT0FBOEI7WUFDbkUsb0NBQW9DO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdCLE1BQU0sS0FBSyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLElBQUksWUFBWSxDQUN0QixJQUFBLHlCQUFnQixFQUFDLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLEVBQzFDLElBQUEseUJBQWdCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQ3hDLElBQUEsdUJBQWMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ3RCLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFlBQ2lCLFdBQW1CLEVBQ25CLFNBQWlCLEVBQ2pCLFNBQWlCO1lBRmpCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUVsQyxDQUFDO1FBRUQsUUFBUTtZQUNQLE9BQU8sSUFBSSxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLElBQUEsb0JB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