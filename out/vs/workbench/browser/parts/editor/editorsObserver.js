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
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/objects"], function (require, exports, editor_1, sideBySideEditorInput_1, lifecycle_1, storage_1, platform_1, event_1, editorGroupsService_1, arrays_1, map_1, objects_1) {
    "use strict";
    var EditorsObserver_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorsObserver = void 0;
    /**
     * A observer of opened editors across all editor groups by most recently used.
     * Rules:
     * - the last editor in the list is the one most recently activated
     * - the first editor in the list is the one that was activated the longest time ago
     * - an editor that opens inactive will be placed behind the currently active editor
     *
     * The observer may start to close editors based on the workbench.editor.limit setting.
     */
    let EditorsObserver = class EditorsObserver extends lifecycle_1.Disposable {
        static { EditorsObserver_1 = this; }
        static { this.STORAGE_KEY = 'editors.mru'; }
        get count() {
            return this.mostRecentEditorsMap.size;
        }
        get editors() {
            return [...this.mostRecentEditorsMap.values()];
        }
        hasEditor(editor) {
            const editors = this.editorsPerResourceCounter.get(editor.resource);
            return editors?.has(this.toIdentifier(editor)) ?? false;
        }
        hasEditors(resource) {
            return this.editorsPerResourceCounter.has(resource);
        }
        toIdentifier(arg1, editorId) {
            if (typeof arg1 !== 'string') {
                return this.toIdentifier(arg1.typeId, arg1.editorId);
            }
            if (editorId) {
                return `${arg1}/${editorId}`;
            }
            return arg1;
        }
        constructor(editorGroupsContainer, editorGroupService, storageService) {
            super();
            this.editorGroupService = editorGroupService;
            this.storageService = storageService;
            this.keyMap = new Map();
            this.mostRecentEditorsMap = new map_1.LinkedMap();
            this.editorsPerResourceCounter = new map_1.ResourceMap();
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            this.editorGroupsContainer = editorGroupsContainer ?? editorGroupService;
            this.isScoped = !!editorGroupsContainer;
            this.registerListeners();
            this.loadState();
        }
        registerListeners() {
            this._register(this.editorGroupsContainer.onDidAddGroup(group => this.onGroupAdded(group)));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(e => this.onDidChangeEditorPartOptions(e)));
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
        }
        onGroupAdded(group) {
            // Make sure to add any already existing editor
            // of the new group into our list in LRU order
            const groupEditorsMru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
            for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                this.addMostRecentEditor(group, groupEditorsMru[i], false /* is not active */, true /* is new */);
            }
            // Make sure that active editor is put as first if group is active
            if (this.editorGroupsContainer.activeGroup === group && group.activeEditor) {
                this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* already added before */);
            }
            // Group Listeners
            this.registerGroupListeners(group);
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidModelChange(e => {
                switch (e.kind) {
                    // Group gets active: put active editor as most recent
                    case 0 /* GroupModelChangeKind.GROUP_ACTIVE */: {
                        if (this.editorGroupsContainer.activeGroup === group && group.activeEditor) {
                            this.addMostRecentEditor(group, group.activeEditor, true /* is active */, false /* editor already opened */);
                        }
                        break;
                    }
                    // Editor opens: put it as second most recent
                    //
                    // Also check for maximum allowed number of editors and
                    // start to close oldest ones if needed.
                    case 4 /* GroupModelChangeKind.EDITOR_OPEN */: {
                        if (e.editor) {
                            this.addMostRecentEditor(group, e.editor, false /* is not active */, true /* is new */);
                            this.ensureOpenedEditorsLimit({ groupId: group.id, editor: e.editor }, group.id);
                        }
                        break;
                    }
                }
            }));
            // Editor closes: remove from recently opened
            groupDisposables.add(group.onDidCloseEditor(e => {
                this.removeMostRecentEditor(group, e.editor);
            }));
            // Editor gets active: put active editor as most recent
            // if group is active, otherwise second most recent
            groupDisposables.add(group.onDidActiveEditorChange(e => {
                if (e.editor) {
                    this.addMostRecentEditor(group, e.editor, this.editorGroupsContainer.activeGroup === group, false /* editor already opened */);
                }
            }));
            // Make sure to cleanup on dispose
            event_1.Event.once(group.onWillDispose)(() => (0, lifecycle_1.dispose)(groupDisposables));
        }
        onDidChangeEditorPartOptions(event) {
            if (!(0, objects_1.equals)(event.newPartOptions.limit, event.oldPartOptions.limit)) {
                const activeGroup = this.editorGroupsContainer.activeGroup;
                let exclude = undefined;
                if (activeGroup.activeEditor) {
                    exclude = { editor: activeGroup.activeEditor, groupId: activeGroup.id };
                }
                this.ensureOpenedEditorsLimit(exclude);
            }
        }
        addMostRecentEditor(group, editor, isActive, isNew) {
            const key = this.ensureKey(group, editor);
            const mostRecentEditor = this.mostRecentEditorsMap.first;
            // Active or first entry: add to end of map
            if (isActive || !mostRecentEditor) {
                this.mostRecentEditorsMap.set(key, key, mostRecentEditor ? 1 /* Touch.AsOld */ : undefined);
            }
            // Otherwise: insert before most recent
            else {
                // we have most recent editors. as such we
                // put this newly opened editor right before
                // the current most recent one because it cannot
                // be the most recently active one unless
                // it becomes active. but it is still more
                // active then any other editor in the list.
                this.mostRecentEditorsMap.set(key, key, 1 /* Touch.AsOld */);
                this.mostRecentEditorsMap.set(mostRecentEditor, mostRecentEditor, 1 /* Touch.AsOld */);
            }
            // Update in resource map if this is a new editor
            if (isNew) {
                this.updateEditorResourcesMap(editor, true);
            }
            // Event
            this._onDidMostRecentlyActiveEditorsChange.fire();
        }
        updateEditorResourcesMap(editor, add) {
            // Distill the editor resource and type id with support
            // for side by side editor's primary side too.
            let resource = undefined;
            let typeId = undefined;
            let editorId = undefined;
            if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                resource = editor.primary.resource;
                typeId = editor.primary.typeId;
                editorId = editor.primary.editorId;
            }
            else {
                resource = editor.resource;
                typeId = editor.typeId;
                editorId = editor.editorId;
            }
            if (!resource) {
                return; // require a resource
            }
            const identifier = this.toIdentifier(typeId, editorId);
            // Add entry
            if (add) {
                let editorsPerResource = this.editorsPerResourceCounter.get(resource);
                if (!editorsPerResource) {
                    editorsPerResource = new Map();
                    this.editorsPerResourceCounter.set(resource, editorsPerResource);
                }
                editorsPerResource.set(identifier, (editorsPerResource.get(identifier) ?? 0) + 1);
            }
            // Remove entry
            else {
                const editorsPerResource = this.editorsPerResourceCounter.get(resource);
                if (editorsPerResource) {
                    const counter = editorsPerResource.get(identifier) ?? 0;
                    if (counter > 1) {
                        editorsPerResource.set(identifier, counter - 1);
                    }
                    else {
                        editorsPerResource.delete(identifier);
                        if (editorsPerResource.size === 0) {
                            this.editorsPerResourceCounter.delete(resource);
                        }
                    }
                }
            }
        }
        removeMostRecentEditor(group, editor) {
            // Update in resource map
            this.updateEditorResourcesMap(editor, false);
            // Update in MRU list
            const key = this.findKey(group, editor);
            if (key) {
                // Remove from most recent editors
                this.mostRecentEditorsMap.delete(key);
                // Remove from key map
                const map = this.keyMap.get(group.id);
                if (map && map.delete(key.editor) && map.size === 0) {
                    this.keyMap.delete(group.id);
                }
                // Event
                this._onDidMostRecentlyActiveEditorsChange.fire();
            }
        }
        findKey(group, editor) {
            const groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                return undefined;
            }
            return groupMap.get(editor);
        }
        ensureKey(group, editor) {
            let groupMap = this.keyMap.get(group.id);
            if (!groupMap) {
                groupMap = new Map();
                this.keyMap.set(group.id, groupMap);
            }
            let key = groupMap.get(editor);
            if (!key) {
                key = { groupId: group.id, editor };
                groupMap.set(editor, key);
            }
            return key;
        }
        async ensureOpenedEditorsLimit(exclude, groupId) {
            if (!this.editorGroupService.partOptions.limit?.enabled ||
                typeof this.editorGroupService.partOptions.limit.value !== 'number' ||
                this.editorGroupService.partOptions.limit.value <= 0) {
                return; // return early if not enabled or invalid
            }
            const limit = this.editorGroupService.partOptions.limit.value;
            // In editor group
            if (this.editorGroupService.partOptions.limit?.perEditorGroup) {
                // For specific editor groups
                if (typeof groupId === 'number') {
                    const group = this.editorGroupsContainer.getGroup(groupId);
                    if (group) {
                        await this.doEnsureOpenedEditorsLimit(limit, group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ editor, groupId })), exclude);
                    }
                }
                // For all editor groups
                else {
                    for (const group of this.editorGroupsContainer.groups) {
                        await this.ensureOpenedEditorsLimit(exclude, group.id);
                    }
                }
            }
            // Across all editor groups
            else {
                await this.doEnsureOpenedEditorsLimit(limit, [...this.mostRecentEditorsMap.values()], exclude);
            }
        }
        async doEnsureOpenedEditorsLimit(limit, mostRecentEditors, exclude) {
            // Check for `excludeDirty` setting and apply it by excluding
            // any recent editor that is dirty from the opened editors limit
            let mostRecentEditorsCountingForLimit;
            if (this.editorGroupService.partOptions.limit?.excludeDirty) {
                mostRecentEditorsCountingForLimit = mostRecentEditors.filter(({ editor }) => {
                    if ((editor.isDirty() && !editor.isSaving()) || editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                        return false; // not dirty editors (unless in the process of saving) or scratchpads
                    }
                    return true;
                });
            }
            else {
                mostRecentEditorsCountingForLimit = mostRecentEditors;
            }
            if (limit >= mostRecentEditorsCountingForLimit.length) {
                return; // only if opened editors exceed setting and is valid and enabled
            }
            // Extract least recently used editors that can be closed
            const leastRecentlyClosableEditors = mostRecentEditorsCountingForLimit.reverse().filter(({ editor, groupId }) => {
                if ((editor.isDirty() && !editor.isSaving()) || editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                    return false; // not dirty editors (unless in the process of saving) or scratchpads
                }
                if (exclude && editor === exclude.editor && groupId === exclude.groupId) {
                    return false; // never the editor that should be excluded
                }
                if (this.editorGroupsContainer.getGroup(groupId)?.isSticky(editor)) {
                    return false; // never sticky editors
                }
                return true;
            });
            // Close editors until we reached the limit again
            let editorsToCloseCount = mostRecentEditorsCountingForLimit.length - limit;
            const mapGroupToEditorsToClose = new Map();
            for (const { groupId, editor } of leastRecentlyClosableEditors) {
                let editorsInGroupToClose = mapGroupToEditorsToClose.get(groupId);
                if (!editorsInGroupToClose) {
                    editorsInGroupToClose = [];
                    mapGroupToEditorsToClose.set(groupId, editorsInGroupToClose);
                }
                editorsInGroupToClose.push(editor);
                editorsToCloseCount--;
                if (editorsToCloseCount === 0) {
                    break; // limit reached
                }
            }
            for (const [groupId, editors] of mapGroupToEditorsToClose) {
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (group) {
                    await group.closeEditors(editors, { preserveFocus: true });
                }
            }
        }
        saveState() {
            if (this.isScoped) {
                return; // do not persist state when scoped
            }
            if (this.mostRecentEditorsMap.isEmpty()) {
                this.storageService.remove(EditorsObserver_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(EditorsObserver_1.STORAGE_KEY, JSON.stringify(this.serialize()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        serialize() {
            const registry = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory);
            const entries = [...this.mostRecentEditorsMap.values()];
            const mapGroupToSerializableEditorsOfGroup = new Map();
            return {
                entries: (0, arrays_1.coalesce)(entries.map(({ editor, groupId }) => {
                    // Find group for entry
                    const group = this.editorGroupsContainer.getGroup(groupId);
                    if (!group) {
                        return undefined;
                    }
                    // Find serializable editors of group
                    let serializableEditorsOfGroup = mapGroupToSerializableEditorsOfGroup.get(group);
                    if (!serializableEditorsOfGroup) {
                        serializableEditorsOfGroup = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */).filter(editor => {
                            const editorSerializer = registry.getEditorSerializer(editor);
                            return editorSerializer?.canSerialize(editor);
                        });
                        mapGroupToSerializableEditorsOfGroup.set(group, serializableEditorsOfGroup);
                    }
                    // Only store the index of the editor of that group
                    // which can be undefined if the editor is not serializable
                    const index = serializableEditorsOfGroup.indexOf(editor);
                    if (index === -1) {
                        return undefined;
                    }
                    return { groupId, index };
                }))
            };
        }
        async loadState() {
            if (this.editorGroupsContainer === this.editorGroupService.mainPart || this.editorGroupsContainer === this.editorGroupService) {
                await this.editorGroupService.whenReady;
            }
            // Previous state: Load editors map from persisted state
            // unless we are running in scoped mode
            let hasRestorableState = false;
            if (!this.isScoped) {
                const serialized = this.storageService.get(EditorsObserver_1.STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                if (serialized) {
                    hasRestorableState = true;
                    this.deserialize(JSON.parse(serialized));
                }
            }
            // No previous state: best we can do is add each editor
            // from oldest to most recently used editor group
            if (!hasRestorableState) {
                const groups = this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */);
                for (let i = groups.length - 1; i >= 0; i--) {
                    const group = groups[i];
                    const groupEditorsMru = group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                    for (let i = groupEditorsMru.length - 1; i >= 0; i--) {
                        this.addMostRecentEditor(group, groupEditorsMru[i], true /* enforce as active to preserve order */, true /* is new */);
                    }
                }
            }
            // Ensure we listen on group changes for those that exist on startup
            for (const group of this.editorGroupsContainer.groups) {
                this.registerGroupListeners(group);
            }
        }
        deserialize(serialized) {
            const mapValues = [];
            for (const { groupId, index } of serialized.entries) {
                // Find group for entry
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (!group) {
                    continue;
                }
                // Find editor for entry
                const editor = group.getEditorByIndex(index);
                if (!editor) {
                    continue;
                }
                // Make sure key is registered as well
                const editorIdentifier = this.ensureKey(group, editor);
                mapValues.push([editorIdentifier, editorIdentifier]);
                // Update in resource map
                this.updateEditorResourcesMap(editor, true);
            }
            // Fill map with deserialized values
            this.mostRecentEditorsMap.fromJSON(mapValues);
        }
    };
    exports.EditorsObserver = EditorsObserver;
    exports.EditorsObserver = EditorsObserver = EditorsObserver_1 = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, storage_1.IStorageService)
    ], EditorsObserver);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yc09ic2VydmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZWRpdG9yc09ic2VydmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHOzs7Ozs7OztPQVFHO0lBQ0ksSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBVTs7aUJBRXRCLGdCQUFXLEdBQUcsYUFBYSxBQUFoQixDQUFpQjtRQVNwRCxJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxTQUFTLENBQUMsTUFBc0M7WUFDL0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFcEUsT0FBTyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUM7UUFDekQsQ0FBQztRQUVELFVBQVUsQ0FBQyxRQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBSU8sWUFBWSxDQUFDLElBQTZDLEVBQUUsUUFBNkI7WUFDaEcsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFD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