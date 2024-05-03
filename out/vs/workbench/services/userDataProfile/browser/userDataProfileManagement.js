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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/host/browser/host", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, cancellation_1, errors_1, lifecycle_1, objects_1, nls_1, dialogs_1, extensions_1, log_1, productService_1, request_1, telemetry_1, userDataProfile_1, workspace_1, environmentService_1, extensions_2, host_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataProfileManagementService = void 0;
    let UserDataProfileManagementService = class UserDataProfileManagementService extends lifecycle_1.Disposable {
        constructor(userDataProfilesService, userDataProfileService, hostService, dialogService, workspaceContextService, extensionService, environmentService, telemetryService, productService, requestService, logService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
            this.hostService = hostService;
            this.dialogService = dialogService;
            this.workspaceContextService = workspaceContextService;
            this.extensionService = extensionService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this._register(userDataProfilesService.onDidChangeProfiles(e => this.onDidChangeProfiles(e)));
            this._register(userDataProfilesService.onDidResetWorkspaces(() => this.onDidResetWorkspaces()));
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => this.onDidChangeCurrentProfile(e)));
            this._register(userDataProfilesService.onDidChangeProfiles(e => {
                const updatedCurrentProfile = e.updated.find(p => this.userDataProfileService.currentProfile.id === p.id);
                if (updatedCurrentProfile) {
                    this.changeCurrentProfile(updatedCurrentProfile, (0, nls_1.localize)('reload message when updated', "The current profile has been updated. Please reload to switch back to the updated profile"));
                }
            }));
        }
        onDidChangeProfiles(e) {
            if (e.removed.some(profile => profile.id === this.userDataProfileService.currentProfile.id)) {
                this.changeCurrentProfile(this.userDataProfilesService.defaultProfile, (0, nls_1.localize)('reload message when removed', "The current profile has been removed. Please reload to switch back to default profile"));
                return;
            }
        }
        onDidResetWorkspaces() {
            if (!this.userDataProfileService.currentProfile.isDefault) {
                this.changeCurrentProfile(this.userDataProfilesService.defaultProfile, (0, nls_1.localize)('reload message when removed', "The current profile has been removed. Please reload to switch back to default profile"));
                return;
            }
        }
        async onDidChangeCurrentProfile(e) {
            if (e.previous.isTransient) {
                await this.userDataProfilesService.cleanUpTransientProfiles();
            }
        }
        async createAndEnterProfile(name, options) {
            const profile = await this.userDataProfilesService.createNamedProfile(name, options, (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'createAndEnterProfile' });
            return profile;
        }
        async createAndEnterTransientProfile() {
            const profile = await this.userDataProfilesService.createTransientProfile((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()));
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'createAndEnterTransientProfile' });
            return profile;
        }
        async updateProfile(profile, updateOptions) {
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (profile.isDefault) {
                throw new Error((0, nls_1.localize)('cannotRenameDefaultProfile', "Cannot rename the default profile"));
            }
            await this.userDataProfilesService.updateProfile(profile, updateOptions);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'updateProfile' });
        }
        async removeProfile(profile) {
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (profile.isDefault) {
                throw new Error((0, nls_1.localize)('cannotDeleteDefaultProfile', "Cannot delete the default profile"));
            }
            await this.userDataProfilesService.removeProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'removeProfile' });
        }
        async switchProfile(profile) {
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace());
            if (!this.userDataProfilesService.profiles.some(p => p.id === profile.id)) {
                throw new Error(`Profile ${profile.name} does not exist`);
            }
            if (this.userDataProfileService.currentProfile.id === profile.id) {
                return;
            }
            await this.userDataProfilesService.setProfileForWorkspace(workspaceIdentifier, profile);
            await this.changeCurrentProfile(profile);
            this.telemetryService.publicLog2('profileManagementActionExecuted', { id: 'switchProfile' });
        }
        async getBuiltinProfileTemplates() {
            if (this.productService.profileTemplatesUrl) {
                try {
                    const context = await this.requestService.request({ type: 'GET', url: this.productService.profileTemplatesUrl }, cancellation_1.CancellationToken.None);
                    if (context.res.statusCode === 200) {
                        return (await (0, request_1.asJson)(context)) || [];
                    }
                    else {
                        this.logService.error('Could not get profile templates.', context.res.statusCode);
                    }
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            return [];
        }
        async changeCurrentProfile(profile, reloadMessage) {
            const isRemoteWindow = !!this.environmentService.remoteAuthority;
            const shouldRestartExtensionHosts = this.userDataProfileService.currentProfile.id !== profile.id || !(0, objects_1.equals)(this.userDataProfileService.currentProfile.useDefaultFlags, profile.useDefaultFlags);
            if (shouldRestartExtensionHosts) {
                if (!isRemoteWindow) {
                    if (!(await this.extensionService.stopExtensionHosts((0, nls_1.localize)('switch profile', "Switching to a profile.")))) {
                        // If extension host did not stop, do not switch profile
                        if (this.userDataProfilesService.profiles.some(p => p.id === this.userDataProfileService.currentProfile.id)) {
                            await this.userDataProfilesService.setProfileForWorkspace((0, workspace_1.toWorkspaceIdentifier)(this.workspaceContextService.getWorkspace()), this.userDataProfileService.currentProfile);
                        }
                        throw new errors_1.CancellationError();
                    }
                }
            }
            // In a remote window update current profile before reloading so that data is preserved from current profile if asked to preserve
            await this.userDataProfileService.updateCurrentProfile(profile);
            if (shouldRestartExtensionHosts) {
                if (isRemoteWindow) {
                    const { confirmed } = await this.dialogService.confirm({
                        message: reloadMessage ?? (0, nls_1.localize)('reload message', "Switching a profile requires reloading VS Code."),
                        primaryButton: (0, nls_1.localize)('reload button', "&&Reload"),
                    });
                    if (confirmed) {
                        await this.hostService.reload();
                    }
                }
                else {
                    await this.extensionService.startExtensionHosts();
                }
            }
        }
    };
    exports.UserDataProfileManagementService = UserDataProfileManagementService;
    exports.UserDataProfileManagementService = UserDataProfileManagementService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, userDataProfile_2.IUserDataProfileService),
        __param(2, host_1.IHostService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, extensions_2.IExtensionService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, productService_1.IProductService),
        __param(9, request_1.IRequestService),
        __param(10, log_1.ILogService)
    ], UserDataProfileManagementService);
    (0, extensions_1.registerSingleton)(userDataProfile_2.IUserDataProfileManagementService, UserDataProfileManagementService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlTWFuYWdlbWVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhUHJvZmlsZS9icm93c2VyL3VzZXJEYXRhUHJvZmlsZU1hbmFnZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVO1FBRy9ELFlBQzRDLHVCQUFpRCxFQUNsRCxzQkFBK0MsRUFDMUQsV0FBeUIsRUFDdkIsYUFBNkIsRUFDbkIsdUJBQWlELEVBQ3hELGdCQUFtQyxFQUN4QixrQkFBZ0QsRUFDM0QsZ0JBQW1DLEVBQ3JDLGNBQStCLEVBQy9CLGNBQStCLEVBQ25DLFVBQXVCO1lBRXJELEtBQUssRUFBRSxDQUFDO1lBWm1DLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDbEQsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMxRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN2QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDbkIsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN4RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3hCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDM0QscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNyQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFHckQsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFD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