/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/extpath", "vs/base/common/labels", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argv", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/state/node/stateService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, assert, fs, os, extpath_1, labels_1, path, platform_1, resources_1, uri_1, pfs, utils_1, testUtils_1, environmentMainService_1, argv_1, fileService_1, log_1, product_1, stateService_1, uriIdentityService_1, userDataProfile_1, workspace_1, workspaces_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('WorkspacesManagementMainService', () => {
        class TestDialogMainService {
            pickFileFolder(options, window) { throw new Error('Method not implemented.'); }
            pickFolder(options, window) { throw new Error('Method not implemented.'); }
            pickFile(options, window) { throw new Error('Method not implemented.'); }
            pickWorkspace(options, window) { throw new Error('Method not implemented.'); }
            showMessageBox(options, window) { throw new Error('Method not implemented.'); }
            showSaveDialog(options, window) { throw new Error('Method not implemented.'); }
            showOpenDialog(options, window) { throw new Error('Method not implemented.'); }
        }
        class TestBackupMainService {
            isHotExitEnabled() { throw new Error('Method not implemented.'); }
            getEmptyWindowBackups() { throw new Error('Method not implemented.'); }
            registerWorkspaceBackup(workspaceInfo, migrateFrom) { throw new Error('Method not implemented.'); }
            registerFolderBackup(folder) { throw new Error('Method not implemented.'); }
            registerEmptyWindowBackup(empty) { throw new Error('Method not implemented.'); }
            async getDirtyWorkspaces() { return []; }
        }
        function createUntitledWorkspace(folders, names) {
            return service.createUntitledWorkspace(folders.map((folder, index) => ({ uri: uri_1.URI.file(folder), name: names ? names[index] : undefined })));
        }
        function createWorkspace(workspaceConfigPath, folders, names) {
            const ws = {
                folders: []
            };
            for (let i = 0; i < folders.length; i++) {
                const f = folders[i];
                const s = f instanceof uri_1.URI ? { uri: f.toString() } : { path: f };
                if (names) {
                    s.name = names[i];
                }
                ws.folders.push(s);
            }
            fs.writeFileSync(workspaceConfigPath, JSON.stringify(ws));
        }
        let testDir;
        let untitledWorkspacesHomePath;
        let environmentMainService;
        let service;
        const cwd = process.cwd();
        const tmpDir = os.tmpdir();
        setup(async () => {
            testDir = (0, testUtils_1.getRandomTestPath)(tmpDir, 'vsctests', 'workspacesmanagementmainservice');
            untitledWorkspacesHomePath = path.join(testDir, 'Workspaces');
            const productService = { _serviceBrand: undefined, ...product_1.default };
            environmentMainService = new class TestEnvironmentService extends environmentMainService_1.EnvironmentMainService {
                constructor() {
                    super((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService);
                }
                get untitledWorkspacesHome() {
                    return uri_1.URI.file(untitledWorkspacesHomePath);
                }
            };
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            service = new workspacesManagementMainService_1.WorkspacesManagementMainService(environmentMainService, logService, new userDataProfile_1.UserDataProfilesMainService(new stateService_1.StateService(1 /* SaveStrategy.DELAYED */, environmentMainService, logService, fileService), new uriIdentityService_1.UriIdentityService(fileService), environmentMainService, fileService, logService), new TestBackupMainService(), new TestDialogMainService());
            return pfs.Promises.mkdir(untitledWorkspacesHomePath, { recursive: true });
        });
        teardown(() => {
            service.dispose();
            return pfs.Promises.rm(testDir);
        });
        function assertPathEquals(pathInWorkspaceFile, pathOnDisk) {
            if (platform_1.isWindows) {
                pathInWorkspaceFile = (0, labels_1.normalizeDriveLetter)(pathInWorkspaceFile);
                pathOnDisk = (0, labels_1.normalizeDriveLetter)(pathOnDisk);
                if (!(0, extpath_1.isUNC)(pathOnDisk)) {
                    pathOnDisk = (0, extpath_1.toSlashes)(pathOnDisk); // workspace file is using slashes for all paths except where mandatory
                }
            }
            assert.strictEqual(pathInWorkspaceFile, pathOnDisk);
        }
        function assertEqualURI(u1, u2) {
            assert.strictEqual(u1.toString(), u2.toString());
        }
        test('createWorkspace (folders)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            assert.ok(workspace);
            assert.ok(fs.existsSync(workspace.configPath.fsPath));
            assert.ok(service.isUntitledWorkspace(workspace));
            const ws = JSON.parse(fs.readFileSync(workspace.configPath.fsPath).toString());
            assert.strictEqual(ws.folders.length, 2);
            assertPathEquals(ws.folders[0].path, cwd);
            assertPathEquals(ws.folders[1].path, tmpDir);
            assert.ok(!ws.folders[0].name);
            assert.ok(!ws.folders[1].name);
        });
        test('createWorkspace (folders with name)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir], ['currentworkingdirectory', 'tempdir']);
            assert.ok(workspace);
            assert.ok(fs.existsSync(workspace.configPath.fsPath));
            assert.ok(service.isUntitledWorkspace(workspace));
            const ws = JSON.parse(fs.readFileSync(workspace.configPath.fsPath).toString());
            assert.strictEqual(ws.folders.length, 2);
            assertPathEquals(ws.folders[0].path, cwd);
            assertPathEquals(ws.folders[1].path, tmpDir);
            assert.strictEqual(ws.folders[0].name, 'currentworkingdirectory');
            assert.strictEqual(ws.folders[1].name, 'tempdir');
        });
        test('createUntitledWorkspace (folders as other resource URIs)', async () => {
            const folder1URI = uri_1.URI.parse('myscheme://server/work/p/f1');
            const folder2URI = uri_1.URI.parse('myscheme://server/work/o/f3');
            const workspace = await service.createUntitledWorkspace([{ uri: folder1URI }, { uri: folder2URI }], 'server');
            assert.ok(workspace);
            assert.ok(fs.existsSync(workspace.configPath.fsPath));
            assert.ok(service.isUntitledWorkspace(workspace));
            const ws = JSON.parse(fs.readFileSync(workspace.configPath.fsPath).toString());
            assert.strictEqual(ws.folders.length, 2);
            assert.strictEqual(ws.folders[0].uri, folder1URI.toString(true));
            assert.strictEqual(ws.folders[1].uri, folder2URI.toString(true));
            assert.ok(!ws.folders[0].name);
            assert.ok(!ws.folders[1].name);
            assert.strictEqual(ws.remoteAuthority, 'server');
        });
        test('resolveWorkspace', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            assert.ok(await service.resolveLocalWorkspace(workspace.configPath));
            // make it a valid workspace path
            const newPath = path.join(path.dirname(workspace.configPath.fsPath), `workspace.${workspace_1.WORKSPACE_EXTENSION}`);
            fs.renameSync(workspace.configPath.fsPath, newPath);
            workspace.configPath = uri_1.URI.file(newPath);
            const resolved = await service.resolveLocalWorkspace(workspace.configPath);
            assert.strictEqual(2, resolved.folders.length);
            assertEqualURI(resolved.configPath, workspace.configPath);
            assert.ok(resolved.id);
            fs.writeFileSync(workspace.configPath.fsPath, JSON.stringify({ something: 'something' })); // invalid workspace
            const resolvedInvalid = await service.resolveLocalWorkspace(workspace.configPath);
            assert.ok(!resolvedInvalid);
            fs.writeFileSync(workspace.configPath.fsPath, JSON.stringify({ transient: true, folders: [] })); // transient worksapce
            const resolvedTransient = await service.resolveLocalWorkspace(workspace.configPath);
            assert.ok(resolvedTransient?.transient);
        });
        test('resolveWorkspace (support relative paths)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            fs.writeFileSync(workspace.configPath.fsPath, JSON.stringify({ folders: [{ path: './ticino-playground/lib' }] }));
            const resolved = await service.resolveLocalWorkspace(workspace.configPath);
            assertEqualURI(resolved.folders[0].uri, uri_1.URI.file(path.join(path.dirname(workspace.configPath.fsPath), 'ticino-playground', 'lib')));
        });
        test('resolveWorkspace (support relative paths #2)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            fs.writeFileSync(workspace.configPath.fsPath, JSON.stringify({ folders: [{ path: './ticino-playground/lib/../other' }] }));
            const resolved = await service.resolveLocalWorkspace(workspace.configPath);
            assertEqualURI(resolved.folders[0].uri, uri_1.URI.file(path.join(path.dirname(workspace.configPath.fsPath), 'ticino-playground', 'other')));
        });
        test('resolveWorkspace (support relative paths #3)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            fs.writeFileSync(workspace.configPath.fsPath, JSON.stringify({ folders: [{ path: 'ticino-playground/lib' }] }));
            const resolved = await service.resolveLocalWorkspace(workspace.configPath);
            assertEqualURI(resolved.folders[0].uri, uri_1.URI.file(path.join(path.dirname(workspace.configPath.fsPath), 'ticino-playground', 'lib')));
        });
        test('resolveWorkspace (support invalid JSON via fault tolerant parsing)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            fs.writeFileSync(workspace.configPath.fsPath, '{ "folders": [ { "path": "./ticino-playground/lib" } , ] }'); // trailing comma
            const resolved = await service.resolveLocalWorkspace(workspace.configPath);
            assertEqualURI(resolved.folders[0].uri, uri_1.URI.file(path.join(path.dirname(workspace.configPath.fsPath), 'ticino-playground', 'lib')));
        });
        test('rewriteWorkspaceFileForNewLocation', async () => {
            const folder1 = cwd; // absolute path because outside of tmpDir
            const tmpInsideDir = path.join(tmpDir, 'inside');
            const firstConfigPath = path.join(tmpDir, 'myworkspace0.code-workspace');
            createWorkspace(firstConfigPath, [folder1, 'inside', path.join('inside', 'somefolder')]);
            const origContent = fs.readFileSync(firstConfigPath).toString();
            let origConfigPath = uri_1.URI.file(firstConfigPath);
            let workspaceConfigPath = uri_1.URI.file(path.join(tmpDir, 'inside', 'myworkspace1.code-workspace'));
            let newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(origContent, origConfigPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            let ws = JSON.parse(newContent);
            assert.strictEqual(ws.folders.length, 3);
            assertPathEquals(ws.folders[0].path, folder1); // absolute path because outside of tmpdir
            assertPathEquals(ws.folders[1].path, '.');
            assertPathEquals(ws.folders[2].path, 'somefolder');
            origConfigPath = workspaceConfigPath;
            workspaceConfigPath = uri_1.URI.file(path.join(tmpDir, 'myworkspace2.code-workspace'));
            newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(newContent, origConfigPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            ws = JSON.parse(newContent);
            assert.strictEqual(ws.folders.length, 3);
            assertPathEquals(ws.folders[0].path, folder1);
            assertPathEquals(ws.folders[1].path, 'inside');
            assertPathEquals(ws.folders[2].path, 'inside/somefolder');
            origConfigPath = workspaceConfigPath;
            workspaceConfigPath = uri_1.URI.file(path.join(tmpDir, 'other', 'myworkspace2.code-workspace'));
            newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(newContent, origConfigPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            ws = JSON.parse(newContent);
            assert.strictEqual(ws.folders.length, 3);
            assertPathEquals(ws.folders[0].path, folder1);
            assertPathEquals(ws.folders[1].path, '../inside');
            assertPathEquals(ws.folders[2].path, '../inside/somefolder');
            origConfigPath = workspaceConfigPath;
            workspaceConfigPath = uri_1.URI.parse('foo://foo/bar/myworkspace2.code-workspace');
            newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(newContent, origConfigPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            ws = JSON.parse(newContent);
            assert.strictEqual(ws.folders.length, 3);
            assert.strictEqual(ws.folders[0].uri, uri_1.URI.file(folder1).toString(true));
            assert.strictEqual(ws.folders[1].uri, uri_1.URI.file(tmpInsideDir).toString(true));
            assert.strictEqual(ws.folders[2].uri, uri_1.URI.file(path.join(tmpInsideDir, 'somefolder')).toString(true));
            fs.unlinkSync(firstConfigPath);
        });
        test('rewriteWorkspaceFileForNewLocation (preserves comments)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir, path.join(tmpDir, 'somefolder')]);
            const workspaceConfigPath = uri_1.URI.file(path.join(tmpDir, `myworkspace.${Date.now()}.${workspace_1.WORKSPACE_EXTENSION}`));
            let origContent = fs.readFileSync(workspace.configPath.fsPath).toString();
            origContent = `// this is a comment\n${origContent}`;
            const newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(origContent, workspace.configPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            assert.strictEqual(0, newContent.indexOf('// this is a comment'));
            await service.deleteUntitledWorkspace(workspace);
        });
        test('rewriteWorkspaceFileForNewLocation (preserves forward slashes)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir, path.join(tmpDir, 'somefolder')]);
            const workspaceConfigPath = uri_1.URI.file(path.join(tmpDir, `myworkspace.${Date.now()}.${workspace_1.WORKSPACE_EXTENSION}`));
            let origContent = fs.readFileSync(workspace.configPath.fsPath).toString();
            origContent = origContent.replace(/[\\]/g, '/'); // convert backslash to slash
            const newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(origContent, workspace.configPath, false, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            const ws = JSON.parse(newContent);
            assert.ok(ws.folders.every(f => f.path.indexOf('\\') < 0));
            await service.deleteUntitledWorkspace(workspace);
        });
        (!platform_1.isWindows ? test.skip : test)('rewriteWorkspaceFileForNewLocation (unc paths)', async () => {
            const workspaceLocation = path.join(tmpDir, 'wsloc');
            const folder1Location = 'x:\\foo';
            const folder2Location = '\\\\server\\share2\\some\\path';
            const folder3Location = path.join(workspaceLocation, 'inner', 'more');
            const workspace = await createUntitledWorkspace([folder1Location, folder2Location, folder3Location]);
            const workspaceConfigPath = uri_1.URI.file(path.join(workspaceLocation, `myworkspace.${Date.now()}.${workspace_1.WORKSPACE_EXTENSION}`));
            const origContent = fs.readFileSync(workspace.configPath.fsPath).toString();
            const newContent = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(origContent, workspace.configPath, true, workspaceConfigPath, resources_1.extUriBiasedIgnorePathCase);
            const ws = JSON.parse(newContent);
            assertPathEquals(ws.folders[0].path, folder1Location);
            assertPathEquals(ws.folders[1].path, folder2Location);
            assertPathEquals(ws.folders[2].path, 'inner/more');
            await service.deleteUntitledWorkspace(workspace);
        });
        test('deleteUntitledWorkspace (untitled)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            assert.ok(fs.existsSync(workspace.configPath.fsPath));
            await service.deleteUntitledWorkspace(workspace);
            assert.ok(!fs.existsSync(workspace.configPath.fsPath));
        });
        test('deleteUntitledWorkspace (saved)', async () => {
            const workspace = await createUntitledWorkspace([cwd, tmpDir]);
            await service.deleteUntitledWorkspace(workspace);
        });
        test('getUntitledWorkspace', async function () {
            await service.initialize();
            let untitled = service.getUntitledWorkspaces();
            assert.strictEqual(untitled.length, 0);
            const untitledOne = await createUntitledWorkspace([cwd, tmpDir]);
            assert.ok(fs.existsSync(untitledOne.configPath.fsPath));
            await service.initialize();
            untitled = service.getUntitledWorkspaces();
            assert.strictEqual(1, untitled.length);
            assert.strictEqual(untitledOne.id, untitled[0].workspace.id);
            await service.deleteUntitledWorkspace(untitledOne);
            await service.initialize();
            untitled = service.getUntitledWorkspaces();
            assert.strictEqual(0, untitled.length);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc01hbmFnZW1lbnRNYWluU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93b3Jrc3BhY2VzL3Rlc3QvZWxlY3Ryb24tbWFpbi93b3Jrc3BhY2VzTWFuYWdlbWVudE1haW5TZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQ2hHLElBQUEsc0JBQVUsRUFBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFFbEQsTUFBTSxxQkFBcUI7WUFJMUIsY0FBYyxDQUFDLE9BQWlDLEVBQUUsTUFBMkMsSUFBbUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3SyxVQUFVLENBQUMsT0FBaUMsRUFBRSxNQUEyQyxJQUFtQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pLLFFBQVEsQ0FBQyxPQUFpQyxFQUFFLE1BQTJDLElBQW1DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkssYUFBYSxDQUFDLE9BQWlDLEVBQUUsTUFBMkMsSUFBbUMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1SyxjQUFjLENBQUMsT0FBbUMsRUFBRSxNQUEyQyxJQUE2QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pMLGNBQWMsQ0FBQyxPQUFtQyxFQUFFLE1BQTJDLElBQTZDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekwsY0FBYyxDQUFDLE9BQW1DLEVBQUUsTUFBMkMsSUFBNkMsTUFBTSxJQUFJLEtB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