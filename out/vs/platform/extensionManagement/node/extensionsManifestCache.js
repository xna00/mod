/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/extensions/common/extensions", "vs/platform/files/common/files"], function (require, exports, lifecycle_1, extensions_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsManifestCache = void 0;
    class ExtensionsManifestCache extends lifecycle_1.Disposable {
        constructor(userDataProfilesService, fileService, uriIdentityService, extensionsManagementService, logService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._register(extensionsManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(extensionsManagementService.onDidUninstallExtension(e => this.onDidUnInstallExtension(e)));
        }
        onDidInstallExtensions(results) {
            for (const r of results) {
                if (r.local) {
                    this.invalidate(r.profileLocation);
                }
            }
        }
        onDidUnInstallExtension(e) {
            if (!e.error) {
                this.invalidate(e.profileLocation);
            }
        }
        async invalidate(extensionsManifestLocation) {
            if (extensionsManifestLocation) {
                for (const profile of this.userDataProfilesService.profiles) {
                    if (this.uriIdentityService.extUri.isEqual(profile.extensionsResource, extensionsManifestLocation)) {
                        await this.deleteUserCacheFile(profile);
                    }
                }
            }
            else {
                await this.deleteUserCacheFile(this.userDataProfilesService.defaultProfile);
            }
        }
        async deleteUserCacheFile(profile) {
            try {
                await this.fileService.del(this.uriIdentityService.extUri.joinPath(profile.cacheHome, extensions_1.USER_MANIFEST_CACHE_FILE));
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
    }
    exports.ExtensionsManifestCache = ExtensionsManifestCache;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc01hbmlmZXN0Q2FjaGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25zTWFuaWZlc3RDYWNoZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSx1QkFBd0IsU0FBUSxzQkFBVTtRQUV0RCxZQUNrQix1QkFBaUQsRUFDakQsV0FBeUIsRUFDekIsa0JBQXVDLEVBQ3hELDJCQUF3RCxFQUN2QyxVQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQU5TLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDakQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDekIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUV2QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBR3hDLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hHLElBQUksQ0FBQyxTQUFTLENBQUMsMkJBQTJCLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNHLENBQUM7UUFFTyxzQkFBc0IsQ0FBQyxPQUEwQztZQUN4RSxLQUFLLE1BQU0sQ0FBQyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDcEMsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sdUJBQXVCLENBQUMsQ0FBNkI7WUFDNUQsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsMEJBQTJDO1lBQzNELElBQUksMEJBQTBCLEVBQUUsQ0FBQztnQkFDaEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzdELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLDBCQUEwQixDQUFDLEVBQUUsQ0FBQzt3QkFDcEcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3pDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0UsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBeUI7WUFDMUQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxxQ0FBd0IsQ0FBQyxDQUFDLENBQUM7WUFDbEgsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBQSw2QkFBcUIsRUFBQyxLQUFLLENBQUMsK0NBQXVDLEVBQUUsQ0FBQztvQkFDekUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBakRELDBEQWlEQyJ9