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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/parts/editor/editorsObserver", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/base/common/extpath", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorGroupFinder", "vs/workbench/services/textfile/common/textEditorService", "vs/platform/instantiation/common/descriptors"], function (require, exports, instantiation_1, editor_1, editorInput_1, sideBySideEditorInput_1, map_1, files_1, event_1, uri_1, resources_1, diffEditorInput_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, arrays_1, editorBrowser_1, extensions_1, types_1, editorsObserver_1, async_1, workspace_1, extpath_1, uriIdentity_1, editorResolverService_1, workspaceTrust_1, host_1, editorGroupFinder_1, textEditorService_1, descriptors_1) {
    "use strict";
    var EditorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorService = void 0;
    let EditorService = EditorService_1 = class EditorService extends lifecycle_1.Disposable {
        constructor(editorGroupsContainer, editorGroupService, instantiationService, fileService, configurationService, contextService, uriIdentityService, editorResolverService, workspaceTrustRequestService, hostService, textEditorService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this.editorResolverService = editorResolverService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.hostService = hostService;
            this.textEditorService = textEditorService;
            //#region events
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidVisibleEditorsChange = this._register(new event_1.Emitter());
            this.onDidVisibleEditorsChange = this._onDidVisibleEditorsChange.event;
            this._onDidEditorsChange = this._register(new event_1.Emitter());
            this.onDidEditorsChange = this._onDidEditorsChange.event;
            this._onWillOpenEditor = this._register(new event_1.Emitter());
            this.onWillOpenEditor = this._onWillOpenEditor.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            //#region Editor & group event handlers
            this.lastActiveEditor = undefined;
            //#endregion
            //#region Visible Editors Change: Install file watchers for out of workspace resources that became visible
            this.activeOutOfWorkspaceWatchers = new map_1.ResourceMap();
            this.closeOnFileDelete = false;
            this.editorGroupsContainer = editorGroupsContainer ?? editorGroupService;
            this.editorsObserver = this._register(this.instantiationService.createInstance(editorsObserver_1.EditorsObserver, this.editorGroupsContainer));
            this.onConfigurationUpdated();
            this.registerListeners();
        }
        createScoped(editorGroupsContainer, disposables) {
            return disposables.add(new EditorService_1(editorGroupsContainer === 'main' ? this.editorGroupService.mainPart : editorGroupsContainer, this.editorGroupService, this.instantiationService, this.fileService, this.configurationService, this.contextService, this.uriIdentityService, this.editorResolverService, this.workspaceTrustRequestService, this.hostService, this.textEditorService));
        }
        registerListeners() {
            // Editor & group changes
            if (this.editorGroupsContainer === this.editorGroupService.mainPart || this.editorGroupsContainer === this.editorGroupService) {
                this.editorGroupService.whenReady.then(() => this.onEditorGroupsReady());
            }
            else {
                this.onEditorGroupsReady();
            }
            this._register(this.editorGroupsContainer.onDidChangeActiveGroup(group => this.handleActiveEditorChange(group)));
            this._register(this.editorGroupsContainer.onDidAddGroup(group => this.registerGroupListeners(group)));
            this._register(this.editorsObserver.onDidMostRecentlyActiveEditorsChange(() => this._onDidMostRecentlyActiveEditorsChange.fire()));
            // Out of workspace file watchers
            this._register(this.onDidVisibleEditorsChange(() => this.handleVisibleEditorsChange()));
            // File changes & operations
            // Note: there is some duplication with the two file event handlers- Since we cannot always rely on the disk events
            // carrying all necessary data in all environments, we also use the file operation events to make sure operations are handled.
            // In any case there is no guarantee if the local event is fired first or the disk one. Thus, code must handle the case
            // that the event ordering is random as well as might not carry all information needed.
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Configuration
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onEditorGroupsReady() {
            // Register listeners to each opened group
            for (const group of this.editorGroupsContainer.groups) {
                this.registerGroupListeners(group);
            }
            // Fire initial set of editor events if there is an active editor
            if (this.activeEditor) {
                this.doHandleActiveEditorChangeEvent();
                this._onDidVisibleEditorsChange.fire();
            }
        }
        handleActiveEditorChange(group) {
            if (group !== this.editorGroupsContainer.activeGroup) {
                return; // ignore if not the active group
            }
            if (!this.lastActiveEditor && !group.activeEditor) {
                return; // ignore if we still have no active editor
            }
            this.doHandleActiveEditorChangeEvent();
        }
        doHandleActiveEditorChangeEvent() {
            // Remember as last active
            const activeGroup = this.editorGroupsContainer.activeGroup;
            this.lastActiveEditor = activeGroup.activeEditor ?? undefined;
            // Fire event to outside parties
            this._onDidActiveEditorChange.fire();
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidModelChange(e => {
                this._onDidEditorsChange.fire({ groupId: group.id, event: e });
            }));
            groupDisposables.add(group.onDidActiveEditorChange(() => {
                this.handleActiveEditorChange(group);
                this._onDidVisibleEditorsChange.fire();
            }));
            groupDisposables.add(group.onWillOpenEditor(e => {
                this._onWillOpenEditor.fire(e);
            }));
            groupDisposables.add(group.onDidCloseEditor(e => {
                this._onDidCloseEditor.fire(e);
            }));
            groupDisposables.add(group.onDidOpenEditorFail(editor => {
                this._onDidOpenEditorFail.fire({ editor, groupId: group.id });
            }));
            event_1.Event.once(group.onWillDispose)(() => {
                (0, lifecycle_1.dispose)(groupDisposables);
            });
        }
        handleVisibleEditorsChange() {
            const visibleOutOfWorkspaceResources = new map_1.ResourceSet();
            for (const editor of this.visibleEditors) {
                const resources = (0, arrays_1.distinct)((0, arrays_1.coalesce)([
                    editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }),
                    editor_1.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY })
                ]), resource => resource.toString());
                for (const resource of resources) {
                    if (this.fileService.hasProvider(resource) && !this.contextService.isInsideWorkspace(resource)) {
                        visibleOutOfWorkspaceResources.add(resource);
                    }
                }
            }
            // Handle no longer visible out of workspace resources
            for (const resource of this.activeOutOfWorkspaceWatchers.keys()) {
                if (!visibleOutOfWorkspaceResources.has(resource)) {
                    (0, lifecycle_1.dispose)(this.activeOutOfWorkspaceWatchers.get(resource));
                    this.activeOutOfWorkspaceWatchers.delete(resource);
                }
            }
            // Handle newly visible out of workspace resources
            for (const resource of visibleOutOfWorkspaceResources.keys()) {
                if (!this.activeOutOfWorkspaceWatchers.get(resource)) {
                    const disposable = this.fileService.watch(resource);
                    this.activeOutOfWorkspaceWatchers.set(resource, disposable);
                }
            }
        }
        //#endregion
        //#region File Changes: Move & Deletes to move or close opend editors
        async onDidRunFileOperation(e) {
            // Handle moves specially when file is opened
            if (e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleMovedFile(e.resource, e.target.resource);
            }
            // Handle deletes
            if (e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleDeletedFile(e.resource, false, e.target ? e.target.resource : undefined);
            }
        }
        onDidFilesChange(e) {
            if (e.gotDeleted()) {
                this.handleDeletedFile(e, true);
            }
        }
        async handleMovedFile(source, target) {
            for (const group of this.editorGroupsContainer.groups) {
                const replacements = [];
                for (const editor of group.editors) {
                    const resource = editor.resource;
                    if (!resource || !this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                        continue; // not matching our resource
                    }
                    // Determine new resulting target resource
                    let targetResource;
                    if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                        targetResource = target; // file got moved
                    }
                    else {
                        const index = (0, extpath_1.indexOfPath)(resource.path, source.path, this.uriIdentityService.extUri.ignorePathCasing(resource));
                        targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                    }
                    // Delegate rename() to editor instance
                    const moveResult = await editor.rename(group.id, targetResource);
                    if (!moveResult) {
                        return; // not target - ignore
                    }
                    const optionOverrides = {
                        preserveFocus: true,
                        pinned: group.isPinned(editor),
                        sticky: group.isSticky(editor),
                        index: group.getIndexOfEditor(editor),
                        inactive: !group.isActive(editor)
                    };
                    // Construct a replacement with our extra options mixed in
                    if ((0, editor_1.isEditorInput)(moveResult.editor)) {
                        replacements.push({
                            editor,
                            replacement: moveResult.editor,
                            options: {
                                ...moveResult.options,
                                ...optionOverrides
                            }
                        });
                    }
                    else {
                        replacements.push({
                            editor,
                            replacement: {
                                ...moveResult.editor,
                                options: {
                                    ...moveResult.editor.options,
                                    ...optionOverrides
                                }
                            }
                        });
                    }
                }
                // Apply replacements
                if (replacements.length) {
                    this.replaceEditors(replacements, group);
                }
            }
        }
        onConfigurationUpdated(e) {
            if (e && !e.affectsConfiguration('workbench.editor.closeOnFileDelete')) {
                return;
            }
            const configuration = this.configurationService.getValue();
            if (typeof configuration.workbench?.editor?.closeOnFileDelete === 'boolean') {
                this.closeOnFileDelete = configuration.workbench.editor.closeOnFileDelete;
            }
            else {
                this.closeOnFileDelete = false; // default
            }
        }
        handleDeletedFile(arg1, isExternal, movedTo) {
            for (const editor of this.getAllNonDirtyEditors({ includeUntitled: false, supportSideBySide: true })) {
                (async () => {
                    const resource = editor.resource;
                    if (!resource) {
                        return;
                    }
                    // Handle deletes in opened editors depending on:
                    // - we close any editor when `closeOnFileDelete: true`
                    // - we close any editor when the delete occurred from within VSCode
                    if (this.closeOnFileDelete || !isExternal) {
                        // Do NOT close any opened editor that matches the resource path (either equal or being parent) of the
                        // resource we move to (movedTo). Otherwise we would close a resource that has been renamed to the same
                        // path but different casing.
                        if (movedTo && this.uriIdentityService.extUri.isEqualOrParent(resource, movedTo)) {
                            return;
                        }
                        let matches = false;
                        if (arg1 instanceof files_1.FileChangesEvent) {
                            matches = arg1.contains(resource, 2 /* FileChangeType.DELETED */);
                        }
                        else {
                            matches = this.uriIdentityService.extUri.isEqualOrParent(resource, arg1);
                        }
                        if (!matches) {
                            return;
                        }
                        // We have received reports of users seeing delete events even though the file still
                        // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                        // Since we do not want to close an editor without reason, we have to check if the
                        // file is really gone and not just a faulty file event.
                        // This only applies to external file events, so we need to check for the isExternal
                        // flag.
                        let exists = false;
                        if (isExternal && this.fileService.hasProvider(resource)) {
                            await (0, async_1.timeout)(100);
                            exists = await this.fileService.exists(resource);
                        }
                        if (!exists && !editor.isDisposed()) {
                            editor.dispose();
                        }
                    }
                })();
            }
        }
        getAllNonDirtyEditors(options) {
            const editors = [];
            function conditionallyAddEditor(editor) {
                if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && !options.includeUntitled) {
                    return;
                }
                if (editor.isDirty()) {
                    return;
                }
                editors.push(editor);
            }
            for (const editor of this.editors) {
                if (options.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    conditionallyAddEditor(editor.primary);
                    conditionallyAddEditor(editor.secondary);
                }
                else {
                    conditionallyAddEditor(editor);
                }
            }
            return editors;
        }
        get activeEditorPane() {
            return this.editorGroupsContainer.activeGroup?.activeEditorPane;
        }
        get activeTextEditorControl() {
            const activeEditorPane = this.activeEditorPane;
            if (activeEditorPane) {
                const activeControl = activeEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(activeControl) || (0, editorBrowser_1.isDiffEditor)(activeControl)) {
                    return activeControl;
                }
                if ((0, editorBrowser_1.isCompositeEditor)(activeControl) && (0, editorBrowser_1.isCodeEditor)(activeControl.activeCodeEditor)) {
                    return activeControl.activeCodeEditor;
                }
            }
            return undefined;
        }
        get activeTextEditorLanguageId() {
            let activeCodeEditor = undefined;
            const activeTextEditorControl = this.activeTextEditorControl;
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                activeCodeEditor = activeTextEditorControl.getModifiedEditor();
            }
            else {
                activeCodeEditor = activeTextEditorControl;
            }
            return activeCodeEditor?.getModel()?.getLanguageId();
        }
        get count() {
            return this.editorsObserver.count;
        }
        get editors() {
            return this.getEditors(1 /* EditorsOrder.SEQUENTIAL */).map(({ editor }) => editor);
        }
        getEditors(order, options) {
            switch (order) {
                // MRU
                case 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */:
                    if (options?.excludeSticky) {
                        return this.editorsObserver.editors.filter(({ groupId, editor }) => !this.editorGroupsContainer.getGroup(groupId)?.isSticky(editor));
                    }
                    return this.editorsObserver.editors;
                // Sequential
                case 1 /* EditorsOrder.SEQUENTIAL */: {
                    const editors = [];
                    for (const group of this.editorGroupsContainer.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                        editors.push(...group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, options).map(editor => ({ editor, groupId: group.id })));
                    }
                    return editors;
                }
            }
        }
        get activeEditor() {
            const activeGroup = this.editorGroupsContainer.activeGroup;
            return activeGroup ? activeGroup.activeEditor ?? undefined : undefined;
        }
        get visibleEditorPanes() {
            return (0, arrays_1.coalesce)(this.editorGroupsContainer.groups.map(group => group.activeEditorPane));
        }
        get visibleTextEditorControls() {
            const visibleTextEditorControls = [];
            for (const visibleEditorPane of this.visibleEditorPanes) {
                const control = visibleEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(control) || (0, editorBrowser_1.isDiffEditor)(control)) {
                    visibleTextEditorControls.push(control);
                }
            }
            return visibleTextEditorControls;
        }
        get visibleEditors() {
            return (0, arrays_1.coalesce)(this.editorGroupsContainer.groups.map(group => group.activeEditor));
        }
        async openEditor(editor, optionsOrPreferredGroup, preferredGroup) {
            let typedEditor = undefined;
            let options = (0, editor_1.isEditorInput)(editor) ? optionsOrPreferredGroup : editor.options;
            let group = undefined;
            if ((0, editorService_1.isPreferredGroup)(optionsOrPreferredGroup)) {
                preferredGroup = optionsOrPreferredGroup;
            }
            // Resolve override unless disabled
            if (!(0, editor_1.isEditorInput)(editor)) {
                const resolvedEditor = await this.editorResolverService.resolveEditor(editor, preferredGroup);
                if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                    return; // skip editor if override is aborted
                }
                // We resolved an editor to use
                if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    typedEditor = resolvedEditor.editor;
                    options = resolvedEditor.options;
                    group = resolvedEditor.group;
                }
            }
            // Override is disabled or did not apply: fallback to default
            if (!typedEditor) {
                typedEditor = (0, editor_1.isEditorInput)(editor) ? editor : await this.textEditorService.resolveTextEditor(editor);
            }
            // If group still isn't defined because of a disabled override we resolve it
            if (!group) {
                let activation = undefined;
                const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, { editor: typedEditor, options }, preferredGroup);
                if (findGroupResult instanceof Promise) {
                    ([group, activation] = await findGroupResult);
                }
                else {
                    ([group, activation] = findGroupResult);
                }
                // Mixin editor group activation if returned
                if (activation) {
                    options = { ...options, activation };
                }
            }
            return group.openEditor(typedEditor, options);
        }
        async openEditors(editors, preferredGroup, options) {
            // Pass all editors to trust service to determine if
            // we should proceed with opening the editors if we
            // are asked to validate trust.
            if (options?.validateTrust) {
                const editorsTrusted = await this.handleWorkspaceTrust(editors);
                if (!editorsTrusted) {
                    return [];
                }
            }
            // Find target groups for editors to open
            const mapGroupToTypedEditors = new Map();
            for (const editor of editors) {
                let typedEditor = undefined;
                let group = undefined;
                // Resolve override unless disabled
                if (!(0, editor_1.isEditorInputWithOptions)(editor)) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor(editor, preferredGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedEditor = resolvedEditor;
                        group = resolvedEditor.group;
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedEditor) {
                    typedEditor = (0, editor_1.isEditorInputWithOptions)(editor) ? editor : { editor: await this.textEditorService.resolveTextEditor(editor), options: editor.options };
                }
                // If group still isn't defined because of a disabled override we resolve it
                if (!group) {
                    const findGroupResult = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, typedEditor, preferredGroup);
                    if (findGroupResult instanceof Promise) {
                        ([group] = await findGroupResult);
                    }
                    else {
                        ([group] = findGroupResult);
                    }
                }
                // Update map of groups to editors
                let targetGroupEditors = mapGroupToTypedEditors.get(group);
                if (!targetGroupEditors) {
                    targetGroupEditors = [];
                    mapGroupToTypedEditors.set(group, targetGroupEditors);
                }
                targetGroupEditors.push(typedEditor);
            }
            // Open in target groups
            const result = [];
            for (const [group, editors] of mapGroupToTypedEditors) {
                result.push(group.openEditors(editors));
            }
            return (0, arrays_1.coalesce)(await async_1.Promises.settled(result));
        }
        async handleWorkspaceTrust(editors) {
            const { resources, diffMode, mergeMode } = this.extractEditorResources(editors);
            const trustResult = await this.workspaceTrustRequestService.requestOpenFilesTrust(resources);
            switch (trustResult) {
                case 1 /* WorkspaceTrustUriResponse.Open */:
                    return true;
                case 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */:
                    await this.hostService.openWindow(resources.map(resource => ({ fileUri: resource })), { forceNewWindow: true, diffMode, mergeMode });
                    return false;
                case 3 /* WorkspaceTrustUriResponse.Cancel */:
                    return false;
            }
        }
        extractEditorResources(editors) {
            const resources = new map_1.ResourceSet();
            let diffMode = false;
            let mergeMode = false;
            for (const editor of editors) {
                // Typed Editor
                if ((0, editor_1.isEditorInputWithOptions)(editor)) {
                    const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor.editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
                    if (uri_1.URI.isUri(resource)) {
                        resources.add(resource);
                    }
                    else if (resource) {
                        if (resource.primary) {
                            resources.add(resource.primary);
                        }
                        if (resource.secondary) {
                            resources.add(resource.secondary);
                        }
                        diffMode = editor.editor instanceof diffEditorInput_1.DiffEditorInput;
                    }
                }
                // Untyped editor
                else {
                    if ((0, editor_1.isResourceMergeEditorInput)(editor)) {
                        if (uri_1.URI.isUri(editor.input1)) {
                            resources.add(editor.input1.resource);
                        }
                        if (uri_1.URI.isUri(editor.input2)) {
                            resources.add(editor.input2.resource);
                        }
                        if (uri_1.URI.isUri(editor.base)) {
                            resources.add(editor.base.resource);
                        }
                        if (uri_1.URI.isUri(editor.result)) {
                            resources.add(editor.result.resource);
                        }
                        mergeMode = true;
                    }
                    if ((0, editor_1.isResourceDiffEditorInput)(editor)) {
                        if (uri_1.URI.isUri(editor.original.resource)) {
                            resources.add(editor.original.resource);
                        }
                        if (uri_1.URI.isUri(editor.modified.resource)) {
                            resources.add(editor.modified.resource);
                        }
                        diffMode = true;
                    }
                    else if ((0, editor_1.isResourceEditorInput)(editor)) {
                        resources.add(editor.resource);
                    }
                }
            }
            return {
                resources: Array.from(resources.keys()),
                diffMode,
                mergeMode
            };
        }
        //#endregion
        //#region isOpened() / isVisible()
        isOpened(editor) {
            return this.editorsObserver.hasEditor({
                resource: this.uriIdentityService.asCanonicalUri(editor.resource),
                typeId: editor.typeId,
                editorId: editor.editorId
            });
        }
        isVisible(editor) {
            for (const group of this.editorGroupsContainer.groups) {
                if (group.activeEditor?.matches(editor)) {
                    return true;
                }
            }
            return false;
        }
        //#endregion
        //#region closeEditor()
        async closeEditor({ editor, groupId }, options) {
            const group = this.editorGroupsContainer.getGroup(groupId);
            await group?.closeEditor(editor, options);
        }
        //#endregion
        //#region closeEditors()
        async closeEditors(editors, options) {
            const mapGroupToEditors = new Map();
            for (const { editor, groupId } of editors) {
                const group = this.editorGroupsContainer.getGroup(groupId);
                if (!group) {
                    continue;
                }
                let editors = mapGroupToEditors.get(group);
                if (!editors) {
                    editors = [];
                    mapGroupToEditors.set(group, editors);
                }
                editors.push(editor);
            }
            for (const [group, editors] of mapGroupToEditors) {
                await group.closeEditors(editors, options);
            }
        }
        findEditors(arg1, options, arg2) {
            const resource = uri_1.URI.isUri(arg1) ? arg1 : arg1.resource;
            const typeId = uri_1.URI.isUri(arg1) ? undefined : arg1.typeId;
            // Do a quick check for the resource via the editor observer
            // which is a very efficient way to find an editor by resource.
            // However, we can only do that unless we are asked to find an
            // editor on the secondary side of a side by side editor, because
            // the editor observer provides fast lookups only for primary
            // editors.
            if (options?.supportSideBySide !== editor_1.SideBySideEditor.ANY && options?.supportSideBySide !== editor_1.SideBySideEditor.SECONDARY) {
                if (!this.editorsObserver.hasEditors(resource)) {
                    if (uri_1.URI.isUri(arg1) || (0, types_1.isUndefined)(arg2)) {
                        return [];
                    }
                    return undefined;
                }
            }
            // Search only in specific group
            if (!(0, types_1.isUndefined)(arg2)) {
                const targetGroup = typeof arg2 === 'number' ? this.editorGroupsContainer.getGroup(arg2) : arg2;
                // Resource provided: result is an array
                if (uri_1.URI.isUri(arg1)) {
                    if (!targetGroup) {
                        return [];
                    }
                    return targetGroup.findEditors(resource, options);
                }
                // Editor identifier provided, result is single
                else {
                    if (!targetGroup) {
                        return undefined;
                    }
                    const editors = targetGroup.findEditors(resource, options);
                    for (const editor of editors) {
                        if (editor.typeId === typeId) {
                            return editor;
                        }
                    }
                    return undefined;
                }
            }
            // Search across all groups in MRU order
            else {
                const result = [];
                for (const group of this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const editors = [];
                    // Resource provided: result is an array
                    if (uri_1.URI.isUri(arg1)) {
                        editors.push(...this.findEditors(arg1, options, group));
                    }
                    // Editor identifier provided, result is single
                    else {
                        const editor = this.findEditors(arg1, options, group);
                        if (editor) {
                            editors.push(editor);
                        }
                    }
                    result.push(...editors.map(editor => ({ editor, groupId: group.id })));
                }
                return result;
            }
        }
        async replaceEditors(replacements, group) {
            const targetGroup = typeof group === 'number' ? this.editorGroupsContainer.getGroup(group) : group;
            // Convert all replacements to typed editors unless already
            // typed and handle overrides properly.
            const typedReplacements = [];
            for (const replacement of replacements) {
                let typedReplacement = undefined;
                // Resolve override unless disabled
                if (!(0, editor_1.isEditorInput)(replacement.replacement)) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor(replacement.replacement, targetGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedReplacement = {
                            editor: replacement.editor,
                            replacement: resolvedEditor.editor,
                            options: resolvedEditor.options,
                            forceReplaceDirty: replacement.forceReplaceDirty
                        };
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedReplacement) {
                    typedReplacement = {
                        editor: replacement.editor,
                        replacement: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.replacement : await this.textEditorService.resolveTextEditor(replacement.replacement),
                        options: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.options : replacement.replacement.options,
                        forceReplaceDirty: replacement.forceReplaceDirty
                    };
                }
                typedReplacements.push(typedReplacement);
            }
            return targetGroup?.replaceEditors(typedReplacements);
        }
        //#endregion
        //#region save/revert
        async save(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not save the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            // Split editors up into a bucket that is saved in parallel
            // and sequentially. Unless "Save As", all non-untitled editors
            // can be saved in parallel to speed up the operation. Remaining
            // editors are potentially bringing up some UI and thus run
            // sequentially.
            const editorsToSaveParallel = [];
            const editorsToSaveSequentially = [];
            if (options?.saveAs) {
                editorsToSaveSequentially.push(...uniqueEditors);
            }
            else {
                for (const { groupId, editor } of uniqueEditors) {
                    if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        editorsToSaveSequentially.push({ groupId, editor });
                    }
                    else {
                        editorsToSaveParallel.push({ groupId, editor });
                    }
                }
            }
            // Editors to save in parallel
            const saveResults = await async_1.Promises.settled(editorsToSaveParallel.map(({ groupId, editor }) => {
                // Use save as a hint to pin the editor if used explicitly
                if (options?.reason === 1 /* SaveReason.EXPLICIT */) {
                    this.editorGroupsContainer.getGroup(groupId)?.pinEditor(editor);
                }
                // Save
                return editor.save(groupId, options);
            }));
            // Editors to save sequentially
            for (const { groupId, editor } of editorsToSaveSequentially) {
                if (editor.isDisposed()) {
                    continue; // might have been disposed from the save already
                }
                // Preserve view state by opening the editor first if the editor
                // is untitled or we "Save As". This also allows the user to review
                // the contents of the editor before making a decision.
                const editorPane = await this.openEditor(editor, groupId);
                const editorOptions = {
                    pinned: true,
                    viewState: editorPane?.getViewState()
                };
                const result = options?.saveAs ? await editor.saveAs(groupId, options) : await editor.save(groupId, options);
                saveResults.push(result);
                if (!result) {
                    break; // failed or cancelled, abort
                }
                // Replace editor preserving viewstate (either across all groups or
                // only selected group) if the resulting editor is different from the
                // current one.
                if (!editor.matches(result)) {
                    const targetGroups = editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? this.editorGroupsContainer.groups.map(group => group.id) /* untitled replaces across all groups */ : [groupId];
                    for (const targetGroup of targetGroups) {
                        if (result instanceof editorInput_1.EditorInput) {
                            await this.replaceEditors([{ editor, replacement: result, options: editorOptions }], targetGroup);
                        }
                        else {
                            await this.replaceEditors([{ editor, replacement: { ...result, options: editorOptions } }], targetGroup);
                        }
                    }
                }
            }
            return {
                success: saveResults.every(result => !!result),
                editors: (0, arrays_1.coalesce)(saveResults)
            };
        }
        saveAll(options) {
            return this.save(this.getAllModifiedEditors(options), options);
        }
        async revert(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not revert the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            await async_1.Promises.settled(uniqueEditors.map(async ({ groupId, editor }) => {
                // Use revert as a hint to pin the editor
                this.editorGroupsContainer.getGroup(groupId)?.pinEditor(editor);
                return editor.revert(groupId, options);
            }));
            return !uniqueEditors.some(({ editor }) => editor.isDirty());
        }
        async revertAll(options) {
            return this.revert(this.getAllModifiedEditors(options), options);
        }
        getAllModifiedEditors(options) {
            const editors = [];
            for (const group of this.editorGroupsContainer.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    if (!editor.isModified()) {
                        continue;
                    }
                    if ((typeof options?.includeUntitled === 'boolean' || !options?.includeUntitled?.includeScratchpad)
                        && editor.hasCapability(512 /* EditorInputCapabilities.Scratchpad */)) {
                        continue;
                    }
                    if (!options?.includeUntitled && editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        continue;
                    }
                    if (options?.excludeSticky && group.isSticky(editor)) {
                        continue;
                    }
                    editors.push({ groupId: group.id, editor });
                }
            }
            return editors;
        }
        getUniqueEditors(editors) {
            const uniqueEditors = [];
            for (const { editor, groupId } of editors) {
                if (uniqueEditors.some(uniqueEditor => uniqueEditor.editor.matches(editor))) {
                    continue;
                }
                uniqueEditors.push({ editor, groupId });
            }
            return uniqueEditors;
        }
        //#endregion
        dispose() {
            super.dispose();
            // Dispose remaining watchers if any
            this.activeOutOfWorkspaceWatchers.forEach(disposable => (0, lifecycle_1.dispose)(disposable));
            this.activeOutOfWorkspaceWatchers.clear();
        }
    };
    exports.EditorService = EditorService;
    exports.EditorService = EditorService = EditorService_1 = __decorate([
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, files_1.IFileService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, editorResolverService_1.IEditorResolverService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(9, host_1.IHostService),
        __param(10, textEditorService_1.ITextEditorService)
    ], EditorService);
    (0, extensions_1.registerSingleton)(editorService_1.IEditorService, new descriptors_1.SyncDescriptor(EditorService, [undefined], false));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2VkaXRvci9icm93c2VyL2VkaXRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtDekYsSUFBTSxhQUFhLHFCQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQStCNUMsWUFDQyxxQkFBeUQsRUFDbkMsa0JBQXlELEVBQ3hELG9CQUE0RCxFQUNyRSxXQUEwQyxFQUNqQyxvQkFBNEQsRUFDekQsY0FBeUQsRUFDOUQsa0JBQXdELEVBQ3JELHFCQUE4RCxFQUN2RCw0QkFBNEUsRUFDN0YsV0FBMEMsRUFDcEMsaUJBQXNEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBWCtCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBc0I7WUFDdkMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNwRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNoQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3hDLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3BDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDdEMsaUNBQTRCLEdBQTVCLDRCQUE0QixDQUErQjtZQUM1RSxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBdEMzRSxnQkFBZ0I7WUFFQyw2QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN2RSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBRXRELCtCQUEwQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ3pFLDhCQUF5QixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUFFMUQsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBdUIsQ0FBQyxDQUFDO1lBQ2pGLHVCQUFrQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7WUFFNUMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBd0IsQ0FBQyxDQUFDO1lBQ2hGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEMsc0JBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBQzdFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFFeEMseUJBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUIsQ0FBQyxDQUFDO1lBQ2hGLHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFFOUMsMENBQXFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDcEYseUNBQW9DLEdBQUcsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLEtBQUssQ0FBQztZQTREakcsdUNBQXVDO1lBRS9CLHFCQUFnQixHQUE0QixTQUFTLENBQUM7WUFtRTlELFlBQVk7WUFFWiwwR0FBMEc7WUFFekYsaUNBQTRCLEdBQUcsSUFBSSxpQkFBVyxFQUFlLENBQUM7WUEwSHZFLHNCQUFpQixHQUFZLEtBQUssQ0FBQztZQTFPMUMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixJQUFJLGtCQUFrQixDQUFDO1lBQ3pFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlDQUFlLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztZQUU3SCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUU5QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRUQsWUFBWSxDQUFDLHFCQUFzRCxFQUFFLFdBQTRCO1lBQ2hHLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQWEsQ0FBQyxxQkFBcUIsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDaFksQ0FBQztRQUVPLGlCQUFpQjtZQUV4Qix5QkFBeUI7WUFDekIsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQy9ILElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDMUUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFbkksaUNBQWlDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV4Riw0QkFBNEI7WUFDNUIsbUhBQW1IO1lBQ25ILDhIQUE4SDtZQUM5SCx1SEFBdUg7WUFDdkgsdUZBQXVGO1lBQ3ZGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVqRixnQkFBZ0I7WUFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pHLENBQUM7UUFNTyxtQkFBbUI7WUFFMUIsMENBQTBDO1lBQzFDLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBeUIsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxpRUFBaUU7WUFDakUsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEMsQ0FBQztRQUNGLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxLQUFtQjtZQUNuRCxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3RELE9BQU8sQ0FBQyxpQ0FBaUM7WUFDMUMsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sQ0FBQywyQ0FBMkM7WUFDcEQsQ0FBQztZQUVELElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1FBQ3hDLENBQUM7UUFFTywrQkFBK0I7WUFFdEMsMEJBQTBCO1lBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUM7WUFDM0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxZQUFZLElBQUksU0FBUyxDQUFDO1lBRTlELGdDQUFnQztZQUNoQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUVPLHNCQUFzQixDQUFDLEtBQXVCO1lBQ3JELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFFL0MsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDdkQsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQy9DLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3ZELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3BDLElBQUEsbUJBQU8sRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQVFPLDBCQUEwQjtZQUNqQyxNQUFNLDhCQUE4QixHQUFHLElBQUksaUJBQVcsRUFBRSxDQUFDO1lBRXpELEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLFNBQVMsR0FBRyxJQUFBLGlCQUFRLEVBQUMsSUFBQSxpQkFBUSxFQUFDO29CQUNuQywrQkFBc0IsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUseUJBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQy9GLCtCQUFzQixDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSx5QkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztpQkFDakcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBRXJDLEtBQUssTUFBTSxRQUFRLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2xDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQ2hHLDhCQUE4QixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELHNEQUFzRDtZQUN0RCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO2dCQUNqRSxJQUFJLENBQUMsOEJBQThCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ25ELElBQUEsbUJBQU8sRUFBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ3pELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7WUFDRixDQUFDO1lBRUQsa0RBQWtEO1lBQ2xELEtBQUssTUFBTSxRQUFRLElBQUksOEJBQThCLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDdEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3BELElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM3RCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxZQUFZO1FBRVoscUVBQXFFO1FBRTdELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFxQjtZQUV4RCw2Q0FBNkM7WUFDN0MsSUFBSSxDQUFDLENBQUMsV0FBVyw0QkFBb0IsRUFBRSxDQUFDO2dCQUN2QyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsaUJBQWlCO1lBQ2pCLElBQUksQ0FBQyxDQUFDLFdBQVcsOEJBQXNCLElBQUksQ0FBQyxDQUFDLFdBQVcsNEJBQW9CLEVBQUUsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNyRixDQUFDO1FBQ0YsQ0FBQztRQUVPLGdCQUFnQixDQUFDLENBQW1CO1lBQzNDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7Z0JBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQVcsRUFBRSxNQUFXO1lBQ3JELEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN2RCxNQUFNLFlBQVksR0FBdUQsRUFBRSxDQUFDO2dCQUU1RSxLQUFLLE1BQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDcEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUNwRixTQUFTLENBQUMsNEJBQTRCO29CQUN2QyxDQUFDO29CQUVELDBDQUEwQztvQkFDMUMsSUFBSSxjQUFtQixDQUFDO29CQUN4QixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUM5RCxjQUFjLEdBQUcsTUFBTSxDQUFDLENBQUMsaUJBQWlCO29CQUMzQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxLQUFLLEdBQUcsSUFBQSxxQkFBVyxFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7d0JBQ2pILGNBQWMsR0FBRyxJQUFBLG9CQUFRLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO29CQUNwSCxDQUFDO29CQUVELHVDQUF1QztvQkFDdkMsTUFBTSxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBQ2pFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDakIsT0FBTyxDQUFDLHNCQUFzQjtvQkFDL0IsQ0FBQztvQkFFRCxNQUFNLGVBQWUsR0FBRzt3QkFDdkIsYUFBYSxFQUFFLElBQUk7d0JBQ25CLE1BQU0sRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQzt3QkFDOUIsTUFBTSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO3dCQUM5QixLQUFLLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQzt3QkFDckMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7cUJBQ2pDLENBQUM7b0JBRUYsMERBQTBEO29CQUMxRCxJQUFJLElBQUEsc0JBQWEsRUFBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEMsWUFBWSxDQUFDLElBQUksQ0FBQzs0QkFDakIsTUFBTTs0QkFDTixXQUFXLEVBQUUsVUFBVSxDQUFDLE1BQU07NEJBQzlCLE9BQU8sRUFBRTtnQ0FDUixHQUFHLFVBQVUsQ0FBQyxPQUFPO2dDQUNyQixHQUFHLGVBQWU7NkJBQ2xCO3lCQUNELENBQUMsQ0FBQztvQkFDSixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsWUFBWSxDQUFDLElBQUksQ0FBQzs0QkFDakIsTUFBTTs0QkFDTixXQUFXLEVBQUU7Z0NBQ1osR0FBRyxVQUFVLENBQUMsTUFBTTtnQ0FDcEIsT0FBTyxFQUFFO29DQUNSLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPO29DQUM1QixHQUFHLGVBQWU7aUNBQ2xCOzZCQUNEO3lCQUNELENBQUMsQ0FBQztvQkFDSixDQUFDO2dCQUNGLENBQUM7Z0JBRUQscUJBQXFCO2dCQUNyQixJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDekIsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUlPLHNCQUFzQixDQUFDLENBQTZCO1lBQzNELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLG9DQUFvQyxDQUFDLEVBQUUsQ0FBQztnQkFDeEUsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFpQyxDQUFDO1lBQzFGLElBQUksT0FBTyxhQUFhLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0UsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1lBQzNFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLENBQUMsVUFBVTtZQUMzQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQixDQUFDLElBQTRCLEVBQUUsVUFBbUIsRUFBRSxPQUFhO1lBQ3pGLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsZUFBZSxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RHLENBQUMsS0FBSyxJQUFJLEVBQUU7b0JBQ1gsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNmLE9BQU87b0JBQ1IsQ0FBQztvQkFFRCxpREFBaUQ7b0JBQ2pELHVEQUF1RDtvQkFDdkQsb0VBQW9FO29CQUNwRSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO3dCQUUzQyxzR0FBc0c7d0JBQ3RHLHVHQUF1Rzt3QkFDdkcsNkJBQTZCO3dCQUM3QixJQUFJLE9BQU8sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQzs0QkFDbEYsT0FBTzt3QkFDUixDQUFDO3dCQUVELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQzt3QkFDcEIsSUFBSSxJQUFJLFlBQVksd0JBQWdCLEVBQUUsQ0FBQzs0QkFDdEMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxpQ0FBeUIsQ0FBQzt3QkFDM0QsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzFFLENBQUM7d0JBRUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUNkLE9BQU87d0JBQ1IsQ0FBQzt3QkFFRCxvRkFBb0Y7d0JBQ3BGLG1GQUFtRjt3QkFDbkYsa0ZBQWtGO3dCQUNsRix3REFBd0Q7d0JBQ3hELG9GQUFvRjt3QkFDcEYsUUFBUTt3QkFDUixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7d0JBQ25CLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7NEJBQzFELE1BQU0sSUFBQSxlQUFPLEVBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ25CLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNsRCxDQUFDO3dCQUVELElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQzs0QkFDckMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNsQixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNOLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCLENBQUMsT0FBaUU7WUFDOUYsTUFBTSxPQUFPLEdBQWtCLEVBQUUsQ0FBQztZQUVsQyxTQUFTLHNCQUFzQixDQUFDLE1BQW1CO2dCQUNsRCxJQUFJLE1BQU0sQ0FBQyxhQUFhLDBDQUFrQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxDQUFDO29CQUN4RixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDdEIsT0FBTztnQkFDUixDQUFDO2dCQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEIsQ0FBQztZQUVELEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQyxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxNQUFNLFlBQVksNkNBQXFCLEVBQUUsQ0FBQztvQkFDMUUsc0JBQXNCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUN2QyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzFDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBUUQsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDO1FBQ2pFLENBQUM7UUFFRCxJQUFJLHVCQUF1QjtZQUMxQixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUMvQyxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLElBQUEsNEJBQVksRUFBQyxhQUFhLENBQUMsSUFBSSxJQUFBLDRCQUFZLEVBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDaEUsT0FBTyxhQUFhLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxJQUFBLGlDQUFpQixFQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUEsNEJBQVksRUFBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO29CQUN0RixPQUFPLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDdkMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSwwQkFBMEI7WUFDN0IsSUFBSSxnQkFBZ0IsR0FBNEIsU0FBUyxDQUFDO1lBRTFELE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQzdELElBQUksSUFBQSw0QkFBWSxFQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztnQkFDM0MsZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUNoRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUM7WUFDNUMsQ0FBQztZQUVELE9BQU8sZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDdEQsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFVBQVUsaUNBQXlCLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0UsQ0FBQztRQUVELFVBQVUsQ0FBQyxLQUFtQixFQUFFLE9BQXFDO1lBQ3BFLFFBQVEsS0FBSyxFQUFFLENBQUM7Z0JBRWYsTUFBTTtnQkFDTjtvQkFDQyxJQUFJLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO29CQUN0SSxDQUFDO29CQUVELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUM7Z0JBRXJDLGFBQWE7Z0JBQ2Isb0NBQTRCLENBQUMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLE9BQU8sR0FBd0IsRUFBRSxDQUFDO29CQUV4QyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLHFDQUE2QixFQUFFLENBQUM7d0JBQ3ZGLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsVUFBVSxrQ0FBMEIsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNwSCxDQUFDO29CQUVELE9BQU8sT0FBTyxDQUFDO2dCQUNoQixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLFlBQVk7WUFDZixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDO1lBRTNELE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLGtCQUFrQjtZQUNyQixPQUFPLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDekYsQ0FBQztRQUVELElBQUkseUJBQXlCO1lBQzVCLE1BQU0seUJBQXlCLEdBQXFDLEVBQUUsQ0FBQztZQUN2RSxLQUFLLE1BQU0saUJBQWlCLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3pELE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLElBQUEsNEJBQVksRUFBQyxPQUFPLENBQUMsSUFBSSxJQUFBLDRCQUFZLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDcEQseUJBQXlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8seUJBQXlCLENBQUM7UUFDbEMsQ0FBQztRQUVELElBQUksY0FBYztZQUNqQixPQUFPLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7UUFZRCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQXlDLEVBQUUsdUJBQXlELEVBQUUsY0FBK0I7WUFDckosSUFBSSxXQUFXLEdBQTRCLFNBQVMsQ0FBQztZQUNyRCxJQUFJLE9BQU8sR0FBRyxJQUFBLHNCQUFhLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLHVCQUF5QyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ2pHLElBQUksS0FBSyxHQUE2QixTQUFTLENBQUM7WUFFaEQsSUFBSSxJQUFBLGdDQUFnQixFQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztnQkFDL0MsY0FBYyxHQUFHLHVCQUF1QixDQUFDO1lBQzFDLENBQUM7WUFFRCxtQ0FBbUM7WUFDbkMsSUFBSSxDQUFDLElBQUEsc0JBQWEsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUU5RixJQUFJLGNBQWMsaUNBQXlCLEVBQUUsQ0FBQztvQkFDN0MsT0FBTyxDQUFDLHFDQUFxQztnQkFDOUMsQ0FBQztnQkFFRCwrQkFBK0I7Z0JBQy9CLElBQUksSUFBQSx5Q0FBZ0MsRUFBQyxjQUFjLENBQUMsRUFBRSxDQUFDO29CQUN0RCxXQUFXLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQztvQkFDcEMsT0FBTyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7b0JBQ2pDLEtBQUssR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztZQUVELDZEQUE2RDtZQUM3RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xCLFdBQVcsR0FBRyxJQUFBLHNCQUFhLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkcsQ0FBQztZQUVELDRFQUE0RTtZQUM1RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxVQUFVLEdBQWlDLFNBQVMsQ0FBQztnQkFDekQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2QkFBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQztnQkFDOUgsSUFBSSxlQUFlLFlBQVksT0FBTyxFQUFFLENBQUM7b0JBQ3hDLENBQUMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsTUFBTSxlQUFlLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztxQkFBTSxDQUFDO29CQUNQLENBQUMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7Z0JBRUQsNENBQTRDO2dCQUM1QyxJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixPQUFPLEdBQUcsRUFBRSxHQUFHLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFDdEMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLENBQUM7UUFTRCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQTRELEVBQUUsY0FBK0IsRUFBRSxPQUE2QjtZQUU3SSxvREFBb0Q7WUFDcEQsbURBQW1EO1lBQ25ELCtCQUErQjtZQUMvQixJQUFJLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDckIsT0FBTyxFQUFFLENBQUM7Z0JBQ1gsQ0FBQztZQUNGLENBQUM7WUFFRCx5Q0FBeUM7WUFDekMsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztZQUN0RixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixJQUFJLFdBQVcsR0FBdUMsU0FBUyxDQUFDO2dCQUNoRSxJQUFJLEtBQUssR0FBNkIsU0FBUyxDQUFDO2dCQUVoRCxtQ0FBbUM7Z0JBQ25DLElBQUksQ0FBQyxJQUFBLGlDQUF3QixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7b0JBRTlGLElBQUksY0FBYyxpQ0FBeUIsRUFBRSxDQUFDO3dCQUM3QyxTQUFTLENBQUMscUNBQXFDO29CQUNoRCxDQUFDO29CQUVELCtCQUErQjtvQkFDL0IsSUFBSSxJQUFBLHlDQUFnQyxFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7d0JBQ3RELFdBQVcsR0FBRyxjQUFjLENBQUM7d0JBQzdCLEtBQUssR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO29CQUM5QixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsNkRBQTZEO2dCQUM3RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xCLFdBQVcsR0FBRyxJQUFBLGlDQUF3QixFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZKLENBQUM7Z0JBRUQsNEVBQTRFO2dCQUM1RSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ1osTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2QkFBUyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDekcsSUFBSSxlQUFlLFlBQVksT0FBTyxFQUFFLENBQUM7d0JBQ3hDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLGVBQWUsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLGVBQWUsQ0FBQyxDQUFDO29CQUM3QixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsa0NBQWtDO2dCQUNsQyxJQUFJLGtCQUFrQixHQUFHLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3pCLGtCQUFrQixHQUFHLEVBQUUsQ0FBQztvQkFDeEIsc0JBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUN2RCxDQUFDO2dCQUVELGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsd0JBQXdCO1lBQ3hCLE1BQU0sTUFBTSxHQUF1QyxFQUFFLENBQUM7WUFDdEQsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxPQUFPLElBQUEsaUJBQVEsRUFBQyxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUE0RDtZQUM5RixNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFaEYsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDN0YsUUFBUSxXQUFXLEVBQUUsQ0FBQztnQkFDckI7b0JBQ0MsT0FBTyxJQUFJLENBQUM7Z0JBQ2I7b0JBQ0MsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO29CQUNySSxPQUFPLEtBQUssQ0FBQztnQkFDZDtvQkFDQyxPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7UUFDRixDQUFDO1FBRU8sc0JBQXNCLENBQUMsT0FBNEQ7WUFDMUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxpQkFBVyxFQUFFLENBQUM7WUFDcEMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztZQUV0QixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUU5QixlQUFlO2dCQUNmLElBQUksSUFBQSxpQ0FBd0IsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUN0QyxNQUFNLFFBQVEsR0FBRywrQkFBc0IsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLGlCQUFpQixFQUFFLHlCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7b0JBQ3BILElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO3dCQUN6QixTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUN6QixDQUFDO3lCQUFNLElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ3JCLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDOzRCQUN0QixTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDakMsQ0FBQzt3QkFFRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDeEIsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQ25DLENBQUM7d0JBRUQsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLFlBQVksaUNBQWUsQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO2dCQUVELGlCQUFpQjtxQkFDWixDQUFDO29CQUNMLElBQUksSUFBQSxtQ0FBMEIsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUN4QyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQzlCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDdkMsQ0FBQzt3QkFFRCxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQzlCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDdkMsQ0FBQzt3QkFFRCxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7NEJBQzVCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDckMsQ0FBQzt3QkFFRCxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7NEJBQzlCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDdkMsQ0FBQzt3QkFFRCxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUNsQixDQUFDO29CQUFDLElBQUksSUFBQSxrQ0FBeUIsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO3dCQUN6QyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDOzRCQUN6QyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3pDLENBQUM7d0JBRUQsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzs0QkFDekMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUN6QyxDQUFDO3dCQUVELFFBQVEsR0FBRyxJQUFJLENBQUM7b0JBQ2pCLENBQUM7eUJBQU0sSUFBSSxJQUFBLDhCQUFxQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQzFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNoQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTztnQkFDTixTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZDLFFBQVE7Z0JBQ1IsU0FBUzthQUNULENBQUM7UUFDSCxDQUFDO1FBRUQsWUFBWTtRQUVaLGtDQUFrQztRQUVsQyxRQUFRLENBQUMsTUFBc0M7WUFDOUMsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQztnQkFDckMsUUFBUSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztnQkFDakUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO2dCQUNyQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7YUFDekIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFNBQVMsQ0FBQyxNQUFtQjtZQUM1QixLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkQsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUN6QyxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELFlBQVk7UUFFWix1QkFBdUI7UUFFdkIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQXFCLEVBQUUsT0FBNkI7WUFDdEYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUUzRCxNQUFNLEtBQUssRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFFRCxZQUFZO1FBRVosd0JBQXdCO1FBRXhCLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBNEIsRUFBRSxPQUE2QjtZQUM3RSxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxFQUErQixDQUFDO1lBRWpFLEtBQUssTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNaLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxJQUFJLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZCxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7Z0JBRUQsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QixDQUFDO1lBRUQsS0FBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ2xELE1BQU0sS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDNUMsQ0FBQztRQUNGLENBQUM7UUFXRCxXQUFXLENBQUMsSUFBMEMsRUFBRSxPQUF1QyxFQUFFLElBQXFDO1lBQ3JJLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN4RCxNQUFNLE1BQU0sR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFekQsNERBQTREO1lBQzVELCtEQUErRDtZQUMvRCw4REFBOEQ7WUFDOUQsaUVBQWlFO1lBQ2pFLDZEQUE2RDtZQUM3RCxXQUFXO1lBQ1gsSUFBSSxPQUFPLEVBQUUsaUJBQWlCLEtBQUsseUJBQWdCLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBRSxpQkFBaUIsS0FBSyx5QkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDdEgsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ2hELElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFBLG1CQUFXLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDMUMsT0FBTyxFQUFFLENBQUM7b0JBQ1gsQ0FBQztvQkFFRCxPQUFPLFNBQVMsQ0FBQztnQkFDbEIsQ0FBQztZQUNGLENBQUM7WUFFRCxnQ0FBZ0M7WUFDaEMsSUFBSSxDQUFDLElBQUEsbUJBQVcsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLFdBQVcsR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFaEcsd0NBQXdDO2dCQUN4QyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDckIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3dCQUNsQixPQUFPLEVBQUUsQ0FBQztvQkFDWCxDQUFDO29CQUVELE9BQU8sV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7Z0JBRUQsK0NBQStDO3FCQUMxQyxDQUFDO29CQUNMLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzt3QkFDbEIsT0FBTyxTQUFTLENBQUM7b0JBQ2xCLENBQUM7b0JBRUQsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQzNELEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7d0JBQzlCLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUUsQ0FBQzs0QkFDOUIsT0FBTyxNQUFNLENBQUM7d0JBQ2YsQ0FBQztvQkFDRixDQUFDO29CQUVELE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQztZQUVELHdDQUF3QztpQkFDbkMsQ0FBQztnQkFDTCxNQUFNLE1BQU0sR0FBd0IsRUFBRSxDQUFDO2dCQUV2QyxLQUFLLE1BQU0sS0FBSyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLDBDQUFrQyxFQUFFLENBQUM7b0JBQzVGLE1BQU0sT0FBTyxHQUFrQixFQUFFLENBQUM7b0JBRWxDLHdDQUF3QztvQkFDeEMsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDekQsQ0FBQztvQkFFRCwrQ0FBK0M7eUJBQzFDLENBQUM7d0JBQ0wsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUN0RCxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ3RCLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEUsQ0FBQztnQkFFRCxPQUFPLE1BQU0sQ0FBQztZQUNmLENBQUM7UUFDRixDQUFDO1FBUUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUFtRSxFQUFFLEtBQXFDO1lBQzlILE1BQU0sV0FBVyxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRW5HLDJEQUEyRDtZQUMzRCx1Q0FBdUM7WUFDdkMsTUFBTSxpQkFBaUIsR0FBeUIsRUFBRSxDQUFDO1lBQ25ELEtBQUssTUFBTSxXQUFXLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksZ0JBQWdCLEdBQW1DLFNBQVMsQ0FBQztnQkFFakUsbUNBQW1DO2dCQUNuQyxJQUFJLENBQUMsSUFBQSxzQkFBYSxFQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUM3QyxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQ3BFLFdBQVcsQ0FBQyxXQUFXLEVBQ3ZCLFdBQVcsQ0FDWCxDQUFDO29CQUVGLElBQUksY0FBYyxpQ0FBeUIsRUFBRSxDQUFDO3dCQUM3QyxTQUFTLENBQUMscUNBQXFDO29CQUNoRCxDQUFDO29CQUVELCtCQUErQjtvQkFDL0IsSUFBSSxJQUFBLHlDQUFnQyxFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7d0JBQ3RELGdCQUFnQixHQUFHOzRCQUNsQixNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07NEJBQzFCLFdBQVcsRUFBRSxjQUFjLENBQUMsTUFBTTs0QkFDbEMsT0FBTyxFQUFFLGNBQWMsQ0FBQyxPQUFPOzRCQUMvQixpQkFBaUIsRUFBRSxXQUFXLENBQUMsaUJBQWlCO3lCQUNoRCxDQUFDO29CQUNILENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCw2REFBNkQ7Z0JBQzdELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUN2QixnQkFBZ0IsR0FBRzt3QkFDbEIsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO3dCQUMxQixXQUFXLEVBQUUsSUFBQSx5Q0FBbUIsRUFBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQzt3QkFDakosT0FBTyxFQUFFLElBQUEseUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTzt3QkFDakcsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLGlCQUFpQjtxQkFDaEQsQ0FBQztnQkFDSCxDQUFDO2dCQUVELGlCQUFpQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCxPQUFPLFdBQVcsRUFBRSxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsWUFBWTtRQUVaLHFCQUFxQjtRQUVyQixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQWdELEVBQUUsT0FBNkI7WUFFekYsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JCLENBQUM7WUFFRCx1REFBdUQ7WUFDdkQscURBQXFEO1lBQ3JELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyRCwyREFBMkQ7WUFDM0QsK0RBQStEO1lBQy9ELGdFQUFnRTtZQUNoRSwyREFBMkQ7WUFDM0QsZ0JBQWdCO1lBQ2hCLE1BQU0scUJBQXFCLEdBQXdCLEVBQUUsQ0FBQztZQUN0RCxNQUFNLHlCQUF5QixHQUF3QixFQUFFLENBQUM7WUFDMUQsSUFBSSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUM7Z0JBQ3JCLHlCQUF5QixDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDO1lBQ2xELENBQUM7aUJBQU0sQ0FBQztnQkFDUCxLQUFLLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ2pELElBQUksTUFBTSxDQUFDLGFBQWEsMENBQWtDLEVBQUUsQ0FBQzt3QkFDNUQseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7b0JBQ3JELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztvQkFDakQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELDhCQUE4QjtZQUM5QixNQUFNLFdBQVcsR0FBRyxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUU7Z0JBRTVGLDBEQUEwRDtnQkFDMUQsSUFBSSxPQUFPLEVBQUUsTUFBTSxnQ0FBd0IsRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDakUsQ0FBQztnQkFFRCxPQUFPO2dCQUNQLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLCtCQUErQjtZQUMvQixLQUFLLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUkseUJBQXlCLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDekIsU0FBUyxDQUFDLGlEQUFpRDtnQkFDNUQsQ0FBQztnQkFFRCxnRUFBZ0U7Z0JBQ2hFLG1FQUFtRTtnQkFDbkUsdURBQXVEO2dCQUN2RCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLGFBQWEsR0FBbUI7b0JBQ3JDLE1BQU0sRUFBRSxJQUFJO29CQUNaLFNBQVMsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFO2lCQUNyQyxDQUFDO2dCQUVGLE1BQU0sTUFBTSxHQUFHLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzdHLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXpCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDYixNQUFNLENBQUMsNkJBQTZCO2dCQUNyQyxDQUFDO2dCQUVELG1FQUFtRTtnQkFDbkUscUVBQXFFO2dCQUNyRSxlQUFlO2dCQUNmLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7b0JBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxhQUFhLDBDQUFrQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDN0wsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUUsQ0FBQzt3QkFDeEMsSUFBSSxNQUFNLFlBQVkseUJBQVcsRUFBRSxDQUFDOzRCQUNuQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO3dCQUNuRyxDQUFDOzZCQUFNLENBQUM7NEJBQ1AsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsR0FBRyxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQzt3QkFDMUcsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTztnQkFDTixPQUFPLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7Z0JBQzlDLE9BQU8sRUFBRSxJQUFBLGlCQUFRLEVBQUMsV0FBVyxDQUFDO2FBQzlCLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxDQUFDLE9BQWdDO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBZ0QsRUFBRSxPQUF3QjtZQUV0RixtQkFBbUI7WUFDbkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVELHlEQUF5RDtZQUN6RCxxREFBcUQ7WUFDckQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJELE1BQU0sZ0JBQVEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtnQkFFdEUseUNBQXlDO2dCQUN6QyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFaEUsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN4QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFrQztZQUNqRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxPQUF5QztZQUN0RSxNQUFNLE9BQU8sR0FBd0IsRUFBRSxDQUFDO1lBRXhDLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsMENBQWtDLEVBQUUsQ0FBQztnQkFDNUYsS0FBSyxNQUFNLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSwyQ0FBbUMsRUFBRSxDQUFDO29CQUMxRSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7d0JBQzFCLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxJQUFJLENBQUMsT0FBTyxPQUFPLEVBQUUsZUFBZSxLQUFLLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsaUJBQWlCLENBQUM7MkJBQy9GLE1BQU0sQ0FBQyxhQUFhLDhDQUFvQyxFQUFFLENBQUM7d0JBQzlELFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLGVBQWUsSUFBSSxNQUFNLENBQUMsYUFBYSwwQ0FBa0MsRUFBRSxDQUFDO3dCQUN6RixTQUFTO29CQUNWLENBQUM7b0JBRUQsSUFBSSxPQUFPLEVBQUUsYUFBYSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEQsU0FBUztvQkFDVixDQUFDO29CQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUM3QyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxPQUE0QjtZQUNwRCxNQUFNLGFBQWEsR0FBd0IsRUFBRSxDQUFDO1lBQzlDLEtBQUssTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDM0MsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUM3RSxTQUFTO2dCQUNWLENBQUM7Z0JBRUQsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLENBQUM7WUFFRCxPQUFPLGFBQWEsQ0FBQztRQUN0QixDQUFDO1FBRUQsWUFBWTtRQUVILE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsb0NBQW9DO1lBQ3BDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFBLG1CQUFPLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM3RSxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0MsQ0FBQztLQUNELENBQUE7SUE1aENZLHNDQUFhOzRCQUFiLGFBQWE7UUFpQ3ZCLFdBQUEsMENBQW9CLENBQUE7UUFDcEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDhDQUFzQixDQUFBO1FBQ3RCLFdBQUEsOENBQTZCLENBQUE7UUFDN0IsV0FBQSxtQkFBWSxDQUFBO1FBQ1osWUFBQSxzQ0FBa0IsQ0FBQTtPQTFDUixhQUFhLENBNGhDekI7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDhCQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGFBQWEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMifQ==