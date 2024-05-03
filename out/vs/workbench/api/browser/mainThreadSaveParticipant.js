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
define(["require", "exports", "vs/editor/common/model", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/textfile/common/textfiles", "../common/extHost.protocol", "vs/base/common/async"], function (require, exports, model_1, nls_1, instantiation_1, extHostCustomers_1, textfiles_1, extHost_protocol_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipant = void 0;
    class ExtHostSaveParticipant {
        constructor(extHostContext) {
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant);
        }
        async participate(editorModel, context, _progress, token) {
            if (!editorModel.textEditorModel || !(0, model_1.shouldSynchronizeModel)(editorModel.textEditorModel)) {
                // the model never made it to the extension
                // host meaning we cannot participate in its save
                return undefined;
            }
            const p = new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error((0, nls_1.localize)('timeout.onWillSave', "Aborted onWillSaveTextDocument-event after 1750ms"))), 1750);
                this._proxy.$participateInSave(editorModel.resource, context.reason).then(values => {
                    if (!values.every(success => success)) {
                        return Promise.reject(new Error('listener failed'));
                    }
                    return undefined;
                }).then(resolve, reject);
            });
            return (0, async_1.raceCancellationError)(p, token);
        }
    }
    // The save participant can change a model before its saved to support various scenarios like trimming trailing whitespace
    let SaveParticipant = class SaveParticipant {
        constructor(extHostContext, instantiationService, _textFileService) {
            this._textFileService = _textFileService;
            this._saveParticipantDisposable = this._textFileService.files.addSaveParticipant(instantiationService.createInstance(ExtHostSaveParticipant, extHostContext));
        }
        dispose() {
            this._saveParticipantDisposable.dispose();
        }
    };
    exports.SaveParticipant = SaveParticipant;
    exports.SaveParticipant = SaveParticipant = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, textfiles_1.ITextFileService)
    ], SaveParticipant);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNhdmVQYXJ0aWNpcGFudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRTYXZlUGFydGljaXBhbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sc0JBQXNCO1FBSTNCLFlBQVksY0FBK0I7WUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUN0RixDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFpQyxFQUFFLE9BQXdDLEVBQUUsU0FBbUMsRUFBRSxLQUF3QjtZQUUzSixJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsSUFBSSxDQUFDLElBQUEsOEJBQXNCLEVBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQzFGLDJDQUEyQztnQkFDM0MsaURBQWlEO2dCQUNqRCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBRTlDLFVBQVUsQ0FDVCxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsbURBQW1ELENBQUMsQ0FBQyxDQUFDLEVBQzVHLElBQUksQ0FDSixDQUFDO2dCQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNsRixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQ3ZDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7b0JBQ3JELENBQUM7b0JBQ0QsT0FBTyxTQUFTLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUEsNkJBQXFCLEVBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FDRDtJQUVELDBIQUEwSDtJQUVuSCxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBSTNCLFlBQ0MsY0FBK0IsRUFDUixvQkFBMkMsRUFDL0IsZ0JBQWtDO1lBQWxDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFFckUsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7UUFDL0osQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0MsQ0FBQztLQUNELENBQUE7SUFmWSwwQ0FBZTs4QkFBZixlQUFlO1FBRDNCLGtDQUFlO1FBT2IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDRCQUFnQixDQUFBO09BUE4sZUFBZSxDQWUzQiJ9