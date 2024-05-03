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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/window/common/window", "vs/workbench/common/editor", "vs/workbench/browser/editor", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/decorators", "vs/base/common/extpath", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/log/common/log", "vs/workbench/services/workspaces/browser/workspaces", "vs/nls", "vs/base/common/severity", "vs/platform/dialogs/common/dialogs", "vs/base/browser/event", "vs/base/common/types", "vs/platform/workspace/common/workspace", "vs/base/common/network", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/arrays", "vs/base/browser/window", "vs/base/common/platform"], function (require, exports, event_1, host_1, extensions_1, layoutService_1, editorService_1, configuration_1, window_1, editor_1, editor_2, files_1, label_1, dom_1, lifecycle_1, environmentService_1, decorators_1, extpath_1, workspaceEditing_1, instantiation_1, lifecycle_2, log_1, workspaces_1, nls_1, severity_1, dialogs_1, event_2, types_1, workspace_1, network_1, userDataProfile_1, arrays_1, window_2, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostService = void 0;
    var HostShutdownReason;
    (function (HostShutdownReason) {
        /**
         * An unknown shutdown reason.
         */
        HostShutdownReason[HostShutdownReason["Unknown"] = 1] = "Unknown";
        /**
         * A shutdown that was potentially triggered by keyboard use.
         */
        HostShutdownReason[HostShutdownReason["Keyboard"] = 2] = "Keyboard";
        /**
         * An explicit shutdown via code.
         */
        HostShutdownReason[HostShutdownReason["Api"] = 3] = "Api";
    })(HostShutdownReason || (HostShutdownReason = {}));
    let BrowserHostService = class BrowserHostService extends lifecycle_1.Disposable {
        constructor(layoutService, configurationService, fileService, labelService, environmentService, instantiationService, lifecycleService, logService, dialogService, contextService, userDataProfileService) {
            super();
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.lifecycleService = lifecycleService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.contextService = contextService;
            this.userDataProfileService = userDataProfileService;
            this.shutdownReason = HostShutdownReason.Unknown;
            if (environmentService.options?.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = new class {
                    constructor() {
                        this.workspace = undefined;
                        this.trusted = undefined;
                    }
                    async open() { return true; }
                };
            }
            this.registerListeners();
        }
        registerListeners() {
            // Veto shutdown depending on `window.confirmBeforeClose` setting
            this._register(this.lifecycleService.onBeforeShutdown(e => this.onBeforeShutdown(e)));
            // Track modifier keys to detect keybinding usage
            this._register(dom_1.ModifierKeyEmitter.getInstance().event(() => this.updateShutdownReasonFromEvent()));
        }
        onBeforeShutdown(e) {
            switch (this.shutdownReason) {
                // Unknown / Keyboard shows veto depending on setting
                case HostShutdownReason.Unknown:
                case HostShutdownReason.Keyboard: {
                    const confirmBeforeClose = this.configurationService.getValue('window.confirmBeforeClose');
                    if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && this.shutdownReason === HostShutdownReason.Keyboard)) {
                        e.veto(true, 'veto.confirmBeforeClose');
                    }
                    break;
                }
                // Api never shows veto
                case HostShutdownReason.Api:
                    break;
            }
            // Unset for next shutdown
            this.shutdownReason = HostShutdownReason.Unknown;
        }
        updateShutdownReasonFromEvent() {
            if (this.shutdownReason === HostShutdownReason.Api) {
                return; // do not overwrite any explicitly set shutdown reason
            }
            if (dom_1.ModifierKeyEmitter.getInstance().isModifierPressed) {
                this.shutdownReason = HostShutdownReason.Keyboard;
            }
            else {
                this.shutdownReason = HostShutdownReason.Unknown;
            }
        }
        //#region Focus
        get onDidChangeFocus() {
            const emitter = this._register(new event_1.Emitter());
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                const focusTracker = disposables.add((0, dom_1.trackFocus)(window));
                const visibilityTracker = disposables.add(new event_2.DomEmitter(window.document, 'visibilitychange'));
                event_1.Event.any(event_1.Event.map(focusTracker.onDidFocus, () => this.hasFocus, disposables), event_1.Event.map(focusTracker.onDidBlur, () => this.hasFocus, disposables), event_1.Event.map(visibilityTracker.event, () => this.hasFocus, disposables), event_1.Event.map(this.onDidChangeActiveWindow, () => this.hasFocus, disposables))(focus => emitter.fire(focus));
            }, { window: window_2.mainWindow, disposables: this._store }));
            return event_1.Event.latch(emitter.event, undefined, this._store);
        }
        get hasFocus() {
            return (0, dom_1.getActiveDocument)().hasFocus();
        }
        async hadLastFocus() {
            return true;
        }
        async focus(targetWindow) {
            targetWindow.focus();
        }
        //#endregion
        //#region Window
        get onDidChangeActiveWindow() {
            const emitter = this._register(new event_1.Emitter());
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                const windowId = (0, dom_1.getWindowId)(window);
                // Emit via focus tracking
                const focusTracker = disposables.add((0, dom_1.trackFocus)(window));
                disposables.add(focusTracker.onDidFocus(() => emitter.fire(windowId)));
                // Emit via interval: immediately when opening an auxiliary window,
                // it is possible that document focus has not yet changed, so we
                // poll for a while to ensure we catch the event.
                if ((0, window_2.isAuxiliaryWindow)(window)) {
                    disposables.add((0, dom_1.disposableWindowInterval)(window, () => {
                        const hasFocus = window.document.hasFocus();
                        if (hasFocus) {
                            emitter.fire(windowId);
                        }
                        return hasFocus;
                    }, 100, 20));
                }
            }, { window: window_2.mainWindow, disposables: this._store }));
            return event_1.Event.latch(emitter.event, undefined, this._store);
        }
        get onDidChangeFullScreen() {
            const emitter = this._register(new event_1.Emitter());
            this._register(event_1.Event.runAndSubscribe(dom_1.onDidRegisterWindow, ({ window, disposables }) => {
                const windowId = (0, dom_1.getWindowId)(window);
                const viewport = platform_1.isIOS && window.visualViewport ? window.visualViewport /** Visual viewport */ : window /** Layout viewport */;
                // Fullscreen (Browser)
                for (const event of [dom_1.EventType.FULLSCREEN_CHANGE, dom_1.EventType.WK_FULLSCREEN_CHANGE]) {
                    disposables.add((0, dom_1.addDisposableListener)(window.document, event, () => emitter.fire({ windowId, fullscreen: !!(0, dom_1.detectFullscreen)(window) })));
                }
                // Fullscreen (Native)
                disposables.add((0, dom_1.addDisposableThrottledListener)(viewport, dom_1.EventType.RESIZE, () => emitter.fire({ windowId, fullscreen: !!(0, dom_1.detectFullscreen)(window) }), undefined, platform_1.isMacintosh ? 2000 /* adjust for macOS animation */ : 800 /* can be throttled */));
            }, { window: window_2.mainWindow, disposables: this._store }));
            return emitter.event;
        }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        async doOpenWindow(toOpen, options) {
            const payload = this.preservePayload(false /* not an empty window */);
            const fileOpenables = [];
            const foldersToAdd = [];
            for (const openable of toOpen) {
                openable.label = openable.label || this.getRecentLabel(openable);
                // Folder
                if ((0, window_1.isFolderToOpen)(openable)) {
                    if (options?.addMode) {
                        foldersToAdd.push(({ uri: openable.folderUri }));
                    }
                    else {
                        this.doOpen({ folderUri: openable.folderUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                    }
                }
                // Workspace
                else if ((0, window_1.isWorkspaceToOpen)(openable)) {
                    this.doOpen({ workspaceUri: openable.workspaceUri }, { reuse: this.shouldReuse(options, false /* no file */), payload });
                }
                // File (handled later in bulk)
                else if ((0, window_1.isFileToOpen)(openable)) {
                    fileOpenables.push(openable);
                }
            }
            // Handle Folders to Add
            if (foldersToAdd.length > 0) {
                this.withServices(accessor => {
                    const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
                    workspaceEditingService.addFolders(foldersToAdd);
                });
            }
            // Handle Files
            if (fileOpenables.length > 0) {
                this.withServices(async (accessor) => {
                    const editorService = accessor.get(editorService_1.IEditorService);
                    // Support mergeMode
                    if (options?.mergeMode && fileOpenables.length === 4) {
                        const editors = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(fileOpenables, this.fileService, this.logService));
                        if (editors.length !== 4 || !(0, editor_1.isResourceEditorInput)(editors[0]) || !(0, editor_1.isResourceEditorInput)(editors[1]) || !(0, editor_1.isResourceEditorInput)(editors[2]) || !(0, editor_1.isResourceEditorInput)(editors[3])) {
                            return; // invalid resources
                        }
                        // Same Window: open via editor service in current window
                        if (this.shouldReuse(options, true /* file */)) {
                            editorService.openEditor({
                                input1: { resource: editors[0].resource },
                                input2: { resource: editors[1].resource },
                                base: { resource: editors[2].resource },
                                result: { resource: editors[3].resource },
                                options: { pinned: true }
                            });
                        }
                        // New Window: open into empty window
                        else {
                            const environment = new Map();
                            environment.set('mergeFile1', editors[0].resource.toString());
                            environment.set('mergeFile2', editors[1].resource.toString());
                            environment.set('mergeFileBase', editors[2].resource.toString());
                            environment.set('mergeFileResult', editors[3].resource.toString());
                            this.doOpen(undefined, { payload: Array.from(environment.entries()) });
                        }
                    }
                    // Support diffMode
                    else if (options?.diffMode && fileOpenables.length === 2) {
                        const editors = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(fileOpenables, this.fileService, this.logService));
                        if (editors.length !== 2 || !(0, editor_1.isResourceEditorInput)(editors[0]) || !(0, editor_1.isResourceEditorInput)(editors[1])) {
                            return; // invalid resources
                        }
                        // Same Window: open via editor service in current window
                        if (this.shouldReuse(options, true /* file */)) {
                            editorService.openEditor({
                                original: { resource: editors[0].resource },
                                modified: { resource: editors[1].resource },
                                options: { pinned: true }
                            });
                        }
                        // New Window: open into empty window
                        else {
                            const environment = new Map();
                            environment.set('diffFileSecondary', editors[0].resource.toString());
                            environment.set('diffFilePrimary', editors[1].resource.toString());
                            this.doOpen(undefined, { payload: Array.from(environment.entries()) });
                        }
                    }
                    // Just open normally
                    else {
                        for (const openable of fileOpenables) {
                            // Same Window: open via editor service in current window
                            if (this.shouldReuse(options, true /* file */)) {
                                let openables = [];
                                // Support: --goto parameter to open on line/col
                                if (options?.gotoLineMode) {
                                    const pathColumnAware = (0, extpath_1.parseLineAndColumnAware)(openable.fileUri.path);
                                    openables = [{
                                            fileUri: openable.fileUri.with({ path: pathColumnAware.path }),
                                            options: {
                                                selection: !(0, types_1.isUndefined)(pathColumnAware.line) ? { startLineNumber: pathColumnAware.line, startColumn: pathColumnAware.column || 1 } : undefined
                                            }
                                        }];
                                }
                                else {
                                    openables = [openable];
                                }
                                editorService.openEditors((0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(openables, this.fileService, this.logService)), undefined, { validateTrust: true });
                            }
                            // New Window: open into empty window
                            else {
                                const environment = new Map();
                                environment.set('openFile', openable.fileUri.toString());
                                if (options?.gotoLineMode) {
                                    environment.set('gotoLineMode', 'true');
                                }
                                this.doOpen(undefined, { payload: Array.from(environment.entries()) });
                            }
                        }
                    }
                    // Support wait mode
                    const waitMarkerFileURI = options?.waitMarkerFileURI;
                    if (waitMarkerFileURI) {
                        (async () => {
                            // Wait for the resources to be closed in the text editor...
                            await this.instantiationService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, fileOpenables.map(fileOpenable => fileOpenable.fileUri)));
                            // ...before deleting the wait marker file
                            await this.fileService.del(waitMarkerFileURI);
                        })();
                    }
                });
            }
        }
        withServices(fn) {
            // Host service is used in a lot of contexts and some services
            // need to be resolved dynamically to avoid cyclic dependencies
            // (https://github.com/microsoft/vscode/issues/108522)
            this.instantiationService.invokeFunction(accessor => fn(accessor));
        }
        preservePayload(isEmptyWindow) {
            // Selectively copy payload: for now only extension debugging properties are considered
            const newPayload = new Array();
            if (!isEmptyWindow && this.environmentService.extensionDevelopmentLocationURI) {
                newPayload.push(['extensionDevelopmentPath', this.environmentService.extensionDevelopmentLocationURI.toString()]);
                if (this.environmentService.debugExtensionHost.debugId) {
                    newPayload.push(['debugId', this.environmentService.debugExtensionHost.debugId]);
                }
                if (this.environmentService.debugExtensionHost.port) {
                    newPayload.push(['inspect-brk-extensions', String(this.environmentService.debugExtensionHost.port)]);
                }
            }
            if (!this.userDataProfileService.currentProfile.isDefault) {
                newPayload.push(['lastActiveProfile', this.userDataProfileService.currentProfile.id]);
            }
            return newPayload.length ? newPayload : undefined;
        }
        getRecentLabel(openable) {
            if ((0, window_1.isFolderToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: 2 /* Verbosity.LONG */ });
            }
            if ((0, window_1.isWorkspaceToOpen)(openable)) {
                return this.labelService.getWorkspaceLabel((0, workspaces_1.getWorkspaceIdentifier)(openable.workspaceUri), { verbose: 2 /* Verbosity.LONG */ });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        shouldReuse(options = Object.create(null), isFile) {
            if (options.waitMarkerFileURI) {
                return true; // always handle --wait in same window
            }
            const windowConfig = this.configurationService.getValue('window');
            const openInNewWindowConfig = isFile ? (windowConfig?.openFilesInNewWindow || 'off' /* default */) : (windowConfig?.openFoldersInNewWindow || 'default' /* default */);
            let openInNewWindow = (options.preferNewWindow || !!options.forceNewWindow) && !options.forceReuseWindow;
            if (!options.forceNewWindow && !options.forceReuseWindow && (openInNewWindowConfig === 'on' || openInNewWindowConfig === 'off')) {
                openInNewWindow = (openInNewWindowConfig === 'on');
            }
            return !openInNewWindow;
        }
        async doOpenEmptyWindow(options) {
            return this.doOpen(undefined, {
                reuse: options?.forceReuseWindow,
                payload: this.preservePayload(true /* empty window */)
            });
        }
        async doOpen(workspace, options) {
            // When we are in a temporary workspace and are asked to open a local folder
            // we swap that folder into the workspace to avoid a window reload. Access
            // to local resources is only possible without a window reload because it
            // needs user activation.
            if (workspace && (0, window_1.isFolderToOpen)(workspace) && workspace.folderUri.scheme === network_1.Schemas.file && (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                this.withServices(async (accessor) => {
                    const workspaceEditingService = accessor.get(workspaceEditing_1.IWorkspaceEditingService);
                    await workspaceEditingService.updateFolders(0, this.contextService.getWorkspace().folders.length, [{ uri: workspace.folderUri }]);
                });
                return;
            }
            // We know that `workspaceProvider.open` will trigger a shutdown
            // with `options.reuse` so we handle this expected shutdown
            if (options?.reuse) {
                await this.handleExpectedShutdown(4 /* ShutdownReason.LOAD */);
            }
            const opened = await this.workspaceProvider.open(workspace, options);
            if (!opened) {
                const { confirmed } = await this.dialogService.confirm({
                    type: severity_1.default.Warning,
                    message: (0, nls_1.localize)('unableToOpenExternal', "The browser interrupted the opening of a new tab or window. Press 'Open' to open it anyway."),
                    primaryButton: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open")
                });
                if (confirmed) {
                    await this.workspaceProvider.open(workspace, options);
                }
            }
        }
        async toggleFullScreen(targetWindow) {
            const target = this.layoutService.getContainer(targetWindow);
            // Chromium
            if (targetWindow.document.fullscreen !== undefined) {
                if (!targetWindow.document.fullscreen) {
                    try {
                        return await target.requestFullscreen();
                    }
                    catch (error) {
                        this.logService.warn('toggleFullScreen(): requestFullscreen failed'); // https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
                    }
                }
                else {
                    try {
                        return await targetWindow.document.exitFullscreen();
                    }
                    catch (error) {
                        this.logService.warn('toggleFullScreen(): exitFullscreen failed');
                    }
                }
            }
            // Safari and Edge 14 are all using webkit prefix
            if (targetWindow.document.webkitIsFullScreen !== undefined) {
                try {
                    if (!targetWindow.document.webkitIsFullScreen) {
                        target.webkitRequestFullscreen(); // it's async, but doesn't return a real promise.
                    }
                    else {
                        targetWindow.document.webkitExitFullscreen(); // it's async, but doesn't return a real promise.
                    }
                }
                catch {
                    this.logService.warn('toggleFullScreen(): requestFullscreen/exitFullscreen failed');
                }
            }
        }
        async moveTop(targetWindow) {
            // There seems to be no API to bring a window to front in browsers
        }
        async getCursorScreenPoint() {
            return undefined;
        }
        //#endregion
        //#region Lifecycle
        async restart() {
            this.reload();
        }
        async reload() {
            await this.handleExpectedShutdown(3 /* ShutdownReason.RELOAD */);
            window_2.mainWindow.location.reload();
        }
        async close() {
            await this.handleExpectedShutdown(1 /* ShutdownReason.CLOSE */);
            window_2.mainWindow.close();
        }
        async withExpectedShutdown(expectedShutdownTask) {
            const previousShutdownReason = this.shutdownReason;
            try {
                this.shutdownReason = HostShutdownReason.Api;
                return await expectedShutdownTask();
            }
            finally {
                this.shutdownReason = previousShutdownReason;
            }
        }
        async handleExpectedShutdown(reason) {
            // Update shutdown reason in a way that we do
            // not show a dialog because this is a expected
            // shutdown.
            this.shutdownReason = HostShutdownReason.Api;
            // Signal shutdown reason to lifecycle
            return this.lifecycleService.withExpectedShutdown(reason);
        }
    };
    exports.BrowserHostService = BrowserHostService;
    __decorate([
        decorators_1.memoize
    ], BrowserHostService.prototype, "onDidChangeFocus", null);
    __decorate([
        decorators_1.memoize
    ], BrowserHostService.prototype, "onDidChangeActiveWindow", null);
    __decorate([
        decorators_1.memoize
    ], BrowserHostService.prototype, "onDidChangeFullScreen", null);
    exports.BrowserHostService = BrowserHostService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, files_1.IFileService),
        __param(3, label_1.ILabelService),
        __param(4, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, lifecycle_2.ILifecycleService),
        __param(7, log_1.ILogService),
        __param(8, dialogs_1.IDialogService),
        __param(9, workspace_1.IWorkspaceContextService),
        __param(10, userDataProfile_1.IUserDataProfileService)
    ], BrowserHostService);
    (0, extensions_1.registerSingleton)(host_1.IHostService, BrowserHostService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlckhvc3RTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvaG9zdC9icm93c2VyL2Jyb3dzZXJIb3N0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3Q2hHLElBQUssa0JBZ0JKO0lBaEJELFdBQUssa0JBQWtCO1FBRXRCOztXQUVHO1FBQ0gsaUVBQVcsQ0FBQTtRQUVYOztXQUVHO1FBQ0gsbUVBQVksQ0FBQTtRQUVaOztXQUVHO1FBQ0gseURBQU8sQ0FBQTtJQUNSLENBQUMsRUFoQkksa0JBQWtCLEtBQWxCLGtCQUFrQixRQWdCdEI7SUFFTSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBUWpELFlBQ2lCLGFBQThDLEVBQ3ZDLG9CQUE0RCxFQUNyRSxXQUEwQyxFQUN6QyxZQUE0QyxFQUN0QixrQkFBd0UsRUFDdEYsb0JBQTRELEVBQ2hFLGdCQUEwRCxFQUNoRSxVQUF3QyxFQUNyQyxhQUE4QyxFQUNwQyxjQUF5RCxFQUMxRCxzQkFBZ0U7WUFFekYsS0FBSyxFQUFFLENBQUM7WUFaeUIsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3RCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEQsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDeEIsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDTCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFDO1lBQ3JFLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUF5QjtZQUMvQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUNuQixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDekMsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQWJsRixtQkFBYyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztZQWlCbkQsSUFBSSxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztZQUN2RSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUk7b0JBQUE7d0JBQ25CLGNBQVMsR0FBRyxTQUFTLENBQUM7d0JBQ3RCLFlBQU8sR0FBRyxTQUFTLENBQUM7b0JBRTlCLENBQUM7b0JBREEsS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7aUJBQzdCLENBQUM7WUFDSCxDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUV4QixpRUFBaUU7WUFDakUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXRGLGlEQUFpRDtZQUNqRCxJQUFJLENBQUMsU0FBUyxDQUFDLHdCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUVPLGdCQUFnQixDQUFDLENBQXNCO1lBRTlDLFFBQVEsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUU3QixxREFBcUQ7Z0JBQ3JELEtBQUssa0JBQWtCLENBQUMsT0FBTyxDQUFDO2dCQUNoQyxLQUFLLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO29CQUMzRixJQUFJLGtCQUFrQixLQUFLLFFBQVEsSUFBSSxDQUFDLGtCQUFrQixLQUFLLGNBQWMsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7d0JBQ3ZJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHlCQUF5QixDQUFDLENBQUM7b0JBQ3pDLENBQUM7b0JBQ0QsTUFBTTtnQkFDUCxDQUFDO2dCQUNELHVCQUF1QjtnQkFDdkIsS0FBSyxrQkFBa0IsQ0FBQyxHQUFHO29CQUMxQixNQUFNO1lBQ1IsQ0FBQztZQUVELDBCQUEwQjtZQUMxQixJQUFJLENBQUMsY0FBYyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sQ0FBQztRQUNsRCxDQUFDO1FBRU8sNkJBQTZCO1lBQ3BDLElBQUksSUFBSSxDQUFDLGNBQWMsS0FBSyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDcEQsT0FBTyxDQUFDLHNEQUFzRDtZQUMvRCxDQUFDO1lBRUQsSUFBSSx3QkFBa0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4RCxJQUFJLENBQUMsY0FBYyxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQztZQUNuRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGNBQWMsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlO1FBR2YsSUFBSSxnQkFBZ0I7WUFDbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFFdkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsZUFBZSxDQUFDLHlCQUFtQixFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRTtnQkFDckYsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGdCQUFVLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDekQsTUFBTSxpQkFBaUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksa0JBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztnQkFFL0YsYUFBSyxDQUFDLEdBQUcsQ0FDUixhQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsRUFDcEUsYUFBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEVBQ25FLGFBQUssQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLEVBQ3BFLGFBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQ3pFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDakMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLG1CQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEQsT0FBTyxhQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFBLHVCQUFpQixHQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZO1lBQ2pCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBb0I7WUFDL0IsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RCLENBQUM7UUFFRCxZQUFZO1FBR1osZ0JBQWdCO1FBR2hCLElBQUksdUJBQXVCO1lBQzFCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBRXRELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLGVBQWUsQ0FBQyx5QkFBbUIsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7Z0JBQ3JGLE1BQU0sUUFBUSxHQUFHLElBQUEsaUJBQVcsRUFBQyxNQUFNLENBQUMsQ0FBQztnQkFFckMsMEJBQTBCO2dCQUMxQixNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsZ0JBQVUsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZFLG1FQUFtRTtnQkFDbkUsZ0VBQWdFO2dCQUNoRSxpREFBaUQ7Z0JBQ2pELElBQUksSUFBQSwwQkFBaUIsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUMvQixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsOEJBQXdCLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTt3QkFDckQsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQzt3QkFDNUMsSUFBSSxRQUFRLEVBQUUsQ0FBQzs0QkFDZCxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUN4QixDQUFDO3dCQUVELE9BQU8sUUFBUSxDQUFDO29CQUNqQixDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2QsQ0FBQztZQUNGLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxtQkFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRELE9BQU8sYUFBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUdELElBQUkscUJBQXFCO1lBQ3hCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZDLENBQUMsQ0FBQztZQUV6RixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQUssQ0FBQyxlQUFlLENBQUMseUJBQW1CLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxFQUFFO2dCQUNyRixNQUFNLFFBQVEsR0FBRyxJQUFBLGlCQUFXLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sUUFBUSxHQUFHLGdCQUFLLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDO2dCQUUvSCx1QkFBdUI7Z0JBQ3ZCLEtBQUssTUFBTSxLQUFLLElBQUksQ0FBQyxlQUFTLENBQUMsaUJBQWlCLEVBQUUsZUFBUyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztvQkFDbkYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLDJCQUFxQixFQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxJQUFBLHNCQUFnQixFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFJLENBQUM7Z0JBRUQsc0JBQXNCO2dCQUN0QixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0NBQThCLEVBQUMsUUFBUSxFQUFFLGVBQVMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLElBQUEsc0JBQWdCLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxzQkFBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDcFAsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLG1CQUFVLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEQsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUM7UUFJRCxVQUFVLENBQUMsSUFBa0QsRUFBRSxJQUF5QjtZQUN2RixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVPLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBeUIsRUFBRSxPQUE0QjtZQUNqRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sYUFBYSxHQUFrQixFQUFFLENBQUM7WUFDeEMsTUFBTSxZQUFZLEdBQW1DLEVBQUUsQ0FBQztZQUV4RCxLQUFLLE1BQU0sUUFBUSxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUMvQixRQUFRLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFakUsU0FBUztnQkFDVCxJQUFJLElBQUEsdUJBQWMsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUM5QixJQUFJLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQzt3QkFDdEIsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ2xELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDcEgsQ0FBQztnQkFDRixDQUFDO2dCQUVELFlBQVk7cUJBQ1AsSUFBSSxJQUFBLDBCQUFpQixFQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQ3RDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxZQUFZLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMxSCxDQUFDO2dCQUVELCtCQUErQjtxQkFDMUIsSUFBSSxJQUFBLHFCQUFZLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDakMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7WUFFRCx3QkFBd0I7WUFDeEIsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUM1QixNQUFNLHVCQUF1QixHQUE2QixRQUFRLENBQUMsR0FBRyxDQUFDLDJDQUF3QixDQUFDLENBQUM7b0JBQ2pHLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbEQsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsZUFBZTtZQUNmLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUMsUUFBUSxFQUFDLEVBQUU7b0JBQ2xDLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsOEJBQWMsQ0FBQyxDQUFDO29CQUVuRCxvQkFBb0I7b0JBQ3BCLElBQUksT0FBTyxFQUFFLFNBQVMsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO3dCQUN0RCxNQUFNLE9BQU8sR0FBRyxJQUFBLGlCQUFRLEVBQUMsTUFBTSxJQUFBLHVCQUFjLEVBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7d0JBQ2pHLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFBLDhCQUFxQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBQSw4QkFBcUIsRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUEsOEJBQXFCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFBLDhCQUFxQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ2xMLE9BQU8sQ0FBQyxvQkFBb0I7d0JBQzdCLENBQUM7d0JBRUQseURBQXlEO3dCQUN6RCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDOzRCQUNoRCxhQUFhLENBQUMsVUFBVSxDQUFDO2dDQUN4QixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtnQ0FDekMsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0NBQ3pDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO2dDQUN2QyxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtnQ0FDekMsT0FBTyxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTs2QkFDekIsQ0FBQyxDQUFDO3dCQUNKLENBQUM7d0JBRUQscUNBQXFDOzZCQUNoQyxDQUFDOzRCQUNMLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDOzRCQUM5QyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7NEJBQzlELFdBQVcsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzs0QkFDOUQsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOzRCQUNqRSxXQUFXLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQzs0QkFFbkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ3hFLENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxtQkFBbUI7eUJBQ2QsSUFBSSxPQUFPLEVBQUUsUUFBUSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQzFELE1BQU0sT0FBTyxHQUFHLElBQUEsaUJBQVEsRUFBQyxNQUFNLElBQUEsdUJBQWMsRUFBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDakcsSUFBSSxPQUFPLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEsOEJBQXFCLEVBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFBLDhCQUFxQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7NEJBQ3RHLE9BQU8sQ0FBQyxvQkFBb0I7d0JBQzdCLENBQUM7d0JBRUQseURBQXlEO3dCQUN6RCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDOzRCQUNoRCxhQUFhLENBQUMsVUFBVSxDQUFDO2dDQUN4QixRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtnQ0FDM0MsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0NBQzNDLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7NkJBQ3pCLENBQUMsQ0FBQzt3QkFDSixDQUFDO3dCQUVELHFDQUFxQzs2QkFDaEMsQ0FBQzs0QkFDTCxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQzs0QkFDOUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7NEJBQ3JFLFdBQVcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOzRCQUVuRSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDeEUsQ0FBQztvQkFDRixDQUFDO29CQUVELHFCQUFxQjt5QkFDaEIsQ0FBQzt3QkFDTCxLQUFLLE1BQU0sUUFBUSxJQUFJLGFBQWEsRUFBRSxDQUFDOzRCQUV0Qyx5REFBeUQ7NEJBQ3pELElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0NBQ2hELElBQUksU0FBUyxHQUFvQyxFQUFFLENBQUM7Z0NBRXBELGdEQUFnRDtnQ0FDaEQsSUFBSSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7b0NBQzNCLE1BQU0sZUFBZSxHQUFHLElBQUEsaUNBQXVCLEVBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQ0FDdkUsU0FBUyxHQUFHLENBQUM7NENBQ1osT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs0Q0FDOUQsT0FBTyxFQUFFO2dEQUNSLFNBQVMsRUFBRSxDQUFDLElBQUEsbUJBQVcsRUFBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLGVBQWUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7NkNBQy9JO3lDQUNELENBQUMsQ0FBQztnQ0FDSixDQUFDO3FDQUFNLENBQUM7b0NBQ1AsU0FBUyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0NBQ3hCLENBQUM7Z0NBRUQsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFBLGlCQUFRLEVBQUMsTUFBTSxJQUFBLHVCQUFjLEVBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7NEJBQzdJLENBQUM7NEJBRUQscUNBQXFDO2lDQUNoQyxDQUFDO2dDQUNMLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO2dDQUM5QyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0NBRXpELElBQUksT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO29DQUMzQixXQUFXLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQztnQ0FDekMsQ0FBQztnQ0FFRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzs0QkFDeEUsQ0FBQzt3QkFDRixDQUFDO29CQUNGLENBQUM7b0JBRUQsb0JBQW9CO29CQUNwQixNQUFNLGlCQUFpQixHQUFHLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztvQkFDckQsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO3dCQUN2QixDQUFDLEtBQUssSUFBSSxFQUFFOzRCQUVYLDREQUE0RDs0QkFDNUQsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBQSx5QkFBZ0IsRUFBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBRWhKLDBDQUEwQzs0QkFDMUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO3dCQUMvQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNOLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1FBQ0YsQ0FBQztRQUVPLFlBQVksQ0FBQyxFQUEyQztZQUMvRCw4REFBOEQ7WUFDOUQsK0RBQStEO1lBQy9ELHNEQUFzRDtZQUN0RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztRQUVPLGVBQWUsQ0FBQyxhQUFzQjtZQUU3Qyx1RkFBdUY7WUFDdkYsTUFBTSxVQUFVLEdBQW1CLElBQUksS0FBSyxFQUFFLENBQUM7WUFDL0MsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDL0UsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLDBCQUEwQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQywrQkFBK0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWxILElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN4RCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNsRixDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNyRCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RHLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQzNELFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkYsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDbkQsQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUF5QjtZQUMvQyxJQUFJLElBQUEsdUJBQWMsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLE9BQU8sd0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1lBQzdGLENBQUM7WUFFRCxJQUFJLElBQUEsMEJBQWlCLEVBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDakMsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLElBQUEsbUNBQXNCLEVBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsT0FBTyx3QkFBZ0IsRUFBRSxDQUFDLENBQUM7WUFDeEgsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFTyxXQUFXLENBQUMsVUFBOEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFlO1lBQ3JGLElBQUksT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQy9CLE9BQU8sSUFBSSxDQUFDLENBQUMsc0NBQXNDO1lBQ3BELENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUE4QixRQUFRLENBQUMsQ0FBQztZQUMvRixNQUFNLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksRUFBRSxzQkFBc0IsSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFdkssSUFBSSxlQUFlLEdBQUcsQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7WUFDekcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxJQUFJLElBQUkscUJBQXFCLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakksZUFBZSxHQUFHLENBQUMscUJBQXFCLEtBQUssSUFBSSxDQUFDLENBQUM7WUFDcEQsQ0FBQztZQUVELE9BQU8sQ0FBQyxlQUFlLENBQUM7UUFDekIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxPQUFpQztZQUNoRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO2dCQUM3QixLQUFLLEVBQUUsT0FBTyxFQUFFLGdCQUFnQjtnQkFDaEMsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDO2FBQ3RELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQXFCLEVBQUUsT0FBK0M7WUFFMUYsNEVBQTRFO1lBQzVFLDBFQUEwRTtZQUMxRSx5RUFBeUU7WUFDekUseUJBQXlCO1lBQ3pCLElBQUksU0FBUyxJQUFJLElBQUEsdUJBQWMsRUFBQyxTQUFTLENBQUMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksSUFBSSxJQUFBLGdDQUFvQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUN2SixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBQyxRQUFRLEVBQUMsRUFBRTtvQkFDbEMsTUFBTSx1QkFBdUIsR0FBNkIsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQ0FBd0IsQ0FBQyxDQUFDO29CQUVqRyxNQUFNLHVCQUF1QixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkksQ0FBQyxDQUFDLENBQUM7Z0JBRUgsT0FBTztZQUNSLENBQUM7WUFFRCxnRUFBZ0U7WUFDaEUsMkRBQTJEO1lBQzNELElBQUksT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUNwQixNQUFNLElBQUksQ0FBQyxzQkFBc0IsNkJBQXFCLENBQUM7WUFDeEQsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDckUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNiLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO29CQUN0RCxJQUFJLEVBQUUsa0JBQVEsQ0FBQyxPQUFPO29CQUN0QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsNkZBQTZGLENBQUM7b0JBQ3hJLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQztpQkFDdEYsQ0FBQyxDQUFDO2dCQUNILElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2YsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDdkQsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFlBQW9CO1lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTdELFdBQVc7WUFDWCxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxDQUFDO3dCQUNKLE9BQU8sTUFBTSxNQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztvQkFDekMsQ0FBQztvQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO3dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDLENBQUMsNkVBQTZFO29CQUNwSixDQUFDO2dCQUNGLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUM7d0JBQ0osT0FBTyxNQUFNLFlBQVksQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3JELENBQUM7b0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQzt3QkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQztvQkFDbkUsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELGlEQUFpRDtZQUNqRCxJQUFVLFlBQVksQ0FBQyxRQUFTLENBQUMsa0JBQWtCLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ25FLElBQUksQ0FBQztvQkFDSixJQUFJLENBQU8sWUFBWSxDQUFDLFFBQVMsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO3dCQUNoRCxNQUFPLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLGlEQUFpRDtvQkFDM0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNELFlBQVksQ0FBQyxRQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLGlEQUFpRDtvQkFDdkcsQ0FBQztnQkFDRixDQUFDO2dCQUFDLE1BQU0sQ0FBQztvQkFDUixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO2dCQUNyRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQW9CO1lBQ2pDLGtFQUFrRTtRQUNuRSxDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQjtZQUN6QixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsWUFBWTtRQUVaLG1CQUFtQjtRQUVuQixLQUFLLENBQUMsT0FBTztZQUNaLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNmLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTTtZQUNYLE1BQU0sSUFBSSxDQUFDLHNCQUFzQiwrQkFBdUIsQ0FBQztZQUV6RCxtQkFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM5QixDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUs7WUFDVixNQUFNLElBQUksQ0FBQyxzQkFBc0IsOEJBQXNCLENBQUM7WUFFeEQsbUJBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBRUQsS0FBSyxDQUFDLG9CQUFvQixDQUFJLG9CQUFzQztZQUNuRSxNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDbkQsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxjQUFjLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDO2dCQUM3QyxPQUFPLE1BQU0sb0JBQW9CLEVBQUUsQ0FBQztZQUNyQyxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxNQUFzQjtZQUUxRCw2Q0FBNkM7WUFDN0MsK0NBQStDO1lBQy9DLFlBQVk7WUFDWixJQUFJLENBQUMsY0FBYyxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQztZQUU3QyxzQ0FBc0M7WUFDdEMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0QsQ0FBQztLQUdELENBQUE7SUEvZlksZ0RBQWtCO0lBa0Y5QjtRQURDLG9CQUFPOzhEQWlCUDtJQW9CRDtRQURDLG9CQUFPO3FFQTJCUDtJQUdEO1FBREMsb0JBQU87bUVBa0JQO2lDQXBLVyxrQkFBa0I7UUFTNUIsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHFCQUFhLENBQUE7UUFDYixXQUFBLHdEQUFtQyxDQUFBO1FBQ25DLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFlBQUEseUNBQXVCLENBQUE7T0FuQmIsa0JBQWtCLENBK2Y5QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsbUJBQVksRUFBRSxrQkFBa0Isb0NBQTRCLENBQUMifQ==