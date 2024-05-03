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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/chat/common/chatVariables"], function (require, exports, lifecycle_1, platform_1, contributions_1, chatVariables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ChatHistoryVariables = class ChatHistoryVariables extends lifecycle_1.Disposable {
        constructor(chatVariablesService) {
            super();
            this._register(chatVariablesService.registerVariable({ name: 'response', description: '', canTakeArgument: true, hidden: true }, async (message, arg, model, progress, token) => {
                if (!arg) {
                    return undefined;
                }
                const responseNum = parseInt(arg, 10);
                const response = model.getRequests()[responseNum - 1].response;
                if (!response) {
                    return undefined;
                }
                return [{ level: 'full', value: response.response.asString() }];
            }));
        }
    };
    ChatHistoryVariables = __decorate([
        __param(0, chatVariables_1.IChatVariablesService)
    ], ChatHistoryVariables);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ChatHistoryVariables, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEhpc3RvcnlWYXJpYWJsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9jb250cmliL2NoYXRIaXN0b3J5VmFyaWFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBUWhHLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFDNUMsWUFDd0Isb0JBQTJDO1lBRWxFLEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUMvSyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1YsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUM7Z0JBRUQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQy9ELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDZixPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztnQkFFRCxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNELENBQUE7SUFwQkssb0JBQW9CO1FBRXZCLFdBQUEscUNBQXFCLENBQUE7T0FGbEIsb0JBQW9CLENBb0J6QjtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBb0Isb0NBQTRCLENBQUMifQ==