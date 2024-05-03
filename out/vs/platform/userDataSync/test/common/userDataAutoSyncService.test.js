/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/resources", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/userDataAutoSyncService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncMachines", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, event_1, resources_1, timeTravelScheduler_1, utils_1, environment_1, files_1, userDataProfile_1, userDataAutoSyncService_1, userDataSync_1, userDataSyncMachines_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestUserDataAutoSyncService extends userDataAutoSyncService_1.UserDataAutoSyncService {
        startAutoSync() { return false; }
        getSyncTriggerDelayTime() { return 50; }
        sync() {
            return this.triggerSync(['sync'], false, false);
        }
    }
    suite('UserDataAutoSyncService', () => {
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('test auto sync with sync resource change triggers sync', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                // Sync once and reset requests
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                target.reset();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Trigger auto sync with settings change
                await testObject.triggerSync(["settings" /* SyncResource.Settings */], false, false);
                // Filter out machine requests
                const actual = target.requests.filter(request => !request.url.startsWith(`${target.url}/v1/resource/machines`));
                // Make sure only one manifest request is made
                assert.deepStrictEqual(actual, [{ type: 'GET', url: `${target.url}/v1/manifest`, headers: {} }]);
            });
        });
        test('test auto sync with sync resource change triggers sync for every change', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                // Sync once and reset requests
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                target.reset();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Trigger auto sync with settings change multiple times
                for (let counter = 0; counter < 2; counter++) {
                    await testObject.triggerSync(["settings" /* SyncResource.Settings */], false, false);
                }
                // Filter out machine requests
                const actual = target.requests.filter(request => !request.url.startsWith(`${target.url}/v1/resource/machines`));
                assert.deepStrictEqual(actual, [
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } }
                ]);
            });
        });
        test('test auto sync with non sync resource change triggers sync', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                // Sync once and reset requests
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                target.reset();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Trigger auto sync with window focus once
                await testObject.triggerSync(['windowFocus'], true, false);
                // Filter out machine requests
                const actual = target.requests.filter(request => !request.url.startsWith(`${target.url}/v1/resource/machines`));
                // Make sure only one manifest request is made
                assert.deepStrictEqual(actual, [{ type: 'GET', url: `${target.url}/v1/manifest`, headers: {} }]);
            });
        });
        test('test auto sync with non sync resource change does not trigger continuous syncs', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                // Sync once and reset requests
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                target.reset();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Trigger auto sync with window focus multiple times
                for (let counter = 0; counter < 2; counter++) {
                    await testObject.triggerSync(['windowFocus'], true, false);
                }
                // Filter out machine requests
                const actual = target.requests.filter(request => !request.url.startsWith(`${target.url}/v1/resource/machines`));
                // Make sure only one manifest request is made
                assert.deepStrictEqual(actual, [{ type: 'GET', url: `${target.url}/v1/manifest`, headers: {} }]);
            });
        });
        test('test first auto sync requests', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.sync();
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                    // Machines
                    { type: 'GET', url: `${target.url}/v1/resource/machines/latest`, headers: {} },
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
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: {} },
                    // Machines
                    { type: 'POST', url: `${target.url}/v1/resource/machines`, headers: { 'If-Match': '0' } }
                ]);
            });
        });
        test('test further auto sync requests without changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Sync once and reset requests
                await testObject.sync();
                target.reset();
                await testObject.sync();
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } }
                ]);
            });
        });
        test('test further auto sync requests with changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Sync once and reset requests
                await testObject.sync();
                target.reset();
                // Do changes in the client
                const fileService = client.instantiationService.get(files_1.IFileService);
                const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
                const userDataProfilesService = client.instantiationService.get(userDataProfile_1.IUserDataProfilesService);
                await fileService.writeFile(userDataProfilesService.defaultProfile.settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'editor.fontSize': 14 })));
                await fileService.writeFile(userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(JSON.stringify([{ 'command': 'abcd', 'key': 'cmd+c' }])));
                await fileService.writeFile((0, resources_1.joinPath)(userDataProfilesService.defaultProfile.snippetsHome, 'html.json'), buffer_1.VSBuffer.fromString(`{}`));
                await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'de' })));
                await testObject.sync();
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } },
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
        });
        test('test auto sync send execution id header', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                // Setup the client
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                const testObject = disposableStore.add(client.instantiationService.createInstance(TestUserDataAutoSyncService));
                // Sync once and reset requests
                await testObject.sync();
                target.reset();
                await testObject.sync();
                for (const request of target.requestsWithAllHeaders) {
                    const hasExecutionIdHeader = request.headers && request.headers['X-Execution-Id'] && request.headers['X-Execution-Id'].length > 0;
                    if (request.url.startsWith(`${target.url}/v1/resource/machines`)) {
                        assert.ok(!hasExecutionIdHeader, `Should not have execution header: ${request.url}`);
                    }
                    else {
                        assert.ok(hasExecutionIdHeader, `Should have execution header: ${request.url}`);
                    }
                }
            });
        });
        test('test delete on one client throws turned off error on other client while syncing', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                // Set up and sync from the client
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.sync();
                // Reset from the first client
                await client.instantiationService.get(userDataSync_1.IUserDataSyncService).reset();
                // Sync from the test client
                target.reset();
                const errorPromise = event_1.Event.toPromise(testObject.onError);
                await testObject.sync();
                const e = await errorPromise;
                assert.ok(e instanceof userDataSync_1.UserDataAutoSyncError);
                assert.deepStrictEqual(e.code, "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } },
                    // Machine
                    { type: 'GET', url: `${target.url}/v1/resource/machines/latest`, headers: { 'If-None-Match': '1' } },
                ]);
            });
        });
        test('test disabling the machine turns off sync', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.sync();
                // Disable current machine
                const userDataSyncMachinesService = testClient.instantiationService.get(userDataSyncMachines_1.IUserDataSyncMachinesService);
                const machines = await userDataSyncMachinesService.getMachines();
                const currentMachine = machines.find(m => m.isCurrent);
                await userDataSyncMachinesService.setEnablements([[currentMachine.id, false]]);
                target.reset();
                const errorPromise = event_1.Event.toPromise(testObject.onError);
                await testObject.sync();
                const e = await errorPromise;
                assert.ok(e instanceof userDataSync_1.UserDataAutoSyncError);
                assert.deepStrictEqual(e.code, "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } },
                    // Machine
                    { type: 'GET', url: `${target.url}/v1/resource/machines/latest`, headers: { 'If-None-Match': '2' } },
                    { type: 'POST', url: `${target.url}/v1/resource/machines`, headers: { 'If-Match': '2' } },
                ]);
            });
        });
        test('test removing the machine adds machine back', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.sync();
                // Remove current machine
                await testClient.instantiationService.get(userDataSyncMachines_1.IUserDataSyncMachinesService).removeCurrentMachine();
                target.reset();
                await testObject.sync();
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } },
                    // Machine
                    { type: 'POST', url: `${target.url}/v1/resource/machines`, headers: { 'If-Match': '2' } },
                ]);
            });
        });
        test('test creating new session from one client throws session expired error on another client while syncing', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer();
                // Set up and sync from the client
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await client.setUp();
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.sync();
                // Reset from the first client
                await client.instantiationService.get(userDataSync_1.IUserDataSyncService).reset();
                // Sync again from the first client to create new session
                await (await client.instantiationService.get(userDataSync_1.IUserDataSyncService).createSyncTask(null)).run();
                // Sync from the test client
                target.reset();
                const errorPromise = event_1.Event.toPromise(testObject.onError);
                await testObject.sync();
                const e = await errorPromise;
                assert.ok(e instanceof userDataSync_1.UserDataAutoSyncError);
                assert.deepStrictEqual(e.code, "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */);
                assert.deepStrictEqual(target.requests, [
                    // Manifest
                    { type: 'GET', url: `${target.url}/v1/manifest`, headers: { 'If-None-Match': '1' } },
                    // Machine
                    { type: 'GET', url: `${target.url}/v1/resource/machines/latest`, headers: { 'If-None-Match': '1' } },
                ]);
            });
        });
        test('test rate limit on server', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer(5);
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                const errorPromise = event_1.Event.toPromise(testObject.onError);
                while (target.requests.length < 5) {
                    await testObject.sync();
                }
                const e = await errorPromise;
                assert.ok(e instanceof userDataSync_1.UserDataSyncStoreError);
                assert.deepStrictEqual(e.code, "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */);
            });
        });
        test('test auto sync is suspended when server donot accepts requests', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer(5, 1);
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                while (target.requests.length < 5) {
                    await testObject.sync();
                }
                target.reset();
                await testObject.sync();
                assert.deepStrictEqual(target.requests, []);
            });
        });
        test('test cache control header with no cache is sent when triggered with disable cache option', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer(5, 1);
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.triggerSync(['some reason'], true, true);
                assert.strictEqual(target.requestsWithAllHeaders[0].headers['Cache-Control'], 'no-cache');
            });
        });
        test('test cache control header is not sent when triggered without disable cache option', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const target = new userDataSyncClient_1.UserDataSyncTestServer(5, 1);
                // Set up and sync from the test client
                const testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
                await testClient.setUp();
                const testObject = disposableStore.add(testClient.instantiationService.createInstance(TestUserDataAutoSyncService));
                await testObject.triggerSync(['some reason'], true, false);
                assert.strictEqual(target.requestsWithAllHeaders[0].headers['Cache-Control'], undefined);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFBdXRvU3luY1NlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL3Rlc3QvY29tbW9uL3VzZXJEYXRhQXV0b1N5bmNTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFnQmhHLE1BQU0sMkJBQTRCLFNBQVEsaURBQXVCO1FBQzdDLGFBQWEsS0FBYyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDMUMsdUJBQXVCLEtBQWEsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5FLElBQUk7WUFDSCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakQsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEdBQUcsRUFBRTtRQUVyQyxNQUFNLGVBQWUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFbEUsSUFBSSxDQUFDLHdEQUF3RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pFLE1BQU0sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLG1CQUFtQjtnQkFDbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRXJCLCtCQUErQjtnQkFDL0IsTUFBTSxDQUFDLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvRixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWYsTUFBTSxVQUFVLEdBQTRCLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBRXpJLHlDQUF5QztnQkFDekMsTUFBTSxVQUFVLENBQUMsV0FBVyxDQUFDLHdDQUF1QixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFcEUsOEJBQThCO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7Z0JBRWhILDhDQUE4QztnQkFDOUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsY0FBYyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEcsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5RUFBeUUsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRixNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxtQkFBbUI7Z0JBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVyQiwrQkFBK0I7Z0JBQy9CLE1BQU0sQ0FBQyxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDL0YsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVmLE1BQU0sVUFBVSxHQUE0QixlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUV6SSx3REFBd0Q7Z0JBQ3hELEtBQUssSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDOUMsTUFBTSxVQUFVLENBQUMsV0FBVyxDQUFDLHdDQUF1QixFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckUsQ0FBQztnQkFFRCw4QkFBOEI7Z0JBQzlCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixDQUFDLENBQUMsQ0FBQztnQkFFaEgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7b0JBQzlCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUQsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLGNBQWMsRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ3BGLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNERBQTRELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0UsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsbUJBQW1CO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixFQUFFLENBQUM7Z0JBQzVDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFckIsK0JBQStCO2dCQUMvQixNQUFNLENBQUMsTUFBTSxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQy9GLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZixNQUFNLFVBQVUsR0FBNEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFekksMkNBQTJDO2dCQUMzQyxNQUFNLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTNELDhCQUE4QjtnQkFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO2dCQUVoSCw4Q0FBOEM7Z0JBQzlDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLGNBQWMsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0ZBQWdGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakcsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsbUJBQW1CO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixFQUFFLENBQUM7Z0JBQzVDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFckIsK0JBQStCO2dCQUMvQixNQUFNLENBQUMsTUFBTSxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLG1DQUFvQixDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQy9GLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZixNQUFNLFVBQVUsR0FBNEIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFekkscURBQXFEO2dCQUNyRCxLQUFLLElBQUksT0FBTyxHQUFHLENBQUMsRUFBRSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUM7b0JBQzlDLE1BQU0sVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztnQkFFRCw4QkFBOEI7Z0JBQzlCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixDQUFDLENBQUMsQ0FBQztnQkFFaEgsOENBQThDO2dCQUM5QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hELE1BQU0sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLG1CQUFtQjtnQkFDbkIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUM1QyxNQUFNLE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3JCLE1BQU0sVUFBVSxHQUFnQyxlQUFlLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUU3SSxNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO29CQUN2QyxXQUFXO29CQUNYLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUQsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUUsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDekYsY0FBYztvQkFDZCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsaUNBQWlDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDakYsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDNUYsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDekYsUUFBUTtvQkFDUixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsMkJBQTJCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDM0UsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLG9CQUFvQixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDdEYsZUFBZTtvQkFDZixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsaUNBQWlDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDakYsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDNUYsYUFBYTtvQkFDYixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsZ0NBQWdDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDaEYsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRTtvQkFDOUUsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsY0FBYyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUU7b0JBQzlELFdBQVc7b0JBQ1gsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtpQkFDekYsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRSxNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxtQkFBbUI7Z0JBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQixNQUFNLFVBQVUsR0FBZ0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFN0ksK0JBQStCO2dCQUMvQixNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVmLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7b0JBQ3ZDLFdBQVc7b0JBQ1gsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLGNBQWMsRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ3BGLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDL0QsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsbUJBQW1CO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixFQUFFLENBQUM7Z0JBQzVDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBRTdJLCtCQUErQjtnQkFDL0IsTUFBTSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZiwyQkFBMkI7Z0JBQzNCLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsb0JBQVksQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsaUNBQW1CLENBQUMsQ0FBQztnQkFDaEYsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDBDQUF3QixDQUFDLENBQUM7Z0JBQzFGLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNySixNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RLLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFBLG9CQUFRLEVBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNuSSxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RILE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7b0JBQ3ZDLFdBQVc7b0JBQ1gsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLGNBQWMsRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ3BGLFdBQVc7b0JBQ1gsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDekYsY0FBYztvQkFDZCxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsMEJBQTBCLEVBQUUsT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUM1RixXQUFXO29CQUNYLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ3pGLGVBQWU7b0JBQ2YsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLDBCQUEwQixFQUFFLE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRTtpQkFDNUYsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMxRCxNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxtQkFBbUI7Z0JBQ25CLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNyQixNQUFNLFVBQVUsR0FBZ0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFN0ksK0JBQStCO2dCQUMvQixNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVmLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4QixLQUFLLE1BQU0sT0FBTyxJQUFJLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO29CQUNyRCxNQUFNLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUNsSSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsdUJBQXVCLENBQUMsRUFBRSxDQUFDO3dCQUNsRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsb0JBQW9CLEVBQUUscUNBQXFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUN0RixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxpQ0FBaUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBQ2pGLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsaUZBQWlGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEcsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUU1QyxrQ0FBa0M7Z0JBQ2xDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxDQUFDLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUUvRix1Q0FBdUM7Z0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pKLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4Qiw4QkFBOEI7Z0JBQzlCLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVwRSw0QkFBNEI7Z0JBQzVCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZixNQUFNLFlBQVksR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekQsTUFBTSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sWUFBWSxDQUFDO2dCQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxvQ0FBcUIsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsZUFBZSxDQUF5QixDQUFFLENBQUMsSUFBSSxvREFBa0MsQ0FBQztnQkFDekYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO29CQUN2QyxXQUFXO29CQUNYLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUNwRixVQUFVO29CQUNWLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyw4QkFBOEIsRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ3BHLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDNUQsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUU1Qyx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pKLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4QiwwQkFBMEI7Z0JBQzFCLE1BQU0sMkJBQTJCLEdBQUcsVUFBVSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtREFBNEIsQ0FBQyxDQUFDO2dCQUN0RyxNQUFNLFFBQVEsR0FBRyxNQUFNLDJCQUEyQixDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqRSxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBRSxDQUFDO2dCQUN4RCxNQUFNLDJCQUEyQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRS9FLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZixNQUFNLFlBQVksR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekQsTUFBTSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRXhCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sWUFBWSxDQUFDO2dCQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxvQ0FBcUIsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsZUFBZSxDQUF5QixDQUFFLENBQUMsSUFBSSxvREFBa0MsQ0FBQztnQkFDekYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO29CQUN2QyxXQUFXO29CQUNYLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUNwRixVQUFVO29CQUNWLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyw4QkFBOEIsRUFBRSxPQUFPLEVBQUUsRUFBRSxlQUFlLEVBQUUsR0FBRyxFQUFFLEVBQUU7b0JBQ3BHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ3pGLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUQsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUU1Qyx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pKLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4Qix5QkFBeUI7Z0JBQ3pCLE1BQU0sVUFBVSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtREFBNEIsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBRS9GLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFFZixNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFO29CQUN2QyxXQUFXO29CQUNYLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsT0FBTyxFQUFFLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUNwRixVQUFVO29CQUNWLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLEVBQUU7aUJBQ3pGLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0dBQXdHLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekgsTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsRUFBRSxDQUFDO2dCQUU1QyxrQ0FBa0M7Z0JBQ2xDLE1BQU0sTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDckIsTUFBTSxDQUFDLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUUvRix1Q0FBdUM7Z0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pKLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4Qiw4QkFBOEI7Z0JBQzlCLE1BQU0sTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxtQ0FBb0IsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUVwRSx5REFBeUQ7Z0JBQ3pELE1BQU0sQ0FBQyxNQUFNLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsbUNBQW9CLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFL0YsNEJBQTRCO2dCQUM1QixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWYsTUFBTSxZQUFZLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUV4QixNQUFNLENBQUMsR0FBRyxNQUFNLFlBQVksQ0FBQztnQkFDN0IsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksb0NBQXFCLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxDQUFDLGVBQWUsQ0FBeUIsQ0FBRSxDQUFDLElBQUksOERBQXVDLENBQUM7Z0JBQzlGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRTtvQkFDdkMsV0FBVztvQkFDWCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsY0FBYyxFQUFFLE9BQU8sRUFBRSxFQUFFLGVBQWUsRUFBRSxHQUFHLEVBQUUsRUFBRTtvQkFDcEYsVUFBVTtvQkFDVixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLEdBQUcsOEJBQThCLEVBQUUsT0FBTyxFQUFFLEVBQUUsZUFBZSxFQUFFLEdBQUcsRUFBRSxFQUFFO2lCQUNwRyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDJCQUEyQixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVDLE1BQU0sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTdDLHVDQUF1QztnQkFDdkMsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN6QixNQUFNLFVBQVUsR0FBZ0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFakosTUFBTSxZQUFZLEdBQUcsYUFBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pELE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN6QixDQUFDO2dCQUVELE1BQU0sQ0FBQyxHQUFHLE1BQU0sWUFBWSxDQUFDO2dCQUM3QixNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxxQ0FBc0IsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsZUFBZSxDQUEwQixDQUFFLENBQUMsSUFBSSxzRUFBd0MsQ0FBQztZQUNqRyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdFQUFnRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2pGLE1BQU0sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksMkNBQXNCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVoRCx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSx1Q0FBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDekIsTUFBTSxVQUFVLEdBQWdDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7Z0JBRWpKLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLE1BQU0sVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN6QixDQUFDO2dCQUVELE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDZixNQUFNLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFFeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMEZBQTBGLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0csTUFBTSxJQUFBLHdDQUFrQixFQUFDLEVBQUUsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQ0FBc0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWhELHVDQUF1QztnQkFDdkMsTUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZFLE1BQU0sVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN6QixNQUFNLFVBQVUsR0FBZ0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztnQkFFakosTUFBTSxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDNUYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtRkFBbUYsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNwRyxNQUFNLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFaEQsdUNBQXVDO2dCQUN2QyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksdUNBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3pCLE1BQU0sVUFBVSxHQUFnQyxlQUFlLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO2dCQUVqSixNQUFNLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMzRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==