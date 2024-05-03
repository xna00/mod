/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/notification/common/notification"], function (require, exports, event_1, lifecycle_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestNotificationService = void 0;
    class TestNotificationService {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
            this.onDidChangeFilter = event_1.Event.None;
        }
        static { this.NO_OP = new notification_1.NoOpNotification(); }
        info(message) {
            return this.notify({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            return this.notify({ severity: notification_1.Severity.Warning, message });
        }
        error(error) {
            return this.notify({ severity: notification_1.Severity.Error, message: error });
        }
        notify(notification) {
            return TestNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return TestNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter() { }
        getFilter(source) {
            return notification_1.NotificationsFilter.OFF;
        }
        getFilters() {
            return [];
        }
        removeFilter(sourceId) { }
    }
    exports.TestNotificationService = TestNotificationService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdE5vdGlmaWNhdGlvblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL25vdGlmaWNhdGlvbi90ZXN0L2NvbW1vbi90ZXN0Tm90aWZpY2F0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSx1QkFBdUI7UUFBcEM7WUFFVSx5QkFBb0IsR0FBeUIsYUFBSyxDQUFDLElBQUksQ0FBQztZQUV4RCw0QkFBdUIsR0FBeUIsYUFBSyxDQUFDLElBQUksQ0FBQztZQUUzRCxzQkFBaUIsR0FBZ0IsYUFBSyxDQUFDLElBQUksQ0FBQztRQXlDdEQsQ0FBQztpQkFyQ3dCLFVBQUssR0FBd0IsSUFBSSwrQkFBZ0IsRUFBRSxBQUE5QyxDQUErQztRQUU1RSxJQUFJLENBQUMsT0FBZTtZQUNuQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsdUJBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQWU7WUFDbkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFxQjtZQUMxQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsdUJBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELE1BQU0sQ0FBQyxZQUEyQjtZQUNqQyxPQUFPLHVCQUF1QixDQUFDLEtBQUssQ0FBQztRQUN0QyxDQUFDO1FBRUQsTUFBTSxDQUFDLFFBQWtCLEVBQUUsT0FBZSxFQUFFLE9BQXdCLEVBQUUsT0FBd0I7WUFDN0YsT0FBTyx1QkFBdUIsQ0FBQyxLQUFLLENBQUM7UUFDdEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUF1QixFQUFFLE9BQStCO1lBQzlELE9BQU8sc0JBQVUsQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQztRQUVELFNBQVMsS0FBVyxDQUFDO1FBRXJCLFNBQVMsQ0FBQyxNQUF3QztZQUNqRCxPQUFPLGtDQUFtQixDQUFDLEdBQUcsQ0FBQztRQUNoQyxDQUFDO1FBRUQsVUFBVTtZQUNULE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVELFlBQVksQ0FBQyxRQUFnQixJQUFVLENBQUM7O0lBOUN6QywwREErQ0MifQ==