/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/caretOperations/browser/moveCaretCommand", "vs/nls"], function (require, exports, editorExtensions_1, editorContextKeys_1, moveCaretCommand_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MoveCaretAction extends editorExtensions_1.EditorAction {
        constructor(left, opts) {
            super(opts);
            this.left = left;
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const commands = [];
            const selections = editor.getSelections();
            for (const selection of selections) {
                commands.push(new moveCaretCommand_1.MoveCaretCommand(selection, this.left));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class MoveCaretLeftAction extends MoveCaretAction {
        constructor() {
            super(true, {
                id: 'editor.action.moveCarretLeftAction',
                label: nls.localize('caret.moveLeft', "Move Selected Text Left"),
                alias: 'Move Selected Text Left',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    class MoveCaretRightAction extends MoveCaretAction {
        constructor() {
            super(false, {
                id: 'editor.action.moveCarretRightAction',
                label: nls.localize('caret.moveRight', "Move Selected Text Right"),
                alias: 'Move Selected Text Right',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    (0, editorExtensions_1.registerEditorAction)(MoveCaretLeftAction);
    (0, editorExtensions_1.registerEditorAction)(MoveCaretRightAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FyZXRPcGVyYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jYXJldE9wZXJhdGlvbnMvYnJvd3Nlci9jYXJldE9wZXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSxlQUFnQixTQUFRLCtCQUFZO1FBSXpDLFlBQVksSUFBYSxFQUFFLElBQW9CO1lBQzlDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVaLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLENBQUM7UUFFTSxHQUFHLENBQUMsUUFBMEIsRUFBRSxNQUFtQjtZQUN6RCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQWUsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUUxQyxLQUFLLE1BQU0sU0FBUyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNwQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksbUNBQWdCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDdEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN2QixDQUFDO0tBQ0Q7SUFFRCxNQUFNLG1CQUFvQixTQUFRLGVBQWU7UUFDaEQ7WUFDQyxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNYLEVBQUUsRUFBRSxvQ0FBb0M7Z0JBQ3hDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLHlCQUF5QixDQUFDO2dCQUNoRSxLQUFLLEVBQUUseUJBQXlCO2dCQUNoQyxZQUFZLEVBQUUscUNBQWlCLENBQUMsUUFBUTthQUN4QyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFFRCxNQUFNLG9CQUFxQixTQUFRLGVBQWU7UUFDakQ7WUFDQyxLQUFLLENBQUMsS0FBSyxFQUFFO2dCQUNaLEVBQUUsRUFBRSxxQ0FBcUM7Z0JBQ3pDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLDBCQUEwQixDQUFDO2dCQUNsRSxLQUFLLEVBQUUsMEJBQTBCO2dCQUNqQyxZQUFZLEVBQUUscUNBQWlCLENBQUMsUUFBUTthQUN4QyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFFRCxJQUFBLHVDQUFvQixFQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDMUMsSUFBQSx1Q0FBb0IsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDIn0=