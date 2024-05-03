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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uuid", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelView", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookPerformance", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/progress/common/progress", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, DOM, actions_1, async_1, event_1, lifecycle_1, resources_1, uuid_1, textResourceConfiguration_1, nls_1, contextkey_1, files_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, editor_1, coreActions_1, notebookEditorService_1, notebookKernelView_1, notebookCommon_1, notebookEditorInput_1, notebookPerformance_1, editorGroupsService_1, editorService_1, progress_1, extensionsActions_1, notebookService_1, extensions_1, workingCopyBackup_1, buffer_1, log_1, notebookWorkerService_1, preferences_1) {
    "use strict";
    var NotebookEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditor = void 0;
    const NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'NotebookEditorViewState';
    let NotebookEditor = class NotebookEditor extends editorPane_1.EditorPane {
        static { NotebookEditor_1 = this; }
        static { this.ID = notebookCommon_1.NOTEBOOK_EDITOR_ID; }
        get onDidFocus() { return this._onDidFocusWidget.event; }
        get onDidBlur() { return this._onDidBlurWidget.event; }
        constructor(group, telemetryService, themeService, _instantiationService, storageService, _editorService, _editorGroupService, _notebookWidgetService, _contextKeyService, _fileService, configurationService, _editorProgressService, _notebookService, _extensionsWorkbenchService, _workingCopyBackupService, logService, _notebookEditorWorkerService, _preferencesService) {
            super(NotebookEditor_1.ID, group, telemetryService, themeService, storageService);
            this._instantiationService = _instantiationService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._notebookWidgetService = _notebookWidgetService;
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._editorProgressService = _editorProgressService;
            this._notebookService = _notebookService;
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._workingCopyBackupService = _workingCopyBackupService;
            this.logService = logService;
            this._notebookEditorWorkerService = _notebookEditorWorkerService;
            this._preferencesService = _preferencesService;
            this._groupListener = this._register(new lifecycle_1.DisposableStore());
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._widget = { value: undefined };
            this._inputListener = this._register(new lifecycle_1.MutableDisposable());
            // override onDidFocus and onDidBlur to be based on the NotebookEditorWidget element
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidBlurWidget = this._register(new event_1.Emitter());
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeScroll = this._register(new event_1.Emitter());
            this.onDidChangeScroll = this._onDidChangeScroll.event;
            this._editorMemento = this.getEditorMemento(_editorGroupService, configurationService, NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY);
            this._register(this._fileService.onDidChangeFileSystemProviderCapabilities(e => this._onDidChangeFileSystemProvider(e.scheme)));
            this._register(this._fileService.onDidChangeFileSystemProviderRegistrations(e => this._onDidChangeFileSystemProvider(e.scheme)));
        }
        _onDidChangeFileSystemProvider(scheme) {
            if (this.input instanceof notebookEditorInput_1.NotebookEditorInput && this.input.resource?.scheme === scheme) {
                this._updateReadonly(this.input);
            }
        }
        _onDidChangeInputCapabilities(input) {
            if (this.input === input) {
                this._updateReadonly(input);
            }
        }
        _updateReadonly(input) {
            this._widget.value?.setOptions({ isReadOnly: !!input.isReadonly() });
        }
        get textModel() {
            return this._widget.value?.textModel;
        }
        get minimumWidth() { return 220; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from EditorPane
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        //#region Editor Core
        get scopedContextKeyService() {
            return this._widget.value?.scopedContextKeyService;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-editor'));
            this._rootElement.id = `notebook-editor-element-${(0, uuid_1.generateUuid)()}`;
        }
        getActionViewItem(action, options) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                // this is being disposed by the consumer
                return this._instantiationService.createInstance(notebookKernelView_1.NotebooKernelActionViewItem, action, this, options);
            }
            return undefined;
        }
        getControl() {
            return this._widget.value;
        }
        setVisible(visible) {
            super.setVisible(visible);
            if (!visible) {
                this._widget.value?.onWillHide();
            }
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            this._groupListener.clear();
            this._groupListener.add(this.group.onWillCloseEditor(e => this._saveEditorViewState(e.editor)));
            this._groupListener.add(this.group.onDidModelChange(() => {
                if (this._editorGroupService.activeGroup !== this.group) {
                    this._widget?.value?.updateEditorFocus();
                }
            }));
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._widget.value) {
                    // the widget is not transfered to other editor inputs
                    this._widget.value.onWillHide();
                }
            }
        }
        focus() {
            super.focus();
            this._widget.value?.focus();
        }
        hasFocus() {
            const value = this._widget.value;
            if (!value) {
                return false;
            }
            return !!value && (DOM.isAncestorOfActiveElement(value.getDomNode() || DOM.isAncestorOfActiveElement(value.getOverflowContainerDomNode())));
        }
        async setInput(input, options, context, token, noRetry) {
            try {
                let perfMarksCaptured = false;
                const fileOpenMonitor = (0, async_1.timeout)(10000);
                fileOpenMonitor.then(() => {
                    perfMarksCaptured = true;
                    this._handlePerfMark(perf, input);
                });
                const perf = new notebookPerformance_1.NotebookPerfMarks();
                perf.mark('startTime');
                this._inputListener.value = input.onDidChangeCapabilities(() => this._onDidChangeInputCapabilities(input));
                this._widgetDisposableStore.clear();
                // there currently is a widget which we still own so
                // we need to hide it before getting a new widget
                this._widget.value?.onWillHide();
                this._widget = this._instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, this.group, input, undefined, this._pagePosition?.dimension, this.window);
                if (this._rootElement && this._widget.value.getDomNode()) {
                    this._rootElement.setAttribute('aria-flowto', this._widget.value.getDomNode().id || '');
                    DOM.setParentFlowTo(this._widget.value.getDomNode(), this._rootElement);
                }
                this._widgetDisposableStore.add(this._widget.value.onDidChangeModel(() => this._onDidChangeModel.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidChangeActiveCell(() => this._onDidChangeSelection.fire({ reason: 2 /* EditorPaneSelectionChangeReason.USER */ })));
                if (this._pagePosition) {
                    this._widget.value.layout(this._pagePosition.dimension, this._rootElement, this._pagePosition.position);
                }
                // only now `setInput` and yield/await. this is AFTER the actual widget is ready. This is very important
                // so that others synchronously receive a notebook editor with the correct widget being set
                await super.setInput(input, options, context, token);
                const model = await input.resolve(options, perf);
                perf.mark('inputLoaded');
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // The widget has been taken away again. This can happen when the tab has been closed while
                // loading was in progress, in particular when open the same resource as different view type.
                // When this happen, retry once
                if (!this._widget.value) {
                    if (noRetry) {
                        return undefined;
                    }
                    return this.setInput(input, options, context, token, true);
                }
                if (model === null) {
                    const knownProvider = this._notebookService.getViewTypeProvider(input.viewType);
                    if (!knownProvider) {
                        throw new Error((0, nls_1.localize)('fail.noEditor', "Cannot open resource with notebook editor type '{0}', please check if you have the right extension installed and enabled.", input.viewType));
                    }
                    await this._extensionsWorkbenchService.whenInitialized;
                    const extensionInfo = this._extensionsWorkbenchService.local.find(e => e.identifier.id === knownProvider);
                    throw (0, editor_1.createEditorOpenError)(new Error((0, nls_1.localize)('fail.noEditor.extensionMissing', "Cannot open resource with notebook editor type '{0}', please check if you have the right extension installed and enabled.", input.viewType)), [
                        (0, actions_1.toAction)({
                            id: 'workbench.notebook.action.installOrEnableMissing', label: extensionInfo
                                ? (0, nls_1.localize)('notebookOpenEnableMissingViewType', "Enable extension for '{0}'", input.viewType)
                                : (0, nls_1.localize)('notebookOpenInstallMissingViewType', "Install extension for '{0}'", input.viewType),
                            run: async () => {
                                const d = this._notebookService.onAddViewType(viewType => {
                                    if (viewType === input.viewType) {
                                        // serializer is registered, try to open again
                                        this._editorService.openEditor({ resource: input.resource });
                                        d.dispose();
                                    }
                                });
                                const extensionInfo = this._extensionsWorkbenchService.local.find(e => e.identifier.id === knownProvider);
                                try {
                                    if (extensionInfo) {
                                        await this._extensionsWorkbenchService.setEnablement(extensionInfo, extensionInfo.enablementState === 7 /* EnablementState.DisabledWorkspace */ ? 9 /* EnablementState.EnabledWorkspace */ : 8 /* EnablementState.EnabledGlobally */);
                                    }
                                    else {
                                        await this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, knownProvider).run();
                                    }
                                }
                                catch (ex) {
                                    this.logService.error(`Failed to install or enable extension ${knownProvider}`, ex);
                                    d.dispose();
                                }
                            }
                        }),
                        (0, actions_1.toAction)({
                            id: 'workbench.notebook.action.openAsText', label: (0, nls_1.localize)('notebookOpenAsText', "Open As Text"), run: async () => {
                                const backup = await this._workingCopyBackupService.resolve({ resource: input.resource, typeId: notebookCommon_1.NotebookWorkingCopyTypeIdentifier.create(input.viewType) });
                                if (backup) {
                                    // with a backup present, we must resort to opening the backup contents
                                    // as untitled text file to not show the wrong data to the user
                                    const contents = await (0, buffer_1.streamToBuffer)(backup.value);
                                    this._editorService.openEditor({ resource: undefined, contents: contents.toString() });
                                }
                                else {
                                    // without a backup present, we can open the original resource
                                    this._editorService.openEditor({ resource: input.resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id, pinned: true } });
                                }
                            }
                        })
                    ], { allowDialog: true });
                }
                this._widgetDisposableStore.add(model.notebook.onDidChangeContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
                const viewState = options?.viewState ?? this._loadNotebookEditorViewState(input);
                // We might be moving the notebook widget between groups, and these services are tied to the group
                this._widget.value.setParentContextKeyService(this._contextKeyService);
                this._widget.value.setEditorProgressService(this._editorProgressService);
                await this._widget.value.setModel(model.notebook, viewState, perf);
                const isReadOnly = !!input.isReadonly();
                await this._widget.value.setOptions({ ...options, isReadOnly });
                this._widgetDisposableStore.add(this._widget.value.onDidFocusWidget(() => this._onDidFocusWidget.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidBlurWidget(() => this._onDidBlurWidget.fire()));
                this._widgetDisposableStore.add(this._editorGroupService.createEditorDropTarget(this._widget.value.getDomNode(), {
                    containsGroup: (group) => this.group.id === group.id
                }));
                this._widgetDisposableStore.add(this._widget.value.onDidScroll(() => { this._onDidChangeScroll.fire(); }));
                perf.mark('editorLoaded');
                fileOpenMonitor.cancel();
                if (perfMarksCaptured) {
                    return;
                }
                this._handlePerfMark(perf, input);
                this._handlePromptRecommendations(model.notebook);
            }
            catch (e) {
                this.logService.warn('NotebookEditorWidget#setInput failed', e);
                if ((0, editor_1.isEditorOpenError)(e)) {
                    throw e;
                }
                // Handle case where a file is too large to open without confirmation
                if (e.fileOperationResult === 7 /* FileOperationResult.FILE_TOO_LARGE */) {
                    let message;
                    if (e instanceof files_1.TooLargeFileOperationError) {
                        message = (0, nls_1.localize)('notebookTooLargeForHeapErrorWithSize', "The notebook is not displayed in the notebook editor because it is very large ({0}).", files_1.ByteSize.formatSize(e.size));
                    }
                    else {
                        message = (0, nls_1.localize)('notebookTooLargeForHeapErrorWithoutSize', "The notebook is not displayed in the notebook editor because it is very large.");
                    }
                    throw (0, editor_1.createTooLargeFileError)(this.group, input, options, message, this._preferencesService);
                }
                const error = (0, editor_1.createEditorOpenError)(e instanceof Error ? e : new Error((e ? e.message : '')), [
                    (0, actions_1.toAction)({
                        id: 'workbench.notebook.action.openInTextEditor', label: (0, nls_1.localize)('notebookOpenInTextEditor', "Open in Text Editor"), run: async () => {
                            const activeEditorPane = this._editorService.activeEditorPane;
                            if (!activeEditorPane) {
                                return;
                            }
                            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
                            if (!activeEditorResource) {
                                return;
                            }
                            if (activeEditorResource.toString() === input.resource?.toString()) {
                                // Replace the current editor with the text editor
                                return this._editorService.openEditor({
                                    resource: activeEditorResource,
                                    options: {
                                        override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                                        pinned: true // new file gets pinned by default
                                    }
                                });
                            }
                            return;
                        }
                    })
                ], { allowDialog: true });
                throw error;
            }
        }
        _handlePerfMark(perf, input) {
            const perfMarks = perf.value;
            const startTime = perfMarks['startTime'];
            const extensionActivated = perfMarks['extensionActivated'];
            const inputLoaded = perfMarks['inputLoaded'];
            const customMarkdownLoaded = perfMarks['customMarkdownLoaded'];
            const editorLoaded = perfMarks['editorLoaded'];
            let extensionActivationTimespan = -1;
            let inputLoadingTimespan = -1;
            let webviewCommLoadingTimespan = -1;
            let customMarkdownLoadingTimespan = -1;
            let editorLoadingTimespan = -1;
            if (startTime !== undefined && extensionActivated !== undefined) {
                extensionActivationTimespan = extensionActivated - startTime;
                if (inputLoaded !== undefined) {
                    inputLoadingTimespan = inputLoaded - extensionActivated;
                    webviewCommLoadingTimespan = inputLoaded - extensionActivated; // TODO@rebornix, we don't track webview comm anymore
                }
                if (customMarkdownLoaded !== undefined) {
                    customMarkdownLoadingTimespan = customMarkdownLoaded - startTime;
                }
                if (editorLoaded !== undefined) {
                    editorLoadingTimespan = editorLoaded - startTime;
                }
            }
            this.telemetryService.publicLog2('notebook/editorOpenPerf', {
                scheme: input.resource.scheme,
                ext: (0, resources_1.extname)(input.resource),
                viewType: input.viewType,
                extensionActivated: extensionActivationTimespan,
                inputLoaded: inputLoadingTimespan,
                webviewCommLoaded: webviewCommLoadingTimespan,
                customMarkdownLoaded: customMarkdownLoadingTimespan,
                editorLoaded: editorLoadingTimespan
            });
        }
        _handlePromptRecommendations(model) {
            this._notebookEditorWorkerService.canPromptRecommendation(model.uri).then(shouldPrompt => {
                this.telemetryService.publicLog2('notebook/shouldPromptRecommendation', {
                    shouldPrompt: shouldPrompt
                });
            });
        }
        clearInput() {
            this._inputListener.clear();
            if (this._widget.value) {
                this._saveEditorViewState(this.input);
                this._widget.value.onWillHide();
            }
            super.clearInput();
        }
        setOptions(options) {
            this._widget.value?.setOptions(options);
            super.setOptions(options);
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return undefined;
            }
            this._saveEditorViewState(input);
            return this._loadNotebookEditorViewState(input);
        }
        getSelection() {
            if (this._widget.value) {
                const activeCell = this._widget.value.getActiveCell();
                if (activeCell) {
                    const cellUri = activeCell.uri;
                    return new NotebookEditorSelection(cellUri, activeCell.getSelections());
                }
            }
            return undefined;
        }
        getScrollPosition() {
            const widget = this.getControl();
            if (!widget) {
                throw new Error('Notebook widget has not yet been initialized');
            }
            return {
                scrollTop: widget.scrollTop,
                scrollLeft: 0,
            };
        }
        setScrollPosition(scrollPosition) {
            const editor = this.getControl();
            if (!editor) {
                throw new Error('Control has not yet been initialized');
            }
            editor.setScrollTop(scrollPosition.scrollTop);
        }
        _saveEditorViewState(input) {
            if (this._widget.value && input instanceof notebookEditorInput_1.NotebookEditorInput) {
                if (this._widget.value.isDisposed) {
                    return;
                }
                const state = this._widget.value.getEditorViewState();
                this._editorMemento.saveEditorState(this.group, input.resource, state);
            }
        }
        _loadNotebookEditorViewState(input) {
            const result = this._editorMemento.loadEditorState(this.group, input.resource);
            if (result) {
                return result;
            }
            // when we don't have a view state for the group/input-tuple then we try to use an existing
            // editor for the same resource.
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group.activeEditorPane !== this && group.activeEditorPane instanceof NotebookEditor_1 && group.activeEditor?.matches(input)) {
                    return group.activeEditorPane._widget.value?.getEditorViewState();
                }
            }
            return;
        }
        layout(dimension, position) {
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            this._pagePosition = { dimension, position };
            if (!this._widget.value || !(this.input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return;
            }
            if (this.input.resource.toString() !== this.textModel?.uri.toString() && this._widget.value?.hasModel()) {
                // input and widget mismatch
                // this happens when
                // 1. open document A, pin the document
                // 2. open document B
                // 3. close document B
                // 4. a layout is triggered
                return;
            }
            if (this.isVisible()) {
                this._widget.value.layout(dimension, this._rootElement, position);
            }
        }
    };
    exports.NotebookEditor = NotebookEditor;
    exports.NotebookEditor = NotebookEditor = NotebookEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, notebookEditorService_1.INotebookEditorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, files_1.IFileService),
        __param(10, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(11, progress_1.IEditorProgressService),
        __param(12, notebookService_1.INotebookService),
        __param(13, extensions_1.IExtensionsWorkbenchService),
        __param(14, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(15, log_1.ILogService),
        __param(16, notebookWorkerService_1.INotebookEditorWorkerService),
        __param(17, preferences_1.IPreferencesService)
    ], NotebookEditor);
    class NotebookEditorSelection {
        constructor(cellUri, selections) {
            this.cellUri = cellUri;
            this.selections = selections;
        }
        compare(other) {
            if (!(other instanceof NotebookEditorSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if ((0, resources_1.isEqual)(this.cellUri, other.cellUri)) {
                return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
            }
            return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
        restore(options) {
            const notebookOptions = {
                cellOptions: {
                    resource: this.cellUri,
                    options: {
                        selection: this.selections[0]
                    }
                }
            };
            Object.assign(notebookOptions, options);
            return notebookOptions;
        }
        log() {
            return this.cellUri.fragment;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvbm90ZWJvb2tFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdEaEcsTUFBTSx5Q0FBeUMsR0FBRyx5QkFBeUIsQ0FBQztJQUVyRSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsdUJBQVU7O2lCQUM3QixPQUFFLEdBQVcsbUNBQWtCLEFBQTdCLENBQThCO1FBYWhELElBQWEsVUFBVSxLQUFrQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRS9FLElBQWEsU0FBUyxLQUFrQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBVzdFLFlBQ0MsS0FBbUIsRUFDQSxnQkFBbUMsRUFDdkMsWUFBMkIsRUFDbkIscUJBQTZELEVBQ25FLGNBQStCLEVBQ2hDLGNBQStDLEVBQ3pDLG1CQUEwRCxFQUN4RCxzQkFBK0QsRUFDbkUsa0JBQXVELEVBQzdELFlBQTJDLEVBQ3RCLG9CQUF1RCxFQUNsRSxzQkFBK0QsRUFDckUsZ0JBQW1ELEVBQ3hDLDJCQUF5RSxFQUMzRSx5QkFBcUUsRUFDbkYsVUFBd0MsRUFDdkIsNEJBQTJFLEVBQ3BGLG1CQUF5RDtZQUU5RSxLQUFLLENBQUMsZ0JBQWMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQWhCeEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUVuRCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDeEIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN2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