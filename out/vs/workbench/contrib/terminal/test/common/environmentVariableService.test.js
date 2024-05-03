/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/platform/terminal/common/environmentVariable", "vs/platform/storage/common/storage", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event", "vs/workbench/services/history/common/history", "vs/base/common/uri", "vs/base/test/common/utils"], function (require, exports, assert_1, workbenchTestServices_1, environmentVariableService_1, environmentVariable_1, storage_1, instantiationServiceMock_1, extensions_1, event_1, history_1, uri_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestEnvironmentVariableService extends environmentVariableService_1.EnvironmentVariableService {
        persistCollections() { this._persistCollections(); }
        notifyCollectionUpdates() { this._notifyCollectionUpdates(); }
    }
    suite('EnvironmentVariable - EnvironmentVariableService', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instantiationService;
        let environmentVariableService;
        let storageService;
        let historyService;
        let changeExtensionsEvent;
        setup(() => {
            changeExtensionsEvent = store.add(new event_1.Emitter());
            instantiationService = store.add(new instantiationServiceMock_1.TestInstantiationService());
            instantiationService.stub(extensions_1.IExtensionService, workbenchTestServices_1.TestExtensionService);
            storageService = store.add(new workbenchTestServices_1.TestStorageService());
            historyService = new workbenchTestServices_1.TestHistoryService();
            instantiationService.stub(storage_1.IStorageService, storageService);
            instantiationService.stub(extensions_1.IExtensionService, workbenchTestServices_1.TestExtensionService);
            instantiationService.stub(extensions_1.IExtensionService, 'onDidChangeExtensions', changeExtensionsEvent.event);
            instantiationService.stub(extensions_1.IExtensionService, 'extensions', [
                { identifier: { value: 'ext1' } },
                { identifier: { value: 'ext2' } },
                { identifier: { value: 'ext3' } }
            ]);
            instantiationService.stub(history_1.IHistoryService, historyService);
            environmentVariableService = store.add(instantiationService.createInstance(TestEnvironmentVariableService));
        });
        test('should persist collections to the storage service and be able to restore from them', () => {
            const collection = new Map();
            collection.set('A-key', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' });
            collection.set('B-key', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' });
            collection.set('C-key', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'C', options: { applyAtProcessCreation: true, applyAtShellIntegration: true } });
            environmentVariableService.set('ext1', { map: collection, persistent: true });
            (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.getVariableMap(undefined).entries()], [
                ['A', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a', variable: 'A', options: undefined }]],
                ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'b', variable: 'B', options: undefined }]],
                ['C', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'c', variable: 'C', options: { applyAtProcessCreation: true, applyAtShellIntegration: true } }]]
            ]);
            // Persist with old service, create a new service with the same storage service to verify restore
            environmentVariableService.persistCollections();
            const service2 = store.add(instantiationService.createInstance(TestEnvironmentVariableService));
            (0, assert_1.deepStrictEqual)([...service2.mergedCollection.getVariableMap(undefined).entries()], [
                ['A', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a', variable: 'A', options: undefined }]],
                ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'b', variable: 'B', options: undefined }]],
                ['C', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'c', variable: 'C', options: { applyAtProcessCreation: true, applyAtShellIntegration: true } }]]
            ]);
        });
        suite('mergedCollection', () => {
            test('should overwrite any other variable with the first extension that replaces', () => {
                const collection1 = new Map();
                const collection2 = new Map();
                const collection3 = new Map();
                collection1.set('A-key', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' });
                collection1.set('B-key', { value: 'b1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'B' });
                collection2.set('A-key', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' });
                collection2.set('B-key', { value: 'b2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'B' });
                collection3.set('A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' });
                collection3.set('B-key', { value: 'b3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'B' });
                environmentVariableService.set('ext1', { map: collection1, persistent: true });
                environmentVariableService.set('ext2', { map: collection2, persistent: true });
                environmentVariableService.set('ext3', { map: collection3, persistent: true });
                (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.getVariableMap(undefined).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a2', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a1', variable: 'A', options: undefined }
                        ]],
                    ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'b1', variable: 'B', options: undefined }]]
                ]);
            });
            test('should correctly apply the environment values from multiple extension contributions in the correct order', async () => {
                const collection1 = new Map();
                const collection2 = new Map();
                const collection3 = new Map();
                collection1.set('A-key', { value: ':a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, variable: 'A' });
                collection2.set('A-key', { value: 'a2:', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' });
                collection3.set('A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, variable: 'A' });
                environmentVariableService.set('ext1', { map: collection1, persistent: true });
                environmentVariableService.set('ext2', { map: collection2, persistent: true });
                environmentVariableService.set('ext3', { map: collection3, persistent: true });
                // The entries should be ordered in the order they are applied
                (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.getVariableMap(undefined).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a3', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a2:', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: ':a1', variable: 'A', options: undefined }
                        ]]
                ]);
                // Verify the entries get applied to the environment as expected
                const env = { A: 'foo' };
                await environmentVariableService.mergedCollection.applyToProcessEnvironment(env, undefined);
                (0, assert_1.deepStrictEqual)(env, { A: 'a2:a3:a1' });
            });
            test('should correctly apply the workspace specific environment values from multiple extension contributions in the correct order', async () => {
                const scope1 = { workspaceFolder: { uri: uri_1.URI.file('workspace1'), name: 'workspace1', index: 0 } };
                const scope2 = { workspaceFolder: { uri: uri_1.URI.file('workspace2'), name: 'workspace2', index: 3 } };
                const collection1 = new Map();
                const collection2 = new Map();
                const collection3 = new Map();
                collection1.set('A-key', { value: ':a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, scope: scope1, variable: 'A' });
                collection2.set('A-key', { value: 'a2:', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, variable: 'A' });
                collection3.set('A-key', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, scope: scope2, variable: 'A' });
                environmentVariableService.set('ext1', { map: collection1, persistent: true });
                environmentVariableService.set('ext2', { map: collection2, persistent: true });
                environmentVariableService.set('ext3', { map: collection3, persistent: true });
                // The entries should be ordered in the order they are applied
                (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.getVariableMap(scope1).entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a2:', variable: 'A', options: undefined },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: ':a1', scope: scope1, variable: 'A', options: undefined }
                        ]]
                ]);
                // Verify the entries get applied to the environment as expected
                const env = { A: 'foo' };
                await environmentVariableService.mergedCollection.applyToProcessEnvironment(env, scope1);
                (0, assert_1.deepStrictEqual)(env, { A: 'a2:foo:a1' });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvdGVzdC9jb21tb24vZW52aXJvbm1lbnRWYXJpYWJsZVNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxNQUFNLDhCQUErQixTQUFRLHVEQUEwQjtRQUN0RSxrQkFBa0IsS0FBVyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsdUJBQXVCLEtBQVcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ3BFO0lBRUQsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtRQUM5RCxNQUFNLEtBQUssR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFeEQsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLDBCQUEwRCxDQUFDO1FBQy9ELElBQUksY0FBa0MsQ0FBQztRQUN2QyxJQUFJLGNBQWtDLENBQUM7UUFDdkMsSUFBSSxxQkFBb0MsQ0FBQztRQUV6QyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YscUJBQXFCLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFFdkQsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1EQUF3QixFQUFFLENBQUMsQ0FBQztZQUNqRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsOEJBQWlCLEVBQUUsNENBQW9CLENBQUMsQ0FBQztZQUNuRSxjQUFjLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDBDQUFrQixFQUFFLENBQUMsQ0FBQztZQUNyRCxjQUFjLEdBQUcsSUFBSSwwQ0FBa0Is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