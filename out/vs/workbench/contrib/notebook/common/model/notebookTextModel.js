/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/model/cellEdit", "vs/base/common/diff/diff", "vs/base/common/hash", "vs/workbench/contrib/notebook/common/model/notebookCellOutputTextModel", "vs/editor/common/services/model", "vs/base/common/network", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/editor/common/model/textModel", "vs/base/common/types"], function (require, exports, event_1, lifecycle_1, notebookCellTextModel_1, notebookCommon_1, undoRedo_1, cellEdit_1, diff_1, hash_1, notebookCellOutputTextModel_1, model_1, network_1, resources_1, language_1, textModel_1, types_1) {
    "use strict";
    var NotebookTextModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextModel = void 0;
    class StackOperation {
        get code() {
            return this._operations.length === 1 ? this._operations[0].code : 'undoredo.notebooks.stackOperation';
        }
        get label() {
            return this._operations.length === 1 ? this._operations[0].label : 'edit';
        }
        constructor(textModel, undoRedoGroup, _pauseableEmitter, _postUndoRedo, selectionState, beginAlternativeVersionId) {
            this.textModel = textModel;
            this.undoRedoGroup = undoRedoGroup;
            this._pauseableEmitter = _pauseableEmitter;
            this._postUndoRedo = _postUndoRedo;
            this._operations = [];
            this._beginSelectionState = undefined;
            this._resultSelectionState = undefined;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this._beginSelectionState = selectionState;
            this._beginAlternativeVersionId = beginAlternativeVersionId;
            this._resultAlternativeVersionId = beginAlternativeVersionId;
        }
        get resources() {
            return [this.textModel.uri];
        }
        get isEmpty() {
            return this._operations.length === 0;
        }
        pushEndState(alternativeVersionId, selectionState) {
            // https://github.com/microsoft/vscode/issues/207523
            this._resultAlternativeVersionId = alternativeVersionId;
            this._resultSelectionState = selectionState || this._resultSelectionState;
        }
        pushEditOperation(element, beginSelectionState, resultSelectionState, alternativeVersionId) {
            if (this._operations.length === 0) {
                this._beginSelectionState = this._beginSelectionState ?? beginSelectionState;
            }
            this._operations.push(element);
            this._resultSelectionState = resultSelectionState;
            this._resultAlternativeVersionId = alternativeVersionId;
        }
        async undo() {
            this._pauseableEmitter.pause();
            for (let i = this._operations.length - 1; i >= 0; i--) {
                await this._operations[i].undo();
            }
            this._postUndoRedo(this._beginAlternativeVersionId);
            this._pauseableEmitter.fire({
                rawEvents: [],
                synchronous: undefined,
                versionId: this.textModel.versionId,
                endSelectionState: this._beginSelectionState
            });
            this._pauseableEmitter.resume();
        }
        async redo() {
            this._pauseableEmitter.pause();
            for (let i = 0; i < this._operations.length; i++) {
                await this._operations[i].redo();
            }
            this._postUndoRedo(this._resultAlternativeVersionId);
            this._pauseableEmitter.fire({
                rawEvents: [],
                synchronous: undefined,
                versionId: this.textModel.versionId,
                endSelectionState: this._resultSelectionState
            });
            this._pauseableEmitter.resume();
        }
    }
    class NotebookOperationManager {
        constructor(_textModel, _undoService, _pauseableEmitter, _postUndoRedo) {
            this._textModel = _textModel;
            this._undoService = _undoService;
            this._pauseableEmitter = _pauseableEmitter;
            this._postUndoRedo = _postUndoRedo;
            this._pendingStackOperation = null;
        }
        isUndoStackEmpty() {
            return this._pendingStackOperation === null || this._pendingStackOperation.isEmpty;
        }
        pushStackElement(alternativeVersionId, selectionState) {
            if (this._pendingStackOperation && !this._pendingStackOperation.isEmpty) {
                this._pendingStackOperation.pushEndState(alternativeVersionId, selectionState);
                this._undoService.pushElement(this._pendingStackOperation, this._pendingStackOperation.undoRedoGroup);
            }
            this._pendingStackOperation = null;
        }
        _getOrCreateEditStackElement(beginSelectionState, undoRedoGroup, alternativeVersionId) {
            return this._pendingStackOperation ??= new StackOperation(this._textModel, undoRedoGroup, this._pauseableEmitter, this._postUndoRedo, beginSelectionState, alternativeVersionId || '');
        }
        pushEditOperation(element, beginSelectionState, resultSelectionState, alternativeVersionId, undoRedoGroup) {
            const pendingStackOperation = this._getOrCreateEditStackElement(beginSelectionState, undoRedoGroup, alternativeVersionId);
            pendingStackOperation.pushEditOperation(element, beginSelectionState, resultSelectionState, alternativeVersionId);
        }
    }
    class NotebookEventEmitter extends event_1.PauseableEmitter {
        isDirtyEvent() {
            for (const e of this._eventQueue) {
                for (let i = 0; i < e.rawEvents.length; i++) {
                    if (!e.rawEvents[i].transient) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    let NotebookTextModel = NotebookTextModel_1 = class NotebookTextModel extends lifecycle_1.Disposable {
        get length() {
            return this._cells.length;
        }
        get cells() {
            return this._cells;
        }
        get versionId() {
            return this._versionId;
        }
        get alternativeVersionId() {
            return this._alternativeVersionId;
        }
        constructor(viewType, uri, cells, metadata, options, _undoService, _modelService, _languageService) {
            super();
            this.viewType = viewType;
            this.uri = uri;
            this._undoService = _undoService;
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._isDisposed = false;
            this._onWillDispose = this._register(new event_1.Emitter());
            this._onWillAddRemoveCells = this._register(new event_1.Emitter());
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.onWillAddRemoveCells = this._onWillAddRemoveCells.event;
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._cellhandlePool = 0;
            this._cellListeners = new Map();
            this._cells = [];
            this.metadata = {};
            this.transientOptions = { transientCellMetadata: {}, transientDocumentMetadata: {}, transientOutputs: false, cellContentMetadata: {} };
            this._versionId = 0;
            /**
             * This alternative id is only for non-cell-content changes.
             */
            this._notebookSpecificAlternativeId = 0;
            /**
             * Unlike, versionId, this can go down (via undo) or go to previous values (via redo)
             */
            this._alternativeVersionId = '1';
            this.transientOptions = options;
            this.metadata = metadata;
            this._initialize(cells);
            const maybeUpdateCellTextModel = (textModel) => {
                if (textModel.uri.scheme === network_1.Schemas.vscodeNotebookCell && textModel instanceof textModel_1.TextModel) {
                    const cellUri = notebookCommon_1.CellUri.parse(textModel.uri);
                    if (cellUri && (0, resources_1.isEqual)(cellUri.notebook, this.uri)) {
                        const cellIdx = this._getCellIndexByHandle(cellUri.handle);
                        if (cellIdx >= 0) {
                            const cell = this.cells[cellIdx];
                            if (cell) {
                                cell.textModel = textModel;
                            }
                        }
                    }
                }
            };
            this._register(_modelService.onModelAdded(e => maybeUpdateCellTextModel(e)));
            this._pauseableEmitter = new NotebookEventEmitter({
                merge: (events) => {
                    const first = events[0];
                    const rawEvents = first.rawEvents;
                    let versionId = first.versionId;
                    let endSelectionState = first.endSelectionState;
                    let synchronous = first.synchronous;
                    for (let i = 1; i < events.length; i++) {
                        rawEvents.push(...events[i].rawEvents);
                        versionId = events[i].versionId;
                        endSelectionState = events[i].endSelectionState !== undefined ? events[i].endSelectionState : endSelectionState;
                        synchronous = events[i].synchronous !== undefined ? events[i].synchronous : synchronous;
                    }
                    return { rawEvents, versionId, endSelectionState, synchronous };
                }
            });
            this._register(this._pauseableEmitter.event(e => {
                if (e.rawEvents.length) {
                    this._onDidChangeContent.fire(e);
                }
            }));
            this._operationManager = new NotebookOperationManager(this, this._undoService, this._pauseableEmitter, (alternativeVersionId) => {
                this._increaseVersionId(true);
                this._overwriteAlternativeVersionId(alternativeVersionId);
            });
        }
        setCellCollapseDefault(collapseConfig) {
            this._defaultCollapseConfig = collapseConfig;
        }
        _initialize(cells, triggerDirty) {
            this._cells = [];
            this._versionId = 0;
            this._notebookSpecificAlternativeId = 0;
            const mainCells = cells.map(cell => {
                const cellHandle = this._cellhandlePool++;
                const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                const collapseState = this._getDefaultCollapseState(cell);
                return new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cell.source, cell.language, cell.mime, cell.cellKind, cell.outputs, cell.metadata, cell.internalMetadata, collapseState, this.transientOptions, this._languageService);
            });
            for (let i = 0; i < mainCells.length; i++) {
                const dirtyStateListener = mainCells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(mainCells[i], e);
                });
                this._cellListeners.set(mainCells[i].handle, dirtyStateListener);
                this._register(mainCells[i]);
            }
            this._cells.splice(0, 0, ...mainCells);
            this._alternativeVersionId = this._generateAlternativeId();
            if (triggerDirty) {
                this._pauseableEmitter.fire({
                    rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.Unknown, transient: false }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _bindCellContentHandler(cell, e) {
            this._increaseVersionId(e === 'content');
            switch (e) {
                case 'content':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellContent, index: this._getCellIndexByHandle(cell.handle), transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
                case 'language':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage, index: this._getCellIndexByHandle(cell.handle), language: cell.language, transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
                case 'mime':
                    this._pauseableEmitter.fire({
                        rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMime, index: this._getCellIndexByHandle(cell.handle), mime: cell.mime, transient: false }],
                        versionId: this.versionId,
                        synchronous: true,
                        endSelectionState: undefined
                    });
                    break;
            }
        }
        _generateAlternativeId() {
            return `${this._notebookSpecificAlternativeId}_` + this.cells.map(cell => cell.handle + ',' + cell.alternativeId).join(';');
        }
        dispose() {
            if (this._isDisposed) {
                // NotebookEditorModel can be disposed twice, don't fire onWillDispose again
                return;
            }
            this._isDisposed = true;
            this._onWillDispose.fire();
            this._undoService.removeElements(this.uri);
            (0, lifecycle_1.dispose)(this._cellListeners.values());
            this._cellListeners.clear();
            (0, lifecycle_1.dispose)(this._cells);
            this._cells = [];
            super.dispose();
        }
        pushStackElement() {
            // https://github.com/microsoft/vscode/issues/207523
        }
        _getCellIndexByHandle(handle) {
            return this.cells.findIndex(c => c.handle === handle);
        }
        _getCellIndexWithOutputIdHandleFromEdits(outputId, rawEdits) {
            const edit = rawEdits.find(e => 'outputs' in e && e.outputs.some(o => o.outputId === outputId));
            if (edit) {
                if ('index' in edit) {
                    return edit.index;
                }
                else if ('handle' in edit) {
                    const cellIndex = this._getCellIndexByHandle(edit.handle);
                    this._assertIndex(cellIndex);
                    return cellIndex;
                }
            }
            return -1;
        }
        _getCellIndexWithOutputIdHandle(outputId) {
            return this.cells.findIndex(c => !!c.outputs.find(o => o.outputId === outputId));
        }
        reset(cells, metadata, transientOptions) {
            this.transientOptions = transientOptions;
            const edits = NotebookTextModel_1.computeEdits(this, cells);
            this.applyEdits([
                ...edits,
                { editType: 5 /* CellEditType.DocumentMetadata */, metadata }
            ], true, undefined, () => undefined, undefined, false);
        }
        static computeEdits(model, cells) {
            const edits = [];
            const commonPrefix = this._commonPrefix(model.cells, model.cells.length, 0, cells, cells.length, 0);
            if (commonPrefix > 0) {
                for (let i = 0; i < commonPrefix; i++) {
                    edits.push({
                        editType: 3 /* CellEditType.Metadata */,
                        index: i,
                        metadata: cells[i].metadata ?? {}
                    }, ...this._computeOutputEdit(i, model.cells[i].outputs, cells[i].outputs));
                }
            }
            if (model.cells.length === cells.length && commonPrefix === model.cells.length) {
                return edits;
            }
            const commonSuffix = this._commonSuffix(model.cells, model.cells.length - commonPrefix, commonPrefix, cells, cells.length - commonPrefix, commonPrefix);
            if (commonSuffix > 0) {
                edits.push({ editType: 1 /* CellEditType.Replace */, index: commonPrefix, count: model.cells.length - commonPrefix - commonSuffix, cells: cells.slice(commonPrefix, cells.length - commonSuffix) });
            }
            else if (commonPrefix > 0) {
                edits.push({ editType: 1 /* CellEditType.Replace */, index: commonPrefix, count: model.cells.length - commonPrefix, cells: cells.slice(commonPrefix) });
            }
            else {
                edits.push({ editType: 1 /* CellEditType.Replace */, index: 0, count: model.cells.length, cells });
            }
            if (commonSuffix > 0) {
                // has same suffix
                for (let i = commonSuffix; i > 0; i--) {
                    edits.push({
                        editType: 3 /* CellEditType.Metadata */,
                        index: model.cells.length - i,
                        metadata: cells[cells.length - i].metadata ?? {}
                    }, ...this._computeOutputEdit(model.cells.length - i, model.cells[model.cells.length - i].outputs, cells[cells.length - i].outputs));
                }
            }
            return edits;
        }
        static _computeOutputEdit(index, a, b) {
            if (a.length !== b.length) {
                return [
                    {
                        editType: 2 /* CellEditType.Output */,
                        index: index,
                        outputs: b,
                        append: false
                    }
                ];
            }
            if (a.length === 0) {
                // no output
                return [];
            }
            // same length
            return b.map((output, i) => {
                return {
                    editType: 7 /* CellEditType.OutputItems */,
                    outputId: a[i].outputId,
                    items: output.outputs,
                    append: false
                };
            });
        }
        static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a[aDelta + i].fastEqual(b[bDelta + i]); i++) {
                result++;
            }
            return result;
        }
        static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a[aDelta + aLen - i - 1].fastEqual(b[bDelta + bLen - i - 1]); i++) {
                result++;
            }
            return result;
        }
        applyEdits(rawEdits, synchronous, beginSelectionState, endSelectionsComputer, undoRedoGroup, computeUndoRedo) {
            this._pauseableEmitter.pause();
            this._operationManager.pushStackElement(this._alternativeVersionId, undefined);
            try {
                this._doApplyEdits(rawEdits, synchronous, computeUndoRedo, beginSelectionState, undoRedoGroup);
                return true;
            }
            finally {
                // Update selection and versionId after applying edits.
                const endSelections = endSelectionsComputer();
                this._increaseVersionId(this._operationManager.isUndoStackEmpty() && !this._pauseableEmitter.isDirtyEvent());
                // Finalize undo element
                this._operationManager.pushStackElement(this._alternativeVersionId, endSelections);
                // Broadcast changes
                this._pauseableEmitter.fire({ rawEvents: [], versionId: this.versionId, synchronous: synchronous, endSelectionState: endSelections });
                this._pauseableEmitter.resume();
            }
        }
        _doApplyEdits(rawEdits, synchronous, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            const editsWithDetails = rawEdits.map((edit, index) => {
                let cellIndex = -1;
                if ('index' in edit) {
                    cellIndex = edit.index;
                }
                else if ('handle' in edit) {
                    cellIndex = this._getCellIndexByHandle(edit.handle);
                    this._assertIndex(cellIndex);
                }
                else if ('outputId' in edit) {
                    cellIndex = this._getCellIndexWithOutputIdHandle(edit.outputId);
                    if (this._indexIsInvalid(cellIndex)) {
                        // The referenced output may have been created in this batch of edits
                        cellIndex = this._getCellIndexWithOutputIdHandleFromEdits(edit.outputId, rawEdits.slice(0, index));
                    }
                    if (this._indexIsInvalid(cellIndex)) {
                        // It's possible for an edit to refer to an output which was just cleared, ignore it without throwing
                        return null;
                    }
                }
                else if (edit.editType !== 5 /* CellEditType.DocumentMetadata */) {
                    throw new Error('Invalid cell edit');
                }
                return {
                    edit,
                    cellIndex,
                    end: (edit.editType === 5 /* CellEditType.DocumentMetadata */)
                        ? undefined
                        : (edit.editType === 1 /* CellEditType.Replace */ ? edit.index + edit.count : cellIndex),
                    originalIndex: index
                };
            }).filter(types_1.isDefined);
            // compress all edits which have no side effects on cell index
            const edits = this._mergeCellEdits(editsWithDetails)
                .sort((a, b) => {
                if (a.end === undefined) {
                    return -1;
                }
                if (b.end === undefined) {
                    return -1;
                }
                return b.end - a.end || b.originalIndex - a.originalIndex;
            }).reduce((prev, curr) => {
                if (!prev.length) {
                    // empty
                    prev.push([curr]);
                }
                else {
                    const last = prev[prev.length - 1];
                    const index = last[0].cellIndex;
                    if (curr.cellIndex === index) {
                        last.push(curr);
                    }
                    else {
                        prev.push([curr]);
                    }
                }
                return prev;
            }, []).map(editsOnSameIndex => {
                const replaceEdits = [];
                const otherEdits = [];
                editsOnSameIndex.forEach(edit => {
                    if (edit.edit.editType === 1 /* CellEditType.Replace */) {
                        replaceEdits.push(edit);
                    }
                    else {
                        otherEdits.push(edit);
                    }
                });
                return [...otherEdits.reverse(), ...replaceEdits];
            });
            const flattenEdits = edits.flat();
            for (const { edit, cellIndex } of flattenEdits) {
                switch (edit.editType) {
                    case 1 /* CellEditType.Replace */:
                        this._replaceCells(edit.index, edit.count, edit.cells, synchronous, computeUndoRedo, beginSelectionState, undoRedoGroup);
                        break;
                    case 2 /* CellEditType.Output */: {
                        this._assertIndex(cellIndex);
                        const cell = this._cells[cellIndex];
                        if (edit.append) {
                            this._spliceNotebookCellOutputs(cell, { start: cell.outputs.length, deleteCount: 0, newOutputs: edit.outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op)) }, true, computeUndoRedo);
                        }
                        else {
                            this._spliceNotebookCellOutputs2(cell, edit.outputs, computeUndoRedo);
                        }
                        break;
                    }
                    case 7 /* CellEditType.OutputItems */:
                        {
                            this._assertIndex(cellIndex);
                            const cell = this._cells[cellIndex];
                            if (edit.append) {
                                this._appendNotebookCellOutputItems(cell, edit.outputId, edit.items);
                            }
                            else {
                                this._replaceNotebookCellOutputItems(cell, edit.outputId, edit.items);
                            }
                        }
                        break;
                    case 3 /* CellEditType.Metadata */:
                        this._assertIndex(edit.index);
                        this._changeCellMetadata(this._cells[edit.index], edit.metadata, computeUndoRedo, beginSelectionState, undoRedoGroup);
                        break;
                    case 8 /* CellEditType.PartialMetadata */:
                        this._assertIndex(cellIndex);
                        this._changeCellMetadataPartial(this._cells[cellIndex], edit.metadata, computeUndoRedo, beginSelectionState, undoRedoGroup);
                        break;
                    case 9 /* CellEditType.PartialInternalMetadata */:
                        this._assertIndex(cellIndex);
                        this._changeCellInternalMetadataPartial(this._cells[cellIndex], edit.internalMetadata);
                        break;
                    case 4 /* CellEditType.CellLanguage */:
                        this._assertIndex(edit.index);
                        this._changeCellLanguage(this._cells[edit.index], edit.language, computeUndoRedo, beginSelectionState, undoRedoGroup);
                        break;
                    case 5 /* CellEditType.DocumentMetadata */:
                        this._updateNotebookCellMetadata(edit.metadata, computeUndoRedo, beginSelectionState, undoRedoGroup);
                        break;
                    case 6 /* CellEditType.Move */:
                        this._moveCellToIdx(edit.index, edit.length, edit.newIdx, synchronous, computeUndoRedo, beginSelectionState, undefined, undoRedoGroup);
                        break;
                }
            }
        }
        _mergeCellEdits(rawEdits) {
            const mergedEdits = [];
            rawEdits.forEach(edit => {
                if (mergedEdits.length) {
                    const last = mergedEdits[mergedEdits.length - 1];
                    if (last.edit.editType === 2 /* CellEditType.Output */
                        && last.edit.append
                        && edit.edit.editType === 2 /* CellEditType.Output */
                        && edit.edit.append
                        && last.cellIndex === edit.cellIndex) {
                        last.edit.outputs = [...last.edit.outputs, ...edit.edit.outputs];
                    }
                    else if (last.edit.editType === 2 /* CellEditType.Output */
                        && !last.edit.append // last cell is not append
                        && last.edit.outputs.length === 0 // last cell is clear outputs
                        && edit.edit.editType === 2 /* CellEditType.Output */
                        && edit.edit.append
                        && last.cellIndex === edit.cellIndex) {
                        last.edit.append = false;
                        last.edit.outputs = edit.edit.outputs;
                    }
                    else {
                        mergedEdits.push(edit);
                    }
                }
                else {
                    mergedEdits.push(edit);
                }
            });
            return mergedEdits;
        }
        _getDefaultCollapseState(cellDto) {
            const defaultConfig = cellDto.cellKind === notebookCommon_1.CellKind.Code ? this._defaultCollapseConfig?.codeCell : this._defaultCollapseConfig?.markupCell;
            return cellDto.collapseState ?? (defaultConfig ?? undefined);
        }
        _replaceCells(index, count, cellDtos, synchronous, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            if (count === 0 && cellDtos.length === 0) {
                return;
            }
            const oldViewCells = this._cells.slice(0);
            const oldSet = new Set();
            oldViewCells.forEach(cell => {
                oldSet.add(cell.handle);
            });
            // prepare remove
            for (let i = index; i < Math.min(index + count, this._cells.length); i++) {
                const cell = this._cells[i];
                this._cellListeners.get(cell.handle)?.dispose();
                this._cellListeners.delete(cell.handle);
            }
            // prepare add
            const cells = cellDtos.map(cellDto => {
                const cellHandle = this._cellhandlePool++;
                const cellUri = notebookCommon_1.CellUri.generate(this.uri, cellHandle);
                const collapseState = this._getDefaultCollapseState(cellDto);
                const cell = new notebookCellTextModel_1.NotebookCellTextModel(cellUri, cellHandle, cellDto.source, cellDto.language, cellDto.mime, cellDto.cellKind, cellDto.outputs || [], cellDto.metadata, cellDto.internalMetadata, collapseState, this.transientOptions, this._languageService);
                const textModel = this._modelService.getModel(cellUri);
                if (textModel && textModel instanceof textModel_1.TextModel) {
                    cell.textModel = textModel;
                    cell.language = cellDto.language;
                    cell.textModel.setValue(cellDto.source);
                    cell.resetTextBuffer(cell.textModel.getTextBuffer());
                }
                const dirtyStateListener = cell.onDidChangeContent((e) => {
                    this._bindCellContentHandler(cell, e);
                });
                this._cellListeners.set(cell.handle, dirtyStateListener);
                this._register(cell);
                return cell;
            });
            // compute change
            const cellsCopy = this._cells.slice(0);
            cellsCopy.splice(index, count, ...cells);
            const diffs = (0, notebookCommon_1.diff)(this._cells, cellsCopy, cell => {
                return oldSet.has(cell.handle);
            }).map(diff => {
                return [diff.start, diff.deleteCount, diff.toInsert];
            });
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes: diffs } });
            // make change
            this._cells = cellsCopy;
            const undoDiff = diffs.map(diff => {
                const deletedCells = oldViewCells.slice(diff[0], diff[0] + diff[1]);
                return [diff[0], deletedCells, diff[2]];
            });
            if (computeUndoRedo) {
                this._operationManager.pushEditOperation(new cellEdit_1.SpliceCellsEdit(this.uri, undoDiff, {
                    insertCell: (index, cell, endSelections) => { this._insertNewCell(index, [cell], true, endSelections); },
                    deleteCell: (index, endSelections) => { this._removeCell(index, 1, true, endSelections); },
                    replaceCell: (index, count, cells, endSelections) => { this._replaceNewCells(index, count, cells, true, endSelections); },
                }, undefined, undefined), beginSelectionState, undefined, this._alternativeVersionId, undoRedoGroup);
            }
            // should be deferred
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes: diffs, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: undefined
            });
        }
        _increaseVersionId(transient) {
            this._versionId = this._versionId + 1;
            if (!transient) {
                this._notebookSpecificAlternativeId = this._versionId;
            }
            this._alternativeVersionId = this._generateAlternativeId();
        }
        _overwriteAlternativeVersionId(newAlternativeVersionId) {
            this._alternativeVersionId = newAlternativeVersionId;
            this._notebookSpecificAlternativeId = Number(newAlternativeVersionId.substring(0, newAlternativeVersionId.indexOf('_')));
        }
        _updateNotebookCellMetadata(metadata, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            const oldMetadata = this.metadata;
            const triggerDirtyChange = this._isDocumentMetadataChanged(this.metadata, metadata);
            if (triggerDirtyChange) {
                if (computeUndoRedo) {
                    const that = this;
                    this._operationManager.pushEditOperation(new class {
                        constructor() {
                            this.type = 0 /* UndoRedoElementType.Resource */;
                            this.label = 'Update Cell Metadata';
                            this.code = 'undoredo.textBufferEdit';
                        }
                        get resource() {
                            return that.uri;
                        }
                        undo() {
                            that._updateNotebookCellMetadata(oldMetadata, false, beginSelectionState, undoRedoGroup);
                        }
                        redo() {
                            that._updateNotebookCellMetadata(metadata, false, beginSelectionState, undoRedoGroup);
                        }
                    }(), beginSelectionState, undefined, this._alternativeVersionId, undoRedoGroup);
                }
            }
            this.metadata = metadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeDocumentMetadata, metadata: this.metadata, transient: !triggerDirtyChange }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _insertNewCell(index, cells, synchronous, endSelections) {
            for (let i = 0; i < cells.length; i++) {
                const dirtyStateListener = cells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(cells[i], e);
                });
                this._cellListeners.set(cells[i].handle, dirtyStateListener);
            }
            const changes = [[index, 0, cells]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, 0, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
            return;
        }
        _removeCell(index, count, synchronous, endSelections) {
            for (let i = index; i < index + count; i++) {
                const cell = this._cells[i];
                this._cellListeners.get(cell.handle)?.dispose();
                this._cellListeners.delete(cell.handle);
            }
            const changes = [[index, count, []]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, count);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
        }
        _replaceNewCells(index, count, cells, synchronous, endSelections) {
            for (let i = index; i < index + count; i++) {
                const cell = this._cells[i];
                this._cellListeners.get(cell.handle)?.dispose();
                this._cellListeners.delete(cell.handle);
            }
            for (let i = 0; i < cells.length; i++) {
                const dirtyStateListener = cells[i].onDidChangeContent((e) => {
                    this._bindCellContentHandler(cells[i], e);
                });
                this._cellListeners.set(cells[i].handle, dirtyStateListener);
            }
            const changes = [[index, count, cells]];
            this._onWillAddRemoveCells.fire({ rawEvent: { kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes } });
            this._cells.splice(index, count, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ModelChange, changes, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
        }
        _isDocumentMetadataChanged(a, b) {
            const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
            for (const key of keys) {
                if (key === 'custom') {
                    if (!this._customMetadataEqual(a[key], b[key])
                        &&
                            !(this.transientOptions.transientDocumentMetadata[key])) {
                        return true;
                    }
                }
                else if ((a[key] !== b[key])
                    &&
                        !(this.transientOptions.transientDocumentMetadata[key])) {
                    return true;
                }
            }
            return false;
        }
        _isCellMetadataChanged(a, b) {
            const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
            for (const key of keys) {
                if ((a[key] !== b[key])
                    &&
                        !(this.transientOptions.transientCellMetadata[key])) {
                    return true;
                }
            }
            return false;
        }
        _customMetadataEqual(a, b) {
            if (!a && !b) {
                // both of them are nullish or undefined
                return true;
            }
            if (!a || !b) {
                return false;
            }
            const aProps = Object.getOwnPropertyNames(a);
            const bProps = Object.getOwnPropertyNames(b);
            if (aProps.length !== bProps.length) {
                return false;
            }
            for (let i = 0; i < aProps.length; i++) {
                const propName = aProps[i];
                if (a[propName] !== b[propName]) {
                    return false;
                }
            }
            return true;
        }
        _changeCellMetadataPartial(cell, metadata, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            const newMetadata = {
                ...cell.metadata
            };
            let k;
            for (k in metadata) {
                const value = metadata[k] ?? undefined;
                newMetadata[k] = value;
            }
            return this._changeCellMetadata(cell, newMetadata, computeUndoRedo, beginSelectionState, undoRedoGroup);
        }
        _changeCellMetadata(cell, metadata, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            const triggerDirtyChange = this._isCellMetadataChanged(cell.metadata, metadata);
            if (triggerDirtyChange) {
                if (computeUndoRedo) {
                    const index = this._cells.indexOf(cell);
                    this._operationManager.pushEditOperation(new cellEdit_1.CellMetadataEdit(this.uri, index, Object.freeze(cell.metadata), Object.freeze(metadata), {
                        updateCellMetadata: (index, newMetadata) => {
                            const cell = this._cells[index];
                            if (!cell) {
                                return;
                            }
                            this._changeCellMetadata(cell, newMetadata, false, beginSelectionState, undoRedoGroup);
                        }
                    }), beginSelectionState, undefined, this._alternativeVersionId, undoRedoGroup);
                }
            }
            // should be deferred
            cell.metadata = metadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata, index: this._cells.indexOf(cell), metadata: cell.metadata, transient: !triggerDirtyChange }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _changeCellInternalMetadataPartial(cell, internalMetadata) {
            const newInternalMetadata = {
                ...cell.internalMetadata
            };
            let k;
            for (k in internalMetadata) {
                const value = internalMetadata[k] ?? undefined;
                newInternalMetadata[k] = value;
            }
            cell.internalMetadata = newInternalMetadata;
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata, index: this._cells.indexOf(cell), internalMetadata: cell.internalMetadata, transient: true }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _changeCellLanguage(cell, languageId, computeUndoRedo, beginSelectionState, undoRedoGroup) {
            if (cell.language === languageId) {
                return;
            }
            const oldLanguage = cell.language;
            cell.language = languageId;
            if (computeUndoRedo) {
                const that = this;
                this._operationManager.pushEditOperation(new class {
                    constructor() {
                        this.type = 0 /* UndoRedoElementType.Resource */;
                        this.label = 'Update Cell Language';
                        this.code = 'undoredo.textBufferEdit';
                    }
                    get resource() {
                        return that.uri;
                    }
                    undo() {
                        that._changeCellLanguage(cell, oldLanguage, false, beginSelectionState, undoRedoGroup);
                    }
                    redo() {
                        that._changeCellLanguage(cell, languageId, false, beginSelectionState, undoRedoGroup);
                    }
                }(), beginSelectionState, undefined, this._alternativeVersionId, undoRedoGroup);
            }
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage, index: this._cells.indexOf(cell), language: languageId, transient: false }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _spliceNotebookCellOutputs2(cell, outputs, computeUndoRedo) {
            if (outputs.length === 0 && cell.outputs.length === 0) {
                return;
            }
            if (outputs.length <= 1) {
                this._spliceNotebookCellOutputs(cell, { start: 0, deleteCount: cell.outputs.length, newOutputs: outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op)) }, false, computeUndoRedo);
                return;
            }
            const diff = new diff_1.LcsDiff(new OutputSequence(cell.outputs), new OutputSequence(outputs));
            const diffResult = diff.ComputeDiff(false);
            const splices = diffResult.changes.map(change => ({
                start: change.originalStart,
                deleteCount: change.originalLength,
                // create cell output text model only when it's inserted into the notebook document
                newOutputs: outputs.slice(change.modifiedStart, change.modifiedStart + change.modifiedLength).map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op))
            }));
            splices.reverse().forEach(splice => {
                this._spliceNotebookCellOutputs(cell, splice, false, computeUndoRedo);
            });
        }
        _spliceNotebookCellOutputs(cell, splice, append, computeUndoRedo) {
            cell.spliceNotebookCellOutputs(splice);
            this._pauseableEmitter.fire({
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.Output,
                        index: this._cells.indexOf(cell),
                        outputs: cell.outputs.map(output => output.asDto()) ?? [],
                        append,
                        transient: this.transientOptions.transientOutputs,
                    }],
                versionId: this.versionId,
                synchronous: true,
                endSelectionState: undefined
            });
        }
        _appendNotebookCellOutputItems(cell, outputId, items) {
            if (cell.changeOutputItems(outputId, true, items)) {
                this._pauseableEmitter.fire({
                    rawEvents: [{
                            kind: notebookCommon_1.NotebookCellsChangeType.OutputItem,
                            index: this._cells.indexOf(cell),
                            outputId: outputId,
                            outputItems: items,
                            append: true,
                            transient: this.transientOptions.transientOutputs
                        }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _replaceNotebookCellOutputItems(cell, outputId, items) {
            if (cell.changeOutputItems(outputId, false, items)) {
                this._pauseableEmitter.fire({
                    rawEvents: [{
                            kind: notebookCommon_1.NotebookCellsChangeType.OutputItem,
                            index: this._cells.indexOf(cell),
                            outputId: outputId,
                            outputItems: items,
                            append: false,
                            transient: this.transientOptions.transientOutputs
                        }],
                    versionId: this.versionId,
                    synchronous: true,
                    endSelectionState: undefined
                });
            }
        }
        _moveCellToIdx(index, length, newIdx, synchronous, pushedToUndoStack, beforeSelections, endSelections, undoRedoGroup) {
            if (pushedToUndoStack) {
                this._operationManager.pushEditOperation(new cellEdit_1.MoveCellEdit(this.uri, index, length, newIdx, {
                    moveCell: (fromIndex, length, toIndex, beforeSelections, endSelections) => {
                        this._moveCellToIdx(fromIndex, length, toIndex, true, false, beforeSelections, endSelections, undoRedoGroup);
                    },
                }, beforeSelections, endSelections), beforeSelections, endSelections, this._alternativeVersionId, undoRedoGroup);
            }
            this._assertIndex(index);
            this._assertIndex(newIdx);
            const cells = this._cells.splice(index, length);
            this._cells.splice(newIdx, 0, ...cells);
            this._pauseableEmitter.fire({
                rawEvents: [{ kind: notebookCommon_1.NotebookCellsChangeType.Move, index, length, newIdx, cells, transient: false }],
                versionId: this.versionId,
                synchronous: synchronous,
                endSelectionState: endSelections
            });
            return true;
        }
        _assertIndex(index) {
            if (this._indexIsInvalid(index)) {
                throw new Error(`model index out of range ${index}`);
            }
        }
        _indexIsInvalid(index) {
            return index < 0 || index >= this._cells.length;
        }
    };
    exports.NotebookTextModel = NotebookTextModel;
    exports.NotebookTextModel = NotebookTextModel = NotebookTextModel_1 = __decorate([
        __param(5, undoRedo_1.IUndoRedoService),
        __param(6, model_1.IModelService),
        __param(7, language_1.ILanguageService)
    ], NotebookTextModel);
    class OutputSequence {
        constructor(outputs) {
            this.outputs = outputs;
        }
        getElements() {
            return this.outputs.map(output => {
                return (0, hash_1.hash)(output.outputs.map(output => ({
                    mime: output.mime,
                    data: output.data
                })));
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tUZXh0TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9tb2RlbC9ub3RlYm9va1RleHRNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxNQUFNLGNBQWM7UUFHbkIsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxtQ0FBbUMsQ0FBQztRQUN2RyxDQUFDO1FBT0QsSUFBVyxLQUFLO1lBQ2YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDM0UsQ0FBQztRQUVELFlBQ1UsU0FBNEIsRUFDNUIsYUFBd0MsRUFDekMsaUJBQWtFLEVBQ2xFLGFBQXFELEVBQzdELGNBQTJDLEVBQzNDLHlCQUFpQztZQUx4QixjQUFTLEdBQVQsU0FBUyxDQUFtQjtZQUM1QixrQkFBYSxHQUFiLGFBQWEsQ0FBMkI7WUFDekMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFpRDtZQUNsRSxrQkFBYSxHQUFiLGFBQWEsQ0FBd0M7WUFidEQsZ0JBQVcsR0FBdUIsRUFBRSxDQUFDO1lBQ3JDLHlCQUFvQixHQUFnQyxTQUFTLENBQUM7WUFDOUQsMEJBQXFCLEdBQWdDLFNBQVMsQ0FBQztZQWV0RSxJQUFJLENBQUMsSUFBSSx3Q0FBZ0MsQ0FBQztZQUMxQyxJQUFJLENBQUMsb0JBQW9C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