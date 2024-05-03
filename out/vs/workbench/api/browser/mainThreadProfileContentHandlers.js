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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, lifecycle_1, marshalling_1, extHost_protocol_1, extHostCustomers_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadProfileContentHandlers = void 0;
    let MainThreadProfileContentHandlers = class MainThreadProfileContentHandlers extends lifecycle_1.Disposable {
        constructor(context, userDataProfileImportExportService) {
            super();
            this.userDataProfileImportExportService = userDataProfileImportExportService;
            this.registeredHandlers = this._register(new lifecycle_1.DisposableMap());
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostProfileContentHandlers);
        }
        async $registerProfileContentHandler(id, name, description, extensionId) {
            this.registeredHandlers.set(id, this.userDataProfileImportExportService.registerProfileContentHandler(id, {
                name,
                description,
                extensionId,
                saveProfile: async (name, content, token) => {
                    const result = await this.proxy.$saveProfile(id, name, content, token);
                    return result ? (0, marshalling_1.revive)(result) : null;
                },
                readProfile: async (uri, token) => {
                    return this.proxy.$readProfile(id, uri, token);
                },
            }));
        }
        async $unregisterProfileContentHandler(id) {
            this.registeredHandlers.deleteAndDispose(id);
        }
    };
    exports.MainThreadProfileContentHandlers = MainThreadProfileContentHandlers;
    exports.MainThreadProfileContentHandlers = MainThreadProfileContentHandlers = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadProfileContentHandlers),
        __param(1, userDataProfile_1.IUserDataProfileImportExportService)
    ], MainThreadProfileContentHandlers);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFByb2ZpbGVDb250ZW50SGFuZGxlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkUHJvZmlsZUNvbnRlbnRIYW5kbGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQU0vRCxZQUNDLE9BQXdCLEVBQ2Esa0NBQXdGO1lBRTdILEtBQUssRUFBRSxDQUFDO1lBRjhDLHVDQUFrQyxHQUFsQyxrQ0FBa0MsQ0FBcUM7WUFKN0csdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQXVCLENBQUMsQ0FBQztZQU85RixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFRCxLQUFLLENBQUMsOEJBQThCLENBQUMsRUFBVSxFQUFFLElBQVksRUFBRSxXQUErQixFQUFFLFdBQW1CO1lBQ2xILElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyw2QkFBNkIsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pHLElBQUk7Z0JBQ0osV0FBVztnQkFDWCxXQUFXO2dCQUNYLFdBQVcsRUFBRSxLQUFLLEVBQUUsSUFBWSxFQUFFLE9BQWUsRUFBRSxLQUF3QixFQUFFLEVBQUU7b0JBQzlFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ3ZFLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFBLG9CQUFNLEVBQXFCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzNELENBQUM7Z0JBQ0QsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFRLEVBQUUsS0FBd0IsRUFBRSxFQUFFO29CQUN6RCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2hELENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxLQUFLLENBQUMsZ0NBQWdDLENBQUMsRUFBVTtZQUNoRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUMsQ0FBQztLQUVELENBQUE7SUFqQ1ksNEVBQWdDOytDQUFoQyxnQ0FBZ0M7UUFENUMsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLGdDQUFnQyxDQUFDO1FBU2hFLFdBQUEscURBQW1DLENBQUE7T0FSekIsZ0NBQWdDLENBaUM1QyJ9