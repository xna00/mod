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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, extHostCustomers_1, extHost_protocol_1, buffer_1) {
    "use strict";
    var MainThreadFileSystem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystem = void 0;
    let MainThreadFileSystem = MainThreadFileSystem_1 = class MainThreadFileSystem {
        constructor(extHostContext, _fileService) {
            this._fileService = _fileService;
            this._fileProvider = new lifecycle_1.DisposableMap();
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystem);
            const infoProxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemInfo);
            for (const entry of _fileService.listCapabilities()) {
                infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: entry.scheme, path: '/dummy' }), entry.capabilities);
            }
            this._disposables.add(_fileService.onDidChangeFileSystemProviderRegistrations(e => infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: e.scheme, path: '/dummy' }), e.provider?.capabilities ?? null)));
            this._disposables.add(_fileService.onDidChangeFileSystemProviderCapabilities(e => infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: e.scheme, path: '/dummy' }), e.provider.capabilities)));
        }
        dispose() {
            this._disposables.dispose();
            this._fileProvider.dispose();
        }
        async $registerFileSystemProvider(handle, scheme, capabilities, readonlyMessage) {
            this._fileProvider.set(handle, new RemoteFileSystemProvider(this._fileService, scheme, capabilities, readonlyMessage, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            this._fileProvider.deleteAndDispose(handle);
        }
        $onFileSystemChange(handle, changes) {
            const fileProvider = this._fileProvider.get(handle);
            if (!fileProvider) {
                throw new Error('Unknown file provider');
            }
            fileProvider.$onFileSystemChange(changes);
        }
        // --- consumer fs, vscode.workspace.fs
        $stat(uri) {
            return this._fileService.stat(uri_1.URI.revive(uri)).then(stat => {
                return {
                    ctime: stat.ctime,
                    mtime: stat.mtime,
                    size: stat.size,
                    permissions: stat.readonly ? files_1.FilePermission.Readonly : undefined,
                    type: MainThreadFileSystem_1._asFileType(stat)
                };
            }).catch(MainThreadFileSystem_1._handleError);
        }
        $readdir(uri) {
            return this._fileService.resolve(uri_1.URI.revive(uri), { resolveMetadata: false }).then(stat => {
                if (!stat.isDirectory) {
                    const err = new Error(stat.name);
                    err.name = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    throw err;
                }
                return !stat.children ? [] : stat.children.map(child => [child.name, MainThreadFileSystem_1._asFileType(child)]);
            }).catch(MainThreadFileSystem_1._handleError);
        }
        static _asFileType(stat) {
            let res = 0;
            if (stat.isFile) {
                res += files_1.FileType.File;
            }
            else if (stat.isDirectory) {
                res += files_1.FileType.Directory;
            }
            if (stat.isSymbolicLink) {
                res += files_1.FileType.SymbolicLink;
            }
            return res;
        }
        $readFile(uri) {
            return this._fileService.readFile(uri_1.URI.revive(uri)).then(file => file.value).catch(MainThreadFileSystem_1._handleError);
        }
        $writeFile(uri, content) {
            return this._fileService.writeFile(uri_1.URI.revive(uri), content)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $rename(source, target, opts) {
            return this._fileService.move(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $copy(source, target, opts) {
            return this._fileService.copy(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $mkdir(uri) {
            return this._fileService.createFolder(uri_1.URI.revive(uri))
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $delete(uri, opts) {
            return this._fileService.del(uri_1.URI.revive(uri), opts).catch(MainThreadFileSystem_1._handleError);
        }
        static _handleError(err) {
            if (err instanceof files_1.FileOperationError) {
                switch (err.fileOperationResult) {
                    case 1 /* FileOperationResult.FILE_NOT_FOUND */:
                        err.name = files_1.FileSystemProviderErrorCode.FileNotFound;
                        break;
                    case 0 /* FileOperationResult.FILE_IS_DIRECTORY */:
                        err.name = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                        break;
                    case 6 /* FileOperationResult.FILE_PERMISSION_DENIED */:
                        err.name = files_1.FileSystemProviderErrorCode.NoPermissions;
                        break;
                    case 4 /* FileOperationResult.FILE_MOVE_CONFLICT */:
                        err.name = files_1.FileSystemProviderErrorCode.FileExists;
                        break;
                }
            }
            else if (err instanceof Error) {
                const code = (0, files_1.toFileSystemProviderErrorCode)(err);
                if (code !== files_1.FileSystemProviderErrorCode.Unknown) {
                    err.name = code;
                }
            }
            throw err;
        }
        $ensureActivation(scheme) {
            return this._fileService.activateProvider(scheme);
        }
    };
    exports.MainThreadFileSystem = MainThreadFileSystem;
    exports.MainThreadFileSystem = MainThreadFileSystem = MainThreadFileSystem_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadFileSystem),
        __param(1, files_1.IFileService)
    ], MainThreadFileSystem);
    class RemoteFileSystemProvider {
        constructor(fileService, scheme, capabilities, readOnlyMessage, _handle, _proxy) {
            this.readOnlyMessage = readOnlyMessage;
            this._handle = _handle;
            this._proxy = _proxy;
            this._onDidChange = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChange.event;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.capabilities = capabilities;
            this._registration = fileService.registerProvider(scheme, this);
        }
        dispose() {
            this._registration.dispose();
            this._onDidChange.dispose();
        }
        watch(resource, opts) {
            const session = Math.random();
            this._proxy.$watch(this._handle, session, resource, opts);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unwatch(this._handle, session);
            });
        }
        $onFileSystemChange(changes) {
            this._onDidChange.fire(changes.map(RemoteFileSystemProvider._createFileChange));
        }
        static _createFileChange(dto) {
            return { resource: uri_1.URI.revive(dto.resource), type: dto.type };
        }
        // --- forwarding calls
        stat(resource) {
            return this._proxy.$stat(this._handle, resource).then(undefined, err => {
                throw err;
            });
        }
        readFile(resource) {
            return this._proxy.$readFile(this._handle, resource).then(buffer => buffer.buffer);
        }
        writeFile(resource, content, opts) {
            return this._proxy.$writeFile(this._handle, resource, buffer_1.VSBuffer.wrap(content), opts);
        }
        delete(resource, opts) {
            return this._proxy.$delete(this._handle, resource, opts);
        }
        mkdir(resource) {
            return this._proxy.$mkdir(this._handle, resource);
        }
        readdir(resource) {
            return this._proxy.$readdir(this._handle, resource);
        }
        rename(resource, target, opts) {
            return this._proxy.$rename(this._handle, resource, target, opts);
        }
        copy(resource, target, opts) {
            return this._proxy.$copy(this._handle, resource, target, opts);
        }
        open(resource, opts) {
            return this._proxy.$open(this._handle, resource, opts);
        }
        close(fd) {
            return this._proxy.$close(this._handle, fd);
        }
        read(fd, pos, data, offset, length) {
            return this._proxy.$read(this._handle, fd, pos, length).then(readData => {
                data.set(readData.buffer, offset);
                return readData.byteLength;
            });
        }
        write(fd, pos, data, offset, length) {
            return this._proxy.$write(this._handle, fd, pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEZpbGVTeXN0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRmlsZVN5c3RlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sb0JBQW9CLDRCQUExQixNQUFNLG9CQUFvQjtRQU1oQyxZQUNDLGNBQStCLEVBQ2pCLFlBQTJDO1lBQTFCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBTHpDLGtCQUFhLEdBQUcsSUFBSSx5QkFBYSxFQUFvQyxDQUFDO1lBQ3RFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFNckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUV4RSxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUVoRixLQUFLLE1BQU0sS0FBSyxJQUFJLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3JELFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3hHLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsTUFB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