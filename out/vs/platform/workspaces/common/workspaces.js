/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/labels", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/workspace"], function (require, exports, extpath_1, json, jsonEdit, labels_1, network_1, path_1, platform_1, resources_1, uri_1, instantiation_1, remoteHosts_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspacesService = void 0;
    exports.isRecentWorkspace = isRecentWorkspace;
    exports.isRecentFolder = isRecentFolder;
    exports.isRecentFile = isRecentFile;
    exports.isStoredWorkspaceFolder = isStoredWorkspaceFolder;
    exports.getStoredWorkspaceFolder = getStoredWorkspaceFolder;
    exports.toWorkspaceFolders = toWorkspaceFolders;
    exports.rewriteWorkspaceFileForNewLocation = rewriteWorkspaceFileForNewLocation;
    exports.restoreRecentlyOpened = restoreRecentlyOpened;
    exports.toStoreData = toStoreData;
    exports.IWorkspacesService = (0, instantiation_1.createDecorator)('workspacesService');
    function isRecentWorkspace(curr) {
        return curr.hasOwnProperty('workspace');
    }
    function isRecentFolder(curr) {
        return curr.hasOwnProperty('folderUri');
    }
    function isRecentFile(curr) {
        return curr.hasOwnProperty('fileUri');
    }
    //#endregion
    //#region Workspace File Utilities
    function isStoredWorkspaceFolder(obj) {
        return isRawFileWorkspaceFolder(obj) || isRawUriWorkspaceFolder(obj);
    }
    function isRawFileWorkspaceFolder(obj) {
        const candidate = obj;
        return typeof candidate?.path === 'string' && (!candidate.name || typeof candidate.name === 'string');
    }
    function isRawUriWorkspaceFolder(obj) {
        const candidate = obj;
        return typeof candidate?.uri === 'string' && (!candidate.name || typeof candidate.name === 'string');
    }
    /**
     * Given a folder URI and the workspace config folder, computes the `IStoredWorkspaceFolder`
     * using a relative or absolute path or a uri.
     * Undefined is returned if the `folderURI` and the `targetConfigFolderURI` don't have the
     * same schema or authority.
     *
     * @param folderURI a workspace folder
     * @param forceAbsolute if set, keep the path absolute
     * @param folderName a workspace name
     * @param targetConfigFolderURI the folder where the workspace is living in
     */
    function getStoredWorkspaceFolder(folderURI, forceAbsolute, folderName, targetConfigFolderURI, extUri) {
        // Scheme mismatch: use full absolute URI as `uri`
        if (folderURI.scheme !== targetConfigFolderURI.scheme) {
            return { name: folderName, uri: folderURI.toString(true) };
        }
        // Always prefer a relative path if possible unless
        // prevented to make the workspace file shareable
        // with other users
        let folderPath = !forceAbsolute ? extUri.relativePath(targetConfigFolderURI, folderURI) : undefined;
        if (folderPath !== undefined) {
            if (folderPath.length === 0) {
                folderPath = '.';
            }
            else {
                if (platform_1.isWindows) {
                    folderPath = massagePathForWindows(folderPath);
                }
            }
        }
        // We could not resolve a relative path
        else {
            // Local file: use `fsPath`
            if (folderURI.scheme === network_1.Schemas.file) {
                folderPath = folderURI.fsPath;
                if (platform_1.isWindows) {
                    folderPath = massagePathForWindows(folderPath);
                }
            }
            // Different authority: use full absolute URI
            else if (!extUri.isEqualAuthority(folderURI.authority, targetConfigFolderURI.authority)) {
                return { name: folderName, uri: folderURI.toString(true) };
            }
            // Non-local file: use `path` of URI
            else {
                folderPath = folderURI.path;
            }
        }
        return { name: folderName, path: folderPath };
    }
    function massagePathForWindows(folderPath) {
        // Drive letter should be upper case
        folderPath = (0, labels_1.normalizeDriveLetter)(folderPath);
        // Always prefer slash over backslash unless
        // we deal with UNC paths where backslash is
        // mandatory.
        if (!(0, extpath_1.isUNC)(folderPath)) {
            folderPath = (0, extpath_1.toSlashes)(folderPath);
        }
        return folderPath;
    }
    function toWorkspaceFolders(configuredFolders, workspaceConfigFile, extUri) {
        const result = [];
        const seen = new Set();
        const relativeTo = extUri.dirname(workspaceConfigFile);
        for (const configuredFolder of configuredFolders) {
            let uri = undefined;
            if (isRawFileWorkspaceFolder(configuredFolder)) {
                if (configuredFolder.path) {
                    uri = extUri.resolvePath(relativeTo, configuredFolder.path);
                }
            }
            else if (isRawUriWorkspaceFolder(configuredFolder)) {
                try {
                    uri = uri_1.URI.parse(configuredFolder.uri);
                    if (uri.path[0] !== path_1.posix.sep) {
                        uri = uri.with({ path: path_1.posix.sep + uri.path }); // this makes sure all workspace folder are absolute
                    }
                }
                catch (e) {
                    console.warn(e); // ignore
                }
            }
            if (uri) {
                // remove duplicates
                const comparisonKey = extUri.getComparisonKey(uri);
                if (!seen.has(comparisonKey)) {
                    seen.add(comparisonKey);
                    const name = configuredFolder.name || extUri.basenameOrAuthority(uri);
                    result.push(new workspace_1.WorkspaceFolder({ uri, name, index: result.length }, configuredFolder));
                }
            }
        }
        return result;
    }
    /**
     * Rewrites the content of a workspace file to be saved at a new location.
     * Throws an exception if file is not a valid workspace file
     */
    function rewriteWorkspaceFileForNewLocation(rawWorkspaceContents, configPathURI, isFromUntitledWorkspace, targetConfigPathURI, extUri) {
        const storedWorkspace = doParseStoredWorkspace(configPathURI, rawWorkspaceContents);
        const sourceConfigFolder = extUri.dirname(configPathURI);
        const targetConfigFolder = extUri.dirname(targetConfigPathURI);
        const rewrittenFolders = [];
        for (const folder of storedWorkspace.folders) {
            const folderURI = isRawFileWorkspaceFolder(folder) ? extUri.resolvePath(sourceConfigFolder, folder.path) : uri_1.URI.parse(folder.uri);
            let absolute;
            if (isFromUntitledWorkspace) {
                absolute = false; // if it was an untitled workspace, try to make paths relative
            }
            else {
                absolute = !isRawFileWorkspaceFolder(folder) || (0, path_1.isAbsolute)(folder.path); // for existing workspaces, preserve whether a path was absolute or relative
            }
            rewrittenFolders.push(getStoredWorkspaceFolder(folderURI, absolute, folder.name, targetConfigFolder, extUri));
        }
        // Preserve as much of the existing workspace as possible by using jsonEdit
        // and only changing the folders portion.
        const formattingOptions = { insertSpaces: false, tabSize: 4, eol: (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n' };
        const edits = jsonEdit.setProperty(rawWorkspaceContents, ['folders'], rewrittenFolders, formattingOptions);
        let newContent = jsonEdit.applyEdits(rawWorkspaceContents, edits);
        if ((0, resources_1.isEqualAuthority)(storedWorkspace.remoteAuthority, (0, remoteHosts_1.getRemoteAuthority)(targetConfigPathURI))) {
            // unsaved remote workspaces have the remoteAuthority set. Remove it when no longer nexessary.
            newContent = jsonEdit.applyEdits(newContent, jsonEdit.removeProperty(newContent, ['remoteAuthority'], formattingOptions));
        }
        return newContent;
    }
    function doParseStoredWorkspace(path, contents) {
        // Parse workspace file
        const storedWorkspace = json.parse(contents); // use fault tolerant parser
        // Filter out folders which do not have a path or uri set
        if (storedWorkspace && Array.isArray(storedWorkspace.folders)) {
            storedWorkspace.folders = storedWorkspace.folders.filter(folder => isStoredWorkspaceFolder(folder));
        }
        else {
            throw new Error(`${path} looks like an invalid workspace file.`);
        }
        return storedWorkspace;
    }
    function isSerializedRecentWorkspace(data) {
        return data.workspace && typeof data.workspace === 'object' && typeof data.workspace.id === 'string' && typeof data.workspace.configPath === 'string';
    }
    function isSerializedRecentFolder(data) {
        return typeof data.folderUri === 'string';
    }
    function isSerializedRecentFile(data) {
        return typeof data.fileUri === 'string';
    }
    function restoreRecentlyOpened(data, logService) {
        const result = { workspaces: [], files: [] };
        if (data) {
            const restoreGracefully = function (entries, onEntry) {
                for (let i = 0; i < entries.length; i++) {
                    try {
                        onEntry(entries[i], i);
                    }
                    catch (e) {
                        logService.warn(`Error restoring recent entry ${JSON.stringify(entries[i])}: ${e.toString()}. Skip entry.`);
                    }
                }
            };
            const storedRecents = data;
            if (Array.isArray(storedRecents.entries)) {
                restoreGracefully(storedRecents.entries, entry => {
                    const label = entry.label;
                    const remoteAuthority = entry.remoteAuthority;
                    if (isSerializedRecentWorkspace(entry)) {
                        result.workspaces.push({ label, remoteAuthority, workspace: { id: entry.workspace.id, configPath: uri_1.URI.parse(entry.workspace.configPath) } });
                    }
                    else if (isSerializedRecentFolder(entry)) {
                        result.workspaces.push({ label, remoteAuthority, folderUri: uri_1.URI.parse(entry.folderUri) });
                    }
                    else if (isSerializedRecentFile(entry)) {
                        result.files.push({ label, remoteAuthority, fileUri: uri_1.URI.parse(entry.fileUri) });
                    }
                });
            }
        }
        return result;
    }
    function toStoreData(recents) {
        const serialized = { entries: [] };
        for (const recent of recents.workspaces) {
            if (isRecentFolder(recent)) {
                serialized.entries.push({ folderUri: recent.folderUri.toString(), label: recent.label, remoteAuthority: recent.remoteAuthority });
            }
            else {
                serialized.entries.push({ workspace: { id: recent.workspace.id, configPath: recent.workspace.configPath.toString() }, label: recent.label, remoteAuthority: recent.remoteAuthority });
            }
        }
        for (const recent of recents.files) {
            serialized.entries.push({ fileUri: recent.fileUri.toString(), label: recent.label, remoteAuthority: recent.remoteAuthority });
        }
        return serialized;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlcy9jb21tb24vd29ya3NwYWNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxRWhHLDhDQUVDO0lBRUQsd0NBRUM7SUFFRCxvQ0FFQztJQU1ELDBEQUVDO0lBOENELDREQTRDQztJQWlCRCxnREFvQ0M7SUFNRCxnRkErQkM7SUE0REQsc0RBK0JDO0lBRUQsa0NBZ0JDO0lBcldZLFFBQUEsa0JBQWtCLEdBQUcsSUFBQSwrQkFBZSxFQUFxQixtQkFBbUIsQ0FBQyxDQUFDO0lBa0QzRixTQUFnQixpQkFBaUIsQ0FBQyxJQUFhO1FBQzlDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQWE7UUFDM0MsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxTQUFnQixZQUFZLENBQUMsSUFBYTtRQUN6QyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELFlBQVk7SUFFWixrQ0FBa0M7SUFFbEMsU0FBZ0IsdUJBQXVCLENBQUMsR0FBWTtRQUNuRCxPQUFPLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxTQUFTLHdCQUF3QixDQUFDLEdBQVk7UUFDN0MsTUFBTSxTQUFTLEdBQUcsR0FBMEMsQ0FBQztRQUU3RCxPQUFPLE9BQU8sU0FBUyxFQUFFLElBQUksS0FBSyxRQUFRLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksT0FBTyxTQUFTLENB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