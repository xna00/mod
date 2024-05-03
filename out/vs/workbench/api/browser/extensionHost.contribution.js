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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/jsonValidationExtensionPoint", "vs/workbench/services/themes/common/colorExtensionPoint", "vs/workbench/services/themes/common/iconExtensionPoint", "vs/workbench/services/themes/common/tokenClassificationExtensionPoint", "vs/workbench/contrib/codeEditor/common/languageConfigurationExtensionPoint", "vs/workbench/api/browser/statusBarExtensionPoint", "./mainThreadLocalization", "./mainThreadBulkEdits", "./mainThreadLanguageModels", "./mainThreadChatAgents2", "./mainThreadChatVariables", "./mainThreadCodeInsets", "./mainThreadCLICommands", "./mainThreadClipboard", "./mainThreadCommands", "./mainThreadConfiguration", "./mainThreadConsole", "./mainThreadDebugService", "./mainThreadDecorations", "./mainThreadDiagnostics", "./mainThreadDialogs", "./mainThreadDocumentContentProviders", "./mainThreadDocuments", "./mainThreadDocumentsAndEditors", "./mainThreadEditor", "./mainThreadEditors", "./mainThreadEditorTabs", "./mainThreadErrors", "./mainThreadExtensionService", "./mainThreadFileSystem", "./mainThreadFileSystemEventService", "./mainThreadLanguageFeatures", "./mainThreadLanguages", "./mainThreadLogService", "./mainThreadMessageService", "./mainThreadManagedSockets", "./mainThreadOutputService", "./mainThreadProgress", "./mainThreadQuickDiff", "./mainThreadQuickOpen", "./mainThreadRemoteConnectionData", "./mainThreadSaveParticipant", "./mainThreadSpeech", "./mainThreadEditSessionIdentityParticipant", "./mainThreadSCM", "./mainThreadSearch", "./mainThreadStatusBar", "./mainThreadStorage", "./mainThreadTelemetry", "./mainThreadTerminalService", "./mainThreadTerminalShellIntegration", "./mainThreadTheming", "./mainThreadTreeViews", "./mainThreadDownloadService", "./mainThreadUrls", "./mainThreadUriOpeners", "./mainThreadWindow", "./mainThreadWebviewManager", "./mainThreadWorkspace", "./mainThreadComments", "./mainThreadNotebook", "./mainThreadNotebookKernels", "./mainThreadNotebookDocumentsAndEditors", "./mainThreadNotebookRenderers", "./mainThreadNotebookSaveParticipant", "./mainThreadInteractive", "./mainThreadInlineChat", "./mainThreadChat", "./mainThreadTask", "./mainThreadLabelService", "./mainThreadTunnelService", "./mainThreadAuthentication", "./mainThreadTimeline", "./mainThreadTesting", "./mainThreadSecretState", "./mainThreadShare", "./mainThreadProfileContentHandlers", "./mainThreadAiRelatedInformation", "./mainThreadAiEmbeddingVector", "./mainThreadIssueReporter"], function (require, exports, contributions_1, instantiation_1, jsonValidationExtensionPoint_1, colorExtensionPoint_1, iconExtensionPoint_1, tokenClassificationExtensionPoint_1, languageConfigurationExtensionPoint_1, statusBarExtensionPoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionPoints = void 0;
    let ExtensionPoints = class ExtensionPoints {
        static { this.ID = 'workbench.contrib.extensionPoints'; }
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            // Classes that handle extension points...
            this.instantiationService.createInstance(jsonValidationExtensionPoint_1.JSONValidationExtensionPoint);
            this.instantiationService.createInstance(colorExtensionPoint_1.ColorExtensionPoint);
            this.instantiationService.createInstance(iconExtensionPoint_1.IconExtensionPoint);
            this.instantiationService.createInstance(tokenClassificationExtensionPoint_1.TokenClassificationExtensionPoints);
            this.instantiationService.createInstance(languageConfigurationExtensionPoint_1.LanguageConfigurationFileHandler);
            this.instantiationService.createInstance(statusBarExtensionPoint_1.StatusBarItemsExtensionPoint);
        }
    };
    exports.ExtensionPoints = ExtensionPoints;
    exports.ExtensionPoints = ExtensionPoints = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ExtensionPoints);
    (0, contributions_1.registerWorkbenchContribution2)(ExtensionPoints.ID, ExtensionPoints, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9leHRlbnNpb25Ib3N0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5RnpGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7aUJBRVgsT0FBRSxHQUFHLG1DQUFtQyxBQUF0QyxDQUF1QztRQUV6RCxZQUN5QyxvQkFBMkM7WUFBM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVuRiwwQ0FBMEM7WUFDMUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyREFBNEIsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUNBQW1CLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVDQUFrQixDQUFDLENBQUM7WUFDN0QsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxzRUFBa0MsQ0FBQyxDQUFDO1lBQzdFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsc0VBQWdDLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNEQUE0QixDQUFDLENBQUM7UUFDeEUsQ0FBQzs7SUFkVywwQ0FBZTs4QkFBZixlQUFlO1FBS3pCLFdBQUEscUNBQXFCLENBQUE7T0FMWCxlQUFlLENBZTNCO0lBRUQsSUFBQSw4Q0FBOEIsRUFBQyxlQUFlLENBQUMsRUFBRSxFQUFFLGVBQWUsc0NBQThCLENBQUMifQ==