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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/composite", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewPane"], function (require, exports, platform_1, composite_1, instantiation_1, actions_1, actions_2, contextView_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, extensions_1, viewPane_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositeRegistry = exports.Extensions = exports.PaneCompositeDescriptor = exports.PaneComposite = void 0;
    let PaneComposite = class PaneComposite extends composite_1.Composite {
        constructor(id, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService) {
            super(id, telemetryService, themeService, storageService);
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.extensionService = extensionService;
            this.contextService = contextService;
        }
        create(parent) {
            super.create(parent);
            this.viewPaneContainer = this._register(this.createViewPaneContainer(parent));
            this._register(this.viewPaneContainer.onTitleAreaUpdate(() => this.updateTitleArea()));
            this.viewPaneContainer.create(parent);
        }
        setVisible(visible) {
            super.setVisible(visible);
            this.viewPaneContainer?.setVisible(visible);
        }
        layout(dimension) {
            this.viewPaneContainer?.layout(dimension);
        }
        setBoundarySashes(sashes) {
            this.viewPaneContainer?.setBoundarySashes(sashes);
        }
        getOptimalWidth() {
            return this.viewPaneContainer?.getOptimalWidth() ?? 0;
        }
        openView(id, focus) {
            return this.viewPaneContainer?.openView(id, focus);
        }
        getViewPaneContainer() {
            return this.viewPaneContainer;
        }
        getActionsContext() {
            return this.getViewPaneContainer()?.getActionsContext();
        }
        getContextMenuActions() {
            return this.viewPaneContainer?.menuActions?.getContextMenuActions() ?? [];
        }
        getMenuIds() {
            const result = [];
            if (this.viewPaneContainer?.menuActions) {
                result.push(this.viewPaneContainer.menuActions.menuId);
                if (this.viewPaneContainer.isViewMergedWithContainer()) {
                    result.push(this.viewPaneContainer.panes[0].menuActions.menuId);
                }
            }
            return result;
        }
        getActions() {
            const result = [];
            if (this.viewPaneContainer?.menuActions) {
                result.push(...this.viewPaneContainer.menuActions.getPrimaryActions());
                if (this.viewPaneContainer.isViewMergedWithContainer()) {
                    const viewPane = this.viewPaneContainer.panes[0];
                    if (viewPane.shouldShowFilterInHeader()) {
                        result.push(viewPane_1.VIEWPANE_FILTER_ACTION);
                    }
                    result.push(...viewPane.menuActions.getPrimaryActions());
                }
            }
            return result;
        }
        getSecondaryActions() {
            if (!this.viewPaneContainer?.menuActions) {
                return [];
            }
            const viewPaneActions = this.viewPaneContainer.isViewMergedWithContainer() ? this.viewPaneContainer.panes[0].menuActions.getSecondaryActions() : [];
            let menuActions = this.viewPaneContainer.menuActions.getSecondaryActions();
            const viewsSubmenuActionIndex = menuActions.findIndex(action => action instanceof actions_2.SubmenuItemAction && action.item.submenu === viewPaneContainer_1.ViewsSubMenu);
            if (viewsSubmenuActionIndex !== -1) {
                const viewsSubmenuAction = menuActions[viewsSubmenuActionIndex];
                if (viewsSubmenuAction.actions.some(({ enabled }) => enabled)) {
                    if (menuActions.length === 1 && viewPaneActions.length === 0) {
                        menuActions = viewsSubmenuAction.actions.slice();
                    }
                    else if (viewsSubmenuActionIndex !== 0) {
                        menuActions = [viewsSubmenuAction, ...menuActions.slice(0, viewsSubmenuActionIndex), ...menuActions.slice(viewsSubmenuActionIndex + 1)];
                    }
                }
                else {
                    // Remove views submenu if none of the actions are enabled
                    menuActions.splice(viewsSubmenuActionIndex, 1);
                }
            }
            if (menuActions.length && viewPaneActions.length) {
                return [
                    ...menuActions,
                    new actions_1.Separator(),
                    ...viewPaneActions
                ];
            }
            return menuActions.length ? menuActions : viewPaneActions;
        }
        getActionViewItem(action, options) {
            return this.viewPaneContainer?.getActionViewItem(action, options);
        }
        getTitle() {
            return this.viewPaneContainer?.getTitle() ?? '';
        }
        focus() {
            super.focus();
            this.viewPaneContainer?.focus();
        }
    };
    exports.PaneComposite = PaneComposite;
    exports.PaneComposite = PaneComposite = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, extensions_1.IExtensionService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], PaneComposite);
    /**
     * A Pane Composite descriptor is a lightweight descriptor of a Pane Composite in the workbench.
     */
    class PaneCompositeDescriptor extends composite_1.CompositeDescriptor {
        static create(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            return new PaneCompositeDescriptor(ctor, id, name, cssClass, order, requestedIndex, iconUrl);
        }
        constructor(ctor, id, name, cssClass, order, requestedIndex, iconUrl) {
            super(ctor, id, name, cssClass, order, requestedIndex);
            this.iconUrl = iconUrl;
        }
    }
    exports.PaneCompositeDescriptor = PaneCompositeDescriptor;
    exports.Extensions = {
        Viewlets: 'workbench.contributions.viewlets',
        Panels: 'workbench.contributions.panels',
        Auxiliary: 'workbench.contributions.auxiliary',
    };
    class PaneCompositeRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a viewlet to the platform.
         */
        registerPaneComposite(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a viewlet to the platform.
         */
        deregisterPaneComposite(id) {
            super.deregisterComposite(id);
        }
        /**
         * Returns the viewlet descriptor for the given id or null if none.
         */
        getPaneComposite(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered viewlets known to the platform.
         */
        getPaneComposites() {
            return this.getComposites();
        }
    }
    exports.PaneCompositeRegistry = PaneCompositeRegistry;
    platform_1.Registry.add(exports.Extensions.Viewlets, new PaneCompositeRegistry());
    platform_1.Registry.add(exports.Extensions.Panels, new PaneCompositeRegistry());
    platform_1.Registry.add(exports.Extensions.Auxiliary, new PaneCompositeRegistry());
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWNvbXBvc2l0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFuZWNvbXBvc2l0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF1QnpGLElBQWUsYUFBYSxHQUE1QixNQUFlLGFBQWMsU0FBUSxxQkFBUztRQUlwRCxZQUNDLEVBQVUsRUFDUyxnQkFBbUMsRUFDM0IsY0FBK0IsRUFDekIsb0JBQTJDLEVBQzdELFlBQTJCLEVBQ1gsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUM1QixjQUF3QztZQUU1RSxLQUFLLENBQUMsRUFBRSxFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztZQVAvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDekIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUU3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1FBRzdFLENBQUM7UUFFUSxNQUFNLENBQUMsTUFBbUI7WUFDbEMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUM5RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7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