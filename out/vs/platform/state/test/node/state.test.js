/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/common/utils", "vs/base/test/node/testUtils", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/log/common/log", "vs/platform/state/node/stateService"], function (require, exports, assert, fs_1, os_1, lifecycle_1, network_1, path_1, uri_1, pfs_1, utils_1, testUtils_1, fileService_1, diskFileSystemProvider_1, log_1, stateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('StateService', () => {
        let testDir;
        let fileService;
        let logService;
        let diskFileSystemProvider;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'statemainservice');
            logService = new log_1.NullLogService();
            fileService = disposables.add(new fileService_1.FileService(logService));
            diskFileSystemProvider = disposables.add(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            disposables.add(fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider));
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            disposables.clear();
            return pfs_1.Promises.rm(testDir);
        });
        test('Basics (delayed strategy)', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            await service.init();
            service.setItem('some.key', 'some.value');
            assert.strictEqual(service.getItem('some.key'), 'some.value');
            service.removeItem('some.key');
            assert.strictEqual(service.getItem('some.key', 'some.default'), 'some.default');
            assert.ok(!service.getItem('some.unknonw.key'));
            service.setItem('some.other.key', 'some.other.value');
            await service.close();
            service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            await service.init();
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.other.key', 'some.other.value');
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.undefined.key', undefined);
            assert.strictEqual(service.getItem('some.undefined.key', 'some.default'), 'some.default');
            service.setItem('some.null.key', null);
            assert.strictEqual(service.getItem('some.null.key', 'some.default'), 'some.default');
            service.setItems([
                { key: 'some.setItems.key1', data: 'some.value' },
                { key: 'some.setItems.key2', data: 0 },
                { key: 'some.setItems.key3', data: true },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), 'some.value');
            assert.strictEqual(service.getItem('some.setItems.key2'), 0);
            assert.strictEqual(service.getItem('some.setItems.key3'), true);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
            service.setItems([
                { key: 'some.setItems.key1', data: undefined },
                { key: 'some.setItems.key2', data: undefined },
                { key: 'some.setItems.key3', data: undefined },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key2'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key3'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
            return service.close();
        });
        test('Basics (immediate strategy)', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 0 /* SaveStrategy.IMMEDIATE */, logService, fileService));
            await service.init();
            service.setItem('some.key', 'some.value');
            assert.strictEqual(service.getItem('some.key'), 'some.value');
            service.removeItem('some.key');
            assert.strictEqual(service.getItem('some.key', 'some.default'), 'some.default');
            assert.ok(!service.getItem('some.unknonw.key'));
            service.setItem('some.other.key', 'some.other.value');
            await service.close();
            service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 0 /* SaveStrategy.IMMEDIATE */, logService, fileService));
            await service.init();
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.other.key', 'some.other.value');
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.undefined.key', undefined);
            assert.strictEqual(service.getItem('some.undefined.key', 'some.default'), 'some.default');
            service.setItem('some.null.key', null);
            assert.strictEqual(service.getItem('some.null.key', 'some.default'), 'some.default');
            service.setItems([
                { key: 'some.setItems.key1', data: 'some.value' },
                { key: 'some.setItems.key2', data: 0 },
                { key: 'some.setItems.key3', data: true },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), 'some.value');
            assert.strictEqual(service.getItem('some.setItems.key2'), 0);
            assert.strictEqual(service.getItem('some.setItems.key3'), true);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
            service.setItems([
                { key: 'some.setItems.key1', data: undefined },
                { key: 'some.setItems.key2', data: undefined },
                { key: 'some.setItems.key3', data: undefined },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key2'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key3'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
            return service.close();
        });
        test('Multiple ops are buffered and applied', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            await service.init();
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            service.removeItem('some.key4');
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            await service.close();
            service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            await service.init();
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            return service.close();
        });
        test('Multiple ops (Immediate Strategy)', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 0 /* SaveStrategy.IMMEDIATE */, logService, fileService));
            await service.init();
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            service.removeItem('some.key4');
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            await service.close();
            service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 0 /* SaveStrategy.IMMEDIATE */, logService, fileService));
            await service.init();
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            return service.close();
        });
        test('Used before init', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            const service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            service.removeItem('some.key4');
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            await service.init();
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            return service.close();
        });
        test('Used after close', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            const service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            await service.init();
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            await service.close();
            service.setItem('some.key5', 'some.marker');
            const contents = (0, fs_1.readFileSync)(storageFile).toString();
            assert.ok(contents.includes('some.value1'));
            assert.ok(!contents.includes('some.marker'));
            return service.close();
        });
        test('Closed before init', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            const service = disposables.add(new stateService_1.FileStorage(uri_1.URI.file(storageFile), 1 /* SaveStrategy.DELAYED */, logService, fileService));
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            await service.close();
            const contents = (0, fs_1.readFileSync)(storageFile).toString();
            assert.strictEqual(contents.length, 0);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RhdGUvdGVzdC9ub2RlL3N0YXRlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLElBQUEsc0JBQVUsRUFBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBRS9CLElBQUksT0FBZSxDQUFDO1FBQ3BCLElBQUksV0FBeUIsQ0FBQztRQUM5QixJQUFJLFVBQXVCLENBQUM7UUFDNUIsSUFBSSxzQkFBOEMsQ0FBQztRQUVuRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsT0FBTyxHQUFHLElBQUEsNkJBQWlCLEVBQUMsSUFBQSxXQUFNLEdBQUUsRUFBRSxVQUFVLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUV0RSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7WUFFbEMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSx5QkFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDM0Qsc0JBQXNCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLCtDQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDakYsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBRXBGLE9BQU8sY0FBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxF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