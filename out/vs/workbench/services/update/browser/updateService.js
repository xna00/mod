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
define(["require", "exports", "vs/base/common/event", "vs/platform/update/common/update", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/lifecycle"], function (require, exports, event_1, update_1, extensions_1, environmentService_1, host_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserUpdateService = void 0;
    let BrowserUpdateService = class BrowserUpdateService extends lifecycle_1.Disposable {
        get state() { return this._state; }
        set state(state) {
            this._state = state;
            this._onStateChange.fire(state);
        }
        constructor(environmentService, hostService) {
            super();
            this.environmentService = environmentService;
            this.hostService = hostService;
            this._onStateChange = this._register(new event_1.Emitter());
            this.onStateChange = this._onStateChange.event;
            this._state = update_1.State.Uninitialized;
            this.checkForUpdates(false);
        }
        async isLatestVersion() {
            const update = await this.doCheckForUpdates(false);
            if (update === undefined) {
                return undefined; // no update provider
            }
            return !!update;
        }
        async checkForUpdates(explicit) {
            await this.doCheckForUpdates(explicit);
        }
        async doCheckForUpdates(explicit) {
            if (this.environmentService.options && this.environmentService.options.updateProvider) {
                const updateProvider = this.environmentService.options.updateProvider;
                // State -> Checking for Updates
                this.state = update_1.State.CheckingForUpdates(explicit);
                const update = await updateProvider.checkForUpdate();
                if (update) {
                    // State -> Downloaded
                    this.state = update_1.State.Ready({ version: update.version, productVersion: update.version });
                }
                else {
                    // State -> Idle
                    this.state = update_1.State.Idle(1 /* UpdateType.Archive */);
                }
                return update;
            }
            return undefined; // no update provider to ask
        }
        async downloadUpdate() {
            // no-op
        }
        async applyUpdate() {
            this.hostService.reload();
        }
        async quitAndInstall() {
            this.hostService.reload();
        }
        async _applySpecificUpdate(packagePath) {
            // noop
        }
    };
    exports.BrowserUpdateService = BrowserUpdateService;
    exports.BrowserUpdateService = BrowserUpdateService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, host_1.IHostService)
    ], BrowserUpdateService);
    (0, extensions_1.registerSingleton)(update_1.IUpdateService, BrowserUpdateService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VwZGF0ZS9icm93c2VyL3VwZGF0ZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBdUJ6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHNCQUFVO1FBUW5ELElBQUksS0FBSyxLQUFZLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxLQUFLLENBQUMsS0FBWTtZQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNwQixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsWUFDc0Msa0JBQXdFLEVBQy9GLFdBQTBDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBSDhDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUM7WUFDOUUsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFaakQsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFTLENBQUMsQ0FBQztZQUNyRCxrQkFBYSxHQUFpQixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUV6RCxXQUFNLEdBQVUsY0FBSyxDQUFDLGFBQWEsQ0FBQztZQWEzQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZTtZQUNwQixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNuRCxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxTQUFTLENBQUMsQ0FBQyxxQkFBcUI7WUFDeEMsQ0FBQztZQUVELE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNqQixDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFpQjtZQUN0QyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQWlCO1lBQ2hELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN2RixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQztnQkFFdEUsZ0NBQWdDO2dCQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLGNBQUssQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFaEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3JELElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osc0JBQXNCO29CQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLGNBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3ZGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxnQkFBZ0I7b0JBQ2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBSyxDQUFDLElBQUksNEJBQW9CLENBQUM7Z0JBQzdDLENBQUM7Z0JBRUQsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUMsQ0FBQyw0QkFBNEI7UUFDL0MsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjO1lBQ25CLFFBQVE7UUFDVCxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVc7WUFDaEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWM7WUFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFdBQW1CO1lBQzdDLE9BQU87UUFDUixDQUFDO0tBQ0QsQ0FBQTtJQXpFWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQWU5QixXQUFBLHdEQUFtQyxDQUFBO1FBQ25DLFdBQUEsbUJBQVksQ0FBQTtPQWhCRixvQkFBb0IsQ0F5RWhDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyx1QkFBYyxFQUFFLG9CQUFvQixrQ0FBMEIsQ0FBQyJ9