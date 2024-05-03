/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostExtensionService", "vs/base/common/uri", "vs/workbench/api/common/extHostRequireInterceptor", "vs/workbench/api/common/extHostTypes", "vs/base/common/async", "vs/workbench/api/worker/extHostConsoleForwarder"], function (require, exports, extHost_api_impl_1, extHostExtensionService_1, uri_1, extHostRequireInterceptor_1, extHostTypes_1, async_1, extHostConsoleForwarder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostExtensionService = void 0;
    class WorkerRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() { }
        getModule(request, parent) {
            for (const alternativeModuleName of this._alternatives) {
                const alternative = alternativeModuleName(request);
                if (alternative) {
                    request = alternative;
                    break;
                }
            }
            if (this._factories.has(request)) {
                return this._factories.get(request).load(request, parent, () => { throw new Error('CANNOT LOAD MODULE from here.'); });
            }
            return undefined;
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        constructor() {
            super(...arguments);
            this.extensionRuntime = extHostTypes_1.ExtensionRuntime.Webworker;
        }
        async _beforeAlmostReadyToRunExtensions() {
            // make sure console.log calls make it to the render
            this._instaService.createInstance(extHostConsoleForwarder_1.ExtHostConsoleForwarder);
            // initialize API and register actors
            const apiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            this._fakeModules = this._instaService.createInstance(WorkerRequireInterceptor, apiFactory, { mine: this._myRegistry, all: this._globalRegistry });
            await this._fakeModules.install();
            performance.mark('code/extHost/didInitAPI');
            await this._waitForDebuggerAttachment();
        }
        _getEntryPoint(extensionDescription) {
            return extensionDescription.browser;
        }
        async _loadCommonJSModule(extension, module, activationTimesBuilder) {
            module = module.with({ path: ensureSuffix(module.path, '.js') });
            const extensionId = extension?.identifier.value;
            if (extensionId) {
                performance.mark(`code/extHost/willFetchExtensionCode/${extensionId}`);
            }
            // First resolve the extension entry point URI to something we can load using `fetch`
            // This needs to be done on the main thread due to a potential `resourceUriProvider` (workbench api)
            // which is only available in the main thread
            const browserUri = uri_1.URI.revive(await this._mainThreadExtensionsProxy.$asBrowserUri(module));
            const response = await fetch(browserUri.toString(true));
            if (extensionId) {
                performance.mark(`code/extHost/didFetchExtensionCode/${extensionId}`);
            }
            if (response.status !== 200) {
                throw new Error(response.statusText);
            }
            // fetch JS sources as text and create a new function around it
            const source = await response.text();
            // Here we append #vscode-extension to serve as a marker, such that source maps
            // can be adjusted for the extra wrapping function.
            const sourceURL = `${module.toString(true)}#vscode-extension`;
            const fullSource = `${source}\n//# sourceURL=${sourceURL}`;
            let initFn;
            try {
                initFn = new Function('module', 'exports', 'require', fullSource); // CodeQL [SM01632] js/eval-call there is no alternative until we move to ESM
            }
            catch (err) {
                if (extensionId) {
                    console.error(`Loading code for extension ${extensionId} failed: ${err.message}`);
                }
                else {
                    console.error(`Loading code failed: ${err.message}`);
                }
                console.error(`${module.toString(true)}${typeof err.line === 'number' ? ` line ${err.line}` : ''}${typeof err.column === 'number' ? ` column ${err.column}` : ''}`);
                console.error(err);
                throw err;
            }
            if (extension) {
                await this._extHostLocalizationService.initializeLocalizedMessages(extension);
            }
            // define commonjs globals: `module`, `exports`, and `require`
            const _exports = {};
            const _module = { exports: _exports };
            const _require = (request) => {
                const result = this._fakeModules.getModule(request, module);
                if (result === undefined) {
                    throw new Error(`Cannot load module '${request}'`);
                }
                return result;
            };
            try {
                activationTimesBuilder.codeLoadingStart();
                if (extensionId) {
                    performance.mark(`code/extHost/willLoadExtensionCode/${extensionId}`);
                }
                initFn(_module, _exports, _require);
                return (_module.exports !== _exports ? _module.exports : _exports);
            }
            finally {
                if (extensionId) {
                    performance.mark(`code/extHost/didLoadExtensionCode/${extensionId}`);
                }
                activationTimesBuilder.codeLoadingStop();
            }
        }
        async $setRemoteEnvironment(_env) {
            return;
        }
        async _waitForDebuggerAttachment(waitTimeout = 5000) {
            // debugger attaches async, waiting for it fixes #106698 and #99222
            if (!this._initData.environment.isExtensionDevelopmentDebug) {
                return;
            }
            const deadline = Date.now() + waitTimeout;
            while (Date.now() < deadline && !('__jsDebugIsReady' in globalThis)) {
                await (0, async_1.timeout)(10);
            }
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
    function ensureSuffix(path, suffix) {
        return path.endsWith(suffix) ? path : path + suffix;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEV4dGVuc2lvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvd29ya2VyL2V4dEhvc3RFeHRlbnNpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFNLHdCQUF5QixTQUFRLDhDQUFrQjtRQUU5QyxtQkFBbUIsS0FBSyxDQUFDO1FBRW5DLFNBQVMsQ0FBQyxPQUFlLEVBQUUsTUFBVztZQUNyQyxLQUFLLE1BQU0scUJBQXFCLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN4RCxNQUFNLFdBQVcsR0FBRyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxXQUFXLEVBQUUsQ0FBQztvQkFDakIsT0FBTyxHQUFHLFdBQVcsQ0FBQztvQkFDdEIsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6SCxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBRUQsTUFBYSx1QkFBd0IsU0FBUSx5REFBK0I7UUFBNUU7O1lBQ1UscUJBQWdCLEdBQUcsK0JBQWdCLENBQUMsU0FBUyxDQUFDO1FBMEd4RCxDQUFDO1FBdEdVLEtBQUssQ0FBQyxpQ0FBaUM7WUFDaEQsb0RBQW9EO1lBQ3BELElBQUks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