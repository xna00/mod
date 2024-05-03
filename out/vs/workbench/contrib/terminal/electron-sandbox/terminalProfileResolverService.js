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
define(["require", "exports", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalProfileResolverService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, errors_1, configuration_1, terminal_1, workspace_1, terminal_2, terminalProfileResolverService_1, terminal_3, configurationResolver_1, history_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronTerminalProfileResolverService = void 0;
    let ElectronTerminalProfileResolverService = class ElectronTerminalProfileResolverService extends terminalProfileResolverService_1.BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, workspaceContextService, terminalProfileService, remoteAgentService, terminalInstanceService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, platform) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new errors_1.ErrorNoTelemetry(`Cannot get default system shell when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getDefaultSystemShell(platform);
                },
                getEnvironment: async (remoteAuthority) => {
                    const backend = await terminalInstanceService.getBackend(remoteAuthority);
                    if (!backend) {
                        throw new errors_1.ErrorNoTelemetry(`Cannot get environment when there is no backend for remote authority '${remoteAuthority}'`);
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService);
        }
    };
    exports.ElectronTerminalProfileResolverService = ElectronTerminalProfileResolverService;
    exports.ElectronTerminalProfileResolverService = ElectronTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, terminal_1.ITerminalLogService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, terminal_3.ITerminalProfileService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, terminal_2.ITerminalInstanceService)
    ], ElectronTerminalProfileResolverService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9maWxlUmVzb2x2ZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9lbGVjdHJvbi1zYW5kYm94L3Rlcm1pbmFsUHJvZmlsZVJlc29sdmVyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxzQ0FBc0MsR0FBNUMsTUFBTSxzQ0FBdUMsU0FBUSxtRUFBa0M7UUFFN0YsWUFDZ0MsNEJBQTJELEVBQ25FLG9CQUEyQyxFQUNqRCxjQUErQixFQUMzQixVQUErQixFQUMxQix1QkFBaUQsRUFDbEQsc0JBQStDLEVBQ25ELGtCQUF1QyxFQUNsQyx1QkFBaUQ7WUFFM0UsS0FBSyxDQUNKO2dCQUNDLHFCQUFxQixFQUFFLEtBQUssRUFBRSxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUU7b0JBQzFELE1BQU0sT0FBTyxHQUFHLE1BQU0sdUJBQXVCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUMxRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2QsTUFBTSxJQUFJLHlCQUFnQixDQUFDLGtGQUFrRixlQUFlLEdBQUcsQ0FBQyxDQUFDO29CQUNsSSxDQUFDO29CQUNELE9BQU8sT0FBTyxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELGNBQWMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLEVBQUU7b0JBQ3pDLE1BQU0sT0FBTyxHQUFHLE1BQU0sdUJBQXVCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUMxRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQ2QsTUFBTSxJQUFJLHlCQUFnQixDQUFDLHlFQUF5RSxlQUFlLEdBQUcsQ0FBQyxDQUFDO29CQUN6SCxDQUFDO29CQUNELE9BQU8sT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNqQyxDQUFDO2FBQ0QsRUFDRCxvQkFBb0IsRUFDcEIsNEJBQTRCLEVBQzVCLGNBQWMsRUFDZCxVQUFVLEVBQ1Ysc0JBQXNCLEVBQ3RCLHVCQUF1QixFQUN2QixrQkFBa0IsQ0FDbEIsQ0FBQztRQUNILENBQUM7S0FDRCxDQUFBO0lBdENZLHdGQUFzQztxREFBdEMsc0NBQXNDO1FBR2hELFdBQUEscURBQTZCLENBQUE7UUFDN0IsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDhCQUFtQixDQUFBO1FBQ25CLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxrQ0FBdUIsQ0FBQTtRQUN2QixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsbUNBQXdCLENBQUE7T0FWZCxzQ0FBc0MsQ0FzQ2xEIn0=