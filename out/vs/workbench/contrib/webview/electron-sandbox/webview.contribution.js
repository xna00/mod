/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/electron-sandbox/webviewCommands", "vs/workbench/contrib/webview/electron-sandbox/webviewService"], function (require, exports, actions_1, extensions_1, webview_1, webviewCommands, webviewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(webview_1.IWebviewService, webviewService_1.ElectronWebviewService, 1 /* InstantiationType.Delayed */);
    (0, actions_1.registerAction2)(webviewCommands.OpenWebviewDeveloperToolsAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vidmlldy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlYnZpZXcvZWxlY3Ryb24tc2FuZGJveC93ZWJ2aWV3LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxJQUFBLDhCQUFpQixFQUFDLHlCQUFlLEVBQUUsdUNBQXNCLG9DQUE0QixDQUFDO0lBRXRGLElBQUEseUJBQWUsRUFBQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQyJ9