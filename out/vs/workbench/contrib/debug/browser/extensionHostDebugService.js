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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/debug/common/extensionHostDebug", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/window/common/window", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, event_1, uri_1, extensionHostDebug_1, extensionHostDebugIpc_1, files_1, extensions_1, log_1, storage_1, window_1, workspace_1, environmentService_1, host_1, remoteAgentService_1) {
    "use strict";
    var BrowserExtensionHostDebugService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserExtensionHostDebugService = class BrowserExtensionHostDebugService extends extensionHostDebugIpc_1.ExtensionHostDebugChannelClient {
        static { BrowserExtensionHostDebugService_1 = this; }
        static { this.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY = 'debug.lastExtensionDevelopmentWorkspace'; }
        constructor(remoteAgentService, environmentService, logService, hostService, contextService, storageService, fileService) {
            const connection = remoteAgentService.getConnection();
            let channel;
            if (connection) {
                channel = connection.getChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName);
            }
            else {
                // Extension host debugging not supported in serverless.
                channel = { call: async () => undefined, listen: () => event_1.Event.None };
            }
            super(channel);
            this.storageService = storageService;
            this.fileService = fileService;
            if (environmentService.options && environmentService.options.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = { open: async () => true, workspace: undefined, trusted: undefined };
                logService.warn('Extension Host Debugging not available due to missing workspace provider.');
            }
            // Reload window on reload request
            this._register(this.onReload(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    hostService.reload();
                }
            }));
            // Close window on close request
            this._register(this.onClose(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    hostService.close();
                }
            }));
            // Remember workspace as last used for extension development
            // (unless this is API tests) to restore for a future session
            if (environmentService.isExtensionDevelopment && !environmentService.extensionTestsLocationURI) {
                const workspaceId = (0, workspace_1.toWorkspaceIdentifier)(contextService.getWorkspace());
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceId) || (0, workspace_1.isWorkspaceIdentifier)(workspaceId)) {
                    const serializedWorkspace = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceId) ? { folderUri: workspaceId.uri.toJSON() } : { workspaceUri: workspaceId.configPath.toJSON() };
                    storageService.store(BrowserExtensionHostDebugService_1.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, JSON.stringify(serializedWorkspace), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                }
                else {
                    storageService.remove(BrowserExtensionHostDebugService_1.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, 0 /* StorageScope.PROFILE */);
                }
            }
        }
        async openExtensionDevelopmentHostWindow(args, _debugRenderer) {
            // Add environment parameters required for debug to work
            const environment = new Map();
            const fileUriArg = this.findArgument('file-uri', args);
            if (fileUriArg && !(0, workspace_1.hasWorkspaceFileExtension)(fileUriArg)) {
                environment.set('openFile', fileUriArg);
            }
            const copyArgs = [
                'extensionDevelopmentPath',
                'extensionTestsPath',
                'extensionEnvironment',
                'debugId',
                'inspect-brk-extensions',
                'inspect-extensions',
            ];
            for (const argName of copyArgs) {
                const value = this.findArgument(argName, args);
                if (value) {
                    environment.set(argName, value);
                }
            }
            // Find out which workspace to open debug window on
            let debugWorkspace = undefined;
            const folderUriArg = this.findArgument('folder-uri', args);
            if (folderUriArg) {
                debugWorkspace = { folderUri: uri_1.URI.parse(folderUriArg) };
            }
            else {
                const fileUriArg = this.findArgument('file-uri', args);
                if (fileUriArg && (0, workspace_1.hasWorkspaceFileExtension)(fileUriArg)) {
                    debugWorkspace = { workspaceUri: uri_1.URI.parse(fileUriArg) };
                }
            }
            const extensionTestsPath = this.findArgument('extensionTestsPath', args);
            if (!debugWorkspace && !extensionTestsPath) {
                const lastExtensionDevelopmentWorkspace = this.storageService.get(BrowserExtensionHostDebugService_1.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, 0 /* StorageScope.PROFILE */);
                if (lastExtensionDevelopmentWorkspace) {
                    try {
                        const serializedWorkspace = JSON.parse(lastExtensionDevelopmentWorkspace);
                        if (serializedWorkspace.workspaceUri) {
                            debugWorkspace = { workspaceUri: uri_1.URI.revive(serializedWorkspace.workspaceUri) };
                        }
                        else if (serializedWorkspace.folderUri) {
                            debugWorkspace = { folderUri: uri_1.URI.revive(serializedWorkspace.folderUri) };
                        }
                    }
                    catch (error) {
                        // ignore
                    }
                }
            }
            // Validate workspace exists
            if (debugWorkspace) {
                const debugWorkspaceResource = (0, window_1.isFolderToOpen)(debugWorkspace) ? debugWorkspace.folderUri : (0, window_1.isWorkspaceToOpen)(debugWorkspace) ? debugWorkspace.workspaceUri : undefined;
                if (debugWorkspaceResource) {
                    const workspaceExists = await this.fileService.exists(debugWorkspaceResource);
                    if (!workspaceExists) {
                        debugWorkspace = undefined;
                    }
                }
            }
            // Open debug window as new window. Pass arguments over.
            const success = await this.workspaceProvider.open(debugWorkspace, {
                reuse: false, // debugging always requires a new window
                payload: Array.from(environment.entries()) // mandatory properties to enable debugging
            });
            return { success };
        }
        findArgument(key, args) {
            for (const a of args) {
                const k = `--${key}=`;
                if (a.indexOf(k) === 0) {
                    return a.substring(k.length);
                }
            }
            return undefined;
        }
    };
    BrowserExtensionHostDebugService = BrowserExtensionHostDebugService_1 = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, host_1.IHostService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, files_1.IFileService)
    ], BrowserExtensionHostDebugService);
    (0, extensions_1.registerSingleton)(extensionHostDebug_1.IExtensionHostDebugService, BrowserExtensionHostDebugService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdERlYnVnU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9leHRlbnNpb25Ib3N0RGVidWdTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtCaEcsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSx1REFBK0I7O2lCQUVyRCw2Q0FBd0MsR0FBRyx5Q0FBeUMsQUFBNUMsQ0FBNkM7UUFPN0csWUFDc0Isa0JBQXVDLEVBQ3ZCLGtCQUF1RCxFQUMvRSxVQUF1QixFQUN0QixXQUF5QixFQUNiLGNBQXdDLEVBQ2pELGNBQStCLEVBQ2xDLFdBQXlCO1lBRXZDLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RELElBQUksT0FBaUIsQ0FBQztZQUN0QixJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQywwREFBa0MsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1Asd0RBQXdEO2dCQUN4RCxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGFBQUssQ0FBQyxJQUFJLEVBQVMsQ0FBQztZQUM1RSxDQUFDO1lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWYsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDckMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7WUFFL0IsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLElBQUksa0JBQWtCLENBQUMsT0FBTyxD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