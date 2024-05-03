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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/browser/parts/views/viewPane", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/terminal/common/terminal", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/browser/terminalTabbedView", "vs/platform/commands/common/commands", "vs/base/browser/ui/iconLabel/iconLabels", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/theme/common/theme", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalTooltip", "vs/platform/theme/browser/defaultStyles", "vs/base/common/event", "vs/platform/hover/browser/hover", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/terminal/browser/terminalContextMenu"], function (require, exports, nls, dom, actions_1, configuration_1, contextView_1, instantiation_1, telemetry_1, themeService_1, themables_1, terminalActions_1, notification_1, terminal_1, viewPane_1, keybinding_1, contextkey_1, views_1, opener_1, actions_2, terminal_2, terminal_3, actionViewItems_1, colorRegistry_1, terminalTabbedView_1, commands_1, iconLabels_1, terminalStatusList_1, menuEntryActionViewItem_1, dropdownWithPrimaryActionViewItem_1, lifecycle_1, uri_1, theme_1, terminalIcon_1, terminalMenus_1, terminalContextKey_1, terminalTooltip_1, defaultStyles_1, event_1, hover_1, accessibility_1, terminalContextMenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalViewPane = void 0;
    let TerminalViewPane = class TerminalViewPane extends viewPane_1.ViewPane {
        get terminalTabbedView() { return this._terminalTabbedView; }
        constructor(options, keybindingService, _contextKeyService, viewDescriptorService, _configurationService, _contextMenuService, _instantiationService, _terminalService, _terminalGroupService, themeService, telemetryService, _notificationService, _keybindingService, openerService, _menuService, _terminalProfileService, _terminalProfileResolverService, _themeService, _accessibilityService) {
            super(options, keybindingService, _contextMenuService, _configurationService, _contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService);
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._notificationService = _notificationService;
            this._keybindingService = _keybindingService;
            this._menuService = _menuService;
            this._terminalProfileService = _terminalProfileService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._themeService = _themeService;
            this._accessibilityService = _accessibilityService;
            this._isInitialized = false;
            this._register(this._terminalService.onDidRegisterProcessSupport(() => {
                this._onDidChangeViewWelcomeState.fire();
            }));
            this._register(this._terminalService.onDidChangeInstances(() => {
                // If the first terminal is opened, hide the welcome view
                // and if the last one is closed, show it again
                if (this._hasWelcomeScreen() && this._terminalService.instances.length <= 1) {
                    this._onDidChangeViewWelcomeState.fire();
                }
                if (!this._parentDomElement) {
                    return;
                }
                // If we do not have the tab view yet, create it now.
                if (!this._terminalTabbedView) {
                    this._createTabsView();
                }
                // If we just opened our first terminal, layout
                if (this._terminalService.instances.length === 1) {
                    this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
                }
            }));
            this._dropdownMenu = this._register(this._menuService.createMenu(actions_2.MenuId.TerminalNewDropdownContext, this._contextKeyService));
            this._singleTabMenu = this._register(this._menuService.createMenu(actions_2.MenuId.TerminalTabContext, this._contextKeyService));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(profiles => this._updateTabActionBar(profiles)));
            this._viewShowing = terminalContextKey_1.TerminalContextKeys.viewShowing.bindTo(this._contextKeyService);
            this._register(this.onDidChangeBodyVisibility(e => {
                if (e) {
                    this._terminalTabbedView?.rerenderTabs();
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (this._parentDomElement && (e.affectsConfiguration("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) || e.affectsConfiguration("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */))) {
                    this._updateForShellIntegration(this._parentDomElement);
                }
            }));
            this._register(this._terminalService.onDidCreateInstance((i) => {
                i.capabilities.onDidAddCapabilityType(c => {
                    if (c === 2 /* TerminalCapability.CommandDetection */ && this._gutterDecorationsEnabled()) {
                        this._parentDomElement?.classList.add('shell-integration');
                    }
                });
            }));
        }
        _updateForShellIntegration(container) {
            container.classList.toggle('shell-integration', this._gutterDecorationsEnabled());
        }
        _gutterDecorationsEnabled() {
            const decorationsEnabled = this._configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */);
            return (decorationsEnabled === 'both' || decorationsEnabled === 'gutter') && this._configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */);
        }
        _initializeTerminal(checkRestoredTerminals) {
            if (this.isBodyVisible() && this._terminalService.isProcessSupportRegistered && this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                const wasInitialized = this._isInitialized;
                this._isInitialized = true;
                let hideOnStartup = 'never';
                if (!wasInitialized) {
                    hideOnStartup = this._configurationService.getValue("terminal.integrated.hideOnStartup" /* TerminalSettingId.HideOnStartup */);
                    if (hideOnStartup === 'always') {
                        this._terminalGroupService.hidePanel();
                    }
                }
                let shouldCreate = this._terminalGroupService.groups.length === 0;
                // When triggered just after reconnection, also check there are no groups that could be
                // getting restored currently
                if (checkRestoredTerminals) {
                    shouldCreate &&= this._terminalService.restoredGroupCount === 0;
                }
                if (!shouldCreate) {
                    return;
                }
                if (!wasInitialized) {
                    switch (hideOnStartup) {
                        case 'never':
                            this._terminalService.createTerminal({ location: terminal_3.TerminalLocation.Panel });
                            break;
                        case 'whenEmpty':
                            if (this._terminalService.restoredGroupCount === 0) {
                                this._terminalGroupService.hidePanel();
                            }
                            break;
                    }
                    return;
                }
                this._terminalService.createTerminal({ location: terminal_3.TerminalLocation.Panel });
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        renderBody(container) {
            super.renderBody(container);
            if (!this._parentDomElement) {
                this._updateForShellIntegration(container);
            }
            this._parentDomElement = container;
            this._parentDomElement.classList.add('integrated-terminal');
            dom.createStyleSheet(this._parentDomElement);
            this._instantiationService.createInstance(TerminalThemeIconStyle, this._parentDomElement);
            if (!this.shouldShowWelcome()) {
                this._createTabsView();
            }
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */) || e.affectsConfiguration('editor.fontFamily')) {
                    const configHelper = this._terminalService.configHelper;
                    if (!configHelper.configFontIsMonospace()) {
                        const choices = [{
                                label: nls.localize('terminal.useMonospace', "Use 'monospace'"),
                                run: () => this.configurationService.updateValue("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */, 'monospace'),
                            }];
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.monospaceOnly', "The terminal only supports monospace fonts. Be sure to restart VS Code if this is a newly installed font."), choices);
                    }
                }
            }));
            this._register(this.onDidChangeBodyVisibility(async (visible) => {
                this._viewShowing.set(visible);
                if (visible) {
                    if (this._hasWelcomeScreen()) {
                        this._onDidChangeViewWelcomeState.fire();
                    }
                    this._initializeTerminal(false);
                    // we don't know here whether or not it should be focused, so
                    // defer focusing the panel to the focus() call
                    // to prevent overriding preserveFocus for extensions
                    this._terminalGroupService.showPanel(false);
                }
                else {
                    for (const instance of this._terminalGroupService.instances) {
                        instance.resetFocusContextKey();
                    }
                }
                this._terminalGroupService.updateVisibility();
            }));
            this._register(this._terminalService.onDidChangeConnectionState(() => this._initializeTerminal(true)));
            this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
        }
        _createTabsView() {
            if (!this._parentDomElement) {
                return;
            }
            this._terminalTabbedView = this.instantiationService.createInstance(terminalTabbedView_1.TerminalTabbedView, this._parentDomElement);
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._terminalTabbedView?.layout(width, height);
        }
        getActionViewItem(action, options) {
            switch (action.id) {
                case "workbench.action.terminal.split" /* TerminalCommandId.Split */: {
                    // Split needs to be special cased to force splitting within the panel, not the editor
                    const that = this;
                    const panelOnlySplitAction = new class extends actions_1.Action {
                        constructor() {
                            super(action.id, action.label, action.class, action.enabled);
                            this.checked = action.checked;
                            this.tooltip = action.tooltip;
                            this._register(action);
                        }
                        async run() {
                            const instance = that._terminalGroupService.activeInstance;
                            if (instance) {
                                const newInstance = await that._terminalService.createTerminal({ location: { parentTerminal: instance } });
                                return newInstance?.focusWhenReady();
                            }
                            return;
                        }
                    };
                    return new actionViewItems_1.ActionViewItem(action, panelOnlySplitAction, { ...options, icon: true, label: false, keybinding: this._getKeybindingLabel(action) });
                }
                case "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */: {
                    return this._instantiationService.createInstance(SwitchTerminalActionViewItem, action);
                }
                case "workbench.action.terminal.focus" /* TerminalCommandId.Focus */: {
                    if (action instanceof actions_2.MenuItemAction) {
                        const actions = [];
                        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this._singleTabMenu, { shouldForwardArgs: true }, actions);
                        return this._instantiationService.createInstance(SingleTerminalTabActionViewItem, action, actions);
                    }
                }
                case "workbench.action.terminal.new" /* TerminalCommandId.New */: {
                    if (action instanceof actions_2.MenuItemAction) {
                        const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
                        this._newDropdown?.dispose();
                        this._newDropdown = new dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem(action, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, { hoverDelegate: options.hoverDelegate }, this._keybindingService, this._notificationService, this._contextKeyService, this._themeService, this._accessibilityService);
                        this._updateTabActionBar(this._terminalProfileService.availableProfiles);
                        return this._newDropdown;
                    }
                }
            }
            return super.getActionViewItem(action, options);
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
        _getKeybindingLabel(action) {
            return this._keybindingService.lookupKeybinding(action.id)?.getLabel() ?? undefined;
        }
        _updateTabActionBar(profiles) {
            const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, profiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._terminalService, this._dropdownMenu);
            this._newDropdown?.update(actions.dropdownAction, actions.dropdownMenuActions);
        }
        focus() {
            super.focus();
            if (this._terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
                this._terminalGroupService.showPanel(true);
                return;
            }
            // If the terminal is waiting to reconnect to remote terminals, then there is no TerminalInstance yet that can
            // be focused. So wait for connection to finish, then focus.
            const previousActiveElement = this.element.ownerDocument.activeElement;
            if (previousActiveElement) {
                // TODO: Improve lifecycle management this event should be disposed after first fire
                this._register(this._terminalService.onDidChangeConnectionState(() => {
                    // Only focus the terminal if the activeElement has not changed since focus() was called
                    // TODO: Hack
                    if (previousActiveElement && dom.isActiveElement(previousActiveElement)) {
                        this._terminalGroupService.showPanel(true);
                    }
                }));
            }
        }
        _hasWelcomeScreen() {
            return !this._terminalService.isProcessSupportRegistered;
        }
        shouldShowWelcome() {
            return this._hasWelcomeScreen() && this._terminalService.instances.length === 0;
        }
    };
    exports.TerminalViewPane = TerminalViewPane;
    exports.TerminalViewPane = TerminalViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalService),
        __param(8, terminal_1.ITerminalGroupService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, notification_1.INotificationService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, opener_1.IOpenerService),
        __param(14, actions_2.IMenuService),
        __param(15, terminal_2.ITerminalProfileService),
        __param(16, terminal_2.ITerminalProfileResolverService),
        __param(17, themeService_1.IThemeService),
        __param(18, accessibility_1.IAccessibilityService)
    ], TerminalViewPane);
    let SwitchTerminalActionViewItem = class SwitchTerminalActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, _terminalService, _terminalGroupService, contextViewService, terminalProfileService) {
            super(null, action, getTerminalSelectOpenItems(_terminalService, _terminalGroupService), _terminalGroupService.activeGroupIndex, contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: nls.localize('terminals', 'Open Terminals.'), optionsAsChildren: true });
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._register(_terminalService.onDidChangeInstances(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveGroup(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveInstance(() => this._updateItems(), this));
            this._register(_terminalService.onAnyInstanceTitleChange(() => this._updateItems(), this));
            this._register(_terminalGroupService.onDidChangeGroups(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeConnectionState(() => this._updateItems(), this));
            this._register(terminalProfileService.onDidChangeAvailableProfiles(() => this._updateItems(), this));
            this._register(_terminalService.onAnyInstancePrimaryStatusChange(() => this._updateItems(), this));
        }
        render(container) {
            super.render(container);
            container.classList.add('switch-terminal');
            container.style.borderColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder);
        }
        _updateItems() {
            const options = getTerminalSelectOpenItems(this._terminalService, this._terminalGroupService);
            this.setOptions(options, this._terminalGroupService.activeGroupIndex);
        }
    };
    SwitchTerminalActionViewItem = __decorate([
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalGroupService),
        __param(3, contextView_1.IContextViewService),
        __param(4, terminal_2.ITerminalProfileService)
    ], SwitchTerminalActionViewItem);
    function getTerminalSelectOpenItems(terminalService, terminalGroupService) {
        let items;
        if (terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
            items = terminalGroupService.getGroupLabels().map(label => {
                return { text: label };
            });
        }
        else {
            items = [{ text: nls.localize('terminalConnectingLabel', "Starting...") }];
        }
        items.push({ text: terminalActions_1.switchTerminalActionViewItemSeparator, isDisabled: true });
        items.push({ text: terminalActions_1.switchTerminalShowTabsTitle });
        return items;
    }
    let SingleTerminalTabActionViewItem = class SingleTerminalTabActionViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        constructor(action, _actions, keybindingService, notificationService, contextKeyService, themeService, _terminalService, _terminalGroupService, contextMenuService, _commandService, _instantiationService, _accessibilityService) {
            super(action, {
                draggable: true,
                hoverDelegate: _instantiationService.createInstance(SingleTabHoverDelegate)
            }, keybindingService, notificationService, contextKeyService, themeService, contextMenuService, _accessibilityService);
            this._actions = _actions;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._commandService = _commandService;
            this._instantiationService = _instantiationService;
            this._elementDisposables = [];
            // Register listeners to update the tab
            this._register(event_1.Event.debounce(event_1.Event.any(this._terminalService.onAnyInstancePrimaryStatusChange, this._terminalGroupService.onDidChangeActiveInstance, event_1.Event.map(this._terminalService.onAnyInstanceIconChange, e => e.instance), this._terminalService.onAnyInstanceTitleChange, this._terminalService.onDidChangeInstanceCapability), (last, e) => {
                if (!last) {
                    last = new Set();
                }
                if (e) {
                    last.add(e);
                }
                return last;
            })(merged => {
                for (const e of merged) {
                    this.updateLabel(e);
                }
            }));
            // Clean up on dispose
            this._register((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(this._elementDisposables)));
        }
        async onClick(event) {
            this._terminalGroupService.lastAccessedMenu = 'inline-tab';
            if (event.altKey && this._menuItemAction.alt) {
                this._commandService.executeCommand(this._menuItemAction.alt.id, { target: terminal_3.TerminalLocation.Panel });
            }
            else {
                this._openContextMenu();
            }
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        updateLabel(e) {
            // Only update if it's the active instance
            if (e && e !== this._terminalGroupService.activeInstance) {
                return;
            }
            if (this._elementDisposables.length === 0 && this.element && this.label) {
                // Right click opens context menu
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.CONTEXT_MENU, e => {
                    if (e.button === 2) {
                        this._openContextMenu();
                        e.preventDefault();
                    }
                }));
                // Middle click kills
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.AUXCLICK, e => {
                    if (e.button === 1) {
                        const instance = this._terminalGroupService.activeInstance;
                        if (instance) {
                            this._terminalService.safeDisposeTerminal(instance);
                        }
                        e.preventDefault();
                    }
                }));
                // Drag and drop
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.DRAG_START, e => {
                    const instance = this._terminalGroupService.activeInstance;
                    if (e.dataTransfer && instance) {
                        e.dataTransfer.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify([instance.resource.toString()]));
                    }
                }));
            }
            if (this.label) {
                const label = this.label;
                const instance = this._terminalGroupService.activeInstance;
                if (!instance) {
                    dom.reset(label, '');
                    return;
                }
                label.classList.add('single-terminal-tab');
                let colorStyle = '';
                const primaryStatus = instance.statusList.primary;
                if (primaryStatus) {
                    const colorKey = (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity);
                    this._themeService.getColorTheme();
                    const foundColor = this._themeService.getColorTheme().getColor(colorKey);
                    if (foundColor) {
                        colorStyle = foundColor.toString();
                    }
                }
                label.style.color = colorStyle;
                dom.reset(label, ...(0, iconLabels_1.renderLabelWithIcons)(this._instantiationService.invokeFunction(getSingleTabLabel, instance, this._terminalService.configHelper.config.tabs.separator, themables_1.ThemeIcon.isThemeIcon(this._commandAction.item.icon) ? this._commandAction.item.icon : undefined)));
                if (this._altCommand) {
                    label.classList.remove(this._altCommand);
                    this._altCommand = undefined;
                }
                if (this._color) {
                    label.classList.remove(this._color);
                    this._color = undefined;
                }
                if (this._class) {
                    label.classList.remove(this._class);
                    label.classList.remove('terminal-uri-icon');
                    this._class = undefined;
                }
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (colorClass) {
                    this._color = colorClass;
                    label.classList.add(colorClass);
                }
                const uriClasses = (0, terminalIcon_1.getUriClasses)(instance, this._themeService.getColorTheme().type);
                if (uriClasses) {
                    this._class = uriClasses?.[0];
                    label.classList.add(...uriClasses);
                }
                if (this._commandAction.item.icon) {
                    this._altCommand = `alt-command`;
                    label.classList.add(this._altCommand);
                }
                this.updateTooltip();
            }
        }
        _openContextMenu() {
            this._contextMenuService.showContextMenu({
                actionRunner: new terminalContextMenu_1.TerminalContextActionRunner(),
                getAnchor: () => this.element,
                getActions: () => this._actions,
                // The context is always the active instance in the terminal view
                getActionsContext: () => {
                    const instance = this._terminalGroupService.activeInstance;
                    return instance ? [new terminalContextMenu_1.InstanceContext(instance)] : [];
                }
            });
        }
    };
    SingleTerminalTabActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService),
        __param(6, terminal_1.ITerminalService),
        __param(7, terminal_1.ITerminalGroupService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, commands_1.ICommandService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, accessibility_1.IAccessibilityService)
    ], SingleTerminalTabActionViewItem);
    function getSingleTabLabel(accessor, instance, separator, icon) {
        // Don't even show the icon if there is no title as the icon would shift around when the title
        // is added
        if (!instance || !instance.title) {
            return '';
        }
        const iconId = themables_1.ThemeIcon.isThemeIcon(instance.icon) ? instance.icon.id : accessor.get(terminal_2.ITerminalProfileResolverService).getDefaultIcon().id;
        const label = `$(${icon?.id || iconId}) ${getSingleTabTitle(instance, separator)}`;
        const primaryStatus = instance.statusList.primary;
        if (!primaryStatus?.icon) {
            return label;
        }
        return `${label} $(${primaryStatus.icon.id})`;
    }
    function getSingleTabTitle(instance, separator) {
        if (!instance) {
            return '';
        }
        return !instance.description ? instance.title : `${instance.title} ${separator} ${instance.description}`;
    }
    let TerminalThemeIconStyle = class TerminalThemeIconStyle extends themeService_1.Themable {
        constructor(container, _themeService, _terminalService, _terminalGroupService) {
            super(_themeService);
            this._themeService = _themeService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._registerListeners();
            this._styleElement = dom.createStyleSheet(container);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onAnyInstanceIconChange(() => this.updateStyles()));
            this._register(this._terminalService.onDidChangeInstances(() => this.updateStyles()));
            this._register(this._terminalGroupService.onDidChangeGroups(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_1.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .${iconClasses[0]} .monaco-highlighted-label .codicon, .monaco-action-bar .terminal-uri-icon.single-terminal-tab.action-label:not(.alt-command) .codicon` +
                        `{background-image: ${dom.asCSSUrl(uri)};}`);
                }
            }
            // Add colors
            for (const instance of this._terminalService.instances) {
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (!colorClass || !instance.color) {
                    continue;
                }
                const color = colorTheme.getColor(instance.color);
                if (color) {
                    // exclude status icons (file-icon) and inline action icons (trashcan and horizontalSplit)
                    css += (`.monaco-workbench .${colorClass} .codicon:first-child:not(.codicon-split-horizontal):not(.codicon-trashcan):not(.file-icon)` +
                        `{ color: ${color} !important; }`);
                }
            }
            this._styleElement.textContent = css;
        }
    };
    TerminalThemeIconStyle = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, terminal_1.ITerminalService),
        __param(3, terminal_1.ITerminalGroupService)
    ], TerminalThemeIconStyle);
    let SingleTabHoverDelegate = class SingleTabHoverDelegate {
        constructor(_configurationService, _hoverService, _terminalGroupService) {
            this._configurationService = _configurationService;
            this._hoverService = _hoverService;
            this._terminalGroupService = _terminalGroupService;
            this._lastHoverHideTime = 0;
            this.placement = 'element';
        }
        get delay() {
            return Date.now() - this._lastHoverHideTime < 200
                ? 0 // show instantly when a hover was recently shown
                : this._configurationService.getValue('workbench.hover.delay');
        }
        showHover(options, focus) {
            const instance = this._terminalGroupService.activeInstance;
            if (!instance) {
                return;
            }
            const hoverInfo = (0, terminalTooltip_1.getInstanceHoverInfo)(instance);
            return this._hoverService.showHover({
                ...options,
                content: hoverInfo.content,
                actions: hoverInfo.actions
            }, focus);
        }
        onDidHideHover() {
            this._lastHoverHideTime = Date.now();
        }
    };
    SingleTabHoverDelegate = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, hover_1.IHoverService),
        __param(2, terminal_1.ITerminalGroupService)
    ], SingleTabHoverDelegate);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxWaWV3LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnRHpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsbUJBQVE7UUFHN0MsSUFBSSxrQkFBa0IsS0FBcUMsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBTzdGLFlBQ0MsT0FBeUIsRUFDTCxpQkFBcUMsRUFDckMsa0JBQXVELEVBQ25ELHFCQUE2QyxFQUM5QyxxQkFBNkQsRUFDL0QsbUJBQXlELEVBQ3ZELHFCQUE2RCxFQUNsRSxnQkFBbUQsRUFDOUMscUJBQTZELEVBQ3JFLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUNoQyxvQkFBMkQsRUFDN0Qsa0JBQXVELEVBQzNELGFBQTZCLEVBQy9CLFlBQTJDLEVBQ2hDLHVCQUFpRSxFQUN6RCwrQkFBaUYsRUFDbkcsYUFBNkMsRUFDckMscUJBQTZEO1lBRXBGLEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsbUJBQW1CLEVBQUUscUJBQXFCLEVBQUUsa0JBQWtCLEVBQUUscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBbEIxSix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBRW5DLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDOUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN0QywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2pELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDN0IsMEJBQXFCLEdBQXJCLHFC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