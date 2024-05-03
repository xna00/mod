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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/process", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/services/configurationResolver/common/variableResolver", "./extHostConfiguration"], function (require, exports, lazy_1, lifecycle_1, path, process, instantiation_1, extHostDocumentsAndEditors_1, extHostEditorTabs_1, extHostExtensionService_1, extHostTypes_1, extHostWorkspace_1, variableResolver_1, extHostConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostVariableResolverProviderService = exports.IExtHostVariableResolverProvider = void 0;
    exports.IExtHostVariableResolverProvider = (0, instantiation_1.createDecorator)('IExtHostVariableResolverProvider');
    class ExtHostVariableResolverService extends variableResolver_1.AbstractVariableResolverService {
        constructor(extensionService, workspaceService, editorService, editorTabs, configProvider, context, homeDir) {
            function getActiveUri() {
                if (editorService) {
                    const activeEditor = editorService.activeEditor();
                    if (activeEditor) {
                        return activeEditor.document.uri;
                    }
                    const activeTab = editorTabs.tabGroups.all.find(group => group.isActive)?.activeTab;
                    if (activeTab !== undefined) {
                        // Resolve a resource from the tab
                        if (activeTab.input instanceof extHostTypes_1.TextDiffTabInput || activeTab.input instanceof extHostTypes_1.NotebookDiffEditorTabInput) {
                            return activeTab.input.modified;
                        }
                        else if (activeTab.input instanceof extHostTypes_1.TextTabInput || activeTab.input instanceof extHostTypes_1.NotebookEditorTabInput || activeTab.input instanceof extHostTypes_1.CustomEditorTabInput) {
                            return activeTab.input.uri;
                        }
                    }
                }
                return undefined;
            }
            super({
                getFolderUri: (folderName) => {
                    const found = context.folders.filter(f => f.name === folderName);
                    if (found && found.length > 0) {
                        return found[0].uri;
                    }
                    return undefined;
                },
                getWorkspaceFolderCount: () => {
                    return context.folders.length;
                },
                getConfigurationValue: (folderUri, section) => {
                    return configProvider.getConfiguration(undefined, folderUri).get(section);
                },
                getAppRoot: () => {
                    return process.cwd();
                },
                getExecPath: () => {
                    return process.env['VSCODE_EXEC_PATH'];
                },
                getFilePath: () => {
                    const activeUri = getActiveUri();
                    if (activeUri) {
                        return path.normalize(activeUri.fsPath);
                    }
                    return undefined;
                },
                getWorkspaceFolderPathForFile: () => {
                    if (workspaceService) {
                        const activeUri = getActiveUri();
                        if (activeUri) {
                            const ws = workspaceService.getWorkspaceFolder(activeUri);
                            if (ws) {
                                return path.normalize(ws.uri.fsPath);
                            }
                        }
                    }
                    return undefined;
                },
                getSelectedText: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor && !activeEditor.selection.isEmpty) {
                            return activeEditor.document.getText(activeEditor.selection);
                        }
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    if (editorService) {
                        const activeEditor = editorService.activeEditor();
                        if (activeEditor) {
                            return String(activeEditor.selection.end.line + 1);
                        }
                    }
                    return undefined;
                },
                getExtension: (id) => {
                    return extensionService.getExtension(id);
                },
            }, undefined, homeDir ? Promise.resolve(homeDir) : undefined, Promise.resolve(process.env));
        }
    }
    let ExtHostVariableResolverProviderService = class ExtHostVariableResolverProviderService extends lifecycle_1.Disposable {
        constructor(extensionService, workspaceService, editorService, configurationService, editorTabs) {
            super();
            this.extensionService = extensionService;
            this.workspaceService = workspaceService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.editorTabs = editorTabs;
            this._resolver = new lazy_1.Lazy(async () => {
                const configProvider = await this.configurationService.getConfigProvider();
                const folders = await this.workspaceService.getWorkspaceFolders2() || [];
                const dynamic = { folders };
                this._register(this.workspaceService.onDidChangeWorkspace(async (e) => {
                    dynamic.folders = await this.workspaceService.getWorkspaceFolders2() || [];
                }));
                return new ExtHostVariableResolverService(this.extensionService, this.workspaceService, this.editorService, this.editorTabs, configProvider, dynamic, this.homeDir());
            });
        }
        getResolver() {
            return this._resolver.value;
        }
        homeDir() {
            return undefined;
        }
    };
    exports.ExtHostVariableResolverProviderService = ExtHostVariableResolverProviderService;
    exports.ExtHostVariableResolverProviderService = ExtHostVariableResolverProviderService = __decorate([
        __param(0, extHostExtensionService_1.IExtHostExtensionService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostEditorTabs_1.IExtHostEditorTabs)
    ], ExtHostVariableResolverProviderService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFZhcmlhYmxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VmFyaWFibGVSZXNvbHZlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJuRixRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsa0NBQWtDLENBQUMsQ0FBQztJQU10SSxNQUFNLDhCQUErQixTQUFRLGtEQUErQjtRQUUzRSxZQUNDLGdCQUEwQyxFQUMxQyxnQkFBbUMsRUFDbkMsYUFBMEMsRUFDMUMsVUFBOEIsRUFDOUIsY0FBcUMsRUFDckMsT0FBdUIsRUFDdkIsT0FBMkI7WUFFM0IsU0FBUyxZQUFZO2dCQUNwQixJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNuQixNQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ2xELElBQUksWUFBWSxFQUFFLENBQUM7d0JBQ2xCLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7b0JBQ2xDLENBQUM7b0JBQ0QsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQztvQkFDcEYsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQzdCLGtDQUFrQzt3QkFDbEMsSUFBSSxTQUFTLENBQUMsS0FBSyxZQUFZLCtCQUFnQixJQUFJLFNBQVMsQ0FBQyxLQUFLLFlBQVkseUNBQTBCLEVBQUUsQ0FBQzs0QkFDMUcsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQzt3QkFDakMsQ0FB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