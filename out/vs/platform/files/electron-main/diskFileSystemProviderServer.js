/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/nls", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer", "vs/base/common/uriIpc", "vs/base/common/errorMessage"], function (require, exports, electron_1, nls_1, platform_1, uri_1, files_1, path_1, diskFileSystemProviderServer_1, uriIpc_1, errorMessage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderChannel = void 0;
    class DiskFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(provider, logService, environmentService) {
            super(provider, logService);
            this.environmentService = environmentService;
        }
        getUriTransformer(ctx) {
            return uriIpc_1.DefaultURITransformer;
        }
        transformIncoming(uriTransformer, _resource) {
            return uri_1.URI.revive(_resource);
        }
        //#region Delete: override to support Electron's trash support
        async delete(uriTransformer, _resource, opts) {
            if (!opts.useTrash) {
                return super.delete(uriTransformer, _resource, opts);
            }
            const resource = this.transformIncoming(uriTransformer, _resource);
            const filePath = (0, path_1.normalize)(resource.fsPath);
            try {
                await electron_1.shell.trashItem(filePath);
            }
            catch (error) {
                throw (0, files_1.createFileSystemProviderError)(platform_1.isWindows ? (0, nls_1.localize)('binFailed', "Failed to move '{0}' to the recycle bin ({1})", (0, path_1.basename)(filePath), (0, errorMessage_1.toErrorMessage)(error)) : (0, nls_1.localize)('trashFailed', "Failed to move '{0}' to the trash ({1})", (0, path_1.basename)(filePath), (0, errorMessage_1.toErrorMessage)(error)), files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        //#endregion
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.DiskFileSystemProviderChannel = DiskFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        watch(req, resource, opts) {
            if (opts.recursive) {
                throw (0, files_1.createFileSystemProviderError)('Recursive file watching is not supported from main process for performance reasons.', files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return super.watch(req, resource, opts);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvZWxlY3Ryb24tbWFpbi9kaXNrRmlsZVN5c3RlbVByb3ZpZGVyU2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBYSw2QkFBOEIsU0FBUSxvRUFBOEM7UUFFaEcsWUFDQyxRQUFnQyxFQUNoQyxVQUF1QixFQUNOLGtCQUF1QztZQUV4RCxLQUFLLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRlgsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtRQUd6RCxDQUFDO1FBRWtCLGlCQUFpQixDQUFDLEdBQVk7WUFDaEQsT0FBTyw4QkFBcUIsQ0FBQztRQUM5QixDQUFDO1FBRWtCLGlCQUFpQixDQUFDLGNBQStCLEVBQUUsU0FBd0I7WUFDN0YsT0FBTyxTQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlCLENBQUM7UUFFRCw4REFBOEQ7UUFFM0MsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUErQixFQUFFLFNBQXdCLEVBQUUsSUFBd0I7WUFDbEgsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbkUsTUFBTSxRQUFRLEdBQUcsSUFBQSxnQkFBUyxFQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxnQkFBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxJQUFBLHFDQUE2QixFQUFDLG9CQUFTLENBQUMsQ0FBQyxDQUFDLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSwrQ0FBK0MsRUFBRSxJQUFBLGVBQVEsRUFBQyxRQUFRLENBQUMsRUFBRSxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLHlDQUF5QyxFQUFFLElBQUEsZUFBUSxFQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pULENBQUM7UUFDRixDQUFDO1FBRUQsWUFBWTtRQUVaLHVCQUF1QjtRQUViLHdCQUF3QixDQUFDLGNBQStCLEVBQUUsT0FBd0M7WUFDM0csT0FBTyxJQUFJLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNsRyxDQUFDO0tBSUQ7SUE1Q0Qsc0VBNENDO0lBRUQsTUFBTSxrQkFBbUIsU0FBUSx5REFBMEI7UUFFakQsS0FBSyxDQUFDLEdBQVcsRUFBRSxRQUFhLEVBQUUsSUFBbUI7WUFDN0QsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxxRkFBcUYsRUFBRSxtQ0FBMkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNySyxDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsQ0FBQztLQUNEIn0=