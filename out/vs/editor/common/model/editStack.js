/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/editor/common/core/selection", "vs/base/common/uri", "vs/editor/common/core/textChange", "vs/base/common/buffer", "vs/base/common/resources"], function (require, exports, nls, errors_1, selection_1, uri_1, textChange_1, buffer, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditStack = exports.MultiModelEditStackElement = exports.SingleModelEditStackElement = exports.SingleModelEditStackData = void 0;
    exports.isEditStackElement = isEditStackElement;
    function uriGetComparisonKey(resource) {
        return resource.toString();
    }
    class SingleModelEditStackData {
        static create(model, beforeCursorState) {
            const alternativeVersionId = model.getAlternativeVersionId();
            const eol = getModelEOL(model);
            return new SingleModelEditStackData(alternativeVersionId, alternativeVersionId, eol, eol, beforeCursorState, beforeCursorState, []);
        }
        constructor(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes) {
            this.beforeVersionId = beforeVersionId;
            this.afterVersionId = afterVersionId;
            this.beforeEOL = beforeEOL;
            this.afterEOL = afterEOL;
            this.beforeCursorState = beforeCursorState;
            this.afterCursorState = afterCursorState;
            this.changes = changes;
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (textChanges.length > 0) {
                this.changes = (0, textChange_1.compressConsecutiveTextChanges)(this.changes, textChanges);
            }
            this.afterEOL = afterEOL;
            this.afterVersionId = afterVersionId;
            this.afterCursorState = afterCursorState;
        }
        static _writeSelectionsSize(selections) {
            return 4 + 4 * 4 * (selections ? selections.length : 0);
        }
        static _writeSelections(b, selections, offset) {
            buffer.writeUInt32BE(b, (selections ? selections.length : 0), offset);
            offset += 4;
            if (selections) {
                for (const selection of selections) {
                    buffer.writeUInt32BE(b, selection.selectionStartLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.selectionStartColumn, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionColumn, offset);
                    offset += 4;
                }
            }
            return offset;
        }
        static _readSelections(b, offset, dest) {
            const count = buffer.readUInt32BE(b, offset);
            offset += 4;
            for (let i = 0; i < count; i++) {
                const selectionStartLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const selectionStartColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                dest.push(new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn));
            }
            return offset;
        }
        serialize() {
            let necessarySize = (+4 // beforeVersionId
                + 4 // afterVersionId
                + 1 // beforeEOL
                + 1 // afterEOL
                + SingleModelEditStackData._writeSelectionsSize(this.beforeCursorState)
                + SingleModelEditStackData._writeSelectionsSize(this.afterCursorState)
                + 4 // change count
            );
            for (const change of this.changes) {
                necessarySize += change.writeSize();
            }
            const b = new Uint8Array(necessarySize);
            let offset = 0;
            buffer.writeUInt32BE(b, this.beforeVersionId, offset);
            offset += 4;
            buffer.writeUInt32BE(b, this.afterVersionId, offset);
            offset += 4;
            buffer.writeUInt8(b, this.beforeEOL, offset);
            offset += 1;
            buffer.writeUInt8(b, this.afterEOL, offset);
            offset += 1;
            offset = SingleModelEditStackData._writeSelections(b, this.beforeCursorState, offset);
            offset = SingleModelEditStackData._writeSelections(b, this.afterCursorState, offset);
            buffer.writeUInt32BE(b, this.changes.length, offset);
            offset += 4;
            for (const change of this.changes) {
                offset = change.write(b, offset);
            }
            return b.buffer;
        }
        static deserialize(source) {
            const b = new Uint8Array(source);
            let offset = 0;
            const beforeVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const afterVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const beforeEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const afterEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const beforeCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, beforeCursorState);
            const afterCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, afterCursorState);
            const changeCount = buffer.readUInt32BE(b, offset);
            offset += 4;
            const changes = [];
            for (let i = 0; i < changeCount; i++) {
                offset = textChange_1.TextChange.read(b, offset, changes);
            }
            return new SingleModelEditStackData(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes);
        }
    }
    exports.SingleModelEditStackData = SingleModelEditStackData;
    class SingleModelEditStackElement {
        get type() {
            return 0 /* UndoRedoElementType.Resource */;
        }
        get resource() {
            if (uri_1.URI.isUri(this.model)) {
                return this.model;
            }
            return this.model.uri;
        }
        constructor(label, code, model, beforeCursorState) {
            this.label = label;
            this.code = code;
            this.model = model;
            this._data = SingleModelEditStackData.create(model, beforeCursorState);
        }
        toString() {
            const data = (this._data instanceof SingleModelEditStackData ? this._data : SingleModelEditStackData.deserialize(this._data));
            return data.changes.map(change => change.toString()).join(', ');
        }
        matchesResource(resource) {
            const uri = (uri_1.URI.isUri(this.model) ? this.model : this.model.uri);
            return (uri.toString() === resource.toString());
        }
        setModel(model) {
            this.model = model;
        }
        canAppend(model) {
            return (this.model === model && this._data instanceof SingleModelEditStackData);
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (this._data instanceof SingleModelEditStackData) {
                this._data.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
            }
        }
        close() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
        }
        open() {
            if (!(this._data instanceof SingleModelEditStackData)) {
                this._data = SingleModelEditStackData.deserialize(this._data);
            }
        }
        undo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyUndo(data.changes, data.beforeEOL, data.beforeVersionId, data.beforeCursorState);
        }
        redo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyRedo(data.changes, data.afterEOL, data.afterVersionId, data.afterCursorState);
        }
        heapSize() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            return this._data.byteLength + 168 /*heap overhead*/;
        }
    }
    exports.SingleModelEditStackElement = SingleModelEditStackElement;
    class MultiModelEditStackElement {
        get resources() {
            return this._editStackElementsArr.map(editStackElement => editStackElement.resource);
        }
        constructor(label, code, editStackElements) {
            this.label = label;
            this.code = code;
            this.type = 1 /* UndoRedoElementType.Workspace */;
            this._isOpen = true;
            this._editStackElementsArr = editStackElements.slice(0);
            this._editStackElementsMap = new Map();
            for (const editStackElement of this._editStackElementsArr) {
                const key = uriGetComparisonKey(editStackElement.resource);
                this._editStackElementsMap.set(key, editStackElement);
            }
            this._delegate = null;
        }
        setDelegate(delegate) {
            this._delegate = delegate;
        }
        prepareUndoRedo() {
            if (this._delegate) {
                return this._delegate.prepareUndoRedo(this);
            }
        }
        getMissingModels() {
            const result = [];
            for (const editStackElement of this._editStackElementsArr) {
                if (uri_1.URI.isUri(editStackElement.model)) {
                    result.push(editStackElement.model);
                }
            }
            return result;
        }
        matchesResource(resource) {
            const key = uriGetComparisonKey(resource);
            return (this._editStackElementsMap.has(key));
        }
        setModel(model) {
            const key = uriGetComparisonKey(uri_1.URI.isUri(model) ? model : model.uri);
            if (this._editStackElementsMap.has(key)) {
                this._editStackElementsMap.get(key).setModel(model);
            }
        }
        canAppend(model) {
            if (!this._isOpen) {
                return false;
            }
            const key = uriGetComparisonKey(model.uri);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.canAppend(model);
            }
            return false;
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            const key = uriGetComparisonKey(model.uri);
            const editStackElement = this._editStackElementsMap.get(key);
            editStackElement.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
        }
        close() {
            this._isOpen = false;
        }
        open() {
            // cannot reopen
        }
        undo() {
            this._isOpen = false;
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.undo();
            }
        }
        redo() {
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.redo();
            }
        }
        heapSize(resource) {
            const key = uriGetComparisonKey(resource);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.heapSize();
            }
            return 0;
        }
        split() {
            return this._editStackElementsArr;
        }
        toString() {
            const result = [];
            for (const editStackElement of this._editStackElementsArr) {
                result.push(`${(0, resources_1.basename)(editStackElement.resource)}: ${editStackElement}`);
            }
            return `{${result.join(', ')}}`;
        }
    }
    exports.MultiModelEditStackElement = MultiModelEditStackElement;
    function getModelEOL(model) {
        const eol = model.getEOL();
        if (eol === '\n') {
            return 0 /* EndOfLineSequence.LF */;
        }
        else {
            return 1 /* EndOfLineSequence.CRLF */;
        }
    }
    function isEditStackElement(element) {
        if (!element) {
            return false;
        }
        return ((element instanceof SingleModelEditStackElement) || (element instanceof MultiModelEditStackElement));
    }
    class EditStack {
        constructor(model, undoRedoService) {
            this._model = model;
            this._undoRedoService = undoRedoService;
        }
        pushStackElement() {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement)) {
                lastElement.close();
            }
        }
        popStackElement() {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement)) {
                lastElement.open();
            }
        }
        clear() {
            this._undoRedoService.removeElements(this._model.uri);
        }
        _getOrCreateEditStackElement(beforeCursorState, group) {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isEditStackElement(lastElement) && lastElement.canAppend(this._model)) {
                return lastElement;
            }
            const newElement = new SingleModelEditStackElement(nls.localize('edit', "Typing"), 'undoredo.textBufferEdit', this._model, beforeCursorState);
            this._undoRedoService.pushElement(newElement, group);
            return newElement;
        }
        pushEOL(eol) {
            const editStackElement = this._getOrCreateEditStackElement(null, undefined);
            this._model.setEOL(eol);
            editStackElement.append(this._model, [], getModelEOL(this._model), this._model.getAlternativeVersionId(), null);
        }
        pushEditOperation(beforeCursorState, editOperations, cursorStateComputer, group) {
            const editStackElement = this._getOrCreateEditStackElement(beforeCursorState, group);
            const inverseEditOperations = this._model.applyEdits(editOperations, true);
            const afterCursorState = EditStack._computeCursorState(cursorStateComputer, inverseEditOperations);
            const textChanges = inverseEditOperations.map((op, index) => ({ index: index, textChange: op.textChange }));
            textChanges.sort((a, b) => {
                if (a.textChange.oldPosition === b.textChange.oldPosition) {
                    return a.index - b.index;
                }
                return a.textChange.oldPosition - b.textChange.oldPosition;
            });
            editStackElement.append(this._model, textChanges.map(op => op.textChange), getModelEOL(this._model), this._model.getAlternativeVersionId(), afterCursorState);
            return afterCursorState;
        }
        static _computeCursorState(cursorStateComputer, inverseEditOperations) {
            try {
                return cursorStateComputer ? cursorStateComputer(inverseEditOperations) : null;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
                return null;
            }
        }
    }
    exports.EditStack = EditStack;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFN0YWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29tbW9uL21vZGVsL2VkaXRTdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFvWGhHLGdEQUtDO0lBMVdELFNBQVMsbUJBQW1CLENBQUMsUUFBYTtRQUN6QyxPQUFPLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsTUFBYSx3QkFBd0I7UUFFN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFpQixFQUFFLGlCQUFxQztZQUM1RSxNQUFNLG9CQUFvQixHQUFHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzdELE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMvQixPQUFPLElBQUksd0JBQXdCLENBQ2xDLG9CQUFvQixFQUNwQixvQkFBb0IsRUFDcEIsR0FBRyxFQUNILEdBQUcsRUFDSCxpQkFBaUIsRUFDakIsaUJBQWlCLEVBQ2pCLEVBQUUsQ0FDRixDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQ2lCLGVBQXVCLEVBQ2hDLGNBQXNCLEVBQ2IsU0FBNEIsRUFDckMsUUFBMkIsRUFDbEIsaUJBQXFDLEVBQzlDLGdCQUFvQyxFQUNwQyxPQUFxQjtZQU5aLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1lBQ2hDLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1lBQ2IsY0FBUyxHQUFULFNBQVMsQ0FBbUI7WUFDckMsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDbEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUM5QyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW9CO1lBQ3BDLFlBQU8sR0FBUCxPQUFPLENBQWM7UUFDekIsQ0FBQztRQUVFLE1BQU0sQ0FBQyxLQUFpQixFQUFFLFdBQXlCLEVB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