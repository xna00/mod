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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookService", "vs/platform/log/common/log", "vs/base/common/event", "vs/workbench/services/extensions/common/extensions", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/map", "vs/workbench/services/workingCopy/common/fileWorkingCopyManager", "vs/base/common/network", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/base/common/types", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration"], function (require, exports, instantiation_1, uri_1, notebookCommon_1, notebookEditorModel_1, lifecycle_1, notebookService_1, log_1, event_1, extensions_1, uriIdentity_1, map_1, fileWorkingCopyManager_1, network_1, notebookProvider_1, types_1, cancellation_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookModelResolverServiceImpl = void 0;
    let NotebookModelReferenceCollection = class NotebookModelReferenceCollection extends lifecycle_1.ReferenceCollection {
        constructor(_instantiationService, _notebookService, _logService, _configurationService) {
            super();
            this._instantiationService = _instantiationService;
            this._notebookService = _notebookService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._workingCopyManagers = new Map();
            this._modelListener = new Map();
            this._onDidSaveNotebook = new event_1.Emitter();
            this.onDidSaveNotebook = this._onDidSaveNotebook.event;
            this._onDidChangeDirty = new event_1.Emitter();
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._dirtyStates = new map_1.ResourceMap();
            this.modelsToDispose = new Set();
        }
        dispose() {
            this._disposables.dispose();
            this._onDidSaveNotebook.dispose();
            this._onDidChangeDirty.dispose();
            (0, lifecycle_1.dispose)(this._modelListener.values());
            (0, lifecycle_1.dispose)(this._workingCopyManagers.values());
        }
        isDirty(resource) {
            return this._dirtyStates.get(resource) ?? false;
        }
        async createReferencedObject(key, viewType, hasAssociatedFilePath, limits) {
            // Untrack as being disposed
            this.modelsToDispose.delete(key);
            const uri = uri_1.URI.parse(key);
            const workingCopyTypeId = notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create(viewType);
            let workingCopyManager = this._workingCopyManagers.get(workingCopyTypeId);
            if (!workingCopyManager) {
                const factory = new notebookEditorModel_1.NotebookFileWorkingCopyModelFactory(viewType, this._notebookService, this._configurationService);
                workingCopyManager = this._instantiationService.createInstance(fileWorkingCopyManager_1.FileWorkingCopyManager, workingCopyTypeId, factory, factory);
                this._workingCopyManagers.set(workingCopyTypeId, workingCopyManager);
            }
            const scratchPad = viewType === 'interactive' && this._configurationService.getValue(notebookCommon_1.NotebookSetting.InteractiveWindowPromptToSave) !== true;
            const model = this._instantiationService.createInstance(notebookEditorModel_1.SimpleNotebookEditorModel, uri, hasAssociatedFilePath, viewType, workingCopyManager, scratchPad);
            const result = await model.load({ limits });
            // Whenever a notebook model is dirty we automatically reference it so that
            // we can ensure that at least one reference exists. That guarantees that
            // a model with unsaved changes is never disposed.
            let onDirtyAutoReference;
            this._modelListener.set(result, (0, lifecycle_1.combinedDisposable)(result.onDidSave(() => this._onDidSaveNotebook.fire(result.resource)), result.onDidChangeDirty(() => {
                const isDirty = result.isDirty();
                this._dirtyStates.set(result.resource, isDirty);
                // isDirty -> add reference
                // !isDirty -> free reference
                if (isDirty && !onDirtyAutoReference) {
                    onDirtyAutoReference = this.acquire(key, viewType);
                }
                else if (onDirtyAutoReference) {
                    onDirtyAutoReference.dispose();
                    onDirtyAutoReference = undefined;
                }
                this._onDidChangeDirty.fire(result);
            }), (0, lifecycle_1.toDisposable)(() => onDirtyAutoReference?.dispose())));
            return result;
        }
        destroyReferencedObject(key, object) {
            this.modelsToDispose.add(key);
            (async () => {
                try {
                    const model = await object;
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    if (model instanceof notebookEditorModel_1.SimpleNotebookEditorModel) {
                        await model.canDispose();
                    }
                    if (!this.modelsToDispose.has(key)) {
                        // return if model has been acquired again meanwhile
                        return;
                    }
                    // Finally we can dispose the model
                    this._modelListener.get(model)?.dispose();
                    this._modelListener.delete(model);
                    model.dispose();
                }
                catch (err) {
                    this._logService.error('FAILED to destory notebook', err);
                }
                finally {
                    this.modelsToDispose.delete(key); // Untrack as being disposed
                }
            })();
        }
    };
    NotebookModelReferenceCollection = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookService_1.INotebookService),
        __param(2, log_1.ILogService),
        __param(3, configuration_1.IConfigurationService)
    ], NotebookModelReferenceCollection);
    let NotebookModelResolverServiceImpl = class NotebookModelResolverServiceImpl {
        constructor(instantiationService, _notebookService, _extensionService, _uriIdentService) {
            this._notebookService = _notebookService;
            this._extensionService = _extensionService;
            this._uriIdentService = _uriIdentService;
            this._onWillFailWithConflict = new event_1.AsyncEmitter();
            this.onWillFailWithConflict = this._onWillFailWithConflict.event;
            this._data = instantiationService.createInstance(NotebookModelReferenceCollection);
            this.onDidSaveNotebook = this._data.onDidSaveNotebook;
            this.onDidChangeDirty = this._data.onDidChangeDirty;
        }
        dispose() {
            this._data.dispose();
        }
        isDirty(resource) {
            return this._data.isDirty(resource);
        }
        async resolve(arg0, viewType, limits) {
            let resource;
            let hasAssociatedFilePath = false;
            if (uri_1.URI.isUri(arg0)) {
                resource = arg0;
            }
            else {
                if (!arg0.untitledResource) {
                    const info = this._notebookService.getContributedNotebookType((0, types_1.assertIsDefined)(viewType));
                    if (!info) {
                        throw new Error('UNKNOWN view type: ' + viewType);
                    }
                    const suffix = notebookProvider_1.NotebookProviderInfo.possibleFileEnding(info.selectors) ?? '';
                    for (let counter = 1;; counter++) {
                        const candidate = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: `Untitled-${counter}${suffix}`, query: viewType });
                        if (!this._notebookService.getNotebookTextModel(candidate)) {
                            resource = candidate;
                            break;
                        }
                    }
                }
                else if (arg0.untitledResource.scheme === network_1.Schemas.untitled) {
                    resource = arg0.untitledResource;
                }
                else {
                    resource = arg0.untitledResource.with({ scheme: network_1.Schemas.untitled });
                    hasAssociatedFilePath = true;
                }
            }
            if (resource.scheme === notebookCommon_1.CellUri.scheme) {
                throw new Error(`CANNOT open a cell-uri as notebook. Tried with ${resource.toString()}`);
            }
            resource = this._uriIdentService.asCanonicalUri(resource);
            const existingViewType = this._notebookService.getNotebookTextModel(resource)?.viewType;
            if (!viewType) {
                if (existingViewType) {
                    viewType = existingViewType;
                }
                else {
                    await this._extensionService.whenInstalledExtensionsRegistered();
                    const providers = this._notebookService.getContributedNotebookTypes(resource);
                    const exclusiveProvider = providers.find(provider => provider.exclusive);
                    viewType = exclusiveProvider?.id || providers[0]?.id;
                }
            }
            if (!viewType) {
                throw new Error(`Missing viewType for '${resource}'`);
            }
            if (existingViewType && existingViewType !== viewType) {
                await this._onWillFailWithConflict.fireAsync({ resource, viewType }, cancellation_1.CancellationToken.None);
                // check again, listener should have done cleanup
                const existingViewType2 = this._notebookService.getNotebookTextModel(resource)?.viewType;
                if (existingViewType2 && existingViewType2 !== viewType) {
                    throw new Error(`A notebook with view type '${existingViewType2}' already exists for '${resource}', CANNOT create another notebook with view type ${viewType}`);
                }
            }
            const reference = this._data.acquire(resource.toString(), viewType, hasAssociatedFilePath, limits);
            try {
                const model = await reference.object;
                return {
                    object: model,
                    dispose() { reference.dispose(); }
                };
            }
            catch (err) {
                reference.dispose();
                throw err;
            }
        }
    };
    exports.NotebookModelResolverServiceImpl = NotebookModelResolverServiceImpl;
    exports.NotebookModelResolverServiceImpl = NotebookModelResolverServiceImpl = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookService_1.INotebookService),
        __param(2, extensions_1.IExtensionService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], NotebookModelResolverServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JNb2RlbFJlc29sdmVyU2VydmljZUltcGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2NvbW1vbi9ub3RlYm9va0VkaXRvck1vZGVsUmVzb2x2ZXJTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHLElBQU0sZ0NBQWdDLEdBQXRDLE1BQU0sZ0NBQWlDLFNBQVEsK0JBQTBEO1FBZXhHLFlBQ3dCLHFCQUE2RCxFQUNsRSxnQkFBbUQsRUFDeEQsV0FBeUMsRUFDL0IscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBTGdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDakQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNkLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFqQnBFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDckMseUJBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQStGLENBQUM7WUFDOUgsbUJBQWMsR0FBRyxJQUFJLEdBQUcsRUFBNkMsQ0FBQztZQUV0RSx1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBTyxDQUFDO1lBQ2hELHNCQUFpQixHQUFlLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFdEQsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQWdDLENBQUM7WUFDeEUscUJBQWdCLEdBQXdDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFN0UsaUJBQVksR0FBRyxJQUFJLGlCQUFXLEVBQVcsQ0FBQztZQUUxQyxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7UUFR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