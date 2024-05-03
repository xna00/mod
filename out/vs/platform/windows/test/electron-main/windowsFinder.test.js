/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/workspaces/common/workspaces", "vs/base/common/network", "vs/base/test/common/utils"], function (require, exports, assert, event_1, path_1, resources_1, uri_1, windowsFinder_1, workspaces_1, network_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WindowsFinder', () => {
        const fixturesFolder = network_1.FileAccess.asFileUri('vs/platform/windows/test/electron-main/fixtures').fsPath;
        const testWorkspace = {
            id: Date.now().toString(),
            configPath: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'workspaces.json'))
        };
        const testWorkspaceFolders = (0, workspaces_1.toWorkspaceFolders)([{ path: (0, path_1.join)(fixturesFolder, 'vscode_workspace_1_folder') }, { path: (0, path_1.join)(fixturesFolder, 'vscode_workspace_2_folder') }], testWorkspace.configPath, resources_1.extUriBiasedIgnorePathCase);
        const localWorkspaceResolver = async (workspace) => { return workspace === testWorkspace ? { id: testWorkspace.id, configPath: workspace.configPath, folders: testWorkspaceFolders } : undefined; };
        function createTestCodeWindow(options) {
            return new class {
                constructor() {
                    this.onWillLoad = event_1.Event.None;
                    this.onDidMaximize = event_1.Event.None;
                    this.onDidUnmaximize = event_1.Event.None;
                    this.onDidTriggerSystemContextMenu = event_1.Event.None;
                    this.onDidSignalReady = event_1.Event.None;
                    this.onDidClose = event_1.Event.None;
                    this.onDidDestroy = event_1.Event.None;
                    this.onDidEnterFullScreen = event_1.Event.None;
                    this.onDidLeaveFullScreen = event_1.Event.None;
                    this.whenClosedOrLoaded = Promise.resolve();
                    this.id = -1;
                    this.win = null;
                    this.openedWorkspace = options.openedFolderUri ? { id: '', uri: options.openedFolderUri } : options.openedWorkspace;
                    this.isExtensionDevelopmentHost = false;
                    this.isExtensionTestHost = false;
                    this.lastFocusTime = options.lastFocusTime;
                    this.isFullScreen = false;
                    this.isReady = true;
                }
                ready() { throw new Error('Method not implemented.'); }
                setReady() { throw new Error('Method not implemented.'); }
                addTabbedWindow(window) { throw new Error('Method not implemented.'); }
                load(config, options) { throw new Error('Method not implemented.'); }
                reload(cli) { throw new Error('Method not implemented.'); }
                focus(options) { throw new Error('Method not implemented.'); }
                close() { throw new Error('Method not implemented.'); }
                getBounds() { throw new Error('Method not implemented.'); }
                send(channel, ...args) { throw new Error('Method not implemented.'); }
                sendWhenReady(channel, token, ...args) { throw new Error('Method not implemented.'); }
                toggleFullScreen() { throw new Error('Method not implemented.'); }
                setRepresentedFilename(name) { throw new Error('Method not implemented.'); }
                getRepresentedFilename() { throw new Error('Method not implemented.'); }
                setDocumentEdited(edited) { throw new Error('Method not implemented.'); }
                isDocumentEdited() { throw new Error('Method not implemented.'); }
                handleTitleDoubleClick() { throw new Error('Method not implemented.'); }
                updateTouchBar(items) { throw new Error('Method not implemented.'); }
                serializeWindowState() { throw new Error('Method not implemented'); }
                updateWindowControls(options) { throw new Error('Method not implemented.'); }
                notifyZoomLevel(level) { throw new Error('Method not implemented.'); }
                dispose() { }
            };
        }
        const vscodeFolderWindow = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder')) });
        const lastActiveWindow = createTestCodeWindow({ lastFocusTime: 3, openedFolderUri: undefined });
        const noVscodeFolderWindow = createTestCodeWindow({ lastFocusTime: 2, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder')) });
        const windows = [
            vscodeFolderWindow,
            lastActiveWindow,
            noVscodeFolderWindow,
        ];
        test('New window without folder when no windows exist', async () => {
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)([], uri_1.URI.file('nonexisting'), localWorkspaceResolver), undefined);
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)([], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'file.txt')), localWorkspaceResolver), undefined);
        });
        test('Existing window with folder', async () => {
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)(windows, uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'file.txt')), localWorkspaceResolver), noVscodeFolderWindow);
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)(windows, uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'file.txt')), localWorkspaceResolver), vscodeFolderWindow);
            const window = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'nested_folder')) });
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)([window], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_folder', 'nested_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), window);
        });
        test('More specific existing window wins', async () => {
            const window = createTestCodeWindow({ lastFocusTime: 2, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder')) });
            const nestedFolderWindow = createTestCodeWindow({ lastFocusTime: 1, openedFolderUri: uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'nested_folder')) });
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)([window, nestedFolderWindow], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'no_vscode_folder', 'nested_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), nestedFolderWindow);
        });
        test('Workspace folder wins', async () => {
            const window = createTestCodeWindow({ lastFocusTime: 1, openedWorkspace: testWorkspace });
            assert.strictEqual(await (0, windowsFinder_1.findWindowOnFile)([window], uri_1.URI.file((0, path_1.join)(fixturesFolder, 'vscode_workspace_2_folder', 'nested_vscode_folder', 'subfolder', 'file.txt')), localWorkspaceResolver), window);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93c0ZpbmRlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93aW5kb3dzL3Rlc3QvZWxlY3Ryb24tbWFpbi93aW5kb3dzRmluZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLE1BQU0sY0FBYyxHQUFHLG9CQUFVLENBQUMsU0FBUyxDQUFDLGlEQUFpRCxDQUFDLENBQUMsTUFBTSxDQUFDO1FBRXRHLE1BQU0sYUFBYSxHQUF5QjtZQUMzQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRTtZQUN6QixVQUFVLEVBQUUsU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztTQUM3RCxDQUFDO1FBRUYsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLCtCQUFrQixFQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBQSxXQUFJLEVBQUMsY0FBYyxFQUFFLDJCQUEyQixDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFBLFdBQUksRUFBQyxjQUFjLEVBQUUsMkJBQTJCLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLFVBQVUsRUFBRSxzQ0FBMEIsQ0FBQyxDQUFDO1FBQ2xPLE1BQU0sc0JBQXNCLEdBQUcsS0FBSyxFQUFFLFNBQWMsRUFBRSxFQUFFLEdBQUcsT0FBTyxTQUFTLEtBQUssYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxT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