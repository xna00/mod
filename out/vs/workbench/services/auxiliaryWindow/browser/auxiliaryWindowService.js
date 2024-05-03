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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/errors", "vs/base/common/platform", "vs/platform/window/common/window", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/window", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/base/common/async", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/common/environmentService"], function (require, exports, nls_1, performance_1, event_1, dom_1, window_1, lifecycle_1, extensions_1, instantiation_1, layoutService_1, errors_1, platform_1, window_2, dialogs_1, severity_1, window_3, configuration_1, telemetry_1, async_1, host_1, environmentService_1) {
    "use strict";
    var BrowserAuxiliaryWindowService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserAuxiliaryWindowService = exports.AuxiliaryWindow = exports.IAuxiliaryWindowService = void 0;
    exports.IAuxiliaryWindowService = (0, instantiation_1.createDecorator)('auxiliaryWindowService');
    let AuxiliaryWindow = class AuxiliaryWindow extends window_3.BaseWindow {
        constructor(window, container, stylesHaveLoaded, configurationService, hostService, environmentService) {
            super(window, undefined, hostService, environmentService);
            this.window = window;
            this.container = container;
            this.configurationService = configurationService;
            this._onWillLayout = this._register(new event_1.Emitter());
            this.onWillLayout = this._onWillLayout.event;
            this._onDidLayout = this._register(new event_1.Emitter());
            this.onDidLayout = this._onDidLayout.event;
            this._onBeforeUnload = this._register(new event_1.Emitter());
            this.onBeforeUnload = this._onBeforeUnload.event;
            this._onUnload = this._register(new event_1.Emitter());
            this.onUnload = this._onUnload.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this.whenStylesHaveLoaded = stylesHaveLoaded.wait().then(() => undefined);
            this.registerListeners();
        }
        registerListeners() {
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.BEFORE_UNLOAD, (e) => this.handleBeforeUnload(e)));
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.UNLOAD, () => this.handleUnload()));
            this._register((0, dom_1.addDisposableListener)(this.window, 'unhandledrejection', e => {
                (0, errors_1.onUnexpectedError)(e.reason);
                e.preventDefault();
            }));
            this._register((0, dom_1.addDisposableListener)(this.window, dom_1.EventType.RESIZE, () => this.layout()));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.SCROLL, () => this.container.scrollTop = 0)); // Prevent container from scrolling (#55456)
            if (platform_1.isWeb) {
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DROP, e => dom_1.EventHelper.stop(e, true))); // Prevent default navigation on drop
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.WHEEL, e => e.preventDefault(), { passive: false })); // Prevent the back/forward gestures in macOS
                this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.CONTEXT_MENU, e => dom_1.EventHelper.stop(e, true))); // Prevent native context menus in web
            }
            else {
                this._register((0, dom_1.addDisposableListener)(this.window.document.body, dom_1.EventType.DRAG_OVER, (e) => dom_1.EventHelper.stop(e))); // Prevent drag feedback on <body>
                this._register((0, dom_1.addDisposableListener)(this.window.document.body, dom_1.EventType.DROP, (e) => dom_1.EventHelper.stop(e))); // Prevent default navigation on drop
            }
        }
        handleBeforeUnload(e) {
            // Check for veto from a listening component
            let veto;
            this._onBeforeUnload.fire({
                veto(reason) {
                    if (reason) {
                        veto = reason;
                    }
                }
            });
            if (veto) {
                this.handleVetoBeforeClose(e, veto);
                return;
            }
            // Check for confirm before close setting
            const confirmBeforeCloseSetting = this.configurationService.getValue('window.confirmBeforeClose');
            const confirmBeforeClose = confirmBeforeCloseSetting === 'always' || (confirmBeforeCloseSetting === 'keyboardOnly' && dom_1.ModifierKeyEmitter.getInstance().isModifierPressed);
            if (confirmBeforeClose) {
                this.confirmBeforeClose(e);
            }
        }
        handleVetoBeforeClose(e, reason) {
            this.preventUnload(e);
        }
        preventUnload(e) {
            e.preventDefault();
            e.returnValue = (0, nls_1.localize)('lifecycleVeto', "Changes that you made may not be saved. Please check press 'Cancel' and try again.");
        }
        confirmBeforeClose(e) {
            this.preventUnload(e);
        }
        handleUnload() {
            // Event
            this._onUnload.fire();
        }
        layout() {
            // Split layout up into two events so that downstream components
            // have a chance to participate in the beginning or end of the
            // layout phase.
            // This helps to build the auxiliary window in another component
            // in the `onWillLayout` phase and then let other compoments
            // react when the overall layout has finished in `onDidLayout`.
            const dimension = (0, dom_1.getClientArea)(this.window.document.body, this.container);
            this._onWillLayout.fire(dimension);
            this._onDidLayout.fire(dimension);
        }
        dispose() {
            if (this._store.isDisposed) {
                return;
            }
            this._onWillDispose.fire();
            super.dispose();
        }
    };
    exports.AuxiliaryWindow = AuxiliaryWindow;
    exports.AuxiliaryWindow = AuxiliaryWindow = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, host_1.IHostService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService)
    ], AuxiliaryWindow);
    let BrowserAuxiliaryWindowService = class BrowserAuxiliaryWindowService extends lifecycle_1.Disposable {
        static { BrowserAuxiliaryWindowService_1 = this; }
        static { this.DEFAULT_SIZE = { width: 800, height: 600 }; }
        static { this.WINDOW_IDS = (0, dom_1.getWindowId)(window_1.mainWindow) + 1; } // start from the main window ID + 1
        constructor(layoutService, dialogService, configurationService, telemetryService, hostService, environmentService) {
            super();
            this.layoutService = layoutService;
            this.dialogService = dialogService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.hostService = hostService;
            this.environmentService = environmentService;
            this._onDidOpenAuxiliaryWindow = this._register(new event_1.Emitter());
            this.onDidOpenAuxiliaryWindow = this._onDidOpenAuxiliaryWindow.event;
            this.windows = new Map();
        }
        async open(options) {
            (0, performance_1.mark)('code/auxiliaryWindow/willOpen');
            const targetWindow = await this.openWindow(options);
            if (!targetWindow) {
                throw new Error((0, nls_1.localize)('unableToOpenWindowError', "Unable to open a new window."));
            }
            // Add a `vscodeWindowId` property to identify auxiliary windows
            const resolvedWindowId = await this.resolveWindowId(targetWindow);
            (0, window_1.ensureCodeWindow)(targetWindow, resolvedWindowId);
            const containerDisposables = new lifecycle_1.DisposableStore();
            const { container, stylesLoaded } = this.createContainer(targetWindow, containerDisposables, options);
            const auxiliaryWindow = this.createAuxiliaryWindow(targetWindow, container, stylesLoaded);
            const registryDisposables = new lifecycle_1.DisposableStore();
            this.windows.set(targetWindow.vscodeWindowId, auxiliaryWindow);
            registryDisposables.add((0, lifecycle_1.toDisposable)(() => this.windows.delete(targetWindow.vscodeWindowId)));
            const eventDisposables = new lifecycle_1.DisposableStore();
            event_1.Event.once(auxiliaryWindow.onWillDispose)(() => {
                targetWindow.close();
                containerDisposables.dispose();
                registryDisposables.dispose();
                eventDisposables.dispose();
            });
            registryDisposables.add((0, dom_1.registerWindow)(targetWindow));
            this._onDidOpenAuxiliaryWindow.fire({ window: auxiliaryWindow, disposables: eventDisposables });
            (0, performance_1.mark)('code/auxiliaryWindow/didOpen');
            this.telemetryService.publicLog2('auxiliaryWindowOpen', { bounds: !!options?.bounds });
            return auxiliaryWindow;
        }
        createAuxiliaryWindow(targetWindow, container, stylesLoaded) {
            return new AuxiliaryWindow(targetWindow, container, stylesLoaded, this.configurationService, this.hostService, this.environmentService);
        }
        async openWindow(options) {
            const activeWindow = (0, dom_1.getActiveWindow)();
            const activeWindowBounds = {
                x: activeWindow.screenX,
                y: activeWindow.screenY,
                width: activeWindow.outerWidth,
                height: activeWindow.outerHeight
            };
            const width = Math.max(options?.bounds?.width ?? BrowserAuxiliaryWindowService_1.DEFAULT_SIZE.width, window_2.WindowMinimumSize.WIDTH);
            const height = Math.max(options?.bounds?.height ?? BrowserAuxiliaryWindowService_1.DEFAULT_SIZE.height, window_2.WindowMinimumSize.HEIGHT);
            let newWindowBounds = {
                x: options?.bounds?.x ?? Math.max(activeWindowBounds.x + activeWindowBounds.width / 2 - width / 2, 0),
                y: options?.bounds?.y ?? Math.max(activeWindowBounds.y + activeWindowBounds.height / 2 - height / 2, 0),
                width,
                height
            };
            if (newWindowBounds.x === activeWindowBounds.x && newWindowBounds.y === activeWindowBounds.y) {
                // Offset the new window a bit so that it does not overlap
                // with the active window
                newWindowBounds = {
                    ...newWindowBounds,
                    x: newWindowBounds.x + 30,
                    y: newWindowBounds.y + 30
                };
            }
            const auxiliaryWindow = window_1.mainWindow.open('about:blank', undefined, `popup=yes,left=${newWindowBounds.x},top=${newWindowBounds.y},width=${newWindowBounds.width},height=${newWindowBounds.height}`);
            if (!auxiliaryWindow && platform_1.isWeb) {
                return (await this.dialogService.prompt({
                    type: severity_1.default.Warning,
                    message: (0, nls_1.localize)('unableToOpenWindow', "The browser interrupted the opening of a new window. Press 'Retry' to try again."),
                    detail: (0, nls_1.localize)('unableToOpenWindowDetail', "To avoid this problem in the future, please ensure to allow popups for this website."),
                    buttons: [
                        {
                            label: (0, nls_1.localize)({ key: 'retry', comment: ['&& denotes a mnemonic'] }, "&&Retry"),
                            run: () => this.openWindow(options)
                        }
                    ],
                    cancelButton: true
                })).result;
            }
            return auxiliaryWindow?.window;
        }
        async resolveWindowId(auxiliaryWindow) {
            return BrowserAuxiliaryWindowService_1.WINDOW_IDS++;
        }
        createContainer(auxiliaryWindow, disposables, options) {
            auxiliaryWindow.document.createElement = function () {
                // Disallow `createElement` because it would create
                // HTML Elements in the "wrong" context and break
                // code that does "instanceof HTMLElement" etc.
                throw new Error('Not allowed to create elements in child window JavaScript context. Always use the main window so that "xyz instanceof HTMLElement" continues to work.');
            };
            this.applyMeta(auxiliaryWindow);
            const { stylesLoaded } = this.applyCSS(auxiliaryWindow, disposables);
            const container = this.applyHTML(auxiliaryWindow, disposables);
            return { stylesLoaded, container };
        }
        applyMeta(auxiliaryWindow) {
            for (const metaTag of ['meta[charset="utf-8"]', 'meta[http-equiv="Content-Security-Policy"]', 'meta[name="viewport"]', 'meta[name="theme-color"]']) {
                const metaElement = window_1.mainWindow.document.querySelector(metaTag);
                if (metaElement) {
                    const clonedMetaElement = (0, dom_1.createMetaElement)(auxiliaryWindow.document.head);
                    (0, dom_1.copyAttributes)(metaElement, clonedMetaElement);
                    if (metaTag === 'meta[http-equiv="Content-Security-Policy"]') {
                        const content = clonedMetaElement.getAttribute('content');
                        if (content) {
                            clonedMetaElement.setAttribute('content', content.replace(/(script-src[^\;]*)/, `script-src 'none'`));
                        }
                    }
                }
            }
            const originalIconLinkTag = window_1.mainWindow.document.querySelector('link[rel="icon"]');
            if (originalIconLinkTag) {
                const icon = (0, dom_1.createLinkElement)(auxiliaryWindow.document.head);
                (0, dom_1.copyAttributes)(originalIconLinkTag, icon);
            }
        }
        applyCSS(auxiliaryWindow, disposables) {
            (0, performance_1.mark)('code/auxiliaryWindow/willApplyCSS');
            const mapOriginalToClone = new Map();
            const stylesLoaded = new async_1.Barrier();
            stylesLoaded.wait().then(() => (0, performance_1.mark)('code/auxiliaryWindow/didLoadCSSStyles'));
            const pendingLinksDisposables = disposables.add(new lifecycle_1.DisposableStore());
            let pendingLinksToSettle = 0;
            function onLinkSettled() {
                if (--pendingLinksToSettle === 0) {
                    pendingLinksDisposables.dispose();
                    stylesLoaded.open();
                }
            }
            function cloneNode(originalNode) {
                if ((0, dom_1.isGlobalStylesheet)(originalNode)) {
                    return; // global stylesheets are handled by `cloneGlobalStylesheets` below
                }
                const clonedNode = auxiliaryWindow.document.head.appendChild(originalNode.cloneNode(true));
                if (originalNode.tagName.toLowerCase() === 'link') {
                    pendingLinksToSettle++;
                    pendingLinksDisposables.add((0, dom_1.addDisposableListener)(clonedNode, 'load', onLinkSettled));
                    pendingLinksDisposables.add((0, dom_1.addDisposableListener)(clonedNode, 'error', onLinkSettled));
                }
                mapOriginalToClone.set(originalNode, clonedNode);
            }
            // Clone all style elements and stylesheet links from the window to the child window
            // and keep track of <link> elements to settle to signal that styles have loaded
            // Increment pending links right from the beginning to ensure we only settle when
            // all style related nodes have been cloned.
            pendingLinksToSettle++;
            try {
                for (const originalNode of window_1.mainWindow.document.head.querySelectorAll('link[rel="stylesheet"], style')) {
                    cloneNode(originalNode);
                }
            }
            finally {
                onLinkSettled();
            }
            // Global stylesheets in <head> are cloned in a special way because the mutation
            // observer is not firing for changes done via `style.sheet` API. Only text changes
            // can be observed.
            disposables.add((0, dom_1.cloneGlobalStylesheets)(auxiliaryWindow));
            // Listen to new stylesheets as they are being added or removed in the main window
            // and apply to child window (including changes to existing stylesheets elements)
            disposables.add(dom_1.sharedMutationObserver.observe(window_1.mainWindow.document.head, disposables, { childList: true, subtree: true })(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type !== 'childList' || // only interested in added/removed nodes
                        mutation.target.nodeName.toLowerCase() === 'title' || // skip over title changes that happen frequently
                        mutation.target.nodeName.toLowerCase() === 'script' || // block <script> changes that are unsupported anyway
                        mutation.target.nodeName.toLowerCase() === 'meta' // do not observe <meta> elements for now
                    ) {
                        continue;
                    }
                    for (const node of mutation.addedNodes) {
                        // <style>/<link> element was added
                        if (node instanceof HTMLElement && (node.tagName.toLowerCase() === 'style' || node.tagName.toLowerCase() === 'link')) {
                            cloneNode(node);
                        }
                        // text-node was changed, try to apply to our clones
                        else if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
                            const clonedNode = mapOriginalToClone.get(node.parentNode);
                            if (clonedNode) {
                                clonedNode.textContent = node.textContent;
                            }
                        }
                    }
                    for (const node of mutation.removedNodes) {
                        const clonedNode = mapOriginalToClone.get(node);
                        if (clonedNode) {
                            clonedNode.parentNode?.removeChild(clonedNode);
                            mapOriginalToClone.delete(node);
                        }
                    }
                }
            }));
            (0, performance_1.mark)('code/auxiliaryWindow/didApplyCSS');
            return { stylesLoaded };
        }
        applyHTML(auxiliaryWindow, disposables) {
            (0, performance_1.mark)('code/auxiliaryWindow/willApplyHTML');
            // Create workbench container and apply classes
            const container = document.createElement('div');
            container.setAttribute('role', 'application');
            (0, dom_1.position)(container, 0, 0, 0, 0, 'relative');
            container.style.display = 'flex';
            container.style.height = '100%';
            container.style.flexDirection = 'column';
            auxiliaryWindow.document.body.append(container);
            // Track attributes
            disposables.add((0, dom_1.trackAttributes)(window_1.mainWindow.document.documentElement, auxiliaryWindow.document.documentElement));
            disposables.add((0, dom_1.trackAttributes)(window_1.mainWindow.document.body, auxiliaryWindow.document.body));
            disposables.add((0, dom_1.trackAttributes)(this.layoutService.mainContainer, container, ['class'])); // only class attribute
            (0, performance_1.mark)('code/auxiliaryWindow/didApplyHTML');
            return container;
        }
    };
    exports.BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService;
    exports.BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService = BrowserAuxiliaryWindowService_1 = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, dialogs_1.IDialogService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, host_1.IHostService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService)
    ], BrowserAuxiliaryWindowService);
    (0, extensions_1.registerSingleton)(exports.IAuxiliaryWindowService, BrowserAuxiliaryWindowService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5V2luZG93U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2F1eGlsaWFyeVdpbmRvdy9icm93c2VyL2F1eGlsaWFyeVdpbmRvd1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXVCbkYsUUFBQSx1QkFBdUIsR0FBRyxJQUFBLCtCQUFlLEVBQTBCLHdCQUF3QixDQUFDLENBQUM7SUF5Q25HLElBQU0sZUFBZSxHQUFyQixNQUFNLGVBQWdCLFNBQVEsbUJBQVU7UUFtQjlDLFlBQ1UsTUFBa0IsRUFDbEIsU0FBc0IsRUFDL0IsZ0JBQXlCLEVBQ0Ysb0JBQTRELEVBQ3JFLFdBQXlCLEVBQ1Qsa0JBQWdEO1lBRTlFLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBUGpELFdBQU0sR0FBTixNQUFNLENBQVk7WUFDbEIsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUVTLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFyQm5FLGtCQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBYSxDQUFDLENBQUM7WUFDakUsaUJBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztZQUVoQyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWEsQ0FBQyxDQUFDO1lBQ2hFLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFOUIsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFvQyxDQUFDLENBQUM7WUFDMUYsbUJBQWMsR0FBRyxJQUFJLENBQUMsZUFBZSxD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