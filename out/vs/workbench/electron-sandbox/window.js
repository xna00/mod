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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/errors", "vs/base/common/objects", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/platform/window/common/window", "vs/workbench/services/title/browser/titleService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/window/electron-sandbox/window", "vs/base/browser/browser", "vs/platform/commands/common/commands", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/integrity/common/integrity", "vs/base/common/platform", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/native/common/native", "vs/base/common/path", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/base/common/event", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/editor", "vs/platform/ipc/electron-sandbox/services", "vs/platform/progress/common/progress", "vs/base/common/errorMessage", "vs/platform/label/common/label", "vs/base/common/resources", "vs/workbench/services/banner/browser/bannerService", "vs/base/common/codicons", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/utilityProcess/electron-sandbox/utilityProcessWorkerWorkbenchService", "vs/workbench/services/driver/electron-sandbox/driver", "vs/base/browser/window", "vs/workbench/browser/window", "vs/workbench/services/host/browser/host", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/themables", "vs/workbench/common/contributions", "vs/workbench/common/configuration", "vs/platform/hover/browser/hover", "vs/css!./media/window"], function (require, exports, nls_1, uri_1, errors_1, objects_1, dom_1, actions_1, files_1, editor_1, editorService_1, telemetry_1, window_1, titleService_1, workbenchThemeService_1, window_2, browser_1, commands_1, globals_1, workspaceEditing_1, actions_2, menuEntryActionViewItem_1, async_1, lifecycle_1, lifecycle_2, integrity_1, platform_1, productService_1, notification_1, keybinding_1, environmentService_1, accessibility_1, workspace_1, arrays_1, configuration_1, storage_1, types_1, opener_1, network_1, native_1, path_1, tunnel_1, layoutService_1, workingCopyService_1, filesConfigurationService_1, event_1, remoteAuthorityResolver_1, editorGroupsService_1, dialogs_1, log_1, instantiation_1, editor_2, services_1, progress_1, errorMessage_1, label_1, resources_1, bannerService_1, codicons_1, uriIdentity_1, preferences_1, utilityProcessWorkerWorkbenchService_1, driver_1, window_3, window_4, host_1, statusbar_1, actionbar_1, themables_1, contributions_1, configuration_2, hover_1) {
    "use strict";
    var NativeWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWindow = void 0;
    let NativeWindow = NativeWindow_1 = class NativeWindow extends window_4.BaseWindow {
        constructor(editorService, editorGroupService, configurationService, titleService, themeService, notificationService, commandService, keybindingService, telemetryService, workspaceEditingService, fileService, menuService, lifecycleService, integrityService, nativeEnvironmentService, accessibilityService, contextService, openerService, nativeHostService, tunnelService, layoutService, workingCopyService, filesConfigurationService, productService, remoteAuthorityResolverService, dialogService, storageService, logService, instantiationService, sharedProcessService, progressService, labelService, bannerService, uriIdentityService, preferencesService, utilityProcessWorkerWorkbenchService, hostService) {
            super(window_3.mainWindow, undefined, hostService, nativeEnvironmentService);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.titleService = titleService;
            this.themeService = themeService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.workspaceEditingService = workspaceEditingService;
            this.fileService = fileService;
            this.menuService = menuService;
            this.lifecycleService = lifecycleService;
            this.integrityService = integrityService;
            this.nativeEnvironmentService = nativeEnvironmentService;
            this.accessibilityService = accessibilityService;
            this.contextService = contextService;
            this.openerService = openerService;
            this.nativeHostService = nativeHostService;
            this.tunnelService = tunnelService;
            this.layoutService = layoutService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.productService = productService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.logService = logService;
            this.instantiationService = instantiationService;
            this.sharedProcessService = sharedProcessService;
            this.progressService = progressService;
            this.labelService = labelService;
            this.bannerService = bannerService;
            this.uriIdentityService = uriIdentityService;
            this.preferencesService = preferencesService;
            this.utilityProcessWorkerWorkbenchService = utilityProcessWorkerWorkbenchService;
            this.customTitleContextMenuDisposable = this._register(new lifecycle_1.DisposableStore());
            this.addFoldersScheduler = this._register(new async_1.RunOnceScheduler(() => this.doAddFolders(), 100));
            this.pendingFoldersToAdd = [];
            this.isDocumentedEdited = false;
            this.touchBarDisposables = this._register(new lifecycle_1.DisposableStore());
            //#region Window Zoom
            this.mapWindowIdToZoomStatusEntry = new Map();
            this.configuredWindowZoomLevel = this.resolveConfiguredWindowZoomLevel();
            this.mainPartEditorService = editorService.createScoped('main', this._store);
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // Layout
            this._register((0, dom_1.addDisposableListener)(window_3.mainWindow, dom_1.EventType.RESIZE, () => this.layoutService.layout()));
            // React to editor input changes
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateTouchbarMenu()));
            // Prevent opening a real URL inside the window
            for (const event of [dom_1.EventType.DRAG_OVER, dom_1.EventType.DROP]) {
                this._register((0, dom_1.addDisposableListener)(window_3.mainWindow.document.body, event, (e) => {
                    dom_1.EventHelper.stop(e);
                }));
            }
            // Support `runAction` event
            globals_1.ipcRenderer.on('vscode:runAction', async (event, request) => {
                const args = request.args || [];
                // If we run an action from the touchbar, we fill in the currently active resource
                // as payload because the touch bar items are context aware depending on the editor
                if (request.from === 'touchbar') {
                    const activeEditor = this.editorService.activeEditor;
                    if (activeEditor) {
                        const resource = editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                        if (resource) {
                            args.push(resource);
                        }
                    }
                }
                else {
                    args.push({ from: request.from });
                }
                try {
                    await this.commandService.executeCommand(request.id, ...args);
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: request.id, from: request.from });
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            });
            // Support runKeybinding event
            globals_1.ipcRenderer.on('vscode:runKeybinding', (event, request) => {
                const activeElement = (0, dom_1.getActiveElement)();
                if (activeElement) {
                    this.keybindingService.dispatchByUserSettingsLabel(request.userSettingsLabel, activeElement);
                }
            });
            // Error reporting from main
            globals_1.ipcRenderer.on('vscode:reportError', (event, error) => {
                if (error) {
                    (0, errors_1.onUnexpectedError)(JSON.parse(error));
                }
            });
            // Support openFiles event for existing and new files
            globals_1.ipcRenderer.on('vscode:openFiles', (event, request) => { this.onOpenFiles(request); });
            // Support addFolders event if we have a workspace opened
            globals_1.ipcRenderer.on('vscode:addFolders', (event, request) => { this.onAddFoldersRequest(request); });
            // Message support
            globals_1.ipcRenderer.on('vscode:showInfoMessage', (event, message) => { this.notificationService.info(message); });
            // Shell Environment Issue Notifications
            globals_1.ipcRenderer.on('vscode:showResolveShellEnvError', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Error, message, [{
                        label: (0, nls_1.localize)('restart', "Restart"),
                        run: () => this.nativeHostService.relaunch()
                    },
                    {
                        label: (0, nls_1.localize)('configure', "Configure"),
                        run: () => this.preferencesService.openUserSettings({ query: 'application.shellEnvironmentResolutionTimeout' })
                    },
                    {
                        label: (0, nls_1.localize)('learnMore', "Learn More"),
                        run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2149667')
                    }]);
            });
            globals_1.ipcRenderer.on('vscode:showCredentialsError', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Error, (0, nls_1.localize)('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", message), [{
                        label: (0, nls_1.localize)('troubleshooting', "Troubleshooting Guide"),
                        run: () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2190713')
                    }]);
            });
            globals_1.ipcRenderer.on('vscode:showTranslatedBuildWarning', (event, message) => {
                this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)("runningTranslated", "You are running an emulated version of {0}. For better performance download the native arm64 version of {0} build for your machine.", this.productService.nameLong), [{
                        label: (0, nls_1.localize)('downloadArmBuild', "Download"),
                        run: () => {
                            const quality = this.productService.quality;
                            const stableURL = 'https://code.visualstudio.com/docs/?dv=osx';
                            const insidersURL = 'https://code.visualstudio.com/docs/?dv=osx&build=insiders';
                            this.openerService.open(quality === 'stable' ? stableURL : insidersURL);
                        }
                    }]);
            });
            // Fullscreen Events
            globals_1.ipcRenderer.on('vscode:enterFullScreen', async () => { (0, browser_1.setFullscreen)(true, window_3.mainWindow); });
            globals_1.ipcRenderer.on('vscode:leaveFullScreen', async () => { (0, browser_1.setFullscreen)(false, window_3.mainWindow); });
            // Proxy Login Dialog
            globals_1.ipcRenderer.on('vscode:openProxyAuthenticationDialog', async (event, payload) => {
                const rememberCredentialsKey = 'window.rememberProxyCredentials';
                const rememberCredentials = this.storageService.getBoolean(rememberCredentialsKey, -1 /* StorageScope.APPLICATION */);
                const result = await this.dialogService.input({
                    type: 'warning',
                    message: (0, nls_1.localize)('proxyAuthRequired', "Proxy Authentication Required"),
                    primaryButton: (0, nls_1.localize)({ key: 'loginButton', comment: ['&& denotes a mnemonic'] }, "&&Log In"),
                    inputs: [
                        { placeholder: (0, nls_1.localize)('username', "Username"), value: payload.username },
                        { placeholder: (0, nls_1.localize)('password', "Password"), type: 'password', value: payload.password }
                    ],
                    detail: (0, nls_1.localize)('proxyDetail', "The proxy {0} requires a username and password.", `${payload.authInfo.host}:${payload.authInfo.port}`),
                    checkbox: {
                        label: (0, nls_1.localize)('rememberCredentials', "Remember my credentials"),
                        checked: rememberCredentials
                    }
                });
                // Reply back to the channel without result to indicate
                // that the login dialog was cancelled
                if (!result.confirmed || !result.values) {
                    globals_1.ipcRenderer.send(payload.replyChannel);
                }
                // Other reply back with the picked credentials
                else {
                    // Update state based on checkbox
                    if (result.checkboxChecked) {
                        this.storageService.store(rememberCredentialsKey, true, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    }
                    else {
                        this.storageService.remove(rememberCredentialsKey, -1 /* StorageScope.APPLICATION */);
                    }
                    // Reply back to main side with credentials
                    const [username, password] = result.values;
                    globals_1.ipcRenderer.send(payload.replyChannel, { username, password, remember: !!result.checkboxChecked });
                }
            });
            // Accessibility support changed event
            globals_1.ipcRenderer.on('vscode:accessibilitySupportChanged', (event, accessibilitySupportEnabled) => {
                this.accessibilityService.setAccessibilitySupport(accessibilitySupportEnabled ? 2 /* AccessibilitySupport.Enabled */ : 1 /* AccessibilitySupport.Disabled */);
            });
            // Allow to update security settings around allowed UNC Host
            globals_1.ipcRenderer.on('vscode:configureAllowedUNCHost', async (event, host) => {
                if (!platform_1.isWindows) {
                    return; // only supported on Windows
                }
                const allowedUncHosts = new Set();
                const configuredAllowedUncHosts = this.configurationService.getValue('security.allowedUNCHosts') ?? [];
                if (Array.isArray(configuredAllowedUncHosts)) {
                    for (const configuredAllowedUncHost of configuredAllowedUncHosts) {
                        if (typeof configuredAllowedUncHost === 'string') {
                            allowedUncHosts.add(configuredAllowedUncHost);
                        }
                    }
                }
                if (!allowedUncHosts.has(host)) {
                    allowedUncHosts.add(host);
                    await (0, contributions_1.getWorkbenchContribution)(configuration_2.DynamicWorkbenchSecurityConfiguration.ID).ready; // ensure this setting is registered
                    this.configurationService.updateValue('security.allowedUNCHosts', [...allowedUncHosts.values()], 2 /* ConfigurationTarget.USER */);
                }
            });
            // Allow to update security settings around protocol handlers
            globals_1.ipcRenderer.on('vscode:disablePromptForProtocolHandling', (event, kind) => {
                const setting = kind === 'local' ? 'security.promptForLocalFileProtocolHandling' : 'security.promptForRemoteFileProtocolHandling';
                this.configurationService.updateValue(setting, false, 3 /* ConfigurationTarget.USER_LOCAL */);
            });
            // Window Zoom
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.zoomLevel') || (e.affectsConfiguration('window.zoomPerWindow') && this.configurationService.getValue('window.zoomPerWindow') === false)) {
                    this.onDidChangeConfiguredWindowZoomLevel();
                }
                else if (e.affectsConfiguration('keyboard.touchbar.enabled') || e.affectsConfiguration('keyboard.touchbar.ignored')) {
                    this.updateTouchbarMenu();
                }
            }));
            this._register((0, browser_1.onDidChangeZoomLevel)(targetWindowId => this.handleOnDidChangeZoomLevel(targetWindowId)));
            this._register(this.editorGroupService.onDidCreateAuxiliaryEditorPart(({ instantiationService, disposables, part }) => {
                this.createWindowZoomStatusEntry(instantiationService, part.windowId, disposables);
            }));
            // Listen to visible editor changes (debounced in case a new editor opens immediately after)
            this._register(event_1.Event.debounce(this.editorService.onDidVisibleEditorsChange, () => undefined, 0, undefined, undefined, undefined, this._store)(() => this.maybeCloseWindow()));
            // Listen to editor closing (if we run with --wait)
            const filesToWait = this.nativeEnvironmentService.filesToWait;
            if (filesToWait) {
                this.trackClosedWaitFiles(filesToWait.waitMarkerFileUri, (0, arrays_1.coalesce)(filesToWait.paths.map(path => path.fileUri)));
            }
            // macOS OS integration
            if (platform_1.isMacintosh) {
                const updateRepresentedFilename = (editorService, targetWindowId) => {
                    const file = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file });
                    // Represented Filename
                    this.nativeHostService.setRepresentedFilename(file?.fsPath ?? '', { targetWindowId });
                    // Custom title menu (main window only currently)
                    if (typeof targetWindowId !== 'number') {
                        this.provideCustomTitleContextMenu(file?.fsPath);
                    }
                };
                this._register(this.mainPartEditorService.onDidActiveEditorChange(() => updateRepresentedFilename(this.mainPartEditorService, undefined)));
                this._register(this.editorGroupService.onDidCreateAuxiliaryEditorPart(({ part, disposables }) => {
                    const auxiliaryEditorService = this.editorService.createScoped(part, disposables);
                    disposables.add(auxiliaryEditorService.onDidActiveEditorChange(() => updateRepresentedFilename(auxiliaryEditorService, part.windowId)));
                }));
            }
            // Maximize/Restore on doubleclick (for macOS custom title)
            if (platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidAddContainer, ({ container, disposables }) => {
                    const targetWindow = (0, dom_1.getWindow)(container);
                    const targetWindowId = targetWindow.vscodeWindowId;
                    const titlePart = (0, types_1.assertIsDefined)(this.layoutService.getContainer(targetWindow, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */));
                    disposables.add((0, dom_1.addDisposableListener)(titlePart, dom_1.EventType.DBLCLICK, e => {
                        dom_1.EventHelper.stop(e);
                        this.nativeHostService.handleTitleDoubleClick({ targetWindowId });
                    }));
                }, { container: this.layoutService.mainContainer, disposables: this._store }));
            }
            // Document edited: indicate for dirty working copies
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.hasShortAutoSaveDelay(workingCopy.resource)) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
                this.updateDocumentEdited(gotDirty ? true : undefined);
            }));
            this.updateDocumentEdited(undefined);
            // Detect minimize / maximize
            this._register(event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidMaximizeWindow, windowId => !!(0, dom_1.hasWindow)(windowId)), windowId => ({ maximized: true, windowId })), event_1.Event.map(event_1.Event.filter(this.nativeHostService.onDidUnmaximizeWindow, windowId => !!(0, dom_1.hasWindow)(windowId)), windowId => ({ maximized: false, windowId })))(e => this.layoutService.updateWindowMaximizedState((0, dom_1.getWindowById)(e.windowId).window, e.maximized)));
            this.layoutService.updateWindowMaximizedState(window_3.mainWindow, this.nativeEnvironmentService.window.maximized ?? false);
            // Detect panel position to determine minimum width
            this._register(this.layoutService.onDidChangePanelPosition(pos => this.onDidChangePanelPosition((0, layoutService_1.positionFromString)(pos))));
            this.onDidChangePanelPosition(this.layoutService.getPanelPosition());
            // Lifecycle
            this._register(this.lifecycleService.onBeforeShutdown(e => this.onBeforeShutdown(e)));
            this._register(this.lifecycleService.onBeforeShutdownError(e => this.onBeforeShutdownError(e)));
            this._register(this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e)));
        }
        //#region Window Lifecycle
        onBeforeShutdown({ veto, reason }) {
            if (reason === 1 /* ShutdownReason.CLOSE */) {
                const confirmBeforeCloseSetting = this.configurationService.getValue('window.confirmBeforeClose');
                const confirmBeforeClose = confirmBeforeCloseSetting === 'always' || (confirmBeforeCloseSetting === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed);
                if (confirmBeforeClose) {
                    // When we need to confirm on close or quit, veto the shutdown
                    // with a long running promise to figure out whether shutdown
                    // can proceed or not.
                    return veto((async () => {
                        let actualReason = reason;
                        if (reason === 1 /* ShutdownReason.CLOSE */ && !platform_1.isMacintosh) {
                            const windowCount = await this.nativeHostService.getWindowCount();
                            if (windowCount === 1) {
                                actualReason = 2 /* ShutdownReason.QUIT */; // Windows/Linux: closing last window means to QUIT
                            }
                        }
                        let confirmed = true;
                        if (confirmBeforeClose) {
                            confirmed = await this.instantiationService.invokeFunction(accessor => NativeWindow_1.confirmOnShutdown(accessor, actualReason));
                        }
                        // Progress for long running shutdown
                        if (confirmed) {
                            this.progressOnBeforeShutdown(reason);
                        }
                        return !confirmed;
                    })(), 'veto.confirmBeforeClose');
                }
            }
            // Progress for long running shutdown
            this.progressOnBeforeShutdown(reason);
        }
        progressOnBeforeShutdown(reason) {
            this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */, // use window progress to not be too annoying about this operation
                delay: 800, // delay so that it only appears when operation takes a long time
                title: this.toShutdownLabel(reason, false),
            }, () => {
                return event_1.Event.toPromise(event_1.Event.any(this.lifecycleService.onWillShutdown, // dismiss this dialog when we shutdown
                this.lifecycleService.onShutdownVeto, // or when shutdown was vetoed
                this.dialogService.onWillShowDialog // or when a dialog asks for input
                ));
            });
        }
        onBeforeShutdownError({ error, reason }) {
            this.dialogService.error(this.toShutdownLabel(reason, true), (0, nls_1.localize)('shutdownErrorDetail', "Error: {0}", (0, errorMessage_1.toErrorMessage)(error)));
        }
        onWillShutdown({ reason, force, joiners }) {
            // Delay so that the dialog only appears after timeout
            const shutdownDialogScheduler = new async_1.RunOnceScheduler(() => {
                const pendingJoiners = joiners();
                this.progressService.withProgress({
                    location: 20 /* ProgressLocation.Dialog */, // use a dialog to prevent the user from making any more interactions now
                    buttons: [this.toForceShutdownLabel(reason)], // allow to force shutdown anyway
                    cancellable: false, // do not allow to cancel
                    sticky: true, // do not allow to dismiss
                    title: this.toShutdownLabel(reason, false),
                    detail: pendingJoiners.length > 0 ? (0, nls_1.localize)('willShutdownDetail', "The following operations are still running: \n{0}", pendingJoiners.map(joiner => `- ${joiner.label}`).join('\n')) : undefined
                }, () => {
                    return event_1.Event.toPromise(this.lifecycleService.onDidShutdown); // dismiss this dialog when we actually shutdown
                }, () => {
                    force();
                });
            }, 1200);
            shutdownDialogScheduler.schedule();
            // Dispose scheduler when we actually shutdown
            event_1.Event.once(this.lifecycleService.onDidShutdown)(() => shutdownDialogScheduler.dispose());
        }
        toShutdownLabel(reason, isError) {
            if (isError) {
                switch (reason) {
                    case 1 /* ShutdownReason.CLOSE */:
                        return (0, nls_1.localize)('shutdownErrorClose', "An unexpected error prevented the window to close");
                    case 2 /* ShutdownReason.QUIT */:
                        return (0, nls_1.localize)('shutdownErrorQuit', "An unexpected error prevented the application to quit");
                    case 3 /* ShutdownReason.RELOAD */:
                        return (0, nls_1.localize)('shutdownErrorReload', "An unexpected error prevented the window to reload");
                    case 4 /* ShutdownReason.LOAD */:
                        return (0, nls_1.localize)('shutdownErrorLoad', "An unexpected error prevented to change the workspace");
                }
            }
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownTitleClose', "Closing the window is taking a bit longer...");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownTitleQuit', "Quitting the application is taking a bit longer...");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownTitleReload', "Reloading the window is taking a bit longer...");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownTitleLoad', "Changing the workspace is taking a bit longer...");
            }
        }
        toForceShutdownLabel(reason) {
            switch (reason) {
                case 1 /* ShutdownReason.CLOSE */:
                    return (0, nls_1.localize)('shutdownForceClose', "Close Anyway");
                case 2 /* ShutdownReason.QUIT */:
                    return (0, nls_1.localize)('shutdownForceQuit', "Quit Anyway");
                case 3 /* ShutdownReason.RELOAD */:
                    return (0, nls_1.localize)('shutdownForceReload', "Reload Anyway");
                case 4 /* ShutdownReason.LOAD */:
                    return (0, nls_1.localize)('shutdownForceLoad', "Change Anyway");
            }
        }
        //#endregion
        updateDocumentEdited(documentEdited) {
            let setDocumentEdited;
            if (typeof documentEdited === 'boolean') {
                setDocumentEdited = documentEdited;
            }
            else {
                setDocumentEdited = this.workingCopyService.hasDirty;
            }
            if ((!this.isDocumentedEdited && setDocumentEdited) || (this.isDocumentedEdited && !setDocumentEdited)) {
                this.isDocumentedEdited = setDocumentEdited;
                this.nativeHostService.setDocumentEdited(setDocumentEdited);
            }
        }
        getWindowMinimumWidth(panelPosition = this.layoutService.getPanelPosition()) {
            // if panel is on the side, then return the larger minwidth
            const panelOnSide = panelPosition === 0 /* Position.LEFT */ || panelPosition === 1 /* Position.RIGHT */;
            if (panelOnSide) {
                return window_1.WindowMinimumSize.WIDTH_WITH_VERTICAL_PANEL;
            }
            return window_1.WindowMinimumSize.WIDTH;
        }
        onDidChangePanelPosition(pos) {
            const minWidth = this.getWindowMinimumWidth(pos);
            this.nativeHostService.setMinimumSize(minWidth, undefined);
        }
        maybeCloseWindow() {
            const closeWhenEmpty = this.configurationService.getValue('window.closeWhenEmpty') || this.nativeEnvironmentService.args.wait;
            if (!closeWhenEmpty) {
                return; // return early if configured to not close when empty
            }
            // Close empty editor groups based on setting and environment
            for (const editorPart of this.editorGroupService.parts) {
                if (editorPart.groups.some(group => !group.isEmpty)) {
                    continue; // not empty
                }
                if (editorPart === this.editorGroupService.mainPart && (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ || // only for empty windows
                    this.environmentService.isExtensionDevelopment || // not when developing an extension
                    this.editorService.visibleEditors.length > 0 // not when there are still editors open in other windows
                )) {
                    continue;
                }
                if (editorPart === this.editorGroupService.mainPart) {
                    this.nativeHostService.closeWindow();
                }
                else {
                    editorPart.removeGroup(editorPart.activeGroup);
                }
            }
        }
        provideCustomTitleContextMenu(filePath) {
            // Clear old menu
            this.customTitleContextMenuDisposable.clear();
            // Provide new menu if a file is opened and we are on a custom title
            if (!filePath || !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                return;
            }
            // Split up filepath into segments
            const segments = filePath.split(path_1.posix.sep);
            for (let i = segments.length; i > 0; i--) {
                const isFile = (i === segments.length);
                let pathOffset = i;
                if (!isFile) {
                    pathOffset++; // for segments which are not the file name we want to open the folder
                }
                const path = uri_1.URI.file(segments.slice(0, pathOffset).join(path_1.posix.sep));
                let label;
                if (!isFile) {
                    label = this.labelService.getUriBasenameLabel((0, resources_1.dirname)(path));
                }
                else {
                    label = this.labelService.getUriBasenameLabel(path);
                }
                const commandId = `workbench.action.revealPathInFinder${i}`;
                this.customTitleContextMenuDisposable.add(commands_1.CommandsRegistry.registerCommand(commandId, () => this.nativeHostService.showItemInFolder(path.fsPath)));
                this.customTitleContextMenuDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TitleBarTitleContext, { command: { id: commandId, title: label || path_1.posix.sep }, order: -i, group: '1_file' }));
            }
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Notify some services about lifecycle phases
            this.lifecycleService.when(2 /* LifecyclePhase.Ready */).then(() => this.nativeHostService.notifyReady());
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                this.sharedProcessService.notifyRestored();
                this.utilityProcessWorkerWorkbenchService.notifyRestored();
            });
            // Check for situations that are worth warning the user about
            this.handleWarnings();
            // Touchbar menu (if enabled)
            this.updateTouchbarMenu();
            // Zoom status
            for (const { window, disposables } of (0, dom_1.getWindows)()) {
                this.createWindowZoomStatusEntry(this.instantiationService, window.vscodeWindowId, disposables);
            }
            // Smoke Test Driver
            if (this.environmentService.enableSmokeTestDriver) {
                this.setupDriver();
            }
        }
        async handleWarnings() {
            // Check for cyclic dependencies
            if (typeof require.hasDependencyCycle === 'function' && require.hasDependencyCycle()) {
                if (platform_1.isCI) {
                    this.logService.error('Error: There is a dependency cycle in the AMD modules that needs to be resolved!');
                    this.nativeHostService.exit(37); // running on a build machine, just exit without showing a dialog
                }
                else {
                    this.dialogService.error((0, nls_1.localize)('loaderCycle', "There is a dependency cycle in the AMD modules that needs to be resolved!"));
                    this.nativeHostService.openDevTools();
                }
            }
            // After restored phase is fine for the following ones
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Integrity / Root warning
            (async () => {
                const isAdmin = await this.nativeHostService.isAdmin();
                const { isPure } = await this.integrityService.isPure();
                // Update to title
                this.titleService.updateProperties({ isPure, isAdmin });
                // Show warning message (unix only)
                if (isAdmin && !platform_1.isWindows) {
                    this.notificationService.warn((0, nls_1.localize)('runningAsRoot', "It is not recommended to run {0} as root user.", this.productService.nameShort));
                }
            })();
            // Installation Dir Warning
            if (this.environmentService.isBuilt) {
                let installLocationUri;
                if (platform_1.isMacintosh) {
                    // appRoot = /Applications/Visual Studio Code - Insiders.app/Contents/Resources/app
                    installLocationUri = (0, resources_1.dirname)((0, resources_1.dirname)((0, resources_1.dirname)(uri_1.URI.file(this.nativeEnvironmentService.appRoot))));
                }
                else {
                    // appRoot = C:\Users\<name>\AppData\Local\Programs\Microsoft VS Code Insiders\resources\app
                    // appRoot = /usr/share/code-insiders/resources/app
                    installLocationUri = (0, resources_1.dirname)((0, resources_1.dirname)(uri_1.URI.file(this.nativeEnvironmentService.appRoot)));
                }
                for (const folder of this.contextService.getWorkspace().folders) {
                    if (this.uriIdentityService.extUri.isEqualOrParent(folder.uri, installLocationUri)) {
                        this.bannerService.show({
                            id: 'appRootWarning.banner',
                            message: (0, nls_1.localize)('appRootWarning.banner', "Files you store within the installation folder ('{0}') may be OVERWRITTEN or DELETED IRREVERSIBLY without warning at update time.", this.labelService.getUriLabel(installLocationUri)),
                            icon: codicons_1.Codicon.warning
                        });
                        break;
                    }
                }
            }
            // macOS 10.13 and 10.14 warning
            if (platform_1.isMacintosh) {
                const majorVersion = this.nativeEnvironmentService.os.release.split('.')[0];
                const eolReleases = new Map([
                    ['17', 'macOS High Sierra'],
                    ['18', 'macOS Mojave'],
                ]);
                if (eolReleases.has(majorVersion)) {
                    const message = (0, nls_1.localize)('macoseolmessage', "{0} on {1} will soon stop receiving updates. Consider upgrading your macOS version.", this.productService.nameLong, eolReleases.get(majorVersion));
                    this.notificationService.prompt(notification_1.Severity.Warning, message, [{
                            label: (0, nls_1.localize)('learnMore', "Learn More"),
                            run: () => this.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-faq-old-macOS'))
                        }], {
                        neverShowAgain: { id: 'macoseol', isSecondary: true, scope: notification_1.NeverShowAgainScope.APPLICATION },
                        priority: notification_1.NotificationPriority.URGENT,
                        sticky: true
                    });
                }
            }
            // Slow shell environment progress indicator
            const shellEnv = globals_1.process.shellEnv();
            this.progressService.withProgress({
                title: (0, nls_1.localize)('resolveShellEnvironment', "Resolving shell environment..."),
                location: 10 /* ProgressLocation.Window */,
                delay: 1600,
                buttons: [(0, nls_1.localize)('learnMore', "Learn More")]
            }, () => shellEnv, () => this.openerService.open('https://go.microsoft.com/fwlink/?linkid=2149667'));
        }
        setupDriver() {
            const that = this;
            let pendingQuit = false;
            (0, driver_1.registerWindowDriver)(this.instantiationService, {
                async exitApplication() {
                    if (pendingQuit) {
                        that.logService.info('[driver] not handling exitApplication() due to pending quit() call');
                        return;
                    }
                    that.logService.info('[driver] handling exitApplication()');
                    pendingQuit = true;
                    return that.nativeHostService.quit();
                }
            });
        }
        async openTunnel(address, port) {
            const remoteAuthority = this.environmentService.remoteAuthority;
            const addressProvider = remoteAuthority ? {
                getAddress: async () => {
                    return (await this.remoteAuthorityResolverService.resolveAuthority(remoteAuthority)).authority;
                }
            } : undefined;
            const tunnel = await this.tunnelService.getExistingTunnel(address, port);
            if (!tunnel || (typeof tunnel === 'string')) {
                return this.tunnelService.openTunnel(addressProvider, address, port);
            }
            return tunnel;
        }
        async resolveExternalUri(uri, options) {
            let queryTunnel;
            if (options?.allowTunneling) {
                const portMappingRequest = (0, tunnel_1.extractLocalHostUriMetaDataForPortMapping)(uri);
                const queryPortMapping = (0, tunnel_1.extractQueryLocalHostUriMetaDataForPortMapping)(uri);
                if (queryPortMapping) {
                    queryTunnel = await this.openTunnel(queryPortMapping.address, queryPortMapping.port);
                    if (queryTunnel && (typeof queryTunnel !== 'string')) {
                        // If the tunnel was mapped to a different port, dispose it, because some services
                        // validate the port number in the query string.
                        if (queryTunnel.tunnelRemotePort !== queryPortMapping.port) {
                            queryTunnel.dispose();
                            queryTunnel = undefined;
                        }
                        else {
                            if (!portMappingRequest) {
                                const tunnel = queryTunnel;
                                return {
                                    resolved: uri,
                                    dispose: () => tunnel.dispose()
                                };
                            }
                        }
                    }
                }
                if (portMappingRequest) {
                    const tunnel = await this.openTunnel(portMappingRequest.address, portMappingRequest.port);
                    if (tunnel && (typeof tunnel !== 'string')) {
                        const addressAsUri = uri_1.URI.parse(tunnel.localAddress);
                        const resolved = addressAsUri.scheme.startsWith(uri.scheme) ? addressAsUri : uri.with({ authority: tunnel.localAddress });
                        return {
                            resolved,
                            dispose() {
                                tunnel.dispose();
                                if (queryTunnel && (typeof queryTunnel !== 'string')) {
                                    queryTunnel.dispose();
                                }
                            }
                        };
                    }
                }
            }
            if (!options?.openExternal) {
                const canHandleResource = await this.fileService.canHandleResource(uri);
                if (canHandleResource) {
                    return {
                        resolved: uri_1.URI.from({
                            scheme: this.productService.urlProtocol,
                            path: 'workspace',
                            query: uri.toString()
                        }),
                        dispose() { }
                    };
                }
            }
            return undefined;
        }
        setupOpenHandlers() {
            // Handle external open() calls
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    const success = await this.nativeHostService.openExternal(href);
                    if (!success) {
                        const fileCandidate = uri_1.URI.parse(href);
                        if (fileCandidate.scheme === network_1.Schemas.file) {
                            // if opening failed, and this is a file, we can still try to reveal it
                            await this.nativeHostService.showItemInFolder(fileCandidate.fsPath);
                        }
                    }
                    return true;
                }
            });
            // Register external URI resolver
            this.openerService.registerExternalUriResolver({
                resolveExternalUri: async (uri, options) => {
                    return this.resolveExternalUri(uri, options);
                }
            });
        }
        updateTouchbarMenu() {
            if (!platform_1.isMacintosh) {
                return; // macOS only
            }
            // Dispose old
            this.touchBarDisposables.clear();
            this.touchBarMenu = undefined;
            // Create new (delayed)
            const scheduler = this.touchBarDisposables.add(new async_1.RunOnceScheduler(() => this.doUpdateTouchbarMenu(scheduler), 300));
            scheduler.schedule();
        }
        doUpdateTouchbarMenu(scheduler) {
            if (!this.touchBarMenu) {
                const scopedContextKeyService = this.editorService.activeEditorPane?.scopedContextKeyService || this.editorGroupService.activeGroup.scopedContextKeyService;
                this.touchBarMenu = this.menuService.createMenu(actions_2.MenuId.TouchBarContext, scopedContextKeyService);
                this.touchBarDisposables.add(this.touchBarMenu);
                this.touchBarDisposables.add(this.touchBarMenu.onDidChange(() => scheduler.schedule()));
            }
            const actions = [];
            const disabled = this.configurationService.getValue('keyboard.touchbar.enabled') === false;
            const touchbarIgnored = this.configurationService.getValue('keyboard.touchbar.ignored');
            const ignoredItems = Array.isArray(touchbarIgnored) ? touchbarIgnored : [];
            // Fill actions into groups respecting order
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.touchBarMenu, undefined, actions);
            // Convert into command action multi array
            const items = [];
            let group = [];
            if (!disabled) {
                for (const action of actions) {
                    // Command
                    if (action instanceof actions_2.MenuItemAction) {
                        if (ignoredItems.indexOf(action.item.id) >= 0) {
                            continue; // ignored
                        }
                        group.push(action.item);
                    }
                    // Separator
                    else if (action instanceof actions_1.Separator) {
                        if (group.length) {
                            items.push(group);
                        }
                        group = [];
                    }
                }
                if (group.length) {
                    items.push(group);
                }
            }
            // Only update if the actions have changed
            if (!(0, objects_1.equals)(this.lastInstalledTouchedBar, items)) {
                this.lastInstalledTouchedBar = items;
                this.nativeHostService.updateTouchBar(items);
            }
        }
        //#endregion
        onAddFoldersRequest(request) {
            // Buffer all pending requests
            this.pendingFoldersToAdd.push(...request.foldersToAdd.map(folder => uri_1.URI.revive(folder)));
            // Delay the adding of folders a bit to buffer in case more requests are coming
            if (!this.addFoldersScheduler.isScheduled()) {
                this.addFoldersScheduler.schedule();
            }
        }
        doAddFolders() {
            const foldersToAdd = [];
            for (const folder of this.pendingFoldersToAdd) {
                foldersToAdd.push(({ uri: folder }));
            }
            this.pendingFoldersToAdd = [];
            this.workspaceEditingService.addFolders(foldersToAdd);
        }
        async onOpenFiles(request) {
            const diffMode = !!(request.filesToDiff && (request.filesToDiff.length === 2));
            const mergeMode = !!(request.filesToMerge && (request.filesToMerge.length === 4));
            const inputs = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(mergeMode ? request.filesToMerge : diffMode ? request.filesToDiff : request.filesToOpenOrCreate, this.fileService, this.logService));
            if (inputs.length) {
                const openedEditorPanes = await this.openResources(inputs, diffMode, mergeMode);
                if (request.filesToWait) {
                    // In wait mode, listen to changes to the editors and wait until the files
                    // are closed that the user wants to wait for. When this happens we delete
                    // the wait marker file to signal to the outside that editing is done.
                    // However, it is possible that opening of the editors failed, as such we
                    // check for whether editor panes got opened and otherwise delete the marker
                    // right away.
                    if (openedEditorPanes.length) {
                        return this.trackClosedWaitFiles(uri_1.URI.revive(request.filesToWait.waitMarkerFileUri), (0, arrays_1.coalesce)(request.filesToWait.paths.map(path => uri_1.URI.revive(path.fileUri))));
                    }
                    else {
                        return this.fileService.del(uri_1.URI.revive(request.filesToWait.waitMarkerFileUri));
                    }
                }
            }
        }
        async trackClosedWaitFiles(waitMarkerFile, resourcesToWaitFor) {
            // Wait for the resources to be closed in the text editor...
            await this.instantiationService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, resourcesToWaitFor));
            // ...before deleting the wait marker file
            await this.fileService.del(waitMarkerFile);
        }
        async openResources(resources, diffMode, mergeMode) {
            const editors = [];
            if (mergeMode && (0, editor_1.isResourceEditorInput)(resources[0]) && (0, editor_1.isResourceEditorInput)(resources[1]) && (0, editor_1.isResourceEditorInput)(resources[2]) && (0, editor_1.isResourceEditorInput)(resources[3])) {
                const mergeEditor = {
                    input1: { resource: resources[0].resource },
                    input2: { resource: resources[1].resource },
                    base: { resource: resources[2].resource },
                    result: { resource: resources[3].resource },
                    options: { pinned: true }
                };
                editors.push(mergeEditor);
            }
            else if (diffMode && (0, editor_1.isResourceEditorInput)(resources[0]) && (0, editor_1.isResourceEditorInput)(resources[1])) {
                const diffEditor = {
                    original: { resource: resources[0].resource },
                    modified: { resource: resources[1].resource },
                    options: { pinned: true }
                };
                editors.push(diffEditor);
            }
            else {
                editors.push(...resources);
            }
            return this.editorService.openEditors(editors, undefined, { validateTrust: true });
        }
        resolveConfiguredWindowZoomLevel() {
            const windowZoomLevel = this.configurationService.getValue('window.zoomLevel');
            return typeof windowZoomLevel === 'number' ? windowZoomLevel : 0;
        }
        handleOnDidChangeZoomLevel(targetWindowId) {
            // Zoom status entry
            this.updateWindowZoomStatusEntry(targetWindowId);
            // Notify main process about a custom zoom level
            if (targetWindowId === window_3.mainWindow.vscodeWindowId) {
                const currentWindowZoomLevel = (0, browser_1.getZoomLevel)(window_3.mainWindow);
                let notifyZoomLevel = undefined;
                if (this.configuredWindowZoomLevel !== currentWindowZoomLevel) {
                    notifyZoomLevel = currentWindowZoomLevel;
                }
                globals_1.ipcRenderer.invoke('vscode:notifyZoomLevel', notifyZoomLevel);
            }
        }
        createWindowZoomStatusEntry(instantiationService, targetWindowId, disposables) {
            this.mapWindowIdToZoomStatusEntry.set(targetWindowId, disposables.add(instantiationService.createInstance(ZoomStatusEntry)));
            disposables.add((0, lifecycle_1.toDisposable)(() => this.mapWindowIdToZoomStatusEntry.delete(targetWindowId)));
            this.updateWindowZoomStatusEntry(targetWindowId);
        }
        updateWindowZoomStatusEntry(targetWindowId) {
            const targetWindow = (0, dom_1.getWindowById)(targetWindowId);
            const entry = this.mapWindowIdToZoomStatusEntry.get(targetWindowId);
            if (entry && targetWindow) {
                const currentZoomLevel = (0, browser_1.getZoomLevel)(targetWindow.window);
                let text = undefined;
                if (currentZoomLevel < this.configuredWindowZoomLevel) {
                    text = '$(zoom-out)';
                }
                else if (currentZoomLevel > this.configuredWindowZoomLevel) {
                    text = '$(zoom-in)';
                }
                entry.updateZoomEntry(text ?? false, targetWindowId);
            }
        }
        onDidChangeConfiguredWindowZoomLevel() {
            this.configuredWindowZoomLevel = this.resolveConfiguredWindowZoomLevel();
            let applyZoomLevel = false;
            for (const { window } of (0, dom_1.getWindows)()) {
                if ((0, browser_1.getZoomLevel)(window) !== this.configuredWindowZoomLevel) {
                    applyZoomLevel = true;
                    break;
                }
            }
            if (applyZoomLevel) {
                (0, window_2.applyZoom)(this.configuredWindowZoomLevel, window_2.ApplyZoomTarget.ALL_WINDOWS);
            }
            for (const [windowId] of this.mapWindowIdToZoomStatusEntry) {
                this.updateWindowZoomStatusEntry(windowId);
            }
        }
        //#endregion
        dispose() {
            super.dispose();
            for (const [, entry] of this.mapWindowIdToZoomStatusEntry) {
                entry.dispose();
            }
        }
    };
    exports.NativeWindow = NativeWindow;
    exports.NativeWindow = NativeWindow = NativeWindow_1 = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, titleService_1.ITitleService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, notification_1.INotificationService),
        __param(6, commands_1.ICommandService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, workspaceEditing_1.IWorkspaceEditingService),
        __param(10, files_1.IFileService),
        __param(11, actions_2.IMenuService),
        __param(12, lifecycle_2.ILifecycleService),
        __param(13, integrity_1.IIntegrityService),
        __param(14, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(15, accessibility_1.IAccessibilityService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, opener_1.IOpenerService),
        __param(18, native_1.INativeHostService),
        __param(19, tunnel_1.ITunnelService),
        __param(20, layoutService_1.IWorkbenchLayoutService),
        __param(21, workingCopyService_1.IWorkingCopyService),
        __param(22, filesConfigurationService_1.IFilesConfigurationService),
        __param(23, productService_1.IProductService),
        __param(24, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(25, dialogs_1.IDialogService),
        __param(26, storage_1.IStorageService),
        __param(27, log_1.ILogService),
        __param(28, instantiation_1.IInstantiationService),
        __param(29, services_1.ISharedProcessService),
        __param(30, progress_1.IProgressService),
        __param(31, label_1.ILabelService),
        __param(32, bannerService_1.IBannerService),
        __param(33, uriIdentity_1.IUriIdentityService),
        __param(34, preferences_1.IPreferencesService),
        __param(35, utilityProcessWorkerWorkbenchService_1.IUtilityProcessWorkerWorkbenchService),
        __param(36, host_1.IHostService)
    ], NativeWindow);
    let ZoomStatusEntry = class ZoomStatusEntry extends lifecycle_1.Disposable {
        constructor(statusbarService, commandService, keybindingService) {
            super();
            this.statusbarService = statusbarService;
            this.commandService = commandService;
            this.keybindingService = keybindingService;
            this.disposable = this._register(new lifecycle_1.MutableDisposable());
            this.zoomLevelLabel = undefined;
        }
        updateZoomEntry(visibleOrText, targetWindowId) {
            if (typeof visibleOrText === 'string') {
                if (!this.disposable.value) {
                    this.createZoomEntry(targetWindowId, visibleOrText);
                }
                this.updateZoomLevelLabel(targetWindowId);
            }
            else {
                this.disposable.clear();
            }
        }
        createZoomEntry(targetWindowId, visibleOrText) {
            const disposables = new lifecycle_1.DisposableStore();
            this.disposable.value = disposables;
            const container = document.createElement('div');
            container.classList.add('zoom-status');
            const left = document.createElement('div');
            left.classList.add('zoom-status-left');
            container.appendChild(left);
            const zoomOutAction = disposables.add(new actions_1.Action('workbench.action.zoomOut', (0, nls_1.localize)('zoomOut', "Zoom Out"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.remove), true, () => this.commandService.executeCommand(zoomOutAction.id)));
            const zoomInAction = disposables.add(new actions_1.Action('workbench.action.zoomIn', (0, nls_1.localize)('zoomIn', "Zoom In"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.plus), true, () => this.commandService.executeCommand(zoomInAction.id)));
            const zoomResetAction = disposables.add(new actions_1.Action('workbench.action.zoomReset', (0, nls_1.localize)('zoomReset', "Reset"), undefined, true, () => this.commandService.executeCommand(zoomResetAction.id)));
            zoomResetAction.tooltip = (0, nls_1.localize)('zoomResetLabel', "{0} ({1})", zoomResetAction.label, this.keybindingService.lookupKeybinding(zoomResetAction.id)?.getLabel());
            const zoomSettingsAction = disposables.add(new actions_1.Action('workbench.action.openSettings', (0, nls_1.localize)('zoomSettings', "Settings"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.settingsGear), true, () => this.commandService.executeCommand(zoomSettingsAction.id, 'window.zoom')));
            const zoomLevelLabel = disposables.add(new actions_1.Action('zoomLabel', undefined, undefined, false));
            this.zoomLevelLabel = zoomLevelLabel;
            disposables.add((0, lifecycle_1.toDisposable)(() => this.zoomLevelLabel = undefined));
            const actionBarLeft = disposables.add(new actionbar_1.ActionBar(left, { hoverDelegate: hover_1.nativeHoverDelegate }));
            actionBarLeft.push(zoomOutAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomOutAction.id)?.getLabel() });
            actionBarLeft.push(this.zoomLevelLabel, { icon: false, label: true });
            actionBarLeft.push(zoomInAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomInAction.id)?.getLabel() });
            const right = document.createElement('div');
            right.classList.add('zoom-status-right');
            container.appendChild(right);
            const actionBarRight = disposables.add(new actionbar_1.ActionBar(right, { hoverDelegate: hover_1.nativeHoverDelegate }));
            actionBarRight.push(zoomResetAction, { icon: false, label: true });
            actionBarRight.push(zoomSettingsAction, { icon: true, label: false, keybinding: this.keybindingService.lookupKeybinding(zoomSettingsAction.id)?.getLabel() });
            const name = (0, nls_1.localize)('status.windowZoom', "Window Zoom");
            disposables.add(this.statusbarService.addEntry({
                name,
                text: visibleOrText,
                tooltip: container,
                ariaLabel: name,
                command: statusbar_1.ShowTooltipCommand,
                kind: 'prominent'
            }, 'status.windowZoom', 1 /* StatusbarAlignment.RIGHT */, 102));
        }
        updateZoomLevelLabel(targetWindowId) {
            if (this.zoomLevelLabel) {
                const targetWindow = (0, dom_1.getWindowById)(targetWindowId, true).window;
                const zoomFactor = Math.round((0, browser_1.getZoomFactor)(targetWindow) * 100);
                const zoomLevel = (0, browser_1.getZoomLevel)(targetWindow);
                this.zoomLevelLabel.label = `${zoomLevel}`;
                this.zoomLevelLabel.tooltip = (0, nls_1.localize)('zoomNumber', "Zoom Level: {0} ({1}%)", zoomLevel, zoomFactor);
            }
        }
    };
    ZoomStatusEntry = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, commands_1.ICommandService),
        __param(2, keybinding_1.IKeybindingService)
    ], ZoomStatusEntry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvZWxlY3Ryb24tc2FuZGJveC93aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWdGekYsSUFBTSxZQUFZLG9CQUFsQixNQUFNLFlBQWEsU0FBUSxtQkFBVTtRQVczQyxZQUNpQixhQUE4QyxFQUN4QyxrQkFBeUQsRUFDeEQsb0JBQTRELEVBQ3BFLFlBQTRDLEVBQ25DLFlBQThDLEVBQ2hELG1CQUEwRCxFQUMvRCxjQUFnRCxFQUM3QyxpQkFBc0QsRUFDdkQsZ0JBQW9ELEVBQzdDLHVCQUFrRSxFQUM5RSxXQUEwQyxFQUMxQyxXQUEwQyxFQUNyQyxnQkFBb0QsRUFDcEQsZ0JBQW9ELEVBQ25DLHdCQUE2RSxFQUMxRixvQkFBNEQsRUFDekQsY0FBeUQsRUFDbkUsYUFBOEMsRUFDMUMsaUJBQXNELEVBQzFELGFBQThDLEVBQ3JDLGFBQXVELEVBQzNELGtCQUF3RCxFQUNqRCx5QkFBc0UsRUFDakYsY0FBZ0QsRUFDaEMsOEJBQWdGLEVBQ2pHLGFBQThDLEVBQzdDLGNBQWdELEVBQ3BELFVBQXdDLEVBQzlCLG9CQUE0RCxFQUM1RCxvQkFBNEQsRUFDakUsZUFBa0QsRUFDckQsWUFBNEMsRUFDM0MsYUFBOEMsRUFDekMsa0JBQXdELEVBQ3hELGtCQUF3RCxFQUN0QyxvQ0FBNEYsRUFDckgsV0FBeUI7WUFFdkMsS0FBSyxDQUFDLG1CQUFVLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBdENuQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFzQjtZQUN2Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFB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