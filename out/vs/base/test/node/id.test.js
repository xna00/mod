/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/id", "vs/base/node/macAddress", "vs/base/test/node/testUtils", "vs/base/test/common/utils"], function (require, exports, assert, id_1, macAddress_1, testUtils_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('ID', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('getMachineId', async function () {
            const errors = [];
            const id = await (0, id_1.getMachineId)(err => errors.push(err));
            assert.ok(id);
            assert.strictEqual(errors.length, 0);
        });
        test('getSqmId', async function () {
            const errors = [];
            const id = await (0, id_1.getSqmMachineId)(err => errors.push(err));
            assert.ok(typeof id === 'string');
            assert.strictEqual(errors.length, 0);
        });
        test('getMac', async () => {
            const macAddress = (0, macAddress_1.getMac)();
            assert.ok(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(macAddress), `Expected a MAC address, got: ${macAddress}`);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L25vZGUvaWQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxJQUFBLHNCQUFVLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtRQUNyQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxLQUFLO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNsQixNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsaUJBQVksRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLO1lBQ3JCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNsQixNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsb0JBQWUsRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekIsTUFBTSxVQUFVLEdBQUcsSUFBQSxtQkFBTSxHQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLEVBQUUsQ0FBQywyQ0FBMkMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsZ0NBQWdDLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDdkgsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9