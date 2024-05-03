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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/marshalling", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/workbench/contrib/editSessions/common/editSessions", "vs/workbench/services/workspaces/common/workspaceIdentityService"], function (require, exports, cancellation_1, event_1, marshalling_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, editSessions_1, workspaceIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceStateSynchroniser = void 0;
    class NullBackupStoreService {
        async writeResource() {
            return;
        }
        async getAllResourceRefs() {
            return [];
        }
        async resolveResourceContent() {
            return null;
        }
    }
    class NullEnablementService {
        constructor() {
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeResourceEnablement = new event_1.Emitter();
            this.onDidChangeResourceEnablement = this._onDidChangeResourceEnablement.event;
        }
        isEnabled() { return true; }
        canToggleEnablement() { return true; }
        setEnablement(_enabled) { }
        isResourceEnabled(_resource) { return true; }
        setResourceEnablement(_resource, _enabled) { }
        getResourceSyncStateVersion(_resource) { return undefined; }
    }
    let WorkspaceStateSynchroniser = class WorkspaceStateSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(profile, collection, userDataSyncStoreService, logService, fileService, environmentService, telemetryService, configurationService, storageService, uriIdentityService, workspaceIdentityService, editSessionsStorageService) {
            const userDataSyncLocalStoreService = new NullBackupStoreService();
            const userDataSyncEnablementService = new NullEnablementService();
            super({ syncResource: "workspaceState" /* SyncResource.WorkspaceState */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.workspaceIdentityService = workspaceIdentityService;
            this.editSessionsStorageService = editSessionsStorageService;
            this.version = 1;
        }
        async sync() {
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const folders = await this.workspaceIdentityService.getWorkspaceStateFolders(cancellationTokenSource.token);
            if (!folders.length) {
                return;
            }
            // Ensure we have latest state by sending out onWillSaveState event
            await this.storageService.flush();
            const keys = this.storageService.keys(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            if (!keys.length) {
                return;
            }
            const contributedData = {};
            keys.forEach((key) => {
                const data = this.storageService.get(key, 1 /* StorageScope.WORKSPACE */);
                if (data) {
                    contributedData[key] = data;
                }
            });
            const content = { folders, storage: contributedData, version: this.version };
            await this.editSessionsStorageService.write('workspaceState', (0, marshalling_1.stringify)(content));
        }
        async apply() {
            const payload = this.editSessionsStorageService.lastReadResources.get('editSessions')?.content;
            const workspaceStateId = payload ? JSON.parse(payload).workspaceStateId : undefined;
            const resource = await this.editSessionsStorageService.read('workspaceState', workspaceStateId);
            if (!resource) {
                return null;
            }
            const remoteWorkspaceState = (0, marshalling_1.parse)(resource.content);
            if (!remoteWorkspaceState) {
                this.logService.info('Skipping initializing workspace state because remote workspace state does not exist.');
                return null;
            }
            // Evaluate whether storage is applicable for current workspace
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const replaceUris = await this.workspaceIdentityService.matches(remoteWorkspaceState.folders, cancellationTokenSource.token);
            if (!replaceUris) {
                this.logService.info('Skipping initializing workspace state because remote workspace state does not match current workspace.');
                return null;
            }
            const storage = {};
            for (const key of Object.keys(remoteWorkspaceState.storage)) {
                storage[key] = remoteWorkspaceState.storage[key];
            }
            if (Object.keys(storage).length) {
                // Initialize storage with remote storage
                const storageEntries = [];
                for (const key of Object.keys(storage)) {
                    // Deserialize the stored state
                    try {
                        const value = (0, marshalling_1.parse)(storage[key]);
                        // Run URI conversion on the stored state
                        replaceUris(value);
                        storageEntries.push({ key, value, scope: 1 /* StorageScope.WORKSPACE */, target: 0 /* StorageTarget.USER */ });
                    }
                    catch {
                        storageEntries.push({ key, value: storage[key], scope: 1 /* StorageScope.WORKSPACE */, target: 0 /* StorageTarget.USER */ });
                    }
                }
                this.storageService.storeAll(storageEntries, true);
            }
            this.editSessionsStorageService.delete('workspaceState', resource.ref);
            return null;
        }
        // TODO@joyceerhl implement AbstractSynchronizer in full
        applyResult(remoteUserData, lastSyncUserData, result, force) {
            throw new Error('Method not implemented.');
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration, token) {
            return [];
        }
        getMergeResult(resourcePreview, token) {
            throw new Error('Method not implemented.');
        }
        getAcceptResult(resourcePreview, resource, content, token) {
            throw new Error('Method not implemented.');
        }
        async hasRemoteChanged(lastSyncUserData) {
            return true;
        }
        async hasLocalData() {
            return false;
        }
        async resolveContent(uri) {
            return null;
        }
    };
    exports.WorkspaceStateSynchroniser = WorkspaceStateSynchroniser;
    exports.WorkspaceStateSynchroniser = WorkspaceStateSynchroniser = __decorate([
        __param(4, files_1.IFileService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, storage_1.IStorageService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, workspaceIdentityService_1.IWorkspaceIdentityService),
        __param(11, editSessions_1.IEditSessionsStorageService)
    ], WorkspaceStateSynchroniser);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlU3RhdGVTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9lZGl0U2Vzc2lvbnMvY29tbW9uL3dvcmtzcGFjZVN0YXRlU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLE1BQU0sc0JBQXNCO1FBRTNCLEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU87UUFDUixDQUFDO1FBQ0QsS0FBSyxDQUFDLGtCQUFrQjtZQUN2QixPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFDRCxLQUFLLENBQUMsc0JBQXNCO1lBQzNCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUVEO0lBRUQsTUFBTSxxQkFBcUI7UUFBM0I7WUFHUywyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBVyxDQUFDO1lBQy9DLDBCQUFxQixHQUFtQixJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBRTNFLG1DQUE4QixHQUFHLElBQUksZUFBTyxFQUEyQixDQUFDO1lBQ3ZFLGtDQUE2QixHQUFtQyxJQUFJLENBQUMsOEJBQThCLENBQUMsS0FBSyxDQUFDO1FBU3BILENBQUM7UUFQQSxTQUFTLEtBQWMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JDLG1CQUFtQixLQUFjLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztRQUMvQyxhQUFhLENBQUMsUUFBaUIsSUFBVSxDQUFDO1FBQzFDLGlCQUFpQixDQUFDLFNBQXVCLElBQWEsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLHFCQUFxQixDQUFDLFNBQXVCLEVBQUUsUUFBaUIsSUFBVSxDQUFDO1FBQzNFLDJCQUEyQixDQUFDLFNBQXVCLElBQXdCLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztLQUU5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