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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/iframe", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/label/common/label", "vs/platform/layout/browser/layoutService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/extensions/common/extensionHostProtocol"], function (require, exports, dom, iframe_1, window_1, async_1, buffer_1, errors_1, event_1, lifecycle_1, network_1, platform, resources_1, uri_1, uuid_1, label_1, layoutService_1, log_1, productService_1, storage_1, telemetry_1, telemetryUtils_1, userDataProfile_1, workspace_1, environmentService_1, extensionHostProtocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebWorkerExtensionHost = void 0;
    let WebWorkerExtensionHost = class WebWorkerExtensionHost extends lifecycle_1.Disposable {
        constructor(runningLocation, startup, _initDataProvider, _telemetryService, _contextService, _labelService, _logService, _loggerService, _environmentService, _userDataProfilesService, _productService, _layoutService, _storageService) {
            super();
            this.runningLocation = runningLocation;
            this.startup = startup;
            this._initDataProvider = _initDataProvider;
            this._telemetryService = _telemetryService;
            this._contextService = _contextService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._environmentService = _environmentService;
            this._userDataProfilesService = _userDataProfilesService;
            this._productService = _productService;
            this._layoutService = _layoutService;
            this._storageService = _storageService;
            this.pid = null;
            this.remoteAuthority = null;
            this.extensions = null;
            this._onDidExit = this._register(new event_1.Emitter());
            this.onExit = this._onDidExit.event;
            this._isTerminating = false;
            this._protocolPromise = null;
            this._protocol = null;
            this._extensionHostLogsLocation = (0, resources_1.joinPath)(this._environmentService.extHostLogsPath, 'webWorker');
        }
        async _getWebWorkerExtensionHostIframeSrc() {
            const suffixSearchParams = new URLSearchParams();
            if (this._environmentService.debugExtensionHost && this._environmentService.debugRenderer) {
                suffixSearchParams.set('debugged', '1');
            }
            network_1.COI.addSearchParam(suffixSearchParams, true, true);
            const suffix = `?${suffixSearchParams.toString()}`;
            const iframeModulePath = 'vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html';
            if (platform.isWeb) {
                const webEndpointUrlTemplate = this._productService.webEndpointUrlTemplate;
                const commit = this._productService.commit;
                const quality = this._productService.quality;
                if (webEndpointUrlTemplate && commit && quality) {
                    // Try to keep the web worker extension host iframe origin stable by storing it in workspace storage
                    const key = 'webWorkerExtensionHostIframeStableOriginUUID';
                    let stableOriginUUID = this._storageService.get(key, 1 /* StorageScope.WORKSPACE */);
                    if (typeof stableOriginUUID === 'undefined') {
                        stableOriginUUID = (0, uuid_1.generateUuid)();
                        this._storageService.store(key, stableOriginUUID, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                    const hash = await (0, iframe_1.parentOriginHash)(window_1.mainWindow.origin, stableOriginUUID);
                    const baseUrl = (webEndpointUrlTemplate
                        .replace('{{uuid}}', `v--${hash}`) // using `v--` as a marker to require `parentOrigin`/`salt` verification
                        .replace('{{commit}}', commit)
                        .replace('{{quality}}', quality));
                    const res = new URL(`${baseUrl}/out/${iframeModulePath}${suffix}`);
                    res.searchParams.set('parentOrigin', window_1.mainWindow.origin);
                    res.searchParams.set('salt', stableOriginUUID);
                    return res.toString();
                }
                console.warn(`The web worker extension host is started in a same-origin iframe!`);
            }
            const relativeExtensionHostIframeSrc = network_1.FileAccess.asBrowserUri(iframeModulePath);
            return `${relativeExtensionHostIframeSrc.toString(true)}${suffix}`;
        }
        async start() {
            if (!this._protocolPromise) {
                this._protocolPromise = this._startInsideIframe();
                this._protocolPromise.then(protocol => this._protocol = protocol);
            }
            return this._protocolPromise;
        }
        async _startInsideIframe() {
            const webWorkerExtensionHostIframeSrc = await this._getWebWorkerExtensionHostIframeSrc();
            const emitter = this._register(new event_1.Emitter());
            const iframe = document.createElement('iframe');
            iframe.setAttribute('class', 'web-worker-ext-host-iframe');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            iframe.setAttribute('allow', 'usb; serial; hid; cross-origin-isolated;');
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.display = 'none';
            const vscodeWebWorkerExtHostId = (0, uuid_1.generateUuid)();
            iframe.setAttribute('src', `${webWorkerExtensionHostIframeSrc}&vscodeWebWorkerExtHostId=${vscodeWebWorkerExtHostId}`);
            const barrier = new async_1.Barrier();
            let port;
            let barrierError = null;
            let barrierHasError = false;
            let startTimeout = null;
            const rejectBarrier = (exitCode, error) => {
                barrierError = error;
                barrierHasError = true;
                (0, errors_1.onUnexpectedError)(barrierError);
                clearTimeout(startTimeout);
                this._onDidExit.fire([81 /* ExtensionHostExitCode.UnexpectedError */, barrierError.message]);
                barrier.open();
            };
            const resolveBarrier = (messagePort) => {
                port = messagePort;
                clearTimeout(startTimeout);
                barrier.open();
            };
            startTimeout = setTimeout(() => {
                console.warn(`The Web Worker Extension Host did not start in 60s, that might be a problem.`);
            }, 60000);
            this._register(dom.addDisposableListener(window_1.mainWindow, 'message', (event) => {
                if (event.source !== iframe.contentWindow) {
                    return;
                }
                if (event.data.vscodeWebWorkerExtHostId !== vscodeWebWorkerExtHostId) {
                    return;
                }
                if (event.data.error) {
                    const { name, message, stack } = event.data.error;
                    const err = new Error();
                    err.message = message;
                    err.name = name;
                    err.stack = stack;
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                const { data } = event.data;
                if (barrier.isOpen() || !(data instanceof MessagePort)) {
                    console.warn('UNEXPECTED message', event);
                    const err = new Error('UNEXPECTED message');
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                resolveBarrier(data);
            }));
            this._layoutService.mainContainer.appendChild(iframe);
            this._register((0, lifecycle_1.toDisposable)(() => iframe.remove()));
            // await MessagePort and use it to directly communicate
            // with the worker extension host
            await barrier.wait();
            if (barrierHasError) {
                throw barrierError;
            }
            // Send over message ports for extension API
            const messagePorts = this._environmentService.options?.messagePorts ?? new Map();
            iframe.contentWindow.postMessage({ type: 'vscode.init', data: messagePorts }, '*', [...messagePorts.values()]);
            port.onmessage = (event) => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    this._onDidExit.fire([77, 'UNKNOWN data received']);
                    return;
                }
                emitter.fire(buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength)));
            };
            const protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                    port.postMessage(data, [data]);
                }
            };
            return this._performHandshake(protocol);
        }
        async _performHandshake(protocol) {
            // extension host handshake happens below
            // (1) <== wait for: Ready
            // (2) ==> send: init data
            // (3) <== wait for: Initialized
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(await this._createExtHostInitData())));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            return protocol;
        }
        dispose() {
            if (this._isTerminating) {
                return;
            }
            this._isTerminating = true;
            this._protocol?.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
            super.dispose();
        }
        getInspectPort() {
            return undefined;
        }
        enableInspectPort() {
            return Promise.resolve(false);
        }
        async _createExtHostInitData() {
            const initData = await this._initDataProvider.getInitData();
            this.extensions = initData.extensions;
            const workspace = this._contextService.getWorkspace();
            const nlsBaseUrl = this._productService.extensionsGallery?.nlsBaseUrl;
            let nlsUrlWithDetails = undefined;
            // Only use the nlsBaseUrl if we are using a language other than the default, English.
            if (nlsBaseUrl && this._productService.commit && !platform.Language.isDefaultVariant()) {
                nlsUrlWithDetails = uri_1.URI.joinPath(uri_1.URI.parse(nlsBaseUrl), this._productService.commit, this._productService.version, platform.Language.value());
            }
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                quality: this._productService.quality,
                parentPid: 0,
                environment: {
                    isExtensionDevelopmentDebug: this._environmentService.debugRenderer,
                    appName: this._productService.nameLong,
                    appHost: this._productService.embedderIdentifier ?? (platform.isWeb ? 'web' : 'desktop'),
                    appUriScheme: this._productService.urlProtocol,
                    appLanguage: platform.language,
                    extensionTelemetryLogResource: this._environmentService.extHostTelemetryLogFile,
                    isExtensionTelemetryLoggingOnly: (0, telemetryUtils_1.isLoggingOnly)(this._productService, this._environmentService),
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._userDataProfilesService.defaultProfile.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                    extensionLogLevel: this._environmentService.extensionLogLevel
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: workspace.configuration || undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    transient: workspace.transient
                },
                consoleForward: {
                    includeStack: false,
                    logNative: this._environmentService.debugRenderer
                },
                extensions: this.extensions.toSnapshot(),
                nlsBaseUrl: nlsUrlWithDetails,
                telemetryInfo: {
                    sessionId: this._telemetryService.sessionId,
                    machineId: this._telemetryService.machineId,
                    sqmId: this._telemetryService.sqmId,
                    firstSessionDate: this._telemetryService.firstSessionDate,
                    msftInternal: this._telemetryService.msftInternal
                },
                logLevel: this._logService.getLevel(),
                loggers: [...this._loggerService.getRegisteredLoggers()],
                logsLocation: this._extensionHostLogsLocation,
                autoStart: (this.startup === 1 /* ExtensionHostStartup.EagerAutoStart */),
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                uiKind: platform.isWeb ? extensionHostProtocol_1.UIKind.Web : extensionHostProtocol_1.UIKind.Desktop
            };
        }
    };
    exports.WebWorkerExtensionHost = WebWorkerExtensionHost;
    exports.WebWorkerExtensionHost = WebWorkerExtensionHost = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, log_1.ILoggerService),
        __param(8, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(9, userDataProfile_1.IUserDataProfilesService),
        __param(10, productService_1.IProductService),
        __param(11, layoutService_1.ILayoutService),
        __param(12, storage_1.IStorageService)
    ], WebWorkerExtensionHost);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViV29ya2VyRXh0ZW5zaW9uSG9zdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvYnJvd3Nlci93ZWJXb3JrZXJFeHRlbnNpb25Ib3N0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNDekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQWVyRCxZQUNpQixlQUE4QyxFQUM5QyxPQUE2QixFQUM1QixpQkFBc0QsRUFDcEQsaUJBQXFELEVBQzlDLGVBQTBELEVBQ3JFLGFBQTZDLEVBQy9DLFdBQXlDLEVBQ3RDLGNBQStDLEVBQzFCLG1CQUF5RSxFQUNwRix3QkFBbUUsRUFDNUUsZUFBaUQsRUFDbEQsY0FBK0MsRUFDOUMsZUFBaUQ7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFkUSxvQkFBZSxHQUFmLGVBQWUsQ0FBK0I7WUFDOUMsWUFBTyxHQUFQLE9BQU8sQ0FBc0I7WUFDNUIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFxQztZQUNuQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQzdCLG9CQUFlLEdBQWYsZUFBZSxDQUEwQjtZQUNwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUM5QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNyQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDVCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFDO1lBQ25FLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDM0Qsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2pDLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUExQm5ELFFBQUcsR0FBRyxJQUFJLENBQUM7WUFDWCxvQkFBZSxH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