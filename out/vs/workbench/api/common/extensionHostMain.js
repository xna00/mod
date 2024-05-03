/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/performance", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/rpcProtocol", "vs/platform/log/common/log", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiationService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostTelemetry"], function (require, exports, errors, performance, uri_1, extHost_protocol_1, rpcProtocol_1, log_1, extensions_1, serviceCollection_1, extHostInitDataService_1, instantiationService_1, extHostRpcService_1, extHostUriTransformerService_1, extHostExtensionService_1, extHostTelemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostMain = exports.ErrorHandler = void 0;
    class ErrorHandler {
        static async installEarlyHandler(accessor) {
            // increase number of stack frames (from 10, https://github.com/v8/v8/wiki/Stack-Trace-API)
            Error.stackTraceLimit = 100;
            // does NOT dependent of extension information, can be installed immediately, and simply forwards
            // to the log service and main thread errors
            const logService = accessor.get(log_1.ILogService);
            const rpcService = accessor.get(extHostRpcService_1.IExtHostRpcService);
            const mainThreadErrors = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            errors.setUnexpectedErrorHandler(err => {
                logService.error(err);
                const data = errors.transformErrorForSerialization(err);
                mainThreadErrors.$onUnexpectedError(data);
            });
        }
        static async installFullHandler(accessor) {
            // uses extension knowledges to correlate errors with extensions
            const logService = accessor.get(log_1.ILogService);
            const rpcService = accessor.get(extHostRpcService_1.IExtHostRpcService);
            const extensionService = accessor.get(extHostExtensionService_1.IExtHostExtensionService);
            const extensionTelemetry = accessor.get(extHostTelemetry_1.IExtHostTelemetry);
            const mainThreadExtensions = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            const mainThreadErrors = rpcService.getProxy(extHost_protocol_1.MainContext.MainThreadErrors);
            const map = await extensionService.getExtensionPathIndex();
            const extensionErrors = new WeakMap();
            // PART 1
            // set the prepareStackTrace-handle and use it as a side-effect to associate errors
            // with extensions - this works by looking up callsites in the extension path index
            function prepareStackTraceAndFindExtension(error, stackTrace) {
                if (extensionErrors.has(error)) {
                    return extensionErrors.get(error).stack;
                }
                let stackTraceMessage = '';
                let extension;
                let fileName;
                for (const call of stackTrace) {
                    stackTraceMessage += `\n\tat ${call.toString()}`;
                    fileName = call.getFileName();
                    if (!extension && fileName) {
                        extension = map.findSubstr(uri_1.URI.file(fileName));
                    }
                }
                const result = `${error.name || 'Error'}: ${error.message || ''}${stackTraceMessage}`;
                extensionErrors.set(error, { extensionIdentifier: extension?.identifier, stack: result });
                return result;
            }
            const _wasWrapped = Symbol('prepareStackTrace wrapped');
            let _prepareStackTrace = prepareStackTraceAndFindExtension;
            Object.defineProperty(Error, 'prepareStackTrace', {
                configurable: false,
                get() {
                    return _prepareStackTrace;
                },
                set(v) {
                    if (v === prepareStackTraceAndFindExtension || !v || v[_wasWrapped]) {
                        _prepareStackTrace = v || prepareStackTraceAndFindExtension;
                        return;
                    }
                    _prepareStackTrace = function (error, stackTrace) {
                        prepareStackTraceAndFindExtension(error, stackTrace);
                        return v.call(Error, error, stackTrace);
                    };
                    Object.assign(_prepareStackTrace, { [_wasWrapped]: true });
                },
            });
            // PART 2
            // set the unexpectedErrorHandler and check for extensions that have been identified as
            // having caused the error. Note that the runtime order is actually reversed, the code
            // below accesses the stack-property which triggers the code above
            errors.setUnexpectedErrorHandler(err => {
                logService.error(err);
                const errorData = errors.transformErrorForSerialization(err);
                const stackData = extensionErrors.get(err);
                if (!stackData?.extensionIdentifier) {
                    mainThreadErrors.$onUnexpectedError(errorData);
                    return;
                }
                mainThreadExtensions.$onExtensionRuntimeError(stackData.extensionIdentifier, errorData);
                const reported = extensionTelemetry.onExtensionError(stackData.extensionIdentifier, err);
                logService.trace('forwarded error to extension?', reported, stackData);
            });
        }
    }
    exports.ErrorHandler = ErrorHandler;
    class ExtensionHostMain {
        constructor(protocol, initData, hostUtils, uriTransformer, messagePorts) {
            this._hostUtils = hostUtils;
            this._rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, null, uriTransformer);
            // ensure URIs are transformed and revived
            initData = ExtensionHostMain._transform(initData, this._rpcProtocol);
            // bootstrap services
            const services = new serviceCollection_1.ServiceCollection(...(0, extensions_1.getSingletonServiceDescriptors)());
            services.set(extHostInitDataService_1.IExtHostInitDataService, { _serviceBrand: undefined, ...initData, messagePorts });
            services.set(extHostRpcService_1.IExtHostRpcService, new extHostRpcService_1.ExtHostRpcService(this._rpcProtocol));
            services.set(extHostUriTransformerService_1.IURITransformerService, new extHostUriTransformerService_1.URITransformerService(uriTransformer));
            services.set(extHostExtensionService_1.IHostUtils, hostUtils);
            const instaService = new instantiationService_1.InstantiationService(services, true);
            instaService.invokeFunction(ErrorHandler.installEarlyHandler);
            // ugly self - inject
            this._logService = instaService.invokeFunction(accessor => accessor.get(log_1.ILogService));
            performance.mark(`code/extHost/didCreateServices`);
            if (this._hostUtils.pid) {
                this._logService.info(`Extension host with pid ${this._hostUtils.pid} started`);
            }
            else {
                this._logService.info(`Extension host started`);
            }
            this._logService.trace('initData', initData);
            // ugly self - inject
            // must call initialize *after* creating the extension service
            // because `initialize` itself creates instances that depend on it
            this._extensionService = instaService.invokeFunction(accessor => accessor.get(extHostExtensionService_1.IExtHostExtensionService));
            this._extensionService.initialize();
            // install error handler that is extension-aware
            instaService.invokeFunction(ErrorHandler.installFullHandler);
        }
        async asBrowserUri(uri) {
            const mainThreadExtensionsProxy = this._rpcProtocol.getProxy(extHost_protocol_1.MainContext.MainThreadExtensionService);
            return uri_1.URI.revive(await mainThreadExtensionsProxy.$asBrowserUri(uri));
        }
        terminate(reason) {
            this._extensionService.terminate(reason);
        }
        static _transform(initData, rpcProtocol) {
            initData.extensions.allExtensions.forEach((ext) => {
                ext.extensionLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(ext.extensionLocation));
            });
            initData.environment.appRoot = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.appRoot));
            const extDevLocs = initData.environment.extensionDevelopmentLocationURI;
            if (extDevLocs) {
                initData.environment.extensionDevelopmentLocationURI = extDevLocs.map(url => uri_1.URI.revive(rpcProtocol.transformIncomingURIs(url)));
            }
            initData.environment.extensionTestsLocationURI = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTestsLocationURI));
            initData.environment.globalStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.globalStorageHome));
            initData.environment.workspaceStorageHome = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.workspaceStorageHome));
            initData.environment.extensionTelemetryLogResource = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.environment.extensionTelemetryLogResource));
            initData.nlsBaseUrl = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.nlsBaseUrl));
            initData.logsLocation = uri_1.URI.revive(rpcProtocol.transformIncomingURIs(initData.logsLocation));
            initData.workspace = rpcProtocol.transformIncomingURIs(initData.workspace);
            return initData;
        }
    }
    exports.ExtensionHostMain = ExtensionHostMain;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dGVuc2lvbkhvc3RNYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQStCaEcsTUFBc0IsWUFBWTtRQUVqQyxNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLFFBQTBCO1lBRTFELDJGQUEyRjtZQUMzRixLQUFLLENBQUMsZUFBZSxHQUFHLEdBQUcsQ0FBQztZQUU1QixpR0FBaUc7WUFDakcsNENBQTRDO1lBQzVDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsaUJBQVcsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsQ0FBQztZQUNwRCxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDdEMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLDhCQUE4QixDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4RCxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQTBCO1lBQ3pELGdFQUFnRTtZQUVoRSxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFXLENBQUMsQ0FBQztZQUM3QyxNQUFNLFVBQVUsR0FBRyxRQUFRLENB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