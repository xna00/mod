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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, dom, lifecycle_1, configuration_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewIconManager = void 0;
    let WebviewIconManager = class WebviewIconManager {
        constructor(_lifecycleService, _configService) {
            this._lifecycleService = _lifecycleService;
            this._configService = _configService;
            this._icons = new Map();
            this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.iconTheme')) {
                    this.updateStyleSheet();
                }
            });
        }
        dispose() {
            this._styleElementDisposable?.dispose();
            this._styleElementDisposable = undefined;
            this._styleElement = undefined;
        }
        get styleElement() {
            if (!this._styleElement) {
                this._styleElementDisposable = new lifecycle_1.DisposableStore();
                this._styleElement = dom.createStyleSheet(undefined, undefined, this._styleElementDisposable);
                this._styleElement.className = 'webview-icons';
            }
            return this._styleElement;
        }
        setIcons(webviewId, iconPath) {
            if (iconPath) {
                this._icons.set(webviewId, iconPath);
            }
            else {
                this._icons.delete(webviewId);
            }
            this.updateStyleSheet();
        }
        async updateStyleSheet() {
            await this._lifecycleService.when(1 /* LifecyclePhase.Starting */);
            const cssRules = [];
            if (this._configService.getValue('workbench.iconTheme') !== null) {
                for (const [key, value] of this._icons) {
                    const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                    try {
                        cssRules.push(`.monaco-workbench.vs ${webviewSelector}, .monaco-workbench.hc-light ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.light)}; }`, `.monaco-workbench.vs-dark ${webviewSelector}, .monaco-workbench.hc-black ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.dark)}; }`);
                    }
                    catch {
                        // noop
                    }
                }
            }
            this.styleElement.textContent = cssRules.join('\n');
        }
    };
    exports.WebviewIconManager = WebviewIconManager;
    exports.WebviewIconManager = WebviewIconManager = __decorate([
        __param(0, lifecycle_2.ILifecycleService),
        __param(1, configuration_1.IConfigurationService)
    ], WebviewIconManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0ljb25NYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3UGFuZWwvYnJvd3Nlci93ZWJ2aWV3SWNvbk1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQWtCO1FBTzlCLFlBQ29CLGlCQUFxRCxFQUNqRCxjQUFzRDtZQUR6QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2hDLG1CQUFjLEdBQWQsY0FBYyxDQUF1QjtZQVA3RCxXQUFNLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7WUFTekQsSUFBSSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLENBQUMsb0JBQW9CLENBQUMscUJBQXFCLENBQUMsRUFBRSxDQUFDO29CQUNuRCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLFNBQVMsQ0FBQztZQUN6QyxJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBWSxZQUFZO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFDOUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDO1lBQ2hELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVNLFFBQVEsQ0FDZCxTQUFpQixFQUNqQixRQUFrQztZQUVsQyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN0QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQ3pCLENBQUM7UUFFTyxLQUFLLENBQUMsZ0JBQWdCO1lBQzdCLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksaUNBQXlCLENBQUM7WUFFM0QsTUFBTSxRQUFRLEdBQWEsRUFBRSxDQUFDO1lBQzlCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDbEUsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDeEMsTUFBTSxlQUFlLEdBQUcsNkJBQTZCLEdBQUcseUJBQXlCLENBQUM7b0JBQ2xGLElBQUksQ0FBQzt3QkFDSixRQUFRLENBQUMsSUFBSSxDQUNaLHdCQUF3QixlQUFlLGdDQUFnQyxlQUFlLHFDQUFxQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUN6Siw2QkFBNkIsZUFBZSxnQ0FBZ0MsZUFBZSxxQ0FBcUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FDN0osQ0FBQztvQkFDSCxDQUFDO29CQUFDLE1BQU0sQ0FBQzt3QkFDUixPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JELENBQUM7S0FDRCxDQUFBO0lBakVZLGdEQUFrQjtpQ0FBbEIsa0JBQWtCO1FBUTVCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVRYLGtCQUFrQixDQWlFOUIifQ==