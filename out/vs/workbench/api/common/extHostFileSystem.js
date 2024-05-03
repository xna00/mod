/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "./extHost.protocol", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/editor/common/languages/linkComputer", "vs/base/common/strings", "vs/base/common/buffer", "vs/workbench/services/extensions/common/extensions", "vs/base/common/htmlContent"], function (require, exports, uri_1, extHost_protocol_1, lifecycle_1, extHostTypes_1, typeConverter, linkComputer_1, strings_1, buffer_1, extensions_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostFileSystem = void 0;
    class FsLinkProvider {
        constructor() {
            this._schemes = [];
        }
        add(scheme) {
            this._stateMachine = undefined;
            this._schemes.push(scheme);
        }
        delete(scheme) {
            const idx = this._schemes.indexOf(scheme);
            if (idx >= 0) {
                this._schemes.splice(idx, 1);
                this._stateMachine = undefined;
            }
        }
        _initStateMachine() {
            if (!this._stateMachine) {
                // sort and compute common prefix with previous scheme
                // then build state transitions based on the data
                const schemes = this._schemes.sort();
                const edges = [];
                let prevScheme;
                let prevState;
                let lastState = 14 /* State.LastKnownState */;
                let nextState = 14 /* State.LastKnownState */;
                for (const scheme of schemes) {
                    // skip the common prefix of the prev scheme
                    // and continue with its last state
                    let pos = !prevScheme ? 0 : (0, strings_1.commonPrefixLength)(prevScheme, scheme);
                    if (pos === 0) {
                        prevState = 1 /* State.Start */;
                    }
                    else {
                        prevState = nextState;
                    }
                    for (; pos < scheme.length; pos++) {
                        // keep creating new (next) states until the
                        // end (and the BeforeColon-state) is reached
                        if (pos + 1 === scheme.length) {
                            // Save the last state here, because we need to continue for the next scheme
                            lastState = nextState;
                            nextState = 9 /* State.BeforeColon */;
                        }
                        else {
                            nextState += 1;
                        }
                        edges.push([prevState, scheme.toUpperCase().charCodeAt(pos), nextState]);
                        edges.push([prevState, scheme.toLowerCase().charCodeAt(pos), nextState]);
                        prevState = nextState;
                    }
                    prevScheme = scheme;
                    // Restore the last state
                    nextState = lastState;
                }
                // all link must match this pattern `<scheme>:/<more>`
                edges.push([9 /* State.BeforeColon */, 58 /* CharCode.Colon */, 10 /* State.AfterColon */]);
                edges.push([10 /* State.AfterColon */, 47 /* CharCode.Slash */, 12 /* State.End */]);
                this._stateMachine = new linkComputer_1.StateMachine(edges);
            }
        }
        provideDocumentLinks(document) {
            this._initStateMachine();
            const result = [];
            const links = linkComputer_1.LinkComputer.computeLinks({
                getLineContent(lineNumber) {
                    return document.lineAt(lineNumber - 1).text;
                },
                getLineCount() {
                    return document.lineCount;
                }
            }, this._stateMachine);
            for (const link of links) {
                const docLink = typeConverter.DocumentLink.to(link);
                if (docLink.target) {
                    result.push(docLink);
                }
            }
            return result;
        }
    }
    class ExtHostFileSystem {
        constructor(mainContext, _extHostLanguageFeatures) {
            this._extHostLanguageFeatures = _extHostLanguageFeatures;
            this._linkProvider = new FsLinkProvider();
            this._fsProvider = new Map();
            this._registeredSchemes = new Set();
            this._watches = new Map();
            this._handlePool = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
        }
        dispose() {
            this._linkProviderRegistration?.dispose();
        }
        registerFileSystemProvider(extension, scheme, provider, options = {}) {
            // validate the given provider is complete
            ExtHostFileSystem._validateFileSystemProvider(provider);
            if (this._registeredSchemes.has(scheme)) {
                throw new Error(`a provider for the scheme '${scheme}' is already registered`);
            }
            //
            if (!this._linkProviderRegistration) {
                this._linkProviderRegistration = this._extHostLanguageFeatures.registerDocumentLinkProvider(extension, '*', this._linkProvider);
            }
            const handle = this._handlePool++;
            this._linkProvider.add(scheme);
            this._registeredSchemes.add(scheme);
            this._fsProvider.set(handle, provider);
            let capabilities = 2 /* files.FileSystemProviderCapabilities.FileReadWrite */;
            if (options.isCaseSensitive) {
                capabilities += 1024 /* files.FileSystemProviderCapabilities.PathCaseSensitive */;
            }
            if (options.isReadonly) {
                capabilities += 2048 /* files.FileSystemProviderCapabilities.Readonly */;
            }
            if (typeof provider.copy === 'function') {
                capabilities += 8 /* files.FileSystemProviderCapabilities.FileFolderCopy */;
            }
            if (typeof provider.open === 'function' && typeof provider.close === 'function'
                && typeof provider.read === 'function' && typeof provider.write === 'function') {
                (0, extensions_1.checkProposedApiEnabled)(extension, 'fsChunks');
                capabilities += 4 /* files.FileSystemProviderCapabilities.FileOpenReadWriteClose */;
            }
            let readOnlyMessage;
            if (options.isReadonly && (0, htmlContent_1.isMarkdownString)(options.isReadonly) && options.isReadonly.value !== '') {
                readOnlyMessage = {
                    value: options.isReadonly.value,
                    isTrusted: options.isReadonly.isTrusted,
                    supportThemeIcons: options.isReadonly.supportThemeIcons,
                    supportHtml: options.isReadonly.supportHtml,
                    baseUri: options.isReadonly.baseUri,
                    uris: options.isReadonly.uris
                };
            }
            this._proxy.$registerFileSystemProvider(handle, scheme, capabilities, readOnlyMessage).catch(err => {
                console.error(`FAILED to register filesystem provider of ${extension.identifier.value}-extension for the scheme ${scheme}`);
                console.error(err);
            });
            const subscription = provider.onDidChangeFile(event => {
                const mapped = [];
                for (const e of event) {
                    const { uri: resource, type } = e;
                    if (resource.scheme !== scheme) {
                        // dropping events for wrong scheme
                        continue;
                    }
                    let newType;
                    switch (type) {
                        case extHostTypes_1.FileChangeType.Changed:
                            newType = 0 /* files.FileChangeType.UPDATED */;
                            break;
                        case extHostTypes_1.FileChangeType.Created:
                            newType = 1 /* files.FileChangeType.ADDED */;
                            break;
                        case extHostTypes_1.FileChangeType.Deleted:
                            newType = 2 /* files.FileChangeType.DELETED */;
                            break;
                        default:
                            throw new Error('Unknown FileChangeType');
                    }
                    mapped.push({ resource, type: newType });
                }
                this._proxy.$onFileSystemChange(handle, mapped);
            });
            return (0, lifecycle_1.toDisposable)(() => {
                subscription.dispose();
                this._linkProvider.delete(scheme);
                this._registeredSchemes.delete(scheme);
                this._fsProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        static _validateFileSystemProvider(provider) {
            if (!provider) {
                throw new Error('MISSING provider');
            }
            if (typeof provider.watch !== 'function') {
                throw new Error('Provider does NOT implement watch');
            }
            if (typeof provider.stat !== 'function') {
                throw new Error('Provider does NOT implement stat');
            }
            if (typeof provider.readDirectory !== 'function') {
                throw new Error('Provider does NOT implement readDirectory');
            }
            if (typeof provider.createDirectory !== 'function') {
                throw new Error('Provider does NOT implement createDirectory');
            }
            if (typeof provider.readFile !== 'function') {
                throw new Error('Provider does NOT implement readFile');
            }
            if (typeof provider.writeFile !== 'function') {
                throw new Error('Provider does NOT implement writeFile');
            }
            if (typeof provider.delete !== 'function') {
                throw new Error('Provider does NOT implement delete');
            }
            if (typeof provider.rename !== 'function') {
                throw new Error('Provider does NOT implement rename');
            }
        }
        static _asIStat(stat) {
            const { type, ctime, mtime, size, permissions } = stat;
            return { type, ctime, mtime, size, permissions };
        }
        $stat(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).stat(uri_1.URI.revive(resource))).then(stat => ExtHostFileSystem._asIStat(stat));
        }
        $readdir(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).readDirectory(uri_1.URI.revive(resource)));
        }
        $readFile(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).readFile(uri_1.URI.revive(resource))).then(data => buffer_1.VSBuffer.wrap(data));
        }
        $writeFile(handle, resource, content, opts) {
            return Promise.resolve(this._getFsProvider(handle).writeFile(uri_1.URI.revive(resource), content.buffer, opts));
        }
        $delete(handle, resource, opts) {
            return Promise.resolve(this._getFsProvider(handle).delete(uri_1.URI.revive(resource), opts));
        }
        $rename(handle, oldUri, newUri, opts) {
            return Promise.resolve(this._getFsProvider(handle).rename(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $copy(handle, oldUri, newUri, opts) {
            const provider = this._getFsProvider(handle);
            if (!provider.copy) {
                throw new Error('FileSystemProvider does not implement "copy"');
            }
            return Promise.resolve(provider.copy(uri_1.URI.revive(oldUri), uri_1.URI.revive(newUri), opts));
        }
        $mkdir(handle, resource) {
            return Promise.resolve(this._getFsProvider(handle).createDirectory(uri_1.URI.revive(resource)));
        }
        $watch(handle, session, resource, opts) {
            const subscription = this._getFsProvider(handle).watch(uri_1.URI.revive(resource), opts);
            this._watches.set(session, subscription);
        }
        $unwatch(_handle, session) {
            const subscription = this._watches.get(session);
            if (subscription) {
                subscription.dispose();
                this._watches.delete(session);
            }
        }
        $open(handle, resource, opts) {
            const provider = this._getFsProvider(handle);
            if (!provider.open) {
                throw new Error('FileSystemProvider does not implement "open"');
            }
            return Promise.resolve(provider.open(uri_1.URI.revive(resource), opts));
        }
        $close(handle, fd) {
            const provider = this._getFsProvider(handle);
            if (!provider.close) {
                throw new Error('FileSystemProvider does not implement "close"');
            }
            return Promise.resolve(provider.close(fd));
        }
        $read(handle, fd, pos, length) {
            const provider = this._getFsProvider(handle);
            if (!provider.read) {
                throw new Error('FileSystemProvider does not implement "read"');
            }
            const data = buffer_1.VSBuffer.alloc(length);
            return Promise.resolve(provider.read(fd, pos, data.buffer, 0, length)).then(read => {
                return data.slice(0, read); // don't send zeros
            });
        }
        $write(handle, fd, pos, data) {
            const provider = this._getFsProvider(handle);
            if (!provider.write) {
                throw new Error('FileSystemProvider does not implement "write"');
            }
            return Promise.resolve(provider.write(fd, pos, data.buffer, 0, data.byteLength));
        }
        _getFsProvider(handle) {
            const provider = this._fsProvider.get(handle);
            if (!provider) {
                const err = new Error();
                err.name = 'ENOPRO';
                err.message = `no provider`;
                throw err;
            }
            return provider;
        }
    }
    exports.ExtHostFileSystem = ExtHostFileSystem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEZpbGVTeXN0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RGaWxlU3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBTSxjQUFjO1FBQXBCO1lBRVMsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQXVGakMsQ0FBQztRQXBGQSxHQUFHLENBQUMsTUFBYztZQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztZQUMvQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQWM7WUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUMsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztZQUNoQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUV6QixzREFBc0Q7Z0JBQ3RELGlEQUFpRDtnQkFDakQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxLQUFLLEdBQVcsRUFBRSxDQUFDO2dCQUN6QixJQUFJLFVBQThCLENBQUM7Z0JBQ25DLElBQUksU0FBZ0IsQ0FBQztnQkFDckIsSUFBSSxTQUFTLGdDQUF1QixDQUFDO2dCQUNyQyxJQUFJLFNBQVMsZ0NB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