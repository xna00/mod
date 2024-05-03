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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/workbench/services/configuration/common/jsonEditing", "vs/base/common/map"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, getIconClasses_1, files_1, extensions_1, instantiation_1, workspace_1, quickInput_1, model_1, language_1, nls_1, jsonEditing_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceExtensionsConfigService = exports.IWorkspaceExtensionsConfigService = exports.EXTENSIONS_CONFIG = void 0;
    exports.EXTENSIONS_CONFIG = '.vscode/extensions.json';
    exports.IWorkspaceExtensionsConfigService = (0, instantiation_1.createDecorator)('IWorkspaceExtensionsConfigService');
    let WorkspaceExtensionsConfigService = class WorkspaceExtensionsConfigService extends lifecycle_1.Disposable {
        constructor(workspaceContextService, fileService, quickInputService, modelService, languageService, jsonEditingService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.jsonEditingService = jsonEditingService;
            this._onDidChangeExtensionsConfigs = this._register(new event_1.Emitter());
            this.onDidChangeExtensionsConfigs = this._onDidChangeExtensionsConfigs.event;
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(e => this._onDidChangeExtensionsConfigs.fire()));
            this._register(fileService.onDidFilesChange(e => {
                const workspace = workspaceContextService.getWorkspace();
                if ((workspace.configuration && e.affects(workspace.configuration))
                    || workspace.folders.some(folder => e.affects(folder.toResource(exports.EXTENSIONS_CONFIG)))) {
                    this._onDidChangeExtensionsConfigs.fire();
                }
            }));
        }
        async getExtensionsConfigs() {
            const workspace = this.workspaceContextService.getWorkspace();
            const result = [];
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            if (workspaceExtensionsConfigContent) {
                result.push(workspaceExtensionsConfigContent);
            }
            result.push(...await Promise.all(workspace.folders.map(workspaceFolder => this.resolveWorkspaceFolderExtensionConfig(workspaceFolder))));
            return result;
        }
        async getRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.recommendations ? c.recommendations.map(c => c.toLowerCase()) : [])));
        }
        async getUnwantedRecommendations() {
            const configs = await this.getExtensionsConfigs();
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(configs.map(c => c.unwantedRecommendations ? c.unwantedRecommendations.map(c => c.toLowerCase()) : [])));
        }
        async toggleRecommendation(extensionId) {
            extensionId = extensionId.toLowerCase();
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceRecommended = workspaceExtensionsConfigContent && workspaceExtensionsConfigContent.recommendations?.some(r => r.toLowerCase() === extensionId);
            const recommendedWorksapceFolders = workspace.folders.filter(workspaceFolder => workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)?.recommendations?.some(r => r.toLowerCase() === extensionId));
            const isRecommended = isWorkspaceRecommended || recommendedWorksapceFolders.length > 0;
            const workspaceOrFolders = isRecommended
                ? await this.pickWorkspaceOrFolders(recommendedWorksapceFolders, isWorkspaceRecommended ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isRecommended);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isRecommended);
                }
            }
        }
        async toggleUnwantedRecommendation(extensionId) {
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceExtensionsConfigContent = workspace.configuration ? await this.resolveWorkspaceExtensionConfig(workspace.configuration) : undefined;
            const workspaceFolderExtensionsConfigContents = new map_1.ResourceMap();
            await Promise.all(workspace.folders.map(async (workspaceFolder) => {
                const extensionsConfigContent = await this.resolveWorkspaceFolderExtensionConfig(workspaceFolder);
                workspaceFolderExtensionsConfigContents.set(workspaceFolder.uri, extensionsConfigContent);
            }));
            const isWorkspaceUnwanted = workspaceExtensionsConfigContent && workspaceExtensionsConfigContent.unwantedRecommendations?.some(r => r === extensionId);
            const unWantedWorksapceFolders = workspace.folders.filter(workspaceFolder => workspaceFolderExtensionsConfigContents.get(workspaceFolder.uri)?.unwantedRecommendations?.some(r => r === extensionId));
            const isUnwanted = isWorkspaceUnwanted || unWantedWorksapceFolders.length > 0;
            const workspaceOrFolders = isUnwanted
                ? await this.pickWorkspaceOrFolders(unWantedWorksapceFolders, isWorkspaceUnwanted ? workspace : undefined, (0, nls_1.localize)('select for remove', "Remove extension recommendation from"))
                : await this.pickWorkspaceOrFolders(workspace.folders, workspace.configuration ? workspace : undefined, (0, nls_1.localize)('select for add', "Add extension recommendation to"));
            for (const workspaceOrWorkspaceFolder of workspaceOrFolders) {
                if ((0, workspace_1.isWorkspace)(workspaceOrWorkspaceFolder)) {
                    await this.addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceExtensionsConfigContent, !isUnwanted);
                }
                else {
                    await this.addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceOrWorkspaceFolder, workspaceFolderExtensionsConfigContents.get(workspaceOrWorkspaceFolder.uri), !isUnwanted);
                }
            }
        }
        async addOrRemoveWorkspaceFolderRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                if (Array.isArray(extensionsConfigContent.recommendations)) {
                    values.push({ path: ['recommendations', -1], value: extensionId });
                }
                else {
                    values.push({ path: ['recommendations'], value: [extensionId] });
                }
                const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                if (unwantedRecommendationEdit) {
                    values.push(unwantedRecommendationEdit);
                }
            }
            else if (extensionsConfigContent.recommendations) {
                const recommendationEdit = this.getEditToRemoveValueFromArray(['recommendations'], extensionsConfigContent.recommendations, extensionId);
                if (recommendationEdit) {
                    values.push(recommendationEdit);
                }
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    const path = ['extensions', 'recommendations'];
                    if (Array.isArray(extensionsConfigContent.recommendations)) {
                        values.push({ path: [...path, -1], value: extensionId });
                    }
                    else {
                        values.push({ path, value: [extensionId] });
                    }
                    const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                    if (unwantedRecommendationEdit) {
                        values.push(unwantedRecommendationEdit);
                    }
                }
                else if (extensionsConfigContent.recommendations) {
                    const recommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'recommendations'], extensionsConfigContent.recommendations, extensionId);
                    if (recommendationEdit) {
                        values.push(recommendationEdit);
                    }
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { recommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async addOrRemoveWorkspaceFolderUnwantedRecommendation(extensionId, workspaceFolder, extensionsConfigContent, add) {
            const values = [];
            if (add) {
                const path = ['unwantedRecommendations'];
                if (Array.isArray(extensionsConfigContent.unwantedRecommendations)) {
                    values.push({ path: [...path, -1], value: extensionId });
                }
                else {
                    values.push({ path, value: [extensionId] });
                }
                const recommendationEdit = this.getEditToRemoveValueFromArray(['recommendations'], extensionsConfigContent.recommendations, extensionId);
                if (recommendationEdit) {
                    values.push(recommendationEdit);
                }
            }
            else if (extensionsConfigContent.unwantedRecommendations) {
                const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                if (unwantedRecommendationEdit) {
                    values.push(unwantedRecommendationEdit);
                }
            }
            if (values.length) {
                return this.jsonEditingService.write(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG), values, true);
            }
        }
        async addOrRemoveWorkspaceUnwantedRecommendation(extensionId, workspace, extensionsConfigContent, add) {
            const values = [];
            if (extensionsConfigContent) {
                if (add) {
                    const path = ['extensions', 'unwantedRecommendations'];
                    if (Array.isArray(extensionsConfigContent.recommendations)) {
                        values.push({ path: [...path, -1], value: extensionId });
                    }
                    else {
                        values.push({ path, value: [extensionId] });
                    }
                    const recommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'recommendations'], extensionsConfigContent.recommendations, extensionId);
                    if (recommendationEdit) {
                        values.push(recommendationEdit);
                    }
                }
                else if (extensionsConfigContent.unwantedRecommendations) {
                    const unwantedRecommendationEdit = this.getEditToRemoveValueFromArray(['extensions', 'unwantedRecommendations'], extensionsConfigContent.unwantedRecommendations, extensionId);
                    if (unwantedRecommendationEdit) {
                        values.push(unwantedRecommendationEdit);
                    }
                }
            }
            else if (add) {
                values.push({ path: ['extensions'], value: { unwantedRecommendations: [extensionId] } });
            }
            if (values.length) {
                return this.jsonEditingService.write(workspace.configuration, values, true);
            }
        }
        async pickWorkspaceOrFolders(workspaceFolders, workspace, placeHolder) {
            const workspaceOrFolders = workspace ? [...workspaceFolders, workspace] : [...workspaceFolders];
            if (workspaceOrFolders.length === 1) {
                return workspaceOrFolders;
            }
            const folderPicks = workspaceFolders.map(workspaceFolder => {
                return {
                    label: workspaceFolder.name,
                    description: (0, nls_1.localize)('workspace folder', "Workspace Folder"),
                    workspaceOrFolder: workspaceFolder,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, workspaceFolder.uri, files_1.FileKind.ROOT_FOLDER)
                };
            });
            if (workspace) {
                folderPicks.push({ type: 'separator' });
                folderPicks.push({
                    label: (0, nls_1.localize)('workspace', "Workspace"),
                    workspaceOrFolder: workspace,
                });
            }
            const result = await this.quickInputService.pick(folderPicks, { placeHolder, canPickMany: true }) || [];
            return result.map(r => r.workspaceOrFolder);
        }
        async resolveWorkspaceExtensionConfig(workspaceConfigurationResource) {
            try {
                const content = await this.fileService.readFile(workspaceConfigurationResource);
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString())['extensions'];
                return extensionsConfigContent ? this.parseExtensionConfig(extensionsConfigContent) : undefined;
            }
            catch (e) { /* Ignore */ }
            return undefined;
        }
        async resolveWorkspaceFolderExtensionConfig(workspaceFolder) {
            try {
                const content = await this.fileService.readFile(workspaceFolder.toResource(exports.EXTENSIONS_CONFIG));
                const extensionsConfigContent = (0, json_1.parse)(content.value.toString());
                return this.parseExtensionConfig(extensionsConfigContent);
            }
            catch (e) { /* ignore */ }
            return {};
        }
        parseExtensionConfig(extensionsConfigContent) {
            return {
                recommendations: (0, arrays_1.distinct)((extensionsConfigContent.recommendations || []).map(e => e.toLowerCase())),
                unwantedRecommendations: (0, arrays_1.distinct)((extensionsConfigContent.unwantedRecommendations || []).map(e => e.toLowerCase()))
            };
        }
        getEditToRemoveValueFromArray(path, array, value) {
            const index = array?.indexOf(value);
            if (index !== undefined && index !== -1) {
                return { path: [...path, index], value: undefined };
            }
            return undefined;
        }
    };
    exports.WorkspaceExtensionsConfigService = WorkspaceExtensionsConfigService;
    exports.WorkspaceExtensionsConfigService = WorkspaceExtensionsConfigService = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, files_1.IFileService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService),
        __param(5, jsonEditing_1.IJSONEditingService)
    ], WorkspaceExtensionsConfigService);
    (0, extensions_1.registerSingleton)(exports.IWorkspaceExtensionsConfigService, WorkspaceExtensionsConfigService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlRXh0ZW5zaW9uc0NvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvblJlY29tbWVuZGF0aW9ucy9jb21tb24vd29ya3NwYWNlRXh0ZW5zaW9uc0NvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQm5GLFFBQUEsaUJBQWlCLEdBQUcseUJBQXlCLENBQUM7SUFPOUMsUUFBQSxpQ0FBaUMsR0FBRyxJQUFBLCtCQUFlLEVBQW9DLG1DQUFtQyxDQUFDLENBQUM7SUFjbEksSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBaUMsU0FBUSxzQkFBVTtRQU8vRCxZQUMyQix1QkFBa0UsRUFDOUUsV0FBMEMsRUFDcEMsaUJBQXNELEVBQzNELFlBQTRDLEVBQ3pDLGVBQWtELEVBQy9DLGtCQUF3RDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQVBtQyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQzdELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ25CLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzlCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFUN0Qsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDNUUsaUNBQTRCLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQVdoRixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLElBQUks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