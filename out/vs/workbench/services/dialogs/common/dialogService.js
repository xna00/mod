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
define(["require", "exports", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/workbench/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log"], function (require, exports, severity_1, lifecycle_1, dialogs_1, dialogs_2, extensions_1, environmentService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogService = void 0;
    let DialogService = class DialogService extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.model = this._register(new dialogs_2.DialogsModel());
            this.onWillShowDialog = this.model.onWillShowDialog;
            this.onDidShowDialog = this.model.onDidShowDialog;
        }
        skipDialogs() {
            if (this.environmentService.isExtensionDevelopment && this.environmentService.extensionTestsLocationURI) {
                return true; // integration tests
            }
            return !!this.environmentService.enableSmokeTestDriver; // smoke tests
        }
        async confirm(confirmation) {
            if (this.skipDialogs()) {
                this.logService.trace('DialogService: refused to show confirmation dialog in tests.');
                return { confirmed: true };
            }
            const handle = this.model.show({ confirmArgs: { confirmation } });
            return await handle.result;
        }
        async prompt(prompt) {
            if (this.skipDialogs()) {
                throw new Error(`DialogService: refused to show dialog in tests. Contents: ${prompt.message}`);
            }
            const handle = this.model.show({ promptArgs: { prompt } });
            const dialogResult = await handle.result;
            return {
                result: await dialogResult.result,
                checkboxChecked: dialogResult.checkboxChecked
            };
        }
        async input(input) {
            if (this.skipDialogs()) {
                throw new Error('DialogService: refused to show input dialog in tests.');
            }
            const handle = this.model.show({ inputArgs: { input } });
            return await handle.result;
        }
        async info(message, detail) {
            await this.prompt({ type: severity_1.default.Info, message, detail });
        }
        async warn(message, detail) {
            await this.prompt({ type: severity_1.default.Warning, message, detail });
        }
        async error(message, detail) {
            await this.prompt({ type: severity_1.default.Error, message, detail });
        }
        async about() {
            if (this.skipDialogs()) {
                throw new Error('DialogService: refused to show about dialog in tests.');
            }
            const handle = this.model.show({});
            await handle.result;
        }
    };
    exports.DialogService = DialogService;
    exports.DialogService = DialogService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService)
    ], DialogService);
    (0, extensions_1.registerSingleton)(dialogs_1.IDialogService, DialogService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2RpYWxvZ3MvY29tbW9uL2RpYWxvZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSxzQkFBVTtRQVU1QyxZQUMrQixrQkFBaUUsRUFDbEYsVUFBd0M7WUFFckQsS0FBSyxFQUFFLENBQUM7WUFIdUMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUNqRSxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBUjdDLFVBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksc0JBQVksRUFBRSxDQUFDLENBQUM7WUFFM0MscUJBQWdCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztZQUUvQyxvQkFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDO1FBT3RELENBQUM7UUFFTyxXQUFXO1lBQ2xCLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUN6RyxPQUFPLElBQUksQ0FBQyxDQUFDLG9CQUFvQjtZQUNsQyxDQUFDO1lBRUQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHFCQUFxQixDQUFDLENBQUMsY0FBYztRQUN2RSxDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUEyQjtZQUN4QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO2dCQUV0RixPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQzVCLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVsRSxPQUFPLE1BQU0sTUFBTSxDQUFDLE1BQTZCLENBQUM7UUFDbkQsQ0FBQztRQUtELEtBQUssQ0FBQyxNQUFNLENBQUksTUFBNkU7WUFDNUYsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw2REFBNkQsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDaEcsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTNELE1BQU0sWUFBWSxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQWlFLENBQUM7WUFFcEcsT0FBTztnQkFDTixNQUFNLEVBQUUsTUFBTSxZQUFZLENBQUMsTUFBTTtnQkFDakMsZUFBZSxFQUFFLFlBQVksQ0FBQyxlQUFlO2FBQzdDLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFhO1lBQ3hCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztZQUMxRSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFekQsT0FBTyxNQUFNLE1BQU0sQ0FBQyxNQUFzQixDQUFDO1FBQzVDLENBQUM7UUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQWUsRUFBRSxNQUFlO1lBQzFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBUSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFlLEVBQUUsTUFBZTtZQUMxQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBZSxFQUFFLE1BQWU7WUFDM0MsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSztZQUNWLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sSUFBSSxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztZQUMxRSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkMsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3JCLENBQUM7S0FDRCxDQUFBO0lBckZZLHNDQUFhOzRCQUFiLGFBQWE7UUFXdkIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLGlCQUFXLENBQUE7T0FaRCxhQUFhLENBcUZ6QjtJQUVELElBQUEsOEJBQWlCLEVBQUMsd0JBQWMsRUFBRSxhQUFhLG9DQUE0QixDQUFDIn0=