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
define(["require", "exports", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/product/common/product", "vs/platform/log/common/log"], function (require, exports, path_1, resources_1, uri_1, event_1, configuration_1, testWorkspace_1, platform_1, storage_1, extensions_1, lifecycle_1, product_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestMarkerService = exports.TestWorkspaceTrustRequestService = exports.TestWorkspaceTrustManagementService = exports.TestWorkspaceTrustEnablementService = exports.NullFilesConfigurationService = exports.TestActivityService = exports.TestProductService = exports.TestExtensionService = exports.TestWorkingCopyFileService = exports.TestWorkingCopy = exports.TestHistoryService = exports.TestStorageService = exports.TestContextService = exports.TestTextResourcePropertiesService = exports.TestLoggerService = void 0;
    exports.createFileStat = createFileStat;
    exports.mock = mock;
    class TestLoggerService extends log_1.AbstractLoggerService {
        constructor(logsHome) {
            super(log_1.LogLevel.Info, logsHome ?? uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }));
        }
        doCreateLogger() { return new log_1.NullLogger(); }
    }
    exports.TestLoggerService = TestLoggerService;
    let TestTextResourcePropertiesService = class TestTextResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService;
    exports.TestTextResourcePropertiesService = TestTextResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], TestTextResourcePropertiesService);
    class TestContextService {
        get onDidChangeWorkspaceName() { return this._onDidChangeWorkspaceName.event; }
        get onWillChangeWorkspaceFolders() { return this._onWillChangeWorkspaceFolders.event; }
        get onDidChangeWorkspaceFolders() { return this._onDidChangeWorkspaceFolders.event; }
        get onDidChangeWorkbenchState() { return this._onDidChangeWorkbenchState.event; }
        constructor(workspace = testWorkspace_1.TestWorkspace, options = null) {
            this.workspace = workspace;
            this.options = options || Object.create(null);
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this._onDidChangeWorkbenchState = new event_1.Emitter();
        }
        getFolders() {
            return this.workspace ? this.workspace.folders : [];
        }
        getWorkbenchState() {
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            if (this.workspace.folders.length) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        setWorkspace(workspace) {
            this.workspace = workspace;
        }
        getOptions() {
            return this.options;
        }
        updateOptions() { }
        isInsideWorkspace(resource) {
            if (resource && this.workspace) {
                return (0, resources_1.isEqualOrParent)(resource, this.workspace.folders[0].uri);
            }
            return false;
        }
        toResource(workspaceRelativePath) {
            return uri_1.URI.file((0, path_1.join)('C:\\', workspaceRelativePath));
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return uri_1.URI.isUri(workspaceIdOrFolder) && (0, resources_1.isEqual)(this.workspace.folders[0].uri, workspaceIdOrFolder);
        }
    }
    exports.TestContextService = TestContextService;
    class TestStorageService extends storage_1.InMemoryStorageService {
        testEmitWillSaveState(reason) {
            super.emitWillSaveState(reason);
        }
    }
    exports.TestStorageService = TestStorageService;
    class TestHistoryService {
        constructor(root) {
            this.root = root;
        }
        async reopenLastClosedEditor() { }
        async goForward() { }
        async goBack() { }
        async goPrevious() { }
        async goLast() { }
        removeFromHistory(_input) { }
        clear() { }
        clearRecentlyOpened() { }
        getHistory() { return []; }
        async openNextRecentlyUsedEditor(group) { }
        async openPreviouslyUsedEditor(group) { }
        getLastActiveWorkspaceRoot(_schemeFilter) { return this.root; }
        getLastActiveFile(_schemeFilter) { return undefined; }
    }
    exports.TestHistoryService = TestHistoryService;
    class TestWorkingCopy extends lifecycle_1.Disposable {
        constructor(resource, isDirty = false, typeId = 'testWorkingCopyType') {
            super();
            this.resource = resource;
            this.typeId = typeId;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.capabilities = 0 /* WorkingCopyCapabilities.None */;
            this.name = (0, resources_1.basename)(this.resource);
            this.dirty = false;
            this.dirty = isDirty;
        }
        setDirty(dirty) {
            if (this.dirty !== dirty) {
                this.dirty = dirty;
                this._onDidChangeDirty.fire();
            }
        }
        setContent(content) {
            this._onDidChangeContent.fire();
        }
        isDirty() {
            return this.dirty;
        }
        isModified() {
            return this.isDirty();
        }
        async save(options, stat) {
            this._onDidSave.fire({ reason: options?.reason ?? 1 /* SaveReason.EXPLICIT */, stat: stat ?? createFileStat(this.resource), source: options?.source });
            return true;
        }
        async revert(options) {
            this.setDirty(false);
        }
        async backup(token) {
            return {};
        }
    }
    exports.TestWorkingCopy = TestWorkingCopy;
    function createFileStat(resource, readonly = false) {
        return {
            resource,
            etag: Date.now().toString(),
            mtime: Date.now(),
            ctime: Date.now(),
            size: 42,
            isFile: true,
            isDirectory: false,
            isSymbolicLink: false,
            readonly,
            locked: false,
            name: (0, resources_1.basename)(resource),
            children: undefined
        };
    }
    class TestWorkingCopyFileService {
        constructor() {
            this.onWillRunWorkingCopyFileOperation = event_1.Event.None;
            this.onDidFailWorkingCopyFileOperation = event_1.Event.None;
            this.onDidRunWorkingCopyFileOperation = event_1.Event.None;
            this.hasSaveParticipants = false;
        }
        addFileOperationParticipant(participant) { return lifecycle_1.Disposable.None; }
        addSaveParticipant(participant) { return lifecycle_1.Disposable.None; }
        async runSaveParticipants(workingCopy, context, token) { }
        async delete(operations, token, undoInfo) { }
        registerWorkingCopyProvider(provider) { return lifecycle_1.Disposable.None; }
        getDirty(resource) { return []; }
        create(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        createFolder(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        move(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
        copy(operations, token, undoInfo) { throw new Error('Method not implemented.'); }
    }
    exports.TestWorkingCopyFileService = TestWorkingCopyFileService;
    function mock() {
        return function () { };
    }
    class TestExtensionService extends extensions_1.NullExtensionService {
    }
    exports.TestExtensionService = TestExtensionService;
    exports.TestProductService = { _serviceBrand: undefined, ...product_1.default };
    class TestActivityService {
        constructor() {
            this.onDidChangeActivity = event_1.Event.None;
        }
        getViewContainerActivities(viewContainerId) {
            return [];
        }
        getActivity(id) {
            return [];
        }
        showViewContainerActivity(viewContainerId, badge) {
            return this;
        }
        showViewActivity(viewId, badge) {
            return this;
        }
        showAccountsActivity(activity) {
            return this;
        }
        showGlobalActivity(activity) {
            return this;
        }
        dispose() { }
    }
    exports.TestActivityService = TestActivityService;
    exports.NullFilesConfigurationService = new class {
        constructor() {
            this.onDidChangeAutoSaveConfiguration = event_1.Event.None;
            this.onDidChangeAutoSaveDisabled = event_1.Event.None;
            this.onDidChangeReadonly = event_1.Event.None;
            this.onDidChangeFilesAssociation = event_1.Event.None;
            this.isHotExitEnabled = false;
            this.hotExitConfiguration = undefined;
        }
        getAutoSaveConfiguration() { throw new Error('Method not implemented.'); }
        getAutoSaveMode() { throw new Error('Method not implemented.'); }
        hasShortAutoSaveDelay() { throw new Error('Method not implemented.'); }
        toggleAutoSave() { throw new Error('Method not implemented.'); }
        disableAutoSave(resourceOrEditor) { throw new Error('Method not implemented.'); }
        isReadonly(resource, stat) { return false; }
        async updateReadonly(resource, readonly) { }
        preventSaveConflicts(resource, language) { throw new Error('Method not implemented.'); }
    };
    class TestWorkspaceTrustEnablementService {
        constructor(isEnabled = true) {
            this.isEnabled = isEnabled;
        }
        isWorkspaceTrustEnabled() {
            return this.isEnabled;
        }
    }
    exports.TestWorkspaceTrustEnablementService = TestWorkspaceTrustEnablementService;
    class TestWorkspaceTrustManagementService extends lifecycle_1.Disposable {
        constructor(trusted = true) {
            super();
            this.trusted = trusted;
            this._onDidChangeTrust = this._register(new event_1.Emitter());
            this.onDidChangeTrust = this._onDidChangeTrust.event;
            this._onDidChangeTrustedFolders = this._register(new event_1.Emitter());
            this.onDidChangeTrustedFolders = this._onDidChangeTrustedFolders.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
        }
        get acceptsOutOfWorkspaceFiles() {
            throw new Error('Method not implemented.');
        }
        set acceptsOutOfWorkspaceFiles(value) {
            throw new Error('Method not implemented.');
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not implemented.');
        }
        getTrustedUris() {
            throw new Error('Method not implemented.');
        }
        setParentFolderTrust(trusted) {
            throw new Error('Method not implemented.');
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not implemented.');
        }
        async setTrustedUris(folders) {
            throw new Error('Method not implemented.');
        }
        async setUrisTrust(uris, trusted) {
            throw new Error('Method not implemented.');
        }
        canSetParentFolderTrust() {
            throw new Error('Method not implemented.');
        }
        canSetWorkspaceTrust() {
            throw new Error('Method not implemented.');
        }
        isWorkspaceTrusted() {
            return this.trusted;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        get workspaceTrustInitialized() {
            return Promise.resolve();
        }
        get workspaceResolved() {
            return Promise.resolve();
        }
        async setWorkspaceTrust(trusted) {
            if (this.trusted !== trusted) {
                this.trusted = trusted;
                this._onDidChangeTrust.fire(this.trusted);
            }
        }
    }
    exports.TestWorkspaceTrustManagementService = TestWorkspaceTrustManagementService;
    class TestWorkspaceTrustRequestService extends lifecycle_1.Disposable {
        constructor(_trusted) {
            super();
            this._trusted = _trusted;
            this._onDidInitiateOpenFilesTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateOpenFilesTrustRequest = this._onDidInitiateOpenFilesTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequest = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequest = this._onDidInitiateWorkspaceTrustRequest.event;
            this._onDidInitiateWorkspaceTrustRequestOnStartup = this._register(new event_1.Emitter());
            this.onDidInitiateWorkspaceTrustRequestOnStartup = this._onDidInitiateWorkspaceTrustRequestOnStartup.event;
            this.requestOpenUrisHandler = async (uris) => {
                return 1 /* WorkspaceTrustUriResponse.Open */;
            };
        }
        requestOpenFilesTrust(uris) {
            return this.requestOpenUrisHandler(uris);
        }
        async completeOpenFilesTrustRequest(result, saveResponse) {
            throw new Error('Method not implemented.');
        }
        cancelWorkspaceTrustRequest() {
            throw new Error('Method not implemented.');
        }
        async completeWorkspaceTrustRequest(trusted) {
            throw new Error('Method not implemented.');
        }
        async requestWorkspaceTrust(options) {
            return this._trusted;
        }
        requestWorkspaceTrustOnStartup() {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestWorkspaceTrustRequestService = TestWorkspaceTrustRequestService;
    class TestMarkerService {
        constructor() {
            this.onMarkerChanged = event_1.Event.None;
        }
        getStatistics() { throw new Error('Method not implemented.'); }
        changeOne(owner, resource, markers) { }
        changeAll(owner, data) { }
        remove(owner, resources) { }
        read(filter) { return []; }
    }
    exports.TestMarkerService = TestMarkerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoVGVzdFNlcnZpY2VzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9jb21tb24vd29ya2JlbmNoVGVzdFNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQStOaEcsd0NBZUM7SUE4QkQsb0JBRUM7SUFoUEQsTUFBYSxpQkFBa0IsU0FBUSwyQkFBcUI7UUFDM0QsWUFBWSxRQUFjO1lBQ3pCLEtBQUssQ0FBQyxjQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsSUFBSSxTQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUNTLGNBQWMsS0FBYyxPQUFPLElBQUksZ0JBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNoRTtJQUxELDhDQUtDO0lBRU0sSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBaUM7UUFJN0MsWUFDeUMsb0JBQTJDO1lBQTNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFFcEYsQ0FBQztRQUVELE1BQU0sQ0FBQyxRQUFhLEVBQUUsUUFBaUI7WUFDdEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUN4RyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUN0RCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUM7WUFDRCxPQUFPLENBQUMsa0JBQU8sSUFBSSxzQkFBVyxDQUFDLENBQUMsQ0FB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