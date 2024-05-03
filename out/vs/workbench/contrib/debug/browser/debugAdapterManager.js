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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/common/languages/language", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/contrib/debug/common/breakpoints", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugger", "vs/workbench/contrib/debug/common/debugSchemas", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, event_1, lifecycle_1, severity_1, strings, editorBrowser_1, language_1, nls, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, jsonContributionRegistry_1, quickInput_1, platform_1, breakpoints_1, debug_1, debugger_1, debugSchemas_1, taskDefinitionRegistry_1, configuration_2, editorService_1, extensions_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AdapterManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    let AdapterManager = class AdapterManager extends lifecycle_1.Disposable {
        constructor(delegate, editorService, configurationService, quickInputService, instantiationService, commandService, extensionService, contextKeyService, languageService, dialogService, lifecycleService) {
            super();
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.languageService = languageService;
            this.dialogService = dialogService;
            this.lifecycleService = lifecycleService;
            this.debugAdapterFactories = new Map();
            this._onDidRegisterDebugger = new event_1.Emitter();
            this._onDidDebuggersExtPointRead = new event_1.Emitter();
            this.breakpointContributions = [];
            this.debuggerWhenKeys = new Set();
            this.usedDebugTypes = new Set();
            this.adapterDescriptorFactories = [];
            this.debuggers = [];
            this.registerListeners();
            this.contextKeyService.bufferChangeEvents(() => {
                this.debuggersAvailable = debug_1.CONTEXT_DEBUGGERS_AVAILABLE.bindTo(contextKeyService);
                this.debugExtensionsAvailable = debug_1.CONTEXT_DEBUG_EXTENSION_AVAILABLE.bindTo(contextKeyService);
            });
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this.debuggerWhenKeys)) {
                    this.debuggersAvailable.set(this.hasEnabledDebuggers());
                    this.updateDebugAdapterSchema();
                }
            }));
            this._register(this.onDidDebuggersExtPointRead(() => {
                this.debugExtensionsAvailable.set(this.debuggers.length > 0);
            }));
            this.lifecycleService.when(4 /* LifecyclePhase.Eventually */)
                .then(() => this.debugExtensionsAvailable.set(this.debuggers.length > 0)); // If no extensions with a debugger contribution are loaded
            this._register(delegate.onDidNewSession(s => {
                this.usedDebugTypes.add(s.configuration.type);
            }));
        }
        registerListeners() {
            debugSchemas_1.debuggersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => {
                    added.value.forEach(rawAdapter => {
                        if (!rawAdapter.type || (typeof rawAdapter.type !== 'string')) {
                            added.collector.error(nls.localize('debugNoType', "Debugger 'type' can not be omitted and must be of type 'string'."));
                        }
                        if (rawAdapter.type !== '*') {
                            const existing = this.getDebugger(rawAdapter.type);
                            if (existing) {
                                existing.merge(rawAdapter, added.description);
                            }
                            else {
                                const dbg = this.instantiationService.createInstance(debugger_1.Debugger, this, rawAdapter, added.description);
                                dbg.when?.keys().forEach(key => this.debuggerWhenKeys.add(key));
                                this.debuggers.push(dbg);
                            }
                        }
                    });
                });
                // take care of all wildcard contributions
                extensions.forEach(extension => {
                    extension.value.forEach(rawAdapter => {
                        if (rawAdapter.type === '*') {
                            this.debuggers.forEach(dbg => dbg.merge(rawAdapter, extension.description));
                        }
                    });
                });
                delta.removed.forEach(removed => {
                    const removedTypes = removed.value.map(rawAdapter => rawAdapter.type);
                    this.debuggers = this.debuggers.filter(d => removedTypes.indexOf(d.type) === -1);
                });
                this.updateDebugAdapterSchema();
                this._onDidDebuggersExtPointRead.fire();
            });
            debugSchemas_1.breakpointsExtPoint.setHandler(extensions => {
                this.breakpointContributions = extensions.flatMap(ext => ext.value.map(breakpoint => this.instantiationService.createInstance(breakpoints_1.Breakpoints, breakpoint)));
            });
        }
        updateDebugAdapterSchema() {
            // update the schema to include all attributes, snippets and types from extensions.
            const items = debugSchemas_1.launchSchema.properties['configurations'].items;
            const taskSchema = taskDefinitionRegistry_1.TaskDefinitionRegistry.getJsonSchema();
            const definitions = {
                'common': {
                    properties: {
                        'name': {
                            type: 'string',
                            description: nls.localize('debugName', "Name of configuration; appears in the launch configuration dropdown menu."),
                            default: 'Launch'
                        },
                        'debugServer': {
                            type: 'number',
                            description: nls.localize('debugServer', "For debug extension development only: if a port is specified VS Code tries to connect to a debug adapter running in server mode"),
                            default: 4711
                        },
                        'preLaunchTask': {
                            anyOf: [taskSchema, {
                                    type: ['string']
                                }],
                            default: '',
                            defaultSnippets: [{ body: { task: '', type: '' } }],
                            description: nls.localize('debugPrelaunchTask', "Task to run before debug session starts.")
                        },
                        'postDebugTask': {
                            anyOf: [taskSchema, {
                                    type: ['string'],
                                }],
                            default: '',
                            defaultSnippets: [{ body: { task: '', type: '' } }],
                            description: nls.localize('debugPostDebugTask', "Task to run after debug session ends.")
                        },
                        'presentation': debugSchemas_1.presentationSchema,
                        'internalConsoleOptions': debug_1.INTERNAL_CONSOLE_OPTIONS_SCHEMA,
                        'suppressMultipleSessionWarning': {
                            type: 'boolean',
                            description: nls.localize('suppressMultipleSessionWarning', "Disable the warning when trying to start the same debug configuration more than once."),
                            default: true
                        }
                    }
                }
            };
            debugSchemas_1.launchSchema.definitions = definitions;
            items.oneOf = [];
            items.defaultSnippets = [];
            this.debuggers.forEach(adapter => {
                const schemaAttributes = adapter.getSchemaAttributes(definitions);
                if (schemaAttributes && items.oneOf) {
                    items.oneOf.push(...schemaAttributes);
                }
                const configurationSnippets = adapter.configurationSnippets;
                if (configurationSnippets && items.defaultSnippets) {
                    items.defaultSnippets.push(...configurationSnippets);
                }
            });
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        registerDebugAdapterFactory(debugTypes, debugAdapterLauncher) {
            debugTypes.forEach(debugType => this.debugAdapterFactories.set(debugType, debugAdapterLauncher));
            this.debuggersAvailable.set(this.hasEnabledDebuggers());
            this._onDidRegisterDebugger.fire();
            return {
                dispose: () => {
                    debugTypes.forEach(debugType => this.debugAdapterFactories.delete(debugType));
                }
            };
        }
        hasEnabledDebuggers() {
            for (const [type] of this.debugAdapterFactories) {
                const dbg = this.getDebugger(type);
                if (dbg && dbg.enabled) {
                    return true;
                }
            }
            return false;
        }
        createDebugAdapter(session) {
            const factory = this.debugAdapterFactories.get(session.configuration.type);
            if (factory) {
                return factory.createDebugAdapter(session);
            }
            return undefined;
        }
        substituteVariables(debugType, folder, config) {
            const factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.substituteVariables(folder, config);
            }
            return Promise.resolve(config);
        }
        runInTerminal(debugType, args, sessionId) {
            const factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.runInTerminal(args, sessionId);
            }
            return Promise.resolve(void 0);
        }
        registerDebugAdapterDescriptorFactory(debugAdapterProvider) {
            this.adapterDescriptorFactories.push(debugAdapterProvider);
            return {
                dispose: () => {
                    this.unregisterDebugAdapterDescriptorFactory(debugAdapterProvider);
                }
            };
        }
        unregisterDebugAdapterDescriptorFactory(debugAdapterProvider) {
            const ix = this.adapterDescriptorFactories.indexOf(debugAdapterProvider);
            if (ix >= 0) {
                this.adapterDescriptorFactories.splice(ix, 1);
            }
        }
        getDebugAdapterDescriptor(session) {
            const config = session.configuration;
            const providers = this.adapterDescriptorFactories.filter(p => p.type === config.type && p.createDebugAdapterDescriptor);
            if (providers.length === 1) {
                return providers[0].createDebugAdapterDescriptor(session);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            return Promise.resolve(undefined);
        }
        getDebuggerLabel(type) {
            const dbgr = this.getDebugger(type);
            if (dbgr) {
                return dbgr.label;
            }
            return undefined;
        }
        get onDidRegisterDebugger() {
            return this._onDidRegisterDebugger.event;
        }
        get onDidDebuggersExtPointRead() {
            return this._onDidDebuggersExtPointRead.event;
        }
        canSetBreakpointsIn(model) {
            const languageId = model.getLanguageId();
            if (!languageId || languageId === 'jsonc' || languageId === 'log') {
                // do not allow breakpoints in our settings files and output
                return false;
            }
            if (this.configurationService.getValue('debug').allowBreakpointsEverywhere) {
                return true;
            }
            return this.breakpointContributions.some(breakpoints => breakpoints.language === languageId && breakpoints.enabled);
        }
        getDebugger(type) {
            return this.debuggers.find(dbg => strings.equalsIgnoreCase(dbg.type, type));
        }
        getEnabledDebugger(type) {
            const adapter = this.getDebugger(type);
            return adapter && adapter.enabled ? adapter : undefined;
        }
        someDebuggerInterestedInLanguage(languageId) {
            return !!this.debuggers
                .filter(d => d.enabled)
                .find(a => a.interestedInLanguage(languageId));
        }
        async guessDebugger(gettingConfigurations) {
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            let candidates = [];
            let languageLabel = null;
            let model = null;
            if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                model = activeTextEditorControl.getModel();
                const language = model ? model.getLanguageId() : undefined;
                if (language) {
                    languageLabel = this.languageService.getLanguageName(language);
                }
                const adapters = this.debuggers
                    .filter(a => a.enabled)
                    .filter(a => language && a.interestedInLanguage(language));
                if (adapters.length === 1) {
                    return adapters[0];
                }
                if (adapters.length > 1) {
                    candidates = adapters;
                }
            }
            // We want to get the debuggers that have configuration providers in the case we are fetching configurations
            // Or if a breakpoint can be set in the current file (good hint that an extension can handle it)
            if ((!languageLabel || gettingConfigurations || (model && this.canSetBreakpointsIn(model))) && candidates.length === 0) {
                await this.activateDebuggers('onDebugInitialConfigurations');
                candidates = this.debuggers
                    .filter(a => a.enabled)
                    .filter(dbg => dbg.hasInitialConfiguration() || dbg.hasDynamicConfigurationProviders() || dbg.hasConfigurationProvider());
            }
            if (candidates.length === 0 && languageLabel) {
                if (languageLabel.indexOf(' ') >= 0) {
                    languageLabel = `'${languageLabel}'`;
                }
                const { confirmed } = await this.dialogService.confirm({
                    type: severity_1.default.Warning,
                    message: nls.localize('CouldNotFindLanguage', "You don't have an extension for debugging {0}. Should we find a {0} extension in the Marketplace?", languageLabel),
                    primaryButton: nls.localize({ key: 'findExtension', comment: ['&& denotes a mnemonic'] }, "&&Find {0} extension", languageLabel)
                });
                if (confirmed) {
                    await this.commandService.executeCommand('debug.installAdditionalDebuggers', languageLabel);
                }
                return undefined;
            }
            this.initExtensionActivationsIfNeeded();
            candidates.sort((first, second) => first.label.localeCompare(second.label));
            candidates = candidates.filter(a => !a.isHiddenFromDropdown);
            const suggestedCandidates = [];
            const otherCandidates = [];
            candidates.forEach(d => {
                const descriptor = d.getMainExtensionDescriptor();
                if (descriptor.id && !!this.earlyActivatedExtensions?.has(descriptor.id)) {
                    // Was activated early
                    suggestedCandidates.push(d);
                }
                else if (this.usedDebugTypes.has(d.type)) {
                    // Was used already
                    suggestedCandidates.push(d);
                }
                else {
                    otherCandidates.push(d);
                }
            });
            const picks = [];
            if (suggestedCandidates.length > 0) {
                picks.push({ type: 'separator', label: nls.localize('suggestedDebuggers', "Suggested") }, ...suggestedCandidates.map(c => ({ label: c.label, debugger: c })));
            }
            if (otherCandidates.length > 0) {
                if (picks.length > 0) {
                    picks.push({ type: 'separator', label: '' });
                }
                picks.push(...otherCandidates.map(c => ({ label: c.label, debugger: c })));
            }
            picks.push({ type: 'separator', label: '' }, { label: languageLabel ? nls.localize('installLanguage', "Install an extension for {0}...", languageLabel) : nls.localize('installExt', "Install extension...") });
            const placeHolder = nls.localize('selectDebug', "Select debugger");
            return this.quickInputService.pick(picks, { activeItem: picks[0], placeHolder })
                .then(picked => {
                if (picked && picked.debugger) {
                    return picked.debugger;
                }
                if (picked) {
                    this.commandService.executeCommand('debug.installAdditionalDebuggers', languageLabel);
                }
                return undefined;
            });
        }
        initExtensionActivationsIfNeeded() {
            if (!this.earlyActivatedExtensions) {
                this.earlyActivatedExtensions = new Set();
                const status = this.extensionService.getExtensionsStatus();
                for (const id in status) {
                    if (!!status[id].activationTimes) {
                        this.earlyActivatedExtensions.add(id);
                    }
                }
            }
        }
        async activateDebuggers(activationEvent, debugType) {
            this.initExtensionActivationsIfNeeded();
            const promises = [
                this.extensionService.activateByEvent(activationEvent),
                this.extensionService.activateByEvent('onDebug')
            ];
            if (debugType) {
                promises.push(this.extensionService.activateByEvent(`${activationEvent}:${debugType}`));
            }
            await Promise.all(promises);
        }
    };
    exports.AdapterManager = AdapterManager;
    exports.AdapterManager = AdapterManager = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, commands_1.ICommandService),
        __param(6, extensions_1.IExtensionService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, language_1.ILanguageService),
        __param(9, dialogs_1.IDialogService),
        __param(10, lifecycle_2.ILifecycleService)
    ], AdapterManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdBZGFwdGVyTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z0FkYXB0ZXJNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStCaEcsTUFBTSxZQUFZLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQTRCLHFDQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQU10RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVU7UUFpQjdDLFlBQ0MsUUFBaUMsRUFDakIsYUFBOEMsRUFDdkMsb0JBQTRELEVBQy9ELGlCQUFzRCxFQUNuRCxvQkFBNEQsRUFDbEUsY0FBZ0QsRUFDOUMsZ0JBQW9ELEVBQ25ELGlCQUFzRCxFQUN4RCxlQUFrRCxFQUNwRCxhQUE4QyxFQUMzQyxnQkFBb0Q7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFYeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2pELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM3QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ2xDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDdkMsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMxQixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBeEJoRSwwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBZ0MsQ0FBQztZQUd2RCwyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFD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