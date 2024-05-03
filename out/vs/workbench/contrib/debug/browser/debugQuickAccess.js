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
define(["require", "exports", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/contrib/debug/common/debug", "vs/platform/workspace/common/workspace", "vs/platform/commands/common/commands", "vs/base/common/filters", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/base/common/themables"], function (require, exports, pickerQuickAccess_1, nls_1, notification_1, debug_1, workspace_1, commands_1, filters_1, debugCommands_1, debugIcons_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartDebugQuickAccessProvider = void 0;
    let StartDebugQuickAccessProvider = class StartDebugQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(debugService, contextService, commandService, notificationService) {
            super(debugCommands_1.DEBUG_QUICK_ACCESS_PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noDebugResults', "No matching launch configurations")
                }
            });
            this.debugService = debugService;
            this.contextService = contextService;
            this.commandService = commandService;
            this.notificationService = notificationService;
        }
        async _getPicks(filter) {
            const picks = [];
            if (!this.debugService.getAdapterManager().hasEnabledDebuggers()) {
                return [];
            }
            picks.push({ type: 'separator', label: 'launch.json' });
            const configManager = this.debugService.getConfigurationManager();
            // Entries: configs
            let lastGroup;
            for (const config of configManager.getAllConfigurations()) {
                const highlights = (0, filters_1.matchesFuzzy)(filter, config.name, true);
                if (highlights) {
                    // Separator
                    if (lastGroup !== config.presentation?.group) {
                        picks.push({ type: 'separator' });
                        lastGroup = config.presentation?.group;
                    }
                    // Launch entry
                    picks.push({
                        label: config.name,
                        description: this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? config.launch.name : '',
                        highlights: { label: highlights },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugConfigure),
                                tooltip: (0, nls_1.localize)('customizeLaunchConfig', "Configure Launch Configuration")
                            }],
                        trigger: () => {
                            config.launch.openConfigFile({ preserveFocus: false });
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async () => {
                            await configManager.selectConfiguration(config.launch, config.name);
                            try {
                                await this.debugService.startDebugging(config.launch, undefined, { startedByUser: true });
                            }
                            catch (error) {
                                this.notificationService.error(error);
                            }
                        }
                    });
                }
            }
            // Entries detected configurations
            const dynamicProviders = await configManager.getDynamicProviders();
            if (dynamicProviders.length > 0) {
                picks.push({
                    type: 'separator', label: (0, nls_1.localize)({
                        key: 'contributed',
                        comment: ['contributed is lower case because it looks better like that in UI. Nothing preceeds it. It is a name of the grouping of debug configurations.']
                    }, "contributed")
                });
            }
            configManager.getRecentDynamicConfigurations().forEach(({ name, type }) => {
                const highlights = (0, filters_1.matchesFuzzy)(filter, name, true);
                if (highlights) {
                    picks.push({
                        label: name,
                        highlights: { label: highlights },
                        buttons: [{
                                iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugRemoveConfig),
                                tooltip: (0, nls_1.localize)('removeLaunchConfig', "Remove Launch Configuration")
                            }],
                        trigger: () => {
                            configManager.removeRecentDynamicConfigurations(name, type);
                            return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                        },
                        accept: async () => {
                            await configManager.selectConfiguration(undefined, name, undefined, { type });
                            try {
                                const { launch, getConfig } = configManager.selectedConfiguration;
                                const config = await getConfig();
                                await this.debugService.startDebugging(launch, config, { startedByUser: true });
                            }
                            catch (error) {
                                this.notificationService.error(error);
                            }
                        }
                    });
                }
            });
            dynamicProviders.forEach(provider => {
                picks.push({
                    label: `$(folder) ${provider.label}...`,
                    ariaLabel: (0, nls_1.localize)({ key: 'providerAriaLabel', comment: ['Placeholder stands for the provider label. For example "NodeJS".'] }, "{0} contributed configurations", provider.label),
                    accept: async () => {
                        const pick = await provider.pick();
                        if (pick) {
                            // Use the type of the provider, not of the config since config sometimes have subtypes (for example "node-terminal")
                            await configManager.selectConfiguration(pick.launch, pick.config.name, pick.config, { type: provider.type });
                            this.debugService.startDebugging(pick.launch, pick.config, { startedByUser: true });
                        }
                    }
                });
            });
            // Entries: launches
            const visibleLaunches = configManager.getLaunches().filter(launch => !launch.hidden);
            // Separator
            if (visibleLaunches.length > 0) {
                picks.push({ type: 'separator', label: (0, nls_1.localize)('configure', "configure") });
            }
            for (const launch of visibleLaunches) {
                const label = this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ?
                    (0, nls_1.localize)("addConfigTo", "Add Config ({0})...", launch.name) :
                    (0, nls_1.localize)('addConfiguration', "Add Configuration...");
                // Add Config entry
                picks.push({
                    label,
                    description: this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? launch.name : '',
                    highlights: { label: (0, filters_1.matchesFuzzy)(filter, label, true) ?? undefined },
                    accept: () => this.commandService.executeCommand(debugCommands_1.ADD_CONFIGURATION_ID, launch.uri.toString())
                });
            }
            return picks;
        }
    };
    exports.StartDebugQuickAccessProvider = StartDebugQuickAccessProvider;
    exports.StartDebugQuickAccessProvider = StartDebugQuickAccessProvider = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService)
    ], StartDebugQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLDZDQUFpRDtRQUVuRyxZQUNpQyxZQUEyQixFQUNoQixjQUF3QyxFQUNqRCxjQUErQixFQUMxQixtQkFBeUM7WUFFaEYsS0FBSyxDQUFDLHlDQUF5QixFQUFFO2dCQUNoQyxhQUFhLEVBQUU7b0JBQ2QsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLG1DQUFtQyxDQUFDO2lCQUN0RTthQUNELENBQUMsQ0FBQztZQVQ2QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNoQixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzFCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7UUFPakYsQ0FBQztRQUVTLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBYztZQUN2QyxNQUFNLEtBQUssR0FBd0QsRUFBRSxDQUFDO1lBQ3RFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUV4RCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFFbEUsbUJB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