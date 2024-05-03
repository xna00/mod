/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/contrib/dnd/browser/dragAndDropCommand", "vs/css!./dnd"], function (require, exports, lifecycle_1, platform_1, editorExtensions_1, position_1, range_1, selection_1, textModel_1, dragAndDropCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropController = void 0;
    function hasTriggerModifier(e) {
        if (platform_1.isMacintosh) {
            return e.altKey;
        }
        else {
            return e.ctrlKey;
        }
    }
    class DragAndDropController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.dragAndDrop'; }
        static { this.TRIGGER_KEY_VALUE = platform_1.isMacintosh ? 6 /* KeyCode.Alt */ : 5 /* KeyCode.Ctrl */; }
        static get(editor) {
            return editor.getContribution(DragAndDropController.ID);
        }
        constructor(editor) {
            super();
            this._editor = editor;
            this._dndDecorationIds = this._editor.createDecorationsCollection();
            this._register(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
            this._register(this._editor.onMouseUp((e) => this._onEditorMouseUp(e)));
            this._register(this._editor.onMouseDrag((e) => this._onEditorMouseDrag(e)));
            this._register(this._editor.onMouseDrop((e) => this._onEditorMouseDrop(e)));
            this._register(this._editor.onMouseDropCanceled(() => this._onEditorMouseDropCanceled()));
            this._register(this._editor.onKeyDown((e) => this.onEditorKeyDown(e)));
            this._register(this._editor.onKeyUp((e) => this.onEditorKeyUp(e)));
            this._register(this._editor.onDidBlurEditorWidget(() => this.onEditorBlur()));
            this._register(this._editor.onDidBlurEditorText(() => this.onEditorBlur()));
            this._mouseDown = false;
            this._modifierPressed = false;
            this._dragSelection = null;
        }
        onEditorBlur() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
        }
        onEditorKeyDown(e) {
            if (!this._editor.getOption(35 /* EditorOption.dragAndDrop */) || this._editor.getOption(22 /* EditorOption.columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = true;
            }
            if (this._mouseDown && hasTriggerModifier(e)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
        }
        onEditorKeyUp(e) {
            if (!this._editor.getOption(35 /* EditorOption.dragAndDrop */) || this._editor.getOption(22 /* EditorOption.columnSelection */)) {
                return;
            }
            if (hasTriggerModifier(e)) {
                this._modifierPressed = false;
            }
            if (this._mouseDown && e.keyCode === DragAndDropController.TRIGGER_KEY_VALUE) {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._mouseDown = true;
        }
        _onEditorMouseUp(mouseEvent) {
            this._mouseDown = false;
            // Whenever users release the mouse, the drag and drop operation should finish and the cursor should revert to text.
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
        }
        _onEditorMouseDrag(mouseEvent) {
            const target = mouseEvent.target;
            if (this._dragSelection === null) {
                const selections = this._editor.getSelections() || [];
                const possibleSelections = selections.filter(selection => target.position && selection.containsPosition(target.position));
                if (possibleSelections.length === 1) {
                    this._dragSelection = possibleSelections[0];
                }
                else {
                    return;
                }
            }
            if (hasTriggerModifier(mouseEvent.event)) {
                this._editor.updateOptions({
                    mouseStyle: 'copy'
                });
            }
            else {
                this._editor.updateOptions({
                    mouseStyle: 'default'
                });
            }
            if (target.position) {
                if (this._dragSelection.containsPosition(target.position)) {
                    this._removeDecoration();
                }
                else {
                    this.showAt(target.position);
                }
            }
        }
        _onEditorMouseDropCanceled() {
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
        }
        _onEditorMouseDrop(mouseEvent) {
            if (mouseEvent.target && (this._hitContent(mouseEvent.target) || this._hitMargin(mouseEvent.target)) && mouseEvent.target.position) {
                const newCursorPosition = new position_1.Position(mouseEvent.target.position.lineNumber, mouseEvent.target.position.column);
                if (this._dragSelection === null) {
                    let newSelections = null;
                    if (mouseEvent.event.shiftKey) {
                        const primarySelection = this._editor.getSelection();
                        if (primarySelection) {
                            const { selectionStartLineNumber, selectionStartColumn } = primarySelection;
                            newSelections = [new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, newCursorPosition.lineNumber, newCursorPosition.column)];
                        }
                    }
                    else {
                        newSelections = (this._editor.getSelections() || []).map(selection => {
                            if (selection.containsPosition(newCursorPosition)) {
                                return new selection_1.Selection(newCursorPosition.lineNumber, newCursorPosition.column, newCursorPosition.lineNumber, newCursorPosition.column);
                            }
                            else {
                                return selection;
                            }
                        });
                    }
                    // Use `mouse` as the source instead of `api` and setting the reason to explicit (to behave like any other mouse operation).
                    this._editor.setSelections(newSelections || [], 'mouse', 3 /* CursorChangeReason.Explicit */);
                }
                else if (!this._dragSelection.containsPosition(newCursorPosition) ||
                    ((hasTriggerModifier(mouseEvent.event) ||
                        this._modifierPressed) && (this._dragSelection.getEndPosition().equals(newCursorPosition) || this._dragSelection.getStartPosition().equals(newCursorPosition)) // we allow users to paste content beside the selection
                    )) {
                    this._editor.pushUndoStop();
                    this._editor.executeCommand(DragAndDropController.ID, new dragAndDropCommand_1.DragAndDropCommand(this._dragSelection, newCursorPosition, hasTriggerModifier(mouseEvent.event) || this._modifierPressed));
                    this._editor.pushUndoStop();
                }
            }
            this._editor.updateOptions({
                mouseStyle: 'text'
            });
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
        }
        static { this._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
            description: 'dnd-target',
            className: 'dnd-target'
        }); }
        showAt(position) {
            this._dndDecorationIds.set([{
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                    options: DragAndDropController._DECORATION_OPTIONS
                }]);
            this._editor.revealPosition(position, 1 /* ScrollType.Immediate */);
        }
        _removeDecoration() {
            this._dndDecorationIds.clear();
        }
        _hitContent(target) {
            return target.type === 6 /* MouseTargetType.CONTENT_TEXT */ ||
                target.type === 7 /* MouseTargetType.CONTENT_EMPTY */;
        }
        _hitMargin(target) {
            return target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ ||
                target.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ ||
                target.type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */;
        }
        dispose() {
            this._removeDecoration();
            this._dragSelection = null;
            this._mouseDown = false;
            this._modifierPressed = false;
            super.dispose();
        }
    }
    exports.DragAndDropController = DragAndDropController;
    (0, editorExtensions_1.registerEditorContribution)(DragAndDropController.ID, DragAndDropController, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9kbmQvYnJvd3Nlci9kbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxTQUFTLGtCQUFrQixDQUFDLENBQStCO1FBQzFELElBQUksc0JBQVcsRUFBRSxDQUFDO1lBQ2pCLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNqQixDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNsQixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQWEscUJBQXNCLFNBQVEsc0JBQVU7aUJBRTdCLE9BQUUsR0FBRyw0QkFBNEIsQ0FBQztpQkFPekMsc0JBQWlCLEdBQUcsc0JBQVcsQ0FBQyxDQUFDLHFCQUFhLENBQUMscUJBQWEsQ0FBQztRQUU3RSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQW1CO1lBQzdCLE9BQU8sTUFBTSxDQUFDLGVBQWUsQ0FBd0IscUJBQXFCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELFlBQVksTUFBbUI7WUFDOUIsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBQ3BFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9GLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUEyQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFpQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQzVCLENBQUM7UUFFTyxZQUFZO1lBQ25CLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7UUFDL0IsQ0FBQztRQUVPLGVBQWUsQ0FBQyxDQUFpQjtZQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLG1DQUEwQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyx1Q0FBOEIsRUFBRSxDQUFDO2dCQUMvRyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztZQUM5QixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO29CQUMxQixVQUFVLEVBQUUsTUFBTTtpQkFDbEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsQ0FBaUI7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxtQ0FBMEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsdUNBQThCLEVBQUUsQ0FBQztnQkFDL0csT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7WUFDL0IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzlFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO29CQUMxQixVQUFVLEVBQUUsU0FBUztpQkFDckIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxVQUE2QjtZQUN2RCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztRQUN4QixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsVUFBNkI7WUFDckQsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFDeEIsb0hBQW9IO1lBQ3BILElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO2dCQUMxQixVQUFVLEVBQUUsTUFBTTthQUNsQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBNkI7WUFDdkQsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztZQUVqQyxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUN0RCxNQUFNLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDMUgsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxjQUFjLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPO2dCQUNSLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7b0JBQzFCLFVBQVUsRUFBRSxNQUFNO2lCQUNsQixDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7b0JBQzFCLFVBQVUsRUFBRSxTQUFTO2lCQUNyQixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3JCLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDM0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzFCLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sMEJBQTBCO1lBQ2pDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO2dCQUMxQixVQUFVLEVBQUUsTUFBTTthQUNsQixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBb0M7WUFDOUQsSUFBSSxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNwSSxNQUFNLGlCQUFpQixHQUFHLElBQUksbUJBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWpILElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDbEMsSUFBSSxhQUFhLEdBQXVCLElBQUksQ0FBQztvQkFDN0MsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUMvQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7d0JBQ3JELElBQUksZ0JBQWdCLEVBQUUsQ0FBQzs0QkFDdEIsTUFBTSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLEdBQUcsZ0JBQWdCLENBQUM7NEJBQzVFLGFBQWEsR0FBRyxDQUFDLElBQUkscUJBQVMsQ0FBQyx3QkFBd0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQzt3QkFDekksQ0FBQztvQkFDRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7NEJBQ3BFLElBQUksU0FBUyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztnQ0FDbkQsT0FBTyxJQUFJLHFCQUFTLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7NEJBQ3RJLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCxPQUFPLFNBQVMsQ0FBQzs0QkFDbEIsQ0FBQzt3QkFDRixDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDO29CQUNELDRIQUE0SDtvQkFDekcsSUFBSSxDQUFDLE9BQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxJQUFJLEVBQUUsRUFBRSxPQUFPLHNDQUE4QixDQUFDO2dCQUMzRyxDQUFDO3FCQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDO29CQUNsRSxDQUNDLENBQ0Msa0JBQWtCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQzt3QkFDcEMsSUFBSSxDQUFDLGdCQUFnQixDQUNyQixJQUFJLENBQ0osSUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQixFQUFFLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQ2xJLENBQUMsdURBQXVEO3FCQUN6RCxFQUFFLENBQUM7b0JBQ0osSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsRUFBRSxFQUFFLElBQUksdUNBQWtCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztvQkFDckwsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztnQkFDMUIsVUFBVSxFQUFFLE1BQU07YUFDbEIsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDekIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDekIsQ0FBQztpQkFFdUIsd0JBQW1CLEdBQUcsa0NBQXNCLENBQUMsUUFBUSxDQUFDO1lBQzdFLFdBQVcsRUFBRSxZQUFZO1lBQ3pCLFNBQVMsRUFBRSxZQUFZO1NBQ3ZCLENBQUMsQ0FBQztRQUVJLE1BQU0sQ0FBQyxRQUFrQjtZQUMvQixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzNCLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO29CQUM1RixPQUFPLEVBQUUscUJBQXFCLENBQUMsbUJBQW1CO2lCQUNsRCxDQUFDLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFFBQVEsK0JBQXVCLENBQUM7UUFDN0QsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxNQUFvQjtZQUN2QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLHlDQUFpQztnQkFDbEQsTUFBTSxDQUFDLElBQUksMENBQWtDLENBQUM7UUFDaEQsQ0FBQztRQUVPLFVBQVUsQ0FBQyxNQUFvQjtZQUN0QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLGdEQUF3QztnQkFDekQsTUFBTSxDQUFDLElBQUksZ0RBQXdDO2dCQUNuRCxNQUFNLENBQUMsSUFBSSxvREFBNEMsQ0FBQztRQUMxRCxDQUFDO1FBRWUsT0FBTztZQUN0QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN6QixJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUMzQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1lBQzlCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDOztJQS9NRixzREFnTkM7SUFFRCxJQUFBLDZDQUEwQixFQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxxQkFBcUIsaUVBQXlELENBQUMifQ==