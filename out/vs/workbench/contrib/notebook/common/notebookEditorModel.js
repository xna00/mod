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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/editorModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, buffer_1, errors_1, event_1, lifecycle_1, network_1, objects_1, types_1, configuration_1, editorModel_1, notebookCommon_1, notebookService_1, filesConfigurationService_1) {
    "use strict";
    var SimpleNotebookEditorModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFileWorkingCopyModelFactory = exports.NotebookFileWorkingCopyModel = exports.SimpleNotebookEditorModel = void 0;
    //#region --- simple content provider
    let SimpleNotebookEditorModel = SimpleNotebookEditorModel_1 = class SimpleNotebookEditorModel extends editorModel_1.EditorModel {
        constructor(resource, _hasAssociatedFilePath, viewType, _workingCopyManager, scratchpad, _filesConfigurationService) {
            super();
            this.resource = resource;
            this._hasAssociatedFilePath = _hasAssociatedFilePath;
            this.viewType = viewType;
            this._workingCopyManager = _workingCopyManager;
            this._filesConfigurationService = _filesConfigurationService;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this._onDidSave = this._register(new event_1.Emitter());
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this._onDidRevertUntitled = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this.onDidSave = this._onDidSave.event;
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this.onDidRevertUntitled = this._onDidRevertUntitled.event;
            this._workingCopyListeners = this._register(new lifecycle_1.DisposableStore());
            this.scratchPad = scratchpad;
        }
        dispose() {
            this._workingCopy?.dispose();
            super.dispose();
        }
        get notebook() {
            return this._workingCopy?.model?.notebookModel;
        }
        isResolved() {
            return Boolean(this._workingCopy?.model?.notebookModel);
        }
        async canDispose() {
            if (!this._workingCopy) {
                return true;
            }
            if (SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy)) {
                return this._workingCopyManager.stored.canDispose(this._workingCopy);
            }
            else {
                return true;
            }
        }
        isDirty() {
            return this._workingCopy?.isDirty() ?? false;
        }
        isModified() {
            return this._workingCopy?.isModified() ?? false;
        }
        isOrphaned() {
            return SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy) && this._workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */);
        }
        hasAssociatedFilePath() {
            return !SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy) && !!this._workingCopy?.hasAssociatedFilePath;
        }
        isReadonly() {
            if (SimpleNotebookEditorModel_1._isStoredFileWorkingCopy(this._workingCopy)) {
                return this._workingCopy?.isReadonly();
            }
            else {
                return this._filesConfigurationService.isReadonly(this.resource);
            }
        }
        get hasErrorState() {
            if (this._workingCopy && 'hasState' in this._workingCopy) {
                return this._workingCopy.hasState(5 /* StoredFileWorkingCopyState.ERROR */);
            }
            return false;
        }
        revert(options) {
            (0, types_1.assertType)(this.isResolved());
            return this._workingCopy.revert(options);
        }
        save(options) {
            (0, types_1.assertType)(this.isResolved());
            return this._workingCopy.save(options);
        }
        async load(options) {
            if (!this._workingCopy || !this._workingCopy.model) {
                if (this.resource.scheme === network_1.Schemas.untitled) {
                    if (this._hasAssociatedFilePath) {
                        this._workingCopy = await this._workingCopyManager.resolve({ associatedResource: this.resource });
                    }
                    else {
                        this._workingCopy = await this._workingCopyManager.resolve({ untitledResource: this.resource, isScratchpad: this.scratchPad });
                    }
                    this._workingCopy.onDidRevert(() => this._onDidRevertUntitled.fire());
                }
                else {
                    this._workingCopy = await this._workingCopyManager.resolve(this.resource, {
                        limits: options?.limits,
                        reload: options?.forceReadFromFile ? { async: false, force: true } : undefined
                    });
                    this._workingCopyListeners.add(this._workingCopy.onDidSave(e => this._onDidSave.fire(e)));
                    this._workingCopyListeners.add(this._workingCopy.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire()));
                    this._workingCopyListeners.add(this._workingCopy.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
                }
                this._workingCopyListeners.add(this._workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(), undefined));
                this._workingCopyListeners.add(this._workingCopy.onWillDispose(() => {
                    this._workingCopyListeners.clear();
                    this._workingCopy?.model?.dispose();
                }));
            }
            else {
                await this._workingCopyManager.resolve(this.resource, {
                    reload: {
                        async: !options?.forceReadFromFile,
                        force: options?.forceReadFromFile
                    },
                    limits: options?.limits
                });
            }
            (0, types_1.assertType)(this.isResolved());
            return this;
        }
        async saveAs(target) {
            const newWorkingCopy = await this._workingCopyManager.saveAs(this.resource, target);
            if (!newWorkingCopy) {
                return undefined;
            }
            // this is a little hacky because we leave the new working copy alone. BUT
            // the newly created editor input will pick it up and claim ownership of it.
            return { resource: newWorkingCopy.resource };
        }
        static _isStoredFileWorkingCopy(candidate) {
            const isUntitled = candidate && candidate.capabilities & 2 /* WorkingCopyCapabilities.Untitled */;
            return !isUntitled;
        }
    };
    exports.SimpleNotebookEditorModel = SimpleNotebookEditorModel;
    exports.SimpleNotebookEditorModel = SimpleNotebookEditorModel = SimpleNotebookEditorModel_1 = __decorate([
        __param(5, filesConfigurationService_1.IFilesConfigurationService)
    ], SimpleNotebookEditorModel);
    class NotebookFileWorkingCopyModel extends lifecycle_1.Disposable {
        constructor(_notebookModel, _notebookService, _configurationService) {
            super();
            this._notebookModel = _notebookModel;
            this._notebookService = _notebookService;
            this._configurationService = _configurationService;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this.configuration = undefined;
            this.onWillDispose = _notebookModel.onWillDispose.bind(_notebookModel);
            this._register(_notebookModel.onDidChangeContent(e => {
                for (const rawEvent of e.rawEvents) {
                    if (rawEvent.kind === notebookCommon_1.NotebookCellsChangeType.Initialize) {
                        continue;
                    }
                    if (rawEvent.transient) {
                        continue;
                    }
                    this._onDidChangeContent.fire({
                        isRedoing: false, //todo@rebornix forward this information from notebook model
                        isUndoing: false,
                        isInitial: false, //_notebookModel.cells.length === 0 // todo@jrieken non transient metadata?
                    });
                    break;
                }
            }));
            if (_notebookModel.uri.scheme === network_1.Schemas.vscodeRemote) {
                this.configuration = {
                    // Intentionally pick a larger delay for triggering backups when
                    // we are connected to a remote. This saves us repeated roundtrips
                    // to the remote server when the content changes because the
                    // remote hosts the extension of the notebook with the contents truth
                    backupDelay: 10000
                };
                // Override save behavior to avoid transferring the buffer across the wire 3 times
                if (this._configurationService.getValue(notebookCommon_1.NotebookSetting.remoteSaving)) {
                    this.save = async (options, token) => {
                        const serializer = await this.getNotebookSerializer();
                        if (token.isCancellationRequested) {
                            throw new errors_1.CancellationError();
                        }
                        const stat = await serializer.save(this._notebookModel.uri, this._notebookModel.versionId, options, token);
                        return stat;
                    };
                }
            }
        }
        dispose() {
            this._notebookModel.dispose();
            super.dispose();
        }
        get notebookModel() {
            return this._notebookModel;
        }
        async snapshot(token) {
            const serializer = await this.getNotebookSerializer();
            const data = {
                metadata: (0, objects_1.filter)(this._notebookModel.metadata, key => !serializer.options.transientDocumentMetadata[key]),
                cells: [],
            };
            for (const cell of this._notebookModel.cells) {
                const cellData = {
                    cellKind: cell.cellKind,
                    language: cell.language,
                    mime: cell.mime,
                    source: cell.getValue(),
                    outputs: [],
                    internalMetadata: cell.internalMetadata
                };
                cellData.outputs = !serializer.options.transientOutputs ? cell.outputs : [];
                cellData.metadata = (0, objects_1.filter)(cell.metadata, key => !serializer.options.transientCellMetadata[key]);
                data.cells.push(cellData);
            }
            const bytes = await serializer.notebookToData(data);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            return (0, buffer_1.bufferToStream)(bytes);
        }
        async update(stream, token) {
            const serializer = await this.getNotebookSerializer();
            const bytes = await (0, buffer_1.streamToBuffer)(stream);
            const data = await serializer.dataToNotebook(bytes);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            this._notebookModel.reset(data.cells, data.metadata, serializer.options);
        }
        async getNotebookSerializer() {
            const info = await this._notebookService.withNotebookDataProvider(this.notebookModel.viewType);
            if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                throw new Error('CANNOT open file notebook with this provider');
            }
            return info.serializer;
        }
        get versionId() {
            return this._notebookModel.alternativeVersionId;
        }
        pushStackElement() {
            this._notebookModel.pushStackElement();
        }
    }
    exports.NotebookFileWorkingCopyModel = NotebookFileWorkingCopyModel;
    let NotebookFileWorkingCopyModelFactory = class NotebookFileWorkingCopyModelFactory {
        constructor(_viewType, _notebookService, _configurationService) {
            this._viewType = _viewType;
            this._notebookService = _notebookService;
            this._configurationService = _configurationService;
        }
        async createModel(resource, stream, token) {
            const info = await this._notebookService.withNotebookDataProvider(this._viewType);
            if (!(info instanceof notebookService_1.SimpleNotebookProviderInfo)) {
                throw new Error('CANNOT open file notebook with this provider');
            }
            const bytes = await (0, buffer_1.streamToBuffer)(stream);
            const data = await info.serializer.dataToNotebook(bytes);
            if (token.isCancellationRequested) {
                throw new errors_1.CancellationError();
            }
            const notebookModel = this._notebookService.createNotebookTextModel(info.viewType, resource, data, info.serializer.options);
            return new NotebookFileWorkingCopyModel(notebookModel, this._notebookService, this._configurationService);
        }
    };
    exports.NotebookFileWorkingCopyModelFactory = NotebookFileWorkingCopyModelFactory;
    exports.NotebookFileWorkingCopyModelFactory = NotebookFileWorkingCopyModelFactory = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookFileWorkingCopyModelFactory);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rRWRpdG9yTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCaEcscUNBQXFDO0lBRTlCLElBQU0seUJBQXlCLGlDQUEvQixNQUFNLHlCQUEwQixTQUFRLHlCQUFXO1FBa0J6RCxZQUNVLFFBQWEsRUFDTCxzQkFBK0IsRUFDdkMsUUFBZ0IsRUFDUixtQkFBd0csRUFDekgsVUFBbUIsRUFDUywwQkFBdUU7WUFFbkcsS0FBSyxFQUFFLENBQUM7WUFQQyxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ0wsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFTO1lBQ3ZDLGFBQVEsR0FBUixRQUFRLENBQVE7WUFDUix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFGO1lBRTVFLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNEI7WUF0Qm5GLHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3hELGVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFtQyxDQUFDLENBQUM7WUFDNUUseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0QseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFbkUscUJBQWdCLEdBQWdCLElBQUksQ0FBQyxpQkFBaUIsQ0FB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