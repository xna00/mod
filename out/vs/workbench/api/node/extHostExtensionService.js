/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/performance", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostRequireInterceptor", "vs/workbench/api/node/proxyResolver", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/node/extHostDownloadService", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/node/extHostCLIServer", "vs/base/node/extpath", "vs/workbench/api/node/extHostConsoleForwarder", "vs/workbench/api/node/extHostDiskFileSystemProvider"], function (require, exports, performance, extHost_api_impl_1, extHostRequireInterceptor_1, proxyResolver_1, extHostExtensionService_1, extHostDownloadService_1, uri_1, network_1, extHostTypes_1, extHostCLIServer_1, extpath_1, extHostConsoleForwarder_1, extHostDiskFileSystemProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostExtensionService = void 0;
    class NodeModuleRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() {
            const that = this;
            const node_module = globalThis._VSCODE_NODE_MODULES.module;
            const originalLoad = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                request = applyAlternatives(request);
                if (!that._factories.has(request)) {
                    return originalLoad.apply(this, arguments);
                }
                return that._factories.get(request).load(request, uri_1.URI.file((0, extpath_1.realpathSync)(parent.filename)), request => originalLoad.apply(this, [request, parent, isMain]));
            };
            const originalLookup = node_module._resolveLookupPaths;
            node_module._resolveLookupPaths = (request, parent) => {
                return originalLookup.call(this, applyAlternatives(request), parent);
            };
            const applyAlternatives = (request) => {
                for (const alternativeModuleName of that._alternatives) {
                    const alternative = alternativeModuleName(request);
                    if (alternative) {
                        request = alternative;
                        break;
                    }
                }
                return request;
            };
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        constructor() {
            super(...arguments);
            this.extensionRuntime = extHostTypes_1.ExtensionRuntime.Node;
        }
        async _beforeAlmostReadyToRunExtensions() {
            // make sure console.log calls make it to the render
            this._instaService.createInstance(extHostConsoleForwarder_1.ExtHostConsoleForwarder);
            // initialize API and register actors
            const extensionApiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            // Register Download command
            this._instaService.createInstance(extHostDownloadService_1.ExtHostDownloadService);
            // Register CLI Server for ipc
            if (this._initData.remote.isRemote && this._initData.remote.authority) {
                const cliServer = this._instaService.createInstance(extHostCLIServer_1.CLIServer);
                process.env['VSCODE_IPC_HOOK_CLI'] = cliServer.ipcHandlePath;
            }
            // Register local file system shortcut
            this._instaService.createInstance(extHostDiskFileSystemProvider_1.ExtHostDiskFileSystemProvider);
            // Module loading tricks
            const interceptor = this._instaService.createInstance(NodeModuleRequireInterceptor, extensionApiFactory, { mine: this._myRegistry, all: this._globalRegistry });
            await interceptor.install();
            performance.mark('code/extHost/didInitAPI');
            // Do this when extension service exists, but extensions are not being activated yet.
            const configProvider = await this._extHostConfiguration.getConfigProvider();
            await (0, proxyResolver_1.connectProxyResolver)(this._extHostWorkspace, configProvider, this, this._logService, this._mainThreadTelemetryProxy, this._initData);
            performance.mark('code/extHost/didInitProxyResolver');
        }
        _getEntryPoint(extensionDescription) {
            return extensionDescription.main;
        }
        async _loadCommonJSModule(extension, module, activationTimesBuilder) {
            if (module.scheme !== network_1.Schemas.file) {
                throw new Error(`Cannot load URI: '${module}', must be of file-scheme`);
            }
            let r = null;
            activationTimesBuilder.codeLoadingStart();
            this._logService.trace(`ExtensionService#loadCommonJSModule ${module.toString(true)}`);
            this._logService.flush();
            const extensionId = extension?.identifier.value;
            if (extension) {
                await this._extHostLocalizationService.initializeLocalizedMessages(extension);
            }
            try {
                if (extensionId) {
                    performance.mark(`code/extHost/willLoadExtensionCode/${extensionId}`);
                }
                r = require.__$__nodeRequire(module.fsPath);
            }
            finally {
                if (extensionId) {
                    performance.mark(`code/extHost/didLoadExtensionCode/${extensionId}`);
                }
                activationTimesBuilder.codeLoadingStop();
            }
            return r;
        }
        async $setRemoteEnvironment(env) {
            if (!this._initData.remote.isRemote) {
                return;
            }
            for (const key in env) {
                const value = env[key];
                if (value === null) {
                    delete process.env[key];
                }
                else {
                    process.env[key] = value;
                }
            }
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0RXh0ZW5zaW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLE1BQU0sNEJBQTZCLFNBQVEsOENBQWtCO1FBRWxELG1CQUFtQjtZQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsTUFBTSxXQUFXLEdBQVEsVUFBVSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztZQUNoRSxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQ3ZDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsU0FBUyxJQUFJLENBQUMsT0FBZSxFQUFFLE1BQTRCLEVBQUUsTUFBZTtnQkFDL0YsT0FBTyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDbkMsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUMsQ0FBQztnQkFDRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBRSxDQUFDLElBQUksQ0FDeEMsT0FBTyxFQUNQLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBQSxzQkFBWSxFQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUN2QyxPQUFPLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUM5RCxDQUFDO1lBQ0gsQ0FBQyxDQUFD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