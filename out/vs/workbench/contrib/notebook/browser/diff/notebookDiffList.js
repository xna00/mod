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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/diff/notebookDiffEditorBrowser", "vs/workbench/contrib/notebook/browser/diff/diffComponents", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/view/cellParts/cellActionView", "vs/editor/common/config/fontInfo", "vs/base/browser/pixelRatio", "vs/platform/actions/browser/toolbar", "vs/workbench/contrib/notebook/browser/diff/diffCellEditorOptions", "vs/platform/accessibility/common/accessibility", "vs/css!./notebookDiff"], function (require, exports, DOM, listWidget_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, listService_1, themeService_1, notebookDiffEditorBrowser_1, diffComponents_1, codeEditorWidget_1, diffEditorWidget_1, actions_1, contextView_1, notification_1, cellActionView_1, fontInfo_1, pixelRatio_1, toolbar_1, diffCellEditorOptions_1, accessibility_1) {
    "use strict";
    var CellDiffSingleSideRenderer_1, CellDiffSideBySideRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookTextDiffList = exports.NotebookMouseController = exports.CellDiffSideBySideRenderer = exports.CellDiffSingleSideRenderer = exports.NotebookCellTextDiffListDelegate = void 0;
    let NotebookCellTextDiffListDelegate = class NotebookCellTextDiffListDelegate {
        constructor(targetWindow, configurationService) {
            this.configurationService = configurationService;
            const editorOptions = this.configurationService.getValue('editor');
            this.lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, pixelRatio_1.PixelRatio.getInstance(targetWindow).value).lineHeight;
        }
        getHeight(element) {
            return element.getHeight(this.lineHeight);
        }
        hasDynamicHeight(element) {
            return false;
        }
        getTemplateId(element) {
            switch (element.type) {
                case 'delete':
                case 'insert':
                    return CellDiffSingleSideRenderer.TEMPLATE_ID;
                case 'modified':
                case 'unchanged':
                    return CellDiffSideBySideRenderer.TEMPLATE_ID;
            }
        }
    };
    exports.NotebookCellTextDiffListDelegate = NotebookCellTextDiffListDelegate;
    exports.NotebookCellTextDiffListDelegate = NotebookCellTextDiffListDelegate = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], NotebookCellTextDiffListDelegate);
    let CellDiffSingleSideRenderer = class CellDiffSingleSideRenderer {
        static { CellDiffSingleSideRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'cell_diff_single'; }
        constructor(notebookEditor, instantiationService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
        }
        get templateId() {
            return CellDiffSingleSideRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const diagonalFill = DOM.append(body, DOM.$('.diagonal-fill'));
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const editor = this._buildSourceEditor(sourceContainer);
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                diagonalFill,
                sourceEditor: editor,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, {
                ...diffCellEditorOptions_1.fixedEditorOptions,
                dimension: {
                    width: (this.notebookEditor.getLayoutInfo().width - 2 * notebookDiffEditorBrowser_1.DIFF_CELL_MARGIN) / 2 - 18,
                    height: 0
                },
                automaticLayout: false,
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode()
            }, {});
            return editor;
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'delete':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.DeletedElement, this.notebookEditor, element, templateData));
                    return;
                case 'insert':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.InsertElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
            templateData.elementDisposables.dispose();
        }
        disposeElement(element, index, templateData) {
            templateData.elementDisposables.clear();
        }
    };
    exports.CellDiffSingleSideRenderer = CellDiffSingleSideRenderer;
    exports.CellDiffSingleSideRenderer = CellDiffSingleSideRenderer = CellDiffSingleSideRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellDiffSingleSideRenderer);
    let CellDiffSideBySideRenderer = class CellDiffSideBySideRenderer {
        static { CellDiffSideBySideRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'cell_diff_side_by_side'; }
        constructor(notebookEditor, instantiationService, contextMenuService, keybindingService, menuService, contextKeyService, notificationService, themeService, accessibilityService) {
            this.notebookEditor = notebookEditor;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.themeService = themeService;
            this.accessibilityService = accessibilityService;
        }
        get templateId() {
            return CellDiffSideBySideRenderer_1.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const body = DOM.$('.cell-body');
            DOM.append(container, body);
            const diffEditorContainer = DOM.$('.cell-diff-editor-container');
            DOM.append(body, diffEditorContainer);
            const sourceContainer = DOM.append(diffEditorContainer, DOM.$('.source-container'));
            const { editor, editorContainer } = this._buildSourceEditor(sourceContainer);
            const inputToolbarContainer = DOM.append(sourceContainer, DOM.$('.editor-input-toolbar-container'));
            const cellToolbarContainer = DOM.append(inputToolbarContainer, DOM.$('div.property-toolbar'));
            const toolbar = this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, cellToolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction) {
                        const item = new cellActionView_1.CodiconActionViewItem(action, { hoverDelegate: options.hoverDelegate }, this.keybindingService, this.notificationService, this.contextKeyService, this.themeService, this.contextMenuService, this.accessibilityService);
                        return item;
                    }
                    return undefined;
                }
            });
            const metadataHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-header-container'));
            const metadataInfoContainer = DOM.append(diffEditorContainer, DOM.$('.metadata-info-container'));
            const outputHeaderContainer = DOM.append(diffEditorContainer, DOM.$('.output-header-container'));
            const outputInfoContainer = DOM.append(diffEditorContainer, DOM.$('.output-info-container'));
            const borderContainer = DOM.append(body, DOM.$('.border-container'));
            const leftBorder = DOM.append(borderContainer, DOM.$('.left-border'));
            const rightBorder = DOM.append(borderContainer, DOM.$('.right-border'));
            const topBorder = DOM.append(borderContainer, DOM.$('.top-border'));
            const bottomBorder = DOM.append(borderContainer, DOM.$('.bottom-border'));
            return {
                body,
                container,
                diffEditorContainer,
                sourceEditor: editor,
                editorContainer,
                inputToolbarContainer,
                toolbar,
                metadataHeaderContainer,
                metadataInfoContainer,
                outputHeaderContainer,
                outputInfoContainer,
                leftBorder,
                rightBorder,
                topBorder,
                bottomBorder,
                elementDisposables: new lifecycle_1.DisposableStore()
            };
        }
        _buildSourceEditor(sourceContainer) {
            const editorContainer = DOM.append(sourceContainer, DOM.$('.editor-container'));
            const editor = this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, editorContainer, {
                ...diffCellEditorOptions_1.fixedDiffEditorOptions,
                padding: {
                    top: 24,
                    bottom: 12
                },
                overflowWidgetsDomNode: this.notebookEditor.getOverflowContainerDomNode(),
                originalEditable: false,
                ignoreTrimWhitespace: false,
                automaticLayout: false,
                dimension: {
                    height: 0,
                    width: 0
                },
                renderSideBySide: true,
                useInlineViewWhenSpaceIsLimited: false
            }, {
                originalEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)(),
                modifiedEditor: (0, diffComponents_1.getOptimizedNestedCodeEditorWidgetOptions)()
            });
            return {
                editor,
                editorContainer
            };
        }
        renderElement(element, index, templateData, height) {
            templateData.body.classList.remove('left', 'right', 'full');
            switch (element.type) {
                case 'unchanged':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                case 'modified':
                    templateData.elementDisposables.add(this.instantiationService.createInstance(diffComponents_1.ModifiedElement, this.notebookEditor, element, templateData));
                    return;
                default:
                    break;
            }
        }
        disposeTemplate(templateData) {
            templateData.container.innerText = '';
            templateData.sourceEditor.dispose();
            templateData.toolbar?.dispose();
            templateData.elementDisposables.dispose();
        }
        disposeElement(element, index, templateData) {
            if (templateData.toolbar) {
                templateData.toolbar.context = undefined;
            }
            templateData.elementDisposables.clear();
        }
    };
    exports.CellDiffSideBySideRenderer = CellDiffSideBySideRenderer;
    exports.CellDiffSideBySideRenderer = CellDiffSideBySideRenderer = CellDiffSideBySideRenderer_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService),
        __param(7, themeService_1.IThemeService),
        __param(8, accessibility_1.IAccessibilityService)
    ], CellDiffSideBySideRenderer);
    class NotebookMouseController extends listWidget_1.MouseController {
        onViewPointer(e) {
            if ((0, listWidget_1.isMonacoEditor)(e.browserEvent.target)) {
                const focus = typeof e.index === 'undefined' ? [] : [e.index];
                this.list.setFocus(focus, e.browserEvent);
            }
            else {
                super.onViewPointer(e);
            }
        }
    }
    exports.NotebookMouseController = NotebookMouseController;
    let NotebookTextDiffList = class NotebookTextDiffList extends listService_1.WorkbenchList {
        get rowsContainer() {
            return this.view.containerDomNode;
        }
        constructor(listUser, container, delegate, renderers, contextKeyService, options, listService, configurationService, instantiationService) {
            super(listUser, container, delegate, renderers, options, contextKeyService, listService, configurationService, instantiationService);
        }
        createMouseController(options) {
            return new NotebookMouseController(this);
        }
        getCellViewScrollTop(element) {
            const index = this.indexOf(element);
            // if (index === undefined || index < 0 || index >= this.length) {
            // 	this._getViewIndexUpperBound(element);
            // 	throw new ListError(this.listUser, `Invalid index ${index}`);
            // }
            return this.view.elementTop(index);
        }
        getScrollHeight() {
            return this.view.scrollHeight;
        }
        triggerScrollFromMouseWheelEvent(browserEvent) {
            this.view.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this.view.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        clear() {
            super.splice(0, this.length);
        }
        updateElementHeight2(element, size) {
            const viewIndex = this.indexOf(element);
            const focused = this.getFocus();
            this.view.updateElementHeight(viewIndex, size, focused.length ? focused[0] : null);
        }
        style(styles) {
            const selectorSuffix = this.view.domId;
            if (!this.styleElement) {
                this.styleElement = DOM.createStyleSheet(this.view.domNode);
            }
            const suffix = selectorSuffix && `.${selectorSuffix}`;
            const content = [];
            if (styles.listBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows { background: ${styles.listBackground}; }`);
            }
            if (styles.listFocusBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color: ${styles.listFocusBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color: ${styles.listFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listFocusForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { color: ${styles.listFocusForeground}; }`);
            }
            if (styles.listActiveSelectionBackground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color: ${styles.listActiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color: ${styles.listActiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listActiveSelectionForeground) {
                content.push(`.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listActiveSelectionForeground}; }`);
            }
            if (styles.listFocusAndSelectionBackground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { background-color: ${styles.listFocusAndSelectionBackground}; }
			`);
            }
            if (styles.listFocusAndSelectionForeground) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected.focused { color: ${styles.listFocusAndSelectionForeground}; }
			`);
            }
            if (styles.listInactiveFocusBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { background-color:  ${styles.listInactiveFocusBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused:hover { background-color:  ${styles.listInactiveFocusBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionBackground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { background-color:  ${styles.listInactiveSelectionBackground}; }`);
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected:hover { background-color:  ${styles.listInactiveSelectionBackground}; }`); // overwrite :hover style in this case!
            }
            if (styles.listInactiveSelectionForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { color: ${styles.listInactiveSelectionForeground}; }`);
            }
            if (styles.listHoverBackground) {
                content.push(`.monaco-list${suffix}:not(.drop-target) > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { background-color:  ${styles.listHoverBackground}; }`);
            }
            if (styles.listHoverForeground) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover:not(.selected):not(.focused) { color:  ${styles.listHoverForeground}; }`);
            }
            if (styles.listSelectionOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.selected { outline: 1px dotted ${styles.listSelectionOutline}; outline-offset: -1px; }`);
            }
            if (styles.listFocusOutline) {
                content.push(`
				.monaco-drag-image,
				.monaco-list${suffix}:focus > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px solid ${styles.listFocusOutline}; outline-offset: -1px; }
			`);
            }
            if (styles.listInactiveFocusOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row.focused { outline: 1px dotted ${styles.listInactiveFocusOutline}; outline-offset: -1px; }`);
            }
            if (styles.listHoverOutline) {
                content.push(`.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows > .monaco-list-row:hover { outline: 1px dashed ${styles.listHoverOutline}; outline-offset: -1px; }`);
            }
            if (styles.listDropOverBackground) {
                content.push(`
				.monaco-list${suffix}.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-rows.drop-target,
				.monaco-list${suffix} > div.monaco-scrollable-element > .monaco-list-row.drop-target { background-color: ${styles.listDropOverBackground} !important; color: inherit !important; }
			`);
            }
            const newStyles = content.join('\n');
            if (newStyles !== this.styleElement.textContent) {
                this.styleElement.textContent = newStyles;
            }
        }
    };
    exports.NotebookTextDiffList = NotebookTextDiffList;
    exports.NotebookTextDiffList = NotebookTextDiffList = __decorate([
        __param(6, listService_1.IListService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, instantiation_1.IInstantiationService)
    ], NotebookTextDiffList);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tEaWZmTGlzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9kaWZmL25vdGVib29rRGlmZkxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThCekYsSUFBTSxnQ0FBZ0MsR0FBdEMsTUFBTSxnQ0FBZ0M7UUFHNUMsWUFDQyxZQUFvQixFQUNvQixvQkFBMkM7WUFBM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVuRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFpQixRQUFRLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsVUFBVSxHQUFHLHVCQUFZLENBQUMscUJBQXFCLENBQUMsYUFBYSxFQUFFLHVCQUFVLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUM1SCxDQUFDO1FBRUQsU0FBUyxDQUFDLE9BQWlDO1lBQzFDLE9BQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELGdCQUFnQixDQUFDLE9BQWlDO1lBQ2pELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFpQztZQUM5QyxRQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdEIsS0FBSyxRQUFRLENBQUM7Z0JBQ2QsS0FBSyxRQUFRO29CQUNaLE9BQU8sMEJBQTBCLENBQUMsV0FBVyxDQUFDO2dCQUMvQyxLQUFLLFVBQVUsQ0FBQztnQkFDaEIsS0FBSyxXQUFXO29CQUNmLE9BQU8sMEJBQTBCLENBQUMsV0FBVyxDQUFDO1lBQ2hELENBQUM7UUFFRixD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