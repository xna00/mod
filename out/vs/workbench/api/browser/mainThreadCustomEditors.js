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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/customEditor/common/customTextEditorModel", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/resourceWorkingCopy", "vs/workbench/services/workingCopy/common/workingCopy", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService"], function (require, exports, dom_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, network_1, path_1, resources_1, uri_1, uuid_1, nls_1, dialogs_1, files_1, instantiation_1, label_1, storage_1, undoRedo_1, mainThreadWebviews_1, extHostProtocol, customEditorInput_1, customEditor_1, customTextEditorModel_1, webview_1, webviewWorkbenchService_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, environmentService_1, extensions_1, pathService_1, resourceWorkingCopy_1, workingCopy_1, workingCopyFileService_1, workingCopyService_1) {
    "use strict";
    var MainThreadCustomEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadCustomEditors = void 0;
    var CustomEditorModelType;
    (function (CustomEditorModelType) {
        CustomEditorModelType[CustomEditorModelType["Custom"] = 0] = "Custom";
        CustomEditorModelType[CustomEditorModelType["Text"] = 1] = "Text";
    })(CustomEditorModelType || (CustomEditorModelType = {}));
    let MainThreadCustomEditors = class MainThreadCustomEditors extends lifecycle_1.Disposable {
        constructor(context, mainThreadWebview, mainThreadWebviewPanels, extensionService, storageService, workingCopyService, workingCopyFileService, _customEditorService, _editorGroupService, _editorService, _instantiationService, _webviewWorkbenchService) {
            super();
            this.mainThreadWebview = mainThreadWebview;
            this.mainThreadWebviewPanels = mainThreadWebviewPanels;
            this._customEditorService = _customEditorService;
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._editorProviders = this._register(new lifecycle_1.DisposableMap());
            this._editorRenameBackups = new Map();
            this._webviewOriginStore = new webview_1.ExtensionKeyedWebviewOriginStore('mainThreadCustomEditors.origins', storageService);
            this._proxyCustomEditors = context.getProxy(extHostProtocol.ExtHostContext.ExtHostCustomEditors);
            this._register(workingCopyFileService.registerWorkingCopyProvider((editorResource) => {
                const matchedWorkingCopies = [];
                for (const workingCopy of workingCopyService.workingCopies) {
                    if (workingCopy instanceof MainThreadCustomEditorModel) {
                        if ((0, resources_1.isEqualOrParent)(editorResource, workingCopy.editorResource)) {
                            matchedWorkingCopies.push(workingCopy);
                        }
                    }
                }
                return matchedWorkingCopies;
            }));
            // This reviver's only job is to activate custom editor extensions.
            this._register(_webviewWorkbenchService.registerResolver({
                canResolve: (webview) => {
                    if (webview instanceof customEditorInput_1.CustomEditorInput) {
                        extensionService.activateByEvent(`onCustomEditor:${webview.viewType}`);
                    }
                    return false;
                },
                resolveWebview: () => { throw new Error('not implemented'); }
            }));
            // Working copy operations
            this._register(workingCopyFileService.onWillRunWorkingCopyFileOperation(async (e) => this.onWillRunWorkingCopyFileOperation(e)));
        }
        $registerTextEditorProvider(extensionData, viewType, options, capabilities, serializeBuffersForPostMessage) {
            this.registerEditorProvider(1 /* CustomEditorModelType.Text */, (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData), viewType, options, capabilities, true, serializeBuffersForPostMessage);
        }
        $registerCustomEditorProvider(extensionData, viewType, options, supportsMultipleEditorsPerDocument, serializeBuffersForPostMessage) {
            this.registerEditorProvider(0 /* CustomEditorModelType.Custom */, (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData), viewType, options, {}, supportsMultipleEditorsPerDocument, serializeBuffersForPostMessage);
        }
        registerEditorProvider(modelType, extension, viewType, options, capabilities, supportsMultipleEditorsPerDocument, serializeBuffersForPostMessage) {
            if (this._editorProviders.has(viewType)) {
                throw new Error(`Provider for ${viewType} already registered`);
            }
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(this._customEditorService.registerCustomEditorCapabilities(viewType, {
                supportsMultipleEditorsPerDocument
            }));
            disposables.add(this._webviewWorkbenchService.registerResolver({
                canResolve: (webviewInput) => {
                    return webviewInput instanceof customEditorInput_1.CustomEditorInput && webviewInput.viewType === viewType;
                },
                resolveWebview: async (webviewInput, cancellation) => {
                    const handle = (0, uuid_1.generateUuid)();
                    const resource = webviewInput.resource;
                    webviewInput.webview.origin = this._webviewOriginStore.getOrigin(viewType, extension.id);
                    this.mainThreadWebviewPanels.addWebviewInput(handle, webviewInput, { serializeBuffersForPostMessage });
                    webviewInput.webview.options = options;
                    webviewInput.webview.extension = extension;
                    // If there's an old resource this was a move and we must resolve the backup at the same time as the webview
                    // This is because the backup must be ready upon model creation, and the input resolve method comes after
                    let backupId = webviewInput.backupId;
                    if (webviewInput.oldResource && !webviewInput.backupId) {
                        const backup = this._editorRenameBackups.get(webviewInput.oldResource.toString());
                        backupId = backup?.backupId;
                        this._editorRenameBackups.delete(webviewInput.oldResource.toString());
                    }
                    let modelRef;
                    try {
                        modelRef = await this.getOrCreateCustomEditorModel(modelType, resource, viewType, { backupId }, cancellation);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewInput.webview.setHtml(this.mainThreadWebview.getWebviewResolvedFailedContent(viewType));
                        return;
                    }
                    if (cancellation.isCancellationRequested) {
                        modelRef.dispose();
                        return;
                    }
                    webviewInput.webview.onDidDispose(() => {
                        // If the model is still dirty, make sure we have time to save it
                        if (modelRef.object.isDirty()) {
                            const sub = modelRef.object.onDidChangeDirty(() => {
                                if (!modelRef.object.isDirty()) {
                                    sub.dispose();
                                    modelRef.dispose();
                                }
                            });
                            return;
                        }
                        modelRef.dispose();
                    });
                    if (capabilities.supportsMove) {
                        webviewInput.onMove(async (newResource) => {
                            const oldModel = modelRef;
                            modelRef = await this.getOrCreateCustomEditorModel(modelType, newResource, viewType, {}, cancellation_1.CancellationToken.None);
                            this._proxyCustomEditors.$onMoveCustomEditor(handle, newResource, viewType);
                            oldModel.dispose();
                        });
                    }
                    try {
                        await this._proxyCustomEditors.$resolveCustomEditor(resource, handle, viewType, {
                            title: webviewInput.getTitle(),
                            contentOptions: webviewInput.webview.contentOptions,
                            options: webviewInput.webview.options,
                            active: webviewInput === this._editorService.activeEditor,
                        }, (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, webviewInput.group || 0), cancellation);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewInput.webview.setHtml(this.mainThreadWebview.getWebviewResolvedFailedContent(viewType));
                        modelRef.dispose();
                        return;
                    }
                }
            }));
            this._editorProviders.set(viewType, disposables);
        }
        $unregisterEditorProvider(viewType) {
            if (!this._editorProviders.has(viewType)) {
                throw new Error(`No provider for ${viewType} registered`);
            }
            this._editorProviders.deleteAndDispose(viewType);
            this._customEditorService.models.disposeAllModelsForView(viewType);
        }
        async getOrCreateCustomEditorModel(modelType, resource, viewType, options, cancellation) {
            const existingModel = this._customEditorService.models.tryRetain(resource, viewType);
            if (existingModel) {
                return existingModel;
            }
            switch (modelType) {
                case 1 /* CustomEditorModelType.Text */:
                    {
                        const model = customTextEditorModel_1.CustomTextEditorModel.create(this._instantiationService, viewType, resource);
                        return this._customEditorService.models.add(resource, viewType, model);
                    }
                case 0 /* CustomEditorModelType.Custom */:
                    {
                        const model = MainThreadCustomEditorModel.create(this._instantiationService, this._proxyCustomEditors, viewType, resource, options, () => {
                            return Array.from(this.mainThreadWebviewPanels.webviewInputs)
                                .filter(editor => editor instanceof customEditorInput_1.CustomEditorInput && (0, resources_1.isEqual)(editor.resource, resource));
                        }, cancellation);
                        return this._customEditorService.models.add(resource, viewType, model);
                    }
            }
        }
        async $onDidEdit(resourceComponents, viewType, editId, label) {
            const model = await this.getCustomEditorModel(resourceComponents, viewType);
            model.pushEdit(editId, label);
        }
        async $onContentChange(resourceComponents, viewType) {
            const model = await this.getCustomEditorModel(resourceComponents, viewType);
            model.changeContent();
        }
        async getCustomEditorModel(resourceComponents, viewType) {
            const resource = uri_1.URI.revive(resourceComponents);
            const model = await this._customEditorService.models.get(resource, viewType);
            if (!model || !(model instanceof MainThreadCustomEditorModel)) {
                throw new Error('Could not find model for webview editor');
            }
            return model;
        }
        //#region Working Copy
        async onWillRunWorkingCopyFileOperation(e) {
            if (e.operation !== 2 /* FileOperation.MOVE */) {
                return;
            }
            e.waitUntil((async () => {
                const models = [];
                for (const file of e.files) {
                    if (file.source) {
                        models.push(...(await this._customEditorService.models.getAllModels(file.source)));
                    }
                }
                for (const model of models) {
                    if (model instanceof MainThreadCustomEditorModel && model.isDirty()) {
                        const workingCopy = await model.backup(cancellation_1.CancellationToken.None);
                        if (workingCopy.meta) {
                            // This cast is safe because we do an instanceof check above and a custom document backup data is always returned
                            this._editorRenameBackups.set(model.editorResource.toString(), workingCopy.meta);
                        }
                    }
                }
            })());
        }
    };
    exports.MainThreadCustomEditors = MainThreadCustomEditors;
    exports.MainThreadCustomEditors = MainThreadCustomEditors = __decorate([
        __param(3, extensions_1.IExtensionService),
        __param(4, storage_1.IStorageService),
        __param(5, workingCopyService_1.IWorkingCopyService),
        __param(6, workingCopyFileService_1.IWorkingCopyFileService),
        __param(7, customEditor_1.ICustomEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService),
        __param(9, editorService_1.IEditorService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], MainThreadCustomEditors);
    var HotExitState;
    (function (HotExitState) {
        let Type;
        (function (Type) {
            Type[Type["Allowed"] = 0] = "Allowed";
            Type[Type["NotAllowed"] = 1] = "NotAllowed";
            Type[Type["Pending"] = 2] = "Pending";
        })(Type = HotExitState.Type || (HotExitState.Type = {}));
        HotExitState.Allowed = Object.freeze({ type: 0 /* Type.Allowed */ });
        HotExitState.NotAllowed = Object.freeze({ type: 1 /* Type.NotAllowed */ });
        class Pending {
            constructor(operation) {
                this.operation = operation;
                this.type = 2 /* Type.Pending */;
            }
        }
        HotExitState.Pending = Pending;
    })(HotExitState || (HotExitState = {}));
    let MainThreadCustomEditorModel = MainThreadCustomEditorModel_1 = class MainThreadCustomEditorModel extends resourceWorkingCopy_1.ResourceWorkingCopy {
        static async create(instantiationService, proxy, viewType, resource, options, getEditors, cancellation) {
            const editors = getEditors();
            let untitledDocumentData;
            if (editors.length !== 0) {
                untitledDocumentData = editors[0].untitledDocumentData;
            }
            const { editable } = await proxy.$createCustomDocument(resource, viewType, options.backupId, untitledDocumentData, cancellation);
            return instantiationService.createInstance(MainThreadCustomEditorModel_1, proxy, viewType, resource, !!options.backupId, editable, !!untitledDocumentData, getEditors);
        }
        constructor(_proxy, _viewType, _editorResource, fromBackup, _editable, startDirty, _getEditors, _fileDialogService, fileService, _labelService, _undoService, _environmentService, workingCopyService, _pathService, extensionService) {
            super(MainThreadCustomEditorModel_1.toWorkingCopyResource(_viewType, _editorResource), fileService);
            this._proxy = _proxy;
            this._viewType = _viewType;
            this._editorResource = _editorResource;
            this._editable = _editable;
            this._getEditors = _getEditors;
            this._fileDialogService = _fileDialogService;
            this._labelService = _labelService;
            this._undoService = _undoService;
            this._environmentService = _environmentService;
            this._pathService = _pathService;
            this._fromBackup = false;
            this._hotExitState = HotExitState.Allowed;
            this._currentEditIndex = -1;
            this._savePoint = -1;
            this._edits = [];
            this._isDirtyFromContentChange = false;
            // TODO@mjbvz consider to enable a `typeId` that is specific for custom
            // editors. Using a distinct `typeId` allows the working copy to have
            // any resource (including file based resources) even if other working
            // copies exist with the same resource.
            //
            // IMPORTANT: changing the `typeId` has an impact on backups for this
            // working copy. Any value that is not the empty string will be used
            // as seed to the backup. Only change the `typeId` if you have implemented
            // a fallback solution to resolve any existing backups that do not have
            // this seed.
            this.typeId = workingCopy_1.NO_TYPE_ID;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.onDidChangeReadonly = event_1.Event.None;
            this._fromBackup = fromBackup;
            if (_editable) {
                this._register(workingCopyService.registerWorkingCopy(this));
                this._register(extensionService.onWillStop(e => {
                    if (!this.isDirty()) {
                        return;
                    }
                    e.veto((async () => {
                        const didSave = await this.save();
                        if (!didSave) {
                            // Veto
                            return true;
                        }
                        return false; // Don't veto
                    })(), (0, nls_1.localize)('vetoExtHostRestart', "Custom editor '{0}' could not be saved.", this.name));
                }));
            }
            // Normally means we're re-opening an untitled file
            if (startDirty) {
                this._isDirtyFromContentChange = true;
            }
        }
        get editorResource() {
            return this._editorResource;
        }
        dispose() {
            if (this._editable) {
                this._undoService.removeElements(this._editorResource);
            }
            this._proxy.$disposeCustomDocument(this._editorResource, this._viewType);
            super.dispose();
        }
        //#region IWorkingCopy
        // Make sure each custom editor has a unique resource for backup and edits
        static toWorkingCopyResource(viewType, resource) {
            const authority = viewType.replace(/[^a-z0-9\-_]/gi, '-');
            const path = `/${(0, dom_1.multibyteAwareBtoa)(resource.with({ query: null, fragment: null }).toString(true))}`;
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeCustomEditor,
                authority: authority,
                path: path,
                query: JSON.stringify(resource.toJSON()),
            });
        }
        get name() {
            return (0, path_1.basename)(this._labelService.getUriLabel(this._editorResource));
        }
        get capabilities() {
            return this.isUntitled() ? 2 /* WorkingCopyCapabilities.Untitled */ : 0 /* WorkingCopyCapabilities.None */;
        }
        isDirty() {
            if (this._isDirtyFromContentChange) {
                return true;
            }
            if (this._edits.length > 0) {
                return this._savePoint !== this._currentEditIndex;
            }
            return this._fromBackup;
        }
        isUntitled() {
            return this._editorResource.scheme === network_1.Schemas.untitled;
        }
        //#endregion
        isReadonly() {
            return !this._editable;
        }
        get viewType() {
            return this._viewType;
        }
        get backupId() {
            return this._backupId;
        }
        pushEdit(editId, label) {
            if (!this._editable) {
                throw new Error('Document is not editable');
            }
            this.change(() => {
                this.spliceEdits(editId);
                this._currentEditIndex = this._edits.length - 1;
            });
            this._undoService.pushElement({
                type: 0 /* UndoRedoElementType.Resource */,
                resource: this._editorResource,
                label: label ?? (0, nls_1.localize)('defaultEditLabel', "Edit"),
                code: 'undoredo.customEditorEdit',
                undo: () => this.undo(),
                redo: () => this.redo(),
            });
        }
        changeContent() {
            this.change(() => {
                this._isDirtyFromContentChange = true;
            });
        }
        async undo() {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex < 0) {
                // nothing to undo
                return;
            }
            const undoneEdit = this._edits[this._currentEditIndex];
            this.change(() => {
                --this._currentEditIndex;
            });
            await this._proxy.$undo(this._editorResource, this.viewType, undoneEdit, this.isDirty());
        }
        async redo() {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex >= this._edits.length - 1) {
                // nothing to redo
                return;
            }
            const redoneEdit = this._edits[this._currentEditIndex + 1];
            this.change(() => {
                ++this._currentEditIndex;
            });
            await this._proxy.$redo(this._editorResource, this.viewType, redoneEdit, this.isDirty());
        }
        spliceEdits(editToInsert) {
            const start = this._currentEditIndex + 1;
            const toRemove = this._edits.length - this._currentEditIndex;
            const removedEdits = typeof editToInsert === 'number'
                ? this._edits.splice(start, toRemove, editToInsert)
                : this._edits.splice(start, toRemove);
            if (removedEdits.length) {
                this._proxy.$disposeEdits(this._editorResource, this._viewType, removedEdits);
            }
        }
        change(makeEdit) {
            const wasDirty = this.isDirty();
            makeEdit();
            this._onDidChangeContent.fire();
            if (this.isDirty() !== wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        async revert(options) {
            if (!this._editable) {
                return;
            }
            if (this._currentEditIndex === this._savePoint && !this._isDirtyFromContentChange && !this._fromBackup) {
                return;
            }
            if (!options?.soft) {
                this._proxy.$revert(this._editorResource, this.viewType, cancellation_1.CancellationToken.None);
            }
            this.change(() => {
                this._isDirtyFromContentChange = false;
                this._fromBackup = false;
                this._currentEditIndex = this._savePoint;
                this.spliceEdits();
            });
        }
        async save(options) {
            const result = !!await this.saveCustomEditor(options);
            // Emit Save Event
            if (result) {
                this._onDidSave.fire({ reason: options?.reason, source: options?.source });
            }
            return result;
        }
        async saveCustomEditor(options) {
            if (!this._editable) {
                return undefined;
            }
            if (this.isUntitled()) {
                const targetUri = await this.suggestUntitledSavePath(options);
                if (!targetUri) {
                    return undefined;
                }
                await this.saveCustomEditorAs(this._editorResource, targetUri, options);
                return targetUri;
            }
            const savePromise = (0, async_1.createCancelablePromise)(token => this._proxy.$onSave(this._editorResource, this.viewType, token));
            this._ongoingSave?.cancel();
            this._ongoingSave = savePromise;
            try {
                await savePromise;
                if (this._ongoingSave === savePromise) { // Make sure we are still doing the same save
                    this.change(() => {
                        this._isDirtyFromContentChange = false;
                        this._savePoint = this._currentEditIndex;
                        this._fromBackup = false;
                    });
                }
            }
            finally {
                if (this._ongoingSave === savePromise) { // Make sure we are still doing the same save
                    this._ongoingSave = undefined;
                }
            }
            return this._editorResource;
        }
        suggestUntitledSavePath(options) {
            if (!this.isUntitled()) {
                throw new Error('Resource is not untitled');
            }
            const remoteAuthority = this._environmentService.remoteAuthority;
            const localResource = (0, resources_1.toLocalResource)(this._editorResource, remoteAuthority, this._pathService.defaultUriScheme);
            return this._fileDialogService.pickFileToSave(localResource, options?.availableFileSystems);
        }
        async saveCustomEditorAs(resource, targetResource, _options) {
            if (this._editable) {
                // TODO: handle cancellation
                await (0, async_1.createCancelablePromise)(token => this._proxy.$onSaveAs(this._editorResource, this.viewType, targetResource, token));
                this.change(() => {
                    this._savePoint = this._currentEditIndex;
                });
                return true;
            }
            else {
                // Since the editor is readonly, just copy the file over
                await this.fileService.copy(resource, targetResource, false /* overwrite */);
                return true;
            }
        }
        get canHotExit() { return typeof this._backupId === 'string' && this._hotExitState.type === 0 /* HotExitState.Type.Allowed */; }
        async backup(token) {
            const editors = this._getEditors();
            if (!editors.length) {
                throw new Error('No editors found for resource, cannot back up');
            }
            const primaryEditor = editors[0];
            const backupMeta = {
                viewType: this.viewType,
                editorResource: this._editorResource,
                backupId: '',
                extension: primaryEditor.extension ? {
                    id: primaryEditor.extension.id.value,
                    location: primaryEditor.extension.location,
                } : undefined,
                webview: {
                    origin: primaryEditor.webview.origin,
                    options: primaryEditor.webview.options,
                    state: primaryEditor.webview.state,
                }
            };
            const backupData = {
                meta: backupMeta
            };
            if (!this._editable) {
                return backupData;
            }
            if (this._hotExitState.type === 2 /* HotExitState.Type.Pending */) {
                this._hotExitState.operation.cancel();
            }
            const pendingState = new HotExitState.Pending((0, async_1.createCancelablePromise)(token => this._proxy.$backup(this._editorResource.toJSON(), this.viewType, token)));
            this._hotExitState = pendingState;
            token.onCancellationRequested(() => {
                pendingState.operation.cancel();
            });
            let errorMessage = '';
            try {
                const backupId = await pendingState.operation;
                // Make sure state has not changed in the meantime
                if (this._hotExitState === pendingState) {
                    this._hotExitState = HotExitState.Allowed;
                    backupData.meta.backupId = backupId;
                    this._backupId = backupId;
                }
            }
            catch (e) {
                if ((0, errors_1.isCancellationError)(e)) {
                    // This is expected
                    throw e;
                }
                // Otherwise it could be a real error. Make sure state has not changed in the meantime.
                if (this._hotExitState === pendingState) {
                    this._hotExitState = HotExitState.NotAllowed;
                }
                if (e.message) {
                    errorMessage = e.message;
                }
            }
            if (this._hotExitState === HotExitState.Allowed) {
                return backupData;
            }
            throw new Error(`Cannot backup in this state: ${errorMessage}`);
        }
    };
    MainThreadCustomEditorModel = MainThreadCustomEditorModel_1 = __decorate([
        __param(7, dialogs_1.IFileDialogService),
        __param(8, files_1.IFileService),
        __param(9, label_1.ILabelService),
        __param(10, undoRedo_1.IUndoRedoService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, workingCopyService_1.IWorkingCopyService),
        __param(13, pathService_1.IPathService),
        __param(14, extensions_1.IExtensionService)
    ], MainThreadCustomEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEN1c3RvbUVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ3VzdG9tRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNENoRyxJQUFXLHFCQUdWO0lBSEQsV0FBVyxxQkFBcUI7UUFDL0IscUVBQU0sQ0FBQTtRQUNOLGlFQUFJLENBQUE7SUFDTCxDQUFDLEVBSFUscUJBQXFCLEtBQXJCLHFCQUFxQixRQUcvQjtJQUVNLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFVdEQsWUFDQyxPQUF3QixFQUNQLGlCQUFxQyxFQUNyQyx1QkFBZ0QsRUFDOUMsZ0JBQW1DLEVBQ3JDLGNBQStCLEVBQzNCLGtCQUF1QyxFQUNuQyxzQkFBK0MsRUFDbEQsb0JBQTJELEVBQzNELG1CQUEwRCxFQUNoRSxjQUErQyxFQUN4QyxxQkFBNkQsRUFDMUQsd0JBQW1FO1lBRTdGLEtBQUssRUFBRSxDQUFDO1lBWlMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNyQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBSzFCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDMUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMvQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDdkIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBbEI3RSxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBVSxDQUFDLENBQUM7WUFFL0QseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQW9DLENBQUM7WUFvQm5G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