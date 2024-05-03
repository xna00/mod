/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils", "vs/platform/workspaces/node/workspaces"], function (require, exports, assert, fs, os, path, platform_1, uri_1, pfs, utils_1, testUtils_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('Workspaces', () => {
        let testDir;
        const tmpDir = os.tmpdir();
        setup(async () => {
            testDir = (0, testUtils_1.getRandomTestPath)(tmpDir, 'vsctests', 'workspacesmanagementmainservice');
            return pfs.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            return pfs.Promises.rm(testDir);
        });
        test('getSingleWorkspaceIdentifier', async function () {
            const nonLocalUri = uri_1.URI.parse('myscheme://server/work/p/f1');
            const nonLocalUriId = (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(nonLocalUri);
            assert.ok(nonLocalUriId?.id);
            const localNonExistingUri = uri_1.URI.file(path.join(testDir, 'f1'));
            const localNonExistingUriId = (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(localNonExistingUri);
            assert.ok(!localNonExistingUriId);
            fs.mkdirSync(path.join(testDir, 'f1'));
            const localExistingUri = uri_1.URI.file(path.join(testDir, 'f1'));
            const localExistingUriId = (0, workspaces_1.getSingleFolderWorkspaceIdentifier)(localExistingUri, fs.statSync(localExistingUri.fsPath));
            assert.ok(localExistingUriId?.id);
        });
        test('workspace identifiers are stable', function () {
            // workspace identifier (local)
            assert.strictEqual((0, workspaces_1.getWorkspaceIdentifier)(uri_1.URI.file('/hello/test')).id, platform_1.isWindows /* slash vs backslash */ ? '9f3efb614e2cd7924e4b8076e6c72233' : 'e36736311be12ff6d695feefe415b3e8');
            // single folder identifier (local)
            const fakeStat = {
                ino: 1611312115129,
                birthtimeMs: 1611312115129,
                birthtime: new Date(1611312115129)
            };
            assert.strictEqual((0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri_1.URI.file('/hello/test'), fakeStat)?.id, platform_1.isWindows /* slash vs backslash */ ? '9a8441e897e5174fa388bc7ef8f7a710' : '1d726b3d516dc2a6d343abf4797eaaef');
            // workspace identifier (remote)
            assert.strictEqual((0, workspaces_1.getWorkspaceIdentifier)(uri_1.URI.parse('vscode-remote:/hello/test')).id, '786de4f224d57691f218dc7f31ee2ee3');
            // single folder identifier (remote)
            assert.strictEqual((0, workspaces_1.getSingleFolderWorkspaceIdentifier)(uri_1.URI.parse('vscode-remote:/hello/test'))?.id, '786de4f224d57691f218dc7f31ee2ee3');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlcy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2VzL3Rlc3QvZWxlY3Ryb24tbWFpbi93b3Jrc3BhY2VzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsSUFBQSxzQkFBVSxFQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFFN0IsSUFBSSxPQUFlLENBQUM7UUFFcEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRTNCLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNoQixPQUFPLEdBQUcsSUFBQSw2QkFBaUIsRUFBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLGlDQUFpQyxDQUFDLENBQUM7WUFFbkYsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhCQUE4QixFQUFFLEtBQUs7WUFDekMsTUFBTSxXQUFXLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1lBQzdELE1BQU0sYUFBYSxHQUFHLElBQUEsK0NBQWtDLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDdEUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFN0IsTUFBTSxtQkFBbUIsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLCtDQUFrQyxFQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdEYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFbEMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRXZDLE1BQU0sZ0JBQWdCLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzVELE1BQU0sa0JBQWtCLEdBQUcsSUFBQSwrQ0FBa0MsRUFBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdEgsTUFBTSxDQUFDLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxrQ0FBa0MsRUFBRTtZQUV4QywrQkFBK0I7WUFDL0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLG1DQUFzQixFQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsb0JBQVMsQ0FBRSx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFFdEwsbUNBQW1DO1lBQ25DLE1BQU0sUUFBUSxHQUFHO2dCQUNoQixHQUFHLEVBQUUsYUFBYTtnQkFDbEIsV0FBVyxFQUFFLGFBQWE7Z0JBQzFCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUM7YUFDbEMsQ0FBQztZQUNGLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSwrQ0FBa0MsRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsb0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFFeE4sZ0NBQWdDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxtQ0FBc0IsRUFBQyxTQUFHLENBQUMsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztZQUUxSCxvQ0FBb0M7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLCtDQUFrQyxFQUFDLFNBQUcsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ3hJLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=