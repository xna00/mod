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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/base/common/platform", "vs/base/common/network", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/log/common/log", "vs/nls", "vs/base/common/lifecycle", "vs/platform/configuration/common/configurationRegistry", "vs/platform/files/common/files", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/download/common/download", "vs/platform/download/common/downloadIpc", "vs/platform/log/common/logIpc"], function (require, exports, contributions_1, platform_1, label_1, platform_2, network_1, remoteAgentService_1, log_1, nls_1, lifecycle_1, configurationRegistry_1, files_1, dialogs_1, environmentService_1, workspace_1, arrays_1, actions_1, actionCommonCategories_1, remoteAgentConnection_1, download_1, downloadIpc_1, logIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelContribution = void 0;
    let LabelContribution = class LabelContribution {
        static { this.ID = 'workbench.contrib.remoteLabel'; }
        constructor(labelService, remoteAgentService) {
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.registerFormatters();
        }
        registerFormatters() {
            this.remoteAgentService.getEnvironment().then(remoteEnvironment => {
                const os = remoteEnvironment?.os || platform_2.OS;
                const formatting = {
                    label: '${path}',
                    separator: os === 1 /* OperatingSystem.Windows */ ? '\\' : '/',
                    tildify: os !== 1 /* OperatingSystem.Windows */,
                    normalizeDriveLetter: os === 1 /* OperatingSystem.Windows */,
                    workspaceSuffix: platform_2.isWeb ? undefined : network_1.Schemas.vscodeRemote
                };
                this.labelService.registerFormatter({
                    scheme: network_1.Schemas.vscodeRemote,
                    formatting
                });
                if (remoteEnvironment) {
                    this.labelService.registerFormatter({
                        scheme: network_1.Schemas.vscodeUserData,
                        formatting
                    });
                }
            });
        }
    };
    exports.LabelContribution = LabelContribution;
    exports.LabelContribution = LabelContribution = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, remoteAgentService_1.IRemoteAgentService)
    ], LabelContribution);
    let RemoteChannelsContribution = class RemoteChannelsContribution extends lifecycle_1.Disposable {
        constructor(remoteAgentService, downloadService, loggerService) {
            super();
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.registerChannel('download', new downloadIpc_1.DownloadServiceChannel(downloadService));
                connection.withChannel('logger', async (channel) => this._register(new logIpc_1.RemoteLoggerChannelClient(loggerService, channel)));
            }
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, download_1.IDownloadService),
        __param(2, log_1.ILoggerService)
    ], RemoteChannelsContribution);
    let RemoteInvalidWorkspaceDetector = class RemoteInvalidWorkspaceDetector extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.remoteInvalidWorkspaceDetector'; }
        constructor(fileService, dialogService, environmentService, contextService, fileDialogService, remoteAgentService) {
            super();
            this.fileService = fileService;
            this.dialogService = dialogService;
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.fileDialogService = fileDialogService;
            // When connected to a remote workspace, we currently cannot
            // validate that the workspace exists before actually opening
            // it. As such, we need to check on that after startup and guide
            // the user to a valid workspace.
            // (see https://github.com/microsoft/vscode/issues/133872)
            if (this.environmentService.remoteAuthority) {
                remoteAgentService.getEnvironment().then(remoteEnv => {
                    if (remoteEnv) {
                        // we use the presence of `remoteEnv` to figure out
                        // if we got a healthy remote connection
                        // (see https://github.com/microsoft/vscode/issues/135331)
                        this.validateRemoteWorkspace();
                    }
                });
            }
        }
        async validateRemoteWorkspace() {
            const workspace = this.contextService.getWorkspace();
            const workspaceUriToStat = workspace.configuration ?? (0, arrays_1.firstOrDefault)(workspace.folders)?.uri;
            if (!workspaceUriToStat) {
                return; // only when in workspace
            }
            const exists = await this.fileService.exists(workspaceUriToStat);
            if (exists) {
                return; // all good!
            }
            const res = await this.dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('invalidWorkspaceMessage', "Workspace does not exist"),
                detail: (0, nls_1.localize)('invalidWorkspaceDetail', "Please select another workspace to open."),
                primaryButton: (0, nls_1.localize)({ key: 'invalidWorkspacePrimary', comment: ['&& denotes a mnemonic'] }, "&&Open Workspace...")
            });
            if (res.confirmed) {
                // Pick Workspace
                if (workspace.configuration) {
                    return this.fileDialogService.pickWorkspaceAndOpen({});
                }
                // Pick Folder
                return this.fileDialogService.pickFolderAndOpen({});
            }
        }
    };
    RemoteInvalidWorkspaceDetector = __decorate([
        __param(0, files_1.IFileService),
        __param(1, dialogs_1.IDialogService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, remoteAgentService_1.IRemoteAgentService)
    ], RemoteInvalidWorkspaceDetector);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(LabelContribution.ID, LabelContribution, 1 /* WorkbenchPhase.BlockStartup */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 3 /* LifecyclePhase.Restored */);
    (0, contributions_1.registerWorkbenchContribution2)(RemoteInvalidWorkspaceDetector.ID, RemoteInvalidWorkspaceDetector, 1 /* WorkbenchPhase.BlockStartup */);
    const enableDiagnostics = true;
    if (enableDiagnostics) {
        class TriggerReconnectAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.triggerReconnect',
                    title: (0, nls_1.localize2)('triggerReconnect', 'Connection: Trigger Reconnect'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                });
            }
            async run(accessor) {
                remoteAgentConnection_1.PersistentConnection.debugTriggerReconnection();
            }
        }
        class PauseSocketWriting extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.pauseSocketWriting',
                    title: (0, nls_1.localize2)('pauseSocketWriting', 'Connection: Pause socket writing'),
                    category: actionCommonCategories_1.Categories.Developer,
                    f1: true,
                });
            }
            async run(accessor) {
                remoteAgentConnection_1.PersistentConnection.debugPauseSocketWriting();
            }
        }
        (0, actions_1.registerAction2)(TriggerReconnectAction);
        (0, actions_1.registerAction2)(PauseSocketWriting);
    }
    const extensionKindSchema = {
        type: 'string',
        enum: [
            'ui',
            'workspace'
        ],
        enumDescriptions: [
            (0, nls_1.localize)('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
            (0, nls_1.localize)('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.")
        ],
    };
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: (0, nls_1.localize)('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.extensionKind': {
                type: 'object',
                markdownDescription: (0, nls_1.localize)('remote.extensionKind', "Override the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote. By overriding an extension's default kind using this setting, you specify if that extension should be installed and enabled locally or remotely."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9-A-Z]*)\\.([a-z0-9A-Z][a-z0-9-A-Z]*)$': {
                        oneOf: [{ type: 'array', items: extensionKindSchema }, extensionKindSchema],
                        default: ['ui'],
                    },
                },
                default: {
                    'pub.name': ['ui']
                }
            },
            'remote.restoreForwardedPorts': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('remote.restoreForwardedPorts', "Restores the ports you forwarded in a workspace."),
                default: true
            },
            'remote.autoForwardPorts': {
                type: 'boolean',
                markdownDescription: (0, nls_1.localize)('remote.autoForwardPorts', "When enabled, new running processes are detected and ports that they listen on are automatically forwarded. Disabling this setting will not prevent all ports from being forwarded. Even when disabled, extensions will still be able to cause ports to be forwarded, and opening some URLs will still cause ports to forwarded."),
                default: true
            },
            'remote.autoForwardPortsSource': {
                type: 'string',
                markdownDescription: (0, nls_1.localize)('remote.autoForwardPortsSource', "Sets the source from which ports are automatically forwarded when {0} is true. On Windows and macOS remotes, the `process` and `hybrid` options have no effect and `output` will be used.", '`#remote.autoForwardPorts#`'),
                enum: ['process', 'output', 'hybrid'],
                enumDescriptions: [
                    (0, nls_1.localize)('remote.autoForwardPortsSource.process', "Ports will be automatically forwarded when discovered by watching for processes that are started and include a port."),
                    (0, nls_1.localize)('remote.autoForwardPortsSource.output', "Ports will be automatically forwarded when discovered by reading terminal and debug output. Not all processes that use ports will print to the integrated terminal or debug console, so some ports will be missed. Ports forwarded based on output will not be \"un-forwarded\" until reload or until the port is closed by the user in the Ports view."),
                    (0, nls_1.localize)('remote.autoForwardPortsSource.hybrid', "Ports will be automatically forwarded when discovered by reading terminal and debug output. Not all processes that use ports will print to the integrated terminal or debug console, so some ports will be missed. Ports will be \"un-forwarded\" by watching for processes that listen on that port to be terminated.")
                ],
                default: 'process'
            },
            'remote.autoForwardPortsFallback': {
                type: 'number',
                default: 20,
                markdownDescription: (0, nls_1.localize)('remote.autoForwardPortFallback', "The number of auto forwarded ports that will trigger the switch from `process` to `hybrid` when automatically forwarding ports and `remote.autoForwardPortsSource` is set to `process` by default. Set to `0` to disable the fallback. When `remote.autoForwardPortsFallback` hasn't been configured, but `remote.autoForwardPortsSource` has, `remote.autoForwardPortsFallback` will be treated as though it's set to `0`.")
            },
            'remote.forwardOnOpen': {
                type: 'boolean',
                description: (0, nls_1.localize)('remote.forwardOnClick', "Controls whether local URLs with a port will be forwarded when opened from the terminal and the debug console."),
                default: true
            },
            // Consider making changes to extensions\configuration-editing\schemas\devContainer.schema.src.json
            // and extensions\configuration-editing\schemas\attachContainer.schema.json
            // to keep in sync with devcontainer.json schema.
            'remote.portsAttributes': {
                type: 'object',
                patternProperties: {
                    '(^\\d+(-\\d+)?$)|(.+)': {
                        type: 'object',
                        description: (0, nls_1.localize)('remote.portsAttributes.port', "A port, range of ports (ex. \"40000-55000\"), host and port (ex. \"db:1234\"), or regular expression (ex. \".+\\\\/server.js\").  For a port number or range, the attributes will apply to that port number or range of port numbers. Attributes which use a regular expression will apply to ports whose associated process command line matches the expression."),
                        properties: {
                            'onAutoForward': {
                                type: 'string',
                                enum: ['notify', 'openBrowser', 'openBrowserOnce', 'openPreview', 'silent', 'ignore'],
                                enumDescriptions: [
                                    (0, nls_1.localize)('remote.portsAttributes.notify', "Shows a notification when a port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.openBrowser', "Opens the browser when the port is automatically forwarded. Depending on your settings, this could open an embedded browser."),
                                    (0, nls_1.localize)('remote.portsAttributes.openBrowserOnce', "Opens the browser when the port is automatically forwarded, but only the first time the port is forward during a session. Depending on your settings, this could open an embedded browser."),
                                    (0, nls_1.localize)('remote.portsAttributes.openPreview', "Opens a preview in the same window when the port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.silent', "Shows no notification and takes no action when this port is automatically forwarded."),
                                    (0, nls_1.localize)('remote.portsAttributes.ignore', "This port will not be automatically forwarded.")
                                ],
                                description: (0, nls_1.localize)('remote.portsAttributes.onForward', "Defines the action that occurs when the port is discovered for automatic forwarding"),
                                default: 'notify'
                            },
                            'elevateIfNeeded': {
                                type: 'boolean',
                                description: (0, nls_1.localize)('remote.portsAttributes.elevateIfNeeded', "Automatically prompt for elevation (if needed) when this port is forwarded. Elevate is required if the local port is a privileged port."),
                                default: false
                            },
                            'label': {
                                type: 'string',
                                description: (0, nls_1.localize)('remote.portsAttributes.label', "Label that will be shown in the UI for this port."),
                                default: (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application")
                            },
                            'requireLocalPort': {
                                type: 'boolean',
                                markdownDescription: (0, nls_1.localize)('remote.portsAttributes.requireLocalPort', "When true, a modal dialog will show if the chosen local port isn't used for forwarding."),
                                default: false
                            },
                            'protocol': {
                                type: 'string',
                                enum: ['http', 'https'],
                                description: (0, nls_1.localize)('remote.portsAttributes.protocol', "The protocol to use when forwarding this port.")
                            }
                        },
                        default: {
                            'label': (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application"),
                            'onAutoForward': 'notify'
                        }
                    }
                },
                markdownDescription: (0, nls_1.localize)('remote.portsAttributes', "Set properties that are applied when a specific port number is forwarded. For example:\n\n```\n\"3000\": {\n  \"label\": \"Application\"\n},\n\"40000-55000\": {\n  \"onAutoForward\": \"ignore\"\n},\n\".+\\\\/server.js\": {\n \"onAutoForward\": \"openPreview\"\n}\n```"),
                defaultSnippets: [{ body: { '${1:3000}': { label: '${2:Application}', onAutoForward: 'openPreview' } } }],
                errorMessage: (0, nls_1.localize)('remote.portsAttributes.patternError', "Must be a port number, range of port numbers, or regular expression."),
                additionalProperties: false,
                default: {
                    '443': {
                        'protocol': 'https'
                    },
                    '8443': {
                        'protocol': 'https'
                    }
                }
            },
            'remote.otherPortsAttributes': {
                type: 'object',
                properties: {
                    'onAutoForward': {
                        type: 'string',
                        enum: ['notify', 'openBrowser', 'openPreview', 'silent', 'ignore'],
                        enumDescriptions: [
                            (0, nls_1.localize)('remote.portsAttributes.notify', "Shows a notification when a port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.openBrowser', "Opens the browser when the port is automatically forwarded. Depending on your settings, this could open an embedded browser."),
                            (0, nls_1.localize)('remote.portsAttributes.openPreview', "Opens a preview in the same window when the port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.silent', "Shows no notification and takes no action when this port is automatically forwarded."),
                            (0, nls_1.localize)('remote.portsAttributes.ignore', "This port will not be automatically forwarded.")
                        ],
                        description: (0, nls_1.localize)('remote.portsAttributes.onForward', "Defines the action that occurs when the port is discovered for automatic forwarding"),
                        default: 'notify'
                    },
                    'elevateIfNeeded': {
                        type: 'boolean',
                        description: (0, nls_1.localize)('remote.portsAttributes.elevateIfNeeded', "Automatically prompt for elevation (if needed) when this port is forwarded. Elevate is required if the local port is a privileged port."),
                        default: false
                    },
                    'label': {
                        type: 'string',
                        description: (0, nls_1.localize)('remote.portsAttributes.label', "Label that will be shown in the UI for this port."),
                        default: (0, nls_1.localize)('remote.portsAttributes.labelDefault', "Application")
                    },
                    'requireLocalPort': {
                        type: 'boolean',
                        markdownDescription: (0, nls_1.localize)('remote.portsAttributes.requireLocalPort', "When true, a modal dialog will show if the chosen local port isn't used for forwarding."),
                        default: false
                    },
                    'protocol': {
                        type: 'string',
                        enum: ['http', 'https'],
                        description: (0, nls_1.localize)('remote.portsAttributes.protocol', "The protocol to use when forwarding this port.")
                    }
                },
                defaultSnippets: [{ body: { onAutoForward: 'ignore' } }],
                markdownDescription: (0, nls_1.localize)('remote.portsAttributes.defaults', "Set default properties that are applied to all ports that don't get properties from the setting {0}. For example:\n\n```\n{\n  \"onAutoForward\": \"ignore\"\n}\n```", '`#remote.portsAttributes#`'),
                additionalProperties: false
            },
            'remote.localPortHost': {
                type: 'string',
                enum: ['localhost', 'allInterfaces'],
                default: 'localhost',
                description: (0, nls_1.localize)('remote.localPortHost', "Specifies the local host name that will be used for port forwarding.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2NvbW1vbi9yZW1vdGUuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7aUJBRWIsT0FBRSxHQUFHLCtCQUErQixBQUFsQyxDQUFtQztRQUVyRCxZQUNpQyxZQUEyQixFQUNyQixrQkFBdUM7WUFEN0MsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDckIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM3RSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRTtnQkFDakUsTUFBTSxFQUFFLEdBQUcsaUJBQWlCLEVBQUUsRUFBRSxJQUFJLGFBQUUsQ0FBQztnQkFDdkMsTUFBTSxVQUFVLEdBQTRCO29CQUMzQyxLQUFLLEVBQUUsU0FBUztvQkFDaEIsU0FBUyxFQUFFLEVBQUUsb0NBQTRCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztvQkFDdEQsT0FBTyxFQUFFLEVBQUUsb0NBQTRCO29CQUN2QyxvQkFBb0IsRUFBRSxFQUFFLG9DQUE0QjtvQkFDcEQsZUFBZSxFQUFFLGdCQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxZQUFZO2lCQUN6RCxDQUFDO2dCQUNGLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUM7b0JBQ25DLE1BQU0sRUFBRSxpQkFB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