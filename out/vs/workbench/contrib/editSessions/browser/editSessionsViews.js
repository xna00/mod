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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/treeView", "vs/workbench/common/views", "vs/workbench/contrib/editSessions/common/editSessions", "vs/base/common/uri", "vs/base/common/date", "vs/base/common/codicons", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/platform/files/common/files", "vs/base/common/path"], function (require, exports, lifecycle_1, nls_1, descriptors_1, instantiation_1, platform_1, treeView_1, views_1, editSessions_1, uri_1, date_1, codicons_1, editorCommands_1, actions_1, contextkey_1, commands_1, dialogs_1, workspace_1, resources_1, files_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditSessionsDataViews = void 0;
    const EDIT_SESSIONS_COUNT_KEY = 'editSessionsCount';
    const EDIT_SESSIONS_COUNT_CONTEXT_KEY = new contextkey_1.RawContextKey(EDIT_SESSIONS_COUNT_KEY, 0);
    let EditSessionsDataViews = class EditSessionsDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.registerViews(container);
        }
        registerViews(container) {
            const viewId = editSessions_1.EDIT_SESSIONS_DATA_VIEW_ID;
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, viewId, editSessions_1.EDIT_SESSIONS_TITLE.value);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            treeView.dataProvider = this.instantiationService.createInstance(EditSessionDataViewDataProvider);
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id: viewId,
                    name: editSessions_1.EDIT_SESSIONS_TITLE,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    when: contextkey_1.ContextKeyExpr.and(editSessions_1.EDIT_SESSIONS_SHOW_VIEW),
                    order: 100,
                    hideByDefault: true,
                }], container);
            viewsRegistry.registerViewWelcomeContent(viewId, {
                content: (0, nls_1.localize)('noStoredChanges', 'You have no stored changes in the cloud to display.\n{0}', `[${(0, nls_1.localize)('storeWorkingChangesTitle', 'Store Working Changes')}](command:workbench.editSessions.actions.store)`),
                when: contextkey_1.ContextKeyExpr.equals(EDIT_SESSIONS_COUNT_KEY, 0),
                order: 1
            });
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.resume',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.resume.v2', "Resume Working Changes"),
                        icon: codicons_1.Codicon.desktopDownload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /edit-session/i)),
                            group: 'inline'
                        }
                    });
                }
                async run(accessor, handle) {
                    const editSessionId = uri_1.URI.parse(handle.$treeItemHandle).path.substring(1);
                    const commandService = accessor.get(commands_1.ICommandService);
                    await commandService.executeCommand('workbench.editSessions.actions.resumeLatest', editSessionId, true);
                    await treeView.refresh();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.store',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.store.v2', "Store Working Changes"),
                        icon: codicons_1.Codicon.cloudUpload,
                    });
                }
                async run(accessor, handle) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    await commandService.executeCommand('workbench.editSessions.actions.storeCurrent');
                    await treeView.refresh();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.delete',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.delete.v2', "Delete Working Changes"),
                        icon: codicons_1.Codicon.trash,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /edit-session/i)),
                            group: 'inline'
                        }
                    });
                }
                async run(accessor, handle) {
                    const editSessionId = uri_1.URI.parse(handle.$treeItemHandle).path.substring(1);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const editSessionStorageService = accessor.get(editSessions_1.IEditSessionsStorageService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('confirm delete.v2', 'Are you sure you want to permanently delete your working changes with ref {0}?', editSessionId),
                        detail: (0, nls_1.localize)('confirm delete detail.v2', ' You cannot undo this action.'),
                        type: 'warning',
                        title: editSessions_1.EDIT_SESSIONS_TITLE.value
                    });
                    if (result.confirmed) {
                        await editSessionStorageService.delete('editSessions', editSessionId);
                        await treeView.refresh();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: 'workbench.editSessions.actions.deleteAll',
                        title: (0, nls_1.localize)('workbench.editSessions.actions.deleteAll', "Delete All Working Changes from Cloud"),
                        icon: codicons_1.Codicon.trash,
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.greater(EDIT_SESSIONS_COUNT_KEY, 0)),
                        }
                    });
                }
                async run(accessor) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const editSessionStorageService = accessor.get(editSessions_1.IEditSessionsStorageService);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)('confirm delete all', 'Are you sure you want to permanently delete all stored changes from the cloud?'),
                        detail: (0, nls_1.localize)('confirm delete all detail', ' You cannot undo this action.'),
                        type: 'warning',
                        title: editSessions_1.EDIT_SESSIONS_TITLE.value
                    });
                    if (result.confirmed) {
                        await editSessionStorageService.delete('editSessions', null);
                        await treeView.refresh();
                    }
                }
            }));
        }
    };
    exports.EditSessionsDataViews = EditSessionsDataViews;
    exports.EditSessionsDataViews = EditSessionsDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], EditSessionsDataViews);
    let EditSessionDataViewDataProvider = class EditSessionDataViewDataProvider {
        constructor(editSessionsStorageService, contextKeyService, workspaceContextService, fileService) {
            this.editSessionsStorageService = editSessionsStorageService;
            this.contextKeyService = contextKeyService;
            this.workspaceContextService = workspaceContextService;
            this.fileService = fileService;
            this.editSessionsCount = EDIT_SESSIONS_COUNT_CONTEXT_KEY.bindTo(this.contextKeyService);
        }
        async getChildren(element) {
            if (!element) {
                return this.getAllEditSessions();
            }
            const [ref, folderName, filePath] = uri_1.URI.parse(element.handle).path.substring(1).split('/');
            if (ref && !folderName) {
                return this.getEditSession(ref);
            }
            else if (ref && folderName && !filePath) {
                return this.getEditSessionFolderContents(ref, folderName);
            }
            return [];
        }
        async getAllEditSessions() {
            const allEditSessions = await this.editSessionsStorageService.list('editSessions');
            this.editSessionsCount.set(allEditSessions.length);
            const editSessions = [];
            for (const session of allEditSessions) {
                const resource = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${session.ref}` });
                const sessionData = await this.editSessionsStorageService.read('editSessions', session.ref);
                if (!sessionData) {
                    continue;
                }
                const content = JSON.parse(sessionData.content);
                const label = content.folders.map((folder) => folder.name).join(', ') ?? session.ref;
                const machineId = content.machine;
                const machineName = machineId ? await this.editSessionsStorageService.getMachineById(machineId) : undefined;
                const description = machineName === undefined ? (0, date_1.fromNow)(session.created, true) : `${(0, date_1.fromNow)(session.created, true)}\u00a0\u00a0\u2022\u00a0\u00a0${machineName}`;
                editSessions.push({
                    handle: resource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label },
                    description: description,
                    themeIcon: codicons_1.Codicon.repo,
                    contextValue: `edit-session`
                });
            }
            return editSessions;
        }
        async getEditSession(ref) {
            const data = await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                return [];
            }
            const content = JSON.parse(data.content);
            if (content.folders.length === 1) {
                const folder = content.folders[0];
                return this.getEditSessionFolderContents(ref, folder.name);
            }
            return content.folders.map((folder) => {
                const resource = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folder.name}` });
                return {
                    handle: resource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: folder.name },
                    themeIcon: codicons_1.Codicon.folder
                };
            });
        }
        async getEditSessionFolderContents(ref, folderName) {
            const data = await this.editSessionsStorageService.read('editSessions', ref);
            if (!data) {
                return [];
            }
            const content = JSON.parse(data.content);
            const currentWorkspaceFolder = this.workspaceContextService.getWorkspace().folders.find((folder) => folder.name === folderName);
            const editSessionFolder = content.folders.find((folder) => folder.name === folderName);
            if (!editSessionFolder) {
                return [];
            }
            return Promise.all(editSessionFolder.workingChanges.map(async (change) => {
                const cloudChangeUri = uri_1.URI.from({ scheme: editSessions_1.EDIT_SESSIONS_SCHEME, authority: 'remote-session-content', path: `/${data.ref}/${folderName}/${change.relativeFilePath}` });
                if (currentWorkspaceFolder?.uri) {
                    // find the corresponding file in the workspace
                    const localCopy = (0, resources_1.joinPath)(currentWorkspaceFolder.uri, change.relativeFilePath);
                    if (change.type === editSessions_1.ChangeType.Addition && await this.fileService.exists(localCopy)) {
                        return {
                            handle: cloudChangeUri.toString(),
                            resourceUri: cloudChangeUri,
                            collapsibleState: views_1.TreeItemCollapsibleState.None,
                            label: { label: change.relativeFilePath },
                            themeIcon: codicons_1.Codicon.file,
                            command: {
                                id: 'vscode.diff',
                                title: (0, nls_1.localize)('compare changes', 'Compare Changes'),
                                arguments: [
                                    localCopy,
                                    cloudChangeUri,
                                    `${(0, path_1.basename)(change.relativeFilePath)} (${(0, nls_1.localize)('local copy', 'Local Copy')} \u2194 ${(0, nls_1.localize)('cloud changes', 'Cloud Changes')})`,
                                    undefined
                                ]
                            }
                        };
                    }
                }
                return {
                    handle: cloudChangeUri.toString(),
                    resourceUri: cloudChangeUri,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: change.relativeFilePath },
                    themeIcon: codicons_1.Codicon.file,
                    command: {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: (0, nls_1.localize)('open file', 'Open File'),
                        arguments: [cloudChangeUri, undefined, undefined]
                    }
                };
            }));
        }
    };
    EditSessionDataViewDataProvider = __decorate([
        __param(0, editSessions_1.IEditSessionsStorageService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, files_1.IFileService)
    ], EditSessionDataViewDataProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdFNlc3Npb25zVmlld3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2VkaXRTZXNzaW9ucy9icm93c2VyL2VkaXRTZXNzaW9uc1ZpZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXVCaEcsTUFBTSx1QkFBdUIsR0FBRyxtQkFBbUIsQ0FBQztJQUNwRCxNQUFNLCtCQUErQixHQUFHLElBQUksMEJBQWEsQ0FBUyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV2RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBQ3BELFlBQ0MsU0FBd0IsRUFDZ0Isb0JBQTJDO1lBRW5GLEtBQUssRUFBRSxDQUFDO1lBRmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFHbkYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRU8sYUFBYSxDQUFDLFNBQXdCO1lBQzdDLE1BQU0sTUFBTSxHQUFHLHlDQUEwQixDQUFDO1lBQzFDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUJBQVEsRUFBRSxNQUFNLEVBQUUsa0NBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkcsUUFBUSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUN0QyxRQUFRLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBRWxHLE1BQU0sYUFBYSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUFpQixrQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzVFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBc0I7b0JBQ2pELEVBQUUsRUFBRSxNQUFNO29CQUNWLElBQUksRUFBRSxrQ0FBbUI7b0JBQ3pCLGNBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUJBQVksQ0FBQztvQkFDaEQsbUJBQW1CLEVBQUUsSUFBSTtvQkFDekIsV0FBVyxFQUFFLEtBQUs7b0JBQ2xCLFFBQVE7b0JBQ1IsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxzQ0FBdUIsQ0FBQztvQkFDakQsS0FBSyxFQUFFLEdBQUc7b0JBQ1YsYUFBYSxFQUFFLElBQUk7aUJBQ25CLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVmLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hELE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFDaEIsaUJBQWlCLEVBQ2pCLDBEQUEwRCxFQUMxRCxJQUFJLElBQUEsY0FBUSxFQUFDLDBCQUEwQixFQUFFLHVCQUF1QixDQUFDLGlEQUFpRCxDQUNsSDtnQkFDRCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RCxLQUFLLEVBQUUsQ0FBQzthQUNSLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztnQkFDbkQ7b0JBQ0MsS0FBSyxDQUFDO3dCQUNMLEVBQUUsRUFBRSx1Q0FBdUM7d0JBQzNDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSx3QkFBd0IsQ0FBQzt3QkFDckYsSUFBSSxFQUFFLGtCQUFPLENBQUMsZUFBZTt3QkFDN0IsSUFBSSxFQUFFOzRCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7NEJBQzFCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsMkJBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNsSCxLQUFLLEVBQUUsUUFBUTt5QkFDZjtxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBNkI7b0JBQ2xFLE1BQU0sYUFBYSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsNkNBQTZDLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUN4RyxNQUFNLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLHNDQUFzQzt3QkFDMUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHlDQUF5QyxFQUFFLHVCQUF1QixDQUFDO3dCQUNuRixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxXQUFXO3FCQUN6QixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBNkI7b0JBQ2xFLE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMEJBQWUsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsNkNBQTZDLENBQUMsQ0FBQztvQkFDbkYsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzFCLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztnQkFDbkQ7b0JBQ0MsS0FBSyxDQUFDO3dCQUNMLEVBQUUsRUFBRSx1Q0FBdUM7d0JBQzNDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQywwQ0FBMEMsRUFBRSx3QkFBd0IsQ0FBQzt3QkFDckYsSUFBSSxFQUFFLGtCQUFPLENBQUMsS0FBSzt3QkFDbkIsSUFBSSxFQUFFOzRCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGVBQWU7NEJBQzFCLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsMkJBQWMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDOzRCQUNsSCxLQUFLLEVBQUUsUUFBUTt5QkFDZjtxQkFDRCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBNkI7b0JBQ2xFLE1BQU0sYUFBYSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFFLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0JBQWMsQ0FBQyxDQUFDO29CQUNuRCxNQUFNLHlCQUF5QixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMENBQTJCLENBQUMsQ0FBQztvQkFDNUUsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsT0FBTyxDQUFDO3dCQUMxQyxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsZ0ZBQWdGLEVBQUUsYUFBYSxDQUFDO3dCQUN2SSxNQUFNLEVBQUUsSUFBQSxjQUFRLEVBQUMsMEJBQTBCLEVBQUUsK0JBQStCLENBQUM7d0JBQzdFLElBQUksRUFBRSxTQUFTO3dCQUNmLEtBQUssRUFBRSxrQ0FBbUIsQ0FBQyxLQUFLO3FCQUNoQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3RCLE1BQU0seUJBQXlCLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQzt3QkFDdEUsTUFBTSxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzFCLENBQUM7Z0JBQ0YsQ0FBQzthQUNELENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGlCQUFPO2dCQUNuRDtvQkFDQyxLQUFLLENBQUM7d0JBQ0wsRUFBRSxFQUFFLDBDQUEwQzt3QkFDOUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLDBDQUEwQyxFQUFFLHVDQUF1QyxDQUFDO3dCQUNwRyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLO3dCQUNuQixJQUFJLEVBQUU7NEJBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsU0FBUzs0QkFDcEIsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDJCQUFjLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRSwyQkFBYyxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQzt5QkFDbkg7cUJBQ0QsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtvQkFDbkMsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBYyxDQUFDLENBQUM7b0JBQ25ELE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQ0FBMkIsQ0FBQyxDQUFDO29CQUM1RSxNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxPQUFPLENBQUM7d0JBQzFDLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyxvQkFBb0IsRUFBRSxnRkFBZ0YsQ0FBQzt3QkFDekgsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLCtCQUErQixDQUFDO3dCQUM5RSxJQUFJLEVBQUUsU0FBUzt3QkFDZixLQUFLLEVBQUUsa0NBQW1CLENBQUMsS0FBSztxQkFDaEMsQ0FBQyxDQUFDO29CQUNILElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUN0QixNQUFNLHlCQUF5QixDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7d0JBQzdELE1BQU0sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUMxQixDQUFDO2dCQUNGLENBQUM7YUFDRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBMUlZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBRy9CLFdBQUEscUNBQXFCLENBQUE7T0FIWCxxQkFBcUIsQ0EwSWpDO0lBRUQsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBK0I7UUFJcEMsWUFDK0MsMEJBQXVELEVBQ2hFLGlCQUFxQyxFQUMvQix1QkFBaUQsRUFDN0QsV0FBeUI7WUFIViwrQkFBMEIsR0FBMUIsMEJBQTBCLENBQTZCO1lBQ2hFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDL0IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUM3RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUV4RCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsK0JBQStCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pGLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQW1CO1lBQ3BDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ2xDLENBQUM7WUFFRCxNQUFNLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUUzRixJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN4QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQztpQkFBTSxJQUFJLEdBQUcsSUFBSSxVQUFVLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUMsNEJBQTRCLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzNELENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCO1lBQy9CLE1BQU0sZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNuRixJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUM7WUFFeEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxlQUFlLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxtQ0FBb0IsRUFBRSxTQUFTLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDMUgsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzVGLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDbEIsU0FBUztnQkFDVixDQUFDO2dCQUNELE1BQU0sT0FBTyxHQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDckYsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDbEMsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDNUcsTUFBTSxXQUFXLEdBQUcsV0FBVyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFPLEVBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFBLGNBQU8sRUFBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxpQ0FBaUMsV0FBVyxFQUFFLENBQUM7Z0JBRWpLLFlBQVksQ0FBQyxJQUFJLENBQUM7b0JBQ2pCLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFO29CQUMzQixnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTO29CQUNwRCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUU7b0JBQ2hCLFdBQVcsRUFBRSxXQUFXO29CQUN4QixTQUFTLEVBQUUsa0JBQU8sQ0FBQyxJQUFJO29CQUN2QixZQUFZLEVBQUUsY0FBYztpQkFDNUIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sWUFBWSxDQUFDO1FBQ3JCLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQVc7WUFDdkMsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUU3RSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXRELElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xDLE9BQU8sSUFBSSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDckMsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxtQ0FBb0IsRUFBRSxTQUFTLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN0SSxPQUFPO29CQUNOLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFO29CQUMzQixnQkFBZ0IsRUFBRSxnQ0FBd0IsQ0FBQyxTQUFTO29CQUNwRCxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRTtvQkFDN0IsU0FBUyxFQUFFLGtCQUFPLENBQUMsTUFBTTtpQkFDekIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxHQUFXLEVBQUUsVUFBa0I7WUFDekUsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUU3RSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXRELE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUM7WUFDaEksTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztZQUV2RixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUN4RSxNQUFNLGNBQWMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLG1DQUFvQixFQUFFLFNBQVMsRUFBRSx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRXRLLElBQUksc0JBQXNCLEVBQUUsR0FBRyxFQUFFLENBQUM7b0JBQ2pDLCtDQUErQztvQkFDL0MsTUFBTSxTQUFTLEdBQUcsSUFBQSxvQkFBUSxFQUFDLHNCQUFzQixDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDaEYsSUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLHlCQUFVLENBQUMsUUFBUSxJQUFJLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDckYsT0FBTzs0QkFDTixNQUFNLEVBQUUsY0FBYyxDQUFDLFFBQVEsRUFBRTs0QkFDakMsV0FBVyxFQUFFLGNBQWM7NEJBQzNCLGdCQUFnQixFQUFFLGdDQUF3QixDQUFDLElBQUk7NEJBQy9DLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUU7NEJBQ3pDLFNBQVMsRUFBRSxrQkFBTyxDQUFDLElBQUk7NEJBQ3ZCLE9BQU8sRUFBRTtnQ0FDUixFQUFFLEVBQUUsYUFBYTtnQ0FDakIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDO2dDQUNyRCxTQUFTLEVBQUU7b0NBQ1YsU0FBUztvQ0FDVCxjQUFjO29DQUNkLEdBQUcsSUFBQSxlQUFRLEVBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssSUFBQSxjQUFRLEVBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxXQUFXLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsR0FBRztvQ0FDckksU0FBUztpQ0FDVDs2QkFDRDt5QkFDRCxDQUFDO29CQUNILENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxPQUFPO29CQUNOLE1BQU0sRUFBRSxjQUFjLENBQUMsUUFBUSxFQUFFO29CQUNqQyxXQUFXLEVBQUUsY0FBYztvQkFDM0IsZ0JBQWdCLEVBQUUsZ0NBQXdCLENBQUMsSUFBSTtvQkFDL0MsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRTtvQkFDekMsU0FBUyxFQUFFLGtCQUFPLENBQUMsSUFBSTtvQkFDdkIsT0FBTyxFQUFFO3dCQUNSLEVBQUUsRUFBRSwyQ0FBMEI7d0JBQzlCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsV0FBVyxDQUFDO3dCQUN6QyxTQUFTLEVBQUUsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQztxQkFDakQ7aUJBQ0QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0QsQ0FBQTtJQTNJSywrQkFBK0I7UUFLbEMsV0FBQSwwQ0FBMkIsQ0FBQTtRQUMzQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxvQkFBWSxDQUFBO09BUlQsK0JBQStCLENBMklwQyJ9