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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/configuration/common/configurationRegistry", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/common/views", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, buffer_1, configurationRegistry_1, files_1, log_1, platform_1, userDataProfile_1, settingsMerge_1, userDataSync_1, views_1, editorCommands_1, instantiation_1, nls_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsResourceTreeItem = exports.SettingsResource = exports.SettingsResourceInitializer = void 0;
    let SettingsResourceInitializer = class SettingsResourceInitializer {
        constructor(userDataProfileService, fileService, logService) {
            this.userDataProfileService = userDataProfileService;
            this.fileService = fileService;
            this.logService = logService;
        }
        async initialize(content) {
            const settingsContent = JSON.parse(content);
            if (settingsContent.settings === null) {
                this.logService.info(`Initializing Profile: No settings to apply...`);
                return;
            }
            await this.fileService.writeFile(this.userDataProfileService.currentProfile.settingsResource, buffer_1.VSBuffer.fromString(settingsContent.settings));
        }
    };
    exports.SettingsResourceInitializer = SettingsResourceInitializer;
    exports.SettingsResourceInitializer = SettingsResourceInitializer = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], SettingsResourceInitializer);
    let SettingsResource = class SettingsResource {
        constructor(fileService, userDataSyncUtilService, logService) {
            this.fileService = fileService;
            this.userDataSyncUtilService = userDataSyncUtilService;
            this.logService = logService;
        }
        async getContent(profile) {
            const settingsContent = await this.getSettingsContent(profile);
            return JSON.stringify(settingsContent);
        }
        async getSettingsContent(profile) {
            const localContent = await this.getLocalFileContent(profile);
            if (localContent === null) {
                return { settings: null };
            }
            else {
                const ignoredSettings = this.getIgnoredSettings();
                const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(profile.settingsResource);
                const settings = (0, settingsMerge_1.updateIgnoredSettings)(localContent || '{}', '{}', ignoredSettings, formattingOptions);
                return { settings };
            }
        }
        async apply(content, profile) {
            const settingsContent = JSON.parse(content);
            if (settingsContent.settings === null) {
                this.logService.info(`Importing Profile (${profile.name}): No settings to apply...`);
                return;
            }
            const localSettingsContent = await this.getLocalFileContent(profile);
            const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(profile.settingsResource);
            const contentToUpdate = (0, settingsMerge_1.updateIgnoredSettings)(settingsContent.settings, localSettingsContent || '{}', this.getIgnoredSettings(), formattingOptions);
            await this.fileService.writeFile(profile.settingsResource, buffer_1.VSBuffer.fromString(contentToUpdate));
        }
        getIgnoredSettings() {
            const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const ignoredSettings = Object.keys(allSettings).filter(key => allSettings[key]?.scope === 2 /* ConfigurationScope.MACHINE */ || allSettings[key]?.scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */);
            return ignoredSettings;
        }
        async getLocalFileContent(profile) {
            try {
                const content = await this.fileService.readFile(profile.settingsResource);
                return content.value.toString();
            }
            catch (error) {
                // File not found
                if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return null;
                }
                else {
                    throw error;
                }
            }
        }
    };
    exports.SettingsResource = SettingsResource;
    exports.SettingsResource = SettingsResource = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_1.IUserDataSyncUtilService),
        __param(2, log_1.ILogService)
    ], SettingsResource);
    let SettingsResourceTreeItem = class SettingsResourceTreeItem {
        constructor(profile, uriIdentityService, instantiationService) {
            this.profile = profile;
            this.uriIdentityService = uriIdentityService;
            this.instantiationService = instantiationService;
            this.type = "settings" /* ProfileResourceType.Settings */;
            this.handle = "settings" /* ProfileResourceType.Settings */;
            this.label = { label: (0, nls_1.localize)('settings', "Settings") };
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
        }
        async getChildren() {
            return [{
                    handle: this.profile.settingsResource.toString(),
                    resourceUri: this.profile.settingsResource,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    parent: this,
                    accessibilityInformation: {
                        label: this.uriIdentityService.extUri.basename(this.profile.settingsResource)
                    },
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [this.profile.settingsResource, undefined, undefined]
                    }
                }];
        }
        async hasContent() {
            const settingsContent = await this.instantiationService.createInstance(SettingsResource).getSettingsContent(this.profile);
            return settingsContent.settings !== null;
        }
        async getContent() {
            return this.instantiationService.createInstance(SettingsResource).getContent(this.profile);
        }
        isFromDefaultProfile() {
            return !this.profile.isDefault && !!this.profile.useDefaultFlags?.settings;
        }
    };
    exports.SettingsResourceTreeItem = SettingsResourceTreeItem;
    exports.SettingsResourceTreeItem = SettingsResourceTreeItem = __decorate([
        __param(1, uriIdentity_1.IUriIdentityService),
        __param(2, instantiation_1.IInstantiationService)
    ], SettingsResourceTreeItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NSZXNvdXJjZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3NldHRpbmdzUmVzb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQUV2QyxZQUMyQyxzQkFBK0MsRUFDMUQsV0FBeUIsRUFDMUIsVUFBdUI7WUFGWCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzFELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQzFCLGVBQVUsR0FBVixVQUFVLENBQWE7UUFFdEQsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBZTtZQUMvQixNQUFNLGVBQWUsR0FBcUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxJQUFJLGVBQWUsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLCtDQUErQyxDQUFDLENBQUM7Z0JBQ3RFLE9BQU87WUFDUixDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzlJLENBQUM7S0FDRCxDQUFBO0lBakJZLGtFQUEyQjswQ0FBM0IsMkJBQTJCO1FBR3JDLFdBQUEseUNBQXVCLENBQUE7UUFDdkIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO09BTEQsMkJBQTJCLENBaUJ2QztJQUVN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