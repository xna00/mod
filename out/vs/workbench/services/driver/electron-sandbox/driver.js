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
define(["require", "exports", "vs/base/browser/window", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/driver/browser/driver", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, window_1, environment_1, files_1, log_1, driver_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerWindowDriver = registerWindowDriver;
    let NativeWindowDriver = class NativeWindowDriver extends driver_1.BrowserWindowDriver {
        constructor(helper, fileService, environmentService, lifecycleService, logService) {
            super(fileService, environmentService, lifecycleService, logService);
            this.helper = helper;
        }
        exitApplication() {
            return this.helper.exitApplication();
        }
    };
    NativeWindowDriver = __decorate([
        __param(1, files_1.IFileService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, log_1.ILogService)
    ], NativeWindowDriver);
    function registerWindowDriver(instantiationService, helper) {
        Object.assign(window_1.mainWindow, { driver: instantiationService.createInstance(NativeWindowDriver, helper) });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJpdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZHJpdmVyL2VsZWN0cm9uLXNhbmRib3gvZHJpdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBK0JoRyxvREFFQztJQW5CRCxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLDRCQUFtQjtRQUVuRCxZQUNrQixNQUFpQyxFQUNwQyxXQUF5QixFQUNsQixrQkFBdUMsRUFDekMsZ0JBQW1DLEVBQ3pDLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxXQUFXLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFOcEQsV0FBTSxHQUFOLE1BQU0sQ0FBMkI7UUFPbkQsQ0FBQztRQUVRLGVBQWU7WUFDdkIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3RDLENBQUM7S0FDRCxDQUFBO0lBZkssa0JBQWtCO1FBSXJCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLGlCQUFXLENBQUE7T0FQUixrQkFBa0IsQ0FldkI7SUFFRCxTQUFnQixvQkFBb0IsQ0FBQyxvQkFBMkMsRUFBRSxNQUFpQztRQUNsSCxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN4RyxDQUFDIn0=