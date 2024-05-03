/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls"], function (require, exports, lifecycle_1, editorExtensions_1, editorContextKeys_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CursorRedo = exports.CursorUndo = exports.CursorUndoRedoController = void 0;
    class CursorState {
        constructor(selections) {
            this.selections = selections;
        }
        equals(other) {
            const thisLen = this.selections.length;
            const otherLen = other.selections.length;
            if (thisLen !== otherLen) {
                return false;
            }
            for (let i = 0; i < thisLen; i++) {
                if (!this.selections[i].equalsSelection(other.selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class StackElement {
        constructor(cursorState, scrollTop, scrollLeft) {
            this.cursorState = cursorState;
            this.scrollTop = scrollTop;
            this.scrollLeft = scrollLeft;
        }
    }
    class CursorUndoRedoController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.cursorUndoRedoController'; }
        static get(editor) {
            return editor.getContribution(CursorUndoRedoController.ID);
        }
        constructor(editor) {
            super();
            this._editor = editor;
            this._isCursorUndoRedo = false;
            this._undoStack = [];
            this._redoStack = [];
            this._register(editor.onDidChangeModel((e) => {
                this._undoStack = [];
                this._redoStack = [];
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                this._undoStack = [];
                this._redoStack = [];
            }));
            this._register(editor.onDidChangeCursorSelection((e) => {
                if (this._isCursorUndoRedo) {
                    return;
                }
                if (!e.oldSelections) {
                    return;
                }
                if (e.oldModelVersionId !== e.modelVersionId) {
                    return;
                }
                const prevState = new CursorState(e.oldSelections);
                const isEqualToLastUndoStack = (this._undoStack.length > 0 && this._undoStack[this._undoStack.length - 1].cursorState.equals(prevState));
                if (!isEqualToLastUndoStack) {
                    this._undoStack.push(new StackElement(prevState, editor.getScrollTop(), editor.getScrollLeft()));
                    this._redoStack = [];
                    if (this._undoStack.length > 50) {
                        // keep the cursor undo stack bounded
                        this._undoStack.shift();
                    }
                }
            }));
        }
        cursorUndo() {
            if (!this._editor.hasModel() || this._undoStack.length === 0) {
                return;
            }
            this._redoStack.push(new StackElement(new CursorState(this._editor.getSelections()), this._editor.getScrollTop(), this._editor.getScrollLeft()));
            this._applyState(this._undoStack.pop());
        }
        cursorRedo() {
            if (!this._editor.hasModel() || this._redoStack.length === 0) {
                return;
            }
            this._undoStack.push(new StackElement(new CursorState(this._editor.getSelections()), this._editor.getScrollTop(), this._editor.getScrollLeft()));
            this._applyState(this._redoStack.pop());
        }
        _applyState(stackElement) {
            this._isCursorUndoRedo = true;
            this._editor.setSelections(stackElement.cursorState.selections);
            this._editor.setScrollPosition({
                scrollTop: stackElement.scrollTop,
                scrollLeft: stackElement.scrollLeft
            });
            this._isCursorUndoRedo = false;
        }
    }
    exports.CursorUndoRedoController = CursorUndoRedoController;
    class CursorUndo extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'cursorUndo',
                label: nls.localize('cursor.undo', "Cursor Undo"),
                alias: 'Cursor Undo',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 51 /* KeyCode.KeyU */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            CursorUndoRedoController.get(editor)?.cursorUndo();
        }
    }
    exports.CursorUndo = CursorUndo;
    class CursorRedo extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'cursorRedo',
                label: nls.localize('cursor.redo', "Cursor Redo"),
                alias: 'Cursor Redo',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            CursorUndoRedoController.get(editor)?.cursorRedo();
        }
    }
    exports.CursorRedo = CursorRedo;
    (0, editorExtensions_1.registerEditorContribution)(CursorUndoRedoController.ID, CursorUndoRedoController, 0 /* EditorContributionInstantiation.Eager */); // eager because it needs to listen to record cursor state ASAP
    (0, editorExtensions_1.registerEditorAction)(CursorUndo);
    (0, editorExtensions_1.registerEditorAction)(CursorRedo);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yVW5kby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY3Vyc29yVW5kby9icm93c2VyL2N1cnNvclVuZG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQU0sV0FBVztRQUdoQixZQUFZLFVBQWdDO1lBQzNDLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQzlCLENBQUM7UUFFTSxNQUFNLENBQUMsS0FBa0I7WUFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDdkMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDekMsSUFBSSxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUM5RCxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztLQUNEO0lBRUQsTUFBTSxZQUFZO1FBQ2pCLFlBQ2lCLFdBQXdCLEVBQ3hCLFNBQWlCLEVBQ2pCLFVBQWtCO1lBRmxCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUMvQixDQUFDO0tBQ0w7SUFFRCxNQUFhLHdCQUF5QixTQUFRLHNCQUFVO2lCQUVoQyxPQUFFLEdBQUcseUNBQXlDLENBQUM7UUFFL0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQTJCLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFRRCxZQUFZLE1BQW1CO1lBQzlCLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7WUFDdEIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUUvQixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUVyQixJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDdEQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDNUIsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQ3RCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQzlDLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ25ELE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pJLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO29CQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ2pHLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO29CQUNyQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDO3dCQUNqQyxxQ0FBcUM7d0JBQ3JDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sVUFBVTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqSixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFHLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU0sVUFBVTtZQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqSixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFHLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBRU8sV0FBVyxDQUFDLFlBQTBCO1lBQzdDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO2dCQUM5QixTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7Z0JBQ2pDLFVBQVUsRUFBRSxZQUFZLENBQUMsVUFBVTthQUNuQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQ2hDLENBQUM7O0lBL0VGLDREQWdGQztJQUVELE1BQWEsVUFBVyxTQUFRLCtCQUFZO1FBQzNDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxZQUFZO2dCQUNoQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO2dCQUNqRCxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLE1BQU0sRUFBRTtvQkFDUCxNQUFNLEVBQUUscUNBQWlCLENBQUMsY0FBYztvQkFDeEMsT0FBTyxFQUFFLGlEQUE2QjtvQkFDdEMsTUFBTSwwQ0FBZ0M7aUJBQ3RDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CLEVBQUUsSUFBUztZQUNwRSx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFDcEQsQ0FBQztLQUNEO0lBbEJELGdDQWtCQztJQUVELE1BQWEsVUFBVyxTQUFRLCtCQUFZO1FBQzNDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxZQUFZO2dCQUNoQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDO2dCQUNqRCxLQUFLLEVBQUUsYUFBYTtnQkFDcEIsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEdBQUcsQ0FBQyxRQUEwQixFQUFFLE1BQW1CLEVBQUUsSUFBUztZQUNwRSx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFDcEQsQ0FBQztLQUNEO0lBYkQsZ0NBYUM7SUFFRCxJQUFBLDZDQUEwQixFQUFDLHdCQUF3QixDQUFDLEVBQUUsRUFBRSx3QkFBd0IsZ0RBQXdDLENBQUMsQ0FBQywrREFBK0Q7SUFDekwsSUFBQSx1Q0FBb0IsRUFBQyxVQUFVLENBQUMsQ0FBQztJQUNqQyxJQUFBLHVDQUFvQixFQUFDLFVBQVUsQ0FBQyxDQUFDIn0=