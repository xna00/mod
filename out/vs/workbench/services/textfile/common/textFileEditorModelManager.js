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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/uri", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/services/textfile/common/textFileSaveParticipant", "vs/platform/notification/common/notification", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/base/common/resources", "vs/editor/common/model/textModel", "vs/editor/common/languages/modesRegistry", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, nls_1, errorMessage_1, event_1, uri_1, textFileEditorModel_1, lifecycle_1, instantiation_1, map_1, files_1, async_1, errors_1, textFileSaveParticipant_1, notification_1, workingCopyFileService_1, resources_1, textModel_1, modesRegistry_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditorModelManager = void 0;
    let TextFileEditorModelManager = class TextFileEditorModelManager extends lifecycle_1.Disposable {
        get models() {
            return [...this.mapResourceToModel.values()];
        }
        constructor(instantiationService, fileService, notificationService, workingCopyFileService, uriIdentityService) {
            super();
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.notificationService = notificationService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidCreate = this._register(new event_1.Emitter());
            this.onDidCreate = this._onDidCreate.event;
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidRemove = this._register(new event_1.Emitter());
            this.onDidRemove = this._onDidRemove.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            this._onDidChangeOrphaned = this._register(new event_1.Emitter());
            this.onDidChangeOrphaned = this._onDidChangeOrphaned.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidChangeEncoding = this._register(new event_1.Emitter());
            this.onDidChangeEncoding = this._onDidChangeEncoding.event;
            this.mapResourceToModel = new map_1.ResourceMap();
            this.mapResourceToModelListeners = new map_1.ResourceMap();
            this.mapResourceToDisposeListener = new map_1.ResourceMap();
            this.mapResourceToPendingModelResolvers = new map_1.ResourceMap();
            this.modelResolveQueue = this._register(new async_1.ResourceQueue());
            this.saveErrorHandler = (() => {
                const notificationService = this.notificationService;
                return {
                    onSaveError(error, model) {
                        notificationService.error((0, nls_1.localize)({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", model.name, (0, errorMessage_1.toErrorMessage)(error, false)));
                    }
                };
            })();
            this.mapCorrelationIdToModelsToRestore = new Map();
            //#region Save participants
            this.saveParticipants = this._register(this.instantiationService.createInstance(textFileSaveParticipant_1.TextFileSaveParticipant));
            this.registerListeners();
        }
        registerListeners() {
            // Update models from file change events
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // File system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProviderCapabilities(e)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProviderRegistrations(e)));
            // Working copy operations
            this._register(this.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => this.onWillRunWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidFailWorkingCopyFileOperation(e => this.onDidFailWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this.onDidRunWorkingCopyFileOperation(e)));
        }
        onDidFilesChange(e) {
            for (const model of this.models) {
                if (model.isDirty()) {
                    continue; // never reload dirty models
                }
                // Trigger a model resolve for any update or add event that impacts
                // the model. We also consider the added event because it could
                // be that a file was added and updated right after.
                if (e.contains(model.resource, 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */)) {
                    this.queueModelReload(model);
                }
            }
        }
        onDidChangeFileSystemProviderCapabilities(e) {
            // Resolve models again for file systems that changed
            // capabilities to fetch latest metadata (e.g. readonly)
            // into all models.
            this.queueModelReloads(e.scheme);
        }
        onDidChangeFileSystemProviderRegistrations(e) {
            if (!e.added) {
                return; // only if added
            }
            // Resolve models again for file systems that registered
            // to account for capability changes: extensions may
            // unregister and register the same provider with different
            // capabilities, so we want to ensure to fetch latest
            // metadata (e.g. readonly) into all models.
            this.queueModelReloads(e.scheme);
        }
        queueModelReloads(scheme) {
            for (const model of this.models) {
                if (model.isDirty()) {
                    continue; // never reload dirty models
                }
                if (scheme === model.resource.scheme) {
                    this.queueModelReload(model);
                }
            }
        }
        queueModelReload(model) {
            // Resolve model to update (use a queue to prevent accumulation of resolves
            // when the resolve actually takes long. At most we only want the queue
            // to have a size of 2 (1 running resolve and 1 queued resolve).
            const queueSize = this.modelResolveQueue.queueSize(model.resource);
            if (queueSize <= 1) {
                this.modelResolveQueue.queueFor(model.resource, async () => {
                    try {
                        await this.reload(model);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                    }
                });
            }
        }
        onWillRunWorkingCopyFileOperation(e) {
            // Move / Copy: remember models to restore after the operation
            if (e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */) {
                const modelsToRestore = [];
                for (const { source, target } of e.files) {
                    if (source) {
                        if (this.uriIdentityService.extUri.isEqual(source, target)) {
                            continue; // ignore if resources are considered equal
                        }
                        // find all models that related to source (can be many if resource is a folder)
                        const sourceModels = [];
                        for (const model of this.models) {
                            if (this.uriIdentityService.extUri.isEqualOrParent(model.resource, source)) {
                                sourceModels.push(model);
                            }
                        }
                        // remember each source model to resolve again after move is done
                        // with optional content to restore if it was dirty
                        for (const sourceModel of sourceModels) {
                            const sourceModelResource = sourceModel.resource;
                            // If the source is the actual model, just use target as new resource
                            let targetModelResource;
                            if (this.uriIdentityService.extUri.isEqual(sourceModelResource, source)) {
                                targetModelResource = target;
                            }
                            // Otherwise a parent folder of the source is being moved, so we need
                            // to compute the target resource based on that
                            else {
                                targetModelResource = (0, resources_1.joinPath)(target, sourceModelResource.path.substr(source.path.length + 1));
                            }
                            modelsToRestore.push({
                                source: sourceModelResource,
                                target: targetModelResource,
                                languageId: sourceModel.getLanguageId(),
                                encoding: sourceModel.getEncoding(),
                                snapshot: sourceModel.isDirty() ? sourceModel.createSnapshot() : undefined
                            });
                        }
                    }
                }
                this.mapCorrelationIdToModelsToRestore.set(e.correlationId, modelsToRestore);
            }
        }
        onDidFailWorkingCopyFileOperation(e) {
            // Move / Copy: restore dirty flag on models to restore that were dirty
            if ((e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */)) {
                const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                if (modelsToRestore) {
                    this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                    modelsToRestore.forEach(model => {
                        // snapshot presence means this model used to be dirty and so we restore that
                        // flag. we do NOT have to restore the content because the model was only soft
                        // reverted and did not loose its original dirty contents.
                        if (model.snapshot) {
                            this.get(model.source)?.setDirty(true);
                        }
                    });
                }
            }
        }
        onDidRunWorkingCopyFileOperation(e) {
            switch (e.operation) {
                // Create: Revert existing models
                case 0 /* FileOperation.CREATE */:
                    e.waitUntil((async () => {
                        for (const { target } of e.files) {
                            const model = this.get(target);
                            if (model && !model.isDisposed()) {
                                await model.revert();
                            }
                        }
                    })());
                    break;
                // Move/Copy: restore models that were resolved before the operation took place
                case 2 /* FileOperation.MOVE */:
                case 3 /* FileOperation.COPY */:
                    e.waitUntil((async () => {
                        const modelsToRestore = this.mapCorrelationIdToModelsToRestore.get(e.correlationId);
                        if (modelsToRestore) {
                            this.mapCorrelationIdToModelsToRestore.delete(e.correlationId);
                            await async_1.Promises.settled(modelsToRestore.map(async (modelToRestore) => {
                                // restore the model at the target. if we have previous dirty content, we pass it
                                // over to be used, otherwise we force a reload from disk. this is important
                                // because we know the file has changed on disk after the move and the model might
                                // have still existed with the previous state. this ensures that the model is not
                                // tracking a stale state.
                                const restoredModel = await this.resolve(modelToRestore.target, {
                                    reload: { async: false }, // enforce a reload
                                    contents: modelToRestore.snapshot ? (0, textModel_1.createTextBufferFactoryFromSnapshot)(modelToRestore.snapshot) : undefined,
                                    encoding: modelToRestore.encoding
                                });
                                // restore previous language only if the language is now unspecified and it was specified
                                // but not when the file was explicitly stored with the plain text extension
                                // (https://github.com/microsoft/vscode/issues/125795)
                                if (modelToRestore.languageId &&
                                    modelToRestore.languageId !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID &&
                                    restoredModel.getLanguageId() === modesRegistry_1.PLAINTEXT_LANGUAGE_ID &&
                                    (0, resources_1.extname)(modelToRestore.target) !== modesRegistry_1.PLAINTEXT_EXTENSION) {
                                    restoredModel.updateTextEditorModel(undefined, modelToRestore.languageId);
                                }
                            }));
                        }
                    })());
                    break;
            }
        }
        get(resource) {
            return this.mapResourceToModel.get(resource);
        }
        has(resource) {
            return this.mapResourceToModel.has(resource);
        }
        async reload(model) {
            // Await a pending model resolve first before proceeding
            // to ensure that we never resolve a model more than once
            // in parallel.
            await this.joinPendingResolves(model.resource);
            if (model.isDirty() || model.isDisposed() || !this.has(model.resource)) {
                return; // the model possibly got dirty or disposed, so return early then
            }
            // Trigger reload
            await this.doResolve(model, { reload: { async: false } });
        }
        async resolve(resource, options) {
            // Await a pending model resolve first before proceeding
            // to ensure that we never resolve a model more than once
            // in parallel.
            const pendingResolve = this.joinPendingResolves(resource);
            if (pendingResolve) {
                await pendingResolve;
            }
            // Trigger resolve
            return this.doResolve(resource, options);
        }
        async doResolve(resourceOrModel, options) {
            let model;
            let resource;
            if (uri_1.URI.isUri(resourceOrModel)) {
                resource = resourceOrModel;
                model = this.get(resource);
            }
            else {
                resource = resourceOrModel.resource;
                model = resourceOrModel;
            }
            let modelResolve;
            let didCreateModel = false;
            // Model exists
            if (model) {
                // Always reload if contents are provided
                if (options?.contents) {
                    modelResolve = model.resolve(options);
                }
                // Reload async or sync based on options
                else if (options?.reload) {
                    // async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        modelResolve = Promise.resolve();
                        (async () => {
                            try {
                                await model.resolve(options);
                            }
                            catch (error) {
                                (0, errors_1.onUnexpectedError)(error);
                            }
                        })();
                    }
                    // sync reload: do not return until model reloaded
                    else {
                        modelResolve = model.resolve(options);
                    }
                }
                // Do not reload
                else {
                    modelResolve = Promise.resolve();
                }
            }
            // Model does not exist
            else {
                didCreateModel = true;
                const newModel = model = this.instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resource, options ? options.encoding : undefined, options ? options.languageId : undefined);
                modelResolve = model.resolve(options);
                this.registerModel(newModel);
            }
            // Store pending resolves to avoid race conditions
            this.mapResourceToPendingModelResolvers.set(resource, modelResolve);
            // Make known to manager (if not already known)
            this.add(resource, model);
            // Emit some events if we created the model
            if (didCreateModel) {
                this._onDidCreate.fire(model);
                // If the model is dirty right from the beginning,
                // make sure to emit this as an event
                if (model.isDirty()) {
                    this._onDidChangeDirty.fire(model);
                }
            }
            try {
                await modelResolve;
            }
            catch (error) {
                // Automatically dispose the model if we created it
                // because we cannot dispose a model we do not own
                // https://github.com/microsoft/vscode/issues/138850
                if (didCreateModel) {
                    model.dispose();
                }
                throw error;
            }
            finally {
                // Remove from pending resolves
                this.mapResourceToPendingModelResolvers.delete(resource);
            }
            // Apply language if provided
            if (options?.languageId) {
                model.setLanguageId(options.languageId);
            }
            // Model can be dirty if a backup was restored, so we make sure to
            // have this event delivered if we created the model here
            if (didCreateModel && model.isDirty()) {
                this._onDidChangeDirty.fire(model);
            }
            return model;
        }
        joinPendingResolves(resource) {
            const pendingModelResolve = this.mapResourceToPendingModelResolvers.get(resource);
            if (!pendingModelResolve) {
                return;
            }
            return this.doJoinPendingResolves(resource);
        }
        async doJoinPendingResolves(resource) {
            // While we have pending model resolves, ensure
            // to await the last one finishing before returning.
            // This prevents a race when multiple clients await
            // the pending resolve and then all trigger the resolve
            // at the same time.
            let currentModelCopyResolve;
            while (this.mapResourceToPendingModelResolvers.has(resource)) {
                const nextPendingModelResolve = this.mapResourceToPendingModelResolvers.get(resource);
                if (nextPendingModelResolve === currentModelCopyResolve) {
                    return; // already awaited on - return
                }
                currentModelCopyResolve = nextPendingModelResolve;
                try {
                    await nextPendingModelResolve;
                }
                catch (error) {
                    // ignore any error here, it will bubble to the original requestor
                }
            }
        }
        registerModel(model) {
            // Install model listeners
            const modelListeners = new lifecycle_1.DisposableStore();
            modelListeners.add(model.onDidResolve(reason => this._onDidResolve.fire({ model, reason })));
            modelListeners.add(model.onDidChangeDirty(() => this._onDidChangeDirty.fire(model)));
            modelListeners.add(model.onDidChangeReadonly(() => this._onDidChangeReadonly.fire(model)));
            modelListeners.add(model.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire(model)));
            modelListeners.add(model.onDidSaveError(() => this._onDidSaveError.fire(model)));
            modelListeners.add(model.onDidSave(e => this._onDidSave.fire({ model, ...e })));
            modelListeners.add(model.onDidRevert(() => this._onDidRevert.fire(model)));
            modelListeners.add(model.onDidChangeEncoding(() => this._onDidChangeEncoding.fire(model)));
            // Keep for disposal
            this.mapResourceToModelListeners.set(model.resource, modelListeners);
        }
        add(resource, model) {
            const knownModel = this.mapResourceToModel.get(resource);
            if (knownModel === model) {
                return; // already cached
            }
            // dispose any previously stored dispose listener for this resource
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            disposeListener?.dispose();
            // store in cache but remove when model gets disposed
            this.mapResourceToModel.set(resource, model);
            this.mapResourceToDisposeListener.set(resource, model.onWillDispose(() => this.remove(resource)));
        }
        remove(resource) {
            const removed = this.mapResourceToModel.delete(resource);
            const disposeListener = this.mapResourceToDisposeListener.get(resource);
            if (disposeListener) {
                (0, lifecycle_1.dispose)(disposeListener);
                this.mapResourceToDisposeListener.delete(resource);
            }
            const modelListener = this.mapResourceToModelListeners.get(resource);
            if (modelListener) {
                (0, lifecycle_1.dispose)(modelListener);
                this.mapResourceToModelListeners.delete(resource);
            }
            if (removed) {
                this._onDidRemove.fire(resource);
            }
        }
        addSaveParticipant(participant) {
            return this.saveParticipants.addSaveParticipant(participant);
        }
        runSaveParticipants(model, context, token) {
            return this.saveParticipants.participate(model, context, token);
        }
        //#endregion
        canDispose(model) {
            // quick return if model already disposed or not dirty and not resolving
            if (model.isDisposed() ||
                (!this.mapResourceToPendingModelResolvers.has(model.resource) && !model.isDirty())) {
                return true;
            }
            // promise based return in all other cases
            return this.doCanDispose(model);
        }
        async doCanDispose(model) {
            // Await any pending resolves first before proceeding
            const pendingResolve = this.joinPendingResolves(model.resource);
            if (pendingResolve) {
                await pendingResolve;
                return this.canDispose(model);
            }
            // dirty model: we do not allow to dispose dirty models to prevent
            // data loss cases. dirty models can only be disposed when they are
            // either saved or reverted
            if (model.isDirty()) {
                await event_1.Event.toPromise(model.onDidChangeDirty);
                return this.canDispose(model);
            }
            return true;
        }
        dispose() {
            super.dispose();
            // model caches
            this.mapResourceToModel.clear();
            this.mapResourceToPendingModelResolvers.clear();
            // dispose the dispose listeners
            (0, lifecycle_1.dispose)(this.mapResourceToDisposeListener.values());
            this.mapResourceToDisposeListener.clear();
            // dispose the model change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToModelListeners.values());
            this.mapResourceToModelListeners.clear();
        }
    };
    exports.TextFileEditorModelManager = TextFileEditorModelManager;
    exports.TextFileEditorModelManager = TextFileEditorModelManager = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, files_1.IFileService),
        __param(2, notification_1.INotificationService),
        __param(3, workingCopyFileService_1.IWorkingCopyFileService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], TextFileEditorModelManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JNb2RlbE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS9jb21tb24vdGV4dEZpbGVFZGl0b3JNb2RlbE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0J6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBaUR6RCxJQUFJLE1BQU07WUFDVCxPQUFPLENBQUMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsWUFDd0Isb0JBQTRELEVBQ3JFLFdBQTBDLEVBQ2xDLG1CQUEwRCxFQUN2RCxzQkFBZ0UsRUFDcEUsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBTmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDakIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN0QywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ25ELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUF4RDdELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBdUIsQ0FBQyxDQUFDO1lBQzFFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFOUIsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF5QixDQUFDLENBQUM7WUFDN0UsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUVoQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFB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