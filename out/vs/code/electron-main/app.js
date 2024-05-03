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
define(["require", "exports", "electron", "vs/base/node/unc", "vs/base/parts/ipc/electron-main/ipcMain", "os", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/extpath", "vs/base/common/event", "vs/base/common/json", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/parts/contextmenu/electron-main/contextmenu", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/electron-main/ipc.electron", "vs/base/parts/ipc/electron-main/ipc.mp", "vs/code/electron-main/auth", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/backup/electron-main/backupMainService", "vs/platform/configuration/common/configuration", "vs/platform/debug/electron-main/extensionHostDebugIpc", "vs/platform/diagnostics/common/diagnostics", "vs/platform/diagnostics/electron-main/diagnosticsMainService", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/encryption/common/encryptionService", "vs/platform/encryption/electron-main/encryptionMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argvHelper", "vs/platform/shell/node/shellEnv", "vs/platform/extensions/common/extensionHostStarter", "vs/platform/extensions/electron-main/extensionHostStarter", "vs/platform/externalTerminal/electron-main/externalTerminal", "vs/platform/externalTerminal/node/externalTerminalService", "vs/platform/files/common/diskFileSystemProviderClient", "vs/platform/files/common/files", "vs/platform/files/electron-main/diskFileSystemProviderServer", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/issue/common/issue", "vs/platform/issue/electron-main/issueMainService", "vs/platform/keyboardLayout/electron-main/keyboardLayoutMainService", "vs/platform/launch/electron-main/launchMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/menubar/electron-main/menubarMainService", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteHosts", "vs/platform/sharedProcess/electron-main/sharedProcess", "vs/platform/sign/common/sign", "vs/platform/state/node/state", "vs/platform/storage/electron-main/storageIpc", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/update/common/update", "vs/platform/update/common/updateIpc", "vs/platform/update/electron-main/updateService.darwin", "vs/platform/update/electron-main/updateService.linux", "vs/platform/update/electron-main/updateService.snap", "vs/platform/update/electron-main/updateService.win32", "vs/platform/url/common/url", "vs/platform/url/common/urlIpc", "vs/platform/url/common/urlService", "vs/platform/url/electron-main/electronUrlListener", "vs/platform/webview/common/webviewManagerService", "vs/platform/webview/electron-main/webviewMainService", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows", "vs/platform/windows/electron-main/windowsMainService", "vs/platform/windows/node/windowTracker", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/platform/policy/common/policy", "vs/platform/policy/common/policyIpc", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/request/common/requestIpc", "vs/platform/request/common/request", "vs/platform/extensionManagement/common/extensionsProfileScannerService", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/extensionManagement/node/extensionsScannerService", "vs/platform/userDataProfile/electron-main/userDataProfilesHandler", "vs/platform/userDataProfile/electron-main/userDataProfileStorageIpc", "vs/base/common/async", "vs/platform/telemetry/electron-main/telemetryUtils", "vs/platform/extensionManagement/node/extensionsProfileScannerService", "vs/platform/log/electron-main/logIpc", "vs/platform/log/electron-main/loggerService", "vs/platform/utilityProcess/electron-main/utilityProcessWorkerMainService", "vs/platform/utilityProcess/common/utilityProcessWorkerService", "vs/base/common/arrays", "vs/platform/terminal/common/terminal", "vs/platform/terminal/electron-main/electronPtyHostStarter", "vs/platform/terminal/node/ptyHostService", "vs/platform/remote/common/electronRemoteResources", "vs/base/common/lazy", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindows", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindowsMainService", "vs/base/common/normalization"], function (require, exports, electron_1, unc_1, ipcMain_1, os_1, buffer_1, errorMessage_1, errors_1, extpath_1, event_1, json_1, labels_1, lifecycle_1, network_1, path_1, platform_1, types_1, uri_1, uuid_1, contextmenu_1, ipc_1, ipc_electron_1, ipc_mp_1, auth_1, nls_1, backup_1, backupMainService_1, configuration_1, extensionHostDebugIpc_1, diagnostics_1, diagnosticsMainService_1, dialogMainService_1, encryptionService_1, encryptionMainService_1, environmentMainService_1, argvHelper_1, shellEnv_1, extensionHostStarter_1, extensionHostStarter_2, externalTerminal_1, externalTerminalService_1, diskFileSystemProviderClient_1, files_1, diskFileSystemProviderServer_1, diskFileSystemProvider_1, descriptors_1, instantiation_1, serviceCollection_1, issue_1, issueMainService_1, keyboardLayoutMainService_1, launchMainService_1, lifecycleMainService_1, log_1, menubarMainService_1, nativeHostMainService_1, productService_1, remoteHosts_1, sharedProcess_1, sign_1, state_1, storageIpc_1, storageMainService_1, commonProperties_1, telemetry_1, telemetryIpc_1, telemetryService_1, telemetryUtils_1, update_1, updateIpc_1, updateService_darwin_1, updateService_linux_1, updateService_snap_1, updateService_win32_1, url_1, urlIpc_1, urlService_1, electronUrlListener_1, webviewManagerService_1, webviewMainService_1, window_1, windows_1, windowsMainService_1, windowTracker_1, workspace_1, workspaces_1, workspacesHistoryMainService_1, workspacesMainService_1, workspacesManagementMainService_1, policy_1, policyIpc_1, userDataProfile_1, requestIpc_1, request_1, extensionsProfileScannerService_1, extensionsScannerService_1, extensionsScannerService_2, userDataProfilesHandler_1, userDataProfileStorageIpc_1, async_1, telemetryUtils_2, extensionsProfileScannerService_2, logIpc_1, loggerService_1, utilityProcessWorkerMainService_1, utilityProcessWorkerService_1, arrays_1, terminal_1, electronPtyHostStarter_1, ptyHostService_1, electronRemoteResources_1, lazy_1, auxiliaryWindows_1, auxiliaryWindowsMainService_1, normalization_1) {
    "use strict";
    var CodeApplication_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeApplication = void 0;
    /**
     * The main VS Code application. There will only ever be one instance,
     * even if the user starts many instances (e.g. from the command line).
     */
    let CodeApplication = class CodeApplication extends lifecycle_1.Disposable {
        static { CodeApplication_1 = this; }
        static { this.SECURITY_PROTOCOL_HANDLING_CONFIRMATION_SETTING_KEY = {
            [network_1.Schemas.file]: 'security.promptForLocalFileProtocolHandling',
            [network_1.Schemas.vscodeRemote]: 'security.promptForRemoteFileProtocolHandling'
        }; }
        constructor(mainProcessNodeIpcServer, userEnv, mainInstantiationService, logService, loggerService, environmentMainService, lifecycleMainService, configurationService, stateService, fileService, productService, userDataProfilesMainService) {
            super();
            this.mainProcessNodeIpcServer = mainProcessNodeIpcServer;
            this.userEnv = userEnv;
            this.mainInstantiationService = mainInstantiationService;
            this.logService = logService;
            this.loggerService = loggerService;
            this.environmentMainService = environmentMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.stateService = stateService;
            this.fileService = fileService;
            this.productService = productService;
            this.userDataProfilesMainService = userDataProfilesMainService;
            this.configureSession();
            this.registerListeners();
        }
        configureSession() {
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            const isUrlFromWebview = (requestingUrl) => requestingUrl?.startsWith(`${network_1.Schemas.vscodeWebview}://`);
            const allowedPermissionsInWebview = new Set([
                'clipboard-read',
                'clipboard-sanitized-write',
            ]);
            electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return callback(allowedPermissionsInWebview.has(permission));
                }
                return callback(false);
            });
            electron_1.session.defaultSession.setPermissionCheckHandler((_webContents, permission, _origin, details) => {
                if (isUrlFromWebview(details.requestingUrl)) {
                    return allowedPermissionsInWebview.has(permission);
                }
                return false;
            });
            //#endregion
            //#region Request filtering
            // Block all SVG requests from unsupported origins
            const supportedSvgSchemes = new Set([network_1.Schemas.file, network_1.Schemas.vscodeFileResource, network_1.Schemas.vscodeRemoteResource, network_1.Schemas.vscodeManagedRemoteResource, 'devtools']);
            // But allow them if they are made from inside an webview
            const isSafeFrame = (requestFrame) => {
                for (let frame = requestFrame; frame; frame = frame.parent) {
                    if (frame.url.startsWith(`${network_1.Schemas.vscodeWebview}://`)) {
                        return true;
                    }
                }
                return false;
            };
            const isSvgRequestFromSafeContext = (details) => {
                return details.resourceType === 'xhr' || isSafeFrame(details.frame);
            };
            const isAllowedVsCodeFileRequest = (details) => {
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main windows (or shared process) and not from embedded content
                const windows = electron_1.BrowserWindow.getAllWindows();
                for (const window of windows) {
                    if (frame.processId === window.webContents.mainFrame.processId) {
                        return true;
                    }
                }
                return false;
            };
            const isAllowedWebviewRequest = (uri, details) => {
                if (uri.path !== '/index.html') {
                    return true; // Only restrict top level page of webviews: index.html
                }
                const frame = details.frame;
                if (!frame || !this.windowsMainService) {
                    return false;
                }
                // Check to see if the request comes from one of the main editor windows.
                for (const window of this.windowsMainService.getWindows()) {
                    if (window.win) {
                        if (frame.processId === window.win.webContents.mainFrame.processId) {
                            return true;
                        }
                    }
                }
                return false;
            };
            electron_1.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
                const uri = uri_1.URI.parse(details.url);
                if (uri.scheme === network_1.Schemas.vscodeWebview) {
                    if (!isAllowedWebviewRequest(uri, details)) {
                        this.logService.error('Blocked vscode-webview request', details.url);
                        return callback({ cancel: true });
                    }
                }
                if (uri.scheme === network_1.Schemas.vscodeFileResource) {
                    if (!isAllowedVsCodeFileRequest(details)) {
                        this.logService.error('Blocked vscode-file request', details.url);
                        return callback({ cancel: true });
                    }
                }
                // Block most svgs
                if (uri.path.endsWith('.svg')) {
                    const isSafeResourceUrl = supportedSvgSchemes.has(uri.scheme);
                    if (!isSafeResourceUrl) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            // Configure SVG header content type properly
            // https://github.com/microsoft/vscode/issues/97564
            electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                const responseHeaders = details.responseHeaders;
                const contentTypes = (responseHeaders['content-type'] || responseHeaders['Content-Type']);
                if (contentTypes && Array.isArray(contentTypes)) {
                    const uri = uri_1.URI.parse(details.url);
                    if (uri.path.endsWith('.svg')) {
                        if (supportedSvgSchemes.has(uri.scheme)) {
                            responseHeaders['Content-Type'] = ['image/svg+xml'];
                            return callback({ cancel: false, responseHeaders });
                        }
                    }
                    // remote extension schemes have the following format
                    // http://127.0.0.1:<port>/vscode-remote-resource?path=
                    if (!uri.path.endsWith(network_1.Schemas.vscodeRemoteResource) && contentTypes.some(contentType => contentType.toLowerCase().includes('image/svg'))) {
                        return callback({ cancel: !isSvgRequestFromSafeContext(details) });
                    }
                }
                return callback({ cancel: false });
            });
            //#endregion
            //#region Allow CORS for the PRSS CDN
            // https://github.com/microsoft/vscode-remote-release/issues/9246
            electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
                if (details.url.startsWith('https://vscode.download.prss.microsoft.com/')) {
                    const responseHeaders = details.responseHeaders ?? Object.create(null);
                    if (responseHeaders['Access-Control-Allow-Origin'] === undefined) {
                        responseHeaders['Access-Control-Allow-Origin'] = ['*'];
                        return callback({ cancel: false, responseHeaders });
                    }
                }
                return callback({ cancel: false });
            });
            const defaultSession = electron_1.session.defaultSession;
            if (typeof defaultSession.setCodeCachePath === 'function' && this.environmentMainService.codeCachePath) {
                // Make sure to partition Chrome's code cache folder
                // in the same way as our code cache path to help
                // invalidate caches that we know are invalid
                // (https://github.com/microsoft/vscode/issues/120655)
                defaultSession.setCodeCachePath((0, path_1.join)(this.environmentMainService.codeCachePath, 'chrome'));
            }
            //#endregion
            //#region UNC Host Allowlist (Windows)
            if (platform_1.isWindows) {
                if (this.configurationService.getValue('security.restrictUNCAccess') === false) {
                    (0, unc_1.disableUNCAccessRestrictions)();
                }
                else {
                    (0, unc_1.addUNCHostToAllowlist)(this.configurationService.getValue('security.allowedUNCHosts'));
                }
            }
            //#endregion
        }
        registerListeners() {
            // We handle uncaught exceptions here to prevent electron from opening a dialog to the user
            (0, errors_1.setUnexpectedErrorHandler)(error => this.onUnexpectedError(error));
            process.on('uncaughtException', error => {
                if (!(0, errors_1.isSigPipeError)(error)) {
                    (0, errors_1.onUnexpectedError)(error);
                }
            });
            process.on('unhandledRejection', (reason) => (0, errors_1.onUnexpectedError)(reason));
            // Dispose on shutdown
            this.lifecycleMainService.onWillShutdown(() => this.dispose());
            // Contextmenu via IPC support
            (0, contextmenu_1.registerContextMenuListener)();
            // Accessibility change event
            electron_1.app.on('accessibility-support-changed', (event, accessibilitySupportEnabled) => {
                this.windowsMainService?.sendToAll('vscode:accessibilitySupportChanged', accessibilitySupportEnabled);
            });
            // macOS dock activate
            electron_1.app.on('activate', async (event, hasVisibleWindows) => {
                this.logService.trace('app#activate');
                // Mac only event: open new window when we get activated
                if (!hasVisibleWindows) {
                    await this.windowsMainService?.openEmptyWindow({ context: 1 /* OpenContext.DOCK */ });
                }
            });
            //#region Security related measures (https://electronjs.org/docs/tutorial/security)
            //
            // !!! DO NOT CHANGE without consulting the documentation !!!
            //
            electron_1.app.on('web-contents-created', (event, contents) => {
                // Auxiliary Window: delegate to `AuxiliaryWindow` class
                if (contents?.opener?.url.startsWith(`${network_1.Schemas.vscodeFileResource}://${network_1.VSCODE_AUTHORITY}/`)) {
                    this.logService.trace('[aux window]  app.on("web-contents-created"): Registering auxiliary window');
                    this.auxiliaryWindowsMainService?.registerWindow(contents);
                }
                // Block any in-page navigation
                contents.on('will-navigate', event => {
                    this.logService.error('webContents#will-navigate: Prevented webcontent navigation');
                    event.preventDefault();
                });
                // All Windows: only allow about:blank auxiliary windows to open
                // For all other URLs, delegate to the OS.
                contents.setWindowOpenHandler(details => {
                    // about:blank windows can open as window witho our default options
                    if (details.url === 'about:blank') {
                        this.logService.trace('[aux window] webContents#setWindowOpenHandler: Allowing auxiliary window to open on about:blank');
                        return {
                            action: 'allow',
                            overrideBrowserWindowOptions: this.auxiliaryWindowsMainService?.createWindow(details)
                        };
                    }
                    // Any other URL: delegate to OS
                    else {
                        this.logService.trace(`webContents#setWindowOpenHandler: Prevented opening window with URL ${details.url}}`);
                        this.nativeHostMainService?.openExternal(undefined, details.url);
                        return { action: 'deny' };
                    }
                });
            });
            //#endregion
            let macOpenFileURIs = [];
            let runningTimeout = undefined;
            electron_1.app.on('open-file', (event, path) => {
                path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
                this.logService.trace('app#open-file: ', path);
                event.preventDefault();
                // Keep in array because more might come!
                macOpenFileURIs.push((0, workspace_1.hasWorkspaceFileExtension)(path) ? { workspaceUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) });
                // Clear previous handler if any
                if (runningTimeout !== undefined) {
                    clearTimeout(runningTimeout);
                    runningTimeout = undefined;
                }
                // Handle paths delayed in case more are coming!
                runningTimeout = setTimeout(async () => {
                    await this.windowsMainService?.open({
                        context: 1 /* OpenContext.DOCK */ /* can also be opening from finder while app is running */,
                        cli: this.environmentMainService.args,
                        urisToOpen: macOpenFileURIs,
                        gotoLineMode: false,
                        preferNewWindow: true /* dropping on the dock or opening from finder prefers to open in a new window */
                    });
                    macOpenFileURIs = [];
                    runningTimeout = undefined;
                }, 100);
            });
            electron_1.app.on('new-window-for-tab', async () => {
                await this.windowsMainService?.openEmptyWindow({ context: 4 /* OpenContext.DESKTOP */ }); //macOS native tab "+" button
            });
            //#region Bootstrap IPC Handlers
            ipcMain_1.validatedIpcMain.handle('vscode:fetchShellEnv', event => {
                // Prefer to use the args and env from the target window
                // when resolving the shell env. It is possible that
                // a first window was opened from the UI but a second
                // from the CLI and that has implications for whether to
                // resolve the shell environment or not.
                //
                // Window can be undefined for e.g. the shared process
                // that is not part of our windows registry!
                const window = this.windowsMainService?.getWindowByWebContents(event.sender); // Note: this can be `undefined` for the shared process
                let args;
                let env;
                if (window?.config) {
                    args = window.config;
                    env = { ...process.env, ...window.config.userEnv };
                }
                else {
                    args = this.environmentMainService.args;
                    env = process.env;
                }
                // Resolve shell env
                return this.resolveShellEnvironment(args, env, false);
            });
            ipcMain_1.validatedIpcMain.handle('vscode:writeNlsFile', (event, path, data) => {
                const uri = this.validateNlsPath([path]);
                if (!uri || typeof data !== 'string') {
                    throw new Error('Invalid operation (vscode:writeNlsFile)');
                }
                return this.fileService.writeFile(uri, buffer_1.VSBuffer.fromString(data));
            });
            ipcMain_1.validatedIpcMain.handle('vscode:readNlsFile', async (event, ...paths) => {
                const uri = this.validateNlsPath(paths);
                if (!uri) {
                    throw new Error('Invalid operation (vscode:readNlsFile)');
                }
                return (await this.fileService.readFile(uri)).value.toString();
            });
            ipcMain_1.validatedIpcMain.on('vscode:toggleDevTools', event => event.sender.toggleDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:openDevTools', event => event.sender.openDevTools());
            ipcMain_1.validatedIpcMain.on('vscode:reloadWindow', event => event.sender.reload());
            ipcMain_1.validatedIpcMain.handle('vscode:notifyZoomLevel', async (event, zoomLevel) => {
                const window = this.windowsMainService?.getWindowById(event.sender.id);
                if (window) {
                    window.notifyZoomLevel(zoomLevel);
                }
            });
            //#endregion
        }
        validateNlsPath(pathSegments) {
            let path = undefined;
            for (const pathSegment of pathSegments) {
                if (typeof pathSegment === 'string') {
                    if (typeof path !== 'string') {
                        path = pathSegment;
                    }
                    else {
                        path = (0, path_1.join)(path, pathSegment);
                    }
                }
            }
            if (typeof path !== 'string' || !(0, path_1.isAbsolute)(path) || !(0, extpath_1.isEqualOrParent)(path, this.environmentMainService.cachedLanguagesPath, !platform_1.isLinux)) {
                return undefined;
            }
            return uri_1.URI.file(path);
        }
        onUnexpectedError(error) {
            if (error) {
                // take only the message and stack property
                const friendlyError = {
                    message: `[uncaught exception in main]: ${error.message}`,
                    stack: error.stack
                };
                // handle on client side
                this.windowsMainService?.sendToFocused('vscode:reportError', JSON.stringify(friendlyError));
            }
            this.logService.error(`[uncaught exception in main]: ${error}`);
            if (error.stack) {
                this.logService.error(error.stack);
            }
        }
        async startup() {
            this.logService.debug('Starting VS Code');
            this.logService.debug(`from: ${this.environmentMainService.appRoot}`);
            this.logService.debug('args:', this.environmentMainService.args);
            // Make sure we associate the program with the app user model id
            // This will help Windows to associate the running program with
            // any shortcut that is pinned to the taskbar and prevent showing
            // two icons in the taskbar for the same app.
            const win32AppUserModelId = this.productService.win32AppUserModelId;
            if (platform_1.isWindows && win32AppUserModelId) {
                electron_1.app.setAppUserModelId(win32AppUserModelId);
            }
            // Fix native tabs on macOS 10.13
            // macOS enables a compatibility patch for any bundle ID beginning with
            // "com.microsoft.", which breaks native tabs for VS Code when using this
            // identifier (from the official build).
            // Explicitly opt out of the patch here before creating any windows.
            // See: https://github.com/microsoft/vscode/issues/35361#issuecomment-399794085
            try {
                if (platform_1.isMacintosh && this.configurationService.getValue('window.nativeTabs') === true && !electron_1.systemPreferences.getUserDefault('NSUseImprovedLayoutPass', 'boolean')) {
                    electron_1.systemPreferences.setUserDefault('NSUseImprovedLayoutPass', 'boolean', true);
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            // Main process server (electron IPC based)
            const mainProcessElectronServer = new ipc_electron_1.Server();
            this.lifecycleMainService.onWillShutdown(e => {
                if (e.reason === 2 /* ShutdownReason.KILL */) {
                    // When we go down abnormally, make sure to free up
                    // any IPC we accept from other windows to reduce
                    // the chance of doing work after we go down. Kill
                    // is special in that it does not orderly shutdown
                    // windows.
                    mainProcessElectronServer.dispose();
                }
            });
            // Resolve unique machine ID
            this.logService.trace('Resolving machine identifier...');
            const [machineId, sqmId] = await Promise.all([
                (0, telemetryUtils_2.resolveMachineId)(this.stateService, this.logService),
                (0, telemetryUtils_2.resolveSqmId)(this.stateService, this.logService)
            ]);
            this.logService.trace(`Resolved machine identifier: ${machineId}`);
            // Shared process
            const { sharedProcessReady, sharedProcessClient } = this.setupSharedProcess(machineId, sqmId);
            // Services
            const appInstantiationService = await this.initServices(machineId, sqmId, sharedProcessReady);
            // Auth Handler
            this._register(appInstantiationService.createInstance(auth_1.ProxyAuthHandler));
            // Transient profiles handler
            this._register(appInstantiationService.createInstance(userDataProfilesHandler_1.UserDataProfilesHandler));
            // Init Channels
            appInstantiationService.invokeFunction(accessor => this.initChannels(accessor, mainProcessElectronServer, sharedProcessClient));
            // Setup Protocol URL Handlers
            const initialProtocolUrls = await appInstantiationService.invokeFunction(accessor => this.setupProtocolUrlHandlers(accessor, mainProcessElectronServer));
            // Setup vscode-remote-resource protocol handler.
            this.setupManagedRemoteResourceUrlHandler(mainProcessElectronServer);
            // Signal phase: ready - before opening first window
            this.lifecycleMainService.phase = 2 /* LifecycleMainPhase.Ready */;
            // Open Windows
            await appInstantiationService.invokeFunction(accessor => this.openFirstWindow(accessor, initialProtocolUrls));
            // Signal phase: after window open
            this.lifecycleMainService.phase = 3 /* LifecycleMainPhase.AfterWindowOpen */;
            // Post Open Windows Tasks
            this.afterWindowOpen();
            // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
            const eventuallyPhaseScheduler = this._register(new async_1.RunOnceScheduler(() => {
                this._register((0, async_1.runWhenGlobalIdle)(() => this.lifecycleMainService.phase = 4 /* LifecycleMainPhase.Eventually */, 2500));
            }, 2500));
            eventuallyPhaseScheduler.schedule();
        }
        async setupProtocolUrlHandlers(accessor, mainProcessElectronServer) {
            const windowsMainService = this.windowsMainService = accessor.get(windows_1.IWindowsMainService);
            const urlService = accessor.get(url_1.IURLService);
            const nativeHostMainService = this.nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            const dialogMainService = accessor.get(dialogMainService_1.IDialogMainService);
            // Install URL handlers that deal with protocl URLs either
            // from this process by opening windows and/or by forwarding
            // the URLs into a window process to be handled there.
            const app = this;
            urlService.registerHandler({
                async handleURL(uri, options) {
                    return app.handleProtocolUrl(windowsMainService, dialogMainService, urlService, uri, options);
                }
            });
            const activeWindowManager = this._register(new windowTracker_1.ActiveWindowManager({
                onDidOpenMainWindow: nativeHostMainService.onDidOpenMainWindow,
                onDidFocusMainWindow: nativeHostMainService.onDidFocusMainWindow,
                getActiveWindowId: () => nativeHostMainService.getActiveWindowId(-1)
            }));
            const activeWindowRouter = new ipc_1.StaticRouter(ctx => activeWindowManager.getActiveClientId().then(id => ctx === id));
            const urlHandlerRouter = new urlIpc_1.URLHandlerRouter(activeWindowRouter, this.logService);
            const urlHandlerChannel = mainProcessElectronServer.getChannel('urlHandler', urlHandlerRouter);
            urlService.registerHandler(new urlIpc_1.URLHandlerChannelClient(urlHandlerChannel));
            const initialProtocolUrls = await this.resolveInitialProtocolUrls(windowsMainService, dialogMainService);
            this._register(new electronUrlListener_1.ElectronURLListener(initialProtocolUrls?.urls, urlService, windowsMainService, this.environmentMainService, this.productService, this.logService));
            return initialProtocolUrls;
        }
        setupManagedRemoteResourceUrlHandler(mainProcessElectronServer) {
            const notFound = () => ({ statusCode: 404, data: 'Not found' });
            const remoteResourceChannel = new lazy_1.Lazy(() => mainProcessElectronServer.getChannel(electronRemoteResources_1.NODE_REMOTE_RESOURCE_CHANNEL_NAME, new electronRemoteResources_1.NodeRemoteResourceRouter()));
            electron_1.protocol.registerBufferProtocol(network_1.Schemas.vscodeManagedRemoteResource, (request, callback) => {
                const url = uri_1.URI.parse(request.url);
                if (!url.authority.startsWith('window:')) {
                    return callback(notFound());
                }
                remoteResourceChannel.value.call(electronRemoteResources_1.NODE_REMOTE_RESOURCE_IPC_METHOD_NAME, [url]).then(r => callback({ ...r, data: Buffer.from(r.body, 'base64') }), err => {
                    this.logService.warn('error dispatching remote resource call', err);
                    callback({ statusCode: 500, data: String(err) });
                });
            });
        }
        async resolveInitialProtocolUrls(windowsMainService, dialogMainService) {
            /**
             * Protocol URL handling on startup is complex, refer to
             * {@link IInitialProtocolUrls} for an explainer.
             */
            // Windows/Linux: protocol handler invokes CLI with --open-url
            const protocolUrlsFromCommandLine = this.environmentMainService.args['open-url'] ? this.environmentMainService.args._urls || [] : [];
            if (protocolUrlsFromCommandLine.length > 0) {
                this.logService.trace('app#resolveInitialProtocolUrls() protocol urls from command line:', protocolUrlsFromCommandLine);
            }
            // macOS: open-url events that were received before the app is ready
            const protocolUrlsFromEvent = (global.getOpenUrls() || []);
            if (protocolUrlsFromEvent.length > 0) {
                this.logService.trace(`app#resolveInitialProtocolUrls() protocol urls from macOS 'open-url' event:`, protocolUrlsFromEvent);
            }
            if (protocolUrlsFromCommandLine.length + protocolUrlsFromEvent.length === 0) {
                return undefined;
            }
            const protocolUrls = [
                ...protocolUrlsFromCommandLine,
                ...protocolUrlsFromEvent
            ].map(url => {
                try {
                    return { uri: uri_1.URI.parse(url), originalUrl: url };
                }
                catch {
                    this.logService.trace('app#resolveInitialProtocolUrls() protocol url failed to parse:', url);
                    return undefined;
                }
            });
            const openables = [];
            const urls = [];
            for (const protocolUrl of protocolUrls) {
                if (!protocolUrl) {
                    continue; // invalid
                }
                const windowOpenable = this.getWindowOpenableFromProtocolUrl(protocolUrl.uri);
                if (windowOpenable) {
                    if (await this.shouldBlockOpenable(windowOpenable, windowsMainService, dialogMainService)) {
                        this.logService.trace('app#resolveInitialProtocolUrls() protocol url was blocked:', protocolUrl.uri.toString(true));
                        continue; // blocked
                    }
                    else {
                        this.logService.trace('app#resolveInitialProtocolUrls() protocol url will be handled as window to open:', protocolUrl.uri.toString(true), windowOpenable);
                        openables.push(windowOpenable); // handled as window to open
                    }
                }
                else {
                    this.logService.trace('app#resolveInitialProtocolUrls() protocol url will be passed to active window for handling:', protocolUrl.uri.toString(true));
                    urls.push(protocolUrl); // handled within active window
                }
            }
            return { urls, openables };
        }
        async shouldBlockOpenable(openable, windowsMainService, dialogMainService) {
            let openableUri;
            let message;
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                openableUri = openable.workspaceUri;
                message = (0, nls_1.localize)('confirmOpenMessageWorkspace', "An external application wants to open '{0}' in {1}. Do you want to open this workspace file?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            else if ((0, window_1.isFolderToOpen)(openable)) {
                openableUri = openable.folderUri;
                message = (0, nls_1.localize)('confirmOpenMessageFolder', "An external application wants to open '{0}' in {1}. Do you want to open this folder?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            else {
                openableUri = openable.fileUri;
                message = (0, nls_1.localize)('confirmOpenMessageFileOrFolder', "An external application wants to open '{0}' in {1}. Do you want to open this file or folder?", openableUri.scheme === network_1.Schemas.file ? (0, labels_1.getPathLabel)(openableUri, { os: platform_1.OS, tildify: this.environmentMainService }) : openableUri.toString(true), this.productService.nameShort);
            }
            if (openableUri.scheme !== network_1.Schemas.file && openableUri.scheme !== network_1.Schemas.vscodeRemote) {
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                //
                // NOTE: we currently only ask for confirmation for `file` and `vscode-remote`
                // authorities here. There is an additional confirmation for `extension.id`
                // authorities from within the window.
                //
                // IF YOU ARE PLANNING ON ADDING ANOTHER AUTHORITY HERE, MAKE SURE TO ALSO
                // ADD IT TO THE CONFIRMATION CODE BELOW OR INSIDE THE WINDOW!
                //
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                return false;
            }
            const askForConfirmation = this.configurationService.getValue(CodeApplication_1.SECURITY_PROTOCOL_HANDLING_CONFIRMATION_SETTING_KEY[openableUri.scheme]);
            if (askForConfirmation === false) {
                return false; // not blocked via settings
            }
            const { response, checkboxChecked } = await dialogMainService.showMessageBox({
                type: 'warning',
                buttons: [
                    (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Yes"),
                    (0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&No")
                ],
                message,
                detail: (0, nls_1.localize)('confirmOpenDetail', "If you did not initiate this request, it may represent an attempted attack on your system. Unless you took an explicit action to initiate this request, you should press 'No'"),
                checkboxLabel: openableUri.scheme === network_1.Schemas.file ? (0, nls_1.localize)('doNotAskAgainLocal', "Allow opening local paths without asking") : (0, nls_1.localize)('doNotAskAgainRemote', "Allow opening remote paths without asking"),
                cancelId: 1
            });
            if (response !== 0) {
                return true; // blocked by user choice
            }
            if (checkboxChecked) {
                // Due to https://github.com/microsoft/vscode/issues/195436, we can only
                // update settings from within a window. But we do not know if a window
                // is about to open or can already handle the request, so we have to send
                // to any current window and any newly opening window.
                const request = { channel: 'vscode:disablePromptForProtocolHandling', args: openableUri.scheme === network_1.Schemas.file ? 'local' : 'remote' };
                windowsMainService.sendToFocused(request.channel, request.args);
                windowsMainService.sendToOpeningWindow(request.channel, request.args);
            }
            return false; // not blocked by user choice
        }
        getWindowOpenableFromProtocolUrl(uri) {
            if (!uri.path) {
                return undefined;
            }
            // File path
            if (uri.authority === network_1.Schemas.file) {
                const fileUri = uri_1.URI.file(uri.fsPath);
                if ((0, workspace_1.hasWorkspaceFileExtension)(fileUri)) {
                    return { workspaceUri: fileUri };
                }
                return { fileUri };
            }
            // Remote path
            else if (uri.authority === network_1.Schemas.vscodeRemote) {
                // Example conversion:
                // From: vscode://vscode-remote/wsl+ubuntu/mnt/c/GitDevelopment/monaco
                //   To: vscode-remote://wsl+ubuntu/mnt/c/GitDevelopment/monaco
                const secondSlash = uri.path.indexOf(path_1.posix.sep, 1 /* skip over the leading slash */);
                if (secondSlash !== -1) {
                    const authority = uri.path.substring(1, secondSlash);
                    const path = uri.path.substring(secondSlash);
                    let query = uri.query;
                    const params = new URLSearchParams(uri.query);
                    if (params.get('windowId') === '_blank') {
                        // Make sure to unset any `windowId=_blank` here
                        // https://github.com/microsoft/vscode/issues/191902
                        params.delete('windowId');
                        query = params.toString();
                    }
                    const remoteUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeRemote, authority, path, query, fragment: uri.fragment });
                    if ((0, workspace_1.hasWorkspaceFileExtension)(path)) {
                        return { workspaceUri: remoteUri };
                    }
                    if (/:[\d]+$/.test(path)) {
                        // path with :line:column syntax
                        return { fileUri: remoteUri };
                    }
                    return { folderUri: remoteUri };
                }
            }
            return undefined;
        }
        async handleProtocolUrl(windowsMainService, dialogMainService, urlService, uri, options) {
            this.logService.trace('app#handleProtocolUrl():', uri.toString(true), options);
            // Support 'workspace' URLs (https://github.com/microsoft/vscode/issues/124263)
            if (uri.scheme === this.productService.urlProtocol && uri.path === 'workspace') {
                uri = uri.with({
                    authority: 'file',
                    path: uri_1.URI.parse(uri.query).path,
                    query: ''
                });
            }
            let shouldOpenInNewWindow = false;
            // We should handle the URI in a new window if the URL contains `windowId=_blank`
            const params = new URLSearchParams(uri.query);
            if (params.get('windowId') === '_blank') {
                this.logService.trace(`app#handleProtocolUrl() found 'windowId=_blank' as parameter, setting shouldOpenInNewWindow=true:`, uri.toString(true));
                params.delete('windowId');
                uri = uri.with({ query: params.toString() });
                shouldOpenInNewWindow = true;
            }
            // or if no window is open (macOS only)
            else if (platform_1.isMacintosh && windowsMainService.getWindowCount() === 0) {
                this.logService.trace(`app#handleProtocolUrl() running on macOS with no window open, setting shouldOpenInNewWindow=true:`, uri.toString(true));
                shouldOpenInNewWindow = true;
            }
            // Pass along whether the application is being opened via a Continue On flow
            const continueOn = params.get('continueOn');
            if (continueOn !== null) {
                this.logService.trace(`app#handleProtocolUrl() found 'continueOn' as parameter:`, uri.toString(true));
                params.delete('continueOn');
                uri = uri.with({ query: params.toString() });
                this.environmentMainService.continueOn = continueOn ?? undefined;
            }
            // Check if the protocol URL is a window openable to open...
            const windowOpenableFromProtocolUrl = this.getWindowOpenableFromProtocolUrl(uri);
            if (windowOpenableFromProtocolUrl) {
                if (await this.shouldBlockOpenable(windowOpenableFromProtocolUrl, windowsMainService, dialogMainService)) {
                    this.logService.trace('app#handleProtocolUrl() protocol url was blocked:', uri.toString(true));
                    return true; // If openable should be blocked, behave as if it's handled
                }
                else {
                    this.logService.trace('app#handleProtocolUrl() opening protocol url as window:', windowOpenableFromProtocolUrl, uri.toString(true));
                    const window = (0, arrays_1.firstOrDefault)(await windowsMainService.open({
                        context: 5 /* OpenContext.API */,
                        cli: { ...this.environmentMainService.args },
                        urisToOpen: [windowOpenableFromProtocolUrl],
                        forceNewWindow: shouldOpenInNewWindow,
                        gotoLineMode: true
                        // remoteAuthority: will be determined based on windowOpenableFromProtocolUrl
                    }));
                    window?.focus(); // this should help ensuring that the right window gets focus when multiple are opened
                    return true;
                }
            }
            // ...or if we should open in a new window and then handle it within that window
            if (shouldOpenInNewWindow) {
                this.logService.trace('app#handleProtocolUrl() opening empty window and passing in protocol url:', uri.toString(true));
                const window = (0, arrays_1.firstOrDefault)(await windowsMainService.open({
                    context: 5 /* OpenContext.API */,
                    cli: { ...this.environmentMainService.args },
                    forceNewWindow: true,
                    forceEmpty: true,
                    gotoLineMode: true,
                    remoteAuthority: (0, remoteHosts_1.getRemoteAuthority)(uri)
                }));
                await window?.ready();
                return urlService.open(uri, options);
            }
            this.logService.trace('app#handleProtocolUrl(): not handled', uri.toString(true), options);
            return false;
        }
        setupSharedProcess(machineId, sqmId) {
            const sharedProcess = this._register(this.mainInstantiationService.createInstance(sharedProcess_1.SharedProcess, machineId, sqmId));
            const sharedProcessClient = (async () => {
                this.logService.trace('Main->SharedProcess#connect');
                const port = await sharedProcess.connect();
                this.logService.trace('Main->SharedProcess#connect: connection established');
                return new ipc_mp_1.Client(port, 'main');
            })();
            const sharedProcessReady = (async () => {
                await sharedProcess.whenReady();
                return sharedProcessClient;
            })();
            return { sharedProcessReady, sharedProcessClient };
        }
        async initServices(machineId, sqmId, sharedProcessReady) {
            const services = new serviceCollection_1.ServiceCollection();
            // Update
            switch (process.platform) {
                case 'win32':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_win32_1.Win32UpdateService));
                    break;
                case 'linux':
                    if (platform_1.isLinuxSnap) {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_snap_1.SnapUpdateService, [process.env['SNAP'], process.env['SNAP_REVISION']]));
                    }
                    else {
                        services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_linux_1.LinuxUpdateService));
                    }
                    break;
                case 'darwin':
                    services.set(update_1.IUpdateService, new descriptors_1.SyncDescriptor(updateService_darwin_1.DarwinUpdateService));
                    break;
            }
            // Windows
            services.set(windows_1.IWindowsMainService, new descriptors_1.SyncDescriptor(windowsMainService_1.WindowsMainService, [machineId, sqmId, this.userEnv], false));
            services.set(auxiliaryWindows_1.IAuxiliaryWindowsMainService, new descriptors_1.SyncDescriptor(auxiliaryWindowsMainService_1.AuxiliaryWindowsMainService, undefined, false));
            // Dialogs
            const dialogMainService = new dialogMainService_1.DialogMainService(this.logService, this.productService);
            services.set(dialogMainService_1.IDialogMainService, dialogMainService);
            // Launch
            services.set(launchMainService_1.ILaunchMainService, new descriptors_1.SyncDescriptor(launchMainService_1.LaunchMainService, undefined, false /* proxied to other processes */));
            // Diagnostics
            services.set(diagnosticsMainService_1.IDiagnosticsMainService, new descriptors_1.SyncDescriptor(diagnosticsMainService_1.DiagnosticsMainService, undefined, false /* proxied to other processes */));
            services.set(diagnostics_1.IDiagnosticsService, ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('diagnostics')))));
            // Issues
            services.set(issue_1.IIssueMainService, new descriptors_1.SyncDescriptor(issueMainService_1.IssueMainService, [this.userEnv]));
            // Encryption
            services.set(encryptionService_1.IEncryptionMainService, new descriptors_1.SyncDescriptor(encryptionMainService_1.EncryptionMainService));
            // Keyboard Layout
            services.set(keyboardLayoutMainService_1.IKeyboardLayoutMainService, new descriptors_1.SyncDescriptor(keyboardLayoutMainService_1.KeyboardLayoutMainService));
            // Native Host
            services.set(nativeHostMainService_1.INativeHostMainService, new descriptors_1.SyncDescriptor(nativeHostMainService_1.NativeHostMainService, undefined, false /* proxied to other processes */));
            // Webview Manager
            services.set(webviewManagerService_1.IWebviewManagerService, new descriptors_1.SyncDescriptor(webviewMainService_1.WebviewMainService));
            // Menubar
            services.set(menubarMainService_1.IMenubarMainService, new descriptors_1.SyncDescriptor(menubarMainService_1.MenubarMainService));
            // Extension Host Starter
            services.set(extensionHostStarter_1.IExtensionHostStarter, new descriptors_1.SyncDescriptor(extensionHostStarter_2.ExtensionHostStarter));
            // Storage
            services.set(storageMainService_1.IStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.StorageMainService));
            services.set(storageMainService_1.IApplicationStorageMainService, new descriptors_1.SyncDescriptor(storageMainService_1.ApplicationStorageMainService));
            // Terminal
            const ptyHostStarter = new electronPtyHostStarter_1.ElectronPtyHostStarter({
                graceTime: 60000 /* LocalReconnectConstants.GraceTime */,
                shortGraceTime: 6000 /* LocalReconnectConstants.ShortGraceTime */,
                scrollback: this.configurationService.getValue("terminal.integrated.persistentSessionScrollback" /* TerminalSettingId.PersistentSessionScrollback */) ?? 100
            }, this.configurationService, this.environmentMainService, this.lifecycleMainService, this.logService);
            const ptyHostService = new ptyHostService_1.PtyHostService(ptyHostStarter, this.configurationService, this.logService, this.loggerService);
            services.set(terminal_1.ILocalPtyService, ptyHostService);
            // External terminal
            if (platform_1.isWindows) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.WindowsExternalTerminalService));
            }
            else if (platform_1.isMacintosh) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.MacExternalTerminalService));
            }
            else if (platform_1.isLinux) {
                services.set(externalTerminal_1.IExternalTerminalMainService, new descriptors_1.SyncDescriptor(externalTerminalService_1.LinuxExternalTerminalService));
            }
            // Backups
            const backupMainService = new backupMainService_1.BackupMainService(this.environmentMainService, this.configurationService, this.logService, this.stateService);
            services.set(backup_1.IBackupMainService, backupMainService);
            // Workspaces
            const workspacesManagementMainService = new workspacesManagementMainService_1.WorkspacesManagementMainService(this.environmentMainService, this.logService, this.userDataProfilesMainService, backupMainService, dialogMainService);
            services.set(workspacesManagementMainService_1.IWorkspacesManagementMainService, workspacesManagementMainService);
            services.set(workspaces_1.IWorkspacesService, new descriptors_1.SyncDescriptor(workspacesMainService_1.WorkspacesMainService, undefined, false /* proxied to other processes */));
            services.set(workspacesHistoryMainService_1.IWorkspacesHistoryMainService, new descriptors_1.SyncDescriptor(workspacesHistoryMainService_1.WorkspacesHistoryMainService, undefined, false));
            // URL handling
            services.set(url_1.IURLService, new descriptors_1.SyncDescriptor(urlService_1.NativeURLService, undefined, false /* proxied to other processes */));
            // Telemetry
            if ((0, telemetryUtils_1.supportsTelemetry)(this.productService, this.environmentMainService)) {
                const isInternal = (0, telemetryUtils_1.isInternalTelemetry)(this.productService, this.configurationService);
                const channel = (0, ipc_1.getDelayedChannel)(sharedProcessReady.then(client => client.getChannel('telemetryAppender')));
                const appender = new telemetryIpc_1.TelemetryAppenderClient(channel);
                const commonProperties = (0, commonProperties_1.resolveCommonProperties)((0, os_1.release)(), (0, os_1.hostname)(), process.arch, this.productService.commit, this.productService.version, machineId, sqmId, isInternal);
                const piiPaths = (0, telemetryUtils_1.getPiiPathsFromEnvironment)(this.environmentMainService);
                const config = { appenders: [appender], commonProperties, piiPaths, sendErrorTelemetry: true };
                services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config], false));
            }
            else {
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            // Default Extensions Profile Init
            services.set(extensionsProfileScannerService_1.IExtensionsProfileScannerService, new descriptors_1.SyncDescriptor(extensionsProfileScannerService_2.ExtensionsProfileScannerService, undefined, true));
            services.set(extensionsScannerService_1.IExtensionsScannerService, new descriptors_1.SyncDescriptor(extensionsScannerService_2.ExtensionsScannerService, undefined, true));
            // Utility Process Worker
            services.set(utilityProcessWorkerMainService_1.IUtilityProcessWorkerMainService, new descriptors_1.SyncDescriptor(utilityProcessWorkerMainService_1.UtilityProcessWorkerMainService, undefined, true));
            // Init services that require it
            await async_1.Promises.settled([
                backupMainService.initialize(),
                workspacesManagementMainService.initialize()
            ]);
            return this.mainInstantiationService.createChild(services);
        }
        initChannels(accessor, mainProcessElectronServer, sharedProcessClient) {
            // Channels registered to node.js are exposed to second instances
            // launching because that is the only way the second instance
            // can talk to the first instance. Electron IPC does not work
            // across apps until `requestSingleInstance` APIs are adopted.
            const disposables = this._register(new lifecycle_1.DisposableStore());
            const launchChannel = ipc_1.ProxyChannel.fromService(accessor.get(launchMainService_1.ILaunchMainService), disposables, { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('launch', launchChannel);
            const diagnosticsChannel = ipc_1.ProxyChannel.fromService(accessor.get(diagnosticsMainService_1.IDiagnosticsMainService), disposables, { disableMarshalling: true });
            this.mainProcessNodeIpcServer.registerChannel('diagnostics', diagnosticsChannel);
            // Policies (main & shared process)
            const policyChannel = new policyIpc_1.PolicyChannel(accessor.get(policy_1.IPolicyService));
            mainProcessElectronServer.registerChannel('policy', policyChannel);
            sharedProcessClient.then(client => client.registerChannel('policy', policyChannel));
            // Local Files
            const diskFileSystemProvider = this.fileService.getProvider(network_1.Schemas.file);
            (0, types_1.assertType)(diskFileSystemProvider instanceof diskFileSystemProvider_1.DiskFileSystemProvider);
            const fileSystemProviderChannel = new diskFileSystemProviderServer_1.DiskFileSystemProviderChannel(diskFileSystemProvider, this.logService, this.environmentMainService);
            mainProcessElectronServer.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel);
            sharedProcessClient.then(client => client.registerChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME, fileSystemProviderChannel));
            // User Data Profiles
            const userDataProfilesService = ipc_1.ProxyChannel.fromService(accessor.get(userDataProfile_1.IUserDataProfilesMainService), disposables);
            mainProcessElectronServer.registerChannel('userDataProfiles', userDataProfilesService);
            sharedProcessClient.then(client => client.registerChannel('userDataProfiles', userDataProfilesService));
            // Request
            const requestService = new requestIpc_1.RequestChannel(accessor.get(request_1.IRequestService));
            sharedProcessClient.then(client => client.registerChannel('request', requestService));
            // Update
            const updateChannel = new updateIpc_1.UpdateChannel(accessor.get(update_1.IUpdateService));
            mainProcessElectronServer.registerChannel('update', updateChannel);
            // Issues
            const issueChannel = ipc_1.ProxyChannel.fromService(accessor.get(issue_1.IIssueMainService), disposables);
            mainProcessElectronServer.registerChannel('issue', issueChannel);
            // Encryption
            const encryptionChannel = ipc_1.ProxyChannel.fromService(accessor.get(encryptionService_1.IEncryptionMainService), disposables);
            mainProcessElectronServer.registerChannel('encryption', encryptionChannel);
            // Signing
            const signChannel = ipc_1.ProxyChannel.fromService(accessor.get(sign_1.ISignService), disposables);
            mainProcessElectronServer.registerChannel('sign', signChannel);
            // Keyboard Layout
            const keyboardLayoutChannel = ipc_1.ProxyChannel.fromService(accessor.get(keyboardLayoutMainService_1.IKeyboardLayoutMainService), disposables);
            mainProcessElectronServer.registerChannel('keyboardLayout', keyboardLayoutChannel);
            // Native host (main & shared process)
            this.nativeHostMainService = accessor.get(nativeHostMainService_1.INativeHostMainService);
            const nativeHostChannel = ipc_1.ProxyChannel.fromService(this.nativeHostMainService, disposables);
            mainProcessElectronServer.registerChannel('nativeHost', nativeHostChannel);
            sharedProcessClient.then(client => client.registerChannel('nativeHost', nativeHostChannel));
            // Workspaces
            const workspacesChannel = ipc_1.ProxyChannel.fromService(accessor.get(workspaces_1.IWorkspacesService), disposables);
            mainProcessElectronServer.registerChannel('workspaces', workspacesChannel);
            // Menubar
            const menubarChannel = ipc_1.ProxyChannel.fromService(accessor.get(menubarMainService_1.IMenubarMainService), disposables);
            mainProcessElectronServer.registerChannel('menubar', menubarChannel);
            // URL handling
            const urlChannel = ipc_1.ProxyChannel.fromService(accessor.get(url_1.IURLService), disposables);
            mainProcessElectronServer.registerChannel('url', urlChannel);
            // Webview Manager
            const webviewChannel = ipc_1.ProxyChannel.fromService(accessor.get(webviewManagerService_1.IWebviewManagerService), disposables);
            mainProcessElectronServer.registerChannel('webview', webviewChannel);
            // Storage (main & shared process)
            const storageChannel = this._register(new storageIpc_1.StorageDatabaseChannel(this.logService, accessor.get(storageMainService_1.IStorageMainService)));
            mainProcessElectronServer.registerChannel('storage', storageChannel);
            sharedProcessClient.then(client => client.registerChannel('storage', storageChannel));
            // Profile Storage Changes Listener (shared process)
            const profileStorageListener = this._register(new userDataProfileStorageIpc_1.ProfileStorageChangesListenerChannel(accessor.get(storageMainService_1.IStorageMainService), accessor.get(userDataProfile_1.IUserDataProfilesMainService), this.logService));
            sharedProcessClient.then(client => client.registerChannel('profileStorageListener', profileStorageListener));
            // Terminal
            const ptyHostChannel = ipc_1.ProxyChannel.fromService(accessor.get(terminal_1.ILocalPtyService), disposables);
            mainProcessElectronServer.registerChannel(terminal_1.TerminalIpcChannels.LocalPty, ptyHostChannel);
            // External Terminal
            const externalTerminalChannel = ipc_1.ProxyChannel.fromService(accessor.get(externalTerminal_1.IExternalTerminalMainService), disposables);
            mainProcessElectronServer.registerChannel('externalTerminal', externalTerminalChannel);
            // Logger
            const loggerChannel = new logIpc_1.LoggerChannel(accessor.get(loggerService_1.ILoggerMainService));
            mainProcessElectronServer.registerChannel('logger', loggerChannel);
            sharedProcessClient.then(client => client.registerChannel('logger', loggerChannel));
            // Extension Host Debug Broadcasting
            const electronExtensionHostDebugBroadcastChannel = new extensionHostDebugIpc_1.ElectronExtensionHostDebugBroadcastChannel(accessor.get(windows_1.IWindowsMainService));
            mainProcessElectronServer.registerChannel('extensionhostdebugservice', electronExtensionHostDebugBroadcastChannel);
            // Extension Host Starter
            const extensionHostStarterChannel = ipc_1.ProxyChannel.fromService(accessor.get(extensionHostStarter_1.IExtensionHostStarter), disposables);
            mainProcessElectronServer.registerChannel(extensionHostStarter_1.ipcExtensionHostStarterChannelName, extensionHostStarterChannel);
            // Utility Process Worker
            const utilityProcessWorkerChannel = ipc_1.ProxyChannel.fromService(accessor.get(utilityProcessWorkerMainService_1.IUtilityProcessWorkerMainService), disposables);
            mainProcessElectronServer.registerChannel(utilityProcessWorkerService_1.ipcUtilityProcessWorkerChannelName, utilityProcessWorkerChannel);
        }
        async openFirstWindow(accessor, initialProtocolUrls) {
            const windowsMainService = this.windowsMainService = accessor.get(windows_1.IWindowsMainService);
            this.auxiliaryWindowsMainService = accessor.get(auxiliaryWindows_1.IAuxiliaryWindowsMainService);
            const context = (0, argvHelper_1.isLaunchedFromCli)(process.env) ? 0 /* OpenContext.CLI */ : 4 /* OpenContext.DESKTOP */;
            const args = this.environmentMainService.args;
            // First check for windows from protocol links to open
            if (initialProtocolUrls) {
                // Openables can open as windows directly
                if (initialProtocolUrls.openables.length > 0) {
                    return windowsMainService.open({
                        context,
                        cli: args,
                        urisToOpen: initialProtocolUrls.openables,
                        gotoLineMode: true,
                        initialStartup: true
                        // remoteAuthority: will be determined based on openables
                    });
                }
                // Protocol links with `windowId=_blank` on startup
                // should be handled in a special way:
                // We take the first one of these and open an empty
                // window for it. This ensures we are not restoring
                // all windows of the previous session.
                // If there are any more URLs like these, they will
                // be handled from the URL listeners installed later.
                if (initialProtocolUrls.urls.length > 0) {
                    for (const protocolUrl of initialProtocolUrls.urls) {
                        const params = new URLSearchParams(protocolUrl.uri.query);
                        if (params.get('windowId') === '_blank') {
                            // It is important here that we remove `windowId=_blank` from
                            // this URL because here we open an empty window for it.
                            params.delete('windowId');
                            protocolUrl.originalUrl = protocolUrl.uri.toString(true);
                            protocolUrl.uri = protocolUrl.uri.with({ query: params.toString() });
                            return windowsMainService.open({
                                context,
                                cli: args,
                                forceNewWindow: true,
                                forceEmpty: true,
                                gotoLineMode: true,
                                initialStartup: true
                                // remoteAuthority: will be determined based on openables
                            });
                        }
                    }
                }
            }
            const macOpenFiles = global.macOpenFiles;
            const hasCliArgs = args._.length;
            const hasFolderURIs = !!args['folder-uri'];
            const hasFileURIs = !!args['file-uri'];
            const noRecentEntry = args['skip-add-to-recently-opened'] === true;
            const waitMarkerFileURI = args.wait && args.waitMarkerFilePath ? uri_1.URI.file(args.waitMarkerFilePath) : undefined;
            const remoteAuthority = args.remote || undefined;
            const forceProfile = args.profile;
            const forceTempProfile = args['profile-temp'];
            // Started without file/folder arguments
            if (!hasCliArgs && !hasFolderURIs && !hasFileURIs) {
                // Force new window
                if (args['new-window'] || forceProfile || forceTempProfile) {
                    return windowsMainService.open({
                        context,
                        cli: args,
                        forceNewWindow: true,
                        forceEmpty: true,
                        noRecentEntry,
                        waitMarkerFileURI,
                        initialStartup: true,
                        remoteAuthority,
                        forceProfile,
                        forceTempProfile
                    });
                }
                // mac: open-file event received on startup
                if (macOpenFiles.length) {
                    return windowsMainService.open({
                        context: 1 /* OpenContext.DOCK */,
                        cli: args,
                        urisToOpen: macOpenFiles.map(path => {
                            path = (0, normalization_1.normalizeNFC)(path); // macOS only: normalize paths to NFC form
                            return ((0, workspace_1.hasWorkspaceFileExtension)(path) ? { workspaceUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) });
                        }),
                        noRecentEntry,
                        waitMarkerFileURI,
                        initialStartup: true,
                        // remoteAuthority: will be determined based on macOpenFiles
                    });
                }
            }
            // default: read paths from cli
            return windowsMainService.open({
                context,
                cli: args,
                forceNewWindow: args['new-window'] || (!hasCliArgs && args['unity-launch']),
                diffMode: args.diff,
                mergeMode: args.merge,
                noRecentEntry,
                waitMarkerFileURI,
                gotoLineMode: args.goto,
                initialStartup: true,
                remoteAuthority,
                forceProfile,
                forceTempProfile
            });
        }
        afterWindowOpen() {
            // Windows: mutex
            this.installMutex();
            // Remote Authorities
            electron_1.protocol.registerHttpProtocol(network_1.Schemas.vscodeRemoteResource, (request, callback) => {
                callback({
                    url: request.url.replace(/^vscode-remote-resource:/, 'http:'),
                    method: request.method
                });
            });
            // Start to fetch shell environment (if needed) after window has opened
            // Since this operation can take a long time, we want to warm it up while
            // the window is opening.
            // We also show an error to the user in case this fails.
            this.resolveShellEnvironment(this.environmentMainService.args, process.env, true);
            // Crash reporter
            this.updateCrashReporterEnablement();
            if (platform_1.isMacintosh && electron_1.app.runningUnderARM64Translation) {
                this.windowsMainService?.sendToFocused('vscode:showTranslatedBuildWarning');
            }
        }
        async installMutex() {
            const win32MutexName = this.productService.win32MutexName;
            if (platform_1.isWindows && win32MutexName) {
                try {
                    const WindowsMutex = await new Promise((resolve_1, reject_1) => { require(['@vscode/windows-mutex'], resolve_1, reject_1); });
                    const mutex = new WindowsMutex.Mutex(win32MutexName);
                    event_1.Event.once(this.lifecycleMainService.onWillShutdown)(() => mutex.release());
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
        }
        async resolveShellEnvironment(args, env, notifyOnError) {
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this.configurationService, this.logService, args, env);
            }
            catch (error) {
                const errorMessage = (0, errorMessage_1.toErrorMessage)(error);
                if (notifyOnError) {
                    this.windowsMainService?.sendToFocused('vscode:showResolveShellEnvError', errorMessage);
                }
                else {
                    this.logService.error(errorMessage);
                }
            }
            return {};
        }
        async updateCrashReporterEnablement() {
            // If enable-crash-reporter argv is undefined then this is a fresh start,
            // based on `telemetry.enableCrashreporter` settings, generate a UUID which
            // will be used as crash reporter id and also update the json file.
            try {
                const argvContent = await this.fileService.readFile(this.environmentMainService.argvResource);
                const argvString = argvContent.value.toString();
                const argvJSON = JSON.parse((0, json_1.stripComments)(argvString));
                const telemetryLevel = (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService);
                const enableCrashReporter = telemetryLevel >= 1 /* TelemetryLevel.CRASH */;
                // Initial startup
                if (argvJSON['enable-crash-reporter'] === undefined) {
                    const additionalArgvContent = [
                        '',
                        '	// Allows to disable crash reporting.',
                        '	// Should restart the app if the value is changed.',
                        `	"enable-crash-reporter": ${enableCrashReporter},`,
                        '',
                        '	// Unique id used for correlating crash reports sent from this instance.',
                        '	// Do not edit this value.',
                        `	"crash-reporter-id": "${(0, uuid_1.generateUuid)()}"`,
                        '}'
                    ];
                    const newArgvString = argvString.substring(0, argvString.length - 2).concat(',\n', additionalArgvContent.join('\n'));
                    await this.fileService.writeFile(this.environmentMainService.argvResource, buffer_1.VSBuffer.fromString(newArgvString));
                }
                // Subsequent startup: update crash reporter value if changed
                else {
                    const newArgvString = argvString.replace(/"enable-crash-reporter": .*,/, `"enable-crash-reporter": ${enableCrashReporter},`);
                    if (newArgvString !== argvString) {
                        await this.fileService.writeFile(this.environmentMainService.argvResource, buffer_1.VSBuffer.fromString(newArgvString));
                    }
                }
            }
            catch (error) {
                this.logService.error(error);
            }
        }
    };
    exports.CodeApplication = CodeApplication;
    exports.CodeApplication = CodeApplication = CodeApplication_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, log_1.ILogService),
        __param(4, log_1.ILoggerService),
        __param(5, environmentMainService_1.IEnvironmentMainService),
        __param(6, lifecycleMainService_1.ILifecycleMainService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, state_1.IStateService),
        __param(9, files_1.IFileService),
        __param(10, productService_1.IProductService),
        __param(11, userDataProfile_1.IUserDataProfilesMainService)
    ], CodeApplication);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9jb2RlL2VsZWN0cm9uLW1haW4vYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF5SGhHOzs7T0FHRztJQUNJLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsc0JBQVU7O2lCQUV0Qix3REFBbUQsR0FBRztZQUM3RSxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsNkNBQXNEO1lBQ3RFLENBQUMsaUJBQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSw4Q0FBdUQ7U0FDL0UsQUFIMEUsQ0FHekU7UUFNRixZQUNrQix3QkFBdUMsRUFDdkMsT0FBNEIsRUFDTCx3QkFBK0MsRUFDekQsVUFBdUIsRUFDcEIsYUFBNkIsRUFDcEIsc0JBQStDLEVBQ2pELG9CQUEyQyxFQUMzQyxvQkFBMkMsRUFDbkQsWUFBMkIsRUFDNUIsV0FBeUIsRUFDdEIsY0FBK0IsRUFDbEIsMkJBQXlEO1lBRXhHLEtBQUssRUFBRSxDQUFDO1lBYlMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUFlO1lBQ3ZDLFlBQU8sR0FBUCxPQUFPLENBQXFCO1lBQ0wsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUF1QjtZQUN6RCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNwQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ2pELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNuRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUM1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEIsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE4QjtZQUl4RyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8sZ0JBQWdCO1lBRXZCLG1GQUFtRjtZQUNuRixFQUFFO1lBQ0YsNkRBQTZEO1lBQzdELEVBQUU7WUFFRixNQUFNLGdCQUFnQixHQUFHLENBQUMsYUFBaUMsRUFBRSxFQUFFLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxHQUFHLGlCQUFPLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQztZQUV6SCxNQUFNLDJCQUEyQixHQUFHLElBQUksR0FBRyxDQUFDO2dCQUMzQyxnQkFBZ0I7Z0JBQ2hCLDJCQUEyQjthQUMzQixDQUFDLENBQUM7WUFFSCxrQkFBTyxDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUNsRyxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO29CQUM3QyxPQUFPLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsQ0FBQztnQkFFRCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUVILGtCQUFPLENBQUMsY0FBYyxDQUFDLHlCQUF5QixDQUFDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0JBQy9GLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQzdDLE9BQU8sMkJBQTJCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO2dCQUVELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7WUFFSCxZQUFZO1lBRVosMkJBQTJCO1lBRTNCLGtEQUFrRDtZQUNsRCxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsaUJBQU8sQ0FBQyxrQkFBa0IsRUFBRSxpQkFBTyxDQUFDLG9CQUFvQixFQUFFLGlCQUFPLENBQUMsMkJBQTJCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUUvSix5REFBeUQ7WUFDekQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxZQUFzQyxFQUFXLEVBQUU7Z0JBQ3ZFLEtBQUssSUFBSSxLQUFLLEdBQW9DLFlBQVksRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDN0YsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFPLENBQUMsYUFBYSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN6RCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDLENBQUM7WUFFRixNQUFNLDJCQUEyQixHQUFHLENBQUMsT0FBNEYsRUFBVyxFQUFFO2dCQUM3SSxPQUFPLE9BQU8sQ0FBQyxZQUFZLEtBQUssS0FBSyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckUsQ0FBQyxDQUFDO1lBRUYsTUFBTSwwQkFBMEIsR0FBRyxDQUFDLE9BQWdELEVBQUUsRUFBRTtnQkFDdkYsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztnQkFDNUIsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUN4QyxPQUFPLEtBQUssQ0FBQztnQkFDZCxDQUFDO2dCQUVELG1IQUFtSDtnQkFDbkgsTUFBTSxPQUFPLEdBQUcsd0JBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDOUMsS0FBSyxNQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztvQkFDOUIsSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNoRSxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDLENBQUM7WUFFRixNQUFNLHVCQUF1QixHQUFHLENBQUMsR0FBUSxFQUFFLE9BQWdELEVBQVcsRUFBRTtnQkFDdkcsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLGFBQWEsRUFBRSxDQUFDO29CQUNoQyxPQUFPLElBQUksQ0FBQyxDQUFDLHVEQUF1RDtnQkFDckUsQ0FBQztnQkFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM1QixJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7b0JBQ3hDLE9BQU8sS0FBSyxDQUFDO2dCQUNkLENBQUM7Z0JBRUQseUVBQXlFO2dCQUN6RSxLQUFLLE1BQU0sTUFBTSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO29CQUMzRCxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQzt3QkFDaEIsSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs0QkFDcEUsT0FBTyxJQUFJLENBQUM7d0JBQ2IsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBRUQsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDLENBQUM7WUFFRixrQkFBTyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUN2RSxNQUFNLEdBQUcsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNyRSxPQUFPLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO29CQUNuQyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFDL0MsSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7d0JBQzFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDbEUsT0FBTyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDbkMsQ0FBQztnQkFDRixDQUFDO2dCQUVELGtCQUFrQjtnQkFDbEIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUMvQixNQUFNLGlCQUFpQixHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzlELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUN4QixPQUFPLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLDJCQUEyQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDcEUsQ0FBQztnQkFDRixDQUFDO2dCQUVELE9BQU8sUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDLENBQUM7WUFFSCw2Q0FBNkM7WUFDN0MsbURBQW1EO1lBQ25ELGtCQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDekUsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGVBQXdELENBQUM7Z0JBQ3pGLE1BQU0sWUFBWSxHQUFHLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO2dCQUUxRixJQUFJLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7b0JBQ2pELE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNuQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQy9CLElBQUksbUJBQW1CLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDOzRCQUN6QyxlQUFlLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQzs0QkFFcEQsT0FBTyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7d0JBQ3JELENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxxREFBcUQ7b0JBQ3JELHVEQUF1RDtvQkFDdkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFPLENBQUMsb0JBQW9CLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQzNJLE9BQU8sUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsMkJBQTJCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsT0FBTyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNwQyxDQUFDLENBQUMsQ0FBQztZQUVILFlBQVk7WUFFWixxQ0FBcUM7WUFFckMsaUVBQWlFO1lBQ2pFLGtCQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDekUsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyw2Q0FBNkMsQ0FBQyxFQUFFLENBQUM7b0JBQzNFLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxlQUFlLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFdkUsSUFBSSxlQUFlLENBQUMsNkJBQTZCLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDbEUsZUFBZSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDdkQsT0FBTyxRQUFRLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7b0JBQ3JELENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxPQUFPLFFBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBY0gsTUFBTSxjQUFjLEdBQUcsa0JBQU8sQ0FBQyxjQUE0RCxDQUFDO1lBQzVGLElBQUksT0FBTyxjQUFjLENBQUMsZ0JBQWdCLEtBQUssVUFBVSxJQUFJLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDeEcsb0RBQW9EO2dCQUNwRCxpREFBaUQ7Z0JBQ2pELDZDQUE2QztnQkFDN0Msc0RBQXNEO2dCQUN0RCxjQUFjLENBQUMsZ0JBQWdCLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFFRCxZQUFZO1lBRVosc0NBQXNDO1lBRXRDLElBQUksb0JBQVMsRUFBRSxDQUFDO2dCQUNmLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLEtBQUssRUFBRSxDQUFDO29CQUNoRixJQUFBLGtDQUE0QixHQUFFLENBQUM7Z0JBQ2hDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFBLDJCQUFxQixFQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixDQUFDO1lBQ0YsQ0FBQztZQUVELFlBQVk7UUFDYixDQUFDO1FBRU8saUJBQWlCO1lBRXhCLDJGQUEyRjtZQUMzRixJQUFBLGtDQUF5QixFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDbEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLElBQUEsdUJBQWMsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUM1QixJQUFBLDBCQUFpQixFQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMxQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsTUFBZSxFQUFFLEVBQUUsQ0FBQyxJQUFBLDBCQUFpQixFQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFFakYsc0JBQXNCO1lBQ3RCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFFL0QsOEJBQThCO1lBQzlCLElBQUEseUNBQTJCLEdBQUUsQ0FBQztZQUU5Qiw2QkFBNkI7WUFDN0IsY0FBRyxDQUFDLEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxFQUFFO2dCQUM5RSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsU0FBUyxDQUFDLG9DQUFvQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFDdkcsQ0FBQyxDQUFDLENBQUM7WUFFSCxzQkFBc0I7WUFDdEIsY0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxFQUFFO2dCQUNyRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFFdEMsd0RBQXdEO2dCQUN4RCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxDQUFDLEVBQUUsT0FBTywwQkFBa0IsRUFBRSxDQUFDLENBQUM7Z0JBQy9FLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILG1GQUFtRjtZQUNuRixFQUFFO1lBQ0YsNkRBQTZEO1lBQzdELEVBQUU7WUFDRixjQUFHLENBQUMsRUFBRSxDQUFDLHNCQUFzQixFQUFFLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUVsRCx3REFBd0Q7Z0JBQ3hELElBQUksUUFBUSxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsaUJBQU8sQ0FBQyxrQkFBa0IsTUFBTSwwQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDOUYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNEVBQTRFLENBQUMsQ0FBQztvQkFFcEcsSUFBSSxDQUFDLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztnQkFFRCwrQkFBK0I7Z0JBQy9CLFFBQVEsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxFQUFFO29CQUNwQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw0REFBNEQsQ0FBQyxDQUFDO29CQUVwRixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3hCLENBQUMsQ0FBQyxDQUFDO2dCQUVILGdFQUFnRTtnQkFDaEUsMENBQTBDO2dCQUMxQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEVBQUU7b0JBRXZDLG1FQUFtRTtvQkFDbkUsSUFBSSxPQUFPLENBQUMsR0FBRyxLQUFLLGFBQWEsRUFBRSxDQUFDO3dCQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpR0FBaUcsQ0FBQyxDQUFDO3dCQUV6SCxPQUFPOzRCQUNOLE1BQU0sRUFBRSxPQUFPOzRCQUNmLDRCQUE0QixFQUFFLElBQUksQ0FBQywyQkFBMkIsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDO3lCQUNyRixDQUFDO29CQUNILENBQUM7b0JBRUQsZ0NBQWdDO3lCQUMzQixDQUFDO3dCQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHVFQUF1RSxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQzt3QkFFN0csSUFBSSxDQUFDLHFCQUFxQixFQUFFLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUVqRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUMzQixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxZQUFZO1lBRVosSUFBSSxlQUFlLEdBQXNCLEVBQUUsQ0FBQztZQUM1QyxJQUFJLGNBQWMsR0FBK0IsU0FBUyxDQUFDO1lBQzNELGNBQUcsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUNuQyxJQUFJLEdBQUcsSUFBQSw0QkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMENBQTBDO2dCQUVyRSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0MsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUV2Qix5Q0FBeUM7Z0JBQ3pDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBQSxxQ0FBeUIsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFdkgsZ0NBQWdDO2dCQUNoQyxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQztvQkFDbEMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUM3QixjQUFjLEdBQUcsU0FBUyxDQUFDO2dCQUM1QixDQUFDO2dCQUVELGdEQUFnRDtnQkFDaEQsY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtvQkFDdEMsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDO3dCQUNuQyxPQUFPLDBCQUFrQixDQUFDLDBEQUEwRDt3QkFDcEYsR0FBRyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJO3dCQUNyQyxVQUFVLEVBQUUsZUFBZTt3QkFDM0IsWUFBWSxFQUFFLEtBQUs7d0JBQ25CLGVBQWUsRUFBRSxJQUFJLENBQUMsaUZBQWlGO3FCQUN2RyxDQUFDLENBQUM7b0JBRUgsZUFBZSxHQUFHLEVBQUUsQ0FBQztvQkFDckIsY0FBYyxHQUFHLFNBQVMsQ0FBQztnQkFDNUIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ1QsQ0FBQyxDQUFDLENBQUM7WUFFSCxjQUFHLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLENBQUMsRUFBRSxPQUFPLDZCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtZQUNoSCxDQUFDLENBQUMsQ0FBQztZQUVILGdDQUFnQztZQUVoQywwQkFBZ0IsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBRXZELHdEQUF3RDtnQkFDeEQsb0RBQW9EO2dCQUNwRCxxREFBcUQ7Z0JBQ3JELHdEQUF3RDtnQkFDeEQsd0NBQXdDO2dCQUN4QyxFQUFFO2dCQUNGLHNEQUFzRDtnQkFDdEQsNENBQTRDO2dCQUM1QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsdURBQXVEO2dCQUNySSxJQUFJLElBQXNCLENBQUM7Z0JBQzNCLElBQUksR0FBd0IsQ0FBQztnQkFDN0IsSUFBSSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7b0JBQ3BCLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO29CQUNyQixHQUFHLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwRCxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUM7b0JBQ3hDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDO2dCQUNuQixDQUFDO2dCQUVELG9CQUFvQjtnQkFDcEIsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsQ0FBQztZQUVILDBCQUFnQixDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFhLEVBQUUsSUFBYSxFQUFFLEVBQUU7Z0JBQ3RGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxDQUFDLENBQUM7Z0JBQzVELENBQUM7Z0JBRUQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNuRSxDQUFDLENBQUMsQ0FBQztZQUVILDBCQUFnQixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBZ0IsRUFBRSxFQUFFO2dCQUNsRixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO2dCQUVELE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hFLENBQUMsQ0FBQyxDQUFDO1lBRUgsMEJBQWdCLENBQUMsRUFBRSxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ3JGLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUVqRiwwQkFBZ0IsQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFFM0UsMEJBQWdCLENBQUMsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBNkIsRUFBRSxFQUFFO2dCQUNoRyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZFLElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsWUFBWTtRQUNiLENBQUM7UUFFTyxlQUFlLENBQUMsWUFBdUI7WUFDOUMsSUFBSSxJQUFJLEdBQXVCLFNBQVMsQ0FBQztZQUV6QyxLQUFLLE1BQU0sV0FBVyxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUN4QyxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUNyQyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUM5QixJQUFJLEdBQUcsV0FBVyxDQUFDO29CQUNwQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxHQUFHLElBQUEsV0FBSSxFQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsSUFBQSxpQkFBVSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSx5QkFBZSxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxrQkFBTyxDQUFDLEVBQUUsQ0FBQztnQkFDeEksT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixDQUFDO1FBRU8saUJBQWlCLENBQUMsS0FBWTtZQUNyQyxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUVYLDJDQUEyQztnQkFDM0MsTUFBTSxhQUFhLEdBQUc7b0JBQ3JCLE9BQU8sRUFBRSxpQ0FBaUMsS0FBSyxDQUFDLE9BQU8sRUFBRTtvQkFDekQsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO2lCQUNsQixDQUFDO2dCQUVGLHdCQUF3QjtnQkFDeEIsSUFBSSxDQUFDLGtCQUFrQixFQUFFLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7WUFDN0YsQ0FBQztZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTztZQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsU0FBUyxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWpFLGdFQUFnRTtZQUNoRSwrREFBK0Q7WUFDL0QsaUVBQWlFO1lBQ2pFLDZDQUE2QztZQUM3QyxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUM7WUFDcEUsSUFBSSxvQkFBUyxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RDLGNBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQzVDLENBQUM7WUFFRCxpQ0FBaUM7WUFDakMsdUVBQXVFO1lBQ3ZFLHlFQUF5RTtZQUN6RSx3Q0FBd0M7WUFDeEMsb0VBQW9FO1lBQ3BFLCtFQUErRTtZQUMvRSxJQUFJLENBQUM7Z0JBQ0osSUFBSSxzQkFBVyxJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyw0QkFBaUIsQ0FBQyxjQUFjLENBQUMseUJBQXlCLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDaEssNEJBQWlCLENBQUMsY0FBYyxDQUFDLHlCQUF5QixFQUFFLFNBQVMsRUFBRSxJQUFXLENBQUMsQ0FBQztnQkFDckYsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsMkNBQTJDO1lBQzNDLE1BQU0seUJBQXlCLEdBQUcsSUFBSSxxQkFBaUIsRUFBRSxDQUFDO1lBQzFELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxDQUFDLE1BQU0sZ0NBQXdCLEVBQUUsQ0FBQztvQkFDdEMsbURBQW1EO29CQUNuRCxpREFBaUQ7b0JBQ2pELGtEQUFrRDtvQkFDbEQsa0RBQWtEO29CQUNsRCxXQUFXO29CQUNYLHlCQUF5QixDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNyQyxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztnQkFDNUMsSUFBQSxpQ0FBZ0IsRUFBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ3BELElBQUEsNkJBQVksRUFBQyxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7YUFDaEQsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFFbkUsaUJBQWlCO1lBQ2pCLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFOUYsV0FBVztZQUNYLE1BQU0sdUJBQXVCLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUU5RixlQUFlO1lBQ2YsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsdUJBQWdCLENBQUMsQ0FBQyxDQUFDO1lBRXpFLDZCQUE2QjtZQUM3QixJQUFJLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxpREFBdUIsQ0FBQyxDQUFDLENBQUM7WUFFaEYsZ0JBQWdCO1lBQ2hCLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLHlCQUF5QixFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUVoSSw4QkFBOEI7WUFDOUIsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLHVCQUF1QixDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUseUJBQXlCLENBQUMsQ0FBQyxDQUFDO1lBRXpKLGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsb0NBQW9DLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUVyRSxvREFBb0Q7WUFDcEQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssbUNBQTJCLENBQUM7WUFFM0QsZUFBZTtZQUNmLE1BQU0sdUJBQXVCLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBRTlHLGtDQUFrQztZQUNsQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyw2Q0FBcUMsQ0FBQztZQUVyRSwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRXZCLCtGQUErRjtZQUMvRixNQUFNLHdCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx3QkFBZ0IsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3pFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx5QkFBaUIsRUFBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyx3Q0FBZ0MsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2hILENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ1Ysd0JBQXdCLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUVPLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxRQUEwQixFQUFFLHlCQUE0QztZQUM5RyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDZCQUFtQixDQUFDLENBQUM7WUFDdkYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7WUFDN0MsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBc0IsQ0FBQyxDQUFDO1lBQ2hHLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQ0FBa0IsQ0FBQyxDQUFDO1lBRTNELDBEQUEwRDtZQUMxRCw0REFBNEQ7WUFDNUQsc0RBQXNEO1lBRXRELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQztZQUNqQixVQUFVLENBQUMsZUFBZSxDQUFDO2dCQUMxQixLQUFLLENBQUMsU0FBUyxDQUFDLEdBQVEsRUFBRSxPQUF5QjtvQkFDbEQsT0FBTyxHQUFHLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDL0YsQ0FBQzthQUNELENBQUMsQ0FBQztZQUVILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFtQixDQUFDO2dCQUNsRSxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQyxtQkFBbUI7Z0JBQzlELG9CQUFvQixFQUFFLHFCQUFxQixDQUFDLG9CQUFvQjtnQkFDaEUsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDcEUsQ0FBQyxDQUFDLENBQUM7WUFDSixNQUFNLGtCQUFrQixHQUFHLElBQUksa0JBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkgsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHlCQUFnQixDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRixNQUFNLGlCQUFpQixHQUFHLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMvRixVQUFVLENBQUMsZUFBZSxDQUFDLElBQUksZ0NBQXVCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLENBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUN6RyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUNBQW1CLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUV0SyxPQUFPLG1CQUFtQixDQUFDO1FBQzVCLENBQUM7UUFFTyxvQ0FBb0MsQ0FBQyx5QkFBNEM7WUFDeEYsTUFBTSxRQUFRLEdBQUcsR0FBOEIsRUFBRSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzNGLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxXQUFJLENBQUMsR0FBRyxFQUFFLENBQUMseUJBQXlCLENBQUMsVUFBVSxDQUNoRiwyREFBaUMsRUFDakMsSUFBSSxrREFBd0IsRUFBRSxDQUM5QixDQUFDLENBQUM7WUFFSCxtQkFBUSxDQUFDLHNCQUFzQixDQUFDLGlCQUFPLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQzFGLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDMUMsT0FBTyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztnQkFFRCxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUE2Qiw4REFBb0MsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUM3RyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUM1RCxHQUFHLENBQUMsRUFBRTtvQkFDTCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDcEUsUUFBUSxDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbEQsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsMEJBQTBCLENBQUMsa0JBQXVDLEVBQUUsaUJBQXFDO1lBRXRIOzs7ZUFHRztZQUVILDhEQUE4RDtZQUM5RCxNQUFNLDJCQUEyQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3JJLElBQUksMkJBQTJCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxtRUFBbUUsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO1lBQ3pILENBQUM7WUFFRCxvRUFBb0U7WUFDcEUsTUFBTSxxQkFBcUIsR0FBRyxDQUFPLE1BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQWEsQ0FBQztZQUM5RSxJQUFJLHFCQUFxQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNkVBQTZFLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUM3SCxDQUFDO1lBRUQsSUFBSSwyQkFBMkIsQ0FBQyxNQUFNLEdBQUcscUJBQXFCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM3RSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxZQUFZLEdBQUc7Z0JBQ3BCLEdBQUcsMkJBQTJCO2dCQUM5QixHQUFHLHFCQUFxQjthQUN4QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCxJQUFJLENBQUM7b0JBQ0osT0FBTyxFQUFFLEdBQUcsRUFBRSxTQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQztnQkFDbEQsQ0FBQztnQkFBQyxNQUFNLENBQUM7b0JBQ1IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0VBQWdFLEVBQUUsR0FBRyxDQUFDLENBQUM7b0JBRTdGLE9BQU8sU0FBUyxDQUFDO2dCQUNsQixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFNBQVMsR0FBc0IsRUFBRSxDQUFDO1lBQ3hDLE1BQU0sSUFBSSxHQUFtQixFQUFFLENBQUM7WUFDaEMsS0FBSyxNQUFNLFdBQVcsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixTQUFTLENBQUMsVUFBVTtnQkFDckIsQ0FBQztnQkFFRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUNwQixJQUFJLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7d0JBQzNGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDREQUE0RCxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBRXBILFNBQVMsQ0FBQyxVQUFVO29CQUNyQixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsa0ZBQWtGLEVBQUUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7d0JBRTFKLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyw0QkFBNEI7b0JBQzdELENBQUM7Z0JBQ0YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZGQUE2RixFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBRXJKLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQywrQkFBK0I7Z0JBQ3hELENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU8sS0FBSyxDQUFDLG1CQUFtQixDQUFDLFFBQXlCLEVBQUUsa0JBQXVDLEVBQUUsaUJBQXFDO1lBQzFJLElBQUksV0FBZ0IsQ0FBQztZQUNyQixJQUFJLE9BQWUsQ0FBQztZQUNwQixJQUFJLElBQUEsMEJBQWlCLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7Z0JBQ3BDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSw4RkFBOEYsRUFBRSxXQUFXLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHFCQUFZLEVBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLGFBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2xVLENBQUM7aUJBQU0sSUFBSSxJQUFBLHVCQUFjLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDckMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUM7Z0JBQ2pDLE9BQU8sR0FBRyxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSxzRkFBc0YsRUFBRSxXQUFXLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHFCQUFZLEVBQUMsV0FBVyxFQUFFLEVBQUUsRUFBRSxFQUFFLGFBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZULENBQUM7aUJBQU0sQ0FBQztnQkFDUCxXQUFXLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztnQkFDL0IsT0FBTyxHQUFHLElBQUEsY0FBUSxFQUFDLGdDQUFnQyxFQUFFLDhGQUE4RixFQUFFLFdBQVcsQ0FBQyxNQUFNLEtBQUssaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUEscUJBQVksRUFBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLEVBQUUsYUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDclUsQ0FBQztZQUVELElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBRXhGLCtFQUErRTtnQkFDL0UsRUFBRTtnQkFDRiw4RUFBOEU7Z0JBQzlFLDJFQUEyRTtnQkFDM0Usc0NBQXNDO2dCQUN0QyxFQUFFO2dCQUNGLDBFQUEwRTtnQkFDMUUsOERBQThEO2dCQUM5RCxFQUFFO2dCQUNGLCtFQUErRTtnQkFFL0UsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFVLGlCQUFlLENBQUMsbURBQW1ELENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDaEssSUFBSSxrQkFBa0IsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxLQUFLLENBQUMsQ0FBQywyQkFBMkI7WUFDMUMsQ0FBQztZQUVELE1BQU0sRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxjQUFjLENBQUM7Z0JBQzVFLElBQUksRUFBRSxTQUFTO2dCQUNmLE9BQU8sRUFBRTtvQkFDUixJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztvQkFDdEUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUM7aUJBQ3ZFO2dCQUNELE9BQU87Z0JBQ1AsTUFBTSxFQUFFLElBQUEsY0FBUSxFQUFDLG1CQUFtQixFQUFFLCtLQUErSyxDQUFDO2dCQUN0TixhQUFhLEVBQUUsV0FBVyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsMENBQTBDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsMkNBQTJDLENBQUM7Z0JBQzlNLFFBQVEsRUFBRSxDQUFDO2FBQ1gsQ0FBQyxDQUFDO1lBRUgsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU8sSUFBSSxDQUFDLENBQUMseUJBQXlCO1lBQ3ZDLENBQUM7WUFFRCxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQix3RUFBd0U7Z0JBQ3hFLHVFQUF1RTtnQkFDdkUseUVBQXlFO2dCQUN6RSxzREFBc0Q7Z0JBQ3RELE1BQU0sT0FBTyxHQUFHLEVBQUUsT0FBTyxFQUFFLHlDQUF5QyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsTUFBTSxLQUFLLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2SSxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2hFLGtCQUFrQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxPQUFPLEtBQUssQ0FBQyxDQUFDLDZCQUE2QjtRQUM1QyxDQUFDO1FBRU8sZ0NBQWdDLENBQUMsR0FBUTtZQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNmLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxZQUFZO1lBQ1osSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLGlCQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sT0FBTyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVyQyxJQUFJLElBQUEscUNBQXlCLEVBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsT0FBTyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDbEMsQ0FBQztnQkFFRCxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDcEIsQ0FBQztZQUVELGNBQWM7aUJBQ1QsSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLGlCQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBRWpELHNCQUFzQjtnQkFDdEIsc0VBQXNFO2dCQUN0RSwrREFBK0Q7Z0JBRS9ELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7Z0JBQ3JGLElBQUksV0FBVyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDckQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7b0JBRTdDLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7b0JBQ3RCLE1BQU0sTUFBTSxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDOUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUN6QyxnREFBZ0Q7d0JBQ2hELG9EQUFvRDt3QkFDcEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDMUIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDM0IsQ0FBQztvQkFFRCxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsWUFBWSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztvQkFFN0csSUFBSSxJQUFBLHFDQUF5QixFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQ3JDLE9BQU8sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLENBQUM7b0JBQ3BDLENBQUM7b0JBRUQsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7d0JBQzFCLGdDQUFnQzt3QkFDaEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztvQkFDL0IsQ0FBQztvQkFFRCxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDO2dCQUNqQyxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsa0JBQXVDLEVBQUUsaUJBQXFDLEVBQUUsVUFBdUIsRUFBRSxHQUFRLEVBQUUsT0FBeUI7WUFDM0ssSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUUvRSwrRUFBK0U7WUFDL0UsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7Z0JBQ2hGLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO29CQUNkLFNBQVMsRUFBRSxNQUFNO29CQUNqQixJQUFJLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSTtvQkFDL0IsS0FBSyxFQUFFLEVBQUU7aUJBQ1QsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELElBQUkscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1lBRWxDLGlGQUFpRjtZQUNqRixNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxtR0FBbUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBRS9JLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzFCLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTdDLHFCQUFxQixHQUFHLElBQUksQ0FBQztZQUM5QixDQUFDO1lBRUQsdUNBQXVDO2lCQUNsQyxJQUFJLHNCQUFXLElBQUksa0JBQWtCLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG1HQUFtRyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFL0kscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBQzlCLENBQUM7WUFFRCw0RUFBNEU7WUFDNUUsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM1QyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMERBQTBELEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUV0RyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM1QixHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUU3QyxJQUFJLENBQUMsc0JBQXNCLENBQUMsVUFBVSxHQUFHLFVBQVUsSUFBSSxTQUFTLENBQUM7WUFDbEUsQ0FBQztZQUVELDREQUE0RDtZQUM1RCxNQUFNLDZCQUE2QixHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqRixJQUFJLDZCQUE2QixFQUFFLENBQUM7Z0JBQ25DLElBQUksTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsNkJBQTZCLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxDQUFDO29CQUMxRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxtREFBbUQsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBRS9GLE9BQU8sSUFBSSxDQUFDLENBQUMsMkRBQTJEO2dCQUN6RSxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMseURBQXlELEVBQUUsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUVwSSxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7d0JBQzNELE9BQU8seUJBQWlCO3dCQUN4QixHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUU7d0JBQzVDLFVBQVUsRUFBRSxDQUFDLDZCQUE2QixDQUFDO3dCQUMzQyxjQUFjLEVBQUUscUJBQXFCO3dCQUNyQyxZQUFZLEVBQUUsSUFBSTt3QkFDbEIsNkVBQTZFO3FCQUM3RSxDQUFDLENBQUMsQ0FBQztvQkFFSixNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxzRkFBc0Y7b0JBRXZHLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBRUQsZ0ZBQWdGO1lBQ2hGLElBQUkscUJBQXFCLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMkVBQTJFLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUV2SCxNQUFNLE1BQU0sR0FBRyxJQUFBLHVCQUFjLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7b0JBQzNELE9BQU8seUJBQWlCO29CQUN4QixHQUFHLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUU7b0JBQzVDLGNBQWMsRUFBRSxJQUFJO29CQUNwQixVQUFVLEVBQUUsSUFBSTtvQkFDaEIsWUFBWSxFQUFFLElBQUk7b0JBQ2xCLGVBQWUsRUFBRSxJQUFBLGdDQUFrQixFQUFDLEdBQUcsQ0FBQztpQkFDeEMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosTUFBTSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBRXRCLE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFM0YsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sa0JBQWtCLENBQUMsU0FBaUIsRUFBRSxLQUFhO1lBQzFELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQyw2QkFBYSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRXBILE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDdkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQztnQkFFckQsTUFBTSxJQUFJLEdBQUcsTUFBTSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRTNDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFEQUFxRCxDQUFDLENBQUM7Z0JBRTdFLE9BQU8sSUFBSSxlQUFpQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUN0QyxNQUFNLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFFaEMsT0FBTyxtQkFBbUIsQ0FBQztZQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsT0FBTyxFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLENBQUM7UUFDcEQsQ0FBQztRQUVPLEtBQUssQ0FBQyxZQUFZLENBQUMsU0FBaUIsRUFBRSxLQUFhLEVBQUUsa0JBQThDO1lBQzFHLE1BQU0sUUFBUSxHQUFHLElBQUkscUNBQWlCLEVBQUUsQ0FBQztZQUV6QyxTQUFTO1lBQ1QsUUFBUSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzFCLEtBQUssT0FBTztvQkFDWCxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHdDQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDckUsTUFBTTtnQkFFUCxLQUFLLE9BQU87b0JBQ1gsSUFBSSxzQkFBVyxFQUFFLENBQUM7d0JBQ2pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQWMsRUFBRSxJQUFJLDRCQUFjLENBQUMsc0NBQWlCLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzFILENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHdDQUFrQixDQUFDLENBQUMsQ0FBQztvQkFDdEUsQ0FBQztvQkFDRCxNQUFNO2dCQUVQLEtBQUssUUFBUTtvQkFDWixRQUFRLENBQUMsR0FBRyxDQUFDLHVCQUFjLEVBQUUsSUFBSSw0QkFBYyxDQUFDLDBDQUFtQixDQUFDLENBQUMsQ0FBQztvQkFDdEUsTUFBTTtZQUNSLENBQUM7WUFFRCxVQUFVO1lBQ1YsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2QkFBbUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUNBQWtCLEVBQUUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ25ILFFBQVEsQ0FBQyxHQUFHLENBQUMsK0NBQTRCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHlEQUEyQixFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBRTlHLFVBQVU7WUFDVixNQUFNLGlCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdEYsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQ0FBa0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRXBELFNBQVM7WUFDVCxRQUFRLENBQUMsR0FBRyxDQUFDLHNDQUFrQixFQUFFLElBQUksNEJBQWMsQ0FBQyxxQ0FBaUIsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztZQUUzSCxjQUFjO1lBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsK0NBQXNCLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7WUFDckksUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQ0FBbUIsRUFBRSxrQkFBWSxDQUFDLFNBQVMsQ0FBQyxJQUFBLHVCQUFpQixFQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVsSixTQUFTO1lBQ1QsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBaUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsbUNBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGFBQWE7WUFDYixRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFzQixFQUFFLElBQUksNEJBQWMsQ0FBQyw2Q0FBcUIsQ0FBQyxDQUFDLENBQUM7WUFFaEYsa0JBQWtCO1lBQ2xCLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0RBQTBCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHFEQUF5QixDQUFDLENBQUMsQ0FBQztZQUV4RixjQUFjO1lBQ2QsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBc0IsRUFBRSxJQUFJLDRCQUFjLENBQUMsNkNBQXFCLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7WUFFbkksa0JBQWtCO1lBQ2xCLFFBQVEsQ0FBQyxHQUFHLENBQUMsOENBQXNCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHVDQUFrQixDQUFDLENBQUMsQ0FBQztZQUU3RSxVQUFVO1lBQ1YsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsdUNBQWtCLENBQUMsQ0FBQyxDQUFDO1lBRTFFLHlCQUF5QjtZQUN6QixRQUFRLENBQUMsR0FBRyxDQUFDLDRDQUFxQixFQUFFLElBQUksNEJBQWMsQ0FBQywyQ0FBb0IsQ0FBQyxDQUFDLENBQUM7WUFFOUUsVUFBVTtZQUNWLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHVDQUFrQixDQUFDLENBQUMsQ0FBQztZQUMxRSxRQUFRLENBQUMsR0FBRyxDQUFDLG1EQUE4QixFQUFFLElBQUksNEJBQWMsQ0FBQyxrREFBNkIsQ0FBQyxDQUFDLENBQUM7WUFFaEcsV0FBVztZQUNYLE1BQU0sY0FBYyxHQUFHLElBQUksK0NBQXNCLENBQUM7Z0JBQ2pELFNBQVMsK0NBQW1DO2dCQUM1QyxjQUFjLG1EQUF3QztnQkFDdEQsVUFBVSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLHVHQUF1RCxJQUFJLEdBQUc7YUFDNUcsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkcsTUFBTSxjQUFjLEdBQUcsSUFBSSwrQkFBYyxDQUN4QyxjQUFjLEVBQ2QsSUFBSSxDQUFDLG9CQUFvQixFQUN6QixJQUFJLENBQUMsVUFBVSxFQUNmLElBQUksQ0FBQyxhQUFhLENBQ2xCLENBQUM7WUFDRixRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRS9DLG9CQUFvQjtZQUNwQixJQUFJLG9CQUFTLEVBQUUsQ0FBQztnQkFDZixRQUFRLENBQUMsR0FBRyxDQUFDLCtDQUE0QixFQUFFLElBQUksNEJBQWMsQ0FBQyx3REFBOEIsQ0FBQyxDQUFDLENBQUM7WUFDaEcsQ0FBQztpQkFBTSxJQUFJLHNCQUFXLEVBQUUsQ0FBQztnQkFDeEIsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQ0FBNEIsRUFBRSxJQUFJLDRCQUFjLENBQUMsb0RBQTBCLENBQUMsQ0FBQyxDQUFDO1lBQzVGLENBQUM7aUJBQU0sSUFBSSxrQkFBTyxFQUFFLENBQUM7Z0JBQ3BCLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0NBQTRCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLHNEQUE0QixDQUFDLENBQUMsQ0FBQztZQUM5RixDQUFDO1lBRUQsVUFBVTtZQUNWLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzVJLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWtCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUVwRCxhQUFhO1lBQ2IsTUFBTSwrQkFBK0IsR0FBRyxJQUFJLGlFQUErQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQywyQkFBMkIsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2xNLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0VBQWdDLEVBQUUsK0JBQStCLENBQUMsQ0FBQztZQUNoRixRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixFQUFFLElBQUksNEJBQWMsQ0FBQyw2Q0FBcUIsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztZQUMvSCxRQUFRLENBQUMsR0FBRyxDQUFDLDREQUE2QixFQUFFLElBQUksNEJBQWMsQ0FBQywyREFBNEIsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVoSCxlQUFlO1lBQ2YsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxFQUFFLElBQUksNEJBQWMsQ0FBQyw2QkFBZ0IsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztZQUVuSCxZQUFZO1lBQ1osSUFBSSxJQUFBLGtDQUFpQixFQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQztnQkFDekUsTUFBTSxVQUFVLEdBQUcsSUFBQSxvQ0FBbUIsRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUN2RixNQUFNLE9BQU8sR0FBRyxJQUFBLHVCQUFpQixFQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdHLE1BQU0sUUFBUSxHQUFHLElBQUksc0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sZ0JBQWdCLEdBQUcsSUFBQSwwQ0FBdUIsRUFBQyxJQUFBLFlBQU8sR0FBRSxFQUFFLElBQUEsYUFBUSxHQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUM3SyxNQUFNLFFBQVEsR0FBRyxJQUFBLDJDQUEwQixFQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUN6RSxNQUFNLE1BQU0sR0FBNEIsRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUM7Z0JBRXhILFFBQVEsQ0FBQyxHQUFHLENBQUMsNkJBQWlCLEVBQUUsSUFBSSw0QkFBYyxDQUFDLG1DQUFnQixFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN4RixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2QkFBaUIsRUFBRSxxQ0FBb0IsQ0FBQyxDQUFDO1lBQ3ZELENBQUM7WUFFRCxrQ0FBa0M7WUFDbEMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxrRUFBZ0MsRUFBRSxJQUFJLDRCQUFjLENBQUMsaUVBQStCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckgsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvREFBeUIsRUFBRSxJQUFJLDRCQUFjLENBQUMsbURBQXdCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdkcseUJBQXlCO1lBQ3pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0VBQWdDLEVBQUUsSUFBSSw0QkFBYyxDQUFDLGlFQUErQixFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXJILGdDQUFnQztZQUNoQyxNQUFNLGdCQUFRLENBQUMsT0FBTyxDQUFDO2dCQUN0QixpQkFBaUIsQ0FBQyxVQUFVLEVBQUU7Z0JBQzlCLCtCQUErQixDQUFDLFVBQVUsRUFBRTthQUM1QyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVPLFlBQVksQ0FBQyxRQUEwQixFQUFFLHlCQUE0QyxFQUFFLG1CQUErQztZQUU3SSxpRUFBaUU7WUFDakUsNkRBQTZEO1lBQzdELDZEQUE2RDtZQUM3RCw4REFBOEQ7WUFFOUQsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBRTFELE1BQU0sYUFBYSxHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQWtCLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVILElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sa0JBQWtCLEdBQUcsa0JBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnREFBdUIsQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdEksSUFBSSxDQUFDLHdCQUF3QixDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUVqRixtQ0FBbUM7WUFDbkMsTUFBTSxhQUFhLEdBQUcsSUFBSSx5QkFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsdUJBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdEUseUJBQXlCLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUNuRSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBRXBGLGNBQWM7WUFDZCxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLGlCQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUUsSUFBQSxrQkFBVSxFQUFDLHNCQUFzQixZQUFZLCtDQUFzQixDQUFDLENBQUM7WUFDckUsTUFBTSx5QkFBeUIsR0FBRyxJQUFJLDREQUE2QixDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDMUkseUJBQXlCLENBQUMsZUFBZSxDQUFDLDZEQUE4QixFQUFFLHlCQUF5QixDQUFDLENBQUM7WUFDckcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyw2REFBOEIsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7WUFFdEgscUJBQXFCO1lBQ3JCLE1BQU0sdUJBQXVCLEdBQUcsa0JBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4Q0FBNEIsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2xILHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3ZGLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1lBRXhHLFVBQVU7WUFDVixNQUFNLGNBQWMsR0FBRyxJQUFJLDJCQUFjLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBZSxDQUFDLENBQUMsQ0FBQztZQUN6RSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBRXRGLFNBQVM7WUFDVCxNQUFNLGFBQWEsR0FBRyxJQUFJLHlCQUFhLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1QkFBYyxDQUFDLENBQUMsQ0FBQztZQUN0RSx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRW5FLFNBQVM7WUFDVCxNQUFNLFlBQVksR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLHlCQUFpQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDNUYseUJBQXlCLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqRSxhQUFhO1lBQ2IsTUFBTSxpQkFBaUIsR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLDBDQUFzQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDdEcseUJBQXlCLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBRTNFLFVBQVU7WUFDVixNQUFNLFdBQVcsR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLG1CQUFZLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUN0Rix5QkFBeUIsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRS9ELGtCQUFrQjtZQUNsQixNQUFNLHFCQUFxQixHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0RBQTBCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM5Ryx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQUVuRixzQ0FBc0M7WUFDdEMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOENBQXNCLENBQUMsQ0FBQztZQUNsRSxNQUFNLGlCQUFpQixHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM1Rix5QkFBeUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDM0UsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBRTVGLGFBQWE7WUFDYixNQUFNLGlCQUFpQixHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0JBQWtCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNsRyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFFM0UsVUFBVTtZQUNWLE1BQU0sY0FBYyxHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNoRyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXJFLGVBQWU7WUFDZixNQUFNLFVBQVUsR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFXLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNwRix5QkFBeUIsQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTdELGtCQUFrQjtZQUNsQixNQUFNLGNBQWMsR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUFzQixDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkcseUJBQXlCLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUVyRSxrQ0FBa0M7WUFDbEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUFzQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0SCx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQ3JFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFFdEYsb0RBQW9EO1lBQ3BELE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGdFQUFvQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsd0NBQW1CLENBQUMsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLDhDQUE0QixDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDeEwsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFFN0csV0FBVztZQUNYLE1BQU0sY0FBYyxHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM3Rix5QkFBeUIsQ0FBQyxlQUFlLENBQUMsOEJBQW1CLENBQUMsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBRXhGLG9CQUFvQjtZQUNwQixNQUFNLHVCQUF1QixHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsK0NBQTRCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNsSCx5QkFBeUIsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUV2RixTQUFTO1lBQ1QsTUFBTSxhQUFhLEdBQUcsSUFBSSxzQkFBYSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsa0NBQWtCLENBQUMsQ0FBRSxDQUFDO1lBQzNFLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbkUsbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUVwRixvQ0FBb0M7WUFDcEMsTUFBTSwwQ0FBMEMsR0FBRyxJQUFJLGtFQUEwQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNkJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3JJLHlCQUF5QixDQUFDLGVBQWUsQ0FBQywyQkFBMkIsRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1lBRW5ILHlCQUF5QjtZQUN6QixNQUFNLDJCQUEyQixHQUFHLGtCQUFZLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsNENBQXFCLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMvRyx5QkFBeUIsQ0FBQyxlQUFlLENBQUMseURBQWtDLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztZQUUzRyx5QkFBeUI7WUFDekIsTUFBTSwyQkFBMkIsR0FBRyxrQkFBWSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGtFQUFnQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDMUgseUJBQXlCLENBQUMsZUFBZSxDQUFDLGdFQUFrQyxFQUFFLDJCQUEyQixDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUVPLEtBQUssQ0FBQyxlQUFlLENBQUMsUUFBMEIsRUFBRSxtQkFBcUQ7WUFDOUcsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw2QkFBbUIsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQywyQkFBMkIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtDQUE0QixDQUFDLENBQUM7WUFFOUUsTUFBTSxPQUFPLEdBQUcsSUFBQSw4QkFBaUIsRUFBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyx5QkFBaUIsQ0FBQyw0QkFBb0IsQ0FBQztZQUN2RixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDO1lBRTlDLHNEQUFzRDtZQUN0RCxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBRXpCLHlDQUF5QztnQkFDekMsSUFBSSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUM5QyxPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQzt3QkFDOUIsT0FBTzt3QkFDUCxHQUFHLEVBQUUsSUFBSTt3QkFDVCxVQUFVLEVBQUUsbUJBQW1CLENBQUMsU0FBUzt3QkFDekMsWUFBWSxFQUFFLElBQUk7d0JBQ2xCLGNBQWMsRUFBRSxJQUFJO3dCQUNwQix5REFBeUQ7cUJBQ3pELENBQUMsQ0FBQztnQkFDSixDQUFDO2dCQUVELG1EQUFtRDtnQkFDbkQsc0NBQXNDO2dCQUN0QyxtREFBbUQ7Z0JBQ25ELG1EQUFtRDtnQkFDbkQsdUNBQXVDO2dCQUN2QyxtREFBbUQ7Z0JBQ25ELHFEQUFxRDtnQkFFckQsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QyxLQUFLLE1BQU0sV0FBVyxJQUFJLG1CQUFtQixDQUFDLElBQUksRUFBRSxDQUFDO3dCQUNwRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQWUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUMxRCxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBRXpDLDZEQUE2RDs0QkFDN0Qsd0RBQXdEOzRCQUV4RCxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUMxQixXQUFXLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUN6RCxXQUFXLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7NEJBRXJFLE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO2dDQUM5QixPQUFPO2dDQUNQLEdBQUcsRUFBRSxJQUFJO2dDQUNULGNBQWMsRUFBRSxJQUFJO2dDQUNwQixVQUFVLEVBQUUsSUFBSTtnQ0FDaEIsWUFBWSxFQUFFLElBQUk7Z0NBQ2xCLGNBQWMsRUFBRSxJQUFJO2dDQUNwQix5REFBeUQ7NkJBQ3pELENBQUMsQ0FBQzt3QkFDSixDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBbUIsTUFBTyxDQUFDLFlBQVksQ0FBQztZQUMxRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNqQyxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdkMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssSUFBSSxDQUFDO1lBQ25FLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMvRyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLFNBQVMsQ0FBQztZQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQ2xDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlDLHdDQUF3QztZQUN4QyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBRW5ELG1CQUFtQjtnQkFDbkIsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksWUFBWSxJQUFJLGdCQUFnQixFQUFFLENBQUM7b0JBQzVELE9BQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDO3dCQUM5QixPQUFPO3dCQUNQLEdBQUcsRUFBRSxJQUFJO3dCQUNULGNBQWMsRUFBRSxJQUFJO3dCQUNwQixVQUFVLEVBQUUsSUFBSTt3QkFDaEIsYUFBYTt3QkFDYixpQkFBaUI7d0JBQ2pCLGNBQWMsRUFBRSxJQUFJO3dCQUNwQixlQUFlO3dCQUNmLFlBQVk7d0JBQ1osZ0JBQWdCO3FCQUNoQixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFFRCwyQ0FBMkM7Z0JBQzNDLElBQUksWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN6QixPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQzt3QkFDOUIsT0FBTywwQkFBa0I7d0JBQ3pCLEdBQUcsRUFBRSxJQUFJO3dCQUNULFVBQVUsRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFOzRCQUNuQyxJQUFJLEdBQUcsSUFBQSw0QkFBWSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMENBQTBDOzRCQUVyRSxPQUFPLENBQUMsSUFBQSxxQ0FBeUIsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDM0csQ0FBQyxDQUFDO3dCQUNGLGFBQWE7d0JBQ2IsaUJBQWlCO3dCQUNqQixjQUFjLEVBQUUsSUFBSTt3QkFDcEIsNERBQTREO3FCQUM1RCxDQUFDLENBQUM7Z0JBQ0osQ0FBQztZQUNGLENBQUM7WUFFRCwrQkFBK0I7WUFDL0IsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7Z0JBQzlCLE9BQU87Z0JBQ1AsR0FBRyxFQUFFLElBQUk7Z0JBQ1QsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDM0UsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNuQixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLGFBQWE7Z0JBQ2IsaUJBQWlCO2dCQUNqQixZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ3ZCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixlQUFlO2dCQUNmLFlBQVk7Z0JBQ1osZ0JBQWdCO2FBQ2hCLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxlQUFlO1lBRXRCLGlCQUFpQjtZQUNqQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFcEIscUJBQXFCO1lBQ3JCLG1CQUFRLENBQUMsb0JBQW9CLENBQUMsaUJBQU8sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDakYsUUFBUSxDQUFDO29CQUNSLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsRUFBRSxPQUFPLENBQUM7b0JBQzdELE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTTtpQkFDdEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCx1RUFBdUU7WUFDdkUseUVBQXlFO1lBQ3pFLHlCQUF5QjtZQUN6Qix3REFBd0Q7WUFDeEQsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVsRixpQkFBaUI7WUFDakIsSUFBSSxDQUFDLDZCQUE2QixFQUFFLENBQUM7WUFFckMsSUFBSSxzQkFBVyxJQUFJLGNBQUcsQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsYUFBYSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDN0UsQ0FBQztRQUVGLENBQUM7UUFFTyxLQUFLLENBQUMsWUFBWTtZQUN6QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQztZQUMxRCxJQUFJLG9CQUFTLElBQUksY0FBYyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQztvQkFDSixNQUFNLFlBQVksR0FBRyxzREFBYSx1QkFBdUIsMkJBQUMsQ0FBQztvQkFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNyRCxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLElBQXNCLEVBQUUsR0FBd0IsRUFBRSxhQUFzQjtZQUM3RyxJQUFJLENBQUM7Z0JBQ0osT0FBTyxNQUFNLElBQUEsOEJBQW1CLEVBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3pGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixNQUFNLFlBQVksR0FBRyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNDLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxhQUFhLENBQUMsaUNBQWlDLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQ3pGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFTyxLQUFLLENBQUMsNkJBQTZCO1lBRTFDLHlFQUF5RTtZQUN6RSwyRUFBMkU7WUFDM0UsbUVBQW1FO1lBRW5FLElBQUksQ0FBQztnQkFDSixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDOUYsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFBLG9CQUFhLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxjQUFjLEdBQUcsSUFBQSxrQ0FBaUIsRUFBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxtQkFBbUIsR0FBRyxjQUFjLGdDQUF3QixDQUFDO2dCQUVuRSxrQkFBa0I7Z0JBQ2xCLElBQUksUUFBUSxDQUFDLHVCQUF1QixDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3JELE1BQU0scUJBQXFCLEdBQUc7d0JBQzdCLEVBQUU7d0JBQ0Ysd0NBQXdDO3dCQUN4QyxxREFBcUQ7d0JBQ3JELDZCQUE2QixtQkFBbUIsR0FBRzt3QkFDbkQsRUFBRTt3QkFDRiwyRUFBMkU7d0JBQzNFLDZCQUE2Qjt3QkFDN0IsMEJBQTBCLElBQUEsbUJBQVksR0FBRSxHQUFHO3dCQUMzQyxHQUFHO3FCQUNILENBQUM7b0JBQ0YsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUVySCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDaEgsQ0FBQztnQkFFRCw2REFBNkQ7cUJBQ3hELENBQUM7b0JBQ0wsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSw0QkFBNEIsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO29CQUM3SCxJQUFJLGFBQWEsS0FBSyxVQUFVLEVBQUUsQ0FBQzt3QkFDbEMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7b0JBQ2hILENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDO1FBQ0YsQ0FBQzs7SUE1ekNXLDBDQUFlOzhCQUFmLGVBQWU7UUFjekIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLGdEQUF1QixDQUFBO1FBQ3ZCLFdBQUEsNENBQXFCLENBQUE7UUFDckIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLG9CQUFZLENBQUE7UUFDWixZQUFBLGdDQUFlLENBQUE7UUFDZixZQUFBLDhDQUE0QixDQUFBO09BdkJsQixlQUFlLENBNnpDM0IifQ==