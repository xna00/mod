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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/async", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uuid", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/contrib/suggest/browser/suggestController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/layout/browser/layoutService", "vs/platform/layout/browser/zIndexRegistry", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/browser/notebookLogger", "vs/workbench/contrib/notebook/browser/notebookViewEvents", "vs/workbench/contrib/notebook/browser/view/cellParts/cellContextKeys", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDnd", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/view/renderers/cellRenderer", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModelImpl", "vs/workbench/contrib/notebook/browser/viewModel/viewContext", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorToolbar", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorWidgetContextKeys", "vs/workbench/contrib/notebook/browser/viewParts/notebookOverviewRuler", "vs/workbench/contrib/notebook/browser/viewParts/notebookTopCellToolbar", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService", "vs/workbench/contrib/notebook/common/notebookService", "vs/editor/browser/editorExtensions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/viewModel/cellEditorOptions", "vs/workbench/browser/codeeditor", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/base/common/network", "vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController", "vs/editor/contrib/dropOrPasteInto/browser/copyPasteController", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorStickyScroll", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProvider", "vs/platform/keybinding/common/keybinding", "vs/base/browser/pixelRatio", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/webview/browser/webview.contribution", "vs/workbench/contrib/notebook/browser/notebookAccessibilityProvider", "vs/css!./media/notebook", "vs/css!./media/notebookCellChat", "vs/css!./media/notebookCellEditorHint", "vs/css!./media/notebookCellInsertToolbar", "vs/css!./media/notebookCellStatusBar", "vs/css!./media/notebookCellTitleToolbar", "vs/css!./media/notebookFocusIndicator", "vs/css!./media/notebookToolbar", "vs/css!./media/notebookDnd", "vs/css!./media/notebookFolding", "vs/css!./media/notebookCellOutput", "vs/css!./media/notebookEditorStickyScroll", "vs/css!./media/notebookKernelActionViewItem", "vs/css!./media/notebookOutline"], function (require, exports, DOM, window_1, async_1, color_1, errors_1, event_1, lifecycle_1, platform_1, resources_1, uuid_1, fontMeasurements_1, fontInfo_1, range_1, suggestController_1, nls, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, layoutService_1, zIndexRegistry_1, progress_1, telemetry_1, colorRegistry_1, theme_1, debugColors_1, notebookBrowser_1, notebookEditorExtensions_1, notebookEditorService_1, notebookLogger_1, notebookViewEvents_1, cellContextKeys_1, cellDnd_1, notebookCellList_1, backLayerWebView_1, cellRenderer_1, codeCellViewModel_1, eventDispatcher_1, markupCellViewModel_1, notebookViewModelImpl_1, viewContext_1, notebookEditorToolbar_1, notebookEditorWidgetContextKeys_1, notebookOverviewRuler_1, notebookTopCellToolbar_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookOptions_1, notebookRendererMessagingService_1, notebookService_1, editorExtensions_1, editorGroupsService_1, cellEditorOptions_1, codeeditor_1, findModel_1, notebookLoggingService_1, network_1, dropIntoEditorController_1, copyPasteController_1, notebookEditorStickyScroll_1, notebookOutlineProvider_1, keybinding_1, pixelRatio_1, codeEditorService_1, webview_contribution_1, notebookAccessibilityProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cellEditorBackground = exports.cellSymbolHighlight = exports.listScrollbarSliderActiveBackground = exports.listScrollbarSliderHoverBackground = exports.listScrollbarSliderBackground = exports.cellInsertionIndicator = exports.cellStatusBarItemHover = exports.inactiveFocusedCellBorder = exports.focusedCellBorder = exports.inactiveSelectedCellBorder = exports.selectedCellBorder = exports.cellHoverBackground = exports.selectedCellBackground = exports.focusedCellBackground = exports.CELL_TOOLBAR_SEPERATOR = exports.notebookOutputContainerColor = exports.notebookOutputContainerBorderColor = exports.cellStatusIconRunning = exports.cellStatusIconError = exports.runningCellRulerDecorationColor = exports.cellStatusIconSuccess = exports.focusedEditorBorderColor = exports.notebookCellBorder = exports.NotebookEditorWidget = void 0;
    exports.getDefaultNotebookCreationOptions = getDefaultNotebookCreationOptions;
    const $ = DOM.$;
    function getDefaultNotebookCreationOptions() {
        // We inlined the id to avoid loading comment contrib in tests
        const skipContributions = [
            'editor.contrib.review',
            codeeditor_1.FloatingEditorClickMenu.ID,
            'editor.contrib.dirtydiff',
            'editor.contrib.testingOutputPeek',
            'editor.contrib.testingDecorations',
            'store.contrib.stickyScrollController',
            'editor.contrib.findController',
            'editor.contrib.emptyTextEditorHint'
        ];
        const contributions = editorExtensions_1.EditorExtensionsRegistry.getEditorContributions().filter(c => skipContributions.indexOf(c.id) === -1);
        return {
            menuIds: {
                notebookToolbar: actions_1.MenuId.NotebookToolbar,
                cellTitleToolbar: actions_1.MenuId.NotebookCellTitle,
                cellDeleteToolbar: actions_1.MenuId.NotebookCellDelete,
                cellInsertToolbar: actions_1.MenuId.NotebookCellBetween,
                cellTopInsertToolbar: actions_1.MenuId.NotebookCellListTop,
                cellExecuteToolbar: actions_1.MenuId.NotebookCellExecute,
                cellExecutePrimary: actions_1.MenuId.NotebookCellExecutePrimary,
            },
            cellEditorContributions: contributions
        };
    }
    let NotebookEditorWidget = class NotebookEditorWidget extends lifecycle_1.Disposable {
        get isVisible() {
            return this._isVisible;
        }
        get isDisposed() {
            return this._isDisposed;
        }
        set viewModel(newModel) {
            this._onWillChangeModel.fire(this._notebookViewModel?.notebookDocument);
            this._notebookViewModel = newModel;
            this._onDidChangeModel.fire(newModel?.notebookDocument);
        }
        get viewModel() {
            return this._notebookViewModel;
        }
        get textModel() {
            return this._notebookViewModel?.notebookDocument;
        }
        get isReadOnly() {
            return this._notebookViewModel?.options.isReadOnly ?? false;
        }
        get activeCodeEditor() {
            if (this._isDisposed) {
                return;
            }
            const [focused] = this._list.getFocusedElements();
            return this._renderedEditors.get(focused);
        }
        get codeEditors() {
            return [...this._renderedEditors];
        }
        get visibleRanges() {
            return this._list.visibleRanges || [];
        }
        get notebookOptions() {
            return this._notebookOptions;
        }
        constructor(creationOptions, dimension, instantiationService, editorGroupsService, notebookRendererMessaging, notebookEditorService, notebookKernelService, _notebookService, configurationService, contextKeyService, layoutService, contextMenuService, telemetryService, notebookExecutionService, notebookExecutionStateService, editorProgressService, logService, keybindingService, codeEditorService) {
            super();
            this.creationOptions = creationOptions;
            this.notebookRendererMessaging = notebookRendererMessaging;
            this.notebookEditorService = notebookEditorService;
            this.notebookKernelService = notebookKernelService;
            this._notebookService = _notebookService;
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.notebookExecutionService = notebookExecutionService;
            this.notebookExecutionStateService = notebookExecutionStateService;
            this.editorProgressService = editorProgressService;
            this.logService = logService;
            this.keybindingService = keybindingService;
            //#region Eventing
            this._onDidChangeCellState = this._register(new event_1.Emitter());
            this.onDidChangeCellState = this._onDidChangeCellState.event;
            this._onDidChangeViewCells = this._register(new event_1.Emitter());
            this.onDidChangeViewCells = this._onDidChangeViewCells.event;
            this._onWillChangeModel = this._register(new event_1.Emitter());
            this.onWillChangeModel = this._onWillChangeModel.event;
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidAttachViewModel = this._register(new event_1.Emitter());
            this.onDidAttachViewModel = this._onDidAttachViewModel.event;
            this._onDidChangeOptions = this._register(new event_1.Emitter());
            this.onDidChangeOptions = this._onDidChangeOptions.event;
            this._onDidChangeDecorations = this._register(new event_1.Emitter());
            this.onDidChangeDecorations = this._onDidChangeDecorations.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidChangeActiveCell = this._register(new event_1.Emitter());
            this.onDidChangeActiveCell = this._onDidChangeActiveCell.event;
            this._onDidChangeFocus = this._register(new event_1.Emitter());
            this.onDidChangeFocus = this._onDidChangeFocus.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibleRanges = this._register(new event_1.Emitter());
            this.onDidChangeVisibleRanges = this._onDidChangeVisibleRanges.event;
            this._onDidFocusEmitter = this._register(new event_1.Emitter());
            this.onDidFocusWidget = this._onDidFocusEmitter.event;
            this._onDidBlurEmitter = this._register(new event_1.Emitter());
            this.onDidBlurWidget = this._onDidBlurEmitter.event;
            this._onDidChangeActiveEditor = this._register(new event_1.Emitter());
            this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
            this._onDidChangeActiveKernel = this._register(new event_1.Emitter());
            this.onDidChangeActiveKernel = this._onDidChangeActiveKernel.event;
            this._onMouseUp = this._register(new event_1.Emitter());
            this.onMouseUp = this._onMouseUp.event;
            this._onMouseDown = this._register(new event_1.Emitter());
            this.onMouseDown = this._onMouseDown.event;
            this._onDidReceiveMessage = this._register(new event_1.Emitter());
            this.onDidReceiveMessage = this._onDidReceiveMessage.event;
            this._onDidRenderOutput = this._register(new event_1.Emitter());
            this.onDidRenderOutput = this._onDidRenderOutput.event;
            this._onDidRemoveOutput = this._register(new event_1.Emitter());
            this.onDidRemoveOutput = this._onDidRemoveOutput.event;
            this._onDidResizeOutputEmitter = this._register(new event_1.Emitter());
            this.onDidResizeOutput = this._onDidResizeOutputEmitter.event;
            this._webview = null;
            this._webviewResolvePromise = null;
            this._webviewTransparentCover = null;
            this._listDelegate = null;
            this._dndController = null;
            this._listTopCellToolbar = null;
            this._renderedEditors = new Map();
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._localCellStateListeners = [];
            this._shadowElementViewInfo = null;
            this._contributions = new Map();
            this._insetModifyQueueByOutputId = new async_1.SequencerByKey();
            this._cellContextKeyManager = null;
            this._uuid = (0, uuid_1.generateUuid)();
            this._webviewFocused = false;
            this._isVisible = false;
            this._isDisposed = false;
            this._baseCellEditorOptions = new Map();
            this._debugFlag = false;
            this._backgroundMarkdownRenderRunning = false;
            this._lastCellWithEditorFocus = null;
            //#endregion
            //#region Cell operations/layout API
            this._pendingLayouts = new WeakMap();
            this._pendingOutputHeightAcks = new Map();
            this._dimension = dimension;
            this.isEmbedded = creationOptions.isEmbedded ?? false;
            this._readOnly = creationOptions.isReadOnly ?? false;
            this._notebookOptions = creationOptions.options ?? new notebookOptions_1.NotebookOptions(this.creationOptions?.codeWindow ?? window_1.mainWindow, this.configurationService, notebookExecutionStateService, codeEditorService, this._readOnly);
            this._register(this._notebookOptions);
            const eventDispatcher = this._register(new eventDispatcher_1.NotebookEventDispatcher());
            this._viewContext = new viewContext_1.ViewContext(this._notebookOptions, eventDispatcher, language => this.getBaseCellEditorOptions(language));
            this._register(this._viewContext.eventDispatcher.onDidChangeCellState(e => {
                this._onDidChangeCellState.fire(e);
            }));
            this._overlayContainer = document.createElement('div');
            this.scopedContextKeyService = this._register(contextKeyService.createScoped(this._overlayContainer));
            this.instantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
            this._register(_notebookService.onDidChangeOutputRenderers(() => {
                this._updateOutputRenderers();
            }));
            this._register(this.instantiationService.createInstance(notebookEditorWidgetContextKeys_1.NotebookEditorContextKeys, this));
            this._notebookOutline = this._register(this.instantiationService.createInstance(notebookOutlineProvider_1.NotebookCellOutlineProvider, this, 4 /* OutlineTarget.QuickPick */));
            this._register(notebookKernelService.onDidChangeSelectedNotebooks(e => {
                if ((0, resources_1.isEqual)(e.notebook, this.viewModel?.uri)) {
                    this._loadKernelPreloads();
                    this._onDidChangeActiveKernel.fire();
                }
            }));
            this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor.scrollBeyondLastLine')) {
                    this._scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
                    if (this._dimension && this._isVisible) {
                        this.layout(this._dimension);
                    }
                }
            }));
            this._register(this._notebookOptions.onDidChangeOptions(e => {
                if (e.cellStatusBarVisibility || e.cellToolbarLocation || e.cellToolbarInteraction) {
                    this._updateForNotebookConfiguration();
                }
                if (e.fontFamily) {
                    this._generateFontInfo();
                }
                if (e.compactView
                    || e.focusIndicator
                    || e.insertToolbarPosition
                    || e.cellToolbarLocation
                    || e.dragAndDropEnabled
                    || e.fontSize
                    || e.markupFontSize
                    || e.fontFamily
                    || e.insertToolbarAlignment
                    || e.outputFontSize
                    || e.outputLineHeight
                    || e.outputFontFamily
                    || e.outputWordWrap
                    || e.outputScrolling
                    || e.outputLinkifyFilePaths) {
                    this._styleElement?.remove();
                    this._createLayoutStyles();
                    this._webview?.updateOptions({
                        ...this.notebookOptions.computeWebviewOptions(),
                        fontFamily: this._generateFontFamily()
                    });
                }
                if (this._dimension && this._isVisible) {
                    this.layout(this._dimension);
                }
            }));
            const container = creationOptions.codeWindow ? this.layoutService.getContainer(creationOptions.codeWindow) : this.layoutService.mainContainer;
            this._register(editorGroupsService.getPart(container).onDidScroll(e => {
                if (!this._shadowElement || !this._isVisible) {
                    return;
                }
                this.updateShadowElement(this._shadowElement, this._dimension);
                this.layoutContainerOverShadowElement(this._dimension, this._position);
            }));
            this.notebookEditorService.addNotebookEditor(this);
            const id = (0, uuid_1.generateUuid)();
            this._overlayContainer.id = `notebook-${id}`;
            this._overlayContainer.className = 'notebookOverlay';
            this._overlayContainer.classList.add('notebook-editor');
            this._overlayContainer.style.visibility = 'hidden';
            container.appendChild(this._overlayContainer);
            this._createBody(this._overlayContainer);
            this._generateFontInfo();
            this._isVisible = true;
            this._editorFocus = notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.bindTo(this.scopedContextKeyService);
            this._outputFocus = notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.bindTo(this.scopedContextKeyService);
            this._outputInputFocus = notebookContextKeys_1.NOTEBOOK_OUPTUT_INPUT_FOCUSED.bindTo(this.scopedContextKeyService);
            this._editorEditable = notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.bindTo(this.scopedContextKeyService);
            this._cursorNavMode = notebookContextKeys_1.NOTEBOOK_CURSOR_NAVIGATION_MODE.bindTo(this.scopedContextKeyService);
            // Never display the native cut/copy context menu items in notebooks
            new contextkey_1.RawContextKey(webview_contribution_1.PreventDefaultContextMenuItemsContextKeyName, false).bindTo(this.scopedContextKeyService).set(true);
            this._editorEditable.set(!creationOptions.isReadOnly);
            let contributions;
            if (Array.isArray(this.creationOptions.contributions)) {
                contributions = this.creationOptions.contributions;
            }
            else {
                contributions = notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getEditorContributions();
            }
            for (const desc of contributions) {
                let contribution;
                try {
                    contribution = this.instantiationService.createInstance(desc.ctor, this);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                if (contribution) {
                    if (!this._contributions.has(desc.id)) {
                        this._contributions.set(desc.id, contribution);
                    }
                    else {
                        contribution.dispose();
                        throw new Error(`DUPLICATE notebook editor contribution: '${desc.id}'`);
                    }
                }
            }
            this._updateForNotebookConfiguration();
        }
        _debug(...args) {
            if (!this._debugFlag) {
                return;
            }
            (0, notebookLogger_1.notebookDebug)(...args);
        }
        /**
         * EditorId
         */
        getId() {
            return this._uuid;
        }
        getViewModel() {
            return this.viewModel;
        }
        getLength() {
            return this.viewModel?.length ?? 0;
        }
        getSelections() {
            return this.viewModel?.getSelections() ?? [];
        }
        setSelections(selections) {
            if (!this.viewModel) {
                return;
            }
            const focus = this.viewModel.getFocus();
            this.viewModel.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            });
        }
        getFocus() {
            return this.viewModel?.getFocus() ?? { start: 0, end: 0 };
        }
        setFocus(focus) {
            if (!this.viewModel) {
                return;
            }
            const selections = this.viewModel.getSelections();
            this.viewModel.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            });
        }
        getSelectionViewModels() {
            if (!this.viewModel) {
                return [];
            }
            const cellsSet = new Set();
            return this.viewModel.getSelections().map(range => this.viewModel.viewCells.slice(range.start, range.end)).reduce((a, b) => {
                b.forEach(cell => {
                    if (!cellsSet.has(cell.handle)) {
                        cellsSet.add(cell.handle);
                        a.push(cell);
                    }
                });
                return a;
            }, []);
        }
        hasModel() {
            return !!this._notebookViewModel;
        }
        showProgress() {
            this._currentProgress = this.editorProgressService.show(true);
        }
        hideProgress() {
            if (this._currentProgress) {
                this._currentProgress.done();
                this._currentProgress = undefined;
            }
        }
        //#region Editor Core
        getBaseCellEditorOptions(language) {
            const existingOptions = this._baseCellEditorOptions.get(language);
            if (existingOptions) {
                return existingOptions;
            }
            else {
                const options = new cellEditorOptions_1.BaseCellEditorOptions(this, this.notebookOptions, this.configurationService, language);
                this._baseCellEditorOptions.set(language, options);
                return options;
            }
        }
        _updateForNotebookConfiguration() {
            if (!this._overlayContainer) {
                return;
            }
            this._overlayContainer.classList.remove('cell-title-toolbar-left');
            this._overlayContainer.classList.remove('cell-title-toolbar-right');
            this._overlayContainer.classList.remove('cell-title-toolbar-hidden');
            const cellToolbarLocation = this._notebookOptions.computeCellToolbarLocation(this.viewModel?.viewType);
            this._overlayContainer.classList.add(`cell-title-toolbar-${cellToolbarLocation}`);
            const cellToolbarInteraction = this._notebookOptions.getDisplayOptions().cellToolbarInteraction;
            let cellToolbarInteractionState = 'hover';
            this._overlayContainer.classList.remove('cell-toolbar-hover');
            this._overlayContainer.classList.remove('cell-toolbar-click');
            if (cellToolbarInteraction === 'hover' || cellToolbarInteraction === 'click') {
                cellToolbarInteractionState = cellToolbarInteraction;
            }
            this._overlayContainer.classList.add(`cell-toolbar-${cellToolbarInteractionState}`);
        }
        _generateFontInfo() {
            const editorOptions = this.configurationService.getValue('editor');
            const targetWindow = DOM.getWindow(this.getDomNode());
            this._fontInfo = fontMeasurements_1.FontMeasurements.readFontInfo(targetWindow, fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(targetWindow).value));
        }
        _createBody(parent) {
            this._notebookTopToolbarContainer = document.createElement('div');
            this._notebookTopToolbarContainer.classList.add('notebook-toolbar-container');
            this._notebookTopToolbarContainer.style.display = 'none';
            DOM.append(parent, this._notebookTopToolbarContainer);
            this._notebookStickyScrollContainer = document.createElement('div');
            this._notebookStickyScrollContainer.classList.add('notebook-sticky-scroll-container');
            DOM.append(parent, this._notebookStickyScrollContainer);
            this._body = document.createElement('div');
            DOM.append(parent, this._body);
            this._body.classList.add('cell-list-container');
            this._createLayoutStyles();
            this._createCellList();
            this._notebookOverviewRulerContainer = document.createElement('div');
            this._notebookOverviewRulerContainer.classList.add('notebook-overview-ruler-container');
            this._list.scrollableElement.appendChild(this._notebookOverviewRulerContainer);
            this._registerNotebookOverviewRuler();
            this._overflowContainer = document.createElement('div');
            this._overflowContainer.classList.add('notebook-overflow-widget-container', 'monaco-editor');
            DOM.append(parent, this._overflowContainer);
        }
        _generateFontFamily() {
            return this._fontInfo?.fontFamily ?? `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`;
        }
        _createLayoutStyles() {
            this._styleElement = DOM.createStyleSheet(this._body);
            const { cellRightMargin, cellTopMargin, cellRunGutter, cellBottomMargin, codeCellLeftMargin, markdownCellGutter, markdownCellLeftMargin, markdownCellBottomMargin, markdownCellTopMargin, collapsedIndicatorHeight, focusIndicator, insertToolbarPosition, outputFontSize, focusIndicatorLeftMargin, focusIndicatorGap } = this._notebookOptions.getLayoutConfiguration();
            const { insertToolbarAlignment, compactView, fontSize } = this._notebookOptions.getDisplayOptions();
            const getCellEditorContainerLeftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
            const { bottomToolbarGap, bottomToolbarHeight } = this._notebookOptions.computeBottomToolbarDimensions(this.viewModel?.viewType);
            const styleSheets = [];
            if (!this._fontInfo) {
                this._generateFontInfo();
            }
            const fontFamily = this._generateFontFamily();
            styleSheets.push(`
		.notebook-editor {
			--notebook-cell-output-font-size: ${outputFontSize}px;
			--notebook-cell-input-preview-font-size: ${fontSize}px;
			--notebook-cell-input-preview-font-family: ${fontFamily};
		}
		`);
            if (compactView) {
                styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row div.cell.code { margin-left: ${getCellEditorContainerLeftMargin}px; }`);
            }
            else {
                styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row div.cell.code { margin-left: ${codeCellLeftMargin}px; }`);
            }
            // focus indicator
            if (focusIndicator === 'border') {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-top:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom:before,
			.monaco-workbench .notebookOverlay .monaco-list .markdown-cell-row .cell-inner-container:before,
			.monaco-workbench .notebookOverlay .monaco-list .markdown-cell-row .cell-inner-container:after {
				content: "";
				position: absolute;
				width: 100%;
				height: 1px;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-right:before {
				content: "";
				position: absolute;
				width: 1px;
				height: 100%;
				z-index: 10;
			}

			/* top border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-top:before {
				border-top: 1px solid transparent;
			}

			/* left border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left:before {
				border-left: 1px solid transparent;
			}

			/* bottom border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom:before {
				border-bottom: 1px solid transparent;
			}

			/* right border */
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-right:before {
				border-right: 1px solid transparent;
			}
			`);
                // left and right border margins
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.focused .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.code-cell-row.focused .cell-focus-indicator-right:before,
			.monaco-workbench .notebookOverlay .monaco-list.selection-multiple .monaco-list-row.code-cell-row.selected .cell-focus-indicator-left:before,
			.monaco-workbench .notebookOverlay .monaco-list.selection-multiple .monaco-list-row.code-cell-row.selected .cell-focus-indicator-right:before {
				top: -${cellTopMargin}px; height: calc(100% + ${cellTopMargin + cellBottomMargin}px)
			}`);
            }
            else {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left .codeOutput-focus-indicator {
				border-left: 3px solid transparent;
				border-radius: 4px;
				width: 0px;
				margin-left: ${focusIndicatorLeftMargin}px;
				border-color: var(--vscode-notebook-inactiveFocusedCellBorder) !important;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.focused .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-output-hover .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .markdown-cell-hover .cell-focus-indicator-left .codeOutput-focus-indicator-container,
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row:hover .cell-focus-indicator-left .codeOutput-focus-indicator-container {
				display: block;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-left .codeOutput-focus-indicator-container:hover .codeOutput-focus-indicator {
				border-left: 5px solid transparent;
				margin-left: ${focusIndicatorLeftMargin - 1}px;
			}
			`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row.focused .cell-inner-container.cell-output-focus .cell-focus-indicator-left .codeOutput-focus-indicator,
			.monaco-workbench .notebookOverlay .monaco-list:focus-within .monaco-list-row.focused .cell-inner-container .cell-focus-indicator-left .codeOutput-focus-indicator {
				border-color: var(--vscode-notebook-focusedCellBorder) !important;
			}

			.monaco-workbench .notebookOverlay .monaco-list .monaco-list-row .cell-inner-container .cell-focus-indicator-left .output-focus-indicator {
				margin-top: ${focusIndicatorGap}px;
			}
			`);
            }
            // between cell insert toolbar
            if (insertToolbarPosition === 'betweenCells' || insertToolbarPosition === 'both') {
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container { display: flex; }`);
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .view-zones .cell-list-top-cell-toolbar-container { display: flex; }`);
            }
            else {
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container { display: none; }`);
                styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .view-zones .cell-list-top-cell-toolbar-container { display: none; }`);
            }
            if (insertToolbarAlignment === 'left') {
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .action-item:first-child,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .action-item:first-child, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .action-item:first-child {
				margin-right: 0px !important;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .monaco-toolbar .action-label,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container .monaco-toolbar .action-label, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .monaco-toolbar .action-label {
				padding: 0px !important;
				justify-content: center;
				border-radius: 4px;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container,
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container, .monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container {
				align-items: flex-start;
				justify-content: left;
				margin: 0 16px 0 ${8 + codeCellLeftMargin}px;
			}`);
                styleSheets.push(`
			.monaco-workbench .notebookOverlay .cell-list-top-cell-toolbar-container,
			.notebookOverlay .cell-bottom-toolbar-container .action-item {
				border: 0px;
			}`);
            }
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .code-cell-row div.cell.code { margin-left: ${getCellEditorContainerLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row div.cell { margin-right: ${cellRightMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row > .cell-inner-container { padding-top: ${cellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .cell-inner-container { padding-bottom: ${markdownCellBottomMargin}px; padding-top: ${markdownCellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .cell-inner-container.webview-backed-markdown-cell { padding: 0; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .markdown-cell-row > .webview-backed-markdown-cell.markdown-cell-edit-mode .cell.code { padding-bottom: ${markdownCellBottomMargin}px; padding-top: ${markdownCellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .output { margin: 0px ${cellRightMargin}px 0px ${getCellEditorContainerLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .output { width: calc(100% - ${getCellEditorContainerLeftMargin + cellRightMargin}px); }`);
            // comment
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-comment-container { left: ${getCellEditorContainerLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-comment-container { width: calc(100% - ${getCellEditorContainerLeftMargin + cellRightMargin}px); }`);
            // output collapse button
            styleSheets.push(`.monaco-workbench .notebookOverlay .output .output-collapse-container .expandButton { left: -${cellRunGutter}px; }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay .output .output-collapse-container .expandButton {
			position: absolute;
			width: ${cellRunGutter}px;
			padding: 6px 0px;
		}`);
            // show more container
            styleSheets.push(`.notebookOverlay .output-show-more-container { margin: 0px ${cellRightMargin}px 0px ${getCellEditorContainerLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .output-show-more-container { width: calc(100% - ${getCellEditorContainerLeftMargin + cellRightMargin}px); }`);
            styleSheets.push(`.notebookOverlay .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row div.cell.markdown { padding-left: ${cellRunGutter}px; }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container .notebook-folding-indicator { left: ${(markdownCellGutter - 20) / 2 + markdownCellLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay > .cell-list-container .notebook-folded-hint { left: ${markdownCellGutter + markdownCellLeftMargin + 8}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row :not(.webview-backed-markdown-cell) .cell-focus-indicator-top { height: ${cellTopMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-side { bottom: ${bottomToolbarGap}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row.code-cell-row .cell-focus-indicator-left { width: ${getCellEditorContainerLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row.markdown-cell-row .cell-focus-indicator-left { width: ${codeCellLeftMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator.cell-focus-indicator-right { width: ${cellRightMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-focus-indicator-bottom { height: ${cellBottomMargin}px; }`);
            styleSheets.push(`.notebookOverlay .monaco-list .monaco-list-row .cell-shadow-container-bottom { top: ${cellBottomMargin}px; }`);
            styleSheets.push(`
			.notebookOverlay .monaco-list .monaco-list-row:has(+ .monaco-list-row.selected) .cell-focus-indicator-bottom {
				height: ${bottomToolbarGap + cellBottomMargin}px;
			}
		`);
            styleSheets.push(`
			.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .input-collapse-container .cell-collapse-preview {
				line-height: ${collapsedIndicatorHeight}px;
			}

			.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .input-collapse-container .cell-collapse-preview .monaco-tokenized-source {
				max-height: ${collapsedIndicatorHeight}px;
			}
		`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-bottom-toolbar-container .monaco-toolbar { height: ${bottomToolbarHeight}px }`);
            styleSheets.push(`.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .view-zones .cell-list-top-cell-toolbar-container .monaco-toolbar { height: ${bottomToolbarHeight}px }`);
            // cell toolbar
            styleSheets.push(`.monaco-workbench .notebookOverlay.cell-title-toolbar-right > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			right: ${cellRightMargin + 26}px;
		}
		.monaco-workbench .notebookOverlay.cell-title-toolbar-left > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			left: ${getCellEditorContainerLeftMargin + 16}px;
		}
		.monaco-workbench .notebookOverlay.cell-title-toolbar-hidden > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .cell-title-toolbar {
			display: none;
		}`);
            // cell output innert container
            styleSheets.push(`
		.monaco-workbench .notebookOverlay .output > div.foreground.output-inner-container {
			padding: ${notebookOptions_1.OutputInnerContainerTopPadding}px 8px;
		}
		.monaco-workbench .notebookOverlay > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row .output-collapse-container {
			padding: ${notebookOptions_1.OutputInnerContainerTopPadding}px 8px;
		}
		`);
            // chat
            styleSheets.push(`
		.monaco-workbench .notebookOverlay .cell-chat-part {
			margin: 0 ${cellRightMargin}px 6px 4px;
		}
		`);
            this._styleElement.textContent = styleSheets.join('\n');
        }
        _createCellList() {
            this._body.classList.add('cell-list-container');
            this._dndController = this._register(new cellDnd_1.CellDragAndDropController(this, this._body));
            const getScopedContextKeyService = (container) => this._list.contextKeyService.createScoped(container);
            const renderers = [
                this.instantiationService.createInstance(cellRenderer_1.CodeCellRenderer, this, this._renderedEditors, this._dndController, getScopedContextKeyService),
                this.instantiationService.createInstance(cellRenderer_1.MarkupCellRenderer, this, this._dndController, this._renderedEditors, getScopedContextKeyService),
            ];
            renderers.forEach(renderer => {
                this._register(renderer);
            });
            this._listDelegate = this.instantiationService.createInstance(cellRenderer_1.NotebookCellListDelegate, DOM.getWindow(this.getDomNode()));
            this._register(this._listDelegate);
            const accessibilityProvider = new notebookAccessibilityProvider_1.NotebookAccessibilityProvider(this.notebookExecutionStateService, () => this.viewModel, this.keybindingService, this.configurationService);
            this._register(accessibilityProvider);
            this._list = this.instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', this._body, this._viewContext.notebookOptions, this._listDelegate, renderers, this.scopedContextKeyService, {
                setRowLineHeight: false,
                setRowHeight: false,
                supportDynamicHeights: true,
                horizontalScrolling: false,
                keyboardSupport: false,
                mouseSupport: true,
                multipleSelectionSupport: true,
                selectionNavigation: true,
                typeNavigationEnabled: true,
                paddingTop: 0,
                paddingBottom: 0,
                transformOptimization: false, //(isMacintosh && isNative) || getTitleBarStyle(this.configurationService, this.environmentService) === 'native',
                initialSize: this._dimension,
                styleController: (_suffix) => { return this._list; },
                overrideStyles: {
                    listBackground: notebookEditorBackground,
                    listActiveSelectionBackground: notebookEditorBackground,
                    listActiveSelectionForeground: colorRegistry_1.foreground,
                    listFocusAndSelectionBackground: notebookEditorBackground,
                    listFocusAndSelectionForeground: colorRegistry_1.foreground,
                    listFocusBackground: notebookEditorBackground,
                    listFocusForeground: colorRegistry_1.foreground,
                    listHoverForeground: colorRegistry_1.foreground,
                    listHoverBackground: notebookEditorBackground,
                    listHoverOutline: colorRegistry_1.focusBorder,
                    listFocusOutline: colorRegistry_1.focusBorder,
                    listInactiveSelectionBackground: notebookEditorBackground,
                    listInactiveSelectionForeground: colorRegistry_1.foreground,
                    listInactiveFocusBackground: notebookEditorBackground,
                    listInactiveFocusOutline: notebookEditorBackground,
                },
                accessibilityProvider
            });
            this._dndController.setList(this._list);
            // create Webview
            this._register(this._list);
            this._listViewInfoAccessor = new notebookCellList_1.ListViewInfoAccessor(this._list);
            this._register(this._listViewInfoAccessor);
            this._register((0, lifecycle_1.combinedDisposable)(...renderers));
            // top cell toolbar
            this._listTopCellToolbar = this._register(this.instantiationService.createInstance(notebookTopCellToolbar_1.ListTopCellToolbar, this, this.notebookOptions));
            // transparent cover
            this._webviewTransparentCover = DOM.append(this._list.rowsContainer, $('.webview-cover'));
            this._webviewTransparentCover.style.display = 'none';
            this._register(DOM.addStandardDisposableGenericMouseDownListener(this._overlayContainer, (e) => {
                if (e.target.classList.contains('slider') && this._webviewTransparentCover) {
                    this._webviewTransparentCover.style.display = 'block';
                }
            }));
            this._register(DOM.addStandardDisposableGenericMouseUpListener(this._overlayContainer, () => {
                if (this._webviewTransparentCover) {
                    // no matter when
                    this._webviewTransparentCover.style.display = 'none';
                }
            }));
            this._register(this._list.onMouseDown(e => {
                if (e.element) {
                    this._onMouseDown.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onMouseUp(e => {
                if (e.element) {
                    this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onDidChangeFocus(_e => {
                this._onDidChangeActiveEditor.fire(this);
                this._onDidChangeActiveCell.fire();
                this._onDidChangeFocus.fire();
                this._cursorNavMode.set(false);
            }));
            this._register(this._list.onContextMenu(e => {
                this.showListContextMenu(e);
            }));
            this._register(this._list.onDidChangeVisibleRanges(() => {
                this._onDidChangeVisibleRanges.fire();
            }));
            this._register(this._list.onDidScroll((e) => {
                if (e.scrollTop !== e.oldScrollTop) {
                    this._onDidScroll.fire();
                    this.clearActiveCellWidgets();
                }
            }));
            this._focusTracker = this._register(DOM.trackFocus(this.getDomNode()));
            this._register(this._focusTracker.onDidBlur(() => {
                this._editorFocus.set(false);
                this.viewModel?.setEditorFocus(false);
                this._onDidBlurEmitter.fire();
            }));
            this._register(this._focusTracker.onDidFocus(() => {
                this._editorFocus.set(true);
                this.viewModel?.setEditorFocus(true);
                this._onDidFocusEmitter.fire();
            }));
            this._registerNotebookActionsToolbar();
            this._registerNotebookStickyScroll();
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("accessibility.verbosity.notebook" /* AccessibilityVerbositySettingId.Notebook */)) {
                    this._list.ariaLabel = accessibilityProvider?.getWidgetAriaLabel();
                }
            }));
        }
        showListContextMenu(e) {
            this.contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.NotebookCellTitle,
                contextKeyService: this.scopedContextKeyService,
                getAnchor: () => e.anchor
            });
        }
        _registerNotebookOverviewRuler() {
            this._notebookOverviewRuler = this._register(this.instantiationService.createInstance(notebookOverviewRuler_1.NotebookOverviewRuler, this, this._notebookOverviewRulerContainer));
        }
        _registerNotebookActionsToolbar() {
            this._notebookTopToolbar = this._register(this.instantiationService.createInstance(notebookEditorToolbar_1.NotebookEditorWorkbenchToolbar, this, this.scopedContextKeyService, this._notebookOptions, this._notebookTopToolbarContainer));
            this._register(this._notebookTopToolbar.onDidChangeVisibility(() => {
                if (this._dimension && this._isVisible) {
                    this.layout(this._dimension);
                }
            }));
        }
        _registerNotebookStickyScroll() {
            this._notebookStickyScroll = this._register(this.instantiationService.createInstance(notebookEditorStickyScroll_1.NotebookStickyScroll, this._notebookStickyScrollContainer, this, this._notebookOutline, this._list));
            const localDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookStickyScroll.onDidChangeNotebookStickyScroll((sizeDelta) => {
                const d = localDisposableStore.add(DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this.getDomNode()), () => {
                    if (this.isDisposed) {
                        return;
                    }
                    if (this._dimension && this._isVisible) {
                        if (sizeDelta > 0) { // delta > 0 ==> sticky is growing, cell list shrinking
                            this.layout(this._dimension);
                            this.setScrollTop(this.scrollTop + sizeDelta);
                        }
                        else if (sizeDelta < 0) { // delta < 0 ==> sticky is shrinking, cell list growing
                            this.setScrollTop(this.scrollTop + sizeDelta);
                            this.layout(this._dimension);
                        }
                    }
                    localDisposableStore.delete(d);
                }));
            }));
        }
        _updateOutputRenderers() {
            if (!this.viewModel || !this._webview) {
                return;
            }
            this._webview.updateOutputRenderers();
            this.viewModel.viewCells.forEach(cell => {
                cell.outputsViewModels.forEach(output => {
                    if (output.pickedMimeType?.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE) {
                        output.resetRenderer();
                    }
                });
            });
        }
        getDomNode() {
            return this._overlayContainer;
        }
        getOverflowContainerDomNode() {
            return this._overflowContainer;
        }
        getInnerWebview() {
            return this._webview?.webview;
        }
        setEditorProgressService(editorProgressService) {
            this.editorProgressService = editorProgressService;
        }
        setParentContextKeyService(parentContextKeyService) {
            this.scopedContextKeyService.updateParent(parentContextKeyService);
        }
        async setModel(textModel, viewState, perf) {
            if (this.viewModel === undefined || !this.viewModel.equal(textModel)) {
                const oldBottomToolbarDimensions = this._notebookOptions.computeBottomToolbarDimensions(this.viewModel?.viewType);
                this._detachModel();
                await this._attachModel(textModel, viewState, perf);
                const newBottomToolbarDimensions = this._notebookOptions.computeBottomToolbarDimensions(this.viewModel?.viewType);
                if (oldBottomToolbarDimensions.bottomToolbarGap !== newBottomToolbarDimensions.bottomToolbarGap
                    || oldBottomToolbarDimensions.bottomToolbarHeight !== newBottomToolbarDimensions.bottomToolbarHeight) {
                    this._styleElement?.remove();
                    this._createLayoutStyles();
                    this._webview?.updateOptions({
                        ...this.notebookOptions.computeWebviewOptions(),
                        fontFamily: this._generateFontFamily()
                    });
                }
                this.telemetryService.publicLog2('notebook/editorOpened', {
                    scheme: textModel.uri.scheme,
                    ext: (0, resources_1.extname)(textModel.uri),
                    viewType: textModel.viewType
                });
            }
            else {
                this.restoreListViewState(viewState);
            }
            this._restoreSelectedKernel(viewState);
            // load preloads for matching kernel
            this._loadKernelPreloads();
            // clear state
            this._dndController?.clearGlobalDragState();
            this._localStore.add(this._list.onDidChangeFocus(() => {
                this.updateContextKeysOnFocusChange();
            }));
            this.updateContextKeysOnFocusChange();
            // render markdown top down on idle
            this._backgroundMarkdownRendering();
        }
        _backgroundMarkdownRendering() {
            if (this._backgroundMarkdownRenderRunning) {
                return;
            }
            this._backgroundMarkdownRenderRunning = true;
            DOM.runWhenWindowIdle(DOM.getWindow(this.getDomNode()), (deadline) => {
                this._backgroundMarkdownRenderingWithDeadline(deadline);
            });
        }
        _backgroundMarkdownRenderingWithDeadline(deadline) {
            const endTime = Date.now() + deadline.timeRemaining();
            const execute = () => {
                try {
                    this._backgroundMarkdownRenderRunning = true;
                    if (this._isDisposed) {
                        return;
                    }
                    if (!this.viewModel) {
                        return;
                    }
                    const firstMarkupCell = this.viewModel.viewCells.find(cell => cell.cellKind === notebookCommon_1.CellKind.Markup && !this._webview?.markupPreviewMapping.has(cell.id) && !this.cellIsHidden(cell));
                    if (!firstMarkupCell) {
                        return;
                    }
                    this.createMarkupPreview(firstMarkupCell);
                }
                finally {
                    this._backgroundMarkdownRenderRunning = false;
                }
                if (Date.now() < endTime) {
                    (0, platform_1.setTimeout0)(execute);
                }
                else {
                    this._backgroundMarkdownRendering();
                }
            };
            execute();
        }
        updateContextKeysOnFocusChange() {
            if (!this.viewModel) {
                return;
            }
            const focused = this._list.getFocusedElements()[0];
            if (focused) {
                if (!this._cellContextKeyManager) {
                    this._cellContextKeyManager = this._localStore.add(this.instantiationService.createInstance(cellContextKeys_1.CellContextKeyManager, this, focused));
                }
                this._cellContextKeyManager.updateForElement(focused);
            }
        }
        async setOptions(options) {
            if (options?.isReadOnly !== undefined) {
                this._readOnly = options?.isReadOnly;
            }
            if (!this.viewModel) {
                return;
            }
            this.viewModel.updateOptions({ isReadOnly: this._readOnly });
            this.notebookOptions.updateOptions(this._readOnly);
            // reveal cell if editor options tell to do so
            const cellOptions = options?.cellOptions ?? this._parseIndexedCellOptions(options);
            if (cellOptions) {
                const cell = this.viewModel.viewCells.find(cell => cell.uri.toString() === cellOptions.resource.toString());
                if (cell) {
                    this.focusElement(cell);
                    const selection = cellOptions.options?.selection;
                    if (selection) {
                        cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'setOptions');
                        cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                        await this.revealRangeInCenterIfOutsideViewportAsync(cell, new range_1.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber || selection.startLineNumber, selection.endColumn || selection.startColumn));
                    }
                    else {
                        this._list.revealCell(cell, options?.cellRevealType ?? 4 /* CellRevealType.CenterIfOutsideViewport */);
                    }
                    const editor = this._renderedEditors.get(cell);
                    if (editor) {
                        if (cellOptions.options?.selection) {
                            const { selection } = cellOptions.options;
                            const editorSelection = new range_1.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber || selection.startLineNumber, selection.endColumn || selection.startColumn);
                            editor.setSelection(editorSelection);
                            editor.revealPositionInCenterIfOutsideViewport({
                                lineNumber: selection.startLineNumber,
                                column: selection.startColumn
                            });
                            await this.revealRangeInCenterIfOutsideViewportAsync(cell, editorSelection);
                        }
                        if (!cellOptions.options?.preserveFocus) {
                            editor.focus();
                        }
                    }
                }
            }
            // select cells if options tell to do so
            // todo@rebornix https://github.com/microsoft/vscode/issues/118108 support selections not just focus
            // todo@rebornix support multipe selections
            if (options?.cellSelections) {
                const focusCellIndex = options.cellSelections[0].start;
                const focusedCell = this.viewModel.cellAt(focusCellIndex);
                if (focusedCell) {
                    this.viewModel.updateSelectionsState({
                        kind: notebookCommon_1.SelectionStateType.Index,
                        focus: { start: focusCellIndex, end: focusCellIndex + 1 },
                        selections: options.cellSelections
                    });
                    this.revealInCenterIfOutsideViewport(focusedCell);
                }
            }
            this._updateForOptions();
            this._onDidChangeOptions.fire();
        }
        _parseIndexedCellOptions(options) {
            if (options?.indexedCellOptions) {
                // convert index based selections
                const cell = this.cellAt(options.indexedCellOptions.index);
                if (cell) {
                    return {
                        resource: cell.uri,
                        options: {
                            selection: options.indexedCellOptions.selection,
                            preserveFocus: false
                        }
                    };
                }
            }
            return undefined;
        }
        _detachModel() {
            this._localStore.clear();
            (0, lifecycle_1.dispose)(this._localCellStateListeners);
            this._list.detachViewModel();
            this.viewModel?.dispose();
            // avoid event
            this.viewModel = undefined;
            this._webview?.dispose();
            this._webview?.element.remove();
            this._webview = null;
            this._list.clear();
        }
        _updateForOptions() {
            if (!this.viewModel) {
                return;
            }
            this._editorEditable.set(!this.viewModel.options.isReadOnly);
            this._overflowContainer.classList.toggle('notebook-editor-editable', !this.viewModel.options.isReadOnly);
            this.getDomNode().classList.toggle('notebook-editor-editable', !this.viewModel.options.isReadOnly);
        }
        async _resolveWebview() {
            if (!this.textModel) {
                return null;
            }
            if (this._webviewResolvePromise) {
                return this._webviewResolvePromise;
            }
            if (!this._webview) {
                this._ensureWebview(this.getId(), this.textModel.viewType, this.textModel.uri);
            }
            this._webviewResolvePromise = (async () => {
                if (!this._webview) {
                    throw new Error('Notebook output webview object is not created successfully.');
                }
                await this._webview.createWebview(this.creationOptions.codeWindow ?? window_1.mainWindow);
                if (!this._webview.webview) {
                    throw new Error('Notebook output webview element was not created successfully.');
                }
                this._localStore.add(this._webview.webview.onDidBlur(() => {
                    this._outputFocus.set(false);
                    this._webviewFocused = false;
                    this.updateEditorFocus();
                    this.updateCellFocusMode();
                }));
                this._localStore.add(this._webview.webview.onDidFocus(() => {
                    this._outputFocus.set(true);
                    this.updateEditorFocus();
                    this._webviewFocused = true;
                }));
                this._localStore.add(this._webview.onMessage(e => {
                    this._onDidReceiveMessage.fire(e);
                }));
                return this._webview;
            })();
            return this._webviewResolvePromise;
        }
        _ensureWebview(id, viewType, resource) {
            if (this._webview) {
                return;
            }
            const that = this;
            this._webview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, {
                get creationOptions() { return that.creationOptions; },
                setScrollTop(scrollTop) { that._list.scrollTop = scrollTop; },
                triggerScroll(event) { that._list.triggerScrollFromMouseWheelEvent(event); },
                getCellByInfo: that.getCellByInfo.bind(that),
                getCellById: that._getCellById.bind(that),
                toggleNotebookCellSelection: that._toggleNotebookCellSelection.bind(that),
                focusNotebookCell: that.focusNotebookCell.bind(that),
                focusNextNotebookCell: that.focusNextNotebookCell.bind(that),
                updateOutputHeight: that._updateOutputHeight.bind(that),
                scheduleOutputHeightAck: that._scheduleOutputHeightAck.bind(that),
                updateMarkupCellHeight: that._updateMarkupCellHeight.bind(that),
                setMarkupCellEditState: that._setMarkupCellEditState.bind(that),
                didStartDragMarkupCell: that._didStartDragMarkupCell.bind(that),
                didDragMarkupCell: that._didDragMarkupCell.bind(that),
                didDropMarkupCell: that._didDropMarkupCell.bind(that),
                didEndDragMarkupCell: that._didEndDragMarkupCell.bind(that),
                didResizeOutput: that._didResizeOutput.bind(that),
                updatePerformanceMetadata: that._updatePerformanceMetadata.bind(that),
                didFocusOutputInputChange: that._didFocusOutputInputChange.bind(that),
            }, id, viewType, resource, {
                ...this._notebookOptions.computeWebviewOptions(),
                fontFamily: this._generateFontFamily()
            }, this.notebookRendererMessaging.getScoped(this._uuid));
            this._webview.element.style.width = '100%';
            // attach the webview container to the DOM tree first
            this._list.attachWebview(this._webview.element);
        }
        async _attachModel(textModel, viewState, perf) {
            this._ensureWebview(this.getId(), textModel.viewType, textModel.uri);
            this.viewModel = this.instantiationService.createInstance(notebookViewModelImpl_1.NotebookViewModel, textModel.viewType, textModel, this._viewContext, this.getLayoutInfo(), { isReadOnly: this._readOnly });
            this._viewContext.eventDispatcher.emit([new notebookViewEvents_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
            this.notebookOptions.updateOptions(this._readOnly);
            this._updateForOptions();
            this._updateForNotebookConfiguration();
            // restore view states, including contributions
            {
                // restore view state
                this.viewModel.restoreEditorViewState(viewState);
                // contribution state restore
                const contributionsState = viewState?.contributionsState || {};
                for (const [id, contribution] of this._contributions) {
                    if (typeof contribution.restoreViewState === 'function') {
                        contribution.restoreViewState(contributionsState[id]);
                    }
                }
            }
            this._localStore.add(this.viewModel.onDidChangeViewCells(e => {
                this._onDidChangeViewCells.fire(e);
            }));
            this._localStore.add(this.viewModel.onDidChangeSelection(() => {
                this._onDidChangeSelection.fire();
                this.updateSelectedMarkdownPreviews();
            }));
            this._localStore.add(this._list.onWillScroll(e => {
                if (this._webview?.isResolved()) {
                    this._webviewTransparentCover.style.transform = `translateY(${e.scrollTop})`;
                }
            }));
            let hasPendingChangeContentHeight = false;
            this._localStore.add(this._list.onDidChangeContentHeight(() => {
                if (hasPendingChangeContentHeight) {
                    return;
                }
                hasPendingChangeContentHeight = true;
                this._localStore.add(DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this.getDomNode()), () => {
                    hasPendingChangeContentHeight = false;
                    this._updateScrollHeight();
                }, 100));
            }));
            this._localStore.add(this._list.onDidRemoveOutputs(outputs => {
                outputs.forEach(output => this.removeInset(output));
            }));
            this._localStore.add(this._list.onDidHideOutputs(outputs => {
                outputs.forEach(output => this.hideInset(output));
            }));
            this._localStore.add(this._list.onDidRemoveCellsFromView(cells => {
                const hiddenCells = [];
                const deletedCells = [];
                for (const cell of cells) {
                    if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        const mdCell = cell;
                        if (this.viewModel?.viewCells.find(cell => cell.handle === mdCell.handle)) {
                            // Cell has been folded but is still in model
                            hiddenCells.push(mdCell);
                        }
                        else {
                            // Cell was deleted
                            deletedCells.push(mdCell);
                        }
                    }
                }
                this.hideMarkupPreviews(hiddenCells);
                this.deleteMarkupPreviews(deletedCells);
            }));
            // init rendering
            await this._warmupWithMarkdownRenderer(this.viewModel, viewState);
            perf?.mark('customMarkdownLoaded');
            // model attached
            this._localCellStateListeners = this.viewModel.viewCells.map(cell => this._bindCellListener(cell));
            this._lastCellWithEditorFocus = this.viewModel.viewCells.find(viewCell => this.getActiveCell() === viewCell && viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) ?? null;
            this._localStore.add(this.viewModel.onDidChangeViewCells((e) => {
                if (this._isDisposed) {
                    return;
                }
                // update cell listener
                [...e.splices].reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCells = this._localCellStateListeners.splice(start, deleted, ...newCells.map(cell => this._bindCellListener(cell)));
                    (0, lifecycle_1.dispose)(deletedCells);
                });
                if (e.splices.some(s => s[2].some(cell => cell.cellKind === notebookCommon_1.CellKind.Markup))) {
                    this._backgroundMarkdownRendering();
                }
            }));
            if (this._dimension) {
                this._list.layout(this.getBodyHeight(this._dimension.height), this._dimension.width);
            }
            else {
                this._list.layout();
            }
            this._dndController?.clearGlobalDragState();
            // restore list state at last, it must be after list layout
            this.restoreListViewState(viewState);
        }
        _bindCellListener(cell) {
            const store = new lifecycle_1.DisposableStore();
            store.add(cell.onDidChangeLayout(e => {
                // e.totalHeight will be false it's not changed
                if (e.totalHeight || e.outerWidth) {
                    this.layoutNotebookCell(cell, cell.layoutInfo.totalHeight, e.context);
                }
            }));
            if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                store.add(cell.onDidRemoveOutputs((outputs) => {
                    outputs.forEach(output => this.removeInset(output));
                }));
            }
            store.add(cell.onDidChangeState(e => {
                if (e.inputCollapsedChanged && cell.isInputCollapsed && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    this.hideMarkupPreviews([cell]);
                }
                if (e.outputCollapsedChanged && cell.isOutputCollapsed && cell.cellKind === notebookCommon_1.CellKind.Code) {
                    cell.outputsViewModels.forEach(output => this.hideInset(output));
                }
                if (e.focusModeChanged) {
                    this._validateCellFocusMode(cell);
                }
            }));
            return store;
        }
        _validateCellFocusMode(cell) {
            if (cell.focusMode !== notebookBrowser_1.CellFocusMode.Editor) {
                return;
            }
            if (this._lastCellWithEditorFocus && this._lastCellWithEditorFocus !== cell) {
                this._lastCellWithEditorFocus.focusMode = notebookBrowser_1.CellFocusMode.Container;
            }
            this._lastCellWithEditorFocus = cell;
        }
        async _warmupWithMarkdownRenderer(viewModel, viewState) {
            this.logService.debug('NotebookEditorWidget', 'warmup ' + this.viewModel?.uri.toString());
            await this._resolveWebview();
            this.logService.debug('NotebookEditorWidget', 'warmup - webview resolved');
            // make sure that the webview is not visible otherwise users will see pre-rendered markdown cells in wrong position as the list view doesn't have a correct `top` offset yet
            this._webview.element.style.visibility = 'hidden';
            // warm up can take around 200ms to load markdown libraries, etc.
            await this._warmupViewportMarkdownCells(viewModel, viewState);
            this.logService.debug('NotebookEditorWidget', 'warmup - viewport warmed up');
            // todo@rebornix @mjbvz, is this too complicated?
            /* now the webview is ready, and requests to render markdown are fast enough
             * we can start rendering the list view
             * render
             *   - markdown cell -> request to webview to (10ms, basically just latency between UI and iframe)
             *   - code cell -> render in place
             */
            this._list.layout(0, 0);
            this._list.attachViewModel(viewModel);
            // now the list widget has a correct contentHeight/scrollHeight
            // setting scrollTop will work properly
            // after setting scroll top, the list view will update `top` of the scrollable element, e.g. `top: -584px`
            this._list.scrollTop = viewState?.scrollPosition?.top ?? 0;
            this._debug('finish initial viewport warmup and view state restore.');
            this._webview.element.style.visibility = 'visible';
            this.logService.debug('NotebookEditorWidget', 'warmup - list view model attached, set to visible');
            this._onDidAttachViewModel.fire();
        }
        async _warmupViewportMarkdownCells(viewModel, viewState) {
            if (viewState && viewState.cellTotalHeights) {
                const totalHeightCache = viewState.cellTotalHeights;
                const scrollTop = viewState.scrollPosition?.top ?? 0;
                const scrollBottom = scrollTop + Math.max(this._dimension?.height ?? 0, 1080);
                let offset = 0;
                const requests = [];
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    const cellHeight = totalHeightCache[i] ?? 0;
                    if (offset + cellHeight < scrollTop) {
                        offset += cellHeight;
                        continue;
                    }
                    if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        requests.push([cell, offset]);
                    }
                    offset += cellHeight;
                    if (offset > scrollBottom) {
                        break;
                    }
                }
                await this._webview.initializeMarkup(requests.map(([model, offset]) => this.createMarkupCellInitialization(model, offset)));
            }
            else {
                const initRequests = viewModel.viewCells
                    .filter(cell => cell.cellKind === notebookCommon_1.CellKind.Markup)
                    .slice(0, 5)
                    .map(cell => this.createMarkupCellInitialization(cell, -10000));
                await this._webview.initializeMarkup(initRequests);
                // no cached view state so we are rendering the first viewport
                // after above async call, we already get init height for markdown cells, we can update their offset
                let offset = 0;
                const offsetUpdateRequests = [];
                const scrollBottom = Math.max(this._dimension?.height ?? 0, 1080);
                for (const cell of viewModel.viewCells) {
                    if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        offsetUpdateRequests.push({ id: cell.id, top: offset });
                    }
                    offset += cell.getHeight(this.getLayoutInfo().fontInfo.lineHeight);
                    if (offset > scrollBottom) {
                        break;
                    }
                }
                this._webview?.updateScrollTops([], offsetUpdateRequests);
            }
        }
        createMarkupCellInitialization(model, offset) {
            return ({
                mime: model.mime,
                cellId: model.id,
                cellHandle: model.handle,
                content: model.getText(),
                offset: offset,
                visible: false,
                metadata: model.metadata,
            });
        }
        restoreListViewState(viewState) {
            if (!this.viewModel) {
                return;
            }
            if (viewState?.scrollPosition !== undefined) {
                this._list.scrollTop = viewState.scrollPosition.top;
                this._list.scrollLeft = viewState.scrollPosition.left;
            }
            else {
                this._list.scrollTop = 0;
                this._list.scrollLeft = 0;
            }
            const focusIdx = typeof viewState?.focus === 'number' ? viewState.focus : 0;
            if (focusIdx < this.viewModel.length) {
                const element = this.viewModel.cellAt(focusIdx);
                if (element) {
                    this.viewModel?.updateSelectionsState({
                        kind: notebookCommon_1.SelectionStateType.Handle,
                        primary: element.handle,
                        selections: [element.handle]
                    });
                }
            }
            else if (this._list.length > 0) {
                this.viewModel.updateSelectionsState({
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: { start: 0, end: 1 },
                    selections: [{ start: 0, end: 1 }]
                });
            }
            if (viewState?.editorFocused) {
                const cell = this.viewModel.cellAt(focusIdx);
                if (cell) {
                    cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                }
            }
        }
        _restoreSelectedKernel(viewState) {
            if (viewState?.selectedKernelId && this.textModel) {
                const matching = this.notebookKernelService.getMatchingKernel(this.textModel);
                const kernel = matching.all.find(k => k.id === viewState.selectedKernelId);
                // Selected kernel may have already been picked prior to the view state loading
                // If so, don't overwrite it with the saved kernel.
                if (kernel && !matching.selected) {
                    this.notebookKernelService.selectKernelForNotebook(kernel, this.textModel);
                }
            }
        }
        getEditorViewState() {
            const state = this.viewModel?.getEditorViewState();
            if (!state) {
                return {
                    editingCells: {},
                    cellLineNumberStates: {},
                    editorViewStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                };
            }
            if (this._list) {
                state.scrollPosition = { left: this._list.scrollLeft, top: this._list.scrollTop };
                const cellHeights = {};
                for (let i = 0; i < this.viewModel.length; i++) {
                    const elm = this.viewModel.cellAt(i);
                    cellHeights[i] = elm.layoutInfo.totalHeight;
                }
                state.cellTotalHeights = cellHeights;
                if (this.viewModel) {
                    const focusRange = this.viewModel.getFocus();
                    const element = this.viewModel.cellAt(focusRange.start);
                    if (element) {
                        const itemDOM = this._list.domElementOfElement(element);
                        const editorFocused = element.getEditState() === notebookBrowser_1.CellEditState.Editing && !!(itemDOM && itemDOM.ownerDocument.activeElement && itemDOM.contains(itemDOM.ownerDocument.activeElement));
                        state.editorFocused = editorFocused;
                        state.focus = focusRange.start;
                    }
                }
            }
            // Save contribution view states
            const contributionsState = {};
            for (const [id, contribution] of this._contributions) {
                if (typeof contribution.saveViewState === 'function') {
                    contributionsState[id] = contribution.saveViewState();
                }
            }
            state.contributionsState = contributionsState;
            if (this.textModel?.uri.scheme === network_1.Schemas.untitled) {
                state.selectedKernelId = this.activeKernel?.id;
            }
            return state;
        }
        _allowScrollBeyondLastLine() {
            return this._scrollBeyondLastLine && !this.isEmbedded;
        }
        getBodyHeight(dimensionHeight) {
            return Math.max(dimensionHeight - (this._notebookTopToolbar?.useGlobalToolbar ? /** Toolbar height */ 26 : 0), 0);
        }
        layout(dimension, shadowElement, position) {
            if (!shadowElement && this._shadowElementViewInfo === null) {
                this._dimension = dimension;
                this._position = position;
                return;
            }
            if (dimension.width <= 0 || dimension.height <= 0) {
                this.onWillHide();
                return;
            }
            if (shadowElement) {
                this.updateShadowElement(shadowElement, dimension, position);
            }
            if (this._shadowElementViewInfo && this._shadowElementViewInfo.width <= 0 && this._shadowElementViewInfo.height <= 0) {
                this.onWillHide();
                return;
            }
            this._dimension = dimension;
            this._position = position;
            const newBodyHeight = this.getBodyHeight(dimension.height) - this.getLayoutInfo().stickyHeight;
            DOM.size(this._body, dimension.width, newBodyHeight);
            const newCellListHeight = newBodyHeight;
            if (this._list.getRenderHeight() < newCellListHeight) {
                // the new dimension is larger than the list viewport, update its additional height first, otherwise the list view will move down a bit (as the `scrollBottom` will move down)
                this._list.updateOptions({ paddingBottom: this._allowScrollBeyondLastLine() ? Math.max(0, (newCellListHeight - 50)) : 0, paddingTop: 0 });
                this._list.layout(newCellListHeight, dimension.width);
            }
            else {
                // the new dimension is smaller than the list viewport, if we update the additional height, the `scrollBottom` will move up, which moves the whole list view upwards a bit. So we run a layout first.
                this._list.layout(newCellListHeight, dimension.width);
                this._list.updateOptions({ paddingBottom: this._allowScrollBeyondLastLine() ? Math.max(0, (newCellListHeight - 50)) : 0, paddingTop: 0 });
            }
            this._overlayContainer.style.visibility = 'visible';
            this._overlayContainer.style.display = 'block';
            this._overlayContainer.style.position = 'absolute';
            this._overlayContainer.style.overflow = 'hidden';
            this.layoutContainerOverShadowElement(dimension, position);
            if (this._webviewTransparentCover) {
                this._webviewTransparentCover.style.height = `${dimension.height}px`;
                this._webviewTransparentCover.style.width = `${dimension.width}px`;
            }
            this._notebookTopToolbar.layout(this._dimension);
            this._notebookOverviewRuler.layout();
            this._viewContext?.eventDispatcher.emit([new notebookViewEvents_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
        }
        updateShadowElement(shadowElement, dimension, position) {
            this._shadowElement = shadowElement;
            if (dimension && position) {
                this._shadowElementViewInfo = {
                    height: dimension.height,
                    width: dimension.width,
                    top: position.top,
                    left: position.left,
                };
            }
            else {
                // We have to recompute position and size ourselves (which is slow)
                const containerRect = shadowElement.getBoundingClientRect();
                this._shadowElementViewInfo = {
                    height: containerRect.height,
                    width: containerRect.width,
                    top: containerRect.top,
                    left: containerRect.left
                };
            }
        }
        layoutContainerOverShadowElement(dimension, position) {
            if (dimension && position) {
                this._overlayContainer.style.top = `${position.top}px`;
                this._overlayContainer.style.left = `${position.left}px`;
                this._overlayContainer.style.width = `${dimension.width}px`;
                this._overlayContainer.style.height = `${dimension.height}px`;
                return;
            }
            if (!this._shadowElementViewInfo) {
                return;
            }
            const elementContainerRect = this._overlayContainer.parentElement?.getBoundingClientRect();
            this._overlayContainer.style.top = `${this._shadowElementViewInfo.top - (elementContainerRect?.top || 0)}px`;
            this._overlayContainer.style.left = `${this._shadowElementViewInfo.left - (elementContainerRect?.left || 0)}px`;
            this._overlayContainer.style.width = `${dimension ? dimension.width : this._shadowElementViewInfo.width}px`;
            this._overlayContainer.style.height = `${dimension ? dimension.height : this._shadowElementViewInfo.height}px`;
        }
        //#endregion
        //#region Focus tracker
        focus() {
            this._isVisible = true;
            this._editorFocus.set(true);
            if (this._webviewFocused) {
                this._webview?.focusWebview();
            }
            else {
                if (this.viewModel) {
                    const focusRange = this.viewModel.getFocus();
                    const element = this.viewModel.cellAt(focusRange.start);
                    // The notebook editor doesn't have focus yet
                    if (!this.hasEditorFocus()) {
                        this.focusContainer();
                        // trigger editor to update as FocusTracker might not emit focus change event
                        this.updateEditorFocus();
                    }
                    if (element && element.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                        element.updateEditState(notebookBrowser_1.CellEditState.Editing, 'editorWidget.focus');
                        element.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                        this.focusEditor(element);
                        return;
                    }
                }
                this._list.domFocus();
            }
            if (this._currentProgress) {
                // The editor forces progress to hide when switching editors. So if progress should be visible, force it to show when the editor is focused.
                this.showProgress();
            }
        }
        onShow() {
            this._isVisible = true;
        }
        focusEditor(activeElement) {
            for (const [element, editor] of this._renderedEditors.entries()) {
                if (element === activeElement) {
                    editor.focus();
                    return;
                }
            }
        }
        focusContainer(clearSelection = false) {
            if (this._webviewFocused) {
                this._webview?.focusWebview();
            }
            else {
                this._list.focusContainer(clearSelection);
            }
        }
        selectOutputContent(cell) {
            this._webview?.selectOutputContents(cell);
        }
        selectInputContents(cell) {
            this._webview?.selectInputContents(cell);
        }
        onWillHide() {
            this._isVisible = false;
            this._editorFocus.set(false);
            this._overlayContainer.style.visibility = 'hidden';
            this._overlayContainer.style.left = '-50000px';
            this._notebookTopToolbarContainer.style.display = 'none';
            this.clearActiveCellWidgets();
        }
        clearActiveCellWidgets() {
            this._renderedEditors.forEach((editor, cell) => {
                if (this.getActiveCell() === cell && editor) {
                    suggestController_1.SuggestController.get(editor)?.cancelSuggestWidget();
                    dropIntoEditorController_1.DropIntoEditorController.get(editor)?.clearWidgets();
                    copyPasteController_1.CopyPasteController.get(editor)?.clearWidgets();
                }
            });
        }
        editorHasDomFocus() {
            return DOM.isAncestorOfActiveElement(this.getDomNode());
        }
        updateEditorFocus() {
            // Note - focus going to the webview will fire 'blur', but the webview element will be
            // a descendent of the notebook editor root.
            this._focusTracker.refreshState();
            const focused = this.editorHasDomFocus();
            this._editorFocus.set(focused);
            this.viewModel?.setEditorFocus(focused);
        }
        updateCellFocusMode() {
            const activeCell = this.getActiveCell();
            if (activeCell?.focusMode === notebookBrowser_1.CellFocusMode.Output && !this._webviewFocused) {
                // output previously has focus, but now it's blurred.
                activeCell.focusMode = notebookBrowser_1.CellFocusMode.Container;
            }
        }
        hasEditorFocus() {
            // _editorFocus is driven by the FocusTracker, which is only guaranteed to _eventually_ fire blur.
            // If we need to know whether we have focus at this instant, we need to check the DOM manually.
            this.updateEditorFocus();
            return this.editorHasDomFocus();
        }
        hasWebviewFocus() {
            return this._webviewFocused;
        }
        hasOutputTextSelection() {
            if (!this.hasEditorFocus()) {
                return false;
            }
            const windowSelection = DOM.getWindow(this.getDomNode()).getSelection();
            if (windowSelection?.rangeCount !== 1) {
                return false;
            }
            const activeSelection = windowSelection.getRangeAt(0);
            if (activeSelection.startContainer === activeSelection.endContainer && activeSelection.endOffset - activeSelection.startOffset === 0) {
                return false;
            }
            let container = activeSelection.commonAncestorContainer;
            if (!this._body.contains(container)) {
                return false;
            }
            while (container
                &&
                    container !== this._body) {
                if (container.classList && container.classList.contains('output')) {
                    return true;
                }
                container = container.parentNode;
            }
            return false;
        }
        _didFocusOutputInputChange(hasFocus) {
            this._outputInputFocus.set(hasFocus);
        }
        //#endregion
        //#region Editor Features
        focusElement(cell) {
            this.viewModel?.updateSelectionsState({
                kind: notebookCommon_1.SelectionStateType.Handle,
                primary: cell.handle,
                selections: [cell.handle]
            });
        }
        get scrollTop() {
            return this._list.scrollTop;
        }
        getAbsoluteTopOfElement(cell) {
            return this._list.getCellViewScrollTop(cell);
        }
        getHeightOfElement(cell) {
            return this._list.elementHeight(cell);
        }
        scrollToBottom() {
            this._list.scrollToBottom();
        }
        setScrollTop(scrollTop) {
            this._list.scrollTop = scrollTop;
        }
        revealCellRangeInView(range) {
            return this._list.revealCells(range);
        }
        revealInView(cell) {
            return this._list.revealCell(cell, 1 /* CellRevealType.Default */);
        }
        revealInViewAtTop(cell) {
            this._list.revealCell(cell, 2 /* CellRevealType.Top */);
        }
        revealInCenter(cell) {
            this._list.revealCell(cell, 3 /* CellRevealType.Center */);
        }
        async revealInCenterIfOutsideViewport(cell) {
            await this._list.revealCell(cell, 4 /* CellRevealType.CenterIfOutsideViewport */);
        }
        async revealFirstLineIfOutsideViewport(cell) {
            await this._list.revealCell(cell, 6 /* CellRevealType.FirstLineIfOutsideViewport */);
        }
        async revealLineInViewAsync(cell, line) {
            return this._list.revealRangeInCell(cell, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealRangeType.Default);
        }
        async revealLineInCenterAsync(cell, line) {
            return this._list.revealRangeInCell(cell, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealRangeType.Center);
        }
        async revealLineInCenterIfOutsideViewportAsync(cell, line) {
            return this._list.revealRangeInCell(cell, new range_1.Range(line, 1, line, 1), notebookBrowser_1.CellRevealRangeType.CenterIfOutsideViewport);
        }
        async revealRangeInViewAsync(cell, range) {
            return this._list.revealRangeInCell(cell, range, notebookBrowser_1.CellRevealRangeType.Default);
        }
        async revealRangeInCenterAsync(cell, range) {
            return this._list.revealRangeInCell(cell, range, notebookBrowser_1.CellRevealRangeType.Center);
        }
        async revealRangeInCenterIfOutsideViewportAsync(cell, range) {
            return this._list.revealRangeInCell(cell, range, notebookBrowser_1.CellRevealRangeType.CenterIfOutsideViewport);
        }
        revealCellOffsetInCenter(cell, offset) {
            return this._list.revealCellOffsetInCenter(cell, offset);
        }
        revealOffsetInCenterIfOutsideViewport(offset) {
            return this._list.revealOffsetInCenterIfOutsideViewport(offset);
        }
        getViewIndexByModelIndex(index) {
            if (!this._listViewInfoAccessor) {
                return -1;
            }
            const cell = this.viewModel?.viewCells[index];
            if (!cell) {
                return -1;
            }
            return this._listViewInfoAccessor.getViewIndex(cell);
        }
        getViewHeight(cell) {
            if (!this._listViewInfoAccessor) {
                return -1;
            }
            return this._listViewInfoAccessor.getViewHeight(cell);
        }
        getCellRangeFromViewRange(startIndex, endIndex) {
            return this._listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex);
        }
        getCellsInRange(range) {
            return this._listViewInfoAccessor.getCellsInRange(range);
        }
        setCellEditorSelection(cell, range) {
            this._list.setCellEditorSelection(cell, range);
        }
        setHiddenAreas(_ranges) {
            return this._list.setHiddenAreas(_ranges, true);
        }
        getVisibleRangesPlusViewportAboveAndBelow() {
            return this._listViewInfoAccessor.getVisibleRangesPlusViewportAboveAndBelow();
        }
        //#endregion
        //#region Decorations
        deltaCellDecorations(oldDecorations, newDecorations) {
            const ret = this.viewModel?.deltaCellDecorations(oldDecorations, newDecorations) || [];
            this._onDidChangeDecorations.fire();
            return ret;
        }
        deltaCellContainerClassNames(cellId, added, removed) {
            this._webview?.deltaCellContainerClassNames(cellId, added, removed);
        }
        changeModelDecorations(callback) {
            return this.viewModel?.changeModelDecorations(callback) || null;
        }
        //#endregion
        //#region View Zones
        changeViewZones(callback) {
            this._list.changeViewZones(callback);
        }
        //#endregion
        //#region Kernel/Execution
        async _loadKernelPreloads() {
            if (!this.hasModel()) {
                return;
            }
            const { selected } = this.notebookKernelService.getMatchingKernel(this.textModel);
            if (!this._webview?.isResolved()) {
                await this._resolveWebview();
            }
            this._webview?.updateKernelPreloads(selected);
        }
        get activeKernel() {
            return this.textModel && this.notebookKernelService.getSelectedOrSuggestedKernel(this.textModel);
        }
        async cancelNotebookCells(cells) {
            if (!this.viewModel || !this.hasModel()) {
                return;
            }
            if (!cells) {
                cells = this.viewModel.viewCells;
            }
            return this.notebookExecutionService.cancelNotebookCellHandles(this.textModel, Array.from(cells).map(cell => cell.handle));
        }
        async executeNotebookCells(cells) {
            if (!this.viewModel || !this.hasModel()) {
                this.logService.info('notebookEditorWidget', 'No NotebookViewModel, cannot execute cells');
                return;
            }
            if (!cells) {
                cells = this.viewModel.viewCells;
            }
            return this.notebookExecutionService.executeNotebookCells(this.textModel, Array.from(cells).map(c => c.model), this.scopedContextKeyService);
        }
        async layoutNotebookCell(cell, height, context) {
            this._debug('layout cell', cell.handle, height);
            const viewIndex = this._list.getViewIndex(cell);
            if (viewIndex === undefined) {
                // the cell is hidden
                return;
            }
            if (this._pendingLayouts?.has(cell)) {
                this._pendingLayouts?.get(cell).dispose();
            }
            const deferred = new async_1.DeferredPromise();
            const doLayout = () => {
                if (this._isDisposed) {
                    return;
                }
                if (!this.viewModel?.hasCell(cell)) {
                    // Cell removed in the meantime?
                    return;
                }
                if (this._list.getViewIndex(cell) === undefined) {
                    // Cell can be hidden
                    return;
                }
                if (this._list.elementHeight(cell) === height) {
                    return;
                }
                this._pendingLayouts?.delete(cell);
                if (!this.hasEditorFocus()) {
                    // Do not scroll inactive notebook
                    // https://github.com/microsoft/vscode/issues/145340
                    const cellIndex = this.viewModel?.getCellIndex(cell);
                    const visibleRanges = this.visibleRanges;
                    if (cellIndex !== undefined
                        && visibleRanges && visibleRanges.length && visibleRanges[0].start === cellIndex
                        // cell is partially visible
                        && this._list.scrollTop > this.getAbsoluteTopOfElement(cell)) {
                        return this._list.updateElementHeight2(cell, height, Math.min(cellIndex + 1, this.getLength() - 1));
                    }
                }
                this._list.updateElementHeight2(cell, height);
                deferred.complete(undefined);
            };
            if (this._list.inRenderingTransaction) {
                const layoutDisposable = DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this.getDomNode()), doLayout);
                this._pendingLayouts?.set(cell, (0, lifecycle_1.toDisposable)(() => {
                    layoutDisposable.dispose();
                    deferred.complete(undefined);
                }));
            }
            else {
                doLayout();
            }
            return deferred.p;
        }
        getActiveCell() {
            const elements = this._list.getFocusedElements();
            if (elements && elements.length) {
                return elements[0];
            }
            return undefined;
        }
        _toggleNotebookCellSelection(selectedCell, selectFromPrevious) {
            const currentSelections = this._list.getSelectedElements();
            const isSelected = currentSelections.includes(selectedCell);
            const previousSelection = selectFromPrevious ? currentSelections[currentSelections.length - 1] ?? selectedCell : selectedCell;
            const selectedIndex = this._list.getViewIndex(selectedCell);
            const previousIndex = this._list.getViewIndex(previousSelection);
            const cellsInSelectionRange = this.getCellsInViewRange(selectedIndex, previousIndex);
            if (isSelected) {
                // Deselect
                this._list.selectElements(currentSelections.filter(current => !cellsInSelectionRange.includes(current)));
            }
            else {
                // Add to selection
                this.focusElement(selectedCell);
                this._list.selectElements([...currentSelections.filter(current => !cellsInSelectionRange.includes(current)), ...cellsInSelectionRange]);
            }
        }
        getCellsInViewRange(fromInclusive, toInclusive) {
            const selectedCellsInRange = [];
            for (let index = 0; index < this._list.length; ++index) {
                const cell = this._list.element(index);
                if (cell) {
                    if ((index >= fromInclusive && index <= toInclusive) || (index >= toInclusive && index <= fromInclusive)) {
                        selectedCellsInRange.push(cell);
                    }
                }
            }
            return selectedCellsInRange;
        }
        async focusNotebookCell(cell, focusItem, options) {
            if (this._isDisposed) {
                return;
            }
            cell.focusedOutputId = undefined;
            if (focusItem === 'editor') {
                this.focusElement(cell);
                this._list.focusView();
                cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                if (!options?.skipReveal) {
                    if (typeof options?.focusEditorLine === 'number') {
                        this._cursorNavMode.set(true);
                        await this.revealLineInViewAsync(cell, options.focusEditorLine);
                        const editor = this._renderedEditors.get(cell);
                        const focusEditorLine = options.focusEditorLine;
                        editor?.setSelection({
                            startLineNumber: focusEditorLine,
                            startColumn: 1,
                            endLineNumber: focusEditorLine,
                            endColumn: 1
                        });
                    }
                    else {
                        const selectionsStartPosition = cell.getSelectionsStartPosition();
                        if (selectionsStartPosition?.length) {
                            const firstSelectionPosition = selectionsStartPosition[0];
                            await this.revealRangeInViewAsync(cell, range_1.Range.fromPositions(firstSelectionPosition, firstSelectionPosition));
                        }
                        else {
                            await this.revealInView(cell);
                        }
                    }
                }
            }
            else if (focusItem === 'output') {
                this.focusElement(cell);
                if (!this.hasEditorFocus()) {
                    this._list.focusView();
                }
                if (!this._webview) {
                    return;
                }
                const firstOutputId = cell.outputsViewModels.find(o => o.model.alternativeOutputId)?.model.alternativeOutputId;
                const focusElementId = options?.outputId ?? firstOutputId ?? cell.id;
                this._webview.focusOutput(focusElementId, options?.altOutputId, options?.outputWebviewFocused || this._webviewFocused);
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Output;
                cell.focusedOutputId = options?.outputId;
                this._outputFocus.set(true);
                if (!options?.skipReveal) {
                    this.revealInCenterIfOutsideViewport(cell);
                }
            }
            else {
                // focus container
                const itemDOM = this._list.domElementOfElement(cell);
                if (itemDOM && itemDOM.ownerDocument.activeElement && itemDOM.contains(itemDOM.ownerDocument.activeElement)) {
                    itemDOM.ownerDocument.activeElement.blur();
                }
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'focusNotebookCell');
                cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                this.focusElement(cell);
                if (!options?.skipReveal) {
                    if (typeof options?.focusEditorLine === 'number') {
                        this._cursorNavMode.set(true);
                        await this.revealInView(cell);
                    }
                    else if (options?.revealBehavior === notebookBrowser_1.ScrollToRevealBehavior.firstLine) {
                        await this.revealFirstLineIfOutsideViewport(cell);
                    }
                    else if (options?.revealBehavior === notebookBrowser_1.ScrollToRevealBehavior.fullCell) {
                        await this.revealInView(cell);
                    }
                    else {
                        await this.revealInCenterIfOutsideViewport(cell);
                    }
                }
                this._list.focusView();
                this.updateEditorFocus();
            }
        }
        async focusNextNotebookCell(cell, focusItem) {
            const idx = this.viewModel?.getCellIndex(cell);
            if (typeof idx !== 'number') {
                return;
            }
            const newCell = this.viewModel?.cellAt(idx + 1);
            if (!newCell) {
                return;
            }
            await this.focusNotebookCell(newCell, focusItem);
        }
        //#endregion
        //#region Find
        async _warmupCell(viewCell) {
            if (viewCell.isOutputCollapsed) {
                return;
            }
            const outputs = viewCell.outputsViewModels;
            for (const output of outputs.slice(0, codeCellViewModel_1.outputDisplayLimit)) {
                const [mimeTypes, pick] = output.resolveMimeTypes(this.textModel, undefined);
                if (!mimeTypes.find(mimeType => mimeType.isTrusted) || mimeTypes.length === 0) {
                    continue;
                }
                const pickedMimeTypeRenderer = mimeTypes[pick];
                if (!pickedMimeTypeRenderer) {
                    return;
                }
                const renderer = this._notebookService.getRendererInfo(pickedMimeTypeRenderer.rendererId);
                if (!renderer) {
                    return;
                }
                const result = { type: 1 /* RenderOutputType.Extension */, renderer, source: output, mimeType: pickedMimeTypeRenderer.mimeType };
                const inset = this._webview?.insetMapping.get(result.source);
                if (!inset || !inset.initialized) {
                    const p = new Promise(resolve => {
                        this._register(event_1.Event.any(this.onDidRenderOutput, this.onDidRemoveOutput)(e => {
                            if (e.model === result.source.model) {
                                resolve();
                            }
                        }));
                    });
                    this.createOutput(viewCell, result, 0, false);
                    await p;
                }
                else {
                    // request to update its visibility
                    this.createOutput(viewCell, result, 0, false);
                }
                return;
            }
        }
        async _warmupAll(includeOutput) {
            if (!this.hasModel() || !this.viewModel) {
                return;
            }
            const cells = this.viewModel.viewCells;
            const requests = [];
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].cellKind === notebookCommon_1.CellKind.Markup && !this._webview.markupPreviewMapping.has(cells[i].id)) {
                    requests.push(this.createMarkupPreview(cells[i]));
                }
            }
            if (includeOutput && this._list) {
                for (let i = 0; i < this._list.length; i++) {
                    const cell = this._list.element(i);
                    if (cell?.cellKind === notebookCommon_1.CellKind.Code) {
                        requests.push(this._warmupCell(cell));
                    }
                }
            }
            return Promise.all(requests);
        }
        async find(query, options, token, skipWarmup = false, shouldGetSearchPreviewInfo = false, ownerID) {
            if (!this._notebookViewModel) {
                return [];
            }
            if (!ownerID) {
                ownerID = this.getId();
            }
            const findMatches = this._notebookViewModel.find(query, options).filter(match => match.length > 0);
            if (!options.includeMarkupPreview && !options.includeOutput) {
                this._webview?.findStop(ownerID);
                return findMatches;
            }
            // search in webview enabled
            const matchMap = {};
            findMatches.forEach(match => {
                matchMap[match.cell.id] = match;
            });
            if (this._webview) {
                // request all outputs to be rendered
                // measure perf
                const start = Date.now();
                await this._warmupAll(!!options.includeOutput);
                const end = Date.now();
                this.logService.debug('Find', `Warmup time: ${end - start}ms`);
                if (token.isCancellationRequested) {
                    return [];
                }
                const webviewMatches = await this._webview.find(query, { caseSensitive: options.caseSensitive, wholeWord: options.wholeWord, includeMarkup: !!options.includeMarkupPreview, includeOutput: !!options.includeOutput, shouldGetSearchPreviewInfo, ownerID });
                if (token.isCancellationRequested) {
                    return [];
                }
                // attach webview matches to model find matches
                webviewMatches.forEach(match => {
                    const cell = this._notebookViewModel.viewCells.find(cell => cell.id === match.cellId);
                    if (!cell) {
                        return;
                    }
                    if (match.type === 'preview') {
                        // markup preview
                        if (cell.getEditState() === notebookBrowser_1.CellEditState.Preview && !options.includeMarkupPreview) {
                            return;
                        }
                        if (cell.getEditState() === notebookBrowser_1.CellEditState.Editing && options.includeMarkupInput) {
                            return;
                        }
                    }
                    else {
                        if (!options.includeOutput) {
                            // skip outputs if not included
                            return;
                        }
                    }
                    const exisitingMatch = matchMap[match.cellId];
                    if (exisitingMatch) {
                        exisitingMatch.webviewMatches.push(match);
                    }
                    else {
                        matchMap[match.cellId] = new findModel_1.CellFindMatchModel(this._notebookViewModel.viewCells.find(cell => cell.id === match.cellId), this._notebookViewModel.viewCells.findIndex(cell => cell.id === match.cellId), [], [match]);
                    }
                });
            }
            const ret = [];
            this._notebookViewModel.viewCells.forEach((cell, index) => {
                if (matchMap[cell.id]) {
                    ret.push(new findModel_1.CellFindMatchModel(cell, index, matchMap[cell.id].contentMatches, matchMap[cell.id].webviewMatches));
                }
            });
            return ret;
        }
        async findHighlightCurrent(matchIndex, ownerID) {
            if (!this._webview) {
                return 0;
            }
            return this._webview?.findHighlightCurrent(matchIndex, ownerID ?? this.getId());
        }
        async findUnHighlightCurrent(matchIndex, ownerID) {
            if (!this._webview) {
                return;
            }
            return this._webview?.findUnHighlightCurrent(matchIndex, ownerID ?? this.getId());
        }
        findStop(ownerID) {
            this._webview?.findStop(ownerID ?? this.getId());
        }
        //#endregion
        //#region MISC
        getLayoutInfo() {
            if (!this._list) {
                throw new Error('Editor is not initalized successfully');
            }
            if (!this._fontInfo) {
                this._generateFontInfo();
            }
            return {
                width: this._dimension?.width ?? 0,
                height: this._dimension?.height ?? 0,
                scrollHeight: this._list?.getScrollHeight() ?? 0,
                fontInfo: this._fontInfo,
                stickyHeight: this._notebookStickyScroll?.getCurrentStickyHeight() ?? 0
            };
        }
        async createMarkupPreview(cell) {
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            if (!this._webview || !this._list.webviewElement) {
                return;
            }
            if (!this.viewModel || !this._list.viewModel) {
                return;
            }
            if (this.viewModel.getCellIndex(cell) === -1) {
                return;
            }
            if (this.cellIsHidden(cell)) {
                return;
            }
            const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
            const top = !!webviewTop ? (0 - webviewTop) : 0;
            const cellTop = this._list.getCellViewScrollTop(cell);
            await this._webview.showMarkupPreview({
                mime: cell.mime,
                cellHandle: cell.handle,
                cellId: cell.id,
                content: cell.getText(),
                offset: cellTop + top,
                visible: true,
                metadata: cell.metadata,
            });
        }
        cellIsHidden(cell) {
            const modelIndex = this.viewModel.getCellIndex(cell);
            const foldedRanges = this.viewModel.getHiddenRanges();
            return foldedRanges.some(range => modelIndex >= range.start && modelIndex <= range.end);
        }
        async unhideMarkupPreviews(cells) {
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await this._webview?.unhideMarkupPreviews(cells.map(cell => cell.id));
        }
        async hideMarkupPreviews(cells) {
            if (!this._webview || !cells.length) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await this._webview?.hideMarkupPreviews(cells.map(cell => cell.id));
        }
        async deleteMarkupPreviews(cells) {
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            await this._webview?.deleteMarkupPreviews(cells.map(cell => cell.id));
        }
        async updateSelectedMarkdownPreviews() {
            if (!this._webview) {
                return;
            }
            if (!this._webview.isResolved()) {
                await this._resolveWebview();
            }
            const selectedCells = this.getSelectionViewModels().map(cell => cell.id);
            // Only show selection when there is more than 1 cell selected
            await this._webview?.updateMarkupPreviewSelections(selectedCells.length > 1 ? selectedCells : []);
        }
        async createOutput(cell, output, offset, createWhenIdle) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId, async () => {
                if (this._isDisposed || !this._webview) {
                    return;
                }
                if (!this._webview.isResolved()) {
                    await this._resolveWebview();
                }
                if (!this._webview) {
                    return;
                }
                if (!this._list.webviewElement) {
                    return;
                }
                if (output.type === 1 /* RenderOutputType.Extension */) {
                    this.notebookRendererMessaging.prepare(output.renderer.id);
                }
                const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
                const top = !!webviewTop ? (0 - webviewTop) : 0;
                const cellTop = this._list.getCellViewScrollTop(cell) + top;
                const existingOutput = this._webview.insetMapping.get(output.source);
                if (!existingOutput
                    || (!existingOutput.renderer && output.type === 1 /* RenderOutputType.Extension */)) {
                    if (createWhenIdle) {
                        this._webview.requestCreateOutputWhenWebviewIdle({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri, executionId: cell.internalMetadata.executionId }, output, cellTop, offset);
                    }
                    else {
                        this._webview.createOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri, executionId: cell.internalMetadata.executionId }, output, cellTop, offset);
                    }
                }
                else if (existingOutput.renderer
                    && output.type === 1 /* RenderOutputType.Extension */
                    && existingOutput.renderer.id !== output.renderer.id) {
                    // switch mimetype
                    this._webview.removeInsets([output.source]);
                    this._webview.createOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri }, output, cellTop, offset);
                }
                else if (existingOutput.versionId !== output.source.model.versionId) {
                    this._webview.updateOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri, executionId: cell.internalMetadata.executionId }, output, cellTop, offset);
                }
                else {
                    const outputIndex = cell.outputsViewModels.indexOf(output.source);
                    const outputOffset = cell.getOutputOffset(outputIndex);
                    this._webview.updateScrollTops([{
                            cell,
                            output: output.source,
                            cellTop,
                            outputOffset,
                            forceDisplay: !cell.isOutputCollapsed,
                        }], []);
                }
            });
        }
        async updateOutput(cell, output, offset) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId, async () => {
                if (this._isDisposed || !this._webview || cell.isOutputCollapsed) {
                    return;
                }
                if (!this._webview.isResolved()) {
                    await this._resolveWebview();
                }
                if (!this._webview || !this._list.webviewElement) {
                    return;
                }
                if (!this._webview.insetMapping.has(output.source)) {
                    return this.createOutput(cell, output, offset, false);
                }
                if (output.type === 1 /* RenderOutputType.Extension */) {
                    this.notebookRendererMessaging.prepare(output.renderer.id);
                }
                const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
                const top = !!webviewTop ? (0 - webviewTop) : 0;
                const cellTop = this._list.getCellViewScrollTop(cell) + top;
                this._webview.updateOutput({ cellId: cell.id, cellHandle: cell.handle, cellUri: cell.uri }, output, cellTop, offset);
            });
        }
        async copyOutputImage(cellOutput) {
            this._webview?.copyImage(cellOutput);
        }
        removeInset(output) {
            this._insetModifyQueueByOutputId.queue(output.model.outputId, async () => {
                if (this._isDisposed || !this._webview) {
                    return;
                }
                if (this._webview?.isResolved()) {
                    this._webview.removeInsets([output]);
                }
                this._onDidRemoveOutput.fire(output);
            });
        }
        hideInset(output) {
            this._insetModifyQueueByOutputId.queue(output.model.outputId, async () => {
                if (this._isDisposed || !this._webview) {
                    return;
                }
                if (this._webview?.isResolved()) {
                    this._webview.hideInset(output);
                }
            });
        }
        //#region --- webview IPC ----
        postMessage(message) {
            if (this._webview?.isResolved()) {
                this._webview.postKernelMessage(message);
            }
        }
        //#endregion
        addClassName(className) {
            this._overlayContainer.classList.add(className);
        }
        removeClassName(className) {
            this._overlayContainer.classList.remove(className);
        }
        cellAt(index) {
            return this.viewModel?.cellAt(index);
        }
        getCellByInfo(cellInfo) {
            const { cellHandle } = cellInfo;
            return this.viewModel?.viewCells.find(vc => vc.handle === cellHandle);
        }
        getCellByHandle(handle) {
            return this.viewModel?.getCellByHandle(handle);
        }
        getCellIndex(cell) {
            return this.viewModel?.getCellIndexByHandle(cell.handle);
        }
        getNextVisibleCellIndex(index) {
            return this.viewModel?.getNextVisibleCellIndex(index);
        }
        getPreviousVisibleCellIndex(index) {
            return this.viewModel?.getPreviousVisibleCellIndex(index);
        }
        _updateScrollHeight() {
            if (this._isDisposed || !this._webview?.isResolved()) {
                return;
            }
            if (!this._list.webviewElement) {
                return;
            }
            const scrollHeight = this._list.scrollHeight;
            this._webview.element.style.height = `${scrollHeight + notebookCellList_1.NOTEBOOK_WEBVIEW_BOUNDARY * 2}px`;
            const webviewTop = parseInt(this._list.webviewElement.domNode.style.top, 10);
            const top = !!webviewTop ? (0 - webviewTop) : 0;
            const updateItems = [];
            const removedItems = [];
            this._webview?.insetMapping.forEach((value, key) => {
                const cell = this.viewModel?.getCellByHandle(value.cellInfo.cellHandle);
                if (!cell || !(cell instanceof codeCellViewModel_1.CodeCellViewModel)) {
                    return;
                }
                this.viewModel?.viewCells.find(cell => cell.handle === value.cellInfo.cellHandle);
                const viewIndex = this._list.getViewIndex(cell);
                if (viewIndex === undefined) {
                    return;
                }
                if (cell.outputsViewModels.indexOf(key) < 0) {
                    // output is already gone
                    removedItems.push(key);
                }
                const cellTop = this._list.getCellViewScrollTop(cell);
                const outputIndex = cell.outputsViewModels.indexOf(key);
                const outputOffset = cell.getOutputOffset(outputIndex);
                updateItems.push({
                    cell,
                    output: key,
                    cellTop: cellTop + top,
                    outputOffset,
                    forceDisplay: false,
                });
            });
            this._webview.removeInsets(removedItems);
            const markdownUpdateItems = [];
            for (const cellId of this._webview.markupPreviewMapping.keys()) {
                const cell = this.viewModel?.viewCells.find(cell => cell.id === cellId);
                if (cell) {
                    const cellTop = this._list.getCellViewScrollTop(cell);
                    // markdownUpdateItems.push({ id: cellId, top: cellTop });
                    markdownUpdateItems.push({ id: cellId, top: cellTop + top });
                }
            }
            if (markdownUpdateItems.length || updateItems.length) {
                this._debug('_list.onDidChangeContentHeight/markdown', markdownUpdateItems);
                this._webview?.updateScrollTops(updateItems, markdownUpdateItems);
            }
        }
        //#endregion
        //#region BacklayerWebview delegate
        _updateOutputHeight(cellInfo, output, outputHeight, isInit, source) {
            const cell = this.viewModel?.viewCells.find(vc => vc.handle === cellInfo.cellHandle);
            if (cell && cell instanceof codeCellViewModel_1.CodeCellViewModel) {
                const outputIndex = cell.outputsViewModels.indexOf(output);
                this._debug('update cell output', cell.handle, outputHeight);
                cell.updateOutputHeight(outputIndex, outputHeight, source);
                this.layoutNotebookCell(cell, cell.layoutInfo.totalHeight);
                if (isInit) {
                    this._onDidRenderOutput.fire(output);
                }
            }
        }
        _scheduleOutputHeightAck(cellInfo, outputId, height) {
            const wasEmpty = this._pendingOutputHeightAcks.size === 0;
            this._pendingOutputHeightAcks.set(outputId, { cellId: cellInfo.cellId, outputId, height });
            if (wasEmpty) {
                DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this.getDomNode()), () => {
                    this._debug('ack height');
                    this._updateScrollHeight();
                    this._webview?.ackHeight([...this._pendingOutputHeightAcks.values()]);
                    this._pendingOutputHeightAcks.clear();
                }, -1); // -1 priority because this depends on calls to layoutNotebookCell, and that may be called multiple times before this runs
            }
        }
        _getCellById(cellId) {
            return this.viewModel?.viewCells.find(vc => vc.id === cellId);
        }
        _updateMarkupCellHeight(cellId, height, isInit) {
            const cell = this._getCellById(cellId);
            if (cell && cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const { bottomToolbarGap } = this._notebookOptions.computeBottomToolbarDimensions(this.viewModel?.viewType);
                this._debug('updateMarkdownCellHeight', cell.handle, height + bottomToolbarGap, isInit);
                cell.renderedMarkdownHeight = height;
            }
        }
        _setMarkupCellEditState(cellId, editState) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.revealInView(cell);
                cell.updateEditState(editState, 'setMarkdownCellEditState');
            }
        }
        _didStartDragMarkupCell(cellId, event) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                this._dndController?.startExplicitDrag(cell, event.dragOffsetY - webviewOffset);
            }
        }
        _didDragMarkupCell(cellId, event) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                this._dndController?.explicitDrag(cell, event.dragOffsetY - webviewOffset);
            }
        }
        _didDropMarkupCell(cellId, event) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                const webviewOffset = this._list.webviewElement ? -parseInt(this._list.webviewElement.domNode.style.top, 10) : 0;
                event.dragOffsetY -= webviewOffset;
                this._dndController?.explicitDrop(cell, event);
            }
        }
        _didEndDragMarkupCell(cellId) {
            const cell = this._getCellById(cellId);
            if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this._dndController?.endExplicitDrag(cell);
            }
        }
        _didResizeOutput(cellId) {
            const cell = this._getCellById(cellId);
            if (cell) {
                this._onDidResizeOutputEmitter.fire(cell);
            }
        }
        _updatePerformanceMetadata(cellId, executionId, duration, rendererId) {
            if (!this.hasModel()) {
                return;
            }
            const cell = this._getCellById(cellId);
            const cellIndex = !cell ? undefined : this.getCellIndex(cell);
            if (cell?.internalMetadata.executionId === executionId && cellIndex !== undefined) {
                const renderDurationMap = cell.internalMetadata.renderDuration || {};
                renderDurationMap[rendererId] = (renderDurationMap[rendererId] ?? 0) + duration;
                this.textModel.applyEdits([
                    {
                        editType: 9 /* CellEditType.PartialInternalMetadata */,
                        index: cellIndex,
                        internalMetadata: {
                            executionId: executionId,
                            renderDuration: renderDurationMap
                        }
                    }
                ], true, undefined, () => undefined, undefined, false);
            }
        }
        //#endregion
        //#region Editor Contributions
        getContribution(id) {
            return (this._contributions.get(id) || null);
        }
        //#endregion
        dispose() {
            this._isDisposed = true;
            // dispose webview first
            this._webview?.dispose();
            this._webview = null;
            this.notebookEditorService.removeNotebookEditor(this);
            (0, lifecycle_1.dispose)(this._contributions.values());
            this._contributions.clear();
            this._localStore.clear();
            (0, lifecycle_1.dispose)(this._localCellStateListeners);
            this._list.dispose();
            this._listTopCellToolbar?.dispose();
            this._overlayContainer.remove();
            this.viewModel?.dispose();
            this._renderedEditors.clear();
            this._baseCellEditorOptions.forEach(v => v.dispose());
            this._baseCellEditorOptions.clear();
            this._notebookOverviewRulerContainer.remove();
            super.dispose();
            // unref
            this._webview = null;
            this._webviewResolvePromise = null;
            this._webviewTransparentCover = null;
            this._dndController = null;
            this._listTopCellToolbar = null;
            this._notebookViewModel = undefined;
            this._cellContextKeyManager = null;
            this._notebookTopToolbar = null;
            this._list = null;
            this._listViewInfoAccessor = null;
            this._pendingLayouts = null;
            this._listDelegate = null;
        }
        toJSON() {
            return {
                notebookUri: this.viewModel?.uri,
            };
        }
    };
    exports.NotebookEditorWidget = NotebookEditorWidget;
    exports.NotebookEditorWidget = NotebookEditorWidget = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, notebookRendererMessagingService_1.INotebookRendererMessagingService),
        __param(5, notebookEditorService_1.INotebookEditorService),
        __param(6, notebookKernelService_1.INotebookKernelService),
        __param(7, notebookService_1.INotebookService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, layoutService_1.ILayoutService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, notebookExecutionService_1.INotebookExecutionService),
        __param(14, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(15, progress_1.IEditorProgressService),
        __param(16, notebookLoggingService_1.INotebookLoggingService),
        __param(17, keybinding_1.IKeybindingService),
        __param(18, codeEditorService_1.ICodeEditorService)
    ], NotebookEditorWidget);
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 5, 'notebook-progress-bar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 10, 'notebook-list-insertion-indicator');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 20, 'notebook-cell-editor-outline');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 25, 'notebook-scrollbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 26, 'notebook-cell-status');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 26, 'notebook-folding-indicator');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 27, 'notebook-output');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 28, 'notebook-cell-bottom-toolbar-container');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 29, 'notebook-run-button-container');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 29, 'notebook-input-collapse-condicon');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 30, 'notebook-cell-output-toolbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 1, 'notebook-cell-expand-part-button');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 2, 'notebook-cell-toolbar');
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Sash, 3, 'notebook-cell-toolbar-dropdown-active');
    exports.notebookCellBorder = (0, colorRegistry_1.registerColor)('notebook.cellBorderColor', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
        hcDark: theme_1.PANEL_BORDER,
        hcLight: theme_1.PANEL_BORDER
    }, nls.localize('notebook.cellBorderColor', "The border color for notebook cells."));
    exports.focusedEditorBorderColor = (0, colorRegistry_1.registerColor)('notebook.focusedEditorBorder', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedEditorBorder', "The color of the notebook cell editor border."));
    exports.cellStatusIconSuccess = (0, colorRegistry_1.registerColor)('notebookStatusSuccessIcon.foreground', {
        light: debugColors_1.debugIconStartForeground,
        dark: debugColors_1.debugIconStartForeground,
        hcDark: debugColors_1.debugIconStartForeground,
        hcLight: debugColors_1.debugIconStartForeground
    }, nls.localize('notebookStatusSuccessIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.runningCellRulerDecorationColor = (0, colorRegistry_1.registerColor)('notebookEditorOverviewRuler.runningCellForeground', {
        light: debugColors_1.debugIconStartForeground,
        dark: debugColors_1.debugIconStartForeground,
        hcDark: debugColors_1.debugIconStartForeground,
        hcLight: debugColors_1.debugIconStartForeground
    }, nls.localize('notebookEditorOverviewRuler.runningCellForeground', "The color of the running cell decoration in the notebook editor overview ruler."));
    exports.cellStatusIconError = (0, colorRegistry_1.registerColor)('notebookStatusErrorIcon.foreground', {
        light: colorRegistry_1.errorForeground,
        dark: colorRegistry_1.errorForeground,
        hcDark: colorRegistry_1.errorForeground,
        hcLight: colorRegistry_1.errorForeground
    }, nls.localize('notebookStatusErrorIcon.foreground', "The error icon color of notebook cells in the cell status bar."));
    exports.cellStatusIconRunning = (0, colorRegistry_1.registerColor)('notebookStatusRunningIcon.foreground', {
        light: colorRegistry_1.foreground,
        dark: colorRegistry_1.foreground,
        hcDark: colorRegistry_1.foreground,
        hcLight: colorRegistry_1.foreground
    }, nls.localize('notebookStatusRunningIcon.foreground', "The running icon color of notebook cells in the cell status bar."));
    exports.notebookOutputContainerBorderColor = (0, colorRegistry_1.registerColor)('notebook.outputContainerBorderColor', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.outputContainerBorderColor', "The border color of the notebook output container."));
    exports.notebookOutputContainerColor = (0, colorRegistry_1.registerColor)('notebook.outputContainerBackgroundColor', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.outputContainerBackgroundColor', "The color of the notebook output container background."));
    // TODO@rebornix currently also used for toolbar border, if we keep all of this, pick a generic name
    exports.CELL_TOOLBAR_SEPERATOR = (0, colorRegistry_1.registerColor)('notebook.cellToolbarSeparator', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, nls.localize('notebook.cellToolbarSeparator', "The color of the separator in the cell bottom toolbar"));
    exports.focusedCellBackground = (0, colorRegistry_1.registerColor)('notebook.focusedCellBackground', {
        dark: null,
        light: null,
        hcDark: null,
        hcLight: null
    }, nls.localize('focusedCellBackground', "The background color of a cell when the cell is focused."));
    exports.selectedCellBackground = (0, colorRegistry_1.registerColor)('notebook.selectedCellBackground', {
        dark: colorRegistry_1.listInactiveSelectionBackground,
        light: colorRegistry_1.listInactiveSelectionBackground,
        hcDark: null,
        hcLight: null
    }, nls.localize('selectedCellBackground', "The background color of a cell when the cell is selected."));
    exports.cellHoverBackground = (0, colorRegistry_1.registerColor)('notebook.cellHoverBackground', {
        dark: (0, colorRegistry_1.transparent)(exports.focusedCellBackground, .5),
        light: (0, colorRegistry_1.transparent)(exports.focusedCellBackground, .7),
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.cellHoverBackground', "The background color of a cell when the cell is hovered."));
    exports.selectedCellBorder = (0, colorRegistry_1.registerColor)('notebook.selectedCellBorder', {
        dark: exports.notebookCellBorder,
        light: exports.notebookCellBorder,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, nls.localize('notebook.selectedCellBorder', "The color of the cell's top and bottom border when the cell is selected but not focused."));
    exports.inactiveSelectedCellBorder = (0, colorRegistry_1.registerColor)('notebook.inactiveSelectedCellBorder', {
        dark: null,
        light: null,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.inactiveSelectedCellBorder', "The color of the cell's borders when multiple cells are selected."));
    exports.focusedCellBorder = (0, colorRegistry_1.registerColor)('notebook.focusedCellBorder', {
        dark: colorRegistry_1.focusBorder,
        light: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.focusedCellBorder', "The color of the cell's focus indicator borders when the cell is focused."));
    exports.inactiveFocusedCellBorder = (0, colorRegistry_1.registerColor)('notebook.inactiveFocusedCellBorder', {
        dark: exports.notebookCellBorder,
        light: exports.notebookCellBorder,
        hcDark: exports.notebookCellBorder,
        hcLight: exports.notebookCellBorder
    }, nls.localize('notebook.inactiveFocusedCellBorder', "The color of the cell's top and bottom border when a cell is focused while the primary focus is outside of the editor."));
    exports.cellStatusBarItemHover = (0, colorRegistry_1.registerColor)('notebook.cellStatusBarItemHoverBackground', {
        light: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.08)),
        dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
        hcDark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.15)),
        hcLight: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.08)),
    }, nls.localize('notebook.cellStatusBarItemHoverBackground', "The background color of notebook cell status bar items."));
    exports.cellInsertionIndicator = (0, colorRegistry_1.registerColor)('notebook.cellInsertionIndicator', {
        light: colorRegistry_1.focusBorder,
        dark: colorRegistry_1.focusBorder,
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, nls.localize('notebook.cellInsertionIndicator', "The color of the notebook cell insertion indicator."));
    exports.listScrollbarSliderBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.background', {
        dark: colorRegistry_1.scrollbarSliderBackground,
        light: colorRegistry_1.scrollbarSliderBackground,
        hcDark: colorRegistry_1.scrollbarSliderBackground,
        hcLight: colorRegistry_1.scrollbarSliderBackground
    }, nls.localize('notebookScrollbarSliderBackground', "Notebook scrollbar slider background color."));
    exports.listScrollbarSliderHoverBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.hoverBackground', {
        dark: colorRegistry_1.scrollbarSliderHoverBackground,
        light: colorRegistry_1.scrollbarSliderHoverBackground,
        hcDark: colorRegistry_1.scrollbarSliderHoverBackground,
        hcLight: colorRegistry_1.scrollbarSliderHoverBackground
    }, nls.localize('notebookScrollbarSliderHoverBackground', "Notebook scrollbar slider background color when hovering."));
    exports.listScrollbarSliderActiveBackground = (0, colorRegistry_1.registerColor)('notebookScrollbarSlider.activeBackground', {
        dark: colorRegistry_1.scrollbarSliderActiveBackground,
        light: colorRegistry_1.scrollbarSliderActiveBackground,
        hcDark: colorRegistry_1.scrollbarSliderActiveBackground,
        hcLight: colorRegistry_1.scrollbarSliderActiveBackground
    }, nls.localize('notebookScrollbarSliderActiveBackground', "Notebook scrollbar slider background color when clicked on."));
    exports.cellSymbolHighlight = (0, colorRegistry_1.registerColor)('notebook.symbolHighlightBackground', {
        dark: color_1.Color.fromHex('#ffffff0b'),
        light: color_1.Color.fromHex('#fdff0033'),
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.symbolHighlightBackground', "Background color of highlighted cell"));
    exports.cellEditorBackground = (0, colorRegistry_1.registerColor)('notebook.cellEditorBackground', {
        light: theme_1.SIDE_BAR_BACKGROUND,
        dark: theme_1.SIDE_BAR_BACKGROUND,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.cellEditorBackground', "Cell editor background color."));
    const notebookEditorBackground = (0, colorRegistry_1.registerColor)('notebook.editorBackground', {
        light: theme_1.EDITOR_PANE_BACKGROUND,
        dark: theme_1.EDITOR_PANE_BACKGROUND,
        hcDark: null,
        hcLight: null
    }, nls.localize('notebook.editorBackground', "Notebook background color."));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvbm90ZWJvb2tFZGl0b3JXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMEdoRyw4RUEwQkM7SUE1QkQsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVoQixTQUFnQixpQ0FBaUM7UUFDaEQsOERBQThEO1FBQzlELE1BQU0saUJBQWlCLEdBQUc7WUFDekIsdUJBQXVCO1lBQ3ZCLG9DQUF1QixDQUFDLEVBQUU7WUFDMUIsMEJBQTBCO1lBQzFCLGtDQUFrQztZQUNsQyxtQ0FBbUM7WUFDbkMsc0NBQXNDO1lBQ3RDLCtCQUErQjtZQUMvQixvQ0FBb0M7U0FDcEMsQ0FBQztRQUNGLE1BQU0sYUFBYSxHQUFHLDJDQUF3QixDQUFDLHNCQUFzQixFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRTVILE9BQU87WUFDTixPQUFPLEVBQUU7Z0JBQ1IsZUFBZSxFQUFFLGdCQUFNLENBQUMsZUFBZTtnQkFDdkMsZ0JBQWdCLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7Z0JBQzFDLGlCQUFpQixFQUFFLGdCQUFNLENBQUMsa0JBQWtCO2dCQUM1QyxpQkFBaUIsRUFBRSxnQkFBTSxDQUFDLG1CQUFtQjtnQkFDN0Msb0JBQW9CLEVBQUUsZ0JBQU0sQ0FBQyxtQkFBbUI7Z0JBQ2hELGtCQUFrQixFQUFFLGdCQUFNLENBQUMsbUJBQW1CO2dCQUM5QyxrQkFBa0IsRUFBRSxnQkFBTSxDQUFDLDBC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