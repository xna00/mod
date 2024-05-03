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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, cancellation_1, lifecycle_1, extHost_protocol_1, aiRelatedInformation_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAiRelatedInformation = void 0;
    let MainThreadAiRelatedInformation = class MainThreadAiRelatedInformation extends lifecycle_1.Disposable {
        constructor(context, _aiRelatedInformationService) {
            super();
            this._aiRelatedInformationService = _aiRelatedInformationService;
            this._registrations = this._register(new lifecycle_1.DisposableMap());
            this._proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAiRelatedInformation);
        }
        $getAiRelatedInformation(query, types) {
            // TODO: use a real cancellation token
            return this._aiRelatedInformationService.getRelatedInformation(query, types, cancellation_1.CancellationToken.None);
        }
        $registerAiRelatedInformationProvider(handle, type) {
            const provider = {
                provideAiRelatedInformation: (query, token) => {
                    return this._proxy.$provideAiRelatedInformation(handle, query, token);
                },
            };
            this._registrations.set(handle, this._aiRelatedInformationService.registerAiRelatedInformationProvider(type, provider));
        }
        $unregisterAiRelatedInformationProvider(handle) {
            this._registrations.deleteAndDispose(handle);
        }
    };
    exports.MainThreadAiRelatedInformation = MainThreadAiRelatedInformation;
    exports.MainThreadAiRelatedInformation = MainThreadAiRelatedInformation = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadAiRelatedInformation),
        __param(1, aiRelatedInformation_1.IAiRelatedInformationService)
    ], MainThreadAiRelatedInformation);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEFpUmVsYXRlZEluZm9ybWF0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZEFpUmVsYXRlZEluZm9ybWF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLDhCQUE4QixHQUFwQyxNQUFNLDhCQUErQixTQUFRLHNCQUFVO1FBSTdELFlBQ0MsT0FBd0IsRUFDTSw0QkFBMkU7WUFFekcsS0FBSyxFQUFFLENBQUM7WUFGdUMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUE4QjtZQUp6RixtQkFBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFVLENBQUMsQ0FBQztZQU83RSxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxLQUFhLEVBQUUsS0FBK0I7WUFDdEUsc0NBQXNDO1lBQ3RDLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEcsQ0FBQztRQUVELHFDQUFxQyxDQUFDLE1BQWMsRUFBRSxJQUE0QjtZQUNqRixNQUFNLFFBQVEsR0FBa0M7Z0JBQy9DLDJCQUEyQixFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUM3QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsNEJBQTRCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDdkUsQ0FBQzthQUNELENBQUM7WUFDRixJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLG9DQUFvQyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3pILENBQUM7UUFFRCx1Q0FBdUMsQ0FBQyxNQUFjO1lBQ3JELElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsQ0FBQztLQUNELENBQUE7SUE3Qlksd0VBQThCOzZDQUE5Qiw4QkFBOEI7UUFEMUMsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLDhCQUE4QixDQUFDO1FBTzlELFdBQUEsbURBQTRCLENBQUE7T0FObEIsOEJBQThCLENBNkIxQyJ9