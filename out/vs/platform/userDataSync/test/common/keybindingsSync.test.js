/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, utils_1, files_1, log_1, userDataProfile_1, keybindingsSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsSync', () => {
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        teardown(async () => {
            await client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear();
        });
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("keybindings" /* SyncResource.Keybindings */);
        });
        test('when keybindings file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(keybindingsResource));
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        });
        test('when keybindings file is empty and remote has no changes', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), '');
        });
        test('when keybindings file is empty and remote has changes', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify([
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ]);
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), content);
        });
        test('when keybindings file is empty with comment and remote has no changes', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            const expectedContent = '// Empty Keybindings';
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(expectedContent));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), expectedContent);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), expectedContent);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), expectedContent);
        });
        test('when keybindings file is empty and remote has keybindings', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify([
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ]);
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString('// Empty Keybindings'));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), content);
        });
        test('when keybindings file is empty and remote has empty array', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = `// Place your key bindings in this file to override the defaults
[
]`;
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            const expectedLocalContent = '// Empty Keybindings';
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(expectedLocalContent));
            await testObject.sync(await client.getResourceManifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), expectedLocalContent);
        });
        test('when keybindings file is created after first sync', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            await testObject.sync(await client.getResourceManifest());
            await fileService.createFile(keybindingsResource, buffer_1.VSBuffer.fromString('[]'));
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await client.getResourceManifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData?.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
        });
        test('test apply remote when keybindings file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource;
            if (await fileService.exists(keybindingsResource)) {
                await fileService.del(keybindingsResource);
            }
            const preview = (await testObject.preview(await client.getResourceManifest(), {}));
            server.reset();
            const content = await testObject.resolveContent(preview.resourcePreviews[0].remoteResource);
            await testObject.accept(preview.resourcePreviews[0].remoteResource, content);
            await testObject.apply(false);
            assert.deepStrictEqual(server.requests, []);
        });
        test('sync throws invalid content error - content is an object', async () => {
            await client.instantiationService.get(files_1.IFileService).writeFile(client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString('{}'));
            try {
                await testObject.sync(await client.getResourceManifest());
                assert.fail('should fail with invalid content error');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncError);
                assert.deepStrictEqual(e.code, "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */);
            }
        });
        test('sync profile keybindings', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const profile = await client2.instantiationService.get(userDataProfile_1.IUserDataProfilesService).createNamedProfile('profile1');
            await client2.instantiationService.get(files_1.IFileService).writeFile(profile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ])));
            await client2.sync();
            await client.sync();
            const syncedProfile = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService).profiles.find(p => p.id === profile.id);
            const content = (await client.instantiationService.get(files_1.IFileService).readFile(syncedProfile.keybindingsResource)).value.toString();
            assert.deepStrictEqual(JSON.parse(content), [
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NTeW5jLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy90ZXN0L2NvbW1vbi9rZXliaW5kaW5nc1N5bmMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVloRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBRTdCLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLEVBQUUsQ0FBQztRQUM1QyxJQUFJLE1BQTBCLENBQUM7UUFFL0IsSUFBSSxVQUFtQyxDQUFDO1FBRXhDLFFBQVEsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNuQixNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsd0NBQXlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxRSxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sZUFBZSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVsRSxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDaEIsTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzdELE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6QixVQUFVLEdBQUcsTUFBTSxDQUFDLGVBQWUsOENBQXFELENBQUM7UUFDMUYsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxvQkFBWSxDQUFDLENBQUM7WUFDbEUsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FB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