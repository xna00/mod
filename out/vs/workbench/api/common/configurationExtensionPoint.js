/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/services/configuration/common/configuration", "vs/base/common/types", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/lifecycle", "vs/platform/instantiation/common/descriptors", "vs/base/common/htmlContent"], function (require, exports, nls, objects, platform_1, extensionsRegistry_1, configurationRegistry_1, jsonContributionRegistry_1, configuration_1, types_1, extensions_1, extensionFeatures_1, lifecycle_1, descriptors_1, htmlContent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const configurationEntrySchema = {
        type: 'object',
        defaultSnippets: [{ body: { title: '', properties: {} } }],
        properties: {
            title: {
                description: nls.localize('vscode.extension.contributes.configuration.title', 'A title for the current category of settings. This label will be rendered in the Settings editor as a subheading. If the title is the same as the extension display name, then the category will be grouped under the main extension heading.'),
                type: 'string'
            },
            order: {
                description: nls.localize('vscode.extension.contributes.configuration.order', 'When specified, gives the order of this category of settings relative to other categories.'),
                type: 'integer'
            },
            properties: {
                description: nls.localize('vscode.extension.contributes.configuration.properties', 'Description of the configuration properties.'),
                type: 'object',
                propertyNames: {
                    pattern: '\\S+',
                    patternErrorMessage: nls.localize('vscode.extension.contributes.configuration.property.empty', 'Property should not be empty.'),
                },
                additionalProperties: {
                    anyOf: [
                        {
                            title: nls.localize('vscode.extension.contributes.configuration.properties.schema', 'Schema of the configuration property.'),
                            $ref: 'http://json-schema.org/draft-07/schema#'
                        },
                        {
                            type: 'object',
                            properties: {
                                scope: {
                                    type: 'string',
                                    enum: ['application', 'machine', 'window', 'resource', 'language-overridable', 'machine-overridable'],
                                    default: 'window',
                                    enumDescriptions: [
                                        nls.localize('scope.application.description', "Configuration that can be configured only in the user settings."),
                                        nls.localize('scope.machine.description', "Configuration that can be configured only in the user settings or only in the remote settings."),
                                        nls.localize('scope.window.description', "Configuration that can be configured in the user, remote or workspace settings."),
                                        nls.localize('scope.resource.description', "Configuration that can be configured in the user, remote, workspace or folder settings."),
                                        nls.localize('scope.language-overridable.description', "Resource configuration that can be configured in language specific settings."),
                                        nls.localize('scope.machine-overridable.description', "Machine configuration that can be configured also in workspace or folder settings.")
                                    ],
                                    markdownDescription: nls.localize('scope.description', "Scope in which the configuration is applicable. Available scopes are `application`, `machine`, `window`, `resource`, and `machine-overridable`.")
                                },
                                enumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.enumDescriptions', 'Descriptions for enum values')
                                },
                                markdownEnumDescriptions: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: nls.localize('scope.markdownEnumDescriptions', 'Descriptions for enum values in the markdown format.')
                                },
                                enumItemLabels: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    markdownDescription: nls.localize('scope.enumItemLabels', 'Labels for enum values to be displayed in the Settings editor. When specified, the {0} values still show after the labels, but less prominently.', '`enum`')
                                },
                                markdownDescription: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDescription', 'The description in the markdown format.')
                                },
                                deprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.deprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation.')
                                },
                                markdownDeprecationMessage: {
                                    type: 'string',
                                    description: nls.localize('scope.markdownDeprecationMessage', 'If set, the property is marked as deprecated and the given message is shown as an explanation in the markdown format.')
                                },
                                editPresentation: {
                                    type: 'string',
                                    enum: ['singlelineText', 'multilineText'],
                                    enumDescriptions: [
                                        nls.localize('scope.singlelineText.description', 'The value will be shown in an inputbox.'),
                                        nls.localize('scope.multilineText.description', 'The value will be shown in a textarea.')
                                    ],
                                    default: 'singlelineText',
                                    description: nls.localize('scope.editPresentation', 'When specified, controls the presentation format of the string setting.')
                                },
                                order: {
                                    type: 'integer',
                                    description: nls.localize('scope.order', 'When specified, gives the order of this setting relative to other settings within the same category. Settings with an order property will be placed before settings without this property set.')
                                },
                                ignoreSync: {
                                    type: 'boolean',
                                    description: nls.localize('scope.ignoreSync', 'When enabled, Settings Sync will not sync the user value of this configuration by default.')
                                },
                            }
                        }
                    ]
                }
            }
        }
    };
    // build up a delta across two ext points and only apply it once
    let _configDelta;
    // BEGIN VSCode extension point `configurationDefaults`
    const defaultConfigurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configurationDefaults',
        jsonSchema: {
            $ref: configurationRegistry_1.configurationDefaultsSchemaId,
        }
    });
    defaultConfigurationExtPoint.setHandler((extensions, { added, removed }) => {
        if (_configDelta) {
            // HIGHLY unlikely, but just in case
            configurationRegistry.deltaConfiguration(_configDelta);
        }
        const configNow = _configDelta = {};
        // schedule a HIGHLY unlikely task in case only the default configurations EXT point changes
        queueMicrotask(() => {
            if (_configDelta === configNow) {
                configurationRegistry.deltaConfiguration(_configDelta);
                _configDelta = undefined;
            }
        });
        if (removed.length) {
            const removedDefaultConfigurations = removed.map(extension => ({ overrides: objects.deepClone(extension.value), source: { id: extension.description.identifier.value, displayName: extension.description.displayName } }));
            _configDelta.removedDefaults = removedDefaultConfigurations;
        }
        if (added.length) {
            const registeredProperties = configurationRegistry.getConfigurationProperties();
            const allowedScopes = [6 /* ConfigurationScope.MACHINE_OVERRIDABLE */, 3 /* ConfigurationScope.WINDOW */, 4 /* ConfigurationScope.RESOURCE */, 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */];
            const addedDefaultConfigurations = added.map(extension => {
                const overrides = objects.deepClone(extension.value);
                for (const key of Object.keys(overrides)) {
                    if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const registeredPropertyScheme = registeredProperties[key];
                        if (registeredPropertyScheme?.scope && !allowedScopes.includes(registeredPropertyScheme.scope)) {
                            extension.collector.warn(nls.localize('config.property.defaultConfiguration.warning', "Cannot register configuration defaults for '{0}'. Only defaults for machine-overridable, window, resource and language overridable scoped settings are supported.", key));
                            delete overrides[key];
                        }
                    }
                }
                return { overrides, source: { id: extension.description.identifier.value, displayName: extension.description.displayName } };
            });
            _configDelta.addedDefaults = addedDefaultConfigurations;
        }
    });
    // END VSCode extension point `configurationDefaults`
    // BEGIN VSCode extension point `configuration`
    const configurationExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'configuration',
        deps: [defaultConfigurationExtPoint],
        jsonSchema: {
            description: nls.localize('vscode.extension.contributes.configuration', 'Contributes configuration settings.'),
            oneOf: [
                configurationEntrySchema,
                {
                    type: 'array',
                    items: configurationEntrySchema
                }
            ]
        }
    });
    const extensionConfigurations = new extensions_1.ExtensionIdentifierMap();
    configurationExtPoint.setHandler((extensions, { added, removed }) => {
        // HIGHLY unlikely (only configuration but not defaultConfiguration EXT point changes)
        _configDelta ??= {};
        if (removed.length) {
            const removedConfigurations = [];
            for (const extension of removed) {
                removedConfigurations.push(...(extensionConfigurations.get(extension.description.identifier) || []));
                extensionConfigurations.delete(extension.description.identifier);
            }
            _configDelta.removedConfigurations = removedConfigurations;
        }
        const seenProperties = new Set();
        function handleConfiguration(node, extension) {
            const configurations = [];
            const configuration = objects.deepClone(node);
            if (configuration.title && (typeof configuration.title !== 'string')) {
                extension.collector.error(nls.localize('invalid.title', "'configuration.title' must be a string"));
            }
            validateProperties(configuration, extension);
            configuration.id = node.id || extension.description.identifier.value;
            configuration.extensionInfo = { id: extension.description.identifier.value, displayName: extension.description.displayName };
            configuration.restrictedProperties = extension.description.capabilities?.untrustedWorkspaces?.supported === 'limited' ? extension.description.capabilities?.untrustedWorkspaces.restrictedConfigurations : undefined;
            configuration.title = configuration.title || extension.description.displayName || extension.description.identifier.value;
            configurations.push(configuration);
            return configurations;
        }
        function validateProperties(configuration, extension) {
            const properties = configuration.properties;
            if (properties) {
                if (typeof properties !== 'object') {
                    extension.collector.error(nls.localize('invalid.properties', "'configuration.properties' must be an object"));
                    configuration.properties = {};
                }
                for (const key in properties) {
                    const propertyConfiguration = properties[key];
                    const message = (0, configurationRegistry_1.validateProperty)(key, propertyConfiguration);
                    if (message) {
                        delete properties[key];
                        extension.collector.warn(message);
                        continue;
                    }
                    if (seenProperties.has(key)) {
                        delete properties[key];
                        extension.collector.warn(nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", key));
                        continue;
                    }
                    if (!(0, types_1.isObject)(propertyConfiguration)) {
                        delete properties[key];
                        extension.collector.error(nls.localize('invalid.property', "configuration.properties property '{0}' must be an object", key));
                        continue;
                    }
                    seenProperties.add(key);
                    if (propertyConfiguration.scope) {
                        if (propertyConfiguration.scope.toString() === 'application') {
                            propertyConfiguration.scope = 1 /* ConfigurationScope.APPLICATION */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine') {
                            propertyConfiguration.scope = 2 /* ConfigurationScope.MACHINE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'resource') {
                            propertyConfiguration.scope = 4 /* ConfigurationScope.RESOURCE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'machine-overridable') {
                            propertyConfiguration.scope = 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */;
                        }
                        else if (propertyConfiguration.scope.toString() === 'language-overridable') {
                            propertyConfiguration.scope = 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */;
                        }
                        else {
                            propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                        }
                    }
                    else {
                        propertyConfiguration.scope = 3 /* ConfigurationScope.WINDOW */;
                    }
                }
            }
            const subNodes = configuration.allOf;
            if (subNodes) {
                extension.collector.error(nls.localize('invalid.allOf', "'configuration.allOf' is deprecated and should no longer be used. Instead, pass multiple configuration sections as an array to the 'configuration' contribution point."));
                for (const node of subNodes) {
                    validateProperties(node, extension);
                }
            }
        }
        if (added.length) {
            const addedConfigurations = [];
            for (const extension of added) {
                const configurations = [];
                const value = extension.value;
                if (Array.isArray(value)) {
                    value.forEach(v => configurations.push(...handleConfiguration(v, extension)));
                }
                else {
                    configurations.push(...handleConfiguration(value, extension));
                }
                extensionConfigurations.set(extension.description.identifier, configurations);
                addedConfigurations.push(...configurations);
            }
            _configDelta.addedConfigurations = addedConfigurations;
        }
        configurationRegistry.deltaConfiguration(_configDelta);
        _configDelta = undefined;
    });
    // END VSCode extension point `configuration`
    jsonRegistry.registerSchema('vscode://schemas/workspaceConfig', {
        allowComments: true,
        allowTrailingCommas: true,
        default: {
            folders: [
                {
                    path: ''
                }
            ],
            settings: {}
        },
        required: ['folders'],
        properties: {
            'folders': {
                minItems: 0,
                uniqueItems: true,
                description: nls.localize('workspaceConfig.folders.description', "List of folders to be loaded in the workspace."),
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { path: '$1' } }],
                    oneOf: [{
                            properties: {
                                path: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.path.description', "A file path. e.g. `/root/folderA` or `./folderA` for a relative path that will be resolved against the location of the workspace file.")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['path']
                        }, {
                            properties: {
                                uri: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.uri.description', "URI of the folder")
                                },
                                name: {
                                    type: 'string',
                                    description: nls.localize('workspaceConfig.name.description', "An optional name for the folder. ")
                                }
                            },
                            required: ['uri']
                        }]
                }
            },
            'settings': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.settings.description', "Workspace settings"),
                $ref: configuration_1.workspaceSettingsSchemaId
            },
            'launch': {
                type: 'object',
                default: { configurations: [], compounds: [] },
                description: nls.localize('workspaceConfig.launch.description', "Workspace launch configurations"),
                $ref: configuration_1.launchSchemaId
            },
            'tasks': {
                type: 'object',
                default: { version: '2.0.0', tasks: [] },
                description: nls.localize('workspaceConfig.tasks.description', "Workspace task configurations"),
                $ref: configuration_1.tasksSchemaId
            },
            'extensions': {
                type: 'object',
                default: {},
                description: nls.localize('workspaceConfig.extensions.description', "Workspace extensions"),
                $ref: 'vscode://schemas/extensions'
            },
            'remoteAuthority': {
                type: 'string',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.remoteAuthority', "The remote server where the workspace is located."),
            },
            'transient': {
                type: 'boolean',
                doNotSuggest: true,
                description: nls.localize('workspaceConfig.transient', "A transient workspace will disappear when restarting or reloading."),
            }
        },
        errorMessage: nls.localize('unknownWorkspaceProperty', "Unknown workspace configuration property")
    });
    class SettingsTableRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.configuration;
        }
        render(manifest) {
            const configuration = manifest.contributes?.configuration;
            let properties = {};
            if (Array.isArray(configuration)) {
                configuration.forEach(config => {
                    properties = { ...properties, ...config.properties };
                });
            }
            else if (configuration) {
                properties = configuration.properties;
            }
            const contrib = properties ? Object.keys(properties) : [];
            const headers = [nls.localize('setting name', "ID"), nls.localize('description', "Description"), nls.localize('default', "Default")];
            const rows = contrib.sort((a, b) => a.localeCompare(b))
                .map(key => {
                return [
                    new htmlContent_1.MarkdownString().appendMarkdown(`\`${key}\``),
                    properties[key].markdownDescription ? new htmlContent_1.MarkdownString(properties[key].markdownDescription, false) : properties[key].description ?? '',
                    new htmlContent_1.MarkdownString().appendCodeblock('json', JSON.stringify((0, types_1.isUndefined)(properties[key].default) ? (0, configurationRegistry_1.getDefaultValue)(properties[key].type) : properties[key].default, null, 2)),
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'configuration',
        label: nls.localize('settings', "Settings"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(SettingsTableRenderer),
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbkV4dGVuc2lvblBvaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9jb25maWd1cmF0aW9uRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLE1BQU0sWUFBWSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE0QixxQ0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDN0YsTUFBTSxxQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUU1RixNQUFNLHdCQUF3QixHQUFnQjtRQUM3QyxJQUFJLEVBQUUsUUFBUTtRQUNkLGVBQWUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMxRCxVQUFVLEVBQUU7WUFDWCxLQUFLLEVBQUU7Z0JBQ04sV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0RBQWtELEVBQUUsK09BQStPLENBQUM7Z0JBQzlULElBQUksRUFBRSxRQUFRO2FBQ2Q7WUFDRCxLQUFLLEVBQUU7Z0JBQ04sV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsa0RBQWtELEVBQUUsNEZBQTRGLENBQUM7Z0JBQzNLLElBQUksRUFBRSxTQUFTO2FBQ2Y7WUFDRCxVQUFVLEVBQUU7Z0JBQ1gsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdURBQXVELEVBQUUsOENBQThDLENBQUM7Z0JBQ2xJLElBQUksRUFBRSxRQUFRO2dCQUNkLGFBQWEsRUFBRTtvQkFDZCxPQUFPLEVBQUUsTUFBTTtvQkFDZixtQkFBbUIsRUFBRSxHQUFHLENBQUMsUUFBUSxD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