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
define(["require", "exports", "vs/platform/telemetry/common/telemetry"], function (require, exports, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTelemetry = void 0;
    let DebugTelemetry = class DebugTelemetry {
        constructor(model, telemetryService) {
            this.model = model;
            this.telemetryService = telemetryService;
        }
        logDebugSessionStart(dbgr, launchJsonExists) {
            const extension = dbgr.getMainExtensionDescriptor();
            /* __GDPR__
                "debugSessionStart" : {
                    "owner": "connor4312",
                    "type": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "exceptionBreakpoints": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "extensionName": { "classification": "PublicNonPersonalData", "purpose": "FeatureInsight" },
                    "isBuiltin": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true},
                    "launchJsonExists": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            this.telemetryService.publicLog('debugSessionStart', {
                type: dbgr.type,
                breakpointCount: this.model.getBreakpoints().length,
                exceptionBreakpoints: this.model.getExceptionBreakpoints(),
                watchExpressionsCount: this.model.getWatchExpressions().length,
                extensionName: extension.identifier.value,
                isBuiltin: extension.isBuiltin,
                launchJsonExists
            });
        }
        logDebugSessionStop(session, adapterExitEvent) {
            const breakpoints = this.model.getBreakpoints();
            /* __GDPR__
                "debugSessionStop" : {
                    "owner": "connor4312",
                    "type" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                    "success": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "sessionLengthInSeconds": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "breakpointCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "watchExpressionsCount": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                }
            */
            this.telemetryService.publicLog('debugSessionStop', {
                type: session && session.configuration.type,
                success: adapterExitEvent.emittedStopped || breakpoints.length === 0,
                sessionLengthInSeconds: adapterExitEvent.sessionLengthInSeconds,
                breakpointCount: breakpoints.length,
                watchExpressionsCount: this.model.getWatchExpressions().length
            });
        }
    };
    exports.DebugTelemetry = DebugTelemetry;
    exports.DebugTelemetry = DebugTelemetry = __decorate([
        __param(1, telemetry_1.ITelemetryService)
    ], DebugTelemetry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdUZWxlbWV0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9kZWJ1Z1RlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFNekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBYztRQUUxQixZQUNrQixLQUFrQixFQUNDLGdCQUFtQztZQUR0RCxVQUFLLEdBQUwsS0FBSyxDQUFhO1lBQ0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtRQUNwRSxDQUFDO1FBRUwsb0JBQW9CLENBQUMsSUFBYyxFQUFFLGdCQUF5QjtZQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUNwRDs7Ozs7Ozs7Ozs7Y0FXRTtZQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLEVBQUU7Z0JBQ3BELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtnQkFDZixlQUFlLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQyxNQUFNO2dCQUNuRCxvQkFBb0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFO2dCQUMxRCxxQkFBcUIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUMsTUFBTTtnQkFDOUQsYUFBYSxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsS0FBSztnQkFDekMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxTQUFTO2dCQUM5QixnQkFBZ0I7YUFDaEIsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELG1CQUFtQixDQUFDLE9BQXNCLEVBQUUsZ0JBQWlDO1lBRTVFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7WUFFaEQ7Ozs7Ozs7OztjQVNFO1lBQ0YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRTtnQkFDbkQsSUFBSSxFQUFFLE9BQU8sSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUk7Z0JBQzNDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxjQUFjLElBQUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDO2dCQUNwRSxzQkFBc0IsRUFBRSxnQkFBZ0IsQ0FBQyxzQkFBc0I7Z0JBQy9ELGVBQWUsRUFBRSxXQUFXLENBQUMsTUFBTTtnQkFDbkMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLE1BQU07YUFDOUQsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNELENBQUE7SUF0RFksd0NBQWM7NkJBQWQsY0FBYztRQUl4QixXQUFBLDZCQUFpQixDQUFBO09BSlAsY0FBYyxDQXNEMUIifQ==