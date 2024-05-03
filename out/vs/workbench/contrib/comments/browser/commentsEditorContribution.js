/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/comments/browser/commentsController", "vs/editor/common/core/range", "vs/platform/notification/common/notification", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/platform/accessibility/common/accessibility", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/css!./media/review"], function (require, exports, keyCodes_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, nls, commands_1, keybindingsRegistry_1, commentService_1, simpleCommentEditor_1, editorService_1, actions_1, editorContextKeys_1, commentsController_1, range_1, notification_1, commentContextKeys_1, accessibility_1, contextkey_1, accessibilityConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveEditor = getActiveEditor;
    (0, editorExtensions_1.registerEditorContribution)(commentsController_1.ID, commentsController_1.CommentController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.nextCommentThreadAction" /* CommentCommandId.NextThread */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.nextCommentThread();
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */,
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.previousCommentThreadAction" /* CommentCommandId.PreviousThread */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.previousCommentThread();
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.nextCommentingRange" /* CommentCommandId.NextRange */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.nextCommentingRange();
        },
        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, commentContextKeys_1.CommentContextKeys.commentFocused, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibilityHelpIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("comments" /* AccessibleViewProviderId.Comments */)))),
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */),
        weight: 100 /* KeybindingWeight.EditorContrib */
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "editor.action.nextCommentingRange" /* CommentCommandId.NextRange */,
            title: nls.localize('comments.nextCommentingRange', "Go to Next Commenting Range"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            controller.previousCommentingRange();
        },
        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkey_1.ContextKeyExpr.or(editorContextKeys_1.EditorContextKeys.focus, commentContextKeys_1.CommentContextKeys.commentFocused, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibilityHelpIsShown, accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("comments" /* AccessibleViewProviderId.Comments */)))),
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */),
        weight: 100 /* KeybindingWeight.EditorContrib */
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "editor.action.previousCommentingRange" /* CommentCommandId.PreviousRange */,
            title: nls.localize('comments.previousCommentingRange', "Go to Previous Commenting Range"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.activeEditorHasCommentingRange
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.toggleCommenting" /* CommentCommandId.ToggleCommenting */,
        handler: (accessor) => {
            const commentService = accessor.get(commentService_1.ICommentService);
            const enable = commentService.isCommentingEnabled;
            commentService.enableCommenting(!enable);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.toggleCommenting" /* CommentCommandId.ToggleCommenting */,
            title: nls.localize('comments.toggleCommenting', "Toggle Editor Commenting"),
            category: 'Comments',
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "workbench.action.addComment" /* CommentCommandId.Add */,
        handler: async (accessor, args) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = commentsController_1.CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            const position = args?.range ? new range_1.Range(args.range.startLineNumber, args.range.startLineNumber, args.range.endLineNumber, args.range.endColumn)
                : (args?.fileComment ? undefined : activeEditor.getSelection());
            const notificationService = accessor.get(notification_1.INotificationService);
            try {
                await controller.addOrToggleCommentAtLine(position, undefined);
            }
            catch (e) {
                notificationService.error(nls.localize('comments.addCommand.error', "The cursor must be within a commenting range to add a comment")); // TODO: Once we have commands to go to next commenting range they should be included as buttons in the error.
            }
        },
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.addComment" /* CommentCommandId.Add */,
            title: nls.localize('comments.addCommand', "Add Comment on Current Selection"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.activeCursorHasCommentingRange
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.collapseAllComments" /* CommentCommandId.CollapseAll */,
        handler: (accessor) => {
            return getActiveController(accessor)?.collapseAll();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.collapseAllComments" /* CommentCommandId.CollapseAll */,
            title: nls.localize('comments.collapseAll', "Collapse All Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.expandAllComments" /* CommentCommandId.ExpandAll */,
        handler: (accessor) => {
            return getActiveController(accessor)?.expandAll();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.expandAllComments" /* CommentCommandId.ExpandAll */,
            title: nls.localize('comments.expandAll', "Expand All Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    commands_1.CommandsRegistry.registerCommand({
        id: "workbench.action.expandUnresolvedComments" /* CommentCommandId.ExpandUnresolved */,
        handler: (accessor) => {
            return getActiveController(accessor)?.expandUnresolved();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: "workbench.action.expandUnresolvedComments" /* CommentCommandId.ExpandUnresolved */,
            title: nls.localize('comments.expandUnresolved', "Expand Unresolved Comments"),
            category: 'Comments'
        },
        when: commentContextKeys_1.CommentContextKeys.WorkspaceHasCommenting
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "editor.action.submitComment" /* CommentCommandId.Submit */,
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().submitComment();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: "workbench.action.hideComment" /* CommentCommandId.Hide */,
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().collapse();
            }
        }
    });
    function getActiveEditor(accessor) {
        let activeTextEditorControl = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
        if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
            if (activeTextEditorControl.getOriginalEditor().hasTextFocus()) {
                activeTextEditorControl = activeTextEditorControl.getOriginalEditor();
            }
            else {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
        }
        if (!(0, editorBrowser_1.isCodeEditor)(activeTextEditorControl) || !activeTextEditorControl.hasModel()) {
            return null;
        }
        return activeTextEditorControl;
    }
    function getActiveController(accessor) {
        const activeEditor = getActiveEditor(accessor);
        if (!activeEditor) {
            return undefined;
        }
        const controller = commentsController_1.CommentController.get(activeEditor);
        if (!controller) {
            return undefined;
        }
        return controller;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWVudHNFZGl0b3JDb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbW1lbnRzL2Jyb3dzZXIvY29tbWVudHNFZGl0b3JDb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1UGhHLDBDQWdCQztJQTlPRCxJQUFBLDZDQUEwQixFQUFDLHVCQUFFLEVBQUUsc0NBQWlCLDJEQUFtRCxDQUFDO0lBRXBHLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsMkVBQTZCO1FBQy9CLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQThDLEVBQUUsRUFBRTtZQUMzRSxNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNuQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBRUQsTUFBTSxVQUFVLEdBQUcsc0NBQWlCLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDMUIsQ0FBQztZQUNELFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ2hDLENBQUM7UUFDRCxNQUFNLDBDQUFnQztRQUN0QyxPQUFPLEVBQUUsMENBQXVCO0tBQ2hDLENBQUMsQ0FBQztJQUVILHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1FBQ3BELEVBQUUsbUZBQWlDO1FBQ25DLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQThDLEVBQUUsRUFBRTtZQUMzRSxNQUFNLFlBQVksR0FBRyxlQUFlLENB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