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
define(["require", "exports", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/workbench/common/notifications", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/list/browser/listService", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/parts/notifications/notificationsTelemetry", "vs/workbench/common/contextkeys", "vs/platform/notification/common/notification", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/base/common/hash", "vs/base/common/arrays", "vs/platform/quickinput/common/quickInput", "vs/base/common/lifecycle", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, commands_1, contextkey_1, keybindingsRegistry_1, keyCodes_1, notifications_1, actions_1, nls_1, listService_1, telemetry_1, notificationsTelemetry_1, contextkeys_1, notification_1, instantiation_1, actions_2, hash_1, arrays_1, quickInput_1, lifecycle_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationActionRunner = exports.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE = exports.TOGGLE_DO_NOT_DISTURB_MODE = exports.CLEAR_ALL_NOTIFICATIONS = exports.CLEAR_NOTIFICATION = exports.ACCEPT_PRIMARY_ACTION_NOTIFICATION = exports.EXPAND_NOTIFICATION = exports.COLLAPSE_NOTIFICATION = exports.HIDE_NOTIFICATION_TOAST = exports.HIDE_NOTIFICATIONS_CENTER = exports.SHOW_NOTIFICATIONS_CENTER = void 0;
    exports.getNotificationFromContext = getNotificationFromContext;
    exports.registerNotificationCommands = registerNotificationCommands;
    // Center
    exports.SHOW_NOTIFICATIONS_CENTER = 'notifications.showList';
    exports.HIDE_NOTIFICATIONS_CENTER = 'notifications.hideList';
    const TOGGLE_NOTIFICATIONS_CENTER = 'notifications.toggleList';
    // Toasts
    exports.HIDE_NOTIFICATION_TOAST = 'notifications.hideToasts';
    const FOCUS_NOTIFICATION_TOAST = 'notifications.focusToasts';
    const FOCUS_NEXT_NOTIFICATION_TOAST = 'notifications.focusNextToast';
    const FOCUS_PREVIOUS_NOTIFICATION_TOAST = 'notifications.focusPreviousToast';
    const FOCUS_FIRST_NOTIFICATION_TOAST = 'notifications.focusFirstToast';
    const FOCUS_LAST_NOTIFICATION_TOAST = 'notifications.focusLastToast';
    // Notification
    exports.COLLAPSE_NOTIFICATION = 'notification.collapse';
    exports.EXPAND_NOTIFICATION = 'notification.expand';
    exports.ACCEPT_PRIMARY_ACTION_NOTIFICATION = 'notification.acceptPrimaryAction';
    const TOGGLE_NOTIFICATION = 'notification.toggle';
    exports.CLEAR_NOTIFICATION = 'notification.clear';
    exports.CLEAR_ALL_NOTIFICATIONS = 'notifications.clearAll';
    exports.TOGGLE_DO_NOT_DISTURB_MODE = 'notifications.toggleDoNotDisturbMode';
    exports.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE = 'notifications.toggleDoNotDisturbModeBySource';
    function getNotificationFromContext(listService, context) {
        if ((0, notifications_1.isNotificationViewItem)(context)) {
            return context;
        }
        const list = listService.lastFocusedList;
        if (list instanceof listService_1.WorkbenchList) {
            let element = list.getFocusedElements()[0];
            if (!(0, notifications_1.isNotificationViewItem)(element)) {
                if (list.isDOMFocused()) {
                    // the notification list might have received focus
                    // via keyboard and might not have a focused element.
                    // in that case just return the first element
                    // https://github.com/microsoft/vscode/issues/191705
                    element = list.element(0);
                }
            }
            if ((0, notifications_1.isNotificationViewItem)(element)) {
                return element;
            }
        }
        return undefined;
    }
    function registerNotificationCommands(center, toasts, model) {
        // Show Notifications Cneter
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.SHOW_NOTIFICATIONS_CENTER,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 44 /* KeyCode.KeyN */),
            handler: () => {
                toasts.hide();
                center.show();
            }
        });
        // Hide Notifications Center
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.HIDE_NOTIFICATIONS_CENTER,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
            when: contextkeys_1.NotificationsCenterVisibleContext,
            primary: 9 /* KeyCode.Escape */,
            handler: accessor => {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                for (const notification of model.notifications) {
                    if (notification.visible) {
                        telemetryService.publicLog2('notification:hide', (0, notificationsTelemetry_1.notificationToMetrics)(notification.message.original, notification.sourceId, notification.priority === notification_1.NotificationPriority.SILENT));
                    }
                }
                center.hide();
            }
        });
        // Toggle Notifications Center
        commands_1.CommandsRegistry.registerCommand(TOGGLE_NOTIFICATIONS_CENTER, () => {
            if (center.isVisible) {
                center.hide();
            }
            else {
                toasts.hide();
                center.show();
            }
        });
        // Clear Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLEAR_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 20 /* KeyCode.Delete */,
            mac: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
            },
            handler: (accessor, args) => {
                const accessibilitySignalService = accessor.get(accessibilitySignalService_1.IAccessibilitySignalService);
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification && !notification.hasProgress) {
                    notification.close();
                    accessibilitySignalService.playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
                }
            }
        });
        // Expand Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.EXPAND_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 17 /* KeyCode.RightArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                notification?.expand();
            }
        });
        // Accept Primary Action
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.ACCEPT_PRIMARY_ACTION_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.or(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 31 /* KeyCode.KeyA */,
            handler: (accessor) => {
                const actionRunner = accessor.get(instantiation_1.IInstantiationService).createInstance(NotificationActionRunner);
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService)) || (0, arrays_1.firstOrDefault)(model.notifications);
                if (!notification) {
                    return;
                }
                const primaryAction = notification.actions?.primary ? (0, arrays_1.firstOrDefault)(notification.actions.primary) : undefined;
                if (!primaryAction) {
                    return;
                }
                actionRunner.run(primaryAction, notification);
                notification.close();
            }
        });
        // Collapse Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COLLAPSE_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 15 /* KeyCode.LeftArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                notification?.collapse();
            }
        });
        // Toggle Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: TOGGLE_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 10 /* KeyCode.Space */,
            secondary: [3 /* KeyCode.Enter */],
            handler: accessor => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService));
                notification?.toggle();
            }
        });
        // Hide Toasts
        commands_1.CommandsRegistry.registerCommand(exports.HIDE_NOTIFICATION_TOAST, accessor => {
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            for (const notification of model.notifications) {
                if (notification.visible) {
                    telemetryService.publicLog2('notification:hide', (0, notificationsTelemetry_1.notificationToMetrics)(notification.message.original, notification.sourceId, notification.priority === notification_1.NotificationPriority.SILENT));
                }
            }
            toasts.hide();
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: exports.HIDE_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ - 50, // lower when not focused (e.g. let editor suggest win over this command)
            when: contextkeys_1.NotificationsToastsVisibleContext,
            primary: 9 /* KeyCode.Escape */
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: exports.HIDE_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100, // higher when focused
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationsToastsVisibleContext, contextkeys_1.NotificationFocusedContext),
            primary: 9 /* KeyCode.Escape */
        });
        // Focus Toasts
        commands_1.CommandsRegistry.registerCommand(FOCUS_NOTIFICATION_TOAST, () => toasts.focus());
        // Focus Next Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_NEXT_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 18 /* KeyCode.DownArrow */,
            handler: () => {
                toasts.focusNext();
            }
        });
        // Focus Previous Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_PREVIOUS_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 16 /* KeyCode.UpArrow */,
            handler: () => {
                toasts.focusPrevious();
            }
        });
        // Focus First Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_FIRST_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 11 /* KeyCode.PageUp */,
            secondary: [14 /* KeyCode.Home */],
            handler: () => {
                toasts.focusFirst();
            }
        });
        // Focus Last Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_LAST_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 12 /* KeyCode.PageDown */,
            secondary: [13 /* KeyCode.End */],
            handler: () => {
                toasts.focusLast();
            }
        });
        // Clear All Notifications
        commands_1.CommandsRegistry.registerCommand(exports.CLEAR_ALL_NOTIFICATIONS, () => center.clearAll());
        // Toggle Do Not Disturb Mode
        commands_1.CommandsRegistry.registerCommand(exports.TOGGLE_DO_NOT_DISTURB_MODE, accessor => {
            const notificationService = accessor.get(notification_1.INotificationService);
            notificationService.setFilter(notificationService.getFilter() === notification_1.NotificationsFilter.ERROR ? notification_1.NotificationsFilter.OFF : notification_1.NotificationsFilter.ERROR);
        });
        // Configure Do Not Disturb by Source
        commands_1.CommandsRegistry.registerCommand(exports.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE, accessor => {
            const notificationService = accessor.get(notification_1.INotificationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const sortedFilters = notificationService.getFilters().sort((a, b) => a.label.localeCompare(b.label));
            const disposables = new lifecycle_1.DisposableStore();
            const picker = disposables.add(quickInputService.createQuickPick());
            picker.items = sortedFilters.map(source => ({
                id: source.id,
                label: source.label,
                tooltip: `${source.label} (${source.id})`,
                filter: source.filter
            }));
            picker.canSelectMany = true;
            picker.placeholder = (0, nls_1.localize)('selectSources', "Select sources to enable notifications for");
            picker.selectedItems = picker.items.filter(item => item.filter === notification_1.NotificationsFilter.OFF);
            picker.show();
            disposables.add(picker.onDidAccept(async () => {
                for (const item of picker.items) {
                    notificationService.setFilter({
                        id: item.id,
                        label: item.label,
                        filter: picker.selectedItems.includes(item) ? notification_1.NotificationsFilter.OFF : notification_1.NotificationsFilter.ERROR
                    });
                }
                picker.hide();
            }));
            disposables.add(picker.onDidHide(() => disposables.dispose()));
        });
        // Commands for Command Palette
        const category = (0, nls_1.localize2)('notifications', 'Notifications');
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.SHOW_NOTIFICATIONS_CENTER, title: (0, nls_1.localize2)('showNotifications', 'Show Notifications'), category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.HIDE_NOTIFICATIONS_CENTER, title: (0, nls_1.localize2)('hideNotifications', 'Hide Notifications'), category }, when: contextkeys_1.NotificationsCenterVisibleContext });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.CLEAR_ALL_NOTIFICATIONS, title: (0, nls_1.localize2)('clearAllNotifications', 'Clear All Notifications'), category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.ACCEPT_PRIMARY_ACTION_NOTIFICATION, title: (0, nls_1.localize2)('acceptNotificationPrimaryAction', 'Accept Notification Primary Action'), category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.TOGGLE_DO_NOT_DISTURB_MODE, title: (0, nls_1.localize2)('toggleDoNotDisturbMode', 'Toggle Do Not Disturb Mode'), category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.TOGGLE_DO_NOT_DISTURB_MODE_BY_SOURCE, title: (0, nls_1.localize2)('toggleDoNotDisturbModeBySource', 'Toggle Do Not Disturb Mode By Source...'), category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: FOCUS_NOTIFICATION_TOAST, title: (0, nls_1.localize2)('focusNotificationToasts', 'Focus Notification Toast'), category }, when: contextkeys_1.NotificationsToastsVisibleContext });
    }
    let NotificationActionRunner = class NotificationActionRunner extends actions_2.ActionRunner {
        constructor(telemetryService, notificationService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
        }
        async runAction(action, context) {
            this.telemetryService.publicLog2('workbenchActionExecuted', { id: action.id, from: 'message' });
            if ((0, notifications_1.isNotificationViewItem)(context)) {
                // Log some additional telemetry specifically for actions
                // that are triggered from within notifications.
                this.telemetryService.publicLog2('notification:actionExecuted', {
                    id: (0, hash_1.hash)(context.message.original.toString()).toString(),
                    actionLabel: action.label,
                    source: context.sourceId || 'core',
                    silent: context.priority === notification_1.NotificationPriority.SILENT
                });
            }
            // Run and make sure to notify on any error again
            try {
                await super.runAction(action, context);
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
    };
    exports.NotificationActionRunner = NotificationActionRunner;
    exports.NotificationActionRunner = NotificationActionRunner = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService)
    ], NotificationActionRunner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0NvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9ub3RpZmljYXRpb25zL25vdGlmaWNhdGlvbnNDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnRWhHLGdFQXdCQztJQUVELG9FQXlQQztJQTdURCxTQUFTO0lBQ0ksUUFBQSx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztJQUNyRCxRQUFBLHlCQUF5QixHQUFHLHdCQUF3QixDQUFDO0lBQ2xFLE1BQU0sMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFFL0QsU0FBUztJQUNJLFFBQUEsdUJBQXVCLEdBQUcsMEJBQTBCLENBQUM7SUFDbEUsTUFBTSx3QkFBd0IsR0FBRywyQkFBMkIsQ0FBQztJQUM3RCxNQUFNLDZCQUE2QixHQUFHLDhCQUE4QixDQUFDO0lBQ3JFLE1BQU0saUNBQWlDLEdBQUcsa0NBQWtDLENBQUM7SUFDN0UsTUFBTSw4QkFBOEIsR0FBRywrQkFBK0IsQ0FBQztJQUN2RSxNQUFNLDZCQUE2QixHQUFHLDhCQUE4QixDQUFDO0lBRXJFLGVBQWU7SUFDRixRQUFBLHFCQUFxQixHQUFHLHVCQUF1QixDQUFDO0lBQ2hELFFBQUEsbUJBQW1CLEdBQUcscUJBQXFCLENBQUM7SUFDNUMsUUFBQSxrQ0FBa0MsR0FBRyxrQ0FBa0MsQ0FBQztJQUNyRixNQUFNLG1CQUFtQixHQUFHLHFCQUFxQixDQUFDO0lBQ3JDLFFBQUEsa0JBQWtCLEdBQUcsb0JBQW9CLENBQUM7SUFDMUMsUUFBQSx1QkFBdUIsR0FBRyx3QkFBd0IsQ0FBQztJQUNuRCxRQUFBLDBCQUEwQixHQUFHLHNDQUFzQyxDQUFDO0lBQ3BFLFFBQUEsb0NBQW9DLEdBQUcsOENBQThDLENBQUM7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