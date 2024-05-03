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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/banner/browser/bannerService", "vs/platform/storage/common/storage", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/uri", "vs/base/common/themables"], function (require, exports, platform_1, contributions_1, bannerService_1, storage_1, environmentService_1, uri_1, themables_1) {
    "use strict";
    var WelcomeBannerContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let WelcomeBannerContribution = class WelcomeBannerContribution {
        static { WelcomeBannerContribution_1 = this; }
        static { this.WELCOME_BANNER_DISMISSED_KEY = 'workbench.banner.welcome.dismissed'; }
        constructor(bannerService, storageService, environmentService) {
            const welcomeBanner = environmentService.options?.welcomeBanner;
            if (!welcomeBanner) {
                return; // welcome banner is not enabled
            }
            if (storageService.getBoolean(WelcomeBannerContribution_1.WELCOME_BANNER_DISMISSED_KEY, 0 /* StorageScope.PROFILE */, false)) {
                return; // welcome banner dismissed
            }
            let icon = undefined;
            if (typeof welcomeBanner.icon === 'string') {
                icon = themables_1.ThemeIcon.fromId(welcomeBanner.icon);
            }
            else if (welcomeBanner.icon) {
                icon = uri_1.URI.revive(welcomeBanner.icon);
            }
            bannerService.show({
                id: 'welcome.banner',
                message: welcomeBanner.message,
                icon,
                actions: welcomeBanner.actions,
                onClose: () => {
                    storageService.store(WelcomeBannerContribution_1.WELCOME_BANNER_DISMISSED_KEY, true, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                }
            });
        }
    };
    WelcomeBannerContribution = WelcomeBannerContribution_1 = __decorate([
        __param(0, bannerService_1.IBannerService),
        __param(1, storage_1.IStorageService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], WelcomeBannerContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WelcomeBannerContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2VsY29tZUJhbm5lci5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVCYW5uZXIvYnJvd3Nlci93ZWxjb21lQmFubmVyLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXaEcsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7O2lCQUVOLGlDQUE0QixHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztRQUU1RixZQUNpQixhQUE2QixFQUM1QixjQUErQixFQUNYLGtCQUF1RDtZQUU1RixNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO1lBQ2hFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxDQUFDLGdDQUFnQztZQUN6QyxDQUFDO1lBRUQsSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLDJCQUF5QixDQUFDLDRCQUE0QixnQ0FBd0IsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDcEgsT0FBTyxDQUFDLDJCQUEyQjtZQUNwQyxDQUFDO1lBRUQsSUFBSSxJQUFJLEdBQWdDLFNBQVMsQ0FBQztZQUNsRCxJQUFJLE9BQU8sYUFBYSxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDNUMsSUFBSSxHQUFHLHFCQUFTLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxDQUFDO2lCQUFNLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUMvQixJQUFJLEdBQUcsU0FBRyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUVELGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0JBQ2xCLEVBQUUsRUFBRSxnQkFBZ0I7Z0JBQ3BCLE9BQU8sRUFBRSxhQUFhLENBQUMsT0FBTztnQkFDOUIsSUFBSTtnQkFDSixPQUFPLEVBQUUsYUFBYSxDQUFDLE9BQU87Z0JBQzlCLE9BQU8sRUFBRSxHQUFHLEVBQUU7b0JBQ2IsY0FBYyxDQUFDLEtBQUssQ0FBQywyQkFBeUIsQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLDhEQUE4QyxDQUFDO2dCQUNqSSxDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUFsQ0kseUJBQXlCO1FBSzVCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsd0RBQW1DLENBQUE7T0FQaEMseUJBQXlCLENBbUM5QjtJQUVELG1CQUFRLENBQUMsRUFBRSxDQUFrQywwQkFBbUIsQ0FBQyxTQUFTLENBQUM7U0FDekUsNkJBQTZCLENBQUMseUJBQXlCLGtDQUEwQixDQUFDIn0=