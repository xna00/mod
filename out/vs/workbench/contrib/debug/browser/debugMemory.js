/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/assert", "vs/platform/files/common/files", "vs/workbench/contrib/debug/common/debug"], function (require, exports, buffer_1, event_1, lifecycle_1, numbers_1, assert_1, files_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugMemoryFileSystemProvider = void 0;
    const rangeRe = /range=([0-9]+):([0-9]+)/;
    class DebugMemoryFileSystemProvider {
        constructor(debugService) {
            this.debugService = debugService;
            this.memoryFdCounter = 0;
            this.fdMemory = new Map();
            this.changeEmitter = new event_1.Emitter();
            /** @inheritdoc */
            this.onDidChangeCapabilities = event_1.Event.None;
            /** @inheritdoc */
            this.onDidChangeFile = this.changeEmitter.event;
            /** @inheritdoc */
            this.capabilities = 0
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */
                | 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */;
            debugService.onDidEndSession(({ session }) => {
                for (const [fd, memory] of this.fdMemory) {
                    if (memory.session === session) {
                        this.close(fd);
                    }
                }
            });
        }
        watch(resource, opts) {
            if (opts.recursive) {
                return (0, lifecycle_1.toDisposable)(() => { });
            }
            const { session, memoryReference, offset } = this.parseUri(resource);
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(session.onDidChangeState(() => {
                if (session.state === 3 /* State.Running */ || session.state === 0 /* State.Inactive */) {
                    this.changeEmitter.fire([{ type: 2 /* FileChangeType.DELETED */, resource }]);
                }
            }));
            disposable.add(session.onDidInvalidateMemory(e => {
                if (e.body.memoryReference !== memoryReference) {
                    return;
                }
                if (offset && (e.body.offset >= offset.toOffset || e.body.offset + e.body.count < offset.fromOffset)) {
                    return;
                }
                this.changeEmitter.fire([{ resource, type: 0 /* FileChangeType.UPDATED */ }]);
            }));
            return disposable;
        }
        /** @inheritdoc */
        stat(file) {
            const { readOnly } = this.parseUri(file);
            return Promise.resolve({
                type: files_1.FileType.File,
                mtime: 0,
                ctime: 0,
                size: 0,
                permissions: readOnly ? files_1.FilePermission.Readonly : undefined,
            });
        }
        /** @inheritdoc */
        mkdir() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        readdir() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        delete() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        rename() {
            throw (0, files_1.createFileSystemProviderError)(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        open(resource, _opts) {
            const { session, memoryReference, offset } = this.parseUri(resource);
            const fd = this.memoryFdCounter++;
            let region = session.getMemory(memoryReference);
            if (offset) {
                region = new MemoryRegionView(region, offset);
            }
            this.fdMemory.set(fd, { session, region });
            return Promise.resolve(fd);
        }
        /** @inheritdoc */
        close(fd) {
            this.fdMemory.get(fd)?.region.dispose();
            this.fdMemory.delete(fd);
            return Promise.resolve();
        }
        /** @inheritdoc */
        async writeFile(resource, content) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw (0, files_1.createFileSystemProviderError)(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const fd = await this.open(resource, { create: false });
            try {
                await this.write(fd, offset.fromOffset, content, 0, content.length);
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async readFile(resource) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw (0, files_1.createFileSystemProviderError)(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const data = new Uint8Array(offset.toOffset - offset.fromOffset);
            const fd = await this.open(resource, { create: false });
            try {
                await this.read(fd, offset.fromOffset, data, 0, data.length);
                return data;
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async read(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const ranges = await memory.region.read(pos, length);
            let readSoFar = 0;
            for (const range of ranges) {
                switch (range.type) {
                    case 1 /* MemoryRangeType.Unreadable */:
                        return readSoFar;
                    case 2 /* MemoryRangeType.Error */:
                        if (readSoFar > 0) {
                            return readSoFar;
                        }
                        else {
                            throw (0, files_1.createFileSystemProviderError)(range.error, files_1.FileSystemProviderErrorCode.Unknown);
                        }
                    case 0 /* MemoryRangeType.Valid */: {
                        const start = Math.max(0, pos - range.offset);
                        const toWrite = range.data.slice(start, Math.min(range.data.byteLength, start + (length - readSoFar)));
                        data.set(toWrite.buffer, offset + readSoFar);
                        readSoFar += toWrite.byteLength;
                        break;
                    }
                    default:
                        (0, assert_1.assertNever)(range);
                }
            }
            return readSoFar;
        }
        /** @inheritdoc */
        write(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return memory.region.write(pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
        parseUri(uri) {
            if (uri.scheme !== debug_1.DEBUG_MEMORY_SCHEME) {
                throw (0, files_1.createFileSystemProviderError)(`Cannot open file with scheme ${uri.scheme}`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const session = this.debugService.getModel().getSession(uri.authority);
            if (!session) {
                throw (0, files_1.createFileSystemProviderError)(`Debug session not found`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            let offset;
            const rangeMatch = rangeRe.exec(uri.query);
            if (rangeMatch) {
                offset = { fromOffset: Number(rangeMatch[1]), toOffset: Number(rangeMatch[2]) };
            }
            const [, memoryReference] = uri.path.split('/');
            return {
                session,
                offset,
                readOnly: !session.capabilities.supportsWriteMemoryRequest,
                sessionId: uri.authority,
                memoryReference: decodeURIComponent(memoryReference),
            };
        }
    }
    exports.DebugMemoryFileSystemProvider = DebugMemoryFileSystemProvider;
    /** A wrapper for a MemoryRegion that references a subset of data in another region. */
    class MemoryRegionView extends lifecycle_1.Disposable {
        constructor(parent, range) {
            super();
            this.parent = parent;
            this.range = range;
            this.invalidateEmitter = new event_1.Emitter();
            this.onDidInvalidate = this.invalidateEmitter.event;
            this.width = this.range.toOffset - this.range.fromOffset;
            this.writable = parent.writable;
            this._register(parent);
            this._register(parent.onDidInvalidate(e => {
                const fromOffset = (0, numbers_1.clamp)(e.fromOffset - range.fromOffset, 0, this.width);
                const toOffset = (0, numbers_1.clamp)(e.toOffset - range.fromOffset, 0, this.width);
                if (toOffset > fromOffset) {
                    this.invalidateEmitter.fire({ fromOffset, toOffset });
                }
            }));
        }
        read(fromOffset, toOffset) {
            if (fromOffset < 0) {
                throw new RangeError(`Invalid fromOffset: ${fromOffset}`);
            }
            return this.parent.read(this.range.fromOffset + fromOffset, this.range.fromOffset + Math.min(toOffset, this.width));
        }
        write(offset, data) {
            return this.parent.write(this.range.fromOffset + offset, data);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNZW1vcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2Jyb3dzZXIvZGVidWdNZW1vcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQU0sT0FBTyxHQUFHLHlCQUF5QixDQUFDO0lBRTFDLE1BQWEsNkJBQTZCO1FBZ0J6QyxZQUE2QixZQUEyQjtZQUEzQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQWZoRCxvQkFBZSxHQUFHLENBQUMsQ0FBQztZQUNYLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkQsQ0FBQztZQUNoRixrQkFBYSxHQUFHLElBQUksZUFBTyxFQUEwQixDQUFDO1lBRXZFLGtCQUFrQjtZQUNGLDRCQUF1QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFckQsa0JBQWtCO1lBQ0Ysb0JBQWUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUUzRCxrQkFBa0I7WUFDRixpQkFBWSxHQUFHLENBQUM7NkVBQ21COytFQUNLLENBQUM7WUFHeEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtnQkFDNUMsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRSxDQUFDO3dCQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNoQixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxLQUFLLENBQUMsUUFBYSxFQUFFLElBQW1CO1lBQzlDLElBQUksSUFBSSxDQUFDLFNBQVMs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