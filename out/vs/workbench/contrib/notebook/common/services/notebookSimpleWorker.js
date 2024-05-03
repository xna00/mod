define(["require", "exports", "vs/base/common/diff/diff", "vs/base/common/hash", "vs/base/common/uri", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/common/core/range", "vs/editor/common/model/textModelSearch"], function (require, exports, diff_1, hash_1, uri_1, pieceTreeTextBufferBuilder_1, notebookCommon_1, range_1, textModelSearch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorSimpleWorker = void 0;
    exports.create = create;
    function bufferHash(buffer) {
        let initialHashVal = (0, hash_1.numberHash)(104579, 0);
        for (let k = 0; k < buffer.buffer.length; k++) {
            initialHashVal = (0, hash_1.doHash)(buffer.buffer[k], initialHashVal);
        }
        return initialHashVal;
    }
    class MirrorCell {
        get textBuffer() {
            if (this._textBuffer) {
                return this._textBuffer;
            }
            const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            builder.acceptChunk(Array.isArray(this._source) ? this._source.join('\n') : this._source);
            const bufferFactory = builder.finish(true);
            this._textBuffer = bufferFactory.create(1 /* model.DefaultEndOfLine.LF */).textBuffer;
            return this._textBuffer;
        }
        primaryKey() {
            if (this._primaryKey === undefined) {
                this._primaryKey = (0, hash_1.hash)(this.getValue());
            }
            return this._primaryKey;
        }
        constructor(handle, _source, language, cellKind, outputs, metadata, internalMetadata) {
            this.handle = handle;
            this._source = _source;
            this.language = language;
            this.cellKind = cellKind;
            this.outputs = outputs;
            this.metadata = metadata;
            this.internalMetadata = internalMetadata;
            this._primaryKey = null;
            this._hash = null;
        }
        getFullModelRange() {
            const lineCount = this.textBuffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
        }
        getValue() {
            const fullRange = this.getFullModelRange();
            return this.textBuffer.getValueInRange(fullRange, 1 /* model.EndOfLinePreference.LF */);
        }
        getComparisonValue() {
            if (this._primaryKey !== null) {
                return this._primaryKey;
            }
            this._hash = (0, hash_1.hash)([(0, hash_1.hash)(this.language), (0, hash_1.hash)(this.getValue()), this.metadata, this.internalMetadata, this.outputs.map(op => ({
                    outputs: op.outputs.map(output => ({
                        mime: output.mime,
                        data: bufferHash(output.data)
                    })),
                    metadata: op.metadata
                }))]);
            return this._hash;
        }
        getHashValue() {
            if (this._hash !== null) {
                return this._hash;
            }
            this._hash = (0, hash_1.hash)([(0, hash_1.hash)(this.getValue()), this.language, this.metadata, this.internalMetadata]);
            return this._hash;
        }
    }
    class MirrorNotebookDocument {
        constructor(uri, cells, metadata) {
            this.uri = uri;
            this.cells = cells;
            this.metadata = metadata;
        }
        acceptModelChanged(event) {
            // note that the cell content change is not applied to the MirrorCell
            // but it's fine as if a cell content is modified after the first diff, its position will not change any more
            // TODO@rebornix, but it might lead to interesting bugs in the future.
            event.rawEvents.forEach(e => {
                if (e.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                    this._spliceNotebookCells(e.changes);
                }
                else if (e.kind === notebookCommon_1.NotebookCellsChangeType.Move) {
                    const cells = this.cells.splice(e.index, 1);
                    this.cells.splice(e.newIdx, 0, ...cells);
                }
                else if (e.kind === notebookCommon_1.NotebookCellsChangeType.Output) {
                    const cell = this.cells[e.index];
                    cell.outputs = e.outputs;
                }
                else if (e.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage) {
                    this._assertIndex(e.index);
                    const cell = this.cells[e.index];
                    cell.language = e.language;
                }
                else if (e.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata) {
                    this._assertIndex(e.index);
                    const cell = this.cells[e.index];
                    cell.metadata = e.metadata;
                }
                else if (e.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata) {
                    this._assertIndex(e.index);
                    const cell = this.cells[e.index];
                    cell.internalMetadata = e.internalMetadata;
                }
            });
        }
        _assertIndex(index) {
            if (index < 0 || index >= this.cells.length) {
                throw new Error(`Illegal index ${index}. Cells length: ${this.cells.length}`);
            }
        }
        _spliceNotebookCells(splices) {
            splices.reverse().forEach(splice => {
                const cellDtos = splice[2];
                const newCells = cellDtos.map(cell => {
                    return new MirrorCell(cell.handle, cell.source, cell.language, cell.cellKind, cell.outputs, cell.metadata);
                });
                this.cells.splice(splice[0], splice[1], ...newCells);
            });
        }
    }
    class CellSequence {
        constructor(textModel) {
            this.textModel = textModel;
        }
        getElements() {
            const hashValue = new Int32Array(this.textModel.cells.length);
            for (let i = 0; i < this.textModel.cells.length; i++) {
                hashValue[i] = this.textModel.cells[i].getComparisonValue();
            }
            return hashValue;
        }
        getCellHash(cell) {
            const source = Array.isArray(cell.source) ? cell.source.join('\n') : cell.source;
            const hashVal = (0, hash_1.hash)([(0, hash_1.hash)(source), cell.metadata]);
            return hashVal;
        }
    }
    class NotebookEditorSimpleWorker {
        constructor() {
            this._models = Object.create(null);
        }
        dispose() {
        }
        acceptNewModel(uri, data) {
            this._models[uri] = new MirrorNotebookDocument(uri_1.URI.parse(uri), data.cells.map(dto => new MirrorCell(dto.handle, dto.source, dto.language, dto.cellKind, dto.outputs, dto.metadata)), data.metadata);
        }
        acceptModelChanged(strURL, event) {
            const model = this._models[strURL];
            model?.acceptModelChanged(event);
        }
        acceptRemovedModel(strURL) {
            if (!this._models[strURL]) {
                return;
            }
            delete this._models[strURL];
        }
        computeDiff(originalUrl, modifiedUrl) {
            const original = this._getModel(originalUrl);
            const modified = this._getModel(modifiedUrl);
            const diff = new diff_1.LcsDiff(new CellSequence(original), new CellSequence(modified));
            const diffResult = diff.ComputeDiff(false);
            /* let cellLineChanges: { originalCellhandle: number, modifiedCellhandle: number, lineChanges: ILineChange[] }[] = [];
    
            diffResult.changes.forEach(change => {
                if (change.modifiedLength === 0) {
                    // deletion ...
                    return;
                }
    
                if (change.originalLength === 0) {
                    // insertion
                    return;
                }
    
                for (let i = 0, len = Math.min(change.modifiedLength, change.originalLength); i < len; i++) {
                    let originalIndex = change.originalStart + i;
                    let modifiedIndex = change.modifiedStart + i;
    
                    const originalCell = original.cells[originalIndex];
                    const modifiedCell = modified.cells[modifiedIndex];
    
                    if (originalCell.getValue() !== modifiedCell.getValue()) {
                        // console.log(`original cell ${originalIndex} content change`);
                        const originalLines = originalCell.textBuffer.getLinesContent();
                        const modifiedLines = modifiedCell.textBuffer.getLinesContent();
                        const diffComputer = new DiffComputer(originalLines, modifiedLines, {
                            shouldComputeCharChanges: true,
                            shouldPostProcessCharChanges: true,
                            shouldIgnoreTrimWhitespace: false,
                            shouldMakePrettyDiff: true,
                            maxComputationTime: 5000
                        });
    
                        const lineChanges = diffComputer.computeDiff().changes;
    
                        cellLineChanges.push({
                            originalCellhandle: originalCell.handle,
                            modifiedCellhandle: modifiedCell.handle,
                            lineChanges
                        });
    
                        // console.log(lineDecorations);
    
                    } else {
                        // console.log(`original cell ${originalIndex} metadata change`);
                    }
    
                }
            });
     */
            return {
                cellsDiff: diffResult,
                // linesDiff: cellLineChanges
            };
        }
        canPromptRecommendation(modelUrl) {
            const model = this._getModel(modelUrl);
            const cells = model.cells;
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    continue;
                }
                if (cell.language !== 'python') {
                    continue;
                }
                const lineCount = cell.textBuffer.getLineCount();
                const maxLineCount = Math.min(lineCount, 20);
                const range = new range_1.Range(1, 1, maxLineCount, cell.textBuffer.getLineLength(maxLineCount) + 1);
                const searchParams = new textModelSearch_1.SearchParams('import\\s*pandas|from\\s*pandas', true, false, null);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    continue;
                }
                const cellMatches = cell.textBuffer.findMatchesLineByLine(range, searchData, true, 1);
                if (cellMatches.length > 0) {
                    return true;
                }
            }
            return false;
        }
        _getModel(uri) {
            return this._models[uri];
        }
    }
    exports.NotebookEditorSimpleWorker = NotebookEditorSimpleWorker;
    /**
     * Called on the worker side
     * @internal
     */
    function create(host) {
        return new NotebookEditorSimpleWorker();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTaW1wbGVXb3JrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9zZXJ2aWNlcy9ub3RlYm9va1NpbXBsZVdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBZ1VBLHdCQUVDO0lBalRELFNBQVMsVUFBVSxDQUFDLE1BQWdCO1FBQ25DLElBQUksY0FBYyxHQUFHLElBQUEsaUJBQVUsRUFBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDL0MsY0FBYyxHQUFHLElBQUEsYUFBTSxFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELE9BQU8sY0FBYyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLFVBQVU7UUFHZixJQUFJLFVBQVU7WUFDYixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQ3pCLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHVEQUEwQixFQUFFLENBQUM7WUFDakQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxRixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFD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