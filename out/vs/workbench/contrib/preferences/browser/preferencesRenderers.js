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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/codeAction/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/registry/common/platform", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/codeeditor", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, dom_1, actions_1, async_1, event_1, lifecycle_1, map_1, resources_1, themables_1, position_1, range_1, textModel_1, languageFeatures_1, types_1, nls, configuration_1, configurationRegistry_1, contextView_1, instantiation_1, markers_1, platform_1, uriIdentity_1, userDataProfile_1, workspace_1, workspaceTrust_1, codeeditor_1, preferencesIcons_1, preferencesWidgets_1, configuration_2, environmentService_1, preferences_1, preferencesModels_1, userDataProfile_2) {
    "use strict";
    var WorkspaceConfigurationRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceSettingsRenderer = exports.UserSettingsRenderer = void 0;
    let UserSettingsRenderer = class UserSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.preferencesModel = preferencesModel;
            this.preferencesService = preferencesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelChangeDelayer = new async_1.Delayer(200);
            this.settingHighlighter = this._register(instantiationService.createInstance(SettingHighlighter, editor));
            this.editSettingActionRenderer = this._register(this.instantiationService.createInstance(EditSettingRenderer, this.editor, this.preferencesModel, this.settingHighlighter));
            this._register(this.editSettingActionRenderer.onUpdateSetting(({ key, value, source }) => this.updatePreference(key, value, source)));
            this._register(this.editor.getModel().onDidChangeContent(() => this.modelChangeDelayer.trigger(() => this.onModelChanged())));
            this.unsupportedSettingsRenderer = this._register(instantiationService.createInstance(UnsupportedSettingsRenderer, editor, preferencesModel));
        }
        render() {
            this.editSettingActionRenderer.render(this.preferencesModel.settingsGroups, this.associatedPreferencesModel);
            this.unsupportedSettingsRenderer.render();
        }
        updatePreference(key, value, source) {
            const overrideIdentifiers = source.overrideOf ? (0, configurationRegistry_1.overrideIdentifiersFromKey)(source.overrideOf.key) : null;
            const resource = this.preferencesModel.uri;
            this.configurationService.updateValue(key, value, { overrideIdentifiers, resource }, this.preferencesModel.configurationTarget)
                .then(() => this.onSettingUpdated(source));
        }
        onModelChanged() {
            if (!this.editor.hasModel()) {
                // model could have been disposed during the delay
                return;
            }
            this.render();
        }
        onSettingUpdated(setting) {
            this.editor.focus();
            setting = this.getSetting(setting);
            if (setting) {
                // TODO:@sandy Selection range should be template range
                this.editor.setSelection(setting.valueRange);
                this.settingHighlighter.highlight(setting, true);
            }
        }
        getSetting(setting) {
            const { key, overrideOf } = setting;
            if (overrideOf) {
                const setting = this.getSetting(overrideOf);
                for (const override of setting.overrides) {
                    if (override.key === key) {
                        return override;
                    }
                }
                return undefined;
            }
            return this.preferencesModel.getPreference(key);
        }
        focusPreference(setting) {
            const s = this.getSetting(setting);
            if (s) {
                this.settingHighlighter.highlight(s, true);
                this.editor.setPosition({ lineNumber: s.keyRange.startLineNumber, column: s.keyRange.startColumn });
            }
            else {
                this.settingHighlighter.clear(true);
            }
        }
        clearFocus(setting) {
            this.settingHighlighter.clear(true);
        }
        editPreference(setting) {
            const editableSetting = this.getSetting(setting);
            return !!(editableSetting && this.editSettingActionRenderer.activateOnSetting(editableSetting));
        }
    };
    exports.UserSettingsRenderer = UserSettingsRenderer;
    exports.UserSettingsRenderer = UserSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], UserSettingsRenderer);
    let WorkspaceSettingsRenderer = class WorkspaceSettingsRenderer extends UserSettingsRenderer {
        constructor(editor, preferencesModel, preferencesService, configurationService, instantiationService) {
            super(editor, preferencesModel, preferencesService, configurationService, instantiationService);
            this.workspaceConfigurationRenderer = this._register(instantiationService.createInstance(WorkspaceConfigurationRenderer, editor, preferencesModel));
        }
        render() {
            super.render();
            this.workspaceConfigurationRenderer.render();
        }
    };
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer;
    exports.WorkspaceSettingsRenderer = WorkspaceSettingsRenderer = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService)
    ], WorkspaceSettingsRenderer);
    let EditSettingRenderer = class EditSettingRenderer extends lifecycle_1.Disposable {
        constructor(editor, primarySettingsModel, settingHighlighter, configurationService, instantiationService, contextMenuService) {
            super();
            this.editor = editor;
            this.primarySettingsModel = primarySettingsModel;
            this.settingHighlighter = settingHighlighter;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.settingsGroups = [];
            this._onUpdateSetting = new event_1.Emitter();
            this.onUpdateSetting = this._onUpdateSetting.event;
            this.editPreferenceWidgetForCursorPosition = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.editPreferenceWidgetForMouseMove = this._register(this.instantiationService.createInstance(preferencesWidgets_1.EditPreferenceWidget, editor));
            this.toggleEditPreferencesForMouseMoveDelayer = new async_1.Delayer(75);
            this._register(this.editPreferenceWidgetForCursorPosition.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForCursorPosition, e)));
            this._register(this.editPreferenceWidgetForMouseMove.onClick(e => this.onEditSettingClicked(this.editPreferenceWidgetForMouseMove, e)));
            this._register(this.editor.onDidChangeCursorPosition(positionChangeEvent => this.onPositionChanged(positionChangeEvent)));
            this._register(this.editor.onMouseMove(mouseMoveEvent => this.onMouseMoved(mouseMoveEvent)));
            this._register(this.editor.onDidChangeConfiguration(() => this.onConfigurationChanged()));
        }
        render(settingsGroups, associatedPreferencesModel) {
            this.editPreferenceWidgetForCursorPosition.hide();
            this.editPreferenceWidgetForMouseMove.hide();
            this.settingsGroups = settingsGroups;
            this.associatedPreferencesModel = associatedPreferencesModel;
            const settings = this.getSettings(this.editor.getPosition().lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
        }
        isDefaultSettings() {
            return this.primarySettingsModel instanceof preferencesModels_1.DefaultSettingsEditorModel;
        }
        onConfigurationChanged() {
            if (!this.editor.getOption(57 /* EditorOption.glyphMargin */)) {
                this.editPreferenceWidgetForCursorPosition.hide();
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        onPositionChanged(positionChangeEvent) {
            this.editPreferenceWidgetForMouseMove.hide();
            const settings = this.getSettings(positionChangeEvent.position.lineNumber);
            if (settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForCursorPosition, settings);
            }
            else {
                this.editPreferenceWidgetForCursorPosition.hide();
            }
        }
        onMouseMoved(mouseMoveEvent) {
            const editPreferenceWidget = this.getEditPreferenceWidgetUnderMouse(mouseMoveEvent);
            if (editPreferenceWidget) {
                this.onMouseOver(editPreferenceWidget);
                return;
            }
            this.settingHighlighter.clear();
            this.toggleEditPreferencesForMouseMoveDelayer.trigger(() => this.toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent));
        }
        getEditPreferenceWidgetUnderMouse(mouseMoveEvent) {
            if (mouseMoveEvent.target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                const line = mouseMoveEvent.target.position.lineNumber;
                if (this.editPreferenceWidgetForMouseMove.getLine() === line && this.editPreferenceWidgetForMouseMove.isVisible()) {
                    return this.editPreferenceWidgetForMouseMove;
                }
                if (this.editPreferenceWidgetForCursorPosition.getLine() === line && this.editPreferenceWidgetForCursorPosition.isVisible()) {
                    return this.editPreferenceWidgetForCursorPosition;
                }
            }
            return undefined;
        }
        toggleEditPreferenceWidgetForMouseMove(mouseMoveEvent) {
            const settings = mouseMoveEvent.target.position ? this.getSettings(mouseMoveEvent.target.position.lineNumber) : null;
            if (settings && settings.length) {
                this.showEditPreferencesWidget(this.editPreferenceWidgetForMouseMove, settings);
            }
            else {
                this.editPreferenceWidgetForMouseMove.hide();
            }
        }
        showEditPreferencesWidget(editPreferencesWidget, settings) {
            const line = settings[0].valueRange.startLineNumber;
            if (this.editor.getOption(57 /* EditorOption.glyphMargin */) && this.marginFreeFromOtherDecorations(line)) {
                editPreferencesWidget.show(line, nls.localize('editTtile', "Edit"), settings);
                const editPreferenceWidgetToHide = editPreferencesWidget === this.editPreferenceWidgetForCursorPosition ? this.editPreferenceWidgetForMouseMove : this.editPreferenceWidgetForCursorPosition;
                editPreferenceWidgetToHide.hide();
            }
        }
        marginFreeFromOtherDecorations(line) {
            const decorations = this.editor.getLineDecorations(line);
            if (decorations) {
                for (const { options } of decorations) {
                    if (options.glyphMarginClassName && options.glyphMarginClassName.indexOf(themables_1.ThemeIcon.asClassName(preferencesIcons_1.settingsEditIcon)) === -1) {
                        return false;
                    }
                }
            }
            return true;
        }
        getSettings(lineNumber) {
            const configurationMap = this.getConfigurationsMap();
            return this.getSettingsAtLineNumber(lineNumber).filter(setting => {
                const configurationNode = configurationMap[setting.key];
                if (configurationNode) {
                    if (configurationNode.policy && this.configurationService.inspect(setting.key).policyValue !== undefined) {
                        return false;
                    }
                    if (this.isDefaultSettings()) {
                        if (setting.key === 'launch') {
                            // Do not show because of https://github.com/microsoft/vscode/issues/32593
                            return false;
                        }
                        return true;
                    }
                    if (configurationNode.type === 'boolean' || configurationNode.enum) {
                        if (this.primarySettingsModel.configurationTarget !== 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                            return true;
                        }
                        if (configurationNode.scope === 4 /* ConfigurationScope.RESOURCE */ || configurationNode.scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                            return true;
                        }
                    }
                }
                return false;
            });
        }
        getSettingsAtLineNumber(lineNumber) {
            // index of setting, across all groups/sections
            let index = 0;
            const settings = [];
            for (const group of this.settingsGroups) {
                if (group.range.startLineNumber > lineNumber) {
                    break;
                }
                if (lineNumber >= group.range.startLineNumber && lineNumber <= group.range.endLineNumber) {
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            if (setting.range.startLineNumber > lineNumber) {
                                break;
                            }
                            if (lineNumber >= setting.range.startLineNumber && lineNumber <= setting.range.endLineNumber) {
                                if (!this.isDefaultSettings() && setting.overrides.length) {
                                    // Only one level because override settings cannot have override settings
                                    for (const overrideSetting of setting.overrides) {
                                        if (lineNumber >= overrideSetting.range.startLineNumber && lineNumber <= overrideSetting.range.endLineNumber) {
                                            settings.push({ ...overrideSetting, index, groupId: group.id });
                                        }
                                    }
                                }
                                else {
                                    settings.push({ ...setting, index, groupId: group.id });
                                }
                            }
                            index++;
                        }
                    }
                }
            }
            return settings;
        }
        onMouseOver(editPreferenceWidget) {
            this.settingHighlighter.highlight(editPreferenceWidget.preferences[0]);
        }
        onEditSettingClicked(editPreferenceWidget, e) {
            dom_1.EventHelper.stop(e.event, true);
            const actions = this.getSettings(editPreferenceWidget.getLine()).length === 1 ? this.getActions(editPreferenceWidget.preferences[0], this.getConfigurationsMap()[editPreferenceWidget.preferences[0].key])
                : editPreferenceWidget.preferences.map(setting => new actions_1.SubmenuAction(`preferences.submenu.${setting.key}`, setting.key, this.getActions(setting, this.getConfigurationsMap()[setting.key])));
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.event,
                getActions: () => actions
            });
        }
        activateOnSetting(setting) {
            const startLine = setting.keyRange.startLineNumber;
            const settings = this.getSettings(startLine);
            if (!settings.length) {
                return false;
            }
            this.editPreferenceWidgetForMouseMove.show(startLine, '', settings);
            const actions = this.getActions(this.editPreferenceWidgetForMouseMove.preferences[0], this.getConfigurationsMap()[this.editPreferenceWidgetForMouseMove.preferences[0].key]);
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.toAbsoluteCoords(new position_1.Position(startLine, 1)),
                getActions: () => actions
            });
            return true;
        }
        toAbsoluteCoords(position) {
            const positionCoords = this.editor.getScrolledVisiblePosition(position);
            const editorCoords = (0, dom_1.getDomNodePagePosition)(this.editor.getDomNode());
            const x = editorCoords.left + positionCoords.left;
            const y = editorCoords.top + positionCoords.top + positionCoords.height;
            return { x, y: y + 10 };
        }
        getConfigurationsMap() {
            return platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        }
        getActions(setting, jsonSchema) {
            if (jsonSchema.type === 'boolean') {
                return [{
                        id: 'truthyValue',
                        label: 'true',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, true, setting)
                    }, {
                        id: 'falsyValue',
                        label: 'false',
                        enabled: true,
                        run: () => this.updateSetting(setting.key, false, setting)
                    }];
            }
            if (jsonSchema.enum) {
                return jsonSchema.enum.map(value => {
                    return {
                        id: value,
                        label: JSON.stringify(value),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, value, setting)
                    };
                });
            }
            return this.getDefaultActions(setting);
        }
        getDefaultActions(setting) {
            if (this.isDefaultSettings()) {
                const settingInOtherModel = this.associatedPreferencesModel.getPreference(setting.key);
                return [{
                        id: 'setDefaultValue',
                        label: settingInOtherModel ? nls.localize('replaceDefaultValue', "Replace in Settings") : nls.localize('copyDefaultValue', "Copy to Settings"),
                        enabled: true,
                        run: () => this.updateSetting(setting.key, setting.value, setting)
                    }];
            }
            return [];
        }
        updateSetting(key, value, source) {
            this._onUpdateSetting.fire({ key, value, source });
        }
    };
    EditSettingRenderer = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextView_1.IContextMenuService)
    ], EditSettingRenderer);
    let SettingHighlighter = class SettingHighlighter extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.fixedHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
            this.volatileHighlighter = this._register(instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
        }
        highlight(setting, fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            this.fixedHighlighter.removeHighlightRange();
            const highlighter = fix ? this.fixedHighlighter : this.volatileHighlighter;
            highlighter.highlightRange({
                range: setting.valueRange,
                resource: this.editor.getModel().uri
            }, this.editor);
            this.editor.revealLineInCenterIfOutsideViewport(setting.valueRange.startLineNumber, 0 /* editorCommon.ScrollType.Smooth */);
        }
        clear(fix = false) {
            this.volatileHighlighter.removeHighlightRange();
            if (fix) {
                this.fixedHighlighter.removeHighlightRange();
            }
        }
    };
    SettingHighlighter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], SettingHighlighter);
    let UnsupportedSettingsRenderer = class UnsupportedSettingsRenderer extends lifecycle_1.Disposable {
        constructor(editor, settingsEditorModel, markerService, environmentService, configurationService, workspaceTrustManagementService, uriIdentityService, languageFeaturesService, userDataProfileService, userDataProfilesService) {
            super();
            this.editor = editor;
            this.settingsEditorModel = settingsEditorModel;
            this.markerService = markerService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.uriIdentityService = uriIdentityService;
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.renderingDelayer = new async_1.Delayer(200);
            this.codeActions = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            this._register(this.editor.getModel().onDidChangeContent(() => this.delayedRender()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.source === 7 /* ConfigurationTarget.DEFAULT */)(() => this.delayedRender()));
            this._register(languageFeaturesService.codeActionProvider.register({ pattern: settingsEditorModel.uri.path }, this));
        }
        delayedRender() {
            this.renderingDelayer.trigger(() => this.render());
        }
        render() {
            this.codeActions.clear();
            const markerData = this.generateMarkerData();
            if (markerData.length) {
                this.markerService.changeOne('UnsupportedSettingsRenderer', this.settingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            }
        }
        async provideCodeActions(model, range, context, token) {
            const actions = [];
            const codeActionsByRange = this.codeActions.get(model.uri);
            if (codeActionsByRange) {
                for (const [codeActionsRange, codeActions] of codeActionsByRange) {
                    if (codeActionsRange.containsRange(range)) {
                        actions.push(...codeActions);
                    }
                }
            }
            return {
                actions,
                dispose: () => { }
            };
        }
        generateMarkerData() {
            const markerData = [];
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const settingsGroup of this.settingsEditorModel.settingsGroups) {
                for (const section of settingsGroup.sections) {
                    for (const setting of section.settings) {
                        if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(setting.key)) {
                            if (setting.overrides) {
                                this.handleOverrides(setting.overrides, configurationRegistry, markerData);
                            }
                            continue;
                        }
                        const configuration = configurationRegistry[setting.key];
                        if (configuration) {
                            if (this.handlePolicyConfiguration(setting, configuration, markerData)) {
                                continue;
                            }
                            switch (this.settingsEditorModel.configurationTarget) {
                                case 3 /* ConfigurationTarget.USER_LOCAL */:
                                    this.handleLocalUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 4 /* ConfigurationTarget.USER_REMOTE */:
                                    this.handleRemoteUserConfiguration(setting, configuration, markerData);
                                    break;
                                case 5 /* ConfigurationTarget.WORKSPACE */:
                                    this.handleWorkspaceConfiguration(setting, configuration, markerData);
                                    break;
                                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                                    this.handleWorkspaceFolderConfiguration(setting, configuration, markerData);
                                    break;
                            }
                        }
                        else {
                            markerData.push(this.gemerateUnknownConfigurationMarker(setting));
                        }
                    }
                }
            }
            return markerData;
        }
        handlePolicyConfiguration(setting, configuration, markerData) {
            if (!configuration.policy) {
                return false;
            }
            if (this.configurationService.inspect(setting.key).policyValue === undefined) {
                return false;
            }
            if (this.settingsEditorModel.configurationTarget === 7 /* ConfigurationTarget.DEFAULT */) {
                return false;
            }
            markerData.push({
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedPolicySetting', "This setting cannot be applied because it is configured in the system policy.")
            });
            return true;
        }
        handleOverrides(overrides, configurationRegistry, markerData) {
            for (const setting of overrides || []) {
                const configuration = configurationRegistry[setting.key];
                if (configuration) {
                    if (configuration.scope !== 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                        markerData.push({
                            severity: markers_1.MarkerSeverity.Hint,
                            tags: [1 /* MarkerTag.Unnecessary */],
                            ...setting.range,
                            message: nls.localize('unsupportLanguageOverrideSetting', "This setting cannot be applied because it is not registered as language override setting.")
                        });
                    }
                }
                else {
                    markerData.push(this.gemerateUnknownConfigurationMarker(setting));
                }
            }
        }
        handleLocalUserConfiguration(setting, configuration, markerData) {
            if (!this.userDataProfileService.currentProfile.isDefault && !this.userDataProfileService.currentProfile.useDefaultFlags?.settings) {
                if ((0, resources_1.isEqual)(this.userDataProfilesService.defaultProfile.settingsResource, this.settingsEditorModel.uri) && !this.configurationService.isSettingAppliedForAllProfiles(setting.key)) {
                    // If we're in the default profile setting file, and the setting cannot be applied in all profiles
                    markerData.push({
                        severity: markers_1.MarkerSeverity.Hint,
                        tags: [1 /* MarkerTag.Unnecessary */],
                        ...setting.range,
                        message: nls.localize('defaultProfileSettingWhileNonDefaultActive', "This setting cannot be applied while a non-default profile is active. It will be applied when the default profile is active.")
                    });
                }
                else if ((0, resources_1.isEqual)(this.userDataProfileService.currentProfile.settingsResource, this.settingsEditorModel.uri)) {
                    if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                        // If we're in a profile setting file, and the setting is application-scoped, fade it out.
                        markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
                    }
                    else if (this.configurationService.isSettingAppliedForAllProfiles(setting.key)) {
                        // If we're in the non-default profile setting file, and the setting can be applied in all profiles, fade it out.
                        markerData.push({
                            severity: markers_1.MarkerSeverity.Hint,
                            tags: [1 /* MarkerTag.Unnecessary */],
                            ...setting.range,
                            message: nls.localize('allProfileSettingWhileInNonDefaultProfileSetting', "This setting cannot be applied because it is configured to be applied in all profiles using setting {0}. Value from the default profile will be used instead.", configuration_2.APPLY_ALL_PROFILES_SETTING)
                        });
                    }
                }
            }
            if (this.environmentService.remoteAuthority && (configuration.scope === 2 /* ConfigurationScope.MACHINE */ || configuration.scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */)) {
                markerData.push({
                    severity: markers_1.MarkerSeverity.Hint,
                    tags: [1 /* MarkerTag.Unnecessary */],
                    ...setting.range,
                    message: nls.localize('unsupportedRemoteMachineSetting', "This setting cannot be applied in this window. It will be applied when you open a local window.")
                });
            }
        }
        handleRemoteUserConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
        }
        handleWorkspaceConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        handleWorkspaceFolderConfiguration(setting, configuration, markerData) {
            if (configuration.scope === 1 /* ConfigurationScope.APPLICATION */) {
                markerData.push(this.generateUnsupportedApplicationSettingMarker(setting));
            }
            if (configuration.scope === 2 /* ConfigurationScope.MACHINE */) {
                markerData.push(this.generateUnsupportedMachineSettingMarker(setting));
            }
            if (configuration.scope === 3 /* ConfigurationScope.WINDOW */) {
                markerData.push({
                    severity: markers_1.MarkerSeverity.Hint,
                    tags: [1 /* MarkerTag.Unnecessary */],
                    ...setting.range,
                    message: nls.localize('unsupportedWindowSetting', "This setting cannot be applied in this workspace. It will be applied when you open the containing workspace folder directly.")
                });
            }
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && configuration.restricted) {
                const marker = this.generateUntrustedSettingMarker(setting);
                markerData.push(marker);
                const codeActions = this.generateUntrustedSettingCodeActions([marker]);
                this.addCodeActions(marker, codeActions);
            }
        }
        generateUnsupportedApplicationSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedApplicationSetting', "This setting has an application scope and can be set only in the user settings file.")
            };
        }
        generateUnsupportedMachineSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unsupportedMachineSetting', "This setting can only be applied in user settings in local window or in remote settings in remote window.")
            };
        }
        generateUntrustedSettingMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Warning,
                ...setting.range,
                message: nls.localize('untrustedSetting', "This setting can only be applied in a trusted workspace.")
            };
        }
        gemerateUnknownConfigurationMarker(setting) {
            return {
                severity: markers_1.MarkerSeverity.Hint,
                tags: [1 /* MarkerTag.Unnecessary */],
                ...setting.range,
                message: nls.localize('unknown configuration setting', "Unknown Configuration Setting")
            };
        }
        generateUntrustedSettingCodeActions(diagnostics) {
            return [{
                    title: nls.localize('manage workspace trust', "Manage Workspace Trust"),
                    command: {
                        id: 'workbench.trust.manage',
                        title: nls.localize('manage workspace trust', "Manage Workspace Trust")
                    },
                    diagnostics,
                    kind: types_1.CodeActionKind.QuickFix.value
                }];
        }
        addCodeActions(range, codeActions) {
            let actions = this.codeActions.get(this.settingsEditorModel.uri);
            if (!actions) {
                actions = [];
                this.codeActions.set(this.settingsEditorModel.uri, actions);
            }
            actions.push([range_1.Range.lift(range), codeActions]);
        }
        dispose() {
            this.markerService.remove('UnsupportedSettingsRenderer', [this.settingsEditorModel.uri]);
            this.codeActions.clear();
            super.dispose();
        }
    };
    UnsupportedSettingsRenderer = __decorate([
        __param(2, markers_1.IMarkerService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, configuration_2.IWorkbenchConfigurationService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, languageFeatures_1.ILanguageFeaturesService),
        __param(8, userDataProfile_2.IUserDataProfileService),
        __param(9, userDataProfile_1.IUserDataProfilesService)
    ], UnsupportedSettingsRenderer);
    let WorkspaceConfigurationRenderer = class WorkspaceConfigurationRenderer extends lifecycle_1.Disposable {
        static { WorkspaceConfigurationRenderer_1 = this; }
        static { this.supportedKeys = ['folders', 'tasks', 'launch', 'extensions', 'settings', 'remoteAuthority', 'transient']; }
        constructor(editor, workspaceSettingsEditorModel, workspaceContextService, markerService) {
            super();
            this.editor = editor;
            this.workspaceSettingsEditorModel = workspaceSettingsEditorModel;
            this.workspaceContextService = workspaceContextService;
            this.markerService = markerService;
            this.decorations = this.editor.createDecorationsCollection();
            this.renderingDelayer = new async_1.Delayer(200);
            this._register(this.editor.getModel().onDidChangeContent(() => this.renderingDelayer.trigger(() => this.render())));
        }
        render() {
            const markerData = [];
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && this.workspaceSettingsEditorModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel) {
                const ranges = [];
                for (const settingsGroup of this.workspaceSettingsEditorModel.configurationGroups) {
                    for (const section of settingsGroup.sections) {
                        for (const setting of section.settings) {
                            if (!WorkspaceConfigurationRenderer_1.supportedKeys.includes(setting.key)) {
                                markerData.push({
                                    severity: markers_1.MarkerSeverity.Hint,
                                    tags: [1 /* MarkerTag.Unnecessary */],
                                    ...setting.range,
                                    message: nls.localize('unsupportedProperty', "Unsupported Property")
                                });
                            }
                        }
                    }
                }
                this.decorations.set(ranges.map(range => this.createDecoration(range)));
            }
            if (markerData.length) {
                this.markerService.changeOne('WorkspaceConfigurationRenderer', this.workspaceSettingsEditorModel.uri, markerData);
            }
            else {
                this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            }
        }
        static { this._DIM_CONFIGURATION_ = textModel_1.ModelDecorationOptions.register({
            description: 'dim-configuration',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            inlineClassName: 'dim-configuration'
        }); }
        createDecoration(range) {
            return {
                range,
                options: WorkspaceConfigurationRenderer_1._DIM_CONFIGURATION_
            };
        }
        dispose() {
            this.markerService.remove('WorkspaceConfigurationRenderer', [this.workspaceSettingsEditorModel.uri]);
            this.decorations.clear();
            super.dispose();
        }
    };
    WorkspaceConfigurationRenderer = WorkspaceConfigurationRenderer_1 = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, markers_1.IMarkerService)
    ], WorkspaceConfigurationRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNSZW5kZXJlcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIvcHJlZmVyZW5jZXNSZW5kZXJlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFEekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQVNuRCxZQUFzQixNQUFtQixFQUFXLGdCQUFxQyxFQUNuRSxrQkFBaUQsRUFDL0Msb0JBQTRELEVBQzVELG9CQUFxRDtZQUU1RSxLQUFLLEVBQUUsQ0FBQztZQUxhLFdBQU0sR0FBTixNQUFNLENBQWE7WUFBVyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQXFCO1lBQ3pELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDOUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsRCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBUnJFLHVCQUFrQixHQUFrQixJQUFJLGVBQU8sQ0FBTyxHQUFHLENBQUMsQ0FBQztZQVdsRSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDNUssSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENB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