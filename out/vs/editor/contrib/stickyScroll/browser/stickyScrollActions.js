/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/contrib/stickyScroll/browser/stickyScrollController"], function (require, exports, editorExtensions_1, nls_1, actionCommonCategories_1, actions_1, configuration_1, contextkey_1, editorContextKeys_1, stickyScrollController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectEditor = exports.GoToStickyScrollLine = exports.SelectPreviousStickyScrollLine = exports.SelectNextStickyScrollLine = exports.FocusStickyScroll = exports.ToggleStickyScroll = void 0;
    class ToggleStickyScroll extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.toggleStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('toggleEditorStickyScroll', "Toggle Editor Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mitoggleStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Toggle Editor Sticky Scroll"),
                },
                category: actionCommonCategories_1.Categories.View,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.editor.stickyScroll.enabled', true),
                    title: (0, nls_1.localize)('stickyScroll', "Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Sticky Scroll"),
                },
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                    { id: actions_1.MenuId.MenubarAppearanceMenu, group: '4_editor', order: 3 },
                    { id: actions_1.MenuId.StickyScrollContext }
                ]
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('editor.stickyScroll.enabled');
            return configurationService.updateValue('editor.stickyScroll.enabled', newValue);
        }
    }
    exports.ToggleStickyScroll = ToggleStickyScroll;
    const weight = 100 /* KeybindingWeight.EditorContrib */;
    class FocusStickyScroll extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.focusStickyScroll',
                title: {
                    ...(0, nls_1.localize2)('focusStickyScroll', "Focus Sticky Scroll"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mifocusStickyScroll', comment: ['&& denotes a mnemonic'] }, "&&Focus Sticky Scroll"),
                },
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('config.editor.stickyScroll.enabled'), editorContextKeys_1.EditorContextKeys.stickyScrollVisible),
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                ]
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focus();
        }
    }
    exports.FocusStickyScroll = FocusStickyScroll;
    class SelectNextStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectNextStickyScrollLine',
                title: (0, nls_1.localize2)('selectNextStickyScrollLine.title', "Select next sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 18 /* KeyCode.DownArrow */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focusNext();
        }
    }
    exports.SelectNextStickyScrollLine = SelectNextStickyScrollLine;
    class SelectPreviousStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectPreviousStickyScrollLine',
                title: (0, nls_1.localize2)('selectPreviousStickyScrollLine.title', "Select previous sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 16 /* KeyCode.UpArrow */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.focusPrevious();
        }
    }
    exports.SelectPreviousStickyScrollLine = SelectPreviousStickyScrollLine;
    class GoToStickyScrollLine extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.goToFocusedStickyScrollLine',
                title: (0, nls_1.localize2)('goToFocusedStickyScrollLine.title', "Go to focused sticky scroll line"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 3 /* KeyCode.Enter */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.goToFocused();
        }
    }
    exports.GoToStickyScrollLine = GoToStickyScrollLine;
    class SelectEditor extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.selectEditor',
                title: (0, nls_1.localize2)('selectEditor.title', "Select Editor"),
                precondition: editorContextKeys_1.EditorContextKeys.stickyScrollFocused.isEqualTo(true),
                keybinding: {
                    weight,
                    primary: 9 /* KeyCode.Escape */
                }
            });
        }
        runEditorCommand(_accessor, editor) {
            stickyScrollController_1.StickyScrollController.get(editor)?.selectEditor();
        }
    }
    exports.SelectEditor = SelectEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvc3RpY2t5U2Nyb2xsQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxrQkFBbUIsU0FBUSxpQkFBTztRQUU5QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0NBQWtDO2dCQUN0QyxLQUFLLEVBQUU7b0JBQ04sR0FBRyxJQUFBLGVBQVMsRUFBQywwQkFBMEIsRUFBRSw2QkFBNkIsQ0FBQztvQkFDdkUsYUFBYSxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSwrQkFBK0IsQ0FBQztpQkFDN0g7Z0JBQ0QsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsT0FBTyxFQUFFO29CQUNSLFNBQVMsRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsRUFBRSxJQUFJLENBQUM7b0JBQzVFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZUFBZSxDQUFDO29CQUNoRCxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLGlCQUFpQixDQUFDO2lCQUN6RztnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7b0JBQzdCLEVBQUUsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFO29CQUNqRSxFQUFFLEVBQUUsRUFBRSxnQkFBTSxDQUFDLG1CQUFtQixFQUFFO2lCQUNsQzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCO1lBQzVDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sUUFBUSxHQUFHLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDL0UsT0FBTyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsNkJBQTZCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEYsQ0FBQztLQUNEO0lBNUJELGdEQTRCQztJQUVELE1BQU0sTUFBTSwyQ0FBaUMsQ0FBQztJQUU5QyxNQUFhLGlCQUFrQixTQUFRLGdDQUFhO1FBRW5EO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxpQ0FBaUM7Z0JBQ3JDLEtBQUssRUFBRTtvQkFDTixHQUFHLElBQUEsZUFBUyxFQUFDLG1CQUFtQixFQUFFLHFCQUFxQixDQUFDO29CQUN4RCxhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHVCQUF1QixDQUFDO2lCQUNwSDtnQkFDRCxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQW9DLENBQUMsRUFBRSxxQ0FBaUIsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDakksSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYyxFQUFFO2lCQUM3QjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxTQUEyQixFQUFFLE1BQW1CO1lBQ2hFLCtDQUFzQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFuQkQsOENBbUJDO0lBRUQsTUFBYSwwQkFBMkIsU0FBUSxnQ0FBYTtRQUM1RDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMENBQTBDO2dCQUM5QyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsa0NBQWtDLEVBQUUsZ0NBQWdDLENBQUM7Z0JBQ3RGLFlBQVksRUFBRSxxQ0FBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUNuRSxVQUFVLEVBQUU7b0JBQ1gsTUFBTTtvQkFDTixPQUFPLDRCQUFtQjtpQkFDMUI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsZ0JBQWdCLENBQUMsU0FBMkIsRUFBRSxNQUFtQjtZQUNoRSwrQ0FBc0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFDakQsQ0FBQztLQUNEO0lBaEJELGdFQWdCQztJQUVELE1BQWEsOEJBQStCLFNBQVEsZ0NBQWE7UUFDaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDhDQUE4QztnQkFDbEQsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLHNDQUFzQyxFQUFFLG9DQUFvQyxDQUFDO2dCQUM5RixZQUFZLEVBQUUscUNBQWlCLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDbkUsVUFBVSxFQUFFO29CQUNYLE1BQU07b0JBQ04sT0FBTywwQkFBaUI7aUJBQ3hCO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGdCQUFnQixDQUFDLFNBQTJCLEVBQUUsTUFBbUI7WUFDaEUsK0NBQXNCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDO1FBQ3JELENBQUM7S0FDRDtJQWhCRCx3RUFnQkM7SUFFRCxNQUFhLG9CQUFxQixTQUFRLGdDQUFhO1FBQ3REO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQ0FBMkM7Z0JBQy9DLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxtQ0FBbUMsRUFBRSxrQ0FBa0MsQ0FBQztnQkFDekYsWUFBWSxFQUFFLHFDQUFpQixDQUFDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25FLFVBQVUsRUFBRTtvQkFDWCxNQUFNO29CQUNOLE9BQU8sdUJBQWU7aUJBQ3RCO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGdCQUFnQixDQUFDLFNBQTJCLEVBQUUsTUFBbUI7WUFDaEUsK0NBQXNCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQ25ELENBQUM7S0FDRDtJQWhCRCxvREFnQkM7SUFFRCxNQUFhLFlBQWEsU0FBUSxnQ0FBYTtRQUU5QztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsNEJBQTRCO2dCQUNoQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsb0JBQW9CLEVBQUUsZUFBZSxDQUFDO2dCQUN2RCxZQUFZLEVBQUUscUNBQWlCLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDbkUsVUFBVSxFQUFFO29CQUNYLE1BQU07b0JBQ04sT0FBTyx3QkFBZ0I7aUJBQ3ZCO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELGdCQUFnQixDQUFDLFNBQTJCLEVBQUUsTUFBbUI7WUFDaEUsK0NBQXNCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQ3BELENBQUM7S0FDRDtJQWpCRCxvQ0FpQkMifQ==