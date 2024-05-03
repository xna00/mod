/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WordSelectionRangeProvider = void 0;
    class WordSelectionRangeProvider {
        constructor(selectSubwords = true) {
            this.selectSubwords = selectSubwords;
        }
        provideSelectionRanges(model, positions) {
            const result = [];
            for (const position of positions) {
                const bucket = [];
                result.push(bucket);
                if (this.selectSubwords) {
                    this._addInWordRanges(bucket, model, position);
                }
                this._addWordRanges(bucket, model, position);
                this._addWhitespaceLine(bucket, model, position);
                bucket.push({ range: model.getFullModelRange() });
            }
            return result;
        }
        _addInWordRanges(bucket, model, pos) {
            const obj = model.getWordAtPosition(pos);
            if (!obj) {
                return;
            }
            const { word, startColumn } = obj;
            const offset = pos.column - startColumn;
            let start = offset;
            let end = offset;
            let lastCh = 0;
            // LEFT anchor (start)
            for (; start >= 0; start--) {
                const ch = word.charCodeAt(start);
                if ((start !== offset) && (ch === 95 /* CharCode.Underline */ || ch === 45 /* CharCode.Dash */)) {
                    // foo-bar OR foo_bar
                    break;
                }
                else if ((0, strings_1.isLowerAsciiLetter)(ch) && (0, strings_1.isUpperAsciiLetter)(lastCh)) {
                    // fooBar
                    break;
                }
                lastCh = ch;
            }
            start += 1;
            // RIGHT anchor (end)
            for (; end < word.length; end++) {
                const ch = word.charCodeAt(end);
                if ((0, strings_1.isUpperAsciiLetter)(ch) && (0, strings_1.isLowerAsciiLetter)(lastCh)) {
                    // fooBar
                    break;
                }
                else if (ch === 95 /* CharCode.Underline */ || ch === 45 /* CharCode.Dash */) {
                    // foo-bar OR foo_bar
                    break;
                }
                lastCh = ch;
            }
            if (start < end) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, startColumn + start, pos.lineNumber, startColumn + end) });
            }
        }
        _addWordRanges(bucket, model, pos) {
            const word = model.getWordAtPosition(pos);
            if (word) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn) });
            }
        }
        _addWhitespaceLine(bucket, model, pos) {
            if (model.getLineLength(pos.lineNumber) > 0
                && model.getLineFirstNonWhitespaceColumn(pos.lineNumber) === 0
                && model.getLineLastNonWhitespaceColumn(pos.lineNumber) === 0) {
                bucket.push({ range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, model.getLineMaxColumn(pos.lineNumber)) });
            }
        }
    }
    exports.WordSelectionRangeProvider = WordSelectionRangeProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZFNlbGVjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3NtYXJ0U2VsZWN0L2Jyb3dzZXIvd29yZFNlbGVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsMEJBQTBCO1FBRXRDLFlBQTZCLGlCQUFpQixJQUFJO1lBQXJCLG1CQUFjLEdBQWQsY0FBYyxDQUFPO1FBQUksQ0FBQztRQUV2RCxzQkFBc0IsQ0FBQyxLQUFpQixFQUFFLFNBQXFCO1lBQzlELE1BQU0sTUFBTSxHQUF1QixFQUFFLENBQUM7WUFDdEMsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxNQUFNLEdBQXFCLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2pELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFDRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxNQUF3QixFQUFFLEtBQWlCLEVBQUUsR0FBYTtZQUNsRixNQUFNLEdB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