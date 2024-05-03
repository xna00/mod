/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnstickyEditorGroupModel = exports.StickyEditorGroupModel = void 0;
    class FilteredEditorGroupModel extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._onDidModelChange = this._register(new event_1.Emitter());
            this.onDidModelChange = this._onDidModelChange.event;
            this._register(this.model.onDidModelChange(e => {
                const candidateOrIndex = e.editorIndex ?? e.editor;
                if (candidateOrIndex !== undefined) {
                    if (!this.filter(candidateOrIndex)) {
                        return; // exclude events for excluded items
                    }
                }
                this._onDidModelChange.fire(e);
            }));
        }
        get id() { return this.model.id; }
        get isLocked() { return this.model.isLocked; }
        get stickyCount() { return this.model.stickyCount; }
        get activeEditor() { return this.model.activeEditor && this.filter(this.model.activeEditor) ? this.model.activeEditor : null; }
        get previewEditor() { return this.model.previewEditor && this.filter(this.model.previewEditor) ? this.model.previewEditor : null; }
        isPinned(editorOrIndex) { return this.model.isPinned(editorOrIndex); }
        isTransient(editorOrIndex) { return this.model.isTransient(editorOrIndex); }
        isSticky(editorOrIndex) { return this.model.isSticky(editorOrIndex); }
        isActive(editor) { return this.model.isActive(editor); }
        isFirst(editor) {
            return this.model.isFirst(editor, this.getEditors(1 /* EditorsOrder.SEQUENTIAL */));
        }
        isLast(editor) {
            return this.model.isLast(editor, this.getEditors(1 /* EditorsOrder.SEQUENTIAL */));
        }
        getEditors(order, options) {
            const editors = this.model.getEditors(order, options);
            return editors.filter(e => this.filter(e));
        }
        findEditor(candidate, options) {
            const result = this.model.findEditor(candidate, options);
            if (!result) {
                return undefined;
            }
            return this.filter(result[1]) ? result : undefined;
        }
    }
    class StickyEditorGroupModel extends FilteredEditorGroupModel {
        get count() { return this.model.stickyCount; }
        getEditors(order, options) {
            if (options?.excludeSticky) {
                return [];
            }
            if (order === 1 /* EditorsOrder.SEQUENTIAL */) {
                return this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */).slice(0, this.model.stickyCount);
            }
            return super.getEditors(order, options);
        }
        isSticky(editorOrIndex) {
            return true;
        }
        getEditorByIndex(index) {
            return index < this.count ? this.model.getEditorByIndex(index) : undefined;
        }
        indexOf(editor, editors, options) {
            const editorIndex = this.model.indexOf(editor, editors, options);
            if (editorIndex < 0 || editorIndex >= this.model.stickyCount) {
                return -1;
            }
            return editorIndex;
        }
        contains(candidate, options) {
            const editorIndex = this.model.indexOf(candidate, undefined, options);
            return editorIndex >= 0 && editorIndex < this.model.stickyCount;
        }
        filter(candidateOrIndex) {
            return this.model.isSticky(candidateOrIndex);
        }
    }
    exports.StickyEditorGroupModel = StickyEditorGroupModel;
    class UnstickyEditorGroupModel extends FilteredEditorGroupModel {
        get count() { return this.model.count - this.model.stickyCount; }
        get stickyCount() { return 0; }
        isSticky(editorOrIndex) {
            return false;
        }
        getEditors(order, options) {
            if (order === 1 /* EditorsOrder.SEQUENTIAL */) {
                return this.model.getEditors(1 /* EditorsOrder.SEQUENTIAL */).slice(this.model.stickyCount);
            }
            return super.getEditors(order, options);
        }
        getEditorByIndex(index) {
            return index >= 0 ? this.model.getEditorByIndex(index + this.model.stickyCount) : undefined;
        }
        indexOf(editor, editors, options) {
            const editorIndex = this.model.indexOf(editor, editors, options);
            if (editorIndex < this.model.stickyCount || editorIndex >= this.model.count) {
                return -1;
            }
            return editorIndex - this.model.stickyCount;
        }
        contains(candidate, options) {
            const editorIndex = this.model.indexOf(candidate, undefined, options);
            return editorIndex >= this.model.stickyCount && editorIndex < this.model.count;
        }
        filter(candidateOrIndex) {
            return !this.model.isSticky(candidateOrIndex);
        }
    }
    exports.UnstickyEditorGroupModel = UnstickyEditorGroupModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsdGVyZWRFZGl0b3JHcm91cE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29tbW9uL2VkaXRvci9maWx0ZXJlZEVkaXRvckdyb3VwTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWUsd0JBQXlCLFNBQVEsc0JBQVU7UUFLekQsWUFDb0IsS0FBZ0M7WUFFbkQsS0FBSyxFQUFFLENBQUM7WUFGVyxVQUFLLEdBQUwsS0FBSyxDQUEyQjtZQUpuQyxzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwQixDQUFDLENBQUM7WUFDbEYscUJBQWdCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQU94RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzlDLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUNuRCxJQUFJLGdCQUFnQixLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7d0JBQ3BDLE9BQU8sQ0FBQyxvQ0FBb0M7b0JBQzdDLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxFQUFFLEtBQXNCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ25ELElBQUksUUFBUSxLQUFjLE9B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