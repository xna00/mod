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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurations", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/configuration/common/configurationEditing", "vs/workbench/services/configuration/browser/configuration", "vs/base/common/performance", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/types", "vs/nls", "vs/platform/policy/common/policy", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/common/configuration", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, uri_1, event_1, map_1, objects_1, lifecycle_1, async_1, jsonContributionRegistry_1, workspace_1, configurationModels_1, configuration_1, configurations_1, configurationModels_2, configuration_2, platform_1, configurationRegistry_1, workspaces_1, configurationEditing_1, configuration_3, performance_1, environmentService_1, contributions_1, lifecycle_2, errorMessage_1, workspaceTrust_1, arrays_1, extensions_1, assignmentService_1, types_1, nls_1, policy_1, jsonEditing_1, configuration_4, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceService = void 0;
    function getLocalUserConfigurationScopes(userDataProfile, hasRemote) {
        return (userDataProfile.isDefault || userDataProfile.useDefaultFlags?.settings)
            ? hasRemote ? configuration_2.LOCAL_MACHINE_SCOPES : undefined
            : hasRemote ? configuration_2.LOCAL_MACHINE_PROFILE_SCOPES : configuration_2.PROFILE_SCOPES;
    }
    class Workspace extends workspace_1.Workspace {
        constructor() {
            super(...arguments);
            this.initialized = false;
        }
    }
    class WorkspaceService extends lifecycle_1.Disposable {
        get restrictedSettings() { return this._restrictedSettings; }
        constructor({ remoteAuthority, configurationCache }, environmentService, userDataProfileService, userDataProfilesService, fileService, remoteAgentService, uriIdentityService, logService, policyService) {
            super();
            this.userDataProfileService = userDataProfileService;
            this.userDataProfilesService = userDataProfilesService;
            this.fileService = fileService;
            this.remoteAgentService = remoteAgentService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.initialized = false;
            this.applicationConfiguration = null;
            this.remoteUserConfiguration = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onWillChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceName = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkbenchState = this._register(new event_1.Emitter());
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            this.isWorkspaceTrusted = true;
            this._restrictedSettings = { default: [] };
            this._onDidChangeRestrictedSettings = this._register(new event_1.Emitter());
            this.onDidChangeRestrictedSettings = this._onDidChangeRestrictedSettings.event;
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.initRemoteUserConfigurationBarrier = new async_1.Barrier();
            this.completeWorkspaceBarrier = new async_1.Barrier();
            this.defaultConfiguration = this._register(new configuration_3.DefaultConfiguration(configurationCache, environmentService));
            this.policyConfiguration = policyService instanceof policy_1.NullPolicyService ? new configurations_1.NullPolicyConfiguration() : this._register(new configurations_1.PolicyConfiguration(this.defaultConfiguration, policyService, logService));
            this.configurationCache = configurationCache;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
            this.applicationConfigurationDisposables = this._register(new lifecycle_1.DisposableStore());
            this.createApplicationConfiguration();
            this.localUserConfiguration = this._register(new configuration_3.UserConfiguration(userDataProfileService.currentProfile.settingsResource, userDataProfileService.currentProfile.tasksResource, { scopes: getLocalUserConfigurationScopes(userDataProfileService.currentProfile, !!remoteAuthority) }, fileService, uriIdentityService, logService));
            this.cachedFolderConfigs = new map_1.ResourceMap();
            this._register(this.localUserConfiguration.onDidChangeConfiguration(userConfiguration => this.onLocalUserConfigurationChanged(userConfiguration)));
            if (remoteAuthority) {
                const remoteUserConfiguration = this.remoteUserConfiguration = this._register(new configuration_3.RemoteUserConfiguration(remoteAuthority, configurationCache, fileService, uriIdentityService, remoteAgentService));
                this._register(remoteUserConfiguration.onDidInitialize(remoteUserConfigurationModel => {
                    this._register(remoteUserConfiguration.onDidChangeConfiguration(remoteUserConfigurationModel => this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel)));
                    this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel);
                    this.initRemoteUserConfigurationBarrier.open();
                }));
            }
            else {
                this.initRemoteUserConfigurationBarrier.open();
            }
            this.workspaceConfiguration = this._register(new configuration_3.WorkspaceConfiguration(configurationCache, fileService, uriIdentityService, logService));
            this._register(this.workspaceConfiguration.onDidUpdateConfiguration(fromCache => {
                this.onWorkspaceConfigurationChanged(fromCache).then(() => {
                    this.workspace.initialized = this.workspaceConfiguration.initialized;
                    this.checkAndMarkWorkspaceComplete(fromCache);
                });
            }));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(({ properties, defaults }) => this.onDefaultConfigurationChanged(defaults, properties)));
            this._register(this.policyConfiguration.onDidChangeConfiguration(configurationModel => this.onPolicyConfigurationChanged(configurationModel)));
            this._register(userDataProfileService.onDidChangeCurrentProfile(e => this.onUserDataProfileChanged(e)));
            this.workspaceEditingQueue = new async_1.Queue();
        }
        createApplicationConfiguration() {
            this.applicationConfigurationDisposables.clear();
            if (this.userDataProfileService.currentProfile.isDefault || this.userDataProfileService.currentProfile.useDefaultFlags?.settings) {
                this.applicationConfiguration = null;
            }
            else {
                this.applicationConfiguration = this.applicationConfigurationDisposables.add(this._register(new configuration_3.ApplicationConfiguration(this.userDataProfilesService, this.fileService, this.uriIdentityService)));
                this.applicationConfigurationDisposables.add(this.applicationConfiguration.onDidChangeConfiguration(configurationModel => this.onApplicationConfigurationChanged(configurationModel)));
            }
        }
        // Workspace Context Service Impl
        async getCompleteWorkspace() {
            await this.completeWorkspaceBarrier.wait();
            return this.getWorkspace();
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            // Workspace has configuration file
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            // Folder has single root
            if (this.workspace.folders.length === 1) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            // Empty
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        addFolders(foldersToAdd, index) {
            return this.updateFolders(foldersToAdd, [], index);
        }
        removeFolders(foldersToRemove) {
            return this.updateFolders([], foldersToRemove);
        }
        async updateFolders(foldersToAdd, foldersToRemove, index) {
            return this.workspaceEditingQueue.queue(() => this.doUpdateFolders(foldersToAdd, foldersToRemove, index));
        }
        isInsideWorkspace(resource) {
            return !!this.getWorkspaceFolder(resource);
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */: {
                    let folderUri = undefined;
                    if (uri_1.URI.isUri(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder;
                    }
                    else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder.uri;
                    }
                    return uri_1.URI.isUri(folderUri) && this.uriIdentityService.extUri.isEqual(folderUri, this.workspace.folders[0].uri);
                }
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, workspace_1.isWorkspaceIdentifier)(workspaceIdOrFolder) && this.workspace.id === workspaceIdOrFolder.id;
            }
            return false;
        }
        async doUpdateFolders(foldersToAdd, foldersToRemove, index) {
            if (this.getWorkbenchState() !== 3 /* WorkbenchState.WORKSPACE */) {
                return Promise.resolve(undefined); // we need a workspace to begin with
            }
            if (foldersToAdd.length + foldersToRemove.length === 0) {
                return Promise.resolve(undefined); // nothing to do
            }
            let foldersHaveChanged = false;
            // Remove first (if any)
            let currentWorkspaceFolders = this.getWorkspace().folders;
            let newStoredFolders = currentWorkspaceFolders.map(f => f.raw).filter((folder, index) => {
                if (!(0, workspaces_1.isStoredWorkspaceFolder)(folder)) {
                    return true; // keep entries which are unrelated
                }
                return !this.contains(foldersToRemove, currentWorkspaceFolders[index].uri); // keep entries which are unrelated
            });
            foldersHaveChanged = currentWorkspaceFolders.length !== newStoredFolders.length;
            // Add afterwards (if any)
            if (foldersToAdd.length) {
                // Recompute current workspace folders if we have folders to add
                const workspaceConfigPath = this.getWorkspace().configuration;
                const workspaceConfigFolder = this.uriIdentityService.extUri.dirname(workspaceConfigPath);
                currentWorkspaceFolders = (0, workspaces_1.toWorkspaceFolders)(newStoredFolders, workspaceConfigPath, this.uriIdentityService.extUri);
                const currentWorkspaceFolderUris = currentWorkspaceFolders.map(folder => folder.uri);
                const storedFoldersToAdd = [];
                for (const folderToAdd of foldersToAdd) {
                    const folderURI = folderToAdd.uri;
                    if (this.contains(currentWorkspaceFolderUris, folderURI)) {
                        continue; // already existing
                    }
                    try {
                        const result = await this.fileService.stat(folderURI);
                        if (!result.isDirectory) {
                            continue;
                        }
                    }
                    catch (e) { /* Ignore */ }
                    storedFoldersToAdd.push((0, workspaces_1.getStoredWorkspaceFolder)(folderURI, false, folderToAdd.name, workspaceConfigFolder, this.uriIdentityService.extUri));
                }
                // Apply to array of newStoredFolders
                if (storedFoldersToAdd.length > 0) {
                    foldersHaveChanged = true;
                    if (typeof index === 'number' && index >= 0 && index < newStoredFolders.length) {
                        newStoredFolders = newStoredFolders.slice(0);
                        newStoredFolders.splice(index, 0, ...storedFoldersToAdd);
                    }
                    else {
                        newStoredFolders = [...newStoredFolders, ...storedFoldersToAdd];
                    }
                }
            }
            // Set folders if we recorded a change
            if (foldersHaveChanged) {
                return this.setFolders(newStoredFolders);
            }
            return Promise.resolve(undefined);
        }
        async setFolders(folders) {
            if (!this.instantiationService) {
                throw new Error('Cannot update workspace folders because workspace service is not yet ready to accept writes.');
            }
            await this.instantiationService.invokeFunction(accessor => this.workspaceConfiguration.setFolders(folders, accessor.get(jsonEditing_1.IJSONEditingService)));
            return this.onWorkspaceConfigurationChanged(false);
        }
        contains(resources, toCheck) {
            return resources.some(resource => this.uriIdentityService.extUri.isEqual(resource, toCheck));
        }
        // Workspace Configuration Service Impl
        getConfigurationData() {
            return this._configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            return this._configuration.getValue(section, overrides);
        }
        async updateValue(key, value, arg3, arg4, options) {
            const overrides = (0, configuration_1.isConfigurationUpdateOverrides)(arg3) ? arg3
                : (0, configuration_1.isConfigurationOverrides)(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier ? [arg3.overrideIdentifier] : undefined } : undefined;
            const target = overrides ? arg4 : arg3;
            const targets = target ? [target] : [];
            if (overrides?.overrideIdentifiers) {
                overrides.overrideIdentifiers = (0, arrays_1.distinct)(overrides.overrideIdentifiers);
                overrides.overrideIdentifiers = overrides.overrideIdentifiers.length ? overrides.overrideIdentifiers : undefined;
            }
            if (!targets.length) {
                if (overrides?.overrideIdentifiers && overrides.overrideIdentifiers.length > 1) {
                    throw new Error('Configuration Target is required while updating the value for multiple override identifiers');
                }
                const inspect = this.inspect(key, { resource: overrides?.resource, overrideIdentifier: overrides?.overrideIdentifiers ? overrides.overrideIdentifiers[0] : undefined });
                targets.push(...this.deriveConfigurationTargets(key, value, inspect));
                // Remove the setting, if the value is same as default value and is updated only in user target
                if ((0, objects_1.equals)(value, inspect.defaultValue) && targets.length === 1 && (targets[0] === 2 /* ConfigurationTarget.USER */ || targets[0] === 3 /* ConfigurationTarget.USER_LOCAL */)) {
                    value = undefined;
                }
            }
            await async_1.Promises.settled(targets.map(target => this.writeConfigurationValue(key, value, target, overrides, options)));
        }
        async reloadConfiguration(target) {
            if (target === undefined) {
                this.reloadDefaultConfiguration();
                const application = await this.reloadApplicationConfiguration(true);
                const { local, remote } = await this.reloadUserConfiguration();
                await this.reloadWorkspaceConfiguration();
                await this.loadConfiguration(application, local, remote, true);
                return;
            }
            if ((0, workspace_1.isWorkspaceFolder)(target)) {
                await this.reloadWorkspaceFolderConfiguration(target);
                return;
            }
            switch (target) {
                case 7 /* ConfigurationTarget.DEFAULT */:
                    this.reloadDefaultConfiguration();
                    return;
                case 2 /* ConfigurationTarget.USER */: {
                    const { local, remote } = await this.reloadUserConfiguration();
                    await this.loadConfiguration(this._configuration.applicationConfiguration, local, remote, true);
                    return;
                }
                case 3 /* ConfigurationTarget.USER_LOCAL */:
                    await this.reloadLocalUserConfiguration();
                    return;
                case 4 /* ConfigurationTarget.USER_REMOTE */:
                    await this.reloadRemoteUserConfiguration();
                    return;
                case 5 /* ConfigurationTarget.WORKSPACE */:
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    await this.reloadWorkspaceConfiguration();
                    return;
            }
        }
        hasCachedConfigurationDefaultsOverrides() {
            return this.defaultConfiguration.hasCachedConfigurationDefaultsOverrides();
        }
        inspect(key, overrides) {
            return this._configuration.inspect(key, overrides);
        }
        keys() {
            return this._configuration.keys();
        }
        async whenRemoteConfigurationLoaded() {
            await this.initRemoteUserConfigurationBarrier.wait();
        }
        /**
         * At present, all workspaces (empty, single-folder, multi-root) in local and remote
         * can be initialized without requiring extension host except following case:
         *
         * A multi root workspace with .code-workspace file that has to be resolved by an extension.
         * Because of readonly `rootPath` property in extension API we have to resolve multi root workspace
         * before extension host starts so that `rootPath` can be set to first folder.
         *
         * This restriction is lifted partially for web in `MainThreadWorkspace`.
         * In web, we start extension host with empty `rootPath` in this case.
         *
         * Related root path issue discussion is being tracked here - https://github.com/microsoft/vscode/issues/69335
         */
        async initialize(arg) {
            (0, performance_1.mark)('code/willInitWorkspaceService');
            const trigger = this.initialized;
            this.initialized = false;
            const workspace = await this.createWorkspace(arg);
            await this.updateWorkspaceAndInitializeConfiguration(workspace, trigger);
            this.checkAndMarkWorkspaceComplete(false);
            (0, performance_1.mark)('code/didInitWorkspaceService');
        }
        updateWorkspaceTrust(trusted) {
            if (this.isWorkspaceTrusted !== trusted) {
                this.isWorkspaceTrusted = trusted;
                const data = this._configuration.toData();
                const folderConfigurationModels = [];
                for (const folder of this.workspace.folders) {
                    const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    let configurationModel;
                    if (folderConfiguration) {
                        configurationModel = folderConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted);
                        this._configuration.updateFolderConfiguration(folder.uri, configurationModel);
                    }
                    folderConfigurationModels.push(configurationModel);
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    if (folderConfigurationModels[0]) {
                        this._configuration.updateWorkspaceConfiguration(folderConfigurationModels[0]);
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted));
                }
                this.updateRestrictedSettings();
                let keys = [];
                if (this.restrictedSettings.userLocal) {
                    keys.push(...this.restrictedSettings.userLocal);
                }
                if (this.restrictedSettings.userRemote) {
                    keys.push(...this.restrictedSettings.userRemote);
                }
                if (this.restrictedSettings.workspace) {
                    keys.push(...this.restrictedSettings.workspace);
                }
                this.restrictedSettings.workspaceFolder?.forEach((value) => keys.push(...value));
                keys = (0, arrays_1.distinct)(keys);
                if (keys.length) {
                    this.triggerConfigurationChange({ keys, overrides: [] }, { data, workspace: this.workspace }, 5 /* ConfigurationTarget.WORKSPACE */);
                }
            }
        }
        acquireInstantiationService(instantiationService) {
            this.instantiationService = instantiationService;
        }
        isSettingAppliedForAllProfiles(key) {
            if (this.configurationRegistry.getConfigurationProperties()[key]?.scope === 1 /* ConfigurationScope.APPLICATION */) {
                return true;
            }
            const allProfilesSettings = this.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            return Array.isArray(allProfilesSettings) && allProfilesSettings.includes(key);
        }
        async createWorkspace(arg) {
            if ((0, workspace_1.isWorkspaceIdentifier)(arg)) {
                return this.createMultiFolderWorkspace(arg);
            }
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(arg)) {
                return this.createSingleFolderWorkspace(arg);
            }
            return this.createEmptyWorkspace(arg);
        }
        async createMultiFolderWorkspace(workspaceIdentifier) {
            await this.workspaceConfiguration.initialize({ id: workspaceIdentifier.id, configPath: workspaceIdentifier.configPath }, this.isWorkspaceTrusted);
            const workspaceConfigPath = workspaceIdentifier.configPath;
            const workspaceFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), workspaceConfigPath, this.uriIdentityService.extUri);
            const workspaceId = workspaceIdentifier.id;
            const workspace = new Workspace(workspaceId, workspaceFolders, this.workspaceConfiguration.isTransient(), workspaceConfigPath, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = this.workspaceConfiguration.initialized;
            return workspace;
        }
        createSingleFolderWorkspace(singleFolderWorkspaceIdentifier) {
            const workspace = new Workspace(singleFolderWorkspaceIdentifier.id, [(0, workspace_1.toWorkspaceFolder)(singleFolderWorkspaceIdentifier.uri)], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return workspace;
        }
        createEmptyWorkspace(emptyWorkspaceIdentifier) {
            const workspace = new Workspace(emptyWorkspaceIdentifier.id, [], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return Promise.resolve(workspace);
        }
        checkAndMarkWorkspaceComplete(fromCache) {
            if (!this.completeWorkspaceBarrier.isOpen() && this.workspace.initialized) {
                this.completeWorkspaceBarrier.open();
                this.validateWorkspaceFoldersAndReload(fromCache);
            }
        }
        async updateWorkspaceAndInitializeConfiguration(workspace, trigger) {
            const hasWorkspaceBefore = !!this.workspace;
            let previousState;
            let previousWorkspacePath;
            let previousFolders = [];
            if (hasWorkspaceBefore) {
                previousState = this.getWorkbenchState();
                previousWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                previousFolders = this.workspace.folders;
                this.workspace.update(workspace);
            }
            else {
                this.workspace = workspace;
            }
            await this.initializeConfiguration(trigger);
            // Trigger changes after configuration initialization so that configuration is up to date.
            if (hasWorkspaceBefore) {
                const newState = this.getWorkbenchState();
                if (previousState && newState !== previousState) {
                    this._onDidChangeWorkbenchState.fire(newState);
                }
                const newWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                if (previousWorkspacePath && newWorkspacePath !== previousWorkspacePath || newState !== previousState) {
                    this._onDidChangeWorkspaceName.fire();
                }
                const folderChanges = this.compareFolders(previousFolders, this.workspace.folders);
                if (folderChanges && (folderChanges.added.length || folderChanges.removed.length || folderChanges.changed.length)) {
                    await this.handleWillChangeWorkspaceFolders(folderChanges, false);
                    this._onDidChangeWorkspaceFolders.fire(folderChanges);
                }
            }
            if (!this.localUserConfiguration.hasTasksLoaded) {
                // Reload local user configuration again to load user tasks
                this._register((0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => this.reloadLocalUserConfiguration(false, this._configuration.localUserConfiguration)));
            }
        }
        compareFolders(currentFolders, newFolders) {
            const result = { added: [], removed: [], changed: [] };
            result.added = newFolders.filter(newFolder => !currentFolders.some(currentFolder => newFolder.uri.toString() === currentFolder.uri.toString()));
            for (let currentIndex = 0; currentIndex < currentFolders.length; currentIndex++) {
                const currentFolder = currentFolders[currentIndex];
                let newIndex = 0;
                for (newIndex = 0; newIndex < newFolders.length && currentFolder.uri.toString() !== newFolders[newIndex].uri.toString(); newIndex++) { }
                if (newIndex < newFolders.length) {
                    if (currentIndex !== newIndex || currentFolder.name !== newFolders[newIndex].name) {
                        result.changed.push(currentFolder);
                    }
                }
                else {
                    result.removed.push(currentFolder);
                }
            }
            return result;
        }
        async initializeConfiguration(trigger) {
            await this.defaultConfiguration.initialize();
            const initPolicyConfigurationPromise = this.policyConfiguration.initialize();
            const initApplicationConfigurationPromise = this.applicationConfiguration ? this.applicationConfiguration.initialize() : Promise.resolve(new configurationModels_1.ConfigurationModel());
            const initUserConfiguration = async () => {
                (0, performance_1.mark)('code/willInitUserConfiguration');
                const result = await Promise.all([this.localUserConfiguration.initialize(), this.remoteUserConfiguration ? this.remoteUserConfiguration.initialize() : Promise.resolve(new configurationModels_1.ConfigurationModel())]);
                if (this.applicationConfiguration) {
                    const applicationConfigurationModel = await initApplicationConfigurationPromise;
                    result[0] = this.localUserConfiguration.reparse({ exclude: applicationConfigurationModel.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) });
                }
                (0, performance_1.mark)('code/didInitUserConfiguration');
                return result;
            };
            const [, application, [local, remote]] = await Promise.all([
                initPolicyConfigurationPromise,
                initApplicationConfigurationPromise,
                initUserConfiguration()
            ]);
            (0, performance_1.mark)('code/willInitWorkspaceConfiguration');
            await this.loadConfiguration(application, local, remote, trigger);
            (0, performance_1.mark)('code/didInitWorkspaceConfiguration');
        }
        reloadDefaultConfiguration() {
            this.onDefaultConfigurationChanged(this.defaultConfiguration.reload());
        }
        async reloadApplicationConfiguration(donotTrigger) {
            if (!this.applicationConfiguration) {
                return new configurationModels_1.ConfigurationModel();
            }
            const model = await this.applicationConfiguration.loadConfiguration();
            if (!donotTrigger) {
                this.onApplicationConfigurationChanged(model);
            }
            return model;
        }
        async reloadUserConfiguration() {
            const [local, remote] = await Promise.all([this.reloadLocalUserConfiguration(true), this.reloadRemoteUserConfiguration(true)]);
            return { local, remote };
        }
        async reloadLocalUserConfiguration(donotTrigger, settingsConfiguration) {
            const model = await this.localUserConfiguration.reload(settingsConfiguration);
            if (!donotTrigger) {
                this.onLocalUserConfigurationChanged(model);
            }
            return model;
        }
        async reloadRemoteUserConfiguration(donotTrigger) {
            if (this.remoteUserConfiguration) {
                const model = await this.remoteUserConfiguration.reload();
                if (!donotTrigger) {
                    this.onRemoteUserConfigurationChanged(model);
                }
                return model;
            }
            return new configurationModels_1.ConfigurationModel();
        }
        async reloadWorkspaceConfiguration() {
            const workbenchState = this.getWorkbenchState();
            if (workbenchState === 2 /* WorkbenchState.FOLDER */) {
                return this.onWorkspaceFolderConfigurationChanged(this.workspace.folders[0]);
            }
            if (workbenchState === 3 /* WorkbenchState.WORKSPACE */) {
                return this.workspaceConfiguration.reload().then(() => this.onWorkspaceConfigurationChanged(false));
            }
        }
        reloadWorkspaceFolderConfiguration(folder) {
            return this.onWorkspaceFolderConfigurationChanged(folder);
        }
        async loadConfiguration(applicationConfigurationModel, userConfigurationModel, remoteUserConfigurationModel, trigger) {
            // reset caches
            this.cachedFolderConfigs = new map_1.ResourceMap();
            const folders = this.workspace.folders;
            const folderConfigurations = await this.loadFolderConfigurations(folders);
            const workspaceConfiguration = this.getWorkspaceConfigurationModel(folderConfigurations);
            const folderConfigurationModels = new map_1.ResourceMap();
            folderConfigurations.forEach((folderConfiguration, index) => folderConfigurationModels.set(folders[index].uri, folderConfiguration));
            const currentConfiguration = this._configuration;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, this.policyConfiguration.configurationModel, applicationConfigurationModel, userConfigurationModel, remoteUserConfigurationModel, workspaceConfiguration, folderConfigurationModels, new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
            this.initialized = true;
            if (trigger) {
                const change = this._configuration.compare(currentConfiguration);
                this.triggerConfigurationChange(change, { data: currentConfiguration.toData(), workspace: this.workspace }, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            this.updateRestrictedSettings();
        }
        getWorkspaceConfigurationModel(folderConfigurations) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return folderConfigurations[0];
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.workspaceConfiguration.getConfiguration();
                default:
                    return new configurationModels_1.ConfigurationModel();
            }
        }
        onUserDataProfileChanged(e) {
            e.join((async () => {
                const promises = [];
                promises.push(this.localUserConfiguration.reset(e.profile.settingsResource, e.profile.tasksResource, { scopes: getLocalUserConfigurationScopes(e.profile, !!this.remoteUserConfiguration) }));
                if (e.previous.isDefault !== e.profile.isDefault
                    || !!e.previous.useDefaultFlags?.settings !== !!e.profile.useDefaultFlags?.settings) {
                    this.createApplicationConfiguration();
                    if (this.applicationConfiguration) {
                        promises.push(this.reloadApplicationConfiguration(true));
                    }
                }
                let [localUser, application] = await Promise.all(promises);
                application = application ?? this._configuration.applicationConfiguration;
                if (this.applicationConfiguration) {
                    localUser = this.localUserConfiguration.reparse({ exclude: application.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) });
                }
                await this.loadConfiguration(application, localUser, this._configuration.remoteUserConfiguration, true);
            })());
        }
        onDefaultConfigurationChanged(configurationModel, properties) {
            if (this.workspace) {
                const previousData = this._configuration.toData();
                const change = this._configuration.compareAndUpdateDefaultConfiguration(configurationModel, properties);
                if (this.applicationConfiguration) {
                    this._configuration.updateApplicationConfiguration(this.applicationConfiguration.reparse());
                }
                if (this.remoteUserConfiguration) {
                    this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reparse());
                    this._configuration.updateRemoteUserConfiguration(this.remoteUserConfiguration.reparse());
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    const folderConfiguration = this.cachedFolderConfigs.get(this.workspace.folders[0].uri);
                    if (folderConfiguration) {
                        this._configuration.updateWorkspaceConfiguration(folderConfiguration.reparse());
                        this._configuration.updateFolderConfiguration(this.workspace.folders[0].uri, folderConfiguration.reparse());
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.reparseWorkspaceSettings());
                    for (const folder of this.workspace.folders) {
                        const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                        if (folderConfiguration) {
                            this._configuration.updateFolderConfiguration(folder.uri, folderConfiguration.reparse());
                        }
                    }
                }
                this.triggerConfigurationChange(change, { data: previousData, workspace: this.workspace }, 7 /* ConfigurationTarget.DEFAULT */);
                this.updateRestrictedSettings();
            }
        }
        onPolicyConfigurationChanged(policyConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdatePolicyConfiguration(policyConfiguration);
            this.triggerConfigurationChange(change, previous, 7 /* ConfigurationTarget.DEFAULT */);
        }
        onApplicationConfigurationChanged(applicationConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const previousAllProfilesSettings = this._configuration.applicationConfiguration.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            const change = this._configuration.compareAndUpdateApplicationConfiguration(applicationConfiguration);
            const currentAllProfilesSettings = this.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            const configurationProperties = this.configurationRegistry.getConfigurationProperties();
            const changedKeys = [];
            for (const changedKey of change.keys) {
                if (configurationProperties[changedKey]?.scope === 1 /* ConfigurationScope.APPLICATION */) {
                    changedKeys.push(changedKey);
                    if (changedKey === configuration_2.APPLY_ALL_PROFILES_SETTING) {
                        for (const previousAllProfileSetting of previousAllProfilesSettings) {
                            if (!currentAllProfilesSettings.includes(previousAllProfileSetting)) {
                                changedKeys.push(previousAllProfileSetting);
                            }
                        }
                        for (const currentAllProfileSetting of currentAllProfilesSettings) {
                            if (!previousAllProfilesSettings.includes(currentAllProfileSetting)) {
                                changedKeys.push(currentAllProfileSetting);
                            }
                        }
                    }
                }
                else if (currentAllProfilesSettings.includes(changedKey)) {
                    changedKeys.push(changedKey);
                }
            }
            change.keys = changedKeys;
            if (change.keys.includes(configuration_2.APPLY_ALL_PROFILES_SETTING)) {
                this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reparse({ exclude: currentAllProfilesSettings }));
            }
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        onLocalUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateLocalUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        onRemoteUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateRemoteUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 2 /* ConfigurationTarget.USER */);
        }
        async onWorkspaceConfigurationChanged(fromCache) {
            if (this.workspace && this.workspace.configuration) {
                let newFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), this.workspace.configuration, this.uriIdentityService.extUri);
                // Validate only if workspace is initialized
                if (this.workspace.initialized) {
                    const { added, removed, changed } = this.compareFolders(this.workspace.folders, newFolders);
                    /* If changed validate new folders */
                    if (added.length || removed.length || changed.length) {
                        newFolders = await this.toValidWorkspaceFolders(newFolders);
                    }
                    /* Otherwise use existing */
                    else {
                        newFolders = this.workspace.folders;
                    }
                }
                await this.updateWorkspaceConfiguration(newFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        updateRestrictedSettings() {
            const changed = [];
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            const defaultRestrictedSettings = Object.keys(allProperties).filter(key => allProperties[key].restricted).sort((a, b) => a.localeCompare(b));
            const defaultDelta = (0, arrays_1.delta)(defaultRestrictedSettings, this._restrictedSettings.default, (a, b) => a.localeCompare(b));
            changed.push(...defaultDelta.added, ...defaultDelta.removed);
            const application = (this.applicationConfiguration?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
            const applicationDelta = (0, arrays_1.delta)(application, this._restrictedSettings.application || [], (a, b) => a.localeCompare(b));
            changed.push(...applicationDelta.added, ...applicationDelta.removed);
            const userLocal = this.localUserConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b));
            const userLocalDelta = (0, arrays_1.delta)(userLocal, this._restrictedSettings.userLocal || [], (a, b) => a.localeCompare(b));
            changed.push(...userLocalDelta.added, ...userLocalDelta.removed);
            const userRemote = (this.remoteUserConfiguration?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
            const userRemoteDelta = (0, arrays_1.delta)(userRemote, this._restrictedSettings.userRemote || [], (a, b) => a.localeCompare(b));
            changed.push(...userRemoteDelta.added, ...userRemoteDelta.removed);
            const workspaceFolderMap = new map_1.ResourceMap();
            for (const workspaceFolder of this.workspace.folders) {
                const cachedFolderConfig = this.cachedFolderConfigs.get(workspaceFolder.uri);
                const folderRestrictedSettings = (cachedFolderConfig?.getRestrictedSettings() || []).sort((a, b) => a.localeCompare(b));
                if (folderRestrictedSettings.length) {
                    workspaceFolderMap.set(workspaceFolder.uri, folderRestrictedSettings);
                }
                const previous = this._restrictedSettings.workspaceFolder?.get(workspaceFolder.uri) || [];
                const workspaceFolderDelta = (0, arrays_1.delta)(folderRestrictedSettings, previous, (a, b) => a.localeCompare(b));
                changed.push(...workspaceFolderDelta.added, ...workspaceFolderDelta.removed);
            }
            const workspace = this.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? this.workspaceConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b))
                : this.workspace.folders[0] ? (workspaceFolderMap.get(this.workspace.folders[0].uri) || []) : [];
            const workspaceDelta = (0, arrays_1.delta)(workspace, this._restrictedSettings.workspace || [], (a, b) => a.localeCompare(b));
            changed.push(...workspaceDelta.added, ...workspaceDelta.removed);
            if (changed.length) {
                this._restrictedSettings = {
                    default: defaultRestrictedSettings,
                    application: application.length ? application : undefined,
                    userLocal: userLocal.length ? userLocal : undefined,
                    userRemote: userRemote.length ? userRemote : undefined,
                    workspace: workspace.length ? workspace : undefined,
                    workspaceFolder: workspaceFolderMap.size ? workspaceFolderMap : undefined,
                };
                this._onDidChangeRestrictedSettings.fire(this.restrictedSettings);
            }
        }
        async updateWorkspaceConfiguration(workspaceFolders, configuration, fromCache) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateWorkspaceConfiguration(configuration);
            const changes = this.compareFolders(this.workspace.folders, workspaceFolders);
            if (changes.added.length || changes.removed.length || changes.changed.length) {
                this.workspace.folders = workspaceFolders;
                const change = await this.onFoldersChanged();
                await this.handleWillChangeWorkspaceFolders(changes, fromCache);
                this.triggerConfigurationChange(change, previous, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
                this._onDidChangeWorkspaceFolders.fire(changes);
            }
            else {
                this.triggerConfigurationChange(change, previous, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            this.updateRestrictedSettings();
        }
        async handleWillChangeWorkspaceFolders(changes, fromCache) {
            const joiners = [];
            this._onWillChangeWorkspaceFolders.fire({
                join(updateWorkspaceTrustStatePromise) {
                    joiners.push(updateWorkspaceTrustStatePromise);
                },
                changes,
                fromCache
            });
            try {
                await async_1.Promises.settled(joiners);
            }
            catch (error) { /* Ignore */ }
        }
        async onWorkspaceFolderConfigurationChanged(folder) {
            const [folderConfiguration] = await this.loadFolderConfigurations([folder]);
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const folderConfigurationChange = this._configuration.compareAndUpdateFolderConfiguration(folder.uri, folderConfiguration);
            if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceConfigurationChange = this._configuration.compareAndUpdateWorkspaceConfiguration(folderConfiguration);
                this.triggerConfigurationChange((0, configurationModels_1.mergeChanges)(folderConfigurationChange, workspaceConfigurationChange), previous, 5 /* ConfigurationTarget.WORKSPACE */);
            }
            else {
                this.triggerConfigurationChange(folderConfigurationChange, previous, 6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            this.updateRestrictedSettings();
        }
        async onFoldersChanged() {
            const changes = [];
            // Remove the configurations of deleted folders
            for (const key of this.cachedFolderConfigs.keys()) {
                if (!this.workspace.folders.filter(folder => folder.uri.toString() === key.toString())[0]) {
                    const folderConfiguration = this.cachedFolderConfigs.get(key);
                    folderConfiguration.dispose();
                    this.cachedFolderConfigs.delete(key);
                    changes.push(this._configuration.compareAndDeleteFolderConfiguration(key));
                }
            }
            const toInitialize = this.workspace.folders.filter(folder => !this.cachedFolderConfigs.has(folder.uri));
            if (toInitialize.length) {
                const folderConfigurations = await this.loadFolderConfigurations(toInitialize);
                folderConfigurations.forEach((folderConfiguration, index) => {
                    changes.push(this._configuration.compareAndUpdateFolderConfiguration(toInitialize[index].uri, folderConfiguration));
                });
            }
            return (0, configurationModels_1.mergeChanges)(...changes);
        }
        loadFolderConfigurations(folders) {
            return Promise.all([...folders.map(folder => {
                    let folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    if (!folderConfiguration) {
                        folderConfiguration = new configuration_3.FolderConfiguration(!this.initialized, folder, configuration_2.FOLDER_CONFIG_FOLDER_NAME, this.getWorkbenchState(), this.isWorkspaceTrusted, this.fileService, this.uriIdentityService, this.logService, this.configurationCache);
                        this._register(folderConfiguration.onDidChange(() => this.onWorkspaceFolderConfigurationChanged(folder)));
                        this.cachedFolderConfigs.set(folder.uri, this._register(folderConfiguration));
                    }
                    return folderConfiguration.loadConfiguration();
                })]);
        }
        async validateWorkspaceFoldersAndReload(fromCache) {
            const validWorkspaceFolders = await this.toValidWorkspaceFolders(this.workspace.folders);
            const { removed } = this.compareFolders(this.workspace.folders, validWorkspaceFolders);
            if (removed.length) {
                await this.updateWorkspaceConfiguration(validWorkspaceFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        // Filter out workspace folders which are files (not directories)
        // Workspace folders those cannot be resolved are not filtered because they are handled by the Explorer.
        async toValidWorkspaceFolders(workspaceFolders) {
            const validWorkspaceFolders = [];
            for (const workspaceFolder of workspaceFolders) {
                try {
                    const result = await this.fileService.stat(workspaceFolder.uri);
                    if (!result.isDirectory) {
                        continue;
                    }
                }
                catch (e) {
                    this.logService.warn(`Ignoring the error while validating workspace folder ${workspaceFolder.uri.toString()} - ${(0, errorMessage_1.toErrorMessage)(e)}`);
                }
                validWorkspaceFolders.push(workspaceFolder);
            }
            return validWorkspaceFolders;
        }
        async writeConfigurationValue(key, value, target, overrides, options) {
            if (!this.instantiationService) {
                throw new Error('Cannot write configuration because the configuration service is not yet ready to accept writes.');
            }
            if (target === 7 /* ConfigurationTarget.DEFAULT */) {
                throw new Error('Invalid configuration target');
            }
            if (target === 8 /* ConfigurationTarget.MEMORY */) {
                const previous = { data: this._configuration.toData(), workspace: this.workspace };
                this._configuration.updateValue(key, value, overrides);
                this.triggerConfigurationChange({ keys: overrides?.overrideIdentifiers?.length ? [(0, configurationRegistry_1.keyFromOverrideIdentifiers)(overrides.overrideIdentifiers), key] : [key], overrides: overrides?.overrideIdentifiers?.length ? overrides.overrideIdentifiers.map(overrideIdentifier => ([overrideIdentifier, [key]])) : [] }, previous, target);
                return;
            }
            const editableConfigurationTarget = this.toEditableConfigurationTarget(target, key);
            if (!editableConfigurationTarget) {
                throw new Error('Invalid configuration target');
            }
            if (editableConfigurationTarget === 2 /* EditableConfigurationTarget.USER_REMOTE */ && !this.remoteUserConfiguration) {
                throw new Error('Invalid configuration target');
            }
            if (overrides?.overrideIdentifiers?.length && overrides.overrideIdentifiers.length > 1) {
                const configurationModel = this.getConfigurationModelForEditableConfigurationTarget(editableConfigurationTarget, overrides.resource);
                if (configurationModel) {
                    const overrideIdentifiers = overrides.overrideIdentifiers.sort();
                    const existingOverrides = configurationModel.overrides.find(override => (0, arrays_1.equals)([...override.identifiers].sort(), overrideIdentifiers));
                    if (existingOverrides) {
                        overrides.overrideIdentifiers = existingOverrides.identifiers;
                    }
                }
            }
            // Use same instance of ConfigurationEditing to make sure all writes go through the same queue
            this.configurationEditing = this.configurationEditing ?? this.createConfigurationEditingService(this.instantiationService);
            await (await this.configurationEditing).writeConfiguration(editableConfigurationTarget, { key, value }, { scopes: overrides, ...options });
            switch (editableConfigurationTarget) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                    if (this.applicationConfiguration && this.isSettingAppliedForAllProfiles(key)) {
                        await this.reloadApplicationConfiguration();
                    }
                    else {
                        await this.reloadLocalUserConfiguration();
                    }
                    return;
                case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                    return this.reloadRemoteUserConfiguration().then(() => undefined);
                case 3 /* EditableConfigurationTarget.WORKSPACE */:
                    return this.reloadWorkspaceConfiguration();
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: {
                    const workspaceFolder = overrides && overrides.resource ? this.workspace.getFolder(overrides.resource) : null;
                    if (workspaceFolder) {
                        return this.reloadWorkspaceFolderConfiguration(workspaceFolder);
                    }
                }
            }
        }
        async createConfigurationEditingService(instantiationService) {
            const remoteSettingsResource = (await this.remoteAgentService.getEnvironment())?.settingsPath ?? null;
            return instantiationService.createInstance(configurationEditing_1.ConfigurationEditing, remoteSettingsResource);
        }
        getConfigurationModelForEditableConfigurationTarget(target, resource) {
            switch (target) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */: return this._configuration.localUserConfiguration;
                case 2 /* EditableConfigurationTarget.USER_REMOTE */: return this._configuration.remoteUserConfiguration;
                case 3 /* EditableConfigurationTarget.WORKSPACE */: return this._configuration.workspaceConfiguration;
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: return resource ? this._configuration.folderConfigurations.get(resource) : undefined;
            }
        }
        getConfigurationModel(target, resource) {
            switch (target) {
                case 3 /* ConfigurationTarget.USER_LOCAL */: return this._configuration.localUserConfiguration;
                case 4 /* ConfigurationTarget.USER_REMOTE */: return this._configuration.remoteUserConfiguration;
                case 5 /* ConfigurationTarget.WORKSPACE */: return this._configuration.workspaceConfiguration;
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */: return resource ? this._configuration.folderConfigurations.get(resource) : undefined;
                default: return undefined;
            }
        }
        deriveConfigurationTargets(key, value, inspect) {
            if ((0, objects_1.equals)(value, inspect.value)) {
                return [];
            }
            const definedTargets = [];
            if (inspect.workspaceFolderValue !== undefined) {
                definedTargets.push(6 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            if (inspect.workspaceValue !== undefined) {
                definedTargets.push(5 /* ConfigurationTarget.WORKSPACE */);
            }
            if (inspect.userRemoteValue !== undefined) {
                definedTargets.push(4 /* ConfigurationTarget.USER_REMOTE */);
            }
            if (inspect.userLocalValue !== undefined) {
                definedTargets.push(3 /* ConfigurationTarget.USER_LOCAL */);
            }
            if (value === undefined) {
                // Remove the setting in all defined targets
                return definedTargets;
            }
            return [definedTargets[0] || 2 /* ConfigurationTarget.USER */];
        }
        triggerConfigurationChange(change, previous, target) {
            if (change.keys.length) {
                if (target !== 7 /* ConfigurationTarget.DEFAULT */) {
                    this.logService.debug(`Configuration keys changed in ${(0, configuration_1.ConfigurationTargetToString)(target)} target`, ...change.keys);
                }
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this.workspace);
                configurationChangeEvent.source = target;
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
        }
        toEditableConfigurationTarget(target, key) {
            if (target === 2 /* ConfigurationTarget.USER */) {
                if (this.remoteUserConfiguration) {
                    const scope = this.configurationRegistry.getConfigurationProperties()[key]?.scope;
                    if (scope === 2 /* ConfigurationScope.MACHINE */ || scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                    if (this.inspect(key).userRemoteValue !== undefined) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                }
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 3 /* ConfigurationTarget.USER_LOCAL */) {
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 4 /* ConfigurationTarget.USER_REMOTE */) {
                return 2 /* EditableConfigurationTarget.USER_REMOTE */;
            }
            if (target === 5 /* ConfigurationTarget.WORKSPACE */) {
                return 3 /* EditableConfigurationTarget.WORKSPACE */;
            }
            if (target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */;
            }
            return null;
        }
    }
    exports.WorkspaceService = WorkspaceService;
    let RegisterConfigurationSchemasContribution = class RegisterConfigurationSchemasContribution extends lifecycle_1.Disposable {
        constructor(workspaceContextService, environmentService, workspaceTrustManagementService, extensionService, lifecycleService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.registerConfigurationSchemas();
                const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
                const delayer = this._register(new async_1.Delayer(50));
                this._register(event_1.Event.any(configurationRegistry.onDidUpdateConfiguration, configurationRegistry.onDidSchemaChange, workspaceTrustManagementService.onDidChangeTrust)(() => delayer.trigger(() => this.registerConfigurationSchemas(), lifecycleService.phase === 4 /* LifecyclePhase.Eventually */ ? undefined : 2500 /* delay longer in early phases */)));
            });
        }
        registerConfigurationSchemas() {
            const allSettingsSchema = {
                properties: configurationRegistry_1.allSettings.properties,
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const userSettingsSchema = this.environmentService.remoteAuthority ?
                {
                    properties: Object.assign({}, configurationRegistry_1.applicationSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                }
                : allSettingsSchema;
            const profileSettingsSchema = {
                properties: Object.assign({}, configurationRegistry_1.machineSettings.properties, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const machineSettingsSchema = {
                properties: Object.assign({}, configurationRegistry_1.machineSettings.properties, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const workspaceSettingsSchema = {
                properties: Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.windowSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const defaultSettingsSchema = {
                properties: Object.keys(configurationRegistry_1.allSettings.properties).reduce((result, key) => {
                    result[key] = Object.assign({ deprecationMessage: undefined }, configurationRegistry_1.allSettings.properties[key]);
                    return result;
                }, {}),
                patternProperties: Object.keys(configurationRegistry_1.allSettings.patternProperties).reduce((result, key) => {
                    result[key] = Object.assign({ deprecationMessage: undefined }, configurationRegistry_1.allSettings.patternProperties[key]);
                    return result;
                }, {}),
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const folderSettingsSchema = 3 /* WorkbenchState.WORKSPACE */ === this.workspaceContextService.getWorkbenchState() ?
                {
                    properties: Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                } : workspaceSettingsSchema;
            const configDefaultsSchema = {
                type: 'object',
                description: (0, nls_1.localize)('configurationDefaults.description', 'Contribute defaults for configurations'),
                properties: Object.assign({}, configurationRegistry_1.machineOverridableSettings.properties, configurationRegistry_1.windowSettings.properties, configurationRegistry_1.resourceSettings.properties),
                patternProperties: {
                    [configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN]: {
                        type: 'object',
                        default: {},
                        $ref: configurationRegistry_1.resourceLanguageSettingsSchemaId,
                    }
                },
                additionalProperties: false
            };
            this.registerSchemas({
                defaultSettingsSchema,
                userSettingsSchema,
                profileSettingsSchema,
                machineSettingsSchema,
                workspaceSettingsSchema,
                folderSettingsSchema,
                configDefaultsSchema,
            });
        }
        registerSchemas(schemas) {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            jsonRegistry.registerSchema(configuration_2.defaultSettingsSchemaId, schemas.defaultSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.userSettingsSchemaId, schemas.userSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.profileSettingsSchemaId, schemas.profileSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.machineSettingsSchemaId, schemas.machineSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, schemas.workspaceSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, schemas.folderSettingsSchema);
            jsonRegistry.registerSchema(configurationRegistry_1.configurationDefaultsSchemaId, schemas.configDefaultsSchema);
        }
        checkAndFilterPropertiesRequiringTrust(properties) {
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return properties;
            }
            const result = {};
            Object.entries(properties).forEach(([key, value]) => {
                if (!value.restricted) {
                    result[key] = value;
                }
            });
            return result;
        }
    };
    RegisterConfigurationSchemasContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, extensions_1.IExtensionService),
        __param(4, lifecycle_2.ILifecycleService)
    ], RegisterConfigurationSchemasContribution);
    let ResetConfigurationDefaultsOverridesCache = class ResetConfigurationDefaultsOverridesCache extends lifecycle_1.Disposable {
        constructor(configurationService, extensionService) {
            super();
            if (configurationService.hasCachedConfigurationDefaultsOverrides()) {
                extensionService.whenInstalledExtensionsRegistered().then(() => configurationService.reloadConfiguration(7 /* ConfigurationTarget.DEFAULT */));
            }
        }
    };
    ResetConfigurationDefaultsOverridesCache = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionService)
    ], ResetConfigurationDefaultsOverridesCache);
    let UpdateExperimentalSettingsDefaults = class UpdateExperimentalSettingsDefaults extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.updateExperimentalSettingsDefaults'; }
        constructor(workbenchAssignmentService) {
            super();
            this.workbenchAssignmentService = workbenchAssignmentService;
            this.processedExperimentalSettings = new Set();
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.processExperimentalSettings(Object.keys(this.configurationRegistry.getConfigurationProperties()));
            this._register(this.configurationRegistry.onDidUpdateConfiguration(({ properties }) => this.processExperimentalSettings(properties)));
        }
        async processExperimentalSettings(properties) {
            const overrides = {};
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            for (const property of properties) {
                const schema = allProperties[property];
                if (!schema?.tags?.includes('experimental')) {
                    continue;
                }
                if (this.processedExperimentalSettings.has(property)) {
                    continue;
                }
                this.processedExperimentalSettings.add(property);
                try {
                    const value = await this.workbenchAssignmentService.getTreatment(`config.${property}`);
                    if (!(0, types_1.isUndefined)(value) && !(0, objects_1.equals)(value, schema.default)) {
                        overrides[property] = value;
                    }
                }
                catch (error) { /*ignore */ }
            }
            if (Object.keys(overrides).length) {
                this.configurationRegistry.registerDefaultConfigurations([{ overrides, source: (0, nls_1.localize)('experimental', "Experiments") }]);
            }
        }
    };
    UpdateExperimentalSettingsDefaults = __decorate([
        __param(0, assignmentService_1.IWorkbenchAssignmentService)
    ], UpdateExperimentalSettingsDefaults);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RegisterConfigurationSchemasContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ResetConfigurationDefaultsOverridesCache, 4 /* LifecyclePhase.Eventually */);
    (0, contributions_1.registerWorkbenchContribution2)(UpdateExperimentalSettingsDefaults.ID, UpdateExperimentalSettingsDefaults, 2 /* WorkbenchPhase.BlockRestore */);
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        ...configuration_4.workbenchConfigurationNodeBase,
        properties: {
            [configuration_2.APPLY_ALL_PROFILES_SETTING]: {
                'type': 'array',
                description: (0, nls_1.localize)('setting description', "Configure settings to be applied for all profiles."),
                'default': [],
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                additionalProperties: true,
                uniqueItems: true,
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9jb25maWd1cmF0aW9uL2Jyb3dzZXIvY29uZmlndXJhdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBK0NoRyxTQUFTLCtCQUErQixDQUFDLGVBQWlDLEVBQUUsU0FBa0I7UUFDN0YsT0FBTyxDQUFDLGVBQWUsQ0FBQyxTQUFTLElBQUksZUFBZSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUM7WUFDOUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsb0NBQW9CLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDOUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsNENBQTRCLENBQUMsQ0FBQyxDQUFDLDhCQUFjLENBQUM7SUFDOUQsQ0FBQztJQUVELE1BQU0sU0FBVSxTQUFRLHFCQUFhO1FBQXJDOztZQUNDLGdCQUFXLEdBQVksS0FBSyxDQUFDO1FBQzlCLENBQUM7S0FBQTtJQUVELE1BQWEsZ0JBQWlCLFNBQVEsc0JBQVU7UUFzQy9DLElBQUksa0JBQWtCLEtBQUssT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBUzdELFlBQ0MsRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQXlFLEVBQzlHLGtCQUF1RCxFQUN0QyxzQkFBK0MsRUFDL0MsdUJBQWlELEVBQ2pELFdBQXlCLEVBQ3pCLGtCQUF1QyxFQUN2QyxrQkFBdUMsRUFDdkMsVUFBdUIsRUFDeEMsYUFBNkI7WUFFN0IsS0FBSyxFQUFFLENBQUM7WUFSUywyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQy9DLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDakQsZ0JBQVcs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