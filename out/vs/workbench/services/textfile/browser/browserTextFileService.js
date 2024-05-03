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
define(["require", "exports", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/editor/browser/services/codeEditorService", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/textResourceConfiguration", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/path/common/pathService", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/decorations/common/decorations"], function (require, exports, textFileService_1, textfiles_1, extensions_1, environmentService_1, codeEditorService_1, model_1, language_1, textResourceConfiguration_1, dialogs_1, files_1, instantiation_1, log_1, elevatedFileService_1, filesConfigurationService_1, lifecycle_1, pathService_1, untitledTextEditorService_1, uriIdentity_1, workingCopyFileService_1, decorations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserTextFileService = void 0;
    let BrowserTextFileService = class BrowserTextFileService extends textFileService_1.AbstractTextFileService {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, elevatedFileService, logService, decorationsService) {
            super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, logService, elevatedFileService, decorationsService);
            this.registerListeners();
        }
        registerListeners() {
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdown(), 'veto.textFiles')));
        }
        onBeforeShutdown() {
            if (this.files.models.some(model => model.hasState(2 /* TextFileEditorModelState.PENDING_SAVE */))) {
                return true; // files are pending to be saved: veto (as there is no support for long running operations on shutdown)
            }
            return false;
        }
    };
    exports.BrowserTextFileService = BrowserTextFileService;
    exports.BrowserTextFileService = BrowserTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, filesConfigurationService_1.IFilesConfigurationService),
        __param(10, codeEditorService_1.ICodeEditorService),
        __param(11, pathService_1.IPathService),
        __param(12, workingCopyFileService_1.IWorkingCopyFileService),
        __param(13, uriIdentity_1.IUriIdentityService),
        __param(14, language_1.ILanguageService),
        __param(15, elevatedFileService_1.IElevatedFileService),
        __param(16, log_1.ILogService),
        __param(17, decorations_1.IDecorationsService)
    ], BrowserTextFileService);
    (0, extensions_1.registerSingleton)(textfiles_1.ITextFileService, BrowserTextFileService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3NlclRleHRGaWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RleHRmaWxlL2Jyb3dzZXIvYnJvd3NlclRleHRGaWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEseUNBQXVCO1FBRWxFLFlBQ2UsV0FBeUIsRUFDWCx5QkFBcUQsRUFDOUQsZ0JBQW1DLEVBQy9CLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNaLGtCQUFnRCxFQUM5RCxhQUE2QixFQUN6QixpQkFBcUMsRUFDdEIsZ0NBQW1FLEVBQzFFLHlCQUFxRCxFQUM3RCxpQkFBcUMsRUFDM0MsV0FBeUIsRUFDZCxzQkFBK0MsRUFDbkQsa0JBQXVDLEVBQzFDLGVBQWlDLEVBQzdCLG1CQUF5QyxFQUNsRCxVQUF1QixFQUNmLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsV0FBVyxFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsZ0NBQWdDLEVBQUUseUJBQXlCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFFLGtCQUFrQixFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUV6VyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLFlBQVk7WUFDWixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEgsQ0FBQztRQUVPLGdCQUFnQjtZQUN2QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxRQUFRLCtDQUF1QyxDQUFDLEVBQUUsQ0FBQztnQkFDNUYsT0FBTyxJQUFJLENBQUMsQ0FBQyx1R0FBdUc7WUFDckgsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztLQUNELENBQUE7SUF4Q1ksd0RBQXNCO3FDQUF0QixzQkFBc0I7UUFHaEMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDRCQUFrQixDQUFBO1FBQ2xCLFdBQUEsNkRBQWlDLENBQUE7UUFDakMsV0FBQSxzREFBMEIsQ0FBQTtRQUMxQixZQUFBLHNDQUFrQixDQUFBO1FBQ2xCLFlBQUEsMEJBQVksQ0FBQTtRQUNaLFlBQUEsZ0RBQXVCLENBQUE7UUFDdkIsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFlBQUEsMENBQW9CLENBQUE7UUFDcEIsWUFBQSxpQkFBVyxDQUFBO1FBQ1gsWUFBQSxpQ0FBbUIsQ0FBQTtPQXBCVCxzQkFBc0IsQ0F3Q2xDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyw0QkFBZ0IsRUFBRSxzQkFBc0Isa0NBQTBCLENBQUMifQ==