/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/resources", "vs/base/common/cancellation", "vs/base/common/labels", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/dialogs/common/dialogs", "vs/base/common/uri", "vs/base/common/network", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, workspace_1, workspaceEditing_1, resources_1, cancellation_1, labels_1, commands_1, files_1, label_1, quickInput_1, getIconClasses_1, model_1, language_1, dialogs_1, uri_1, network_1, workspaces_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PICK_WORKSPACE_FOLDER_COMMAND_ID = exports.SET_ROOT_FOLDER_COMMAND_ID = exports.ADD_ROOT_FOLDER_LABEL = exports.ADD_ROOT_FOLDER_COMMAND_ID = void 0;
    exports.ADD_ROOT_FOLDER_COMMAND_ID = 'addRootFolder';
    exports.ADD_ROOT_FOLDER_LABEL = (0, nls_1.localize2)('addFolderToWorkspace', 'Add Folder to Workspace...');
    exports.SET_ROOT_FOLDER_COMMAND_ID = 'setRootFolder';
    exports.PICK_WORKSPACE_FOLDER_COMMAND_ID = '_workbench.pickWorkspaceFolder';
    // Command registration
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: '_files.pickFolderAndOpen',
        handler: (accessor, options) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen(options)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFolderInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFolderAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.files.openFileInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickFileAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.openWorkspaceInNewWindow',
        handler: (accessor) => accessor.get(dialogs_1.IFileDialogService).pickWorkspaceAndOpen({ forceNewWindow: true })
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.ADD_ROOT_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const folders = await selectWorkspaceFolders(accessor);
            if (!folders || !folders.length) {
                return;
            }
            await workspaceEditingService.addFolders(folders.map(folder => ({ uri: folder })));
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_ROOT_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const folders = await selectWorkspaceFolders(accessor);
            if (!folders || !folders.length) {
                return;
            }
            await workspaceEditingService.updateFolders(0, contextService.getWorkspace().folders.length, folders.map(folder => ({ uri: folder })));
        }
    });
    async function selectWorkspaceFolders(accessor) {
        const dialogsService = accessor.get(dialogs_1.IFileDialogService);
        const pathService = accessor.get(pathService_1.IPathService);
        const folders = await dialogsService.showOpenDialog({
            openLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'add', comment: ['&& denotes a mnemonic'] }, "&&Add")),
            title: (0, nls_1.localize)('addFolderToWorkspaceTitle', "Add Folder to Workspace"),
            canSelectFolders: true,
            canSelectMany: true,
            defaultUri: await dialogsService.defaultFolderPath(),
            availableFileSystems: [pathService.defaultUriScheme]
        });
        return folders;
    }
    commands_1.CommandsRegistry.registerCommand(exports.PICK_WORKSPACE_FOLDER_COMMAND_ID, async function (accessor, args) {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        const labelService = accessor.get(label_1.ILabelService);
        const contextService = accessor.get(workspace_1.IWorkspaceContextService);
        const modelService = accessor.get(model_1.IModelService);
        const languageService = accessor.get(language_1.ILanguageService);
        const folders = contextService.getWorkspace().folders;
        if (!folders.length) {
            return;
        }
        const folderPicks = folders.map(folder => {
            const label = folder.name;
            const description = labelService.getUriLabel((0, resources_1.dirname)(folder.uri), { relative: true });
            return {
                label,
                description: description !== label ? description : undefined, // https://github.com/microsoft/vscode/issues/183418
                folder,
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, folder.uri, files_1.FileKind.ROOT_FOLDER)
            };
        });
        const options = (args ? args[0] : undefined) || Object.create(null);
        if (!options.activeItem) {
            options.activeItem = folderPicks[0];
        }
        if (!options.placeHolder) {
            options.placeHolder = (0, nls_1.localize)('workspaceFolderPickerPlaceholder', "Select workspace folder");
        }
        if (typeof options.matchOnDescription !== 'boolean') {
            options.matchOnDescription = true;
        }
        const token = (args ? args[1] : undefined) || cancellation_1.CancellationToken.None;
        const pick = await quickInputService.pick(folderPicks, options, token);
        if (pick) {
            return folders[folderPicks.indexOf(pick)];
        }
        return;
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.openFolder',
        handler: (accessor, uriComponents, arg) => {
            const commandService = accessor.get(commands_1.ICommandService);
            // Be compatible to previous args by converting to options
            if (typeof arg === 'boolean') {
                arg = { forceNewWindow: arg };
            }
            // Without URI, ask to pick a folder or workspace to open
            if (!uriComponents) {
                const options = {
                    forceNewWindow: arg?.forceNewWindow
                };
                if (arg?.forceLocalWindow) {
                    options.remoteAuthority = null;
                    options.availableFileSystems = ['file'];
                }
                return commandService.executeCommand('_files.pickFolderAndOpen', options);
            }
            const uri = uri_1.URI.from(uriComponents, true);
            const options = {
                forceNewWindow: arg?.forceNewWindow,
                forceReuseWindow: arg?.forceReuseWindow,
                noRecentEntry: arg?.noRecentEntry,
                remoteAuthority: arg?.forceLocalWindow ? null : undefined,
                forceProfile: arg?.forceProfile,
                forceTempProfile: arg?.forceTempProfile,
            };
            const uriToOpen = ((0, workspace_1.hasWorkspaceFileExtension)(uri) || uri.scheme === network_1.Schemas.untitled) ? { workspaceUri: uri } : { folderUri: uri };
            return commandService.executeCommand('_files.windowOpen', [uriToOpen], options);
        },
        metadata: {
            description: 'Open a folder or workspace in the current window or new window depending on the newWindow argument. Note that opening in the same window will shutdown the current extension host process and start a new one on the given folder/workspace unless the newWindow parameter is set to true.',
            args: [
                {
                    name: 'uri', description: '(optional) Uri of the folder or workspace file to open. If not provided, a native dialog will ask the user for the folder',
                    constraint: (value) => value === undefined || value === null || value instanceof uri_1.URI
                },
                {
                    name: 'options',
                    description: '(optional) Options. Object with the following properties: ' +
                        '`forceNewWindow`: Whether to open the folder/workspace in a new window or the same. Defaults to opening in the same window. ' +
                        '`forceReuseWindow`: Whether to force opening the folder/workspace in the same window.  Defaults to false. ' +
                        '`noRecentEntry`: Whether the opened URI will appear in the \'Open Recent\' list. Defaults to false. ' +
                        'Note, for backward compatibility, options can also be of type boolean, representing the `forceNewWindow` setting.',
                    constraint: (value) => value === undefined || typeof value === 'object' || typeof value === 'boolean'
                }
            ]
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.newWindow',
        handler: (accessor, options) => {
            const commandService = accessor.get(commands_1.ICommandService);
            const commandOptions = {
                forceReuseWindow: options && options.reuseWindow,
                remoteAuthority: options && options.remoteAuthority
            };
            return commandService.executeCommand('_files.newWindow', commandOptions);
        },
        metadata: {
            description: 'Opens an new window depending on the newWindow argument.',
            args: [
                {
                    name: 'options',
                    description: '(optional) Options. Object with the following properties: ' +
                        '`reuseWindow`: Whether to open a new window or the same. Defaults to opening in a new window. ',
                    constraint: (value) => value === undefined || typeof value === 'object'
                }
            ]
        }
    });
    // recent history commands
    commands_1.CommandsRegistry.registerCommand('_workbench.removeFromRecentlyOpened', function (accessor, uri) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.removeRecentlyOpened([uri]);
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'vscode.removeFromRecentlyOpened',
        handler: (accessor, path) => {
            const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
            if (typeof path === 'string') {
                path = path.match(/^[^:/?#]+:\/\//) ? uri_1.URI.parse(path) : uri_1.URI.file(path);
            }
            else {
                path = uri_1.URI.revive(path); // called from extension host
            }
            return workspacesService.removeRecentlyOpened([path]);
        },
        metadata: {
            description: 'Removes an entry with the given path from the recently opened list.',
            args: [
                { name: 'path', description: 'URI or URI string to remove from recently opened.', constraint: (value) => typeof value === 'string' || value instanceof uri_1.URI }
            ]
        }
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.addToRecentlyOpened', async function (accessor, recentEntry) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        const uri = recentEntry.uri;
        const label = recentEntry.label;
        const remoteAuthority = recentEntry.remoteAuthority;
        let recent = undefined;
        if (recentEntry.type === 'workspace') {
            const workspace = await workspacesService.getWorkspaceIdentifier(uri);
            recent = { workspace, label, remoteAuthority };
        }
        else if (recentEntry.type === 'folder') {
            recent = { folderUri: uri, label, remoteAuthority };
        }
        else {
            recent = { fileUri: uri, label, remoteAuthority };
        }
        return workspacesService.addRecentlyOpened([recent]);
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.getRecentlyOpened', async function (accessor) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.getRecentlyOpened();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlQ29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL2FjdGlvbnMvd29ya3NwYWNlQ29tbWFuZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JuRixRQUFBLDBCQUEwQixHQUFHLGVBQWUsQ0FBQztJQUM3QyxRQUFBLHFCQUFxQixHQUFxQixJQUFBLGVBQVMsRUFBQyxzQkFBc0IsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRTFHLFFBQUEsMEJBQTBCLEdBQUcsZUFBZSxDQUFDO0lBRTdDLFFBQUEsZ0NBQWdDLEdBQUcsZ0NBQWdDLENBQUM7SUFFakYsdUJBQXVCO0lBRXZCLDJCQUFnQixDQUFDLGVBQWUsQ0FBQztRQUNoQyxFQUFFLEVBQUUsa0RBQWtEO1FBQ3RELE9BQU8sRUFBRSxDQUFDLFFBQTBCLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWtCLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQztLQUN6SCxDQUFDLENBQUM7SUFFSCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUM7UUFDaEMsRUFBRSxFQUFFLDBCQUEwQjtRQUM5QixPQUFPLEVBQUUsQ0FBQyxRQUEwQixFQUFFLE9BQW9DLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNEJBQWtCLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7S0FDMUksQ0FBQyxDQUFDO0lBRUgsMkJBQWdCLENBQUMsZUFBZSxDQUFDO1FBQ2hDLEVBQUUsRUFBRSw4Q0FBOEM7UUFDbEQsT0FBTyxFQUFFLENBQUMsUUFBMEIsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyw0QkFBa0IsQ0FBQyxDQUFDLGlC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