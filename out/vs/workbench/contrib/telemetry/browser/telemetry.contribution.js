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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/telemetry/browser/errorTelemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/resources", "vs/base/common/event", "vs/base/common/network", "vs/editor/common/services/languagesAssociations", "vs/base/common/hash", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/browser/window", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, platform_1, contributions_1, lifecycle_1, telemetry_1, workspace_1, editorService_1, keybinding_1, workbenchThemeService_1, environmentService_1, platform_2, lifecycle_2, errorTelemetry_1, telemetryUtils_1, configuration_1, textfiles_1, resources_1, event_1, network_1, languagesAssociations_1, hash_1, panecomposite_1, userDataProfile_1, window_1, configurationRegistry_1, types_1, extensions_1, chatService_1) {
    "use strict";
    var TelemetryContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryContribution = void 0;
    let TelemetryContribution = class TelemetryContribution extends lifecycle_2.Disposable {
        static { TelemetryContribution_1 = this; }
        static { this.ALLOWLIST_JSON = ['package.json', 'package-lock.json', 'tsconfig.json', 'jsconfig.json', 'bower.json', '.eslintrc.json', 'tslint.json', 'composer.json']; }
        static { this.ALLOWLIST_WORKSPACE_JSON = ['settings.json', 'extensions.json', 'tasks.json', 'launch.json']; }
        constructor(telemetryService, contextService, lifecycleService, editorService, keybindingsService, themeService, environmentService, userDataProfileService, paneCompositeService, textFileService) {
            super();
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.userDataProfileService = userDataProfileService;
            const { filesToOpenOrCreate, filesToDiff, filesToMerge } = environmentService;
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            telemetryService.publicLog2('workspaceLoad', {
                windowSize: { innerHeight: window_1.mainWindow.innerHeight, innerWidth: window_1.mainWindow.innerWidth, outerHeight: window_1.mainWindow.outerHeight, outerWidth: window_1.mainWindow.outerWidth },
                emptyWorkbench: contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */,
                'workbench.filesToOpenOrCreate': filesToOpenOrCreate && filesToOpenOrCreate.length || 0,
                'workbench.filesToDiff': filesToDiff && filesToDiff.length || 0,
                'workbench.filesToMerge': filesToMerge && filesToMerge.length || 0,
                customKeybindingsCount: keybindingsService.customKeybindingsCount(),
                theme: themeService.getColorTheme().id,
                language: platform_2.language,
                pinnedViewlets: paneCompositeService.getPinnedPaneCompositeIds(0 /* ViewContainerLocation.Sidebar */),
                restoredViewlet: activeViewlet ? activeViewlet.getId() : undefined,
                restoredEditors: editorService.visibleEditors.length,
                startupKind: lifecycleService.startupKind
            });
            // Error Telemetry
            this._register(new errorTelemetry_1.default(telemetryService));
            //  Files Telemetry
            this._register(textFileService.files.onDidResolve(e => this.onTextFileModelResolved(e)));
            this._register(textFileService.files.onDidSave(e => this.onTextFileModelSaved(e)));
            // Lifecycle
            this._register(lifecycleService.onDidShutdown(() => this.dispose()));
        }
        onTextFileModelResolved(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsRead', { settingsType }); // Do not log read to user settings.json and .vscode folder as a fileGet event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('fileGet', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        onTextFileModelSaved(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsWritten', { settingsType }); // Do not log write to user settings.json and .vscode folder as a filePUT event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('filePUT', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        getTypeIfSettings(resource) {
            if ((0, resources_1.extname)(resource) !== '.json') {
                return '';
            }
            // Check for global settings file
            if ((0, resources_1.isEqual)(resource, this.userDataProfileService.currentProfile.settingsResource)) {
                return 'global-settings';
            }
            // Check for keybindings file
            if ((0, resources_1.isEqual)(resource, this.userDataProfileService.currentProfile.keybindingsResource)) {
                return 'keybindings';
            }
            // Check for snippets
            if ((0, resources_1.isEqualOrParent)(resource, this.userDataProfileService.currentProfile.snippetsHome)) {
                return 'snippets';
            }
            // Check for workspace settings file
            const folders = this.contextService.getWorkspace().folders;
            for (const folder of folders) {
                if ((0, resources_1.isEqualOrParent)(resource, folder.toResource('.vscode'))) {
                    const filename = (0, resources_1.basename)(resource);
                    if (TelemetryContribution_1.ALLOWLIST_WORKSPACE_JSON.indexOf(filename) > -1) {
                        return `.vscode/${filename}`;
                    }
                }
            }
            return '';
        }
        getTelemetryData(resource, reason) {
            let ext = (0, resources_1.extname)(resource);
            // Remove query parameters from the resource extension
            const queryStringLocation = ext.indexOf('?');
            ext = queryStringLocation !== -1 ? ext.substr(0, queryStringLocation) : ext;
            const fileName = (0, resources_1.basename)(resource);
            const path = resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
            const telemetryData = {
                mimeType: new telemetryUtils_1.TelemetryTrustedValue((0, languagesAssociations_1.getMimeTypes)(resource).join(', ')),
                ext,
                path: (0, hash_1.hash)(path),
                reason,
                allowlistedjson: undefined
            };
            if (ext === '.json' && TelemetryContribution_1.ALLOWLIST_JSON.indexOf(fileName) > -1) {
                telemetryData['allowlistedjson'] = fileName;
            }
            return telemetryData;
        }
    };
    exports.TelemetryContribution = TelemetryContribution;
    exports.TelemetryContribution = TelemetryContribution = TelemetryContribution_1 = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, editorService_1.IEditorService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, userDataProfile_1.IUserDataProfileService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, textfiles_1.ITextFileService)
    ], TelemetryContribution);
    let ConfigurationTelemetryContribution = class ConfigurationTelemetryContribution extends lifecycle_2.Disposable {
        constructor(configurationService, telemetryService) {
            super();
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            // Debounce the event by 1000 ms and merge all affected keys into one event
            const debouncedConfigService = event_1.Event.debounce(configurationService.onDidChangeConfiguration, (last, cur) => {
                const newAffectedKeys = last ? new Set([...last.affectedKeys, ...cur.affectedKeys]) : cur.affectedKeys;
                return { ...cur, affectedKeys: newAffectedKeys };
            }, 1000, true);
            this._register(debouncedConfigService(event => {
                if (event.source !== 7 /* ConfigurationTarget.DEFAULT */) {
                    telemetryService.publicLog2('updateConfiguration', {
                        configurationSource: (0, configuration_1.ConfigurationTargetToString)(event.source),
                        configurationKeys: Array.from(event.affectedKeys)
                    });
                }
            }));
            const { user, workspace } = configurationService.keys();
            for (const setting of user) {
                this.reportTelemetry(setting, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
            for (const setting of workspace) {
                this.reportTelemetry(setting, 5 /* ConfigurationTarget.WORKSPACE */);
            }
        }
        /**
         * Report value of a setting only if it is an enum, boolean, or number or an array of those.
         */
        getValueToReport(key, target) {
            const inpsectData = this.configurationService.inspect(key);
            const value = target === 3 /* ConfigurationTarget.USER_LOCAL */ ? inpsectData.user?.value : inpsectData.workspace?.value;
            if ((0, types_1.isNumber)(value) || (0, types_1.isBoolean)(value)) {
                return value.toString();
            }
            const schema = this.configurationRegistry.getConfigurationProperties()[key];
            if ((0, types_1.isString)(value)) {
                if (schema?.enum?.includes(value)) {
                    return value;
                }
                return undefined;
            }
            if (Array.isArray(value)) {
                if (value.every(v => (0, types_1.isNumber)(v) || (0, types_1.isBoolean)(v) || ((0, types_1.isString)(v) && schema?.enum?.includes(v)))) {
                    return JSON.stringify(value);
                }
            }
            return undefined;
        }
        reportTelemetry(key, target) {
            const source = (0, configuration_1.ConfigurationTargetToString)(target);
            switch (key) {
                case "workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */:
                    this.telemetryService.publicLog2('workbench.activityBar.location', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case extensions_1.AutoUpdateConfigurationKey:
                    this.telemetryService.publicLog2('extensions.autoUpdate', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'files.autoSave':
                    this.telemetryService.publicLog2('files.autoSave', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'editor.stickyScroll.enabled':
                    this.telemetryService.publicLog2('editor.stickyScroll.enabled', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case chatService_1.KEYWORD_ACTIVIATION_SETTING_ID:
                    this.telemetryService.publicLog2('accessibility.voice.keywordActivation', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.zoomLevel':
                    this.telemetryService.publicLog2('window.zoomLevel', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.zoomPerWindow':
                    this.telemetryService.publicLog2('window.zoomPerWindow', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.titleBarStyle':
                    this.telemetryService.publicLog2('window.titleBarStyle', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.customTitleBarVisibility':
                    this.telemetryService.publicLog2('window.customTitleBarVisibility', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'window.nativeTabs':
                    this.telemetryService.publicLog2('window.nativeTabs', { settingValue: this.getValueToReport(key, target), source });
                    return;
                case 'extensions.verifySignature':
                    this.telemetryService.publicLog2('extensions.verifySignature', { settingValue: this.getValueToReport(key, target), source });
                    return;
            }
        }
    };
    ConfigurationTelemetryContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, telemetry_1.ITelemetryService)
    ], ConfigurationTelemetryContribution);
    const workbenchContributionRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionRegistry.registerWorkbenchContribution(TelemetryContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionRegistry.registerWorkbenchContribution(ConfigurationTelemetryContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVsZW1ldHJ5L2Jyb3dzZXIvdGVsZW1ldHJ5LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBaUR6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVOztpQkFFckMsbUJBQWMsR0FBRyxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsZUFBZSxDQUFDLEFBQTFJLENBQTJJO2lCQUN6Siw2QkFBd0IsR0FBRyxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLEFBQXBFLENBQXFFO1FBRTVHLFlBQ3FDLGdCQUFtQyxFQUM1QixjQUF3QyxFQUNoRSxnQkFBbUMsRUFDdEMsYUFBNkIsRUFDekIsa0JBQXNDLEVBQ2xDLFlBQW9DLEVBQzlCLGtCQUFnRCxFQUNwQyxzQkFBK0MsRUFDOUQsb0JBQStDLEVBQ3hELGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBWDRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBTXpDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFNekYsTUFBTSxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQztZQUM5RSxNQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxzQkFBc0IsdUNBQStCLENBQUM7WUEyQ2pHLGdCQUFnQixDQUFDLFVBQVUsQ0FBa0QsZUFBZSxFQUFFO2dC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