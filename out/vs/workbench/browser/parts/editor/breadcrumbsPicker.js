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
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/list/browser/listService", "vs/platform/theme/common/colorRegistry", "vs/platform/workspace/common/workspace", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/platform/theme/common/themeService", "vs/nls", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/textResourceConfiguration", "vs/css!./media/breadcrumbscontrol"], function (require, exports, comparers_1, errors_1, event_1, filters_1, glob, lifecycle_1, path_1, resources_1, uri_1, configuration_1, files_1, instantiation_1, listService_1, colorRegistry_1, workspace_1, labels_1, breadcrumbs_1, themeService_1, nls_1, editorService_1, textResourceConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BreadcrumbsOutlinePicker = exports.BreadcrumbsFilePicker = exports.FileSorter = exports.BreadcrumbsPicker = void 0;
    let BreadcrumbsPicker = class BreadcrumbsPicker {
        constructor(parent, resource, _instantiationService, _themeService, _configurationService) {
            this.resource = resource;
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._fakeEvent = new UIEvent('fakeEvent');
            this._onWillPickElement = new event_1.Emitter();
            this.onWillPickElement = this._onWillPickElement.event;
            this._previewDispoables = new lifecycle_1.MutableDisposable();
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-breadcrumbs-picker show-file-icons';
            parent.appendChild(this._domNode);
        }
        dispose() {
            this._disposables.dispose();
            this._previewDispoables.dispose();
            this._onWillPickElement.dispose();
            this._domNode.remove();
            setTimeout(() => this._tree.dispose(), 0); // tree cannot be disposed while being opened...
        }
        async show(input, maxHeight, width, arrowSize, arrowOffset) {
            const theme = this._themeService.getColorTheme();
            const color = theme.getColor(colorRegistry_1.breadcrumbsPickerBackground);
            this._arrow = document.createElement('div');
            this._arrow.className = 'arrow';
            this._arrow.style.borderColor = `transparent transparent ${color ? color.toString() : ''}`;
            this._domNode.appendChild(this._arrow);
            this._treeContainer = document.createElement('div');
            this._treeContainer.style.background = color ? color.toString() : '';
            this._treeContainer.style.paddingTop = '2px';
            this._treeContainer.style.borderRadius = '3px';
            this._treeContainer.style.boxShadow = `0 0 8px 2px ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetShadow)}`;
            this._treeContainer.style.border = `1px solid ${this._themeService.getColorTheme().getColor(colorRegistry_1.widgetBorder)}`;
            this._domNode.appendChild(this._treeContainer);
            this._layoutInfo = { maxHeight, width, arrowSize, arrowOffset, inputHeight: 0 };
            this._tree = this._createTree(this._treeContainer, input);
            this._disposables.add(this._tree.onDidOpen(async (e) => {
                const { element, editorOptions, sideBySide } = e;
                const didReveal = await this._revealElement(element, { ...editorOptions, preserveFocus: false }, sideBySide);
                if (!didReveal) {
                    return;
                }
            }));
            this._disposables.add(this._tree.onDidChangeFocus(e => {
                this._previewDispoables.value = this._previewElement(e.elements[0]);
            }));
            this._disposables.add(this._tree.onDidChangeContentHeight(() => {
                this._layout();
            }));
            this._domNode.focus();
            try {
                await this._setInput(input);
                this._layout();
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
        }
        _layout() {
            const headerHeight = 2 * this._layoutInfo.arrowSize;
            const treeHeight = Math.min(this._layoutInfo.maxHeight - headerHeight, this._tree.contentHeight);
            const totalHeight = treeHeight + headerHeight;
            this._domNode.style.height = `${totalHeight}px`;
            this._domNode.style.width = `${this._layoutInfo.width}px`;
            this._arrow.style.top = `-${2 * this._layoutInfo.arrowSize}px`;
            this._arrow.style.borderWidth = `${this._layoutInfo.arrowSize}px`;
            this._arrow.style.marginLeft = `${this._layoutInfo.arrowOffset}px`;
            this._treeContainer.style.height = `${treeHeight}px`;
            this._treeContainer.style.width = `${this._layoutInfo.width}px`;
            this._tree.layout(treeHeight, this._layoutInfo.width);
        }
        restoreViewState() { }
    };
    exports.BreadcrumbsPicker = BreadcrumbsPicker;
    exports.BreadcrumbsPicker = BreadcrumbsPicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService)
    ], BreadcrumbsPicker);
    //#region - Files
    class FileVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return 'FileStat';
        }
    }
    class FileIdentityProvider {
        getId(element) {
            if (uri_1.URI.isUri(element)) {
                return element.toString();
            }
            else if ((0, workspace_1.isWorkspace)(element)) {
                return element.id;
            }
            else if ((0, workspace_1.isWorkspaceFolder)(element)) {
                return element.uri.toString();
            }
            else {
                return element.resource.toString();
            }
        }
    }
    let FileDataSource = class FileDataSource {
        constructor(_fileService) {
            this._fileService = _fileService;
        }
        hasChildren(element) {
            return uri_1.URI.isUri(element)
                || (0, workspace_1.isWorkspace)(element)
                || (0, workspace_1.isWorkspaceFolder)(element)
                || element.isDirectory;
        }
        async getChildren(element) {
            if ((0, workspace_1.isWorkspace)(element)) {
                return element.folders;
            }
            let uri;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                uri = element.uri;
            }
            else if (uri_1.URI.isUri(element)) {
                uri = element;
            }
            else {
                uri = element.resource;
            }
            const stat = await this._fileService.resolve(uri);
            return stat.children ?? [];
        }
    };
    FileDataSource = __decorate([
        __param(0, files_1.IFileService)
    ], FileDataSource);
    let FileRenderer = class FileRenderer {
        constructor(_labels, _configService) {
            this._labels = _labels;
            this._configService = _configService;
            this.templateId = 'FileStat';
        }
        renderTemplate(container) {
            return this._labels.create(container, { supportHighlights: true });
        }
        renderElement(node, index, templateData) {
            const fileDecorations = this._configService.getValue('explorer.decorations');
            const { element } = node;
            let resource;
            let fileKind;
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                resource = element.uri;
                fileKind = files_1.FileKind.ROOT_FOLDER;
            }
            else {
                resource = element.resource;
                fileKind = element.isDirectory ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            }
            templateData.setFile(resource, {
                fileKind,
                hidePath: true,
                fileDecorations: fileDecorations,
                matches: (0, filters_1.createMatches)(node.filterData),
                extraClasses: ['picker-item']
            });
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    FileRenderer = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], FileRenderer);
    class FileNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.name;
        }
    }
    class FileAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('breadcrumbs', "Breadcrumbs");
        }
        getAriaLabel(element) {
            return element.name;
        }
    }
    let FileFilter = class FileFilter {
        constructor(_workspaceService, configService) {
            this._workspaceService = _workspaceService;
            this._cachedExpressions = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            const config = breadcrumbs_1.BreadcrumbsConfig.FileExcludes.bindTo(configService);
            const update = () => {
                _workspaceService.getWorkspace().folders.forEach(folder => {
                    const excludesConfig = config.getValue({ resource: folder.uri });
                    if (!excludesConfig) {
                        return;
                    }
                    // adjust patterns to be absolute in case they aren't
                    // free floating (**/)
                    const adjustedConfig = {};
                    for (const pattern in excludesConfig) {
                        if (typeof excludesConfig[pattern] !== 'boolean') {
                            continue;
                        }
                        const patternAbs = pattern.indexOf('**/') !== 0
                            ? path_1.posix.join(folder.uri.path, pattern)
                            : pattern;
                        adjustedConfig[patternAbs] = excludesConfig[pattern];
                    }
                    this._cachedExpressions.set(folder.uri.toString(), glob.parse(adjustedConfig));
                });
            };
            update();
            this._disposables.add(config);
            this._disposables.add(config.onDidChange(update));
            this._disposables.add(_workspaceService.onDidChangeWorkspaceFolders(update));
        }
        dispose() {
            this._disposables.dispose();
        }
        filter(element, _parentVisibility) {
            if ((0, workspace_1.isWorkspaceFolder)(element)) {
                // not a file
                return true;
            }
            const folder = this._workspaceService.getWorkspaceFolder(element.resource);
            if (!folder || !this._cachedExpressions.has(folder.uri.toString())) {
                // no folder or no filer
                return true;
            }
            const expression = this._cachedExpressions.get(folder.uri.toString());
            return !expression((0, path_1.relative)(folder.uri.path, element.resource.path), (0, resources_1.basename)(element.resource));
        }
    };
    FileFilter = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService)
    ], FileFilter);
    class FileSorter {
        compare(a, b) {
            if ((0, workspace_1.isWorkspaceFolder)(a) && (0, workspace_1.isWorkspaceFolder)(b)) {
                return a.index - b.index;
            }
            if (a.isDirectory === b.isDirectory) {
                // same type -> compare on names
                return (0, comparers_1.compareFileNames)(a.name, b.name);
            }
            else if (a.isDirectory) {
                return -1;
            }
            else {
                return 1;
            }
        }
    }
    exports.FileSorter = FileSorter;
    let BreadcrumbsFilePicker = class BreadcrumbsFilePicker extends BreadcrumbsPicker {
        constructor(parent, resource, instantiationService, themeService, configService, _workspaceService, _editorService) {
            super(parent, resource, instantiationService, themeService, configService);
            this._workspaceService = _workspaceService;
            this._editorService = _editorService;
        }
        _createTree(container) {
            // tree icon theme specials
            this._treeContainer.classList.add('file-icon-themable-tree');
            this._treeContainer.classList.add('show-file-icons');
            const onFileIconThemeChange = (fileIconTheme) => {
                this._treeContainer.classList.toggle('align-icons-and-twisties', fileIconTheme.hasFileIcons && !fileIconTheme.hasFolderIcons);
                this._treeContainer.classList.toggle('hide-arrows', fileIconTheme.hidesExplorerArrows === true);
            };
            this._disposables.add(this._themeService.onDidFileIconThemeChange(onFileIconThemeChange));
            onFileIconThemeChange(this._themeService.getFileIconTheme());
            const labels = this._instantiationService.createInstance(labels_1.ResourceLabels, labels_1.DEFAULT_LABELS_CONTAINER /* TODO@Jo visibility propagation */);
            this._disposables.add(labels);
            return this._instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'BreadcrumbsFilePicker', container, new FileVirtualDelegate(), [this._instantiationService.createInstance(FileRenderer, labels)], this._instantiationService.createInstance(FileDataSource), {
                multipleSelectionSupport: false,
                sorter: new FileSorter(),
                filter: this._instantiationService.createInstance(FileFilter),
                identityProvider: new FileIdentityProvider(),
                keyboardNavigationLabelProvider: new FileNavigationLabelProvider(),
                accessibilityProvider: this._instantiationService.createInstance(FileAccessibilityProvider),
                showNotFoundMessage: false,
                overrideStyles: {
                    listBackground: colorRegistry_1.breadcrumbsPickerBackground
                },
            });
        }
        async _setInput(element) {
            const { uri, kind } = element;
            let input;
            if (kind === files_1.FileKind.ROOT_FOLDER) {
                input = this._workspaceService.getWorkspace();
            }
            else {
                input = (0, resources_1.dirname)(uri);
            }
            const tree = this._tree;
            await tree.setInput(input);
            let focusElement;
            for (const { element } of tree.getNode().children) {
                if ((0, workspace_1.isWorkspaceFolder)(element) && (0, resources_1.isEqual)(element.uri, uri)) {
                    focusElement = element;
                    break;
                }
                else if ((0, resources_1.isEqual)(element.resource, uri)) {
                    focusElement = element;
                    break;
                }
            }
            if (focusElement) {
                tree.reveal(focusElement, 0.5);
                tree.setFocus([focusElement], this._fakeEvent);
            }
            tree.domFocus();
        }
        _previewElement(_element) {
            return lifecycle_1.Disposable.None;
        }
        async _revealElement(element, options, sideBySide) {
            if (!(0, workspace_1.isWorkspaceFolder)(element) && element.isFile) {
                this._onWillPickElement.fire();
                await this._editorService.openEditor({ resource: element.resource, options }, sideBySide ? editorService_1.SIDE_GROUP : undefined);
                return true;
            }
            return false;
        }
    };
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker;
    exports.BreadcrumbsFilePicker = BreadcrumbsFilePicker = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, editorService_1.IEditorService)
    ], BreadcrumbsFilePicker);
    //#endregion
    //#region - Outline
    let OutlineTreeSorter = class OutlineTreeSorter {
        constructor(comparator, uri, configService) {
            this.comparator = comparator;
            this._order = configService.getValue(uri, 'breadcrumbs.symbolSortOrder');
        }
        compare(a, b) {
            if (this._order === 'name') {
                return this.comparator.compareByName(a, b);
            }
            else if (this._order === 'type') {
                return this.comparator.compareByType(a, b);
            }
            else {
                return this.comparator.compareByPosition(a, b);
            }
        }
    };
    OutlineTreeSorter = __decorate([
        __param(2, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], OutlineTreeSorter);
    class BreadcrumbsOutlinePicker extends BreadcrumbsPicker {
        _createTree(container, input) {
            const { config } = input.outline;
            return this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'BreadcrumbsOutlinePicker', container, config.delegate, config.renderers, config.treeDataSource, {
                ...config.options,
                sorter: this._instantiationService.createInstance(OutlineTreeSorter, config.comparator, undefined),
                collapseByDefault: true,
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                showNotFoundMessage: false
            });
        }
        _setInput(input) {
            const viewState = input.outline.captureViewState();
            this.restoreViewState = () => { viewState.dispose(); };
            const tree = this._tree;
            tree.setInput(input.outline);
            if (input.element !== input.outline) {
                tree.reveal(input.element, 0.5);
                tree.setFocus([input.element], this._fakeEvent);
            }
            tree.domFocus();
            return Promise.resolve();
        }
        _previewElement(element) {
            const outline = this._tree.getInput();
            return outline.preview(element);
        }
        async _revealElement(element, options, sideBySide) {
            this._onWillPickElement.fire();
            const outline = this._tree.getInput();
            await outline.reveal(element, options, sideBySide, false);
            return true;
        }
    }
    exports.BreadcrumbsOutlinePicker = BreadcrumbsOutlinePicker;
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWRjcnVtYnNQaWNrZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL2VkaXRvci9icmVhZGNydW1ic1BpY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4Q3pGLElBQWUsaUJBQWlCLEdBQWhDLE1BQWUsaUJBQWlCO1FBZXRDLFlBQ0MsTUFBbUIsRUFDVCxRQUFhLEVBQ0EscUJBQStELEVBQ3ZFLGFBQStDLEVBQ3ZDLHFCQUErRDtZQUg1RSxhQUFRLEdBQVIsUUFBUSxDQUFLO1lBQ21CLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDcEQsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDcEIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQWxCcEUsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUs5QyxlQUFVLEdBQUcsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7WUFHN0IsdUJBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNuRCxzQkFBaUIsR0FBZ0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztZQUV2RCx1QkFBa0IsR0FBRyxJQUFJLDZCQUFpQixFQUFFLENBQUM7WUFTN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxHQUFHLDJDQUEyQyxDQUFDO1lBQ3RFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QixJQUFJLENB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