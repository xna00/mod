/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/range"], function (require, exports, arrays_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LineEdits = exports.RangeEdit = exports.LineRangeEdit = void 0;
    /**
     * Represents an edit, expressed in whole lines:
     * At (before) {@link LineRange.startLineNumber}, delete {@link LineRange.lineCount} many lines and insert {@link newLines}.
    */
    class LineRangeEdit {
        constructor(range, newLines) {
            this.range = range;
            this.newLines = newLines;
        }
        equals(other) {
            return this.range.equals(other.range) && (0, arrays_1.equals)(this.newLines, other.newLines);
        }
        toEdits(modelLineCount) {
            return new LineEdits([this]).toEdits(modelLineCount);
        }
    }
    exports.LineRangeEdit = LineRangeEdit;
    class RangeEdit {
        constructor(range, newText) {
            this.range = range;
            this.newText = newText;
        }
        equals(other) {
            return range_1.Range.equalsRange(this.range, other.range) && this.newText === other.newText;
        }
    }
    exports.RangeEdit = RangeEdit;
    class LineEdits {
        constructor(edits) {
            this.edits = edits;
        }
        toEdits(modelLineCount) {
            return this.edits.map((e) => {
                if (e.range.endLineNumberExclusive <= modelLineCount) {
                    return {
                        range: new range_1.Range(e.range.startLineNumber, 1, e.range.endLineNumberExclusive, 1),
                        text: e.newLines.map(s => s + '\n').join(''),
                    };
                }
                if (e.range.startLineNumber === 1) {
                    return {
                        range: new range_1.Range(1, 1, modelLineCount, Number.MAX_SAFE_INTEGER),
                        text: e.newLines.join('\n'),
                    };
                }
                return {
                    range: new range_1.Range(e.range.startLineNumber - 1, Number.MAX_SAFE_INTEGER, modelLineCount, Number.MAX_SAFE_INTEGER),
                    text: e.newLines.map(s => '\n' + s).join(''),
                };
            });
        }
    }
    exports.LineEdits = LineEdits;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdGluZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbWVyZ2VFZGl0b3IvYnJvd3Nlci9tb2RlbC9lZGl0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7O01BR0U7SUFDRixNQUFhLGFBQWE7UUFDekIsWUFDaUIsS0FBZ0IsRUFDaEIsUUFBa0I7WUFEbEIsVUFBSyxHQUFMLEtBQUssQ0FBVztZQUNoQixhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQy9CLENBQUM7UUFFRSxNQUFNLENBQUMsS0FBb0I7WUFDakMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksSUFBQSxlQUFNLEVBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVNLE9BQU8sQ0FBQyxjQUFzQjtZQUNwQyxPQUFPLElBQUksU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdEQsQ0FBQztLQUNEO0lBYkQsc0NBYUM7SUFFRCxNQUFhLFNBQVM7UUFDckIsWUFDaUIsS0FBWSxFQUNaLE9BQWU7WUFEZixVQUFLLEdBQUwsS0FBSyxDQUFPO1lBQ1osWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUM1QixDQUFDO1FBRUUsTUFBTSxDQUFDLEtBQWdCO1lBQzdCLE9BQU8sYUFBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDckYsQ0FBQztLQUNEO0lBVEQsOEJBU0M7SUFFRCxNQUFhLFNBQVM7UUFDckIsWUFBNEIsS0FBK0I7WUFBL0IsVUFBSyxHQUFMLEtBQUssQ0FBMEI7UUFBSSxDQUFDO1FBRXpELE9BQU8sQ0FBQyxjQUFzQjtZQUNwQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzNCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxjQUFjLEVBQUUsQ0FBQztvQkFDdEQsT0FBTzt3QkFDTixLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO3dCQUMvRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztxQkFDNUMsQ0FBQztnQkFDSCxDQUFDO2dCQUVELElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE9BQU87d0JBQ04sS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDL0QsSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztxQkFDM0IsQ0FBQztnQkFDSCxDQUFDO2dCQUVELE9BQU87b0JBQ04sS0FBSyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDL0csSUFBSSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7aUJBQzVDLENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRDtJQXpCRCw4QkF5QkMifQ==