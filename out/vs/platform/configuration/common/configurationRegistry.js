/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, types, nls, configuration_1, jsonContributionRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OVERRIDE_PROPERTY_REGEX = exports.OVERRIDE_PROPERTY_PATTERN = exports.configurationDefaultsSchemaId = exports.resourceLanguageSettingsSchemaId = exports.resourceSettings = exports.windowSettings = exports.machineOverridableSettings = exports.machineSettings = exports.applicationSettings = exports.allSettings = exports.ConfigurationScope = exports.Extensions = exports.EditPresentationTypes = void 0;
    exports.overrideIdentifiersFromKey = overrideIdentifiersFromKey;
    exports.keyFromOverrideIdentifiers = keyFromOverrideIdentifiers;
    exports.getDefaultValue = getDefaultValue;
    exports.validateProperty = validateProperty;
    exports.getScopes = getScopes;
    var EditPresentationTypes;
    (function (EditPresentationTypes) {
        EditPresentationTypes["Multiline"] = "multilineText";
        EditPresentationTypes["Singleline"] = "singlelineText";
    })(EditPresentationTypes || (exports.EditPresentationTypes = EditPresentationTypes = {}));
    exports.Extensions = {
        Configuration: 'base.contributions.configuration'
    };
    var ConfigurationScope;
    (function (ConfigurationScope) {
        /**
         * Application specific configuration, which can be configured only in local user settings.
         */
        ConfigurationScope[ConfigurationScope["APPLICATION"] = 1] = "APPLICATION";
        /**
         * Machine specific configuration, which can be configured only in local and remote user settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE"] = 2] = "MACHINE";
        /**
         * Window specific configuration, which can be configured in the user or workspace settings.
         */
        ConfigurationScope[ConfigurationScope["WINDOW"] = 3] = "WINDOW";
        /**
         * Resource specific configuration, which can be configured in the user, workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["RESOURCE"] = 4] = "RESOURCE";
        /**
         * Resource specific configuration that can be configured in language specific settings
         */
        ConfigurationScope[ConfigurationScope["LANGUAGE_OVERRIDABLE"] = 5] = "LANGUAGE_OVERRIDABLE";
        /**
         * Machine specific configuration that can also be configured in workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE_OVERRIDABLE"] = 6] = "MACHINE_OVERRIDABLE";
    })(ConfigurationScope || (exports.ConfigurationScope = ConfigurationScope = {}));
    exports.allSettings = { properties: {}, patternProperties: {} };
    exports.applicationSettings = { properties: {}, patternProperties: {} };
    exports.machineSettings = { properties: {}, patternProperties: {} };
    exports.machineOverridableSettings = { properties: {}, patternProperties: {} };
    exports.windowSettings = { properties: {}, patternProperties: {} };
    exports.resourceSettings = { properties: {}, patternProperties: {} };
    exports.resourceLanguageSettingsSchemaId = 'vscode://schemas/settings/resourceLanguage';
    exports.configurationDefaultsSchemaId = 'vscode://schemas/settings/configurationDefaults';
    const contributionRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ConfigurationRegistry {
        constructor() {
            this.overrideIdentifiers = new Set();
            this._onDidSchemaChange = new event_1.Emitter();
            this.onDidSchemaChange = this._onDidSchemaChange.event;
            this._onDidUpdateConfiguration = new event_1.Emitter();
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this.configurationDefaultsOverrides = new Map();
            this.defaultLanguageConfigurationOverridesNode = {
                id: 'defaultOverrides',
                title: nls.localize('defaultLanguageConfigurationOverrides.title', "Default Language Configuration Overrides"),
                properties: {}
            };
            this.configurationContributors = [this.defaultLanguageConfigurationOverridesNode];
            this.resourceLanguageSettingsSchema = {
                properties: {},
                patternProperties: {},
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            this.configurationProperties = {};
            this.policyConfigurations = new Map();
            this.excludedConfigurationProperties = {};
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this.registerOverridePropertyPatternKey();
        }
        registerConfiguration(configuration, validate = true) {
            this.registerConfigurations([configuration], validate);
        }
        registerConfigurations(configurations, validate = true) {
            const properties = new Set();
            this.doRegisterConfigurations(configurations, validate, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        deregisterConfigurations(configurations) {
            const properties = new Set();
            this.doDeregisterConfigurations(configurations, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        updateConfigurations({ add, remove }) {
            const properties = new Set();
            this.doDeregisterConfigurations(remove, properties);
            this.doRegisterConfigurations(add, false, properties);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        registerDefaultConfigurations(configurationDefaults) {
            const properties = new Set();
            this.doRegisterDefaultConfigurations(configurationDefaults, properties);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        doRegisterDefaultConfigurations(configurationDefaults, bucket) {
            const overrideIdentifiers = [];
            for (const { overrides, source } of configurationDefaults) {
                for (const key in overrides) {
                    bucket.add(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const configurationDefaultOverride = this.configurationDefaultsOverrides.get(key);
                        const valuesSources = configurationDefaultOverride?.valuesSources ?? new Map();
                        if (source) {
                            for (const configuration of Object.keys(overrides[key])) {
                                valuesSources.set(configuration, source);
                            }
                        }
                        const defaultValue = { ...(configurationDefaultOverride?.value || {}), ...overrides[key] };
                        this.configurationDefaultsOverrides.set(key, { source, value: defaultValue, valuesSources });
                        const plainKey = (0, configuration_1.getLanguageTagSettingPlainKey)(key);
                        const property = {
                            type: 'object',
                            default: defaultValue,
                            description: nls.localize('defaultLanguageConfiguration.description', "Configure settings to be overridden for the {0} language.", plainKey),
                            $ref: exports.resourceLanguageSettingsSchemaId,
                            defaultDefaultValue: defaultValue,
                            source: types.isString(source) ? undefined : source,
                            defaultValueSource: source
                        };
                        overrideIdentifiers.push(...overrideIdentifiersFromKey(key));
                        this.configurationProperties[key] = property;
                        this.defaultLanguageConfigurationOverridesNode.properties[key] = property;
                    }
                    else {
                        this.configurationDefaultsOverrides.set(key, { value: overrides[key], source });
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.doRegisterOverrideIdentifiers(overrideIdentifiers);
        }
        deregisterDefaultConfigurations(defaultConfigurations) {
            const properties = new Set();
            this.doDeregisterDefaultConfigurations(defaultConfigurations, properties);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        doDeregisterDefaultConfigurations(defaultConfigurations, bucket) {
            for (const { overrides, source } of defaultConfigurations) {
                for (const key in overrides) {
                    const configurationDefaultsOverride = this.configurationDefaultsOverrides.get(key);
                    const id = types.isString(source) ? source : source?.id;
                    const configurationDefaultsOverrideSourceId = types.isString(configurationDefaultsOverride?.source) ? configurationDefaultsOverride?.source : configurationDefaultsOverride?.source?.id;
                    if (id !== configurationDefaultsOverrideSourceId) {
                        continue;
                    }
                    bucket.add(key);
                    this.configurationDefaultsOverrides.delete(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        delete this.configurationProperties[key];
                        delete this.defaultLanguageConfigurationOverridesNode.properties[key];
                    }
                    else {
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.updateOverridePropertyPatternKey();
        }
        deltaConfiguration(delta) {
            // defaults: remove
            let defaultsOverrides = false;
            const properties = new Set();
            if (delta.removedDefaults) {
                this.doDeregisterDefaultConfigurations(delta.removedDefaults, properties);
                defaultsOverrides = true;
            }
            // defaults: add
            if (delta.addedDefaults) {
                this.doRegisterDefaultConfigurations(delta.addedDefaults, properties);
                defaultsOverrides = true;
            }
            // configurations: remove
            if (delta.removedConfigurations) {
                this.doDeregisterConfigurations(delta.removedConfigurations, properties);
            }
            // configurations: add
            if (delta.addedConfigurations) {
                this.doRegisterConfigurations(delta.addedConfigurations, false, properties);
            }
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides });
        }
        notifyConfigurationSchemaUpdated(...configurations) {
            this._onDidSchemaChange.fire();
        }
        registerOverrideIdentifiers(overrideIdentifiers) {
            this.doRegisterOverrideIdentifiers(overrideIdentifiers);
            this._onDidSchemaChange.fire();
        }
        doRegisterOverrideIdentifiers(overrideIdentifiers) {
            for (const overrideIdentifier of overrideIdentifiers) {
                this.overrideIdentifiers.add(overrideIdentifier);
            }
            this.updateOverridePropertyPatternKey();
        }
        doRegisterConfigurations(configurations, validate, bucket) {
            configurations.forEach(configuration => {
                this.validateAndRegisterProperties(configuration, validate, configuration.extensionInfo, configuration.restrictedProperties, undefined, bucket);
                this.configurationContributors.push(configuration);
                this.registerJSONConfiguration(configuration);
            });
        }
        doDeregisterConfigurations(configurations, bucket) {
            const deregisterConfiguration = (configuration) => {
                if (configuration.properties) {
                    for (const key in configuration.properties) {
                        bucket.add(key);
                        const property = this.configurationProperties[key];
                        if (property?.policy?.name) {
                            this.policyConfigurations.delete(property.policy.name);
                        }
                        delete this.configurationProperties[key];
                        this.removeFromSchema(key, configuration.properties[key]);
                    }
                }
                configuration.allOf?.forEach(node => deregisterConfiguration(node));
            };
            for (const configuration of configurations) {
                deregisterConfiguration(configuration);
                const index = this.configurationContributors.indexOf(configuration);
                if (index !== -1) {
                    this.configurationContributors.splice(index, 1);
                }
            }
        }
        validateAndRegisterProperties(configuration, validate = true, extensionInfo, restrictedProperties, scope = 3 /* ConfigurationScope.WINDOW */, bucket) {
            scope = types.isUndefinedOrNull(configuration.scope) ? scope : configuration.scope;
            const properties = configuration.properties;
            if (properties) {
                for (const key in properties) {
                    const property = properties[key];
                    if (validate && validateProperty(key, property)) {
                        delete properties[key];
                        continue;
                    }
                    property.source = extensionInfo;
                    // update default value
                    property.defaultDefaultValue = properties[key].default;
                    this.updatePropertyDefaultValue(key, property);
                    // update scope
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        property.scope = undefined; // No scope for overridable properties `[${identifier}]`
                    }
                    else {
                        property.scope = types.isUndefinedOrNull(property.scope) ? scope : property.scope;
                        property.restricted = types.isUndefinedOrNull(property.restricted) ? !!restrictedProperties?.includes(key) : property.restricted;
                    }
                    // Add to properties maps
                    // Property is included by default if 'included' is unspecified
                    if (properties[key].hasOwnProperty('included') && !properties[key].included) {
                        this.excludedConfigurationProperties[key] = properties[key];
                        delete properties[key];
                        continue;
                    }
                    else {
                        this.configurationProperties[key] = properties[key];
                        if (properties[key].policy?.name) {
                            this.policyConfigurations.set(properties[key].policy.name, key);
                        }
                    }
                    if (!properties[key].deprecationMessage && properties[key].markdownDeprecationMessage) {
                        // If not set, default deprecationMessage to the markdown source
                        properties[key].deprecationMessage = properties[key].markdownDeprecationMessage;
                    }
                    bucket.add(key);
                }
            }
            const subNodes = configuration.allOf;
            if (subNodes) {
                for (const node of subNodes) {
                    this.validateAndRegisterProperties(node, validate, extensionInfo, restrictedProperties, scope, bucket);
                }
            }
        }
        // TODO: @sandy081 - Remove this method and include required info in getConfigurationProperties
        getConfigurations() {
            return this.configurationContributors;
        }
        getConfigurationProperties() {
            return this.configurationProperties;
        }
        getPolicyConfigurations() {
            return this.policyConfigurations;
        }
        getExcludedConfigurationProperties() {
            return this.excludedConfigurationProperties;
        }
        getConfigurationDefaultsOverrides() {
            return this.configurationDefaultsOverrides;
        }
        registerJSONConfiguration(configuration) {
            const register = (configuration) => {
                const properties = configuration.properties;
                if (properties) {
                    for (const key in properties) {
                        this.updateSchema(key, properties[key]);
                    }
                }
                const subNodes = configuration.allOf;
                subNodes?.forEach(register);
            };
            register(configuration);
        }
        updateSchema(key, property) {
            exports.allSettings.properties[key] = property;
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    exports.applicationSettings.properties[key] = property;
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    exports.machineSettings.properties[key] = property;
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    exports.machineOverridableSettings.properties[key] = property;
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    exports.windowSettings.properties[key] = property;
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                    exports.resourceSettings.properties[key] = property;
                    break;
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    exports.resourceSettings.properties[key] = property;
                    this.resourceLanguageSettingsSchema.properties[key] = property;
                    break;
            }
        }
        removeFromSchema(key, property) {
            delete exports.allSettings.properties[key];
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    delete exports.applicationSettings.properties[key];
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    delete exports.machineSettings.properties[key];
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    delete exports.machineOverridableSettings.properties[key];
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    delete exports.windowSettings.properties[key];
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    delete exports.resourceSettings.properties[key];
                    delete this.resourceLanguageSettingsSchema.properties[key];
                    break;
            }
        }
        updateOverridePropertyPatternKey() {
            for (const overrideIdentifier of this.overrideIdentifiers.values()) {
                const overrideIdentifierProperty = `[${overrideIdentifier}]`;
                const resourceLanguagePropertiesSchema = {
                    type: 'object',
                    description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                    errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                    $ref: exports.resourceLanguageSettingsSchemaId,
                };
                this.updatePropertyDefaultValue(overrideIdentifierProperty, resourceLanguagePropertiesSchema);
                exports.allSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.applicationSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineOverridableSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.windowSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.resourceSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            }
        }
        registerOverridePropertyPatternKey() {
            const resourceLanguagePropertiesSchema = {
                type: 'object',
                description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                $ref: exports.resourceLanguageSettingsSchemaId,
            };
            exports.allSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.applicationSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineOverridableSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.windowSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.resourceSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            this._onDidSchemaChange.fire();
        }
        updatePropertyDefaultValue(key, property) {
            const configurationdefaultOverride = this.configurationDefaultsOverrides.get(key);
            let defaultValue = configurationdefaultOverride?.value;
            let defaultSource = configurationdefaultOverride?.source;
            if (types.isUndefined(defaultValue)) {
                defaultValue = property.defaultDefaultValue;
                defaultSource = undefined;
            }
            if (types.isUndefined(defaultValue)) {
                defaultValue = getDefaultValue(property.type);
            }
            property.default = defaultValue;
            property.defaultValueSource = defaultSource;
        }
    }
    const OVERRIDE_IDENTIFIER_PATTERN = `\\[([^\\]]+)\\]`;
    const OVERRIDE_IDENTIFIER_REGEX = new RegExp(OVERRIDE_IDENTIFIER_PATTERN, 'g');
    exports.OVERRIDE_PROPERTY_PATTERN = `^(${OVERRIDE_IDENTIFIER_PATTERN})+$`;
    exports.OVERRIDE_PROPERTY_REGEX = new RegExp(exports.OVERRIDE_PROPERTY_PATTERN);
    function overrideIdentifiersFromKey(key) {
        const identifiers = [];
        if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
            let matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            while (matches?.length) {
                const identifier = matches[1].trim();
                if (identifier) {
                    identifiers.push(identifier);
                }
                matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            }
        }
        return (0, arrays_1.distinct)(identifiers);
    }
    function keyFromOverrideIdentifiers(overrideIdentifiers) {
        return overrideIdentifiers.reduce((result, overrideIdentifier) => `${result}[${overrideIdentifier}]`, '');
    }
    function getDefaultValue(type) {
        const t = Array.isArray(type) ? type[0] : type;
        switch (t) {
            case 'boolean':
                return false;
            case 'integer':
            case 'number':
                return 0;
            case 'string':
                return '';
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
    const configurationRegistry = new ConfigurationRegistry();
    platform_1.Registry.add(exports.Extensions.Configuration, configurationRegistry);
    function validateProperty(property, schema) {
        if (!property.trim()) {
            return nls.localize('config.property.empty', "Cannot register an empty property");
        }
        if (exports.OVERRIDE_PROPERTY_REGEX.test(property)) {
            return nls.localize('config.property.languageDefault', "Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.", property);
        }
        if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
            return nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", property);
        }
        if (schema.policy?.name && configurationRegistry.getPolicyConfigurations().get(schema.policy?.name) !== undefined) {
            return nls.localize('config.policy.duplicate', "Cannot register '{0}'. The associated policy {1} is already registered with {2}.", property, schema.policy?.name, configurationRegistry.getPolicyConfigurations().get(schema.policy?.name));
        }
        return null;
    }
    function getScopes() {
        const scopes = [];
        const configurationProperties = configurationRegistry.getConfigurationProperties();
        for (const key of Object.keys(configurationProperties)) {
            scopes.push([key, configurationProperties[key].scope]);
        }
        scopes.push(['launch', 4 /* ConfigurationScope.RESOURCE */]);
        scopes.push(['task', 4 /* ConfigurationScope.RESOURCE */]);
        return scopes;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblJlZ2lzdHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb25maWd1cmF0aW9uL2NvbW1vbi9jb25maWd1cmF0aW9uUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa3JCaEcsZ0VBYUM7SUFFRCxnRUFFQztJQUVELDBDQWlCQztJQUtELDRDQWNDO0lBRUQsOEJBU0M7SUF2dUJELElBQVkscUJBR1g7SUFIRCxXQUFZLHFCQUFxQjtRQUNoQyxvREFBMkIsQ0FBQTtRQUMzQixzREFBNkIsQ0FBQTtJQUM5QixDQUFDLEVBSFcscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFHaEM7SUFFWSxRQUFBLFVBQVUsR0FBRztRQUN6QixhQUFhLEVBQUUsa0NBQWtDO0tBQ2pELENBQUM7SUFrR0YsSUFBa0Isa0JBeUJqQjtJQXpCRCxXQUFrQixrQkFBa0I7UUFDbkM7O1dBRUc7UUFDSCx5RUFBZSxDQUFBO1FBQ2Y7O1dBRUc7UUFDSCxpRUFBTyxDQUFBO1FBQ1A7O1dBRUc7UUFDSCwrREFBTSxDQUFBO1FBQ047O1dBRUc7UUFDSCxtRUFBUSxDQUFBO1FBQ1I7O1dBRUc7UUFDSCwyRkFBb0IsQ0FBQTtRQUNwQjs7V0FFRztRQUNILHlGQUFtQixDQUFBO0lBQ3BCLENBQUMsRUF6QmlCLGtCQUFrQixrQ0FBbEIsa0JBQWtCLFFBeUJuQztJQTBHWSxRQUFBLFdBQVcsR0FBd0ksRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQzdMLFFBQUEsbUJBQW1CLEdBQXdJLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsQ0FBQztJQUNyTSxRQUFBLGVBQWUsR0FBd0ksRUFBRSxVQUFVLEVBQUUsRUFB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