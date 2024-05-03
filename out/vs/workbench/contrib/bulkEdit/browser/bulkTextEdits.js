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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/resolverService", "vs/editor/common/services/editorWorker", "vs/platform/undoRedo/common/undoRedo", "vs/editor/common/model/editStack", "vs/base/common/map", "vs/editor/common/services/model", "vs/editor/browser/services/bulkEditService", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, lifecycle_1, editOperation_1, range_1, resolverService_1, editorWorker_1, undoRedo_1, editStack_1, map_1, model_1, bulkEditService_1, snippetController2_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkTextEdits = void 0;
    class ModelEditTask {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
            this.model = this._modelReference.object.textEditorModel;
            this._edits = [];
        }
        dispose() {
            this._modelReference.dispose();
        }
        isNoOp() {
            if (this._edits.length > 0) {
                // contains textual edits
                return false;
            }
            if (this._newEol !== undefined && this._newEol !== this.model.getEndOfLineSequence()) {
                // contains an eol change that is a real change
                return false;
            }
            return true;
        }
        addEdit(resourceEdit) {
            this._expectedModelVersionId = resourceEdit.versionId;
            const { textEdit } = resourceEdit;
            if (typeof textEdit.eol === 'number') {
                // honor eol-change
                this._newEol = textEdit.eol;
            }
            if (!textEdit.range && !textEdit.text) {
                // lacks both a range and the text
                return;
            }
            if (range_1.Range.isEmpty(textEdit.range) && !textEdit.text) {
                // no-op edit (replace empty range with empty text)
                return;
            }
            // create edit operation
            let range;
            if (!textEdit.range) {
                range = this.model.getFullModelRange();
            }
            else {
                range = range_1.Range.lift(textEdit.range);
            }
            this._edits.push({ ...editOperation_1.EditOperation.replaceMove(range, textEdit.text), insertAsSnippet: textEdit.insertAsSnippet });
        }
        validate() {
            if (typeof this._expectedModelVersionId === 'undefined' || this.model.getVersionId() === this._expectedModelVersionId) {
                return { canApply: true };
            }
            return { canApply: false, reason: this.model.uri };
        }
        getBeforeCursorState() {
            return null;
        }
        apply() {
            if (this._edits.length > 0) {
                this._edits = this._edits
                    .map(this._transformSnippetStringToInsertText, this) // no editor -> no snippet mode
                    .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                this.model.pushEditOperations(null, this._edits, () => null);
            }
            if (this._newEol !== undefined) {
                this.model.pushEOL(this._newEol);
            }
        }
        _transformSnippetStringToInsertText(edit) {
            // transform a snippet edit (and only those) into a normal text edit
            // for that we need to parse the snippet and get its actual text, e.g without placeholder
            // or variable syntaxes
            if (!edit.insertAsSnippet) {
                return edit;
            }
            if (!edit.text) {
                return edit;
            }
            const text = snippetParser_1.SnippetParser.asInsertText(edit.text);
            return { ...edit, insertAsSnippet: false, text };
        }
    }
    class EditorEditTask extends ModelEditTask {
        constructor(modelReference, editor) {
            super(modelReference);
            this._editor = editor;
        }
        getBeforeCursorState() {
            return this._canUseEditor() ? this._editor.getSelections() : null;
        }
        apply() {
            // Check that the editor is still for the wanted model. It might have changed in the
            // meantime and that means we cannot use the editor anymore (instead we perform the edit through the model)
            if (!this._canUseEditor()) {
                super.apply();
                return;
            }
            if (this._edits.length > 0) {
                const snippetCtrl = snippetController2_1.SnippetController2.get(this._editor);
                if (snippetCtrl && this._edits.some(edit => edit.insertAsSnippet)) {
                    // some edit is a snippet edit -> use snippet controller and ISnippetEdits
                    const snippetEdits = [];
                    for (const edit of this._edits) {
                        if (edit.range && edit.text !== null) {
                            snippetEdits.push({
                                range: range_1.Range.lift(edit.range),
                                template: edit.insertAsSnippet ? edit.text : snippetParser_1.SnippetParser.escape(edit.text)
                            });
                        }
                    }
                    snippetCtrl.apply(snippetEdits, { undoStopBefore: false, undoStopAfter: false });
                }
                else {
                    // normal edit
                    this._edits = this._edits
                        .map(this._transformSnippetStringToInsertText, this) // mixed edits (snippet and normal) -> no snippet mode
                        .sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                    this._editor.executeEdits('', this._edits);
                }
            }
            if (this._newEol !== undefined) {
                if (this._editor.hasModel()) {
                    this._editor.getModel().pushEOL(this._newEol);
                }
            }
        }
        _canUseEditor() {
            return this._editor?.getModel()?.uri.toString() === this.model.uri.toString();
        }
    }
    let BulkTextEdits = class BulkTextEdits {
        constructor(_label, _code, _editor, _undoRedoGroup, _undoRedoSource, _progress, _token, edits, _editorWorker, _modelService, _textModelResolverService, _undoRedoService) {
            this._label = _label;
            this._code = _code;
            this._editor = _editor;
            this._undoRedoGroup = _undoRedoGroup;
            this._undoRedoSource = _undoRedoSource;
            this._progress = _progress;
            this._token = _token;
            this._editorWorker = _editorWorker;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._undoRedoService = _undoRedoService;
            this._edits = new map_1.ResourceMap();
            for (const edit of edits) {
                let array = this._edits.get(edit.resource);
                if (!array) {
                    array = [];
                    this._edits.set(edit.resource, array);
                }
                array.push(edit);
            }
        }
        _validateBeforePrepare() {
            // First check if loaded models were not changed in the meantime
            for (const array of this._edits.values()) {
                for (const edit of array) {
                    if (typeof edit.versionId === 'number') {
                        const model = this._modelService.getModel(edit.resource);
                        if (model && model.getVersionId() !== edit.versionId) {
                            // model changed in the meantime
                            throw new Error(`${model.uri.toString()} has changed in the meantime`);
                        }
                    }
                }
            }
        }
        async _createEditsTasks() {
            const tasks = [];
            const promises = [];
            for (const [key, edits] of this._edits) {
                const promise = this._textModelResolverService.createModelReference(key).then(async (ref) => {
                    let task;
                    let makeMinimal = false;
                    if (this._editor?.getModel()?.uri.toString() === ref.object.textEditorModel.uri.toString()) {
                        task = new EditorEditTask(ref, this._editor);
                        makeMinimal = true;
                    }
                    else {
                        task = new ModelEditTask(ref);
                    }
                    tasks.push(task);
                    if (!makeMinimal) {
                        edits.forEach(task.addEdit, task);
                        return;
                    }
                    // group edits by type (snippet, metadata, or simple) and make simple groups more minimal
                    const makeGroupMoreMinimal = async (start, end) => {
                        const oldEdits = edits.slice(start, end);
                        const newEdits = await this._editorWorker.computeMoreMinimalEdits(ref.object.textEditorModel.uri, oldEdits.map(e => e.textEdit), false);
                        if (!newEdits) {
                            oldEdits.forEach(task.addEdit, task);
                        }
                        else {
                            newEdits.forEach(edit => task.addEdit(new bulkEditService_1.ResourceTextEdit(ref.object.textEditorModel.uri, edit, undefined, undefined)));
                        }
                    };
                    let start = 0;
                    let i = 0;
                    for (; i < edits.length; i++) {
                        if (edits[i].textEdit.insertAsSnippet || edits[i].metadata) {
                            await makeGroupMoreMinimal(start, i); // grouped edits until now
                            task.addEdit(edits[i]); // this edit
                            start = i + 1;
                        }
                    }
                    await makeGroupMoreMinimal(start, i);
                });
                promises.push(promise);
            }
            await Promise.all(promises);
            return tasks;
        }
        _validateTasks(tasks) {
            for (const task of tasks) {
                const result = task.validate();
                if (!result.canApply) {
                    return result;
                }
            }
            return { canApply: true };
        }
        async apply() {
            this._validateBeforePrepare();
            const tasks = await this._createEditsTasks();
            try {
                if (this._token.isCancellationRequested) {
                    return [];
                }
                const resources = [];
                const validation = this._validateTasks(tasks);
                if (!validation.canApply) {
                    throw new Error(`${validation.reason.toString()} has changed in the meantime`);
                }
                if (tasks.length === 1) {
                    // This edit touches a single model => keep things simple
                    const task = tasks[0];
                    if (!task.isNoOp()) {
                        const singleModelEditStackElement = new editStack_1.SingleModelEditStackElement(this._label, this._code, task.model, task.getBeforeCursorState());
                        this._undoRedoService.pushElement(singleModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                        task.apply();
                        singleModelEditStackElement.close();
                        resources.push(task.model.uri);
                    }
                    this._progress.report(undefined);
                }
                else {
                    // prepare multi model undo element
                    const multiModelEditStackElement = new editStack_1.MultiModelEditStackElement(this._label, this._code, tasks.map(t => new editStack_1.SingleModelEditStackElement(this._label, this._code, t.model, t.getBeforeCursorState())));
                    this._undoRedoService.pushElement(multiModelEditStackElement, this._undoRedoGroup, this._undoRedoSource);
                    for (const task of tasks) {
                        task.apply();
                        this._progress.report(undefined);
                        resources.push(task.model.uri);
                    }
                    multiModelEditStackElement.close();
                }
                return resources;
            }
            finally {
                (0, lifecycle_1.dispose)(tasks);
            }
        }
    };
    exports.BulkTextEdits = BulkTextEdits;
    exports.BulkTextEdits = BulkTextEdits = __decorate([
        __param(8, editorWorker_1.IEditorWorkerService),
        __param(9, model_1.IModelService),
        __param(10, resolverService_1.ITextModelService),
        __param(11, undoRedo_1.IUndoRedoService)
    ], BulkTextEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa1RleHRFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9idWxrVGV4dEVkaXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCaEcsTUFBTSxhQUFhO1FBUWxCLFlBQTZCLGVBQXFEO1lBQXJELG9CQUFlLEdBQWYsZUFBZSxDQUFzQztZQUNqRixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUN6RCxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELE1BQU07WUFDTCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1Qix5QkFBeUI7Z0JBQ3pCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQztnQkFDdEYsK0NBQStDO2dCQUMvQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLENBQUMsWUFBOEI7WUFDckMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUM7WUFDdEQsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLFlBQVksQ0FBQztZQUVsQyxJQUFJLE9BQU8sUUFBUSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEMsbUJBQW1CO2dCQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDN0IsQ0FBQztZQUNELElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QyxrQ0FBa0M7Z0JBQ2xDLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxhQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckQsbURBQW1EO2dCQUNuRCxPQUFPO1lBQ1IsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixJQUFJLEtBQVksQ0FBQztZQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3hDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyw2QkFBYSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsRUFBRSxRQUFRLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUNySCxDQUFDO1FBRUQsUUFBUTtZQUNQLElBQUksT0FBTyxJQUFJLENBQUMsdUJBQXVCLEtBQUssV0FBVyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ3ZILE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUNELE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3BELENBQUM7UUFFRCxvQkFBb0I7WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQsS0FBSztZQUNKLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU07cUJBQ3ZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUNBQW1DLEVBQUUsSUFBSSxDQUFDLENBQUMsK0JBQStCO3FCQUNuRixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDbkUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFUyxtQ0FBbUMsQ0FBQyxJQUFpQztZQUM5RSxvRUFBb0U7WUFDcEUseUZBQXlGO1lBQ3pGLHVCQUF1QjtZQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMzQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLElBQUksR0FBRyw2QkFBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsT0FBTyxFQUFFLEdBQUcsSUFBSSxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDbEQsQ0FBQztLQUNEO0lBRUQsTUFBTSxjQUFlLFNBQVEsYUFBYTtRQUl6QyxZQUFZLGNBQW9ELEVBQUUsTUFBbUI7WUFDcEYsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFUSxvQkFBb0I7WUFDNUIsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNuRSxDQUFDO1FBRVEsS0FBSztZQUViLG9GQUFvRjtZQUNwRiwyR0FBMkc7WUFDM0csSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDO2dCQUMzQixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLFdBQVcsR0FBRyx1Q0FBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLFdBQVcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO29CQUNuRSwwRUFBMEU7b0JBQzFFLE1BQU0sWUFBWSxHQUFtQixFQUFFLENBQUM7b0JBQ3hDLEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNoQyxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUUsQ0FBQzs0QkFDdEMsWUFBWSxDQUFDLElBQUksQ0FBQztnQ0FDakIsS0FBSyxFQUFFLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztnQ0FDN0IsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7NkJBQzVFLENBQUMsQ0FBQzt3QkFDSixDQUFDO29CQUNGLENBQUM7b0JBQ0QsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVsRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsY0FBYztvQkFDZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNO3lCQUN2QixHQUFHLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLElBQUksQ0FBQyxDQUFDLHNEQUFzRDt5QkFDMUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ25FLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0UsQ0FBQztLQUNEO0lBRU0sSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYTtRQUl6QixZQUNrQixNQUFjLEVBQ2QsS0FBYSxFQUNiLE9BQWdDLEVBQ2hDLGNBQTZCLEVBQzdCLGVBQTJDLEVBQzNDLFNBQTBCLEVBQzFCLE1BQXlCLEVBQzFDLEtBQXlCLEVBQ0gsYUFBb0QsRUFDM0QsYUFBNkMsRUFDekMseUJBQTZELEVBQzlELGdCQUFtRDtZQVhwRCxXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUNiLFlBQU8sR0FBUCxPQUFPLENBQXlCO1lBQ2hDLG1CQUFjLEdBQWQsY0FBYyxDQUFlO1lBQzdCLG9CQUFlLEdBQWYsZUFBZSxDQUE0QjtZQUMzQyxjQUFTLEdBQVQsU0FBUyxDQUFpQjtZQUMxQixXQUFNLEdBQU4sTUFBTSxDQUFtQjtZQUVILGtCQUFhLEdBQWIsYUFBYSxDQUFzQjtZQUMxQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN4Qiw4QkFBeUIsR0FBekIseUJBQXlCLENBQW1CO1lBQzdDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFkckQsV0FBTSxHQUFHLElBQUksaUJBQVcsRUFBc0IsQ0FBQztZQWlCL0QsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEIsQ0FBQztRQUNGLENBQUM7UUFFTyxzQkFBc0I7WUFDN0IsZ0VBQWdFO1lBQ2hFLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO29CQUMxQixJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQzt3QkFDeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUN6RCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDOzRCQUN0RCxnQ0FBZ0M7NEJBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO3dCQUN4RSxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQjtZQUU5QixNQUFNLEtBQUssR0FBb0IsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sUUFBUSxHQUFtQixFQUFFLENBQUM7WUFFcEMsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUMsR0FBRyxFQUFDLEVBQUU7b0JBQ3pGLElBQUksSUFBbUIsQ0FBQztvQkFDeEIsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDO29CQUN4QixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO3dCQUM1RixJQUFJLEdBQUcsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDN0MsV0FBVyxHQUFHLElBQUksQ0FBQztvQkFDcEIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksR0FBRyxJQUFJLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDL0IsQ0FBQztvQkFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUdqQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ2xCLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQzt3QkFDbEMsT0FBTztvQkFDUixDQUFDO29CQUVELHlGQUF5RjtvQkFFekYsTUFBTSxvQkFBb0IsR0FBRyxLQUFLLEVBQUUsS0FBYSxFQUFFLEdBQVcsRUFBRSxFQUFFO3dCQUNqRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQzt3QkFDekMsTUFBTSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUN4SSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7NEJBQ2YsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUN0QyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxrQ0FBZ0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzFILENBQUM7b0JBQ0YsQ0FBQyxDQUFDO29CQUVGLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztvQkFDZCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ1YsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dCQUM5QixJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs0QkFDNUQsTUFBTSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQywwQkFBMEI7NEJBQ2hFLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZOzRCQUNwQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDZixDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXRDLENBQUMsQ0FBQyxDQUFDO2dCQUNILFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxjQUFjLENBQUMsS0FBc0I7WUFDNUMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN0QixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLO1lBRVYsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7WUFDOUIsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUU3QyxJQUFJLENBQUM7Z0JBQ0osSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLENBQUM7b0JBQ3pDLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7Z0JBRUQsTUFBTSxTQUFTLEdBQVUsRUFBRSxDQUFDO2dCQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztnQkFDaEYsQ0FBQztnQkFDRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLHlEQUF5RDtvQkFDekQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSx1Q0FBMkIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO3dCQUN0SSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO3dCQUMxRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ2IsMkJBQTJCLENBQUMsS0FBSyxFQUFFLENBQUM7d0JBQ3BDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztvQkFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLG1DQUFtQztvQkFDbkMsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLHNDQUEwQixDQUNoRSxJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxLQUFLLEVBQ1YsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksdUNBQTJCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxDQUMzRyxDQUFDO29CQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3pHLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7d0JBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDYixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDakMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO29CQUNELDBCQUEwQixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNwQyxDQUFDO2dCQUVELE9BQU8sU0FBUyxDQUFDO1lBRWxCLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFBLG1CQUFPLEVBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBNUpZLHNDQUFhOzRCQUFiLGFBQWE7UUFhdkIsV0FBQSxtQ0FBb0IsQ0FBQTtRQUNwQixXQUFBLHFCQUFhLENBQUE7UUFDYixZQUFBLG1DQUFpQixDQUFBO1FBQ2pCLFlBQUEsMkJBQWdCLENBQUE7T0FoQk4sYUFBYSxDQTRKekIifQ==