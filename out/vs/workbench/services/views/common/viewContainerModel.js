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
define(["require", "exports", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/types", "vs/base/common/resources", "vs/base/common/themables", "vs/platform/log/common/log", "vs/platform/actions/common/actions", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/output/common/output", "vs/base/common/map", "vs/nls"], function (require, exports, views_1, contextkey_1, storage_1, platform_1, lifecycle_1, event_1, instantiation_1, uri_1, arrays_1, types_1, resources_1, themables_1, log_1, actions_1, actionCommonCategories_1, output_1, map_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContainerModel = void 0;
    exports.getViewsStateStorageId = getViewsStateStorageId;
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_workbench.output.showViewsLog',
                title: (0, nls_1.localize2)('showViewsLog', "Show Views Log"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(servicesAccessor) {
            const loggerService = servicesAccessor.get(log_1.ILoggerService);
            const outputService = servicesAccessor.get(output_1.IOutputService);
            loggerService.setVisibility(views_1.VIEWS_LOG_ID, true);
            outputService.showChannel(views_1.VIEWS_LOG_ID);
        }
    });
    function getViewsStateStorageId(viewContainerStorageId) { return `${viewContainerStorageId}.hidden`; }
    let ViewDescriptorsState = class ViewDescriptorsState extends lifecycle_1.Disposable {
        constructor(viewContainerStorageId, viewContainerName, storageService, loggerService) {
            super();
            this.viewContainerName = viewContainerName;
            this.storageService = storageService;
            this._onDidChangeStoredState = this._register(new event_1.Emitter());
            this.onDidChangeStoredState = this._onDidChangeStoredState.event;
            this.logger = loggerService.createLogger(views_1.VIEWS_LOG_ID, { name: views_1.VIEWS_LOG_NAME, hidden: true });
            this.globalViewsStateStorageId = getViewsStateStorageId(viewContainerStorageId);
            this.workspaceViewsStateStorageId = viewContainerStorageId;
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, this.globalViewsStateStorageId, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidStorageChange()));
            this.state = this.initialize();
        }
        set(id, state) {
            this.state.set(id, state);
        }
        get(id) {
            return this.state.get(id);
        }
        updateState(viewDescriptors) {
            this.updateWorkspaceState(viewDescriptors);
            this.updateGlobalState(viewDescriptors);
        }
        updateWorkspaceState(viewDescriptors) {
            const storedViewsStates = this.getStoredWorkspaceState();
            for (const viewDescriptor of viewDescriptors) {
                const viewState = this.get(viewDescriptor.id);
                if (viewState) {
                    storedViewsStates[viewDescriptor.id] = {
                        collapsed: !!viewState.collapsed,
                        isHidden: !viewState.visibleWorkspace,
                        size: viewState.size,
                        order: viewDescriptor.workspace && viewState ? viewState.order : undefined
                    };
                }
            }
            if (Object.keys(storedViewsStates).length > 0) {
                this.storageService.store(this.workspaceViewsStateStorageId, JSON.stringify(storedViewsStates), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(this.workspaceViewsStateStorageId, 1 /* StorageScope.WORKSPACE */);
            }
        }
        updateGlobalState(viewDescriptors) {
            const storedGlobalState = this.getStoredGlobalState();
            for (const viewDescriptor of viewDescriptors) {
                const state = this.get(viewDescriptor.id);
                storedGlobalState.set(viewDescriptor.id, {
                    id: viewDescriptor.id,
                    isHidden: state && viewDescriptor.canToggleVisibility ? !state.visibleGlobal : false,
                    order: !viewDescriptor.workspace && state ? state.order : undefined
                });
            }
            this.setStoredGlobalState(storedGlobalState);
        }
        onDidStorageChange() {
            if (this.globalViewsStatesValue !== this.getStoredGlobalViewsStatesValue() /* This checks if current window changed the value or not */) {
                this._globalViewsStatesValue = undefined;
                const storedViewsVisibilityStates = this.getStoredGlobalState();
                const storedWorkspaceViewsStates = this.getStoredWorkspaceState();
                const changedStates = [];
                for (const [id, storedState] of storedViewsVisibilityStates) {
                    const state = this.get(id);
                    if (state) {
                        if (state.visibleGlobal !== !storedState.isHidden) {
                            if (!storedState.isHidden) {
                                this.logger.info(`View visibility state changed: ${id} is now visible`, this.viewContainerName);
                            }
                            changedStates.push({ id, visible: !storedState.isHidden });
                        }
                    }
                    else {
                        const workspaceViewState = storedWorkspaceViewsStates[id];
                        this.set(id, {
                            active: false,
                            visibleGlobal: !storedState.isHidden,
                            visibleWorkspace: (0, types_1.isUndefined)(workspaceViewState?.isHidden) ? undefined : !workspaceViewState?.isHidden,
                            collapsed: workspaceViewState?.collapsed,
                            order: workspaceViewState?.order,
                            size: workspaceViewState?.size,
                        });
                    }
                }
                if (changedStates.length) {
                    this._onDidChangeStoredState.fire(changedStates);
                    // Update the in memory state after firing the event
                    // so that the views can update their state accordingly
                    for (const changedState of changedStates) {
                        const state = this.get(changedState.id);
                        if (state) {
                            state.visibleGlobal = changedState.visible;
                        }
                    }
                }
            }
        }
        initialize() {
            const viewStates = new Map();
            const workspaceViewsStates = this.getStoredWorkspaceState();
            for (const id of Object.keys(workspaceViewsStates)) {
                const workspaceViewState = workspaceViewsStates[id];
                viewStates.set(id, {
                    active: false,
                    visibleGlobal: undefined,
                    visibleWorkspace: (0, types_1.isUndefined)(workspaceViewState.isHidden) ? undefined : !workspaceViewState.isHidden,
                    collapsed: workspaceViewState.collapsed,
                    order: workspaceViewState.order,
                    size: workspaceViewState.size,
                });
            }
            // Migrate to `viewletStateStorageId`
            const value = this.storageService.get(this.globalViewsStateStorageId, 1 /* StorageScope.WORKSPACE */, '[]');
            const { state: workspaceVisibilityStates } = this.parseStoredGlobalState(value);
            if (workspaceVisibilityStates.size > 0) {
                for (const { id, isHidden } of workspaceVisibilityStates.values()) {
                    const viewState = viewStates.get(id);
                    // Not migrated to `viewletStateStorageId`
                    if (viewState) {
                        if ((0, types_1.isUndefined)(viewState.visibleWorkspace)) {
                            viewState.visibleWorkspace = !isHidden;
                        }
                    }
                    else {
                        viewStates.set(id, {
                            active: false,
                            collapsed: undefined,
                            visibleGlobal: undefined,
                            visibleWorkspace: !isHidden,
                        });
                    }
                }
                this.storageService.remove(this.globalViewsStateStorageId, 1 /* StorageScope.WORKSPACE */);
            }
            const { state, hasDuplicates } = this.parseStoredGlobalState(this.globalViewsStatesValue);
            if (hasDuplicates) {
                this.setStoredGlobalState(state);
            }
            for (const { id, isHidden, order } of state.values()) {
                const viewState = viewStates.get(id);
                if (viewState) {
                    viewState.visibleGlobal = !isHidden;
                    if (!(0, types_1.isUndefined)(order)) {
                        viewState.order = order;
                    }
                }
                else {
                    viewStates.set(id, {
                        active: false,
                        visibleGlobal: !isHidden,
                        order,
                        collapsed: undefined,
                        visibleWorkspace: undefined,
                    });
                }
            }
            return viewStates;
        }
        getStoredWorkspaceState() {
            return JSON.parse(this.storageService.get(this.workspaceViewsStateStorageId, 1 /* StorageScope.WORKSPACE */, '{}'));
        }
        getStoredGlobalState() {
            return this.parseStoredGlobalState(this.globalViewsStatesValue).state;
        }
        setStoredGlobalState(storedGlobalState) {
            this.globalViewsStatesValue = JSON.stringify([...storedGlobalState.values()]);
        }
        parseStoredGlobalState(value) {
            const storedValue = JSON.parse(value);
            let hasDuplicates = false;
            const state = storedValue.reduce((result, storedState) => {
                if (typeof storedState === 'string' /* migration */) {
                    hasDuplicates = hasDuplicates || result.has(storedState);
                    result.set(storedState, { id: storedState, isHidden: true });
                }
                else {
                    hasDuplicates = hasDuplicates || result.has(storedState.id);
                    result.set(storedState.id, storedState);
                }
                return result;
            }, new Map());
            return { state, hasDuplicates };
        }
        get globalViewsStatesValue() {
            if (!this._globalViewsStatesValue) {
                this._globalViewsStatesValue = this.getStoredGlobalViewsStatesValue();
            }
            return this._globalViewsStatesValue;
        }
        set globalViewsStatesValue(globalViewsStatesValue) {
            if (this.globalViewsStatesValue !== globalViewsStatesValue) {
                this._globalViewsStatesValue = globalViewsStatesValue;
                this.setStoredGlobalViewsStatesValue(globalViewsStatesValue);
            }
        }
        getStoredGlobalViewsStatesValue() {
            return this.storageService.get(this.globalViewsStateStorageId, 0 /* StorageScope.PROFILE */, '[]');
        }
        setStoredGlobalViewsStatesValue(value) {
            this.storageService.store(this.globalViewsStateStorageId, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    ViewDescriptorsState = __decorate([
        __param(2, storage_1.IStorageService),
        __param(3, log_1.ILoggerService)
    ], ViewDescriptorsState);
    let ViewContainerModel = class ViewContainerModel extends lifecycle_1.Disposable {
        get title() { return this._title; }
        get icon() { return this._icon; }
        get keybindingId() { return this._keybindingId; }
        // All View Descriptors
        get allViewDescriptors() { return this.viewDescriptorItems.map(item => item.viewDescriptor); }
        // Active View Descriptors
        get activeViewDescriptors() { return this.viewDescriptorItems.filter(item => item.state.active).map(item => item.viewDescriptor); }
        // Visible View Descriptors
        get visibleViewDescriptors() { return this.viewDescriptorItems.filter(item => this.isViewDescriptorVisible(item)).map(item => item.viewDescriptor); }
        constructor(viewContainer, instantiationService, contextKeyService, loggerService) {
            super();
            this.viewContainer = viewContainer;
            this.contextKeyService = contextKeyService;
            this.contextKeys = new map_1.CounterSet();
            this.viewDescriptorItems = [];
            this._onDidChangeContainerInfo = this._register(new event_1.Emitter());
            this.onDidChangeContainerInfo = this._onDidChangeContainerInfo.event;
            this._onDidChangeAllViewDescriptors = this._register(new event_1.Emitter());
            this.onDidChangeAllViewDescriptors = this._onDidChangeAllViewDescriptors.event;
            this._onDidChangeActiveViewDescriptors = this._register(new event_1.Emitter());
            this.onDidChangeActiveViewDescriptors = this._onDidChangeActiveViewDescriptors.event;
            this._onDidAddVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidAddVisibleViewDescriptors = this._onDidAddVisibleViewDescriptors.event;
            this._onDidRemoveVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidRemoveVisibleViewDescriptors = this._onDidRemoveVisibleViewDescriptors.event;
            this._onDidMoveVisibleViewDescriptors = this._register(new event_1.Emitter());
            this.onDidMoveVisibleViewDescriptors = this._onDidMoveVisibleViewDescriptors.event;
            this.logger = loggerService.createLogger(views_1.VIEWS_LOG_ID, { name: views_1.VIEWS_LOG_NAME, hidden: true });
            this._register(event_1.Event.filter(contextKeyService.onDidChangeContext, e => e.affectsSome(this.contextKeys))(() => this.onDidChangeContext()));
            this.viewDescriptorsState = this._register(instantiationService.createInstance(ViewDescriptorsState, viewContainer.storageId || `${viewContainer.id}.state`, typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.original));
            this._register(this.viewDescriptorsState.onDidChangeStoredState(items => this.updateVisibility(items)));
            this.updateContainerInfo();
        }
        updateContainerInfo() {
            /* Use default container info if one of the visible view descriptors belongs to the current container by default */
            const useDefaultContainerInfo = this.viewContainer.alwaysUseContainerInfo || this.visibleViewDescriptors.length === 0 || this.visibleViewDescriptors.some(v => platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getViewContainer(v.id) === this.viewContainer);
            const title = useDefaultContainerInfo ? (typeof this.viewContainer.title === 'string' ? this.viewContainer.title : this.viewContainer.title.value) : this.visibleViewDescriptors[0]?.containerTitle || this.visibleViewDescriptors[0]?.name?.value || '';
            let titleChanged = false;
            if (this._title !== title) {
                this._title = title;
                titleChanged = true;
            }
            const icon = useDefaultContainerInfo ? this.viewContainer.icon : this.visibleViewDescriptors[0]?.containerIcon || views_1.defaultViewIcon;
            let iconChanged = false;
            if (!this.isEqualIcon(icon)) {
                this._icon = icon;
                iconChanged = true;
            }
            const keybindingId = this.viewContainer.openCommandActionDescriptor?.id ?? this.activeViewDescriptors.find(v => v.openCommandActionDescriptor)?.openCommandActionDescriptor?.id;
            let keybindingIdChanged = false;
            if (this._keybindingId !== keybindingId) {
                this._keybindingId = keybindingId;
                keybindingIdChanged = true;
            }
            if (titleChanged || iconChanged || keybindingIdChanged) {
                this._onDidChangeContainerInfo.fire({ title: titleChanged, icon: iconChanged, keybindingId: keybindingIdChanged });
            }
        }
        isEqualIcon(icon) {
            if (uri_1.URI.isUri(icon)) {
                return uri_1.URI.isUri(this._icon) && (0, resources_1.isEqual)(icon, this._icon);
            }
            else if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                return themables_1.ThemeIcon.isThemeIcon(this._icon) && themables_1.ThemeIcon.isEqual(icon, this._icon);
            }
            return icon === this._icon;
        }
        isVisible(id) {
            const viewDescriptorItem = this.viewDescriptorItems.find(v => v.viewDescriptor.id === id);
            if (!viewDescriptorItem) {
                throw new Error(`Unknown view ${id}`);
            }
            return this.isViewDescriptorVisible(viewDescriptorItem);
        }
        setVisible(id, visible) {
            this.updateVisibility([{ id, visible }]);
        }
        updateVisibility(viewDescriptors) {
            // First: Update and remove the view descriptors which are asked to be hidden
            const viewDescriptorItemsToHide = (0, arrays_1.coalesce)(viewDescriptors.filter(({ visible }) => !visible)
                .map(({ id }) => this.findAndIgnoreIfNotFound(id)));
            const removed = [];
            for (const { viewDescriptorItem, visibleIndex } of viewDescriptorItemsToHide) {
                if (this.updateViewDescriptorItemVisibility(viewDescriptorItem, false)) {
                    removed.push({ viewDescriptor: viewDescriptorItem.viewDescriptor, index: visibleIndex });
                }
            }
            if (removed.length) {
                this.broadCastRemovedVisibleViewDescriptors(removed);
            }
            // Second: Update and add the view descriptors which are asked to be shown
            const added = [];
            for (const { id, visible } of viewDescriptors) {
                if (!visible) {
                    continue;
                }
                const foundViewDescriptor = this.findAndIgnoreIfNotFound(id);
                if (!foundViewDescriptor) {
                    continue;
                }
                const { viewDescriptorItem, visibleIndex } = foundViewDescriptor;
                if (this.updateViewDescriptorItemVisibility(viewDescriptorItem, true)) {
                    added.push({ index: visibleIndex, viewDescriptor: viewDescriptorItem.viewDescriptor, size: viewDescriptorItem.state.size, collapsed: !!viewDescriptorItem.state.collapsed });
                }
            }
            if (added.length) {
                this.broadCastAddedVisibleViewDescriptors(added);
            }
        }
        updateViewDescriptorItemVisibility(viewDescriptorItem, visible) {
            if (!viewDescriptorItem.viewDescriptor.canToggleVisibility) {
                return false;
            }
            if (this.isViewDescriptorVisibleWhenActive(viewDescriptorItem) === visible) {
                return false;
            }
            // update visibility
            if (viewDescriptorItem.viewDescriptor.workspace) {
                viewDescriptorItem.state.visibleWorkspace = visible;
            }
            else {
                viewDescriptorItem.state.visibleGlobal = visible;
                if (visible) {
                    this.logger.info(`Showing view ${viewDescriptorItem.viewDescriptor.id} in the container ${this.viewContainer.id}`);
                }
            }
            // return `true` only if visibility is changed
            return this.isViewDescriptorVisible(viewDescriptorItem) === visible;
        }
        isCollapsed(id) {
            return !!this.find(id).viewDescriptorItem.state.collapsed;
        }
        setCollapsed(id, collapsed) {
            const { viewDescriptorItem } = this.find(id);
            if (viewDescriptorItem.state.collapsed !== collapsed) {
                viewDescriptorItem.state.collapsed = collapsed;
            }
            this.viewDescriptorsState.updateState(this.allViewDescriptors);
        }
        getSize(id) {
            return this.find(id).viewDescriptorItem.state.size;
        }
        setSizes(newSizes) {
            for (const { id, size } of newSizes) {
                const { viewDescriptorItem } = this.find(id);
                if (viewDescriptorItem.state.size !== size) {
                    viewDescriptorItem.state.size = size;
                }
            }
            this.viewDescriptorsState.updateState(this.allViewDescriptors);
        }
        move(from, to) {
            const fromIndex = this.viewDescriptorItems.findIndex(v => v.viewDescriptor.id === from);
            const toIndex = this.viewDescriptorItems.findIndex(v => v.viewDescriptor.id === to);
            const fromViewDescriptor = this.viewDescriptorItems[fromIndex];
            const toViewDescriptor = this.viewDescriptorItems[toIndex];
            (0, arrays_1.move)(this.viewDescriptorItems, fromIndex, toIndex);
            for (let index = 0; index < this.viewDescriptorItems.length; index++) {
                this.viewDescriptorItems[index].state.order = index;
            }
            this.broadCastMovedViewDescriptors({ index: fromIndex, viewDescriptor: fromViewDescriptor.viewDescriptor }, { index: toIndex, viewDescriptor: toViewDescriptor.viewDescriptor });
        }
        add(addedViewDescriptorStates) {
            const addedItems = [];
            for (const addedViewDescriptorState of addedViewDescriptorStates) {
                const viewDescriptor = addedViewDescriptorState.viewDescriptor;
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.add(key);
                    }
                }
                let state = this.viewDescriptorsState.get(viewDescriptor.id);
                if (state) {
                    // set defaults if not set
                    if (viewDescriptor.workspace) {
                        state.visibleWorkspace = (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.visible) ? ((0, types_1.isUndefinedOrNull)(state.visibleWorkspace) ? !viewDescriptor.hideByDefault : state.visibleWorkspace) : addedViewDescriptorState.visible;
                    }
                    else {
                        const isVisible = state.visibleGlobal;
                        state.visibleGlobal = (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.visible) ? ((0, types_1.isUndefinedOrNull)(state.visibleGlobal) ? !viewDescriptor.hideByDefault : state.visibleGlobal) : addedViewDescriptorState.visible;
                        if (state.visibleGlobal && !isVisible) {
                            this.logger.info(`Added view ${viewDescriptor.id} in the container ${this.viewContainer.id} and showing it.`, `${isVisible}`, `${viewDescriptor.hideByDefault}`, `${addedViewDescriptorState.visible}`);
                        }
                    }
                    state.collapsed = (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.collapsed) ? ((0, types_1.isUndefinedOrNull)(state.collapsed) ? !!viewDescriptor.collapsed : state.collapsed) : addedViewDescriptorState.collapsed;
                }
                else {
                    state = {
                        active: false,
                        visibleGlobal: (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.visible) ? !viewDescriptor.hideByDefault : addedViewDescriptorState.visible,
                        visibleWorkspace: (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.visible) ? !viewDescriptor.hideByDefault : addedViewDescriptorState.visible,
                        collapsed: (0, types_1.isUndefinedOrNull)(addedViewDescriptorState.collapsed) ? !!viewDescriptor.collapsed : addedViewDescriptorState.collapsed,
                    };
                }
                this.viewDescriptorsState.set(viewDescriptor.id, state);
                state.active = this.contextKeyService.contextMatchesRules(viewDescriptor.when);
                addedItems.push({ viewDescriptor, state });
            }
            this.viewDescriptorItems.push(...addedItems);
            this.viewDescriptorItems.sort(this.compareViewDescriptors.bind(this));
            this._onDidChangeAllViewDescriptors.fire({ added: addedItems.map(({ viewDescriptor }) => viewDescriptor), removed: [] });
            const addedActiveItems = [];
            for (const viewDescriptorItem of addedItems) {
                if (viewDescriptorItem.state.active) {
                    addedActiveItems.push({ viewDescriptorItem, visible: this.isViewDescriptorVisible(viewDescriptorItem) });
                }
            }
            if (addedActiveItems.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: addedActiveItems.map(({ viewDescriptorItem }) => viewDescriptorItem.viewDescriptor), removed: [] }));
            }
            const addedVisibleDescriptors = [];
            for (const { viewDescriptorItem, visible } of addedActiveItems) {
                if (visible && this.isViewDescriptorVisible(viewDescriptorItem)) {
                    const { visibleIndex } = this.find(viewDescriptorItem.viewDescriptor.id);
                    addedVisibleDescriptors.push({ index: visibleIndex, viewDescriptor: viewDescriptorItem.viewDescriptor, size: viewDescriptorItem.state.size, collapsed: !!viewDescriptorItem.state.collapsed });
                }
            }
            this.broadCastAddedVisibleViewDescriptors(addedVisibleDescriptors);
        }
        remove(viewDescriptors) {
            const removed = [];
            const removedItems = [];
            const removedActiveDescriptors = [];
            const removedVisibleDescriptors = [];
            for (const viewDescriptor of viewDescriptors) {
                if (viewDescriptor.when) {
                    for (const key of viewDescriptor.when.keys()) {
                        this.contextKeys.delete(key);
                    }
                }
                const index = this.viewDescriptorItems.findIndex(i => i.viewDescriptor.id === viewDescriptor.id);
                if (index !== -1) {
                    removed.push(viewDescriptor);
                    const viewDescriptorItem = this.viewDescriptorItems[index];
                    if (viewDescriptorItem.state.active) {
                        removedActiveDescriptors.push(viewDescriptorItem.viewDescriptor);
                    }
                    if (this.isViewDescriptorVisible(viewDescriptorItem)) {
                        const { visibleIndex } = this.find(viewDescriptorItem.viewDescriptor.id);
                        removedVisibleDescriptors.push({ index: visibleIndex, viewDescriptor: viewDescriptorItem.viewDescriptor });
                    }
                    removedItems.push(viewDescriptorItem);
                }
            }
            // update state
            removedItems.forEach(item => this.viewDescriptorItems.splice(this.viewDescriptorItems.indexOf(item), 1));
            this.broadCastRemovedVisibleViewDescriptors(removedVisibleDescriptors);
            if (removedActiveDescriptors.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: [], removed: removedActiveDescriptors }));
            }
            if (removed.length) {
                this._onDidChangeAllViewDescriptors.fire({ added: [], removed });
            }
        }
        onDidChangeContext() {
            const addedActiveItems = [];
            const removedActiveItems = [];
            for (const item of this.viewDescriptorItems) {
                const wasActive = item.state.active;
                const isActive = this.contextKeyService.contextMatchesRules(item.viewDescriptor.when);
                if (wasActive !== isActive) {
                    if (isActive) {
                        addedActiveItems.push({ item, visibleWhenActive: this.isViewDescriptorVisibleWhenActive(item) });
                    }
                    else {
                        removedActiveItems.push(item);
                    }
                }
            }
            const removedVisibleDescriptors = [];
            for (const item of removedActiveItems) {
                if (this.isViewDescriptorVisible(item)) {
                    const { visibleIndex } = this.find(item.viewDescriptor.id);
                    removedVisibleDescriptors.push({ index: visibleIndex, viewDescriptor: item.viewDescriptor });
                }
            }
            // Update the State
            removedActiveItems.forEach(item => item.state.active = false);
            addedActiveItems.forEach(({ item }) => item.state.active = true);
            this.broadCastRemovedVisibleViewDescriptors(removedVisibleDescriptors);
            if (addedActiveItems.length || removedActiveItems.length) {
                this._onDidChangeActiveViewDescriptors.fire(({ added: addedActiveItems.map(({ item }) => item.viewDescriptor), removed: removedActiveItems.map(item => item.viewDescriptor) }));
            }
            const addedVisibleDescriptors = [];
            for (const { item, visibleWhenActive } of addedActiveItems) {
                if (visibleWhenActive && this.isViewDescriptorVisible(item)) {
                    const { visibleIndex } = this.find(item.viewDescriptor.id);
                    addedVisibleDescriptors.push({ index: visibleIndex, viewDescriptor: item.viewDescriptor, size: item.state.size, collapsed: !!item.state.collapsed });
                }
            }
            this.broadCastAddedVisibleViewDescriptors(addedVisibleDescriptors);
        }
        broadCastAddedVisibleViewDescriptors(added) {
            if (added.length) {
                this._onDidAddVisibleViewDescriptors.fire(added.sort((a, b) => a.index - b.index));
                this.updateState(`Added views:${added.map(v => v.viewDescriptor.id).join(',')} in ${this.viewContainer.id}`);
            }
        }
        broadCastRemovedVisibleViewDescriptors(removed) {
            if (removed.length) {
                this._onDidRemoveVisibleViewDescriptors.fire(removed.sort((a, b) => b.index - a.index));
                this.updateState(`Removed views:${removed.map(v => v.viewDescriptor.id).join(',')} from ${this.viewContainer.id}`);
            }
        }
        broadCastMovedViewDescriptors(from, to) {
            this._onDidMoveVisibleViewDescriptors.fire({ from, to });
            this.updateState(`Moved view ${from.viewDescriptor.id} to ${to.viewDescriptor.id} in ${this.viewContainer.id}`);
        }
        updateState(reason) {
            this.logger.info(reason);
            this.viewDescriptorsState.updateState(this.allViewDescriptors);
            this.updateContainerInfo();
        }
        isViewDescriptorVisible(viewDescriptorItem) {
            if (!viewDescriptorItem.state.active) {
                return false;
            }
            return this.isViewDescriptorVisibleWhenActive(viewDescriptorItem);
        }
        isViewDescriptorVisibleWhenActive(viewDescriptorItem) {
            if (viewDescriptorItem.viewDescriptor.workspace) {
                return !!viewDescriptorItem.state.visibleWorkspace;
            }
            return !!viewDescriptorItem.state.visibleGlobal;
        }
        find(id) {
            const result = this.findAndIgnoreIfNotFound(id);
            if (result) {
                return result;
            }
            throw new Error(`view descriptor ${id} not found`);
        }
        findAndIgnoreIfNotFound(id) {
            for (let i = 0, visibleIndex = 0; i < this.viewDescriptorItems.length; i++) {
                const viewDescriptorItem = this.viewDescriptorItems[i];
                if (viewDescriptorItem.viewDescriptor.id === id) {
                    return { index: i, visibleIndex, viewDescriptorItem: viewDescriptorItem };
                }
                if (this.isViewDescriptorVisible(viewDescriptorItem)) {
                    visibleIndex++;
                }
            }
            return undefined;
        }
        compareViewDescriptors(a, b) {
            if (a.viewDescriptor.id === b.viewDescriptor.id) {
                return 0;
            }
            return (this.getViewOrder(a) - this.getViewOrder(b)) || this.getGroupOrderResult(a.viewDescriptor, b.viewDescriptor);
        }
        getViewOrder(viewDescriptorItem) {
            const viewOrder = typeof viewDescriptorItem.state.order === 'number' ? viewDescriptorItem.state.order : viewDescriptorItem.viewDescriptor.order;
            return typeof viewOrder === 'number' ? viewOrder : Number.MAX_VALUE;
        }
        getGroupOrderResult(a, b) {
            if (!a.group || !b.group) {
                return 0;
            }
            if (a.group === b.group) {
                return 0;
            }
            return a.group < b.group ? -1 : 1;
        }
    };
    exports.ViewContainerModel = ViewContainerModel;
    exports.ViewContainerModel = ViewContainerModel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, log_1.ILoggerService)
    ], ViewContainerModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0NvbnRhaW5lck1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdmlld3MvY29tbW9uL3ZpZXdDb250YWluZXJNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1Q2hHLHdEQUE2SDtJQWpCN0gsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsZ0NBQWdDO2dCQUNwQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDO2dCQUNsRCxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLGdCQUFrQztZQUMzQyxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsb0JBQWMsQ0FBQyxDQUFDO1lBQzNELE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUM7WUFDM0QsYUFBYSxDQUFDLGFBQWEsQ0FBQyxvQkFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELGFBQWEsQ0FBQyxXQUFXLENBQUMsb0JBQVksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxTQUFnQixzQkFBc0IsQ0FBQyxzQkFBOEIsSUFBWSxPQUFPLEdBQUcsc0JBQXNCLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUF3QjdILElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFXNUMsWUFDQyxzQkFBOEIsRUFDYixpQkFBeUIsRUFDekIsY0FBZ0Qs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