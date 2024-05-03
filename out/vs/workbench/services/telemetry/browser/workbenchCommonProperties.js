/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uuid", "vs/platform/telemetry/common/telemetryUtils", "vs/base/common/objects", "vs/platform/telemetry/common/telemetry", "vs/base/browser/touch"], function (require, exports, Platform, uuid, telemetryUtils_1, objects_1, telemetry_1, touch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveWorkbenchCommonProperties = resolveWorkbenchCommonProperties;
    /**
     * General function to help reduce the individuality of user agents
     * @param userAgent userAgent from browser window
     * @returns A simplified user agent with less detail
     */
    function cleanUserAgent(userAgent) {
        return userAgent.replace(/(\d+\.\d+)(\.\d+)+/g, '$1');
    }
    function resolveWorkbenchCommonProperties(storageService, commit, version, isInternalTelemetry, remoteAuthority, productIdentifier, removeMachineId, resolveAdditionalProperties) {
        const result = Object.create(null);
        const firstSessionDate = storageService.get(telemetry_1.firstSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        const lastSessionDate = storageService.get(telemetry_1.lastSessionDateStorageKey, -1 /* StorageScope.APPLICATION */);
        let machineId;
        if (!removeMachineId) {
            machineId = storageService.get(telemetry_1.machineIdKey, -1 /* StorageScope.APPLICATION */);
            if (!machineId) {
                machineId = uuid.generateUuid();
                storageService.store(telemetry_1.machineIdKey, machineId, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
        }
        else {
            machineId = `Redacted-${productIdentifier ?? 'web'}`;
        }
        /**
         * Note: In the web, session date information is fetched from browser storage, so these dates are tied to a specific
         * browser and not the machine overall.
         */
        // __GDPR__COMMON__ "common.firstSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.firstSessionDate'] = firstSessionDate;
        // __GDPR__COMMON__ "common.lastSessionDate" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.lastSessionDate'] = lastSessionDate || '';
        // __GDPR__COMMON__ "common.isNewSession" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isNewSession'] = !lastSessionDate ? '1' : '0';
        // __GDPR__COMMON__ "common.remoteAuthority" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.remoteAuthority'] = (0, telemetryUtils_1.cleanRemoteAuthority)(remoteAuthority);
        // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
        result['common.machineId'] = machineId;
        // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['sessionID'] = uuid.generateUuid() + Date.now();
        // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['commitHash'] = commit;
        // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['version'] = version;
        // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platform'] = Platform.PlatformToString(Platform.platform);
        // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.product'] = productIdentifier ?? 'web';
        // __GDPR__COMMON__ "common.userAgent" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.userAgent'] = Platform.userAgent ? cleanUserAgent(Platform.userAgent) : undefined;
        // __GDPR__COMMON__ "common.isTouchDevice" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.isTouchDevice'] = String(touch_1.Gesture.isTouchDevice());
        if (isInternalTelemetry) {
            // __GDPR__COMMON__ "common.msftInternal" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            result['common.msftInternal'] = isInternalTelemetry;
        }
        // dynamic properties which value differs on each call
        let seq = 0;
        const startTime = Date.now();
        Object.defineProperties(result, {
            // __GDPR__COMMON__ "timestamp" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            'timestamp': {
                get: () => new Date(),
                enumerable: true
            },
            // __GDPR__COMMON__ "common.timesincesessionstart" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.timesincesessionstart': {
                get: () => Date.now() - startTime,
                enumerable: true
            },
            // __GDPR__COMMON__ "common.sequence" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            'common.sequence': {
                get: () => seq++,
                enumerable: true
            }
        });
        if (resolveAdditionalProperties) {
            (0, objects_1.mixin)(result, resolveAdditionalProperties());
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2JlbmNoQ29tbW9uUHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3RlbGVtZXRyeS9icm93c2VyL3dvcmtiZW5jaENvbW1vblByb3BlcnRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLDRFQXVGQztJQWhHRDs7OztPQUlHO0lBQ0gsU0FBUyxjQUFjLENBQUMsU0FBaUI7UUFDeEMsT0FBTyxTQUFTLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxTQUFnQixnQ0FBZ0MsQ0FDL0MsY0FBK0IsRUFDL0IsTUFBMEIsRUFDMUIsT0FBMkIsRUFDM0IsbUJBQTRCLEVBQzVCLGVBQXdCLEVBQ3hCLGlCQUEwQixFQUMxQixlQUF5QixFQUN6QiwyQkFBMEQ7UUFFMUQsTUFBTSxNQUFNLEdBQXNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLHNDQUEwQixvQ0FBNEIsQ0FBQztRQUNuRyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLHFDQUF5QixvQ0FBNEIsQ0FBQztRQUVqRyxJQUFJLFNBQTZCLENBQUM7UUFDbEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3RCLFNBQVMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLHdCQUFZLG9DQUEyQixDQUFDO1lBQ3ZFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDaEIsU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDaEMsY0FBYyxDQUFDLEtBQUssQ0FBQyx3QkFBWSxFQUFFLFNBQVMsbUVBQWtELENBQUM7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