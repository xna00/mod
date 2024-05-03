/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/browser/stableEditorScroll"], function (require, exports, editOperation_1, range_1, stableEditorScroll_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FormattingEdit = void 0;
    class FormattingEdit {
        static _handleEolEdits(editor, edits) {
            let newEol = undefined;
            const singleEdits = [];
            for (const edit of edits) {
                if (typeof edit.eol === 'number') {
                    newEol = edit.eol;
                }
                if (edit.range && typeof edit.text === 'string') {
                    singleEdits.push(edit);
                }
            }
            if (typeof newEol === 'number') {
                if (editor.hasModel()) {
                    editor.getModel().pushEOL(newEol);
                }
            }
            return singleEdits;
        }
        static _isFullModelReplaceEdit(editor, edit) {
            if (!editor.hasModel()) {
                return false;
            }
            const model = editor.getModel();
            const editRange = model.validateRange(edit.range);
            const fullModelRange = model.getFullModelRange();
            return fullModelRange.equalsRange(editRange);
        }
        static execute(editor, _edits, addUndoStops) {
            if (addUndoStops) {
                editor.pushUndoStop();
            }
            const scrollState = stableEditorScroll_1.StableEditorScrollState.capture(editor);
            const edits = FormattingEdit._handleEolEdits(editor, _edits);
            if (edits.length === 1 && FormattingEdit._isFullModelReplaceEdit(editor, edits[0])) {
                // We use replace semantics and hope that markers stay put...
                editor.executeEdits('formatEditsCommand', edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
            }
            else {
                editor.executeEdits('formatEditsCommand', edits.map(edit => editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.range), edit.text)));
            }
            if (addUndoStops) {
                editor.pushUndoStop();
            }
            scrollState.restoreRelativeVerticalPositionOfCursor(editor);
        }
    }
    exports.FormattingEdit = FormattingEdit;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0dGluZ0VkaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2Zvcm1hdC9icm93c2VyL2Zvcm1hdHRpbmdFZGl0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFhLGNBQWM7UUFFbEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFtQixFQUFFLEtBQWlCO1lBQ3BFLElBQUksTUFBTSxHQUFrQyxTQUFTLENBQUM7WUFDdEQsTUFBTSxXQUFXLEdBQTJCLEVBQUUsQ0FBQztZQUUvQyxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDbEMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ25CLENBQUM7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDakQsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEIsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUN2QixNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sV0FBVyxDQUFDO1FBQ3BCLENBQUM7UUFFTyxNQUFNLENBQUMsdUJBQXVCLENBQUMsTUFBbUIsRUFBRSxJQUEwQjtZQUNyRixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsRCxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNqRCxPQUFPLGNBQWMsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBbUIsRUFBRSxNQUFrQixFQUFFLFlBQXFCO1lBQzVFLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QixDQUFDO1lBQ0QsTUFBTSxXQUFXLEdBQUcsNENBQXVCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzdELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNwRiw2REFBNkQ7Z0JBQzdELE1BQU0sQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLDZCQUFhLENBQUMsT0FBTyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEgsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLDZCQUFhLENBQUMsV0FBVyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUgsQ0FBQztZQUNELElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN2QixDQUFDO1lBQ0QsV0FBVyxDQUFDLHVDQUF1QyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdELENBQUM7S0FDRDtJQW5ERCx3Q0FtREMifQ==