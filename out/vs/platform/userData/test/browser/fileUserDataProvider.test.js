/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/environment/common/environmentService", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userData/common/fileUserDataProvider", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, assert, buffer_1, event_1, lifecycle_1, network_1, resources_1, uri_1, utils_1, environmentService_1, fileService_1, inMemoryFilesystemProvider_1, log_1, product_1, uriIdentityService_1, fileUserDataProvider_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
    class TestEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        constructor(_appSettingsHome) {
            super(Object.create(null), Object.create(null), { _serviceBrand: undefined, ...product_1.default });
            this._appSettingsHome = _appSettingsHome;
        }
        get userRoamingDataHome() { return this._appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
        get cacheHome() { return this.userRoamingDataHome; }
    }
    suite('FileUserDataProvider', () => {
        let testObject;
        let userDataHomeOnDisk;
        let backupWorkspaceHomeOnDisk;
        let environmentService;
        let userDataProfilesService;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let fileUserDataProvider;
        setup(async () => {
            const logService = new log_1.NullLogService();
            testObject = disposables.add(new fileService_1.FileService(logService));
            const fileSystemProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
            disposables.add(testObject.registerProvider(ROOT.scheme, fileSystemProvider));
            userDataHomeOnDisk = (0, resources_1.joinPath)(ROOT, 'User');
            const backupHome = (0, resources_1.joinPath)(ROOT, 'Backups');
            backupWorkspaceHomeOnDisk = (0, resources_1.joinPath)(backupHome, 'workspaceId');
            await testObject.createFolder(userDataHomeOnDisk);
            await testObject.createFolder(backupWorkspaceHomeOnDisk);
            environmentService = new TestEnvironmentService(userDataHomeOnDisk);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(testObject));
            userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, testObject, uriIdentityService, logService));
            fileUserDataProvider = disposables.add(new fileUserDataProvider_1.FileUserDataProvider(ROOT.scheme, fileSystemProvider, network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, logService));
            disposables.add(fileUserDataProvider);
            disposables.add(testObject.registerProvider(network_1.Schemas.vscodeUserData, fileUserDataProvider));
        });
        test('exists return false when file does not exist', async () => {
            const exists = await testObject.exists(userDataProfilesService.defaultProfile.settingsResource);
            assert.strictEqual(exists, false);
        });
        test('read file throws error if not exist', async () => {
            try {
                await testObject.readFile(userDataProfilesService.defaultProfile.settingsResource);
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        });
        test('read existing file', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const result = await testObject.readFile(userDataProfilesService.defaultProfile.settingsResource);
            assert.strictEqual(result.value.toString(), '{}');
        });
        test('create file', async () => {
            const resource = userDataProfilesService.defaultProfile.settingsResource;
            const actual1 = await testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual2 = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'));
            assert.strictEqual(actual2.value.toString(), '{}');
        });
        test('write file creates the file if not exist', async () => {
            const resource = userDataProfilesService.defaultProfile.settingsResource;
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual2 = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'));
            assert.strictEqual(actual2.value.toString(), '{}');
        });
        test('write to existing file', async () => {
            const resource = userDataProfilesService.defaultProfile.settingsResource;
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{a:1}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual2 = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'));
            assert.strictEqual(actual2.value.toString(), '{a:1}');
        });
        test('delete file', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'), buffer_1.VSBuffer.fromString(''));
            await testObject.del(userDataProfilesService.defaultProfile.settingsResource);
            const result = await testObject.exists((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'));
            assert.strictEqual(false, result);
        });
        test('resolve file', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'settings.json'), buffer_1.VSBuffer.fromString(''));
            const result = await testObject.resolve(userDataProfilesService.defaultProfile.settingsResource);
            assert.ok(!result.isDirectory);
            assert.ok(result.children === undefined);
        });
        test('exists return false for folder that does not exist', async () => {
            const exists = await testObject.exists(userDataProfilesService.defaultProfile.snippetsHome);
            assert.strictEqual(exists, false);
        });
        test('exists return true for folder that exists', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            const exists = await testObject.exists(userDataProfilesService.defaultProfile.snippetsHome);
            assert.strictEqual(exists, true);
        });
        test('read file throws error for folder', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            try {
                await testObject.readFile(userDataProfilesService.defaultProfile.snippetsHome);
                assert.fail('Should fail since read file is not supported for folders');
            }
            catch (e) { }
        });
        test('read file under folder', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual = await testObject.readFile(resource);
            assert.strictEqual(actual.resource.toString(), resource.toString());
            assert.strictEqual(actual.value.toString(), '{}');
        });
        test('read file under sub folder', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'java'));
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'java', 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'java/settings.json');
            const actual = await testObject.readFile(resource);
            assert.strictEqual(actual.resource.toString(), resource.toString());
            assert.strictEqual(actual.value.toString(), '{}');
        });
        test('create file under folder that exists', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual1 = await testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual2 = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(actual2.value.toString(), '{}');
        });
        test('create file under folder that does not exist', async () => {
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual1 = await testObject.createFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual2 = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(actual2.value.toString(), '{}');
        });
        test('write to not existing file under container that exists', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(actual.value.toString(), '{}');
        });
        test('write to not existing file under container that does not exists', async () => {
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(actual.value.toString(), '{}');
        });
        test('write to existing file under container', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json');
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{a:1}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(actual.value.toString(), '{a:1}');
        });
        test('write file under sub container', async () => {
            const resource = (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'java/settings.json');
            const actual1 = await testObject.writeFile(resource, buffer_1.VSBuffer.fromString('{}'));
            assert.strictEqual(actual1.resource.toString(), resource.toString());
            const actual = await testObject.readFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'java', 'settings.json'));
            assert.strictEqual(actual.value.toString(), '{}');
        });
        test('delete throws error for folder that does not exist', async () => {
            try {
                await testObject.del(userDataProfilesService.defaultProfile.snippetsHome);
                assert.fail('Should fail the folder does not exist');
            }
            catch (e) { }
        });
        test('delete not existing file under container that exists', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            try {
                await testObject.del((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json'));
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        });
        test('delete not existing file under container that does not exists', async () => {
            try {
                await testObject.del((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json'));
                assert.fail('Should fail since file does not exist');
            }
            catch (e) { }
        });
        test('delete existing file under folder', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            await testObject.del((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json'));
            const exists = await testObject.exists((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'));
            assert.strictEqual(exists, false);
        });
        test('resolve folder', async () => {
            await testObject.createFolder((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets'));
            await testObject.writeFile((0, resources_1.joinPath)(userDataHomeOnDisk, 'snippets', 'settings.json'), buffer_1.VSBuffer.fromString('{}'));
            const result = await testObject.resolve(userDataProfilesService.defaultProfile.snippetsHome);
            assert.ok(result.isDirectory);
            assert.ok(result.children !== undefined);
            assert.strictEqual(result.children.length, 1);
            assert.strictEqual(result.children[0].resource.toString(), (0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'settings.json').toString());
        });
        test('read backup file', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk, 'backup.json'), buffer_1.VSBuffer.fromString('{}'));
            const result = await testObject.readFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk.with({ scheme: environmentService.userRoamingDataHome.scheme }), `backup.json`));
            assert.strictEqual(result.value.toString(), '{}');
        });
        test('create backup file', async () => {
            await testObject.createFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk.with({ scheme: environmentService.userRoamingDataHome.scheme }), `backup.json`), buffer_1.VSBuffer.fromString('{}'));
            const result = await testObject.readFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk, 'backup.json'));
            assert.strictEqual(result.value.toString(), '{}');
        });
        test('write backup file', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk, 'backup.json'), buffer_1.VSBuffer.fromString('{}'));
            await testObject.writeFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk.with({ scheme: environmentService.userRoamingDataHome.scheme }), `backup.json`), buffer_1.VSBuffer.fromString('{a:1}'));
            const result = await testObject.readFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk, 'backup.json'));
            assert.strictEqual(result.value.toString(), '{a:1}');
        });
        test('resolve backups folder', async () => {
            await testObject.writeFile((0, resources_1.joinPath)(backupWorkspaceHomeOnDisk, 'backup.json'), buffer_1.VSBuffer.fromString('{}'));
            const result = await testObject.resolve(backupWorkspaceHomeOnDisk.with({ scheme: environmentService.userRoamingDataHome.scheme }));
            assert.ok(result.isDirectory);
            assert.ok(result.children !== undefined);
            assert.strictEqual(result.children.length, 1);
            assert.strictEqual(result.children[0].resource.toString(), (0, resources_1.joinPath)(backupWorkspaceHomeOnDisk.with({ scheme: environmentService.userRoamingDataHome.scheme }), `backup.json`).toString());
        });
    });
    class TestFileSystemProvider {
        constructor(onDidChangeFile) {
            this.onDidChangeFile = onDidChangeFile;
            this.capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */;
            this.onDidChangeCapabilities = event_1.Event.None;
        }
        watch() { return lifecycle_1.Disposable.None; }
        stat() { throw new Error('Not Supported'); }
        mkdir(resource) { throw new Error('Not Supported'); }
        rename() { throw new Error('Not Supported'); }
        readFile(resource) { throw new Error('Not Supported'); }
        readdir(resource) { throw new Error('Not Supported'); }
        writeFile() { throw new Error('Not Supported'); }
        delete() { throw new Error('Not Supported'); }
        open(resource, opts) { throw new Error('Not Supported'); }
        close(fd) { throw new Error('Not Supported'); }
        read(fd, pos, data, offset, length) { throw new Error('Not Supported'); }
        write(fd, pos, data, offset, length) { throw new Error('Not Supported'); }
        readFileStream(resource, opts, token) { throw new Error('Method not implemented.'); }
    }
    suite('FileUserDataProvider - Watching', () => {
        let testObject;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const rootFileResource = (0, resources_1.joinPath)(ROOT, 'User');
        const rootUserDataResource = rootFileResource.with({ scheme: network_1.Schemas.vscodeUserData });
        let fileEventEmitter;
        setup(() => {
            const logService = new log_1.NullLogService();
            const fileService = disposables.add(new fileService_1.FileService(logService));
            const environmentService = new TestEnvironmentService(rootFileResource);
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const userDataProfilesService = disposables.add(new userDataProfile_1.UserDataProfilesService(environmentService, fileService, uriIdentityService, logService));
            fileEventEmitter = disposables.add(new event_1.Emitter());
            testObject = disposables.add(new fileUserDataProvider_1.FileUserDataProvider(rootFileResource.scheme, new TestFileSystemProvider(fileEventEmitter.event), network_1.Schemas.vscodeUserData, userDataProfilesService, uriIdentityService, new log_1.NullLogService()));
        });
        test('file added change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 1 /* FileChangeType.ADDED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 1 /* FileChangeType.ADDED */
                }]);
        });
        test('file updated change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 0 /* FileChangeType.UPDATED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 0 /* FileChangeType.UPDATED */
                }]);
        });
        test('file deleted change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 2 /* FileChangeType.DELETED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* FileChangeType.DELETED */
                }]);
        });
        test('file under folder created change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'snippets', 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'snippets', 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 1 /* FileChangeType.ADDED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 1 /* FileChangeType.ADDED */
                }]);
        });
        test('file under folder updated change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'snippets', 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'snippets', 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 0 /* FileChangeType.UPDATED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 0 /* FileChangeType.UPDATED */
                }]);
        });
        test('file under folder deleted change event', done => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const expected = (0, resources_1.joinPath)(rootUserDataResource, 'snippets', 'settings.json');
            const target = (0, resources_1.joinPath)(rootFileResource, 'snippets', 'settings.json');
            disposables.add(testObject.onDidChangeFile(e => {
                if ((0, resources_1.isEqual)(e[0].resource, expected) && e[0].type === 2 /* FileChangeType.DELETED */) {
                    done();
                }
            }));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* FileChangeType.DELETED */
                }]);
        });
        test('event is not triggered if not watched', async () => {
            const target = (0, resources_1.joinPath)(rootFileResource, 'settings.json');
            let triggered = false;
            disposables.add(testObject.onDidChangeFile(() => triggered = true));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* FileChangeType.DELETED */
                }]);
            if (triggered) {
                assert.fail('event should not be triggered');
            }
        });
        test('event is not triggered if not watched 2', async () => {
            disposables.add(testObject.watch(rootUserDataResource, { excludes: [], recursive: false }));
            const target = (0, resources_1.joinPath)((0, resources_1.dirname)(rootFileResource), 'settings.json');
            let triggered = false;
            disposables.add(testObject.onDidChangeFile(() => triggered = true));
            fileEventEmitter.fire([{
                    resource: target,
                    type: 2 /* FileChangeType.DELETED */
                }]);
            if (triggered) {
                assert.fail('event should not be triggered');
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVVzZXJEYXRhUHJvdmlkZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGEvdGVzdC9icm93c2VyL2ZpbGVVc2VyRGF0YVByb3ZpZGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF1QmhHLE1BQU0sSUFBSSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFFaEUsTUFBTSxzQkFBdUIsU0FBUSxxREFBZ0M7UUFDcEUsWUFBNkIsZ0JBQXFCO1lBQ2pELEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLEdBQUcsaUJBQU8sRUFBRSxDQUFDLENBQUM7WUFEOUQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFLO1FBRWxELENBQUM7UUFDRCxJQUFhLG1CQUFtQixLQUFLLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdHLElBQWEsU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztLQUM3RDtJQUVELEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsSUFBSSxVQUF3QixDQUFDO1FBQzdCLElBQUksa0JBQXVCLENBQUM7UUFDNUIsSUFBSSx5QkFBOEIsQ0FBQztRQUNuQyxJQUFJLGtCQUF1QyxDQUFDO1FBQzVDLElBQUksdUJBQWlELENBQUM7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