/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/files/common/diskFileSystemProvider", "vs/platform/files/common/diskFileSystemProviderClient", "vs/workbench/services/files/electron-sandbox/watcherClient"], function (require, exports, platform_1, diskFileSystemProvider_1, diskFileSystemProviderClient_1, watcherClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProvider = void 0;
    /**
     * A sandbox ready disk file system provider that delegates almost all calls
     * to the main process via `DiskFileSystemProviderServer` except for recursive
     * file watching that is done via shared process workers due to CPU intensity.
     */
    class DiskFileSystemProvider extends diskFileSystemProvider_1.AbstractDiskFileSystemProvider {
        constructor(mainProcessService, utilityProcessWorkerWorkbenchService, logService) {
            super(logService, { watcher: { forceUniversal: true /* send all requests to universal watcher process */ } });
            this.mainProcessService = mainProcessService;
            this.utilityProcessWorkerWorkbenchService = utilityProcessWorkerWorkbenchService;
            this.provider = this._register(new diskFileSystemProviderClient_1.DiskFileSystemProviderClient(this.mainProcessService.getChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: platform_1.isLinux, trash: true }));
            this.registerListeners();
        }
        registerListeners() {
            // Forward events from the embedded provider
            this._register(this.provider.onDidChangeFile(changes => this._onDidChangeFile.fire(changes)));
            this._register(this.provider.onDidWatchError(error => this._onDidWatchError.fire(error)));
        }
        //#region File Capabilities
        get onDidChangeCapabilities() { return this.provider.onDidChangeCapabilities; }
        get capabilities() { return this.provider.capabilities; }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return this.provider.stat(resource);
        }
        readdir(resource) {
            return this.provider.readdir(resource);
        }
        //#endregion
        //#region File Reading/Writing
        readFile(resource, opts) {
            return this.provider.readFile(resource, opts);
        }
        readFileStream(resource, opts, token) {
            return this.provider.readFileStream(resource, opts, token);
        }
        writeFile(resource, content, opts) {
            return this.provider.writeFile(resource, content, opts);
        }
        open(resource, opts) {
            return this.provider.open(resource, opts);
        }
        close(fd) {
            return this.provider.close(fd);
        }
        read(fd, pos, data, offset, length) {
            return this.provider.read(fd, pos, data, offset, length);
        }
        write(fd, pos, data, offset, length) {
            return this.provider.write(fd, pos, data, offset, length);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return this.provider.mkdir(resource);
        }
        delete(resource, opts) {
            return this.provider.delete(resource, opts);
        }
        rename(from, to, opts) {
            return this.provider.rename(from, to, opts);
        }
        copy(from, to, opts) {
            return this.provider.copy(from, to, opts);
        }
        //#endregion
        //#region Clone File
        cloneFile(from, to) {
            return this.provider.cloneFile(from, to);
        }
        //#endregion
        //#region File Watching
        createUniversalWatcher(onChange, onLogMessage, verboseLogging) {
            return new watcherClient_1.UniversalWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging, this.utilityProcessWorkerWorkbenchService);
        }
        createNonRecursiveWatcher() {
            throw new Error('Method not implemented in sandbox.'); // we never expect this to be called given we set `forceUniversal: true`
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2ZpbGVzL2VsZWN0cm9uLXNhbmRib3gvZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHOzs7O09BSUc7SUFDSCxNQUFhLHNCQUF1QixTQUFRLHVEQUE4QjtRQVV6RSxZQUNrQixrQkFBdUMsRUFDdkMsb0NBQTJFLEVBQzVGLFVBQXVCO1lBRXZCLEtBQUssQ0FBQyxVQUFVLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLG9EQUFvRCxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBSjdGLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMseUNBQW9DLEdBQXBDLG9DQUFvQyxDQUF1QztZQUo1RSxhQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJEQUE0QixDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsNkRBQThCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixFQUFFLGtCQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQVM3TCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLDRDQUE0QztZQUM1QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxD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