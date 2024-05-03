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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService"], function (require, exports, lifecycle_1, extHost_protocol_1, extHostCustomers_1, notebookRendererMessagingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookRenderers = void 0;
    let MainThreadNotebookRenderers = class MainThreadNotebookRenderers extends lifecycle_1.Disposable {
        constructor(extHostContext, messaging) {
            super();
            this.messaging = messaging;
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookRenderers);
            this._register(messaging.onShouldPostMessage(e => {
                this.proxy.$postRendererMessage(e.editorId, e.rendererId, e.message);
            }));
        }
        $postMessage(editorId, rendererId, message) {
            return this.messaging.receiveMessage(editorId, rendererId, message);
        }
    };
    exports.MainThreadNotebookRenderers = MainThreadNotebookRenderers;
    exports.MainThreadNotebookRenderers = MainThreadNotebookRenderers = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadNotebookRenderers),
        __param(1, notebookRendererMessagingService_1.INotebookRendererMessagingService)
    ], MainThreadNotebookRenderers);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rUmVuZGVyZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZE5vdGVib29rUmVuZGVyZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFVO1FBRzFELFlBQ0MsY0FBK0IsRUFDcUIsU0FBNEM7WUFFaEcsS0FBSyxFQUFFLENBQUM7WUFGNEMsY0FBUyxHQUFULFNBQVMsQ0FBbUM7WUFHaEcsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsWUFBWSxDQUFDLFFBQTRCLEVBQUUsVUFBa0IsRUFBRSxPQUFnQjtZQUM5RSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckUsQ0FBQztLQUNELENBQUE7SUFqQlksa0VBQTJCOzBDQUEzQiwyQkFBMkI7UUFEdkMsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLDJCQUEyQixDQUFDO1FBTTNELFdBQUEsb0VBQWlDLENBQUE7T0FMdkIsMkJBQTJCLENBaUJ2QyJ9