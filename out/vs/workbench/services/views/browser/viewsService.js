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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/workbench/common/contextkeys", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/base/common/types", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/browser/panecomposite", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/uri", "vs/platform/action/common/actionCommonCategories", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/common/viewsService"], function (require, exports, lifecycle_1, views_1, contextkeys_1, platform_1, storage_1, contextkey_1, event_1, types_1, actions_1, nls_1, extensions_1, instantiation_1, telemetry_1, themeService_1, contextView_1, extensions_2, workspace_1, panecomposite_1, layoutService_1, uri_1, actionCommonCategories_1, editorGroupsService_1, viewsViewlet_1, panecomposite_2, editorService_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewsService = void 0;
    exports.getPartByLocation = getPartByLocation;
    let ViewsService = class ViewsService extends lifecycle_1.Disposable {
        constructor(viewDescriptorService, paneCompositeService, contextKeyService, layoutService, editorService) {
            super();
            this.viewDescriptorService = viewDescriptorService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
            this.layoutService = layoutService;
            this.editorService = editorService;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            this._onDidChangeViewContainerVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewContainerVisibility = this._onDidChangeViewContainerVisibility.event;
            this._onDidChangeFocusedView = this._register(new event_1.Emitter());
            this.onDidChangeFocusedView = this._onDidChangeFocusedView.event;
            this.viewDisposable = new Map();
            this.enabledViewContainersContextKeys = new Map();
            this.visibleViewContextKeys = new Map();
            this.viewPaneContainers = new Map();
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.viewDisposable.forEach(disposable => disposable.dispose());
                this.viewDisposable.clear();
            }));
            this.viewDescriptorService.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer, this.viewDescriptorService.getViewContainerLocation(viewContainer)));
            this._register(this.viewDescriptorService.onDidChangeViewContainers(({ added, removed }) => this.onDidChangeContainers(added, removed)));
            this._register(this.viewDescriptorService.onDidChangeContainerLocation(({ viewContainer, from, to }) => this.onDidChangeContainerLocation(viewContainer, from, to)));
            // View Container Visibility
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => this._onDidChangeViewContainerVisibility.fire({ id: e.composite.getId(), visible: true, location: e.viewContainerLocation })));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(e => this._onDidChangeViewContainerVisibility.fire({ id: e.composite.getId(), visible: false, location: e.viewContainerLocation })));
            this.focusedViewContextKey = contextkeys_1.FocusedViewContext.bindTo(contextKeyService);
        }
        onViewsAdded(added) {
            for (const view of added) {
                this.onViewsVisibilityChanged(view, view.isBodyVisible());
            }
        }
        onViewsVisibilityChanged(view, visible) {
            this.getOrCreateActiveViewContextKey(view).set(visible);
            this._onDidChangeViewVisibility.fire({ id: view.id, visible: visible });
        }
        onViewsRemoved(removed) {
            for (const view of removed) {
                this.onViewsVisibilityChanged(view, false);
            }
        }
        getOrCreateActiveViewContextKey(view) {
            const visibleContextKeyId = (0, contextkeys_1.getVisbileViewContextKey)(view.id);
            let contextKey = this.visibleViewContextKeys.get(visibleContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(visibleContextKeyId, false).bindTo(this.contextKeyService);
                this.visibleViewContextKeys.set(visibleContextKeyId, contextKey);
            }
            return contextKey;
        }
        onDidChangeContainers(added, removed) {
            for (const { container, location } of removed) {
                this.deregisterPaneComposite(container, location);
            }
            for (const { container, location } of added) {
                this.onDidRegisterViewContainer(container, location);
            }
        }
        onDidRegisterViewContainer(viewContainer, viewContainerLocation) {
            this.registerPaneComposite(viewContainer, viewContainerLocation);
            const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
            this.onViewDescriptorsAdded(viewContainerModel.allViewDescriptors, viewContainer);
            this._register(viewContainerModel.onDidChangeAllViewDescriptors(({ added, removed }) => {
                this.onViewDescriptorsAdded(added, viewContainer);
                this.onViewDescriptorsRemoved(removed);
            }));
            this.updateViewContainerEnablementContextKey(viewContainer);
            this._register(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.updateViewContainerEnablementContextKey(viewContainer)));
            this._register(this.registerOpenViewContainerAction(viewContainer));
        }
        onDidChangeContainerLocation(viewContainer, from, to) {
            this.deregisterPaneComposite(viewContainer, from);
            this.registerPaneComposite(viewContainer, to);
            // Open view container if part is visible and there is only one view container in location
            if (this.layoutService.isVisible(getPartByLocation(to)) && this.viewDescriptorService.getViewContainersByLocation(to).length === 1) {
                this.openViewContainer(viewContainer.id);
            }
        }
        onViewDescriptorsAdded(views, container) {
            const location = this.viewDescriptorService.getViewContainerLocation(container);
            if (location === null) {
                return;
            }
            for (const viewDescriptor of views) {
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(this.registerOpenViewAction(viewDescriptor));
                disposables.add(this.registerFocusViewAction(viewDescriptor, container.title));
                disposables.add(this.registerResetViewLocationAction(viewDescriptor));
                this.viewDisposable.set(viewDescriptor, disposables);
            }
        }
        onViewDescriptorsRemoved(views) {
            for (const view of views) {
                const disposable = this.viewDisposable.get(view);
                if (disposable) {
                    disposable.dispose();
                    this.viewDisposable.delete(view);
                }
            }
        }
        updateViewContainerEnablementContextKey(viewContainer) {
            let contextKey = this.enabledViewContainersContextKeys.get(viewContainer.id);
            if (!contextKey) {
                contextKey = this.contextKeyService.createKey(getEnabledViewContainerContextKey(viewContainer.id), false);
                this.enabledViewContainersContextKeys.set(viewContainer.id, contextKey);
            }
            contextKey.set(!(viewContainer.hideIfEmpty && this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.length === 0));
        }
        async openComposite(compositeId, location, focus) {
            return this.paneCompositeService.openPaneComposite(compositeId, location, focus);
        }
        getComposite(compositeId, location) {
            return this.paneCompositeService.getPaneComposite(compositeId, location);
        }
        isViewContainerVisible(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (viewContainerLocation !== null) {
                    return this.paneCompositeService.getActivePaneComposite(viewContainerLocation)?.getId() === id;
                }
            }
            return false;
        }
        getVisibleViewContainer(location) {
            const viewContainerId = this.paneCompositeService.getActivePaneComposite(location)?.getId();
            return viewContainerId ? this.viewDescriptorService.getViewContainerById(viewContainerId) : null;
        }
        getActiveViewPaneContainerWithId(viewContainerId) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(viewContainerId);
            return viewContainer ? this.getActiveViewPaneContainer(viewContainer) : null;
        }
        async openViewContainer(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                if (viewContainerLocation !== null) {
                    const paneComposite = await this.paneCompositeService.openPaneComposite(id, viewContainerLocation, focus);
                    return paneComposite || null;
                }
            }
            return null;
        }
        async closeViewContainer(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (viewContainer) {
                const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                const isActive = viewContainerLocation !== null && this.paneCompositeService.getActivePaneComposite(viewContainerLocation);
                if (viewContainerLocation !== null) {
                    return isActive ? this.layoutService.setPartHidden(true, getPartByLocation(viewContainerLocation)) : undefined;
                }
            }
        }
        isViewVisible(id) {
            const activeView = this.getActiveViewWithId(id);
            return activeView?.isBodyVisible() || false;
        }
        getActiveViewWithId(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    return activeViewPaneContainer.getView(id);
                }
            }
            return null;
        }
        getViewWithId(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const viewPaneContainer = this.viewPaneContainers.get(viewContainer.id);
                if (viewPaneContainer) {
                    return viewPaneContainer.getView(id);
                }
            }
            return null;
        }
        getFocusedViewName() {
            const viewId = this.contextKeyService.getContextKeyValue(contextkeys_1.FocusedViewContext.key) ?? '';
            const textEditorFocused = this.editorService.activeTextEditorControl?.hasTextFocus() ? (0, nls_1.localize)('editor', "Text Editor") : undefined;
            return this.viewDescriptorService.getViewDescriptorById(viewId.toString())?.name?.value ?? textEditorFocused ?? '';
        }
        async openView(id, focus) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (!viewContainer) {
                return null;
            }
            if (!this.viewDescriptorService.getViewContainerModel(viewContainer).activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === id)) {
                return null;
            }
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            const compositeDescriptor = this.getComposite(viewContainer.id, location);
            if (compositeDescriptor) {
                const paneComposite = await this.openComposite(compositeDescriptor.id, location);
                if (paneComposite && paneComposite.openView) {
                    return paneComposite.openView(id, focus) || null;
                }
                else if (focus) {
                    paneComposite?.focus();
                }
            }
            return null;
        }
        closeView(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(id);
            if (viewContainer) {
                const activeViewPaneContainer = this.getActiveViewPaneContainer(viewContainer);
                if (activeViewPaneContainer) {
                    const view = activeViewPaneContainer.getView(id);
                    if (view) {
                        if (activeViewPaneContainer.views.length === 1) {
                            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                            if (location === 0 /* ViewContainerLocation.Sidebar */) {
                                this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                            }
                            else if (location === 1 /* ViewContainerLocation.Panel */ || location === 2 /* ViewContainerLocation.AuxiliaryBar */) {
                                this.paneCompositeService.hideActivePaneComposite(location);
                            }
                            // The blur event doesn't fire on WebKit when the focused element is hidden,
                            // so the context key needs to be forced here too otherwise a view may still
                            // think it's showing, breaking toggle commands.
                            if (this.focusedViewContextKey.get() === id) {
                                this.focusedViewContextKey.reset();
                            }
                        }
                        else {
                            view.setExpanded(false);
                        }
                    }
                }
            }
        }
        getActiveViewPaneContainer(viewContainer) {
            const location = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            if (location === null) {
                return null;
            }
            const activePaneComposite = this.paneCompositeService.getActivePaneComposite(location);
            if (activePaneComposite?.getId() === viewContainer.id) {
                return activePaneComposite.getViewPaneContainer() || null;
            }
            return null;
        }
        getViewProgressIndicator(viewId) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(viewId);
            if (!viewContainer) {
                return undefined;
            }
            const viewPaneContainer = this.viewPaneContainers.get(viewContainer.id);
            if (!viewPaneContainer) {
                return undefined;
            }
            const view = viewPaneContainer.getView(viewId);
            if (!view) {
                return undefined;
            }
            if (viewPaneContainer.isViewMergedWithContainer()) {
                return this.getViewContainerProgressIndicator(viewContainer);
            }
            return view.getProgressIndicator();
        }
        getViewContainerProgressIndicator(viewContainer) {
            const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
            if (viewContainerLocation === null) {
                return undefined;
            }
            return this.paneCompositeService.getProgressIndicator(viewContainer.id, viewContainerLocation);
        }
        registerOpenViewContainerAction(viewContainer) {
            const disposables = new lifecycle_1.DisposableStore();
            if (viewContainer.openCommandActionDescriptor) {
                const { id, mnemonicTitle, keybindings, order } = viewContainer.openCommandActionDescriptor ?? { id: viewContainer.id };
                const title = viewContainer.openCommandActionDescriptor.title ?? viewContainer.title;
                const that = this;
                disposables.add((0, actions_1.registerAction2)(class OpenViewContainerAction extends actions_1.Action2 {
                    constructor() {
                        super({
                            id,
                            get title() {
                                const viewContainerLocation = that.viewDescriptorService.getViewContainerLocation(viewContainer);
                                const localizedTitle = typeof title === 'string' ? title : title.value;
                                const originalTitle = typeof title === 'string' ? title : title.original;
                                if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                                    return { value: (0, nls_1.localize)('show view', "Show {0}", localizedTitle), original: `Show ${originalTitle}` };
                                }
                                else {
                                    return { value: (0, nls_1.localize)('toggle view', "Toggle {0}", localizedTitle), original: `Toggle ${originalTitle}` };
                                }
                            },
                            category: actionCommonCategories_1.Categories.View,
                            precondition: contextkey_1.ContextKeyExpr.has(getEnabledViewContainerContextKey(viewContainer.id)),
                            keybinding: keybindings ? { ...keybindings, weight: 200 /* KeybindingWeight.WorkbenchContrib */ } : undefined,
                            f1: true
                        });
                    }
                    async run(serviceAccessor) {
                        const editorGroupService = serviceAccessor.get(editorGroupsService_1.IEditorGroupsService);
                        const viewDescriptorService = serviceAccessor.get(views_1.IViewDescriptorService);
                        const layoutService = serviceAccessor.get(layoutService_1.IWorkbenchLayoutService);
                        const viewsService = serviceAccessor.get(viewsService_1.IViewsService);
                        const viewContainerLocation = viewDescriptorService.getViewContainerLocation(viewContainer);
                        switch (viewContainerLocation) {
                            case 2 /* ViewContainerLocation.AuxiliaryBar */:
                            case 0 /* ViewContainerLocation.Sidebar */: {
                                const part = viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */ ? "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ : "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
                                if (!viewsService.isViewContainerVisible(viewContainer.id) || !layoutService.hasFocus(part)) {
                                    await viewsService.openViewContainer(viewContainer.id, true);
                                }
                                else {
                                    editorGroupService.activeGroup.focus();
                                }
                                break;
                            }
                            case 1 /* ViewContainerLocation.Panel */:
                                if (!viewsService.isViewContainerVisible(viewContainer.id) || !layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                                    await viewsService.openViewContainer(viewContainer.id, true);
                                }
                                else {
                                    viewsService.closeViewContainer(viewContainer.id);
                                }
                                break;
                        }
                    }
                }));
                if (mnemonicTitle) {
                    const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(viewContainer);
                    disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
                        command: {
                            id,
                            title: mnemonicTitle,
                        },
                        group: defaultLocation === 0 /* ViewContainerLocation.Sidebar */ ? '3_views' : '4_panels',
                        when: contextkey_1.ContextKeyExpr.has(getEnabledViewContainerContextKey(viewContainer.id)),
                        order: order ?? Number.MAX_VALUE
                    }));
                }
            }
            return disposables;
        }
        registerOpenViewAction(viewDescriptor) {
            const disposables = new lifecycle_1.DisposableStore();
            if (viewDescriptor.openCommandActionDescriptor) {
                const title = viewDescriptor.openCommandActionDescriptor.title ?? viewDescriptor.name;
                const commandId = viewDescriptor.openCommandActionDescriptor.id;
                const that = this;
                disposables.add((0, actions_1.registerAction2)(class OpenViewAction extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: commandId,
                            get title() {
                                const viewContainerLocation = that.viewDescriptorService.getViewLocationById(viewDescriptor.id);
                                const localizedTitle = typeof title === 'string' ? title : title.value;
                                const originalTitle = typeof title === 'string' ? title : title.original;
                                if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                                    return { value: (0, nls_1.localize)('show view', "Show {0}", localizedTitle), original: `Show ${originalTitle}` };
                                }
                                else {
                                    return { value: (0, nls_1.localize)('toggle view', "Toggle {0}", localizedTitle), original: `Toggle ${originalTitle}` };
                                }
                            },
                            category: actionCommonCategories_1.Categories.View,
                            precondition: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            keybinding: viewDescriptor.openCommandActionDescriptor.keybindings ? { ...viewDescriptor.openCommandActionDescriptor.keybindings, weight: 200 /* KeybindingWeight.WorkbenchContrib */ } : undefined,
                            f1: true
                        });
                    }
                    async run(serviceAccessor) {
                        const editorGroupService = serviceAccessor.get(editorGroupsService_1.IEditorGroupsService);
                        const viewDescriptorService = serviceAccessor.get(views_1.IViewDescriptorService);
                        const layoutService = serviceAccessor.get(layoutService_1.IWorkbenchLayoutService);
                        const viewsService = serviceAccessor.get(viewsService_1.IViewsService);
                        const contextKeyService = serviceAccessor.get(contextkey_1.IContextKeyService);
                        const focusedViewId = contextkeys_1.FocusedViewContext.getValue(contextKeyService);
                        if (focusedViewId === viewDescriptor.id) {
                            const viewLocation = viewDescriptorService.getViewLocationById(viewDescriptor.id);
                            if (viewDescriptorService.getViewLocationById(viewDescriptor.id) === 0 /* ViewContainerLocation.Sidebar */) {
                                // focus the editor if the view is focused and in the side bar
                                editorGroupService.activeGroup.focus();
                            }
                            else if (viewLocation !== null) {
                                // otherwise hide the part where the view lives if focused
                                layoutService.setPartHidden(true, getPartByLocation(viewLocation));
                            }
                        }
                        else {
                            viewsService.openView(viewDescriptor.id, true);
                        }
                    }
                }));
                if (viewDescriptor.openCommandActionDescriptor.mnemonicTitle) {
                    const defaultViewContainer = this.viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                    if (defaultViewContainer) {
                        const defaultLocation = this.viewDescriptorService.getDefaultViewContainerLocation(defaultViewContainer);
                        disposables.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
                            command: {
                                id: commandId,
                                title: viewDescriptor.openCommandActionDescriptor.mnemonicTitle,
                            },
                            group: defaultLocation === 0 /* ViewContainerLocation.Sidebar */ ? '3_views' : '4_panels',
                            when: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            order: viewDescriptor.openCommandActionDescriptor.order ?? Number.MAX_VALUE
                        }));
                    }
                }
            }
            return disposables;
        }
        registerFocusViewAction(viewDescriptor, category) {
            return (0, actions_1.registerAction2)(class FocusViewAction extends actions_1.Action2 {
                constructor() {
                    const title = (0, nls_1.localize2)({ key: 'focus view', comment: ['{0} indicates the name of the view to be focused.'] }, "Focus on {0} View", viewDescriptor.name.value);
                    super({
                        id: viewDescriptor.focusCommand ? viewDescriptor.focusCommand.id : `${viewDescriptor.id}.focus`,
                        title,
                        category,
                        menu: [{
                                id: actions_1.MenuId.CommandPalette,
                                when: viewDescriptor.when,
                            }],
                        keybinding: {
                            when: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.active`),
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            primary: viewDescriptor.focusCommand?.keybindings?.primary,
                            secondary: viewDescriptor.focusCommand?.keybindings?.secondary,
                            linux: viewDescriptor.focusCommand?.keybindings?.linux,
                            mac: viewDescriptor.focusCommand?.keybindings?.mac,
                            win: viewDescriptor.focusCommand?.keybindings?.win
                        },
                        metadata: {
                            description: title.value,
                            args: [
                                {
                                    name: 'focusOptions',
                                    description: 'Focus Options',
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            'preserveFocus': {
                                                type: 'boolean',
                                                default: false
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    });
                }
                run(accessor, options) {
                    accessor.get(viewsService_1.IViewsService).openView(viewDescriptor.id, !options?.preserveFocus);
                }
            });
        }
        registerResetViewLocationAction(viewDescriptor) {
            return (0, actions_1.registerAction2)(class ResetViewLocationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `${viewDescriptor.id}.resetViewLocation`,
                        title: (0, nls_1.localize2)('resetViewLocation', "Reset Location"),
                        menu: [{
                                id: actions_1.MenuId.ViewTitleContext,
                                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewDescriptor.id), contextkey_1.ContextKeyExpr.equals(`${viewDescriptor.id}.defaultViewLocation`, false))),
                                group: '1_hide',
                                order: 2
                            }],
                    });
                }
                run(accessor) {
                    const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
                    const defaultContainer = viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
                    const containerModel = viewDescriptorService.getViewContainerModel(defaultContainer);
                    // The default container is hidden so we should try to reset its location first
                    if (defaultContainer.hideIfEmpty && containerModel.visibleViewDescriptors.length === 0) {
                        const defaultLocation = viewDescriptorService.getDefaultViewContainerLocation(defaultContainer);
                        viewDescriptorService.moveViewContainerToLocation(defaultContainer, defaultLocation, undefined, this.desc.id);
                    }
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], viewDescriptorService.getDefaultContainerById(viewDescriptor.id), undefined, this.desc.id);
                    accessor.get(viewsService_1.IViewsService).openView(viewDescriptor.id, true);
                }
            });
        }
        registerPaneComposite(viewContainer, viewContainerLocation) {
            const that = this;
            let PaneContainer = class PaneContainer extends panecomposite_1.PaneComposite {
                constructor(telemetryService, contextService, storageService, instantiationService, themeService, contextMenuService, extensionService) {
                    super(viewContainer.id, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
                }
                createViewPaneContainer(element) {
                    const viewPaneContainerDisposables = this._register(new lifecycle_1.DisposableStore());
                    // Use composite's instantiation service to get the editor progress service for any editors instantiated within the composite
                    const viewPaneContainer = that.createViewPaneContainer(element, viewContainer, viewContainerLocation, viewPaneContainerDisposables, this.instantiationService);
                    // Only updateTitleArea for non-filter views: microsoft/vscode-remote-release#3676
                    if (!(viewPaneContainer instanceof viewsViewlet_1.FilterViewPaneContainer)) {
                        viewPaneContainerDisposables.add(event_1.Event.any(viewPaneContainer.onDidAddViews, viewPaneContainer.onDidRemoveViews, viewPaneContainer.onTitleAreaUpdate)(() => {
                            // Update title area since there is no better way to update secondary actions
                            this.updateTitleArea();
                        }));
                    }
                    return viewPaneContainer;
                }
            };
            PaneContainer = __decorate([
                __param(0, telemetry_1.ITelemetryService),
                __param(1, workspace_1.IWorkspaceContextService),
                __param(2, storage_1.IStorageService),
                __param(3, instantiation_1.IInstantiationService),
                __param(4, themeService_1.IThemeService),
                __param(5, contextView_1.IContextMenuService),
                __param(6, extensions_2.IExtensionService)
            ], PaneContainer);
            platform_1.Registry.as(getPaneCompositeExtension(viewContainerLocation)).registerPaneComposite(panecomposite_1.PaneCompositeDescriptor.create(PaneContainer, viewContainer.id, typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.value, (0, types_1.isString)(viewContainer.icon) ? viewContainer.icon : undefined, viewContainer.order, viewContainer.requestedIndex, viewContainer.icon instanceof uri_1.URI ? viewContainer.icon : undefined));
        }
        deregisterPaneComposite(viewContainer, viewContainerLocation) {
            platform_1.Registry.as(getPaneCompositeExtension(viewContainerLocation)).deregisterPaneComposite(viewContainer.id);
        }
        createViewPaneContainer(element, viewContainer, viewContainerLocation, disposables, instantiationService) {
            const viewPaneContainer = instantiationService.createInstance(viewContainer.ctorDescriptor.ctor, ...(viewContainer.ctorDescriptor.staticArguments || []));
            this.viewPaneContainers.set(viewPaneContainer.getId(), viewPaneContainer);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.viewPaneContainers.delete(viewPaneContainer.getId())));
            disposables.add(viewPaneContainer.onDidAddViews(views => this.onViewsAdded(views)));
            disposables.add(viewPaneContainer.onDidChangeViewVisibility(view => this.onViewsVisibilityChanged(view, view.isBodyVisible())));
            disposables.add(viewPaneContainer.onDidRemoveViews(views => this.onViewsRemoved(views)));
            disposables.add(viewPaneContainer.onDidFocusView(view => {
                if (this.focusedViewContextKey.get() !== view.id) {
                    this.focusedViewContextKey.set(view.id);
                    this._onDidChangeFocusedView.fire();
                }
            }));
            disposables.add(viewPaneContainer.onDidBlurView(view => {
                if (this.focusedViewContextKey.get() === view.id) {
                    this.focusedViewContextKey.reset();
                    this._onDidChangeFocusedView.fire();
                }
            }));
            return viewPaneContainer;
        }
    };
    exports.ViewsService = ViewsService;
    exports.ViewsService = ViewsService = __decorate([
        __param(0, views_1.IViewDescriptorService),
        __param(1, panecomposite_2.IPaneCompositePartService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, editorService_1.IEditorService)
    ], ViewsService);
    function getEnabledViewContainerContextKey(viewContainerId) { return `viewContainer.${viewContainerId}.enabled`; }
    function getPaneCompositeExtension(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 2 /* ViewContainerLocation.AuxiliaryBar */:
                return panecomposite_1.Extensions.Auxiliary;
            case 1 /* ViewContainerLocation.Panel */:
                return panecomposite_1.Extensions.Panels;
            case 0 /* ViewContainerLocation.Sidebar */:
            default:
                return panecomposite_1.Extensions.Viewlets;
        }
    }
    function getPartByLocation(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 2 /* ViewContainerLocation.AuxiliaryBar */:
                return "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
            case 1 /* ViewContainerLocation.Panel */:
                return "workbench.parts.panel" /* Parts.PANEL_PART */;
            case 0 /* ViewContainerLocation.Sidebar */:
            default:
                return "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
        }
    }
    (0, extensions_1.registerSingleton)(viewsService_1.IViewsService, ViewsService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdmlld3MvYnJvd3Nlci92aWV3c1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ3FCaEcsOENBVUM7SUF4b0JNLElBQU0sWUFBWSxHQUFsQixNQUFNLFlBQWEsU0FBUSxzQkFBVTtRQW9CM0MsWUFDeUIscUJBQThELEVBQzNELG9CQUFnRSxFQUN2RSxpQkFBc0QsRUFDakQsYUFBdUQsRUFDaEUsYUFBOEM7WUFFOUQsS0FBSyxFQUFFLENBQUM7WUFOaUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUMxQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQTJCO1lBQ3RELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQWxCOUMsK0JBQTBCLEdBQThDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9DLENBQUMsQ0FBQztZQUNoSiw4QkFBeUIsR0FBNEMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQUVuRyx3Q0FBbUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxRSxDQUFDLENBQUM7WUFDL0ksdUNBQWtDLEdBQUcsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLEtBQUssQ0FBQztZQUU1RSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN0RSwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBZXBFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFB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