/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/platform/files/common/watcher"], function (require, exports, buffer_1, errorMessage_1, errors_1, event_1, lifecycle_1, stream_1, uuid_1, files_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderClient = exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = void 0;
    exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = 'localFilesystem';
    /**
     * An implementation of a local disk file system provider
     * that is backed by a `IChannel` and thus implemented via
     * IPC on a different process.
     */
    class DiskFileSystemProviderClient extends lifecycle_1.Disposable {
        constructor(channel, extraCapabilities) {
            super();
            this.channel = channel;
            this.extraCapabilities = extraCapabilities;
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Watching
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChange.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            // The contract for file watching via remote is to identify us
            // via a unique but readonly session ID. Since the remote is
            // managing potentially many watchers from different clients,
            // this helps the server to properly partition events to the right
            // clients.
            this.sessionId = (0, uuid_1.generateUuid)();
            this.registerFileChangeListeners();
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                        65536 /* FileSystemProviderCapabilities.FileAtomicDelete */ |
                        131072 /* FileSystemProviderCapabilities.FileClone */;
                if (this.extraCapabilities.pathCaseSensitive) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
                if (this.extraCapabilities.trash) {
                    this._capabilities |= 4096 /* FileSystemProviderCapabilities.Trash */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return this.channel.call('stat', [resource]);
        }
        readdir(resource) {
            return this.channel.call('readdir', [resource]);
        }
        //#endregion
        //#region File Reading/Writing
        async readFile(resource, opts) {
            const { buffer } = await this.channel.call('readFile', [resource, opts]);
            return buffer;
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            const disposables = new lifecycle_1.DisposableStore();
            // Reading as file stream goes through an event to the remote side
            disposables.add(this.channel.listen('readFileStream', [resource, opts])(dataOrErrorOrEnd => {
                // data
                if (dataOrErrorOrEnd instanceof buffer_1.VSBuffer) {
                    stream.write(dataOrErrorOrEnd.buffer);
                }
                // end or error
                else {
                    if (dataOrErrorOrEnd === 'end') {
                        stream.end();
                    }
                    else {
                        let error;
                        // Take Error as is if type matches
                        if (dataOrErrorOrEnd instanceof Error) {
                            error = dataOrErrorOrEnd;
                        }
                        // Otherwise, try to deserialize into an error.
                        // Since we communicate via IPC, we cannot be sure
                        // that Error objects are properly serialized.
                        else {
                            const errorCandidate = dataOrErrorOrEnd;
                            error = (0, files_1.createFileSystemProviderError)(errorCandidate.message ?? (0, errorMessage_1.toErrorMessage)(errorCandidate), errorCandidate.code ?? files_1.FileSystemProviderErrorCode.Unknown);
                        }
                        stream.error(error);
                        stream.end();
                    }
                    // Signal to the remote side that we no longer listen
                    disposables.dispose();
                }
            }));
            // Support cancellation
            disposables.add(token.onCancellationRequested(() => {
                // Ensure to end the stream properly with an error
                // to indicate the cancellation.
                stream.error((0, errors_1.canceled)());
                stream.end();
                // Ensure to dispose the listener upon cancellation. This will
                // bubble through the remote side as event and allows to stop
                // reading the file.
                disposables.dispose();
            }));
            return stream;
        }
        writeFile(resource, content, opts) {
            return this.channel.call('writeFile', [resource, buffer_1.VSBuffer.wrap(content), opts]);
        }
        open(resource, opts) {
            return this.channel.call('open', [resource, opts]);
        }
        close(fd) {
            return this.channel.call('close', [fd]);
        }
        async read(fd, pos, data, offset, length) {
            const [bytes, bytesRead] = await this.channel.call('read', [fd, pos, length]);
            // copy back the data that was written into the buffer on the remote
            // side. we need to do this because buffers are not referenced by
            // pointer, but only by value and as such cannot be directly written
            // to from the other process.
            data.set(bytes.buffer.slice(0, bytesRead), offset);
            return bytesRead;
        }
        write(fd, pos, data, offset, length) {
            return this.channel.call('write', [fd, pos, buffer_1.VSBuffer.wrap(data), offset, length]);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return this.channel.call('mkdir', [resource]);
        }
        delete(resource, opts) {
            return this.channel.call('delete', [resource, opts]);
        }
        rename(resource, target, opts) {
            return this.channel.call('rename', [resource, target, opts]);
        }
        copy(resource, target, opts) {
            return this.channel.call('copy', [resource, target, opts]);
        }
        //#endregion
        //#region Clone File
        cloneFile(resource, target) {
            return this.channel.call('cloneFile', [resource, target]);
        }
        registerFileChangeListeners() {
            // The contract for file changes is that there is one listener
            // for both events and errors from the watcher. So we need to
            // unwrap the event from the remote and emit through the proper
            // emitter.
            this._register(this.channel.listen('fileChange', [this.sessionId])(eventsOrError => {
                if (Array.isArray(eventsOrError)) {
                    const events = eventsOrError;
                    this._onDidChange.fire((0, watcher_1.reviveFileChanges)(events));
                }
                else {
                    const error = eventsOrError;
                    this._onDidWatchError.fire(error);
                }
            }));
        }
        watch(resource, opts) {
            // Generate a request UUID to correlate the watcher
            // back to us when we ask to dispose the watcher later.
            const req = (0, uuid_1.generateUuid)();
            this.channel.call('watch', [this.sessionId, req, resource, opts]);
            return (0, lifecycle_1.toDisposable)(() => this.channel.call('unwatch', [this.sessionId, req]));
        }
    }
    exports.DiskFileSystemProviderClient = DiskFileSystemProviderClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvY29tbW9uL2Rpc2tGaWxlU3lzdGVtUHJvdmlkZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZW5GLFFBQUEsOEJBQThCLEdBQUcsaUJBQWlCLENBQUM7SUFFaEU7Ozs7T0FJRztJQUNILE1BQWEsNEJBQTZCLFNBQVEsc0JBQVU7UUFRM0QsWUFDa0IsT0FBaUIsRUFDakIsaUJBQW1FO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBSFMsWUFBTyxHQUFQLE9BQU8sQ0FBVTtZQUNqQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtEO1lBT3JGLDJCQUEyQjtZQUVsQiw0QkFBdUIsR0FBZ0IsYUFBSyxDQUFDLElBQUksQ0FBQztZQXFLM0QsWUFBWTtZQUVaLHVCQUF1QjtZQUVOLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQzdFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFbEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDakUsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRXZELDhEQUE4RDtZQUM5RCw0REFBNEQ7WUFDNUQsNkRBQTZEO1lBQzdELGtFQUFrRTtZQUNsRSxXQUFXO1lBQ00sY0FBUyxHQUFHLElBQUEsbUJBQVksR0FBRSxDQUFDO1lBekwzQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBT0QsSUFBSSxZQUFZO1lBQ2YsSUFBSSxDQUFDLElBQUks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