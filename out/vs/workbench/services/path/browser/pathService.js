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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/path/common/pathService", "vs/base/common/uri", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/base/common/resources"], function (require, exports, extensions_1, remoteAgentService_1, pathService_1, uri_1, environmentService_1, workspace_1, arrays_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserPathService = void 0;
    let BrowserPathService = class BrowserPathService extends pathService_1.AbstractPathService {
        constructor(remoteAgentService, environmentService, contextService) {
            super(guessLocalUserHome(environmentService, contextService), remoteAgentService, environmentService, contextService);
        }
    };
    exports.BrowserPathService = BrowserPathService;
    exports.BrowserPathService = BrowserPathService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], BrowserPathService);
    function guessLocalUserHome(environmentService, contextService) {
        // In web we do not really have the concept of a "local" user home
        // but we still require it in many places as a fallback. As such,
        // we have to come up with a synthetic location derived from the
        // environment.
        const workspace = contextService.getWorkspace();
        const firstFolder = (0, arrays_1.firstOrDefault)(workspace.folders);
        if (firstFolder) {
            return firstFolder.uri;
        }
        if (workspace.configuration) {
            return (0, resources_1.dirname)(workspace.configuration);
        }
        // This is not ideal because with a user home location of `/`, all paths
        // will potentially appear with `~/...`, but at this point we really do
        // not have any other good alternative.
        return uri_1.URI.from({
            scheme: pathService_1.AbstractPathService.findDefaultUriScheme(environmentService, contextService),
            authority: environmentService.remoteAuthority,
            path: '/'
        });
    }
    (0, extensions_1.registerSingleton)(pathService_1.IPathService, BrowserPathService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wYXRoL2Jyb3dzZXIvcGF0aFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsaUNBQW1CO1FBRTFELFlBQ3NCLGtCQUF1QyxFQUM5QixrQkFBZ0QsRUFDcEQsY0FBd0M7WUFFbEUsS0FBSyxDQUNKLGtCQUFrQixDQUFDLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxFQUN0RCxrQkFBa0IsRUFDbEIsa0JBQWtCLEVBQ2xCLGNBQWMsQ0FDZCxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUFkWSxnREFBa0I7aUNBQWxCLGtCQUFrQjtRQUc1QixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsaURBQTRCLENBQUE7UUFDNUIsV0FBQSxvQ0FBd0IsQ0FBQTtPQUxkLGtCQUFrQixDQWM5QjtJQUVELFNBQVMsa0JBQWtCLENBQUMsa0JBQWdELEVBQUUsY0FBd0M7UUFFckgsa0VBQWtFO1FBQ2xFLGlFQUFpRTtRQUNqRSxnRUFBZ0U7UUFDaEUsZUFBZTtRQUVmLE1BQU0sU0FBUyxHQUFHLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUVoRCxNQUFNLFdBQVcsR0FBRyxJQUFBLHVCQUFjLEVBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELElBQUksV0FBVyxFQUFFLENBQUM7WUFDakIsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxJQUFJLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUM3QixPQUFPLElBQUEsbUJBQU8sRUFBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVELHdFQUF3RTtRQUN4RSx1RUFBdUU7UUFDdkUsdUNBQXVDO1FBRXZDLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQztZQUNmLE1BQU0sRUFBRSxpQ0FBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsRUFBRSxjQUFjLENBQUM7WUFDcEYsU0FBUyxFQUFFLGtCQUFrQixDQUFDLGVBQWU7WUFDN0MsSUFBSSxFQUFFLEdBQUc7U0FDVCxDQUFDLENBQUM7SUFDSixDQUFDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywwQkFBWSxFQUFFLGtCQUFrQixvQ0FBNEIsQ0FBQyJ9