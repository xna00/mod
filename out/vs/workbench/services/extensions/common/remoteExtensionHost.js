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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/platform/debug/common/extensionHostDebug", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/sign/common/sign", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/extensions/common/extensionHostProtocol"], function (require, exports, buffer_1, event_1, lifecycle_1, network_1, platform, extensionHostDebug_1, label_1, log_1, productService_1, remoteAgentConnection_1, remoteAuthorityResolver_1, remoteSocketFactoryService_1, sign_1, telemetry_1, telemetryUtils_1, workspace_1, environmentService_1, extensionDevOptions_1, extensionHostProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionHost = void 0;
    let RemoteExtensionHost = class RemoteExtensionHost extends lifecycle_1.Disposable {
        constructor(runningLocation, _initDataProvider, remoteSocketFactoryService, _contextService, _environmentService, _telemetryService, _logService, _loggerService, _labelService, remoteAuthorityResolverService, _extensionHostDebugService, _productService, _signService) {
            super();
            this.runningLocation = runningLocation;
            this._initDataProvider = _initDataProvider;
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this._contextService = _contextService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._labelService = _labelService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this._extensionHostDebugService = _extensionHostDebugService;
            this._productService = _productService;
            this._signService = _signService;
            this.pid = null;
            this.startup = 1 /* ExtensionHostStartup.EagerAutoStart */;
            this.extensions = null;
            this._onExit = this._register(new event_1.Emitter());
            this.onExit = this._onExit.event;
            this.remoteAuthority = this._initDataProvider.remoteAuthority;
            this._protocol = null;
            this._hasLostConnection = false;
            this._terminating = false;
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevHost = devOpts.isExtensionDevHost;
        }
        start() {
            const options = {
                commit: this._productService.commit,
                quality: this._productService.quality,
                addressProvider: {
                    getAddress: async () => {
                        const { authority } = await this.remoteAuthorityResolverService.resolveAuthority(this._initDataProvider.remoteAuthority);
                        return { connectTo: authority.connectTo, connectionToken: authority.connectionToken };
                    }
                },
                remoteSocketFactoryService: this.remoteSocketFactoryService,
                signService: this._signService,
                logService: this._logService,
                ipcLogger: null
            };
            return this.remoteAuthorityResolverService.resolveAuthority(this._initDataProvider.remoteAuthority).then((resolverResult) => {
                const startParams = {
                    language: platform.language,
                    debugId: this._environmentService.debugExtensionHost.debugId,
                    break: this._environmentService.debugExtensionHost.break,
                    port: this._environmentService.debugExtensionHost.port,
                    env: { ...this._environmentService.debugExtensionHost.env, ...resolverResult.options?.extensionHostEnv },
                };
                const extDevLocs = this._environmentService.extensionDevelopmentLocationURI;
                let debugOk = true;
                if (extDevLocs && extDevLocs.length > 0) {
                    // TODO@AW: handles only first path in array
                    if (extDevLocs[0].scheme === network_1.Schemas.file) {
                        debugOk = false;
                    }
                }
                if (!debugOk) {
                    startParams.break = false;
                }
                return (0, remoteAgentConnection_1.connectRemoteAgentExtensionHost)(options, startParams).then(result => {
                    this._register(result);
                    const { protocol, debugPort, reconnectionToken } = result;
                    const isExtensionDevelopmentDebug = typeof debugPort === 'number';
                    if (debugOk && this._environmentService.isExtensionDevelopment && this._environmentService.debugExtensionHost.debugId && debugPort) {
                        this._extensionHostDebugService.attachSession(this._environmentService.debugExtensionHost.debugId, debugPort, this._initDataProvider.remoteAuthority);
                    }
                    protocol.onDidDispose(() => {
                        this._onExtHostConnectionLost(reconnectionToken);
                    });
                    protocol.onSocketClose(() => {
                        if (this._isExtensionDevHost) {
                            this._onExtHostConnectionLost(reconnectionToken);
                        }
                    });
                    // 1) wait for the incoming `ready` event and send the initialization data.
                    // 2) wait for the incoming `initialized` event.
                    return new Promise((resolve, reject) => {
                        const handle = setTimeout(() => {
                            reject('The remote extension host took longer than 60s to send its ready message.');
                        }, 60 * 1000);
                        const disposable = protocol.onMessage(msg => {
                            if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)) {
                                // 1) Extension Host is ready to receive messages, initialize it
                                this._createExtHostInitData(isExtensionDevelopmentDebug).then(data => {
                                    protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(data)));
                                });
                                return;
                            }
                            if ((0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)) {
                                // 2) Extension Host is initialized
                                clearTimeout(handle);
                                // stop listening for messages here
                                disposable.dispose();
                                // release this promise
                                this._protocol = protocol;
                                resolve(protocol);
                                return;
                            }
                            console.error(`received unexpected message during handshake phase from the extension host: `, msg);
                        });
                    });
                });
            });
        }
        _onExtHostConnectionLost(reconnectionToken) {
            if (this._hasLostConnection) {
                // avoid re-entering this method
                return;
            }
            this._hasLostConnection = true;
            if (this._isExtensionDevHost && this._environmentService.debugExtensionHost.debugId) {
                this._extensionHostDebugService.close(this._environmentService.debugExtensionHost.debugId);
            }
            if (this._terminating) {
                // Expected termination path (we asked the process to terminate)
                return;
            }
            this._onExit.fire([0, reconnectionToken]);
        }
        async _createExtHostInitData(isExtensionDevelopmentDebug) {
            const remoteInitData = await this._initDataProvider.getInitData();
            this.extensions = remoteInitData.extensions;
            const workspace = this._contextService.getWorkspace();
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                quality: this._productService.quality,
                parentPid: remoteInitData.pid,
                environment: {
                    isExtensionDevelopmentDebug,
                    appRoot: remoteInitData.appRoot,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier || 'desktop',
                    appUriScheme: this._productService.urlProtocol,
                    extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
                    isExtensionTelemetryLoggingOnly: (0, telemetryUtils_1.isLoggingOnly)(this._productService, this._environmentService),
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: remoteInitData.globalStorageHome,
                    workspaceStorageHome: remoteInitData.workspaceStorageHome,
                    extensionLogLevel: this._environmentService.extensionLogLevel
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? null : {
                    configuration: workspace.configuration,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    transient: workspace.transient
                },
                remote: {
                    isRemote: true,
                    authority: this._initDataProvider.remoteAuthority,
                    connectionData: remoteInitData.connectionData
                },
                consoleForward: {
                    includeStack: false,
                    logNative: Boolean(this._environmentService.debugExtensionHost.debugId)
                },
                extensions: this.extensions.toSnapshot(),
                telemetryInfo: {
                    sessionId: this._telemetryService.sessionId,
                    machineId: this._telemetryService.machineId,
                    sqmId: this._telemetryService.sqmId,
                    firstSessionDate: this._telemetryService.firstSessionDate,
                    msftInternal: this._telemetryService.msftInternal
                },
                logLevel: this._logService.getLevel(),
                loggers: [...this._loggerService.getRegisteredLoggers()],
                logsLocation: remoteInitData.extensionHostLogsPath,
                autoStart: (this.startup === 1 /* ExtensionHostStartup.EagerAutoStart */),
                uiKind: platform.isWeb ? extensionHostProtocol_1.UIKind.Web : extensionHostProtocol_1.UIKind.Desktop
            };
        }
        getInspectPort() {
            return undefined;
        }
        enableInspectPort() {
            return Promise.resolve(false);
        }
        dispose() {
            super.dispose();
            this._terminating = true;
            if (this._protocol) {
                // Send the extension host a request to terminate itself
                // (graceful termination)
                // setTimeout(() => {
                // console.log(`SENDING TERMINATE TO REMOTE EXT HOST!`);
                const socket = this._protocol.getSocket();
                this._protocol.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
                this._protocol.sendDisconnect();
                this._protocol.dispose();
                // this._protocol.drain();
                socket.end();
                this._protocol = null;
                // }, 1000);
            }
        }
    };
    exports.RemoteExtensionHost = RemoteExtensionHost;
    exports.RemoteExtensionHost = RemoteExtensionHost = __decorate([
        __param(2, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService),
        __param(7, log_1.ILoggerService),
        __param(8, label_1.ILabelService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, extensionHostDebug_1.IExtensionHostDebugService),
        __param(11, productService_1.IProductService),
        __param(12, sign_1.ISignService)
    ], RemoteExtensionHost);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uSG9zdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvY29tbW9uL3JlbW90ZUV4dGVuc2lvbkhvc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEN6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBZWxELFlBQ2lCLGVBQXNDLEVBQ3JDLGlCQUFtRCxFQUN2QywwQkFBd0UsRUFDM0UsZUFBMEQsRUFDdEQsbUJBQWtFLEVBQzdFLGlCQUFxRCxFQUMzRCxXQUF5QyxFQUN0QyxjQUFpRCxFQUNsRCxhQUE2QyxFQUMzQiw4QkFBZ0YsRUFDckYsMEJBQXVFLEVBQ2xGLGVBQWlELEVBQ3BELFlBQTJDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBZFEsb0JBQWUsR0FBZixlQUFlLENBQXVCO1lBQ3JDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBa0M7WUFDdEIsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE2QjtZQUMxRCxvQkFBZSxHQUFmLGVBQWUsQ0FBMEI7WUFDckMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUM1RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQzFDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ25CLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUNqQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNWLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBaUM7WUFDcEUsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUE0QjtZQUNqRSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDbkMsaUJBQVksR0FBWixZQUFZLENBQWM7WUExQjFDLFFBQUcsR0FBRyxJQUFJLENBQUM7WUFFWCxZQUFP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