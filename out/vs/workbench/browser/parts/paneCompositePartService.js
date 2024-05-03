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
define(["require", "exports", "vs/base/common/event", "vs/base/common/types", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/lifecycle"], function (require, exports, event_1, types_1, extensions_1, instantiation_1, auxiliaryBarPart_1, panelPart_1, sidebarPart_1, views_1, panecomposite_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PaneCompositePartService = void 0;
    let PaneCompositePartService = class PaneCompositePartService extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.paneCompositeParts = new Map();
            const panelPart = instantiationService.createInstance(panelPart_1.PanelPart);
            const sideBarPart = instantiationService.createInstance(sidebarPart_1.SidebarPart);
            const auxiliaryBarPart = instantiationService.createInstance(auxiliaryBarPart_1.AuxiliaryBarPart);
            this.paneCompositeParts.set(1 /* ViewContainerLocation.Panel */, panelPart);
            this.paneCompositeParts.set(0 /* ViewContainerLocation.Sidebar */, sideBarPart);
            this.paneCompositeParts.set(2 /* ViewContainerLocation.AuxiliaryBar */, auxiliaryBarPart);
            const eventDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidPaneCompositeOpen = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeOpen, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
            this.onDidPaneCompositeClose = event_1.Event.any(...views_1.ViewContainerLocations.map(loc => event_1.Event.map(this.paneCompositeParts.get(loc).onDidPaneCompositeClose, composite => { return { composite, viewContainerLocation: loc }; }, eventDisposables)));
        }
        openPaneComposite(id, viewContainerLocation, focus) {
            return this.getPartByLocation(viewContainerLocation).openPaneComposite(id, focus);
        }
        getActivePaneComposite(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getActivePaneComposite();
        }
        getPaneComposite(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposite(id);
        }
        getPaneComposites(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPaneComposites();
        }
        getPinnedPaneCompositeIds(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getPinnedPaneCompositeIds();
        }
        getVisiblePaneCompositeIds(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getVisiblePaneCompositeIds();
        }
        getProgressIndicator(id, viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getProgressIndicator(id);
        }
        hideActivePaneComposite(viewContainerLocation) {
            this.getPartByLocation(viewContainerLocation).hideActivePaneComposite();
        }
        getLastActivePaneCompositeId(viewContainerLocation) {
            return this.getPartByLocation(viewContainerLocation).getLastActivePaneCompositeId();
        }
        getPartByLocation(viewContainerLocation) {
            return (0, types_1.assertIsDefined)(this.paneCompositeParts.get(viewContainerLocation));
        }
    };
    exports.PaneCompositePartService = PaneCompositePartService;
    exports.PaneCompositePartService = PaneCompositePartService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], PaneCompositePartService);
    (0, extensions_1.registerSingleton)(panecomposite_1.IPaneCompositePartService, PaneCompositePartService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZUNvbXBvc2l0ZVBhcnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9wYW5lQ29tcG9zaXRlUGFydFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBU3ZELFlBQ3dCLG9CQUEyQztZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUxRLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUE2QyxDQUFDO1lBTzFGLE1BQU0sU0FBUyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxxQkFBUyxDQUFDLENBQUM7WUFDakUsTUFBTSxXQUFXLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHlCQUFXLENBQUMsQ0FBQztZQUNyRSxNQUFNLGdCQUFnQixHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxtQ0FBZ0IsQ0FBQyxDQUFDO1lBRS9FLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLHNDQUE4QixTQUFTLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyx3Q0FBZ0MsV0FBVyxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsNkNBQXFDLGdCQUFnQixDQUFDLENBQUM7WUFFbEYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLHNCQUFzQixHQUFHLGFBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyw4QkFBc0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDLElB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