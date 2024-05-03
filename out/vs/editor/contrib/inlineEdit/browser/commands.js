/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlineEdit/browser/commandIds", "vs/editor/contrib/inlineEdit/browser/inlineEditController", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, editorExtensions_1, editorContextKeys_1, commandIds_1, inlineEditController_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RejectInlineEdit = exports.JumpBackInlineEdit = exports.JumpToInlineEdit = exports.TriggerInlineEdit = exports.AcceptInlineEdit = void 0;
    class AcceptInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: commandIds_1.inlineEditAcceptId,
                label: 'Accept Inline Edit',
                alias: 'Accept Inline Edit',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext),
                kbOpts: [
                    {
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                        primary: 2 /* KeyCode.Tab */,
                        kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext, inlineEditController_1.InlineEditController.cursorAtInlineEditContext)
                    }
                ],
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Accept',
                        group: 'primary',
                        order: 1,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            await controller?.accept();
        }
    }
    exports.AcceptInlineEdit = AcceptInlineEdit;
    class TriggerInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, contextkey_1.ContextKeyExpr.not(inlineEditController_1.InlineEditController.inlineEditVisibleKey));
            super({
                id: 'editor.action.inlineEdit.trigger',
                label: 'Trigger Inline Edit',
                alias: 'Trigger Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.trigger();
        }
    }
    exports.TriggerInlineEdit = TriggerInlineEdit;
    class JumpToInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext, contextkey_1.ContextKeyExpr.not(inlineEditController_1.InlineEditController.cursorAtInlineEditKey));
            super({
                id: commandIds_1.inlineEditJumpToId,
                label: 'Jump to Inline Edit',
                alias: 'Jump to Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Jump To Edit',
                        group: 'primary',
                        order: 3,
                        when: activeExpr
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.jumpToCurrent();
        }
    }
    exports.JumpToInlineEdit = JumpToInlineEdit;
    class JumpBackInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.cursorAtInlineEditContext);
            super({
                id: commandIds_1.inlineEditJumpBackId,
                label: 'Jump Back from Inline Edit',
                alias: 'Jump Back from Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 10,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 86 /* KeyCode.Equal */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Jump Back',
                        group: 'primary',
                        order: 3,
                        when: activeExpr
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            controller?.jumpBack();
        }
    }
    exports.JumpBackInlineEdit = JumpBackInlineEdit;
    class RejectInlineEdit extends editorExtensions_1.EditorAction {
        constructor() {
            const activeExpr = contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineEditController_1.InlineEditController.inlineEditVisibleContext);
            super({
                id: commandIds_1.inlineEditRejectId,
                label: 'Reject Inline Edit',
                alias: 'Reject Inline Edit',
                precondition: activeExpr,
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */,
                    kbExpr: activeExpr
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineEditToolbar,
                        title: 'Reject',
                        group: 'secondary',
                        order: 2,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineEditController_1.InlineEditController.get(editor);
            await controller?.clear();
        }
    }
    exports.RejectInlineEdit = RejectInlineEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUVkaXQvYnJvd3Nlci9jb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsTUFBYSxnQkFBaUIsU0FBUSwrQkFBWTtRQUNqRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsK0JBQWtCO2dCQUN0QixLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixLQUFLLEVBQUUsb0JBQW9CO2dCQUMzQixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMscUNBQWlCLENBQUMsUUFBUSxFQUFFLDJDQUFvQixDQUFDLHdCQUF3QixDQUFDO2dCQUMzRyxNQUFNLEVBQUU7b0JBQ1A7d0JBQ0MsTUFBTSxFQUFFLDJDQUFpQyxDQUFDO3dCQUMxQyxPQUFPLHFCQUFhO3dCQUNwQixNQUFNLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMscUNBQWlCLENBQUMsUUFBUSxFQUFFLDJDQUFvQixDQUFDLHdCQUF3QixFQUFFLDJDQUFvQixDQUFDLHlCQUF5QixDQUFDO3FCQUNySjtpQkFBQztnQkFDSCxRQUFRLEVBQUUsQ0FBQzt3QkFDVixNQUFNLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7d0JBQ2hDLEtBQUssRUFBRSxRQUFRO3dCQUNmLEtBQUssRUFBRSxTQUFTO3dCQUNoQixLQUFLLEVBQUUsQ0FBQztxQkFDUixDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBc0MsRUFBRSxNQUFtQjtZQUMzRSxNQUFNLFVBQVUsR0FBRywyQ0FBb0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEQsTUFBTSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUM7UUFD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