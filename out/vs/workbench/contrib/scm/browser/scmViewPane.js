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
define(["require", "exports", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPane", "vs/base/browser/dom", "vs/workbench/contrib/scm/common/scm", "vs/workbench/browser/labels", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "./util", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/base/common/resourceTree", "vs/base/common/iterator", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/comparers", "vs/base/common/filters", "vs/workbench/common/views", "vs/nls", "vs/base/common/arrays", "vs/platform/storage/common/storage", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/editor/browser/widget/codeEditor/codeEditorWidget", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/editor/common/services/model", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/codeEditor/browser/dictation/editorDictation", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/instantiation/common/serviceCollection", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/links/browser/links", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/base/browser/fonts", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/contrib/scm/browser/scmRepositoryRenderer", "vs/platform/theme/common/theme", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/base/browser/ui/button/button", "vs/platform/notification/common/notification", "vs/workbench/contrib/scm/browser/scmViewService", "vs/editor/contrib/dnd/browser/dnd", "vs/editor/contrib/dropOrPasteInto/browser/dropIntoEditorController", "vs/editor/contrib/message/browser/messageController", "vs/platform/theme/browser/defaultStyles", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/common/services/resolverService", "vs/base/common/network", "vs/workbench/browser/dnd", "vs/platform/dnd/browser/dnd", "vs/editor/contrib/format/browser/formatActions", "vs/editor/common/config/editorOptions", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/core/editOperation", "vs/base/common/iconLabels", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/theme/common/colorRegistry", "vs/platform/actions/browser/toolbar", "vs/base/common/cancellation", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/base/common/numbers", "vs/platform/log/common/log", "vs/css!./media/scm"], function (require, exports, event_1, resources_1, lifecycle_1, viewPane_1, dom_1, scm_1, labels_1, countBadge_1, editorService_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, actionbar_1, themeService_1, util_1, listService_1, configuration_1, async_1, resourceTree_1, iterator_1, uri_1, files_1, comparers_1, filters_1, views_1, nls_1, arrays_1, storage_1, editor_1, theme_1, codeEditorWidget_1, simpleEditorOptions_1, model_1, editorExtensions_1, menuPreventer_1, selectionClipboard_1, editorDictation_1, contextmenu_1, platform, strings_1, suggestController_1, snippetController2_1, serviceCollection_1, hover_1, colorDetector_1, links_1, opener_1, telemetry_1, language_1, label_1, fonts_1, codicons_1, themables_1, scmRepositoryRenderer_1, theme_2, editorCommands_1, menuEntryActionViewItem_1, markdownRenderer_1, button_1, notification_1, scmViewService_1, dnd_1, dropIntoEditorController_1, messageController_1, defaultStyles_1, inlineCompletionsController_1, codeActionController_1, resolverService_1, network_1, dnd_2, dnd_3, formatActions_1, editorOptions_1, uriIdentity_1, editOperation_1, iconLabels_1, iconLabel_1, colorRegistry_1, toolbar_1, cancellation_1, dropdownWithPrimaryActionViewItem_1, numbers_1, log_1) {
    "use strict";
    var ActionButtonRenderer_1, InputRenderer_1, ResourceGroupRenderer_1, ResourceRenderer_1, HistoryItemGroupRenderer_1, HistoryItemRenderer_1, HistoryItemChangeRenderer_1, SeparatorRenderer_1, SCMInputWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMActionButton = exports.SCMViewPane = exports.SCMAccessibilityProvider = exports.SCMTreeKeyboardNavigationLabelProvider = exports.SCMTreeSorter = exports.ActionButtonRenderer = void 0;
    (0, colorRegistry_1.registerColor)('scm.historyItemAdditionsForeground', {
        dark: 'gitDecoration.addedResourceForeground',
        light: 'gitDecoration.addedResourceForeground',
        hcDark: 'gitDecoration.addedResourceForeground',
        hcLight: 'gitDecoration.addedResourceForeground'
    }, (0, nls_1.localize)('scm.historyItemAdditionsForeground', "History item additions foreground color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemDeletionsForeground', {
        dark: 'gitDecoration.deletedResourceForeground',
        light: 'gitDecoration.deletedResourceForeground',
        hcDark: 'gitDecoration.deletedResourceForeground',
        hcLight: 'gitDecoration.deletedResourceForeground'
    }, (0, nls_1.localize)('scm.historyItemDeletionsForeground', "History item deletions foreground color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemStatisticsBorder', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2),
        hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.foreground, 0.2)
    }, (0, nls_1.localize)('scm.historyItemStatisticsBorder', "History item statistics border color."));
    (0, colorRegistry_1.registerColor)('scm.historyItemSelectedStatisticsBorder', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2),
        hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.listActiveSelectionForeground, 0.2)
    }, (0, nls_1.localize)('scm.historyItemSelectedStatisticsBorder', "History item selected statistics border color."));
    let ActionButtonRenderer = class ActionButtonRenderer {
        static { ActionButtonRenderer_1 = this; }
        static { this.DEFAULT_HEIGHT = 30; }
        static { this.TEMPLATE_ID = 'actionButton'; }
        get templateId() { return ActionButtonRenderer_1.TEMPLATE_ID; }
        constructor(commandService, contextMenuService, notificationService) {
            this.commandService = commandService;
            this.contextMenuService = contextMenuService;
            this.notificationService = notificationService;
            this.actionButtons = new Map();
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Use default cursor & disable hover for list item
            container.parentElement.parentElement.classList.add('cursor-default', 'force-no-hover');
            const buttonContainer = (0, dom_1.append)(container, (0, dom_1.$)('.button-container'));
            const actionButton = new SCMActionButton(buttonContainer, this.contextMenuService, this.commandService, this.notificationService);
            return { actionButton, disposable: lifecycle_1.Disposable.None, templateDisposable: actionButton };
        }
        renderElement(node, index, templateData, height) {
            templateData.disposable.dispose();
            const disposables = new lifecycle_1.DisposableStore();
            const actionButton = node.element;
            templateData.actionButton.setButton(node.element.button);
            // Remember action button
            const renderedActionButtons = this.actionButtons.get(actionButton) ?? [];
            this.actionButtons.set(actionButton, [...renderedActionButtons, templateData.actionButton]);
            disposables.add({
                dispose: () => {
                    const renderedActionButtons = this.actionButtons.get(actionButton) ?? [];
                    const renderedWidgetIndex = renderedActionButtons.findIndex(renderedActionButton => renderedActionButton === templateData.actionButton);
                    if (renderedWidgetIndex < 0) {
                        throw new Error('Disposing unknown action button');
                    }
                    if (renderedActionButtons.length === 1) {
                        this.actionButtons.delete(actionButton);
                    }
                    else {
                        renderedActionButtons.splice(renderedWidgetIndex, 1);
                    }
                }
            });
            templateData.disposable = disposables;
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        focusActionButton(actionButton) {
            this.actionButtons.get(actionButton)?.forEach(renderedActionButton => renderedActionButton.focus());
        }
        disposeElement(node, index, template) {
            template.disposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.disposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    exports.ActionButtonRenderer = ActionButtonRenderer;
    exports.ActionButtonRenderer = ActionButtonRenderer = ActionButtonRenderer_1 = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, notification_1.INotificationService)
    ], ActionButtonRenderer);
    class SCMTreeDragAndDrop {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
        }
        getDragURI(element) {
            if ((0, util_1.isSCMResource)(element)) {
                return element.sourceUri.toString();
            }
            return null;
        }
        onDragStart(data, originalEvent) {
            const items = SCMTreeDragAndDrop.getResourcesFromDragAndDropData(data);
            if (originalEvent.dataTransfer && items?.length) {
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, items, originalEvent));
                const fileResources = items.filter(s => s.scheme === network_1.Schemas.file).map(r => r.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_3.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        getDragLabel(elements, originalEvent) {
            if (elements.length === 1) {
                const element = elements[0];
                if ((0, util_1.isSCMResource)(element)) {
                    return (0, resources_1.basename)(element.sourceUri);
                }
            }
            return String(elements.length);
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            return true;
        }
        drop(data, targetElement, targetIndex, targetSector, originalEvent) { }
        static getResourcesFromDragAndDropData(data) {
            const uris = [];
            for (const element of [...data.context ?? [], ...data.elements]) {
                if ((0, util_1.isSCMResource)(element)) {
                    uris.push(element.sourceUri);
                }
            }
            return uris;
        }
        dispose() { }
    }
    let InputRenderer = class InputRenderer {
        static { InputRenderer_1 = this; }
        static { this.DEFAULT_HEIGHT = 26; }
        static { this.TEMPLATE_ID = 'input'; }
        get templateId() { return InputRenderer_1.TEMPLATE_ID; }
        constructor(outerLayout, overflowWidgetsDomNode, updateHeight, instantiationService) {
            this.outerLayout = outerLayout;
            this.overflowWidgetsDomNode = overflowWidgetsDomNode;
            this.updateHeight = updateHeight;
            this.instantiationService = instantiationService;
            this.inputWidgets = new Map();
            this.contentHeights = new WeakMap();
            this.editorSelections = new WeakMap();
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Disable hover for list item
            container.parentElement.parentElement.classList.add('force-no-hover');
            const templateDisposable = new lifecycle_1.DisposableStore();
            const inputElement = (0, dom_1.append)(container, (0, dom_1.$)('.scm-input'));
            const inputWidget = this.instantiationService.createInstance(SCMInputWidget, inputElement, this.overflowWidgetsDomNode);
            templateDisposable.add(inputWidget);
            return { inputWidget, inputWidgetHeight: InputRenderer_1.DEFAULT_HEIGHT, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposable };
        }
        renderElement(node, index, templateData) {
            const input = node.element;
            templateData.inputWidget.setInput(input);
            // Remember widget
            const renderedWidgets = this.inputWidgets.get(input) ?? [];
            this.inputWidgets.set(input, [...renderedWidgets, templateData.inputWidget]);
            templateData.elementDisposables.add({
                dispose: () => {
                    const renderedWidgets = this.inputWidgets.get(input) ?? [];
                    const renderedWidgetIndex = renderedWidgets.findIndex(renderedWidget => renderedWidget === templateData.inputWidget);
                    if (renderedWidgetIndex < 0) {
                        throw new Error('Disposing unknown input widget');
                    }
                    if (renderedWidgets.length === 1) {
                        this.inputWidgets.delete(input);
                    }
                    else {
                        renderedWidgets.splice(renderedWidgetIndex, 1);
                    }
                }
            });
            // Widget cursor selections
            const selections = this.editorSelections.get(input);
            if (selections) {
                templateData.inputWidget.selections = selections;
            }
            templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                const selections = templateData.inputWidget.selections;
                if (selections) {
                    this.editorSelections.set(input, selections);
                }
            }));
            // Reset widget height so it's recalculated
            templateData.inputWidgetHeight = InputRenderer_1.DEFAULT_HEIGHT;
            // Rerender the element whenever the editor content height changes
            const onDidChangeContentHeight = () => {
                const contentHeight = templateData.inputWidget.getContentHeight();
                this.contentHeights.set(input, contentHeight);
                if (templateData.inputWidgetHeight !== contentHeight) {
                    this.updateHeight(input, contentHeight + 10);
                    templateData.inputWidgetHeight = contentHeight;
                    templateData.inputWidget.layout();
                }
            };
            const startListeningContentHeightChange = () => {
                templateData.elementDisposables.add(templateData.inputWidget.onDidChangeContentHeight(onDidChangeContentHeight));
                onDidChangeContentHeight();
            };
            // Setup height change listener on next tick
            (0, async_1.disposableTimeout)(startListeningContentHeightChange, 0, templateData.elementDisposables);
            // Layout the editor whenever the outer layout happens
            const layoutEditor = () => templateData.inputWidget.layout();
            templateData.elementDisposables.add(this.outerLayout.onDidChange(layoutEditor));
            layoutEditor();
        }
        renderCompressedElements() {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        getHeight(input) {
            return (this.contentHeights.get(input) ?? InputRenderer_1.DEFAULT_HEIGHT) + 10;
        }
        getRenderedInputWidget(input) {
            return this.inputWidgets.get(input);
        }
        getFocusedInput() {
            for (const [input, inputWidgets] of this.inputWidgets) {
                for (const inputWidget of inputWidgets) {
                    if (inputWidget.hasFocus()) {
                        return input;
                    }
                }
            }
            return undefined;
        }
        clearValidation() {
            for (const [, inputWidgets] of this.inputWidgets) {
                for (const inputWidget of inputWidgets) {
                    inputWidget.clearValidation();
                }
            }
        }
    };
    InputRenderer = InputRenderer_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], InputRenderer);
    let ResourceGroupRenderer = class ResourceGroupRenderer {
        static { ResourceGroupRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'resource group'; }
        get templateId() { return ResourceGroupRenderer_1.TEMPLATE_ID; }
        constructor(actionViewItemProvider, scmViewService) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.resource-group'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const actionsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = (0, dom_1.append)(element, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            const disposables = (0, lifecycle_1.combinedDisposable)(actionBar);
            return { name, count, actionBar, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, template) {
            const group = node.element;
            template.name.textContent = group.label;
            template.actionBar.clear();
            template.actionBar.context = group;
            template.count.setCount(group.resources.length);
            const menus = this.scmViewService.menus.getRepositoryMenus(group.provider);
            template.elementDisposables.add((0, util_1.connectPrimaryMenuToInlineActionBar)(menus.getResourceGroupMenu(group), template.actionBar));
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.clear();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    };
    ResourceGroupRenderer = ResourceGroupRenderer_1 = __decorate([
        __param(1, scm_1.ISCMViewService)
    ], ResourceGroupRenderer);
    class RepositoryPaneActionRunner extends actions_2.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedResources();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const args = (0, arrays_1.flatten)(actualContext.map(e => resourceTree_1.ResourceTree.isResourceNode(e) ? resourceTree_1.ResourceTree.collect(e) : [e]));
            await action.run(...args);
        }
    }
    let ResourceRenderer = class ResourceRenderer {
        static { ResourceRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'resource'; }
        get templateId() { return ResourceRenderer_1.TEMPLATE_ID; }
        constructor(viewMode, labels, actionViewItemProvider, actionRunner, labelService, scmViewService, themeService) {
            this.viewMode = viewMode;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.actionRunner = actionRunner;
            this.labelService = labelService;
            this.scmViewService = scmViewService;
            this.themeService = themeService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.renderedResources = new Map();
            themeService.onDidColorThemeChange(this.onDidColorThemeChange, this, this.disposables);
        }
        renderTemplate(container) {
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.resource'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const fileLabel = this.labels.create(name, { supportDescriptionHighlights: true, supportHighlights: true });
            const actionsContainer = (0, dom_1.append)(fileLabel.element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider,
                actionRunner: this.actionRunner
            });
            const decorationIcon = (0, dom_1.append)(element, (0, dom_1.$)('.decoration-icon'));
            const actionBarMenuListener = new lifecycle_1.MutableDisposable();
            const disposables = (0, lifecycle_1.combinedDisposable)(actionBar, fileLabel, actionBarMenuListener);
            return { element, name, fileLabel, decorationIcon, actionBar, actionBarMenu: undefined, actionBarMenuListener, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, template) {
            const resourceOrFolder = node.element;
            const iconResource = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.element : resourceOrFolder;
            const uri = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.uri : resourceOrFolder.sourceUri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const tooltip = !resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) && resourceOrFolder.decorations.tooltip || '';
            const hidePath = this.viewMode() === "tree" /* ViewMode.Tree */;
            let matches;
            let descriptionMatches;
            let strikethrough;
            if (resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder)) {
                if (resourceOrFolder.element) {
                    const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.element.resourceGroup.provider);
                    this._renderActionBar(template, resourceOrFolder, menus.getResourceMenu(resourceOrFolder.element));
                    template.element.classList.toggle('faded', resourceOrFolder.element.decorations.faded);
                    strikethrough = resourceOrFolder.element.decorations.strikeThrough;
                }
                else {
                    const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.context.provider);
                    this._renderActionBar(template, resourceOrFolder, menus.getResourceFolderMenu(resourceOrFolder.context));
                    matches = (0, filters_1.createMatches)(node.filterData);
                    template.element.classList.remove('faded');
                }
            }
            else {
                const menus = this.scmViewService.menus.getRepositoryMenus(resourceOrFolder.resourceGroup.provider);
                this._renderActionBar(template, resourceOrFolder, menus.getResourceMenu(resourceOrFolder));
                [matches, descriptionMatches] = this._processFilterData(uri, node.filterData);
                template.element.classList.toggle('faded', resourceOrFolder.decorations.faded);
                strikethrough = resourceOrFolder.decorations.strikeThrough;
            }
            const renderedData = {
                tooltip, uri, fileLabelOptions: { hidePath, fileKind, matches, descriptionMatches, strikethrough }, iconResource
            };
            this.renderIcon(template, renderedData);
            this.renderedResources.set(template, renderedData);
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => this.renderedResources.delete(template)));
            template.element.setAttribute('data-tooltip', tooltip);
        }
        disposeElement(resource, index, template) {
            template.elementDisposables.clear();
        }
        renderCompressedElements(node, index, template, height) {
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name);
            const fileKind = files_1.FileKind.FOLDER;
            const matches = (0, filters_1.createMatches)(node.filterData);
            template.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind,
                matches,
                separator: this.labelService.getSeparator(folder.uri.scheme)
            });
            const menus = this.scmViewService.menus.getRepositoryMenus(folder.context.provider);
            this._renderActionBar(template, folder, menus.getResourceFolderMenu(folder.context));
            template.name.classList.remove('strike-through');
            template.element.classList.remove('faded');
            template.decorationIcon.style.display = 'none';
            template.decorationIcon.style.backgroundImage = '';
            template.element.setAttribute('data-tooltip', '');
        }
        disposeCompressedElements(node, index, template, height) {
            template.elementDisposables.clear();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
        _renderActionBar(template, resourceOrFolder, menu) {
            if (!template.actionBarMenu || template.actionBarMenu !== menu) {
                template.actionBar.clear();
                template.actionBarMenu = menu;
                template.actionBarMenuListener.value = (0, util_1.connectPrimaryMenuToInlineActionBar)(menu, template.actionBar);
            }
            template.actionBar.context = resourceOrFolder;
        }
        _processFilterData(uri, filterData) {
            if (!filterData) {
                return [undefined, undefined];
            }
            if (!filterData.label) {
                const matches = (0, filters_1.createMatches)(filterData);
                return [matches, undefined];
            }
            const fileName = (0, resources_1.basename)(uri);
            const label = filterData.label;
            const pathLength = label.length - fileName.length;
            const matches = (0, filters_1.createMatches)(filterData.score);
            // FileName match
            if (label === fileName) {
                return [matches, undefined];
            }
            // FilePath match
            const labelMatches = [];
            const descriptionMatches = [];
            for (const match of matches) {
                if (match.start > pathLength) {
                    // Label match
                    labelMatches.push({
                        start: match.start - pathLength,
                        end: match.end - pathLength
                    });
                }
                else if (match.end < pathLength) {
                    // Description match
                    descriptionMatches.push(match);
                }
                else {
                    // Spanning match
                    labelMatches.push({
                        start: 0,
                        end: match.end - pathLength
                    });
                    descriptionMatches.push({
                        start: match.start,
                        end: pathLength
                    });
                }
            }
            return [labelMatches, descriptionMatches];
        }
        onDidColorThemeChange() {
            for (const [template, data] of this.renderedResources) {
                this.renderIcon(template, data);
            }
        }
        renderIcon(template, data) {
            const theme = this.themeService.getColorTheme();
            const icon = theme.type === theme_2.ColorScheme.LIGHT ? data.iconResource?.decorations.icon : data.iconResource?.decorations.iconDark;
            template.fileLabel.setFile(data.uri, {
                ...data.fileLabelOptions,
                fileDecorations: { colors: false, badges: !icon },
            });
            if (icon) {
                if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                    template.decorationIcon.className = `decoration-icon ${themables_1.ThemeIcon.asClassName(icon)}`;
                    if (icon.color) {
                        template.decorationIcon.style.color = theme.getColor(icon.color.id)?.toString() ?? '';
                    }
                    template.decorationIcon.style.display = '';
                    template.decorationIcon.style.backgroundImage = '';
                }
                else {
                    template.decorationIcon.className = 'decoration-icon';
                    template.decorationIcon.style.color = '';
                    template.decorationIcon.style.display = '';
                    template.decorationIcon.style.backgroundImage = (0, dom_1.asCSSUrl)(icon);
                }
                template.decorationIcon.title = data.tooltip;
            }
            else {
                template.decorationIcon.className = 'decoration-icon';
                template.decorationIcon.style.color = '';
                template.decorationIcon.style.display = 'none';
                template.decorationIcon.style.backgroundImage = '';
                template.decorationIcon.title = '';
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ResourceRenderer = ResourceRenderer_1 = __decorate([
        __param(4, label_1.ILabelService),
        __param(5, scm_1.ISCMViewService),
        __param(6, themeService_1.IThemeService)
    ], ResourceRenderer);
    class HistoryItemGroupActionRunner extends actions_2.ActionRunner {
        runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            return action.run(context.repository.provider, context.id);
        }
    }
    let HistoryItemGroupRenderer = class HistoryItemGroupRenderer {
        static { HistoryItemGroupRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'history-item-group'; }
        get templateId() { return HistoryItemGroupRenderer_1.TEMPLATE_ID; }
        constructor(actionRunner, contextKeyService, contextMenuService, keybindingService, menuService, scmViewService, telemetryService) {
            this.actionRunner = actionRunner;
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.scmViewService = scmViewService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.history-item-group'));
            const label = new iconLabel_1.IconLabel(element, { supportIcons: true });
            const iconContainer = (0, dom_1.prepend)(label.element, (0, dom_1.$)('.icon-container'));
            const templateDisposables = new lifecycle_1.DisposableStore();
            const toolBar = new toolbar_1.WorkbenchToolBar((0, dom_1.append)(element, (0, dom_1.$)('.actions')), { actionRunner: this.actionRunner, menuOptions: { shouldForwardArgs: true } }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.telemetryService);
            templateDisposables.add(toolBar);
            const countContainer = (0, dom_1.append)(element, (0, dom_1.$)('.count'));
            const count = new countBadge_1.CountBadge(countContainer, {}, defaultStyles_1.defaultCountBadgeStyles);
            return { iconContainer, label, toolBar, count, elementDisposables: new lifecycle_1.DisposableStore(), templateDisposables };
        }
        renderElement(node, index, templateData, height) {
            const historyItemGroup = node.element;
            templateData.iconContainer.className = 'icon-container';
            if (historyItemGroup.icon && themables_1.ThemeIcon.isThemeIcon(historyItemGroup.icon)) {
                templateData.iconContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(historyItemGroup.icon));
            }
            templateData.label.setLabel(historyItemGroup.label, historyItemGroup.description, { title: historyItemGroup.ariaLabel });
            templateData.count.setCount(historyItemGroup.count ?? 0);
            const repositoryMenus = this.scmViewService.menus.getRepositoryMenus(historyItemGroup.repository.provider);
            const historyProviderMenu = repositoryMenus.historyProviderMenu;
            if (historyProviderMenu) {
                const menu = historyProviderMenu.getHistoryItemGroupMenu(historyItemGroup);
                const resetMenuId = historyItemGroup.direction === 'incoming' ? actions_1.MenuId.SCMIncomingChanges : actions_1.MenuId.SCMOutgoingChanges;
                templateData.elementDisposables.add((0, util_1.connectPrimaryMenu)(menu, (primary, secondary) => {
                    templateData.toolBar.setActions(primary, secondary, [resetMenuId]);
                }));
                templateData.toolBar.context = historyItemGroup;
            }
            else {
                templateData.toolBar.setActions([], []);
                templateData.toolBar.context = undefined;
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(node, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.elementDisposables.dispose();
            templateData.templateDisposables.dispose();
        }
    };
    HistoryItemGroupRenderer = HistoryItemGroupRenderer_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_1.IMenuService),
        __param(5, scm_1.ISCMViewService),
        __param(6, telemetry_1.ITelemetryService)
    ], HistoryItemGroupRenderer);
    class HistoryItemActionRunner extends actions_2.ActionRunner {
        async runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const args = [];
            args.push(context.historyItemGroup.repository.provider);
            args.push({
                id: context.id,
                parentIds: context.parentIds,
                label: context.label,
                description: context.description,
                icon: context.icon,
                timestamp: context.timestamp,
                statistics: context.statistics,
            });
            await action.run(...args);
        }
    }
    let HistoryItemRenderer = class HistoryItemRenderer {
        static { HistoryItemRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'history-item'; }
        get templateId() { return HistoryItemRenderer_1.TEMPLATE_ID; }
        constructor(actionRunner, actionViewItemProvider, scmViewService) {
            this.actionRunner = actionRunner;
            this.actionViewItemProvider = actionViewItemProvider;
            this.scmViewService = scmViewService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-twistie');
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.history-item'));
            const iconLabel = new iconLabel_1.IconLabel(element, { supportIcons: true });
            const iconContainer = (0, dom_1.prepend)(iconLabel.element, (0, dom_1.$)('.icon-container'));
            const disposables = new lifecycle_1.DisposableStore();
            const actionsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionRunner: this.actionRunner, actionViewItemProvider: this.actionViewItemProvider });
            disposables.add(actionBar);
            const statsContainer = (0, dom_1.append)(element, (0, dom_1.$)('.stats-container'));
            const filesLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.files-label'));
            const insertionsLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.insertions-label'));
            const deletionsLabel = (0, dom_1.append)(statsContainer, (0, dom_1.$)('.deletions-label'));
            return { iconContainer, label: iconLabel, actionBar, statsContainer, filesLabel, insertionsLabel, deletionsLabel, elementDisposables: new lifecycle_1.DisposableStore(), disposables };
        }
        renderElement(node, index, templateData, height) {
            const historyItem = node.element;
            templateData.iconContainer.className = 'icon-container';
            if (historyItem.icon && themables_1.ThemeIcon.isThemeIcon(historyItem.icon)) {
                templateData.iconContainer.classList.add(...themables_1.ThemeIcon.asClassNameArray(historyItem.icon));
            }
            templateData.label.setLabel(historyItem.label, historyItem.description);
            templateData.actionBar.clear();
            templateData.actionBar.context = historyItem;
            const menus = this.scmViewService.menus.getRepositoryMenus(historyItem.historyItemGroup.repository.provider);
            if (menus.historyProviderMenu) {
                const historyItemMenu = menus.historyProviderMenu.getHistoryItemMenu(historyItem);
                templateData.elementDisposables.add((0, util_1.connectPrimaryMenuToInlineActionBar)(historyItemMenu, templateData.actionBar));
            }
            this.renderStatistics(node, index, templateData, height);
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        renderStatistics(node, index, templateData, height) {
            const historyItem = node.element;
            if (historyItem.statistics) {
                const statsAriaLabel = [
                    historyItem.statistics.files === 1 ?
                        (0, nls_1.localize)('fileChanged', "{0} file changed", historyItem.statistics.files) :
                        (0, nls_1.localize)('filesChanged', "{0} files changed", historyItem.statistics.files),
                    historyItem.statistics.insertions === 1 ? (0, nls_1.localize)('insertion', "{0} insertion{1}", historyItem.statistics.insertions, '(+)') :
                        historyItem.statistics.insertions > 1 ? (0, nls_1.localize)('insertions', "{0} insertions{1}", historyItem.statistics.insertions, '(+)') : '',
                    historyItem.statistics.deletions === 1 ? (0, nls_1.localize)('deletion', "{0} deletion{1}", historyItem.statistics.deletions, '(-)') :
                        historyItem.statistics.deletions > 1 ? (0, nls_1.localize)('deletions', "{0} deletions{1}", historyItem.statistics.deletions, '(-)') : ''
                ];
                const statsTitle = statsAriaLabel
                    .filter(l => l !== '').join(', ');
                templateData.statsContainer.title = statsTitle;
                templateData.statsContainer.setAttribute('aria-label', statsTitle);
                templateData.filesLabel.textContent = historyItem.statistics.files.toString();
                templateData.insertionsLabel.textContent = historyItem.statistics.insertions > 0 ? `+${historyItem.statistics.insertions}` : '';
                templateData.insertionsLabel.classList.toggle('hidden', historyItem.statistics.insertions === 0);
                templateData.deletionsLabel.textContent = historyItem.statistics.deletions > 0 ? `-${historyItem.statistics.deletions}` : '';
                templateData.deletionsLabel.classList.toggle('hidden', historyItem.statistics.deletions === 0);
            }
            templateData.statsContainer.classList.toggle('hidden', historyItem.statistics === undefined);
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    HistoryItemRenderer = HistoryItemRenderer_1 = __decorate([
        __param(2, scm_1.ISCMViewService)
    ], HistoryItemRenderer);
    let HistoryItemChangeRenderer = class HistoryItemChangeRenderer {
        static { HistoryItemChangeRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'historyItemChange'; }
        get templateId() { return HistoryItemChangeRenderer_1.TEMPLATE_ID; }
        constructor(viewMode, labels, labelService) {
            this.viewMode = viewMode;
            this.labels = labels;
            this.labelService = labelService;
        }
        renderTemplate(container) {
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.change'));
            const name = (0, dom_1.append)(element, (0, dom_1.$)('.name'));
            const fileLabel = this.labels.create(name, { supportDescriptionHighlights: true, supportHighlights: true });
            const decorationIcon = (0, dom_1.append)(element, (0, dom_1.$)('.decoration-icon'));
            return { element, name, fileLabel, decorationIcon, disposables: new lifecycle_1.DisposableStore() };
        }
        renderElement(node, index, templateData, height) {
            const historyItemChangeOrFolder = node.element;
            const uri = resourceTree_1.ResourceTree.isResourceNode(historyItemChangeOrFolder) ? historyItemChangeOrFolder.element?.uri ?? historyItemChangeOrFolder.uri : historyItemChangeOrFolder.uri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(historyItemChangeOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const hidePath = this.viewMode() === "tree" /* ViewMode.Tree */;
            templateData.fileLabel.setFile(uri, { fileDecorations: { colors: false, badges: true }, fileKind, hidePath, });
        }
        renderCompressedElements(node, index, templateData, height) {
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name);
            templateData.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind: files_1.FileKind.FOLDER,
                separator: this.labelService.getSeparator(folder.uri.scheme)
            });
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    HistoryItemChangeRenderer = HistoryItemChangeRenderer_1 = __decorate([
        __param(2, label_1.ILabelService)
    ], HistoryItemChangeRenderer);
    let SeparatorRenderer = class SeparatorRenderer {
        static { SeparatorRenderer_1 = this; }
        static { this.TEMPLATE_ID = 'separator'; }
        get templateId() { return SeparatorRenderer_1.TEMPLATE_ID; }
        constructor(contextKeyService, contextMenuService, keybindingService, menuService, telemetryService) {
            this.contextKeyService = contextKeyService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.telemetryService = telemetryService;
        }
        renderTemplate(container) {
            // hack
            container.parentElement.parentElement.querySelector('.monaco-tl-twistie').classList.add('force-no-twistie');
            // Use default cursor & disable hover for list item
            container.parentElement.parentElement.classList.add('cursor-default', 'force-no-hover');
            const disposables = new lifecycle_1.DisposableStore();
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.separator-container'));
            const label = new iconLabel_1.IconLabel(element, { supportIcons: true, });
            (0, dom_1.append)(element, (0, dom_1.$)('.separator'));
            disposables.add(label);
            const toolBar = new toolbar_1.MenuWorkbenchToolBar((0, dom_1.append)(element, (0, dom_1.$)('.actions')), actions_1.MenuId.SCMChangesSeparator, { moreIcon: codicons_1.Codicon.gear }, this.menuService, this.contextKeyService, this.contextMenuService, this.keybindingService, this.telemetryService);
            disposables.add(toolBar);
            return { label, disposables };
        }
        renderElement(element, index, templateData, height) {
            templateData.label.setLabel(element.element.label, undefined, { title: element.element.ariaLabel });
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
        }
    };
    SeparatorRenderer = SeparatorRenderer_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, actions_1.IMenuService),
        __param(4, telemetry_1.ITelemetryService)
    ], SeparatorRenderer);
    class ListDelegate {
        constructor(inputRenderer) {
            this.inputRenderer = inputRenderer;
        }
        getHeight(element) {
            if ((0, util_1.isSCMInput)(element)) {
                return this.inputRenderer.getHeight(element);
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return ActionButtonRenderer.DEFAULT_HEIGHT + 10;
            }
            else {
                return 22;
            }
        }
        getTemplateId(element) {
            if ((0, util_1.isSCMRepository)(element)) {
                return scmRepositoryRenderer_1.RepositoryRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMInput)(element)) {
                return InputRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return ActionButtonRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return ResourceGroupRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMResource)(element) || (0, util_1.isSCMResourceNode)(element)) {
                return ResourceRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return HistoryItemGroupRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                return HistoryItemRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element) || (0, util_1.isSCMHistoryItemChangeNode)(element)) {
                return HistoryItemChangeRenderer.TEMPLATE_ID;
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return SeparatorRenderer.TEMPLATE_ID;
            }
            else {
                throw new Error('Unknown element');
            }
        }
    }
    class SCMTreeCompressionDelegate {
        isIncompressible(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.childrenCount === 0 || !element.parent || !element.parent.parent;
            }
            return true;
        }
    }
    class SCMTreeFilter {
        filter(element) {
            if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.resources.length > 0 || !element.hideWhenEmpty;
            }
            else {
                return true;
            }
        }
    }
    class SCMTreeSorter {
        constructor(viewMode, viewSortKey) {
            this.viewMode = viewMode;
            this.viewSortKey = viewSortKey;
        }
        compare(one, other) {
            if ((0, util_1.isSCMRepository)(one)) {
                if (!(0, util_1.isSCMRepository)(other)) {
                    throw new Error('Invalid comparison');
                }
                return 0;
            }
            if ((0, util_1.isSCMInput)(one)) {
                return -1;
            }
            else if ((0, util_1.isSCMInput)(other)) {
                return 1;
            }
            if ((0, util_1.isSCMActionButton)(one)) {
                return -1;
            }
            else if ((0, util_1.isSCMActionButton)(other)) {
                return 1;
            }
            if ((0, util_1.isSCMResourceGroup)(one)) {
                return (0, util_1.isSCMResourceGroup)(other) ? 0 : -1;
            }
            if ((0, util_1.isSCMViewSeparator)(one)) {
                return (0, util_1.isSCMResourceGroup)(other) ? 1 : -1;
            }
            if ((0, util_1.isSCMHistoryItemGroupTreeElement)(one)) {
                return (0, util_1.isSCMHistoryItemGroupTreeElement)(other) ? 0 : 1;
            }
            if ((0, util_1.isSCMHistoryItemTreeElement)(one)) {
                if (!(0, util_1.isSCMHistoryItemTreeElement)(other)) {
                    throw new Error('Invalid comparison');
                }
                return 0;
            }
            if ((0, util_1.isSCMHistoryItemChangeTreeElement)(one) || (0, util_1.isSCMHistoryItemChangeNode)(one)) {
                // List
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    if (!(0, util_1.isSCMHistoryItemChangeTreeElement)(other)) {
                        throw new Error('Invalid comparison');
                    }
                    return (0, comparers_1.comparePaths)(one.uri.fsPath, other.uri.fsPath);
                }
                // Tree
                if (!(0, util_1.isSCMHistoryItemChangeTreeElement)(other) && !(0, util_1.isSCMHistoryItemChangeNode)(other)) {
                    throw new Error('Invalid comparison');
                }
                const oneName = (0, util_1.isSCMHistoryItemChangeNode)(one) ? one.name : (0, resources_1.basename)(one.uri);
                const otherName = (0, util_1.isSCMHistoryItemChangeNode)(other) ? other.name : (0, resources_1.basename)(other.uri);
                return (0, comparers_1.compareFileNames)(oneName, otherName);
            }
            // Resource (List)
            if (this.viewMode() === "list" /* ViewMode.List */) {
                // FileName
                if (this.viewSortKey() === "name" /* ViewSortKey.Name */) {
                    const oneName = (0, resources_1.basename)(one.sourceUri);
                    const otherName = (0, resources_1.basename)(other.sourceUri);
                    return (0, comparers_1.compareFileNames)(oneName, otherName);
                }
                // Status
                if (this.viewSortKey() === "status" /* ViewSortKey.Status */) {
                    const oneTooltip = one.decorations.tooltip ?? '';
                    const otherTooltip = other.decorations.tooltip ?? '';
                    if (oneTooltip !== otherTooltip) {
                        return (0, strings_1.compare)(oneTooltip, otherTooltip);
                    }
                }
                // Path (default)
                const onePath = one.sourceUri.fsPath;
                const otherPath = other.sourceUri.fsPath;
                return (0, comparers_1.comparePaths)(onePath, otherPath);
            }
            // Resource (Tree)
            const oneIsDirectory = resourceTree_1.ResourceTree.isResourceNode(one);
            const otherIsDirectory = resourceTree_1.ResourceTree.isResourceNode(other);
            if (oneIsDirectory !== otherIsDirectory) {
                return oneIsDirectory ? -1 : 1;
            }
            const oneName = resourceTree_1.ResourceTree.isResourceNode(one) ? one.name : (0, resources_1.basename)(one.sourceUri);
            const otherName = resourceTree_1.ResourceTree.isResourceNode(other) ? other.name : (0, resources_1.basename)(other.sourceUri);
            return (0, comparers_1.compareFileNames)(oneName, otherName);
        }
    }
    exports.SCMTreeSorter = SCMTreeSorter;
    let SCMTreeKeyboardNavigationLabelProvider = class SCMTreeKeyboardNavigationLabelProvider {
        constructor(viewMode, labelService) {
            this.viewMode = viewMode;
            this.labelService = labelService;
        }
        getKeyboardNavigationLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.name;
            }
            else if ((0, util_1.isSCMRepository)(element) || (0, util_1.isSCMInput)(element) || (0, util_1.isSCMActionButton)(element)) {
                return undefined;
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return element.label;
            }
            else {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    // In List mode match using the file name and the path.
                    // Since we want to match both on the file name and the
                    // full path we return an array of labels. A match in the
                    // file name takes precedence over a match in the path.
                    const uri = (0, util_1.isSCMResource)(element) ? element.sourceUri : element.uri;
                    return [(0, resources_1.basename)(uri), this.labelService.getUriLabel(uri, { relative: true })];
                }
                else {
                    // In Tree mode only match using the file name
                    return (0, resources_1.basename)((0, util_1.isSCMResource)(element) ? element.sourceUri : element.uri);
                }
            }
        }
        getCompressedNodeKeyboardNavigationLabel(elements) {
            const folders = elements;
            return folders.map(e => e.name).join('/');
        }
    };
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider;
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider = __decorate([
        __param(1, label_1.ILabelService)
    ], SCMTreeKeyboardNavigationLabelProvider);
    function getSCMResourceId(element) {
        if ((0, util_1.isSCMRepository)(element)) {
            const provider = element.provider;
            return `repo:${provider.id}`;
        }
        else if ((0, util_1.isSCMInput)(element)) {
            const provider = element.repository.provider;
            return `input:${provider.id}`;
        }
        else if ((0, util_1.isSCMActionButton)(element)) {
            const provider = element.repository.provider;
            return `actionButton:${provider.id}`;
        }
        else if ((0, util_1.isSCMResourceGroup)(element)) {
            const provider = element.provider;
            return `resourceGroup:${provider.id}/${element.id}`;
        }
        else if ((0, util_1.isSCMResource)(element)) {
            const group = element.resourceGroup;
            const provider = group.provider;
            return `resource:${provider.id}/${group.id}/${element.sourceUri.toString()}`;
        }
        else if ((0, util_1.isSCMResourceNode)(element)) {
            const group = element.context;
            return `folder:${group.provider.id}/${group.id}/$FOLDER/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
            const provider = element.repository.provider;
            return `historyItemGroup:${provider.id}/${element.id}`;
        }
        else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
            const historyItemGroup = element.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `historyItem:${provider.id}/${historyItemGroup.id}/${element.id}/${element.parentIds.join(',')}`;
        }
        else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element)) {
            const historyItem = element.historyItem;
            const historyItemGroup = historyItem.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `historyItemChange:${provider.id}/${historyItemGroup.id}/${historyItem.id}/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMHistoryItemChangeNode)(element)) {
            const historyItem = element.context;
            const historyItemGroup = historyItem.historyItemGroup;
            const provider = historyItemGroup.repository.provider;
            return `folder:${provider.id}/${historyItemGroup.id}/${historyItem.id}/$FOLDER/${element.uri.toString()}`;
        }
        else if ((0, util_1.isSCMViewSeparator)(element)) {
            const provider = element.repository.provider;
            return `separator:${provider.id}`;
        }
        else {
            throw new Error('Invalid tree element');
        }
    }
    class SCMResourceIdentityProvider {
        getId(element) {
            return getSCMResourceId(element);
        }
    }
    let SCMAccessibilityProvider = class SCMAccessibilityProvider {
        constructor(labelService) {
            this.labelService = labelService;
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('scm', "Source Control Management");
        }
        getAriaLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return this.labelService.getUriLabel(element.uri, { relative: true, noPrefix: true }) || element.name;
            }
            else if ((0, util_1.isSCMRepository)(element)) {
                return `${element.provider.name} ${element.provider.label}`;
            }
            else if ((0, util_1.isSCMInput)(element)) {
                return (0, nls_1.localize)('input', "Source Control Input");
            }
            else if ((0, util_1.isSCMActionButton)(element)) {
                return element.button?.command.title ?? '';
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                return element.label;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                return element.ariaLabel ?? `${element.label.trim()}${element.description ? `, ${element.description}` : ''}`;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                return `${(0, iconLabels_1.stripIcons)(element.label).trim()}${element.description ? `, ${element.description}` : ''}`;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(element)) {
                const result = [(0, resources_1.basename)(element.uri)];
                const path = this.labelService.getUriLabel((0, resources_1.dirname)(element.uri), { relative: true, noPrefix: true });
                if (path) {
                    result.push(path);
                }
                return result.join(', ');
            }
            else if ((0, util_1.isSCMViewSeparator)(element)) {
                return element.ariaLabel ?? element.label;
            }
            else {
                const result = [];
                result.push((0, resources_1.basename)(element.sourceUri));
                if (element.decorations.tooltip) {
                    result.push(element.decorations.tooltip);
                }
                const path = this.labelService.getUriLabel((0, resources_1.dirname)(element.sourceUri), { relative: true, noPrefix: true });
                if (path) {
                    result.push(path);
                }
                return result.join(', ');
            }
        }
    };
    exports.SCMAccessibilityProvider = SCMAccessibilityProvider;
    exports.SCMAccessibilityProvider = SCMAccessibilityProvider = __decorate([
        __param(0, label_1.ILabelService)
    ], SCMAccessibilityProvider);
    var ViewMode;
    (function (ViewMode) {
        ViewMode["List"] = "list";
        ViewMode["Tree"] = "tree";
    })(ViewMode || (ViewMode = {}));
    var ViewSortKey;
    (function (ViewSortKey) {
        ViewSortKey["Path"] = "path";
        ViewSortKey["Name"] = "name";
        ViewSortKey["Status"] = "status";
    })(ViewSortKey || (ViewSortKey = {}));
    const Menus = {
        ViewSort: new actions_1.MenuId('SCMViewSort'),
        Repositories: new actions_1.MenuId('SCMRepositories'),
        ChangesSettings: new actions_1.MenuId('SCMChangesSettings'),
    };
    const ContextKeys = {
        SCMViewMode: new contextkey_1.RawContextKey('scmViewMode', "list" /* ViewMode.List */),
        SCMViewSortKey: new contextkey_1.RawContextKey('scmViewSortKey', "path" /* ViewSortKey.Path */),
        SCMViewAreAllRepositoriesCollapsed: new contextkey_1.RawContextKey('scmViewAreAllRepositoriesCollapsed', false),
        SCMViewIsAnyRepositoryCollapsible: new contextkey_1.RawContextKey('scmViewIsAnyRepositoryCollapsible', false),
        SCMProvider: new contextkey_1.RawContextKey('scmProvider', undefined),
        SCMProviderRootUri: new contextkey_1.RawContextKey('scmProviderRootUri', undefined),
        SCMProviderHasRootUri: new contextkey_1.RawContextKey('scmProviderHasRootUri', undefined),
        RepositoryCount: new contextkey_1.RawContextKey('scmRepositoryCount', 0),
        RepositoryVisibilityCount: new contextkey_1.RawContextKey('scmRepositoryVisibleCount', 0),
        RepositoryVisibility(repository) {
            return new contextkey_1.RawContextKey(`scmRepositoryVisible:${repository.provider.id}`, false);
        }
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMTitle, {
        title: (0, nls_1.localize)('sortAction', "View & Sort"),
        submenu: Menus.ViewSort,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0)),
        group: '0_view&sort',
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMTitle, {
        title: (0, nls_1.localize)('scmChanges', "Incoming & Outgoing"),
        submenu: Menus.ChangesSettings,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0)),
        group: '0_view&sort',
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ViewSort, {
        title: (0, nls_1.localize)('repositories', "Repositories"),
        submenu: Menus.Repositories,
        when: contextkey_1.ContextKeyExpr.greater(ContextKeys.RepositoryCount.key, 1),
        group: '0_repositories'
    });
    class SCMChangesSettingAction extends actions_1.Action2 {
        constructor(settingKey, settingValue, desc) {
            super({
                ...desc,
                f1: false,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${settingKey}`, settingValue),
            });
            this.settingKey = settingKey;
            this.settingValue = settingValue;
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue(this.settingKey, this.settingValue);
        }
    }
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMChangesSeparator, {
        title: (0, nls_1.localize)('incomingChanges', "Show Incoming Changes"),
        submenu: actions_1.MenuId.SCMIncomingChangesSetting,
        group: '1_incoming&outgoing',
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ChangesSettings, {
        title: (0, nls_1.localize)('incomingChanges', "Show Incoming Changes"),
        submenu: actions_1.MenuId.SCMIncomingChangesSetting,
        group: '1_incoming&outgoing',
        order: 1
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'always', {
                id: 'workbench.scm.action.showIncomingChanges.always',
                title: (0, nls_1.localize)('always', "Always"),
                menu: { id: actions_1.MenuId.SCMIncomingChangesSetting },
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'auto', {
                id: 'workbench.scm.action.showIncomingChanges.auto',
                title: (0, nls_1.localize)('auto', "Auto"),
                menu: {
                    id: actions_1.MenuId.SCMIncomingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showIncomingChanges', 'never', {
                id: 'workbench.scm.action.showIncomingChanges.never',
                title: (0, nls_1.localize)('never', "Never"),
                menu: {
                    id: actions_1.MenuId.SCMIncomingChangesSetting,
                }
            });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.SCMChangesSeparator, {
        title: (0, nls_1.localize)('outgoingChanges', "Show Outgoing Changes"),
        submenu: actions_1.MenuId.SCMOutgoingChangesSetting,
        group: '1_incoming&outgoing',
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(Menus.ChangesSettings, {
        title: (0, nls_1.localize)('outgoingChanges', "Show Outgoing Changes"),
        submenu: actions_1.MenuId.SCMOutgoingChangesSetting,
        group: '1_incoming&outgoing',
        order: 2
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'always', {
                id: 'workbench.scm.action.showOutgoingChanges.always',
                title: (0, nls_1.localize)('always', "Always"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'auto', {
                id: 'workbench.scm.action.showOutgoingChanges.auto',
                title: (0, nls_1.localize)('auto', "Auto"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends SCMChangesSettingAction {
        constructor() {
            super('scm.showOutgoingChanges', 'never', {
                id: 'workbench.scm.action.showOutgoingChanges.never',
                title: (0, nls_1.localize)('never', "Never"),
                menu: {
                    id: actions_1.MenuId.SCMOutgoingChangesSetting,
                }
            });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.scm.action.scm.showChangesSummary',
                title: (0, nls_1.localize)('showChangesSummary', "Show Changes Summary"),
                f1: false,
                toggled: contextkey_1.ContextKeyExpr.equals('config.scm.showChangesSummary', true),
                menu: [
                    { id: actions_1.MenuId.SCMChangesSeparator, order: 3 },
                    { id: Menus.ChangesSettings, order: 3 },
                ]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const configValue = configurationService.getValue('scm.showChangesSummary') === true;
            configurationService.updateValue('scm.showChangesSummary', !configValue);
        }
    });
    class RepositoryVisibilityAction extends actions_1.Action2 {
        constructor(repository) {
            super({
                id: `workbench.scm.action.toggleRepositoryVisibility.${repository.provider.id}`,
                title: repository.provider.name,
                f1: false,
                precondition: contextkey_1.ContextKeyExpr.or(ContextKeys.RepositoryVisibilityCount.notEqualsTo(1), ContextKeys.RepositoryVisibility(repository).isEqualTo(false)),
                toggled: ContextKeys.RepositoryVisibility(repository).isEqualTo(true),
                menu: { id: Menus.Repositories, group: '0_repositories' }
            });
            this.repository = repository;
        }
        run(accessor) {
            const scmViewService = accessor.get(scm_1.ISCMViewService);
            scmViewService.toggleVisibility(this.repository);
        }
    }
    let RepositoryVisibilityActionController = class RepositoryVisibilityActionController {
        constructor(contextKeyService, scmViewService, scmService) {
            this.contextKeyService = contextKeyService;
            this.scmViewService = scmViewService;
            this.items = new Map();
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryCountContextKey = ContextKeys.RepositoryCount.bindTo(contextKeyService);
            this.repositoryVisibilityCountContextKey = ContextKeys.RepositoryVisibilityCount.bindTo(contextKeyService);
            scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.disposables);
            scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            scmService.onDidRemoveRepository(this.onDidRemoveRepository, this, this.disposables);
            for (const repository of scmService.repositories) {
                this.onDidAddRepository(repository);
            }
        }
        onDidAddRepository(repository) {
            const action = (0, actions_1.registerAction2)(class extends RepositoryVisibilityAction {
                constructor() {
                    super(repository);
                }
            });
            const contextKey = ContextKeys.RepositoryVisibility(repository).bindTo(this.contextKeyService);
            contextKey.set(this.scmViewService.isVisible(repository));
            this.items.set(repository, {
                contextKey,
                dispose() {
                    contextKey.reset();
                    action.dispose();
                }
            });
            this.updateRepositoryContextKeys();
        }
        onDidRemoveRepository(repository) {
            this.items.get(repository)?.dispose();
            this.items.delete(repository);
            this.updateRepositoryContextKeys();
        }
        onDidChangeVisibleRepositories() {
            let count = 0;
            for (const [repository, item] of this.items) {
                const isVisible = this.scmViewService.isVisible(repository);
                item.contextKey.set(isVisible);
                if (isVisible) {
                    count++;
                }
            }
            this.repositoryCountContextKey.set(this.items.size);
            this.repositoryVisibilityCountContextKey.set(count);
        }
        updateRepositoryContextKeys() {
            this.repositoryCountContextKey.set(this.items.size);
            this.repositoryVisibilityCountContextKey.set(iterator_1.Iterable.reduce(this.items.keys(), (r, repository) => r + (this.scmViewService.isVisible(repository) ? 1 : 0), 0));
        }
        dispose() {
            this.disposables.dispose();
            (0, lifecycle_1.dispose)(this.items.values());
            this.items.clear();
        }
    };
    RepositoryVisibilityActionController = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, scm_1.ISCMViewService),
        __param(2, scm_1.ISCMService)
    ], RepositoryVisibilityActionController);
    class SetListViewModeAction extends viewPane_1.ViewAction {
        constructor(id = 'workbench.scm.action.setListViewMode', menu = {}) {
            super({
                id,
                title: (0, nls_1.localize)('setListViewMode', "View as List"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.listTree,
                toggled: ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */),
                menu: { id: Menus.ViewSort, group: '1_viewmode', ...menu }
            });
        }
        async runInView(_, view) {
            view.viewMode = "list" /* ViewMode.List */;
        }
    }
    class SetListViewModeNavigationAction extends SetListViewModeAction {
        constructor() {
            super('workbench.scm.action.setListViewModeNavigation', {
                id: actions_1.MenuId.SCMTitle,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0), ContextKeys.SCMViewMode.isEqualTo("tree" /* ViewMode.Tree */)),
                group: 'navigation',
                order: -1000
            });
        }
    }
    class SetTreeViewModeAction extends viewPane_1.ViewAction {
        constructor(id = 'workbench.scm.action.setTreeViewMode', menu = {}) {
            super({
                id,
                title: (0, nls_1.localize)('setTreeViewMode', "View as Tree"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.listFlat,
                toggled: ContextKeys.SCMViewMode.isEqualTo("tree" /* ViewMode.Tree */),
                menu: { id: Menus.ViewSort, group: '1_viewmode', ...menu }
            });
        }
        async runInView(_, view) {
            view.viewMode = "tree" /* ViewMode.Tree */;
        }
    }
    class SetTreeViewModeNavigationAction extends SetTreeViewModeAction {
        constructor() {
            super('workbench.scm.action.setTreeViewModeNavigation', {
                id: actions_1.MenuId.SCMTitle,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.RepositoryCount.notEqualsTo(0), ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */)),
                group: 'navigation',
                order: -1000
            });
        }
    }
    (0, actions_1.registerAction2)(SetListViewModeAction);
    (0, actions_1.registerAction2)(SetTreeViewModeAction);
    (0, actions_1.registerAction2)(SetListViewModeNavigationAction);
    (0, actions_1.registerAction2)(SetTreeViewModeNavigationAction);
    class RepositorySortAction extends viewPane_1.ViewAction {
        constructor(sortKey, title) {
            super({
                id: `workbench.scm.action.repositories.setSortKey.${sortKey}`,
                title,
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                toggled: scmViewService_1.RepositoryContextKeys.RepositorySortKey.isEqualTo(sortKey),
                menu: [
                    {
                        id: Menus.Repositories,
                        group: '1_sort'
                    },
                    {
                        id: actions_1.MenuId.SCMSourceControlTitle,
                        group: '1_sort',
                    },
                ]
            });
            this.sortKey = sortKey;
        }
        runInView(accessor) {
            accessor.get(scm_1.ISCMViewService).toggleSortKey(this.sortKey);
        }
    }
    class RepositorySortByDiscoveryTimeAction extends RepositorySortAction {
        constructor() {
            super("discoveryTime" /* ISCMRepositorySortKey.DiscoveryTime */, (0, nls_1.localize)('repositorySortByDiscoveryTime', "Sort by Discovery Time"));
        }
    }
    class RepositorySortByNameAction extends RepositorySortAction {
        constructor() {
            super("name" /* ISCMRepositorySortKey.Name */, (0, nls_1.localize)('repositorySortByName', "Sort by Name"));
        }
    }
    class RepositorySortByPathAction extends RepositorySortAction {
        constructor() {
            super("path" /* ISCMRepositorySortKey.Path */, (0, nls_1.localize)('repositorySortByPath', "Sort by Path"));
        }
    }
    (0, actions_1.registerAction2)(RepositorySortByDiscoveryTimeAction);
    (0, actions_1.registerAction2)(RepositorySortByNameAction);
    (0, actions_1.registerAction2)(RepositorySortByPathAction);
    class SetSortKeyAction extends viewPane_1.ViewAction {
        constructor(sortKey, title) {
            super({
                id: `workbench.scm.action.setSortKey.${sortKey}`,
                title,
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                toggled: ContextKeys.SCMViewSortKey.isEqualTo(sortKey),
                precondition: ContextKeys.SCMViewMode.isEqualTo("list" /* ViewMode.List */),
                menu: { id: Menus.ViewSort, group: '2_sort' }
            });
            this.sortKey = sortKey;
        }
        async runInView(_, view) {
            view.viewSortKey = this.sortKey;
        }
    }
    class SetSortByNameAction extends SetSortKeyAction {
        constructor() {
            super("name" /* ViewSortKey.Name */, (0, nls_1.localize)('sortChangesByName', "Sort Changes by Name"));
        }
    }
    class SetSortByPathAction extends SetSortKeyAction {
        constructor() {
            super("path" /* ViewSortKey.Path */, (0, nls_1.localize)('sortChangesByPath', "Sort Changes by Path"));
        }
    }
    class SetSortByStatusAction extends SetSortKeyAction {
        constructor() {
            super("status" /* ViewSortKey.Status */, (0, nls_1.localize)('sortChangesByStatus', "Sort Changes by Status"));
        }
    }
    (0, actions_1.registerAction2)(SetSortByNameAction);
    (0, actions_1.registerAction2)(SetSortByPathAction);
    (0, actions_1.registerAction2)(SetSortByStatusAction);
    class CollapseAllRepositoriesAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.scm.action.collapseAllRepositories`,
                title: (0, nls_1.localize)('collapse all', "Collapse All Repositories"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.SCMTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.SCMViewIsAnyRepositoryCollapsible.isEqualTo(true), ContextKeys.SCMViewAreAllRepositoriesCollapsed.isEqualTo(false))
                }
            });
        }
        async runInView(_, view) {
            view.collapseAllRepositories();
        }
    }
    class ExpandAllRepositoriesAction extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: `workbench.scm.action.expandAllRepositories`,
                title: (0, nls_1.localize)('expand all', "Expand All Repositories"),
                viewId: scm_1.VIEW_PANE_ID,
                f1: false,
                icon: codicons_1.Codicon.expandAll,
                menu: {
                    id: actions_1.MenuId.SCMTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', scm_1.VIEW_PANE_ID), ContextKeys.SCMViewIsAnyRepositoryCollapsible.isEqualTo(true), ContextKeys.SCMViewAreAllRepositoriesCollapsed.isEqualTo(true))
                }
            });
        }
        async runInView(_, view) {
            view.expandAllRepositories();
        }
    }
    (0, actions_1.registerAction2)(CollapseAllRepositoriesAction);
    (0, actions_1.registerAction2)(ExpandAllRepositoriesAction);
    var SCMInputWidgetCommandId;
    (function (SCMInputWidgetCommandId) {
        SCMInputWidgetCommandId["CancelAction"] = "scm.input.cancelAction";
    })(SCMInputWidgetCommandId || (SCMInputWidgetCommandId = {}));
    var SCMInputWidgetStorageKey;
    (function (SCMInputWidgetStorageKey) {
        SCMInputWidgetStorageKey["LastActionId"] = "scm.input.lastActionId";
    })(SCMInputWidgetStorageKey || (SCMInputWidgetStorageKey = {}));
    let SCMInputWidgetActionRunner = class SCMInputWidgetActionRunner extends actions_2.ActionRunner {
        get runningActions() { return this._runningActions; }
        constructor(input, storageService) {
            super();
            this.input = input;
            this.storageService = storageService;
            this._runningActions = new Set();
        }
        async runAction(action) {
            try {
                // Cancel previous action
                if (this.runningActions.size !== 0) {
                    this._cts?.cancel();
                    if (action.id === "scm.input.cancelAction" /* SCMInputWidgetCommandId.CancelAction */) {
                        return;
                    }
                }
                // Create action context
                const context = [];
                for (const group of this.input.repository.provider.groups) {
                    context.push({
                        resourceGroupId: group.id,
                        resources: [...group.resources.map(r => r.sourceUri)]
                    });
                }
                // Run action
                this._runningActions.add(action);
                this._cts = new cancellation_1.CancellationTokenSource();
                await action.run(...[this.input.repository.provider.rootUri, context, this._cts.token]);
            }
            finally {
                this._runningActions.delete(action);
                // Save last action
                if (this._runningActions.size === 0) {
                    this.storageService.store("scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, action.id, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                }
            }
        }
    };
    SCMInputWidgetActionRunner = __decorate([
        __param(1, storage_1.IStorageService)
    ], SCMInputWidgetActionRunner);
    let SCMInputWidgetToolbar = class SCMInputWidgetToolbar extends toolbar_1.WorkbenchToolBar {
        get dropdownActions() { return this._dropdownActions; }
        get dropdownAction() { return this._dropdownAction; }
        constructor(container, options, menuService, contextKeyService, contextMenuService, commandService, keybindingService, storageService, telemetryService) {
            super(container, { resetMenu: actions_1.MenuId.SCMInputBox, ...options }, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService);
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this._dropdownActions = [];
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.repositoryDisposables = new lifecycle_1.DisposableStore();
            this._dropdownAction = new actions_2.Action('scmInputMoreActions', (0, nls_1.localize)('scmInputMoreActions', "More Actions..."), 'codicon-chevron-down');
            this._cancelAction = new actions_1.MenuItemAction({
                id: "scm.input.cancelAction" /* SCMInputWidgetCommandId.CancelAction */,
                title: (0, nls_1.localize)('scmInputCancelAction', "Cancel"),
                icon: codicons_1.Codicon.debugStop,
            }, undefined, undefined, undefined, contextKeyService, commandService);
        }
        setInput(input) {
            this.repositoryDisposables.clear();
            const contextKeyService = this.contextKeyService.createOverlay([
                ['scmProvider', input.repository.provider.contextValue],
                ['scmProviderRootUri', input.repository.provider.rootUri?.toString()],
                ['scmProviderHasRootUri', !!input.repository.provider.rootUri]
            ]);
            const menu = this.repositoryDisposables.add(this.menuService.createMenu(actions_1.MenuId.SCMInputBox, contextKeyService, { emitEventsForSubmenuChanges: true }));
            const isEnabled = () => {
                return input.repository.provider.groups.some(g => g.resources.length > 0);
            };
            const updateToolbar = () => {
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, actions);
                for (const action of actions) {
                    action.enabled = isEnabled();
                }
                this._dropdownAction.enabled = isEnabled();
                let primaryAction = undefined;
                if (actions.length === 1) {
                    primaryAction = actions[0];
                }
                else if (actions.length > 1) {
                    const lastActionId = this.storageService.get("scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, 0 /* StorageScope.PROFILE */, '');
                    primaryAction = actions.find(a => a.id === lastActionId) ?? actions[0];
                }
                this._dropdownActions = actions.length === 1 ? [] : actions;
                super.setActions(primaryAction ? [primaryAction] : [], []);
                this._onDidChange.fire();
            };
            this.repositoryDisposables.add(menu.onDidChange(() => updateToolbar()));
            this.repositoryDisposables.add(input.repository.provider.onDidChangeResources(() => updateToolbar()));
            this.repositoryDisposables.add(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, "scm.input.lastActionId" /* SCMInputWidgetStorageKey.LastActionId */, this.repositoryDisposables)(() => updateToolbar()));
            this.actionRunner = new SCMInputWidgetActionRunner(input, this.storageService);
            this.repositoryDisposables.add(this.actionRunner.onWillRun(e => {
                if (this.actionRunner.runningActions.size === 0) {
                    super.setActions([this._cancelAction], []);
                    this._onDidChange.fire();
                }
            }));
            this.repositoryDisposables.add(this.actionRunner.onDidRun(e => {
                if (this.actionRunner.runningActions.size === 0) {
                    updateToolbar();
                }
            }));
            updateToolbar();
        }
    };
    SCMInputWidgetToolbar = __decorate([
        __param(2, actions_1.IMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, commands_1.ICommandService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, storage_1.IStorageService),
        __param(8, telemetry_1.ITelemetryService)
    ], SCMInputWidgetToolbar);
    class SCMInputWidgetEditorOptions {
        constructor(overflowWidgetsDomNode, configurationService) {
            this.overflowWidgetsDomNode = overflowWidgetsDomNode;
            this.configurationService = configurationService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.defaultInputFontFamily = fonts_1.DEFAULT_FONT_FAMILY;
            this._disposables = new lifecycle_1.DisposableStore();
            const onDidChangeConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => {
                return e.affectsConfiguration('editor.accessibilitySupport') ||
                    e.affectsConfiguration('editor.cursorBlinking') ||
                    e.affectsConfiguration('editor.fontFamily') ||
                    e.affectsConfiguration('editor.rulers') ||
                    e.affectsConfiguration('editor.wordWrap') ||
                    e.affectsConfiguration('scm.inputFontFamily') ||
                    e.affectsConfiguration('scm.inputFontSize');
            }, this._disposables);
            this._disposables.add(onDidChangeConfiguration(() => this._onDidChange.fire()));
        }
        getEditorConstructionOptions() {
            const fontFamily = this._getEditorFontFamily();
            const fontSize = this._getEditorFontSize();
            const lineHeight = this._getEditorLineHeight(fontSize);
            return {
                ...(0, simpleEditorOptions_1.getSimpleEditorOptions)(this.configurationService),
                ...this._getEditorLanguageConfiguration(),
                cursorWidth: 1,
                dragAndDrop: true,
                dropIntoEditor: { enabled: true },
                fontFamily: fontFamily,
                fontSize: fontSize,
                formatOnType: true,
                lineDecorationsWidth: 6,
                lineHeight: lineHeight,
                overflowWidgetsDomNode: this.overflowWidgetsDomNode,
                padding: { top: 2, bottom: 2 },
                quickSuggestions: false,
                renderWhitespace: 'none',
                scrollbar: {
                    alwaysConsumeMouseWheel: false,
                    vertical: 'hidden'
                },
                wrappingIndent: 'none',
                wrappingStrategy: 'advanced',
            };
        }
        getEditorOptions() {
            const fontFamily = this._getEditorFontFamily();
            const fontSize = this._getEditorFontSize();
            const lineHeight = this._getEditorLineHeight(fontSize);
            const accessibilitySupport = this.configurationService.getValue('editor.accessibilitySupport');
            const cursorBlinking = this.configurationService.getValue('editor.cursorBlinking');
            return { ...this._getEditorLanguageConfiguration(), accessibilitySupport, cursorBlinking, fontFamily, fontSize, lineHeight };
        }
        _getEditorFontFamily() {
            const inputFontFamily = this.configurationService.getValue('scm.inputFontFamily').trim();
            if (inputFontFamily.toLowerCase() === 'editor') {
                return this.configurationService.getValue('editor.fontFamily').trim();
            }
            if (inputFontFamily.length !== 0 && inputFontFamily.toLowerCase() !== 'default') {
                return inputFontFamily;
            }
            return this.defaultInputFontFamily;
        }
        _getEditorFontSize() {
            return this.configurationService.getValue('scm.inputFontSize');
        }
        _getEditorLanguageConfiguration() {
            // editor.rulers
            const rulersConfig = this.configurationService.inspect('editor.rulers', { overrideIdentifier: 'scminput' });
            const rulers = rulersConfig.overrideIdentifiers?.includes('scminput') ? editorOptions_1.EditorOptions.rulers.validate(rulersConfig.value) : [];
            // editor.wordWrap
            const wordWrapConfig = this.configurationService.inspect('editor.wordWrap', { overrideIdentifier: 'scminput' });
            const wordWrap = wordWrapConfig.overrideIdentifiers?.includes('scminput') ? editorOptions_1.EditorOptions.wordWrap.validate(wordWrapConfig.value) : 'on';
            return { rulers, wordWrap };
        }
        _getEditorLineHeight(fontSize) {
            return Math.round(fontSize * 1.5);
        }
        dispose() {
            this._disposables.dispose();
        }
    }
    let SCMInputWidget = class SCMInputWidget {
        static { SCMInputWidget_1 = this; }
        static { this.ValidationTimeouts = {
            [2 /* InputValidationType.Information */]: 5000,
            [1 /* InputValidationType.Warning */]: 8000,
            [0 /* InputValidationType.Error */]: 10000
        }; }
        get input() {
            return this.model?.input;
        }
        async setInput(input) {
            if (input === this.input) {
                return;
            }
            this.clearValidation();
            this.element.classList.remove('synthetic-focus');
            this.repositoryDisposables.clear();
            this.repositoryIdContextKey.set(input?.repository.id);
            if (!input) {
                this.model?.textModelRef?.dispose();
                this.inputEditor.setModel(undefined);
                this.model = undefined;
                return;
            }
            const uri = input.repository.provider.inputBoxDocumentUri;
            if (this.configurationService.getValue('editor.wordBasedSuggestions', { resource: uri }) !== 'off') {
                this.configurationService.updateValue('editor.wordBasedSuggestions', 'off', { resource: uri }, 8 /* ConfigurationTarget.MEMORY */);
            }
            const modelValue = { input, textModelRef: undefined };
            // Save model
            this.model = modelValue;
            const modelRef = await this.textModelService.createModelReference(uri);
            // Model has been changed in the meantime
            if (this.model !== modelValue) {
                modelRef.dispose();
                return;
            }
            modelValue.textModelRef = modelRef;
            const textModel = modelRef.object.textEditorModel;
            this.inputEditor.setModel(textModel);
            // Validation
            const validationDelayer = new async_1.ThrottledDelayer(200);
            const validate = async () => {
                const position = this.inputEditor.getSelection()?.getStartPosition();
                const offset = position && textModel.getOffsetAt(position);
                const value = textModel.getValue();
                this.setValidation(await input.validateInput(value, offset || 0));
            };
            const triggerValidation = () => validationDelayer.trigger(validate);
            this.repositoryDisposables.add(validationDelayer);
            this.repositoryDisposables.add(this.inputEditor.onDidChangeCursorPosition(triggerValidation));
            // Adaptive indentation rules
            const opts = this.modelService.getCreationOptions(textModel.getLanguageId(), textModel.uri, textModel.isForSimpleWidget);
            const onEnter = event_1.Event.filter(this.inputEditor.onKeyDown, e => e.keyCode === 3 /* KeyCode.Enter */, this.repositoryDisposables);
            this.repositoryDisposables.add(onEnter(() => textModel.detectIndentation(opts.insertSpaces, opts.tabSize)));
            // Keep model in sync with API
            textModel.setValue(input.value);
            this.repositoryDisposables.add(input.onDidChange(({ value, reason }) => {
                const currentValue = textModel.getValue();
                if (value === currentValue) { // circuit breaker
                    return;
                }
                textModel.pushStackElement();
                textModel.pushEditOperations(null, [editOperation_1.EditOperation.replaceMove(textModel.getFullModelRange(), value)], () => []);
                const position = reason === scm_1.SCMInputChangeReason.HistoryPrevious
                    ? textModel.getFullModelRange().getStartPosition()
                    : textModel.getFullModelRange().getEndPosition();
                this.inputEditor.setPosition(position);
                this.inputEditor.revealPositionInCenterIfOutsideViewport(position);
            }));
            this.repositoryDisposables.add(input.onDidChangeFocus(() => this.focus()));
            this.repositoryDisposables.add(input.onDidChangeValidationMessage((e) => this.setValidation(e, { focus: true, timeout: true })));
            this.repositoryDisposables.add(input.onDidChangeValidateInput((e) => triggerValidation()));
            // Keep API in sync with model, update placeholder visibility and validate
            const updatePlaceholderVisibility = () => this.placeholderTextContainer.classList.toggle('hidden', textModel.getValueLength() > 0);
            this.repositoryDisposables.add(textModel.onDidChangeContent(() => {
                input.setValue(textModel.getValue(), true);
                updatePlaceholderVisibility();
                triggerValidation();
            }));
            updatePlaceholderVisibility();
            // Update placeholder text
            const updatePlaceholderText = () => {
                const binding = this.keybindingService.lookupKeybinding('scm.acceptInput');
                const label = binding ? binding.getLabel() : (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter');
                const placeholderText = (0, strings_1.format)(input.placeholder, label);
                this.inputEditor.updateOptions({ ariaLabel: placeholderText });
                this.placeholderTextContainer.textContent = placeholderText;
            };
            this.repositoryDisposables.add(input.onDidChangePlaceholder(updatePlaceholderText));
            this.repositoryDisposables.add(this.keybindingService.onDidUpdateKeybindings(updatePlaceholderText));
            updatePlaceholderText();
            // Update input template
            let commitTemplate = '';
            const updateTemplate = () => {
                if (typeof input.repository.provider.commitTemplate === 'undefined' || !input.visible) {
                    return;
                }
                const oldCommitTemplate = commitTemplate;
                commitTemplate = input.repository.provider.commitTemplate;
                const value = textModel.getValue();
                if (value && value !== oldCommitTemplate) {
                    return;
                }
                textModel.setValue(commitTemplate);
            };
            this.repositoryDisposables.add(input.repository.provider.onDidChangeCommitTemplate(updateTemplate, this));
            updateTemplate();
            // Update input enablement
            const updateEnablement = (enabled) => {
                this.inputEditor.updateOptions({ readOnly: !enabled });
            };
            this.repositoryDisposables.add(input.onDidChangeEnablement(enabled => updateEnablement(enabled)));
            updateEnablement(input.enabled);
            // Toolbar
            this.toolbar.setInput(input);
        }
        get selections() {
            return this.inputEditor.getSelections();
        }
        set selections(selections) {
            if (selections) {
                this.inputEditor.setSelections(selections);
            }
        }
        setValidation(validation, options) {
            if (this._validationTimer) {
                clearTimeout(this._validationTimer);
                this._validationTimer = 0;
            }
            this.validation = validation;
            this.renderValidation();
            if (options?.focus && !this.hasFocus()) {
                this.focus();
            }
            if (validation && options?.timeout) {
                this._validationTimer = setTimeout(() => this.setValidation(undefined), SCMInputWidget_1.ValidationTimeouts[validation.type]);
            }
        }
        constructor(container, overflowWidgetsDomNode, contextKeyService, modelService, textModelService, keybindingService, configurationService, instantiationService, scmViewService, contextViewService, openerService, contextMenuService) {
            this.modelService = modelService;
            this.textModelService = textModelService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.scmViewService = scmViewService;
            this.contextViewService = contextViewService;
            this.openerService = openerService;
            this.contextMenuService = contextMenuService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables = new lifecycle_1.DisposableStore();
            this.validationDisposable = lifecycle_1.Disposable.None;
            this.validationHasFocus = false;
            // This is due to "Setup height change listener on next tick" above
            // https://github.com/microsoft/vscode/issues/108067
            this.lastLayoutWasTrash = false;
            this.shouldFocusAfterLayout = false;
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('.scm-editor'));
            this.editorContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('.scm-editor-container'));
            this.placeholderTextContainer = (0, dom_1.append)(this.editorContainer, (0, dom_1.$)('.scm-editor-placeholder'));
            this.toolbarContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('.scm-editor-toolbar'));
            this.contextKeyService = contextKeyService.createScoped(this.element);
            this.repositoryIdContextKey = this.contextKeyService.createKey('scmRepository', undefined);
            this.inputEditorOptions = new SCMInputWidgetEditorOptions(overflowWidgetsDomNode, this.configurationService);
            this.disposables.add(this.inputEditorOptions.onDidChange(this.onDidChangeEditorOptions, this));
            this.disposables.add(this.inputEditorOptions);
            const editorConstructionOptions = this.inputEditorOptions.getEditorConstructionOptions();
            this.setPlaceholderFontStyles(editorConstructionOptions.fontFamily, editorConstructionOptions.fontSize, editorConstructionOptions.lineHeight);
            const codeEditorWidgetOptions = {
                isSimpleWidget: true,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    colorDetector_1.ColorDetector.ID,
                    contextmenu_1.ContextMenuController.ID,
                    dnd_1.DragAndDropController.ID,
                    dropIntoEditorController_1.DropIntoEditorController.ID,
                    links_1.LinkDetector.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    messageController_1.MessageController.ID,
                    hover_1.HoverController.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    snippetController2_1.SnippetController2.ID,
                    suggestController_1.SuggestController.ID,
                    inlineCompletionsController_1.InlineCompletionsController.ID,
                    codeActionController_1.CodeActionController.ID,
                    formatActions_1.FormatOnType.ID,
                    editorDictation_1.EditorDictation.ID
                ])
            };
            const services = new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]);
            const instantiationService2 = instantiationService.createChild(services);
            this.inputEditor = instantiationService2.createInstance(codeEditorWidget_1.CodeEditorWidget, this.editorContainer, editorConstructionOptions, codeEditorWidgetOptions);
            this.disposables.add(this.inputEditor);
            this.disposables.add(this.inputEditor.onDidFocusEditorText(() => {
                if (this.input?.repository) {
                    this.scmViewService.focus(this.input.repository);
                }
                this.element.classList.add('synthetic-focus');
                this.renderValidation();
            }));
            this.disposables.add(this.inputEditor.onDidBlurEditorText(() => {
                this.element.classList.remove('synthetic-focus');
                setTimeout(() => {
                    if (!this.validation || !this.validationHasFocus) {
                        this.clearValidation();
                    }
                }, 0);
            }));
            const firstLineKey = this.contextKeyService.createKey('scmInputIsInFirstPosition', false);
            const lastLineKey = this.contextKeyService.createKey('scmInputIsInLastPosition', false);
            this.disposables.add(this.inputEditor.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this.inputEditor._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineLength(lastLineNumber) + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                firstLineKey.set(viewPosition.lineNumber === 1 && viewPosition.column === 1);
                lastLineKey.set(viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol);
            }));
            this.disposables.add(this.inputEditor.onDidScrollChange(e => {
                this.toolbarContainer.classList.toggle('scroll-decoration', e.scrollTop > 0);
            }));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.showInputActionButton'))(() => this.layout(), this, this.disposables);
            this.onDidChangeContentHeight = event_1.Event.signal(event_1.Event.filter(this.inputEditor.onDidContentSizeChange, e => e.contentHeightChanged, this.disposables));
            // Toolbar
            this.toolbar = instantiationService2.createInstance(SCMInputWidgetToolbar, this.toolbarContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.MenuItemAction && this.toolbar.dropdownActions.length > 1) {
                        return instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, this.toolbar.dropdownAction, this.toolbar.dropdownActions, '', this.contextMenuService, { actionRunner: this.toolbar.actionRunner, hoverDelegate: options.hoverDelegate });
                    }
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(instantiationService, action, options);
                },
                menuOptions: {
                    shouldForwardArgs: true
                }
            });
            this.disposables.add(this.toolbar.onDidChange(() => this.layout()));
            this.disposables.add(this.toolbar);
        }
        getContentHeight() {
            const lineHeight = this.inputEditor.getOption(67 /* EditorOption.lineHeight */);
            const { top, bottom } = this.inputEditor.getOption(84 /* EditorOption.padding */);
            const inputMinLinesConfig = this.configurationService.getValue('scm.inputMinLineCount');
            const inputMinLines = typeof inputMinLinesConfig === 'number' ? (0, numbers_1.clamp)(inputMinLinesConfig, 1, 50) : 1;
            const editorMinHeight = inputMinLines * lineHeight + top + bottom;
            const inputMaxLinesConfig = this.configurationService.getValue('scm.inputMaxLineCount');
            const inputMaxLines = typeof inputMaxLinesConfig === 'number' ? (0, numbers_1.clamp)(inputMaxLinesConfig, 1, 50) : 10;
            const editorMaxHeight = inputMaxLines * lineHeight + top + bottom;
            return (0, numbers_1.clamp)(this.inputEditor.getContentHeight(), editorMinHeight, editorMaxHeight);
        }
        layout() {
            const editorHeight = this.getContentHeight();
            const toolbarWidth = this.getToolbarWidth();
            const dimension = new dom_1.Dimension(this.element.clientWidth - toolbarWidth, editorHeight);
            if (dimension.width < 0) {
                this.lastLayoutWasTrash = true;
                return;
            }
            this.lastLayoutWasTrash = false;
            this.inputEditor.layout(dimension);
            this.placeholderTextContainer.style.width = `${dimension.width}px`;
            this.renderValidation();
            const showInputActionButton = this.configurationService.getValue('scm.showInputActionButton') === true;
            this.toolbarContainer.classList.toggle('hidden', !showInputActionButton || this.toolbar?.isEmpty() === true);
            if (this.shouldFocusAfterLayout) {
                this.shouldFocusAfterLayout = false;
                this.focus();
            }
        }
        focus() {
            if (this.lastLayoutWasTrash) {
                this.lastLayoutWasTrash = false;
                this.shouldFocusAfterLayout = true;
                return;
            }
            this.inputEditor.focus();
            this.element.classList.add('synthetic-focus');
        }
        hasFocus() {
            return this.inputEditor.hasTextFocus();
        }
        onDidChangeEditorOptions() {
            const editorOptions = this.inputEditorOptions.getEditorOptions();
            this.inputEditor.updateOptions(editorOptions);
            this.setPlaceholderFontStyles(editorOptions.fontFamily, editorOptions.fontSize, editorOptions.lineHeight);
        }
        renderValidation() {
            this.clearValidation();
            this.element.classList.toggle('validation-info', this.validation?.type === 2 /* InputValidationType.Information */);
            this.element.classList.toggle('validation-warning', this.validation?.type === 1 /* InputValidationType.Warning */);
            this.element.classList.toggle('validation-error', this.validation?.type === 0 /* InputValidationType.Error */);
            if (!this.validation || !this.inputEditor.hasTextFocus()) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            this.validationDisposable = this.contextViewService.showContextView({
                getAnchor: () => this.element,
                render: container => {
                    this.element.style.borderBottomLeftRadius = '0';
                    this.element.style.borderBottomRightRadius = '0';
                    const validationContainer = (0, dom_1.append)(container, (0, dom_1.$)('.scm-editor-validation-container'));
                    validationContainer.classList.toggle('validation-info', this.validation.type === 2 /* InputValidationType.Information */);
                    validationContainer.classList.toggle('validation-warning', this.validation.type === 1 /* InputValidationType.Warning */);
                    validationContainer.classList.toggle('validation-error', this.validation.type === 0 /* InputValidationType.Error */);
                    validationContainer.style.width = `${this.element.clientWidth + 2}px`;
                    const element = (0, dom_1.append)(validationContainer, (0, dom_1.$)('.scm-editor-validation'));
                    const message = this.validation.message;
                    if (typeof message === 'string') {
                        element.textContent = message;
                    }
                    else {
                        const tracker = (0, dom_1.trackFocus)(element);
                        disposables.add(tracker);
                        disposables.add(tracker.onDidFocus(() => (this.validationHasFocus = true)));
                        disposables.add(tracker.onDidBlur(() => {
                            this.validationHasFocus = false;
                            this.element.style.borderBottomLeftRadius = '2px';
                            this.element.style.borderBottomRightRadius = '2px';
                            this.contextViewService.hideContextView();
                        }));
                        const renderer = disposables.add(this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {}));
                        const renderedMarkdown = renderer.render(message, {
                            actionHandler: {
                                callback: (link) => {
                                    (0, markdownRenderer_1.openLinkFromMarkdown)(this.openerService, link, message.isTrusted);
                                    this.element.style.borderBottomLeftRadius = '2px';
                                    this.element.style.borderBottomRightRadius = '2px';
                                    this.contextViewService.hideContextView();
                                },
                                disposables: disposables
                            },
                        });
                        disposables.add(renderedMarkdown);
                        element.appendChild(renderedMarkdown.element);
                    }
                    const actionsContainer = (0, dom_1.append)(validationContainer, (0, dom_1.$)('.scm-editor-validation-actions'));
                    const actionbar = new actionbar_1.ActionBar(actionsContainer);
                    const action = new actions_2.Action('scmInputWidget.validationMessage.close', (0, nls_1.localize)('label.close', "Close"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.close), true, () => {
                        this.contextViewService.hideContextView();
                        this.element.style.borderBottomLeftRadius = '2px';
                        this.element.style.borderBottomRightRadius = '2px';
                    });
                    disposables.add(actionbar);
                    actionbar.push(action, { icon: true, label: false });
                    return lifecycle_1.Disposable.None;
                },
                onHide: () => {
                    this.validationHasFocus = false;
                    this.element.style.borderBottomLeftRadius = '2px';
                    this.element.style.borderBottomRightRadius = '2px';
                    disposables.dispose();
                },
                anchorAlignment: 0 /* AnchorAlignment.LEFT */
            });
        }
        getToolbarWidth() {
            const showInputActionButton = this.configurationService.getValue('scm.showInputActionButton');
            if (!this.toolbar || !showInputActionButton || this.toolbar?.isEmpty() === true) {
                return 0;
            }
            return this.toolbar.dropdownActions.length === 0 ?
                26 /* 22px action + 4px margin */ :
                39 /* 35px action + 4px margin */;
        }
        setPlaceholderFontStyles(fontFamily, fontSize, lineHeight) {
            this.placeholderTextContainer.style.fontFamily = fontFamily;
            this.placeholderTextContainer.style.fontSize = `${fontSize}px`;
            this.placeholderTextContainer.style.lineHeight = `${lineHeight}px`;
        }
        clearValidation() {
            this.validationDisposable.dispose();
            this.validationHasFocus = false;
        }
        dispose() {
            this.setInput(undefined);
            this.repositoryDisposables.dispose();
            this.clearValidation();
            this.disposables.dispose();
        }
    };
    SCMInputWidget = SCMInputWidget_1 = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, model_1.IModelService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, scm_1.ISCMViewService),
        __param(9, contextView_1.IContextViewService),
        __param(10, opener_1.IOpenerService),
        __param(11, contextView_1.IContextMenuService)
    ], SCMInputWidget);
    let SCMViewPane = class SCMViewPane extends viewPane_1.ViewPane {
        get viewMode() { return this._viewMode; }
        set viewMode(mode) {
            if (this._viewMode === mode) {
                return;
            }
            this._viewMode = mode;
            // Update sort key based on view mode
            this.viewSortKey = this.getViewSortKey();
            this.updateChildren();
            this.onDidActiveEditorChange();
            this._onDidChangeViewMode.fire(mode);
            this.viewModeContextKey.set(mode);
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this.storageService.store(`scm.viewMode`, mode, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        get viewSortKey() { return this._viewSortKey; }
        set viewSortKey(sortKey) {
            if (this._viewSortKey === sortKey) {
                return;
            }
            this._viewSortKey = sortKey;
            this.updateChildren();
            this.viewSortKeyContextKey.set(sortKey);
            this._onDidChangeViewSortKey.fire(sortKey);
            if (this._viewMode === "list" /* ViewMode.List */) {
                this.storageService.store(`scm.viewSortKey`, sortKey, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
        }
        constructor(options, commandService, editorService, logService, menuService, scmService, scmViewService, storageService, uriIdentityService, keybindingService, themeService, contextMenuService, instantiationService, viewDescriptorService, configurationService, contextKeyService, openerService, telemetryService) {
            super({ ...options, titleMenuId: actions_1.MenuId.SCMTitle }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.commandService = commandService;
            this.editorService = editorService;
            this.logService = logService;
            this.menuService = menuService;
            this.scmService = scmService;
            this.scmViewService = scmViewService;
            this.storageService = storageService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeViewMode = new event_1.Emitter();
            this.onDidChangeViewMode = this._onDidChangeViewMode.event;
            this._onDidChangeViewSortKey = new event_1.Emitter();
            this.onDidChangeViewSortKey = this._onDidChangeViewSortKey.event;
            this.items = new lifecycle_1.DisposableMap();
            this.visibilityDisposables = new lifecycle_1.DisposableStore();
            this.treeOperationSequencer = new async_1.Sequencer();
            this.revealResourceThrottler = new async_1.Throttler();
            this.updateChildrenThrottler = new async_1.Throttler();
            this.disposables = new lifecycle_1.DisposableStore();
            // View mode and sort key
            this._viewMode = this.getViewMode();
            this._viewSortKey = this.getViewSortKey();
            // Context Keys
            this.viewModeContextKey = ContextKeys.SCMViewMode.bindTo(contextKeyService);
            this.viewModeContextKey.set(this._viewMode);
            this.viewSortKeyContextKey = ContextKeys.SCMViewSortKey.bindTo(contextKeyService);
            this.viewSortKeyContextKey.set(this.viewSortKey);
            this.areAllRepositoriesCollapsedContextKey = ContextKeys.SCMViewAreAllRepositoriesCollapsed.bindTo(contextKeyService);
            this.isAnyRepositoryCollapsibleContextKey = ContextKeys.SCMViewIsAnyRepositoryCollapsible.bindTo(contextKeyService);
            this.scmProviderContextKey = ContextKeys.SCMProvider.bindTo(contextKeyService);
            this.scmProviderRootUriContextKey = ContextKeys.SCMProviderRootUri.bindTo(contextKeyService);
            this.scmProviderHasRootUriContextKey = ContextKeys.SCMProviderHasRootUri.bindTo(contextKeyService);
            this._onDidLayout = new event_1.Emitter();
            this.layoutCache = { height: undefined, width: undefined, onDidChange: this._onDidLayout.event };
            this.storageService.onDidChangeValue(1 /* StorageScope.WORKSPACE */, undefined, this.disposables)(e => {
                switch (e.key) {
                    case 'scm.viewMode':
                        this.viewMode = this.getViewMode();
                        break;
                    case 'scm.viewSortKey':
                        this.viewSortKey = this.getViewSortKey();
                        break;
                }
            }, this, this.disposables);
            this.storageService.onWillSaveState(e => {
                this.viewMode = this.getViewMode();
                this.viewSortKey = this.getViewSortKey();
                this.storeTreeViewState();
            }, this, this.disposables);
            this.disposables.add(this.instantiationService.createInstance(ScmInputContentProvider));
            event_1.Event.any(this.scmService.onDidAddRepository, this.scmService.onDidRemoveRepository)(() => this._onDidChangeViewWelcomeState.fire(), this, this.disposables);
            this.disposables.add(this.revealResourceThrottler);
            this.disposables.add(this.updateChildrenThrottler);
        }
        layoutBody(height = this.layoutCache.height, width = this.layoutCache.width) {
            if (height === undefined) {
                return;
            }
            if (width !== undefined) {
                super.layoutBody(height, width);
            }
            this.layoutCache.height = height;
            this.layoutCache.width = width;
            this._onDidLayout.fire();
            this.treeContainer.style.height = `${height}px`;
            this.tree.layout(height, width);
        }
        renderBody(container) {
            super.renderBody(container);
            // Tree
            this.treeContainer = (0, dom_1.append)(container, (0, dom_1.$)('.scm-view.show-file-icons'));
            this.treeContainer.classList.add('file-icon-themable-tree');
            this.treeContainer.classList.add('show-file-icons');
            const updateActionsVisibility = () => this.treeContainer.classList.toggle('show-actions', this.configurationService.getValue('scm.alwaysShowActions'));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowActions'), this.disposables)(updateActionsVisibility, this, this.disposables);
            updateActionsVisibility();
            const updateProviderCountVisibility = () => {
                const value = this.configurationService.getValue('scm.providerCountBadge');
                this.treeContainer.classList.toggle('hide-provider-counts', value === 'hidden');
                this.treeContainer.classList.toggle('auto-provider-counts', value === 'auto');
            };
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.providerCountBadge'), this.disposables)(updateProviderCountVisibility, this, this.disposables);
            updateProviderCountVisibility();
            const viewState = this.loadTreeViewState();
            this.createTree(this.treeContainer, viewState);
            this.onDidChangeBodyVisibility(async (visible) => {
                if (visible) {
                    await this.tree.setInput(this.scmViewService, viewState);
                    event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowRepositories'), this.visibilityDisposables)(() => {
                        this.updateActions();
                        this.updateChildren();
                    }, this, this.visibilityDisposables);
                    event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.inputMinLineCount') ||
                        e.affectsConfiguration('scm.inputMaxLineCount') ||
                        e.affectsConfiguration('scm.showActionButton') ||
                        e.affectsConfiguration('scm.showChangesSummary') ||
                        e.affectsConfiguration('scm.showIncomingChanges') ||
                        e.affectsConfiguration('scm.showOutgoingChanges'), this.visibilityDisposables)(() => this.updateChildren(), this, this.visibilityDisposables);
                    // Add visible repositories
                    this.editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.visibilityDisposables);
                    this.scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.visibilityDisposables);
                    this.onDidChangeVisibleRepositories({ added: this.scmViewService.visibleRepositories, removed: iterator_1.Iterable.empty() });
                    // Restore scroll position
                    if (typeof this.treeScrollTop === 'number') {
                        this.tree.scrollTop = this.treeScrollTop;
                        this.treeScrollTop = undefined;
                    }
                }
                else {
                    this.visibilityDisposables.clear();
                    this.onDidChangeVisibleRepositories({ added: iterator_1.Iterable.empty(), removed: [...this.items.keys()] });
                    this.treeScrollTop = this.tree.scrollTop;
                }
                this.updateRepositoryCollapseAllContextKeys();
            }, this, this.disposables);
            this.disposables.add(this.instantiationService.createInstance(RepositoryVisibilityActionController));
            this.themeService.onDidFileIconThemeChange(this.updateIndentStyles, this, this.disposables);
            this.updateIndentStyles(this.themeService.getFileIconTheme());
        }
        createTree(container, viewState) {
            const overflowWidgetsDomNode = (0, dom_1.$)('.scm-overflow-widgets-container.monaco-editor');
            this.inputRenderer = this.instantiationService.createInstance(InputRenderer, this.layoutCache, overflowWidgetsDomNode, (input, height) => { this.tree.updateElementHeight(input, height); });
            this.actionButtonRenderer = this.instantiationService.createInstance(ActionButtonRenderer);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this.disposables.add(this.listLabels);
            const resourceActionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            resourceActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(resourceActionRunner);
            const historyItemGroupActionRunner = new HistoryItemGroupActionRunner();
            historyItemGroupActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(historyItemGroupActionRunner);
            const historyItemActionRunner = new HistoryItemActionRunner();
            historyItemActionRunner.onWillRun(() => this.tree.domFocus(), this, this.disposables);
            this.disposables.add(historyItemActionRunner);
            const treeDataSource = this.instantiationService.createInstance(SCMTreeDataSource, () => this.viewMode);
            this.disposables.add(treeDataSource);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'SCM Tree Repo', container, new ListDelegate(this.inputRenderer), new SCMTreeCompressionDelegate(), [
                this.inputRenderer,
                this.actionButtonRenderer,
                this.instantiationService.createInstance(scmRepositoryRenderer_1.RepositoryRenderer, actions_1.MenuId.SCMTitle, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(ResourceGroupRenderer, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(ResourceRenderer, () => this.viewMode, this.listLabels, (0, util_1.getActionViewItemProvider)(this.instantiationService), resourceActionRunner),
                this.instantiationService.createInstance(HistoryItemGroupRenderer, historyItemGroupActionRunner),
                this.instantiationService.createInstance(HistoryItemRenderer, historyItemActionRunner, (0, util_1.getActionViewItemProvider)(this.instantiationService)),
                this.instantiationService.createInstance(HistoryItemChangeRenderer, () => this.viewMode, this.listLabels),
                this.instantiationService.createInstance(SeparatorRenderer)
            ], treeDataSource, {
                horizontalScrolling: false,
                setRowLineHeight: false,
                transformOptimization: false,
                filter: new SCMTreeFilter(),
                dnd: new SCMTreeDragAndDrop(this.instantiationService),
                identityProvider: new SCMResourceIdentityProvider(),
                sorter: new SCMTreeSorter(() => this.viewMode, () => this.viewSortKey),
                keyboardNavigationLabelProvider: this.instantiationService.createInstance(SCMTreeKeyboardNavigationLabelProvider, () => this.viewMode),
                overrideStyles: {
                    listBackground: this.viewDescriptorService.getViewLocationById(this.id) === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_BACKGROUND : theme_1.SIDE_BAR_BACKGROUND
                },
                collapseByDefault: (e) => {
                    // Repository, Resource Group, Resource Folder (Tree), History Item Change Folder (Tree)
                    if ((0, util_1.isSCMRepository)(e) || (0, util_1.isSCMResourceGroup)(e) || (0, util_1.isSCMResourceNode)(e) || (0, util_1.isSCMHistoryItemChangeNode)(e)) {
                        return false;
                    }
                    // History Item Group, History Item, or History Item Change
                    return (viewState?.expanded ?? []).indexOf(getSCMResourceId(e)) === -1;
                },
                accessibilityProvider: this.instantiationService.createInstance(SCMAccessibilityProvider)
            });
            this.disposables.add(this.tree);
            this.tree.onDidOpen(this.open, this, this.disposables);
            this.tree.onContextMenu(this.onListContextMenu, this, this.disposables);
            this.tree.onDidScroll(this.inputRenderer.clearValidation, this.inputRenderer, this.disposables);
            event_1.Event.filter(this.tree.onDidChangeCollapseState, e => (0, util_1.isSCMRepository)(e.node.element?.element), this.disposables)(this.updateRepositoryCollapseAllContextKeys, this, this.disposables);
            (0, dom_1.append)(container, overflowWidgetsDomNode);
        }
        async open(e) {
            if (!e.element) {
                return;
            }
            else if ((0, util_1.isSCMRepository)(e.element)) {
                this.scmViewService.focus(e.element);
                return;
            }
            else if ((0, util_1.isSCMInput)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                const widgets = this.inputRenderer.getRenderedInputWidget(e.element);
                if (widgets) {
                    for (const widget of widgets) {
                        widget.focus();
                    }
                    this.tree.setFocus([], e.browserEvent);
                    const selection = this.tree.getSelection();
                    if (selection.length === 1 && selection[0] === e.element) {
                        setTimeout(() => this.tree.setSelection([]));
                    }
                }
                return;
            }
            else if ((0, util_1.isSCMActionButton)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                // Focus the action button
                this.actionButtonRenderer.focusActionButton(e.element);
                this.tree.setFocus([], e.browserEvent);
                return;
            }
            else if ((0, util_1.isSCMResourceGroup)(e.element)) {
                const provider = e.element.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
                return;
            }
            else if ((0, util_1.isSCMResource)(e.element)) {
                if (e.element.command?.id === editorCommands_1.API_OPEN_EDITOR_COMMAND_ID || e.element.command?.id === editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID) {
                    await this.commandService.executeCommand(e.element.command.id, ...(e.element.command.arguments || []), e);
                }
                else {
                    await e.element.open(!!e.editorOptions.preserveFocus);
                    if (e.editorOptions.pinned) {
                        const activeEditorPane = this.editorService.activeEditorPane;
                        activeEditorPane?.group.pinEditor(activeEditorPane.input);
                    }
                }
                const provider = e.element.resourceGroup.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
            }
            else if ((0, util_1.isSCMResourceNode)(e.element)) {
                const provider = e.element.context.provider;
                const repository = iterator_1.Iterable.find(this.scmService.repositories, r => r.provider === provider);
                if (repository) {
                    this.scmViewService.focus(repository);
                }
                return;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(e.element)) {
                this.scmViewService.focus(e.element.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(e.element)) {
                this.scmViewService.focus(e.element.historyItemGroup.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(e.element)) {
                if (e.element.originalUri && e.element.modifiedUri) {
                    await this.commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...(0, util_1.toDiffEditorArguments)(e.element.uri, e.element.originalUri, e.element.modifiedUri), e);
                }
                this.scmViewService.focus(e.element.historyItem.historyItemGroup.repository);
                return;
            }
            else if ((0, util_1.isSCMHistoryItemChangeNode)(e.element)) {
                this.scmViewService.focus(e.element.context.historyItemGroup.repository);
                return;
            }
        }
        onDidActiveEditorChange() {
            if (!this.configurationService.getValue('scm.autoReveal')) {
                return;
            }
            const uri = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (!uri) {
                return;
            }
            // Do not set focus/selection when the resource is already focused and selected
            if (this.tree.getFocus().some(e => (0, util_1.isSCMResource)(e) && this.uriIdentityService.extUri.isEqual(e.sourceUri, uri)) &&
                this.tree.getSelection().some(e => (0, util_1.isSCMResource)(e) && this.uriIdentityService.extUri.isEqual(e.sourceUri, uri))) {
                return;
            }
            this.revealResourceThrottler.queue(() => this.treeOperationSequencer.queue(async () => {
                for (const repository of this.scmViewService.visibleRepositories) {
                    const item = this.items.get(repository);
                    if (!item) {
                        continue;
                    }
                    // go backwards from last group
                    for (let j = repository.provider.groups.length - 1; j >= 0; j--) {
                        const groupItem = repository.provider.groups[j];
                        const resource = this.viewMode === "tree" /* ViewMode.Tree */
                            ? groupItem.resourceTree.getNode(uri)?.element
                            : groupItem.resources.find(r => this.uriIdentityService.extUri.isEqual(r.sourceUri, uri));
                        if (resource) {
                            await this.tree.expandTo(resource);
                            this.tree.setSelection([resource]);
                            this.tree.setFocus([resource]);
                            return;
                        }
                    }
                }
            }));
        }
        onDidChangeVisibleRepositories({ added, removed }) {
            // Added repositories
            for (const repository of added) {
                const repositoryDisposables = new lifecycle_1.DisposableStore();
                repositoryDisposables.add(repository.provider.onDidChange(() => this.updateChildren(repository)));
                repositoryDisposables.add(repository.input.onDidChangeVisibility(() => this.updateChildren(repository)));
                repositoryDisposables.add(repository.provider.onDidChangeResourceGroups(() => this.updateChildren(repository)));
                repositoryDisposables.add(event_1.Event.runAndSubscribe(repository.provider.onDidChangeHistoryProvider, () => {
                    if (!repository.provider.historyProvider) {
                        this.logService.debug('SCMViewPane:onDidChangeVisibleRepositories - no history provider present');
                        return;
                    }
                    repositoryDisposables.add(repository.provider.historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                        this.updateChildren(repository);
                        this.logService.debug('SCMViewPane:onDidChangeCurrentHistoryItemGroup - update children');
                    }));
                    this.logService.debug('SCMViewPane:onDidChangeVisibleRepositories - onDidChangeCurrentHistoryItemGroup listener added');
                }));
                const resourceGroupDisposables = repositoryDisposables.add(new lifecycle_1.DisposableMap());
                const onDidChangeResourceGroups = () => {
                    for (const [resourceGroup] of resourceGroupDisposables) {
                        if (!repository.provider.groups.includes(resourceGroup)) {
                            resourceGroupDisposables.deleteAndDispose(resourceGroup);
                        }
                    }
                    for (const resourceGroup of repository.provider.groups) {
                        if (!resourceGroupDisposables.has(resourceGroup)) {
                            const disposableStore = new lifecycle_1.DisposableStore();
                            disposableStore.add(resourceGroup.onDidChange(() => this.updateChildren(repository)));
                            disposableStore.add(resourceGroup.onDidChangeResources(() => this.updateChildren(repository)));
                            resourceGroupDisposables.set(resourceGroup, disposableStore);
                        }
                    }
                };
                repositoryDisposables.add(repository.provider.onDidChangeResourceGroups(onDidChangeResourceGroups));
                onDidChangeResourceGroups();
                this.items.set(repository, repositoryDisposables);
            }
            // Removed repositories
            for (const repository of removed) {
                this.items.deleteAndDispose(repository);
            }
            this.updateChildren();
            this.onDidActiveEditorChange();
        }
        onListContextMenu(e) {
            if (!e.element) {
                const menu = this.menuService.createMenu(Menus.ViewSort, this.contextKeyService);
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, actions);
                return this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    onHide: () => {
                        menu.dispose();
                    }
                });
            }
            const element = e.element;
            let context = element;
            let actions = [];
            let actionRunner = new RepositoryPaneActionRunner(() => this.getSelectedResources());
            if ((0, util_1.isSCMRepository)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.provider);
                const menu = menus.repositoryContextMenu;
                context = element.provider;
                actionRunner = new scmRepositoryRenderer_1.RepositoryActionRunner(() => this.getSelectedRepositories());
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMInput)(element) || (0, util_1.isSCMActionButton)(element)) {
                // noop
            }
            else if ((0, util_1.isSCMResourceGroup)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.provider);
                const menu = menus.getResourceGroupMenu(element);
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMResource)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.resourceGroup.provider);
                const menu = menus.getResourceMenu(element);
                actions = (0, util_1.collectContextMenuActions)(menu);
            }
            else if ((0, util_1.isSCMResourceNode)(element)) {
                if (element.element) {
                    const menus = this.scmViewService.menus.getRepositoryMenus(element.element.resourceGroup.provider);
                    const menu = menus.getResourceMenu(element.element);
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
                else {
                    const menus = this.scmViewService.menus.getRepositoryMenus(element.context.provider);
                    const menu = menus.getResourceFolderMenu(element.context);
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.repository.provider);
                const menu = menus.historyProviderMenu?.getHistoryItemGroupContextMenu(element);
                if (menu) {
                    actionRunner = new HistoryItemGroupActionRunner();
                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, actions);
                }
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(element)) {
                const menus = this.scmViewService.menus.getRepositoryMenus(element.historyItemGroup.repository.provider);
                const menu = menus.historyProviderMenu?.getHistoryItemMenu(element);
                if (menu) {
                    actionRunner = new HistoryItemActionRunner();
                    actions = (0, util_1.collectContextMenuActions)(menu);
                }
            }
            actionRunner.onWillRun(() => this.tree.domFocus());
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => context,
                actionRunner
            });
        }
        getSelectedRepositories() {
            const focusedRepositories = this.tree.getFocus().filter(r => !!r && (0, util_1.isSCMRepository)(r));
            const selectedRepositories = this.tree.getSelection().filter(r => !!r && (0, util_1.isSCMRepository)(r));
            return Array.from(new Set([...focusedRepositories, ...selectedRepositories]));
        }
        getSelectedResources() {
            return this.tree.getSelection()
                .filter(r => !!r && !(0, util_1.isSCMResourceGroup)(r));
        }
        getViewMode() {
            let mode = this.configurationService.getValue('scm.defaultViewMode') === 'list' ? "list" /* ViewMode.List */ : "tree" /* ViewMode.Tree */;
            const storageMode = this.storageService.get(`scm.viewMode`, 1 /* StorageScope.WORKSPACE */);
            if (typeof storageMode === 'string') {
                mode = storageMode;
            }
            return mode;
        }
        getViewSortKey() {
            // Tree
            if (this._viewMode === "tree" /* ViewMode.Tree */) {
                return "path" /* ViewSortKey.Path */;
            }
            // List
            let viewSortKey;
            const viewSortKeyString = this.configurationService.getValue('scm.defaultViewSortKey');
            switch (viewSortKeyString) {
                case 'name':
                    viewSortKey = "name" /* ViewSortKey.Name */;
                    break;
                case 'status':
                    viewSortKey = "status" /* ViewSortKey.Status */;
                    break;
                default:
                    viewSortKey = "path" /* ViewSortKey.Path */;
                    break;
            }
            const storageSortKey = this.storageService.get(`scm.viewSortKey`, 1 /* StorageScope.WORKSPACE */);
            if (typeof storageSortKey === 'string') {
                viewSortKey = storageSortKey;
            }
            return viewSortKey;
        }
        loadTreeViewState() {
            const storageViewState = this.storageService.get('scm.viewState2', 1 /* StorageScope.WORKSPACE */);
            if (!storageViewState) {
                return undefined;
            }
            try {
                const treeViewState = JSON.parse(storageViewState);
                return treeViewState;
            }
            catch {
                return undefined;
            }
        }
        storeTreeViewState() {
            if (this.tree) {
                this.storageService.store('scm.viewState2', JSON.stringify(this.tree.getViewState()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        updateChildren(element) {
            this.updateChildrenThrottler.queue(() => this.treeOperationSequencer.queue(async () => {
                const focusedInput = this.inputRenderer.getFocusedInput();
                if (element && this.tree.hasNode(element)) {
                    // Refresh specific repository
                    await this.tree.updateChildren(element);
                }
                else {
                    // Refresh the entire tree
                    await this.tree.updateChildren(undefined);
                }
                if (focusedInput) {
                    this.inputRenderer.getRenderedInputWidget(focusedInput)?.forEach(widget => widget.focus());
                }
                this.updateScmProviderContextKeys();
                this.updateRepositoryCollapseAllContextKeys();
            }));
        }
        updateIndentStyles(theme) {
            this.treeContainer.classList.toggle('list-view-mode', this.viewMode === "list" /* ViewMode.List */);
            this.treeContainer.classList.toggle('tree-view-mode', this.viewMode === "tree" /* ViewMode.Tree */);
            this.treeContainer.classList.toggle('align-icons-and-twisties', (this.viewMode === "list" /* ViewMode.List */ && theme.hasFileIcons) || (theme.hasFileIcons && !theme.hasFolderIcons));
            this.treeContainer.classList.toggle('hide-arrows', this.viewMode === "tree" /* ViewMode.Tree */ && theme.hidesExplorerArrows === true);
        }
        updateScmProviderContextKeys() {
            const alwaysShowRepositories = this.configurationService.getValue('scm.alwaysShowRepositories');
            if (!alwaysShowRepositories && this.items.size === 1) {
                const provider = iterator_1.Iterable.first(this.items.keys()).provider;
                this.scmProviderContextKey.set(provider.contextValue);
                this.scmProviderRootUriContextKey.set(provider.rootUri?.toString());
                this.scmProviderHasRootUriContextKey.set(!!provider.rootUri);
            }
            else {
                this.scmProviderContextKey.set(undefined);
                this.scmProviderRootUriContextKey.set(undefined);
                this.scmProviderHasRootUriContextKey.set(false);
            }
        }
        updateRepositoryCollapseAllContextKeys() {
            if (!this.isBodyVisible() || this.items.size === 1) {
                this.isAnyRepositoryCollapsibleContextKey.set(false);
                this.areAllRepositoriesCollapsedContextKey.set(false);
                return;
            }
            this.isAnyRepositoryCollapsibleContextKey.set(this.scmViewService.visibleRepositories.some(r => this.tree.hasElement(r) && this.tree.isCollapsible(r)));
            this.areAllRepositoriesCollapsedContextKey.set(this.scmViewService.visibleRepositories.every(r => this.tree.hasElement(r) && (!this.tree.isCollapsible(r) || this.tree.isCollapsed(r))));
        }
        collapseAllRepositories() {
            for (const repository of this.scmViewService.visibleRepositories) {
                if (this.tree.isCollapsible(repository)) {
                    this.tree.collapse(repository);
                }
            }
        }
        expandAllRepositories() {
            for (const repository of this.scmViewService.visibleRepositories) {
                if (this.tree.isCollapsible(repository)) {
                    this.tree.expand(repository);
                }
            }
        }
        shouldShowWelcome() {
            return this.scmService.repositoryCount === 0;
        }
        getActionsContext() {
            return this.scmViewService.visibleRepositories.length === 1 ? this.scmViewService.visibleRepositories[0].provider : undefined;
        }
        focus() {
            super.focus();
            if (this.isExpanded()) {
                if (this.tree.getFocus().length === 0) {
                    for (const repository of this.scmViewService.visibleRepositories) {
                        const widgets = this.inputRenderer.getRenderedInputWidget(repository.input);
                        if (widgets) {
                            for (const widget of widgets) {
                                widget.focus();
                            }
                            return;
                        }
                    }
                }
                this.tree.domFocus();
            }
        }
        dispose() {
            this.visibilityDisposables.dispose();
            this.disposables.dispose();
            this.items.dispose();
            super.dispose();
        }
    };
    exports.SCMViewPane = SCMViewPane;
    exports.SCMViewPane = SCMViewPane = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, editorService_1.IEditorService),
        __param(3, log_1.ILogService),
        __param(4, actions_1.IMenuService),
        __param(5, scm_1.ISCMService),
        __param(6, scm_1.ISCMViewService),
        __param(7, storage_1.IStorageService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, themeService_1.IThemeService),
        __param(11, contextView_1.IContextMenuService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, views_1.IViewDescriptorService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, opener_1.IOpenerService),
        __param(17, telemetry_1.ITelemetryService)
    ], SCMViewPane);
    let SCMTreeDataSource = class SCMTreeDataSource {
        constructor(viewMode, configurationService, logService, scmViewService, uriIdentityService) {
            this.viewMode = viewMode;
            this.configurationService = configurationService;
            this.logService = logService;
            this.scmViewService = scmViewService;
            this.uriIdentityService = uriIdentityService;
            this.historyProviderCache = new Map();
            this.repositoryDisposables = new lifecycle_1.DisposableMap();
            this.disposables = new lifecycle_1.DisposableStore();
            const onDidChangeConfiguration = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.showChangesSummary'), this.disposables);
            this.disposables.add(onDidChangeConfiguration(() => this.historyProviderCache.clear()));
            this.scmViewService.onDidChangeVisibleRepositories(this.onDidChangeVisibleRepositories, this, this.disposables);
            this.onDidChangeVisibleRepositories({ added: this.scmViewService.visibleRepositories, removed: iterator_1.Iterable.empty() });
        }
        hasChildren(inputOrElement) {
            if ((0, util_1.isSCMViewService)(inputOrElement)) {
                return this.scmViewService.visibleRepositories.length !== 0;
            }
            else if ((0, util_1.isSCMRepository)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMInput)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMActionButton)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMResourceGroup)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMResource)(inputOrElement)) {
                return false;
            }
            else if (resourceTree_1.ResourceTree.isResourceNode(inputOrElement)) {
                return inputOrElement.childrenCount > 0;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(inputOrElement)) {
                return true;
            }
            else if ((0, util_1.isSCMHistoryItemChangeTreeElement)(inputOrElement)) {
                return false;
            }
            else if ((0, util_1.isSCMViewSeparator)(inputOrElement)) {
                return false;
            }
            else {
                throw new Error('hasChildren not implemented.');
            }
        }
        async getChildren(inputOrElement) {
            const { alwaysShowRepositories, showActionButton } = this.getConfiguration();
            const repositoryCount = this.scmViewService.visibleRepositories.length;
            if ((0, util_1.isSCMViewService)(inputOrElement) && (repositoryCount > 1 || alwaysShowRepositories)) {
                return this.scmViewService.visibleRepositories;
            }
            else if (((0, util_1.isSCMViewService)(inputOrElement) && repositoryCount === 1 && !alwaysShowRepositories) || (0, util_1.isSCMRepository)(inputOrElement)) {
                const children = [];
                inputOrElement = (0, util_1.isSCMRepository)(inputOrElement) ? inputOrElement : this.scmViewService.visibleRepositories[0];
                const actionButton = inputOrElement.provider.actionButton;
                const resourceGroups = inputOrElement.provider.groups;
                // SCM Input
                if (inputOrElement.input.visible) {
                    children.push(inputOrElement.input);
                }
                // Action Button
                if (showActionButton && actionButton) {
                    children.push({
                        type: 'actionButton',
                        repository: inputOrElement,
                        button: actionButton
                    });
                }
                // ResourceGroups
                const hasSomeChanges = resourceGroups.some(group => group.resources.length > 0);
                if (hasSomeChanges || (repositoryCount === 1 && (!showActionButton || !actionButton))) {
                    children.push(...resourceGroups);
                }
                // History item groups
                const historyItemGroups = await this.getHistoryItemGroups(inputOrElement);
                // Incoming/Outgoing Separator
                if (historyItemGroups.length > 0) {
                    let label = (0, nls_1.localize)('syncSeparatorHeader', "Incoming/Outgoing");
                    let ariaLabel = (0, nls_1.localize)('syncSeparatorHeaderAriaLabel', "Incoming and outgoing changes");
                    const incomingHistoryItems = historyItemGroups.find(g => g.direction === 'incoming');
                    const outgoingHistoryItems = historyItemGroups.find(g => g.direction === 'outgoing');
                    if (incomingHistoryItems && !outgoingHistoryItems) {
                        label = (0, nls_1.localize)('syncIncomingSeparatorHeader', "Incoming");
                        ariaLabel = (0, nls_1.localize)('syncIncomingSeparatorHeaderAriaLabel', "Incoming changes");
                    }
                    else if (!incomingHistoryItems && outgoingHistoryItems) {
                        label = (0, nls_1.localize)('syncOutgoingSeparatorHeader', "Outgoing");
                        ariaLabel = (0, nls_1.localize)('syncOutgoingSeparatorHeaderAriaLabel', "Outgoing changes");
                    }
                    children.push({ label, ariaLabel, repository: inputOrElement, type: 'separator' });
                }
                children.push(...historyItemGroups);
                return children;
            }
            else if ((0, util_1.isSCMResourceGroup)(inputOrElement)) {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    // Resources (List)
                    return inputOrElement.resources;
                }
                else if (this.viewMode() === "tree" /* ViewMode.Tree */) {
                    // Resources (Tree)
                    const children = [];
                    for (const node of inputOrElement.resourceTree.root.children) {
                        children.push(node.element && node.childrenCount === 0 ? node.element : node);
                    }
                    return children;
                }
            }
            else if ((0, util_1.isSCMResourceNode)(inputOrElement) || (0, util_1.isSCMHistoryItemChangeNode)(inputOrElement)) {
                // Resources (Tree), History item changes (Tree)
                const children = [];
                for (const node of inputOrElement.children) {
                    children.push(node.element && node.childrenCount === 0 ? node.element : node);
                }
                return children;
            }
            else if ((0, util_1.isSCMHistoryItemGroupTreeElement)(inputOrElement)) {
                // History item group
                return this.getHistoryItems(inputOrElement);
            }
            else if ((0, util_1.isSCMHistoryItemTreeElement)(inputOrElement)) {
                // History item changes (List/Tree)
                return this.getHistoryItemChanges(inputOrElement);
            }
            return [];
        }
        async getHistoryItemGroups(element) {
            const { showIncomingChanges, showOutgoingChanges } = this.getConfiguration();
            const scmProvider = element.provider;
            const historyProvider = scmProvider.historyProvider;
            const currentHistoryItemGroup = historyProvider?.currentHistoryItemGroup;
            if (!historyProvider || !currentHistoryItemGroup || (showIncomingChanges === 'never' && showOutgoingChanges === 'never')) {
                return [];
            }
            const children = [];
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(element);
            let incomingHistoryItemGroup = historyProviderCacheEntry?.incomingHistoryItemGroup;
            let outgoingHistoryItemGroup = historyProviderCacheEntry?.outgoingHistoryItemGroup;
            if (!incomingHistoryItemGroup && !outgoingHistoryItemGroup) {
                // Common ancestor, ahead, behind
                const ancestor = await historyProvider.resolveHistoryItemGroupCommonAncestor(currentHistoryItemGroup.id, currentHistoryItemGroup.base?.id);
                if (!ancestor) {
                    return [];
                }
                // Only show "Incoming" node if there is a base branch
                incomingHistoryItemGroup = currentHistoryItemGroup.base ? {
                    id: currentHistoryItemGroup.base.id,
                    label: currentHistoryItemGroup.base.label,
                    ariaLabel: (0, nls_1.localize)('incomingChangesAriaLabel', "Incoming changes from {0}", currentHistoryItemGroup.base.label),
                    icon: codicons_1.Codicon.arrowCircleDown,
                    direction: 'incoming',
                    ancestor: ancestor.id,
                    count: ancestor.behind,
                    repository: element,
                    type: 'historyItemGroup'
                } : undefined;
                outgoingHistoryItemGroup = {
                    id: currentHistoryItemGroup.id,
                    label: currentHistoryItemGroup.label,
                    ariaLabel: (0, nls_1.localize)('outgoingChangesAriaLabel', "Outgoing changes to {0}", currentHistoryItemGroup.label),
                    icon: codicons_1.Codicon.arrowCircleUp,
                    direction: 'outgoing',
                    ancestor: ancestor.id,
                    count: ancestor.ahead,
                    repository: element,
                    type: 'historyItemGroup'
                };
                this.historyProviderCache.set(element, {
                    ...historyProviderCacheEntry,
                    incomingHistoryItemGroup,
                    outgoingHistoryItemGroup
                });
            }
            // Incoming
            if (incomingHistoryItemGroup &&
                (showIncomingChanges === 'always' ||
                    (showIncomingChanges === 'auto' && (incomingHistoryItemGroup.count ?? 0) > 0))) {
                children.push(incomingHistoryItemGroup);
            }
            // Outgoing
            if (outgoingHistoryItemGroup &&
                (showOutgoingChanges === 'always' ||
                    (showOutgoingChanges === 'auto' && (outgoingHistoryItemGroup.count ?? 0) > 0))) {
                children.push(outgoingHistoryItemGroup);
            }
            return children;
        }
        async getHistoryItems(element) {
            const repository = element.repository;
            const historyProvider = repository.provider.historyProvider;
            if (!historyProvider) {
                return [];
            }
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(repository);
            const historyItemsMap = historyProviderCacheEntry.historyItems;
            let historyItemsElement = historyProviderCacheEntry.historyItems.get(element.id);
            if (!historyItemsElement) {
                const historyItems = await historyProvider.provideHistoryItems(element.id, { limit: { id: element.ancestor } }) ?? [];
                // All Changes
                const { showChangesSummary } = this.getConfiguration();
                const allChanges = showChangesSummary && historyItems.length >= 2 ?
                    await historyProvider.provideHistoryItemSummary(historyItems[0].id, element.ancestor) : undefined;
                historyItemsElement = [allChanges, historyItems];
                this.historyProviderCache.set(repository, {
                    ...historyProviderCacheEntry,
                    historyItems: historyItemsMap.set(element.id, historyItemsElement)
                });
            }
            const children = [];
            if (historyItemsElement[0]) {
                children.push({
                    ...historyItemsElement[0],
                    icon: historyItemsElement[0].icon ?? codicons_1.Codicon.files,
                    label: (0, nls_1.localize)('allChanges', "All Changes"),
                    historyItemGroup: element,
                    type: 'allChanges'
                });
            }
            children.push(...historyItemsElement[1]
                .map(historyItem => ({
                ...historyItem,
                historyItemGroup: element,
                type: 'historyItem'
            })));
            return children;
        }
        async getHistoryItemChanges(element) {
            const repository = element.historyItemGroup.repository;
            const historyProvider = repository.provider.historyProvider;
            if (!historyProvider) {
                return [];
            }
            const historyProviderCacheEntry = this.getHistoryProviderCacheEntry(repository);
            const historyItemChangesMap = historyProviderCacheEntry.historyItemChanges;
            const historyItemParentId = element.parentIds.length > 0 ? element.parentIds[0] : undefined;
            let historyItemChanges = historyItemChangesMap.get(`${element.id}/${historyItemParentId}`);
            if (!historyItemChanges) {
                const historyItemParentId = element.parentIds.length > 0 ? element.parentIds[0] : undefined;
                historyItemChanges = await historyProvider.provideHistoryItemChanges(element.id, historyItemParentId) ?? [];
                this.historyProviderCache.set(repository, {
                    ...historyProviderCacheEntry,
                    historyItemChanges: historyItemChangesMap.set(`${element.id}/${historyItemParentId}`, historyItemChanges)
                });
            }
            if (this.viewMode() === "list" /* ViewMode.List */) {
                // List
                return historyItemChanges.map(change => ({
                    ...change,
                    historyItem: element,
                    type: 'historyItemChange'
                }));
            }
            // Tree
            const tree = new resourceTree_1.ResourceTree(element, repository.provider.rootUri ?? uri_1.URI.file('/'), this.uriIdentityService.extUri);
            for (const change of historyItemChanges) {
                tree.add(change.uri, {
                    ...change,
                    historyItem: element,
                    type: 'historyItemChange'
                });
            }
            const children = [];
            for (const node of tree.root.children) {
                children.push(node.element ?? node);
            }
            return children;
        }
        getParent(element) {
            if ((0, util_1.isSCMResourceNode)(element)) {
                if (element.parent === element.context.resourceTree.root) {
                    return element.context;
                }
                else if (element.parent) {
                    return element.parent;
                }
                else {
                    throw new Error('Invalid element passed to getParent');
                }
            }
            else if ((0, util_1.isSCMResource)(element)) {
                if (this.viewMode() === "list" /* ViewMode.List */) {
                    return element.resourceGroup;
                }
                const node = element.resourceGroup.resourceTree.getNode(element.sourceUri);
                const result = node?.parent;
                if (!result) {
                    throw new Error('Invalid element passed to getParent');
                }
                if (result === element.resourceGroup.resourceTree.root) {
                    return element.resourceGroup;
                }
                return result;
            }
            else {
                throw new Error('Unexpected call to getParent');
            }
        }
        getConfiguration() {
            return {
                alwaysShowRepositories: this.configurationService.getValue('scm.alwaysShowRepositories'),
                showActionButton: this.configurationService.getValue('scm.showActionButton'),
                showChangesSummary: this.configurationService.getValue('scm.showChangesSummary'),
                showIncomingChanges: this.configurationService.getValue('scm.showIncomingChanges'),
                showOutgoingChanges: this.configurationService.getValue('scm.showOutgoingChanges')
            };
        }
        onDidChangeVisibleRepositories({ added, removed }) {
            // Added repositories
            for (const repository of added) {
                const repositoryDisposables = new lifecycle_1.DisposableStore();
                repositoryDisposables.add(event_1.Event.runAndSubscribe(repository.provider.onDidChangeHistoryProvider, () => {
                    if (!repository.provider.historyProvider) {
                        this.logService.debug('SCMTreeDataSource:onDidChangeVisibleRepositories - no history provider present');
                        return;
                    }
                    repositoryDisposables.add(repository.provider.historyProvider.onDidChangeCurrentHistoryItemGroup(() => {
                        this.historyProviderCache.delete(repository);
                        this.logService.debug('SCMTreeDataSource:onDidChangeCurrentHistoryItemGroup - cache cleared');
                    }));
                    this.logService.debug('SCMTreeDataSource:onDidChangeVisibleRepositories - onDidChangeCurrentHistoryItemGroup listener added');
                }));
                this.repositoryDisposables.set(repository, repositoryDisposables);
            }
            // Removed repositories
            for (const repository of removed) {
                this.repositoryDisposables.deleteAndDispose(repository);
                this.historyProviderCache.delete(repository);
            }
        }
        getHistoryProviderCacheEntry(repository) {
            return this.historyProviderCache.get(repository) ?? {
                incomingHistoryItemGroup: undefined,
                outgoingHistoryItemGroup: undefined,
                historyItems: new Map(),
                historyItemChanges: new Map()
            };
        }
        dispose() {
            this.repositoryDisposables.dispose();
            this.disposables.dispose();
        }
    };
    SCMTreeDataSource = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, scm_1.ISCMViewService),
        __param(4, uriIdentity_1.IUriIdentityService)
    ], SCMTreeDataSource);
    class SCMActionButton {
        constructor(container, contextMenuService, commandService, notificationService) {
            this.container = container;
            this.contextMenuService = contextMenuService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.disposables = new lifecycle_1.MutableDisposable();
        }
        dispose() {
            this.disposables?.dispose();
        }
        setButton(button) {
            // Clear old button
            this.clear();
            if (!button) {
                return;
            }
            if (button.secondaryCommands?.length) {
                const actions = [];
                for (let index = 0; index < button.secondaryCommands.length; index++) {
                    const commands = button.secondaryCommands[index];
                    for (const command of commands) {
                        actions.push(new actions_2.Action(command.id, command.title, undefined, true, async () => await this.executeCommand(command.id, ...(command.arguments || []))));
                    }
                    if (commands.length) {
                        actions.push(new actions_2.Separator());
                    }
                }
                // Remove last separator
                actions.pop();
                // ButtonWithDropdown
                this.button = new button_1.ButtonWithDropdown(this.container, {
                    actions: actions,
                    addPrimaryActionToDropdown: false,
                    contextMenuProvider: this.contextMenuService,
                    title: button.command.tooltip,
                    supportIcons: true,
                    ...defaultStyles_1.defaultButtonStyles
                });
            }
            else {
                // Button
                this.button = new button_1.Button(this.container, { supportIcons: true, supportShortLabel: !!button.description, title: button.command.tooltip, ...defaultStyles_1.defaultButtonStyles });
            }
            this.button.enabled = button.enabled;
            this.button.label = button.command.title;
            if (this.button instanceof button_1.Button && button.description) {
                this.button.labelShort = button.description;
            }
            this.button.onDidClick(async () => await this.executeCommand(button.command.id, ...(button.command.arguments || [])), null, this.disposables.value);
            this.disposables.value.add(this.button);
        }
        focus() {
            this.button?.focus();
        }
        clear() {
            this.disposables.value = new lifecycle_1.DisposableStore();
            this.button = undefined;
            (0, dom_1.clearNode)(this.container);
        }
        async executeCommand(commandId, ...args) {
            try {
                await this.commandService.executeCommand(commandId, ...args);
            }
            catch (ex) {
                this.notificationService.error(ex);
            }
        }
    }
    exports.SCMActionButton = SCMActionButton;
    let ScmInputContentProvider = class ScmInputContentProvider extends lifecycle_1.Disposable {
        constructor(textModelService, _modelService, _languageService) {
            super();
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._register(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeSourceControl, this));
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            return this._modelService.createModel('', this._languageService.createById('scminput'), resource);
        }
    };
    ScmInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], ScmInputContentProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtVmlld1BhbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL3NjbVZpZXdQYW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEySGhHLElBQUEsNkJBQWEsRUFBQyxvQ0FBb0MsRUFBRTtRQUNuRCxJQUFJLEVBQUUsdUNBQXVDO1FBQzdDLEtBQUssRUFBRSx1Q0FBdUM7UUFDOUMsTUFBTSxFQUFFLHVDQUF1QztRQUMvQyxPQUFPLEVBQUUsdUNBQXVDO0tBQ2hELEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsMENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBRS9GLElBQUEsNkJBQWEsRUFBQyxvQ0FBb0MsRUFBRTtRQUNuRCxJQUFJLEVBQUUseUNBQXlDO1FBQy9DLEtBQUssRUFBRSx5Q0FBeUM7UUFDaEQsTUFBTSxFQUFFLHlDQUF5QztRQUNqRCxPQUFPLEVBQUUseUNBQXlDO0tBQ2xELEVBQUUsSUFBQSxjQUFRLEVBQUMsb0NBQW9DLEVBQUUsMENBQTBDLENBQUMsQ0FBQyxDQUFDO0lBRS9GLElBQUEsNkJBQWEsRUFBQyxpQ0FBaUMsRUFBRTtRQUNoRCxJQUFJLEVBQUUsSUFBQSwyQkFBVyxFQUFDLDBCQUFVLEVBQUUsR0FBRyxDQUFDO1FBQ2xDLEtBQUssRUFBRSxJQUFBLDJCQUFXLEVBQUMsMEJBQVUsRUFBRSxHQUFHLENBQUM7UUFDbkMsTUFBTSxFQUFFLElBQUEsMkJBQVcsRUFBQywwQkFBVSxFQUFFLEdBQUcsQ0FBQztRQUNwQyxPQUFPLEVBQUUsSUFBQSwyQkFBVyxFQUFDLDBCQUFVLEVBQUUsR0FBRyxDQUFDO0tBQ3JDLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsdUNBQXVDLENBQUMsQ0FBQyxDQUFD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