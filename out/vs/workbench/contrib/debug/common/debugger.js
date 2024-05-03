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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/contrib/debug/common/debug", "vs/platform/configuration/common/configuration", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/configurationResolver/common/configurationResolverUtils", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/environment/common/environmentService", "vs/platform/contextkey/common/contextkey", "vs/base/common/objects"], function (require, exports, nls, types_1, debug_1, configuration_1, configurationResolver_1, ConfigurationResolverUtils, textResourceConfiguration_1, uri_1, network_1, debugUtils_1, telemetryUtils_1, environmentService_1, contextkey_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Debugger = void 0;
    let Debugger = class Debugger {
        constructor(adapterManager, dbgContribution, extensionDescription, configurationService, resourcePropertiesService, configurationResolverService, environmentService, debugService, contextKeyService) {
            this.adapterManager = adapterManager;
            this.configurationService = configurationService;
            this.resourcePropertiesService = resourcePropertiesService;
            this.configurationResolverService = configurationResolverService;
            this.environmentService = environmentService;
            this.debugService = debugService;
            this.contextKeyService = contextKeyService;
            this.mergedExtensionDescriptions = [];
            this.debuggerContribution = { type: dbgContribution.type };
            this.merge(dbgContribution, extensionDescription);
            this.debuggerWhen = typeof this.debuggerContribution.when === 'string' ? contextkey_1.ContextKeyExpr.deserialize(this.debuggerContribution.when) : undefined;
            this.debuggerHiddenWhen = typeof this.debuggerContribution.hiddenWhen === 'string' ? contextkey_1.ContextKeyExpr.deserialize(this.debuggerContribution.hiddenWhen) : undefined;
        }
        merge(otherDebuggerContribution, extensionDescription) {
            /**
             * Copies all properties of source into destination. The optional parameter "overwrite" allows to control
             * if existing non-structured properties on the destination should be overwritten or not. Defaults to true (overwrite).
             */
            function mixin(destination, source, overwrite, level = 0) {
                if (!(0, types_1.isObject)(destination)) {
                    return source;
                }
                if ((0, types_1.isObject)(source)) {
                    Object.keys(source).forEach(key => {
                        if (key !== '__proto__') {
                            if ((0, types_1.isObject)(destination[key]) && (0, types_1.isObject)(source[key])) {
                                mixin(destination[key], source[key], overwrite, level + 1);
                            }
                            else {
                                if (key in destination) {
                                    if (overwrite) {
                                        if (level === 0 && key === 'type') {
                                            // don't merge the 'type' property
                                        }
                                        else {
                                            destination[key] = source[key];
                                        }
                                    }
                                }
                                else {
                                    destination[key] = source[key];
                                }
                            }
                        }
                    });
                }
                return destination;
            }
            // only if not already merged
            if (this.mergedExtensionDescriptions.indexOf(extensionDescription) < 0) {
                // remember all extensions that have been merged for this debugger
                this.mergedExtensionDescriptions.push(extensionDescription);
                // merge new debugger contribution into existing contributions (and don't overwrite values in built-in extensions)
                mixin(this.debuggerContribution, otherDebuggerContribution, extensionDescription.isBuiltin);
                // remember the extension that is considered the "main" debugger contribution
                if ((0, debugUtils_1.isDebuggerMainContribution)(otherDebuggerContribution)) {
                    this.mainExtensionDescription = extensionDescription;
                }
            }
        }
        async startDebugging(configuration, parentSessionId) {
            const parentSession = this.debugService.getModel().getSession(parentSessionId);
            return await this.debugService.startDebugging(undefined, configuration, { parentSession }, undefined);
        }
        async createDebugAdapter(session) {
            await this.adapterManager.activateDebuggers('onDebugAdapterProtocolTracker', this.type);
            const da = this.adapterManager.createDebugAdapter(session);
            if (da) {
                return Promise.resolve(da);
            }
            throw new Error(nls.localize('cannot.find.da', "Cannot find debug adapter for type '{0}'.", this.type));
        }
        async substituteVariables(folder, config) {
            const substitutedConfig = await this.adapterManager.substituteVariables(this.type, folder, config);
            return await this.configurationResolverService.resolveWithInteractionReplace(folder, substitutedConfig, 'launch', this.variables, substitutedConfig.__configurationTarget);
        }
        runInTerminal(args, sessionId) {
            return this.adapterManager.runInTerminal(this.type, args, sessionId);
        }
        get label() {
            return this.debuggerContribution.label || this.debuggerContribution.type;
        }
        get type() {
            return this.debuggerContribution.type;
        }
        get variables() {
            return this.debuggerContribution.variables;
        }
        get configurationSnippets() {
            return this.debuggerContribution.configurationSnippets;
        }
        get languages() {
            return this.debuggerContribution.languages;
        }
        get when() {
            return this.debuggerWhen;
        }
        get hiddenWhen() {
            return this.debuggerHiddenWhen;
        }
        get enabled() {
            return !this.debuggerWhen || this.contextKeyService.contextMatchesRules(this.debuggerWhen);
        }
        get isHiddenFromDropdown() {
            if (!this.debuggerHiddenWhen) {
                return false;
            }
            return this.contextKeyService.contextMatchesRules(this.debuggerHiddenWhen);
        }
        get strings() {
            return this.debuggerContribution.strings ?? this.debuggerContribution.uiMessages;
        }
        interestedInLanguage(languageId) {
            return !!(this.languages && this.languages.indexOf(languageId) >= 0);
        }
        hasInitialConfiguration() {
            return !!this.debuggerContribution.initialConfigurations;
        }
        hasDynamicConfigurationProviders() {
            return this.debugService.getConfigurationManager().hasDebugConfigurationProvider(this.type, debug_1.DebugConfigurationProviderTriggerKind.Dynamic);
        }
        hasConfigurationProvider() {
            return this.debugService.getConfigurationManager().hasDebugConfigurationProvider(this.type);
        }
        getInitialConfigurationContent(initialConfigs) {
            // at this point we got some configs from the package.json and/or from registered DebugConfigurationProviders
            let initialConfigurations = this.debuggerContribution.initialConfigurations || [];
            if (initialConfigs) {
                initialConfigurations = initialConfigurations.concat(initialConfigs);
            }
            const eol = this.resourcePropertiesService.getEOL(uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: '1' })) === '\r\n' ? '\r\n' : '\n';
            const configs = JSON.stringify(initialConfigurations, null, '\t').split('\n').map(line => '\t' + line).join(eol).trim();
            const comment1 = nls.localize('launch.config.comment1', "Use IntelliSense to learn about possible attributes.");
            const comment2 = nls.localize('launch.config.comment2', "Hover to view descriptions of existing attributes.");
            const comment3 = nls.localize('launch.config.comment3', "For more information, visit: {0}", 'https://go.microsoft.com/fwlink/?linkid=830387');
            let content = [
                '{',
                `\t// ${comment1}`,
                `\t// ${comment2}`,
                `\t// ${comment3}`,
                `\t"version": "0.2.0",`,
                `\t"configurations": ${configs}`,
                '}'
            ].join(eol);
            // fix formatting
            const editorConfig = this.configurationService.getValue();
            if (editorConfig.editor && editorConfig.editor.insertSpaces) {
                content = content.replace(new RegExp('\t', 'g'), ' '.repeat(editorConfig.editor.tabSize));
            }
            return Promise.resolve(content);
        }
        getMainExtensionDescriptor() {
            return this.mainExtensionDescription || this.mergedExtensionDescriptions[0];
        }
        getCustomTelemetryEndpoint() {
            const aiKey = this.debuggerContribution.aiKey;
            if (!aiKey) {
                return undefined;
            }
            const sendErrorTelemtry = (0, telemetryUtils_1.cleanRemoteAuthority)(this.environmentService.remoteAuthority) !== 'other';
            return {
                id: `${this.getMainExtensionDescriptor().publisher}.${this.type}`,
                aiKey,
                sendErrorTelemetry: sendErrorTelemtry
            };
        }
        getSchemaAttributes(definitions) {
            if (!this.debuggerContribution.configurationAttributes) {
                return null;
            }
            // fill in the default configuration attributes shared by all adapters.
            return Object.keys(this.debuggerContribution.configurationAttributes).map(request => {
                const definitionId = `${this.type}:${request}`;
                const platformSpecificDefinitionId = `${this.type}:${request}:platform`;
                const attributes = this.debuggerContribution.configurationAttributes[request];
                const defaultRequired = ['name', 'type', 'request'];
                attributes.required = attributes.required && attributes.required.length ? defaultRequired.concat(attributes.required) : defaultRequired;
                attributes.additionalProperties = false;
                attributes.type = 'object';
                if (!attributes.properties) {
                    attributes.properties = {};
                }
                const properties = attributes.properties;
                properties['type'] = {
                    enum: [this.type],
                    enumDescriptions: [this.label],
                    description: nls.localize('debugType', "Type of configuration."),
                    pattern: '^(?!node2)',
                    deprecationMessage: this.debuggerContribution.deprecated || (this.enabled ? undefined : (0, debug_1.debuggerDisabledMessage)(this.type)),
                    doNotSuggest: !!this.debuggerContribution.deprecated,
                    errorMessage: nls.localize('debugTypeNotRecognised', "The debug type is not recognized. Make sure that you have a corresponding debug extension installed and that it is enabled."),
                    patternErrorMessage: nls.localize('node2NotSupported', "\"node2\" is no longer supported, use \"node\" instead and set the \"protocol\" attribute to \"inspector\".")
                };
                properties['request'] = {
                    enum: [request],
                    description: nls.localize('debugRequest', "Request type of configuration. Can be \"launch\" or \"attach\"."),
                };
                for (const prop in definitions['common'].properties) {
                    properties[prop] = {
                        $ref: `#/definitions/common/properties/${prop}`
                    };
                }
                Object.keys(properties).forEach(name => {
                    // Use schema allOf property to get independent error reporting #21113
                    ConfigurationResolverUtils.applyDeprecatedVariableMessage(properties[name]);
                });
                definitions[definitionId] = { ...attributes };
                definitions[platformSpecificDefinitionId] = {
                    type: 'object',
                    additionalProperties: false,
                    properties: (0, objects_1.filter)(properties, key => key !== 'type' && key !== 'request' && key !== 'name')
                };
                // Don't add the OS props to the real attributes object so they don't show up in 'definitions'
                const attributesCopy = { ...attributes };
                attributesCopy.properties = {
                    ...properties,
                    ...{
                        windows: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugWindowsConfiguration', "Windows specific launch configuration attributes."),
                        },
                        osx: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugOSXConfiguration', "OS X specific launch configuration attributes."),
                        },
                        linux: {
                            $ref: `#/definitions/${platformSpecificDefinitionId}`,
                            description: nls.localize('debugLinuxConfiguration', "Linux specific launch configuration attributes."),
                        }
                    }
                };
                return attributesCopy;
            });
        }
    };
    exports.Debugger = Debugger;
    exports.Debugger = Debugger = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(5, configurationResolver_1.IConfigurationResolverService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService),
        __param(7, debug_1.IDebugService),
        __param(8, contextkey_1.IContextKeyService)
    ], Debugger);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQnpGLElBQU0sUUFBUSxHQUFkLE1BQU0sUUFBUTtRQVNwQixZQUNTLGNBQStCLEVBQ3ZDLGVBQXNDLEVBQ3RDLG9CQUEyQyxFQUNwQixvQkFBNEQsRUFDbkQseUJBQTBFLEVBQzNFLDRCQUE0RSxFQUM3RSxrQkFBaUUsRUFDaEYsWUFBNEMsRUFDdkMsaUJBQXNEO1lBUmxFLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDbEMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUFnQztZQUMxRCxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQzVELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDL0QsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDdEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQWZuRSxnQ0FBMkIsR0FBNEIsRUFBRSxDQUFDO1lBaUJqRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzNELElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLG9CQUFvQixDQUFDLENBQUM7WUFFbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNoSixJ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