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
define(["require", "exports", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/base/common/network", "vs/platform/log/common/log", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/files/common/files", "vs/base/common/platform"], function (require, exports, extHostFileSystemConsumer_1, network_1, log_1, diskFileSystemProvider_1, files_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDiskFileSystemProvider = void 0;
    let ExtHostDiskFileSystemProvider = class ExtHostDiskFileSystemProvider {
        constructor(extHostConsumerFileSystem, logService) {
            // Register disk file system provider so that certain
            // file operations can execute fast within the extension
            // host without roundtripping.
            extHostConsumerFileSystem.addFileSystemProvider(network_1.Schemas.file, new DiskFileSystemProviderAdapter(logService), { isCaseSensitive: platform_1.isLinux });
        }
    };
    exports.ExtHostDiskFileSystemProvider = ExtHostDiskFileSystemProvider;
    exports.ExtHostDiskFileSystemProvider = ExtHostDiskFileSystemProvider = __decorate([
        __param(0, extHostFileSystemConsumer_1.IExtHostConsumerFileSystem),
        __param(1, log_1.ILogService)
    ], ExtHostDiskFileSystemProvider);
    class DiskFileSystemProviderAdapter {
        constructor(logService) {
            this.logService = logService;
            this.impl = new diskFileSystemProvider_1.DiskFileSystemProvider(this.logService);
        }
        async stat(uri) {
            const stat = await this.impl.stat(uri);
            return {
                type: stat.type,
                ctime: stat.ctime,
                mtime: stat.mtime,
                size: stat.size,
                permissions: stat.permissions === files_1.FilePermission.Readonly ? 1 : undefined
            };
        }
        readDirectory(uri) {
            return this.impl.readdir(uri);
        }
        createDirectory(uri) {
            return this.impl.mkdir(uri);
        }
        readFile(uri) {
            return this.impl.readFile(uri);
        }
        writeFile(uri, content, options) {
            return this.impl.writeFile(uri, content, { ...options, unlock: false, atomic: false });
        }
        delete(uri, options) {
            return this.impl.delete(uri, { ...options, useTrash: false, atomic: false });
        }
        rename(oldUri, newUri, options) {
            return this.impl.rename(oldUri, newUri, options);
        }
        copy(source, destination, options) {
            return this.impl.copy(source, destination, options);
        }
        // --- Not Implemented ---
        get onDidChangeFile() { throw new Error('Method not implemented.'); }
        watch(uri, options) { throw new Error('Method not implemented.'); }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERpc2tGaWxlU3lzdGVtUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0RGlza0ZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFFekMsWUFDNkIseUJBQXFELEVBQ3BFLFVBQXVCO1lBR3BDLHFEQUFxRDtZQUNyRCx3REFBd0Q7WUFDeEQsOEJBQThCO1lBQzlCLHlCQUF5QixDQUFDLHFCQUFxQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLElBQUksNkJBQTZCLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxlQUFlLEVBQUUsa0JBQU8sRUFBRSxDQUFDLENBQUM7UUFDNUksQ0FBQztLQUNELENBQUE7SUFaWSxzRUFBNkI7NENBQTdCLDZCQUE2QjtRQUd2QyxXQUFBLHNEQUEwQixDQUFBO1FBQzFCLFdBQUEsaUJBQVcsQ0FBQTtPQUpELDZCQUE2QixDQVl6QztJQUVELE1BQU0sNkJBQTZCO1FBSWxDLFlBQTZCLFVBQXVCO1lBQXZCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFGbkMsU0FBSSxHQUFHLElBQUksK0NBQXNCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRVosQ0FBQztRQUV6RCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQWU7WUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUV2QyxPQUFPO2dCQUNOLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztnQkFDakIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxLQUFLLHNCQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDekUsQ0FBQztRQUNILENBQUM7UUFFRCxhQUFhLENBQUMsR0FBZTtZQUM1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFRCxlQUFlLENBQUMsR0FBZTtZQUM5QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxRQUFRLENBQUMsR0FBZTtZQUN2QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxTQUFTLENBQUMsR0FBZSxFQUFFLE9BQW1CLEVBQUUsT0FBa0U7WUFDakgsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEVBQUUsR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsTUFBTSxDQUFDLEdBQWUsRUFBRSxPQUF3QztZQUMvRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFrQixFQUFFLE1BQWtCLEVBQUUsT0FBd0M7WUFDdEYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCxJQUFJLENBQUMsTUFBa0IsRUFBRSxXQUF1QixFQUFFLE9BQXdDO1lBQ3pGLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBRUQsMEJBQTBCO1FBRTFCLElBQUksZUFBZSxLQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUUsS0FBSyxDQUFDLEdBQWUsRUFBRSxPQUE4RSxJQUF1QixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pLIn0=