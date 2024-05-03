/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/extensions/common/extensionValidator", "vs/workbench/api/common/extHostWebviewMessaging", "vs/workbench/contrib/webview/common/webview", "./extHost.protocol"], function (require, exports, event_1, lifecycle_1, network_1, objects, uri_1, extensionValidator_1, extHostWebviewMessaging_1, webview_1, extHostProtocol) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviews = exports.ExtHostWebview = void 0;
    exports.shouldSerializeBuffersForPostMessage = shouldSerializeBuffersForPostMessage;
    exports.toExtensionData = toExtensionData;
    exports.serializeWebviewOptions = serializeWebviewOptions;
    class ExtHostWebview {
        #handle;
        #proxy;
        #deprecationService;
        #remoteInfo;
        #workspace;
        #extension;
        #html;
        #options;
        #isDisposed;
        #hasCalledAsWebviewUri;
        #serializeBuffersForPostMessage;
        #shouldRewriteOldResourceUris;
        constructor(handle, proxy, options, remoteInfo, workspace, extension, deprecationService) {
            this.#html = '';
            this.#isDisposed = false;
            this.#hasCalledAsWebviewUri = false;
            /* internal */ this._onMessageEmitter = new event_1.Emitter();
            this.onDidReceiveMessage = this._onMessageEmitter.event;
            this.#onDidDisposeEmitter = new event_1.Emitter();
            /* internal */ this._onDidDispose = this.#onDidDisposeEmitter.event;
            this.#handle = handle;
            this.#proxy = proxy;
            this.#options = options;
            this.#remoteInfo = remoteInfo;
            this.#workspace = workspace;
            this.#extension = extension;
            this.#serializeBuffersForPostMessage = shouldSerializeBuffersForPostMessage(extension);
            this.#shouldRewriteOldResourceUris = shouldTryRewritingOldResourceUris(extension);
            this.#deprecationService = deprecationService;
        }
        #onDidDisposeEmitter;
        dispose() {
            this.#isDisposed = true;
            this.#onDidDisposeEmitter.fire();
            this.#onDidDisposeEmitter.dispose();
            this._onMessageEmitter.dispose();
        }
        asWebviewUri(resource) {
            this.#hasCalledAsWebviewUri = true;
            return (0, webview_1.asWebviewUri)(resource, this.#remoteInfo);
        }
        get cspSource() {
            const extensionLocation = this.#extension.extensionLocation;
            if (extensionLocation.scheme === network_1.Schemas.https || extensionLocation.scheme === network_1.Schemas.http) {
                // The extension is being served up from a CDN.
                // Also include the CDN in the default csp.
                let extensionCspRule = extensionLocation.toString();
                if (!extensionCspRule.endsWith('/')) {
                    // Always treat the location as a directory so that we allow all content under it
                    extensionCspRule += '/';
                }
                return extensionCspRule + ' ' + webview_1.webviewGenericCspSource;
            }
            return webview_1.webviewGenericCspSource;
        }
        get html() {
            this.assertNotDisposed();
            return this.#html;
        }
        set html(value) {
            this.assertNotDisposed();
            if (this.#html !== value) {
                this.#html = value;
                if (this.#shouldRewriteOldResourceUris && !this.#hasCalledAsWebviewUri && /(["'])vscode-resource:([^\s'"]+?)(["'])/i.test(value)) {
                    this.#hasCalledAsWebviewUri = true;
                    this.#deprecationService.report('Webview vscode-resource: uris', this.#extension, `Please migrate to use the 'webview.asWebviewUri' api instead: https://aka.ms/vscode-webview-use-aswebviewuri`);
                }
                this.#proxy.$setHtml(this.#handle, this.rewriteOldResourceUrlsIfNeeded(value));
            }
        }
        get options() {
            this.assertNotDisposed();
            return this.#options;
        }
        set options(newOptions) {
            this.assertNotDisposed();
            if (!objects.equals(this.#options, newOptions)) {
                this.#proxy.$setOptions(this.#handle, serializeWebviewOptions(this.#extension, this.#workspace, newOptions));
            }
            this.#options = newOptions;
        }
        async postMessage(message) {
            if (this.#isDisposed) {
                return false;
            }
            const serialized = (0, extHostWebviewMessaging_1.serializeWebviewMessage)(message, { serializeBuffersForPostMessage: this.#serializeBuffersForPostMessage });
            return this.#proxy.$postMessage(this.#handle, serialized.message, ...serialized.buffers);
        }
        assertNotDisposed() {
            if (this.#isDisposed) {
                throw new Error('Webview is disposed');
            }
        }
        rewriteOldResourceUrlsIfNeeded(value) {
            if (!this.#shouldRewriteOldResourceUris) {
                return value;
            }
            const isRemote = this.#extension.extensionLocation?.scheme === network_1.Schemas.vscodeRemote;
            const remoteAuthority = this.#extension.extensionLocation.scheme === network_1.Schemas.vscodeRemote ? this.#extension.extensionLocation.authority : undefined;
            return value
                .replace(/(["'])(?:vscode-resource):(\/\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_1.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            })
                .replace(/(["'])(?:vscode-webview-resource):(\/\/[^\s\/'"]+\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_1.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            });
        }
    }
    exports.ExtHostWebview = ExtHostWebview;
    function shouldSerializeBuffersForPostMessage(extension) {
        try {
            const version = (0, extensionValidator_1.normalizeVersion)((0, extensionValidator_1.parseVersion)(extension.engines.vscode));
            return !!version && version.majorBase >= 1 && version.minorBase >= 57;
        }
        catch {
            return false;
        }
    }
    function shouldTryRewritingOldResourceUris(extension) {
        try {
            const version = (0, extensionValidator_1.normalizeVersion)((0, extensionValidator_1.parseVersion)(extension.engines.vscode));
            if (!version) {
                return false;
            }
            return version.majorBase < 1 || (version.majorBase === 1 && version.minorBase < 60);
        }
        catch {
            return false;
        }
    }
    class ExtHostWebviews extends lifecycle_1.Disposable {
        constructor(mainContext, remoteInfo, workspace, _logService, _deprecationService) {
            super();
            this.remoteInfo = remoteInfo;
            this.workspace = workspace;
            this._logService = _logService;
            this._deprecationService = _deprecationService;
            this._webviews = new Map();
            this._webviewProxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviews);
        }
        dispose() {
            super.dispose();
            for (const webview of this._webviews.values()) {
                webview.dispose();
            }
            this._webviews.clear();
        }
        $onMessage(handle, jsonMessage, buffers) {
            const webview = this.getWebview(handle);
            if (webview) {
                const { message } = (0, extHostWebviewMessaging_1.deserializeWebviewMessage)(jsonMessage, buffers.value);
                webview._onMessageEmitter.fire(message);
            }
        }
        $onMissingCsp(_handle, extensionId) {
            this._logService.warn(`${extensionId} created a webview without a content security policy: https://aka.ms/vscode-webview-missing-csp`);
        }
        createNewWebview(handle, options, extension) {
            const webview = new ExtHostWebview(handle, this._webviewProxy, reviveOptions(options), this.remoteInfo, this.workspace, extension, this._deprecationService);
            this._webviews.set(handle, webview);
            const sub = webview._onDidDispose(() => {
                sub.dispose();
                this.deleteWebview(handle);
            });
            return webview;
        }
        deleteWebview(handle) {
            this._webviews.delete(handle);
        }
        getWebview(handle) {
            return this._webviews.get(handle);
        }
    }
    exports.ExtHostWebviews = ExtHostWebviews;
    function toExtensionData(extension) {
        return { id: extension.identifier, location: extension.extensionLocation };
    }
    function serializeWebviewOptions(extension, workspace, options) {
        return {
            enableCommandUris: options.enableCommandUris,
            enableScripts: options.enableScripts,
            enableForms: options.enableForms,
            portMapping: options.portMapping,
            localResourceRoots: options.localResourceRoots || getDefaultLocalResourceRoots(extension, workspace)
        };
    }
    function reviveOptions(options) {
        return {
            enableCommandUris: options.enableCommandUris,
            enableScripts: options.enableScripts,
            enableForms: options.enableForms,
            portMapping: options.portMapping,
            localResourceRoots: options.localResourceRoots?.map(components => uri_1.URI.from(components)),
        };
    }
    function getDefaultLocalResourceRoots(extension, workspace) {
        return [
            ...(workspace?.getWorkspaceFolders() || []).map(x => x.uri),
            extension.extensionLocation,
        ];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdlYnZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RXZWJ2aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdLaEcsb0ZBT0M7SUFpRkQsMENBRUM7SUFFRCwwREFZQztJQTNQRCxNQUFhLGNBQWM7UUFFakIsT0FBTyxDQUFnQztRQUN2QyxNQUFNLENBQTBDO1FBQ2hELG1CQUFtQixDQUFnQztRQUVuRCxXQUFXLENBQW9CO1FBQy9CLFVBQVUsQ0FBZ0M7UUFDMUMsVUFBVSxDQUF3QjtRQUUzQyxLQUFLLENBQWM7UUFDbkIsUUFBUSxDQUF3QjtRQUNoQyxXQUFXLENBQWtCO1FBQzdCLHNCQUFzQixDQUFTO1FBRS9CLCtCQUErQixDQUFVO1FBQ3pDLDZCQUE2QixDQUFVO1FBRXZDLFlBQ0MsTUFBcUMsRUFDckMsS0FBOEMsRUFDOUMsT0FBOEIsRUFDOUIsVUFBNkIsRUFDN0IsU0FBd0MsRUFDeEMsU0FBZ0MsRUFDaEMsa0JBQWlEO1lBZmxELFVBQUssR0FBVyxFQUFFLENBQUM7WUFFbkIsZ0JBQVcsR0FBWSxLQUFLLENBQUM7WUFDN0IsMkJBQXNCLEdBQUcsS0FBSyxDQUFDO1lBeUIvQixjQUFjLENBQVUsc0JBQWlCLEdBQUcsSUFBSSxlQUFPLEVBQU8sQ0FBQztZQUMvQyx3QkFBbUIsR0FBZSxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDO1lBRXRFLHlCQUFvQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDcEQsY0FBYyxDQUFVLGtCQUFhLEdBQWdCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFmcEYsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7WUFDOUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDNUIsSUFBSSxDQUFDLCtCQUErQixHQUFHLG9DQUFvQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyw2QkFBNkIsR0FBRyxpQ0FBaUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRixJQUFJLENBQUMsbUJBQW1CLEdBQUcsa0JBQWtCLENBQUM7UUFDL0MsQ0FBQztRQUtRLG9CQUFvQixDQUF1QjtRQUc3QyxPQUFPO1lBQ2IsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFFeEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1lBRWpDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVNLFlBQVksQ0FBQyxRQUFvQjtZQUN2QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO1lBQ25DLE9BQU8sSUFBQSxzQkFBWSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELElBQVcsU0FBUztZQUNuQixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7WUFDNUQsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxLQUFLLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzdGLCtDQUErQztnQkFDL0MsMkNBQTJDO2dCQUMzQyxJQUFJLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLGlGQUFpRjtvQkFDakYsZ0JBQWdCLElBQUksR0FBRyxDQUFDO2dCQUN6QixDQUFDO2dCQUNELE9BQU8sZ0JBQWdCLEdBQUcsR0FBRyxHQUFHLGlDQUF1QixDQUFDO1lBQ3pELENBQUM7WUFDRCxPQUFPLGlDQUF1QixDQUFDO1FBQ2hDLENBQUM7UUFFRCxJQUFXLElBQUk7WUFDZCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELElBQVcsSUFBSSxDQUFDLEtBQWE7WUFDNUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDbkIsSUFBSSxJQUFJLENBQUMsNkJBQTZCLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLElBQUksMENBQTBDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ2xJLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7b0JBQ25DLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsK0JBQStCLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFDL0UsOEdBQThHLENBQUMsQ0FBQztnQkFDbEgsQ0FBQztnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7UUFDRixDQUFDO1FBRUQsSUFBVyxPQUFPO1lBQ2pCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBRUQsSUFBVyxPQUFPLENBQUMsVUFBaUM7WUFDbkQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFFekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzlHLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQztRQUM1QixDQUFDO1FBRU0sS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFZO1lBQ3BDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUN0QixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFDRCxNQUFNLFVBQVUsR0FBRyxJQUFBLGlEQUF1QixFQUFDLE9BQU8sRUFBRSxFQUFFLDhCQUE4QixFQUFFLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDLENBQUM7WUFDOUgsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDRixDQUFDO1FBRU8sOEJBQThCLENBQUMsS0FBYTtZQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxDQUFDO1lBQ3BGLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3BKLE9BQU8sS0FBSztpQkFDVixPQUFPLENBQUMseUVBQXlFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUN0SSxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDO29CQUNwQixNQUFNLEVBQUUsTUFBTSxJQUFJLE1BQU07b0JBQ3hCLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7aUJBQzlCLENBQUMsQ0FBQztnQkFDSCxNQUFNLFVBQVUsR0FBRyxJQUFBLHNCQUFZLEVBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxRixPQUFPLEdBQUcsVUFBVSxHQUFHLFVBQVUsR0FBRyxRQUFRLEVBQUUsQ0FBQztZQUNoRCxDQUFDLENBQUM7aUJBQ0QsT0FBTyxDQUFDLDZGQUE2RixFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDMUosTUFBTSxHQUFHLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQztvQkFDcEIsTUFBTSxFQUFFLE1BQU0sSUFBSSxNQUFNO29CQUN4QixJQUFJLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDO2lCQUM5QixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBQSxzQkFBWSxFQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUYsT0FBTyxHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsUUFBUSxFQUFFLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0Q7SUFqSkQsd0NBaUpDO0lBRUQsU0FBZ0Isb0NBQW9DLENBQUMsU0FBZ0M7UUFDcEYsSUFBSSxDQUFDO1lBQ0osTUFBTSxPQUFPLEdBQUcsSUFBQSxxQ0FBZ0IsRUFBQyxJQUFBLGlDQUFZLEVBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQztRQUN2RSxDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsaUNBQWlDLENBQUMsU0FBZ0M7UUFDMUUsSUFBSSxDQUFDO1lBQ0osTUFBTSxPQUFPLEdBQUcsSUFBQSxxQ0FBZ0IsRUFBQyxJQUFBLGlDQUFZLEVBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNyRixDQUFDO1FBQUMsTUFBTSxDQUFDO1lBQ1IsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQU05QyxZQUNDLFdBQXlDLEVBQ3hCLFVBQTZCLEVBQzdCLFNBQXdDLEVBQ3hDLFdBQXdCLEVBQ3hCLG1CQUFrRDtZQUVuRSxLQUFLLEVBQUUsQ0FBQztZQUxTLGVBQVUsR0FBVixVQUFVLENBQW1CO1lBQzdCLGNBQVMsR0FBVCxTQUFTLENBQStCO1lBQ3hDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBK0I7WUFQbkQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFpRCxDQUFDO1lBVXJGLElBQUksQ0FBQyxhQUFhLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUVlLE9BQU87WUFDdEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRWhCLEtBQUssTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQztZQUNELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDeEIsQ0FBQztRQUVNLFVBQVUsQ0FDaEIsTUFBcUMsRUFDckMsV0FBbUIsRUFDbkIsT0FBa0Q7WUFFbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxJQUFBLG1EQUF5QixFQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDekMsQ0FBQztRQUNGLENBQUM7UUFFTSxhQUFhLENBQ25CLE9BQXNDLEVBQ3RDLFdBQW1CO1lBRW5CLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsV0FBVyxpR0FBaUcsQ0FBQyxDQUFDO1FBQ3hJLENBQUM7UUFFTSxnQkFBZ0IsQ0FBQyxNQUFjLEVBQUUsT0FBK0MsRUFBRSxTQUFnQztZQUN4SCxNQUFNLE9BQU8sR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUM3SixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFcEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3RDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVCLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVNLGFBQWEsQ0FBQyxNQUFjO1lBQ2xDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9CLENBQUM7UUFFTyxVQUFVLENBQUMsTUFBcUM7WUFDdkQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0Q7SUFoRUQsMENBZ0VDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLFNBQWdDO1FBQy9ELE9BQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDNUUsQ0FBQztJQUVELFNBQWdCLHVCQUF1QixDQUN0QyxTQUFnQyxFQUNoQyxTQUF3QyxFQUN4QyxPQUE4QjtRQUU5QixPQUFPO1lBQ04saUJBQWlCLEVBQUUsT0FBTyxDQUFDLGlCQUFpQjtZQUM1QyxhQUFhLEVBQUUsT0FBTyxDQUFDLGFBQWE7WUFDcEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVztZQUNoQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsa0JBQWtCLElBQUksNEJBQTRCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQztTQUNwRyxDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLE9BQStDO1FBQ3JFLE9BQU87WUFDTixpQkFBaUIsRUFBRSxPQUFPLENBQUMsaUJBQWlCO1lBQzVDLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYTtZQUNwQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7WUFDaEMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ3ZGLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyw0QkFBNEIsQ0FDcEMsU0FBZ0MsRUFDaEMsU0FBd0M7UUFFeEMsT0FBTztZQUNOLEdBQUcsQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzNELFNBQVMsQ0FBQyxpQkFBaUI7U0FDM0IsQ0FBQztJQUNILENBQUMifQ==