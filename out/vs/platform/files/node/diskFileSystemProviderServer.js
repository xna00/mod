/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/base/common/stream", "vs/base/common/cancellation"], function (require, exports, event_1, diskFileSystemProvider_1, lifecycle_1, buffer_1, stream_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractSessionFileWatcher = exports.AbstractDiskFileSystemProviderChannel = void 0;
    /**
     * A server implementation for a IPC based file system provider client.
     */
    class AbstractDiskFileSystemProviderChannel extends lifecycle_1.Disposable {
        constructor(provider, logService) {
            super();
            this.provider = provider;
            this.logService = logService;
            //#endregion
            //#region File Watching
            this.sessionToWatcher = new Map();
            this.watchRequests = new Map();
        }
        call(ctx, command, arg) {
            const uriTransformer = this.getUriTransformer(ctx);
            switch (command) {
                case 'stat': return this.stat(uriTransformer, arg[0]);
                case 'readdir': return this.readdir(uriTransformer, arg[0]);
                case 'open': return this.open(uriTransformer, arg[0], arg[1]);
                case 'close': return this.close(arg[0]);
                case 'read': return this.read(arg[0], arg[1], arg[2]);
                case 'readFile': return this.readFile(uriTransformer, arg[0], arg[1]);
                case 'write': return this.write(arg[0], arg[1], arg[2], arg[3], arg[4]);
                case 'writeFile': return this.writeFile(uriTransformer, arg[0], arg[1], arg[2]);
                case 'rename': return this.rename(uriTransformer, arg[0], arg[1], arg[2]);
                case 'copy': return this.copy(uriTransformer, arg[0], arg[1], arg[2]);
                case 'cloneFile': return this.cloneFile(uriTransformer, arg[0], arg[1]);
                case 'mkdir': return this.mkdir(uriTransformer, arg[0]);
                case 'delete': return this.delete(uriTransformer, arg[0], arg[1]);
                case 'watch': return this.watch(uriTransformer, arg[0], arg[1], arg[2], arg[3]);
                case 'unwatch': return this.unwatch(arg[0], arg[1]);
            }
            throw new Error(`IPC Command ${command} not found`);
        }
        listen(ctx, event, arg) {
            const uriTransformer = this.getUriTransformer(ctx);
            switch (event) {
                case 'fileChange': return this.onFileChange(uriTransformer, arg[0]);
                case 'readFileStream': return this.onReadFileStream(uriTransformer, arg[0], arg[1]);
            }
            throw new Error(`Unknown event ${event}`);
        }
        //#region File Metadata Resolving
        stat(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            return this.provider.stat(resource);
        }
        readdir(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.readdir(resource);
        }
        //#endregion
        //#region File Reading/Writing
        async readFile(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            const buffer = await this.provider.readFile(resource, opts);
            return buffer_1.VSBuffer.wrap(buffer);
        }
        onReadFileStream(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            const cts = new cancellation_1.CancellationTokenSource();
            const emitter = new event_1.Emitter({
                onDidRemoveLastListener: () => {
                    // Ensure to cancel the read operation when there is no more
                    // listener on the other side to prevent unneeded work.
                    cts.cancel();
                }
            });
            const fileStream = this.provider.readFileStream(resource, opts, cts.token);
            (0, stream_1.listenStream)(fileStream, {
                onData: chunk => emitter.fire(buffer_1.VSBuffer.wrap(chunk)),
                onError: error => emitter.fire(error),
                onEnd: () => {
                    // Forward event
                    emitter.fire('end');
                    // Cleanup
                    emitter.dispose();
                    cts.dispose();
                }
            });
            return emitter.event;
        }
        writeFile(uriTransformer, _resource, content, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.writeFile(resource, content.buffer, opts);
        }
        open(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource, true);
            return this.provider.open(resource, opts);
        }
        close(fd) {
            return this.provider.close(fd);
        }
        async read(fd, pos, length) {
            const buffer = buffer_1.VSBuffer.alloc(length);
            const bufferOffset = 0; // offset is 0 because we create a buffer to read into for each call
            const bytesRead = await this.provider.read(fd, pos, buffer.buffer, bufferOffset, length);
            return [buffer, bytesRead];
        }
        write(fd, pos, data, offset, length) {
            return this.provider.write(fd, pos, data.buffer, offset, length);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(uriTransformer, _resource) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.mkdir(resource);
        }
        delete(uriTransformer, _resource, opts) {
            const resource = this.transformIncoming(uriTransformer, _resource);
            return this.provider.delete(resource, opts);
        }
        rename(uriTransformer, _source, _target, opts) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.rename(source, target, opts);
        }
        copy(uriTransformer, _source, _target, opts) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.copy(source, target, opts);
        }
        //#endregion
        //#region Clone File
        cloneFile(uriTransformer, _source, _target) {
            const source = this.transformIncoming(uriTransformer, _source);
            const target = this.transformIncoming(uriTransformer, _target);
            return this.provider.cloneFile(source, target);
        }
        onFileChange(uriTransformer, sessionId) {
            // We want a specific emitter for the given session so that events
            // from the one session do not end up on the other session. As such
            // we create a `SessionFileWatcher` and a `Emitter` for that session.
            const emitter = new event_1.Emitter({
                onWillAddFirstListener: () => {
                    this.sessionToWatcher.set(sessionId, this.createSessionFileWatcher(uriTransformer, emitter));
                },
                onDidRemoveLastListener: () => {
                    (0, lifecycle_1.dispose)(this.sessionToWatcher.get(sessionId));
                    this.sessionToWatcher.delete(sessionId);
                }
            });
            return emitter.event;
        }
        async watch(uriTransformer, sessionId, req, _resource, opts) {
            const watcher = this.sessionToWatcher.get(sessionId);
            if (watcher) {
                const resource = this.transformIncoming(uriTransformer, _resource);
                const disposable = watcher.watch(req, resource, opts);
                this.watchRequests.set(sessionId + req, disposable);
            }
        }
        async unwatch(sessionId, req) {
            const id = sessionId + req;
            const disposable = this.watchRequests.get(id);
            if (disposable) {
                (0, lifecycle_1.dispose)(disposable);
                this.watchRequests.delete(id);
            }
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, disposable] of this.watchRequests) {
                disposable.dispose();
            }
            this.watchRequests.clear();
            for (const [, disposable] of this.sessionToWatcher) {
                disposable.dispose();
            }
            this.sessionToWatcher.clear();
        }
    }
    exports.AbstractDiskFileSystemProviderChannel = AbstractDiskFileSystemProviderChannel;
    class AbstractSessionFileWatcher extends lifecycle_1.Disposable {
        constructor(uriTransformer, sessionEmitter, logService, environmentService) {
            super();
            this.uriTransformer = uriTransformer;
            this.logService = logService;
            this.environmentService = environmentService;
            this.watcherRequests = new Map();
            // To ensure we use one file watcher per session, we keep a
            // disk file system provider instantiated for this session.
            // The provider is cheap and only stateful when file watching
            // starts.
            //
            // This is important because we want to ensure that we only
            // forward events from the watched paths for this session and
            // not other clients that asked to watch other paths.
            this.fileWatcher = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(this.logService, { watcher: { recursive: this.getRecursiveWatcherOptions(this.environmentService) } }));
            this.registerListeners(sessionEmitter);
        }
        registerListeners(sessionEmitter) {
            const localChangeEmitter = this._register(new event_1.Emitter());
            this._register(localChangeEmitter.event((events) => {
                sessionEmitter.fire(events.map(e => ({
                    resource: this.uriTransformer.transformOutgoingURI(e.resource),
                    type: e.type,
                    cId: e.cId
                })));
            }));
            this._register(this.fileWatcher.onDidChangeFile(events => localChangeEmitter.fire(events)));
            this._register(this.fileWatcher.onDidWatchError(error => sessionEmitter.fire(error)));
        }
        getRecursiveWatcherOptions(environmentService) {
            return undefined; // subclasses can override
        }
        getExtraExcludes(environmentService) {
            return undefined; // subclasses can override
        }
        watch(req, resource, opts) {
            const extraExcludes = this.getExtraExcludes(this.environmentService);
            if (Array.isArray(extraExcludes)) {
                opts.excludes = [...opts.excludes, ...extraExcludes];
            }
            this.watcherRequests.set(req, this.fileWatcher.watch(resource, opts));
            return (0, lifecycle_1.toDisposable)(() => {
                (0, lifecycle_1.dispose)(this.watcherRequests.get(req));
                this.watcherRequests.delete(req);
            });
        }
        dispose() {
            for (const [, disposable] of this.watcherRequests) {
                disposable.dispose();
            }
            this.watcherRequests.clear();
            super.dispose();
        }
    }
    exports.AbstractSessionFileWatcher = AbstractSessionFileWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlclNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS9kaXNrRmlsZVN5c3RlbVByb3ZpZGVyU2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW9CaEc7O09BRUc7SUFDSCxNQUFzQixxQ0FBeUMsU0FBUSxzQkFBVTtRQUVoRixZQUNvQixRQUFnQyxFQUNoQyxVQUF1QjtZQUUxQyxLQUFLLEVBQUUsQ0FBQztZQUhXLGFBQVEsR0FBUixRQUFRLENBQXdCO1lBQ2hDLGVBQVUsR0FBVixVQUFVLENBQWE7WUF5SzNDLFlBQVk7WUFFWix1QkFBdUI7WUFFTixxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBZ0QsQ0FBQztZQUMzRSxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUFxRCxDQUFDO1FBM0s5RixDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQU0sRUFBRSxPQUFlLEVBQUUsR0FBUztZQUN0QyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFbkQsUUFBUSxPQUFPLEVBQUUsQ0FBQztnQkFDakIsS0FBSyxNQUFNLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN0RCxLQUFLLFNBQVMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELEtBQUssTUFBTSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENB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