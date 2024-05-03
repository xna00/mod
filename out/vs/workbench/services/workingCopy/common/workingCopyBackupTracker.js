/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/cancellation", "vs/base/common/async"], function (require, exports, lifecycle_1, cancellation_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyBackupTracker = void 0;
    /**
     * The working copy backup tracker deals with:
     * - restoring backups that exist
     * - creating backups for modified working copies
     * - deleting backups for saved working copies
     * - handling backups on shutdown
     */
    class WorkingCopyBackupTracker extends lifecycle_1.Disposable {
        constructor(workingCopyBackupService, workingCopyService, logService, lifecycleService, filesConfigurationService, workingCopyEditorService, editorService, editorGroupService) {
            super();
            this.workingCopyBackupService = workingCopyBackupService;
            this.workingCopyService = workingCopyService;
            this.logService = logService;
            this.lifecycleService = lifecycleService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            // A map from working copy to a version ID we compute on each content
            // change. This version ID allows to e.g. ask if a backup for a specific
            // content has been made before closing.
            this.mapWorkingCopyToContentVersion = new Map();
            // A map of scheduled pending backup operations for working copies
            // Given https://github.com/microsoft/vscode/issues/158038, we explicitly
            // do not store `IWorkingCopy` but the identifier in the map, since it
            // looks like GC is not running for the working copy otherwise.
            this.pendingBackupOperations = new Map();
            this.suspended = false;
            //#endregion
            //#region Backup Restorer
            this.unrestoredBackups = new Set();
            this.whenReady = this.resolveBackupsToRestore();
            this._isReady = false;
            // Fill in initial modified working copies
            for (const workingCopy of this.workingCopyService.modifiedWorkingCopies) {
                this.onDidRegister(workingCopy);
            }
            this.registerListeners();
        }
        registerListeners() {
            // Working Copy events
            this._register(this.workingCopyService.onDidRegister(workingCopy => this.onDidRegister(workingCopy)));
            this._register(this.workingCopyService.onDidUnregister(workingCopy => this.onDidUnregister(workingCopy)));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onDidChangeDirty(workingCopy)));
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(event => event.finalVeto(() => this.onFinalBeforeShutdown(event.reason), 'veto.backups')));
            this._register(this.lifecycleService.onWillShutdown(() => this.onWillShutdown()));
            // Once a handler registers, restore backups
            this._register(this.workingCopyEditorService.onDidRegisterHandler(handler => this.restoreBackups(handler)));
        }
        onWillShutdown() {
            // Here we know that we will shutdown. Any backup operation that is
            // already scheduled or being scheduled from this moment on runs
            // at the risk of corrupting a backup because the backup operation
            // might terminate at any given time now. As such, we need to disable
            // this tracker from performing more backups by cancelling pending
            // operations and suspending the tracker without resuming.
            this.cancelBackupOperations();
            this.suspendBackupOperations();
        }
        //#region Backup Creator
        // Delay creation of backups when content changes to avoid too much
        // load on the backup service when the user is typing into the editor
        // Since we always schedule a backup, even when auto save is on, we
        // have different scheduling delays based on auto save configuration.
        // With 'delayed' we avoid a (not critical but also not really wanted)
        // race between saving (after 1s per default) and making a backup of
        // the working copy.
        static { this.DEFAULT_BACKUP_SCHEDULE_DELAYS = {
            ['default']: 1000,
            ['delayed']: 2000
        }; }
        onDidRegister(workingCopy) {
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring register event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            if (workingCopy.isModified()) {
                this.scheduleBackup(workingCopy);
            }
        }
        onDidUnregister(workingCopy) {
            // Remove from content version map
            this.mapWorkingCopyToContentVersion.delete(workingCopy);
            // Check suspended
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring unregister event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            // Discard backup
            this.discardBackup(workingCopy);
        }
        onDidChangeDirty(workingCopy) {
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring dirty change event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            if (workingCopy.isDirty()) {
                this.scheduleBackup(workingCopy);
            }
            else {
                this.discardBackup(workingCopy);
            }
        }
        onDidChangeContent(workingCopy) {
            // Increment content version ID
            const contentVersionId = this.getContentVersion(workingCopy);
            this.mapWorkingCopyToContentVersion.set(workingCopy, contentVersionId + 1);
            // Check suspended
            if (this.suspended) {
                this.logService.warn(`[backup tracker] suspended, ignoring content change event`, workingCopy.resource.toString(), workingCopy.typeId);
                return;
            }
            // Schedule backup for modified working copies
            if (workingCopy.isModified()) {
                // this listener will make sure that the backup is
                // pushed out for as long as the user is still changing
                // the content of the working copy.
                this.scheduleBackup(workingCopy);
            }
        }
        scheduleBackup(workingCopy) {
            // Clear any running backup operation
            this.cancelBackupOperation(workingCopy);
            this.logService.trace(`[backup tracker] scheduling backup`, workingCopy.resource.toString(), workingCopy.typeId);
            // Schedule new backup
            const workingCopyIdentifier = { resource: workingCopy.resource, typeId: workingCopy.typeId };
            const cts = new cancellation_1.CancellationTokenSource();
            const handle = setTimeout(async () => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Backup if modified
                if (workingCopy.isModified()) {
                    this.logService.trace(`[backup tracker] creating backup`, workingCopy.resource.toString(), workingCopy.typeId);
                    try {
                        const backup = await workingCopy.backup(cts.token);
                        if (cts.token.isCancellationRequested) {
                            return;
                        }
                        if (workingCopy.isModified()) {
                            this.logService.trace(`[backup tracker] storing backup`, workingCopy.resource.toString(), workingCopy.typeId);
                            await this.workingCopyBackupService.backup(workingCopy, backup.content, this.getContentVersion(workingCopy), backup.meta, cts.token);
                        }
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
                // Clear disposable unless we got canceled which would
                // indicate another operation has started meanwhile
                if (!cts.token.isCancellationRequested) {
                    this.doClearPendingBackupOperation(workingCopyIdentifier);
                }
            }, this.getBackupScheduleDelay(workingCopy));
            // Keep in map for disposal as needed
            this.pendingBackupOperations.set(workingCopyIdentifier, {
                cancel: () => {
                    this.logService.trace(`[backup tracker] clearing pending backup creation`, workingCopy.resource.toString(), workingCopy.typeId);
                    cts.cancel();
                },
                disposable: (0, lifecycle_1.toDisposable)(() => {
                    cts.dispose();
                    clearTimeout(handle);
                })
            });
        }
        getBackupScheduleDelay(workingCopy) {
            if (typeof workingCopy.backupDelay === 'number') {
                return workingCopy.backupDelay; // respect working copy override
            }
            let backupScheduleDelay;
            if (workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) {
                backupScheduleDelay = 'default'; // auto-save is never on for untitled working copies
            }
            else {
                backupScheduleDelay = this.filesConfigurationService.hasShortAutoSaveDelay(workingCopy.resource) ? 'delayed' : 'default';
            }
            return WorkingCopyBackupTracker.DEFAULT_BACKUP_SCHEDULE_DELAYS[backupScheduleDelay];
        }
        getContentVersion(workingCopy) {
            return this.mapWorkingCopyToContentVersion.get(workingCopy) || 0;
        }
        discardBackup(workingCopy) {
            // Clear any running backup operation
            this.cancelBackupOperation(workingCopy);
            // Schedule backup discard asap
            const workingCopyIdentifier = { resource: workingCopy.resource, typeId: workingCopy.typeId };
            const cts = new cancellation_1.CancellationTokenSource();
            this.doDiscardBackup(workingCopyIdentifier, cts);
            // Keep in map for disposal as needed
            this.pendingBackupOperations.set(workingCopyIdentifier, {
                cancel: () => {
                    this.logService.trace(`[backup tracker] clearing pending backup discard`, workingCopy.resource.toString(), workingCopy.typeId);
                    cts.cancel();
                },
                disposable: cts
            });
        }
        async doDiscardBackup(workingCopyIdentifier, cts) {
            this.logService.trace(`[backup tracker] discarding backup`, workingCopyIdentifier.resource.toString(), workingCopyIdentifier.typeId);
            // Discard backup
            try {
                await this.workingCopyBackupService.discardBackup(workingCopyIdentifier, cts.token);
            }
            catch (error) {
                this.logService.error(error);
            }
            // Clear disposable unless we got canceled which would
            // indicate another operation has started meanwhile
            if (!cts.token.isCancellationRequested) {
                this.doClearPendingBackupOperation(workingCopyIdentifier);
            }
        }
        cancelBackupOperation(workingCopy) {
            // Given a working copy we want to find the matching
            // identifier in our pending operations map because
            // we cannot use the working copy directly, as the
            // identifier might have different object identity.
            let workingCopyIdentifier = undefined;
            for (const [identifier] of this.pendingBackupOperations) {
                if (identifier.resource.toString() === workingCopy.resource.toString() && identifier.typeId === workingCopy.typeId) {
                    workingCopyIdentifier = identifier;
                    break;
                }
            }
            if (workingCopyIdentifier) {
                this.doClearPendingBackupOperation(workingCopyIdentifier, { cancel: true });
            }
        }
        doClearPendingBackupOperation(workingCopyIdentifier, options) {
            const pendingBackupOperation = this.pendingBackupOperations.get(workingCopyIdentifier);
            if (!pendingBackupOperation) {
                return;
            }
            if (options?.cancel) {
                pendingBackupOperation.cancel();
            }
            pendingBackupOperation.disposable.dispose();
            this.pendingBackupOperations.delete(workingCopyIdentifier);
        }
        cancelBackupOperations() {
            for (const [, operation] of this.pendingBackupOperations) {
                operation.cancel();
                operation.disposable.dispose();
            }
            this.pendingBackupOperations.clear();
        }
        suspendBackupOperations() {
            this.suspended = true;
            return { resume: () => this.suspended = false };
        }
        get isReady() { return this._isReady; }
        async resolveBackupsToRestore() {
            // Wait for resolving backups until we are restored to reduce startup pressure
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Remember each backup that needs to restore
            for (const backup of await this.workingCopyBackupService.getBackups()) {
                this.unrestoredBackups.add(backup);
            }
            this._isReady = true;
        }
        async restoreBackups(handler) {
            // Wait for backups to be resolved
            await this.whenReady;
            // Figure out already opened editors for backups vs
            // non-opened.
            const openedEditorsForBackups = new Set();
            const nonOpenedEditorsForBackups = new Set();
            // Ensure each backup that can be handled has an
            // associated editor.
            const restoredBackups = new Set();
            for (const unrestoredBackup of this.unrestoredBackups) {
                const canHandleUnrestoredBackup = await handler.handles(unrestoredBackup);
                if (!canHandleUnrestoredBackup) {
                    continue;
                }
                // Collect already opened editors for backup
                let hasOpenedEditorForBackup = false;
                for (const { editor } of this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const isUnrestoredBackupOpened = handler.isOpen(unrestoredBackup, editor);
                    if (isUnrestoredBackupOpened) {
                        openedEditorsForBackups.add(editor);
                        hasOpenedEditorForBackup = true;
                    }
                }
                // Otherwise, make sure to create at least one editor
                // for the backup to show
                if (!hasOpenedEditorForBackup) {
                    nonOpenedEditorsForBackups.add(await handler.createEditor(unrestoredBackup));
                }
                // Remember as (potentially) restored
                restoredBackups.add(unrestoredBackup);
            }
            // Ensure editors are opened for each backup without editor
            // in the background without stealing focus
            if (nonOpenedEditorsForBackups.size > 0) {
                await this.editorGroupService.activeGroup.openEditors([...nonOpenedEditorsForBackups].map(nonOpenedEditorForBackup => ({
                    editor: nonOpenedEditorForBackup,
                    options: {
                        pinned: true,
                        preserveFocus: true,
                        inactive: true
                    }
                })));
                for (const nonOpenedEditorForBackup of nonOpenedEditorsForBackups) {
                    openedEditorsForBackups.add(nonOpenedEditorForBackup);
                }
            }
            // Then, resolve each opened editor to make sure the working copy
            // is loaded and the modified editor appears properly.
            // We only do that for editors that are not active in a group
            // already to prevent calling `resolve` twice!
            await async_1.Promises.settled([...openedEditorsForBackups].map(async (openedEditorForBackup) => {
                if (this.editorService.isVisible(openedEditorForBackup)) {
                    return;
                }
                return openedEditorForBackup.resolve();
            }));
            // Finally, remove all handled backups from the list
            for (const restoredBackup of restoredBackups) {
                this.unrestoredBackups.delete(restoredBackup);
            }
        }
    }
    exports.WorkingCopyBackupTracker = WorkingCopyBackupTracker;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBUcmFja2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3dvcmtpbmdDb3B5QmFja3VwVHJhY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpQmhHOzs7Ozs7T0FNRztJQUNILE1BQXNCLHdCQUF5QixTQUFRLHNCQUFVO1FBRWhFLFlBQ29CLHdCQUFtRCxFQUNuRCxrQkFBdUMsRUFDdkMsVUFBdUIsRUFDekIsZ0JBQW1DLEVBQ2pDLHlCQUFxRCxFQUN2RCx3QkFBbUQsRUFDakQsYUFBNkIsRUFDL0Isa0JBQXdDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBVFcsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQUNuRCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3ZDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDekIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNqQyw4QkFBeUIsR0FBekIseUJBQXlCLENBQTRCO1lBQ3ZELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDakQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQy9CLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUEwRDFELHFFQUFxRTtZQUNyRSx3RUFBd0U7WUFDeEUsd0NBQXdDO1lBQ3ZCLG1DQUE4QixHQUFHLElBQUksR0FBRyxFQUF3QixDQUFDO1lBRWxGLGtFQUFrRTtZQUNsRSx5RUFBeUU7WUFDekUsc0VBQXNFO1lBQ3RFLCtEQUErRDtZQUM1Qyw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBMkUsQ0FBQztZQUV4SCxjQUFTLEdBQUcsS0FBSyxDQUFDO1lBaU8xQixZQUFZO1lBR1oseUJBQXlCO1lBRU4sc0JBQWlCLEdB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