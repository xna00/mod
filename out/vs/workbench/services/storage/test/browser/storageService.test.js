/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/parts/storage/common/storage", "vs/base/test/common/testUtils", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/files/common/fileService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/log/common/log", "vs/platform/storage/test/common/storageService.test", "vs/workbench/services/storage/browser/storageService", "vs/workbench/services/userDataProfile/common/userDataProfileService"], function (require, exports, assert_1, lifecycle_1, network_1, resources_1, uri_1, storage_1, testUtils_1, timeTravelScheduler_1, utils_1, fileService_1, inMemoryFilesystemProvider_1, log_1, storageService_test_1, storageService_1, userDataProfileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function createStorageService() {
        const disposables = new lifecycle_1.DisposableStore();
        const logService = new log_1.NullLogService();
        const fileService = disposables.add(new fileService_1.FileService(logService));
        const userDataProvider = disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        disposables.add(fileService.registerProvider(network_1.Schemas.vscodeUserData, userDataProvider));
        const profilesRoot = uri_1.URI.file('/profiles').with({ scheme: network_1.Schemas.inMemory });
        const inMemoryExtraProfileRoot = (0, resources_1.joinPath)(profilesRoot, 'extra');
        const inMemoryExtraProfile = {
            id: 'id',
            name: 'inMemory',
            shortName: 'inMemory',
            isDefault: false,
            location: inMemoryExtraProfileRoot,
            globalStorageHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'globalStorageHome'),
            settingsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'settingsResource'),
            keybindingsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'keybindingsResource'),
            tasksResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'tasksResource'),
            snippetsHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'snippetsHome'),
            extensionsResource: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'extensionsResource'),
            cacheHome: (0, resources_1.joinPath)(inMemoryExtraProfileRoot, 'cache')
        };
        const storageService = disposables.add(new storageService_1.BrowserStorageService({ id: 'workspace-storage-test' }, disposables.add(new userDataProfileService_1.UserDataProfileService(inMemoryExtraProfile)), logService));
        await storageService.initialize();
        return [disposables, storageService];
    }
    (0, testUtils_1.flakySuite)('StorageService (browser)', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let storageService;
        (0, storageService_test_1.createSuite)({
            setup: async () => {
                const res = await createStorageService();
                disposables.add(res[0]);
                storageService = res[1];
                return storageService;
            },
            teardown: async () => {
                await storageService.clear();
                disposables.clear();
            }
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    (0, testUtils_1.flakySuite)('StorageService (browser specific)', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let storageService;
        setup(async () => {
            const res = await createStorageService();
            disposables.add(res[0]);
            storageService = res[1];
        });
        teardown(async () => {
            await storageService.clear();
            disposables.clear();
        });
        test.skip('clear', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                storageService.store('bar', 'foo', -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                storageService.store('bar', 'foo', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                storageService.store('bar', 'foo', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                storageService.store('bar', 3, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                await storageService.clear();
                for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                    for (const target of [0 /* StorageTarget.USER */, 1 /* StorageTarget.MACHINE */]) {
                        (0, assert_1.strictEqual)(storageService.get('bar', scope), undefined);
                        (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                    }
                }
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
    (0, testUtils_1.flakySuite)('IndexDBStorageDatabase (browser)', () => {
        const id = 'workspace-storage-db-test';
        const logService = new log_1.NullLogService();
        const disposables = new lifecycle_1.DisposableStore();
        teardown(async () => {
            const storage = disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService));
            await storage.clear();
            disposables.clear();
        });
        test('Basics', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Insert initial data
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            storage.set('barUndefined', undefined);
            storage.set('barNull', null);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Check initial data still there
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            // Update data
            storage.set('bar', 'foo2');
            storage.set('barNumber', 552);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo2');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '552');
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            // Check initial data still there
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo2');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '552');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.get('barUndefined'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNull'), undefined);
            (0, assert_1.strictEqual)(storage.size, 3);
            (0, assert_1.strictEqual)(storage.items.size, 3);
            // Delete data
            storage.delete('bar');
            storage.delete('barNumber');
            storage.delete('barBoolean');
            (0, assert_1.strictEqual)(storage.get('bar', 'undefined'), 'undefined');
            (0, assert_1.strictEqual)(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            (0, assert_1.strictEqual)(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar', 'undefined'), 'undefined');
            (0, assert_1.strictEqual)(storage.get('barNumber', 'undefinedNumber'), 'undefinedNumber');
            (0, assert_1.strictEqual)(storage.get('barBoolean', 'undefinedBoolean'), 'undefinedBoolean');
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
        });
        test('Clear', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            await storage.close();
            const db = disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService));
            storage = disposables.add(new storage_1.Storage(db));
            await storage.init();
            await db.clear();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar'), undefined);
            (0, assert_1.strictEqual)(storage.get('barNumber'), undefined);
            (0, assert_1.strictEqual)(storage.get('barBoolean'), undefined);
            (0, assert_1.strictEqual)(storage.size, 0);
            (0, assert_1.strictEqual)(storage.items.size, 0);
        });
        test('Inserts and Deletes at the same time', async () => {
            let storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            storage.set('bar', 'foobar');
            const largeItem = JSON.stringify({ largeItem: 'Hello World'.repeat(1000) });
            storage.set('largeItem', largeItem);
            storage.delete('barNumber');
            storage.delete('barBoolean');
            await storage.close();
            storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            await storage.init();
            (0, assert_1.strictEqual)(storage.get('bar'), 'foobar');
            (0, assert_1.strictEqual)(storage.get('largeItem'), largeItem);
            (0, assert_1.strictEqual)(storage.get('barNumber'), undefined);
            (0, assert_1.strictEqual)(storage.get('barBoolean'), undefined);
        });
        test('Storage change event', async () => {
            const storage = disposables.add(new storage_1.Storage(disposables.add(await storageService_1.IndexedDBStorageDatabase.create({ id }, logService))));
            let storageChangeEvents = [];
            disposables.add(storage.onDidChangeStorage(e => storageChangeEvents.push(e)));
            await storage.init();
            storage.set('notExternal', 42);
            let storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'notExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
            storageChangeEvents = [];
            storage.set('isExternal', 42, true);
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'isExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, true);
            storage.delete('notExternal');
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'notExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, false);
            storage.delete('isExternal', true);
            storageValueChangeEvent = storageChangeEvents.find(e => e.key === 'isExternal');
            (0, assert_1.strictEqual)(storageValueChangeEvent?.external, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3N0b3JhZ2UvdGVzdC9icm93c2VyL3N0b3JhZ2VTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFvQmhHLEtBQUssVUFBVSxvQkFBb0I7UUFDbEMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7UUFFeEMsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUVqRSxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx1REFBMEIsRUFBRSxDQUFDLENBQUM7UUFDM0UsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRXhGLE1BQU0sWUFBWSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUU5RSxNQUFNLHdCQUF3QixHQUFHLElBQUEsb0JBQVEsRUFBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakUsTUFBTSxvQkFBb0IsR0FBcUI7WUFDOUMsRUFBRSxFQUFFLElBQUk7WUFDUixJQUFJLEVBQUUsVUFBVTtZQUNoQixTQUFTLEVBQUUsVUFBVTtZQUNyQixTQUFTLEVBQUUsS0FBSztZQUNoQixRQUFRLEVBQUUsd0JBQXdCO1lBQ2xDLGlCQUFp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