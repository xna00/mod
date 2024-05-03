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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/activity", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/compositeBarActions", "vs/base/common/codicons", "vs/base/common/themables", "vs/platform/theme/common/iconRegistry", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/common/lazy", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/secrets/common/secrets", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/common/environmentService", "vs/platform/hover/browser/hover", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfileIcons", "vs/base/common/types", "vs/workbench/common/theme", "vs/platform/commands/common/commands"], function (require, exports, nls_1, actionbar_1, activity_1, activity_2, instantiation_1, lifecycle_1, themeService_1, storage_1, extensions_1, compositeBarActions_1, codicons_1, themables_1, iconRegistry_1, actions_1, actions_2, dom_1, keyboardEvent_1, mouseEvent_1, touch_1, lazy_1, menuEntryActionViewItem_1, configuration_1, contextkey_1, contextView_1, keybinding_1, log_1, productService_1, secrets_1, authenticationService_1, authentication_1, environmentService_1, hover_1, lifecycle_2, userDataProfile_1, userDataProfileIcons_1, types_1, theme_1, commands_1) {
    "use strict";
    var GlobalCompositeBar_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleGlobalActivityActionViewItem = exports.SimpleAccountActivityActionViewItem = exports.GlobalActivityActionViewItem = exports.AccountsActivityActionViewItem = exports.GlobalCompositeBar = void 0;
    let GlobalCompositeBar = class GlobalCompositeBar extends lifecycle_1.Disposable {
        static { GlobalCompositeBar_1 = this; }
        static { this.ACCOUNTS_ACTION_INDEX = 0; }
        static { this.ACCOUNTS_ICON = (0, iconRegistry_1.registerIcon)('accounts-view-bar-icon', codicons_1.Codicon.account, (0, nls_1.localize)('accountsViewBarIcon', "Accounts icon in the view bar.")); }
        constructor(contextMenuActionsProvider, colors, activityHoverOptions, configurationService, instantiationService, storageService, extensionService) {
            super();
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.colors = colors;
            this.activityHoverOptions = activityHoverOptions;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.globalActivityAction = this._register(new actions_1.Action(activity_1.GLOBAL_ACTIVITY_ID));
            this.accountAction = this._register(new actions_1.Action(activity_1.ACCOUNTS_ACTIVITY_ID));
            this.element = document.createElement('div');
            const contextMenuAlignmentOptions = () => ({
                anchorAlignment: configurationService.getValue('workbench.sideBar.location') === 'left' ? 1 /* AnchorAlignment.RIGHT */ : 0 /* AnchorAlignment.LEFT */,
                anchorAxisAlignment: 1 /* AnchorAxisAlignment.HORIZONTAL */
            });
            this.globalActivityActionBar = this._register(new actionbar_1.ActionBar(this.element, {
                actionViewItemProvider: (action, options) => {
                    if (action.id === activity_1.GLOBAL_ACTIVITY_ID) {
                        return this.instantiationService.createInstance(GlobalActivityActionViewItem, this.contextMenuActionsProvider, { ...options, colors: this.colors, hoverOptions: this.activityHoverOptions }, contextMenuAlignmentOptions);
                    }
                    if (action.id === activity_1.ACCOUNTS_ACTIVITY_ID) {
                        return this.instantiationService.createInstance(AccountsActivityActionViewItem, this.contextMenuActionsProvider, {
                            ...options,
                            colors: this.colors,
                            hoverOptions: this.activityHoverOptions
                        }, contextMenuAlignmentOptions, (actions) => {
                            actions.unshift(...[
                                (0, actions_1.toAction)({ id: 'hideAccounts', label: (0, nls_1.localize)('hideAccounts', "Hide Accounts"), run: () => this.storageService.store(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, false, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */) }),
                                new actions_1.Separator()
                            ]);
                        });
                    }
                    throw new Error(`No view item for action '${action.id}'`);
                },
                orientation: 1 /* ActionsOrientation.VERTICAL */,
                ariaLabel: (0, nls_1.localize)('manage', "Manage"),
                preventLoopNavigation: true
            }));
            if (this.accountsVisibilityPreference) {
                this.globalActivityActionBar.push(this.accountAction, { index: GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX });
            }
            this.globalActivityActionBar.push(this.globalActivityAction);
            this.registerListeners();
        }
        registerListeners() {
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                if (!this._store.isDisposed) {
                    this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, this._store)(() => this.toggleAccountsActivity()));
                }
            });
        }
        create(parent) {
            parent.appendChild(this.element);
        }
        focus() {
            this.globalActivityActionBar.focus(true);
        }
        size() {
            return this.globalActivityActionBar.viewItems.length;
        }
        getContextMenuActions() {
            return [(0, actions_1.toAction)({ id: 'toggleAccountsVisibility', label: (0, nls_1.localize)('accounts', "Accounts"), checked: this.accountsVisibilityPreference, run: () => this.accountsVisibilityPreference = !this.accountsVisibilityPreference })];
        }
        toggleAccountsActivity() {
            if (this.globalActivityActionBar.length() === 2 && this.accountsVisibilityPreference) {
                return;
            }
            if (this.globalActivityActionBar.length() === 2) {
                this.globalActivityActionBar.pull(GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX);
            }
            else {
                this.globalActivityActionBar.push(this.accountAction, { index: GlobalCompositeBar_1.ACCOUNTS_ACTION_INDEX });
            }
        }
        get accountsVisibilityPreference() {
            return this.storageService.getBoolean(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, 0 /* StorageScope.PROFILE */, true);
        }
        set accountsVisibilityPreference(value) {
            this.storageService.store(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    exports.GlobalCompositeBar = GlobalCompositeBar;
    exports.GlobalCompositeBar = GlobalCompositeBar = GlobalCompositeBar_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService)
    ], GlobalCompositeBar);
    let AbstractGlobalActivityActionViewItem = class AbstractGlobalActivityActionViewItem extends compositeBarActions_1.CompositeBarActionViewItem {
        constructor(menuId, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService) {
            super(action, { draggable: false, icon: true, hasPopup: true, ...options }, () => true, themeService, hoverService, configurationService, keybindingService);
            this.menuId = menuId;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.contextMenuAlignmentOptions = contextMenuAlignmentOptions;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.activityService = activityService;
            this.updateItemActivity();
            this._register(this.activityService.onDidChangeActivity(viewContainerOrAction => {
                if ((0, types_1.isString)(viewContainerOrAction) && viewContainerOrAction === this.compositeBarActionItem.id) {
                    this.updateItemActivity();
                }
            }));
        }
        updateItemActivity() {
            const activities = this.activityService.getActivity(this.compositeBarActionItem.id);
            let activity = activities[0];
            if (activity) {
                const { badge, priority } = activity;
                if (badge instanceof activity_2.NumberBadge && activities.length > 1) {
                    const cumulativeNumberBadge = this.getCumulativeNumberBadge(activities, priority ?? 0);
                    activity = { badge: cumulativeNumberBadge };
                }
            }
            this.action.activity = activity;
        }
        getCumulativeNumberBadge(activityCache, priority) {
            const numberActivities = activityCache.filter(activity => activity.badge instanceof activity_2.NumberBadge && (activity.priority ?? 0) === priority);
            const number = numberActivities.reduce((result, activity) => { return result + activity.badge.number; }, 0);
            const descriptorFn = () => {
                return numberActivities.reduce((result, activity, index) => {
                    result = result + activity.badge.getDescription();
                    if (index < numberActivities.length - 1) {
                        result = `${result}\n`;
                    }
                    return result;
                }, '');
            };
            return new activity_2.NumberBadge(number, descriptorFn);
        }
        render(container) {
            super.render(container);
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_DOWN, async (e) => {
                dom_1.EventHelper.stop(e, true);
                const isLeftClick = e?.button !== 2;
                // Left-click run
                if (isLeftClick) {
                    this.run();
                }
            }));
            // The rest of the activity bar uses context menu event for the context menu, so we match this
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, async (e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const actions = await this.resolveContextMenuActions(disposables);
                const event = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.container), e);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => event,
                    getActions: () => actions,
                    onHide: () => disposables.dispose()
                });
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom_1.EventHelper.stop(e, true);
                    this.run();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, touch_1.EventType.Tap, (e) => {
                dom_1.EventHelper.stop(e, true);
                this.run();
            }));
        }
        async resolveContextMenuActions(disposables) {
            return this.contextMenuActionsProvider();
        }
        async run() {
            const disposables = new lifecycle_1.DisposableStore();
            const menu = disposables.add(this.menuService.createMenu(this.menuId, this.contextKeyService));
            const actions = await this.resolveMainMenuActions(menu, disposables);
            const { anchorAlignment, anchorAxisAlignment } = this.contextMenuAlignmentOptions() ?? { anchorAlignment: undefined, anchorAxisAlignment: undefined };
            this.contextMenuService.showContextMenu({
                getAnchor: () => this.label,
                anchorAlignment,
                anchorAxisAlignment,
                getActions: () => actions,
                onHide: () => disposables.dispose(),
                menuActionOptions: { renderShortTitle: true },
            });
        }
        async resolveMainMenuActions(menu, _disposable) {
            const actions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { renderShortTitle: true }, { primary: [], secondary: actions });
            return actions;
        }
    };
    AbstractGlobalActivityActionViewItem = __decorate([
        __param(5, themeService_1.IThemeService),
        __param(6, hover_1.IHoverService),
        __param(7, actions_2.IMenuService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, activity_2.IActivityService)
    ], AbstractGlobalActivityActionViewItem);
    let AccountsActivityActionViewItem = class AccountsActivityActionViewItem extends AbstractGlobalActivityActionViewItem {
        static { this.ACCOUNTS_VISIBILITY_PREFERENCE_KEY = 'workbench.activity.showAccounts'; }
        constructor(contextMenuActionsProvider, options, contextMenuAlignmentOptions, fillContextMenuActions, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, logService, activityService, instantiationService, commandService) {
            const action = instantiationService.createInstance(compositeBarActions_1.CompositeBarAction, {
                id: activity_1.ACCOUNTS_ACTIVITY_ID,
                name: (0, nls_1.localize)('accounts', "Accounts"),
                classNames: themables_1.ThemeIcon.asClassNameArray(GlobalCompositeBar.ACCOUNTS_ICON)
            });
            super(actions_2.MenuId.AccountsContext, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService);
            this.fillContextMenuActions = fillContextMenuActions;
            this.lifecycleService = lifecycleService;
            this.authenticationService = authenticationService;
            this.productService = productService;
            this.secretStorageService = secretStorageService;
            this.logService = logService;
            this.commandService = commandService;
            this.groupedAccounts = new Map();
            this.problematicProviders = new Set();
            this.initialized = false;
            this.sessionFromEmbedder = new lazy_1.Lazy(() => (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService));
            this._register(action);
            this.registerListeners();
            this.initialize();
        }
        registerListeners() {
            this._register(this.authenticationService.onDidRegisterAuthenticationProvider(async (e) => {
                await this.addAccountsFromProvider(e.id);
            }));
            this._register(this.authenticationService.onDidUnregisterAuthenticationProvider((e) => {
                this.groupedAccounts.delete(e.id);
                this.problematicProviders.delete(e.id);
            }));
            this._register(this.authenticationService.onDidChangeSessions(async (e) => {
                for (const changed of [...(e.event.changed ?? []), ...(e.event.added ?? [])]) {
                    try {
                        await this.addOrUpdateAccount(e.providerId, changed.account);
                    }
                    catch (e) {
                        this.logService.error(e);
                    }
                }
                if (e.event.removed) {
                    for (const removed of e.event.removed) {
                        this.removeAccount(e.providerId, removed.account);
                    }
                }
            }));
        }
        // This function exists to ensure that the accounts are added for auth providers that had already been registered
        // before the menu was created.
        async initialize() {
            // Resolving the menu doesn't need to happen immediately, so we can wait until after the workbench has been restored
            // and only run this when the system is idle.
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            if (this._store.isDisposed) {
                return;
            }
            const disposable = this._register((0, dom_1.runWhenWindowIdle)((0, dom_1.getWindow)(this.element), async () => {
                await this.doInitialize();
                disposable.dispose();
            }));
        }
        async doInitialize() {
            const providerIds = this.authenticationService.getProviderIds();
            const results = await Promise.allSettled(providerIds.map(providerId => this.addAccountsFromProvider(providerId)));
            // Log any errors that occurred while initializing. We try to be best effort here to show the most amount of accounts
            for (const result of results) {
                if (result.status === 'rejected') {
                    this.logService.error(result.reason);
                }
            }
            this.initialized = true;
        }
        //#region overrides
        async resolveMainMenuActions(accountsMenu, disposables) {
            await super.resolveMainMenuActions(accountsMenu, disposables);
            const providers = this.authenticationService.getProviderIds();
            const otherCommands = accountsMenu.getActions();
            let menus = [];
            for (const providerId of providers) {
                if (!this.initialized) {
                    const noAccountsAvailableAction = disposables.add(new actions_1.Action('noAccountsAvailable', (0, nls_1.localize)('loading', "Loading..."), undefined, false));
                    menus.push(noAccountsAvailableAction);
                    break;
                }
                const providerLabel = this.authenticationService.getProvider(providerId).label;
                const accounts = this.groupedAccounts.get(providerId);
                if (!accounts) {
                    if (this.problematicProviders.has(providerId)) {
                        const providerUnavailableAction = disposables.add(new actions_1.Action('providerUnavailable', (0, nls_1.localize)('authProviderUnavailable', '{0} is currently unavailable', providerLabel), undefined, false));
                        menus.push(providerUnavailableAction);
                        // try again in the background so that if the failure was intermittent, we can resolve it on the next showing of the menu
                        try {
                            await this.addAccountsFromProvider(providerId);
                        }
                        catch (e) {
                            this.logService.error(e);
                        }
                    }
                    continue;
                }
                for (const account of accounts) {
                    const manageExtensionsAction = (0, actions_1.toAction)({
                        id: `configureSessions${account.label}`,
                        label: (0, nls_1.localize)('manageTrustedExtensions', "Manage Trusted Extensions"),
                        enabled: true,
                        run: () => this.commandService.executeCommand('_manageTrustedExtensionsForAccount', { providerId, accountLabel: account.label })
                    });
                    const providerSubMenuActions = [manageExtensionsAction];
                    if (account.canSignOut) {
                        providerSubMenuActions.push((0, actions_1.toAction)({
                            id: 'signOut',
                            label: (0, nls_1.localize)('signOut', "Sign Out"),
                            enabled: true,
                            run: () => this.commandService.executeCommand('_signOutOfAccount', { providerId, accountLabel: account.label })
                        }));
                    }
                    const providerSubMenu = new actions_1.SubmenuAction('activitybar.submenu', `${account.label} (${providerLabel})`, providerSubMenuActions);
                    menus.push(providerSubMenu);
                }
            }
            if (providers.length && !menus.length) {
                const noAccountsAvailableAction = disposables.add(new actions_1.Action('noAccountsAvailable', (0, nls_1.localize)('noAccounts', "You are not signed in to any accounts"), undefined, false));
                menus.push(noAccountsAvailableAction);
            }
            if (menus.length && otherCommands.length) {
                menus.push(new actions_1.Separator());
            }
            otherCommands.forEach((group, i) => {
                const actions = group[1];
                menus = menus.concat(actions);
                if (i !== otherCommands.length - 1) {
                    menus.push(new actions_1.Separator());
                }
            });
            return menus;
        }
        async resolveContextMenuActions(disposables) {
            const actions = await super.resolveContextMenuActions(disposables);
            this.fillContextMenuActions(actions);
            return actions;
        }
        //#endregion
        //#region groupedAccounts helpers
        async addOrUpdateAccount(providerId, account) {
            let accounts = this.groupedAccounts.get(providerId);
            if (!accounts) {
                accounts = [];
                this.groupedAccounts.set(providerId, accounts);
            }
            const sessionFromEmbedder = await this.sessionFromEmbedder.value;
            let canSignOut = true;
            if (sessionFromEmbedder // if we have a session from the embedder
                && !sessionFromEmbedder.canSignOut // and that session says we can't sign out
                && (await this.authenticationService.getSessions(providerId)) // and that session is associated with the account we are adding/updating
                    .some(s => s.id === sessionFromEmbedder.id
                    && s.account.id === account.id)) {
                canSignOut = false;
            }
            const existingAccount = accounts.find(a => a.label === account.label);
            if (existingAccount) {
                // if we have an existing account and we discover that we
                // can't sign out of it, update the account to mark it as "can't sign out"
                if (!canSignOut) {
                    existingAccount.canSignOut = canSignOut;
                }
            }
            else {
                accounts.push({ ...account, canSignOut });
            }
        }
        removeAccount(providerId, account) {
            const accounts = this.groupedAccounts.get(providerId);
            if (!accounts) {
                return;
            }
            const index = accounts.findIndex(a => a.id === account.id);
            if (index === -1) {
                return;
            }
            accounts.splice(index, 1);
            if (accounts.length === 0) {
                this.groupedAccounts.delete(providerId);
            }
        }
        async addAccountsFromProvider(providerId) {
            try {
                const sessions = await this.authenticationService.getSessions(providerId);
                this.problematicProviders.delete(providerId);
                for (const session of sessions) {
                    try {
                        await this.addOrUpdateAccount(providerId, session.account);
                    }
                    catch (e) {
                        this.logService.error(e);
                    }
                }
            }
            catch (e) {
                this.logService.error(e);
                this.problematicProviders.add(providerId);
            }
        }
    };
    exports.AccountsActivityActionViewItem = AccountsActivityActionViewItem;
    exports.AccountsActivityActionViewItem = AccountsActivityActionViewItem = __decorate([
        __param(4, themeService_1.IThemeService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, hover_1.IHoverService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, actions_2.IMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, authentication_1.IAuthenticationService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, productService_1.IProductService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, keybinding_1.IKeybindingService),
        __param(15, secrets_1.ISecretStorageService),
        __param(16, log_1.ILogService),
        __param(17, activity_2.IActivityService),
        __param(18, instantiation_1.IInstantiationService),
        __param(19, commands_1.ICommandService)
    ], AccountsActivityActionViewItem);
    let GlobalActivityActionViewItem = class GlobalActivityActionViewItem extends AbstractGlobalActivityActionViewItem {
        constructor(contextMenuActionsProvider, options, contextMenuAlignmentOptions, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService) {
            const action = instantiationService.createInstance(compositeBarActions_1.CompositeBarAction, {
                id: activity_1.GLOBAL_ACTIVITY_ID,
                name: (0, nls_1.localize)('manage', "Manage"),
                classNames: themables_1.ThemeIcon.asClassNameArray(userDataProfileService.currentProfile.icon ? themables_1.ThemeIcon.fromId(userDataProfileService.currentProfile.icon) : userDataProfileIcons_1.DEFAULT_ICON)
            });
            super(actions_2.MenuId.GlobalActivity, action, options, contextMenuActionsProvider, contextMenuAlignmentOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, keybindingService, activityService);
            this.userDataProfileService = userDataProfileService;
            this._register(action);
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => {
                action.compositeBarActionItem = {
                    ...action.compositeBarActionItem,
                    classNames: themables_1.ThemeIcon.asClassNameArray(userDataProfileService.currentProfile.icon ? themables_1.ThemeIcon.fromId(userDataProfileService.currentProfile.icon) : userDataProfileIcons_1.DEFAULT_ICON)
                };
            }));
        }
        render(container) {
            super.render(container);
            this.profileBadge = (0, dom_1.append)(container, (0, dom_1.$)('.profile-badge'));
            this.profileBadgeContent = (0, dom_1.append)(this.profileBadge, (0, dom_1.$)('.profile-badge-content'));
            this.updateProfileBadge();
        }
        updateProfileBadge() {
            if (!this.profileBadge || !this.profileBadgeContent) {
                return;
            }
            (0, dom_1.clearNode)(this.profileBadgeContent);
            (0, dom_1.hide)(this.profileBadge);
            if (this.userDataProfileService.currentProfile.isDefault) {
                return;
            }
            if (this.userDataProfileService.currentProfile.icon && this.userDataProfileService.currentProfile.icon !== userDataProfileIcons_1.DEFAULT_ICON.id) {
                return;
            }
            if (this.action.activity) {
                return;
            }
            (0, dom_1.show)(this.profileBadge);
            this.profileBadgeContent.classList.toggle('profile-text-overlay', true);
            this.profileBadgeContent.classList.toggle('profile-icon-overlay', false);
            this.profileBadgeContent.textContent = this.userDataProfileService.currentProfile.name.substring(0, 2).toUpperCase();
        }
        updateActivity() {
            super.updateActivity();
            this.updateProfileBadge();
        }
        computeTitle() {
            return this.userDataProfileService.currentProfile.isDefault ? super.computeTitle() : (0, nls_1.localize)('manage profile', "Manage {0} (Profile)", this.userDataProfileService.currentProfile.name);
        }
    };
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem;
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem = __decorate([
        __param(3, userDataProfile_1.IUserDataProfileService),
        __param(4, themeService_1.IThemeService),
        __param(5, hover_1.IHoverService),
        __param(6, actions_2.IMenuService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, keybinding_1.IKeybindingService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, activity_2.IActivityService)
    ], GlobalActivityActionViewItem);
    let SimpleAccountActivityActionViewItem = class SimpleAccountActivityActionViewItem extends AccountsActivityActionViewItem {
        constructor(hoverOptions, options, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, logService, activityService, instantiationService, commandService) {
            super(() => [], {
                ...options,
                colors: theme => ({
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                }),
                hoverOptions,
                compact: true,
            }, () => undefined, actions => actions, themeService, lifecycleService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, keybindingService, secretStorageService, logService, activityService, instantiationService, commandService);
        }
    };
    exports.SimpleAccountActivityActionViewItem = SimpleAccountActivityActionViewItem;
    exports.SimpleAccountActivityActionViewItem = SimpleAccountActivityActionViewItem = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, hover_1.IHoverService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, actions_2.IMenuService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, authentication_1.IAuthenticationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, productService_1.IProductService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, secrets_1.ISecretStorageService),
        __param(14, log_1.ILogService),
        __param(15, activity_2.IActivityService),
        __param(16, instantiation_1.IInstantiationService),
        __param(17, commands_1.ICommandService)
    ], SimpleAccountActivityActionViewItem);
    let SimpleGlobalActivityActionViewItem = class SimpleGlobalActivityActionViewItem extends GlobalActivityActionViewItem {
        constructor(hoverOptions, options, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService) {
            super(() => [], {
                ...options,
                colors: theme => ({
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                }),
                hoverOptions,
                compact: true,
            }, () => undefined, userDataProfileService, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService, instantiationService, activityService);
        }
    };
    exports.SimpleGlobalActivityActionViewItem = SimpleGlobalActivityActionViewItem;
    exports.SimpleGlobalActivityActionViewItem = SimpleGlobalActivityActionViewItem = __decorate([
        __param(2, userDataProfile_1.IUserDataProfileService),
        __param(3, themeService_1.IThemeService),
        __param(4, hover_1.IHoverService),
        __param(5, actions_2.IMenuService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, instantiation_1.IInstantiationService),
        __param(12, activity_2.IActivityService)
    ], SimpleGlobalActivityActionViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsQ29tcG9zaXRlQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9nbG9iYWxDb21wb3NpdGVCYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRDekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxzQkFBVTs7aUJBRXpCLDBCQUFxQixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUNsQyxrQkFBYSxHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDLEFBQTdILENBQThIO1FBUTNKLFlBQ2tCLDBCQUEyQyxFQUMzQyxNQUFtRCxFQUNuRCxvQkFBMkMsRUFDckMsb0JBQTJDLEVBQzNDLG9CQUE0RCxFQUNsRSxjQUFnRCxFQUM5QyxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFSUywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQWlCO1lBQzNDLFdBQU0sR0FBTixNQUFNLENBQTZDO1lBQ25ELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFFcEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVh2RCx5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQyw2QkFBa0IsQ0FBQyxDQUFDLENBQUM7WUFDdEUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZ0JBQU0sQ0FBQywrQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFjakYsSUFBSSxDQUFD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