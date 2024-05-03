/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullFileSystemProvider = void 0;
    class NullFileSystemProvider {
        constructor(disposableFactory = () => lifecycle_1.Disposable.None) {
            this.disposableFactory = disposableFactory;
            this.capabilities = 2048 /* FileSystemProviderCapabilities.Readonly */;
            this._onDidChangeCapabilities = new event_1.Emitter();
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._onDidChangeFile = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChangeFile.event;
        }
        emitFileChangeEvents(changes) {
            this._onDidChangeFile.fire(changes);
        }
        setCapabilities(capabilities) {
            this.capabilities = capabilities;
            this._onDidChangeCapabilities.fire();
        }
        watch(resource, opts) { return this.disposableFactory(); }
        async stat(resource) { return undefined; }
        async mkdir(resource) { return undefined; }
        async readdir(resource) { return undefined; }
        async delete(resource, opts) { return undefined; }
        async rename(from, to, opts) { return undefined; }
        async copy(from, to, opts) { return undefined; }
        async readFile(resource) { return undefined; }
        readFileStream(resource, opts, token) { return undefined; }
        async writeFile(resource, content, opts) { return undefined; }
        async open(resource, opts) { return undefined; }
        async close(fd) { return undefined; }
        async read(fd, pos, data, offset, length) { return undefined; }
        async write(fd, pos, data, offset, length) { return undefined; }
    }
    exports.NullFileSystemProvider = NullFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVsbEZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvdGVzdC9jb21tb24vbnVsbEZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxzQkFBc0I7UUFVbEMsWUFBb0Isb0JBQXVDLEdBQUcsRUFBRSxDQUFDLHNCQUFVLENBQUMsSUFBSTtZQUE1RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQTJDO1lBUmhGLGlCQUFZLHNEQUEyRTtZQUV0RSw2QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3ZELDRCQUF1QixHQUFnQixJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBRW5FLHFCQUFnQixHQUFHLElBQUksZUFBTyxFQUEwQixDQUFDO1lBQ2pFLG9CQUFlLEdBQWtDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7UUFFRixDQUFDO1FBRXJGLG9CQUFvQixDQUFDLE9BQXNCO1lBQzFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELGVBQWUsQ0FBQyxZQUE0QztZQUMzRCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUVqQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFhLEVBQUUsSUFBbUIsSUFBaUIsT0FBTyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0YsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFhLElBQW9CLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztRQUNoRSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQWEsSUFBbUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQy9ELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBYSxJQUFtQyxPQUFPLFNBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbEYsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFhLEVBQUUsSUFBd0IsSUFBbUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzFGLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBUyxFQUFFLEVBQU8sRUFBRSxJQUEyQixJQUFtQixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbEcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFTLEVBQUUsRUFBTyxFQUFFLElBQTJCLElBQW1CLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQWEsSUFBeUIsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLGNBQWMsQ0FBQyxRQUFhLEVBQUUsSUFBNEIsRUFBRSxLQUF3QixJQUFzQyxPQUFPLFNBQVUsQ0FBQyxDQUFDLENBQUM7UUFDOUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFhLEVBQUUsT0FBbUIsRUFBRSxJQUF1QixJQUFtQixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDakgsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFhLEVBQUUsSUFBc0IsSUFBcUIsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBVSxJQUFtQixPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFVLEVBQUUsR0FBVyxFQUFFLElBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQWMsSUFBcUIsT0FBTyxTQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzdILEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBVSxFQUFFLEdBQVcsRUFBRSxJQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjLElBQXFCLE9BQU8sU0FBVSxDQUFDLENBQUMsQ0FBQztLQUM5SDtJQXBDRCx3REFvQ0MifQ==