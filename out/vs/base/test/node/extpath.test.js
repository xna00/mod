/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/node/extpath", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils"], function (require, exports, assert, os_1, extpath_1, pfs_1, utils_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('Extpath', () => {
        let testDir;
        setup(() => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'extpath');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            return pfs_1.Promises.rm(testDir);
        });
        test('realcaseSync', async () => {
            // assume case insensitive file system
            if (process.platform === 'win32' || process.platform === 'darwin') {
                const upper = testDir.toUpperCase();
                const real = (0, extpath_1.realcaseSync)(upper);
                if (real) { // can be null in case of permission errors
                    assert.notStrictEqual(real, upper);
                    assert.strictEqual(real.toUpperCase(), upper);
                    assert.strictEqual(real, testDir);
                }
            }
            // linux, unix, etc. -> assume case sensitive file system
            else {
                let real = (0, extpath_1.realcaseSync)(testDir);
                assert.strictEqual(real, testDir);
                real = (0, extpath_1.realcaseSync)(testDir.toUpperCase());
                assert.strictEqual(real, testDir.toUpperCase());
            }
        });
        test('realcase', async () => {
            // assume case insensitive file system
            if (process.platform === 'win32' || process.platform === 'darwin') {
                const upper = testDir.toUpperCase();
                const real = await (0, extpath_1.realcase)(upper);
                if (real) { // can be null in case of permission errors
                    assert.notStrictEqual(real, upper);
                    assert.strictEqual(real.toUpperCase(), upper);
                    assert.strictEqual(real, testDir);
                }
            }
            // linux, unix, etc. -> assume case sensitive file system
            else {
                let real = await (0, extpath_1.realcase)(testDir);
                assert.strictEqual(real, testDir);
                real = await (0, extpath_1.realcase)(testDir.toUpperCase());
                assert.strictEqual(real, testDir.toUpperCase());
            }
        });
        test('realpath', async () => {
            const realpathVal = await (0, extpath_1.realpath)(testDir);
            assert.ok(realpathVal);
        });
        test('realpathSync', () => {
            const realpath = (0, extpath_1.realpathSync)(testDir);
            assert.ok(realpath);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cGF0aC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL3Rlc3Qvbm9kZS9leHRwYXRoLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsSUFBQSxzQkFBVSxFQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBSSxPQUFlLENBQUM7UUFFcEIsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE9BQU8sR0FBRyxJQUFBLDZCQUFpQixFQUFDLElBQUEsV0FBTSxHQUFFLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTdELE9BQU8sY0FBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFPLGNBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBRS9CLHNDQUFzQztZQUN0QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ25FLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBQSxzQkFBWSxFQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVqQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsMkNBQTJDO29CQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztvQkFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJ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