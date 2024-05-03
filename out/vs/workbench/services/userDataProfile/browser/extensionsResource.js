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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/nls", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/workbench/common/views", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, cancellation_1, lifecycle_1, nls_1, extensionEnablementService_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, serviceCollection_1, log_1, storage_1, userDataProfileStorageService_1, views_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsResourceImportTreeItem = exports.ExtensionsResourceExportTreeItem = exports.ExtensionsResourceTreeItem = exports.ExtensionsResource = exports.ExtensionsResourceInitializer = void 0;
    let ExtensionsResourceInitializer = class ExtensionsResourceInitializer {
        constructor(userDataProfileService, extensionManagementService, extensionGalleryService, extensionEnablementService, logService) {
            this.userDataProfileService = userDataProfileService;
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionEnablementService = extensionEnablementService;
            this.logService = logService;
        }
        async initialize(content) {
            const profileExtensions = JSON.parse(content);
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, this.userDataProfileService.currentProfile.extensionsResource);
            const extensionsToEnableOrDisable = [];
            const extensionsToInstall = [];
            for (const e of profileExtensions) {
                const isDisabled = this.extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                if (!installedExtension || (!installedExtension.isBuiltin && installedExtension.preRelease !== e.preRelease)) {
                    extensionsToInstall.push(e);
                }
                if (isDisabled !== !!e.disabled) {
                    extensionsToEnableOrDisable.push({ extension: e.identifier, enable: !e.disabled });
                }
            }
            const extensionsToUninstall = installedExtensions.filter(extension => !extension.isBuiltin && !profileExtensions.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier)));
            for (const { extension, enable } of extensionsToEnableOrDisable) {
                if (enable) {
                    this.logService.trace(`Initializing Profile: Enabling extension...`, extension.id);
                    await this.extensionEnablementService.enableExtension(extension);
                    this.logService.info(`Initializing Profile: Enabled extension...`, extension.id);
                }
                else {
                    this.logService.trace(`Initializing Profile: Disabling extension...`, extension.id);
                    await this.extensionEnablementService.disableExtension(extension);
                    this.logService.info(`Initializing Profile: Disabled extension...`, extension.id);
                }
            }
            if (extensionsToInstall.length) {
                const galleryExtensions = await this.extensionGalleryService.getExtensions(extensionsToInstall.map(e => ({ ...e.identifier, version: e.version, hasPreRelease: e.version ? undefined : e.preRelease })), cancellation_1.CancellationToken.None);
                await Promise.all(extensionsToInstall.map(async (e) => {
                    const extension = galleryExtensions.find(galleryExtension => (0, extensionManagementUtil_1.areSameExtensions)(galleryExtension.identifier, e.identifier));
                    if (!extension) {
                        return;
                    }
                    if (await this.extensionManagementService.canInstall(extension)) {
                        this.logService.trace(`Initializing Profile: Installing extension...`, extension.identifier.id, extension.version);
                        await this.extensionManagementService.installFromGallery(extension, {
                            isMachineScoped: false, /* set isMachineScoped value to prevent install and sync dialog in web */
                            donotIncludePackAndDependencies: true,
                            installGivenVersion: !!e.version,
                            installPreReleaseVersion: e.preRelease,
                            profileLocation: this.userDataProfileService.currentProfile.extensionsResource,
                            context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true }
                        });
                        this.logService.info(`Initializing Profile: Installed extension...`, extension.identifier.id, extension.version);
                    }
                    else {
                        this.logService.info(`Initializing Profile: Skipped installing extension because it cannot be installed.`, extension.identifier.id);
                    }
                }));
            }
            if (extensionsToUninstall.length) {
                await Promise.all(extensionsToUninstall.map(e => this.extensionManagementService.uninstall(e)));
            }
        }
    };
    exports.ExtensionsResourceInitializer = ExtensionsResourceInitializer;
    exports.ExtensionsResourceInitializer = ExtensionsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(4, log_1.ILogService)
    ], ExtensionsResourceInitializer);
    let ExtensionsResource = class ExtensionsResource {
        constructor(extensionManagementService, extensionGalleryService, userDataProfileStorageService, instantiationService, logService) {
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.instantiationService = instantiationService;
            this.logService = logService;
        }
        async getContent(profile, exclude) {
            const extensions = await this.getLocalExtensions(profile);
            return this.toContent(extensions, exclude);
        }
        toContent(extensions, exclude) {
            return JSON.stringify(exclude?.length ? extensions.filter(e => !exclude.includes(e.identifier.id.toLowerCase())) : extensions);
        }
        async apply(content, profile) {
            return this.withProfileScopedServices(profile, async (extensionEnablementService) => {
                const profileExtensions = await this.getProfileExtensions(content);
                const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
                const extensionsToEnableOrDisable = [];
                const extensionsToInstall = [];
                for (const e of profileExtensions) {
                    const isDisabled = extensionEnablementService.getDisabledExtensions().some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, e.identifier));
                    const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                    if (!installedExtension || (!installedExtension.isBuiltin && installedExtension.preRelease !== e.preRelease)) {
                        extensionsToInstall.push(e);
                    }
                    if (isDisabled !== !!e.disabled) {
                        extensionsToEnableOrDisable.push({ extension: e.identifier, enable: !e.disabled });
                    }
                }
                const extensionsToUninstall = installedExtensions.filter(extension => !extension.isBuiltin && !profileExtensions.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier)) && !extension.isApplicationScoped);
                for (const { extension, enable } of extensionsToEnableOrDisable) {
                    if (enable) {
                        this.logService.trace(`Importing Profile (${profile.name}): Enabling extension...`, extension.id);
                        await extensionEnablementService.enableExtension(extension);
                        this.logService.info(`Importing Profile (${profile.name}): Enabled extension...`, extension.id);
                    }
                    else {
                        this.logService.trace(`Importing Profile (${profile.name}): Disabling extension...`, extension.id);
                        await extensionEnablementService.disableExtension(extension);
                        this.logService.info(`Importing Profile (${profile.name}): Disabled extension...`, extension.id);
                    }
                }
                if (extensionsToInstall.length) {
                    this.logService.info(`Importing Profile (${profile.name}): Started installing extensions.`);
                    const galleryExtensions = await this.extensionGalleryService.getExtensions(extensionsToInstall.map(e => ({ ...e.identifier, version: e.version, hasPreRelease: e.version ? undefined : e.preRelease })), cancellation_1.CancellationToken.None);
                    const installExtensionInfos = [];
                    await Promise.all(extensionsToInstall.map(async (e) => {
                        const extension = galleryExtensions.find(galleryExtension => (0, extensionManagementUtil_1.areSameExtensions)(galleryExtension.identifier, e.identifier));
                        if (!extension) {
                            return;
                        }
                        if (await this.extensionManagementService.canInstall(extension)) {
                            installExtensionInfos.push({
                                extension,
                                options: {
                                    isMachineScoped: false, /* set isMachineScoped value to prevent install and sync dialog in web */
                                    donotIncludePackAndDependencies: true,
                                    installGivenVersion: !!e.version,
                                    installPreReleaseVersion: e.preRelease,
                                    profileLocation: profile.extensionsResource,
                                    context: { [extensionManagement_1.EXTENSION_INSTALL_SKIP_WALKTHROUGH_CONTEXT]: true }
                                }
                            });
                        }
                        else {
                            this.logService.info(`Importing Profile (${profile.name}): Skipped installing extension because it cannot be installed.`, extension.identifier.id);
                        }
                    }));
                    if (installExtensionInfos.length) {
                        await this.extensionManagementService.installGalleryExtensions(installExtensionInfos);
                    }
                    this.logService.info(`Importing Profile (${profile.name}): Finished installing extensions.`);
                }
                if (extensionsToUninstall.length) {
                    await Promise.all(extensionsToUninstall.map(e => this.extensionManagementService.uninstall(e)));
                }
            });
        }
        async copy(from, to, disableExtensions) {
            await this.extensionManagementService.copyExtensions(from.extensionsResource, to.extensionsResource);
            const extensionsToDisable = await this.withProfileScopedServices(from, async (extensionEnablementService) => extensionEnablementService.getDisabledExtensions());
            if (disableExtensions) {
                const extensions = await this.extensionManagementService.getInstalled(1 /* ExtensionType.User */, to.extensionsResource);
                for (const extension of extensions) {
                    extensionsToDisable.push(extension.identifier);
                }
            }
            await this.withProfileScopedServices(to, async (extensionEnablementService) => Promise.all(extensionsToDisable.map(extension => extensionEnablementService.disableExtension(extension))));
        }
        async getLocalExtensions(profile) {
            return this.withProfileScopedServices(profile, async (extensionEnablementService) => {
                const result = [];
                const installedExtensions = await this.extensionManagementService.getInstalled(undefined, profile.extensionsResource);
                const disabledExtensions = extensionEnablementService.getDisabledExtensions();
                for (const extension of installedExtensions) {
                    const { identifier, preRelease } = extension;
                    const disabled = disabledExtensions.some(disabledExtension => (0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier));
                    if (extension.isBuiltin && !disabled) {
                        // skip enabled builtin extensions
                        continue;
                    }
                    if (!extension.isBuiltin) {
                        if (!extension.identifier.uuid) {
                            // skip user extensions without uuid
                            continue;
                        }
                    }
                    const profileExtension = { identifier, displayName: extension.manifest.displayName };
                    if (disabled) {
                        profileExtension.disabled = true;
                    }
                    if (!extension.isBuiltin && extension.pinned) {
                        profileExtension.version = extension.manifest.version;
                    }
                    if (!profileExtension.version && preRelease) {
                        profileExtension.preRelease = true;
                    }
                    result.push(profileExtension);
                }
                return result;
            });
        }
        async getProfileExtensions(content) {
            return JSON.parse(content);
        }
        async withProfileScopedServices(profile, fn) {
            return this.userDataProfileStorageService.withProfileScopedStorageService(profile, async (storageService) => {
                const disposables = new lifecycle_1.DisposableStore();
                const instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([storage_1.IStorageService, storageService]));
                const extensionEnablementService = disposables.add(instantiationService.createInstance(extensionEnablementService_1.GlobalExtensionEnablementService));
                try {
                    return await fn(extensionEnablementService);
                }
                finally {
                    disposables.dispose();
                }
            });
        }
    };
    exports.ExtensionsResource = ExtensionsResource;
    exports.ExtensionsResource = ExtensionsResource = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService)
    ], ExtensionsResource);
    class ExtensionsResourceTreeItem {
        constructor() {
            this.type = "extensions" /* ProfileResourceType.Extensions */;
            this.handle = "extensions" /* ProfileResourceType.Extensions */;
            this.label = { label: (0, nls_1.localize)('extensions', "Extensions") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.contextValue = "extensions" /* ProfileResourceType.Extensions */;
            this.excludedExtensions = new Set();
        }
        async getChildren() {
            const extensions = (await this.getExtensions()).sort((a, b) => (a.displayName ?? a.identifier.id).localeCompare(b.displayName ?? b.identifier.id));
            const that = this;
            return extensions.map(e => ({
                handle: e.identifier.id.toLowerCase(),
                parent: this,
                label: { label: e.displayName || e.identifier.id },
                description: e.disabled ? (0, nls_1.localize)('disabled', "Disabled") : undefined,
                collapsibleState: views_1.TreeItemCollapsibleState.None,
                checkbox: that.checkbox ? {
                    get isChecked() { return !that.excludedExtensions.has(e.identifier.id.toLowerCase()); },
                    set isChecked(value) {
                        if (value) {
                            that.excludedExtensions.delete(e.identifier.id.toLowerCase());
                        }
                        else {
                            that.excludedExtensions.add(e.identifier.id.toLowerCase());
                        }
                    },
                    tooltip: (0, nls_1.localize)('exclude', "Select {0} Extension", e.displayName || e.identifier.id),
                    accessibilityInformation: {
                        label: (0, nls_1.localize)('exclude', "Select {0} Extension", e.displayName || e.identifier.id),
                    }
                } : undefined,
                command: {
                    id: 'extension.open',
                    title: '',
                    arguments: [e.identifier.id, undefined, true]
                }
            }));
        }
        async hasContent() {
            const extensions = await this.getExtensions();
            return extensions.length > 0;
        }
    }
    exports.ExtensionsResourceTreeItem = ExtensionsResourceTreeItem;
    let ExtensionsResourceExportTreeItem = class ExtensionsResourceExportTreeItem extends ExtensionsResourceTreeItem {
        constructor(profile, instantiationService) {
            super();
            this.profile = profile;
            this.instantiationService = instantiationService;
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.extensions;
        }
        getExtensions() {
            return this.instantiationService.createInstance(ExtensionsResource).getLocalExtensions(this.profile);
        }
        async getContent() {
            return this.instantiationService.createInstance(ExtensionsResource).getContent(this.profile, [...this.excludedExtensions.values()]);
        }
    };
    exports.ExtensionsResourceExportTreeItem = ExtensionsResourceExportTreeItem;
    exports.ExtensionsResourceExportTreeItem = ExtensionsResourceExportTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExtensionsResourceExportTreeItem);
    let ExtensionsResourceImportTreeItem = class ExtensionsResourceImportTreeItem extends ExtensionsResourceTreeItem {
        constructor(content, instantiationService) {
            super();
            this.content = content;
            this.instantiationService = instantiationService;
        }
        isFromDefaultProfile() {
            return false;
        }
        getExtensions() {
            return this.instantiationService.createInstance(ExtensionsResource).getProfileExtensions(this.content);
        }
        async getContent() {
            const extensionsResource = this.instantiationService.createInstance(ExtensionsResource);
            const extensions = await extensionsResource.getProfileExtensions(this.content);
            return extensionsResource.toContent(extensions, [...this.excludedExtensions.values()]);
        }
    };
    exports.ExtensionsResourceImportTreeItem = ExtensionsResourceImportTreeItem;
    exports.ExtensionsResourceImportTreeItem = ExtensionsResourceImportTreeItem = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExtensionsResourceImportTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1Jlc291cmNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdXNlckRhdGFQcm9maWxlL2Jyb3dzZXIvZXh0ZW5zaW9uc1Jlc291cmNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCekYsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFFekMsWUFDMkMsc0JBQStDLEVBQzNDLDBCQUF1RCxFQUMxRCx1QkFBaUQsRUFDeEMsMEJBQTZELEVBQ25GLFVBQXVCO1lBSlgsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMzQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQzFELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDeEMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFtQztZQUNuRixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBRXRELENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQWU7WUFDL0IsTUFBTSxpQkFBaUIsR0FBd0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuRSxNQUFNLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3pKLE1BQU0sMkJBQTJCLEdBQTJELEVBQUUsQ0FBQztZQUMvRixNQUFNLG1CQUFtQixHQUF3QixFQUFFLENBQUM7WUFDcEQsS0FBSyxNQUFNLENBQUMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dCQUNuQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxJ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