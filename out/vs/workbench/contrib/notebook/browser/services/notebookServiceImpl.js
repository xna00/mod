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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/notebook/browser/notebookExtensionPoint", "vs/workbench/contrib/notebook/common/notebookDiffEditorInput", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/common/notebookOutputRenderer", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/notebook/common/notebookDocumentService"], function (require, exports, nls_1, actions_1, errorMessage_1, event_1, iterator_1, lazy_1, lifecycle_1, map_1, network_1, resources_1, types_1, uri_1, accessibility_1, configuration_1, files_1, instantiation_1, storage_1, memento_1, notebookExtensionPoint_1, notebookDiffEditorInput_1, notebookTextModel_1, notebookCommon_1, notebookEditorInput_1, notebookEditorModelResolverService_1, notebookOutputRenderer_1, notebookProvider_1, notebookService_1, editorResolverService_1, extensions_1, extensionsActions_1, uriIdentity_1, notebookDocumentService_1) {
    "use strict";
    var NotebookProviderInfoStore_1, NotebookService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookService = exports.NotebookOutputRendererInfoStore = exports.NotebookProviderInfoStore = void 0;
    let NotebookProviderInfoStore = class NotebookProviderInfoStore extends lifecycle_1.Disposable {
        static { NotebookProviderInfoStore_1 = this; }
        static { this.CUSTOM_EDITORS_STORAGE_ID = 'notebookEditors'; }
        static { this.CUSTOM_EDITORS_ENTRY_ID = 'editors'; }
        constructor(storageService, extensionService, _editorResolverService, _configurationService, _accessibilityService, _instantiationService, _fileService, _notebookEditorModelResolverService, uriIdentService) {
            super();
            this._editorResolverService = _editorResolverService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._fileService = _fileService;
            this._notebookEditorModelResolverService = _notebookEditorModelResolverService;
            this.uriIdentService = uriIdentService;
            this._handled = false;
            this._contributedEditors = new Map();
            this._contributedEditorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._memento = new memento_1.Memento(NotebookProviderInfoStore_1.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            // Process the notebook contributions but buffer changes from the resolver
            this._editorResolverService.bufferChangeEvents(() => {
                for (const info of (mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                    this.add(new notebookProvider_1.NotebookProviderInfo(info));
                }
            });
            this._register(extensionService.onDidRegisterExtensions(() => {
                if (!this._handled) {
                    // there is no extension point registered for notebook content provider
                    // clear the memento and cache
                    this._clear();
                    mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = [];
                    this._memento.saveMemento();
                }
            }));
            notebookExtensionPoint_1.notebooksExtensionPoint.setHandler(extensions => this._setupHandler(extensions));
        }
        dispose() {
            this._clear();
            super.dispose();
        }
        _setupHandler(extensions) {
            this._handled = true;
            const builtins = [...this._contributedEditors.values()].filter(info => !info.extension);
            this._clear();
            const builtinProvidersFromCache = new Map();
            builtins.forEach(builtin => {
                builtinProvidersFromCache.set(builtin.id, this.add(builtin));
            });
            for (const extension of extensions) {
                for (const notebookContribution of extension.value) {
                    if (!notebookContribution.type) {
                        extension.collector.error(`Notebook does not specify type-property`);
                        continue;
                    }
                    const existing = this.get(notebookContribution.type);
                    if (existing) {
                        if (!existing.extension && extension.description.isBuiltin && builtins.find(builtin => builtin.id === notebookContribution.type)) {
                            // we are registering an extension which is using the same view type which is already cached
                            builtinProvidersFromCache.get(notebookContribution.type)?.dispose();
                        }
                        else {
                            extension.collector.error(`Notebook type '${notebookContribution.type}' already used`);
                            continue;
                        }
                    }
                    this.add(new notebookProvider_1.NotebookProviderInfo({
                        extension: extension.description.identifier,
                        id: notebookContribution.type,
                        displayName: notebookContribution.displayName,
                        selectors: notebookContribution.selector || [],
                        priority: this._convertPriority(notebookContribution.priority),
                        providerDisplayName: extension.description.displayName ?? extension.description.identifier.value,
                        exclusive: false
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
        }
        clearEditorCache() {
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = [];
            this._memento.saveMemento();
        }
        _convertPriority(priority) {
            if (!priority) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            if (priority === notebookCommon_1.NotebookEditorPriority.default) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            return editorResolverService_1.RegisteredEditorPriority.option;
        }
        _registerContributionPoint(notebookProviderInfo) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const selector of notebookProviderInfo.selectors) {
                const globPattern = selector.include || selector;
                const notebookEditorInfo = {
                    id: notebookProviderInfo.id,
                    label: notebookProviderInfo.displayName,
                    detail: notebookProviderInfo.providerDisplayName,
                    priority: notebookProviderInfo.exclusive ? editorResolverService_1.RegisteredEditorPriority.exclusive : notebookProviderInfo.priority,
                };
                const notebookEditorOptions = {
                    canHandleDiff: () => !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized(),
                    canSupportResource: (resource) => resource.scheme === network_1.Schemas.untitled || resource.scheme === network_1.Schemas.vscodeNotebookCell || this._fileService.hasProvider(resource)
                };
                const notebookEditorInputFactory = ({ resource, options }) => {
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let notebookUri;
                    let cellOptions;
                    let preferredResource = resource;
                    if (data) {
                        // resource is a notebook cell
                        notebookUri = this.uriIdentService.asCanonicalUri(data.notebook);
                        preferredResource = data.notebook;
                        cellOptions = { resource, options };
                    }
                    else {
                        notebookUri = this.uriIdentService.asCanonicalUri(resource);
                    }
                    if (!cellOptions) {
                        cellOptions = options?.cellOptions;
                    }
                    const notebookOptions = { ...options, cellOptions };
                    const editor = notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, notebookUri, preferredResource, notebookProviderInfo.id);
                    return { editor, options: notebookOptions };
                };
                const notebookUntitledEditorFactory = async ({ resource, options }) => {
                    const ref = await this._notebookEditorModelResolverService.resolve({ untitledResource: resource }, notebookProviderInfo.id);
                    // untitled notebooks are disposed when they get saved. we should not hold a reference
                    // to such a disposed notebook and therefore dispose the reference as well
                    ref.object.notebook.onWillDispose(() => {
                        ref.dispose();
                    });
                    return { editor: notebookEditorInput_1.NotebookEditorInput.getOrCreate(this._instantiationService, ref.object.resource, undefined, notebookProviderInfo.id), options };
                };
                const notebookDiffEditorInputFactory = ({ modified, original, label, description }) => {
                    return { editor: notebookDiffEditorInput_1.NotebookDiffEditorInput.create(this._instantiationService, modified.resource, label, description, original.resource, notebookProviderInfo.id) };
                };
                const notebookFactoryObject = {
                    createEditorInput: notebookEditorInputFactory,
                    createDiffEditorInput: notebookDiffEditorInputFactory,
                    createUntitledEditorInput: notebookUntitledEditorFactory,
                };
                const notebookCellFactoryObject = {
                    createEditorInput: notebookEditorInputFactory,
                    createDiffEditorInput: notebookDiffEditorInputFactory,
                };
                // TODO @lramos15 find a better way to toggle handling diff editors than needing these listeners for every registration
                // This is a lot of event listeners especially if there are many notebooks
                disposables.add(this._configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.textDiffEditorPreview)) {
                        const canHandleDiff = !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized();
                        if (canHandleDiff) {
                            notebookFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                            notebookCellFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                        }
                        else {
                            notebookFactoryObject.createDiffEditorInput = undefined;
                            notebookCellFactoryObject.createDiffEditorInput = undefined;
                        }
                    }
                }));
                disposables.add(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                    const canHandleDiff = !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized();
                    if (canHandleDiff) {
                        notebookFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                        notebookCellFactoryObject.createDiffEditorInput = notebookDiffEditorInputFactory;
                    }
                    else {
                        notebookFactoryObject.createDiffEditorInput = undefined;
                        notebookCellFactoryObject.createDiffEditorInput = undefined;
                    }
                }));
                // Register the notebook editor
                disposables.add(this._editorResolverService.registerEditor(globPattern, notebookEditorInfo, notebookEditorOptions, notebookFactoryObject));
                // Then register the schema handler as exclusive for that notebook
                disposables.add(this._editorResolverService.registerEditor(`${network_1.Schemas.vscodeNotebookCell}:/**/${globPattern}`, { ...notebookEditorInfo, priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, notebookEditorOptions, notebookCellFactoryObject));
            }
            return disposables;
        }
        _clear() {
            this._contributedEditors.clear();
            this._contributedEditorDisposables.clear();
        }
        get(viewType) {
            return this._contributedEditors.get(viewType);
        }
        add(info) {
            if (this._contributedEditors.has(info.id)) {
                throw new Error(`notebook type '${info.id}' ALREADY EXISTS`);
            }
            this._contributedEditors.set(info.id, info);
            let editorRegistration;
            // built-in notebook providers contribute their own editors
            if (info.extension) {
                editorRegistration = this._registerContributionPoint(info);
                this._contributedEditorDisposables.add(editorRegistration);
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
            return this._register((0, lifecycle_1.toDisposable)(() => {
                const mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                mementoObject[NotebookProviderInfoStore_1.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
                this._memento.saveMemento();
                editorRegistration?.dispose();
                this._contributedEditors.delete(info.id);
            }));
        }
        getContributedNotebook(resource) {
            const result = [];
            for (const info of this._contributedEditors.values()) {
                if (info.matches(resource)) {
                    result.push(info);
                }
            }
            if (result.length === 0 && resource.scheme === network_1.Schemas.untitled) {
                // untitled resource and no path-specific match => all providers apply
                return Array.from(this._contributedEditors.values());
            }
            return result;
        }
        [Symbol.iterator]() {
            return this._contributedEditors.values();
        }
    };
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore;
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore = NotebookProviderInfoStore_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService),
        __param(2, editorResolverService_1.IEditorResolverService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, files_1.IFileService),
        __param(7, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], NotebookProviderInfoStore);
    let NotebookOutputRendererInfoStore = class NotebookOutputRendererInfoStore {
        constructor(storageService) {
            this.contributedRenderers = new Map();
            this.preferredMimetype = new lazy_1.Lazy(() => this.preferredMimetypeMemento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */));
            this.preferredMimetypeMemento = new memento_1.Memento('workbench.editor.notebook.preferredRenderer2', storageService);
        }
        clear() {
            this.contributedRenderers.clear();
        }
        get(rendererId) {
            return this.contributedRenderers.get(rendererId);
        }
        getAll() {
            return Array.from(this.contributedRenderers.values());
        }
        add(info) {
            if (this.contributedRenderers.has(info.id)) {
                return;
            }
            this.contributedRenderers.set(info.id, info);
        }
        /** Update and remember the preferred renderer for the given mimetype in this workspace */
        setPreferred(notebookProviderInfo, mimeType, rendererId) {
            const mementoObj = this.preferredMimetype.value;
            const forNotebook = mementoObj[notebookProviderInfo.id];
            if (forNotebook) {
                forNotebook[mimeType] = rendererId;
            }
            else {
                mementoObj[notebookProviderInfo.id] = { [mimeType]: rendererId };
            }
            this.preferredMimetypeMemento.saveMemento();
        }
        findBestRenderers(notebookProviderInfo, mimeType, kernelProvides) {
            let ReuseOrder;
            (function (ReuseOrder) {
                ReuseOrder[ReuseOrder["PreviouslySelected"] = 256] = "PreviouslySelected";
                ReuseOrder[ReuseOrder["SameExtensionAsNotebook"] = 512] = "SameExtensionAsNotebook";
                ReuseOrder[ReuseOrder["OtherRenderer"] = 768] = "OtherRenderer";
                ReuseOrder[ReuseOrder["BuiltIn"] = 1024] = "BuiltIn";
            })(ReuseOrder || (ReuseOrder = {}));
            const preferred = notebookProviderInfo && this.preferredMimetype.value[notebookProviderInfo.id]?.[mimeType];
            const notebookExtId = notebookProviderInfo?.extension?.value;
            const notebookId = notebookProviderInfo?.id;
            const renderers = Array.from(this.contributedRenderers.values())
                .map(renderer => {
                const ownScore = kernelProvides === undefined
                    ? renderer.matchesWithoutKernel(mimeType)
                    : renderer.matches(mimeType, kernelProvides);
                if (ownScore === 3 /* NotebookRendererMatch.Never */) {
                    return undefined;
                }
                const rendererExtId = renderer.extensionId.value;
                const reuseScore = preferred === renderer.id
                    ? 256 /* ReuseOrder.PreviouslySelected */
                    : rendererExtId === notebookExtId || notebookCommon_1.RENDERER_EQUIVALENT_EXTENSIONS.get(rendererExtId)?.has(notebookId)
                        ? 512 /* ReuseOrder.SameExtensionAsNotebook */
                        : renderer.isBuiltin ? 1024 /* ReuseOrder.BuiltIn */ : 768 /* ReuseOrder.OtherRenderer */;
                return {
                    ordered: { mimeType, rendererId: renderer.id, isTrusted: true },
                    score: reuseScore | ownScore,
                };
            }).filter(types_1.isDefined);
            if (renderers.length === 0) {
                return [{ mimeType, rendererId: notebookCommon_1.RENDERER_NOT_AVAILABLE, isTrusted: true }];
            }
            return renderers.sort((a, b) => a.score - b.score).map(r => r.ordered);
        }
    };
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore;
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotebookOutputRendererInfoStore);
    class ModelData {
        get uri() { return this.model.uri; }
        constructor(model, onWillDispose) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
        }
        getCellIndex(cellUri) {
            return this.model.cells.findIndex(cell => (0, resources_1.isEqual)(cell.uri, cellUri));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    let NotebookService = class NotebookService extends lifecycle_1.Disposable {
        static { NotebookService_1 = this; }
        static { this._storageNotebookViewTypeProvider = 'notebook.viewTypeProvider'; }
        get notebookProviderInfoStore() {
            if (!this._notebookProviderInfoStore) {
                this._notebookProviderInfoStore = this._register(this._instantiationService.createInstance(NotebookProviderInfoStore));
            }
            return this._notebookProviderInfoStore;
        }
        constructor(_extensionService, _configurationService, _accessibilityService, _instantiationService, _storageService, _notebookDocumentService) {
            super();
            this._extensionService = _extensionService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._storageService = _storageService;
            this._notebookDocumentService = _notebookDocumentService;
            this._notebookProviders = new Map();
            this._notebookProviderInfoStore = undefined;
            this._notebookRenderersInfoStore = this._instantiationService.createInstance(NotebookOutputRendererInfoStore);
            this._onDidChangeOutputRenderers = this._register(new event_1.Emitter());
            this.onDidChangeOutputRenderers = this._onDidChangeOutputRenderers.event;
            this._notebookStaticPreloadInfoStore = new Set();
            this._models = new map_1.ResourceMap();
            this._onWillAddNotebookDocument = this._register(new event_1.Emitter());
            this._onDidAddNotebookDocument = this._register(new event_1.Emitter());
            this._onWillRemoveNotebookDocument = this._register(new event_1.Emitter());
            this._onDidRemoveNotebookDocument = this._register(new event_1.Emitter());
            this.onWillAddNotebookDocument = this._onWillAddNotebookDocument.event;
            this.onDidAddNotebookDocument = this._onDidAddNotebookDocument.event;
            this.onDidRemoveNotebookDocument = this._onDidRemoveNotebookDocument.event;
            this.onWillRemoveNotebookDocument = this._onWillRemoveNotebookDocument.event;
            this._onAddViewType = this._register(new event_1.Emitter());
            this.onAddViewType = this._onAddViewType.event;
            this._onWillRemoveViewType = this._register(new event_1.Emitter());
            this.onWillRemoveViewType = this._onWillRemoveViewType.event;
            this._onDidChangeEditorTypes = this._register(new event_1.Emitter());
            this.onDidChangeEditorTypes = this._onDidChangeEditorTypes.event;
            this._lastClipboardIsCopy = true;
            notebookExtensionPoint_1.notebookRendererExtensionPoint.setHandler((renderers) => {
                this._notebookRenderersInfoStore.clear();
                for (const extension of renderers) {
                    for (const notebookContribution of extension.value) {
                        if (!notebookContribution.entrypoint) { // avoid crashing
                            extension.collector.error(`Notebook renderer does not specify entry point`);
                            continue;
                        }
                        const id = notebookContribution.id;
                        if (!id) {
                            extension.collector.error(`Notebook renderer does not specify id-property`);
                            continue;
                        }
                        this._notebookRenderersInfoStore.add(new notebookOutputRenderer_1.NotebookOutputRendererInfo({
                            id,
                            extension: extension.description,
                            entrypoint: notebookContribution.entrypoint,
                            displayName: notebookContribution.displayName,
                            mimeTypes: notebookContribution.mimeTypes || [],
                            dependencies: notebookContribution.dependencies,
                            optionalDependencies: notebookContribution.optionalDependencies,
                            requiresMessaging: notebookContribution.requiresMessaging,
                        }));
                    }
                }
                this._onDidChangeOutputRenderers.fire();
            });
            notebookExtensionPoint_1.notebookPreloadExtensionPoint.setHandler(extensions => {
                this._notebookStaticPreloadInfoStore.clear();
                for (const extension of extensions) {
                    if (!(0, extensions_1.isProposedApiEnabled)(extension.description, 'contribNotebookStaticPreloads')) {
                        continue;
                    }
                    for (const notebookContribution of extension.value) {
                        if (!notebookContribution.entrypoint) { // avoid crashing
                            extension.collector.error(`Notebook preload does not specify entry point`);
                            continue;
                        }
                        const type = notebookContribution.type;
                        if (!type) {
                            extension.collector.error(`Notebook preload does not specify type-property`);
                            continue;
                        }
                        this._notebookStaticPreloadInfoStore.add(new notebookOutputRenderer_1.NotebookStaticPreloadInfo({
                            type,
                            extension: extension.description,
                            entrypoint: notebookContribution.entrypoint,
                            localResourceRoots: notebookContribution.localResourceRoots ?? [],
                        }));
                    }
                }
            });
            const updateOrder = () => {
                this._displayOrder = new notebookCommon_1.MimeTypeDisplayOrder(this._configurationService.getValue(notebookCommon_1.NotebookSetting.displayOrder) || [], this._accessibilityService.isScreenReaderOptimized()
                    ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER
                    : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER);
            };
            updateOrder();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.displayOrder)) {
                    updateOrder();
                }
            }));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                updateOrder();
            }));
            this._memento = new memento_1.Memento(NotebookService_1._storageNotebookViewTypeProvider, this._storageService);
            this._viewTypeCache = this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        getEditorTypes() {
            return [...this.notebookProviderInfoStore].map(info => ({
                id: info.id,
                displayName: info.displayName,
                providerDisplayName: info.providerDisplayName
            }));
        }
        clearEditorCache() {
            this.notebookProviderInfoStore.clearEditorCache();
        }
        _postDocumentOpenActivation(viewType) {
            // send out activations on notebook text model creation
            this._extensionService.activateByEvent(`onNotebook:${viewType}`);
            this._extensionService.activateByEvent(`onNotebook:*`);
        }
        async canResolve(viewType) {
            if (this._notebookProviders.has(viewType)) {
                return true;
            }
            await this._extensionService.whenInstalledExtensionsRegistered();
            await this._extensionService.activateByEvent(`onNotebookSerializer:${viewType}`);
            return this._notebookProviders.has(viewType);
        }
        registerContributedNotebookType(viewType, data) {
            const info = new notebookProvider_1.NotebookProviderInfo({
                extension: data.extension,
                id: viewType,
                displayName: data.displayName,
                providerDisplayName: data.providerDisplayName,
                exclusive: data.exclusive,
                priority: editorResolverService_1.RegisteredEditorPriority.default,
                selectors: []
            });
            info.update({ selectors: data.filenamePattern });
            const reg = this.notebookProviderInfoStore.add(info);
            this._onDidChangeEditorTypes.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                reg.dispose();
                this._onDidChangeEditorTypes.fire();
            });
        }
        _registerProviderData(viewType, data) {
            if (this._notebookProviders.has(viewType)) {
                throw new Error(`notebook provider for viewtype '${viewType}' already exists`);
            }
            this._notebookProviders.set(viewType, data);
            this._onAddViewType.fire(viewType);
            return (0, lifecycle_1.toDisposable)(() => {
                this._onWillRemoveViewType.fire(viewType);
                this._notebookProviders.delete(viewType);
            });
        }
        registerNotebookSerializer(viewType, extensionData, serializer) {
            this.notebookProviderInfoStore.get(viewType)?.update({ options: serializer.options });
            this._viewTypeCache[viewType] = extensionData.id.value;
            this._persistMementos();
            return this._registerProviderData(viewType, new notebookService_1.SimpleNotebookProviderInfo(viewType, serializer, extensionData));
        }
        async withNotebookDataProvider(viewType) {
            const selected = this.notebookProviderInfoStore.get(viewType);
            if (!selected) {
                const knownProvider = this.getViewTypeProvider(viewType);
                const actions = knownProvider ? [
                    (0, actions_1.toAction)({
                        id: 'workbench.notebook.action.installMissingViewType', label: (0, nls_1.localize)('notebookOpenInstallMissingViewType', "Install extension for '{0}'", viewType), run: async () => {
                            await this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, knownProvider).run();
                        }
                    })
                ] : [];
                throw (0, errorMessage_1.createErrorWithActions)(`UNKNOWN notebook type '${viewType}'`, actions);
            }
            await this.canResolve(selected.id);
            const result = this._notebookProviders.get(selected.id);
            if (!result) {
                throw new Error(`NO provider registered for view type: '${selected.id}'`);
            }
            return result;
        }
        _persistMementos() {
            this._memento.saveMemento();
        }
        getViewTypeProvider(viewType) {
            return this._viewTypeCache[viewType];
        }
        getRendererInfo(rendererId) {
            return this._notebookRenderersInfoStore.get(rendererId);
        }
        updateMimePreferredRenderer(viewType, mimeType, rendererId, otherMimetypes) {
            const info = this.notebookProviderInfoStore.get(viewType);
            if (info) {
                this._notebookRenderersInfoStore.setPreferred(info, mimeType, rendererId);
            }
            this._displayOrder.prioritize(mimeType, otherMimetypes);
        }
        saveMimeDisplayOrder(target) {
            this._configurationService.updateValue(notebookCommon_1.NotebookSetting.displayOrder, this._displayOrder.toArray(), target);
        }
        getRenderers() {
            return this._notebookRenderersInfoStore.getAll();
        }
        *getStaticPreloads(viewType) {
            for (const preload of this._notebookStaticPreloadInfoStore) {
                if (preload.type === viewType) {
                    yield preload;
                }
            }
        }
        // --- notebook documents: create, destory, retrieve, enumerate
        createNotebookTextModel(viewType, uri, data, transientOptions) {
            if (this._models.has(uri)) {
                throw new Error(`notebook for ${uri} already exists`);
            }
            const notebookModel = this._instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri, data.cells, data.metadata, transientOptions);
            const modelData = new ModelData(notebookModel, this._onWillDisposeDocument.bind(this));
            this._models.set(uri, modelData);
            this._notebookDocumentService.addNotebookDocument(modelData);
            this._onWillAddNotebookDocument.fire(notebookModel);
            this._onDidAddNotebookDocument.fire(notebookModel);
            this._postDocumentOpenActivation(viewType);
            return notebookModel;
        }
        getNotebookTextModel(uri) {
            return this._models.get(uri)?.model;
        }
        getNotebookTextModels() {
            return iterator_1.Iterable.map(this._models.values(), data => data.model);
        }
        listNotebookDocuments() {
            return [...this._models].map(e => e[1].model);
        }
        _onWillDisposeDocument(model) {
            const modelData = this._models.get(model.uri);
            if (modelData) {
                this._onWillRemoveNotebookDocument.fire(modelData.model);
                this._models.delete(model.uri);
                this._notebookDocumentService.removeNotebookDocument(modelData);
                modelData.dispose();
                this._onDidRemoveNotebookDocument.fire(modelData.model);
            }
        }
        getOutputMimeTypeInfo(textModel, kernelProvides, output) {
            const sorted = this._displayOrder.sort(new Set(output.outputs.map(op => op.mime)));
            const notebookProviderInfo = this.notebookProviderInfoStore.get(textModel.viewType);
            return sorted
                .flatMap(mimeType => this._notebookRenderersInfoStore.findBestRenderers(notebookProviderInfo, mimeType, kernelProvides))
                .sort((a, b) => (a.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0) - (b.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0));
        }
        getContributedNotebookTypes(resource) {
            if (resource) {
                return this.notebookProviderInfoStore.getContributedNotebook(resource);
            }
            return [...this.notebookProviderInfoStore];
        }
        getContributedNotebookType(viewType) {
            return this.notebookProviderInfoStore.get(viewType);
        }
        getNotebookProviderResourceRoots() {
            const ret = [];
            this._notebookProviders.forEach(val => {
                if (val.extensionData.location) {
                    ret.push(uri_1.URI.revive(val.extensionData.location));
                }
            });
            return ret;
        }
        // --- copy & paste
        setToCopy(items, isCopy) {
            this._cutItems = items;
            this._lastClipboardIsCopy = isCopy;
        }
        getToCopy() {
            if (this._cutItems) {
                return { items: this._cutItems, isCopy: this._lastClipboardIsCopy };
            }
            return undefined;
        }
    };
    exports.NotebookService = NotebookService;
    exports.NotebookService = NotebookService = NotebookService_1 = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, accessibility_1.IAccessibilityService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, notebookDocumentService_1.INotebookDocumentService)
    ], NotebookService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va1NlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3Q3pGLElBQU0seUJBQXlCLEdBQS9CLE1BQU0seUJBQTBCLFNBQVEsc0JBQVU7O2lCQUVoQyw4QkFBeUIsR0FBRyxpQkFBaUIsQUFBcEIsQ0FBcUI7aUJBQzlDLDRCQUF1QixHQUFHLFNBQVMsQUFBWixDQUFhO1FBUTVELFlBQ2tCLGNBQStCLEVBQzdCLGdCQUFtQyxFQUM5QixzQkFBK0QsRUFDaEUscUJBQTZELEVBQzdELHFCQUE2RCxFQUM3RCxxQkFBNkQsRUFDdEUsWUFBMkMsRUFDcEIsbUNBQXlGLEVBQ3pHLGVBQXFEO1lBRTFFLEtBQUssRUFBRSxDQUFDO1lBUmlDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7WUFDL0MsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDckQsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDSCx3Q0FBbUMsR0FBbkMsbUNBQW1DLENBQXFDO1lBQ3hGLG9CQUFlLEdBQWYsZUFBZSxDQUFxQjtZQWRuRSxhQUFRLEdBQVksS0FBSyxDQUFDO1lBRWpCLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBQzlELGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQWV0RixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQU8sQ0FBQywy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