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
define(["require", "exports", "vs/workbench/common/views", "vs/nls", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/resources", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/base/common/codicons", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/common/editor"], function (require, exports, views_1, nls_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, userDataSync_2, resources_1, DOM, keybinding_1, contextView_1, configuration_1, opener_1, themeService_1, telemetry_1, notification_1, codicons_1, userDataProfile_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncConflictsViewPane = void 0;
    let UserDataSyncConflictsViewPane = class UserDataSyncConflictsViewPane extends treeView_1.TreeViewPane {
        constructor(options, editorService, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService, userDataSyncService, userDataSyncWorkbenchService, userDataSyncEnablementService, userDataProfilesService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, notificationService);
            this.editorService = editorService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataProfilesService = userDataProfilesService;
            this._register(this.userDataSyncService.onDidChangeConflicts(() => this.treeView.refresh()));
            this.registerActions();
        }
        renderTreeView(container) {
            super.renderTreeView(DOM.append(container, DOM.$('')));
            const that = this;
            this.treeView.message = (0, nls_1.localize)('explanation', "Please go through each entry and merge to resolve conflicts.");
            this.treeView.dataProvider = { getChildren() { return that.getTreeItems(); } };
        }
        async getTreeItems() {
            const roots = [];
            const conflictResources = this.userDataSyncService.conflicts
                .map(conflict => conflict.conflicts.map(resourcePreview => ({ ...resourcePreview, syncResource: conflict.syncResource, profile: conflict.profile })))
                .flat()
                .sort((a, b) => a.profile.id === b.profile.id ? 0 : a.profile.isDefault ? -1 : b.profile.isDefault ? 1 : a.profile.name.localeCompare(b.profile.name));
            const conflictResourcesByProfile = [];
            for (const previewResource of conflictResources) {
                let result = conflictResourcesByProfile[conflictResourcesByProfile.length - 1]?.[0].id === previewResource.profile.id ? conflictResourcesByProfile[conflictResourcesByProfile.length - 1][1] : undefined;
                if (!result) {
                    conflictResourcesByProfile.push([previewResource.profile, result = []]);
                }
                result.push(previewResource);
            }
            for (const [profile, resources] of conflictResourcesByProfile) {
                const children = [];
                for (const resource of resources) {
                    const handle = JSON.stringify(resource);
                    const treeItem = {
                        handle,
                        resourceUri: resource.remoteResource,
                        label: { label: (0, resources_1.basename)(resource.remoteResource), strikethrough: resource.mergeState === "accepted" /* MergeState.Accepted */ && (resource.localChange === 3 /* Change.Deleted */ || resource.remoteChange === 3 /* Change.Deleted */) },
                        description: (0, userDataSync_2.getSyncAreaLabel)(resource.syncResource),
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        command: { id: `workbench.actions.sync.openConflicts`, title: '', arguments: [{ $treeViewId: '', $treeItemHandle: handle }] },
                        contextValue: `sync-conflict-resource`
                    };
                    children.push(treeItem);
                }
                roots.push({
                    handle: profile.id,
                    label: { label: profile.name },
                    collapsibleState: views_1.TreeItemCollapsibleState.Expanded,
                    children
                });
            }
            return conflictResourcesByProfile.length === 1 && conflictResourcesByProfile[0][0].isDefault ? roots[0].children ?? [] : roots;
        }
        parseHandle(handle) {
            const parsed = JSON.parse(handle);
            return {
                syncResource: parsed.syncResource,
                profile: (0, userDataProfile_1.reviveProfile)(parsed.profile, this.userDataProfilesService.profilesHome.scheme),
                localResource: uri_1.URI.revive(parsed.localResource),
                remoteResource: uri_1.URI.revive(parsed.remoteResource),
                baseResource: uri_1.URI.revive(parsed.baseResource),
                previewResource: uri_1.URI.revive(parsed.previewResource),
                acceptedResource: uri_1.URI.revive(parsed.acceptedResource),
                localChange: parsed.localChange,
                remoteChange: parsed.remoteChange,
                mergeState: parsed.mergeState,
            };
        }
        registerActions() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class OpenConflictsAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.openConflicts`,
                        title: (0, nls_1.localize)({ key: 'workbench.actions.sync.openConflicts', comment: ['This is an action title to show the conflicts between local and remote version of resources'] }, "Show Conflicts"),
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    return that.open(conflict);
                }
            }));
            this._register((0, actions_1.registerAction2)(class AcceptRemoteAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptRemote`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptRemote', "Accept Remote"),
                        icon: codicons_1.Codicon.cloudDownload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_CONFLICTS_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-conflict-resource')),
                            group: 'inline',
                            order: 1,
                        },
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    await that.userDataSyncWorkbenchService.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, conflict.remoteResource, undefined, that.userDataSyncEnablementService.isEnabled());
                }
            }));
            this._register((0, actions_1.registerAction2)(class AcceptLocalAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.sync.acceptLocal`,
                        title: (0, nls_1.localize)('workbench.actions.sync.acceptLocal', "Accept Local"),
                        icon: codicons_1.Codicon.cloudUpload,
                        menu: {
                            id: actions_1.MenuId.ViewItemContext,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', userDataSync_2.SYNC_CONFLICTS_VIEW_ID), contextkey_1.ContextKeyExpr.equals('viewItem', 'sync-conflict-resource')),
                            group: 'inline',
                            order: 2,
                        },
                    });
                }
                async run(accessor, handle) {
                    const conflict = that.parseHandle(handle.$treeItemHandle);
                    await that.userDataSyncWorkbenchService.accept({ syncResource: conflict.syncResource, profile: conflict.profile }, conflict.localResource, undefined, that.userDataSyncEnablementService.isEnabled());
                }
            }));
        }
        async open(conflictToOpen) {
            if (!this.userDataSyncService.conflicts.some(({ conflicts }) => conflicts.some(({ localResource }) => (0, resources_1.isEqual)(localResource, conflictToOpen.localResource)))) {
                return;
            }
            const remoteResourceName = (0, nls_1.localize)({ key: 'remoteResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(conflictToOpen.remoteResource));
            const localResourceName = (0, nls_1.localize)('localResourceName', "{0} (Local)", (0, resources_1.basename)(conflictToOpen.remoteResource));
            await this.editorService.openEditor({
                input1: { resource: conflictToOpen.remoteResource, label: (0, nls_1.localize)('Theirs', 'Theirs'), description: remoteResourceName },
                input2: { resource: conflictToOpen.localResource, label: (0, nls_1.localize)('Yours', 'Yours'), description: localResourceName },
                base: { resource: conflictToOpen.baseResource },
                result: { resource: conflictToOpen.previewResource },
                options: {
                    preserveFocus: true,
                    revealIfVisible: true,
                    pinned: true,
                    override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                }
            });
            return;
        }
    };
    exports.UserDataSyncConflictsViewPane = UserDataSyncConflictsViewPane;
    exports.UserDataSyncConflictsViewPane = UserDataSyncConflictsViewPane = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, notification_1.INotificationService),
        __param(12, userDataSync_1.IUserDataSyncService),
        __param(13, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(14, userDataSync_1.IUserDataSyncEnablementService),
        __param(15, userDataProfile_1.IUserDataProfilesService)
    ], UserDataSyncConflictsViewPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jQ29uZmxpY3RzVmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdXNlckRhdGFTeW5jL2Jyb3dzZXIvdXNlckRhdGFTeW5jQ29uZmxpY3RzVmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE0QnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsdUJBQVk7UUFFOUQsWUFDQyxPQUE0QixFQUNLLGFBQTZCLEVBQzFDLGlCQUFxQyxFQUNwQyxrQkFBdUMsRUFDckMsb0JBQTJDLEVBQzlDLGlCQUFxQyxFQUNqQyxxQkFBNkMsRUFDOUMsb0JBQTJDLEVBQ2xELGFBQTZCLEVBQzlCLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUNoQyxtQkFBeUMsRUFDeEIsbUJBQXlDLEVBQ2hDLDRCQUEyRCxFQUMxRCw2QkFBNkQsRUFDbkUsdUJBQWlEO1lBRTVGLEtBQUssQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBaEIvSyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFXdkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUNoQyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQzFELGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDbkUsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUc1RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENB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