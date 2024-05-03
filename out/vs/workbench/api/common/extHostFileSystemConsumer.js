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
define(["require", "exports", "./extHost.protocol", "vs/platform/files/common/files", "vs/workbench/api/common/extHostTypes", "vs/base/common/buffer", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/network"], function (require, exports, extHost_protocol_1, files, extHostTypes_1, buffer_1, instantiation_1, extHostRpcService_1, extHostFileSystemInfo_1, lifecycle_1, async_1, resources_1, network_1) {
    "use strict";
    var ExtHostConsumerFileSystem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConsumerFileSystem = exports.ExtHostConsumerFileSystem = void 0;
    let ExtHostConsumerFileSystem = ExtHostConsumerFileSystem_1 = class ExtHostConsumerFileSystem {
        constructor(extHostRpc, fileSystemInfo) {
            this._fileSystemProvider = new Map();
            this._writeQueue = new async_1.ResourceQueue();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
            const that = this;
            this.value = Object.freeze({
                async stat(uri) {
                    try {
                        let stat;
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            stat = await provider.impl.stat(uri);
                        }
                        else {
                            stat = await that._proxy.$stat(uri);
                        }
                        return {
                            type: stat.type,
                            ctime: stat.ctime,
                            mtime: stat.mtime,
                            size: stat.size,
                            permissions: stat.permissions === files.FilePermission.Readonly ? 1 : undefined
                        };
                    }
                    catch (err) {
                        ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async readDirectory(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.impl.readDirectory(uri)).slice(); // safe-copy
                        }
                        else {
                            return await that._proxy.$readdir(uri);
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async createDirectory(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return await that.mkdirp(provider.impl, provider.extUri, uri);
                        }
                        else {
                            return await that._proxy.$mkdir(uri);
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async readFile(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.impl.readFile(uri)).slice(); // safe-copy
                        }
                        else {
                            const buff = await that._proxy.$readFile(uri);
                            return buff.buffer;
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async writeFile(uri, content) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            await that.mkdirp(provider.impl, provider.extUri, provider.extUri.dirname(uri));
                            return await that._writeQueue.queueFor(uri, () => Promise.resolve(provider.impl.writeFile(uri, content, { create: true, overwrite: true })));
                        }
                        else {
                            return await that._proxy.$writeFile(uri, buffer_1.VSBuffer.wrap(content));
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async delete(uri, options) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider && !provider.isReadonly && !options?.useTrash /* no shortcut: use trash */) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return await provider.impl.delete(uri, { recursive: false, ...options });
                        }
                        else {
                            return await that._proxy.$delete(uri, { recursive: false, useTrash: false, atomic: false, ...options });
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async rename(oldUri, newUri, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$rename(oldUri, newUri, { ...{ overwrite: false }, ...options });
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                async copy(source, destination, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$copy(source, destination, { ...{ overwrite: false }, ...options });
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem_1._handleError(err);
                    }
                },
                isWritableFileSystem(scheme) {
                    const capabilities = fileSystemInfo.getCapabilities(scheme);
                    if (typeof capabilities === 'number') {
                        return !(capabilities & 2048 /* files.FileSystemProviderCapabilities.Readonly */);
                    }
                    return undefined;
                }
            });
        }
        async mkdirp(provider, providerExtUri, directory) {
            const directoriesToCreate = [];
            while (!providerExtUri.isEqual(directory, providerExtUri.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files.FileType.Directory) === 0) {
                        throw extHostTypes_1.FileSystemError.FileExists(`Unable to create folder '${directory.scheme === network_1.Schemas.file ? directory.fsPath : directory.toString(true)}' that already exists but is not a directory`);
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    if (files.toFileSystemProviderErrorCode(error) !== files.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // further go up and remember to create this directory
                    directoriesToCreate.push(providerExtUri.basename(directory));
                    directory = providerExtUri.dirname(directory);
                }
            }
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = providerExtUri.joinPath(directory, directoriesToCreate[i]);
                try {
                    await provider.createDirectory(directory);
                }
                catch (error) {
                    if (files.toFileSystemProviderErrorCode(error) !== files.FileSystemProviderErrorCode.FileExists) {
                        // For mkdirp() we tolerate that the mkdir() call fails
                        // in case the folder already exists. This follows node.js
                        // own implementation of fs.mkdir({ recursive: true }) and
                        // reduces the chances of race conditions leading to errors
                        // if multiple calls try to create the same folders
                        // As such, we only throw an error here if it is other than
                        // the fact that the file already exists.
                        // (see also https://github.com/microsoft/vscode/issues/89834)
                        throw error;
                    }
                }
            }
        }
        static _handleError(err) {
            // desired error type
            if (err instanceof extHostTypes_1.FileSystemError) {
                throw err;
            }
            // file system provider error
            if (err instanceof files.FileSystemProviderError) {
                switch (err.code) {
                    case files.FileSystemProviderErrorCode.FileExists: throw extHostTypes_1.FileSystemError.FileExists(err.message);
                    case files.FileSystemProviderErrorCode.FileNotFound: throw extHostTypes_1.FileSystemError.FileNotFound(err.message);
                    case files.FileSystemProviderErrorCode.FileNotADirectory: throw extHostTypes_1.FileSystemError.FileNotADirectory(err.message);
                    case files.FileSystemProviderErrorCode.FileIsADirectory: throw extHostTypes_1.FileSystemError.FileIsADirectory(err.message);
                    case files.FileSystemProviderErrorCode.NoPermissions: throw extHostTypes_1.FileSystemError.NoPermissions(err.message);
                    case files.FileSystemProviderErrorCode.Unavailable: throw extHostTypes_1.FileSystemError.Unavailable(err.message);
                    default: throw new extHostTypes_1.FileSystemError(err.message, err.name);
                }
            }
            // generic error
            if (!(err instanceof Error)) {
                throw new extHostTypes_1.FileSystemError(String(err));
            }
            // no provider (unknown scheme) error
            if (err.name === 'ENOPRO' || err.message.includes('ENOPRO')) {
                throw extHostTypes_1.FileSystemError.Unavailable(err.message);
            }
            // file system error
            switch (err.name) {
                case files.FileSystemProviderErrorCode.FileExists: throw extHostTypes_1.FileSystemError.FileExists(err.message);
                case files.FileSystemProviderErrorCode.FileNotFound: throw extHostTypes_1.FileSystemError.FileNotFound(err.message);
                case files.FileSystemProviderErrorCode.FileNotADirectory: throw extHostTypes_1.FileSystemError.FileNotADirectory(err.message);
                case files.FileSystemProviderErrorCode.FileIsADirectory: throw extHostTypes_1.FileSystemError.FileIsADirectory(err.message);
                case files.FileSystemProviderErrorCode.NoPermissions: throw extHostTypes_1.FileSystemError.NoPermissions(err.message);
                case files.FileSystemProviderErrorCode.Unavailable: throw extHostTypes_1.FileSystemError.Unavailable(err.message);
                default: throw new extHostTypes_1.FileSystemError(err.message, err.name);
            }
        }
        // ---
        addFileSystemProvider(scheme, provider, options) {
            this._fileSystemProvider.set(scheme, { impl: provider, extUri: options?.isCaseSensitive ? resources_1.extUri : resources_1.extUriIgnorePathCase, isReadonly: !!options?.isReadonly });
            return (0, lifecycle_1.toDisposable)(() => this._fileSystemProvider.delete(scheme));
        }
        getFileSystemProviderExtUri(scheme) {
            return this._fileSystemProvider.get(scheme)?.extUri ?? resources_1.extUri;
        }
    };
    exports.ExtHostConsumerFileSystem = ExtHostConsumerFileSystem;
    exports.ExtHostConsumerFileSystem = ExtHostConsumerFileSystem = ExtHostConsumerFileSystem_1 = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostFileSystemInfo_1.IExtHostFileSystemInfo)
    ], ExtHostConsumerFileSystem);
    exports.IExtHostConsumerFileSystem = (0, instantiation_1.createDecorator)('IExtHostConsumerFileSystem');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW1Db25zdW1lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEZpbGVTeXN0ZW1Db25zdW1lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLHlCQUF5QixpQ0FBL0IsTUFBTSx5QkFBeUI7UUFXckMsWUFDcUIsVUFBOEIsRUFDMUIsY0FBc0M7WUFOOUMsd0JBQW1CLEdBQUcsSUFBSSxHQUFHLEVBQXFGLENBQUM7WUFFbkgsZ0JBQVcsR0FBRyxJQUFJLHFCQUFhLEVBQUUsQ0FBQztZQU1sRCxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3BFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztZQUVsQixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBZTtvQkFDekIsSUFBSSxDQUFDO3dCQUNKLElBQUksSUFBSSxDQUFDO3dCQUVULE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMxRCxJQUFJLFFBQVEsRUFBRSxDQUFDOzRCQUNkLGVBQWU7NEJBQ2YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDaEQsSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3RDLENBQUM7NkJBQU0sQ0FBQzs0QkFDUCxJQUFJLEdBQUcsTUFB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