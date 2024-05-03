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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/services/webWorker", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/textMate/browser/backgroundTokenization/textMateWorkerTokenizerController"], function (require, exports, lifecycle_1, network_1, platform_1, uri_1, webWorker_1, language_1, languageConfigurationRegistry_1, model_1, configuration_1, environment_1, extensionResourceLoader_1, notification_1, telemetry_1, textMateWorkerTokenizerController_1) {
    "use strict";
    var ThreadedBackgroundTokenizerFactory_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThreadedBackgroundTokenizerFactory = void 0;
    let ThreadedBackgroundTokenizerFactory = class ThreadedBackgroundTokenizerFactory {
        static { ThreadedBackgroundTokenizerFactory_1 = this; }
        static { this._reportedMismatchingTokens = false; }
        constructor(_reportTokenizationTime, _shouldTokenizeAsync, _extensionResourceLoaderService, _modelService, _languageConfigurationService, _configurationService, _languageService, _environmentService, _notificationService, _telemetryService) {
            this._reportTokenizationTime = _reportTokenizationTime;
            this._shouldTokenizeAsync = _shouldTokenizeAsync;
            this._extensionResourceLoaderService = _extensionResourceLoaderService;
            this._modelService = _modelService;
            this._languageConfigurationService = _languageConfigurationService;
            this._configurationService = _configurationService;
            this._languageService = _languageService;
            this._environmentService = _environmentService;
            this._notificationService = _notificationService;
            this._telemetryService = _telemetryService;
            this._workerProxyPromise = null;
            this._worker = null;
            this._workerProxy = null;
            this._workerTokenizerControllers = new Map();
            this._currentTheme = null;
            this._currentTokenColorMap = null;
            this._grammarDefinitions = [];
        }
        dispose() {
            this._disposeWorker();
        }
        // Will be recreated after worker is disposed (because tokenizer is re-registered when languages change)
        createBackgroundTokenizer(textModel, tokenStore, maxTokenizationLineLength) {
            // fallback to default sync background tokenizer
            if (!this._shouldTokenizeAsync() || textModel.isTooLargeForSyncing()) {
                return undefined;
            }
            const store = new lifecycle_1.DisposableStore();
            const controllerContainer = this._getWorkerProxy().then((workerProxy) => {
                if (store.isDisposed || !workerProxy) {
                    return undefined;
                }
                const controllerContainer = { controller: undefined, worker: this._worker };
                store.add(keepAliveWhenAttached(textModel, () => {
                    const controller = new textMateWorkerTokenizerController_1.TextMateWorkerTokenizerController(textModel, workerProxy, this._languageService.languageIdCodec, tokenStore, this._configurationService, maxTokenizationLineLength);
                    controllerContainer.controller = controller;
                    this._workerTokenizerControllers.set(controller.controllerId, controller);
                    return (0, lifecycle_1.toDisposable)(() => {
                        controllerContainer.controller = undefined;
                        this._workerTokenizerControllers.delete(controller.controllerId);
                        controller.dispose();
                    });
                }));
                return controllerContainer;
            });
            return {
                dispose() {
                    store.dispose();
                },
                requestTokens: async (startLineNumber, endLineNumberExclusive) => {
                    const container = await controllerContainer;
                    // If there is no controller, the model has been detached in the meantime.
                    // Only request the proxy object if the worker is the same!
                    if (container?.controller && container.worker === this._worker) {
                        container.controller.requestTokens(startLineNumber, endLineNumberExclusive);
                    }
                },
                reportMismatchingTokens: (lineNumber) => {
                    if (ThreadedBackgroundTokenizerFactory_1._reportedMismatchingTokens) {
                        return;
                    }
                    ThreadedBackgroundTokenizerFactory_1._reportedMismatchingTokens = true;
                    this._notificationService.error({
                        message: 'Async Tokenization Token Mismatch in line ' + lineNumber,
                        name: 'Async Tokenization Token Mismatch',
                    });
                    this._telemetryService.publicLog2('asyncTokenizationMismatchingTokens', {});
                },
            };
        }
        setGrammarDefinitions(grammarDefinitions) {
            this._grammarDefinitions = grammarDefinitions;
            this._disposeWorker();
        }
        acceptTheme(theme, colorMap) {
            this._currentTheme = theme;
            this._currentTokenColorMap = colorMap;
            if (this._currentTheme && this._currentTokenColorMap && this._workerProxy) {
                this._workerProxy.acceptTheme(this._currentTheme, this._currentTokenColorMap);
            }
        }
        _getWorkerProxy() {
            if (!this._workerProxyPromise) {
                this._workerProxyPromise = this._createWorkerProxy();
            }
            return this._workerProxyPromise;
        }
        async _createWorkerProxy() {
            const textmateModuleLocation = `${network_1.nodeModulesPath}/vscode-textmate`;
            const textmateModuleLocationAsar = `${network_1.nodeModulesAsarPath}/vscode-textmate`;
            const onigurumaModuleLocation = `${network_1.nodeModulesPath}/vscode-oniguruma`;
            const onigurumaModuleLocationAsar = `${network_1.nodeModulesAsarPath}/vscode-oniguruma`;
            const useAsar = this._environmentService.isBuilt && !platform_1.isWeb;
            const textmateLocation = useAsar ? textmateModuleLocationAsar : textmateModuleLocation;
            const onigurumaLocation = useAsar ? onigurumaModuleLocationAsar : onigurumaModuleLocation;
            const textmateMain = `${textmateLocation}/release/main.js`;
            const onigurumaMain = `${onigurumaLocation}/release/main.js`;
            const onigurumaWASM = `${onigurumaLocation}/release/onig.wasm`;
            const uri = network_1.FileAccess.asBrowserUri(textmateMain).toString(true);
            const createData = {
                grammarDefinitions: this._grammarDefinitions,
                textmateMainUri: uri,
                onigurumaMainUri: network_1.FileAccess.asBrowserUri(onigurumaMain).toString(true),
                onigurumaWASMUri: network_1.FileAccess.asBrowserUri(onigurumaWASM).toString(true),
            };
            const host = {
                readFile: async (_resource) => {
                    const resource = uri_1.URI.revive(_resource);
                    return this._extensionResourceLoaderService.readExtensionResource(resource);
                },
                setTokensAndStates: async (controllerId, versionId, tokens, lineEndStateDeltas) => {
                    const controller = this._workerTokenizerControllers.get(controllerId);
                    // When a model detaches, it is removed synchronously from the map.
                    // However, the worker might still be sending tokens for that model,
                    // so we ignore the event when there is no controller.
                    if (controller) {
                        controller.setTokensAndStates(controllerId, versionId, tokens, lineEndStateDeltas);
                    }
                },
                reportTokenizationTime: (timeMs, languageId, sourceExtensionId, lineLength, isRandomSample) => {
                    this._reportTokenizationTime(timeMs, languageId, sourceExtensionId, lineLength, isRandomSample);
                }
            };
            const worker = this._worker = (0, webWorker_1.createWebWorker)(this._modelService, this._languageConfigurationService, {
                createData,
                label: 'textMateWorker',
                moduleId: 'vs/workbench/services/textMate/browser/backgroundTokenization/worker/textMateTokenizationWorker.worker',
                host,
            });
            const proxy = await worker.getProxy();
            if (this._worker !== worker) {
                // disposed in the meantime
                return null;
            }
            this._workerProxy = proxy;
            if (this._currentTheme && this._currentTokenColorMap) {
                this._workerProxy.acceptTheme(this._currentTheme, this._currentTokenColorMap);
            }
            return proxy;
        }
        _disposeWorker() {
            for (const controller of this._workerTokenizerControllers.values()) {
                controller.dispose();
            }
            this._workerTokenizerControllers.clear();
            if (this._worker) {
                this._worker.dispose();
                this._worker = null;
            }
            this._workerProxy = null;
            this._workerProxyPromise = null;
        }
    };
    exports.ThreadedBackgroundTokenizerFactory = ThreadedBackgroundTokenizerFactory;
    exports.ThreadedBackgroundTokenizerFactory = ThreadedBackgroundTokenizerFactory = ThreadedBackgroundTokenizerFactory_1 = __decorate([
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, model_1.IModelService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, language_1.ILanguageService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, notification_1.INotificationService),
        __param(9, telemetry_1.ITelemetryService)
    ], ThreadedBackgroundTokenizerFactory);
    function keepAliveWhenAttached(textModel, factory) {
        const disposableStore = new lifecycle_1.DisposableStore();
        const subStore = disposableStore.add(new lifecycle_1.DisposableStore());
        function checkAttached() {
            if (textModel.isAttachedToEditor()) {
                subStore.add(factory());
            }
            else {
                subStore.clear();
            }
        }
        checkAttached();
        disposableStore.add(textModel.onDidChangeAttached(() => {
            checkAttached();
        }));
        return disposableStore;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhyZWFkZWRCYWNrZ3JvdW5kVG9rZW5pemVyRmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRNYXRlL2Jyb3dzZXIvYmFja2dyb3VuZFRva2VuaXphdGlvbi90aHJlYWRlZEJhY2tncm91bmRUb2tlbml6ZXJGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQWtDOztpQkFDL0IsK0JBQTBCLEdBQUcsS0FBSyxBQUFSLENBQVM7UUFXbEQsWUFDa0IsdUJBQXlKLEVBQ3pKLG9CQUFtQyxFQUNuQiwrQkFBaUYsRUFDbkcsYUFBNkMsRUFDN0IsNkJBQTZFLEVBQ3JGLHFCQUE2RCxFQUNsRSxnQkFBbUQsRUFDaEQsbUJBQXlELEVBQ3hELG9CQUEyRCxFQUM5RCxpQkFBcUQ7WUFUdkQsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUFrSTtZQUN6Six5QkFBb0IsR0FBcEIsb0JBQW9CLENBQWU7WUFDRixvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWlDO1lBQ2xGLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ1osa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUNwRSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2pELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDL0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN2Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQzdDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFuQmpFLHdCQUFtQixHQUFzRCxJQUFJLENBQUM7WUFDOUUsWUFBTyxHQUF1RCxJQUFJLENBQUM7WUFDbkUsaUJBQVksR0FBc0MsSUFBSSxDQUFD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