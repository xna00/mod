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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/severity", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, lifecycle_1, event_1, severity_1, nls_1, accessibility_1, commands_1, configuration_1, notification_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityStatus = void 0;
    let AccessibilityStatus = class AccessibilityStatus extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.accessibilityStatus'; }
        constructor(configurationService, notificationService, accessibilityService, statusbarService) {
            super();
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.accessibilityService = accessibilityService;
            this.statusbarService = statusbarService;
            this.screenReaderNotification = null;
            this.promptedScreenReader = false;
            this.screenReaderModeElement = this._register(new lifecycle_1.MutableDisposable());
            this._register(commands_1.CommandsRegistry.registerCommand({ id: 'showEditorScreenReaderNotification', handler: () => this.showScreenReaderNotification() }));
            this.updateScreenReaderModeElement(this.accessibilityService.isScreenReaderOptimized());
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.accessibilityService.onDidChangeScreenReaderOptimized(() => this.onScreenReaderModeChange()));
            this._register(this.configurationService.onDidChangeConfiguration(c => {
                if (c.affectsConfiguration('editor.accessibilitySupport')) {
                    this.onScreenReaderModeChange();
                }
            }));
        }
        showScreenReaderNotification() {
            this.screenReaderNotification = this.notificationService.prompt(severity_1.default.Info, (0, nls_1.localize)('screenReaderDetectedExplanation.question', "Are you using a screen reader to operate VS Code?"), [{
                    label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerYes', "Yes"),
                    run: () => {
                        this.configurationService.updateValue('editor.accessibilitySupport', 'on', 2 /* ConfigurationTarget.USER */);
                    }
                }, {
                    label: (0, nls_1.localize)('screenReaderDetectedExplanation.answerNo', "No"),
                    run: () => {
                        this.configurationService.updateValue('editor.accessibilitySupport', 'off', 2 /* ConfigurationTarget.USER */);
                    }
                }], {
                sticky: true,
                priority: notification_1.NotificationPriority.URGENT
            });
            event_1.Event.once(this.screenReaderNotification.onDidClose)(() => this.screenReaderNotification = null);
        }
        updateScreenReaderModeElement(visible) {
            if (visible) {
                if (!this.screenReaderModeElement.value) {
                    const text = (0, nls_1.localize)('screenReaderDetected', "Screen Reader Optimized");
                    this.screenReaderModeElement.value = this.statusbarService.addEntry({
                        name: (0, nls_1.localize)('status.editor.screenReaderMode', "Screen Reader Mode"),
                        text,
                        ariaLabel: text,
                        command: 'showEditorScreenReaderNotification',
                        kind: 'prominent',
                        showInAllWindows: true
                    }, 'status.editor.screenReaderMode', 1 /* StatusbarAlignment.RIGHT */, 100.6);
                }
            }
            else {
                this.screenReaderModeElement.clear();
            }
        }
        onScreenReaderModeChange() {
            // We only support text based editors
            const screenReaderDetected = this.accessibilityService.isScreenReaderOptimized();
            if (screenReaderDetected) {
                const screenReaderConfiguration = this.configurationService.getValue('editor.accessibilitySupport');
                if (screenReaderConfiguration === 'auto') {
                    if (!this.promptedScreenReader) {
                        this.promptedScreenReader = true;
                        setTimeout(() => this.showScreenReaderNotification(), 100);
                    }
                }
            }
            if (this.screenReaderNotification) {
                this.screenReaderNotification.close();
            }
            this.updateScreenReaderModeElement(this.accessibilityService.isScreenReaderOptimized());
        }
    };
    exports.AccessibilityStatus = AccessibilityStatus;
    exports.AccessibilityStatus = AccessibilityStatus = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, notification_1.INotificationService),
        __param(2, accessibility_1.IAccessibilityService),
        __param(3, statusbar_1.IStatusbarService)
    ], AccessibilityStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eVN0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYWNjZXNzaWJpbGl0eS9icm93c2VyL2FjY2Vzc2liaWxpdHlTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYXpGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7aUJBRWxDLE9BQUUsR0FBRyx1Q0FBdUMsQUFBMUMsQ0FBMkM7UUFNN0QsWUFDd0Isb0JBQTRELEVBQzdELG1CQUEwRCxFQUN6RCxvQkFBNEQsRUFDaEUsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBTGdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDNUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFSaEUsNkJBQXdCLEdBQStCLElBQUksQ0FBQztZQUM1RCx5QkFBb0IsR0FBWSxLQUFLLENBQUM7WUFDN0IsNEJBQXVCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUEyQixDQUFDLENBQUM7WUFVM0csSUFBSSxDQUFDLFNBQVMsQ0FBQywyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsb0NBQW9DLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRW5KLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO1lBRXhGLElBQUksQ0FBQyxpQkFBaUIsRUFB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