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
define(["require", "exports", "vs/base/common/event", "vs/platform/native/common/native", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/storage/common/storage", "vs/base/common/types"], function (require, exports, event_1, native_1, extensions_1, lifecycle_1, hostColorSchemeService_1, environmentService_1, storage_1, types_1) {
    "use strict";
    var NativeHostColorSchemeService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostColorSchemeService = void 0;
    let NativeHostColorSchemeService = class NativeHostColorSchemeService extends lifecycle_1.Disposable {
        static { NativeHostColorSchemeService_1 = this; }
        static { this.STORAGE_KEY = 'HostColorSchemeData'; }
        constructor(nativeHostService, environmentService, storageService) {
            super();
            this.nativeHostService = nativeHostService;
            this.storageService = storageService;
            this._onDidChangeColorScheme = this._register(new event_1.Emitter());
            this.onDidChangeColorScheme = this._onDidChangeColorScheme.event;
            // register listener with the OS
            this._register(this.nativeHostService.onDidChangeColorScheme(scheme => this.update(scheme)));
            const initial = this.getStoredValue() ?? environmentService.window.colorScheme;
            this.dark = initial.dark;
            this.highContrast = initial.highContrast;
            // fetch the actual value from the OS
            this.nativeHostService.getOSColorScheme().then(scheme => this.update(scheme));
        }
        getStoredValue() {
            const stored = this.storageService.get(NativeHostColorSchemeService_1.STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            if (stored) {
                try {
                    const scheme = JSON.parse(stored);
                    if ((0, types_1.isObject)(scheme) && (0, types_1.isBoolean)(scheme.highContrast) && (0, types_1.isBoolean)(scheme.dark)) {
                        return scheme;
                    }
                }
                catch (e) {
                    // ignore
                }
            }
            return undefined;
        }
        update({ highContrast, dark }) {
            if (dark !== this.dark || highContrast !== this.highContrast) {
                this.dark = dark;
                this.highContrast = highContrast;
                this.storageService.store(NativeHostColorSchemeService_1.STORAGE_KEY, JSON.stringify({ highContrast, dark }), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this._onDidChangeColorScheme.fire();
            }
        }
    };
    exports.NativeHostColorSchemeService = NativeHostColorSchemeService;
    exports.NativeHostColorSchemeService = NativeHostColorSchemeService = NativeHostColorSchemeService_1 = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, storage_1.IStorageService)
    ], NativeHostColorSchemeService);
    (0, extensions_1.registerSingleton)(hostColorSchemeService_1.IHostColorSchemeService, NativeHostColorSchemeService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlSG9zdENvbG9yU2NoZW1lU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RoZW1lcy9lbGVjdHJvbi1zYW5kYm94L25hdGl2ZUhvc3RDb2xvclNjaGVtZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLDRCQUE0QixHQUFsQyxNQUFNLDRCQUE2QixTQUFRLHNCQUFVOztpQkFFM0MsZ0JBQVcsR0FBRyxxQkFBcUIsQUFBeEIsQ0FBeUI7UUFVcEQsWUFDcUIsaUJBQXNELEVBQ3RDLGtCQUFzRCxFQUN6RSxjQUF1QztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUo2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBRWpELG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQVR4Qyw0QkFBdUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN0RSwyQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO1lBWXBFLGdDQUFnQztZQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQy9FLElBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUN6QixJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFFekMscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRU8sY0FBYztZQUNyQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyw4QkFBNEIsQ0FBQyxXQUFXLG9DQUEyQixDQUFDO1lBQzNHLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDO29CQUNKLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ2xDLElBQUksSUFBQSxnQkFBUSxFQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUEsaUJBQVMsRUFBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksSUFBQSxpQkFBUyxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO3dCQUNsRixPQUFPLE1BQXNCLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLFNBQVM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRU8sTUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBZ0I7WUFDbEQsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxZQUFZLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUU5RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDakIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLDhCQUE0QixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLG1FQUFrRCxDQUFDO2dCQUM3SixJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7O0lBckRXLG9FQUE0QjsyQ0FBNUIsNEJBQTRCO1FBYXRDLFdBQUEsMkJBQWtCLENBQUE7UUFDbEIsV0FBQSx1REFBa0MsQ0FBQTtRQUNsQyxXQUFBLHlCQUFlLENBQUE7T0FmTCw0QkFBNEIsQ0F1RHhDO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxnREFBdUIsRUFBRSw0QkFBNEIsb0NBQTRCLENBQUMifQ==