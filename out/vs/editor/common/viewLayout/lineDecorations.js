/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineDecorationsNormalizer = exports.DecorationSegment = exports.LineDecoration = void 0;
    class LineDecoration {
        constructor(startColumn, endColumn, className, type) {
            this.startColumn = startColumn;
            this.endColumn = endColumn;
            this.className = className;
            this.type = type;
            this._lineDecorationBrand = undefined;
        }
        static _equals(a, b) {
            return (a.startColumn === b.startColumn
                && a.endColumn === b.endColumn
                && a.className === b.className
                && a.type === b.type);
        }
        static equalsArr(a, b) {
            const aLen = a.length;
            const bLen = b.length;
            if (aLen !== bLen) {
                return false;
            }
            for (let i = 0; i < aLen; i++) {
                if (!LineDecoration._equals(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        static extractWrapped(arr, startOffset, endOffset) {
            if (arr.length === 0) {
                return arr;
            }
            const startColumn = startOffset + 1;
            const endColumn = endOffset + 1;
            const lineLength = endOffset - startOffset;
            const r = [];
            let rLength = 0;
            for (const dec of arr) {
                if (dec.endColumn <= startColumn || dec.startColumn >= endColumn) {
                    continue;
                }
                r[rLength++] = new LineDecoration(Math.max(1, dec.startColumn - startColumn + 1), Math.min(lineLength + 1, dec.endColumn - startColumn + 1), dec.className, dec.type);
            }
            return r;
        }
        static filter(lineDecorations, lineNumber, minLineColumn, maxLineColumn) {
            if (lineDecorations.length === 0) {
                return [];
            }
            const result = [];
            let resultLen = 0;
            for (let i = 0, len = lineDecorations.length; i < len; i++) {
                const d = lineDecorations[i];
                const range = d.range;
                if (range.endLineNumber < lineNumber || range.startLineNumber > lineNumber) {
                    // Ignore decorations that sit outside this line
                    continue;
                }
                if (range.isEmpty() && (d.type === 0 /* InlineDecorationType.Regular */ || d.type === 3 /* InlineDecorationType.RegularAffectingLetterSpacing */)) {
                    // Ignore empty range decorations
                    continue;
                }
                const startColumn = (range.startLineNumber === lineNumber ? range.startColumn : minLineColumn);
                const endColumn = (range.endLineNumber === lineNumber ? range.endColumn : maxLineColumn);
                result[resultLen++] = new LineDecoration(startColumn, endColumn, d.inlineClassName, d.type);
            }
            return result;
        }
        static _typeCompare(a, b) {
            const ORDER = [2, 0, 1, 3];
            return ORDER[a] - ORDER[b];
        }
        static compare(a, b) {
            if (a.startColumn !== b.startColumn) {
                return a.startColumn - b.startColumn;
            }
            if (a.endColumn !== b.endColumn) {
                return a.endColumn - b.endColumn;
            }
            const typeCmp = LineDecoration._typeCompare(a.type, b.type);
            if (typeCmp !== 0) {
                return typeCmp;
            }
            if (a.className !== b.className) {
                return a.className < b.className ? -1 : 1;
            }
            return 0;
        }
    }
    exports.LineDecoration = LineDecoration;
    class DecorationSegment {
        constructor(startOffset, endOffset, className, metadata) {
            this.startOffset = startOffset;
            this.endOffset = endOffset;
            this.className = className;
            this.metadata = metadata;
        }
    }
    exports.DecorationSegment = DecorationSegment;
    class Stack {
        constructor() {
            this.stopOffsets = [];
            this.classNames = [];
            this.metadata = [];
            this.count = 0;
        }
        static _metadata(metadata) {
            let result = 0;
            for (let i = 0, len = metadata.length; i < len; i++) {
                result |= metadata[i];
            }
            return result;
        }
        consumeLowerThan(maxStopOffset, nextStartOffset, result) {
            while (this.count > 0 && this.stopOffsets[0] < maxStopOffset) {
                let i = 0;
                // Take all equal stopping offsets
                while (i + 1 < this.count && this.stopOffsets[i] === this.stopOffsets[i + 1]) {
                    i++;
                }
                // Basically we are consuming the first i + 1 elements of the stack
                result.push(new DecorationSegment(nextStartOffset, this.stopOffsets[i], this.classNames.join(' '), Stack._metadata(this.metadata)));
                nextStartOffset = this.stopOffsets[i] + 1;
                // Consume them
                this.stopOffsets.splice(0, i + 1);
                this.classNames.splice(0, i + 1);
                this.metadata.splice(0, i + 1);
                this.count -= (i + 1);
            }
            if (this.count > 0 && nextStartOffset < maxStopOffset) {
                result.push(new DecorationSegment(nextStartOffset, maxStopOffset - 1, this.classNames.join(' '), Stack._metadata(this.metadata)));
                nextStartOffset = maxStopOffset;
            }
            return nextStartOffset;
        }
        insert(stopOffset, className, metadata) {
            if (this.count === 0 || this.stopOffsets[this.count - 1] <= stopOffset) {
                // Insert at the end
                this.stopOffsets.push(stopOffset);
                this.classNames.push(className);
                this.metadata.push(metadata);
            }
            else {
                // Find the insertion position for `stopOffset`
                for (let i = 0; i < this.count; i++) {
                    if (this.stopOffsets[i] >= stopOffset) {
                        this.stopOffsets.splice(i, 0, stopOffset);
                        this.classNames.splice(i, 0, className);
                        this.metadata.splice(i, 0, metadata);
                        break;
                    }
                }
            }
            this.count++;
            return;
        }
    }
    class LineDecorationsNormalizer {
        /**
         * Normalize line decorations. Overlapping decorations will generate multiple segments
         */
        static normalize(lineContent, lineDecorations) {
            if (lineDecorations.length === 0) {
                return [];
            }
            const result = [];
            const stack = new Stack();
            let nextStartOffset = 0;
            for (let i = 0, len = lineDecorations.length; i < len; i++) {
                const d = lineDecorations[i];
                let startColumn = d.startColumn;
                let endColumn = d.endColumn;
                const className = d.className;
                const metadata = (d.type === 1 /* InlineDecorationType.Before */
                    ? 2 /* LinePartMetadata.PSEUDO_BEFORE */
                    : d.type === 2 /* InlineDecorationType.After */
                        ? 4 /* LinePartMetadata.PSEUDO_AFTER */
                        : 0);
                // If the position would end up in the middle of a high-low surrogate pair, we move it to before the pair
                if (startColumn > 1) {
                    const charCodeBefore = lineContent.charCodeAt(startColumn - 2);
                    if (strings.isHighSurrogate(charCodeBefore)) {
                        startColumn--;
                    }
                }
                if (endColumn > 1) {
                    const charCodeBefore = lineContent.charCodeAt(endColumn - 2);
                    if (strings.isHighSurrogate(charCodeBefore)) {
                        endColumn--;
                    }
                }
                const currentStartOffset = startColumn - 1;
                const currentEndOffset = endColumn - 2;
                nextStartOffset = stack.consumeLowerThan(currentStartOffset, nextStartOffset, result);
                if (stack.count === 0) {
                    nextStartOffset = currentStartOffset;
                }
                stack.insert(currentEndOffset, className, metadata);
            }
            stack.consumeLowerThan(1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */, nextStartOffset, result);
            return result;
        }
    }
    exports.LineDecorationsNormalizer = LineDecorationsNormalizer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZURlY29yYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3ZpZXdMYXlvdXQvbGluZURlY29yYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRyxNQUFhLGNBQWM7UUFHMUIsWUFDaUIsV0FBbUIsRUFDbkIsU0FBaUIsRUFDakIsU0FBaUIsRUFDakIsSUFBMEI7WUFIMUIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLFNBQUksR0FBSixJQUFJLENBQXNCO1lBTjNDLHlCQUFvQixHQUFTLFNBQVMsQ0FBQztRQVF2QyxDQUFDO1FBRU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFpQixFQUFFLENBQWlCO1lBQzFELE9BQU8sQ0FDTixDQUFDLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxXQUFXO21CQUM1QixDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxTQUFTO21CQUMzQixDQUFDLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQyxTQUFTO21CQUMzQixDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQ3BCLENBQUM7UUFDSCxDQUFDO1FBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFtQixFQUFFLENBQW1CO1lBQy9ELE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDdEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN0QixJQUFJLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FB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