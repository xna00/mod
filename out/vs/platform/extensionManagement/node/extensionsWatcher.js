/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, lifecycle_1, map_1, extensionManagementUtil_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsWatcher = void 0;
    class ExtensionsWatcher extends lifecycle_1.Disposable {
        constructor(extensionManagementService, extensionsScannerService, userDataProfilesService, extensionsProfileScannerService, uriIdentityService, fileService, logService) {
            super();
            this.extensionManagementService = extensionManagementService;
            this.extensionsScannerService = extensionsScannerService;
            this.userDataProfilesService = userDataProfilesService;
            this.extensionsProfileScannerService = extensionsProfileScannerService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.logService = logService;
            this._onDidChangeExtensionsByAnotherSource = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsByAnotherSource = this._onDidChangeExtensionsByAnotherSource.event;
            this.allExtensions = new Map;
            this.extensionsProfileWatchDisposables = this._register(new lifecycle_1.DisposableMap());
            this.initialize().then(null, error => logService.error(error));
        }
        async initialize() {
            await this.extensionsScannerService.initializeDefaultProfileExtensions();
            await this.onDidChangeProfiles(this.userDataProfilesService.profiles);
            this.registerListeners();
            await this.uninstallExtensionsNotInProfiles();
        }
        registerListeners() {
            this._register(this.userDataProfilesService.onDidChangeProfiles(e => this.onDidChangeProfiles(e.added)));
            this._register(this.extensionsProfileScannerService.onAddExtensions(e => this.onAddExtensions(e)));
            this._register(this.extensionsProfileScannerService.onDidAddExtensions(e => this.onDidAddExtensions(e)));
            this._register(this.extensionsProfileScannerService.onRemoveExtensions(e => this.onRemoveExtensions(e)));
            this._register(this.extensionsProfileScannerService.onDidRemoveExtensions(e => this.onDidRemoveExtensions(e)));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
        }
        async onDidChangeProfiles(added) {
            try {
                if (added.length) {
                    await Promise.all(added.map(profile => {
                        this.extensionsProfileWatchDisposables.set(profile.id, (0, lifecycle_1.combinedDisposable)(this.fileService.watch(this.uriIdentityService.extUri.dirname(profile.extensionsResource)), 
                        // Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
                        this.fileService.watch(profile.extensionsResource)));
                        return this.populateExtensionsFromProfile(profile.extensionsResource);
                    }));
                }
            }
            catch (error) {
                this.logService.error(error);
                throw error;
            }
        }
        async onAddExtensions(e) {
            for (const extension of e.extensions) {
                this.addExtensionWithKey(this.getKey(extension.identifier, extension.version), e.profileLocation);
            }
        }
        async onDidAddExtensions(e) {
            for (const extension of e.extensions) {
                const key = this.getKey(extension.identifier, extension.version);
                if (e.error) {
                    this.removeExtensionWithKey(key, e.profileLocation);
                }
                else {
                    this.addExtensionWithKey(key, e.profileLocation);
                }
            }
        }
        async onRemoveExtensions(e) {
            for (const extension of e.extensions) {
                this.removeExtensionWithKey(this.getKey(extension.identifier, extension.version), e.profileLocation);
            }
        }
        async onDidRemoveExtensions(e) {
            const extensionsToUninstall = [];
            const promises = [];
            for (const extension of e.extensions) {
                const key = this.getKey(extension.identifier, extension.version);
                if (e.error) {
                    this.addExtensionWithKey(key, e.profileLocation);
                }
                else {
                    this.removeExtensionWithKey(key, e.profileLocation);
                    if (!this.allExtensions.has(key)) {
                        this.logService.debug('Extension is removed from all profiles', extension.identifier.id, extension.version);
                        promises.push(this.extensionManagementService.scanInstalledExtensionAtLocation(extension.location)
                            .then(result => {
                            if (result) {
                                extensionsToUninstall.push(result);
                            }
                            else {
                                this.logService.info('Extension not found at the location', extension.location.toString());
                            }
                        }, error => this.logService.error(error)));
                    }
                }
            }
            try {
                await Promise.all(promises);
                if (extensionsToUninstall.length) {
                    await this.uninstallExtensionsNotInProfiles(extensionsToUninstall);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        onDidFilesChange(e) {
            for (const profile of this.userDataProfilesService.profiles) {
                if (e.contains(profile.extensionsResource, 0 /* FileChangeType.UPDATED */, 1 /* FileChangeType.ADDED */)) {
                    this.onDidExtensionsProfileChange(profile.extensionsResource);
                }
            }
        }
        async onDidExtensionsProfileChange(profileLocation) {
            const added = [], removed = [];
            const extensions = await this.extensionsProfileScannerService.scanProfileExtensions(profileLocation);
            const extensionKeys = new Set();
            const cached = new Set();
            for (const [key, profiles] of this.allExtensions) {
                if (profiles.has(profileLocation)) {
                    cached.add(key);
                }
            }
            for (const extension of extensions) {
                const key = this.getKey(extension.identifier, extension.version);
                extensionKeys.add(key);
                if (!cached.has(key)) {
                    added.push(extension.identifier);
                    this.addExtensionWithKey(key, profileLocation);
                }
            }
            for (const key of cached) {
                if (!extensionKeys.has(key)) {
                    const extension = this.fromKey(key);
                    if (extension) {
                        removed.push(extension.identifier);
                        this.removeExtensionWithKey(key, profileLocation);
                    }
                }
            }
            if (added.length || removed.length) {
                this._onDidChangeExtensionsByAnotherSource.fire({ added: added.length ? { extensions: added, profileLocation } : undefined, removed: removed.length ? { extensions: removed, profileLocation } : undefined });
            }
        }
        async populateExtensionsFromProfile(extensionsProfileLocation) {
            const extensions = await this.extensionsProfileScannerService.scanProfileExtensions(extensionsProfileLocation);
            for (const extension of extensions) {
                this.addExtensionWithKey(this.getKey(extension.identifier, extension.version), extensionsProfileLocation);
            }
        }
        async uninstallExtensionsNotInProfiles(toUninstall) {
            if (!toUninstall) {
                const installed = await this.extensionManagementService.scanAllUserInstalledExtensions();
                toUninstall = installed.filter(installedExtension => !this.allExtensions.has(this.getKey(installedExtension.identifier, installedExtension.manifest.version)));
            }
            if (toUninstall.length) {
                await this.extensionManagementService.markAsUninstalled(...toUninstall);
            }
        }
        addExtensionWithKey(key, extensionsProfileLocation) {
            let profiles = this.allExtensions.get(key);
            if (!profiles) {
                this.allExtensions.set(key, profiles = new map_1.ResourceSet((uri) => this.uriIdentityService.extUri.getComparisonKey(uri)));
            }
            profiles.add(extensionsProfileLocation);
        }
        removeExtensionWithKey(key, profileLocation) {
            const profiles = this.allExtensions.get(key);
            if (profiles) {
                profiles.delete(profileLocation);
            }
            if (!profiles?.size) {
                this.allExtensions.delete(key);
            }
        }
        getKey(identifier, version) {
            return `${extensions_1.ExtensionIdentifier.toKey(identifier.id)}@${version}`;
        }
        fromKey(key) {
            const [id, version] = (0, extensionManagementUtil_1.getIdAndVersion)(key);
            return version ? { identifier: { id }, version } : undefined;
        }
    }
    exports.ExtensionsWatcher = ExtensionsWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1dhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvbm9kZS9leHRlbnNpb25zV2F0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQmhHLE1BQWEsaUJBQWtCLFNBQVEsc0JBQVU7UUFRaEQsWUFDa0IsMEJBQW1FLEVBQ25FLHdCQUFtRCxFQUNuRCx1QkFBaUQsRUFDakQsK0JBQWlFLEVBQ2pFLGtCQUF1QyxFQUN2QyxXQUF5QixFQUN6QixVQUF1QjtZQUV4QyxLQUFLLEVBQUUsQ0FBQztZQVJTLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBeUM7WUFDbkUsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQUNuRCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDakUsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN6QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBYnhCLDBDQUFxQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW1DLENBQUMsQ0FBQztZQUMvRyx5Q0FBb0MsR0FBRyxJQUFJLENBQUMscUNBQXFDLENBQUMsS0FBSyxDQUFDO1lBRWhGLGtCQUFhLEdBQUcsSUFBSSxHQUF3QixDQUFDO1lBQzdDLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztZQVloRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENB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