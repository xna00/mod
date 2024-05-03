/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/editor/common/core/offsetRange", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/diff/defaultLinesDiffComputer/utils"], function (require, exports, arraysFind_1, offsetRange_1, position_1, range_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinesSliceCharSequence = void 0;
    class LinesSliceCharSequence {
        constructor(lines, lineRange, considerWhitespaceChanges) {
            // This slice has to have lineRange.length many \n! (otherwise diffing against an empty slice will be problematic)
            // (Unless it covers the entire document, in that case the other slice also has to cover the entire document ands it's okay)
            this.lines = lines;
            this.considerWhitespaceChanges = considerWhitespaceChanges;
            this.elements = [];
            this.firstCharOffsetByLine = [];
            // To account for trimming
            this.additionalOffsetByLine = [];
            // If the slice covers the end, but does not start at the beginning, we include just the \n of the previous line.
            let trimFirstLineFully = false;
            if (lineRange.start > 0 && lineRange.endExclusive >= lines.length) {
                lineRange = new offsetRange_1.OffsetRange(lineRange.start - 1, lineRange.endExclusive);
                trimFirstLineFully = true;
            }
            this.lineRange = lineRange;
            this.firstCharOffsetByLine[0] = 0;
            for (let i = this.lineRange.start; i < this.lineRange.endExclusive; i++) {
                let line = lines[i];
                let offset = 0;
                if (trimFirstLineFully) {
                    offset = line.length;
                    line = '';
                    trimFirstLineFully = false;
                }
                else if (!considerWhitespaceChanges) {
                    const trimmedStartLine = line.trimStart();
                    offset = line.length - trimmedStartLine.length;
                    line = trimmedStartLine.trimEnd();
                }
                this.additionalOffsetByLine.push(offset);
                for (let i = 0; i < line.length; i++) {
                    this.elements.push(line.charCodeAt(i));
                }
                // Don't add an \n that does not exist in the document.
                if (i < lines.length - 1) {
                    this.elements.push('\n'.charCodeAt(0));
                    this.firstCharOffsetByLine[i - this.lineRange.start + 1] = this.elements.length;
                }
            }
            // To account for the last line
            this.additionalOffsetByLine.push(0);
        }
        toString() {
            return `Slice: "${this.text}"`;
        }
        get text() {
            return this.getText(new offsetRange_1.OffsetRange(0, this.length));
        }
        getText(range) {
            return this.elements.slice(range.start, range.endExclusive).map(e => String.fromCharCode(e)).join('');
        }
        getElement(offset) {
            return this.elements[offset];
        }
        get length() {
            return this.elements.length;
        }
        getBoundaryScore(length) {
            //   a   b   c   ,           d   e   f
            // 11  0   0   12  15  6   13  0   0   11
            const prevCategory = getCategory(length > 0 ? this.elements[length - 1] : -1);
            const nextCategory = getCategory(length < this.elements.length ? this.elements[length] : -1);
            if (prevCategory === 7 /* CharBoundaryCategory.LineBreakCR */ && nextCategory === 8 /* CharBoundaryCategory.LineBreakLF */) {
                // don't break between \r and \n
                return 0;
            }
            if (prevCategory === 8 /* CharBoundaryCategory.LineBreakLF */) {
                // prefer the linebreak before the change
                return 150;
            }
            let score = 0;
            if (prevCategory !== nextCategory) {
                score += 10;
                if (prevCategory === 0 /* CharBoundaryCategory.WordLower */ && nextCategory === 1 /* CharBoundaryCategory.WordUpper */) {
                    score += 1;
                }
            }
            score += getCategoryBoundaryScore(prevCategory);
            score += getCategoryBoundaryScore(nextCategory);
            return score;
        }
        translateOffset(offset) {
            // find smallest i, so that lineBreakOffsets[i] <= offset using binary search
            if (this.lineRange.isEmpty) {
                return new position_1.Position(this.lineRange.start + 1, 1);
            }
            const i = (0, arraysFind_1.findLastIdxMonotonous)(this.firstCharOffsetByLine, (value) => value <= offset);
            return new position_1.Position(this.lineRange.start + i + 1, offset - this.firstCharOffsetByLine[i] + this.additionalOffsetByLine[i] + 1);
        }
        translateRange(range) {
            return range_1.Range.fromPositions(this.translateOffset(range.start), this.translateOffset(range.endExclusive));
        }
        /**
         * Finds the word that contains the character at the given offset
         */
        findWordContaining(offset) {
            if (offset < 0 || offset >= this.elements.length) {
                return undefined;
            }
            if (!isWordChar(this.elements[offset])) {
                return undefined;
            }
            // find start
            let start = offset;
            while (start > 0 && isWordChar(this.elements[start - 1])) {
                start--;
            }
            // find end
            let end = offset;
            while (end < this.elements.length && isWordChar(this.elements[end])) {
                end++;
            }
            return new offsetRange_1.OffsetRange(start, end);
        }
        countLinesIn(range) {
            return this.translateOffset(range.endExclusive).lineNumber - this.translateOffset(range.start).lineNumber;
        }
        isStronglyEqual(offset1, offset2) {
            return this.elements[offset1] === this.elements[offset2];
        }
        extendToFullLines(range) {
            const start = (0, arraysFind_1.findLastMonotonous)(this.firstCharOffsetByLine, x => x <= range.start) ?? 0;
            const end = (0, arraysFind_1.findFirstMonotonous)(this.firstCharOffsetByLine, x => range.endExclusive <= x) ?? this.elements.length;
            return new offsetRange_1.OffsetRange(start, end);
        }
    }
    exports.LinesSliceCharSequence = LinesSliceCharSequence;
    function isWordChar(charCode) {
        return charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */
            || charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */
            || charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */;
    }
    var CharBoundaryCategory;
    (function (CharBoundaryCategory) {
        CharBoundaryCategory[CharBoundaryCategory["WordLower"] = 0] = "WordLower";
        CharBoundaryCategory[CharBoundaryCategory["WordUpper"] = 1] = "WordUpper";
        CharBoundaryCategory[CharBoundaryCategory["WordNumber"] = 2] = "WordNumber";
        CharBoundaryCategory[CharBoundaryCategory["End"] = 3] = "End";
        CharBoundaryCategory[CharBoundaryCategory["Other"] = 4] = "Other";
        CharBoundaryCategory[CharBoundaryCategory["Separator"] = 5] = "Separator";
        CharBoundaryCategory[CharBoundaryCategory["Space"] = 6] = "Space";
        CharBoundaryCategory[CharBoundaryCategory["LineBreakCR"] = 7] = "LineBreakCR";
        CharBoundaryCategory[CharBoundaryCategory["LineBreakLF"] = 8] = "LineBreakLF";
    })(CharBoundaryCategory || (CharBoundaryCategory = {}));
    const score = {
        [0 /* CharBoundaryCategory.WordLower */]: 0,
        [1 /* CharBoundaryCategory.WordUpper */]: 0,
        [2 /* CharBoundaryCategory.WordNumber */]: 0,
        [3 /* CharBoundaryCategory.End */]: 10,
        [4 /* CharBoundaryCategory.Other */]: 2,
        [5 /* CharBoundaryCategory.Separator */]: 30,
        [6 /* CharBoundaryCategory.Space */]: 3,
        [7 /* CharBoundaryCategory.LineBreakCR */]: 10,
        [8 /* CharBoundaryCategory.LineBreakLF */]: 10,
    };
    function getCategoryBoundaryScore(category) {
        return score[category];
    }
    function getCategory(charCode) {
        if (charCode === 10 /* CharCode.LineFeed */) {
            return 8 /* CharBoundaryCategory.LineBreakLF */;
        }
        else if (charCode === 13 /* CharCode.CarriageReturn */) {
            return 7 /* CharBoundaryCategory.LineBreakCR */;
        }
        else if ((0, utils_1.isSpace)(charCode)) {
            return 6 /* CharBoundaryCategory.Space */;
        }
        else if (charCode >= 97 /* CharCode.a */ && charCode <= 122 /* CharCode.z */) {
            return 0 /* CharBoundaryCategory.WordLower */;
        }
        else if (charCode >= 65 /* CharCode.A */ && charCode <= 90 /* CharCode.Z */) {
            return 1 /* CharBoundaryCategory.WordUpper */;
        }
        else if (charCode >= 48 /* CharCode.Digit0 */ && charCode <= 57 /* CharCode.Digit9 */) {
            return 2 /* CharBoundaryCategory.WordNumber */;
        }
        else if (charCode === -1) {
            return 3 /* CharBoundaryCategory.End */;
        }
        else if (charCode === 44 /* CharCode.Comma */ || charCode === 59 /* CharCode.Semicolon */) {
            return 5 /* CharBoundaryCategory.Separator */;
        }
        else {
            return 4 /* CharBoundaryCategory.Other */;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNTbGljZUNoYXJTZXF1ZW5jZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9kaWZmL2RlZmF1bHRMaW5lc0RpZmZDb21wdXRlci9saW5lc1NsaWNlQ2hhclNlcXVlbmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLHNCQUFzQjtRQU9sQyxZQUE0QixLQUFlLEVBQUUsU0FBc0IsRUFBa0IseUJBQWtDO1lBQ3RILGtIQUFrSDtZQUNsSCw0SEFBNEg7WUFGakcsVUFBSyxHQUFMLEtBQUssQ0FBVTtZQUEwQyw4QkFBeUIsR0FBekIseUJBQXlCLENBQVM7WUFOdEcsYUFBUSxHQUFhLEVBQUUsQ0FBQztZQUN4QiwwQkFBcUIsR0FBYSxFQUFFLENBQUM7WUFFdEQsMEJBQTBCO1lBQ1QsMkJBQXNCLEdBQWEsRUFBRSxDQUFDO1lBTXRELGlIQUFpSDtZQUNqSCxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztZQUMvQixJQUFJLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxZQUFZLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNuRSxTQUFTLEdBQUcsSUFBSSx5QkFBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDekUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQzNCLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztZQUUzQixJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLElB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