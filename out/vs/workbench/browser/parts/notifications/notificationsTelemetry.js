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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/base/common/hash"], function (require, exports, lifecycle_1, notification_1, telemetry_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsTelemetry = void 0;
    exports.notificationToMetrics = notificationToMetrics;
    function notificationToMetrics(message, source, silent) {
        return {
            id: (0, hash_1.hash)(message.toString()).toString(),
            silent,
            source: source || 'core'
        };
    }
    let NotificationsTelemetry = class NotificationsTelemetry extends lifecycle_1.Disposable {
        constructor(telemetryService, notificationService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.notificationService.onDidAddNotification(notification => {
                const source = notification.source && typeof notification.source !== 'string' ? notification.source.id : notification.source;
                this.telemetryService.publicLog2('notification:show', notificationToMetrics(notification.message, source, notification.priority === notification_1.NotificationPriority.SILENT));
            }));
            this._register(this.notificationService.onDidRemoveNotification(notification => {
                const source = notification.source && typeof notification.source !== 'string' ? notification.source.id : notification.source;
                this.telemetryService.publicLog2('notification:close', notificationToMetrics(notification.message, source, notification.priority === notification_1.NotificationPriority.SILENT));
            }));
        }
    };
    exports.NotificationsTelemetry = NotificationsTelemetry;
    exports.NotificationsTelemetry = NotificationsTelemetry = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService)
    ], NotificationsTelemetry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc1RlbGVtZXRyeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zVGVsZW1ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXNCaEcsc0RBTUM7SUFORCxTQUFnQixxQkFBcUIsQ0FBQyxPQUE0QixFQUFFLE1BQTBCLEVBQUUsTUFBZTtRQUM5RyxPQUFPO1lBQ04sRUFBRSxFQUFFLElBQUEsV0FBSSxFQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRTtZQUN2QyxNQUFNO1lBQ04sTUFBTSxFQUFFLE1BQU0sSUFBSSxNQUFNO1NBQ3hCLENBQUM7SUFDSCxDQUFDO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTtRQUVyRCxZQUNxQyxnQkFBbUMsRUFDaEMsbUJBQXlDO1lBRWhGLEtBQUssRUFBRSxDQUFDO1lBSDRCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDaEMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUdoRixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUMzRSxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxJQUFJLE9BQU8sWUFBWSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUM3SCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUF5RCxtQkFBbUIsRUFBRSxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsUUFBUSxLQUFLLG1DQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDM04sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUM5RSxNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxJQUFJLE9BQU8sWUFBWSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO2dCQUM3SCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUF5RCxvQkFBb0IsRUFBRSxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsUUFBUSxLQUFLLG1DQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDNU4sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRCxDQUFBO0lBckJZLHdEQUFzQjtxQ0FBdEIsc0JBQXNCO1FBR2hDLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSxtQ0FBb0IsQ0FBQTtPQUpWLHNCQUFzQixDQXFCbEMifQ==