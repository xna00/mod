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
define(["require", "exports", "vs/nls", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/common/scm", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/css!./media/scm"], function (require, exports, nls_1, telemetry_1, scm_1, instantiation_1, contextView_1, themeService_1, storage_1, configuration_1, layoutService_1, extensions_1, workspace_1, views_1, viewPaneContainer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMViewPaneContainer = void 0;
    let SCMViewPaneContainer = class SCMViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(scmViewService, layoutService, telemetryService, instantiationService, contextMenuService, themeService, storageService, configurationService, extensionService, contextService, viewDescriptorService) {
            super(scm_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.scmViewService = scmViewService;
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('scm-viewlet');
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            return (0, nls_1.localize)('source control', "Source Control");
        }
        getActionsContext() {
            return this.scmViewService.visibleRepositories.length === 1 ? this.scmViewService.visibleRepositories[0].provider : undefined;
        }
    };
    exports.SCMViewPaneContainer = SCMViewPaneContainer;
    exports.SCMViewPaneContainer = SCMViewPaneContainer = __decorate([
        __param(0, scm_1.ISCMViewService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, themeService_1.IThemeService),
        __param(6, storage_1.IStorageService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, extensions_1.IExtensionService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, views_1.IViewDescriptorService)
    ], SCMViewPaneContainer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NtVmlld1BhbmVDb250YWluZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NjbS9icm93c2VyL3NjbVZpZXdQYW5lQ29udGFpbmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxxQ0FBaUI7UUFFMUQsWUFDbUMsY0FBK0IsRUFDeEMsYUFBc0MsRUFDNUMsZ0JBQW1DLEVBQy9CLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDN0MsWUFBMkIsRUFDekIsY0FBK0IsRUFDekIsb0JBQTJDLEVBQy9DLGdCQUFtQyxFQUM1QixjQUF3QyxFQUMxQyxxQkFBNkM7WUFFckUsS0FBSyxDQUFDLGdCQUFVLEVBQUUsRUFBRSxvQ0FBb0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQVp4TixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFhbEUsQ0FBQztRQUVRLE1BQU0sQ0FBQyxNQUFtQjtZQUNsQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JCLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFUSxlQUFlO1lBQ3ZCLE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVRLFFBQVE7WUFDaEIsT0FBTyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFFUSxpQkFBaUI7WUFDekIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDL0gsQ0FBQztLQUVELENBQUE7SUFuQ1ksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFHOUIsV0FBQSxxQkFBZSxDQUFBO1FBQ2YsV0FBQSx1Q0FBdUIsQ0FBQTtRQUN2QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsOEJBQWlCLENBQUE7UUFDakIsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixZQUFBLDhCQUFzQixDQUFBO09BYlosb0JBQW9CLENBbUNoQyJ9