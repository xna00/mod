/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace"], function (require, exports, errors_1, environment_1, extensionStorage_1, files_1, log_1, storage_1, uriIdentity_1, userDataProfile_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.migrateExtensionStorage = migrateExtensionStorage;
    /**
     * An extension storage has following
     * 	- State: Stored using storage service with extension id as key and state as value.
     *  - Resources: Stored under a location scoped to the extension.
     */
    async function migrateExtensionStorage(fromExtensionId, toExtensionId, global, instantionService) {
        return instantionService.invokeFunction(async (serviceAccessor) => {
            const environmentService = serviceAccessor.get(environment_1.IEnvironmentService);
            const userDataProfilesService = serviceAccessor.get(userDataProfile_1.IUserDataProfilesService);
            const extensionStorageService = serviceAccessor.get(extensionStorage_1.IExtensionStorageService);
            const storageService = serviceAccessor.get(storage_1.IStorageService);
            const uriIdentityService = serviceAccessor.get(uriIdentity_1.IUriIdentityService);
            const fileService = serviceAccessor.get(files_1.IFileService);
            const workspaceContextService = serviceAccessor.get(workspace_1.IWorkspaceContextService);
            const logService = serviceAccessor.get(log_1.ILogService);
            const storageMigratedKey = `extensionStorage.migrate.${fromExtensionId}-${toExtensionId}`;
            const migrateLowerCaseStorageKey = fromExtensionId.toLowerCase() === toExtensionId.toLowerCase() ? `extension.storage.migrateFromLowerCaseKey.${fromExtensionId.toLowerCase()}` : undefined;
            if (fromExtensionId === toExtensionId) {
                return;
            }
            const getExtensionStorageLocation = (extensionId, global) => {
                if (global) {
                    return uriIdentityService.extUri.joinPath(userDataProfilesService.defaultProfile.globalStorageHome, extensionId.toLowerCase() /* Extension id is lower cased for global storage */);
                }
                return uriIdentityService.extUri.joinPath(environmentService.workspaceStorageHome, workspaceContextService.getWorkspace().id, extensionId);
            };
            const storageScope = global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */;
            if (!storageService.getBoolean(storageMigratedKey, storageScope, false) && !(migrateLowerCaseStorageKey && storageService.getBoolean(migrateLowerCaseStorageKey, storageScope, false))) {
                logService.info(`Migrating ${global ? 'global' : 'workspace'} extension storage from ${fromExtensionId} to ${toExtensionId}...`);
                // Migrate state
                const value = extensionStorageService.getExtensionState(fromExtensionId, global);
                if (value) {
                    extensionStorageService.setExtensionState(toExtensionId, value, global);
                    extensionStorageService.setExtensionState(fromExtensionId, undefined, global);
                }
                // Migrate stored files
                const fromPath = getExtensionStorageLocation(fromExtensionId, global);
                const toPath = getExtensionStorageLocation(toExtensionId, global);
                if (!uriIdentityService.extUri.isEqual(fromPath, toPath)) {
                    try {
                        await fileService.move(fromPath, toPath, true);
                    }
                    catch (error) {
                        if (error.code !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                            logService.info(`Error while migrating ${global ? 'global' : 'workspace'} file storage from '${fromExtensionId}' to '${toExtensionId}'`, (0, errors_1.getErrorMessage)(error));
                        }
                    }
                }
                logService.info(`Migrated ${global ? 'global' : 'workspace'} extension storage from ${fromExtensionId} to ${toExtensionId}`);
                storageService.store(storageMigratedKey, true, storageScope, 1 /* StorageTarget.MACHINE */);
            }
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU3RvcmFnZU1pZ3JhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL2V4dGVuc2lvblN0b3JhZ2VNaWdyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLDBEQWtEQztJQXZERDs7OztPQUlHO0lBQ0ksS0FBSyxVQUFVLHVCQUF1QixDQUFDLGVBQXVCLEVBQUUsYUFBcUIsRUFBRSxNQUFlLEVBQUUsaUJBQXdDO1FBQ3RKLE9BQU8saUJBQWlCLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBQyxlQUFlLEVBQUMsRUFBRTtZQUMvRCxNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztZQUNwRSxNQUFNLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsMENBQXdCLENBQUMsQ0FBQztZQUM5RSxNQUFNLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsMkNBQXdCLENBQUMsQ0FBQztZQUM5RSxNQUFNLGNBQWMsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLHlCQUFlLENBQUMsQ0FBQztZQUM1RCxNQUFNLGtCQUFrQixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztZQUNwRSxNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLG9CQUFZLENBQUMsQ0FBQztZQUN0RCxNQUFNLHVCQUF1QixHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsb0NBQXdCLENBQUMsQ0FBQztZQUM5RSxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLGlCQUFXLENBQUMsQ0FBQztZQUNwRCxNQUFNLGtCQUFrQixHQUFHLDRCQUE0Qixl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