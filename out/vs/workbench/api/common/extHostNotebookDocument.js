/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, network_1, uri_1, extHostTypeConverters, extHostTypes_1, notebookCommon) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocument = exports.ExtHostCell = void 0;
    class RawContentChangeEvent {
        constructor(start, deletedCount, deletedItems, items) {
            this.start = start;
            this.deletedCount = deletedCount;
            this.deletedItems = deletedItems;
            this.items = items;
        }
        asApiEvent() {
            return {
                range: new extHostTypes_1.NotebookRange(this.start, this.start + this.deletedCount),
                addedCells: this.items.map(cell => cell.apiCell),
                removedCells: this.deletedItems,
            };
        }
    }
    class ExtHostCell {
        static asModelAddData(cell) {
            return {
                EOL: cell.eol,
                lines: cell.source,
                languageId: cell.language,
                uri: cell.uri,
                isDirty: false,
                versionId: 1
            };
        }
        constructor(notebook, _extHostDocument, _cellData) {
            this.notebook = notebook;
            this._extHostDocument = _extHostDocument;
            this._cellData = _cellData;
            this.handle = _cellData.handle;
            this.uri = uri_1.URI.revive(_cellData.uri);
            this.cellKind = _cellData.cellKind;
            this._outputs = _cellData.outputs.map(extHostTypeConverters.NotebookCellOutput.to);
            this._internalMetadata = _cellData.internalMetadata ?? {};
            this._metadata = Object.freeze(_cellData.metadata ?? {});
            this._previousResult = Object.freeze(extHostTypeConverters.NotebookCellExecutionSummary.to(_cellData.internalMetadata ?? {}));
        }
        get internalMetadata() {
            return this._internalMetadata;
        }
        get apiCell() {
            if (!this._apiCell) {
                const that = this;
                const data = this._extHostDocument.getDocument(this.uri);
                if (!data) {
                    throw new Error(`MISSING extHostDocument for notebook cell: ${this.uri}`);
                }
                const apiCell = {
                    get index() { return that.notebook.getCellIndex(that); },
                    notebook: that.notebook.apiNotebook,
                    kind: extHostTypeConverters.NotebookCellKind.to(this._cellData.cellKind),
                    document: data.document,
                    get mime() { return that._mime; },
                    set mime(value) { that._mime = value; },
                    get outputs() { return that._outputs.slice(0); },
                    get metadata() { return that._metadata; },
                    get executionSummary() { return that._previousResult; }
                };
                this._apiCell = Object.freeze(apiCell);
            }
            return this._apiCell;
        }
        setOutputs(newOutputs) {
            this._outputs = newOutputs.map(extHostTypeConverters.NotebookCellOutput.to);
        }
        setOutputItems(outputId, append, newOutputItems) {
            const newItems = newOutputItems.map(extHostTypeConverters.NotebookCellOutputItem.to);
            const output = this._outputs.find(op => op.id === outputId);
            if (output) {
                if (!append) {
                    output.items.length = 0;
                }
                output.items.push(...newItems);
                if (output.items.length > 1 && output.items.every(item => notebookCommon.isTextStreamMime(item.mime))) {
                    // Look for the mimes in the items, and keep track of their order.
                    // Merge the streams into one output item, per mime type.
                    const mimeOutputs = new Map();
                    const mimeTypes = [];
                    output.items.forEach(item => {
                        let items;
                        if (mimeOutputs.has(item.mime)) {
                            items = mimeOutputs.get(item.mime);
                        }
                        else {
                            items = [];
                            mimeOutputs.set(item.mime, items);
                            mimeTypes.push(item.mime);
                        }
                        items.push(item.data);
                    });
                    output.items.length = 0;
                    mimeTypes.forEach(mime => {
                        const compressed = notebookCommon.compressOutputItemStreams(mimeOutputs.get(mime));
                        output.items.push({
                            mime,
                            data: compressed.data.buffer
                        });
                    });
                }
            }
        }
        setMetadata(newMetadata) {
            this._metadata = Object.freeze(newMetadata);
        }
        setInternalMetadata(newInternalMetadata) {
            this._internalMetadata = newInternalMetadata;
            this._previousResult = Object.freeze(extHostTypeConverters.NotebookCellExecutionSummary.to(newInternalMetadata));
        }
        setMime(newMime) {
        }
    }
    exports.ExtHostCell = ExtHostCell;
    class ExtHostNotebookDocument {
        static { this._handlePool = 0; }
        constructor(_proxy, _textDocumentsAndEditors, _textDocuments, uri, data) {
            this._proxy = _proxy;
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._textDocuments = _textDocuments;
            this.uri = uri;
            this.handle = ExtHostNotebookDocument._handlePool++;
            this._cells = [];
            this._versionId = 0;
            this._isDirty = false;
            this._disposed = false;
            this._notebookType = data.viewType;
            this._metadata = Object.freeze(data.metadata ?? Object.create(null));
            this._spliceNotebookCells([[0, 0, data.cells]], true /* init -> no event*/, undefined);
            this._versionId = data.versionId;
        }
        dispose() {
            this._disposed = true;
        }
        get versionId() {
            return this._versionId;
        }
        get apiNotebook() {
            if (!this._notebook) {
                const that = this;
                const apiObject = {
                    get uri() { return that.uri; },
                    get version() { return that._versionId; },
                    get notebookType() { return that._notebookType; },
                    get isDirty() { return that._isDirty; },
                    get isUntitled() { return that.uri.scheme === network_1.Schemas.untitled; },
                    get isClosed() { return that._disposed; },
                    get metadata() { return that._metadata; },
                    get cellCount() { return that._cells.length; },
                    cellAt(index) {
                        index = that._validateIndex(index);
                        return that._cells[index].apiCell;
                    },
                    getCells(range) {
                        const cells = range ? that._getCells(range) : that._cells;
                        return cells.map(cell => cell.apiCell);
                    },
                    save() {
                        return that._save();
                    }
                };
                this._notebook = Object.freeze(apiObject);
            }
            return this._notebook;
        }
        acceptDocumentPropertiesChanged(data) {
            if (data.metadata) {
                this._metadata = Object.freeze({ ...this._metadata, ...data.metadata });
            }
        }
        acceptDirty(isDirty) {
            this._isDirty = isDirty;
        }
        acceptModelChanged(event, isDirty, newMetadata) {
            this._versionId = event.versionId;
            this._isDirty = isDirty;
            this.acceptDocumentPropertiesChanged({ metadata: newMetadata });
            const result = {
                notebook: this.apiNotebook,
                metadata: newMetadata,
                cellChanges: [],
                contentChanges: [],
            };
            const relaxedCellChanges = [];
            // -- apply change and populate content changes
            for (const rawEvent of event.rawEvents) {
                if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ModelChange) {
                    this._spliceNotebookCells(rawEvent.changes, false, result.contentChanges);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.Move) {
                    this._moveCells(rawEvent.index, rawEvent.length, rawEvent.newIdx, result.contentChanges);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.Output) {
                    this._setCellOutputs(rawEvent.index, rawEvent.outputs);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, outputs: this._cells[rawEvent.index].apiCell.outputs });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.OutputItem) {
                    this._setCellOutputItems(rawEvent.index, rawEvent.outputId, rawEvent.append, rawEvent.outputItems);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, outputs: this._cells[rawEvent.index].apiCell.outputs });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellLanguage) {
                    this._changeCellLanguage(rawEvent.index, rawEvent.language);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, document: this._cells[rawEvent.index].apiCell.document });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellContent) {
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, document: this._cells[rawEvent.index].apiCell.document });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellMime) {
                    this._changeCellMime(rawEvent.index, rawEvent.mime);
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellMetadata) {
                    this._changeCellMetadata(rawEvent.index, rawEvent.metadata);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, metadata: this._cells[rawEvent.index].apiCell.metadata });
                }
                else if (rawEvent.kind === notebookCommon.NotebookCellsChangeType.ChangeCellInternalMetadata) {
                    this._changeCellInternalMetadata(rawEvent.index, rawEvent.internalMetadata);
                    relaxedCellChanges.push({ cell: this._cells[rawEvent.index].apiCell, executionSummary: this._cells[rawEvent.index].apiCell.executionSummary });
                }
            }
            // -- compact cellChanges
            const map = new Map();
            for (let i = 0; i < relaxedCellChanges.length; i++) {
                const relaxedCellChange = relaxedCellChanges[i];
                const existing = map.get(relaxedCellChange.cell);
                if (existing === undefined) {
                    const newLen = result.cellChanges.push({
                        document: undefined,
                        executionSummary: undefined,
                        metadata: undefined,
                        outputs: undefined,
                        ...relaxedCellChange,
                    });
                    map.set(relaxedCellChange.cell, newLen - 1);
                }
                else {
                    result.cellChanges[existing] = {
                        ...result.cellChanges[existing],
                        ...relaxedCellChange
                    };
                }
            }
            // Freeze event properties so handlers cannot accidentally modify them
            Object.freeze(result);
            Object.freeze(result.cellChanges);
            Object.freeze(result.contentChanges);
            return result;
        }
        _validateIndex(index) {
            index = index | 0;
            if (index < 0) {
                return 0;
            }
            else if (index >= this._cells.length) {
                return this._cells.length - 1;
            }
            else {
                return index;
            }
        }
        _validateRange(range) {
            let start = range.start | 0;
            let end = range.end | 0;
            if (start < 0) {
                start = 0;
            }
            if (end > this._cells.length) {
                end = this._cells.length;
            }
            return range.with({ start, end });
        }
        _getCells(range) {
            range = this._validateRange(range);
            const result = [];
            for (let i = range.start; i < range.end; i++) {
                result.push(this._cells[i]);
            }
            return result;
        }
        async _save() {
            if (this._disposed) {
                return Promise.reject(new Error('Notebook has been closed'));
            }
            return this._proxy.$trySaveNotebook(this.uri);
        }
        _spliceNotebookCells(splices, initialization, bucket) {
            if (this._disposed) {
                return;
            }
            const contentChangeEvents = [];
            const addedCellDocuments = [];
            const removedCellDocuments = [];
            splices.reverse().forEach(splice => {
                const cellDtos = splice[2];
                const newCells = cellDtos.map(cell => {
                    const extCell = new ExtHostCell(this, this._textDocumentsAndEditors, cell);
                    if (!initialization) {
                        addedCellDocuments.push(ExtHostCell.asModelAddData(cell));
                    }
                    return extCell;
                });
                const changeEvent = new RawContentChangeEvent(splice[0], splice[1], [], newCells);
                const deletedItems = this._cells.splice(splice[0], splice[1], ...newCells);
                for (const cell of deletedItems) {
                    removedCellDocuments.push(cell.uri);
                    changeEvent.deletedItems.push(cell.apiCell);
                }
                contentChangeEvents.push(changeEvent);
            });
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                addedDocuments: addedCellDocuments,
                removedDocuments: removedCellDocuments
            });
            if (bucket) {
                for (const changeEvent of contentChangeEvents) {
                    bucket.push(changeEvent.asApiEvent());
                }
            }
        }
        _moveCells(index, length, newIdx, bucket) {
            const cells = this._cells.splice(index, length);
            this._cells.splice(newIdx, 0, ...cells);
            const changes = [
                new RawContentChangeEvent(index, length, cells.map(c => c.apiCell), []),
                new RawContentChangeEvent(newIdx, 0, [], cells)
            ];
            for (const change of changes) {
                bucket.push(change.asApiEvent());
            }
        }
        _setCellOutputs(index, outputs) {
            const cell = this._cells[index];
            cell.setOutputs(outputs);
        }
        _setCellOutputItems(index, outputId, append, outputItems) {
            const cell = this._cells[index];
            cell.setOutputItems(outputId, append, outputItems);
        }
        _changeCellLanguage(index, newLanguageId) {
            const cell = this._cells[index];
            if (cell.apiCell.document.languageId !== newLanguageId) {
                this._textDocuments.$acceptModelLanguageChanged(cell.uri, newLanguageId);
            }
        }
        _changeCellMime(index, newMime) {
            const cell = this._cells[index];
            cell.apiCell.mime = newMime;
        }
        _changeCellMetadata(index, newMetadata) {
            const cell = this._cells[index];
            cell.setMetadata(newMetadata);
        }
        _changeCellInternalMetadata(index, newInternalMetadata) {
            const cell = this._cells[index];
            cell.setInternalMetadata(newInternalMetadata);
        }
        getCellFromApiCell(apiCell) {
            return this._cells.find(cell => cell.apiCell === apiCell);
        }
        getCellFromIndex(index) {
            return this._cells[index];
        }
        getCell(cellHandle) {
            return this._cells.find(cell => cell.handle === cellHandle);
        }
        getCellIndex(cell) {
            return this._cells.indexOf(cell);
        }
    }
    exports.ExtHostNotebookDocument = ExtHostNotebookDocument;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rRG9jdW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3ROb3RlYm9va0RvY3VtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLHFCQUFxQjtRQUUxQixZQUNVLEtBQWEsRUFDYixZQUFvQixFQUNwQixZQUFtQyxFQUNuQyxLQUFvQjtZQUhwQixVQUFLLEdBQUwsS0FBSyxDQUFRO1lBQ2IsaUJBQVksR0FBWixZQUFZLENBQVE7WUFDcEIsaUJBQVksR0FBWixZQUFZLENBQXVCO1lBQ25DLFVBQUssR0FBTCxLQUFLLENBQWU7UUFDMUIsQ0FBQztRQUVMLFVBQVU7WUFDVCxPQUFPO2dCQUNOLEtBQUssRUFBRSxJQUFJLDRCQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ3BFLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ2hELFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTthQUMvQixDQUFDO1FBQ0gsQ0FBQztLQUNEO0lBRUQsTUFBYSxXQUFXO1FBRXZCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBcUM7WUFDMUQsT0FBTztnQkFDTixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7Z0JBQ2IsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNsQixVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3pCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDYixPQUFPLEVBQUUsS0FBSztnQkFDZCxTQUFTLEVBQUUsQ0FBQzthQUNa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