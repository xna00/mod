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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, nls, configuration_1, dialogs_1, debug_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugLifecycle = void 0;
    let DebugLifecycle = class DebugLifecycle {
        constructor(lifecycleService, debugService, configurationService, dialogService) {
            this.debugService = debugService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            lifecycleService.onBeforeShutdown(async (e) => e.veto(this.shouldVetoShutdown(e.reason), 'veto.debug'));
        }
        shouldVetoShutdown(_reason) {
            const rootSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === undefined);
            if (rootSessions.length === 0) {
                return false;
            }
            const shouldConfirmOnExit = this.configurationService.getValue('debug').confirmOnExit;
            if (shouldConfirmOnExit === 'never') {
                return false;
            }
            return this.showWindowCloseConfirmation(rootSessions.length);
        }
        async showWindowCloseConfirmation(numSessions) {
            let message;
            if (numSessions === 1) {
                message = nls.localize('debug.debugSessionCloseConfirmationSingular', "There is an active debug session, are you sure you want to stop it?");
            }
            else {
                message = nls.localize('debug.debugSessionCloseConfirmationPlural', "There are active debug sessions, are you sure you want to stop them?");
            }
            const res = await this.dialogService.confirm({
                message,
                type: 'warning',
                primaryButton: nls.localize({ key: 'debug.stop', comment: ['&& denotes a mnemonic'] }, "&&Stop Debugging")
            });
            return !res.confirmed;
        }
    };
    exports.DebugLifecycle = DebugLifecycle;
    exports.DebugLifecycle = DebugLifecycle = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, dialogs_1.IDialogService)
    ], DebugLifecycle);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdMaWZlY3ljbGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z0xpZmVjeWNsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBYztRQUMxQixZQUNvQixnQkFBbUMsRUFDdEIsWUFBMkIsRUFDbkIsb0JBQTJDLEVBQ2xELGFBQTZCO1lBRjlCLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ25CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEQsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBRTlELGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBQyxDQUFDLEVBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ3ZHLENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxPQUF1QjtZQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLEtBQUssU0FBUyxDQUFDLENBQUM7WUFDM0csSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMvQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQXNCLE9BQU8sQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUMzRyxJQUFJLG1CQUFtQixLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVPLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxXQUFtQjtZQUM1RCxJQUFJLE9BQWUsQ0FBQztZQUNwQixJQUFJLFdBQVcsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsNkNBQTZDLEVBQUUscUVBQXFFLENBQUMsQ0FBQztZQUM5SSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsMkNBQTJDLEVBQUUsc0VBQXNFLENBQUMsQ0FBQztZQUM3SSxDQUFDO1lBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztnQkFDNUMsT0FBTztnQkFDUCxJQUFJLEVBQUUsU0FBUztnQkFDZixhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLGtCQUFrQixDQUFDO2FBQzFHLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7S0FDRCxDQUFBO0lBdENZLHdDQUFjOzZCQUFkLGNBQWM7UUFFeEIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsd0JBQWMsQ0FBQTtPQUxKLGNBQWMsQ0FzQzFCIn0=