/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/async", "vs/base/common/network", "vs/base/common/path", "vs/base/node/pfs", "vs/base/node/zip", "vs/base/test/common/utils", "vs/base/test/node/testUtils"], function (require, exports, assert, os_1, async_1, network_1, path, pfs_1, zip_1, utils_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Zip', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('extract should handle directories', async () => {
            const testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'zip');
            await pfs_1.Promises.mkdir(testDir, { recursive: true });
            const fixtures = network_1.FileAccess.asFileUri('vs/base/test/node/zip/fixtures').fsPath;
            const fixture = path.join(fixtures, 'extract.zip');
            await (0, async_1.createCancelablePromise)(token => (0, zip_1.extract)(fixture, testDir, {}, token));
            const doesExist = await pfs_1.Promises.exists(path.join(testDir, 'extension'));
            assert(doesExist);
            await pfs_1.Promises.rm(testDir);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9ub2RlL3ppcC96aXAudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtRQUVqQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BELE1BQU0sT0FBTyxHQUFHLElBQUEsNkJBQWlCLEVBQUMsSUFBQSxXQUFNLEdBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDL0QsTUFBTSxjQUFRLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sUUFBUSxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQy9FLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sSUFBQSwrQkFBdUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUEsYUFBTyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDN0UsTUFBTSxTQUFTLEdBQUcsTUFBTSxjQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWxCLE1BQU0sY0FBUSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=