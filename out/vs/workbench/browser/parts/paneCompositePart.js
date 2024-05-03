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
define(["require", "exports", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/panecomposite", "vs/workbench/common/views", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/parts/paneCompositeBar", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/extensions/common/extensions", "vs/nls", "vs/workbench/browser/dnd", "vs/workbench/common/theme", "vs/base/browser/ui/toolbar/toolbar", "vs/workbench/browser/actions", "vs/platform/actions/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/touch", "vs/base/browser/mouseEvent", "vs/base/common/actions", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/paneCompositePart"], function (require, exports, event_1, instantiation_1, panecomposite_1, views_1, lifecycle_1, layoutService_1, compositePart_1, paneCompositeBar_1, dom_1, platform_1, notification_1, storage_1, contextView_1, keybinding_1, themeService_1, contextkey_1, extensions_1, nls_1, dnd_1, theme_1, toolbar_1, actions_1, actions_2, actionbar_1, touch_1, mouseEvent_1, actions_3, viewPaneContainer_1, menuEntryActionViewItem_1) {
    "use strict";
    var AbstractPaneCompositePart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractPaneCompositePart = exports.CompositeBarPosition = void 0;
    var CompositeBarPosition;
    (function (CompositeBarPosition) {
        CompositeBarPosition[CompositeBarPosition["TOP"] = 0] = "TOP";
        CompositeBarPosition[CompositeBarPosition["TITLE"] = 1] = "TITLE";
        CompositeBarPosition[CompositeBarPosition["BOTTOM"] = 2] = "BOTTOM";
    })(CompositeBarPosition || (exports.CompositeBarPosition = CompositeBarPosition = {}));
    let AbstractPaneCompositePart = class AbstractPaneCompositePart extends compositePart_1.CompositePart {
        static { AbstractPaneCompositePart_1 = this; }
        static { this.MIN_COMPOSITE_BAR_WIDTH = 50; }
        get snap() {
            // Always allow snapping closed
            // Only allow dragging open if the panel contains view containers
            return this.layoutService.isVisible(this.partId) || !!this.paneCompositeBar.value?.getVisiblePaneCompositeIds().length;
        }
        get onDidPaneCompositeOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeEvent => compositeEvent.composite); }
        constructor(partId, partOptions, activePaneCompositeSettingsKey, activePaneContextKey, paneFocusContextKey, nameForTelemetry, compositeCSSClass, titleForegroundColor, notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService) {
            let location = 0 /* ViewContainerLocation.Sidebar */;
            let registryId = panecomposite_1.Extensions.Viewlets;
            let globalActionsMenuId = actions_2.MenuId.SidebarTitle;
            if (partId === "workbench.parts.panel" /* Parts.PANEL_PART */) {
                location = 1 /* ViewContainerLocation.Panel */;
                registryId = panecomposite_1.Extensions.Panels;
                globalActionsMenuId = actions_2.MenuId.PanelTitle;
            }
            else if (partId === "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) {
                location = 2 /* ViewContainerLocation.AuxiliaryBar */;
                registryId = panecomposite_1.Extensions.Auxiliary;
                globalActionsMenuId = actions_2.MenuId.AuxiliaryBarTitle;
            }
            super(notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(registryId), activePaneCompositeSettingsKey, viewDescriptorService.getDefaultViewContainer(location)?.id || '', nameForTelemetry, compositeCSSClass, titleForegroundColor, partId, partOptions);
            this.partId = partId;
            this.activePaneContextKey = activePaneContextKey;
            this.paneFocusContextKey = paneFocusContextKey;
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.extensionService = extensionService;
            this.menuService = menuService;
            this.onDidPaneCompositeClose = this.onDidCompositeClose.event;
            this.headerFooterCompositeBarDispoables = this._register(new lifecycle_1.DisposableStore());
            this.paneCompositeBar = this._register(new lifecycle_1.MutableDisposable());
            this.compositeBarPosition = undefined;
            this.blockOpening = false;
            this.location = location;
            this.globalActions = this._register(this.instantiationService.createInstance(actions_1.CompositeMenuActions, globalActionsMenuId, undefined, undefined));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidPaneCompositeOpen(composite => this.onDidOpen(composite)));
            this._register(this.onDidPaneCompositeClose(this.onDidClose, this));
            this._register(this.globalActions.onDidChange(() => this.updateGlobalToolbarActions()));
            this._register(this.registry.onDidDeregister((viewletDescriptor) => {
                const activeContainers = this.viewDescriptorService.getViewContainersByLocation(this.location)
                    .filter(container => this.viewDescriptorService.getViewContainerModel(container).activeViewDescriptors.length > 0);
                if (activeContainers.length) {
                    if (this.getActiveComposite()?.getId() === viewletDescriptor.id) {
                        const defaultViewletId = this.viewDescriptorService.getDefaultViewContainer(this.location)?.id;
                        const containerToOpen = activeContainers.filter(c => c.id === defaultViewletId)[0] || activeContainers[0];
                        this.doOpenPaneComposite(containerToOpen.id);
                    }
                }
                else {
                    this.layoutService.setPartHidden(true, this.partId);
                }
                this.removeComposite(viewletDescriptor.id);
            }));
            this._register(this.extensionService.onDidRegisterExtensions(() => {
                this.layoutCompositeBar();
            }));
        }
        onDidOpen(composite) {
            this.activePaneContextKey.set(composite.getId());
        }
        onDidClose(composite) {
            const id = composite.getId();
            if (this.activePaneContextKey.get() === id) {
                this.activePaneContextKey.reset();
            }
        }
        showComposite(composite) {
            super.showComposite(composite);
            this.layoutCompositeBar();
            this.layoutEmptyMessage();
        }
        hideActiveComposite() {
            const composite = super.hideActiveComposite();
            this.layoutCompositeBar();
            this.layoutEmptyMessage();
            return composite;
        }
        create(parent) {
            this.element = parent;
            this.element.classList.add('pane-composite-part');
            super.create(parent);
            const contentArea = this.getContentArea();
            if (contentArea) {
                this.createEmptyPaneMessage(contentArea);
            }
            this.updateCompositeBar();
            const focusTracker = this._register((0, dom_1.trackFocus)(parent));
            this._register(focusTracker.onDidFocus(() => this.paneFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.paneFocusContextKey.set(false)));
        }
        createEmptyPaneMessage(parent) {
            this.emptyPaneMessageElement = document.createElement('div');
            this.emptyPaneMessageElement.classList.add('empty-pane-message-area');
            const messageElement = document.createElement('div');
            messageElement.classList.add('empty-pane-message');
            messageElement.innerText = (0, nls_1.localize)('pane.emptyMessage', "Drag a view here to display.");
            this.emptyPaneMessageElement.appendChild(messageElement);
            parent.appendChild(this.emptyPaneMessageElement);
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(this.emptyPaneMessageElement, {
                onDragOver: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (this.paneCompositeBar.value) {
                        const validDropTarget = this.paneCompositeBar.value.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                        (0, dnd_1.toggleDropEffect)(e.eventData.dataTransfer, 'move', validDropTarget);
                    }
                },
                onDragEnter: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    if (this.paneCompositeBar.value) {
                        const validDropTarget = this.paneCompositeBar.value.dndHandler.onDragEnter(e.dragAndDropData, undefined, e.eventData);
                        this.emptyPaneMessageElement.style.backgroundColor = validDropTarget ? this.theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND)?.toString() || '' : '';
                    }
                },
                onDragLeave: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                },
                onDragEnd: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                },
                onDrop: (e) => {
                    dom_1.EventHelper.stop(e.eventData, true);
                    this.emptyPaneMessageElement.style.backgroundColor = '';
                    if (this.paneCompositeBar.value) {
                        this.paneCompositeBar.value.dndHandler.drop(e.dragAndDropData, undefined, e.eventData);
                    }
                },
            }));
        }
        createTitleArea(parent) {
            const titleArea = super.createTitleArea(parent);
            this._register((0, dom_1.addDisposableListener)(titleArea, dom_1.EventType.CONTEXT_MENU, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(titleArea), e));
            }));
            this._register(touch_1.Gesture.addTarget(titleArea));
            this._register((0, dom_1.addDisposableListener)(titleArea, touch_1.EventType.Contextmenu, e => {
                this.onTitleAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(titleArea), e));
            }));
            const globalTitleActionsContainer = titleArea.appendChild((0, dom_1.$)('.global-actions'));
            // Global Actions Toolbar
            this.globalToolBar = this._register(new toolbar_1.ToolBar(globalTitleActionsContainer, this.contextMenuService, {
                actionViewItemProvider: (action, options) => this.actionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('moreActions', "More Actions..."),
                hoverDelegate: this.toolbarHoverDelegate
            }));
            this.updateGlobalToolbarActions();
            return titleArea;
        }
        createTitleLabel(parent) {
            this.titleContainer = parent;
            const titleLabel = super.createTitleLabel(parent);
            this.titleLabelElement.draggable = true;
            const draggedItemProvider = () => {
                const activeViewlet = this.getActivePaneComposite();
                return { type: 'composite', id: activeViewlet.getId() };
            };
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(this.titleLabelElement, draggedItemProvider, {}));
            return titleLabel;
        }
        updateCompositeBar() {
            const wasCompositeBarVisible = this.compositeBarPosition !== undefined;
            const isCompositeBarVisible = this.shouldShowCompositeBar();
            const previousPosition = this.compositeBarPosition;
            const newPosition = isCompositeBarVisible ? this.getCompositeBarPosition() : undefined;
            // Only update if the visibility or position has changed
            if (previousPosition === newPosition) {
                return;
            }
            // Remove old composite bar
            if (wasCompositeBarVisible) {
                const previousCompositeBarContainer = previousPosition === CompositeBarPosition.TITLE ? this.titleContainer : this.headerFooterCompositeBarContainer;
                if (!this.paneCompositeBarContainer || !this.paneCompositeBar.value || !previousCompositeBarContainer) {
                    throw new Error('Composite bar containers should exist when removing the previous composite bar');
                }
                this.paneCompositeBarContainer.remove();
                this.paneCompositeBarContainer = undefined;
                this.paneCompositeBar.value = undefined;
                previousCompositeBarContainer.classList.remove('has-composite-bar');
                if (previousPosition === CompositeBarPosition.TOP) {
                    this.removeFooterHeaderArea(true);
                }
                else if (previousPosition === CompositeBarPosition.BOTTOM) {
                    this.removeFooterHeaderArea(false);
                }
            }
            // Create new composite bar
            let newCompositeBarContainer;
            switch (newPosition) {
                case CompositeBarPosition.TOP:
                    newCompositeBarContainer = this.createHeaderArea();
                    break;
                case CompositeBarPosition.TITLE:
                    newCompositeBarContainer = this.titleContainer;
                    break;
                case CompositeBarPosition.BOTTOM:
                    newCompositeBarContainer = this.createFooterArea();
                    break;
            }
            if (isCompositeBarVisible) {
                if (this.paneCompositeBarContainer || this.paneCompositeBar.value || !newCompositeBarContainer) {
                    throw new Error('Invalid composite bar state when creating the new composite bar');
                }
                newCompositeBarContainer.classList.add('has-composite-bar');
                this.paneCompositeBarContainer = (0, dom_1.prepend)(newCompositeBarContainer, (0, dom_1.$)('.composite-bar-container'));
                this.paneCompositeBar.value = this.createCompositeBar();
                this.paneCompositeBar.value.create(this.paneCompositeBarContainer);
                if (newPosition === CompositeBarPosition.TOP) {
                    this.setHeaderArea(newCompositeBarContainer);
                }
                else if (newPosition === CompositeBarPosition.BOTTOM) {
                    this.setFooterArea(newCompositeBarContainer);
                }
            }
            this.compositeBarPosition = newPosition;
        }
        createHeaderArea() {
            const headerArea = super.createHeaderArea();
            return this.createHeaderFooterCompositeBarArea(headerArea);
        }
        createFooterArea() {
            const footerArea = super.createFooterArea();
            return this.createHeaderFooterCompositeBarArea(footerArea);
        }
        createHeaderFooterCompositeBarArea(area) {
            if (this.headerFooterCompositeBarContainer) {
                // A pane composite part has either a header or a footer, but not both
                throw new Error('Header or Footer composite bar already exists');
            }
            this.headerFooterCompositeBarContainer = area;
            this.headerFooterCompositeBarDispoables.add((0, dom_1.addDisposableListener)(area, dom_1.EventType.CONTEXT_MENU, e => {
                this.onCompositeBarAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(area), e));
            }));
            this.headerFooterCompositeBarDispoables.add(touch_1.Gesture.addTarget(area));
            this.headerFooterCompositeBarDispoables.add((0, dom_1.addDisposableListener)(area, touch_1.EventType.Contextmenu, e => {
                this.onCompositeBarAreaContextMenu(new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(area), e));
            }));
            return area;
        }
        removeFooterHeaderArea(header) {
            this.headerFooterCompositeBarContainer = undefined;
            this.headerFooterCompositeBarDispoables.clear();
            if (header) {
                this.removeHeaderArea();
            }
            else {
                this.removeFooterArea();
            }
        }
        createCompositeBar() {
            return this.instantiationService.createInstance(paneCompositeBar_1.PaneCompositeBar, this.getCompositeBarOptions(), this.partId, this);
        }
        onTitleAreaUpdate(compositeId) {
            super.onTitleAreaUpdate(compositeId);
            // If title actions change, relayout the composite bar
            this.layoutCompositeBar();
        }
        async openPaneComposite(id, focus) {
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPaneComposite(id, focus);
            }
            await this.extensionService.whenInstalledExtensionsRegistered();
            if (typeof id === 'string' && this.getPaneComposite(id)) {
                return this.doOpenPaneComposite(id, focus);
            }
            return undefined;
        }
        doOpenPaneComposite(id, focus) {
            if (this.blockOpening) {
                return undefined; // Workaround against a potential race condition
            }
            if (!this.layoutService.isVisible(this.partId)) {
                try {
                    this.blockOpening = true;
                    this.layoutService.setPartHidden(false, this.partId);
                }
                finally {
                    this.blockOpening = false;
                }
            }
            return this.openComposite(id, focus);
        }
        getPaneComposite(id) {
            return this.registry.getPaneComposite(id);
        }
        getPaneComposites() {
            return this.registry.getPaneComposites()
                .sort((v1, v2) => {
                if (typeof v1.order !== 'number') {
                    return 1;
                }
                if (typeof v2.order !== 'number') {
                    return -1;
                }
                return v1.order - v2.order;
            });
        }
        getPinnedPaneCompositeIds() {
            return this.paneCompositeBar.value?.getPinnedPaneCompositeIds() ?? [];
        }
        getVisiblePaneCompositeIds() {
            return this.paneCompositeBar.value?.getVisiblePaneCompositeIds() ?? [];
        }
        getActivePaneComposite() {
            return this.getActiveComposite();
        }
        getLastActivePaneCompositeId() {
            return this.getLastActiveCompositeId();
        }
        hideActivePaneComposite() {
            if (this.layoutService.isVisible(this.partId)) {
                this.layoutService.setPartHidden(true, this.partId);
            }
            this.hideActiveComposite();
        }
        focusComositeBar() {
            this.paneCompositeBar.value?.focus();
        }
        layout(width, height, top, left) {
            if (!this.layoutService.isVisible(this.partId)) {
                return;
            }
            this.contentDimension = new dom_1.Dimension(width, height);
            // Layout contents
            super.layout(this.contentDimension.width, this.contentDimension.height, top, left);
            // Layout composite bar
            this.layoutCompositeBar();
            // Add empty pane message
            this.layoutEmptyMessage();
        }
        layoutCompositeBar() {
            if (this.contentDimension && this.dimension && this.paneCompositeBar.value) {
                const padding = this.compositeBarPosition === CompositeBarPosition.TITLE ? 16 : 8;
                const borderWidth = this.partId === "workbench.parts.panel" /* Parts.PANEL_PART */ ? 0 : 1;
                let availableWidth = this.contentDimension.width - padding - borderWidth;
                availableWidth = Math.max(AbstractPaneCompositePart_1.MIN_COMPOSITE_BAR_WIDTH, availableWidth - this.getToolbarWidth());
                this.paneCompositeBar.value.layout(availableWidth, this.dimension.height);
            }
        }
        layoutEmptyMessage() {
            const visible = !this.getActiveComposite();
            this.emptyPaneMessageElement?.classList.toggle('visible', visible);
            if (visible) {
                this.titleLabel?.updateTitle('', '');
            }
        }
        updateGlobalToolbarActions() {
            const primaryActions = this.globalActions.getPrimaryActions();
            const secondaryActions = this.globalActions.getSecondaryActions();
            this.globalToolBar?.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions));
        }
        getToolbarWidth() {
            if (!this.toolBar || this.compositeBarPosition !== CompositeBarPosition.TITLE) {
                return 0;
            }
            const activePane = this.getActivePaneComposite();
            if (!activePane) {
                return 0;
            }
            // Each toolbar item has 4px margin
            const toolBarWidth = this.toolBar.getItemsWidth() + this.toolBar.getItemsLength() * 4;
            const globalToolBarWidth = this.globalToolBar ? this.globalToolBar.getItemsWidth() + this.globalToolBar.getItemsLength() * 4 : 0;
            return toolBarWidth + globalToolBarWidth + 5; // 5px padding left
        }
        onTitleAreaContextMenu(event) {
            if (this.shouldShowCompositeBar() && this.getCompositeBarPosition() === CompositeBarPosition.TITLE) {
                return this.onCompositeBarContextMenu(event);
            }
            else {
                const activePaneComposite = this.getActivePaneComposite();
                const activePaneCompositeActions = activePaneComposite ? activePaneComposite.getContextMenuActions() : [];
                if (activePaneCompositeActions.length) {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => activePaneCompositeActions,
                        getActionViewItem: (action, options) => this.actionViewItemProvider(action, options),
                        actionRunner: activePaneComposite.getActionRunner(),
                        skipTelemetry: true
                    });
                }
            }
        }
        onCompositeBarAreaContextMenu(event) {
            return this.onCompositeBarContextMenu(event);
        }
        onCompositeBarContextMenu(event) {
            if (this.paneCompositeBar.value) {
                const actions = [...this.paneCompositeBar.value.getContextMenuActions()];
                if (actions.length) {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => event,
                        getActions: () => actions,
                        skipTelemetry: true
                    });
                }
            }
        }
        getViewsSubmenuAction() {
            const viewPaneContainer = this.getActivePaneComposite()?.getViewPaneContainer();
            if (viewPaneContainer) {
                const disposables = new lifecycle_1.DisposableStore();
                const viewsActions = [];
                const scopedContextKeyService = disposables.add(this.contextKeyService.createScoped(this.element));
                scopedContextKeyService.createKey('viewContainer', viewPaneContainer.viewContainer.id);
                const menu = disposables.add(this.menuService.createMenu(viewPaneContainer_1.ViewsSubMenu, scopedContextKeyService));
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: viewsActions, secondary: [] }, () => true);
                disposables.dispose();
                return viewsActions.length > 1 && viewsActions.some(a => a.enabled) ? new actions_3.SubmenuAction('views', (0, nls_1.localize)('views', "Views"), viewsActions) : undefined;
            }
            return undefined;
        }
    };
    exports.AbstractPaneCompositePart = AbstractPaneCompositePart;
    exports.AbstractPaneCompositePart = AbstractPaneCompositePart = AbstractPaneCompositePart_1 = __decorate([
        __param(8, notification_1.INotificationService),
        __param(9, storage_1.IStorageService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, layoutService_1.IWorkbenchLayoutService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, instantiation_1.IInstantiationService),
        __param(14, themeService_1.IThemeService),
        __param(15, views_1.IViewDescriptorService),
        __param(16, contextkey_1.IContextKeyService),
        __param(17, extensions_1.IExtensionService),
        __param(18, actions_2.IMenuService)
    ], AbstractPaneCompositePart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZUNvbXBvc2l0ZVBhcnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3BhbmVDb21wb3NpdGVQYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1Q2hHLElBQVksb0JBSVg7SUFKRCxXQUFZLG9CQUFvQjtRQUMvQiw2REFBRyxDQUFBO1FBQ0gsaUVBQUssQ0FBQTtRQUNMLG1FQUFNLENBQUE7SUFDUCxDQUFDLEVBSlcsb0JBQW9CLG9DQUFwQixvQkFBb0IsUUFJL0I7SUF1RE0sSUFBZSx5QkFBeUIsR0FBeEMsTUFBZSx5QkFBMEIsU0FBUSw2QkFBNEI7O2lCQUUzRCw0QkFBdUIsR0FBRyxFQUFFLEFBQUwsQ0FBTTtRQUVyRCxJQUFJLElBQUk7WUFDUCwrQkFBK0I7WUFDL0IsaUVBQWlFO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLDBCQUEwQixFQUFFLENBQUMsTUFBTSxDQUFDO1FBQ3hILENBQUM7UUFFRCxJQUFJLHNCQUFzQixLQUE0QixPQUFPLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFpQixjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBa0JwSyxZQUNVLE1BQXVFLEVBQ2hGLFdBQXlCLEVBQ3pCLDhCQUFzQyxFQUNyQixvQkFBeUMsRUFDbEQsbUJBQXlDLEVBQ2pELGdCQUF3QixFQUN4QixpQkFBeUIsRUFDekIsb0JBQXdDLEVBQ2xCLG1CQUF5QyxFQUM5QyxjQUErQixFQUMzQixr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