/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/native/common/native"], function (require, exports, nls, dom_1, actionCommonCategories_1, actions_1, native_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWebviewDeveloperToolsAction = void 0;
    class OpenWebviewDeveloperToolsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.webview.openDeveloperTools',
                title: nls.localize2('openToolsLabel', "Open Webview Developer Tools"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const iframeWebviewElements = (0, dom_1.getActiveWindow)().document.querySelectorAll('iframe.webview.ready');
            if (iframeWebviewElements.length) {
                console.info(nls.localize('iframeWebviewAlert', "Using standard dev tools to debug iframe based webview"));
                nativeHostService.openDevTools();
            }
        }
    }
    exports.OpenWebviewDeveloperToolsAction = OpenWebviewDeveloperToolsAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlld0NvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi93ZWJ2aWV3L2VsZWN0cm9uLXNhbmRib3gvd2Vidmlld0NvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLCtCQUFnQyxTQUFRLGlCQUFPO1FBRTNEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw2Q0FBNkM7Z0JBQ2pELEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLDhCQUE4QixDQUFDO2dCQUN0RSxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQ25DLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBa0IsQ0FBQyxDQUFDO1lBRTNELE1BQU0scUJBQXFCLEdBQUcsSUFBQSxxQkFBZSxHQUFFLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbEcsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLHdEQUF3RCxDQUFDLENBQUMsQ0FBQztnQkFDM0csaUJBQWlCLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7S0FDRDtJQXBCRCwwRUFvQkMifQ==