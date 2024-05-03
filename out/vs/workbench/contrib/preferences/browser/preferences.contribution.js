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
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/types", "vs/editor/browser/editorExtensions", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/preferences/browser/keybindingsEditor", "vs/workbench/contrib/preferences/browser/preferencesActions", "vs/workbench/contrib/preferences/browser/preferencesEditor", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/settingsEditor2", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/preferences/common/preferencesContribution", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/preferences/browser/keybindingsEditorInput", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfile", "vs/editor/browser/editorBrowser", "vs/css!./media/preferences"], function (require, exports, keyCodes_1, lifecycle_1, network_1, types_1, editorExtensions_1, suggest_1, nls, actions_1, commands_1, contextkey_1, contextkeys_1, descriptors_1, instantiation_1, keybindingsRegistry_1, label_1, platform_1, workspace_1, workspaceCommands_1, editor_1, contributions_1, editor_2, contextkeys_2, files_1, keybindingsEditor_1, preferencesActions_1, preferencesEditor_1, preferencesIcons_1, settingsEditor2_1, preferences_1, preferencesContribution_1, editorService_1, environmentService_1, extensions_1, keybindingsEditorInput_1, preferences_2, preferencesEditorInput_1, userDataProfile_1, userDataProfile_2, editorBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SETTINGS_EDITOR_COMMAND_SEARCH = 'settings.action.search';
    const SETTINGS_EDITOR_COMMAND_FOCUS_FILE = 'settings.action.focusSettingsFile';
    const SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH = 'settings.action.focusSettingsFromSearch';
    const SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST = 'settings.action.focusSettingsList';
    const SETTINGS_EDITOR_COMMAND_FOCUS_TOC = 'settings.action.focusTOC';
    const SETTINGS_EDITOR_COMMAND_FOCUS_CONTROL = 'settings.action.focusSettingControl';
    const SETTINGS_EDITOR_COMMAND_FOCUS_UP = 'settings.action.focusLevelUp';
    const SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON = 'settings.switchToJSON';
    const SETTINGS_EDITOR_COMMAND_FILTER_ONLINE = 'settings.filterByOnline';
    const SETTINGS_EDITOR_COMMAND_FILTER_UNTRUSTED = 'settings.filterUntrusted';
    const SETTINGS_COMMAND_OPEN_SETTINGS = 'workbench.action.openSettings';
    const SETTINGS_COMMAND_FILTER_TELEMETRY = 'settings.filterByTelemetry';
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(settingsEditor2_1.SettingsEditor2, settingsEditor2_1.SettingsEditor2.ID, nls.localize('settingsEditor2', "Settings Editor 2")), [
        new descriptors_1.SyncDescriptor(preferencesEditorInput_1.SettingsEditor2Input)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(keybindingsEditor_1.KeybindingsEditor, keybindingsEditor_1.KeybindingsEditor.ID, nls.localize('keybindingsEditor', "Keybindings Editor")), [
        new descriptors_1.SyncDescriptor(keybindingsEditorInput_1.KeybindingsEditorInput)
    ]);
    class KeybindingsEditorInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(keybindingsEditorInput_1.KeybindingsEditorInput);
        }
    }
    class SettingsEditor2InputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(input) {
            return '';
        }
        deserialize(instantiationService) {
            return instantiationService.createInstance(preferencesEditorInput_1.SettingsEditor2Input);
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(keybindingsEditorInput_1.KeybindingsEditorInput.ID, KeybindingsEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(preferencesEditorInput_1.SettingsEditor2Input.ID, SettingsEditor2InputSerializer);
    const OPEN_USER_SETTINGS_UI_TITLE = nls.localize2('openSettings2', "Open Settings (UI)");
    const OPEN_USER_SETTINGS_JSON_TITLE = nls.localize2('openUserSettingsJson', "Open User Settings (JSON)");
    const OPEN_APPLICATION_SETTINGS_JSON_TITLE = nls.localize2('openApplicationSettingsJson', "Open Application Settings (JSON)");
    const category = nls.localize2('preferences', "Preferences");
    function sanitizeBoolean(arg) {
        return (0, types_1.isBoolean)(arg) ? arg : undefined;
    }
    function sanitizeString(arg) {
        return (0, types_1.isString)(arg) ? arg : undefined;
    }
    function sanitizeOpenSettingsArgs(args) {
        if (!(0, types_1.isObject)(args)) {
            args = {};
        }
        let sanitizedObject = {
            focusSearch: sanitizeBoolean(args?.focusSearch),
            openToSide: sanitizeBoolean(args?.openToSide),
            query: sanitizeString(args?.query)
        };
        if ((0, types_1.isString)(args?.revealSetting?.key)) {
            sanitizedObject = {
                ...sanitizedObject,
                revealSetting: {
                    key: args.revealSetting.key,
                    edit: sanitizeBoolean(args.revealSetting?.edit)
                }
            };
        }
        return sanitizedObject;
    }
    let PreferencesActionsContribution = class PreferencesActionsContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.preferencesActions'; }
        constructor(environmentService, userDataProfileService, preferencesService, workspaceContextService, labelService, extensionService, userDataProfilesService) {
            super();
            this.environmentService = environmentService;
            this.userDataProfileService = userDataProfileService;
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.labelService = labelService;
            this.extensionService = extensionService;
            this.userDataProfilesService = userDataProfilesService;
            this.registerSettingsActions();
            this.registerKeybindingsActions();
            this.updatePreferencesEditorMenuItem();
            this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.updatePreferencesEditorMenuItem()));
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.updatePreferencesEditorMenuItemForWorkspaceFolders()));
        }
        registerSettingsActions() {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_COMMAND_OPEN_SETTINGS,
                        title: {
                            ...nls.localize2('settings', "Settings"),
                            mnemonicTitle: nls.localize({ key: 'miOpenSettings', comment: ['&& denotes a mnemonic'] }, "&&Settings"),
                        },
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null,
                            primary: 2048 /* KeyMod.CtrlCmd */ | 87 /* KeyCode.Comma */,
                        },
                        menu: [{
                                id: actions_1.MenuId.GlobalActivity,
                                group: '2_configuration',
                                order: 2
                            }, {
                                id: actions_1.MenuId.MenubarPreferencesMenu,
                                group: '2_configuration',
                                order: 2
                            }],
                    });
                }
                run(accessor, args) {
                    // args takes a string for backcompat
                    const opts = typeof args === 'string' ? { query: args } : sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings(opts);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openSettings2',
                        title: nls.localize2('openSettings2', "Open Settings (UI)"),
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, ...args });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openSettingsJson',
                        title: OPEN_USER_SETTINGS_JSON_TITLE,
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: true, ...args });
                }
            }));
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openApplicationSettingsJson',
                        title: OPEN_APPLICATION_SETTINGS_JSON_TITLE,
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.notEquals(userDataProfile_1.CURRENT_PROFILE_CONTEXT.key, that.userDataProfilesService.defaultProfile.id)
                        }
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openApplicationSettings({ jsonEditor: true, ...args });
                }
            }));
            // Opens the User tab of the Settings editor
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openGlobalSettings',
                        title: nls.localize2('openGlobalSettings', "Open User Settings"),
                        category,
                        f1: true,
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openUserSettings(args);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openRawDefaultSettings',
                        title: nls.localize2('openRawDefaultSettings', "Open Default Settings (JSON)"),
                        category,
                        f1: true,
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openRawDefaultSettings();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferencesActions_1.ConfigureLanguageBasedSettingsAction.ID,
                        title: preferencesActions_1.ConfigureLanguageBasedSettingsAction.LABEL,
                        category,
                        f1: true,
                    });
                }
                run(accessor) {
                    return accessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.ConfigureLanguageBasedSettingsAction, preferencesActions_1.ConfigureLanguageBasedSettingsAction.ID, preferencesActions_1.ConfigureLanguageBasedSettingsAction.LABEL.value).run();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openWorkspaceSettings',
                        title: nls.localize2('openWorkspaceSettings', "Open Workspace Settings"),
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.notEqualsTo('empty')
                        }
                    });
                }
                run(accessor, args) {
                    // Match the behaviour of workbench.action.openSettings
                    args = typeof args === 'string' ? { query: args } : sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings(args);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openAccessibilitySettings',
                        title: nls.localize2('openAccessibilitySettings', "Open Accessibility Settings"),
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.notEqualsTo('empty')
                        }
                    });
                }
                async run(accessor) {
                    await accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:accessibility' });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openWorkspaceSettingsFile',
                        title: nls.localize2('openWorkspaceSettingsFile', "Open Workspace Settings (JSON)"),
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.notEqualsTo('empty')
                        }
                    });
                }
                run(accessor, args) {
                    args = sanitizeOpenSettingsArgs(args);
                    return accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings({ jsonEditor: true, ...args });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openFolderSettings',
                        title: nls.localize2('openFolderSettings', "Open Folder Settings"),
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.isEqualTo('workspace')
                        }
                    });
                }
                async run(accessor, args) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const preferencesService = accessor.get(preferences_2.IPreferencesService);
                    const workspaceFolder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                    if (workspaceFolder) {
                        args = sanitizeOpenSettingsArgs(args);
                        await preferencesService.openFolderSettings({ folderUri: workspaceFolder.uri, ...args });
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openFolderSettingsFile',
                        title: nls.localize2('openFolderSettingsFile', "Open Folder Settings (JSON)"),
                        category,
                        menu: {
                            id: actions_1.MenuId.CommandPalette,
                            when: contextkeys_2.WorkbenchStateContext.isEqualTo('workspace')
                        }
                    });
                }
                async run(accessor, args) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const preferencesService = accessor.get(preferences_2.IPreferencesService);
                    const workspaceFolder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                    if (workspaceFolder) {
                        args = sanitizeOpenSettingsArgs(args);
                        await preferencesService.openFolderSettings({ folderUri: workspaceFolder.uri, jsonEditor: true, ...args });
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: '_workbench.action.openFolderSettings',
                        title: nls.localize('openFolderSettings', "Open Folder Settings"),
                        category,
                        menu: {
                            id: actions_1.MenuId.ExplorerContext,
                            group: '2_workspace',
                            order: 20,
                            when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext)
                        }
                    });
                }
                run(accessor, resource) {
                    return accessor.get(preferences_2.IPreferencesService).openFolderSettings({ folderUri: resource });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FILTER_ONLINE,
                        title: nls.localize({ key: 'miOpenOnlineSettings', comment: ['&& denotes a mnemonic'] }, "&&Online Services Settings"),
                        menu: {
                            id: actions_1.MenuId.MenubarPreferencesMenu,
                            group: '3_settings',
                            order: 1,
                        }
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        editorPane.focusSearch(`@tag:usesOnlineServices`);
                    }
                    else {
                        accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:usesOnlineServices' });
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FILTER_UNTRUSTED,
                        title: nls.localize2('filterUntrusted', "Show untrusted workspace settings"),
                    });
                }
                run(accessor) {
                    accessor.get(preferences_2.IPreferencesService).openWorkspaceSettings({ jsonEditor: false, query: `@tag:${preferences_1.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG}` });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_COMMAND_FILTER_TELEMETRY,
                        title: nls.localize({ key: 'miOpenTelemetrySettings', comment: ['&& denotes a mnemonic'] }, "&&Telemetry Settings")
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        editorPane.focusSearch(`@tag:telemetry`);
                    }
                    else {
                        accessor.get(preferences_2.IPreferencesService).openSettings({ jsonEditor: false, query: '@tag:telemetry' });
                    }
                }
            }));
            this.registerSettingsEditorActions();
            this.extensionService.whenInstalledExtensionsRegistered()
                .then(() => {
                const remoteAuthority = this.environmentService.remoteAuthority;
                const hostLabel = this.labelService.getHostLabel(network_1.Schemas.vscodeRemote, remoteAuthority) || remoteAuthority;
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.action.openRemoteSettings',
                            title: nls.localize2('openRemoteSettings', "Open Remote Settings ({0})", hostLabel),
                            category,
                            menu: {
                                id: actions_1.MenuId.CommandPalette,
                                when: contextkeys_2.RemoteNameContext.notEqualsTo('')
                            }
                        });
                    }
                    run(accessor, args) {
                        args = sanitizeOpenSettingsArgs(args);
                        return accessor.get(preferences_2.IPreferencesService).openRemoteSettings(args);
                    }
                }));
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.action.openRemoteSettingsFile',
                            title: nls.localize2('openRemoteSettingsJSON', "Open Remote Settings (JSON) ({0})", hostLabel),
                            category,
                            menu: {
                                id: actions_1.MenuId.CommandPalette,
                                when: contextkeys_2.RemoteNameContext.notEqualsTo('')
                            }
                        });
                    }
                    run(accessor, args) {
                        args = sanitizeOpenSettingsArgs(args);
                        return accessor.get(preferences_2.IPreferencesService).openRemoteSettings({ jsonEditor: true, ...args });
                    }
                }));
            });
        }
        registerSettingsEditorActions() {
            function getPreferencesEditor(accessor) {
                const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                if (activeEditorPane instanceof settingsEditor2_1.SettingsEditor2) {
                    return activeEditorPane;
                }
                return null;
            }
            function settingsEditorFocusSearch(accessor) {
                const preferencesEditor = getPreferencesEditor(accessor);
                preferencesEditor?.focusSearch();
            }
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_SEARCH,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: null
                        },
                        category,
                        f1: true,
                        title: nls.localize2('settings.focusSearch', "Focus Settings Search")
                    });
                }
                run(accessor) { settingsEditorFocusSearch(accessor); }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 9 /* KeyCode.Escape */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS
                        },
                        category,
                        f1: true,
                        title: nls.localize2('settings.clearResults', "Clear Settings Search Results")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    preferencesEditor?.clearSearchResults();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_FILE,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
                        keybinding: {
                            primary: 18 /* KeyCode.DownArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusFile', "Focus settings file")
                    });
                }
                run(accessor, args) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    preferencesEditor?.focusSettings();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
                        keybinding: {
                            primary: 18 /* KeyCode.DownArrow */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusFile', "Focus settings file")
                    });
                }
                run(accessor, args) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    preferencesEditor?.focusSettings();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_TOC_ROW_FOCUS),
                        keybinding: {
                            primary: 3 /* KeyCode.Enter */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        title: nls.localize('settings.focusSettingsList', "Focus settings list")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                        preferencesEditor.focusSettings();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_TOC,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        f1: true,
                        keybinding: [
                            {
                                primary: 15 /* KeyCode.LeftArrow */,
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: preferences_1.CONTEXT_SETTINGS_ROW_FOCUS
                            }
                        ],
                        category,
                        title: nls.localize2('settings.focusSettingsTOC', "Focus Settings Table of Contents")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    preferencesEditor.focusTOC();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_CONTROL,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_ROW_FOCUS),
                        keybinding: {
                            primary: 3 /* KeyCode.Enter */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        },
                        title: nls.localize('settings.focusSettingControl', "Focus Setting Control")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    const activeElement = preferencesEditor.getContainer()?.ownerDocument.activeElement;
                    if (activeElement?.classList.contains('monaco-list')) {
                        preferencesEditor.focusSettings(true);
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU,
                        precondition: preferences_1.CONTEXT_SETTINGS_EDITOR,
                        keybinding: {
                            primary: 1024 /* KeyMod.Shift */ | 67 /* KeyCode.F9 */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        f1: true,
                        category,
                        title: nls.localize2('settings.showContextMenu', "Show Setting Context Menu")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                        preferencesEditor.showContextMenu();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_FOCUS_UP,
                        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS.toNegated(), preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated()),
                        keybinding: {
                            primary: 9 /* KeyCode.Escape */,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: null
                        },
                        f1: true,
                        category,
                        title: nls.localize2('settings.focusLevelUp', "Move Focus Up One Level")
                    });
                }
                run(accessor) {
                    const preferencesEditor = getPreferencesEditor(accessor);
                    if (!(preferencesEditor instanceof settingsEditor2_1.SettingsEditor2)) {
                        return;
                    }
                    if (preferencesEditor.currentFocusContext === 3 /* SettingsFocusContext.SettingControl */) {
                        preferencesEditor.focusSettings();
                    }
                    else if (preferencesEditor.currentFocusContext === 2 /* SettingsFocusContext.SettingTree */) {
                        preferencesEditor.focusTOC();
                    }
                    else if (preferencesEditor.currentFocusContext === 1 /* SettingsFocusContext.TableOfContents */) {
                        preferencesEditor.focusSearch();
                    }
                }
            }));
        }
        registerKeybindingsActions() {
            const that = this;
            const category = nls.localize2('preferences', "Preferences");
            const id = 'workbench.action.openGlobalKeybindings';
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id,
                        title: nls.localize2('openGlobalKeybindings', "Open Keyboard Shortcuts"),
                        shortTitle: nls.localize('keyboardShortcuts', "Keyboard Shortcuts"),
                        category,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        keybinding: {
                            when: null,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 49 /* KeyCode.KeyS */)
                        },
                        menu: [
                            { id: actions_1.MenuId.CommandPalette },
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkeys_2.ResourceContextKey.Resource.isEqualTo(that.userDataProfileService.currentProfile.keybindingsResource.toString()),
                                group: 'navigation',
                                order: 1,
                            },
                            {
                                id: actions_1.MenuId.GlobalActivity,
                                group: '2_configuration',
                                order: 4
                            }
                        ]
                    });
                }
                run(accessor, args) {
                    const query = typeof args === 'string' ? args : undefined;
                    return accessor.get(preferences_2.IPreferencesService).openGlobalKeybindingSettings(false, { query });
                }
            }));
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
                command: {
                    id,
                    title: nls.localize('keyboardShortcuts', "Keyboard Shortcuts"),
                },
                group: '2_configuration',
                order: 4
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openDefaultKeybindingsFile',
                        title: nls.localize2('openDefaultKeybindingsFile', "Open Default Keyboard Shortcuts (JSON)"),
                        category,
                        menu: { id: actions_1.MenuId.CommandPalette }
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openDefaultKeybindingsFile();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.action.openGlobalKeybindingsFile',
                        title: nls.localize2('openGlobalKeybindingsFile', "Open Keyboard Shortcuts (JSON)"),
                        category,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        menu: [
                            { id: actions_1.MenuId.CommandPalette },
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: 'navigation',
                            }
                        ]
                    });
                }
                run(accessor) {
                    return accessor.get(preferences_2.IPreferencesService).openGlobalKeybindingSettings(true);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS,
                        title: nls.localize2('showDefaultKeybindings', "Show System Keybindings"),
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:system');
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_EXTENSION_KEYBINDINGS,
                        title: nls.localize2('showExtensionKeybindings', "Show Extension Keybindings"),
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:extension');
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS,
                        title: nls.localize2('showUserKeybindings', "Show User Keybindings"),
                        menu: [
                            {
                                id: actions_1.MenuId.EditorTitle,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                                group: '1_keyboard_preferences_actions'
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.search('@source:user');
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
                        title: nls.localize('clear', "Clear Search Results"),
                        keybinding: {
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                            primary: 9 /* KeyCode.Escape */,
                        }
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.clearSearchResults();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_HISTORY,
                        title: nls.localize('clearHistory', "Clear Keyboard Shortcuts Search History"),
                        category,
                        menu: [
                            {
                                id: actions_1.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                            }
                        ]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.clearKeyboardShortcutSearchHistory();
                    }
                }
            }));
            this.registerKeybindingEditorActions();
        }
        registerKeybindingEditorActions() {
            const that = this;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS, preferences_1.CONTEXT_WHEN_FOCUS.toNegated()),
                primary: 3 /* KeyCode.Enter */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.defineKeybinding(editorPane.activeKeybindingEntry, false);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_ADD,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */),
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.defineKeybinding(editorPane.activeKeybindingEntry, true);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */),
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor && editorPane.activeKeybindingEntry.keybindingItem.keybinding) {
                        editorPane.defineWhenExpression(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS, contextkeys_1.InputFocusedContext.toNegated()),
                primary: 20 /* KeyCode.Delete */,
                mac: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
                },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.removeKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.resetKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SEARCH,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.focusSearch();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                primary: 512 /* KeyMod.Alt */ | 41 /* KeyCode.KeyK */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 41 /* KeyCode.KeyK */ },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.recordSearchKeys();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
                primary: 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */ },
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.toggleSortByPrecedence();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.showSimilarKeybindings(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS, preferences_1.CONTEXT_WHEN_FOCUS.negate()),
                primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybinding(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybindingCommand(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
                primary: 0,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        await editorPane.copyKeybindingCommandTitle(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
                primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                handler: (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.focusKeybindings();
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REJECT_WHEN,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_WHEN_FOCUS, suggest_1.Context.Visible.toNegated()),
                primary: 9 /* KeyCode.Escape */,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.rejectWhenExpression(editorPane.activeKeybindingEntry);
                    }
                }
            });
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_ACCEPT_WHEN,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_WHEN_FOCUS, suggest_1.Context.Visible.toNegated()),
                primary: 3 /* KeyCode.Enter */,
                handler: async (accessor, args) => {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof keybindingsEditor_1.KeybindingsEditor) {
                        editorPane.acceptWhenExpression(editorPane.activeKeybindingEntry);
                    }
                }
            });
            const profileScopedActionDisposables = this._register(new lifecycle_1.DisposableStore());
            const registerProfileScopedActions = () => {
                profileScopedActionDisposables.clear();
                profileScopedActionDisposables.add((0, actions_1.registerAction2)(class DefineKeybindingAction extends actions_1.Action2 {
                    constructor() {
                        const when = contextkeys_2.ResourceContextKey.Resource.isEqualTo(that.userDataProfileService.currentProfile.keybindingsResource.toString());
                        super({
                            id: 'editor.action.defineKeybinding',
                            title: nls.localize2('defineKeybinding.start', "Define Keybinding"),
                            f1: true,
                            precondition: when,
                            keybinding: {
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when,
                                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */)
                            },
                            menu: {
                                id: actions_1.MenuId.EditorContent,
                                when,
                            }
                        });
                    }
                    async run(accessor) {
                        const codeEditor = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
                        if ((0, editorBrowser_1.isCodeEditor)(codeEditor)) {
                            codeEditor.getContribution(preferences_2.DEFINE_KEYBINDING_EDITOR_CONTRIB_ID)?.showDefineKeybindingWidget();
                        }
                    }
                }));
            };
            registerProfileScopedActions();
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(() => registerProfileScopedActions()));
        }
        updatePreferencesEditorMenuItem() {
            const commandId = '_workbench.openWorkspaceSettingsEditor';
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ && !commands_1.CommandsRegistry.getCommand(commandId)) {
                commands_1.CommandsRegistry.registerCommand(commandId, () => this.preferencesService.openWorkspaceSettings({ jsonEditor: false }));
                actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
                    command: {
                        id: commandId,
                        title: OPEN_USER_SETTINGS_UI_TITLE,
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon
                    },
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.preferencesService.workspaceSettingsResource.toString()), contextkeys_2.WorkbenchStateContext.isEqualTo('workspace'), contextkey_1.ContextKeyExpr.not('isInDiffEditor')),
                    group: 'navigation',
                    order: 1
                });
            }
            this.updatePreferencesEditorMenuItemForWorkspaceFolders();
        }
        updatePreferencesEditorMenuItemForWorkspaceFolders() {
            for (const folder of this.workspaceContextService.getWorkspace().folders) {
                const commandId = `_workbench.openFolderSettings.${folder.uri.toString()}`;
                if (!commands_1.CommandsRegistry.getCommand(commandId)) {
                    commands_1.CommandsRegistry.registerCommand(commandId, () => {
                        if (this.workspaceContextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                            return this.preferencesService.openWorkspaceSettings({ jsonEditor: false });
                        }
                        else {
                            return this.preferencesService.openFolderSettings({ folderUri: folder.uri, jsonEditor: false });
                        }
                    });
                    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
                        command: {
                            id: commandId,
                            title: OPEN_USER_SETTINGS_UI_TITLE,
                            icon: preferencesIcons_1.preferencesOpenSettingsIcon
                        },
                        when: contextkey_1.ContextKeyExpr.and(contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.preferencesService.getFolderSettingsResource(folder.uri).toString()), contextkey_1.ContextKeyExpr.not('isInDiffEditor')),
                        group: 'navigation',
                        order: 1
                    });
                }
            }
        }
    };
    PreferencesActionsContribution = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, userDataProfile_1.IUserDataProfileService),
        __param(2, preferences_2.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, label_1.ILabelService),
        __param(5, extensions_1.IExtensionService),
        __param(6, userDataProfile_2.IUserDataProfilesService)
    ], PreferencesActionsContribution);
    let SettingsEditorTitleContribution = class SettingsEditorTitleContribution extends lifecycle_1.Disposable {
        constructor(userDataProfileService, userDataProfilesService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.registerSettingsEditorTitleActions();
        }
        registerSettingsEditorTitleActions() {
            const registerOpenUserSettingsEditorFromJsonActionDisposables = this._register(new lifecycle_1.MutableDisposable());
            const openUserSettingsEditorWhen = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.userDataProfileService.currentProfile.settingsResource.toString()), contextkeys_2.ResourceContextKey.Resource.isEqualTo(this.userDataProfilesService.defaultProfile.settingsResource.toString())), contextkey_1.ContextKeyExpr.not('isInDiffEditor'));
            const registerOpenUserSettingsEditorFromJsonAction = () => {
                registerOpenUserSettingsEditorFromJsonActionDisposables.value = (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: '_workbench.openUserSettingsEditor',
                            title: OPEN_USER_SETTINGS_UI_TITLE,
                            icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                            menu: [{
                                    id: actions_1.MenuId.EditorTitle,
                                    when: openUserSettingsEditorWhen,
                                    group: 'navigation',
                                    order: 1
                                }]
                        });
                    }
                    run(accessor, args) {
                        args = sanitizeOpenSettingsArgs(args);
                        return accessor.get(preferences_2.IPreferencesService).openUserSettings({ jsonEditor: false, ...args });
                    }
                });
            };
            registerOpenUserSettingsEditorFromJsonAction();
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(() => {
                // Force the action to check the context again.
                registerOpenUserSettingsEditorFromJsonAction();
            }));
            const openSettingsJsonWhen = contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated());
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON,
                        title: nls.localize2('openSettingsJson', "Open Settings (JSON)"),
                        icon: preferencesIcons_1.preferencesOpenSettingsIcon,
                        menu: [{
                                id: actions_1.MenuId.EditorTitle,
                                when: openSettingsJsonWhen,
                                group: 'navigation',
                                order: 1
                            }]
                    });
                }
                run(accessor) {
                    const editorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
                    if (editorPane instanceof settingsEditor2_1.SettingsEditor2) {
                        return editorPane.switchToSettingsFile();
                    }
                    return null;
                }
            }));
        }
    };
    SettingsEditorTitleContribution = __decorate([
        __param(0, userDataProfile_1.IUserDataProfileService),
        __param(1, userDataProfile_2.IUserDataProfilesService)
    ], SettingsEditorTitleContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    (0, contributions_1.registerWorkbenchContribution2)(PreferencesActionsContribution.ID, PreferencesActionsContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(preferencesContribution_1.PreferencesContribution.ID, preferencesContribution_1.PreferencesContribution, 1 /* WorkbenchPhase.BlockStartup */);
    workbenchContributionsRegistry.registerWorkbenchContribution(SettingsEditorTitleContribution, 3 /* LifecyclePhase.Restored */);
    (0, editorExtensions_1.registerEditorContribution)(preferencesEditor_1.SettingsEditorContribution.ID, preferencesEditor_1.SettingsEditorContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    // Preferences menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences"),
        submenu: actions_1.MenuId.MenubarPreferencesMenu,
        group: '5_autosave',
        order: 2,
        when: contextkeys_1.IsMacNativeContext.toNegated() // on macOS native the preferences menu is separate under the application menu
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3ByZWZlcmVuY2VzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQThDaEcsTUFBTSw4QkFBOEIsR0FBRyx3QkFBd0IsQ0FBQztJQUVoRSxNQUFNLGtDQUFrQyxHQUFHLG1DQUFtQyxDQUFDO0lBQy9FLE1BQU0sa0RBQWtELEdBQUcseUNBQXlDLENBQUM7SUFDckcsTUFBTSwyQ0FBMkMsR0FBRyxtQ0FBbUMsQ0FBQztJQUN4RixNQUFNLGlDQUFpQyxHQUFHLDBCQUEwQixDQUFDO0lBQ3JFLE1BQU0scUNBQXFDLEdBQUcscUNBQXFDLENBQUM7SUFDcEYsTUFBTSxnQ0FBZ0MsR0FBRyw4QkFBOEIsQ0FBQztJQUV4RSxNQUFNLHNDQUFzQyxHQUFHLHVCQUF1QixDQUFDO0lBQ3ZFLE1BQU0scUNBQXFDLEdBQUcseUJBQXlCLENBQUM7SUFDeEUsTUFBTSx3Q0FBd0MsR0FBRywwQkFBMEIsQ0FBQztJQUU1RSxNQUFNLDhCQUE4QixHQUFHLCtCQUErQixDQUFDO0lBQ3ZFLE1BQU0saUNBQWlDLEdBQUcsNEJBQTRCLENBQUM7SUFFdkUsbUJBQVEsQ0FBQyxFQUFFLENBQXNCLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLGtCQUFrQixDQUMvRSw2QkFBb0IsQ0FBQyxNQUFNLENBQzFCLGlDQUFlLEVBQ2YsaUNBQWUsQ0FBQyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsQ0FDcEQsRUFDRDtRQUNDLElBQUksNEJBQWMsQ0FBQyw2Q0FBb0IsQ0FBQztLQUN4QyxDQUNELENB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