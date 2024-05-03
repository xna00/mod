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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/instantiation", "vs/platform/markers/common/markers", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/browser/viewModel/notebookOutlineProvider", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/outline/browser/outline", "vs/editor/common/core/range", "vs/base/browser/window", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/workbench/contrib/outline/browser/outline", "vs/base/common/codicons", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, nls_1, DOM, toolbar_1, iconLabel_1, event_1, filters_1, lifecycle_1, themables_1, getIconClasses_1, configuration_1, configurationRegistry_1, instantiation_1, markers_1, platform_1, colorRegistry_1, themeService_1, contributions_1, notebookEditor_1, notebookOutlineProvider_1, notebookCommon_1, editorService_1, outline_1, range_1, window_1, contextView_1, actions_1, contextkey_1, menuEntryActionViewItem_1, async_1, outline_2, codicons_1, notebookContextKeys_1) {
    "use strict";
    var NotebookCellOutline_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookOutlineContext = exports.NotebookOutlineCreator = exports.NotebookCellOutline = void 0;
    class NotebookOutlineTemplate {
        static { this.templateId = 'NotebookOutlineRenderer'; }
        constructor(container, iconClass, iconLabel, decoration, actionMenu, elementDisposables) {
            this.container = container;
            this.iconClass = iconClass;
            this.iconLabel = iconLabel;
            this.decoration = decoration;
            this.actionMenu = actionMenu;
            this.elementDisposables = elementDisposables;
        }
    }
    let NotebookOutlineRenderer = class NotebookOutlineRenderer {
        constructor(_editor, _target, _themeService, _configurationService, _contextMenuService, _contextKeyService, _menuService, _instantiationService) {
            this._editor = _editor;
            this._target = _target;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._contextKeyService = _contextKeyService;
            this._menuService = _menuService;
            this._instantiationService = _instantiationService;
            this.templateId = NotebookOutlineTemplate.templateId;
        }
        renderTemplate(container) {
            const elementDisposables = new lifecycle_1.DisposableStore();
            container.classList.add('notebook-outline-element', 'show-file-icons');
            const iconClass = document.createElement('div');
            container.append(iconClass);
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const decoration = document.createElement('div');
            decoration.className = 'element-decoration';
            container.append(decoration);
            const actionMenu = document.createElement('div');
            actionMenu.className = 'action-menu';
            container.append(actionMenu);
            return new NotebookOutlineTemplate(container, iconClass, iconLabel, decoration, actionMenu, elementDisposables);
        }
        renderElement(node, _index, template, _height) {
            const extraClasses = [];
            const options = {
                matches: (0, filters_1.createMatches)(node.filterData),
                labelEscapeNewLines: true,
                extraClasses,
            };
            const isCodeCell = node.element.cell.cellKind === notebookCommon_1.CellKind.Code;
            if (node.element.level >= 8) { // symbol
                template.iconClass.className = 'element-icon ' + themables_1.ThemeIcon.asClassNameArray(node.element.icon).join(' ');
            }
            else if (isCodeCell && this._themeService.getFileIconTheme().hasFileIcons && !node.element.isExecuting) {
                template.iconClass.className = '';
                extraClasses.push(...(0, getIconClasses_1.getIconClassesForLanguageId)(node.element.cell.language ?? ''));
            }
            else {
                template.iconClass.className = 'element-icon ' + themables_1.ThemeIcon.asClassNameArray(node.element.icon).join(' ');
            }
            template.iconLabel.setLabel(' ' + node.element.label, undefined, options);
            const { markerInfo } = node.element;
            template.container.style.removeProperty('--outline-element-color');
            template.decoration.innerText = '';
            if (markerInfo) {
                const problem = this._configurationService.getValue('problems.visibility');
                const useBadges = this._configurationService.getValue("outline.problems.badges" /* OutlineConfigKeys.problemsBadges */);
                if (!useBadges || !problem) {
                    template.decoration.classList.remove('bubble');
                    template.decoration.innerText = '';
                }
                else if (markerInfo.count === 0) {
                    template.decoration.classList.add('bubble');
                    template.decoration.innerText = '\uea71';
                }
                else {
                    template.decoration.classList.remove('bubble');
                    template.decoration.innerText = markerInfo.count > 9 ? '9+' : String(markerInfo.count);
                }
                const color = this._themeService.getColorTheme().getColor(markerInfo.topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
                if (problem === undefined) {
                    return;
                }
                const useColors = this._configurationService.getValue("outline.problems.colors" /* OutlineConfigKeys.problemsColors */);
                if (!useColors || !problem) {
                    template.container.style.removeProperty('--outline-element-color');
                    template.decoration.style.setProperty('--outline-element-color', color?.toString() ?? 'inherit');
                }
                else {
                    template.container.style.setProperty('--outline-element-color', color?.toString() ?? 'inherit');
                }
            }
            if (this._target === 1 /* OutlineTarget.OutlinePane */) {
                const nbCell = node.element.cell;
                const nbViewModel = this._editor?.getViewModel();
                if (!nbViewModel) {
                    return;
                }
                const idx = nbViewModel.getCellIndex(nbCell);
                const length = isCodeCell ? 0 : nbViewModel.getFoldedLength(idx);
                const scopedContextKeyService = template.elementDisposables.add(this._contextKeyService.createScoped(template.container));
                exports.NotebookOutlineContext.CellKind.bindTo(scopedContextKeyService).set(isCodeCell ? notebookCommon_1.CellKind.Code : notebookCommon_1.CellKind.Markup);
                exports.NotebookOutlineContext.CellHasChildren.bindTo(scopedContextKeyService).set(length > 0);
                exports.NotebookOutlineContext.CellHasHeader.bindTo(scopedContextKeyService).set(node.element.level !== 7);
                exports.NotebookOutlineContext.OutlineElementTarget.bindTo(scopedContextKeyService).set(this._target);
                this.setupFolding(isCodeCell, nbViewModel, scopedContextKeyService, template, nbCell);
                const outlineEntryToolbar = template.elementDisposables.add(new toolbar_1.ToolBar(template.actionMenu, this._contextMenuService, {
                    actionViewItemProvider: action => {
                        if (action instanceof actions_1.MenuItemAction) {
                            return this._instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined);
                        }
                        return undefined;
                    },
                }));
                const menu = template.elementDisposables.add(this._menuService.createMenu(actions_1.MenuId.NotebookOutlineActionMenu, scopedContextKeyService));
                const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: node.element });
                outlineEntryToolbar.setActions(actions.primary, actions.secondary);
                this.setupToolbarListeners(outlineEntryToolbar, menu, actions, node.element, template);
                template.actionMenu.style.padding = '0 0.8em 0 0.4em';
            }
        }
        disposeTemplate(templateData) {
            templateData.iconLabel.dispose();
            templateData.elementDisposables.clear();
        }
        disposeElement(element, index, templateData, height) {
            templateData.elementDisposables.clear();
            DOM.clearNode(templateData.actionMenu);
        }
        setupFolding(isCodeCell, nbViewModel, scopedContextKeyService, template, nbCell) {
            const foldingState = isCodeCell ? 0 /* CellFoldingState.None */ : (nbCell.foldingState);
            const foldingStateCtx = exports.NotebookOutlineContext.CellFoldingState.bindTo(scopedContextKeyService);
            foldingStateCtx.set(foldingState);
            if (!isCodeCell) {
                template.elementDisposables.add(nbViewModel.onDidFoldingStateChanged(() => {
                    const foldingState = nbCell.foldingState;
                    exports.NotebookOutlineContext.CellFoldingState.bindTo(scopedContextKeyService).set(foldingState);
                    foldingStateCtx.set(foldingState);
                }));
            }
        }
        setupToolbarListeners(toolbar, menu, initActions, entry, templateData) {
            // same fix as in cellToolbars setupListeners re #103926
            let dropdownIsVisible = false;
            let deferredUpdate;
            toolbar.setActions(initActions.primary, initActions.secondary);
            templateData.elementDisposables.add(menu.onDidChange(() => {
                if (dropdownIsVisible) {
                    const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: entry });
                    deferredUpdate = () => toolbar.setActions(actions.primary, actions.secondary);
                    return;
                }
                const actions = getOutlineToolbarActions(menu, { notebookEditor: this._editor, outlineEntry: entry });
                toolbar.setActions(actions.primary, actions.secondary);
            }));
            templateData.container.classList.remove('notebook-outline-toolbar-dropdown-active');
            templateData.elementDisposables.add(toolbar.onDidChangeDropdownVisibility(visible => {
                dropdownIsVisible = visible;
                if (visible) {
                    templateData.container.classList.add('notebook-outline-toolbar-dropdown-active');
                }
                else {
                    templateData.container.classList.remove('notebook-outline-toolbar-dropdown-active');
                }
                if (deferredUpdate && !visible) {
                    (0, async_1.disposableTimeout)(() => {
                        deferredUpdate?.();
                    }, 0, templateData.elementDisposables);
                    deferredUpdate = undefined;
                }
            }));
        }
    };
    NotebookOutlineRenderer = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], NotebookOutlineRenderer);
    function getOutlineToolbarActions(menu, args) {
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        // TODO: @Yoyokrazy bring the "inline" back when there's an appropriate run in section icon
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true, arg: args }, result); //, g => /^inline/.test(g));
        return result;
    }
    class NotebookOutlineAccessibility {
        getAriaLabel(element) {
            return element.label;
        }
        getWidgetAriaLabel() {
            return '';
        }
    }
    class NotebookNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.label;
        }
    }
    class NotebookOutlineVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return NotebookOutlineTemplate.templateId;
        }
    }
    let NotebookQuickPickProvider = class NotebookQuickPickProvider {
        constructor(_getEntries, _themeService) {
            this._getEntries = _getEntries;
            this._themeService = _themeService;
        }
        getQuickPickElements() {
            const bucket = [];
            for (const entry of this._getEntries()) {
                entry.asFlatList(bucket);
            }
            const result = [];
            const { hasFileIcons } = this._themeService.getFileIconTheme();
            for (const element of bucket) {
                const useFileIcon = hasFileIcons && !element.symbolKind;
                // todo@jrieken it is fishy that codicons cannot be used with iconClasses
                // but file icons can...
                result.push({
                    element,
                    label: useFileIcon ? element.label : `$(${element.icon.id}) ${element.label}`,
                    ariaLabel: element.label,
                    iconClasses: useFileIcon ? (0, getIconClasses_1.getIconClassesForLanguageId)(element.cell.language ?? '') : undefined,
                });
            }
            return result;
        }
    };
    NotebookQuickPickProvider = __decorate([
        __param(1, themeService_1.IThemeService)
    ], NotebookQuickPickProvider);
    class NotebookComparator {
        constructor() {
            this._collator = new DOM.WindowIdleValue(window_1.mainWindow, () => new Intl.Collator(undefined, { numeric: true }));
        }
        compareByPosition(a, b) {
            return a.index - b.index;
        }
        compareByType(a, b) {
            return a.cell.cellKind - b.cell.cellKind || this._collator.value.compare(a.label, b.label);
        }
        compareByName(a, b) {
            return this._collator.value.compare(a.label, b.label);
        }
    }
    let NotebookCellOutline = NotebookCellOutline_1 = class NotebookCellOutline {
        get entries() {
            return this._outlineProvider?.entries ?? [];
        }
        get activeElement() {
            return this._outlineProvider?.activeElement;
        }
        constructor(_editor, _target, instantiationService, _editorService, _configurationService) {
            this._editor = _editor;
            this._editorService = _editorService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._entriesDisposables = new lifecycle_1.DisposableStore();
            this.outlineKind = 'notebookCells';
            this._localDisposables = new lifecycle_1.DisposableStore();
            const installSelectionListener = () => {
                const notebookEditor = _editor.getControl();
                if (!notebookEditor?.hasModel()) {
                    this._outlineProvider?.dispose();
                    this._outlineProvider = undefined;
                    this._localDisposables.clear();
                }
                else {
                    this._outlineProvider?.dispose();
                    this._localDisposables.clear();
                    this._outlineProvider = instantiationService.createInstance(notebookOutlineProvider_1.NotebookCellOutlineProvider, notebookEditor, _target);
                    this._localDisposables.add(this._outlineProvider.onDidChange(e => {
                        this._onDidChange.fire(e);
                    }));
                }
            };
            this._dispoables.add(_editor.onDidChangeModel(() => {
                installSelectionListener();
            }));
            installSelectionListener();
            const treeDataSource = {
                getChildren: parent => {
                    return this.getChildren(parent, _configurationService);
                }
            };
            const delegate = new NotebookOutlineVirtualDelegate();
            const renderers = [instantiationService.createInstance(NotebookOutlineRenderer, this._editor.getControl(), _target)];
            const comparator = new NotebookComparator();
            const options = {
                collapseByDefault: _target === 2 /* OutlineTarget.Breadcrumbs */ || (_target === 1 /* OutlineTarget.OutlinePane */ && _configurationService.getValue("outline.collapseItems" /* OutlineConfigKeys.collapseItems */) === "alwaysCollapse" /* OutlineConfigCollapseItemsValues.Collapsed */),
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                accessibilityProvider: new NotebookOutlineAccessibility(),
                identityProvider: { getId: element => element.cell.uri.toString() },
                keyboardNavigationLabelProvider: new NotebookNavigationLabelProvider()
            };
            this.config = {
                breadcrumbsDataSource: {
                    getBreadcrumbElements: () => {
                        const result = [];
                        let candidate = this.activeElement;
                        while (candidate) {
                            result.unshift(candidate);
                            candidate = candidate.parent;
                        }
                        return result;
                    }
                },
                quickPickDataSource: instantiationService.createInstance(NotebookQuickPickProvider, () => (this._outlineProvider?.entries ?? [])),
                treeDataSource,
                delegate,
                renderers,
                comparator,
                options
            };
        }
        *getChildren(parent, configurationService) {
            const showCodeCells = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            const showCodeCellSymbols = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            const showMarkdownHeadersOnly = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            for (const entry of parent instanceof NotebookCellOutline_1 ? (this._outlineProvider?.entries ?? []) : parent.children) {
                if (entry.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                    if (!showMarkdownHeadersOnly) {
                        yield entry;
                    }
                    else if (entry.level < 7) {
                        yield entry;
                    }
                }
                else if (showCodeCells && entry.cell.cellKind === notebookCommon_1.CellKind.Code) {
                    if (showCodeCellSymbols) {
                        yield entry;
                    }
                    else if (entry.level === 7) {
                        yield entry;
                    }
                }
            }
        }
        async setFullSymbols(cancelToken) {
            await this._outlineProvider?.setFullSymbols(cancelToken);
        }
        get uri() {
            return this._outlineProvider?.uri;
        }
        get isEmpty() {
            return this._outlineProvider?.isEmpty ?? true;
        }
        async reveal(entry, options, sideBySide) {
            await this._editorService.openEditor({
                resource: entry.cell.uri,
                options: {
                    ...options,
                    override: this._editor.input?.editorId,
                    cellRevealType: 5 /* CellRevealType.NearTopIfOutsideViewport */,
                    selection: entry.position
                },
            }, sideBySide ? editorService_1.SIDE_GROUP : undefined);
        }
        preview(entry) {
            const widget = this._editor.getControl();
            if (!widget) {
                return lifecycle_1.Disposable.None;
            }
            if (entry.range) {
                const range = range_1.Range.lift(entry.range);
                widget.revealRangeInCenterIfOutsideViewportAsync(entry.cell, range);
            }
            else {
                widget.revealInCenterIfOutsideViewport(entry.cell);
            }
            const ids = widget.deltaCellDecorations([], [{
                    handle: entry.cell.handle,
                    options: { className: 'nb-symbolHighlight', outputClassName: 'nb-symbolHighlight' }
                }]);
            let editorDecorations;
            widget.changeModelDecorations(accessor => {
                if (entry.range) {
                    const decorations = [
                        {
                            range: entry.range, options: {
                                description: 'document-symbols-outline-range-highlight',
                                className: 'rangeHighlight',
                                isWholeLine: true
                            }
                        }
                    ];
                    const deltaDecoration = {
                        ownerId: entry.cell.handle,
                        decorations: decorations
                    };
                    editorDecorations = accessor.deltaDecorations([], [deltaDecoration]);
                }
            });
            return (0, lifecycle_1.toDisposable)(() => {
                widget.deltaCellDecorations(ids, []);
                if (editorDecorations?.length) {
                    widget.changeModelDecorations(accessor => {
                        accessor.deltaDecorations(editorDecorations, []);
                    });
                }
            });
        }
        captureViewState() {
            const widget = this._editor.getControl();
            const viewState = widget?.getEditorViewState();
            return (0, lifecycle_1.toDisposable)(() => {
                if (viewState) {
                    widget?.restoreListViewState(viewState);
                }
            });
        }
        dispose() {
            this._onDidChange.dispose();
            this._dispoables.dispose();
            this._entriesDisposables.dispose();
            this._outlineProvider?.dispose();
            this._localDisposables.dispose();
        }
    };
    exports.NotebookCellOutline = NotebookCellOutline;
    exports.NotebookCellOutline = NotebookCellOutline = NotebookCellOutline_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService)
    ], NotebookCellOutline);
    let NotebookOutlineCreator = class NotebookOutlineCreator {
        constructor(outlineService, _instantiationService, _configurationService) {
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            const reg = outlineService.registerOutlineCreator(this);
            this.dispose = () => reg.dispose();
        }
        matches(candidate) {
            return candidate.getId() === notebookEditor_1.NotebookEditor.ID;
        }
        async createOutline(editor, target, cancelToken) {
            const outline = this._instantiationService.createInstance(NotebookCellOutline, editor, target);
            const showAllGotoSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.gotoSymbolsAllSymbols);
            const showAllOutlineSymbols = this._configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            if (target === 4 /* OutlineTarget.QuickPick */ && showAllGotoSymbols) {
                await outline.setFullSymbols(cancelToken);
            }
            else if (target === 1 /* OutlineTarget.OutlinePane */ && showAllOutlineSymbols) {
                await outline.setFullSymbols(cancelToken);
            }
            return outline;
        }
    };
    exports.NotebookOutlineCreator = NotebookOutlineCreator;
    exports.NotebookOutlineCreator = NotebookOutlineCreator = __decorate([
        __param(0, outline_1.IOutlineService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], NotebookOutlineCreator);
    exports.NotebookOutlineContext = {
        CellKind: new contextkey_1.RawContextKey('notebookCellKind', undefined),
        CellHasChildren: new contextkey_1.RawContextKey('notebookCellHasChildren', false),
        CellHasHeader: new contextkey_1.RawContextKey('notebookCellHasHeader', false),
        CellFoldingState: new contextkey_1.RawContextKey('notebookCellFoldingState', 0 /* CellFoldingState.None */),
        OutlineElementTarget: new contextkey_1.RawContextKey('notebookOutlineElementTarget', undefined),
    };
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookOutlineCreator, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            [notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('outline.showMarkdownHeadersOnly', "When enabled, notebook outline will show only markdown cells containing a header.")
            },
            [notebookCommon_1.NotebookSetting.outlineShowCodeCells]: {
                type: 'boolean',
                default: false,
                markdownDescription: (0, nls_1.localize)('outline.showCodeCells', "When enabled, notebook outline shows code cells.")
            },
            [notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('outline.showCodeCellSymbols', "When enabled, notebook outline shows code cell symbols. Relies on `notebook.outline.showCodeCells` being enabled.")
            },
            [notebookCommon_1.NotebookSetting.breadcrumbsShowCodeCells]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('breadcrumbs.showCodeCells', "When enabled, notebook breadcrumbs contain code cells.")
            },
            [notebookCommon_1.NotebookSetting.gotoSymbolsAllSymbols]: {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('notebook.gotoSymbols.showAllSymbols', "When enabled, the Go to Symbol Quick Pick will display full code symbols from the notebook, as well as Markdown headers.")
            },
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewTitle, {
        submenu: actions_1.MenuId.NotebookOutlineFilter,
        title: (0, nls_1.localize)('filter', "Filter Entries"),
        icon: codicons_1.Codicon.filter,
        group: 'navigation',
        order: -1,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', outline_2.IOutlinePane.Id), notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR),
    });
    (0, actions_1.registerAction2)(class ToggleShowMarkdownHeadersOnly extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleShowMarkdownHeadersOnly',
                title: (0, nls_1.localize)('toggleShowMarkdownHeadersOnly', "Markdown Headers Only"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showMarkdownHeadersOnly', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    group: '0_markdown_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showMarkdownHeadersOnly = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowMarkdownHeadersOnly, !showMarkdownHeadersOnly);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCodeCellEntries extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleCodeCells',
                title: (0, nls_1.localize)('toggleCodeCells', "Code Cells"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showCodeCells', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    order: 1,
                    group: '1_code_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showCodeCells = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowCodeCells, !showCodeCells);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCodeCellSymbolEntries extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.outline.toggleCodeCellSymbols',
                title: (0, nls_1.localize)('toggleCodeCellSymbols', "Code Cell Symbols"),
                f1: false,
                toggled: {
                    condition: contextkey_1.ContextKeyExpr.equals('config.notebook.outline.showCodeCellSymbols', true)
                },
                menu: {
                    id: actions_1.MenuId.NotebookOutlineFilter,
                    order: 2,
                    group: '1_code_cells',
                }
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const showCodeCellSymbols = configurationService.getValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols);
            configurationService.updateValue(notebookCommon_1.NotebookSetting.outlineShowCodeCellSymbols, !showCodeCellSymbols);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tPdXRsaW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvb3V0bGluZS9ub3RlYm9va091dGxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtEaEcsTUFBTSx1QkFBdUI7aUJBRVosZUFBVSxHQUFHLHlCQUF5QixDQUFDO1FBRXZELFlBQ1UsU0FBc0IsRUFDdEIsU0FBc0IsRUFDdEIsU0FBb0IsRUFDcEIsVUFBdUIsRUFDdkIsVUFBdUIsRUFDdkIsa0JBQW1DO1lBTG5DLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFDdEIsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUN0QixjQUFTLEdBQVQsU0FBUyxDQUFXO1lBQ3BCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQWlCO1FBQ3pDLENBQUM7O0lBR04sSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFJNUIsWUFDa0IsT0FBb0MsRUFDcEMsT0FBc0IsRUFDeEIsYUFBNkMsRUFDckMscUJBQTZELEVBQy9ELG1CQUF5RCxFQUMxRCxrQkFBdUQsRUFDN0QsWUFBMkMsRUFDbEMscUJBQTZEO1lBUG5FLFlBQU8sR0FBUCxPQUFPLENBQTZCO1lBQ3BDLFlBQU8sR0FBUCxPQUFPLENBQWU7WUFDUCxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNwQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDekMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUM1QyxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNqQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBVnJGLGVBQVUsR0FBVyx1QkFBdUIsQ0FBQyxVQUFVLENBQUM7UUFXcEQsQ0FBQztRQUVMLGNBQWMsQ0FBQyxTQUFzQjtZQUNwQyxNQUFNLGtCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRWpELFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDdkUsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRCxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQztZQUM1QyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDakQsVUFBVSxDQUFDLFNBQVMsR0FBRyxhQUFhLENBQUM7WUFDckMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUU3QixPQUFPLElBQUksdUJBQXVCLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFFRCxhQUFhLENBQUMsSUFBeUMsRUFBRSxNQUFjLEVBQUUsUUFBaUMsRUFBRSxPQUEyQjtZQUN0SSxNQUFNLFlBQVksR0FBYSxFQUFFLENBQUM7WUFDbEMsTUFBTSxPQUFPLEdBQTJCO2dCQUN2QyxPQUFPLEVBQUUsSUFBQSx1QkFBYSxFQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ3ZDLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLFlBQVk7YUFDWixDQUFDO1lBRUYsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsSUFBSSxDQUFDO1lBQ2hFLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTO2dCQUN2QyxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxlQUFlLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRyxDQUFDO2lCQUFNLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMxRyxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7Z0JBQ2xDLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFBLDRDQUEyQixFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxRQUFRLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxlQUFlLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxRyxDQUFDO1lBRUQsUUFBUSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUUxRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUVwQyxRQUFRLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNuRSxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDbkMsSUFBSSxVQUFVLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxrRUFBa0MsQ0FBQztnQkFFeEYsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM1QixRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQy9DLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDcEMsQ0FBQztxQkFBTSxJQUFJLFVBQVUsQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25DLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFDNUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO2dCQUMxQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUMvQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4RixDQUFDO2dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssd0JBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLG1DQUFtQixDQUFDLENBQUMsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO2dCQUNwSixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDM0IsT0FBTztnQkFDUixDQUFDO2dCQUNELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLGtFQUFrQyxDQUFDO2dCQUN4RixJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzVCLFFBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO29CQUNuRSxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMseUJBQXlCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLHlCQUF5QixFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBQztnQkFDakcsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLHNDQUE4QixFQUFFLENBQUM7Z0JBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO2dCQUNqQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO2dCQUNqRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ2xCLE9BQU87Z0JBQ1IsQ0FBQztnQkFDRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFFakUsTUFBTSx1QkFBdUIsR0FBRyxRQUFRLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFILDhCQUFzQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyx5QkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMseUJBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEgsOEJBQXNCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLDhCQUFzQixDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ25HLDhCQUFzQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlGLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSx1QkFBdUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXRGLE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLGlCQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7b0JBQ3RILHNCQUFzQixFQUFFLE1BQU0sQ0FBQyxFQUFFO3dCQUNoQyxJQUFJLE1BQU0sWUFBWSx3QkFBYyxFQUFFLENBQUM7NEJBQ3RDLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxpREFBdUIsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQzlGLENBQUM7d0JBQ0QsT0FBTyxTQUFTLENBQUM7b0JBQ2xCLENBQUM7aUJBQ0QsQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxnQkFBTSxDQUFDLHlCQUF5QixFQUFFLHVCQUF1QixDQUFDLENBQUMsQ0FBQztnQkFDdEksTUFBTSxPQUFPLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUM3RyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRW5FLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZGLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQztZQUN2RCxDQUFDO1FBQ0YsQ0FBQztRQUVELGVBQWUsQ0FBQyxZQUFxQztZQUNwRCxZQUFZLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pDLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRUQsY0FBYyxDQUFDLE9BQTRDLEVBQUUsS0FBYSxFQUFFLFlBQXFDLEVBQUUsTUFBMEI7WUFDNUksWUFBWSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hDLEdBQUcsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFTyxZQUFZLENBQUMsVUFBbUIsRUFBRSxXQUErQixFQUFFLHVCQUEyQyxFQUFFLFFBQWlDLEVBQUUsTUFBc0I7WUFDaEwsTUFBTSxZQUFZLEdBQUcsVUFBVSxDQUFDLENBQUMsK0JBQXVCLENBQUMsQ0FBQyxDQUFFLE1BQThCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekcsTUFBTSxlQUFlLEdBQUcsOEJBQXNCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDaEcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVsQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRTtvQkFDekUsTUFBTSxZQUFZLEdBQUksTUFBOEIsQ0FBQyxZQUFZLENBQUM7b0JBQ2xFLDhCQUFzQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztvQkFDMUYsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRU8scUJBQXFCLENBQUMsT0FBZ0IsRUFBRSxJQUFXLEVBQUUsV0FBeUQsRUFBRSxLQUFtQixFQUFFLFlBQXFDO1lBQ2pMLHdEQUF3RDtZQUN4RCxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUM5QixJQUFJLGNBQXdDLENBQUM7WUFFN0MsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCxZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO2dCQUN6RCxJQUFJLGlCQUFpQixFQUFFLENBQUM7b0JBQ3ZCLE1BQU0sT0FBTyxHQUFHLHdCQUF3QixDQUFDLElBQUksRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUN0RyxjQUFjLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFFOUUsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sT0FBTyxHQUFHLHdCQUF3QixDQUFDLElBQUksRUFBRSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSixZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsMENBQTBDLENBQUMsQ0FBQztZQUNwRixZQUFZLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDbkYsaUJBQWlCLEdBQUcsT0FBTyxDQUFDO2dCQUM1QixJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNiLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO2dCQUNsRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7Z0JBRUQsSUFBSSxjQUFjLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDaEMsSUFBQSx5QkFBaUIsRUFBQyxHQUFHLEVBQUU7d0JBQ3RCLGNBQWMsRUFBRSxFQUFFLENBQUM7b0JBQ3BCLENBQUMsRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7b0JBRXZDLGNBQWMsR0FBRyxTQUFTLENBQUM7Z0JBQzVCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRUwsQ0FBQztLQUNELENBQUE7SUFsTEssdUJBQXVCO1FBTzFCLFdBQUEsNEJBQWEsQ0FBQTtRQUNiLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsc0JBQVksQ0FBQTtRQUNaLFdBQUEscUNBQXFCLENBQUE7T0FabEIsdUJBQXVCLENBa0w1QjtJQUVELFNBQVMsd0JBQXdCLENBQUMsSUFBVyxFQUFFLElBQTBCO1FBQ3hFLE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztRQUM5QixNQUFNLFNBQVMsR0FBYyxFQUFFLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLENBQUM7UUFFdEMsMkZBQTJGO1FBQzNGLElBQUEseURBQStCLEVBQUMsSUFBSSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLDRCQUE0QjtRQUVuSCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxNQUFNLDRCQUE0QjtRQUNqQyxZQUFZLENBQUMsT0FBcUI7WUFDakMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUM7UUFDRCxrQkFBa0I7WUFDakIsT0FBTyxFQUFFLENBQUM7UUFDWCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLCtCQUErQjtRQUNwQywwQkFBMEIsQ0FBQyxPQUFxQjtZQUMvQyxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUM7UUFDdEIsQ0FBQztLQUNEO0lBRUQsTUFBTSw4QkFBOEI7UUFFbkMsU0FBUyxDQUFDLFFBQXNCO1lBQy9CLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELGFBQWEsQ0FBQyxRQUFzQjtZQUNuQyxPQUFPLHVCQUF1QixDQUFDLFVBQVUsQ0FBQztRQUMzQyxDQUFDO0tBQ0Q7SUFFRCxJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUF5QjtRQUU5QixZQUNTLFdBQWlDLEVBQ1QsYUFBNEI7WUFEcEQsZ0JBQVcsR0FBWCxXQUFXLENBQXNCO1lBQ1Qsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFDekQsQ0FBQztRQUVMLG9CQUFvQjtZQUNuQixNQUFNLE1BQU0sR0FBbUIsRUFBRSxDQUFDO1lBQ2xDLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUIsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUE2QyxFQUFFLENBQUM7WUFDNUQsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUUvRCxLQUFLLE1BQU0sT0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixNQUFNLFdBQVcsR0FBRyxZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO2dCQUN4RCx5RUFBeUU7Z0JBQ3pFLHdCQUF3QjtnQkFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDWCxPQUFPO29CQUNQLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssT0FBTyxDQUFDLEtBQUssRUFBRTtvQkFDN0UsU0FBUyxFQUFFLE9BQU8sQ0FBQyxLQUFLO29CQUN4QixXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLDRDQUEyQixFQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO2lCQUMvRixDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0QsQ0FBQTtJQTVCSyx5QkFBeUI7UUFJNUIsV0FBQSw0QkFBYSxDQUFBO09BSlYseUJBQXlCLENBNEI5QjtJQUVELE1BQU0sa0JBQWtCO1FBQXhCO1lBRWtCLGNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQWdCLG1CQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFXeEksQ0FBQztRQVRBLGlCQUFpQixDQUFDLENBQWUsRUFBRSxDQUFlO1lBQ2pELE9BQU8sQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzFCLENBQUM7UUFDRCxhQUFhLENBQUMsQ0FBZSxFQUFFLENBQWU7WUFDN0MsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUYsQ0FBQztRQUNELGFBQWEsQ0FBQyxDQUFlLEVBQUUsQ0FBZTtZQUM3QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2RCxDQUFDO0tBQ0Q7SUFFTSxJQUFNLG1CQUFtQiwyQkFBekIsTUFBTSxtQkFBbUI7UUFRL0IsSUFBSSxPQUFPO1lBQ1YsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBUUQsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQztRQUM3QyxDQUFDO1FBS0QsWUFDa0IsT0FBNEIsRUFDN0MsT0FBc0IsRUFDQyxvQkFBMkMsRUFDbEQsY0FBK0MsRUFDeEMscUJBQTRDO1lBSmxELFlBQU8sR0FBUCxPQUFPLENBQXFCO1lBR1osbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBM0IvQyxnQkFBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRXBDLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQXNCLENBQUM7WUFFekQsZ0JBQVcsR0FBOEIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFNekQsd0JBQW1CLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFJcEQsZ0JBQVcsR0FBRyxlQUFlLENBQUM7WUFPdEIsc0JBQWlCLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFTMUQsTUFBTSx3QkFBd0IsR0FBRyxHQUFHLEVBQUU7Z0JBQ3JDLE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7b0JBQ2xDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDakMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFEQUEyQixFQUFFLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztvQkFDbEgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO3dCQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBRUYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRTtnQkFDbEQsd0JBQXdCLEVBQUUsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosd0JBQXdCLEVBQUUsQ0FBQztZQUMzQixNQUFNLGNBQWMsR0FBb0M7Z0JBQ3ZELFdBQVcsRUFBRSxNQUFNLENBQUMsRUFBRTtvQkFDckIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO2dCQUN4RCxDQUFDO2FBQ0QsQ0FBQztZQUNGLE1BQU0sUUFBUSxHQUFHLElBQUksOEJBQThCLEVBQUUsQ0FBQztZQUN0RCxNQUFNLFNBQVMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDckgsTUFBTSxVQUFVLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBRTVDLE1BQU0sT0FBTyxHQUF3RDtnQkFDcEUsaUJBQWlCLEVBQUUsT0FBTyxzQ0FBOEIsSUFBSSxDQUFDLE9BQU8sc0NBQThCLElBQUkscUJBQXFCLENBQUMsUUFBUSwrREFBaUMsc0VBQStDLENBQUM7Z0JBQ3JOLHdCQUF3QixFQUFFLElBQUk7Z0JBQzlCLHdCQUF3QixFQUFFLEtBQUs7Z0JBQy9CLHFCQUFxQixFQUFFLElBQUksNEJBQTRCLEVBQUU7Z0JBQ3pELGdCQUFnQixFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ25FLCtCQUErQixFQUFFLElBQUksK0JBQStCLEVBQUU7YUFDdEUsQ0FBQztZQUVGLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ2IscUJBQXFCLEVBQUU7b0JBQ3RCLHFCQUFxQixFQUFFLEdBQUcsRUFBRTt3QkFDM0IsTUFBTSxNQUFNLEdBQW1CLEVBQUUsQ0FBQzt3QkFDbEMsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQzt3QkFDbkMsT0FBTyxTQUFTLEVBQUUsQ0FBQzs0QkFDbEIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzs0QkFDMUIsU0FBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7d0JBQzlCLENBQUM7d0JBQ0QsT0FBTyxNQUFNLENBQUM7b0JBQ2YsQ0FBQztpQkFDRDtnQkFDRCxtQkFBbUIsRUFBRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNqSSxjQUFjO2dCQUNkLFFBQVE7Z0JBQ1IsU0FBUztnQkFDVCxVQUFVO2dCQUNWLE9BQU87YUFDUCxDQUFDO1FBQ0gsQ0FBQztRQUVELENBQUMsV0FBVyxDQUFDLE1BQTBDLEVBQUUsb0JBQTJDO1lBQ25HLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDbkcsTUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUsZ0NBQWUsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQy9HLE1BQU0sdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFVLGdDQUFlLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUV2SCxLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sWUFBWSxxQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3RILElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7d0JBQzlCLE1BQU0sS0FBSyxDQUFDO29CQUNiLENBQUM7eUJBQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM1QixNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO2dCQUVGLENBQUM7cUJBQU0sSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUsseUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDbkUsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO3dCQUN6QixNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO3lCQUFNLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDOUIsTUFBTSxLQUFLLENBQUM7b0JBQ2IsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFdBQThCO1lBQ2xELE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsSUFBSSxHQUFHO1lBQ04sT0FBTyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLElBQUksSUFBSSxDQUFDO1FBQy9DLENBQUM7UUFDRCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQW1CLEVBQUUsT0FBdUIsRUFBRSxVQUFtQjtZQUM3RSxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO2dCQUNwQyxRQUFRLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHO2dCQUN4QixPQUFPLEVBQUU7b0JBQ1IsR0FBRyxPQUFPO29CQUNWLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRO29CQUN0QyxjQUFjLGlEQUF5QztvQkFDdkQsU0FBUyxFQUFFLEtBQUssQ0FBQyxRQUFRO2lCQUNDO2FBQzNCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQywwQkFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBRUQsT0FBTyxDQUFDLEtBQW1CO1lBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUdELElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixNQUFNLEtBQUssR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLHlDQUF5QyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDNUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTTtvQkFDekIsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxvQkFBb0IsRUFBRTtpQkFDbkYsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLGlCQUEwQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDeEMsSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ2pCLE1BQU0sV0FBVyxHQUE0Qjt3QkFDNUM7NEJBQ0MsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFO2dDQUM1QixXQUFXLEVBQUUsMENBQTBDO2dDQUN2RCxTQUFTLEVBQUUsZ0JBQWdCO2dDQUMzQixXQUFXLEVBQUUsSUFBSTs2QkFDakI7eUJBQ0Q7cUJBQ0QsQ0FBQztvQkFDRixNQUFNLGVBQWUsR0FBK0I7d0JBQ25ELE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU07d0JBQzFCLFdBQVcsRUFBRSxXQUFXO3FCQUN4QixDQUFDO29CQUVGLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUN0RSxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JDLElBQUksaUJBQWlCLEVBQUUsTUFBTSxFQUFFLENBQUM7b0JBQy9CLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsRUFBRTt3QkFDeEMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxDQUFDO29CQUNsRCxDQUFDLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFFSixDQUFDO1FBRUQsZ0JBQWdCO1lBQ2YsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUN6QyxNQUFNLFNBQVMsR0FBRyxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztZQUMvQyxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxFQUFFLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN6QyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQ0QsQ0FBQTtJQTdNWSxrREFBbUI7a0NBQW5CLG1CQUFtQjtRQTRCN0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFjLENBQUE7UUFDZCxXQUFBLHFDQUFxQixDQUFBO09BOUJYLG1CQUFtQixDQTZNL0I7SUFFTSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQUlsQyxZQUNrQixjQUErQixFQUNSLHFCQUE0QyxFQUM1QyxxQkFBNEM7WUFENUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM1QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBRXBGLE1BQU0sR0FBRyxHQUFHLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN4RCxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTyxDQUFDLFNBQXNCO1lBQzdCLE9BQU8sU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLCtCQUFjLENBQUMsRUFBRSxDQUFDO1FBQ2hELENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQXNCLEVBQUUsTUFBcUIsRUFBRSxXQUE4QjtZQUNoRyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUUvRixNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQVUsZ0NBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQy9HLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDdkgsSUFBSSxNQUFNLG9DQUE0QixJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQzlELE1BQU0sT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMzQyxDQUFDO2lCQUFNLElBQUksTUFBTSxzQ0FBOEIsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO2dCQUMxRSxNQUFNLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7S0FDRCxDQUFBO0lBOUJZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBS2hDLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtPQVBYLHNCQUFzQixDQThCbEM7SUFFWSxRQUFBLHNCQUFzQixHQUFHO1FBQ3JDLFFBQVEsRUFBRSxJQUFJLDBCQUFhLENBQVcsa0JBQWtCLEVBQUUsU0FBUyxDQUFDO1FBQ3BFLGVBQWUsRUFBRSxJQUFJLDBCQUFhLENBQVUseUJBQXlCLEVBQUUsS0FBSyxDQUFDO1FBQzdFLGFBQWEsRUFBRSxJQUFJLDBCQUFhLENBQVUsdUJBQXVCLEVBQUUsS0FBSyxDQUFDO1FBQ3pFLGdCQUFnQixFQUFFLElBQUksMEJBQWEsQ0FBbUIsMEJBQTBCLGdDQUF3QjtRQUN4RyxvQkFBb0IsRUFBRSxJQUFJLDBCQUFhLENBQWdCLDhCQUE4QixFQUFFLFNBQVMsQ0FBQztLQUNqRyxDQUFDO0lBRUYsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLHNCQUFzQixvQ0FBNEIsQ0FBQztJQUU3SixtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMscUJBQXFCLENBQUM7UUFDaEcsRUFBRSxFQUFFLFVBQVU7UUFDZCxLQUFLLEVBQUUsR0FBRztRQUNWLElBQUksRUFBRSxRQUFRO1FBQ2QsWUFBWSxFQUFFO1lBQ2IsQ0FBQyxnQ0FBZSxDQUFDLDhCQUE4QixDQUFDLEVBQUU7Z0JBQ2pELElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLGlDQUFpQyxFQUFFLG1GQUFtRixDQUFDO2FBQ3JKO1lBQ0QsQ0FBQyxnQ0FBZSxDQUFDLG9CQUFvQixDQUFDLEVBQUU7Z0JBQ3ZDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxLQUFLO2dCQUNkLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLGtEQUFrRCxDQUFDO2FBQzFHO1lBQ0QsQ0FBQyxnQ0FBZSxDQUFDLDBCQUEwQixDQUFDLEVBQUU7Z0JBQzdDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLG1IQUFtSCxDQUFDO2FBQ2pMO1lBQ0QsQ0FBQyxnQ0FBZSxDQUFDLHdCQUF3QixDQUFDLEVBQUU7Z0JBQzNDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLHdEQUF3RCxDQUFDO2FBQ3BIO1lBQ0QsQ0FBQyxnQ0FBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7Z0JBQ3hDLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRSxJQUFJO2dCQUNiLG1CQUFtQixFQUFFLElBQUEsY0FBUSxFQUFDLHFDQUFxQyxFQUFFLDBIQUEwSCxDQUFDO2FBQ2hNO1NBQ0Q7S0FDRCxDQUFDLENBQUM7SUFFSCxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLFNBQVMsRUFBRTtRQUM3QyxPQUFPLEVBQUUsZ0JBQU0sQ0FBQyxxQkFBcUI7UUFDckMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQztRQUMzQyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxNQUFNO1FBQ3BCLEtBQUssRUFBRSxZQUFZO1FBQ25CLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDVCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsMkJBQWMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLHNCQUFZLENBQUMsRUFBRSxDQUFDLEVBQUUsK0NBQXlCLENBQUM7S0FDbkcsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sNkJBQThCLFNBQVEsaUJBQU87UUFDbEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLGdEQUFnRDtnQkFDcEQsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLCtCQUErQixFQUFFLHVCQUF1QixDQUFDO2dCQUN6RSxFQUFFLEVBQUUsS0FBSztnQkFDVCxPQUFPLEVBQUU7b0JBQ1IsU0FBUyxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLGlEQUFpRCxFQUFFLElBQUksQ0FBQztpQkFDekY7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtvQkFDaEMsS0FBSyxFQUFFLGtCQUFrQjtpQkFDekI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sdUJBQXVCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFVLGdDQUFlLENBQUMsOEJBQThCLENBQUMsQ0FBQztZQUN2SCxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsZ0NBQWUsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLHVCQUF1QixDQUFDLENBQUM7UUFDNUcsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdILElBQUEseUJBQWUsRUFBQyxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1FBQzFEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxrQ0FBa0M7Z0JBQ3RDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUM7Z0JBQ2hELEVBQUUsRUFBRSxLQUFLO2dCQUNULE9BQU8sRUFBRTtvQkFDUixTQUFTLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxDQUFDO2lCQUMvRTtnQkFDRCxJQUFJLEVBQUU7b0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMscUJBQXFCO29CQUNoQyxLQUFLLEVBQUUsQ0FBQztvQkFDUixLQUFLLEVBQUUsY0FBYztpQkFDckI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE1BQU0sb0JBQW9CLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDbkcsb0JBQW9CLENBQUMsV0FBVyxDQUFDLGdDQUFlLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN4RixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sMkJBQTRCLFNBQVEsaUJBQU87UUFDaEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdDQUF3QztnQkFDNUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLG1CQUFtQixDQUFDO2dCQUM3RCxFQUFFLEVBQUUsS0FBSztnQkFDVCxPQUFPLEVBQUU7b0JBQ1IsU0FBUyxFQUFFLDJCQUFjLENBQUMsTUFBTSxDQUFDLDZDQUE2QyxFQUFFLElBQUksQ0FBQztpQkFDckY7Z0JBQ0QsSUFBSSxFQUFFO29CQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLHFCQUFxQjtvQkFDaEMsS0FBSyxFQUFFLENBQUM7b0JBQ1IsS0FBSyxFQUFFLGNBQWM7aUJBQ3JCO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxRQUEwQixFQUFFLEdBQUcsSUFBVztZQUM3QyxNQUFNLG9CQUFvQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUNBQXFCLENBQUMsQ0FBQztZQUNqRSxNQUFNLG1CQUFtQixHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBVSxnQ0FBZSxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDL0csb0JBQW9CLENBQUMsV0FBVyxDQUFDLGdDQUFlLENBQUMsMEJBQTBCLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7S0FDRCxDQUFDLENBQUMifQ==