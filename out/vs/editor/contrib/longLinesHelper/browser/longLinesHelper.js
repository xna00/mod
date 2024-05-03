/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions"], function (require, exports, lifecycle_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LongLinesHelper extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.longLinesHelper'; }
        static get(editor) {
            return editor.getContribution(LongLinesHelper.ID);
        }
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._register(this._editor.onMouseDown((e) => {
                const stopRenderingLineAfter = this._editor.getOption(117 /* EditorOption.stopRenderingLineAfter */);
                if (stopRenderingLineAfter >= 0 && e.target.type === 6 /* MouseTargetType.CONTENT_TEXT */ && e.target.position.column >= stopRenderingLineAfter) {
                    this._editor.updateOptions({
                        stopRenderingLineAfter: -1
                    });
                }
            }));
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(LongLinesHelper.ID, LongLinesHelper, 2 /* EditorContributionInstantiation.BeforeFirstInteraction */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9uZ0xpbmVzSGVscGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9sb25nTGluZXNIZWxwZXIvYnJvd3Nlci9sb25nTGluZXNIZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsTUFBTSxlQUFnQixTQUFRLHNCQUFVO2lCQUNoQixPQUFFLEdBQUcsZ0NBQWdDLENBQUM7UUFFdEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFtQjtZQUNwQyxPQUFPLE1BQU0sQ0FBQyxlQUFlLENBQWtCLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsWUFDa0IsT0FBb0I7WUFFckMsS0FBSyxFQUFFLENBQUM7WUFGUyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBSXJDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsK0NBQXFDLENBQUM7Z0JBQzNGLElBQUksc0JBQXNCLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSx5Q0FBaUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksc0JBQXNCLEVBQUUsQ0FBQztvQkFDekksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUM7d0JBQzFCLHNCQUFzQixFQUFFLENBQUMsQ0FBQztxQkFDMUIsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQzs7SUFHRixJQUFBLDZDQUEwQixFQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsZUFBZSxpRUFBeUQsQ0FBQyJ9