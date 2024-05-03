/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textEdit"], function (require, exports, arrays_1, strings_1, position_1, range_1, textEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextReplacement = exports.GhostTextPart = exports.GhostText = void 0;
    exports.ghostTextsOrReplacementsEqual = ghostTextsOrReplacementsEqual;
    exports.ghostTextOrReplacementEquals = ghostTextOrReplacementEquals;
    class GhostText {
        constructor(lineNumber, parts) {
            this.lineNumber = lineNumber;
            this.parts = parts;
        }
        equals(other) {
            return this.lineNumber === other.lineNumber &&
                this.parts.length === other.parts.length &&
                this.parts.every((part, index) => part.equals(other.parts[index]));
        }
        /**
         * Only used for testing/debugging.
        */
        render(documentText, debug = false) {
            return new textEdit_1.TextEdit([
                ...this.parts.map(p => new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(new position_1.Position(this.lineNumber, p.column)), debug ? `[${p.lines.join('\n')}]` : p.lines.join('\n'))),
            ]).applyToString(documentText);
        }
        renderForScreenReader(lineText) {
            if (this.parts.length === 0) {
                return '';
            }
            const lastPart = this.parts[this.parts.length - 1];
            const cappedLineText = lineText.substr(0, lastPart.column - 1);
            const text = new textEdit_1.TextEdit([
                ...this.parts.map(p => new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(new position_1.Position(1, p.column)), p.lines.join('\n'))),
            ]).applyToString(cappedLineText);
            return text.substring(this.parts[0].column - 1);
        }
        isEmpty() {
            return this.parts.every(p => p.lines.length === 0);
        }
        get lineCount() {
            return 1 + this.parts.reduce((r, p) => r + p.lines.length - 1, 0);
        }
    }
    exports.GhostText = GhostText;
    class GhostTextPart {
        constructor(column, text, 
        /**
         * Indicates if this part is a preview of an inline suggestion when a suggestion is previewed.
        */
        preview) {
            this.column = column;
            this.text = text;
            this.preview = preview;
            this.lines = (0, strings_1.splitLines)(this.text);
        }
        ;
        equals(other) {
            return this.column === other.column &&
                this.lines.length === other.lines.length &&
                this.lines.every((line, index) => line === other.lines[index]);
        }
    }
    exports.GhostTextPart = GhostTextPart;
    class GhostTextReplacement {
        constructor(lineNumber, columnRange, text, additionalReservedLineCount = 0) {
            this.lineNumber = lineNumber;
            this.columnRange = columnRange;
            this.text = text;
            this.additionalReservedLineCount = additionalReservedLineCount;
            this.parts = [
                new GhostTextPart(this.columnRange.endColumnExclusive, this.text, false),
            ];
            this.newLines = (0, strings_1.splitLines)(this.text);
        }
        renderForScreenReader(_lineText) {
            return this.newLines.join('\n');
        }
        render(documentText, debug = false) {
            const replaceRange = this.columnRange.toRange(this.lineNumber);
            if (debug) {
                return new textEdit_1.TextEdit([
                    new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(replaceRange.getStartPosition()), '('),
                    new textEdit_1.SingleTextEdit(range_1.Range.fromPositions(replaceRange.getEndPosition()), `)[${this.newLines.join('\n')}]`),
                ]).applyToString(documentText);
            }
            else {
                return new textEdit_1.TextEdit([
                    new textEdit_1.SingleTextEdit(replaceRange, this.newLines.join('\n')),
                ]).applyToString(documentText);
            }
        }
        get lineCount() {
            return this.newLines.length;
        }
        isEmpty() {
            return this.parts.every(p => p.lines.length === 0);
        }
        equals(other) {
            return this.lineNumber === other.lineNumber &&
                this.columnRange.equals(other.columnRange) &&
                this.newLines.length === other.newLines.length &&
                this.newLines.every((line, index) => line === other.newLines[index]) &&
                this.additionalReservedLineCount === other.additionalReservedLineCount;
        }
    }
    exports.GhostTextReplacement = GhostTextReplacement;
    function ghostTextsOrReplacementsEqual(a, b) {
        return (0, arrays_1.equals)(a, b, ghostTextOrReplacementEquals);
    }
    function ghostTextOrReplacementEquals(a, b) {
        if (a === b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        if (a instanceof GhostText && b instanceof GhostText) {
            return a.equals(b);
        }
        if (a instanceof GhostTextReplacement && b instanceof GhostTextReplacement) {
            return a.equals(b);
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2hvc3RUZXh0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9pbmxpbmVDb21wbGV0aW9ucy9icm93c2VyL2dob3N0VGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3SWhHLHNFQUVDO0lBRUQsb0VBY0M7SUFqSkQsTUFBYSxTQUFTO1FBQ3JCLFlBQ2lCLFVBQWtCLEVBQ2xCLEtBQXNCO1lBRHRCLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDbEIsVUFBSyxHQUFMLEtBQUssQ0FBaUI7UUFFdkMsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFnQjtZQUN0QixPQUFPLElBQUksQ0FBQyxVQUFVLEtBQUssS0FBSyxDQUFDLFVBQVU7Z0JBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTTtnQkFDeEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JFLENBQUM7UUFFRDs7VUFFRTtRQUNGLE1BQU0sQ0FBQyxZQUFvQixFQUFFLFFBQWlCLEtBQUs7WUFDbEQsT0FBTyxJQUFJLG1CQUFRLENBQUM7Z0JBQ25CLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLHlCQUFjLENBQ3hDLGFBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxtQkFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQzVELEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFD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