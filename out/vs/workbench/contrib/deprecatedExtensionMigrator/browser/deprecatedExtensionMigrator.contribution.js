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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/common/contributions", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, actions_1, errors_1, types_1, nls_1, configuration_1, notification_1, opener_1, platform_1, storage_1, contributions_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DeprecatedExtensionMigratorContribution = class DeprecatedExtensionMigratorContribution {
        constructor(configurationService, extensionsWorkbenchService, storageService, notificationService, openerService) {
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.storageKey = 'deprecatedExtensionMigrator.state';
            this.init().catch(errors_1.onUnexpectedError);
        }
        async init() {
            const bracketPairColorizerId = 'coenraads.bracket-pair-colorizer';
            await this.extensionsWorkbenchService.queryLocal();
            const extension = this.extensionsWorkbenchService.installed.find(e => e.identifier.id === bracketPairColorizerId);
            if (!extension ||
                ((extension.enablementState !== 8 /* EnablementState.EnabledGlobally */) &&
                    (extension.enablementState !== 9 /* EnablementState.EnabledWorkspace */))) {
                return;
            }
            const state = await this.getState();
            const disablementLogEntry = state.disablementLog.some(d => d.extensionId === bracketPairColorizerId);
            if (disablementLogEntry) {
                return;
            }
            state.disablementLog.push({ extensionId: bracketPairColorizerId, disablementDateTime: new Date().getTime() });
            await this.setState(state);
            await this.extensionsWorkbenchService.setEnablement(extension, 6 /* EnablementState.DisabledGlobally */);
            const nativeBracketPairColorizationEnabledKey = 'editor.bracketPairColorization.enabled';
            const bracketPairColorizationEnabled = !!this.configurationService.inspect(nativeBracketPairColorizationEnabledKey).user;
            this.notificationService.notify({
                message: (0, nls_1.localize)('bracketPairColorizer.notification', "The extension 'Bracket pair Colorizer' got disabled because it was deprecated."),
                severity: notification_1.Severity.Info,
                actions: {
                    primary: [
                        new actions_1.Action('', (0, nls_1.localize)('bracketPairColorizer.notification.action.uninstall', "Uninstall Extension"), undefined, undefined, () => {
                            this.extensionsWorkbenchService.uninstall(extension);
                        }),
                    ],
                    secondary: [
                        !bracketPairColorizationEnabled ? new actions_1.Action('', (0, nls_1.localize)('bracketPairColorizer.notification.action.enableNative', "Enable Native Bracket Pair Colorization"), undefined, undefined, () => {
                            this.configurationService.updateValue(nativeBracketPairColorizationEnabledKey, true, 2 /* ConfigurationTarget.USER */);
                        }) : undefined,
                        new actions_1.Action('', (0, nls_1.localize)('bracketPairColorizer.notification.action.showMoreInfo', "More Info"), undefined, undefined, () => {
                            this.openerService.open('https://github.com/microsoft/vscode/issues/155179');
                        }),
                    ].filter(types_1.isDefined),
                }
            });
        }
        async getState() {
            const jsonStr = await this.storageService.get(this.storageKey, -1 /* StorageScope.APPLICATION */, '');
            if (jsonStr === '') {
                return { disablementLog: [] };
            }
            return JSON.parse(jsonStr);
        }
        async setState(state) {
            const json = JSON.stringify(state);
            await this.storageService.store(this.storageKey, json, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
    };
    DeprecatedExtensionMigratorContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionsWorkbenchService),
        __param(2, storage_1.IStorageService),
        __param(3, notification_1.INotificationService),
        __param(4, opener_1.IOpenerService)
    ], DeprecatedExtensionMigratorContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DeprecatedExtensionMigratorContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwcmVjYXRlZEV4dGVuc2lvbk1pZ3JhdG9yLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVwcmVjYXRlZEV4dGVuc2lvbk1pZ3JhdG9yL2Jyb3dzZXIvZGVwcmVjYXRlZEV4dGVuc2lvbk1pZ3JhdG9yLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQWdCaEcsSUFBTSx1Q0FBdUMsR0FBN0MsTUFBTSx1Q0FBdUM7UUFDNUMsWUFDd0Isb0JBQTRELEVBQ3RELDBCQUF3RSxFQUNwRixjQUFnRCxFQUMzQyxtQkFBMEQsRUFDaEUsYUFBOEM7WUFKdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNyQywrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQ25FLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUMxQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQXNEOUMsZUFBVSxHQUFHLG1DQUFtQyxDQUFDO1lBcERqRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLDBCQUFpQixDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxJQUFJO1lBQ2pCLE1BQU0sc0JBQXNCLEdBQUcsa0NBQWtDLENBQUM7WUFFbEUsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbkQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ2xILElB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