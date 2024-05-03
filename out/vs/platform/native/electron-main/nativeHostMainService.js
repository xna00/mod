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
define(["require", "exports", "child_process", "electron", "os", "util", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/extpath", "vs/base/node/id", "vs/base/node/pfs", "vs/base/node/ports", "vs/nls", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/theme/electron-main/themeMainService", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/base/common/buffer", "vs/platform/remote/node/wsl", "vs/platform/profiling/electron-main/windowProfiling", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindows", "vs/base/common/errors"], function (require, exports, child_process_1, electron_1, os_1, util_1, decorators_1, event_1, lifecycle_1, network_1, path_1, platform_1, uri_1, extpath_1, id_1, pfs_1, ports_1, nls_1, dialogMainService_1, environmentMainService_1, instantiation_1, lifecycleMainService_1, log_1, productService_1, themeMainService_1, windows_1, workspace_1, workspacesManagementMainService_1, buffer_1, wsl_1, windowProfiling_1, auxiliaryWindows_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostMainService = exports.INativeHostMainService = void 0;
    exports.INativeHostMainService = (0, instantiation_1.createDecorator)('nativeHostMainService');
    let NativeHostMainService = class NativeHostMainService extends lifecycle_1.Disposable {
        constructor(windowsMainService, auxiliaryWindowsMainService, dialogMainService, lifecycleMainService, environmentMainService, logService, productService, themeMainService, workspacesManagementMainService) {
            super();
            this.windowsMainService = windowsMainService;
            this.auxiliaryWindowsMainService = auxiliaryWindowsMainService;
            this.dialogMainService = dialogMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.productService = productService;
            this.themeMainService = themeMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            //#endregion
            //#region Events
            this.onDidOpenMainWindow = event_1.Event.map(this.windowsMainService.onDidOpenWindow, window => window.id);
            this.onDidTriggerWindowSystemContextMenu = event_1.Event.any(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onDidTriggerSystemContextMenu, ({ window, x, y }) => { return { windowId: window.id, x, y }; }), ({ windowId }) => !!this.windowsMainService.getWindowById(windowId)), event_1.Event.filter(event_1.Event.map(this.auxiliaryWindowsMainService.onDidTriggerSystemContextMenu, ({ window, x, y }) => { return { windowId: window.id, x, y }; }), ({ windowId }) => !!this.auxiliaryWindowsMainService.getWindowById(windowId)));
            this.onDidMaximizeWindow = event_1.Event.any(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onDidMaximizeWindow, window => window.id), windowId => !!this.windowsMainService.getWindowById(windowId)), event_1.Event.filter(event_1.Event.map(this.auxiliaryWindowsMainService.onDidMaximizeWindow, window => window.id), windowId => !!this.auxiliaryWindowsMainService.getWindowById(windowId)));
            this.onDidUnmaximizeWindow = event_1.Event.any(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onDidUnmaximizeWindow, window => window.id), windowId => !!this.windowsMainService.getWindowById(windowId)), event_1.Event.filter(event_1.Event.map(this.auxiliaryWindowsMainService.onDidUnmaximizeWindow, window => window.id), windowId => !!this.auxiliaryWindowsMainService.getWindowById(windowId)));
            this.onDidChangeWindowFullScreen = event_1.Event.any(event_1.Event.map(this.windowsMainService.onDidChangeFullScreen, e => ({ windowId: e.window.id, fullscreen: e.fullscreen })), event_1.Event.map(this.auxiliaryWindowsMainService.onDidChangeFullScreen, e => ({ windowId: e.window.id, fullscreen: e.fullscreen })));
            this.onDidBlurMainWindow = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-blur', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onDidFocusMainWindow = event_1.Event.any(event_1.Event.map(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onDidChangeWindowsCount, () => this.windowsMainService.getLastActiveWindow()), window => !!window), window => window.id), event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-focus', (event, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId)));
            this.onDidBlurMainOrAuxiliaryWindow = event_1.Event.any(this.onDidBlurMainWindow, event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-blur', (event, window) => window.id), windowId => !!this.auxiliaryWindowsMainService.getWindowById(windowId)));
            this.onDidFocusMainOrAuxiliaryWindow = event_1.Event.any(this.onDidFocusMainWindow, event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-focus', (event, window) => window.id), windowId => !!this.auxiliaryWindowsMainService.getWindowById(windowId)));
            this.onDidResumeOS = event_1.Event.fromNodeEventEmitter(electron_1.powerMonitor, 'resume');
            this.onDidChangeColorScheme = this.themeMainService.onDidChangeColorScheme;
            this._onDidChangePassword = this._register(new event_1.Emitter());
            this.onDidChangePassword = this._onDidChangePassword.event;
            this.onDidChangeDisplay = event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-metrics-changed', (event, display, changedMetrics) => changedMetrics), changedMetrics => {
                // Electron will emit 'display-metrics-changed' events even when actually
                // going fullscreen, because the dock hides. However, we do not want to
                // react on this event as there is no change in display bounds.
                return !(Array.isArray(changedMetrics) && changedMetrics.length === 1 && changedMetrics[0] === 'workArea');
            }), event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-added'), event_1.Event.fromNodeEventEmitter(electron_1.screen, 'display-removed')), () => { }, 100);
        }
        //#region Properties
        get windowId() { throw new Error('Not implemented in electron-main'); }
        async getWindows(windowId, options) {
            const mainWindows = this.windowsMainService.getWindows().map(window => ({
                id: window.id,
                workspace: window.openedWorkspace ?? (0, workspace_1.toWorkspaceIdentifier)(window.backupPath, window.isExtensionDevelopmentHost),
                title: window.win?.getTitle() ?? '',
                filename: window.getRepresentedFilename(),
                dirty: window.isDocumentEdited()
            }));
            const auxiliaryWindows = [];
            if (options.includeAuxiliaryWindows) {
                auxiliaryWindows.push(...this.auxiliaryWindowsMainService.getWindows().map(window => ({
                    id: window.id,
                    parentId: window.parentId,
                    title: window.win?.getTitle() ?? '',
                    filename: window.getRepresentedFilename()
                })));
            }
            return [...mainWindows, ...auxiliaryWindows];
        }
        async getWindowCount(windowId) {
            return this.windowsMainService.getWindowCount();
        }
        async getActiveWindowId(windowId) {
            const activeWindow = this.windowsMainService.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (activeWindow) {
                return activeWindow.id;
            }
            return undefined;
        }
        openWindow(windowId, arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(windowId, arg1, arg2);
            }
            return this.doOpenEmptyWindow(windowId, arg1);
        }
        async doOpenWindow(windowId, toOpen, options = Object.create(null)) {
            if (toOpen.length > 0) {
                await this.windowsMainService.open({
                    context: 5 /* OpenContext.API */,
                    contextWindowId: windowId,
                    urisToOpen: toOpen,
                    cli: this.environmentMainService.args,
                    forceNewWindow: options.forceNewWindow,
                    forceReuseWindow: options.forceReuseWindow,
                    preferNewWindow: options.preferNewWindow,
                    diffMode: options.diffMode,
                    mergeMode: options.mergeMode,
                    addMode: options.addMode,
                    gotoLineMode: options.gotoLineMode,
                    noRecentEntry: options.noRecentEntry,
                    waitMarkerFileURI: options.waitMarkerFileURI,
                    remoteAuthority: options.remoteAuthority || undefined,
                    forceProfile: options.forceProfile,
                    forceTempProfile: options.forceTempProfile,
                });
            }
        }
        async doOpenEmptyWindow(windowId, options) {
            await this.windowsMainService.openEmptyWindow({
                context: 5 /* OpenContext.API */,
                contextWindowId: windowId
            }, options);
        }
        async toggleFullScreen(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.toggleFullScreen();
        }
        async handleTitleDoubleClick(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.handleTitleDoubleClick();
        }
        async getCursorScreenPoint(windowId) {
            const point = electron_1.screen.getCursorScreenPoint();
            const display = electron_1.screen.getDisplayNearestPoint(point);
            return { point, display: display.bounds };
        }
        async isMaximized(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            return window?.win?.isMaximized() ?? false;
        }
        async maximizeWindow(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.maximize();
        }
        async unmaximizeWindow(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.unmaximize();
        }
        async minimizeWindow(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.minimize();
        }
        async moveWindowTop(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.moveTop();
        }
        async positionWindow(windowId, position, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            if (window?.win) {
                if (window.win.isFullScreen()) {
                    const fullscreenLeftFuture = event_1.Event.toPromise(event_1.Event.once(event_1.Event.fromNodeEventEmitter(window.win, 'leave-full-screen')));
                    window.win.setFullScreen(false);
                    await fullscreenLeftFuture;
                }
                window.win.setBounds(position);
            }
        }
        async updateWindowControls(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.updateWindowControls(options);
        }
        async focusWindow(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.focus({ force: options?.force ?? false });
        }
        async setMinimumSize(windowId, width, height) {
            const window = this.codeWindowById(windowId);
            if (window?.win) {
                const [windowWidth, windowHeight] = window.win.getSize();
                const [minWindowWidth, minWindowHeight] = window.win.getMinimumSize();
                const [newMinWindowWidth, newMinWindowHeight] = [width ?? minWindowWidth, height ?? minWindowHeight];
                const [newWindowWidth, newWindowHeight] = [Math.max(windowWidth, newMinWindowWidth), Math.max(windowHeight, newMinWindowHeight)];
                if (minWindowWidth !== newMinWindowWidth || minWindowHeight !== newMinWindowHeight) {
                    window.win.setMinimumSize(newMinWindowWidth, newMinWindowHeight);
                }
                if (windowWidth !== newWindowWidth || windowHeight !== newWindowHeight) {
                    window.win.setSize(newWindowWidth, newWindowHeight);
                }
            }
        }
        async saveWindowSplash(windowId, splash) {
            this.themeMainService.saveWindowSplash(windowId, splash);
        }
        //#endregion
        //#region macOS Shell Command
        async installShellCommand(windowId) {
            const { source, target } = await this.getShellCommandLink();
            // Only install unless already existing
            try {
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(source);
                if (symbolicLink && !symbolicLink.dangling) {
                    const linkTargetRealPath = await (0, extpath_1.realpath)(source);
                    if (target === linkTargetRealPath) {
                        return;
                    }
                }
                // Different source, delete it first
                await pfs_1.Promises.unlink(source);
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error; // throw on any error but file not found
                }
            }
            try {
                await pfs_1.Promises.symlink(target, source);
            }
            catch (error) {
                if (error.code !== 'EACCES' && error.code !== 'ENOENT') {
                    throw error;
                }
                const { response } = await this.showMessageBox(windowId, {
                    type: 'info',
                    message: (0, nls_1.localize)('warnEscalation', "{0} will now prompt with 'osascript' for Administrator privileges to install the shell command.", this.productService.nameShort),
                    buttons: [
                        (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                        (0, nls_1.localize)('cancel', "Cancel")
                    ]
                });
                if (response === 1 /* Cancel */) {
                    throw new errors_1.CancellationError();
                }
                try {
                    const command = `osascript -e "do shell script \\"mkdir -p /usr/local/bin && ln -sf \'${target}\' \'${source}\'\\" with administrator privileges"`;
                    await (0, util_1.promisify)(child_process_1.exec)(command);
                }
                catch (error) {
                    throw new Error((0, nls_1.localize)('cantCreateBinFolder', "Unable to install the shell command '{0}'.", source));
                }
            }
        }
        async uninstallShellCommand(windowId) {
            const { source } = await this.getShellCommandLink();
            try {
                await pfs_1.Promises.unlink(source);
            }
            catch (error) {
                switch (error.code) {
                    case 'EACCES': {
                        const { response } = await this.showMessageBox(windowId, {
                            type: 'info',
                            message: (0, nls_1.localize)('warnEscalationUninstall', "{0} will now prompt with 'osascript' for Administrator privileges to uninstall the shell command.", this.productService.nameShort),
                            buttons: [
                                (0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"),
                                (0, nls_1.localize)('cancel', "Cancel")
                            ]
                        });
                        if (response === 1 /* Cancel */) {
                            throw new errors_1.CancellationError();
                        }
                        try {
                            const command = `osascript -e "do shell script \\"rm \'${source}\'\\" with administrator privileges"`;
                            await (0, util_1.promisify)(child_process_1.exec)(command);
                        }
                        catch (error) {
                            throw new Error((0, nls_1.localize)('cantUninstall', "Unable to uninstall the shell command '{0}'.", source));
                        }
                        break;
                    }
                    case 'ENOENT':
                        break; // ignore file not found
                    default:
                        throw error;
                }
            }
        }
        async getShellCommandLink() {
            const target = (0, path_1.resolve)(this.environmentMainService.appRoot, 'bin', 'code');
            const source = `/usr/local/bin/${this.productService.applicationName}`;
            // Ensure source exists
            const sourceExists = await pfs_1.Promises.exists(target);
            if (!sourceExists) {
                throw new Error((0, nls_1.localize)('sourceMissing', "Unable to find shell script in '{0}'", target));
            }
            return { source, target };
        }
        //#endregion
        //#region Dialog
        async showMessageBox(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            return this.dialogMainService.showMessageBox(options, window?.win ?? undefined);
        }
        async showSaveDialog(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            return this.dialogMainService.showSaveDialog(options, window?.win ?? undefined);
        }
        async showOpenDialog(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            return this.dialogMainService.showOpenDialog(options, window?.win ?? undefined);
        }
        async pickFileFolderAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFileFolder(options);
            if (paths) {
                await this.doOpenPicked(await Promise.all(paths.map(async (path) => (await pfs_1.SymlinkSupport.existsDirectory(path)) ? { folderUri: uri_1.URI.file(path) } : { fileUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickFolderAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFolder(options);
            if (paths) {
                await this.doOpenPicked(paths.map(path => ({ folderUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickFileAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickFile(options);
            if (paths) {
                await this.doOpenPicked(paths.map(path => ({ fileUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async pickWorkspaceAndOpen(windowId, options) {
            const paths = await this.dialogMainService.pickWorkspace(options);
            if (paths) {
                await this.doOpenPicked(paths.map(path => ({ workspaceUri: uri_1.URI.file(path) })), options, windowId);
            }
        }
        async doOpenPicked(openable, options, windowId) {
            await this.windowsMainService.open({
                context: 3 /* OpenContext.DIALOG */,
                contextWindowId: windowId,
                cli: this.environmentMainService.args,
                urisToOpen: openable,
                forceNewWindow: options.forceNewWindow,
                /* remoteAuthority will be determined based on openable */
            });
        }
        //#endregion
        //#region OS
        async showItemInFolder(windowId, path) {
            electron_1.shell.showItemInFolder(path);
        }
        async setRepresentedFilename(windowId, path, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.setRepresentedFilename(path);
        }
        async setDocumentEdited(windowId, edited, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.setDocumentEdited(edited);
        }
        async openExternal(windowId, url) {
            this.environmentMainService.unsetSnapExportedVariables();
            electron_1.shell.openExternal(url);
            this.environmentMainService.restoreSnapExportedVariables();
            return true;
        }
        moveItemToTrash(windowId, fullPath) {
            return electron_1.shell.trashItem(fullPath);
        }
        async isAdmin() {
            let isAdmin;
            if (platform_1.isWindows) {
                isAdmin = (await new Promise((resolve_1, reject_1) => { require(['native-is-elevated'], resolve_1, reject_1); }))();
            }
            else {
                isAdmin = process.getuid?.() === 0;
            }
            return isAdmin;
        }
        async writeElevated(windowId, source, target, options) {
            const sudoPrompt = await new Promise((resolve_2, reject_2) => { require(['@vscode/sudo-prompt'], resolve_2, reject_2); });
            return new Promise((resolve, reject) => {
                const sudoCommand = [`"${this.cliPath}"`];
                if (options?.unlock) {
                    sudoCommand.push('--file-chmod');
                }
                sudoCommand.push('--file-write', `"${source.fsPath}"`, `"${target.fsPath}"`);
                const promptOptions = {
                    name: this.productService.nameLong.replace('-', ''),
                    icns: (platform_1.isMacintosh && this.environmentMainService.isBuilt) ? (0, path_1.join)((0, path_1.dirname)(this.environmentMainService.appRoot), `${this.productService.nameShort}.icns`) : undefined
                };
                sudoPrompt.exec(sudoCommand.join(' '), promptOptions, (error, stdout, stderr) => {
                    if (stdout) {
                        this.logService.trace(`[sudo-prompt] received stdout: ${stdout}`);
                    }
                    if (stderr) {
                        this.logService.trace(`[sudo-prompt] received stderr: ${stderr}`);
                    }
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(undefined);
                    }
                });
            });
        }
        async isRunningUnderARM64Translation() {
            if (platform_1.isLinux || platform_1.isWindows) {
                return false;
            }
            return electron_1.app.runningUnderARM64Translation;
        }
        get cliPath() {
            // Windows
            if (platform_1.isWindows) {
                if (this.environmentMainService.isBuilt) {
                    return (0, path_1.join)((0, path_1.dirname)(process.execPath), 'bin', `${this.productService.applicationName}.cmd`);
                }
                return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.bat');
            }
            // Linux
            if (platform_1.isLinux) {
                if (this.environmentMainService.isBuilt) {
                    return (0, path_1.join)((0, path_1.dirname)(process.execPath), 'bin', `${this.productService.applicationName}`);
                }
                return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.sh');
            }
            // macOS
            if (this.environmentMainService.isBuilt) {
                return (0, path_1.join)(this.environmentMainService.appRoot, 'bin', 'code');
            }
            return (0, path_1.join)(this.environmentMainService.appRoot, 'scripts', 'code-cli.sh');
        }
        async getOSStatistics() {
            return {
                totalmem: (0, os_1.totalmem)(),
                freemem: (0, os_1.freemem)(),
                loadavg: (0, os_1.loadavg)()
            };
        }
        async getOSProperties() {
            return {
                arch: (0, os_1.arch)(),
                platform: (0, os_1.platform)(),
                release: (0, os_1.release)(),
                type: (0, os_1.type)(),
                cpus: (0, os_1.cpus)()
            };
        }
        async getOSVirtualMachineHint() {
            return id_1.virtualMachineHint.value();
        }
        async getOSColorScheme() {
            return this.themeMainService.getColorScheme();
        }
        // WSL
        async hasWSLFeatureInstalled() {
            return platform_1.isWindows && (0, wsl_1.hasWSLFeatureInstalled)();
        }
        //#endregion
        //#region Process
        async killProcess(windowId, pid, code) {
            process.kill(pid, code);
        }
        //#endregion
        //#region Clipboard
        async readClipboardText(windowId, type) {
            return electron_1.clipboard.readText(type);
        }
        async writeClipboardText(windowId, text, type) {
            return electron_1.clipboard.writeText(text, type);
        }
        async readClipboardFindText(windowId) {
            return electron_1.clipboard.readFindText();
        }
        async writeClipboardFindText(windowId, text) {
            return electron_1.clipboard.writeFindText(text);
        }
        async writeClipboardBuffer(windowId, format, buffer, type) {
            return electron_1.clipboard.writeBuffer(format, Buffer.from(buffer.buffer), type);
        }
        async readClipboardBuffer(windowId, format) {
            return buffer_1.VSBuffer.wrap(electron_1.clipboard.readBuffer(format));
        }
        async hasClipboard(windowId, format, type) {
            return electron_1.clipboard.has(format, type);
        }
        //#endregion
        //#region macOS Touchbar
        async newWindowTab() {
            await this.windowsMainService.open({
                context: 5 /* OpenContext.API */,
                cli: this.environmentMainService.args,
                forceNewTabbedWindow: true,
                forceEmpty: true,
                remoteAuthority: this.environmentMainService.args.remote || undefined
            });
        }
        async showPreviousWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectPreviousTab:');
        }
        async showNextWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectNextTab:');
        }
        async moveWindowTabToNewWindow() {
            electron_1.Menu.sendActionToFirstResponder('moveTabToNewWindow:');
        }
        async mergeAllWindowTabs() {
            electron_1.Menu.sendActionToFirstResponder('mergeAllWindows:');
        }
        async toggleWindowTabsBar() {
            electron_1.Menu.sendActionToFirstResponder('toggleTabBar:');
        }
        async updateTouchBar(windowId, items) {
            const window = this.codeWindowById(windowId);
            window?.updateTouchBar(items);
        }
        //#endregion
        //#region Lifecycle
        async notifyReady(windowId) {
            const window = this.codeWindowById(windowId);
            window?.setReady();
        }
        async relaunch(windowId, options) {
            return this.lifecycleMainService.relaunch(options);
        }
        async reload(windowId, options) {
            const window = this.codeWindowById(windowId);
            if (window) {
                // Special case: support `transient` workspaces by preventing
                // the reload and rather go back to an empty window. Transient
                // workspaces should never restore, even when the user wants
                // to reload.
                // For: https://github.com/microsoft/vscode/issues/119695
                if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace)) {
                    const configPath = window.openedWorkspace.configPath;
                    if (configPath.scheme === network_1.Schemas.file) {
                        const workspace = await this.workspacesManagementMainService.resolveLocalWorkspace(configPath);
                        if (workspace?.transient) {
                            return this.openWindow(window.id, { forceReuseWindow: true });
                        }
                    }
                }
                // Proceed normally to reload the window
                return this.lifecycleMainService.reload(window, options?.disableExtensions !== undefined ? { _: [], 'disable-extensions': options.disableExtensions } : undefined);
            }
        }
        async closeWindow(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            return window?.win?.close();
        }
        async quit(windowId) {
            // If the user selected to exit from an extension development host window, do not quit, but just
            // close the window unless this is the last window that is opened.
            const window = this.windowsMainService.getLastActiveWindow();
            if (window?.isExtensionDevelopmentHost && this.windowsMainService.getWindowCount() > 1 && window.win) {
                window.win.close();
            }
            // Otherwise: normal quit
            else {
                this.lifecycleMainService.quit();
            }
        }
        async exit(windowId, code) {
            await this.lifecycleMainService.kill(code);
        }
        //#endregion
        //#region Connectivity
        async resolveProxy(windowId, url) {
            const window = this.codeWindowById(windowId);
            const session = window?.win?.webContents?.session;
            return session?.resolveProxy(url);
        }
        async loadCertificates(_windowId) {
            const proxyAgent = await new Promise((resolve_3, reject_3) => { require(['@vscode/proxy-agent'], resolve_3, reject_3); });
            return proxyAgent.loadSystemCertificates({ log: this.logService });
        }
        findFreePort(windowId, startPort, giveUpAfter, timeout, stride = 1) {
            return (0, ports_1.findFreePort)(startPort, giveUpAfter, timeout, stride);
        }
        //#endregion
        //#region Development
        async openDevTools(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.webContents.openDevTools(options?.mode ? { mode: options.mode, activate: options.activate } : undefined);
        }
        async toggleDevTools(windowId, options) {
            const window = this.windowById(options?.targetWindowId, windowId);
            window?.win?.webContents.toggleDevTools();
        }
        //#endregion
        // #region Performance
        async profileRenderer(windowId, session, duration) {
            const window = this.codeWindowById(windowId);
            if (!window || !window.win) {
                throw new Error();
            }
            const profiler = new windowProfiling_1.WindowProfiler(window.win, session, this.logService);
            const result = await profiler.inspect(duration);
            return result;
        }
        // #endregion
        //#region Registry (windows)
        async windowsGetStringRegKey(windowId, hive, path, name) {
            if (!platform_1.isWindows) {
                return undefined;
            }
            const Registry = await new Promise((resolve_4, reject_4) => { require(['@vscode/windows-registry'], resolve_4, reject_4); });
            try {
                return Registry.GetStringRegKey(hive, path, name);
            }
            catch {
                return undefined;
            }
        }
        //#endregion
        windowById(windowId, fallbackCodeWindowId) {
            return this.codeWindowById(windowId) ?? this.auxiliaryWindowById(windowId) ?? this.codeWindowById(fallbackCodeWindowId);
        }
        codeWindowById(windowId) {
            if (typeof windowId !== 'number') {
                return undefined;
            }
            return this.windowsMainService.getWindowById(windowId);
        }
        auxiliaryWindowById(windowId) {
            if (typeof windowId !== 'number') {
                return undefined;
            }
            return this.auxiliaryWindowsMainService.getWindowById(windowId);
        }
    };
    exports.NativeHostMainService = NativeHostMainService;
    __decorate([
        decorators_1.memoize
    ], NativeHostMainService.prototype, "cliPath", null);
    exports.NativeHostMainService = NativeHostMainService = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, auxiliaryWindows_1.IAuxiliaryWindowsMainService),
        __param(2, dialogMainService_1.IDialogMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, environmentMainService_1.IEnvironmentMainService),
        __param(5, log_1.ILogService),
        __param(6, productService_1.IProductService),
        __param(7, themeMainService_1.IThemeMainService),
        __param(8, workspacesManagementMainService_1.IWorkspacesManagementMainService)
    ], NativeHostMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlSG9zdE1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9uYXRpdmUvZWxlY3Ryb24tbWFpbi9uYXRpdmVIb3N0TWFpblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBNkNuRixRQUFBLHNCQUFzQixHQUFHLElBQUEsK0JBQWUsRUFBeUIsdUJBQXVCLENBQUMsQ0FBQztJQUVoRyxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBSXBELFlBQ3NCLGtCQUF3RCxFQUMvQywyQkFBMEUsRUFDcEYsaUJBQXNELEVBQ25ELG9CQUE0RCxFQUMxRCxzQkFBZ0UsRUFDNUUsVUFBd0MsRUFDcEMsY0FBZ0QsRUFDOUMsZ0JBQW9ELEVBQ3JDLCtCQUFrRjtZQUVwSCxLQUFLLEVBQUUsQ0FBQztZQVY4Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFDbkUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNsQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDM0QsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNwQixvQ0FBK0IsR0FBL0IsK0JBQStCLENBQWtDO1lBVXJILFlBQVk7WUFHWixnQkFBZ0I7WUFFUCx3QkFBbUIsR0FBRyxhQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENB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