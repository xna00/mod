/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/base/parts/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfile", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils"], function (require, exports, assert, event_1, uri_1, storage_1, userDataProfileStorageService_1, storage_2, userDataProfile_1, timeTravelScheduler_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUserDataProfileStorageService = void 0;
    class TestStorageDatabase extends storage_1.InMemoryStorageDatabase {
        constructor() {
            super(...arguments);
            this._onDidChangeItemsExternal = new event_1.Emitter();
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
        }
        async updateItems(request) {
            await super.updateItems(request);
            if (request.insert || request.delete) {
                this._onDidChangeItemsExternal.fire({ changed: request.insert, deleted: request.delete });
            }
        }
    }
    class TestUserDataProfileStorageService extends userDataProfileStorageService_1.AbstractUserDataProfileStorageService {
        constructor() {
            super(...arguments);
            this.onDidChange = event_1.Event.None;
            this.databases = new Map();
        }
        async createStorageDatabase(profile) {
            let database = this.databases.get(profile.id);
            if (!database) {
                this.databases.set(profile.id, database = new TestStorageDatabase());
            }
            return database;
        }
        setupStorageDatabase(profile) {
            return this.createStorageDatabase(profile);
        }
        async closeAndDispose() { }
    }
    exports.TestUserDataProfileStorageService = TestUserDataProfileStorageService;
    suite('ProfileStorageService', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const profile = (0, userDataProfile_1.toUserDataProfile)('test', 'test', uri_1.URI.file('foo'), uri_1.URI.file('cache'));
        let testObject;
        let storage;
        setup(async () => {
            testObject = disposables.add(new TestUserDataProfileStorageService(disposables.add(new storage_2.InMemoryStorageService())));
            storage = disposables.add(new storage_1.Storage(await testObject.setupStorageDatabase(profile)));
            await storage.init();
        });
        test('read empty storage', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const actual = await testObject.readStorageData(profile);
            assert.strictEqual(actual.size, 0);
        }));
        test('read storage with data', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */ }));
            await storage.flush();
            const actual = await testObject.readStorageData(profile);
            assert.strictEqual(actual.size, 1);
            assert.deepStrictEqual(actual.get('foo'), { 'value': 'bar', 'target': 0 /* StorageTarget.USER */ });
        }));
        test('write in empty storage', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            const data = new Map();
            data.set('foo', 'bar');
            await testObject.updateStorageData(profile, data, 0 /* StorageTarget.USER */);
            assert.strictEqual(storage.items.size, 2);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { foo: 0 /* StorageTarget.USER */ });
            assert.strictEqual(storage.get('foo'), 'bar');
        }));
        test('write in storage with data', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */ }));
            await storage.flush();
            const data = new Map();
            data.set('abc', 'xyz');
            await testObject.updateStorageData(profile, data, 1 /* StorageTarget.MACHINE */);
            assert.strictEqual(storage.items.size, 3);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { foo: 0 /* StorageTarget.USER */, abc: 1 /* StorageTarget.MACHINE */ });
            assert.strictEqual(storage.get('foo'), 'bar');
            assert.strictEqual(storage.get('abc'), 'xyz');
        }));
        test('write in storage with data (insert, update, remove)', () => (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
            storage.set('foo', 'bar');
            storage.set('abc', 'xyz');
            storage.set(storage_2.TARGET_KEY, JSON.stringify({ foo: 0 /* StorageTarget.USER */, abc: 1 /* StorageTarget.MACHINE */ }));
            await storage.flush();
            const data = new Map();
            data.set('foo', undefined);
            data.set('abc', 'def');
            data.set('var', 'const');
            await testObject.updateStorageData(profile, data, 0 /* StorageTarget.USER */);
            assert.strictEqual(storage.items.size, 3);
            assert.deepStrictEqual((0, storage_2.loadKeyTargets)(storage), { abc: 0 /* StorageTarget.USER */, var: 0 /* StorageTarget.USER */ });
            assert.strictEqual(storage.get('abc'), 'def');
            assert.strictEqual(storage.get('var'), 'const');
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFQcm9maWxlL3Rlc3QvY29tbW9uL3VzZXJEYXRhUHJvZmlsZVN0b3JhZ2VTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQU0sbUJBQW9CLFNBQVEsaUNBQXVCO1FBQXpEOztZQUVrQiw4QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBNEIsQ0FBQztZQUNuRSw2QkFBd0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1FBUW5GLENBQUM7UUFOUyxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXVCO1lBQ2pELE1BQU0sS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqQyxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzNGLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFFRCxNQUFhLGlDQUFrQyxTQUFRLHFFQUFxQztRQUE1Rjs7WUFFVSxnQkFBVyxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFDMUIsY0FBUyxHQUFHLElBQUksR0FBRyxFQUFtQyxDQUFDO1FBZWhFLENBQUM7UUFiVSxLQUFLLENBQUMscUJBQXFCLENBQUMsT0FBeUI7WUFDOUQsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxD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