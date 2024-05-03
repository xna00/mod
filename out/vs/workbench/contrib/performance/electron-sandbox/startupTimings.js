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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/native/common/native", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/timer/browser/timerService", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/buffer", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/contrib/performance/browser/startupTimings"], function (require, exports, async_1, errors_1, environmentService_1, lifecycle_1, productService_1, telemetry_1, update_1, native_1, editorService_1, timerService_1, files_1, uri_1, buffer_1, workspaceTrust_1, panecomposite_1, startupTimings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeStartupTimings = void 0;
    let NativeStartupTimings = class NativeStartupTimings extends startupTimings_1.StartupTimings {
        constructor(_fileService, _timerService, _nativeHostService, editorService, paneCompositeService, _telemetryService, lifecycleService, updateService, _environmentService, _productService, workspaceTrustService) {
            super(editorService, paneCompositeService, lifecycleService, updateService, workspaceTrustService);
            this._fileService = _fileService;
            this._timerService = _timerService;
            this._nativeHostService = _nativeHostService;
            this._telemetryService = _telemetryService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._report().catch(errors_1.onUnexpectedError);
        }
        async _report() {
            const standardStartupError = await this._isStandardStartup();
            this._appendStartupTimes(standardStartupError).catch(errors_1.onUnexpectedError);
        }
        async _appendStartupTimes(standardStartupError) {
            const appendTo = this._environmentService.args['prof-append-timers'];
            const durationMarkers = this._environmentService.args['prof-duration-markers'];
            const durationMarkersFile = this._environmentService.args['prof-duration-markers-file'];
            if (!appendTo && !durationMarkers) {
                // nothing to do
                return;
            }
            try {
                await Promise.all([
                    this._timerService.whenReady(),
                    (0, async_1.timeout)(15000), // wait: cached data creation, telemetry sending
                ]);
                const perfBaseline = await this._timerService.perfBaseline;
                if (appendTo) {
                    const content = `${this._timerService.startupMetrics.ellapsed}\t${this._productService.nameShort}\t${(this._productService.commit || '').slice(0, 10) || '0000000000'}\t${this._telemetryService.sessionId}\t${standardStartupError === undefined ? 'standard_start' : 'NO_standard_start : ' + standardStartupError}\t${String(perfBaseline).padStart(4, '0')}ms\n`;
                    await this.appendContent(uri_1.URI.file(appendTo), content);
                }
                if (durationMarkers?.length) {
                    const durations = [];
                    for (const durationMarker of durationMarkers) {
                        let duration = 0;
                        if (durationMarker === 'ellapsed') {
                            duration = this._timerService.startupMetrics.ellapsed;
                        }
                        else if (durationMarker.indexOf('-') !== -1) {
                            const markers = durationMarker.split('-');
                            if (markers.length === 2) {
                                duration = this._timerService.getDuration(markers[0], markers[1]);
                            }
                        }
                        if (duration) {
                            durations.push(durationMarker);
                            durations.push(`${duration}`);
                        }
                    }
                    const durationsContent = `${durations.join('\t')}\n`;
                    if (durationMarkersFile) {
                        await this.appendContent(uri_1.URI.file(durationMarkersFile), durationsContent);
                    }
                    else {
                        console.log(durationsContent);
                    }
                }
            }
            catch (err) {
                console.error(err);
            }
            finally {
                this._nativeHostService.exit(0);
            }
        }
        async _isStandardStartup() {
            const windowCount = await this._nativeHostService.getWindowCount();
            if (windowCount !== 1) {
                return `Expected window count : 1, Actual : ${windowCount}`;
            }
            return super._isStandardStartup();
        }
        async appendContent(file, content) {
            const chunks = [];
            if (await this._fileService.exists(file)) {
                chunks.push((await this._fileService.readFile(file)).value);
            }
            chunks.push(buffer_1.VSBuffer.fromString(content));
            await this._fileService.writeFile(file, buffer_1.VSBuffer.concat(chunks));
        }
    };
    exports.NativeStartupTimings = NativeStartupTimings;
    exports.NativeStartupTimings = NativeStartupTimings = __decorate([
        __param(0, files_1.IFileService),
        __param(1, timerService_1.ITimerService),
        __param(2, native_1.INativeHostService),
        __param(3, editorService_1.IEditorService),
        __param(4, panecomposite_1.IPaneCompositePartService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, update_1.IUpdateService),
        __param(8, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(9, productService_1.IProductService),
        __param(10, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], NativeStartupTimings);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFRpbWluZ3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3BlcmZvcm1hbmNlL2VsZWN0cm9uLXNhbmRib3gvc3RhcnR1cFRpbWluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLCtCQUFjO1FBRXZELFlBQ2dDLFlBQTBCLEVBQ3pCLGFBQTRCLEVBQ3ZCLGtCQUFzQyxFQUMzRCxhQUE2QixFQUNsQixvQkFBK0MsRUFDdEMsaUJBQW9DLEVBQ3JELGdCQUFtQyxFQUN0QyxhQUE2QixFQUNRLG1CQUF1RCxFQUMxRSxlQUFnQyxFQUNoQyxxQkFBdUQ7WUFFekYsS0FBSyxDQUFDLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQVpwRSxpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUN6QixrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUN2Qix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBR3ZDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFHbkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFvQztZQUMxRSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFLbEUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQywwQkFBaUIsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBTztZQUNwQixNQUFNLG9CQUFvQixHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDN0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLENBQUMsS0FBSyxDQUFDLDBCQUFpQixDQUFD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