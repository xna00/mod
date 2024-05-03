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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/search/common/search", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/platform/instantiation/common/extensions", "vs/base/browser/dom", "vs/platform/workspaces/common/workspaces", "vs/base/common/network", "vs/base/common/errors", "vs/workbench/common/resources", "vs/workbench/services/path/common/pathService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/base/browser/window"], function (require, exports, nls_1, uri_1, editor_1, editorService_1, history_1, files_1, workspace_1, lifecycle_1, storage_1, event_1, configuration_1, editorGroupsService_1, search_1, instantiation_1, layoutService_1, contextkey_1, arrays_1, extensions_1, dom_1, workspaces_1, network_1, errors_1, resources_1, pathService_1, uriIdentity_1, lifecycle_2, log_1, window_1) {
    "use strict";
    var HistoryService_1, EditorNavigationStack_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorNavigationStack = exports.HistoryService = void 0;
    let HistoryService = class HistoryService extends lifecycle_1.Disposable {
        static { HistoryService_1 = this; }
        static { this.MOUSE_NAVIGATION_SETTING = 'workbench.editor.mouseBackForwardToNavigate'; }
        static { this.NAVIGATION_SCOPE_SETTING = 'workbench.editor.navigationScope'; }
        constructor(editorService, editorGroupService, contextService, storageService, configurationService, fileService, workspacesService, instantiationService, layoutService, contextKeyService, logService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.contextKeyService = contextKeyService;
            this.logService = logService;
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.lastActiveEditor = undefined;
            this.editorHelper = this.instantiationService.createInstance(EditorHelper);
            //#region History Context Keys
            this.canNavigateBackContextKey = (new contextkey_1.RawContextKey('canNavigateBack', false, (0, nls_1.localize)('canNavigateBack', "Whether it is possible to navigate back in editor history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardContextKey = (new contextkey_1.RawContextKey('canNavigateForward', false, (0, nls_1.localize)('canNavigateForward', "Whether it is possible to navigate forward in editor history"))).bindTo(this.contextKeyService);
            this.canNavigateBackInNavigationsContextKey = (new contextkey_1.RawContextKey('canNavigateBackInNavigationLocations', false, (0, nls_1.localize)('canNavigateBackInNavigationLocations', "Whether it is possible to navigate back in editor navigation locations history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardInNavigationsContextKey = (new contextkey_1.RawContextKey('canNavigateForwardInNavigationLocations', false, (0, nls_1.localize)('canNavigateForwardInNavigationLocations', "Whether it is possible to navigate forward in editor navigation locations history"))).bindTo(this.contextKeyService);
            this.canNavigateToLastNavigationLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastNavigationLocation', false, (0, nls_1.localize)('canNavigateToLastNavigationLocation', "Whether it is possible to navigate to the last editor navigation location"))).bindTo(this.contextKeyService);
            this.canNavigateBackInEditsContextKey = (new contextkey_1.RawContextKey('canNavigateBackInEditLocations', false, (0, nls_1.localize)('canNavigateBackInEditLocations', "Whether it is possible to navigate back in editor edit locations history"))).bindTo(this.contextKeyService);
            this.canNavigateForwardInEditsContextKey = (new contextkey_1.RawContextKey('canNavigateForwardInEditLocations', false, (0, nls_1.localize)('canNavigateForwardInEditLocations', "Whether it is possible to navigate forward in editor edit locations history"))).bindTo(this.contextKeyService);
            this.canNavigateToLastEditLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastEditLocation', false, (0, nls_1.localize)('canNavigateToLastEditLocation', "Whether it is possible to navigate to the last editor edit location"))).bindTo(this.contextKeyService);
            this.canReopenClosedEditorContextKey = (new contextkey_1.RawContextKey('canReopenClosedEditor', false, (0, nls_1.localize)('canReopenClosedEditor', "Whether it is possible to reopen the last closed editor"))).bindTo(this.contextKeyService);
            //#endregion
            //#region Editor History Navigation (limit: 50)
            this._onDidChangeEditorNavigationStack = this._register(new event_1.Emitter());
            this.onDidChangeEditorNavigationStack = this._onDidChangeEditorNavigationStack.event;
            this.defaultScopedEditorNavigationStack = undefined;
            this.editorGroupScopedNavigationStacks = new Map();
            this.editorScopedNavigationStacks = new Map();
            this.editorNavigationScope = 0 /* GoScope.DEFAULT */;
            //#endregion
            //#region Navigation: Next/Previous Used Editor
            this.recentlyUsedEditorsStack = undefined;
            this.recentlyUsedEditorsStackIndex = 0;
            this.recentlyUsedEditorsInGroupStack = undefined;
            this.recentlyUsedEditorsInGroupStackIndex = 0;
            this.navigatingInRecentlyUsedEditorsStack = false;
            this.navigatingInRecentlyUsedEditorsInGroupStack = false;
            this.recentlyClosedEditors = [];
            this.ignoreEditorCloseEvent = false;
            this.history = undefined;
            this.editorHistoryListeners = new Map();
            this.resourceExcludeMatcher = this._register(new dom_1.WindowIdleValue(window_1.mainWindow, () => {
                const matcher = this._register(this.instantiationService.createInstance(resources_1.ResourceGlobMatcher, root => (0, search_1.getExcludes)(root ? this.configurationService.getValue({ resource: root }) : this.configurationService.getValue()) || Object.create(null), event => event.affectsConfiguration(files_1.FILES_EXCLUDE_CONFIG) || event.affectsConfiguration(search_1.SEARCH_EXCLUDE_CONFIG)));
                this._register(matcher.onExpressionChange(() => this.removeExcludedFromHistory()));
                return matcher;
            }));
            this.registerListeners();
            // if the service is created late enough that an editor is already opened
            // make sure to trigger the onActiveEditorChanged() to track the editor
            // properly (fixes https://github.com/microsoft/vscode/issues/59908)
            if (this.editorService.activeEditorPane) {
                this.onDidActiveEditorChange();
            }
        }
        registerListeners() {
            // Mouse back/forward support
            this.registerMouseNavigationListener();
            // Editor changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.onDidActiveEditorChange()));
            this._register(this.editorService.onDidOpenEditorFail(event => this.remove(event.editor)));
            this._register(this.editorService.onDidCloseEditor(event => this.onDidCloseEditor(event)));
            this._register(this.editorService.onDidMostRecentlyActiveEditorsChange(() => this.handleEditorEventInRecentEditorsStack()));
            // Editor group changes
            this._register(this.editorGroupService.onDidRemoveGroup(e => this.onDidRemoveGroup(e)));
            // File changes
            this._register(this.fileService.onDidFilesChange(event => this.onDidFilesChange(event)));
            this._register(this.fileService.onDidRunOperation(event => this.onDidFilesChange(event)));
            // Storage
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
            // Configuration
            this.registerEditorNavigationScopeChangeListener();
            // Context keys
            this._register(this.onDidChangeEditorNavigationStack(() => this.updateContextKeys()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.updateContextKeys()));
        }
        onDidCloseEditor(e) {
            this.handleEditorCloseEventInHistory(e);
            this.handleEditorCloseEventInReopen(e);
        }
        registerMouseNavigationListener() {
            const mouseBackForwardSupportListener = this._register(new lifecycle_1.DisposableStore());
            const handleMouseBackForwardSupport = () => {
                mouseBackForwardSupportListener.clear();
                if (this.configurationService.getValue(HistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                    this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                        const eventDisposables = disposables.add(new lifecycle_1.DisposableStore());
                        eventDisposables.add((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_DOWN, e => this.onMouseDownOrUp(e, true)));
                        eventDisposables.add((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_UP, e => this.onMouseDownOrUp(e, false)));
                        mouseBackForwardSupportListener.add(eventDisposables);
                    }, { container: this.layoutService.mainContainer, disposables: this._store }));
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(HistoryService_1.MOUSE_NAVIGATION_SETTING)) {
                    handleMouseBackForwardSupport();
                }
            }));
            handleMouseBackForwardSupport();
        }
        onMouseDownOrUp(event, isMouseDown) {
            // Support to navigate in history when mouse buttons 4/5 are pressed
            // We want to trigger this on mouse down for a faster experience
            // but we also need to prevent mouse up from triggering the default
            // which is to navigate in the browser history.
            switch (event.button) {
                case 3:
                    dom_1.EventHelper.stop(event);
                    if (isMouseDown) {
                        this.goBack();
                    }
                    break;
                case 4:
                    dom_1.EventHelper.stop(event);
                    if (isMouseDown) {
                        this.goForward();
                    }
                    break;
            }
        }
        onDidRemoveGroup(group) {
            this.handleEditorGroupRemoveInNavigationStacks(group);
        }
        onDidActiveEditorChange() {
            const activeEditorGroup = this.editorGroupService.activeGroup;
            const activeEditorPane = activeEditorGroup.activeEditorPane;
            if (this.lastActiveEditor && this.editorHelper.matchesEditorIdentifier(this.lastActiveEditor, activeEditorPane)) {
                return; // return if the active editor is still the same
            }
            // Remember as last active editor (can be undefined if none opened)
            this.lastActiveEditor = activeEditorPane?.input ? { editor: activeEditorPane.input, groupId: activeEditorPane.group.id } : undefined;
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Handle editor change unless the editor is transient
            if (!activeEditorPane?.group.isTransient(activeEditorPane.input)) {
                this.handleActiveEditorChange(activeEditorGroup, activeEditorPane);
            }
            else {
                this.logService.trace(`[History]: ignoring transient editor change (editor: ${activeEditorPane.input?.resource?.toString()}})`);
            }
            // Listen to selection changes unless the editor is transient
            if ((0, editor_1.isEditorPaneWithSelection)(activeEditorPane)) {
                this.activeEditorListeners.add(activeEditorPane.onDidChangeSelection(e => {
                    if (!activeEditorPane.group.isTransient(activeEditorPane.input)) {
                        this.handleActiveEditorSelectionChangeEvent(activeEditorGroup, activeEditorPane, e);
                    }
                    else {
                        this.logService.trace(`[History]: ignoring transient editor selection change (editor: ${activeEditorPane.input?.resource?.toString()}})`);
                    }
                }));
            }
            // Context keys
            this.updateContextKeys();
        }
        onDidFilesChange(event) {
            // External file changes (watcher)
            if (event instanceof files_1.FileChangesEvent) {
                if (event.gotDeleted()) {
                    this.remove(event);
                }
            }
            // Internal file changes (e.g. explorer)
            else {
                // Delete
                if (event.isOperation(1 /* FileOperation.DELETE */)) {
                    this.remove(event);
                }
                // Move
                else if (event.isOperation(2 /* FileOperation.MOVE */) && event.target.isFile) {
                    this.move(event);
                }
            }
        }
        handleActiveEditorChange(group, editorPane) {
            this.handleActiveEditorChangeInHistory(editorPane);
            this.handleActiveEditorChangeInNavigationStacks(group, editorPane);
        }
        handleActiveEditorSelectionChangeEvent(group, editorPane, event) {
            this.handleActiveEditorSelectionChangeInNavigationStacks(group, editorPane, event);
        }
        move(event) {
            this.moveInHistory(event);
            this.moveInEditorNavigationStacks(event);
        }
        remove(arg1) {
            this.removeFromHistory(arg1);
            this.removeFromEditorNavigationStacks(arg1);
            this.removeFromRecentlyClosedEditors(arg1);
            this.removeFromRecentlyOpened(arg1);
        }
        removeFromRecentlyOpened(arg1) {
            let resource = undefined;
            if ((0, editor_1.isEditorInput)(arg1)) {
                resource = editor_1.EditorResourceAccessor.getOriginalUri(arg1);
            }
            else if (arg1 instanceof files_1.FileChangesEvent) {
                // Ignore for now (recently opened are most often out of workspace files anyway for which there are no file events)
            }
            else {
                resource = arg1.resource;
            }
            if (resource) {
                this.workspacesService.removeRecentlyOpened([resource]);
            }
        }
        clear() {
            // History
            this.clearRecentlyOpened();
            // Navigation (next, previous)
            this.clearEditorNavigationStacks();
            // Recently closed editors
            this.recentlyClosedEditors = [];
            // Context Keys
            this.updateContextKeys();
        }
        updateContextKeys() {
            this.contextKeyService.bufferChangeEvents(() => {
                const activeStack = this.getStack();
                this.canNavigateBackContextKey.set(activeStack.canGoBack(0 /* GoFilter.NONE */));
                this.canNavigateForwardContextKey.set(activeStack.canGoForward(0 /* GoFilter.NONE */));
                this.canNavigateBackInNavigationsContextKey.set(activeStack.canGoBack(2 /* GoFilter.NAVIGATION */));
                this.canNavigateForwardInNavigationsContextKey.set(activeStack.canGoForward(2 /* GoFilter.NAVIGATION */));
                this.canNavigateToLastNavigationLocationContextKey.set(activeStack.canGoLast(2 /* GoFilter.NAVIGATION */));
                this.canNavigateBackInEditsContextKey.set(activeStack.canGoBack(1 /* GoFilter.EDITS */));
                this.canNavigateForwardInEditsContextKey.set(activeStack.canGoForward(1 /* GoFilter.EDITS */));
                this.canNavigateToLastEditLocationContextKey.set(activeStack.canGoLast(1 /* GoFilter.EDITS */));
                this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
            });
        }
        registerEditorNavigationScopeChangeListener() {
            const handleEditorNavigationScopeChange = () => {
                // Ensure to start fresh when setting changes
                this.disposeEditorNavigationStacks();
                // Update scope
                const configuredScope = this.configurationService.getValue(HistoryService_1.NAVIGATION_SCOPE_SETTING);
                if (configuredScope === 'editorGroup') {
                    this.editorNavigationScope = 1 /* GoScope.EDITOR_GROUP */;
                }
                else if (configuredScope === 'editor') {
                    this.editorNavigationScope = 2 /* GoScope.EDITOR */;
                }
                else {
                    this.editorNavigationScope = 0 /* GoScope.DEFAULT */;
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration(HistoryService_1.NAVIGATION_SCOPE_SETTING)) {
                    handleEditorNavigationScopeChange();
                }
            }));
            handleEditorNavigationScopeChange();
        }
        getStack(group = this.editorGroupService.activeGroup, editor = group.activeEditor) {
            switch (this.editorNavigationScope) {
                // Per Editor
                case 2 /* GoScope.EDITOR */: {
                    if (!editor) {
                        return new NoOpEditorNavigationStacks();
                    }
                    let stacksForGroup = this.editorScopedNavigationStacks.get(group.id);
                    if (!stacksForGroup) {
                        stacksForGroup = new Map();
                        this.editorScopedNavigationStacks.set(group.id, stacksForGroup);
                    }
                    let stack = stacksForGroup.get(editor)?.stack;
                    if (!stack) {
                        const disposable = new lifecycle_1.DisposableStore();
                        stack = disposable.add(this.instantiationService.createInstance(EditorNavigationStacks, 2 /* GoScope.EDITOR */));
                        disposable.add(stack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                        stacksForGroup.set(editor, { stack, disposable });
                    }
                    return stack;
                }
                // Per Editor Group
                case 1 /* GoScope.EDITOR_GROUP */: {
                    let stack = this.editorGroupScopedNavigationStacks.get(group.id)?.stack;
                    if (!stack) {
                        const disposable = new lifecycle_1.DisposableStore();
                        stack = disposable.add(this.instantiationService.createInstance(EditorNavigationStacks, 1 /* GoScope.EDITOR_GROUP */));
                        disposable.add(stack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                        this.editorGroupScopedNavigationStacks.set(group.id, { stack, disposable });
                    }
                    return stack;
                }
                // Global
                case 0 /* GoScope.DEFAULT */: {
                    if (!this.defaultScopedEditorNavigationStack) {
                        this.defaultScopedEditorNavigationStack = this._register(this.instantiationService.createInstance(EditorNavigationStacks, 0 /* GoScope.DEFAULT */));
                        this._register(this.defaultScopedEditorNavigationStack.onDidChange(() => this._onDidChangeEditorNavigationStack.fire()));
                    }
                    return this.defaultScopedEditorNavigationStack;
                }
            }
        }
        goForward(filter) {
            return this.getStack().goForward(filter);
        }
        goBack(filter) {
            return this.getStack().goBack(filter);
        }
        goPrevious(filter) {
            return this.getStack().goPrevious(filter);
        }
        goLast(filter) {
            return this.getStack().goLast(filter);
        }
        handleActiveEditorChangeInNavigationStacks(group, editorPane) {
            this.getStack(group, editorPane?.input).handleActiveEditorChange(editorPane);
        }
        handleActiveEditorSelectionChangeInNavigationStacks(group, editorPane, event) {
            this.getStack(group, editorPane.input).handleActiveEditorSelectionChange(editorPane, event);
        }
        handleEditorCloseEventInHistory(e) {
            const editors = this.editorScopedNavigationStacks.get(e.groupId);
            if (editors) {
                const editorStack = editors.get(e.editor);
                if (editorStack) {
                    editorStack.disposable.dispose();
                    editors.delete(e.editor);
                }
                if (editors.size === 0) {
                    this.editorScopedNavigationStacks.delete(e.groupId);
                }
            }
        }
        handleEditorGroupRemoveInNavigationStacks(group) {
            // Global
            this.defaultScopedEditorNavigationStack?.remove(group.id);
            // Editor groups
            const editorGroupStack = this.editorGroupScopedNavigationStacks.get(group.id);
            if (editorGroupStack) {
                editorGroupStack.disposable.dispose();
                this.editorGroupScopedNavigationStacks.delete(group.id);
            }
        }
        clearEditorNavigationStacks() {
            this.withEachEditorNavigationStack(stack => stack.clear());
        }
        removeFromEditorNavigationStacks(arg1) {
            this.withEachEditorNavigationStack(stack => stack.remove(arg1));
        }
        moveInEditorNavigationStacks(event) {
            this.withEachEditorNavigationStack(stack => stack.move(event));
        }
        withEachEditorNavigationStack(fn) {
            // Global
            if (this.defaultScopedEditorNavigationStack) {
                fn(this.defaultScopedEditorNavigationStack);
            }
            // Per editor group
            for (const [, entry] of this.editorGroupScopedNavigationStacks) {
                fn(entry.stack);
            }
            // Per editor
            for (const [, entries] of this.editorScopedNavigationStacks) {
                for (const [, entry] of entries) {
                    fn(entry.stack);
                }
            }
        }
        disposeEditorNavigationStacks() {
            // Global
            this.defaultScopedEditorNavigationStack?.dispose();
            this.defaultScopedEditorNavigationStack = undefined;
            // Per Editor group
            for (const [, stack] of this.editorGroupScopedNavigationStacks) {
                stack.disposable.dispose();
            }
            this.editorGroupScopedNavigationStacks.clear();
            // Per Editor
            for (const [, stacks] of this.editorScopedNavigationStacks) {
                for (const [, stack] of stacks) {
                    stack.disposable.dispose();
                }
            }
            this.editorScopedNavigationStacks.clear();
        }
        openNextRecentlyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index - 1, groupId);
            return this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        openPreviouslyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index + 1, groupId);
            return this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        async doNavigateInRecentlyUsedEditorsStack(editorIdentifier, groupId) {
            if (editorIdentifier) {
                const acrossGroups = typeof groupId !== 'number' || !this.editorGroupService.getGroup(groupId);
                if (acrossGroups) {
                    this.navigatingInRecentlyUsedEditorsStack = true;
                }
                else {
                    this.navigatingInRecentlyUsedEditorsInGroupStack = true;
                }
                const group = this.editorGroupService.getGroup(editorIdentifier.groupId) ?? this.editorGroupService.activeGroup;
                try {
                    await group.openEditor(editorIdentifier.editor);
                }
                finally {
                    if (acrossGroups) {
                        this.navigatingInRecentlyUsedEditorsStack = false;
                    }
                    else {
                        this.navigatingInRecentlyUsedEditorsInGroupStack = false;
                    }
                }
            }
        }
        ensureRecentlyUsedStack(indexModifier, groupId) {
            let editors;
            let index;
            const group = typeof groupId === 'number' ? this.editorGroupService.getGroup(groupId) : undefined;
            // Across groups
            if (!group) {
                editors = this.recentlyUsedEditorsStack || this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */);
                index = this.recentlyUsedEditorsStackIndex;
            }
            // Within group
            else {
                editors = this.recentlyUsedEditorsInGroupStack || group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).map(editor => ({ groupId: group.id, editor }));
                index = this.recentlyUsedEditorsInGroupStackIndex;
            }
            // Adjust index
            let newIndex = indexModifier(index);
            if (newIndex < 0) {
                newIndex = 0;
            }
            else if (newIndex > editors.length - 1) {
                newIndex = editors.length - 1;
            }
            // Remember index and editors
            if (!group) {
                this.recentlyUsedEditorsStack = editors;
                this.recentlyUsedEditorsStackIndex = newIndex;
            }
            else {
                this.recentlyUsedEditorsInGroupStack = editors;
                this.recentlyUsedEditorsInGroupStackIndex = newIndex;
            }
            return [editors, newIndex];
        }
        handleEditorEventInRecentEditorsStack() {
            // Drop all-editors stack unless navigating in all editors
            if (!this.navigatingInRecentlyUsedEditorsStack) {
                this.recentlyUsedEditorsStack = undefined;
                this.recentlyUsedEditorsStackIndex = 0;
            }
            // Drop in-group-editors stack unless navigating in group
            if (!this.navigatingInRecentlyUsedEditorsInGroupStack) {
                this.recentlyUsedEditorsInGroupStack = undefined;
                this.recentlyUsedEditorsInGroupStackIndex = 0;
            }
        }
        //#endregion
        //#region File: Reopen Closed Editor (limit: 20)
        static { this.MAX_RECENTLY_CLOSED_EDITORS = 20; }
        handleEditorCloseEventInReopen(event) {
            if (this.ignoreEditorCloseEvent) {
                return; // blocked
            }
            const { editor, context } = event;
            if (context === editor_1.EditorCloseContext.REPLACE || context === editor_1.EditorCloseContext.MOVE) {
                return; // ignore if editor was replaced or moved
            }
            const untypedEditor = editor.toUntyped();
            if (!untypedEditor) {
                return; // we need a untyped editor to restore from going forward
            }
            const associatedResources = [];
            const editorResource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
            if (uri_1.URI.isUri(editorResource)) {
                associatedResources.push(editorResource);
            }
            else if (editorResource) {
                associatedResources.push(...(0, arrays_1.coalesce)([editorResource.primary, editorResource.secondary]));
            }
            // Remove from list of recently closed before...
            this.removeFromRecentlyClosedEditors(editor);
            // ...adding it as last recently closed
            this.recentlyClosedEditors.push({
                editorId: editor.editorId,
                editor: untypedEditor,
                resource: editor_1.EditorResourceAccessor.getOriginalUri(editor),
                associatedResources,
                index: event.index,
                sticky: event.sticky
            });
            // Bounding
            if (this.recentlyClosedEditors.length > HistoryService_1.MAX_RECENTLY_CLOSED_EDITORS) {
                this.recentlyClosedEditors.shift();
            }
            // Context
            this.canReopenClosedEditorContextKey.set(true);
        }
        async reopenLastClosedEditor() {
            // Open editor if we have one
            const lastClosedEditor = this.recentlyClosedEditors.pop();
            let reopenClosedEditorPromise = undefined;
            if (lastClosedEditor) {
                reopenClosedEditorPromise = this.doReopenLastClosedEditor(lastClosedEditor);
            }
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
            return reopenClosedEditorPromise;
        }
        async doReopenLastClosedEditor(lastClosedEditor) {
            const options = { pinned: true, sticky: lastClosedEditor.sticky, index: lastClosedEditor.index, ignoreError: true };
            // Special sticky handling: remove the index property from options
            // if that would result in sticky state to not preserve or apply
            // wrongly.
            if ((lastClosedEditor.sticky && !this.editorGroupService.activeGroup.isSticky(lastClosedEditor.index)) ||
                (!lastClosedEditor.sticky && this.editorGroupService.activeGroup.isSticky(lastClosedEditor.index))) {
                options.index = undefined;
            }
            // Re-open editor unless already opened
            let editorPane = undefined;
            if (!this.editorGroupService.activeGroup.contains(lastClosedEditor.editor)) {
                // Fix for https://github.com/microsoft/vscode/issues/107850
                // If opening an editor fails, it is possible that we get
                // another editor-close event as a result. But we really do
                // want to ignore that in our list of recently closed editors
                //  to prevent endless loops.
                this.ignoreEditorCloseEvent = true;
                try {
                    editorPane = await this.editorService.openEditor({
                        ...lastClosedEditor.editor,
                        options: {
                            ...lastClosedEditor.editor.options,
                            ...options
                        }
                    });
                }
                finally {
                    this.ignoreEditorCloseEvent = false;
                }
            }
            // If no editor was opened, try with the next one
            if (!editorPane) {
                // Fix for https://github.com/microsoft/vscode/issues/67882
                // If opening of the editor fails, make sure to try the next one
                // but make sure to remove this one from the list to prevent
                // endless loops.
                (0, arrays_1.remove)(this.recentlyClosedEditors, lastClosedEditor);
                // Try with next one
                this.reopenLastClosedEditor();
            }
        }
        removeFromRecentlyClosedEditors(arg1) {
            this.recentlyClosedEditors = this.recentlyClosedEditors.filter(recentlyClosedEditor => {
                if ((0, editor_1.isEditorInput)(arg1) && recentlyClosedEditor.editorId !== arg1.editorId) {
                    return true; // keep: different editor identifiers
                }
                if (recentlyClosedEditor.resource && this.editorHelper.matchesFile(recentlyClosedEditor.resource, arg1)) {
                    return false; // remove: editor matches directly
                }
                if (recentlyClosedEditor.associatedResources.some(associatedResource => this.editorHelper.matchesFile(associatedResource, arg1))) {
                    return false; // remove: an associated resource matches
                }
                return true; // keep
            });
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
        }
        //#endregion
        //#region Go to: Recently Opened Editor (limit: 200, persisted)
        static { this.MAX_HISTORY_ITEMS = 200; }
        static { this.HISTORY_STORAGE_KEY = 'history.entries'; }
        handleActiveEditorChangeInHistory(editorPane) {
            // Ensure we have not configured to exclude input and don't track invalid inputs
            const editor = editorPane?.input;
            if (!editor || editor.isDisposed() || !this.includeInHistory(editor)) {
                return;
            }
            // Remove any existing entry and add to the beginning
            this.removeFromHistory(editor);
            this.addToHistory(editor);
        }
        addToHistory(editor, insertFirst = true) {
            this.ensureHistoryLoaded(this.history);
            const historyInput = this.editorHelper.preferResourceEditorInput(editor);
            if (!historyInput) {
                return;
            }
            // Insert based on preference
            if (insertFirst) {
                this.history.unshift(historyInput);
            }
            else {
                this.history.push(historyInput);
            }
            // Respect max entries setting
            if (this.history.length > HistoryService_1.MAX_HISTORY_ITEMS) {
                this.editorHelper.clearOnEditorDispose(this.history.pop(), this.editorHistoryListeners);
            }
            // React to editor input disposing
            if ((0, editor_1.isEditorInput)(editor)) {
                this.editorHelper.onEditorDispose(editor, () => this.updateHistoryOnEditorDispose(historyInput), this.editorHistoryListeners);
            }
        }
        updateHistoryOnEditorDispose(editor) {
            if ((0, editor_1.isEditorInput)(editor)) {
                // Any non side-by-side editor input gets removed directly on dispose
                if (!(0, editor_1.isSideBySideEditorInput)(editor)) {
                    this.removeFromHistory(editor);
                }
                // Side-by-side editors get special treatment: we try to distill the
                // possibly untyped resource inputs from both sides to be able to
                // offer these entries from the history to the user still.
                else {
                    const resourceInputs = [];
                    const sideInputs = editor.primary.matches(editor.secondary) ? [editor.primary] : [editor.primary, editor.secondary];
                    for (const sideInput of sideInputs) {
                        const candidateResourceInput = this.editorHelper.preferResourceEditorInput(sideInput);
                        if ((0, editor_1.isResourceEditorInput)(candidateResourceInput)) {
                            resourceInputs.push(candidateResourceInput);
                        }
                    }
                    // Insert the untyped resource inputs where our disposed
                    // side-by-side editor input is in the history stack
                    this.replaceInHistory(editor, ...resourceInputs);
                }
            }
            else {
                // Remove any editor that should not be included in history
                if (!this.includeInHistory(editor)) {
                    this.removeFromHistory(editor);
                }
            }
        }
        includeInHistory(editor) {
            if ((0, editor_1.isEditorInput)(editor)) {
                return true; // include any non files
            }
            return !this.resourceExcludeMatcher.value.matches(editor.resource);
        }
        removeExcludedFromHistory() {
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(entry => {
                const include = this.includeInHistory(entry);
                // Cleanup any listeners associated with the input when removing from history
                if (!include) {
                    this.editorHelper.clearOnEditorDispose(entry, this.editorHistoryListeners);
                }
                return include;
            });
        }
        moveInHistory(event) {
            if (event.isOperation(2 /* FileOperation.MOVE */)) {
                const removed = this.removeFromHistory(event);
                if (removed) {
                    this.addToHistory({ resource: event.target.resource });
                }
            }
        }
        removeFromHistory(arg1) {
            let removed = false;
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(entry => {
                const matches = this.editorHelper.matchesEditor(arg1, entry);
                // Cleanup any listeners associated with the input when removing from history
                if (matches) {
                    this.editorHelper.clearOnEditorDispose(arg1, this.editorHistoryListeners);
                    removed = true;
                }
                return !matches;
            });
            return removed;
        }
        replaceInHistory(editor, ...replacements) {
            this.ensureHistoryLoaded(this.history);
            let replaced = false;
            const newHistory = [];
            for (const entry of this.history) {
                // Entry matches and is going to be disposed + replaced
                if (this.editorHelper.matchesEditor(editor, entry)) {
                    // Cleanup any listeners associated with the input when replacing from history
                    this.editorHelper.clearOnEditorDispose(editor, this.editorHistoryListeners);
                    // Insert replacements but only once
                    if (!replaced) {
                        newHistory.push(...replacements);
                        replaced = true;
                    }
                }
                // Entry does not match, but only add it if it didn't match
                // our replacements already
                else if (!replacements.some(replacement => this.editorHelper.matchesEditor(replacement, entry))) {
                    newHistory.push(entry);
                }
            }
            // If the target editor to replace was not found, make sure to
            // insert the replacements to the end to ensure we got them
            if (!replaced) {
                newHistory.push(...replacements);
            }
            this.history = newHistory;
        }
        clearRecentlyOpened() {
            this.history = [];
            for (const [, disposable] of this.editorHistoryListeners) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.editorHistoryListeners.clear();
        }
        getHistory() {
            this.ensureHistoryLoaded(this.history);
            return this.history;
        }
        ensureHistoryLoaded(history) {
            if (!this.history) {
                // Until history is loaded, it is just empty
                this.history = [];
                // We want to seed history from opened editors
                // too as well as previous stored state, so we
                // need to wait for the editor groups being ready
                if (this.editorGroupService.isReady) {
                    this.loadHistory();
                }
                else {
                    (async () => {
                        await this.editorGroupService.whenReady;
                        this.loadHistory();
                    })();
                }
            }
        }
        loadHistory() {
            // Init as empty before adding - since we are about to
            // populate the history from opened editors, we capture
            // the right order here.
            this.history = [];
            // All stored editors from previous session
            const storedEditorHistory = this.loadHistoryFromStorage();
            // All restored editors from previous session
            // in reverse editor from least to most recently
            // used.
            const openedEditorsLru = [...this.editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)].reverse();
            // We want to merge the opened editors from the last
            // session with the stored editors from the last
            // session. Because not all editors can be serialised
            // we want to make sure to include all opened editors
            // too.
            // Opened editors should always be first in the history
            const handledEditors = new Set();
            // Add all opened editors first
            for (const { editor } of openedEditorsLru) {
                if (!this.includeInHistory(editor)) {
                    continue;
                }
                // Add into history
                this.addToHistory(editor);
                // Remember as added
                if (editor.resource) {
                    handledEditors.add(`${editor.resource.toString()}/${editor.editorId}`);
                }
            }
            // Add remaining from storage if not there already
            // We check on resource and `editorId` (from `override`)
            // to figure out if the editor has been already added.
            for (const editor of storedEditorHistory) {
                if (!handledEditors.has(`${editor.resource.toString()}/${editor.options?.override}`) &&
                    this.includeInHistory(editor)) {
                    this.addToHistory(editor, false /* at the end */);
                }
            }
        }
        loadHistoryFromStorage() {
            const entries = [];
            const entriesRaw = this.storageService.get(HistoryService_1.HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            if (entriesRaw) {
                try {
                    const entriesParsed = JSON.parse(entriesRaw);
                    for (const entryParsed of entriesParsed) {
                        if (!entryParsed.editor || !entryParsed.editor.resource) {
                            continue; // unexpected data format
                        }
                        try {
                            entries.push({
                                ...entryParsed.editor,
                                resource: typeof entryParsed.editor.resource === 'string' ?
                                    uri_1.URI.parse(entryParsed.editor.resource) : //  from 1.67.x: URI is stored efficiently as URI.toString()
                                    uri_1.URI.from(entryParsed.editor.resource) // until 1.66.x: URI was stored very verbose as URI.toJSON()
                            });
                        }
                        catch (error) {
                            (0, errors_1.onUnexpectedError)(error); // do not fail entire history when one entry fails
                        }
                    }
                }
                catch (error) {
                    (0, errors_1.onUnexpectedError)(error); // https://github.com/microsoft/vscode/issues/99075
                }
            }
            return entries;
        }
        saveState() {
            if (!this.history) {
                return; // nothing to save because history was not used
            }
            const entries = [];
            for (const editor of this.history) {
                if ((0, editor_1.isEditorInput)(editor) || !(0, editor_1.isResourceEditorInput)(editor)) {
                    continue; // only save resource editor inputs
                }
                entries.push({
                    editor: {
                        ...editor,
                        resource: editor.resource.toString()
                    }
                });
            }
            this.storageService.store(HistoryService_1.HISTORY_STORAGE_KEY, JSON.stringify(entries), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        //#endregion
        //#region Last Active Workspace/File
        getLastActiveWorkspaceRoot(schemeFilter, authorityFilter) {
            // No Folder: return early
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length === 0) {
                return undefined;
            }
            // Single Folder: return early
            if (folders.length === 1) {
                const resource = folders[0].uri;
                if ((!schemeFilter || resource.scheme === schemeFilter) && (!authorityFilter || resource.authority === authorityFilter)) {
                    return resource;
                }
                return undefined;
            }
            // Multiple folders: find the last active one
            for (const input of this.getHistory()) {
                if ((0, editor_1.isEditorInput)(input)) {
                    continue;
                }
                if (schemeFilter && input.resource.scheme !== schemeFilter) {
                    continue;
                }
                if (authorityFilter && input.resource.authority !== authorityFilter) {
                    continue;
                }
                const resourceWorkspace = this.contextService.getWorkspaceFolder(input.resource);
                if (resourceWorkspace) {
                    return resourceWorkspace.uri;
                }
            }
            // Fallback to first workspace matching scheme filter if any
            for (const folder of folders) {
                const resource = folder.uri;
                if ((!schemeFilter || resource.scheme === schemeFilter) && (!authorityFilter || resource.authority === authorityFilter)) {
                    return resource;
                }
            }
            return undefined;
        }
        getLastActiveFile(filterByScheme, filterByAuthority) {
            for (const input of this.getHistory()) {
                let resource;
                if ((0, editor_1.isEditorInput)(input)) {
                    resource = editor_1.EditorResourceAccessor.getOriginalUri(input, { filterByScheme });
                }
                else {
                    resource = input.resource;
                }
                if (resource && resource.scheme === filterByScheme && (!filterByAuthority || resource.authority === filterByAuthority)) {
                    return resource;
                }
            }
            return undefined;
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, stack] of this.editorGroupScopedNavigationStacks) {
                stack.disposable.dispose();
            }
            for (const [, editors] of this.editorScopedNavigationStacks) {
                for (const [, stack] of editors) {
                    stack.disposable.dispose();
                }
            }
            for (const [, listener] of this.editorHistoryListeners) {
                listener.dispose();
            }
        }
    };
    exports.HistoryService = HistoryService;
    exports.HistoryService = HistoryService = HistoryService_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, workspaces_1.IWorkspacesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, log_1.ILogService)
    ], HistoryService);
    (0, extensions_1.registerSingleton)(history_1.IHistoryService, HistoryService, 0 /* InstantiationType.Eager */);
    class EditorSelectionState {
        constructor(editorIdentifier, selection, reason) {
            this.editorIdentifier = editorIdentifier;
            this.selection = selection;
            this.reason = reason;
        }
        justifiesNewNavigationEntry(other) {
            if (this.editorIdentifier.groupId !== other.editorIdentifier.groupId) {
                return true; // different group
            }
            if (!this.editorIdentifier.editor.matches(other.editorIdentifier.editor)) {
                return true; // different editor
            }
            if (!this.selection || !other.selection) {
                return true; // unknown selections
            }
            const result = this.selection.compare(other.selection);
            if (result === 2 /* EditorPaneSelectionCompareResult.SIMILAR */ && (other.reason === 4 /* EditorPaneSelectionChangeReason.NAVIGATION */ || other.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */)) {
                // let navigation sources win even if the selection is `SIMILAR`
                // (e.g. "Go to definition" should add a history entry)
                return true;
            }
            return result === 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
    }
    let EditorNavigationStacks = class EditorNavigationStacks extends lifecycle_1.Disposable {
        constructor(scope, instantiationService) {
            super();
            this.scope = scope;
            this.instantiationService = instantiationService;
            this.selectionsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 0 /* GoFilter.NONE */, this.scope));
            this.editsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 1 /* GoFilter.EDITS */, this.scope));
            this.navigationsStack = this._register(this.instantiationService.createInstance(EditorNavigationStack, 2 /* GoFilter.NAVIGATION */, this.scope));
            this.stacks = [
                this.selectionsStack,
                this.editsStack,
                this.navigationsStack
            ];
            this.onDidChange = event_1.Event.any(this.selectionsStack.onDidChange, this.editsStack.onDidChange, this.navigationsStack.onDidChange);
        }
        canGoForward(filter) {
            return this.getStack(filter).canGoForward();
        }
        goForward(filter) {
            return this.getStack(filter).goForward();
        }
        canGoBack(filter) {
            return this.getStack(filter).canGoBack();
        }
        goBack(filter) {
            return this.getStack(filter).goBack();
        }
        goPrevious(filter) {
            return this.getStack(filter).goPrevious();
        }
        canGoLast(filter) {
            return this.getStack(filter).canGoLast();
        }
        goLast(filter) {
            return this.getStack(filter).goLast();
        }
        getStack(filter = 0 /* GoFilter.NONE */) {
            switch (filter) {
                case 0 /* GoFilter.NONE */: return this.selectionsStack;
                case 1 /* GoFilter.EDITS */: return this.editsStack;
                case 2 /* GoFilter.NAVIGATION */: return this.navigationsStack;
            }
        }
        handleActiveEditorChange(editorPane) {
            // Always send to selections navigation stack
            this.selectionsStack.notifyNavigation(editorPane);
        }
        handleActiveEditorSelectionChange(editorPane, event) {
            const previous = this.selectionsStack.current;
            // Always send to selections navigation stack
            this.selectionsStack.notifyNavigation(editorPane, event);
            // Check for edits
            if (event.reason === 3 /* EditorPaneSelectionChangeReason.EDIT */) {
                this.editsStack.notifyNavigation(editorPane, event);
            }
            // Check for navigations
            //
            // Note: ignore if selections navigation stack is navigating because
            // in that case we do not want to receive repeated entries in
            // the navigation stack.
            else if ((event.reason === 4 /* EditorPaneSelectionChangeReason.NAVIGATION */ || event.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */) &&
                !this.selectionsStack.isNavigating()) {
                // A "JUMP" navigation selection change always has a source and
                // target. As such, we add the previous entry of the selections
                // navigation stack so that our navigation stack receives both
                // entries unless the user is currently navigating.
                if (event.reason === 5 /* EditorPaneSelectionChangeReason.JUMP */ && !this.navigationsStack.isNavigating()) {
                    if (previous) {
                        this.navigationsStack.addOrReplace(previous.groupId, previous.editor, previous.selection);
                    }
                }
                this.navigationsStack.notifyNavigation(editorPane, event);
            }
        }
        clear() {
            for (const stack of this.stacks) {
                stack.clear();
            }
        }
        remove(arg1) {
            for (const stack of this.stacks) {
                stack.remove(arg1);
            }
        }
        move(event) {
            for (const stack of this.stacks) {
                stack.move(event);
            }
        }
    };
    EditorNavigationStacks = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], EditorNavigationStacks);
    class NoOpEditorNavigationStacks {
        constructor() {
            this.onDidChange = event_1.Event.None;
        }
        canGoForward() { return false; }
        async goForward() { }
        canGoBack() { return false; }
        async goBack() { }
        async goPrevious() { }
        canGoLast() { return false; }
        async goLast() { }
        handleActiveEditorChange() { }
        handleActiveEditorSelectionChange() { }
        clear() { }
        remove() { }
        move() { }
        dispose() { }
    }
    let EditorNavigationStack = class EditorNavigationStack extends lifecycle_1.Disposable {
        static { EditorNavigationStack_1 = this; }
        static { this.MAX_STACK_SIZE = 50; }
        get current() {
            return this.stack[this.index];
        }
        set current(entry) {
            if (entry) {
                this.stack[this.index] = entry;
            }
        }
        constructor(filter, scope, instantiationService, editorService, editorGroupService, logService) {
            super();
            this.filter = filter;
            this.scope = scope;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.logService = logService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.mapEditorToDisposable = new Map();
            this.mapGroupToDisposable = new Map();
            this.editorHelper = this.instantiationService.createInstance(EditorHelper);
            this.stack = [];
            this.index = -1;
            this.previousIndex = -1;
            this.navigating = false;
            this.currentSelectionState = undefined;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidChange(() => this.traceStack()));
            this._register(this.logService.onDidChangeLogLevel(() => this.traceStack()));
        }
        traceStack() {
            if (this.logService.getLevel() !== log_1.LogLevel.Trace) {
                return;
            }
            const entryLabels = [];
            for (const entry of this.stack) {
                if (typeof entry.selection?.log === 'function') {
                    entryLabels.push(`- group: ${entry.groupId}, editor: ${entry.editor.resource?.toString()}, selection: ${entry.selection.log()}`);
                }
                else {
                    entryLabels.push(`- group: ${entry.groupId}, editor: ${entry.editor.resource?.toString()}, selection: <none>`);
                }
            }
            if (entryLabels.length === 0) {
                this.trace(`index: ${this.index}, navigating: ${this.isNavigating()}: <empty>`);
            }
            else {
                this.trace(`index: ${this.index}, navigating: ${this.isNavigating()}
${entryLabels.join('\n')}
			`);
            }
        }
        trace(msg, editor = null, event) {
            if (this.logService.getLevel() !== log_1.LogLevel.Trace) {
                return;
            }
            let filterLabel;
            switch (this.filter) {
                case 0 /* GoFilter.NONE */:
                    filterLabel = 'global';
                    break;
                case 1 /* GoFilter.EDITS */:
                    filterLabel = 'edits';
                    break;
                case 2 /* GoFilter.NAVIGATION */:
                    filterLabel = 'navigation';
                    break;
            }
            let scopeLabel;
            switch (this.scope) {
                case 0 /* GoScope.DEFAULT */:
                    scopeLabel = 'default';
                    break;
                case 1 /* GoScope.EDITOR_GROUP */:
                    scopeLabel = 'editorGroup';
                    break;
                case 2 /* GoScope.EDITOR */:
                    scopeLabel = 'editor';
                    break;
            }
            if (editor !== null) {
                this.logService.trace(`[History stack ${filterLabel}-${scopeLabel}]: ${msg} (editor: ${editor?.resource?.toString()}, event: ${this.traceEvent(event)})`);
            }
            else {
                this.logService.trace(`[History stack ${filterLabel}-${scopeLabel}]: ${msg}`);
            }
        }
        traceEvent(event) {
            if (!event) {
                return '<none>';
            }
            switch (event.reason) {
                case 3 /* EditorPaneSelectionChangeReason.EDIT */: return 'edit';
                case 4 /* EditorPaneSelectionChangeReason.NAVIGATION */: return 'navigation';
                case 5 /* EditorPaneSelectionChangeReason.JUMP */: return 'jump';
                case 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */: return 'programmatic';
                case 2 /* EditorPaneSelectionChangeReason.USER */: return 'user';
            }
        }
        registerGroupListeners(groupId) {
            if (!this.mapGroupToDisposable.has(groupId)) {
                const group = this.editorGroupService.getGroup(groupId);
                if (group) {
                    this.mapGroupToDisposable.set(groupId, group.onWillMoveEditor(e => this.onWillMoveEditor(e)));
                }
            }
        }
        onWillMoveEditor(e) {
            this.trace('onWillMoveEditor()', e.editor);
            if (this.scope === 1 /* GoScope.EDITOR_GROUP */) {
                return; // ignore move events if our scope is group based
            }
            for (const entry of this.stack) {
                if (entry.groupId !== e.groupId) {
                    continue; // not in the group that reported the event
                }
                if (!this.editorHelper.matchesEditor(e.editor, entry.editor)) {
                    continue; // not the editor this event is about
                }
                // Update to target group
                entry.groupId = e.target;
            }
        }
        //#region Stack Mutation
        notifyNavigation(editorPane, event) {
            this.trace('notifyNavigation()', editorPane?.input, event);
            const isSelectionAwareEditorPane = (0, editor_1.isEditorPaneWithSelection)(editorPane);
            const hasValidEditor = editorPane?.input && !editorPane.input.isDisposed();
            // Treat editor changes that happen as part of stack navigation specially
            // we do not want to add a new stack entry as a matter of navigating the
            // stack but we need to keep our currentEditorSelectionState up to date
            // with the navigtion that occurs.
            if (this.navigating) {
                this.trace(`notifyNavigation() ignoring (navigating)`, editorPane?.input, event);
                if (isSelectionAwareEditorPane && hasValidEditor) {
                    this.trace('notifyNavigation() updating current selection state', editorPane?.input, event);
                    this.currentSelectionState = new EditorSelectionState({ groupId: editorPane.group.id, editor: editorPane.input }, editorPane.getSelection(), event?.reason);
                }
                else {
                    this.trace('notifyNavigation() dropping current selection state', editorPane?.input, event);
                    this.currentSelectionState = undefined; // we navigated to a non-selection aware or disposed editor
                }
            }
            // Normal navigation not part of stack navigation
            else {
                this.trace(`notifyNavigation() not ignoring`, editorPane?.input, event);
                // Navigation inside selection aware editor
                if (isSelectionAwareEditorPane && hasValidEditor) {
                    this.onSelectionAwareEditorNavigation(editorPane.group.id, editorPane.input, editorPane.getSelection(), event);
                }
                // Navigation to non-selection aware or disposed editor
                else {
                    this.currentSelectionState = undefined; // at this time we have no active selection aware editor
                    if (hasValidEditor) {
                        this.onNonSelectionAwareEditorNavigation(editorPane.group.id, editorPane.input);
                    }
                }
            }
        }
        onSelectionAwareEditorNavigation(groupId, editor, selection, event) {
            if (this.current?.groupId === groupId && !selection && this.editorHelper.matchesEditor(this.current.editor, editor)) {
                return; // do not push same editor input again of same group if we have no valid selection
            }
            this.trace('onSelectionAwareEditorNavigation()', editor, event);
            const stateCandidate = new EditorSelectionState({ groupId, editor }, selection, event?.reason);
            // Add to stack if we dont have a current state or this new state justifies a push
            if (!this.currentSelectionState || this.currentSelectionState.justifiesNewNavigationEntry(stateCandidate)) {
                this.doAdd(groupId, editor, stateCandidate.selection);
            }
            // Otherwise we replace the current stack entry with this one
            else {
                this.doReplace(groupId, editor, stateCandidate.selection);
            }
            // Update our current navigation editor state
            this.currentSelectionState = stateCandidate;
        }
        onNonSelectionAwareEditorNavigation(groupId, editor) {
            if (this.current?.groupId === groupId && this.editorHelper.matchesEditor(this.current.editor, editor)) {
                return; // do not push same editor input again of same group
            }
            this.trace('onNonSelectionAwareEditorNavigation()', editor);
            this.doAdd(groupId, editor);
        }
        doAdd(groupId, editor, selection) {
            if (!this.navigating) {
                this.addOrReplace(groupId, editor, selection);
            }
        }
        doReplace(groupId, editor, selection) {
            if (!this.navigating) {
                this.addOrReplace(groupId, editor, selection, true /* force replace */);
            }
        }
        addOrReplace(groupId, editorCandidate, selection, forceReplace) {
            // Ensure we listen to changes in group
            this.registerGroupListeners(groupId);
            // Check whether to replace an existing entry or not
            let replace = false;
            if (this.current) {
                if (forceReplace) {
                    replace = true; // replace if we are forced to
                }
                else if (this.shouldReplaceStackEntry(this.current, { groupId, editor: editorCandidate, selection })) {
                    replace = true; // replace if the group & input is the same and selection indicates as such
                }
            }
            const editor = this.editorHelper.preferResourceEditorInput(editorCandidate);
            if (!editor) {
                return;
            }
            if (replace) {
                this.trace('replace()', editor);
            }
            else {
                this.trace('add()', editor);
            }
            const newStackEntry = { groupId, editor, selection };
            // Replace at current position
            const removedEntries = [];
            if (replace) {
                if (this.current) {
                    removedEntries.push(this.current);
                }
                this.current = newStackEntry;
            }
            // Add to stack at current position
            else {
                // If we are not at the end of history, we remove anything after
                if (this.stack.length > this.index + 1) {
                    for (let i = this.index + 1; i < this.stack.length; i++) {
                        removedEntries.push(this.stack[i]);
                    }
                    this.stack = this.stack.slice(0, this.index + 1);
                }
                // Insert entry at index
                this.stack.splice(this.index + 1, 0, newStackEntry);
                // Check for limit
                if (this.stack.length > EditorNavigationStack_1.MAX_STACK_SIZE) {
                    removedEntries.push(this.stack.shift()); // remove first
                    if (this.previousIndex >= 0) {
                        this.previousIndex--;
                    }
                }
                else {
                    this.setIndex(this.index + 1, true /* skip event, we fire it later */);
                }
            }
            // Clear editor listeners from removed entries
            for (const removedEntry of removedEntries) {
                this.editorHelper.clearOnEditorDispose(removedEntry.editor, this.mapEditorToDisposable);
            }
            // Remove this from the stack unless the stack input is a resource
            // that can easily be restored even when the input gets disposed
            if ((0, editor_1.isEditorInput)(editor)) {
                this.editorHelper.onEditorDispose(editor, () => this.remove(editor), this.mapEditorToDisposable);
            }
            // Event
            this._onDidChange.fire();
        }
        shouldReplaceStackEntry(entry, candidate) {
            if (entry.groupId !== candidate.groupId) {
                return false; // different group
            }
            if (!this.editorHelper.matchesEditor(entry.editor, candidate.editor)) {
                return false; // different editor
            }
            if (!entry.selection) {
                return true; // always replace when we have no specific selection yet
            }
            if (!candidate.selection) {
                return false; // otherwise, prefer to keep existing specific selection over new unspecific one
            }
            // Finally, replace when selections are considered identical
            return entry.selection.compare(candidate.selection) === 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        move(event) {
            if (event.isOperation(2 /* FileOperation.MOVE */)) {
                for (const entry of this.stack) {
                    if (this.editorHelper.matchesEditor(event, entry.editor)) {
                        entry.editor = { resource: event.target.resource };
                    }
                }
            }
        }
        remove(arg1) {
            const previousStackSize = this.stack.length;
            // Remove all stack entries that match `arg1`
            this.stack = this.stack.filter(entry => {
                const matches = typeof arg1 === 'number' ? entry.groupId === arg1 : this.editorHelper.matchesEditor(arg1, entry.editor);
                // Cleanup any listeners associated with the input when removing
                if (matches) {
                    this.editorHelper.clearOnEditorDispose(entry.editor, this.mapEditorToDisposable);
                }
                return !matches;
            });
            if (previousStackSize === this.stack.length) {
                return; // nothing removed
            }
            // Given we just removed entries, we need to make sure
            // to remove entries that are now identical and next
            // to each other to prevent no-op navigations.
            this.flatten();
            // Reset indeces
            this.index = this.stack.length - 1;
            this.previousIndex = -1;
            // Clear group listener
            if (typeof arg1 === 'number') {
                this.mapGroupToDisposable.get(arg1)?.dispose();
                this.mapGroupToDisposable.delete(arg1);
            }
            // Event
            this._onDidChange.fire();
        }
        flatten() {
            const flattenedStack = [];
            let previousEntry = undefined;
            for (const entry of this.stack) {
                if (previousEntry && this.shouldReplaceStackEntry(entry, previousEntry)) {
                    continue; // skip over entry when it is considered the same
                }
                previousEntry = entry;
                flattenedStack.push(entry);
            }
            this.stack = flattenedStack;
        }
        clear() {
            this.index = -1;
            this.previousIndex = -1;
            this.stack.splice(0);
            for (const [, disposable] of this.mapEditorToDisposable) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.mapEditorToDisposable.clear();
            for (const [, disposable] of this.mapGroupToDisposable) {
                (0, lifecycle_1.dispose)(disposable);
            }
            this.mapGroupToDisposable.clear();
        }
        dispose() {
            super.dispose();
            this.clear();
        }
        //#endregion
        //#region Navigation
        canGoForward() {
            return this.stack.length > this.index + 1;
        }
        async goForward() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            if (!this.canGoForward()) {
                return;
            }
            this.setIndex(this.index + 1);
            return this.navigate();
        }
        canGoBack() {
            return this.index > 0;
        }
        async goBack() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            if (!this.canGoBack()) {
                return;
            }
            this.setIndex(this.index - 1);
            return this.navigate();
        }
        async goPrevious() {
            const navigated = await this.maybeGoCurrent();
            if (navigated) {
                return;
            }
            // If we never navigated, just go back
            if (this.previousIndex === -1) {
                return this.goBack();
            }
            // Otherwise jump to previous stack entry
            this.setIndex(this.previousIndex);
            return this.navigate();
        }
        canGoLast() {
            return this.stack.length > 0;
        }
        async goLast() {
            if (!this.canGoLast()) {
                return;
            }
            this.setIndex(this.stack.length - 1);
            return this.navigate();
        }
        async maybeGoCurrent() {
            // When this navigation stack works with a specific
            // filter where not every selection change is added
            // to the stack, we want to first reveal the current
            // selection before attempting to navigate in the
            // stack.
            if (this.filter === 0 /* GoFilter.NONE */) {
                return false; // only applies when  we are a filterd stack
            }
            if (this.isCurrentSelectionActive()) {
                return false; // we are at the current navigation stop
            }
            // Go to current selection
            await this.navigate();
            return true;
        }
        isCurrentSelectionActive() {
            if (!this.current?.selection) {
                return false; // we need a current selection
            }
            const pane = this.editorService.activeEditorPane;
            if (!(0, editor_1.isEditorPaneWithSelection)(pane)) {
                return false; // we need an active editor pane with selection support
            }
            if (pane.group.id !== this.current.groupId) {
                return false; // we need matching groups
            }
            if (!pane.input || !this.editorHelper.matchesEditor(pane.input, this.current.editor)) {
                return false; // we need matching editors
            }
            const paneSelection = pane.getSelection();
            if (!paneSelection) {
                return false; // we need a selection to compare with
            }
            return paneSelection.compare(this.current.selection) === 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        setIndex(newIndex, skipEvent) {
            this.previousIndex = this.index;
            this.index = newIndex;
            // Event
            if (!skipEvent) {
                this._onDidChange.fire();
            }
        }
        async navigate() {
            this.navigating = true;
            try {
                if (this.current) {
                    await this.doNavigate(this.current);
                }
            }
            finally {
                this.navigating = false;
            }
        }
        doNavigate(location) {
            let options = Object.create(null);
            // Apply selection if any
            if (location.selection) {
                options = location.selection.restore(options);
            }
            if ((0, editor_1.isEditorInput)(location.editor)) {
                return this.editorService.openEditor(location.editor, options, location.groupId);
            }
            return this.editorService.openEditor({
                ...location.editor,
                options: {
                    ...location.editor.options,
                    ...options
                }
            }, location.groupId);
        }
        isNavigating() {
            return this.navigating;
        }
    };
    exports.EditorNavigationStack = EditorNavigationStack;
    exports.EditorNavigationStack = EditorNavigationStack = EditorNavigationStack_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, log_1.ILogService)
    ], EditorNavigationStack);
    let EditorHelper = class EditorHelper {
        constructor(uriIdentityService, lifecycleService, fileService, pathService) {
            this.uriIdentityService = uriIdentityService;
            this.lifecycleService = lifecycleService;
            this.fileService = fileService;
            this.pathService = pathService;
        }
        preferResourceEditorInput(editor) {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor);
            // For now, only prefer well known schemes that we control to prevent
            // issues such as https://github.com/microsoft/vscode/issues/85204
            // from being used as resource inputs
            // resource inputs survive editor disposal and as such are a lot more
            // durable across editor changes and restarts
            const hasValidResourceEditorInputScheme = resource?.scheme === network_1.Schemas.file ||
                resource?.scheme === network_1.Schemas.vscodeRemote ||
                resource?.scheme === network_1.Schemas.vscodeUserData ||
                resource?.scheme === this.pathService.defaultUriScheme;
            // Scheme is valid: prefer the untyped input
            // over the typed input if possible to keep
            // the entry across restarts
            if (hasValidResourceEditorInputScheme) {
                if ((0, editor_1.isEditorInput)(editor)) {
                    const untypedInput = editor.toUntyped();
                    if ((0, editor_1.isResourceEditorInput)(untypedInput)) {
                        return untypedInput;
                    }
                }
                return editor;
            }
            // Scheme is invalid: allow the editor input
            // for as long as it is not disposed
            else {
                return (0, editor_1.isEditorInput)(editor) ? editor : undefined;
            }
        }
        matchesEditor(arg1, inputB) {
            if (arg1 instanceof files_1.FileChangesEvent || arg1 instanceof files_1.FileOperationEvent) {
                if ((0, editor_1.isEditorInput)(inputB)) {
                    return false; // we only support this for `IResourceEditorInputs` that are file based
                }
                if (arg1 instanceof files_1.FileChangesEvent) {
                    return arg1.contains(inputB.resource, 2 /* FileChangeType.DELETED */);
                }
                return this.matchesFile(inputB.resource, arg1);
            }
            if ((0, editor_1.isEditorInput)(arg1)) {
                if ((0, editor_1.isEditorInput)(inputB)) {
                    return arg1.matches(inputB);
                }
                return this.matchesFile(inputB.resource, arg1);
            }
            if ((0, editor_1.isEditorInput)(inputB)) {
                return this.matchesFile(arg1.resource, inputB);
            }
            return arg1 && inputB && this.uriIdentityService.extUri.isEqual(arg1.resource, inputB.resource);
        }
        matchesFile(resource, arg2) {
            if (arg2 instanceof files_1.FileChangesEvent) {
                return arg2.contains(resource, 2 /* FileChangeType.DELETED */);
            }
            if (arg2 instanceof files_1.FileOperationEvent) {
                return this.uriIdentityService.extUri.isEqualOrParent(resource, arg2.resource);
            }
            if ((0, editor_1.isEditorInput)(arg2)) {
                const inputResource = arg2.resource;
                if (!inputResource) {
                    return false;
                }
                if (this.lifecycleService.phase >= 3 /* LifecyclePhase.Restored */ && !this.fileService.hasProvider(inputResource)) {
                    return false; // make sure to only check this when workbench has restored (for https://github.com/microsoft/vscode/issues/48275)
                }
                return this.uriIdentityService.extUri.isEqual(inputResource, resource);
            }
            return this.uriIdentityService.extUri.isEqual(arg2?.resource, resource);
        }
        matchesEditorIdentifier(identifier, editorPane) {
            if (!editorPane?.group) {
                return false;
            }
            if (identifier.groupId !== editorPane.group.id) {
                return false;
            }
            return editorPane.input ? identifier.editor.matches(editorPane.input) : false;
        }
        onEditorDispose(editor, listener, mapEditorToDispose) {
            const toDispose = event_1.Event.once(editor.onWillDispose)(() => listener());
            let disposables = mapEditorToDispose.get(editor);
            if (!disposables) {
                disposables = new lifecycle_1.DisposableStore();
                mapEditorToDispose.set(editor, disposables);
            }
            disposables.add(toDispose);
        }
        clearOnEditorDispose(editor, mapEditorToDispose) {
            if (!(0, editor_1.isEditorInput)(editor)) {
                return; // only supported when passing in an actual editor input
            }
            const disposables = mapEditorToDispose.get(editor);
            if (disposables) {
                (0, lifecycle_1.dispose)(disposables);
                mapEditorToDispose.delete(editor);
            }
        }
    };
    EditorHelper = __decorate([
        __param(0, uriIdentity_1.IUriIdentityService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, files_1.IFileService),
        __param(3, pathService_1.IPathService)
    ], EditorHelper);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9oaXN0b3J5L2Jyb3dzZXIvaGlzdG9yeVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWlEekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVOztpQkFJckIsNkJBQXdCLEdBQUcsNkNBQTZDLEFBQWhELENBQWlEO2lCQUN6RSw2QkFBd0IsR0FBRyxrQ0FBa0MsQUFBckMsQ0FBc0M7UUFPdEYsWUFDaUIsYUFBaUQsRUFDM0Msa0JBQXlELEVBQ3JELGNBQXlELEVBQ2xFLGNBQWdELEVBQzFDLG9CQUE0RCxFQUNyRSxXQUEwQyxFQUNwQyxpQkFBc0QsRUFDbkQsb0JBQTRELEVBQzFELGFBQXVELEVBQzVELGlCQUFzRCxFQUM3RCxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQVp5QixrQkFBYSxHQUFiLGFBQWEsQ0FBbUI7WUFDMUIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDakQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtZQUMzQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzVDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFoQnJDLDBCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENB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