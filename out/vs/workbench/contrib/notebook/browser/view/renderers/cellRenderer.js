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
define(["require", "exports", "vs/base/browser/pixelRatio", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/common/config/fontInfo", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/modesRegistry", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/view/cellParts/chat/cellChatPart", "vs/workbench/contrib/notebook/browser/view/cellParts/cellComments", "vs/workbench/contrib/notebook/browser/view/cellParts/cellContextKeys", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDecorations", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDnd", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDragRenderer", "vs/workbench/contrib/notebook/browser/view/cellParts/cellEditorOptions", "vs/workbench/contrib/notebook/browser/view/cellParts/cellExecution", "vs/workbench/contrib/notebook/browser/view/cellParts/cellFocus", "vs/workbench/contrib/notebook/browser/view/cellParts/cellFocusIndicator", "vs/workbench/contrib/notebook/browser/view/cellParts/cellProgressBar", "vs/workbench/contrib/notebook/browser/view/cellParts/cellStatusPart", "vs/workbench/contrib/notebook/browser/view/cellParts/cellToolbars", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCell", "vs/workbench/contrib/notebook/browser/view/cellParts/codeCellRunToolbar", "vs/workbench/contrib/notebook/browser/view/cellParts/collapsedCellInput", "vs/workbench/contrib/notebook/browser/view/cellParts/collapsedCellOutput", "vs/workbench/contrib/notebook/browser/view/cellParts/foldedCellHint", "vs/workbench/contrib/notebook/browser/view/cellParts/markupCell", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, pixelRatio_1, DOM, fastDomNode_1, lifecycle_1, codeEditorWidget_1, fontInfo_1, editorContextKeys_1, modesRegistry_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, notification_1, cellPart_1, cellChatPart_1, cellComments_1, cellContextKeys_1, cellDecorations_1, cellDnd_1, cellDragRenderer_1, cellEditorOptions_1, cellExecution_1, cellFocus_1, cellFocusIndicator_1, cellProgressBar_1, cellStatusPart_1, cellToolbars_1, codeCell_1, codeCellRunToolbar_1, collapsedCellInput_1, collapsedCellOutput_1, foldedCellHint_1, markupCell_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    var MarkupCellRenderer_1, CodeCellRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellRenderer = exports.MarkupCellRenderer = exports.NotebookCellListDelegate = void 0;
    const $ = DOM.$;
    let NotebookCellListDelegate = class NotebookCellListDelegate extends lifecycle_1.Disposable {
        constructor(targetWindow, configurationService) {
            super();
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(targetWindow).value).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        getDynamicHeight(element) {
            return element.getDynamicHeight();
        }
        getTemplateId(element) {
            if (element.cellKind === notebookCommon_1.CellKind.Markup) {
                return MarkupCellRenderer.TEMPLATE_ID;
            }
            else {
                return CodeCellRenderer.TEMPLATE_ID;
            }
        }
    };
    exports.NotebookCellListDelegate = NotebookCellListDelegate;
    exports.NotebookCellListDelegate = NotebookCellListDelegate = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], NotebookCellListDelegate);
    class AbstractCellRenderer {
        constructor(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, language, dndController) {
            this.instantiationService = instantiationService;
            this.notebookEditor = notebookEditor;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextKeyServiceProvider = contextKeyServiceProvider;
            this.dndController = dndController;
            this.editorOptions = new cellEditorOptions_1.CellEditorOptions(this.notebookEditor.getBaseCellEditorOptions(language), this.notebookEditor.notebookOptions, configurationService);
        }
        dispose() {
            this.editorOptions.dispose();
            this.dndController = undefined;
        }
    }
    let MarkupCellRenderer = class MarkupCellRenderer extends AbstractCellRenderer {
        static { MarkupCellRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'markdown_cell'; }
        constructor(notebookEditor, dndController, renderedEditors, contextKeyServiceProvider, configurationService, instantiationService, contextMenuService, menuService, keybindingService, notificationService, notebookExecutionStateService) {
            super(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, 'markdown', dndController);
            this.renderedEditors = renderedEditors;
            this._notebookExecutionStateService = notebookExecutionStateService;
        }
        get templateId() {
            return MarkupCellRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(rootContainer) {
            rootContainer.classList.add('markdown-cell-row');
            const container = DOM.append(rootContainer, DOM.$('.cell-inner-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyServiceProvider(container));
            const decorationContainer = DOM.append(rootContainer, $('.cell-decoration'));
            const titleToolbarContainer = DOM.append(container, $('.cell-title-toolbar'));
            const focusIndicatorTop = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-top')));
            const focusIndicatorLeft = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-left')));
            const foldingIndicator = DOM.append(focusIndicatorLeft.domNode, DOM.$('.notebook-folding-indicator'));
            const focusIndicatorRight = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-right')));
            const codeInnerContent = DOM.append(container, $('.cell.code'));
            const editorPart = DOM.append(codeInnerContent, $('.cell-editor-part'));
            const cellChatPart = DOM.append(editorPart, $('.cell-chat-part'));
            const cellInputCollapsedContainer = DOM.append(codeInnerContent, $('.input-collapse-container'));
            cellInputCollapsedContainer.style.display = 'none';
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            editorPart.style.display = 'none';
            const cellCommentPartContainer = DOM.append(container, $('.cell-comment-container'));
            const innerContent = DOM.append(container, $('.cell.markdown'));
            const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            const rootClassDelegate = {
                toggle: (className, force) => container.classList.toggle(className, force)
            };
            const titleToolbar = templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.CellTitleToolbarPart, titleToolbarContainer, rootClassDelegate, this.notebookEditor.creationOptions.menuIds.cellTitleToolbar, this.notebookEditor.creationOptions.menuIds.cellDeleteToolbar, this.notebookEditor));
            const focusIndicatorBottom = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-bottom')));
            const cellParts = new cellPart_1.CellPartsCollection(DOM.getWindow(rootContainer), [
                templateDisposables.add(scopedInstaService.createInstance(cellChatPart_1.CellChatPart, this.notebookEditor, cellChatPart)),
                templateDisposables.add(scopedInstaService.createInstance(cellStatusPart_1.CellEditorStatusBar, this.notebookEditor, container, editorPart, undefined)),
                templateDisposables.add(new cellFocusIndicator_1.CellFocusIndicator(this.notebookEditor, titleToolbar, focusIndicatorTop, focusIndicatorLeft, focusIndicatorRight, focusIndicatorBottom)),
                templateDisposables.add(new foldedCellHint_1.FoldedCellHint(this.notebookEditor, DOM.append(container, $('.notebook-folded-hint')), this._notebookExecutionStateService)),
                templateDisposables.add(new cellDecorations_1.CellDecorations(rootContainer, decorationContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellComments_1.CellComments, this.notebookEditor, cellCommentPartContainer)),
                templateDisposables.add(new collapsedCellInput_1.CollapsedCellInput(this.notebookEditor, cellInputCollapsedContainer)),
                templateDisposables.add(new cellFocus_1.CellFocusPart(container, undefined, this.notebookEditor)),
                templateDisposables.add(new cellDnd_1.CellDragAndDropPart(container)),
                templateDisposables.add(scopedInstaService.createInstance(cellContextKeys_1.CellContextKeyPart, this.notebookEditor)),
            ], [
                titleToolbar,
                templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.BetweenCellToolbar, this.notebookEditor, titleToolbarContainer, bottomCellContainer))
            ]);
            templateDisposables.add(cellParts);
            const templateData = {
                rootContainer,
                cellInputCollapsedContainer,
                instantiationService: scopedInstaService,
                container,
                cellContainer: innerContent,
                editorPart,
                editorContainer,
                foldingIndicator,
                templateDisposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                cellParts,
                toJSON: () => { return {}; }
            };
            return templateData;
        }
        renderElement(element, index, templateData, height) {
            if (!this.notebookEditor.hasModel()) {
                throw new Error('The notebook editor is not attached with view model yet.');
            }
            templateData.currentRenderedCell = element;
            templateData.currentEditor = undefined;
            templateData.editorPart.style.display = 'none';
            templateData.cellContainer.innerText = '';
            if (height === undefined) {
                return;
            }
            templateData.elementDisposables.add(templateData.instantiationService.createInstance(markupCell_1.MarkupCell, this.notebookEditor, element, templateData, this.renderedEditors));
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.templateDisposables.dispose();
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    exports.MarkupCellRenderer = MarkupCellRenderer;
    exports.MarkupCellRenderer = MarkupCellRenderer = MarkupCellRenderer_1 = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_1.IMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], MarkupCellRenderer);
    let CodeCellRenderer = class CodeCellRenderer extends AbstractCellRenderer {
        static { CodeCellRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'code_cell'; }
        constructor(notebookEditor, renderedEditors, dndController, contextKeyServiceProvider, configurationService, contextMenuService, menuService, instantiationService, keybindingService, notificationService) {
            super(instantiationService, notebookEditor, contextMenuService, menuService, configurationService, keybindingService, notificationService, contextKeyServiceProvider, modesRegistry_1.PLAINTEXT_LANGUAGE_ID, dndController);
            this.renderedEditors = renderedEditors;
        }
        get templateId() {
            return CodeCellRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(rootContainer) {
            rootContainer.classList.add('code-cell-row');
            const container = DOM.append(rootContainer, DOM.$('.cell-inner-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const contextKeyService = templateDisposables.add(this.contextKeyServiceProvider(container));
            const decorationContainer = DOM.append(rootContainer, $('.cell-decoration'));
            const focusIndicatorTop = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-top')));
            const titleToolbarContainer = DOM.append(container, $('.cell-title-toolbar'));
            // This is also the drag handle
            const focusIndicatorLeft = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-left')));
            const cellChatPart = DOM.append(container, $('.cell-chat-part'));
            const cellContainer = DOM.append(container, $('.cell.code'));
            const runButtonContainer = DOM.append(cellContainer, $('.run-button-container'));
            const cellInputCollapsedContainer = DOM.append(cellContainer, $('.input-collapse-container'));
            cellInputCollapsedContainer.style.display = 'none';
            const executionOrderLabel = DOM.append(focusIndicatorLeft.domNode, $('div.execution-count-label'));
            executionOrderLabel.title = (0, nls_1.localize)('cellExecutionOrderCountLabel', 'Execution Order');
            const editorPart = DOM.append(cellContainer, $('.cell-editor-part'));
            const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
            const cellCommentPartContainer = DOM.append(container, $('.cell-comment-container'));
            // create a special context key service that set the inCompositeEditor-contextkey
            const editorContextKeyService = templateDisposables.add(this.contextKeyServiceProvider(editorPart));
            const editorInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, editorContextKeyService]));
            editorContextKeys_1.EditorContextKeys.inCompositeEditor.bindTo(editorContextKeyService).set(true);
            const editor = editorInstaService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, {
                ...this.editorOptions.getDefaultValue(),
                dimension: {
                    width: 0,
                    height: 0
                },
            }, {
                contributions: this.notebookEditor.creationOptions.cellEditorContributions
            });
            templateDisposables.add(editor);
            const outputContainer = new fastDomNode_1.FastDomNode(DOM.append(container, $('.output')));
            const cellOutputCollapsedContainer = DOM.append(outputContainer.domNode, $('.output-collapse-container'));
            const outputShowMoreContainer = new fastDomNode_1.FastDomNode(DOM.append(container, $('.output-show-more-container')));
            const focusIndicatorRight = new fastDomNode_1.FastDomNode(DOM.append(container, DOM.$('.cell-focus-indicator.cell-focus-indicator-side.cell-focus-indicator-right')));
            const focusSinkElement = DOM.append(container, $('.cell-editor-focus-sink'));
            focusSinkElement.setAttribute('tabindex', '0');
            const bottomCellToolbarContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
            const focusIndicatorBottom = new fastDomNode_1.FastDomNode(DOM.append(container, $('.cell-focus-indicator.cell-focus-indicator-bottom')));
            const scopedInstaService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, contextKeyService]));
            const rootClassDelegate = {
                toggle: (className, force) => container.classList.toggle(className, force)
            };
            const titleToolbar = templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.CellTitleToolbarPart, titleToolbarContainer, rootClassDelegate, this.notebookEditor.creationOptions.menuIds.cellTitleToolbar, this.notebookEditor.creationOptions.menuIds.cellDeleteToolbar, this.notebookEditor));
            const focusIndicatorPart = templateDisposables.add(new cellFocusIndicator_1.CellFocusIndicator(this.notebookEditor, titleToolbar, focusIndicatorTop, focusIndicatorLeft, focusIndicatorRight, focusIndicatorBottom));
            const cellParts = new cellPart_1.CellPartsCollection(DOM.getWindow(rootContainer), [
                focusIndicatorPart,
                templateDisposables.add(scopedInstaService.createInstance(cellChatPart_1.CellChatPart, this.notebookEditor, cellChatPart)),
                templateDisposables.add(scopedInstaService.createInstance(cellStatusPart_1.CellEditorStatusBar, this.notebookEditor, container, editorPart, editor)),
                templateDisposables.add(scopedInstaService.createInstance(cellProgressBar_1.CellProgressBar, editorPart, cellInputCollapsedContainer)),
                templateDisposables.add(scopedInstaService.createInstance(codeCellRunToolbar_1.RunToolbar, this.notebookEditor, contextKeyService, container, runButtonContainer)),
                templateDisposables.add(new cellDecorations_1.CellDecorations(rootContainer, decorationContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellComments_1.CellComments, this.notebookEditor, cellCommentPartContainer)),
                templateDisposables.add(scopedInstaService.createInstance(cellExecution_1.CellExecutionPart, this.notebookEditor, executionOrderLabel)),
                templateDisposables.add(scopedInstaService.createInstance(collapsedCellOutput_1.CollapsedCellOutput, this.notebookEditor, cellOutputCollapsedContainer)),
                templateDisposables.add(new collapsedCellInput_1.CollapsedCellInput(this.notebookEditor, cellInputCollapsedContainer)),
                templateDisposables.add(new cellFocus_1.CellFocusPart(container, focusSinkElement, this.notebookEditor)),
                templateDisposables.add(new cellDnd_1.CellDragAndDropPart(container)),
                templateDisposables.add(scopedInstaService.createInstance(cellContextKeys_1.CellContextKeyPart, this.notebookEditor)),
            ], [
                titleToolbar,
                templateDisposables.add(scopedInstaService.createInstance(cellToolbars_1.BetweenCellToolbar, this.notebookEditor, titleToolbarContainer, bottomCellToolbarContainer))
            ]);
            templateDisposables.add(cellParts);
            const templateData = {
                rootContainer,
                editorPart,
                cellInputCollapsedContainer,
                cellOutputCollapsedContainer,
                instantiationService: scopedInstaService,
                container,
                cellContainer,
                focusSinkElement,
                outputContainer,
                outputShowMoreContainer,
                editor,
                templateDisposables,
                elementDisposables: new lifecycle_1.DisposableStore(),
                cellParts,
                toJSON: () => { return {}; }
            };
            // focusIndicatorLeft covers the left margin area
            // code/outputFocusIndicator need to be registered as drag handlers so their click handlers don't take over
            const dragHandles = [focusIndicatorLeft.domNode, focusIndicatorPart.codeFocusIndicator.domNode, focusIndicatorPart.outputFocusIndicator.domNode];
            this.dndController?.registerDragHandle(templateData, rootContainer, dragHandles, () => new cellDragRenderer_1.CodeCellDragImageRenderer().getDragImage(templateData, templateData.editor, 'code'));
            return templateData;
        }
        renderElement(element, index, templateData, height) {
            if (!this.notebookEditor.hasModel()) {
                throw new Error('The notebook editor is not attached with view model yet.');
            }
            templateData.currentRenderedCell = element;
            if (height === undefined) {
                return;
            }
            templateData.outputContainer.domNode.innerText = '';
            templateData.outputContainer.domNode.appendChild(templateData.cellOutputCollapsedContainer);
            templateData.elementDisposables.add(templateData.instantiationService.createInstance(codeCell_1.CodeCell, this.notebookEditor, element, templateData));
            this.renderedEditors.set(element, templateData.editor);
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
            this.renderedEditors.delete(element);
        }
    };
    exports.CodeCellRenderer = CodeCellRenderer;
    exports.CodeCellRenderer = CodeCellRenderer = CodeCellRenderer_1 = __decorate([
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService)
    ], CodeCellRenderer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbFJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL3ZpZXcvcmVuZGVyZXJzL2NlbGxSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0RoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQUd2RCxZQUNDLFlBQW9CLEVBQ29CLG9CQUEyQztZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUZnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBSW5GLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQWlCLFFBQVEsQ0FBQyxDQUFDO1lBQ25GLElBQUksQ0FBQyxVQUFVLEdBQUcsdUJBQVksQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLEVBQUUsdUJBQVUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBQzVILENBQUM7UUFFRCxTQUFTLENBQUMsT0FBc0I7WUFDL0IsT0FBTyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsZ0JBQWdCLENBQUMsT0FBc0I7WUFDdEMsT0FBTyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRUQsYUFBYSxDQUFDLE9BQXNCO1lBQ25DLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyx5QkFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUMxQyxPQUFPLGtCQUFrQixDQUFDLFdBQVcsQ0FBQztZQUN2QyxDQUFDO2lC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