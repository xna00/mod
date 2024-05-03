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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/tree/treeDefaults", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/common/dataTransfer", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/browser/dnd", "vs/workbench/browser/labels", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/activity/common/activity", "vs/workbench/services/extensions/common/extensions", "vs/platform/hover/browser/hover", "vs/workbench/services/views/browser/treeViewsService", "vs/platform/dnd/browser/dnd", "vs/editor/browser/dnd", "vs/workbench/browser/parts/views/checkbox", "vs/base/common/platform", "vs/platform/telemetry/common/telemetryUtils", "vs/editor/common/services/treeViewsDndService", "vs/editor/common/services/treeViewsDnd", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/css!./media/views"], function (require, exports, dnd_1, DOM, markdownRenderer_1, actionbar_1, actionViewItems_1, treeDefaults_1, actions_1, async_1, cancellation_1, codicons_1, errors_1, event_1, filters_1, htmlContent_1, lifecycle_1, mime_1, network_1, resources_1, strings_1, types_1, uri_1, uuid_1, dataTransfer_1, nls_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybinding_1, label_1, listService_1, log_1, notification_1, opener_1, progress_1, platform_1, telemetry_1, theme_1, themeService_1, themables_1, dnd_2, labels_1, editorCommands_1, viewPane_1, theme_2, views_1, activity_1, extensions_1, hover_1, treeViewsService_1, dnd_3, dnd_4, checkbox_1, platform_2, telemetryUtils_1, treeViewsDndService_1, treeViewsDnd_1, markdownRenderer_2) {
    "use strict";
    var TreeRenderer_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTreeViewDragAndDrop = exports.TreeView = exports.CustomTreeView = exports.RawCustomTreeViewContextKey = exports.TreeViewPane = void 0;
    let TreeViewPane = class TreeViewPane extends viewPane_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService) {
            super({ ...options, titleMenuId: actions_2.MenuId.ViewTitle, donotForwardArgs: false }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            const { treeView } = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(options.id);
            this.treeView = treeView;
            this._register(this.treeView.onDidChangeActions(() => this.updateActions(), this));
            this._register(this.treeView.onDidChangeTitle((newTitle) => this.updateTitle(newTitle)));
            this._register(this.treeView.onDidChangeDescription((newDescription) => this.updateTitleDescription(newDescription)));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this._container && this.treeView.container && (this._container === this.treeView.container)) {
                    this.treeView.setVisibility(false);
                }
            }));
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this._register(this.treeView.onDidChangeWelcomeState(() => this._onDidChangeViewWelcomeState.fire()));
            if (options.title !== this.treeView.title) {
                this.updateTitle(this.treeView.title);
            }
            if (options.titleDescription !== this.treeView.description) {
                this.updateTitleDescription(this.treeView.description);
            }
            this._actionRunner = new MultipleSelectionActionRunner(notificationService, () => this.treeView.getSelection());
            this.updateTreeVisibility();
        }
        focus() {
            super.focus();
            this.treeView.focus();
        }
        renderBody(container) {
            this._container = container;
            super.renderBody(container);
            this.renderTreeView(container);
        }
        shouldShowWelcome() {
            return ((this.treeView.dataProvider === undefined) || !!this.treeView.dataProvider.isTreeEmpty) && ((this.treeView.message === undefined) || (this.treeView.message === ''));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.layoutTreeView(height, width);
        }
        getOptimalWidth() {
            return this.treeView.getOptimalWidth();
        }
        renderTreeView(container) {
            this.treeView.show(container);
        }
        layoutTreeView(height, width) {
            this.treeView.layout(height, width);
        }
        updateTreeVisibility() {
            this.treeView.setVisibility(this.isBodyVisible());
        }
        getActionRunner() {
            return this._actionRunner;
        }
        getActionsContext() {
            return { $treeViewId: this.id, $focusedTreeItem: true, $selectedTreeItems: true };
        }
    };
    exports.TreeViewPane = TreeViewPane;
    exports.TreeViewPane = TreeViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, notification_1.INotificationService)
    ], TreeViewPane);
    class Root {
        constructor() {
            this.label = { label: 'root' };
            this.handle = '0';
            this.parentHandle = undefined;
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.children = undefined;
        }
    }
    function isTreeCommandEnabled(treeCommand, contextKeyService) {
        const command = commands_1.CommandsRegistry.getCommand(treeCommand.originalId ? treeCommand.originalId : treeCommand.id);
        if (command) {
            const commandAction = actions_2.MenuRegistry.getCommand(command.id);
            const precondition = commandAction && commandAction.precondition;
            if (precondition) {
                return contextKeyService.contextMatchesRules(precondition);
            }
        }
        return true;
    }
    function isRenderedMessageValue(messageValue) {
        return !!messageValue && typeof messageValue !== 'string' && 'element' in messageValue && 'dispose' in messageValue;
    }
    const noDataProviderMessage = (0, nls_1.localize)('no-dataprovider', "There is no data provider registered that can provide view data.");
    exports.RawCustomTreeViewContextKey = new contextkey_1.RawContextKey('customTreeView', false);
    class Tree extends listService_1.WorkbenchAsyncDataTree {
    }
    let AbstractTreeView = class AbstractTreeView extends lifecycle_1.Disposable {
        constructor(id, _title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, hoverService, contextKeyService, activityService, logService) {
            super();
            this.id = id;
            this._title = _title;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.viewDescriptorService = viewDescriptorService;
            this.hoverService = hoverService;
            this.contextKeyService = contextKeyService;
            this.activityService = activityService;
            this.logService = logService;
            this.isVisible = false;
            this._hasIconForParentNode = false;
            this._hasIconForLeafNode = false;
            this.focused = false;
            this._canSelectMany = false;
            this._manuallyManageCheckboxes = false;
            this.elementsToRefresh = [];
            this.lastSelection = [];
            this._onDidExpandItem = this._register(new event_1.Emitter());
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = this._register(new event_1.Emitter());
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidChangeSelectionAndFocus = this._register(new event_1.Emitter());
            this.onDidChangeSelectionAndFocus = this._onDidChangeSelectionAndFocus.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActions = this._register(new event_1.Emitter());
            this.onDidChangeActions = this._onDidChangeActions.event;
            this._onDidChangeWelcomeState = this._register(new event_1.Emitter());
            this.onDidChangeWelcomeState = this._onDidChangeWelcomeState.event;
            this._onDidChangeTitle = this._register(new event_1.Emitter());
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this._onDidChangeDescription = this._register(new event_1.Emitter());
            this.onDidChangeDescription = this._onDidChangeDescription.event;
            this._onDidChangeCheckboxState = this._register(new event_1.Emitter());
            this.onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
            this._onDidCompleteRefresh = this._register(new event_1.Emitter());
            this._isInitialized = false;
            this._activity = this._register(new lifecycle_1.MutableDisposable());
            this._height = 0;
            this._width = 0;
            this.refreshing = false;
            this.root = new Root();
            this.lastActive = this.root;
            // Try not to add anything that could be costly to this constructor. It gets called once per tree view
            // during startup, and anything added here can affect performance.
        }
        initialize() {
            if (this._isInitialized) {
                return;
            }
            this._isInitialized = true;
            // Remember when adding to this method that it isn't called until the the view is visible, meaning that
            // properties could be set and events could be fired before we're initialized and that this needs to be handled.
            this.contextKeyService.bufferChangeEvents(() => {
                this.initializeShowCollapseAllAction();
                this.initializeCollapseAllToggle();
                this.initializeShowRefreshAction();
            });
            this.treeViewDnd = this.instantiationService.createInstance(CustomTreeViewDragAndDrop, this.id);
            if (this._dragAndDropController) {
                this.treeViewDnd.controller = this._dragAndDropController;
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer.decorations')) {
                    this.doRefresh([this.root]); /** soft refresh **/
                }
            }));
            this._register(this.viewDescriptorService.onDidChangeLocation(({ views, from, to }) => {
                if (views.some(v => v.id === this.id)) {
                    this.tree?.updateOptions({ overrideStyles: { listBackground: this.viewLocation === 1 /* ViewContainerLocation.Panel */ ? theme_2.PANEL_BACKGROUND : theme_2.SIDE_BAR_BACKGROUND } });
                }
            }));
            this.registerActions();
            this.create();
        }
        get viewContainer() {
            return this.viewDescriptorService.getViewContainerByViewId(this.id);
        }
        get viewLocation() {
            return this.viewDescriptorService.getViewLocationById(this.id);
        }
        get dragAndDropController() {
            return this._dragAndDropController;
        }
        set dragAndDropController(dnd) {
            this._dragAndDropController = dnd;
            if (this.treeViewDnd) {
                this.treeViewDnd.controller = dnd;
            }
        }
        get dataProvider() {
            return this._dataProvider;
        }
        set dataProvider(dataProvider) {
            if (dataProvider) {
                const self = this;
                this._dataProvider = new class {
                    constructor() {
                        this._isEmpty = true;
                        this._onDidChangeEmpty = new event_1.Emitter();
                        this.onDidChangeEmpty = this._onDidChangeEmpty.event;
                    }
                    get isTreeEmpty() {
                        return this._isEmpty;
                    }
                    async getChildren(node) {
                        let children;
                        const checkboxesUpdated = [];
                        if (node && node.children) {
                            children = node.children;
                        }
                        else {
                            node = node ?? self.root;
                            node.children = await (node instanceof Root ? dataProvider.getChildren() : dataProvider.getChildren(node));
                            children = node.children ?? [];
                            children.forEach(child => {
                                child.parent = node;
                                if (!self.manuallyManageCheckboxes && (node?.checkbox?.isChecked === true) && (child.checkbox?.isChecked === false)) {
                                    child.checkbox.isChecked = true;
                                    checkboxesUpdated.push(child);
                                }
                            });
                        }
                        if (node instanceof Root) {
                            const oldEmpty = this._isEmpty;
                            this._isEmpty = children.length === 0;
                            if (oldEmpty !== this._isEmpty) {
                                this._onDidChangeEmpty.fire();
                            }
                        }
                        if (checkboxesUpdated.length > 0) {
                            self._onDidChangeCheckboxState.fire(checkboxesUpdated);
                        }
                        return children;
                    }
                };
                if (this._dataProvider.onDidChangeEmpty) {
                    this._register(this._dataProvider.onDidChangeEmpty(() => {
                        this.updateCollapseAllToggle();
                        this._onDidChangeWelcomeState.fire();
                    }));
                }
                this.updateMessage();
                this.refresh();
            }
            else {
                this._dataProvider = undefined;
                this.updateMessage();
            }
            this._onDidChangeWelcomeState.fire();
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
            this._onDidChangeWelcomeState.fire();
        }
        get title() {
            return this._title;
        }
        set title(name) {
            this._title = name;
            this._onDidChangeTitle.fire(this._title);
        }
        get description() {
            return this._description;
        }
        set description(description) {
            this._description = description;
            this._onDidChangeDescription.fire(this._description);
        }
        get badge() {
            return this._badge;
        }
        set badge(badge) {
            if (this._badge?.value === badge?.value &&
                this._badge?.tooltip === badge?.tooltip) {
                return;
            }
            this._badge = badge;
            if (badge) {
                const activity = {
                    badge: new activity_1.NumberBadge(badge.value, () => badge.tooltip),
                    priority: 50
                };
                this._activity.value = this.activityService.showViewActivity(this.id, activity);
            }
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            const oldCanSelectMany = this._canSelectMany;
            this._canSelectMany = canSelectMany;
            if (this._canSelectMany !== oldCanSelectMany) {
                this.tree?.updateOptions({ multipleSelectionSupport: this.canSelectMany });
            }
        }
        get manuallyManageCheckboxes() {
            return this._manuallyManageCheckboxes;
        }
        set manuallyManageCheckboxes(manuallyManageCheckboxes) {
            this._manuallyManageCheckboxes = manuallyManageCheckboxes;
        }
        get hasIconForParentNode() {
            return this._hasIconForParentNode;
        }
        get hasIconForLeafNode() {
            return this._hasIconForLeafNode;
        }
        get visible() {
            return this.isVisible;
        }
        initializeShowCollapseAllAction(startingValue = false) {
            if (!this.collapseAllContext) {
                this.collapseAllContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableCollapseAll`, startingValue, (0, nls_1.localize)('treeView.enableCollapseAll', "Whether the the tree view with id {0} enables collapse all.", this.id));
                this.collapseAllContext = this.collapseAllContextKey.bindTo(this.contextKeyService);
            }
            return true;
        }
        get showCollapseAllAction() {
            this.initializeShowCollapseAllAction();
            return !!this.collapseAllContext?.get();
        }
        set showCollapseAllAction(showCollapseAllAction) {
            this.initializeShowCollapseAllAction(showCollapseAllAction);
            this.collapseAllContext?.set(showCollapseAllAction);
        }
        initializeShowRefreshAction(startingValue = false) {
            if (!this.refreshContext) {
                this.refreshContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableRefresh`, startingValue, (0, nls_1.localize)('treeView.enableRefresh', "Whether the tree view with id {0} enables refresh.", this.id));
                this.refreshContext = this.refreshContextKey.bindTo(this.contextKeyService);
            }
        }
        get showRefreshAction() {
            this.initializeShowRefreshAction();
            return !!this.refreshContext?.get();
        }
        set showRefreshAction(showRefreshAction) {
            this.initializeShowRefreshAction(showRefreshAction);
            this.refreshContext?.set(showRefreshAction);
        }
        registerActions() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.refresh`,
                        title: (0, nls_1.localize)('refresh', "Refresh"),
                        menu: {
                            id: actions_2.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', that.id), that.refreshContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER - 1,
                        },
                        icon: codicons_1.Codicon.refresh
                    });
                }
                async run() {
                    return that.refresh();
                }
            }));
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.collapseAll`,
                        title: (0, nls_1.localize)('collapseAll', "Collapse All"),
                        menu: {
                            id: actions_2.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', that.id), that.collapseAllContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER,
                        },
                        precondition: that.collapseAllToggleContextKey,
                        icon: codicons_1.Codicon.collapseAll
                    });
                }
                async run() {
                    if (that.tree) {
                        return new treeDefaults_1.CollapseAllAction(that.tree, true).run();
                    }
                }
            }));
        }
        setVisibility(isVisible) {
            // Throughout setVisibility we need to check if the tree view's data provider still exists.
            // This can happen because the `getChildren` call to the extension can return
            // after the tree has been disposed.
            this.initialize();
            isVisible = !!isVisible;
            if (this.isVisible === isVisible) {
                return;
            }
            this.isVisible = isVisible;
            if (this.tree) {
                if (this.isVisible) {
                    DOM.show(this.tree.getHTMLElement());
                }
                else {
                    DOM.hide(this.tree.getHTMLElement()); // make sure the tree goes out of the tabindex world by hiding it
                }
                if (this.isVisible && this.elementsToRefresh.length && this.dataProvider) {
                    this.doRefresh(this.elementsToRefresh);
                    this.elementsToRefresh = [];
                }
            }
            (0, platform_2.setTimeout0)(() => {
                if (this.dataProvider) {
                    this._onDidChangeVisibility.fire(this.isVisible);
                }
            });
            if (this.visible) {
                this.activate();
            }
        }
        focus(reveal = true, revealItem) {
            if (this.tree && this.root.children && this.root.children.length > 0) {
                // Make sure the current selected element is revealed
                const element = revealItem ?? this.tree.getSelection()[0];
                if (element && reveal) {
                    this.tree.reveal(element, 0.5);
                }
                // Pass Focus to Viewer
                this.tree.domFocus();
            }
            else if (this.tree && this.treeContainer && !this.treeContainer.classList.contains('hide')) {
                this.tree.domFocus();
            }
            else {
                this.domNode.focus();
            }
        }
        show(container) {
            this._container = container;
            DOM.append(container, this.domNode);
        }
        create() {
            this.domNode = DOM.$('.tree-explorer-viewlet-tree-view');
            this.messageElement = DOM.append(this.domNode, DOM.$('.message'));
            this.updateMessage();
            this.treeContainer = DOM.append(this.domNode, DOM.$('.customview-tree'));
            this.treeContainer.classList.add('file-icon-themable-tree', 'show-file-icons');
            const focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(focusTracker.onDidFocus(() => this.focused = true));
            this._register(focusTracker.onDidBlur(() => this.focused = false));
        }
        createTree() {
            const actionViewItemProvider = menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService);
            const treeMenus = this._register(this.instantiationService.createInstance(TreeMenus, this.id));
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const dataSource = this.instantiationService.createInstance(TreeDataSource, this, (task) => this.progressService.withProgress({ location: this.id }, () => task));
            const aligner = new Aligner(this.themeService);
            const checkboxStateHandler = this._register(new checkbox_1.CheckboxStateHandler());
            const renderer = this.instantiationService.createInstance(TreeRenderer, this.id, treeMenus, this.treeLabels, actionViewItemProvider, aligner, checkboxStateHandler, () => this.manuallyManageCheckboxes);
            this._register(renderer.onDidChangeCheckboxState(e => this._onDidChangeCheckboxState.fire(e)));
            const widgetAriaLabel = this._title;
            this.tree = this._register(this.instantiationService.createInstance(Tree, this.id, this.treeContainer, new TreeViewDelegate(), [renderer], dataSource, {
                identityProvider: new TreeViewIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (element.accessibilityInformation) {
                            return element.accessibilityInformation.label;
                        }
                        if ((0, types_1.isString)(element.tooltip)) {
                            return element.tooltip;
                        }
                        else {
                            if (element.resourceUri && !element.label) {
                                // The custom tree has no good information on what should be used for the aria label.
                                // Allow the tree widget's default aria label to be used.
                                return null;
                            }
                            let buildAriaLabel = '';
                            if (element.label) {
                                buildAriaLabel += element.label.label + ' ';
                            }
                            if (element.description) {
                                buildAriaLabel += element.description;
                            }
                            return buildAriaLabel;
                        }
                    },
                    getRole(element) {
                        return element.accessibilityInformation?.role ?? 'treeitem';
                    },
                    getWidgetAriaLabel() {
                        return widgetAriaLabel;
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label ? item.label.label : (item.resourceUri ? (0, resources_1.basename)(uri_1.URI.revive(item.resourceUri)) : undefined);
                    }
                },
                expandOnlyOnTwistieClick: (e) => {
                    return !!e.command || !!e.checkbox || this.configurationService.getValue('workbench.tree.expandMode') === 'doubleClick';
                },
                collapseByDefault: (e) => {
                    return e.collapsibleState !== views_1.TreeItemCollapsibleState.Expanded;
                },
                multipleSelectionSupport: this.canSelectMany,
                dnd: this.treeViewDnd,
                overrideStyles: {
                    listBackground: this.viewLocation === 1 /* ViewContainerLocation.Panel */ ? theme_2.PANEL_BACKGROUND : theme_2.SIDE_BAR_BACKGROUND
                }
            }));
            treeMenus.setContextKeyService(this.tree.contextKeyService);
            aligner.tree = this.tree;
            const actionRunner = new MultipleSelectionActionRunner(this.notificationService, () => this.tree.getSelection());
            renderer.actionRunner = actionRunner;
            this.tree.contextKeyService.createKey(this.id, true);
            const customTreeKey = exports.RawCustomTreeViewContextKey.bindTo(this.tree.contextKeyService);
            customTreeKey.set(true);
            this._register(this.tree.onContextMenu(e => this.onContextMenu(treeMenus, e, actionRunner)));
            this._register(this.tree.onDidChangeSelection(e => {
                this.lastSelection = e.elements;
                this.lastActive = this.tree?.getFocus()[0] ?? this.lastActive;
                this._onDidChangeSelectionAndFocus.fire({ selection: this.lastSelection, focus: this.lastActive });
            }));
            this._register(this.tree.onDidChangeFocus(e => {
                if (e.elements.length && (e.elements[0] !== this.lastActive)) {
                    this.lastActive = e.elements[0];
                    this.lastSelection = this.tree?.getSelection() ?? this.lastSelection;
                    this._onDidChangeSelectionAndFocus.fire({ selection: this.lastSelection, focus: this.lastActive });
                }
            }));
            this._register(this.tree.onDidChangeCollapseState(e => {
                if (!e.node.element) {
                    return;
                }
                const element = Array.isArray(e.node.element.element) ? e.node.element.element[0] : e.node.element.element;
                if (e.node.collapsed) {
                    this._onDidCollapseItem.fire(element);
                }
                else {
                    this._onDidExpandItem.fire(element);
                }
            }));
            this.tree.setInput(this.root).then(() => this.updateContentAreas());
            this._register(this.tree.onDidOpen(async (e) => {
                if (!e.browserEvent) {
                    return;
                }
                if (e.browserEvent.target && e.browserEvent.target.classList.contains(checkbox_1.TreeItemCheckbox.checkboxClass)) {
                    return;
                }
                const selection = this.tree.getSelection();
                const command = await this.resolveCommand(selection.length === 1 ? selection[0] : undefined);
                if (command && isTreeCommandEnabled(command, this.contextKeyService)) {
                    let args = command.arguments || [];
                    if (command.id === editorCommands_1.API_OPEN_EDITOR_COMMAND_ID || command.id === editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID) {
                        // Some commands owned by us should receive the
                        // `IOpenEvent` as context to open properly
                        args = [...args, e];
                    }
                    try {
                        await this.commandService.executeCommand(command.id, ...args);
                    }
                    catch (err) {
                        this.notificationService.error(err);
                    }
                }
            }));
            this._register(treeMenus.onDidChange((changed) => {
                if (this.tree?.hasNode(changed)) {
                    this.tree?.rerender(changed);
                }
            }));
        }
        async resolveCommand(element) {
            let command = element?.command;
            if (element && !command) {
                if ((element instanceof views_1.ResolvableTreeItem) && element.hasResolve) {
                    await element.resolve(cancellation_1.CancellationToken.None);
                    command = element.command;
                }
            }
            return command;
        }
        onContextMenu(treeMenus, treeEvent, actionRunner) {
            this.hoverService.hideHover();
            const node = treeEvent.element;
            if (node === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            this.tree.setFocus([node]);
            const actions = treeMenus.getResourceContextActions(node);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ $treeViewId: this.id, $treeItemHandle: node.handle }),
                actionRunner
            });
        }
        updateMessage() {
            if (this._message) {
                this.showMessage(this._message);
            }
            else if (!this.dataProvider) {
                this.showMessage(noDataProviderMessage);
            }
            else {
                this.hideMessage();
            }
            this.updateContentAreas();
        }
        showMessage(message) {
            if (isRenderedMessageValue(this._messageValue)) {
                this._messageValue.dispose();
            }
            if ((0, htmlContent_1.isMarkdownString)(message) && !this.markdownRenderer) {
                this.markdownRenderer = this.instantiationService.createInstance(markdownRenderer_2.MarkdownRenderer, {});
            }
            this._messageValue = (0, htmlContent_1.isMarkdownString)(message) ? this.markdownRenderer.render(message) : message;
            if (!this.messageElement) {
                return;
            }
            this.messageElement.classList.remove('hide');
            this.resetMessageElement();
            if (typeof this._messageValue === 'string' && !(0, strings_1.isFalsyOrWhitespace)(this._messageValue)) {
                this.messageElement.textContent = this._messageValue;
            }
            else if (isRenderedMessageValue(this._messageValue)) {
                this.messageElement.appendChild(this._messageValue.element);
            }
            this.layout(this._height, this._width);
        }
        hideMessage() {
            this.resetMessageElement();
            this.messageElement?.classList.add('hide');
            this.layout(this._height, this._width);
        }
        resetMessageElement() {
            if (this.messageElement) {
                DOM.clearNode(this.messageElement);
            }
        }
        layout(height, width) {
            if (height && width && this.messageElement && this.treeContainer) {
                this._height = height;
                this._width = width;
                const treeHeight = height - DOM.getTotalHeight(this.messageElement);
                this.treeContainer.style.height = treeHeight + 'px';
                this.tree?.layout(treeHeight, width);
            }
        }
        getOptimalWidth() {
            if (this.tree) {
                const parentNode = this.tree.getHTMLElement();
                const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));
                return DOM.getLargestChildWidth(parentNode, childNodes);
            }
            return 0;
        }
        async refresh(elements) {
            if (this.dataProvider && this.tree) {
                if (this.refreshing) {
                    await event_1.Event.toPromise(this._onDidCompleteRefresh.event);
                }
                if (!elements) {
                    elements = [this.root];
                    // remove all waiting elements to refresh if root is asked to refresh
                    this.elementsToRefresh = [];
                }
                for (const element of elements) {
                    element.children = undefined; // reset children
                }
                if (this.isVisible) {
                    return this.doRefresh(elements);
                }
                else {
                    if (this.elementsToRefresh.length) {
                        const seen = new Set();
                        this.elementsToRefresh.forEach(element => seen.add(element.handle));
                        for (const element of elements) {
                            if (!seen.has(element.handle)) {
                                this.elementsToRefresh.push(element);
                            }
                        }
                    }
                    else {
                        this.elementsToRefresh.push(...elements);
                    }
                }
            }
            return undefined;
        }
        async expand(itemOrItems) {
            const tree = this.tree;
            if (!tree) {
                return;
            }
            try {
                itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                for (const element of itemOrItems) {
                    await tree.expand(element, false);
                }
            }
            catch (e) {
                // The extension could have changed the tree during the reveal.
                // Because of that, we ignore errors.
            }
        }
        isCollapsed(item) {
            return !!this.tree?.isCollapsed(item);
        }
        setSelection(items) {
            this.tree?.setSelection(items);
        }
        getSelection() {
            return this.tree?.getSelection() ?? [];
        }
        setFocus(item) {
            if (this.tree) {
                if (item) {
                    this.focus(true, item);
                    this.tree.setFocus([item]);
                }
                else if (this.tree.getFocus().length === 0) {
                    this.tree.setFocus([]);
                }
            }
        }
        async reveal(item) {
            if (this.tree) {
                return this.tree.reveal(item);
            }
        }
        async doRefresh(elements) {
            const tree = this.tree;
            if (tree && this.visible) {
                this.refreshing = true;
                const oldSelection = tree.getSelection();
                try {
                    await Promise.all(elements.map(element => tree.updateChildren(element, true, true)));
                }
                catch (e) {
                    // When multiple calls are made to refresh the tree in quick succession,
                    // we can get a "Tree element not found" error. This is expected.
                    // Ideally this is fixable, so log instead of ignoring so the error is preserved.
                    this.logService.error(e);
                }
                const newSelection = tree.getSelection();
                if (oldSelection.length !== newSelection.length || oldSelection.some((value, index) => value.handle !== newSelection[index].handle)) {
                    this.lastSelection = newSelection;
                    this._onDidChangeSelectionAndFocus.fire({ selection: this.lastSelection, focus: this.lastActive });
                }
                this.refreshing = false;
                this._onDidCompleteRefresh.fire();
                this.updateContentAreas();
                if (this.focused) {
                    this.focus(false);
                }
                this.updateCollapseAllToggle();
            }
        }
        initializeCollapseAllToggle() {
            if (!this.collapseAllToggleContext) {
                this.collapseAllToggleContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.toggleCollapseAll`, false, (0, nls_1.localize)('treeView.toggleCollapseAll', "Whether collapse all is toggled for the tree view with id {0}.", this.id));
                this.collapseAllToggleContext = this.collapseAllToggleContextKey.bindTo(this.contextKeyService);
            }
        }
        updateCollapseAllToggle() {
            if (this.showCollapseAllAction) {
                this.initializeCollapseAllToggle();
                this.collapseAllToggleContext?.set(!!this.root.children && (this.root.children.length > 0) &&
                    this.root.children.some(value => value.collapsibleState !== views_1.TreeItemCollapsibleState.None));
            }
        }
        updateContentAreas() {
            const isTreeEmpty = !this.root.children || this.root.children.length === 0;
            // Hide tree container only when there is a message and tree is empty and not refreshing
            if (this._messageValue && isTreeEmpty && !this.refreshing && this.treeContainer) {
                // If there's a dnd controller then hiding the tree prevents it from being dragged into.
                if (!this.dragAndDropController) {
                    this.treeContainer.classList.add('hide');
                }
                this.domNode.setAttribute('tabindex', '0');
            }
            else if (this.treeContainer) {
                this.treeContainer.classList.remove('hide');
                if (this.domNode === DOM.getActiveElement()) {
                    this.focus();
                }
                this.domNode.removeAttribute('tabindex');
            }
        }
        get container() {
            return this._container;
        }
    };
    AbstractTreeView = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, hover_1.IHoverService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, activity_1.IActivityService),
        __param(14, log_1.ILogService)
    ], AbstractTreeView);
    class TreeViewIdentityProvider {
        getId(element) {
            return element.handle;
        }
    }
    class TreeViewDelegate {
        getHeight(element) {
            return TreeRenderer.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
    }
    class TreeDataSource {
        constructor(treeView, withProgress) {
            this.treeView = treeView;
            this.withProgress = withProgress;
        }
        hasChildren(element) {
            return !!this.treeView.dataProvider && (element.collapsibleState !== views_1.TreeItemCollapsibleState.None);
        }
        async getChildren(element) {
            let result = [];
            if (this.treeView.dataProvider) {
                try {
                    result = (await this.withProgress(this.treeView.dataProvider.getChildren(element))) ?? [];
                }
                catch (e) {
                    if (!e.message.startsWith('Bad progress location:')) {
                        throw e;
                    }
                }
            }
            return result;
        }
    }
    let TreeRenderer = class TreeRenderer extends lifecycle_1.Disposable {
        static { TreeRenderer_1 = this; }
        static { this.ITEM_HEIGHT = 22; }
        static { this.TREE_TEMPLATE_ID = 'treeExplorer'; }
        constructor(treeViewId, menus, labels, actionViewItemProvider, aligner, checkboxStateHandler, manuallyManageCheckboxes, themeService, configurationService, labelService, treeViewsService, contextKeyService, instantiationService) {
            super();
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.aligner = aligner;
            this.checkboxStateHandler = checkboxStateHandler;
            this.manuallyManageCheckboxes = manuallyManageCheckboxes;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.treeViewsService = treeViewsService;
            this.contextKeyService = contextKeyService;
            this._onDidChangeCheckboxState = this._register(new event_1.Emitter());
            this.onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
            this._hasCheckbox = false;
            this._renderedElements = new Map(); // tree item handle to template data
            this._hoverDelegate = this._register(instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, 'mouse', false, {}));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.rerender()));
            this._register(this.themeService.onDidColorThemeChange(() => this.rerender()));
            this._register(checkboxStateHandler.onDidChangeCheckboxState(items => {
                this.updateCheckboxes(items);
            }));
        }
        get templateId() {
            return TreeRenderer_1.TREE_TEMPLATE_ID;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        renderTemplate(container) {
            container.classList.add('custom-view-tree-node-item');
            const checkboxContainer = DOM.append(container, DOM.$(''));
            const resourceLabel = this.labels.create(container, { supportHighlights: true, hoverDelegate: this._hoverDelegate });
            const icon = DOM.prepend(resourceLabel.element, DOM.$('.custom-view-tree-node-item-icon'));
            const actionsContainer = DOM.append(resourceLabel.element, DOM.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider
            });
            return { resourceLabel, icon, checkboxContainer, actionBar, container, elementDisposable: new lifecycle_1.DisposableStore() };
        }
        getHover(label, resource, node) {
            if (!(node instanceof views_1.ResolvableTreeItem) || !node.hasResolve) {
                if (resource && !node.tooltip) {
                    return undefined;
                }
                else if (node.tooltip === undefined) {
                    return label;
                }
                else if (!(0, types_1.isString)(node.tooltip)) {
                    return { markdown: node.tooltip, markdownNotSupportedFallback: resource ? undefined : (0, markdownRenderer_1.renderMarkdownAsPlaintext)(node.tooltip) }; // Passing undefined as the fallback for a resource falls back to the old native hover
                }
                else if (node.tooltip !== '') {
                    return node.tooltip;
                }
                else {
                    return undefined;
                }
            }
            return {
                markdown: typeof node.tooltip === 'string' ? node.tooltip :
                    (token) => {
                        return new Promise((resolve) => {
                            node.resolve(token).then(() => resolve(node.tooltip));
                        });
                    },
                markdownNotSupportedFallback: resource ? undefined : (label ?? '') // Passing undefined as the fallback for a resource falls back to the old native hover
            };
        }
        renderElement(element, index, templateData) {
            const node = element.element;
            const resource = node.resourceUri ? uri_1.URI.revive(node.resourceUri) : null;
            const treeItemLabel = node.label ? node.label : (resource ? { label: (0, resources_1.basename)(resource) } : undefined);
            const description = (0, types_1.isString)(node.description) ? node.description : resource && node.description === true ? this.labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true }) : undefined;
            const label = treeItemLabel ? treeItemLabel.label : undefined;
            const matches = (treeItemLabel && treeItemLabel.highlights && label) ? treeItemLabel.highlights.map(([start, end]) => {
                if (start < 0) {
                    start = label.length + start;
                }
                if (end < 0) {
                    end = label.length + end;
                }
                if ((start >= label.length) || (end > label.length)) {
                    return ({ start: 0, end: 0 });
                }
                if (start > end) {
                    const swap = start;
                    start = end;
                    end = swap;
                }
                return ({ start, end });
            }) : undefined;
            const icon = this.themeService.getColorTheme().type === theme_1.ColorScheme.LIGHT ? node.icon : node.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : undefined;
            const title = this.getHover(label, resource, node);
            // reset
            templateData.actionBar.clear();
            templateData.icon.style.color = '';
            let commandEnabled = true;
            if (node.command) {
                commandEnabled = isTreeCommandEnabled(node.command, this.contextKeyService);
            }
            this.renderCheckbox(node, templateData);
            if (resource) {
                const fileDecorations = this.configurationService.getValue('explorer.decorations');
                const labelResource = resource ? resource : uri_1.URI.parse('missing:_icon_resource');
                templateData.resourceLabel.setResource({ name: label, description, resource: labelResource }, {
                    fileKind: this.getFileKind(node),
                    title,
                    hideIcon: this.shouldHideResourceLabelIcon(iconUrl, node.themeIcon),
                    fileDecorations,
                    extraClasses: ['custom-view-tree-node-item-resourceLabel'],
                    matches: matches ? matches : (0, filters_1.createMatches)(element.filterData),
                    strikethrough: treeItemLabel?.strikethrough,
                    disabledCommand: !commandEnabled,
                    labelEscapeNewLines: true,
                    forceLabel: !!node.label
                });
            }
            else {
                templateData.resourceLabel.setResource({ name: label, description }, {
                    title,
                    hideIcon: true,
                    extraClasses: ['custom-view-tree-node-item-resourceLabel'],
                    matches: matches ? matches : (0, filters_1.createMatches)(element.filterData),
                    strikethrough: treeItemLabel?.strikethrough,
                    disabledCommand: !commandEnabled,
                    labelEscapeNewLines: true
                });
            }
            if (iconUrl) {
                templateData.icon.className = 'custom-view-tree-node-item-icon';
                templateData.icon.style.backgroundImage = DOM.asCSSUrl(iconUrl);
            }
            else {
                let iconClass;
                if (this.shouldShowThemeIcon(!!resource, node.themeIcon)) {
                    iconClass = themables_1.ThemeIcon.asClassName(node.themeIcon);
                    if (node.themeIcon.color) {
                        templateData.icon.style.color = this.themeService.getColorTheme().getColor(node.themeIcon.color.id)?.toString() ?? '';
                    }
                }
                templateData.icon.className = iconClass ? `custom-view-tree-node-item-icon ${iconClass}` : '';
                templateData.icon.style.backgroundImage = '';
            }
            if (!commandEnabled) {
                templateData.icon.className = templateData.icon.className + ' disabled';
                if (templateData.container.parentElement) {
                    templateData.container.parentElement.className = templateData.container.parentElement.className + ' disabled';
                }
            }
            templateData.actionBar.context = { $treeViewId: this.treeViewId, $treeItemHandle: node.handle };
            const menuActions = this.menus.getResourceActions(node, templateData.elementDisposable);
            templateData.actionBar.push(menuActions.actions, { icon: true, label: false });
            if (this._actionRunner) {
                templateData.actionBar.actionRunner = this._actionRunner;
            }
            this.setAlignment(templateData.container, node);
            this.treeViewsService.addRenderedTreeItemElement(node.handle, templateData.container);
            // remember rendered element, an element can be rendered multiple times
            const renderedItems = this._renderedElements.get(element.element.handle) ?? [];
            this._renderedElements.set(element.element.handle, [...renderedItems, { original: element, rendered: templateData }]);
        }
        rerender() {
            // As we add items to the map during this call we can't directly use the map in the for loop
            // but have to create a copy of the keys first
            const keys = new Set(this._renderedElements.keys());
            for (const key of keys) {
                const values = this._renderedElements.get(key) ?? [];
                for (const value of values) {
                    this.disposeElement(value.original, 0, value.rendered);
                    this.renderElement(value.original, 0, value.rendered);
                }
            }
        }
        renderCheckbox(node, templateData) {
            if (node.checkbox) {
                // The first time we find a checkbox we want to rerender the visible tree to adapt the alignment
                if (!this._hasCheckbox) {
                    this._hasCheckbox = true;
                    this.rerender();
                }
                if (!templateData.checkbox) {
                    const checkbox = new checkbox_1.TreeItemCheckbox(templateData.checkboxContainer, this.checkboxStateHandler, this._hoverDelegate);
                    templateData.checkbox = checkbox;
                }
                templateData.checkbox.render(node);
            }
            else if (templateData.checkbox) {
                templateData.checkbox.dispose();
                templateData.checkbox = undefined;
            }
        }
        setAlignment(container, treeItem) {
            container.parentElement.classList.toggle('align-icon-with-twisty', !this._hasCheckbox && this.aligner.alignIconWithTwisty(treeItem));
        }
        shouldHideResourceLabelIcon(iconUrl, icon) {
            // We always hide the resource label in favor of the iconUrl when it's provided.
            // When `ThemeIcon` is provided, we hide the resource label icon in favor of it only if it's a not a file icon.
            return (!!iconUrl || (!!icon && !this.isFileKindThemeIcon(icon)));
        }
        shouldShowThemeIcon(hasResource, icon) {
            if (!icon) {
                return false;
            }
            // If there's a resource and the icon is a file icon, then the icon (or lack thereof) will already be coming from the
            // icon theme and should use whatever the icon theme has provided.
            return !(hasResource && this.isFileKindThemeIcon(icon));
        }
        isFolderThemeIcon(icon) {
            return icon?.id === themeService_1.FolderThemeIcon.id;
        }
        isFileKindThemeIcon(icon) {
            if (icon) {
                return icon.id === themeService_1.FileThemeIcon.id || this.isFolderThemeIcon(icon);
            }
            else {
                return false;
            }
        }
        getFileKind(node) {
            if (node.themeIcon) {
                switch (node.themeIcon.id) {
                    case themeService_1.FileThemeIcon.id:
                        return files_1.FileKind.FILE;
                    case themeService_1.FolderThemeIcon.id:
                        return files_1.FileKind.FOLDER;
                }
            }
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Collapsed || node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
        }
        updateCheckboxes(items) {
            const additionalItems = [];
            if (!this.manuallyManageCheckboxes()) {
                for (const item of items) {
                    if (item.checkbox !== undefined) {
                        function checkChildren(currentItem) {
                            for (const child of (currentItem.children ?? [])) {
                                if ((child.checkbox !== undefined) && (currentItem.checkbox !== undefined) && (child.checkbox.isChecked !== currentItem.checkbox.isChecked)) {
                                    child.checkbox.isChecked = currentItem.checkbox.isChecked;
                                    additionalItems.push(child);
                                    checkChildren(child);
                                }
                            }
                        }
                        checkChildren(item);
                        const visitedParents = new Set();
                        function checkParents(currentItem) {
                            if (currentItem.parent && (currentItem.parent.checkbox !== undefined) && currentItem.parent.children) {
                                if (visitedParents.has(currentItem.parent)) {
                                    return;
                                }
                                else {
                                    visitedParents.add(currentItem.parent);
                                }
                                let someUnchecked = false;
                                let someChecked = false;
                                for (const child of currentItem.parent.children) {
                                    if (someUnchecked && someChecked) {
                                        break;
                                    }
                                    if (child.checkbox !== undefined) {
                                        if (child.checkbox.isChecked) {
                                            someChecked = true;
                                        }
                                        else {
                                            someUnchecked = true;
                                        }
                                    }
                                }
                                if (someChecked && !someUnchecked && (currentItem.parent.checkbox.isChecked !== true)) {
                                    currentItem.parent.checkbox.isChecked = true;
                                    additionalItems.push(currentItem.parent);
                                    checkParents(currentItem.parent);
                                }
                                else if (someUnchecked && (currentItem.parent.checkbox.isChecked !== false)) {
                                    currentItem.parent.checkbox.isChecked = false;
                                    additionalItems.push(currentItem.parent);
                                    checkParents(currentItem.parent);
                                }
                            }
                        }
                        checkParents(item);
                    }
                }
            }
            items = items.concat(additionalItems);
            items.forEach(item => {
                const renderedItems = this._renderedElements.get(item.handle);
                if (renderedItems) {
                    renderedItems.forEach(renderedItems => renderedItems.rendered.checkbox?.render(item));
                }
            });
            this._onDidChangeCheckboxState.fire(items);
        }
        disposeElement(resource, index, templateData) {
            templateData.elementDisposable.clear();
            const itemRenders = this._renderedElements.get(resource.element.handle) ?? [];
            const renderedIndex = itemRenders.findIndex(renderedItem => templateData === renderedItem.rendered);
            if (itemRenders.length === 1) {
                this._renderedElements.delete(resource.element.handle);
            }
            else if (itemRenders.length > 0) {
                itemRenders.splice(renderedIndex, 1);
            }
            this.treeViewsService.removeRenderedTreeItemElement(resource.element.handle);
            templateData.checkbox?.dispose();
            templateData.checkbox = undefined;
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
        }
    };
    TreeRenderer = TreeRenderer_1 = __decorate([
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, label_1.ILabelService),
        __param(10, treeViewsService_1.ITreeViewsService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, instantiation_1.IInstantiationService)
    ], TreeRenderer);
    class Aligner extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
        }
        set tree(tree) {
            this._tree = tree;
        }
        alignIconWithTwisty(treeItem) {
            if (treeItem.collapsibleState !== views_1.TreeItemCollapsibleState.None) {
                return false;
            }
            if (!this.hasIcon(treeItem)) {
                return false;
            }
            if (this._tree) {
                const parent = this._tree.getParentElement(treeItem) || this._tree.getInput();
                if (this.hasIcon(parent)) {
                    return !!parent.children && parent.children.some(c => c.collapsibleState !== views_1.TreeItemCollapsibleState.None && !this.hasIcon(c));
                }
                return !!parent.children && parent.children.every(c => c.collapsibleState === views_1.TreeItemCollapsibleState.None || !this.hasIcon(c));
            }
            else {
                return false;
            }
        }
        hasIcon(node) {
            const icon = this.themeService.getColorTheme().type === theme_1.ColorScheme.LIGHT ? node.icon : node.iconDark;
            if (icon) {
                return true;
            }
            if (node.resourceUri || node.themeIcon) {
                const fileIconTheme = this.themeService.getFileIconTheme();
                const isFolder = node.themeIcon ? node.themeIcon.id === themeService_1.FolderThemeIcon.id : node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
                if (isFolder) {
                    return fileIconTheme.hasFileIcons && fileIconTheme.hasFolderIcons;
                }
                return fileIconTheme.hasFileIcons;
            }
            return false;
        }
    }
    class MultipleSelectionActionRunner extends actions_1.ActionRunner {
        constructor(notificationService, getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
            this._register(this.onDidRun(e => {
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    notificationService.error((0, nls_1.localize)('command-error', 'Error running command {1}: {0}. This is likely caused by the extension that contributes {1}.', e.error.message, e.action.id));
                }
            }));
        }
        async runAction(action, context) {
            const selection = this.getSelectedResources();
            let selectionHandleArgs = undefined;
            let actionInSelected = false;
            if (selection.length > 1) {
                selectionHandleArgs = selection.map(selected => {
                    if ((selected.handle === context.$treeItemHandle) || context.$selectedTreeItems) {
                        actionInSelected = true;
                    }
                    return { $treeViewId: context.$treeViewId, $treeItemHandle: selected.handle };
                });
            }
            if (!actionInSelected) {
                selectionHandleArgs = undefined;
            }
            await action.run(context, selectionHandleArgs);
        }
    }
    let TreeMenus = class TreeMenus {
        constructor(id, menuService) {
            this.id = id;
            this.menuService = menuService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        getResourceActions(element, disposableStore) {
            const actions = this.getActions(actions_2.MenuId.ViewItemContext, element, disposableStore);
            return { menu: actions.menu, actions: actions.primary };
        }
        getResourceContextActions(element) {
            return this.getActions(actions_2.MenuId.ViewItemContext, element).secondary;
        }
        setContextKeyService(service) {
            this.contextKeyService = service;
        }
        getActions(menuId, element, listen) {
            if (!this.contextKeyService) {
                return { primary: [], secondary: [] };
            }
            const contextKeyService = this.contextKeyService.createOverlay([
                ['view', this.id],
                ['viewItem', element.contextValue]
            ]);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary, menu };
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result, 'inline');
            if (listen) {
                listen.add(menu.onDidChange(() => this._onDidChange.fire(element)));
                listen.add(menu);
            }
            else {
                menu.dispose();
            }
            return result;
        }
        dispose() {
            this.contextKeyService = undefined;
        }
    };
    TreeMenus = __decorate([
        __param(1, actions_2.IMenuService)
    ], TreeMenus);
    let CustomTreeView = class CustomTreeView extends AbstractTreeView {
        constructor(id, title, extensionId, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, contextKeyService, hoverService, extensionService, activityService, telemetryService, logService) {
            super(id, title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, hoverService, contextKeyService, activityService, logService);
            this.extensionId = extensionId;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this.activated = false;
        }
        activate() {
            if (!this.activated) {
                this.telemetryService.publicLog2('Extension:ViewActivate', {
                    extensionId: new telemetryUtils_1.TelemetryTrustedValue(this.extensionId),
                    id: this.id,
                });
                this.createTree();
                this.progressService.withProgress({ location: this.id }, () => this.extensionService.activateByEvent(`onView:${this.id}`))
                    .then(() => (0, async_1.timeout)(2000))
                    .then(() => {
                    this.updateMessage();
                });
                this.activated = true;
            }
        }
    };
    exports.CustomTreeView = CustomTreeView;
    exports.CustomTreeView = CustomTreeView = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, commands_1.ICommandService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, progress_1.IProgressService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, notification_1.INotificationService),
        __param(11, views_1.IViewDescriptorService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, hover_1.IHoverService),
        __param(14, extensions_1.IExtensionService),
        __param(15, activity_1.IActivityService),
        __param(16, telemetry_1.ITelemetryService),
        __param(17, log_1.ILogService)
    ], CustomTreeView);
    class TreeView extends AbstractTreeView {
        constructor() {
            super(...arguments);
            this.activated = false;
        }
        activate() {
            if (!this.activated) {
                this.createTree();
                this.activated = true;
            }
        }
    }
    exports.TreeView = TreeView;
    let CustomTreeViewDragAndDrop = class CustomTreeViewDragAndDrop {
        constructor(treeId, labelService, instantiationService, treeViewsDragAndDropService, logService) {
            this.treeId = treeId;
            this.labelService = labelService;
            this.instantiationService = instantiationService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.logService = logService;
            this.treeItemsTransfer = dnd_3.LocalSelectionTransfer.getInstance();
            this.treeMimeType = `application/vnd.code.tree.${treeId.toLowerCase()}`;
        }
        set controller(controller) {
            this.dndController = controller;
        }
        handleDragAndLog(dndController, itemHandles, uuid, dragCancellationToken) {
            return dndController.handleDrag(itemHandles, uuid, dragCancellationToken).then(additionalDataTransfer => {
                if (additionalDataTransfer) {
                    const unlistedTypes = [];
                    for (const item of additionalDataTransfer) {
                        if ((item[0] !== this.treeMimeType) && (dndController.dragMimeTypes.findIndex(value => value === item[0]) < 0)) {
                            unlistedTypes.push(item[0]);
                        }
                    }
                    if (unlistedTypes.length) {
                        this.logService.warn(`Drag and drop controller for tree ${this.treeId} adds the following data transfer types but does not declare them in dragMimeTypes: ${unlistedTypes.join(', ')}`);
                    }
                }
                return additionalDataTransfer;
            });
        }
        addExtensionProvidedTransferTypes(originalEvent, itemHandles) {
            if (!originalEvent.dataTransfer || !this.dndController) {
                return;
            }
            const uuid = (0, uuid_1.generateUuid)();
            this.dragCancellationToken = new cancellation_1.CancellationTokenSource();
            this.treeViewsDragAndDropService.addDragOperationTransfer(uuid, this.handleDragAndLog(this.dndController, itemHandles, uuid, this.dragCancellationToken.token));
            this.treeItemsTransfer.setData([new treeViewsDnd_1.DraggedTreeItemsIdentifier(uuid)], treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype);
            originalEvent.dataTransfer.clearData(mime_1.Mimes.text);
            if (this.dndController.dragMimeTypes.find((element) => element === mime_1.Mimes.uriList)) {
                // Add the type that the editor knows
                originalEvent.dataTransfer?.setData(dnd_1.DataTransfers.RESOURCES, '');
            }
            this.dndController.dragMimeTypes.forEach(supportedType => {
                originalEvent.dataTransfer?.setData(supportedType, '');
            });
        }
        addResourceInfoToTransfer(originalEvent, resources) {
            if (resources.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, resources, originalEvent));
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = resources.filter(s => s.scheme === network_1.Schemas.file).map(r => r.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_3.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        onDragStart(data, originalEvent) {
            if (originalEvent.dataTransfer) {
                const treeItemsData = data.getData();
                const resources = [];
                const sourceInfo = {
                    id: this.treeId,
                    itemHandles: []
                };
                treeItemsData.forEach(item => {
                    sourceInfo.itemHandles.push(item.handle);
                    if (item.resourceUri) {
                        resources.push(uri_1.URI.revive(item.resourceUri));
                    }
                });
                this.addResourceInfoToTransfer(originalEvent, resources);
                this.addExtensionProvidedTransferTypes(originalEvent, sourceInfo.itemHandles);
                originalEvent.dataTransfer.setData(this.treeMimeType, JSON.stringify(sourceInfo));
            }
        }
        debugLog(types) {
            if (types.size) {
                this.logService.debug(`TreeView dragged mime types: ${Array.from(types).join(', ')}`);
            }
            else {
                this.logService.debug(`TreeView dragged with no supported mime types.`);
            }
        }
        onDragOver(data, targetElement, targetIndex, targetSector, originalEvent) {
            const dataTransfer = (0, dnd_4.toExternalVSDataTransfer)(originalEvent.dataTransfer);
            const types = new Set(Array.from(dataTransfer, x => x[0]));
            if (originalEvent.dataTransfer) {
                // Also add uri-list if we have any files. At this stage we can't actually access the file itself though.
                for (const item of originalEvent.dataTransfer.items) {
                    if (item.kind === 'file' || item.type === dnd_1.DataTransfers.RESOURCES.toLowerCase()) {
                        types.add(mime_1.Mimes.uriList);
                        break;
                    }
                }
            }
            this.debugLog(types);
            const dndController = this.dndController;
            if (!dndController || !originalEvent.dataTransfer || (dndController.dropMimeTypes.length === 0)) {
                return false;
            }
            const dragContainersSupportedType = Array.from(types).some((value, index) => {
                if (value === this.treeMimeType) {
                    return true;
                }
                else {
                    return dndController.dropMimeTypes.indexOf(value) >= 0;
                }
            });
            if (dragContainersSupportedType) {
                return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, autoExpand: true };
            }
            return false;
        }
        getDragURI(element) {
            if (!this.dndController) {
                return null;
            }
            return element.resourceUri ? uri_1.URI.revive(element.resourceUri).toString() : element.handle;
        }
        getDragLabel(elements) {
            if (!this.dndController) {
                return undefined;
            }
            if (elements.length > 1) {
                return String(elements.length);
            }
            const element = elements[0];
            return element.label ? element.label.label : (element.resourceUri ? this.labelService.getUriLabel(uri_1.URI.revive(element.resourceUri)) : undefined);
        }
        async drop(data, targetNode, targetIndex, targetSector, originalEvent) {
            const dndController = this.dndController;
            if (!originalEvent.dataTransfer || !dndController) {
                return;
            }
            let treeSourceInfo;
            let willDropUuid;
            if (this.treeItemsTransfer.hasData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)) {
                willDropUuid = this.treeItemsTransfer.getData(treeViewsDnd_1.DraggedTreeItemsIdentifier.prototype)[0].identifier;
            }
            const originalDataTransfer = (0, dnd_4.toExternalVSDataTransfer)(originalEvent.dataTransfer, true);
            const outDataTransfer = new dataTransfer_1.VSDataTransfer();
            for (const [type, item] of originalDataTransfer) {
                if (type === this.treeMimeType || dndController.dropMimeTypes.includes(type) || (item.asFile() && dndController.dropMimeTypes.includes(dnd_1.DataTransfers.FILES.toLowerCase()))) {
                    outDataTransfer.append(type, item);
                    if (type === this.treeMimeType) {
                        try {
                            treeSourceInfo = JSON.parse(await item.asString());
                        }
                        catch {
                            // noop
                        }
                    }
                }
            }
            const additionalDataTransfer = await this.treeViewsDragAndDropService.removeDragOperationTransfer(willDropUuid);
            if (additionalDataTransfer) {
                for (const [type, item] of additionalDataTransfer) {
                    outDataTransfer.append(type, item);
                }
            }
            return dndController.handleDrop(outDataTransfer, targetNode, cancellation_1.CancellationToken.None, willDropUuid, treeSourceInfo?.id, treeSourceInfo?.itemHandles);
        }
        onDragEnd(originalEvent) {
            // Check if the drag was cancelled.
            if (originalEvent.dataTransfer?.dropEffect === 'none') {
                this.dragCancellationToken?.cancel();
            }
        }
        dispose() { }
    };
    exports.CustomTreeViewDragAndDrop = CustomTreeViewDragAndDrop;
    exports.CustomTreeViewDragAndDrop = CustomTreeViewDragAndDrop = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, treeViewsDndService_1.ITreeViewsDnDService),
        __param(4, log_1.ILogService)
    ], CustomTreeViewDragAndDrop);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3ZpZXdzL3RyZWVWaWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5RXpGLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxtQkFBUTtRQU16QyxZQUNDLE9BQTRCLEVBQ1IsaUJBQXFDLEVBQ3BDLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ2pDLHFCQUE2QyxFQUM5QyxvQkFBMkMsRUFDbEQsYUFBNkIsRUFDOUIsWUFBMkIsRUFDdkIsZ0JBQW1DLEVBQ2hDLG1CQUF5QztZQUUvRCxLQUFLLENBQUMsRUFBRSxHQUFJLE9BQTRCLEVBQUUsV0FBVyxFQUFFLGdCQUFNLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxFQUFFLGlCQUFpQixFQUFFLGtCQUFrQixFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLHFCQUFxQixFQUFFLG9CQUFvQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUNoUixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQXlCLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFFLENBQUM7WUFDdEgsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDekIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ25GLElBQUksQ0FBQyxTQUFTLENB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