/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/path", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/base/test/common/mock", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/api/common/extHostRpcService", "vs/base/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, path_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostTypes_1, extHostWorkspace_1, mock_1, testRPCProtocol_1, extHostRpcService_1, platform_1, extensions_2, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createExtHostWorkspace(mainContext, data, logService) {
        const result = new extHostWorkspace_1.ExtHostWorkspace(new extHostRpcService_1.ExtHostRpcService(mainContext), new class extends (0, mock_1.mock)() {
            constructor() {
                super(...arguments);
                this.workspace = data;
            }
        }, new class extends (0, mock_1.mock)() {
            getCapabilities() { return platform_1.isLinux ? 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */ : undefined; }
        }, logService, new class extends (0, mock_1.mock)() {
        });
        result.$initializeWorkspace(data, true);
        return result;
    }
    suite('ExtHostWorkspace', function () {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertAsRelativePath(workspace, input, expected, includeWorkspace) {
            const actual = workspace.getRelativePath(input, includeWorkspace);
            assert.strictEqual(actual, expected);
        }
        test('asRelativePath', () => {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/Applications/NewsWoWBot'), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, '/Coding/Applications/NewsWoWBot/bernd/das/brot', 'bernd/das/brot');
            assertAsRelativePath(ws, '/Apps/DartPubCache/hosted/pub.dartlang.org/convert-2.0.1/lib/src/hex.dart', '/Apps/DartPubCache/hosted/pub.dartlang.org/convert-2.0.1/lib/src/hex.dart');
            assertAsRelativePath(ws, '', '');
            assertAsRelativePath(ws, '/foo/bar', '/foo/bar');
            assertAsRelativePath(ws, 'in/out', 'in/out');
        });
        test('asRelativePath, same paths, #11402', function () {
            const root = '/home/aeschli/workspaces/samples/docker';
            const input = '/home/aeschli/workspaces/samples/docker';
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, input, input);
            const input2 = '/home/aeschli/workspaces/samples/docker/a.file';
            assertAsRelativePath(ws, input2, 'a.file');
        });
        test('asRelativePath, no workspace', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), null, new log_1.NullLogService());
            assertAsRelativePath(ws, '', '');
            assertAsRelativePath(ws, '/foo/bar', '/foo/bar');
        });
        test('asRelativePath, multiple folders', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(ws, '/Coding/One/file.txt', 'One/file.txt');
            assertAsRelativePath(ws, '/Coding/Two/files/out.txt', 'Two/files/out.txt');
            assertAsRelativePath(ws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
        });
        test('slightly inconsistent behaviour of asRelativePath and getWorkspaceFolder, #31553', function () {
            const mrws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'One/file.txt');
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'One/file.txt', true);
            assertAsRelativePath(mrws, '/Coding/One/file.txt', 'file.txt', false);
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'Two/files/out.txt');
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'Two/files/out.txt', true);
            assertAsRelativePath(mrws, '/Coding/Two/files/out.txt', 'files/out.txt', false);
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', true);
            assertAsRelativePath(mrws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', false);
            const srws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0)], name: 'Test' }, new log_1.NullLogService());
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'file.txt');
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'file.txt', false);
            assertAsRelativePath(srws, '/Coding/One/file.txt', 'One/file.txt', true);
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt');
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', true);
            assertAsRelativePath(srws, '/Coding/Two2/files/out.txt', '/Coding/Two2/files/out.txt', false);
        });
        test('getPath, legacy', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            assert.strictEqual(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), null, new log_1.NullLogService());
            assert.strictEqual(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), undefined, new log_1.NullLogService());
            assert.strictEqual(ws.getPath(), undefined);
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.file('Folder'), 0), aWorkspaceFolderData(uri_1.URI.file('Another/Folder'), 1)] }, new log_1.NullLogService());
            assert.strictEqual(ws.getPath().replace(/\\/g, '/'), '/Folder');
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.file('/Folder'), 0)] }, new log_1.NullLogService());
            assert.strictEqual(ws.getPath().replace(/\\/g, '/'), '/Folder');
        });
        test('WorkspaceFolder has name and index', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0), aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1)], name: 'Test' }, new log_1.NullLogService());
            const [one, two] = ws.getWorkspaceFolders();
            assert.strictEqual(one.name, 'One');
            assert.strictEqual(one.index, 0);
            assert.strictEqual(two.name, 'Two');
            assert.strictEqual(two.index, 1);
        });
        test('getContainingWorkspaceFolder', () => {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), {
                id: 'foo',
                name: 'Test',
                folders: [
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/One'), 0),
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/Two'), 1),
                    aWorkspaceFolderData(uri_1.URI.file('/Coding/Two/Nested'), 2)
                ]
            }, new log_1.NullLogService());
            let folder = ws.getWorkspaceFolder(uri_1.URI.file('/foo/bar'));
            assert.strictEqual(folder, undefined);
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/One/file/path.txt'));
            assert.strictEqual(folder.name, 'One');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/file/path.txt'));
            assert.strictEqual(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nest'));
            assert.strictEqual(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/file'));
            assert.strictEqual(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/f'));
            assert.strictEqual(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested'), true);
            assert.strictEqual(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/'), true);
            assert.strictEqual(folder.name, 'Two');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested'));
            assert.strictEqual(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two/Nested/'));
            assert.strictEqual(folder.name, 'Nested');
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two'), true);
            assert.strictEqual(folder, undefined);
            folder = ws.getWorkspaceFolder(uri_1.URI.file('/Coding/Two'), false);
            assert.strictEqual(folder.name, 'Two');
        });
        test('Multiroot change event should have a delta, #29641', function (done) {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            let sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.added, []);
                    assert.deepStrictEqual(e.removed, []);
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.removed, []);
                    assert.strictEqual(e.added.length, 1);
                    assert.strictEqual(e.added[0].uri.toString(), 'foo:bar');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.removed, []);
                    assert.strictEqual(e.added.length, 1);
                    assert.strictEqual(e.added[0].uri.toString(), 'foo:bar2');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 1)] });
            sub.dispose();
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.strictEqual(e.removed.length, 2);
                    assert.strictEqual(e.removed[0].uri.toString(), 'foo:bar');
                    assert.strictEqual(e.removed[1].uri.toString(), 'foo:bar2');
                    assert.strictEqual(e.added.length, 1);
                    assert.strictEqual(e.added[0].uri.toString(), 'foo:bar3');
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0)] });
            sub.dispose();
            finish();
        });
        test('Multiroot change keeps existing workspaces live', function () {
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }, new log_1.NullLogService());
            const firstFolder = ws.getWorkspaceFolders()[0];
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 1, 'renamed')] });
            assert.strictEqual(ws.getWorkspaceFolders()[1], firstFolder);
            assert.strictEqual(firstFolder.index, 1);
            assert.strictEqual(firstFolder.name, 'renamed');
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 1), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 2)] });
            assert.strictEqual(ws.getWorkspaceFolders()[2], firstFolder);
            assert.strictEqual(firstFolder.index, 2);
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0)] });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 1)] });
            assert.notStrictEqual(firstFolder, ws.workspace.folders[0]);
        });
        test('updateWorkspaceFolders - invalid arguments', function () {
            let ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, null, null));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 0));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 1));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 1, 0));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, -1, 0));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, -1, -1));
            ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }, new log_1.NullLogService());
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 1, 1));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 2));
            assert.strictEqual(false, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 1, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'))));
        });
        test('updateWorkspaceFolders - valid arguments', function (done) {
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            const protocol = {
                getProxy: () => { return undefined; },
                set: () => { return undefined; },
                dispose: () => { },
                assertRegistered: () => { },
                drain: () => { return undefined; },
            };
            const ws = createExtHostWorkspace(protocol, { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            //
            // Add one folder
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'))));
            assert.strictEqual(1, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            const firstAddedFolder = ws.getWorkspaceFolders()[0];
            let gotEvent = false;
            let sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.removed, []);
                    assert.strictEqual(e.added.length, 1);
                    assert.strictEqual(e.added[0].uri.toString(), 'foo:bar');
                    assert.strictEqual(e.added[0], firstAddedFolder); // verify object is still live
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0)] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            //
            // Add two more folders
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 1, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar1')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar2'))));
            assert.strictEqual(3, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            assert.strictEqual(ws.workspace.folders[2].uri.toString(), uri_1.URI.parse('foo:bar2').toString());
            const secondAddedFolder = ws.getWorkspaceFolders()[1];
            const thirdAddedFolder = ws.getWorkspaceFolders()[2];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.removed, []);
                    assert.strictEqual(e.added.length, 2);
                    assert.strictEqual(e.added[0].uri.toString(), 'foo:bar1');
                    assert.strictEqual(e.added[1].uri.toString(), 'foo:bar2');
                    assert.strictEqual(e.added[0], secondAddedFolder);
                    assert.strictEqual(e.added[1], thirdAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1), aWorkspaceFolderData(uri_1.URI.parse('foo:bar2'), 2)] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[2], thirdAddedFolder); // verify object is still live
            //
            // Remove one folder
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 2, 1));
            assert.strictEqual(2, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.added, []);
                    assert.strictEqual(e.removed.length, 1);
                    assert.strictEqual(e.removed[0], thirdAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1)] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            //
            // Rename folder
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 'renamed 1'), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 'renamed 2')));
            assert.strictEqual(2, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar1').toString());
            assert.strictEqual(ws.workspace.folders[0].name, 'renamed 1');
            assert.strictEqual(ws.workspace.folders[1].name, 'renamed 2');
            assert.strictEqual(ws.getWorkspaceFolders()[0].name, 'renamed 1');
            assert.strictEqual(ws.getWorkspaceFolders()[1].name, 'renamed 2');
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.deepStrictEqual(e.added, []);
                    assert.strictEqual(e.removed.length, 0);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar'), 0, 'renamed 1'), aWorkspaceFolderData(uri_1.URI.parse('foo:bar1'), 1, 'renamed 2')] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], firstAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], secondAddedFolder); // verify object is still live
            assert.strictEqual(ws.workspace.folders[0].name, 'renamed 1');
            assert.strictEqual(ws.workspace.folders[1].name, 'renamed 2');
            assert.strictEqual(ws.getWorkspaceFolders()[0].name, 'renamed 1');
            assert.strictEqual(ws.getWorkspaceFolders()[1].name, 'renamed 2');
            //
            // Add and remove folders
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar3')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar4'))));
            assert.strictEqual(2, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            const fourthAddedFolder = ws.getWorkspaceFolders()[0];
            const fifthAddedFolder = ws.getWorkspaceFolders()[1];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.strictEqual(e.added.length, 2);
                    assert.strictEqual(e.added[0], fourthAddedFolder);
                    assert.strictEqual(e.added[1], fifthAddedFolder);
                    assert.strictEqual(e.removed.length, 2);
                    assert.strictEqual(e.removed[0], firstAddedFolder);
                    assert.strictEqual(e.removed[1], secondAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 1)] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], fourthAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], fifthAddedFolder); // verify object is still live
            //
            // Swap folders
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 0, 2, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar4')), asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar3'))));
            assert.strictEqual(2, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.strictEqual(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.strictEqual(e.added.length, 0);
                    assert.strictEqual(e.removed.length, 0);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 0), aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 1)] }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            assert.strictEqual(fifthAddedFolder.index, 0);
            assert.strictEqual(fourthAddedFolder.index, 1);
            //
            // Add one folder after the other without waiting for confirmation (not supported currently)
            //
            assert.strictEqual(true, ws.updateWorkspaceFolders(extensions_2.nullExtensionDescription, 2, 0, asUpdateWorkspaceFolderData(uri_1.URI.parse('foo:bar5'))));
            assert.strictEqual(3, ws.workspace.folders.length);
            assert.strictEqual(ws.workspace.folders[0].uri.toString(), uri_1.URI.parse('foo:bar4').toString());
            assert.strictEqual(ws.workspace.folders[1].uri.toString(), uri_1.URI.parse('foo:bar3').toString());
            assert.strictEqual(ws.workspace.folders[2].uri.toString(), uri_1.URI.parse('foo:bar5').toString());
            const sixthAddedFolder = ws.getWorkspaceFolders()[2];
            gotEvent = false;
            sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.strictEqual(e.added.length, 1);
                    assert.strictEqual(e.added[0], sixthAddedFolder);
                    gotEvent = true;
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({
                id: 'foo', name: 'Test', folders: [
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar4'), 0),
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar3'), 1),
                    aWorkspaceFolderData(uri_1.URI.parse('foo:bar5'), 2)
                ]
            }); // simulate acknowledgement from main side
            assert.strictEqual(gotEvent, true);
            sub.dispose();
            assert.strictEqual(ws.getWorkspaceFolders()[0], fifthAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[1], fourthAddedFolder); // verify object is still live
            assert.strictEqual(ws.getWorkspaceFolders()[2], sixthAddedFolder); // verify object is still live
            finish();
        });
        test('Multiroot change event is immutable', function (done) {
            let finished = false;
            const finish = (error) => {
                if (!finished) {
                    finished = true;
                    done(error);
                }
            };
            const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), { id: 'foo', name: 'Test', folders: [] }, new log_1.NullLogService());
            const sub = ws.onDidChangeWorkspace(e => {
                try {
                    assert.throws(() => {
                        e.added = [];
                    });
                    // assert.throws(() => {
                    // 	(<any>e.added)[0] = null;
                    // });
                }
                catch (error) {
                    finish(error);
                }
            });
            ws.$acceptWorkspaceData({ id: 'foo', name: 'Test', folders: [] });
            sub.dispose();
            finish();
        });
        test('`vscode.workspace.getWorkspaceFolder(file)` don\'t return workspace folder when file open from command line. #36221', function () {
            if (platform_1.isWindows) {
                const ws = createExtHostWorkspace(new testRPCProtocol_1.TestRPCProtocol(), {
                    id: 'foo', name: 'Test', folders: [
                        aWorkspaceFolderData(uri_1.URI.file('c:/Users/marek/Desktop/vsc_test/'), 0)
                    ]
                }, new log_1.NullLogService());
                assert.ok(ws.getWorkspaceFolder(uri_1.URI.file('c:/Users/marek/Desktop/vsc_test/a.txt')));
                assert.ok(ws.getWorkspaceFolder(uri_1.URI.file('C:/Users/marek/Desktop/vsc_test/b.txt')));
            }
        });
        function aWorkspaceFolderData(uri, index, name = '') {
            return {
                uri,
                index,
                name: name || (0, path_1.basename)(uri.path)
            };
        }
        function asUpdateWorkspaceFolderData(uri, name) {
            return { uri, name };
        }
        test('findFiles - string include', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.includePattern, 'foo');
                    assert.strictEqual(_includeFolder, null);
                    assert.strictEqual(options.excludePattern, '');
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    assert.strictEqual(options.maxResults, 10);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles('foo', undefined, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        function testFindFilesInclude(pattern) {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.includePattern, 'glob/**');
                    assert.deepStrictEqual(_includeFolder ? uri_1.URI.from(_includeFolder).toJSON() : null, uri_1.URI.file('/other/folder').toJSON());
                    assert.strictEqual(options.excludePattern, '');
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles(pattern, undefined, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        }
        test('findFiles - RelativePattern include (string)', () => {
            return testFindFilesInclude(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'));
        });
        test('findFiles - RelativePattern include (URI)', () => {
            return testFindFilesInclude(new extHostTypes_1.RelativePattern(uri_1.URI.file('/other/folder'), 'glob/**'));
        });
        test('findFiles - no excludes', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.includePattern, 'glob/**');
                    assert.deepStrictEqual(uri_1.URI.revive(_includeFolder).toString(), uri_1.URI.file('/other/folder').toString());
                    assert.strictEqual(options.excludePattern, '');
                    assert.strictEqual(options.disregardExcludeSettings, true);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), null, 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles - with cancelled token', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            const token = cancellation_1.CancellationToken.Cancelled;
            return ws.findFiles(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), null, 10, new extensions_1.ExtensionIdentifier('test'), token).then(() => {
                assert(!mainThreadCalled, '!mainThreadCalled');
            });
        });
        test('findFiles - RelativePattern exclude', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    assert.strictEqual(options.excludePattern, 'glob/**'); // Note that the base portion is ignored, see #52651
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles('', new extHostTypes_1.RelativePattern(root, 'glob/**'), 10, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles2 - string include', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.filePattern, 'foo');
                    assert.strictEqual(options.includePattern, undefined);
                    assert.strictEqual(_includeFolder, null);
                    assert.strictEqual(options.excludePattern, undefined);
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    assert.strictEqual(options.maxResults, 10);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2('foo', { maxResults: 10, useDefaultExcludes: true }, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        function testFindFiles2Include(pattern) {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.filePattern, 'glob/**');
                    assert.strictEqual(options.includePattern, undefined);
                    assert.deepStrictEqual(_includeFolder ? uri_1.URI.from(_includeFolder).toJSON() : null, uri_1.URI.file('/other/folder').toJSON());
                    assert.strictEqual(options.excludePattern, undefined);
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2(pattern, { maxResults: 10 }, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        }
        test('findFiles2 - RelativePattern include (string)', () => {
            return testFindFiles2Include(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'));
        });
        test('findFiles2 - RelativePattern include (URI)', () => {
            return testFindFiles2Include(new extHostTypes_1.RelativePattern(uri_1.URI.file('/other/folder'), 'glob/**'));
        });
        test('findFiles2 - no excludes', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.filePattern, 'glob/**');
                    assert.strictEqual(options.includePattern, undefined);
                    assert.deepStrictEqual(uri_1.URI.revive(_includeFolder).toString(), uri_1.URI.file('/other/folder').toString());
                    assert.strictEqual(options.excludePattern, undefined);
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), {}, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles2 - with cancelled token', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            const token = cancellation_1.CancellationToken.Cancelled;
            return ws.findFiles2(new extHostTypes_1.RelativePattern('/other/folder', 'glob/**'), {}, new extensions_1.ExtensionIdentifier('test'), token).then(() => {
                assert(!mainThreadCalled, '!mainThreadCalled');
            });
        });
        test('findFiles2 - RelativePattern exclude', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    assert.strictEqual(options.excludePattern, 'glob/**'); // Note that the base portion is ignored, see #52651
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2('', { exclude: new extHostTypes_1.RelativePattern(root, 'glob/**') }, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles2 - useIgnoreFiles', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.disregardExcludeSettings, false);
                    assert.strictEqual(options.disregardIgnoreFiles, false);
                    assert.strictEqual(options.disregardGlobalIgnoreFiles, false);
                    assert.strictEqual(options.disregardParentIgnoreFiles, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2('', { useIgnoreFiles: true, useParentIgnoreFiles: true, useGlobalIgnoreFiles: true }, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findFiles2 - use symlinks', () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                $startFileSearch(_includeFolder, options, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(options.ignoreSymlinks, false);
                    return Promise.resolve(null);
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            return ws.findFiles2('', { followSymlinks: true }, new extensions_1.ExtensionIdentifier('test')).then(() => {
                assert(mainThreadCalled, 'mainThreadCalled');
            });
        });
        test('findTextInFiles - no include', async () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                async $startTextSearch(query, folder, options, requestId, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(query.pattern, 'foo');
                    assert.strictEqual(folder, null);
                    assert.strictEqual(options.includePattern, undefined);
                    assert.strictEqual(options.excludePattern, undefined);
                    return null;
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            await ws.findTextInFiles({ pattern: 'foo' }, {}, () => { }, new extensions_1.ExtensionIdentifier('test'));
            assert(mainThreadCalled, 'mainThreadCalled');
        });
        test('findTextInFiles - string include', async () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                async $startTextSearch(query, folder, options, requestId, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(query.pattern, 'foo');
                    assert.strictEqual(folder, null);
                    assert.strictEqual(options.includePattern, '**/files');
                    assert.strictEqual(options.excludePattern, undefined);
                    return null;
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            await ws.findTextInFiles({ pattern: 'foo' }, { include: '**/files' }, () => { }, new extensions_1.ExtensionIdentifier('test'));
            assert(mainThreadCalled, 'mainThreadCalled');
        });
        test('findTextInFiles - RelativePattern include', async () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                async $startTextSearch(query, folder, options, requestId, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(query.pattern, 'foo');
                    assert.deepStrictEqual(uri_1.URI.revive(folder).toString(), uri_1.URI.file('/other/folder').toString());
                    assert.strictEqual(options.includePattern, 'glob/**');
                    assert.strictEqual(options.excludePattern, undefined);
                    return null;
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            await ws.findTextInFiles({ pattern: 'foo' }, { include: new extHostTypes_1.RelativePattern('/other/folder', 'glob/**') }, () => { }, new extensions_1.ExtensionIdentifier('test'));
            assert(mainThreadCalled, 'mainThreadCalled');
        });
        test('findTextInFiles - with cancelled token', async () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                async $startTextSearch(query, folder, options, requestId, token) {
                    mainThreadCalled = true;
                    return null;
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            const token = cancellation_1.CancellationToken.Cancelled;
            await ws.findTextInFiles({ pattern: 'foo' }, {}, () => { }, new extensions_1.ExtensionIdentifier('test'), token);
            assert(!mainThreadCalled, '!mainThreadCalled');
        });
        test('findTextInFiles - RelativePattern exclude', async () => {
            const root = '/project/foo';
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            let mainThreadCalled = false;
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadWorkspace, new class extends (0, mock_1.mock)() {
                async $startTextSearch(query, folder, options, requestId, token) {
                    mainThreadCalled = true;
                    assert.strictEqual(query.pattern, 'foo');
                    assert.deepStrictEqual(folder, null);
                    assert.strictEqual(options.includePattern, undefined);
                    assert.strictEqual(options.excludePattern, 'glob/**'); // exclude folder is ignored...
                    return null;
                }
            });
            const ws = createExtHostWorkspace(rpcProtocol, { id: 'foo', folders: [aWorkspaceFolderData(uri_1.URI.file(root), 0)], name: 'Test' }, new log_1.NullLogService());
            await ws.findTextInFiles({ pattern: 'foo' }, { exclude: new extHostTypes_1.RelativePattern('/other/folder', 'glob/**') }, () => { }, new extensions_1.ExtensionIdentifier('test'));
            assert(mainThreadCalled, 'mainThreadCalled');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFdvcmtzcGFjZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL3Rlc3QvYnJvd3Nlci9leHRIb3N0V29ya3NwYWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUEwQmhHLFNBQVMsc0JBQXNCLENBQUMsV0FBeUIsRUFBRSxJQUFvQixFQUFFLFVBQXVCO1FBQ3ZHLE1BQU0sTUFBTSxHQUFHLElBQUksbUNBQWdCLENBQ2xDLElBQUkscUNBQWlCLENBQUMsV0FBVyxDQUFDLEVBQ2xDLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUEyQjtZQUE3Qzs7Z0JBQXlELGNBQVMsR0FBRyxJQUFJLENBQUM7WUFBQyxDQUFDO1NBQUEsRUFDaEYsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTBCO1lBQVksZUFBZSxLQUFLLE9BQU8sa0JBQU8sQ0FBQyxDQUFDLDZEQUFrRCxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztTQUFFLEVBQ2xLLFVBQVUsRUFDVixJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBMEI7U0FBSSxDQUNwRCxDQUFDO1FBQ0YsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4QyxPQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7SUFFRCxLQUFLLENBQUMsa0JBQWtCLEVBQUU7UUFFekIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsb0JBQW9CLENBQUMsU0FBMkIsRUFBRSxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxnQkFBMEI7WUFDckgsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsV0FBVyxD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