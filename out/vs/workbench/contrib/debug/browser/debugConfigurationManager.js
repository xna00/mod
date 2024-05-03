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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/themables", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSchemas", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/history/common/history", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, arrays_1, async_1, cancellation_1, event_1, json, lifecycle_1, objects, resources, themables_1, uri_1, nls, configuration_1, contextkey_1, files_1, instantiation_1, jsonContributionRegistry_1, quickInput_1, platform_1, storage_1, uriIdentity_1, workspace_1, debugIcons_1, debug_1, debugSchemas_1, debugUtils_1, configuration_2, editorService_1, extensions_1, history_1, preferences_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
    const DEBUG_SELECTED_CONFIG_NAME_KEY = 'debug.selectedconfigname';
    const DEBUG_SELECTED_ROOT = 'debug.selectedroot';
    // Debug type is only stored if a dynamic configuration is used for better restore
    const DEBUG_SELECTED_TYPE = 'debug.selectedtype';
    const DEBUG_RECENT_DYNAMIC_CONFIGURATIONS = 'debug.recentdynamicconfigurations';
    let ConfigurationManager = class ConfigurationManager {
        constructor(adapterManager, contextService, configurationService, quickInputService, instantiationService, storageService, extensionService, historyService, uriIdentityService, contextKeyService) {
            this.adapterManager = adapterManager;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.historyService = historyService;
            this.uriIdentityService = uriIdentityService;
            this.getSelectedConfig = () => Promise.resolve(undefined);
            this.selectedDynamic = false;
            this._onDidSelectConfigurationName = new event_1.Emitter();
            this._onDidChangeConfigurationProviders = new event_1.Emitter();
            this.onDidChangeConfigurationProviders = this._onDidChangeConfigurationProviders.event;
            this.configProviders = [];
            this.toDispose = [this._onDidChangeConfigurationProviders];
            this.initLaunches();
            this.setCompoundSchemaValues();
            this.registerListeners();
            const previousSelectedRoot = this.storageService.get(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedType = this.storageService.get(DEBUG_SELECTED_TYPE, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedLaunch = this.launches.find(l => l.uri.toString() === previousSelectedRoot);
            const previousSelectedName = this.storageService.get(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            this.debugConfigurationTypeContext = debug_1.CONTEXT_DEBUG_CONFIGURATION_TYPE.bindTo(contextKeyService);
            const dynamicConfig = previousSelectedType ? { type: previousSelectedType } : undefined;
            if (previousSelectedLaunch && previousSelectedLaunch.getConfigurationNames().length) {
                this.selectConfiguration(previousSelectedLaunch, previousSelectedName, undefined, dynamicConfig);
            }
            else if (this.launches.length > 0) {
                this.selectConfiguration(undefined, previousSelectedName, undefined, dynamicConfig);
            }
        }
        registerDebugConfigurationProvider(debugConfigurationProvider) {
            this.configProviders.push(debugConfigurationProvider);
            this._onDidChangeConfigurationProviders.fire();
            return {
                dispose: () => {
                    this.unregisterDebugConfigurationProvider(debugConfigurationProvider);
                    this._onDidChangeConfigurationProviders.fire();
                }
            };
        }
        unregisterDebugConfigurationProvider(debugConfigurationProvider) {
            const ix = this.configProviders.indexOf(debugConfigurationProvider);
            if (ix >= 0) {
                this.configProviders.splice(ix, 1);
            }
        }
        /**
         * if scope is not specified,a value of DebugConfigurationProvideTrigger.Initial is assumed.
         */
        hasDebugConfigurationProvider(debugType, triggerKind) {
            if (triggerKind === undefined) {
                triggerKind = debug_1.DebugConfigurationProviderTriggerKind.Initial;
            }
            // check if there are providers for the given type that contribute a provideDebugConfigurations method
            const provider = this.configProviders.find(p => p.provideDebugConfigurations && (p.type === debugType) && (p.triggerKind === triggerKind));
            return !!provider;
        }
        async resolveConfigurationByProviders(folderUri, type, config, token) {
            const resolveDebugConfigurationForType = async (type, config) => {
                if (type !== '*') {
                    await this.adapterManager.activateDebuggers('onDebugResolve', type);
                }
                for (const p of this.configProviders) {
                    if (p.type === type && p.resolveDebugConfiguration && config) {
                        config = await p.resolveDebugConfiguration(folderUri, config, token);
                    }
                }
                return config;
            };
            let resolvedType = config.type ?? type;
            let result = config;
            for (let seen = new Set(); result && !seen.has(resolvedType);) {
                seen.add(resolvedType);
                result = await resolveDebugConfigurationForType(resolvedType, result);
                result = await resolveDebugConfigurationForType('*', result);
                resolvedType = result?.type ?? type;
            }
            return result;
        }
        async resolveDebugConfigurationWithSubstitutedVariables(folderUri, type, config, token) {
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfigurationWithSubstitutedVariables)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfigurationWithSubstitutedVariables));
            let result = config;
            await (0, async_1.sequence)(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfigurationWithSubstitutedVariables(folderUri, result, token);
                }
            }));
            return result;
        }
        async provideDebugConfigurations(folderUri, type, token) {
            await this.adapterManager.activateDebuggers('onDebugInitialConfigurations');
            const results = await Promise.all(this.configProviders.filter(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Initial && p.provideDebugConfigurations).map(p => p.provideDebugConfigurations(folderUri, token)));
            return results.reduce((first, second) => first.concat(second), []);
        }
        async getDynamicProviders() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const onDebugDynamicConfigurationsName = 'onDebugDynamicConfigurations';
            const debugDynamicExtensionsTypes = this.extensionService.extensions.reduce((acc, e) => {
                if (!e.activationEvents) {
                    return acc;
                }
                const explicitTypes = [];
                let hasGenericEvent = false;
                for (const event of e.activationEvents) {
                    if (event === onDebugDynamicConfigurationsName) {
                        hasGenericEvent = true;
                    }
                    else if (event.startsWith(`${onDebugDynamicConfigurationsName}:`)) {
                        explicitTypes.push(event.slice(onDebugDynamicConfigurationsName.length + 1));
                    }
                }
                if (explicitTypes.length) {
                    explicitTypes.forEach(t => acc.add(t));
                }
                else if (hasGenericEvent) {
                    const debuggerType = e.contributes?.debuggers?.[0].type;
                    if (debuggerType) {
                        acc.add(debuggerType);
                    }
                }
                return acc;
            }, new Set());
            for (const configProvider of this.configProviders) {
                if (configProvider.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic) {
                    debugDynamicExtensionsTypes.add(configProvider.type);
                }
            }
            return [...debugDynamicExtensionsTypes].map(type => {
                return {
                    label: this.adapterManager.getDebuggerLabel(type),
                    getProvider: async () => {
                        await this.adapterManager.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        return this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                    },
                    type,
                    pick: async () => {
                        // Do a late 'onDebugDynamicConfigurationsName' activation so extensions are not activated too early #108578
                        await this.adapterManager.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        const token = new cancellation_1.CancellationTokenSource();
                        const picks = [];
                        const provider = this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                        this.getLaunches().forEach(launch => {
                            if (launch.workspace && provider) {
                                picks.push(provider.provideDebugConfigurations(launch.workspace.uri, token.token).then(configurations => configurations.map(config => ({
                                    label: config.name,
                                    description: launch.name,
                                    config,
                                    buttons: [{
                                            iconClass: themables_1.ThemeIcon.asClassName(debugIcons_1.debugConfigure),
                                            tooltip: nls.localize('editLaunchConfig', "Edit Debug Configuration in launch.json")
                                        }],
                                    launch
                                }))));
                            }
                        });
                        const disposables = new lifecycle_1.DisposableStore();
                        const input = disposables.add(this.quickInputService.createQuickPick());
                        input.busy = true;
                        input.placeholder = nls.localize('selectConfiguration', "Select Launch Configuration");
                        const chosenPromise = new Promise(resolve => {
                            disposables.add(input.onDidAccept(() => resolve(input.activeItems[0])));
                            disposables.add(input.onDidTriggerItemButton(async (context) => {
                                resolve(undefined);
                                const { launch, config } = context.item;
                                await launch.openConfigFile({ preserveFocus: false, type: config.type, suppressInitialConfigs: true });
                                // Only Launch have a pin trigger button
                                await launch.writeConfiguration(config);
                                await this.selectConfiguration(launch, config.name);
                                this.removeRecentDynamicConfigurations(config.name, config.type);
                            }));
                            disposables.add(input.onDidHide(() => resolve(undefined)));
                        });
                        const nestedPicks = await Promise.all(picks);
                        const items = (0, arrays_1.flatten)(nestedPicks);
                        input.items = items;
                        input.busy = false;
                        input.show();
                        const chosen = await chosenPromise;
                        disposables.dispose();
                        if (!chosen) {
                            // User canceled quick input we should notify the provider to cancel computing configurations
                            token.cancel();
                            return;
                        }
                        return chosen;
                    }
                };
            });
        }
        getAllConfigurations() {
            const all = [];
            for (const l of this.launches) {
                for (const name of l.getConfigurationNames()) {
                    const config = l.getConfiguration(name) || l.getCompound(name);
                    if (config) {
                        all.push({ launch: l, name, presentation: config.presentation });
                    }
                }
            }
            return (0, debugUtils_1.getVisibleAndSorted)(all);
        }
        removeRecentDynamicConfigurations(name, type) {
            const remaining = this.getRecentDynamicConfigurations().filter(c => c.name !== name || c.type !== type);
            this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(remaining), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            if (this.selectedConfiguration.name === name && this.selectedType === type && this.selectedDynamic) {
                this.selectConfiguration(undefined, undefined);
            }
            else {
                this._onDidSelectConfigurationName.fire();
            }
        }
        getRecentDynamicConfigurations() {
            return JSON.parse(this.storageService.get(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, 1 /* StorageScope.WORKSPACE */, '[]'));
        }
        registerListeners() {
            this.toDispose.push(event_1.Event.any(this.contextService.onDidChangeWorkspaceFolders, this.contextService.onDidChangeWorkbenchState)(() => {
                this.initLaunches();
                this.selectConfiguration(undefined);
                this.setCompoundSchemaValues();
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('launch')) {
                    // A change happen in the launch.json. If there is already a launch configuration selected, do not change the selection.
                    await this.selectConfiguration(undefined);
                    this.setCompoundSchemaValues();
                }
            }));
            this.toDispose.push(this.adapterManager.onDidDebuggersExtPointRead(() => {
                this.setCompoundSchemaValues();
            }));
        }
        initLaunches() {
            this.launches = this.contextService.getWorkspace().folders.map(folder => this.instantiationService.createInstance(Launch, this, this.adapterManager, folder));
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                this.launches.push(this.instantiationService.createInstance(WorkspaceLaunch, this, this.adapterManager));
            }
            this.launches.push(this.instantiationService.createInstance(UserLaunch, this, this.adapterManager));
            if (this.selectedLaunch && this.launches.indexOf(this.selectedLaunch) === -1) {
                this.selectConfiguration(undefined);
            }
        }
        setCompoundSchemaValues() {
            const compoundConfigurationsSchema = debugSchemas_1.launchSchema.properties['compounds'].items.properties['configurations'];
            const launchNames = this.launches.map(l => l.getConfigurationNames(true)).reduce((first, second) => first.concat(second), []);
            compoundConfigurationsSchema.items.oneOf[0].enum = launchNames;
            compoundConfigurationsSchema.items.oneOf[1].properties.name.enum = launchNames;
            const folderNames = this.contextService.getWorkspace().folders.map(f => f.name);
            compoundConfigurationsSchema.items.oneOf[1].properties.folder.enum = folderNames;
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        getLaunches() {
            return this.launches;
        }
        getLaunch(workspaceUri) {
            if (!uri_1.URI.isUri(workspaceUri)) {
                return undefined;
            }
            return this.launches.find(l => l.workspace && this.uriIdentityService.extUri.isEqual(l.workspace.uri, workspaceUri));
        }
        get selectedConfiguration() {
            return {
                launch: this.selectedLaunch,
                name: this.selectedName,
                getConfig: this.getSelectedConfig,
                type: this.selectedType
            };
        }
        get onDidSelectConfiguration() {
            return this._onDidSelectConfigurationName.event;
        }
        getWorkspaceLaunch() {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                return this.launches[this.launches.length - 1];
            }
            return undefined;
        }
        async selectConfiguration(launch, name, config, dynamicConfig) {
            if (typeof launch === 'undefined') {
                const rootUri = this.historyService.getLastActiveWorkspaceRoot();
                launch = this.getLaunch(rootUri);
                if (!launch || launch.getConfigurationNames().length === 0) {
                    launch = this.launches.find(l => !!(l && l.getConfigurationNames().length)) || launch || this.launches[0];
                }
            }
            const previousLaunch = this.selectedLaunch;
            const previousName = this.selectedName;
            const previousSelectedDynamic = this.selectedDynamic;
            this.selectedLaunch = launch;
            if (this.selectedLaunch) {
                this.storageService.store(DEBUG_SELECTED_ROOT, this.selectedLaunch.uri.toString(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            }
            const names = launch ? launch.getConfigurationNames() : [];
            this.getSelectedConfig = () => {
                const selected = this.selectedName ? launch?.getConfiguration(this.selectedName) : undefined;
                return Promise.resolve(selected || config);
            };
            let type = config?.type;
            if (name && names.indexOf(name) >= 0) {
                this.setSelectedLaunchName(name);
            }
            else if (dynamicConfig && dynamicConfig.type) {
                // We could not find the previously used name and config is not passed. We should get all dynamic configurations from providers
                // And potentially auto select the previously used dynamic configuration #96293
                type = dynamicConfig.type;
                if (!config) {
                    const providers = (await this.getDynamicProviders()).filter(p => p.type === type);
                    this.getSelectedConfig = async () => {
                        const activatedProviders = await Promise.all(providers.map(p => p.getProvider()));
                        const provider = activatedProviders.length > 0 ? activatedProviders[0] : undefined;
                        if (provider && launch && launch.workspace) {
                            const token = new cancellation_1.CancellationTokenSource();
                            const dynamicConfigs = await provider.provideDebugConfigurations(launch.workspace.uri, token.token);
                            const dynamicConfig = dynamicConfigs.find(c => c.name === name);
                            if (dynamicConfig) {
                                return dynamicConfig;
                            }
                        }
                        return undefined;
                    };
                }
                this.setSelectedLaunchName(name);
                let recentDynamicProviders = this.getRecentDynamicConfigurations();
                if (name && dynamicConfig.type) {
                    // We need to store the recently used dynamic configurations to be able to show them in UI #110009
                    recentDynamicProviders.unshift({ name, type: dynamicConfig.type });
                    recentDynamicProviders = (0, arrays_1.distinct)(recentDynamicProviders, t => `${t.name} : ${t.type}`);
                    this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(recentDynamicProviders), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                }
            }
            else if (!this.selectedName || names.indexOf(this.selectedName) === -1) {
                // We could not find the configuration to select, pick the first one, or reset the selection if there is no launch configuration
                const nameToSet = names.length ? names[0] : undefined;
                this.setSelectedLaunchName(nameToSet);
            }
            if (!config && launch && this.selectedName) {
                config = launch.getConfiguration(this.selectedName);
                type = config?.type;
            }
            this.selectedType = dynamicConfig?.type || config?.type;
            this.selectedDynamic = !!dynamicConfig;
            // Only store the selected type if we are having a dynamic configuration. Otherwise restoring this configuration from storage might be misindentified as a dynamic configuration
            this.storageService.store(DEBUG_SELECTED_TYPE, dynamicConfig ? this.selectedType : undefined, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            if (type) {
                this.debugConfigurationTypeContext.set(type);
            }
            else {
                this.debugConfigurationTypeContext.reset();
            }
            if (this.selectedLaunch !== previousLaunch || this.selectedName !== previousName || previousSelectedDynamic !== this.selectedDynamic) {
                this._onDidSelectConfigurationName.fire();
            }
        }
        setSelectedLaunchName(selectedName) {
            this.selectedName = selectedName;
            if (this.selectedName) {
                this.storageService.store(DEBUG_SELECTED_CONFIG_NAME_KEY, this.selectedName, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
        dispose() {
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    exports.ConfigurationManager = ConfigurationManager;
    exports.ConfigurationManager = ConfigurationManager = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService),
        __param(7, history_1.IHistoryService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, contextkey_1.IContextKeyService)
    ], ConfigurationManager);
    class AbstractLaunch {
        constructor(configurationManager, adapterManager) {
            this.configurationManager = configurationManager;
            this.adapterManager = adapterManager;
        }
        getCompound(name) {
            const config = this.getConfig();
            if (!config || !config.compounds) {
                return undefined;
            }
            return config.compounds.find(compound => compound.name === name);
        }
        getConfigurationNames(ignoreCompoundsAndPresentation = false) {
            const config = this.getConfig();
            if (!config || (!Array.isArray(config.configurations) && !Array.isArray(config.compounds))) {
                return [];
            }
            else {
                const configurations = [];
                if (config.configurations) {
                    configurations.push(...config.configurations.filter(cfg => cfg && typeof cfg.name === 'string'));
                }
                if (ignoreCompoundsAndPresentation) {
                    return configurations.map(c => c.name);
                }
                if (config.compounds) {
                    configurations.push(...config.compounds.filter(compound => typeof compound.name === 'string' && compound.configurations && compound.configurations.length));
                }
                return (0, debugUtils_1.getVisibleAndSorted)(configurations).map(c => c.name);
            }
        }
        getConfiguration(name) {
            // We need to clone the configuration in order to be able to make changes to it #42198
            const config = objects.deepClone(this.getConfig());
            if (!config || !config.configurations) {
                return undefined;
            }
            const configuration = config.configurations.find(config => config && config.name === name);
            if (configuration) {
                if (this instanceof UserLaunch) {
                    configuration.__configurationTarget = 2 /* ConfigurationTarget.USER */;
                }
                else if (this instanceof WorkspaceLaunch) {
                    configuration.__configurationTarget = 5 /* ConfigurationTarget.WORKSPACE */;
                }
                else {
                    configuration.__configurationTarget = 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            return configuration;
        }
        async getInitialConfigurationContent(folderUri, type, useInitialConfigs, token) {
            let content = '';
            const adapter = type ? this.adapterManager.getEnabledDebugger(type) : await this.adapterManager.guessDebugger(true);
            if (adapter) {
                const initialConfigs = useInitialConfigs ?
                    await this.configurationManager.provideDebugConfigurations(folderUri, adapter.type, token || cancellation_1.CancellationToken.None) :
                    [];
                content = await adapter.getInitialConfigurationContent(initialConfigs);
            }
            return content;
        }
        get hidden() {
            return false;
        }
    }
    let Launch = class Launch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, workspace, fileService, textFileService, editorService, configurationService) {
            super(configurationManager, adapterManager);
            this.workspace = workspace;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        get uri() {
            return resources.joinPath(this.workspace.uri, '/.vscode/launch.json');
        }
        get name() {
            return this.workspace.name;
        }
        getConfig() {
            return this.configurationService.inspect('launch', { resource: this.workspace.uri }).workspaceFolderValue;
        }
        async openConfigFile({ preserveFocus, type, suppressInitialConfigs }, token) {
            const resource = this.uri;
            let created = false;
            let content = '';
            try {
                const fileContent = await this.fileService.readFile(resource);
                content = fileContent.value.toString();
            }
            catch {
                // launch.json not found: create one by collecting launch configs from debugConfigProviders
                content = await this.getInitialConfigurationContent(this.workspace.uri, type, !suppressInitialConfigs, token);
                if (!content) {
                    // Cancelled
                    return { editor: null, created: false };
                }
                created = true; // pin only if config file is created #8727
                try {
                    await this.textFileService.write(resource, content);
                }
                catch (error) {
                    throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error.message));
                }
            }
            const index = content.indexOf(`"${this.configurationManager.selectedConfiguration.name}"`);
            let startLineNumber = 1;
            for (let i = 0; i < index; i++) {
                if (content.charAt(i) === '\n') {
                    startLineNumber++;
                }
            }
            const selection = startLineNumber > 1 ? { startLineNumber, startColumn: 4 } : undefined;
            const editor = await this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus,
                    pinned: created,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: editor ?? null,
                created
            });
        }
        async writeConfiguration(configuration) {
            const fullConfig = objects.deepClone(this.getConfig());
            if (!fullConfig.configurations) {
                fullConfig.configurations = [];
            }
            fullConfig.configurations.push(configuration);
            await this.configurationService.updateValue('launch', fullConfig, { resource: this.workspace.uri }, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
        }
    };
    Launch = __decorate([
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService)
    ], Launch);
    let WorkspaceLaunch = class WorkspaceLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, editorService, configurationService, contextService) {
            super(configurationManager, adapterManager);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.contextService = contextService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.contextService.getWorkspace().configuration;
        }
        get name() {
            return nls.localize('workspace', "workspace");
        }
        getConfig() {
            return this.configurationService.inspect('launch').workspaceValue;
        }
        async openConfigFile({ preserveFocus, type, useInitialConfigs }, token) {
            const launchExistInFile = !!this.getConfig();
            if (!launchExistInFile) {
                // Launch property in workspace config not found: create one by collecting launch configs from debugConfigProviders
                const content = await this.getInitialConfigurationContent(undefined, type, useInitialConfigs, token);
                if (content) {
                    await this.configurationService.updateValue('launch', json.parse(content), 5 /* ConfigurationTarget.WORKSPACE */);
                }
                else {
                    return { editor: null, created: false };
                }
            }
            const editor = await this.editorService.openEditor({
                resource: this.contextService.getWorkspace().configuration,
                options: { preserveFocus }
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: editor ?? null,
                created: false
            });
        }
    };
    WorkspaceLaunch = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], WorkspaceLaunch);
    let UserLaunch = class UserLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, configurationService, preferencesService) {
            super(configurationManager, adapterManager);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.preferencesService.userSettingsResource;
        }
        get name() {
            return nls.localize('user settings', "user settings");
        }
        get hidden() {
            return true;
        }
        getConfig() {
            return this.configurationService.inspect('launch').userValue;
        }
        async openConfigFile({ preserveFocus, type, useInitialContent }) {
            const editor = await this.preferencesService.openUserSettings({ jsonEditor: true, preserveFocus, revealSetting: { key: 'launch' } });
            return ({
                editor: editor ?? null,
                created: false
            });
        }
    };
    UserLaunch = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, preferences_1.IPreferencesService)
    ], UserLaunch);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdDb25maWd1cmF0aW9uTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvYnJvd3Nlci9kZWJ1Z0NvbmZpZ3VyYXRpb25NYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9DaEcsTUFBTSxZQUFZLEdBQUcsbUJBQVEsQ0FBQyxFQUFFLENBQTRCLHFDQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM3RixZQUFZLENBQUMsY0FBYyxDQUFDLDhCQUFjLEVBQUUsMkJBQVksQ0FBQyxDQUFDO0lBRTFELE1BQU0sOEJBQThCLEdBQUcsMEJBQTBCLENBQUM7SUFDbEUsTUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQztJQUNqRCxrRkFBa0Y7SUFDbEYsTUFBTSxtQkFBbUIsR0FBRyxvQkFBb0IsQ0FBQztJQUNqRCxNQUFNLG1DQUFtQyxHQUFHLG1DQUFtQyxDQUFDO0lBSXpFLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQW9CO1FBY2hDLFlBQ2tCLGNBQStCLEVBQ3RCLGNBQXlELEVBQzVELG9CQUE0RCxFQUMvRCxpQkFBc0QsRUFDbkQsb0JBQTRELEVBQ2xFLGNBQWdELEVBQzlDLGdCQUFvRCxFQUN0RCxjQUFnRCxFQUM1QyxrQkFBd0QsRUFDekQsaUJBQXFDO1lBVHhDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNMLG1CQUFjLEdBQWQsY0FBYyxDQUEwQjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQzlDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDbEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFn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