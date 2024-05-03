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
define(["require", "exports", "electron", "os", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/ps", "vs/base/parts/ipc/electron-main/ipcMain", "vs/nls", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/log/common/log", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/protocol/electron-main/protocol", "vs/platform/state/node/state", "vs/platform/utilityProcess/electron-main/utilityProcess", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows"], function (require, exports, electron_1, os_1, async_1, cancellation_1, extpath_1, lifecycle_1, network_1, platform_1, uri_1, ps_1, ipcMain_1, nls_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, environmentMainService_1, log_1, nativeHostMainService_1, product_1, productService_1, protocol_1, state_1, utilityProcess_1, window_1, windows_1) {
    "use strict";
    var IssueMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueMainService = void 0;
    const processExplorerWindowState = 'issue.processExplorerWindowState';
    let IssueMainService = class IssueMainService {
        static { IssueMainService_1 = this; }
        static { this.DEFAULT_BACKGROUND_COLOR = '#1E1E1E'; }
        constructor(userEnv, environmentMainService, logService, diagnosticsService, diagnosticsMainService, dialogMainService, nativeHostMainService, protocolMainService, productService, stateService, windowsMainService) {
            this.userEnv = userEnv;
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.diagnosticsService = diagnosticsService;
            this.diagnosticsMainService = diagnosticsMainService;
            this.dialogMainService = dialogMainService;
            this.nativeHostMainService = nativeHostMainService;
            this.protocolMainService = protocolMainService;
            this.productService = productService;
            this.stateService = stateService;
            this.windowsMainService = windowsMainService;
            this.issueReporterWindow = null;
            this.issueReporterParentWindow = null;
            this.processExplorerWindow = null;
            this.processExplorerParentWindow = null;
            this.registerListeners();
        }
        //#region Register Listeners
        registerListeners() {
            ipcMain_1.validatedIpcMain.on('vscode:listProcesses', async (event) => {
                const processes = [];
                try {
                    processes.push({ name: (0, nls_1.localize)('local', "Local"), rootProcess: await (0, ps_1.listProcesses)(process.pid) });
                    const remoteDiagnostics = await this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true });
                    remoteDiagnostics.forEach(data => {
                        if ((0, diagnostics_1.isRemoteDiagnosticError)(data)) {
                            processes.push({
                                name: data.hostName,
                                rootProcess: data
                            });
                        }
                        else {
                            if (data.processes) {
                                processes.push({
                                    name: data.hostName,
                                    rootProcess: data.processes
                                });
                            }
                        }
                    });
                }
                catch (e) {
                    this.logService.error(`Listing processes failed: ${e}`);
                }
                this.safeSend(event, 'vscode:listProcessesResponse', processes);
            });
            ipcMain_1.validatedIpcMain.on('vscode:workbenchCommand', (_, commandInfo) => {
                const { id, from, args } = commandInfo;
                let parentWindow;
                switch (from) {
                    case 'processExplorer':
                        parentWindow = this.processExplorerParentWindow;
                        break;
                    default:
                        // The issue reporter does not use this anymore.
                        throw new Error(`Unexpected command source: ${from}`);
                }
                parentWindow?.webContents.send('vscode:runAction', { id, from, args });
            });
            ipcMain_1.validatedIpcMain.on('vscode:closeProcessExplorer', event => {
                this.processExplorerWindow?.close();
            });
            ipcMain_1.validatedIpcMain.on('vscode:pidToNameRequest', async (event) => {
                const mainProcessInfo = await this.diagnosticsMainService.getMainDiagnostics();
                const pidToNames = [];
                for (const window of mainProcessInfo.windows) {
                    pidToNames.push([window.pid, `window [${window.id}] (${window.title})`]);
                }
                for (const { pid, name } of utilityProcess_1.UtilityProcess.getAll()) {
                    pidToNames.push([pid, name]);
                }
                this.safeSend(event, 'vscode:pidToNameResponse', pidToNames);
            });
        }
        //#endregion
        //#region Used by renderer
        async openReporter(data) {
            if (!this.issueReporterWindow) {
                this.issueReporterParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.issueReporterParentWindow) {
                    const issueReporterDisposables = new lifecycle_1.DisposableStore();
                    const issueReporterWindowConfigUrl = issueReporterDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const position = this.getWindowPosition(this.issueReporterParentWindow, 700, 800);
                    this.issueReporterWindow = this.createBrowserWindow(position, issueReporterWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('issueReporter', "Issue Reporter"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: false
                    }, 'issue-reporter');
                    // Store into config object URL
                    issueReporterWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.issueReporterWindow.id,
                        userEnv: this.userEnv,
                        data,
                        disableExtensions: !!this.environmentMainService.disableExtensions,
                        os: {
                            type: (0, os_1.type)(),
                            arch: (0, os_1.arch)(),
                            release: (0, os_1.release)(),
                        },
                        product: product_1.default
                    });
                    this.issueReporterWindow.loadURL(network_1.FileAccess.asBrowserUri(`vs/code/electron-sandbox/issue/issueReporter${this.environmentMainService.isBuilt ? '' : '-dev'}.html`).toString(true));
                    this.issueReporterWindow.on('close', () => {
                        this.issueReporterWindow = null;
                        issueReporterDisposables.dispose();
                    });
                    this.issueReporterParentWindow.on('closed', () => {
                        if (this.issueReporterWindow) {
                            this.issueReporterWindow.close();
                            this.issueReporterWindow = null;
                            issueReporterDisposables.dispose();
                        }
                    });
                }
            }
            else if (this.issueReporterWindow) {
                this.focusWindow(this.issueReporterWindow);
            }
        }
        async openProcessExplorer(data) {
            if (!this.processExplorerWindow) {
                this.processExplorerParentWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (this.processExplorerParentWindow) {
                    const processExplorerDisposables = new lifecycle_1.DisposableStore();
                    const processExplorerWindowConfigUrl = processExplorerDisposables.add(this.protocolMainService.createIPCObjectUrl());
                    const savedPosition = this.stateService.getItem(processExplorerWindowState, undefined);
                    const position = isStrictWindowState(savedPosition) ? savedPosition : this.getWindowPosition(this.processExplorerParentWindow, 800, 500);
                    this.processExplorerWindow = this.createBrowserWindow(position, processExplorerWindowConfigUrl, {
                        backgroundColor: data.styles.backgroundColor,
                        title: (0, nls_1.localize)('processExplorer', "Process Explorer"),
                        zoomLevel: data.zoomLevel,
                        alwaysOnTop: true
                    }, 'process-explorer');
                    // Store into config object URL
                    processExplorerWindowConfigUrl.update({
                        appRoot: this.environmentMainService.appRoot,
                        windowId: this.processExplorerWindow.id,
                        userEnv: this.userEnv,
                        data,
                        product: product_1.default
                    });
                    this.processExplorerWindow.loadURL(network_1.FileAccess.asBrowserUri(`vs/code/electron-sandbox/processExplorer/processExplorer${this.environmentMainService.isBuilt ? '' : '-dev'}.html`).toString(true));
                    this.processExplorerWindow.on('close', () => {
                        this.processExplorerWindow = null;
                        processExplorerDisposables.dispose();
                    });
                    this.processExplorerParentWindow.on('close', () => {
                        if (this.processExplorerWindow) {
                            this.processExplorerWindow.close();
                            this.processExplorerWindow = null;
                            processExplorerDisposables.dispose();
                        }
                    });
                    const storeState = () => {
                        if (!this.processExplorerWindow) {
                            return;
                        }
                        const size = this.processExplorerWindow.getSize();
                        const position = this.processExplorerWindow.getPosition();
                        if (!size || !position) {
                            return;
                        }
                        const state = {
                            width: size[0],
                            height: size[1],
                            x: position[0],
                            y: position[1]
                        };
                        this.stateService.setItem(processExplorerWindowState, state);
                    };
                    this.processExplorerWindow.on('moved', storeState);
                    this.processExplorerWindow.on('resized', storeState);
                }
            }
            if (this.processExplorerWindow) {
                this.focusWindow(this.processExplorerWindow);
            }
        }
        async stopTracing() {
            if (!this.environmentMainService.args.trace) {
                return; // requires tracing to be on
            }
            const path = await electron_1.contentTracing.stopRecording(`${(0, extpath_1.randomPath)(this.environmentMainService.userHome.fsPath, this.productService.applicationName)}.trace.txt`);
            // Inform user to report an issue
            await this.dialogMainService.showMessageBox({
                type: 'info',
                message: (0, nls_1.localize)('trace.message', "Successfully created the trace file"),
                detail: (0, nls_1.localize)('trace.detail', "Please create an issue and manually attach the following file:\n{0}", path),
                buttons: [(0, nls_1.localize)({ key: 'trace.ok', comment: ['&& denotes a mnemonic'] }, "&&OK")],
            }, electron_1.BrowserWindow.getFocusedWindow() ?? undefined);
            // Show item in explorer
            this.nativeHostMainService.showItemInFolder(undefined, path);
        }
        async getSystemStatus() {
            const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
            return this.diagnosticsService.getDiagnostics(info, remoteData);
        }
        //#endregion
        //#region used by issue reporter window
        async $getSystemInfo() {
            const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: false, includeWorkspaceMetadata: false })]);
            const msg = await this.diagnosticsService.getSystemInfo(info, remoteData);
            return msg;
        }
        async $getPerformanceInfo() {
            try {
                const [info, remoteData] = await Promise.all([this.diagnosticsMainService.getMainDiagnostics(), this.diagnosticsMainService.getRemoteDiagnostics({ includeProcesses: true, includeWorkspaceMetadata: true })]);
                return await this.diagnosticsService.getPerformanceInfo(info, remoteData);
            }
            catch (error) {
                this.logService.warn('issueService#getPerformanceInfo ', error.message);
                throw error;
            }
        }
        async $reloadWithExtensionsDisabled() {
            if (this.issueReporterParentWindow) {
                try {
                    await this.nativeHostMainService.reload(this.issueReporterParentWindow.id, { disableExtensions: true });
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
        async $showConfirmCloseDialog() {
            if (this.issueReporterWindow) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    message: (0, nls_1.localize)('confirmCloseIssueReporter', "Your input will not be saved. Are you sure you want to close this window?"),
                    buttons: [
                        (0, nls_1.localize)({ key: 'yes', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                        (0, nls_1.localize)('cancel', "Cancel")
                    ]
                }, this.issueReporterWindow);
                if (response === 0) {
                    if (this.issueReporterWindow) {
                        this.issueReporterWindow.destroy();
                        this.issueReporterWindow = null;
                    }
                }
            }
        }
        async $showClipboardDialog() {
            if (this.issueReporterWindow) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    message: (0, nls_1.localize)('issueReporterWriteToClipboard', "There is too much data to send to GitHub directly. The data will be copied to the clipboard, please paste it into the GitHub issue page that is opened."),
                    buttons: [
                        (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        (0, nls_1.localize)('cancel', "Cancel")
                    ]
                }, this.issueReporterWindow);
                return response === 0;
            }
            return false;
        }
        issueReporterWindowCheck() {
            if (!this.issueReporterParentWindow) {
                throw new Error('Issue reporter window not available');
            }
            const window = this.windowsMainService.getWindowById(this.issueReporterParentWindow.id);
            if (!window) {
                throw new Error('Window not found');
            }
            return window;
        }
        async $getIssueReporterUri(extensionId) {
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerIssueUriRequestHandlerResponse${window.id}`;
            return async_1.Promises.withAsyncBody(async (resolve, reject) => {
                const cts = new cancellation_1.CancellationTokenSource();
                window.sendWhenReady('vscode:triggerIssueUriRequestHandler', cts.token, { replyChannel, extensionId });
                ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                    resolve(uri_1.URI.parse(data));
                });
                try {
                    await (0, async_1.timeout)(5000);
                    cts.cancel();
                    reject(new Error('Timed out waiting for issue reporter URI'));
                }
                finally {
                    ipcMain_1.validatedIpcMain.removeHandler(replyChannel);
                }
            });
        }
        async $getIssueReporterData(extensionId) {
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerIssueDataProviderResponse${window.id}`;
            return async_1.Promises.withAsyncBody(async (resolve) => {
                const cts = new cancellation_1.CancellationTokenSource();
                window.sendWhenReady('vscode:triggerIssueDataProvider', cts.token, { replyChannel, extensionId });
                ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                    resolve(data);
                });
                try {
                    await (0, async_1.timeout)(5000);
                    cts.cancel();
                    resolve('Error: Extension timed out waiting for issue reporter data');
                }
                finally {
                    ipcMain_1.validatedIpcMain.removeHandler(replyChannel);
                }
            });
        }
        async $getIssueReporterTemplate(extensionId) {
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerIssueDataTemplateResponse${window.id}`;
            return async_1.Promises.withAsyncBody(async (resolve) => {
                const cts = new cancellation_1.CancellationTokenSource();
                window.sendWhenReady('vscode:triggerIssueDataTemplate', cts.token, { replyChannel, extensionId });
                ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                    resolve(data);
                });
                try {
                    await (0, async_1.timeout)(5000);
                    cts.cancel();
                    resolve('Error: Extension timed out waiting for issue reporter template');
                }
                finally {
                    ipcMain_1.validatedIpcMain.removeHandler(replyChannel);
                }
            });
        }
        async $getReporterStatus(extensionId, extensionName) {
            const defaultResult = [false, false];
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerReporterStatus`;
            const cts = new cancellation_1.CancellationTokenSource();
            window.sendWhenReady(replyChannel, cts.token, { replyChannel, extensionId, extensionName });
            const result = await (0, async_1.raceTimeout)(new Promise(resolve => ipcMain_1.validatedIpcMain.once('vscode:triggerReporterStatusResponse', (_, data) => resolve(data))), 2000, () => {
                this.logService.error('Error: Extension timed out waiting for reporter status');
                cts.cancel();
            });
            return (result ?? defaultResult);
        }
        async $sendReporterMenu(extensionId, extensionName) {
            const window = this.issueReporterWindowCheck();
            const replyChannel = `vscode:triggerReporterMenu`;
            const cts = new cancellation_1.CancellationTokenSource();
            window.sendWhenReady(replyChannel, cts.token, { replyChannel, extensionId, extensionName });
            const result = await (0, async_1.raceTimeout)(new Promise(resolve => ipcMain_1.validatedIpcMain.once(`vscode:triggerReporterMenuResponse:${extensionId}`, (_, data) => resolve(data))), 5000, () => {
                this.logService.error(`Error: Extension ${extensionId} timed out waiting for menu response`);
                cts.cancel();
            });
            return result;
        }
        async $closeReporter() {
            this.issueReporterWindow?.close();
        }
        async closeProcessExplorer() {
            this.processExplorerWindow?.close();
        }
        //#endregion
        focusWindow(window) {
            if (window.isMinimized()) {
                window.restore();
            }
            window.focus();
        }
        safeSend(event, channel, ...args) {
            if (!event.sender.isDestroyed()) {
                event.sender.send(channel, ...args);
            }
        }
        createBrowserWindow(position, ipcObjectUrl, options, windowKind) {
            const window = new electron_1.BrowserWindow({
                fullscreen: false,
                skipTaskbar: false,
                resizable: true,
                width: position.width,
                height: position.height,
                minWidth: 300,
                minHeight: 200,
                x: position.x,
                y: position.y,
                title: options.title,
                backgroundColor: options.backgroundColor || IssueMainService_1.DEFAULT_BACKGROUND_COLOR,
                webPreferences: {
                    preload: network_1.FileAccess.asFileUri('vs/base/parts/sandbox/electron-sandbox/preload.js').fsPath,
                    additionalArguments: [`--vscode-window-config=${ipcObjectUrl.resource.toString()}`],
                    v8CacheOptions: this.environmentMainService.useCodeCache ? 'bypassHeatCheck' : 'none',
                    enableWebSQL: false,
                    spellcheck: false,
                    zoomFactor: (0, window_1.zoomLevelToZoomFactor)(options.zoomLevel),
                    sandbox: true
                },
                alwaysOnTop: options.alwaysOnTop,
                experimentalDarkMode: true
            });
            window.setMenuBarVisibility(false);
            return window;
        }
        getWindowPosition(parentWindow, defaultWidth, defaultHeight) {
            // We want the new window to open on the same display that the parent is in
            let displayToUse;
            const displays = electron_1.screen.getAllDisplays();
            // Single Display
            if (displays.length === 1) {
                displayToUse = displays[0];
            }
            // Multi Display
            else {
                // on mac there is 1 menu per window so we need to use the monitor where the cursor currently is
                if (platform_1.isMacintosh) {
                    const cursorPoint = electron_1.screen.getCursorScreenPoint();
                    displayToUse = electron_1.screen.getDisplayNearestPoint(cursorPoint);
                }
                // if we have a last active window, use that display for the new window
                if (!displayToUse && parentWindow) {
                    displayToUse = electron_1.screen.getDisplayMatching(parentWindow.getBounds());
                }
                // fallback to primary display or first display
                if (!displayToUse) {
                    displayToUse = electron_1.screen.getPrimaryDisplay() || displays[0];
                }
            }
            const displayBounds = displayToUse.bounds;
            const state = {
                width: defaultWidth,
                height: defaultHeight,
                x: displayBounds.x + (displayBounds.width / 2) - (defaultWidth / 2),
                y: displayBounds.y + (displayBounds.height / 2) - (defaultHeight / 2)
            };
            if (displayBounds.width > 0 && displayBounds.height > 0 /* Linux X11 sessions sometimes report wrong display bounds */) {
                if (state.x < displayBounds.x) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the left
                }
                if (state.y < displayBounds.y) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the top
                }
                if (state.x > (displayBounds.x + displayBounds.width)) {
                    state.x = displayBounds.x; // prevent window from falling out of the screen to the right
                }
                if (state.y > (displayBounds.y + displayBounds.height)) {
                    state.y = displayBounds.y; // prevent window from falling out of the screen to the bottom
                }
                if (state.width > displayBounds.width) {
                    state.width = displayBounds.width; // prevent window from exceeding display bounds width
                }
                if (state.height > displayBounds.height) {
                    state.height = displayBounds.height; // prevent window from exceeding display bounds height
                }
            }
            return state;
        }
    };
    exports.IssueMainService = IssueMainService;
    exports.IssueMainService = IssueMainService = IssueMainService_1 = __decorate([
        __param(1, environmentMainService_1.IEnvironmentMainService),
        __param(2, log_1.ILogService),
        __param(3, diagnostics_1.IDiagnosticsService),
        __param(4, diagnosticsMainService_1.IDiagnosticsMainService),
        __param(5, dialogMainService_1.IDialogMainService),
        __param(6, nativeHostMainService_1.INativeHostMainService),
        __param(7, protocol_1.IProtocolMainService),
        __param(8, productService_1.IProductService),
        __param(9, state_1.IStateService),
        __param(10, windows_1.IWindowsMainService)
    ], IssueMainService);
    function isStrictWindowState(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }
        return ('x' in obj &&
            'y' in obj &&
            'width' in obj &&
            'height' in obj);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vaXNzdWUvZWxlY3Ryb24tbWFpbi9pc3N1ZU1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUE4QmhHLE1BQU0sMEJBQTBCLEdBQUcsa0NBQWtDLENBQUM7SUFXL0QsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7O2lCQUlKLDZCQUF3QixHQUFHLFNBQVMsQUFBWixDQUFhO1FBUTdELFlBQ1MsT0FBNEIsRUFDWCxzQkFBZ0UsRUFDNUUsVUFBd0MsRUFDaEMsa0JBQXdELEVBQ3BELHNCQUFnRSxFQUNyRSxpQkFBc0QsRUFDbEQscUJBQThELEVBQ2hFLG1CQUEwRCxFQUMvRCxjQUFnRCxFQUNsRCxZQUE0QyxFQUN0QyxrQkFBd0Q7WUFWckUsWUFBTyxHQUFQLE9BQU8sQ0FBcUI7WUFDTSwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQzNELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ25DLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDcEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNqQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQy9DLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDOUMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ3JCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFqQnRFLHdCQUFtQixHQUF5QixJQUFJLENBQUM7WUFDakQsOEJBQXlCLEdBQXlCLElBQUksQ0FBQztZQUV2RCwwQkFBcUIsR0FBeUIsSUFBSSxDQUFDO1lB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