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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, nls_1, configuration_1, contextView_1, instantiation_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, views_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingViewPaneContainer = void 0;
    let TestingViewPaneContainer = class TestingViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, instantiationService, contextMenuService, themeService, storageService, configurationService, extensionService, contextService, viewDescriptorService) {
            super("workbench.view.extension.test" /* Testing.ViewletId */, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('testing-view-pane');
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            return (0, nls_1.localize)('testing', "Testing");
        }
    };
    exports.TestingViewPaneContainer = TestingViewPaneContainer;
    exports.TestingViewPaneContainer = TestingViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensions_1.IExtensionService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, views_1.IViewDescriptorService)
    ], TestingViewPaneContainer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGluZ1ZpZXdQYW5lQ29udGFpbmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2Jyb3dzZXIvdGVzdGluZ1ZpZXdQYW5lQ29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxxQ0FBaUI7UUFFOUQsWUFDMEIsYUFBc0MsRUFDNUMsZ0JBQW1DLEVBQy9CLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDN0MsWUFBMkIsRUFDekIsY0FBK0IsRUFDekIsb0JBQTJDLEVBQy9DLGdCQUFtQyxFQUM1QixjQUF3QyxFQUMxQyxxQkFBNkM7WUFFckUsS0FBSywwREFBb0IsRUFBRSxvQ0FBb0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztRQUNsUSxDQUFDO1FBRVEsTUFBTSxDQUFDLE1BQW1CO1lBQ2xDLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRVEsZUFBZTtZQUN2QixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFFUSxRQUFRO1lBQ2hCLE9BQU8sSUFBQSxjQUFRLEVBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7S0FDRCxDQUFBO0lBN0JZLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBR2xDLFdBQUEsdUNBQXVCLENBQUE7UUFDdkIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw0QkFBYSxDQUFBO1FBQ2IsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSw4QkFBc0IsQ0FBQTtPQVpaLHdCQUF3QixDQTZCcEMifQ==