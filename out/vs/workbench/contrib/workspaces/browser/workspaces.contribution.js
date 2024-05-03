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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/workbench/services/host/browser/host", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/actions/common/actions", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/common/files"], function (require, exports, nls_1, platform_1, contributions_1, workspace_1, lifecycle_1, files_1, notification_1, resources_1, host_1, quickInput_1, storage_1, virtualWorkspace_1, actions_1, contextkeys_1, contextkey_1, files_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesFinderContribution = void 0;
    /**
     * A workbench contribution that will look for `.code-workspace` files in the root of the
     * workspace folder and open a notification to suggest to open one of the workspaces.
     */
    let WorkspacesFinderContribution = class WorkspacesFinderContribution extends lifecycle_1.Disposable {
        constructor(contextService, notificationService, fileService, quickInputService, hostService, storageService) {
            super();
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.fileService = fileService;
            this.quickInputService = quickInputService;
            this.hostService = hostService;
            this.storageService = storageService;
            this.findWorkspaces();
        }
        async findWorkspaces() {
            const folder = this.contextService.getWorkspace().folders[0];
            if (!folder || this.contextService.getWorkbenchState() !== 2 /* WorkbenchState.FOLDER */ || (0, virtualWorkspace_1.isVirtualWorkspace)(this.contextService.getWorkspace())) {
                return; // require a single (non virtual) root folder
            }
            const rootFileNames = (await this.fileService.resolve(folder.uri)).children?.map(child => child.name);
            if (Array.isArray(rootFileNames)) {
                const workspaceFiles = rootFileNames.filter(workspace_1.hasWorkspaceFileExtension);
                if (workspaceFiles.length > 0) {
                    this.doHandleWorkspaceFiles(folder.uri, workspaceFiles);
                }
            }
        }
        doHandleWorkspaceFiles(folder, workspaces) {
            const neverShowAgain = { id: 'workspaces.dontPromptToOpen', scope: notification_1.NeverShowAgainScope.WORKSPACE, isSecondary: true };
            // Prompt to open one workspace
            if (workspaces.length === 1) {
                const workspaceFile = workspaces[0];
                this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({
                    key: 'foundWorkspace',
                    comment: ['{Locked="]({1})"}']
                }, "This folder contains a workspace file '{0}'. Do you want to open it? [Learn more]({1}) about workspace files.", workspaceFile, 'https://go.microsoft.com/fwlink/?linkid=2025315'), [{
                        label: (0, nls_1.localize)('openWorkspace', "Open Workspace"),
                        run: () => this.hostService.openWindow([{ workspaceUri: (0, resources_1.joinPath)(folder, workspaceFile) }])
                    }], {
                    neverShowAgain,
                    priority: !this.storageService.isNew(1 /* StorageScope.WORKSPACE */) ? notification_1.NotificationPriority.SILENT : undefined // https://github.com/microsoft/vscode/issues/125315
                });
            }
            // Prompt to select a workspace from many
            else if (workspaces.length > 1) {
                this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)({
                    key: 'foundWorkspaces',
                    comment: ['{Locked="]({0})"}']
                }, "This folder contains multiple workspace files. Do you want to open one? [Learn more]({0}) about workspace files.", 'https://go.microsoft.com/fwlink/?linkid=2025315'), [{
                        label: (0, nls_1.localize)('selectWorkspace', "Select Workspace"),
                        run: () => {
                            this.quickInputService.pick(workspaces.map(workspace => ({ label: workspace })), { placeHolder: (0, nls_1.localize)('selectToOpen', "Select a workspace to open") }).then(pick => {
                                if (pick) {
                                    this.hostService.openWindow([{ workspaceUri: (0, resources_1.joinPath)(folder, pick.label) }]);
                                }
                            });
                        }
                    }], {
                    neverShowAgain,
                    priority: !this.storageService.isNew(1 /* StorageScope.WORKSPACE */) ? notification_1.NotificationPriority.SILENT : undefined // https://github.com/microsoft/vscode/issues/125315
                });
            }
        }
    };
    exports.WorkspacesFinderContribution = WorkspacesFinderContribution;
    exports.WorkspacesFinderContribution = WorkspacesFinderContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, notification_1.INotificationService),
        __param(2, files_1.IFileService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, host_1.IHostService),
        __param(5, storage_1.IStorageService)
    ], WorkspacesFinderContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WorkspacesFinderContribution, 4 /* LifecyclePhase.Eventually */);
    // Render "Open Workspace" button in *.code-workspace files
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.openWorkspaceFromEditor',
                title: (0, nls_1.localize2)('openWorkspace', "Open Workspace"),
                f1: false,
                menu: {
                    id: actions_1.MenuId.EditorContent,
                    when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Extension.isEqualTo(workspace_1.WORKSPACE_SUFFIX), contextkeys_1.ActiveEditorContext.isEqualTo(files_2.TEXT_FILE_EDITOR_ID), contextkeys_1.TemporaryWorkspaceContext.toNegated())
                }
            });
        }
        async run(accessor, uri) {
            const hostService = accessor.get(host_1.IHostService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const workspaceConfiguration = contextService.getWorkspace().configuration;
                if (workspaceConfiguration && (0, resources_1.isEqual)(workspaceConfiguration, uri)) {
                    notificationService.info((0, nls_1.localize)('alreadyOpen', "This workspace is already open."));
                    return; // workspace already opened
                }
            }
            return hostService.openWindow([{ workspaceUri: uri }]);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dvcmtzcGFjZXMvYnJvd3Nlci93b3Jrc3BhY2VzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQmhHOzs7T0FHRztJQUNJLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsc0JBQVU7UUFFM0QsWUFDNEMsY0FBd0MsRUFDNUMsbUJBQXlDLEVBQ2pELFdBQXlCLEVBQ25CLGlCQUFxQyxFQUMzQyxXQUF5QixFQUN0QixjQUErQjtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQVBtQyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNqRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzNDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3RCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUlqRSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDdkIsQ0FBQztRQUVPLEtBQUssQ0FBQyxjQUFjO1lBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxrQ0FBMEIsSUFBSSxJQUFBLHFDQUFrQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1SSxPQUFPLENBQUMsNkNBQTZDO1lBQ3RELENBQUM7WUFF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