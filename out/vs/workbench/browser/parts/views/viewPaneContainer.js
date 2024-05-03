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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/browser/ui/splitview/paneview", "vs/base/common/async", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions", "vs/workbench/browser/dnd", "vs/workbench/common/component", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/common/contextkeys", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/paneviewlet"], function (require, exports, dom_1, mouseEvent_1, touch_1, paneview_1, async_1, event_1, keyCodes_1, lifecycle_1, types_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, workspace_1, actions_2, dnd_1, component_1, theme_1, views_1, viewsService_1, contextkeys_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewPaneContainerAction = exports.ViewPaneContainer = exports.ViewsSubMenu = void 0;
    exports.ViewsSubMenu = new actions_1.MenuId('Views');
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        submenu: exports.ViewsSubMenu,
        title: nls.localize('views', "Views"),
        order: 1,
    });
    var DropDirection;
    (function (DropDirection) {
        DropDirection[DropDirection["UP"] = 0] = "UP";
        DropDirection[DropDirection["DOWN"] = 1] = "DOWN";
        DropDirection[DropDirection["LEFT"] = 2] = "LEFT";
        DropDirection[DropDirection["RIGHT"] = 3] = "RIGHT";
    })(DropDirection || (DropDirection = {}));
    class ViewPaneDropOverlay extends themeService_1.Themable {
        static { this.OVERLAY_ID = 'monaco-pane-drop-overlay'; }
        get currentDropOperation() {
            return this._currentDropOperation;
        }
        constructor(paneElement, orientation, bounds, location, themeService) {
            super(themeService);
            this.paneElement = paneElement;
            this.orientation = orientation;
            this.bounds = bounds;
            this.location = location;
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.create();
        }
        get disposed() {
            return !!this._disposed;
        }
        create() {
            // Container
            this.container = document.createElement('div');
            this.container.id = ViewPaneDropOverlay.OVERLAY_ID;
            this.container.style.top = '0px';
            // Parent
            this.paneElement.appendChild(this.container);
            this.paneElement.classList.add('dragged-over');
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.paneElement.removeChild(this.container);
                this.paneElement.classList.remove('dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('pane-overlay-indicator');
            this.container.appendChild(this.overlay);
            // Overlay Event Handling
            this.registerListeners();
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            // Overlay drop background
            this.overlay.style.backgroundColor = this.getColor(this.location === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            this.overlay.style.outlineColor = activeContrastBorderColor || '';
            this.overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            this.overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            this.overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            this.overlay.style.borderColor = activeContrastBorderColor || '';
            this.overlay.style.borderStyle = 'solid';
            this.overlay.style.borderWidth = '0px';
        }
        registerListeners() {
            this._register(new dom_1.DragAndDropObserver(this.container, {
                onDragOver: e => {
                    // Position overlay
                    this.positionOverlay(e.offsetX, e.offsetY);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    // Dispose overlay
                    this.dispose();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        positionOverlay(mousePosX, mousePosY) {
            const paneWidth = this.paneElement.clientWidth;
            const paneHeight = this.paneElement.clientHeight;
            const splitWidthThreshold = paneWidth / 2;
            const splitHeightThreshold = paneHeight / 2;
            let dropDirection;
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                if (mousePosY < splitHeightThreshold) {
                    dropDirection = 0 /* DropDirection.UP */;
                }
                else if (mousePosY >= splitHeightThreshold) {
                    dropDirection = 1 /* DropDirection.DOWN */;
                }
            }
            else if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                if (mousePosX < splitWidthThreshold) {
                    dropDirection = 2 /* DropDirection.LEFT */;
                }
                else if (mousePosX >= splitWidthThreshold) {
                    dropDirection = 3 /* DropDirection.RIGHT */;
                }
            }
            // Draw overlay based on split direction
            switch (dropDirection) {
                case 0 /* DropDirection.UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 1 /* DropDirection.DOWN */:
                    this.doPositionOverlay({ bottom: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 2 /* DropDirection.LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    break;
                case 3 /* DropDirection.RIGHT */:
                    this.doPositionOverlay({ top: '0', right: '0', width: '50%', height: '100%' });
                    break;
                default: {
                    // const top = this.bounds?.top || 0;
                    // const left = this.bounds?.bottom || 0;
                    let top = '0';
                    let left = '0';
                    let width = '100%';
                    let height = '100%';
                    if (this.bounds) {
                        const boundingRect = this.container.getBoundingClientRect();
                        top = `${this.bounds.top - boundingRect.top}px`;
                        left = `${this.bounds.left - boundingRect.left}px`;
                        height = `${this.bounds.bottom - this.bounds.top}px`;
                        width = `${this.bounds.right - this.bounds.left}px`;
                    }
                    this.doPositionOverlay({ top, left, width, height });
                }
            }
            if ((this.orientation === 0 /* Orientation.VERTICAL */ && paneHeight <= 25) ||
                (this.orientation === 1 /* Orientation.HORIZONTAL */ && paneWidth <= 25)) {
                this.doUpdateOverlayBorder(dropDirection);
            }
            else {
                this.doUpdateOverlayBorder(undefined);
            }
            // Make sure the overlay is visible now
            this.overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => this.overlay.classList.add('overlay-move-transition'), 0);
            // Remember as current split direction
            this._currentDropOperation = dropDirection;
        }
        doUpdateOverlayBorder(direction) {
            this.overlay.style.borderTopWidth = direction === 0 /* DropDirection.UP */ ? '2px' : '0px';
            this.overlay.style.borderLeftWidth = direction === 2 /* DropDirection.LEFT */ ? '2px' : '0px';
            this.overlay.style.borderBottomWidth = direction === 1 /* DropDirection.DOWN */ ? '2px' : '0px';
            this.overlay.style.borderRightWidth = direction === 3 /* DropDirection.RIGHT */ ? '2px' : '0px';
        }
        doPositionOverlay(options) {
            // Container
            this.container.style.height = '100%';
            // Overlay
            this.overlay.style.top = options.top || '';
            this.overlay.style.left = options.left || '';
            this.overlay.style.bottom = options.bottom || '';
            this.overlay.style.right = options.right || '';
            this.overlay.style.width = options.width;
            this.overlay.style.height = options.height;
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    }
    let ViewContainerMenuActions = class ViewContainerMenuActions extends actions_2.CompositeMenuActions {
        constructor(element, viewContainer, viewDescriptorService, contextKeyService, menuService) {
            const scopedContextKeyService = contextKeyService.createScoped(element);
            scopedContextKeyService.createKey('viewContainer', viewContainer.id);
            const viewContainerLocationKey = scopedContextKeyService.createKey('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewContainerLocation(viewContainer)));
            super(actions_1.MenuId.ViewContainerTitle, actions_1.MenuId.ViewContainerTitleContext, { shouldForwardArgs: true, renderShortTitle: true }, scopedContextKeyService, menuService);
            this._register(scopedContextKeyService);
            this._register(event_1.Event.filter(viewDescriptorService.onDidChangeContainerLocation, e => e.viewContainer === viewContainer)(() => viewContainerLocationKey.set((0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewContainerLocation(viewContainer)))));
        }
    };
    ViewContainerMenuActions = __decorate([
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService)
    ], ViewContainerMenuActions);
    let ViewPaneContainer = class ViewPaneContainer extends component_1.Component {
        get onDidSashChange() {
            return (0, types_1.assertIsDefined)(this.paneview).onDidSashChange;
        }
        get panes() {
            return this.paneItems.map(i => i.pane);
        }
        get views() {
            return this.panes;
        }
        get length() {
            return this.paneItems.length;
        }
        get menuActions() {
            return this._menuActions;
        }
        constructor(id, options, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService) {
            super(id, themeService, storageService);
            this.options = options;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.extensionService = extensionService;
            this.storageService = storageService;
            this.contextService = contextService;
            this.viewDescriptorService = viewDescriptorService;
            this.paneItems = [];
            this.visible = false;
            this.areExtensionsReady = false;
            this.didLayout = false;
            this._onTitleAreaUpdate = this._register(new event_1.Emitter());
            this.onTitleAreaUpdate = this._onTitleAreaUpdate.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidAddViews = this._register(new event_1.Emitter());
            this.onDidAddViews = this._onDidAddViews.event;
            this._onDidRemoveViews = this._register(new event_1.Emitter());
            this.onDidRemoveViews = this._onDidRemoveViews.event;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            this._onDidFocusView = this._register(new event_1.Emitter());
            this.onDidFocusView = this._onDidFocusView.event;
            this._onDidBlurView = this._register(new event_1.Emitter());
            this.onDidBlurView = this._onDidBlurView.event;
            const container = this.viewDescriptorService.getViewContainerById(id);
            if (!container) {
                throw new Error('Could not find container');
            }
            this.viewContainer = container;
            this.visibleViewsStorageId = `${id}.numberOfVisibleViews`;
            this.visibleViewsCountFromCache = this.storageService.getNumber(this.visibleViewsStorageId, 1 /* StorageScope.WORKSPACE */, undefined);
            this.viewContainerModel = this.viewDescriptorService.getViewContainerModel(container);
        }
        create(parent) {
            const options = this.options;
            options.orientation = this.orientation;
            this.paneview = this._register(new paneview_1.PaneView(parent, this.options));
            if (this._boundarySashes) {
                this.paneview.setBoundarySashes(this._boundarySashes);
            }
            this._register(this.paneview.onDidDrop(({ from, to }) => this.movePane(from, to)));
            this._register(this.paneview.onDidScroll(_ => this.onDidScrollPane()));
            this._register(this.paneview.onDidSashReset((index) => this.onDidSashReset(index)));
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(parent), e))));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(parent), e))));
            this._menuActions = this._register(this.instantiationService.createInstance(ViewContainerMenuActions, this.paneview.element, this.viewContainer));
            this._register(this._menuActions.onDidChange(() => this.updateTitleArea()));
            let overlay;
            const getOverlayBounds = () => {
                const fullSize = parent.getBoundingClientRect();
                const lastPane = this.panes[this.panes.length - 1].element.getBoundingClientRect();
                const top = this.orientation === 0 /* Orientation.VERTICAL */ ? lastPane.bottom : fullSize.top;
                const left = this.orientation === 1 /* Orientation.HORIZONTAL */ ? lastPane.right : fullSize.left;
                return {
                    top,
                    bottom: fullSize.bottom,
                    left,
                    right: fullSize.right,
                };
            };
            const inBounds = (bounds, pos) => {
                return pos.x >= bounds.left && pos.x <= bounds.right && pos.y >= bounds.top && pos.y <= bounds.bottom;
            };
            let bounds;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(parent, {
                onDragEnter: (e) => {
                    bounds = getOverlayBounds();
                    if (overlay && overlay.disposed) {
                        overlay = undefined;
                    }
                    if (!overlay && inBounds(bounds, e.eventData)) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(parent, undefined, bounds, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(parent, undefined, bounds, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    if (overlay && overlay.disposed) {
                        overlay = undefined;
                    }
                    if (overlay && !inBounds(bounds, e.eventData)) {
                        overlay.dispose();
                        overlay = undefined;
                    }
                    if (inBounds(bounds, e.eventData)) {
                        (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', overlay !== undefined);
                    }
                },
                onDragLeave: (e) => {
                    overlay?.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView) {
                                this.viewDescriptorService.moveViewsToContainer([viewDescriptor], this.viewContainer, undefined, 'dnd');
                            }
                        }
                        const paneCount = this.panes.length;
                        if (viewsToMove.length > 0) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer, undefined, 'dnd');
                        }
                        if (paneCount > 0) {
                            for (const view of viewsToMove) {
                                const paneToMove = this.panes.find(p => p.id === view.id);
                                if (paneToMove) {
                                    this.movePane(paneToMove, this.panes[this.panes.length - 1]);
                                }
                            }
                        }
                    }
                    overlay?.dispose();
                    overlay = undefined;
                }
            }));
            this._register(this.onDidSashChange(() => this.saveViewSizes()));
            this._register(this.viewContainerModel.onDidAddVisibleViewDescriptors(added => this.onDidAddViewDescriptors(added)));
            this._register(this.viewContainerModel.onDidRemoveVisibleViewDescriptors(removed => this.onDidRemoveViewDescriptors(removed)));
            const addedViews = this.viewContainerModel.visibleViewDescriptors.map((viewDescriptor, index) => {
                const size = this.viewContainerModel.getSize(viewDescriptor.id);
                const collapsed = this.viewContainerModel.isCollapsed(viewDescriptor.id);
                return ({ viewDescriptor, index, size, collapsed });
            });
            if (addedViews.length) {
                this.onDidAddViewDescriptors(addedViews);
            }
            // Update headers after and title contributed views after available, since we read from cache in the beginning to know if the viewlet has single view or not. Ref #29609
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.areExtensionsReady = true;
                if (this.panes.length) {
                    this.updateTitleArea();
                    this.updateViewHeaders();
                }
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */)) {
                        this.updateViewHeaders();
                    }
                }));
            });
            this._register(this.viewContainerModel.onDidChangeActiveViewDescriptors(() => this._onTitleAreaUpdate.fire()));
        }
        getTitle() {
            const containerTitle = this.viewContainerModel.title;
            if (this.isViewMergedWithContainer()) {
                const singleViewPaneContainerTitle = this.paneItems[0].pane.singleViewPaneContainerTitle;
                if (singleViewPaneContainerTitle) {
                    return singleViewPaneContainerTitle;
                }
                const paneItemTitle = this.paneItems[0].pane.title;
                if (containerTitle === paneItemTitle) {
                    return paneItemTitle;
                }
                return paneItemTitle ? `${containerTitle}: ${paneItemTitle}` : containerTitle;
            }
            return containerTitle;
        }
        showContextMenu(event) {
            for (const paneItem of this.paneItems) {
                // Do not show context menu if target is coming from inside pane views
                if ((0, dom_1.isAncestor)(event.target, paneItem.pane.element)) {
                    return;
                }
            }
            event.stopPropagation();
            event.preventDefault();
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => this.menuActions?.getContextMenuActions() ?? []
            });
        }
        getActionsContext() {
            return undefined;
        }
        getActionViewItem(action, options) {
            if (this.isViewMergedWithContainer()) {
                return this.paneItems[0].pane.getActionViewItem(action, options);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
        }
        focus() {
            let paneToFocus = undefined;
            if (this.lastFocusedPane) {
                paneToFocus = this.lastFocusedPane;
            }
            else if (this.paneItems.length > 0) {
                for (const { pane } of this.paneItems) {
                    if (pane.isExpanded()) {
                        paneToFocus = pane;
                        break;
                    }
                }
            }
            if (paneToFocus) {
                paneToFocus.focus();
            }
        }
        get orientation() {
            switch (this.viewDescriptorService.getViewContainerLocation(this.viewContainer)) {
                case 0 /* ViewContainerLocation.Sidebar */:
                case 2 /* ViewContainerLocation.AuxiliaryBar */:
                    return 0 /* Orientation.VERTICAL */;
                case 1 /* ViewContainerLocation.Panel */:
                    return this.layoutService.getPanelPosition() === 2 /* Position.BOTTOM */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */;
            }
            return 0 /* Orientation.VERTICAL */;
        }
        layout(dimension) {
            if (this.paneview) {
                if (this.paneview.orientation !== this.orientation) {
                    this.paneview.flipOrientation(dimension.height, dimension.width);
                }
                this.paneview.layout(dimension.height, dimension.width);
            }
            this.dimension = dimension;
            if (this.didLayout) {
                this.saveViewSizes();
            }
            else {
                this.didLayout = true;
                this.restoreViewSizes();
            }
        }
        setBoundarySashes(sashes) {
            this._boundarySashes = sashes;
            this.paneview?.setBoundarySashes(sashes);
        }
        getOptimalWidth() {
            const additionalMargin = 16;
            const optimalWidth = Math.max(...this.panes.map(view => view.getOptimalWidth() || 0));
            return optimalWidth + additionalMargin;
        }
        addPanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            for (const { pane, size, index, disposable } of panes) {
                this.addPane(pane, size, disposable, index);
            }
            this.updateViewHeaders();
            if (this.isViewMergedWithContainer() !== wasMerged) {
                this.updateTitleArea();
            }
            this._onDidAddViews.fire(panes.map(({ pane }) => pane));
        }
        setVisible(visible) {
            if (this.visible !== !!visible) {
                this.visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
            this.panes.filter(view => view.isVisible() !== visible)
                .map((view) => view.setVisible(visible));
        }
        isVisible() {
            return this.visible;
        }
        updateTitleArea() {
            this._onTitleAreaUpdate.fire();
        }
        createView(viewDescriptor, options) {
            return this.instantiationService.createInstance(viewDescriptor.ctorDescriptor.ctor, ...(viewDescriptor.ctorDescriptor.staticArguments || []), options);
        }
        getView(id) {
            return this.panes.filter(view => view.id === id)[0];
        }
        saveViewSizes() {
            // Save size only when the layout has happened
            if (this.didLayout) {
                this.viewContainerModel.setSizes(this.panes.map(view => ({ id: view.id, size: this.getPaneSize(view) })));
            }
        }
        restoreViewSizes() {
            // Restore sizes only when the layout has happened
            if (this.didLayout) {
                let initialSizes;
                for (let i = 0; i < this.viewContainerModel.visibleViewDescriptors.length; i++) {
                    const pane = this.panes[i];
                    const viewDescriptor = this.viewContainerModel.visibleViewDescriptors[i];
                    const size = this.viewContainerModel.getSize(viewDescriptor.id);
                    if (typeof size === 'number') {
                        this.resizePane(pane, size);
                    }
                    else {
                        initialSizes = initialSizes ? initialSizes : this.computeInitialSizes();
                        this.resizePane(pane, initialSizes.get(pane.id) || 200);
                    }
                }
            }
        }
        computeInitialSizes() {
            const sizes = new Map();
            if (this.dimension) {
                const totalWeight = this.viewContainerModel.visibleViewDescriptors.reduce((totalWeight, { weight }) => totalWeight + (weight || 20), 0);
                for (const viewDescriptor of this.viewContainerModel.visibleViewDescriptors) {
                    if (this.orientation === 0 /* Orientation.VERTICAL */) {
                        sizes.set(viewDescriptor.id, this.dimension.height * (viewDescriptor.weight || 20) / totalWeight);
                    }
                    else {
                        sizes.set(viewDescriptor.id, this.dimension.width * (viewDescriptor.weight || 20) / totalWeight);
                    }
                }
            }
            return sizes;
        }
        saveState() {
            this.panes.forEach((view) => view.saveState());
            this.storageService.store(this.visibleViewsStorageId, this.length, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        onContextMenu(event, viewPane) {
            event.stopPropagation();
            event.preventDefault();
            const actions = viewPane.menuActions.getContextMenuActions();
            this.contextMenuService.showContextMenu({
                getAnchor: () => event,
                getActions: () => actions
            });
        }
        openView(id, focus) {
            let view = this.getView(id);
            if (!view) {
                this.toggleViewVisibility(id);
            }
            view = this.getView(id);
            if (view) {
                view.setExpanded(true);
                if (focus) {
                    view.focus();
                }
            }
            return view;
        }
        onDidAddViewDescriptors(added) {
            const panesToAdd = [];
            for (const { viewDescriptor, collapsed, index, size } of added) {
                const pane = this.createView(viewDescriptor, {
                    id: viewDescriptor.id,
                    title: viewDescriptor.name.value,
                    fromExtensionId: viewDescriptor.extensionId,
                    expanded: !collapsed,
                    singleViewPaneContainerTitle: viewDescriptor.singleViewPaneContainerTitle,
                });
                pane.render();
                const contextMenuDisposable = (0, dom_1.addDisposableListener)(pane.draggableElement, 'contextmenu', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(pane.draggableElement), e), pane);
                });
                const collapseDisposable = event_1.Event.latch(event_1.Event.map(pane.onDidChange, () => !pane.isExpanded()))(collapsed => {
                    this.viewContainerModel.setCollapsed(viewDescriptor.id, collapsed);
                });
                panesToAdd.push({ pane, size: size || pane.minimumSize, index, disposable: (0, lifecycle_1.combinedDisposable)(contextMenuDisposable, collapseDisposable) });
            }
            this.addPanes(panesToAdd);
            this.restoreViewSizes();
            const panes = [];
            for (const { pane } of panesToAdd) {
                pane.setVisible(this.isVisible());
                panes.push(pane);
            }
            return panes;
        }
        onDidRemoveViewDescriptors(removed) {
            removed = removed.sort((a, b) => b.index - a.index);
            const panesToRemove = [];
            for (const { index } of removed) {
                const paneItem = this.paneItems[index];
                if (paneItem) {
                    panesToRemove.push(this.paneItems[index].pane);
                }
            }
            if (panesToRemove.length) {
                this.removePanes(panesToRemove);
                for (const pane of panesToRemove) {
                    pane.setVisible(false);
                }
            }
        }
        toggleViewVisibility(viewId) {
            // Check if view is active
            if (this.viewContainerModel.activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === viewId)) {
                const visible = !this.viewContainerModel.isVisible(viewId);
                this.viewContainerModel.setVisible(viewId, visible);
            }
        }
        addPane(pane, size, disposable, index = this.paneItems.length - 1) {
            const onDidFocus = pane.onDidFocus(() => {
                this._onDidFocusView.fire(pane);
                this.lastFocusedPane = pane;
            });
            const onDidBlur = pane.onDidBlur(() => this._onDidBlurView.fire(pane));
            const onDidChangeTitleArea = pane.onDidChangeTitleArea(() => {
                if (this.isViewMergedWithContainer()) {
                    this.updateTitleArea();
                }
            });
            const onDidChangeVisibility = pane.onDidChangeBodyVisibility(() => this._onDidChangeViewVisibility.fire(pane));
            const onDidChange = pane.onDidChange(() => {
                if (pane === this.lastFocusedPane && !pane.isExpanded()) {
                    this.lastFocusedPane = undefined;
                }
            });
            const isPanel = this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === 1 /* ViewContainerLocation.Panel */;
            pane.style({
                headerForeground: (0, colorRegistry_1.asCssVariable)(isPanel ? theme_1.PANEL_SECTION_HEADER_FOREGROUND : theme_1.SIDE_BAR_SECTION_HEADER_FOREGROUND),
                headerBackground: (0, colorRegistry_1.asCssVariable)(isPanel ? theme_1.PANEL_SECTION_HEADER_BACKGROUND : theme_1.SIDE_BAR_SECTION_HEADER_BACKGROUND),
                headerBorder: (0, colorRegistry_1.asCssVariable)(isPanel ? theme_1.PANEL_SECTION_HEADER_BORDER : theme_1.SIDE_BAR_SECTION_HEADER_BORDER),
                dropBackground: (0, colorRegistry_1.asCssVariable)(isPanel ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND),
                leftBorder: isPanel ? (0, colorRegistry_1.asCssVariable)(theme_1.PANEL_SECTION_BORDER) : undefined
            });
            const store = new lifecycle_1.DisposableStore();
            store.add(disposable);
            store.add((0, lifecycle_1.combinedDisposable)(pane, onDidFocus, onDidBlur, onDidChangeTitleArea, onDidChange, onDidChangeVisibility));
            const paneItem = { pane, disposable: store };
            this.paneItems.splice(index, 0, paneItem);
            (0, types_1.assertIsDefined)(this.paneview).addPane(pane, size, index);
            let overlay;
            store.add(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(pane.draggableElement, () => { return { type: 'view', id: pane.id }; }, {}));
            store.add(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(pane.dropTargetElement, {
                onDragEnter: (e) => {
                    if (!overlay) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view' && dropData.id !== pane.id) {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(pane.dropTargetElement, this.orientation ?? 0 /* Orientation.VERTICAL */, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(pane.dropTargetElement, this.orientation ?? 0 /* Orientation.VERTICAL */, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', overlay !== undefined);
                },
                onDragLeave: (e) => {
                    overlay?.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        let anchorView;
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (allViews.length > 0 && !allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                                anchorView = allViews[0];
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView && !this.viewContainer.rejectAddedViews) {
                                viewsToMove.push(viewDescriptor);
                            }
                            if (viewDescriptor) {
                                anchorView = viewDescriptor;
                            }
                        }
                        if (viewsToMove) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer, undefined, 'dnd');
                        }
                        if (anchorView) {
                            if (overlay.currentDropOperation === 1 /* DropDirection.DOWN */ ||
                                overlay.currentDropOperation === 3 /* DropDirection.RIGHT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex > toIndex) {
                                        toIndex++;
                                    }
                                    if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (overlay.currentDropOperation === 0 /* DropDirection.UP */ ||
                                overlay.currentDropOperation === 2 /* DropDirection.LEFT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex < toIndex) {
                                        toIndex--;
                                    }
                                    if (toIndex >= 0 && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (viewsToMove.length > 1) {
                                viewsToMove.slice(1).forEach(view => {
                                    let toIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                    const fromIndex = this.panes.findIndex(p => p.id === view.id);
                                    if (fromIndex >= 0 && toIndex >= 0) {
                                        if (fromIndex > toIndex) {
                                            toIndex++;
                                        }
                                        if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                            this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                            anchorView = view;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    overlay?.dispose();
                    overlay = undefined;
                }
            }));
        }
        removePanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            panes.forEach(pane => this.removePane(pane));
            this.updateViewHeaders();
            if (wasMerged !== this.isViewMergedWithContainer()) {
                this.updateTitleArea();
            }
            this._onDidRemoveViews.fire(panes);
        }
        removePane(pane) {
            const index = this.paneItems.findIndex(i => i.pane === pane);
            if (index === -1) {
                return;
            }
            if (this.lastFocusedPane === pane) {
                this.lastFocusedPane = undefined;
            }
            (0, types_1.assertIsDefined)(this.paneview).removePane(pane);
            const [paneItem] = this.paneItems.splice(index, 1);
            paneItem.disposable.dispose();
        }
        movePane(from, to) {
            const fromIndex = this.paneItems.findIndex(item => item.pane === from);
            const toIndex = this.paneItems.findIndex(item => item.pane === to);
            const fromViewDescriptor = this.viewContainerModel.visibleViewDescriptors[fromIndex];
            const toViewDescriptor = this.viewContainerModel.visibleViewDescriptors[toIndex];
            if (fromIndex < 0 || fromIndex >= this.paneItems.length) {
                return;
            }
            if (toIndex < 0 || toIndex >= this.paneItems.length) {
                return;
            }
            const [paneItem] = this.paneItems.splice(fromIndex, 1);
            this.paneItems.splice(toIndex, 0, paneItem);
            (0, types_1.assertIsDefined)(this.paneview).movePane(from, to);
            this.viewContainerModel.move(fromViewDescriptor.id, toViewDescriptor.id);
            this.updateTitleArea();
        }
        resizePane(pane, size) {
            (0, types_1.assertIsDefined)(this.paneview).resizePane(pane, size);
        }
        getPaneSize(pane) {
            return (0, types_1.assertIsDefined)(this.paneview).getPaneSize(pane);
        }
        updateViewHeaders() {
            if (this.isViewMergedWithContainer()) {
                if (this.paneItems[0].pane.isExpanded()) {
                    this.lastMergedCollapsedPane = undefined;
                }
                else {
                    this.lastMergedCollapsedPane = this.paneItems[0].pane;
                    this.paneItems[0].pane.setExpanded(true);
                }
                this.paneItems[0].pane.headerVisible = false;
                this.paneItems[0].pane.collapsible = true;
            }
            else {
                if (this.paneItems.length === 1) {
                    this.paneItems[0].pane.headerVisible = true;
                    if (this.paneItems[0].pane === this.lastMergedCollapsedPane) {
                        this.paneItems[0].pane.setExpanded(false);
                    }
                    this.paneItems[0].pane.collapsible = false;
                }
                else {
                    this.paneItems.forEach(i => {
                        i.pane.headerVisible = true;
                        i.pane.collapsible = true;
                        if (i.pane === this.lastMergedCollapsedPane) {
                            i.pane.setExpanded(false);
                        }
                    });
                }
                this.lastMergedCollapsedPane = undefined;
            }
        }
        isViewMergedWithContainer() {
            if (!(this.options.mergeViewWithContainerWhenSingleView && this.paneItems.length === 1)) {
                return false;
            }
            if (!this.areExtensionsReady) {
                if (this.visibleViewsCountFromCache === undefined) {
                    return this.paneItems[0].pane.isExpanded();
                }
                // Check in cache so that view do not jump. See #29609
                return this.visibleViewsCountFromCache === 1;
            }
            return true;
        }
        onDidScrollPane() {
            for (const pane of this.panes) {
                pane.onDidScrollRoot();
            }
        }
        onDidSashReset(index) {
            let firstPane = undefined;
            let secondPane = undefined;
            // Deal with collapsed views: to be clever, we split the space taken by the nearest uncollapsed views
            for (let i = index; i >= 0; i--) {
                if (this.paneItems[i].pane?.isVisible() && this.paneItems[i]?.pane.isExpanded()) {
                    firstPane = this.paneItems[i].pane;
                    break;
                }
            }
            for (let i = index + 1; i < this.paneItems.length; i++) {
                if (this.paneItems[i].pane?.isVisible() && this.paneItems[i]?.pane.isExpanded()) {
                    secondPane = this.paneItems[i].pane;
                    break;
                }
            }
            if (firstPane && secondPane) {
                const firstPaneSize = this.getPaneSize(firstPane);
                const secondPaneSize = this.getPaneSize(secondPane);
                // Avoid rounding errors and be consistent when resizing
                // The first pane always get half rounded up and the second is half rounded down
                const newFirstPaneSize = Math.ceil((firstPaneSize + secondPaneSize) / 2);
                const newSecondPaneSize = Math.floor((firstPaneSize + secondPaneSize) / 2);
                // Shrink the larger pane first, then grow the smaller pane
                // This prevents interfering with other view sizes
                if (firstPaneSize > secondPaneSize) {
                    this.resizePane(firstPane, newFirstPaneSize);
                    this.resizePane(secondPane, newSecondPaneSize);
                }
                else {
                    this.resizePane(secondPane, newSecondPaneSize);
                    this.resizePane(firstPane, newFirstPaneSize);
                }
            }
        }
        dispose() {
            super.dispose();
            this.paneItems.forEach(i => i.disposable.dispose());
            if (this.paneview) {
                this.paneview.dispose();
            }
        }
    };
    exports.ViewPaneContainer = ViewPaneContainer;
    exports.ViewPaneContainer = ViewPaneContainer = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, extensions_1.IExtensionService),
        __param(8, themeService_1.IThemeService),
        __param(9, storage_1.IStorageService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, views_1.IViewDescriptorService)
    ], ViewPaneContainer);
    class ViewPaneContainerAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.desc = desc;
        }
        run(accessor, ...args) {
            const viewPaneContainer = accessor.get(viewsService_1.IViewsService).getActiveViewPaneContainerWithId(this.desc.viewPaneContainerId);
            if (viewPaneContainer) {
                return this.runInViewPaneContainer(accessor, viewPaneContainer, ...args);
            }
        }
    }
    exports.ViewPaneContainerAction = ViewPaneContainerAction;
    class MoveViewPosition extends actions_1.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const viewId = contextkeys_1.FocusedViewContext.getValue(contextKeyService);
            if (viewId === undefined) {
                return;
            }
            const viewContainer = viewDescriptorService.getViewContainerByViewId(viewId);
            const model = viewDescriptorService.getViewContainerModel(viewContainer);
            const viewDescriptor = model.visibleViewDescriptors.find(vd => vd.id === viewId);
            const currentIndex = model.visibleViewDescriptors.indexOf(viewDescriptor);
            if (currentIndex + this.offset < 0 || currentIndex + this.offset >= model.visibleViewDescriptors.length) {
                return;
            }
            const newPosition = model.visibleViewDescriptors[currentIndex + this.offset];
            model.move(viewDescriptor.id, newPosition.id);
        }
    }
    (0, actions_1.registerAction2)(class MoveViewUp extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewUp',
                title: nls.localize('viewMoveUp', "Move View Up"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 16 /* KeyCode.UpArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewLeft extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewLeft',
                title: nls.localize('viewMoveLeft', "Move View Left"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 15 /* KeyCode.LeftArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewDown extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewDown',
                title: nls.localize('viewMoveDown', "Move View Down"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 18 /* KeyCode.DownArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViewRight extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewRight',
                title: nls.localize('viewMoveRight', "Move View Right"),
                keybinding: {
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ + 41 /* KeyCode.KeyK */, 17 /* KeyCode.RightArrow */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                    when: contextkeys_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
    (0, actions_1.registerAction2)(class MoveViews extends actions_1.Action2 {
        constructor() {
            super({
                id: 'vscode.moveViews',
                title: nls.localize('viewsMove', "Move Views"),
            });
        }
        async run(accessor, options) {
            if (!Array.isArray(options?.viewIds) || typeof options?.destinationId !== 'string') {
                return Promise.reject('Invalid arguments');
            }
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const destination = viewDescriptorService.getViewContainerById(options.destinationId);
            if (!destination) {
                return;
            }
            // FYI, don't use `moveViewsToContainer` in 1 shot, because it expects all views to have the same current location
            for (const viewId of options.viewIds) {
                const viewDescriptor = viewDescriptorService.getViewDescriptorById(viewId);
                if (viewDescriptor?.canMoveView) {
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], destination, views_1.ViewVisibilityState.Default, this.desc.id);
                }
            }
            await accessor.get(viewsService_1.IViewsService).openViewContainer(destination.id, true);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1BhbmVDb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3ZpZXdzL3ZpZXdQYW5lQ29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlDbkYsUUFBQSxZQUFZLEdBQUcsSUFBSSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELHNCQUFZLENBQUMsY0FBYyxDQUFDLGdCQUFNLENBQUMsa0JBQWtCLEVBQWdCO1FBQ3BFLE9BQU8sRUFBRSxvQkFBWTtRQUNyQixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQ3JDLEtBQUssRUFBRSxDQUFDO0tBQ1IsQ0FBQyxDQUFDO0lBV0gsSUFBVyxhQUtWO0lBTEQsV0FBVyxhQUFhO1FBQ3ZCLDZDQUFFLENBQUE7UUFDRixpREFBSSxDQUFBO1FBQ0osaURBQUksQ0FBQTtRQUNKLG1EQUFLLENBQUE7SUFDTixDQUFDLEVBTFUsYUFBYSxLQUFiLGFBQWEsUUFLdkI7SUFJRCxNQUFNLG1CQUFvQixTQUFRLHVCQUFRO2lCQUVqQixlQUFVLEdBQUcsMEJBQTBCLENBQUM7UUFZaEUsSUFBSSxvQkFBb0I7WUFDdkIsT0FBTyxJQUFJLENBQUMscUJBQXFCLENBQUM7UUFDbkMsQ0FBQztRQUVELFlBQ1MsV0FBd0IsRUFDeEIsV0FBb0MsRUFDcEMsTUFBZ0MsRUFDOUIsUUFBK0IsRUFDekMsWUFBMkI7WUFFM0IsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBTlosZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIsZ0JBQVcsR0FBWCxXQUFXLENBQXlCO1lBQ3BDLFdBQU0sR0FBTixNQUFNLENBQTBCO1lBQzlCLGFBQVEsR0FBUixRQUFRLENB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