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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/notifications/notificationsList", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/platform/notification/common/notification", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/base/common/types", "vs/workbench/common/contextkeys", "vs/base/browser/window", "vs/css!./media/notificationsToasts"], function (require, exports, nls_1, lifecycle_1, dom_1, instantiation_1, notificationsList_1, event_1, layoutService_1, theme_1, themeService_1, colorRegistry_1, editorGroupsService_1, contextkey_1, notification_1, lifecycle_2, host_1, async_1, types_1, contextkeys_1, window_1) {
    "use strict";
    var NotificationsToasts_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsToasts = void 0;
    var ToastVisibility;
    (function (ToastVisibility) {
        ToastVisibility[ToastVisibility["HIDDEN_OR_VISIBLE"] = 0] = "HIDDEN_OR_VISIBLE";
        ToastVisibility[ToastVisibility["HIDDEN"] = 1] = "HIDDEN";
        ToastVisibility[ToastVisibility["VISIBLE"] = 2] = "VISIBLE";
    })(ToastVisibility || (ToastVisibility = {}));
    let NotificationsToasts = class NotificationsToasts extends themeService_1.Themable {
        static { NotificationsToasts_1 = this; }
        static { this.MAX_WIDTH = 450; }
        static { this.MAX_NOTIFICATIONS = 3; }
        static { this.PURGE_TIMEOUT = {
            [notification_1.Severity.Info]: 15000,
            [notification_1.Severity.Warning]: 18000,
            [notification_1.Severity.Error]: 20000
        }; }
        static { this.SPAM_PROTECTION = {
            // Count for the number of notifications over 800ms...
            interval: 800,
            // ...and ensure we are not showing more than MAX_NOTIFICATIONS
            limit: NotificationsToasts_1.MAX_NOTIFICATIONS
        }; }
        get isVisible() { return !!this._isVisible; }
        constructor(container, model, instantiationService, layoutService, themeService, editorGroupService, contextKeyService, lifecycleService, hostService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.contextKeyService = contextKeyService;
            this.lifecycleService = lifecycleService;
            this.hostService = hostService;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._isVisible = false;
            this.mapNotificationToToast = new Map();
            this.mapNotificationToDisposable = new Map();
            this.notificationsToastsVisibleContextKey = contextkeys_1.NotificationsToastsVisibleContext.bindTo(this.contextKeyService);
            this.addedToastsIntervalCounter = new async_1.IntervalCounter(NotificationsToasts_1.SPAM_PROTECTION.interval);
            this.registerListeners();
        }
        registerListeners() {
            // Layout
            this._register(this.layoutService.onDidLayoutMainContainer(dimension => this.layout(dom_1.Dimension.lift(dimension))));
            // Delay some tasks until after we have restored
            // to reduce UI pressure from the startup phase
            this.lifecycleService.when(3 /* LifecyclePhase.Restored */).then(() => {
                // Show toast for initial notifications if any
                this.model.notifications.forEach(notification => this.addToast(notification));
                // Update toasts on notification changes
                this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            });
            // Filter
            this._register(this.model.onDidChangeFilter(({ global, sources }) => {
                if (global === notification_1.NotificationsFilter.ERROR) {
                    this.hide();
                }
                else if (sources) {
                    for (const [notification] of this.mapNotificationToToast) {
                        if (typeof notification.sourceId === 'string' && sources.get(notification.sourceId) === notification_1.NotificationsFilter.ERROR && notification.severity !== notification_1.Severity.Error && notification.priority !== notification_1.NotificationPriority.URGENT) {
                            this.removeToast(notification);
                        }
                    }
                }
            }));
        }
        onDidChangeNotification(e) {
            switch (e.kind) {
                case 0 /* NotificationChangeType.ADD */:
                    return this.addToast(e.item);
                case 3 /* NotificationChangeType.REMOVE */:
                    return this.removeToast(e.item);
            }
        }
        addToast(item) {
            if (this.isNotificationsCenterVisible) {
                return; // do not show toasts while notification center is visible
            }
            if (item.priority === notification_1.NotificationPriority.SILENT) {
                return; // do not show toasts for silenced notifications
            }
            // Optimization: it is possible that a lot of notifications are being
            // added in a very short time. To prevent this kind of spam, we protect
            // against showing too many notifications at once. Since they can always
            // be accessed from the notification center, a user can always get to
            // them later on.
            // (see also https://github.com/microsoft/vscode/issues/107935)
            if (this.addedToastsIntervalCounter.increment() > NotificationsToasts_1.SPAM_PROTECTION.limit) {
                return;
            }
            // Optimization: showing a notification toast can be expensive
            // because of the associated animation. If the renderer is busy
            // doing actual work, the animation can cause a lot of slowdown
            // As such we use `scheduleAtNextAnimationFrame` to push out
            // the toast until the renderer has time to process it.
            // (see also https://github.com/microsoft/vscode/issues/107935)
            const itemDisposables = new lifecycle_1.DisposableStore();
            this.mapNotificationToDisposable.set(item, itemDisposables);
            itemDisposables.add((0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this.container), () => this.doAddToast(item, itemDisposables)));
        }
        doAddToast(item, itemDisposables) {
            // Lazily create toasts containers
            let notificationsToastsContainer = this.notificationsToastsContainer;
            if (!notificationsToastsContainer) {
                notificationsToastsContainer = this.notificationsToastsContainer = document.createElement('div');
                notificationsToastsContainer.classList.add('notifications-toasts');
                this.container.appendChild(notificationsToastsContainer);
            }
            // Make Visible
            notificationsToastsContainer.classList.add('visible');
            // Container
            const notificationToastContainer = document.createElement('div');
            notificationToastContainer.classList.add('notification-toast-container');
            const firstToast = notificationsToastsContainer.firstChild;
            if (firstToast) {
                notificationsToastsContainer.insertBefore(notificationToastContainer, firstToast); // always first
            }
            else {
                notificationsToastsContainer.appendChild(notificationToastContainer);
            }
            // Toast
            const notificationToast = document.createElement('div');
            notificationToast.classList.add('notification-toast');
            notificationToastContainer.appendChild(notificationToast);
            // Create toast with item and show
            const notificationList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, notificationToast, {
                verticalScrollMode: 2 /* ScrollbarVisibility.Hidden */,
                widgetAriaLabel: (() => {
                    if (!item.source) {
                        return (0, nls_1.localize)('notificationAriaLabel', "{0}, notification", item.message.raw);
                    }
                    return (0, nls_1.localize)('notificationWithSourceAriaLabel', "{0}, source: {1}, notification", item.message.raw, item.source);
                })()
            });
            itemDisposables.add(notificationList);
            const toast = { item, list: notificationList, container: notificationToastContainer, toast: notificationToast };
            this.mapNotificationToToast.set(item, toast);
            // When disposed, remove as visible
            itemDisposables.add((0, lifecycle_1.toDisposable)(() => this.updateToastVisibility(toast, false)));
            // Make visible
            notificationList.show();
            // Layout lists
            const maxDimensions = this.computeMaxDimensions();
            this.layoutLists(maxDimensions.width);
            // Show notification
            notificationList.updateNotificationsList(0, 0, [item]);
            // Layout container: only after we show the notification to ensure that
            // the height computation takes the content of it into account!
            this.layoutContainer(maxDimensions.height);
            // Re-draw entire item when expansion changes to reveal or hide details
            itemDisposables.add(item.onDidChangeExpansion(() => {
                notificationList.updateNotificationsList(0, 1, [item]);
            }));
            // Handle content changes
            // - actions: re-draw to properly show them
            // - message: update notification height unless collapsed
            itemDisposables.add(item.onDidChangeContent(e => {
                switch (e.kind) {
                    case 2 /* NotificationViewItemContentChangeKind.ACTIONS */:
                        notificationList.updateNotificationsList(0, 1, [item]);
                        break;
                    case 1 /* NotificationViewItemContentChangeKind.MESSAGE */:
                        if (item.expanded) {
                            notificationList.updateNotificationHeight(item);
                        }
                        break;
                }
            }));
            // Remove when item gets closed
            event_1.Event.once(item.onDidClose)(() => {
                this.removeToast(item);
            });
            // Automatically purge non-sticky notifications
            this.purgeNotification(item, notificationToastContainer, notificationList, itemDisposables);
            // Theming
            this.updateStyles();
            // Context Key
            this.notificationsToastsVisibleContextKey.set(true);
            // Animate in
            notificationToast.classList.add('notification-fade-in');
            itemDisposables.add((0, dom_1.addDisposableListener)(notificationToast, 'transitionend', () => {
                notificationToast.classList.remove('notification-fade-in');
                notificationToast.classList.add('notification-fade-in-done');
            }));
            // Mark as visible
            item.updateVisibility(true);
            // Events
            if (!this._isVisible) {
                this._isVisible = true;
                this._onDidChangeVisibility.fire();
            }
        }
        purgeNotification(item, notificationToastContainer, notificationList, disposables) {
            // Track mouse over item
            let isMouseOverToast = false;
            disposables.add((0, dom_1.addDisposableListener)(notificationToastContainer, dom_1.EventType.MOUSE_OVER, () => isMouseOverToast = true));
            disposables.add((0, dom_1.addDisposableListener)(notificationToastContainer, dom_1.EventType.MOUSE_OUT, () => isMouseOverToast = false));
            // Install Timers to Purge Notification
            let purgeTimeoutHandle;
            let listener;
            const hideAfterTimeout = () => {
                purgeTimeoutHandle = setTimeout(() => {
                    // If the window does not have focus, we wait for the window to gain focus
                    // again before triggering the timeout again. This prevents an issue where
                    // focussing the window could immediately hide the notification because the
                    // timeout was triggered again.
                    if (!this.hostService.hasFocus) {
                        if (!listener) {
                            listener = this.hostService.onDidChangeFocus(focus => {
                                if (focus) {
                                    hideAfterTimeout();
                                }
                            });
                            disposables.add(listener);
                        }
                    }
                    // Otherwise...
                    else if (item.sticky || // never hide sticky notifications
                        notificationList.hasFocus() || // never hide notifications with focus
                        isMouseOverToast // never hide notifications under mouse
                    ) {
                        hideAfterTimeout();
                    }
                    else {
                        this.removeToast(item);
                    }
                }, NotificationsToasts_1.PURGE_TIMEOUT[item.severity]);
            };
            hideAfterTimeout();
            disposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(purgeTimeoutHandle)));
        }
        removeToast(item) {
            let focusEditor = false;
            // UI
            const notificationToast = this.mapNotificationToToast.get(item);
            if (notificationToast) {
                const toastHasDOMFocus = (0, dom_1.isAncestorOfActiveElement)(notificationToast.container);
                if (toastHasDOMFocus) {
                    focusEditor = !(this.focusNext() || this.focusPrevious()); // focus next if any, otherwise focus editor
                }
                this.mapNotificationToToast.delete(item);
            }
            // Disposables
            const notificationDisposables = this.mapNotificationToDisposable.get(item);
            if (notificationDisposables) {
                (0, lifecycle_1.dispose)(notificationDisposables);
                this.mapNotificationToDisposable.delete(item);
            }
            // Layout if we still have toasts
            if (this.mapNotificationToToast.size > 0) {
                this.layout(this.workbenchDimensions);
            }
            // Otherwise hide if no more toasts to show
            else {
                this.doHide();
                // Move focus back to editor group as needed
                if (focusEditor) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        removeToasts() {
            // Toast
            this.mapNotificationToToast.clear();
            // Disposables
            this.mapNotificationToDisposable.forEach(disposable => (0, lifecycle_1.dispose)(disposable));
            this.mapNotificationToDisposable.clear();
            this.doHide();
        }
        doHide() {
            this.notificationsToastsContainer?.classList.remove('visible');
            // Context Key
            this.notificationsToastsVisibleContextKey.set(false);
            // Events
            if (this._isVisible) {
                this._isVisible = false;
                this._onDidChangeVisibility.fire();
            }
        }
        hide() {
            const focusEditor = this.notificationsToastsContainer ? (0, dom_1.isAncestorOfActiveElement)(this.notificationsToastsContainer) : false;
            this.removeToasts();
            if (focusEditor) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        focus() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[0].list.focusFirst();
                return true;
            }
            return false;
        }
        focusNext() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const nextToast = toasts[i + 1];
                    if (nextToast) {
                        nextToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusPrevious() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const previousToast = toasts[i - 1];
                    if (previousToast) {
                        previousToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusFirst() {
            const toast = this.getToasts(ToastVisibility.VISIBLE)[0];
            if (toast) {
                toast.list.focusFirst();
                return true;
            }
            return false;
        }
        focusLast() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[toasts.length - 1].list.focusFirst();
                return true;
            }
            return false;
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Hide all toasts when the notificationcenter gets visible
                if (this.isNotificationsCenterVisible) {
                    this.removeToasts();
                }
            }
        }
        updateStyles() {
            this.mapNotificationToToast.forEach(({ toast }) => {
                const backgroundColor = this.getColor(theme_1.NOTIFICATIONS_BACKGROUND);
                toast.style.background = backgroundColor ? backgroundColor : '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                toast.style.boxShadow = widgetShadowColor ? `0 0 8px 2px ${widgetShadowColor}` : '';
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_TOAST_BORDER);
                toast.style.border = borderColor ? `1px solid ${borderColor}` : '';
            });
        }
        getToasts(state) {
            const notificationToasts = [];
            this.mapNotificationToToast.forEach(toast => {
                switch (state) {
                    case ToastVisibility.HIDDEN_OR_VISIBLE:
                        notificationToasts.push(toast);
                        break;
                    case ToastVisibility.HIDDEN:
                        if (!this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                    case ToastVisibility.VISIBLE:
                        if (this.isToastInDOM(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                }
            });
            return notificationToasts.reverse(); // from newest to oldest
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            const maxDimensions = this.computeMaxDimensions();
            // Hide toasts that exceed height
            if (maxDimensions.height) {
                this.layoutContainer(maxDimensions.height);
            }
            // Layout all lists of toasts
            this.layoutLists(maxDimensions.width);
        }
        computeMaxDimensions() {
            const maxWidth = NotificationsToasts_1.MAX_WIDTH;
            let availableWidth = maxWidth;
            let availableHeight;
            if (this.workbenchDimensions) {
                // Make sure notifications are not exceding available width
                availableWidth = this.workbenchDimensions.width;
                availableWidth -= (2 * 8); // adjust for paddings left and right
                // Make sure notifications are not exceeding available height
                availableHeight = this.workbenchDimensions.height;
                if (this.layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, window_1.mainWindow)) {
                    availableHeight -= 22; // adjust for status bar
                }
                if (this.layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_1.mainWindow)) {
                    availableHeight -= 22; // adjust for title bar
                }
                availableHeight -= (2 * 12); // adjust for paddings top and bottom
            }
            availableHeight = typeof availableHeight === 'number'
                ? Math.round(availableHeight * 0.618) // try to not cover the full height for stacked toasts
                : 0;
            return new dom_1.Dimension(Math.min(maxWidth, availableWidth), availableHeight);
        }
        layoutLists(width) {
            this.mapNotificationToToast.forEach(({ list }) => list.layout(width));
        }
        layoutContainer(heightToGive) {
            let visibleToasts = 0;
            for (const toast of this.getToasts(ToastVisibility.HIDDEN_OR_VISIBLE)) {
                // In order to measure the client height, the element cannot have display: none
                toast.container.style.opacity = '0';
                this.updateToastVisibility(toast, true);
                heightToGive -= toast.container.offsetHeight;
                let makeVisible = false;
                if (visibleToasts === NotificationsToasts_1.MAX_NOTIFICATIONS) {
                    makeVisible = false; // never show more than MAX_NOTIFICATIONS
                }
                else if (heightToGive >= 0) {
                    makeVisible = true; // hide toast if available height is too little
                }
                // Hide or show toast based on context
                this.updateToastVisibility(toast, makeVisible);
                toast.container.style.opacity = '';
                if (makeVisible) {
                    visibleToasts++;
                }
            }
        }
        updateToastVisibility(toast, visible) {
            if (this.isToastInDOM(toast) === visible) {
                return;
            }
            // Update visibility in DOM
            const notificationsToastsContainer = (0, types_1.assertIsDefined)(this.notificationsToastsContainer);
            if (visible) {
                notificationsToastsContainer.appendChild(toast.container);
            }
            else {
                notificationsToastsContainer.removeChild(toast.container);
            }
            // Update visibility in model
            toast.item.updateVisibility(visible);
        }
        isToastInDOM(toast) {
            return !!toast.container.parentElement;
        }
    };
    exports.NotificationsToasts = NotificationsToasts;
    exports.NotificationsToasts = NotificationsToasts = NotificationsToasts_1 = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, lifecycle_2.ILifecycleService),
        __param(8, host_1.IHostService)
    ], NotificationsToasts);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1RvYXN0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zVG9hc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLElBQUssZUFJSjtJQUpELFdBQUssZUFBZTtRQUNuQiwrRUFBaUIsQ0FBQTtRQUNqQix5REFBTSxDQUFBO1FBQ04sMkRBQU8sQ0FBQTtJQUNSLENBQUMsRUFKSSxlQUFlLEtBQWYsZUFBZSxRQUluQjtJQUVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsdUJBQVE7O2lCQUV4QixjQUFTLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ2hCLHNCQUFpQixHQUFHLENBQUMsQUFBSixDQUFLO2lCQUV0QixrQkFBYSxHQUFtQztZQUN2RSxDQUFDLHVCQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSztZQUN0QixDQUFDLHVCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSztZQUN6QixDQUFDLHVCQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSztTQUN2QixBQUpvQyxDQUluQztpQkFFc0Isb0JBQWUsR0FBRztZQUN6QyxzREFBc0Q7WUFDdEQsUUFBUSxFQUFFLEdBQUc7WUFDYiwrREFBK0Q7WUFDL0QsS0FBSyxFQUFFLHFCQUFtQixDQUFDLGlCQUFpQjtTQUM1QyxBQUxzQyxDQUtyQztRQU1GLElBQUksU0FBUyxLQUFjLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBYXRELFlBQ2tCLFNBQXNCLEVBQ3RCLEtBQTBCLEVBQ3BCLG9CQUE0RCxFQUMxRCxhQUF1RCxFQUNqRSxZQUEyQixFQUNwQixrQkFB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