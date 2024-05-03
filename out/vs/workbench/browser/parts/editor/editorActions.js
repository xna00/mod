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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/workspaces/common/workspaces", "vs/platform/dialogs/common/dialogs", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/keyCodes", "vs/platform/log/common/log", "vs/platform/action/common/actionCommonCategories", "vs/workbench/common/contextkeys", "vs/base/browser/dom"], function (require, exports, nls_1, actions_1, arrays_1, editor_1, sideBySideEditorInput_1, layoutService_1, history_1, keybinding_1, commands_1, editorCommands_1, editorGroupsService_1, editorService_1, configuration_1, workspaces_1, dialogs_1, quickInput_1, editorQuickAccess_1, codicons_1, themables_1, filesConfigurationService_1, editorResolverService_1, platform_1, actions_2, contextkey_1, keyCodes_1, log_1, actionCommonCategories_1, contextkeys_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewEmptyEditorWindowAction = exports.RestoreEditorsToMainWindowAction = exports.CopyEditorGroupToNewWindowAction = exports.MoveEditorGroupToNewWindowAction = exports.CopyEditorToNewindowAction = exports.MoveEditorToNewWindowAction = exports.ReOpenInTextEditorAction = exports.ToggleEditorTypeAction = exports.NewEditorGroupBelowAction = exports.NewEditorGroupAboveAction = exports.NewEditorGroupRightAction = exports.NewEditorGroupLeftAction = exports.EditorLayoutTwoRowsRightAction = exports.EditorLayoutTwoColumnsBottomAction = exports.EditorLayoutTwoByTwoGridAction = exports.EditorLayoutThreeRowsAction = exports.EditorLayoutTwoRowsAction = exports.EditorLayoutThreeColumnsAction = exports.EditorLayoutTwoColumnsAction = exports.EditorLayoutSingleAction = exports.SplitEditorToLastGroupAction = exports.SplitEditorToFirstGroupAction = exports.SplitEditorToRightGroupAction = exports.SplitEditorToLeftGroupAction = exports.SplitEditorToBelowGroupAction = exports.SplitEditorToAboveGroupAction = exports.SplitEditorToNextGroupAction = exports.SplitEditorToPreviousGroupAction = exports.MoveEditorToLastGroupAction = exports.MoveEditorToFirstGroupAction = exports.MoveEditorToRightGroupAction = exports.MoveEditorToLeftGroupAction = exports.MoveEditorToBelowGroupAction = exports.MoveEditorToAboveGroupAction = exports.MoveEditorToNextGroupAction = exports.MoveEditorToPreviousGroupAction = exports.MoveEditorRightInGroupAction = exports.MoveEditorLeftInGroupAction = exports.ClearEditorHistoryAction = exports.OpenPreviousRecentlyUsedEditorInGroupAction = exports.OpenNextRecentlyUsedEditorInGroupAction = exports.OpenPreviousRecentlyUsedEditorAction = exports.OpenNextRecentlyUsedEditorAction = exports.QuickAccessPreviousEditorFromHistoryAction = exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = exports.QuickAccessLeastRecentlyUsedEditorAction = exports.QuickAccessPreviousRecentlyUsedEditorAction = exports.ShowAllEditorsByMostRecentlyUsedAction = exports.ShowAllEditorsByAppearanceAction = exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = exports.ClearRecentFilesAction = exports.ReopenClosedEditorAction = exports.NavigateToLastNavigationLocationAction = exports.NavigatePreviousInNavigationsAction = exports.NavigateBackwardsInNavigationsAction = exports.NavigateForwardInNavigationsAction = exports.NavigateToLastEditLocationAction = exports.NavigatePreviousInEditsAction = exports.NavigateBackwardsInEditsAction = exports.NavigateForwardInEditsAction = exports.NavigatePreviousAction = exports.NavigateBackwardsAction = exports.NavigateForwardAction = exports.OpenLastEditorInGroup = exports.OpenFirstEditorInGroup = exports.OpenPreviousEditorInGroup = exports.OpenNextEditorInGroup = exports.OpenPreviousEditor = exports.OpenNextEditor = exports.ToggleMaximizeEditorGroupAction = exports.MaximizeGroupHideSidebarAction = exports.ToggleGroupSizesAction = exports.ResetGroupSizesAction = exports.MinimizeOtherGroupsHideSidebarAction = exports.MinimizeOtherGroupsAction = exports.DuplicateGroupDownAction = exports.DuplicateGroupUpAction = exports.DuplicateGroupRightAction = exports.DuplicateGroupLeftAction = exports.MoveGroupDownAction = exports.MoveGroupUpAction = exports.MoveGroupRightAction = exports.MoveGroupLeftAction = exports.CloseEditorInAllGroupsAction = exports.CloseEditorsInOtherGroupsAction = exports.CloseAllEditorGroupsAction = exports.CloseAllEditorsAction = exports.CloseLeftEditorsInGroupAction = exports.RevertAndCloseEditorAction = exports.CloseOneEditorAction = exports.UnpinEditorAction = exports.CloseEditorAction = exports.FocusBelowGroup = exports.FocusAboveGroup = exports.FocusRightGroup = exports.FocusLeftGroup = exports.FocusPreviousGroup = exports.FocusNextGroup = exports.FocusLastGroupAction = exports.FocusFirstGroupAction = exports.FocusActiveGroupAction = exports.NavigateBetweenGroupsAction = exports.JoinAllGroupsAction = exports.JoinTwoGroupsAction = exports.SplitEditorDownAction = exports.SplitEditorUpAction = exports.SplitEditorRightAction = exports.SplitEditorLeftAction = exports.SplitEditorOrthogonalAction = exports.SplitEditorAction = void 0;
    class ExecuteCommandAction extends actions_2.Action2 {
        constructor(desc, commandId, commandArgs) {
            super(desc);
            this.commandId = commandId;
            this.commandArgs = commandArgs;
        }
        run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(this.commandId, this.commandArgs);
        }
    }
    class AbstractSplitEditorAction extends actions_2.Action2 {
        getDirection(configurationService) {
            return (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            (0, editorCommands_1.splitEditor)(editorGroupService, this.getDirection(configurationService), context);
        }
    }
    class SplitEditorAction extends AbstractSplitEditorAction {
        static { this.ID = editorCommands_1.SPLIT_EDITOR; }
        constructor() {
            super({
                id: SplitEditorAction.ID,
                title: (0, nls_1.localize2)('splitEditor', 'Split Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
    }
    exports.SplitEditorAction = SplitEditorAction;
    class SplitEditorOrthogonalAction extends AbstractSplitEditorAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorOrthogonal',
                title: (0, nls_1.localize2)('splitEditorOrthogonal', 'Split Editor Orthogonal'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        getDirection(configurationService) {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
            return direction === 3 /* GroupDirection.RIGHT */ ? 1 /* GroupDirection.DOWN */ : 3 /* GroupDirection.RIGHT */;
        }
    }
    exports.SplitEditorOrthogonalAction = SplitEditorOrthogonalAction;
    class SplitEditorLeftAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_LEFT,
                title: (0, nls_1.localize2)('splitEditorGroupLeft', 'Split Editor Left'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_LEFT);
        }
    }
    exports.SplitEditorLeftAction = SplitEditorLeftAction;
    class SplitEditorRightAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_RIGHT,
                title: (0, nls_1.localize2)('splitEditorGroupRight', 'Split Editor Right'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_RIGHT);
        }
    }
    exports.SplitEditorRightAction = SplitEditorRightAction;
    class SplitEditorUpAction extends ExecuteCommandAction {
        static { this.LABEL = (0, nls_1.localize)('splitEditorGroupUp', "Split Editor Up"); }
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_UP,
                title: (0, nls_1.localize2)('splitEditorGroupUp', "Split Editor Up"),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_UP);
        }
    }
    exports.SplitEditorUpAction = SplitEditorUpAction;
    class SplitEditorDownAction extends ExecuteCommandAction {
        static { this.LABEL = (0, nls_1.localize)('splitEditorGroupDown', "Split Editor Down"); }
        constructor() {
            super({
                id: editorCommands_1.SPLIT_EDITOR_DOWN,
                title: (0, nls_1.localize2)('splitEditorGroupDown', "Split Editor Down"),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 93 /* KeyCode.Backslash */)
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.SPLIT_EDITOR_DOWN);
        }
    }
    exports.SplitEditorDownAction = SplitEditorDownAction;
    class JoinTwoGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.joinTwoGroups',
                title: (0, nls_1.localize2)('joinTwoGroups', 'Join Editor Group with Next Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                const targetGroupDirections = [3 /* GroupDirection.RIGHT */, 1 /* GroupDirection.DOWN */, 2 /* GroupDirection.LEFT */, 0 /* GroupDirection.UP */];
                for (const targetGroupDirection of targetGroupDirections) {
                    const targetGroup = editorGroupService.findGroup({ direction: targetGroupDirection }, sourceGroup);
                    if (targetGroup && sourceGroup !== targetGroup) {
                        editorGroupService.mergeGroup(sourceGroup, targetGroup);
                        break;
                    }
                }
            }
        }
    }
    exports.JoinTwoGroupsAction = JoinTwoGroupsAction;
    class JoinAllGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.joinAllGroups',
                title: (0, nls_1.localize2)('joinAllGroups', 'Join All Editor Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.mergeAllGroups(editorGroupService.activeGroup);
        }
    }
    exports.JoinAllGroupsAction = JoinAllGroupsAction;
    class NavigateBetweenGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateEditorGroups',
                title: (0, nls_1.localize2)('navigateEditorGroups', 'Navigate Between Editor Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const nextGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, editorGroupService.activeGroup, true);
            nextGroup?.focus();
        }
    }
    exports.NavigateBetweenGroupsAction = NavigateBetweenGroupsAction;
    class FocusActiveGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusActiveEditorGroup',
                title: (0, nls_1.localize2)('focusActiveEditorGroup', 'Focus Active Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.activeGroup.focus();
        }
    }
    exports.FocusActiveGroupAction = FocusActiveGroupAction;
    class AbstractFocusGroupAction extends actions_2.Action2 {
        constructor(desc, scope) {
            super(desc);
            this.scope = scope;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const group = editorGroupService.findGroup(this.scope, editorGroupService.activeGroup, true);
            group?.focus();
        }
    }
    class FocusFirstGroupAction extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusFirstEditorGroup',
                title: (0, nls_1.localize2)('focusFirstEditorGroup', 'Focus First Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */
                },
                category: actionCommonCategories_1.Categories.View
            }, { location: 0 /* GroupLocation.FIRST */ });
        }
    }
    exports.FocusFirstGroupAction = FocusFirstGroupAction;
    class FocusLastGroupAction extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusLastEditorGroup',
                title: (0, nls_1.localize2)('focusLastEditorGroup', 'Focus Last Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 1 /* GroupLocation.LAST */ });
        }
    }
    exports.FocusLastGroupAction = FocusLastGroupAction;
    class FocusNextGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusNextGroup',
                title: (0, nls_1.localize2)('focusNextGroup', 'Focus Next Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 2 /* GroupLocation.NEXT */ });
        }
    }
    exports.FocusNextGroup = FocusNextGroup;
    class FocusPreviousGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusPreviousGroup',
                title: (0, nls_1.localize2)('focusPreviousGroup', 'Focus Previous Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, { location: 3 /* GroupLocation.PREVIOUS */ });
        }
    }
    exports.FocusPreviousGroup = FocusPreviousGroup;
    class FocusLeftGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusLeftGroup',
                title: (0, nls_1.localize2)('focusLeftGroup', 'Focus Left Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 2 /* GroupDirection.LEFT */ });
        }
    }
    exports.FocusLeftGroup = FocusLeftGroup;
    class FocusRightGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusRightGroup',
                title: (0, nls_1.localize2)('focusRightGroup', 'Focus Right Editor Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 3 /* GroupDirection.RIGHT */ });
        }
    }
    exports.FocusRightGroup = FocusRightGroup;
    class FocusAboveGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusAboveGroup',
                title: (0, nls_1.localize2)('focusAboveGroup', 'Focus Editor Group Above'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 0 /* GroupDirection.UP */ });
        }
    }
    exports.FocusAboveGroup = FocusAboveGroup;
    class FocusBelowGroup extends AbstractFocusGroupAction {
        constructor() {
            super({
                id: 'workbench.action.focusBelowGroup',
                title: (0, nls_1.localize2)('focusBelowGroup', 'Focus Editor Group Below'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, { direction: 1 /* GroupDirection.DOWN */ });
        }
    }
    exports.FocusBelowGroup = FocusBelowGroup;
    let CloseEditorAction = class CloseEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.closeActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('closeEditor', "Close Editor"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close));
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    exports.CloseEditorAction = CloseEditorAction;
    exports.CloseEditorAction = CloseEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseEditorAction);
    let UnpinEditorAction = class UnpinEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.unpinActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('unpinEditor', "Unpin Editor"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.pinned));
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.UNPIN_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    exports.UnpinEditorAction = UnpinEditorAction;
    exports.UnpinEditorAction = UnpinEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], UnpinEditorAction);
    let CloseOneEditorAction = class CloseOneEditorAction extends actions_1.Action {
        static { this.ID = 'workbench.action.closeActiveEditor'; }
        static { this.LABEL = (0, nls_1.localize)('closeOneEditor', "Close"); }
        constructor(id, label, editorGroupService) {
            super(id, label, themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close));
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            let group;
            let editorIndex;
            if (context) {
                group = this.editorGroupService.getGroup(context.groupId);
                if (group) {
                    editorIndex = context.editorIndex; // only allow editor at index if group is valid
                }
            }
            if (!group) {
                group = this.editorGroupService.activeGroup;
            }
            // Close specific editor in group
            if (typeof editorIndex === 'number') {
                const editorAtIndex = group.getEditorByIndex(editorIndex);
                if (editorAtIndex) {
                    await group.closeEditor(editorAtIndex, { preserveFocus: context?.preserveFocus });
                    return;
                }
            }
            // Otherwise close active editor in group
            if (group.activeEditor) {
                await group.closeEditor(group.activeEditor, { preserveFocus: context?.preserveFocus });
                return;
            }
        }
    };
    exports.CloseOneEditorAction = CloseOneEditorAction;
    exports.CloseOneEditorAction = CloseOneEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseOneEditorAction);
    class RevertAndCloseEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.revertAndCloseActiveEditor',
                title: (0, nls_1.localize2)('revertAndCloseActiveEditor', 'Revert and Close Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const logService = accessor.get(log_1.ILogService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.input;
                const group = activeEditorPane.group;
                // first try a normal revert where the contents of the editor are restored
                try {
                    await editorService.revert({ editor, groupId: group.id });
                }
                catch (error) {
                    logService.error(error);
                    // if that fails, since we are about to close the editor, we accept that
                    // the editor cannot be reverted and instead do a soft revert that just
                    // enables us to close the editor. With this, a user can always close a
                    // dirty editor even when reverting fails.
                    await editorService.revert({ editor, groupId: group.id }, { soft: true });
                }
                await group.closeEditor(editor);
            }
        }
    }
    exports.RevertAndCloseEditorAction = RevertAndCloseEditorAction;
    class CloseLeftEditorsInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorsToTheLeft',
                title: (0, nls_1.localize2)('closeEditorsToTheLeft', 'Close Editors to the Left in Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = this.getTarget(editorGroupService, context);
            if (group && editor) {
                await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: editor, excludeSticky: true });
            }
        }
        getTarget(editorGroupService, context) {
            if (context) {
                return { editor: context.editor, group: editorGroupService.getGroup(context.groupId) };
            }
            // Fallback to active group
            return { group: editorGroupService.activeGroup, editor: editorGroupService.activeGroup.activeEditor };
        }
    }
    exports.CloseLeftEditorsInGroupAction = CloseLeftEditorsInGroupAction;
    class AbstractCloseAllAction extends actions_2.Action2 {
        groupsToClose(editorGroupService) {
            const groupsToClose = [];
            // Close editors in reverse order of their grid appearance so that the editor
            // group that is the first (top-left) remains. This helps to keep view state
            // for editors around that have been opened in this visually first group.
            const groups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            for (let i = groups.length - 1; i >= 0; i--) {
                groupsToClose.push(groups[i]);
            }
            return groupsToClose;
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const filesConfigurationService = accessor.get(filesConfigurationService_1.IFilesConfigurationService);
            const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
            // Depending on the editor and auto save configuration,
            // split editors into buckets for handling confirmation
            const dirtyEditorsWithDefaultConfirm = new Set();
            const dirtyAutoSaveOnFocusChangeEditors = new Set();
            const dirtyAutoSaveOnWindowChangeEditors = new Set();
            const editorsWithCustomConfirm = new Map();
            for (const { editor, groupId } of editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: this.excludeSticky })) {
                let confirmClose = false;
                if (editor.closeHandler) {
                    confirmClose = editor.closeHandler.showConfirm(); // custom handling of confirmation on close
                }
                else {
                    confirmClose = editor.isDirty() && !editor.isSaving(); // default confirm only when dirty and not saving
                }
                if (!confirmClose) {
                    continue;
                }
                // Editor has custom confirm implementation
                if (typeof editor.closeHandler?.confirm === 'function') {
                    let customEditorsToConfirm = editorsWithCustomConfirm.get(editor.typeId);
                    if (!customEditorsToConfirm) {
                        customEditorsToConfirm = new Set();
                        editorsWithCustomConfirm.set(editor.typeId, customEditorsToConfirm);
                    }
                    customEditorsToConfirm.add({ editor, groupId });
                }
                // Editor will be saved on focus change when a
                // dialog appears, so just track that separate
                else if (!editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && filesConfigurationService.getAutoSaveMode(editor).mode === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */) {
                    dirtyAutoSaveOnFocusChangeEditors.add({ editor, groupId });
                }
                // Windows, Linux: editor will be saved on window change
                // when a native dialog appears, so just track that separate
                // (see https://github.com/microsoft/vscode/issues/134250)
                else if ((platform_1.isNative && (platform_1.isWindows || platform_1.isLinux)) && !editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && filesConfigurationService.getAutoSaveMode(editor).mode === 4 /* AutoSaveMode.ON_WINDOW_CHANGE */) {
                    dirtyAutoSaveOnWindowChangeEditors.add({ editor, groupId });
                }
                // Editor will show in generic file based dialog
                else {
                    dirtyEditorsWithDefaultConfirm.add({ editor, groupId });
                }
            }
            // 1.) Show default file based dialog
            if (dirtyEditorsWithDefaultConfirm.size > 0) {
                const editors = Array.from(dirtyEditorsWithDefaultConfirm.values());
                await this.revealEditorsToConfirm(editors, editorGroupService); // help user make a decision by revealing editors
                const confirmation = await fileDialogService.showSaveConfirm(editors.map(({ editor }) => {
                    if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                        return editor.primary.getName(); // prefer shorter names by using primary's name in this case
                    }
                    return editor.getName();
                }));
                switch (confirmation) {
                    case 2 /* ConfirmResult.CANCEL */:
                        return;
                    case 1 /* ConfirmResult.DONT_SAVE */:
                        await editorService.revert(editors, { soft: true });
                        break;
                    case 0 /* ConfirmResult.SAVE */:
                        await editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                        break;
                }
            }
            // 2.) Show custom confirm based dialog
            for (const [, editorIdentifiers] of editorsWithCustomConfirm) {
                const editors = Array.from(editorIdentifiers.values());
                await this.revealEditorsToConfirm(editors, editorGroupService); // help user make a decision by revealing editors
                const confirmation = await (0, arrays_1.firstOrDefault)(editors)?.editor.closeHandler?.confirm?.(editors);
                if (typeof confirmation === 'number') {
                    switch (confirmation) {
                        case 2 /* ConfirmResult.CANCEL */:
                            return;
                        case 1 /* ConfirmResult.DONT_SAVE */:
                            await editorService.revert(editors, { soft: true });
                            break;
                        case 0 /* ConfirmResult.SAVE */:
                            await editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                            break;
                    }
                }
            }
            // 3.) Save autosaveable editors (focus change)
            if (dirtyAutoSaveOnFocusChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnFocusChangeEditors.values());
                await editorService.save(editors, { reason: 3 /* SaveReason.FOCUS_CHANGE */ });
            }
            // 4.) Save autosaveable editors (window change)
            if (dirtyAutoSaveOnWindowChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnWindowChangeEditors.values());
                await editorService.save(editors, { reason: 4 /* SaveReason.WINDOW_CHANGE */ });
            }
            // 5.) Finally close all editors: even if an editor failed to
            // save or revert and still reports dirty, the editor part makes
            // sure to bring up another confirm dialog for those editors
            // specifically.
            return this.doCloseAll(editorGroupService);
        }
        async revealEditorsToConfirm(editors, editorGroupService) {
            try {
                const handledGroups = new Set();
                for (const { editor, groupId } of editors) {
                    if (handledGroups.has(groupId)) {
                        continue;
                    }
                    handledGroups.add(groupId);
                    const group = editorGroupService.getGroup(groupId);
                    await group?.openEditor(editor);
                }
            }
            catch (error) {
                // ignore any error as the revealing is just convinience
            }
        }
        async doCloseAll(editorGroupService) {
            await Promise.all(this.groupsToClose(editorGroupService).map(group => group.closeAllEditors({ excludeSticky: this.excludeSticky })));
        }
    }
    class CloseAllEditorsAction extends AbstractCloseAllAction {
        static { this.ID = 'workbench.action.closeAllEditors'; }
        static { this.LABEL = (0, nls_1.localize2)('closeAllEditors', 'Close All Editors'); }
        constructor() {
            super({
                id: CloseAllEditorsAction.ID,
                title: CloseAllEditorsAction.LABEL,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */)
                },
                icon: codicons_1.Codicon.closeAll,
                category: actionCommonCategories_1.Categories.View
            });
        }
        get excludeSticky() {
            return true; // exclude sticky from this mass-closing operation
        }
    }
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    class CloseAllEditorGroupsAction extends AbstractCloseAllAction {
        constructor() {
            super({
                id: 'workbench.action.closeAllGroups',
                title: (0, nls_1.localize2)('closeAllGroups', 'Close All Editor Groups'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */)
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        get excludeSticky() {
            return false; // the intent to close groups means, even sticky are included
        }
        async doCloseAll(editorGroupService) {
            await super.doCloseAll(editorGroupService);
            for (const groupToClose of this.groupsToClose(editorGroupService)) {
                editorGroupService.removeGroup(groupToClose);
            }
        }
    }
    exports.CloseAllEditorGroupsAction = CloseAllEditorGroupsAction;
    class CloseEditorsInOtherGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorsInOtherGroups',
                title: (0, nls_1.localize2)('closeEditorsInOtherGroups', 'Close Editors in Other Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const groupToSkip = context ? editorGroupService.getGroup(context.groupId) : editorGroupService.activeGroup;
            await Promise.all(editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(async (group) => {
                if (groupToSkip && group.id === groupToSkip.id) {
                    return;
                }
                return group.closeAllEditors({ excludeSticky: true });
            }));
        }
    }
    exports.CloseEditorsInOtherGroupsAction = CloseEditorsInOtherGroupsAction;
    class CloseEditorInAllGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeEditorInAllGroups',
                title: (0, nls_1.localize2)('closeEditorInAllGroups', 'Close Editor in All Groups'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor) {
                await Promise.all(editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(group => group.closeEditor(activeEditor)));
            }
        }
    }
    exports.CloseEditorInAllGroupsAction = CloseEditorInAllGroupsAction;
    class AbstractMoveCopyGroupAction extends actions_2.Action2 {
        constructor(desc, direction, isMove) {
            super(desc);
            this.direction = direction;
            this.isMove = isMove;
        }
        async run(accessor, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                let resultGroup = undefined;
                if (this.isMove) {
                    const targetGroup = this.findTargetGroup(editorGroupService, sourceGroup);
                    if (targetGroup) {
                        resultGroup = editorGroupService.moveGroup(sourceGroup, targetGroup, this.direction);
                    }
                }
                else {
                    resultGroup = editorGroupService.copyGroup(sourceGroup, sourceGroup, this.direction);
                }
                if (resultGroup) {
                    editorGroupService.activateGroup(resultGroup);
                }
            }
        }
        findTargetGroup(editorGroupService, sourceGroup) {
            const targetNeighbours = [this.direction];
            // Allow the target group to be in alternative locations to support more
            // scenarios of moving the group to the taret location.
            // Helps for https://github.com/microsoft/vscode/issues/50741
            switch (this.direction) {
                case 2 /* GroupDirection.LEFT */:
                case 3 /* GroupDirection.RIGHT */:
                    targetNeighbours.push(0 /* GroupDirection.UP */, 1 /* GroupDirection.DOWN */);
                    break;
                case 0 /* GroupDirection.UP */:
                case 1 /* GroupDirection.DOWN */:
                    targetNeighbours.push(2 /* GroupDirection.LEFT */, 3 /* GroupDirection.RIGHT */);
                    break;
            }
            for (const targetNeighbour of targetNeighbours) {
                const targetNeighbourGroup = editorGroupService.findGroup({ direction: targetNeighbour }, sourceGroup);
                if (targetNeighbourGroup) {
                    return targetNeighbourGroup;
                }
            }
            return undefined;
        }
    }
    class AbstractMoveGroupAction extends AbstractMoveCopyGroupAction {
        constructor(desc, direction) {
            super(desc, direction, true);
        }
    }
    class MoveGroupLeftAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupLeft',
                title: (0, nls_1.localize2)('moveActiveGroupLeft', 'Move Editor Group Left'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 15 /* KeyCode.LeftArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.MoveGroupLeftAction = MoveGroupLeftAction;
    class MoveGroupRightAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupRight',
                title: (0, nls_1.localize2)('moveActiveGroupRight', 'Move Editor Group Right'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 17 /* KeyCode.RightArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.MoveGroupRightAction = MoveGroupRightAction;
    class MoveGroupUpAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupUp',
                title: (0, nls_1.localize2)('moveActiveGroupUp', 'Move Editor Group Up'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 16 /* KeyCode.UpArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.MoveGroupUpAction = MoveGroupUpAction;
    class MoveGroupDownAction extends AbstractMoveGroupAction {
        constructor() {
            super({
                id: 'workbench.action.moveActiveEditorGroupDown',
                title: (0, nls_1.localize2)('moveActiveGroupDown', 'Move Editor Group Down'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 18 /* KeyCode.DownArrow */)
                },
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.MoveGroupDownAction = MoveGroupDownAction;
    class AbstractDuplicateGroupAction extends AbstractMoveCopyGroupAction {
        constructor(desc, direction) {
            super(desc, direction, false);
        }
    }
    class DuplicateGroupLeftAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupLeft',
                title: (0, nls_1.localize2)('duplicateActiveGroupLeft', 'Duplicate Editor Group Left'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.DuplicateGroupLeftAction = DuplicateGroupLeftAction;
    class DuplicateGroupRightAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupRight',
                title: (0, nls_1.localize2)('duplicateActiveGroupRight', 'Duplicate Editor Group Right'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.DuplicateGroupRightAction = DuplicateGroupRightAction;
    class DuplicateGroupUpAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupUp',
                title: (0, nls_1.localize2)('duplicateActiveGroupUp', 'Duplicate Editor Group Up'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.DuplicateGroupUpAction = DuplicateGroupUpAction;
    class DuplicateGroupDownAction extends AbstractDuplicateGroupAction {
        constructor() {
            super({
                id: 'workbench.action.duplicateActiveEditorGroupDown',
                title: (0, nls_1.localize2)('duplicateActiveGroupDown', 'Duplicate Editor Group Down'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.DuplicateGroupDownAction = DuplicateGroupDownAction;
    class MinimizeOtherGroupsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.minimizeOtherEditors',
                title: (0, nls_1.localize2)('minimizeOtherEditorGroups', 'Expand Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.MultipleEditorGroupsContext
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
        }
    }
    exports.MinimizeOtherGroupsAction = MinimizeOtherGroupsAction;
    class MinimizeOtherGroupsHideSidebarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.minimizeOtherEditorsHideSidebar',
                title: (0, nls_1.localize2)('minimizeOtherEditorGroupsHideSidebar', 'Expand Editor Group and Hide Side Bars'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.MultipleEditorGroupsContext, contextkeys_1.SideBarVisibleContext, contextkeys_1.AuxiliaryBarVisibleContext)
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            layoutService.setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            editorGroupService.arrangeGroups(1 /* GroupsArrangement.EXPAND */);
        }
    }
    exports.MinimizeOtherGroupsHideSidebarAction = MinimizeOtherGroupsHideSidebarAction;
    class ResetGroupSizesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.evenEditorWidths',
                title: (0, nls_1.localize2)('evenEditorGroups', 'Reset Editor Group Sizes'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.arrangeGroups(2 /* GroupsArrangement.EVEN */);
        }
    }
    exports.ResetGroupSizesAction = ResetGroupSizesAction;
    class ToggleGroupSizesAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorWidths',
                title: (0, nls_1.localize2)('toggleEditorWidths', 'Toggle Editor Group Sizes'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.toggleExpandGroup();
        }
    }
    exports.ToggleGroupSizesAction = ToggleGroupSizesAction;
    class MaximizeGroupHideSidebarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.maximizeEditorHideSidebar',
                title: (0, nls_1.localize2)('maximizeEditorHideSidebar', 'Maximize Editor Group and Hide Side Bars'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorPartMaximizedEditorGroupContext.negate(), contextkeys_1.EditorPartMultipleEditorGroupsContext), contextkeys_1.SideBarVisibleContext, contextkeys_1.AuxiliaryBarVisibleContext)
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (editorService.activeEditor) {
                layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                layoutService.setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                editorGroupService.arrangeGroups(0 /* GroupsArrangement.MAXIMIZE */);
            }
        }
    }
    exports.MaximizeGroupHideSidebarAction = MaximizeGroupHideSidebarAction;
    class ToggleMaximizeEditorGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: editorCommands_1.TOGGLE_MAXIMIZE_EDITOR_GROUP,
                title: (0, nls_1.localize2)('toggleMaximizeEditorGroup', 'Toggle Maximize Editor Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.EditorPartMultipleEditorGroupsContext, contextkeys_1.EditorPartMaximizedEditorGroupContext),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */),
                },
                menu: [{
                        id: actions_2.MenuId.EditorTitle,
                        order: -10000, // towards the front
                        group: 'navigation',
                        when: contextkeys_1.EditorPartMaximizedEditorGroupContext
                    },
                    {
                        id: actions_2.MenuId.EmptyEditorGroup,
                        order: -10000, // towards the front
                        group: 'navigation',
                        when: contextkeys_1.EditorPartMaximizedEditorGroupContext
                    }],
                icon: codicons_1.Codicon.screenFull,
                toggled: contextkeys_1.EditorPartMaximizedEditorGroupContext,
            });
        }
        async run(accessor, resourceOrContext, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = (0, editorCommands_1.resolveCommandsContext)(editorGroupsService, (0, editorCommands_1.getCommandsContext)(resourceOrContext, context));
            editorGroupsService.toggleMaximizeGroup(group);
        }
    }
    exports.ToggleMaximizeEditorGroupAction = ToggleMaximizeEditorGroupAction;
    class AbstractNavigateEditorAction extends actions_2.Action2 {
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const result = this.navigate(editorGroupService);
            if (!result) {
                return;
            }
            const { groupId, editor } = result;
            if (!editor) {
                return;
            }
            const group = editorGroupService.getGroup(groupId);
            if (group) {
                await group.openEditor(editor);
            }
        }
    }
    class OpenNextEditor extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.nextEditor',
                title: (0, nls_1.localize2)('openNextEditor', 'Open Next Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 94 /* KeyCode.BracketRight */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            // Navigate in active group if possible
            const activeGroup = editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex + 1 < activeGroupEditors.length) {
                return { editor: activeGroupEditors[activeEditorIndex + 1], groupId: activeGroup.id };
            }
            // Otherwise try in next group that has editors
            const handledGroups = new Set();
            let currentGroup = editorGroupService.activeGroup;
            while (currentGroup && !handledGroups.has(currentGroup.id)) {
                currentGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, currentGroup, true);
                if (currentGroup) {
                    handledGroups.add(currentGroup.id);
                    const groupEditors = currentGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                    if (groupEditors.length > 0) {
                        return { editor: groupEditors[0], groupId: currentGroup.id };
                    }
                }
            }
            return undefined;
        }
    }
    exports.OpenNextEditor = OpenNextEditor;
    class OpenPreviousEditor extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.previousEditor',
                title: (0, nls_1.localize2)('openPreviousEditor', 'Open Previous Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 92 /* KeyCode.BracketLeft */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            // Navigate in active group if possible
            const activeGroup = editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex > 0) {
                return { editor: activeGroupEditors[activeEditorIndex - 1], groupId: activeGroup.id };
            }
            // Otherwise try in previous group that has editors
            const handledGroups = new Set();
            let currentGroup = editorGroupService.activeGroup;
            while (currentGroup && !handledGroups.has(currentGroup.id)) {
                currentGroup = editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, currentGroup, true);
                if (currentGroup) {
                    handledGroups.add(currentGroup.id);
                    const groupEditors = currentGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                    if (groupEditors.length > 0) {
                        return { editor: groupEditors[groupEditors.length - 1], groupId: currentGroup.id };
                    }
                }
            }
            return undefined;
        }
    }
    exports.OpenPreviousEditor = OpenPreviousEditor;
    class OpenNextEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.nextEditorInGroup',
                title: (0, nls_1.localize2)('nextEditorInGroup', 'Open Next Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */),
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */)
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index + 1 < editors.length ? editors[index + 1] : editors[0], groupId: group.id };
        }
    }
    exports.OpenNextEditorInGroup = OpenNextEditorInGroup;
    class OpenPreviousEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.previousEditorInGroup',
                title: (0, nls_1.localize2)('openPreviousEditorInGroup', 'Open Previous Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */),
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */)
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index > 0 ? editors[index - 1] : editors[editors.length - 1], groupId: group.id };
        }
    }
    exports.OpenPreviousEditorInGroup = OpenPreviousEditorInGroup;
    class OpenFirstEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.firstEditorInGroup',
                title: (0, nls_1.localize2)('firstEditorInGroup', 'Open First Editor in Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[0], groupId: group.id };
        }
    }
    exports.OpenFirstEditorInGroup = OpenFirstEditorInGroup;
    class OpenLastEditorInGroup extends AbstractNavigateEditorAction {
        constructor() {
            super({
                id: 'workbench.action.lastEditorInGroup',
                title: (0, nls_1.localize2)('lastEditorInGroup', 'Open Last Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */,
                    secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */],
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 21 /* KeyCode.Digit0 */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */]
                    }
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        navigate(editorGroupService) {
            const group = editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[editors.length - 1], groupId: group.id };
        }
    }
    exports.OpenLastEditorInGroup = OpenLastEditorInGroup;
    class NavigateForwardAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.navigateForward'; }
        static { this.LABEL = (0, nls_1.localize)('navigateForward', "Go Forward"); }
        constructor() {
            super({
                id: NavigateForwardAction.ID,
                title: {
                    ...(0, nls_1.localize2)('navigateForward', "Go Forward"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miForward', comment: ['&& denotes a mnemonic'] }, "&&Forward")
                },
                f1: true,
                icon: codicons_1.Codicon.arrowRight,
                precondition: contextkey_1.ContextKeyExpr.has('canNavigateForward'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    win: { primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Minus */ }
                },
                menu: [
                    { id: actions_2.MenuId.MenubarGoMenu, group: '1_history_nav', order: 2 },
                    { id: actions_2.MenuId.CommandCenter, order: 2 }
                ]
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigateForwardAction = NavigateForwardAction;
    class NavigateBackwardsAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.navigateBack'; }
        static { this.LABEL = (0, nls_1.localize)('navigateBack', "Go Back"); }
        constructor() {
            super({
                id: NavigateBackwardsAction.ID,
                title: {
                    ...(0, nls_1.localize2)('navigateBack', "Go Back"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBack', comment: ['&& denotes a mnemonic'] }, "&&Back")
                },
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.has('canNavigateBack'),
                icon: codicons_1.Codicon.arrowLeft,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    win: { primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 88 /* KeyCode.Minus */ },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 88 /* KeyCode.Minus */ }
                },
                menu: [
                    { id: actions_2.MenuId.MenubarGoMenu, group: '1_history_nav', order: 1 },
                    { id: actions_2.MenuId.CommandCenter, order: 1 }
                ]
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigateBackwardsAction = NavigateBackwardsAction;
    class NavigatePreviousAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateLast',
                title: (0, nls_1.localize2)('navigatePrevious', 'Go Previous'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(0 /* GoFilter.NONE */);
        }
    }
    exports.NavigatePreviousAction = NavigatePreviousAction;
    class NavigateForwardInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateForwardInEditLocations',
                title: (0, nls_1.localize2)('navigateForwardInEdits', 'Go Forward in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateForwardInEditsAction = NavigateForwardInEditsAction;
    class NavigateBackwardsInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateBackInEditLocations',
                title: (0, nls_1.localize2)('navigateBackInEdits', 'Go Back in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateBackwardsInEditsAction = NavigateBackwardsInEditsAction;
    class NavigatePreviousInEditsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigatePreviousInEditLocations',
                title: (0, nls_1.localize2)('navigatePreviousInEdits', 'Go Previous in Edit Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigatePreviousInEditsAction = NavigatePreviousInEditsAction;
    class NavigateToLastEditLocationAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateToLastEditLocation',
                title: (0, nls_1.localize2)('navigateToLastEditLocation', 'Go to Last Edit Location'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */)
                }
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goLast(1 /* GoFilter.EDITS */);
        }
    }
    exports.NavigateToLastEditLocationAction = NavigateToLastEditLocationAction;
    class NavigateForwardInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateForwardInNavigationLocations',
                title: (0, nls_1.localize2)('navigateForwardInNavigations', 'Go Forward in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateForwardInNavigationsAction = NavigateForwardInNavigationsAction;
    class NavigateBackwardsInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateBackInNavigationLocations',
                title: (0, nls_1.localize2)('navigateBackInNavigations', 'Go Back in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateBackwardsInNavigationsAction = NavigateBackwardsInNavigationsAction;
    class NavigatePreviousInNavigationsAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigatePreviousInNavigationLocations',
                title: (0, nls_1.localize2)('navigatePreviousInNavigationLocations', 'Go Previous in Navigation Locations'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigatePreviousInNavigationsAction = NavigatePreviousInNavigationsAction;
    class NavigateToLastNavigationLocationAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.navigateToLastNavigationLocation',
                title: (0, nls_1.localize2)('navigateToLastNavigationLocation', 'Go to Last Navigation Location'),
                f1: true
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.goLast(2 /* GoFilter.NAVIGATION */);
        }
    }
    exports.NavigateToLastNavigationLocationAction = NavigateToLastNavigationLocationAction;
    class ReopenClosedEditorAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.reopenClosedEditor'; }
        constructor() {
            super({
                id: ReopenClosedEditorAction.ID,
                title: (0, nls_1.localize2)('reopenClosedEditor', 'Reopen Closed Editor'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 50 /* KeyCode.KeyT */
                },
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            await historyService.reopenLastClosedEditor();
        }
    }
    exports.ReopenClosedEditorAction = ReopenClosedEditorAction;
    class ClearRecentFilesAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.clearRecentFiles'; }
        constructor() {
            super({
                id: ClearRecentFilesAction.ID,
                title: (0, nls_1.localize2)('clearRecentFiles', 'Clear Recently Opened...'),
                f1: true,
                category: actionCommonCategories_1.Categories.File
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            const historyService = accessor.get(history_1.IHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmClearRecentsMessage', "Do you want to clear all recently opened files and workspaces?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear")
            });
            if (!confirmed) {
                return;
            }
            // Clear global recently opened
            workspacesService.clearRecentlyOpened();
            // Clear workspace specific recently opened
            historyService.clearRecentlyOpened();
        }
    }
    exports.ClearRecentFilesAction = ClearRecentFilesAction;
    class ShowEditorsInActiveGroupByMostRecentlyUsedAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showEditorsInActiveGroup'; }
        constructor() {
            super({
                id: ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID,
                title: (0, nls_1.localize2)('showEditorsInActiveGroup', 'Show Editors in Active Group By Most Recently Used'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    }
    exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = ShowEditorsInActiveGroupByMostRecentlyUsedAction;
    class ShowAllEditorsByAppearanceAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showAllEditors'; }
        constructor() {
            super({
                id: ShowAllEditorsByAppearanceAction.ID,
                title: (0, nls_1.localize2)('showAllEditors', 'Show All Editors By Appearance'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 46 /* KeyCode.KeyP */),
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 2 /* KeyCode.Tab */
                    }
                },
                category: actionCommonCategories_1.Categories.File
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX);
        }
    }
    exports.ShowAllEditorsByAppearanceAction = ShowAllEditorsByAppearanceAction;
    class ShowAllEditorsByMostRecentlyUsedAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.showAllEditorsByMostRecentlyUsed'; }
        constructor() {
            super({
                id: ShowAllEditorsByMostRecentlyUsedAction.ID,
                title: (0, nls_1.localize2)('showAllEditorsByMostRecentlyUsed', 'Show All Editors By Most Recently Used'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    }
    exports.ShowAllEditorsByMostRecentlyUsedAction = ShowAllEditorsByMostRecentlyUsedAction;
    class AbstractQuickAccessEditorAction extends actions_2.Action2 {
        constructor(desc, prefix, itemActivation) {
            super(desc);
            this.prefix = prefix;
            this.itemActivation = itemActivation;
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keybindings = keybindingService.lookupKeybindings(this.desc.id);
            quickInputService.quickAccess.show(this.prefix, {
                quickNavigateConfiguration: { keybindings },
                itemActivation: this.itemActivation
            });
        }
    }
    class QuickAccessPreviousRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenPreviousRecentlyUsedEditor',
                title: (0, nls_1.localize2)('quickOpenPreviousRecentlyUsedEditor', 'Quick Open Previous Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessPreviousRecentlyUsedEditorAction = QuickAccessPreviousRecentlyUsedEditorAction;
    class QuickAccessLeastRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenLeastRecentlyUsedEditor',
                title: (0, nls_1.localize2)('quickOpenLeastRecentlyUsedEditor', 'Quick Open Least Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessLeastRecentlyUsedEditorAction = QuickAccessLeastRecentlyUsedEditorAction;
    class QuickAccessPreviousRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('quickOpenPreviousRecentlyUsedEditorInGroup', 'Quick Open Previous Recently Used Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */
                    }
                },
                precondition: contextkeys_1.ActiveEditorGroupEmptyContext.toNegated(),
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined);
        }
    }
    exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = QuickAccessPreviousRecentlyUsedEditorInGroupAction;
    class QuickAccessLeastRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor() {
            super({
                id: 'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('quickOpenLeastRecentlyUsedEditorInGroup', 'Quick Open Least Recently Used Editor in Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
                    }
                },
                precondition: contextkeys_1.ActiveEditorGroupEmptyContext.toNegated(),
                category: actionCommonCategories_1.Categories.View
            }, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, quickInput_1.ItemActivation.LAST);
        }
    }
    exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = QuickAccessLeastRecentlyUsedEditorInGroupAction;
    class QuickAccessPreviousEditorFromHistoryAction extends actions_2.Action2 {
        static { this.ID = 'workbench.action.openPreviousEditorFromHistory'; }
        constructor() {
            super({
                id: QuickAccessPreviousEditorFromHistoryAction.ID,
                title: (0, nls_1.localize2)('navigateEditorHistoryByInput', 'Quick Open Previous Editor from History'),
                f1: true
            });
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const keybindings = keybindingService.lookupKeybindings(QuickAccessPreviousEditorFromHistoryAction.ID);
            // Enforce to activate the first item in quick access if
            // the currently active editor group has n editor opened
            let itemActivation = undefined;
            if (editorGroupService.activeGroup.count === 0) {
                itemActivation = quickInput_1.ItemActivation.FIRST;
            }
            quickInputService.quickAccess.show('', { quickNavigateConfiguration: { keybindings }, itemActivation });
        }
    }
    exports.QuickAccessPreviousEditorFromHistoryAction = QuickAccessPreviousEditorFromHistoryAction;
    class OpenNextRecentlyUsedEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openNextRecentlyUsedEditor',
                title: (0, nls_1.localize2)('openNextRecentlyUsedEditor', 'Open Next Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            historyService.openNextRecentlyUsedEditor();
        }
    }
    exports.OpenNextRecentlyUsedEditorAction = OpenNextRecentlyUsedEditorAction;
    class OpenPreviousRecentlyUsedEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openPreviousRecentlyUsedEditor',
                title: (0, nls_1.localize2)('openPreviousRecentlyUsedEditor', 'Open Previous Recently Used Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            historyService.openPreviouslyUsedEditor();
        }
    }
    exports.OpenPreviousRecentlyUsedEditorAction = OpenPreviousRecentlyUsedEditorAction;
    class OpenNextRecentlyUsedEditorInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('openNextRecentlyUsedEditorInGroup', 'Open Next Recently Used Editor In Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            historyService.openNextRecentlyUsedEditor(editorGroupsService.activeGroup.id);
        }
    }
    exports.OpenNextRecentlyUsedEditorInGroupAction = OpenNextRecentlyUsedEditorInGroupAction;
    class OpenPreviousRecentlyUsedEditorInGroupAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
                title: (0, nls_1.localize2)('openPreviousRecentlyUsedEditorInGroup', 'Open Previous Recently Used Editor In Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const historyService = accessor.get(history_1.IHistoryService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            historyService.openPreviouslyUsedEditor(editorGroupsService.activeGroup.id);
        }
    }
    exports.OpenPreviousRecentlyUsedEditorInGroupAction = OpenPreviousRecentlyUsedEditorInGroupAction;
    class ClearEditorHistoryAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.clearEditorHistory',
                title: (0, nls_1.localize2)('clearEditorHistory', 'Clear Editor History'),
                f1: true
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const historyService = accessor.get(history_1.IHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                type: 'warning',
                message: (0, nls_1.localize)('confirmClearEditorHistoryMessage', "Do you want to clear the history of recently opened editors?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear")
            });
            if (!confirmed) {
                return;
            }
            // Clear editor history
            historyService.clear();
        }
    }
    exports.ClearEditorHistoryAction = ClearEditorHistoryAction;
    class MoveEditorLeftInGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorLeftInGroup',
                title: (0, nls_1.localize2)('moveEditorLeft', 'Move Editor Left'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */)
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'left' });
        }
    }
    exports.MoveEditorLeftInGroupAction = MoveEditorLeftInGroupAction;
    class MoveEditorRightInGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorRightInGroup',
                title: (0, nls_1.localize2)('moveEditorRight', 'Move Editor Right'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                    mac: {
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */)
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'right' });
        }
    }
    exports.MoveEditorRightInGroupAction = MoveEditorRightInGroupAction;
    class MoveEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToPreviousGroup',
                title: (0, nls_1.localize2)('moveEditorToPreviousGroup', 'Move Editor into Previous Group'),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */
                    }
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View,
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'previous', by: 'group' });
        }
    }
    exports.MoveEditorToPreviousGroupAction = MoveEditorToPreviousGroupAction;
    class MoveEditorToNextGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToNextGroup',
                title: (0, nls_1.localize2)('moveEditorToNextGroup', 'Move Editor into Next Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'next', by: 'group' });
        }
    }
    exports.MoveEditorToNextGroupAction = MoveEditorToNextGroupAction;
    class MoveEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToAboveGroup',
                title: (0, nls_1.localize2)('moveEditorToAboveGroup', 'Move Editor into Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'up', by: 'group' });
        }
    }
    exports.MoveEditorToAboveGroupAction = MoveEditorToAboveGroupAction;
    class MoveEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToBelowGroup',
                title: (0, nls_1.localize2)('moveEditorToBelowGroup', 'Move Editor into Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'down', by: 'group' });
        }
    }
    exports.MoveEditorToBelowGroupAction = MoveEditorToBelowGroupAction;
    class MoveEditorToLeftGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToLeftGroup',
                title: (0, nls_1.localize2)('moveEditorToLeftGroup', 'Move Editor into Left Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'left', by: 'group' });
        }
    }
    exports.MoveEditorToLeftGroupAction = MoveEditorToLeftGroupAction;
    class MoveEditorToRightGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToRightGroup',
                title: (0, nls_1.localize2)('moveEditorToRightGroup', 'Move Editor into Right Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'right', by: 'group' });
        }
    }
    exports.MoveEditorToRightGroupAction = MoveEditorToRightGroupAction;
    class MoveEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToFirstGroup',
                title: (0, nls_1.localize2)('moveEditorToFirstGroup', 'Move Editor into First Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 22 /* KeyCode.Digit1 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 22 /* KeyCode.Digit1 */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'first', by: 'group' });
        }
    }
    exports.MoveEditorToFirstGroupAction = MoveEditorToFirstGroupAction;
    class MoveEditorToLastGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.moveEditorToLastGroup',
                title: (0, nls_1.localize2)('moveEditorToLastGroup', 'Move Editor into Last Group'),
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 30 /* KeyCode.Digit9 */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 30 /* KeyCode.Digit9 */
                    }
                },
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, { to: 'last', by: 'group' });
        }
    }
    exports.MoveEditorToLastGroupAction = MoveEditorToLastGroupAction;
    class SplitEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToPreviousGroup',
                title: (0, nls_1.localize2)('splitEditorToPreviousGroup', 'Split Editor into Previous Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'previous', by: 'group' });
        }
    }
    exports.SplitEditorToPreviousGroupAction = SplitEditorToPreviousGroupAction;
    class SplitEditorToNextGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToNextGroup',
                title: (0, nls_1.localize2)('splitEditorToNextGroup', 'Split Editor into Next Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'next', by: 'group' });
        }
    }
    exports.SplitEditorToNextGroupAction = SplitEditorToNextGroupAction;
    class SplitEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToAboveGroup',
                title: (0, nls_1.localize2)('splitEditorToAboveGroup', 'Split Editor into Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'up', by: 'group' });
        }
    }
    exports.SplitEditorToAboveGroupAction = SplitEditorToAboveGroupAction;
    class SplitEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToBelowGroup',
                title: (0, nls_1.localize2)('splitEditorToBelowGroup', 'Split Editor into Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'down', by: 'group' });
        }
    }
    exports.SplitEditorToBelowGroupAction = SplitEditorToBelowGroupAction;
    class SplitEditorToLeftGroupAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.splitEditorToLeftGroup'; }
        static { this.LABEL = (0, nls_1.localize)('splitEditorToLeftGroup', "Split Editor into Left Group"); }
        constructor() {
            super({
                id: 'workbench.action.splitEditorToLeftGroup',
                title: (0, nls_1.localize2)('splitEditorToLeftGroup', "Split Editor into Left Group"),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'left', by: 'group' });
        }
    }
    exports.SplitEditorToLeftGroupAction = SplitEditorToLeftGroupAction;
    class SplitEditorToRightGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToRightGroup',
                title: (0, nls_1.localize2)('splitEditorToRightGroup', 'Split Editor into Right Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'right', by: 'group' });
        }
    }
    exports.SplitEditorToRightGroupAction = SplitEditorToRightGroupAction;
    class SplitEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToFirstGroup',
                title: (0, nls_1.localize2)('splitEditorToFirstGroup', 'Split Editor into First Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'first', by: 'group' });
        }
    }
    exports.SplitEditorToFirstGroupAction = SplitEditorToFirstGroupAction;
    class SplitEditorToLastGroupAction extends ExecuteCommandAction {
        constructor() {
            super({
                id: 'workbench.action.splitEditorToLastGroup',
                title: (0, nls_1.localize2)('splitEditorToLastGroup', 'Split Editor into Last Group'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, { to: 'last', by: 'group' });
        }
    }
    exports.SplitEditorToLastGroupAction = SplitEditorToLastGroupAction;
    class EditorLayoutSingleAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutSingle'; }
        constructor() {
            super({
                id: EditorLayoutSingleAction.ID,
                title: (0, nls_1.localize2)('editorLayoutSingle', 'Single Column Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}] });
        }
    }
    exports.EditorLayoutSingleAction = EditorLayoutSingleAction;
    class EditorLayoutTwoColumnsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoColumns'; }
        constructor() {
            super({
                id: EditorLayoutTwoColumnsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoColumns', 'Two Columns Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutTwoColumnsAction = EditorLayoutTwoColumnsAction;
    class EditorLayoutThreeColumnsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutThreeColumns'; }
        constructor() {
            super({
                id: EditorLayoutThreeColumnsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutThreeColumns', 'Three Columns Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutThreeColumnsAction = EditorLayoutThreeColumnsAction;
    class EditorLayoutTwoRowsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoRows'; }
        constructor() {
            super({
                id: EditorLayoutTwoRowsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoRows', 'Two Rows Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutTwoRowsAction = EditorLayoutTwoRowsAction;
    class EditorLayoutThreeRowsAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutThreeRows'; }
        constructor() {
            super({
                id: EditorLayoutThreeRowsAction.ID,
                title: (0, nls_1.localize2)('editorLayoutThreeRows', 'Three Rows Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, {}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutThreeRowsAction = EditorLayoutThreeRowsAction;
    class EditorLayoutTwoByTwoGridAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoByTwoGrid'; }
        constructor() {
            super({
                id: EditorLayoutTwoByTwoGridAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoByTwoGrid', 'Grid Editor Layout (2x2)'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }] });
        }
    }
    exports.EditorLayoutTwoByTwoGridAction = EditorLayoutTwoByTwoGridAction;
    class EditorLayoutTwoColumnsBottomAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoColumnsBottom'; }
        constructor() {
            super({
                id: EditorLayoutTwoColumnsBottomAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoColumnsBottom', 'Two Columns Bottom Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, { groups: [{}, {}] }], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    }
    exports.EditorLayoutTwoColumnsBottomAction = EditorLayoutTwoColumnsBottomAction;
    class EditorLayoutTwoRowsRightAction extends ExecuteCommandAction {
        static { this.ID = 'workbench.action.editorLayoutTwoRowsRight'; }
        constructor() {
            super({
                id: EditorLayoutTwoRowsRightAction.ID,
                title: (0, nls_1.localize2)('editorLayoutTwoRowsRight', 'Two Rows Right Editor Layout'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, { groups: [{}, { groups: [{}, {}] }], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    }
    exports.EditorLayoutTwoRowsRightAction = EditorLayoutTwoRowsRightAction;
    class AbstractCreateEditorGroupAction extends actions_2.Action2 {
        constructor(desc, direction) {
            super(desc);
            this.direction = direction;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            // We are about to create a new empty editor group. We make an opiniated
            // decision here whether to focus that new editor group or not based
            // on what is currently focused. If focus is outside the editor area not
            // in the <body>, we do not focus, with the rationale that a user might
            // have focus on a tree/list with the intention to pick an element to
            // open in the new group from that tree/list.
            //
            // If focus is inside the editor area, we want to prevent the situation
            // of an editor having keyboard focus in an inactive editor group
            // (see https://github.com/microsoft/vscode/issues/189256)
            const activeDocument = (0, dom_1.getActiveDocument)();
            const focusNewGroup = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */) || activeDocument.activeElement === activeDocument.body;
            const group = editorGroupService.addGroup(editorGroupService.activeGroup, this.direction);
            editorGroupService.activateGroup(group);
            if (focusNewGroup) {
                group.focus();
            }
        }
    }
    class NewEditorGroupLeftAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupLeft',
                title: (0, nls_1.localize2)('newGroupLeft', 'New Editor Group to the Left'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 2 /* GroupDirection.LEFT */);
        }
    }
    exports.NewEditorGroupLeftAction = NewEditorGroupLeftAction;
    class NewEditorGroupRightAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupRight',
                title: (0, nls_1.localize2)('newGroupRight', 'New Editor Group to the Right'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 3 /* GroupDirection.RIGHT */);
        }
    }
    exports.NewEditorGroupRightAction = NewEditorGroupRightAction;
    class NewEditorGroupAboveAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupAbove',
                title: (0, nls_1.localize2)('newGroupAbove', 'New Editor Group Above'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 0 /* GroupDirection.UP */);
        }
    }
    exports.NewEditorGroupAboveAction = NewEditorGroupAboveAction;
    class NewEditorGroupBelowAction extends AbstractCreateEditorGroupAction {
        constructor() {
            super({
                id: 'workbench.action.newGroupBelow',
                title: (0, nls_1.localize2)('newGroupBelow', 'New Editor Group Below'),
                f1: true,
                category: actionCommonCategories_1.Categories.View
            }, 1 /* GroupDirection.DOWN */);
        }
    }
    exports.NewEditorGroupBelowAction = NewEditorGroupBelowAction;
    class ToggleEditorTypeAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorType',
                title: (0, nls_1.localize2)('toggleEditorType', 'Toggle Editor Type'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorAvailableEditorIdsContext
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorResolverService = accessor.get(editorResolverService_1.IEditorResolverService);
            const activeEditorPane = editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            const editorIds = editorResolverService.getEditors(activeEditorResource).map(editor => editor.id).filter(id => id !== activeEditorPane.input.editorId);
            if (editorIds.length === 0) {
                return;
            }
            // Replace the current editor with the next avaiable editor type
            await editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editorIds[0]
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    }
    exports.ToggleEditorTypeAction = ToggleEditorTypeAction;
    class ReOpenInTextEditorAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.reopenTextEditor',
                title: (0, nls_1.localize2)('reopenTextEditor', 'Reopen Editor With Text Editor'),
                f1: true,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorAvailableEditorIdsContext
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            // Replace the current editor with the text editor
            await editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    }
    exports.ReOpenInTextEditorAction = ReOpenInTextEditorAction;
    class BaseMoveCopyEditorToNewWindowAction extends actions_2.Action2 {
        constructor(id, title, keybinding, move) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                precondition: contextkeys_1.ActiveEditorContext,
                keybinding,
                f1: true
            });
            this.move = move;
        }
        async run(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = (0, editorCommands_1.resolveCommandsContext)(editorGroupService, (0, editorCommands_1.getCommandsContext)(resourceOrContext, context));
            if (group && editor) {
                const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
                if (this.move) {
                    group.moveEditor(editor, auxiliaryEditorPart.activeGroup);
                }
                else {
                    group.copyEditor(editor, auxiliaryEditorPart.activeGroup);
                }
                auxiliaryEditorPart.activeGroup.focus();
            }
        }
    }
    class MoveEditorToNewWindowAction extends BaseMoveCopyEditorToNewWindowAction {
        constructor() {
            super(editorCommands_1.MOVE_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('moveEditorToNewWindow', "Move Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor into New Window"),
            }, undefined, true);
        }
    }
    exports.MoveEditorToNewWindowAction = MoveEditorToNewWindowAction;
    class CopyEditorToNewindowAction extends BaseMoveCopyEditorToNewWindowAction {
        constructor() {
            super(editorCommands_1.COPY_EDITOR_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('copyEditorToNewWindow', "Copy Editor into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor into New Window"),
            }, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 45 /* KeyCode.KeyO */), weight: 200 /* KeybindingWeight.WorkbenchContrib */ }, false);
        }
    }
    exports.CopyEditorToNewindowAction = CopyEditorToNewindowAction;
    class BaseMoveCopyEditorGroupToNewWindowAction extends actions_2.Action2 {
        constructor(id, title, move) {
            super({
                id,
                title,
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
            this.move = move;
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const activeGroup = editorGroupService.activeGroup;
            const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
            editorGroupService.mergeGroup(activeGroup, auxiliaryEditorPart.activeGroup, {
                mode: this.move ? 1 /* MergeGroupMode.MOVE_EDITORS */ : 0 /* MergeGroupMode.COPY_EDITORS */
            });
            auxiliaryEditorPart.activeGroup.focus();
        }
    }
    class MoveEditorGroupToNewWindowAction extends BaseMoveCopyEditorGroupToNewWindowAction {
        constructor() {
            super(editorCommands_1.MOVE_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('moveEditorGroupToNewWindow', "Move Editor Group into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miMoveEditorGroupToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Move Editor Group into New Window"),
            }, true);
        }
    }
    exports.MoveEditorGroupToNewWindowAction = MoveEditorGroupToNewWindowAction;
    class CopyEditorGroupToNewWindowAction extends BaseMoveCopyEditorGroupToNewWindowAction {
        constructor() {
            super(editorCommands_1.COPY_EDITOR_GROUP_INTO_NEW_WINDOW_COMMAND_ID, {
                ...(0, nls_1.localize2)('copyEditorGroupToNewWindow', "Copy Editor Group into New Window"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miCopyEditorGroupToNewWindow', comment: ['&& denotes a mnemonic'] }, "&&Copy Editor Group into New Window"),
            }, false);
        }
    }
    exports.CopyEditorGroupToNewWindowAction = CopyEditorGroupToNewWindowAction;
    class RestoreEditorsToMainWindowAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.restoreEditorsToMainWindow',
                title: {
                    ...(0, nls_1.localize2)('restoreEditorsToMainWindow', "Restore Editors into Main Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miRestoreEditorsToMainWindow', comment: ['&& denotes a mnemonic'] }, "&&Restore Editors into Main Window"),
                },
                f1: true,
                precondition: contextkeys_1.IsAuxiliaryWindowFocusedContext,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.mergeAllGroups(editorGroupService.mainPart.activeGroup);
        }
    }
    exports.RestoreEditorsToMainWindowAction = RestoreEditorsToMainWindowAction;
    class NewEmptyEditorWindowAction extends actions_2.Action2 {
        constructor() {
            super({
                id: editorCommands_1.NEW_EMPTY_EDITOR_WINDOW_COMMAND_ID,
                title: {
                    ...(0, nls_1.localize2)('newEmptyEditorWindow', "New Empty Editor Window"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miNewEmptyEditorWindow', comment: ['&& denotes a mnemonic'] }, "&&New Empty Editor Window"),
                },
                f1: true,
                category: actionCommonCategories_1.Categories.View
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const auxiliaryEditorPart = await editorGroupService.createAuxiliaryEditorPart();
            auxiliaryEditorPart.activeGroup.focus();
        }
    }
    exports.NewEmptyEditorWindowAction = NewEmptyEditorWindowAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvckFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUNoRyxNQUFNLG9CQUFxQixTQUFRLGlCQUFPO1FBRXpDLFlBQ0MsSUFBK0IsRUFDZCxTQUFpQixFQUNqQixXQUFxQjtZQUV0QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFISyxjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLGdCQUFXLEdBQVgsV0FBVyxDQUFVO1FBR3ZDLENBQUM7UUFFUSxHQUFHLENBQUMsUUFBMEI7WUFDdEMsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxDQUFDLENBQUM7WUFFckQsT0FBTyxjQUFjLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7S0FDRDtJQUVELE1BQWUseUJBQTBCLFNBQVEsaUJBQU87UUFFN0MsWUFBWSxDQUFDLG9CQUEyQztZQUNqRSxPQUFPLElBQUEsdURBQWlDLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE9BQTJCO1lBQ3pFLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBb0IsQ0FBQyxDQUFDO1lBQzlELE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBRWpFLElBQUEsNEJBQVcsRUFBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLEVBQUUs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