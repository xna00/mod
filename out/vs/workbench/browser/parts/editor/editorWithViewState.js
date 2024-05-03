/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle"], function (require, exports, event_1, editor_1, editorPane_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorWithViewState = void 0;
    /**
     * Base class of editors that want to store and restore view state.
     */
    let AbstractEditorWithViewState = class AbstractEditorWithViewState extends editorPane_1.EditorPane {
        constructor(id, group, viewStateStorageKey, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService) {
            super(id, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.groupListener = this._register(new lifecycle_1.MutableDisposable());
            this.viewState = this.getEditorMemento(editorGroupService, textResourceConfigurationService, viewStateStorageKey, 100);
        }
        setEditorVisible(visible) {
            // Listen to close events to trigger `onWillCloseEditorInGroup`
            this.groupListener.value = this.group.onWillCloseEditor(e => this.onWillCloseEditor(e));
            super.setEditorVisible(visible);
        }
        onWillCloseEditor(e) {
            const editor = e.editor;
            if (editor === this.input) {
                // React to editors closing to preserve or clear view state. This needs to happen
                // in the `onWillCloseEditor` because at that time the editor has not yet
                // been disposed and we can safely persist the view state.
                this.updateEditorViewState(editor);
            }
        }
        clearInput() {
            // Preserve current input view state before clearing
            this.updateEditorViewState(this.input);
            super.clearInput();
        }
        saveState() {
            // Preserve current input view state before shutting down
            this.updateEditorViewState(this.input);
            super.saveState();
        }
        updateEditorViewState(input) {
            if (!input || !this.tracksEditorViewState(input)) {
                return; // ensure we have an input to handle view state for
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // we need a resource
            }
            // If we are not tracking disposed editor view state
            // make sure to clear the view state once the editor
            // is disposed.
            if (!this.tracksDisposedEditorViewState()) {
                if (!this.editorViewStateDisposables) {
                    this.editorViewStateDisposables = new Map();
                }
                if (!this.editorViewStateDisposables.has(input)) {
                    this.editorViewStateDisposables.set(input, event_1.Event.once(input.onWillDispose)(() => {
                        this.clearEditorViewState(resource, this.group);
                        this.editorViewStateDisposables?.delete(input);
                    }));
                }
            }
            // Clear the editor view state if:
            // - the editor view state should not be tracked for disposed editors
            // - the user configured to not restore view state unless the editor is still opened in the group
            if ((input.isDisposed() && !this.tracksDisposedEditorViewState()) ||
                (!this.shouldRestoreEditorViewState(input) && !this.group.contains(input))) {
                this.clearEditorViewState(resource, this.group);
            }
            // Otherwise we save the view state
            else if (!input.isDisposed()) {
                this.saveEditorViewState(resource);
            }
        }
        shouldRestoreEditorViewState(input, context) {
            // new editor: check with workbench.editor.restoreViewState setting
            if (context?.newInGroup) {
                return this.textResourceConfigurationService.getValue(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }), 'workbench.editor.restoreViewState') === false ? false : true /* restore by default */;
            }
            // existing editor: always restore viewstate
            return true;
        }
        getViewState() {
            const input = this.input;
            if (!input || !this.tracksEditorViewState(input)) {
                return; // need valid input for view state
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.computeEditorViewState(resource);
        }
        saveEditorViewState(resource) {
            const editorViewState = this.computeEditorViewState(resource);
            if (!editorViewState) {
                return;
            }
            this.viewState.saveEditorState(this.group, resource, editorViewState);
        }
        loadEditorViewState(input, context) {
            if (!input) {
                return undefined; // we need valid input
            }
            if (!this.tracksEditorViewState(input)) {
                return undefined; // not tracking for input
            }
            if (!this.shouldRestoreEditorViewState(input, context)) {
                return undefined; // not enabled for input
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.viewState.loadEditorState(this.group, resource);
        }
        moveEditorViewState(source, target, comparer) {
            return this.viewState.moveEditorState(source, target, comparer);
        }
        clearEditorViewState(resource, group) {
            this.viewState.clearEditorState(resource, group);
        }
        dispose() {
            super.dispose();
            if (this.editorViewStateDisposables) {
                for (const [, disposables] of this.editorViewStateDisposables) {
                    disposables.dispose();
                }
                this.editorViewStateDisposables = undefined;
            }
        }
        /**
         * Whether view state should be tracked even when the editor is
         * disposed.
         *
         * Subclasses should override this if the input can be restored
         * from the resource at a later point, e.g. if backed by files.
         */
        tracksDisposedEditorViewState() {
            return false;
        }
    };
    exports.AbstractEditorWithViewState = AbstractEditorWithViewState;
    exports.AbstractEditorWithViewState = AbstractEditorWithViewState = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, themeService_1.IThemeService),
        __param(8, editorService_1.IEditorService),
        __param(9, editorGroupsService_1.IEditorGroupsService)
    ], AbstractEditorWithViewState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yV2l0aFZpZXdTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvcldpdGhWaWV3U3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRzs7T0FFRztJQUNJLElBQWUsMkJBQTJCLEdBQTFDLE1BQWUsMkJBQThDLFNBQVEsdUJBQVU7UUFRckYsWUFDQyxFQUFVLEVBQ1YsS0FBbUIsRUFDbkIsbUJBQTJCLEVBQ1IsZ0JBQW1DLEVBQy9CLG9CQUE4RCxFQUNwRSxjQUErQixFQUNiLGdDQUFzRixFQUMxRyxZQUEyQixFQUMxQixhQUFnRCxFQUMxQyxrQkFBMkQ7WUFFakYsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBUHZCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFL0IscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFtQztZQUV0RixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQWRqRSxrQkFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBRSxDQUFDLENBQUM7WUFrQnhFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFJLGtCQUFrQixFQUFFLGdDQUFnQyxFQUFFLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzNILENBQUM7UUFFa0IsZ0JBQWdCLENBQUMsT0FBZ0I7WUFFbkQsK0RBQStEO1lBQy9ELElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMs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