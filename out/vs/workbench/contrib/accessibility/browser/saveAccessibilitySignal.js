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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/workbench/services/workingCopy/common/workingCopyService"], function (require, exports, lifecycle_1, accessibilitySignalService_1, workingCopyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveAccessibilitySignalContribution = void 0;
    let SaveAccessibilitySignalContribution = class SaveAccessibilitySignalContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.saveAccessibilitySignal'; }
        constructor(_accessibilitySignalService, _workingCopyService) {
            super();
            this._accessibilitySignalService = _accessibilitySignalService;
            this._workingCopyService = _workingCopyService;
            this._register(this._workingCopyService.onDidSave(e => this._accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.save, { userGesture: e.reason === 1 /* SaveReason.EXPLICIT */ })));
        }
    };
    exports.SaveAccessibilitySignalContribution = SaveAccessibilitySignalContribution;
    exports.SaveAccessibilitySignalContribution = SaveAccessibilitySignalContribution = __decorate([
        __param(0, accessibilitySignalService_1.IAccessibilitySignalService),
        __param(1, workingCopyService_1.IWorkingCopyService)
    ], SaveAccessibilitySignalContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2F2ZUFjY2Vzc2liaWxpdHlTaWduYWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci9zYXZlQWNjZXNzaWJpbGl0eVNpZ25hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxtQ0FBbUMsR0FBekMsTUFBTSxtQ0FBb0MsU0FBUSxzQkFBVTtpQkFFbEQsT0FBRSxHQUFHLDJDQUEyQyxBQUE5QyxDQUErQztRQUVqRSxZQUMrQywyQkFBd0QsRUFDaEUsbUJBQXdDO1lBRTlFLEtBQUssRUFBRSxDQUFDO1lBSHNDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDaEUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUc5RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLGdEQUFtQixDQUFDLElBQUksRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsTUFBTSxnQ0FBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25MLENBQUM7O0lBVlcsa0ZBQW1DO2tEQUFuQyxtQ0FBbUM7UUFLN0MsV0FBQSx3REFBMkIsQ0FBQTtRQUMzQixXQUFBLHdDQUFtQixDQUFBO09BTlQsbUNBQW1DLENBVy9DIn0=