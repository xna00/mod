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
define(["require", "exports", "vs/base/common/performance", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostConfiguration", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostExtensionService", "vs/platform/log/common/log", "vs/base/common/strings"], function (require, exports, performance, uri_1, extHost_protocol_1, extHostConfiguration_1, extensions_1, extensions_2, extHostRpcService_1, extHostInitDataService_1, instantiation_1, extHostExtensionService_1, log_1, strings_1) {
    "use strict";
    var NodeModuleAliasingModuleFactory_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequireInterceptor = void 0;
    let RequireInterceptor = class RequireInterceptor {
        constructor(_apiFactory, _extensionRegistry, _instaService, _extHostConfiguration, _extHostExtensionService, _initData, _logService) {
            this._apiFactory = _apiFactory;
            this._extensionRegistry = _extensionRegistry;
            this._instaService = _instaService;
            this._extHostConfiguration = _extHostConfiguration;
            this._extHostExtensionService = _extHostExtensionService;
            this._initData = _initData;
            this._logService = _logService;
            this._factories = new Map();
            this._alternatives = [];
        }
        async install() {
            this._installInterceptor();
            performance.mark('code/extHost/willWaitForConfig');
            const configProvider = await this._extHostConfiguration.getConfigProvider();
            performance.mark('code/extHost/didWaitForConfig');
            const extensionPaths = await this._extHostExtensionService.getExtensionPathIndex();
            this.register(new VSCodeNodeModuleFactory(this._apiFactory, extensionPaths, this._extensionRegistry, configProvider, this._logService));
            this.register(this._instaService.createInstance(NodeModuleAliasingModuleFactory));
            if (this._initData.remote.isRemote) {
                this.register(this._instaService.createInstance(OpenNodeModuleFactory, extensionPaths, this._initData.environment.appUriScheme));
            }
        }
        register(interceptor) {
            if ('nodeModuleName' in interceptor) {
                if (Array.isArray(interceptor.nodeModuleName)) {
                    for (const moduleName of interceptor.nodeModuleName) {
                        this._factories.set(moduleName, interceptor);
                    }
                }
                else {
                    this._factories.set(interceptor.nodeModuleName, interceptor);
                }
            }
            if (typeof interceptor.alternativeModuleName === 'function') {
                this._alternatives.push((moduleName) => {
                    return interceptor.alternativeModuleName(moduleName);
                });
            }
        }
    };
    exports.RequireInterceptor = RequireInterceptor;
    exports.RequireInterceptor = RequireInterceptor = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostExtensionService_1.IExtHostExtensionService),
        __param(5, extHostInitDataService_1.IExtHostInitDataService),
        __param(6, log_1.ILogService)
    ], RequireInterceptor);
    //#region --- module renames
    let NodeModuleAliasingModuleFactory = class NodeModuleAliasingModuleFactory {
        static { NodeModuleAliasingModuleFactory_1 = this; }
        /**
         * Map of aliased internal node_modules, used to allow for modules to be
         * renamed without breaking extensions. In the form "original -> new name".
         */
        static { this.aliased = new Map([
            ['vscode-ripgrep', '@vscode/ripgrep'],
            ['vscode-windows-registry', '@vscode/windows-registry'],
        ]); }
        constructor(initData) {
            if (initData.environment.appRoot && NodeModuleAliasingModuleFactory_1.aliased.size) {
                const root = (0, strings_1.escapeRegExpCharacters)(this.forceForwardSlashes(initData.environment.appRoot.fsPath));
                // decompose ${appRoot}/node_modules/foo/bin to ['${appRoot}/node_modules/', 'foo', '/bin'],
                // and likewise the more complex form ${appRoot}/node_modules.asar.unpacked/@vcode/foo/bin
                // to ['${appRoot}/node_modules.asar.unpacked/',' @vscode/foo', '/bin'].
                const npmIdChrs = `[a-z0-9_.-]`;
                const npmModuleName = `@${npmIdChrs}+\\/${npmIdChrs}+|${npmIdChrs}+`;
                const moduleFolders = 'node_modules|node_modules\\.asar(?:\\.unpacked)?';
                this.re = new RegExp(`^(${root}/${moduleFolders}\\/)(${npmModuleName})(.*)$`, 'i');
            }
        }
        alternativeModuleName(name) {
            if (!this.re) {
                return;
            }
            const result = this.re.exec(this.forceForwardSlashes(name));
            if (!result) {
                return;
            }
            const [, prefix, moduleName, suffix] = result;
            const dealiased = NodeModuleAliasingModuleFactory_1.aliased.get(moduleName);
            if (dealiased === undefined) {
                return;
            }
            console.warn(`${moduleName} as been renamed to ${dealiased}, please update your imports`);
            return prefix + dealiased + suffix;
        }
        forceForwardSlashes(str) {
            return str.replace(/\\/g, '/');
        }
    };
    NodeModuleAliasingModuleFactory = NodeModuleAliasingModuleFactory_1 = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService)
    ], NodeModuleAliasingModuleFactory);
    //#endregion
    //#region --- vscode-module
    class VSCodeNodeModuleFactory {
        constructor(_apiFactory, _extensionPaths, _extensionRegistry, _configProvider, _logService) {
            this._apiFactory = _apiFactory;
            this._extensionPaths = _extensionPaths;
            this._extensionRegistry = _extensionRegistry;
            this._configProvider = _configProvider;
            this._logService = _logService;
            this.nodeModuleName = 'vscode';
            this._extApiImpl = new extensions_2.ExtensionIdentifierMap();
        }
        load(_request, parent) {
            // get extension id from filename and api for extension
            const ext = this._extensionPaths.findSubstr(parent);
            if (ext) {
                let apiImpl = this._extApiImpl.get(ext.identifier);
                if (!apiImpl) {
                    apiImpl = this._apiFactory(ext, this._extensionRegistry, this._configProvider);
                    this._extApiImpl.set(ext.identifier, apiImpl);
                }
                return apiImpl;
            }
            // fall back to a default implementation
            if (!this._defaultApiImpl) {
                let extensionPathsPretty = '';
                this._extensionPaths.forEach((value, index) => extensionPathsPretty += `\t${index} -> ${value.identifier.value}\n`);
                this._logService.warn(`Could not identify extension for 'vscode' require call from ${parent}. These are the extension path mappings: \n${extensionPathsPretty}`);
                this._defaultApiImpl = this._apiFactory(extensions_1.nullExtensionDescription, this._extensionRegistry, this._configProvider);
            }
            return this._defaultApiImpl;
        }
    }
    let OpenNodeModuleFactory = class OpenNodeModuleFactory {
        constructor(_extensionPaths, _appUriScheme, rpcService) {
            this._extensionPaths = _extensionPaths;
            this._appUriScheme = _appUriScheme;
            this.nodeModuleName = ['open', 'opn'];
            this._mainThreadTelemetry = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            const mainThreadWindow = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._impl = (target, options) => {
                const uri = uri_1.URI.parse(target);
                // If we have options use the original method.
                if (options) {
                    return this.callOriginal(target, options);
                }
                if (uri.scheme === 'http' || uri.scheme === 'https') {
                    return mainThreadWindow.$openUri(uri, target, { allowTunneling: true });
                }
                else if (uri.scheme === 'mailto' || uri.scheme === this._appUriScheme) {
                    return mainThreadWindow.$openUri(uri, target, {});
                }
                return this.callOriginal(target, options);
            };
        }
        load(request, parent, original) {
            // get extension id from filename and api for extension
            const extension = this._extensionPaths.findSubstr(parent);
            if (extension) {
                this._extensionId = extension.identifier.value;
                this.sendShimmingTelemetry();
            }
            this._original = original(request);
            return this._impl;
        }
        callOriginal(target, options) {
            this.sendNoForwardTelemetry();
            return this._original(target, options);
        }
        sendShimmingTelemetry() {
            if (!this._extensionId) {
                return;
            }
            this._mainThreadTelemetry.$publicLog2('shimming.open', { extension: this._extensionId });
        }
        sendNoForwardTelemetry() {
            if (!this._extensionId) {
                return;
            }
            this._mainThreadTelemetry.$publicLog2('shimming.open.call.noForward', { extension: this._extensionId });
        }
    };
    OpenNodeModuleFactory = __decorate([
        __param(2, extHostRpcService_1.IExtHostRpcService)
    ], OpenNodeModuleFactory);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFJlcXVpcmVJbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFJlcXVpcmVJbnRlcmNlcHRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0J6RixJQUFlLGtCQUFrQixHQUFqQyxNQUFlLGtCQUFrQjtRQUt2QyxZQUNTLFdBQWlDLEVBQ2pDLGtCQUF3QyxFQUNSLGFBQW9DLEVBQ3BDLHFCQUE0QyxFQUN6Qyx3QkFBa0QsRUFDbkQsU0FBa0MsRUFDOUMsV0FBd0I7WUFOOUMsZ0JBQVcsR0FBWCxXQUFXLENBQXNCO1lBQ2pDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDUixrQkFBYSxHQUFiLGFBQWEsQ0FBdUI7WUFDcEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ25ELGNBQVMsR0FBVCxTQUFTLENBQXlCO1lBQzlDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBRXRELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7WUFDeEQsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDekIsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPO1lBRVosSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFM0IsV0FBVyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDNUUsV0FBVyxDQUFDLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFB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