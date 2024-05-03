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
define(["require", "exports", "vs/platform/native/common/native", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/update/common/update", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/timer/browser/timerService", "vs/platform/telemetry/common/telemetry", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/instantiation/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, native_1, environmentService_1, workspace_1, extensions_1, update_1, lifecycle_1, editorService_1, accessibility_1, timerService_1, telemetry_1, globals_1, extensions_2, layoutService_1, productService_1, storage_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerService = void 0;
    exports.didUseCachedData = didUseCachedData;
    let TimerService = class TimerService extends timerService_1.AbstractTimerService {
        constructor(_nativeHostService, _environmentService, lifecycleService, contextService, extensionService, updateService, paneCompositeService, editorService, accessibilityService, telemetryService, layoutService, _productService, _storageService) {
            super(lifecycleService, contextService, extensionService, updateService, paneCompositeService, editorService, accessibilityService, telemetryService, layoutService);
            this._nativeHostService = _nativeHostService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._storageService = _storageService;
            this.setPerformanceMarks('main', _environmentService.window.perfMarks);
        }
        _isInitialStartup() {
            return Boolean(this._environmentService.window.isInitialStartup);
        }
        _didUseCachedData() {
            return didUseCachedData(this._productService, this._storageService, this._environmentService);
        }
        _getWindowCount() {
            return this._nativeHostService.getWindowCount();
        }
        async _extendStartupInfo(info) {
            try {
                const [osProperties, osStatistics, virtualMachineHint, isARM64Emulated] = await Promise.all([
                    this._nativeHostService.getOSProperties(),
                    this._nativeHostService.getOSStatistics(),
                    this._nativeHostService.getOSVirtualMachineHint(),
                    this._nativeHostService.isRunningUnderARM64Translation()
                ]);
                info.totalmem = osStatistics.totalmem;
                info.freemem = osStatistics.freemem;
                info.platform = osProperties.platform;
                info.release = osProperties.release;
                info.arch = osProperties.arch;
                info.loadavg = osStatistics.loadavg;
                info.isARM64Emulated = isARM64Emulated;
                const processMemoryInfo = await globals_1.process.getProcessMemoryInfo();
                info.meminfo = {
                    workingSetSize: processMemoryInfo.residentSet,
                    privateBytes: processMemoryInfo.private,
                    sharedBytes: processMemoryInfo.shared
                };
                info.isVMLikelyhood = Math.round((virtualMachineHint * 100));
                const rawCpus = osProperties.cpus;
                if (rawCpus && rawCpus.length > 0) {
                    info.cpus = { count: rawCpus.length, speed: rawCpus[0].speed, model: rawCpus[0].model };
                }
            }
            catch (error) {
                // ignore, be on the safe side with these hardware method calls
            }
        }
        _shouldReportPerfMarks() {
            // always send when running with the prof-append-timers flag
            return super._shouldReportPerfMarks() || Boolean(this._environmentService.args['prof-append-timers']);
        }
    };
    exports.TimerService = TimerService;
    exports.TimerService = TimerService = __decorate([
        __param(0, native_1.INativeHostService),
        __param(1, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, extensions_1.IExtensionService),
        __param(5, update_1.IUpdateService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, editorService_1.IEditorService),
        __param(8, accessibility_1.IAccessibilityService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, layoutService_1.IWorkbenchLayoutService),
        __param(11, productService_1.IProductService),
        __param(12, storage_1.IStorageService)
    ], TimerService);
    (0, extensions_2.registerSingleton)(timerService_1.ITimerService, TimerService, 1 /* InstantiationType.Delayed */);
    //#region cached data logic
    const lastRunningCommitStorageKey = 'perf/lastRunningCommit';
    let _didUseCachedData = undefined;
    function didUseCachedData(productService, storageService, environmentService) {
        // browser code loading: only a guess based on
        // this being the first start with the commit
        // or subsequent
        if (typeof _didUseCachedData !== 'boolean') {
            if (!environmentService.window.isCodeCaching || !productService.commit) {
                _didUseCachedData = false; // we only produce cached data whith commit and code cache path
            }
            else if (storageService.get(lastRunningCommitStorageKey, -1 /* StorageScope.APPLICATION */) === productService.commit) {
                _didUseCachedData = true; // subsequent start on same commit, assume cached data is there
            }
            else {
                storageService.store(lastRunningCommitStorageKey, productService.commit, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                _didUseCachedData = false; // first time start on commit, assume cached data is not yet there
            }
        }
        return _didUseCachedData;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGltZXJTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdGltZXIvZWxlY3Ryb24tc2FuZGJveC90aW1lclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0doRyw0Q0FlQztJQTlGTSxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsbUNBQW9CO1FBRXJELFlBQ3NDLGtCQUFzQyxFQUN0QixtQkFBdUQsRUFDekYsZ0JBQW1DLEVBQzVCLGNBQXdDLEVBQy9DLGdCQUFtQyxFQUN0QyxhQUE2QixFQUNsQixvQkFBK0MsRUFDMUQsYUFBNkIsRUFDdEIsb0JBQTJDLEVBQy9DLGdCQUFtQyxFQUM3QixhQUFzQyxFQUM3QixlQUFnQyxFQUNoQyxlQUFnQztZQUVsRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFkaEksdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUN0Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9DO1lBVTFFLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFHbEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUVTLGlCQUFpQjtZQUMxQixPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUNTLGlCQUFpQjtZQUMxQixP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