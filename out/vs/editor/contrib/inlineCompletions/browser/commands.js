/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/observable", "vs/base/common/observableInternal/base", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/inlineCompletions/browser/commandIds", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionContextKeys", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey"], function (require, exports, observable_1, base_1, editorExtensions_1, editorContextKeys_1, commandIds_1, inlineCompletionContextKeys_1, inlineCompletionsController_1, suggest_1, nls, actions_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleAlwaysShowInlineSuggestionToolbar = exports.HideInlineCompletion = exports.AcceptInlineCompletion = exports.AcceptNextLineOfInlineCompletion = exports.AcceptNextWordOfInlineCompletion = exports.TriggerInlineSuggestionAction = exports.ShowPreviousInlineSuggestionAction = exports.ShowNextInlineSuggestionAction = void 0;
    class ShowNextInlineSuggestionAction extends editorExtensions_1.EditorAction {
        static { this.ID = commandIds_1.showNextInlineSuggestionActionId; }
        constructor() {
            super({
                id: ShowNextInlineSuggestionAction.ID,
                label: nls.localize('action.inlineSuggest.showNext', "Show Next Inline Suggestion"),
                alias: 'Show Next Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100,
                    primary: 512 /* KeyMod.Alt */ | 94 /* KeyCode.BracketRight */,
                },
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            controller?.model.get()?.next();
        }
    }
    exports.ShowNextInlineSuggestionAction = ShowNextInlineSuggestionAction;
    class ShowPreviousInlineSuggestionAction extends editorExtensions_1.EditorAction {
        static { this.ID = commandIds_1.showPreviousInlineSuggestionActionId; }
        constructor() {
            super({
                id: ShowPreviousInlineSuggestionAction.ID,
                label: nls.localize('action.inlineSuggest.showPrevious', "Show Previous Inline Suggestion"),
                alias: 'Show Previous Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100,
                    primary: 512 /* KeyMod.Alt */ | 92 /* KeyCode.BracketLeft */,
                },
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            controller?.model.get()?.previous();
        }
    }
    exports.ShowPreviousInlineSuggestionAction = ShowPreviousInlineSuggestionAction;
    class TriggerInlineSuggestionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inlineSuggest.trigger',
                label: nls.localize('action.inlineSuggest.trigger', "Trigger Inline Suggestion"),
                alias: 'Trigger Inline Suggestion',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            await (0, base_1.asyncTransaction)(async (tx) => {
                /** @description triggerExplicitly from command */
                await controller?.model.get()?.triggerExplicitly(tx);
                controller?.playAccessibilitySignal(tx);
            });
        }
    }
    exports.TriggerInlineSuggestionAction = TriggerInlineSuggestionAction;
    class AcceptNextWordOfInlineCompletion extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inlineSuggest.acceptNextWord',
                label: nls.localize('action.inlineSuggest.acceptNextWord', "Accept Next Word Of Inline Suggestion"),
                alias: 'Accept Next Word Of Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible),
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineSuggestionToolbar,
                        title: nls.localize('acceptWord', 'Accept Word'),
                        group: 'primary',
                        order: 2,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            await controller?.model.get()?.acceptNextWord(controller.editor);
        }
    }
    exports.AcceptNextWordOfInlineCompletion = AcceptNextWordOfInlineCompletion;
    class AcceptNextLineOfInlineCompletion extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inlineSuggest.acceptNextLine',
                label: nls.localize('action.inlineSuggest.acceptNextLine', "Accept Next Line Of Inline Suggestion"),
                alias: 'Accept Next Line Of Inline Suggestion',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible),
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ + 1,
                },
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineSuggestionToolbar,
                        title: nls.localize('acceptLine', 'Accept Line'),
                        group: 'secondary',
                        order: 2,
                    }],
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            await controller?.model.get()?.acceptNextLine(controller.editor);
        }
    }
    exports.AcceptNextLineOfInlineCompletion = AcceptNextLineOfInlineCompletion;
    class AcceptInlineCompletion extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: commandIds_1.inlineSuggestCommitId,
                label: nls.localize('action.inlineSuggest.accept', "Accept Inline Suggestion"),
                alias: 'Accept Inline Suggestion',
                precondition: inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible,
                menuOpts: [{
                        menuId: actions_1.MenuId.InlineSuggestionToolbar,
                        title: nls.localize('accept', "Accept"),
                        group: 'primary',
                        order: 1,
                    }],
                kbOpts: {
                    primary: 2 /* KeyCode.Tab */,
                    weight: 200,
                    kbExpr: contextkey_1.ContextKeyExpr.and(inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible, editorContextKeys_1.EditorContextKeys.tabMovesFocus.toNegated(), inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionHasIndentationLessThanTabSize, suggest_1.Context.Visible.toNegated(), editorContextKeys_1.EditorContextKeys.hoverFocused.toNegated()),
                }
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            if (controller) {
                controller.model.get()?.accept(controller.editor);
                controller.editor.focus();
            }
        }
    }
    exports.AcceptInlineCompletion = AcceptInlineCompletion;
    class HideInlineCompletion extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.inlineSuggest.hide'; }
        constructor() {
            super({
                id: HideInlineCompletion.ID,
                label: nls.localize('action.inlineSuggest.hide', "Hide Inline Suggestion"),
                alias: 'Hide Inline Suggestion',
                precondition: inlineCompletionContextKeys_1.InlineCompletionContextKeys.inlineSuggestionVisible,
                kbOpts: {
                    weight: 100,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        async run(accessor, editor) {
            const controller = inlineCompletionsController_1.InlineCompletionsController.get(editor);
            (0, observable_1.transaction)(tx => {
                controller?.model.get()?.stop(tx);
            });
        }
    }
    exports.HideInlineCompletion = HideInlineCompletion;
    class ToggleAlwaysShowInlineSuggestionToolbar extends actions_1.Action2 {
        static { this.ID = 'editor.action.inlineSuggest.toggleAlwaysShowToolbar'; }
        constructor() {
            super({
                id: ToggleAlwaysShowInlineSuggestionToolbar.ID,
                title: nls.localize('action.inlineSuggest.alwaysShowToolbar', "Always Show Toolbar"),
                f1: false,
                precondition: undefined,
                menu: [{
                        id: actions_1.MenuId.InlineSuggestionToolbar,
                        group: 'secondary',
                        order: 10,
                    }],
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.inlineSuggest.showToolbar', 'always')
            });
        }
        async run(accessor, editor) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            const currentValue = configService.getValue('editor.inlineSuggest.showToolbar');
            const newValue = currentValue === 'always' ? 'onHover' : 'always';
            configService.updateValue('editor.inlineSuggest.showToolbar', newValue);
        }
    }
    exports.ToggleAlwaysShowInlineSuggestionToolbar = ToggleAlwaysShowInlineSuggestionToolbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvY29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFhLDhCQUErQixTQUFRLCtCQUFZO2lCQUNqRCxPQUFFLEdBQUcsNkNBQWdDLENBQUM7UUFDcEQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDhCQUE4QixDQUFDLEVBQUU7Z0JBQ3JDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLCtCQUErQixFQUFFLDZCQUE2QixDQUFDO2dCQUNuRixLQUFLLEVBQUUsNkJBQTZCO2dCQUNwQyxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMscUNBQWlCLENBQUMsUUFBUSxFQUFFLHlEQUEyQixDQUFDLHVCQUF1QixDQUFDO2dCQUNqSCxNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsT0FBTyxFQUFFLG9EQUFpQztpQkFDMUM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFzQyxFQUFFLE1BQW1CO1lBQzNFLE1BQU0sVUFBVSxHQUFHLHlEQUEyQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzRCxVQUFVLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQ2pDLENBQUM7O0lBbEJGLHdFQW1CQztJQUVELE1BQWEsa0NBQW1DLFNBQVEsK0JBQVk7aUJBQ3JELE9BQUUsR0FBRyxpREFBb0MsQ0FBQztRQUN4RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDLENBQUMsRUFBRTtnQkFDekMsS0FBSyxFQUFF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