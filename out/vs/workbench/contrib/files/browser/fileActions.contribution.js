/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/platform/actions/common/actions", "vs/workbench/contrib/files/browser/fileCommands", "vs/workbench/contrib/files/browser/fileConstants", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/list/browser/listService", "vs/base/common/network", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/files/browser/files", "vs/base/common/codicons", "vs/platform/action/common/actionCommonCategories"], function (require, exports, nls, fileActions_1, textFileSaveErrorHandler_1, actions_1, fileCommands_1, fileConstants_1, commands_1, contextkey_1, keybindingsRegistry_1, files_1, workspaceCommands_1, editorCommands_1, filesConfigurationService_1, listService_1, network_1, contextkeys_1, contextkeys_2, files_2, codicons_1, actionCommonCategories_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.appendEditorTitleContextMenuItem = appendEditorTitleContextMenuItem;
    exports.appendToCommandPalette = appendToCommandPalette;
    // Contribute Global Actions
    (0, actions_1.registerAction2)(fileActions_1.GlobalCompareResourcesAction);
    (0, actions_1.registerAction2)(fileActions_1.FocusFilesExplorer);
    (0, actions_1.registerAction2)(fileActions_1.ShowActiveFileInExplorer);
    (0, actions_1.registerAction2)(fileActions_1.CompareWithClipboardAction);
    (0, actions_1.registerAction2)(fileActions_1.CompareNewUntitledTextFilesAction);
    (0, actions_1.registerAction2)(fileActions_1.ToggleAutoSaveAction);
    (0, actions_1.registerAction2)(fileActions_1.OpenActiveFileInEmptyWorkspace);
    (0, actions_1.registerAction2)(fileActions_1.SetActiveEditorReadonlyInSession);
    (0, actions_1.registerAction2)(fileActions_1.SetActiveEditorWriteableInSession);
    (0, actions_1.registerAction2)(fileActions_1.ToggleActiveEditorReadonlyInSession);
    (0, actions_1.registerAction2)(fileActions_1.ResetActiveEditorReadonlyInSession);
    // Commands
    commands_1.CommandsRegistry.registerCommand('_files.windowOpen', fileCommands_1.openWindowCommand);
    commands_1.CommandsRegistry.registerCommand('_files.newWindow', fileCommands_1.newWindowCommand);
    const explorerCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const RENAME_ID = 'renameFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: RENAME_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 60 /* KeyCode.F2 */,
        mac: {
            primary: 3 /* KeyCode.Enter */
        },
        handler: fileActions_1.renameHandler
    });
    const MOVE_FILE_TO_TRASH_ID = 'moveFileToTrash';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: MOVE_FILE_TO_TRASH_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
            secondary: [20 /* KeyCode.Delete */]
        },
        handler: fileActions_1.moveFileToTrashHandler
    });
    const DELETE_FILE_ID = 'deleteFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    const CUT_FILE_ID = 'filesExplorer.cut';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CUT_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
        handler: fileActions_1.cutFileHandler,
    });
    const COPY_FILE_ID = 'filesExplorer.copy';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: COPY_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
        handler: fileActions_1.copyFileHandler,
    });
    const PASTE_FILE_ID = 'filesExplorer.paste';
    commands_1.CommandsRegistry.registerCommand(PASTE_FILE_ID, fileActions_1.pasteFileHandler);
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: `^${PASTE_FILE_ID}`, // the `^` enables pasting files into the explorer by preventing default bubble up
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.cancelCut',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceCut),
        primary: 9 /* KeyCode.Escape */,
        handler: async (accessor) => {
            const explorerService = accessor.get(files_2.IExplorerService);
            await explorerService.setToCopy([], true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.openFilePreserveFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 10 /* KeyCode.Space */,
        handler: fileActions_1.openFilePreserveFocusHandler
    });
    const copyPathCommand = {
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        title: nls.localize('copyPath', "Copy Path")
    };
    const copyRelativePathCommand = {
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize('copyRelativePath', "Copy Relative Path")
    };
    // Editor Title Context Menu
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_PATH_COMMAND_ID, copyPathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID, copyRelativePathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, nls.localize('revealInSideBar', "Reveal in Explorer View"), contextkeys_1.ResourceContextKey.IsFileSystemResource, '2_files', 1);
    function appendEditorTitleContextMenuItem(id, title, when, group, order) {
        // Menu
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, {
            command: { id, title },
            when,
            group,
            order
        });
    }
    // Editor Title Menu for Conflict Resolution
    appendSaveConflictEditorTitleAction('workbench.files.action.acceptLocalChanges', nls.localize('acceptLocalChanges', "Use your changes and overwrite file contents"), codicons_1.Codicon.check, -10, textFileSaveErrorHandler_1.acceptLocalChangesCommand);
    appendSaveConflictEditorTitleAction('workbench.files.action.revertLocalChanges', nls.localize('revertLocalChanges', "Discard your changes and revert to file contents"), codicons_1.Codicon.discard, -9, textFileSaveErrorHandler_1.revertLocalChangesCommand);
    function appendSaveConflictEditorTitleAction(id, title, icon, order, command) {
        // Command
        commands_1.CommandsRegistry.registerCommand(id, command);
        // Action
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
            command: { id, title, icon },
            when: contextkey_1.ContextKeyExpr.equals(textFileSaveErrorHandler_1.CONFLICT_RESOLUTION_CONTEXT, true),
            group: 'navigation',
            order
        });
    }
    // Menu registration - command palette
    function appendToCommandPalette({ id, title, category, metadata }, when) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id,
                title,
                category,
                metadata
            },
            when
        });
    }
    appendToCommandPalette({
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        title: nls.localize2('copyPathOfActive', "Copy Path of Active File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize2('copyRelativePathOfActive', "Copy Relative Path of Active File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
        title: nls.localize2('saveAllInGroup', "Save All in Group"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILES_COMMAND_ID,
        title: nls.localize2('saveFiles', "Save All Files"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.REVERT_FILE_COMMAND_ID,
        title: nls.localize2('revert', "Revert File"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
        title: nls.localize2('compareActiveWithSaved', "Compare Active File with Saved"),
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
        title: fileConstants_1.SAVE_FILE_AS_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    appendToCommandPalette({
        id: fileActions_1.NEW_FILE_COMMAND_ID,
        title: fileActions_1.NEW_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    }, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette({
        id: fileActions_1.NEW_FOLDER_COMMAND_ID,
        title: fileActions_1.NEW_FOLDER_LABEL,
        category: actionCommonCategories_1.Categories.File,
        metadata: { description: nls.localize2('newFolderDescription', "Create a new folder or directory") }
    }, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette({
        id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
        title: fileConstants_1.NEW_UNTITLED_FILE_LABEL,
        category: actionCommonCategories_1.Categories.File
    });
    // Menu registration - open editors
    const isFileOrUntitledResourceContextKey = contextkey_1.ContextKeyExpr.or(contextkeys_1.ResourceContextKey.IsFileSystemResource, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled));
    const openToSideCommand = {
        id: fileConstants_1.OPEN_TO_SIDE_COMMAND_ID,
        title: nls.localize('openToSide', "Open to the Side")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: isFileOrUntitledResourceContextKey
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_open',
        order: 10,
        command: {
            id: editorCommands_1.REOPEN_WITH_COMMAND_ID,
            title: nls.localize('reopenWith', "Reopen Editor With...")
        },
        when: contextkeys_1.ActiveEditorAvailableEditorIdsContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 10,
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: fileConstants_1.SAVE_FILE_LABEL,
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.or(
        // Untitled Editors
        contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled), 
        // Or:
        contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated()))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 20,
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize('revert', "Revert File"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: untitled editors (revert closes them)
        contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 30,
        command: {
            id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
            title: nls.localize('saveAll', "Save All"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        // Editor Group
        when: fileConstants_1.OpenEditorsGroupContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 10,
        command: {
            id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
            title: nls.localize('compareWithSaved', "Compare with Saved"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.IsFileSystemResource, filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated(), listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareResourceCommand = {
        id: fileConstants_1.COMPARE_RESOURCE_COMMAND_ID,
        title: nls.localize('compareWithSelected', "Compare with Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const selectForCompareCommand = {
        id: fileConstants_1.SELECT_FOR_COMPARE_COMMAND_ID,
        title: nls.localize('compareSource', "Select for Compare")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareSelectedCommand = {
        id: fileConstants_1.COMPARE_SELECTED_COMMAND_ID,
        title: nls.localize('compareSelected', "Compare Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection, isFileOrUntitledResourceContextKey)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 10,
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize('close', "Close")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 20,
        command: {
            id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeOthers', "Close Others")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 30,
        command: {
            id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID,
            title: nls.localize('closeSaved', "Close Saved")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 40,
        command: {
            id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeAll', "Close All")
        }
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 4,
        command: {
            id: fileActions_1.NEW_FILE_COMMAND_ID,
            title: fileActions_1.NEW_FILE_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 6,
        command: {
            id: fileActions_1.NEW_FOLDER_COMMAND_ID,
            title: fileActions_1.NEW_FOLDER_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 20,
        command: {
            id: fileConstants_1.OPEN_WITH_EXPLORER_COMMAND_ID,
            title: nls.localize('explorerOpenWith', "Open With..."),
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerResourceAvailableEditorIdsContext),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 8,
        command: {
            id: CUT_FILE_ID,
            title: nls.localize('cut', "Cut")
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 10,
        command: {
            id: COPY_FILE_ID,
            title: fileActions_1.COPY_FILE_LABEL
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 20,
        command: {
            id: PASTE_FILE_ID,
            title: fileActions_1.PASTE_FILE_LABEL,
            precondition: contextkey_1.ContextKeyExpr.and(files_1.ExplorerResourceNotReadonlyContext, fileActions_1.FileCopiedContext)
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 10,
        command: {
            id: fileActions_1.DOWNLOAD_COMMAND_ID,
            title: fileActions_1.DOWNLOAD_LABEL
        },
        when: contextkey_1.ContextKeyExpr.or(
        // native: for any remote resource
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext.toNegated(), contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file)), 
        // web: for any files
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerRootContext.toNegated()), 
        // web: for any folders if file system API support is provided
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, contextkeys_1.HasWebFileSystemAccess))
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 20,
        command: {
            id: fileActions_1.UPLOAD_COMMAND_ID,
            title: fileActions_1.UPLOAD_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(
        // only in web
        contextkeys_2.IsWebContext, 
        // only on folders
        files_1.ExplorerFolderContext, 
        // only on editable folders
        files_1.ExplorerResourceNotReadonlyContext)
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 10,
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 30,
        command: {
            id: fileConstants_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
            title: fileConstants_1.REMOVE_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext, contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 10,
        command: {
            id: RENAME_ID,
            title: fileActions_1.TRIGGER_RENAME_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: MOVE_FILE_TO_TRASH_ID,
            title: fileActions_1.MOVE_FILE_TO_TRASH_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        alt: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash.toNegated())
    });
    // Empty Editor Group / Editor Tabs Container Context Menu
    for (const menuId of [actions_1.MenuId.EmptyEditorGroupContext, actions_1.MenuId.EditorTabsBarContext]) {
        actions_1.MenuRegistry.appendMenuItem(menuId, { command: { id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID, title: nls.localize('newFile', "New Text File") }, group: '1_file', order: 10 });
        actions_1.MenuRegistry.appendMenuItem(menuId, { command: { id: 'workbench.action.quickOpen', title: nls.localize('openFile', "Open File...") }, group: '1_file', order: 20 });
    }
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '1_new',
        command: {
            id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miNewFile', comment: ['&& denotes a mnemonic'] }, "&&New Text File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miSave', comment: ['&& denotes a mnemonic'] }, "&&Save"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAs', comment: ['&& denotes a mnemonic'] }, "Save &&As..."),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_ALL_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAll', comment: ['&& denotes a mnemonic'] }, "Save A&&ll"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '5_autosave',
        command: {
            id: fileActions_1.ToggleAutoSaveAction.ID,
            title: nls.localize({ key: 'miAutoSave', comment: ['&& denotes a mnemonic'] }, "A&&uto Save"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.files.autoSave', 'off')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miRevert', comment: ['&& denotes a mnemonic'] }, "Re&&vert File"),
            precondition: contextkey_1.ContextKeyExpr.or(
            // Active editor can revert
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorCanRevertContext), 
            // Explorer focused but not on untitled
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext)),
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize({ key: 'miCloseEditor', comment: ['&& denotes a mnemonic'] }, "&&Close Editor"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.FoldersViewVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.quickOpen',
            title: nls.localize({ key: 'miGotoFile', comment: ['&& denotes a mnemonic'] }, "Go to &&File...")
        },
        order: 1
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUFjdGlvbnMuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9maWxlcy9icm93c2VyL2ZpbGVBY3Rpb25zLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQThKaEcsNEVBU0M7SUFzQkQsd0RBVUM7SUE1S0QsNEJBQTRCO0lBRTVCLElBQUEseUJBQWUsRUFBQywwQ0FBNEIsQ0FBQyxDQUFDO0lBQzlDLElBQUEseUJBQWUsRUFBQyxnQ0FBa0IsQ0FBQyxDQUFDO0lBQ3BDLElBQUEseUJBQWUsRUFBQyxzQ0FBd0IsQ0FBQyxDQUFDO0lBQzFDLElBQUEseUJBQWUsRUFBQyx3Q0FBMEIsQ0FBQyxDQUFDO0lBQzVDLElBQUEseUJBQWUsRUFBQywrQ0FBaUMsQ0FBQyxDQUFDO0lBQ25ELElBQUEseUJBQWUsRUFBQyxrQ0FBb0IsQ0FBQyxDQUFDO0lBQ3RDLElBQUEseUJBQWUsRUFBQyw0Q0FBOEIsQ0FBQyxDQUFDO0lBQ2hELElBQUEseUJBQWUsRUFBQyw4Q0FBZ0MsQ0FBQyxDQUFDO0lBQ2xELElBQUEseUJBQWUsRUFBQywrQ0FBaUMsQ0FBQyxDQUFDO0lBQ25ELElBQUEseUJBQWUsRUFBQyxpREFBbUMsQ0FBQyxDQUFDO0lBQ3JELElBQUEseUJBQWUsRUFBQyxnREFBa0MsQ0FBQyxDQUFDO0lBRXBELFdBQVc7SUFDWCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsZ0NBQWlCLENBQUMsQ0FBQztJQUN6RSwyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsK0JBQWdCLENBQUMsQ0FBQztJQUV2RSxNQUFNLDJCQUEyQixHQUFHLEVBQUUsQ0FBQyxDQUFDLG1GQUFtRjtJQUUzSCxNQUFNLFNBQVMsR0FBRyxZQUFZ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