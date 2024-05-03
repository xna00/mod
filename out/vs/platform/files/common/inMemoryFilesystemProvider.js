/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/stream", "vs/platform/files/common/files"], function (require, exports, buffer_1, event_1, lifecycle_1, resources, stream_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryFileSystemProvider = void 0;
    class File {
        constructor(name) {
            this.type = files_1.FileType.File;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
        }
    }
    class Directory {
        constructor(name) {
            this.type = files_1.FileType.Directory;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
            this.entries = new Map();
        }
    }
    class InMemoryFileSystemProvider extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.memoryFdCounter = 0;
            this.fdMemory = new Map();
            this._onDidChangeCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.root = new Directory('');
            // --- manage file events
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._bufferedChanges = [];
        }
        get capabilities() { return this._capabilities; }
        setReadOnly(readonly) {
            const isReadonly = !!(this._capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */);
            if (readonly !== isReadonly) {
                this._capabilities = readonly ? 2048 /* FileSystemProviderCapabilities.Readonly */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ | 2 /* FileSystemProviderCapabilities.FileReadWrite */
                    : 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                this._onDidChangeCapabilities.fire();
            }
        }
        // --- manage file metadata
        async stat(resource) {
            return this._lookup(resource, false);
        }
        async readdir(resource) {
            const entry = this._lookupAsDirectory(resource, false);
            const result = [];
            entry.entries.forEach((child, name) => result.push([name, child.type]));
            return result;
        }
        // --- manage file contents
        async readFile(resource) {
            const data = this._lookupAsFile(resource, false).data;
            if (data) {
                return data;
            }
            throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        readFileStream(resource) {
            const data = this._lookupAsFile(resource, false).data;
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            stream.end(data);
            return stream;
        }
        async writeFile(resource, content, opts) {
            const basename = resources.basename(resource);
            const parent = this._lookupParentDirectory(resource);
            let entry = parent.entries.get(basename);
            if (entry instanceof Directory) {
                throw (0, files_1.createFileSystemProviderError)('file is directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
            }
            if (!entry && !opts.create) {
                throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            if (entry && opts.create && !opts.overwrite) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            if (!entry) {
                entry = new File(basename);
                parent.entries.set(basename, entry);
                this._fireSoon({ type: 1 /* FileChangeType.ADDED */, resource });
            }
            entry.mtime = Date.now();
            entry.size = content.byteLength;
            entry.data = content;
            this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource });
        }
        // file open/read/write/close
        open(resource, opts) {
            const data = this._lookupAsFile(resource, false).data;
            if (data) {
                const fd = this.memoryFdCounter++;
                this.fdMemory.set(fd, data);
                return Promise.resolve(fd);
            }
            throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        close(fd) {
            this.fdMemory.delete(fd);
            return Promise.resolve();
        }
        read(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const toWrite = buffer_1.VSBuffer.wrap(memory).slice(pos, pos + length);
            data.set(toWrite.buffer, offset);
            return Promise.resolve(toWrite.byteLength);
        }
        write(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw (0, files_1.createFileSystemProviderError)(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const toWrite = buffer_1.VSBuffer.wrap(data).slice(offset, offset + length);
            memory.set(toWrite.buffer, pos);
            return Promise.resolve(toWrite.byteLength);
        }
        // --- manage files/folders
        async rename(from, to, opts) {
            if (!opts.overwrite && this._lookup(to, true)) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            const entry = this._lookup(from, false);
            const oldParent = this._lookupParentDirectory(from);
            const newParent = this._lookupParentDirectory(to);
            const newName = resources.basename(to);
            oldParent.entries.delete(entry.name);
            entry.name = newName;
            newParent.entries.set(newName, entry);
            this._fireSoon({ type: 2 /* FileChangeType.DELETED */, resource: from }, { type: 1 /* FileChangeType.ADDED */, resource: to });
        }
        async delete(resource, opts) {
            const dirname = resources.dirname(resource);
            const basename = resources.basename(resource);
            const parent = this._lookupAsDirectory(dirname, false);
            if (parent.entries.has(basename)) {
                parent.entries.delete(basename);
                parent.mtime = Date.now();
                parent.size -= 1;
                this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource: dirname }, { resource, type: 2 /* FileChangeType.DELETED */ });
            }
        }
        async mkdir(resource) {
            if (this._lookup(resource, true)) {
                throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            const basename = resources.basename(resource);
            const dirname = resources.dirname(resource);
            const parent = this._lookupAsDirectory(dirname, false);
            const entry = new Directory(basename);
            parent.entries.set(entry.name, entry);
            parent.mtime = Date.now();
            parent.size += 1;
            this._fireSoon({ type: 0 /* FileChangeType.UPDATED */, resource: dirname }, { type: 1 /* FileChangeType.ADDED */, resource });
        }
        _lookup(uri, silent) {
            const parts = uri.path.split('/');
            let entry = this.root;
            for (const part of parts) {
                if (!part) {
                    continue;
                }
                let child;
                if (entry instanceof Directory) {
                    child = entry.entries.get(part);
                }
                if (!child) {
                    if (!silent) {
                        throw (0, files_1.createFileSystemProviderError)('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    else {
                        return undefined;
                    }
                }
                entry = child;
            }
            return entry;
        }
        _lookupAsDirectory(uri, silent) {
            const entry = this._lookup(uri, silent);
            if (entry instanceof Directory) {
                return entry;
            }
            throw (0, files_1.createFileSystemProviderError)('file not a directory', files_1.FileSystemProviderErrorCode.FileNotADirectory);
        }
        _lookupAsFile(uri, silent) {
            const entry = this._lookup(uri, silent);
            if (entry instanceof File) {
                return entry;
            }
            throw (0, files_1.createFileSystemProviderError)('file is a directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
        }
        _lookupParentDirectory(uri) {
            const dirname = resources.dirname(uri);
            return this._lookupAsDirectory(dirname, false);
        }
        watch(resource, opts) {
            // ignore, fires for all changes...
            return lifecycle_1.Disposable.None;
        }
        _fireSoon(...changes) {
            this._bufferedChanges.push(...changes);
            if (this._fireSoonHandle) {
                clearTimeout(this._fireSoonHandle);
            }
            this._fireSoonHandle = setTimeout(() => {
                this._onDidChangeFile.fire(this._bufferedChanges);
                this._bufferedChanges.length = 0;
            }, 5);
        }
        dispose() {
            super.dispose();
            this.fdMemory.clear();
        }
    }
    exports.InMemoryFileSystemProvider = InMemoryFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5NZW1vcnlGaWxlc3lzdGVtUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9pbk1lbW9yeUZpbGVzeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBTSxJQUFJO1FBVVQsWUFBWSxJQUFZO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQVEsQ0FBQyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO0tBQ0Q7SUFFRCxNQUFNLFNBQVM7UUFVZCxZQUFZLElBQVk7WUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxnQkFBUSxDQUFDLFNBQVMsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztZQUNkLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQ0Q7SUFJRCxNQUFhLDBCQUEyQixTQUFRLHNCQUFVO1FBQTFEOztZQVFTLG9CQUFlLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsYUFBUSxHQUFHLElBQUksR0FBRyxFQUFzQixDQUFDO1lBQ2xELDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzlELDRCQUF1QixHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFFL0Qsa0JBQWEsR0FBRyxrSEFBK0YsQ0FBQztZQVl4SCxTQUFJLEdBQUcsSUFBSSxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7WUFvTXpCLHlCQUF5QjtZQUVSLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUNqRixvQkFBZSxHQUFrQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRTlFLHFCQUFnQixHQUFrQixFQUFFLENBQUM7UUEwQjlDLENBQUM7UUE5T0EsSUFBSSxZQUFZLEtBQXFDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFFakYsV0FBVyxDQUFDLFFBQWlCO1lBQzVCLE1BQU0sVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLHFEQUEwQyxDQUFDLENBQUM7WUFDcEYsSUFBSSxRQUFRLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxnSEFBMEYsdURBQStDO29CQUN4SyxDQUFDLENBQUMsa0hBQStGLENBQUM7Z0JBQ25HLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QyxDQUFDO1FBQ0YsQ0FBQztRQUlELDJCQUEyQjtRQUUzQixLQUFLLENBQUMsSUFBSSxDQUFDLFFBQWE7WUFDdkIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFhO1lBQzFCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxNQUFNLEdBQXlCLEVBQUUsQ0FBQztZQUN4QyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RSxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCwyQkFBMkI7UUFFM0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFhO1lBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN0RCxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxnQkFBZ0IsRUFBRSxtQ0FBMkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNqRyxDQUFDO1FBRUQsY0FBYyxDQUFDLFFBQWE7WUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRXRELE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQWtCLEVBQWEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxpQkFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JILE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFakIsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFhLEVBQUUsT0FBbUIsRUFBRSxJQUF1QjtZQUMxRSxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QyxJQUFJLEtBQUssWUFBWSxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFBLHFDQUE2QixFQUFDLG1CQUFtQixFQUFFLG1DQUEyQixDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDeEcsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxnQkFBZ0IsRUFBRSxtQ0FBMkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNqRyxDQUFDO1lBQ0QsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDN0MsTUFBTSxJQUFBLHFDQUE2QixFQUFDLHFCQUFxQixFQUFFLG1DQUEyQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLDhCQUFzQixFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUNELEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ3pCLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUNoQyxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQztZQUVyQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFFRCw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLFFBQWEsRUFBRSxJQUFzQjtZQUN6QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDdEQsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDVixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDNUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFDRCxNQUFNLElBQUEscUNBQTZCLEVBQUMsZ0JBQWdCLEVBQUUsbUNBQTJCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakcsQ0FBQztRQUVELEtBQUssQ0FBQyxFQUFVO1lBQ2YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFVLEVBQUUsR0FBVyxFQUFFLElBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQWM7WUFDN0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxtQ0FBbUMsRUFBRSxtQ0FBMkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuSCxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsaUJBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELEtBQUssQ0FBQyxFQUFVLEVBQUUsR0FBVyxFQUFFLElBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQWM7WUFDOUUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxtQ0FBbUMsRUFBRSxtQ0FBMkIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNuSCxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsaUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDbkUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELDJCQUEyQjtRQUUzQixLQUFLLENBQUMsTUFBTSxDQUFDLElBQVMsRUFBRSxFQUFPLEVBQUUsSUFBMkI7WUFDM0QsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFBLHFDQUE2QixFQUFDLHFCQUFxQixFQUFFLG1DQUEyQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFcEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFdkMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLEtBQUssQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO1lBQ3JCLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUV0QyxJQUFJLENBQUMsU0FBUyxDQUNiLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQ2hELEVBQUUsSUFBSSw4QkFBc0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQzVDLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFhLEVBQUUsSUFBd0I7WUFDbkQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzFCLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO2dCQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxnQ0FBd0IsRUFBRSxDQUFDLENBQUM7WUFDakgsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWE7WUFDeEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUEscUNBQTZCLEVBQUMscUJBQXFCLEVBQUUsbUNBQTJCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDcEcsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDOUMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXZELE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDMUIsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksZ0NBQXdCLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSw4QkFBc0IsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQy9HLENBQUM7UUFNTyxPQUFPLENBQUMsR0FBUSxFQUFFLE1BQWU7WUFDeEMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDbEMsSUFBSSxLQUFLLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM3QixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ1gsU0FBUztnQkFDVixDQUFDO2dCQUNELElBQUksS0FBd0IsQ0FBQztnQkFDN0IsSUFBSSxLQUFLLFlBQVksU0FBUyxFQUFFLENBQUM7b0JBQ2hDLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDakMsQ0FBQztnQkFDRCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNiLE1BQU0sSUFBQSxxQ0FBNkIsRUFBQyxnQkFBZ0IsRUFBRSxtQ0FBMkIsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDakcsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLE9BQU8sU0FBUyxDQUFDO29CQUNsQixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNmLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxHQUFRLEVBQUUsTUFBZTtZQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLEtBQUssWUFBWSxTQUFTLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxJQUFBLHFDQUE2QixFQUFDLHNCQUFzQixFQUFFLG1DQUEyQixDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUVPLGFBQWEsQ0FBQyxHQUFRLEVBQUUsTUFBZTtZQUM5QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLEtBQUssWUFBWSxJQUFJLEVBQUUsQ0FBQztnQkFDM0IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsTUFBTSxJQUFBLHFDQUE2QixFQUFDLHFCQUFxQixFQUFFLG1DQUEyQixDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDMUcsQ0FBQztRQUVPLHNCQUFzQixDQUFDLEdBQVE7WUFDdEMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN2QyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQVVELEtBQUssQ0FBQyxRQUFhLEVBQUUsSUFBbUI7WUFDdkMsbUNBQW1DO1lBQ25DLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVPLFNBQVMsQ0FBQyxHQUFHLE9BQXNCO1lBQzFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztZQUV2QyxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDMUIsWUFBWSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNwQyxDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUN0QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNsQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRVEsT0FBTztZQUNmLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLENBQUM7S0FDRDtJQTVQRCxnRUE0UEMifQ==