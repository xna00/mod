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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/base/common/network", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/memento", "vs/workbench/services/environment/common/environmentService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/resources", "vs/base/common/platform", "vs/platform/files/common/files", "vs/base/common/async"], function (require, exports, event_1, lifecycle_1, linkedList_1, network_1, uri_1, configuration_1, extensions_1, remoteAuthorityResolver_1, remoteHosts_1, virtualWorkspace_1, storage_1, workspace_1, workspaceTrust_1, memento_1, environmentService_1, uriIdentity_1, resources_1, platform_1, files_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceTrustRequestService = exports.WorkspaceTrustManagementService = exports.WorkspaceTrustEnablementService = exports.CanonicalWorkspace = exports.WORKSPACE_TRUST_STORAGE_KEY = exports.WORKSPACE_TRUST_EXTENSION_SUPPORT = exports.WORKSPACE_TRUST_EMPTY_WINDOW = exports.WORKSPACE_TRUST_UNTRUSTED_FILES = exports.WORKSPACE_TRUST_BANNER = exports.WORKSPACE_TRUST_STARTUP_PROMPT = exports.WORKSPACE_TRUST_ENABLED = void 0;
    exports.WORKSPACE_TRUST_ENABLED = 'security.workspace.trust.enabled';
    exports.WORKSPACE_TRUST_STARTUP_PROMPT = 'security.workspace.trust.startupPrompt';
    exports.WORKSPACE_TRUST_BANNER = 'security.workspace.trust.banner';
    exports.WORKSPACE_TRUST_UNTRUSTED_FILES = 'security.workspace.trust.untrustedFiles';
    exports.WORKSPACE_TRUST_EMPTY_WINDOW = 'security.workspace.trust.emptyWindow';
    exports.WORKSPACE_TRUST_EXTENSION_SUPPORT = 'extensions.supportUntrustedWorkspaces';
    exports.WORKSPACE_TRUST_STORAGE_KEY = 'content.trust.model.key';
    class CanonicalWorkspace {
        constructor(originalWorkspace, canonicalFolderUris, canonicalConfiguration) {
            this.originalWorkspace = originalWorkspace;
            this.canonicalFolderUris = canonicalFolderUris;
            this.canonicalConfiguration = canonicalConfiguration;
        }
        get folders() {
            return this.originalWorkspace.folders.map((folder, index) => {
                return {
                    index: folder.index,
                    name: folder.name,
                    toResource: folder.toResource,
                    uri: this.canonicalFolderUris[index]
                };
            });
        }
        get transient() {
            return this.originalWorkspace.transient;
        }
        get configuration() {
            return this.canonicalConfiguration ?? this.originalWorkspace.configuration;
        }
        get id() {
            return this.originalWorkspace.id;
        }
    }
    exports.CanonicalWorkspace = CanonicalWorkspace;
    let WorkspaceTrustEnablementService = class WorkspaceTrustEnablementService extends lifecycle_1.Disposable {
        constructor(configurationService, environmentService) {
            super();
            this.configurationService = configurationService;
            this.environmentService = environmentService;
        }
        isWorkspaceTrustEnabled() {
            if (this.environmentService.disableWorkspaceTrust) {
                return false;
            }
            return !!this.configurationService.getValue(exports.WORKSPACE_TRUST_ENABLED);
        }
    };
    exports.WorkspaceTrustEnablementService = WorkspaceTrustEnablementService;
    exports.WorkspaceTrustEnablementService = WorkspaceTrustEnablementService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], WorkspaceTrustEnablementService);
    let WorkspaceTrustManagementService = class WorkspaceTrustManagementService extends lifecycle_1.Disposable {
        constructor(configurationService, remoteAuthorityResolverService, storageService, uriIdentityService, environmentService, workspaceService, workspaceTrustEnablementService, fileService) {
            super();
            this.configurationService = configurationService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.storageService = storageService;
            this.uriIdentityService = uriIdentityService;
            this.environmentService = environmentService;
            this.workspaceService = workspaceService;
            this.workspaceTrustEnablementService = workspaceTrustEnablementService;
            this.fileService = fileService;
            this.storageKey = exports.WORKSPACE_TRUST_STORAGE_KEY;
            this._onDidChangeTrust = this._register(new event_1.Emitter());
            this.onDidChangeTrust = this._onDidChangeTrust.event;
            this._onDidChangeTrustedFolders = this._register(new event_1.Emitter());
            this.onDidChangeTrustedFolders = this._onDidChangeTrustedFolders.event;
            this._canonicalStartupFiles = [];
            this._canonicalUrisResolved = false;
            this._canonicalWorkspace = this.workspaceService.getWorkspace();
            ({ promise: this._workspaceResolvedPromise, resolve: this._workspaceResolvedPromiseResolve } = (0, async_1.promiseWithResolvers)());
            ({ promise: this._workspaceTrustInitializedPromise, resolve: this._workspaceTrustInitializedPromiseResolve } = (0, async_1.promiseWithResolvers)());
            this._storedTrustState = new WorkspaceTrustMemento(platform_1.isWeb && this.isEmptyWorkspace() ? undefined : this.storageService);
            this._trustTransitionManager = this._register(new WorkspaceTrustTransitionManager());
            this._trustStateInfo = this.loadTrustInfo();
            this._isTrusted = this.calculateWorkspaceTrust();
            this.initializeWorkspaceTrust();
            this.registerListeners();
        }
        //#region initialize
        initializeWorkspaceTrust() {
            // Resolve canonical Uris
            this.resolveCanonicalUris()
                .then(async () => {
                this._canonicalUrisResolved = true;
                await this.updateWorkspaceTrust();
            })
                .finally(() => {
                this._workspaceResolvedPromiseResolve();
                if (!this.environmentService.remoteAuthority) {
                    this._workspaceTrustInitializedPromiseResolve();
                }
            });
            // Remote - resolve remote authority
            if (this.environmentService.remoteAuthority) {
                this.remoteAuthorityResolverService.resolveAuthority(this.environmentService.remoteAuthority)
                    .then(async (result) => {
                    this._remoteAuthority = result;
                    await this.fileService.activateProvider(network_1.Schemas.vscodeRemote);
                    await this.updateWorkspaceTrust();
                })
                    .finally(() => {
                    this._workspaceTrustInitializedPromiseResolve();
                });
            }
            // Empty workspace - save initial state to memento
            if (this.isEmptyWorkspace()) {
                this._workspaceTrustInitializedPromise.then(() => {
                    if (this._storedTrustState.isEmptyWorkspaceTrusted === undefined) {
                        this._storedTrustState.isEmptyWorkspaceTrusted = this.isWorkspaceTrusted();
                    }
                });
            }
        }
        //#endregion
        //#region private interface
        registerListeners() {
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(async () => await this.updateWorkspaceTrust()));
            this._register(this.storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, this.storageKey, this._register(new lifecycle_1.DisposableStore()))(async () => {
                /* This will only execute if storage was changed by a user action in a separate window */
                if (JSON.stringify(this._trustStateInfo) !== JSON.stringify(this.loadTrustInfo())) {
                    this._trustStateInfo = this.loadTrustInfo();
                    this._onDidChangeTrustedFolders.fire();
                    await this.updateWorkspaceTrust();
                }
            }));
        }
        async getCanonicalUri(uri) {
            let canonicalUri = uri;
            if (this.environmentService.remoteAuthority && uri.scheme === network_1.Schemas.vscodeRemote) {
                canonicalUri = await this.remoteAuthorityResolverService.getCanonicalURI(uri);
            }
            else if (uri.scheme === 'vscode-vfs') {
                const index = uri.authority.indexOf('+');
                if (index !== -1) {
                    canonicalUri = uri.with({ authority: uri.authority.substr(0, index) });
                }
            }
            // ignore query and fragent section of uris always
            return canonicalUri.with({ query: null, fragment: null });
        }
        async resolveCanonicalUris() {
            // Open editors
            const filesToOpen = [];
            if (this.environmentService.filesToOpenOrCreate) {
                filesToOpen.push(...this.environmentService.filesToOpenOrCreate);
            }
            if (this.environmentService.filesToDiff) {
                filesToOpen.push(...this.environmentService.filesToDiff);
            }
            if (this.environmentService.filesToMerge) {
                filesToOpen.push(...this.environmentService.filesToMerge);
            }
            if (filesToOpen.length) {
                const filesToOpenOrCreateUris = filesToOpen.filter(f => !!f.fileUri).map(f => f.fileUri);
                const canonicalFilesToOpen = await Promise.all(filesToOpenOrCreateUris.map(uri => this.getCanonicalUri(uri)));
                this._canonicalStartupFiles.push(...canonicalFilesToOpen.filter(uri => this._canonicalStartupFiles.every(u => !this.uriIdentityService.extUri.isEqual(uri, u))));
            }
            // Workspace
            const workspaceUris = this.workspaceService.getWorkspace().folders.map(f => f.uri);
            const canonicalWorkspaceFolders = await Promise.all(workspaceUris.map(uri => this.getCanonicalUri(uri)));
            let canonicalWorkspaceConfiguration = this.workspaceService.getWorkspace().configuration;
            if (canonicalWorkspaceConfiguration && (0, workspace_1.isSavedWorkspace)(canonicalWorkspaceConfiguration, this.environmentService)) {
                canonicalWorkspaceConfiguration = await this.getCanonicalUri(canonicalWorkspaceConfiguration);
            }
            this._canonicalWorkspace = new CanonicalWorkspace(this.workspaceService.getWorkspace(), canonicalWorkspaceFolders, canonicalWorkspaceConfiguration);
        }
        loadTrustInfo() {
            const infoAsString = this.storageService.get(this.storageKey, -1 /* StorageScope.APPLICATION */);
            let result;
            try {
                if (infoAsString) {
                    result = JSON.parse(infoAsString);
                }
            }
            catch { }
            if (!result) {
                result = {
                    uriTrustInfo: []
                };
            }
            if (!result.uriTrustInfo) {
                result.uriTrustInfo = [];
            }
            result.uriTrustInfo = result.uriTrustInfo.map(info => { return { uri: uri_1.URI.revive(info.uri), trusted: info.trusted }; });
            result.uriTrustInfo = result.uriTrustInfo.filter(info => info.trusted);
            return result;
        }
        async saveTrustInfo() {
            this.storageService.store(this.storageKey, JSON.stringify(this._trustStateInfo), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            this._onDidChangeTrustedFolders.fire();
            await this.updateWorkspaceTrust();
        }
        getWorkspaceUris() {
            const workspaceUris = this._canonicalWorkspace.folders.map(f => f.uri);
            const workspaceConfiguration = this._canonicalWorkspace.configuration;
            if (workspaceConfiguration && (0, workspace_1.isSavedWorkspace)(workspaceConfiguration, this.environmentService)) {
                workspaceUris.push(workspaceConfiguration);
            }
            return workspaceUris;
        }
        calculateWorkspaceTrust() {
            // Feature is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return true;
            }
            // Canonical Uris not yet resolved
            if (!this._canonicalUrisResolved) {
                return false;
            }
            // Remote - resolver explicitly sets workspace trust to TRUE
            if (this.environmentService.remoteAuthority && this._remoteAuthority?.options?.isTrusted) {
                return this._remoteAuthority.options.isTrusted;
            }
            // Empty workspace - use memento, open ediors, or user setting
            if (this.isEmptyWorkspace()) {
                // Use memento if present
                if (this._storedTrustState.isEmptyWorkspaceTrusted !== undefined) {
                    return this._storedTrustState.isEmptyWorkspaceTrusted;
                }
                // Startup files
                if (this._canonicalStartupFiles.length) {
                    return this.getUrisTrust(this._canonicalStartupFiles);
                }
                // User setting
                return !!this.configurationService.getValue(exports.WORKSPACE_TRUST_EMPTY_WINDOW);
            }
            return this.getUrisTrust(this.getWorkspaceUris());
        }
        async updateWorkspaceTrust(trusted) {
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return;
            }
            if (trusted === undefined) {
                await this.resolveCanonicalUris();
                trusted = this.calculateWorkspaceTrust();
            }
            if (this.isWorkspaceTrusted() === trusted) {
                return;
            }
            // Update workspace trust
            this.isTrusted = trusted;
            // Run workspace trust transition participants
            await this._trustTransitionManager.participate(trusted);
            // Fire workspace trust change event
            this._onDidChangeTrust.fire(trusted);
        }
        getUrisTrust(uris) {
            let state = true;
            for (const uri of uris) {
                const { trusted } = this.doGetUriTrustInfo(uri);
                if (!trusted) {
                    state = trusted;
                    return state;
                }
            }
            return state;
        }
        doGetUriTrustInfo(uri) {
            // Return trusted when workspace trust is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return { trusted: true, uri };
            }
            if (this.isTrustedVirtualResource(uri)) {
                return { trusted: true, uri };
            }
            if (this.isTrustedByRemote(uri)) {
                return { trusted: true, uri };
            }
            let resultState = false;
            let maxLength = -1;
            let resultUri = uri;
            for (const trustInfo of this._trustStateInfo.uriTrustInfo) {
                if (this.uriIdentityService.extUri.isEqualOrParent(uri, trustInfo.uri)) {
                    const fsPath = trustInfo.uri.fsPath;
                    if (fsPath.length > maxLength) {
                        maxLength = fsPath.length;
                        resultState = trustInfo.trusted;
                        resultUri = trustInfo.uri;
                    }
                }
            }
            return { trusted: resultState, uri: resultUri };
        }
        async doSetUrisTrust(uris, trusted) {
            let changed = false;
            for (const uri of uris) {
                if (trusted) {
                    if (this.isTrustedVirtualResource(uri)) {
                        continue;
                    }
                    if (this.isTrustedByRemote(uri)) {
                        continue;
                    }
                    const foundItem = this._trustStateInfo.uriTrustInfo.find(trustInfo => this.uriIdentityService.extUri.isEqual(trustInfo.uri, uri));
                    if (!foundItem) {
                        this._trustStateInfo.uriTrustInfo.push({ uri, trusted: true });
                        changed = true;
                    }
                }
                else {
                    const previousLength = this._trustStateInfo.uriTrustInfo.length;
                    this._trustStateInfo.uriTrustInfo = this._trustStateInfo.uriTrustInfo.filter(trustInfo => !this.uriIdentityService.extUri.isEqual(trustInfo.uri, uri));
                    if (previousLength !== this._trustStateInfo.uriTrustInfo.length) {
                        changed = true;
                    }
                }
            }
            if (changed) {
                await this.saveTrustInfo();
            }
        }
        isEmptyWorkspace() {
            if (this.workspaceService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                return true;
            }
            const workspace = this.workspaceService.getWorkspace();
            if (workspace) {
                return (0, workspace_1.isTemporaryWorkspace)(this.workspaceService.getWorkspace()) && workspace.folders.length === 0;
            }
            return false;
        }
        isTrustedVirtualResource(uri) {
            return (0, virtualWorkspace_1.isVirtualResource)(uri) && uri.scheme !== 'vscode-vfs';
        }
        isTrustedByRemote(uri) {
            if (!this.environmentService.remoteAuthority) {
                return false;
            }
            if (!this._remoteAuthority) {
                return false;
            }
            return ((0, resources_1.isEqualAuthority)((0, remoteHosts_1.getRemoteAuthority)(uri), this._remoteAuthority.authority.authority)) && !!this._remoteAuthority.options?.isTrusted;
        }
        set isTrusted(value) {
            this._isTrusted = value;
            // Reset acceptsOutOfWorkspaceFiles
            if (!value) {
                this._storedTrustState.acceptsOutOfWorkspaceFiles = false;
            }
            // Empty workspace - save memento
            if (this.isEmptyWorkspace()) {
                this._storedTrustState.isEmptyWorkspaceTrusted = value;
            }
        }
        //#endregion
        //#region public interface
        get workspaceResolved() {
            return this._workspaceResolvedPromise;
        }
        get workspaceTrustInitialized() {
            return this._workspaceTrustInitializedPromise;
        }
        get acceptsOutOfWorkspaceFiles() {
            return this._storedTrustState.acceptsOutOfWorkspaceFiles;
        }
        set acceptsOutOfWorkspaceFiles(value) {
            this._storedTrustState.acceptsOutOfWorkspaceFiles = value;
        }
        isWorkspaceTrusted() {
            return this._isTrusted;
        }
        isWorkspaceTrustForced() {
            // Remote - remote authority explicitly sets workspace trust
            if (this.environmentService.remoteAuthority && this._remoteAuthority && this._remoteAuthority.options?.isTrusted !== undefined) {
                return true;
            }
            // All workspace uris are trusted automatically
            const workspaceUris = this.getWorkspaceUris().filter(uri => !this.isTrustedVirtualResource(uri));
            if (workspaceUris.length === 0) {
                return true;
            }
            return false;
        }
        canSetParentFolderTrust() {
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace);
            if (!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return false;
            }
            if (workspaceIdentifier.uri.scheme !== network_1.Schemas.file && workspaceIdentifier.uri.scheme !== network_1.Schemas.vscodeRemote) {
                return false;
            }
            const parentFolder = this.uriIdentityService.extUri.dirname(workspaceIdentifier.uri);
            if (this.uriIdentityService.extUri.isEqual(workspaceIdentifier.uri, parentFolder)) {
                return false;
            }
            return true;
        }
        async setParentFolderTrust(trusted) {
            if (this.canSetParentFolderTrust()) {
                const workspaceUri = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace).uri;
                const parentFolder = this.uriIdentityService.extUri.dirname(workspaceUri);
                await this.setUrisTrust([parentFolder], trusted);
            }
        }
        canSetWorkspaceTrust() {
            // Remote - remote authority not yet resolved, or remote authority explicitly sets workspace trust
            if (this.environmentService.remoteAuthority && (!this._remoteAuthority || this._remoteAuthority.options?.isTrusted !== undefined)) {
                return false;
            }
            // Empty workspace
            if (this.isEmptyWorkspace()) {
                return true;
            }
            // All workspace uris are trusted automatically
            const workspaceUris = this.getWorkspaceUris().filter(uri => !this.isTrustedVirtualResource(uri));
            if (workspaceUris.length === 0) {
                return false;
            }
            // Untrusted workspace
            if (!this.isWorkspaceTrusted()) {
                return true;
            }
            // Trusted workspaces
            // Can only untrusted in the single folder scenario
            const workspaceIdentifier = (0, workspace_1.toWorkspaceIdentifier)(this._canonicalWorkspace);
            if (!(0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdentifier)) {
                return false;
            }
            // Can only be untrusted in certain schemes
            if (workspaceIdentifier.uri.scheme !== network_1.Schemas.file && workspaceIdentifier.uri.scheme !== 'vscode-vfs') {
                return false;
            }
            // If the current folder isn't trusted directly, return false
            const trustInfo = this.doGetUriTrustInfo(workspaceIdentifier.uri);
            if (!trustInfo.trusted || !this.uriIdentityService.extUri.isEqual(workspaceIdentifier.uri, trustInfo.uri)) {
                return false;
            }
            // Check if the parent is also trusted
            if (this.canSetParentFolderTrust()) {
                const parentFolder = this.uriIdentityService.extUri.dirname(workspaceIdentifier.uri);
                const parentPathTrustInfo = this.doGetUriTrustInfo(parentFolder);
                if (parentPathTrustInfo.trusted) {
                    return false;
                }
            }
            return true;
        }
        async setWorkspaceTrust(trusted) {
            // Empty workspace
            if (this.isEmptyWorkspace()) {
                await this.updateWorkspaceTrust(trusted);
                return;
            }
            const workspaceFolders = this.getWorkspaceUris();
            await this.setUrisTrust(workspaceFolders, trusted);
        }
        async getUriTrustInfo(uri) {
            // Return trusted when workspace trust is disabled
            if (!this.workspaceTrustEnablementService.isWorkspaceTrustEnabled()) {
                return { trusted: true, uri };
            }
            // Uri is trusted automatically by the remote
            if (this.isTrustedByRemote(uri)) {
                return { trusted: true, uri };
            }
            return this.doGetUriTrustInfo(await this.getCanonicalUri(uri));
        }
        async setUrisTrust(uris, trusted) {
            this.doSetUrisTrust(await Promise.all(uris.map(uri => this.getCanonicalUri(uri))), trusted);
        }
        getTrustedUris() {
            return this._trustStateInfo.uriTrustInfo.map(info => info.uri);
        }
        async setTrustedUris(uris) {
            this._trustStateInfo.uriTrustInfo = [];
            for (const uri of uris) {
                const canonicalUri = await this.getCanonicalUri(uri);
                const cleanUri = this.uriIdentityService.extUri.removeTrailingPathSeparator(canonicalUri);
                let added = false;
                for (const addedUri of this._trustStateInfo.uriTrustInfo) {
                    if (this.uriIdentityService.extUri.isEqual(addedUri.uri, cleanUri)) {
                        added = true;
                        break;
                    }
                }
                if (added) {
                    continue;
                }
                this._trustStateInfo.uriTrustInfo.push({
                    trusted: true,
                    uri: cleanUri
                });
            }
            await this.saveTrustInfo();
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            return this._trustTransitionManager.addWorkspaceTrustTransitionParticipant(participant);
        }
    };
    exports.WorkspaceTrustManagementService = WorkspaceTrustManagementService;
    exports.WorkspaceTrustManagementService = WorkspaceTrustManagementService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, storage_1.IStorageService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, workspaceTrust_1.IWorkspaceTrustEnablementService),
        __param(7, files_1.IFileService)
    ], WorkspaceTrustManagementService);
    let WorkspaceTrustRequestService = class WorkspaceTrustRequestService extends lifecycle_1.Disposable {
        constructor(configurationService, workspaceTrustManagementService) {
            super();
            this.configurationService = configurationService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this._onDidInitiateOpenFilesTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateOpenFilesTrustRequest = this._onDidInitiateOpenFilesTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequest = this._onDidInitiateWorkspaceTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
        }
        //#region Open file(s) trust request
        get untrustedFilesSetting() {
            return this.configurationService.getValue(exports.WORKSPACE_TRUST_UNTRUSTED_FILES);
        }
        set untrustedFilesSetting(value) {
            this.configurationService.updateValue(exports.WORKSPACE_TRUST_UNTRUSTED_FILES, value);
        }
        async completeOpenFilesTrustRequest(result, saveResponse) {
            if (!this._openFilesTrustRequestResolver) {
                return;
            }
            // Set acceptsOutOfWorkspaceFiles
            if (result === 1 /* WorkspaceTrustUriResponse.Open */) {
                this.workspaceTrustManagementService.acceptsOutOfWorkspaceFiles = true;
            }
            // Save response
            if (saveResponse) {
                if (result === 1 /* WorkspaceTrustUriResponse.Open */) {
                    this.untrustedFilesSetting = 'open';
                }
                if (result === 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */) {
                    this.untrustedFilesSetting = 'newWindow';
                }
            }
            // Resolve promise
            this._openFilesTrustRequestResolver(result);
            this._openFilesTrustRequestResolver = undefined;
            this._openFilesTrustRequestPromise = undefined;
        }
        async requestOpenFilesTrust(uris) {
            // If workspace is untrusted, there is no conflict
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            const openFilesTrustInfo = await Promise.all(uris.map(uri => this.workspaceTrustManagementService.getUriTrustInfo(uri)));
            // If all uris are trusted, there is no conflict
            if (openFilesTrustInfo.map(info => info.trusted).every(trusted => trusted)) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            // If user has setting, don't need to ask
            if (this.untrustedFilesSetting !== 'prompt') {
                if (this.untrustedFilesSetting === 'newWindow') {
                    return 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */;
                }
                if (this.untrustedFilesSetting === 'open') {
                    return 1 /* WorkspaceTrustUriResponse.Open */;
                }
            }
            // If we already asked the user, don't need to ask again
            if (this.workspaceTrustManagementService.acceptsOutOfWorkspaceFiles) {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            }
            // Create/return a promise
            if (!this._openFilesTrustRequestPromise) {
                this._openFilesTrustRequestPromise = new Promise(resolve => {
                    this._openFilesTrustRequestResolver = resolve;
                });
            }
            else {
                return this._openFilesTrustRequestPromise;
            }
            this._onDidInitiateOpenFilesTrustRequest.fire();
            return this._openFilesTrustRequestPromise;
        }
        //#endregion
        //#region Workspace trust request
        resolveWorkspaceTrustRequest(trusted) {
            if (this._workspaceTrustRequestResolver) {
                this._workspaceTrustRequestResolver(trusted ?? this.workspaceTrustManagementService.isWorkspaceTrusted());
                this._workspaceTrustRequestResolver = undefined;
                this._workspaceTrustRequestPromise = undefined;
            }
        }
        cancelWorkspaceTrustRequest() {
            if (this._workspaceTrustRequestResolver) {
                this._workspaceTrustRequestResolver(undefined);
                this._workspaceTrustRequestResolver = undefined;
                this._workspaceTrustRequestPromise = undefined;
            }
        }
        async completeWorkspaceTrustRequest(trusted) {
            if (trusted === undefined || trusted === this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                this.resolveWorkspaceTrustRequest(trusted);
                return;
            }
            // Register one-time event handler to resolve the promise when workspace trust changed
            event_1.Event.once(this.workspaceTrustManagementService.onDidChangeTrust)(trusted => this.resolveWorkspaceTrustRequest(trusted));
            // Update storage, transition workspace state
            await this.workspaceTrustManagementService.setWorkspaceTrust(trusted);
        }
        async requestWorkspaceTrust(options) {
            // Trusted workspace
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return this.workspaceTrustManagementService.isWorkspaceTrusted();
            }
            // Modal request
            if (!this._workspaceTrustRequestPromise) {
                // Create promise
                this._workspaceTrustRequestPromise = new Promise(resolve => {
                    this._workspaceTrustRequestResolver = resolve;
                });
            }
            else {
                // Return existing promise
                return this._workspaceTrustRequestPromise;
            }
            this._onDidInitiateWorkspaceTrustRequest.fire(options);
            return this._workspaceTrustRequestPromise;
        }
        requestWorkspaceTrustOnStartup() {
            if (!this._workspaceTrustRequestPromise) {
                // Create promise
                this._workspaceTrustRequestPromise = new Promise(resolve => {
                    this._workspaceTrustRequestResolver = resolve;
                });
            }
            this._onDidInitiateWorkspaceTrustRequestOnStartup.fire();
        }
    };
    exports.WorkspaceTrustRequestService = WorkspaceTrustRequestService;
    exports.WorkspaceTrustRequestService = WorkspaceTrustRequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], WorkspaceTrustRequestService);
    class WorkspaceTrustTransitionManager extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.participants = new linkedList_1.LinkedList();
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            const remove = this.participants.push(participant);
            return (0, lifecycle_1.toDisposable)(() => remove());
        }
        async participate(trusted) {
            for (const participant of this.participants) {
                await participant.participate(trusted);
            }
        }
        dispose() {
            this.participants.clear();
            super.dispose();
        }
    }
    class WorkspaceTrustMemento {
        constructor(storageService) {
            this._acceptsOutOfWorkspaceFilesKey = 'acceptsOutOfWorkspaceFiles';
            this._isEmptyWorkspaceTrustedKey = 'isEmptyWorkspaceTrusted';
            if (storageService) {
                this._memento = new memento_1.Memento('workspaceTrust', storageService);
                this._mementoObject = this._memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this._mementoObject = {};
            }
        }
        get acceptsOutOfWorkspaceFiles() {
            return this._mementoObject[this._acceptsOutOfWorkspaceFilesKey] ?? false;
        }
        set acceptsOutOfWorkspaceFiles(value) {
            this._mementoObject[this._acceptsOutOfWorkspaceFilesKey] = value;
            this._memento?.saveMemento();
        }
        get isEmptyWorkspaceTrusted() {
            return this._mementoObject[this._isEmptyWorkspaceTrustedKey];
        }
        set isEmptyWorkspaceTrusted(value) {
            this._mementoObject[this._isEmptyWorkspaceTrustedKey] = value;
            this._memento?.saveMemento();
        }
    }
    (0, extensions_1.registerSingleton)(workspaceTrust_1.IWorkspaceTrustRequestService, WorkspaceTrustRequestService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlVHJ1c3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2NvbW1vbi93b3Jrc3BhY2VUcnVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3Qm5GLFFBQUEsdUJBQXVCLEdBQUcsa0NBQWtDLENBQUM7SUFDN0QsUUFBQSw4QkFBOEIsR0FBRyx3Q0FBd0MsQ0FBQztJQUMxRSxRQUFBLHNCQUFzQixHQUFHLGlDQUFpQyxDQUFDO0lBQzNELFFBQUEsK0JBQStCLEdBQUcseUNBQXlDLENBQUM7SUFDNUUsUUFBQSw0QkFBNEIsR0FBRyxzQ0FBc0MsQ0FBQztJQUN0RSxRQUFBLGlDQUFpQyxHQUFHLHVDQUF1QyxDQUFDO0lBQzVFLFFBQUEsMkJBQTJCLEdBQUcseUJBQXlCLENBQUM7SUFFckUsTUFBYSxrQkFBa0I7UUFDOUIsWUFDa0IsaUJBQTZCLEVBQzdCLG1CQUEwQixFQUMxQixzQkFBOEM7WUFGOUMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFZO1lBQzdCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBTztZQUMxQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1FBQzVELENBQUM7UUFHTCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUMzRCxPQUFPO29CQUNOLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSztvQkFDbkIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO29CQUNqQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7b0JBQzdCLEdBQUcsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFD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