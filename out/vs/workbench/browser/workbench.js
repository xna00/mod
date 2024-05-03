/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/async", "vs/base/browser/browser", "vs/base/common/performance", "vs/base/common/errors", "vs/platform/registry/common/platform", "vs/base/common/platform", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/notifications/notificationsCenter", "vs/workbench/browser/parts/notifications/notificationsAlerts", "vs/workbench/browser/parts/notifications/notificationsStatus", "vs/workbench/browser/parts/notifications/notificationsTelemetry", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsToasts", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/fontMeasurements", "vs/editor/common/config/fontInfo", "vs/base/common/errorMessage", "vs/workbench/browser/contextkeys", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiationService", "vs/workbench/browser/layout", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/base/browser/window", "vs/base/browser/pixelRatio", "vs/platform/hover/browser/hover", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/workbench/browser/style"], function (require, exports, nls_1, dom_1, event_1, async_1, browser_1, performance_1, errors_1, platform_1, platform_2, contributions_1, editor_1, extensions_1, layoutService_1, storage_1, configuration_1, lifecycle_1, notification_1, notificationsCenter_1, notificationsAlerts_1, notificationsStatus_1, notificationsTelemetry_1, notificationsCommands_1, notificationsToasts_1, aria_1, fontMeasurements_1, fontInfo_1, errorMessage_1, contextkeys_1, arrays_1, instantiationService_1, layout_1, host_1, dialogs_1, window_1, pixelRatio_1, hover_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Workbench = void 0;
    class Workbench extends layout_1.Layout {
        constructor(parent, options, serviceCollection, logService) {
            super(parent);
            this.options = options;
            this.serviceCollection = serviceCollection;
            this._onWillShutdown = this._register(new event_1.Emitter());
            this.onWillShutdown = this._onWillShutdown.event;
            this._onDidShutdown = this._register(new event_1.Emitter());
            this.onDidShutdown = this._onDidShutdown.event;
            this.previousUnexpectedError = { message: undefined, time: 0 };
            // Perf: measure workbench startup time
            (0, performance_1.mark)('code/willStartWorkbench');
            this.registerErrorHandler(logService);
        }
        registerErrorHandler(logService) {
            // Listen on unhandled rejection events
            this._register((0, dom_1.addDisposableListener)(window_1.mainWindow, 'unhandledrejection', event => {
                // See https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent
                (0, errors_1.onUnexpectedError)(event.reason);
                // Prevent the printing of this event to the console
                event.preventDefault();
            }));
            // Install handler for unexpected errors
            (0, errors_1.setUnexpectedErrorHandler)(error => this.handleUnexpectedError(error, logService));
            if (typeof window_1.mainWindow.require?.config === 'function') {
                window_1.mainWindow.require.config({
                    onError: (err) => {
                        if (err.phase === 'loading') {
                            (0, errors_1.onUnexpectedError)(new Error((0, nls_1.localize)('loaderErrorNative', "Failed to load a required file. Please restart the application to try again. Details: {0}", JSON.stringify(err))));
                        }
                        console.error(err);
                    }
                });
            }
        }
        handleUnexpectedError(error, logService) {
            const message = (0, errorMessage_1.toErrorMessage)(error, true);
            if (!message) {
                return;
            }
            const now = Date.now();
            if (message === this.previousUnexpectedError.message && now - this.previousUnexpectedError.time <= 1000) {
                return; // Return if error message identical to previous and shorter than 1 second
            }
            this.previousUnexpectedError.time = now;
            this.previousUnexpectedError.message = message;
            // Log it
            logService.error(message);
        }
        startup() {
            try {
                // Configure emitter leak warning threshold
                this._register((0, event_1.setGlobalLeakWarningThreshold)(175));
                // Services
                const instantiationService = this.initServices(this.serviceCollection);
                instantiationService.invokeFunction(accessor => {
                    const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    const hostService = accessor.get(host_1.IHostService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const notificationService = accessor.get(notification_1.INotificationService);
                    // Default Hover Delegate must be registered before creating any workbench/layout components
                    // as these possibly will use the default hover delegate
                    (0, hoverDelegateFactory_1.setHoverDelegateFactory)((placement, enableInstantHover) => instantiationService.createInstance(hover_1.WorkbenchHoverDelegate, placement, enableInstantHover, {}));
                    // Layout
                    this.initLayout(accessor);
                    // Registries
                    platform_1.Registry.as(contributions_1.Extensions.Workbench).start(accessor);
                    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).start(accessor);
                    // Context Keys
                    this._register(instantiationService.createInstance(contextkeys_1.WorkbenchContextKeysHandler));
                    // Register Listeners
                    this.registerListeners(lifecycleService, storageService, configurationService, hostService, dialogService);
                    // Render Workbench
                    this.renderWorkbench(instantiationService, notificationService, storageService, configurationService);
                    // Workbench Layout
                    this.createWorkbenchLayout();
                    // Layout
                    this.layout();
                    // Restore
                    this.restore(lifecycleService);
                });
                return instantiationService;
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
                throw error; // rethrow because this is a critical issue we cannot handle properly here
            }
        }
        initServices(serviceCollection) {
            // Layout Service
            serviceCollection.set(layoutService_1.IWorkbenchLayoutService, this);
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            //
            // NOTE: Please do NOT register services here. Use `registerSingleton()`
            //       from `workbench.common.main.ts` if the service is shared between
            //       desktop and web or `workbench.desktop.main.ts` if the service
            //       is desktop only.
            //
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // All Contributed Services
            const contributedServices = (0, extensions_1.getSingletonServiceDescriptors)();
            for (const [id, descriptor] of contributedServices) {
                serviceCollection.set(id, descriptor);
            }
            const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
            // Wrap up
            instantiationService.invokeFunction(accessor => {
                const lifecycleService = accessor.get(lifecycle_1.ILifecycleService);
                // TODO@Sandeep debt around cyclic dependencies
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                if (typeof configurationService.acquireInstantiationService === 'function') {
                    configurationService.acquireInstantiationService(instantiationService);
                }
                // Signal to lifecycle that services are set
                lifecycleService.phase = 2 /* LifecyclePhase.Ready */;
            });
            return instantiationService;
        }
        registerListeners(lifecycleService, storageService, configurationService, hostService, dialogService) {
            // Configuration changes
            this._register(configurationService.onDidChangeConfiguration(e => this.updateFontAliasing(e, configurationService)));
            // Font Info
            if (platform_2.isNative) {
                this._register(storageService.onWillSaveState(e => {
                    if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                        this.storeFontInfo(storageService);
                    }
                }));
            }
            else {
                this._register(lifecycleService.onWillShutdown(() => this.storeFontInfo(storageService)));
            }
            // Lifecycle
            this._register(lifecycleService.onWillShutdown(event => this._onWillShutdown.fire(event)));
            this._register(lifecycleService.onDidShutdown(() => {
                this._onDidShutdown.fire();
                this.dispose();
            }));
            // In some environments we do not get enough time to persist state on shutdown.
            // In other cases, VSCode might crash, so we periodically save state to reduce
            // the chance of loosing any state.
            // The window loosing focus is a good indication that the user has stopped working
            // in that window so we pick that at a time to collect state.
            this._register(hostService.onDidChangeFocus(focus => {
                if (!focus) {
                    storageService.flush();
                }
            }));
            // Dialogs showing/hiding
            this._register(dialogService.onWillShowDialog(() => this.mainContainer.classList.add('modal-dialog-visible')));
            this._register(dialogService.onDidShowDialog(() => this.mainContainer.classList.remove('modal-dialog-visible')));
        }
        updateFontAliasing(e, configurationService) {
            if (!platform_2.isMacintosh) {
                return; // macOS only
            }
            if (e && !e.affectsConfiguration('workbench.fontAliasing')) {
                return;
            }
            const aliasing = configurationService.getValue('workbench.fontAliasing');
            if (this.fontAliasing === aliasing) {
                return;
            }
            this.fontAliasing = aliasing;
            // Remove all
            const fontAliasingValues = ['antialiased', 'none', 'auto'];
            this.mainContainer.classList.remove(...fontAliasingValues.map(value => `monaco-font-aliasing-${value}`));
            // Add specific
            if (fontAliasingValues.some(option => option === aliasing)) {
                this.mainContainer.classList.add(`monaco-font-aliasing-${aliasing}`);
            }
        }
        restoreFontInfo(storageService, configurationService) {
            const storedFontInfoRaw = storageService.get('editorFontInfo', -1 /* StorageScope.APPLICATION */);
            if (storedFontInfoRaw) {
                try {
                    const storedFontInfo = JSON.parse(storedFontInfoRaw);
                    if (Array.isArray(storedFontInfo)) {
                        fontMeasurements_1.FontMeasurements.restoreFontInfo(window_1.mainWindow, storedFontInfo);
                    }
                }
                catch (err) {
                    /* ignore */
                }
            }
            fontMeasurements_1.FontMeasurements.readFontInfo(window_1.mainWindow, fontInfo_1.BareFontInfo.createFromRawSettings(configurationService.getValue('editor'), pixelRatio_1.PixelRatio.getInstance(window_1.mainWindow).value));
        }
        storeFontInfo(storageService) {
            const serializedFontInfo = fontMeasurements_1.FontMeasurements.serializeFontInfo(window_1.mainWindow);
            if (serializedFontInfo) {
                storageService.store('editorFontInfo', JSON.stringify(serializedFontInfo), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
        }
        renderWorkbench(instantiationService, notificationService, storageService, configurationService) {
            // ARIA
            (0, aria_1.setARIAContainer)(this.mainContainer);
            // State specific classes
            const platformClass = platform_2.isWindows ? 'windows' : platform_2.isLinux ? 'linux' : 'mac';
            const workbenchClasses = (0, arrays_1.coalesce)([
                'monaco-workbench',
                platformClass,
                platform_2.isWeb ? 'web' : undefined,
                browser_1.isChrome ? 'chromium' : browser_1.isFirefox ? 'firefox' : browser_1.isSafari ? 'safari' : undefined,
                ...this.getLayoutClasses(),
                ...(this.options?.extraClasses ? this.options.extraClasses : [])
            ]);
            this.mainContainer.classList.add(...workbenchClasses);
            window_1.mainWindow.document.body.classList.add(platformClass); // used by our fonts
            if (platform_2.isWeb) {
                window_1.mainWindow.document.body.classList.add('web');
            }
            // Apply font aliasing
            this.updateFontAliasing(undefined, configurationService);
            // Warm up font cache information before building up too many dom elements
            this.restoreFontInfo(storageService, configurationService);
            // Create Parts
            for (const { id, role, classes, options } of [
                { id: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, role: 'none', classes: ['titlebar'] },
                { id: "workbench.parts.banner" /* Parts.BANNER_PART */, role: 'banner', classes: ['banner'] },
                { id: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, role: 'none', classes: ['activitybar', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'left' : 'right'] }, // Use role 'none' for some parts to make screen readers less chatty #114892
                { id: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, role: 'none', classes: ['sidebar', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'left' : 'right'] },
                { id: "workbench.parts.editor" /* Parts.EDITOR_PART */, role: 'main', classes: ['editor'], options: { restorePreviousState: this.willRestoreEditors() } },
                { id: "workbench.parts.panel" /* Parts.PANEL_PART */, role: 'none', classes: ['panel', 'basepanel', (0, layoutService_1.positionToString)(this.getPanelPosition())] },
                { id: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, role: 'none', classes: ['auxiliarybar', 'basepanel', this.getSideBarPosition() === 0 /* Position.LEFT */ ? 'right' : 'left'] },
                { id: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, role: 'status', classes: ['statusbar'] }
            ]) {
                const partContainer = this.createPart(id, role, classes);
                (0, performance_1.mark)(`code/willCreatePart/${id}`);
                this.getPart(id).create(partContainer, options);
                (0, performance_1.mark)(`code/didCreatePart/${id}`);
            }
            // Notification Handlers
            this.createNotificationsHandlers(instantiationService, notificationService);
            // Add Workbench to DOM
            this.parent.appendChild(this.mainContainer);
        }
        createPart(id, role, classes) {
            const part = document.createElement(role === 'status' ? 'footer' /* Use footer element for status bar #98376 */ : 'div');
            part.classList.add('part', ...classes);
            part.id = id;
            part.setAttribute('role', role);
            if (role === 'status') {
                part.setAttribute('aria-live', 'off');
            }
            return part;
        }
        createNotificationsHandlers(instantiationService, notificationService) {
            // Instantiate Notification components
            const notificationsCenter = this._register(instantiationService.createInstance(notificationsCenter_1.NotificationsCenter, this.mainContainer, notificationService.model));
            const notificationsToasts = this._register(instantiationService.createInstance(notificationsToasts_1.NotificationsToasts, this.mainContainer, notificationService.model));
            this._register(instantiationService.createInstance(notificationsAlerts_1.NotificationsAlerts, notificationService.model));
            const notificationsStatus = instantiationService.createInstance(notificationsStatus_1.NotificationsStatus, notificationService.model);
            this._register(instantiationService.createInstance(notificationsTelemetry_1.NotificationsTelemetry));
            // Visibility
            this._register(notificationsCenter.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
                notificationsToasts.update(notificationsCenter.isVisible);
            }));
            this._register(notificationsToasts.onDidChangeVisibility(() => {
                notificationsStatus.update(notificationsCenter.isVisible, notificationsToasts.isVisible);
            }));
            // Register Commands
            (0, notificationsCommands_1.registerNotificationCommands)(notificationsCenter, notificationsToasts, notificationService.model);
            // Register with Layout
            this.registerNotifications({
                onDidChangeNotificationsVisibility: event_1.Event.map(event_1.Event.any(notificationsToasts.onDidChangeVisibility, notificationsCenter.onDidChangeVisibility), () => notificationsToasts.isVisible || notificationsCenter.isVisible)
            });
        }
        restore(lifecycleService) {
            // Ask each part to restore
            try {
                this.restoreParts();
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
            // Transition into restored phase after layout has restored
            // but do not wait indefinitely on this to account for slow
            // editors restoring. Since the workbench is fully functional
            // even when the visible editors have not resolved, we still
            // want contributions on the `Restored` phase to work before
            // slow editors have resolved. But we also do not want fast
            // editors to resolve slow when too many contributions get
            // instantiated, so we find a middle ground solution via
            // `Promise.race`
            this.whenReady.finally(() => Promise.race([
                this.whenRestored,
                (0, async_1.timeout)(2000)
            ]).finally(() => {
                // Update perf marks only when the layout is fully
                // restored. We want the time it takes to restore
                // editors to be included in these numbers
                function markDidStartWorkbench() {
                    (0, performance_1.mark)('code/didStartWorkbench');
                    performance.measure('perf: workbench create & restore', 'code/didLoadWorkbenchMain', 'code/didStartWorkbench');
                }
                if (this.isRestored()) {
                    markDidStartWorkbench();
                }
                else {
                    this.whenRestored.finally(() => markDidStartWorkbench());
                }
                // Set lifecycle phase to `Restored`
                lifecycleService.phase = 3 /* LifecyclePhase.Restored */;
                // Set lifecycle phase to `Eventually` after a short delay and when idle (min 2.5sec, max 5sec)
                const eventuallyPhaseScheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this._register((0, dom_1.runWhenWindowIdle)(window_1.mainWindow, () => lifecycleService.phase = 4 /* LifecyclePhase.Eventually */, 2500));
                }, 2500));
                eventuallyPhaseScheduler.schedule();
            }));
        }
    }
    exports.Workbench = Workbench;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci93b3JrYmVuY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcURoRyxNQUFhLFNBQVUsU0FBUSxlQUFNO1FBUXBDLFlBQ0MsTUFBbUIsRUFDRixPQUFzQyxFQUN0QyxpQkFBb0MsRUFDckQsVUFBdUI7WUFFdkIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBSkcsWUFBTyxHQUFQLE9BQU8sQ0FBK0I7WUFDdEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQVRyQyxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXFCLENBQUMsQ0FBQztZQUMzRSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBRXBDLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDN0Qsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQTBEM0MsNEJBQXVCLEdBQWtELEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFoRGhILHVDQUF1QztZQUN2QyxJQUFBLGtCQUFJLEVBQUMseUJBQXlCLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVPLG9CQUFvQixDQUFDLFVBQXVCO1lBRW5ELHVDQUF1QztZQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsMkJBQXFCLEVBQUMsbUJBQVUsRUFBRSxvQkFBb0IsRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFFOUUsNkVBQTZFO2dCQUM3RSxJ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