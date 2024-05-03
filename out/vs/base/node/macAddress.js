/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os"], function (require, exports, os_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMac = getMac;
    const invalidMacAddresses = new Set([
        '00:00:00:00:00:00',
        'ff:ff:ff:ff:ff:ff',
        'ac:de:48:00:11:22'
    ]);
    function validateMacAddress(candidate) {
        const tempCandidate = candidate.replace(/\-/g, ':').toLowerCase();
        return !invalidMacAddresses.has(tempCandidate);
    }
    function getMac() {
        const ifaces = (0, os_1.networkInterfaces)();
        for (const name in ifaces) {
            const networkInterface = ifaces[name];
            if (networkInterface) {
                for (const { mac } of networkInterface) {
                    if (validateMacAddress(mac)) {
                        return mac;
                    }
                }
            }
        }
        throw new Error('Unable to retrieve mac address (unexpected format)');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFjQWRkcmVzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9ub2RlL21hY0FkZHJlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFlaEcsd0JBY0M7SUF6QkQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUNuQyxtQkFBbUI7UUFDbkIsbUJBQW1CO1FBQ25CLG1CQUFtQjtLQUNuQixDQUFDLENBQUM7SUFFSCxTQUFTLGtCQUFrQixDQUFDLFNBQWlCO1FBQzVDLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2xFLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELFNBQWdCLE1BQU07UUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQkFBaUIsR0FBRSxDQUFDO1FBQ25DLEtBQUssTUFBTSxJQUFJLElBQUksTUFBTSxFQUFFLENBQUM7WUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN0QixLQUFLLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUN4QyxJQUFJLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQzdCLE9BQU8sR0FBRyxDQUFDO29CQUNaLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO0lBQ3ZFLENBQUMifQ==