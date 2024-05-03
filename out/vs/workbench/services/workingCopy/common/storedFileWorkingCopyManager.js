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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/base/common/map", "vs/base/common/async", "vs/platform/files/common/files", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/uri", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/base/common/resources", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/abstractFileWorkingCopyManager", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/platform", "vs/base/common/errors"], function (require, exports, nls_1, lifecycle_1, event_1, storedFileWorkingCopy_1, map_1, async_1, files_1, lifecycle_2, uri_1, label_1, log_1, resources_1, workingCopyFileService_1, uriIdentity_1, cancellation_1, workingCopyBackup_1, abstractFileWorkingCopyManager_1, notification_1, editorService_1, elevatedFileService_1, filesConfigurationService_1, workingCopyEditorService_1, workingCopyService_1, platform_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredFileWorkingCopyManager = void 0;
    let StoredFileWorkingCopyManager = class StoredFileWorkingCopyManager extends abstractFileWorkingCopyManager_1.BaseFileWorkingCopyManager {
        constructor(workingCopyTypeId, modelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService) {
            super(fileService, logService, workingCopyBackupService);
            this.workingCopyTypeId = workingCopyTypeId;
            this.modelFactory = modelFactory;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyService = workingCopyService;
            this.notificationService = notificationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.editorService = editorService;
            this.elevatedFileService = elevatedFileService;
            //#region Events
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
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
            this._onDidRemove = this._register(new event_1.Emitter());
            this.onDidRemove = this._onDidRemove.event;
            //#endregion
            this.mapResourceToWorkingCopyListeners = new map_1.ResourceMap();
            this.mapResourceToPendingWorkingCopyResolve = new map_1.ResourceMap();
            this.workingCopyResolveQueue = this._register(new async_1.ResourceQueue());
            //#endregion
            //#region Working Copy File Events
            this.mapCorrelationIdToWorkingCopiesToRestore = new Map();
            this.registerListeners();
        }
        registerListeners() {
            // Update working copies from file change events
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // File system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProviderCapabilities(e)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProviderRegistrations(e)));
            // Working copy operations
            this._register(this.workingCopyFileService.onWillRunWorkingCopyFileOperation(e => this.onWillRunWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidFailWorkingCopyFileOperation(e => this.onDidFailWorkingCopyFileOperation(e)));
            this._register(this.workingCopyFileService.onDidRunWorkingCopyFileOperation(e => this.onDidRunWorkingCopyFileOperation(e)));
            // Lifecycle
            if (platform_1.isWeb) {
                this._register(this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdownWeb(), 'veto.fileWorkingCopyManager')));
            }
            else {
                this._register(this.lifecycleService.onWillShutdown(event => event.join(this.onWillShutdownDesktop(), { id: 'join.fileWorkingCopyManager', label: (0, nls_1.localize)('join.fileWorkingCopyManager', "Saving working copies") })));
            }
        }
        onBeforeShutdownWeb() {
            if (this.workingCopies.some(workingCopy => workingCopy.hasState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */))) {
                // stored file working copies are pending to be saved:
                // veto because web does not support long running shutdown
                return true;
            }
            return false;
        }
        async onWillShutdownDesktop() {
            let pendingSavedWorkingCopies;
            // As long as stored file working copies are pending to be saved, we prolong the shutdown
            // until that has happened to ensure we are not shutting down in the middle of
            // writing to the working copy (https://github.com/microsoft/vscode/issues/116600).
            while ((pendingSavedWorkingCopies = this.workingCopies.filter(workingCopy => workingCopy.hasState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */))).length > 0) {
                await async_1.Promises.settled(pendingSavedWorkingCopies.map(workingCopy => workingCopy.joinState(2 /* StoredFileWorkingCopyState.PENDING_SAVE */)));
            }
        }
        //#region Resolve from file or file provider changes
        onDidChangeFileSystemProviderCapabilities(e) {
            // Resolve working copies again for file systems that changed
            // capabilities to fetch latest metadata (e.g. readonly)
            // into all working copies.
            this.queueWorkingCopyReloads(e.scheme);
        }
        onDidChangeFileSystemProviderRegistrations(e) {
            if (!e.added) {
                return; // only if added
            }
            // Resolve working copies again for file systems that registered
            // to account for capability changes: extensions may unregister
            // and register the same provider with different capabilities,
            // so we want to ensure to fetch latest metadata (e.g. readonly)
            // into all working copies.
            this.queueWorkingCopyReloads(e.scheme);
        }
        onDidFilesChange(e) {
            // Trigger a resolve for any update or add event that impacts
            // the working copy. We also consider the added event
            // because it could be that a file was added and updated
            // right after.
            this.queueWorkingCopyReloads(e);
        }
        queueWorkingCopyReloads(schemeOrEvent) {
            for (const workingCopy of this.workingCopies) {
                if (workingCopy.isDirty()) {
                    continue; // never reload dirty working copies
                }
                let resolveWorkingCopy = false;
                if (typeof schemeOrEvent === 'string') {
                    resolveWorkingCopy = schemeOrEvent === workingCopy.resource.scheme;
                }
                else {
                    resolveWorkingCopy = schemeOrEvent.contains(workingCopy.resource, 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */);
                }
                if (resolveWorkingCopy) {
                    this.queueWorkingCopyReload(workingCopy);
                }
            }
        }
        queueWorkingCopyReload(workingCopy) {
            // Resolves a working copy to update (use a queue to prevent accumulation of
            // resolve when the resolving actually takes long. At most we only want the
            // queue to have a size of 2 (1 running resolve and 1 queued resolve).
            const queueSize = this.workingCopyResolveQueue.queueSize(workingCopy.resource);
            if (queueSize <= 1) {
                this.workingCopyResolveQueue.queueFor(workingCopy.resource, async () => {
                    try {
                        await this.reload(workingCopy);
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                });
            }
        }
        onWillRunWorkingCopyFileOperation(e) {
            // Move / Copy: remember working copies to restore after the operation
            if (e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */) {
                e.waitUntil((async () => {
                    const workingCopiesToRestore = [];
                    for (const { source, target } of e.files) {
                        if (source) {
                            if (this.uriIdentityService.extUri.isEqual(source, target)) {
                                continue; // ignore if resources are considered equal
                            }
                            // Find all working copies that related to source (can be many if resource is a folder)
                            const sourceWorkingCopies = [];
                            for (const workingCopy of this.workingCopies) {
                                if (this.uriIdentityService.extUri.isEqualOrParent(workingCopy.resource, source)) {
                                    sourceWorkingCopies.push(workingCopy);
                                }
                            }
                            // Remember each source working copy to load again after move is done
                            // with optional content to restore if it was dirty
                            for (const sourceWorkingCopy of sourceWorkingCopies) {
                                const sourceResource = sourceWorkingCopy.resource;
                                // If the source is the actual working copy, just use target as new resource
                                let targetResource;
                                if (this.uriIdentityService.extUri.isEqual(sourceResource, source)) {
                                    targetResource = target;
                                }
                                // Otherwise a parent folder of the source is being moved, so we need
                                // to compute the target resource based on that
                                else {
                                    targetResource = (0, resources_1.joinPath)(target, sourceResource.path.substr(source.path.length + 1));
                                }
                                workingCopiesToRestore.push({
                                    source: sourceResource,
                                    target: targetResource,
                                    snapshot: sourceWorkingCopy.isDirty() ? await sourceWorkingCopy.model?.snapshot(cancellation_1.CancellationToken.None) : undefined
                                });
                            }
                        }
                    }
                    this.mapCorrelationIdToWorkingCopiesToRestore.set(e.correlationId, workingCopiesToRestore);
                })());
            }
        }
        onDidFailWorkingCopyFileOperation(e) {
            // Move / Copy: restore dirty flag on working copies to restore that were dirty
            if ((e.operation === 2 /* FileOperation.MOVE */ || e.operation === 3 /* FileOperation.COPY */)) {
                const workingCopiesToRestore = this.mapCorrelationIdToWorkingCopiesToRestore.get(e.correlationId);
                if (workingCopiesToRestore) {
                    this.mapCorrelationIdToWorkingCopiesToRestore.delete(e.correlationId);
                    for (const workingCopy of workingCopiesToRestore) {
                        // Snapshot presence means this working copy used to be modified and so we restore that
                        // flag. we do NOT have to restore the content because the working copy was only soft
                        // reverted and did not loose its original modified contents.
                        if (workingCopy.snapshot) {
                            this.get(workingCopy.source)?.markModified();
                        }
                    }
                }
            }
        }
        onDidRunWorkingCopyFileOperation(e) {
            switch (e.operation) {
                // Create: Revert existing working copies
                case 0 /* FileOperation.CREATE */:
                    e.waitUntil((async () => {
                        for (const { target } of e.files) {
                            const workingCopy = this.get(target);
                            if (workingCopy && !workingCopy.isDisposed()) {
                                await workingCopy.revert();
                            }
                        }
                    })());
                    break;
                // Move/Copy: restore working copies that were loaded before the operation took place
                case 2 /* FileOperation.MOVE */:
                case 3 /* FileOperation.COPY */:
                    e.waitUntil((async () => {
                        const workingCopiesToRestore = this.mapCorrelationIdToWorkingCopiesToRestore.get(e.correlationId);
                        if (workingCopiesToRestore) {
                            this.mapCorrelationIdToWorkingCopiesToRestore.delete(e.correlationId);
                            await async_1.Promises.settled(workingCopiesToRestore.map(async (workingCopyToRestore) => {
                                // Restore the working copy at the target. if we have previous dirty content, we pass it
                                // over to be used, otherwise we force a reload from disk. this is important
                                // because we know the file has changed on disk after the move and the working copy might
                                // have still existed with the previous state. this ensures that the working copy is not
                                // tracking a stale state.
                                await this.resolve(workingCopyToRestore.target, {
                                    reload: { async: false }, // enforce a reload
                                    contents: workingCopyToRestore.snapshot
                                });
                            }));
                        }
                    })());
                    break;
            }
        }
        //#endregion
        //#region Reload & Resolve
        async reload(workingCopy) {
            // Await a pending working copy resolve first before proceeding
            // to ensure that we never resolve a working copy more than once
            // in parallel.
            await this.joinPendingResolves(workingCopy.resource);
            if (workingCopy.isDirty() || workingCopy.isDisposed() || !this.has(workingCopy.resource)) {
                return; // the working copy possibly got dirty or disposed, so return early then
            }
            // Trigger reload
            await this.doResolve(workingCopy, { reload: { async: false } });
        }
        async resolve(resource, options) {
            // Await a pending working copy resolve first before proceeding
            // to ensure that we never resolve a working copy more than once
            // in parallel.
            const pendingResolve = this.joinPendingResolves(resource);
            if (pendingResolve) {
                await pendingResolve;
            }
            // Trigger resolve
            return this.doResolve(resource, options);
        }
        async doResolve(resourceOrWorkingCopy, options) {
            let workingCopy;
            let resource;
            if (uri_1.URI.isUri(resourceOrWorkingCopy)) {
                resource = resourceOrWorkingCopy;
                workingCopy = this.get(resource);
            }
            else {
                resource = resourceOrWorkingCopy.resource;
                workingCopy = resourceOrWorkingCopy;
            }
            let workingCopyResolve;
            let didCreateWorkingCopy = false;
            const resolveOptions = {
                contents: options?.contents,
                forceReadFromFile: options?.reload?.force,
                limits: options?.limits
            };
            // Working copy exists
            if (workingCopy) {
                // Always reload if contents are provided
                if (options?.contents) {
                    workingCopyResolve = workingCopy.resolve(resolveOptions);
                }
                // Reload async or sync based on options
                else if (options?.reload) {
                    // Async reload: trigger a reload but return immediately
                    if (options.reload.async) {
                        workingCopyResolve = Promise.resolve();
                        (async () => {
                            try {
                                await workingCopy.resolve(resolveOptions);
                            }
                            catch (error) {
                                (0, errors_1.onUnexpectedError)(error);
                            }
                        })();
                    }
                    // Sync reload: do not return until working copy reloaded
                    else {
                        workingCopyResolve = workingCopy.resolve(resolveOptions);
                    }
                }
                // Do not reload
                else {
                    workingCopyResolve = Promise.resolve();
                }
            }
            // Stored file working copy does not exist
            else {
                didCreateWorkingCopy = true;
                workingCopy = new storedFileWorkingCopy_1.StoredFileWorkingCopy(this.workingCopyTypeId, resource, this.labelService.getUriBasenameLabel(resource), this.modelFactory, async (options) => { await this.resolve(resource, { ...options, reload: { async: false } }); }, this.fileService, this.logService, this.workingCopyFileService, this.filesConfigurationService, this.workingCopyBackupService, this.workingCopyService, this.notificationService, this.workingCopyEditorService, this.editorService, this.elevatedFileService);
                workingCopyResolve = workingCopy.resolve(resolveOptions);
                this.registerWorkingCopy(workingCopy);
            }
            // Store pending resolve to avoid race conditions
            this.mapResourceToPendingWorkingCopyResolve.set(resource, workingCopyResolve);
            // Make known to manager (if not already known)
            this.add(resource, workingCopy);
            // Emit some events if we created the working copy
            if (didCreateWorkingCopy) {
                // If the working copy is dirty right from the beginning,
                // make sure to emit this as an event
                if (workingCopy.isDirty()) {
                    this._onDidChangeDirty.fire(workingCopy);
                }
            }
            try {
                await workingCopyResolve;
            }
            catch (error) {
                // Automatically dispose the working copy if we created
                // it because we cannot dispose a working copy we do not
                // own (https://github.com/microsoft/vscode/issues/138850)
                if (didCreateWorkingCopy) {
                    workingCopy.dispose();
                }
                throw error;
            }
            finally {
                // Remove from pending resolves
                this.mapResourceToPendingWorkingCopyResolve.delete(resource);
            }
            // Stored file working copy can be dirty if a backup was restored, so we make sure to
            // have this event delivered if we created the working copy here
            if (didCreateWorkingCopy && workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
            return workingCopy;
        }
        joinPendingResolves(resource) {
            const pendingWorkingCopyResolve = this.mapResourceToPendingWorkingCopyResolve.get(resource);
            if (!pendingWorkingCopyResolve) {
                return;
            }
            return this.doJoinPendingResolves(resource);
        }
        async doJoinPendingResolves(resource) {
            // While we have pending working copy resolves, ensure
            // to await the last one finishing before returning.
            // This prevents a race when multiple clients await
            // the pending resolve and then all trigger the resolve
            // at the same time.
            let currentWorkingCopyResolve;
            while (this.mapResourceToPendingWorkingCopyResolve.has(resource)) {
                const nextPendingWorkingCopyResolve = this.mapResourceToPendingWorkingCopyResolve.get(resource);
                if (nextPendingWorkingCopyResolve === currentWorkingCopyResolve) {
                    return; // already awaited on - return
                }
                currentWorkingCopyResolve = nextPendingWorkingCopyResolve;
                try {
                    await nextPendingWorkingCopyResolve;
                }
                catch (error) {
                    // ignore any error here, it will bubble to the original requestor
                }
            }
        }
        registerWorkingCopy(workingCopy) {
            // Install working copy listeners
            const workingCopyListeners = new lifecycle_1.DisposableStore();
            workingCopyListeners.add(workingCopy.onDidResolve(() => this._onDidResolve.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeReadonly(() => this._onDidChangeReadonly.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidChangeOrphaned(() => this._onDidChangeOrphaned.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidSaveError(() => this._onDidSaveError.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onDidSave(e => this._onDidSave.fire({ workingCopy, ...e })));
            workingCopyListeners.add(workingCopy.onDidRevert(() => this._onDidRevert.fire(workingCopy)));
            // Keep for disposal
            this.mapResourceToWorkingCopyListeners.set(workingCopy.resource, workingCopyListeners);
        }
        remove(resource) {
            const removed = super.remove(resource);
            // Dispose any existing working copy listeners
            const workingCopyListener = this.mapResourceToWorkingCopyListeners.get(resource);
            if (workingCopyListener) {
                (0, lifecycle_1.dispose)(workingCopyListener);
                this.mapResourceToWorkingCopyListeners.delete(resource);
            }
            if (removed) {
                this._onDidRemove.fire(resource);
            }
            return removed;
        }
        //#endregion
        //#region Lifecycle
        canDispose(workingCopy) {
            // Quick return if working copy already disposed or not dirty and not resolving
            if (workingCopy.isDisposed() ||
                (!this.mapResourceToPendingWorkingCopyResolve.has(workingCopy.resource) && !workingCopy.isDirty())) {
                return true;
            }
            // Promise based return in all other cases
            return this.doCanDispose(workingCopy);
        }
        async doCanDispose(workingCopy) {
            // Await any pending resolves first before proceeding
            const pendingResolve = this.joinPendingResolves(workingCopy.resource);
            if (pendingResolve) {
                await pendingResolve;
                return this.canDispose(workingCopy);
            }
            // Dirty working copy: we do not allow to dispose dirty working copys
            // to prevent data loss cases. dirty working copys can only be disposed when
            // they are either saved or reverted
            if (workingCopy.isDirty()) {
                await event_1.Event.toPromise(workingCopy.onDidChangeDirty);
                return this.canDispose(workingCopy);
            }
            return true;
        }
        dispose() {
            super.dispose();
            // Clear pending working copy resolves
            this.mapResourceToPendingWorkingCopyResolve.clear();
            // Dispose the working copy change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopyListeners.values());
            this.mapResourceToWorkingCopyListeners.clear();
        }
    };
    exports.StoredFileWorkingCopyManager = StoredFileWorkingCopyManager;
    exports.StoredFileWorkingCopyManager = StoredFileWorkingCopyManager = __decorate([
        __param(2, files_1.IFileService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, workingCopyFileService_1.IWorkingCopyFileService),
        __param(7, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, notification_1.INotificationService),
        __param(12, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(13, editorService_1.IEditorService),
        __param(14, elevatedFileService_1.IElevatedFileService)
    ], StoredFileWorkingCopyManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkRmlsZVdvcmtpbmdDb3B5TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi9zdG9yZWRGaWxlV29ya2luZ0NvcHlNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNJekYsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBb0UsU0FBUSwyREFBd0Q7UUFtQ2hKLFlBQ2tCLGlCQUF5QixFQUN6QixZQUFtRCxFQUN0RCxXQUF5QixFQUNwQixnQkFBb0QsRUFDeEQsWUFBNEMsRUFDOUMsVUFBdUIsRUFDWCxzQkFBZ0UsRUFDOUQsd0JBQW1ELEVBQ3pELGtCQUF3RCxFQUNqRCx5QkFBc0UsRUFDN0Usa0JBQXdELEVBQ3ZELG1CQUEwRCxFQUNyRCx3QkFBb0UsRUFDL0UsYUFBOEMsRUFDeEMsbUJBQTBEO1lBRWhGLEtBQUssQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLHdCQUF3QixDQUFDLENBQUM7WUFoQnhDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUN6QixpQkFBWSxHQUFaLFlBQVksQ0FBdUM7WUFFaEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN2QyxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUVqQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBRW5ELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDaEMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtZQUM1RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3RDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDcEMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQUM5RCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7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