/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "sinon", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/platform/secrets/common/secrets", "vs/platform/storage/common/storage"], function (require, exports, assert, sinon, utils_1, log_1, secrets_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestEncryptionService {
        constructor() {
            this.encryptedPrefix = 'encrypted+'; // prefix to simulate encryption
        }
        setUsePlainTextEncryption() {
            return Promise.resolve();
        }
        getKeyStorageProvider() {
            return Promise.resolve("basic_text" /* KnownStorageProvider.basicText */);
        }
        encrypt(value) {
            return Promise.resolve(this.encryptedPrefix + value);
        }
        decrypt(value) {
            return Promise.resolve(value.substring(this.encryptedPrefix.length));
        }
        isEncryptionAvailable() {
            return Promise.resolve(true);
        }
    }
    class TestNoEncryptionService {
        setUsePlainTextEncryption() {
            throw new Error('Method not implemented.');
        }
        getKeyStorageProvider() {
            throw new Error('Method not implemented.');
        }
        encrypt(value) {
            throw new Error('Method not implemented.');
        }
        decrypt(value) {
            throw new Error('Method not implemented.');
        }
        isEncryptionAvailable() {
            return Promise.resolve(false);
        }
    }
    suite('secrets', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('BaseSecretStorageService useInMemoryStorage=true', () => {
            let service;
            let spyEncryptionService;
            let sandbox;
            setup(() => {
                sandbox = sinon.createSandbox();
                spyEncryptionService = sandbox.spy(new TestEncryptionService());
                service = store.add(new secrets_1.BaseSecretStorageService(true, store.add(new storage_1.InMemoryStorageService()), spyEncryptionService, store.add(new log_1.NullLogService())));
            });
            teardown(() => {
                sandbox.restore();
            });
            test('type', async () => {
                assert.strictEqual(service.type, 'unknown');
                // trigger lazy initialization
                await service.set('my-secret', 'my-secret-value');
                assert.strictEqual(service.type, 'in-memory');
            });
            test('set and get', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                await service.set(key, value);
                const result = await service.get(key);
                assert.strictEqual(result, value);
                // Additionally ensure the encryptionservice was not used
                assert.strictEqual(spyEncryptionService.encrypt.callCount, 0);
                assert.strictEqual(spyEncryptionService.decrypt.callCount, 0);
            });
            test('delete', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                await service.set(key, value);
                await service.delete(key);
                const result = await service.get(key);
                assert.strictEqual(result, undefined);
            });
            test('onDidChangeSecret', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                let eventFired = false;
                store.add(service.onDidChangeSecret((changedKey) => {
                    assert.strictEqual(changedKey, key);
                    eventFired = true;
                }));
                await service.set(key, value);
                assert.strictEqual(eventFired, true);
            });
        });
        suite('BaseSecretStorageService useInMemoryStorage=false', () => {
            let service;
            let spyEncryptionService;
            let sandbox;
            setup(() => {
                sandbox = sinon.createSandbox();
                spyEncryptionService = sandbox.spy(new TestEncryptionService());
                service = store.add(new secrets_1.BaseSecretStorageService(false, store.add(new storage_1.InMemoryStorageService()), spyEncryptionService, store.add(new log_1.NullLogService())));
            });
            teardown(() => {
                sandbox.restore();
            });
            test('type', async () => {
                assert.strictEqual(service.type, 'unknown');
                // trigger lazy initialization
                await service.set('my-secret', 'my-secret-value');
                assert.strictEqual(service.type, 'persisted');
            });
            test('set and get', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                await service.set(key, value);
                const result = await service.get(key);
                assert.strictEqual(result, value);
                // Additionally ensure the encryptionservice was not used
                assert.strictEqual(spyEncryptionService.encrypt.callCount, 1);
                assert.strictEqual(spyEncryptionService.decrypt.callCount, 1);
            });
            test('delete', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                await service.set(key, value);
                await service.delete(key);
                const result = await service.get(key);
                assert.strictEqual(result, undefined);
            });
            test('onDidChangeSecret', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                let eventFired = false;
                store.add(service.onDidChangeSecret((changedKey) => {
                    assert.strictEqual(changedKey, key);
                    eventFired = true;
                }));
                await service.set(key, value);
                assert.strictEqual(eventFired, true);
            });
        });
        suite('BaseSecretStorageService useInMemoryStorage=false, encryption not available', () => {
            let service;
            let spyNoEncryptionService;
            let sandbox;
            setup(() => {
                sandbox = sinon.createSandbox();
                spyNoEncryptionService = sandbox.spy(new TestNoEncryptionService());
                service = store.add(new secrets_1.BaseSecretStorageService(false, store.add(new storage_1.InMemoryStorageService()), spyNoEncryptionService, store.add(new log_1.NullLogService())));
            });
            teardown(() => {
                sandbox.restore();
            });
            test('type', async () => {
                assert.strictEqual(service.type, 'unknown');
                // trigger lazy initialization
                await service.set('my-secret', 'my-secret-value');
                assert.strictEqual(service.type, 'in-memory');
            });
            test('set and get', async () => {
                const key = 'my-secret';
                const value = 'my-secret-value';
                await service.set(key, value);
                const result = await service.get(key);
                assert.strictEqual(result, value);
                // Additionally ensure the encryptionservice was not used
                assert.strictEqual(spyNoEncryptionService.encrypt.callCount, 0);
                assert.strictEqual(spyNoEncryptionService.decrypt.callCount, 0);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zZWNyZXRzL3Rlc3QvY29tbW9uL3NlY3JldHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxNQUFNLHFCQUFxQjtRQUEzQjtZQUVTLG9CQUFlLEdBQUcsWUFBWSxDQUFDLENBQUMsZ0NBQWdDO1FBZ0J6RSxDQUFDO1FBZkEseUJBQXlCO1lBQ3hCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFDRCxxQkFBcUI7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxtREFBZ0MsQ0FBQztRQUN4RCxDQUFDO1FBQ0QsT0FBTyxDQUFDLEtBQWE7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUNELE9BQU8sQ0FBQyxLQUFhO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBQ0QscUJBQXFCO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDO0tBQ0Q7SUFFRCxNQUFNLHVCQUF1QjtRQUU1Qix5QkFBeUI7WUFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxxQkFBcUI7WUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxPQUFPLENBQUMsS0FBYTtZQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5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