/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryConfiguration = exports.TelemetryLevel = exports.TELEMETRY_OLD_SETTING_ID = exports.TELEMETRY_CRASH_REPORTER_SETTING_ID = exports.TELEMETRY_SETTING_ID = exports.TELEMETRY_SECTION_ID = exports.sqmIdKey = exports.machineIdKey = exports.lastSessionDateStorageKey = exports.firstSessionDateStorageKey = exports.currentSessionDateStorageKey = exports.ICustomEndpointTelemetryService = exports.ITelemetryService = void 0;
    exports.ITelemetryService = (0, instantiation_1.createDecorator)('telemetryService');
    exports.ICustomEndpointTelemetryService = (0, instantiation_1.createDecorator)('customEndpointTelemetryService');
    // Keys
    exports.currentSessionDateStorageKey = 'telemetry.currentSessionDate';
    exports.firstSessionDateStorageKey = 'telemetry.firstSessionDate';
    exports.lastSessionDateStorageKey = 'telemetry.lastSessionDate';
    exports.machineIdKey = 'telemetry.machineId';
    exports.sqmIdKey = 'telemetry.sqmId';
    // Configuration Keys
    exports.TELEMETRY_SECTION_ID = 'telemetry';
    exports.TELEMETRY_SETTING_ID = 'telemetry.telemetryLevel';
    exports.TELEMETRY_CRASH_REPORTER_SETTING_ID = 'telemetry.enableCrashReporter';
    exports.TELEMETRY_OLD_SETTING_ID = 'telemetry.enableTelemetry';
    var TelemetryLevel;
    (function (TelemetryLevel) {
        TelemetryLevel[TelemetryLevel["NONE"] = 0] = "NONE";
        TelemetryLevel[TelemetryLevel["CRASH"] = 1] = "CRASH";
        TelemetryLevel[TelemetryLevel["ERROR"] = 2] = "ERROR";
        TelemetryLevel[TelemetryLevel["USAGE"] = 3] = "USAGE";
    })(TelemetryLevel || (exports.TelemetryLevel = TelemetryLevel = {}));
    var TelemetryConfiguration;
    (function (TelemetryConfiguration) {
        TelemetryConfiguration["OFF"] = "off";
        TelemetryConfiguration["CRASH"] = "crash";
        TelemetryConfiguration["ERROR"] = "error";
        TelemetryConfiguration["ON"] = "all";
    })(TelemetryConfiguration || (exports.TelemetryConfiguration = TelemetryConfiguration = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90ZWxlbWV0cnkvY29tbW9uL3RlbGVtZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLbkYsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUFvRDNFLFFBQUEsK0JBQStCLEdBQUcsSUFBQSwrQkFBZSxFQUFrQyxnQ0FBZ0MsQ0FBQyxDQUFDO0lBU2xJLE9BQU87SUFDTSxRQUFBLDRCQUE0QixHQUFHLDhCQUE4QixDQUFDO0lBQzlELFFBQUEsMEJBQTBCLEdBQUcsNEJBQTRCLENBQUM7SUFDMUQsUUFBQSx5QkFBeUIsR0FBRywyQkFBMkIsQ0FBQztJQUN4RCxRQUFBLFlBQVksR0FBRyxxQkFBcUIsQ0FBQztJQUNyQyxRQUFBLFFBQVEsR0FBRyxpQkFBaUIsQ0FBQztJQUUxQyxxQkFBcUI7SUFDUixRQUFBLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztJQUNuQyxRQUFBLG9CQUFvQixHQUFHLDBCQUEwQixDQUFDO0lBQ2xELFFBQUEsbUNBQW1DLEdBQUcsK0JBQStCLENBQUM7SUFDdEUsUUFBQSx3QkFBd0IsR0FBRywyQkFBMkIsQ0FBQztJQUVwRSxJQUFrQixjQUtqQjtJQUxELFdBQWtCLGNBQWM7UUFDL0IsbURBQVEsQ0FBQTtRQUNSLHFEQUFTLENBQUE7UUFDVCxxREFBUyxDQUFBO1FBQ1QscURBQVMsQ0FBQTtJQUNWLENBQUMsRUFMaUIsY0FBYyw4QkFBZCxjQUFjLFFBSy9CO0lBRUQsSUFBa0Isc0JBS2pCO0lBTEQsV0FBa0Isc0JBQXNCO1FBQ3ZDLHFDQUFXLENBQUE7UUFDWCx5Q0FBZSxDQUFBO1FBQ2YseUNBQWUsQ0FBQTtRQUNmLG9DQUFVLENBQUE7SUFDWCxDQUFDLEVBTGlCLHNCQUFzQixzQ0FBdEIsc0JBQXNCLFFBS3ZDIn0=