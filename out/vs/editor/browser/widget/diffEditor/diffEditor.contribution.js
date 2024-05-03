/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/browser/widget/diffEditor/commands", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "./registrations.contribution"], function (require, exports, codicons_1, commands_1, editorContextKeys_1, nls_1, actions_1, commands_2, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(commands_1.ToggleCollapseUnchangedRegions);
    (0, actions_1.registerAction2)(commands_1.ToggleShowMovedCodeBlocks);
    (0, actions_1.registerAction2)(commands_1.ToggleUseInlineViewWhenSpaceIsLimited);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: new commands_1.ToggleUseInlineViewWhenSpaceIsLimited().desc.id,
            title: (0, nls_1.localize)('useInlineViewWhenSpaceIsLimited', "Use Inline View When Space Is Limited"),
            toggled: contextkey_1.ContextKeyExpr.has('config.diffEditor.useInlineViewWhenSpaceIsLimited'),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 11,
        group: '1_diff',
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorRenderSideBySideInlineBreakpointReached, contextkey_1.ContextKeyExpr.has('isInDiffEditor')),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: new commands_1.ToggleShowMovedCodeBlocks().desc.id,
            title: (0, nls_1.localize)('showMoves', "Show Moved Code Blocks"),
            icon: codicons_1.Codicon.move,
            toggled: contextkey_1.ContextKeyEqualsExpr.create('config.diffEditor.experimental.showMoves', true),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 10,
        group: '1_diff',
        when: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
    });
    (0, actions_1.registerAction2)(commands_1.RevertHunkOrSelection);
    for (const ctx of [
        { icon: codicons_1.Codicon.arrowRight, key: editorContextKeys_1.EditorContextKeys.diffEditorInlineMode.toNegated() },
        { icon: codicons_1.Codicon.discard, key: editorContextKeys_1.EditorContextKeys.diffEditorInlineMode }
    ]) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DiffEditorHunkToolbar, {
            command: {
                id: new commands_1.RevertHunkOrSelection().desc.id,
                title: (0, nls_1.localize)('revertHunk', "Revert Block"),
                icon: ctx.icon,
            },
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorModifiedWritable, ctx.key),
            order: 5,
            group: 'primary',
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.DiffEditorSelectionToolbar, {
            command: {
                id: new commands_1.RevertHunkOrSelection().desc.id,
                title: (0, nls_1.localize)('revertSelection', "Revert Selection"),
                icon: ctx.icon,
            },
            when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.diffEditorModifiedWritable, ctx.key),
            order: 5,
            group: 'primary',
        });
    }
    (0, actions_1.registerAction2)(commands_1.SwitchSide);
    (0, actions_1.registerAction2)(commands_1.ExitCompareMove);
    (0, actions_1.registerAction2)(commands_1.CollapseAllUnchangedRegions);
    (0, actions_1.registerAction2)(commands_1.ShowAllUnchangedRegions);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: commands_1.AccessibleDiffViewerNext.id,
            title: (0, nls_1.localize)('Open Accessible Diff Viewer', "Open Accessible Diff Viewer"),
            precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
        },
        order: 10,
        group: '2_diff',
        when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.accessibleDiffViewerVisible.negate(), contextkey_1.ContextKeyExpr.has('isInDiffEditor')),
    });
    commands_2.CommandsRegistry.registerCommandAlias('editor.action.diffReview.next', commands_1.AccessibleDiffViewerNext.id);
    (0, actions_1.registerAction2)(commands_1.AccessibleDiffViewerNext);
    commands_2.CommandsRegistry.registerCommandAlias('editor.action.diffReview.prev', commands_1.AccessibleDiffViewerPrev.id);
    (0, actions_1.registerAction2)(commands_1.AccessibleDiffViewerPrev);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2RpZmZFZGl0b3IuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLElBQUEseUJBQWUsRUFBQyx5Q0FBOEIsQ0FBQyxDQUFDO0lBQ2hELElBQUEseUJBQWUsRUFBQyxvQ0FBeUIsQ0FBQyxDQUFDO0lBQzNDLElBQUEseUJBQWUsRUFBQyxnREFBcUMsQ0FBQyxDQUFDO0lBRXZELHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsV0FBVyxFQUFFO1FBQy9DLE9BQU8sRUFBRTtZQUNSLEVBQUUsRUFBRSxJQUFJLGdEQUFxQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLHVDQUF1QyxDQUFDO1lBQzNGLE9BQU8sRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxtREFBbUQsQ0FBQztZQUNoRixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7U0FDbEQ7UUFDRCxLQUFLLEVBQUUsRUFBRTtRQUNULEtBQUssRUFBRSxRQUFRO1FBQ2YsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2QixxQ0FBaUIsQ0FBQyxpREFBaUQsRUFDbkUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FDcEM7S0FDRCxDQUFDLENBQUM7SUFFSCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLFdBQVcsRUFBRTtRQUMvQyxPQUFPLEVBQUU7WUFDUixFQUFFLEVBQUUsSUFBSSxvQ0FBeUIsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFF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