/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/severity", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, severity_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoOpProgress = exports.NoOpNotification = exports.NotificationsFilter = exports.NeverShowAgainScope = exports.NotificationPriority = exports.INotificationService = exports.Severity = void 0;
    exports.isNotificationSource = isNotificationSource;
    exports.Severity = severity_1.default;
    exports.INotificationService = (0, instantiation_1.createDecorator)('notificationService');
    var NotificationPriority;
    (function (NotificationPriority) {
        /**
         * Default priority: notification will be visible unless do not disturb mode is enabled.
         */
        NotificationPriority[NotificationPriority["DEFAULT"] = 0] = "DEFAULT";
        /**
         * Silent priority: notification will only be visible from the notifications center.
         */
        NotificationPriority[NotificationPriority["SILENT"] = 1] = "SILENT";
        /**
         * Urgent priority: notification will be visible even when do not disturb mode is enabled.
         */
        NotificationPriority[NotificationPriority["URGENT"] = 2] = "URGENT";
    })(NotificationPriority || (exports.NotificationPriority = NotificationPriority = {}));
    var NeverShowAgainScope;
    (function (NeverShowAgainScope) {
        /**
         * Will never show this notification on the current workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["WORKSPACE"] = 0] = "WORKSPACE";
        /**
         * Will never show this notification on any workspace of the same
         * profile again.
         */
        NeverShowAgainScope[NeverShowAgainScope["PROFILE"] = 1] = "PROFILE";
        /**
         * Will never show this notification on any workspace across all
         * profiles again.
         */
        NeverShowAgainScope[NeverShowAgainScope["APPLICATION"] = 2] = "APPLICATION";
    })(NeverShowAgainScope || (exports.NeverShowAgainScope = NeverShowAgainScope = {}));
    function isNotificationSource(thing) {
        if (thing) {
            const candidate = thing;
            return typeof candidate.id === 'string' && typeof candidate.label === 'string';
        }
        return false;
    }
    var NotificationsFilter;
    (function (NotificationsFilter) {
        /**
         * No filter is enabled.
         */
        NotificationsFilter[NotificationsFilter["OFF"] = 0] = "OFF";
        /**
         * All notifications are silent except error notifications.
        */
        NotificationsFilter[NotificationsFilter["ERROR"] = 1] = "ERROR";
    })(NotificationsFilter || (exports.NotificationsFilter = NotificationsFilter = {}));
    class NoOpNotification {
        constructor() {
            this.progress = new NoOpProgress();
            this.onDidClose = event_1.Event.None;
            this.onDidChangeVisibility = event_1.Event.None;
        }
        updateSeverity(severity) { }
        updateMessage(message) { }
        updateActions(actions) { }
        close() { }
    }
    exports.NoOpNotification = NoOpNotification;
    class NoOpProgress {
        infinite() { }
        done() { }
        total(value) { }
        worked(value) { }
    }
    exports.NoOpProgress = NoOpProgress;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9ub3RpZmljYXRpb24vY29tbW9uL25vdGlmaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2R2hHLG9EQVFDO0lBN0dhLFFBQUEsUUFBUSxHQUFHLGtCQUFZLENBQUM7SUFFekIsUUFBQSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFlLEVBQXVCLHFCQUFxQixDQUFDLENBQUM7SUFJakcsSUFBWSxvQkFnQlg7SUFoQkQsV0FBWSxvQkFBb0I7UUFFL0I7O1dBRUc7UUFDSCxxRUFBTyxDQUFBO1FBRVA7O1dBRUc7UUFDSCxtRUFBTSxDQUFBO1FBRU47O1dBRUc7UUFDSCxtRUFBTSxDQUFBO0lBQ1AsQ0FBQyxFQWhCVyxvQkFBb0Isb0NBQXBCLG9CQUFvQixRQWdCL0I7SUF5QkQsSUFBWSxtQkFrQlg7SUFsQkQsV0FBWSxtQkFBbUI7UUFFOUI7O1dBRUc7UUFDSCx1RUFBUyxDQUFBO1FBRVQ7OztXQUdHO1FBQ0gsbUVBQU8sQ0FBQTtRQUVQOzs7V0FHRztRQUNILDJFQUFXLENBQUE7SUFDWixDQUFDLEVBbEJXLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBa0I5QjtJQW9DRCxTQUFnQixvQkFBb0IsQ0FBQyxLQUFjO1FBQ2xELElBQUksS0FBSyxFQUFFLENBQUM7WUFDWCxNQUFNLFNBQVMsR0FBRyxLQUE0QixDQUFDO1lBRS9DLE9BQU8sT0FBTyxTQUFTLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSSxPQUFPLFNBQVMsQ0FBQyxLQUFLLEtBQUssUUFBUSxDQUFDO1FBQ2hGLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUF1TkQsSUFBWSxtQkFXWDtJQVhELFdBQVksbUJBQW1CO1FBRTlCOztXQUVHO1FBQ0gsMkRBQUcsQ0FBQTtRQUVIOztVQUVFO1FBQ0YsK0RBQUssQ0FBQTtJQUNOLENBQUMsRUFYVyxtQkFBbUIsbUNBQW5CLG1CQUFtQixRQVc5QjtJQTBHRCxNQUFhLGdCQUFnQjtRQUE3QjtZQUVVLGFBQVEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1lBRTlCLGVBQVUsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hCLDBCQUFxQixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7UUFPN0MsQ0FBQztRQUxBLGNBQWMsQ0FBQyxRQUFrQixJQUFVLENBQUM7UUFDNUMsYUFBYSxDQUFDLE9BQTRCLElBQVUsQ0FBQztRQUNyRCxhQUFhLENBQUMsT0FBOEIsSUFBVSxDQUFDO1FBRXZELEtBQUssS0FBVyxDQUFDO0tBQ2pCO0lBWkQsNENBWUM7SUFFRCxNQUFhLFlBQVk7UUFDeEIsUUFBUSxLQUFXLENBQUM7UUFDcEIsSUFBSSxLQUFXLENBQUM7UUFDaEIsS0FBSyxDQUFDLEtBQWEsSUFBVSxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxLQUFhLElBQVUsQ0FBQztLQUMvQjtJQUxELG9DQUtDIn0=