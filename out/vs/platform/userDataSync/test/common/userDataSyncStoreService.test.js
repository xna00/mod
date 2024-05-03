/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/platform", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, async_1, buffer_1, cancellation_1, event_1, platform_1, timeTravelScheduler_1, utils_1, log_1, productService_1, userDataSync_1, userDataSyncStoreService_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UserDataSyncStoreService', () => {
        const disposableStore = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('test read manifest for the first time', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            const productService = client.instantiationService.get(productService_1.IProductService);
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Client-Name'], `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Client-Version'], productService.version);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test read manifest for the second time when session is not yet created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test session id header is not set in the first manifest request after session is created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test session id header is set from the second manifest request after session is created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are send for write request', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            target.reset();
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are send for read request', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            target.reset();
            await testObject.readResource("settings" /* SyncResource.Settings */, null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are reset after session is cleared ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            await testObject.clear();
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test old headers are sent after session is changed on server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            await target.clear();
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test old headers are reset from second request after session is changed on server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            await target.clear();
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test old headers are sent after session is cleared from another server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test headers are reset after session is cleared from another server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are reset after session is cleared from another server - started syncing again', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            await testObject.manifest(null);
            await testObject.writeResource("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test rate limit on server with retry after', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer(1, 1);
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const promise = event_1.Event.toPromise(testObject.onDidChangeDonotMakeRequestsUntil);
            try {
                await testObject.manifest(null);
                assert.fail('should fail');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncStoreError);
                assert.deepStrictEqual(e.code, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */);
                await promise;
                assert.ok(!!testObject.donotMakeRequestsUntil);
            }
        });
        test('test donotMakeRequestsUntil is reset after retry time is finished', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 0.25)));
                await client.setUp();
                const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
                await testObject.manifest(null);
                try {
                    await testObject.manifest(null);
                    assert.fail('should fail');
                }
                catch (e) { }
                const promise = event_1.Event.toPromise(testObject.onDidChangeDonotMakeRequestsUntil);
                await (0, async_1.timeout)(300);
                await promise;
                assert.ok(!testObject.donotMakeRequestsUntil);
            });
        });
        test('test donotMakeRequestsUntil is retrieved', async () => {
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 1)));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            try {
                await testObject.manifest(null);
            }
            catch (e) { }
            const target = disposableStore.add(client.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService));
            assert.strictEqual(target.donotMakeRequestsUntil?.getTime(), testObject.donotMakeRequestsUntil?.getTime());
        });
        test('test donotMakeRequestsUntil is checked and reset after retreived', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 0.25)));
                await client.setUp();
                const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
                await testObject.manifest(null);
                try {
                    await testObject.manifest(null);
                    assert.fail('should fail');
                }
                catch (e) { }
                await (0, async_1.timeout)(300);
                const target = disposableStore.add(client.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService));
                assert.ok(!target.donotMakeRequestsUntil);
            });
        });
        test('test read resource request handles 304', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await client.sync();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            const expected = await testObject.readResource("settings" /* SyncResource.Settings */, null);
            const actual = await testObject.readResource("settings" /* SyncResource.Settings */, expected);
            assert.strictEqual(actual, expected);
        });
    });
    suite('UserDataSyncRequestsSession', () => {
        const requestService = {
            _serviceBrand: undefined,
            async request() { return { res: { headers: {} }, stream: (0, buffer_1.newWriteableBufferStream)() }; },
            async resolveProxy() { return undefined; },
            async loadCertificates() { return []; }
        };
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('too many requests are thrown when limit exceeded', async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 500, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            try {
                await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            }
            catch (error) {
                assert.ok(error instanceof userDataSync_1.UserDataSyncStoreError);
                assert.strictEqual(error.code, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */);
                return;
            }
            assert.fail('Should fail with limit exceeded');
        });
        test('requests are handled after session is expired', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 100, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            await (0, async_1.timeout)(125);
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
        }));
        test('too many requests are thrown after session is expired', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 100, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            await (0, async_1.timeout)(125);
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            try {
                await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            }
            catch (error) {
                assert.ok(error instanceof userDataSync_1.UserDataSyncStoreError);
                assert.strictEqual(error.code, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */);
                return;
            }
            assert.fail('Should fail with limit exceeded');
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU3RvcmVTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy90ZXN0L2NvbW1vbi91c2VyRGF0YVN5bmNTdG9yZVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlCaEcsS0FBSyxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUV0QyxNQUFNLGVBQWUsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFbEUsSUFBSSxDQUFDLHVDQUF1QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hELG1CQUFtQjtZQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLDJDQUFzQixFQUFFLENBQUM7WUFDNUMsTUFBTSxNQUFNLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLHVDQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDbkUsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDckIsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyx3Q0FBeUIsQ0FBQyxDQUFDO1lBQzlFLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsZ0NBQWUsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEdBQUcsY0FB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