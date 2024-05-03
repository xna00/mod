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
define(["require", "exports", "vs/base/browser/performance", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService"], function (require, exports, performance_1, async_1, event_1, lifecycle_1, telemetry_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputLatencyContrib = void 0;
    let InputLatencyContrib = class InputLatencyContrib extends lifecycle_1.Disposable {
        constructor(_editorService, _telemetryService) {
            super();
            this._editorService = _editorService;
            this._telemetryService = _telemetryService;
            this._listener = this._register(new lifecycle_1.MutableDisposable());
            // The current sampling strategy is when the active editor changes, start sampling and
            // report the results after 60 seconds. It's done this way as we don't want to sample
            // everything, just somewhat randomly, and using an interval would utilize CPU when the
            // application is inactive.
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => {
                this._logSamples();
                this._setupListener();
            }, 60000));
            // Only log 1% of users selected randomly to reduce the volume of data
            if (Math.random() <= 0.01) {
                this._setupListener();
            }
        }
        _setupListener() {
            this._listener.value = event_1.Event.once(this._editorService.onDidActiveEditorChange)(() => this._scheduler.schedule());
        }
        _logSamples() {
            const measurements = performance_1.inputLatency.getAndClearMeasurements();
            if (!measurements) {
                return;
            }
            this._telemetryService.publicLog2('performance.inputLatency', {
                keydown: measurements.keydown,
                input: measurements.input,
                render: measurements.render,
                total: measurements.total,
                sampleCount: measurements.sampleCount
            });
        }
    };
    exports.InputLatencyContrib = InputLatencyContrib;
    exports.InputLatencyContrib = InputLatencyContrib = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, telemetry_1.ITelemetryService)
    ], InputLatencyContrib);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRMYXRlbmN5Q29udHJpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcGVyZm9ybWFuY2UvYnJvd3Nlci9pbnB1dExhdGVuY3lDb250cmliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBSWxELFlBQ2lCLGNBQStDLEVBQzVDLGlCQUFxRDtZQUV4RSxLQUFLLEVBQUUsQ0FBQztZQUh5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUx4RCxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQVNwRSxzRkFBc0Y7WUFDdEYscUZBQXFGO1lBQ3JGLHVGQUF1RjtZQUN2RiwyQkFBMkI7WUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUMxRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN2QixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUdYLHNFQUFzRTtZQUN0RSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUM7UUFFRixDQUFDO1FBRU8sY0FBYztZQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbEgsQ0FBQztRQUVPLFdBQVc7WUFDbEIsTUFBTSxZQUFZLEdBQUcsMEJBQVksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzVELElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDbkIsT0FBTztZQUNSLENBQUM7WUFzQkQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBc0UsMEJBQTBCLEVBQUU7Z0JBQ2xJLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTztnQkFDN0IsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO2dCQUN6QixNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU07Z0JBQzNCLEtBQUssRUFBRSxZQUFZLENBQUMsS0FBSztnQkFDekIsV0FBVyxFQUFFLFlBQVksQ0FBQyxXQUFXO2FBQ3JDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBakVZLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBSzdCLFdBQUEsOEJBQWMsQ0FBQTtRQUNkLFdBQUEsNkJBQWlCLENBQUE7T0FOUCxtQkFBbUIsQ0FpRS9CIn0=