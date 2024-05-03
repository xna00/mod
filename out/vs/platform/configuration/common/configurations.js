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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/types", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/platform/policy/common/policy", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, lifecycle_1, objects_1, types_1, configurationModels_1, configurationRegistry_1, log_1, policy_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PolicyConfiguration = exports.NullPolicyConfiguration = exports.DefaultConfiguration = void 0;
    class DefaultConfiguration extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configurationModel = new configurationModels_1.ConfigurationModel();
        }
        get configurationModel() {
            return this._configurationModel;
        }
        async initialize() {
            this.resetConfigurationModel();
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidUpdateConfiguration(({ properties, defaultsOverrides }) => this.onDidUpdateConfiguration(Array.from(properties), defaultsOverrides)));
            return this.configurationModel;
        }
        reload() {
            this.resetConfigurationModel();
            return this.configurationModel;
        }
        onDidUpdateConfiguration(properties, defaultsOverrides) {
            this.updateConfigurationModel(properties, platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties());
            this._onDidChangeConfiguration.fire({ defaults: this.configurationModel, properties });
        }
        getConfigurationDefaultOverrides() {
            return {};
        }
        resetConfigurationModel() {
            this._configurationModel = new configurationModels_1.ConfigurationModel();
            const properties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            this.updateConfigurationModel(Object.keys(properties), properties);
        }
        updateConfigurationModel(properties, configurationProperties) {
            const configurationDefaultsOverrides = this.getConfigurationDefaultOverrides();
            for (const key of properties) {
                const defaultOverrideValue = configurationDefaultsOverrides[key];
                const propertySchema = configurationProperties[key];
                if (defaultOverrideValue !== undefined) {
                    this._configurationModel.addValue(key, defaultOverrideValue);
                }
                else if (propertySchema) {
                    this._configurationModel.addValue(key, propertySchema.default);
                }
                else {
                    this._configurationModel.removeValue(key);
                }
            }
        }
    }
    exports.DefaultConfiguration = DefaultConfiguration;
    class NullPolicyConfiguration {
        constructor() {
            this.onDidChangeConfiguration = event_1.Event.None;
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        async initialize() { return this.configurationModel; }
    }
    exports.NullPolicyConfiguration = NullPolicyConfiguration;
    let PolicyConfiguration = class PolicyConfiguration extends lifecycle_1.Disposable {
        get configurationModel() { return this._configurationModel; }
        constructor(defaultConfiguration, policyService, logService) {
            super();
            this.defaultConfiguration = defaultConfiguration;
            this.policyService = policyService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configurationModel = new configurationModels_1.ConfigurationModel();
        }
        async initialize() {
            this.logService.trace('PolicyConfiguration#initialize');
            this.update(await this.updatePolicyDefinitions(this.defaultConfiguration.configurationModel.keys), false);
            this._register(this.policyService.onDidChange(policyNames => this.onDidChangePolicies(policyNames)));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(async ({ properties }) => this.update(await this.updatePolicyDefinitions(properties), true)));
            return this._configurationModel;
        }
        async updatePolicyDefinitions(properties) {
            this.logService.trace('PolicyConfiguration#updatePolicyDefinitions', properties);
            const policyDefinitions = {};
            const keys = [];
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            for (const key of properties) {
                const config = configurationProperties[key];
                if (!config) {
                    // Config is removed. So add it to the list if in case it was registered as policy before
                    keys.push(key);
                    continue;
                }
                if (config.policy) {
                    if (config.type !== 'string' && config.type !== 'number') {
                        this.logService.warn(`Policy ${config.policy.name} has unsupported type ${config.type}`);
                        continue;
                    }
                    keys.push(key);
                    policyDefinitions[config.policy.name] = { type: config.type };
                }
            }
            if (!(0, types_1.isEmptyObject)(policyDefinitions)) {
                await this.policyService.updatePolicyDefinitions(policyDefinitions);
            }
            return keys;
        }
        onDidChangePolicies(policyNames) {
            this.logService.trace('PolicyConfiguration#onDidChangePolicies', policyNames);
            const policyConfigurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getPolicyConfigurations();
            const keys = (0, arrays_1.coalesce)(policyNames.map(policyName => policyConfigurations.get(policyName)));
            this.update(keys, true);
        }
        update(keys, trigger) {
            this.logService.trace('PolicyConfiguration#update', keys);
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const changed = [];
            const wasEmpty = this._configurationModel.isEmpty();
            for (const key of keys) {
                const policyName = configurationProperties[key]?.policy?.name;
                if (policyName) {
                    const policyValue = this.policyService.getPolicyValue(policyName);
                    if (wasEmpty ? policyValue !== undefined : !(0, objects_1.equals)(this._configurationModel.getValue(key), policyValue)) {
                        changed.push([key, policyValue]);
                    }
                }
                else {
                    if (this._configurationModel.getValue(key) !== undefined) {
                        changed.push([key, undefined]);
                    }
                }
            }
            if (changed.length) {
                this.logService.trace('PolicyConfiguration#changed', changed);
                const old = this._configurationModel;
                this._configurationModel = new configurationModels_1.ConfigurationModel();
                for (const key of old.keys) {
                    this._configurationModel.setValue(key, old.getValue(key));
                }
                for (const [key, policyValue] of changed) {
                    if (policyValue === undefined) {
                        this._configurationModel.removeValue(key);
                    }
                    else {
                        this._configurationModel.setValue(key, policyValue);
                    }
                }
                if (trigger) {
                    this._onDidChangeConfiguration.fire(this._configurationModel);
                }
            }
        }
    };
    exports.PolicyConfiguration = PolicyConfiguration;
    exports.PolicyConfiguration = PolicyConfiguration = __decorate([
        __param(1, policy_1.IPolicyService),
        __param(2, log_1.ILogService)
    ], PolicyConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbmZpZ3VyYXRpb24vY29tbW9uL2NvbmZpZ3VyYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxNQUFhLG9CQUFxQixTQUFRLHNCQUFVO1FBQXBEOztZQUVrQiw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEwRCxDQUFDLENBQUM7WUFDMUgsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQUVqRSx3QkFBbUIsR0FBRyxJQUFJLHdDQUFrQixFQUFFLENBQUM7UUE4Q3hELENBQUM7UUE3Q0EsSUFBSSxrQkFBa0I7WUFDckIsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hOLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxNQUFNO1lBQ0wsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7WUFDL0IsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUVTLHdCQUF3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