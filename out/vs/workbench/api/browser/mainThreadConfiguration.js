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
define(["require", "exports", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspace/common/workspace", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment"], function (require, exports, uri_1, platform_1, configurationRegistry_1, workspace_1, extHost_protocol_1, extHostCustomers_1, configuration_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConfiguration = void 0;
    let MainThreadConfiguration = class MainThreadConfiguration {
        constructor(extHostContext, _workspaceContextService, configurationService, _environmentService) {
            this._workspaceContextService = _workspaceContextService;
            this.configurationService = configurationService;
            this._environmentService = _environmentService;
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostConfiguration);
            proxy.$initializeConfiguration(this._getConfigurationData());
            this._configurationListener = configurationService.onDidChangeConfiguration(e => {
                proxy.$acceptConfigurationChanged(this._getConfigurationData(), e.change);
            });
        }
        _getConfigurationData() {
            const configurationData = { ...(this.configurationService.getConfigurationData()), configurationScopes: [] };
            // Send configurations scopes only in development mode.
            if (!this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment) {
                configurationData.configurationScopes = (0, configurationRegistry_1.getScopes)();
            }
            return configurationData;
        }
        dispose() {
            this._configurationListener.dispose();
        }
        $updateConfigurationOption(target, key, value, overrides, scopeToLanguage) {
            overrides = { resource: overrides?.resource ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides?.overrideIdentifier };
            return this.writeConfiguration(target, key, value, overrides, scopeToLanguage);
        }
        $removeConfigurationOption(target, key, overrides, scopeToLanguage) {
            overrides = { resource: overrides?.resource ? uri_1.URI.revive(overrides.resource) : undefined, overrideIdentifier: overrides?.overrideIdentifier };
            return this.writeConfiguration(target, key, undefined, overrides, scopeToLanguage);
        }
        writeConfiguration(target, key, value, overrides, scopeToLanguage) {
            target = target !== null && target !== undefined ? target : this.deriveConfigurationTarget(key, overrides);
            const configurationValue = this.configurationService.inspect(key, overrides);
            switch (target) {
                case 8 /* ConfigurationTarget.MEMORY */:
                    return this._updateValue(key, value, target, configurationValue?.memory?.override, overrides, scopeToLanguage);
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    return this._updateValue(key, value, target, configurationValue?.workspaceFolder?.override, overrides, scopeToLanguage);
                case 5 /* ConfigurationTarget.WORKSPACE */:
                    return this._updateValue(key, value, target, configurationValue?.workspace?.override, overrides, scopeToLanguage);
                case 4 /* ConfigurationTarget.USER_REMOTE */:
                    return this._updateValue(key, value, target, configurationValue?.userRemote?.override, overrides, scopeToLanguage);
                default:
                    return this._updateValue(key, value, target, configurationValue?.userLocal?.override, overrides, scopeToLanguage);
            }
        }
        _updateValue(key, value, configurationTarget, overriddenValue, overrides, scopeToLanguage) {
            overrides = scopeToLanguage === true ? overrides
                : scopeToLanguage === false ? { resource: overrides.resource }
                    : overrides.overrideIdentifier && overriddenValue !== undefined ? overrides
                        : { resource: overrides.resource };
            return this.configurationService.updateValue(key, value, overrides, configurationTarget, { donotNotifyError: true });
        }
        deriveConfigurationTarget(key, overrides) {
            if (overrides.resource && this._workspaceContextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
                if (configurationProperties[key] && (configurationProperties[key].scope === 4 /* ConfigurationScope.RESOURCE */ || configurationProperties[key].scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */)) {
                    return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            return 5 /* ConfigurationTarget.WORKSPACE */;
        }
    };
    exports.MainThreadConfiguration = MainThreadConfiguration;
    exports.MainThreadConfiguration = MainThreadConfiguration = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadConfiguration),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], MainThreadConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBdUI7UUFJbkMsWUFDQyxjQUErQixFQUNZLHdCQUFrRCxFQUNyRCxvQkFBMkMsRUFDN0MsbUJBQXdDO1lBRm5DLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDckQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBRTlFLE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRTNFLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDL0UsS0FBSyxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxxQkFBcUI7WUFDNUIsTUFBTSxpQkFBaUIsR0FBMkIsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFHLENBQUMsRUFBRSxtQkFBbUIsRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUN0SSx1REFBdUQ7WUFDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIs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