/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/network", "vs/base/common/strings", "vs/editor/common/model/mirrorTextModel", "vs/editor/common/core/wordHelper", "vs/workbench/api/common/extHostTypes", "vs/base/common/arrays"], function (require, exports, assert_1, network_1, strings_1, mirrorTextModel_1, wordHelper_1, extHostTypes_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentLine = exports.ExtHostDocumentData = void 0;
    exports.setWordDefinitionFor = setWordDefinitionFor;
    const _languageId2WordDefinition = new Map();
    function setWordDefinitionFor(languageId, wordDefinition) {
        if (!wordDefinition) {
            _languageId2WordDefinition.delete(languageId);
        }
        else {
            _languageId2WordDefinition.set(languageId, wordDefinition);
        }
    }
    function getWordDefinitionFor(languageId) {
        return _languageId2WordDefinition.get(languageId);
    }
    class ExtHostDocumentData extends mirrorTextModel_1.MirrorTextModel {
        constructor(_proxy, uri, lines, eol, versionId, _languageId, _isDirty) {
            super(uri, lines, eol, versionId);
            this._proxy = _proxy;
            this._languageId = _languageId;
            this._isDirty = _isDirty;
            this._isDisposed = false;
        }
        // eslint-disable-next-line local/code-must-use-super-dispose
        dispose() {
            // we don't really dispose documents but let
            // extensions still read from them. some
            // operations, live saving, will now error tho
            (0, assert_1.ok)(!this._isDisposed);
            this._isDisposed = true;
            this._isDirty = false;
        }
        equalLines(lines) {
            return (0, arrays_1.equals)(this._lines, lines);
        }
        get document() {
            if (!this._document) {
                const that = this;
                this._document = {
                    get uri() { return that._uri; },
                    get fileName() { return that._uri.fsPath; },
                    get isUntitled() { return that._uri.scheme === network_1.Schemas.untitled; },
                    get languageId() { return that._languageId; },
                    get version() { return that._versionId; },
                    get isClosed() { return that._isDisposed; },
                    get isDirty() { return that._isDirty; },
                    save() { return that._save(); },
                    getText(range) { return range ? that._getTextInRange(range) : that.getText(); },
                    get eol() { return that._eol === '\n' ? extHostTypes_1.EndOfLine.LF : extHostTypes_1.EndOfLine.CRLF; },
                    get lineCount() { return that._lines.length; },
                    lineAt(lineOrPos) { return that._lineAt(lineOrPos); },
                    offsetAt(pos) { return that._offsetAt(pos); },
                    positionAt(offset) { return that._positionAt(offset); },
                    validateRange(ran) { return that._validateRange(ran); },
                    validatePosition(pos) { return that._validatePosition(pos); },
                    getWordRangeAtPosition(pos, regexp) { return that._getWordRangeAtPosition(pos, regexp); },
                };
            }
            return Object.freeze(this._document);
        }
        _acceptLanguageId(newLanguageId) {
            (0, assert_1.ok)(!this._isDisposed);
            this._languageId = newLanguageId;
        }
        _acceptIsDirty(isDirty) {
            (0, assert_1.ok)(!this._isDisposed);
            this._isDirty = isDirty;
        }
        _save() {
            if (this._isDisposed) {
                return Promise.reject(new Error('Document has been closed'));
            }
            return this._proxy.$trySaveDocument(this._uri);
        }
        _getTextInRange(_range) {
            const range = this._validateRange(_range);
            if (range.isEmpty) {
                return '';
            }
            if (range.isSingleLine) {
                return this._lines[range.start.line].substring(range.start.character, range.end.character);
            }
            const lineEnding = this._eol, startLineIndex = range.start.line, endLineIndex = range.end.line, resultLines = [];
            resultLines.push(this._lines[startLineIndex].substring(range.start.character));
            for (let i = startLineIndex + 1; i < endLineIndex; i++) {
                resultLines.push(this._lines[i]);
            }
            resultLines.push(this._lines[endLineIndex].substring(0, range.end.character));
            return resultLines.join(lineEnding);
        }
        _lineAt(lineOrPosition) {
            let line;
            if (lineOrPosition instanceof extHostTypes_1.Position) {
                line = lineOrPosition.line;
            }
            else if (typeof lineOrPosition === 'number') {
                line = lineOrPosition;
            }
            if (typeof line !== 'number' || line < 0 || line >= this._lines.length || Math.floor(line) !== line) {
                throw new Error('Illegal value for `line`');
            }
            return new ExtHostDocumentLine(line, this._lines[line], line === this._lines.length - 1);
        }
        _offsetAt(position) {
            position = this._validatePosition(position);
            this._ensureLineStarts();
            return this._lineStarts.getPrefixSum(position.line - 1) + position.character;
        }
        _positionAt(offset) {
            offset = Math.floor(offset);
            offset = Math.max(0, offset);
            this._ensureLineStarts();
            const out = this._lineStarts.getIndexOf(offset);
            const lineLength = this._lines[out.index].length;
            // Ensure we return a valid position
            return new extHostTypes_1.Position(out.index, Math.min(out.remainder, lineLength));
        }
        // ---- range math
        _validateRange(range) {
            if (!(range instanceof extHostTypes_1.Range)) {
                throw new Error('Invalid argument');
            }
            const start = this._validatePosition(range.start);
            const end = this._validatePosition(range.end);
            if (start === range.start && end === range.end) {
                return range;
            }
            return new extHostTypes_1.Range(start.line, start.character, end.line, end.character);
        }
        _validatePosition(position) {
            if (!(position instanceof extHostTypes_1.Position)) {
                throw new Error('Invalid argument');
            }
            if (this._lines.length === 0) {
                return position.with(0, 0);
            }
            let { line, character } = position;
            let hasChanged = false;
            if (line < 0) {
                line = 0;
                character = 0;
                hasChanged = true;
            }
            else if (line >= this._lines.length) {
                line = this._lines.length - 1;
                character = this._lines[line].length;
                hasChanged = true;
            }
            else {
                const maxCharacter = this._lines[line].length;
                if (character < 0) {
                    character = 0;
                    hasChanged = true;
                }
                else if (character > maxCharacter) {
                    character = maxCharacter;
                    hasChanged = true;
                }
            }
            if (!hasChanged) {
                return position;
            }
            return new extHostTypes_1.Position(line, character);
        }
        _getWordRangeAtPosition(_position, regexp) {
            const position = this._validatePosition(_position);
            if (!regexp) {
                // use default when custom-regexp isn't provided
                regexp = getWordDefinitionFor(this._languageId);
            }
            else if ((0, strings_1.regExpLeadsToEndlessLoop)(regexp)) {
                // use default when custom-regexp is bad
                throw new Error(`[getWordRangeAtPosition]: ignoring custom regexp '${regexp.source}' because it matches the empty string.`);
            }
            const wordAtText = (0, wordHelper_1.getWordAtText)(position.character + 1, (0, wordHelper_1.ensureValidWordDefinition)(regexp), this._lines[position.line], 0);
            if (wordAtText) {
                return new extHostTypes_1.Range(position.line, wordAtText.startColumn - 1, position.line, wordAtText.endColumn - 1);
            }
            return undefined;
        }
    }
    exports.ExtHostDocumentData = ExtHostDocumentData;
    class ExtHostDocumentLine {
        constructor(line, text, isLastLine) {
            this._line = line;
            this._text = text;
            this._isLastLine = isLastLine;
        }
        get lineNumber() {
            return this._line;
        }
        get text() {
            return this._text;
        }
        get range() {
            return new extHostTypes_1.Range(this._line, 0, this._line, this._text.length);
        }
        get rangeIncludingLineBreak() {
            if (this._isLastLine) {
                return this.range;
            }
            return new extHostTypes_1.Range(this._line, 0, this._line + 1, 0);
        }
        get firstNonWhitespaceCharacterIndex() {
            //TODO@api, rename to 'leadingWhitespaceLength'
            return /^(\s*)/.exec(this._text)[1].length;
        }
        get isEmptyOrWhitespace() {
            return this.firstNonWhitespaceCharacterIndex === this._text.length;
        }
    }
    exports.ExtHostDocumentLine = ExtHostDocumentLine;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERvY3VtZW50RGF0YS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdERvY3VtZW50RGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsb0RBTUM7SUFQRCxNQUFNLDBCQUEwQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBQzdELFNBQWdCLG9CQUFvQixDQUFDLFVBQWtCLEVBQUUsY0FBa0M7UUFDMUYsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3JCLDBCQUEwQixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMvQyxDQUFDO2FBQU0sQ0FBQztZQUNQLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDNUQsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLFVBQWtCO1FBQy9DLE9BQU8sMEJBQTBCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxNQUFhLG1CQUFvQixTQUFRLGlDQUFlO1FBS3ZELFlBQ2tCLE1BQWdDLEVBQ2pELEdBQVEsRUFBRSxLQUFlLEVBQUUsR0FBVyxFQUFFLFNBQWlCLEVBQ2pELFdBQW1CLEVBQ25CLFFBQWlCO1lBRXpCLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUxqQixXQUFNLEdBQU4sTUFBTSxDQUEwQjtZQUV6QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixhQUFRLEdBQVIsUUFBUSxDQUFTO1lBTmxCLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBU3JDLENBQUM7UUFFRCw2REFBNkQ7UUFDcEQsT0FBTztZQUNmLDRDQUE0QztZQUM1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