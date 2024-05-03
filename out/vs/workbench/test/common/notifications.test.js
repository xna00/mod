/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/notifications", "vs/base/common/actions", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/workbench/services/notification/common/notificationService", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/async", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, notifications_1, actions_1, notification_1, errorMessage_1, notificationService_1, workbenchTestServices_1, async_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notifications', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const noFilter = { global: notification_1.NotificationsFilter.OFF, sources: new Map() };
        teardown(() => {
            disposables.clear();
        });
        test('Items', () => {
            // Invalid
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: '' }, noFilter));
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: null }, noFilter));
            // Duplicates
            const item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            const item2 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            const item3 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Info, message: 'Info Message' }, noFilter);
            const item4 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', source: 'Source' }, noFilter);
            const item5 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] } }, noFilter);
            const item6 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] }, progress: { infinite: true } }, noFilter);
            assert.strictEqual(item1.equals(item1), true);
            assert.strictEqual(item2.equals(item2), true);
            assert.strictEqual(item3.equals(item3), true);
            assert.strictEqual(item4.equals(item4), true);
            assert.strictEqual(item5.equals(item5), true);
            assert.strictEqual(item1.equals(item2), true);
            assert.strictEqual(item1.equals(item3), false);
            assert.strictEqual(item1.equals(item4), false);
            assert.strictEqual(item1.equals(item5), false);
            const itemId1 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Info Message', severity: notification_1.Severity.Info }, noFilter);
            const itemId2 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Error Message', severity: notification_1.Severity.Error }, noFilter);
            assert.strictEqual(itemId1.equals(itemId2), true);
            assert.strictEqual(itemId1.equals(item3), false);
            // Progress
            assert.strictEqual(item1.hasProgress, false);
            assert.strictEqual(item6.hasProgress, true);
            // Message Box
            assert.strictEqual(item5.canCollapse, false);
            assert.strictEqual(item5.expanded, true);
            // Events
            let called = 0;
            disposables.add(item1.onDidChangeExpansion(() => {
                called++;
            }));
            item1.expand();
            item1.expand();
            item1.collapse();
            item1.collapse();
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 3 /* NotificationViewItemContentChangeKind.PROGRESS */) {
                    called++;
                }
            }));
            item1.progress.infinite();
            item1.progress.done();
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    called++;
                }
            }));
            item1.updateMessage('message update');
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 0 /* NotificationViewItemContentChangeKind.SEVERITY */) {
                    called++;
                }
            }));
            item1.updateSeverity(notification_1.Severity.Error);
            called = 0;
            disposables.add(item1.onDidChangeContent(e => {
                if (e.kind === 2 /* NotificationViewItemContentChangeKind.ACTIONS */) {
                    called++;
                }
            }));
            item1.updateActions({ primary: [disposables.add(new actions_1.Action('id2', 'label'))] });
            assert.strictEqual(called, 1);
            called = 0;
            disposables.add(item1.onDidChangeVisibility(e => {
                called++;
            }));
            item1.updateVisibility(true);
            item1.updateVisibility(false);
            item1.updateVisibility(false);
            assert.strictEqual(called, 2);
            called = 0;
            disposables.add(item1.onDidClose(() => {
                called++;
            }));
            item1.close();
            assert.strictEqual(called, 1);
            // Error with Action
            const item7 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: (0, errorMessage_1.createErrorWithActions)('Hello Error', [disposables.add(new actions_1.Action('id', 'label'))]) }, noFilter);
            assert.strictEqual(item7.actions.primary.length, 1);
            // Filter
            const item8 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, { global: notification_1.NotificationsFilter.OFF, sources: new Map() });
            assert.strictEqual(item8.priority, notification_1.NotificationPriority.DEFAULT);
            const item9 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, { global: notification_1.NotificationsFilter.ERROR, sources: new Map() });
            assert.strictEqual(item9.priority, notification_1.NotificationPriority.DEFAULT);
            const item10 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message' }, { global: notification_1.NotificationsFilter.ERROR, sources: new Map() });
            assert.strictEqual(item10.priority, notification_1.NotificationPriority.SILENT);
            const sources = new Map();
            sources.set('test.source', notification_1.NotificationsFilter.ERROR);
            const item11 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: 'test.source' }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item11.priority, notification_1.NotificationPriority.DEFAULT);
            const item12 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: { id: 'test.source', label: 'foo' } }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item12.priority, notification_1.NotificationPriority.SILENT);
            const item13 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message', source: { id: 'test.source2', label: 'foo' } }, { global: notification_1.NotificationsFilter.OFF, sources });
            assert.strictEqual(item13.priority, notification_1.NotificationPriority.DEFAULT);
            for (const item of [item1, item2, item3, item4, item5, item6, itemId1, itemId2, item7, item8, item9, item10, item11, item12, item13]) {
                item.close();
            }
        });
        test('Items - does not fire changed when message did not change (content, severity)', async () => {
            const item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, noFilter);
            let fired = false;
            disposables.add(item1.onDidChangeContent(() => {
                fired = true;
            }));
            item1.updateMessage('Error Message');
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
            item1.updateSeverity(notification_1.Severity.Error);
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
            for (const item of [item1]) {
                item.close();
            }
        });
        test('Model', () => {
            const model = disposables.add(new notifications_1.NotificationsModel());
            let lastNotificationEvent;
            disposables.add(model.onDidChangeNotification(e => {
                lastNotificationEvent = e;
            }));
            let lastStatusMessageEvent;
            disposables.add(model.onDidChangeStatusMessage(e => {
                lastStatusMessageEvent = e;
            }));
            const item1 = { severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [disposables.add(new actions_1.Action('id', 'label'))] } };
            const item2 = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            const item2Duplicate = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            const item3 = { severity: notification_1.Severity.Info, message: 'Info Message' };
            const item1Handle = model.addNotification(item1);
            assert.strictEqual(lastNotificationEvent.item.severity, item1.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item1.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item1Handle.updateMessage('Different Error Message');
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 1 /* NotificationViewItemContentChangeKind.MESSAGE */);
            item1Handle.updateSeverity(notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 0 /* NotificationViewItemContentChangeKind.SEVERITY */);
            item1Handle.updateActions({ primary: [], secondary: [] });
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 2 /* NotificationViewItemContentChangeKind.ACTIONS */);
            item1Handle.progress.infinite();
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 3 /* NotificationViewItemContentChangeKind.PROGRESS */);
            const item2Handle = model.addNotification(item2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            const item3Handle = model.addNotification(item3);
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            assert.strictEqual(model.notifications.length, 3);
            let called = 0;
            disposables.add(item1Handle.onDidClose(() => {
                called++;
            }));
            item1Handle.close();
            assert.strictEqual(called, 1);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), 'Different Error Message');
            assert.strictEqual(lastNotificationEvent.index, 2);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            const item2DuplicateHandle = model.addNotification(item2Duplicate);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item2Handle.close();
            assert.strictEqual(model.notifications.length, 1);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            model.notifications[0].expand();
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 2 /* NotificationChangeType.EXPAND_COLLAPSE */);
            const disposable = model.showStatusMessage('Hello World');
            assert.strictEqual(model.statusMessage.message, 'Hello World');
            assert.strictEqual(lastStatusMessageEvent.item.message, model.statusMessage.message);
            assert.strictEqual(lastStatusMessageEvent.kind, 0 /* StatusMessageChangeType.ADD */);
            disposable.dispose();
            assert.ok(!model.statusMessage);
            assert.strictEqual(lastStatusMessageEvent.kind, 1 /* StatusMessageChangeType.REMOVE */);
            const disposable2 = model.showStatusMessage('Hello World 2');
            const disposable3 = model.showStatusMessage('Hello World 3');
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable2.dispose();
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable3.dispose();
            assert.ok(!model.statusMessage);
            item2DuplicateHandle.close();
            item3Handle.close();
        });
        test('Service', async () => {
            const service = disposables.add(new notificationService_1.NotificationService(disposables.add(new workbenchTestServices_1.TestStorageService())));
            let addNotificationCount = 0;
            let notification;
            disposables.add(service.onDidAddNotification(n => {
                addNotificationCount++;
                notification = n;
            }));
            service.info('hello there');
            assert.strictEqual(addNotificationCount, 1);
            assert.strictEqual(notification.message, 'hello there');
            assert.strictEqual(notification.priority, notification_1.NotificationPriority.DEFAULT);
            assert.strictEqual(notification.source, undefined);
            service.model.notifications[0].close();
            let notificationHandle = service.notify({ message: 'important message', severity: notification_1.Severity.Warning });
            assert.strictEqual(addNotificationCount, 2);
            assert.strictEqual(notification.message, 'important message');
            assert.strictEqual(notification.severity, notification_1.Severity.Warning);
            let removeNotificationCount = 0;
            disposables.add(service.onDidRemoveNotification(n => {
                removeNotificationCount++;
                notification = n;
            }));
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 1);
            assert.strictEqual(notification.message, 'important message');
            notificationHandle = service.notify({ priority: notification_1.NotificationPriority.SILENT, message: 'test', severity: notification_1.Severity.Ignore });
            assert.strictEqual(addNotificationCount, 3);
            assert.strictEqual(notification.message, 'test');
            assert.strictEqual(notification.priority, notification_1.NotificationPriority.SILENT);
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 2);
            notificationHandle.close();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvdGVzdC9jb21tb24vbm90aWZpY2F0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLE1BQU0sUUFBUSxHQUF5QixFQUFFLE1BQU0sRUFBRSxrQ0FBbUIsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksR0FBRyxFQUFFLEVBQUUsQ0FBQztRQUUvRixRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFFbEIsVUFBVTtZQUNWLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxvQ0FBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDN0YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLG9DQUFvQixDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUVoRyxhQUFhO1lBQ2IsTUFBTSxLQUFLLEdBQUcsb0NBQW9CLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsRUFBRSxRQUFRLENB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