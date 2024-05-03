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
define(["require", "exports", "vs/editor/common/services/resolverService", "vs/base/common/uri", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/model/textModel", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/common/core/range", "vs/editor/common/core/editOperation", "vs/platform/instantiation/common/instantiation", "vs/platform/files/common/files", "vs/base/common/event", "vs/workbench/contrib/bulkEdit/browser/conflicts", "vs/base/common/map", "vs/nls", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/base/common/codicons", "vs/base/common/uuid", "vs/editor/contrib/snippet/browser/snippetParser", "vs/base/common/symbols"], function (require, exports, resolverService_1, uri_1, language_1, model_1, textModel_1, lifecycle_1, arrays_1, range_1, editOperation_1, instantiation_1, files_1, event_1, conflicts_1, map_1, nls_1, resources_1, bulkEditService_1, codicons_1, uuid_1, snippetParser_1, symbols_1) {
    "use strict";
    var BulkFileOperations_1, BulkEditPreviewProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkEditPreviewProvider = exports.BulkFileOperations = exports.BulkCategory = exports.BulkFileOperation = exports.BulkFileOperationType = exports.BulkTextEdit = exports.CheckedStates = void 0;
    class CheckedStates {
        constructor() {
            this._states = new WeakMap();
            this._checkedCount = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._onDidChange.dispose();
        }
        get checkedCount() {
            return this._checkedCount;
        }
        isChecked(obj) {
            return this._states.get(obj) ?? false;
        }
        updateChecked(obj, value) {
            const valueNow = this._states.get(obj);
            if (valueNow === value) {
                return;
            }
            if (valueNow === undefined) {
                if (value) {
                    this._checkedCount += 1;
                }
            }
            else {
                if (value) {
                    this._checkedCount += 1;
                }
                else {
                    this._checkedCount -= 1;
                }
            }
            this._states.set(obj, value);
            this._onDidChange.fire(obj);
        }
    }
    exports.CheckedStates = CheckedStates;
    class BulkTextEdit {
        constructor(parent, textEdit) {
            this.parent = parent;
            this.textEdit = textEdit;
        }
    }
    exports.BulkTextEdit = BulkTextEdit;
    var BulkFileOperationType;
    (function (BulkFileOperationType) {
        BulkFileOperationType[BulkFileOperationType["TextEdit"] = 1] = "TextEdit";
        BulkFileOperationType[BulkFileOperationType["Create"] = 2] = "Create";
        BulkFileOperationType[BulkFileOperationType["Delete"] = 4] = "Delete";
        BulkFileOperationType[BulkFileOperationType["Rename"] = 8] = "Rename";
    })(BulkFileOperationType || (exports.BulkFileOperationType = BulkFileOperationType = {}));
    class BulkFileOperation {
        constructor(uri, parent) {
            this.uri = uri;
            this.parent = parent;
            this.type = 0;
            this.textEdits = [];
            this.originalEdits = new Map();
        }
        addEdit(index, type, edit) {
            this.type |= type;
            this.originalEdits.set(index, edit);
            if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                this.textEdits.push(new BulkTextEdit(this, edit));
            }
            else if (type === 8 /* BulkFileOperationType.Rename */) {
                this.newUri = edit.newResource;
            }
        }
        needsConfirmation() {
            for (const [, edit] of this.originalEdits) {
                if (!this.parent.checked.isChecked(edit)) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.BulkFileOperation = BulkFileOperation;
    class BulkCategory {
        static { this._defaultMetadata = Object.freeze({
            label: (0, nls_1.localize)('default', "Other"),
            icon: codicons_1.Codicon.symbolFile,
            needsConfirmation: false
        }); }
        static keyOf(metadata) {
            return metadata?.label || '<default>';
        }
        constructor(metadata = BulkCategory._defaultMetadata) {
            this.metadata = metadata;
            this.operationByResource = new Map();
        }
        get fileOperations() {
            return this.operationByResource.values();
        }
    }
    exports.BulkCategory = BulkCategory;
    let BulkFileOperations = BulkFileOperations_1 = class BulkFileOperations {
        static async create(accessor, bulkEdit) {
            const result = accessor.get(instantiation_1.IInstantiationService).createInstance(BulkFileOperations_1, bulkEdit);
            return await result._init();
        }
        constructor(_bulkEdit, _fileService, instaService) {
            this._bulkEdit = _bulkEdit;
            this._fileService = _fileService;
            this.checked = new CheckedStates();
            this.fileOperations = [];
            this.categories = [];
            this.conflicts = instaService.createInstance(conflicts_1.ConflictDetector, _bulkEdit);
        }
        dispose() {
            this.checked.dispose();
            this.conflicts.dispose();
        }
        async _init() {
            const operationByResource = new Map();
            const operationByCategory = new Map();
            const newToOldUri = new map_1.ResourceMap();
            for (let idx = 0; idx < this._bulkEdit.length; idx++) {
                const edit = this._bulkEdit[idx];
                let uri;
                let type;
                // store inital checked state
                this.checked.updateChecked(edit, !edit.metadata?.needsConfirmation);
                if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                    type = 1 /* BulkFileOperationType.TextEdit */;
                    uri = edit.resource;
                }
                else if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                    if (edit.newResource && edit.oldResource) {
                        type = 8 /* BulkFileOperationType.Rename */;
                        uri = edit.oldResource;
                        if (edit.options?.overwrite === undefined && edit.options?.ignoreIfExists && await this._fileService.exists(uri)) {
                            // noop -> "soft" rename to something that already exists
                            continue;
                        }
                        // map newResource onto oldResource so that text-edit appear for
                        // the same file element
                        newToOldUri.set(edit.newResource, uri);
                    }
                    else if (edit.oldResource) {
                        type = 4 /* BulkFileOperationType.Delete */;
                        uri = edit.oldResource;
                        if (edit.options?.ignoreIfNotExists && !await this._fileService.exists(uri)) {
                            // noop -> "soft" delete something that doesn't exist
                            continue;
                        }
                    }
                    else if (edit.newResource) {
                        type = 2 /* BulkFileOperationType.Create */;
                        uri = edit.newResource;
                        if (edit.options?.overwrite === undefined && edit.options?.ignoreIfExists && await this._fileService.exists(uri)) {
                            // noop -> "soft" create something that already exists
                            continue;
                        }
                    }
                    else {
                        // invalid edit -> skip
                        continue;
                    }
                }
                else {
                    // unsupported edit
                    continue;
                }
                const insert = (uri, map) => {
                    let key = resources_1.extUri.getComparisonKey(uri, true);
                    let operation = map.get(key);
                    // rename
                    if (!operation && newToOldUri.has(uri)) {
                        uri = newToOldUri.get(uri);
                        key = resources_1.extUri.getComparisonKey(uri, true);
                        operation = map.get(key);
                    }
                    if (!operation) {
                        operation = new BulkFileOperation(uri, this);
                        map.set(key, operation);
                    }
                    operation.addEdit(idx, type, edit);
                };
                insert(uri, operationByResource);
                // insert into "this" category
                const key = BulkCategory.keyOf(edit.metadata);
                let category = operationByCategory.get(key);
                if (!category) {
                    category = new BulkCategory(edit.metadata);
                    operationByCategory.set(key, category);
                }
                insert(uri, category.operationByResource);
            }
            operationByResource.forEach(value => this.fileOperations.push(value));
            operationByCategory.forEach(value => this.categories.push(value));
            // "correct" invalid parent-check child states that is
            // unchecked file edits (rename, create, delete) uncheck
            // all edits for a file, e.g no text change without rename
            for (const file of this.fileOperations) {
                if (file.type !== 1 /* BulkFileOperationType.TextEdit */) {
                    let checked = true;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceFileEdit) {
                            checked = checked && this.checked.isChecked(edit);
                        }
                    }
                    if (!checked) {
                        for (const edit of file.originalEdits.values()) {
                            this.checked.updateChecked(edit, checked);
                        }
                    }
                }
            }
            // sort (once) categories atop which have unconfirmed edits
            this.categories.sort((a, b) => {
                if (a.metadata.needsConfirmation === b.metadata.needsConfirmation) {
                    return a.metadata.label.localeCompare(b.metadata.label);
                }
                else if (a.metadata.needsConfirmation) {
                    return -1;
                }
                else {
                    return 1;
                }
            });
            return this;
        }
        getWorkspaceEdit() {
            const result = [];
            let allAccepted = true;
            for (let i = 0; i < this._bulkEdit.length; i++) {
                const edit = this._bulkEdit[i];
                if (this.checked.isChecked(edit)) {
                    result[i] = edit;
                    continue;
                }
                allAccepted = false;
            }
            if (allAccepted) {
                return this._bulkEdit;
            }
            // not all edits have been accepted
            (0, arrays_1.coalesceInPlace)(result);
            return result;
        }
        getFileEdits(uri) {
            for (const file of this.fileOperations) {
                if (file.uri.toString() === uri.toString()) {
                    const result = [];
                    let ignoreAll = false;
                    for (const edit of file.originalEdits.values()) {
                        if (edit instanceof bulkEditService_1.ResourceTextEdit) {
                            if (this.checked.isChecked(edit)) {
                                result.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), !edit.textEdit.insertAsSnippet ? edit.textEdit.text : snippetParser_1.SnippetParser.asInsertText(edit.textEdit.text)));
                            }
                        }
                        else if (!this.checked.isChecked(edit)) {
                            // UNCHECKED WorkspaceFileEdit disables all text edits
                            ignoreAll = true;
                        }
                    }
                    if (ignoreAll) {
                        return [];
                    }
                    return result.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
                }
            }
            return [];
        }
        getUriOfEdit(edit) {
            for (const file of this.fileOperations) {
                for (const value of file.originalEdits.values()) {
                    if (value === edit) {
                        return file.uri;
                    }
                }
            }
            throw new Error('invalid edit');
        }
    };
    exports.BulkFileOperations = BulkFileOperations;
    exports.BulkFileOperations = BulkFileOperations = BulkFileOperations_1 = __decorate([
        __param(1, files_1.IFileService),
        __param(2, instantiation_1.IInstantiationService)
    ], BulkFileOperations);
    let BulkEditPreviewProvider = class BulkEditPreviewProvider {
        static { BulkEditPreviewProvider_1 = this; }
        static { this.Schema = 'vscode-bulkeditpreview-editor'; }
        static { this.emptyPreview = uri_1.URI.from({ scheme: BulkEditPreviewProvider_1.Schema, fragment: 'empty' }); }
        static fromPreviewUri(uri) {
            return uri_1.URI.parse(uri.query);
        }
        constructor(_operations, _languageService, _modelService, _textModelResolverService) {
            this._operations = _operations;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._textModelResolverService = _textModelResolverService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._modelPreviewEdits = new Map();
            this._instanceId = (0, uuid_1.generateUuid)();
            this._disposables.add(this._textModelResolverService.registerTextModelContentProvider(BulkEditPreviewProvider_1.Schema, this));
            this._ready = this._init();
        }
        dispose() {
            this._disposables.dispose();
        }
        asPreviewUri(uri) {
            return uri_1.URI.from({ scheme: BulkEditPreviewProvider_1.Schema, authority: this._instanceId, path: uri.path, query: uri.toString() });
        }
        async _init() {
            for (const operation of this._operations.fileOperations) {
                await this._applyTextEditsToPreviewModel(operation.uri);
            }
            this._disposables.add(event_1.Event.debounce(this._operations.checked.onDidChange, (_last, e) => e, symbols_1.MicrotaskDelay)(e => {
                const uri = this._operations.getUriOfEdit(e);
                this._applyTextEditsToPreviewModel(uri);
            }));
        }
        async _applyTextEditsToPreviewModel(uri) {
            const model = await this._getOrCreatePreviewModel(uri);
            // undo edits that have been done before
            const undoEdits = this._modelPreviewEdits.get(model.id);
            if (undoEdits) {
                model.applyEdits(undoEdits);
            }
            // apply new edits and keep (future) undo edits
            const newEdits = this._operations.getFileEdits(uri);
            const newUndoEdits = model.applyEdits(newEdits, true);
            this._modelPreviewEdits.set(model.id, newUndoEdits);
        }
        async _getOrCreatePreviewModel(uri) {
            const previewUri = this.asPreviewUri(uri);
            let model = this._modelService.getModel(previewUri);
            if (!model) {
                try {
                    // try: copy existing
                    const ref = await this._textModelResolverService.createModelReference(uri);
                    const sourceModel = ref.object.textEditorModel;
                    model = this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(sourceModel.createSnapshot()), this._languageService.createById(sourceModel.getLanguageId()), previewUri);
                    ref.dispose();
                }
                catch {
                    // create NEW model
                    model = this._modelService.createModel('', this._languageService.createByFilepathOrFirstLine(previewUri), previewUri);
                }
                // this is a little weird but otherwise editors and other cusomers
                // will dispose my models before they should be disposed...
                // And all of this is off the eventloop to prevent endless recursion
                queueMicrotask(async () => {
                    this._disposables.add(await this._textModelResolverService.createModelReference(model.uri));
                });
            }
            return model;
        }
        async provideTextContent(previewUri) {
            if (previewUri.toString() === BulkEditPreviewProvider_1.emptyPreview.toString()) {
                return this._modelService.createModel('', null, previewUri);
            }
            await this._ready;
            return this._modelService.getModel(previewUri);
        }
    };
    exports.BulkEditPreviewProvider = BulkEditPreviewProvider;
    exports.BulkEditPreviewProvider = BulkEditPreviewProvider = BulkEditPreviewProvider_1 = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService)
    ], BulkEditPreviewProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRQcmV2aWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC9icm93c2VyL3ByZXZpZXcvYnVsa0VkaXRQcmV2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQWEsYUFBYTtRQUExQjtZQUVrQixZQUFPLEdBQUcsSUFBSSxPQUFPLEVBQWMsQ0FBQztZQUM3QyxrQkFBYSxHQUFXLENBQUMsQ0FBQztZQUVqQixpQkFBWSxHQUFHLElBQUksZUFBTyxFQUFLLENBQUM7WUFDeEMsZ0JBQVcsR0FBYSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztRQWlDMUQsQ0FBQztRQS9CQSxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM3QixDQUFDO1FBRUQsSUFBSSxZQUFZO1lBQ2YsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQzNCLENBQUM7UUFFRCxTQUFTLENBQUMsR0FBTTtZQUNmLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxhQUFhLENBQUMsR0FBTSxFQUFFLEtBQWM7WUFDbkMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkMsSUFBSSxRQUFRLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUM7Z0JBQ3pCLENB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