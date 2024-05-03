/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range"], function (require, exports, strings, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PagedScreenReaderStrategy = exports.TextAreaState = exports._debugComposition = void 0;
    exports._debugComposition = false;
    class TextAreaState {
        static { this.EMPTY = new TextAreaState('', 0, 0, null, undefined); }
        constructor(value, 
        /** the offset where selection starts inside `value` */
        selectionStart, 
        /** the offset where selection ends inside `value` */
        selectionEnd, 
        /** the editor range in the view coordinate system that matches the selection inside `value` */
        selection, 
        /** the visible line count (wrapped, not necessarily matching \n characters) for the text in `value` before `selectionStart` */
        newlineCountBeforeSelection) {
            this.value = value;
            this.selectionStart = selectionStart;
            this.selectionEnd = selectionEnd;
            this.selection = selection;
            this.newlineCountBeforeSelection = newlineCountBeforeSelection;
        }
        toString() {
            return `[ <${this.value}>, selectionStart: ${this.selectionStart}, selectionEnd: ${this.selectionEnd}]`;
        }
        static readFromTextArea(textArea, previousState) {
            const value = textArea.getValue();
            const selectionStart = textArea.getSelectionStart();
            const selectionEnd = textArea.getSelectionEnd();
            let newlineCountBeforeSelection = undefined;
            if (previousState) {
                const valueBeforeSelectionStart = value.substring(0, selectionStart);
                const previousValueBeforeSelectionStart = previousState.value.substring(0, previousState.selectionStart);
                if (valueBeforeSelectionStart === previousValueBeforeSelectionStart) {
                    newlineCountBeforeSelection = previousState.newlineCountBeforeSelection;
                }
            }
            return new TextAreaState(value, selectionStart, selectionEnd, null, newlineCountBeforeSelection);
        }
        collapseSelection() {
            if (this.selectionStart === this.value.length) {
                return this;
            }
            return new TextAreaState(this.value, this.value.length, this.value.length, null, undefined);
        }
        writeToTextArea(reason, textArea, select) {
            if (exports._debugComposition) {
                console.log(`writeToTextArea ${reason}: ${this.toString()}`);
            }
            textArea.setValue(reason, this.value);
            if (select) {
                textArea.setSelectionRange(reason, this.selectionStart, this.selectionEnd);
            }
        }
        deduceEditorPosition(offset) {
            if (offset <= this.selectionStart) {
                const str = this.value.substring(offset, this.selectionStart);
                return this._finishDeduceEditorPosition(this.selection?.getStartPosition() ?? null, str, -1);
            }
            if (offset >= this.selectionEnd) {
                const str = this.value.substring(this.selectionEnd, offset);
                return this._finishDeduceEditorPosition(this.selection?.getEndPosition() ?? null, str, 1);
            }
            const str1 = this.value.substring(this.selectionStart, offset);
            if (str1.indexOf(String.fromCharCode(8230)) === -1) {
                return this._finishDeduceEditorPosition(this.selection?.getStartPosition() ?? null, str1, 1);
            }
            const str2 = this.value.substring(offset, this.selectionEnd);
            return this._finishDeduceEditorPosition(this.selection?.getEndPosition() ?? null, str2, -1);
        }
        _finishDeduceEditorPosition(anchor, deltaText, signum) {
            let lineFeedCnt = 0;
            let lastLineFeedIndex = -1;
            while ((lastLineFeedIndex = deltaText.indexOf('\n', lastLineFeedIndex + 1)) !== -1) {
                lineFeedCnt++;
            }
            return [anchor, signum * deltaText.length, lineFeedCnt];
        }
        static deduceInput(previousState, currentState, couldBeEmojiInput) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionStart, currentState.selectionStart);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd, currentState.value.length - currentState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            if (currentSelectionStart === currentSelectionEnd) {
                // no current selection
                const replacePreviousCharacters = (previousState.selectionStart - prefixLength);
                if (exports._debugComposition) {
                    console.log(`REMOVE PREVIOUS: ${replacePreviousCharacters} chars`);
                }
                return {
                    text: currentValue,
                    replacePrevCharCnt: replacePreviousCharacters,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            // there is a current selection => composition case
            const replacePreviousCharacters = previousSelectionEnd - previousSelectionStart;
            return {
                text: currentValue,
                replacePrevCharCnt: replacePreviousCharacters,
                replaceNextCharCnt: 0,
                positionDelta: 0
            };
        }
        static deduceAndroidCompositionInput(previousState, currentState) {
            if (!previousState) {
                // This is the EMPTY state
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: 0
                };
            }
            if (exports._debugComposition) {
                console.log('------------------------deduceAndroidCompositionInput');
                console.log(`PREVIOUS STATE: ${previousState.toString()}`);
                console.log(`CURRENT STATE: ${currentState.toString()}`);
            }
            if (previousState.value === currentState.value) {
                return {
                    text: '',
                    replacePrevCharCnt: 0,
                    replaceNextCharCnt: 0,
                    positionDelta: currentState.selectionEnd - previousState.selectionEnd
                };
            }
            const prefixLength = Math.min(strings.commonPrefixLength(previousState.value, currentState.value), previousState.selectionEnd);
            const suffixLength = Math.min(strings.commonSuffixLength(previousState.value, currentState.value), previousState.value.length - previousState.selectionEnd);
            const previousValue = previousState.value.substring(prefixLength, previousState.value.length - suffixLength);
            const currentValue = currentState.value.substring(prefixLength, currentState.value.length - suffixLength);
            const previousSelectionStart = previousState.selectionStart - prefixLength;
            const previousSelectionEnd = previousState.selectionEnd - prefixLength;
            const currentSelectionStart = currentState.selectionStart - prefixLength;
            const currentSelectionEnd = currentState.selectionEnd - prefixLength;
            if (exports._debugComposition) {
                console.log(`AFTER DIFFING PREVIOUS STATE: <${previousValue}>, selectionStart: ${previousSelectionStart}, selectionEnd: ${previousSelectionEnd}`);
                console.log(`AFTER DIFFING CURRENT STATE: <${currentValue}>, selectionStart: ${currentSelectionStart}, selectionEnd: ${currentSelectionEnd}`);
            }
            return {
                text: currentValue,
                replacePrevCharCnt: previousSelectionEnd,
                replaceNextCharCnt: previousValue.length - previousSelectionEnd,
                positionDelta: currentSelectionEnd - currentValue.length
            };
        }
    }
    exports.TextAreaState = TextAreaState;
    class PagedScreenReaderStrategy {
        static _getPageOfLine(lineNumber, linesPerPage) {
            return Math.floor((lineNumber - 1) / linesPerPage);
        }
        static _getRangeForPage(page, linesPerPage) {
            const offset = page * linesPerPage;
            const startLineNumber = offset + 1;
            const endLineNumber = offset + linesPerPage;
            return new range_1.Range(startLineNumber, 1, endLineNumber + 1, 1);
        }
        static fromEditorSelection(model, selection, linesPerPage, trimLongText) {
            // Chromium handles very poorly text even of a few thousand chars
            // Cut text to avoid stalling the entire UI
            const LIMIT_CHARS = 500;
            const selectionStartPage = PagedScreenReaderStrategy._getPageOfLine(selection.startLineNumber, linesPerPage);
            const selectionStartPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionStartPage, linesPerPage);
            const selectionEndPage = PagedScreenReaderStrategy._getPageOfLine(selection.endLineNumber, linesPerPage);
            const selectionEndPageRange = PagedScreenReaderStrategy._getRangeForPage(selectionEndPage, linesPerPage);
            let pretextRange = selectionStartPageRange.intersectRanges(new range_1.Range(1, 1, selection.startLineNumber, selection.startColumn));
            if (trimLongText && model.getValueLengthInRange(pretextRange, 1 /* EndOfLinePreference.LF */) > LIMIT_CHARS) {
                const pretextStart = model.modifyPosition(pretextRange.getEndPosition(), -LIMIT_CHARS);
                pretextRange = range_1.Range.fromPositions(pretextStart, pretextRange.getEndPosition());
            }
            const pretext = model.getValueInRange(pretextRange, 1 /* EndOfLinePreference.LF */);
            const lastLine = model.getLineCount();
            const lastLineMaxColumn = model.getLineMaxColumn(lastLine);
            let posttextRange = selectionEndPageRange.intersectRanges(new range_1.Range(selection.endLineNumber, selection.endColumn, lastLine, lastLineMaxColumn));
            if (trimLongText && model.getValueLengthInRange(posttextRange, 1 /* EndOfLinePreference.LF */) > LIMIT_CHARS) {
                const posttextEnd = model.modifyPosition(posttextRange.getStartPosition(), LIMIT_CHARS);
                posttextRange = range_1.Range.fromPositions(posttextRange.getStartPosition(), posttextEnd);
            }
            const posttext = model.getValueInRange(posttextRange, 1 /* EndOfLinePreference.LF */);
            let text;
            if (selectionStartPage === selectionEndPage || selectionStartPage + 1 === selectionEndPage) {
                // take full selection
                text = model.getValueInRange(selection, 1 /* EndOfLinePreference.LF */);
            }
            else {
                const selectionRange1 = selectionStartPageRange.intersectRanges(selection);
                const selectionRange2 = selectionEndPageRange.intersectRanges(selection);
                text = (model.getValueInRange(selectionRange1, 1 /* EndOfLinePreference.LF */)
                    + String.fromCharCode(8230)
                    + model.getValueInRange(selectionRange2, 1 /* EndOfLinePreference.LF */));
            }
            if (trimLongText && text.length > 2 * LIMIT_CHARS) {
                text = text.substring(0, LIMIT_CHARS) + String.fromCharCode(8230) + text.substring(text.length - LIMIT_CHARS, text.length);
            }
            return new TextAreaState(pretext + text + posttext, pretext.length, pretext.length + text.length, selection, pretextRange.endLineNumber - pretextRange.startLineNumber);
        }
    }
    exports.PagedScreenReaderStrategy = PagedScreenReaderStrategy;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEFyZWFTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29udHJvbGxlci90ZXh0QXJlYVN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9uRixRQUFBLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQTBCdkMsTUFBYSxhQUFhO2lCQUVGLFVBQUssR0FBRyxJQUFJLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFNUUsWUFDaUIsS0FBYTtRQUM3Qix1REFBdUQ7UUFDdkMsY0FBc0I7UUFDdEMscURBQXFEO1FBQ3JDLFlBQW9CO1FBQ3BDLCtGQUErRjtRQUMvRSxTQUF1QjtRQUN2QywrSEFBK0g7UUFDL0csMkJBQStDO1lBUi9DLFVBQUssR0FBTCxLQUFLLENBQVE7WUFFYixtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUV0QixpQkFBWSxHQUFaLFlBQVksQ0FBUTtZQUVwQixjQUFTLEdBQVQsU0FBUyxDQUFjO1lBRXZCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBb0I7UUFDNUQsQ0FBQztRQUVFLFFBQVE7WUFDZCxPQUFPLE1BQU0sSUFBSSxDQUFDLEtBQUssc0JBQXNCLElBQUksQ0FBQyxjQUFjLG1CQUFtQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUM7UUFDekcsQ0FBQztRQUVNLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUEwQixFQUFFLGFBQW1DO1lBQzdGLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNsQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNwRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsZUFBZSxFQUFFLENB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