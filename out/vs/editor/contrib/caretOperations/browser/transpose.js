/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/cursor/cursorMoveOperations", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/nls"], function (require, exports, editorExtensions_1, replaceCommand_1, cursorMoveOperations_1, range_1, editorContextKeys_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TransposeLettersAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.transposeLetters',
                label: nls.localize('transposeLetters.label', "Transpose Letters"),
                alias: 'Transpose Letters',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 50 /* KeyCode.KeyT */
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const commands = [];
            const selections = editor.getSelections();
            for (const selection of selections) {
                if (!selection.isEmpty()) {
                    continue;
                }
                const lineNumber = selection.startLineNumber;
                const column = selection.startColumn;
                const lastColumn = model.getLineMaxColumn(lineNumber);
                if (lineNumber === 1 && (column === 1 || (column === 2 && lastColumn === 2))) {
                    // at beginning of file, nothing to do
                    continue;
                }
                // handle special case: when at end of line, transpose left two chars
                // otherwise, transpose left and right chars
                const endPosition = (column === lastColumn) ?
                    selection.getPosition() :
                    cursorMoveOperations_1.MoveOperations.rightPosition(model, selection.getPosition().lineNumber, selection.getPosition().column);
                const middlePosition = cursorMoveOperations_1.MoveOperations.leftPosition(model, endPosition);
                const beginPosition = cursorMoveOperations_1.MoveOperations.leftPosition(model, middlePosition);
                const leftChar = model.getValueInRange(range_1.Range.fromPositions(beginPosition, middlePosition));
                const rightChar = model.getValueInRange(range_1.Range.fromPositions(middlePosition, endPosition));
                const replaceRange = range_1.Range.fromPositions(beginPosition, endPosition);
                commands.push(new replaceCommand_1.ReplaceCommand(replaceRange, rightChar + leftChar));
            }
            if (commands.length > 0) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, commands);
                editor.pushUndoStop();
            }
        }
    }
    (0, editorExtensions_1.registerEditorAction)(TransposeLettersAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNwb3NlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jYXJldE9wZXJhdGlvbnMvYnJvd3Nlci90cmFuc3Bvc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsTUFBTSxzQkFBdUIsU0FBUSwrQkFBWTtRQUVoRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsZ0NBQWdDO2dCQUNwQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxtQkFBbUIsQ0FBQztnQkFDbEUsS0FBSyxFQUFFLG1CQUFtQjtnQkFDMUIsWUFBWSxFQUFFLHFDQUFpQixDQUFDLFFBQVE7Z0JBQ3hDLE1BQU0sRUFBRTtvQkFDUCxNQUFNLEVBQUUscUNBQWlCLENBQUMsY0FBYztvQkFDeEMsT0FBTyxFQUFFLENBQUM7b0JBQ1YsR0FBRyxFQUFFO3dCQUNKLE9BQU8sRUFBRSxnREFBNkI7cUJBQ3RDO29CQUNELE1BQU0sMENBQWdDO2lCQUN0QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sUUFBUSxHQUFlLEVBQUUsQ0FBQztZQUNoQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFMUMsS0FBSyxNQUFNLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO29CQUMxQixTQUFTO2dCQUNWLENBQUM7Z0JBRUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQztnQkFDN0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQztnQkFFckMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUV0RCxJQUFJLFVBQVUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUM5RSxzQ0FBc0M7b0JBQ3RDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxxRUFBcUU7Z0JBQ3JFLDRDQUE0QztnQkFDNUMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxNQUFNLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDNUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7b0JBQ3pCLHFDQUFjLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFekcsTUFBTSxjQUFjLEdBQUcscUNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLGFBQWEsR0FBRyxxQ0FBYyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0JBRXpFLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDM0YsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUUxRixNQUFNLFlBQVksR0FBRyxhQUFLLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDckUsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLCtCQUFjLENBQUMsWUFBWSxFQUFFLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxJQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7S0FDRDtJQUVELElBQUEsdUNBQW9CLEVBQUMsc0JBQXNCLENBQUMsQ0FBQyJ9