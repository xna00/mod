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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/languages/language", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/workbench/contrib/notebook/browser/view/cellParts/cellOutput", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCellExecutionIcon", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter", "vs/editor/contrib/codeAction/browser/codeActionController"], function (require, exports, DOM, async_1, cancellation_1, codicons_1, themables_1, event_1, lifecycle_1, strings, language_1, textToHtmlTokenizer_1, nls_1, configuration_1, instantiation_1, keybinding_1, opener_1, notebookBrowser_1, cellEditorOptions_1, cellOutput_1, codeCellExecutionIcon_1, codeCellViewModel_1, notebookExecutionStateService_1, wordHighlighter_1, codeActionController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCell = void 0;
    let CodeCell = class CodeCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, instantiationService, keybindingService, openerService, languageService, configurationService, notebookExecutionStateService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.languageService = languageService;
            this.configurationService = configurationService;
            this._isDisposed = false;
            this._cellEditorOptions = this._register(new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(viewCell.language), this.notebookEditor.notebookOptions, this.configurationService));
            this._outputContainerRenderer = this.instantiationService.createInstance(cellOutput_1.CellOutputContainer, notebookEditor, viewCell, templateData, { limit: codeCellViewModel_1.outputDisplayLimit });
            this.cellParts = this._register(templateData.cellParts.concatContentPart([this._cellEditorOptions, this._outputContainerRenderer], DOM.getWindow(notebookEditor.getDomNode())));
            // this.viewCell.layoutInfo.editorHeight or estimation when this.viewCell.layoutInfo.editorHeight === 0
            const editorHeight = this.calculateInitEditorHeight();
            this.initializeEditor(editorHeight);
            this._renderedInputCollapseState = false; // editor is always expanded initially
            this.registerViewCellLayoutChange();
            this.registerCellEditorEventListeners();
            this.registerDecorations();
            this.registerMouseListener();
            this._register(event_1.Event.any(this.viewCell.onDidStartExecution, this.viewCell.onDidStopExecution)((e) => {
                this.cellParts.updateForExecutionState(this.viewCell, e);
            }));
            this._register(this.viewCell.onDidChangeState(e => {
                this.cellParts.updateState(this.viewCell, e);
                if (e.outputIsHoveredChanged) {
                    this.updateForOutputHover();
                }
                if (e.outputIsFocusedChanged) {
                    this.updateForOutputFocus();
                }
                if (e.metadataChanged || e.internalMetadataChanged) {
                    this.updateEditorOptions();
                }
                if (e.inputCollapsedChanged || e.outputCollapsedChanged) {
                    this.viewCell.pauseLayout();
                    const updated = this.updateForCollapseState();
                    this.viewCell.resumeLayout();
                    if (updated) {
                        this.relayoutCell();
                    }
                }
                if (e.focusModeChanged) {
                    this.updateEditorForFocusModeChange(true);
                }
            }));
            this.cellParts.scheduleRenderCell(this.viewCell);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.cellParts.unrenderCell(this.viewCell);
            }));
            this.updateEditorOptions();
            this.updateEditorForFocusModeChange(false);
            this.updateForOutputHover();
            this.updateForOutputFocus();
            // Render Outputs
            this.viewCell.editorHeight = editorHeight;
            this._outputContainerRenderer.render();
            this._renderedOutputCollapseState = false; // the output is always rendered initially
            // Need to do this after the intial renderOutput
            this.initialViewUpdateExpanded();
            this._register(this.viewCell.onLayoutInfoRead(() => {
                this.cellParts.prepareLayout();
            }));
            const executionItemElement = DOM.append(this.templateData.cellInputCollapsedContainer, DOM.$('.collapsed-execution-icon'));
            this._register((0, lifecycle_1.toDisposable)(() => {
                executionItemElement.parentElement?.removeChild(executionItemElement);
            }));
            this._collapsedExecutionIcon = this._register(this.instantiationService.createInstance(codeCellExecutionIcon_1.CollapsedCodeCellExecutionIcon, this.notebookEditor, this.viewCell, executionItemElement));
            this.updateForCollapseState();
            this._register(event_1.Event.runAndSubscribe(viewCell.onDidChangeOutputs, this.updateForOutputs.bind(this)));
            this._register(event_1.Event.runAndSubscribe(viewCell.onDidChangeLayout, this.updateForLayout.bind(this)));
            this._cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
            templateData.editor.updateOptions(this._cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
        }
        updateCodeCellOptions(templateData) {
            templateData.editor.updateOptions(this._cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
            const cts = new cancellation_1.CancellationTokenSource();
            this._register({ dispose() { cts.dispose(true); } });
            (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                if (this._isDisposed) {
                    return;
                }
                if (model) {
                    model.updateOptions({
                        indentSize: this._cellEditorOptions.indentSize,
                        tabSize: this._cellEditorOptions.tabSize,
                        insertSpaces: this._cellEditorOptions.insertSpaces,
                    });
                }
            });
        }
        updateForLayout() {
            this._pendingLayout?.dispose();
            this._pendingLayout = DOM.modify(DOM.getWindow(this.notebookEditor.getDomNode()), () => {
                this.cellParts.updateInternalLayoutNow(this.viewCell);
            });
        }
        updateForOutputHover() {
            this.templateData.container.classList.toggle('cell-output-hover', this.viewCell.outputIsHovered);
        }
        updateForOutputFocus() {
            this.templateData.container.classList.toggle('cell-output-focus', this.viewCell.outputIsFocused);
        }
        calculateInitEditorHeight() {
            const lineNum = this.viewCell.lineCount;
            const lineHeight = this.viewCell.layoutInfo.fontInfo?.lineHeight || 17;
            const editorPadding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
            const editorHeight = this.viewCell.layoutInfo.editorHeight === 0
                ? lineNum * lineHeight + editorPadding.top + editorPadding.bottom
                : this.viewCell.layoutInfo.editorHeight;
            return editorHeight;
        }
        initializeEditor(initEditorHeight) {
            const width = this.viewCell.layoutInfo.editorWidth;
            this.layoutEditor({
                width: width,
                height: initEditorHeight
            });
            const cts = new cancellation_1.CancellationTokenSource();
            this._register({ dispose() { cts.dispose(true); } });
            (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                if (this._isDisposed) {
                    return;
                }
                if (model && this.templateData.editor) {
                    this._reigsterModelListeners(model);
                    this.templateData.editor.setModel(model);
                    model.updateOptions({
                        indentSize: this._cellEditorOptions.indentSize,
                        tabSize: this._cellEditorOptions.tabSize,
                        insertSpaces: this._cellEditorOptions.insertSpaces,
                    });
                    this.viewCell.attachTextEditor(this.templateData.editor, this.viewCell.layoutInfo.estimatedHasHorizontalScrolling);
                    const focusEditorIfNeeded = () => {
                        if (this.notebookEditor.getActiveCell() === this.viewCell &&
                            this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor &&
                            (this.notebookEditor.hasEditorFocus() || this.notebookEditor.getDomNode().ownerDocument.activeElement === this.notebookEditor.getDomNode().ownerDocument.body)) // Don't steal focus from other workbench parts, but if body has focus, we can take it
                         {
                            this.templateData.editor?.focus();
                        }
                    };
                    focusEditorIfNeeded();
                    const realContentHeight = this.templateData.editor?.getContentHeight();
                    if (realContentHeight !== undefined && realContentHeight !== initEditorHeight) {
                        this.onCellEditorHeightChange(realContentHeight);
                    }
                    focusEditorIfNeeded();
                }
                this._register(this._cellEditorOptions.onDidChange(() => this.updateCodeCellOptions(this.templateData)));
            });
        }
        updateForOutputs() {
            DOM.setVisibility(this.viewCell.outputsViewModels.length > 0, this.templateData.focusSinkElement);
        }
        updateEditorOptions() {
            const editor = this.templateData.editor;
            if (!editor) {
                return;
            }
            const isReadonly = this.notebookEditor.isReadOnly;
            const padding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
            const options = editor.getOptions();
            if (options.get(91 /* EditorOption.readOnly */) !== isReadonly || options.get(84 /* EditorOption.padding */) !== padding) {
                editor.updateOptions({ readOnly: this.notebookEditor.isReadOnly, padding: this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri) });
            }
        }
        registerViewCellLayoutChange() {
            this._register(this.viewCell.onDidChangeLayout((e) => {
                if (e.outerWidth !== undefined) {
                    const layoutInfo = this.templateData.editor.getLayoutInfo();
                    if (layoutInfo.width !== this.viewCell.layoutInfo.editorWidth) {
                        this.onCellWidthChange();
                    }
                }
            }));
        }
        registerCellEditorEventListeners() {
            this._register(this.templateData.editor.onDidContentSizeChange((e) => {
                if (e.contentHeightChanged) {
                    if (this.viewCell.layoutInfo.editorHeight !== e.contentHeight) {
                        this.onCellEditorHeightChange(e.contentHeight);
                    }
                }
            }));
            this._register(this.templateData.editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState' || e.oldModelVersionId === 0) {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const selections = this.templateData.editor.getSelections();
                if (selections?.length) {
                    const contentHeight = this.templateData.editor.getContentHeight();
                    const layoutContentHeight = this.viewCell.layoutInfo.editorHeight;
                    if (contentHeight !== layoutContentHeight) {
                        this.onCellEditorHeightChange(contentHeight);
                    }
                    const lastSelection = selections[selections.length - 1];
                    this.notebookEditor.revealRangeInViewAsync(this.viewCell, lastSelection);
                }
            }));
            this._register(this.templateData.editor.onDidBlurEditorWidget(() => {
                wordHighlighter_1.WordHighlighterContribution.get(this.templateData.editor)?.stopHighlighting();
                codeActionController_1.CodeActionController.get(this.templateData.editor)?.hideCodeActions();
                codeActionController_1.CodeActionController.get(this.templateData.editor)?.hideLightBulbWidget();
            }));
            this._register(this.templateData.editor.onDidFocusEditorWidget(() => {
                wordHighlighter_1.WordHighlighterContribution.get(this.templateData.editor)?.restoreViewState(true);
            }));
        }
        _reigsterModelListeners(model) {
            this._register(model.onDidChangeTokens(() => {
                if (this.viewCell.isInputCollapsed && this._inputCollapseElement) {
                    // flush the collapsed input with the latest tokens
                    const content = this._getRichTextFromLineTokens(model);
                    DOM.safeInnerHtml(this._inputCollapseElement, content);
                    this._attachInputExpandButton(this._inputCollapseElement);
                }
            }));
        }
        registerDecorations() {
            // Apply decorations
            this._register(this.viewCell.onCellDecorationsChanged((e) => {
                e.added.forEach(options => {
                    if (options.className) {
                        this.templateData.rootContainer.classList.add(options.className);
                    }
                    if (options.outputClassName) {
                        this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [options.outputClassName], []);
                    }
                });
                e.removed.forEach(options => {
                    if (options.className) {
                        this.templateData.rootContainer.classList.remove(options.className);
                    }
                    if (options.outputClassName) {
                        this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [], [options.outputClassName]);
                    }
                });
            }));
            this.viewCell.getCellDecorations().forEach(options => {
                if (options.className) {
                    this.templateData.rootContainer.classList.add(options.className);
                }
                if (options.outputClassName) {
                    this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [options.outputClassName], []);
                }
            });
        }
        registerMouseListener() {
            this._register(this.templateData.editor.onMouseDown(e => {
                // prevent default on right mouse click, otherwise it will trigger unexpected focus changes
                // the catch is, it means we don't allow customization of right button mouse down handlers other than the built in ones.
                if (e.event.rightButton) {
                    e.event.preventDefault();
                }
            }));
        }
        shouldUpdateDOMFocus() {
            // The DOM focus needs to be adjusted:
            // when a cell editor should be focused
            // the document active element is inside the notebook editor or the document body (cell editor being disposed previously)
            return this.notebookEditor.getActiveCell() === this.viewCell
                && this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor
                && (this.notebookEditor.hasEditorFocus() || this.notebookEditor.getDomNode().ownerDocument.activeElement === this.notebookEditor.getDomNode().ownerDocument.body);
        }
        updateEditorForFocusModeChange(sync) {
            if (this.shouldUpdateDOMFocus()) {
                if (sync) {
                    this.templateData.editor?.focus();
                }
                else {
                    this._register(DOM.runAtThisOrScheduleAtNextAnimationFrame(DOM.getWindow(this.templateData.container), () => {
                        this.templateData.editor?.focus();
                    }));
                }
            }
            this.templateData.container.classList.toggle('cell-editor-focus', this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            this.templateData.container.classList.toggle('cell-output-focus', this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Output);
        }
        updateForCollapseState() {
            if (this.viewCell.isOutputCollapsed === this._renderedOutputCollapseState &&
                this.viewCell.isInputCollapsed === this._renderedInputCollapseState) {
                return false;
            }
            this.viewCell.layoutChange({ editorHeight: true });
            if (this.viewCell.isInputCollapsed) {
                this._collapseInput();
            }
            else {
                this._showInput();
            }
            if (this.viewCell.isOutputCollapsed) {
                this._collapseOutput();
            }
            else {
                this._showOutput(false);
            }
            this.relayoutCell();
            this._renderedOutputCollapseState = this.viewCell.isOutputCollapsed;
            this._renderedInputCollapseState = this.viewCell.isInputCollapsed;
            return true;
        }
        _collapseInput() {
            // hide the editor and execution label, keep the run button
            DOM.hide(this.templateData.editorPart);
            this.templateData.container.classList.toggle('input-collapsed', true);
            // remove input preview
            this._removeInputCollapsePreview();
            this._collapsedExecutionIcon.setVisibility(true);
            // update preview
            const richEditorText = this.templateData.editor.hasModel() ? this._getRichTextFromLineTokens(this.templateData.editor.getModel()) : this._getRichText(this.viewCell.textBuffer, this.viewCell.language);
            const element = DOM.$('div.cell-collapse-preview');
            DOM.safeInnerHtml(element, richEditorText);
            this._inputCollapseElement = element;
            this.templateData.cellInputCollapsedContainer.appendChild(element);
            this._attachInputExpandButton(element);
            DOM.show(this.templateData.cellInputCollapsedContainer);
        }
        _attachInputExpandButton(element) {
            const expandIcon = DOM.$('span.expandInputIcon');
            const keybinding = this.keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID);
            if (keybinding) {
                element.title = (0, nls_1.localize)('cellExpandInputButtonLabelWithDoubleClick', "Double-click to expand cell input ({0})", keybinding.getLabel());
                expandIcon.title = (0, nls_1.localize)('cellExpandInputButtonLabel', "Expand Cell Input ({0})", keybinding.getLabel());
            }
            expandIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more));
            element.appendChild(expandIcon);
        }
        _showInput() {
            this._collapsedExecutionIcon.setVisibility(false);
            DOM.show(this.templateData.editorPart);
            DOM.hide(this.templateData.cellInputCollapsedContainer);
        }
        _getRichText(buffer, language) {
            return (0, textToHtmlTokenizer_1.tokenizeToStringSync)(this.languageService, buffer.getLineContent(1), language);
        }
        _getRichTextFromLineTokens(model) {
            let result = `<div class="monaco-tokenized-source">`;
            const firstLineTokens = model.tokenization.getLineTokens(1);
            const viewLineTokens = firstLineTokens.inflate();
            const line = model.getLineContent(1);
            let startOffset = 0;
            for (let j = 0, lenJ = viewLineTokens.getCount(); j < lenJ; j++) {
                const type = viewLineTokens.getClassName(j);
                const endIndex = viewLineTokens.getEndOffset(j);
                result += `<span class="${type}">${strings.escape(line.substring(startOffset, endIndex))}</span>`;
                startOffset = endIndex;
            }
            result += `</div>`;
            return result;
        }
        _removeInputCollapsePreview() {
            const children = this.templateData.cellInputCollapsedContainer.children;
            const elements = [];
            for (let i = 0; i < children.length; i++) {
                if (children[i].classList.contains('cell-collapse-preview')) {
                    elements.push(children[i]);
                }
            }
            elements.forEach(element => {
                element.parentElement?.removeChild(element);
            });
        }
        _updateOutputInnerContainer(hide) {
            const children = this.templateData.outputContainer.domNode.children;
            for (let i = 0; i < children.length; i++) {
                if (children[i].classList.contains('output-inner-container')) {
                    DOM.setVisibility(!hide, children[i]);
                }
            }
        }
        _collapseOutput() {
            this.templateData.container.classList.toggle('output-collapsed', true);
            DOM.show(this.templateData.cellOutputCollapsedContainer);
            this._updateOutputInnerContainer(true);
            this._outputContainerRenderer.viewUpdateHideOuputs();
        }
        _showOutput(initRendering) {
            this.templateData.container.classList.toggle('output-collapsed', false);
            DOM.hide(this.templateData.cellOutputCollapsedContainer);
            this._updateOutputInnerContainer(false);
            this._outputContainerRenderer.viewUpdateShowOutputs(initRendering);
        }
        initialViewUpdateExpanded() {
            this.templateData.container.classList.toggle('input-collapsed', false);
            DOM.show(this.templateData.editorPart);
            DOM.hide(this.templateData.cellInputCollapsedContainer);
            this.templateData.container.classList.toggle('output-collapsed', false);
            this._showOutput(true);
        }
        layoutEditor(dimension) {
            this.templateData.editor?.layout(dimension, true);
        }
        onCellWidthChange() {
            if (!this.templateData.editor.hasModel()) {
                return;
            }
            const realContentHeight = this.templateData.editor.getContentHeight();
            this.viewCell.editorHeight = realContentHeight;
            this.relayoutCell();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
        }
        onCellEditorHeightChange(newHeight) {
            const viewLayout = this.templateData.editor.getLayoutInfo();
            this.viewCell.editorHeight = newHeight;
            this.relayoutCell();
            this.layoutEditor({
                width: viewLayout.width,
                height: newHeight
            });
        }
        relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
        }
        dispose() {
            this._isDisposed = true;
            // move focus back to the cell list otherwise the focus goes to body
            if (this.shouldUpdateDOMFocus()) {
                this.notebookEditor.focusContainer();
            }
            this.viewCell.detachTextEditor();
            this._removeInputCollapsePreview();
            this._outputContainerRenderer.dispose();
            this._pendingLayout?.dispose();
            super.dispose();
        }
    };
    exports.CodeCell = CodeCell;
    exports.CodeCell = CodeCell = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, opener_1.IOpenerService),
        __param(6, language_1.ILanguageService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CodeCell);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUNlbGwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY29kZUNlbGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0J6RixJQUFNLFFBQVEsR0FBZCxNQUFNLFFBQVMsU0FBUSxzQkFBVTtRQVl2QyxZQUNrQixjQUE2QyxFQUM3QyxRQUEyQixFQUMzQixZQUFvQyxFQUM5QixvQkFBNEQsRUFDL0QsaUJBQXNELEVBQzFELGFBQTZCLEVBQzNCLGVBQWtELEVBQzdDLG9CQUFtRCxFQUMxQyw2QkFBNkQ7WUFFN0YsS0FBSyxFQUFFLENBQUM7WUFWUyxtQkFBYyxHQUFkLGNBQWMsQ0FBK0I7WUFDN0MsYUFBUSxHQUFSLFFBQVEsQ0FBbUI7WUFDM0IsaUJBQVksR0FBWixZQUFZLENBQXdCO1lBQ2IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBRXZDLG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtZQUNyQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBZG5FLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBbUJwQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFDQUFpQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDak0sSUFBSSxDQUFDLHdCQUF3QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsZ0NBQW1C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