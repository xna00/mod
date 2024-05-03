/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/ternarySearchTree", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/network"], function (require, exports, nls_1, path_1, ternarySearchTree_1, resources_1, uri_1, instantiation_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.STANDALONE_EDITOR_WORKSPACE_ID = exports.UNTITLED_WORKSPACE_NAME = exports.WORKSPACE_FILTER = exports.WORKSPACE_SUFFIX = exports.WORKSPACE_EXTENSION = exports.WorkspaceFolder = exports.Workspace = exports.WorkbenchState = exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE = exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE = exports.IWorkspaceContextService = void 0;
    exports.isSingleFolderWorkspaceIdentifier = isSingleFolderWorkspaceIdentifier;
    exports.isEmptyWorkspaceIdentifier = isEmptyWorkspaceIdentifier;
    exports.toWorkspaceIdentifier = toWorkspaceIdentifier;
    exports.isWorkspaceIdentifier = isWorkspaceIdentifier;
    exports.reviveIdentifier = reviveIdentifier;
    exports.isWorkspace = isWorkspace;
    exports.isWorkspaceFolder = isWorkspaceFolder;
    exports.toWorkspaceFolder = toWorkspaceFolder;
    exports.isUntitledWorkspace = isUntitledWorkspace;
    exports.isTemporaryWorkspace = isTemporaryWorkspace;
    exports.isStandaloneEditorWorkspace = isStandaloneEditorWorkspace;
    exports.isSavedWorkspace = isSavedWorkspace;
    exports.hasWorkspaceFileExtension = hasWorkspaceFileExtension;
    exports.IWorkspaceContextService = (0, instantiation_1.createDecorator)('contextService');
    function isSingleFolderWorkspaceIdentifier(obj) {
        const singleFolderIdentifier = obj;
        return typeof singleFolderIdentifier?.id === 'string' && uri_1.URI.isUri(singleFolderIdentifier.uri);
    }
    function isEmptyWorkspaceIdentifier(obj) {
        const emptyWorkspaceIdentifier = obj;
        return typeof emptyWorkspaceIdentifier?.id === 'string'
            && !isSingleFolderWorkspaceIdentifier(obj)
            && !isWorkspaceIdentifier(obj);
    }
    exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE = { id: 'ext-dev' };
    exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE = { id: 'empty-window' };
    function toWorkspaceIdentifier(arg0, isExtensionDevelopment) {
        // Empty workspace
        if (typeof arg0 === 'string' || typeof arg0 === 'undefined') {
            // With a backupPath, the basename is the empty workspace identifier
            if (typeof arg0 === 'string') {
                return {
                    id: (0, path_1.basename)(arg0)
                };
            }
            // Extension development empty windows have backups disabled
            // so we return a constant workspace identifier for extension
            // authors to allow to restore their workspace state even then.
            if (isExtensionDevelopment) {
                return exports.EXTENSION_DEVELOPMENT_EMPTY_WINDOW_WORKSPACE;
            }
            return exports.UNKNOWN_EMPTY_WINDOW_WORKSPACE;
        }
        // Multi root
        const workspace = arg0;
        if (workspace.configuration) {
            return {
                id: workspace.id,
                configPath: workspace.configuration
            };
        }
        // Single folder
        if (workspace.folders.length === 1) {
            return {
                id: workspace.id,
                uri: workspace.folders[0].uri
            };
        }
        // Empty window
        return {
            id: workspace.id
        };
    }
    function isWorkspaceIdentifier(obj) {
        const workspaceIdentifier = obj;
        return typeof workspaceIdentifier?.id === 'string' && uri_1.URI.isUri(workspaceIdentifier.configPath);
    }
    function reviveIdentifier(identifier) {
        // Single Folder
        const singleFolderIdentifierCandidate = identifier;
        if (singleFolderIdentifierCandidate?.uri) {
            return { id: singleFolderIdentifierCandidate.id, uri: uri_1.URI.revive(singleFolderIdentifierCandidate.uri) };
        }
        // Multi folder
        const workspaceIdentifierCandidate = identifier;
        if (workspaceIdentifierCandidate?.configPath) {
            return { id: workspaceIdentifierCandidate.id, configPath: uri_1.URI.revive(workspaceIdentifierCandidate.configPath) };
        }
        // Empty
        if (identifier?.id) {
            return { id: identifier.id };
        }
        return undefined;
    }
    var WorkbenchState;
    (function (WorkbenchState) {
        WorkbenchState[WorkbenchState["EMPTY"] = 1] = "EMPTY";
        WorkbenchState[WorkbenchState["FOLDER"] = 2] = "FOLDER";
        WorkbenchState[WorkbenchState["WORKSPACE"] = 3] = "WORKSPACE";
    })(WorkbenchState || (exports.WorkbenchState = WorkbenchState = {}));
    function isWorkspace(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && typeof candidate.id === 'string'
            && Array.isArray(candidate.folders));
    }
    function isWorkspaceFolder(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && uri_1.URI.isUri(candidate.uri)
            && typeof candidate.name === 'string'
            && typeof candidate.toResource === 'function');
    }
    class Workspace {
        constructor(_id, folders, _transient, _configuration, _ignorePathCasing) {
            this._id = _id;
            this._transient = _transient;
            this._configuration = _configuration;
            this._ignorePathCasing = _ignorePathCasing;
            this._foldersMap = ternarySearchTree_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            this.folders = folders;
        }
        update(workspace) {
            this._id = workspace.id;
            this._configuration = workspace.configuration;
            this._transient = workspace.transient;
            this._ignorePathCasing = workspace._ignorePathCasing;
            this.folders = workspace.folders;
        }
        get folders() {
            return this._folders;
        }
        set folders(folders) {
            this._folders = folders;
            this.updateFoldersMap();
        }
        get id() {
            return this._id;
        }
        get transient() {
            return this._transient;
        }
        get configuration() {
            return this._configuration;
        }
        set configuration(configuration) {
            this._configuration = configuration;
        }
        getFolder(resource) {
            if (!resource) {
                return null;
            }
            return this._foldersMap.findSubstr(resource) || null;
        }
        updateFoldersMap() {
            this._foldersMap = ternarySearchTree_1.TernarySearchTree.forUris(this._ignorePathCasing, () => true);
            for (const folder of this.folders) {
                this._foldersMap.set(folder.uri, folder);
            }
        }
        toJSON() {
            return { id: this.id, folders: this.folders, transient: this.transient, configuration: this.configuration };
        }
    }
    exports.Workspace = Workspace;
    class WorkspaceFolder {
        constructor(data, 
        /**
         * Provides access to the original metadata for this workspace
         * folder. This can be different from the metadata provided in
         * this class:
         * - raw paths can be relative
         * - raw paths are not normalized
         */
        raw) {
            this.raw = raw;
            this.uri = data.uri;
            this.index = data.index;
            this.name = data.name;
        }
        toResource(relativePath) {
            return (0, resources_1.joinPath)(this.uri, relativePath);
        }
        toJSON() {
            return { uri: this.uri, name: this.name, index: this.index };
        }
    }
    exports.WorkspaceFolder = WorkspaceFolder;
    function toWorkspaceFolder(resource) {
        return new WorkspaceFolder({ uri: resource, index: 0, name: (0, resources_1.basenameOrAuthority)(resource) }, { uri: resource.toString() });
    }
    exports.WORKSPACE_EXTENSION = 'code-workspace';
    exports.WORKSPACE_SUFFIX = `.${exports.WORKSPACE_EXTENSION}`;
    exports.WORKSPACE_FILTER = [{ name: (0, nls_1.localize)('codeWorkspace', "Code Workspace"), extensions: [exports.WORKSPACE_EXTENSION] }];
    exports.UNTITLED_WORKSPACE_NAME = 'workspace.json';
    function isUntitledWorkspace(path, environmentService) {
        return resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(path, environmentService.untitledWorkspacesHome);
    }
    function isTemporaryWorkspace(arg1) {
        let path;
        if (uri_1.URI.isUri(arg1)) {
            path = arg1;
        }
        else {
            path = arg1.configuration;
        }
        return path?.scheme === network_1.Schemas.tmp;
    }
    exports.STANDALONE_EDITOR_WORKSPACE_ID = '4064f6ec-cb38-4ad0-af64-ee6467e63c82';
    function isStandaloneEditorWorkspace(workspace) {
        return workspace.id === exports.STANDALONE_EDITOR_WORKSPACE_ID;
    }
    function isSavedWorkspace(path, environmentService) {
        return !isUntitledWorkspace(path, environmentService) && !isTemporaryWorkspace(path);
    }
    function hasWorkspaceFileExtension(path) {
        const ext = (typeof path === 'string') ? (0, path_1.extname)(path) : (0, resources_1.extname)(path);
        return ext === exports.WORKSPACE_SUFFIX;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2UvY29tbW9uL3dvcmtzcGFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxSWhHLDhFQUlDO0lBRUQsZ0VBS0M7SUFPRCxzREEyQ0M7SUFFRCxzREFJQztJQWVELDRDQW9CQztJQStDRCxrQ0FNQztJQTZCRCw4Q0FPQztJQStHRCw4Q0FFQztJQU9ELGtEQUVDO0lBSUQsb0RBU0M7SUFHRCxrRUFFQztJQUVELDRDQUVDO0lBRUQsOERBSUM7SUE5Y1ksUUFBQSx3QkFBd0IsR0FBRyxJQUFBLCtCQUFlLEVBQTJCLGdCQUFnQixDQUFDLENBQUM7SUF5SHBHLFNBQWdCLGlDQUFpQyxDQUFDLEdBQVk7UUFDN0QsTUFBTSxzQkFBc0IsR0FBRyxHQUFtRCxDQUFDO1FBRW5GLE9BQU8sT0FBTyxzQkFBc0IsRUFBRSxFQUFFLEtBQUssUUFBUSxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEcsQ0FBQztJQUVELFNBQWdCLDBCQUEwQixDQUFDLEdBQVk7UUFDdEQsTUFBTSx3QkFBd0IsR0FBRyxHQUE0QyxDQUFDO1FBQzlFLE9BQU8sT0FBTyx3QkFBd0IsRUFBRSxFQUFFLEtBQUssUUFBUTtlQUNuRCxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQztlQUN2QyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFWSxRQUFBLDRDQUE0QyxHQUE4QixFQUFFLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQztJQUM1RixRQUFBLDhCQUE4QixHQUE4QixFQUFFLEVBQUUsRUFBRSxjQUFjLEVBQUUsQ0FBQztJQUloRyxTQUFnQixxQkFBcUIsQ0FBQyxJ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