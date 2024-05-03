/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, resources_1, utils_1, environment_1, files_1, userDataProfile_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UserDataSyncService', () => {
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('test first time sync ever', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync for first time
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '0' } },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '0' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '0' } },
                // Tasks
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/tasks`, headers: { 'If-Match': '0' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '0' } },
                // Extensions
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test first time sync ever when a sync resource is disabled', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            client.instantiationService.get(userDataSync_1.IUserDataSyncEnablementService).setResourceEnablement("settings" /* SyncResource.Settings */, false);
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync for first time
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '0' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '0' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/tasks`, headers: { 'If-Match': '0' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '0' } },
                // Extensions
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test first time sync ever with no data', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp(true);
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync for first time
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                // Tasks
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                // Extensions
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test first time sync from the client with no changes - merge', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync (merge) from the test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test first time sync from the client with changes - merge', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client with changes
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const fileService = testClient.instantiationService.get(files_1.IFileService);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile((0, resources_1.joinPath)((0, resources_1.dirname)(userDataProfilesService.defaultProfile.settingsResource), 'tasks.json'), buffer_1.VSBuffer.fromString(JSON.stringify({})));
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync (merge) from the test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test first time sync from the client with changes - merge with profile', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client with changes
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const fileService = testClient.instantiationService.get(files_1.IFileService);
            const environmentService = testClient.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await userDataProfilesService.createNamedProfile('1');
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile((0, resources_1.joinPath)((0, resources_1.dirname)(userDataProfilesService.defaultProfile.settingsResource), 'tasks.json'), buffer_1.VSBuffer.fromString(JSON.stringify({})));
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // Sync (merge) from the test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '1' } },
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/collection`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/profiles`, headers: { 'If-Match': '0' } },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/settings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/keybindings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/extensions/latest`, headers: {} },
            ]);
        });
        test('test sync when there are no changes', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // sync from the client again
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
            ]);
        });
        test('test sync when there are local changes', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            target.reset();
            // Do changes in the client
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            // Sync from the client
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                // Keybindings
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                // Snippets
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '1' } },
                // Global state
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '1' } },
            ]);
        });
        test('test sync when there are local changes with profile', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            target.reset();
            // Do changes in the client
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await userDataProfilesService.createNamedProfile('1');
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            // Sync from the client
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                // Keybindings
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                // Snippets
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '1' } },
                // Global state
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '1' } },
                // Profiles
                { type: 'POST', url: `${target.url}/v1/collection`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/profiles`, headers: { 'If-Match': '0' } },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/settings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/keybindings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/extensions/latest`, headers: {} },
            ]);
        });
        test('test sync when there are local changes and sync resource is disabled', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            target.reset();
            // Do changes in the client
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            client.instantiationService.get(userDataSync_1.IUserDataSyncEnablementService).setResourceEnablement("snippets" /* SyncResource.Snippets */, false);
            // Sync from the client
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                // Keybindings
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                // Global state
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '1' } },
            ]);
        });
        test('test sync when there are remote changes', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Sync from first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // Do changes in first client and sync
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{ "a": "changed" }`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: { 'If-None-Match': '1' } },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: { 'If-None-Match': '1' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: { 'If-None-Match': '1' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: { 'If-None-Match': '1' } },
            ]);
        });
        test('test sync when there are remote changes with profile', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Sync from first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // Do changes in first client and sync
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await userDataProfilesService.createNamedProfile('1');
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{ "a": "changed" }`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: { 'If-None-Match': '1' } },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: { 'If-None-Match': '1' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: { 'If-None-Match': '1' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: { 'If-None-Match': '1' } },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: { 'If-None-Match': '0' } },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/settings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/keybindings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/extensions/latest`, headers: {} },
            ]);
        });
        test('test delete', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Sync from the client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // Reset from the client
            target.reset();
            await testObject.reset();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'DELETE', url: `${target.url}/v1/collection`, headers: {} },
                { type: 'DELETE', url: `${target.url}/v1/resource`, headers: {} },
            ]);
        });
        test('test delete and sync', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Sync from the client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // Reset from the client
            await testObject.reset();
            // Sync again
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '0' } },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '0' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '0' } },
                // Tasks
                { type: 'GET', url: `${target.url}/v1/resource/tasks/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/tasks`, headers: { 'If-Match': '0' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '0' } },
                // Extensions
                { type: 'GET', url: `${target.url}/v1/resource/extensions/latest`, headers: {} },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: {} },
            ]);
        });
        test('test sync status', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // sync from the client
            const actualStatuses = [];
            const disposable = testObject.onDidChangeStatus(status => actualStatuses.push(status));
            await (await testObject.createSyncTask(null)).run();
            disposable.dispose();
            assert.deepStrictEqual(actualStatuses, ["syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */, "syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */]);
        });
        test('test sync conflicts status', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            let fileService = client.instantiationService.get(files_1.IFileService);
            let userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            fileService = testClient.instantiationService.get(files_1.IFileService);
            userDataProfilesService = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 16 })));
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            // sync from the client
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assert.deepStrictEqual(testObject.conflicts.map(({ syncResource }) => syncResource), ["settings" /* SyncResource.Settings */]);
        });
        test('test sync will sync other non conflicted areas', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const fileService = client.instantiationService.get(files_1.IFileService);
            let userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client and get conflicts in settings
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testFileService = testClient.instantiationService.get(files_1.IFileService);
            userDataProfilesService = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await testFileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 16 })));
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // sync from the first client with changes in keybindings
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // sync from the test client
            target.reset();
            const actualStatuses = [];
            const disposable = testObject.onDidChangeStatus(status => actualStatuses.push(status));
            await (await testObject.createSyncTask(null)).run();
            disposable.dispose();
            assert.deepStrictEqual(actualStatuses, []);
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: { 'If-None-Match': '1' } },
            ]);
        });
        test('test stop sync reset status', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            let fileService = client.instantiationService.get(files_1.IFileService);
            let userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Setup the test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            fileService = testClient.instantiationService.get(files_1.IFileService);
            userDataProfilesService = testClient.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 16 })));
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            const syncTask = (await testObject.createSyncTask(null));
            syncTask.run().then(null, () => null /* ignore error */);
            await syncTask.stop();
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
        });
        test('test sync send execution id header', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            for (const request of target.requestsWithAllHeaders) {
                const hasExecutionIdHeader = request.headers && request.headers['X-Execution-Id'] && request.headers['X-Execution-Id'].length > 0;
                assert.ok(hasExecutionIdHeader, `Should have execution header: ${request.url}`);
            }
        });
        test('test can run sync taks only once', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            const syncTask = await testObject.createSyncTask(null);
            await syncTask.run();
            try {
                await syncTask.run();
                assert.fail('Should fail running the task again');
            }
            catch (error) {
                /* expected */
            }
        });
        test('test sync when there are local profile that uses default profile', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Setup and sync from the client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            target.reset();
            // Do changes in the client
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await userDataProfilesService.createNamedProfile('1', { useDefaultFlags: { settings: true } });
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            // Sync from the client
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'POST', url: `${target.url}/v1/resource/settings`, headers: { 'If-Match': '1' } },
                // Keybindings
                { type: 'POST', url: `${target.url}/v1/resource/keybindings`, headers: { 'If-Match': '1' } },
                // Snippets
                { type: 'POST', url: `${target.url}/v1/resource/snippets`, headers: { 'If-Match': '1' } },
                // Global state
                { type: 'POST', url: `${target.url}/v1/resource/globalState`, headers: { 'If-Match': '1' } },
                // Profiles
                { type: 'POST', url: `${target.url}/v1/collection`, headers: {} },
                { type: 'POST', url: `${target.url}/v1/resource/profiles`, headers: { 'If-Match': '0' } },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/keybindings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/extensions/latest`, headers: {} },
            ]);
        });
        test('test sync when there is a remote profile that uses default profile', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            // Sync from first client
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await testClient.setUp();
            const testObject = testClient.instantiationService.get(userDataSync_1.IUserDataSyncService);
            await (await testObject.createSyncTask(null)).run();
            // Do changes in first client and sync
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
            await userDataProfilesService.createNamedProfile('1', { useDefaultFlags: { keybindings: true } });
            await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
            await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
            await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{ "a": "changed" }`));
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
            await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
            // Sync from test client
            target.reset();
            await (await testObject.createSyncTask(null)).run();
            assert.deepStrictEqual(target.requests, [
                // Manifest
                { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                // Settings
                { type: 'GET', url: `${target.url}/v1/resource/settings/latest`, headers: { 'If-None-Match': '1' } },
                // Keybindings
                { type: 'GET', url: `${target.url}/v1/resource/keybindings/latest`, headers: { 'If-None-Match': '1' } },
                // Snippets
                { type: 'GET', url: `${target.url}/v1/resource/snippets/latest`, headers: { 'If-None-Match': '1' } },
                // Global state
                { type: 'GET', url: `${target.url}/v1/resource/globalState/latest`, headers: { 'If-None-Match': '1' } },
                // Profiles
                { type: 'GET', url: `${target.url}/v1/resource/profiles/latest`, headers: { 'If-None-Match': '0' } },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/settings/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/snippets/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/tasks/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/globalState/latest`, headers: {} },
                { type: 'GET', url: `${target.url}/v1/collection/1/resource/extensions/latest`, headers: {} },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvdGVzdC9jb21tb24vdXNlckRhdGFTeW5jU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsTUFBTSxlQUFlLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRWxFLElBQUksQ0FBQywyQkFBMkIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1QyxtQkFBbUI7WUFDbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3JCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQztZQUV6RSxzQkFBc0I7WUFDdEIsTUFBTSxDQUFDLE1BQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRXBELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtnQkFDdkMsV0FBVztnQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsY0FBYyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7Z0JBQzlELFdBQVc7Z0JBQ1gsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFH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