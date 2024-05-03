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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/native/common/native", "vs/platform/profiling/electron-sandbox/profileAnalysisWorkerService", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/workbench/services/timer/browser/timerService"], function (require, exports, async_1, buffer_1, resources_1, uuid_1, configuration_1, files_1, log_1, native_1, profileAnalysisWorkerService_1, environmentService_1, extensionDevOptions_1, timerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RendererProfiling = void 0;
    let RendererProfiling = class RendererProfiling {
        constructor(_environmentService, _fileService, _logService, nativeHostService, timerService, configService, profileAnalysisService) {
            this._environmentService = _environmentService;
            this._fileService = _fileService;
            this._logService = _logService;
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(_environmentService);
            if (devOpts.isExtensionDevTestFromCli) {
                // disabled when running extension tests
                return;
            }
            timerService.perfBaseline.then(perfBaseline => {
                _logService.info(`[perf] Render performance baseline is ${perfBaseline}ms`);
                if (perfBaseline < 0) {
                    // too slow
                    return;
                }
                // SLOW threshold
                const slowThreshold = perfBaseline * 10; // ~10 frames at 64fps on MY machine
                const obs = new PerformanceObserver(async (list) => {
                    obs.takeRecords();
                    const maxDuration = list.getEntries()
                        .map(e => e.duration)
                        .reduce((p, c) => Math.max(p, c), 0);
                    if (maxDuration < slowThreshold) {
                        return;
                    }
                    if (!configService.getValue('application.experimental.rendererProfiling')) {
                        _logService.debug(`[perf] SLOW task detected (${maxDuration}ms) but renderer profiling is disabled via 'application.experimental.rendererProfiling'`);
                        return;
                    }
                    const sessionId = (0, uuid_1.generateUuid)();
                    _logService.warn(`[perf] Renderer reported VERY LONG TASK (${maxDuration}ms), starting profiling session '${sessionId}'`);
                    // pause observation, we'll take a detailed look
                    obs.disconnect();
                    // profile renderer for 5secs, analyse, and take action depending on the result
                    for (let i = 0; i < 3; i++) {
                        try {
                            const profile = await nativeHostService.profileRenderer(sessionId, 5000);
                            const output = await profileAnalysisService.analyseBottomUp(profile, _url => '<<renderer>>', perfBaseline, true);
                            if (output === 2 /* ProfilingOutput.Interesting */) {
                                this._store(profile, sessionId);
                                break;
                            }
                            (0, async_1.timeout)(15000); // wait 15s
                        }
                        catch (err) {
                            _logService.error(err);
                            break;
                        }
                    }
                    // reconnect the observer
                    obs.observe({ entryTypes: ['longtask'] });
                });
                obs.observe({ entryTypes: ['longtask'] });
                this._observer = obs;
            });
        }
        dispose() {
            this._observer?.disconnect();
        }
        async _store(profile, sessionId) {
            const path = (0, resources_1.joinPath)(this._environmentService.tmpDir, `renderer-${Math.random().toString(16).slice(2, 8)}.cpuprofile.json`);
            await this._fileService.writeFile(path, buffer_1.VSBuffer.fromString(JSON.stringify(profile)));
            this._logService.info(`[perf] stored profile to DISK '${path}'`, sessionId);
        }
    };
    exports.RendererProfiling = RendererProfiling;
    exports.RendererProfiling = RendererProfiling = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService),
        __param(3, native_1.INativeHostService),
        __param(4, timerService_1.ITimerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, profileAnalysisWorkerService_1.IProfileAnalysisWorkerService)
    ], RendererProfiling);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyZXJBdXRvUHJvZmlsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3BlcmZvcm1hbmNlL2VsZWN0cm9uLXNhbmRib3gvcmVuZGVyZXJBdXRvUHJvZmlsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUk3QixZQUNzRCxtQkFBdUQsRUFDN0UsWUFBMEIsRUFDM0IsV0FBd0IsRUFDbEMsaUJBQXFDLEVBQzFDLFlBQTJCLEVBQ25CLGFBQW9DLEVBQzVCLHNCQUFxRDtZQU4vQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW9DO1lBQzdFLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQzNCLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBT3RELE1BQU0sT0FBTyxHQUFHLElBQUEsOENBQXdCLEVBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUM5RCxJQUFJLE9BQU8sQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2dCQUN2Qyx3Q0FBd0M7Z0JBQ3hDLE9BQU87WUFDUixDQUFDO1lBRUQsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUU7Z0JBQzdDLFdBQVcsQ0FBQyxJQUFJLENBQUMseUNBQXlDLFlBQVksSUFBSSxDQUFDLENBQUM7Z0JBRTVFLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN0QixXQUFXO29CQUNYLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxpQkFBaUI7Z0JBQ2pCLE1BQU0sYUFBYSxHQUFHLFlBQVksR0FBRyxFQUFFLENBQUMsQ0FBQyxvQ0FBb0M7Z0JBRTdFLE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFDLElBQUksRUFB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