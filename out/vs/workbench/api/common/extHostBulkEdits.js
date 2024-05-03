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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, extHost_protocol_1, extHostRpcService_1, extHostTypeConverters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostBulkEdits = void 0;
    let ExtHostBulkEdits = class ExtHostBulkEdits {
        constructor(extHostRpc, extHostDocumentsAndEditors) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadBulkEdits);
            this._versionInformationProvider = {
                getTextDocumentVersion: uri => extHostDocumentsAndEditors.getDocument(uri)?.version,
                getNotebookDocumentVersion: () => undefined
            };
        }
        applyWorkspaceEdit(edit, extension, metadata) {
            const dto = extHostTypeConverters_1.WorkspaceEdit.from(edit, this._versionInformationProvider);
            return this._proxy.$tryApplyWorkspaceEdit(dto, undefined, metadata?.isRefactoring ?? false);
        }
    };
    exports.ExtHostBulkEdits = ExtHostBulkEdits;
    exports.ExtHostBulkEdits = ExtHostBulkEdits = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostBulkEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdEJ1bGtFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdEJ1bGtFZGl0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7UUFLNUIsWUFDcUIsVUFBOEIsRUFDbEQsMEJBQXNEO1lBRXRELElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFFbkUsSUFBSSxDQUFDLDJCQUEyQixHQUFHO2dCQUNsQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPO2dCQUNuRiwwQkFBMEIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2FBQzNDLENBQUM7UUFDSCxDQUFDO1FBRUQsa0JBQWtCLENBQUMsSUFBMEIsRUFBRSxTQUFnQyxFQUFFLFFBQWtEO1lBQ2xJLE1BQU0sR0FBRyxHQUFHLHFDQUFhLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUN2RSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsYUFBYSxJQUFJLEtBQUssQ0FBQyxDQUFDO1FBQzdGLENBQUM7S0FDRCxDQUFBO0lBckJZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBTTFCLFdBQUEsc0NBQWtCLENBQUE7T0FOUixnQkFBZ0IsQ0FxQjVCIn0=