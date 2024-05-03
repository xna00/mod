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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/map", "vs/base/common/strings", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/resources", "vs/workbench/contrib/files/common/explorerFileNestingTrie", "vs/base/common/types"], function (require, exports, uri_1, extpath_1, path_1, map_1, strings_1, arrays_1, lifecycle_1, decorators_1, event_1, resources_1, explorerFileNestingTrie_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewExplorerItem = exports.ExplorerItem = exports.ExplorerModel = void 0;
    class ExplorerModel {
        constructor(contextService, uriIdentityService, fileService, configService, filesConfigService) {
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeRoots = new event_1.Emitter();
            const setRoots = () => this._roots = this.contextService.getWorkspace().folders
                .map(folder => new ExplorerItem(folder.uri, fileService, configService, filesConfigService, undefined, true, false, false, false, folder.name));
            setRoots();
            this._listener = this.contextService.onDidChangeWorkspaceFolders(() => {
                setRoots();
                this._onDidChangeRoots.fire();
            });
        }
        get roots() {
            return this._roots;
        }
        get onDidChangeRoots() {
            return this._onDidChangeRoots.event;
        }
        /**
         * Returns an array of child stat from this stat that matches with the provided path.
         * Starts matching from the first root.
         * Will return empty array in case the FileStat does not exist.
         */
        findAll(resource) {
            return (0, arrays_1.coalesce)(this.roots.map(root => root.find(resource)));
        }
        /**
         * Returns a FileStat that matches the passed resource.
         * In case multiple FileStat are matching the resource (same folder opened multiple times) returns the FileStat that has the closest root.
         * Will return undefined in case the FileStat does not exist.
         */
        findClosest(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            if (folder) {
                const root = this.roots.find(r => this.uriIdentityService.extUri.isEqual(r.resource, folder.uri));
                if (root) {
                    return root.find(resource);
                }
            }
            return null;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._listener);
        }
    }
    exports.ExplorerModel = ExplorerModel;
    class ExplorerItem {
        constructor(resource, fileService, configService, filesConfigService, _parent, _isDirectory, _isSymbolicLink, _readonly, _locked, _name = (0, resources_1.basenameOrAuthority)(resource), _mtime, _unknown = false) {
            this.resource = resource;
            this.fileService = fileService;
            this.configService = configService;
            this.filesConfigService = filesConfigService;
            this._parent = _parent;
            this._isDirectory = _isDirectory;
            this._isSymbolicLink = _isSymbolicLink;
            this._readonly = _readonly;
            this._locked = _locked;
            this._name = _name;
            this._mtime = _mtime;
            this._unknown = _unknown;
            this.error = undefined;
            this._isExcluded = false;
            this._isDirectoryResolved = false;
        }
        get isExcluded() {
            if (this._isExcluded) {
                return true;
            }
            if (!this._parent) {
                return false;
            }
            return this._parent.isExcluded;
        }
        set isExcluded(value) {
            this._isExcluded = value;
        }
        hasChildren(filter) {
            if (this.hasNests) {
                return this.nestedChildren?.some(c => filter(c)) ?? false;
            }
            else {
                return this.isDirectory;
            }
        }
        get hasNests() {
            return !!(this.nestedChildren?.length);
        }
        get isDirectoryResolved() {
            return this._isDirectoryResolved;
        }
        get isSymbolicLink() {
            return !!this._isSymbolicLink;
        }
        get isDirectory() {
            return !!this._isDirectory;
        }
        get isReadonly() {
            return this.filesConfigService.isReadonly(this.resource, { resource: this.resource, name: this.name, readonly: this._readonly, locked: this._locked });
        }
        get mtime() {
            return this._mtime;
        }
        get name() {
            return this._name;
        }
        get isUnknown() {
            return this._unknown;
        }
        get parent() {
            return this._parent;
        }
        get root() {
            if (!this._parent) {
                return this;
            }
            return this._parent.root;
        }
        get children() {
            return new Map();
        }
        updateName(value) {
            // Re-add to parent since the parent has a name map to children and the name might have changed
            this._parent?.removeChild(this);
            this._name = value;
            this._parent?.addChild(this);
        }
        getId() {
            return this.root.resource.toString() + '::' + this.resource.toString();
        }
        toString() {
            return `ExplorerItem: ${this.name}`;
        }
        get isRoot() {
            return this === this.root;
        }
        static create(fileService, configService, filesConfigService, raw, parent, resolveTo) {
            const stat = new ExplorerItem(raw.resource, fileService, configService, filesConfigService, parent, raw.isDirectory, raw.isSymbolicLink, raw.readonly, raw.locked, raw.name, raw.mtime, !raw.isFile && !raw.isDirectory);
            // Recursively add children if present
            if (stat.isDirectory) {
                // isDirectoryResolved is a very important indicator in the stat model that tells if the folder was fully resolved
                // the folder is fully resolved if either it has a list of children or the client requested this by using the resolveTo
                // array of resource path to resolve.
                stat._isDirectoryResolved = !!raw.children || (!!resolveTo && resolveTo.some((r) => {
                    return (0, resources_1.isEqualOrParent)(r, stat.resource);
                }));
                // Recurse into children
                if (raw.children) {
                    for (let i = 0, len = raw.children.length; i < len; i++) {
                        const child = ExplorerItem.create(fileService, configService, filesConfigService, raw.children[i], stat, resolveTo);
                        stat.addChild(child);
                    }
                }
            }
            return stat;
        }
        /**
         * Merges the stat which was resolved from the disk with the local stat by copying over properties
         * and children. The merge will only consider resolved stat elements to avoid overwriting data which
         * exists locally.
         */
        static mergeLocalWithDisk(disk, local) {
            if (disk.resource.toString() !== local.resource.toString()) {
                return; // Merging only supported for stats with the same resource
            }
            // Stop merging when a folder is not resolved to avoid loosing local data
            const mergingDirectories = disk.isDirectory || local.isDirectory;
            if (mergingDirectories && local._isDirectoryResolved && !disk._isDirectoryResolved) {
                return;
            }
            // Properties
            local.resource = disk.resource;
            if (!local.isRoot) {
                local.updateName(disk.name);
            }
            local._isDirectory = disk.isDirectory;
            local._mtime = disk.mtime;
            local._isDirectoryResolved = disk._isDirectoryResolved;
            local._isSymbolicLink = disk.isSymbolicLink;
            local.error = disk.error;
            // Merge Children if resolved
            if (mergingDirectories && disk._isDirectoryResolved) {
                // Map resource => stat
                const oldLocalChildren = new map_1.ResourceMap();
                local.children.forEach(child => {
                    oldLocalChildren.set(child.resource, child);
                });
                // Clear current children
                local.children.clear();
                // Merge received children
                disk.children.forEach(diskChild => {
                    const formerLocalChild = oldLocalChildren.get(diskChild.resource);
                    // Existing child: merge
                    if (formerLocalChild) {
                        ExplorerItem.mergeLocalWithDisk(diskChild, formerLocalChild);
                        local.addChild(formerLocalChild);
                        oldLocalChildren.delete(diskChild.resource);
                    }
                    // New child: add
                    else {
                        local.addChild(diskChild);
                    }
                });
                oldLocalChildren.forEach(oldChild => {
                    if (oldChild instanceof NewExplorerItem) {
                        local.addChild(oldChild);
                    }
                });
            }
        }
        /**
         * Adds a child element to this folder.
         */
        addChild(child) {
            // Inherit some parent properties to child
            child._parent = this;
            child.updateResource(false);
            this.children.set(this.getPlatformAwareName(child.name), child);
        }
        getChild(name) {
            return this.children.get(this.getPlatformAwareName(name));
        }
        fetchChildren(sortOrder) {
            const nestingConfig = this.configService.getValue({ resource: this.root.resource }).explorer.fileNesting;
            // fast path when the children can be resolved sync
            if (nestingConfig.enabled && this.nestedChildren) {
                return this.nestedChildren;
            }
            return (async () => {
                if (!this._isDirectoryResolved) {
                    // Resolve metadata only when the mtime is needed since this can be expensive
                    // Mtime is only used when the sort order is 'modified'
                    const resolveMetadata = sortOrder === "modified" /* SortOrder.Modified */;
                    this.error = undefined;
                    try {
                        const stat = await this.fileService.resolve(this.resource, { resolveSingleChildDescendants: true, resolveMetadata });
                        const resolved = ExplorerItem.create(this.fileService, this.configService, this.filesConfigService, stat, this);
                        ExplorerItem.mergeLocalWithDisk(resolved, this);
                    }
                    catch (e) {
                        this.error = e;
                        throw e;
                    }
                    this._isDirectoryResolved = true;
                }
                const items = [];
                if (nestingConfig.enabled) {
                    const fileChildren = [];
                    const dirChildren = [];
                    for (const child of this.children.entries()) {
                        child[1].nestedParent = undefined;
                        if (child[1].isDirectory) {
                            dirChildren.push(child);
                        }
                        else {
                            fileChildren.push(child);
                        }
                    }
                    const nested = this.fileNester.nest(fileChildren.map(([name]) => name), this.getPlatformAwareName(this.name));
                    for (const [fileEntryName, fileEntryItem] of fileChildren) {
                        const nestedItems = nested.get(fileEntryName);
                        if (nestedItems !== undefined) {
                            fileEntryItem.nestedChildren = [];
                            for (const name of nestedItems.keys()) {
                                const child = (0, types_1.assertIsDefined)(this.children.get(name));
                                fileEntryItem.nestedChildren.push(child);
                                child.nestedParent = fileEntryItem;
                            }
                            items.push(fileEntryItem);
                        }
                        else {
                            fileEntryItem.nestedChildren = undefined;
                        }
                    }
                    for (const [_, dirEntryItem] of dirChildren.values()) {
                        items.push(dirEntryItem);
                    }
                }
                else {
                    this.children.forEach(child => {
                        items.push(child);
                    });
                }
                return items;
            })();
        }
        get fileNester() {
            if (!this.root._fileNester) {
                const nestingConfig = this.configService.getValue({ resource: this.root.resource }).explorer.fileNesting;
                const patterns = Object.entries(nestingConfig.patterns)
                    .filter(entry => typeof (entry[0]) === 'string' && typeof (entry[1]) === 'string' && entry[0] && entry[1])
                    .map(([parentPattern, childrenPatterns]) => [
                    this.getPlatformAwareName(parentPattern.trim()),
                    childrenPatterns.split(',').map(p => this.getPlatformAwareName(p.trim().replace(/\u200b/g, '').trim()))
                        .filter(p => p !== '')
                ]);
                this.root._fileNester = new explorerFileNestingTrie_1.ExplorerFileNestingTrie(patterns);
            }
            return this.root._fileNester;
        }
        /**
         * Removes a child element from this folder.
         */
        removeChild(child) {
            this.nestedChildren = undefined;
            this.children.delete(this.getPlatformAwareName(child.name));
        }
        forgetChildren() {
            this.children.clear();
            this.nestedChildren = undefined;
            this._isDirectoryResolved = false;
            this._fileNester = undefined;
        }
        getPlatformAwareName(name) {
            return this.fileService.hasCapability(this.resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */) ? name : name.toLowerCase();
        }
        /**
         * Moves this element under a new parent element.
         */
        move(newParent) {
            this.nestedParent?.removeChild(this);
            this._parent?.removeChild(this);
            newParent.removeChild(this); // make sure to remove any previous version of the file if any
            newParent.addChild(this);
            this.updateResource(true);
        }
        updateResource(recursive) {
            if (this._parent) {
                this.resource = (0, resources_1.joinPath)(this._parent.resource, this.name);
            }
            if (recursive) {
                if (this.isDirectory) {
                    this.children.forEach(child => {
                        child.updateResource(true);
                    });
                }
            }
        }
        /**
         * Tells this stat that it was renamed. This requires changes to all children of this stat (if any)
         * so that the path property can be updated properly.
         */
        rename(renamedStat) {
            // Merge a subset of Properties that can change on rename
            this.updateName(renamedStat.name);
            this._mtime = renamedStat.mtime;
            // Update Paths including children
            this.updateResource(true);
        }
        /**
         * Returns a child stat from this stat that matches with the provided path.
         * Will return "null" in case the child does not exist.
         */
        find(resource) {
            // Return if path found
            // For performance reasons try to do the comparison as fast as possible
            const ignoreCase = !this.fileService.hasCapability(resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (resource && this.resource.scheme === resource.scheme && (0, strings_1.equalsIgnoreCase)(this.resource.authority, resource.authority) &&
                (ignoreCase ? (0, strings_1.startsWithIgnoreCase)(resource.path, this.resource.path) : resource.path.startsWith(this.resource.path))) {
                return this.findByPath((0, strings_1.rtrim)(resource.path, path_1.posix.sep), this.resource.path.length, ignoreCase);
            }
            return null; //Unable to find
        }
        findByPath(path, index, ignoreCase) {
            if ((0, extpath_1.isEqual)((0, strings_1.rtrim)(this.resource.path, path_1.posix.sep), path, ignoreCase)) {
                return this;
            }
            if (this.isDirectory) {
                // Ignore separtor to more easily deduct the next name to search
                while (index < path.length && path[index] === path_1.posix.sep) {
                    index++;
                }
                let indexOfNextSep = path.indexOf(path_1.posix.sep, index);
                if (indexOfNextSep === -1) {
                    // If there is no separator take the remainder of the path
                    indexOfNextSep = path.length;
                }
                // The name to search is between two separators
                const name = path.substring(index, indexOfNextSep);
                const child = this.children.get(this.getPlatformAwareName(name));
                if (child) {
                    // We found a child with the given name, search inside it
                    return child.findByPath(path, indexOfNextSep, ignoreCase);
                }
            }
            return null;
        }
    }
    exports.ExplorerItem = ExplorerItem;
    __decorate([
        decorators_1.memoize
    ], ExplorerItem.prototype, "children", null);
    class NewExplorerItem extends ExplorerItem {
        constructor(fileService, configService, filesConfigService, parent, isDirectory) {
            super(uri_1.URI.file(''), fileService, configService, filesConfigService, parent, isDirectory);
            this._isDirectoryResolved = true;
        }
    }
    exports.NewExplorerItem = NewExplorerItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvY29tbW9uL2V4cGxvcmVyTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBc0JoRyxNQUFhLGFBQWE7UUFNekIsWUFDa0IsY0FBd0MsRUFDeEMsa0JBQXVDLEVBQ3hELFdBQXlCLEVBQ3pCLGFBQW9DLEVBQ3BDLGtCQUE4QztZQUo3QixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDeEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUp4QyxzQkFBaUIsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBU3hELE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPO2lCQUM3RSxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNqSixRQUFRLEVBQUUsQ0FBQztZQUVYLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3JFLFFBQVEsRUFBRSxDQUFDO2dCQUNYLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUks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