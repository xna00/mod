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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/path/common/pathService", "vs/platform/workspace/common/workspace"], function (require, exports, extensions_1, remoteAgentService_1, environmentService_1, pathService_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativePathService = void 0;
    let NativePathService = class NativePathService extends pathService_1.AbstractPathService {
        constructor(remoteAgentService, environmentService, contextService) {
            super(environmentService.userHome, remoteAgentService, environmentService, contextService);
        }
    };
    exports.NativePathService = NativePathService;
    exports.NativePathService = NativePathService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, workspace_1.IWorkspaceContextService)
    ], NativePathService);
    (0, extensions_1.registerSingleton)(pathService_1.IPathService, NativePathService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wYXRoL2VsZWN0cm9uLXNhbmRib3gvcGF0aFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBUXpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsaUNBQW1CO1FBRXpELFlBQ3NCLGtCQUF1QyxFQUN4QixrQkFBc0QsRUFDaEUsY0FBd0M7WUFFbEUsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUM1RixDQUFDO0tBQ0QsQ0FBQTtJQVRZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBRzNCLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLG9DQUF3QixDQUFBO09BTGQsaUJBQWlCLENBUzdCO0lBRUQsSUFBQSw4QkFBaUIsRUFBQywwQkFBWSxFQUFFLGlCQUFpQixvQ0FBNEIsQ0FBQyJ9