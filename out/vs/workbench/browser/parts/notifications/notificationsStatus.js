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
define(["require", "exports", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/lifecycle", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/nls", "vs/platform/notification/common/notification"], function (require, exports, statusbar_1, lifecycle_1, notificationsCommands_1, nls_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsStatus = void 0;
    let NotificationsStatus = class NotificationsStatus extends lifecycle_1.Disposable {
        constructor(model, statusbarService, notificationService) {
            super();
            this.model = model;
            this.statusbarService = statusbarService;
            this.notificationService = notificationService;
            this.newNotificationsCount = 0;
            this.isNotificationsCenterVisible = false;
            this.isNotificationsToastsVisible = false;
            this.updateNotificationsCenterStatusItem();
            if (model.statusMessage) {
                this.doSetStatusMessage(model.statusMessage);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
            this._register(this.model.onDidChangeStatusMessage(e => this.onDidChangeStatusMessage(e)));
            this._register(this.notificationService.onDidChangeFilter(() => this.updateNotificationsCenterStatusItem()));
        }
        onDidChangeNotification(e) {
            // Consider a notification as unread as long as it only
            // appeared as toast and not in the notification center
            if (!this.isNotificationsCenterVisible) {
                if (e.kind === 0 /* NotificationChangeType.ADD */) {
                    this.newNotificationsCount++;
                }
                else if (e.kind === 3 /* NotificationChangeType.REMOVE */ && this.newNotificationsCount > 0) {
                    this.newNotificationsCount--;
                }
            }
            // Update in status bar
            this.updateNotificationsCenterStatusItem();
        }
        updateNotificationsCenterStatusItem() {
            // Figure out how many notifications have progress only if neither
            // toasts are visible nor center is visible. In that case we still
            // want to give a hint to the user that something is running.
            let notificationsInProgress = 0;
            if (!this.isNotificationsCenterVisible && !this.isNotificationsToastsVisible) {
                for (const notification of this.model.notifications) {
                    if (notification.hasProgress) {
                        notificationsInProgress++;
                    }
                }
            }
            // Show the status bar entry depending on do not disturb setting
            let statusProperties = {
                name: (0, nls_1.localize)('status.notifications', "Notifications"),
                text: `${notificationsInProgress > 0 || this.newNotificationsCount > 0 ? '$(bell-dot)' : '$(bell)'}`,
                ariaLabel: (0, nls_1.localize)('status.notifications', "Notifications"),
                command: this.isNotificationsCenterVisible ? notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER : notificationsCommands_1.SHOW_NOTIFICATIONS_CENTER,
                tooltip: this.getTooltip(notificationsInProgress),
                showBeak: this.isNotificationsCenterVisible
            };
            if (this.notificationService.getFilter() === notification_1.NotificationsFilter.ERROR) {
                statusProperties = {
                    ...statusProperties,
                    text: `${notificationsInProgress > 0 || this.newNotificationsCount > 0 ? '$(bell-slash-dot)' : '$(bell-slash)'}`,
                    ariaLabel: (0, nls_1.localize)('status.doNotDisturb', "Do Not Disturb"),
                    tooltip: (0, nls_1.localize)('status.doNotDisturbTooltip', "Do Not Disturb Mode is Enabled")
                };
            }
            if (!this.notificationsCenterStatusItem) {
                this.notificationsCenterStatusItem = this.statusbarService.addEntry(statusProperties, 'status.notifications', 1 /* StatusbarAlignment.RIGHT */, -Number.MAX_VALUE /* towards the far end of the right hand side */);
            }
            else {
                this.notificationsCenterStatusItem.update(statusProperties);
            }
        }
        getTooltip(notificationsInProgress) {
            if (this.isNotificationsCenterVisible) {
                return (0, nls_1.localize)('hideNotifications', "Hide Notifications");
            }
            if (this.model.notifications.length === 0) {
                return (0, nls_1.localize)('zeroNotifications', "No Notifications");
            }
            if (notificationsInProgress === 0) {
                if (this.newNotificationsCount === 0) {
                    return (0, nls_1.localize)('noNotifications', "No New Notifications");
                }
                if (this.newNotificationsCount === 1) {
                    return (0, nls_1.localize)('oneNotification', "1 New Notification");
                }
                return (0, nls_1.localize)({ key: 'notifications', comment: ['{0} will be replaced by a number'] }, "{0} New Notifications", this.newNotificationsCount);
            }
            if (this.newNotificationsCount === 0) {
                return (0, nls_1.localize)({ key: 'noNotificationsWithProgress', comment: ['{0} will be replaced by a number'] }, "No New Notifications ({0} in progress)", notificationsInProgress);
            }
            if (this.newNotificationsCount === 1) {
                return (0, nls_1.localize)({ key: 'oneNotificationWithProgress', comment: ['{0} will be replaced by a number'] }, "1 New Notification ({0} in progress)", notificationsInProgress);
            }
            return (0, nls_1.localize)({ key: 'notificationsWithProgress', comment: ['{0} and {1} will be replaced by a number'] }, "{0} New Notifications ({1} in progress)", this.newNotificationsCount, notificationsInProgress);
        }
        update(isCenterVisible, isToastsVisible) {
            let updateNotificationsCenterStatusItem = false;
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                this.newNotificationsCount = 0; // Showing the notification center resets the unread counter to 0
                updateNotificationsCenterStatusItem = true;
            }
            if (this.isNotificationsToastsVisible !== isToastsVisible) {
                this.isNotificationsToastsVisible = isToastsVisible;
                updateNotificationsCenterStatusItem = true;
            }
            // Update in status bar as needed
            if (updateNotificationsCenterStatusItem) {
                this.updateNotificationsCenterStatusItem();
            }
        }
        onDidChangeStatusMessage(e) {
            const statusItem = e.item;
            switch (e.kind) {
                // Show status notification
                case 0 /* StatusMessageChangeType.ADD */:
                    this.doSetStatusMessage(statusItem);
                    break;
                // Hide status notification (if its still the current one)
                case 1 /* StatusMessageChangeType.REMOVE */:
                    if (this.currentStatusMessage && this.currentStatusMessage[0] === statusItem) {
                        (0, lifecycle_1.dispose)(this.currentStatusMessage[1]);
                        this.currentStatusMessage = undefined;
                    }
                    break;
            }
        }
        doSetStatusMessage(item) {
            const message = item.message;
            const showAfter = item.options && typeof item.options.showAfter === 'number' ? item.options.showAfter : 0;
            const hideAfter = item.options && typeof item.options.hideAfter === 'number' ? item.options.hideAfter : -1;
            // Dismiss any previous
            if (this.currentStatusMessage) {
                (0, lifecycle_1.dispose)(this.currentStatusMessage[1]);
            }
            // Create new
            let statusMessageEntry;
            let showHandle = setTimeout(() => {
                statusMessageEntry = this.statusbarService.addEntry({
                    name: (0, nls_1.localize)('status.message', "Status Message"),
                    text: message,
                    ariaLabel: message
                }, 'status.message', 0 /* StatusbarAlignment.LEFT */, -Number.MAX_VALUE /* far right on left hand side */);
                showHandle = null;
            }, showAfter);
            // Dispose function takes care of timeouts and actual entry
            let hideHandle;
            const statusMessageDispose = {
                dispose: () => {
                    if (showHandle) {
                        clearTimeout(showHandle);
                    }
                    if (hideHandle) {
                        clearTimeout(hideHandle);
                    }
                    statusMessageEntry?.dispose();
                }
            };
            if (hideAfter > 0) {
                hideHandle = setTimeout(() => statusMessageDispose.dispose(), hideAfter);
            }
            // Remember as current status message
            this.currentStatusMessage = [item, statusMessageDispose];
        }
    };
    exports.NotificationsStatus = NotificationsStatus;
    exports.NotificationsStatus = NotificationsStatus = __decorate([
        __param(1, statusbar_1.IStatusbarService),
        __param(2, notification_1.INotificationService)
    ], NotificationsStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1N0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zU3RhdHVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBVWxELFlBQ2tCLEtBQTBCLEVBQ3hCLGdCQUFvRCxFQUNqRCxtQkFBMEQ7WUFFaEYsS0FBSyxFQUFFLENBQUM7WUFKUyxVQUFLLEdBQUwsS0FBSyxDQUFxQjtZQUNQLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDaEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQVZ6RSwwQkFBcUIsR0FBRyxDQUFDLENBQUM7WUFJMUIsaUNBQTRCLEdBQVksS0FBSyxDQUFDO1lBQzlDLGlDQUE0QixHQUFZLEtBQUssQ0FBQztZQVNyRCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsQ0FBQztZQUUzQyxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDMUIsQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FB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