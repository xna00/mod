/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/nls", "vs/editor/contrib/colorPicker/browser/standaloneColorPickerWidget", "vs/editor/common/editorContextKeys", "vs/platform/actions/common/actions", "vs/css!./colorPicker"], function (require, exports, editorExtensions_1, nls_1, standaloneColorPickerWidget_1, editorContextKeys_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowOrFocusStandaloneColorPicker = void 0;
    class ShowOrFocusStandaloneColorPicker extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'editor.action.showOrFocusStandaloneColorPicker',
                title: {
                    ...(0, nls_1.localize2)('showOrFocusStandaloneColorPicker', "Show or Focus Standalone Color Picker"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'mishowOrFocusStandaloneColorPicker', comment: ['&& denotes a mnemonic'] }, "&&Show or Focus Standalone Color Picker"),
                },
                precondition: undefined,
                menu: [
                    { id: actions_1.MenuId.CommandPalette },
                ]
            });
        }
        runEditorCommand(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.showOrFocus();
        }
    }
    exports.ShowOrFocusStandaloneColorPicker = ShowOrFocusStandaloneColorPicker;
    class HideStandaloneColorPicker extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.hideColorPicker',
                label: (0, nls_1.localize)({
                    key: 'hideColorPicker',
                    comment: [
                        'Action that hides the color picker'
                    ]
                }, "Hide the Color Picker"),
                alias: 'Hide the Color Picker',
                precondition: editorContextKeys_1.EditorContextKeys.standaloneColorPickerVisible.isEqualTo(true),
                kbOpts: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.hide();
        }
    }
    class InsertColorWithStandaloneColorPicker extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertColorWithStandaloneColorPicker',
                label: (0, nls_1.localize)({
                    key: 'insertColorWithStandaloneColorPicker',
                    comment: [
                        'Action that inserts color with standalone color picker'
                    ]
                }, "Insert Color with Standalone Color Picker"),
                alias: 'Insert Color with Standalone Color Picker',
                precondition: editorContextKeys_1.EditorContextKeys.standaloneColorPickerFocused.isEqualTo(true),
                kbOpts: {
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            standaloneColorPickerWidget_1.StandaloneColorPickerController.get(editor)?.insertColor();
        }
    }
    (0, editorExtensions_1.registerEditorAction)(HideStandaloneColorPicker);
    (0, editorExtensions_1.registerEditorAction)(InsertColorWithStandaloneColorPicker);
    (0, actions_1.registerAction2)(ShowOrFocusStandaloneColorPicker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvbG9yUGlja2VyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9zdGFuZGFsb25lQ29sb3JQaWNrZXJBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFhLGdDQUFpQyxTQUFRLGdDQUFhO1FBQ2xFO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxnREFBZ0Q7Z0JBQ3BELEtBQUssRUFBRTtvQkFDTixHQUFHLElBQUEsZUFBUyxFQUFDLGtDQUFrQyxFQUFFLHVDQUF1QyxDQUFDO29CQUN6RixhQUFhLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsb0NBQW9DLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLHlDQUF5QyxDQUFDO2lCQUNySjtnQkFDRCxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxFQUFFLGdCQUFNLENBQUMsY0FBYyxFQUFFO2lCQUM3QjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxnQkFBZ0IsQ0FBQyxTQUEyQixFQUFFLE1BQW1CO1lBQ2hFLDZEQUErQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM1RCxDQUFDO0tBQ0Q7SUFqQkQsNEVBaUJDO0lBRUQsTUFBTSx5QkFBMEIsU0FBUSwrQkFBWTtRQUNuRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsK0JBQStCO2dCQUNuQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUM7b0JBQ2YsR0FBRyxFQUFFLGlCQUFpQjtvQkFDdEIsT0FBTyxFQUFFO3dCQUNSLG9DQUFvQztxQkFDcEM7aUJBQ0QsRUFBRSx1QkFBdUIsQ0FBQztnQkFDM0IsS0FBSyxFQUFFLHVCQUF1QjtnQkFDOUIsWUFBWSxFQUFFLHFDQUFpQixDQUFDLDRCQUE0QixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQzVFLE1BQU0sRUFBRTtvQkFDUCxPQUFPLHdCQUFnQjtvQkFDdkIsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUNNLEdBQUcsQ0FBQyxTQUEyQixFQUFFLE1BQW1CO1lBQzFELDZEQUErQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUNyRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLG9DQUFxQyxTQUFRLCtCQUFZO1FBQzlEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxvREFBb0Q7Z0JBQ3hELEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQztvQkFDZixHQUFHLEVBQUUsc0NBQXNDO29CQUMzQyxPQUFPLEVBQUU7d0JBQ1Isd0RBQXdEO3FCQUN4RDtpQkFDRCxFQUFFLDJDQUEyQyxDQUFDO2dCQUMvQyxLQUFLLEVBQUUsMkNBQTJDO2dCQUNsRCxZQUFZLEVBQUUscUNBQWlCLENBQUMsNEJBQTRCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDNUUsTUFBTSxFQUFFO29CQUNQLE9BQU8sdUJBQWU7b0JBQ3RCLE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFDTSxHQUFHLENBQUMsU0FBMkIsRUFBRSxNQUFtQjtZQUMxRCw2REFBK0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDNUQsQ0FBQztLQUNEO0lBRUQsSUFBQSx1Q0FBb0IsRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ2hELElBQUEsdUNBQW9CLEVBQUMsb0NBQW9DLENBQUMsQ0FBQztJQUMzRCxJQUFBLHlCQUFlLEVBQUMsZ0NBQWdDLENBQUMsQ0FBQyJ9