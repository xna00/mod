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
define(["require", "exports", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/nls", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/banner/browser/bannerService", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/dialogs/common/dialogs", "vs/base/common/codicons", "vs/base/common/severity"], function (require, exports, remoteAgentService_1, environmentService_1, nls_1, platform_1, telemetry_1, remoteHosts_1, bannerService_1, opener_1, host_1, storage_1, productService_1, dialogs_1, codicons_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InitialRemoteConnectionHealthContribution = void 0;
    const REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY = 'remote.unsupportedConnectionChoice';
    const BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY = 'workbench.banner.remote.unsupportedConnection.dismissed';
    let InitialRemoteConnectionHealthContribution = class InitialRemoteConnectionHealthContribution {
        constructor(_remoteAgentService, _environmentService, _telemetryService, bannerService, dialogService, openerService, hostService, storageService, productService) {
            this._remoteAgentService = _remoteAgentService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this.bannerService = bannerService;
            this.dialogService = dialogService;
            this.openerService = openerService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.productService = productService;
            if (this._environmentService.remoteAuthority) {
                this._checkInitialRemoteConnectionHealth();
            }
        }
        async _confirmConnection() {
            let ConnectionChoice;
            (function (ConnectionChoice) {
                ConnectionChoice[ConnectionChoice["Allow"] = 1] = "Allow";
                ConnectionChoice[ConnectionChoice["LearnMore"] = 2] = "LearnMore";
                ConnectionChoice[ConnectionChoice["Cancel"] = 0] = "Cancel";
            })(ConnectionChoice || (ConnectionChoice = {}));
            const { result, checkboxChecked } = await this.dialogService.prompt({
                type: severity_1.default.Warning,
                message: (0, nls_1.localize)('unsupportedGlibcWarning', "You are about to connect to an OS version that is unsupported by {0}.", this.productService.nameLong),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'allow', comment: ['&& denotes a mnemonic'] }, "&&Allow"),
                        run: () => 1 /* ConnectionChoice.Allow */
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                        run: async () => { await this.openerService.open('https://aka.ms/vscode-remote/faq/old-linux'); return 2 /* ConnectionChoice.LearnMore */; }
                    }
                ],
                cancelButton: {
                    run: () => 0 /* ConnectionChoice.Cancel */
                },
                checkbox: {
                    label: (0, nls_1.localize)('remember', "Do not show again"),
                }
            });
            if (result === 2 /* ConnectionChoice.LearnMore */) {
                return await this._confirmConnection();
            }
            const allowed = result === 1 /* ConnectionChoice.Allow */;
            if (allowed && checkboxChecked) {
                this.storageService.store(`${REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY}.${this._environmentService.remoteAuthority}`, allowed, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
            return allowed;
        }
        async _checkInitialRemoteConnectionHealth() {
            try {
                const environment = await this._remoteAgentService.getRawEnvironment();
                if (environment && environment.isUnsupportedGlibc) {
                    let allowed = this.storageService.getBoolean(`${REMOTE_UNSUPPORTED_CONNECTION_CHOICE_KEY}.${this._environmentService.remoteAuthority}`, 0 /* StorageScope.PROFILE */);
                    if (allowed === undefined) {
                        allowed = await this._confirmConnection();
                    }
                    if (allowed) {
                        const bannerDismissedVersion = this.storageService.get(`${BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY}`, 0 /* StorageScope.PROFILE */) ?? '';
                        // Ignore patch versions and dismiss the banner if the major and minor versions match.
                        const shouldShowBanner = bannerDismissedVersion.slice(0, bannerDismissedVersion.lastIndexOf('.')) !== this.productService.version.slice(0, this.productService.version.lastIndexOf('.'));
                        if (shouldShowBanner) {
                            const actions = [
                                {
                                    label: (0, nls_1.localize)('unsupportedGlibcBannerLearnMore', "Learn More"),
                                    href: 'https://aka.ms/vscode-remote/faq/old-linux'
                                }
                            ];
                            this.bannerService.show({
                                id: 'unsupportedGlibcWarning.banner',
                                message: (0, nls_1.localize)('unsupportedGlibcWarning.banner', "You are connected to an OS version that is unsupported by {0}.", this.productService.nameLong),
                                actions,
                                icon: codicons_1.Codicon.warning,
                                closeLabel: `Do not show again in v${this.productService.version}`,
                                onClose: () => {
                                    this.storageService.store(`${BANNER_REMOTE_UNSUPPORTED_CONNECTION_DISMISSED_KEY}`, this.productService.version, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                                }
                            });
                        }
                    }
                    else {
                        this.hostService.openWindow({ forceReuseWindow: true, remoteAuthority: null });
                        return;
                    }
                }
                this._telemetryService.publicLog2('remoteConnectionSuccess', {
                    web: platform_1.isWeb,
                    connectionTimeMs: await this._remoteAgentService.getConnection()?.getInitialConnectionTimeMs(),
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority)
                });
                await this._measureExtHostLatency();
            }
            catch (err) {
                this._telemetryService.publicLog2('remoteConnectionFailure', {
                    web: platform_1.isWeb,
                    connectionTimeMs: await this._remoteAgentService.getConnection()?.getInitialConnectionTimeMs(),
                    remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority),
                    message: err ? err.message : ''
                });
            }
        }
        async _measureExtHostLatency() {
            const measurement = await remoteAgentService_1.remoteConnectionLatencyMeasurer.measure(this._remoteAgentService);
            if (measurement === undefined) {
                return;
            }
            this._telemetryService.publicLog2('remoteConnectionLatency', {
                web: platform_1.isWeb,
                remoteName: (0, remoteHosts_1.getRemoteName)(this._environmentService.remoteAuthority),
                latencyMs: measurement.current
            });
        }
    };
    exports.InitialRemoteConnectionHealthContribution = InitialRemoteConnectionHealthContribution;
    exports.InitialRemoteConnectionHealthContribution = InitialRemoteConnectionHealthContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, bannerService_1.IBannerService),
        __param(4, dialogs_1.IDialogService),
        __param(5, opener_1.IOpenerService),
        __param(6, host_1.IHostService),
        __param(7, storage_1.IStorageService),
        __param(8, productService_1.IProductService)
    ], InitialRemoteConnectionHealthContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlQ29ubmVjdGlvbkhlYWx0aC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvcmVtb3RlQ29ubmVjdGlvbkhlYWx0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLE1BQU0sd0NBQXdDLEdBQUcsb0NBQW9DLENBQUM7SUFDdEYsTUFBTSxrREFBa0QsR0FBRyx5REFBeUQsQ0FBQztJQUU5RyxJQUFNLHlDQUF5QyxHQUEvQyxNQUFNLHlDQUF5QztRQUVyRCxZQUN1QyxtQkFBd0MsRUFDL0IsbUJBQWlELEVBQzVELGlCQUFvQyxFQUN2QyxhQUE2QixFQUM3QixhQUE2QixFQUM3QixhQUE2QixFQUMvQixXQUF5QixFQUN0QixjQUErQixFQUMvQixjQUErQjtZQVIzQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQy9CLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7WUFDNUQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN2QyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDN0Isa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBRWpFLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsbUNBQW1DLEVBQUUsQ0FBQztZQUM1QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxrQkFBa0I7WUFDL0IsSUFBVyxnQkFJVjtZQUpELFdBQVcsZ0JBQWdCO2dCQUMxQix5REFBUyxDQUFBO2dCQUNULGlFQUFhLENBQUE7Z0JBQ2IsMkRBQVUsQ0FBQTtZQUNYLENBQUMsRUFKVSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBSTFCO1lBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFtQjtnQkFDckYsSUFBSSxFQUFFLGtCQUFRLENBQUMsT0FBTztnQkFDdEIsT0FBTyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHVFQUF1RSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO2dCQUNuSixPQUFPLEVBQUU7b0JBQ1I7d0JBQ0MsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDO3dCQUNoRixHQUFHLEVBQUUsR0FBRyxFQUFFLCtCQUF1QjtxQkFDakM7b0JBQ0Q7d0JBQ0MsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsY0FBYyxDQUFDO3dCQUN6RixHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLDRDQUE0QyxDQUFDLENBQUMsQ0FBQywwQ0FBa0MsQ0FBQyxDQUFDO3FCQUNwSTtpQkFDRDtnQkFDRCxZQUFZLEVBQUU7b0JBQ2IsR0FBRyxFQUFFLEdBQUcsRUFBRSxnQ0FBd0I7aUJBQ2xDO2dCQUNELFFBQVEsRUFBRTtvQkFDVCxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsVUFBVSxFQUFFLG1CQUFtQixDQUFDO2lCQUNoRDthQUNELENBQUMsQ0FBQztZQUVILElBQUksTUFBTSx1Q0FBK0IsRUFBRSxDQUFDO2dCQUMzQyxPQUFPLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDeEMsQ0FBQztZQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sbUNBQTJCLENBQUM7WUFDbEQsSUFBSSxPQUFPLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsd0NBQXdDLElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxFQUFFLE9BQU8sOERBQThDLENBQUM7WUFDNUssQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFTyxLQUFLLENBQUMsbUNBQW1DO1lBQ2hELElBQUksQ0FBQztnQkFDSixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUV2RSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDbkQsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyx3Q0FBd0MsSUFBSSxJQUFJLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFFLCtCQUF1QixDQUFDO29CQUM5SixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDM0IsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQzNDLENBQUM7b0JBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDYixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsa0RBQWtELEVBQUUsK0JBQXVCLElBQUksRUFBRSxDQUFDO3dCQUM1SSxzRkFBc0Y7d0JBQ3RGLE1BQU0sZ0JBQWdCLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO3dCQUN6TCxJQUFJLGdCQUFnQixFQUFFLENBQUM7NEJBQ3RCLE1BQU0sT0FBTyxHQUFHO2dDQUNmO29DQUNDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxpQ0FBaUMsRUFBRSxZQUFZLENBQUM7b0NBQ2hFLElBQUksRUFBRSw0Q0FBNEM7aUNBQ2xEOzZCQUNELENBQUM7NEJBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7Z0NBQ3ZCLEVBQUUsRUFBRSxnQ0FBZ0M7Z0NBQ3BDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxnQ0FBZ0MsRUFBRSxnRUFBZ0UsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztnQ0FDbkosT0FBTztnQ0FDUCxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxPQUFPO2dDQUNyQixVQUFVLEVBQUUseUJBQXlCLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFO2dDQUNsRSxPQUFPLEVBQUUsR0FBRyxFQUFFO29DQUNiLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsa0RBQWtELEVBQUUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sOERBQThDLENBQUM7Z0NBQzlKLENBQUM7NkJBQ0QsQ0FBQyxDQUFDO3dCQUNKLENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUMvRSxPQUFPO29CQUNSLENBQUM7Z0JBQ0YsQ0FBQztnQkFjRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFzRSx5QkFBeUIsRUFBRTtvQkFDakksR0FBRyxFQUFFLGdCQUFLO29CQUNWLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsRUFBRSxFQUFFLDBCQUEwQixFQUFFO29CQUM5RixVQUFVLEVBQUUsSUFBQSwyQkFBYSxFQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUM7aUJBQ25FLENBQUMsQ0FBQztnQkFFSCxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRXJDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQWdCZCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFzRSx5QkFBeUIsRUFBRTtvQkFDakksR0FBRyxFQUFFLGdCQUFLO29CQUNWLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsRUFBRSxFQUFFLDBCQUEwQixFQUFFO29CQUM5RixVQUFVLEVBQUUsSUFBQSwyQkFBYSxFQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUM7b0JBQ25FLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7aUJBQy9CLENBQUMsQ0FBQztZQUVKLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLHNCQUFzQjtZQUNuQyxNQUFNLFdBQVcsR0FBRyxNQUFNLG9EQUErQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUM1RixJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztZQUNSLENBQUM7WUFlRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFzRSx5QkFBeUIsRUFBRTtnQkFDakksR0FBRyxFQUFFLGdCQUFLO2dCQUNWLFVBQVUsRUFBRSxJQUFBLDJCQUFhLEVBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQztnQkFDbkUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxPQUFPO2FBQzlCLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBdEtZLDhGQUF5Qzt3REFBekMseUNBQXlDO1FBR25ELFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsd0JBQWMsQ0FBQTtRQUNkLFdBQUEsdUJBQWMsQ0FBQTtRQUNkLFdBQUEsbUJBQVksQ0FBQTtRQUNaLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsZ0NBQWUsQ0FBQTtPQVhMLHlDQUF5QyxDQXNLckQifQ==