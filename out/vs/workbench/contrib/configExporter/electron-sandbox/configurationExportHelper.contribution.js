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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/contrib/configExporter/electron-sandbox/configurationExportHelper"], function (require, exports, contributions_1, platform_1, instantiation_1, environmentService_1, configurationExportHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionPoints = void 0;
    let ExtensionPoints = class ExtensionPoints {
        constructor(instantiationService, environmentService) {
            // Config Exporter
            if (environmentService.args['export-default-configuration']) {
                instantiationService.createInstance(configurationExportHelper_1.DefaultConfigurationExportHelper);
            }
        }
    };
    exports.ExtensionPoints = ExtensionPoints;
    exports.ExtensionPoints = ExtensionPoints = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService)
    ], ExtensionPoints);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExtensionPoints, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkV4cG9ydEhlbHBlci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NvbmZpZ0V4cG9ydGVyL2VsZWN0cm9uLXNhbmRib3gvY29uZmlndXJhdGlvbkV4cG9ydEhlbHBlci5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWU7UUFFM0IsWUFDd0Isb0JBQTJDLEVBQzlCLGtCQUFzRDtZQUUxRixrQkFBa0I7WUFDbEIsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDO2dCQUM3RCxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsNERBQWdDLENBQUMsQ0FBQztZQUN2RSxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUFYWSwwQ0FBZTs4QkFBZixlQUFlO1FBR3pCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx1REFBa0MsQ0FBQTtPQUp4QixlQUFlLENBVzNCO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLGVBQWUsa0NBQTBCLENBQUMifQ==