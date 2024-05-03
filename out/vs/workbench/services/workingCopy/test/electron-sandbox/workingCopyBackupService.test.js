/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/arrays", "vs/base/common/hash", "vs/base/common/resources", "vs/base/common/path", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/editor/test/common/testTextModel", "vs/base/common/network", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyBackupService", "vs/platform/userData/common/fileUserDataProvider", "vs/base/common/buffer", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/cancellation", "vs/base/common/stream", "vs/workbench/test/common/workbenchTestServices", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/uuid", "vs/platform/product/common/product", "vs/base/test/common/utils", "vs/base/common/lifecycle", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, assert, platform_1, arrays_1, hash_1, resources_1, path_1, uri_1, workingCopyBackupService_1, testTextModel_1, network_1, fileService_1, log_1, environmentService_1, textfiles_1, workingCopyBackupService_2, fileUserDataProvider_1, buffer_1, workbenchTestServices_1, cancellation_1, stream_1, workbenchTestServices_2, inMemoryFilesystemProvider_1, uuid_1, product_1, utils_1, lifecycle_1, userDataProfile_1, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeTestWorkingCopyBackupService = exports.TestNativeWorkbenchEnvironmentService = void 0;
    const homeDir = uri_1.URI.file('home').with({ scheme: network_1.Schemas.inMemory });
    const tmpDir = uri_1.URI.file('tmp').with({ scheme: network_1.Schemas.inMemory });
    const NULL_PROFILE = {
        name: '',
        id: '',
        shortName: '',
        isDefault: false,
        location: homeDir,
        settingsResource: (0, resources_1.joinPath)(homeDir, 'settings.json'),
        globalStorageHome: (0, resources_1.joinPath)(homeDir, 'globalStorage'),
        keybindingsResource: (0, resources_1.joinPath)(homeDir, 'keybindings.json'),
        tasksResource: (0, resources_1.joinPath)(homeDir, 'tasks.json'),
        snippetsHome: (0, resources_1.joinPath)(homeDir, 'snippets'),
        extensionsResource: (0, resources_1.joinPath)(homeDir, 'extensions.json'),
        cacheHome: (0, resources_1.joinPath)(homeDir, 'cache')
    };
    const TestNativeWindowConfiguration = {
        windowId: 0,
        machineId: 'testMachineId',
        sqmId: 'testSqmId',
        logLevel: log_1.LogLevel.Error,
        loggers: { global: [], window: [] },
        mainPid: 0,
        appRoot: '',
        userEnv: {},
        execPath: process.execPath,
        perfMarks: [],
        colorScheme: { dark: true, highContrast: false },
        os: { release: 'unknown', hostname: 'unknown', arch: 'unknown' },
        product: product_1.default,
        homeDir: homeDir.fsPath,
        tmpDir: tmpDir.fsPath,
        userDataDir: (0, resources_1.joinPath)(homeDir, product_1.default.nameShort).fsPath,
        profiles: { profile: NULL_PROFILE, all: [NULL_PROFILE], home: homeDir },
        _: []
    };
    class TestNativeWorkbenchEnvironmentService extends environmentService_1.NativeWorkbenchEnvironmentService {
        constructor(testDir, backupPath) {
            super({ ...TestNativeWindowConfiguration, backupPath: backupPath.fsPath, 'user-data-dir': testDir.fsPath }, workbenchTestServices_2.TestProductService);
        }
    }
    exports.TestNativeWorkbenchEnvironmentService = TestNativeWorkbenchEnvironmentService;
    class NodeTestWorkingCopyBackupService extends workingCopyBackupService_2.NativeWorkingCopyBackupService {
        constructor(testDir, workspaceBackupPath) {
            const environmentService = new TestNativeWorkbenchEnvironmentService(testDir, workspaceBackupPath);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const lifecycleService = new workbenchTestServices_1.TestLifecycleService();
            super(environmentService, fileService, logService, lifecycleService);
            const fsp = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
            fileService.registerProvider(network_1.Schemas.inMemory, fsp);
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            const userDataProfilesService = new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService);
            fileService.registerProvider(network_1.Schemas.vscodeUserData, new fileUserDataProvider_1.FileUserDataProvider(network_1.Schemas.file, fsp, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            this._fileService = fileService;
            this.backupResourceJoiners = [];
            this.discardBackupJoiners = [];
            this.discardedBackups = [];
            this.pendingBackupsArr = [];
            this.discardedAllBackups = false;
        }
        testGetFileService() {
            return this.fileService;
        }
        async waitForAllBackups() {
            await Promise.all(this.pendingBackupsArr);
        }
        joinBackupResource() {
            return new Promise(resolve => this.backupResourceJoiners.push(resolve));
        }
        async backup(identifier, content, versionId, meta, token) {
            const p = super.backup(identifier, content, versionId, meta, token);
            const removeFromPendingBackups = (0, arrays_1.insert)(this.pendingBackupsArr, p.then(undefined, undefined));
            try {
                await p;
            }
            finally {
                removeFromPendingBackups();
            }
            while (this.backupResourceJoiners.length) {
                this.backupResourceJoiners.pop()();
            }
        }
        joinDiscardBackup() {
            return new Promise(resolve => this.discardBackupJoiners.push(resolve));
        }
        async discardBackup(identifier) {
            await super.discardBackup(identifier);
            this.discardedBackups.push(identifier);
            while (this.discardBackupJoiners.length) {
                this.discardBackupJoiners.pop()();
            }
        }
        async discardBackups(filter) {
            this.discardedAllBackups = true;
            return super.discardBackups(filter);
        }
        async getBackupContents(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const fileContents = await this.fileService.readFile(backupResource);
            return fileContents.value.toString();
        }
    }
    exports.NodeTestWorkingCopyBackupService = NodeTestWorkingCopyBackupService;
    suite('WorkingCopyBackupService', () => {
        let testDir;
        let backupHome;
        let workspacesJsonPath;
        let workspaceBackupPath;
        let service;
        let fileService;
        const disposables = new lifecycle_1.DisposableStore();
        const workspaceResource = uri_1.URI.file(platform_1.isWindows ? 'c:\\workspace' : '/workspace');
        const fooFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo' : '/Foo');
        const customFile = uri_1.URI.parse('customScheme://some/path');
        const customFileWithFragment = uri_1.URI.parse('customScheme2://some/path#fragment');
        const barFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Bar' : '/Bar');
        const fooBarFile = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo Bar' : '/Foo Bar');
        const untitledFile = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
        setup(async () => {
            testDir = uri_1.URI.file((0, path_1.join)((0, uuid_1.generateUuid)(), 'vsctests', 'workingcopybackupservice')).with({ scheme: network_1.Schemas.inMemory });
            backupHome = (0, resources_1.joinPath)(testDir, 'Backups');
            workspacesJsonPath = (0, resources_1.joinPath)(backupHome, 'workspaces.json');
            workspaceBackupPath = (0, resources_1.joinPath)(backupHome, (0, hash_1.hash)(workspaceResource.fsPath).toString(16));
            service = disposables.add(new NodeTestWorkingCopyBackupService(testDir, workspaceBackupPath));
            fileService = service._fileService;
            await fileService.createFolder(backupHome);
            return fileService.writeFile(workspacesJsonPath, buffer_1.VSBuffer.fromString(''));
        });
        teardown(() => {
            disposables.clear();
        });
        suite('hashIdentifier', () => {
            test('should correctly hash the identifier for untitled scheme URIs', () => {
                const uri = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-7f9c1a2e');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-17c47cdc');
                }
                else {
                    assert.strictEqual(typedBackupHash, '-8ad5f4f');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for file scheme URIs', () => {
                const uri = uri_1.URI.file('/foo');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                if (platform_1.isWindows) {
                    assert.strictEqual(untypedBackupHash, '20ffaa13');
                }
                else {
                    assert.strictEqual(untypedBackupHash, '20eb3560');
                }
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.fsPath).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                if (platform_1.isWindows) {
                    assert.strictEqual(typedBackupHash, '-55fc55db');
                }
                else {
                    assert.strictEqual(typedBackupHash, '51e56bf');
                }
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should correctly hash the identifier for custom scheme URIs', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-custom',
                    path: 'somePath'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-44972d98');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '502149c7');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
            test('should not fail for URIs without path', () => {
                const uri = uri_1.URI.from({
                    scheme: 'vscode-fragment',
                    fragment: 'frag'
                });
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes change people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                const untypedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(uri));
                assert.strictEqual(untypedBackupHash, '-2f6b2f1b');
                assert.strictEqual(untypedBackupHash, (0, hash_1.hash)(uri.toString()).toString(16));
                const typedBackupHash = (0, workingCopyBackupService_1.hashIdentifier)({ typeId: 'hashTest', resource: uri });
                assert.strictEqual(typedBackupHash, '6e82ca57');
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // If these hashes collide people will lose their backed up files
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                assert.notStrictEqual(untypedBackupHash, typedBackupHash);
            });
        });
        suite('getBackupResource', () => {
            test('should get the correct backup path for text files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = fooFile;
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.file, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for untitled files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, network_1.Schemas.untitled, filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
            test('should get the correct backup path for custom files', () => {
                // Format should be: <backupHome>/<workspaceHash>/<scheme>/<filePathHash>
                const backupResource = uri_1.URI.from({ scheme: 'custom', path: 'custom/file.txt' });
                const workspaceHash = (0, hash_1.hash)(workspaceResource.fsPath).toString(16);
                // No Type ID
                let backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(backupResource);
                let filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                let expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, 'custom', filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
                // With Type ID
                backupId = (0, workbenchTestServices_1.toTypedWorkingCopyId)(backupResource);
                filePathHash = (0, workingCopyBackupService_1.hashIdentifier)(backupId);
                expectedPath = (0, resources_1.joinPath)(backupHome, workspaceHash, 'custom', filePathHash).with({ scheme: network_1.Schemas.vscodeUserData }).toString();
                assert.strictEqual(service.toBackupResource(backupId).toString(), expectedPath);
            });
        });
        suite('backup', () => {
            function toExpectedPreamble(identifier, content = '', meta) {
                return `${identifier.resource.toString()} ${JSON.stringify({ ...meta, typeId: identifier.typeId })}\n${content}`;
            }
            test('joining', async () => {
                let backupJoined = false;
                const joinBackupsPromise = service.joinBackups();
                joinBackupsPromise.then(() => backupJoined = true);
                await joinBackupsPromise;
                assert.strictEqual(backupJoined, true);
                backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const backupPromise = service.backup(identifier);
                assert.strictEqual(backupJoined, false);
                await backupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('no text', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (with version)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), 666);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(!service.hasBackupSync(identifier, 555));
                assert.ok(service.hasBackupSync(identifier, 666));
            });
            test('text file (with meta)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with whitespace in name and type (with meta)', async () => {
                const fileWithSpace = uri_1.URI.file(platform_1.isWindows ? 'c:\\Foo \n Bar' : '/Foo \n Bar');
                const identifier = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fileWithSpace, ' test id \n');
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678 \n k', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file with unicode character in name and type (with meta)', async () => {
                const fileWithUnicode = uri_1.URI.file(platform_1.isWindows ? 'c:\\so𒀅meࠄ' : '/so𒀅meࠄ');
                const identifier = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fileWithUnicode, ' test so𒀅meࠄ id \n');
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const meta = { etag: '678so𒀅meࠄ', orphaned: true };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')), undefined, meta);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test', meta));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('text file (readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('untitled file (readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const model = (0, testTextModel_1.createTextModel)('test');
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, 'test'));
                model.dispose();
            });
            test('text file (large file, stream)', () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                return testLargeTextFile(largeString, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(largeString)));
            });
            test('text file (large file, readable)', async () => {
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await testLargeTextFile(largeString, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                model.dispose();
            });
            async function testLargeTextFile(largeString, buffer) {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, buffer, undefined, { largeTest: true });
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, largeString, { largeTest: true }));
                assert.ok(service.hasBackupSync(identifier));
            }
            test('untitled file (large file, readable)', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const largeString = (new Array(30 * 1024)).join('Large String\n');
                const model = (0, testTextModel_1.createTextModel)(largeString);
                await service.backup(identifier, (0, textfiles_1.toBufferOrReadable)(model.createSnapshot()));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier, largeString));
                assert.ok(service.hasBackupSync(identifier));
                model.dispose();
            });
            test('cancellation', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const cts = new cancellation_1.CancellationTokenSource();
                const promise = service.backup(identifier, undefined, undefined, undefined, cts.token);
                cts.cancel();
                await promise;
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('multiple', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await Promise.all([
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier),
                    service.backup(identifier)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.readFile(backupPath)).value.toString(), toExpectedPreamble(identifier));
                assert.ok(service.hasBackupSync(identifier));
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2');
                await Promise.all([
                    service.backup(backupId1),
                    service.backup(backupId2),
                    service.backup(backupId3)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(fooBackupPath)), true);
                    assert.strictEqual((await fileService.readFile(fooBackupPath)).value.toString(), toExpectedPreamble(backupId));
                    assert.ok(service.hasBackupSync(backupId));
                }
            });
        });
        suite('discardBackup', () => {
            test('joining', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.ok(service.hasBackupSync(identifier));
                let backupJoined = false;
                service.joinBackups().then(() => backupJoined = true);
                const discardBackupPromise = service.discardBackup(identifier);
                assert.strictEqual(backupJoined, false);
                await discardBackupPromise;
                assert.strictEqual(backupJoined, true);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('text file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                assert.ok(service.hasBackupSync(identifier));
                await service.discardBackup(identifier);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
                assert.ok(!service.hasBackupSync(identifier));
            });
            test('untitled file', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackup(identifier);
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 0);
            });
            test('multiple same resource, different type id', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1');
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2');
                await Promise.all([
                    service.backup(backupId1),
                    service.backup(backupId2),
                    service.backup(backupId3)
                ]);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    await service.discardBackup(backupId);
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 0);
            });
        });
        suite('discardBackups (all)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                await service.discardBackups();
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
                assert.strictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceBackupPath, 'file'))), false);
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackups();
                assert.strictEqual((await fileService.exists(backupPath)), false);
                assert.strictEqual((await fileService.exists((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))), false);
            });
            test('can backup after discarding all', async () => {
                await service.discardBackups();
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.exists(workspaceBackupPath)), true);
            });
        });
        suite('discardBackups (except some)', () => {
            test('text file', async () => {
                const backupId1 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const backupId2 = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile);
                const backupId3 = (0, workbenchTestServices_1.toTypedWorkingCopyId)(barFile);
                await service.backup(backupId1, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 1);
                await service.backup(backupId2, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 2);
                await service.backup(backupId3, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'file'))).children?.length, 3);
                await service.discardBackups({ except: [backupId2, backupId3] });
                let backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId1.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId1));
                assert.strictEqual((await fileService.exists(backupPath)), false);
                backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId2.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId2));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId3.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId3));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                await service.discardBackups({ except: [backupId1] });
                for (const backupId of [backupId1, backupId2, backupId3]) {
                    const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                    assert.strictEqual((await fileService.exists(backupPath)), false);
                }
            });
            test('untitled file', async () => {
                const backupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, backupId.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(backupId));
                await service.backup(backupId, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                assert.strictEqual((await fileService.exists(backupPath)), true);
                assert.strictEqual((await fileService.resolve((0, resources_1.joinPath)(workspaceBackupPath, 'untitled'))).children?.length, 1);
                await service.discardBackups({ except: [backupId] });
                assert.strictEqual((await fileService.exists(backupPath)), true);
            });
        });
        suite('getBackups', () => {
            test('text file', async () => {
                await Promise.all([
                    service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')))
                ]);
                let backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), fooFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(barFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')));
                backups = await service.getBackups();
                assert.strictEqual(backups.length, 4);
            });
            test('untitled file', async () => {
                await Promise.all([
                    service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile, 'type1'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test'))),
                    service.backup((0, workbenchTestServices_1.toTypedWorkingCopyId)(untitledFile, 'type2'), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('test')))
                ]);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                for (const backup of backups) {
                    if (backup.typeId === '') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type1') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else if (backup.typeId === 'type2') {
                        assert.strictEqual(backup.resource.toString(), untitledFile.toString());
                    }
                    else {
                        assert.fail('Unexpected backup');
                    }
                }
            });
        });
        suite('resolve', () => {
            test('should restore the original contents (untitled file)', async () => {
                const contents = 'test\nand more stuff';
                await testResolveBackup(untitledFile, contents);
            });
            test('should restore the original contents (untitled file with metadata)', async () => {
                const contents = 'test\nand more stuff';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled file empty with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (untitled large file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'the Etag',
                    size: 666,
                    mtime: Date.now(),
                    orphaned: true
                };
                await testResolveBackup(untitledFile, contents, meta);
            });
            test('should restore the original contents (text file)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(fooFile, contents);
            });
            test('should restore the original contents (text file - custom scheme)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'consectetur ',
                    'adipiscing ßß elit'
                ].join('');
                await testResolveBackup(customFile, contents);
            });
            test('should restore the original contents (text file with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (empty text file with metadata)', async () => {
                const contents = '';
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (large text file with metadata)', async () => {
                const contents = (new Array(30 * 1024)).join('Large String\n');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata changed once)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta);
                // Change meta and test again
                meta.size = 999;
                await testResolveBackup(fooFile, contents, meta);
            });
            test('should restore the original contents (text file with metadata and fragment URI)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(customFileWithFragment, contents, meta);
            });
            test('should restore the original contents (text file with space in name with metadata)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooBarFile, contents, meta);
            });
            test('should restore the original contents (text file with too large metadata to persist)', async () => {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: (new Array(100 * 1024)).join('Large String'),
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await testResolveBackup(fooFile, contents, meta, true);
            });
            async function testResolveBackup(resource, contents, meta, expectNoMeta) {
                await doTestResolveBackup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
                await doTestResolveBackup((0, workbenchTestServices_1.toTypedWorkingCopyId)(resource), contents, meta, expectNoMeta);
            }
            async function doTestResolveBackup(identifier, contents, meta, expectNoMeta) {
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                if (expectNoMeta || !meta) {
                    assert.strictEqual(backup.meta, undefined);
                }
                else {
                    assert.ok(backup.meta);
                    assert.strictEqual(backup.meta.etag, meta.etag);
                    assert.strictEqual(backup.meta.size, meta.size);
                    assert.strictEqual(backup.meta.mtime, meta.mtime);
                    assert.strictEqual(backup.meta.orphaned, meta.orphaned);
                    assert.strictEqual(Object.keys(meta).length, Object.keys(backup.meta).length);
                }
            }
            test('should restore the original contents (text file with broken metadata)', async () => {
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                await testShouldRestoreOriginalContentsWithBrokenBackup((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldRestoreOriginalContentsWithBrokenBackup(identifier) {
                const contents = [
                    'Lorem ipsum ',
                    'dolor öäü sit amet ',
                    'adipiscing ßß elit',
                    'consectetur '
                ].join('');
                const meta = {
                    etag: 'theEtag',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                const fileContents = (await fileService.readFile(backupPath)).value.toString();
                assert.strictEqual(fileContents.indexOf(identifier.resource.toString()), 0);
                const metaIndex = fileContents.indexOf('{');
                const newFileContents = fileContents.substring(0, metaIndex) + '{{' + fileContents.substr(metaIndex);
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(newFileContents));
                const backup = await service.resolve(identifier);
                assert.ok(backup);
                assert.strictEqual(contents, (await (0, buffer_1.streamToBuffer)(backup.value)).toString());
                assert.strictEqual(backup.meta, undefined);
            }
            test('should update metadata from file into model when resolving', async () => {
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                await testShouldUpdateMetaFromFileWhenResolving((0, workbenchTestServices_1.toTypedWorkingCopyId)(fooFile));
            });
            async function testShouldUpdateMetaFromFileWhenResolving(identifier) {
                const contents = 'Foo Bar';
                const meta = {
                    etag: 'theEtagForThisMetadataTest',
                    size: 888,
                    mtime: Date.now(),
                    orphaned: false
                };
                const updatedMeta = {
                    ...meta,
                    etag: meta.etag + meta.etag
                };
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1, meta);
                const backupPath = (0, resources_1.joinPath)(workspaceBackupPath, identifier.resource.scheme, (0, workingCopyBackupService_1.hashIdentifier)(identifier));
                // Simulate the condition of the backups model loading initially without
                // meta data information and then getting the meta data updated on the
                // first call to resolve the backup. We simulate this by explicitly changing
                // the meta data in the file and then verifying that the updated meta data
                // is persisted back into the model (verified via `hasBackupSync`).
                // This is not really something that would happen in real life because any
                // backup that is made via backup service will update the model accordingly.
                const originalFileContents = (await fileService.readFile(backupPath)).value.toString();
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(originalFileContents.replace(meta.etag, updatedMeta.etag)));
                await service.resolve(identifier);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), false);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), true);
                await fileService.writeFile(backupPath, buffer_1.VSBuffer.fromString(originalFileContents));
                await service.getBackups();
                assert.strictEqual(service.hasBackupSync(identifier, undefined, meta), true);
                assert.strictEqual(service.hasBackupSync(identifier, undefined, updatedMeta), false);
            }
            test('should ignore invalid backups (empty file)', async () => {
                const contents = 'test\nand more stuff';
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.testGetFileService().writeFile(service.toBackupResource((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(''));
                backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('should ignore invalid backups (no preamble)', async () => {
                const contents = 'testand more stuff';
                await service.backup((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile), (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)), 1);
                let backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                await service.testGetFileService().writeFile(service.toBackupResource((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)), buffer_1.VSBuffer.fromString(contents));
                backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(!backup);
            });
            test('file with binary data', async () => {
                const identifier = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const buffer = Uint8Array.from([
                    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 73, 0, 0, 0, 67, 8, 2, 0, 0, 0, 95, 138, 191, 237, 0, 0, 0, 1, 115, 82, 71, 66, 0, 174, 206, 28, 233, 0, 0, 0, 4, 103, 65, 77, 65, 0, 0, 177, 143, 11, 252, 97, 5, 0, 0, 0, 9, 112, 72, 89, 115, 0, 0, 14, 195, 0, 0, 14, 195, 1, 199, 111, 168, 100, 0, 0, 0, 71, 116, 69, 88, 116, 83, 111, 117, 114, 99, 101, 0, 83, 104, 111, 116, 116, 121, 32, 118, 50, 46, 48, 46, 50, 46, 50, 49, 54, 32, 40, 67, 41, 32, 84, 104, 111, 109, 97, 115, 32, 66, 97, 117, 109, 97, 110, 110, 32, 45, 32, 104, 116, 116, 112, 58, 47, 47, 115, 104, 111, 116, 116, 121, 46, 100, 101, 118, 115, 45, 111, 110, 46, 110, 101, 116, 44, 132, 21, 213, 0, 0, 0, 84, 73, 68, 65, 84, 120, 218, 237, 207, 65, 17, 0, 0, 12, 2, 32, 211, 217, 63, 146, 37, 246, 218, 65, 3, 210, 191, 226, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 230, 118, 100, 169, 4, 173, 8, 44, 248, 184, 40, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
                ]);
                await service.backup(identifier, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.wrap(buffer)), undefined, { binaryTest: 'true' });
                const backup = await service.resolve((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile));
                assert.ok(backup);
                const backupBuffer = await (0, stream_1.consumeStream)(backup.value, chunks => buffer_1.VSBuffer.concat(chunks));
                assert.strictEqual(backupBuffer.buffer.byteLength, buffer.byteLength);
            });
        });
        suite('WorkingCopyBackupsModel', () => {
            test('simple', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                const resource1 = uri_1.URI.file('test.html');
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                assert.strictEqual(model.has(resource1, 1, { foo: 'bar' }), false);
                model.remove(resource1);
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), true);
                assert.strictEqual(model.has(resource1, 1), false);
                model.clear();
                assert.strictEqual(model.has(resource1), false);
                model.add(resource1, 1);
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource1, 0), false);
                assert.strictEqual(model.has(resource1, 1), true);
                const resource2 = uri_1.URI.file('test1.html');
                const resource3 = uri_1.URI.file('test2.html');
                const resource4 = uri_1.URI.file('test3.html');
                model.add(resource2);
                model.add(resource3);
                model.add(resource4, undefined, { foo: 'bar' });
                assert.strictEqual(model.has(resource1), true);
                assert.strictEqual(model.has(resource2), true);
                assert.strictEqual(model.has(resource3), true);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), true);
                assert.strictEqual(model.has(resource4, undefined, { bar: 'foo' }), false);
                model.update(resource4, { foo: 'nothing' });
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'bar' }), false);
                model.update(resource4);
                assert.strictEqual(model.has(resource4), true);
                assert.strictEqual(model.has(resource4, undefined, { foo: 'nothing' }), false);
            });
            test('create', async () => {
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)((0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile)));
                await fileService.createFolder((0, resources_1.dirname)(fooBackupPath));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString('foo'));
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                assert.strictEqual(model.has(fooBackupPath), true);
            });
            test('get', async () => {
                const model = await workingCopyBackupService_1.WorkingCopyBackupsModel.create(workspaceBackupPath, service.testGetFileService());
                assert.deepStrictEqual(model.get(), []);
                const file1 = uri_1.URI.file('/root/file/foo.html');
                const file2 = uri_1.URI.file('/root/file/bar.html');
                const untitled = uri_1.URI.file('/root/untitled/bar.html');
                model.add(file1);
                model.add(file2);
                model.add(untitled);
                assert.deepStrictEqual(model.get().map(f => f.fsPath), [file1.fsPath, file2.fsPath, untitled.fsPath]);
            });
        });
        suite('typeId migration', () => {
            test('works (when meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString(`${fooFile.toString()}\ntest file`));
                await fileService.writeFile(untitledBackupPath, buffer_1.VSBuffer.fromString(`${untitledFile.toString()}\ntest untitled`));
                await fileService.writeFile(customFileBackupPath, buffer_1.VSBuffer.fromString(`${customFile.toString()}\ntest custom`));
                service.reinitialize(workspaceBackupPath);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
            test('works (when typeId in meta is missing)', async () => {
                const fooBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(fooFile);
                const untitledBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(untitledFile);
                const customBackupId = (0, workbenchTestServices_1.toUntypedWorkingCopyId)(customFile);
                const fooBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(fooBackupId));
                const untitledBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(untitledBackupId));
                const customFileBackupPath = (0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme, (0, workingCopyBackupService_1.hashIdentifier)(customBackupId));
                // Prepare backups of the old format without meta
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, fooFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, untitledFile.scheme));
                await fileService.createFolder((0, resources_1.joinPath)(workspaceBackupPath, customFile.scheme));
                await fileService.writeFile(fooBackupPath, buffer_1.VSBuffer.fromString(`${fooFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest file`));
                await fileService.writeFile(untitledBackupPath, buffer_1.VSBuffer.fromString(`${untitledFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest untitled`));
                await fileService.writeFile(customFileBackupPath, buffer_1.VSBuffer.fromString(`${customFile.toString()} ${JSON.stringify({ foo: 'bar' })}\ntest custom`));
                service.reinitialize(workspaceBackupPath);
                const backups = await service.getBackups();
                assert.strictEqual(backups.length, 3);
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, fooFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, untitledFile)));
                assert.ok(backups.some(backup => (0, resources_1.isEqual)(backup.resource, customFile)));
                assert.ok(backups.every(backup => backup.typeId === ''));
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3JraW5nQ29weS90ZXN0L2VsZWN0cm9uLXNhbmRib3gvd29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0NoRyxNQUFNLE9BQU8sR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDcEUsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2xFLE1BQU0sWUFBWSxHQUFHO1FBQ3BCLElBQUksRUFBRSxFQUFFO1FBQ1IsRUFBRSxFQUFFLEVBQUU7UUFDTixTQUFTLEVBQUUsRUFBRTtRQUNiLFNBQVMsRUFBRSxLQUFLO1FBQ2hCLFFBQVEsRUFBRSxPQUFPO1FBQ2pCLGdCQUFnQixFQUFFLElBQUEsb0JBQVEsRUFBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO1FBQ3BELGlCQUFpQixFQUFFLElBQUEsb0JBQVEsRUFBQyxPQUFPLEVBQUUsZUFBZSxDQUFDO1FBQ3JELG1CQUFtQixFQUFFLElBQUEsb0JBQVEsRUFBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUM7UUFDMUQsYUFBYSxFQUFFLElBQUEsb0JBQVEsRUFBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO1FBQzlDLFlBQVksRUFBRSxJQUFBLG9CQUFRLEVBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQztRQUMzQyxrQkFBa0Is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QUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVB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LElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVuRCxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUVoRCxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUVsRCxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLFNBQVMsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUV6QyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyQixLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyQixLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFFL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRSxLQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRSxLQUFLLENB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