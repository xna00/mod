/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/services/host/browser/host", "vs/base/common/keyCodes", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspaces/common/workspaces", "vs/platform/contextkey/common/contextkeys", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls_1, workspace_1, workspaceEditing_1, editorService_1, commands_1, workspaceCommands_1, dialogs_1, actions_1, contextkeys_1, host_1, keyCodes_1, contextkey_1, environmentService_1, workspaces_1, contextkeys_2, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoveRootFolderAction = exports.AddRootFolderAction = exports.OpenFileFolderAction = exports.OpenFolderViaWorkspaceAction = exports.OpenFolderAction = exports.OpenFileAction = void 0;
    const workspacesCategory = (0, nls_1.localize2)('workspaces', 'Workspaces');
    class OpenFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFile'; }
        constructor() {
            super({
                id: OpenFileAction.ID,
                title: (0, nls_1.localize2)('openFile', 'Open File...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                keybinding: {
                    when: contextkeys_2.IsMacNativeContext.toNegated(),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileAction = OpenFileAction;
    class OpenFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFolder'; }
        constructor() {
            super({
                id: OpenFolderAction.ID,
                title: (0, nls_1.localize2)('openFolder', 'Open Folder...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkeys_1.OpenFolderWorkspaceSupportContext,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: undefined,
                    linux: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    },
                    win: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */)
                    }
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFolderAction = OpenFolderAction;
    class OpenFolderViaWorkspaceAction extends actions_1.Action2 {
        // This action swaps the folders of a workspace with
        // the selected folder and is a workaround for providing
        // "Open Folder..." in environments that do not support
        // this without having a workspace open (e.g. web serverless)
        static { this.ID = 'workbench.action.files.openFolderViaWorkspace'; }
        constructor() {
            super({
                id: OpenFolderViaWorkspaceAction.ID,
                title: (0, nls_1.localize2)('openFolder', 'Open Folder...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.SET_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.OpenFolderViaWorkspaceAction = OpenFolderViaWorkspaceAction;
    class OpenFileFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.files.openFileFolder'; }
        static { this.LABEL = (0, nls_1.localize2)('openFileFolder', 'Open...'); }
        constructor() {
            super({
                id: OpenFileFolderAction.ID,
                title: OpenFileFolderAction.LABEL,
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 45 /* KeyCode.KeyO */
                }
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    }
    exports.OpenFileFolderAction = OpenFileFolderAction;
    class OpenWorkspaceAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openWorkspace'; }
        constructor() {
            super({
                id: OpenWorkspaceAction.ID,
                title: (0, nls_1.localize2)('openWorkspaceAction', 'Open Workspace from File...'),
                category: actionCommonCategories_1.Categories.File,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor, data) {
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            return fileDialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
        }
    }
    class CloseWorkspaceAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.closeFolder'; }
        constructor() {
            super({
                id: CloseWorkspaceAction.ID,
                title: (0, nls_1.localize2)('closeWorkspace', 'Close Workspace'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkeys_1.EmptyWorkspaceSupportContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 36 /* KeyCode.KeyF */)
                }
            });
        }
        async run(accessor) {
            const hostService = accessor.get(host_1.IHostService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            return hostService.openWindow({ forceReuseWindow: true, remoteAuthority: environmentService.remoteAuthority });
        }
    }
    class OpenWorkspaceConfigFileAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.openWorkspaceConfigFile'; }
        constructor() {
            super({
                id: OpenWorkspaceConfigFileAction.ID,
                title: (0, nls_1.localize2)('openWorkspaceConfigFile', 'Open Workspace Configuration File'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
            });
        }
        async run(accessor) {
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const configuration = contextService.getWorkspace().configuration;
            if (configuration) {
                await editorService.openEditor({ resource: configuration, options: { pinned: true } });
            }
        }
    }
    class AddRootFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.addRootFolder'; }
        constructor() {
            super({
                id: AddRootFolderAction.ID,
                title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL,
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
            });
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID);
        }
    }
    exports.AddRootFolderAction = AddRootFolderAction;
    class RemoveRootFolderAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.removeRootFolder'; }
        constructor() {
            super({
                id: RemoveRootFolderAction.ID,
                title: (0, nls_1.localize2)('globalRemoveFolderFromWorkspace', 'Remove Folder from Workspace...'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const folder = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
            if (folder) {
                await workspaceEditingService.removeFolders([folder.uri]);
            }
        }
    }
    exports.RemoveRootFolderAction = RemoveRootFolderAction;
    class SaveWorkspaceAsAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.saveWorkspaceAs'; }
        constructor() {
            super({
                id: SaveWorkspaceAsAction.ID,
                title: (0, nls_1.localize2)('saveWorkspaceAsAction', 'Save Workspace As...'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const configPathUri = await workspaceEditingService.pickNewWorkspacePath();
            if (configPathUri && (0, workspace_1.hasWorkspaceFileExtension)(configPathUri)) {
                switch (contextService.getWorkbenchState()) {
                    case 1 /* WorkbenchState.EMPTY */:
                    case 2 /* WorkbenchState.FOLDER */: {
                        const folders = contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                        return workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);
                    }
                    case 3 /* WorkbenchState.WORKSPACE */:
                        return workspaceEditingService.saveAndEnterWorkspace(configPathUri);
                }
            }
        }
    }
    class DuplicateWorkspaceInNewWindowAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.duplicateWorkspaceInNewWindow'; }
        constructor() {
            super({
                id: DuplicateWorkspaceInNewWindowAction.ID,
                title: (0, nls_1.localize2)('duplicateWorkspaceInNewWindow', 'Duplicate As Workspace in New Window'),
                category: workspacesCategory,
                f1: true,
                precondition: contextkeys_1.EnterMultiRootWorkspaceSupportContext
            });
        }
        async run(accessor) {
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const hostService = accessor.get(host_1.IHostService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const environmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
            const folders = workspaceContextService.getWorkspace().folders;
            const remoteAuthority = environmentService.remoteAuthority;
            const newWorkspace = await workspacesService.createUntitledWorkspace(folders, remoteAuthority);
            await workspaceEditingService.copyWorkspaceSettings(newWorkspace);
            return hostService.openWindow([{ workspaceUri: newWorkspace.configPath }], { forceNewWindow: true, remoteAuthority });
        }
    }
    // --- Actions Registration
    (0, actions_1.registerAction2)(AddRootFolderAction);
    (0, actions_1.registerAction2)(RemoveRootFolderAction);
    (0, actions_1.registerAction2)(OpenFileAction);
    (0, actions_1.registerAction2)(OpenFolderAction);
    (0, actions_1.registerAction2)(OpenFolderViaWorkspaceAction);
    (0, actions_1.registerAction2)(OpenFileFolderAction);
    (0, actions_1.registerAction2)(OpenWorkspaceAction);
    (0, actions_1.registerAction2)(OpenWorkspaceConfigFileAction);
    (0, actions_1.registerAction2)(CloseWorkspaceAction);
    (0, actions_1.registerAction2)(SaveWorkspaceAsAction);
    (0, actions_1.registerAction2)(DuplicateWorkspaceInNewWindowAction);
    // --- Menu Registration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFile', comment: ['&& denotes a mnemonic'] }, "&&Open File...")
        },
        order: 1,
        when: contextkeys_2.IsMacNativeContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkeys_1.OpenFolderWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFolderViaWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenFolder', comment: ['&& denotes a mnemonic'] }, "Open &&Folder...")
        },
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.OpenFolderWorkspaceSupportContext.toNegated(), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenFileFolderAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpen', comment: ['&& denotes a mnemonic'] }, "&&Open...")
        },
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_2.IsMacNativeContext, contextkeys_1.OpenFolderWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '2_open',
        command: {
            id: OpenWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miOpenWorkspace', comment: ['&& denotes a mnemonic'] }, "Open Wor&&kspace from File...")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: (0, nls_1.localize)({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: SaveWorkspaceAsAction.ID,
            title: (0, nls_1.localize)('miSaveWorkspaceAs', "Save Workspace As...")
        },
        order: 2,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '3_workspace',
        command: {
            id: DuplicateWorkspaceInNewWindowAction.ID,
            title: (0, nls_1.localize)('duplicateWorkspace', "Duplicate Workspace")
        },
        order: 3,
        when: contextkeys_1.EnterMultiRootWorkspaceSupportContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('folder'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: (0, nls_1.localize)({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkeys_1.EmptyWorkspaceSupportContext)
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy93b3Jrc3BhY2VBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsTUFBTSxrQkFBa0IsR0FBcUIsSUFBQSxlQUFTLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBRW5GLE1BQWEsY0FBZSxTQUFRLGlCQUFPO2lCQUUxQixPQUFFLEdBQUcsaUNBQWlDLENBQUM7UUFFdkQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGNBQWMsQ0FBQyxFQUFFO2dCQUNyQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQztnQkFDNUMsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRSxnQ0FBa0IsQ0FBQyxTQUFTLEVBQUU7b0JBQ3BDLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsaURBQTZCO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsSUFBcUI7WUFDbkUsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDRCQUFrQixDQUFDLENBQUM7WUFFM0QsT0FBTyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsRUFBRSxjQUFjLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDL0YsQ0FBQzs7SUF0QkYsd0NBdUJDO0lBRUQsTUFBYSxnQkFBaUIsU0FBUSxpQkFBTztpQkFFNUIsT0FBRSxHQUFHLG1DQUFtQyxDQUFD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