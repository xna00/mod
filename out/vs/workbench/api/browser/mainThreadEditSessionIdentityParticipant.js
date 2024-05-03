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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/async", "vs/platform/workspace/common/editSessions", "vs/workbench/api/common/extHost.protocol"], function (require, exports, nls_1, instantiation_1, extHostCustomers_1, async_1, editSessions_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionIdentityCreateParticipant = void 0;
    class ExtHostEditSessionIdentityCreateParticipant {
        constructor(extHostContext) {
            this.timeout = 10000;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWorkspace);
        }
        async participate(workspaceFolder, token) {
            const p = new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error((0, nls_1.localize)('timeout.onWillCreateEditSessionIdentity', "Aborted onWillCreateEditSessionIdentity-event after 10000ms"))), this.timeout);
                this._proxy.$onWillCreateEditSessionIdentity(workspaceFolder.uri, token, this.timeout).then(resolve, reject);
            });
            return (0, async_1.raceCancellationError)(p, token);
        }
    }
    let EditSessionIdentityCreateParticipant = class EditSessionIdentityCreateParticipant {
        constructor(extHostContext, instantiationService, _editSessionIdentityService) {
            this._editSessionIdentityService = _editSessionIdentityService;
            this._saveParticipantDisposable = this._editSessionIdentityService.addEditSessionIdentityCreateParticipant(instantiationService.createInstance(ExtHostEditSessionIdentityCreateParticipant, extHostContext));
        }
        dispose() {
            this._saveParticipantDisposable.dispose();
        }
    };
    exports.EditSessionIdentityCreateParticipant = EditSessionIdentityCreateParticipant;
    exports.EditSessionIdentityCreateParticipant = EditSessionIdentityCreateParticipant = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, editSessions_1.IEditSessionIdentityService)
    ], EditSessionIdentityCreateParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRTZXNzaW9uSWRlbnRpdHlQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRFZGl0U2Vzc2lvbklkZW50aXR5UGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWWhHLE1BQU0sMkNBQTJDO1FBS2hELFlBQVksY0FBK0I7WUFGMUIsWUFBTyxHQUFHLEtBQUssQ0FBQztZQUdoQyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWdDLEVBQUUsS0FBd0I7WUFDM0UsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBRTlDLFVBQVUsQ0FDVCxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMseUNBQXlDLEVBQUUsNkRBQTZELENBQUMsQ0FBQyxDQUFDLEVBQzNJLElBQUksQ0FBQyxPQUFPLENBQ1osQ0FBQztnQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlHLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxJQUFBLDZCQUFxQixFQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QyxDQUFDO0tBQ0Q7SUFHTSxJQUFNLG9DQUFvQyxHQUExQyxNQUFNLG9DQUFvQztRQUloRCxZQUNDLGNBQStCLEVBQ1Isb0JBQTJDLEVBQ3BCLDJCQUF3RDtZQUF4RCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBRXRHLElBQUksQ0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsdUNBQXVDLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJDQUEyQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDOU0sQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0MsQ0FBQztLQUNELENBQUE7SUFmWSxvRkFBb0M7bURBQXBDLG9DQUFvQztRQURoRCxrQ0FBZTtRQU9iLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwwQ0FBMkIsQ0FBQTtPQVBqQixvQ0FBb0MsQ0FlaEQifQ==