/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/common/core/range", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBuffer", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/notebook/common/model/notebookCellOutputTextModel"], function (require, exports, event_1, hash_1, lifecycle_1, UUID, range_1, pieceTreeTextBuffer_1, pieceTreeTextBufferBuilder_1, modesRegistry_1, notebookCellOutputTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellTextModel = void 0;
    exports.cloneNotebookCellTextModel = cloneNotebookCellTextModel;
    class NotebookCellTextModel extends lifecycle_1.Disposable {
        get outputs() {
            return this._outputs;
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            this._metadata = newMetadata;
            this._hash = null;
            this._onDidChangeMetadata.fire();
        }
        get internalMetadata() {
            return this._internalMetadata;
        }
        set internalMetadata(newInternalMetadata) {
            const lastRunSuccessChanged = this._internalMetadata.lastRunSuccess !== newInternalMetadata.lastRunSuccess;
            newInternalMetadata = {
                ...newInternalMetadata,
                ...{ runStartTimeAdjustment: computeRunStartTimeAdjustment(this._internalMetadata, newInternalMetadata) }
            };
            this._internalMetadata = newInternalMetadata;
            this._hash = null;
            this._onDidChangeInternalMetadata.fire({ lastRunSuccessChanged });
        }
        get language() {
            return this._language;
        }
        set language(newLanguage) {
            if (this._textModel
                // 1. the language update is from workspace edit, checking if it's the same as text model's mode
                && this._textModel.getLanguageId() === this._languageService.getLanguageIdByLanguageName(newLanguage)
                // 2. the text model's mode might be the same as the `this.language`, even if the language friendly name is not the same, we should not trigger an update
                && this._textModel.getLanguageId() === this._languageService.getLanguageIdByLanguageName(this.language)) {
                return;
            }
            const newLanguageId = this._languageService.getLanguageIdByLanguageName(newLanguage);
            if (newLanguageId === null) {
                return;
            }
            if (this._textModel) {
                const languageId = this._languageService.createById(newLanguageId);
                this._textModel.setLanguage(languageId.languageId);
            }
            if (this._language === newLanguage) {
                return;
            }
            this._language = newLanguage;
            this._hash = null;
            this._onDidChangeLanguage.fire(newLanguage);
            this._onDidChangeContent.fire('language');
        }
        get mime() {
            return this._mime;
        }
        set mime(newMime) {
            if (this._mime === newMime) {
                return;
            }
            this._mime = newMime;
            this._hash = null;
            this._onDidChangeContent.fire('mime');
        }
        get textBuffer() {
            if (this._textBuffer) {
                return this._textBuffer;
            }
            const builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            builder.acceptChunk(this._source);
            const bufferFactory = builder.finish(true);
            const { textBuffer, disposable } = bufferFactory.create(1 /* model.DefaultEndOfLine.LF */);
            this._textBuffer = textBuffer;
            this._register(disposable);
            this._register(this._textBuffer.onDidChangeContent(() => {
                this._hash = null;
                if (!this._textModel) {
                    this._onDidChangeContent.fire('content');
                }
            }));
            return this._textBuffer;
        }
        get alternativeId() {
            return this._alternativeId;
        }
        get textModel() {
            return this._textModel;
        }
        set textModel(m) {
            if (this._textModel === m) {
                return;
            }
            this._textModelDisposables.clear();
            this._textModel = m;
            if (this._textModel) {
                this.setRegisteredLanguage(this._languageService, this._textModel.getLanguageId(), this.language);
                // Listen to language changes on the model
                this._textModelDisposables.add(this._textModel.onDidChangeLanguage((e) => this.setRegisteredLanguage(this._languageService, e.newLanguage, this.language)));
                this._textModelDisposables.add(this._textModel.onWillDispose(() => this.textModel = undefined));
                this._textModelDisposables.add(this._textModel.onDidChangeContent(() => {
                    if (this._textModel) {
                        this._versionId = this._textModel.getVersionId();
                        this._alternativeId = this._textModel.getAlternativeVersionId();
                    }
                    this._onDidChangeContent.fire('content');
                }));
                this._textModel._overwriteVersionId(this._versionId);
                this._textModel._overwriteAlternativeVersionId(this._versionId);
            }
        }
        setRegisteredLanguage(languageService, newLanguage, currentLanguage) {
            // The language defined in the cell might not be supported in the editor so the text model might be using the default fallback
            // If so let's not modify the language
            const isFallBackLanguage = (newLanguage === modesRegistry_1.PLAINTEXT_LANGUAGE_ID || newLanguage === 'jupyter');
            if (!languageService.isRegisteredLanguageId(currentLanguage) && isFallBackLanguage) {
                // notify to display warning, but don't change the language
                this._onDidChangeLanguage.fire(currentLanguage);
            }
            else {
                this.language = newLanguage;
            }
        }
        constructor(uri, handle, _source, _language, _mime, cellKind, outputs, metadata, internalMetadata, collapseState, transientOptions, _languageService) {
            super();
            this.uri = uri;
            this.handle = handle;
            this._source = _source;
            this._language = _language;
            this._mime = _mime;
            this.cellKind = cellKind;
            this.collapseState = collapseState;
            this.transientOptions = transientOptions;
            this._languageService = _languageService;
            this._onDidChangeOutputs = this._register(new event_1.Emitter());
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidChangeOutputItems = this._register(new event_1.Emitter());
            this.onDidChangeOutputItems = this._onDidChangeOutputItems.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeInternalMetadata = this._register(new event_1.Emitter());
            this.onDidChangeInternalMetadata = this._onDidChangeInternalMetadata.event;
            this._onDidChangeLanguage = this._register(new event_1.Emitter());
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._textBufferHash = null;
            this._hash = null;
            this._versionId = 1;
            this._alternativeId = 1;
            this._textModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._textModel = undefined;
            this._outputs = outputs.map(op => new notebookCellOutputTextModel_1.NotebookCellOutputTextModel(op));
            this._metadata = metadata ?? {};
            this._internalMetadata = internalMetadata ?? {};
        }
        resetTextBuffer(textBuffer) {
            this._textBuffer = textBuffer;
        }
        getValue() {
            const fullRange = this.getFullModelRange();
            const eol = this.textBuffer.getEOL();
            if (eol === '\n') {
                return this.textBuffer.getValueInRange(fullRange, 1 /* model.EndOfLinePreference.LF */);
            }
            else {
                return this.textBuffer.getValueInRange(fullRange, 2 /* model.EndOfLinePreference.CRLF */);
            }
        }
        getTextBufferHash() {
            if (this._textBufferHash !== null) {
                return this._textBufferHash;
            }
            const shaComputer = new hash_1.StringSHA1();
            const snapshot = this.textBuffer.createSnapshot(false);
            let text;
            while ((text = snapshot.read())) {
                shaComputer.update(text);
            }
            this._textBufferHash = shaComputer.digest();
            return this._textBufferHash;
        }
        getHashValue() {
            if (this._hash !== null) {
                return this._hash;
            }
            this._hash = (0, hash_1.hash)([(0, hash_1.hash)(this.language), this.getTextBufferHash(), this._getPersisentMetadata(), this.transientOptions.transientOutputs ? [] : this._outputs.map(op => ({
                    outputs: op.outputs.map(output => ({
                        mime: output.mime,
                        data: Array.from(output.data.buffer)
                    })),
                    metadata: op.metadata
                }))]);
            return this._hash;
        }
        _getPersisentMetadata() {
            const filteredMetadata = {};
            const transientCellMetadata = this.transientOptions.transientCellMetadata;
            const keys = new Set([...Object.keys(this.metadata)]);
            for (const key of keys) {
                if (!(transientCellMetadata[key])) {
                    filteredMetadata[key] = this.metadata[key];
                }
            }
            return filteredMetadata;
        }
        getTextLength() {
            return this.textBuffer.getLength();
        }
        getFullModelRange() {
            const lineCount = this.textBuffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
        }
        spliceNotebookCellOutputs(splice) {
            if (splice.deleteCount > 0 && splice.newOutputs.length > 0) {
                const commonLen = Math.min(splice.deleteCount, splice.newOutputs.length);
                // update
                for (let i = 0; i < commonLen; i++) {
                    const currentOutput = this.outputs[splice.start + i];
                    const newOutput = splice.newOutputs[i];
                    this.replaceOutput(currentOutput.outputId, newOutput);
                }
                const removed = this.outputs.splice(splice.start + commonLen, splice.deleteCount - commonLen, ...splice.newOutputs.slice(commonLen));
                removed.forEach(output => output.dispose());
                this._onDidChangeOutputs.fire({ start: splice.start + commonLen, deleteCount: splice.deleteCount - commonLen, newOutputs: splice.newOutputs.slice(commonLen) });
            }
            else {
                const removed = this.outputs.splice(splice.start, splice.deleteCount, ...splice.newOutputs);
                removed.forEach(output => output.dispose());
                this._onDidChangeOutputs.fire(splice);
            }
        }
        replaceOutput(outputId, newOutputItem) {
            const outputIndex = this.outputs.findIndex(output => output.outputId === outputId);
            if (outputIndex < 0) {
                return false;
            }
            const output = this.outputs[outputIndex];
            // convert to dto and dispose the cell output model
            output.replaceData({
                outputs: newOutputItem.outputs,
                outputId: newOutputItem.outputId,
                metadata: newOutputItem.metadata
            });
            newOutputItem.dispose();
            this._onDidChangeOutputItems.fire();
            return true;
        }
        changeOutputItems(outputId, append, items) {
            const outputIndex = this.outputs.findIndex(output => output.outputId === outputId);
            if (outputIndex < 0) {
                return false;
            }
            const output = this.outputs[outputIndex];
            if (append) {
                output.appendData(items);
            }
            else {
                output.replaceData({ outputId: outputId, outputs: items, metadata: output.metadata });
            }
            this._onDidChangeOutputItems.fire();
            return true;
        }
        _outputNotEqualFastCheck(left, right) {
            if (left.length !== right.length) {
                return false;
            }
            for (let i = 0; i < this.outputs.length; i++) {
                const l = left[i];
                const r = right[i];
                if (l.outputs.length !== r.outputs.length) {
                    return false;
                }
                for (let k = 0; k < l.outputs.length; k++) {
                    if (l.outputs[k].mime !== r.outputs[k].mime) {
                        return false;
                    }
                    if (l.outputs[k].data.byteLength !== r.outputs[k].data.byteLength) {
                        return false;
                    }
                }
            }
            return true;
        }
        equal(b) {
            if (this.language !== b.language) {
                return false;
            }
            if (this.getTextLength() !== b.getTextLength()) {
                return false;
            }
            if (!this.transientOptions.transientOutputs) {
                // compare outputs
                if (!this._outputNotEqualFastCheck(this.outputs, b.outputs)) {
                    return false;
                }
            }
            return this.getHashValue() === b.getHashValue();
        }
        /**
         * Only compares
         * - language
         * - mime
         * - cellKind
         * - internal metadata
         * - source
         */
        fastEqual(b) {
            if (this.language !== b.language) {
                return false;
            }
            if (this.mime !== b.mime) {
                return false;
            }
            if (this.cellKind !== b.cellKind) {
                return false;
            }
            if (this.internalMetadata?.executionOrder !== b.internalMetadata?.executionOrder
                || this.internalMetadata?.lastRunSuccess !== b.internalMetadata?.lastRunSuccess
                || this.internalMetadata?.runStartTime !== b.internalMetadata?.runStartTime
                || this.internalMetadata?.runStartTimeAdjustment !== b.internalMetadata?.runStartTimeAdjustment
                || this.internalMetadata?.runEndTime !== b.internalMetadata?.runEndTime) {
                return false;
            }
            // Once we attach the cell text buffer to an editor, the source of truth is the text buffer instead of the original source
            if (this._textBuffer && this.getValue() !== b.source) {
                return false;
            }
            else if (this._source !== b.source) {
                return false;
            }
            return true;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._outputs);
            // Manually release reference to previous text buffer to avoid large leaks
            // in case someone leaks a CellTextModel reference
            const emptyDisposedTextBuffer = new pieceTreeTextBuffer_1.PieceTreeTextBuffer([], '', '\n', false, false, true, true);
            emptyDisposedTextBuffer.dispose();
            this._textBuffer = emptyDisposedTextBuffer;
            super.dispose();
        }
    }
    exports.NotebookCellTextModel = NotebookCellTextModel;
    function cloneNotebookCellTextModel(cell) {
        return {
            source: cell.getValue(),
            language: cell.language,
            mime: cell.mime,
            cellKind: cell.cellKind,
            outputs: cell.outputs.map(output => ({
                outputs: output.outputs,
                /* paste should generate new outputId */ outputId: UUID.generateUuid()
            })),
            metadata: {}
        };
    }
    function computeRunStartTimeAdjustment(oldMetadata, newMetadata) {
        if (oldMetadata.runStartTime !== newMetadata.runStartTime && typeof newMetadata.runStartTime === 'number') {
            const offset = Date.now() - newMetadata.runStartTime;
            return offset < 0 ? Math.abs(offset) : 0;
        }
        else {
            return newMetadata.runStartTimeAdjustment;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsVGV4dE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbW9kZWwvbm90ZWJvb2tDZWxsVGV4dE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXFiaEcsZ0VBWUM7SUFoYkQsTUFBYSxxQkFBc0IsU0FBUSxzQkFBVTtRQXFCcEQsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO1FBQ3RCLENBQUM7UUFJRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksUUFBUSxDQUFDLFdBQWlDO1lBQzdDLElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDO1lBQzdCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBSUQsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFDL0IsQ0FBQztRQUVELElBQUksZ0JBQWdCLENBQUMsbUJBQWlEO1lBQ3JFLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsS0FBSyxtQkFBbUIsQ0FBQyxjQUFjLENBQUM7WUFDM0csbUJBQW1CLEdBQUc7Z0JBQ3JCLEdBQUcsbUJBQW1CO2dCQUN0QixHQUFHLEVBQUUsc0JBQXNCLEVBQUUsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLG1CQUFtQixDQUFDLEVBQUU7YUFDekcsQ0FBQztZQUNGLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxtQkFBbUIsQ0FBQztZQUM3QyxJQUFJLENBQUMs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