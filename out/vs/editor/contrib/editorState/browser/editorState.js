/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/contrib/editorState/browser/keybindingCancellation"], function (require, exports, strings, range_1, cancellation_1, lifecycle_1, keybindingCancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelCancellationTokenSource = exports.EditorStateCancellationTokenSource = exports.EditorState = exports.CodeEditorStateFlag = void 0;
    var CodeEditorStateFlag;
    (function (CodeEditorStateFlag) {
        CodeEditorStateFlag[CodeEditorStateFlag["Value"] = 1] = "Value";
        CodeEditorStateFlag[CodeEditorStateFlag["Selection"] = 2] = "Selection";
        CodeEditorStateFlag[CodeEditorStateFlag["Position"] = 4] = "Position";
        CodeEditorStateFlag[CodeEditorStateFlag["Scroll"] = 8] = "Scroll";
    })(CodeEditorStateFlag || (exports.CodeEditorStateFlag = CodeEditorStateFlag = {}));
    class EditorState {
        constructor(editor, flags) {
            this.flags = flags;
            if ((this.flags & 1 /* CodeEditorStateFlag.Value */) !== 0) {
                const model = editor.getModel();
                this.modelVersionId = model ? strings.format('{0}#{1}', model.uri.toString(), model.getVersionId()) : null;
            }
            else {
                this.modelVersionId = null;
            }
            if ((this.flags & 4 /* CodeEditorStateFlag.Position */) !== 0) {
                this.position = editor.getPosition();
            }
            else {
                this.position = null;
            }
            if ((this.flags & 2 /* CodeEditorStateFlag.Selection */) !== 0) {
                this.selection = editor.getSelection();
            }
            else {
                this.selection = null;
            }
            if ((this.flags & 8 /* CodeEditorStateFlag.Scroll */) !== 0) {
                this.scrollLeft = editor.getScrollLeft();
                this.scrollTop = editor.getScrollTop();
            }
            else {
                this.scrollLeft = -1;
                this.scrollTop = -1;
            }
        }
        _equals(other) {
            if (!(other instanceof EditorState)) {
                return false;
            }
            const state = other;
            if (this.modelVersionId !== state.modelVersionId) {
                return false;
            }
            if (this.scrollLeft !== state.scrollLeft || this.scrollTop !== state.scrollTop) {
                return false;
            }
            if (!this.position && state.position || this.position && !state.position || this.position && state.position && !this.position.equals(state.position)) {
                return false;
            }
            if (!this.selection && state.selection || this.selection && !state.selection || this.selection && state.selection && !this.selection.equalsRange(state.selection)) {
                return false;
            }
            return true;
        }
        validate(editor) {
            return this._equals(new EditorState(editor, this.flags));
        }
    }
    exports.EditorState = EditorState;
    /**
     * A cancellation token source that cancels when the editor changes as expressed
     * by the provided flags
     * @param range If provided, changes in position and selection within this range will not trigger cancellation
     */
    class EditorStateCancellationTokenSource extends keybindingCancellation_1.EditorKeybindingCancellationTokenSource {
        constructor(editor, flags, range, parent) {
            super(editor, parent);
            this._listener = new lifecycle_1.DisposableStore();
            if (flags & 4 /* CodeEditorStateFlag.Position */) {
                this._listener.add(editor.onDidChangeCursorPosition(e => {
                    if (!range || !range_1.Range.containsPosition(range, e.position)) {
                        this.cancel();
                    }
                }));
            }
            if (flags & 2 /* CodeEditorStateFlag.Selection */) {
                this._listener.add(editor.onDidChangeCursorSelection(e => {
                    if (!range || !range_1.Range.containsRange(range, e.selection)) {
                        this.cancel();
                    }
                }));
            }
            if (flags & 8 /* CodeEditorStateFlag.Scroll */) {
                this._listener.add(editor.onDidScrollChange(_ => this.cancel()));
            }
            if (flags & 1 /* CodeEditorStateFlag.Value */) {
                this._listener.add(editor.onDidChangeModel(_ => this.cancel()));
                this._listener.add(editor.onDidChangeModelContent(_ => this.cancel()));
            }
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    exports.EditorStateCancellationTokenSource = EditorStateCancellationTokenSource;
    /**
     * A cancellation token source that cancels when the provided model changes
     */
    class TextModelCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        constructor(model, parent) {
            super(parent);
            this._listener = model.onDidChangeContent(() => this.cancel());
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    exports.TextModelCancellationTokenSource = TextModelCancellationTokenSource;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU3RhdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2VkaXRvclN0YXRlL2Jyb3dzZXIvZWRpdG9yU3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBV2hHLElBQWtCLG1CQUtqQjtJQUxELFdBQWtCLG1CQUFtQjtRQUNwQywrREFBUyxDQUFBO1FBQ1QsdUVBQWEsQ0FBQTtRQUNiLHFFQUFZLENBQUE7UUFDWixpRUFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUxpQixtQkFBbUIsbUNBQW5CLG1CQUFtQixRQUtwQztJQUVELE1BQWEsV0FBVztRQVV2QixZQUFZLE1BQW1CLEVBQUUsS0FBYTtZQUM3QyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUVuQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssb0NBQTRCLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzVHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLHVDQUErQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RD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