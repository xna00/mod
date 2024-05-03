/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/diff/diff", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/core/textLength", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/browser/ghostText"], function (require, exports, diff_1, strings_1, range_1, textLength_1, textEdit_1, ghostText_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.singleTextRemoveCommonPrefix = singleTextRemoveCommonPrefix;
    exports.singleTextEditAugments = singleTextEditAugments;
    exports.computeGhostText = computeGhostText;
    function singleTextRemoveCommonPrefix(edit, model, validModelRange) {
        const modelRange = validModelRange ? edit.range.intersectRanges(validModelRange) : edit.range;
        if (!modelRange) {
            return edit;
        }
        const valueToReplace = model.getValueInRange(modelRange, 1 /* EndOfLinePreference.LF */);
        const commonPrefixLen = (0, strings_1.commonPrefixLength)(valueToReplace, edit.text);
        const start = textLength_1.TextLength.ofText(valueToReplace.substring(0, commonPrefixLen)).addToPosition(edit.range.getStartPosition());
        const text = edit.text.substring(commonPrefixLen);
        const range = range_1.Range.fromPositions(start, edit.range.getEndPosition());
        return new textEdit_1.SingleTextEdit(range, text);
    }
    function singleTextEditAugments(edit, base) {
        // The augmented completion must replace the base range, but can replace even more
        return edit.text.startsWith(base.text) && rangeExtends(edit.range, base.range);
    }
    /**
     * @param previewSuffixLength Sets where to split `inlineCompletion.text`.
     * 	If the text is `hello` and the suffix length is 2, the non-preview part is `hel` and the preview-part is `lo`.
    */
    function computeGhostText(edit, model, mode, cursorPosition, previewSuffixLength = 0) {
        let e = singleTextRemoveCommonPrefix(edit, model);
        if (e.range.endLineNumber !== e.range.startLineNumber) {
            // This edit might span multiple lines, but the first lines must be a common prefix.
            return undefined;
        }
        const sourceLine = model.getLineContent(e.range.startLineNumber);
        const sourceIndentationLength = (0, strings_1.getLeadingWhitespace)(sourceLine).length;
        const suggestionTouchesIndentation = e.range.startColumn - 1 <= sourceIndentationLength;
        if (suggestionTouchesIndentation) {
            // source:      ··········[······abc]
            //                         ^^^^^^^^^ inlineCompletion.range
            //              ^^^^^^^^^^ ^^^^^^ sourceIndentationLength
            //                         ^^^^^^ replacedIndentation.length
            //                               ^^^ rangeThatDoesNotReplaceIndentation
            // inlineCompletion.text: '··foo'
            //                         ^^ suggestionAddedIndentationLength
            const suggestionAddedIndentationLength = (0, strings_1.getLeadingWhitespace)(e.text).length;
            const replacedIndentation = sourceLine.substring(e.range.startColumn - 1, sourceIndentationLength);
            const [startPosition, endPosition] = [e.range.getStartPosition(), e.range.getEndPosition()];
            const newStartPosition = startPosition.column + replacedIndentation.length <= endPosition.column
                ? startPosition.delta(0, replacedIndentation.length)
                : endPosition;
            const rangeThatDoesNotReplaceIndentation = range_1.Range.fromPositions(newStartPosition, endPosition);
            const suggestionWithoutIndentationChange = e.text.startsWith(replacedIndentation)
                // Adds more indentation without changing existing indentation: We can add ghost text for this
                ? e.text.substring(replacedIndentation.length)
                // Changes or removes existing indentation. Only add ghost text for the non-indentation part.
                : e.text.substring(suggestionAddedIndentationLength);
            e = new textEdit_1.SingleTextEdit(rangeThatDoesNotReplaceIndentation, suggestionWithoutIndentationChange);
        }
        // This is a single line string
        const valueToBeReplaced = model.getValueInRange(e.range);
        const changes = cachingDiff(valueToBeReplaced, e.text);
        if (!changes) {
            // No ghost text in case the diff would be too slow to compute
            return undefined;
        }
        const lineNumber = e.range.startLineNumber;
        const parts = new Array();
        if (mode === 'prefix') {
            const filteredChanges = changes.filter(c => c.originalLength === 0);
            if (filteredChanges.length > 1 || filteredChanges.length === 1 && filteredChanges[0].originalStart !== valueToBeReplaced.length) {
                // Prefixes only have a single change.
                return undefined;
            }
        }
        const previewStartInCompletionText = e.text.length - previewSuffixLength;
        for (const c of changes) {
            const insertColumn = e.range.startColumn + c.originalStart + c.originalLength;
            if (mode === 'subwordSmart' && cursorPosition && cursorPosition.lineNumber === e.range.startLineNumber && insertColumn < cursorPosition.column) {
                // No ghost text before cursor
                return undefined;
            }
            if (c.originalLength > 0) {
                return undefined;
            }
            if (c.modifiedLength === 0) {
                continue;
            }
            const modifiedEnd = c.modifiedStart + c.modifiedLength;
            const nonPreviewTextEnd = Math.max(c.modifiedStart, Math.min(modifiedEnd, previewStartInCompletionText));
            const nonPreviewText = e.text.substring(c.modifiedStart, nonPreviewTextEnd);
            const italicText = e.text.substring(nonPreviewTextEnd, Math.max(c.modifiedStart, modifiedEnd));
            if (nonPreviewText.length > 0) {
                parts.push(new ghostText_1.GhostTextPart(insertColumn, nonPreviewText, false));
            }
            if (italicText.length > 0) {
                parts.push(new ghostText_1.GhostTextPart(insertColumn, italicText, true));
            }
        }
        return new ghostText_1.GhostText(lineNumber, parts);
    }
    function rangeExtends(extendingRange, rangeToExtend) {
        return rangeToExtend.getStartPosition().equals(extendingRange.getStartPosition())
            && rangeToExtend.getEndPosition().isBeforeOrEqual(extendingRange.getEndPosition());
    }
    let lastRequest = undefined;
    function cachingDiff(originalValue, newValue) {
        if (lastRequest?.originalValue === originalValue && lastRequest?.newValue === newValue) {
            return lastRequest?.changes;
        }
        else {
            let changes = smartDiff(originalValue, newValue, true);
            if (changes) {
                const deletedChars = deletedCharacters(changes);
                if (deletedChars > 0) {
                    // For performance reasons, don't compute diff if there is nothing to improve
                    const newChanges = smartDiff(originalValue, newValue, false);
                    if (newChanges && deletedCharacters(newChanges) < deletedChars) {
                        // Disabling smartness seems to be better here
                        changes = newChanges;
                    }
                }
            }
            lastRequest = {
                originalValue,
                newValue,
                changes
            };
            return changes;
        }
    }
    function deletedCharacters(changes) {
        let sum = 0;
        for (const c of changes) {
            sum += c.originalLength;
        }
        return sum;
    }
    /**
     * When matching `if ()` with `if (f() = 1) { g(); }`,
     * align it like this:        `if (       )`
     * Not like this:			  `if (  )`
     * Also not like this:		  `if (             )`.
     *
     * The parenthesis are preprocessed to ensure that they match correctly.
     */
    function smartDiff(originalValue, newValue, smartBracketMatching) {
        if (originalValue.length > 5000 || newValue.length > 5000) {
            // We don't want to work on strings that are too big
            return undefined;
        }
        function getMaxCharCode(val) {
            let maxCharCode = 0;
            for (let i = 0, len = val.length; i < len; i++) {
                const charCode = val.charCodeAt(i);
                if (charCode > maxCharCode) {
                    maxCharCode = charCode;
                }
            }
            return maxCharCode;
        }
        const maxCharCode = Math.max(getMaxCharCode(originalValue), getMaxCharCode(newValue));
        function getUniqueCharCode(id) {
            if (id < 0) {
                throw new Error('unexpected');
            }
            return maxCharCode + id + 1;
        }
        function getElements(source) {
            let level = 0;
            let group = 0;
            const characters = new Int32Array(source.length);
            for (let i = 0, len = source.length; i < len; i++) {
                // TODO support more brackets
                if (smartBracketMatching && source[i] === '(') {
                    const id = group * 100 + level;
                    characters[i] = getUniqueCharCode(2 * id);
                    level++;
                }
                else if (smartBracketMatching && source[i] === ')') {
                    level = Math.max(level - 1, 0);
                    const id = group * 100 + level;
                    characters[i] = getUniqueCharCode(2 * id + 1);
                    if (level === 0) {
                        group++;
                    }
                }
                else {
                    characters[i] = source.charCodeAt(i);
                }
            }
            return characters;
        }
        const elements1 = getElements(originalValue);
        const elements2 = getElements(newValue);
        return new diff_1.LcsDiff({ getElements: () => elements1 }, { getElements: () => elements2 }).ComputeDiff(false).changes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2luZ2xlVGV4dEVkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvc2luZ2xlVGV4dEVkaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsb0VBV0M7SUFFRCx3REFHQztJQU1ELDRDQXVHQztJQTdIRCxTQUFnQiw0QkFBNEIsQ0FBQyxJQUFvQixFQUFFLEtBQWlCLEVBQUUsZUFBdUI7UUFDNUcsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUM5RixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDakIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxVQUFVLGlDQUF5QixDQUFDO1FBQ2pGLE1BQU0sZUFBZSxHQUFHLElBQUEsNEJBQWtCLEVBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN0RSxNQUFNLEtBQUssR0FBRyx1QkFBVSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUMzSCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsRCxNQUFNLEtBQUssR0FBRyxhQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxD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