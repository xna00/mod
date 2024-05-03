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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/welcomeViews/common/viewsWelcomeContribution", "vs/workbench/contrib/welcomeViews/common/viewsWelcomeExtensionPoint", "vs/workbench/services/extensions/common/extensionsRegistry"], function (require, exports, instantiation_1, platform_1, contributions_1, viewsWelcomeContribution_1, viewsWelcomeExtensionPoint_1, extensionsRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const extensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint(viewsWelcomeExtensionPoint_1.viewsWelcomeExtensionPointDescriptor);
    let WorkbenchConfigurationContribution = class WorkbenchConfigurationContribution {
        constructor(instantiationService) {
            instantiationService.createInstance(viewsWelcomeContribution_1.ViewsWelcomeContribution, extensionPoint);
        }
    };
    WorkbenchConfigurationContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WorkbenchConfigurationContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WorkbenchConfigurationContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NXZWxjb21lLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvd2VsY29tZVZpZXdzL2NvbW1vbi92aWV3c1dlbGNvbWUuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBVWhHLE1BQU0sY0FBYyxHQUFHLHVDQUFrQixDQUFDLHNCQUFzQixDQUE2QixpRUFBb0MsQ0FBQyxDQUFDO0lBRW5JLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQWtDO1FBQ3ZDLFlBQ3dCLG9CQUEyQztZQUVsRSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbURBQXdCLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDL0UsQ0FBQztLQUNELENBQUE7SUFOSyxrQ0FBa0M7UUFFckMsV0FBQSxxQ0FBcUIsQ0FBQTtPQUZsQixrQ0FBa0MsQ0FNdkM7SUFFRCxtQkFBUSxDQUFDLEVBQUUsQ0FBa0MsMEJBQW1CLENBQUMsU0FBUyxDQUFDO1NBQ3pFLDZCQUE2QixDQUFDLGtDQUFrQyxrQ0FBMEIsQ0FBQyJ9