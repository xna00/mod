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
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/workbench/common/views", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, extensions_1, contextView_1, views_1, telemetry_1, themeService_1, instantiation_1, storage_1, workspace_1, viewPaneContainer_1, configuration_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterViewPaneContainer = void 0;
    let FilterViewPaneContainer = class FilterViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(viewletId, onDidChangeFilterValue, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService, viewDescriptorService) {
            super(viewletId, { mergeViewWithContainerWhenSingleView: false }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.constantViewDescriptors = new Map();
            this.allViews = new Map();
            this._register(onDidChangeFilterValue(newFilterValue => {
                this.filterValue = newFilterValue;
                this.onFilterChanged(newFilterValue);
            }));
            this._register(this.viewContainerModel.onDidChangeActiveViewDescriptors(() => {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }));
        }
        updateAllViews(viewDescriptors) {
            viewDescriptors.forEach(descriptor => {
                const filterOnValue = this.getFilterOn(descriptor);
                if (!filterOnValue) {
                    return;
                }
                if (!this.allViews.has(filterOnValue)) {
                    this.allViews.set(filterOnValue, new Map());
                }
                this.allViews.get(filterOnValue).set(descriptor.id, descriptor);
                if (this.filterValue && !this.filterValue.includes(filterOnValue) && this.panes.find(pane => pane.id === descriptor.id)) {
                    this.viewContainerModel.setVisible(descriptor.id, false);
                }
            });
        }
        addConstantViewDescriptors(constantViewDescriptors) {
            constantViewDescriptors.forEach(viewDescriptor => this.constantViewDescriptors.set(viewDescriptor.id, viewDescriptor));
        }
        onFilterChanged(newFilterValue) {
            if (this.allViews.size === 0) {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }
            this.getViewsNotForTarget(newFilterValue).forEach(item => this.viewContainerModel.setVisible(item.id, false));
            this.getViewsForTarget(newFilterValue).forEach(item => this.viewContainerModel.setVisible(item.id, true));
        }
        getViewsForTarget(target) {
            const views = [];
            for (let i = 0; i < target.length; i++) {
                if (this.allViews.has(target[i])) {
                    views.push(...Array.from(this.allViews.get(target[i]).values()));
                }
            }
            return views;
        }
        getViewsNotForTarget(target) {
            const iterable = this.allViews.keys();
            let key = iterable.next();
            let views = [];
            while (!key.done) {
                let isForTarget = false;
                target.forEach(value => {
                    if (key.value === value) {
                        isForTarget = true;
                    }
                });
                if (!isForTarget) {
                    views = views.concat(this.getViewsForTarget([key.value]));
                }
                key = iterable.next();
            }
            return views;
        }
        onDidAddViewDescriptors(added) {
            const panes = super.onDidAddViewDescriptors(added);
            for (let i = 0; i < added.length; i++) {
                if (this.constantViewDescriptors.has(added[i].viewDescriptor.id)) {
                    panes[i].setExpanded(false);
                }
            }
            // Check that allViews is ready
            if (this.allViews.size === 0) {
                this.updateAllViews(this.viewContainerModel.activeViewDescriptors);
            }
            return panes;
        }
        openView(id, focus) {
            const result = super.openView(id, focus);
            if (result) {
                const descriptorMap = Array.from(this.allViews.entries()).find(entry => entry[1].has(id));
                if (descriptorMap && !this.filterValue?.includes(descriptorMap[0])) {
                    this.setFilter(descriptorMap[1].get(id));
                }
            }
            return result;
        }
    };
    exports.FilterViewPaneContainer = FilterViewPaneContainer;
    exports.FilterViewPaneContainer = FilterViewPaneContainer = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, storage_1.IStorageService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, views_1.IViewDescriptorService)
    ], FilterViewPaneContainer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NWaWV3bGV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy92aWV3cy92aWV3c1ZpZXdsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFlLHVCQUF1QixHQUF0QyxNQUFlLHVCQUF3QixTQUFRLHFDQUFpQjtRQUt0RSxZQUNDLFNBQWlCLEVBQ2pCLHNCQUF1QyxFQUNoQixvQkFBMkMsRUFDekMsYUFBc0MsRUFDNUMsZ0JBQW1DLEVBQ3JDLGNBQStCLEVBQ3pCLG9CQUEyQyxFQUNuRCxZQUEyQixFQUNyQixrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQzVCLGNBQXdDLEVBQzFDLHFCQUE2QztZQUdyRSxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsb0NBQW9DLEVBQUUsS0FBSyxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDLENBQUM7WUFuQm5QLDRCQUF1QixHQUFpQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ2xFLGFBQVEsR0FBOEMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQW1CdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsRUFBRTtnQkFDdEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxlQUFlLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdDQUFnQyxDQUFDLEdB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