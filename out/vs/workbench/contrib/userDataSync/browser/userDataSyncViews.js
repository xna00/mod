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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/base/common/date", "vs/platform/dialogs/common/dialogs", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/codicons", "vs/base/common/actions", "vs/workbench/services/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/base/common/resources", "vs/workbench/browser/parts/editor/editorCommands", "vs/platform/files/common/files", "vs/platform/environment/common/environment", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/commands/common/commands", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/contrib/userDataSync/browser/userDataSyncConflictsView"], function (require, exports, platform_1, views_1, nls_1, descriptors_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, themeService_1, date_1, dialogs_1, event_1, lifecycle_1, codicons_1, actions_2, userDataSync_2, userDataSyncMachines_1, quickInput_1, notification_1, resources_1, editorCommands_1, files_1, environment_1, uriIdentity_1, commands_1, userDataProfile_1, userDataSyncConflictsView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncDataViews = void 0;
    let UserDataSyncDataViews = class UserDataSyncDataViews extends lifecycle_1.Disposable {
        constructor(container, instantiationService, userDataSyncEnablementService, userDataSyncMachinesService, userDataSyncService) {
            super();
            this.instantiationService = instantiationService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.userDataSyncService = userDataSyncService;
            this.registerViews(container);
        }
        registerViews(container) {
            this.registerConflictsView(container);
            this.registerActivityView(container, true);
            this.registerMachinesView(container);
            this.registerActivityView(container, false);
            this.registerTroubleShootView(container);
            this.registerExternalActivityView(container);
        }
        registerConflictsView(container) {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewName = (0, nls_1.localize2)('conflicts', "Conflicts");
            viewsRegistry.registerViews([{
                    id: userDataSync_2.SYNC_CONFLICTS_VIEW_ID,
                    name: viewName,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(userDataSyncConflictsView_1.UserDataSyncConflictsViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_ENABLE_SYNC_CONFLICTS_VIEW, userDataSync_2.CONTEXT_HAS_CONFLICTS),
                    canToggleVisibility: false,
                    canMoveView: false,
                    treeView: this.instantiationService.createInstance(treeView_1.TreeView, userDataSync_2.SYNC_CONFLICTS_VIEW_ID, viewName.value),
                    collapsed: false,
                    order: 100,
                }], container);
        }
        registerMachinesView(container) {
            const id = `workbench.views.sync.machines`;
            const name = (0, nls_1.localize2)('synced machines', "Synced Machines");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncMachinesViewDataProvider, treeView);
            treeView.showRefreshAction = true;
            treeView.canSelectMany = true;
            treeView.dataProvider = dataProvider;
            this._register(event_1.Event.any(this.userDataSyncMachinesService.onDidChange, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 300,
                }], container);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.editMachineName`,
                        title: (0, nls_1.localize)('workbench.actions.sync.editMachineName', "Edit Name"),
                        icon: codicons_1.Codicon.edit,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const changed = await dataProvider.rename(handle.$treeItemHandle);
                    if (changed) {
                        await treeView.refresh();
                    }
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.turnOffSyncOnMachine`,
                        title: (0, nls_1.localize)('workbench.actions.sync.turnOffSyncOnMachine', "Turn off Settings Sync"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', id), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-machine')),
                        },
                    });
                }
                async run(accessor, handle, selected) {
                    if (await dataProvider.disable((selected || [handle]).map(handle => handle.$treeItemHandle))) {
                        await treeView.refresh();
                    }
                }
            }));
        }
        registerActivityView(container, remote) {
            const id = `workbench.views.sync.${remote ? 'remote' : 'local'}Activity`;
            const name = remote ? (0, nls_1.localize2)('remote sync activity title', "Sync Activity (Remote)") : (0, nls_1.localize2)('local sync activity title', "Sync Activity (Local)");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            treeView.showCollapseAllAction = true;
            treeView.showRefreshAction = true;
            treeView.dataProvider = remote ? this.instantiationService.createInstance(RemoteUserDataSyncActivityViewDataProvider)
                : this.instantiationService.createInstance(LocalUserDataSyncActivityViewDataProvider);
            this._register(event_1.Event.any(this.userDataSyncEnablementService.onDidChangeResourceEnablement, this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncService.onDidResetLocal, this.userDataSyncService.onDidResetRemote)(() => treeView.refresh()));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS),
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: remote ? 200 : 400,
                    hideByDefault: !remote,
                }], container);
            this.registerDataViewActions(id);
        }
        registerExternalActivityView(container) {
            const id = `workbench.views.sync.externalActivity`;
            const name = (0, nls_1.localize2)('downloaded sync activity title', "Sync Activity (Developer)");
            const dataProvider = this.instantiationService.createInstance(ExtractedUserDataSyncActivityViewDataProvider, undefined);
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            treeView.showCollapseAllAction = false;
            treeView.showRefreshAction = false;
            treeView.dataProvider = dataProvider;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS,
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    hideByDefault: false,
                }], container);
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.loadActivity`,
                        title: (0, nls_1.localize)('workbench.actions.sync.loadActivity', "Load Sync Activity"),
                        icon: codicons_1.Codicon.cloudUpload,
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.equals('view', id),
                            group: 'navigation',
                        },
                    });
                }
                async run(accessor) {
                    const fileDialogService = accessor.get(dialogs_1.IFileDialogService);
                    const result = await fileDialogService.showOpenDialog({
                        title: (0, nls_1.localize)('select sync activity file', "Select Sync Activity File or Folder"),
                        canSelectFiles: true,
                        canSelectFolders: true,
                        canSelectMany: false,
                    });
                    if (!result?.[0]) {
                        return;
                    }
                    dataProvider.activityDataResource = result[0];
                    await treeView.refresh();
                }
            }));
        }
        registerDataViewActions(viewId) {
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.resolveResource`,
                        title: (0, nls_1.localize)('workbench.actions.sync.resolveResourceRef', "Show raw JSON sync data"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const { resource } = JSON.parse(handle.$treeItemHandle);
                    const editorService = accessor.get(editorService_1.IEditorService);
                    await editorService.openEditor({ resource: uri_1.URI.parse(resource), options: { pinned: true } });
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.compareWithLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.compareWithLocal', "Compare with Local"),
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-associatedResource-.*/i))
                        },
                    });
                }
                async run(accessor, handle) {
                    const commandService = accessor.get(commands_1.ICommandService);
                    const { resource, comparableResource } = JSON.parse(handle.$treeItemHandle);
                    const remoteResource = uri_1.URI.parse(resource);
                    const localResource = uri_1.URI.parse(comparableResource);
                    return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, remoteResource, localResource, (0, nls_1.localize)('remoteToLocalDiff', "{0} ↔ {1}", (0, nls_1.localize)({ key: 'leftResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(remoteResource)), (0, nls_1.localize)({ key: 'rightResourceName', comment: ['local as in file in disk'] }, "{0} (Local)", (0, resources_1.basename)(localResource))), undefined);
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.${viewId}.replaceCurrent`,
                        title: (0, nls_1.localize)('workbench.actions.sync.replaceCurrent', "Restore"),
                        icon: codicons_1.Codicon.discard,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i)),
                            group: 'inline',
                        },
                    });
                }
                async run(accessor, handle) {
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                    const { syncResourceHandle, syncResource } = JSON.parse(handle.$treeItemHandle);
                    const result = await dialogService.confirm({
                        message: (0, nls_1.localize)({ key: 'confirm replace', comment: ['A confirmation message to replace current user data (settings, extensions, keybindings, snippets) with selected version'] }, "Would you like to replace your current {0} with selected?", (0, userDataSync_2.getSyncAreaLabel)(syncResource)),
                        type: 'info',
                        title: userDataSync_2.SYNC_TITLE.value
                    });
                    if (result.confirmed) {
                        return userDataSyncService.replace({ created: syncResourceHandle.created, uri: uri_1.URI.revive(syncResourceHandle.uri) });
                    }
                }
            }));
        }
        registerTroubleShootView(container) {
            const id = `workbench.views.sync.troubleshoot`;
            const name = (0, nls_1.localize2)('troubleshoot', "Troubleshoot");
            const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name.value);
            const dataProvider = this.instantiationService.createInstance(UserDataSyncTroubleshootViewDataProvider);
            treeView.showRefreshAction = true;
            treeView.dataProvider = dataProvider;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([{
                    id,
                    name,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                    when: userDataSync_2.CONTEXT_ENABLE_ACTIVITY_VIEWS,
                    canToggleVisibility: true,
                    canMoveView: false,
                    treeView,
                    collapsed: false,
                    order: 500,
                    hideByDefault: true
                }], container);
        }
    };
    exports.UserDataSyncDataViews = UserDataSyncDataViews;
    exports.UserDataSyncDataViews = UserDataSyncDataViews = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, userDataSync_1.IUserDataSyncService)
    ], UserDataSyncDataViews);
    let UserDataSyncActivityViewDataProvider = class UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService) {
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncResourceProviderService = userDataSyncResourceProviderService;
            this.userDataAutoSyncService = userDataAutoSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.notificationService = notificationService;
            this.userDataProfilesService = userDataProfilesService;
            this.syncResourceHandlesByProfile = new Map();
        }
        async getChildren(element) {
            try {
                if (!element) {
                    return await this.getRoots();
                }
                if (element.profile || element.handle === this.userDataProfilesService.defaultProfile.id) {
                    let promise = this.syncResourceHandlesByProfile.get(element.handle);
                    if (!promise) {
                        this.syncResourceHandlesByProfile.set(element.handle, promise = this.getSyncResourceHandles(element.profile));
                    }
                    return await promise;
                }
                if (element.syncResourceHandle) {
                    return await this.getChildrenForSyncResourceTreeItem(element);
                }
                return [];
            }
            catch (error) {
                if (!(error instanceof userDataSync_1.UserDataSyncError)) {
                    error = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                }
                if (error instanceof userDataSync_1.UserDataSyncError && error.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: error.message,
                        actions: {
                            primary: [
                                new actions_2.Action('reset', (0, nls_1.localize)('reset', "Reset Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                            ]
                        }
                    });
                }
                else {
                    this.notificationService.error(error);
                }
                throw error;
            }
        }
        async getRoots() {
            this.syncResourceHandlesByProfile.clear();
            const roots = [];
            const profiles = await this.getProfiles();
            if (profiles.length) {
                const profileTreeItem = {
                    handle: this.userDataProfilesService.defaultProfile.id,
                    label: { label: this.userDataProfilesService.defaultProfile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Expanded,
                };
                roots.push(profileTreeItem);
            }
            else {
                const defaultSyncResourceHandles = await this.getSyncResourceHandles();
                roots.push(...defaultSyncResourceHandles);
            }
            for (const profile of profiles) {
                const profileTreeItem = {
                    handle: profile.id,
                    label: { label: profile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    profile,
                };
                roots.push(profileTreeItem);
            }
            return roots;
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const syncResourceHandle = element.syncResourceHandle;
            const associatedResources = await this.userDataSyncResourceProviderService.getAssociatedResources(syncResourceHandle);
            const previousAssociatedResources = syncResourceHandle.previous ? await this.userDataSyncResourceProviderService.getAssociatedResources(syncResourceHandle.previous) : [];
            return associatedResources.map(({ resource, comparableResource }) => {
                const handle = JSON.stringify({ resource: resource.toString(), comparableResource: comparableResource.toString() });
                const previousResource = previousAssociatedResources.find(previous => (0, resources_1.basename)(previous.resource) === (0, resources_1.basename)(resource))?.resource;
                return {
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: resource,
                    command: previousResource ? {
                        id: editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [
                            previousResource,
                            resource,
                            (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.previous.created, true)})`, `${(0, resources_1.basename)(resource)} (${(0, date_1.fromNow)(syncResourceHandle.created, true)})`),
                            undefined
                        ]
                    } : {
                        id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID,
                        title: '',
                        arguments: [resource, undefined, undefined]
                    },
                    contextValue: `sync-associatedResource-${syncResourceHandle.syncResource}`
                };
            });
        }
        async getSyncResourceHandles(profile) {
            const treeItems = [];
            const result = await Promise.all(userDataSync_1.ALL_SYNC_RESOURCES.map(async (syncResource) => {
                const resourceHandles = await this.getResourceHandles(syncResource, profile);
                return resourceHandles.map((resourceHandle, index) => ({ ...resourceHandle, syncResource, previous: resourceHandles[index + 1] }));
            }));
            const syncResourceHandles = result.flat().sort((a, b) => b.created - a.created);
            for (const syncResourceHandle of syncResourceHandles) {
                const handle = JSON.stringify({ syncResourceHandle, syncResource: syncResourceHandle.syncResource });
                treeItems.push({
                    handle,
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResourceHandle.syncResource) },
                    description: (0, date_1.fromNow)(syncResourceHandle.created, true),
                    tooltip: new Date(syncResourceHandle.created).toLocaleString(),
                    themeIcon: themeService_1.FolderThemeIcon,
                    syncResourceHandle,
                    contextValue: `sync-resource-${syncResourceHandle.syncResource}`
                });
            }
            return treeItems;
        }
    };
    UserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(2, userDataSync_1.IUserDataAutoSyncService),
        __param(3, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(4, notification_1.INotificationService),
        __param(5, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncActivityViewDataProvider);
    class LocalUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getLocalSyncResourceHandles(syncResource, profile);
        }
        async getProfiles() {
            return this.userDataProfilesService.profiles
                .filter(p => !p.isDefault)
                .map(p => ({
                id: p.id,
                collection: p.id,
                name: p.name,
            }));
        }
    }
    let RemoteUserDataSyncActivityViewDataProvider = class RemoteUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        constructor(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncMachinesService, userDataSyncWorkbenchService, notificationService, userDataProfilesService) {
            super(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService);
            this.userDataSyncMachinesService = userDataSyncMachinesService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            return super.getChildren(element);
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getRemoteSyncResourceHandles(syncResource, profile);
        }
        getProfiles() {
            return this.userDataSyncResourceProviderService.getRemoteSyncedProfiles();
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            if (children.length) {
                const machineId = await this.userDataSyncResourceProviderService.getMachineId(element.syncResourceHandle);
                if (machineId) {
                    const machines = await this.getMachines();
                    const machine = machines.find(({ id }) => id === machineId);
                    children[0].description = machine?.isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current machine'] }, "Current") : machine?.name;
                }
            }
            return children;
        }
    };
    RemoteUserDataSyncActivityViewDataProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(2, userDataSync_1.IUserDataAutoSyncService),
        __param(3, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(5, notification_1.INotificationService),
        __param(6, userDataProfile_1.IUserDataProfilesService)
    ], RemoteUserDataSyncActivityViewDataProvider);
    let ExtractedUserDataSyncActivityViewDataProvider = class ExtractedUserDataSyncActivityViewDataProvider extends UserDataSyncActivityViewDataProvider {
        constructor(activityDataResource, userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService, fileService, uriIdentityService) {
            super(userDataSyncService, userDataSyncResourceProviderService, userDataAutoSyncService, userDataSyncWorkbenchService, notificationService, userDataProfilesService);
            this.activityDataResource = activityDataResource;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
                if (!this.activityDataResource) {
                    return [];
                }
                const stat = await this.fileService.resolve(this.activityDataResource);
                if (stat.isDirectory) {
                    this.activityDataLocation = this.activityDataResource;
                }
                else {
                    this.activityDataLocation = this.uriIdentityService.extUri.joinPath(this.uriIdentityService.extUri.dirname(this.activityDataResource), 'remoteActivity');
                    try {
                        await this.fileService.del(this.activityDataLocation, { recursive: true });
                    }
                    catch (e) { /* ignore */ }
                    await this.userDataSyncService.extractActivityData(this.activityDataResource, this.activityDataLocation);
                }
            }
            return super.getChildren(element);
        }
        getResourceHandles(syncResource, profile) {
            return this.userDataSyncResourceProviderService.getLocalSyncResourceHandles(syncResource, profile, this.activityDataLocation);
        }
        async getProfiles() {
            return this.userDataSyncResourceProviderService.getLocalSyncedProfiles(this.activityDataLocation);
        }
        async getChildrenForSyncResourceTreeItem(element) {
            const children = await super.getChildrenForSyncResourceTreeItem(element);
            if (children.length) {
                const machineId = await this.userDataSyncResourceProviderService.getMachineId(element.syncResourceHandle);
                if (machineId) {
                    const machines = await this.getMachines();
                    const machine = machines.find(({ id }) => id === machineId);
                    children[0].description = machine?.isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current machine'] }, "Current") : machine?.name;
                }
            }
            return children;
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncResourceProviderService.getLocalSyncedMachines(this.activityDataLocation);
            }
            return this.machinesPromise;
        }
    };
    ExtractedUserDataSyncActivityViewDataProvider = __decorate([
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(3, userDataSync_1.IUserDataAutoSyncService),
        __param(4, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(5, notification_1.INotificationService),
        __param(6, userDataProfile_1.IUserDataProfilesService),
        __param(7, files_1.IFileService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], ExtractedUserDataSyncActivityViewDataProvider);
    let UserDataSyncMachinesViewDataProvider = class UserDataSyncMachinesViewDataProvider {
        constructor(treeView, userDataSyncMachinesService, quickInputService, notificationService, dialogService, userDataSyncWorkbenchService) {
            this.treeView = treeView;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
        }
        async getChildren(element) {
            if (!element) {
                this.machinesPromise = undefined;
            }
            try {
                let machines = await this.getMachines();
                machines = machines.filter(m => !m.disabled).sort((m1, m2) => m1.isCurrent ? -1 : 1);
                this.treeView.message = machines.length ? undefined : (0, nls_1.localize)('no machines', "No Machines");
                return machines.map(({ id, name, isCurrent, platform }) => ({
                    handle: id,
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    label: { label: name },
                    description: isCurrent ? (0, nls_1.localize)({ key: 'current', comment: ['Current machine'] }, "Current") : undefined,
                    themeIcon: platform && (0, userDataSyncMachines_1.isWebPlatform)(platform) ? codicons_1.Codicon.globe : codicons_1.Codicon.vm,
                    contextValue: 'sync-machine'
                }));
            }
            catch (error) {
                this.notificationService.error(error);
                return [];
            }
        }
        getMachines() {
            if (this.machinesPromise === undefined) {
                this.machinesPromise = this.userDataSyncMachinesService.getMachines();
            }
            return this.machinesPromise;
        }
        async disable(machineIds) {
            const machines = await this.getMachines();
            const machinesToDisable = machines.filter(({ id }) => machineIds.includes(id));
            if (!machinesToDisable.length) {
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineIds.join(',')));
            }
            const result = await this.dialogService.confirm({
                type: 'info',
                message: machinesToDisable.length > 1 ? (0, nls_1.localize)('turn off sync on multiple machines', "Are you sure you want to turn off sync on selected machines?")
                    : (0, nls_1.localize)('turn off sync on machine', "Are you sure you want to turn off sync on {0}?", machinesToDisable[0].name),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
            });
            if (!result.confirmed) {
                return false;
            }
            if (machinesToDisable.some(machine => machine.isCurrent)) {
                await this.userDataSyncWorkbenchService.turnoff(false);
            }
            const otherMachinesToDisable = machinesToDisable.filter(machine => !machine.isCurrent)
                .map(machine => ([machine.id, false]));
            if (otherMachinesToDisable.length) {
                await this.userDataSyncMachinesService.setEnablements(otherMachinesToDisable);
            }
            return true;
        }
        async rename(machineId) {
            const disposableStore = new lifecycle_1.DisposableStore();
            const inputBox = disposableStore.add(this.quickInputService.createInputBox());
            inputBox.placeholder = (0, nls_1.localize)('placeholder', "Enter the name of the machine");
            inputBox.busy = true;
            inputBox.show();
            const machines = await this.getMachines();
            const machine = machines.find(({ id }) => id === machineId);
            if (!machine) {
                inputBox.hide();
                disposableStore.dispose();
                throw new Error((0, nls_1.localize)('not found', "machine not found with id: {0}", machineId));
            }
            inputBox.busy = false;
            inputBox.value = machine.name;
            const validateMachineName = (machineName) => {
                machineName = machineName.trim();
                return machineName && !machines.some(m => m.id !== machineId && m.name === machineName) ? machineName : null;
            };
            disposableStore.add(inputBox.onDidChangeValue(() => inputBox.validationMessage = validateMachineName(inputBox.value) ? '' : (0, nls_1.localize)('valid message', "Machine name should be unique and not empty")));
            return new Promise((c, e) => {
                disposableStore.add(inputBox.onDidAccept(async () => {
                    const machineName = validateMachineName(inputBox.value);
                    disposableStore.dispose();
                    if (machineName && machineName !== machine.name) {
                        try {
                            await this.userDataSyncMachinesService.renameMachine(machineId, machineName);
                            c(true);
                        }
                        catch (error) {
                            e(error);
                        }
                    }
                    else {
                        c(false);
                    }
                }));
            });
        }
    };
    UserDataSyncMachinesViewDataProvider = __decorate([
        __param(1, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, userDataSync_2.IUserDataSyncWorkbenchService)
    ], UserDataSyncMachinesViewDataProvider);
    let UserDataSyncTroubleshootViewDataProvider = class UserDataSyncTroubleshootViewDataProvider {
        constructor(fileService, userDataSyncWorkbenchService, environmentService, uriIdentityService) {
            this.fileService = fileService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
        }
        async getChildren(element) {
            if (!element) {
                return [{
                        handle: 'SYNC_LOGS',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('sync logs', "Logs") },
                        themeIcon: codicons_1.Codicon.folder,
                    }, {
                        handle: 'LAST_SYNC_STATES',
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: (0, nls_1.localize)('last sync states', "Last Synced Remotes") },
                        themeIcon: codicons_1.Codicon.folder,
                    }];
            }
            if (element.handle === 'LAST_SYNC_STATES') {
                return this.getLastSyncStates();
            }
            if (element.handle === 'SYNC_LOGS') {
                return this.getSyncLogs();
            }
            return [];
        }
        async getLastSyncStates() {
            const result = [];
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                const resource = (0, userDataSync_1.getLastSyncResourceUri)(undefined, syncResource, this.environmentService, this.uriIdentityService.extUri);
                if (await this.fileService.exists(resource)) {
                    result.push({
                        handle: resource.toString(),
                        label: { label: (0, userDataSync_2.getSyncAreaLabel)(syncResource) },
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        resourceUri: resource,
                        command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [resource, undefined, undefined] },
                    });
                }
            }
            return result;
        }
        async getSyncLogs() {
            const logResources = await this.userDataSyncWorkbenchService.getAllLogResources();
            const result = [];
            for (const syncLogResource of logResources) {
                const logFolder = this.uriIdentityService.extUri.dirname(syncLogResource);
                result.push({
                    handle: syncLogResource.toString(),
                    collapsibleState: views_1.TreeItemCollapsibleState.None,
                    resourceUri: syncLogResource,
                    label: { label: this.uriIdentityService.extUri.basename(logFolder) },
                    description: this.uriIdentityService.extUri.isEqual(logFolder, this.environmentService.logsHome) ? (0, nls_1.localize)({ key: 'current', comment: ['Represents current log file'] }, "Current") : undefined,
                    command: { id: editorCommands_1.API_OPEN_EDITOR_COMMAND_ID, title: '', arguments: [syncLogResource, undefined, undefined] },
                });
            }
            return result;
        }
    };
    UserDataSyncTroubleshootViewDataProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], UserDataSyncTroubleshootViewDataProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jVmlld3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3VzZXJEYXRhU3luYy9icm93c2VyL3VzZXJEYXRhU3luY1ZpZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlDekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtRQUVwRCxZQUNDLFNBQXdCLEVBQ2dCLG9CQUEyQyxFQUNsQyw2QkFBNkQsRUFDL0QsMkJBQXlELEVBQ2pFLG1CQUF5QztZQUVoRixLQUFLLEVBQUUsQ0FBQztZQUxnQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ2xDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDL0QsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE4QjtZQUNqRSx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBR2hGLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVPLGFBQWEsQ0FBQyxTQUF3QjtZQUM3QyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFdEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFckMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsd0JBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxTQUF3QjtZQUNyRCxN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