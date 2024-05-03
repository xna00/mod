/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/windows/electron-main/windowsStateHandler"], function (require, exports, assert, os_1, path_1, uri_1, utils_1, windowsStateHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Windows State Storing', () => {
        function getUIState() {
            return {
                x: 0,
                y: 10,
                width: 100,
                height: 200,
                mode: 0
            };
        }
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
        function assertEqualWindowState(expected, actual, message) {
            if (!expected || !actual) {
                assert.deepStrictEqual(expected, actual, message);
                return;
            }
            assert.strictEqual(expected.backupPath, actual.backupPath, message);
            assertEqualURI(expected.folderUri, actual.folderUri, message);
            assert.strictEqual(expected.remoteAuthority, actual.remoteAuthority, message);
            assertEqualWorkspace(expected.workspace, actual.workspace, message);
            assert.deepStrictEqual(expected.uiState, actual.uiState, message);
        }
        function assertEqualWindowsState(expected, actual, message) {
            assertEqualWindowState(expected.lastPluginDevelopmentHostWindow, actual.lastPluginDevelopmentHostWindow, message);
            assertEqualWindowState(expected.lastActiveWindow, actual.lastActiveWindow, message);
            assert.strictEqual(expected.openedWindows.length, actual.openedWindows.length, message);
            for (let i = 0; i < expected.openedWindows.length; i++) {
                assertEqualWindowState(expected.openedWindows[i], actual.openedWindows[i], message);
            }
        }
        function assertRestoring(state, message) {
            const stored = (0, windowsStateHandler_1.getWindowsStateStoreData)(state);
            const restored = (0, windowsStateHandler_1.restoreWindowsState)(stored);
            assertEqualWindowsState(state, restored, message);
        }
        const testBackupPath1 = (0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'backupFolder1');
        const testBackupPath2 = (0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'backupFolder2');
        const testWSPath = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'test.code-workspace'));
        const testFolderURI = uri_1.URI.file((0, path_1.join)((0, os_1.tmpdir)(), 'windowStateTest', 'testFolder'));
        const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/d');
        test('storing and restoring', () => {
            let windowState;
            windowState = {
                openedWindows: []
            };
            assertRestoring(windowState, 'no windows');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState() }]
            };
            assertRestoring(windowState, 'empty workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), workspace: toWorkspace(testWSPath) }]
            };
            assertRestoring(windowState, 'workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI }]
            };
            assertRestoring(windowState, 'folder');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), folderUri: testFolderURI }, { backupPath: testBackupPath1, uiState: getUIState(), folderUri: testRemoteFolderURI, remoteAuthority: 'bar' }]
            };
            assertRestoring(windowState, 'multiple windows');
            windowState = {
                lastActiveWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastActiveWindow');
            windowState = {
                lastPluginDevelopmentHostWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastPluginDevelopmentHostWindow');
        });
        test('open 1_32', () => {
            const v1_32_workspace = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"workspaceIdentifier": {
					"id": "53b714b46ef1a2d4346568b4f591028c",
					"configURIPath": "file:///home/user/workspaces/testing/custom.code-workspace"
				},
				"backupPath": "/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c",
				"uiState": {
					"mode": 0,
					"x": 0,
					"y": 27,
					"width": 2560,
					"height": 1364
				}
			}
		}`;
            let windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_workspace));
            let expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c',
                    uiState: { mode: 0 /* WindowMode.Maximized */, x: 0, y: 27, width: 2560, height: 1364 },
                    workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_workspace');
            const v1_32_folder = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"folder": "file:///home/user/workspaces/testing/folding",
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5",
				"uiState": {
					"mode": 1,
					"x": 625,
					"y": 263,
					"width": 1718,
					"height": 953
				}
			}
		}`;
            windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_folder));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5',
                    uiState: { mode: 1 /* WindowMode.Normal */, x: 625, y: 263, width: 1718, height: 953 },
                    folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding')
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_folder');
            const v1_32_empty_window = ` {
			"openedWindows": [
			],
			"lastActiveWindow": {
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1549539668998",
				"uiState": {
					"mode": 1,
					"x": 768,
					"y": 336,
					"width": 1024,
					"height": 768
				}
			}
		}`;
            windowsState = (0, windowsStateHandler_1.restoreWindowsState)(JSON.parse(v1_32_empty_window));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1549539668998',
                    uiState: { mode: 1 /* WindowMode.Normal */, x: 768, y: 336, width: 1024, height: 768 }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_empty_window');
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c1N0YXRlSGFuZGxlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93aW5kb3dzL3Rlc3QvZWxlY3Ryb24tbWFpbi93aW5kb3dzU3RhdGVIYW5kbGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUVuQyxTQUFTLFVBQVU7WUFDbEIsT0FBTztnQkFDTixDQUFDLEVBQUUsQ0FBQztnQkFDSixDQUFDLEVBQUUsRUFBRTtnQkFDTCxLQUFLLEVBQUUsR0FBRztnQkFDVixNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsQ0FBQzthQUNQLENBQUM7UUFDSCxDQUFDO1FBRUQsU0FBUyxXQUFXLENBQUMsR0FBUTtZQUM1QixPQUFPO2dCQUNOLEVBQUUsRUFBRSxNQUFNO2dCQUNWLFVBQVUsRUFBRSxHQUFHO2FBQ2YsQ0FBQztRQUNILENBQUM7UUFDRCxTQUFTLGNBQWMsQ0FBQyxFQUFtQixFQUFFLEVBQW1CLEVBQUUsT0FBZ0I7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELFNBQVMsb0JBQW9CLENBQUMsRUFBb0MsRUFBRSxFQUFvQyxFQUFFLE9BQWdCO1lBQ3pILElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFX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