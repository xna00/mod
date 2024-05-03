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
define(["require", "exports", "vs/base/browser/ui/splitview/splitview", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalTabsList", "vs/base/common/platform", "vs/base/browser/dom", "vs/base/browser/canIUse", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/storage/common/storage", "vs/nls", "vs/workbench/contrib/terminal/browser/terminalContextMenu", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/hover/browser/hover"], function (require, exports, splitview_1, lifecycle_1, configuration_1, instantiation_1, terminal_1, terminalTabsList_1, platform_1, dom, canIUse_1, notification_1, actions_1, actions_2, contextkey_1, contextView_1, storage_1, nls_1, terminalContextMenu_1, terminalContextKey_1, terminalTooltip_1, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTabbedView = void 0;
    const $ = dom.$;
    var CssClass;
    (function (CssClass) {
        CssClass["ViewIsVertical"] = "terminal-side-view";
    })(CssClass || (CssClass = {}));
    var WidthConstants;
    (function (WidthConstants) {
        WidthConstants[WidthConstants["StatusIcon"] = 30] = "StatusIcon";
        WidthConstants[WidthConstants["SplitAnnotation"] = 30] = "SplitAnnotation";
    })(WidthConstants || (WidthConstants = {}));
    let TerminalTabbedView = class TerminalTabbedView extends lifecycle_1.Disposable {
        constructor(parentElement, _terminalService, _terminalGroupService, _instantiationService, _notificationService, _contextMenuService, _configurationService, menuService, _storageService, contextKeyService, _hoverService) {
            super();
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._instantiationService = _instantiationService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._configurationService = _configurationService;
            this._storageService = _storageService;
            this._hoverService = _hoverService;
            this._cancelContextMenu = false;
            this._tabContainer = $('.tabs-container');
            const tabListContainer = $('.tabs-list-container');
            this._tabListElement = $('.tabs-list');
            tabListContainer.appendChild(this._tabListElement);
            this._tabContainer.appendChild(tabListContainer);
            this._instanceMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalInstanceContext, contextKeyService));
            this._tabsListMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalTabContext, contextKeyService));
            this._tabsListEmptyMenu = this._register(menuService.createMenu(actions_2.MenuId.TerminalTabEmptyAreaContext, contextKeyService));
            this._tabList = this._register(this._instantiationService.createInstance(terminalTabsList_1.TerminalTabList, this._tabListElement));
            const terminalOuterContainer = $('.terminal-outer-container');
            this._terminalContainer = $('.terminal-groups-container');
            terminalOuterContainer.appendChild(this._terminalContainer);
            this._terminalService.setContainers(parentElement, this._terminalContainer);
            this._terminalIsTabsNarrowContextKey = terminalContextKey_1.TerminalContextKeys.tabsNarrow.bindTo(contextKeyService);
            this._terminalTabsFocusContextKey = terminalContextKey_1.TerminalContextKeys.tabsFocus.bindTo(contextKeyService);
            this._terminalTabsMouseContextKey = terminalContextKey_1.TerminalContextKeys.tabsMouse.bindTo(contextKeyService);
            this._tabTreeIndex = this._terminalService.configHelper.config.tabs.location === 'left' ? 0 : 1;
            this._terminalContainerIndex = this._terminalService.configHelper.config.tabs.location === 'left' ? 1 : 0;
            _configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */) ||
                    e.affectsConfiguration("terminal.integrated.tabs.hideCondition" /* TerminalSettingId.TabsHideCondition */)) {
                    this._refreshShowTabs();
                }
                else if (e.affectsConfiguration("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */)) {
                    this._tabTreeIndex = this._terminalService.configHelper.config.tabs.location === 'left' ? 0 : 1;
                    this._terminalContainerIndex = this._terminalService.configHelper.config.tabs.location === 'left' ? 1 : 0;
                    if (this._shouldShowTabs()) {
                        this._splitView.swapViews(0, 1);
                        this._removeSashListener();
                        this._addSashListener();
                        this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
                    }
                }
            });
            this._register(this._terminalGroupService.onDidChangeInstances(() => this._refreshShowTabs()));
            this._register(this._terminalGroupService.onDidChangeGroups(() => this._refreshShowTabs()));
            this._attachEventListeners(parentElement, this._terminalContainer);
            this._terminalGroupService.onDidChangePanelOrientation((orientation) => {
                this._panelOrientation = orientation;
                if (this._panelOrientation === 0 /* Orientation.VERTICAL */) {
                    this._terminalContainer.classList.add("terminal-side-view" /* CssClass.ViewIsVertical */);
                }
                else {
                    this._terminalContainer.classList.remove("terminal-side-view" /* CssClass.ViewIsVertical */);
                }
            });
            this._splitView = new splitview_1.SplitView(parentElement, { orientation: 1 /* Orientation.HORIZONTAL */, proportionalLayout: false });
            this._setupSplitView(terminalOuterContainer);
        }
        _shouldShowTabs() {
            const enabled = this._terminalService.configHelper.config.tabs.enabled;
            const hide = this._terminalService.configHelper.config.tabs.hideCondition;
            if (!enabled) {
                return false;
            }
            if (hide === 'never') {
                return true;
            }
            if (hide === 'singleTerminal' && this._terminalGroupService.instances.length > 1) {
                return true;
            }
            if (hide === 'singleGroup' && this._terminalGroupService.groups.length > 1) {
                return true;
            }
            return false;
        }
        _refreshShowTabs() {
            if (this._shouldShowTabs()) {
                if (this._splitView.length === 1) {
                    this._addTabTree();
                    this._addSashListener();
                    this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
                    this.rerenderTabs();
                }
            }
            else {
                if (this._splitView.length === 2 && !this._terminalTabsMouseContextKey.get()) {
                    this._splitView.removeView(this._tabTreeIndex);
                    if (this._plusButton) {
                        this._tabContainer.removeChild(this._plusButton);
                    }
                    this._removeSashListener();
                }
            }
        }
        _getLastListWidth() {
            const widthKey = this._panelOrientation === 0 /* Orientation.VERTICAL */ ? "tabs-list-width-vertical" /* TerminalStorageKeys.TabsListWidthVertical */ : "tabs-list-width-horizontal" /* TerminalStorageKeys.TabsListWidthHorizontal */;
            const storedValue = this._storageService.get(widthKey, 0 /* StorageScope.PROFILE */);
            if (!storedValue || !parseInt(storedValue)) {
                // we want to use the min width by default for the vertical orientation bc
                // there is such a limited width for the terminal panel to begin w there.
                return this._panelOrientation === 0 /* Orientation.VERTICAL */ ? 46 /* TerminalTabsListSizes.NarrowViewWidth */ : 120 /* TerminalTabsListSizes.DefaultWidth */;
            }
            return parseInt(storedValue);
        }
        _handleOnDidSashReset() {
            // Calculate ideal size of list to display all text based on its contents
            let idealWidth = 80 /* TerminalTabsListSizes.WideViewMinimumWidth */;
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 1;
            offscreenCanvas.height = 1;
            const ctx = offscreenCanvas.getContext('2d');
            if (ctx) {
                const style = dom.getWindow(this._tabListElement).getComputedStyle(this._tabListElement);
                ctx.font = `${style.fontStyle} ${style.fontSize} ${style.fontFamily}`;
                const maxInstanceWidth = this._terminalGroupService.instances.reduce((p, c) => {
                    return Math.max(p, ctx.measureText(c.title + (c.description || '')).width + this._getAdditionalWidth(c));
                }, 0);
                idealWidth = Math.ceil(Math.max(maxInstanceWidth, 80 /* TerminalTabsListSizes.WideViewMinimumWidth */));
            }
            // If the size is already ideal, toggle to collapsed
            const currentWidth = Math.ceil(this._splitView.getViewSize(this._tabTreeIndex));
            if (currentWidth === idealWidth) {
                idealWidth = 46 /* TerminalTabsListSizes.NarrowViewWidth */;
            }
            this._splitView.resizeView(this._tabTreeIndex, idealWidth);
            this._updateListWidth(idealWidth);
        }
        _getAdditionalWidth(instance) {
            // Size to include padding, icon, status icon (if any), split annotation (if any), + a little more
            const additionalWidth = 40;
            const statusIconWidth = instance.statusList.statuses.length > 0 ? 30 /* WidthConstants.StatusIcon */ : 0;
            const splitAnnotationWidth = (this._terminalGroupService.getGroupForInstance(instance)?.terminalInstances.length || 0) > 1 ? 30 /* WidthConstants.SplitAnnotation */ : 0;
            return additionalWidth + splitAnnotationWidth + statusIconWidth;
        }
        _handleOnDidSashChange() {
            const listWidth = this._splitView.getViewSize(this._tabTreeIndex);
            if (!this._width || listWidth <= 0) {
                return;
            }
            this._updateListWidth(listWidth);
        }
        _updateListWidth(width) {
            if (width < 63 /* TerminalTabsListSizes.MidpointViewWidth */ && width >= 46 /* TerminalTabsListSizes.NarrowViewWidth */) {
                width = 46 /* TerminalTabsListSizes.NarrowViewWidth */;
                this._splitView.resizeView(this._tabTreeIndex, width);
            }
            else if (width >= 63 /* TerminalTabsListSizes.MidpointViewWidth */ && width < 80 /* TerminalTabsListSizes.WideViewMinimumWidth */) {
                width = 80 /* TerminalTabsListSizes.WideViewMinimumWidth */;
                this._splitView.resizeView(this._tabTreeIndex, width);
            }
            this.rerenderTabs();
            const widthKey = this._panelOrientation === 0 /* Orientation.VERTICAL */ ? "tabs-list-width-vertical" /* TerminalStorageKeys.TabsListWidthVertical */ : "tabs-list-width-horizontal" /* TerminalStorageKeys.TabsListWidthHorizontal */;
            this._storageService.store(widthKey, width, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        _setupSplitView(terminalOuterContainer) {
            this._register(this._splitView.onDidSashReset(() => this._handleOnDidSashReset()));
            this._register(this._splitView.onDidSashChange(() => this._handleOnDidSashChange()));
            if (this._shouldShowTabs()) {
                this._addTabTree();
            }
            this._splitView.addView({
                element: terminalOuterContainer,
                layout: width => this._terminalGroupService.groups.forEach(tab => tab.layout(width, this._height || 0)),
                minimumSize: 120,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: () => lifecycle_1.Disposable.None,
                priority: 2 /* LayoutPriority.High */
            }, splitview_1.Sizing.Distribute, this._terminalContainerIndex);
            if (this._shouldShowTabs()) {
                this._addSashListener();
            }
        }
        _addTabTree() {
            this._splitView.addView({
                element: this._tabContainer,
                layout: width => this._tabList.layout(this._height || 0, width),
                minimumSize: 46 /* TerminalTabsListSizes.NarrowViewWidth */,
                maximumSize: 500 /* TerminalTabsListSizes.MaximumWidth */,
                onDidChange: () => lifecycle_1.Disposable.None,
                priority: 1 /* LayoutPriority.Low */
            }, splitview_1.Sizing.Distribute, this._tabTreeIndex);
            this.rerenderTabs();
        }
        rerenderTabs() {
            this._updateHasText();
            this._tabList.refresh();
        }
        _addSashListener() {
            let interval;
            this._sashDisposables = [
                this._splitView.sashes[0].onDidStart(e => {
                    interval = dom.disposableWindowInterval(dom.getWindow(this._splitView.el), () => {
                        this.rerenderTabs();
                    }, 100);
                }),
                this._splitView.sashes[0].onDidEnd(e => {
                    interval.dispose();
                })
            ];
        }
        _removeSashListener() {
            if (this._sashDisposables) {
                (0, lifecycle_1.dispose)(this._sashDisposables);
                this._sashDisposables = undefined;
            }
        }
        _updateHasText() {
            const hasText = this._tabListElement.clientWidth > 63 /* TerminalTabsListSizes.MidpointViewWidth */;
            this._tabContainer.classList.toggle('has-text', hasText);
            this._terminalIsTabsNarrowContextKey.set(!hasText);
        }
        layout(width, height) {
            this._height = height;
            this._width = width;
            this._splitView.layout(width);
            if (this._shouldShowTabs()) {
                this._splitView.resizeView(this._tabTreeIndex, this._getLastListWidth());
            }
            this._updateHasText();
        }
        _attachEventListeners(parentDomElement, terminalContainer) {
            this._register(dom.addDisposableListener(this._tabContainer, 'mouseleave', async (event) => {
                this._terminalTabsMouseContextKey.set(false);
                this._refreshShowTabs();
                event.stopPropagation();
            }));
            this._register(dom.addDisposableListener(this._tabContainer, 'mouseenter', async (event) => {
                this._terminalTabsMouseContextKey.set(true);
                event.stopPropagation();
            }));
            this._register(dom.addDisposableListener(terminalContainer, 'mousedown', async (event) => {
                const terminal = this._terminalGroupService.activeInstance;
                if (this._terminalGroupService.instances.length === 0 || !terminal) {
                    this._cancelContextMenu = true;
                    return;
                }
                if (event.which === 2 && platform_1.isLinux) {
                    // Drop selection and focus terminal on Linux to enable middle button paste when click
                    // occurs on the selection itself.
                    terminal.focus();
                }
                else if (event.which === 3) {
                    const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                    if (rightClickBehavior === 'nothing') {
                        if (!event.shiftKey) {
                            this._cancelContextMenu = true;
                        }
                        return;
                    }
                    else if (rightClickBehavior === 'copyPaste' || rightClickBehavior === 'paste') {
                        // copyPaste: Shift+right click should open context menu
                        if (rightClickBehavior === 'copyPaste' && event.shiftKey) {
                            (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(terminalContainer), event, terminal, this._instanceMenu, this._contextMenuService);
                            return;
                        }
                        if (rightClickBehavior === 'copyPaste' && terminal.hasSelection()) {
                            await terminal.copySelection();
                            terminal.clearSelection();
                        }
                        else {
                            if (canIUse_1.BrowserFeatures.clipboard.readText) {
                                terminal.paste();
                            }
                            else {
                                this._notificationService.info(`This browser doesn't support the clipboard.readText API needed to trigger a paste, try ${platform_1.isMacintosh ? '⌘' : 'Ctrl'}+V instead.`);
                            }
                        }
                        // Clear selection after all click event bubbling is finished on Mac to prevent
                        // right-click selecting a word which is seemed cannot be disabled. There is a
                        // flicker when pasting but this appears to give the best experience if the
                        // setting is enabled.
                        if (platform_1.isMacintosh) {
                            setTimeout(() => {
                                terminal.clearSelection();
                            }, 0);
                        }
                        this._cancelContextMenu = true;
                    }
                }
            }));
            this._register(dom.addDisposableListener(terminalContainer, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    this._cancelContextMenu = true;
                }
                terminalContainer.focus();
                if (!this._cancelContextMenu) {
                    (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(terminalContainer), event, this._terminalGroupService.activeInstance, this._instanceMenu, this._contextMenuService);
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(this._tabContainer, 'contextmenu', (event) => {
                const rightClickBehavior = this._terminalService.configHelper.config.rightClickBehavior;
                if (rightClickBehavior === 'nothing' && !event.shiftKey) {
                    this._cancelContextMenu = true;
                }
                if (!this._cancelContextMenu) {
                    const emptyList = this._tabList.getFocus().length === 0;
                    if (!emptyList) {
                        this._terminalGroupService.lastAccessedMenu = 'tab-list';
                    }
                    // Put the focused item first as it's used as the first positional argument
                    const selectedInstances = this._tabList.getSelectedElements();
                    const focusedInstance = this._tabList.getFocusedElements()?.[0];
                    if (focusedInstance) {
                        selectedInstances.splice(selectedInstances.findIndex(e => e.instanceId === focusedInstance.instanceId), 1);
                        selectedInstances.unshift(focusedInstance);
                    }
                    (0, terminalContextMenu_1.openContextMenu)(dom.getWindow(this._tabContainer), event, selectedInstances, emptyList ? this._tabsListEmptyMenu : this._tabsListMenu, this._contextMenuService, emptyList ? this._getTabActions() : undefined);
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                this._cancelContextMenu = false;
            }));
            this._register(dom.addDisposableListener(terminalContainer.ownerDocument, 'keydown', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(terminalContainer.ownerDocument, 'keyup', (event) => {
                terminalContainer.classList.toggle('alt-active', !!event.altKey);
            }));
            this._register(dom.addDisposableListener(parentDomElement, 'keyup', (event) => {
                if (event.keyCode === 27) {
                    // Keep terminal open on escape
                    event.stopPropagation();
                }
            }));
            this._register(dom.addDisposableListener(this._tabContainer, dom.EventType.FOCUS_IN, () => {
                this._terminalTabsFocusContextKey.set(true);
            }));
            this._register(dom.addDisposableListener(this._tabContainer, dom.EventType.FOCUS_OUT, () => {
                this._terminalTabsFocusContextKey.set(false);
            }));
        }
        _getTabActions() {
            return [
                new actions_1.Separator(),
                this._configurationService.inspect("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */).userValue === 'left' ?
                    new actions_1.Action('moveRight', (0, nls_1.localize)('moveTabsRight', "Move Tabs Right"), undefined, undefined, async () => {
                        this._configurationService.updateValue("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */, 'right');
                    }) :
                    new actions_1.Action('moveLeft', (0, nls_1.localize)('moveTabsLeft', "Move Tabs Left"), undefined, undefined, async () => {
                        this._configurationService.updateValue("terminal.integrated.tabs.location" /* TerminalSettingId.TabsLocation */, 'left');
                    }),
                new actions_1.Action('hideTabs', (0, nls_1.localize)('hideTabs', "Hide Tabs"), undefined, undefined, async () => {
                    this._configurationService.updateValue("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */, false);
                })
            ];
        }
        setEditable(isEditing) {
            if (!isEditing) {
                this._tabList.domFocus();
            }
            this._tabList.refresh(false);
        }
        focusTabs() {
            if (!this._shouldShowTabs()) {
                return;
            }
            this._terminalTabsFocusContextKey.set(true);
            const selected = this._tabList.getSelection();
            this._tabList.domFocus();
            if (selected) {
                this._tabList.setFocus(selected);
            }
        }
        focus() {
            if (this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                this._focus();
                return;
            }
            // If the terminal is waiting to reconnect to remote terminals, then there is no TerminalInstance yet that can
            // be focused. So wait for connection to finish, then focus.
            const previousActiveElement = this._tabListElement.ownerDocument.activeElement;
            if (previousActiveElement) {
                // TODO: Improve lifecycle management this event should be disposed after first fire
                this._register(this._terminalService.onDidChangeConnectionState(() => {
                    // Only focus the terminal if the activeElement has not changed since focus() was called
                    // TODO: Hack
                    if (dom.isActiveElement(previousActiveElement)) {
                        this._focus();
                    }
                }));
            }
        }
        focusHover() {
            if (this._shouldShowTabs()) {
                this._tabList.focusHover();
                return;
            }
            const instance = this._terminalGroupService.activeInstance;
            if (!instance) {
                return;
            }
            this._hoverService.showHover({
                ...(0, terminalTooltip_1.getInstanceHoverInfo)(instance),
                target: this._terminalContainer,
                trapFocus: true
            }, true);
        }
        _focus() {
            this._terminalGroupService.activeInstance?.focusWhenReady();
        }
    };
    exports.TerminalTabbedView = TerminalTabbedView;
    exports.TerminalTabbedView = TerminalTabbedView = __decorate([
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalGroupService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notification_1.INotificationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, actions_2.IMenuService),
        __param(8, storage_1.IStorageService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, hover_1.IHoverService)
    ], TerminalTabbedView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxUYWJiZWRWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsVGFiYmVkVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsSUFBVyxRQUVWO0lBRkQsV0FBVyxRQUFRO1FBQ2xCLGlEQUFxQyxDQUFBO0lBQ3RDLENBQUMsRUFGVSxRQUFRLEtBQVIsUUFBUSxRQUVsQjtJQUVELElBQVcsY0FHVjtJQUhELFdBQVcsY0FBYztRQUN4QixnRUFBZSxDQUFBO1FBQ2YsMEVBQW9CLENBQUE7SUFDckIsQ0FBQyxFQUhVLGNBQWMsS0FBZCxjQUFjLFFBR3hCO0lBRU0sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTtRQThCakQsWUFDQyxhQUEwQixFQUNSLGdCQUFtRCxFQUM5QyxxQkFBNkQsRUFDN0QscUJBQTZELEVBQzlELG9CQUEyRCxFQUM1RCxtQkFBeUQsRUFDdkQscUJBQTZELEVBQ3RFLFdBQXlCLEVBQ3RCLGVBQWlELEVBQzlDLGlCQUFxQyxFQUMxQyxhQUE2QztZQUU1RCxLQUFLLEVBQUUsQ0FBQztZQVgyQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQzdCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUM3Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQzNDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDdEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUVsRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7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