/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineSequence = void 0;
    class LineSequence {
        constructor(trimmedHash, lines) {
            this.trimmedHash = trimmedHash;
            this.lines = lines;
        }
        getElement(offset) {
            return this.trimmedHash[offset];
        }
        get length() {
            return this.trimmedHash.length;
        }
        getBoundaryScore(length) {
            const indentationBefore = length === 0 ? 0 : getIndentation(this.lines[length - 1]);
            const indentationAfter = length === this.lines.length ? 0 : getIndentation(this.lines[length]);
            return 1000 - (indentationBefore + indentationAfter);
        }
        getText(range) {
            return this.lines.slice(range.start, range.endExclusive).join('\n');
        }
        isStronglyEqual(offset1, offset2) {
            return this.lines[offset1] === this.lines[offset2];
        }
    }
    exports.LineSequence = LineSequence;
    function getIndentation(str) {
        let i = 0;
        while (i < str.length && (str.charCodeAt(i) === 32 /* CharCode.Space */ || str.charCodeAt(i) === 9 /* CharCode.Tab */)) {
            i++;
        }
        return i;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVNlcXVlbmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL2RpZmYvZGVmYXVsdExpbmVzRGlmZkNvbXB1dGVyL2xpbmVTZXF1ZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxZQUFZO1FBQ3hCLFlBQ2tCLFdBQXFCLEVBQ3JCLEtBQWU7WUFEZixnQkFBVyxHQUFYLFdBQVcsQ0FBVTtZQUNyQixVQUFLLEdBQUwsS0FBSyxDQUFVO1FBQzdCLENBQUM7UUFFTCxVQUFVLENBQUMsTUFBYztZQUN4QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELElBQUksTUFBTTtZQUNULE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUVELGdCQUFnQixDQUFDLE1BQWM7WUFDOUIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDL0YsT0FBTyxJQUFJLEdBQUcsQ0FBQyxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxPQUFPLENBQUMsS0FBa0I7WUFDekIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELGVBQWUsQ0FBQyxPQUFlLEVBQUUsT0FBZTtZQUMvQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwRCxDQUFDO0tBQ0Q7SUEzQkQsb0NBMkJDO0lBRUQsU0FBUyxjQUFjLENBQUMsR0FBVztRQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsNEJBQW1CLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMseUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQ3ZHLENBQUMsRUFBRSxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sQ0FBQyxDQUFDO0lBQ1YsQ0FBQyJ9