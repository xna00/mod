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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/logs/common/logsDataCleaner"], function (require, exports, platform_1, actionCommonCategories_1, actions_1, logsActions_1, contributions_1, lifecycle_1, instantiation_1, logsDataCleaner_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebLogOutputChannels = class WebLogOutputChannels extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.registerWebContributions();
        }
        registerWebContributions() {
            this.instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: logsActions_1.OpenWindowSessionLogFileAction.ID,
                        title: logsActions_1.OpenWindowSessionLogFileAction.TITLE,
                        category: actionCommonCategories_1.Categories.Developer,
                        f1: true
                    });
                }
                run(servicesAccessor) {
                    return servicesAccessor.get(instantiation_1.IInstantiationService).createInstance(logsActions_1.OpenWindowSessionLogFileAction, logsActions_1.OpenWindowSessionLogFileAction.ID, logsActions_1.OpenWindowSessionLogFileAction.TITLE.value).run();
                }
            }));
        }
    };
    WebLogOutputChannels = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebLogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WebLogOutputChannels, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9ncy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xvZ3MvYnJvd3Nlci9sb2dzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVloRyxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBRTVDLFlBQ3lDLG9CQUEyQztZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUZnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBR25GLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBQ2pDLENBQUM7UUFFTyx3QkFBd0I7WUFDL0IsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQ0FBZSxDQUFDLENBQUM7WUFFMUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLDRDQUE4QixDQUFDLEVBQUU7d0JBQ3JDLEtBQUssRUFBRSw0Q0FBOEIsQ0FBQyxLQUFLO3dCQUMzQyxRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO3dCQUM5QixFQUFFLEVBQUUsSUFBSTtxQkFDUixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxHQUFHLENBQUMsZ0JBQWtDO29CQUNyQyxPQUFPLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxxQ0FBcUIsQ0FBQyxDQUFDLGNBQWMsQ0FBQyw0Q0FBOEIsRUFBRSw0Q0FBOEIsQ0FBQyxFQUFFLEVBQUUsNENBQThCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN4TCxDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFFTCxDQUFDO0tBRUQsQ0FBQTtJQTVCSyxvQkFBb0I7UUFHdkIsV0FBQSxxQ0FBcUIsQ0FBQTtPQUhsQixvQkFBb0IsQ0E0QnpCO0lBRUQsbUJBQVEsQ0FBQyxFQUFFLENBQWtDLDBCQUFtQixDQUFDLFNBQVMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLG9CQUFvQixrQ0FBMEIsQ0FBQyJ9