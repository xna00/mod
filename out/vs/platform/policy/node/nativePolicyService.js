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
define(["require", "exports", "vs/platform/policy/common/policy", "vs/base/common/async", "vs/base/common/lifecycle", "vs/platform/log/common/log"], function (require, exports, policy_1, async_1, lifecycle_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativePolicyService = void 0;
    let NativePolicyService = class NativePolicyService extends policy_1.AbstractPolicyService {
        constructor(logService, productName) {
            super();
            this.logService = logService;
            this.productName = productName;
            this.throttler = new async_1.Throttler();
            this.watcher = this._register(new lifecycle_1.MutableDisposable());
        }
        async _updatePolicyDefinitions(policyDefinitions) {
            this.logService.trace(`NativePolicyService#_updatePolicyDefinitions - Found ${Object.keys(policyDefinitions).length} policy definitions`);
            const { createWatcher } = await new Promise((resolve_1, reject_1) => { require(['@vscode/policy-watcher'], resolve_1, reject_1); });
            await this.throttler.queue(() => new Promise((c, e) => {
                try {
                    this.watcher.value = createWatcher(this.productName, policyDefinitions, update => {
                        this._onDidPolicyChange(update);
                        c();
                    });
                }
                catch (err) {
                    this.logService.error(`NativePolicyService#_updatePolicyDefinitions - Error creating watcher:`, err);
                    e(err);
                }
            }));
        }
        _onDidPolicyChange(update) {
            this.logService.trace(`NativePolicyService#_onDidPolicyChange - Updated policy values: ${JSON.stringify(update)}`);
            for (const key in update) {
                const value = update[key];
                if (value === undefined) {
                    this.policies.delete(key);
                }
                else {
                    this.policies.set(key, value);
                }
            }
            this._onDidChange.fire(Object.keys(update));
        }
    };
    exports.NativePolicyService = NativePolicyService;
    exports.NativePolicyService = NativePolicyService = __decorate([
        __param(0, log_1.ILogService)
    ], NativePolicyService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlUG9saWN5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcG9saWN5L25vZGUvbmF0aXZlUG9saWN5U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTekYsSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSw4QkFBcUI7UUFLN0QsWUFDYyxVQUF3QyxFQUNwQyxXQUFtQjtZQUVwQyxLQUFLLEVBQUUsQ0FBQztZQUhzQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BDLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBTDdCLGNBQVMsR0FBRyxJQUFJLGlCQUFTLEVBQUUsQ0FBQztZQUM1QixZQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFXLENBQUMsQ0FBQztRQU9uRSxDQUFDO1FBRVMsS0FBSyxDQUFDLHdCQUF3QixDQUFDLGlCQUFzRDtZQUM5RixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3REFBd0QsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE1BQU0scUJBQXFCLENBQUMsQ0FBQztZQUUxSSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsc0RBQWEsd0JBQXdCLDJCQUFDLENBQUM7WUFFakUsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLE9BQU8sQ0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDM0QsSUFBSSxDQUFDO29CQUNKLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxFQUFFO3dCQUNoRixJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ2hDLENBQUMsRUFBRSxDQUFDO29CQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyx3RUFBd0UsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDckcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNSLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVPLGtCQUFrQixDQUFDLE1BQXlEO1lBQ25GLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG1FQUFtRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVuSCxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFRLENBQUM7Z0JBRWpDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNELENBQUE7SUE3Q1ksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFNN0IsV0FBQSxpQkFBVyxDQUFBO09BTkQsbUJBQW1CLENBNkMvQiJ9