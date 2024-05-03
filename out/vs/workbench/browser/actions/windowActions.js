/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/platform/action/common/actionCommonCategories", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/keybinding/common/keybinding", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/workspaces/common/workspaces", "vs/editor/common/services/getIconClasses", "vs/platform/files/common/files", "vs/base/common/labels", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/quickaccess", "vs/workbench/services/host/browser/host", "vs/base/common/map", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/backup/common/backup", "vs/base/browser/dom"], function (require, exports, nls_1, dialogs_1, actions_1, keyCodes_1, contextkeys_1, contextkeys_2, actionCommonCategories_1, keybindingsRegistry_1, quickInput_1, workspace_1, label_1, keybinding_1, model_1, language_1, workspaces_1, getIconClasses_1, files_1, labels_1, platform_1, contextkey_1, quickaccess_1, host_1, map_1, codicons_1, themables_1, commands_1, configuration_1, backup_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReloadWindowAction = exports.OpenRecentAction = exports.inRecentFilesPickerContextKey = void 0;
    exports.inRecentFilesPickerContextKey = 'inRecentFilesPicker';
    class BaseOpenRecentAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.removeFromRecentlyOpened = {
                iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.removeClose),
                tooltip: (0, nls_1.localize)('remove', "Remove from Recently Opened")
            };
            this.dirtyRecentlyOpenedFolder = {
                iconClass: 'dirty-workspace ' + themables_1.ThemeIcon.asClassName(codicons_1.Codicon.closeDirty),
                tooltip: (0, nls_1.localize)('dirtyRecentlyOpenedFolder', "Folder With Unsaved Files"),
                alwaysVisible: true
            };
            this.dirtyRecentlyOpenedWorkspace = {
                ...this.dirtyRecentlyOpenedFolder,
                tooltip: (0, nls_1.localize)('dirtyRecentlyOpenedWorkspace', "Workspace With Unsaved Files"),
            };
        }
        async run(accessor) {
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const labelService = accessor.get(label_1.ILabelService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const hostService = accessor.get(host_1.IHostService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const recentlyOpened = await workspacesService.getRecentlyOpened();
            const dirtyWorkspacesAndFolders = await workspacesService.getDirtyWorkspaces();
            let hasWorkspaces = false;
            // Identify all folders and workspaces with unsaved files
            const dirtyFolders = new map_1.ResourceMap();
            const dirtyWorkspaces = new map_1.ResourceMap();
            for (const dirtyWorkspace of dirtyWorkspacesAndFolders) {
                if ((0, backup_1.isFolderBackupInfo)(dirtyWorkspace)) {
                    dirtyFolders.set(dirtyWorkspace.folderUri, true);
                }
                else {
                    dirtyWorkspaces.set(dirtyWorkspace.workspace.configPath, dirtyWorkspace.workspace);
                    hasWorkspaces = true;
                }
            }
            // Identify all recently opened folders and workspaces
            const recentFolders = new map_1.ResourceMap();
            const recentWorkspaces = new map_1.ResourceMap();
            for (const recent of recentlyOpened.workspaces) {
                if ((0, workspaces_1.isRecentFolder)(recent)) {
                    recentFolders.set(recent.folderUri, true);
                }
                else {
                    recentWorkspaces.set(recent.workspace.configPath, recent.workspace);
                    hasWorkspaces = true;
                }
            }
            // Fill in all known recently opened workspaces
            const workspacePicks = [];
            for (const recent of recentlyOpened.workspaces) {
                const isDirty = (0, workspaces_1.isRecentFolder)(recent) ? dirtyFolders.has(recent.folderUri) : dirtyWorkspaces.has(recent.workspace.configPath);
                workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, recent, isDirty));
            }
            // Fill any backup workspace that is not yet shown at the end
            for (const dirtyWorkspaceOrFolder of dirtyWorkspacesAndFolders) {
                if ((0, backup_1.isFolderBackupInfo)(dirtyWorkspaceOrFolder) && !recentFolders.has(dirtyWorkspaceOrFolder.folderUri)) {
                    workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, dirtyWorkspaceOrFolder, true));
                }
                else if ((0, backup_1.isWorkspaceBackupInfo)(dirtyWorkspaceOrFolder) && !recentWorkspaces.has(dirtyWorkspaceOrFolder.workspace.configPath)) {
                    workspacePicks.push(this.toQuickPick(modelService, languageService, labelService, dirtyWorkspaceOrFolder, true));
                }
            }
            const filePicks = recentlyOpened.files.map(p => this.toQuickPick(modelService, languageService, labelService, p, false));
            // focus second entry if the first recent workspace is the current workspace
            const firstEntry = recentlyOpened.workspaces[0];
            const autoFocusSecondEntry = firstEntry && contextService.isCurrentWorkspace((0, workspaces_1.isRecentWorkspace)(firstEntry) ? firstEntry.workspace : firstEntry.folderUri);
            let keyMods;
            const workspaceSeparator = { type: 'separator', label: hasWorkspaces ? (0, nls_1.localize)('workspacesAndFolders', "folders & workspaces") : (0, nls_1.localize)('folders', "folders") };
            const fileSeparator = { type: 'separator', label: (0, nls_1.localize)('files', "files") };
            const picks = [workspaceSeparator, ...workspacePicks, fileSeparator, ...filePicks];
            const pick = await quickInputService.pick(picks, {
                contextKey: exports.inRecentFilesPickerContextKey,
                activeItem: [...workspacePicks, ...filePicks][autoFocusSecondEntry ? 1 : 0],
                placeHolder: platform_1.isMacintosh ? (0, nls_1.localize)('openRecentPlaceholderMac', "Select to open (hold Cmd-key to force new window or Option-key for same window)") : (0, nls_1.localize)('openRecentPlaceholder', "Select to open (hold Ctrl-key to force new window or Alt-key for same window)"),
                matchOnDescription: true,
                onKeyMods: mods => keyMods = mods,
                quickNavigate: this.isQuickNavigate() ? { keybindings: keybindingService.lookupKeybindings(this.desc.id) } : undefined,
                hideInput: this.isQuickNavigate(),
                onDidTriggerItemButton: async (context) => {
                    // Remove
                    if (context.button === this.removeFromRecentlyOpened) {
                        await workspacesService.removeRecentlyOpened([context.item.resource]);
                        context.removeItem();
                    }
                    // Dirty Folder/Workspace
                    else if (context.button === this.dirtyRecentlyOpenedFolder || context.button === this.dirtyRecentlyOpenedWorkspace) {
                        const isDirtyWorkspace = context.button === this.dirtyRecentlyOpenedWorkspace;
                        const { confirmed } = await dialogService.confirm({
                            title: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspace', "Workspace with Unsaved Files") : (0, nls_1.localize)('dirtyFolder', "Folder with Unsaved Files"),
                            message: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspaceConfirm', "Do you want to open the workspace to review the unsaved files?") : (0, nls_1.localize)('dirtyFolderConfirm', "Do you want to open the folder to review the unsaved files?"),
                            detail: isDirtyWorkspace ? (0, nls_1.localize)('dirtyWorkspaceConfirmDetail', "Workspaces with unsaved files cannot be removed until all unsaved files have been saved or reverted.") : (0, nls_1.localize)('dirtyFolderConfirmDetail', "Folders with unsaved files cannot be removed until all unsaved files have been saved or reverted.")
                        });
                        if (confirmed) {
                            hostService.openWindow([context.item.openable], {
                                remoteAuthority: context.item.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                            });
                            quickInputService.cancel();
                        }
                    }
                }
            });
            if (pick) {
                return hostService.openWindow([pick.openable], {
                    forceNewWindow: keyMods?.ctrlCmd,
                    forceReuseWindow: keyMods?.alt,
                    remoteAuthority: pick.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                });
            }
        }
        toQuickPick(modelService, languageService, labelService, recent, isDirty) {
            let openable;
            let iconClasses;
            let fullLabel;
            let resource;
            let isWorkspace = false;
            // Folder
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                resource = recent.folderUri;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.FOLDER);
                openable = { folderUri: resource };
                fullLabel = recent.label || labelService.getWorkspaceLabel(resource, { verbose: 2 /* Verbosity.LONG */ });
            }
            // Workspace
            else if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                resource = recent.workspace.configPath;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.ROOT_FOLDER);
                openable = { workspaceUri: resource };
                fullLabel = recent.label || labelService.getWorkspaceLabel(recent.workspace, { verbose: 2 /* Verbosity.LONG */ });
                isWorkspace = true;
            }
            // File
            else {
                resource = recent.fileUri;
                iconClasses = (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource, files_1.FileKind.FILE);
                openable = { fileUri: resource };
                fullLabel = recent.label || labelService.getUriLabel(resource);
            }
            const { name, parentPath } = (0, labels_1.splitRecentLabel)(fullLabel);
            return {
                iconClasses,
                label: name,
                ariaLabel: isDirty ? isWorkspace ? (0, nls_1.localize)('recentDirtyWorkspaceAriaLabel', "{0}, workspace with unsaved changes", name) : (0, nls_1.localize)('recentDirtyFolderAriaLabel', "{0}, folder with unsaved changes", name) : name,
                description: parentPath,
                buttons: isDirty ? [isWorkspace ? this.dirtyRecentlyOpenedWorkspace : this.dirtyRecentlyOpenedFolder] : [this.removeFromRecentlyOpened],
                openable,
                resource,
                remoteAuthority: recent.remoteAuthority
            };
        }
    }
    class OpenRecentAction extends BaseOpenRecentAction {
        static { this.ID = 'workbench.action.openRecent'; }
        constructor() {
            super({
                id: OpenRecentAction.ID,
                title: {
                    ...(0, nls_1.localize2)('openRecent', "Open Recent..."),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miMore', comment: ['&& denotes a mnemonic'] }, "&&More..."),
                },
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 48 /* KeyCode.KeyR */ }
                },
                menu: {
                    id: actions_1.MenuId.MenubarRecentMenu,
                    group: 'y_more',
                    order: 1
                }
            });
        }
        isQuickNavigate() {
            return false;
        }
    }
    exports.OpenRecentAction = OpenRecentAction;
    class QuickPickRecentAction extends BaseOpenRecentAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenRecent',
                title: (0, nls_1.localize2)('quickOpenRecent', 'Quick Open Recent...'),
                category: actionCommonCategories_1.Categories.File,
                f1: false // hide quick pickers from command palette to not confuse with the other entry that shows a input field
            });
        }
        isQuickNavigate() {
            return true;
        }
    }
    class ToggleFullScreenAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleFullScreen',
                title: {
                    ...(0, nls_1.localize2)('toggleFullScreen', "Toggle Full Screen"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleFullScreen', comment: ['&& denotes a mnemonic'] }, "&&Full Screen"),
                },
                category: actionCommonCategories_1.Categories.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 69 /* KeyCode.F11 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 36 /* KeyCode.KeyF */
                    }
                },
                precondition: contextkeys_2.IsIOSContext.toNegated(),
                toggled: contextkeys_1.IsMainWindowFullscreenContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 1
                    }]
            });
        }
        run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.toggleFullScreen((0, dom_1.getActiveWindow)());
        }
    }
    class ReloadWindowAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.reloadWindow'; }
        constructor() {
            super({
                id: ReloadWindowAction.ID,
                title: (0, nls_1.localize2)('reloadWindow', 'Reload Window'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                    when: contextkeys_2.IsDevelopmentContext,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */
                }
            });
        }
        async run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.reload();
        }
    }
    exports.ReloadWindowAction = ReloadWindowAction;
    class ShowAboutDialogAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.showAboutDialog',
                title: {
                    ...(0, nls_1.localize2)('about', "About"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miAbout', comment: ['&& denotes a mnemonic'] }, "&&About"),
                },
                category: actionCommonCategories_1.Categories.Help,
                f1: true,
                menu: {
                    id: actions_1.MenuId.MenubarHelpMenu,
                    group: 'z_about',
                    order: 1,
                    when: contextkeys_2.IsMacNativeContext.toNegated()
                }
            });
        }
        run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            return dialogService.about();
        }
    }
    class NewWindowAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.newWindow',
                title: {
                    ...(0, nls_1.localize2)('newWindow', "New Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window"),
                },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: platform_1.isWeb ? (platform_1.isWindows ? (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */) : 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */,
                    secondary: platform_1.isWeb ? [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */] : undefined
                },
                menu: {
                    id: actions_1.MenuId.MenubarFileMenu,
                    group: '1_new',
                    order: 3
                }
            });
        }
        run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            return hostService.openWindow({ remoteAuthority: null });
        }
    }
    class BlurAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.blur',
                title: (0, nls_1.localize2)('blur', 'Remove keyboard focus from focused element')
            });
        }
        run() {
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement instanceof HTMLElement) {
                activeElement.blur();
            }
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(NewWindowAction);
    (0, actions_1.registerAction2)(ToggleFullScreenAction);
    (0, actions_1.registerAction2)(QuickPickRecentAction);
    (0, actions_1.registerAction2)(OpenRecentAction);
    (0, actions_1.registerAction2)(ReloadWindowAction);
    (0, actions_1.registerAction2)(ShowAboutDialogAction);
    (0, actions_1.registerAction2)(BlurAction);
    // --- Commands/Keybindings Registration
    const recentFilesPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(exports.inRecentFilesPickerContextKey));
    const quickPickNavigateNextInRecentFilesPickerId = 'workbench.action.quickOpenNavigateNextInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigateNextInRecentFilesPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickPickNavigateNextInRecentFilesPickerId, true),
        when: recentFilesPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 48 /* KeyCode.KeyR */ }
    });
    const quickPickNavigatePreviousInRecentFilesPicker = 'workbench.action.quickOpenNavigatePreviousInRecentFilesPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickPickNavigatePreviousInRecentFilesPicker,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickPickNavigatePreviousInRecentFilesPicker, false),
        when: recentFilesPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */ }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.toggleConfirmBeforeClose', accessor => {
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const setting = configurationService.inspect('window.confirmBeforeClose').userValue;
        return configurationService.updateValue('window.confirmBeforeClose', setting === 'never' ? 'keyboardOnly' : 'never');
    });
    // --- Menu Registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: 'z_ConfirmClose',
        command: {
            id: 'workbench.action.toggleConfirmBeforeClose',
            title: (0, nls_1.localize)('miConfirmClose', "Confirm Before Close"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.window.confirmBeforeClose', 'never')
        },
        order: 1,
        when: contextkeys_2.IsWebContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: (0, nls_1.localize)({ key: 'miOpenRecent', comment: ['&& denotes a mnemonic'] }, "Open &&Recent"),
        submenu: actions_1.MenuId.MenubarRecentMenu,
        group: '2_open',
        order: 4
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy93aW5kb3dBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1DbkYsUUFBQSw2QkFBNkIsR0FBRyxxQkFBcUIsQ0FBQztJQVFuRSxNQUFlLG9CQUFxQixTQUFRLGlCQUFPO1FBa0JsRCxZQUFZLElBQStCO1lBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQWpCSSw2QkFBd0IsR0FBc0I7Z0JBQzlELFNBQVMsRUFBRSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxrQkFBTyxDQUFDLFdBQVcsQ0FBQztnQkFDckQsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSw2QkFBNkIsQ0FBQzthQUMxRCxDQUFDO1lBRWUsOEJBQXlCLEdBQXNCO2dCQUMvRCxTQUFTLEVBQUUsa0JBQWtCLEdBQUcscUJBQVMsQ0FBQyxXQUFXLENBQUMsa0JBQU8sQ0FBQyxVQUFVLENBQUM7Z0JBQ3pFLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSwyQkFBMkIsQ0FBQztnQkFDM0UsYUFBYSxFQUFFLElBQUk7YUFDbkIsQ0FBQztZQUVlLGlDQUE0QixHQUFzQjtnQkFDbEUsR0FBRyxJQUFJLENBQUMseUJBQXlCO2dCQUNqQyxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsOEJBQThCLEVBQUUsOEJBQThCLENBQUM7YUFDakYsQ0FBQztRQUlGLENBQUM7UUFJUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDO1lBQzNELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcs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