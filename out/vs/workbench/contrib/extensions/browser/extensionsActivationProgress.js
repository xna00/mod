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
define(["require", "exports", "vs/workbench/services/extensions/common/extensions", "vs/platform/progress/common/progress", "vs/nls", "vs/base/common/async", "vs/platform/log/common/log", "vs/base/common/cancellation"], function (require, exports, extensions_1, progress_1, nls_1, async_1, log_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionActivationProgress = void 0;
    let ExtensionActivationProgress = class ExtensionActivationProgress {
        constructor(extensionService, progressService, logService) {
            const options = {
                location: 10 /* ProgressLocation.Window */,
                title: (0, nls_1.localize)('activation', "Activating Extensions...")
            };
            let deferred;
            let count = 0;
            this._listener = extensionService.onWillActivateByEvent(e => {
                logService.trace('onWillActivateByEvent: ', e.event);
                if (!deferred) {
                    deferred = new async_1.DeferredPromise();
                    progressService.withProgress(options, _ => deferred.p);
                }
                count++;
                Promise.race([e.activation, (0, async_1.timeout)(5000, cancellation_1.CancellationToken.None)]).finally(() => {
                    if (--count === 0) {
                        deferred.complete(undefined);
                        deferred = undefined;
                    }
                });
            });
        }
        dispose() {
            this._listener.dispose();
        }
    };
    exports.ExtensionActivationProgress = ExtensionActivationProgress;
    exports.ExtensionActivationProgress = ExtensionActivationProgress = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, progress_1.IProgressService),
        __param(2, log_1.ILogService)
    ], ExtensionActivationProgress);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc0FjdGl2YXRpb25Qcm9ncmVzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2V4dGVuc2lvbnNBY3RpdmF0aW9uUHJvZ3Jlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBV3pGLElBQU0sMkJBQTJCLEdBQWpDLE1BQU0sMkJBQTJCO1FBSXZDLFlBQ29CLGdCQUFtQyxFQUNwQyxlQUFpQyxFQUN0QyxVQUF1QjtZQUdwQyxNQUFNLE9BQU8sR0FBRztnQkFDZixRQUFRLGtDQUF5QjtnQkFDakMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSwwQkFBMEIsQ0FBQzthQUN6RCxDQUFDO1lBRUYsSUFBSSxRQUEwQyxDQUFDO1lBQy9DLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQztZQUVkLElBQUksQ0FBQyxTQUFTLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNELFVBQVUsQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2YsUUFBUSxHQUFHLElBQUksdUJBQWUsRUFBRSxDQUFDO29CQUNqQyxlQUFlLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekQsQ0FBQztnQkFFRCxLQUFLLEVBQUUsQ0FBQztnQkFFUixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxJQUFBLGVBQU8sRUFBQyxJQUFJLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7b0JBQ2hGLElBQUksRUFBRSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7d0JBQ25CLFFBQVMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQzlCLFFBQVEsR0FBRyxTQUFTLENBQUM7b0JBQ3RCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQ0QsQ0FBQTtJQXhDWSxrRUFBMkI7MENBQTNCLDJCQUEyQjtRQUtyQyxXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxpQkFBVyxDQUFBO09BUEQsMkJBQTJCLENBd0N2QyJ9