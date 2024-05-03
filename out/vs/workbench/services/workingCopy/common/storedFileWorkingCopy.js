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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/cancellation", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/async", "vs/platform/log/common/log", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/notification/common/notification", "vs/base/common/hash", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/workingCopy/common/resourceWorkingCopy"], function (require, exports, nls_1, event_1, cancellation_1, files_1, workingCopyService_1, async_1, log_1, types_1, workingCopyFileService_1, filesConfigurationService_1, workingCopyBackup_1, notification_1, hash_1, errorMessage_1, actions_1, platform_1, workingCopyEditorService_1, editorService_1, elevatedFileService_1, resourceWorkingCopy_1) {
    "use strict";
    var StoredFileWorkingCopy_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredFileWorkingCopy = exports.StoredFileWorkingCopyState = void 0;
    exports.isStoredFileWorkingCopySaveEvent = isStoredFileWorkingCopySaveEvent;
    /**
     * States the stored file working copy can be in.
     */
    var StoredFileWorkingCopyState;
    (function (StoredFileWorkingCopyState) {
        /**
         * A stored file working copy is saved.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["SAVED"] = 0] = "SAVED";
        /**
         * A stored file working copy is dirty.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["DIRTY"] = 1] = "DIRTY";
        /**
         * A stored file working copy is currently being saved but
         * this operation has not completed yet.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["PENDING_SAVE"] = 2] = "PENDING_SAVE";
        /**
         * A stored file working copy is in conflict mode when changes
         * cannot be saved because the underlying file has changed.
         * Stored file working copies in conflict mode are always dirty.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["CONFLICT"] = 3] = "CONFLICT";
        /**
         * A stored file working copy is in orphan state when the underlying
         * file has been deleted.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["ORPHAN"] = 4] = "ORPHAN";
        /**
         * Any error that happens during a save that is not causing
         * the `StoredFileWorkingCopyState.CONFLICT` state.
         * Stored file working copies in error mode are always dirty.
         */
        StoredFileWorkingCopyState[StoredFileWorkingCopyState["ERROR"] = 5] = "ERROR";
    })(StoredFileWorkingCopyState || (exports.StoredFileWorkingCopyState = StoredFileWorkingCopyState = {}));
    function isStoredFileWorkingCopySaveEvent(e) {
        const candidate = e;
        return !!candidate.stat;
    }
    let StoredFileWorkingCopy = class StoredFileWorkingCopy extends resourceWorkingCopy_1.ResourceWorkingCopy {
        static { StoredFileWorkingCopy_1 = this; }
        get model() { return this._model; }
        //#endregion
        constructor(typeId, resource, name, modelFactory, externalResolver, fileService, logService, workingCopyFileService, filesConfigurationService, workingCopyBackupService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService) {
            super(resource, fileService);
            this.typeId = typeId;
            this.name = name;
            this.modelFactory = modelFactory;
            this.externalResolver = externalResolver;
            this.logService = logService;
            this.workingCopyFileService = workingCopyFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.notificationService = notificationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.editorService = editorService;
            this.elevatedFileService = elevatedFileService;
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this._model = undefined;
            //#region events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidResolve = this._register(new event_1.Emitter());
            this.onDidResolve = this._onDidResolve.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSaveError = this._register(new event_1.Emitter());
            this.onDidSaveError = this._onDidSaveError.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onDidChangeReadonly = this._register(new event_1.Emitter());
            this.onDidChangeReadonly = this._onDidChangeReadonly.event;
            //#region Dirty
            this.dirty = false;
            this.ignoreDirtyOnModelContentChange = false;
            //#endregion
            //#region Save
            this.versionId = 0;
            this.lastContentChangeFromUndoRedo = undefined;
            this.saveSequentializer = new async_1.TaskSequentializer();
            this.ignoreSaveFromSaveParticipants = false;
            //#endregion
            //#region State
            this.inConflictMode = false;
            this.inErrorMode = false;
            // Make known to working copy service
            this._register(workingCopyService.registerWorkingCopy(this));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.filesConfigurationService.onDidChangeReadonly(() => this._onDidChangeReadonly.fire()));
        }
        isDirty() {
            return this.dirty;
        }
        markModified() {
            this.setDirty(true); // stored file working copy tracks modified via dirty
        }
        setDirty(dirty) {
            if (!this.isResolved()) {
                return; // only resolved working copies can be marked dirty
            }
            // Track dirty state and version id
            const wasDirty = this.dirty;
            this.doSetDirty(dirty);
            // Emit as Event if dirty changed
            if (dirty !== wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        doSetDirty(dirty) {
            const wasDirty = this.dirty;
            const wasInConflictMode = this.inConflictMode;
            const wasInErrorMode = this.inErrorMode;
            const oldSavedVersionId = this.savedVersionId;
            if (!dirty) {
                this.dirty = false;
                this.inConflictMode = false;
                this.inErrorMode = false;
                // we remember the models alternate version id to remember when the version
                // of the model matches with the saved version on disk. we need to keep this
                // in order to find out if the model changed back to a saved version (e.g.
                // when undoing long enough to reach to a version that is saved and then to
                // clear the dirty flag)
                if (this.isResolved()) {
                    this.savedVersionId = this.model.versionId;
                }
            }
            else {
                this.dirty = true;
            }
            // Return function to revert this call
            return () => {
                this.dirty = wasDirty;
                this.inConflictMode = wasInConflictMode;
                this.inErrorMode = wasInErrorMode;
                this.savedVersionId = oldSavedVersionId;
            };
        }
        isResolved() {
            return !!this.model;
        }
        async resolve(options) {
            this.trace('resolve() - enter');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolve() - exit - without resolving because file working copy is disposed');
                return;
            }
            // Unless there are explicit contents provided, it is important that we do not
            // resolve a working copy that is dirty or is in the process of saving to prevent
            // data loss.
            if (!options?.contents && (this.dirty || this.saveSequentializer.isRunning())) {
                this.trace('resolve() - exit - without resolving because file working copy is dirty or being saved');
                return;
            }
            return this.doResolve(options);
        }
        async doResolve(options) {
            // First check if we have contents to use for the working copy
            if (options?.contents) {
                return this.resolveFromBuffer(options.contents);
            }
            // Second, check if we have a backup to resolve from (only for new working copies)
            const isNew = !this.isResolved();
            if (isNew) {
                const resolvedFromBackup = await this.resolveFromBackup();
                if (resolvedFromBackup) {
                    return;
                }
            }
            // Finally, resolve from file resource
            return this.resolveFromFile(options);
        }
        async resolveFromBuffer(buffer) {
            this.trace('resolveFromBuffer()');
            // Try to resolve metdata from disk
            let mtime;
            let ctime;
            let size;
            let etag;
            try {
                const metadata = await this.fileService.stat(this.resource);
                mtime = metadata.mtime;
                ctime = metadata.ctime;
                size = metadata.size;
                etag = metadata.etag;
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
            }
            catch (error) {
                // Put some fallback values in error case
                mtime = Date.now();
                ctime = Date.now();
                size = 0;
                etag = files_1.ETAG_DISABLED;
                // Apply orphaned state based on error code
                this.setOrphaned(error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            // Resolve with buffer
            return this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime,
                ctime,
                size,
                etag,
                value: buffer,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from buffer) */);
        }
        async resolveFromBackup() {
            // Resolve backup if any
            const backup = await this.workingCopyBackupService.resolve(this);
            // Abort if someone else managed to resolve the working copy by now
            const isNew = !this.isResolved();
            if (!isNew) {
                this.trace('resolveFromBackup() - exit - withoutresolving because previously new file working copy got created meanwhile');
                return true; // imply that resolving has happened in another operation
            }
            // Try to resolve from backup if we have any
            if (backup) {
                await this.doResolveFromBackup(backup);
                return true;
            }
            // Otherwise signal back that resolving did not happen
            return false;
        }
        async doResolveFromBackup(backup) {
            this.trace('doResolveFromBackup()');
            // Resolve with backup
            await this.resolveFromContent({
                resource: this.resource,
                name: this.name,
                mtime: backup.meta ? backup.meta.mtime : Date.now(),
                ctime: backup.meta ? backup.meta.ctime : Date.now(),
                size: backup.meta ? backup.meta.size : 0,
                etag: backup.meta ? backup.meta.etag : files_1.ETAG_DISABLED, // etag disabled if unknown!
                value: backup.value,
                readonly: false,
                locked: false
            }, true /* dirty (resolved from backup) */);
            // Restore orphaned flag based on state
            if (backup.meta && backup.meta.orphaned) {
                this.setOrphaned(true);
            }
        }
        async resolveFromFile(options) {
            this.trace('resolveFromFile()');
            const forceReadFromFile = options?.forceReadFromFile;
            // Decide on etag
            let etag;
            if (forceReadFromFile) {
                etag = files_1.ETAG_DISABLED; // disable ETag if we enforce to read from disk
            }
            else if (this.lastResolvedFileStat) {
                etag = this.lastResolvedFileStat.etag; // otherwise respect etag to support caching
            }
            // Remember current version before doing any long running operation
            // to ensure we are not changing a working copy that was changed
            // meanwhile
            const currentVersionId = this.versionId;
            // Resolve Content
            try {
                const content = await this.fileService.readFileStream(this.resource, {
                    etag,
                    limits: options?.limits
                });
                // Clear orphaned state when resolving was successful
                this.setOrphaned(false);
                // Return early if the working copy content has changed
                // meanwhile to prevent loosing any changes
                if (currentVersionId !== this.versionId) {
                    this.trace('resolveFromFile() - exit - without resolving because file working copy content changed');
                    return;
                }
                await this.resolveFromContent(content, false /* not dirty (resolved from file) */);
            }
            catch (error) {
                const result = error.fileOperationResult;
                // Apply orphaned state based on error code
                this.setOrphaned(result === 1 /* FileOperationResult.FILE_NOT_FOUND */);
                // NotModified status is expected and can be handled gracefully
                // if we are resolved. We still want to update our last resolved
                // stat to e.g. detect changes to the file's readonly state
                if (this.isResolved() && result === 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */) {
                    if (error instanceof files_1.NotModifiedSinceFileOperationError) {
                        this.updateLastResolvedFileStat(error.stat);
                    }
                    return;
                }
                // Unless we are forced to read from the file, ignore when a working copy has
                // been resolved once and the file was deleted meanwhile. Since we already have
                // the working copy resolved, we can return to this state and update the orphaned
                // flag to indicate that this working copy has no version on disk anymore.
                if (this.isResolved() && result === 1 /* FileOperationResult.FILE_NOT_FOUND */ && !forceReadFromFile) {
                    return;
                }
                // Otherwise bubble up the error
                throw error;
            }
        }
        async resolveFromContent(content, dirty) {
            this.trace('resolveFromContent() - enter');
            // Return early if we are disposed
            if (this.isDisposed()) {
                this.trace('resolveFromContent() - exit - because working copy is disposed');
                return;
            }
            // Update our resolved disk stat
            this.updateLastResolvedFileStat({
                resource: this.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                size: content.size,
                etag: content.etag,
                readonly: content.readonly,
                locked: content.locked,
                isFile: true,
                isDirectory: false,
                isSymbolicLink: false,
                children: undefined
            });
            // Update existing model if we had been resolved
            if (this.isResolved()) {
                await this.doUpdateModel(content.value);
            }
            // Create new model otherwise
            else {
                await this.doCreateModel(content.value);
            }
            // Update working copy dirty flag. This is very important to call
            // in both cases of dirty or not because it conditionally updates
            // the `savedVersionId` to determine the version when to consider
            // the working copy as saved again (e.g. when undoing back to the
            // saved state)
            this.setDirty(!!dirty);
            // Emit as event
            this._onDidResolve.fire();
        }
        async doCreateModel(contents) {
            this.trace('doCreateModel()');
            // Create model and dispose it when we get disposed
            this._model = this._register(await this.modelFactory.createModel(this.resource, contents, cancellation_1.CancellationToken.None));
            // Model listeners
            this.installModelListeners(this._model);
        }
        async doUpdateModel(contents) {
            this.trace('doUpdateModel()');
            // Update model value in a block that ignores content change events for dirty tracking
            this.ignoreDirtyOnModelContentChange = true;
            try {
                await this.model?.update(contents, cancellation_1.CancellationToken.None);
            }
            finally {
                this.ignoreDirtyOnModelContentChange = false;
            }
        }
        installModelListeners(model) {
            // See https://github.com/microsoft/vscode/issues/30189
            // This code has been extracted to a different method because it caused a memory leak
            // where `value` was captured in the content change listener closure scope.
            // Content Change
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(model, e.isUndoing || e.isRedoing)));
            // Lifecycle
            this._register(model.onWillDispose(() => this.dispose()));
        }
        onModelContentChanged(model, isUndoingOrRedoing) {
            this.trace(`onModelContentChanged() - enter`);
            // In any case increment the version id because it tracks the content state of the model at all times
            this.versionId++;
            this.trace(`onModelContentChanged() - new versionId ${this.versionId}`);
            // Remember when the user changed the model through a undo/redo operation.
            // We need this information to throttle save participants to fix
            // https://github.com/microsoft/vscode/issues/102542
            if (isUndoingOrRedoing) {
                this.lastContentChangeFromUndoRedo = Date.now();
            }
            // We mark check for a dirty-state change upon model content change, unless:
            // - explicitly instructed to ignore it (e.g. from model.resolve())
            // - the model is readonly (in that case we never assume the change was done by the user)
            if (!this.ignoreDirtyOnModelContentChange && !this.isReadonly()) {
                // The contents changed as a matter of Undo and the version reached matches the saved one
                // In this case we clear the dirty flag and emit a SAVED event to indicate this state.
                if (model.versionId === this.savedVersionId) {
                    this.trace('onModelContentChanged() - model content changed back to last saved version');
                    // Clear flags
                    const wasDirty = this.dirty;
                    this.setDirty(false);
                    // Emit revert event if we were dirty
                    if (wasDirty) {
                        this._onDidRevert.fire();
                    }
                }
                // Otherwise the content has changed and we signal this as becoming dirty
                else {
                    this.trace('onModelContentChanged() - model content changed and marked as dirty');
                    // Mark as dirty
                    this.setDirty(true);
                }
            }
            // Emit as event
            this._onDidChangeContent.fire();
        }
        async forceResolveFromFile() {
            if (this.isDisposed()) {
                return; // return early when the working copy is invalid
            }
            // We go through the resolver to make
            // sure this kind of `resolve` is properly
            // running in sequence with any other running
            // `resolve` if any, including subsequent runs
            // that are triggered right after.
            await this.externalResolver({
                forceReadFromFile: true
            });
        }
        //#endregion
        //#region Backup
        get backupDelay() {
            return this.model?.configuration?.backupDelay;
        }
        async backup(token) {
            // Fill in metadata if we are resolved
            let meta = undefined;
            if (this.lastResolvedFileStat) {
                meta = {
                    mtime: this.lastResolvedFileStat.mtime,
                    ctime: this.lastResolvedFileStat.ctime,
                    size: this.lastResolvedFileStat.size,
                    etag: this.lastResolvedFileStat.etag,
                    orphaned: this.isOrphaned()
                };
            }
            // Fill in content if we are resolved
            let content = undefined;
            if (this.isResolved()) {
                content = await (0, async_1.raceCancellation)(this.model.snapshot(token), token);
            }
            return { meta, content };
        }
        static { this.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD = 500; }
        async save(options = Object.create(null)) {
            if (!this.isResolved()) {
                return false;
            }
            if (this.isReadonly()) {
                this.trace('save() - ignoring request for readonly resource');
                return false; // if working copy is readonly we do not attempt to save at all
            }
            if ((this.hasState(3 /* StoredFileWorkingCopyState.CONFLICT */) || this.hasState(5 /* StoredFileWorkingCopyState.ERROR */)) &&
                (options.reason === 2 /* SaveReason.AUTO */ || options.reason === 3 /* SaveReason.FOCUS_CHANGE */ || options.reason === 4 /* SaveReason.WINDOW_CHANGE */)) {
                this.trace('save() - ignoring auto save request for file working copy that is in conflict or error');
                return false; // if working copy is in save conflict or error, do not save unless save reason is explicit
            }
            // Actually do save
            this.trace('save() - enter');
            await this.doSave(options);
            this.trace('save() - exit');
            return this.hasState(0 /* StoredFileWorkingCopyState.SAVED */);
        }
        async doSave(options) {
            if (typeof options.reason !== 'number') {
                options.reason = 1 /* SaveReason.EXPLICIT */;
            }
            let versionId = this.versionId;
            this.trace(`doSave(${versionId}) - enter with versionId ${versionId}`);
            // Return early if saved from within save participant to break recursion
            //
            // Scenario: a save participant triggers a save() on the working copy
            if (this.ignoreSaveFromSaveParticipants) {
                this.trace(`doSave(${versionId}) - exit - refusing to save() recursively from save participant`);
                return;
            }
            // Lookup any running save for this versionId and return it if found
            //
            // Scenario: user invoked the save action multiple times quickly for the same contents
            //           while the save was not yet finished to disk
            //
            if (this.saveSequentializer.isRunning(versionId)) {
                this.trace(`doSave(${versionId}) - exit - found a running save for versionId ${versionId}`);
                return this.saveSequentializer.running;
            }
            // Return early if not dirty (unless forced)
            //
            // Scenario: user invoked save action even though the working copy is not dirty
            if (!options.force && !this.dirty) {
                this.trace(`doSave(${versionId}) - exit - because not dirty and/or versionId is different (this.isDirty: ${this.dirty}, this.versionId: ${this.versionId})`);
                return;
            }
            // Return if currently saving by storing this save request as the next save that should happen.
            // Never ever must 2 saves execute at the same time because this can lead to dirty writes and race conditions.
            //
            // Scenario A: auto save was triggered and is currently busy saving to disk. this takes long enough that another auto save
            //             kicks in.
            // Scenario B: save is very slow (e.g. network share) and the user manages to change the working copy and trigger another save
            //             while the first save has not returned yet.
            //
            if (this.saveSequentializer.isRunning()) {
                this.trace(`doSave(${versionId}) - exit - because busy saving`);
                // Indicate to the save sequentializer that we want to
                // cancel the running operation so that ours can run
                // before the running one finishes.
                // Currently this will try to cancel running save
                // participants and running snapshots from the
                // save operation, but not the actual save which does
                // not support cancellation yet.
                this.saveSequentializer.cancelRunning();
                // Queue this as the upcoming save and return
                return this.saveSequentializer.queue(() => this.doSave(options));
            }
            // Push all edit operations to the undo stack so that the user has a chance to
            // Ctrl+Z back to the saved version.
            if (this.isResolved()) {
                this.model.pushStackElement();
            }
            const saveCancellation = new cancellation_1.CancellationTokenSource();
            return this.saveSequentializer.run(versionId, (async () => {
                // A save participant can still change the working copy now
                // and since we are so close to saving we do not want to trigger
                // another auto save or similar, so we block this
                // In addition we update our version right after in case it changed
                // because of a working copy change
                // Save participants can also be skipped through API.
                if (this.isResolved() && !options.skipSaveParticipants && this.workingCopyFileService.hasSaveParticipants) {
                    try {
                        // Measure the time it took from the last undo/redo operation to this save. If this
                        // time is below `UNDO_REDO_SAVE_PARTICIPANTS_THROTTLE_THRESHOLD`, we make sure to
                        // delay the save participant for the remaining time if the reason is auto save.
                        //
                        // This fixes the following issue:
                        // - the user has configured auto save with delay of 100ms or shorter
                        // - the user has a save participant enabled that modifies the file on each save
                        // - the user types into the file and the file gets saved
                        // - the user triggers undo operation
                        // - this will undo the save participant change but trigger the save participant right after
                        // - the user has no chance to undo over the save participant
                        //
                        // Reported as: https://github.com/microsoft/vscode/issues/102542
                        if (options.reason === 2 /* SaveReason.AUTO */ && typeof this.lastContentChangeFromUndoRedo === 'number') {
                            const timeFromUndoRedoToSave = Date.now() - this.lastContentChangeFromUndoRedo;
                            if (timeFromUndoRedoToSave < StoredFileWorkingCopy_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD) {
                                await (0, async_1.timeout)(StoredFileWorkingCopy_1.UNDO_REDO_SAVE_PARTICIPANTS_AUTO_SAVE_THROTTLE_THRESHOLD - timeFromUndoRedoToSave);
                            }
                        }
                        // Run save participants unless save was cancelled meanwhile
                        if (!saveCancellation.token.isCancellationRequested) {
                            this.ignoreSaveFromSaveParticipants = true;
                            try {
                                await this.workingCopyFileService.runSaveParticipants(this, { reason: options.reason ?? 1 /* SaveReason.EXPLICIT */, savedFrom: options.from }, saveCancellation.token);
                            }
                            finally {
                                this.ignoreSaveFromSaveParticipants = false;
                            }
                        }
                    }
                    catch (error) {
                        this.logService.error(`[stored file working copy] runSaveParticipants(${versionId}) - resulted in an error: ${error.toString()}`, this.resource.toString(), this.typeId);
                    }
                }
                // It is possible that a subsequent save is cancelling this
                // running save. As such we return early when we detect that.
                if (saveCancellation.token.isCancellationRequested) {
                    return;
                }
                // We have to protect against being disposed at this point. It could be that the save() operation
                // was triggerd followed by a dispose() operation right after without waiting. Typically we cannot
                // be disposed if we are dirty, but if we are not dirty, save() and dispose() can still be triggered
                // one after the other without waiting for the save() to complete. If we are disposed(), we risk
                // saving contents to disk that are stale (see https://github.com/microsoft/vscode/issues/50942).
                // To fix this issue, we will not store the contents to disk when we got disposed.
                if (this.isDisposed()) {
                    return;
                }
                // We require a resolved working copy from this point on, since we are about to write data to disk.
                if (!this.isResolved()) {
                    return;
                }
                // update versionId with its new value (if pre-save changes happened)
                versionId = this.versionId;
                // Clear error flag since we are trying to save again
                this.inErrorMode = false;
                // Save to Disk. We mark the save operation as currently running with
                // the latest versionId because it might have changed from a save
                // participant triggering
                this.trace(`doSave(${versionId}) - before write()`);
                const lastResolvedFileStat = (0, types_1.assertIsDefined)(this.lastResolvedFileStat);
                const resolvedFileWorkingCopy = this;
                return this.saveSequentializer.run(versionId, (async () => {
                    try {
                        const writeFileOptions = {
                            mtime: lastResolvedFileStat.mtime,
                            etag: (options.ignoreModifiedSince || !this.filesConfigurationService.preventSaveConflicts(lastResolvedFileStat.resource)) ? files_1.ETAG_DISABLED : lastResolvedFileStat.etag,
                            unlock: options.writeUnlock
                        };
                        let stat;
                        // Delegate to working copy model save method if any
                        if (typeof resolvedFileWorkingCopy.model.save === 'function') {
                            stat = await resolvedFileWorkingCopy.model.save(writeFileOptions, saveCancellation.token);
                        }
                        // Otherwise ask for a snapshot and save via file services
                        else {
                            // Snapshot working copy model contents
                            const snapshot = await (0, async_1.raceCancellation)(resolvedFileWorkingCopy.model.snapshot(saveCancellation.token), saveCancellation.token);
                            // It is possible that a subsequent save is cancelling this
                            // running save. As such we return early when we detect that
                            // However, we do not pass the token into the file service
                            // because that is an atomic operation currently without
                            // cancellation support, so we dispose the cancellation if
                            // it was not cancelled yet.
                            if (saveCancellation.token.isCancellationRequested) {
                                return;
                            }
                            else {
                                saveCancellation.dispose();
                            }
                            // Write them to disk
                            if (options?.writeElevated && this.elevatedFileService.isSupported(lastResolvedFileStat.resource)) {
                                stat = await this.elevatedFileService.writeFileElevated(lastResolvedFileStat.resource, (0, types_1.assertIsDefined)(snapshot), writeFileOptions);
                            }
                            else {
                                stat = await this.fileService.writeFile(lastResolvedFileStat.resource, (0, types_1.assertIsDefined)(snapshot), writeFileOptions);
                            }
                        }
                        this.handleSaveSuccess(stat, versionId, options);
                    }
                    catch (error) {
                        this.handleSaveError(error, versionId, options);
                    }
                })(), () => saveCancellation.cancel());
            })(), () => saveCancellation.cancel());
        }
        handleSaveSuccess(stat, versionId, options) {
            // Updated resolved stat with updated stat
            this.updateLastResolvedFileStat(stat);
            // Update dirty state unless working copy has changed meanwhile
            if (versionId === this.versionId) {
                this.trace(`handleSaveSuccess(${versionId}) - setting dirty to false because versionId did not change`);
                this.setDirty(false);
            }
            else {
                this.trace(`handleSaveSuccess(${versionId}) - not setting dirty to false because versionId did change meanwhile`);
            }
            // Update orphan state given save was successful
            this.setOrphaned(false);
            // Emit Save Event
            this._onDidSave.fire({ reason: options.reason, stat, source: options.source });
        }
        handleSaveError(error, versionId, options) {
            (options.ignoreErrorHandler ? this.logService.trace : this.logService.error).apply(this.logService, [`[stored file working copy] handleSaveError(${versionId}) - exit - resulted in a save error: ${error.toString()}`, this.resource.toString(), this.typeId]);
            // Return early if the save() call was made asking to
            // handle the save error itself.
            if (options.ignoreErrorHandler) {
                throw error;
            }
            // In any case of an error, we mark the working copy as dirty to prevent data loss
            // It could be possible that the write corrupted the file on disk (e.g. when
            // an error happened after truncating the file) and as such we want to preserve
            // the working copy contents to prevent data loss.
            this.setDirty(true);
            // Flag as error state
            this.inErrorMode = true;
            // Look out for a save conflict
            if (error.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                this.inConflictMode = true;
            }
            // Show save error to user for handling
            this.doHandleSaveError(error, options);
            // Emit as event
            this._onDidSaveError.fire();
        }
        doHandleSaveError(error, options) {
            const fileOperationError = error;
            const primaryActions = [];
            let message;
            // Dirty write prevention
            if (fileOperationError.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */) {
                message = (0, nls_1.localize)('staleSaveError', "Failed to save '{0}': The content of the file is newer. Do you want to overwrite the file with your changes?", this.name);
                primaryActions.push((0, actions_1.toAction)({ id: 'fileWorkingCopy.overwrite', label: (0, nls_1.localize)('overwrite', "Overwrite"), run: () => this.save({ ...options, ignoreModifiedSince: true, reason: 1 /* SaveReason.EXPLICIT */ }) }));
                primaryActions.push((0, actions_1.toAction)({ id: 'fileWorkingCopy.revert', label: (0, nls_1.localize)('discard', "Discard"), run: () => this.revert() }));
            }
            // Any other save error
            else {
                const isWriteLocked = fileOperationError.fileOperationResult === 5 /* FileOperationResult.FILE_WRITE_LOCKED */;
                const triedToUnlock = isWriteLocked && fileOperationError.options?.unlock;
                const isPermissionDenied = fileOperationError.fileOperationResult === 6 /* FileOperationResult.FILE_PERMISSION_DENIED */;
                const canSaveElevated = this.elevatedFileService.isSupported(this.resource);
                // Error with Actions
                if ((0, errorMessage_1.isErrorWithActions)(error)) {
                    primaryActions.push(...error.actions);
                }
                // Save Elevated
                if (canSaveElevated && (isPermissionDenied || triedToUnlock)) {
                    primaryActions.push((0, actions_1.toAction)({
                        id: 'fileWorkingCopy.saveElevated',
                        label: triedToUnlock ?
                            platform_1.isWindows ? (0, nls_1.localize)('overwriteElevated', "Overwrite as Admin...") : (0, nls_1.localize)('overwriteElevatedSudo', "Overwrite as Sudo...") :
                            platform_1.isWindows ? (0, nls_1.localize)('saveElevated', "Retry as Admin...") : (0, nls_1.localize)('saveElevatedSudo', "Retry as Sudo..."),
                        run: () => {
                            this.save({ ...options, writeElevated: true, writeUnlock: triedToUnlock, reason: 1 /* SaveReason.EXPLICIT */ });
                        }
                    }));
                }
                // Unlock
                else if (isWriteLocked) {
                    primaryActions.push((0, actions_1.toAction)({ id: 'fileWorkingCopy.unlock', label: (0, nls_1.localize)('overwrite', "Overwrite"), run: () => this.save({ ...options, writeUnlock: true, reason: 1 /* SaveReason.EXPLICIT */ }) }));
                }
                // Retry
                else {
                    primaryActions.push((0, actions_1.toAction)({ id: 'fileWorkingCopy.retry', label: (0, nls_1.localize)('retry', "Retry"), run: () => this.save({ ...options, reason: 1 /* SaveReason.EXPLICIT */ }) }));
                }
                // Save As
                primaryActions.push((0, actions_1.toAction)({
                    id: 'fileWorkingCopy.saveAs',
                    label: (0, nls_1.localize)('saveAs', "Save As..."),
                    run: async () => {
                        const editor = this.workingCopyEditorService.findEditor(this);
                        if (editor) {
                            const result = await this.editorService.save(editor, { saveAs: true, reason: 1 /* SaveReason.EXPLICIT */ });
                            if (!result.success) {
                                this.doHandleSaveError(error, options); // show error again given the operation failed
                            }
                        }
                    }
                }));
                // Discard
                primaryActions.push((0, actions_1.toAction)({ id: 'fileWorkingCopy.revert', label: (0, nls_1.localize)('discard', "Discard"), run: () => this.revert() }));
                // Message
                if (isWriteLocked) {
                    if (triedToUnlock && canSaveElevated) {
                        message = platform_1.isWindows ?
                            (0, nls_1.localize)('readonlySaveErrorAdmin', "Failed to save '{0}': File is read-only. Select 'Overwrite as Admin' to retry as administrator.", this.name) :
                            (0, nls_1.localize)('readonlySaveErrorSudo', "Failed to save '{0}': File is read-only. Select 'Overwrite as Sudo' to retry as superuser.", this.name);
                    }
                    else {
                        message = (0, nls_1.localize)('readonlySaveError', "Failed to save '{0}': File is read-only. Select 'Overwrite' to attempt to make it writeable.", this.name);
                    }
                }
                else if (canSaveElevated && isPermissionDenied) {
                    message = platform_1.isWindows ?
                        (0, nls_1.localize)('permissionDeniedSaveError', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Admin' to retry as administrator.", this.name) :
                        (0, nls_1.localize)('permissionDeniedSaveErrorSudo', "Failed to save '{0}': Insufficient permissions. Select 'Retry as Sudo' to retry as superuser.", this.name);
                }
                else {
                    message = (0, nls_1.localize)({ key: 'genericSaveError', comment: ['{0} is the resource that failed to save and {1} the error message'] }, "Failed to save '{0}': {1}", this.name, (0, errorMessage_1.toErrorMessage)(error, false));
                }
            }
            // Show to the user as notification
            const handle = this.notificationService.notify({ id: `${(0, hash_1.hash)(this.resource.toString())}`, severity: notification_1.Severity.Error, message, actions: { primary: primaryActions } });
            // Remove automatically when we get saved/reverted
            const listener = this._register(event_1.Event.once(event_1.Event.any(this.onDidSave, this.onDidRevert))(() => handle.close()));
            this._register(event_1.Event.once(handle.onDidClose)(() => listener.dispose()));
        }
        updateLastResolvedFileStat(newFileStat) {
            const oldReadonly = this.isReadonly();
            // First resolve - just take
            if (!this.lastResolvedFileStat) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Subsequent resolve - make sure that we only assign it if the mtime
            // is equal or has advanced.
            // This prevents race conditions from resolving and saving. If a save
            // comes in late after a revert was called, the mtime could be out of
            // sync.
            else if (this.lastResolvedFileStat.mtime <= newFileStat.mtime) {
                this.lastResolvedFileStat = newFileStat;
            }
            // Signal that the readonly state changed
            if (this.isReadonly() !== oldReadonly) {
                this._onDidChangeReadonly.fire();
            }
        }
        //#endregion
        //#region Revert
        async revert(options) {
            if (!this.isResolved() || (!this.dirty && !options?.force)) {
                return; // ignore if not resolved or not dirty and not enforced
            }
            this.trace('revert()');
            // Unset flags
            const wasDirty = this.dirty;
            const undoSetDirty = this.doSetDirty(false);
            // Force read from disk unless reverting soft
            const softUndo = options?.soft;
            if (!softUndo) {
                try {
                    await this.forceResolveFromFile();
                }
                catch (error) {
                    // FileNotFound means the file got deleted meanwhile, so ignore it
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        // Set flags back to previous values, we are still dirty if revert failed
                        undoSetDirty();
                        throw error;
                    }
                }
            }
            // Emit file change event
            this._onDidRevert.fire();
            // Emit dirty change event
            if (wasDirty) {
                this._onDidChangeDirty.fire();
            }
        }
        hasState(state) {
            switch (state) {
                case 3 /* StoredFileWorkingCopyState.CONFLICT */:
                    return this.inConflictMode;
                case 1 /* StoredFileWorkingCopyState.DIRTY */:
                    return this.dirty;
                case 5 /* StoredFileWorkingCopyState.ERROR */:
                    return this.inErrorMode;
                case 4 /* StoredFileWorkingCopyState.ORPHAN */:
                    return this.isOrphaned();
                case 2 /* StoredFileWorkingCopyState.PENDING_SAVE */:
                    return this.saveSequentializer.isRunning();
                case 0 /* StoredFileWorkingCopyState.SAVED */:
                    return !this.dirty;
            }
        }
        async joinState(state) {
            return this.saveSequentializer.running;
        }
        //#endregion
        //#region Utilities
        isReadonly() {
            return this.filesConfigurationService.isReadonly(this.resource, this.lastResolvedFileStat);
        }
        trace(msg) {
            this.logService.trace(`[stored file working copy] ${msg}`, this.resource.toString(), this.typeId);
        }
        //#endregion
        //#region Dispose
        dispose() {
            this.trace('dispose()');
            // State
            this.inConflictMode = false;
            this.inErrorMode = false;
            // Free up model for GC
            this._model = undefined;
            super.dispose();
        }
    };
    exports.StoredFileWorkingCopy = StoredFileWorkingCopy;
    exports.StoredFileWorkingCopy = StoredFileWorkingCopy = StoredFileWorkingCopy_1 = __decorate([
        __param(5, files_1.IFileService),
        __param(6, log_1.ILogService),
        __param(7, workingCopyFileService_1.IWorkingCopyFileService),
        __param(8, filesConfigurationService_1.IFilesConfigurationService),
        __param(9, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(10, workingCopyService_1.IWorkingCopyService),
        __param(11, notification_1.INotificationService),
        __param(12, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(13, editorService_1.IEditorService),
        __param(14, elevatedFileService_1.IElevatedFileService)
    ], StoredFileWorkingCopy);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkRmlsZVdvcmtpbmdDb3B5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3N0b3JlZEZpbGVXb3JraW5nQ29weS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaVRoRyw0RUFJQztJQXZJRDs7T0FFRztJQUNILElBQWtCLDBCQXFDakI7SUFyQ0QsV0FBa0IsMEJBQTBCO1FBRTNDOztXQUVHO1FBQ0gsNkVBQUssQ0FBQTtRQUVMOztXQUVHO1FBQ0gsNkVBQUssQ0FBQTtRQUVMOzs7V0FHRztRQUNILDJGQUFZLENBQUE7UUFFWjs7OztXQUlHO1FBQ0gsbUZBQVEsQ0FBQTtRQUVSOzs7V0FHRztRQUNILCtFQUFNLENBQUE7UUFFTjs7OztXQUlHO1FBQ0gsNkVBQUssQ0FBQTtJQUNOLENBQUMsRUFyQ2lCLDBCQUEwQiwwQ0FBMUIsMEJBQTBCLFFBcUMzQztJQTJGRCxTQUFnQixnQ0FBZ0MsQ0FBQyxDQUF3QjtRQUN4RSxNQUFNLFNBQVMsR0FBRyxDQUFvQyxDQUFDO1FBRXZELE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7SUFDekIsQ0FBQztJQUVNLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQTZELFNBQVEseUNBQW1COztRQUtwRyxJQUFJLEtBQUssS0FBb0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQXlCbEQsWUFBWTtRQUVaLFlBQ1UsTUFBYyxFQUN2QixRQUFhLEVBQ0osSUFBWSxFQUNKLFlBQW1ELEVBQ25ELGdCQUFnRCxFQUNuRCxXQUF5QixFQUMxQixVQUF3QyxFQUM1QixzQkFBZ0UsRUFDN0QseUJBQXNFLEVBQ3ZFLHdCQUFvRSxFQUMxRSxrQkFBdUMsRUFDdEMs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