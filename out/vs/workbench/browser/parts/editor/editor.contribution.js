/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/browser/parts/editor/editorStatus", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/parts/editor/editorCommands", "./diffEditorCommands", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/workbench/browser/codeeditor", "vs/workbench/common/contributions", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/platform/quickinput/common/quickAccess", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/network", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/untitled/common/untitledTextEditorHandler", "vs/workbench/browser/parts/editor/editorConfiguration", "vs/workbench/browser/actions/layoutActions", "vs/editor/common/editorContextKeys"], function (require, exports, platform_1, nls_1, editor_1, editor_2, contextkeys_1, sideBySideEditorInput_1, textResourceEditor_1, sideBySideEditor_1, diffEditorInput_1, untitledTextEditorInput_1, textResourceEditorInput_1, textDiffEditor_1, binaryDiffEditor_1, editorStatus_1, actionCommonCategories_1, actions_1, descriptors_1, editorActions_1, editorCommands_1, diffEditorCommands_1, quickaccess_1, keybindingsRegistry_1, contextkey_1, platform_2, editorExtensions_1, codeeditor_1, contributions_1, editorAutoSave_1, quickAccess_1, editorQuickAccess_1, network_1, codicons_1, iconRegistry_1, untitledTextEditorHandler_1, editorConfiguration_1, layoutActions_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Editor Registrations
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textResourceEditor_1.TextResourceEditor, textResourceEditor_1.TextResourceEditor.ID, (0, nls_1.localize)('textEditor', "Text Editor")), [
        new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
        new descriptors_1.SyncDescriptor(textResourceEditorInput_1.TextResourceEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textDiffEditor_1.TextDiffEditor, textDiffEditor_1.TextDiffEditor.ID, (0, nls_1.localize)('textDiffEditor', "Text Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(binaryDiffEditor_1.BinaryResourceDiffEditor, binaryDiffEditor_1.BinaryResourceDiffEditor.ID, (0, nls_1.localize)('binaryDiffEditor', "Binary Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor")), [
        new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(untitledTextEditorInput_1.UntitledTextEditorInput.ID, untitledTextEditorHandler_1.UntitledTextEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(sideBySideEditorInput_1.SideBySideEditorInput.ID, sideBySideEditorInput_1.SideBySideEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(diffEditorInput_1.DiffEditorInput.ID, diffEditorInput_1.DiffEditorInputSerializer);
    //#endregion
    //#region Workbench Contributions
    (0, contributions_1.registerWorkbenchContribution2)(editorAutoSave_1.EditorAutoSave.ID, editorAutoSave_1.EditorAutoSave, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(editorStatus_1.EditorStatusContribution.ID, editorStatus_1.EditorStatusContribution, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(untitledTextEditorHandler_1.UntitledTextEditorWorkingCopyEditorHandler.ID, untitledTextEditorHandler_1.UntitledTextEditorWorkingCopyEditorHandler, 2 /* WorkbenchPhase.BlockRestore */);
    (0, contributions_1.registerWorkbenchContribution2)(editorConfiguration_1.DynamicEditorConfigurations.ID, editorConfiguration_1.DynamicEditorConfigurations, 2 /* WorkbenchPhase.BlockRestore */);
    (0, editorExtensions_1.registerEditorContribution)(codeeditor_1.FloatingEditorClickMenu.ID, codeeditor_1.FloatingEditorClickMenu, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    //#endregion
    //#region Quick Access
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    const editorPickerContextKey = 'inEditorsPicker';
    const editorPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(editorPickerContextKey));
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('activeGroupEditorsByMostRecentlyUsedQuickAccess', "Show Editors in Active Group by Most Recently Used"), commandId: editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByAppearanceQuickAccess', "Show All Opened Editors By Appearance"), commandId: editorActions_1.ShowAllEditorsByAppearanceAction.ID }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByMostRecentlyUsedQuickAccess', "Show All Opened Editors By Most Recently Used"), commandId: editorActions_1.ShowAllEditorsByMostRecentlyUsedAction.ID }]
    });
    //#endregion
    //#region Actions & Commands
    (0, actions_1.registerAction2)(editorStatus_1.ChangeLanguageAction);
    (0, actions_1.registerAction2)(editorStatus_1.ChangeEOLAction);
    (0, actions_1.registerAction2)(editorStatus_1.ChangeEncodingAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextEditor);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousEditor);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenFirstEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenLastEditorInGroup);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenNextRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.ReopenClosedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.ClearRecentFilesAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowAllEditorsByAppearanceAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowAllEditorsByMostRecentlyUsedAction);
    (0, actions_1.registerAction2)(editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseAllEditorsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseAllEditorGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseLeftEditorsInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseEditorsInOtherGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.CloseEditorInAllGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.RevertAndCloseEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorOrthogonalAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorRightAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorUpAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorDownAction);
    (0, actions_1.registerAction2)(editorActions_1.JoinTwoGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.JoinAllGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBetweenGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.ResetGroupSizesAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleGroupSizesAction);
    (0, actions_1.registerAction2)(editorActions_1.MaximizeGroupHideSidebarAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleMaximizeEditorGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MinimizeOtherGroupsAction);
    (0, actions_1.registerAction2)(editorActions_1.MinimizeOtherGroupsHideSidebarAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorLeftInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorRightInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupUpAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveGroupDownAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupUpAction);
    (0, actions_1.registerAction2)(editorActions_1.DuplicateGroupDownAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToPreviousGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToNextGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToLeftGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToRightGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToAboveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToBelowGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToPreviousGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToNextGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToLeftGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToRightGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToAboveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.SplitEditorToBelowGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusActiveGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusFirstGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusLastGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.FocusPreviousGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusNextGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusLeftGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusRightGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusAboveGroup);
    (0, actions_1.registerAction2)(editorActions_1.FocusBelowGroup);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupLeftAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupRightAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupAboveAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEditorGroupBelowAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousInEditsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateToLastEditLocationAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateForwardInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateBackwardsInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigatePreviousInNavigationsAction);
    (0, actions_1.registerAction2)(editorActions_1.NavigateToLastNavigationLocationAction);
    (0, actions_1.registerAction2)(editorActions_1.ClearEditorHistoryAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutSingleAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoColumnsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutThreeColumnsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoRowsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutThreeRowsAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoByTwoGridAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoRowsRightAction);
    (0, actions_1.registerAction2)(editorActions_1.EditorLayoutTwoColumnsBottomAction);
    (0, actions_1.registerAction2)(editorActions_1.ToggleEditorTypeAction);
    (0, actions_1.registerAction2)(editorActions_1.ReOpenInTextEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessLeastRecentlyUsedEditorAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessLeastRecentlyUsedEditorInGroupAction);
    (0, actions_1.registerAction2)(editorActions_1.QuickAccessPreviousEditorFromHistoryAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.CopyEditorToNewindowAction);
    (0, actions_1.registerAction2)(editorActions_1.MoveEditorGroupToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.CopyEditorGroupToNewWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.RestoreEditorsToMainWindowAction);
    (0, actions_1.registerAction2)(editorActions_1.NewEmptyEditorWindowAction);
    const quickAccessNavigateNextInEditorPickerId = 'workbench.action.quickOpenNavigateNextInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInEditorPickerId, true),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */ }
    });
    const quickAccessNavigatePreviousInEditorPickerId = 'workbench.action.quickOpenNavigatePreviousInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInEditorPickerId, false),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */ }
    });
    (0, editorCommands_1.setup)();
    //#endregion
    //#region Menus
    // macOS: Touchbar
    if (platform_2.isMacintosh) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateBackwardsAction.ID, title: editorActions_1.NavigateBackwardsAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/back-tb.png') } },
            group: 'navigation',
            order: 0
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateForwardAction.ID, title: editorActions_1.NavigateForwardAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/forward-tb.png') } },
            group: 'navigation',
            order: 1
        });
    }
    // Empty Editor Group Toolbar
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('lockGroupAction', "Lock Group"), icon: codicons_1.Codicon.unlock }, group: 'navigation', order: 10, when: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.ActiveEditorGroupLockedContext.toNegated()) });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('unlockGroupAction', "Unlock Group"), icon: codicons_1.Codicon.lock, toggled: contextkey_1.ContextKeyExpr.true() }, group: 'navigation', order: 10, when: contextkeys_1.ActiveEditorGroupLockedContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeGroupAction', "Close Group"), icon: codicons_1.Codicon.close }, group: 'navigation', order: 20, when: contextkey_1.ContextKeyExpr.or(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.EditorPartMultipleEditorGroupsContext) });
    // Empty Editor Group Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('newWindow', "New Window") }, group: '3_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('toggleLockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '4_lock', order: 10, when: contextkeys_1.IsAuxiliaryEditorPartContext.toNegated() /* already a primary action for aux windows */ });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '5_close', order: 10, when: contextkeys_1.MultipleEditorGroupsContext });
    // Editor Tab Container Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('moveEditorGroupToNewWindow', "Move into New Window") }, group: '3_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { command: { id: editorCommands_1.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('copyEditorGroupToNewWindow', "Copy into New Window") }, group: '3_window', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorTabsBarShowTabsSubmenu, title: (0, nls_1.localize)('tabBar', "Tab Bar"), group: '4_config', order: 10, when: contextkeys_1.InEditorZenModeContext.negate() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.ShowMultipleEditorTabsAction.ID, title: (0, nls_1.localize)('multipleTabs', "Multiple Tabs"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'multiple') }, group: '1_config', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.ShowSingleEditorTabAction.ID, title: (0, nls_1.localize)('singleTab', "Single Tab"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'single') }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsSubmenu, { command: { id: layoutActions_1.HideEditorTabsAction.ID, title: (0, nls_1.localize)('hideTabs', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none') }, group: '1_config', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, title: (0, nls_1.localize)('tabBar', "Tab Bar"), group: '4_config', order: 10, when: contextkeys_1.InEditorZenModeContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenShowMultipleEditorTabsAction.ID, title: (0, nls_1.localize)('multipleTabs', "Multiple Tabs"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'multiple') }, group: '1_config', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenShowSingleEditorTabAction.ID, title: (0, nls_1.localize)('singleTab', "Single Tab"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'single') }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarShowTabsZenModeSubmenu, { command: { id: layoutActions_1.ZenHideEditorTabsAction.ID, title: (0, nls_1.localize)('hideTabs', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.zenMode.showTabs', 'none') }, group: '1_config', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTabsBarContext, { submenu: actions_1.MenuId.EditorActionsPositionSubmenu, title: (0, nls_1.localize)('editorActionsPosition', "Editor Actions Position"), group: '4_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.EditorActionsDefaultAction.ID, title: (0, nls_1.localize)('tabBar', "Tab Bar"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'default') }, group: '1_config', order: 10, when: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none').negate() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.EditorActionsTitleBarAction.ID, title: (0, nls_1.localize)('titleBar', "Title Bar"), toggled: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'titleBar'), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.editor.showTabs', 'none'), contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'default'))) }, group: '1_config', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorActionsPositionSubmenu, { command: { id: layoutActions_1.HideEditorActionsAction.ID, title: (0, nls_1.localize)('hidden', "Hidden"), toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.editor.editorActionsLocation', 'hidden') }, group: '1_config', order: 30 });
    // Editor Title Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '1_close', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeOthers', "Close Others"), precondition: contextkeys_1.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: (0, nls_1.localize)('closeRight', "Close to the Right"), precondition: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() }, group: '1_close', order: 30, when: contextkeys_1.EditorTabsVisibleContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '1_close', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '1_close', order: 50 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: (0, nls_1.localize)('reopenWith', "Reopen Editor With...") }, group: '1_open', order: 10, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('keepOpen', "Keep Open"), precondition: contextkeys_1.ActiveEditorPinnedContext.toNegated() }, group: '3_preview', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('pin', "Pin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext.toNegated() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('unpin', "Unpin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '5_split', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '5_split', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '5_split', order: 30 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '5_split', order: 40 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_IN_GROUP, title: (0, nls_1.localize)('splitInGroup', "Split in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.ActiveEditorCanSplitInGroupContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.JOIN_EDITOR_IN_GROUP, title: (0, nls_1.localize)('joinInGroup', "Join in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.SideBySideEditorActiveContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('moveToNewWindow', "Move into New Window") }, group: '7_new_window', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, { command: { id: editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, title: (0, nls_1.localize)('copyToNewWindow', "Copy into New Window") }, group: '7_new_window', order: 20 });
    // Editor Title Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: diffEditorCommands_1.TOGGLE_DIFF_SIDE_BY_SIDE, title: (0, nls_1.localize)('inlineView', "Inline View"), toggled: contextkey_1.ContextKeyExpr.equals('config.diffEditor.renderSideBySide', false) }, group: '1_diff', order: 10, when: contextkey_1.ContextKeyExpr.has('isInDiffEditor') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.SHOW_EDITORS_IN_GROUP, title: (0, nls_1.localize)('showOpenedEditors', "Show Opened Editors") }, group: '3_open', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '5_close', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '5_close', order: 20 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_KEEP_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('togglePreviewMode', "Enable Preview Editors"), toggled: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') }, group: '7_settings', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP, title: (0, nls_1.localize)('maximizeGroup', "Maximize Group") }, group: '8_group_operations', order: 5, when: contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorPartMaximizedEditorGroupContext.negate(), contextkeys_1.EditorPartMultipleEditorGroupsContext) });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP, title: (0, nls_1.localize)('unmaximizeGroup', "Unmaximize Group") }, group: '8_group_operations', order: 5, when: contextkeys_1.EditorPartMaximizedEditorGroupContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('lockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '8_group_operations', order: 10, when: contextkeys_1.IsAuxiliaryEditorPartContext.toNegated() /* already a primary action for aux windows */ });
    function appendEditorToolItem(primary, when, order, alternative, precondition) {
        const item = {
            command: {
                id: primary.id,
                title: primary.title,
                icon: primary.icon,
                toggled: primary.toggled,
                precondition
            },
            group: 'navigation',
            when,
            order
        };
        if (alternative) {
            item.alt = {
                id: alternative.id,
                title: alternative.title,
                icon: alternative.icon
            };
        }
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, item);
    }
    const SPLIT_ORDER = 100000; // towards the end
    const CLOSE_ORDER = 1000000; // towards the far end
    // Editor Title Menu: Split Editor
    appendEditorToolItem({
        id: editorCommands_1.SPLIT_EDITOR,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    }, contextkey_1.ContextKeyExpr.not('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_DOWN,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    });
    appendEditorToolItem({
        id: editorCommands_1.SPLIT_EDITOR,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    }, contextkey_1.ContextKeyExpr.has('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_RIGHT,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    });
    // Side by side: layout
    appendEditorToolItem({
        id: editorCommands_1.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
        title: (0, nls_1.localize)('toggleSplitEditorInGroupLayout', "Toggle Layout"),
        icon: codicons_1.Codicon.editorLayout
    }, contextkeys_1.SideBySideEditorActiveContext, SPLIT_ORDER - 1);
    // Editor Title Menu: Close (tabs disabled, normal editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, dirty editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.closeDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinned
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Editor Title Menu: Close (tabs disabled, dirty & sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinnedDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Lock Group: only on auxiliary window and when group is unlocked
    appendEditorToolItem({
        id: editorCommands_1.LOCK_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('lockEditorGroup', "Lock Group"),
        icon: codicons_1.Codicon.unlock
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.IsAuxiliaryEditorPartContext, contextkeys_1.ActiveEditorGroupLockedContext.toNegated()), CLOSE_ORDER - 1);
    // Unlock Group: only when group is locked
    appendEditorToolItem({
        id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('unlockEditorGroup', "Unlock Group"),
        icon: codicons_1.Codicon.lock,
        toggled: contextkey_1.ContextKeyExpr.true()
    }, contextkeys_1.ActiveEditorGroupLockedContext, CLOSE_ORDER - 1);
    // Diff Editor Title Menu: Previous Change
    const previousChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-previous-change', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for the previous change action in the diff editor.'));
    appendEditorToolItem({
        id: diffEditorCommands_1.GOTO_PREVIOUS_CHANGE,
        title: (0, nls_1.localize)('navigate.prev.label', "Previous Change"),
        icon: previousChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 10, undefined, editorContextKeys_1.EditorContextKeys.hasChanges);
    // Diff Editor Title Menu: Next Change
    const nextChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-next-change', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for the next change action in the diff editor.'));
    appendEditorToolItem({
        id: diffEditorCommands_1.GOTO_NEXT_CHANGE,
        title: (0, nls_1.localize)('navigate.next.label', "Next Change"),
        icon: nextChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 11, undefined, editorContextKeys_1.EditorContextKeys.hasChanges);
    // Diff Editor Title Menu: Swap Sides
    appendEditorToolItem({
        id: diffEditorCommands_1.DIFF_SWAP_SIDES,
        title: (0, nls_1.localize)('swapDiffSides', "Swap Left and Right Side"),
        icon: codicons_1.Codicon.arrowSwap
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkeys_1.ActiveCompareEditorCanSwapContext), 15, undefined, undefined);
    const toggleWhitespace = (0, iconRegistry_1.registerIcon)('diff-editor-toggle-whitespace', codicons_1.Codicon.whitespace, (0, nls_1.localize)('toggleWhitespace', 'Icon for the toggle whitespace action in the diff editor.'));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: diffEditorCommands_1.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            title: (0, nls_1.localize)('ignoreTrimWhitespace.label', "Show Leading/Trailing Whitespace Differences"),
            icon: toggleWhitespace,
            precondition: contextkeys_1.TextCompareEditorActiveContext,
            toggled: contextkey_1.ContextKeyExpr.equals('config.diffEditor.ignoreTrimWhitespace', false),
        },
        group: 'navigation',
        when: contextkeys_1.TextCompareEditorActiveContext,
        order: 20,
    });
    // Editor Commands for Command Palette
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('keepEditor', 'Keep Editor'), category: actionCommonCategories_1.Categories.View }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('pinEditor', 'Pin Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('unpinEditor', 'Unpin Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('closeEditor', 'Close Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_PINNED_EDITOR_COMMAND_ID, title: (0, nls_1.localize2)('closePinnedEditor', 'Close Pinned Editor'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeEditorsInGroup', 'Close All Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize2)('closeSavedEditors', 'Close Saved Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeOtherEditors', 'Close Other Editors in Group'), category: actionCommonCategories_1.Categories.View } });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: (0, nls_1.localize2)('closeRightEditors', 'Close Editors to the Right in Group'), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, title: (0, nls_1.localize2)('closeEditorGroup', 'Close Editor Group'), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.MultipleEditorGroupsContext });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: (0, nls_1.localize2)('reopenWith', "Reopen Editor With..."), category: actionCommonCategories_1.Categories.View }, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarRecentMenu, {
        group: '1_editor',
        command: {
            id: editorActions_1.ReopenClosedEditorAction.ID,
            title: (0, nls_1.localize)({ key: 'miReopenClosedEditor', comment: ['&& denotes a mnemonic'] }, "&&Reopen Closed Editor"),
            precondition: contextkey_1.ContextKeyExpr.has('canReopenClosedEditor')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarRecentMenu, {
        group: 'z_clear',
        command: {
            id: editorActions_1.ClearRecentFilesAction.ID,
            title: (0, nls_1.localize)({ key: 'miClearRecentOpen', comment: ['&& denotes a mnemonic'] }, "&&Clear Recently Opened...")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        title: (0, nls_1.localize)('miShare', "Share"),
        submenu: actions_1.MenuId.MenubarShare,
        group: '45_share',
        order: 1,
    });
    // Layout menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: (0, nls_1.localize)({ key: 'miEditorLayout', comment: ['&& denotes a mnemonic'] }, "Editor &&Layout"),
        submenu: actions_1.MenuId.MenubarLayoutMenu,
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_UP,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorUpWithoutMnemonic', "Split Up"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorUp', comment: ['&& denotes a mnemonic'] }, "Split &&Up"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_DOWN,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorDownWithoutMnemonic', "Split Down"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorDown', comment: ['&& denotes a mnemonic'] }, "Split &&Down"),
            }
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_LEFT,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorLeftWithoutMnemonic', "Split Left"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorLeft', comment: ['&& denotes a mnemonic'] }, "Split &&Left"),
            }
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_RIGHT,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorRightWithoutMnemonic', "Split Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorRight', comment: ['&& denotes a mnemonic'] }, "Split &&Right"),
            }
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_IN_GROUP,
            title: {
                ...(0, nls_1.localize2)('miSplitEditorInGroupWithoutMnemonic', "Split in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Split in &&Group"),
            }
        },
        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.JOIN_EDITOR_IN_GROUP,
            title: {
                ...(0, nls_1.localize2)('miJoinEditorInGroupWithoutMnemonic', "Join in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miJoinEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Join in &&Group"),
            }
        },
        when: contextkeys_1.SideBySideEditorActiveContext,
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '3_new_window',
        command: {
            id: editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID,
            title: {
                ...(0, nls_1.localize2)('moveEditorToNewWindow', "Move Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor into New Window"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '3_new_window',
        command: {
            id: editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID,
            title: {
                ...(0, nls_1.localize2)('copyEditorToNewWindow', "Copy Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor into New Window"),
            }
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutSingleAction.ID,
            title: {
                ...(0, nls_1.localize2)('miSingleColumnEditorLayoutWithoutMnemonic', "Single"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSingleColumnEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Single"),
            }
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoColumnsEditorLayoutWithoutMnemonic', "Two Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Two Columns"),
            }
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeColumnsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miThreeColumnsEditorLayoutWithoutMnemonic', "Three Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&hree Columns"),
            }
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoRowsEditorLayoutWithoutMnemonic', "Two Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&wo Rows"),
            }
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeRowsAction.ID,
            title: {
                ...(0, nls_1.localize2)('miThreeRowsEditorLayoutWithoutMnemonic', "Three Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "Three &&Rows"),
            }
        },
        order: 6
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoByTwoGridAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoByTwoGridEditorLayoutWithoutMnemonic', "Grid (2x2)"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoByTwoGridEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Grid (2x2)"),
            }
        },
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsRightAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoRowsRightEditorLayoutWithoutMnemonic', "Two Rows Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsRightEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two R&&ows Right"),
            }
        },
        order: 8
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarLayoutMenu, {
        group: '4_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsBottomAction.ID,
            title: {
                ...(0, nls_1.localize2)('miTwoColumnsBottomEditorLayoutWithoutMnemonic', "Two Columns Bottom"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsBottomEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two &&Columns Bottom"),
            }
        },
        order: 9
    });
    // Main Menu Bar Contributions:
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateToLastEditLocation',
            title: (0, nls_1.localize)({ key: 'miLastEditLocation', comment: ['&& denotes a mnemonic'] }, "&&Last Edit Location"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateToLastEditLocation')
        },
        order: 3
    });
    // Switch Editor
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_FIRST_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miFirstSideEditor', comment: ['&& denotes a mnemonic'] }, "&&First Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_SECOND_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miSecondSideEditor', comment: ['&& denotes a mnemonic'] }, "&&Second Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.nextEditor',
            title: (0, nls_1.localize)({ key: 'miNextEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Editor")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.previousEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miNextRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.nextEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Editor in Group")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.previousEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor in Group")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor in Group")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor in Group")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchEditor', comment: ['&& denotes a mnemonic'] }, "Switch &&Editor"),
        submenu: actions_1.MenuId.MenubarSwitchEditorMenu,
        order: 1
    });
    // Switch Group
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFirstEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFirstGroup', comment: ['&& denotes a mnemonic'] }, "Group &&1")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusSecondEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusSecondGroup', comment: ['&& denotes a mnemonic'] }, "Group &&2")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusThirdEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusThirdGroup', comment: ['&& denotes a mnemonic'] }, "Group &&3"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFourthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFourthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&4"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFifthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFifthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&5"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusNextGroup',
            title: (0, nls_1.localize)({ key: 'miNextGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusPreviousGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusLeftGroup',
            title: (0, nls_1.localize)({ key: 'miFocusLeftGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Left"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusRightGroup',
            title: (0, nls_1.localize)({ key: 'miFocusRightGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Right"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusAboveGroup',
            title: (0, nls_1.localize)({ key: 'miFocusAboveGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Above"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusBelowGroup',
            title: (0, nls_1.localize)({ key: 'miFocusBelowGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Below"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchGroup', comment: ['&& denotes a mnemonic'] }, "Switch &&Group"),
        submenu: actions_1.MenuId.MenubarSwitchGroupMenu,
        order: 2
    });
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF3RWhHLDhCQUE4QjtJQUU5QixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQy9FLDZCQUFvQixDQUFDLE1BQU0sQ0FDMUIsdUNBQWtCLEVBQ2xCLHVDQUFrQixDQUFDLEVBQUUsRUFDckIsSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxDQUNyQyxFQUNEO1FBQ0MsSUFBSSw0QkFBYyxDQUFDLGlEQUF1QixDQUFDO1FBQzNDLElBQUksNEJBQWMsQ0FBQyxpREFBdUIsQ0FBQztLQUMzQyxDQUNELENBQUM7SUFFRixtQkFBUSxDQUFDLEVBQUUsQ0FBc0IseUJBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsa0JBQWtCLENBQy9FLDZCQUFvQixDQUFDLE1BQU0sQ0FDMUIsK0JBQWMsRUFDZCwrQkFBYyxDQUFDLEVBQUUsRUFDakIsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQ0FDOUMsRUFDRDtRQUNDLElBQUksNEJBQWMsQ0FBQyxpQ0FBZSxDQUFDO0tBQ25DLENBQ0QsQ0FBQztJQUVGLG1CQUFRLENBQUMsRUFBRSxDQUFzQix5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxrQkFBa0IsQ0FDL0UsNkJBQW9CLENBQUMsTUFBTSxDQUMxQiwyQ0FBd0IsRUFDeEIsMkNBQXdCLENBQUMsRUFBRSxFQUMzQixJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUNsRCxFQUNEO1FBQ0Ms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