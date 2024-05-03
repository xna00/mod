/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/platform/configuration/common/configurations", "vs/platform/policy/common/policy"], function (require, exports, arrays_1, async_1, buffer_1, event_1, json_1, jsonEdit_1, lifecycle_1, objects_1, platform_1, resources_1, configuration_1, configurationModels_1, configurationRegistry_1, configurations_1, policy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationService = void 0;
    class ConfigurationService extends lifecycle_1.Disposable {
        constructor(settingsResource, fileService, policyService, logService) {
            super();
            this.settingsResource = settingsResource;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.defaultConfiguration = this._register(new configurations_1.DefaultConfiguration());
            this.policyConfiguration = policyService instanceof policy_1.NullPolicyService ? new configurations_1.NullPolicyConfiguration() : this._register(new configurations_1.PolicyConfiguration(this.defaultConfiguration, policyService, logService));
            this.userConfiguration = this._register(new configurationModels_1.UserSettings(this.settingsResource, {}, resources_1.extUriBiasedIgnorePathCase, fileService));
            this.configuration = new configurationModels_1.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel());
            this.configurationEditing = new ConfigurationEditing(settingsResource, fileService, this);
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reloadConfiguration(), 50));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(({ defaults, properties }) => this.onDidDefaultConfigurationChange(defaults, properties)));
            this._register(this.policyConfiguration.onDidChangeConfiguration(model => this.onDidPolicyConfigurationChange(model)));
            this._register(this.userConfiguration.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
        }
        async initialize() {
            const [defaultModel, policyModel, userModel] = await Promise.all([this.defaultConfiguration.initialize(), this.policyConfiguration.initialize(), this.userConfiguration.loadConfiguration()]);
            this.configuration = new configurationModels_1.Configuration(defaultModel, policyModel, new configurationModels_1.ConfigurationModel(), userModel);
        }
        getConfigurationData() {
            return this.configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : {};
            return this.configuration.getValue(section, overrides, undefined);
        }
        async updateValue(key, value, arg3, arg4, options) {
            const overrides = (0, configuration_1.isConfigurationUpdateOverrides)(arg3) ? arg3
                : (0, configuration_1.isConfigurationOverrides)(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier ? [arg3.overrideIdentifier] : undefined } : undefined;
            const target = overrides ? arg4 : arg3;
            if (target !== undefined) {
                if (target !== 3 /* ConfigurationTarget.USER_LOCAL */ && target !== 2 /* ConfigurationTarget.USER */) {
                    throw new Error(`Unable to write ${key} to target ${target}.`);
                }
            }
            if (overrides?.overrideIdentifiers) {
                overrides.overrideIdentifiers = (0, arrays_1.distinct)(overrides.overrideIdentifiers);
                overrides.overrideIdentifiers = overrides.overrideIdentifiers.length ? overrides.overrideIdentifiers : undefined;
            }
            const inspect = this.inspect(key, { resource: overrides?.resource, overrideIdentifier: overrides?.overrideIdentifiers ? overrides.overrideIdentifiers[0] : undefined });
            if (inspect.policyValue !== undefined) {
                throw new Error(`Unable to write ${key} because it is configured in system policy.`);
            }
            // Remove the setting, if the value is same as default value
            if ((0, objects_1.equals)(value, inspect.defaultValue)) {
                value = undefined;
            }
            if (overrides?.overrideIdentifiers?.length && overrides.overrideIdentifiers.length > 1) {
                const overrideIdentifiers = overrides.overrideIdentifiers.sort();
                const existingOverrides = this.configuration.localUserConfiguration.overrides.find(override => (0, arrays_1.equals)([...override.identifiers].sort(), overrideIdentifiers));
                if (existingOverrides) {
                    overrides.overrideIdentifiers = existingOverrides.identifiers;
                }
            }
            const path = overrides?.overrideIdentifiers?.length ? [(0, configurationRegistry_1.keyFromOverrideIdentifiers)(overrides.overrideIdentifiers), key] : [key];
            await this.configurationEditing.write(path, value);
            await this.reloadConfiguration();
        }
        inspect(key, overrides = {}) {
            return this.configuration.inspect(key, overrides, undefined);
        }
        keys() {
            return this.configuration.keys(undefined);
        }
        async reloadConfiguration() {
            const configurationModel = await this.userConfiguration.loadConfiguration();
            this.onDidChangeUserConfiguration(configurationModel);
        }
        onDidChangeUserConfiguration(userConfigurationModel) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateLocalUserConfiguration(userConfigurationModel);
            this.trigger(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        onDidDefaultConfigurationChange(defaultConfigurationModel, properties) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdateDefaultConfiguration(defaultConfigurationModel, properties);
            this.trigger(change, previous, 7 /* ConfigurationTarget.DEFAULT */);
        }
        onDidPolicyConfigurationChange(policyConfiguration) {
            const previous = this.configuration.toData();
            const change = this.configuration.compareAndUpdatePolicyConfiguration(policyConfiguration);
            this.trigger(change, previous, 7 /* ConfigurationTarget.DEFAULT */);
        }
        trigger(configurationChange, previous, source) {
            const event = new configurationModels_1.ConfigurationChangeEvent(configurationChange, { data: previous }, this.configuration);
            event.source = source;
            this._onDidChangeConfiguration.fire(event);
        }
    }
    exports.ConfigurationService = ConfigurationService;
    class ConfigurationEditing {
        constructor(settingsResource, fileService, configurationService) {
            this.settingsResource = settingsResource;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.queue = new async_1.Queue();
        }
        write(path, value) {
            return this.queue.queue(() => this.doWriteConfiguration(path, value)); // queue up writes to prevent race conditions
        }
        async doWriteConfiguration(path, value) {
            let content;
            try {
                const fileContent = await this.fileService.readFile(this.settingsResource);
                content = fileContent.value.toString();
            }
            catch (error) {
                if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    content = '{}';
                }
                else {
                    throw error;
                }
            }
            const parseErrors = [];
            (0, json_1.parse)(content, parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            if (parseErrors.length > 0) {
                throw new Error('Unable to write into the settings file. Please open the file to correct errors/warnings in the file and try again.');
            }
            const edits = this.getEdits(content, path, value);
            content = (0, jsonEdit_1.applyEdits)(content, edits);
            await this.fileService.writeFile(this.settingsResource, buffer_1.VSBuffer.fromString(content));
        }
        getEdits(content, path, value) {
            const { tabSize, insertSpaces, eol } = this.formattingOptions;
            // With empty path the entire file is being replaced, so we just use JSON.stringify
            if (!path.length) {
                const content = JSON.stringify(value, null, insertSpaces ? ' '.repeat(tabSize) : '\t');
                return [{
                        content,
                        length: content.length,
                        offset: 0
                    }];
            }
            return (0, jsonEdit_1.setProperty)(content, path, value, { tabSize, insertSpaces, eol });
        }
        get formattingOptions() {
            if (!this._formattingOptions) {
                let eol = platform_1.OS === 3 /* OperatingSystem.Linux */ || platform_1.OS === 2 /* OperatingSystem.Macintosh */ ? '\n' : '\r\n';
                const configuredEol = this.configurationService.getValue('files.eol', { overrideIdentifier: 'jsonc' });
                if (configuredEol && typeof configuredEol === 'string' && configuredEol !== 'auto') {
                    eol = configuredEol;
                }
                this._formattingOptions = {
                    eol,
                    insertSpaces: !!this.configurationService.getValue('editor.insertSpaces', { overrideIdentifier: 'jsonc' }),
                    tabSize: this.configurationService.getValue('editor.tabSize', { overrideIdentifier: 'jsonc' })
                };
            }
            return this._formattingOptions;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2NvbmZpZ3VyYXRpb24vY29tbW9uL2NvbmZpZ3VyYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXNCaEcsTUFBYSxvQkFBcUIsU0FBUSxzQkFBVTtRQWVuRCxZQUNrQixnQkFBcUIsRUFDdEMsV0FBeUIsRUFDekIsYUFBNkIsRUFDN0IsVUFBdUI7WUFFdkIsS0FBSyxFQUFFLENBQUM7WUFMUyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQUs7WUFOdEIsOEJBQXlCLEdBQXVDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZCLENBQUMsQ0FBQztZQUNqSSw2QkFBd0IsR0FBcUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQztZQVcxRyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHFDQUFvQixFQUFFLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsYUFBYSxZQUFZLDBCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLHdDQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxvQ0FBbUIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDdE0sSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQ0FBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsc0NBQTBCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUM5SCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksbUNB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