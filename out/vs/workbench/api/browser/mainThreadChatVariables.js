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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, marshalling_1, extHost_protocol_1, chatVariables_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadChatVariables = void 0;
    let MainThreadChatVariables = class MainThreadChatVariables {
        constructor(extHostContext, _chatVariablesService) {
            this._chatVariablesService = _chatVariablesService;
            this._variables = new lifecycle_1.DisposableMap();
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatVariables);
        }
        dispose() {
            this._variables.clearAndDisposeAll();
        }
        $registerVariable(handle, data) {
            const registration = this._chatVariablesService.registerVariable(data, async (messageText, _arg, model, progress, token) => {
                const varRequestId = `${model.sessionId}-${handle}`;
                this._pendingProgress.set(varRequestId, progress);
                const result = (0, marshalling_1.revive)(await this._proxy.$resolveVariable(handle, varRequestId, messageText, token));
                this._pendingProgress.delete(varRequestId);
                return result;
            });
            this._variables.set(handle, registration);
        }
        async $handleProgressChunk(requestId, progress) {
            const revivedProgress = (0, marshalling_1.revive)(progress);
            this._pendingProgress.get(requestId)?.(revivedProgress);
        }
        $unregisterVariable(handle) {
            this._variables.deleteAndDispose(handle);
        }
    };
    exports.MainThreadChatVariables = MainThreadChatVariables;
    exports.MainThreadChatVariables = MainThreadChatVariables = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadChatVariables),
        __param(1, chatVariables_1.IChatVariablesService)
    ], MainThreadChatVariables);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENoYXRWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ2hhdFZhcmlhYmxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFNbkMsWUFDQyxjQUErQixFQUNSLHFCQUE2RDtZQUE1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBTHBFLGVBQVUsR0FBRyxJQUFJLHlCQUFhLEVBQVUsQ0FBQztZQUN6QyxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBeUQsQ0FBQztZQU1wRyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxNQUFjLEVBQUUsSUFBdUI7WUFDeEQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUMxSCxNQUFNLFlBQVksR0FBRyxHQUFHLEtBQUssQ0FBQyxTQUFTLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFNLEVBQThCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUVqSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMzQyxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxLQUFLLENBQUMsb0JBQW9CLENBQUMsU0FBaUIsRUFBRSxRQUEwQztZQUN2RixNQUFNLGVBQWUsR0FBRyxJQUFBLG9CQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLGVBQWdELENBQUMsQ0FBQztRQUMxRixDQUFDO1FBRUQsbUJBQW1CLENBQUMsTUFBYztZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLENBQUM7S0FDRCxDQUFBO0lBckNZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBRG5DLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyx1QkFBdUIsQ0FBQztRQVN2RCxXQUFBLHFDQUFxQixDQUFBO09BUlgsdUJBQXVCLENBcUNuQyJ9