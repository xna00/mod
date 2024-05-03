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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/arraysFind", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/cancellation", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/diff/notebookDiffList", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/platform/configuration/common/configuration", "vs/editor/common/config/fontInfo", "vs/base/browser/pixelRatio", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/base/common/uuid", "vs/workbench/contrib/notebook/browser/diff/diffNestedCellViewModel", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/diff/eventDispatcher", "vs/editor/browser/config/fontMeasurements", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookRange", "vs/workbench/contrib/notebook/browser/diff/notebookDiffOverviewRuler", "vs/platform/layout/browser/zIndexRegistry", "vs/editor/browser/services/codeEditorService"], function (require, exports, nls, DOM, arraysFind_1, storage_1, telemetry_1, themeService_1, notebookEditorWidget_1, cancellation_1, diffElementViewModel_1, instantiation_1, notebookDiffList_1, contextkey_1, colorRegistry_1, notebookWorkerService_1, configuration_1, fontInfo_1, pixelRatio_1, notebookDiffEditorBrowser_1, event_1, lifecycle_1, editorPane_1, notebookCommon_1, async_1, uuid_1, diffNestedCellViewModel_1, backLayerWebView_1, eventDispatcher_1, fontMeasurements_1, notebookOptions_1, notebookExecutionStateService_1, notebookRange_1, notebookDiffOverviewRuler_1, zIndexRegistry_1, codeEditorService_1) {
    "use strict";
    var NotebookTextDiffEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextDiffEditor = void 0;
    const $ = DOM.$;
    class NotebookDiffEditorSelection {
        constructor(selections) {
            this.selections = selections;
        }
        compare(other) {
            if (!(other instanceof NotebookDiffEditorSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if (this.selections.length !== other.selections.length) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            for (let i = 0; i < this.selections.length; i++) {
                if (this.selections[i] !== other.selections[i]) {
                    return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
                }
            }
            return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
        }
        restore(options) {
            const notebookOptions = {
                cellSelections: (0, notebookRange_1.cellIndexesToRanges)(this.selections)
            };
            Object.assign(notebookOptions, options);
            return notebookOptions;
        }
    }
    let NotebookTextDiffEditor = class NotebookTextDiffEditor extends editorPane_1.EditorPane {
        static { NotebookTextDiffEditor_1 = this; }
        static { this.ENTIRE_DIFF_OVERVIEW_WIDTH = 30; }
        static { this.ID = notebookCommon_1.NOTEBOOK_DIFF_EDITOR_ID; }
        get textModel() {
            return this._model?.modified.notebook;
        }
        get notebookOptions() {
            return this._notebookOptions;
        }
        get isDisposed() {
            return this._isDisposed;
        }
        constructor(group, instantiationService, themeService, contextKeyService, notebookEditorWorkerService, configurationService, telemetryService, storageService, notebookExecutionStateService, codeEditorService) {
            super(NotebookTextDiffEditor_1.ID, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.notebookEditorWorkerService = notebookEditorWorkerService;
            this.configurationService = configurationService;
            this.creationOptions = (0, notebookEditorWidget_1.getDefaultNotebookCreationOptions)();
            this._dimension = null;
            this._diffElementViewModels = [];
            this._modifiedWebview = null;
            this._originalWebview = null;
            this._webviewTransparentCover = null;
            this._onMouseUp = this._register(new event_1.Emitter());
            this.onMouseUp = this._onMouseUp.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this.onDidChangeScroll = this._onDidScroll.event;
            this._model = null;
            this._modifiedResourceDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._insetModifyQueueByOutputId = new async_1.SequencerByKey();
            this._onDidDynamicOutputRendered = this._register(new event_1.Emitter());
            this.onDidDynamicOutputRendered = this._onDidDynamicOutputRendered.event;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._isDisposed = false;
            this.pendingLayouts = new WeakMap();
            this._notebookOptions = new notebookOptions_1.NotebookOptions(this.window, this.configurationService, notebookExecutionStateService, codeEditorService, false);
            this._register(this._notebookOptions);
            this._revealFirst = true;
        }
        get fontInfo() {
            if (!this._fontInfo) {
                this._fontInfo = this.createFontInfo();
            }
            return this._fontInfo;
        }
        createFontInfo() {
            const editorOptions = this.configurationService.getValue('editor');
            return fontMeasurements_1.FontMeasurements.readFontInfo(this.window, fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(this.window).value));
        }
        isOverviewRulerEnabled() {
            return this.configurationService.getValue(notebookCommon_1.NotebookSetting.diffOverviewRuler) ?? false;
        }
        getSelection() {
            const selections = this._list.getFocus();
            return new NotebookDiffEditorSelection(selections);
        }
        toggleNotebookCellSelection(cell) {
            // throw new Error('Method not implemented.');
        }
        updatePerformanceMetadata(cellId, executionId, duration, rendererId) {
            // throw new Error('Method not implemented.');
        }
        async focusNotebookCell(cell, focus) {
            // throw new Error('Method not implemented.');
        }
        async focusNextNotebookCell(cell, focus) {
            // throw new Error('Method not implemented.');
        }
        didFocusOutputInputChange(inputFocused) {
            // noop
        }
        getScrollTop() {
            return this._list?.scrollTop ?? 0;
        }
        getScrollHeight() {
            return this._list?.scrollHeight ?? 0;
        }
        getScrollPosition() {
            return {
                scrollTop: this.getScrollTop(),
                scrollLeft: this._list?.scrollLeft ?? 0
            };
        }
        setScrollPosition(scrollPosition) {
            if (!this._list) {
                return;
            }
            this._list.scrollTop = scrollPosition.scrollTop;
            if (scrollPosition.scrollLeft !== undefined) {
                this._list.scrollLeft = scrollPosition.scrollLeft;
            }
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this._list?.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        updateOutputHeight(cellInfo, output, outputHeight, isInit) {
            const diffElement = cellInfo.diffElement;
            const cell = this.getCellByInfo(cellInfo);
            const outputIndex = cell.outputsViewModels.indexOf(output);
            if (diffElement instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                const info = notebookCommon_1.CellUri.parse(cellInfo.cellUri);
                if (!info) {
                    return;
                }
                diffElement.updateOutputHeight(info.notebook.toString() === this._model?.original.resource.toString() ? notebookDiffEditorBrowser_1.DiffSide.Original : notebookDiffEditorBrowser_1.DiffSide.Modified, outputIndex, outputHeight);
            }
            else {
                diffElement.updateOutputHeight(diffElement.type === 'insert' ? notebookDiffEditorBrowser_1.DiffSide.Modified : notebookDiffEditorBrowser_1.DiffSide.Original, outputIndex, outputHeight);
            }
            if (isInit) {
                this._onDidDynamicOutputRendered.fire({ cell, output });
            }
        }
        setMarkupCellEditState(cellId, editState) {
            // throw new Error('Method not implemented.');
        }
        didStartDragMarkupCell(cellId, event) {
            // throw new Error('Method not implemented.');
        }
        didDragMarkupCell(cellId, event) {
            // throw new Error('Method not implemented.');
        }
        didEndDragMarkupCell(cellId) {
            // throw new Error('Method not implemented.');
        }
        didDropMarkupCell(cellId) {
            // throw new Error('Method not implemented.');
        }
        didResizeOutput(cellId) {
            // throw new Error('Method not implemented.');
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-text-diff-editor'));
            this._overflowContainer = document.createElement('div');
            this._overflowContainer.classList.add('notebook-overflow-widget-container', 'monaco-editor');
            DOM.append(parent, this._overflowContainer);
            const renderers = [
                this.instantiationService.createInstance(notebookDiffList_1.CellDiffSingleSideRenderer, this),
                this.instantiationService.createInstance(notebookDiffList_1.CellDiffSideBySideRenderer, this),
            ];
            this._listViewContainer = DOM.append(this._rootElement, DOM.$('.notebook-diff-list-view'));
            this._list = this.instantiationService.createInstance(notebookDiffList_1.NotebookTextDiffList, 'NotebookTextDiff', this._listViewContainer, this.instantiationService.createInstance(notebookDiffList_1.NotebookCellTextDiffListDelegate, this.window), renderers, this.contextKeyService, {
                setRowLineHeight: false,
                setRowHeight: false,
                supportDynamicHeights: true,
                horizontalScrolling: false,
                keyboardSupport: false,
                mouseSupport: true,
                multipleSelectionSupport: false,
                typeNavigationEnabled: true,
                paddingBottom: 0,
                // transformOptimization: (isMacintosh && isNative) || getTitleBarStyle(this.configurationService, this.environmentService) === 'native',
                styleController: (_suffix) => { return this._list; },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionBackground: colorRegistry_1.editorBackground,
                    listActiveSelectionForeground: colorRegistry_1.foreground,
                    listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                    listFocusAndSelectionForeground: colorRegistry_1.foreground,
                    listFocusBackground: colorRegistry_1.editorBackground,
                    listFocusForeground: colorRegistry_1.foreground,
                    listHoverForeground: colorRegistry_1.foreground,
                    listHoverBackground: colorRegistry_1.editorBackground,
                    listHoverOutline: colorRegistry_1.focusBorder,
                    listFocusOutline: colorRegistry_1.focusBorder,
                    listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                    listInactiveSelectionForeground: colorRegistry_1.foreground,
                    listInactiveFocusBackground: colorRegistry_1.editorBackground,
                    listInactiveFocusOutline: colorRegistry_1.editorBackground,
                },
                accessibilityProvider: {
                    getAriaLabel() { return null; },
                    getWidgetAriaLabel() {
                        return nls.localize('notebookTreeAriaLabel', "Notebook Text Diff");
                    }
                },
                // focusNextPreviousDelegate: {
                // 	onFocusNext: (applyFocusNext: () => void) => this._updateForCursorNavigationMode(applyFocusNext),
                // 	onFocusPrevious: (applyFocusPrevious: () => void) => this._updateForCursorNavigationMode(applyFocusPrevious),
                // }
            });
            this._register(this._list);
            this._register(this._list.onMouseUp(e => {
                if (e.element) {
                    this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                }
            }));
            this._register(this._list.onDidScroll(() => {
                this._onDidScroll.fire();
            }));
            this._register(this._list.onDidChangeFocus(() => this._onDidChangeSelection.fire({ reason: 2 /* EditorPaneSelectionChangeReason.USER */ })));
            this._overviewRulerContainer = document.createElement('div');
            this._overviewRulerContainer.classList.add('notebook-overview-ruler-container');
            this._rootElement.appendChild(this._overviewRulerContainer);
            this._registerOverviewRuler();
            // transparent cover
            this._webviewTransparentCover = DOM.append(this._list.rowsContainer, $('.webview-cover'));
            this._webviewTransparentCover.style.display = 'none';
            this._register(DOM.addStandardDisposableGenericMouseDownListener(this._overflowContainer, (e) => {
                if (e.target.classList.contains('slider') && this._webviewTransparentCover) {
                    this._webviewTransparentCover.style.display = 'block';
                }
            }));
            this._register(DOM.addStandardDisposableGenericMouseUpListener(this._overflowContainer, () => {
                if (this._webviewTransparentCover) {
                    // no matter when
                    this._webviewTransparentCover.style.display = 'none';
                }
            }));
            this._register(this._list.onDidScroll(e => {
                this._webviewTransparentCover.style.top = `${e.scrollTop}px`;
            }));
        }
        _registerOverviewRuler() {
            this._overviewRuler = this._register(this.instantiationService.createInstance(notebookDiffOverviewRuler_1.NotebookDiffOverviewRuler, this, NotebookTextDiffEditor_1.ENTIRE_DIFF_OVERVIEW_WIDTH, this._overviewRulerContainer));
        }
        _updateOutputsOffsetsInWebview(scrollTop, scrollHeight, activeWebview, getActiveNestedCell, diffSide) {
            activeWebview.element.style.height = `${scrollHeight}px`;
            if (activeWebview.insetMapping) {
                const updateItems = [];
                const removedItems = [];
                activeWebview.insetMapping.forEach((value, key) => {
                    const cell = getActiveNestedCell(value.cellInfo.diffElement);
                    if (!cell) {
                        return;
                    }
                    const viewIndex = this._list.indexOf(value.cellInfo.diffElement);
                    if (viewIndex === undefined) {
                        return;
                    }
                    if (cell.outputsViewModels.indexOf(key) < 0) {
                        // output is already gone
                        removedItems.push(key);
                    }
                    else {
                        const cellTop = this._list.getCellViewScrollTop(value.cellInfo.diffElement);
                        const outputIndex = cell.outputsViewModels.indexOf(key);
                        const outputOffset = value.cellInfo.diffElement.getOutputOffsetInCell(diffSide, outputIndex);
                        updateItems.push({
                            cell,
                            output: key,
                            cellTop: cellTop,
                            outputOffset: outputOffset,
                            forceDisplay: false
                        });
                    }
                });
                activeWebview.removeInsets(removedItems);
                if (updateItems.length) {
                    activeWebview.updateScrollTops(updateItems, []);
                }
            }
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            const model = await input.resolve();
            if (this._model !== model) {
                this._detachModel();
                this._model = model;
                this._attachModel();
            }
            this._model = model;
            if (this._model === null) {
                return;
            }
            this._revealFirst = true;
            this._modifiedResourceDisposableStore.clear();
            this._layoutCancellationTokenSource = new cancellation_1.CancellationTokenSource();
            this._modifiedResourceDisposableStore.add(event_1.Event.any(this._model.original.notebook.onDidChangeContent, this._model.modified.notebook.onDidChangeContent)(e => {
                if (this._model !== null) {
                    this._layoutCancellationTokenSource?.dispose();
                    this._layoutCancellationTokenSource = new cancellation_1.CancellationTokenSource();
                    this.updateLayout(this._layoutCancellationTokenSource.token);
                }
            }));
            await this._createOriginalWebview((0, uuid_1.generateUuid)(), this._model.original.viewType, this._model.original.resource);
            if (this._originalWebview) {
                this._modifiedResourceDisposableStore.add(this._originalWebview);
            }
            await this._createModifiedWebview((0, uuid_1.generateUuid)(), this._model.modified.viewType, this._model.modified.resource);
            if (this._modifiedWebview) {
                this._modifiedResourceDisposableStore.add(this._modifiedWebview);
            }
            await this.updateLayout(this._layoutCancellationTokenSource.token, options?.cellSelections ? (0, notebookRange_1.cellRangesToIndexes)(options.cellSelections) : undefined);
        }
        _detachModel() {
            this._localStore.clear();
            this._originalWebview?.dispose();
            this._originalWebview?.element.remove();
            this._originalWebview = null;
            this._modifiedWebview?.dispose();
            this._modifiedWebview?.element.remove();
            this._modifiedWebview = null;
            this._modifiedResourceDisposableStore.clear();
            this._list.clear();
        }
        _attachModel() {
            this._eventDispatcher = new eventDispatcher_1.NotebookDiffEditorEventDispatcher();
            const updateInsets = () => {
                DOM.scheduleAtNextAnimationFrame(this.window, () => {
                    if (this._isDisposed) {
                        return;
                    }
                    if (this._modifiedWebview) {
                        this._updateOutputsOffsetsInWebview(this._list.scrollTop, this._list.scrollHeight, this._modifiedWebview, (diffElement) => {
                            return diffElement.modified;
                        }, notebookDiffEditorBrowser_1.DiffSide.Modified);
                    }
                    if (this._originalWebview) {
                        this._updateOutputsOffsetsInWebview(this._list.scrollTop, this._list.scrollHeight, this._originalWebview, (diffElement) => {
                            return diffElement.original;
                        }, notebookDiffEditorBrowser_1.DiffSide.Original);
                    }
                });
            };
            this._localStore.add(this._list.onDidChangeContentHeight(() => {
                updateInsets();
            }));
            this._localStore.add(this._eventDispatcher.onDidChangeCellLayout(() => {
                updateInsets();
            }));
        }
        async _createModifiedWebview(id, viewType, resource) {
            this._modifiedWebview?.dispose();
            this._modifiedWebview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this, id, viewType, resource, {
                ...this._notebookOptions.computeDiffWebviewOptions(),
                fontFamily: this._generateFontFamily()
            }, undefined);
            // attach the webview container to the DOM tree first
            this._list.rowsContainer.insertAdjacentElement('afterbegin', this._modifiedWebview.element);
            this._modifiedWebview.createWebview(this.window);
            this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
            this._modifiedWebview.element.style.left = `calc(50%)`;
        }
        _generateFontFamily() {
            return this.fontInfo.fontFamily ?? `"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace`;
        }
        async _createOriginalWebview(id, viewType, resource) {
            this._originalWebview?.dispose();
            this._originalWebview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this, id, viewType, resource, {
                ...this._notebookOptions.computeDiffWebviewOptions(),
                fontFamily: this._generateFontFamily()
            }, undefined);
            // attach the webview container to the DOM tree first
            this._list.rowsContainer.insertAdjacentElement('afterbegin', this._originalWebview.element);
            this._originalWebview.createWebview(this.window);
            this._originalWebview.element.style.width = `calc(50% - 16px)`;
            this._originalWebview.element.style.left = `16px`;
        }
        setOptions(options) {
            const selections = options?.cellSelections ? (0, notebookRange_1.cellRangesToIndexes)(options.cellSelections) : undefined;
            if (selections) {
                this._list.setFocus(selections);
            }
        }
        async updateLayout(token, selections) {
            if (!this._model) {
                return;
            }
            const diffResult = await this.notebookEditorWorkerService.computeDiff(this._model.original.resource, this._model.modified.resource);
            if (token.isCancellationRequested) {
                // after await the editor might be disposed.
                return;
            }
            NotebookTextDiffEditor_1.prettyChanges(this._model, diffResult.cellsDiff);
            const { viewModels, firstChangeIndex } = NotebookTextDiffEditor_1.computeDiff(this.instantiationService, this.configurationService, this._model, this._eventDispatcher, diffResult, this.fontInfo);
            const isSame = this._isViewModelTheSame(viewModels);
            if (!isSame) {
                this._originalWebview?.removeInsets([...this._originalWebview?.insetMapping.keys()]);
                this._modifiedWebview?.removeInsets([...this._modifiedWebview?.insetMapping.keys()]);
                this._setViewModel(viewModels);
            }
            // this._diffElementViewModels = viewModels;
            // this._list.splice(0, this._list.length, this._diffElementViewModels);
            if (this._revealFirst && firstChangeIndex !== -1 && firstChangeIndex < this._list.length) {
                this._revealFirst = false;
                this._list.setFocus([firstChangeIndex]);
                this._list.reveal(firstChangeIndex, 0.3);
            }
            if (selections) {
                this._list.setFocus(selections);
            }
        }
        _isViewModelTheSame(viewModels) {
            let isSame = true;
            if (this._diffElementViewModels.length === viewModels.length) {
                for (let i = 0; i < viewModels.length; i++) {
                    const a = this._diffElementViewModels[i];
                    const b = viewModels[i];
                    if (a.original?.textModel.getHashValue() !== b.original?.textModel.getHashValue()
                        || a.modified?.textModel.getHashValue() !== b.modified?.textModel.getHashValue()) {
                        isSame = false;
                        break;
                    }
                }
            }
            else {
                isSame = false;
            }
            return isSame;
        }
        _setViewModel(viewModels) {
            this._diffElementViewModels = viewModels;
            this._list.splice(0, this._list.length, this._diffElementViewModels);
            if (this.isOverviewRulerEnabled()) {
                this._overviewRuler.updateViewModels(this._diffElementViewModels, this._eventDispatcher);
            }
        }
        /**
         * making sure that swapping cells are always translated to `insert+delete`.
         */
        static prettyChanges(model, diffResult) {
            const changes = diffResult.changes;
            for (let i = 0; i < diffResult.changes.length - 1; i++) {
                // then we know there is another change after current one
                const curr = changes[i];
                const next = changes[i + 1];
                const x = curr.originalStart;
                const y = curr.modifiedStart;
                if (curr.originalLength === 1
                    && curr.modifiedLength === 0
                    && next.originalStart === x + 2
                    && next.originalLength === 0
                    && next.modifiedStart === y + 1
                    && next.modifiedLength === 1
                    && model.original.notebook.cells[x].getHashValue() === model.modified.notebook.cells[y + 1].getHashValue()
                    && model.original.notebook.cells[x + 1].getHashValue() === model.modified.notebook.cells[y].getHashValue()) {
                    // this is a swap
                    curr.originalStart = x;
                    curr.originalLength = 0;
                    curr.modifiedStart = y;
                    curr.modifiedLength = 1;
                    next.originalStart = x + 1;
                    next.originalLength = 1;
                    next.modifiedStart = y + 2;
                    next.modifiedLength = 0;
                    i++;
                }
            }
        }
        static computeDiff(instantiationService, configurationService, model, eventDispatcher, diffResult, fontInfo) {
            const cellChanges = diffResult.cellsDiff.changes;
            const diffElementViewModels = [];
            const originalModel = model.original.notebook;
            const modifiedModel = model.modified.notebook;
            let originalCellIndex = 0;
            let modifiedCellIndex = 0;
            let firstChangeIndex = -1;
            const initData = {
                metadataStatusHeight: configurationService.getValue('notebook.diff.ignoreMetadata') ? 0 : 25,
                outputStatusHeight: configurationService.getValue('notebook.diff.ignoreOutputs') || !!(modifiedModel.transientOptions.transientOutputs) ? 0 : 25,
                fontInfo
            };
            for (let i = 0; i < cellChanges.length; i++) {
                const change = cellChanges[i];
                // common cells
                for (let j = 0; j < change.originalStart - originalCellIndex; j++) {
                    const originalCell = originalModel.cells[originalCellIndex + j];
                    const modifiedCell = modifiedModel.cells[modifiedCellIndex + j];
                    if (originalCell.getHashValue() === modifiedCell.getHashValue()) {
                        diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalCell), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedCell), 'unchanged', eventDispatcher, initData));
                    }
                    else {
                        if (firstChangeIndex === -1) {
                            firstChangeIndex = diffElementViewModels.length;
                        }
                        diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalCell), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedCell), 'modified', eventDispatcher, initData));
                    }
                }
                const modifiedLCS = NotebookTextDiffEditor_1.computeModifiedLCS(instantiationService, change, originalModel, modifiedModel, eventDispatcher, initData);
                if (modifiedLCS.length && firstChangeIndex === -1) {
                    firstChangeIndex = diffElementViewModels.length;
                }
                diffElementViewModels.push(...modifiedLCS);
                originalCellIndex = change.originalStart + change.originalLength;
                modifiedCellIndex = change.modifiedStart + change.modifiedLength;
            }
            for (let i = originalCellIndex; i < originalModel.cells.length; i++) {
                diffElementViewModels.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(model.modified.notebook, model.original.notebook, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[i]), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[i - originalCellIndex + modifiedCellIndex]), 'unchanged', eventDispatcher, initData));
            }
            return {
                viewModels: diffElementViewModels,
                firstChangeIndex
            };
        }
        static computeModifiedLCS(instantiationService, change, originalModel, modifiedModel, eventDispatcher, initData) {
            const result = [];
            // modified cells
            const modifiedLen = Math.min(change.originalLength, change.modifiedLength);
            for (let j = 0; j < modifiedLen; j++) {
                const isTheSame = originalModel.cells[change.originalStart + j].equal(modifiedModel.cells[change.modifiedStart + j]);
                result.push(new diffElementViewModel_1.SideBySideDiffElementViewModel(modifiedModel, originalModel, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[change.originalStart + j]), instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[change.modifiedStart + j]), isTheSame ? 'unchanged' : 'modified', eventDispatcher, initData));
            }
            for (let j = modifiedLen; j < change.originalLength; j++) {
                // deletion
                result.push(new diffElementViewModel_1.SingleSideDiffElementViewModel(originalModel, modifiedModel, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, originalModel.cells[change.originalStart + j]), undefined, 'delete', eventDispatcher, initData));
            }
            for (let j = modifiedLen; j < change.modifiedLength; j++) {
                // insertion
                result.push(new diffElementViewModel_1.SingleSideDiffElementViewModel(modifiedModel, originalModel, undefined, instantiationService.createInstance(diffNestedCellViewModel_1.DiffNestedCellViewModel, modifiedModel.cells[change.modifiedStart + j]), 'insert', eventDispatcher, initData));
            }
            return result;
        }
        scheduleOutputHeightAck(cellInfo, outputId, height) {
            const diffElement = cellInfo.diffElement;
            // const activeWebview = diffSide === DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
            let diffSide = notebookDiffEditorBrowser_1.DiffSide.Original;
            if (diffElement instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                const info = notebookCommon_1.CellUri.parse(cellInfo.cellUri);
                if (!info) {
                    return;
                }
                diffSide = info.notebook.toString() === this._model?.original.resource.toString() ? notebookDiffEditorBrowser_1.DiffSide.Original : notebookDiffEditorBrowser_1.DiffSide.Modified;
            }
            else {
                diffSide = diffElement.type === 'insert' ? notebookDiffEditorBrowser_1.DiffSide.Modified : notebookDiffEditorBrowser_1.DiffSide.Original;
            }
            const webview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
            DOM.scheduleAtNextAnimationFrame(this.window, () => {
                webview?.ackHeight([{ cellId: cellInfo.cellId, outputId, height }]);
            }, 10);
        }
        layoutNotebookCell(cell, height) {
            const relayout = (cell, height) => {
                this._list.updateElementHeight2(cell, height);
            };
            if (this.pendingLayouts.has(cell)) {
                this.pendingLayouts.get(cell).dispose();
            }
            let r;
            const layoutDisposable = DOM.scheduleAtNextAnimationFrame(this.window, () => {
                this.pendingLayouts.delete(cell);
                relayout(cell, height);
                r();
            });
            this.pendingLayouts.set(cell, (0, lifecycle_1.toDisposable)(() => {
                layoutDisposable.dispose();
                r();
            }));
            return new Promise(resolve => { r = resolve; });
        }
        setScrollTop(scrollTop) {
            this._list.scrollTop = scrollTop;
        }
        triggerScroll(event) {
            this._list.triggerScrollFromMouseWheelEvent(event);
        }
        previousChange() {
            let currFocus = this._list.getFocus()[0];
            if (isNaN(currFocus) || currFocus < 0) {
                currFocus = 0;
            }
            // find the index of previous change
            let prevChangeIndex = currFocus - 1;
            while (prevChangeIndex >= 0) {
                const vm = this._diffElementViewModels[prevChangeIndex];
                if (vm.type !== 'unchanged') {
                    break;
                }
                prevChangeIndex--;
            }
            if (prevChangeIndex >= 0) {
                this._list.setFocus([prevChangeIndex]);
                this._list.reveal(prevChangeIndex);
            }
            else {
                // go to the last one
                const index = (0, arraysFind_1.findLastIdx)(this._diffElementViewModels, vm => vm.type !== 'unchanged');
                if (index >= 0) {
                    this._list.setFocus([index]);
                    this._list.reveal(index);
                }
            }
        }
        nextChange() {
            let currFocus = this._list.getFocus()[0];
            if (isNaN(currFocus) || currFocus < 0) {
                currFocus = 0;
            }
            // find the index of next change
            let nextChangeIndex = currFocus + 1;
            while (nextChangeIndex < this._diffElementViewModels.length) {
                const vm = this._diffElementViewModels[nextChangeIndex];
                if (vm.type !== 'unchanged') {
                    break;
                }
                nextChangeIndex++;
            }
            if (nextChangeIndex < this._diffElementViewModels.length) {
                this._list.setFocus([nextChangeIndex]);
                this._list.reveal(nextChangeIndex);
            }
            else {
                // go to the first one
                const index = this._diffElementViewModels.findIndex(vm => vm.type !== 'unchanged');
                if (index >= 0) {
                    this._list.setFocus([index]);
                    this._list.reveal(index);
                }
            }
        }
        createOutput(cellDiffViewModel, cellViewModel, output, getOffset, diffSide) {
            this._insetModifyQueueByOutputId.queue(output.source.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(output.source)) {
                    const cellTop = this._list.getCellViewScrollTop(cellDiffViewModel);
                    await activeWebview.createOutput({ diffElement: cellDiffViewModel, cellHandle: cellViewModel.handle, cellId: cellViewModel.id, cellUri: cellViewModel.uri }, output, cellTop, getOffset());
                }
                else {
                    const cellTop = this._list.getCellViewScrollTop(cellDiffViewModel);
                    const outputIndex = cellViewModel.outputsViewModels.indexOf(output.source);
                    const outputOffset = cellDiffViewModel.getOutputOffsetInCell(diffSide, outputIndex);
                    activeWebview.updateScrollTops([{
                            cell: cellViewModel,
                            output: output.source,
                            cellTop,
                            outputOffset,
                            forceDisplay: true
                        }], []);
                }
            });
        }
        updateMarkupCellHeight() {
            // TODO
        }
        getCellByInfo(cellInfo) {
            return cellInfo.diffElement.getCellByUri(cellInfo.cellUri);
        }
        getCellById(cellId) {
            throw new Error('Not implemented');
        }
        removeInset(cellDiffViewModel, cellViewModel, displayOutput, diffSide) {
            this._insetModifyQueueByOutputId.queue(displayOutput.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(displayOutput)) {
                    return;
                }
                activeWebview.removeInsets([displayOutput]);
            });
        }
        showInset(cellDiffViewModel, cellViewModel, displayOutput, diffSide) {
            this._insetModifyQueueByOutputId.queue(displayOutput.model.outputId + (diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? '-right' : 'left'), async () => {
                const activeWebview = diffSide === notebookDiffEditorBrowser_1.DiffSide.Modified ? this._modifiedWebview : this._originalWebview;
                if (!activeWebview) {
                    return;
                }
                if (!activeWebview.insetMapping.has(displayOutput)) {
                    return;
                }
                const cellTop = this._list.getCellViewScrollTop(cellDiffViewModel);
                const outputIndex = cellViewModel.outputsViewModels.indexOf(displayOutput);
                const outputOffset = cellDiffViewModel.getOutputOffsetInCell(diffSide, outputIndex);
                activeWebview.updateScrollTops([{
                        cell: cellViewModel,
                        output: displayOutput,
                        cellTop,
                        outputOffset,
                        forceDisplay: true,
                    }], []);
            });
        }
        hideInset(cellDiffViewModel, cellViewModel, output) {
            this._modifiedWebview?.hideInset(output);
            this._originalWebview?.hideInset(output);
        }
        // private async _resolveWebview(rightEditor: boolean): Promise<BackLayerWebView | null> {
        // 	if (rightEditor) {
        // 	}
        // }
        getDomNode() {
            return this._rootElement;
        }
        getOverflowContainerDomNode() {
            return this._overflowContainer;
        }
        getControl() {
            return this;
        }
        clearInput() {
            super.clearInput();
            this._modifiedResourceDisposableStore.clear();
            this._list?.splice(0, this._list?.length || 0);
            this._model = null;
            this._diffElementViewModels.forEach(vm => vm.dispose());
            this._diffElementViewModels = [];
        }
        deltaCellOutputContainerClassNames(diffSide, cellId, added, removed) {
            if (diffSide === notebookDiffEditorBrowser_1.DiffSide.Original) {
                this._originalWebview?.deltaCellContainerClassNames(cellId, added, removed);
            }
            else {
                this._modifiedWebview?.deltaCellContainerClassNames(cellId, added, removed);
            }
        }
        getLayoutInfo() {
            if (!this._list) {
                throw new Error('Editor is not initalized successfully');
            }
            return {
                width: this._dimension.width,
                height: this._dimension.height,
                fontInfo: this.fontInfo,
                scrollHeight: this._list?.getScrollHeight() ?? 0,
                stickyHeight: 0,
            };
        }
        getCellOutputLayoutInfo(nestedCell) {
            if (!this._model) {
                throw new Error('Editor is not attached to model yet');
            }
            const documentModel = notebookCommon_1.CellUri.parse(nestedCell.uri);
            if (!documentModel) {
                throw new Error('Nested cell in the diff editor has wrong Uri');
            }
            const belongToOriginalDocument = this._model.original.notebook.uri.toString() === documentModel.notebook.toString();
            const viewModel = this._diffElementViewModels.find(element => {
                const textModel = belongToOriginalDocument ? element.original : element.modified;
                if (!textModel) {
                    return false;
                }
                if (textModel.uri.toString() === nestedCell.uri.toString()) {
                    return true;
                }
                return false;
            });
            if (!viewModel) {
                throw new Error('Nested cell in the diff editor does not match any diff element');
            }
            if (viewModel.type === 'unchanged') {
                return this.getLayoutInfo();
            }
            if (viewModel.type === 'insert' || viewModel.type === 'delete') {
                return {
                    width: this._dimension.width / 2,
                    height: this._dimension.height / 2,
                    fontInfo: this.fontInfo
                };
            }
            if (viewModel.checkIfOutputsModified()) {
                return {
                    width: this._dimension.width / 2,
                    height: this._dimension.height / 2,
                    fontInfo: this.fontInfo
                };
            }
            else {
                return this.getLayoutInfo();
            }
        }
        layout(dimension, _position) {
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            const overviewRulerEnabled = this.isOverviewRulerEnabled();
            this._dimension = dimension.with(dimension.width - (overviewRulerEnabled ? NotebookTextDiffEditor_1.ENTIRE_DIFF_OVERVIEW_WIDTH : 0));
            this._listViewContainer.style.height = `${dimension.height}px`;
            this._listViewContainer.style.width = `${this._dimension.width}px`;
            this._list?.layout(this._dimension.height, this._dimension.width);
            if (this._modifiedWebview) {
                this._modifiedWebview.element.style.width = `calc(50% - 16px)`;
                this._modifiedWebview.element.style.left = `calc(50%)`;
            }
            if (this._originalWebview) {
                this._originalWebview.element.style.width = `calc(50% - 16px)`;
                this._originalWebview.element.style.left = `16px`;
            }
            if (this._webviewTransparentCover) {
                this._webviewTransparentCover.style.height = `${this._dimension.height}px`;
                this._webviewTransparentCover.style.width = `${this._dimension.width}px`;
            }
            if (overviewRulerEnabled) {
                this._overviewRuler.layout();
            }
            this._eventDispatcher?.emit([new eventDispatcher_1.NotebookDiffLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
        }
        dispose() {
            this._isDisposed = true;
            this._layoutCancellationTokenSource?.dispose();
            this._detachModel();
            super.dispose();
        }
    };
    exports.NotebookTextDiffEditor = NotebookTextDiffEditor;
    exports.NotebookTextDiffEditor = NotebookTextDiffEditor = NotebookTextDiffEditor_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, notebookWorkerService_1.INotebookEditorWorkerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, storage_1.IStorageService),
        __param(8, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(9, codeEditorService_1.ICodeEditorService)
    ], NotebookTextDiffEditor);
    (0, zIndexRegistry_1.registerZIndex)(zIndexRegistry_1.ZIndex.Base, 10, 'notebook-diff-view-viewport-slider');
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const diffDiagonalFillColor = theme.getColor(colorRegistry_1.diffDiagonalFill);
        collector.addRule(`
	.notebook-text-diff-editor .diagonal-fill {
		background-image: linear-gradient(
			-45deg,
			${diffDiagonalFillColor} 12.5%,
			#0000 12.5%, #0000 50%,
			${diffDiagonalFillColor} 50%, ${diffDiagonalFillColor} 62.5%,
			#0000 62.5%, #0000 100%
		);
		background-size: 8px 8px;
	}
	`);
        collector.addRule(`.notebook-text-diff-editor .cell-body { margin: ${notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN}px; }`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2RpZmYvbm90ZWJvb2tEaWZmRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFnRGhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsTUFBTSwyQkFBMkI7UUFFaEMsWUFDa0IsVUFBb0I7WUFBcEIsZUFBVSxHQUFWLFVBQVUsQ0FBVTtRQUNsQyxDQUFDO1FBRUwsT0FBTyxDQUFDLEtBQTJCO1lBQ2xDLElBQUksQ0FBQyxDQUFDLEtBQUssWUFBWSwyQkFBMkIsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JELDBEQUFrRDtZQUNuRCxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN4RCwwREFBa0Q7WUFDbkQsQ0FBQztZQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNoRCwwREFBa0Q7Z0JBQ25ELENBQUM7WUFDRixDQUFDO1lBRUQsMERBQWtEO1FBQ25ELENBQUM7UUFFRCxPQUFPLENBQUMsT0FBdUI7WUFDOUIsTUFBTSxlQUFlLEdBQTJCO2dCQUMvQyxjQUFjLEVBQUUsSUFBQSxtQ0FBbUIsRUFBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2FB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