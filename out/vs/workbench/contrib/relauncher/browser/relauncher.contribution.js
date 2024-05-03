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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/host/browser/host", "vs/platform/configuration/common/configuration", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "vs/platform/product/common/productService"], function (require, exports, lifecycle_1, contributions_1, platform_1, host_1, configuration_1, nls_1, workspace_1, extensions_1, async_1, resources_1, platform_2, dialogs_1, environmentService_1, productService_1) {
    "use strict";
    var SettingsChangeRelauncher_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceChangeExtHostRelauncher = exports.SettingsChangeRelauncher = void 0;
    let SettingsChangeRelauncher = class SettingsChangeRelauncher extends lifecycle_1.Disposable {
        static { SettingsChangeRelauncher_1 = this; }
        static { this.SETTINGS = [
            "window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */,
            'window.nativeTabs',
            'window.nativeFullScreen',
            'window.clickThroughInactive',
            'update.mode',
            'editor.accessibilitySupport',
            'security.workspace.trust.enabled',
            'workbench.enableExperiments',
            '_extensionsGallery.enablePPE',
            'security.restrictUNCAccess'
        ]; }
        constructor(hostService, configurationService, productService, dialogService) {
            super();
            this.hostService = hostService;
            this.configurationService = configurationService;
            this.productService = productService;
            this.dialogService = dialogService;
            this.titleBarStyle = new ChangeObserver('string');
            this.nativeTabs = new ChangeObserver('boolean');
            this.nativeFullScreen = new ChangeObserver('boolean');
            this.clickThroughInactive = new ChangeObserver('boolean');
            this.updateMode = new ChangeObserver('string');
            this.workspaceTrustEnabled = new ChangeObserver('boolean');
            this.experimentsEnabled = new ChangeObserver('boolean');
            this.enablePPEExtensionsGallery = new ChangeObserver('boolean');
            this.restrictUNCAccess = new ChangeObserver('boolean');
            this.onConfigurationChange(undefined);
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e)));
        }
        onConfigurationChange(e) {
            if (e && !SettingsChangeRelauncher_1.SETTINGS.some(key => e.affectsConfiguration(key))) {
                return;
            }
            let changed = false;
            function processChanged(didChange) {
                changed = changed || didChange;
            }
            const config = this.configurationService.getValue();
            if (platform_2.isNative) {
                // Titlebar style
                processChanged((config.window.titleBarStyle === "native" /* TitlebarStyle.NATIVE */ || config.window.titleBarStyle === "custom" /* TitlebarStyle.CUSTOM */) && this.titleBarStyle.handleChange(config.window?.titleBarStyle));
                // macOS: Native tabs
                processChanged(platform_2.isMacintosh && this.nativeTabs.handleChange(config.window?.nativeTabs));
                // macOS: Native fullscreen
                processChanged(platform_2.isMacintosh && this.nativeFullScreen.handleChange(config.window?.nativeFullScreen));
                // macOS: Click through (accept first mouse)
                processChanged(platform_2.isMacintosh && this.clickThroughInactive.handleChange(config.window?.clickThroughInactive));
                // Update mode
                processChanged(this.updateMode.handleChange(config.update?.mode));
                // On linux turning on accessibility support will also pass this flag to the chrome renderer, thus a restart is required
                if (platform_2.isLinux && typeof config.editor?.accessibilitySupport === 'string' && config.editor.accessibilitySupport !== this.accessibilitySupport) {
                    this.accessibilitySupport = config.editor.accessibilitySupport;
                    if (this.accessibilitySupport === 'on') {
                        changed = true;
                    }
                }
                // Workspace trust
                processChanged(this.workspaceTrustEnabled.handleChange(config?.security?.workspace?.trust?.enabled));
                // UNC host access restrictions
                processChanged(this.restrictUNCAccess.handleChange(config?.security?.restrictUNCAccess));
            }
            // Experiments
            processChanged(this.experimentsEnabled.handleChange(config.workbench?.enableExperiments));
            // Profiles
            processChanged(this.productService.quality !== 'stable' && this.enablePPEExtensionsGallery.handleChange(config._extensionsGallery?.enablePPE));
            // Notify only when changed from an event and the change
            // was not triggerd programmatically (e.g. from experiments)
            if (changed && e && e.source !== 7 /* ConfigurationTarget.DEFAULT */) {
                this.doConfirm(platform_2.isNative ?
                    (0, nls_1.localize)('relaunchSettingMessage', "A setting has changed that requires a restart to take effect.") :
                    (0, nls_1.localize)('relaunchSettingMessageWeb', "A setting has changed that requires a reload to take effect."), platform_2.isNative ?
                    (0, nls_1.localize)('relaunchSettingDetail', "Press the restart button to restart {0} and enable the setting.", this.productService.nameLong) :
                    (0, nls_1.localize)('relaunchSettingDetailWeb', "Press the reload button to reload {0} and enable the setting.", this.productService.nameLong), platform_2.isNative ?
                    (0, nls_1.localize)({ key: 'restart', comment: ['&& denotes a mnemonic'] }, "&&Restart") :
                    (0, nls_1.localize)({ key: 'restartWeb', comment: ['&& denotes a mnemonic'] }, "&&Reload"), () => this.hostService.restart());
            }
        }
        async doConfirm(message, detail, primaryButton, confirmedFn) {
            if (this.hostService.hasFocus) {
                const { confirmed } = await this.dialogService.confirm({ message, detail, primaryButton });
                if (confirmed) {
                    confirmedFn();
                }
            }
        }
    };
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher;
    exports.SettingsChangeRelauncher = SettingsChangeRelauncher = SettingsChangeRelauncher_1 = __decorate([
        __param(0, host_1.IHostService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService),
        __param(3, dialogs_1.IDialogService)
    ], SettingsChangeRelauncher);
    class ChangeObserver {
        static create(typeName) {
            return new ChangeObserver(typeName);
        }
        constructor(typeName) {
            this.typeName = typeName;
            this.lastValue = undefined;
        }
        /**
         * Returns if there was a change compared to the last value
         */
        handleChange(value) {
            if (typeof value === this.typeName && value !== this.lastValue) {
                this.lastValue = value;
                return true;
            }
            return false;
        }
    }
    let WorkspaceChangeExtHostRelauncher = class WorkspaceChangeExtHostRelauncher extends lifecycle_1.Disposable {
        constructor(contextService, extensionService, hostService, environmentService) {
            super();
            this.contextService = contextService;
            this.extensionHostRestarter = this._register(new async_1.RunOnceScheduler(async () => {
                if (!!environmentService.extensionTestsLocationURI) {
                    return; // no restart when in tests: see https://github.com/microsoft/vscode/issues/66936
                }
                if (environmentService.remoteAuthority) {
                    hostService.reload(); // TODO@aeschli, workaround
                }
                else if (platform_2.isNative) {
                    const stopped = await extensionService.stopExtensionHosts((0, nls_1.localize)('restartExtensionHost.reason', "Restarting extension host due to a workspace folder change."));
                    if (stopped) {
                        extensionService.startExtensionHosts();
                    }
                }
            }, 10));
            this.contextService.getCompleteWorkspace()
                .then(workspace => {
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                this.handleWorkbenchState();
                this._register(this.contextService.onDidChangeWorkbenchState(() => setTimeout(() => this.handleWorkbenchState())));
            });
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.onDidChangeWorkspaceFoldersUnbind?.dispose();
            }));
        }
        handleWorkbenchState() {
            // React to folder changes when we are in workspace state
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                // Update our known first folder path if we entered workspace
                const workspace = this.contextService.getWorkspace();
                this.firstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
                // Install workspace folder listener
                if (!this.onDidChangeWorkspaceFoldersUnbind) {
                    this.onDidChangeWorkspaceFoldersUnbind = this.contextService.onDidChangeWorkspaceFolders(() => this.onDidChangeWorkspaceFolders());
                }
            }
            // Ignore the workspace folder changes in EMPTY or FOLDER state
            else {
                (0, lifecycle_1.dispose)(this.onDidChangeWorkspaceFoldersUnbind);
                this.onDidChangeWorkspaceFoldersUnbind = undefined;
            }
        }
        onDidChangeWorkspaceFolders() {
            const workspace = this.contextService.getWorkspace();
            // Restart extension host if first root folder changed (impact on deprecated workspace.rootPath API)
            const newFirstFolderResource = workspace.folders.length > 0 ? workspace.folders[0].uri : undefined;
            if (!(0, resources_1.isEqual)(this.firstFolderResource, newFirstFolderResource)) {
                this.firstFolderResource = newFirstFolderResource;
                this.extensionHostRestarter.schedule(); // buffer calls to extension host restart
            }
        }
    };
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher;
    exports.WorkspaceChangeExtHostRelauncher = WorkspaceChangeExtHostRelauncher = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, extensions_1.IExtensionService),
        __param(2, host_1.IHostService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceChangeExtHostRelauncher);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(SettingsChangeRelauncher, 3 /* LifecyclePhase.Restored */);
    workbenchRegistry.registerWorkbenchContribution(WorkspaceChangeExtHostRelauncher, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsYXVuY2hlci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbGF1bmNoZXIvYnJvd3Nlci9yZWxhdW5jaGVyLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVOztpQkFFeEMsYUFBUSxHQUFHOztZQUV6QixtQkFBbUI7WUFDbkIseUJBQXlCO1lBQ3pCLDZCQUE2QjtZQUM3QixhQUFhO1lBQ2IsNkJBQTZCO1lBQzdCLGtDQUFrQztZQUNsQyw2QkFBNkI7WUFDN0IsOEJBQThCO1lBQzlCLDRCQUE0QjtTQUM1QixBQVhzQixDQVdyQjtRQWFGLFlBQ2UsV0FBMEMsRUFDakMsb0JBQTRELEVBQ2xFLGNBQWdELEVBQ2pELGFBQThDO1lBRTlELEtBQUssRUFBRSxDQUFDO1lBTHVCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2hDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQWY5QyxrQkFBYSxHQUFHLElBQUksY0FBYyxDQUFnQixRQUFRLENBQUMsQ0FBQztZQUM1RCxlQUFVLEdBQUcsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDM0MscUJBQWdCLEdBQUcsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakQseUJBQW9CLEdBQUcsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDckQsZUFBVSxHQUFHLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTFDLDBCQUFxQixHQUFHLElBQUks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