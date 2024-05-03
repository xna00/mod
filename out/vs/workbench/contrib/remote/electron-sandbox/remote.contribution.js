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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/keyCodes", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/label/common/label", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/workbench/services/extensions/common/extensions", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/contextkey/common/contextkey", "vs/platform/native/common/native", "vs/platform/storage/common/storage"], function (require, exports, nls, platform_1, remoteAgentService_1, lifecycle_1, platform_2, keyCodes_1, keybindingsRegistry_1, contributions_1, lifecycle_2, label_1, commands_1, network_1, extensions_1, globals_1, environmentService_1, configuration_1, configurationRegistry_1, remoteAuthorityResolver_1, simpleFileDialog_1, workspace_1, telemetry_1, telemetryUtils_1, contextkey_1, native_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteAgentDiagnosticListener = class RemoteAgentDiagnosticListener {
        constructor(remoteAgentService, labelService) {
            globals_1.ipcRenderer.on('vscode:getDiagnosticInfo', (event, request) => {
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const hostName = labelService.getHostLabel(network_1.Schemas.vscodeRemote, connection.remoteAuthority);
                    remoteAgentService.getDiagnosticInfo(request.args)
                        .then(info => {
                        if (info) {
                            info.hostName = hostName;
                            if (remoteAgentService_1.remoteConnectionLatencyMeasurer.latency?.high) {
                                info.latency = {
                                    average: remoteAgentService_1.remoteConnectionLatencyMeasurer.latency.average,
                                    current: remoteAgentService_1.remoteConnectionLatencyMeasurer.latency.current
                                };
                            }
                        }
                        globals_1.ipcRenderer.send(request.replyChannel, info);
                    })
                        .catch(e => {
                        const errorMessage = e && e.message ? `Connection to '${hostName}' could not be established  ${e.message}` : `Connection to '${hostName}' could not be established `;
                        globals_1.ipcRenderer.send(request.replyChannel, { hostName, errorMessage });
                    });
                }
                else {
                    globals_1.ipcRenderer.send(request.replyChannel);
                }
            });
        }
    };
    RemoteAgentDiagnosticListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService)
    ], RemoteAgentDiagnosticListener);
    let RemoteExtensionHostEnvironmentUpdater = class RemoteExtensionHostEnvironmentUpdater {
        constructor(remoteAgentService, remoteResolverService, extensionService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.onDidStateChange(async (e) => {
                    if (e.type === 4 /* PersistentConnectionEventType.ConnectionGain */) {
                        const resolveResult = await remoteResolverService.resolveAuthority(connection.remoteAuthority);
                        if (resolveResult.options && resolveResult.options.extensionHostEnv) {
                            await extensionService.setRemoteEnvironment(resolveResult.options.extensionHostEnv);
                        }
                    }
                });
            }
        }
    };
    RemoteExtensionHostEnvironmentUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, extensions_1.IExtensionService)
    ], RemoteExtensionHostEnvironmentUpdater);
    let RemoteTelemetryEnablementUpdater = class RemoteTelemetryEnablementUpdater extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.remoteTelemetryEnablementUpdater'; }
        constructor(remoteAgentService, configurationService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this.configurationService = configurationService;
            this.updateRemoteTelemetryEnablement();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(telemetry_1.TELEMETRY_SETTING_ID)) {
                    this.updateRemoteTelemetryEnablement();
                }
            }));
        }
        updateRemoteTelemetryEnablement() {
            return this.remoteAgentService.updateTelemetryLevel((0, telemetryUtils_1.getTelemetryLevel)(this.configurationService));
        }
    };
    RemoteTelemetryEnablementUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService)
    ], RemoteTelemetryEnablementUpdater);
    let RemoteEmptyWorkbenchPresentation = class RemoteEmptyWorkbenchPresentation extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.remoteEmptyWorkbenchPresentation'; }
        constructor(environmentService, remoteAuthorityResolverService, configurationService, commandService, contextService) {
            super();
            function shouldShowExplorer() {
                const startupEditor = configurationService.getValue('workbench.startupEditor');
                return startupEditor !== 'welcomePage' && startupEditor !== 'welcomePageInEmptyWorkbench';
            }
            function shouldShowTerminal() {
                return shouldShowExplorer();
            }
            const { remoteAuthority, filesToDiff, filesToMerge, filesToOpenOrCreate, filesToWait } = environmentService;
            if (remoteAuthority && contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && !filesToDiff?.length && !filesToMerge?.length && !filesToOpenOrCreate?.length && !filesToWait) {
                remoteAuthorityResolverService.resolveAuthority(remoteAuthority).then(() => {
                    if (shouldShowExplorer()) {
                        commandService.executeCommand('workbench.view.explorer');
                    }
                    if (shouldShowTerminal()) {
                        commandService.executeCommand('workbench.action.terminal.toggleTerminal');
                    }
                });
            }
        }
    };
    RemoteEmptyWorkbenchPresentation = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], RemoteEmptyWorkbenchPresentation);
    /**
     * Sets the 'wslFeatureInstalled' context key if the WSL feature is or was installed on this machine.
     */
    let WSLContextKeyInitializer = class WSLContextKeyInitializer extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.wslContextKeyInitializer'; }
        constructor(contextKeyService, nativeHostService, storageService, lifecycleService) {
            super();
            const contextKeyId = 'wslFeatureInstalled';
            const storageKey = 'remote.wslFeatureInstalled';
            const defaultValue = storageService.getBoolean(storageKey, -1 /* StorageScope.APPLICATION */, undefined);
            const hasWSLFeatureContext = new contextkey_1.RawContextKey(contextKeyId, !!defaultValue, nls.localize('wslFeatureInstalled', "Whether the platform has the WSL feature installed"));
            const contextKey = hasWSLFeatureContext.bindTo(contextKeyService);
            if (defaultValue === undefined) {
                lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(async () => {
                    nativeHostService.hasWSLFeatureInstalled().then(res => {
                        if (res) {
                            contextKey.set(true);
                            // once detected, set to true
                            storageService.store(storageKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                        }
                    });
                });
            }
        }
    };
    WSLContextKeyInitializer = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, native_1.INativeHostService),
        __param(2, storage_1.IStorageService),
        __param(3, lifecycle_2.ILifecycleService)
    ], WSLContextKeyInitializer);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentDiagnosticListener, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteExtensionHostEnvironmentUpdater, 4 /* LifecyclePhase.Eventually */);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteTelemetryEnablementUpdater.ID, RemoteTelemetryEnablementUpdater, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteEmptyWorkbenchPresentation.ID, RemoteEmptyWorkbenchPresentation, 2 /* WorkbenchPhase.BlockRestore */);
    if (platform_2.isWindows) {
        (0, contributions_1.registerWorkbenchContribution2)(WSLContextKeyInitializer.ID, WSLContextKeyInitializer, 2 /* WorkbenchPhase.BlockRestore */);
    }
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: nls.localize('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.downloadExtensionsLocally': {
                type: 'boolean',
                markdownDescription: nls.localize('remote.downloadExtensionsLocally', "When enabled extensions are downloaded locally and installed on remote."),
                default: false
            },
        }
    });
    if (platform_2.isMacintosh) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileFolderCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */,
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFileFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileFolderCommand.handler()
        });
    }
    else {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */,
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFileCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileCommand.handler()
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFolderCommand.ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */),
            when: simpleFileDialog_1.RemoteFileDialogContext,
            metadata: { description: simpleFileDialog_1.OpenLocalFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFolderCommand.handler()
        });
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: simpleFileDialog_1.SaveLocalFileCommand.ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 49 /* KeyCode.KeyS */,
        when: simpleFileDialog_1.RemoteFileDialogContext,
        metadata: { description: simpleFileDialog_1.SaveLocalFileCommand.LABEL, args: [] },
        handler: simpleFileDialog_1.SaveLocalFileCommand.handler()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2VsZWN0cm9uLXNhbmRib3gvcmVtb3RlLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQThCaEcsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBNkI7UUFDbEMsWUFDc0Isa0JBQXVDLEVBQzdDLFlBQTJCO1lBRTFDLHFCQUFXLENBQUMsRUFBRSxDQUFDLDBCQUEwQixFQUFFLENBQUMsS0FBYyxFQUFFLE9BQStELEVBQVEsRUFBRTtnQkFDcEksTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3RELElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsaUJBQU8sQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUM3RixrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO3lCQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ1osSUFBSSxJQUFJLEVBQUUsQ0FBQzs0QkFDVCxJQUE4QixDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7NEJBQ3BELElBQUksb0RBQStCLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO2dDQUNsRCxJQUE4QixDQUFDLE9BQU8sR0FBRztvQ0FDekMsT0FBTyxFQUFFLG9EQUErQixDQUFDLE9BQU8sQ0FBQyxPQUFPO29DQUN4RCxPQUFPLEVBQUUsb0RBQStCLENBQUMsT0FBTyxDQUFDLE9BQU87aUNBQ3hELENBQUM7NEJBQ0gsQ0FBQzt3QkFDRixDQUFDO3dCQUVE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