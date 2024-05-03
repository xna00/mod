/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookKernelHistoryService = exports.INotebookKernelService = exports.ProxyKernelState = exports.variablePageSize = void 0;
    exports.variablePageSize = 100;
    var ProxyKernelState;
    (function (ProxyKernelState) {
        ProxyKernelState[ProxyKernelState["Disconnected"] = 1] = "Disconnected";
        ProxyKernelState[ProxyKernelState["Connected"] = 2] = "Connected";
        ProxyKernelState[ProxyKernelState["Initializing"] = 3] = "Initializing";
    })(ProxyKernelState || (exports.ProxyKernelState = ProxyKernelState = {}));
    exports.INotebookKernelService = (0, instantiation_1.createDecorator)('INotebookKernelService');
    exports.INotebookKernelHistoryService = (0, instantiation_1.createDecorator)('INotebookKernelHistoryService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9jb21tb24vbm90ZWJvb2tLZXJuZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQThDbkYsUUFBQSxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7SUEwQnBDLElBQWtCLGdCQUlqQjtJQUpELFdBQWtCLGdCQUFnQjtRQUNqQyx1RUFBZ0IsQ0FBQTtRQUNoQixpRUFBYSxDQUFBO1FBQ2IsdUVBQWdCLENBQUE7SUFDakIsQ0FBQyxFQUppQixnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQUlqQztJQStCWSxRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsd0JBQXdCLENBQUMsQ0FBQztJQW9EM0YsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLCtCQUErQixDQUFDLENBQUMifQ==