/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "crypto", "fs", "os", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/backup/electron-main/backupMainService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/environment/node/argv", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/backup/common/backup", "vs/platform/test/electron-main/workbenchTestServices", "vs/platform/log/common/logService", "vs/base/test/common/utils"], function (require, exports, assert, crypto_1, fs, os, network_1, path, platform, resources_1, uri_1, pfs_1, testUtils_1, backupMainService_1, testConfigurationService_1, environmentMainService_1, argv_1, files_1, log_1, product_1, backup_1, workbenchTestServices_1, logService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('BackupMainService', () => {
        function assertEqualFolderInfos(actual, expected) {
            const withUriAsString = (f) => ({ folderUri: f.folderUri.toString(), remoteAuthority: f.remoteAuthority });
            assert.deepStrictEqual(actual.map(withUriAsString), expected.map(withUriAsString));
        }
        function toWorkspace(path) {
            return {
                id: (0, crypto_1.createHash)('md5').update(sanitizePath(path)).digest('hex'),
                configPath: uri_1.URI.file(path)
            };
        }
        function toWorkspaceBackupInfo(path, remoteAuthority) {
            return {
                workspace: {
                    id: (0, crypto_1.createHash)('md5').update(sanitizePath(path)).digest('hex'),
                    configPath: uri_1.URI.file(path)
                },
                remoteAuthority
            };
        }
        function toFolderBackupInfo(uri, remoteAuthority) {
            return { folderUri: uri, remoteAuthority };
        }
        function toSerializedWorkspace(ws) {
            return {
                id: ws.id,
                configURIPath: ws.configPath.toString()
            };
        }
        function ensureFolderExists(uri) {
            if (!fs.existsSync(uri.fsPath)) {
                fs.mkdirSync(uri.fsPath);
            }
            const backupFolder = service.toBackupPath(uri);
            return createBackupFolder(backupFolder);
        }
        async function ensureWorkspaceExists(workspace) {
            if (!fs.existsSync(workspace.configPath.fsPath)) {
                await pfs_1.Promises.writeFile(workspace.configPath.fsPath, 'Hello');
            }
            const backupFolder = service.toBackupPath(workspace.id);
            await createBackupFolder(backupFolder);
            return workspace;
        }
        async function createBackupFolder(backupFolder) {
            if (!fs.existsSync(backupFolder)) {
                fs.mkdirSync(backupFolder);
                fs.mkdirSync(path.join(backupFolder, network_1.Schemas.file));
                await pfs_1.Promises.writeFile(path.join(backupFolder, network_1.Schemas.file, 'foo.txt'), 'Hello');
            }
        }
        function readWorkspacesMetadata() {
            return stateMainService.getItem('backupWorkspaces');
        }
        function writeWorkspacesMetadata(data) {
            if (!data) {
                stateMainService.removeItem('backupWorkspaces');
            }
            else {
                stateMainService.setItem('backupWorkspaces', JSON.parse(data));
            }
        }
        function sanitizePath(p) {
            return platform.isLinux ? p : p.toLowerCase();
        }
        const fooFile = uri_1.URI.file(platform.isWindows ? 'C:\\foo' : '/foo');
        const barFile = uri_1.URI.file(platform.isWindows ? 'C:\\bar' : '/bar');
        let service;
        let configService;
        let stateMainService;
        let environmentService;
        let testDir;
        let backupHome;
        let existingTestFolder1;
        setup(async () => {
            testDir = (0, testUtils_1.getRandomTestPath)(os.tmpdir(), 'vsctests', 'backupmainservice');
            backupHome = path.join(testDir, 'Backups');
            existingTestFolder1 = uri_1.URI.file(path.join(testDir, 'folder1'));
            environmentService = new environmentMainService_1.EnvironmentMainService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), { _serviceBrand: undefined, ...product_1.default });
            await pfs_1.Promises.mkdir(backupHome, { recursive: true });
            configService = new testConfigurationService_1.TestConfigurationService();
            stateMainService = new workbenchTestServices_1.InMemoryTestStateMainService();
            service = new class TestBackupMainService extends backupMainService_1.BackupMainService {
                constructor() {
                    super(environmentService, configService, new logService_1.LogService(new log_1.ConsoleMainLogger()), stateMainService);
                    this.backupHome = backupHome;
                }
                toBackupPath(arg) {
                    const id = arg instanceof uri_1.URI ? super.getFolderHash({ folderUri: arg }) : arg;
                    return path.join(this.backupHome, id);
                }
                testGetFolderHash(folder) {
                    return super.getFolderHash(folder);
                }
                testGetWorkspaceBackups() {
                    return super.getWorkspaceBackups();
                }
                testGetFolderBackups() {
                    return super.getFolderBackups();
                }
            };
            return service.initialize();
        });
        teardown(() => {
            return pfs_1.Promises.rm(testDir);
        });
        test('service validates backup workspaces on startup and cleans up (folder workspaces)', async function () {
            // 1) backup workspace path does not exist
            service.registerFolderBackup(toFolderBackupInfo(fooFile));
            service.registerFolderBackup(toFolderBackupInfo(barFile));
            await service.initialize();
            assertEqualFolderInfos(service.testGetFolderBackups(), []);
            // 2) backup workspace path exists with empty contents within
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            service.registerFolderBackup(toFolderBackupInfo(fooFile));
            service.registerFolderBackup(toFolderBackupInfo(barFile));
            await service.initialize();
            assertEqualFolderInfos(service.testGetFolderBackups(), []);
            assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
            assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
            // 3) backup workspace path exists with empty folders within
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            fs.mkdirSync(path.join(service.toBackupPath(fooFile), network_1.Schemas.file));
            fs.mkdirSync(path.join(service.toBackupPath(barFile), network_1.Schemas.untitled));
            service.registerFolderBackup(toFolderBackupInfo(fooFile));
            service.registerFolderBackup(toFolderBackupInfo(barFile));
            await service.initialize();
            assertEqualFolderInfos(service.testGetFolderBackups(), []);
            assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
            assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
            // 4) backup workspace path points to a workspace that no longer exists
            // so it should convert the backup worspace to an empty workspace backup
            const fileBackups = path.join(service.toBackupPath(fooFile), network_1.Schemas.file);
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            fs.mkdirSync(fileBackups);
            service.registerFolderBackup(toFolderBackupInfo(fooFile));
            assert.strictEqual(service.testGetFolderBackups().length, 1);
            assert.strictEqual(service.getEmptyWindowBackups().length, 0);
            fs.writeFileSync(path.join(fileBackups, 'backup.txt'), '');
            await service.initialize();
            assert.strictEqual(service.testGetFolderBackups().length, 0);
            assert.strictEqual(service.getEmptyWindowBackups().length, 1);
        });
        test('service validates backup workspaces on startup and cleans up (root workspaces)', async function () {
            // 1) backup workspace path does not exist
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath));
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(barFile.fsPath));
            await service.initialize();
            assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            // 2) backup workspace path exists with empty contents within
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath));
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(barFile.fsPath));
            await service.initialize();
            assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
            assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
            // 3) backup workspace path exists with empty folders within
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            fs.mkdirSync(path.join(service.toBackupPath(fooFile), network_1.Schemas.file));
            fs.mkdirSync(path.join(service.toBackupPath(barFile), network_1.Schemas.untitled));
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath));
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(barFile.fsPath));
            await service.initialize();
            assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            assert.ok(!fs.existsSync(service.toBackupPath(fooFile)));
            assert.ok(!fs.existsSync(service.toBackupPath(barFile)));
            // 4) backup workspace path points to a workspace that no longer exists
            // so it should convert the backup worspace to an empty workspace backup
            const fileBackups = path.join(service.toBackupPath(fooFile), network_1.Schemas.file);
            fs.mkdirSync(service.toBackupPath(fooFile));
            fs.mkdirSync(service.toBackupPath(barFile));
            fs.mkdirSync(fileBackups);
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath));
            assert.strictEqual(service.testGetWorkspaceBackups().length, 1);
            assert.strictEqual(service.getEmptyWindowBackups().length, 0);
            fs.writeFileSync(path.join(fileBackups, 'backup.txt'), '');
            await service.initialize();
            assert.strictEqual(service.testGetWorkspaceBackups().length, 0);
            assert.strictEqual(service.getEmptyWindowBackups().length, 1);
        });
        test('service supports to migrate backup data from another location', async () => {
            const backupPathToMigrate = service.toBackupPath(fooFile);
            fs.mkdirSync(backupPathToMigrate);
            fs.writeFileSync(path.join(backupPathToMigrate, 'backup.txt'), 'Some Data');
            service.registerFolderBackup(toFolderBackupInfo(uri_1.URI.file(backupPathToMigrate)));
            const workspaceBackupPath = await service.registerWorkspaceBackup(toWorkspaceBackupInfo(barFile.fsPath), backupPathToMigrate);
            assert.ok(fs.existsSync(workspaceBackupPath));
            assert.ok(fs.existsSync(path.join(workspaceBackupPath, 'backup.txt')));
            assert.ok(!fs.existsSync(backupPathToMigrate));
            const emptyBackups = service.getEmptyWindowBackups();
            assert.strictEqual(0, emptyBackups.length);
        });
        test('service backup migration makes sure to preserve existing backups', async () => {
            const backupPathToMigrate = service.toBackupPath(fooFile);
            fs.mkdirSync(backupPathToMigrate);
            fs.writeFileSync(path.join(backupPathToMigrate, 'backup.txt'), 'Some Data');
            service.registerFolderBackup(toFolderBackupInfo(uri_1.URI.file(backupPathToMigrate)));
            const backupPathToPreserve = service.toBackupPath(barFile);
            fs.mkdirSync(backupPathToPreserve);
            fs.writeFileSync(path.join(backupPathToPreserve, 'backup.txt'), 'Some Data');
            service.registerFolderBackup(toFolderBackupInfo(uri_1.URI.file(backupPathToPreserve)));
            const workspaceBackupPath = await service.registerWorkspaceBackup(toWorkspaceBackupInfo(barFile.fsPath), backupPathToMigrate);
            assert.ok(fs.existsSync(workspaceBackupPath));
            assert.ok(fs.existsSync(path.join(workspaceBackupPath, 'backup.txt')));
            assert.ok(!fs.existsSync(backupPathToMigrate));
            const emptyBackups = service.getEmptyWindowBackups();
            assert.strictEqual(1, emptyBackups.length);
            assert.strictEqual(1, fs.readdirSync(path.join(backupHome, emptyBackups[0].backupFolder)).length);
        });
        suite('loadSync', () => {
            test('getFolderBackupPaths() should return [] when workspaces.json doesn\'t exist', () => {
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
            });
            test('getFolderBackupPaths() should return [] when folders in workspaces.json is absent', async () => {
                writeWorkspacesMetadata('{}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
            });
            test('getFolderBackupPaths() should return [] when folders in workspaces.json is not a string array', async () => {
                writeWorkspacesMetadata('{"folders":{}}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
                writeWorkspacesMetadata('{"folders":{"foo": ["bar"]}}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
                writeWorkspacesMetadata('{"folders":{"foo": []}}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
                writeWorkspacesMetadata('{"folders":{"foo": "bar"}}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
                writeWorkspacesMetadata('{"folders":"foo"}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
                writeWorkspacesMetadata('{"folders":1}');
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
            });
            test('getFolderBackupPaths() should return [] when files.hotExit = "onExitAndWindowClose"', async () => {
                const fi = toFolderBackupInfo(uri_1.URI.file(fooFile.fsPath.toUpperCase()));
                service.registerFolderBackup(fi);
                assertEqualFolderInfos(service.testGetFolderBackups(), [fi]);
                configService.setUserConfiguration('files.hotExit', files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE);
                await service.initialize();
                assertEqualFolderInfos(service.testGetFolderBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when workspaces.json doesn\'t exist', () => {
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when folderWorkspaces in workspaces.json is absent', async () => {
                writeWorkspacesMetadata('{}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when rootWorkspaces in workspaces.json is not a object array', async () => {
                writeWorkspacesMetadata('{"rootWorkspaces":{}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"rootWorkspaces":{"foo": ["bar"]}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"rootWorkspaces":{"foo": []}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"rootWorkspaces":{"foo": "bar"}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"rootWorkspaces":"foo"}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"rootWorkspaces":1}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when workspaces in workspaces.json is not a object array', async () => {
                writeWorkspacesMetadata('{"workspaces":{}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"workspaces":{"foo": ["bar"]}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"workspaces":{"foo": []}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"workspaces":{"foo": "bar"}}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"workspaces":"foo"}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
                writeWorkspacesMetadata('{"workspaces":1}');
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            });
            test('getWorkspaceBackups() should return [] when files.hotExit = "onExitAndWindowClose"', async () => {
                const upperFooPath = fooFile.fsPath.toUpperCase();
                service.registerWorkspaceBackup(toWorkspaceBackupInfo(upperFooPath));
                assert.strictEqual(service.testGetWorkspaceBackups().length, 1);
                assert.deepStrictEqual(service.testGetWorkspaceBackups().map(r => r.workspace.configPath.toString()), [uri_1.URI.file(upperFooPath).toString()]);
                configService.setUserConfiguration('files.hotExit', files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE);
                await service.initialize();
                assert.deepStrictEqual(service.testGetWorkspaceBackups(), []);
            });
            test('getEmptyWorkspaceBackupPaths() should return [] when workspaces.json doesn\'t exist', () => {
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
            });
            test('getEmptyWorkspaceBackupPaths() should return [] when folderWorkspaces in workspaces.json is absent', async () => {
                writeWorkspacesMetadata('{}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
            });
            test('getEmptyWorkspaceBackupPaths() should return [] when folderWorkspaces in workspaces.json is not a string array', async function () {
                writeWorkspacesMetadata('{"emptyWorkspaces":{}}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
                writeWorkspacesMetadata('{"emptyWorkspaces":{"foo": ["bar"]}}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
                writeWorkspacesMetadata('{"emptyWorkspaces":{"foo": []}}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
                writeWorkspacesMetadata('{"emptyWorkspaces":{"foo": "bar"}}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
                writeWorkspacesMetadata('{"emptyWorkspaces":"foo"}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
                writeWorkspacesMetadata('{"emptyWorkspaces":1}');
                await service.initialize();
                assert.deepStrictEqual(service.getEmptyWindowBackups(), []);
            });
        });
        suite('dedupeFolderWorkspaces', () => {
            test('should ignore duplicates (folder workspace)', async () => {
                await ensureFolderExists(existingTestFolder1);
                const workspacesJson = {
                    workspaces: [],
                    folders: [{ folderUri: existingTestFolder1.toString() }, { folderUri: existingTestFolder1.toString() }],
                    emptyWindows: []
                };
                writeWorkspacesMetadata(JSON.stringify(workspacesJson));
                await service.initialize();
                const json = readWorkspacesMetadata();
                assert.deepStrictEqual(json.folders, [{ folderUri: existingTestFolder1.toString() }]);
            });
            test('should ignore duplicates on Windows and Mac (folder workspace)', async () => {
                await ensureFolderExists(existingTestFolder1);
                const workspacesJson = {
                    workspaces: [],
                    folders: [{ folderUri: existingTestFolder1.toString() }, { folderUri: existingTestFolder1.toString().toLowerCase() }],
                    emptyWindows: []
                };
                writeWorkspacesMetadata(JSON.stringify(workspacesJson));
                await service.initialize();
                const json = readWorkspacesMetadata();
                assert.deepStrictEqual(json.folders, [{ folderUri: existingTestFolder1.toString() }]);
            });
            test('should ignore duplicates on Windows and Mac (root workspace)', async () => {
                const workspacePath = path.join(testDir, 'Foo.code-workspace');
                const workspacePath1 = path.join(testDir, 'FOO.code-workspace');
                const workspacePath2 = path.join(testDir, 'foo.code-workspace');
                const workspace1 = await ensureWorkspaceExists(toWorkspace(workspacePath));
                const workspace2 = await ensureWorkspaceExists(toWorkspace(workspacePath1));
                const workspace3 = await ensureWorkspaceExists(toWorkspace(workspacePath2));
                const workspacesJson = {
                    workspaces: [workspace1, workspace2, workspace3].map(toSerializedWorkspace),
                    folders: [],
                    emptyWindows: []
                };
                writeWorkspacesMetadata(JSON.stringify(workspacesJson));
                await service.initialize();
                const json = readWorkspacesMetadata();
                assert.strictEqual(json.workspaces.length, platform.isLinux ? 3 : 1);
                if (platform.isLinux) {
                    assert.deepStrictEqual(json.workspaces.map(r => r.configURIPath), [uri_1.URI.file(workspacePath).toString(), uri_1.URI.file(workspacePath1).toString(), uri_1.URI.file(workspacePath2).toString()]);
                }
                else {
                    assert.deepStrictEqual(json.workspaces.map(r => r.configURIPath), [uri_1.URI.file(workspacePath).toString()], 'should return the first duplicated entry');
                }
            });
        });
        suite('registerWindowForBackups', () => {
            test('should persist paths to workspaces.json (folder workspace)', async () => {
                service.registerFolderBackup(toFolderBackupInfo(fooFile));
                service.registerFolderBackup(toFolderBackupInfo(barFile));
                assertEqualFolderInfos(service.testGetFolderBackups(), [toFolderBackupInfo(fooFile), toFolderBackupInfo(barFile)]);
                const json = readWorkspacesMetadata();
                assert.deepStrictEqual(json.folders, [{ folderUri: fooFile.toString() }, { folderUri: barFile.toString() }]);
            });
            test('should persist paths to workspaces.json (root workspace)', async () => {
                const ws1 = toWorkspaceBackupInfo(fooFile.fsPath);
                service.registerWorkspaceBackup(ws1);
                const ws2 = toWorkspaceBackupInfo(barFile.fsPath);
                service.registerWorkspaceBackup(ws2);
                assert.deepStrictEqual(service.testGetWorkspaceBackups().map(b => b.workspace.configPath.toString()), [fooFile.toString(), barFile.toString()]);
                assert.strictEqual(ws1.workspace.id, service.testGetWorkspaceBackups()[0].workspace.id);
                assert.strictEqual(ws2.workspace.id, service.testGetWorkspaceBackups()[1].workspace.id);
                const json = readWorkspacesMetadata();
                assert.deepStrictEqual(json.workspaces.map(b => b.configURIPath), [fooFile.toString(), barFile.toString()]);
                assert.strictEqual(ws1.workspace.id, json.workspaces[0].id);
                assert.strictEqual(ws2.workspace.id, json.workspaces[1].id);
            });
        });
        test('should always store the workspace path in workspaces.json using the case given, regardless of whether the file system is case-sensitive (folder workspace)', async () => {
            service.registerFolderBackup(toFolderBackupInfo(uri_1.URI.file(fooFile.fsPath.toUpperCase())));
            assertEqualFolderInfos(service.testGetFolderBackups(), [toFolderBackupInfo(uri_1.URI.file(fooFile.fsPath.toUpperCase()))]);
            const json = readWorkspacesMetadata();
            assert.deepStrictEqual(json.folders, [{ folderUri: uri_1.URI.file(fooFile.fsPath.toUpperCase()).toString() }]);
        });
        test('should always store the workspace path in workspaces.json using the case given, regardless of whether the file system is case-sensitive (root workspace)', async () => {
            const upperFooPath = fooFile.fsPath.toUpperCase();
            service.registerWorkspaceBackup(toWorkspaceBackupInfo(upperFooPath));
            assert.deepStrictEqual(service.testGetWorkspaceBackups().map(b => b.workspace.configPath.toString()), [uri_1.URI.file(upperFooPath).toString()]);
            const json = readWorkspacesMetadata();
            assert.deepStrictEqual(json.workspaces.map(b => b.configURIPath), [uri_1.URI.file(upperFooPath).toString()]);
        });
        suite('getWorkspaceHash', () => {
            (platform.isLinux ? test.skip : test)('should ignore case on Windows and Mac', () => {
                const assertFolderHash = (uri1, uri2) => {
                    assert.strictEqual(service.testGetFolderHash(toFolderBackupInfo(uri1)), service.testGetFolderHash(toFolderBackupInfo(uri2)));
                };
                if (platform.isMacintosh) {
                    assertFolderHash(uri_1.URI.file('/foo'), uri_1.URI.file('/FOO'));
                }
                if (platform.isWindows) {
                    assertFolderHash(uri_1.URI.file('c:\\foo'), uri_1.URI.file('C:\\FOO'));
                }
            });
        });
        suite('mixed path casing', () => {
            test('should handle case insensitive paths properly (registerWindowForBackupsSync) (folder workspace)', () => {
                service.registerFolderBackup(toFolderBackupInfo(fooFile));
                service.registerFolderBackup(toFolderBackupInfo(uri_1.URI.file(fooFile.fsPath.toUpperCase())));
                if (platform.isLinux) {
                    assert.strictEqual(service.testGetFolderBackups().length, 2);
                }
                else {
                    assert.strictEqual(service.testGetFolderBackups().length, 1);
                }
            });
            test('should handle case insensitive paths properly (registerWindowForBackupsSync) (root workspace)', () => {
                service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath));
                service.registerWorkspaceBackup(toWorkspaceBackupInfo(fooFile.fsPath.toUpperCase()));
                if (platform.isLinux) {
                    assert.strictEqual(service.testGetWorkspaceBackups().length, 2);
                }
                else {
                    assert.strictEqual(service.testGetWorkspaceBackups().length, 1);
                }
            });
        });
        suite('getDirtyWorkspaces', () => {
            test('should report if a workspace or folder has backups', async () => {
                const folderBackupPath = service.registerFolderBackup(toFolderBackupInfo(fooFile));
                const backupWorkspaceInfo = toWorkspaceBackupInfo(fooFile.fsPath);
                const workspaceBackupPath = service.registerWorkspaceBackup(backupWorkspaceInfo);
                assert.strictEqual(((await service.getDirtyWorkspaces()).length), 0);
                try {
                    await pfs_1.Promises.mkdir(path.join(folderBackupPath, network_1.Schemas.file), { recursive: true });
                    await pfs_1.Promises.mkdir(path.join(workspaceBackupPath, network_1.Schemas.untitled), { recursive: true });
                }
                catch (error) {
                    // ignore - folder might exist already
                }
                assert.strictEqual(((await service.getDirtyWorkspaces()).length), 0);
                fs.writeFileSync(path.join(folderBackupPath, network_1.Schemas.file, '594a4a9d82a277a899d4713a5b08f504'), '');
                fs.writeFileSync(path.join(workspaceBackupPath, network_1.Schemas.untitled, '594a4a9d82a277a899d4713a5b08f504'), '');
                const dirtyWorkspaces = await service.getDirtyWorkspaces();
                assert.strictEqual(dirtyWorkspaces.length, 2);
                let found = 0;
                for (const dirtyWorkpspace of dirtyWorkspaces) {
                    if ((0, backup_1.isFolderBackupInfo)(dirtyWorkpspace)) {
                        if ((0, resources_1.isEqual)(fooFile, dirtyWorkpspace.folderUri)) {
                            found++;
                        }
                    }
                    else {
                        if ((0, resources_1.isEqual)(backupWorkspaceInfo.workspace.configPath, dirtyWorkpspace.workspace.configPath)) {
                            found++;
                        }
                    }
                }
                assert.strictEqual(found, 2);
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwTWFpblNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYmFja3VwL3Rlc3QvZWxlY3Ryb24tbWFpbi9iYWNrdXBNYWluU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMkJoRyxJQUFBLHNCQUFVLEVBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBRXBDLFNBQVMsc0JBQXNCLENBQUMsTUFBMkIsRUFBRSxRQUE2QjtZQUN6RixNQUFNLGVBQWUsR0FBRyxDQUFDLENBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDOUgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBRUQsU0FBUyxXQUFXLENBQUMsSUFBWTtZQUNoQyxPQUFPO2dCQUNOLEVBQUUsRUFBRSxJQUFBLG1CQUFVLEVBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQzlELFVBQVUsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzthQUMxQixDQUFDO1FBQ0gsQ0FBQztRQUVELFNBQVMscUJBQXFCLENBQUMsSUFBWSxFQUFFLGVBQXdCO1lBQ3BFLE9BQU87Z0JBQ04sU0FBUyxFQUFFO29CQUNWLEVBQUUsRUFBRSxJQUFBLG1CQUFVLEVBQUMsS0FBSyxDQUFDLENBQUMs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