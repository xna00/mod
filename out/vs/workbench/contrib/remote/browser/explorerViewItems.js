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
define(["require", "exports", "vs/nls", "vs/workbench/services/remote/common/remoteExplorerService", "vs/base/common/types", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle"], function (require, exports, nls, remoteExplorerService_1, types_1, environmentService_1, storage_1, contextkey_1, actions_1, remoteExplorer_1, virtualWorkspace_1, workspace_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SwitchRemoteViewItem = exports.SELECTED_REMOTE_IN_EXPLORER = void 0;
    exports.SELECTED_REMOTE_IN_EXPLORER = new contextkey_1.RawContextKey('selectedRemoteInExplorer', '');
    let SwitchRemoteViewItem = class SwitchRemoteViewItem extends lifecycle_1.Disposable {
        constructor(contextKeyService, remoteExplorerService, environmentService, storageService, workspaceContextService) {
            super();
            this.contextKeyService = contextKeyService;
            this.remoteExplorerService = remoteExplorerService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.workspaceContextService = workspaceContextService;
            this.completedRemotes = this._register(new lifecycle_1.DisposableMap());
            this.selectedRemoteContext = exports.SELECTED_REMOTE_IN_EXPLORER.bindTo(contextKeyService);
            this.switchRemoteMenu = actions_1.MenuId.for('workbench.remote.menu.switchRemoteMenu');
            this._register(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
                submenu: this.switchRemoteMenu,
                title: nls.localize('switchRemote.label', "Switch Remote"),
                group: 'navigation',
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', remoteExplorer_1.VIEWLET_ID),
                order: 1,
                isSelection: true
            }));
            this._register(remoteExplorerService.onDidChangeTargetType(e => {
                this.select(e);
            }));
        }
        setSelectionForConnection() {
            let isSetForConnection = false;
            if (this.completedRemotes.size > 0) {
                let authority;
                const remoteAuthority = this.environmentService.remoteAuthority;
                let virtualWorkspace;
                if (!remoteAuthority) {
                    virtualWorkspace = (0, virtualWorkspace_1.getVirtualWorkspaceLocation)(this.workspaceContextService.getWorkspace())?.scheme;
                }
                isSetForConnection = true;
                const explorerType = remoteAuthority ? [remoteAuthority.split('+')[0]]
                    : (virtualWorkspace ? [virtualWorkspace]
                        : (this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 1 /* StorageScope.WORKSPACE */)?.split(',') ?? this.storageService.get(remoteExplorerService_1.REMOTE_EXPLORER_TYPE_KEY, 0 /* StorageScope.PROFILE */)?.split(',')));
                if (explorerType !== undefined) {
                    authority = this.getAuthorityForExplorerType(explorerType);
                }
                if (authority) {
                    this.select(authority);
                }
            }
            return isSetForConnection;
        }
        select(authority) {
            this.selectedRemoteContext.set(authority[0]);
            this.remoteExplorerService.targetType = authority;
        }
        getAuthorityForExplorerType(explorerType) {
            let authority;
            for (const option of this.completedRemotes) {
                for (const authorityOption of option[1].authority) {
                    for (const explorerOption of explorerType) {
                        if (authorityOption === explorerOption) {
                            authority = option[1].authority;
                            break;
                        }
                        else if (option[1].virtualWorkspace === explorerOption) {
                            authority = option[1].authority;
                            break;
                        }
                    }
                }
            }
            return authority;
        }
        removeOptionItems(views) {
            for (const view of views) {
                if (view.group && view.group.startsWith('targets') && view.remoteAuthority && (!view.when || this.contextKeyService.contextMatchesRules(view.when))) {
                    const authority = (0, types_1.isStringArray)(view.remoteAuthority) ? view.remoteAuthority : [view.remoteAuthority];
                    this.completedRemotes.deleteAndDispose(authority[0]);
                }
            }
        }
        createOptionItems(views) {
            const startingCount = this.completedRemotes.size;
            for (const view of views) {
                if (view.group && view.group.startsWith('targets') && view.remoteAuthority && (!view.when || this.contextKeyService.contextMatchesRules(view.when))) {
                    const text = view.name;
                    const authority = (0, types_1.isStringArray)(view.remoteAuthority) ? view.remoteAuthority : [view.remoteAuthority];
                    if (this.completedRemotes.has(authority[0])) {
                        continue;
                    }
                    const thisCapture = this;
                    const action = (0, actions_1.registerAction2)(class extends actions_1.Action2 {
                        constructor() {
                            super({
                                id: `workbench.action.remoteExplorer.show.${authority[0]}`,
                                title: text,
                                toggled: exports.SELECTED_REMOTE_IN_EXPLORER.isEqualTo(authority[0]),
                                menu: {
                                    id: thisCapture.switchRemoteMenu
                                }
                            });
                        }
                        async run() {
                            thisCapture.select(authority);
                        }
                    });
                    this.completedRemotes.set(authority[0], { text: text.value, authority, virtualWorkspace: view.virtualWorkspace, dispose: () => action.dispose() });
                }
            }
            if (this.completedRemotes.size > startingCount) {
                this.setSelectionForConnection();
            }
        }
    };
    exports.SwitchRemoteViewItem = SwitchRemoteViewItem;
    exports.SwitchRemoteViewItem = SwitchRemoteViewItem = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, storage_1.IStorageService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], SwitchRemoteViewItem);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbG9yZXJWaWV3SXRlbXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3JlbW90ZS9icm93c2VyL2V4cGxvcmVyVmlld0l0ZW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFJLDBCQUFhLENBQVMsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFOUYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQUtuRCxZQUNxQixpQkFBc0QsRUFDbEQscUJBQXFELEVBQy9DLGtCQUF3RCxFQUNyRSxjQUFnRCxFQUN2Qyx1QkFBa0U7WUFFNUYsS0FBSyxFQUFFLENBQUM7WUFONkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMxQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3ZDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBOEI7WUFDcEQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3RCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFSckYscUJBQWdCLEdBQTZDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx5QkFBYSxFQUFFLENBQUMsQ0FBQztZQVd4RyxJQUFJLENBQUMscUJBQXFCLEdBQUcsbUNBQTJCLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7WUFFbkYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFNLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7WUFDN0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBWSxDQUFDLGNBQWMsQ0FBQyxnQkFBTSxDQUFDLGtCQUFrQixFQUFFO2dCQUNyRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtn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