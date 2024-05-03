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
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/arrays"], function (require, exports, event_1, editor_1, editorInput_1, sideBySideEditorInput_1, instantiation_1, configuration_1, lifecycle_1, platform_1, arrays_1) {
    "use strict";
    var EditorGroupModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorGroupModel = void 0;
    exports.isSerializedEditorGroupModel = isSerializedEditorGroupModel;
    exports.isGroupEditorChangeEvent = isGroupEditorChangeEvent;
    exports.isGroupEditorOpenEvent = isGroupEditorOpenEvent;
    exports.isGroupEditorMoveEvent = isGroupEditorMoveEvent;
    exports.isGroupEditorCloseEvent = isGroupEditorCloseEvent;
    const EditorOpenPositioning = {
        LEFT: 'left',
        RIGHT: 'right',
        FIRST: 'first',
        LAST: 'last'
    };
    function isSerializedEditorGroupModel(group) {
        const candidate = group;
        return !!(candidate && typeof candidate === 'object' && Array.isArray(candidate.editors) && Array.isArray(candidate.mru));
    }
    function isGroupEditorChangeEvent(e) {
        const candidate = e;
        return candidate.editor && candidate.editorIndex !== undefined;
    }
    function isGroupEditorOpenEvent(e) {
        const candidate = e;
        return candidate.kind === 4 /* GroupModelChangeKind.EDITOR_OPEN */ && candidate.editorIndex !== undefined;
    }
    function isGroupEditorMoveEvent(e) {
        const candidate = e;
        return candidate.kind === 6 /* GroupModelChangeKind.EDITOR_MOVE */ && candidate.editorIndex !== undefined && candidate.oldEditorIndex !== undefined;
    }
    function isGroupEditorCloseEvent(e) {
        const candidate = e;
        return candidate.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && candidate.editorIndex !== undefined && candidate.context !== undefined && candidate.sticky !== undefined;
    }
    let EditorGroupModel = class EditorGroupModel extends lifecycle_1.Disposable {
        static { EditorGroupModel_1 = this; }
        static { this.IDS = 0; }
        get id() { return this._id; }
        constructor(labelOrSerializedGroup, instantiationService, configurationService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            //#region events
            this._onDidModelChange = this._register(new event_1.Emitter());
            this.onDidModelChange = this._onDidModelChange.event;
            this.editors = [];
            this.mru = [];
            this.editorListeners = new Set();
            this.locked = false;
            this.preview = null; // editor in preview state
            this.active = null; // editor in active state
            this.sticky = -1; // index of first editor in sticky state
            this.transient = new Set(); // editors in transient state
            if (isSerializedEditorGroupModel(labelOrSerializedGroup)) {
                this._id = this.deserialize(labelOrSerializedGroup);
            }
            else {
                this._id = EditorGroupModel_1.IDS++;
            }
            this.onConfigurationUpdated();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(e) {
            if (e && !e.affectsConfiguration('workbench.editor.openPositioning') && !e.affectsConfiguration('workbench.editor.focusRecentEditorAfterClose')) {
                return;
            }
            this.editorOpenPositioning = this.configurationService.getValue('workbench.editor.openPositioning');
            this.focusRecentEditorAfterClose = this.configurationService.getValue('workbench.editor.focusRecentEditorAfterClose');
        }
        get count() {
            return this.editors.length;
        }
        get stickyCount() {
            return this.sticky + 1;
        }
        getEditors(order, options) {
            const editors = order === 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */ ? this.mru.slice(0) : this.editors.slice(0);
            if (options?.excludeSticky) {
                // MRU: need to check for index on each
                if (order === 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */) {
                    return editors.filter(editor => !this.isSticky(editor));
                }
                // Sequential: simply start after sticky index
                return editors.slice(this.sticky + 1);
            }
            return editors;
        }
        getEditorByIndex(index) {
            return this.editors[index];
        }
        get activeEditor() {
            return this.active;
        }
        isActive(editor) {
            return this.matches(this.active, editor);
        }
        get previewEditor() {
            return this.preview;
        }
        openEditor(candidate, options) {
            const makeSticky = options?.sticky || (typeof options?.index === 'number' && this.isSticky(options.index));
            const makePinned = options?.pinned || options?.sticky;
            const makeTransient = !!options?.transient;
            const makeActive = options?.active || !this.activeEditor || (!makePinned && this.matches(this.preview, this.activeEditor));
            const existingEditorAndIndex = this.findEditor(candidate, options);
            // New editor
            if (!existingEditorAndIndex) {
                const newEditor = candidate;
                const indexOfActive = this.indexOf(this.active);
                // Insert into specific position
                let targetIndex;
                if (options && typeof options.index === 'number') {
                    targetIndex = options.index;
                }
                // Insert to the BEGINNING
                else if (this.editorOpenPositioning === EditorOpenPositioning.FIRST) {
                    targetIndex = 0;
                    // Always make sure targetIndex is after sticky editors
                    // unless we are explicitly told to make the editor sticky
                    if (!makeSticky && this.isSticky(targetIndex)) {
                        targetIndex = this.sticky + 1;
                    }
                }
                // Insert to the END
                else if (this.editorOpenPositioning === EditorOpenPositioning.LAST) {
                    targetIndex = this.editors.length;
                }
                // Insert to LEFT or RIGHT of active editor
                else {
                    // Insert to the LEFT of active editor
                    if (this.editorOpenPositioning === EditorOpenPositioning.LEFT) {
                        if (indexOfActive === 0 || !this.editors.length) {
                            targetIndex = 0; // to the left becoming first editor in list
                        }
                        else {
                            targetIndex = indexOfActive; // to the left of active editor
                        }
                    }
                    // Insert to the RIGHT of active editor
                    else {
                        targetIndex = indexOfActive + 1;
                    }
                    // Always make sure targetIndex is after sticky editors
                    // unless we are explicitly told to make the editor sticky
                    if (!makeSticky && this.isSticky(targetIndex)) {
                        targetIndex = this.sticky + 1;
                    }
                }
                // If the editor becomes sticky, increment the sticky index and adjust
                // the targetIndex to be at the end of sticky editors unless already.
                if (makeSticky) {
                    this.sticky++;
                    if (!this.isSticky(targetIndex)) {
                        targetIndex = this.sticky;
                    }
                }
                // Insert into our list of editors if pinned or we have no preview editor
                if (makePinned || !this.preview) {
                    this.splice(targetIndex, false, newEditor);
                }
                // Handle transient
                if (makeTransient) {
                    this.doSetTransient(newEditor, targetIndex, true);
                }
                // Handle preview
                if (!makePinned) {
                    // Replace existing preview with this editor if we have a preview
                    if (this.preview) {
                        const indexOfPreview = this.indexOf(this.preview);
                        if (targetIndex > indexOfPreview) {
                            targetIndex--; // accomodate for the fact that the preview editor closes
                        }
                        this.replaceEditor(this.preview, newEditor, targetIndex, !makeActive);
                    }
                    this.preview = newEditor;
                }
                // Listeners
                this.registerEditorListeners(newEditor);
                // Event
                const event = {
                    kind: 4 /* GroupModelChangeKind.EDITOR_OPEN */,
                    editor: newEditor,
                    editorIndex: targetIndex
                };
                this._onDidModelChange.fire(event);
                // Handle active
                if (makeActive) {
                    this.doSetActive(newEditor, targetIndex);
                }
                return {
                    editor: newEditor,
                    isNew: true
                };
            }
            // Existing editor
            else {
                const [existingEditor, existingEditorIndex] = existingEditorAndIndex;
                // Update transient (existing editors do not turn transient if they were not before)
                this.doSetTransient(existingEditor, existingEditorIndex, makeTransient === false ? false : this.isTransient(existingEditor));
                // Pin it
                if (makePinned) {
                    this.doPin(existingEditor, existingEditorIndex);
                }
                // Activate it
                if (makeActive) {
                    this.doSetActive(existingEditor, existingEditorIndex);
                }
                // Respect index
                if (options && typeof options.index === 'number') {
                    this.moveEditor(existingEditor, options.index);
                }
                // Stick it (intentionally after the moveEditor call in case
                // the editor was already moved into the sticky range)
                if (makeSticky) {
                    this.doStick(existingEditor, this.indexOf(existingEditor));
                }
                return {
                    editor: existingEditor,
                    isNew: false
                };
            }
        }
        registerEditorListeners(editor) {
            const listeners = new lifecycle_1.DisposableStore();
            this.editorListeners.add(listeners);
            // Re-emit disposal of editor input as our own event
            listeners.add(event_1.Event.once(editor.onWillDispose)(() => {
                const editorIndex = this.editors.indexOf(editor);
                if (editorIndex >= 0) {
                    const event = {
                        kind: 14 /* GroupModelChangeKind.EDITOR_WILL_DISPOSE */,
                        editor,
                        editorIndex
                    };
                    this._onDidModelChange.fire(event);
                }
            }));
            // Re-Emit dirty state changes
            listeners.add(editor.onDidChangeDirty(() => {
                const event = {
                    kind: 13 /* GroupModelChangeKind.EDITOR_DIRTY */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Re-Emit label changes
            listeners.add(editor.onDidChangeLabel(() => {
                const event = {
                    kind: 8 /* GroupModelChangeKind.EDITOR_LABEL */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Re-Emit capability changes
            listeners.add(editor.onDidChangeCapabilities(() => {
                const event = {
                    kind: 9 /* GroupModelChangeKind.EDITOR_CAPABILITIES */,
                    editor,
                    editorIndex: this.editors.indexOf(editor)
                };
                this._onDidModelChange.fire(event);
            }));
            // Clean up dispose listeners once the editor gets closed
            listeners.add(this.onDidModelChange(event => {
                if (event.kind === 5 /* GroupModelChangeKind.EDITOR_CLOSE */ && event.editor?.matches(editor)) {
                    (0, lifecycle_1.dispose)(listeners);
                    this.editorListeners.delete(listeners);
                }
            }));
        }
        replaceEditor(toReplace, replaceWith, replaceIndex, openNext = true) {
            const closeResult = this.doCloseEditor(toReplace, editor_1.EditorCloseContext.REPLACE, openNext); // optimization to prevent multiple setActive() in one call
            // We want to first add the new editor into our model before emitting the close event because
            // firing the close event can trigger a dispose on the same editor that is now being added.
            // This can lead into opening a disposed editor which is not what we want.
            this.splice(replaceIndex, false, replaceWith);
            if (closeResult) {
                const event = {
                    kind: 5 /* GroupModelChangeKind.EDITOR_CLOSE */,
                    ...closeResult
                };
                this._onDidModelChange.fire(event);
            }
        }
        closeEditor(candidate, context = editor_1.EditorCloseContext.UNKNOWN, openNext = true) {
            const closeResult = this.doCloseEditor(candidate, context, openNext);
            if (closeResult) {
                const event = {
                    kind: 5 /* GroupModelChangeKind.EDITOR_CLOSE */,
                    ...closeResult
                };
                this._onDidModelChange.fire(event);
                return closeResult;
            }
            return undefined;
        }
        doCloseEditor(candidate, context, openNext) {
            const index = this.indexOf(candidate);
            if (index === -1) {
                return undefined; // not found
            }
            const editor = this.editors[index];
            const sticky = this.isSticky(index);
            // Active Editor closed
            if (openNext && this.matches(this.active, editor)) {
                // More than one editor
                if (this.mru.length > 1) {
                    let newActive;
                    if (this.focusRecentEditorAfterClose) {
                        newActive = this.mru[1]; // active editor is always first in MRU, so pick second editor after as new active
                    }
                    else {
                        if (index === this.editors.length - 1) {
                            newActive = this.editors[index - 1]; // last editor is closed, pick previous as new active
                        }
                        else {
                            newActive = this.editors[index + 1]; // pick next editor as new active
                        }
                    }
                    this.doSetActive(newActive, this.editors.indexOf(newActive));
                }
                // One Editor
                else {
                    this.active = null;
                }
            }
            // Preview Editor closed
            if (this.matches(this.preview, editor)) {
                this.preview = null;
            }
            // Remove from transient
            this.transient.delete(editor);
            // Remove from arrays
            this.splice(index, true);
            // Event
            return { editor, sticky, editorIndex: index, context };
        }
        moveEditor(candidate, toIndex) {
            // Ensure toIndex is in bounds of our model
            if (toIndex >= this.editors.length) {
                toIndex = this.editors.length - 1;
            }
            else if (toIndex < 0) {
                toIndex = 0;
            }
            const index = this.indexOf(candidate);
            if (index < 0 || toIndex === index) {
                return;
            }
            const editor = this.editors[index];
            const sticky = this.sticky;
            // Adjust sticky index: editor moved out of sticky state into unsticky state
            if (this.isSticky(index) && toIndex > this.sticky) {
                this.sticky--;
            }
            // ...or editor moved into sticky state from unsticky state
            else if (!this.isSticky(index) && toIndex <= this.sticky) {
                this.sticky++;
            }
            // Move
            this.editors.splice(index, 1);
            this.editors.splice(toIndex, 0, editor);
            // Move Event
            const event = {
                kind: 6 /* GroupModelChangeKind.EDITOR_MOVE */,
                editor,
                oldEditorIndex: index,
                editorIndex: toIndex
            };
            this._onDidModelChange.fire(event);
            // Sticky Event (if sticky changed as part of the move)
            if (sticky !== this.sticky) {
                const event = {
                    kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                    editor,
                    editorIndex: toIndex
                };
                this._onDidModelChange.fire(event);
            }
            return editor;
        }
        setActive(candidate) {
            let result = undefined;
            if (!candidate) {
                this.setGroupActive();
            }
            else {
                result = this.setEditorActive(candidate);
            }
            return result;
        }
        setGroupActive() {
            // We do not really keep the `active` state in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 0 /* GroupModelChangeKind.GROUP_ACTIVE */ });
        }
        setEditorActive(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doSetActive(editor, editorIndex);
            return editor;
        }
        doSetActive(editor, editorIndex) {
            if (this.matches(this.active, editor)) {
                return; // already active
            }
            this.active = editor;
            // Bring to front in MRU list
            const mruIndex = this.indexOf(editor, this.mru);
            this.mru.splice(mruIndex, 1);
            this.mru.unshift(editor);
            // Event
            const event = {
                kind: 7 /* GroupModelChangeKind.EDITOR_ACTIVE */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        setIndex(index) {
            // We do not really keep the `index` in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 1 /* GroupModelChangeKind.GROUP_INDEX */ });
        }
        setLabel(label) {
            // We do not really keep the `label` in our model because
            // it has no special meaning to us here. But for consistency
            // we emit a `onDidModelChange` event so that components can
            // react.
            this._onDidModelChange.fire({ kind: 2 /* GroupModelChangeKind.GROUP_LABEL */ });
        }
        pin(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doPin(editor, editorIndex);
            return editor;
        }
        doPin(editor, editorIndex) {
            if (this.isPinned(editor)) {
                return; // can only pin a preview editor
            }
            // Clear Transient
            this.setTransient(editor, false);
            // Convert the preview editor to be a pinned editor
            this.preview = null;
            // Event
            const event = {
                kind: 10 /* GroupModelChangeKind.EDITOR_PIN */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        unpin(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doUnpin(editor, editorIndex);
            return editor;
        }
        doUnpin(editor, editorIndex) {
            if (!this.isPinned(editor)) {
                return; // can only unpin a pinned editor
            }
            // Set new
            const oldPreview = this.preview;
            this.preview = editor;
            // Event
            const event = {
                kind: 10 /* GroupModelChangeKind.EDITOR_PIN */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
            // Close old preview editor if any
            if (oldPreview) {
                this.closeEditor(oldPreview, editor_1.EditorCloseContext.UNPIN);
            }
        }
        isPinned(editorOrIndex) {
            let editor;
            if (typeof editorOrIndex === 'number') {
                editor = this.editors[editorOrIndex];
            }
            else {
                editor = editorOrIndex;
            }
            return !this.matches(this.preview, editor);
        }
        stick(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doStick(editor, editorIndex);
            return editor;
        }
        doStick(editor, editorIndex) {
            if (this.isSticky(editorIndex)) {
                return; // can only stick a non-sticky editor
            }
            // Pin editor
            this.pin(editor);
            // Move editor to be the last sticky editor
            const newEditorIndex = this.sticky + 1;
            this.moveEditor(editor, newEditorIndex);
            // Adjust sticky index
            this.sticky++;
            // Event
            const event = {
                kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                editor,
                editorIndex: newEditorIndex
            };
            this._onDidModelChange.fire(event);
        }
        unstick(candidate) {
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doUnstick(editor, editorIndex);
            return editor;
        }
        doUnstick(editor, editorIndex) {
            if (!this.isSticky(editorIndex)) {
                return; // can only unstick a sticky editor
            }
            // Move editor to be the first non-sticky editor
            const newEditorIndex = this.sticky;
            this.moveEditor(editor, newEditorIndex);
            // Adjust sticky index
            this.sticky--;
            // Event
            const event = {
                kind: 12 /* GroupModelChangeKind.EDITOR_STICKY */,
                editor,
                editorIndex: newEditorIndex
            };
            this._onDidModelChange.fire(event);
        }
        isSticky(candidateOrIndex) {
            if (this.sticky < 0) {
                return false; // no sticky editor
            }
            let index;
            if (typeof candidateOrIndex === 'number') {
                index = candidateOrIndex;
            }
            else {
                index = this.indexOf(candidateOrIndex);
            }
            if (index < 0) {
                return false;
            }
            return index <= this.sticky;
        }
        setTransient(candidate, transient) {
            if (!transient && this.transient.size === 0) {
                return; // no transient editor
            }
            const res = this.findEditor(candidate);
            if (!res) {
                return; // not found
            }
            const [editor, editorIndex] = res;
            this.doSetTransient(editor, editorIndex, transient);
            return editor;
        }
        doSetTransient(editor, editorIndex, transient) {
            if (transient) {
                if (this.transient.has(editor)) {
                    return;
                }
                this.transient.add(editor);
            }
            else {
                if (!this.transient.has(editor)) {
                    return;
                }
                this.transient.delete(editor);
            }
            // Event
            const event = {
                kind: 11 /* GroupModelChangeKind.EDITOR_TRANSIENT */,
                editor,
                editorIndex
            };
            this._onDidModelChange.fire(event);
        }
        isTransient(editorOrIndex) {
            if (this.transient.size === 0) {
                return false; // no transient editor
            }
            let editor;
            if (typeof editorOrIndex === 'number') {
                editor = this.editors[editorOrIndex];
            }
            else {
                editor = this.findEditor(editorOrIndex)?.[0];
            }
            return !!editor && this.transient.has(editor);
        }
        splice(index, del, editor) {
            const editorToDeleteOrReplace = this.editors[index];
            // Perform on sticky index
            if (del && this.isSticky(index)) {
                this.sticky--;
            }
            // Perform on editors array
            if (editor) {
                this.editors.splice(index, del ? 1 : 0, editor);
            }
            else {
                this.editors.splice(index, del ? 1 : 0);
            }
            // Perform on MRU
            {
                // Add
                if (!del && editor) {
                    if (this.mru.length === 0) {
                        // the list of most recent editors is empty
                        // so this editor can only be the most recent
                        this.mru.push(editor);
                    }
                    else {
                        // we have most recent editors. as such we
                        // put this newly opened editor right after
                        // the current most recent one because it cannot
                        // be the most recently active one unless
                        // it becomes active. but it is still more
                        // active then any other editor in the list.
                        this.mru.splice(1, 0, editor);
                    }
                }
                // Remove / Replace
                else {
                    const indexInMRU = this.indexOf(editorToDeleteOrReplace, this.mru);
                    // Remove
                    if (del && !editor) {
                        this.mru.splice(indexInMRU, 1); // remove from MRU
                    }
                    // Replace
                    else if (del && editor) {
                        this.mru.splice(indexInMRU, 1, editor); // replace MRU at location
                    }
                }
            }
        }
        indexOf(candidate, editors = this.editors, options) {
            let index = -1;
            if (!candidate) {
                return index;
            }
            for (let i = 0; i < editors.length; i++) {
                const editor = editors[i];
                if (this.matches(editor, candidate, options)) {
                    // If we are to support side by side matching, it is possible that
                    // a better direct match is found later. As such, we continue finding
                    // a matching editor and prefer that match over the side by side one.
                    if (options?.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && !(candidate instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                        index = i;
                    }
                    else {
                        index = i;
                        break;
                    }
                }
            }
            return index;
        }
        findEditor(candidate, options) {
            const index = this.indexOf(candidate, this.editors, options);
            if (index === -1) {
                return undefined;
            }
            return [this.editors[index], index];
        }
        isFirst(candidate, editors = this.editors) {
            return this.matches(editors[0], candidate);
        }
        isLast(candidate, editors = this.editors) {
            return this.matches(editors[editors.length - 1], candidate);
        }
        contains(candidate, options) {
            return this.indexOf(candidate, this.editors, options) !== -1;
        }
        matches(editor, candidate, options) {
            if (!editor || !candidate) {
                return false;
            }
            if (options?.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput && !(candidate instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                switch (options.supportSideBySide) {
                    case editor_1.SideBySideEditor.ANY:
                        if (this.matches(editor.primary, candidate, options) || this.matches(editor.secondary, candidate, options)) {
                            return true;
                        }
                        break;
                    case editor_1.SideBySideEditor.BOTH:
                        if (this.matches(editor.primary, candidate, options) && this.matches(editor.secondary, candidate, options)) {
                            return true;
                        }
                        break;
                }
            }
            const strictEquals = editor === candidate;
            if (options?.strictEquals) {
                return strictEquals;
            }
            return strictEquals || editor.matches(candidate);
        }
        get isLocked() {
            return this.locked;
        }
        lock(locked) {
            if (this.isLocked !== locked) {
                this.locked = locked;
                this._onDidModelChange.fire({ kind: 3 /* GroupModelChangeKind.GROUP_LOCKED */ });
            }
        }
        clone() {
            const clone = this.instantiationService.createInstance(EditorGroupModel_1, undefined);
            // Copy over group properties
            clone.editors = this.editors.slice(0);
            clone.mru = this.mru.slice(0);
            clone.preview = this.preview;
            clone.active = this.active;
            clone.sticky = this.sticky;
            // Ensure to register listeners for each editor
            for (const editor of clone.editors) {
                clone.registerEditorListeners(editor);
            }
            return clone;
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            // Serialize all editor inputs so that we can store them.
            // Editors that cannot be serialized need to be ignored
            // from mru, active, preview and sticky if any.
            const serializableEditors = [];
            const serializedEditors = [];
            let serializablePreviewIndex;
            let serializableSticky = this.sticky;
            for (let i = 0; i < this.editors.length; i++) {
                const editor = this.editors[i];
                let canSerializeEditor = false;
                const editorSerializer = registry.getEditorSerializer(editor);
                if (editorSerializer) {
                    const value = editorSerializer.canSerialize(editor) ? editorSerializer.serialize(editor) : undefined;
                    // Editor can be serialized
                    if (typeof value === 'string') {
                        canSerializeEditor = true;
                        serializedEditors.push({ id: editor.typeId, value });
                        serializableEditors.push(editor);
                        if (this.preview === editor) {
                            serializablePreviewIndex = serializableEditors.length - 1;
                        }
                    }
                    // Editor cannot be serialized
                    else {
                        canSerializeEditor = false;
                    }
                }
                // Adjust index of sticky editors if the editor cannot be serialized and is pinned
                if (!canSerializeEditor && this.isSticky(i)) {
                    serializableSticky--;
                }
            }
            const serializableMru = this.mru.map(editor => this.indexOf(editor, serializableEditors)).filter(i => i >= 0);
            return {
                id: this.id,
                locked: this.locked ? true : undefined,
                editors: serializedEditors,
                mru: serializableMru,
                preview: serializablePreviewIndex,
                sticky: serializableSticky >= 0 ? serializableSticky : undefined
            };
        }
        deserialize(data) {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            if (typeof data.id === 'number') {
                this._id = data.id;
                EditorGroupModel_1.IDS = Math.max(data.id + 1, EditorGroupModel_1.IDS); // make sure our ID generator is always larger
            }
            else {
                this._id = EditorGroupModel_1.IDS++; // backwards compatibility
            }
            if (data.locked) {
                this.locked = true;
            }
            this.editors = (0, arrays_1.coalesce)(data.editors.map((e, index) => {
                let editor = undefined;
                const editorSerializer = registry.getEditorSerializer(e.id);
                if (editorSerializer) {
                    const deserializedEditor = editorSerializer.deserialize(this.instantiationService, e.value);
                    if (deserializedEditor instanceof editorInput_1.EditorInput) {
                        editor = deserializedEditor;
                        this.registerEditorListeners(editor);
                    }
                }
                if (!editor && typeof data.sticky === 'number' && index <= data.sticky) {
                    data.sticky--; // if editor cannot be deserialized but was sticky, we need to decrease sticky index
                }
                return editor;
            }));
            this.mru = (0, arrays_1.coalesce)(data.mru.map(i => this.editors[i]));
            this.active = this.mru[0];
            if (typeof data.preview === 'number') {
                this.preview = this.editors[data.preview];
            }
            if (typeof data.sticky === 'number') {
                this.sticky = data.sticky;
            }
            return this._id;
        }
        dispose() {
            (0, lifecycle_1.dispose)(Array.from(this.editorListeners));
            this.editorListeners.clear();
            this.transient.clear();
            super.dispose();
        }
    };
    exports.EditorGroupModel = EditorGroupModel;
    exports.EditorGroupModel = EditorGroupModel = EditorGroupModel_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], EditorGroupModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yR3JvdXBNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9lZGl0b3IvZWRpdG9yR3JvdXBNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBK0NoRyxvRUFJQztJQTZDRCw0REFJQztJQU9ELHdEQUlDO0lBY0Qsd0RBSUM7SUFxQkQsMERBSUM7SUE5SUQsTUFBTSxxQkFBcUIsR0FBRztRQUM3QixJQUFJLEVBQUUsTUFBTTtRQUNaLEtBQUssRUFBRSxPQUFPO1FBQ2QsS0FBSyxFQUFFLE9BQU87UUFDZCxJQUFJLEVBQUUsTUFBTTtLQUNaLENBQUM7SUE4QkYsU0FBZ0IsNEJBQTRCLENBQUMsS0FBZTtRQUMzRCxNQUFNLFNBQVMsR0FBRyxLQUFnRCxDQUFDO1FBRW5FLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzNILENBQUM7SUE2Q0QsU0FBZ0Isd0JBQXdCLENBQUMsQ0FBeUI7UUFDakUsTUFBTSxTQUFTLEdBQUcsQ0FBMEIsQ0FBQztRQUU3QyxPQUFPLFNBQVMsQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7SUFDaEUsQ0FBQztJQU9ELFNBQWdCLHNCQUFzQixDQUFDLENBQXlCO1FBQy9ELE1BQU0sU0FBUyxHQUFHLENBQTBCLENBQUM7UUFFN0MsT0FBTyxTQUFTLENBQUMsSUFBSSw2Q0FBcUMsSUFBSSxTQUFTLENBQUMsV0FBVyxLQUFLLFNBQVMsQ0FBQztJQUNuRyxDQUFD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