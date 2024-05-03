define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/ternarySearchTree", "vs/base/common/map"], function (require, exports, event_1, lifecycle_1, files_1, ternarySearchTree_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileUserDataProvider = void 0;
    /**
     * This is a wrapper on top of the local filesystem provider which will
     * 	- Convert the user data resources to file system scheme and vice-versa
     *  - Enforces atomic reads for user data
     */
    class FileUserDataProvider extends lifecycle_1.Disposable {
        constructor(fileSystemScheme, fileSystemProvider, userDataScheme, userDataProfilesService, uriIdentityService, logService) {
            super();
            this.fileSystemScheme = fileSystemScheme;
            this.fileSystemProvider = fileSystemProvider;
            this.userDataScheme = userDataScheme;
            this.userDataProfilesService = userDataProfilesService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.capabilities = this.fileSystemProvider.capabilities;
            this.onDidChangeCapabilities = this.fileSystemProvider.onDidChangeCapabilities;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.watchResources = ternarySearchTree_1.TernarySearchTree.forUris(() => !(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */));
            this.atomicReadWriteResources = new map_1.ResourceSet((uri) => this.uriIdentityService.extUri.getComparisonKey(this.toFileSystemResource(uri)));
            this.updateAtomicReadWritesResources();
            this._register(userDataProfilesService.onDidChangeProfiles(() => this.updateAtomicReadWritesResources()));
            this._register(this.fileSystemProvider.onDidChangeFile(e => this.handleFileChanges(e)));
        }
        updateAtomicReadWritesResources() {
            this.atomicReadWriteResources.clear();
            for (const profile of this.userDataProfilesService.profiles) {
                this.atomicReadWriteResources.add(profile.settingsResource);
                this.atomicReadWriteResources.add(profile.keybindingsResource);
                this.atomicReadWriteResources.add(profile.tasksResource);
                this.atomicReadWriteResources.add(profile.extensionsResource);
            }
        }
        open(resource, opts) {
            return this.fileSystemProvider.open(this.toFileSystemResource(resource), opts);
        }
        close(fd) {
            return this.fileSystemProvider.close(fd);
        }
        read(fd, pos, data, offset, length) {
            return this.fileSystemProvider.read(fd, pos, data, offset, length);
        }
        write(fd, pos, data, offset, length) {
            return this.fileSystemProvider.write(fd, pos, data, offset, length);
        }
        watch(resource, opts) {
            this.watchResources.set(resource, resource);
            const disposable = this.fileSystemProvider.watch(this.toFileSystemResource(resource), opts);
            return (0, lifecycle_1.toDisposable)(() => {
                this.watchResources.delete(resource);
                disposable.dispose();
            });
        }
        stat(resource) {
            return this.fileSystemProvider.stat(this.toFileSystemResource(resource));
        }
        mkdir(resource) {
            return this.fileSystemProvider.mkdir(this.toFileSystemResource(resource));
        }
        rename(from, to, opts) {
            return this.fileSystemProvider.rename(this.toFileSystemResource(from), this.toFileSystemResource(to), opts);
        }
        readFile(resource, opts) {
            return this.fileSystemProvider.readFile(this.toFileSystemResource(resource), opts);
        }
        readFileStream(resource, opts, token) {
            return this.fileSystemProvider.readFileStream(this.toFileSystemResource(resource), opts, token);
        }
        readdir(resource) {
            return this.fileSystemProvider.readdir(this.toFileSystemResource(resource));
        }
        enforceAtomicReadFile(resource) {
            return this.atomicReadWriteResources.has(resource);
        }
        writeFile(resource, content, opts) {
            return this.fileSystemProvider.writeFile(this.toFileSystemResource(resource), content, opts);
        }
        enforceAtomicWriteFile(resource) {
            if (this.atomicReadWriteResources.has(resource)) {
                return { postfix: '.vsctmp' };
            }
            return false;
        }
        delete(resource, opts) {
            return this.fileSystemProvider.delete(this.toFileSystemResource(resource), opts);
        }
        copy(from, to, opts) {
            if ((0, files_1.hasFileFolderCopyCapability)(this.fileSystemProvider)) {
                return this.fileSystemProvider.copy(this.toFileSystemResource(from), this.toFileSystemResource(to), opts);
            }
            throw new Error('copy not supported');
        }
        cloneFile(from, to) {
            if ((0, files_1.hasFileCloneCapability)(this.fileSystemProvider)) {
                return this.fileSystemProvider.cloneFile(this.toFileSystemResource(from), this.toFileSystemResource(to));
            }
            throw new Error('clone not supported');
        }
        handleFileChanges(changes) {
            const userDataChanges = [];
            for (const change of changes) {
                if (change.resource.scheme !== this.fileSystemScheme) {
                    continue; // only interested in file schemes
                }
                const userDataResource = this.toUserDataResource(change.resource);
                if (this.watchResources.findSubstr(userDataResource)) {
                    userDataChanges.push({
                        resource: userDataResource,
                        type: change.type,
                        cId: change.cId
                    });
                }
            }
            if (userDataChanges.length) {
                this.logService.debug('User data changed');
                this._onDidChangeFile.fire(userDataChanges);
            }
        }
        toFileSystemResource(userDataResource) {
            return userDataResource.with({ scheme: this.fileSystemScheme });
        }
        toUserDataResource(fileSystemResource) {
            return fileSystemResource.with({ scheme: this.userDataScheme });
        }
    }
    exports.FileUserDataProvider = FileUserDataProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVVzZXJEYXRhUHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhL2NvbW1vbi9maWxlVXNlckRhdGFQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBZ0JBOzs7O09BSUc7SUFDSCxNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBbUJuRCxZQUNrQixnQkFBd0IsRUFDeEIsa0JBQW1VLEVBQ25VLGNBQXNCLEVBQ3RCLHVCQUFpRCxFQUNqRCxrQkFBdUMsRUFDdkMsVUFBdUI7WUFFeEMsS0FBSyxFQUFFLENBQUM7WUFQUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDeEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFpVDtZQUNuVSxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtZQUN0Qiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQWZoQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUM7WUFDcEQsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHVCQUF1QixDQUFDO1lBRWxFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUNqRixvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFFdEMsbUJBQWMsR0FBRyxxQ0FBaUIsQ0FBQyxPQUFPLENBQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLDhEQUFtRCxDQUFDLENBQUMsQ0FBQztZQUMvSCw2QkFBd0IsR0FBRyxJQUFJLGlCQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUUs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