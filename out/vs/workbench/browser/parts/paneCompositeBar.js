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
define(["require", "exports", "vs/nls", "vs/workbench/services/activity/common/activity", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/parts/compositeBar", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform", "vs/base/common/themables", "vs/base/common/actions", "vs/base/common/hash", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, activity_1, layoutService_1, instantiation_1, lifecycle_1, compositeBar_1, dom_1, storage_1, extensions_1, uri_1, compositeBarActions_1, views_1, contextkey_1, types_1, environmentService_1, platform_1, themables_1, actions_1, hash_1, telemetry_1, configuration_1) {
    "use strict";
    var ViewContainerActivityAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositeBar = void 0;
    let PaneCompositeBar = class PaneCompositeBar extends lifecycle_1.Disposable {
        constructor(options, part, paneCompositePart, instantiationService, storageService, extensionService, viewDescriptorService, contextKeyService, environmentService, layoutService) {
            super();
            this.options = options;
            this.part = part;
            this.paneCompositePart = paneCompositePart;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.viewDescriptorService = viewDescriptorService;
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
            this.layoutService = layoutService;
            this.viewContainerDisposables = this._register(new lifecycle_1.DisposableMap());
            this.compositeActions = new Map();
            this.hasExtensionsRegistered = false;
            this._cachedViewContainers = undefined;
            this.location = paneCompositePart.partId === "workbench.parts.panel" /* Parts.PANEL_PART */
                ? 1 /* ViewContainerLocation.Panel */ : paneCompositePart.partId === "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */
                ? 2 /* ViewContainerLocation.AuxiliaryBar */ : 0 /* ViewContainerLocation.Sidebar */;
            this.dndHandler = new compositeBar_1.CompositeDragAndDrop(this.viewDescriptorService, this.location, this.options.orientation, async (id, focus) => { return await this.paneCompositePart.openPaneComposite(id, focus) ?? null; }, (from, to, before) => this.compositeBar.move(from, to, this.options.orientation === 1 /* ActionsOrientation.VERTICAL */ ? before?.verticallyBefore : before?.horizontallyBefore), () => this.compositeBar.getCompositeBarItems());
            const cachedItems = this.cachedViewContainers
                .map(container => ({
                id: container.id,
                name: container.name,
                visible: !this.shouldBeHidden(container.id, container),
                order: container.order,
                pinned: container.pinned,
            }));
            this.compositeBar = this.createCompositeBar(cachedItems);
            this.onDidRegisterViewContainers(this.getViewContainers());
            this.registerListeners();
        }
        createCompositeBar(cachedItems) {
            return this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, cachedItems, {
                icon: this.options.icon,
                compact: this.options.compact,
                orientation: this.options.orientation,
                activityHoverOptions: this.options.activityHoverOptions,
                preventLoopNavigation: this.options.preventLoopNavigation,
                openComposite: async (compositeId, preserveFocus) => {
                    return (await this.paneCompositePart.openPaneComposite(compositeId, !preserveFocus)) ?? null;
                },
                getActivityAction: compositeId => this.getCompositeActions(compositeId).activityAction,
                getCompositePinnedAction: compositeId => this.getCompositeActions(compositeId).pinnedAction,
                getCompositeBadgeAction: compositeId => this.getCompositeActions(compositeId).badgeAction,
                getOnCompositeClickAction: compositeId => this.getCompositeActions(compositeId).activityAction,
                fillExtraContextMenuActions: (actions, e) => this.options.fillExtraContextMenuActions(actions, e),
                getContextMenuActionsForComposite: compositeId => this.getContextMenuActionsForComposite(compositeId),
                getDefaultCompositeId: () => this.viewDescriptorService.getDefaultViewContainer(this.location)?.id,
                dndHandler: this.dndHandler,
                compositeSize: this.options.compositeSize,
                overflowActionSize: this.options.overflowActionSize,
                colors: theme => this.options.colors(theme),
            }));
        }
        getContextMenuActionsForComposite(compositeId) {
            const actions = [];
            const viewContainer = this.viewDescriptorService.getViewContainerById(compositeId);
            const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
            if (defaultLocation !== this.viewDescriptorService.getViewContainerLocation(viewContainer)) {
                actions.push((0, actions_1.toAction)({ id: 'resetLocationAction', label: (0, nls_1.localize)('resetLocation', "Reset Location"), run: () => this.viewDescriptorService.moveViewContainerToLocation(viewContainer, defaultLocation, undefined, 'resetLocationAction') }));
            }
            else {
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                if (viewContainerModel.allViewDescriptors.length === 1) {
                    const viewToReset = viewContainerModel.allViewDescriptors[0];
                    const defaultContainer = this.viewDescriptorService.getDefaultContainerById(viewToReset.id);
                    if (defaultContainer !== viewContainer) {
                        actions.push((0, actions_1.toAction)({ id: 'resetLocationAction', label: (0, nls_1.localize)('resetLocation', "Reset Location"), run: () => this.viewDescriptorService.moveViewsToContainer([viewToReset], defaultContainer, undefined, 'resetLocationAction') }));
                    }
                }
            }
            return actions;
        }
        registerListeners() {
            // View Container Changes
            this._register(this.viewDescriptorService.onDidChangeViewContainers(({ added, removed }) => this.onDidChangeViewContainers(added, removed)));
            this._register(this.viewDescriptorService.onDidChangeContainerLocation(({ viewContainer, from, to }) => this.onDidChangeViewContainerLocation(viewContainer, from, to)));
            // View Container Visibility Changes
            this._register(this.paneCompositePart.onDidPaneCompositeOpen(e => this.onDidChangeViewContainerVisibility(e.getId(), true)));
            this._register(this.paneCompositePart.onDidPaneCompositeClose(e => this.onDidChangeViewContainerVisibility(e.getId(), false)));
            // Extension registration
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                if (this._store.isDisposed) {
                    return;
                }
                this.onDidRegisterExtensions();
                this._register(this.compositeBar.onDidChange(() => this.saveCachedViewContainers()));
                this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, this.options.pinnedViewContainersKey, this._store)(e => this.onDidPinnedViewContainersStorageValueChange(e)));
            });
        }
        onDidChangeViewContainers(added, removed) {
            removed.filter(({ location }) => location === this.location).forEach(({ container }) => this.onDidDeregisterViewContainer(container));
            this.onDidRegisterViewContainers(added.filter(({ location }) => location === this.location).map(({ container }) => container));
        }
        onDidChangeViewContainerLocation(container, from, to) {
            if (from === this.location) {
                this.onDidDeregisterViewContainer(container);
            }
            if (to === this.location) {
                this.onDidRegisterViewContainers([container]);
            }
        }
        onDidChangeViewContainerVisibility(id, visible) {
            if (visible) {
                // Activate view container action on opening of a view container
                this.onDidViewContainerVisible(id);
            }
            else {
                // Deactivate view container action on close
                this.compositeBar.deactivateComposite(id);
            }
        }
        onDidRegisterExtensions() {
            this.hasExtensionsRegistered = true;
            // show/hide/remove composites
            for (const { id } of this.cachedViewContainers) {
                const viewContainer = this.getViewContainer(id);
                if (viewContainer) {
                    this.showOrHideViewContainer(viewContainer);
                }
                else {
                    if (this.viewDescriptorService.isViewContainerRemovedPermanently(id)) {
                        this.removeComposite(id);
                    }
                    else {
                        this.hideComposite(id);
                    }
                }
            }
            this.saveCachedViewContainers();
        }
        onDidViewContainerVisible(id) {
            const viewContainer = this.getViewContainer(id);
            if (viewContainer) {
                // Update the composite bar by adding
                this.addComposite(viewContainer);
                this.compositeBar.activateComposite(viewContainer.id);
                if (this.shouldBeHidden(viewContainer)) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    if (viewContainerModel.activeViewDescriptors.length === 0) {
                        // Update the composite bar by hiding
                        this.hideComposite(viewContainer.id);
                    }
                }
            }
        }
        create(parent) {
            return this.compositeBar.create(parent);
        }
        getCompositeActions(compositeId) {
            let compositeActions = this.compositeActions.get(compositeId);
            if (!compositeActions) {
                const viewContainer = this.getViewContainer(compositeId);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    compositeActions = {
                        activityAction: this._register(this.instantiationService.createInstance(ViewContainerActivityAction, this.toCompositeBarActionItemFrom(viewContainerModel), this.part, this.paneCompositePart)),
                        pinnedAction: this._register(new compositeBarActions_1.ToggleCompositePinnedAction(this.toCompositeBarActionItemFrom(viewContainerModel), this.compositeBar)),
                        badgeAction: this._register(new compositeBarActions_1.ToggleCompositeBadgeAction(this.toCompositeBarActionItemFrom(viewContainerModel), this.compositeBar))
                    };
                }
                else {
                    const cachedComposite = this.cachedViewContainers.filter(c => c.id === compositeId)[0];
                    compositeActions = {
                        activityAction: this._register(this.instantiationService.createInstance(PlaceHolderViewContainerActivityAction, this.toCompositeBarActionItem(compositeId, cachedComposite?.name ?? compositeId, cachedComposite?.icon, undefined), this.part, this.paneCompositePart)),
                        pinnedAction: this._register(new PlaceHolderToggleCompositePinnedAction(compositeId, this.compositeBar)),
                        badgeAction: this._register(new PlaceHolderToggleCompositeBadgeAction(compositeId, this.compositeBar))
                    };
                }
                this.compositeActions.set(compositeId, compositeActions);
            }
            return compositeActions;
        }
        onDidRegisterViewContainers(viewContainers) {
            for (const viewContainer of viewContainers) {
                this.addComposite(viewContainer);
                // Pin it by default if it is new
                const cachedViewContainer = this.cachedViewContainers.filter(({ id }) => id === viewContainer.id)[0];
                if (!cachedViewContainer) {
                    this.compositeBar.pin(viewContainer.id);
                }
                // Active
                const visibleViewContainer = this.paneCompositePart.getActivePaneComposite();
                if (visibleViewContainer?.getId() === viewContainer.id) {
                    this.compositeBar.activateComposite(viewContainer.id);
                }
                const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                this.updateCompositeBarActionItem(viewContainer, viewContainerModel);
                this.showOrHideViewContainer(viewContainer);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(viewContainerModel.onDidChangeContainerInfo(() => this.updateCompositeBarActionItem(viewContainer, viewContainerModel)));
                disposables.add(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.showOrHideViewContainer(viewContainer)));
                this.viewContainerDisposables.set(viewContainer.id, disposables);
            }
        }
        onDidDeregisterViewContainer(viewContainer) {
            this.viewContainerDisposables.deleteAndDispose(viewContainer.id);
            this.removeComposite(viewContainer.id);
        }
        updateCompositeBarActionItem(viewContainer, viewContainerModel) {
            const compositeBarActionItem = this.toCompositeBarActionItemFrom(viewContainerModel);
            const { activityAction, pinnedAction } = this.getCompositeActions(viewContainer.id);
            activityAction.updateCompositeBarActionItem(compositeBarActionItem);
            if (pinnedAction instanceof PlaceHolderToggleCompositePinnedAction) {
                pinnedAction.setActivity(compositeBarActionItem);
            }
            if (this.options.recomputeSizes) {
                this.compositeBar.recomputeSizes();
            }
            this.saveCachedViewContainers();
        }
        toCompositeBarActionItemFrom(viewContainerModel) {
            return this.toCompositeBarActionItem(viewContainerModel.viewContainer.id, viewContainerModel.title, viewContainerModel.icon, viewContainerModel.keybindingId);
        }
        toCompositeBarActionItem(id, name, icon, keybindingId) {
            let classNames = undefined;
            let iconUrl = undefined;
            if (this.options.icon) {
                if (uri_1.URI.isUri(icon)) {
                    iconUrl = icon;
                    const cssUrl = (0, dom_1.asCSSUrl)(icon);
                    const hash = new hash_1.StringSHA1();
                    hash.update(cssUrl);
                    const iconId = `activity-${id.replace(/\./g, '-')}-${hash.digest()}`;
                    const iconClass = `.monaco-workbench .${this.options.partContainerClass} .monaco-action-bar .action-label.${iconId}`;
                    classNames = [iconId, 'uri-icon'];
                    (0, dom_1.createCSSRule)(iconClass, `
				mask: ${cssUrl} no-repeat 50% 50%;
				mask-size: ${this.options.iconSize}px;
				-webkit-mask: ${cssUrl} no-repeat 50% 50%;
				-webkit-mask-size: ${this.options.iconSize}px;
				mask-origin: padding;
				-webkit-mask-origin: padding;
			`);
                }
                else if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                    classNames = themables_1.ThemeIcon.asClassNameArray(icon);
                }
            }
            return { id, name, classNames, iconUrl, keybindingId };
        }
        showOrHideViewContainer(viewContainer) {
            if (this.shouldBeHidden(viewContainer)) {
                this.hideComposite(viewContainer.id);
            }
            else {
                this.addComposite(viewContainer);
            }
        }
        shouldBeHidden(viewContainerOrId, cachedViewContainer) {
            const viewContainer = (0, types_1.isString)(viewContainerOrId) ? this.getViewContainer(viewContainerOrId) : viewContainerOrId;
            const viewContainerId = (0, types_1.isString)(viewContainerOrId) ? viewContainerOrId : viewContainerOrId.id;
            if (viewContainer) {
                if (viewContainer.hideIfEmpty) {
                    if (this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.length > 0) {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            // Check cache only if extensions are not yet registered and current window is not native (desktop) remote connection window
            if (!this.hasExtensionsRegistered && !(this.part === "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ && this.environmentService.remoteAuthority && platform_1.isNative)) {
                cachedViewContainer = cachedViewContainer || this.cachedViewContainers.find(({ id }) => id === viewContainerId);
                // Show builtin ViewContainer if not registered yet
                if (!viewContainer && cachedViewContainer?.isBuiltin && cachedViewContainer?.visible) {
                    return false;
                }
                if (cachedViewContainer?.views?.length) {
                    return cachedViewContainer.views.every(({ when }) => !!when && !this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(when)));
                }
            }
            return true;
        }
        addComposite(viewContainer) {
            this.compositeBar.addComposite({ id: viewContainer.id, name: typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.value, order: viewContainer.order, requestedIndex: viewContainer.requestedIndex });
        }
        hideComposite(compositeId) {
            this.compositeBar.hideComposite(compositeId);
            const compositeActions = this.compositeActions.get(compositeId);
            if (compositeActions) {
                compositeActions.activityAction.dispose();
                compositeActions.pinnedAction.dispose();
                this.compositeActions.delete(compositeId);
            }
        }
        removeComposite(compositeId) {
            this.compositeBar.removeComposite(compositeId);
            const compositeActions = this.compositeActions.get(compositeId);
            if (compositeActions) {
                compositeActions.activityAction.dispose();
                compositeActions.pinnedAction.dispose();
                this.compositeActions.delete(compositeId);
            }
        }
        getPinnedPaneCompositeIds() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(v => v.id);
            return this.getViewContainers()
                .filter(v => this.compositeBar.isPinned(v.id))
                .sort((v1, v2) => pinnedCompositeIds.indexOf(v1.id) - pinnedCompositeIds.indexOf(v2.id))
                .map(v => v.id);
        }
        getVisiblePaneCompositeIds() {
            return this.compositeBar.getVisibleComposites()
                .filter(v => this.paneCompositePart.getActivePaneComposite()?.getId() === v.id || this.compositeBar.isPinned(v.id))
                .map(v => v.id);
        }
        getContextMenuActions() {
            return this.compositeBar.getContextMenuActions();
        }
        focus(index) {
            this.compositeBar.focus(index);
        }
        layout(width, height) {
            this.compositeBar.layout(new dom_1.Dimension(width, height));
        }
        getViewContainer(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            return viewContainer && this.viewDescriptorService.getViewContainerLocation(viewContainer) === this.location ? viewContainer : undefined;
        }
        getViewContainers() {
            return this.viewDescriptorService.getViewContainersByLocation(this.location);
        }
        onDidPinnedViewContainersStorageValueChange(e) {
            if (this.pinnedViewContainersValue !== this.getStoredPinnedViewContainersValue() /* This checks if current window changed the value or not */) {
                this._placeholderViewContainersValue = undefined;
                this._pinnedViewContainersValue = undefined;
                this._cachedViewContainers = undefined;
                const newCompositeItems = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                for (const cachedViewContainer of this.cachedViewContainers) {
                    newCompositeItems.push({
                        id: cachedViewContainer.id,
                        name: cachedViewContainer.name,
                        order: cachedViewContainer.order,
                        pinned: cachedViewContainer.pinned,
                        visible: cachedViewContainer.visible && !!this.getViewContainer(cachedViewContainer.id),
                    });
                }
                for (const viewContainer of this.getViewContainers()) {
                    // Add missing view containers
                    if (!newCompositeItems.some(({ id }) => id === viewContainer.id)) {
                        const index = compositeItems.findIndex(({ id }) => id === viewContainer.id);
                        if (index !== -1) {
                            const compositeItem = compositeItems[index];
                            newCompositeItems.splice(index, 0, {
                                id: viewContainer.id,
                                name: typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.value,
                                order: compositeItem.order,
                                pinned: compositeItem.pinned,
                                visible: compositeItem.visible,
                            });
                        }
                        else {
                            newCompositeItems.push({
                                id: viewContainer.id,
                                name: typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.value,
                                order: viewContainer.order,
                                pinned: true,
                                visible: !this.shouldBeHidden(viewContainer),
                            });
                        }
                    }
                }
                this.compositeBar.setCompositeBarItems(newCompositeItems);
            }
        }
        saveCachedViewContainers() {
            const state = [];
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                const viewContainer = this.getViewContainer(compositeItem.id);
                if (viewContainer) {
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    const views = [];
                    for (const { when } of viewContainerModel.allViewDescriptors) {
                        views.push({ when: when ? when.serialize() : undefined });
                    }
                    state.push({
                        id: compositeItem.id,
                        name: viewContainerModel.title,
                        icon: uri_1.URI.isUri(viewContainerModel.icon) && this.environmentService.remoteAuthority ? undefined : viewContainerModel.icon, // Do not cache uri icons with remote connection
                        views,
                        pinned: compositeItem.pinned,
                        order: compositeItem.order,
                        visible: compositeItem.visible,
                        isBuiltin: !viewContainer.extensionId
                    });
                }
                else {
                    state.push({ id: compositeItem.id, name: compositeItem.name, pinned: compositeItem.pinned, order: compositeItem.order, visible: false, isBuiltin: false });
                }
            }
            this.storeCachedViewContainersState(state);
        }
        get cachedViewContainers() {
            if (this._cachedViewContainers === undefined) {
                this._cachedViewContainers = this.getPinnedViewContainers();
                for (const placeholderViewContainer of this.getPlaceholderViewContainers()) {
                    const cachedViewContainer = this._cachedViewContainers.find(cached => cached.id === placeholderViewContainer.id);
                    if (cachedViewContainer) {
                        cachedViewContainer.visible = placeholderViewContainer.visible ?? cachedViewContainer.visible;
                        cachedViewContainer.name = placeholderViewContainer.name;
                        cachedViewContainer.icon = placeholderViewContainer.themeIcon ? placeholderViewContainer.themeIcon :
                            placeholderViewContainer.iconUrl ? uri_1.URI.revive(placeholderViewContainer.iconUrl) : undefined;
                        if (uri_1.URI.isUri(cachedViewContainer.icon) && this.environmentService.remoteAuthority) {
                            cachedViewContainer.icon = undefined; // Do not cache uri icons with remote connection
                        }
                        cachedViewContainer.views = placeholderViewContainer.views;
                        cachedViewContainer.isBuiltin = placeholderViewContainer.isBuiltin;
                    }
                }
                for (const viewContainerWorkspaceState of this.getViewContainersWorkspaceState()) {
                    const cachedViewContainer = this._cachedViewContainers.find(cached => cached.id === viewContainerWorkspaceState.id);
                    if (cachedViewContainer) {
                        cachedViewContainer.visible = viewContainerWorkspaceState.visible ?? cachedViewContainer.visible;
                    }
                }
            }
            return this._cachedViewContainers;
        }
        storeCachedViewContainersState(cachedViewContainers) {
            const pinnedViewContainers = this.getPinnedViewContainers();
            this.setPinnedViewContainers(cachedViewContainers.map(({ id, pinned, order }) => ({
                id,
                pinned,
                visible: pinnedViewContainers.find(({ id: pinnedId }) => pinnedId === id)?.visible,
                order
            })));
            this.setPlaceholderViewContainers(cachedViewContainers.map(({ id, icon, name, views, isBuiltin }) => ({
                id,
                iconUrl: uri_1.URI.isUri(icon) ? icon : undefined,
                themeIcon: themables_1.ThemeIcon.isThemeIcon(icon) ? icon : undefined,
                name,
                isBuiltin,
                views
            })));
            this.setViewContainersWorkspaceState(cachedViewContainers.map(({ id, visible }) => ({
                id,
                visible,
            })));
        }
        getPinnedViewContainers() {
            return JSON.parse(this.pinnedViewContainersValue);
        }
        setPinnedViewContainers(pinnedViewContainers) {
            this.pinnedViewContainersValue = JSON.stringify(pinnedViewContainers);
        }
        get pinnedViewContainersValue() {
            if (!this._pinnedViewContainersValue) {
                this._pinnedViewContainersValue = this.getStoredPinnedViewContainersValue();
            }
            return this._pinnedViewContainersValue;
        }
        set pinnedViewContainersValue(pinnedViewContainersValue) {
            if (this.pinnedViewContainersValue !== pinnedViewContainersValue) {
                this._pinnedViewContainersValue = pinnedViewContainersValue;
                this.setStoredPinnedViewContainersValue(pinnedViewContainersValue);
            }
        }
        getStoredPinnedViewContainersValue() {
            return this.storageService.get(this.options.pinnedViewContainersKey, 0 /* StorageScope.PROFILE */, '[]');
        }
        setStoredPinnedViewContainersValue(value) {
            this.storageService.store(this.options.pinnedViewContainersKey, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        getPlaceholderViewContainers() {
            return JSON.parse(this.placeholderViewContainersValue);
        }
        setPlaceholderViewContainers(placeholderViewContainers) {
            this.placeholderViewContainersValue = JSON.stringify(placeholderViewContainers);
        }
        get placeholderViewContainersValue() {
            if (!this._placeholderViewContainersValue) {
                this._placeholderViewContainersValue = this.getStoredPlaceholderViewContainersValue();
            }
            return this._placeholderViewContainersValue;
        }
        set placeholderViewContainersValue(placeholderViewContainesValue) {
            if (this.placeholderViewContainersValue !== placeholderViewContainesValue) {
                this._placeholderViewContainersValue = placeholderViewContainesValue;
                this.setStoredPlaceholderViewContainersValue(placeholderViewContainesValue);
            }
        }
        getStoredPlaceholderViewContainersValue() {
            return this.storageService.get(this.options.placeholderViewContainersKey, 0 /* StorageScope.PROFILE */, '[]');
        }
        setStoredPlaceholderViewContainersValue(value) {
            this.storageService.store(this.options.placeholderViewContainersKey, value, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        getViewContainersWorkspaceState() {
            return JSON.parse(this.viewContainersWorkspaceStateValue);
        }
        setViewContainersWorkspaceState(viewContainersWorkspaceState) {
            this.viewContainersWorkspaceStateValue = JSON.stringify(viewContainersWorkspaceState);
        }
        get viewContainersWorkspaceStateValue() {
            if (!this._viewContainersWorkspaceStateValue) {
                this._viewContainersWorkspaceStateValue = this.getStoredViewContainersWorkspaceStateValue();
            }
            return this._viewContainersWorkspaceStateValue;
        }
        set viewContainersWorkspaceStateValue(viewContainersWorkspaceStateValue) {
            if (this.viewContainersWorkspaceStateValue !== viewContainersWorkspaceStateValue) {
                this._viewContainersWorkspaceStateValue = viewContainersWorkspaceStateValue;
                this.setStoredViewContainersWorkspaceStateValue(viewContainersWorkspaceStateValue);
            }
        }
        getStoredViewContainersWorkspaceStateValue() {
            return this.storageService.get(this.options.viewContainersWorkspaceStateKey, 1 /* StorageScope.WORKSPACE */, '[]');
        }
        setStoredViewContainersWorkspaceStateValue(value) {
            this.storageService.store(this.options.viewContainersWorkspaceStateKey, value, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.PaneCompositeBar = PaneCompositeBar;
    exports.PaneCompositeBar = PaneCompositeBar = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, layoutService_1.IWorkbenchLayoutService)
    ], PaneCompositeBar);
    let ViewContainerActivityAction = class ViewContainerActivityAction extends compositeBarActions_1.CompositeBarAction {
        static { ViewContainerActivityAction_1 = this; }
        static { this.preventDoubleClickDelay = 300; }
        constructor(compositeBarActionItem, part, paneCompositePart, layoutService, telemetryService, configurationService, activityService) {
            super(compositeBarActionItem);
            this.part = part;
            this.paneCompositePart = paneCompositePart;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.activityService = activityService;
            this.lastRun = 0;
            this.updateActivity();
            this._register(this.activityService.onDidChangeActivity(viewContainerOrAction => {
                if (!(0, types_1.isString)(viewContainerOrAction) && viewContainerOrAction.id === this.compositeBarActionItem.id) {
                    this.updateActivity();
                }
            }));
        }
        updateCompositeBarActionItem(compositeBarActionItem) {
            this.compositeBarActionItem = compositeBarActionItem;
        }
        updateActivity() {
            const activities = this.activityService.getViewContainerActivities(this.compositeBarActionItem.id);
            this.activity = activities[0];
        }
        async run(event) {
            if ((0, dom_1.isMouseEvent)(event) && event.button === 2) {
                return; // do not run on right click
            }
            // prevent accident trigger on a doubleclick (to help nervous people)
            const now = Date.now();
            if (now > this.lastRun /* https://github.com/microsoft/vscode/issues/25830 */ && now - this.lastRun < ViewContainerActivityAction_1.preventDoubleClickDelay) {
                return;
            }
            this.lastRun = now;
            const focus = (event && 'preserveFocus' in event) ? !event.preserveFocus : true;
            if (this.part === "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) {
                const sideBarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                const activeViewlet = this.paneCompositePart.getActivePaneComposite();
                const focusBehavior = this.configurationService.getValue('workbench.activityBar.iconClickBehavior');
                if (sideBarVisible && activeViewlet?.getId() === this.compositeBarActionItem.id) {
                    switch (focusBehavior) {
                        case 'focus':
                            this.logAction('refocus');
                            this.paneCompositePart.openPaneComposite(this.compositeBarActionItem.id, focus);
                            break;
                        case 'toggle':
                        default:
                            // Hide sidebar if selected viewlet already visible
                            this.logAction('hide');
                            this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                            break;
                    }
                    return;
                }
                this.logAction('show');
            }
            await this.paneCompositePart.openPaneComposite(this.compositeBarActionItem.id, focus);
            return this.activate();
        }
        logAction(action) {
            this.telemetryService.publicLog2('activityBarAction', { viewletId: this.compositeBarActionItem.id, action });
        }
    };
    ViewContainerActivityAction = ViewContainerActivityAction_1 = __decorate([
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, activity_1.IActivityService)
    ], ViewContainerActivityAction);
    class PlaceHolderViewContainerActivityAction extends ViewContainerActivityAction {
    }
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, classNames: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    class PlaceHolderToggleCompositeBadgeAction extends compositeBarActions_1.ToggleCompositeBadgeAction {
        constructor(id, compositeBar) {
            super({ id, name: id, classNames: undefined }, compositeBar);
        }
        setCompositeBarActionItem(actionItem) {
            this.label = actionItem.name;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZUNvbXBvc2l0ZUJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvcGFuZUNvbXBvc2l0ZUJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBa0Z6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBVy9DLFlBQ29CLE9BQWlDLEVBQ25DLElBQVcsRUFDWCxpQkFBcUMsRUFDL0Isb0JBQThELEVBQ3BFLGNBQWdELEVBQzlDLGdCQUFvRCxFQUMvQyxxQkFBOEQsRUFDbEUsaUJBQXdELEVBQzlDLGtCQUFpRSxFQUN0RSxhQUF5RDtZQUVsRixLQUFLLEVBQUUsQ0FBQztZQVhXLFlBQU8sR0FBUCxPQUFPLENBQTBCO1lBQ25DLFNBQUksR0FBSixJQUFJLENBQU87WUFDWCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ1oseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM5QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQy9DLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDN0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUNuRCxrQkFBYSxHQUFiLGFBQWEsQ0FBeUI7WUFuQmxFLDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUF1QixDQUFDLENBQUM7WUFLcEYscUJBQWdCLEdBQUcsSUFBSSxHQUFHLEVBQStJLENBQUM7WUFFbkwsNEJBQXVCLEdBQVksS0FBSyxDQUFDO1lBdWN6QywwQkFBcUIsR0FBdUMsU0FBUyxDQUFDO1lBeGI3RSxJQUFJLENBQUMsUUFBUSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sbURBQXFCO2dCQUM1RCxDQUFDLHFDQUE2QixDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxpRUFBNEI7Z0JBQ25GLENBQUMsNENBQW9DLENBQUMsc0NBQThCLENBQUM7WUFFdkUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLG1DQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUM3RyxLQUFLLEVBQUUsRUFBVSxFQUFFLEtBQWUsRUFBRSxFQUFFLEdBQUcsT0FBTyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUNwSCxDQUFDLElBQVksRUFBRSxFQUFVLEVBQUUsTUFBaUIsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsd0NBQWdDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLGtCQUFrQixDQUFDLEVBQ25NLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FDOUMsQ0FBQztZQUVGLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxvQkFBb0I7aUJBQzNDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2xCLEVBQUUsRUFBRSxTQUFTLENBQUMsRUFBRTtnQkFDaEIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDO2dCQUN0RCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7Z0JBQ3RCLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTTthQUN4QixDQUFDLENBQUMsQ0FBQztZQUNMLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxXQUFnQztZQUMxRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBWSxFQUFFLFdBQVcsRUFBRTtnQkFDekYsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSTtnQkFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTztnQkFDN0IsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztnQkFDckMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0I7Z0JBQ3ZELHFCQUFxQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCO2dCQUN6RCxhQUFhLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBRTtvQkFDbkQsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO2dCQUM5RixDQUFDO2dCQUNELGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGNBQWM7Z0JBQ3RGLHdCQUF3QixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLFlBQVk7Z0JBQzNGLHVCQUF1QixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVc7Z0JBQ3pGLHlCQUF5QixFQUFFLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLGNBQWM7Z0JBQzlGLDJCQUEyQixFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUNqRyxpQ0FBaUMsRUFBRSxXQUFXLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxXQUFXLENBQUM7Z0JBQ3JHLHFCQUFxQixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRTtnQkFDbEcsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO2dCQUMzQixhQUFhLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhO2dCQUN6QyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQjtnQkFDbkQsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO2FBQzNDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGlDQUFpQyxDQUFDLFdBQW1CO1lBQzVELE1BQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztZQUU5QixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFFLENBQUM7WUFDcEYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLCtCQUErQixDQUFDLGFBQWEsQ0FBRSxDQUFDO1lBQ25HLElBQUksZUFBZSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUM1RixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsa0JBQVEsRUFBQyxFQUFFLEVBQUUsRUFBRSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQyxhQUFhLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRSxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hQLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ3hELE1BQU0sV0FBVyxHQUFHLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM3RCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFFLENBQUM7b0JBQzdGLElBQUksZ0JBQWdCLEtBQUssYUFBYSxFQUFFLENBQUM7d0JBQ3hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxrQkFBUSxFQUFDLEVBQUUsRUFBRSxFQUFFLHFCQUFxQixFQUFFLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLG9CQUFvQixDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzFPLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLHlCQUF5QjtZQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3SSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpLLG9DQUFvQztZQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0gseUJBQXlCO1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25FLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDNUIsT0FBTztnQkFDUixDQUFDO2dCQUNELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLGdCQUFnQiwrQkFBdUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pMLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLHlCQUF5QixDQUFDLEtBQStFLEVBQUUsT0FBaUY7WUFDbk0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDdEksSUFBSSxDQUFDLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDaEksQ0FBQztRQUVPLGdDQUFnQyxDQUFDLFNBQXdCLEVBQUUsSUFBMkIsRUFBRSxFQUF5QjtZQUN4SCxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsSUFBSSxFQUFFLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUM7UUFDRixDQUFDO1FBRU8sa0NBQWtDLENBQUMsRUFBVSxFQUFFLE9BQWdCO1lBQ3RFLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsZ0VBQWdFO2dCQUNoRSxJQUFJLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLDRDQUE0QztnQkFDNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLHVCQUF1QjtZQUM5QixJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO1lBRXBDLDhCQUE4QjtZQUM5QixLQUFLLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNuQixJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUN0RSxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMxQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDeEIsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFTyx5QkFBeUIsQ0FBQyxFQUFVO1lBQzNDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoRCxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUVuQixxQ0FBcUM7Z0JBQ3JDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV0RCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzNGLElBQUksa0JBQWtCLENBQUMscUJBQXFCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUMzRCxxQ0FBcUM7d0JBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN0QyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFtQjtZQUN6QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxXQUFtQjtZQUM5QyxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekQsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzNGLGdCQUFnQixHQUFHO3dCQUNsQixjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7d0JBQy9MLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksaURBQTJCLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN2SSxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGdEQUEwQixDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDckksQ0FBQztnQkFDSCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZGLGdCQUFnQixHQUFHO3dCQUNsQixjQUFjLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNDQUFzQyxFQUFFLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLElBQUksSUFBSSxXQUFXLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3dCQUN2USxZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHNDQUFzQyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ3hHLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkscUNBQXFDLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztxQkFDdEcsQ0FBQztnQkFDSCxDQUFDO2dCQUVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDMUQsQ0FBQztZQUVELE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztRQUVPLDJCQUEyQixDQUFDLGNBQXdDO1lBQzNFLEtBQUssTUFBTSxhQUFhLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRWpDLGlDQUFpQztnQkFDakMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7b0JBQzFCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekMsQ0FBQztnQkFFRCxTQUFTO2dCQUNULE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzdFLElBQUksb0JBQW9CLEVBQUUsS0FBSyxFQUFFLEtBQUssYUFBYSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUN4RCxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztnQkFFRCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDM0YsSUFBSSxDQUFDLDRCQUE0QixDQUFDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO2dCQUNyRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRTVDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUMxQyxXQUFXLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pJLFdBQVcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsZ0NBQWdDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFeEgsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7UUFDRixDQUFDO1FBRU8sNEJBQTRCLENBQUMsYUFBNEI7WUFDaEUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8sNEJBQTRCLENBQUMsYUFBNEIsRUFBRSxrQkFBdUM7WUFDekcsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsNEJBQTRCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUNyRixNQUFNLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEYsY0FBYyxDQUFDLDRCQUE0QixDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFFcEUsSUFBSSxZQUFZLFlBQVksc0NBQXNDLEVBQUUsQ0FBQztnQkFDcEUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ2xELENBQUM7WUFFRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEMsQ0FBQztZQUVELElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFTyw0QkFBNEIsQ0FBQyxrQkFBdUM7WUFDM0UsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9KLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxFQUFVLEVBQUUsSUFBWSxFQUFFLElBQWlDLEVBQUUsWUFBZ0M7WUFDN0gsSUFBSSxVQUFVLEdBQXlCLFNBQVMsQ0FBQztZQUNqRCxJQUFJLE9BQU8sR0FBb0IsU0FBUyxDQUFDO1lBQ3pDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ3JCLE9BQU8sR0FBRyxJQUFJLENBQUM7b0JBQ2YsTUFBTSxNQUFNLEdBQUcsSUFBQSxjQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzlCLE1BQU0sSUFBSSxHQUFHLElBQUksaUJBQVUsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwQixNQUFNLE1BQU0sR0FBRyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNyRSxNQUFNLFNBQVMsR0FBRyxzQkFBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IscUNBQXFDLE1BQU0sRUFBRSxDQUFDO29CQUNySCxVQUFVLEdBQUcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ2xDLElBQUEsbUJBQWEsRUFBQyxTQUFTLEVBQUU7WUFDakIsTUFBTTtpQkFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVE7b0JBQ2xCLE1BQU07eUJBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFROzs7SUFHMUMsQ0FBQyxDQUFDO2dCQUNILENBQUM7cUJBQU0sSUFBSSxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4QyxVQUFVLEdBQUcscUJBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO1FBQ3hELENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxhQUE0QjtZQUMzRCxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFTyxjQUFjLENBQUMsaUJBQXlDLEVBQUUsbUJBQTBDO1lBQzNHLE1BQU0sYUFBYSxHQUFHLElBQUEsZ0JBQVEsRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7WUFDakgsTUFBTSxlQUFlLEdBQUcsSUFBQSxnQkFBUSxFQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFFL0YsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQy9CLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDdEcsT0FBTyxLQUFLLENBQUM7b0JBQ2QsQ0FBQztnQkFDRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUM7WUFFRCw0SEFBNEg7WUFDNUgsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksdURBQXVCLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsSUFBSSxtQkFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakksbUJBQW1CLEdBQUcsbUJBQW1CLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxlQUFlLENBQUMsQ0FBQztnQkFFaEgsbURBQW1EO2dCQUNuRCxJQUFJLENBQUMsYUFBYSxJQUFJLG1CQUFtQixFQUFFLFNBQVMsSUFBSSxtQkFBbUIsRUFBRSxPQUFPLEVBQUUsQ0FBQztvQkFDdEYsT0FBTyxLQUFLLENBQUM7Z0JBQ2QsQ0FBQztnQkFFRCxJQUFJLG1CQUFtQixFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9JLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sWUFBWSxDQUFDLGFBQTRCO1lBQ2hELElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sYUFBYSxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRSxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUNyTyxDQUFDO1FBRU8sYUFBYSxDQUFDLFdBQW1CO1lBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTdDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDRixDQUFDO1FBRU8sZUFBZSxDQUFDLFdBQW1CO1lBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRSxJQUFJLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3RCLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDRixDQUFDO1FBRUQseUJBQXlCO1lBQ3hCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsRixPQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtpQkFDN0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUM3QyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3ZGLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQsMEJBQTBCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRTtpQkFDN0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ2xILEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ2xELENBQUM7UUFFRCxLQUFLLENBQUMsS0FBYztZQUNuQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWEsRUFBRSxNQUFjO1lBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksZUFBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxFQUFVO1lBQ2xDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxRSxPQUFPLGFBQWEsSUFBSSxJQUFJLENBQUMscUJBQXFCLENBQUMsd0JBQXdCLENBQUMsYUFBYSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDMUksQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVPLDJDQUEyQyxDQUFDLENBQWtDO1lBQ3JGLElBQUksSUFBSSxDQUFDLHlCQUF5QixLQUFLLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDLDREQUE0RCxFQUFFLENBQUM7Z0JBQy9JLElBQUksQ0FBQywrQkFBK0IsR0FBRyxTQUFTLENBQUM7Z0JBQ2pELElBQUksQ0FBQywwQkFBMEIsR0FBRyxTQUFTLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUM7Z0JBRXZDLE1BQU0saUJBQWlCLEdBQXdCLEVBQUUsQ0FBQztnQkFDbEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUVoRSxLQUFLLE1BQU0sbUJBQW1CLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQzdELGlCQUFpQixDQUFDLElBQUksQ0FBQzt3QkFDdEIsRUFBRSxFQUFFLG1CQUFtQixDQUFDLEVBQUU7d0JBQzFCLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxJQUFJO3dCQUM5QixLQUFLLEVBQUUsbUJBQW1CLENBQUMsS0FBSzt3QkFDaEMsTUFBTSxFQUFFLG1CQUFtQixDQUFDLE1BQU07d0JBQ2xDLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7cUJBQ3ZGLENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUVELEtBQUssTUFBTSxhQUFhLElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztvQkFDdEQsOEJBQThCO29CQUM5QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLGFBQWEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO3dCQUNsRSxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDNUUsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzs0QkFDbEIsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUM1QyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRTtnQ0FDbEMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFO2dDQUNwQixJQUFJLEVBQUUsT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLO2dDQUMvRixLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUs7Z0NBQzFCLE1BQU0sRUFBRSxhQUFhLENBQUMsTUFBTTtnQ0FDNUIsT0FBTyxFQUFFLGFBQWEsQ0FBQyxPQUFPOzZCQUM5QixDQUFDLENBQUM7d0JBQ0osQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLGlCQUFpQixDQUFDLElBQUksQ0FBQztnQ0FDdEIsRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFO2dDQUNwQixJQUFJLEVBQUUsT0FBTyxhQUFhLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLO2dDQUMvRixLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUs7Z0NBQzFCLE1BQU0sRUFBRSxJQUFJO2dDQUNaLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDOzZCQUM1QyxDQUFDLENBQUM7d0JBQ0osQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzNELENBQUM7UUFDRixDQUFDO1FBRU8sd0JBQXdCO1lBQy9CLE1BQU0sS0FBSyxHQUEyQixFQUFFLENBQUM7WUFFekMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQ2hFLEtBQUssTUFBTSxhQUFhLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQzVDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlELElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUMzRixNQUFNLEtBQUssR0FBbUMsRUFBRSxDQUFDO29CQUNqRCxLQUFLLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO3dCQUM5RCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO29CQUMzRCxDQUFDO29CQUNELEtBQUssQ0FBQyxJQUFJLENBQUM7d0JBQ1YsRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFO3dCQUNwQixJQUFJLEVBQUUsa0JBQWtCLENBQUMsS0FBSzt3QkFDOUIsSUFBSSxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsZ0RBQWdEO3dCQUMzSyxLQUFLO3dCQUNMLE1BQU0sRUFBRSxhQUFhLENBQUMsTUFBTTt3QkFDNUIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxLQUFLO3dCQUMxQixPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU87d0JBQzlCLFNBQVMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXO3FCQUNyQyxDQUFDLENBQUM7Z0JBQ0osQ0FBQztxQkFBTSxDQUFDO29CQUNQLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsYUFBYSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUM1SixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBR0QsSUFBWSxvQkFBb0I7WUFDL0IsSUFBSSxJQUFJLENBQUMscUJBQXFCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDNUQsS0FBSyxNQUFNLHdCQUF3QixJQUFJLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLENBQUM7b0JBQzVFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssd0JBQXdCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2pILElBQUksbUJBQW1CLEVBQUUsQ0FBQzt3QkFDekIsbUJBQW1CLENBQUMsT0FBTyxHQUFHLHdCQUF3QixDQUFDLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7d0JBQzlGLG1CQUFtQixDQUFDLElBQUksR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUM7d0JBQ3pELG1CQUFtQixDQUFDLElBQUksR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDOzRCQUNuRyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzt3QkFDN0YsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQzs0QkFDcEYsbUJBQW1CLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLGdEQUFnRDt3QkFDdkYsQ0FBQzt3QkFDRCxtQkFBbUIsQ0FBQyxLQUFLLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDO3dCQUMzRCxtQkFBbUIsQ0FBQyxTQUFTLEdBQUcsd0JBQXdCLENBQUMsU0FBUyxDQUFDO29CQUNwRSxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLDJCQUEyQixJQUFJLElBQUksQ0FBQywrQkFBK0IsRUFBRSxFQUFFLENBQUM7b0JBQ2xGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssMkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3BILElBQUksbUJBQW1CLEVBQUUsQ0FBQzt3QkFDekIsbUJBQW1CLENBQUMsT0FBTyxHQUFHLDJCQUEyQixDQUFDLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxPQUFPLENBQUM7b0JBQ2xHLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztRQUNuQyxDQUFDO1FBRU8sOEJBQThCLENBQUMsb0JBQTRDO1lBQ2xGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDNUQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBdUI7Z0JBQ3ZHLEVBQUU7Z0JBQ0YsTUFBTTtnQkFDTixPQUFPLEVBQUUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPO2dCQUNsRixLQUFLO2FBQ0osQ0FBQSxDQUFDLENBQUMsQ0FBQztZQUVMLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBNEI7Z0JBQ2hJLEVBQUU7Z0JBQ0YsT0FBTyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDM0MsU0FBUyxFQUFFLHFCQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3pELElBQUk7Z0JBQ0osU0FBUztnQkFDVCxLQUFLO2FBQ0osQ0FBQSxDQUFDLENBQUMsQ0FBQztZQUVMLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBK0I7Z0JBQ2pILEVBQUU7Z0JBQ0YsT0FBTzthQUNOLENBQUEsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBRU8sdUJBQXVCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRU8sdUJBQXVCLENBQUMsb0JBQTRDO1lBQzNFLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUdELElBQVkseUJBQXlCO1lBQ3BDLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLDBCQUEwQixHQUFHLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO1lBQzdFLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQztRQUN4QyxDQUFDO1FBRUQsSUFBWSx5QkFBeUIsQ0FBQyx5QkFBaUM7WUFDdEUsSUFBSSxJQUFJLENBQUMseUJBQXlCLEtBQUsseUJBQXlCLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLDBCQUEwQixHQUFHLHlCQUF5QixDQUFDO2dCQUM1RCxJQUFJLENBQUMsa0NBQWtDLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUNwRSxDQUFDO1FBQ0YsQ0FBQztRQUVPLGtDQUFrQztZQUN6QyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLGdDQUF3QixJQUFJLENBQUMsQ0FBQztRQUNsRyxDQUFDO1FBRU8sa0NBQWtDLENBQUMsS0FBYTtZQUN2RCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLEtBQUssMkRBQTJDLENBQUM7UUFDbEgsQ0FBQztRQUVPLDRCQUE0QjtZQUNuQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDeEQsQ0FBQztRQUVPLDRCQUE0QixDQUFDLHlCQUFzRDtZQUMxRixJQUFJLENBQUMsOEJBQThCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ2pGLENBQUM7UUFHRCxJQUFZLDhCQUE4QjtZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQywrQkFBK0IsR0FBRyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsQ0FBQztZQUN2RixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUM7UUFDN0MsQ0FBQztRQUVELElBQVksOEJBQThCLENBQUMsNkJBQXFDO1lBQy9FLElBQUksSUFBSSxDQUFDLDhCQUE4QixLQUFLLDZCQUE2QixFQUFFLENBQUM7Z0JBQzNFLElBQUksQ0FBQywrQkFBK0IsR0FBRyw2QkFBNkIsQ0FBQztnQkFDckUsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLDZCQUE2QixDQUFDLENBQUM7WUFDN0UsQ0FBQztRQUNGLENBQUM7UUFFTyx1Q0FBdUM7WUFDOUMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixnQ0FBd0IsSUFBSSxDQUFDLENBQUM7UUFDdkcsQ0FBQztRQUVPLHVDQUF1QyxDQUFDLEtBQWE7WUFDNUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLDhEQUE4QyxDQUFDO1FBQzFILENBQUM7UUFFTywrQkFBK0I7WUFDdEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFTywrQkFBK0IsQ0FBQyw0QkFBNEQ7WUFDbkcsSUFBSSxDQUFDLGlDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUN2RixDQUFDO1FBR0QsSUFBWSxpQ0FBaUM7WUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsa0NBQWtDLEdBQUcsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLENBQUM7WUFDN0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLGtDQUFrQyxDQUFDO1FBQ2hELENBQUM7UUFFRCxJQUFZLGlDQUFpQyxDQUFDLGlDQUF5QztZQUN0RixJQUFJLElBQUksQ0FBQyxpQ0FBaUMsS0FBSyxpQ0FBaUMsRUFBRSxDQUFDO2dCQUNsRixJQUFJLENBQUMsa0NBQWtDLEdBQUcsaUNBQWlDLENBQUM7Z0JBQzVFLElBQUksQ0FBQywwQ0FBMEMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7UUFDRixDQUFDO1FBRU8sMENBQTBDO1lBQ2pELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0Isa0NBQTBCLElBQUksQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFFTywwQ0FBMEMsQ0FBQyxLQUFhO1lBQy9ELElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsK0JBQStCLEVBQUUsS0FBSyxnRUFBZ0QsQ0FBQztRQUMvSCxDQUFDO0tBQ0QsQ0FBQTtJQXBtQlksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFlMUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOEJBQXNCLENBQUE7UUFDdEIsV0FBQSwrQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsdUNBQXVCLENBQUE7T0FyQmIsZ0JBQWdCLENBb21CNUI7SUFFRCxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHdDQUFrQjs7aUJBRW5DLDRCQUF1QixHQUFHLEdBQUcsQUFBTixDQUFPO1FBSXRELFlBQ0Msc0JBQStDLEVBQzlCLElBQVcsRUFDWCxpQkFBcUMsRUFDN0IsYUFBdUQsRUFDN0QsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUNqRSxlQUFrRDtZQUVwRSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQVBiLFNBQUksR0FBSixJQUFJLENBQU87WUFDWCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ1osa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDL0IseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNoRCxvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFUN0QsWUFBTyxHQUFHLENBQUMsQ0FBQztZQVluQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLHFCQUFxQixDQUFDLEVBQUU7Z0JBQy9FLElBQUksQ0FBQyxJQUFBLGdCQUFRLEVBQUMscUJBQXFCLENBQUMsSUFBSSxxQkFBcUIsQ0FBQyxFQUFFLEtBQUssSUFBSSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUNyRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDRCQUE0QixDQUFDLHNCQUErQztZQUMzRSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7UUFDdEQsQ0FBQztRQUVPLGNBQWM7WUFDckIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBaUM7WUFDbkQsSUFBSSxJQUFBLGtCQUFZLEVBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0MsT0FBTyxDQUFDLDRCQUE0QjtZQUNyQyxDQUFDO1lBRUQscUVBQXFFO1lBQ3JFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN2QixJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHNEQUFzRCxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLDZCQUEyQixDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQzNKLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7WUFFbkIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLElBQUksZUFBZSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUVoRixJQUFJLElBQUksQ0FBQyxJQUFJLCtEQUEyQixFQUFFLENBQUM7Z0JBQzFDLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxvREFBb0IsQ0FBQztnQkFDeEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3RFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVMseUNBQXlDLENBQUMsQ0FBQztnQkFFNUcsSUFBSSxjQUFjLElBQUksYUFBYSxFQUFFLEtBQUssRUFBRSxLQUFLLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDakYsUUFBUSxhQUFhLEVBQUUsQ0FBQzt3QkFDdkIsS0FBSyxPQUFPOzRCQUNYLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUNoRixNQUFNO3dCQUNQLEtBQUssUUFBUSxDQUFDO3dCQUNkOzRCQUNDLG1EQUFtRDs0QkFDbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDdkIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxxREFBcUIsQ0FBQzs0QkFDM0QsTUFBTTtvQkFDUixDQUFDO29CQUVELE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFFRCxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTyxTQUFTLENBQUMsTUFBYztZQU8vQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUF5RSxtQkFBbUIsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEwsQ0FBQzs7SUFwRkksMkJBQTJCO1FBVTlCLFdBQUEsdUNBQXVCLENBQUE7UUFDdkIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsMkJBQWdCLENBQUE7T0FiYiwyQkFBMkIsQ0FxRmhDO0lBRUQsTUFBTSxzQ0FBdUMsU0FBUSwyQkFBMkI7S0FBSTtJQUVwRixNQUFNLHNDQUF1QyxTQUFRLGlEQUEyQjtRQUUvRSxZQUFZLEVBQVUsRUFBRSxZQUEyQjtZQUNsRCxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFpQztZQUM1QyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBRUQsTUFBTSxxQ0FBc0MsU0FBUSxnREFBMEI7UUFFN0UsWUFBWSxFQUFVLEVBQUUsWUFBMkI7WUFDbEQsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCx5QkFBeUIsQ0FBQyxVQUFtQztZQUM1RCxJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDOUIsQ0FBQztLQUNEIn0=