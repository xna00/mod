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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/workbench/common/resources", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files"], function (require, exports, nls_1, async_1, cancellation_1, lifecycle_1, map_1, configuration_1, undoRedo_1, uriIdentity_1, editor_1, pathService_1, storedFileWorkingCopy_1, workingCopyHistory_1, workingCopyService_1, network_1, resources_1, workspace_1, files_1) {
    "use strict";
    var WorkingCopyHistoryTracker_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyHistoryTracker = void 0;
    let WorkingCopyHistoryTracker = class WorkingCopyHistoryTracker extends lifecycle_1.Disposable {
        static { WorkingCopyHistoryTracker_1 = this; }
        static { this.SETTINGS = {
            ENABLED: 'workbench.localHistory.enabled',
            SIZE_LIMIT: 'workbench.localHistory.maxFileSize',
            EXCLUDES: 'workbench.localHistory.exclude'
        }; }
        static { this.UNDO_REDO_SAVE_SOURCE = editor_1.SaveSourceRegistry.registerSource('undoRedo.source', (0, nls_1.localize)('undoRedo.source', "Undo / Redo")); }
        constructor(workingCopyService, workingCopyHistoryService, uriIdentityService, pathService, configurationService, undoRedoService, contextService, fileService) {
            super();
            this.workingCopyService = workingCopyService;
            this.workingCopyHistoryService = workingCopyHistoryService;
            this.uriIdentityService = uriIdentityService;
            this.pathService = pathService;
            this.configurationService = configurationService;
            this.undoRedoService = undoRedoService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.limiter = this._register(new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS));
            this.resourceExcludeMatcher = this._register(new async_1.GlobalIdleValue(() => {
                const matcher = this._register(new resources_1.ResourceGlobMatcher(root => this.configurationService.getValue(WorkingCopyHistoryTracker_1.SETTINGS.EXCLUDES, { resource: root }), event => event.affectsConfiguration(WorkingCopyHistoryTracker_1.SETTINGS.EXCLUDES), this.contextService, this.configurationService));
                return matcher;
            }));
            this.pendingAddHistoryEntryOperations = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.workingCopyContentVersion = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.historyEntryContentVersion = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.registerListeners();
        }
        registerListeners() {
            // File Events
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            // Working Copy Events
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            this._register(this.workingCopyService.onDidSave(e => this.onDidSave(e)));
        }
        async onDidRunFileOperation(e) {
            if (!this.shouldTrackHistoryFromFileOperationEvent(e)) {
                return; // return early for working copies we are not interested in
            }
            const source = e.resource;
            const target = e.target.resource;
            // Move working copy history entries for this file move event
            const resources = await this.workingCopyHistoryService.moveEntries(source, target);
            // Make sure to track the content version of each entry that
            // was moved in our map. This ensures that a subsequent save
            // without a content change does not add a redundant entry
            // (https://github.com/microsoft/vscode/issues/145881)
            for (const resource of resources) {
                const contentVersion = this.getContentVersion(resource);
                this.historyEntryContentVersion.set(resource, contentVersion);
            }
        }
        onDidChangeContent(workingCopy) {
            // Increment content version ID for resource
            const contentVersionId = this.getContentVersion(workingCopy.resource);
            this.workingCopyContentVersion.set(workingCopy.resource, contentVersionId + 1);
        }
        getContentVersion(resource) {
            return this.workingCopyContentVersion.get(resource) || 0;
        }
        onDidSave(e) {
            if (!this.shouldTrackHistoryFromSaveEvent(e)) {
                return; // return early for working copies we are not interested in
            }
            const contentVersion = this.getContentVersion(e.workingCopy.resource);
            if (this.historyEntryContentVersion.get(e.workingCopy.resource) === contentVersion) {
                return; // return early when content version already has associated history entry
            }
            // Cancel any previous operation for this resource
            this.pendingAddHistoryEntryOperations.get(e.workingCopy.resource)?.dispose(true);
            // Create new cancellation token support and remember
            const cts = new cancellation_1.CancellationTokenSource();
            this.pendingAddHistoryEntryOperations.set(e.workingCopy.resource, cts);
            // Queue new operation to add to history
            this.limiter.queue(async () => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                const contentVersion = this.getContentVersion(e.workingCopy.resource);
                // Figure out source of save operation if not provided already
                let source = e.source;
                if (!e.source) {
                    source = this.resolveSourceFromUndoRedo(e);
                }
                // Add entry
                await this.workingCopyHistoryService.addEntry({ resource: e.workingCopy.resource, source, timestamp: e.stat.mtime }, cts.token);
                // Remember content version as being added to history
                this.historyEntryContentVersion.set(e.workingCopy.resource, contentVersion);
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Finally remove from pending operations
                this.pendingAddHistoryEntryOperations.delete(e.workingCopy.resource);
            });
        }
        resolveSourceFromUndoRedo(e) {
            const lastStackElement = this.undoRedoService.getLastElement(e.workingCopy.resource);
            if (lastStackElement) {
                if (lastStackElement.code === 'undoredo.textBufferEdit') {
                    return undefined; // ignore any unspecific stack element that resulted just from typing
                }
                return lastStackElement.label;
            }
            const allStackElements = this.undoRedoService.getElements(e.workingCopy.resource);
            if (allStackElements.future.length > 0 || allStackElements.past.length > 0) {
                return WorkingCopyHistoryTracker_1.UNDO_REDO_SAVE_SOURCE;
            }
            return undefined;
        }
        shouldTrackHistoryFromSaveEvent(e) {
            if (!(0, storedFileWorkingCopy_1.isStoredFileWorkingCopySaveEvent)(e)) {
                return false; // only support working copies that are backed by stored files
            }
            return this.shouldTrackHistory(e.workingCopy.resource, e.stat);
        }
        shouldTrackHistoryFromFileOperationEvent(e) {
            if (!e.isOperation(2 /* FileOperation.MOVE */)) {
                return false; // only interested in move operations
            }
            return this.shouldTrackHistory(e.target.resource, e.target);
        }
        shouldTrackHistory(resource, stat) {
            if (resource.scheme !== this.pathService.defaultUriScheme && // track history for all workspace resources
                resource.scheme !== network_1.Schemas.vscodeUserData && // track history for all settings
                resource.scheme !== network_1.Schemas.inMemory // track history for tests that use in-memory
            ) {
                return false; // do not support unknown resources
            }
            const configuredMaxFileSizeInBytes = 1024 * this.configurationService.getValue(WorkingCopyHistoryTracker_1.SETTINGS.SIZE_LIMIT, { resource });
            if (stat.size > configuredMaxFileSizeInBytes) {
                return false; // only track files that are not too large
            }
            if (this.configurationService.getValue(WorkingCopyHistoryTracker_1.SETTINGS.ENABLED, { resource }) === false) {
                return false; // do not track when history is disabled
            }
            // Finally check for exclude setting
            return !this.resourceExcludeMatcher.value.matches(resource);
        }
    };
    exports.WorkingCopyHistoryTracker = WorkingCopyHistoryTracker;
    exports.WorkingCopyHistoryTracker = WorkingCopyHistoryTracker = WorkingCopyHistoryTracker_1 = __decorate([
        __param(0, workingCopyService_1.IWorkingCopyService),
        __param(1, workingCopyHistory_1.IWorkingCopyHistoryService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, pathService_1.IPathService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, undoRedo_1.IUndoRedoService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, files_1.IFileService)
    ], WorkingCopyHistoryTracker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5VHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weUhpc3RvcnlUcmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7O2lCQUVoQyxhQUFRLEdBQUc7WUFDbEMsT0FBTyxFQUFFLGdDQUFnQztZQUN6QyxVQUFVLEVBQUUsb0NBQW9DO1lBQ2hELFFBQVEsRUFBRSxnQ0FBZ0M7U0FDMUMsQUFKK0IsQ0FJOUI7aUJBRXNCLDBCQUFxQixHQUFHLDJCQUFrQixDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQyxBQUFuRyxDQUFvRztRQW9CakosWUFDc0Isa0JBQXdELEVBQ2pELHlCQUFzRSxFQUM3RSxrQkFBd0QsRUFDL0QsV0FBMEMsRUFDakMsb0JBQTRELEVBQ2pFLGVBQWtELEVBQzFDLGNBQXlELEVBQ3JFLFdBQTBDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBVDhCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDaEMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUE0QjtZQUM1RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDaEQsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3pCLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUNwRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQTFCeEMsWUFBTyxHQUFH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