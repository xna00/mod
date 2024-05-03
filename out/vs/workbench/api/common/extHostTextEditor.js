/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/assert", "vs/base/common/errors", "vs/base/common/idGenerator", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, assert_1, errors_1, idGenerator_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTextEditor = exports.ExtHostTextEditorOptions = exports.TextEditorDecorationType = void 0;
    class TextEditorDecorationType {
        static { this._Keys = new idGenerator_1.IdGenerator('TextEditorDecorationType'); }
        constructor(proxy, extension, options) {
            const key = TextEditorDecorationType._Keys.nextId();
            proxy.$registerTextEditorDecorationType(extension.identifier, key, TypeConverters.DecorationRenderOptions.from(options));
            this.value = Object.freeze({
                key,
                dispose() {
                    proxy.$removeTextEditorDecorationType(key);
                }
            });
        }
    }
    exports.TextEditorDecorationType = TextEditorDecorationType;
    class TextEditorEdit {
        constructor(document, options) {
            this._collectedEdits = [];
            this._setEndOfLine = undefined;
            this._finalized = false;
            this._document = document;
            this._documentVersionId = document.version;
            this._undoStopBefore = options.undoStopBefore;
            this._undoStopAfter = options.undoStopAfter;
        }
        finalize() {
            this._finalized = true;
            return {
                documentVersionId: this._documentVersionId,
                edits: this._collectedEdits,
                setEndOfLine: this._setEndOfLine,
                undoStopBefore: this._undoStopBefore,
                undoStopAfter: this._undoStopAfter
            };
        }
        _throwIfFinalized() {
            if (this._finalized) {
                throw new Error('Edit is only valid while callback runs');
            }
        }
        replace(location, value) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Position) {
                range = new extHostTypes_1.Range(location, location);
            }
            else if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, value, false);
        }
        insert(location, value) {
            this._throwIfFinalized();
            this._pushEdit(new extHostTypes_1.Range(location, location), value, true);
        }
        delete(location) {
            this._throwIfFinalized();
            let range = null;
            if (location instanceof extHostTypes_1.Range) {
                range = location;
            }
            else {
                throw new Error('Unrecognized location');
            }
            this._pushEdit(range, null, true);
        }
        _pushEdit(range, text, forceMoveMarkers) {
            const validRange = this._document.validateRange(range);
            this._collectedEdits.push({
                range: validRange,
                text: text,
                forceMoveMarkers: forceMoveMarkers
            });
        }
        setEndOfLine(endOfLine) {
            this._throwIfFinalized();
            if (endOfLine !== extHostTypes_1.EndOfLine.LF && endOfLine !== extHostTypes_1.EndOfLine.CRLF) {
                throw (0, errors_1.illegalArgument)('endOfLine');
            }
            this._setEndOfLine = endOfLine;
        }
    }
    class ExtHostTextEditorOptions {
        constructor(proxy, id, source, logService) {
            this._proxy = proxy;
            this._id = id;
            this._accept(source);
            this._logService = logService;
            const that = this;
            this.value = {
                get tabSize() {
                    return that._tabSize;
                },
                set tabSize(value) {
                    that._setTabSize(value);
                },
                get indentSize() {
                    return that._indentSize;
                },
                set indentSize(value) {
                    that._setIndentSize(value);
                },
                get insertSpaces() {
                    return that._insertSpaces;
                },
                set insertSpaces(value) {
                    that._setInsertSpaces(value);
                },
                get cursorStyle() {
                    return that._cursorStyle;
                },
                set cursorStyle(value) {
                    that._setCursorStyle(value);
                },
                get lineNumbers() {
                    return that._lineNumbers;
                },
                set lineNumbers(value) {
                    that._setLineNumbers(value);
                }
            };
        }
        _accept(source) {
            this._tabSize = source.tabSize;
            this._indentSize = source.indentSize;
            this._originalIndentSize = source.originalIndentSize;
            this._insertSpaces = source.insertSpaces;
            this._cursorStyle = source.cursorStyle;
            this._lineNumbers = TypeConverters.TextEditorLineNumbersStyle.to(source.lineNumbers);
        }
        // --- internal: tabSize
        _validateTabSize(value) {
            if (value === 'auto') {
                return 'auto';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        _setTabSize(value) {
            const tabSize = this._validateTabSize(value);
            if (tabSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof tabSize === 'number') {
                if (this._tabSize === tabSize) {
                    // nothing to do
                    return;
                }
                // reflect the new tabSize value immediately
                this._tabSize = tabSize;
            }
            this._warnOnError('setTabSize', this._proxy.$trySetOptions(this._id, {
                tabSize: tabSize
            }));
        }
        // --- internal: indentSize
        _validateIndentSize(value) {
            if (value === 'tabSize') {
                return 'tabSize';
            }
            if (typeof value === 'number') {
                const r = Math.floor(value);
                return (r > 0 ? r : null);
            }
            if (typeof value === 'string') {
                const r = parseInt(value, 10);
                if (isNaN(r)) {
                    return null;
                }
                return (r > 0 ? r : null);
            }
            return null;
        }
        _setIndentSize(value) {
            const indentSize = this._validateIndentSize(value);
            if (indentSize === null) {
                // ignore invalid call
                return;
            }
            if (typeof indentSize === 'number') {
                if (this._originalIndentSize === indentSize) {
                    // nothing to do
                    return;
                }
                // reflect the new indentSize value immediately
                this._indentSize = indentSize;
                this._originalIndentSize = indentSize;
            }
            this._warnOnError('setIndentSize', this._proxy.$trySetOptions(this._id, {
                indentSize: indentSize
            }));
        }
        // --- internal: insert spaces
        _validateInsertSpaces(value) {
            if (value === 'auto') {
                return 'auto';
            }
            return (value === 'false' ? false : Boolean(value));
        }
        _setInsertSpaces(value) {
            const insertSpaces = this._validateInsertSpaces(value);
            if (typeof insertSpaces === 'boolean') {
                if (this._insertSpaces === insertSpaces) {
                    // nothing to do
                    return;
                }
                // reflect the new insertSpaces value immediately
                this._insertSpaces = insertSpaces;
            }
            this._warnOnError('setInsertSpaces', this._proxy.$trySetOptions(this._id, {
                insertSpaces: insertSpaces
            }));
        }
        // --- internal: cursor style
        _setCursorStyle(value) {
            if (this._cursorStyle === value) {
                // nothing to do
                return;
            }
            this._cursorStyle = value;
            this._warnOnError('setCursorStyle', this._proxy.$trySetOptions(this._id, {
                cursorStyle: value
            }));
        }
        // --- internal: line number
        _setLineNumbers(value) {
            if (this._lineNumbers === value) {
                // nothing to do
                return;
            }
            this._lineNumbers = value;
            this._warnOnError('setLineNumbers', this._proxy.$trySetOptions(this._id, {
                lineNumbers: TypeConverters.TextEditorLineNumbersStyle.from(value)
            }));
        }
        assign(newOptions) {
            const bulkConfigurationUpdate = {};
            let hasUpdate = false;
            if (typeof newOptions.tabSize !== 'undefined') {
                const tabSize = this._validateTabSize(newOptions.tabSize);
                if (tabSize === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
                else if (typeof tabSize === 'number' && this._tabSize !== tabSize) {
                    // reflect the new tabSize value immediately
                    this._tabSize = tabSize;
                    hasUpdate = true;
                    bulkConfigurationUpdate.tabSize = tabSize;
                }
            }
            if (typeof newOptions.indentSize !== 'undefined') {
                const indentSize = this._validateIndentSize(newOptions.indentSize);
                if (indentSize === 'tabSize') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.indentSize = indentSize;
                }
                else if (typeof indentSize === 'number' && this._originalIndentSize !== indentSize) {
                    // reflect the new indentSize value immediately
                    this._indentSize = indentSize;
                    this._originalIndentSize = indentSize;
                    hasUpdate = true;
                    bulkConfigurationUpdate.indentSize = indentSize;
                }
            }
            if (typeof newOptions.insertSpaces !== 'undefined') {
                const insertSpaces = this._validateInsertSpaces(newOptions.insertSpaces);
                if (insertSpaces === 'auto') {
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
                else if (this._insertSpaces !== insertSpaces) {
                    // reflect the new insertSpaces value immediately
                    this._insertSpaces = insertSpaces;
                    hasUpdate = true;
                    bulkConfigurationUpdate.insertSpaces = insertSpaces;
                }
            }
            if (typeof newOptions.cursorStyle !== 'undefined') {
                if (this._cursorStyle !== newOptions.cursorStyle) {
                    this._cursorStyle = newOptions.cursorStyle;
                    hasUpdate = true;
                    bulkConfigurationUpdate.cursorStyle = newOptions.cursorStyle;
                }
            }
            if (typeof newOptions.lineNumbers !== 'undefined') {
                if (this._lineNumbers !== newOptions.lineNumbers) {
                    this._lineNumbers = newOptions.lineNumbers;
                    hasUpdate = true;
                    bulkConfigurationUpdate.lineNumbers = TypeConverters.TextEditorLineNumbersStyle.from(newOptions.lineNumbers);
                }
            }
            if (hasUpdate) {
                this._warnOnError('setOptions', this._proxy.$trySetOptions(this._id, bulkConfigurationUpdate));
            }
        }
        _warnOnError(action, promise) {
            promise.catch(err => {
                this._logService.warn(`ExtHostTextEditorOptions '${action}' failed:'`);
                this._logService.warn(err);
            });
        }
    }
    exports.ExtHostTextEditorOptions = ExtHostTextEditorOptions;
    class ExtHostTextEditor {
        constructor(id, _proxy, _logService, document, selections, options, visibleRanges, viewColumn) {
            this.id = id;
            this._proxy = _proxy;
            this._logService = _logService;
            this._disposed = false;
            this._hasDecorationsForKey = new Set();
            this._selections = selections;
            this._options = new ExtHostTextEditorOptions(this._proxy, this.id, options, _logService);
            this._visibleRanges = visibleRanges;
            this._viewColumn = viewColumn;
            const that = this;
            this.value = Object.freeze({
                get document() {
                    return document.value;
                },
                set document(_value) {
                    throw new errors_1.ReadonlyError('document');
                },
                // --- selection
                get selection() {
                    return that._selections && that._selections[0];
                },
                set selection(value) {
                    if (!(value instanceof extHostTypes_1.Selection)) {
                        throw (0, errors_1.illegalArgument)('selection');
                    }
                    that._selections = [value];
                    that._trySetSelection();
                },
                get selections() {
                    return that._selections;
                },
                set selections(value) {
                    if (!Array.isArray(value) || value.some(a => !(a instanceof extHostTypes_1.Selection))) {
                        throw (0, errors_1.illegalArgument)('selections');
                    }
                    that._selections = value;
                    that._trySetSelection();
                },
                // --- visible ranges
                get visibleRanges() {
                    return that._visibleRanges;
                },
                set visibleRanges(_value) {
                    throw new errors_1.ReadonlyError('visibleRanges');
                },
                // --- options
                get options() {
                    return that._options.value;
                },
                set options(value) {
                    if (!that._disposed) {
                        that._options.assign(value);
                    }
                },
                // --- view column
                get viewColumn() {
                    return that._viewColumn;
                },
                set viewColumn(_value) {
                    throw new errors_1.ReadonlyError('viewColumn');
                },
                // --- edit
                edit(callback, options = { undoStopBefore: true, undoStopAfter: true }) {
                    if (that._disposed) {
                        return Promise.reject(new Error('TextEditor#edit not possible on closed editors'));
                    }
                    const edit = new TextEditorEdit(document.value, options);
                    callback(edit);
                    return that._applyEdit(edit);
                },
                // --- snippet edit
                insertSnippet(snippet, where, options = { undoStopBefore: true, undoStopAfter: true }) {
                    if (that._disposed) {
                        return Promise.reject(new Error('TextEditor#insertSnippet not possible on closed editors'));
                    }
                    let ranges;
                    if (!where || (Array.isArray(where) && where.length === 0)) {
                        ranges = that._selections.map(range => TypeConverters.Range.from(range));
                    }
                    else if (where instanceof extHostTypes_1.Position) {
                        const { lineNumber, column } = TypeConverters.Position.from(where);
                        ranges = [{ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column }];
                    }
                    else if (where instanceof extHostTypes_1.Range) {
                        ranges = [TypeConverters.Range.from(where)];
                    }
                    else {
                        ranges = [];
                        for (const posOrRange of where) {
                            if (posOrRange instanceof extHostTypes_1.Range) {
                                ranges.push(TypeConverters.Range.from(posOrRange));
                            }
                            else {
                                const { lineNumber, column } = TypeConverters.Position.from(posOrRange);
                                ranges.push({ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column });
                            }
                        }
                    }
                    return _proxy.$tryInsertSnippet(id, document.value.version, snippet.value, ranges, options);
                },
                setDecorations(decorationType, ranges) {
                    const willBeEmpty = (ranges.length === 0);
                    if (willBeEmpty && !that._hasDecorationsForKey.has(decorationType.key)) {
                        // avoid no-op call to the renderer
                        return;
                    }
                    if (willBeEmpty) {
                        that._hasDecorationsForKey.delete(decorationType.key);
                    }
                    else {
                        that._hasDecorationsForKey.add(decorationType.key);
                    }
                    that._runOnProxy(() => {
                        if (TypeConverters.isDecorationOptionsArr(ranges)) {
                            return _proxy.$trySetDecorations(id, decorationType.key, TypeConverters.fromRangeOrRangeWithMessage(ranges));
                        }
                        else {
                            const _ranges = new Array(4 * ranges.length);
                            for (let i = 0, len = ranges.length; i < len; i++) {
                                const range = ranges[i];
                                _ranges[4 * i] = range.start.line + 1;
                                _ranges[4 * i + 1] = range.start.character + 1;
                                _ranges[4 * i + 2] = range.end.line + 1;
                                _ranges[4 * i + 3] = range.end.character + 1;
                            }
                            return _proxy.$trySetDecorationsFast(id, decorationType.key, _ranges);
                        }
                    });
                },
                revealRange(range, revealType) {
                    that._runOnProxy(() => _proxy.$tryRevealRange(id, TypeConverters.Range.from(range), (revealType || extHostTypes_1.TextEditorRevealType.Default)));
                },
                show(column) {
                    _proxy.$tryShowEditor(id, TypeConverters.ViewColumn.from(column));
                },
                hide() {
                    _proxy.$tryHideEditor(id);
                }
            });
        }
        dispose() {
            (0, assert_1.ok)(!this._disposed);
            this._disposed = true;
        }
        // --- incoming: extension host MUST accept what the renderer says
        _acceptOptions(options) {
            (0, assert_1.ok)(!this._disposed);
            this._options._accept(options);
        }
        _acceptVisibleRanges(value) {
            (0, assert_1.ok)(!this._disposed);
            this._visibleRanges = value;
        }
        _acceptViewColumn(value) {
            (0, assert_1.ok)(!this._disposed);
            this._viewColumn = value;
        }
        _acceptSelections(selections) {
            (0, assert_1.ok)(!this._disposed);
            this._selections = selections;
        }
        async _trySetSelection() {
            const selection = this._selections.map(TypeConverters.Selection.from);
            await this._runOnProxy(() => this._proxy.$trySetSelections(this.id, selection));
            return this.value;
        }
        _applyEdit(editBuilder) {
            const editData = editBuilder.finalize();
            // return when there is nothing to do
            if (editData.edits.length === 0 && !editData.setEndOfLine) {
                return Promise.resolve(true);
            }
            // check that the edits are not overlapping (i.e. illegal)
            const editRanges = editData.edits.map(edit => edit.range);
            // sort ascending (by end and then by start)
            editRanges.sort((a, b) => {
                if (a.end.line === b.end.line) {
                    if (a.end.character === b.end.character) {
                        if (a.start.line === b.start.line) {
                            return a.start.character - b.start.character;
                        }
                        return a.start.line - b.start.line;
                    }
                    return a.end.character - b.end.character;
                }
                return a.end.line - b.end.line;
            });
            // check that no edits are overlapping
            for (let i = 0, count = editRanges.length - 1; i < count; i++) {
                const rangeEnd = editRanges[i].end;
                const nextRangeStart = editRanges[i + 1].start;
                if (nextRangeStart.isBefore(rangeEnd)) {
                    // overlapping ranges
                    return Promise.reject(new Error('Overlapping ranges are not allowed!'));
                }
            }
            // prepare data for serialization
            const edits = editData.edits.map((edit) => {
                return {
                    range: TypeConverters.Range.from(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            return this._proxy.$tryApplyEdits(this.id, editData.documentVersionId, edits, {
                setEndOfLine: typeof editData.setEndOfLine === 'number' ? TypeConverters.EndOfLine.from(editData.setEndOfLine) : undefined,
                undoStopBefore: editData.undoStopBefore,
                undoStopAfter: editData.undoStopAfter
            });
        }
        _runOnProxy(callback) {
            if (this._disposed) {
                this._logService.warn('TextEditor is closed/disposed');
                return Promise.resolve(undefined);
            }
            return callback().then(() => this, err => {
                if (!(err instanceof Error && err.name === 'DISPOSED')) {
                    this._logService.warn(err);
                }
                return null;
            });
        }
    }
    exports.ExtHostTextEditor = ExtHostTextEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRleHRFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUZXh0RWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSx3QkFBd0I7aUJBRVosVUFBSyxHQUFHLElBQUkseUJBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBSTVFLFlBQVksS0FBaUMsRUFBRSxTQUFnQyxFQUFFLE9BQXVDO1lBQ3ZILE1BQU0sR0FBRyxHQUFHLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwRCxLQUFLLENBQUMsaUNBQWlDLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsY0FBYyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pILElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDMUIsR0FBRztnQkFDSCxPQUFPO29CQUNOLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDNUMsQ0FBQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7O0lBZkYsNERBaUJDO0lBZ0JELE1BQU0sY0FBYztRQVVuQixZQUFZLFFBQTZCLEVBQUUsT0FBNEQ7WUFKL0Ysb0JBQWUsR0FBeUIsRUFBRSxDQUFDO1lBQzNDLGtCQUFhLEdBQTBCLFNBQVMsQ0FBQztZQUNqRCxlQUFVLEdBQVksS0FBSyxDQUFDO1lBR25DLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO1lBQzFCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO1lBQzNDLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLGNB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