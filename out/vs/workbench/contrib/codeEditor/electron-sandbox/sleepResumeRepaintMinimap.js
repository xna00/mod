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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/editor/browser/services/codeEditorService", "vs/platform/native/common/native", "vs/base/common/lifecycle"], function (require, exports, platform_1, contributions_1, codeEditorService_1, native_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SleepResumeRepaintMinimap = class SleepResumeRepaintMinimap extends lifecycle_1.Disposable {
        constructor(codeEditorService, nativeHostService) {
            super();
            this._register(nativeHostService.onDidResumeOS(() => {
                codeEditorService.listCodeEditors().forEach(editor => editor.render(true));
            }));
        }
    };
    SleepResumeRepaintMinimap = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, native_1.INativeHostService)
    ], SleepResumeRepaintMinimap);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(SleepResumeRepaintMinimap, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xlZXBSZXN1bWVSZXBhaW50TWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY29kZUVkaXRvci9lbGVjdHJvbi1zYW5kYm94L3NsZWVwUmVzdW1lUmVwYWludE1pbmltYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFTaEcsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtRQUVqRCxZQUNxQixpQkFBcUMsRUFDckMsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFO2dCQUNuRCxpQkFBaUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBWksseUJBQXlCO1FBRzVCLFdBQUEsc0NBQWtCLENBQUE7UUFDbEIsV0FBQSwyQkFBa0IsQ0FBQTtPQUpmLHlCQUF5QixDQVk5QjtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyx5QkFBeUIsb0NBQTRCLENBQUMifQ==