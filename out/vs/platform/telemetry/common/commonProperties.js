/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/uuid"], function (require, exports, platform_1, process_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveCommonProperties = resolveCommonProperties;
    exports.verifyMicrosoftInternalDomain = verifyMicrosoftInternalDomain;
    function getPlatformDetail(hostname) {
        if (platform_1.platform === 2 /* Platform.Linux */ && /^penguin(\.|$)/i.test(hostname)) {
            return 'chromebook';
        }
        return undefined;
    }
    function resolveCommonProperties(release, hostname, arch, commit, version, machineId, sqmId, isInternalTelemetry, product) {
        const result = Object.create(null);
        // __GDPR__COMMON__ "common.machineId" : { "endPoint": "MacAddressHash", "classification": "EndUserPseudonymizedInformation", "purpose": "FeatureInsight" }
        result['common.machineId'] = machineId;
        // __GDPR__COMMON__ "common.sqmId" : { "endPoint": "SqmMachineId", "classification": "EndUserPseudonymizedInformation", "purpose": "BusinessInsight" }
        result['common.sqmId'] = sqmId;
        // __GDPR__COMMON__ "sessionID" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['sessionID'] = (0, uuid_1.generateUuid)() + Date.now();
        // __GDPR__COMMON__ "commitHash" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['commitHash'] = commit;
        // __GDPR__COMMON__ "version" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['version'] = version;
        // __GDPR__COMMON__ "common.platformVersion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platformVersion'] = (release || '').replace(/^(\d+)(\.\d+)?(\.\d+)?(.*)/, '$1$2$3');
        // __GDPR__COMMON__ "common.platform" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        result['common.platform'] = (0, platform_1.PlatformToString)(platform_1.platform);
        // __GDPR__COMMON__ "common.nodePlatform" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodePlatform'] = process_1.platform;
        // __GDPR__COMMON__ "common.nodeArch" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.nodeArch'] = arch;
        // __GDPR__COMMON__ "common.product" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
        result['common.product'] = product || 'desktop';
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
        if (platform_1.isLinuxSnap) {
            // __GDPR__COMMON__ "common.snap" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.snap'] = 'true';
        }
        const platformDetail = getPlatformDetail(hostname);
        if (platformDetail) {
            // __GDPR__COMMON__ "common.platformDetail" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            result['common.platformDetail'] = platformDetail;
        }
        return result;
    }
    function verifyMicrosoftInternalDomain(domainList) {
        const userDnsDomain = process_1.env['USERDNSDOMAIN'];
        if (!userDnsDomain) {
            return false;
        }
        const domain = userDnsDomain.toLowerCase();
        return domainList.some(msftDomain => domain === msftDomain);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uUHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVsZW1ldHJ5L2NvbW1vbi9jb21tb25Qcm9wZXJ0aWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLDBEQXlFQztJQUVELHNFQVFDO0lBM0ZELFNBQVMsaUJBQWlCLENBQUMsUUFBZ0I7UUFDMUMsSUFBSSxtQkFBUSwyQkFBbUIsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNyRSxPQUFPLFlBQVksQ0FBQztRQUNyQixDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQWdCLHVCQUF1QixDQUN0QyxPQUFlLEVBQ2YsUUFBZ0IsRUFDaEIsSUFBWSxFQUNaLE1BQTBCLEVBQzFCLE9BQTJCLEVBQzNCLFNBQTZCLEVBQzdCLEtBQXlCLEVBQ3pCLG1CQUE0QixFQUM1QixPQUFnQjtRQUVoQixNQUFNLE1BQU0sR0FBc0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV0RCwySkFBMko7UUFDM0osTUFBTSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ3ZDLHNKQUFzSjtRQUN0SixNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQy9CLHFHQUFxRztRQUNyRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBQSxtQkFBWSxHQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2xELDRHQUE0RztRQUM1RyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsTUFBTSxDQUFDO1FBQzlCLG1HQUFtRztRQUNuRyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsT0FBTyxDQUFDO1FBQzVCLGtIQUFrSDtRQUNsSCxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbkcsMkdBQTJHO1FBQzNHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLElBQUEsMkJBQWdCLEVBQUMsbUJBQVEsQ0FBQyxDQUFDO1FBQ3ZELHFIQUFxSDtRQUNySCxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBRyxrQkFBWSxDQUFDO1FBQzdDLGlIQUFpSDtRQUNqSCxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDakMsZ0hBQWdIO1FBQ2hILE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLE9BQU8sSUFBSSxTQUFTLENBQUM7UUFFaEQsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3pCLHNJQUFzSTtZQUN0SSxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBRyxtQkFBbUIsQ0FBQztRQUNyRCxDQUFDO1FBRUQsc0RBQXNEO1FBQ3RELElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUNaLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO1lBQy9CLHFHQUFxRztZQUNyRyxXQUFXLEVBQUU7Z0JBQ1osR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFO2dCQUNyQixVQUFVLEVBQUUsSUFBSTthQUNoQjtZQUNELCtJQUErSTtZQUMvSSw4QkFBOEIsRUFBRTtnQkFDL0IsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTO2dCQUNqQyxVQUFVLEVBQUUsSUFBSTthQUNoQjtZQUNELGtJQUFrSTtZQUNsSSxpQkFBaUIsRUFBRTtnQkFDbEIsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRTtnQkFDaEIsVUFBVSxFQUFFLElBQUk7YUFDaEI7U0FDRCxDQUFDLENBQUM7UUFFSCxJQUFJLHNCQUFXLEVBQUUsQ0FBQztZQUNqQix1R0FBdUc7WUFDdkcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUNoQyxDQUFDO1FBRUQsTUFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbkQsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQixpSEFBaUg7WUFDakgsTUFBTSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsY0FBYyxDQUFDO1FBQ2xELENBQUM7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxTQUFnQiw2QkFBNkIsQ0FBQyxVQUE2QjtRQUMxRSxNQUFNLGFBQWEsR0FBRyxhQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3BCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMzQyxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEtBQUssVUFBVSxDQUFDLENBQUM7SUFDN0QsQ0FBQyJ9