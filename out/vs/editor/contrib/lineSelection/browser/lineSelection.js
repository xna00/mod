/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/editorContextKeys", "vs/nls"], function (require, exports, editorExtensions_1, cursorMoveCommands_1, editorContextKeys_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExpandLineSelectionAction = void 0;
    class ExpandLineSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'expandLineSelection',
                label: nls.localize('expandLineSelection', "Expand Line Selection"),
                alias: 'Expand Line Selection',
                precondition: undefined,
                kbOpts: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */
                },
            });
        }
        run(_accessor, editor, args) {
            args = args || {};
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            viewModel.model.pushStackElement();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.expandLineSelection(viewModel, viewModel.getCursorStates()));
            viewModel.revealAllCursors(args.source, true);
        }
    }
    exports.ExpandLineSelectionAction = ExpandLineSelectionAction;
    (0, editorExtensions_1.registerEditorAction)(ExpandLineSelectionAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVNlbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvbGluZVNlbGVjdGlvbi9icm93c2VyL2xpbmVTZWxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLE1BQWEseUJBQTBCLFNBQVEsK0JBQVk7UUFDMUQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHFCQUFxQjtnQkFDekIsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsdUJBQXVCLENBQUM7Z0JBQ25FLEtBQUssRUFBRSx1QkFBdUI7Z0JBQzlCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSxxQ0FBNkI7b0JBQ25DLE1BQU0sRUFBRSxxQ0FBaUIsQ0FBQyxjQUFjO29CQUN4QyxPQUFPLEVBQUUsaURBQTZCO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsU0FBMkIsRUFBRSxNQUFtQixFQUFFLElBQVM7WUFDckUsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN6QyxTQUFTLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDbkMsU0FBUyxDQUFDLGVBQWUsQ0FDeEIsSUFBSSxDQUFDLE1BQU0sdUNBRVgsdUNBQWtCLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUM5RSxDQUFDO1lBQ0YsU0FBUyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDL0MsQ0FBQztLQUNEO0lBN0JELDhEQTZCQztJQUVELElBQUEsdUNBQW9CLEVBQUMseUJBQXlCLENBQUMsQ0FBQyJ9