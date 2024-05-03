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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/common/views"], function (require, exports, nls_1, instantiation_1, log_1, storage_1, uriIdentity_1, userDataProfileStorageService_1, editorCommands_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStateResourceImportTreeItem = exports.GlobalStateResourceExportTreeItem = exports.GlobalStateResourceTreeItem = exports.GlobalStateResource = exports.GlobalStateResourceInitializer = void 0;
    let GlobalStateResourceInitializer = class GlobalStateResourceInitializer {
        constructor(storageService) {
            this.storageService = storageService;
        }
        async initialize(content) {
            const globalState = JSON.parse(content);
            const storageKeys = Object.keys(globalState.storage);
            if (storageKeys.length) {
                const storageEntries = [];
                for (const key of storageKeys) {
                    storageEntries.push({ key, value: globalState.storage[key], scope: 0 /* StorageScope.PROFILE */, target: 0 /* StorageTarget.USER */ });
                }
                this.storageService.storeAll(storageEntries, true);
            }
        }
    };
    exports.GlobalStateResourceInitializer = GlobalStateResourceInitializer;
    exports.GlobalStateResourceInitializer = GlobalStateResourceInitializer = __decorate([
        __param(0, storage_1.IStorageService)
    ], GlobalStateResourceInitializer);
    let GlobalStateResource = class GlobalStateResource {
        constructor(storageService, userDataProfileStorageService, logService) {
            this.storageService = storageService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.logService = logService;
        }
        async getContent(profile) {
            const globalState = await this.getGlobalState(profile);
            return JSON.stringify(globalState);
        }
        async apply(content, profile) {
            const globalState = JSON.parse(content);
            await this.writeGlobalState(globalState, profile);
        }
        async getGlobalState(profile) {
            const storage = {};
            const storageData = await this.userDataProfileStorageService.readStorageData(profile);
            for (const [key, value] of storageData) {
                if (value.value !== undefined && value.target === 0 /* StorageTarget.USER */) {
                    storage[key] = value.value;
                }
            }
            return { storage };
        }
        async writeGlobalState(globalState, profile) {
            const storageKeys = Object.keys(globalState.storage);
            if (storageKeys.length) {
                const updatedStorage = new Map();
                const nonProfileKeys = [
                    // Do not include application scope user target keys because they also include default profile user target keys
                    ...this.storageService.keys(-1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */),
                    ...this.storageService.keys(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */),
                    ...this.storageService.keys(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */),
                ];
                for (const key of storageKeys) {
                    if (nonProfileKeys.includes(key)) {
                        this.logService.info(`Importing Profile (${profile.name}): Ignoring global state key '${key}' because it is not a profile key.`);
                    }
                    else {
                        updatedStorage.set(key, globalState.storage[key]);
                    }
                }
                await this.userDataProfileStorageService.updateStorageData(profile, updatedStorage, 0 /* StorageTarget.USER */);
            }
        }
    };
    exports.GlobalStateResource = GlobalStateResource;
    exports.GlobalStateResource = GlobalStateResource = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(2, log_1.ILogService)
    ], GlobalStateResource);
    class GlobalStateResourceTreeItem {
        constructor(resource, uriIdentityService) {
            this.resource = resource;
            this.uriIdentityService = uriIdentityService;
            this.type = "globalState" /* ProfileResourceType.GlobalState */;
            this.handle = "globalState" /* ProfileResourceType.GlobalState */;
            this.label = { label: (0, nls_1.localize)('globalState', "UI State") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Collapsed;
        }
        async getChildren() {
            return [{
                    handle: this.resource.toString(),
                    resourceUri: this.resource,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    accessibilityInformation: {
                        label: this.uriIdentityService.extUri.basename(this.resource)
                    },
                    parent: this,
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [this.resource, undefined, undefined]
                    }
                }];
        }
    }
    exports.GlobalStateResourceTreeItem = GlobalStateResourceTreeItem;
    let GlobalStateResourceExportTreeItem = class GlobalStateResourceExportTreeItem extends GlobalStateResourceTreeItem {
        constructor(profile, resource, uriIdentityService, instantiationService) {
            super(resource, uriIdentityService);
            this.profile = profile;
            this.instantiationService = instantiationService;
        }
        async hasContent() {
            const globalState = await this.instantiationService.createInstance(GlobalStateResource).getGlobalState(this.profile);
            return Object.keys(globalState.storage).length > 0;
        }
        async getContent() {
            return this.instantiationService.createInstance(GlobalStateResource).getContent(this.profile);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.globalState;
        }
    };
    exports.GlobalStateResourceExportTreeItem = GlobalStateResourceExportTreeItem;
    exports.GlobalStateResourceExportTreeItem = GlobalStateResourceExportTreeItem = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, instantiation_1.IInstantiationService)
    ], GlobalStateResourceExportTreeItem);
    let GlobalStateResourceImportTreeItem = class GlobalStateResourceImportTreeItem extends GlobalStateResourceTreeItem {
        constructor(content, resource, uriIdentityService) {
            super(resource, uriIdentityService);
            this.content = content;
        }
        async getContent() {
            return this.content;
        }
        isFromDefaultProfile() {
            return false;
        }
    };
    exports.GlobalStateResourceImportTreeItem = GlobalStateResourceImportTreeItem;
    exports.GlobalStateResourceImportTreeItem = GlobalStateResourceImportTreeItem = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService)
    ], GlobalStateResourceImportTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsU3RhdGVSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL2dsb2JhbFN0YXRlUmVzb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUJ6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUE4QjtRQUUxQyxZQUE4QyxjQUErQjtZQUEvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFDN0UsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBZTtZQUMvQixNQUFNLFdBQVcsR0FBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyRCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxjQUFjLEdBQXlCLEVBQUUsQ0FBQztnQkFDaEQsS0FBSyxNQUFNLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDL0IsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLDhCQUFzQixFQUFFLE1BQU0sNEJBQW9CLEVBQUUsQ0FBQyxDQUFDO2dCQUN4SCxDQUFDO2dCQUNELElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwRCxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFoQlksd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFFN0IsV0FBQSx5QkFBZSxDQUFBO09BRmhCLDhC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