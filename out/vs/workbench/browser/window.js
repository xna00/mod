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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/deviceAccess", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/workbench/services/driver/browser/driver", "vs/base/browser/window", "vs/base/common/functional", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService"], function (require, exports, browser_1, dom_1, event_1, deviceAccess_1, async_1, event_2, lifecycle_1, network_1, platform_1, severity_1, uri_1, nls_1, commands_1, dialogs_1, instantiation_1, label_1, opener_1, productService_1, environmentService_1, layoutService_1, lifecycle_2, host_1, driver_1, window_1, functional_1, configuration_1, environmentService_2) {
    "use strict";
    var BaseWindow_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWindow = exports.BaseWindow = void 0;
    let BaseWindow = class BaseWindow extends lifecycle_1.Disposable {
        static { BaseWindow_1 = this; }
        static { this.TIMEOUT_HANDLES = Number.MIN_SAFE_INTEGER; } // try to not compete with the IDs of native `setTimeout`
        static { this.TIMEOUT_DISPOSABLES = new Map(); }
        constructor(targetWindow, dom = { getWindowsCount: dom_1.getWindowsCount, getWindows: dom_1.getWindows }, hostService, environmentService) {
            super();
            this.hostService = hostService;
            this.environmentService = environmentService;
            this.enableWindowFocusOnElementFocus(targetWindow);
            this.enableMultiWindowAwareTimeout(targetWindow, dom);
            this.registerFullScreenListeners(targetWindow.vscodeWindowId);
        }
        //#region focus handling in multi-window applications
        enableWindowFocusOnElementFocus(targetWindow) {
            const originalFocus = targetWindow.HTMLElement.prototype.focus;
            const that = this;
            targetWindow.HTMLElement.prototype.focus = function (options) {
                // Ensure the window the element belongs to is focused
                // in scenarios where auxiliary windows are present
                that.onElementFocus((0, dom_1.getWindow)(this));
                // Pass to original focus() method
                originalFocus.apply(this, [options]);
            };
        }
        onElementFocus(targetWindow) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            if (activeWindow !== targetWindow && activeWindow.document.hasFocus()) {
                // Call original focus()
                targetWindow.focus();
                // In Electron, `window.focus()` fails to bring the window
                // to the front if multiple windows exist in the same process
                // group (floating windows). As such, we ask the host service
                // to focus the window which can take care of bringin the
                // window to the front.
                //
                // To minimise disruption by bringing windows to the front
                // by accident, we only do this if the window is not already
                // focused and the active window is not the target window
                // but has focus. This is an indication that multiple windows
                // are opened in the same process group while the target window
                // is not focused.
                if (!this.environmentService.extensionTestsLocationURI &&
                    !targetWindow.document.hasFocus()) {
                    this.hostService.focus(targetWindow);
                }
            }
        }
        //#endregion
        //#region timeout handling in multi-window applications
        enableMultiWindowAwareTimeout(targetWindow, dom = { getWindowsCount: dom_1.getWindowsCount, getWindows: dom_1.getWindows }) {
            // Override `setTimeout` and `clearTimeout` on the provided window to make
            // sure timeouts are dispatched to all opened windows. Some browsers may decide
            // to throttle timeouts in minimized windows, so with this we can ensure the
            // timeout is scheduled without being throttled (unless all windows are minimized).
            const originalSetTimeout = targetWindow.setTimeout;
            Object.defineProperty(targetWindow, 'vscodeOriginalSetTimeout', { get: () => originalSetTimeout });
            const originalClearTimeout = targetWindow.clearTimeout;
            Object.defineProperty(targetWindow, 'vscodeOriginalClearTimeout', { get: () => originalClearTimeout });
            targetWindow.setTimeout = function (handler, timeout = 0, ...args) {
                if (dom.getWindowsCount() === 1 || typeof handler === 'string' || timeout === 0 /* immediates are never throttled */) {
                    return originalSetTimeout.apply(this, [handler, timeout, ...args]);
                }
                const timeoutDisposables = new Set();
                const timeoutHandle = BaseWindow_1.TIMEOUT_HANDLES++;
                BaseWindow_1.TIMEOUT_DISPOSABLES.set(timeoutHandle, timeoutDisposables);
                const handlerFn = (0, functional_1.createSingleCallFunction)(handler, () => {
                    (0, lifecycle_1.dispose)(timeoutDisposables);
                    BaseWindow_1.TIMEOUT_DISPOSABLES.delete(timeoutHandle);
                });
                for (const { window, disposables } of dom.getWindows()) {
                    if ((0, window_1.isAuxiliaryWindow)(window) && window.document.visibilityState === 'hidden') {
                        continue; // skip over hidden windows (but never over main window)
                    }
                    const handle = window.vscodeOriginalSetTimeout.apply(this, [handlerFn, timeout, ...args]);
                    const timeoutDisposable = (0, lifecycle_1.toDisposable)(() => {
                        window.vscodeOriginalClearTimeout(handle);
                        timeoutDisposables.delete(timeoutDisposable);
                    });
                    disposables.add(timeoutDisposable);
                    timeoutDisposables.add(timeoutDisposable);
                }
                return timeoutHandle;
            };
            targetWindow.clearTimeout = function (timeoutHandle) {
                const timeoutDisposables = typeof timeoutHandle === 'number' ? BaseWindow_1.TIMEOUT_DISPOSABLES.get(timeoutHandle) : undefined;
                if (timeoutDisposables) {
                    (0, lifecycle_1.dispose)(timeoutDisposables);
                    BaseWindow_1.TIMEOUT_DISPOSABLES.delete(timeoutHandle);
                }
                else {
                    originalClearTimeout.apply(this, [timeoutHandle]);
                }
            };
        }
        //#endregion
        registerFullScreenListeners(targetWindowId) {
            this._register(this.hostService.onDidChangeFullScreen(({ windowId, fullscreen }) => {
                if (windowId === targetWindowId) {
                    const targetWindow = (0, dom_1.getWindowById)(targetWindowId);
                    if (targetWindow) {
                        (0, browser_1.setFullscreen)(fullscreen, targetWindow.window);
                    }
                }
            }));
        }
        //#region Confirm on Shutdown
        static async confirmOnShutdown(accessor, reason) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const message = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)('quitMessageMac', "Are you sure you want to quit?") : (0, nls_1.localize)('quitMessage', "Are you sure you want to exit?")) :
                (0, nls_1.localize)('closeWindowMessage', "Are you sure you want to close the window?");
            const primaryButton = reason === 2 /* ShutdownReason.QUIT */ ?
                (platform_1.isMacintosh ? (0, nls_1.localize)({ key: 'quitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Quit") : (0, nls_1.localize)({ key: 'exitButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Exit")) :
                (0, nls_1.localize)({ key: 'closeWindowButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Close Window");
            const res = await dialogService.confirm({
                message,
                primaryButton,
                checkbox: {
                    label: (0, nls_1.localize)('doNotAskAgain', "Do not ask me again")
                }
            });
            // Update setting if checkbox checked
            if (res.confirmed && res.checkboxChecked) {
                await configurationService.updateValue('window.confirmBeforeClose', 'never');
            }
            return res.confirmed;
        }
    };
    exports.BaseWindow = BaseWindow;
    exports.BaseWindow = BaseWindow = BaseWindow_1 = __decorate([
        __param(2, host_1.IHostService),
        __param(3, environmentService_2.IWorkbenchEnvironmentService)
    ], BaseWindow);
    let BrowserWindow = class BrowserWindow extends BaseWindow {
        constructor(openerService, lifecycleService, dialogService, labelService, productService, browserEnvironmentService, layoutService, instantiationService, hostService) {
            super(window_1.mainWindow, undefined, hostService, browserEnvironmentService);
            this.openerService = openerService;
            this.lifecycleService = lifecycleService;
            this.dialogService = dialogService;
            this.labelService = labelService;
            this.productService = productService;
            this.browserEnvironmentService = browserEnvironmentService;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.registerListeners();
            this.create();
        }
        registerListeners() {
            // Lifecycle
            this._register(this.lifecycleService.onWillShutdown(() => this.onWillShutdown()));
            // Layout
            const viewport = platform_1.isIOS && window_1.mainWindow.visualViewport ? window_1.mainWindow.visualViewport /** Visual viewport */ : window_1.mainWindow /** Layout viewport */;
            this._register((0, dom_1.addDisposableListener)(viewport, dom_1.EventType.RESIZE, () => {
                this.layoutService.layout();
                // Sometimes the keyboard appearing scrolls the whole workbench out of view, as a workaround scroll back into view #121206
                if (platform_1.isIOS) {
                    window_1.mainWindow.scrollTo(0, 0);
                }
            }));
            // Prevent the back/forward gestures in macOS
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false }));
            // Prevent native context menus in web
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true)));
            // Prevent default navigation on drop
            this._register((0, dom_1.addDisposableListener)(this.layoutService.mainContainer, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true)));
        }
        onWillShutdown() {
            // Try to detect some user interaction with the workbench
            // when shutdown has happened to not show the dialog e.g.
            // when navigation takes a longer time.
            event_2.Event.toPromise(event_2.Event.any(event_2.Event.once(new event_1.DomEmitter(window_1.mainWindow.document.body, dom_1.EventType.KEY_DOWN, true).event), event_2.Event.once(new event_1.DomEmitter(window_1.mainWindow.document.body, dom_1.EventType.MOUSE_DOWN, true).event))).then(async () => {
                // Delay the dialog in case the user interacted
                // with the page before it transitioned away
                await (0, async_1.timeout)(3000);
                // This should normally not happen, but if for some reason
                // the workbench was shutdown while the page is still there,
                // inform the user that only a reload can bring back a working
                // state.
                await this.dialogService.prompt({
                    type: severity_1.default.Error,
                    message: (0, nls_1.localize)('shutdownError', "An unexpected error occurred that requires a reload of this page."),
                    detail: (0, nls_1.localize)('shutdownErrorDetail', "The workbench was unexpectedly disposed while running."),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic'] }, "&&Reload"),
                            run: () => window_1.mainWindow.location.reload() // do not use any services at this point since they are likely not functional at this point
                        }
                    ]
                });
            });
        }
        create() {
            // Handle open calls
            this.setupOpenHandlers();
            // Label formatting
            this.registerLabelFormatters();
            // Commands
            this.registerCommands();
            // Smoke Test Driver
            this.setupDriver();
        }
        setupDriver() {
            if (this.environmentService.enableSmokeTestDriver) {
                (0, driver_1.registerWindowDriver)(this.instantiationService);
            }
        }
        setupOpenHandlers() {
            // We need to ignore the `beforeunload` event while
            // we handle external links to open specifically for
            // the case of application protocols that e.g. invoke
            // vscode itself. We do not want to open these links
            // in a new window because that would leave a blank
            // window to the user, but using `window.location.href`
            // will trigger the `beforeunload`.
            this.openerService.setDefaultExternalOpener({
                openExternal: async (href) => {
                    let isAllowedOpener = false;
                    if (this.browserEnvironmentService.options?.openerAllowedExternalUrlPrefixes) {
                        for (const trustedPopupPrefix of this.browserEnvironmentService.options.openerAllowedExternalUrlPrefixes) {
                            if (href.startsWith(trustedPopupPrefix)) {
                                isAllowedOpener = true;
                                break;
                            }
                        }
                    }
                    // HTTP(s): open in new window and deal with potential popup blockers
                    if ((0, network_1.matchesScheme)(href, network_1.Schemas.http) || (0, network_1.matchesScheme)(href, network_1.Schemas.https)) {
                        if (browser_1.isSafari) {
                            const opened = (0, dom_1.windowOpenWithSuccess)(href, !isAllowedOpener);
                            if (!opened) {
                                await this.dialogService.prompt({
                                    type: severity_1.default.Warning,
                                    message: (0, nls_1.localize)('unableToOpenExternal', "The browser interrupted the opening of a new tab or window. Press 'Open' to open it anyway."),
                                    detail: href,
                                    buttons: [
                                        {
                                            label: (0, nls_1.localize)({ key: 'open', comment: ['&& denotes a mnemonic'] }, "&&Open"),
                                            run: () => isAllowedOpener ? (0, dom_1.windowOpenPopup)(href) : (0, dom_1.windowOpenNoOpener)(href)
                                        },
                                        {
                                            label: (0, nls_1.localize)({ key: 'learnMore', comment: ['&& denotes a mnemonic'] }, "&&Learn More"),
                                            run: () => this.openerService.open(uri_1.URI.parse('https://aka.ms/allow-vscode-popup'))
                                        }
                                    ],
                                    cancelButton: true
                                });
                            }
                        }
                        else {
                            isAllowedOpener
                                ? (0, dom_1.windowOpenPopup)(href)
                                : (0, dom_1.windowOpenNoOpener)(href);
                        }
                    }
                    // Anything else: set location to trigger protocol handler in the browser
                    // but make sure to signal this as an expected unload and disable unload
                    // handling explicitly to prevent the workbench from going down.
                    else {
                        const invokeProtocolHandler = () => {
                            this.lifecycleService.withExpectedShutdown({ disableShutdownHandling: true }, () => window_1.mainWindow.location.href = href);
                        };
                        invokeProtocolHandler();
                        const showProtocolUrlOpenedDialog = async () => {
                            const { downloadUrl } = this.productService;
                            let detail;
                            const buttons = [
                                {
                                    label: (0, nls_1.localize)({ key: 'openExternalDialogButtonRetry.v2', comment: ['&& denotes a mnemonic'] }, "&&Try Again"),
                                    run: () => invokeProtocolHandler()
                                }
                            ];
                            if (downloadUrl !== undefined) {
                                detail = (0, nls_1.localize)('openExternalDialogDetail.v2', "We launched {0} on your computer.\n\nIf {1} did not launch, try again or install it below.", this.productService.nameLong, this.productService.nameLong);
                                buttons.push({
                                    label: (0, nls_1.localize)({ key: 'openExternalDialogButtonInstall.v3', comment: ['&& denotes a mnemonic'] }, "&&Install"),
                                    run: async () => {
                                        await this.openerService.open(uri_1.URI.parse(downloadUrl));
                                        // Re-show the dialog so that the user can come back after installing and try again
                                        showProtocolUrlOpenedDialog();
                                    }
                                });
                            }
                            else {
                                detail = (0, nls_1.localize)('openExternalDialogDetailNoInstall', "We launched {0} on your computer.\n\nIf {1} did not launch, try again below.", this.productService.nameLong, this.productService.nameLong);
                            }
                            // While this dialog shows, closing the tab will not display a confirmation dialog
                            // to avoid showing the user two dialogs at once
                            await this.hostService.withExpectedShutdown(() => this.dialogService.prompt({
                                type: severity_1.default.Info,
                                message: (0, nls_1.localize)('openExternalDialogTitle', "All done. You can close this tab now."),
                                detail,
                                buttons,
                                cancelButton: true
                            }));
                        };
                        // We cannot know whether the protocol handler succeeded.
                        // Display guidance in case it did not, e.g. the app is not installed locally.
                        if ((0, network_1.matchesScheme)(href, this.productService.urlProtocol)) {
                            await showProtocolUrlOpenedDialog();
                        }
                    }
                    return true;
                }
            });
        }
        registerLabelFormatters() {
            this._register(this.labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeUserData,
                priority: true,
                formatting: {
                    label: '(Settings) ${path}',
                    separator: '/',
                }
            }));
        }
        registerCommands() {
            // Allow extensions to request USB devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestUsbDevice', async (_accessor, options) => {
                return (0, deviceAccess_1.requestUsbDevice)(options);
            });
            // Allow extensions to request Serial devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestSerialPort', async (_accessor, options) => {
                return (0, deviceAccess_1.requestSerialPort)(options);
            });
            // Allow extensions to request HID devices in Web
            commands_1.CommandsRegistry.registerCommand('workbench.experimental.requestHidDevice', async (_accessor, options) => {
                return (0, deviceAccess_1.requestHidDevice)(options);
            });
        }
    };
    exports.BrowserWindow = BrowserWindow;
    exports.BrowserWindow = BrowserWindow = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, dialogs_1.IDialogService),
        __param(3, label_1.ILabelService),
        __param(4, productService_1.IProductService),
        __param(5, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, host_1.IHostService)
    ], BrowserWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci93aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCekYsSUFBZSxVQUFVLEdBQXpCLE1BQWUsVUFBVyxTQUFRLHNCQUFVOztpQkFFbkMsb0JBQWUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLEFBQTFCLENBQTJCLEdBQUMseURBQXlEO2lCQUMzRix3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBNEIsQUFBdEMsQ0FBdUM7UUFFbEYsWUFDQyxZQUF3QixFQUN4QixHQUFHLEdBQUcsRUFBRSxlQUFlLEVBQWYscUJBQWUsRUFBRSxVQUFVLEVBQVYsZ0JBQVUsRUFBRSxFQUNKLFdBQXlCLEVBQ1Qsa0JBQWdEO1lBRWpHLEtBQUssRUFBRSxDQUFDO1lBSHlCLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ1QsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUlqRyxJQUFJLENBQUMsK0JBQStCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLDZCQUE2QixDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztZQUV0RCxJQUFJLENBQUMsMkJBQTJCLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxxREFBcUQ7UUFFM0MsK0JBQStCLENBQUMsWUFBd0I7WUFDakUsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1lBRS9ELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztZQUNsQixZQUFZLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsVUFBNkIsT0FBa0M7Z0JBRXpHLHNEQUFzRDtnQkFDdEQs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