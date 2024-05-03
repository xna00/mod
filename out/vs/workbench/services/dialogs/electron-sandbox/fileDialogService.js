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
define(["require", "exports", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/native/common/native", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network", "vs/editor/common/languages/language", "vs/platform/workspaces/common/workspaces", "vs/platform/label/common/label", "vs/workbench/services/path/common/pathService", "vs/platform/commands/common/commands", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/editor/common/editorService", "vs/platform/log/common/log", "vs/base/browser/dom"], function (require, exports, host_1, dialogs_1, workspace_1, history_1, environmentService_1, uri_1, instantiation_1, configuration_1, extensions_1, files_1, opener_1, native_1, abstractFileDialogService_1, network_1, language_1, workspaces_1, label_1, pathService_1, commands_1, codeEditorService_1, editorService_1, log_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDialogService = void 0;
    let FileDialogService = class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        constructor(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, nativeHostService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService) {
            super(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService);
            this.nativeHostService = nativeHostService;
        }
        toNativeOpenDialogOptions(options) {
            return {
                forceNewWindow: options.forceNewWindow,
                telemetryExtraData: options.telemetryExtraData,
                defaultPath: options.defaultUri?.fsPath
            };
        }
        shouldUseSimplified(schema) {
            const setting = (this.configurationService.getValue('files.simpleDialog.enable') === true);
            const newWindowSetting = (this.configurationService.getValue('window.openFilesInNewWindow') === 'on');
            return {
                useSimplified: ((schema !== network_1.Schemas.file) && (schema !== network_1.Schemas.vscodeUserData)) || setting,
                isSetting: newWindowSetting
            };
        }
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            const shouldUseSimplified = this.shouldUseSimplified(schema);
            if (shouldUseSimplified.useSimplified) {
                return this.pickFileFolderAndOpenSimplified(schema, options, shouldUseSimplified.isSetting);
            }
            return this.nativeHostService.pickFileFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            const shouldUseSimplified = this.shouldUseSimplified(schema);
            if (shouldUseSimplified.useSimplified) {
                return this.pickFileAndOpenSimplified(schema, options, shouldUseSimplified.isSetting);
            }
            return this.nativeHostService.pickFileAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickFolderAndOpenSimplified(schema, options);
            }
            return this.nativeHostService.pickFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickWorkspaceAndOpen(options) {
            options.availableFileSystems = this.getWorkspaceAvailableFileSystems(options);
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickWorkspaceAndOpenSimplified(schema, options);
            }
            return this.nativeHostService.pickWorkspaceAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFileToSave(defaultUri, availableFileSystems) {
            const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems });
            const options = this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickFileToSaveSimplified(schema, options);
            }
            else {
                const result = await this.nativeHostService.showSaveDialog(this.toNativeSaveDialogOptions(options));
                if (result && !result.canceled && result.filePath) {
                    const uri = uri_1.URI.file(result.filePath);
                    this.addFileToRecentlyOpened(uri);
                    return uri;
                }
            }
            return;
        }
        toNativeSaveDialogOptions(options) {
            options.defaultUri = options.defaultUri ? uri_1.URI.file(options.defaultUri.path) : undefined;
            return {
                defaultPath: options.defaultUri?.fsPath,
                buttonLabel: options.saveLabel,
                filters: options.filters,
                title: options.title,
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            };
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.showSaveDialogSimplified(schema, options);
            }
            const result = await this.nativeHostService.showSaveDialog(this.toNativeSaveDialogOptions(options));
            if (result && !result.canceled && result.filePath) {
                return uri_1.URI.file(result.filePath);
            }
            return;
        }
        async showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.showOpenDialogSimplified(schema, options);
            }
            const newOptions = {
                title: options.title,
                defaultPath: options.defaultUri?.fsPath,
                buttonLabel: options.openLabel,
                filters: options.filters,
                properties: [],
                targetWindowId: (0, dom_1.getActiveWindow)().vscodeWindowId
            };
            newOptions.properties.push('createDirectory');
            if (options.canSelectFiles) {
                newOptions.properties.push('openFile');
            }
            if (options.canSelectFolders) {
                newOptions.properties.push('openDirectory');
            }
            if (options.canSelectMany) {
                newOptions.properties.push('multiSelections');
            }
            const result = await this.nativeHostService.showOpenDialog(newOptions);
            return result && Array.isArray(result.filePaths) && result.filePaths.length > 0 ? result.filePaths.map(uri_1.URI.file) : undefined;
        }
    };
    exports.FileDialogService = FileDialogService;
    exports.FileDialogService = FileDialogService = __decorate([
        __param(0, host_1.IHostService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService),
        __param(7, opener_1.IOpenerService),
        __param(8, native_1.INativeHostService),
        __param(9, dialogs_1.IDialogService),
        __param(10, language_1.ILanguageService),
        __param(11, workspaces_1.IWorkspacesService),
        __param(12, label_1.ILabelService),
        __param(13, pathService_1.IPathService),
        __param(14, commands_1.ICommandService),
        __param(15, editorService_1.IEditorService),
        __param(16, codeEditorService_1.ICodeEditorService),
        __param(17, log_1.ILogService)
    ], FileDialogService);
    (0, extensions_1.registerSingleton)(dialogs_1.IFileDialogService, FileDialogService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZURpYWxvZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9kaWFsb2dzL2VsZWN0cm9uLXNhbmRib3gvZmlsZURpYWxvZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHFEQUF5QjtRQUUvRCxZQUNlLFdBQXlCLEVBQ2IsY0FBd0MsRUFDakQsY0FBK0IsRUFDbEIsa0JBQWdELEVBQ3ZELG9CQUEyQyxFQUMzQyxvQkFBMkMsRUFDcEQsV0FBeUIsRUFDdkIsYUFBNkIsRUFDUixpQkFBcUMsRUFDMUQsYUFBNkIsRUFDM0IsZUFBaUMsRUFDL0IsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQzVCLFdBQXlCLEVBQ3RCLGNBQStCLEVBQ2hDLGFBQTZCLEVBQ3pCLGlCQUFxQyxFQUM1QyxVQUF1QjtZQUVwQyxLQUFLLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQzFGLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFaMUosc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtRQWEzRSxDQUFDO1FBRU8seUJBQXlCLENBQUMsT0FBNEI7WUFDN0QsT0FBTztnQkFDTixjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7Z0JBQ3RDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxrQkFBa0I7Z0JBQzlDLFdBQVcsRUFBRSxPQUFPLENBQUMsVUFBVSxF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