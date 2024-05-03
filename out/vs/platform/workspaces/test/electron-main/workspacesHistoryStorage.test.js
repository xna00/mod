/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/workspaces/common/workspaces"], function (require, exports, assert, os_1, path_1, uri_1, utils_1, log_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('History Storage', () => {
        function toWorkspace(uri) {
            return {
                id: '1234',
                configPath: uri
            };
        }
        function assertEqualURI(u1, u2, message) {
            assert.strictEqual(u1 && u1.toString(), u2 && u2.toString(), message);
        }
        function assertEqualWorkspace(w1, w2, message) {
            if (!w1 || !w2) {
                assert.strictEqual(w1, w2, message);
                return;
            }
            assert.strictEqual(w1.id, w2.id, message);
            assertEqualURI(w1.configPath, w2.configPath, message);
        }
        function assertEqualRecentlyOpened(actual, expected, message) {
            assert.strictEqual(actual.files.length, expected.files.length, message);
            for (let i = 0; i < actual.files.length; i++) {
                assertEqualURI(actual.files[i].fileUri, expected.files[i].fileUri, message);
                assert.strictEqual(actual.files[i].label, expected.files[i].label);
                assert.strictEqual(actual.files[i].remoteAuthority, expected.files[i].remoteAuthority);
            }
            assert.strictEqual(actual.workspaces.length, expected.workspaces.length, message);
            for (let i = 0; i < actual.workspaces.length; i++) {
                const expectedRecent = expected.workspaces[i];
                const actualRecent = actual.workspaces[i];
                if ((0, workspaces_1.isRecentFolder)(actualRecent)) {
                    assertEqualURI(actualRecent.folderUri, expectedRecent.folderUri, message);
                }
                else {
                    assertEqualWorkspace(actualRecent.workspace, expectedRecent.workspace, message);
                }
                assert.strictEqual(actualRecent.label, expectedRecent.label);
                assert.strictEqual(actualRecent.remoteAuthority, actualRecent.remoteAuthority);
            }
        }
        function assertRestoring(state, message) {
            const stored = (0, workspaces_1.toStoreData)(state);
            const restored = (0, workspaces_1.restoreRecentlyOpened)(stored, new log_1.NullLogService());
            assertEqualRecentlyOpened(state, restored, message);
        }
        const testWSPath = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'test.code-workspace'));
        const testFileURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFile.txt'));
        const testFolderURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFolder'));
        const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/e');
        const testRemoteFileURI = uri_1.URI.parse('foo://bar/c/d.txt');
        const testRemoteWSURI = uri_1.URI.parse('foo://bar/c/test.code-workspace');
        test('storing and restoring', () => {
            let ro;
            ro = {
                files: [],
                workspaces: []
            };
            assertRestoring(ro, 'empty');
            ro = {
                files: [{ fileUri: testFileURI }],
                workspaces: []
            };
            assertRestoring(ro, 'file');
            ro = {
                files: [],
                workspaces: [{ folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'folder');
            ro = {
                files: [],
                workspaces: [{ workspace: toWorkspace(testWSPath) }, { folderUri: testFolderURI }]
            };
            assertRestoring(ro, 'workspaces and folders');
            ro = {
                files: [{ fileUri: testRemoteFileURI }],
                workspaces: [{ workspace: toWorkspace(testRemoteWSURI) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'remote workspaces and folders');
            ro = {
                files: [{ label: 'abc', fileUri: testFileURI }],
                workspaces: [{ label: 'def', workspace: toWorkspace(testWSPath) }, { folderUri: testRemoteFolderURI }]
            };
            assertRestoring(ro, 'labels');
            ro = {
                files: [{ label: 'abc', remoteAuthority: 'test', fileUri: testRemoteFileURI }],
                workspaces: [{ label: 'def', remoteAuthority: 'test', workspace: toWorkspace(testWSPath) }, { folderUri: testRemoteFolderURI, remoteAuthority: 'test' }]
            };
            assertRestoring(ro, 'authority');
        });
        test('open 1_55', () => {
            const v1_55 = `{
			"entries": [
				{
					"folderUri": "foo://bar/23/43",
					"remoteAuthority": "test+test"
				},
				{
					"workspace": {
						"id": "53b714b46ef1a2d4346568b4f591028c",
						"configPath": "file:///home/user/workspaces/testing/custom.code-workspace"
					}
				},
				{
					"folderUri": "file:///home/user/workspaces/testing/folding",
					"label": "abc"
				},
				{
					"fileUri": "file:///home/user/.config/code-oss-dev/storage.json",
					"label": "def"
				}
			]
		}`;
            const windowsState = (0, workspaces_1.restoreRecentlyOpened)(JSON.parse(v1_55), new log_1.NullLogService());
            const expected = {
                files: [{ label: 'def', fileUri: uri_1.URI.parse('file:///home/user/.config/code-oss-dev/storage.json') }],
                workspaces: [
                    { folderUri: uri_1.URI.parse('foo://bar/23/43'), remoteAuthority: 'test+test' },
                    { workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') } },
                    { label: 'abc', folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding') }
                ]
            };
            assertEqualRecentlyOpened(windowsState, expected, 'v1_33');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc0hpc3RvcnlTdG9yYWdlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3dvcmtzcGFjZXMvdGVzdC9lbGVjdHJvbi1tYWluL3dvcmtzcGFjZXNIaXN0b3J5U3RvcmFnZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBV2hHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFFN0IsU0FBUyxXQUFXLENBQUMsR0FBUTtZQUM1QixPQUFPO2dCQUNOLEVBQUUsRUFBRSxNQUFNO2dCQUNWLFVBQVUsRUFBRSxHQUFHO2FBQ2YsQ0FBQztRQUNILENBQUM7UUFDRCxTQUFTLGNBQWMsQ0FBQyxFQUFtQixFQUFFLEVBQW1CLEVBQUUsT0FBZ0I7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELFNBQVMsb0JBQW9CLENBQUMsRUFBb0MsRUFBRSxFQUFvQyxFQUFFLE9BQWdCO1lBQ3pILElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkQs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