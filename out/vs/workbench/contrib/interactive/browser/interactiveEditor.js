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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/notebookOptions", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/browser/editorExtensions", "vs/editor/contrib/parameterHints/browser/parameterHints", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/gotoError/browser/gotoError", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/extensions/common/extensions", "vs/base/common/resources", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/objects", "vs/css!./media/interactive", "vs/css!./interactiveEditor"], function (require, exports, nls, DOM, event_1, lifecycle_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, simpleEditorOptions_1, interactiveEditorInput_1, notebookEditorExtensions_1, notebookEditorService_1, editorGroupsService_1, executionStatusBarItemController_1, notebookKernelService_1, modesRegistry_1, language_1, actions_1, keybinding_1, interactiveCommon_1, configuration_1, notebookOptions_1, toolbar_1, contextView_1, menuEntryActionViewItem_1, editorExtensions_1, parameterHints_1, menuPreventer_1, selectionClipboard_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, hover_1, gotoError_1, textResourceConfiguration_1, notebookExecutionStateService_1, notebookContextKeys_1, extensions_1, resources_1, notebookFindWidget_1, notebookCommon_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditor = void 0;
    const DECORATION_KEY = 'interactiveInputDecoration';
    const INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'InteractiveEditorViewState';
    const INPUT_CELL_VERTICAL_PADDING = 8;
    const INPUT_CELL_HORIZONTAL_PADDING_RIGHT = 10;
    const INPUT_EDITOR_PADDING = 8;
    let InteractiveEditor = class InteractiveEditor extends editorPane_1.EditorPane {
        get onDidFocus() { return this._onDidFocusWidget.event; }
        constructor(group, telemetryService, themeService, storageService, instantiationService, notebookWidgetService, contextKeyService, codeEditorService, notebookKernelService, languageService, keybindingService, configurationService, menuService, contextMenuService, editorGroupService, textResourceConfigurationService, notebookExecutionStateService, extensionService) {
            super(notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID, group, telemetryService, themeService, storageService);
            this._notebookWidget = { value: undefined };
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._groupListener = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeScroll = this._register(new event_1.Emitter());
            this.onDidChangeScroll = this._onDidChangeScroll.event;
            this._instantiationService = instantiationService;
            this._notebookWidgetService = notebookWidgetService;
            this._contextKeyService = contextKeyService;
            this._configurationService = configurationService;
            this._notebookKernelService = notebookKernelService;
            this._languageService = languageService;
            this._keybindingService = keybindingService;
            this._menuService = menuService;
            this._contextMenuService = contextMenuService;
            this._editorGroupService = editorGroupService;
            this._notebookExecutionStateService = notebookExecutionStateService;
            this._extensionService = extensionService;
            this._editorOptions = this._computeEditorOptions();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._editorOptions = this._computeEditorOptions();
                }
            }));
            this._notebookOptions = new notebookOptions_1.NotebookOptions(this.window, configurationService, notebookExecutionStateService, codeEditorService, true, { cellToolbarInteraction: 'hover', globalToolbar: true, stickyScrollEnabled: false, dragAndDropEnabled: false });
            this._editorMemento = this.getEditorMemento(editorGroupService, textResourceConfigurationService, INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY);
            codeEditorService.registerDecorationType('interactive-decoration', DECORATION_KEY, {});
            this._register(this._keybindingService.onDidUpdateKeybindings(this._updateInputDecoration, this));
            this._register(this._notebookExecutionStateService.onDidChangeExecution((e) => {
                if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell && (0, resources_1.isEqual)(e.notebook, this._notebookWidget.value?.viewModel?.notebookDocument.uri)) {
                    const cell = this._notebookWidget.value?.getCellByHandle(e.cellHandle);
                    if (cell && e.changed?.state) {
                        this._scrollIfNecessary(cell);
                    }
                }
            }));
        }
        get inputCellContainerHeight() {
            return 19 + 2 + INPUT_CELL_VERTICAL_PADDING * 2 + INPUT_EDITOR_PADDING * 2;
        }
        get inputCellEditorHeight() {
            return 19 + INPUT_EDITOR_PADDING * 2;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.interactive-editor'));
            this._rootElement.style.position = 'relative';
            this._notebookEditorContainer = DOM.append(this._rootElement, DOM.$('.notebook-editor-container'));
            this._inputCellContainer = DOM.append(this._rootElement, DOM.$('.input-cell-container'));
            this._inputCellContainer.style.position = 'absolute';
            this._inputCellContainer.style.height = `${this.inputCellContainerHeight}px`;
            this._inputFocusIndicator = DOM.append(this._inputCellContainer, DOM.$('.input-focus-indicator'));
            this._inputRunButtonContainer = DOM.append(this._inputCellContainer, DOM.$('.run-button-container'));
            this._setupRunButtonToolbar(this._inputRunButtonContainer);
            this._inputEditorContainer = DOM.append(this._inputCellContainer, DOM.$('.input-editor-container'));
            this._createLayoutStyles();
        }
        _setupRunButtonToolbar(runButtonContainer) {
            const menu = this._register(this._menuService.createMenu(actions_1.MenuId.InteractiveInputExecute, this._contextKeyService));
            this._runbuttonToolbar = this._register(new toolbar_1.ToolBar(runButtonContainer, this._contextMenuService, {
                getKeyBinding: action => this._keybindingService.lookupKeybinding(action.id),
                actionViewItemProvider: (action, options) => {
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this._instantiationService, action, options);
                },
                renderDropdownAsChildElement: true
            }));
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result);
            this._runbuttonToolbar.setActions([...primary, ...secondary]);
        }
        _createLayoutStyles() {
            this._styleElement = DOM.createStyleSheet(this._rootElement);
            const styleSheets = [];
            const { codeCellLeftMargin, cellRunGutter } = this._notebookOptions.getLayoutConfiguration();
            const { focusIndicator } = this._notebookOptions.getDisplayOptions();
            const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
            styleSheets.push(`
			.interactive-editor .input-cell-container {
				padding: ${INPUT_CELL_VERTICAL_PADDING}px ${INPUT_CELL_HORIZONTAL_PADDING_RIGHT}px ${INPUT_CELL_VERTICAL_PADDING}px ${leftMargin}px;
			}
		`);
            if (focusIndicator === 'gutter') {
                styleSheets.push(`
				.interactive-editor .input-cell-container:focus-within .input-focus-indicator::before {
					border-color: var(--vscode-notebook-focusedCellBorder) !important;
				}
				.interactive-editor .input-focus-indicator::before {
					border-color: var(--vscode-notebook-inactiveFocusedCellBorder) !important;
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: block;
					top: ${INPUT_CELL_VERTICAL_PADDING}px;
				}
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--vscode-notebook-inactiveFocusedCellBorder);
				}
			`);
            }
            else {
                // border
                styleSheets.push(`
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--vscode-notebook-inactiveFocusedCellBorder);
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: none;
				}
			`);
            }
            styleSheets.push(`
			.interactive-editor .input-cell-container .run-button-container {
				width: ${cellRunGutter}px;
				left: ${codeCellLeftMargin}px;
				margin-top: ${INPUT_EDITOR_PADDING - 2}px;
			}
		`);
            this._styleElement.textContent = styleSheets.join('\n');
        }
        _computeEditorOptions() {
            let overrideIdentifier = undefined;
            if (this._codeEditorWidget) {
                overrideIdentifier = this._codeEditorWidget.getModel()?.getLanguageId();
            }
            const editorOptions = (0, objects_1.deepClone)(this._configurationService.getValue('editor', { overrideIdentifier }));
            const editorOptionsOverride = (0, simpleEditorOptions_1.getSimpleEditorOptions)(this._configurationService);
            const computed = Object.freeze({
                ...editorOptions,
                ...editorOptionsOverride,
                ...{
                    glyphMargin: true,
                    padding: {
                        top: INPUT_EDITOR_PADDING,
                        bottom: INPUT_EDITOR_PADDING
                    },
                    hover: {
                        enabled: true
                    }
                }
            });
            return computed;
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof interactiveEditorInput_1.InteractiveEditorInput)) {
                return undefined;
            }
            this._saveEditorViewState(input);
            return this._loadNotebookEditorViewState(input);
        }
        _saveEditorViewState(input) {
            if (this._notebookWidget.value && input instanceof interactiveEditorInput_1.InteractiveEditorInput) {
                if (this._notebookWidget.value.isDisposed) {
                    return;
                }
                const state = this._notebookWidget.value.getEditorViewState();
                const editorState = this._codeEditorWidget.saveViewState();
                this._editorMemento.saveEditorState(this.group, input.notebookEditorInput.resource, {
                    notebook: state,
                    input: editorState
                });
            }
        }
        _loadNotebookEditorViewState(input) {
            const result = this._editorMemento.loadEditorState(this.group, input.notebookEditorInput.resource);
            if (result) {
                return result;
            }
            // when we don't have a view state for the group/input-tuple then we try to use an existing
            // editor for the same resource.
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group.activeEditorPane !== this && group.activeEditorPane === this && group.activeEditor?.matches(input)) {
                    const notebook = this._notebookWidget.value?.getEditorViewState();
                    const input = this._codeEditorWidget.saveViewState();
                    return {
                        notebook,
                        input
                    };
                }
            }
            return;
        }
        async setInput(input, options, context, token) {
            const notebookInput = input.notebookEditorInput;
            // there currently is a widget which we still own so
            // we need to hide it before getting a new widget
            this._notebookWidget.value?.onWillHide();
            this._codeEditorWidget?.dispose();
            this._widgetDisposableStore.clear();
            this._notebookWidget = this._instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, this.group, notebookInput, {
                isEmbedded: true,
                isReadOnly: true,
                contributions: notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getSomeEditorContributions([
                    executionStatusBarItemController_1.ExecutionStateCellStatusBarContrib.id,
                    executionStatusBarItemController_1.TimerCellStatusBarContrib.id,
                    notebookFindWidget_1.NotebookFindContrib.id
                ]),
                menuIds: {
                    notebookToolbar: actions_1.MenuId.InteractiveToolbar,
                    cellTitleToolbar: actions_1.MenuId.InteractiveCellTitle,
                    cellDeleteToolbar: actions_1.MenuId.InteractiveCellDelete,
                    cellInsertToolbar: actions_1.MenuId.NotebookCellBetween,
                    cellTopInsertToolbar: actions_1.MenuId.NotebookCellListTop,
                    cellExecuteToolbar: actions_1.MenuId.InteractiveCellExecute,
                    cellExecutePrimary: undefined
                },
                cellEditorContributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    hover_1.HoverController.ID,
                    gotoError_1.MarkerController.ID
                ]),
                options: this._notebookOptions,
                codeWindow: this.window
            }, undefined, this.window);
            this._codeEditorWidget = this._instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._inputEditorContainer, this._editorOptions, {
                ...{
                    isSimpleWidget: false,
                    contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                        menuPreventer_1.MenuPreventer.ID,
                        selectionClipboard_1.SelectionClipboardContributionID,
                        contextmenu_1.ContextMenuController.ID,
                        suggestController_1.SuggestController.ID,
                        parameterHints_1.ParameterHintsController.ID,
                        snippetController2_1.SnippetController2.ID,
                        tabCompletion_1.TabCompletionController.ID,
                        hover_1.HoverController.ID,
                        gotoError_1.MarkerController.ID
                    ])
                }
            });
            if (this._lastLayoutDimensions) {
                this._notebookEditorContainer.style.height = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
                this._notebookWidget.value.layout(new DOM.Dimension(this._lastLayoutDimensions.dimension.width, this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight), this._notebookEditorContainer);
                const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
                const maxHeight = Math.min(this._lastLayoutDimensions.dimension.height / 2, this.inputCellEditorHeight);
                this._codeEditorWidget.layout(this._validateDimension(this._lastLayoutDimensions.dimension.width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
                this._inputFocusIndicator.style.height = `${this.inputCellEditorHeight}px`;
                this._inputCellContainer.style.top = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
                this._inputCellContainer.style.width = `${this._lastLayoutDimensions.dimension.width}px`;
            }
            await super.setInput(input, options, context, token);
            const model = await input.resolve();
            if (this._runbuttonToolbar) {
                this._runbuttonToolbar.context = input.resource;
            }
            if (model === null) {
                throw new Error('The Interactive Window model could not be resolved');
            }
            this._notebookWidget.value?.setParentContextKeyService(this._contextKeyService);
            const viewState = options?.viewState ?? this._loadNotebookEditorViewState(input);
            await this._extensionService.whenInstalledExtensionsRegistered();
            await this._notebookWidget.value.setModel(model.notebook, viewState?.notebook);
            model.notebook.setCellCollapseDefault(this._notebookOptions.getCellCollapseDefault());
            this._notebookWidget.value.setOptions({
                isReadOnly: true
            });
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidResizeOutput((cvm) => {
                this._scrollIfNecessary(cvm);
            }));
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidFocusWidget(() => this._onDidFocusWidget.fire()));
            this._widgetDisposableStore.add(this._notebookOptions.onDidChangeOptions(e => {
                if (e.compactView || e.focusIndicator) {
                    // update the styling
                    this._styleElement?.remove();
                    this._createLayoutStyles();
                }
                if (this._lastLayoutDimensions && this.isVisible()) {
                    this.layout(this._lastLayoutDimensions.dimension, this._lastLayoutDimensions.position);
                }
                if (e.interactiveWindowCollapseCodeCells) {
                    model.notebook.setCellCollapseDefault(this._notebookOptions.getCellCollapseDefault());
                }
            }));
            const languageId = this._notebookWidget.value?.activeKernel?.supportedLanguages[0] ?? input.language ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            const editorModel = await input.resolveInput(languageId);
            editorModel.setLanguage(languageId);
            this._codeEditorWidget.setModel(editorModel);
            if (viewState?.input) {
                this._codeEditorWidget.restoreViewState(viewState.input);
            }
            this._editorOptions = this._computeEditorOptions();
            this._codeEditorWidget.updateOptions(this._editorOptions);
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidFocusEditorWidget(() => this._onDidFocusWidget.fire()));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidContentSizeChange(e => {
                if (!e.contentHeightChanged) {
                    return;
                }
                if (this._lastLayoutDimensions) {
                    this._layoutWidgets(this._lastLayoutDimensions.dimension, this._lastLayoutDimensions.position);
                }
            }));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeCursorPosition(e => this._onDidChangeSelection.fire({ reason: this._toEditorPaneSelectionChangeReason(e) })));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeModelContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
            this._widgetDisposableStore.add(this._notebookKernelService.onDidChangeNotebookAffinity(this._syncWithKernel, this));
            this._widgetDisposableStore.add(this._notebookKernelService.onDidChangeSelectedNotebooks(this._syncWithKernel, this));
            this._widgetDisposableStore.add(this.themeService.onDidColorThemeChange(() => {
                if (this.isVisible()) {
                    this._updateInputDecoration();
                }
            }));
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeModelContent(() => {
                if (this.isVisible()) {
                    this._updateInputDecoration();
                }
            }));
            const cursorAtBoundaryContext = interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.bindTo(this._contextKeyService);
            if (input.resource && input.historyService.has(input.resource)) {
                cursorAtBoundaryContext.set('top');
            }
            else {
                cursorAtBoundaryContext.set('none');
            }
            this._widgetDisposableStore.add(this._codeEditorWidget.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this._codeEditorWidget._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                const firstLine = viewPosition.lineNumber === 1 && viewPosition.column === 1;
                const lastLine = viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol;
                if (firstLine) {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('both');
                    }
                    else {
                        cursorAtBoundaryContext.set('top');
                    }
                }
                else {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('bottom');
                    }
                    else {
                        cursorAtBoundaryContext.set('none');
                    }
                }
            }));
            this._widgetDisposableStore.add(editorModel.onDidChangeContent(() => {
                const value = editorModel.getValue();
                if (this.input?.resource && value !== '') {
                    this.input.historyService.replaceLast(this.input.resource, value);
                }
            }));
            this._widgetDisposableStore.add(this._notebookWidget.value.onDidScroll(() => this._onDidChangeScroll.fire()));
            this._syncWithKernel();
        }
        setOptions(options) {
            this._notebookWidget.value?.setOptions(options);
            super.setOptions(options);
        }
        _toEditorPaneSelectionChangeReason(e) {
            switch (e.source) {
                case "api" /* TextEditorSelectionSource.PROGRAMMATIC */: return 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */;
                case "code.navigation" /* TextEditorSelectionSource.NAVIGATION */: return 4 /* EditorPaneSelectionChangeReason.NAVIGATION */;
                case "code.jump" /* TextEditorSelectionSource.JUMP */: return 5 /* EditorPaneSelectionChangeReason.JUMP */;
                default: return 2 /* EditorPaneSelectionChangeReason.USER */;
            }
        }
        _cellAtBottom(cell) {
            const visibleRanges = this._notebookWidget.value?.visibleRanges || [];
            const cellIndex = this._notebookWidget.value?.getCellIndex(cell);
            if (cellIndex === Math.max(...visibleRanges.map(range => range.end - 1))) {
                return true;
            }
            return false;
        }
        _scrollIfNecessary(cvm) {
            const index = this._notebookWidget.value.getCellIndex(cvm);
            if (index === this._notebookWidget.value.getLength() - 1) {
                // If we're already at the bottom or auto scroll is enabled, scroll to the bottom
                if (this._configurationService.getValue(interactiveCommon_1.InteractiveWindowSetting.interactiveWindowAlwaysScrollOnNewCell) || this._cellAtBottom(cvm)) {
                    this._notebookWidget.value.scrollToBottom();
                }
            }
        }
        _syncWithKernel() {
            const notebook = this._notebookWidget.value?.textModel;
            const textModel = this._codeEditorWidget.getModel();
            if (notebook && textModel) {
                const info = this._notebookKernelService.getMatchingKernel(notebook);
                const selectedOrSuggested = info.selected
                    ?? (info.suggestions.length === 1 ? info.suggestions[0] : undefined)
                    ?? (info.all.length === 1 ? info.all[0] : undefined);
                if (selectedOrSuggested) {
                    const language = selectedOrSuggested.supportedLanguages[0];
                    // All kernels will initially list plaintext as the supported language before they properly initialized.
                    if (language && language !== 'plaintext') {
                        const newMode = this._languageService.createById(language).languageId;
                        textModel.setLanguage(newMode);
                    }
                    notebookContextKeys_1.NOTEBOOK_KERNEL.bindTo(this._contextKeyService).set(selectedOrSuggested.id);
                }
            }
            this._updateInputDecoration();
        }
        layout(dimension, position) {
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            const editorHeightChanged = dimension.height !== this._lastLayoutDimensions?.dimension.height;
            this._lastLayoutDimensions = { dimension, position };
            if (!this._notebookWidget.value) {
                return;
            }
            if (editorHeightChanged && this._codeEditorWidget) {
                suggestController_1.SuggestController.get(this._codeEditorWidget)?.cancelSuggestWidget();
            }
            this._notebookEditorContainer.style.height = `${this._lastLayoutDimensions.dimension.height - this.inputCellContainerHeight}px`;
            this._layoutWidgets(dimension, position);
        }
        _layoutWidgets(dimension, position) {
            const contentHeight = this._codeEditorWidget.hasModel() ? this._codeEditorWidget.getContentHeight() : this.inputCellEditorHeight;
            const maxHeight = Math.min(dimension.height / 2, contentHeight);
            const leftMargin = this._notebookOptions.getCellEditorContainerLeftMargin();
            const inputCellContainerHeight = maxHeight + INPUT_CELL_VERTICAL_PADDING * 2;
            this._notebookEditorContainer.style.height = `${dimension.height - inputCellContainerHeight}px`;
            this._notebookWidget.value.layout(dimension.with(dimension.width, dimension.height - inputCellContainerHeight), this._notebookEditorContainer, position);
            this._codeEditorWidget.layout(this._validateDimension(dimension.width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
            this._inputFocusIndicator.style.height = `${contentHeight}px`;
            this._inputCellContainer.style.top = `${dimension.height - inputCellContainerHeight}px`;
            this._inputCellContainer.style.width = `${dimension.width}px`;
        }
        _validateDimension(width, height) {
            return new DOM.Dimension(Math.max(0, width), Math.max(0, height));
        }
        _updateInputDecoration() {
            if (!this._codeEditorWidget) {
                return;
            }
            if (!this._codeEditorWidget.hasModel()) {
                return;
            }
            const model = this._codeEditorWidget.getModel();
            const decorations = [];
            if (model?.getValueLength() === 0) {
                const transparentForeground = (0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())?.transparent(0.4);
                const languageId = model.getLanguageId();
                const keybinding = this._keybindingService.lookupKeybinding('interactive.execute', this._contextKeyService)?.getLabel();
                const text = nls.localize('interactiveInputPlaceHolder', "Type '{0}' code here and press {1} to run", languageId, keybinding ?? 'ctrl+enter');
                decorations.push({
                    range: {
                        startLineNumber: 0,
                        endLineNumber: 0,
                        startColumn: 0,
                        endColumn: 1
                    },
                    renderOptions: {
                        after: {
                            contentText: text,
                            color: transparentForeground ? transparentForeground.toString() : undefined
                        }
                    }
                });
            }
            this._codeEditorWidget.setDecorationsByType('interactive-decoration', DECORATION_KEY, decorations);
        }
        getScrollPosition() {
            return {
                scrollTop: this._notebookWidget.value?.scrollTop ?? 0,
                scrollLeft: 0
            };
        }
        setScrollPosition(position) {
            this._notebookWidget.value?.setScrollTop(position.scrollTop);
        }
        focus() {
            super.focus();
            this._notebookWidget.value?.onShow();
            this._codeEditorWidget.focus();
        }
        focusHistory() {
            this._notebookWidget.value.focus();
        }
        setEditorVisible(visible) {
            super.setEditorVisible(visible);
            this._groupListener.value = this.group.onWillCloseEditor(e => this._saveEditorViewState(e.editor));
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._notebookWidget.value) {
                    this._notebookWidget.value.onWillHide();
                }
            }
        }
        clearInput() {
            if (this._notebookWidget.value) {
                this._saveEditorViewState(this.input);
                this._notebookWidget.value.onWillHide();
            }
            this._codeEditorWidget?.dispose();
            this._notebookWidget = { value: undefined };
            this._widgetDisposableStore.clear();
            super.clearInput();
        }
        getControl() {
            return {
                notebookEditor: this._notebookWidget.value,
                codeEditor: this._codeEditorWidget
            };
        }
    };
    exports.InteractiveEditor = InteractiveEditor;
    exports.InteractiveEditor = InteractiveEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, notebookEditorService_1.INotebookEditorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, notebookKernelService_1.INotebookKernelService),
        __param(9, language_1.ILanguageService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, actions_1.IMenuService),
        __param(13, contextView_1.IContextMenuService),
        __param(14, editorGroupsService_1.IEditorGroupsService),
        __param(15, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(16, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(17, extensions_1.IExtensionService)
    ], InteractiveEditor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3RpdmVFZGl0b3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ludGVyYWN0aXZlL2Jyb3dzZXIvaW50ZXJhY3RpdmVFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0RoRyxNQUFNLGNBQWMsR0FBRyw0QkFBNEIsQ0FBQztJQUNwRCxNQUFNLDRDQUE0QyxHQUFHLDRCQUE0QixDQUFDO0lBRWxGLE1BQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sbUNBQW1DLEdBQUcsRUFBRSxDQUFDO0lBQy9DLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0lBV3hCLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsdUJBQVU7UUErQmhELElBQWEsVUFBVSxLQUFrQixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBTS9FLFlBQ0MsS0FBbUIsRUFDQSxnQkFBbUMsRUFDdkMsWUFBMkIsRUFDekIsY0FBK0IsRUFDekIsb0JBQTJDLEVBQzFDLHFCQUE2QyxFQUNqRCxpQkFBcUMsRUFDckMsaUJBQXFDLEVBQ2pDLHFCQUE2QyxFQUNuRCxlQUFpQyxFQUMvQixpQkFBcUMsRUFDbEMsb0JBQTJDLEVBQ3BELFdBQXlCLEVBQ2xCLGtCQUF1QyxFQUN0QyxrQkFBd0MsRUFDM0IsZ0NBQW1FLEVBQ3RFLDZCQUE2RCxFQUMxRSxnQkFBbUM7WUFFdEQsS0FBSyxDQUNKLDZDQUE0QixFQUM1QixLQUFLLEVBQ0wsZ0JBQWdCLEVBQ2hCLFlBQVksRUFDWixjQUFjLENBQ2QsQ0FBQztZQTNESyxvQkFBZSxHQUF1QyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztZQWtCM0UsMkJBQXNCLEdB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