/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/webview/browser/webviewService", "vs/workbench/contrib/webview/electron-sandbox/webviewElement"], function (require, exports, webviewService_1, webviewElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronWebviewService = void 0;
    class ElectronWebviewService extends webviewService_1.WebviewService {
        createWebviewElement(initInfo) {
            const webview = this._instantiationService.createInstance(webviewElement_1.ElectronWebviewElement, initInfo, this._webviewThemeDataProvider);
            this.registerNewWebview(webview);
            return webview;
        }
    }
    exports.ElectronWebviewService = ElectronWebviewService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvZWxlY3Ryb24tc2FuZGJveC93ZWJ2aWV3U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxzQkFBdUIsU0FBUSwrQkFBYztRQUVoRCxvQkFBb0IsQ0FBQyxRQUF5QjtZQUN0RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHVDQUFzQixFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUM1SCxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakMsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztLQUNEO0lBUEQsd0RBT0MifQ==