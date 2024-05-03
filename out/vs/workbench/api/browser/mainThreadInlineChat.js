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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/api/browser/mainThreadBulkEdits", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, inlineChat_1, uriIdentity_1, mainThreadBulkEdits_1, extHost_protocol_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadInlineChat = void 0;
    let MainThreadInlineChat = class MainThreadInlineChat {
        constructor(extHostContext, _inlineChatService, _uriIdentService) {
            this._inlineChatService = _inlineChatService;
            this._uriIdentService = _uriIdentService;
            this._registrations = new lifecycle_1.DisposableMap();
            this._progresses = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostInlineChat);
        }
        dispose() {
            this._registrations.dispose();
        }
        async $registerInteractiveEditorProvider(handle, label, extensionId, supportsFeedback, supportsFollowups, supportIssueReporting) {
            const unreg = this._inlineChatService.addProvider({
                extensionId,
                label,
                supportIssueReporting,
                prepareInlineChatSession: async (model, range, token) => {
                    const session = await this._proxy.$prepareSession(handle, model.uri, range, token);
                    if (!session) {
                        return undefined;
                    }
                    return {
                        ...session,
                        dispose: () => {
                            this._proxy.$releaseSession(handle, session.id);
                        }
                    };
                },
                provideResponse: async (item, request, progress, token) => {
                    this._progresses.set(request.requestId, progress);
                    try {
                        const result = await this._proxy.$provideResponse(handle, item, request, token);
                        if (result?.type === 'bulkEdit') {
                            result.edits = (0, mainThreadBulkEdits_1.reviveWorkspaceEditDto)(result.edits, this._uriIdentService);
                        }
                        return result;
                    }
                    finally {
                        this._progresses.delete(request.requestId);
                    }
                },
                provideFollowups: !supportsFollowups ? undefined : async (session, response, token) => {
                    return this._proxy.$provideFollowups(handle, session.id, response.id, token);
                },
                handleInlineChatResponseFeedback: !supportsFeedback ? undefined : async (session, response, kind) => {
                    this._proxy.$handleFeedback(handle, session.id, response.id, kind);
                }
            });
            this._registrations.set(handle, unreg);
        }
        async $handleProgressChunk(requestId, chunk) {
            await Promise.resolve(this._progresses.get(requestId)?.report(chunk));
        }
        async $unregisterInteractiveEditorProvider(handle) {
            this._registrations.deleteAndDispose(handle);
        }
    };
    exports.MainThreadInlineChat = MainThreadInlineChat;
    exports.MainThreadInlineChat = MainThreadInlineChat = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadInlineChat),
        __param(1, inlineChat_1.IInlineChatService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], MainThreadInlineChat);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZElubGluZUNoYXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkSW5saW5lQ2hhdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFPaEMsWUFDQyxjQUErQixFQUNYLGtCQUF1RCxFQUN0RCxnQkFBc0Q7WUFEdEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNyQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXFCO1lBUjNELG1CQUFjLEdBQUcsSUFBSSx5QkFBYSxFQUFVLENBQUM7WUFHN0MsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBOEMsQ0FBQztZQU9wRixJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLE1BQWMsRUFBRSxLQUFhLEVBQUUsV0FBZ0MsRUFBRSxnQkFBeUIsRUFBRSxpQkFBMEIsRUFBRSxxQkFBOEI7WUFDOUwsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQztnQkFDakQsV0FBVztnQkFDWCxLQUFLO2dCQUNMLHFCQUFxQjtnQkFDckIsd0JBQXdCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3ZELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxF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