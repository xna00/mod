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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/webviewView/browser/webviewViewService", "vs/platform/telemetry/common/telemetry"], function (require, exports, errors_1, lifecycle_1, uuid_1, mainThreadWebviews_1, extHostProtocol, webviewViewService_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewsViews = void 0;
    let MainThreadWebviewsViews = class MainThreadWebviewsViews extends lifecycle_1.Disposable {
        constructor(context, mainThreadWebviews, _telemetryService, _webviewViewService) {
            super();
            this.mainThreadWebviews = mainThreadWebviews;
            this._telemetryService = _telemetryService;
            this._webviewViewService = _webviewViewService;
            this._webviewViews = this._register(new lifecycle_1.DisposableMap());
            this._webviewViewProviders = this._register(new lifecycle_1.DisposableMap());
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewViews);
        }
        $setWebviewViewTitle(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.title = value;
        }
        $setWebviewViewDescription(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.description = value;
        }
        $setWebviewViewBadge(handle, badge) {
            const webviewView = this.getWebviewView(handle);
            webviewView.badge = badge;
        }
        $show(handle, preserveFocus) {
            const webviewView = this.getWebviewView(handle);
            webviewView.show(preserveFocus);
        }
        $registerWebviewViewProvider(extensionData, viewType, options) {
            if (this._webviewViewProviders.has(viewType)) {
                throw new Error(`View provider for ${viewType} already registered`);
            }
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const registration = this._webviewViewService.register(viewType, {
                resolve: async (webviewView, cancellation) => {
                    const handle = (0, uuid_1.generateUuid)();
                    this._webviewViews.set(handle, webviewView);
                    this.mainThreadWebviews.addWebview(handle, webviewView.webview, { serializeBuffersForPostMessage: options.serializeBuffersForPostMessage });
                    let state = undefined;
                    if (webviewView.webview.state) {
                        try {
                            state = JSON.parse(webviewView.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewView.webview.state);
                        }
                    }
                    webviewView.webview.extension = extension;
                    if (options) {
                        webviewView.webview.options = options;
                    }
                    webviewView.onDidChangeVisibility(visible => {
                        this._proxy.$onDidChangeWebviewViewVisibility(handle, visible);
                    });
                    webviewView.onDispose(() => {
                        this._proxy.$disposeWebviewView(handle);
                        this._webviewViews.deleteAndDispose(handle);
                    });
                    this._telemetryService.publicLog2('webviews:createWebviewView', {
                        extensionId: extension.id.value,
                        id: viewType,
                    });
                    try {
                        await this._proxy.$resolveWebviewView(handle, viewType, webviewView.title, state, cancellation);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewView.webview.setHtml(this.mainThreadWebviews.getWebviewResolvedFailedContent(viewType));
                    }
                }
            });
            this._webviewViewProviders.set(viewType, registration);
        }
        $unregisterWebviewViewProvider(viewType) {
            if (!this._webviewViewProviders.has(viewType)) {
                throw new Error(`No view provider for ${viewType} registered`);
            }
            this._webviewViewProviders.deleteAndDispose(viewType);
        }
        getWebviewView(handle) {
            const webviewView = this._webviewViews.get(handle);
            if (!webviewView) {
                throw new Error('unknown webview view');
            }
            return webviewView;
        }
    };
    exports.MainThreadWebviewsViews = MainThreadWebviewsViews;
    exports.MainThreadWebviewsViews = MainThreadWebviewsViews = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, webviewViewService_1.IWebviewViewService)
    ], MainThreadWebviewsViews);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdWaWV3cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRXZWJ2aWV3Vmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBY3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFPdEQsWUFDQyxPQUF3QixFQUNQLGtCQUFzQyxFQUNwQyxpQkFBcUQsRUFDbkQsbUJBQXlEO1lBRTlFLEtBQUssRUFBRSxDQUFDO1lBSlMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2xDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFQOUQsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBdUIsQ0FBQyxDQUFDO1lBQ3pFLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztZQVVwRixJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxNQUFxQyxFQUFFLEtBQXlCO1lBQzNGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDaEQsV0FBVyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDM0IsQ0FBQztRQUVNLDBCQUEwQixDQUFDLE1BQXFDLEVBQUUsS0FBeUI7WUFDakcsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FB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