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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/configuration", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, lifecycle_1, resources_1, model_1, language_1, resolverService_1, nls, configuration_1, configurationRegistry_1, JSONContributionRegistry, platform_1, workspace_1, configuration_2, sideBySideEditorInput_1, editorResolverService_1, textEditorService_1, preferences_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesContribution = void 0;
    const schemaRegistry = platform_1.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
    let PreferencesContribution = class PreferencesContribution {
        static { this.ID = 'workbench.contrib.preferences'; }
        constructor(modelService, textModelResolverService, preferencesService, languageService, userDataProfileService, workspaceService, configurationService, editorResolverService, textEditorService) {
            this.modelService = modelService;
            this.textModelResolverService = textModelResolverService;
            this.preferencesService = preferencesService;
            this.languageService = languageService;
            this.userDataProfileService = userDataProfileService;
            this.workspaceService = workspaceService;
            this.configurationService = configurationService;
            this.editorResolverService = editorResolverService;
            this.textEditorService = textEditorService;
            this.settingsListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(preferences_1.USE_SPLIT_JSON_SETTING) || e.affectsConfiguration(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING)) {
                    this.handleSettingsEditorRegistration();
                }
            });
            this.handleSettingsEditorRegistration();
            this.start();
        }
        handleSettingsEditorRegistration() {
            // dispose any old listener we had
            (0, lifecycle_1.dispose)(this.editorOpeningListener);
            // install editor opening listener unless user has disabled this
            if (!!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING) || !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING)) {
                this.editorOpeningListener = this.editorResolverService.registerEditor('**/settings.json', {
                    id: sideBySideEditorInput_1.SideBySideEditorInput.ID,
                    label: nls.localize('splitSettingsEditorLabel', "Split Settings Editor"),
                    priority: editorResolverService_1.RegisteredEditorPriority.builtin,
                }, {}, {
                    createEditorInput: ({ resource, options }) => {
                        // Global User Settings File
                        if ((0, resources_1.isEqual)(resource, this.userDataProfileService.currentProfile.settingsResource)) {
                            return { editor: this.preferencesService.createSplitJsonEditorInput(3 /* ConfigurationTarget.USER_LOCAL */, resource), options };
                        }
                        // Single Folder Workspace Settings File
                        const state = this.workspaceService.getWorkbenchState();
                        if (state === 2 /* WorkbenchState.FOLDER */) {
                            const folders = this.workspaceService.getWorkspace().folders;
                            if ((0, resources_1.isEqual)(resource, folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                                return { editor: this.preferencesService.createSplitJsonEditorInput(5 /* ConfigurationTarget.WORKSPACE */, resource), options };
                            }
                        }
                        // Multi Folder Workspace Settings File
                        else if (state === 3 /* WorkbenchState.WORKSPACE */) {
                            const folders = this.workspaceService.getWorkspace().folders;
                            for (const folder of folders) {
                                if ((0, resources_1.isEqual)(resource, folder.toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                                    return { editor: this.preferencesService.createSplitJsonEditorInput(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, resource), options };
                                }
                            }
                        }
                        return { editor: this.textEditorService.createTextEditor({ resource }), options };
                    }
                });
            }
        }
        start() {
            this.textModelResolverService.registerTextModelContentProvider('vscode', {
                provideTextContent: async (uri) => {
                    if (uri.scheme !== 'vscode') {
                        return null;
                    }
                    if (uri.authority === 'schemas') {
                        return this.getSchemaModel(uri);
                    }
                    return this.preferencesService.resolveModel(uri);
                }
            });
        }
        getSchemaModel(uri) {
            let schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()] ?? {} /* Use empty schema if not yet registered */;
            const modelContent = JSON.stringify(schema);
            const languageSelection = this.languageService.createById('jsonc');
            const model = this.modelService.createModel(modelContent, languageSelection, uri);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(schemaRegistry.onDidChangeSchema(schemaUri => {
                if (schemaUri === uri.toString()) {
                    schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
                    model.setValue(JSON.stringify(schema));
                }
            }));
            disposables.add(model.onWillDispose(() => disposables.dispose()));
            return model;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.editorOpeningListener);
            (0, lifecycle_1.dispose)(this.settingsListener);
        }
    };
    exports.PreferencesContribution = PreferencesContribution;
    exports.PreferencesContribution = PreferencesContribution = __decorate([
        __param(0, model_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, language_1.ILanguageService),
        __param(4, userDataProfile_1.IUserDataProfileService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, editorResolverService_1.IEditorResolverService),
        __param(8, textEditorService_1.ITextEditorService)
    ], PreferencesContribution);
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    registry.registerConfiguration({
        ...configuration_2.workbenchConfigurationNodeBase,
        'properties': {
            'workbench.settings.enableNaturalLanguageSearch': {
                'type': 'boolean',
                'description': nls.localize('enableNaturalLanguageSettingsSearch', "Controls whether to enable the natural language search mode for settings. The natural language search is provided by a Microsoft online service."),
                'default': true,
                'scope': 3 /* ConfigurationScope.WINDOW */,
                'tags': ['usesOnlineServices']
            },
            'workbench.settings.settingsSearchTocBehavior': {
                'type': 'string',
                'enum': ['hide', 'filter'],
                'enumDescriptions': [
                    nls.localize('settingsSearchTocBehavior.hide', "Hide the Table of Contents while searching."),
                    nls.localize('settingsSearchTocBehavior.filter', "Filter the Table of Contents to just categories that have matching settings. Clicking on a category will filter the results to that category."),
                ],
                'description': nls.localize('settingsSearchTocBehavior', "Controls the behavior of the Settings editor Table of Contents while searching. If this setting is being changed in the Settings editor, the setting will take effect after the search query is modified."),
                'default': 'filter',
                'scope': 3 /* ConfigurationScope.WINDOW */
            },
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2NvbW1vbi9wcmVmZXJlbmNlc0NvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLE1BQU0sY0FBYyxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFxRCx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUV0SSxJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtpQkFFbkIsT0FBRSxHQUFHLCtCQUErQixBQUFsQyxDQUFtQztRQUtyRCxZQUNpQyxZQUEyQixFQUN2Qix3QkFBMkMsRUFDekMsa0JBQXVDLEVBQzFDLGVBQWlDLEVBQzFCLHNCQUErQyxFQUM5QyxnQkFBMEMsRUFDN0Msb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNqRCxpQkFBcUM7WUFSMUMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDdkIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFtQjtZQUN6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzFDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUMxQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzlDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMEI7WUFDN0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMxQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ2pELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFFMUUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUUsSUFBSSxDQUFD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