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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/date", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, async_1, buffer_1, date_1, lifecycle_1, resources_1, configuration_1, environment_1, files_1, userDataProfile_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncLocalStoreService = void 0;
    let UserDataSyncLocalStoreService = class UserDataSyncLocalStoreService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, configurationService, logService, userDataProfilesService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.userDataProfilesService = userDataProfilesService;
            this.cleanUp();
        }
        async cleanUp() {
            for (const profile of this.userDataProfilesService.profiles) {
                for (const resource of userDataSync_1.ALL_SYNC_RESOURCES) {
                    try {
                        await this.cleanUpBackup(this.getResourceBackupHome(resource, profile.isDefault ? undefined : profile.id));
                    }
                    catch (error) {
                        this.logService.error(error);
                    }
                }
            }
            let stat;
            try {
                stat = await this.fileService.resolve(this.environmentService.userDataSyncHome);
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
                return;
            }
            if (stat.children) {
                for (const child of stat.children) {
                    if (child.isDirectory && !this.userDataProfilesService.profiles.some(profile => profile.id === child.name)) {
                        try {
                            this.logService.info('Deleting non existing profile from backup', child.resource.path);
                            await this.fileService.del(child.resource, { recursive: true });
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                    }
                }
            }
        }
        async getAllResourceRefs(resource, collection, root) {
            const folder = this.getResourceBackupHome(resource, collection, root);
            try {
                const stat = await this.fileService.resolve(folder);
                if (stat.children) {
                    const all = stat.children.filter(stat => stat.isFile && !stat.name.startsWith('lastSync')).sort().reverse();
                    return all.map(stat => ({
                        ref: stat.name,
                        created: this.getCreationTime(stat)
                    }));
                }
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error;
                }
            }
            return [];
        }
        async resolveResourceContent(resourceKey, ref, collection, root) {
            const folder = this.getResourceBackupHome(resourceKey, collection, root);
            const file = (0, resources_1.joinPath)(folder, ref);
            try {
                const content = await this.fileService.readFile(file);
                return content.value.toString();
            }
            catch (error) {
                this.logService.error(error);
                return null;
            }
        }
        async writeResource(resourceKey, content, cTime, collection, root) {
            const folder = this.getResourceBackupHome(resourceKey, collection, root);
            const resource = (0, resources_1.joinPath)(folder, `${(0, date_1.toLocalISOString)(cTime).replace(/-|:|\.\d+Z$/g, '')}.json`);
            try {
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(content));
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getResourceBackupHome(resource, collection, root = this.environmentService.userDataSyncHome) {
            return (0, resources_1.joinPath)(root, ...(collection ? [collection, resource] : [resource]));
        }
        async cleanUpBackup(folder) {
            try {
                try {
                    if (!(await this.fileService.exists(folder))) {
                        return;
                    }
                }
                catch (e) {
                    return;
                }
                const stat = await this.fileService.resolve(folder);
                if (stat.children) {
                    const all = stat.children.filter(stat => stat.isFile && /^\d{8}T\d{6}(\.json)?$/.test(stat.name)).sort();
                    const backUpMaxAge = 1000 * 60 * 60 * 24 * (this.configurationService.getValue('sync.localBackupDuration') || 30 /* Default 30 days */);
                    let toDelete = all.filter(stat => Date.now() - this.getCreationTime(stat) > backUpMaxAge);
                    const remaining = all.length - toDelete.length;
                    if (remaining < 10) {
                        toDelete = toDelete.slice(10 - remaining);
                    }
                    await async_1.Promises.settled(toDelete.map(async (stat) => {
                        this.logService.info('Deleting from backup', stat.resource.path);
                        await this.fileService.del(stat.resource);
                    }));
                }
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getCreationTime(stat) {
            return new Date(parseInt(stat.name.substring(0, 4)), parseInt(stat.name.substring(4, 6)) - 1, parseInt(stat.name.substring(6, 8)), parseInt(stat.name.substring(9, 11)), parseInt(stat.name.substring(11, 13)), parseInt(stat.name.substring(13, 15))).getTime();
        }
    };
    exports.UserDataSyncLocalStoreService = UserDataSyncLocalStoreService;
    exports.UserDataSyncLocalStoreService = UserDataSyncLocalStoreService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncLocalStoreService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jTG9jYWxTdG9yZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jTG9jYWxTdG9yZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsc0JBQVU7UUFJNUQsWUFDdUMsa0JBQXVDLEVBQzlDLFdBQXlCLEVBQ2hCLG9CQUEyQyxFQUN6QyxVQUFtQyxFQUNsQyx1QkFBaUQ7WUFFNUYsS0FBSyxFQUFFLENBQUM7WUFOOEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLGVBQVUsR0FBVixVQUFVLENBQXlCO1lBQ2xDLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFHNUYsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTztZQUNwQixLQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDN0QsS0FBSyxNQUFNLFFBQVEsSUFBSSxpQ0FBa0IsRUFBRSxDQUFDO29CQUMzQyxJQUFJLENBQUM7d0JBQ0osTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDNUcsQ0FBQztvQkFBQyxPQUFPLEtBQUss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