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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/editor/browser/coreCommands", "vs/editor/browser/editorBrowser", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/textfile/common/textEditorService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, errors_1, event_1, json_1, lifecycle_1, network, uri_1, coreCommands_1, editorBrowser_1, model_1, language_1, resolverService_1, nls, configuration_1, configurationRegistry_1, extensions_1, instantiation_1, keybinding_1, label_1, notification_1, platform_1, workspace_1, editor_1, sideBySideEditorInput_1, textResourceEditorInput_1, jsonEditing_1, editorGroupsService_1, editorService_1, keybindingsEditorInput_1, preferences_1, preferencesEditorInput_1, preferencesModels_1, remoteAgentService_1, textEditorService_1, textfiles_1, types_1, suggestController_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesService = void 0;
    const emptyEditableSettingsContent = '{\n}';
    let PreferencesService = class PreferencesService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, textFileService, configurationService, notificationService, contextService, instantiationService, userDataProfileService, userDataProfilesService, textModelResolverService, keybindingService, modelService, jsonEditingService, languageService, labelService, remoteAgentService, textEditorService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.jsonEditingService = jsonEditingService;
            this.languageService = languageService;
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.textEditorService = textEditorService;
            this._onDispose = this._register(new event_1.Emitter());
            this.defaultKeybindingsResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/keybindings.json' });
            this.defaultSettingsRawResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/defaultSettings.json' });
            // The default keybindings.json updates based on keyboard layouts, so here we make sure
            // if a model has been given out we update it accordingly.
            this._register(keybindingService.onDidUpdateKeybindings(() => {
                const model = modelService.getModel(this.defaultKeybindingsResource);
                if (!model) {
                    // model has not been given out => nothing to do
                    return;
                }
                modelService.updateModel(model, (0, preferencesModels_1.defaultKeybindingsContents)(keybindingService));
            }));
        }
        get userSettingsResource() {
            return this.userDataProfileService.currentProfile.settingsResource;
        }
        get workspaceSettingsResource() {
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return null;
            }
            const workspace = this.contextService.getWorkspace();
            return workspace.configuration || workspace.folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH);
        }
        createSettingsEditor2Input() {
            return new preferencesEditorInput_1.SettingsEditor2Input(this);
        }
        getFolderSettingsResource(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            return folder ? folder.toResource(preferences_1.FOLDER_SETTINGS_PATH) : null;
        }
        resolveModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                // We opened a split json editor in this case,
                // and this half shows the default settings.
                const target = this.getConfigurationTargetFromDefaultSettingsResource(uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel('', languageSelection, uri));
                let defaultSettings;
                this.configurationService.onDidChangeConfiguration(e => {
                    if (e.source === 7 /* ConfigurationTarget.DEFAULT */) {
                        const model = this.modelService.getModel(uri);
                        if (!model) {
                            // model has not been given out => nothing to do
                            return;
                        }
                        defaultSettings = this.getDefaultSettings(target);
                        this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                        defaultSettings._onDidChange.fire();
                    }
                });
                // Check if Default settings is already created and updated in above promise
                if (!defaultSettings) {
                    defaultSettings = this.getDefaultSettings(target);
                    this.modelService.updateModel(model, defaultSettings.getContentWithoutMostCommonlyUsed(true));
                }
                return model;
            }
            if (this.defaultSettingsRawResource.toString() === uri.toString()) {
                const defaultRawSettingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultRawSettingsEditorModel, this.getDefaultSettings(3 /* ConfigurationTarget.USER_LOCAL */));
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultRawSettingsEditorModel.content, languageSelection, uri));
                return model;
            }
            if (this.defaultKeybindingsResource.toString() === uri.toString()) {
                const defaultKeybindingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultKeybindingsEditorModel, uri);
                const languageSelection = this.languageService.createById('jsonc');
                const model = this._register(this.modelService.createModel(defaultKeybindingsEditorModel.content, languageSelection, uri));
                return model;
            }
            return null;
        }
        async createPreferencesEditorModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                return this.createDefaultSettingsEditorModel(uri);
            }
            if (this.userSettingsResource.toString() === uri.toString() || this.userDataProfilesService.defaultProfile.settingsResource.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(3 /* ConfigurationTarget.USER_LOCAL */, uri);
            }
            const workspaceSettingsUri = await this.getEditableSettingsURI(5 /* ConfigurationTarget.WORKSPACE */);
            if (workspaceSettingsUri && workspaceSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(5 /* ConfigurationTarget.WORKSPACE */, workspaceSettingsUri);
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const settingsUri = await this.getEditableSettingsURI(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                if (settingsUri && settingsUri.toString() === uri.toString()) {
                    return this.createEditableSettingsEditorModel(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, uri);
                }
            }
            const remoteEnvironment = await this.remoteAgentService.getEnvironment();
            const remoteSettingsUri = remoteEnvironment ? remoteEnvironment.settingsPath : null;
            if (remoteSettingsUri && remoteSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(4 /* ConfigurationTarget.USER_REMOTE */, uri);
            }
            return null;
        }
        openRawDefaultSettings() {
            return this.editorService.openEditor({ resource: this.defaultSettingsRawResource });
        }
        openRawUserSettings() {
            return this.editorService.openEditor({ resource: this.userSettingsResource });
        }
        shouldOpenJsonByDefault() {
            return this.configurationService.getValue('workbench.settings.editor') === 'json';
        }
        openSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            if (options.query) {
                options.jsonEditor = false;
            }
            return this.open(this.userSettingsResource, options);
        }
        openLanguageSpecificSettings(languageId, options = {}) {
            if (this.shouldOpenJsonByDefault()) {
                options.query = undefined;
                options.revealSetting = { key: `[${languageId}]`, edit: true };
            }
            else {
                options.query = `@lang:${languageId}${options.query ? ` ${options.query}` : ''}`;
            }
            options.target = options.target ?? 3 /* ConfigurationTarget.USER_LOCAL */;
            return this.open(this.userSettingsResource, options);
        }
        open(settingsResource, options) {
            options = {
                ...options,
                jsonEditor: options.jsonEditor ?? this.shouldOpenJsonByDefault()
            };
            return options.jsonEditor ?
                this.openSettingsJson(settingsResource, options) :
                this.openSettings2(options);
        }
        async openSettings2(options) {
            const input = this.createSettingsEditor2Input();
            options = {
                ...options,
                focusSearch: true
            };
            await this.editorService.openEditor(input, (0, preferences_1.validateSettingsEditorOptions)(options), options.openToSide ? editorService_1.SIDE_GROUP : undefined);
            return this.editorGroupService.activeGroup.activeEditorPane;
        }
        openApplicationSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            return this.open(this.userDataProfilesService.defaultProfile.settingsResource, options);
        }
        openUserSettings(options = {}) {
            options = {
                ...options,
                target: 3 /* ConfigurationTarget.USER_LOCAL */,
            };
            return this.open(this.userSettingsResource, options);
        }
        async openRemoteSettings(options = {}) {
            const environment = await this.remoteAgentService.getEnvironment();
            if (environment) {
                options = {
                    ...options,
                    target: 4 /* ConfigurationTarget.USER_REMOTE */,
                };
                this.open(environment.settingsPath, options);
            }
            return undefined;
        }
        openWorkspaceSettings(options = {}) {
            if (!this.workspaceSettingsResource) {
                this.notificationService.info(nls.localize('openFolderFirst', "Open a folder or workspace first to create workspace or folder settings."));
                return Promise.reject(null);
            }
            options = {
                ...options,
                target: 5 /* ConfigurationTarget.WORKSPACE */
            };
            return this.open(this.workspaceSettingsResource, options);
        }
        async openFolderSettings(options = {}) {
            options = {
                ...options,
                target: 6 /* ConfigurationTarget.WORKSPACE_FOLDER */
            };
            if (!options.folderUri) {
                throw new Error(`Missing folder URI`);
            }
            const folderSettingsUri = await this.getEditableSettingsURI(6 /* ConfigurationTarget.WORKSPACE_FOLDER */, options.folderUri);
            if (!folderSettingsUri) {
                throw new Error(`Invalid folder URI - ${options.folderUri.toString()}`);
            }
            return this.open(folderSettingsUri, options);
        }
        async openGlobalKeybindingSettings(textual, options) {
            options = { pinned: true, revealIfOpened: true, ...options };
            if (textual) {
                const emptyContents = '// ' + nls.localize('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + '\n[\n]';
                const editableKeybindings = this.userDataProfileService.currentProfile.keybindingsResource;
                const openDefaultKeybindings = !!this.configurationService.getValue('workbench.settings.openDefaultKeybindings');
                // Create as needed and open in editor
                await this.createIfNotExists(editableKeybindings, emptyContents);
                if (openDefaultKeybindings) {
                    const activeEditorGroup = this.editorGroupService.activeGroup;
                    const sideEditorGroup = this.editorGroupService.addGroup(activeEditorGroup.id, 3 /* GroupDirection.RIGHT */);
                    await Promise.all([
                        this.editorService.openEditor({ resource: this.defaultKeybindingsResource, options: { pinned: true, preserveFocus: true, revealIfOpened: true, override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }, label: nls.localize('defaultKeybindings', "Default Keybindings"), description: '' }),
                        this.editorService.openEditor({ resource: editableKeybindings, options }, sideEditorGroup.id)
                    ]);
                }
                else {
                    await this.editorService.openEditor({ resource: editableKeybindings, options });
                }
            }
            else {
                const editor = (await this.editorService.openEditor(this.instantiationService.createInstance(keybindingsEditorInput_1.KeybindingsEditorInput), { ...options }));
                if (options.query) {
                    editor.search(options.query);
                }
            }
        }
        openDefaultKeybindingsFile() {
            return this.editorService.openEditor({ resource: this.defaultKeybindingsResource, label: nls.localize('defaultKeybindings', "Default Keybindings") });
        }
        async openSettingsJson(resource, options) {
            const group = options?.openToSide ? editorService_1.SIDE_GROUP : undefined;
            const editor = await this.doOpenSettingsJson(resource, options, group);
            if (editor && options?.revealSetting) {
                await this.revealSetting(options.revealSetting.key, !!options.revealSetting.edit, editor, resource);
            }
            return editor;
        }
        async doOpenSettingsJson(resource, options, group) {
            const openSplitJSON = !!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING);
            const openDefaultSettings = !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING);
            if (openSplitJSON || openDefaultSettings) {
                return this.doOpenSplitJSON(resource, options, group);
            }
            const configurationTarget = options?.target ?? 2 /* ConfigurationTarget.USER */;
            const editableSettingsEditorInput = await this.getOrCreateEditableSettingsEditorInput(configurationTarget, resource);
            options = { ...options, pinned: true };
            return await this.editorService.openEditor(editableSettingsEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        async doOpenSplitJSON(resource, options = {}, group) {
            const configurationTarget = options.target ?? 2 /* ConfigurationTarget.USER */;
            await this.createSettingsIfNotExists(configurationTarget, resource);
            const preferencesEditorInput = this.createSplitJsonEditorInput(configurationTarget, resource);
            options = { ...options, pinned: true };
            return this.editorService.openEditor(preferencesEditorInput, (0, preferences_1.validateSettingsEditorOptions)(options), group);
        }
        createSplitJsonEditorInput(configurationTarget, resource) {
            const editableSettingsEditorInput = this.textEditorService.createTextEditor({ resource });
            const defaultPreferencesEditorInput = this.instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, this.getDefaultSettingsResource(configurationTarget), undefined, undefined, undefined, undefined);
            return this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editableSettingsEditorInput.getName(), undefined, defaultPreferencesEditorInput, editableSettingsEditorInput);
        }
        createSettings2EditorModel() {
            return this.instantiationService.createInstance(preferencesModels_1.Settings2EditorModel, this.getDefaultSettings(3 /* ConfigurationTarget.USER_LOCAL */));
        }
        getConfigurationTargetFromDefaultSettingsResource(uri) {
            return this.isDefaultWorkspaceSettingsResource(uri) ?
                5 /* ConfigurationTarget.WORKSPACE */ :
                this.isDefaultFolderSettingsResource(uri) ?
                    6 /* ConfigurationTarget.WORKSPACE_FOLDER */ :
                    3 /* ConfigurationTarget.USER_LOCAL */;
        }
        isDefaultSettingsResource(uri) {
            return this.isDefaultUserSettingsResource(uri) || this.isDefaultWorkspaceSettingsResource(uri) || this.isDefaultFolderSettingsResource(uri);
        }
        isDefaultUserSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?settings\.json$/);
        }
        isDefaultWorkspaceSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?workspaceSettings\.json$/);
        }
        isDefaultFolderSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?resourceSettings\.json$/);
        }
        getDefaultSettingsResource(configurationTarget) {
            switch (configurationTarget) {
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/workspaceSettings.json` });
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/resourceSettings.json` });
            }
            return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/settings.json` });
        }
        async getOrCreateEditableSettingsEditorInput(target, resource) {
            await this.createSettingsIfNotExists(target, resource);
            return this.textEditorService.createTextEditor({ resource });
        }
        async createEditableSettingsEditorModel(configurationTarget, settingsUri) {
            const workspace = this.contextService.getWorkspace();
            if (workspace.configuration && workspace.configuration.toString() === settingsUri.toString()) {
                const reference = await this.textModelResolverService.createModelReference(settingsUri);
                return this.instantiationService.createInstance(preferencesModels_1.WorkspaceConfigurationEditorModel, reference, configurationTarget);
            }
            const reference = await this.textModelResolverService.createModelReference(settingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.SettingsEditorModel, reference, configurationTarget);
        }
        async createDefaultSettingsEditorModel(defaultSettingsUri) {
            const reference = await this.textModelResolverService.createModelReference(defaultSettingsUri);
            const target = this.getConfigurationTargetFromDefaultSettingsResource(defaultSettingsUri);
            return this.instantiationService.createInstance(preferencesModels_1.DefaultSettingsEditorModel, defaultSettingsUri, reference, this.getDefaultSettings(target));
        }
        getDefaultSettings(target) {
            if (target === 5 /* ConfigurationTarget.WORKSPACE */) {
                this._defaultWorkspaceSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
                return this._defaultWorkspaceSettingsContentModel;
            }
            if (target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                this._defaultFolderSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
                return this._defaultFolderSettingsContentModel;
            }
            this._defaultUserSettingsContentModel ??= this._register(new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target));
            return this._defaultUserSettingsContentModel;
        }
        async getEditableSettingsURI(configurationTarget, resource) {
            switch (configurationTarget) {
                case 1 /* ConfigurationTarget.APPLICATION */:
                    return this.userDataProfilesService.defaultProfile.settingsResource;
                case 2 /* ConfigurationTarget.USER */:
                case 3 /* ConfigurationTarget.USER_LOCAL */:
                    return this.userSettingsResource;
                case 4 /* ConfigurationTarget.USER_REMOTE */: {
                    const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                    return remoteEnvironment ? remoteEnvironment.settingsPath : null;
                }
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return this.workspaceSettingsResource;
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    if (resource) {
                        return this.getFolderSettingsResource(resource);
                    }
            }
            return null;
        }
        async createSettingsIfNotExists(target, resource) {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && target === 5 /* ConfigurationTarget.WORKSPACE */) {
                const workspaceConfig = this.contextService.getWorkspace().configuration;
                if (!workspaceConfig) {
                    return;
                }
                const content = await this.textFileService.read(workspaceConfig);
                if (Object.keys((0, json_1.parse)(content.value)).indexOf('settings') === -1) {
                    await this.jsonEditingService.write(resource, [{ path: ['settings'], value: {} }], true);
                }
                return undefined;
            }
            await this.createIfNotExists(resource, emptyEditableSettingsContent);
        }
        async createIfNotExists(resource, contents) {
            try {
                await this.textFileService.read(resource, { acceptTextOnly: true });
            }
            catch (error) {
                if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    try {
                        await this.textFileService.write(resource, contents);
                        return;
                    }
                    catch (error2) {
                        throw new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", this.labelService.getUriLabel(resource, { relative: true }), (0, errors_1.getErrorMessage)(error2)));
                    }
                }
                else {
                    throw error;
                }
            }
        }
        getMostCommonlyUsedSettings() {
            return [
                'files.autoSave',
                'editor.fontSize',
                'editor.fontFamily',
                'editor.tabSize',
                'editor.renderWhitespace',
                'editor.cursorStyle',
                'editor.multiCursorModifier',
                'editor.insertSpaces',
                'editor.wordWrap',
                'files.exclude',
                'files.associations',
                'workbench.editor.enablePreview'
            ];
        }
        async revealSetting(settingKey, edit, editor, settingsResource) {
            const codeEditor = editor ? (0, editorBrowser_1.getCodeEditor)(editor.getControl()) : null;
            if (!codeEditor) {
                return;
            }
            const settingsModel = await this.createPreferencesEditorModel(settingsResource);
            if (!settingsModel) {
                return;
            }
            const position = await this.getPositionToReveal(settingKey, edit, settingsModel, codeEditor);
            if (position) {
                codeEditor.setPosition(position);
                codeEditor.revealPositionNearTop(position);
                codeEditor.focus();
                if (edit) {
                    suggestController_1.SuggestController.get(codeEditor)?.triggerSuggest();
                }
            }
        }
        async getPositionToReveal(settingKey, edit, settingsModel, codeEditor) {
            const model = codeEditor.getModel();
            if (!model) {
                return null;
            }
            const schema = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()[settingKey];
            const isOverrideProperty = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(settingKey);
            if (!schema && !isOverrideProperty) {
                return null;
            }
            let position = null;
            const type = schema?.type ?? 'object' /* Type not defined or is an Override Identifier */;
            let setting = settingsModel.getPreference(settingKey);
            if (!setting && edit) {
                let defaultValue = (type === 'object' || type === 'array') ? this.configurationService.inspect(settingKey).defaultValue : (0, configurationRegistry_1.getDefaultValue)(type);
                defaultValue = defaultValue === undefined && isOverrideProperty ? {} : defaultValue;
                if (defaultValue !== undefined) {
                    const key = settingsModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel ? ['settings', settingKey] : [settingKey];
                    await this.jsonEditingService.write(settingsModel.uri, [{ path: key, value: defaultValue }], false);
                    setting = settingsModel.getPreference(settingKey);
                }
            }
            if (setting) {
                if (edit) {
                    if ((0, types_1.isObject)(setting.value) || Array.isArray(setting.value)) {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.startColumn + 1 };
                        codeEditor.setPosition(position);
                        await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                        position = { lineNumber: position.lineNumber + 1, column: model.getLineMaxColumn(position.lineNumber + 1) };
                        const firstNonWhiteSpaceColumn = model.getLineFirstNonWhitespaceColumn(position.lineNumber);
                        if (firstNonWhiteSpaceColumn) {
                            // Line has some text. Insert another new line.
                            codeEditor.setPosition({ lineNumber: position.lineNumber, column: firstNonWhiteSpaceColumn });
                            await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                            position = { lineNumber: position.lineNumber, column: model.getLineMaxColumn(position.lineNumber) };
                        }
                    }
                    else {
                        position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.endColumn };
                    }
                }
                else {
                    position = { lineNumber: setting.keyRange.startLineNumber, column: setting.keyRange.startColumn };
                }
            }
            return position;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    exports.PreferencesService = PreferencesService;
    exports.PreferencesService = PreferencesService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, userDataProfile_1.IUserDataProfileService),
        __param(8, userDataProfile_2.IUserDataProfilesService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, model_1.IModelService),
        __param(12, jsonEditing_1.IJSONEditingService),
        __param(13, language_1.ILanguageService),
        __param(14, label_1.ILabelService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, textEditorService_1.ITextEditorService)
    ], PreferencesService);
    (0, extensions_1.registerSingleton)(preferences_1.IPreferencesService, PreferencesService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJlZmVyZW5jZXMvYnJvd3Nlci9wcmVmZXJlbmNlc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkNoRyxNQUFNLDRCQUE0QixHQUFHLE1BQU0sQ0FBQztJQUVyQyxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBVWpELFlBQ2lCLGFBQThDLEVBQ3hDLGtCQUF5RCxFQUM3RCxlQUFrRCxFQUM3QyxvQkFBNEQsRUFDN0QsbUJBQTBELEVBQ3RELGNBQXlELEVBQzVELG9CQUE0RCxFQUMxRCxzQkFBZ0UsRUFDL0QsdUJBQWtFLEVBQ3pFLHdCQUE0RCxFQUMzRCxpQkFBcUMsRUFDMUMsWUFBNEMsRUFDdEMsa0JBQXdELEVBQzNELGVBQWtELEVBQ3JELFlBQTRDLEVBQ3RDLGtCQUF3RCxFQUN6RCxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFsQnlCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXNCO1lBQzVDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUM1Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzVDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDekMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUM5Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ3hELDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBbUI7WUFFL0MsaUJBQVksR0FBWixZQUFZLENB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