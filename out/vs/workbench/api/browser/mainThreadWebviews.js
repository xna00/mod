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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/nls", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostWebviewMessaging", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, lifecycle_1, network_1, platform_1, strings_1, uri_1, nls_1, opener_1, productService_1, extHostProtocol, extHostWebviewMessaging_1, proxyIdentifier_1) {
    "use strict";
    var MainThreadWebviews_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviews = void 0;
    exports.reviveWebviewExtension = reviveWebviewExtension;
    exports.reviveWebviewContentOptions = reviveWebviewContentOptions;
    let MainThreadWebviews = class MainThreadWebviews extends lifecycle_1.Disposable {
        static { MainThreadWebviews_1 = this; }
        static { this.standardSupportedLinkSchemes = new Set([
            network_1.Schemas.http,
            network_1.Schemas.https,
            network_1.Schemas.mailto,
            network_1.Schemas.vscode,
            'vscode-insider',
        ]); }
        constructor(context, _openerService, _productService) {
            super();
            this._openerService = _openerService;
            this._productService = _productService;
            this._webviews = new Map();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviews);
        }
        addWebview(handle, webview, options) {
            if (this._webviews.has(handle)) {
                throw new Error('Webview already registered');
            }
            this._webviews.set(handle, webview);
            this.hookupWebviewEventDelegate(handle, webview, options);
        }
        $setHtml(handle, value) {
            this.tryGetWebview(handle)?.setHtml(value);
        }
        $setOptions(handle, options) {
            const webview = this.tryGetWebview(handle);
            if (webview) {
                webview.contentOptions = reviveWebviewContentOptions(options);
            }
        }
        async $postMessage(handle, jsonMessage, ...buffers) {
            const webview = this.tryGetWebview(handle);
            if (!webview) {
                return false;
            }
            const { message, arrayBuffers } = (0, extHostWebviewMessaging_1.deserializeWebviewMessage)(jsonMessage, buffers);
            return webview.postMessage(message, arrayBuffers);
        }
        hookupWebviewEventDelegate(handle, webview, options) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(webview.onDidClickLink((uri) => this.onDidClickLink(handle, uri)));
            disposables.add(webview.onMessage((message) => {
                const serialized = (0, extHostWebviewMessaging_1.serializeWebviewMessage)(message.message, options);
                this._proxy.$onMessage(handle, serialized.message, new proxyIdentifier_1.SerializableObjectWithBuffers(serialized.buffers));
            }));
            disposables.add(webview.onMissingCsp((extension) => this._proxy.$onMissingCsp(handle, extension.value)));
            disposables.add(webview.onDidDispose(() => {
                disposables.dispose();
                this._webviews.delete(handle);
            }));
        }
        onDidClickLink(handle, link) {
            const webview = this.getWebview(handle);
            if (this.isSupportedLink(webview, uri_1.URI.parse(link))) {
                this._openerService.open(link, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: Array.isArray(webview.contentOptions.enableCommandUris) || webview.contentOptions.enableCommandUris === true, fromWorkspace: true });
            }
        }
        isSupportedLink(webview, link) {
            if (MainThreadWebviews_1.standardSupportedLinkSchemes.has(link.scheme)) {
                return true;
            }
            if (!platform_1.isWeb && this._productService.urlProtocol === link.scheme) {
                return true;
            }
            if (link.scheme === network_1.Schemas.command) {
                if (Array.isArray(webview.contentOptions.enableCommandUris)) {
                    return webview.contentOptions.enableCommandUris.includes(link.path);
                }
                return webview.contentOptions.enableCommandUris === true;
            }
            return false;
        }
        tryGetWebview(handle) {
            return this._webviews.get(handle);
        }
        getWebview(handle) {
            const webview = this.tryGetWebview(handle);
            if (!webview) {
                throw new Error(`Unknown webview handle:${handle}`);
            }
            return webview;
        }
        getWebviewResolvedFailedContent(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>${(0, nls_1.localize)('errorMessage', "An error occurred while loading view: {0}", (0, strings_1.escape)(viewType))}</body>
		</html>`;
        }
    };
    exports.MainThreadWebviews = MainThreadWebviews;
    exports.MainThreadWebviews = MainThreadWebviews = MainThreadWebviews_1 = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], MainThreadWebviews);
    function reviveWebviewExtension(extensionData) {
        return {
            id: extensionData.id,
            location: uri_1.URI.revive(extensionData.location),
        };
    }
    function reviveWebviewContentOptions(webviewOptions) {
        return {
            allowScripts: webviewOptions.enableScripts,
            allowForms: webviewOptions.enableForms,
            enableCommandUris: webviewOptions.enableCommandUris,
            localResourceRoots: Array.isArray(webviewOptions.localResourceRoots) ? webviewOptions.localResourceRoots.map(r => uri_1.URI.revive(r)) : undefined,
            portMapping: webviewOptions.portMapping,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFdlYnZpZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE0SWhHLHdEQUtDO0lBRUQsa0VBUUM7SUF6SU0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTs7aUJBRXpCLGlDQUE0QixHQUFHLElBQUksR0FBRyxDQUFDO1lBQzlELGlCQUFPLENBQUMsSUFBSTtZQUNaLGlCQUFPLENBQUMsS0FBSztZQUNiLGlCQUFPLENBQUMsTUFBTTtZQUNkLGlCQUFPLENBQUMsTUFBTTtZQUNkLGdCQUFnQjtTQUNoQixDQUFDLEFBTmtELENBTWpEO1FBTUgsWUFDQyxPQUF3QixFQUNSLGNBQStDLEVBQzlDLGVBQWlEO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBSHlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM3QixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFMbEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFvQixDQUFDO1lBU3hELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFTSxVQUFVLENBQUMsTUFBcUMsRUFBRSxPQUF3QixFQUFFLE9BQW9EO1lBQ3RJLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVB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