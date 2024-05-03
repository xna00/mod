/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/core/position", "vs/editor/common/tokens/contiguousTokensEditing", "vs/editor/common/tokens/lineTokens", "vs/editor/common/encodedTokenAttributes"], function (require, exports, arrays, position_1, contiguousTokensEditing_1, lineTokens_1, encodedTokenAttributes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContiguousTokensStore = void 0;
    /**
     * Represents contiguous tokens in a text model.
     */
    class ContiguousTokensStore {
        constructor(languageIdCodec) {
            this._lineTokens = [];
            this._len = 0;
            this._languageIdCodec = languageIdCodec;
        }
        flush() {
            this._lineTokens = [];
            this._len = 0;
        }
        get hasTokens() {
            return this._lineTokens.length > 0;
        }
        getTokens(topLevelLanguageId, lineIndex, lineText) {
            let rawLineTokens = null;
            if (lineIndex < this._len) {
                rawLineTokens = this._lineTokens[lineIndex];
            }
            if (rawLineTokens !== null && rawLineTokens !== contiguousTokensEditing_1.EMPTY_LINE_TOKENS) {
                return new lineTokens_1.LineTokens((0, contiguousTokensEditing_1.toUint32Array)(rawLineTokens), lineText, this._languageIdCodec);
            }
            const lineTokens = new Uint32Array(2);
            lineTokens[0] = lineText.length;
            lineTokens[1] = getDefaultMetadata(this._languageIdCodec.encodeLanguageId(topLevelLanguageId));
            return new lineTokens_1.LineTokens(lineTokens, lineText, this._languageIdCodec);
        }
        static _massageTokens(topLevelLanguageId, lineTextLength, _tokens) {
            const tokens = _tokens ? (0, contiguousTokensEditing_1.toUint32Array)(_tokens) : null;
            if (lineTextLength === 0) {
                let hasDifferentLanguageId = false;
                if (tokens && tokens.length > 1) {
                    hasDifferentLanguageId = (encodedTokenAttributes_1.TokenMetadata.getLanguageId(tokens[1]) !== topLevelLanguageId);
                }
                if (!hasDifferentLanguageId) {
                    return contiguousTokensEditing_1.EMPTY_LINE_TOKENS;
                }
            }
            if (!tokens || tokens.length === 0) {
                const tokens = new Uint32Array(2);
                tokens[0] = lineTextLength;
                tokens[1] = getDefaultMetadata(topLevelLanguageId);
                return tokens.buffer;
            }
            // Ensure the last token covers the end of the text
            tokens[tokens.length - 2] = lineTextLength;
            if (tokens.byteOffset === 0 && tokens.byteLength === tokens.buffer.byteLength) {
                // Store directly the ArrayBuffer pointer to save an object
                return tokens.buffer;
            }
            return tokens;
        }
        _ensureLine(lineIndex) {
            while (lineIndex >= this._len) {
                this._lineTokens[this._len] = null;
                this._len++;
            }
        }
        _deleteLines(start, deleteCount) {
            if (deleteCount === 0) {
                return;
            }
            if (start + deleteCount > this._len) {
                deleteCount = this._len - start;
            }
            this._lineTokens.splice(start, deleteCount);
            this._len -= deleteCount;
        }
        _insertLines(insertIndex, insertCount) {
            if (insertCount === 0) {
                return;
            }
            const lineTokens = [];
            for (let i = 0; i < insertCount; i++) {
                lineTokens[i] = null;
            }
            this._lineTokens = arrays.arrayInsert(this._lineTokens, insertIndex, lineTokens);
            this._len += insertCount;
        }
        setTokens(topLevelLanguageId, lineIndex, lineTextLength, _tokens, checkEquality) {
            const tokens = ContiguousTokensStore._massageTokens(this._languageIdCodec.encodeLanguageId(topLevelLanguageId), lineTextLength, _tokens);
            this._ensureLine(lineIndex);
            const oldTokens = this._lineTokens[lineIndex];
            this._lineTokens[lineIndex] = tokens;
            if (checkEquality) {
                return !ContiguousTokensStore._equals(oldTokens, tokens);
            }
            return false;
        }
        static _equals(_a, _b) {
            if (!_a || !_b) {
                return !_a && !_b;
            }
            const a = (0, contiguousTokensEditing_1.toUint32Array)(_a);
            const b = (0, contiguousTokensEditing_1.toUint32Array)(_b);
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0, len = a.length; i < len; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        }
        //#region Editing
        acceptEdit(range, eolCount, firstLineLength) {
            this._acceptDeleteRange(range);
            this._acceptInsertText(new position_1.Position(range.startLineNumber, range.startColumn), eolCount, firstLineLength);
        }
        _acceptDeleteRange(range) {
            const firstLineIndex = range.startLineNumber - 1;
            if (firstLineIndex >= this._len) {
                return;
            }
            if (range.startLineNumber === range.endLineNumber) {
                if (range.startColumn === range.endColumn) {
                    // Nothing to delete
                    return;
                }
                this._lineTokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.delete(this._lineTokens[firstLineIndex], range.startColumn - 1, range.endColumn - 1);
                return;
            }
            this._lineTokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._lineTokens[firstLineIndex], range.startColumn - 1);
            const lastLineIndex = range.endLineNumber - 1;
            let lastLineTokens = null;
            if (lastLineIndex < this._len) {
                lastLineTokens = contiguousTokensEditing_1.ContiguousTokensEditing.deleteBeginning(this._lineTokens[lastLineIndex], range.endColumn - 1);
            }
            // Take remaining text on last line and append it to remaining text on first line
            this._lineTokens[firstLineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.append(this._lineTokens[firstLineIndex], lastLineTokens);
            // Delete middle lines
            this._deleteLines(range.startLineNumber, range.endLineNumber - range.startLineNumber);
        }
        _acceptInsertText(position, eolCount, firstLineLength) {
            if (eolCount === 0 && firstLineLength === 0) {
                // Nothing to insert
                return;
            }
            const lineIndex = position.lineNumber - 1;
            if (lineIndex >= this._len) {
                return;
            }
            if (eolCount === 0) {
                // Inserting text on one line
                this._lineTokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._lineTokens[lineIndex], position.column - 1, firstLineLength);
                return;
            }
            this._lineTokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.deleteEnding(this._lineTokens[lineIndex], position.column - 1);
            this._lineTokens[lineIndex] = contiguousTokensEditing_1.ContiguousTokensEditing.insert(this._lineTokens[lineIndex], position.column - 1, firstLineLength);
            this._insertLines(position.lineNumber, eolCount);
        }
        //#endregion
        setMultilineTokens(tokens, textModel) {
            if (tokens.length === 0) {
                return { changes: [] };
            }
            const ranges = [];
            for (let i = 0, len = tokens.length; i < len; i++) {
                const element = tokens[i];
                let minChangedLineNumber = 0;
                let maxChangedLineNumber = 0;
                let hasChange = false;
                for (let lineNumber = element.startLineNumber; lineNumber <= element.endLineNumber; lineNumber++) {
                    if (hasChange) {
                        this.setTokens(textModel.getLanguageId(), lineNumber - 1, textModel.getLineLength(lineNumber), element.getLineTokens(lineNumber), false);
                        maxChangedLineNumber = lineNumber;
                    }
                    else {
                        const lineHasChange = this.setTokens(textModel.getLanguageId(), lineNumber - 1, textModel.getLineLength(lineNumber), element.getLineTokens(lineNumber), true);
                        if (lineHasChange) {
                            hasChange = true;
                            minChangedLineNumber = lineNumber;
                            maxChangedLineNumber = lineNumber;
                        }
                    }
                }
                if (hasChange) {
                    ranges.push({ fromLineNumber: minChangedLineNumber, toLineNumber: maxChangedLineNumber, });
                }
            }
            return { changes: ranges };
        }
    }
    exports.ContiguousTokensStore = ContiguousTokensStore;
    function getDefaultMetadata(topLevelLanguageId) {
        return ((topLevelLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
            | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
            | (0 /* FontStyle.None */ << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
            | (1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            | (2 /* ColorId.DefaultBackground */ << 24 /* MetadataConsts.BACKGROUND_OFFSET */)
            // If there is no grammar, we just take a guess and try to match brackets.
            | (1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */)) >>> 0;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGlndW91c1Rva2Vuc1N0b3JlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL3Rva2Vucy9jb250aWd1b3VzVG9rZW5zU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHOztPQUVHO0lBQ0gsTUFBYSxxQkFBcUI7UUFLakMsWUFBWSxlQUFpQztZQUM1QyxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxlQUFlLENBQUM7UUFDekMsQ0FBQztRQUVNLEtBQUs7WUFDWCxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUN0QixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDWixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRU0sU0FBUyxDQUFDLGtCQUEwQixFQUFFLFNBQWlCLEVBQUUsUUFBZ0I7WUFDL0UsSUFBSSxhQUFhLEdBQXFDLElBQUksQ0FBQztZQUMzRCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzNCLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzdDLENBQUM7WUFFRCxJQUFJLGFBQWEsS0FBSyxJQUFJLElBQUksYUFBYSxLQUFLLDJDQUFpQixFQUFFLENBQUM7Z0JBQ25FLE9BQU8sSUFBSSx1QkFBVSxDQUFDLElBQUEsdUNBQWEsRUFBQyxhQUFhLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDdEYs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