/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatServiceImpl", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/contrib/chat/test/common/mockChatService", "vs/workbench/contrib/chat/test/common/mockChatVariables", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/views/common/viewsService", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, snapshot_1, utils_1, range_1, contextkey_1, serviceCollection_1, instantiationServiceMock_1, mockKeybindingService_1, log_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, chatAgents_1, chatContributionService_1, chatService_1, chatServiceImpl_1, chatSlashCommands_1, chatVariables_1, mockChatService_1, mockChatVariables_1, extensions_1, viewsService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleTestProvider extends lifecycle_1.Disposable {
        static { this.sessionId = 0; }
        constructor(id) {
            super();
            this.id = id;
            this.displayName = 'Test';
        }
        async prepareSession() {
            return {
                id: SimpleTestProvider.sessionId++,
            };
        }
        async provideReply(request, progress) {
            return { session: request.session, followups: [] };
        }
    }
    const chatAgentWithUsedContextId = 'ChatProviderWithUsedContext';
    const chatAgentWithUsedContext = {
        id: chatAgentWithUsedContextId,
        name: chatAgentWithUsedContextId,
        extensionId: extensions_1.nullExtensionDescription.identifier,
        locations: [chatAgents_1.ChatAgentLocation.Panel],
        metadata: {},
        slashCommands: [],
        async invoke(request, progress, history, token) {
            progress({
                documents: [
                    {
                        uri: uri_1.URI.file('/test/path/to/file'),
                        version: 3,
                        ranges: [
                            new range_1.Range(1, 1, 2, 2)
                        ]
                    }
                ],
                kind: 'usedContext'
            });
            return { metadata: { metadataKey: 'value' } };
        },
        async provideFollowups(sessionId, token) {
            return [{ kind: 'reply', message: 'Something else', agentId: '', tooltip: 'a tooltip' }];
        },
    };
    suite('ChatService', () => {
        const testDisposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let storageService;
        let instantiationService;
        let chatAgentService;
        setup(async () => {
            instantiationService = testDisposables.add(new instantiationServiceMock_1.TestInstantiationService(new serviceCollection_1.ServiceCollection([chatVariables_1.IChatVariablesService, new mockChatVariables_1.MockChatVariablesService()])));
            instantiationService.stub(storage_1.IStorageService, storageService = testDisposables.add(new workbenchTestServices_1.TestStorageService()));
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(viewsService_1.IViewsService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(chatContributionService_1.IChatContributionService, new workbenchTestServices_1.TestExtensionService());
            instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(chatSlashCommands_1.IChatSlashCommandService, testDisposables.add(instantiationService.createInstance(chatSlashCommands_1.ChatSlashCommandService)));
            instantiationService.stub(chatService_1.IChatService, new mockChatService_1.MockChatService());
            chatAgentService = instantiationService.createInstance(chatAgents_1.ChatAgentService);
            instantiationService.stub(chatAgents_1.IChatAgentService, chatAgentService);
            const agent = {
                async invoke(request, progress, history, token) {
                    return {};
                },
            };
            testDisposables.add(chatAgentService.registerAgent('testAgent', { name: 'testAgent', id: 'testAgent', isDefault: true, extensionId: extensions_1.nullExtensionDescription.identifier, locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: {}, slashCommands: [] }));
            testDisposables.add(chatAgentService.registerAgent(chatAgentWithUsedContextId, { name: chatAgentWithUsedContextId, id: chatAgentWithUsedContextId, extensionId: extensions_1.nullExtensionDescription.identifier, locations: [chatAgents_1.ChatAgentLocation.Panel], metadata: {}, slashCommands: [] }));
            testDisposables.add(chatAgentService.registerAgentImplementation('testAgent', agent));
            chatAgentService.updateAgent('testAgent', { requester: { name: 'test' }, fullName: 'test' });
        });
        test('retrieveSession', async () => {
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const provider1 = testDisposables.add(new SimpleTestProvider('provider1'));
            const provider2 = testDisposables.add(new SimpleTestProvider('provider2'));
            testDisposables.add(testService.registerProvider(provider1));
            testDisposables.add(testService.registerProvider(provider2));
            const session1 = testDisposables.add(testService.startSession('provider1', cancellation_1.CancellationToken.None));
            await session1.waitForInitialization();
            session1.addRequest({ parts: [], text: 'request 1' }, { variables: [] });
            const session2 = testDisposables.add(testService.startSession('provider2', cancellation_1.CancellationToken.None));
            await session2.waitForInitialization();
            session2.addRequest({ parts: [], text: 'request 2' }, { variables: [] });
            storageService.flush();
            const testService2 = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            testDisposables.add(testService2.registerProvider(provider1));
            testDisposables.add(testService2.registerProvider(provider2));
            const retrieved1 = testDisposables.add(testService2.getOrRestoreSession(session1.sessionId));
            await retrieved1.waitForInitialization();
            const retrieved2 = testDisposables.add(testService2.getOrRestoreSession(session2.sessionId));
            await retrieved2.waitForInitialization();
            assert.deepStrictEqual(retrieved1.getRequests()[0]?.message.text, 'request 1');
            assert.deepStrictEqual(retrieved2.getRequests()[0]?.message.text, 'request 2');
        });
        test('Handles failed session startup', async () => {
            function getFailProvider(providerId) {
                return new class {
                    constructor() {
                        this.id = providerId;
                        this.displayName = 'Test';
                        this.lastInitialState = undefined;
                    }
                    prepareSession(initialState) {
                        throw new Error('Failed to start session');
                    }
                    async provideReply(request) {
                        return { session: request.session, followups: [] };
                    }
                };
            }
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const provider1 = getFailProvider('provider1');
            testDisposables.add(testService.registerProvider(provider1));
            const session1 = testDisposables.add(testService.startSession('provider1', cancellation_1.CancellationToken.None));
            await assert.rejects(() => session1.waitForInitialization());
        });
        test('Can\'t register same provider id twice', async () => {
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            const id = 'testProvider';
            testDisposables.add(testService.registerProvider({
                id,
                prepareSession: function (token) {
                    throw new Error('Function not implemented.');
                }
            }));
            assert.throws(() => {
                testDisposables.add(testService.registerProvider({
                    id,
                    prepareSession: function (token) {
                        throw new Error('Function not implemented.');
                    }
                }));
            }, 'Expected to throw for dupe provider');
        });
        test('addCompleteRequest', async () => {
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            testDisposables.add(testService.registerProvider(testDisposables.add(new SimpleTestProvider('testProvider'))));
            const model = testDisposables.add(testService.startSession('testProvider', cancellation_1.CancellationToken.None));
            assert.strictEqual(model.getRequests().length, 0);
            await testService.addCompleteRequest(model.sessionId, 'test request', undefined, { message: 'test response' });
            assert.strictEqual(model.getRequests().length, 1);
            assert.ok(model.getRequests()[0].response);
            assert.strictEqual(model.getRequests()[0].response?.response.asString(), 'test response');
        });
        test('can serialize', async () => {
            testDisposables.add(chatAgentService.registerAgentImplementation(chatAgentWithUsedContextId, chatAgentWithUsedContext));
            chatAgentService.updateAgent(chatAgentWithUsedContextId, { requester: { name: 'test' }, fullName: 'test' });
            const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            testDisposables.add(testService.registerProvider(testDisposables.add(new SimpleTestProvider('testProvider'))));
            const model = testDisposables.add(testService.startSession('testProvider', cancellation_1.CancellationToken.None));
            assert.strictEqual(model.getRequests().length, 0);
            await (0, snapshot_1.assertSnapshot)(model.toExport());
            const response = await testService.sendRequest(model.sessionId, `@${chatAgentWithUsedContextId} test request`);
            assert(response);
            await response.responseCompletePromise;
            assert.strictEqual(model.getRequests().length, 1);
            await (0, snapshot_1.assertSnapshot)(model.toExport());
        });
        test('can deserialize', async () => {
            let serializedChatData;
            testDisposables.add(chatAgentService.registerAgentImplementation(chatAgentWithUsedContextId, chatAgentWithUsedContext));
            // create the first service, send request, get response, and serialize the state
            { // serapate block to not leak variables in outer scope
                const testService = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
                testDisposables.add(testService.registerProvider(testDisposables.add(new SimpleTestProvider('testProvider'))));
                const chatModel1 = testDisposables.add(testService.startSession('testProvider', cancellation_1.CancellationToken.None));
                assert.strictEqual(chatModel1.getRequests().length, 0);
                const response = await testService.sendRequest(chatModel1.sessionId, `@${chatAgentWithUsedContextId} test request`);
                assert(response);
                await response.responseCompletePromise;
                serializedChatData = chatModel1.toJSON();
            }
            // try deserializing the state into a new service
            const testService2 = testDisposables.add(instantiationService.createInstance(chatServiceImpl_1.ChatService));
            testDisposables.add(testService2.registerProvider(testDisposables.add(new SimpleTestProvider('testProvider'))));
            const chatModel2 = testService2.loadSessionFromContent(serializedChatData);
            assert(chatModel2);
            await (0, snapshot_1.assertSnapshot)(chatModel2.toExport());
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC90ZXN0L2NvbW1vbi9jaGF0U2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0NoRyxNQUFNLGtCQUFtQixTQUFRLHNCQUFVO2lCQUMzQixjQUFTLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFJN0IsWUFBcUIsRUFBVTtZQUM5QixLQUFLLEVBQUUsQ0FBQztZQURZLE9BQUUsR0FBRixFQUFFLENBQVE7WUFGdEIsZ0JBQVcsR0FBRyxNQUFNLENBQUM7UUFJOUIsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjO1lBQ25CLE9BQU87Z0JBQ04sRUFBRSxFQUFFLGtCQUFrQixDQUFDLFNBQVMsRUFBRTthQUNsQyxDQUFDO1FBQ0gsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBcUIsRUFBRSxRQUEyQztZQUNwRixPQUFPLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3BELENBQUM7O0lBR0YsTUFBTSwwQkFBMEIsR0FBRyw2QkFBNkIsQ0FBQztJQUNqRSxNQUFNLHdCQUF3QixHQUFlO1FBQzVDLEVBQUUsRUFBRSwwQkFBMEI7UUFDOUIsSUFBSSxFQUFFLDBCQUEwQjtRQUNoQyxXQUFXLEVBQUUscUNBQXdCLENBQUMsVUFBVTtRQUNoRCxTQUFTLEVBQUUsQ0FBQyw4QkFBaUIsQ0FBQyxLQUFLLENBQUM7UUFDcEMsUUFBUSxFQUFFLEVBQUU7UUFDWixhQUFhLEVBQUUsRUFBRTtRQUNqQixLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEtBQUs7WUFDN0MsUUFBUSxDQUFD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