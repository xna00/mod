/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, resources_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryFileSystemProvider = void 0;
    /**
     * A wrapper around a standard file system provider
     * that is entirely readonly.
     */
    class LocalHistoryFileSystemProvider {
        static { this.SCHEMA = 'vscode-local-history'; }
        static toLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = {
                location: resource.location.toString(true),
                associatedResource: resource.associatedResource.toString(true)
            };
            // Try to preserve the associated resource as much as possible
            // and only keep the `query` part dynamic. This enables other
            // components (e.g. other timeline providers) to continue
            // providing timeline entries even when our resource is active.
            return resource.associatedResource.with({
                scheme: LocalHistoryFileSystemProvider.SCHEMA,
                query: JSON.stringify(serializedLocalHistoryResource)
            });
        }
        static fromLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = JSON.parse(resource.query);
            return {
                location: uri_1.URI.parse(serializedLocalHistoryResource.location),
                associatedResource: uri_1.URI.parse(serializedLocalHistoryResource.associatedResource)
            };
        }
        static { this.EMPTY_RESOURCE = uri_1.URI.from({ scheme: LocalHistoryFileSystemProvider.SCHEMA, path: '/empty' }); }
        static { this.EMPTY = {
            location: LocalHistoryFileSystemProvider.EMPTY_RESOURCE,
            associatedResource: LocalHistoryFileSystemProvider.EMPTY_RESOURCE
        }; }
        get capabilities() {
            return 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 2048 /* FileSystemProviderCapabilities.Readonly */;
        }
        constructor(fileService) {
            this.fileService = fileService;
            this.mapSchemeToProvider = new Map();
            //#endregion
            //#region Unsupported File Operations
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        async withProvider(resource) {
            const scheme = resource.scheme;
            let providerPromise = this.mapSchemeToProvider.get(scheme);
            if (!providerPromise) {
                // Resolve early when provider already exists
                const provider = this.fileService.getProvider(scheme);
                if (provider) {
                    providerPromise = Promise.resolve(provider);
                }
                // Otherwise wait for registration
                else {
                    providerPromise = new Promise(resolve => {
                        const disposable = this.fileService.onDidChangeFileSystemProviderRegistrations(e => {
                            if (e.added && e.provider && e.scheme === scheme) {
                                disposable.dispose();
                                resolve(e.provider);
                            }
                        });
                    });
                }
                this.mapSchemeToProvider.set(scheme, providerPromise);
            }
            return providerPromise;
        }
        //#region Supported File Operations
        async stat(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return { type: files_1.FileType.File, ctime: 0, mtime: 0, size: 0 };
            }
            // Otherwise delegate to provider
            return (await this.withProvider(location)).stat(location);
        }
        async readFile(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return buffer_1.VSBuffer.fromString('').buffer;
            }
            // Otherwise delegate to provider
            const provider = await this.withProvider(location);
            if ((0, files_1.hasReadWriteCapability)(provider)) {
                return provider.readFile(location);
            }
            throw new Error('Unsupported');
        }
        async writeFile(resource, content, opts) { }
        async mkdir(resource) { }
        async readdir(resource) { return []; }
        async rename(from, to, opts) { }
        async delete(resource, opts) { }
        watch(resource, opts) { return lifecycle_1.Disposable.None; }
    }
    exports.LocalHistoryFileSystemProvider = LocalHistoryFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxIaXN0b3J5RmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9sb2NhbEhpc3RvcnkvYnJvd3Nlci9sb2NhbEhpc3RvcnlGaWxlU3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRzs7O09BR0c7SUFDSCxNQUFhLDhCQUE4QjtpQkFFMUIsV0FBTSxHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtRQUVoRCxNQUFNLENBQUMsd0JBQXdCLENBQUMsUUFBK0I7WUFDOUQsTUFBTSw4QkFBOEIsR0FBb0M7Z0JBQ3ZFLFFBQVEsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQzFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2FBQzlELENBQUM7WUFFRiw4REFBOEQ7WUFDOUQsNkRBQTZEO1lBQzdELHlEQUF5RDtZQUN6RCwrREFBK0Q7WUFDL0QsT0FBTyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsOEJBQThCLENBQUMsTUFBTTtnQkFDN0MsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUM7YUFDckQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxRQUFhO1lBQzlDLE1BQU0sOEJBQThCLEdBQW9DLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRW5HLE9BQU87Z0JBQ04sUUFBUSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsOEJBQThCLENBQUMsUUFBUSxDQUFDO2dCQUM1RCxrQkFBa0Is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