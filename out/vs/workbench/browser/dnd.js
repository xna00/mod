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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/dataTransfer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/dnd/browser/dnd", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/browser/window", "vs/base/browser/broadcast"], function (require, exports, dnd_1, dom_1, arrays_1, dataTransfer_1, event_1, lifecycle_1, marshalling_1, mime_1, network_1, platform_1, resources_1, uri_1, dnd_2, files_1, instantiation_1, label_1, opener_1, platform_2, workspace_1, workspaces_1, editor_1, editorService_1, host_1, textfiles_1, workspaceEditing_1, window_1, broadcast_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceListDnDHandler = exports.CompositeDragAndDropObserver = exports.DraggedViewIdentifier = exports.DraggedCompositeIdentifier = exports.CompositeDragAndDropData = exports.ResourcesDropHandler = exports.DraggedEditorGroupIdentifier = exports.DraggedEditorIdentifier = void 0;
    exports.extractTreeDropData = extractTreeDropData;
    exports.fillEditorsDragData = fillEditorsDragData;
    exports.toggleDropEffect = toggleDropEffect;
    exports.isWindowDraggedOver = isWindowDraggedOver;
    //#region Editor / Resources DND
    class DraggedEditorIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedEditorIdentifier = DraggedEditorIdentifier;
    class DraggedEditorGroupIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedEditorGroupIdentifier = DraggedEditorGroupIdentifier;
    async function extractTreeDropData(dataTransfer) {
        const editors = [];
        const resourcesKey = mime_1.Mimes.uriList.toLowerCase();
        // Data Transfer: Resources
        if (dataTransfer.has(resourcesKey)) {
            try {
                const asString = await dataTransfer.get(resourcesKey)?.asString();
                const rawResourcesData = JSON.stringify(dataTransfer_1.UriList.parse(asString ?? ''));
                editors.push(...(0, dnd_2.createDraggedEditorInputFromRawResourcesData)(rawResourcesData));
            }
            catch (error) {
                // Invalid transfer
            }
        }
        return editors;
    }
    /**
     * Shared function across some components to handle drag & drop of resources.
     * E.g. of folders and workspace files to open them in the window instead of
     * the editor or to handle dirty editors being dropped between instances of Code.
     */
    let ResourcesDropHandler = class ResourcesDropHandler {
        constructor(options, fileService, workspacesService, editorService, workspaceEditingService, hostService, contextService, instantiationService) {
            this.options = options;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.editorService = editorService;
            this.workspaceEditingService = workspaceEditingService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
        }
        async handleDrop(event, targetWindow, resolveTargetGroup, afterDrop, options) {
            const editors = await this.instantiationService.invokeFunction(accessor => (0, dnd_2.extractEditorsAndFilesDropData)(accessor, event));
            if (!editors.length) {
                return;
            }
            // Make the window active to handle the drop properly within
            await this.hostService.focus(targetWindow);
            // Check for workspace file / folder being dropped if we are allowed to do so
            if (this.options.allowWorkspaceOpen) {
                const localFilesAllowedToOpenAsWorkspace = (0, arrays_1.coalesce)(editors.filter(editor => editor.allowWorkspaceOpen && editor.resource?.scheme === network_1.Schemas.file).map(editor => editor.resource));
                if (localFilesAllowedToOpenAsWorkspace.length > 0) {
                    const isWorkspaceOpening = await this.handleWorkspaceDrop(localFilesAllowedToOpenAsWorkspace);
                    if (isWorkspaceOpening) {
                        return; // return early if the drop operation resulted in this window changing to a workspace
                    }
                }
            }
            // Add external ones to recently open list unless dropped resource is a workspace
            const externalLocalFiles = (0, arrays_1.coalesce)(editors.filter(editor => editor.isExternal && editor.resource?.scheme === network_1.Schemas.file).map(editor => editor.resource));
            if (externalLocalFiles.length) {
                this.workspacesService.addRecentlyOpened(externalLocalFiles.map(resource => ({ fileUri: resource })));
            }
            // Open in Editor
            const targetGroup = resolveTargetGroup?.();
            await this.editorService.openEditors(editors.map(editor => ({
                ...editor,
                resource: editor.resource,
                options: {
                    ...editor.options,
                    ...options,
                    pinned: true
                }
            })), targetGroup, { validateTrust: true });
            // Finish with provided function
            afterDrop?.(targetGroup);
        }
        async handleWorkspaceDrop(resources) {
            const toOpen = [];
            const folderURIs = [];
            await Promise.all(resources.map(async (resource) => {
                // Check for Workspace
                if ((0, workspace_1.hasWorkspaceFileExtension)(resource)) {
                    toOpen.push({ workspaceUri: resource });
                    return;
                }
                // Check for Folder
                try {
                    const stat = await this.fileService.stat(resource);
                    if (stat.isDirectory) {
                        toOpen.push({ folderUri: stat.resource });
                        folderURIs.push({ uri: stat.resource });
                    }
                }
                catch (error) {
                    // Ignore error
                }
            }));
            // Return early if no external resource is a folder or workspace
            if (toOpen.length === 0) {
                return false;
            }
            // Open in separate windows if we drop workspaces or just one folder
            if (toOpen.length > folderURIs.length || folderURIs.length === 1) {
                await this.hostService.openWindow(toOpen);
            }
            // Add to workspace if we are in a temporary workspace
            else if ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                await this.workspaceEditingService.addFolders(folderURIs);
            }
            // Finally, enter untitled workspace when dropping >1 folders
            else {
                await this.workspaceEditingService.createAndEnterWorkspace(folderURIs);
            }
            return true;
        }
    };
    exports.ResourcesDropHandler = ResourcesDropHandler;
    exports.ResourcesDropHandler = ResourcesDropHandler = __decorate([
        __param(1, files_1.IFileService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, editorService_1.IEditorService),
        __param(4, workspaceEditing_1.IWorkspaceEditingService),
        __param(5, host_1.IHostService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, instantiation_1.IInstantiationService)
    ], ResourcesDropHandler);
    function fillEditorsDragData(accessor, resourcesOrEditors, event, options) {
        if (resourcesOrEditors.length === 0 || !event.dataTransfer) {
            return;
        }
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const fileService = accessor.get(files_1.IFileService);
        const labelService = accessor.get(label_1.ILabelService);
        // Extract resources from URIs or Editors that
        // can be handled by the file service
        const resources = (0, arrays_1.coalesce)(resourcesOrEditors.map(resourceOrEditor => {
            if (uri_1.URI.isUri(resourceOrEditor)) {
                return { resource: resourceOrEditor };
            }
            if ((0, editor_1.isEditorIdentifier)(resourceOrEditor)) {
                if (uri_1.URI.isUri(resourceOrEditor.editor.resource)) {
                    return { resource: resourceOrEditor.editor.resource };
                }
                return undefined; // editor without resource
            }
            return resourceOrEditor;
        }));
        const fileSystemResources = resources.filter(({ resource }) => fileService.hasProvider(resource));
        if (!options?.disableStandardTransfer) {
            // Text: allows to paste into text-capable areas
            const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
            event.dataTransfer.setData(dnd_1.DataTransfers.TEXT, fileSystemResources.map(({ resource }) => labelService.getUriLabel(resource, { noPrefix: true })).join(lineDelimiter));
            // Download URL: enables support to drag a tab as file to desktop
            // Requirements:
            // - Chrome/Edge only
            // - only a single file is supported
            // - only file:/ resources are supported
            const firstFile = fileSystemResources.find(({ isDirectory }) => !isDirectory);
            if (firstFile) {
                const firstFileUri = network_1.FileAccess.uriToFileUri(firstFile.resource); // enforce `file:` URIs
                if (firstFileUri.scheme === network_1.Schemas.file) {
                    event.dataTransfer.setData(dnd_1.DataTransfers.DOWNLOAD_URL, [mime_1.Mimes.binary, (0, resources_1.basename)(firstFile.resource), firstFileUri.toString()].join(':'));
                }
            }
        }
        // Resource URLs: allows to drop multiple file resources to a target in VS Code
        const files = fileSystemResources.filter(({ isDirectory }) => !isDirectory);
        if (files.length) {
            event.dataTransfer.setData(dnd_1.DataTransfers.RESOURCES, JSON.stringify(files.map(({ resource }) => resource.toString())));
        }
        // Contributions
        const contributions = platform_2.Registry.as(dnd_2.Extensions.DragAndDropContribution).getAll();
        for (const contribution of contributions) {
            contribution.setData(resources, event);
        }
        // Editors: enables cross window DND of editors
        // into the editor area while presering UI state
        const draggedEditors = [];
        for (const resourceOrEditor of resourcesOrEditors) {
            // Extract resource editor from provided object or URI
            let editor = undefined;
            if ((0, editor_1.isEditorIdentifier)(resourceOrEditor)) {
                const untypedEditor = resourceOrEditor.editor.toUntyped({ preserveViewState: resourceOrEditor.groupId });
                if (untypedEditor) {
                    editor = { ...untypedEditor, resource: editor_1.EditorResourceAccessor.getCanonicalUri(untypedEditor) };
                }
            }
            else if (uri_1.URI.isUri(resourceOrEditor)) {
                const { selection, uri } = (0, opener_1.extractSelection)(resourceOrEditor);
                editor = { resource: uri, options: selection ? { selection } : undefined };
            }
            else if (!resourceOrEditor.isDirectory) {
                editor = { resource: resourceOrEditor.resource };
            }
            if (!editor) {
                continue; // skip over editors that cannot be transferred via dnd
            }
            // Fill in some properties if they are not there already by accessing
            // some well known things from the text file universe.
            // This is not ideal for custom editors, but those have a chance to
            // provide everything from the `toUntyped` method.
            {
                const resource = editor.resource;
                if (resource) {
                    const textFileModel = textFileService.files.get(resource);
                    if (textFileModel) {
                        // language
                        if (typeof editor.languageId !== 'string') {
                            editor.languageId = textFileModel.getLanguageId();
                        }
                        // encoding
                        if (typeof editor.encoding !== 'string') {
                            editor.encoding = textFileModel.getEncoding();
                        }
                        // contents (only if dirty and not too large)
                        if (typeof editor.contents !== 'string' && textFileModel.isDirty() && !textFileModel.textEditorModel.isTooLargeForHeapOperation()) {
                            editor.contents = textFileModel.textEditorModel.getValue();
                        }
                    }
                    // viewState
                    if (!editor.options?.viewState) {
                        editor.options = {
                            ...editor.options,
                            viewState: (() => {
                                for (const visibleEditorPane of editorService.visibleEditorPanes) {
                                    if ((0, resources_1.isEqual)(visibleEditorPane.input.resource, resource)) {
                                        const viewState = visibleEditorPane.getViewState();
                                        if (viewState) {
                                            return viewState;
                                        }
                                    }
                                }
                                return undefined;
                            })()
                        };
                    }
                }
            }
            // Add as dragged editor
            draggedEditors.push(editor);
        }
        if (draggedEditors.length) {
            event.dataTransfer.setData(dnd_2.CodeDataTransfers.EDITORS, (0, marshalling_1.stringify)(draggedEditors));
            // Add a URI list entry
            const uriListEntries = [];
            for (const editor of draggedEditors) {
                if (editor.resource) {
                    uriListEntries.push(editor.resource);
                }
                else if ((0, editor_1.isResourceDiffEditorInput)(editor)) {
                    if (editor.modified.resource) {
                        uriListEntries.push(editor.modified.resource);
                    }
                }
                else if ((0, editor_1.isResourceSideBySideEditorInput)(editor)) {
                    if (editor.primary.resource) {
                        uriListEntries.push(editor.primary.resource);
                    }
                }
                else if ((0, editor_1.isResourceMergeEditorInput)(editor)) {
                    uriListEntries.push(editor.result.resource);
                }
            }
            // Due to https://bugs.chromium.org/p/chromium/issues/detail?id=239745, we can only set
            // a single uri for the real `text/uri-list` type. Otherwise all uris end up joined together
            // However we write the full uri-list to an internal type so that other parts of VS Code
            // can use the full list.
            if (!options?.disableStandardTransfer) {
                event.dataTransfer.setData(mime_1.Mimes.uriList, dataTransfer_1.UriList.create(uriListEntries.slice(0, 1)));
            }
            event.dataTransfer.setData(dnd_1.DataTransfers.INTERNAL_URI_LIST, dataTransfer_1.UriList.create(uriListEntries));
        }
    }
    class CompositeDragAndDropData {
        constructor(type, id) {
            this.type = type;
            this.id = id;
        }
        update(dataTransfer) {
            // no-op
        }
        getData() {
            return { type: this.type, id: this.id };
        }
    }
    exports.CompositeDragAndDropData = CompositeDragAndDropData;
    class DraggedCompositeIdentifier {
        constructor(compositeId) {
            this.compositeId = compositeId;
        }
        get id() {
            return this.compositeId;
        }
    }
    exports.DraggedCompositeIdentifier = DraggedCompositeIdentifier;
    class DraggedViewIdentifier {
        constructor(viewId) {
            this.viewId = viewId;
        }
        get id() {
            return this.viewId;
        }
    }
    exports.DraggedViewIdentifier = DraggedViewIdentifier;
    class CompositeDragAndDropObserver extends lifecycle_1.Disposable {
        static get INSTANCE() {
            if (!CompositeDragAndDropObserver.instance) {
                CompositeDragAndDropObserver.instance = new CompositeDragAndDropObserver();
                (0, lifecycle_1.markAsSingleton)(CompositeDragAndDropObserver.instance);
            }
            return CompositeDragAndDropObserver.instance;
        }
        constructor() {
            super();
            this.transferData = dnd_2.LocalSelectionTransfer.getInstance();
            this.onDragStart = this._register(new event_1.Emitter());
            this.onDragEnd = this._register(new event_1.Emitter());
            this._register(this.onDragEnd.event(e => {
                const id = e.dragAndDropData.getData().id;
                const type = e.dragAndDropData.getData().type;
                const data = this.readDragData(type);
                if (data?.getData().id === id) {
                    this.transferData.clearData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                }
            }));
        }
        readDragData(type) {
            if (this.transferData.hasData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype)) {
                const data = this.transferData.getData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                if (data && data[0]) {
                    return new CompositeDragAndDropData(type, data[0].id);
                }
            }
            return undefined;
        }
        writeDragData(id, type) {
            this.transferData.setData([type === 'view' ? new DraggedViewIdentifier(id) : new DraggedCompositeIdentifier(id)], type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
        }
        registerTarget(element, callbacks) {
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(new dom_1.DragAndDropObserver(element, {
                onDragEnter: e => {
                    e.preventDefault();
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (callbacks.onDragLeave && data) {
                        callbacks.onDragLeave({ eventData: e, dragAndDropData: data });
                    }
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    e.preventDefault();
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this.onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this.onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                }, this, disposableStore);
            }
            return this._register(disposableStore);
        }
        registerDraggable(element, draggedItemProvider, callbacks) {
            element.draggable = true;
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(new dom_1.DragAndDropObserver(element, {
                onDragStart: e => {
                    const { id, type } = draggedItemProvider();
                    this.writeDragData(id, type);
                    e.dataTransfer?.setDragImage(element, 0, 0);
                    this.onDragStart.fire({ eventData: e, dragAndDropData: this.readDragData(type) });
                },
                onDragEnd: e => {
                    const { type } = draggedItemProvider();
                    const data = this.readDragData(type);
                    if (!data) {
                        return;
                    }
                    this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                },
                onDragEnter: e => {
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (!data) {
                        return;
                    }
                    callbacks.onDragLeave?.({ eventData: e, dragAndDropData: data });
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this.onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this.onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                }, this, disposableStore);
            }
            return this._register(disposableStore);
        }
    }
    exports.CompositeDragAndDropObserver = CompositeDragAndDropObserver;
    function toggleDropEffect(dataTransfer, dropEffect, shouldHaveIt) {
        if (!dataTransfer) {
            return;
        }
        dataTransfer.dropEffect = shouldHaveIt ? dropEffect : 'none';
    }
    let ResourceListDnDHandler = class ResourceListDnDHandler {
        constructor(toResource, instantiationService) {
            this.toResource = toResource;
            this.instantiationService = instantiationService;
        }
        getDragURI(element) {
            const resource = this.toResource(element);
            return resource ? resource.toString() : null;
        }
        getDragLabel(elements) {
            const resources = (0, arrays_1.coalesce)(elements.map(this.toResource));
            return resources.length === 1 ? (0, resources_1.basename)(resources[0]) : resources.length > 1 ? String(resources.length) : undefined;
        }
        onDragStart(data, originalEvent) {
            const resources = [];
            for (const element of data.elements) {
                const resource = this.toResource(element);
                if (resource) {
                    resources.push(resource);
                }
            }
            if (resources.length) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => fillEditorsDragData(accessor, resources, originalEvent));
            }
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            return false;
        }
        drop(data, targetElement, targetIndex, targetSector, originalEvent) { }
        dispose() { }
    };
    exports.ResourceListDnDHandler = ResourceListDnDHandler;
    exports.ResourceListDnDHandler = ResourceListDnDHandler = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ResourceListDnDHandler);
    //#endregion
    class GlobalWindowDraggedOverTracker extends lifecycle_1.Disposable {
        static { this.CHANNEL_NAME = 'monaco-workbench-global-dragged-over'; }
        constructor() {
            super();
            this.broadcaster = this._register(new broadcast_1.BroadcastDataChannel(GlobalWindowDraggedOverTracker.CHANNEL_NAME));
            this.draggedOver = false;
            this.registerListeners();
        }
        registerListeners() {
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add((0, dom_1.addDisposableListener)(window, dom_1.EventType.DRAG_OVER, () => this.markDraggedOver(false), true));
                disposables.add((0, dom_1.addDisposableListener)(window, dom_1.EventType.DRAG_LEAVE, () => this.clearDraggedOver(false), true));
            }, { window: window_1.mainWindow, disposables: this._store }));
            this._register(this.broadcaster.onDidReceiveData(data => {
                if (data === true) {
                    this.markDraggedOver(true);
                }
                else {
                    this.clearDraggedOver(true);
                }
            }));
        }
        get isDraggedOver() { return this.draggedOver; }
        markDraggedOver(fromBroadcast) {
            if (this.draggedOver === true) {
                return; // alrady marked
            }
            this.draggedOver = true;
            if (!fromBroadcast) {
                this.broadcaster.postData(true);
            }
        }
        clearDraggedOver(fromBroadcast) {
            if (this.draggedOver === false) {
                return; // alrady cleared
            }
            this.draggedOver = false;
            if (!fromBroadcast) {
                this.broadcaster.postData(false);
            }
        }
    }
    const globalDraggedOverTracker = new GlobalWindowDraggedOverTracker();
    /**
     * Returns whether the workbench is currently dragged over in any of
     * the opened windows (main windows and auxiliary windows).
     */
    function isWindowDraggedOver() {
        return globalDraggedOverTracker.isDraggedOver;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9kbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaURoRyxrREFnQkM7SUE2SEQsa0RBc0tDO0lBa1FELDRDQU1DO0lBd0dELGtEQUVDO0lBanJCRCxnQ0FBZ0M7SUFFaEMsTUFBYSx1QkFBdUI7UUFFbkMsWUFBcUIsVUFBNkI7WUFBN0IsZUFBVSxHQUFWLFVBQVUsQ0FBbUI7UUFBSSxDQUFDO0tBQ3ZEO0lBSEQsMERBR0M7SUFFRCxNQUFhLDRCQUE0QjtRQUV4QyxZQUFxQixVQUEyQjtZQUEzQixlQUFVLEdBQVYsVUFBVSxDQUFpQjtRQUFJLENBQUM7S0FDckQ7SUFIRCxvRUFHQztJQUVNLEtBQUssVUFBVSxtQkFBbUIsQ0FBQyxZQUE0QjtRQUNyRSxNQUFNLE9BQU8sR0FBa0MsRUFBRSxDQUFDO1FBQ2xELE1BQU0sWUFBWSxHQUFHLFlBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFakQsMkJBQTJCO1FBQzNCLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQztnQkFDSixNQUFNLFFBQVEsR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7Z0JBQ2xFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdkUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUEsa0RBQTRDLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLENBQUM7WUFBQyxPQUFP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