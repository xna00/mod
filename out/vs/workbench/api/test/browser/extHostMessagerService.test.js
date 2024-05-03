/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/browser/mainThreadMessageService", "vs/platform/notification/common/notification", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/dialogs/test/common/testDialogService", "vs/base/test/common/utils", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, mainThreadMessageService_1, notification_1, mock_1, lifecycle_1, event_1, testDialogService_1, utils_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const emptyCommandService = {
        _serviceBrand: undefined,
        onWillExecuteCommand: () => lifecycle_1.Disposable.None,
        onDidExecuteCommand: () => lifecycle_1.Disposable.None,
        executeCommand: (commandId, ...args) => {
            return Promise.resolve(undefined);
        }
    };
    const emptyNotificationService = new class {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        notify(...args) {
            throw new Error('not implemented');
        }
        info(...args) {
            throw new Error('not implemented');
        }
        warn(...args) {
            throw new Error('not implemented');
        }
        error(...args) {
            throw new Error('not implemented');
        }
        prompt(severity, message, choices, options) {
            throw new Error('not implemented');
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter() {
            throw new Error('not implemented');
        }
        getFilter(source) {
            throw new Error('not implemented');
        }
        getFilters() {
            throw new Error('not implemented');
        }
        removeFilter(sourceId) {
            throw new Error('not implemented');
        }
    };
    class EmptyNotificationService {
        constructor(withNotify) {
            this.withNotify = withNotify;
            this.filter = false;
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        notify(notification) {
            this.withNotify(notification);
            return new notification_1.NoOpNotification();
        }
        info(message) {
            throw new Error('Method not implemented.');
        }
        warn(message) {
            throw new Error('Method not implemented.');
        }
        error(message) {
            throw new Error('Method not implemented.');
        }
        prompt(severity, message, choices, options) {
            throw new Error('Method not implemented');
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter() {
            throw new Error('Method not implemented.');
        }
        getFilter(source) {
            throw new Error('Method not implemented.');
        }
        getFilters() {
            throw new Error('Method not implemented.');
        }
        removeFilter(sourceId) {
            throw new Error('Method not implemented.');
        }
    }
    suite('ExtHostMessageService', function () {
        test('propagte handle on select', async function () {
            const service = new mainThreadMessageService_1.MainThreadMessageService(null, new EmptyNotificationService(notification => {
                assert.strictEqual(notification.actions.primary.length, 1);
                queueMicrotask(() => notification.actions.primary[0].run());
            }), emptyCommandService, new testDialogService_1.TestDialogService(), new workbenchTestServices_1.TestExtensionService());
            const handle = await service.$showMessage(1, 'h', {}, [{ handle: 42, title: 'a thing', isCloseAffordance: true }]);
            assert.strictEqual(handle, 42);
            service.dispose();
        });
        suite('modal', () => {
            test('calls dialog service', async () => {
                const service = new mainThreadMessageService_1.MainThreadMessageService(null, emptyNotificationService, emptyCommandService, new class extends (0, mock_1.mock)() {
                    prompt({ type, message, buttons, cancelButton }) {
                        assert.strictEqual(type, 1);
                        assert.strictEqual(message, 'h');
                        assert.strictEqual(buttons.length, 1);
                        assert.strictEqual(cancelButton.label, 'Cancel');
                        return Promise.resolve({ result: buttons[0].run({ checkboxChecked: false }) });
                    }
                }, new workbenchTestServices_1.TestExtensionService());
                const handle = await service.$showMessage(1, 'h', { modal: true }, [{ handle: 42, title: 'a thing', isCloseAffordance: false }]);
                assert.strictEqual(handle, 42);
                service.dispose();
            });
            test('returns undefined when cancelled', async () => {
                const service = new mainThreadMessageService_1.MainThreadMessageService(null, emptyNotificationService, emptyCommandService, new class extends (0, mock_1.mock)() {
                    prompt(prompt) {
                        return Promise.resolve({ result: prompt.cancelButton.run({ checkboxChecked: false }) });
                    }
                }, new workbenchTestServices_1.TestExtensionService());
                const handle = await service.$showMessage(1, 'h', { modal: true }, [{ handle: 42, title: 'a thing', isCloseAffordance: false }]);
                assert.strictEqual(handle, undefined);
                service.dispose();
            });
            test('hides Cancel button when not needed', async () => {
                const service = new mainThreadMessageService_1.MainThreadMessageService(null, emptyNotificationService, emptyCommandService, new class extends (0, mock_1.mock)() {
                    prompt({ type, message, buttons, cancelButton }) {
                        assert.strictEqual(buttons.length, 0);
                        assert.ok(cancelButton);
                        return Promise.resolve({ result: cancelButton.run({ checkboxChecked: false }) });
                    }
                }, new workbenchTestServices_1.TestExtensionService());
                const handle = await service.$showMessage(1, 'h', { modal: true }, [{ handle: 42, title: 'a thing', isCloseAffordance: true }]);
                assert.strictEqual(handle, 42);
                service.dispose();
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE1lc3NhZ2VyU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0TWVzc2FnZXJTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsTUFBTSxtQkFBbUIsR0FBb0I7UUFDNUMsYUFBYSxFQUFFLFNBQVM7UUFDeEIsb0JBQW9CLEVBQUUsR0FBRyxFQUFFLENBQUMsc0JBQVUsQ0FBQyxJQUFJO1FBQzNDLG1CQUFtQixFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFVLENBQUMsSUFBSTtRQUMxQyxjQUFjLEVBQUUsQ0FBQyxTQUFpQixFQUFFLEdBQUcsSUFBVyxFQUFnQixFQUFFO1lBQ25FLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQ0QsQ0FBQztJQUVGLE1BQU0sd0JBQXdCLEdBQUcsSUFBSTtRQUFBO1lBRXBDLHlCQUFvQixHQUF5QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3hELDRCQUF1QixHQUF5QixhQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNELHNCQUFpQixHQUFnQixhQUFLLENBQUMsSUFBSSxDQUFDO1FBK0I3QyxDQUFDO1FBOUJBLE1BQU0sQ0FBQyxHQUFHLElBQVc7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxJQUFJLENBQUMsR0FBRyxJQUFXO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBQ0QsSUFBSSxDQUFDLEdBQUcsSUFBVztZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDcEMsQ0FB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