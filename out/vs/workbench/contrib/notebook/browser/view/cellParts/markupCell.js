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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/editor/contrib/wordHighlighter/browser/wordHighlighter"], function (require, exports, DOM, iconLabels_1, async_1, cancellation_1, codicons_1, themables_1, lifecycle_1, codeEditorWidget_1, editorContextKeys_1, language_1, textToHtmlTokenizer_1, nls_1, accessibility_1, configuration_1, contextkey_1, instantiation_1, serviceCollection_1, keybinding_1, notebookBrowser_1, notebookIcons_1, cellEditorOptions_1, wordHighlighter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkupCell = void 0;
    let MarkupCell = class MarkupCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, renderedEditors, accessibilityService, contextKeyService, instantiationService, languageService, configurationService, keybindingService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.renderedEditors = renderedEditors;
            this.accessibilityService = accessibilityService;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
            this.languageService = languageService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.editor = null;
            this.localDisposables = this._register(new lifecycle_1.DisposableStore());
            this.focusSwitchDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._isDisposed = false;
            this.constructDOM();
            this.editorPart = templateData.editorPart;
            this.cellEditorOptions = this._register(new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(viewCell.language), this.notebookEditor.notebookOptions, this.configurationService));
            this.cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
            this.editorOptions = this.cellEditorOptions.getValue(this.viewCell.internalMetadata, this.viewCell.uri);
            this._register((0, lifecycle_1.toDisposable)(() => renderedEditors.delete(this.viewCell)));
            this.registerListeners();
            // update for init state
            this.templateData.cellParts.scheduleRenderCell(this.viewCell);
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.templateData.cellParts.unrenderCell(this.viewCell);
            }));
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => {
                this.viewUpdate();
            }));
            this.updateForHover();
            this.updateForFocusModeChange();
            this.foldingState = viewCell.foldingState;
            this.layoutFoldingIndicator();
            this.updateFoldingIconShowClass();
            // the markdown preview's height might already be updated after the renderer calls `element.getHeight()`
            if (this.viewCell.layoutInfo.totalHeight > 0) {
                this.relayoutCell();
            }
            this.applyDecorations();
            this.viewUpdate();
            this.layoutCellParts();
            this._register(this.viewCell.onDidChangeLayout(() => {
                this.layoutCellParts();
            }));
        }
        layoutCellParts() {
            this.templateData.cellParts.updateInternalLayoutNow(this.viewCell);
        }
        constructDOM() {
            // Create an element that is only used to announce markup cell content to screen readers
            const id = `aria-markup-cell-${this.viewCell.id}`;
            this.markdownAccessibilityContainer = this.templateData.cellContainer;
            this.markdownAccessibilityContainer.id = id;
            // Hide the element from non-screen readers
            this.markdownAccessibilityContainer.style.height = '1px';
            this.markdownAccessibilityContainer.style.overflow = 'hidden';
            this.markdownAccessibilityContainer.style.position = 'absolute';
            this.markdownAccessibilityContainer.style.top = '100000px';
            this.markdownAccessibilityContainer.style.left = '10000px';
            this.markdownAccessibilityContainer.ariaHidden = 'false';
            this.templateData.rootContainer.setAttribute('aria-describedby', id);
            this.templateData.container.classList.toggle('webview-backed-markdown-cell', true);
        }
        registerListeners() {
            this._register(this.viewCell.onDidChangeState(e => {
                this.templateData.cellParts.updateState(this.viewCell, e);
            }));
            this._register(this.viewCell.model.onDidChangeMetadata(() => {
                this.viewUpdate();
            }));
            this._register(this.viewCell.onDidChangeState((e) => {
                if (e.editStateChanged || e.contentChanged) {
                    this.viewUpdate();
                }
                if (e.focusModeChanged) {
                    this.updateForFocusModeChange();
                }
                if (e.foldingStateChanged) {
                    const foldingState = this.viewCell.foldingState;
                    if (foldingState !== this.foldingState) {
                        this.foldingState = foldingState;
                        this.layoutFoldingIndicator();
                    }
                }
                if (e.cellIsHoveredChanged) {
                    this.updateForHover();
                }
                if (e.inputCollapsedChanged) {
                    this.updateCollapsedState();
                    this.viewUpdate();
                }
                if (e.cellLineNumberChanged) {
                    this.cellEditorOptions.setLineNumbers(this.viewCell.lineNumbers);
                }
            }));
            this._register(this.notebookEditor.notebookOptions.onDidChangeOptions(e => {
                if (e.showFoldingControls) {
                    this.updateFoldingIconShowClass();
                }
            }));
            this._register(this.viewCell.onDidChangeLayout((e) => {
                const layoutInfo = this.editor?.getLayoutInfo();
                if (e.outerWidth && this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing && layoutInfo && layoutInfo.width !== this.viewCell.layoutInfo.editorWidth) {
                    this.onCellEditorWidthChange();
                }
            }));
            this._register(this.cellEditorOptions.onDidChange(() => this.updateMarkupCellOptions()));
        }
        updateMarkupCellOptions() {
            this.updateEditorOptions(this.cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
            if (this.editor) {
                this.editor.updateOptions(this.cellEditorOptions.getUpdatedValue(this.viewCell.internalMetadata, this.viewCell.uri));
                const cts = new cancellation_1.CancellationTokenSource();
                this._register({ dispose() { cts.dispose(true); } });
                (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                    if (this._isDisposed) {
                        return;
                    }
                    if (model) {
                        model.updateOptions({
                            indentSize: this.cellEditorOptions.indentSize,
                            tabSize: this.cellEditorOptions.tabSize,
                            insertSpaces: this.cellEditorOptions.insertSpaces,
                        });
                    }
                });
            }
        }
        updateCollapsedState() {
            if (this.viewCell.isInputCollapsed) {
                this.notebookEditor.hideMarkupPreviews([this.viewCell]);
            }
            else {
                this.notebookEditor.unhideMarkupPreviews([this.viewCell]);
            }
        }
        updateForHover() {
            this.templateData.container.classList.toggle('markdown-cell-hover', this.viewCell.cellIsHovered);
        }
        updateForFocusModeChange() {
            if (this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                this.focusEditorIfNeeded();
            }
            this.templateData.container.classList.toggle('cell-editor-focus', this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
        }
        applyDecorations() {
            // apply decorations
            this._register(this.viewCell.onCellDecorationsChanged((e) => {
                e.added.forEach(options => {
                    if (options.className) {
                        this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [options.className], []);
                    }
                });
                e.removed.forEach(options => {
                    if (options.className) {
                        this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [], [options.className]);
                    }
                });
            }));
            this.viewCell.getCellDecorations().forEach(options => {
                if (options.className) {
                    this.notebookEditor.deltaCellContainerClassNames(this.viewCell.id, [options.className], []);
                }
            });
        }
        dispose() {
            this._isDisposed = true;
            // move focus back to the cell list otherwise the focus goes to body
            if (this.notebookEditor.getActiveCell() === this.viewCell && this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor && (this.notebookEditor.hasEditorFocus() || this.notebookEditor.getDomNode().ownerDocument.activeElement === this.notebookEditor.getDomNode().ownerDocument.body)) {
                this.notebookEditor.focusContainer();
            }
            this.viewCell.detachTextEditor();
            super.dispose();
        }
        updateFoldingIconShowClass() {
            const showFoldingIcon = this.notebookEditor.notebookOptions.getDisplayOptions().showFoldingControls;
            this.templateData.foldingIndicator.classList.remove('mouseover', 'always');
            this.templateData.foldingIndicator.classList.add(showFoldingIcon);
        }
        viewUpdate() {
            if (this.viewCell.isInputCollapsed) {
                this.viewUpdateCollapsed();
            }
            else if (this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                this.viewUpdateEditing();
            }
            else {
                this.viewUpdatePreview();
            }
        }
        viewUpdateCollapsed() {
            DOM.show(this.templateData.cellInputCollapsedContainer);
            DOM.hide(this.editorPart);
            this.templateData.cellInputCollapsedContainer.innerText = '';
            const markdownIcon = DOM.append(this.templateData.cellInputCollapsedContainer, DOM.$('span'));
            markdownIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.markdown));
            const element = DOM.$('div');
            element.classList.add('cell-collapse-preview');
            const richEditorText = this.getRichText(this.viewCell.textBuffer, this.viewCell.language);
            DOM.safeInnerHtml(element, richEditorText);
            this.templateData.cellInputCollapsedContainer.appendChild(element);
            const expandIcon = DOM.append(element, DOM.$('span.expandInputIcon'));
            expandIcon.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.more));
            const keybinding = this.keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID);
            if (keybinding) {
                element.title = (0, nls_1.localize)('cellExpandInputButtonLabelWithDoubleClick', "Double-click to expand cell input ({0})", keybinding.getLabel());
                expandIcon.title = (0, nls_1.localize)('cellExpandInputButtonLabel', "Expand Cell Input ({0})", keybinding.getLabel());
            }
            this.markdownAccessibilityContainer.ariaHidden = 'true';
            this.templateData.container.classList.toggle('input-collapsed', true);
            this.viewCell.renderedMarkdownHeight = 0;
            this.viewCell.layoutChange({});
        }
        getRichText(buffer, language) {
            return (0, textToHtmlTokenizer_1.tokenizeToStringSync)(this.languageService, buffer.getLineContent(1), language);
        }
        viewUpdateEditing() {
            // switch to editing mode
            let editorHeight;
            DOM.show(this.editorPart);
            this.markdownAccessibilityContainer.ariaHidden = 'true';
            DOM.hide(this.templateData.cellInputCollapsedContainer);
            this.notebookEditor.hideMarkupPreviews([this.viewCell]);
            this.templateData.container.classList.toggle('input-collapsed', false);
            this.templateData.container.classList.toggle('markdown-cell-edit-mode', true);
            if (this.editor && this.editor.hasModel()) {
                editorHeight = this.editor.getContentHeight();
                // not first time, we don't need to create editor
                this.viewCell.attachTextEditor(this.editor);
                this.focusEditorIfNeeded();
                this.bindEditorListeners(this.editor);
                this.editor.layout({
                    width: this.viewCell.layoutInfo.editorWidth,
                    height: editorHeight
                });
            }
            else {
                this.editorDisposables.clear();
                const width = this.notebookEditor.notebookOptions.computeMarkdownCellEditorWidth(this.notebookEditor.getLayoutInfo().width);
                const lineNum = this.viewCell.lineCount;
                const lineHeight = this.viewCell.layoutInfo.fontInfo?.lineHeight || 17;
                const editorPadding = this.notebookEditor.notebookOptions.computeEditorPadding(this.viewCell.internalMetadata, this.viewCell.uri);
                editorHeight = Math.max(lineNum, 1) * lineHeight + editorPadding.top + editorPadding.bottom;
                this.templateData.editorContainer.innerText = '';
                // create a special context key service that set the inCompositeEditor-contextkey
                const editorContextKeyService = this.contextKeyService.createScoped(this.templateData.editorPart);
                editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
                const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
                this.editorDisposables.add(editorContextKeyService);
                this.editor = this.editorDisposables.add(editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.templateData.editorContainer, {
                    ...this.editorOptions,
                    dimension: {
                        width: width,
                        height: editorHeight
                    },
                    // overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode()
                }, {
                    contributions: this.notebookEditor.creationOptions.cellEditorContributions
                }));
                this.templateData.currentEditor = this.editor;
                this.editorDisposables.add(this.editor.onDidBlurEditorWidget(() => {
                    if (this.editor) {
                        wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.stopHighlighting();
                    }
                }));
                this.editorDisposables.add(this.editor.onDidFocusEditorWidget(() => {
                    if (this.editor) {
                        wordHighlighter_1.WordHighlighterContribution.get(this.editor)?.restoreViewState(true);
                    }
                }));
                const cts = new cancellation_1.CancellationTokenSource();
                this.editorDisposables.add({ dispose() { cts.dispose(true); } });
                (0, async_1.raceCancellation)(this.viewCell.resolveTextModel(), cts.token).then(model => {
                    if (!model) {
                        return;
                    }
                    this.editor.setModel(model);
                    model.updateOptions({
                        indentSize: this.cellEditorOptions.indentSize,
                        tabSize: this.cellEditorOptions.tabSize,
                        insertSpaces: this.cellEditorOptions.insertSpaces,
                    });
                    const realContentHeight = this.editor.getContentHeight();
                    if (realContentHeight !== editorHeight) {
                        this.editor.layout({
                            width: width,
                            height: realContentHeight
                        });
                        editorHeight = realContentHeight;
                    }
                    this.viewCell.attachTextEditor(this.editor);
                    if (this.viewCell.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                        this.focusEditorIfNeeded();
                    }
                    this.bindEditorListeners(this.editor);
                    this.viewCell.editorHeight = editorHeight;
                });
            }
            this.viewCell.editorHeight = editorHeight;
            this.focusEditorIfNeeded();
            this.renderedEditors.set(this.viewCell, this.editor);
        }
        viewUpdatePreview() {
            this.viewCell.detachTextEditor();
            DOM.hide(this.editorPart);
            DOM.hide(this.templateData.cellInputCollapsedContainer);
            this.markdownAccessibilityContainer.ariaHidden = 'false';
            this.templateData.container.classList.toggle('input-collapsed', false);
            this.templateData.container.classList.toggle('markdown-cell-edit-mode', false);
            this.renderedEditors.delete(this.viewCell);
            this.markdownAccessibilityContainer.innerText = '';
            if (this.viewCell.renderedHtml) {
                if (this.accessibilityService.isScreenReaderOptimized()) {
                    DOM.safeInnerHtml(this.markdownAccessibilityContainer, this.viewCell.renderedHtml);
                }
                else {
                    DOM.clearNode(this.markdownAccessibilityContainer);
                }
            }
            this.notebookEditor.createMarkupPreview(this.viewCell);
        }
        focusEditorIfNeeded() {
            if (this.viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor &&
                (this.notebookEditor.hasEditorFocus() || this.notebookEditor.getDomNode().ownerDocument.activeElement === this.notebookEditor.getDomNode().ownerDocument.body)) { // Don't steal focus from other workbench parts, but if body has focus, we can take it
                if (!this.editor) {
                    return;
                }
                this.editor.focus();
                const primarySelection = this.editor.getSelection();
                if (!primarySelection) {
                    return;
                }
                this.notebookEditor.revealRangeInViewAsync(this.viewCell, primarySelection);
            }
        }
        layoutEditor(dimension) {
            this.editor?.layout(dimension);
        }
        onCellEditorWidthChange() {
            const realContentHeight = this.editor.getContentHeight();
            this.layoutEditor({
                width: this.viewCell.layoutInfo.editorWidth,
                height: realContentHeight
            });
            // LET the content size observer to handle it
            // this.viewCell.editorHeight = realContentHeight;
            // this.relayoutCell();
        }
        relayoutCell() {
            this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
            this.layoutFoldingIndicator();
        }
        updateEditorOptions(newValue) {
            this.editorOptions = newValue;
            this.editor?.updateOptions(this.editorOptions);
        }
        layoutFoldingIndicator() {
            switch (this.foldingState) {
                case 0 /* CellFoldingState.None */:
                    this.templateData.foldingIndicator.style.display = 'none';
                    this.templateData.foldingIndicator.innerText = '';
                    break;
                case 2 /* CellFoldingState.Collapsed */:
                    this.templateData.foldingIndicator.style.display = '';
                    DOM.reset(this.templateData.foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.collapsedIcon));
                    break;
                case 1 /* CellFoldingState.Expanded */:
                    this.templateData.foldingIndicator.style.display = '';
                    DOM.reset(this.templateData.foldingIndicator, (0, iconLabels_1.renderIcon)(notebookIcons_1.expandedIcon));
                    break;
                default:
                    break;
            }
        }
        bindEditorListeners(editor) {
            this.localDisposables.clear();
            this.focusSwitchDisposable.clear();
            this.localDisposables.add(editor.onDidContentSizeChange(e => {
                if (e.contentHeightChanged) {
                    this.onCellEditorHeightChange(editor, e.contentHeight);
                }
            }));
            this.localDisposables.add(editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const selections = editor.getSelections();
                if (selections?.length) {
                    const contentHeight = editor.getContentHeight();
                    const layoutContentHeight = this.viewCell.layoutInfo.editorHeight;
                    if (contentHeight !== layoutContentHeight) {
                        this.onCellEditorHeightChange(editor, contentHeight);
                    }
                    const lastSelection = selections[selections.length - 1];
                    this.notebookEditor.revealRangeInViewAsync(this.viewCell, lastSelection);
                }
            }));
            const updateFocusMode = () => this.viewCell.focusMode = editor.hasWidgetFocus() ? notebookBrowser_1.CellFocusMode.Editor : notebookBrowser_1.CellFocusMode.Container;
            this.localDisposables.add(editor.onDidFocusEditorWidget(() => {
                updateFocusMode();
            }));
            this.localDisposables.add(editor.onDidBlurEditorWidget(() => {
                // this is for a special case:
                // users click the status bar empty space, which we will then focus the editor
                // so we don't want to update the focus state too eagerly
                if (this.templateData.container.ownerDocument.activeElement?.contains(this.templateData.container)) {
                    this.focusSwitchDisposable.value = (0, async_1.disposableTimeout)(() => updateFocusMode(), 300);
                }
                else {
                    updateFocusMode();
                }
            }));
            updateFocusMode();
        }
        onCellEditorHeightChange(editor, newHeight) {
            const viewLayout = editor.getLayoutInfo();
            this.viewCell.editorHeight = newHeight;
            editor.layout({
                width: viewLayout.width,
                height: newHeight
            });
        }
    };
    exports.MarkupCell = MarkupCell;
    exports.MarkupCell = MarkupCell = __decorate([
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, language_1.ILanguageService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService)
    ], MarkupCell);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya3VwQ2VsbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci92aWV3L2NlbGxQYXJ0cy9tYXJrdXBDZWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSxVQUFVLEdBQWhCLE1BQU0sVUFBVyxTQUFRLHNCQUFVO1FBZXpDLFlBQ2tCLGNBQTZDLEVBQzdDLFFBQTZCLEVBQzdCLFlBQXdDLEVBQ3hDLGVBQTZELEVBQ3ZELG9CQUE0RCxFQUMvRCxpQkFBc0QsRUFDbkQsb0JBQTRELEVBQ2pFLGVBQWtELEVBQzdDLG9CQUFtRCxFQUN0RCxpQkFBNkM7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFYUyxtQkFBYyxHQUFkLGNBQWMsQ0FBK0I7WUFDN0MsYUFBUSxHQUFSLFFBQVEsQ0FBcUI7WUFDN0IsaUJBQVksR0FBWixZQUFZLENBQTRCO1lBQ3hDLG9CQUFlLEdBQWYsZUFBZSxDQUE4QztZQUN0Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNoRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDckMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBdkIxRCxXQUFNLEdBQTRCLElBQUksQ0FBQztZQUs5QixxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFDekQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUNoRSxzQkFB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