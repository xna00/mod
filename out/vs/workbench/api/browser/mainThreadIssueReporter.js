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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/issue/common/issue"], function (require, exports, lifecycle_1, uri_1, extHost_protocol_1, extHostCustomers_1, issue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadIssueReporter = void 0;
    let MainThreadIssueReporter = class MainThreadIssueReporter extends lifecycle_1.Disposable {
        constructor(context, _issueService) {
            super();
            this._issueService = _issueService;
            this._registrationsUri = this._register(new lifecycle_1.DisposableMap());
            this._registrationsData = this._register(new lifecycle_1.DisposableMap());
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostIssueReporter);
        }
        $registerIssueUriRequestHandler(extensionId) {
            const handler = {
                provideIssueUrl: async (token) => {
                    const parts = await this._proxy.$getIssueReporterUri(extensionId, token);
                    return uri_1.URI.from(parts);
                }
            };
            this._registrationsUri.set(extensionId, this._issueService.registerIssueUriRequestHandler(extensionId, handler));
        }
        $unregisterIssueUriRequestHandler(extensionId) {
            this._registrationsUri.deleteAndDispose(extensionId);
        }
        $registerIssueDataProvider(extensionId) {
            const provider = {
                provideIssueExtensionData: async (token) => {
                    const parts = await this._proxy.$getIssueReporterData(extensionId, token);
                    return parts;
                },
                provideIssueExtensionTemplate: async (token) => {
                    const parts = await this._proxy.$getIssueReporterTemplate(extensionId, token);
                    return parts;
                }
            };
            this._registrationsData.set(extensionId, this._issueService.registerIssueDataProvider(extensionId, provider));
        }
        $unregisterIssueDataProvider(extensionId) {
            this._registrationsData.deleteAndDispose(extensionId);
        }
    };
    exports.MainThreadIssueReporter = MainThreadIssueReporter;
    exports.MainThreadIssueReporter = MainThreadIssueReporter = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadIssueReporter),
        __param(1, issue_1.IWorkbenchIssueService)
    ], MainThreadIssueReporter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZElzc3VlUmVwb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkSXNzdWVSZXBvcnRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQUt0RCxZQUNDLE9BQXdCLEVBQ0EsYUFBc0Q7WUFFOUUsS0FBSyxFQUFFLENBQUM7WUFGaUMsa0JBQWEsR0FBYixhQUFhLENBQXdCO1lBTDlELHNCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztZQUNoRSx1QkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBVSxDQUFDLENBQUM7WUFPakYsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNyRSxDQUFDO1FBRUQsK0JBQStCLENBQUMsV0FBbUI7WUFDbEQsTUFBTSxPQUFPLEdBQTRCO2dCQUN4QyxlQUFlLEVBQUUsS0FBSyxFQUFFLEtBQXdCLEVBQUUsRUFBRTtvQkFDbkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDekUsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QixDQUFDO2FBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsOEJBQThCLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDbEgsQ0FBQztRQUVELGlDQUFpQyxDQUFDLFdBQW1CO1lBQ3BELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsMEJBQTBCLENBQUMsV0FBbUI7WUFDN0MsTUFBTSxRQUFRLEdBQXVCO2dCQUNwQyx5QkFBeUIsRUFBRSxLQUFLLEVBQUUsS0FBd0IsRUFBRSxFQUFFO29CQUM3RCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUMxRSxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUNELDZCQUE2QixFQUFFLEtBQUssRUFBRSxLQUF3QixFQUFFLEVBQUU7b0JBQ2pFLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQzlFLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7YUFDRCxDQUFDO1lBQ0YsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMvRyxDQUFDO1FBRUQsNEJBQTRCLENBQUMsV0FBbUI7WUFDL0MsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZELENBQUM7S0FDRCxDQUFBO0lBNUNZLDBEQUF1QjtzQ0FBdkIsdUJBQXVCO1FBRG5DLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyx1QkFBdUIsQ0FBQztRQVF2RCxXQUFBLDhCQUFzQixDQUFBO09BUFosdUJBQXVCLENBNENuQyJ9