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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/themeing", "vs/workbench/contrib/webview/browser/webviewElement", "./overlayWebview"], function (require, exports, event_1, lifecycle_1, instantiation_1, themeing_1, webviewElement_1, overlayWebview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewService = void 0;
    let WebviewService = class WebviewService extends lifecycle_1.Disposable {
        constructor(_instantiationService) {
            super();
            this._instantiationService = _instantiationService;
            this._webviews = new Set();
            this._onDidChangeActiveWebview = this._register(new event_1.Emitter());
            this.onDidChangeActiveWebview = this._onDidChangeActiveWebview.event;
            this._webviewThemeDataProvider = this._instantiationService.createInstance(themeing_1.WebviewThemeDataProvider);
        }
        get activeWebview() { return this._activeWebview; }
        _updateActiveWebview(value) {
            if (value !== this._activeWebview) {
                this._activeWebview = value;
                this._onDidChangeActiveWebview.fire(value);
            }
        }
        get webviews() {
            return this._webviews.values();
        }
        createWebviewElement(initInfo) {
            const webview = this._instantiationService.createInstance(webviewElement_1.WebviewElement, initInfo, this._webviewThemeDataProvider);
            this.registerNewWebview(webview);
            return webview;
        }
        createWebviewOverlay(initInfo) {
            const webview = this._instantiationService.createInstance(overlayWebview_1.OverlayWebview, initInfo);
            this.registerNewWebview(webview);
            return webview;
        }
        registerNewWebview(webview) {
            this._webviews.add(webview);
            webview.onDidFocus(() => {
                this._updateActiveWebview(webview);
            });
            const onBlur = () => {
                if (this._activeWebview === webview) {
                    this._updateActiveWebview(undefined);
                }
            };
            webview.onDidBlur(onBlur);
            webview.onDidDispose(() => {
                onBlur();
                this._webviews.delete(webview);
            });
        }
    };
    exports.WebviewService = WebviewService;
    exports.WebviewService = WebviewService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebviewService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvYnJvd3Nlci93ZWJ2aWV3U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBSzdDLFlBQ3dCLHFCQUErRDtZQUV0RixLQUFLLEVBQUUsQ0FBQztZQUZrQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBaUIvRSxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVksQ0FBQztZQU12Qiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF3QixDQUFDLENBQUM7WUFDakYsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQXJCL0UsSUFBSSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsbUNBQXdCLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBSUQsSUFBVyxhQUFhLEtBQUssT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUVsRCxvQkFBb0IsQ0FBQyxLQUEyQjtZQUN2RCxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUM1QixJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO1FBSUQsSUFBVyxRQUFRO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxDQUFDO1FBS0Qsb0JBQW9CLENBQUMsUUFBeUI7WUFDN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQywrQkFBYyxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNwSCxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakMsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVELG9CQUFvQixDQUFDLFFBQXlCO1lBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsK0JBQWMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNwRixJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakMsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVTLGtCQUFrQixDQUFDLE9BQWlCO1lBQzdDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTVCLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUN2QixJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQ25CLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDckMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQixPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtnQkFDekIsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQS9EWSx3Q0FBYzs2QkFBZCxjQUFjO1FBTXhCLFdBQUEscUNBQXFCLENBQUE7T0FOWCxjQUFjLENBK0QxQiJ9