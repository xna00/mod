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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/progress/common/progress", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/async", "vs/workbench/services/activity/common/activity", "vs/platform/notification/common/notification", "vs/base/common/actions", "vs/base/common/event", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/base/browser/ui/dialog/dialog", "vs/platform/keybinding/common/keybinding", "vs/base/browser/dom", "vs/base/common/linkedText", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/iconLabels", "vs/platform/theme/browser/defaultStyles", "vs/css!./media/progressService"], function (require, exports, nls_1, lifecycle_1, progress_1, statusbar_1, async_1, activity_1, notification_1, actions_1, event_1, extensions_1, layoutService_1, dialog_1, keybinding_1, dom_1, linkedText_1, views_1, viewsService_1, panecomposite_1, iconLabels_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressService = void 0;
    let ProgressService = class ProgressService extends lifecycle_1.Disposable {
        constructor(activityService, paneCompositeService, viewDescriptorService, viewsService, notificationService, statusbarService, layoutService, keybindingService) {
            super();
            this.activityService = activityService;
            this.paneCompositeService = paneCompositeService;
            this.viewDescriptorService = viewDescriptorService;
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.statusbarService = statusbarService;
            this.layoutService = layoutService;
            this.keybindingService = keybindingService;
            this.windowProgressStack = [];
            this.windowProgressStatusEntry = undefined;
        }
        async withProgress(options, task, onDidCancel) {
            const { location } = options;
            const handleStringLocation = (location) => {
                const viewContainer = this.viewDescriptorService.getViewContainerById(location);
                if (viewContainer) {
                    const viewContainerLocation = this.viewDescriptorService.getViewContainerLocation(viewContainer);
                    if (viewContainerLocation !== null) {
                        return this.withPaneCompositeProgress(location, viewContainerLocation, task, { ...options, location });
                    }
                }
                if (this.viewDescriptorService.getViewDescriptorById(location) !== null) {
                    return this.withViewProgress(location, task, { ...options, location });
                }
                throw new Error(`Bad progress location: ${location}`);
            };
            if (typeof location === 'string') {
                return handleStringLocation(location);
            }
            switch (location) {
                case 15 /* ProgressLocation.Notification */: {
                    let priority = options.priority;
                    if (priority !== notification_1.NotificationPriority.URGENT) {
                        if (this.notificationService.getFilter() === notification_1.NotificationsFilter.ERROR) {
                            priority = notification_1.NotificationPriority.SILENT;
                        }
                        else if ((0, notification_1.isNotificationSource)(options.source) && this.notificationService.getFilter(options.source) === notification_1.NotificationsFilter.ERROR) {
                            priority = notification_1.NotificationPriority.SILENT;
                        }
                    }
                    return this.withNotificationProgress({ ...options, location, priority }, task, onDidCancel);
                }
                case 10 /* ProgressLocation.Window */: {
                    const type = options.type;
                    if (options.command) {
                        // Window progress with command get's shown in the status bar
                        return this.withWindowProgress({ ...options, location, type }, task);
                    }
                    // Window progress without command can be shown as silent notification
                    // which will first appear in the status bar and can then be brought to
                    // the front when clicking.
                    return this.withNotificationProgress({ delay: 150 /* default for ProgressLocation.Window */, ...options, priority: notification_1.NotificationPriority.SILENT, location: 15 /* ProgressLocation.Notification */, type }, task, onDidCancel);
                }
                case 1 /* ProgressLocation.Explorer */:
                    return this.withPaneCompositeProgress('workbench.view.explorer', 0 /* ViewContainerLocation.Sidebar */, task, { ...options, location });
                case 3 /* ProgressLocation.Scm */:
                    return handleStringLocation('workbench.scm');
                case 5 /* ProgressLocation.Extensions */:
                    return this.withPaneCompositeProgress('workbench.view.extensions', 0 /* ViewContainerLocation.Sidebar */, task, { ...options, location });
                case 20 /* ProgressLocation.Dialog */:
                    return this.withDialogProgress(options, task, onDidCancel);
                default:
                    throw new Error(`Bad progress location: ${location}`);
            }
        }
        withWindowProgress(options, callback) {
            const task = [options, new progress_1.Progress(() => this.updateWindowProgress())];
            const promise = callback(task[1]);
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                this.windowProgressStack.unshift(task);
                this.updateWindowProgress();
                // show progress for at least 150ms
                Promise.all([
                    (0, async_1.timeout)(150),
                    promise
                ]).finally(() => {
                    const idx = this.windowProgressStack.indexOf(task);
                    this.windowProgressStack.splice(idx, 1);
                    this.updateWindowProgress();
                });
            }, 150);
            // cancel delay if promise finishes below 150ms
            return promise.finally(() => clearTimeout(delayHandle));
        }
        updateWindowProgress(idx = 0) {
            // We still have progress to show
            if (idx < this.windowProgressStack.length) {
                const [options, progress] = this.windowProgressStack[idx];
                const progressTitle = options.title;
                const progressMessage = progress.value && progress.value.message;
                const progressCommand = options.command;
                let text;
                let title;
                const source = options.source && typeof options.source !== 'string' ? options.source.label : options.source;
                if (progressTitle && progressMessage) {
                    // <title>: <message>
                    text = (0, nls_1.localize)('progress.text2', "{0}: {1}", progressTitle, progressMessage);
                    title = source ? (0, nls_1.localize)('progress.title3', "[{0}] {1}: {2}", source, progressTitle, progressMessage) : text;
                }
                else if (progressTitle) {
                    // <title>
                    text = progressTitle;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressTitle) : text;
                }
                else if (progressMessage) {
                    // <message>
                    text = progressMessage;
                    title = source ? (0, nls_1.localize)('progress.title2', "[{0}]: {1}", source, progressMessage) : text;
                }
                else {
                    // no title, no message -> no progress. try with next on stack
                    this.updateWindowProgress(idx + 1);
                    return;
                }
                const statusEntryProperties = {
                    name: (0, nls_1.localize)('status.progress', "Progress Message"),
                    text,
                    showProgress: options.type || true,
                    ariaLabel: text,
                    tooltip: title,
                    command: progressCommand
                };
                if (this.windowProgressStatusEntry) {
                    this.windowProgressStatusEntry.update(statusEntryProperties);
                }
                else {
                    this.windowProgressStatusEntry = this.statusbarService.addEntry(statusEntryProperties, 'status.progress', 0 /* StatusbarAlignment.LEFT */);
                }
            }
            // Progress is done so we remove the status entry
            else {
                this.windowProgressStatusEntry?.dispose();
                this.windowProgressStatusEntry = undefined;
            }
        }
        withNotificationProgress(options, callback, onDidCancel) {
            const progressStateModel = new class extends lifecycle_1.Disposable {
                get step() { return this._step; }
                get done() { return this._done; }
                constructor() {
                    super();
                    this._onDidReport = this._register(new event_1.Emitter());
                    this.onDidReport = this._onDidReport.event;
                    this._onWillDispose = this._register(new event_1.Emitter());
                    this.onWillDispose = this._onWillDispose.event;
                    this._step = undefined;
                    this._done = false;
                    this.promise = callback(this);
                    this.promise.finally(() => {
                        this.dispose();
                    });
                }
                report(step) {
                    this._step = step;
                    this._onDidReport.fire(step);
                }
                cancel(choice) {
                    onDidCancel?.(choice);
                    this.dispose();
                }
                dispose() {
                    this._done = true;
                    this._onWillDispose.fire();
                    super.dispose();
                }
            };
            const createWindowProgress = () => {
                // Create a promise that we can resolve as needed
                // when the outside calls dispose on us
                const promise = new async_1.DeferredPromise();
                this.withWindowProgress({
                    location: 10 /* ProgressLocation.Window */,
                    title: options.title ? (0, linkedText_1.parseLinkedText)(options.title).toString() : undefined, // convert markdown links => string
                    command: 'notifications.showList',
                    type: options.type
                }, progress => {
                    function reportProgress(step) {
                        if (step.message) {
                            progress.report({
                                message: (0, linkedText_1.parseLinkedText)(step.message).toString() // convert markdown links => string
                            });
                        }
                    }
                    // Apply any progress that was made already
                    if (progressStateModel.step) {
                        reportProgress(progressStateModel.step);
                    }
                    // Continue to report progress as it happens
                    const onDidReportListener = progressStateModel.onDidReport(step => reportProgress(step));
                    promise.p.finally(() => onDidReportListener.dispose());
                    // When the progress model gets disposed, we are done as well
                    event_1.Event.once(progressStateModel.onWillDispose)(() => promise.complete());
                    return promise.p;
                });
                // Dispose means completing our promise
                return (0, lifecycle_1.toDisposable)(() => promise.complete());
            };
            const createNotification = (message, priority, increment) => {
                const notificationDisposables = new lifecycle_1.DisposableStore();
                const primaryActions = options.primaryActions ? Array.from(options.primaryActions) : [];
                const secondaryActions = options.secondaryActions ? Array.from(options.secondaryActions) : [];
                if (options.buttons) {
                    options.buttons.forEach((button, index) => {
                        const buttonAction = new class extends actions_1.Action {
                            constructor() {
                                super(`progress.button.${button}`, button, undefined, true);
                            }
                            async run() {
                                progressStateModel.cancel(index);
                            }
                        };
                        notificationDisposables.add(buttonAction);
                        primaryActions.push(buttonAction);
                    });
                }
                if (options.cancellable) {
                    const cancelAction = new class extends actions_1.Action {
                        constructor() {
                            super('progress.cancel', (0, nls_1.localize)('cancel', "Cancel"), undefined, true);
                        }
                        async run() {
                            progressStateModel.cancel();
                        }
                    };
                    notificationDisposables.add(cancelAction);
                    primaryActions.push(cancelAction);
                }
                const notification = this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, iconLabels_1.stripIcons)(message), // status entries support codicons, but notifications do not (https://github.com/microsoft/vscode/issues/145722)
                    source: options.source,
                    actions: { primary: primaryActions, secondary: secondaryActions },
                    progress: typeof increment === 'number' && increment >= 0 ? { total: 100, worked: increment } : { infinite: true },
                    priority
                });
                // Switch to window based progress once the notification
                // changes visibility to hidden and is still ongoing.
                // Remove that window based progress once the notification
                // shows again.
                let windowProgressDisposable = undefined;
                const onVisibilityChange = (visible) => {
                    // Clear any previous running window progress
                    (0, lifecycle_1.dispose)(windowProgressDisposable);
                    // Create new window progress if notification got hidden
                    if (!visible && !progressStateModel.done) {
                        windowProgressDisposable = createWindowProgress();
                    }
                };
                notificationDisposables.add(notification.onDidChangeVisibility(onVisibilityChange));
                if (priority === notification_1.NotificationPriority.SILENT) {
                    onVisibilityChange(false);
                }
                // Clear upon dispose
                event_1.Event.once(notification.onDidClose)(() => notificationDisposables.dispose());
                return notification;
            };
            const updateProgress = (notification, increment) => {
                if (typeof increment === 'number' && increment >= 0) {
                    notification.progress.total(100); // always percentage based
                    notification.progress.worked(increment);
                }
                else {
                    notification.progress.infinite();
                }
            };
            let notificationHandle;
            let notificationTimeout;
            let titleAndMessage; // hoisted to make sure a delayed notification shows the most recent message
            const updateNotification = (step) => {
                // full message (inital or update)
                if (step?.message && options.title) {
                    titleAndMessage = `${options.title}: ${step.message}`; // always prefix with overall title if we have it (https://github.com/microsoft/vscode/issues/50932)
                }
                else {
                    titleAndMessage = options.title || step?.message;
                }
                if (!notificationHandle && titleAndMessage) {
                    // create notification now or after a delay
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        if (typeof notificationTimeout !== 'number') {
                            notificationTimeout = setTimeout(() => notificationHandle = createNotification(titleAndMessage, options.priority, step?.increment), options.delay);
                        }
                    }
                    else {
                        notificationHandle = createNotification(titleAndMessage, options.priority, step?.increment);
                    }
                }
                if (notificationHandle) {
                    if (titleAndMessage) {
                        notificationHandle.updateMessage(titleAndMessage);
                    }
                    if (typeof step?.increment === 'number') {
                        updateProgress(notificationHandle, step.increment);
                    }
                }
            };
            // Show initially
            updateNotification(progressStateModel.step);
            const listener = progressStateModel.onDidReport(step => updateNotification(step));
            event_1.Event.once(progressStateModel.onWillDispose)(() => listener.dispose());
            // Clean up eventually
            (async () => {
                try {
                    // with a delay we only wait for the finish of the promise
                    if (typeof options.delay === 'number' && options.delay > 0) {
                        await progressStateModel.promise;
                    }
                    // without a delay we show the notification for at least 800ms
                    // to reduce the chance of the notification flashing up and hiding
                    else {
                        await Promise.all([(0, async_1.timeout)(800), progressStateModel.promise]);
                    }
                }
                finally {
                    clearTimeout(notificationTimeout);
                    notificationHandle?.close();
                }
            })();
            return progressStateModel.promise;
        }
        withPaneCompositeProgress(paneCompositeId, viewContainerLocation, task, options) {
            // show in viewlet
            const progressIndicator = this.paneCompositeService.getProgressIndicator(paneCompositeId, viewContainerLocation);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            // show on activity bar
            if (viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.showOnActivityBar(paneCompositeId, options, promise);
            }
            return promise;
        }
        withViewProgress(viewId, task, options) {
            // show in viewlet
            const progressIndicator = this.viewsService.getViewProgressIndicator(viewId);
            const promise = progressIndicator ? this.withCompositeProgress(progressIndicator, task, options) : task({ report: () => { } });
            const location = this.viewDescriptorService.getViewLocationById(viewId);
            if (location !== 0 /* ViewContainerLocation.Sidebar */) {
                return promise;
            }
            const viewletId = this.viewDescriptorService.getViewContainerByViewId(viewId)?.id;
            if (viewletId === undefined) {
                return promise;
            }
            // show on activity bar
            this.showOnActivityBar(viewletId, options, promise);
            return promise;
        }
        showOnActivityBar(viewletId, options, promise) {
            let activityProgress;
            let delayHandle = setTimeout(() => {
                delayHandle = undefined;
                const handle = this.activityService.showViewContainerActivity(viewletId, { badge: new activity_1.ProgressBadge(() => ''), priority: 100 });
                const startTimeVisible = Date.now();
                const minTimeVisible = 300;
                activityProgress = {
                    dispose() {
                        const d = Date.now() - startTimeVisible;
                        if (d < minTimeVisible) {
                            // should at least show for Nms
                            setTimeout(() => handle.dispose(), minTimeVisible - d);
                        }
                        else {
                            // shown long enough
                            handle.dispose();
                        }
                    }
                };
            }, options.delay || 300);
            promise.finally(() => {
                clearTimeout(delayHandle);
                (0, lifecycle_1.dispose)(activityProgress);
            });
        }
        withCompositeProgress(progressIndicator, task, options) {
            let discreteProgressRunner = undefined;
            function updateProgress(stepOrTotal) {
                // Figure out whether discrete progress applies
                // by figuring out the "total" progress to show
                // and the increment if any.
                let total = undefined;
                let increment = undefined;
                if (typeof stepOrTotal !== 'undefined') {
                    if (typeof stepOrTotal === 'number') {
                        total = stepOrTotal;
                    }
                    else if (typeof stepOrTotal.increment === 'number') {
                        total = stepOrTotal.total ?? 100; // always percentage based
                        increment = stepOrTotal.increment;
                    }
                }
                // Discrete
                if (typeof total === 'number') {
                    if (!discreteProgressRunner) {
                        discreteProgressRunner = progressIndicator.show(total, options.delay);
                        promise.catch(() => undefined /* ignore */).finally(() => discreteProgressRunner?.done());
                    }
                    if (typeof increment === 'number') {
                        discreteProgressRunner.worked(increment);
                    }
                }
                // Infinite
                else {
                    discreteProgressRunner?.done();
                    progressIndicator.showWhile(promise, options.delay);
                }
                return discreteProgressRunner;
            }
            const promise = task({
                report: progress => {
                    updateProgress(progress);
                }
            });
            updateProgress(options.total);
            return promise;
        }
        withDialogProgress(options, task, onDidCancel) {
            const disposables = new lifecycle_1.DisposableStore();
            const allowableCommands = [
                'workbench.action.quit',
                'workbench.action.reloadWindow',
                'copy',
                'cut',
                'editor.action.clipboardCopyAction',
                'editor.action.clipboardCutAction'
            ];
            let dialog;
            const createDialog = (message) => {
                const buttons = options.buttons || [];
                if (!options.sticky) {
                    buttons.push(options.cancellable ? (0, nls_1.localize)('cancel', "Cancel") : (0, nls_1.localize)('dismiss', "Dismiss"));
                }
                dialog = new dialog_1.Dialog(this.layoutService.activeContainer, message, buttons, {
                    type: 'pending',
                    detail: options.detail,
                    cancelId: buttons.length - 1,
                    disableCloseAction: options.sticky,
                    disableDefaultAction: options.sticky,
                    keyEventProcessor: (event) => {
                        const resolved = this.keybindingService.softDispatch(event, this.layoutService.activeContainer);
                        if (resolved.kind === 2 /* ResultKind.KbFound */ && resolved.commandId) {
                            if (!allowableCommands.includes(resolved.commandId)) {
                                dom_1.EventHelper.stop(event, true);
                            }
                        }
                    },
                    buttonStyles: defaultStyles_1.defaultButtonStyles,
                    checkboxStyles: defaultStyles_1.defaultCheckboxStyles,
                    inputBoxStyles: defaultStyles_1.defaultInputBoxStyles,
                    dialogStyles: defaultStyles_1.defaultDialogStyles
                });
                disposables.add(dialog);
                dialog.show().then(dialogResult => {
                    onDidCancel?.(dialogResult.button);
                    (0, lifecycle_1.dispose)(dialog);
                });
                return dialog;
            };
            // In order to support the `delay` option, we use a scheduler
            // that will guard each access to the dialog behind a delay
            // that is either the original delay for one invocation and
            // otherwise runs without delay.
            let delay = options.delay ?? 0;
            let latestMessage = undefined;
            const scheduler = disposables.add(new async_1.RunOnceScheduler(() => {
                delay = 0; // since we have run once, we reset the delay
                if (latestMessage && !dialog) {
                    dialog = createDialog(latestMessage);
                }
                else if (latestMessage) {
                    dialog.updateMessage(latestMessage);
                }
            }, 0));
            const updateDialog = function (message) {
                latestMessage = message;
                // Make sure to only run one dialog update and not multiple
                if (!scheduler.isScheduled()) {
                    scheduler.schedule(delay);
                }
            };
            const promise = task({
                report: progress => {
                    updateDialog(progress.message);
                }
            });
            promise.finally(() => {
                (0, lifecycle_1.dispose)(disposables);
            });
            if (options.title) {
                updateDialog(options.title);
            }
            return promise;
        }
    };
    exports.ProgressService = ProgressService;
    exports.ProgressService = ProgressService = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, panecomposite_1.IPaneCompositePartService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, viewsService_1.IViewsService),
        __param(4, notification_1.INotificationService),
        __param(5, statusbar_1.IStatusbarService),
        __param(6, layoutService_1.ILayoutService),
        __param(7, keybinding_1.IKeybindingService)
    ], ProgressService);
    (0, extensions_1.registerSingleton)(progress_1.IProgressService, ProgressService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvcHJvZ3Jlc3MvYnJvd3Nlci9wcm9ncmVzc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLHNCQUFVO1FBSTlDLFlBQ21CLGVBQWtELEVBQ3pDLG9CQUFnRSxFQUNuRSxxQkFBOEQsRUFDdkUsWUFBNEMsRUFDckMsbUJBQTBELEVBQzdELGdCQUFvRCxFQUN2RCxhQUE4QyxFQUMxQyxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFUMkIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQ3hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDbEQsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUN0RCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNwQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQ3pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFpRTFELHdCQUFtQixHQUF3RCxFQUFFLENBQUM7WUFDdkYsOEJBQXlCLEdBQXdDLFNBQVMsQ0FBQztRQS9EbkYsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQWMsT0FBeUIsRUFBRSxJQUF3RCxFQUFFLFdBQXVDO1lBQzNKLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFFN0IsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLFFBQWdCLEVBQUUsRUFBRTtnQkFDakQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixD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