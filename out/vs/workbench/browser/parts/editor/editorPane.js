/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/composite", "vs/workbench/common/editor", "vs/base/common/map", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/types", "vs/workbench/browser/parts/editor/editor", "vs/base/common/resources", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/browser/dom"], function (require, exports, composite_1, editor_1, map_1, uri_1, event_1, types_1, editor_2, resources_1, extpath_1, lifecycle_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorMemento = exports.EditorPane = void 0;
    /**
     * The base class of editors in the workbench. Editors register themselves for specific editor inputs.
     * Editors are layed out in the editor part of the workbench in editor groups. Multiple editors can be
     * open at the same time. Each editor has a minimized representation that is good enough to provide some
     * information about the state of the editor data.
     *
     * The workbench will keep an editor alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a editor goes in the order:
     *
     * - `createEditor()`
     * - `setEditorVisible()`
     * - `layout()`
     * - `setInput()`
     * - `focus()`
     * - `dispose()`: when the editor group the editor is in closes
     *
     * During use of the workbench, a editor will often receive a `clearInput()`, `setEditorVisible()`, `layout()` and
     * `focus()` calls, but only one `create()` and `dispose()` call.
     *
     * This class is only intended to be subclassed and not instantiated.
     */
    class EditorPane extends composite_1.Composite {
        //#endregion
        static { this.EDITOR_MEMENTOS = new Map(); }
        get minimumWidth() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get maximumWidth() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get minimumHeight() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumHeight() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get input() { return this._input; }
        get options() { return this._options; }
        get window() { return (0, dom_1.getWindowById)(this.group.windowId, true).window; }
        /**
         * Should be overridden by editors that have their own ScopedContextKeyService
         */
        get scopedContextKeyService() { return undefined; }
        constructor(id, group, telemetryService, themeService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this.group = group;
            //#region Events
            this.onDidChangeSizeConstraints = event_1.Event.None;
            this._onDidChangeControl = this._register(new event_1.Emitter());
            this.onDidChangeControl = this._onDidChangeControl.event;
        }
        create(parent) {
            super.create(parent);
            // Create Editor
            this.createEditor(parent);
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given input with the options to the editor. The input is guaranteed
         * to be different from the previous input that was set using the `input.matches()`
         * method.
         *
         * The provided context gives more information around how the editor was opened.
         *
         * The provided cancellation token should be used to test if the operation
         * was cancelled.
         */
        async setInput(input, options, context, token) {
            this._input = input;
            this._options = options;
        }
        /**
         * Called to indicate to the editor that the input should be cleared and
         * resources associated with the input should be freed.
         *
         * This method can be called based on different contexts, e.g. when opening
         * a different input or different editor control or when closing all editors
         * in a group.
         *
         * To monitor the lifecycle of editor inputs, you should not rely on this
         * method, rather refer to the listeners on `IEditorGroup` via `IEditorGroupsService`.
         */
        clearInput() {
            this._input = undefined;
            this._options = undefined;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given options to the editor. Clients should apply the options
         * to the current input.
         */
        setOptions(options) {
            this._options = options;
        }
        setVisible(visible) {
            super.setVisible(visible);
            // Propagate to Editor
            this.setEditorVisible(visible);
        }
        /**
         * Indicates that the editor control got visible or hidden.
         *
         * @param visible the state of visibility of this editor
         */
        setEditorVisible(visible) {
            // Subclasses can implement
        }
        setBoundarySashes(_sashes) {
            // Subclasses can implement
        }
        getEditorMemento(editorGroupService, configurationService, key, limit = 10) {
            const mementoKey = `${this.getId()}${key}`;
            let editorMemento = EditorPane.EDITOR_MEMENTOS.get(mementoKey);
            if (!editorMemento) {
                editorMemento = this._register(new EditorMemento(this.getId(), key, this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */), limit, editorGroupService, configurationService));
                EditorPane.EDITOR_MEMENTOS.set(mementoKey, editorMemento);
            }
            return editorMemento;
        }
        getViewState() {
            // Subclasses to override
            return undefined;
        }
        saveState() {
            // Save all editor memento for this editor type
            for (const [, editorMemento] of EditorPane.EDITOR_MEMENTOS) {
                if (editorMemento.id === this.getId()) {
                    editorMemento.saveState();
                }
            }
            super.saveState();
        }
        dispose() {
            this._input = undefined;
            this._options = undefined;
            super.dispose();
        }
    }
    exports.EditorPane = EditorPane;
    class EditorMemento extends lifecycle_1.Disposable {
        static { this.SHARED_EDITOR_STATE = -1; } // pick a number < 0 to be outside group id range
        constructor(id, key, memento, limit, editorGroupService, configurationService) {
            super();
            this.id = id;
            this.key = key;
            this.memento = memento;
            this.limit = limit;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.cleanedUp = false;
            this.shareEditorState = false;
            this.updateConfiguration(undefined);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.updateConfiguration(e)));
        }
        updateConfiguration(e) {
            if (!e || e.affectsConfiguration(undefined, 'workbench.editor.sharedViewState')) {
                this.shareEditorState = this.configurationService.getValue(undefined, 'workbench.editor.sharedViewState') === true;
            }
        }
        saveEditorState(group, resourceOrEditor, state) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to save any state for a resource
            }
            const cache = this.doLoad();
            // Ensure mementos for resource map
            let mementosForResource = cache.get(resource.toString());
            if (!mementosForResource) {
                mementosForResource = Object.create(null);
                cache.set(resource.toString(), mementosForResource);
            }
            // Store state for group
            mementosForResource[group.id] = state;
            // Store state as most recent one based on settings
            if (this.shareEditorState) {
                mementosForResource[EditorMemento.SHARED_EDITOR_STATE] = state;
            }
            // Automatically clear when editor input gets disposed if any
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                this.clearEditorStateOnDispose(resource, resourceOrEditor);
            }
        }
        loadEditorState(group, resourceOrEditor) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to load any state for a resource
            }
            const cache = this.doLoad();
            const mementosForResource = cache.get(resource.toString());
            if (mementosForResource) {
                const mementoForResourceAndGroup = mementosForResource[group.id];
                // Return state for group if present
                if (mementoForResourceAndGroup) {
                    return mementoForResourceAndGroup;
                }
                // Return most recent state based on settings otherwise
                if (this.shareEditorState) {
                    return mementosForResource[EditorMemento.SHARED_EDITOR_STATE];
                }
            }
            return undefined;
        }
        clearEditorState(resourceOrEditor, group) {
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                this.editorDisposables?.delete(resourceOrEditor);
            }
            const resource = this.doGetResource(resourceOrEditor);
            if (resource) {
                const cache = this.doLoad();
                // Clear state for group
                if (group) {
                    const mementosForResource = cache.get(resource.toString());
                    if (mementosForResource) {
                        delete mementosForResource[group.id];
                        if ((0, types_1.isEmptyObject)(mementosForResource)) {
                            cache.delete(resource.toString());
                        }
                    }
                }
                // Clear state across all groups for resource
                else {
                    cache.delete(resource.toString());
                }
            }
        }
        clearEditorStateOnDispose(resource, editor) {
            if (!this.editorDisposables) {
                this.editorDisposables = new Map();
            }
            if (!this.editorDisposables.has(editor)) {
                this.editorDisposables.set(editor, event_1.Event.once(editor.onWillDispose)(() => {
                    this.clearEditorState(resource);
                    this.editorDisposables?.delete(editor);
                }));
            }
        }
        moveEditorState(source, target, comparer) {
            const cache = this.doLoad();
            // We need a copy of the keys to not iterate over
            // newly inserted elements.
            const cacheKeys = [...cache.keys()];
            for (const cacheKey of cacheKeys) {
                const resource = uri_1.URI.parse(cacheKey);
                if (!comparer.isEqualOrParent(resource, source)) {
                    continue; // not matching our resource
                }
                // Determine new resulting target resource
                let targetResource;
                if ((0, resources_1.isEqual)(source, resource)) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = (0, extpath_1.indexOfPath)(resource.path, source.path);
                    targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Don't modify LRU state
                const value = cache.get(cacheKey, 0 /* Touch.None */);
                if (value) {
                    cache.delete(cacheKey);
                    cache.set(targetResource.toString(), value);
                }
            }
        }
        doGetResource(resourceOrEditor) {
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                return resourceOrEditor.resource;
            }
            return resourceOrEditor;
        }
        doLoad() {
            if (!this.cache) {
                this.cache = new map_1.LRUCache(this.limit);
                // Restore from serialized map state
                const rawEditorMemento = this.memento[this.key];
                if (Array.isArray(rawEditorMemento)) {
                    this.cache.fromJSON(rawEditorMemento);
                }
            }
            return this.cache;
        }
        saveState() {
            const cache = this.doLoad();
            // Cleanup once during session
            if (!this.cleanedUp) {
                this.cleanUp();
                this.cleanedUp = true;
            }
            this.memento[this.key] = cache.toJSON();
        }
        cleanUp() {
            const cache = this.doLoad();
            // Remove groups from states that no longer exist. Since we modify the
            // cache and its is a LRU cache make a copy to ensure iteration succeeds
            const entries = [...cache.entries()];
            for (const [resource, mapGroupToMementos] of entries) {
                for (const group of Object.keys(mapGroupToMementos)) {
                    const groupId = Number(group);
                    if (groupId === EditorMemento.SHARED_EDITOR_STATE && this.shareEditorState) {
                        continue; // skip over shared entries if sharing is enabled
                    }
                    if (!this.editorGroupService.getGroup(groupId)) {
                        delete mapGroupToMementos[groupId];
                        if ((0, types_1.isEmptyObject)(mapGroupToMementos)) {
                            cache.delete(resource);
                        }
                    }
                }
            }
        }
    }
    exports.EditorMemento = EditorMemento;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yUGFuZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvZWRpdG9yL2VkaXRvclBhbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBeUJoRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FvQkc7SUFDSCxNQUFzQixVQUFXLFNBQVEscUJBQVM7UUFTakQsWUFBWTtpQkFFWSxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUE4QixBQUF4QyxDQUF5QztRQUVoRixJQUFJLFlBQVksS0FBSyxPQUFPLHNDQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxZQUFZLEtBQUssT0FBTyxzQ0FBNkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQUksYUFBYSxLQUFLLE9BQU8sc0NBQTZCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNwRSxJQUFJLGFBQWEsS0FBSyxPQUFPLHNDQUE2QixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFHcEUsSUFBSSxLQUFLLEtBQThCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFHNUQsSUFBSSxPQUFPLEtBQWlDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFbkUsSUFBSSxNQUFNLEtBQUssT0FBTyxJQUFBLG1CQUFhLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUV4RTs7V0FFRztRQUNILElBQUksdUJBQXVCLEtBQXFDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVuRixZQUNDLEVBQVUsRUFDRCxLQUFtQixFQUM1QixnQkFBbUMsRUFDbkMsWUFBMkIsRUFDM0IsY0FB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