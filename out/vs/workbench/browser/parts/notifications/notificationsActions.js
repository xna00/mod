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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/commands/common/commands", "vs/platform/clipboard/common/clipboardService", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/base/common/themables", "vs/css!./media/notificationsActions"], function (require, exports, nls_1, actions_1, notificationsCommands_1, commands_1, clipboardService_1, codicons_1, iconRegistry_1, themables_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CopyNotificationMessageAction = exports.ConfigureNotificationAction = exports.CollapseNotificationAction = exports.ExpandNotificationAction = exports.HideNotificationsCenterAction = exports.ConfigureDoNotDisturbAction = exports.ToggleDoNotDisturbBySourceAction = exports.ToggleDoNotDisturbAction = exports.ClearAllNotificationsAction = exports.ClearNotificationAction = void 0;
    const clearIcon = (0, iconRegistry_1.registerIcon)('notifications-clear', codicons_1.Codicon.close, (0, nls_1.localize)('clearIcon', 'Icon for the clear action in notifications.'));
    const clearAllIcon = (0, iconRegistry_1.registerIcon)('notifications-clear-all', codicons_1.Codicon.clearAll, (0, nls_1.localize)('clearAllIcon', 'Icon for the clear all action in notifications.'));
    const hideIcon = (0, iconRegistry_1.registerIcon)('notifications-hide', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('hideIcon', 'Icon for the hide action in notifications.'));
    const expandIcon = (0, iconRegistry_1.registerIcon)('notifications-expand', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('expandIcon', 'Icon for the expand action in notifications.'));
    const collapseIcon = (0, iconRegistry_1.registerIcon)('notifications-collapse', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('collapseIcon', 'Icon for the collapse action in notifications.'));
    const configureIcon = (0, iconRegistry_1.registerIcon)('notifications-configure', codicons_1.Codicon.gear, (0, nls_1.localize)('configureIcon', 'Icon for the configure action in notifications.'));
    const doNotDisturbIcon = (0, iconRegistry_1.registerIcon)('notifications-do-not-disturb', codicons_1.Codicon.bellSlash, (0, nls_1.localize)('doNotDisturbIcon', 'Icon for the mute all action in notifications.'));
    let ClearNotificationAction = class ClearNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.CLEAR_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('clearNotification', "Clear Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(clearIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_NOTIFICATION, notification);
        }
    };
    exports.ClearNotificationAction = ClearNotificationAction;
    exports.ClearNotificationAction = ClearNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearNotificationAction);
    let ClearAllNotificationsAction = class ClearAllNotificationsAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS; }
        static { this.LABEL = (0, nls_1.localize)('clearNotifications', "Clear All Notifications"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(clearAllIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS);
        }
    };
    exports.ClearAllNotificationsAction = ClearAllNotificationsAction;
    exports.ClearAllNotificationsAction = ClearAllNotificationsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearAllNotificationsAction);
    let ToggleDoNotDisturbAction = class ToggleDoNotDisturbAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE; }
        static { this.LABEL = (0, nls_1.localize)('toggleDoNotDisturbMode', "Toggle Do Not Disturb Mode"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(doNotDisturbIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE);
        }
    };
    exports.ToggleDoNotDisturbAction = ToggleDoNotDisturbAction;
    exports.ToggleDoNotDisturbAction = ToggleDoNotDisturbAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ToggleDoNotDisturbAction);
    let ToggleDoNotDisturbBySourceAction = class ToggleDoNotDisturbBySourceAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE; }
        static { this.LABEL = (0, nls_1.localize)('toggleDoNotDisturbModeBySource', "Toggle Do Not Disturb Mode By Source..."); }
        constructor(id, label, commandService) {
            super(id, label);
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE);
        }
    };
    exports.ToggleDoNotDisturbBySourceAction = ToggleDoNotDisturbBySourceAction;
    exports.ToggleDoNotDisturbBySourceAction = ToggleDoNotDisturbBySourceAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ToggleDoNotDisturbBySourceAction);
    class ConfigureDoNotDisturbAction extends actions_1.Action {
        static { this.ID = 'workbench.action.configureDoNotDisturbMode'; }
        static { this.LABEL = (0, nls_1.localize)('configureDoNotDisturbMode', "Configure Do Not Disturb..."); }
        constructor(id, label) {
            super(id, label, themables_1.ThemeIcon.asClassName(doNotDisturbIcon));
        }
    }
    exports.ConfigureDoNotDisturbAction = ConfigureDoNotDisturbAction;
    let HideNotificationsCenterAction = class HideNotificationsCenterAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER; }
        static { this.LABEL = (0, nls_1.localize)('hideNotificationsCenter', "Hide Notifications"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(hideIcon));
            this.commandService = commandService;
        }
        async run() {
            this.commandService.executeCommand(notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER);
        }
    };
    exports.HideNotificationsCenterAction = HideNotificationsCenterAction;
    exports.HideNotificationsCenterAction = HideNotificationsCenterAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], HideNotificationsCenterAction);
    let ExpandNotificationAction = class ExpandNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.EXPAND_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('expandNotification', "Expand Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(expandIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.EXPAND_NOTIFICATION, notification);
        }
    };
    exports.ExpandNotificationAction = ExpandNotificationAction;
    exports.ExpandNotificationAction = ExpandNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ExpandNotificationAction);
    let CollapseNotificationAction = class CollapseNotificationAction extends actions_1.Action {
        static { this.ID = notificationsCommands_1.COLLAPSE_NOTIFICATION; }
        static { this.LABEL = (0, nls_1.localize)('collapseNotification', "Collapse Notification"); }
        constructor(id, label, commandService) {
            super(id, label, themables_1.ThemeIcon.asClassName(collapseIcon));
            this.commandService = commandService;
        }
        async run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.COLLAPSE_NOTIFICATION, notification);
        }
    };
    exports.CollapseNotificationAction = CollapseNotificationAction;
    exports.CollapseNotificationAction = CollapseNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CollapseNotificationAction);
    class ConfigureNotificationAction extends actions_1.Action {
        static { this.ID = 'workbench.action.configureNotification'; }
        static { this.LABEL = (0, nls_1.localize)('configureNotification', "More Actions..."); }
        constructor(id, label, notification) {
            super(id, label, themables_1.ThemeIcon.asClassName(configureIcon));
            this.notification = notification;
        }
    }
    exports.ConfigureNotificationAction = ConfigureNotificationAction;
    let CopyNotificationMessageAction = class CopyNotificationMessageAction extends actions_1.Action {
        static { this.ID = 'workbench.action.copyNotificationMessage'; }
        static { this.LABEL = (0, nls_1.localize)('copyNotification', "Copy Text"); }
        constructor(id, label, clipboardService) {
            super(id, label);
            this.clipboardService = clipboardService;
        }
        run(notification) {
            return this.clipboardService.writeText(notification.message.raw);
        }
    };
    exports.CopyNotificationMessageAction = CopyNotificationMessageAction;
    exports.CopyNotificationMessageAction = CopyNotificationMessageAction = __decorate([
        __param(2, clipboardService_1.IClipboardService)
    ], CopyNotificationMessageAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0FjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9uc0FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0sU0FBUyxHQUFHLElBQUEsMkJBQVksRUFBQyxxQkFBcUIsRUFBRSxrQkFBTyxDQUFDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxXQUFXLEVBQUUsNkNBQTZDLENBQUMsQ0FBQyxDQUFDO0lBQzNJLE1BQU0sWUFBWSxHQUFHLElBQUEsMkJBQVksRUFBQyx5QkFBeUIsRUFBRSxrQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsaURBQWlELENBQUMsQ0FBQyxDQUFDO0lBQzVKLE1BQU0sUUFBUSxHQUFHLElBQUEsMkJBQVksRUFBQyxvQkFBb0IsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxVQUFVLEVBQUUsNENBQTRDLENBQUMsQ0FBQyxDQUFDO0lBQzdJLE1BQU0sVUFBVSxHQUFHLElBQUEsMkJBQVksRUFBQyxzQkFBc0IsRUFBRSxrQkFBTyxDQUFDLFNBQVMsRUFBRSxJQUFBLGNBQVEsRUFBQyxZQUFZLEVBQUUsOENBQThDLENBQUMsQ0FBQyxDQUFDO0lBQ25KLE1BQU0sWUFBWSxHQUFHLElBQUEsMkJBQVksRUFBQyx3QkFBd0IsRUFBRSxrQkFBTyxDQUFDLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsZ0RBQWdELENBQUMsQ0FBQyxDQUFDO0lBQzdKLE1BQU0sYUFBYSxHQUFHLElBQUEsMkJBQVksRUFBQyx5QkFBeUIsRUFBRSxrQkFBTyxDQUFDLElBQUksRUFB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