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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/services/environment/browser/environmentService"], function (require, exports, lifecycle_1, opener_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriResolverContribution = void 0;
    let ExternalUriResolverContribution = class ExternalUriResolverContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.externalUriResolver'; }
        constructor(_openerService, _workbenchEnvironmentService) {
            super();
            if (_workbenchEnvironmentService.options?.resolveExternalUri) {
                this._register(_openerService.registerExternalUriResolver({
                    resolveExternalUri: async (resource) => {
                        return {
                            resolved: await _workbenchEnvironmentService.options.resolveExternalUri(resource),
                            dispose: () => {
                                // TODO@mjbvz - do we need to do anything here?
                            }
                        };
                    }
                }));
            }
        }
    };
    exports.ExternalUriResolverContribution = ExternalUriResolverContribution;
    exports.ExternalUriResolverContribution = ExternalUriResolverContribution = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], ExternalUriResolverContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZXJuYWxVcmlSZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXJsL2Jyb3dzZXIvZXh0ZXJuYWxVcmlSZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFPekYsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtpQkFFOUMsT0FBRSxHQUFHLHVDQUF1QyxBQUExQyxDQUEyQztRQUU3RCxZQUNpQixjQUE4QixFQUNULDRCQUFpRTtZQUV0RyxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksNEJBQTRCLENBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDO29CQUN6RCxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEVBQUU7d0JBQ3RDLE9BQU87NEJBQ04sUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUMsT0FBUSxDQUFDLGtCQUFtQixDQUFDLFFBQVEsQ0FBQzs0QkFDbkYsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQ0FDYiwrQ0FBK0M7NEJBQ2hELENBQUM7eUJBQ0QsQ0FBQztvQkFDSCxDQUFDO2lCQUNELENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7O0lBdEJXLDBFQUErQjs4Q0FBL0IsK0JBQStCO1FBS3pDLFdBQUEsdUJBQWMsQ0FBQTtRQUNkLFdBQUEsd0RBQW1DLENBQUE7T0FOekIsK0JBQStCLENBdUIzQyJ9