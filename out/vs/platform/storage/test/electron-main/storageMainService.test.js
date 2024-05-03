/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/state/node/stateService", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/test/electron-main/workbenchTestServices", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert_1, network_1, resources_1, uri_1, uuid_1, argv_1, environmentService_1, fileService_1, log_1, product_1, stateService_1, storage_1, storageMainService_1, telemetry_1, uriIdentityService_1, userDataProfile_1, workbenchTestServices_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StorageMainService', function () {
        const disposables = new lifecycle_1.DisposableStore();
        const productService = { _serviceBrand: undefined, ...product_1.default };
        const inMemoryProfileRoot = uri_1.URI.file('/location').with({ scheme: network_1.Schemas.inMemory });
        const inMemoryProfile = {
            id: 'id',
            name: 'inMemory',
            shortName: 'inMemory',
            isDefault: false,
            location: inMemoryProfileRoot,
            globalStorageHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'globalStorageHome'),
            settingsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'settingsResource'),
            keybindingsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'keybindingsResource'),
            tasksResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'tasksResource'),
            snippetsHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'snippetsHome'),
            extensionsResource: (0, resources_1.joinPath)(inMemoryProfileRoot, 'extensionsResource'),
            cacheHome: (0, resources_1.joinPath)(inMemoryProfileRoot, 'cache'),
        };
        class TestStorageMainService extends storageMainService_1.StorageMainService {
            getStorageOptions() {
                return {
                    useInMemoryStorage: true
                };
            }
        }
        async function testStorage(storage, scope) {
            (0, assert_1.strictEqual)(storage.isInMemory(), true);
            // Telemetry: added after init unless workspace/profile scoped
            if (scope === -1 /* StorageScope.APPLICATION */) {
                (0, assert_1.strictEqual)(storage.items.size, 0);
                await storage.init();
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.firstSessionDateStorageKey), 'string');
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.currentSessionDateStorageKey), 'string');
            }
            else {
                await storage.init();
            }
            let storageChangeEvent = undefined;
            disposables.add(storage.onDidChangeStorage(e => {
                storageChangeEvent = e;
            }));
            let storageDidClose = false;
            disposables.add(storage.onDidCloseStorage(() => storageDidClose = true));
            // Basic store/get/remove
            const size = storage.items.size;
            storage.set('bar', 'foo');
            (0, assert_1.strictEqual)(storageChangeEvent.key, 'bar');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.items.size, size + 3);
            storage.delete('bar');
            (0, assert_1.strictEqual)(storage.get('bar'), undefined);
            (0, assert_1.strictEqual)(storage.items.size, size + 2);
            // IS_NEW
            (0, assert_1.strictEqual)(storage.get(storage_1.IS_NEW_KEY), 'true');
            // Close
            await storage.close();
            (0, assert_1.strictEqual)(storageDidClose, true);
        }
        teardown(() => {
            disposables.clear();
        });
        function createStorageService(lifecycleMainService = new workbenchTestServices_1.TestLifecycleMainService()) {
            const environmentService = new environmentService_1.NativeEnvironmentService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService);
            const fileService = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const uriIdentityService = disposables.add(new uriIdentityService_1.UriIdentityService(fileService));
            const testStorageService = disposables.add(new TestStorageMainService(new log_1.NullLogService(), environmentService, disposables.add(new userDataProfile_1.UserDataProfilesMainService(disposables.add(new stateService_1.StateService(1 /* SaveStrategy.DELAYED */, environmentService, new log_1.NullLogService(), fileService)), disposables.add(uriIdentityService), environmentService, fileService, new log_1.NullLogService())), lifecycleMainService, fileService, uriIdentityService));
            disposables.add(testStorageService.applicationStorage);
            return testStorageService;
        }
        test('basics (application)', function () {
            const storageMainService = createStorageService();
            return testStorage(storageMainService.applicationStorage, -1 /* StorageScope.APPLICATION */);
        });
        test('basics (profile)', function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            return testStorage(storageMainService.profileStorage(profile), 0 /* StorageScope.PROFILE */);
        });
        test('basics (workspace)', function () {
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const storageMainService = createStorageService();
            return testStorage(storageMainService.workspaceStorage(workspace), 1 /* StorageScope.WORKSPACE */);
        });
        test('storage closed onWillShutdown', async function () {
            const lifecycleMainService = new workbenchTestServices_1.TestLifecycleMainService();
            const storageMainService = createStorageService(lifecycleMainService);
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationStorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationStorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            (0, assert_1.strictEqual)(applicationStorage, storageMainService.applicationStorage); // same instance as long as not closed
            (0, assert_1.strictEqual)(profileStorage, storageMainService.profileStorage(profile)); // same instance as long as not closed
            (0, assert_1.strictEqual)(workspaceStorage, storageMainService.workspaceStorage(workspace)); // same instance as long as not closed
            await applicationStorage.init();
            await profileStorage.init();
            await workspaceStorage.init();
            await lifecycleMainService.fireOnWillShutdown();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
            const profileStorage2 = storageMainService.profileStorage(profile);
            (0, assert_1.notStrictEqual)(profileStorage, profileStorage2);
            const workspaceStorage2 = storageMainService.workspaceStorage(workspace);
            (0, assert_1.notStrictEqual)(workspaceStorage, workspaceStorage2);
            await workspaceStorage2.close();
        });
        test('storage closed before init works', async function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationStorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationStorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            await applicationStorage.close();
            await profileStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
        test('storage closed before init awaits works', async function () {
            const storageMainService = createStorageService();
            const profile = inMemoryProfile;
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            disposables.add(workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            }));
            const profileStorage = storageMainService.profileStorage(profile);
            let didCloseProfileStorage = false;
            disposables.add(profileStorage.onDidCloseStorage(() => {
                didCloseProfileStorage = true;
            }));
            const applicationtorage = storageMainService.applicationStorage;
            let didCloseApplicationStorage = false;
            disposables.add(applicationtorage.onDidCloseStorage(() => {
                didCloseApplicationStorage = true;
            }));
            applicationtorage.init();
            profileStorage.init();
            workspaceStorage.init();
            await applicationtorage.close();
            await profileStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseApplicationStorage, true);
            (0, assert_1.strictEqual)(didCloseProfileStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW5TZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvdGVzdC9lbGVjdHJvbi1tYWluL3N0b3JhZ2VNYWluU2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMEJoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUU7UUFFM0IsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsTUFBTSxjQUFjLEdBQW9CLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxHQUFHLGlCQUFPLEVBQUUsQ0FBQztRQUVqRixNQUFNLG1CQUFtQixHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNyRixNQUFNLGVBQWUsR0FBcUI7WUFDekMsRUFBRSxFQUFFLElBQUk7WUFDUixJQUFJLEVBQUUsVUFBVTtZQUNoQixTQUFTLEVBQUUsVUFBVTtZQUNyQixTQUFTLEVBQUUsS0FBSztZQUNoQixRQUFRLEVBQUUsbUJBQW1CO1lBQzdCLGlCQUFpQixFQUFFLElBQUEsb0JBQVEsRUFBQyxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQztZQUNyRSxnQkFBZ0IsRUFBRSxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUM7WUFDbkUsbUJBQW1CLEVBQUUsSUFBQSxvQkFBUSxFQUFDLG1CQUFtQixFQUFFLHFCQUFxQixDQUFDO1lBQ3pFLGFBQWEsRUFBRSxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsZUFBZSxDQUFDO1lBQzdELFlBQVksRUFBRSxJQUFBLG9CQUFRLEVBQUMsbUJBQW1CLEVBQUUsY0FBYyxD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