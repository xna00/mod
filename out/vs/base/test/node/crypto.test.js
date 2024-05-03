/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/path", "vs/base/node/crypto", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils"], function (require, exports, os_1, path_1, crypto_1, pfs_1, utils_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('Crypto', () => {
        let testDir;
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'crypto');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(function () {
            return pfs_1.Promises.rm(testDir);
        });
        test('checksum', async () => {
            const testFile = (0, path_1.join)(testDir, 'checksum.txt');
            await pfs_1.Promises.writeFile(testFile, 'Hello World');
            await (0, crypto_1.checksum)(testFile, 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J5cHRvLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL2NyeXB0by50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLElBQUEsc0JBQVUsRUFBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1FBRXpCLElBQUksT0FBZSxDQUFDO1FBRXBCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUM7WUFDTCxPQUFPLEdBQUcsSUFBQSw2QkFBaUIsRUFBQyxJQUFBLFdBQU0sR0FBRSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUU1RCxPQUFPLGNBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxRQUFRLENBQUM7WUFDUixPQUFPLGNBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNCLE1BQU0sUUFBUSxHQUFHLElBQUEsV0FBSSxFQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUMvQyxNQUFNLGNBQVEsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRWxELE1BQU0sSUFBQSxpQkFBUSxFQUFDLFFBQVEsRUFBRSxrRUFBa0UsQ0FBQyxDQUFDO1FBQzlGLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==