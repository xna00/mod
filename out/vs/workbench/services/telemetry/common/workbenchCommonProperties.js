/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/commonProperties", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, commonProperties_1, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
    function resolveWorkbenchCommonProperties(storageService, release, hostname, commit, version, machineId, sqmId, isInternalTelemetry, process, remoteAuthority) {
        const result = (0, commonProperties_1.resolveCommonProperties)(release, hostname, process.arch, commit, version, machineId, sqmId, isInternalTelemetry);
        const firstSessionDate = storageService.get(telemetry_1.firstSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        const lastSessionDate = storageService.get(telemetry_1.lastSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        // __GDPR__COMMON__ "common.version.shell" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.version.shell'] = process.versions?.['electron'];
        // __GDPR__COMMON__ "common.version.renderer" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.version.renderer'] = process.versions?.['chrome'];
        // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.firstSessionDate'] = firstSessionDate;
        // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.lastSessionDate'] = lastSessionDate || '';
        // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
        // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.remoteAuthority'] = (0, telemetryUtils_1.cleanRemoteAuthority)(remoteAuthority);
        // __GDPR__COMMON__ "common.cli" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.cli'] = !!process.env['VSCODE_CLI'];
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoQ29tbW9uUHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RlbGVtZXRyeS9jb21tb24vd29ya2JlbmNoQ29tbW9uUHJvcGVydGllcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyw0RUFnQ0M7SUFoQ0QsU0FBZ0IsZ0NBQWdDLENBQy9DLGNBQStCLEVBQy9CLE9BQWUsRUFDZixRQUFnQixFQUNoQixNQUEwQixFQUMxQixPQUEyQixFQUMzQixTQUFpQixFQUNqQixLQUFhLEVBQ2IsbUJBQTRCLEVBQzVCLE9BQXFCLEVBQ3JCLGVBQXdCO1FBRXhCLE1BQU0sTUFBTSxHQUFHLElBQUEsMENBQXVCLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2hJLE1BQU0sZ0JBQWdCLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxzQ0FBMEIsb0NBQTRCLENBQUM7UUFDbkcsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxxQ0FBeUIsb0NBQTRCLENBQUM7UUFFakcsc0hBQXNIO1FBQ3RILE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNoRSx5SEFBeUg7UUFDekgsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pFLG1IQUFtSDtRQUNuSCxNQUFNLENBQUMseUJBQXlCLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQztRQUNyRCxrSEFBa0g7UUFDbEgsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsZUFBZSxJQUFJLEVBQUUsQ0FBQztRQUN6RCwrR0FBK0c7UUFDL0csTUFBTSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQzdELHdIQUF3SDtRQUN4SCxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxJQUFBLHFDQUFvQixFQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3pFLHNHQUFzRztRQUN0RyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFbkQsT0FBTyxNQUFNLENBQUM7SUFDZixDQUFDIn0=