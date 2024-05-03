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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/glob", "vs/platform/progress/common/progress", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/base/common/resources", "vs/base/browser/ui/inputbox/inputBox", "vs/nls", "vs/base/common/functional", "vs/base/common/objects", "vs/base/common/path", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/comparers", "vs/platform/dnd/browser/dnd", "vs/workbench/browser/dnd", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dnd", "vs/base/common/network", "vs/base/browser/ui/list/listView", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/browser/fileActions", "vs/base/common/filters", "vs/base/common/event", "vs/platform/label/common/label", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/fileImportExport", "vs/base/common/errorMessage", "vs/platform/files/browser/webFileSystemAccess", "vs/workbench/services/search/common/ignoreFile", "vs/base/common/map", "vs/base/common/ternarySearchTree", "vs/platform/theme/browser/defaultStyles", "vs/base/common/async", "vs/platform/hover/browser/hover", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/browser/window", "vs/workbench/contrib/files/browser/explorerFileContrib"], function (require, exports, DOM, glob, progress_1, notification_1, files_1, layoutService_1, workspace_1, lifecycle_1, contextView_1, themeService_1, configuration_1, resources_1, inputBox_1, nls_1, functional_1, objects_1, path, explorerModel_1, comparers_1, dnd_1, dnd_2, instantiation_1, dnd_3, network_1, listView_1, platform_1, dialogs_1, workspaceEditing_1, editorService_1, fileActions_1, filters_1, event_1, label_1, types_1, uriIdentity_1, bulkEditService_1, files_2, fileImportExport_1, errorMessage_1, webFileSystemAccess_1, ignoreFile_1, map_1, ternarySearchTree_1, defaultStyles_1, async_1, hover_1, filesConfigurationService_1, window_1, explorerFileContrib_1) {
    "use strict";
    var FilesRenderer_1, FileDragAndDrop_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExplorerCompressionDelegate = exports.FileDragAndDrop = exports.FileSorter = exports.FilesFilter = exports.FilesRenderer = exports.CompressedNavigationController = exports.ExplorerDataSource = exports.explorerRootErrorEmitter = exports.ExplorerDelegate = void 0;
    exports.isCompressedFolderName = isCompressedFolderName;
    class ExplorerDelegate {
        static { this.ITEM_HEIGHT = 22; }
        getHeight(element) {
            return ExplorerDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return FilesRenderer.ID;
        }
    }
    exports.ExplorerDelegate = ExplorerDelegate;
    exports.explorerRootErrorEmitter = new event_1.Emitter();
    let ExplorerDataSource = class ExplorerDataSource {
        constructor(fileFilter, progressService, configService, notificationService, layoutService, fileService, explorerService, contextService, filesConfigService) {
            this.fileFilter = fileFilter;
            this.progressService = progressService;
            this.configService = configService;
            this.notificationService = notificationService;
            this.layoutService = layoutService;
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.contextService = contextService;
            this.filesConfigService = filesConfigService;
        }
        hasChildren(element) {
            // don't render nest parents as containing children when all the children are filtered out
            return Array.isArray(element) || element.hasChildren((stat) => this.fileFilter.filter(stat, 1 /* TreeVisibility.Visible */));
        }
        getChildren(element) {
            if (Array.isArray(element)) {
                return element;
            }
            const hasError = element.error;
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const children = element.fetchChildren(sortOrder);
            if (Array.isArray(children)) {
                // fast path when children are known sync (i.e. nested children)
                return children;
            }
            const promise = children.then(children => {
                // Clear previous error decoration on root folder
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot && !element.error && hasError && this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */) {
                    exports.explorerRootErrorEmitter.fire(element.resource);
                }
                return children;
            }, e => {
                if (element instanceof explorerModel_1.ExplorerItem && element.isRoot) {
                    if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                        // Single folder create a dummy explorer item to show error
                        const placeholder = new explorerModel_1.ExplorerItem(element.resource, this.fileService, this.configService, this.filesConfigService, undefined, undefined, false);
                        placeholder.error = e;
                        return [placeholder];
                    }
                    else {
                        exports.explorerRootErrorEmitter.fire(element.resource);
                    }
                }
                else {
                    // Do not show error for roots since we already use an explorer decoration to notify user
                    this.notificationService.error(e);
                }
                return []; // we could not resolve any children because of an error
            });
            this.progressService.withProgress({
                location: 1 /* ProgressLocation.Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1500 // reduce progress visibility when still restoring
            }, _progress => promise);
            return promise;
        }
    };
    exports.ExplorerDataSource = ExplorerDataSource;
    exports.ExplorerDataSource = ExplorerDataSource = __decorate([
        __param(1, progress_1.IProgressService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, files_1.IFileService),
        __param(6, files_2.IExplorerService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, filesConfigurationService_1.IFilesConfigurationService)
    ], ExplorerDataSource);
    class CompressedNavigationController {
        static { this.ID = 0; }
        get index() { return this._index; }
        get count() { return this.items.length; }
        get current() { return this.items[this._index]; }
        get currentId() { return `${this.id}_${this.index}`; }
        get labels() { return this._labels; }
        constructor(id, items, templateData, depth, collapsed) {
            this.id = id;
            this.items = items;
            this.depth = depth;
            this.collapsed = collapsed;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._index = items.length - 1;
            this.updateLabels(templateData);
            this._updateLabelDisposable = templateData.label.onDidRender(() => this.updateLabels(templateData));
        }
        updateLabels(templateData) {
            this._labels = Array.from(templateData.container.querySelectorAll('.label-name'));
            let parents = '';
            for (let i = 0; i < this.labels.length; i++) {
                const ariaLabel = parents.length ? `${this.items[i].name}, compact, ${parents}` : this.items[i].name;
                this.labels[i].setAttribute('aria-label', ariaLabel);
                this.labels[i].setAttribute('aria-level', `${this.depth + i}`);
                parents = parents.length ? `${this.items[i].name} ${parents}` : this.items[i].name;
            }
            this.updateCollapsed(this.collapsed);
            if (this._index < this.labels.length) {
                this.labels[this._index].classList.add('active');
            }
        }
        previous() {
            if (this._index <= 0) {
                return;
            }
            this.setIndex(this._index - 1);
        }
        next() {
            if (this._index >= this.items.length - 1) {
                return;
            }
            this.setIndex(this._index + 1);
        }
        first() {
            if (this._index === 0) {
                return;
            }
            this.setIndex(0);
        }
        last() {
            if (this._index === this.items.length - 1) {
                return;
            }
            this.setIndex(this.items.length - 1);
        }
        setIndex(index) {
            if (index < 0 || index >= this.items.length) {
                return;
            }
            this.labels[this._index].classList.remove('active');
            this._index = index;
            this.labels[this._index].classList.add('active');
            this._onDidChange.fire();
        }
        updateCollapsed(collapsed) {
            this.collapsed = collapsed;
            for (let i = 0; i < this.labels.length; i++) {
                this.labels[i].setAttribute('aria-expanded', collapsed ? 'false' : 'true');
            }
        }
        dispose() {
            this._onDidChange.dispose();
            this._updateLabelDisposable.dispose();
        }
    }
    exports.CompressedNavigationController = CompressedNavigationController;
    let FilesRenderer = class FilesRenderer {
        static { FilesRenderer_1 = this; }
        static { this.ID = 'file'; }
        constructor(container, labels, updateWidth, contextViewService, themeService, configurationService, explorerService, labelService, contextService, contextMenuService, hoverService, instantiationService) {
            this.labels = labels;
            this.updateWidth = updateWidth;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.labelService = labelService;
            this.contextService = contextService;
            this.contextMenuService = contextMenuService;
            this.hoverService = hoverService;
            this.instantiationService = instantiationService;
            this.compressedNavigationControllers = new Map();
            this._onDidChangeActiveDescendant = new event_1.EventMultiplexer();
            this.onDidChangeActiveDescendant = this._onDidChangeActiveDescendant.event;
            this.hoverDelegate = new class {
                get delay() {
                    // Delay implementation borrowed froms src/vs/workbench/browser/parts/statusbar/statusbarPart.ts
                    if (Date.now() - this.lastHoverHideTime < 500) {
                        return 0; // show instantly when a hover was recently shown
                    }
                    return this.configurationService.getValue('workbench.hover.delay');
                }
                constructor(configurationService, hoverService) {
                    this.configurationService = configurationService;
                    this.hoverService = hoverService;
                    this.lastHoverHideTime = 0;
                    this.hiddenFromClick = false;
                    this.placement = 'element';
                }
                showHover(options, focus) {
                    let element;
                    if (options.target instanceof HTMLElement) {
                        element = options.target;
                    }
                    else {
                        element = options.target.targetElements[0];
                    }
                    const tlRow = element.closest('.monaco-tl-row');
                    const listRow = tlRow?.closest('.monaco-list-row');
                    const child = element.querySelector('div.monaco-icon-label-container');
                    const childOfChild = child?.querySelector('span.monaco-icon-name-container');
                    let overflowed = false;
                    if (childOfChild && child) {
                        const width = child.clientWidth;
                        const childWidth = childOfChild.offsetWidth;
                        // Check if element is overflowing its parent container
                        overflowed = width <= childWidth;
                    }
                    // Only count decorations that provide additional info, as hover overing decorations such as git excluded isn't helpful
                    const hasDecoration = options.content.toString().includes('•');
                    // If it's overflowing or has a decoration show the tooltip
                    overflowed = overflowed || hasDecoration;
                    const indentGuideElement = tlRow?.querySelector('.monaco-tl-indent');
                    if (!indentGuideElement) {
                        return;
                    }
                    return overflowed ? this.hoverService.showHover({
                        ...options,
                        target: indentGuideElement,
                        container: listRow,
                        additionalClasses: ['explorer-item-hover'],
                        position: {
                            hoverPosition: 1 /* HoverPosition.RIGHT */,
                        },
                        appearance: {
                            compact: true,
                            skipFadeInAnimation: true,
                            showPointer: false,
                        }
                    }, focus) : undefined;
                }
                onDidHideHover() {
                    if (!this.hiddenFromClick) {
                        this.lastHoverHideTime = Date.now();
                    }
                    this.hiddenFromClick = false;
                }
            }(this.configurationService, this.hoverService);
            this.config = this.configurationService.getValue();
            const updateOffsetStyles = () => {
                const indent = this.configurationService.getValue('workbench.tree.indent');
                const offset = Math.max(22 - indent, 0); // derived via inspection
                container.style.setProperty(`--vscode-explorer-align-offset-margin-left`, `${offset}px`);
            };
            this.configListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer')) {
                    this.config = this.configurationService.getValue();
                }
                if (e.affectsConfiguration('workbench.tree.indent')) {
                    updateOffsetStyles();
                }
            });
            updateOffsetStyles();
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('treeAriaLabel', "Files Explorer");
        }
        get templateId() {
            return FilesRenderer_1.ID;
        }
        renderTemplate(container) {
            const templateDisposables = new lifecycle_1.DisposableStore();
            const experimentalHover = this.configurationService.getValue('explorer.experimental.hover');
            const label = templateDisposables.add(this.labels.create(container, { supportHighlights: true, hoverDelegate: experimentalHover ? this.hoverDelegate : undefined }));
            templateDisposables.add(label.onDidRender(() => {
                try {
                    if (templateData.currentContext) {
                        this.updateWidth(templateData.currentContext);
                    }
                }
                catch (e) {
                    // noop since the element might no longer be in the tree, no update of width necessary
                }
            }));
            const contribs = explorerFileContrib_1.explorerFileContribRegistry.create(this.instantiationService, container, templateDisposables);
            const templateData = { templateDisposables, elementDisposables: templateDisposables.add(new lifecycle_1.DisposableStore()), label, container, contribs };
            return templateData;
        }
        renderElement(node, index, templateData) {
            const stat = node.element;
            templateData.currentContext = stat;
            const editableData = this.explorerService.getEditableData(stat);
            templateData.label.element.classList.remove('compressed');
            // File Label
            if (!editableData) {
                templateData.label.element.style.display = 'flex';
                this.renderStat(stat, stat.name, undefined, node.filterData, templateData);
            }
            // Input Box
            else {
                templateData.label.element.style.display = 'none';
                templateData.contribs.forEach(c => c.setResource(undefined));
                templateData.elementDisposables.add(this.renderInputBox(templateData.container, stat, editableData));
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            const stat = node.element.elements[node.element.elements.length - 1];
            templateData.currentContext = stat;
            const editable = node.element.elements.filter(e => this.explorerService.isEditable(e));
            const editableData = editable.length === 0 ? undefined : this.explorerService.getEditableData(editable[0]);
            // File Label
            if (!editableData) {
                templateData.label.element.classList.add('compressed');
                templateData.label.element.style.display = 'flex';
                const id = `compressed-explorer_${CompressedNavigationController.ID++}`;
                const label = node.element.elements.map(e => e.name);
                this.renderStat(stat, label, id, node.filterData, templateData);
                const compressedNavigationController = new CompressedNavigationController(id, node.element.elements, templateData, node.depth, node.collapsed);
                templateData.elementDisposables.add(compressedNavigationController);
                const nodeControllers = this.compressedNavigationControllers.get(stat) ?? [];
                this.compressedNavigationControllers.set(stat, [...nodeControllers, compressedNavigationController]);
                // accessibility
                templateData.elementDisposables.add(this._onDidChangeActiveDescendant.add(compressedNavigationController.onDidChange));
                templateData.elementDisposables.add(DOM.addDisposableListener(templateData.container, 'mousedown', e => {
                    const result = getIconLabelNameFromHTMLElement(e.target);
                    if (result) {
                        compressedNavigationController.setIndex(result.index);
                    }
                }));
                templateData.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                    const nodeControllers = this.compressedNavigationControllers.get(stat) ?? [];
                    const renderedIndex = nodeControllers.findIndex(controller => controller === compressedNavigationController);
                    if (renderedIndex < 0) {
                        throw new Error('Disposing unknown navigation controller');
                    }
                    if (nodeControllers.length === 1) {
                        this.compressedNavigationControllers.delete(stat);
                    }
                    else {
                        nodeControllers.splice(renderedIndex, 1);
                    }
                }));
            }
            // Input Box
            else {
                templateData.label.element.classList.remove('compressed');
                templateData.label.element.style.display = 'none';
                templateData.contribs.forEach(c => c.setResource(undefined));
                templateData.elementDisposables.add(this.renderInputBox(templateData.container, editable[0], editableData));
            }
        }
        renderStat(stat, label, domId, filterData, templateData) {
            templateData.label.element.style.display = 'flex';
            const extraClasses = ['explorer-item'];
            if (this.explorerService.isCut(stat)) {
                extraClasses.push('cut');
            }
            // Offset nested children unless folders have both chevrons and icons, otherwise alignment breaks
            const theme = this.themeService.getFileIconTheme();
            // Hack to always render chevrons for file nests, or else may not be able to identify them.
            const twistieContainer = templateData.container.parentElement?.parentElement?.querySelector('.monaco-tl-twistie');
            twistieContainer?.classList.toggle('force-twistie', stat.hasNests && theme.hidesExplorerArrows);
            // when explorer arrows are hidden or there are no folder icons, nests get misaligned as they are forced to have arrows and files typically have icons
            // Apply some CSS magic to get things looking as reasonable as possible.
            const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
            const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
            const experimentalHover = this.configurationService.getValue('explorer.experimental.hover');
            templateData.contribs.forEach(c => c.setResource(stat.resource));
            templateData.label.setResource({ resource: stat.resource, name: label }, {
                title: experimentalHover ? (0, types_1.isStringArray)(label) ? label[0] : label : undefined,
                fileKind: stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE,
                extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
                fileDecorations: this.config.explorer.decorations,
                matches: (0, filters_1.createMatches)(filterData),
                separator: this.labelService.getSeparator(stat.resource.scheme, stat.resource.authority),
                domId
            });
        }
        renderInputBox(container, stat, editableData) {
            // Use a file label only for the icon next to the input box
            const label = this.labels.create(container);
            const extraClasses = ['explorer-item', 'explorer-item-edited'];
            const fileKind = stat.isRoot ? files_1.FileKind.ROOT_FOLDER : stat.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const theme = this.themeService.getFileIconTheme();
            const themeIsUnhappyWithNesting = theme.hasFileIcons && (theme.hidesExplorerArrows || !theme.hasFolderIcons);
            const realignNestedChildren = stat.nestedParent && themeIsUnhappyWithNesting;
            const labelOptions = {
                hidePath: true,
                hideLabel: true,
                fileKind,
                extraClasses: realignNestedChildren ? [...extraClasses, 'align-nest-icon-with-parent-icon'] : extraClasses,
            };
            const parent = stat.name ? (0, resources_1.dirname)(stat.resource) : stat.resource;
            const value = stat.name || '';
            label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // Use icon for ' ' if name is empty.
            // hack: hide label
            label.element.firstElementChild.style.display = 'none';
            // Input field for name
            const inputBox = new inputBox_1.InputBox(label.element, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        const message = editableData.validationMessage(value);
                        if (!message || message.severity !== notification_1.Severity.Error) {
                            return null;
                        }
                        return {
                            content: message.content,
                            formatContent: true,
                            type: 3 /* MessageType.ERROR */
                        };
                    }
                },
                ariaLabel: (0, nls_1.localize)('fileInputAriaLabel', "Type file name. Press Enter to confirm or Escape to cancel."),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            });
            const lastDot = value.lastIndexOf('.');
            let currentSelectionState = 'prefix';
            inputBox.value = value;
            inputBox.focus();
            inputBox.select({ start: 0, end: lastDot > 0 && !stat.isDirectory ? lastDot : value.length });
            const done = (0, functional_1.createSingleCallFunction)((success, finishEditing) => {
                label.element.style.display = 'none';
                const value = inputBox.value;
                (0, lifecycle_1.dispose)(toDispose);
                label.element.remove();
                if (finishEditing) {
                    editableData.onFinish(value, success);
                }
            });
            const showInputBoxNotification = () => {
                if (inputBox.isInputValid()) {
                    const message = editableData.validationMessage(inputBox.value);
                    if (message) {
                        inputBox.showMessage({
                            content: message.content,
                            formatContent: true,
                            type: message.severity === notification_1.Severity.Info ? 1 /* MessageType.INFO */ : message.severity === notification_1.Severity.Warning ? 2 /* MessageType.WARNING */ : 3 /* MessageType.ERROR */
                        });
                    }
                    else {
                        inputBox.hideMessage();
                    }
                }
            };
            showInputBoxNotification();
            const toDispose = [
                inputBox,
                inputBox.onDidChange(value => {
                    label.setFile((0, resources_1.joinPath)(parent, value || ' '), labelOptions); // update label icon while typing!
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => {
                    if (e.equals(60 /* KeyCode.F2 */)) {
                        const dotIndex = inputBox.value.lastIndexOf('.');
                        if (stat.isDirectory || dotIndex === -1) {
                            return;
                        }
                        if (currentSelectionState === 'prefix') {
                            currentSelectionState = 'all';
                            inputBox.select({ start: 0, end: inputBox.value.length });
                        }
                        else if (currentSelectionState === 'all') {
                            currentSelectionState = 'suffix';
                            inputBox.select({ start: dotIndex + 1, end: inputBox.value.length });
                        }
                        else {
                            currentSelectionState = 'prefix';
                            inputBox.select({ start: 0, end: dotIndex });
                        }
                    }
                    else if (e.equals(3 /* KeyCode.Enter */)) {
                        if (!inputBox.validate()) {
                            done(true, true);
                        }
                    }
                    else if (e.equals(9 /* KeyCode.Escape */)) {
                        done(false, true);
                    }
                }),
                DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_UP, (e) => {
                    showInputBoxNotification();
                }),
                DOM.addDisposableListener(inputBox.inputElement, DOM.EventType.BLUR, async () => {
                    while (true) {
                        await (0, async_1.timeout)(0);
                        const ownerDocument = inputBox.inputElement.ownerDocument;
                        if (!ownerDocument.hasFocus()) {
                            break;
                        }
                        if (DOM.isActiveElement(inputBox.inputElement)) {
                            return;
                        }
                        else if (ownerDocument.activeElement instanceof HTMLElement && DOM.hasParentWithClass(ownerDocument.activeElement, 'context-view')) {
                            await event_1.Event.toPromise(this.contextMenuService.onDidHideContextMenu);
                        }
                        else {
                            break;
                        }
                    }
                    done(inputBox.isInputValid(), true);
                }),
                label
            ];
            return (0, lifecycle_1.toDisposable)(() => {
                done(false, false);
            });
        }
        disposeElement(element, index, templateData) {
            templateData.currentContext = undefined;
            templateData.elementDisposables.clear();
        }
        disposeCompressedElements(node, index, templateData) {
            templateData.currentContext = undefined;
            templateData.elementDisposables.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposables.dispose();
        }
        getCompressedNavigationController(stat) {
            return this.compressedNavigationControllers.get(stat);
        }
        // IAccessibilityProvider
        getAriaLabel(element) {
            return element.name;
        }
        getAriaLevel(element) {
            // We need to comput aria level on our own since children of compact folders will otherwise have an incorrect level	#107235
            let depth = 0;
            let parent = element.parent;
            while (parent) {
                parent = parent.parent;
                depth++;
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                depth = depth + 1;
            }
            return depth;
        }
        getActiveDescendantId(stat) {
            return this.compressedNavigationControllers.get(stat)?.[0]?.currentId ?? undefined;
        }
        dispose() {
            this.configListener.dispose();
        }
    };
    exports.FilesRenderer = FilesRenderer;
    exports.FilesRenderer = FilesRenderer = FilesRenderer_1 = __decorate([
        __param(3, contextView_1.IContextViewService),
        __param(4, themeService_1.IThemeService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_2.IExplorerService),
        __param(7, label_1.ILabelService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, hover_1.IHoverService),
        __param(11, instantiation_1.IInstantiationService)
    ], FilesRenderer);
    /**
     * Respects files.exclude setting in filtering out content from the explorer.
     * Makes sure that visible editors are always shown in the explorer even if they are filtered out by settings.
     */
    let FilesFilter = class FilesFilter {
        constructor(contextService, configurationService, explorerService, editorService, uriIdentityService, fileService) {
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.uriIdentityService = uriIdentityService;
            this.fileService = fileService;
            this.hiddenExpressionPerRoot = new Map();
            this.editorsAffectingFilter = new Set();
            this._onDidChange = new event_1.Emitter();
            this.toDispose = [];
            // List of ignoreFile resources. Used to detect changes to the ignoreFiles.
            this.ignoreFileResourcesPerRoot = new Map();
            // Ignore tree per root. Similar to `hiddenExpressionPerRoot`
            // Note: URI in the ternary search tree is the URI of the folder containing the ignore file
            // It is not the ignore file itself. This is because of the way the IgnoreFile works and nested paths
            this.ignoreTreesPerRoot = new Map();
            this.toDispose.push(this.contextService.onDidChangeWorkspaceFolders(() => this.updateConfiguration()));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('files.exclude') || e.affectsConfiguration('explorer.excludeGitIgnore')) {
                    this.updateConfiguration();
                }
            }));
            this.toDispose.push(this.fileService.onDidFilesChange(e => {
                // Check to see if the update contains any of the ignoreFileResources
                for (const [root, ignoreFileResourceSet] of this.ignoreFileResourcesPerRoot.entries()) {
                    ignoreFileResourceSet.forEach(async (ignoreResource) => {
                        if (e.contains(ignoreResource, 0 /* FileChangeType.UPDATED */)) {
                            await this.processIgnoreFile(root, ignoreResource, true);
                        }
                        if (e.contains(ignoreResource, 2 /* FileChangeType.DELETED */)) {
                            this.ignoreTreesPerRoot.get(root)?.delete((0, resources_1.dirname)(ignoreResource));
                            ignoreFileResourceSet.delete(ignoreResource);
                            this._onDidChange.fire();
                        }
                    });
                }
            }));
            this.toDispose.push(this.editorService.onDidVisibleEditorsChange(() => {
                const editors = this.editorService.visibleEditors;
                let shouldFire = false;
                for (const e of editors) {
                    if (!e.resource) {
                        continue;
                    }
                    const stat = this.explorerService.findClosest(e.resource);
                    if (stat && stat.isExcluded) {
                        // A filtered resource suddenly became visible since user opened an editor
                        shouldFire = true;
                        break;
                    }
                }
                for (const e of this.editorsAffectingFilter) {
                    if (!editors.includes(e)) {
                        // Editor that was affecting filtering is no longer visible
                        shouldFire = true;
                        break;
                    }
                }
                if (shouldFire) {
                    this.editorsAffectingFilter.clear();
                    this._onDidChange.fire();
                }
            }));
            this.updateConfiguration();
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        updateConfiguration() {
            let shouldFire = false;
            let updatedGitIgnoreSetting = false;
            this.contextService.getWorkspace().folders.forEach(folder => {
                const configuration = this.configurationService.getValue({ resource: folder.uri });
                const excludesConfig = configuration?.files?.exclude || Object.create(null);
                const parseIgnoreFile = configuration.explorer.excludeGitIgnore;
                // If we should be parsing ignoreFiles for this workspace and don't have an ignore tree initialize one
                if (parseIgnoreFile && !this.ignoreTreesPerRoot.has(folder.uri.toString())) {
                    updatedGitIgnoreSetting = true;
                    this.ignoreFileResourcesPerRoot.set(folder.uri.toString(), new map_1.ResourceSet());
                    this.ignoreTreesPerRoot.set(folder.uri.toString(), ternarySearchTree_1.TernarySearchTree.forUris((uri) => this.uriIdentityService.extUri.ignorePathCasing(uri)));
                }
                // If we shouldn't be parsing ignore files but have an ignore tree, clear the ignore tree
                if (!parseIgnoreFile && this.ignoreTreesPerRoot.has(folder.uri.toString())) {
                    updatedGitIgnoreSetting = true;
                    this.ignoreFileResourcesPerRoot.delete(folder.uri.toString());
                    this.ignoreTreesPerRoot.delete(folder.uri.toString());
                }
                if (!shouldFire) {
                    const cached = this.hiddenExpressionPerRoot.get(folder.uri.toString());
                    shouldFire = !cached || !(0, objects_1.equals)(cached.original, excludesConfig);
                }
                const excludesConfigCopy = (0, objects_1.deepClone)(excludesConfig); // do not keep the config, as it gets mutated under our hoods
                this.hiddenExpressionPerRoot.set(folder.uri.toString(), { original: excludesConfigCopy, parsed: glob.parse(excludesConfigCopy) });
            });
            if (shouldFire || updatedGitIgnoreSetting) {
                this.editorsAffectingFilter.clear();
                this._onDidChange.fire();
            }
        }
        /**
         * Given a .gitignore file resource, processes the resource and adds it to the ignore tree which hides explorer items
         * @param root The root folder of the workspace as a string. Used for lookup key for ignore tree and resource list
         * @param ignoreFileResource The resource of the .gitignore file
         * @param update Whether or not we're updating an existing ignore file. If true it deletes the old entry
         */
        async processIgnoreFile(root, ignoreFileResource, update) {
            // Get the name of the directory which the ignore file is in
            const dirUri = (0, resources_1.dirname)(ignoreFileResource);
            const ignoreTree = this.ignoreTreesPerRoot.get(root);
            if (!ignoreTree) {
                return;
            }
            // Don't process a directory if we already have it in the tree
            if (!update && ignoreTree.has(dirUri)) {
                return;
            }
            // Maybe we need a cancellation token here in case it's super long?
            const content = await this.fileService.readFile(ignoreFileResource);
            // If it's just an update we update the contents keeping all references the same
            if (update) {
                const ignoreFile = ignoreTree.get(dirUri);
                ignoreFile?.updateContents(content.value.toString());
            }
            else {
                // Otherwise we create a new ignorefile and add it to the tree
                const ignoreParent = ignoreTree.findSubstr(dirUri);
                const ignoreFile = new ignoreFile_1.IgnoreFile(content.value.toString(), dirUri.path, ignoreParent);
                ignoreTree.set(dirUri, ignoreFile);
                // If we haven't seen this resource before then we need to add it to the list of resources we're tracking
                if (!this.ignoreFileResourcesPerRoot.get(root)?.has(ignoreFileResource)) {
                    this.ignoreFileResourcesPerRoot.get(root)?.add(ignoreFileResource);
                }
            }
            // Notify the explorer of the change so we may ignore these files
            this._onDidChange.fire();
        }
        filter(stat, parentVisibility) {
            // Add newly visited .gitignore files to the ignore tree
            if (stat.name === '.gitignore' && this.ignoreTreesPerRoot.has(stat.root.resource.toString())) {
                this.processIgnoreFile(stat.root.resource.toString(), stat.resource, false);
                return true;
            }
            return this.isVisible(stat, parentVisibility);
        }
        isVisible(stat, parentVisibility) {
            stat.isExcluded = false;
            if (parentVisibility === 0 /* TreeVisibility.Hidden */) {
                stat.isExcluded = true;
                return false;
            }
            if (this.explorerService.getEditableData(stat)) {
                return true; // always visible
            }
            // Hide those that match Hidden Patterns
            const cached = this.hiddenExpressionPerRoot.get(stat.root.resource.toString());
            const globMatch = cached?.parsed(path.relative(stat.root.resource.path, stat.resource.path), stat.name, name => !!(stat.parent && stat.parent.getChild(name)));
            // Small optimization to only traverse gitIgnore if the globMatch from fileExclude returned nothing
            const ignoreFile = globMatch ? undefined : this.ignoreTreesPerRoot.get(stat.root.resource.toString())?.findSubstr(stat.resource);
            const isIncludedInTraversal = ignoreFile?.isPathIncludedInTraversal(stat.resource.path, stat.isDirectory);
            // Doing !undefined returns true and we want it to be false when undefined because that means it's not included in the ignore file
            const isIgnoredByIgnoreFile = isIncludedInTraversal === undefined ? false : !isIncludedInTraversal;
            if (isIgnoredByIgnoreFile || globMatch || stat.parent?.isExcluded) {
                stat.isExcluded = true;
                const editors = this.editorService.visibleEditors;
                const editor = editors.find(e => e.resource && this.uriIdentityService.extUri.isEqualOrParent(e.resource, stat.resource));
                if (editor && stat.root === this.explorerService.findClosestRoot(stat.resource)) {
                    this.editorsAffectingFilter.add(editor);
                    return true; // Show all opened files and their parents
                }
                return false; // hidden through pattern
            }
            return true;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.FilesFilter = FilesFilter;
    exports.FilesFilter = FilesFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, files_1.IFileService)
    ], FilesFilter);
    // Explorer Sorter
    let FileSorter = class FileSorter {
        constructor(explorerService, contextService) {
            this.explorerService = explorerService;
            this.contextService = contextService;
        }
        compare(statA, statB) {
            // Do not sort roots
            if (statA.isRoot) {
                if (statB.isRoot) {
                    const workspaceA = this.contextService.getWorkspaceFolder(statA.resource);
                    const workspaceB = this.contextService.getWorkspaceFolder(statB.resource);
                    return workspaceA && workspaceB ? (workspaceA.index - workspaceB.index) : -1;
                }
                return -1;
            }
            if (statB.isRoot) {
                return 1;
            }
            const sortOrder = this.explorerService.sortOrderConfiguration.sortOrder;
            const lexicographicOptions = this.explorerService.sortOrderConfiguration.lexicographicOptions;
            let compareFileNames;
            let compareFileExtensions;
            switch (lexicographicOptions) {
                case 'upper':
                    compareFileNames = comparers_1.compareFileNamesUpper;
                    compareFileExtensions = comparers_1.compareFileExtensionsUpper;
                    break;
                case 'lower':
                    compareFileNames = comparers_1.compareFileNamesLower;
                    compareFileExtensions = comparers_1.compareFileExtensionsLower;
                    break;
                case 'unicode':
                    compareFileNames = comparers_1.compareFileNamesUnicode;
                    compareFileExtensions = comparers_1.compareFileExtensionsUnicode;
                    break;
                default:
                    // 'default'
                    compareFileNames = comparers_1.compareFileNamesDefault;
                    compareFileExtensions = comparers_1.compareFileExtensionsDefault;
            }
            // Sort Directories
            switch (sortOrder) {
                case 'type':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.isDirectory && statB.isDirectory) {
                        return compareFileNames(statA.name, statB.name);
                    }
                    break;
                case 'filesFirst':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return 1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return -1;
                    }
                    break;
                case 'foldersNestsFiles':
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    if (statA.hasNests && !statB.hasNests) {
                        return -1;
                    }
                    if (statB.hasNests && !statA.hasNests) {
                        return 1;
                    }
                    break;
                case 'mixed':
                    break; // not sorting when "mixed" is on
                default: /* 'default', 'modified' */
                    if (statA.isDirectory && !statB.isDirectory) {
                        return -1;
                    }
                    if (statB.isDirectory && !statA.isDirectory) {
                        return 1;
                    }
                    break;
            }
            // Sort Files
            switch (sortOrder) {
                case 'type':
                    return compareFileExtensions(statA.name, statB.name);
                case 'modified':
                    if (statA.mtime !== statB.mtime) {
                        return (statA.mtime && statB.mtime && statA.mtime < statB.mtime) ? 1 : -1;
                    }
                    return compareFileNames(statA.name, statB.name);
                default: /* 'default', 'mixed', 'filesFirst' */
                    return compareFileNames(statA.name, statB.name);
            }
        }
    };
    exports.FileSorter = FileSorter;
    exports.FileSorter = FileSorter = __decorate([
        __param(0, files_2.IExplorerService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], FileSorter);
    let FileDragAndDrop = class FileDragAndDrop {
        static { FileDragAndDrop_1 = this; }
        static { this.CONFIRM_DND_SETTING_KEY = 'explorer.confirmDragAndDrop'; }
        constructor(isCollapsed, explorerService, editorService, dialogService, contextService, fileService, configurationService, instantiationService, workspaceEditingService, uriIdentityService) {
            this.isCollapsed = isCollapsed;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.workspaceEditingService = workspaceEditingService;
            this.uriIdentityService = uriIdentityService;
            this.compressedDropTargetDisposable = lifecycle_1.Disposable.None;
            this.disposables = new lifecycle_1.DisposableStore();
            this.dropEnabled = false;
            const updateDropEnablement = (e) => {
                if (!e || e.affectsConfiguration('explorer.enableDragAndDrop')) {
                    this.dropEnabled = this.configurationService.getValue('explorer.enableDragAndDrop');
                }
            };
            updateDropEnablement(undefined);
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => updateDropEnablement(e)));
        }
        onDragOver(data, target, targetIndex, targetSector, originalEvent) {
            if (!this.dropEnabled) {
                return false;
            }
            // Compressed folders
            if (target) {
                const compressedTarget = FileDragAndDrop_1.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    const iconLabelName = getIconLabelNameFromHTMLElement(originalEvent.target);
                    if (iconLabelName && iconLabelName.index < iconLabelName.count - 1) {
                        const result = this.handleDragOver(data, compressedTarget, targetIndex, targetSector, originalEvent);
                        if (result) {
                            if (iconLabelName.element !== this.compressedDragOverElement) {
                                this.compressedDragOverElement = iconLabelName.element;
                                this.compressedDropTargetDisposable.dispose();
                                this.compressedDropTargetDisposable = (0, lifecycle_1.toDisposable)(() => {
                                    iconLabelName.element.classList.remove('drop-target');
                                    this.compressedDragOverElement = undefined;
                                });
                                iconLabelName.element.classList.add('drop-target');
                            }
                            return typeof result === 'boolean' ? result : { ...result, feedback: [] };
                        }
                        this.compressedDropTargetDisposable.dispose();
                        return false;
                    }
                }
            }
            this.compressedDropTargetDisposable.dispose();
            return this.handleDragOver(data, target, targetIndex, targetSector, originalEvent);
        }
        handleDragOver(data, target, targetIndex, targetSector, originalEvent) {
            const isCopy = originalEvent && ((originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh));
            const isNative = data instanceof listView_1.NativeDragAndDropData;
            const effectType = (isNative || isCopy) ? 0 /* ListDragOverEffectType.Copy */ : 1 /* ListDragOverEffectType.Move */;
            const effect = { type: effectType, position: "drop-target" /* ListDragOverEffectPosition.Over */ };
            // Native DND
            if (isNative) {
                if (!(0, dnd_1.containsDragType)(originalEvent, dnd_3.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES, dnd_3.DataTransfers.RESOURCES)) {
                    return false;
                }
            }
            // Other-Tree DND
            else if (data instanceof listView_1.ExternalElementsDragAndDropData) {
                return false;
            }
            // In-Explorer DND
            else {
                const items = FileDragAndDrop_1.getStatsFromDragAndDropData(data);
                const isRootsReorder = items.every(item => item.isRoot);
                if (!target) {
                    // Dropping onto the empty area. Do not accept if items dragged are already
                    // children of the root unless we are copying the file
                    if (!isCopy && items.every(i => !!i.parent && i.parent.isRoot)) {
                        return false;
                    }
                    // root is added after last root folder when hovering on empty background
                    if (isRootsReorder) {
                        return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */, position: "drop-target-after" /* ListDragOverEffectPosition.After */ } };
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: false };
                }
                if (!Array.isArray(items)) {
                    return false;
                }
                if (!isCopy && items.every((source) => source.isReadonly)) {
                    return false; // Cannot move readonly items unless we copy
                }
                if (items.some((source) => {
                    if (source.isRoot) {
                        return false; // Root folders are handled seperately
                    }
                    if (this.uriIdentityService.extUri.isEqual(source.resource, target.resource)) {
                        return true; // Can not move anything onto itself excpet for root folders
                    }
                    if (!isCopy && this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(source.resource), target.resource)) {
                        return true; // Can not move a file to the same parent unless we copy
                    }
                    if (this.uriIdentityService.extUri.isEqualOrParent(target.resource, source.resource)) {
                        return true; // Can not move a parent folder into one of its children
                    }
                    return false;
                })) {
                    return false;
                }
                // reordering roots
                if (isRootsReorder) {
                    if (!target.isRoot) {
                        return false;
                    }
                    let dropEffectPosition = undefined;
                    switch (targetSector) {
                        case 0 /* ListViewTargetSector.TOP */:
                        case 1 /* ListViewTargetSector.CENTER_TOP */:
                            dropEffectPosition = "drop-target-before" /* ListDragOverEffectPosition.Before */;
                            break;
                        case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                        case 3 /* ListViewTargetSector.BOTTOM */:
                            dropEffectPosition = "drop-target-after" /* ListDragOverEffectPosition.After */;
                            break;
                    }
                    return { accept: true, effect: { type: 1 /* ListDragOverEffectType.Move */, position: dropEffectPosition } };
                }
            }
            // All (target = model)
            if (!target) {
                return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect };
            }
            // All (target = file/folder)
            else {
                if (target.isDirectory) {
                    if (target.isReadonly) {
                        return false;
                    }
                    return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, effect, autoExpand: true };
                }
                if (this.contextService.getWorkspace().folders.every(folder => folder.uri.toString() !== target.resource.toString())) {
                    return { accept: true, bubble: 1 /* TreeDragOverBubble.Up */, effect };
                }
            }
            return false;
        }
        getDragURI(element) {
            if (this.explorerService.isEditable(element)) {
                return null;
            }
            return element.resource.toString();
        }
        getDragLabel(elements, originalEvent) {
            if (elements.length === 1) {
                const stat = FileDragAndDrop_1.getCompressedStatFromDragEvent(elements[0], originalEvent);
                return stat.name;
            }
            return String(elements.length);
        }
        onDragStart(data, originalEvent) {
            const items = FileDragAndDrop_1.getStatsFromDragAndDropData(data, originalEvent);
            if (items && items.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, items, originalEvent));
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = items.filter(s => s.resource.scheme === network_1.Schemas.file).map(r => r.resource.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_1.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        async drop(data, target, targetIndex, targetSector, originalEvent) {
            this.compressedDropTargetDisposable.dispose();
            // Find compressed target
            if (target) {
                const compressedTarget = FileDragAndDrop_1.getCompressedStatFromDragEvent(target, originalEvent);
                if (compressedTarget) {
                    target = compressedTarget;
                }
            }
            // Find parent to add to
            if (!target) {
                target = this.explorerService.roots[this.explorerService.roots.length - 1];
                targetSector = 3 /* ListViewTargetSector.BOTTOM */;
            }
            if (!target.isDirectory && target.parent) {
                target = target.parent;
            }
            if (target.isReadonly) {
                return;
            }
            const resolvedTarget = target;
            if (!resolvedTarget) {
                return;
            }
            try {
                // External file DND (Import/Upload file)
                if (data instanceof listView_1.NativeDragAndDropData) {
                    // Use local file import when supported
                    if (!platform_1.isWeb || ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) && webFileSystemAccess_1.WebFileSystemAccess.supported(window_1.mainWindow))) {
                        const fileImport = this.instantiationService.createInstance(fileImportExport_1.ExternalFileImport);
                        await fileImport.import(resolvedTarget, originalEvent, window_1.mainWindow);
                    }
                    // Otherwise fallback to browser based file upload
                    else {
                        const browserUpload = this.instantiationService.createInstance(fileImportExport_1.BrowserFileUpload);
                        await browserUpload.upload(target, originalEvent);
                    }
                }
                // In-Explorer DND (Move/Copy file)
                else {
                    await this.handleExplorerDrop(data, resolvedTarget, targetIndex, targetSector, originalEvent);
                }
            }
            catch (error) {
                this.dialogService.error((0, errorMessage_1.toErrorMessage)(error));
            }
        }
        async handleExplorerDrop(data, target, targetIndex, targetSector, originalEvent) {
            const elementsData = FileDragAndDrop_1.getStatsFromDragAndDropData(data);
            const distinctItems = new Map(elementsData.map(element => [element, this.isCollapsed(element)]));
            for (const [item, collapsed] of distinctItems) {
                if (collapsed) {
                    const nestedChildren = item.nestedChildren;
                    if (nestedChildren) {
                        for (const child of nestedChildren) {
                            // if parent is collapsed, then the nested children is considered collapsed to operate as a group
                            // and skip collapsed state check since they're not in the tree
                            distinctItems.set(child, true);
                        }
                    }
                }
            }
            const items = (0, resources_1.distinctParents)([...distinctItems.keys()], s => s.resource);
            const isCopy = (originalEvent.ctrlKey && !platform_1.isMacintosh) || (originalEvent.altKey && platform_1.isMacintosh);
            // Handle confirm setting
            const confirmDragAndDrop = !isCopy && this.configurationService.getValue(FileDragAndDrop_1.CONFIRM_DND_SETTING_KEY);
            if (confirmDragAndDrop) {
                const message = items.length > 1 && items.every(s => s.isRoot) ? (0, nls_1.localize)('confirmRootsMove', "Are you sure you want to change the order of multiple root folders in your workspace?")
                    : items.length > 1 ? (0, nls_1.localize)('confirmMultiMove', "Are you sure you want to move the following {0} files into '{1}'?", items.length, target.name)
                        : items[0].isRoot ? (0, nls_1.localize)('confirmRootMove', "Are you sure you want to change the order of root folder '{0}' in your workspace?", items[0].name)
                            : (0, nls_1.localize)('confirmMove', "Are you sure you want to move '{0}' into '{1}'?", items[0].name, target.name);
                const detail = items.length > 1 && !items.every(s => s.isRoot) ? (0, dialogs_1.getFileNamesMessage)(items.map(i => i.resource)) : undefined;
                const confirmation = await this.dialogService.confirm({
                    message,
                    detail,
                    checkbox: {
                        label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                    },
                    primaryButton: (0, nls_1.localize)({ key: 'moveButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Move")
                });
                if (!confirmation.confirmed) {
                    return;
                }
                // Check for confirmation checkbox
                if (confirmation.checkboxChecked === true) {
                    await this.configurationService.updateValue(FileDragAndDrop_1.CONFIRM_DND_SETTING_KEY, false);
                }
            }
            await this.doHandleRootDrop(items.filter(s => s.isRoot), target, targetSector);
            const sources = items.filter(s => !s.isRoot);
            if (isCopy) {
                return this.doHandleExplorerDropOnCopy(sources, target);
            }
            return this.doHandleExplorerDropOnMove(sources, target);
        }
        async doHandleRootDrop(roots, target, targetSector) {
            if (roots.length === 0) {
                return;
            }
            const folders = this.contextService.getWorkspace().folders;
            let targetIndex;
            const sourceIndices = [];
            const workspaceCreationData = [];
            const rootsToMove = [];
            for (let index = 0; index < folders.length; index++) {
                const data = {
                    uri: folders[index].uri,
                    name: folders[index].name
                };
                // Is current target
                if (target instanceof explorerModel_1.ExplorerItem && this.uriIdentityService.extUri.isEqual(folders[index].uri, target.resource)) {
                    targetIndex = index;
                }
                // Is current source
                for (const root of roots) {
                    if (this.uriIdentityService.extUri.isEqual(folders[index].uri, root.resource)) {
                        sourceIndices.push(index);
                        break;
                    }
                }
                if (roots.every(r => r.resource.toString() !== folders[index].uri.toString())) {
                    workspaceCreationData.push(data);
                }
                else {
                    rootsToMove.push(data);
                }
            }
            if (targetIndex === undefined) {
                targetIndex = workspaceCreationData.length;
            }
            else {
                switch (targetSector) {
                    case 3 /* ListViewTargetSector.BOTTOM */:
                    case 2 /* ListViewTargetSector.CENTER_BOTTOM */:
                        targetIndex++;
                        break;
                }
                // Adjust target index if source was located before target.
                // The move will cause the index to change
                for (const sourceIndex of sourceIndices) {
                    if (sourceIndex < targetIndex) {
                        targetIndex--;
                    }
                }
            }
            workspaceCreationData.splice(targetIndex, 0, ...rootsToMove);
            return this.workspaceEditingService.updateFolders(0, workspaceCreationData.length, workspaceCreationData);
        }
        async doHandleExplorerDropOnCopy(sources, target) {
            // Reuse duplicate action when user copies
            const explorerConfig = this.configurationService.getValue().explorer;
            const resourceFileEdits = [];
            for (const { resource, isDirectory } of sources) {
                const allowOverwrite = explorerConfig.incrementalNaming === 'disabled';
                const newResource = await (0, fileActions_1.findValidPasteFileTarget)(this.explorerService, this.fileService, this.dialogService, target, { resource, isDirectory, allowOverwrite }, explorerConfig.incrementalNaming);
                if (!newResource) {
                    continue;
                }
                const resourceEdit = new bulkEditService_1.ResourceFileEdit(resource, newResource, { copy: true, overwrite: allowOverwrite });
                resourceFileEdits.push(resourceEdit);
            }
            const labelSuffix = getFileOrFolderLabelSuffix(sources);
            await this.explorerService.applyBulkEdit(resourceFileEdits, {
                confirmBeforeUndo: explorerConfig.confirmUndo === "default" /* UndoConfirmLevel.Default */ || explorerConfig.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('copy', "Copy {0}", labelSuffix),
                progressLabel: (0, nls_1.localize)('copying', "Copying {0}", labelSuffix),
            });
            const editors = resourceFileEdits.filter(edit => {
                const item = edit.newResource ? this.explorerService.findClosest(edit.newResource) : undefined;
                return item && !item.isDirectory;
            }).map(edit => ({ resource: edit.newResource, options: { pinned: true } }));
            await this.editorService.openEditors(editors);
        }
        async doHandleExplorerDropOnMove(sources, target) {
            // Do not allow moving readonly items
            const resourceFileEdits = sources.filter(source => !source.isReadonly).map(source => new bulkEditService_1.ResourceFileEdit(source.resource, (0, resources_1.joinPath)(target.resource, source.name)));
            const labelSuffix = getFileOrFolderLabelSuffix(sources);
            const options = {
                confirmBeforeUndo: this.configurationService.getValue().explorer.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                undoLabel: (0, nls_1.localize)('move', "Move {0}", labelSuffix),
                progressLabel: (0, nls_1.localize)('moving', "Moving {0}", labelSuffix)
            };
            try {
                await this.explorerService.applyBulkEdit(resourceFileEdits, options);
            }
            catch (error) {
                // Conflict
                if (error.fileOperationResult === 4 /* FileOperationResult.FILE_MOVE_CONFLICT */) {
                    const overwrites = [];
                    for (const edit of resourceFileEdits) {
                        if (edit.newResource && await this.fileService.exists(edit.newResource)) {
                            overwrites.push(edit.newResource);
                        }
                    }
                    // Move with overwrite if the user confirms
                    const confirm = (0, fileImportExport_1.getMultipleFilesOverwriteConfirm)(overwrites);
                    const { confirmed } = await this.dialogService.confirm(confirm);
                    if (confirmed) {
                        await this.explorerService.applyBulkEdit(resourceFileEdits.map(re => new bulkEditService_1.ResourceFileEdit(re.oldResource, re.newResource, { overwrite: true })), options);
                    }
                }
                // Any other error: bubble up
                else {
                    throw error;
                }
            }
        }
        static getStatsFromDragAndDropData(data, dragStartEvent) {
            if (data.context) {
                return data.context;
            }
            // Detect compressed folder dragging
            if (dragStartEvent && data.elements.length === 1) {
                data.context = [FileDragAndDrop_1.getCompressedStatFromDragEvent(data.elements[0], dragStartEvent)];
                return data.context;
            }
            return data.elements;
        }
        static getCompressedStatFromDragEvent(stat, dragEvent) {
            const target = DOM.getWindow(dragEvent).document.elementFromPoint(dragEvent.clientX, dragEvent.clientY);
            const iconLabelName = getIconLabelNameFromHTMLElement(target);
            if (iconLabelName) {
                const { count, index } = iconLabelName;
                let i = count - 1;
                while (i > index && stat.parent) {
                    stat = stat.parent;
                    i--;
                }
                return stat;
            }
            return stat;
        }
        onDragEnd() {
            this.compressedDropTargetDisposable.dispose();
        }
        dispose() {
            this.compressedDropTargetDisposable.dispose();
        }
    };
    exports.FileDragAndDrop = FileDragAndDrop;
    exports.FileDragAndDrop = FileDragAndDrop = FileDragAndDrop_1 = __decorate([
        __param(1, files_2.IExplorerService),
        __param(2, editorService_1.IEditorService),
        __param(3, dialogs_1.IDialogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, files_1.IFileService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, workspaceEditing_1.IWorkspaceEditingService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], FileDragAndDrop);
    function getIconLabelNameFromHTMLElement(target) {
        if (!(target instanceof HTMLElement)) {
            return null;
        }
        let element = target;
        while (element && !element.classList.contains('monaco-list-row')) {
            if (element.classList.contains('label-name') && element.hasAttribute('data-icon-label-count')) {
                const count = Number(element.getAttribute('data-icon-label-count'));
                const index = Number(element.getAttribute('data-icon-label-index'));
                if ((0, types_1.isNumber)(count) && (0, types_1.isNumber)(index)) {
                    return { element: element, count, index };
                }
            }
            element = element.parentElement;
        }
        return null;
    }
    function isCompressedFolderName(target) {
        return !!getIconLabelNameFromHTMLElement(target);
    }
    class ExplorerCompressionDelegate {
        isIncompressible(stat) {
            return stat.isRoot || !stat.isDirectory || stat instanceof explorerModel_1.NewExplorerItem || (!stat.parent || stat.parent.isRoot);
        }
    }
    exports.ExplorerCompressionDelegate = ExplorerCompressionDelegate;
    function getFileOrFolderLabelSuffix(items) {
        if (items.length === 1) {
            return items[0].name;
        }
        if (items.every(i => i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFolders', "{0} folders", items.length);
        }
        if (items.every(i => !i.isDirectory)) {
            return (0, nls_1.localize)('numberOfFiles', "{0} files", items.length);
        }
        return `${items.length} files and folders`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2ZpbGVzL2Jyb3dzZXIvdmlld3MvZXhwbG9yZXJWaWV3ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThpRGhHLHdEQUVDO0lBMytDRCxNQUFhLGdCQUFnQjtpQkFFWixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUVqQyxTQUFTLENBQUMsT0FBcUI7WUFDOUIsT0FBTyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUM7UUFDckMsQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFxQjtZQUNsQyxPQUFPLGFBQWEsQ0FBQyxFQUFFLENBQUM7UUFDekIsQ0FBQzs7SUFWRiw0Q0FXQztJQUVZLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSxlQUFPLEVBQU8sQ0FBQztJQUNwRCxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQUU5QixZQUNTLFVBQXVCLEVBQ0ksZUFBaUMsRUFDNUIsYUFBb0MsRUFDckMsbUJBQXlDLEVBQ3RDLGFBQXNDLEVBQ2pELFdBQXlCLEVBQ3JCLGVBQWlDLEVBQ3pCLGNBQXdDLEVBQ3RDLGtCQUE4QztZQVJuRixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ0ksb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzVCLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtZQUNyQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQ3RDLGtCQUFhLEdBQWIsYUFBYSxDQUF5QjtZQUNqRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDekIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ3RDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBNEI7UUFDeEYsQ0FBQztRQUVM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