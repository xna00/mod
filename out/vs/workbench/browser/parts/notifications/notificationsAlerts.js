/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/notification/common/notification", "vs/base/common/event"], function (require, exports, aria_1, nls_1, lifecycle_1, errorMessage_1, notification_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsAlerts = void 0;
    class NotificationsAlerts extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            // Alert initial notifications if any
            for (const notification of model.notifications) {
                this.triggerAriaAlert(notification);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
        }
        onDidChangeNotification(e) {
            if (e.kind === 0 /* NotificationChangeType.ADD */) {
                // ARIA alert for screen readers
                this.triggerAriaAlert(e.item);
                // Always log errors to console with full details
                if (e.item.severity === notification_1.Severity.Error) {
                    if (e.item.message.original instanceof Error) {
                        console.error(e.item.message.original);
                    }
                    else {
                        console.error((0, errorMessage_1.toErrorMessage)(e.item.message.linkedText.toString(), true));
                    }
                }
            }
        }
        triggerAriaAlert(notification) {
            if (notification.priority === notification_1.NotificationPriority.SILENT) {
                return;
            }
            // Trigger the alert again whenever the message changes
            const listener = notification.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    this.doTriggerAriaAlert(notification);
                }
            });
            event_1.Event.once(notification.onDidClose)(() => listener.dispose());
            this.doTriggerAriaAlert(notification);
        }
        doTriggerAriaAlert(notification) {
            let alertText;
            if (notification.severity === notification_1.Severity.Error) {
                alertText = (0, nls_1.localize)('alertErrorMessage', "Error: {0}", notification.message.linkedText.toString());
            }
            else if (notification.severity === notification_1.Severity.Warning) {
                alertText = (0, nls_1.localize)('alertWarningMessage', "Warning: {0}", notification.message.linkedText.toString());
            }
            else {
                alertText = (0, nls_1.localize)('alertInfoMessage', "Info: {0}", notification.message.linkedText.toString());
            }
            (0, aria_1.alert)(alertText);
        }
    }
    exports.NotificationsAlerts = NotificationsAlerts;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uc0FsZXJ0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zQWxlcnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLG1CQUFvQixTQUFRLHNCQUFVO1FBRWxELFlBQTZCLEtBQTBCO1lBQ3RELEtBQUssRUFBRSxDQUFDO1lBRG9CLFVBQUssR0FBTCxLQUFLLENBQXFCO1lBR3RELHFDQUFxQztZQUNyQyxLQUFLLE1BQU0sWUFBWSxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFFRCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJBQWlCO1lBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVPLHVCQUF1QixDQUFDLENBQTJCO1lBQzFELElBQUksQ0FBQyxDQUFDLElBQUksdUNBQStCLEVBQUUsQ0FBQztnQkFFM0MsZ0NBQWdDO2dCQUNoQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUU5QixpREFBaUQ7Z0JBQ2pELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssdUJBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLFlBQVksS0FBSyxFQUFFLENBQUM7d0JBQzlDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3hDLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUEsNkJBQWMsRUFBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDM0UsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxZQUFtQztZQUMzRCxJQUFJLFlBQVksQ0FBQyxRQUFRLEtBQUssbUNBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzNELE9BQU87WUFDUixDQUFDO1lBRUQsdURBQXVEO1lBQ3ZELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDcEQsSUFBSSxDQUFDLENBQUMsSUFBSSwwREFBa0QsRUFBRSxDQUFDO29CQUM5RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILGFBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBRTlELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBRU8sa0JBQWtCLENBQUMsWUFBbUM7WUFDN0QsSUFBSSxTQUFpQixDQUFDO1lBQ3RCLElBQUksWUFBWSxDQUFDLFFBQVEsS0FBSyx1QkFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM5QyxTQUFTLEdBQUcsSUFBQSxjQUFRLEVBQUMsbUJBQW1CLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDckcsQ0FBQztpQkFBTSxJQUFJLFlBQVksQ0FBQyxRQUFRLEtBQUssdUJBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkQsU0FBUyxHQUFHLElBQUEsY0FBUSxFQUFDLHFCQUFxQixFQUFFLGNBQWMsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3pHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxTQUFTLEdBQUcsSUFBQSxjQUFRLEVBQUMsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDbkcsQ0FBQztZQUVELElBQUEsWUFBSyxFQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2xCLENBQUM7S0FDRDtJQS9ERCxrREErREMifQ==