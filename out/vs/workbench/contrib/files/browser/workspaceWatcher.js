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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/map", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/path", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/host/browser/host"], function (require, exports, nls_1, lifecycle_1, uri_1, configuration_1, files_1, workspace_1, map_1, notification_1, opener_1, path_1, uriIdentity_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceWatcher = void 0;
    let WorkspaceWatcher = class WorkspaceWatcher extends lifecycle_1.Disposable {
        constructor(fileService, configurationService, contextService, notificationService, openerService, uriIdentityService, hostService) {
            super();
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.uriIdentityService = uriIdentityService;
            this.hostService = hostService;
            this.watchedWorkspaces = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.registerListeners();
            this.refresh();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onDidChangeWorkspaceFolders(e)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onDidChangeConfiguration(e)));
            this._register(this.fileService.onDidWatchError(error => this.onDidWatchError(error)));
        }
        onDidChangeWorkspaceFolders(e) {
            // Removed workspace: Unwatch
            for (const removed of e.removed) {
                this.unwatchWorkspace(removed);
            }
            // Added workspace: Watch
            for (const added of e.added) {
                this.watchWorkspace(added);
            }
        }
        onDidChangeWorkbenchState() {
            this.refresh();
        }
        onDidChangeConfiguration(e) {
            if (e.affectsConfiguration('files.watcherExclude') || e.affectsConfiguration('files.watcherInclude')) {
                this.refresh();
            }
        }
        onDidWatchError(error) {
            const msg = error.toString();
            // Detect if we run into ENOSPC issues
            if (msg.indexOf('ENOSPC') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('enospcError', "Unable to watch for file changes. Please follow the instructions link to resolve this issue."), [{
                        label: (0, nls_1.localize)('learnMore', "Instructions"),
                        run: () => this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=867693'))
                    }], {
                    sticky: true,
                    neverShowAgain: { id: 'ignoreEnospcError', isSecondary: true, scope: notification_1.NeverShowAgainScope.WORKSPACE }
                });
            }
            // Detect when the watcher throws an error unexpectedly
            else if (msg.indexOf('EUNKNOWN') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('eshutdownError', "File changes watcher stopped unexpectedly. A reload of the window may enable the watcher again unless the workspace cannot be watched for file changes."), [{
                        label: (0, nls_1.localize)('reload', "Reload"),
                        run: () => this.hostService.reload()
                    }], {
                    sticky: true,
                    priority: notification_1.NotificationPriority.SILENT // reduce potential spam since we don't really know how often this fires
                });
            }
        }
        watchWorkspace(workspace) {
            // Compute the watcher exclude rules from configuration
            const excludes = [];
            const config = this.configurationService.getValue({ resource: workspace.uri });
            if (config.files?.watcherExclude) {
                for (const key in config.files.watcherExclude) {
                    if (key && config.files.watcherExclude[key] === true) {
                        excludes.push(key);
                    }
                }
            }
            const pathsToWatch = new map_1.ResourceMap(uri => this.uriIdentityService.extUri.getComparisonKey(uri));
            // Add the workspace as path to watch
            pathsToWatch.set(workspace.uri, workspace.uri);
            // Compute additional includes from configuration
            if (config.files?.watcherInclude) {
                for (const includePath of config.files.watcherInclude) {
                    if (!includePath) {
                        continue;
                    }
                    // Absolute: verify a child of the workspace
                    if ((0, path_1.isAbsolute)(includePath)) {
                        const candidate = uri_1.URI.file(includePath).with({ scheme: workspace.uri.scheme });
                        if (this.uriIdentityService.extUri.isEqualOrParent(candidate, workspace.uri)) {
                            pathsToWatch.set(candidate, candidate);
                        }
                    }
                    // Relative: join against workspace folder
                    else {
                        const candidate = workspace.toResource(includePath);
                        pathsToWatch.set(candidate, candidate);
                    }
                }
            }
            // Watch all paths as instructed
            const disposables = new lifecycle_1.DisposableStore();
            for (const [, pathToWatch] of pathsToWatch) {
                disposables.add(this.fileService.watch(pathToWatch, { recursive: true, excludes }));
            }
            this.watchedWorkspaces.set(workspace.uri, disposables);
        }
        unwatchWorkspace(workspace) {
            if (this.watchedWorkspaces.has(workspace.uri)) {
                (0, lifecycle_1.dispose)(this.watchedWorkspaces.get(workspace.uri));
                this.watchedWorkspaces.delete(workspace.uri);
            }
        }
        refresh() {
            // Unwatch all first
            this.unwatchWorkspaces();
            // Watch each workspace folder
            for (const folder of this.contextService.getWorkspace().folders) {
                this.watchWorkspace(folder);
            }
        }
        unwatchWorkspaces() {
            for (const [, disposable] of this.watchedWorkspaces) {
                disposable.dispose();
            }
            this.watchedWorkspaces.clear();
        }
        dispose() {
            super.dispose();
            this.unwatchWorkspaces();
        }
    };
    exports.WorkspaceWatcher = WorkspaceWatcher;
    exports.WorkspaceWatcher = WorkspaceWatcher = __decorate([
        __param(0, files_1.IFileService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, opener_1.IOpenerService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, host_1.IHostService)
    ], WorkspaceWatcher);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlV2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZmlsZXMvYnJvd3Nlci93b3Jrc3BhY2VXYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFpQixTQUFRLHNCQUFVO1FBSS9DLFlBQ2UsV0FBMEMsRUFDakMsb0JBQTRELEVBQ3pELGNBQXlELEVBQzdELG1CQUEwRCxFQUNoRSxhQUE4QyxFQUN6QyxrQkFBd0QsRUFDL0QsV0FBMEM7WUFFeEQsS0FBSyxFQUFFLENBQUM7WUFSdUIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDaEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUN4QyxtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUMvQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDeEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQVR4QyxzQkFBaUIsR0FBRyxJQUFJLGlCQUFXLENBQWMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFheEksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFFekIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsQ0FBQztRQUVPLDJCQUEyQixDQUFDLENBQStCO1lBRWxFLDZCQUE2QjtZQUM3QixLQUFLLE1BQU0sT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCx5QkFBeUI7WUFDekIsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztRQUNGLENBQUM7UUFFTyx5QkFBeUI7WUFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxDQUE0QjtZQUM1RCxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztRQUVPLGVBQWUsQ0FBQyxLQUFZO1lBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUU3QixzQ0FBc0M7WUFDdEMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUM5Qix1QkFBUSxDQUFDLE9BQU8sRUFDaEIsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLDhGQUE4RixDQUFDLEVBQ3ZILENBQUM7d0JBQ0EsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFdBQVcsRUFBRSxjQUFjLENBQUM7d0JBQzVDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxTQUFHLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7cUJBQy9GLENBQUMsRUFDRjtvQkFDQyxNQUFNLEVBQUUsSUFBSTtvQkFDWixjQUFjLEVBQUUsRUFBRSxFQUFFLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsa0NBQW1CLENBQUMsU0FBUyxFQUFFO2lCQUNwRyxDQUNELENBQUM7WUFDSCxDQUFDO1lBRUQsdURBQXVEO2lCQUNsRCxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQzlCLHVCQUFRLENBQUMsT0FBTyxFQUNoQixJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSx5SkFBeUosQ0FBQyxFQUNyTCxDQUFDO3dCQUNBLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO3dCQUNuQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7cUJBQ3BDLENBQUMsRUFDRjtvQkFDQyxNQUFNLEVBQUUsSUFBSTtvQkFDWixRQUFRLEVBQUUsbUNBQW9CLENBQUMsTUFBTSxDQUFDLHdFQUF3RTtpQkFDOUcsQ0FDRCxDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7UUFFTyxjQUFjLENBQUMsU0FBMkI7WUFFakQsdURBQXVEO1lBQ3ZELE1BQU0sUUFBUSxHQUFhLEVBQUUsQ0FBQztZQUM5QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFzQixFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNwRyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUM7Z0JBQ2xDLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7d0JBQ3RELFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3BCLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLGlCQUFXLENBQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFdkcscUNBQXFDO1lBQ3JDLFlBQVksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFL0MsaURBQWlEO1lBQ2pELElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQztnQkFDbEMsS0FBSyxNQUFNLFdBQVcsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2RCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7d0JBQ2xCLFNBQVM7b0JBQ1YsQ0FBQztvQkFFRCw0Q0FBNEM7b0JBQzVDLElBQUksSUFBQSxpQkFBVSxFQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLE1BQU0sU0FBUyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzt3QkFDL0UsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7NEJBQzlFLFlBQVksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUN4QyxDQUFDO29CQUNGLENBQUM7b0JBRUQsMENBQTBDO3lCQUNyQyxDQUFDO3dCQUNMLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7d0JBQ3BELFlBQVksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO29CQUN4QyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsZ0NBQWdDO1lBQ2hDLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzFDLEtBQUssTUFBTSxDQUFDLEVBQUUsV0FBVyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQzVDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckYsQ0FBQztZQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsU0FBMkI7WUFDbkQsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUMvQyxJQUFBLG1CQUFPLEVBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUM7UUFFTyxPQUFPO1lBRWQsb0JBQW9CO1lBQ3BCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBRXpCLDhCQUE4QjtZQUM5QixLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsS0FBSyxNQUFNLENBQUMsRUFBRSxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDckQsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3RCLENBQUM7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVRLE9BQU87WUFDZixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNELENBQUE7SUFyS1ksNENBQWdCOytCQUFoQixnQkFBZ0I7UUFLMUIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLG1CQUFZLENBQUE7T0FYRixnQkFBZ0IsQ0FxSzVCIn0=