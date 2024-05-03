/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/files/common/files", "vs/platform/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/objects", "vs/base/common/hash", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/base/common/types", "vs/platform/configuration/common/configurations"], function (require, exports, event_1, errors, lifecycle_1, async_1, files_1, configurationModels_1, configurationModels_2, configuration_1, configurationRegistry_1, objects_1, hash_1, resources_1, platform_1, types_1, configurations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FolderConfiguration = exports.WorkspaceConfiguration = exports.RemoteUserConfiguration = exports.UserConfiguration = exports.ApplicationConfiguration = exports.DefaultConfiguration = void 0;
    class DefaultConfiguration extends configurations_1.DefaultConfiguration {
        static { this.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY = 'DefaultOverridesCacheExists'; }
        constructor(configurationCache, environmentService) {
            super();
            this.configurationCache = configurationCache;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.cachedConfigurationDefaultsOverrides = {};
            this.cacheKey = { type: 'defaults', key: 'configurationDefaultsOverrides' };
            this.updateCache = false;
            if (environmentService.options?.configurationDefaults) {
                this.configurationRegistry.registerDefaultConfigurations([{ overrides: environmentService.options.configurationDefaults }]);
            }
        }
        getConfigurationDefaultOverrides() {
            return this.cachedConfigurationDefaultsOverrides;
        }
        async initialize() {
            await this.initializeCachedConfigurationDefaultsOverrides();
            return super.initialize();
        }
        reload() {
            this.updateCache = true;
            this.cachedConfigurationDefaultsOverrides = {};
            this.updateCachedConfigurationDefaultsOverrides();
            return super.reload();
        }
        hasCachedConfigurationDefaultsOverrides() {
            return !(0, types_1.isEmptyObject)(this.cachedConfigurationDefaultsOverrides);
        }
        initializeCachedConfigurationDefaultsOverrides() {
            if (!this.initiaizeCachedConfigurationDefaultsOverridesPromise) {
                this.initiaizeCachedConfigurationDefaultsOverridesPromise = (async () => {
                    try {
                        // Read only when the cache exists
                        if (localStorage.getItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY)) {
                            const content = await this.configurationCache.read(this.cacheKey);
                            if (content) {
                                this.cachedConfigurationDefaultsOverrides = JSON.parse(content);
                            }
                        }
                    }
                    catch (error) { /* ignore */ }
                    this.cachedConfigurationDefaultsOverrides = (0, types_1.isObject)(this.cachedConfigurationDefaultsOverrides) ? this.cachedConfigurationDefaultsOverrides : {};
                })();
            }
            return this.initiaizeCachedConfigurationDefaultsOverridesPromise;
        }
        onDidUpdateConfiguration(properties, defaultsOverrides) {
            super.onDidUpdateConfiguration(properties, defaultsOverrides);
            if (defaultsOverrides) {
                this.updateCachedConfigurationDefaultsOverrides();
            }
        }
        async updateCachedConfigurationDefaultsOverrides() {
            if (!this.updateCache) {
                return;
            }
            const cachedConfigurationDefaultsOverrides = {};
            const configurationDefaultsOverrides = this.configurationRegistry.getConfigurationDefaultsOverrides();
            for (const [key, value] of configurationDefaultsOverrides) {
                if (!configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) && value.value !== undefined) {
                    cachedConfigurationDefaultsOverrides[key] = value.value;
                }
            }
            try {
                if (Object.keys(cachedConfigurationDefaultsOverrides).length) {
                    localStorage.setItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
                    await this.configurationCache.write(this.cacheKey, JSON.stringify(cachedConfigurationDefaultsOverrides));
                }
                else {
                    localStorage.removeItem(DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY);
                    await this.configurationCache.remove(this.cacheKey);
                }
            }
            catch (error) { /* Ignore error */ }
        }
    }
    exports.DefaultConfiguration = DefaultConfiguration;
    class ApplicationConfiguration extends configurationModels_1.UserSettings {
        constructor(userDataProfilesService, fileService, uriIdentityService) {
            super(userDataProfilesService.defaultProfile.settingsResource, { scopes: [1 /* ConfigurationScope.APPLICATION */] }, uriIdentityService.extUri, fileService);
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._register(this.onDidChange(() => this.reloadConfigurationScheduler.schedule()));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.loadConfiguration().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
        }
        async initialize() {
            return this.loadConfiguration();
        }
        async loadConfiguration() {
            const model = await super.loadConfiguration();
            const value = model.getValue(configuration_1.APPLY_ALL_PROFILES_SETTING);
            const allProfilesSettings = Array.isArray(value) ? value : [];
            return this.parseOptions.include || allProfilesSettings.length
                ? this.reparse({ ...this.parseOptions, include: allProfilesSettings })
                : model;
        }
    }
    exports.ApplicationConfiguration = ApplicationConfiguration;
    class UserConfiguration extends lifecycle_1.Disposable {
        get hasTasksLoaded() { return this.userConfiguration.value instanceof FileServiceBasedConfiguration; }
        constructor(settingsResource, tasksResource, configurationParseOptions, fileService, uriIdentityService, logService) {
            super();
            this.settingsResource = settingsResource;
            this.tasksResource = tasksResource;
            this.configurationParseOptions = configurationParseOptions;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.userConfiguration = this._register(new lifecycle_1.MutableDisposable());
            this.userConfigurationChangeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.userConfiguration.value = new configurationModels_1.UserSettings(settingsResource, this.configurationParseOptions, uriIdentityService.extUri, this.fileService);
            this.userConfigurationChangeDisposable.value = this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule());
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.userConfiguration.value.loadConfiguration().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
        }
        async reset(settingsResource, tasksResource, configurationParseOptions) {
            this.settingsResource = settingsResource;
            this.tasksResource = tasksResource;
            this.configurationParseOptions = configurationParseOptions;
            return this.doReset();
        }
        async doReset(settingsConfiguration) {
            const folder = this.uriIdentityService.extUri.dirname(this.settingsResource);
            const standAloneConfigurationResources = this.tasksResource ? [[configuration_1.TASKS_CONFIGURATION_KEY, this.tasksResource]] : [];
            const fileServiceBasedConfiguration = new FileServiceBasedConfiguration(folder.toString(), this.settingsResource, standAloneConfigurationResources, this.configurationParseOptions, this.fileService, this.uriIdentityService, this.logService);
            const configurationModel = await fileServiceBasedConfiguration.loadConfiguration(settingsConfiguration);
            this.userConfiguration.value = fileServiceBasedConfiguration;
            // Check for value because userConfiguration might have been disposed.
            if (this.userConfigurationChangeDisposable.value) {
                this.userConfigurationChangeDisposable.value = this.userConfiguration.value.onDidChange(() => this.reloadConfigurationScheduler.schedule());
            }
            return configurationModel;
        }
        async initialize() {
            return this.userConfiguration.value.loadConfiguration();
        }
        async reload(settingsConfiguration) {
            if (this.hasTasksLoaded) {
                return this.userConfiguration.value.loadConfiguration();
            }
            return this.doReset(settingsConfiguration);
        }
        reparse(parseOptions) {
            this.configurationParseOptions = { ...this.configurationParseOptions, ...parseOptions };
            return this.userConfiguration.value.reparse(this.configurationParseOptions);
        }
        getRestrictedSettings() {
            return this.userConfiguration.value.getRestrictedSettings();
        }
    }
    exports.UserConfiguration = UserConfiguration;
    class FileServiceBasedConfiguration extends lifecycle_1.Disposable {
        constructor(name, settingsResource, standAloneConfigurationResources, configurationParseOptions, fileService, uriIdentityService, logService) {
            super();
            this.settingsResource = settingsResource;
            this.standAloneConfigurationResources = standAloneConfigurationResources;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.allResources = [this.settingsResource, ...this.standAloneConfigurationResources.map(([, resource]) => resource)];
            this._register((0, lifecycle_1.combinedDisposable)(...this.allResources.map(resource => (0, lifecycle_1.combinedDisposable)(this.fileService.watch(uriIdentityService.extUri.dirname(resource)), 
            // Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
            this.fileService.watch(resource)))));
            this._folderSettingsModelParser = new configurationModels_1.ConfigurationModelParser(name);
            this._folderSettingsParseOptions = configurationParseOptions;
            this._standAloneConfigurations = [];
            this._cache = new configurationModels_1.ConfigurationModel();
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.fileService.onDidFilesChange, e => this.handleFileChangesEvent(e)), event_1.Event.filter(this.fileService.onDidRunOperation, e => this.handleFileOperationEvent(e))), () => undefined, 100)(() => this._onDidChange.fire()));
        }
        async resolveContents(donotResolveSettings) {
            const resolveContents = async (resources) => {
                return Promise.all(resources.map(async (resource) => {
                    try {
                        const content = await this.fileService.readFile(resource, { atomic: true });
                        return content.value.toString();
                    }
                    catch (error) {
                        this.logService.trace(`Error while resolving configuration file '${resource.toString()}': ${errors.getErrorMessage(error)}`);
                        if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */
                            && error.fileOperationResult !== 9 /* FileOperationResult.FILE_NOT_DIRECTORY */) {
                            this.logService.error(error);
                        }
                    }
                    return '{}';
                }));
            };
            const [[settingsContent], standAloneConfigurationContents] = await Promise.all([
                donotResolveSettings ? Promise.resolve([undefined]) : resolveContents([this.settingsResource]),
                resolveContents(this.standAloneConfigurationResources.map(([, resource]) => resource)),
            ]);
            return [settingsContent, standAloneConfigurationContents.map((content, index) => ([this.standAloneConfigurationResources[index][0], content]))];
        }
        async loadConfiguration(settingsConfiguration) {
            const [settingsContent, standAloneConfigurationContents] = await this.resolveContents(!!settingsConfiguration);
            // reset
            this._standAloneConfigurations = [];
            this._folderSettingsModelParser.parse('', this._folderSettingsParseOptions);
            // parse
            if (settingsContent !== undefined) {
                this._folderSettingsModelParser.parse(settingsContent, this._folderSettingsParseOptions);
            }
            for (let index = 0; index < standAloneConfigurationContents.length; index++) {
                const contents = standAloneConfigurationContents[index][1];
                if (contents !== undefined) {
                    const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(this.standAloneConfigurationResources[index][1].toString(), this.standAloneConfigurationResources[index][0]);
                    standAloneConfigurationModelParser.parse(contents);
                    this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                }
            }
            // Consolidate (support *.json files in the workspace settings folder)
            this.consolidate(settingsConfiguration);
            return this._cache;
        }
        getRestrictedSettings() {
            return this._folderSettingsModelParser.restrictedConfigurations;
        }
        reparse(configurationParseOptions) {
            const oldContents = this._folderSettingsModelParser.configurationModel.contents;
            this._folderSettingsParseOptions = configurationParseOptions;
            this._folderSettingsModelParser.reparse(this._folderSettingsParseOptions);
            if (!(0, objects_1.equals)(oldContents, this._folderSettingsModelParser.configurationModel.contents)) {
                this.consolidate();
            }
            return this._cache;
        }
        consolidate(settingsConfiguration) {
            this._cache = (settingsConfiguration ?? this._folderSettingsModelParser.configurationModel).merge(...this._standAloneConfigurations);
        }
        handleFileChangesEvent(event) {
            // One of the resources has changed
            if (this.allResources.some(resource => event.contains(resource))) {
                return true;
            }
            // One of the resource's parent got deleted
            if (this.allResources.some(resource => event.contains(this.uriIdentityService.extUri.dirname(resource), 2 /* FileChangeType.DELETED */))) {
                return true;
            }
            return false;
        }
        handleFileOperationEvent(event) {
            // One of the resources has changed
            if ((event.isOperation(0 /* FileOperation.CREATE */) || event.isOperation(3 /* FileOperation.COPY */) || event.isOperation(1 /* FileOperation.DELETE */) || event.isOperation(4 /* FileOperation.WRITE */))
                && this.allResources.some(resource => this.uriIdentityService.extUri.isEqual(event.resource, resource))) {
                return true;
            }
            // One of the resource's parent got deleted
            if (event.isOperation(1 /* FileOperation.DELETE */) && this.allResources.some(resource => this.uriIdentityService.extUri.isEqual(event.resource, this.uriIdentityService.extUri.dirname(resource)))) {
                return true;
            }
            return false;
        }
    }
    class RemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache, fileService, uriIdentityService, remoteAgentService) {
            super();
            this._userConfigurationInitializationPromise = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onDidInitialize = this._register(new event_1.Emitter());
            this.onDidInitialize = this._onDidInitialize.event;
            this._fileService = fileService;
            this._userConfiguration = this._cachedConfiguration = new CachedRemoteUserConfiguration(remoteAuthority, configurationCache, { scopes: configuration_1.REMOTE_MACHINE_SCOPES });
            remoteAgentService.getEnvironment().then(async (environment) => {
                if (environment) {
                    const userConfiguration = this._register(new FileServiceBasedRemoteUserConfiguration(environment.settingsPath, { scopes: configuration_1.REMOTE_MACHINE_SCOPES }, this._fileService, uriIdentityService));
                    this._register(userConfiguration.onDidChangeConfiguration(configurationModel => this.onDidUserConfigurationChange(configurationModel)));
                    this._userConfigurationInitializationPromise = userConfiguration.initialize();
                    const configurationModel = await this._userConfigurationInitializationPromise;
                    this._userConfiguration.dispose();
                    this._userConfiguration = userConfiguration;
                    this.onDidUserConfigurationChange(configurationModel);
                    this._onDidInitialize.fire(configurationModel);
                }
            });
        }
        async initialize() {
            if (this._userConfiguration instanceof FileServiceBasedRemoteUserConfiguration) {
                return this._userConfiguration.initialize();
            }
            // Initialize cached configuration
            let configurationModel = await this._userConfiguration.initialize();
            if (this._userConfigurationInitializationPromise) {
                // Use user configuration
                configurationModel = await this._userConfigurationInitializationPromise;
                this._userConfigurationInitializationPromise = null;
            }
            return configurationModel;
        }
        reload() {
            return this._userConfiguration.reload();
        }
        reparse() {
            return this._userConfiguration.reparse({ scopes: configuration_1.REMOTE_MACHINE_SCOPES });
        }
        getRestrictedSettings() {
            return this._userConfiguration.getRestrictedSettings();
        }
        onDidUserConfigurationChange(configurationModel) {
            this.updateCache();
            this._onDidChangeConfiguration.fire(configurationModel);
        }
        async updateCache() {
            if (this._userConfiguration instanceof FileServiceBasedRemoteUserConfiguration) {
                let content;
                try {
                    content = await this._userConfiguration.resolveContent();
                }
                catch (error) {
                    if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        return;
                    }
                }
                await this._cachedConfiguration.updateConfiguration(content);
            }
        }
    }
    exports.RemoteUserConfiguration = RemoteUserConfiguration;
    class FileServiceBasedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(configurationResource, configurationParseOptions, fileService, uriIdentityService) {
            super();
            this.configurationResource = configurationResource;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.fileWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.directoryWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.parser = new configurationModels_1.ConfigurationModelParser(this.configurationResource.toString());
            this.parseOptions = configurationParseOptions;
            this._register(fileService.onDidFilesChange(e => this.handleFileChangesEvent(e)));
            this._register(fileService.onDidRunOperation(e => this.handleFileOperationEvent(e)));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this.reload().then(configurationModel => this._onDidChangeConfiguration.fire(configurationModel)), 50));
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.stopWatchingResource();
                this.stopWatchingDirectory();
            }));
        }
        watchResource() {
            this.fileWatcherDisposable.value = this.fileService.watch(this.configurationResource);
        }
        stopWatchingResource() {
            this.fileWatcherDisposable.value = undefined;
        }
        watchDirectory() {
            const directory = this.uriIdentityService.extUri.dirname(this.configurationResource);
            this.directoryWatcherDisposable.value = this.fileService.watch(directory);
        }
        stopWatchingDirectory() {
            this.directoryWatcherDisposable.value = undefined;
        }
        async initialize() {
            const exists = await this.fileService.exists(this.configurationResource);
            this.onResourceExists(exists);
            return this.reload();
        }
        async resolveContent() {
            const content = await this.fileService.readFile(this.configurationResource, { atomic: true });
            return content.value.toString();
        }
        async reload() {
            try {
                const content = await this.resolveContent();
                this.parser.parse(content, this.parseOptions);
                return this.parser.configurationModel;
            }
            catch (e) {
                return new configurationModels_1.ConfigurationModel();
            }
        }
        reparse(configurationParseOptions) {
            this.parseOptions = configurationParseOptions;
            this.parser.reparse(this.parseOptions);
            return this.parser.configurationModel;
        }
        getRestrictedSettings() {
            return this.parser.restrictedConfigurations;
        }
        handleFileChangesEvent(event) {
            // Find changes that affect the resource
            let affectedByChanges = event.contains(this.configurationResource, 0 /* FileChangeType.UPDATED */);
            if (event.contains(this.configurationResource, 1 /* FileChangeType.ADDED */)) {
                affectedByChanges = true;
                this.onResourceExists(true);
            }
            else if (event.contains(this.configurationResource, 2 /* FileChangeType.DELETED */)) {
                affectedByChanges = true;
                this.onResourceExists(false);
            }
            if (affectedByChanges) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        handleFileOperationEvent(event) {
            if ((event.isOperation(0 /* FileOperation.CREATE */) || event.isOperation(3 /* FileOperation.COPY */) || event.isOperation(1 /* FileOperation.DELETE */) || event.isOperation(4 /* FileOperation.WRITE */))
                && this.uriIdentityService.extUri.isEqual(event.resource, this.configurationResource)) {
                this.reloadConfigurationScheduler.schedule();
            }
        }
        onResourceExists(exists) {
            if (exists) {
                this.stopWatchingDirectory();
                this.watchResource();
            }
            else {
                this.stopWatchingResource();
                this.watchDirectory();
            }
        }
    }
    class CachedRemoteUserConfiguration extends lifecycle_1.Disposable {
        constructor(remoteAuthority, configurationCache, configurationParseOptions) {
            super();
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.key = { type: 'user', key: remoteAuthority };
            this.parser = new configurationModels_1.ConfigurationModelParser('CachedRemoteUserConfiguration');
            this.parseOptions = configurationParseOptions;
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        getConfigurationModel() {
            return this.configurationModel;
        }
        initialize() {
            return this.reload();
        }
        reparse(configurationParseOptions) {
            this.parseOptions = configurationParseOptions;
            this.parser.reparse(this.parseOptions);
            this.configurationModel = this.parser.configurationModel;
            return this.configurationModel;
        }
        getRestrictedSettings() {
            return this.parser.restrictedConfigurations;
        }
        async reload() {
            try {
                const content = await this.configurationCache.read(this.key);
                const parsed = JSON.parse(content);
                if (parsed.content) {
                    this.parser.parse(parsed.content, this.parseOptions);
                    this.configurationModel = this.parser.configurationModel;
                }
            }
            catch (e) { /* Ignore error */ }
            return this.configurationModel;
        }
        async updateConfiguration(content) {
            if (content) {
                return this.configurationCache.write(this.key, JSON.stringify({ content }));
            }
            else {
                return this.configurationCache.remove(this.key);
            }
        }
    }
    class WorkspaceConfiguration extends lifecycle_1.Disposable {
        get initialized() { return this._initialized; }
        constructor(configurationCache, fileService, uriIdentityService, logService) {
            super();
            this.configurationCache = configurationCache;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._workspaceConfigurationDisposables = this._register(new lifecycle_1.DisposableStore());
            this._workspaceIdentifier = null;
            this._isWorkspaceTrusted = false;
            this._onDidUpdateConfiguration = this._register(new event_1.Emitter());
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this._initialized = false;
            this.fileService = fileService;
            this._workspaceConfiguration = this._cachedConfiguration = new CachedWorkspaceConfiguration(configurationCache);
        }
        async initialize(workspaceIdentifier, workspaceTrusted) {
            this._workspaceIdentifier = workspaceIdentifier;
            this._isWorkspaceTrusted = workspaceTrusted;
            if (!this._initialized) {
                if (this.configurationCache.needsCaching(this._workspaceIdentifier.configPath)) {
                    this._workspaceConfiguration = this._cachedConfiguration;
                    this.waitAndInitialize(this._workspaceIdentifier);
                }
                else {
                    this.doInitialize(new FileServiceBasedWorkspaceConfiguration(this.fileService, this.uriIdentityService, this.logService));
                }
            }
            await this.reload();
        }
        async reload() {
            if (this._workspaceIdentifier) {
                await this._workspaceConfiguration.load(this._workspaceIdentifier, { scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
            }
        }
        getFolders() {
            return this._workspaceConfiguration.getFolders();
        }
        setFolders(folders, jsonEditingService) {
            if (this._workspaceIdentifier) {
                return jsonEditingService.write(this._workspaceIdentifier.configPath, [{ path: ['folders'], value: folders }], true)
                    .then(() => this.reload());
            }
            return Promise.resolve();
        }
        isTransient() {
            return this._workspaceConfiguration.isTransient();
        }
        getConfiguration() {
            return this._workspaceConfiguration.getWorkspaceSettings();
        }
        updateWorkspaceTrust(trusted) {
            this._isWorkspaceTrusted = trusted;
            return this.reparseWorkspaceSettings();
        }
        reparseWorkspaceSettings() {
            this._workspaceConfiguration.reparseWorkspaceSettings({ scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
            return this.getConfiguration();
        }
        getRestrictedSettings() {
            return this._workspaceConfiguration.getRestrictedSettings();
        }
        async waitAndInitialize(workspaceIdentifier) {
            await (0, files_1.whenProviderRegistered)(workspaceIdentifier.configPath, this.fileService);
            if (!(this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration)) {
                const fileServiceBasedWorkspaceConfiguration = this._register(new FileServiceBasedWorkspaceConfiguration(this.fileService, this.uriIdentityService, this.logService));
                await fileServiceBasedWorkspaceConfiguration.load(workspaceIdentifier, { scopes: configuration_1.WORKSPACE_SCOPES, skipRestricted: this.isUntrusted() });
                this.doInitialize(fileServiceBasedWorkspaceConfiguration);
                this.onDidWorkspaceConfigurationChange(false, true);
            }
        }
        doInitialize(fileServiceBasedWorkspaceConfiguration) {
            this._workspaceConfigurationDisposables.clear();
            this._workspaceConfiguration = this._workspaceConfigurationDisposables.add(fileServiceBasedWorkspaceConfiguration);
            this._workspaceConfigurationDisposables.add(this._workspaceConfiguration.onDidChange(e => this.onDidWorkspaceConfigurationChange(true, false)));
            this._initialized = true;
        }
        isUntrusted() {
            return !this._isWorkspaceTrusted;
        }
        async onDidWorkspaceConfigurationChange(reload, fromCache) {
            if (reload) {
                await this.reload();
            }
            this.updateCache();
            this._onDidUpdateConfiguration.fire(fromCache);
        }
        async updateCache() {
            if (this._workspaceIdentifier && this.configurationCache.needsCaching(this._workspaceIdentifier.configPath) && this._workspaceConfiguration instanceof FileServiceBasedWorkspaceConfiguration) {
                const content = await this._workspaceConfiguration.resolveContent(this._workspaceIdentifier);
                await this._cachedConfiguration.updateWorkspace(this._workspaceIdentifier, content);
            }
        }
    }
    exports.WorkspaceConfiguration = WorkspaceConfiguration;
    class FileServiceBasedWorkspaceConfiguration extends lifecycle_1.Disposable {
        constructor(fileService, uriIdentityService, logService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this._workspaceIdentifier = null;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = new configurationModels_1.ConfigurationModel();
            this._register(event_1.Event.any(event_1.Event.filter(this.fileService.onDidFilesChange, e => !!this._workspaceIdentifier && e.contains(this._workspaceIdentifier.configPath)), event_1.Event.filter(this.fileService.onDidRunOperation, e => !!this._workspaceIdentifier && (e.isOperation(0 /* FileOperation.CREATE */) || e.isOperation(3 /* FileOperation.COPY */) || e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(4 /* FileOperation.WRITE */)) && uriIdentityService.extUri.isEqual(e.resource, this._workspaceIdentifier.configPath)))(() => this.reloadConfigurationScheduler.schedule()));
            this.reloadConfigurationScheduler = this._register(new async_1.RunOnceScheduler(() => this._onDidChange.fire(), 50));
            this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
        }
        get workspaceIdentifier() {
            return this._workspaceIdentifier;
        }
        async resolveContent(workspaceIdentifier) {
            const content = await this.fileService.readFile(workspaceIdentifier.configPath, { atomic: true });
            return content.value.toString();
        }
        async load(workspaceIdentifier, configurationParseOptions) {
            if (!this._workspaceIdentifier || this._workspaceIdentifier.id !== workspaceIdentifier.id) {
                this._workspaceIdentifier = workspaceIdentifier;
                this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(this._workspaceIdentifier.id);
                (0, lifecycle_1.dispose)(this.workspaceConfigWatcher);
                this.workspaceConfigWatcher = this._register(this.watchWorkspaceConfigurationFile());
            }
            let contents = '';
            try {
                contents = await this.resolveContent(this._workspaceIdentifier);
            }
            catch (error) {
                const exists = await this.fileService.exists(this._workspaceIdentifier.configPath);
                if (exists) {
                    this.logService.error(error);
                }
            }
            this.workspaceConfigurationModelParser.parse(contents, configurationParseOptions);
            this.consolidate();
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        isTransient() {
            return this.workspaceConfigurationModelParser.transient;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reparseWorkspaceSettings(configurationParseOptions) {
            this.workspaceConfigurationModelParser.reparseWorkspaceSettings(configurationParseOptions);
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        getRestrictedSettings() {
            return this.workspaceConfigurationModelParser.getRestrictedWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
        }
        watchWorkspaceConfigurationFile() {
            return this._workspaceIdentifier ? this.fileService.watch(this._workspaceIdentifier.configPath) : lifecycle_1.Disposable.None;
        }
    }
    class CachedWorkspaceConfiguration {
        constructor(configurationCache) {
            this.configurationCache = configurationCache;
            this.onDidChange = event_1.Event.None;
            this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser('');
            this.workspaceSettings = new configurationModels_1.ConfigurationModel();
        }
        async load(workspaceIdentifier, configurationParseOptions) {
            try {
                const key = this.getKey(workspaceIdentifier);
                const contents = await this.configurationCache.read(key);
                const parsed = JSON.parse(contents);
                if (parsed.content) {
                    this.workspaceConfigurationModelParser = new configurationModels_2.WorkspaceConfigurationModelParser(key.key);
                    this.workspaceConfigurationModelParser.parse(parsed.content, configurationParseOptions);
                    this.consolidate();
                }
            }
            catch (e) {
            }
        }
        get workspaceIdentifier() {
            return null;
        }
        getConfigurationModel() {
            return this.workspaceConfigurationModelParser.configurationModel;
        }
        getFolders() {
            return this.workspaceConfigurationModelParser.folders;
        }
        isTransient() {
            return this.workspaceConfigurationModelParser.transient;
        }
        getWorkspaceSettings() {
            return this.workspaceSettings;
        }
        reparseWorkspaceSettings(configurationParseOptions) {
            this.workspaceConfigurationModelParser.reparseWorkspaceSettings(configurationParseOptions);
            this.consolidate();
            return this.getWorkspaceSettings();
        }
        getRestrictedSettings() {
            return this.workspaceConfigurationModelParser.getRestrictedWorkspaceSettings();
        }
        consolidate() {
            this.workspaceSettings = this.workspaceConfigurationModelParser.settingsModel.merge(this.workspaceConfigurationModelParser.launchModel, this.workspaceConfigurationModelParser.tasksModel);
        }
        async updateWorkspace(workspaceIdentifier, content) {
            try {
                const key = this.getKey(workspaceIdentifier);
                if (content) {
                    await this.configurationCache.write(key, JSON.stringify({ content }));
                }
                else {
                    await this.configurationCache.remove(key);
                }
            }
            catch (error) {
            }
        }
        getKey(workspaceIdentifier) {
            return {
                type: 'workspaces',
                key: workspaceIdentifier.id
            };
        }
    }
    class CachedFolderConfiguration {
        constructor(folder, configFolderRelativePath, configurationParseOptions, configurationCache) {
            this.configurationCache = configurationCache;
            this.onDidChange = event_1.Event.None;
            this.key = { type: 'folder', key: (0, hash_1.hash)((0, resources_1.joinPath)(folder, configFolderRelativePath).toString()).toString(16) };
            this._folderSettingsModelParser = new configurationModels_1.ConfigurationModelParser('CachedFolderConfiguration');
            this._folderSettingsParseOptions = configurationParseOptions;
            this._standAloneConfigurations = [];
            this.configurationModel = new configurationModels_1.ConfigurationModel();
        }
        async loadConfiguration() {
            try {
                const contents = await this.configurationCache.read(this.key);
                const { content: configurationContents } = JSON.parse(contents.toString());
                if (configurationContents) {
                    for (const key of Object.keys(configurationContents)) {
                        if (key === configuration_1.FOLDER_SETTINGS_NAME) {
                            this._folderSettingsModelParser.parse(configurationContents[key], this._folderSettingsParseOptions);
                        }
                        else {
                            const standAloneConfigurationModelParser = new configurationModels_2.StandaloneConfigurationModelParser(key, key);
                            standAloneConfigurationModelParser.parse(configurationContents[key]);
                            this._standAloneConfigurations.push(standAloneConfigurationModelParser.configurationModel);
                        }
                    }
                }
                this.consolidate();
            }
            catch (e) {
            }
            return this.configurationModel;
        }
        async updateConfiguration(settingsContent, standAloneConfigurationContents) {
            const content = {};
            if (settingsContent) {
                content[configuration_1.FOLDER_SETTINGS_NAME] = settingsContent;
            }
            standAloneConfigurationContents.forEach(([key, contents]) => {
                if (contents) {
                    content[key] = contents;
                }
            });
            if (Object.keys(content).length) {
                await this.configurationCache.write(this.key, JSON.stringify({ content }));
            }
            else {
                await this.configurationCache.remove(this.key);
            }
        }
        getRestrictedSettings() {
            return this._folderSettingsModelParser.restrictedConfigurations;
        }
        reparse(configurationParseOptions) {
            this._folderSettingsParseOptions = configurationParseOptions;
            this._folderSettingsModelParser.reparse(this._folderSettingsParseOptions);
            this.consolidate();
            return this.configurationModel;
        }
        consolidate() {
            this.configurationModel = this._folderSettingsModelParser.configurationModel.merge(...this._standAloneConfigurations);
        }
        getUnsupportedKeys() {
            return [];
        }
    }
    class FolderConfiguration extends lifecycle_1.Disposable {
        constructor(useCache, workspaceFolder, configFolderRelativePath, workbenchState, workspaceTrusted, fileService, uriIdentityService, logService, configurationCache) {
            super();
            this.workspaceFolder = workspaceFolder;
            this.workbenchState = workbenchState;
            this.workspaceTrusted = workspaceTrusted;
            this.configurationCache = configurationCache;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.scopes = 3 /* WorkbenchState.WORKSPACE */ === this.workbenchState ? configuration_1.FOLDER_SCOPES : configuration_1.WORKSPACE_SCOPES;
            this.configurationFolder = uriIdentityService.extUri.joinPath(workspaceFolder.uri, configFolderRelativePath);
            this.cachedFolderConfiguration = new CachedFolderConfiguration(workspaceFolder.uri, configFolderRelativePath, { scopes: this.scopes, skipRestricted: this.isUntrusted() }, configurationCache);
            if (useCache && this.configurationCache.needsCaching(workspaceFolder.uri)) {
                this.folderConfiguration = this.cachedFolderConfiguration;
                (0, files_1.whenProviderRegistered)(workspaceFolder.uri, fileService)
                    .then(() => {
                    this.folderConfiguration = this._register(this.createFileServiceBasedConfiguration(fileService, uriIdentityService, logService));
                    this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
                    this.onDidFolderConfigurationChange();
                });
            }
            else {
                this.folderConfiguration = this._register(this.createFileServiceBasedConfiguration(fileService, uriIdentityService, logService));
                this._register(this.folderConfiguration.onDidChange(e => this.onDidFolderConfigurationChange()));
            }
        }
        loadConfiguration() {
            return this.folderConfiguration.loadConfiguration();
        }
        updateWorkspaceTrust(trusted) {
            this.workspaceTrusted = trusted;
            return this.reparse();
        }
        reparse() {
            const configurationModel = this.folderConfiguration.reparse({ scopes: this.scopes, skipRestricted: this.isUntrusted() });
            this.updateCache();
            return configurationModel;
        }
        getRestrictedSettings() {
            return this.folderConfiguration.getRestrictedSettings();
        }
        isUntrusted() {
            return !this.workspaceTrusted;
        }
        onDidFolderConfigurationChange() {
            this.updateCache();
            this._onDidChange.fire();
        }
        createFileServiceBasedConfiguration(fileService, uriIdentityService, logService) {
            const settingsResource = uriIdentityService.extUri.joinPath(this.configurationFolder, `${configuration_1.FOLDER_SETTINGS_NAME}.json`);
            const standAloneConfigurationResources = [configuration_1.TASKS_CONFIGURATION_KEY, configuration_1.LAUNCH_CONFIGURATION_KEY].map(name => ([name, uriIdentityService.extUri.joinPath(this.configurationFolder, `${name}.json`)]));
            return new FileServiceBasedConfiguration(this.configurationFolder.toString(), settingsResource, standAloneConfigurationResources, { scopes: this.scopes, skipRestricted: this.isUntrusted() }, fileService, uriIdentityService, logService);
        }
        async updateCache() {
            if (this.configurationCache.needsCaching(this.configurationFolder) && this.folderConfiguration instanceof FileServiceBasedConfiguration) {
                const [settingsContent, standAloneConfigurationContents] = await this.folderConfiguration.resolveContents();
                this.cachedFolderConfiguration.updateConfiguration(settingsContent, standAloneConfigurationContents);
            }
        }
    }
    exports.FolderConfiguration = FolderConfiguration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb24vYnJvd3Nlci9jb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEcsTUFBYSxvQkFBcUIsU0FBUSxxQ0FBd0I7aUJBRWpELHVDQUFrQyxHQUFHLDZCQUE2QixBQUFoQyxDQUFpQztRQVFuRixZQUNrQixrQkFBdUMsRUFDeEQsa0JBQXVEO1lBRXZELEtBQUssRUFBRSxDQUFDO1lBSFMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQVB4QywwQkFBcUIsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMvRix5Q0FBb0MsR0FBMkIsRUFBRSxDQUFDO1lBQ3pELGFBQVEsR0FBcUIsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxnQ0FBZ0MsRUFBRSxDQUFDO1lBRWxHLGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBT3BDLElBQUksa0JBQWtCLENBQUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLENBQUM7Z0JBQ3ZELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3SCxDQUFDO1FBQ0YsQ0FBQztRQUVrQixnQ0FBZ0M7WUFDbEQsT0FBTyxJQUFJLENBQUMsb0NBQW9DLENBQUM7UUFDbEQsQ0FBQztRQUVRLEtBQUssQ0FBQyxVQUFVO1lBQ3hCLE1BQU0sSUFBSSxDQUFDLDhDQUE4QyxFQUFFLENBQUM7WUFDNUQsT0FBTyxLQUFLLENBQUMsVUFBVSxFQUFFLENB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