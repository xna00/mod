/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/indexedDB", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/test/common/testUtils", "vs/platform/files/browser/indexedDBFileSystemProvider", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/log/common/log"], function (require, exports, assert, indexedDB_1, buffer_1, lifecycle_1, network_1, resources_1, uri_1, testUtils_1, indexedDBFileSystemProvider_1, files_1, fileService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('IndexedDBFileSystemProvider', function () {
        let service;
        let userdataFileProvider;
        const testDir = '/';
        const userdataURIFromPaths = (paths) => (0, resources_1.joinPath)(uri_1.URI.from({ scheme: network_1.Schemas.vscodeUserData, path: testDir }), ...paths);
        const disposables = new lifecycle_1.DisposableStore();
        const initFixtures = async () => {
            await Promise.all([['fixtures', 'resolver', 'examples'],
                ['fixtures', 'resolver', 'other', 'deep'],
                ['fixtures', 'service', 'deep'],
                ['batched']]
                .map(path => userdataURIFromPaths(path))
                .map(uri => service.createFolder(uri)));
            await Promise.all([
                [['fixtures', 'resolver', 'examples', 'company.js'], 'class company {}'],
                [['fixtures', 'resolver', 'examples', 'conway.js'], 'export function conway() {}'],
                [['fixtures', 'resolver', 'examples', 'employee.js'], 'export const employee = "jax"'],
                [['fixtures', 'resolver', 'examples', 'small.js'], ''],
                [['fixtures', 'resolver', 'other', 'deep', 'company.js'], 'class company {}'],
                [['fixtures', 'resolver', 'other', 'deep', 'conway.js'], 'export function conway() {}'],
                [['fixtures', 'resolver', 'other', 'deep', 'employee.js'], 'export const employee = "jax"'],
                [['fixtures', 'resolver', 'other', 'deep', 'small.js'], ''],
                [['fixtures', 'resolver', 'index.html'], '<p>p</p>'],
                [['fixtures', 'resolver', 'site.css'], '.p {color: red;}'],
                [['fixtures', 'service', 'deep', 'company.js'], 'class company {}'],
                [['fixtures', 'service', 'deep', 'conway.js'], 'export function conway() {}'],
                [['fixtures', 'service', 'deep', 'employee.js'], 'export const employee = "jax"'],
                [['fixtures', 'service', 'deep', 'small.js'], ''],
                [['fixtures', 'service', 'binary.txt'], '<p>p</p>'],
            ]
                .map(([path, contents]) => [userdataURIFromPaths(path), contents])
                .map(([uri, contents]) => service.createFile(uri, buffer_1.VSBuffer.fromString(contents))));
        };
        const reload = async () => {
            const logService = new log_1.NullLogService();
            service = new fileService_1.FileService(logService);
            disposables.add(service);
            const indexedDB = await indexedDB_1.IndexedDB.create('vscode-web-db-test', 1, ['vscode-userdata-store', 'vscode-logs-store']);
            userdataFileProvider = new indexedDBFileSystemProvider_1.IndexedDBFileSystemProvider(network_1.Schemas.vscodeUserData, indexedDB, 'vscode-userdata-store', true);
            disposables.add(service.registerProvider(network_1.Schemas.vscodeUserData, userdataFileProvider));
            disposables.add(userdataFileProvider);
        };
        setup(async function () {
            this.timeout(15000);
            await reload();
        });
        teardown(async () => {
            await userdataFileProvider.reset();
            disposables.clear();
        });
        test('root is always present', async () => {
            assert.strictEqual((await userdataFileProvider.stat(userdataURIFromPaths([]))).type, files_1.FileType.Directory);
            await userdataFileProvider.delete(userdataURIFromPaths([]), { recursive: true, useTrash: false, atomic: false });
            assert.strictEqual((await userdataFileProvider.stat(userdataURIFromPaths([]))).type, files_1.FileType.Directory);
        });
        test('createFolder', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const parent = await service.resolve(userdataURIFromPaths([]));
            const newFolderResource = (0, resources_1.joinPath)(parent.resource, 'newFolder');
            assert.strictEqual((await userdataFileProvider.readdir(parent.resource)).length, 0);
            const newFolder = await service.createFolder(newFolderResource);
            assert.strictEqual(newFolder.name, 'newFolder');
            assert.strictEqual((await userdataFileProvider.readdir(parent.resource)).length, 1);
            assert.strictEqual((await userdataFileProvider.stat(newFolderResource)).type, files_1.FileType.Directory);
            assert.ok(event);
            assert.strictEqual(event.resource.path, newFolderResource.path);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.path, newFolderResource.path);
            assert.strictEqual(event.target.isDirectory, true);
        });
        test('createFolder: creating multiple folders at once', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const parent = await service.resolve(userdataURIFromPaths([]));
            const newFolderResource = (0, resources_1.joinPath)(parent.resource, ...multiFolderPaths);
            const newFolder = await service.createFolder(newFolderResource);
            const lastFolderName = multiFolderPaths[multiFolderPaths.length - 1];
            assert.strictEqual(newFolder.name, lastFolderName);
            assert.strictEqual((await userdataFileProvider.stat(newFolderResource)).type, files_1.FileType.Directory);
            assert.ok(event);
            assert.strictEqual(event.resource.path, newFolderResource.path);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.path, newFolderResource.path);
            assert.strictEqual(event.target.isDirectory, true);
        });
        test('exists', async () => {
            let exists = await service.exists(userdataURIFromPaths([]));
            assert.strictEqual(exists, true);
            exists = await service.exists(userdataURIFromPaths(['hello']));
            assert.strictEqual(exists, false);
        });
        test('resolve - file', async () => {
            await initFixtures();
            const resource = userdataURIFromPaths(['fixtures', 'resolver', 'index.html']);
            const resolved = await service.resolve(resource);
            assert.strictEqual(resolved.name, 'index.html');
            assert.strictEqual(resolved.isFile, true);
            assert.strictEqual(resolved.isDirectory, false);
            assert.strictEqual(resolved.isSymbolicLink, false);
            assert.strictEqual(resolved.resource.toString(), resource.toString());
            assert.strictEqual(resolved.children, undefined);
            assert.ok(resolved.size > 0);
        });
        test('resolve - directory', async () => {
            await initFixtures();
            const testsElements = ['examples', 'other', 'index.html', 'site.css'];
            const resource = userdataURIFromPaths(['fixtures', 'resolver']);
            const result = await service.resolve(resource);
            assert.ok(result);
            assert.strictEqual(result.resource.toString(), resource.toString());
            assert.strictEqual(result.name, 'resolver');
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            assert.strictEqual(result.children.length, testsElements.length);
            assert.ok(result.children.every(entry => {
                return testsElements.some(name => {
                    return (0, resources_1.basename)(entry.resource) === name;
                });
            }));
            result.children.forEach(value => {
                assert.ok((0, resources_1.basename)(value.resource));
                if (['examples', 'other'].indexOf((0, resources_1.basename)(value.resource)) >= 0) {
                    assert.ok(value.isDirectory);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else if ((0, resources_1.basename)(value.resource) === 'index.html') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else if ((0, resources_1.basename)(value.resource) === 'site.css') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else {
                    assert.ok(!'Unexpected value ' + (0, resources_1.basename)(value.resource));
                }
            });
        });
        test('createFile', async () => {
            return assertCreateFile(contents => buffer_1.VSBuffer.fromString(contents));
        });
        test('createFile (readable)', async () => {
            return assertCreateFile(contents => (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents)));
        });
        test('createFile (stream)', async () => {
            return assertCreateFile(contents => (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(contents)));
        });
        async function assertCreateFile(converter) {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const contents = 'Hello World';
            const resource = userdataURIFromPaths(['test.txt']);
            assert.strictEqual(await service.canCreateFile(resource), true);
            const fileStat = await service.createFile(resource, converter(contents));
            assert.strictEqual(fileStat.name, 'test.txt');
            assert.strictEqual((await userdataFileProvider.stat(fileStat.resource)).type, files_1.FileType.File);
            assert.strictEqual(new TextDecoder().decode(await userdataFileProvider.readFile(fileStat.resource)), contents);
            assert.ok(event);
            assert.strictEqual(event.resource.path, resource.path);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.path, resource.path);
        }
        const fileCreateBatchTester = (size, name) => {
            const batch = Array.from({ length: size }).map((_, i) => ({ contents: `Hello${i}`, resource: userdataURIFromPaths(['batched', name, `Hello${i}.txt`]) }));
            let creationPromises = undefined;
            return {
                async create() {
                    return creationPromises = Promise.all(batch.map(entry => userdataFileProvider.writeFile(entry.resource, buffer_1.VSBuffer.fromString(entry.contents).buffer, { create: true, overwrite: true, unlock: false, atomic: false })));
                },
                async assertContentsCorrect() {
                    if (!creationPromises) {
                        throw Error('read called before create');
                    }
                    await creationPromises;
                    await Promise.all(batch.map(async (entry, i) => {
                        assert.strictEqual((await userdataFileProvider.stat(entry.resource)).type, files_1.FileType.File);
                        assert.strictEqual(new TextDecoder().decode(await userdataFileProvider.readFile(entry.resource)), entry.contents);
                    }));
                }
            };
        };
        test('createFile - batch', async () => {
            const tester = fileCreateBatchTester(20, 'batch');
            await tester.create();
            await tester.assertContentsCorrect();
        });
        test('createFile - batch (mixed parallel/sequential)', async () => {
            const batch1 = fileCreateBatchTester(1, 'batch1');
            const batch2 = fileCreateBatchTester(20, 'batch2');
            const batch3 = fileCreateBatchTester(1, 'batch3');
            const batch4 = fileCreateBatchTester(20, 'batch4');
            batch1.create();
            batch2.create();
            await Promise.all([batch1.assertContentsCorrect(), batch2.assertContentsCorrect()]);
            batch3.create();
            batch4.create();
            await Promise.all([batch3.assertContentsCorrect(), batch4.assertContentsCorrect()]);
            await Promise.all([batch1.assertContentsCorrect(), batch2.assertContentsCorrect()]);
        });
        test('rename not existing resource', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFile = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            const targetFile = (0, resources_1.joinPath)(parent.resource, 'targetFile');
            try {
                await service.move(sourceFile, targetFile, false);
            }
            catch (error) {
                assert.deepStrictEqual(error.code, files_1.FileSystemProviderErrorCode.FileNotFound);
                return;
            }
            assert.fail('This should fail with error');
        });
        test('rename to an existing file without overwrite', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFile = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            await service.writeFile(sourceFile, buffer_1.VSBuffer.fromString('This is source file'));
            const targetFile = (0, resources_1.joinPath)(parent.resource, 'targetFile');
            await service.writeFile(targetFile, buffer_1.VSBuffer.fromString('This is target file'));
            try {
                await service.move(sourceFile, targetFile, false);
            }
            catch (error) {
                assert.deepStrictEqual(error.fileOperationResult, 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                return;
            }
            assert.fail('This should fail with error');
        });
        test('rename folder to an existing folder without overwrite', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFolder');
            await service.createFolder(sourceFolder);
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            await service.createFolder(targetFolder);
            try {
                await service.move(sourceFolder, targetFolder, false);
            }
            catch (error) {
                assert.deepStrictEqual(error.fileOperationResult, 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                return;
            }
            assert.fail('This should fail with cannot overwrite error');
        });
        test('rename file to a folder', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFile = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            await service.writeFile(sourceFile, buffer_1.VSBuffer.fromString('This is source file'));
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            await service.createFolder(targetFolder);
            try {
                await service.move(sourceFile, targetFolder, false);
            }
            catch (error) {
                assert.deepStrictEqual(error.fileOperationResult, 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                return;
            }
            assert.fail('This should fail with error');
        });
        test('rename folder to a file', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            await service.createFolder(sourceFolder);
            const targetFile = (0, resources_1.joinPath)(parent.resource, 'targetFile');
            await service.writeFile(targetFile, buffer_1.VSBuffer.fromString('This is target file'));
            try {
                await service.move(sourceFolder, targetFile, false);
            }
            catch (error) {
                assert.deepStrictEqual(error.fileOperationResult, 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                return;
            }
            assert.fail('This should fail with error');
        });
        test('rename file', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFile = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            await service.writeFile(sourceFile, buffer_1.VSBuffer.fromString('This is source file'));
            const targetFile = (0, resources_1.joinPath)(parent.resource, 'targetFile');
            await service.move(sourceFile, targetFile, false);
            const content = await service.readFile(targetFile);
            assert.strictEqual(await service.exists(sourceFile), false);
            assert.strictEqual(content.value.toString(), 'This is source file');
        });
        test('rename to an existing file with overwrite', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFile = (0, resources_1.joinPath)(parent.resource, 'sourceFile');
            const targetFile = (0, resources_1.joinPath)(parent.resource, 'targetFile');
            await Promise.all([
                service.writeFile(sourceFile, buffer_1.VSBuffer.fromString('This is source file')),
                service.writeFile(targetFile, buffer_1.VSBuffer.fromString('This is target file'))
            ]);
            await service.move(sourceFile, targetFile, true);
            const content = await service.readFile(targetFile);
            assert.strictEqual(await service.exists(sourceFile), false);
            assert.strictEqual(content.value.toString(), 'This is source file');
        });
        test('rename folder to a new folder', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFolder');
            await service.createFolder(sourceFolder);
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            await service.move(sourceFolder, targetFolder, false);
            assert.deepStrictEqual(await service.exists(sourceFolder), false);
            assert.deepStrictEqual(await service.exists(targetFolder), true);
        });
        test('rename folder to an existing folder', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFolder');
            await service.createFolder(sourceFolder);
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            await service.createFolder(targetFolder);
            await service.move(sourceFolder, targetFolder, true);
            assert.deepStrictEqual(await service.exists(sourceFolder), false);
            assert.deepStrictEqual(await service.exists(targetFolder), true);
        });
        test('rename a folder that has multiple files and folders', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFolder');
            const sourceFile1 = (0, resources_1.joinPath)(sourceFolder, 'folder1', 'file1');
            const sourceFile2 = (0, resources_1.joinPath)(sourceFolder, 'folder2', 'file1');
            const sourceEmptyFolder = (0, resources_1.joinPath)(sourceFolder, 'folder3');
            await Promise.all([
                service.writeFile(sourceFile1, buffer_1.VSBuffer.fromString('Source File 1')),
                service.writeFile(sourceFile2, buffer_1.VSBuffer.fromString('Source File 2')),
                service.createFolder(sourceEmptyFolder)
            ]);
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            const targetFile1 = (0, resources_1.joinPath)(targetFolder, 'folder1', 'file1');
            const targetFile2 = (0, resources_1.joinPath)(targetFolder, 'folder2', 'file1');
            const targetEmptyFolder = (0, resources_1.joinPath)(targetFolder, 'folder3');
            await service.move(sourceFolder, targetFolder, false);
            assert.deepStrictEqual(await service.exists(sourceFolder), false);
            assert.deepStrictEqual(await service.exists(targetFolder), true);
            assert.strictEqual((await service.readFile(targetFile1)).value.toString(), 'Source File 1');
            assert.strictEqual((await service.readFile(targetFile2)).value.toString(), 'Source File 2');
            assert.deepStrictEqual(await service.exists(targetEmptyFolder), true);
        });
        test('rename a folder to another folder that has some files', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const sourceFolder = (0, resources_1.joinPath)(parent.resource, 'sourceFolder');
            const sourceFile1 = (0, resources_1.joinPath)(sourceFolder, 'folder1', 'file1');
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            const targetFile1 = (0, resources_1.joinPath)(targetFolder, 'folder1', 'file1');
            const targetFile2 = (0, resources_1.joinPath)(targetFolder, 'folder1', 'file2');
            const targetFile3 = (0, resources_1.joinPath)(targetFolder, 'folder2', 'file1');
            await Promise.all([
                service.writeFile(sourceFile1, buffer_1.VSBuffer.fromString('Source File 1')),
                service.writeFile(targetFile2, buffer_1.VSBuffer.fromString('Target File 2')),
                service.writeFile(targetFile3, buffer_1.VSBuffer.fromString('Target File 3'))
            ]);
            await service.move(sourceFolder, targetFolder, true);
            assert.deepStrictEqual(await service.exists(sourceFolder), false);
            assert.deepStrictEqual(await service.exists(targetFolder), true);
            assert.strictEqual((await service.readFile(targetFile1)).value.toString(), 'Source File 1');
            assert.strictEqual(await service.exists(targetFile2), false);
            assert.strictEqual(await service.exists(targetFile3), false);
        });
        test('deleteFile', async () => {
            await initFixtures();
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const anotherResource = userdataURIFromPaths(['fixtures', 'service', 'deep', 'company.js']);
            const resource = userdataURIFromPaths(['fixtures', 'service', 'deep', 'conway.js']);
            const source = await service.resolve(resource);
            assert.strictEqual(await service.canDelete(source.resource, { useTrash: false }), true);
            await service.del(source.resource, { useTrash: false });
            assert.strictEqual(await service.exists(source.resource), false);
            assert.strictEqual(await service.exists(anotherResource), true);
            assert.ok(event);
            assert.strictEqual(event.resource.path, resource.path);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
            {
                let error = undefined;
                try {
                    await service.del(source.resource, { useTrash: false });
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
                assert.strictEqual(error.fileOperationResult, 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            await reload();
            {
                let error = undefined;
                try {
                    await service.del(source.resource, { useTrash: false });
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
                assert.strictEqual(error.fileOperationResult, 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
        });
        test('deleteFolder (recursive)', async () => {
            await initFixtures();
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const resource = userdataURIFromPaths(['fixtures', 'service', 'deep']);
            const subResource1 = userdataURIFromPaths(['fixtures', 'service', 'deep', 'company.js']);
            const subResource2 = userdataURIFromPaths(['fixtures', 'service', 'deep', 'conway.js']);
            assert.strictEqual(await service.exists(subResource1), true);
            assert.strictEqual(await service.exists(subResource2), true);
            const source = await service.resolve(resource);
            assert.strictEqual(await service.canDelete(source.resource, { recursive: true, useTrash: false }), true);
            await service.del(source.resource, { recursive: true, useTrash: false });
            assert.strictEqual(await service.exists(source.resource), false);
            assert.strictEqual(await service.exists(subResource1), false);
            assert.strictEqual(await service.exists(subResource2), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
        });
        test('deleteFolder (non recursive)', async () => {
            await initFixtures();
            const resource = userdataURIFromPaths(['fixtures', 'service', 'deep']);
            const source = await service.resolve(resource);
            assert.ok((await service.canDelete(source.resource)) instanceof Error);
            let error;
            try {
                await service.del(source.resource);
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
        });
        test('delete empty folder', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const folder = (0, resources_1.joinPath)(parent.resource, 'folder');
            await service.createFolder(folder);
            await service.del(folder);
            assert.deepStrictEqual(await service.exists(folder), false);
        });
        test('delete empty folder with reccursive', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const folder = (0, resources_1.joinPath)(parent.resource, 'folder');
            await service.createFolder(folder);
            await service.del(folder, { recursive: true });
            assert.deepStrictEqual(await service.exists(folder), false);
        });
        test('deleteFolder with folders and files (recursive)', async () => {
            const parent = await service.resolve(userdataURIFromPaths([]));
            const targetFolder = (0, resources_1.joinPath)(parent.resource, 'targetFolder');
            const file1 = (0, resources_1.joinPath)(targetFolder, 'folder1', 'file1');
            await service.createFile(file1);
            const file2 = (0, resources_1.joinPath)(targetFolder, 'folder2', 'file1');
            await service.createFile(file2);
            const emptyFolder = (0, resources_1.joinPath)(targetFolder, 'folder3');
            await service.createFolder(emptyFolder);
            await service.del(targetFolder, { recursive: true });
            assert.deepStrictEqual(await service.exists(targetFolder), false);
            assert.deepStrictEqual(await service.exists((0, resources_1.joinPath)(targetFolder, 'folder1')), false);
            assert.deepStrictEqual(await service.exists((0, resources_1.joinPath)(targetFolder, 'folder2')), false);
            assert.deepStrictEqual(await service.exists(file1), false);
            assert.deepStrictEqual(await service.exists(file2), false);
            assert.deepStrictEqual(await service.exists(emptyFolder), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCRmlsZVNlcnZpY2UuaW50ZWdyYXRpb25UZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy90ZXN0L2Jyb3dzZXIvaW5kZXhlZERCRmlsZVNlcnZpY2UuaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLElBQUEsc0JBQVUsRUFBQyw2QkFBNkIsRUFBRTtRQUV6QyxJQUFJLE9BQW9CLENBQUM7UUFDekIsSUFBSSxvQkFBaUQsQ0FBQztRQUN0RCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFFcEIsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEtBQXdCLEVBQUUsRUFBRSxDQUFDLElBQUEsb0JBQVEsRUFBQyxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLGlCQUFPLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFFM0ksTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsTUFBTSxZQUFZLEdBQUcsS0FBSyxJQUFJLEVBQUU7WUFDL0IsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUNoQixDQUFDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUM7Z0JBQ3JDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO2dCQUN6QyxDQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDO2dCQUMvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUNWLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUN2QyxHQUFHLENBQUMsR0FBRyxDQUFD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RXJELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUEsb0JBQVEsRUFBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN2RixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFBLG9CQUFRLEVBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9