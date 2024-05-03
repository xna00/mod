/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorColumns = void 0;
    /**
     * A column in a position is the gap between two adjacent characters. The methods here
     * work with a concept called "visible column". A visible column is a very rough approximation
     * of the horizontal screen position of a column. For example, using a tab size of 4:
     * ```txt
     * |<TAB>|<TAB>|T|ext
     * |     |     | \---- column = 4, visible column = 9
     * |     |     \------ column = 3, visible column = 8
     * |     \------------ column = 2, visible column = 4
     * \------------------ column = 1, visible column = 0
     * ```
     *
     * **NOTE**: Visual columns do not work well for RTL text or variable-width fonts or characters.
     *
     * **NOTE**: These methods work and make sense both on the model and on the view model.
     */
    class CursorColumns {
        static _nextVisibleColumn(codePoint, visibleColumn, tabSize) {
            if (codePoint === 9 /* CharCode.Tab */) {
                return CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
            }
            if (strings.isFullWidthCharacter(codePoint) || strings.isEmojiImprecise(codePoint)) {
                return visibleColumn + 2;
            }
            return visibleColumn + 1;
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        static visibleColumnFromColumn(lineContent, column, tabSize) {
            const textLen = Math.min(column - 1, lineContent.length);
            const text = lineContent.substring(0, textLen);
            const iterator = new strings.GraphemeIterator(text);
            let result = 0;
            while (!iterator.eol()) {
                const codePoint = strings.getNextCodePoint(text, textLen, iterator.offset);
                iterator.nextGraphemeLength();
                result = this._nextVisibleColumn(codePoint, result, tabSize);
            }
            return result;
        }
        /**
         * Returns the value to display as "Col" in the status bar.
         * @see {@link CursorColumns}
         */
        static toStatusbarColumn(lineContent, column, tabSize) {
            const text = lineContent.substring(0, Math.min(column - 1, lineContent.length));
            const iterator = new strings.CodePointIterator(text);
            let result = 0;
            while (!iterator.eol()) {
                const codePoint = iterator.nextCodePoint();
                if (codePoint === 9 /* CharCode.Tab */) {
                    result = CursorColumns.nextRenderTabStop(result, tabSize);
                }
                else {
                    result = result + 1;
                }
            }
            return result + 1;
        }
        /**
         * Returns a column from a visible column.
         * @see {@link CursorColumns}
         */
        static columnFromVisibleColumn(lineContent, visibleColumn, tabSize) {
            if (visibleColumn <= 0) {
                return 1;
            }
            const lineContentLength = lineContent.length;
            const iterator = new strings.GraphemeIterator(lineContent);
            let beforeVisibleColumn = 0;
            let beforeColumn = 1;
            while (!iterator.eol()) {
                const codePoint = strings.getNextCodePoint(lineContent, lineContentLength, iterator.offset);
                iterator.nextGraphemeLength();
                const afterVisibleColumn = this._nextVisibleColumn(codePoint, beforeVisibleColumn, tabSize);
                const afterColumn = iterator.offset + 1;
                if (afterVisibleColumn >= visibleColumn) {
                    const beforeDelta = visibleColumn - beforeVisibleColumn;
                    const afterDelta = afterVisibleColumn - visibleColumn;
                    if (afterDelta < beforeDelta) {
                        return afterColumn;
                    }
                    else {
                        return beforeColumn;
                    }
                }
                beforeVisibleColumn = afterVisibleColumn;
                beforeColumn = afterColumn;
            }
            // walked the entire string
            return lineContentLength + 1;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static nextRenderTabStop(visibleColumn, tabSize) {
            return visibleColumn + tabSize - visibleColumn % tabSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static nextIndentTabStop(visibleColumn, indentSize) {
            return visibleColumn + indentSize - visibleColumn % indentSize;
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static prevRenderTabStop(column, tabSize) {
            return Math.max(0, column - 1 - (column - 1) % tabSize);
        }
        /**
         * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
         * @see {@link CursorColumns}
         */
        static prevIndentTabStop(column, indentSize) {
            return Math.max(0, column - 1 - (column - 1) % indentSize);
        }
    }
    exports.CursorColumns = CursorColumns;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQ29sdW1ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi9jb3JlL2N1cnNvckNvbHVtbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBS2hHOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILE1BQWEsYUFBYTtRQUVqQixNQUFNLENBQUMsa0JBQWtCLENBQUMsU0FBaUIsRUFBRSxhQUFxQixFQUFFLE9BQWU7WUFDMUYsSUFBSSxTQUFTLHlCQUFpQixFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sYUFBYSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoRSxDQUFDO1lBQ0QsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BGLE9BQU8sYUFBYSxHQUFHLENBQUMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsT0FBTyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLENBQUM7UUFFRDs7O1dBR0c7UUFDSSxNQUFNLENBQUMsdUJBQXVCLENBQUMsV0FBbUIsRUFBRSxNQUFjLEVBQUUsT0FBZTtZQUN6RixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQy9DLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXBELElBQUksTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNmLE9BQU8sQ0FB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