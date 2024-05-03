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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/base/common/performance"], function (require, exports, instantiation_1, contributions_1, platform_1, platform_2, extensions_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataInitializationService = exports.IUserDataInitializationService = void 0;
    exports.IUserDataInitializationService = (0, instantiation_1.createDecorator)('IUserDataInitializationService');
    class UserDataInitializationService {
        constructor(initializers = []) {
            this.initializers = initializers;
        }
        async whenInitializationFinished() {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.whenInitializationFinished()));
            }
        }
        async requiresInitialization() {
            return (await Promise.all(this.initializers.map(initializer => initializer.requiresInitialization()))).some(result => result);
        }
        async initializeRequiredResources() {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeRequiredResources()));
            }
        }
        async initializeOtherResources(instantiationService) {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeOtherResources(instantiationService)));
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (await this.requiresInitialization()) {
                await Promise.all(this.initializers.map(initializer => initializer.initializeInstalledExtensions(instantiationService)));
            }
        }
    }
    exports.UserDataInitializationService = UserDataInitializationService;
    let InitializeOtherResourcesContribution = class InitializeOtherResourcesContribution {
        constructor(userDataInitializeService, instantiationService, extensionService) {
            extensionService.whenInstalledExtensionsRegistered().then(() => this.initializeOtherResource(userDataInitializeService, instantiationService));
        }
        async initializeOtherResource(userDataInitializeService, instantiationService) {
            if (await userDataInitializeService.requiresInitialization()) {
                (0, performance_1.mark)('code/willInitOtherUserData');
                await userDataInitializeService.initializeOtherResources(instantiationService);
                (0, performance_1.mark)('code/didInitOtherUserData');
            }
        }
    };
    InitializeOtherResourcesContribution = __decorate([
        __param(0, exports.IUserDataInitializationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, extensions_1.IExtensionService)
    ], InitializeOtherResourcesContribution);
    if (platform_2.isWeb) {
        const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(InitializeOtherResourcesContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFJbml0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdXNlckRhdGEvYnJvd3Nlci91c2VyRGF0YUluaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JuRixRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsZ0NBQWdDLENBQUMsQ0FBQztJQUtoSSxNQUFhLDZCQUE2QjtRQUl6QyxZQUE2QixlQUF1QyxFQUFFO1lBQXpDLGlCQUFZLEdBQVosWUFBWSxDQUE2QjtRQUN0RSxDQUFDO1FBRUQsS0FBSyxDQUFDLDBCQUEwQjtZQUMvQixJQUFJLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25HLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQjtZQUMzQixPQUFPLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0gsQ0FBQztRQUVELEtBQUssQ0FBQywyQkFBMkI7WUFDaEMsSUFBSSxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQywyQkFBMkIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxvQkFBMkM7WUFDekUsSUFBSSxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNySCxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBMkM7WUFDOUUsSUFBSSxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyw2QkFBNkIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxSCxDQUFDO1FBQ0YsQ0FBQztLQUVEO0lBbkNELHNFQW1DQztJQUVELElBQU0sb0NBQW9DLEdBQTFDLE1BQU0sb0NBQW9DO1FBQ3pDLFlBQ2lDLHlCQUF5RCxFQUNsRSxvQkFBMkMsRUFDL0MsZ0JBQW1DO1lBRXRELGdCQUFnQixDQUFDLGlDQUFpQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFDaEosQ0FBQztRQUVPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyx5QkFBeUQsRUFBRSxvQkFBMkM7WUFDM0ksSUFBSSxNQUFNLHlCQUF5QixDQUFDLHNCQUFzQixFQUFFLEVBQUUsQ0FBQztnQkFDOUQsSUFBQSxrQkFBSSxFQUFDLDRCQUE0QixDQUFDLENBQUM7Z0JBQ25DLE1BQU0seUJBQXlCLENBQUMsd0JBQXdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDL0UsSUFBQSxrQkFBSSxFQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDbkMsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBaEJLLG9DQUFvQztRQUV2QyxXQUFBLHNDQUE4QixDQUFBO1FBQzlCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw4QkFBaUIsQ0FBQTtPQUpkLG9DQUFvQyxDQWdCekM7SUFFRCxJQUFJLGdCQUFLLEVBQUUsQ0FBQztRQUNYLE1BQU0saUJBQWlCLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDN0YsaUJBQWlCLENBQUMsNkJBQTZCLENBQUMsb0NBQW9DLGtDQUEwQixDQUFDO0lBQ2hILENBQUMifQ==