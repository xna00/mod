/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/services/authentication/browser/authenticationAccessService", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, utils_1, authenticationAccessService_1, authenticationService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createSession() {
        return { id: 'session1', accessToken: 'token1', account: { id: 'account', label: 'Account' }, scopes: ['test'] };
    }
    function createProvider(overrides = {}) {
        return {
            supportsMultipleAccounts: false,
            onDidChangeSessions: new event_1.Emitter().event,
            id: 'test',
            label: 'Test',
            getSessions: async () => [],
            createSession: async () => createSession(),
            removeSession: async () => { },
            ...overrides
        };
    }
    suite('AuthenticationService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let authenticationService;
        setup(() => {
            const storageService = disposables.add(new workbenchTestServices_1.TestStorageService());
            const authenticationAccessService = disposables.add(new authenticationAccessService_1.AuthenticationAccessService(storageService, workbenchTestServices_1.TestProductService));
            authenticationService = disposables.add(new authenticationService_1.AuthenticationService(new workbenchTestServices_1.TestExtensionService(), authenticationAccessService));
        });
        teardown(() => {
            // Dispose the authentication service after each test
            authenticationService.dispose();
        });
        suite('declaredAuthenticationProviders', () => {
            test('registerDeclaredAuthenticationProvider', async () => {
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeDeclaredProviders);
                const provider = {
                    id: 'github',
                    label: 'GitHub'
                };
                authenticationService.registerDeclaredAuthenticationProvider(provider);
                // Assert that the provider is added to the declaredProviders array and the event fires
                assert.equal(authenticationService.declaredProviders.length, 1);
                assert.deepEqual(authenticationService.declaredProviders[0], provider);
                await changed;
            });
            test('unregisterDeclaredAuthenticationProvider', async () => {
                const provider = {
                    id: 'github',
                    label: 'GitHub'
                };
                authenticationService.registerDeclaredAuthenticationProvider(provider);
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeDeclaredProviders);
                authenticationService.unregisterDeclaredAuthenticationProvider(provider.id);
                // Assert that the provider is removed from the declaredProviders array and the event fires
                assert.equal(authenticationService.declaredProviders.length, 0);
                await changed;
            });
        });
        suite('authenticationProviders', () => {
            test('isAuthenticationProviderRegistered', async () => {
                const registered = event_1.Event.toPromise(authenticationService.onDidRegisterAuthenticationProvider);
                const provider = createProvider();
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), false);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), true);
                const result = await registered;
                assert.deepEqual(result, { id: provider.id, label: provider.label });
            });
            test('unregisterAuthenticationProvider', async () => {
                const unregistered = event_1.Event.toPromise(authenticationService.onDidUnregisterAuthenticationProvider);
                const provider = createProvider();
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), true);
                authenticationService.unregisterAuthenticationProvider(provider.id);
                assert.equal(authenticationService.isAuthenticationProviderRegistered(provider.id), false);
                const result = await unregistered;
                assert.deepEqual(result, { id: provider.id, label: provider.label });
            });
            test('getProviderIds', () => {
                const provider1 = createProvider({
                    id: 'provider1',
                    label: 'Provider 1'
                });
                const provider2 = createProvider({
                    id: 'provider2',
                    label: 'Provider 2'
                });
                authenticationService.registerAuthenticationProvider(provider1.id, provider1);
                authenticationService.registerAuthenticationProvider(provider2.id, provider2);
                const providerIds = authenticationService.getProviderIds();
                // Assert that the providerIds array contains the registered provider ids
                assert.deepEqual(providerIds, [provider1.id, provider2.id]);
            });
            test('getProvider', () => {
                const provider = createProvider();
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const retrievedProvider = authenticationService.getProvider(provider.id);
                // Assert that the retrieved provider is the same as the registered provider
                assert.deepEqual(retrievedProvider, provider);
            });
        });
        suite('authenticationSessions', () => {
            test('getSessions', async () => {
                let isCalled = false;
                const provider = createProvider({
                    getSessions: async () => {
                        isCalled = true;
                        return [createSession()];
                    },
                });
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const sessions = await authenticationService.getSessions(provider.id);
                assert.equal(sessions.length, 1);
                assert.ok(isCalled);
            });
            test('createSession', async () => {
                const emitter = new event_1.Emitter();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    createSession: async () => {
                        const session = createSession();
                        emitter.fire({ added: [session], removed: [], changed: [] });
                        return session;
                    },
                });
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const session = await authenticationService.createSession(provider.id, ['repo']);
                // Assert that the created session matches the expected session and the event fires
                assert.ok(session);
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [session], removed: [], changed: [] }
                });
            });
            test('removeSession', async () => {
                const emitter = new event_1.Emitter();
                const session = createSession();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    removeSession: async () => emitter.fire({ added: [], removed: [session], changed: [] })
                });
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                await authenticationService.removeSession(provider.id, session.id);
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [], removed: [session], changed: [] }
                });
            });
            test('onDidChangeSessions', async () => {
                const emitter = new event_1.Emitter();
                const provider = createProvider({
                    onDidChangeSessions: emitter.event,
                    getSessions: async () => []
                });
                authenticationService.registerAuthenticationProvider(provider.id, provider);
                const changed = event_1.Event.toPromise(authenticationService.onDidChangeSessions);
                const session = createSession();
                emitter.fire({ added: [], removed: [], changed: [session] });
                const result = await changed;
                assert.deepEqual(result, {
                    providerId: provider.id,
                    label: provider.label,
                    event: { added: [], removed: [], changed: [session] }
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hdXRoZW50aWNhdGlvbi90ZXN0L2Jyb3dzZXIvYXV0aGVudGljYXRpb25TZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsU0FBUyxhQUFhO1FBQ3JCLE9BQU8sRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUNsSCxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsWUFBOEMsRUFBRTtRQUN2RSxPQUFPO1lBQ04sd0JBQXdCLEVBQUUsS0FBSztZQUMvQixtQkFBbUIsRUFBRSxJQUFJLGVBQU8sRUFBcUMsQ0FBQyxLQUFLO1lBQzNFLEVBQUUsRUFBRSxNQUFNO1lBQ1YsS0FBSyxFQUFFLE1BQU07WUFDYixXQUFXLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxFQUFFO1lBQzNCLGFBQWEsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLGFBQWEsRUFBRTtZQUMxQyxhQUFhLEVBQUUsS0FBSyxJQUFJLEVBQUUsR0FBRyxDQUFDO1lBQzlCLEdBQUcsU0FBUztTQUNaLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUNuQyxNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsSUFBSSxxQkFBNEMsQ0FBQztRQUVqRCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxjQUFjLEdBQUcsV0FB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