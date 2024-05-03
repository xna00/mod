/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/node/id", "vs/platform/telemetry/common/telemetry"], function (require, exports, platform_1, id_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMachineId = resolveMachineId;
    exports.resolveSqmId = resolveSqmId;
    async function resolveMachineId(stateService, logService) {
        // We cache the machineId for faster lookups
        // and resolve it only once initially if not cached or we need to replace the macOS iBridge device
        let machineId = stateService.getItem(telemetry_1.machineIdKey);
        if (typeof machineId !== 'string' || (platform_1.isMacintosh && machineId === '6c9d2bc8f91b89624add29c0abeae7fb42bf539fa1cdb2e3e57cd668fa9bcead')) {
            machineId = await (0, id_1.getMachineId)(logService.error.bind(logService));
        }
        return machineId;
    }
    async function resolveSqmId(stateService, logService) {
        let sqmId = stateService.getItem(telemetry_1.sqmIdKey);
        if (typeof sqmId !== 'string') {
            sqmId = await (0, id_1.getSqmMachineId)(logService.error.bind(logService));
        }
        return sqmId;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVsZW1ldHJ5VXRpbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RlbGVtZXRyeS9ub2RlL3RlbGVtZXRyeVV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLDRDQVNDO0lBRUQsb0NBT0M7SUFsQk0sS0FBSyxVQUFVLGdCQUFnQixDQUFDLFlBQStCLEVBQUUsVUFBdUI7UUFDOUYsNENBQTRDO1FBQzVDLGtHQUFrRztRQUNsRyxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFTLHdCQUFZLENBQUMsQ0FBQztRQUMzRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFBSSxDQUFDLHNCQUFXLElBQUksU0FBUyxLQUFLLGtFQUFrRSxDQUFDLEVBQUUsQ0FBQztZQUN4SSxTQUFTLEdBQUcsTUFBTSxJQUFBLGlCQUFZLEVBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVNLEtBQUssVUFBVSxZQUFZLENBQUMsWUFBK0IsRUFBRSxVQUF1QjtRQUMxRixJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFTLG9CQUFRLENBQUMsQ0FBQztRQUNuRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQy9CLEtBQUssR0FBRyxNQUFNLElBQUEsb0JBQWUsRUFBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUMifQ==