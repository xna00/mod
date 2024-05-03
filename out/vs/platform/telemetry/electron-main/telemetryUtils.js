/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/node/telemetryUtils"], function (require, exports, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMachineId = resolveMachineId;
    exports.resolveSqmId = resolveSqmId;
    async function resolveMachineId(stateService, logService) {
        // Call the node layers implementation to avoid code duplication
        const machineId = await (0, telemetryUtils_1.resolveMachineId)(stateService, logService);
        stateService.setItem(telemetry_1.machineIdKey, machineId);
        return machineId;
    }
    async function resolveSqmId(stateService, logService) {
        const sqmId = await (0, telemetryUtils_1.resolveSqmId)(stateService, logService);
        stateService.setItem(telemetry_1.sqmIdKey, sqmId);
        return sqmId;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9lbGVjdHJvbi1tYWluL3RlbGVtZXRyeVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLDRDQUtDO0lBRUQsb0NBSUM7SUFYTSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsWUFBMkIsRUFBRSxVQUF1QjtRQUMxRixnRUFBZ0U7UUFDaEUsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFBLGlDQUFvQixFQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN2RSxZQUFZLENBQUMsT0FBTyxDQUFDLHdCQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVNLEtBQUssVUFBVSxZQUFZLENBQUMsWUFBMkIsRUFBRSxVQUF1QjtRQUN0RixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsNkJBQWdCLEVBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQy9ELFlBQVksQ0FBQyxPQUFPLENBQUMsb0JBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUMifQ==