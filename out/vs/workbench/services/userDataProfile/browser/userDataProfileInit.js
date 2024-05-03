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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/async", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/browser/settingsResource", "vs/workbench/services/userDataProfile/browser/globalStateResource", "vs/workbench/services/userDataProfile/browser/keybindingsResource", "vs/workbench/services/userDataProfile/browser/tasksResource", "vs/workbench/services/userDataProfile/browser/snippetsResource", "vs/workbench/services/userDataProfile/browser/extensionsResource", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/types", "vs/platform/request/common/request", "vs/base/common/cancellation", "vs/base/common/uri"], function (require, exports, storage_1, files_1, log_1, async_1, uriIdentity_1, userDataProfile_1, settingsResource_1, globalStateResource_1, keybindingsResource_1, tasksResource_1, snippetsResource_1, extensionsResource_1, environmentService_1, types_1, request_1, cancellation_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileInitializer = void 0;
    let UserDataProfileInitializer = class UserDataProfileInitializer {
        constructor(environmentService, fileService, userDataProfileService, storageService, logService, uriIdentityService, requestService) {
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.userDataProfileService = userDataProfileService;
            this.storageService = storageService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.requestService = requestService;
            this.initialized = [];
            this.initializationFinished = new async_1.Barrier();
        }
        async whenInitializationFinished() {
            await this.initializationFinished.wait();
        }
        async requiresInitialization() {
            if (!this.environmentService.options?.profile?.contents) {
                return false;
            }
            if (!this.storageService.isNew(0 /* StorageScope.PROFILE */)) {
                return false;
            }
            return true;
        }
        async initializeRequiredResources() {
            this.logService.trace(`UserDataProfileInitializer#initializeRequiredResources`);
            const promises = [];
            const profileTemplate = await this.getProfileTemplate();
            if (profileTemplate?.settings) {
                promises.push(this.initialize(new settingsResource_1.SettingsResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.settings, "settings" /* ProfileResourceType.Settings */));
            }
            if (profileTemplate?.globalState) {
                promises.push(this.initialize(new globalStateResource_1.GlobalStateResourceInitializer(this.storageService), profileTemplate.globalState, "globalState" /* ProfileResourceType.GlobalState */));
            }
            await Promise.all(promises);
        }
        async initializeOtherResources(instantiationService) {
            try {
                this.logService.trace(`UserDataProfileInitializer#initializeOtherResources`);
                const promises = [];
                const profileTemplate = await this.getProfileTemplate();
                if (profileTemplate?.keybindings) {
                    promises.push(this.initialize(new keybindingsResource_1.KeybindingsResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.keybindings, "keybindings" /* ProfileResourceType.Keybindings */));
                }
                if (profileTemplate?.tasks) {
                    promises.push(this.initialize(new tasksResource_1.TasksResourceInitializer(this.userDataProfileService, this.fileService, this.logService), profileTemplate.tasks, "tasks" /* ProfileResourceType.Tasks */));
                }
                if (profileTemplate?.snippets) {
                    promises.push(this.initialize(new snippetsResource_1.SnippetsResourceInitializer(this.userDataProfileService, this.fileService, this.uriIdentityService), profileTemplate.snippets, "snippets" /* ProfileResourceType.Snippets */));
                }
                promises.push(this.initializeInstalledExtensions(instantiationService));
                await async_1.Promises.settled(promises);
            }
            finally {
                this.initializationFinished.open();
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (!this.initializeInstalledExtensionsPromise) {
                const profileTemplate = await this.getProfileTemplate();
                if (profileTemplate?.extensions) {
                    this.initializeInstalledExtensionsPromise = this.initialize(instantiationService.createInstance(extensionsResource_1.ExtensionsResourceInitializer), profileTemplate.extensions, "extensions" /* ProfileResourceType.Extensions */);
                }
                else {
                    this.initializeInstalledExtensionsPromise = Promise.resolve();
                }
            }
            return this.initializeInstalledExtensionsPromise;
        }
        getProfileTemplate() {
            if (!this.profileTemplatePromise) {
                this.profileTemplatePromise = this.doGetProfileTemplate();
            }
            return this.profileTemplatePromise;
        }
        async doGetProfileTemplate() {
            if (!this.environmentService.options?.profile?.contents) {
                return null;
            }
            if ((0, types_1.isString)(this.environmentService.options.profile.contents)) {
                try {
                    return JSON.parse(this.environmentService.options.profile.contents);
                }
                catch (error) {
                    this.logService.error(error);
                    return null;
                }
            }
            try {
                const url = uri_1.URI.revive(this.environmentService.options.profile.contents).toString(true);
                const context = await this.requestService.request({ type: 'GET', url }, cancellation_1.CancellationToken.None);
                if (context.res.statusCode === 200) {
                    return await (0, request_1.asJson)(context);
                }
                else {
                    this.logService.warn(`UserDataProfileInitializer: Failed to get profile from URL: ${url}. Status code: ${context.res.statusCode}.`);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            return null;
        }
        async initialize(initializer, content, profileResource) {
            try {
                if (this.initialized.includes(profileResource)) {
                    this.logService.info(`UserDataProfileInitializer: ${profileResource} initialized already.`);
                    return;
                }
                this.initialized.push(profileResource);
                this.logService.trace(`UserDataProfileInitializer: Initializing ${profileResource}`);
                await initializer.initialize(content);
                this.logService.info(`UserDataProfileInitializer: Initialized ${profileResource}`);
            }
            catch (error) {
                this.logService.info(`UserDataProfileInitializer: Error while initializing ${profileResource}`);
                this.logService.error(error);
            }
        }
    };
    exports.UserDataProfileInitializer = UserDataProfileInitializer;
    exports.UserDataProfileInitializer = UserDataProfileInitializer = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, storage_1.IStorageService),
        __param(4, log_1.ILogService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, request_1.IRequestService)
    ], UserDataProfileInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlSW5pdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3VzZXJEYXRhUHJvZmlsZUluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEwQjtRQU90QyxZQUNzQyxrQkFBd0UsRUFDL0YsV0FBMEMsRUFDL0Isc0JBQWdFLEVBQ3hFLGNBQWdELEVBQ3BELFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUM1RCxjQUFnRDtZQU5YLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUM7WUFDOUUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDZCwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ3ZELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFWakQsZ0JBQVcsR0FBMEIsRUFBRSxDQUFDO1lBQ3hDLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7UUFXeEQsQ0FBQztRQUVELEtBQUssQ0FBQywwQkFBMEI7WUFDL0IsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUMsQ0FBQztRQUVELEtBQUssQ0FBQyxzQkFBc0I7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO2dCQUN6RCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FB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