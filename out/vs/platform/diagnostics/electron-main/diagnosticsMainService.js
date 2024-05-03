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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/base/common/types", "vs/platform/log/common/log", "vs/platform/utilityProcess/electron-main/utilityProcess"], function (require, exports, electron_1, ipcMain_1, cancellation_1, instantiation_1, windows_1, workspace_1, workspacesManagementMainService_1, types_1, log_1, utilityProcess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticsMainService = exports.IDiagnosticsMainService = exports.ID = void 0;
    exports.ID = 'diagnosticsMainService';
    exports.IDiagnosticsMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let DiagnosticsMainService = class DiagnosticsMainService {
        constructor(windowsMainService, workspacesManagementMainService, logService) {
            this.windowsMainService = windowsMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.logService = logService;
        }
        async getRemoteDiagnostics(options) {
            const windows = this.windowsMainService.getWindows();
            const diagnostics = await Promise.all(windows.map(async (window) => {
                const remoteAuthority = window.remoteAuthority;
                if (!remoteAuthority) {
                    return undefined;
                }
                const replyChannel = `vscode:getDiagnosticInfoResponse${window.id}`;
                const args = {
                    includeProcesses: options.includeProcesses,
                    folders: options.includeWorkspaceMetadata ? await this.getFolderURIs(window) : undefined
                };
                return new Promise(resolve => {
                    window.sendWhenReady('vscode:getDiagnosticInfo', cancellation_1.CancellationToken.None, { replyChannel, args });
                    ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                        // No data is returned if getting the connection fails.
                        if (!data) {
                            resolve({ hostName: remoteAuthority, errorMessage: `Unable to resolve connection to '${remoteAuthority}'.` });
                        }
                        resolve(data);
                    });
                    setTimeout(() => {
                        resolve({ hostName: remoteAuthority, errorMessage: `Connection to '${remoteAuthority}' could not be established` });
                    }, 5000);
                });
            }));
            return diagnostics.filter((x) => !!x);
        }
        async getMainDiagnostics() {
            this.logService.trace('Received request for main process info from other instance.');
            const windows = [];
            for (const window of electron_1.BrowserWindow.getAllWindows()) {
                const codeWindow = this.windowsMainService.getWindowById(window.id);
                if (codeWindow) {
                    windows.push(await this.codeWindowToInfo(codeWindow));
                }
                else {
                    windows.push(this.browserWindowToInfo(window));
                }
            }
            const pidToNames = [];
            for (const { pid, name } of utilityProcess_1.UtilityProcess.getAll()) {
                pidToNames.push({ pid, name });
            }
            return {
                mainPID: process.pid,
                mainArguments: process.argv.slice(1),
                windows,
                pidToNames,
                screenReader: !!electron_1.app.accessibilitySupportEnabled,
                gpuFeatureStatus: electron_1.app.getGPUFeatureStatus()
            };
        }
        async codeWindowToInfo(window) {
            const folderURIs = await this.getFolderURIs(window);
            const win = (0, types_1.assertIsDefined)(window.win);
            return this.browserWindowToInfo(win, folderURIs, window.remoteAuthority);
        }
        browserWindowToInfo(window, folderURIs = [], remoteAuthority) {
            return {
                id: window.id,
                pid: window.webContents.getOSProcessId(),
                title: window.getTitle(),
                folderURIs,
                remoteAuthority
            };
        }
        async getFolderURIs(window) {
            const folderURIs = [];
            const workspace = window.openedWorkspace;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                folderURIs.push(workspace.uri);
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                const resolvedWorkspace = await this.workspacesManagementMainService.resolveLocalWorkspace(workspace.configPath); // workspace folders can only be shown for local (resolved) workspaces
                if (resolvedWorkspace) {
                    const rootFolders = resolvedWorkspace.folders;
                    rootFolders.forEach(root => {
                        folderURIs.push(root.uri);
                    });
                }
            }
            return folderURIs;
        }
    };
    exports.DiagnosticsMainService = DiagnosticsMainService;
    exports.DiagnosticsMainService = DiagnosticsMainService = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(2, log_1.ILogService)
    ], DiagnosticsMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhZ25vc3RpY3NNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZGlhZ25vc3RpY3MvZWxlY3Ryb24tbWFpbi9kaWFnbm9zdGljc01haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCbkYsUUFBQSxFQUFFLEdBQUcsd0JBQXdCLENBQUM7SUFDOUIsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLCtCQUFlLEVBQTBCLFVBQUUsQ0FBQyxDQUFDO0lBYTdFLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXNCO1FBSWxDLFlBQ3VDLGtCQUF1QyxFQUMxQiwrQkFBaUUsRUFDdEYsVUFBdUI7WUFGZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzFCLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDdEYsZUFBVSxHQUFWLFVBQVUsQ0FBYTtRQUNsRCxDQUFDO1FBRUwsS0FBSyxDQUFDLG9CQUFvQixDQUFDLE9BQWlDO1lBQzNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNyRCxNQUFNLFdBQVcsR0FBZ0UsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxFQUFFO2dCQUM3SCxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3RCLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO2dCQUVELE1BQU0sWUFBWSxHQUFHLG1DQUFtQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3BFLE1BQU0sSUFBSSxHQUEyQjtvQkFDcEMsZ0JBQWdCLEVB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