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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/diff/diffElementOutputs", "vs/editor/browser/editorExtensions", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/base/browser/ui/iconLabel/iconLabels", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/platform/actions/browser/toolbar", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/platform/accessibility/common/accessibility", "vs/editor/browser/widget/diffEditor/diffEditorWidget"], function (require, exports, DOM, lifecycle_1, network_1, instantiation_1, diffElementViewModel_1, notebookDiffEditorBrowser_1, codeEditorWidget_1, model_1, language_1, notebookCommon_1, contextView_1, actions_1, keybinding_1, notification_1, menuEntryActionViewItem_1, contextkey_1, cellActionView_1, notebookIcons_1, diffElementOutputs_1, editorExtensions_1, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1, iconLabels_1, resolverService_1, configuration_1, themeService_1, toolbar_1, telemetry_1, diffCellEditorOptions_1, accessibility_1, diffEditorWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModifiedElement = exports.InsertElement = exports.DeletedElement = void 0;
    exports.getOptimizedNestedCodeEditorWidgetOptions = getOptimizedNestedCodeEditorWidgetOptions;
    function getOptimizedNestedCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: false,
            contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                menuPreventer_1.MenuPreventer.ID,
                selectionClipboard_1.SelectionClipboardContributionID,
                contextmenu_1.ContextMenuController.ID,
                suggestController_1.SuggestController.ID,
                snippetController2_1.SnippetController2.ID,
                tabCompletion_1.TabCompletionController.ID,
            ])
        };
    }
    let PropertyHeader = class PropertyHeader extends lifecycle_1.Disposable {
        constructor(cell, propertyHeaderContainer, notebookEditor, accessor, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, themeService, telemetryService, accessibilityService) {
            super();
            this.cell = cell;
            this.propertyHeaderContainer = propertyHeaderContainer;
            this.notebookEditor = notebookEditor;
            this.accessor = accessor;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.themeService = themeService;
            this.telemetryService = telemetryService;
            this.accessibilityService = accessibilityService;
        }
        buildHeader() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            this._foldingIndicator = DOM.append(this.propertyHeaderContainer, DOM.$('.property-folding-indicator'));
            this._foldingIndicator.classList.add(this.accessor.prefix);
            this._updateFoldingIcon();
            const metadataStatus = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-status'));
            this._statusSpan = DOM.append(metadataStatus, DOM.$('span'));
            this._description = DOM.append(metadataStatus, DOM.$('span.property-description'));
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
            }
            const cellToolbarContainer = DOM.append(this.propertyHeaderContainer, DOM.$('div.property-toolbar'));
            this._toolbar = new toolbar_1.WorkbenchToolBar(cellToolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, { hoverDelegate: options.hoverDelegate }, this.keybindingService, this.notificationService, this.contextKeyService, this.themeService, this.contextMenuService, this.accessibilityService);
                        return item;
                    }
                    return undefined;
                }
            }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.telemetryService);
            this._register(this._toolbar);
            this._toolbar.context = {
                cell: this.cell
            };
            const scopedContextKeyService = this.contextKeyService.createScoped(cellToolbarContainer);
            this._register(scopedContextKeyService);
            const propertyChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY.bindTo(scopedContextKeyService);
            propertyChanged.set(!!metadataChanged);
            this._propertyExpanded = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED.bindTo(scopedContextKeyService);
            this._menu = this.menuService.createMenu(this.accessor.menuId, scopedContextKeyService);
            this._register(this._menu);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
            this._register(this._menu.onDidChange(() => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, { shouldForwardArgs: true }, actions);
                this._toolbar.setActions(actions);
            }));
            this._register(this.notebookEditor.onMouseUp(e => {
                if (!e.event.target) {
                    return;
                }
                const target = e.event.target;
                if (target.classList.contains('codicon-notebook-collapsed') || target.classList.contains('codicon-notebook-expanded')) {
                    const parent = target.parentElement;
                    if (!parent) {
                        return;
                    }
                    if (!parent.classList.contains(this.accessor.prefix)) {
                        return;
                    }
                    if (!parent.classList.contains('property-folding-indicator')) {
                        return;
                    }
                    // folding icon
                    const cellViewModel = e.target;
                    if (cellViewModel === this.cell) {
                        const oldFoldingState = this.accessor.getFoldingState(this.cell);
                        this.accessor.updateFoldingState(this.cell, oldFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded ? diffElementViewModel_1.PropertyFoldingState.Collapsed : diffElementViewModel_1.PropertyFoldingState.Expanded);
                        this._updateFoldingIcon();
                        this.accessor.updateInfoRendering(this.cell.renderOutput);
                    }
                }
                return;
            }));
            this._updateFoldingIcon();
            this.accessor.updateInfoRendering(this.cell.renderOutput);
        }
        refresh() {
            const metadataChanged = this.accessor.checkIfModified(this.cell);
            if (metadataChanged) {
                this._statusSpan.textContent = this.accessor.changedLabel;
                this._statusSpan.style.fontWeight = 'bold';
                if (metadataChanged.reason) {
                    this._description.textContent = metadataChanged.reason;
                }
                this.propertyHeaderContainer.classList.add('modified');
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this._menu, undefined, actions);
                this._toolbar.setActions(actions);
            }
            else {
                this._statusSpan.textContent = this.accessor.unChangedLabel;
                this._statusSpan.style.fontWeight = 'normal';
                this._description.textContent = '';
                this.propertyHeaderContainer.classList.remove('modified');
                this._toolbar.setActions([]);
            }
        }
        _updateFoldingIcon() {
            if (this.accessor.getFoldingState(this.cell) === diffElementViewModel_1.PropertyFoldingState.Collapsed) {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.collapsedIcon));
                this._propertyExpanded?.set(false);
            }
            else {
                DOM.reset(this._foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.expandedIcon));
                this._propertyExpanded?.set(true);
            }
        }
    };
    PropertyHeader = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, actions_1.IMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, accessibility_1.IAccessibilityService)
    ], PropertyHeader);
    class AbstractElementRenderer extends lifecycle_1.Disposable {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.cell = cell;
            this.templateData = templateData;
            this.style = style;
            this.instantiationService = instantiationService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.textModelService = textModelService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this._metadataLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._outputLocalDisposable = this._register(new lifecycle_1.DisposableStore());
            this._ignoreMetadata = false;
            this._ignoreOutputs = false;
            // init
            this._isDisposed = false;
            this._metadataEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._outputEditorDisposeStore = this._register(new lifecycle_1.DisposableStore());
            this._register(cell.onDidLayoutChange(e => this.layout(e)));
            this._register(cell.onDidLayoutChange(e => this.updateBorders()));
            this.init();
            this.buildBody();
            this._register(cell.onDidStateChange(() => {
                this.updateOutputRendering(this.cell.renderOutput);
            }));
        }
        buildBody() {
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            this._ignoreMetadata = this.configurationService.getValue('notebook.diff.ignoreMetadata');
            if (this._ignoreMetadata) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            this._ignoreOutputs = this.configurationService.getValue('notebook.diff.ignoreOutputs') || !!(this.notebookEditor.textModel?.transientOptions.transientOutputs);
            if (this._ignoreOutputs) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreMetadata');
                    if (newValue !== undefined && this._ignoreMetadata !== newValue) {
                        this._ignoreMetadata = newValue;
                        this._metadataLocalDisposable.clear();
                        if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                            this._disposeMetadata();
                        }
                        else {
                            this.cell.metadataStatusHeight = 25;
                            this._buildMetadata();
                            this.updateMetadataRendering();
                            metadataLayoutChange = true;
                        }
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    const newValue = this.configurationService.getValue('notebook.diff.ignoreOutputs');
                    if (newValue !== undefined && this._ignoreOutputs !== (newValue || this.notebookEditor.textModel?.transientOptions.transientOutputs)) {
                        this._ignoreOutputs = newValue || !!(this.notebookEditor.textModel?.transientOptions.transientOutputs);
                        this._outputLocalDisposable.clear();
                        if (this._ignoreOutputs) {
                            this._disposeOutput();
                        }
                        else {
                            this.cell.outputStatusHeight = 25;
                            this._buildOutput();
                            outputLayoutChange = true;
                        }
                    }
                }
                if (metadataLayoutChange || outputLayoutChange) {
                    this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
                }
            }));
        }
        updateMetadataRendering() {
            if (this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                // we should expand the metadata editor
                this._metadataInfoContainer.style.display = 'block';
                if (!this._metadataEditorContainer || !this._metadataEditor) {
                    // create editor
                    this._metadataEditorContainer = DOM.append(this._metadataInfoContainer, DOM.$('.metadata-editor-container'));
                    this._buildMetadataEditor();
                }
                else {
                    this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                }
            }
            else {
                // we should collapse the metadata editor
                this._metadataInfoContainer.style.display = 'none';
                // this._metadataEditorDisposeStore.clear();
                this.cell.metadataHeight = 0;
            }
        }
        updateOutputRendering(renderRichOutput) {
            if (this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                this._outputInfoContainer.style.display = 'block';
                if (renderRichOutput) {
                    this._hideOutputsRaw();
                    this._buildOutputRendererContainer();
                    this._showOutputsRenderer();
                    this._showOutputsEmptyView();
                }
                else {
                    this._hideOutputsRenderer();
                    this._buildOutputRawContainer();
                    this._showOutputsRaw();
                }
            }
            else {
                this._outputInfoContainer.style.display = 'none';
                this._hideOutputsRaw();
                this._hideOutputsRenderer();
                this._hideOutputsEmptyView();
            }
        }
        _buildOutputRawContainer() {
            if (!this._outputEditorContainer) {
                this._outputEditorContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-editor-container'));
                this._buildOutputEditor();
            }
        }
        _showOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'block';
                this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            }
        }
        _showOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _hideOutputsRaw() {
            if (this._outputEditorContainer) {
                this._outputEditorContainer.style.display = 'none';
                this.cell.rawOutputHeight = 0;
            }
        }
        _hideOutputsEmptyView() {
            this.cell.layoutChange();
        }
        _applySanitizedMetadataChanges(currentMetadata, newMetadata) {
            const result = {};
            try {
                const newMetadataObj = JSON.parse(newMetadata);
                const keys = new Set([...Object.keys(newMetadataObj)]);
                for (const key of keys) {
                    switch (key) {
                        case 'inputCollapsed':
                        case 'outputCollapsed':
                            // boolean
                            if (typeof newMetadataObj[key] === 'boolean') {
                                result[key] = newMetadataObj[key];
                            }
                            else {
                                result[key] = currentMetadata[key];
                            }
                            break;
                        default:
                            result[key] = newMetadataObj[key];
                            break;
                    }
                }
                const index = this.notebookEditor.textModel.cells.indexOf(this.cell.modified.textModel);
                if (index < 0) {
                    return;
                }
                this.notebookEditor.textModel.applyEdits([
                    { editType: 3 /* CellEditType.Metadata */, index, metadata: result }
                ], true, undefined, () => undefined, undefined, true);
            }
            catch {
            }
        }
        async _buildMetadataEditor() {
            this._metadataEditorDisposeStore.clear();
            if (this.cell instanceof diffElementViewModel_1.SideBySideDiffElementViewModel) {
                this._metadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._metadataEditorContainer, {
                    ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                    overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                    readOnly: false,
                    originalEditable: false,
                    ignoreTrimWhitespace: false,
                    automaticLayout: false,
                    dimension: {
                        height: this.cell.layoutInfo.metadataHeight,
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), true, true)
                    }
                }, {
                    originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                    modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                });
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                this._metadataEditorContainer?.classList.add('diff');
                const originalMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellPropertyUri(this.cell.originalDocument.uri, this.cell.original.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                const modifiedMetadataModel = await this.textModelService.createModelReference(notebookCommon_1.CellUri.generateCellPropertyUri(this.cell.modifiedDocument.uri, this.cell.modified.handle, network_1.Schemas.vscodeNotebookCellMetadata));
                this._metadataEditor.setModel({
                    original: originalMetadataModel.object.textEditorModel,
                    modified: modifiedMetadataModel.object.textEditorModel
                });
                this._metadataEditorDisposeStore.add(originalMetadataModel);
                this._metadataEditorDisposeStore.add(modifiedMetadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
                let respondingToContentChange = false;
                this._metadataEditorDisposeStore.add(modifiedMetadataModel.object.textEditorModel.onDidChangeContent(() => {
                    respondingToContentChange = true;
                    const value = modifiedMetadataModel.object.textEditorModel.getValue();
                    this._applySanitizedMetadataChanges(this.cell.modified.metadata, value);
                    this._metadataHeader.refresh();
                    respondingToContentChange = false;
                }));
                this._metadataEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeMetadata(() => {
                    if (respondingToContentChange) {
                        return;
                    }
                    const modifiedMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, this.cell.modified?.metadata || {}, this.cell.modified?.language);
                    modifiedMetadataModel.object.textEditorModel.setValue(modifiedMetadataSource);
                }));
                return;
            }
            else {
                this._metadataEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._metadataEditorContainer, {
                    ...diffCellEditorOptions_1.fixedEditorOptions,
                    dimension: {
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    },
                    overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                    readOnly: false
                }, {});
                this.layout({ metadataHeight: true });
                this._metadataEditorDisposeStore.add(this._metadataEditor);
                const mode = this.languageService.createById('jsonc');
                const originalMetadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(this.notebookEditor.textModel, this.cell.type === 'insert'
                    ? this.cell.modified.metadata || {}
                    : this.cell.original.metadata || {});
                const uri = this.cell.type === 'insert'
                    ? this.cell.modified.uri
                    : this.cell.original.uri;
                const handle = this.cell.type === 'insert'
                    ? this.cell.modified.handle
                    : this.cell.original.handle;
                const modelUri = notebookCommon_1.CellUri.generateCellPropertyUri(uri, handle, network_1.Schemas.vscodeNotebookCellMetadata);
                const metadataModel = this.modelService.createModel(originalMetadataSource, mode, modelUri, false);
                this._metadataEditor.setModel(metadataModel);
                this._metadataEditorDisposeStore.add(metadataModel);
                this.cell.metadataHeight = this._metadataEditor.getContentHeight();
                this._metadataEditorDisposeStore.add(this._metadataEditor.onDidContentSizeChange((e) => {
                    if (e.contentHeightChanged && this.cell.metadataFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                        this.cell.metadataHeight = e.contentHeight;
                    }
                }));
            }
        }
        _buildOutputEditor() {
            this._outputEditorDisposeStore.clear();
            if ((this.cell.type === 'modified' || this.cell.type === 'unchanged') && !this.notebookEditor.textModel.transientOptions.transientOutputs) {
                const originalOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.original?.outputs || []);
                const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.modified?.outputs || []);
                if (originalOutputsSource !== modifiedOutputsSource) {
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputsSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputsSource, mode, undefined, true);
                    this._outputEditorDisposeStore.add(originalModel);
                    this._outputEditorDisposeStore.add(modifiedModel);
                    const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
                    const lineCount = Math.max(originalModel.getLineCount(), modifiedModel.getLineCount());
                    this._outputEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputEditorContainer, {
                        ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                        overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                        readOnly: true,
                        ignoreTrimWhitespace: false,
                        automaticLayout: false,
                        dimension: {
                            height: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.layoutInfo.rawOutputHeight || lineHeight * lineCount),
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        },
                        accessibilityVerbose: this.configurationService.getValue("accessibility.verbosity.diffEditor" /* AccessibilityVerbositySettingId.DiffEditor */) ?? false
                    }, {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._outputEditorDisposeStore.add(this._outputEditor);
                    this._outputEditorContainer?.classList.add('diff');
                    this._outputEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
                    this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
                    this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                        if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                            this.cell.rawOutputHeight = e.contentHeight;
                        }
                    }));
                    this._outputEditorDisposeStore.add(this.cell.modified.textModel.onDidChangeOutputs(() => {
                        const modifiedOutputsSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.cell.modified?.outputs || []);
                        modifiedModel.setValue(modifiedOutputsSource);
                        this._outputHeader.refresh();
                    }));
                    return;
                }
            }
            this._outputEditor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this._outputEditorContainer, {
                ...diffCellEditorOptions_1.fixedEditorOptions,
                dimension: {
                    width: Math.min(diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC, this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, this.cell.type === 'unchanged' || this.cell.type === 'modified') - 32),
                    height: this.cell.layoutInfo.rawOutputHeight
                },
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode()
            }, {});
            this._outputEditorDisposeStore.add(this._outputEditor);
            const mode = this.languageService.createById('json');
            const originaloutputSource = (0, diffElementViewModel_1.getFormattedOutputJSON)(this.notebookEditor.textModel.transientOptions.transientOutputs
                ? []
                : this.cell.type === 'insert'
                    ? this.cell.modified.outputs || []
                    : this.cell.original.outputs || []);
            const outputModel = this.modelService.createModel(originaloutputSource, mode, undefined, true);
            this._outputEditorDisposeStore.add(outputModel);
            this._outputEditor.setModel(outputModel);
            this._outputEditor.restoreViewState(this.cell.getOutputEditorViewState());
            this.cell.rawOutputHeight = this._outputEditor.getContentHeight();
            this._outputEditorDisposeStore.add(this._outputEditor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.outputFoldingState === diffElementViewModel_1.PropertyFoldingState.Expanded) {
                    this.cell.rawOutputHeight = e.contentHeight;
                }
            }));
        }
        layoutNotebookCell() {
            this.notebookEditor.layoutNotebookCell(this.cell, this.cell.layoutInfo.totalHeight);
        }
        updateBorders() {
            this.templateData.leftBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.rightBorder.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
            this.templateData.bottomBorder.style.top = `${this.cell.layoutInfo.totalHeight - 32}px`;
        }
        dispose() {
            if (this._outputEditor) {
                this.cell.saveOutputEditorViewState(this._outputEditor.saveViewState());
            }
            if (this._metadataEditor) {
                this.cell.saveMetadataEditorViewState(this._metadataEditor.saveViewState());
            }
            this._metadataEditorDisposeStore.dispose();
            this._outputEditorDisposeStore.dispose();
            this._isDisposed = true;
            super.dispose();
        }
    }
    class SingleSideDiffElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, style, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
        }
        init() {
            this._diagonalFill = this.templateData.diagonalFill;
        }
        buildBody() {
            const body = this.templateData.body;
            this._diffEditorContainer = this.templateData.diffEditorContainer;
            body.classList.remove('left', 'right', 'full');
            switch (this.style) {
                case 'left':
                    body.classList.add('left');
                    break;
                case 'right':
                    body.classList.add('right');
                    break;
                default:
                    body.classList.add('full');
                    break;
            }
            this.styleContainer(this._diffEditorContainer);
            this.updateSourceEditor();
            if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                this._disposeMetadata();
            }
            else {
                this._buildMetadata();
            }
            if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || this.notebookEditor.textModel?.transientOptions.transientOutputs) {
                this._disposeOutput();
            }
            else {
                this._buildOutput();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                let metadataLayoutChange = false;
                let outputLayoutChange = false;
                if (e.affectsConfiguration('notebook.diff.ignoreMetadata')) {
                    this._metadataLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreMetadata')) {
                        this._disposeMetadata();
                    }
                    else {
                        this.cell.metadataStatusHeight = 25;
                        this._buildMetadata();
                        this.updateMetadataRendering();
                        metadataLayoutChange = true;
                    }
                }
                if (e.affectsConfiguration('notebook.diff.ignoreOutputs')) {
                    this._outputLocalDisposable.clear();
                    if (this.configurationService.getValue('notebook.diff.ignoreOutputs') || this.notebookEditor.textModel?.transientOptions.transientOutputs) {
                        this._disposeOutput();
                    }
                    else {
                        this.cell.outputStatusHeight = 25;
                        this._buildOutput();
                        outputLayoutChange = true;
                    }
                }
                if (metadataLayoutChange || outputLayoutChange) {
                    this.layout({ metadataHeight: metadataLayoutChange, outputTotalHeight: outputLayoutChange });
                }
            }));
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
    }
    let DeletedElement = class DeletedElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, languageService, modelService, textModelService, instantiationService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'left', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('inserted');
            container.classList.add('removed');
        }
        updateSourceEditor() {
            const originalCell = this.cell.original;
            const lineCount = originalCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(originalCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    this._metadataEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    this._outputEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.totalHeight - 32}px`;
                }
                this.layoutNotebookCell();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                const span = DOM.append(this._outputEmptyElement, DOM.$('span'));
                span.innerText = 'No outputs to render';
                if (this.cell.original.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputViewContainer);
                this._register(this._outputLeftView);
                this._outputLeftView.render();
                const removedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.original.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                        removedOutputRenderListener.dispose();
                    }
                });
                this._register(removedOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputLeftView?.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputLeftView?.hideOutputs();
            }
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.DeletedElement = DeletedElement;
    exports.DeletedElement = DeletedElement = __decorate([
        __param(3, language_1.ILanguageService),
        __param(4, model_1.IModelService),
        __param(5, resolverService_1.ITextModelService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], DeletedElement);
    let InsertElement = class InsertElement extends SingleSideDiffElement {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'right', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
        }
        styleContainer(container) {
            container.classList.remove('removed');
            container.classList.add('inserted');
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editor = this.templateData.sourceEditor;
            this._editor.layout({
                width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                height: editorHeight
            });
            this._editor.updateOptions({ readOnly: false });
            this.cell.editorHeight = editorHeight;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this.textModelService.createModelReference(modifiedCell.uri).then(ref => {
                if (this._isDisposed) {
                    return;
                }
                this._register(ref);
                const textModel = ref.object.textEditorModel;
                this._editor.setModel(textModel);
                this._editor.restoreViewState(this.cell.getSourceEditorViewState());
                this.cell.editorHeight = this._editor.getContentHeight();
            });
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputViewContainer);
                this._register(this._outputRightView);
                this._outputRightView.render();
                const insertOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                    if (e.cell.uri.toString() === this.cell.modified.uri.toString()) {
                        this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                        insertOutputRenderListener.dispose();
                    }
                });
                this._register(insertOutputRenderListener);
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputRightView?.showOutputs();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputRightView?.hideOutputs();
            }
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight || state.outerWidth) {
                    this._editor.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.metadataHeight || state.outerWidth) {
                    this._metadataEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true),
                        height: this.cell.layoutInfo.metadataHeight
                    });
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    this._outputEditor?.layout({
                        width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, false),
                        height: this.cell.layoutInfo.outputTotalHeight
                    });
                }
                this.layoutNotebookCell();
                if (this._diagonalFill) {
                    this._diagonalFill.style.height = `${this.cell.layoutInfo.editorHeight + this.cell.layoutInfo.editorMargin + this.cell.layoutInfo.metadataStatusHeight + this.cell.layoutInfo.metadataHeight + this.cell.layoutInfo.outputTotalHeight + this.cell.layoutInfo.outputStatusHeight}px`;
                }
            });
        }
        dispose() {
            if (this._editor) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.InsertElement = InsertElement;
    exports.InsertElement = InsertElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], InsertElement);
    let ModifiedElement = class ModifiedElement extends AbstractElementRenderer {
        constructor(notebookEditor, cell, templateData, instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService) {
            super(notebookEditor, cell, templateData, 'full', instantiationService, languageService, modelService, textModelService, contextMenuService, keybindingService, notificationService, menuService, contextKeyService, configurationService);
            this.cell = cell;
            this.templateData = templateData;
            this._editorViewStateChanged = false;
        }
        init() { }
        styleContainer(container) {
            container.classList.remove('inserted', 'removed');
        }
        _disposeMetadata() {
            this.cell.metadataStatusHeight = 0;
            this.cell.metadataHeight = 0;
            this.templateData.metadataHeaderContainer.style.display = 'none';
            this.templateData.metadataInfoContainer.style.display = 'none';
            this._metadataEditor = undefined;
        }
        _buildMetadata() {
            this._metadataHeaderContainer = this.templateData.metadataHeaderContainer;
            this._metadataInfoContainer = this.templateData.metadataInfoContainer;
            this._metadataHeaderContainer.style.display = 'flex';
            this._metadataInfoContainer.style.display = 'block';
            this._metadataHeaderContainer.innerText = '';
            this._metadataInfoContainer.innerText = '';
            this._metadataHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._metadataHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateMetadataRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkMetadataIfModified();
                },
                getFoldingState: (cell) => {
                    return cell.metadataFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.metadataFoldingState = state;
                },
                unChangedLabel: 'Metadata',
                changedLabel: 'Metadata changed',
                prefix: 'metadata',
                menuId: actions_1.MenuId.NotebookDiffCellMetadataTitle
            });
            this._metadataLocalDisposable.add(this._metadataHeader);
            this._metadataHeader.buildHeader();
        }
        _disposeOutput() {
            this._hideOutputsRaw();
            this._hideOutputsRenderer();
            this._hideOutputsEmptyView();
            this.cell.rawOutputHeight = 0;
            this.cell.outputStatusHeight = 0;
            this.templateData.outputHeaderContainer.style.display = 'none';
            this.templateData.outputInfoContainer.style.display = 'none';
            this._outputViewContainer = undefined;
        }
        _buildOutput() {
            this.templateData.outputHeaderContainer.style.display = 'flex';
            this.templateData.outputInfoContainer.style.display = 'block';
            this._outputHeaderContainer = this.templateData.outputHeaderContainer;
            this._outputInfoContainer = this.templateData.outputInfoContainer;
            this._outputHeaderContainer.innerText = '';
            this._outputInfoContainer.innerText = '';
            if (this.cell.checkIfOutputsModified()) {
                this._outputInfoContainer.classList.add('modified');
            }
            else {
                this._outputInfoContainer.classList.remove('modified');
            }
            this._outputHeader = this.instantiationService.createInstance(PropertyHeader, this.cell, this._outputHeaderContainer, this.notebookEditor, {
                updateInfoRendering: this.updateOutputRendering.bind(this),
                checkIfModified: (cell) => {
                    return cell.checkIfOutputsModified();
                },
                getFoldingState: (cell) => {
                    return cell.outputFoldingState;
                },
                updateFoldingState: (cell, state) => {
                    cell.outputFoldingState = state;
                },
                unChangedLabel: 'Outputs',
                changedLabel: 'Outputs changed',
                prefix: 'output',
                menuId: actions_1.MenuId.NotebookDiffCellOutputsTitle
            });
            this._outputLocalDisposable.add(this._outputHeader);
            this._outputHeader.buildHeader();
        }
        _buildOutputRendererContainer() {
            if (!this._outputViewContainer) {
                this._outputViewContainer = DOM.append(this._outputInfoContainer, DOM.$('.output-view-container'));
                this._outputEmptyElement = DOM.append(this._outputViewContainer, DOM.$('.output-empty-view'));
                this._outputEmptyElement.innerText = 'No outputs to render';
                if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                    this._outputEmptyElement.style.display = 'block';
                }
                else {
                    this._outputEmptyElement.style.display = 'none';
                }
                this.cell.layoutChange();
                this._register(this.cell.modified.textModel.onDidChangeOutputs(() => {
                    // currently we only allow outputs change to the modified cell
                    if (!this.cell.checkIfOutputsModified() && this.cell.modified.outputs.length === 0) {
                        this._outputEmptyElement.style.display = 'block';
                    }
                    else {
                        this._outputEmptyElement.style.display = 'none';
                    }
                    this._decorate();
                }));
                this._outputLeftContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-left'));
                this._outputRightContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-right'));
                this._outputMetadataContainer = DOM.append(this._outputViewContainer, DOM.$('.output-view-container-metadata'));
                const outputModified = this.cell.checkIfOutputsModified();
                const outputMetadataChangeOnly = outputModified
                    && outputModified.kind === 1 /* OutputComparison.Metadata */
                    && this.cell.original.outputs.length === 1
                    && this.cell.modified.outputs.length === 1
                    && (0, diffElementViewModel_1.outputEqual)(this.cell.original.outputs[0], this.cell.modified.outputs[0]) === 1 /* OutputComparison.Metadata */;
                if (outputModified && !outputMetadataChangeOnly) {
                    const originalOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.original.uri.toString() && this.cell.checkIfOutputsModified()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                            originalOutputRenderListener.dispose();
                        }
                    });
                    const modifiedOutputRenderListener = this.notebookEditor.onDidDynamicOutputRendered(e => {
                        if (e.cell.uri.toString() === this.cell.modified.uri.toString() && this.cell.checkIfOutputsModified()) {
                            this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
                            modifiedOutputRenderListener.dispose();
                        }
                    });
                    this._register(originalOutputRenderListener);
                    this._register(modifiedOutputRenderListener);
                }
                // We should use the original text model here
                this._outputLeftView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.original, notebookDiffEditorBrowser_1.DiffSide.Original, this._outputLeftContainer);
                this._outputLeftView.render();
                this._register(this._outputLeftView);
                this._outputRightView = this.instantiationService.createInstance(diffElementOutputs_1.OutputContainer, this.notebookEditor, this.notebookEditor.textModel, this.cell, this.cell.modified, notebookDiffEditorBrowser_1.DiffSide.Modified, this._outputRightContainer);
                this._outputRightView.render();
                this._register(this._outputRightView);
                if (outputModified && !outputMetadataChangeOnly) {
                    this._decorate();
                }
                if (outputMetadataChangeOnly) {
                    this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.rawOutputHeight}px`;
                    // single output, metadata change, let's render a diff editor for metadata
                    this._outputMetadataEditor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, this._outputMetadataContainer, {
                        ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                        overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                        readOnly: true,
                        ignoreTrimWhitespace: false,
                        automaticLayout: false,
                        dimension: {
                            height: diffElementViewModel_1.OUTPUT_EDITOR_HEIGHT_MAGIC,
                            width: this.cell.getComputedCellContainerWidth(this.notebookEditor.getLayoutInfo(), false, true)
                        }
                    }, {
                        originalEditor: getOptimizedNestedCodeEditorWidgetOptions(),
                        modifiedEditor: getOptimizedNestedCodeEditorWidgetOptions()
                    });
                    this._register(this._outputMetadataEditor);
                    const originalOutputMetadataSource = JSON.stringify(this.cell.original.outputs[0].metadata ?? {}, undefined, '\t');
                    const modifiedOutputMetadataSource = JSON.stringify(this.cell.modified.outputs[0].metadata ?? {}, undefined, '\t');
                    const mode = this.languageService.createById('json');
                    const originalModel = this.modelService.createModel(originalOutputMetadataSource, mode, undefined, true);
                    const modifiedModel = this.modelService.createModel(modifiedOutputMetadataSource, mode, undefined, true);
                    this._outputMetadataEditor.setModel({
                        original: originalModel,
                        modified: modifiedModel
                    });
                    this.cell.outputMetadataHeight = this._outputMetadataEditor.getContentHeight();
                    this._register(this._outputMetadataEditor.onDidContentSizeChange((e) => {
                        this.cell.outputMetadataHeight = e.contentHeight;
                    }));
                }
            }
            this._outputViewContainer.style.display = 'block';
        }
        _decorate() {
            if (this.cell.checkIfOutputsModified()) {
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, ['nb-cellDeleted'], []);
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, ['nb-cellAdded'], []);
            }
            else {
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Original, this.cell.original.id, [], ['nb-cellDeleted']);
                this.notebookEditor.deltaCellOutputContainerClassNames(notebookDiffEditorBrowser_1.DiffSide.Modified, this.cell.modified.id, [], ['nb-cellAdded']);
            }
        }
        _showOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'block';
                this._outputLeftView?.showOutputs();
                this._outputRightView?.showOutputs();
                this._outputMetadataEditor?.layout();
                this._decorate();
            }
        }
        _hideOutputsRenderer() {
            if (this._outputViewContainer) {
                this._outputViewContainer.style.display = 'none';
                this._outputLeftView?.hideOutputs();
                this._outputRightView?.hideOutputs();
            }
        }
        updateSourceEditor() {
            const modifiedCell = this.cell.modified;
            const lineCount = modifiedCell.textModel.textBuffer.getLineCount();
            const lineHeight = this.notebookEditor.getLayoutInfo().fontInfo.lineHeight || 17;
            const editorHeight = this.cell.layoutInfo.editorHeight !== 0 ? this.cell.layoutInfo.editorHeight : lineCount * lineHeight + diffCellEditorOptions_1.fixedEditorPadding.top + diffCellEditorOptions_1.fixedEditorPadding.bottom;
            this._editorContainer = this.templateData.editorContainer;
            this._editor = this.templateData.sourceEditor;
            this._editorContainer.classList.add('diff');
            this._editor.layout({
                width: this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN,
                height: editorHeight
            });
            this._editorContainer.style.height = `${editorHeight}px`;
            this._register(this._editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged && this.cell.layoutInfo.editorHeight !== e.contentHeight) {
                    this.cell.editorHeight = e.contentHeight;
                }
            }));
            this._initializeSourceDiffEditor();
            const scopedContextKeyService = this.contextKeyService.createScoped(this.templateData.inputToolbarContainer);
            this._register(scopedContextKeyService);
            const inputChanged = notebookDiffEditorBrowser_1.NOTEBOOK_DIFF_CELL_INPUT.bindTo(scopedContextKeyService);
            this._inputToolbarContainer = this.templateData.inputToolbarContainer;
            this._toolbar = this.templateData.toolbar;
            this._toolbar.context = {
                cell: this.cell
            };
            if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                this._inputToolbarContainer.style.display = 'block';
                inputChanged.set(true);
            }
            else {
                this._inputToolbarContainer.style.display = 'none';
                inputChanged.set(false);
            }
            this._register(this.cell.modified.textModel.onDidChangeContent(() => {
                if (this.cell.modified.textModel.getValue() !== this.cell.original.textModel.getValue()) {
                    this._inputToolbarContainer.style.display = 'block';
                    inputChanged.set(true);
                }
                else {
                    this._inputToolbarContainer.style.display = 'none';
                    inputChanged.set(false);
                }
            }));
            const menu = this.menuService.createMenu(actions_1.MenuId.NotebookDiffCellInputTitle, scopedContextKeyService);
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, actions);
            this._toolbar.setActions(actions);
            menu.dispose();
        }
        async _initializeSourceDiffEditor() {
            const originalCell = this.cell.original;
            const modifiedCell = this.cell.modified;
            const originalRef = await this.textModelService.createModelReference(originalCell.uri);
            const modifiedRef = await this.textModelService.createModelReference(modifiedCell.uri);
            if (this._isDisposed) {
                return;
            }
            const textModel = originalRef.object.textEditorModel;
            const modifiedTextModel = modifiedRef.object.textEditorModel;
            this._register(originalRef);
            this._register(modifiedRef);
            this._editor.setModel({
                original: textModel,
                modified: modifiedTextModel
            });
            const handleViewStateChange = () => {
                this._editorViewStateChanged = true;
            };
            const handleScrollChange = (e) => {
                if (e.scrollTopChanged || e.scrollLeftChanged) {
                    this._editorViewStateChanged = true;
                }
            };
            this._register(this._editor.getOriginalEditor().onDidChangeCursorSelection(handleViewStateChange));
            this._register(this._editor.getOriginalEditor().onDidScrollChange(handleScrollChange));
            this._register(this._editor.getModifiedEditor().onDidChangeCursorSelection(handleViewStateChange));
            this._register(this._editor.getModifiedEditor().onDidScrollChange(handleScrollChange));
            const editorViewState = this.cell.getSourceEditorViewState();
            if (editorViewState) {
                this._editor.restoreViewState(editorViewState);
            }
            const contentHeight = this._editor.getContentHeight();
            this.cell.editorHeight = contentHeight;
        }
        layout(state) {
            DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this._diffEditorContainer), () => {
                if (state.editorHeight) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout({
                        width: this._editor.getViewWidth(),
                        height: this.cell.layoutInfo.editorHeight
                    });
                }
                if (state.outerWidth) {
                    this._editorContainer.style.height = `${this.cell.layoutInfo.editorHeight}px`;
                    this._editor.layout();
                }
                if (state.metadataHeight || state.outerWidth) {
                    if (this._metadataEditorContainer) {
                        this._metadataEditorContainer.style.height = `${this.cell.layoutInfo.metadataHeight}px`;
                        this._metadataEditor?.layout();
                    }
                }
                if (state.outputTotalHeight || state.outerWidth) {
                    if (this._outputEditorContainer) {
                        this._outputEditorContainer.style.height = `${this.cell.layoutInfo.outputTotalHeight}px`;
                        this._outputEditor?.layout();
                    }
                    if (this._outputMetadataContainer) {
                        this._outputMetadataContainer.style.height = `${this.cell.layoutInfo.outputMetadataHeight}px`;
                        this._outputMetadataContainer.style.top = `${this.cell.layoutInfo.outputTotalHeight - this.cell.layoutInfo.outputMetadataHeight}px`;
                        this._outputMetadataEditor?.layout();
                    }
                }
                this.layoutNotebookCell();
            });
        }
        dispose() {
            if (this._editor && this._editorViewStateChanged) {
                this.cell.saveSpirceEditorViewState(this._editor.saveViewState());
            }
            super.dispose();
        }
    };
    exports.ModifiedElement = ModifiedElement;
    exports.ModifiedElement = ModifiedElement = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, language_1.ILanguageService),
        __param(5, model_1.IModelService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, configuration_1.IConfigurationService)
    ], ModifiedElement);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkNvbXBvbmVudHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvZGlmZi9kaWZmQ29tcG9uZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQ2hHLDhGQVlDO0lBWkQsU0FBZ0IseUNBQXlDO1FBQ3hELE9BQU87WUFDTixjQUFjLEVBQUUsS0FBSztZQUNyQixhQUFhLEVBQUUsMkNBQXdCLENBQUMsMEJBQTBCLENBQUM7Z0JBQ2xFLDZCQUFhLENBQUMsRUFBRTtnQkFDaEIscURBQWdDO2dCQUNoQyxtQ0FBcUIsQ0FBQyxFQUFFO2dCQUN4QixxQ0FBaUIsQ0FBQyxFQUFFO2dCQUNwQix1Q0FBa0IsQ0FBQyxFQUFFO2dCQUNyQix1Q0FBdUIsQ0FBQyxFQUFFO2FBQzFCLENBQUM7U0FDRixDQUFDO0lBQ0gsQ0FBQztJQUdELElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQVF0QyxZQUNVLElBQThCLEVBQzlCLHVCQUFvQyxFQUNwQyxjQUF1QyxFQUN2QyxRQVNSLEVBQ3FDLGtCQUF1QyxFQUN4QyxpQkFBcUMsRUFDbkMsbUJBQXlDLEVBQ2pELFdBQXlCLEVBQ25CLGlCQUFxQyxFQUMxQyxZQUEyQixFQUN2QixnQkFBbUMsRUFDL0Isb0JBQTJDO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBdEJDLFNBQUksR0FBSixJQUFJLENBQTBCO1lBQzlCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBYTtZQUNwQyxtQkFBYyxHQUFkLGNBQWMsQ0FBeUI7WUFDdkMsYUFBUSxHQUFSLFFBQVEsQ0FTaEI7WUFDcUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lB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