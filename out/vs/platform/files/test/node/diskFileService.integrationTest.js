/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/log/common/log"], function (require, exports, assert, fs_1, os_1, async_1, buffer_1, lifecycle_1, network_1, path_1, platform_1, resources_1, uri_1, pfs_1, testUtils_1, files_1, fileService_1, diskFileSystemProvider_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDiskFileSystemProvider = void 0;
    function getByName(root, name) {
        if (root.children === undefined) {
            return undefined;
        }
        return root.children.find(child => child.name === name);
    }
    function toLineByLineReadable(content) {
        let chunks = content.split('\n');
        chunks = chunks.map((chunk, index) => {
            if (index === 0) {
                return chunk;
            }
            return '\n' + chunk;
        });
        return {
            read() {
                const chunk = chunks.shift();
                if (typeof chunk === 'string') {
                    return buffer_1.VSBuffer.fromString(chunk);
                }
                return null;
            }
        };
    }
    class TestDiskFileSystemProvider extends diskFileSystemProvider_1.DiskFileSystemProvider {
        constructor() {
            super(...arguments);
            this.totalBytesRead = 0;
            this.invalidStatSize = false;
            this.smallStatSize = false;
            this.readonly = false;
        }
        get capabilities() {
            if (!this._testCapabilities) {
                this._testCapabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        4096 /* FileSystemProviderCapabilities.Trash */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                        65536 /* FileSystemProviderCapabilities.FileAtomicDelete */ |
                        131072 /* FileSystemProviderCapabilities.FileClone */;
                if (platform_1.isLinux) {
                    this._testCapabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._testCapabilities;
        }
        set capabilities(capabilities) {
            this._testCapabilities = capabilities;
        }
        setInvalidStatSize(enabled) {
            this.invalidStatSize = enabled;
        }
        setSmallStatSize(enabled) {
            this.smallStatSize = enabled;
        }
        setReadonly(readonly) {
            this.readonly = readonly;
        }
        async stat(resource) {
            const res = await super.stat(resource);
            if (this.invalidStatSize) {
                res.size = String(res.size); // for https://github.com/microsoft/vscode/issues/72909
            }
            else if (this.smallStatSize) {
                res.size = 1;
            }
            else if (this.readonly) {
                res.permissions = files_1.FilePermission.Readonly;
            }
            return res;
        }
        async read(fd, pos, data, offset, length) {
            const bytesRead = await super.read(fd, pos, data, offset, length);
            this.totalBytesRead += bytesRead;
            return bytesRead;
        }
        async readFile(resource, options) {
            const res = await super.readFile(resource, options);
            this.totalBytesRead += res.byteLength;
            return res;
        }
    }
    exports.TestDiskFileSystemProvider = TestDiskFileSystemProvider;
    diskFileSystemProvider_1.DiskFileSystemProvider.configureFlushOnWrite(false); // speed up all unit tests by disabling flush on write
    (0, testUtils_1.flakySuite)('Disk File Service', function () {
        const testSchema = 'test';
        let service;
        let fileProvider;
        let testProvider;
        let testDir;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async () => {
            const logService = new log_1.NullLogService();
            service = disposables.add(new fileService_1.FileService(logService));
            fileProvider = disposables.add(new TestDiskFileSystemProvider(logService));
            disposables.add(service.registerProvider(network_1.Schemas.file, fileProvider));
            testProvider = disposables.add(new TestDiskFileSystemProvider(logService));
            disposables.add(service.registerProvider(testSchema, testProvider));
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'diskfileservice');
            const sourceDir = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/service').fsPath;
            await pfs_1.Promises.copy(sourceDir, testDir, { preserveSymlinks: false });
        });
        teardown(() => {
            disposables.clear();
            return pfs_1.Promises.rm(testDir);
        });
        test('createFolder', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const parent = await service.resolve(uri_1.URI.file(testDir));
            const newFolderResource = uri_1.URI.file((0, path_1.join)(parent.resource.fsPath, 'newFolder'));
            const newFolder = await service.createFolder(newFolderResource);
            assert.strictEqual(newFolder.name, 'newFolder');
            assert.strictEqual((0, fs_1.existsSync)(newFolder.resource.fsPath), true);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, newFolderResource.fsPath);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.fsPath, newFolderResource.fsPath);
            assert.strictEqual(event.target.isDirectory, true);
        });
        test('createFolder: creating multiple folders at once', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const parent = await service.resolve(uri_1.URI.file(testDir));
            const newFolderResource = uri_1.URI.file((0, path_1.join)(parent.resource.fsPath, ...multiFolderPaths));
            const newFolder = await service.createFolder(newFolderResource);
            const lastFolderName = multiFolderPaths[multiFolderPaths.length - 1];
            assert.strictEqual(newFolder.name, lastFolderName);
            assert.strictEqual((0, fs_1.existsSync)(newFolder.resource.fsPath), true);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, newFolderResource.fsPath);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.fsPath, newFolderResource.fsPath);
            assert.strictEqual(event.target.isDirectory, true);
        });
        test('exists', async () => {
            let exists = await service.exists(uri_1.URI.file(testDir));
            assert.strictEqual(exists, true);
            exists = await service.exists(uri_1.URI.file(testDir + 'something'));
            assert.strictEqual(exists, false);
        });
        test('resolve - file', async () => {
            const resource = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver/index.html');
            const resolved = await service.resolve(resource);
            assert.strictEqual(resolved.name, 'index.html');
            assert.strictEqual(resolved.isFile, true);
            assert.strictEqual(resolved.isDirectory, false);
            assert.strictEqual(resolved.readonly, false);
            assert.strictEqual(resolved.isSymbolicLink, false);
            assert.strictEqual(resolved.resource.toString(), resource.toString());
            assert.strictEqual(resolved.children, undefined);
            assert.ok(resolved.mtime > 0);
            assert.ok(resolved.ctime > 0);
            assert.ok(resolved.size > 0);
        });
        test('resolve - directory', async () => {
            const testsElements = ['examples', 'other', 'index.html', 'site.css'];
            const resource = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver');
            const result = await service.resolve(resource);
            assert.ok(result);
            assert.strictEqual(result.resource.toString(), resource.toString());
            assert.strictEqual(result.name, 'resolver');
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            assert.strictEqual(result.readonly, false);
            assert.ok(result.mtime > 0);
            assert.ok(result.ctime > 0);
            assert.strictEqual(result.children.length, testsElements.length);
            assert.ok(result.children.every(entry => {
                return testsElements.some(name => {
                    return (0, path_1.basename)(entry.resource.fsPath) === name;
                });
            }));
            result.children.forEach(value => {
                assert.ok((0, path_1.basename)(value.resource.fsPath));
                if (['examples', 'other'].indexOf((0, path_1.basename)(value.resource.fsPath)) >= 0) {
                    assert.ok(value.isDirectory);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else if ((0, path_1.basename)(value.resource.fsPath) === 'index.html') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else if ((0, path_1.basename)(value.resource.fsPath) === 'site.css') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.strictEqual(value.mtime, undefined);
                    assert.strictEqual(value.ctime, undefined);
                }
                else {
                    assert.ok(!'Unexpected value ' + (0, path_1.basename)(value.resource.fsPath));
                }
            });
        });
        test('resolve - directory - with metadata', async () => {
            const testsElements = ['examples', 'other', 'index.html', 'site.css'];
            const result = await service.resolve(network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver'), { resolveMetadata: true });
            assert.ok(result);
            assert.strictEqual(result.name, 'resolver');
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            assert.ok(result.mtime > 0);
            assert.ok(result.ctime > 0);
            assert.strictEqual(result.children.length, testsElements.length);
            assert.ok(result.children.every(entry => {
                return testsElements.some(name => {
                    return (0, path_1.basename)(entry.resource.fsPath) === name;
                });
            }));
            assert.ok(result.children.every(entry => entry.etag.length > 0));
            result.children.forEach(value => {
                assert.ok((0, path_1.basename)(value.resource.fsPath));
                if (['examples', 'other'].indexOf((0, path_1.basename)(value.resource.fsPath)) >= 0) {
                    assert.ok(value.isDirectory);
                    assert.ok(value.mtime > 0);
                    assert.ok(value.ctime > 0);
                }
                else if ((0, path_1.basename)(value.resource.fsPath) === 'index.html') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.ok(value.mtime > 0);
                    assert.ok(value.ctime > 0);
                }
                else if ((0, path_1.basename)(value.resource.fsPath) === 'site.css') {
                    assert.ok(!value.isDirectory);
                    assert.ok(!value.children);
                    assert.ok(value.mtime > 0);
                    assert.ok(value.ctime > 0);
                }
                else {
                    assert.ok(!'Unexpected value ' + (0, path_1.basename)(value.resource.fsPath));
                }
            });
        });
        test('resolve - directory with resolveTo', async () => {
            const resolved = await service.resolve(uri_1.URI.file(testDir), { resolveTo: [uri_1.URI.file((0, path_1.join)(testDir, 'deep'))] });
            assert.strictEqual(resolved.children.length, 8);
            const deep = (getByName(resolved, 'deep'));
            assert.strictEqual(deep.children.length, 4);
        });
        test('resolve - directory - resolveTo single directory', async () => {
            const resolverFixturesPath = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver').fsPath;
            const result = await service.resolve(uri_1.URI.file(resolverFixturesPath), { resolveTo: [uri_1.URI.file((0, path_1.join)(resolverFixturesPath, 'other/deep'))] });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.strictEqual(children.length, 4);
            const other = getByName(result, 'other');
            assert.ok(other);
            assert.ok(other.children.length > 0);
            const deep = getByName(other, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.strictEqual(deep.children.length, 4);
        });
        test('resolve directory - resolveTo multiple directories', () => {
            return testResolveDirectoryWithTarget(false);
        });
        test('resolve directory - resolveTo with a URI that has query parameter (https://github.com/microsoft/vscode/issues/128151)', () => {
            return testResolveDirectoryWithTarget(true);
        });
        async function testResolveDirectoryWithTarget(withQueryParam) {
            const resolverFixturesPath = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver').fsPath;
            const result = await service.resolve(uri_1.URI.file(resolverFixturesPath).with({ query: withQueryParam ? 'test' : undefined }), {
                resolveTo: [
                    uri_1.URI.file((0, path_1.join)(resolverFixturesPath, 'other/deep')).with({ query: withQueryParam ? 'test' : undefined }),
                    uri_1.URI.file((0, path_1.join)(resolverFixturesPath, 'examples')).with({ query: withQueryParam ? 'test' : undefined })
                ]
            });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.strictEqual(children.length, 4);
            const other = getByName(result, 'other');
            assert.ok(other);
            assert.ok(other.children.length > 0);
            const deep = getByName(other, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.strictEqual(deep.children.length, 4);
            const examples = getByName(result, 'examples');
            assert.ok(examples);
            assert.ok(examples.children.length > 0);
            assert.strictEqual(examples.children.length, 4);
        }
        test('resolve directory - resolveSingleChildFolders', async () => {
            const resolverFixturesPath = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver/other').fsPath;
            const result = await service.resolve(uri_1.URI.file(resolverFixturesPath), { resolveSingleChildDescendants: true });
            assert.ok(result);
            assert.ok(result.children);
            assert.ok(result.children.length > 0);
            assert.ok(result.isDirectory);
            const children = result.children;
            assert.strictEqual(children.length, 1);
            const deep = getByName(result, 'deep');
            assert.ok(deep);
            assert.ok(deep.children.length > 0);
            assert.strictEqual(deep.children.length, 4);
        });
        test('resolves', async () => {
            const res = await service.resolveAll([
                { resource: uri_1.URI.file(testDir), options: { resolveTo: [uri_1.URI.file((0, path_1.join)(testDir, 'deep'))] } },
                { resource: uri_1.URI.file((0, path_1.join)(testDir, 'deep')) }
            ]);
            const r1 = (res[0].stat);
            assert.strictEqual(r1.children.length, 8);
            const deep = (getByName(r1, 'deep'));
            assert.strictEqual(deep.children.length, 4);
            const r2 = (res[1].stat);
            assert.strictEqual(r2.children.length, 4);
            assert.strictEqual(r2.name, 'deep');
        });
        test('resolve - folder symbolic link', async () => {
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'deep-link'));
            await pfs_1.Promises.symlink((0, path_1.join)(testDir, 'deep'), link.fsPath, 'junction');
            const resolved = await service.resolve(link);
            assert.strictEqual(resolved.children.length, 4);
            assert.strictEqual(resolved.isDirectory, true);
            assert.strictEqual(resolved.isSymbolicLink, true);
        });
        (platform_1.isWindows ? test.skip /* windows: cannot create file symbolic link without elevated context */ : test)('resolve - file symbolic link', async () => {
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt-linked'));
            await pfs_1.Promises.symlink((0, path_1.join)(testDir, 'lorem.txt'), link.fsPath);
            const resolved = await service.resolve(link);
            assert.strictEqual(resolved.isDirectory, false);
            assert.strictEqual(resolved.isSymbolicLink, true);
        });
        test('resolve - symbolic link pointing to nonexistent file does not break', async () => {
            await pfs_1.Promises.symlink((0, path_1.join)(testDir, 'foo'), (0, path_1.join)(testDir, 'bar'), 'junction');
            const resolved = await service.resolve(uri_1.URI.file(testDir));
            assert.strictEqual(resolved.isDirectory, true);
            assert.strictEqual(resolved.children.length, 9);
            const resolvedLink = resolved.children?.find(child => child.name === 'bar' && child.isSymbolicLink);
            assert.ok(resolvedLink);
            assert.ok(!resolvedLink?.isDirectory);
            assert.ok(!resolvedLink?.isFile);
        });
        test('stat - file', async () => {
            const resource = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver/index.html');
            const resolved = await service.stat(resource);
            assert.strictEqual(resolved.name, 'index.html');
            assert.strictEqual(resolved.isFile, true);
            assert.strictEqual(resolved.isDirectory, false);
            assert.strictEqual(resolved.readonly, false);
            assert.strictEqual(resolved.isSymbolicLink, false);
            assert.strictEqual(resolved.resource.toString(), resource.toString());
            assert.ok(resolved.mtime > 0);
            assert.ok(resolved.ctime > 0);
            assert.ok(resolved.size > 0);
        });
        test('stat - directory', async () => {
            const resource = network_1.FileAccess.asFileUri('vs/platform/files/test/node/fixtures/resolver');
            const result = await service.stat(resource);
            assert.ok(result);
            assert.strictEqual(result.resource.toString(), resource.toString());
            assert.strictEqual(result.name, 'resolver');
            assert.ok(result.isDirectory);
            assert.strictEqual(result.readonly, false);
            assert.ok(result.mtime > 0);
            assert.ok(result.ctime > 0);
        });
        test('deleteFile (non recursive)', async () => {
            return testDeleteFile(false, false);
        });
        test('deleteFile (recursive)', async () => {
            return testDeleteFile(false, true);
        });
        (platform_1.isLinux /* trash is unreliable on Linux */ ? test.skip : test)('deleteFile (useTrash)', async () => {
            return testDeleteFile(true, false);
        });
        async function testDeleteFile(useTrash, recursive) {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'deep', 'conway.js'));
            const source = await service.resolve(resource);
            assert.strictEqual(await service.canDelete(source.resource, { useTrash, recursive }), true);
            await service.del(source.resource, { useTrash, recursive });
            assert.strictEqual((0, fs_1.existsSync)(source.resource.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
            let error = undefined;
            try {
                await service.del(source.resource, { useTrash, recursive });
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            assert.strictEqual(error.fileOperationResult, 1 /* FileOperationResult.FILE_NOT_FOUND */);
        }
        (platform_1.isWindows ? test.skip /* windows: cannot create file symbolic link without elevated context */ : test)('deleteFile - symbolic link (exists)', async () => {
            const target = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt-linked'));
            await pfs_1.Promises.symlink(target.fsPath, link.fsPath);
            const source = await service.resolve(link);
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            assert.strictEqual(await service.canDelete(source.resource), true);
            await service.del(source.resource);
            assert.strictEqual((0, fs_1.existsSync)(source.resource.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, link.fsPath);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
            assert.strictEqual((0, fs_1.existsSync)(target.fsPath), true); // target the link pointed to is never deleted
        });
        (platform_1.isWindows ? test.skip /* windows: cannot create file symbolic link without elevated context */ : test)('deleteFile - symbolic link (pointing to nonexistent file)', async () => {
            const target = uri_1.URI.file((0, path_1.join)(testDir, 'foo'));
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'bar'));
            await pfs_1.Promises.symlink(target.fsPath, link.fsPath);
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            assert.strictEqual(await service.canDelete(link), true);
            await service.del(link);
            assert.strictEqual((0, fs_1.existsSync)(link.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, link.fsPath);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
        });
        test('deleteFolder (recursive)', async () => {
            return testDeleteFolderRecursive(false, false);
        });
        test('deleteFolder (recursive, atomic)', async () => {
            return testDeleteFolderRecursive(false, { postfix: '.vsctmp' });
        });
        (platform_1.isLinux /* trash is unreliable on Linux */ ? test.skip : test)('deleteFolder (recursive, useTrash)', async () => {
            return testDeleteFolderRecursive(true, false);
        });
        async function testDeleteFolderRecursive(useTrash, atomic) {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'deep'));
            const source = await service.resolve(resource);
            assert.strictEqual(await service.canDelete(source.resource, { recursive: true, useTrash, atomic }), true);
            await service.del(source.resource, { recursive: true, useTrash, atomic });
            assert.strictEqual((0, fs_1.existsSync)(source.resource.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 1 /* FileOperation.DELETE */);
        }
        test('deleteFolder (non recursive)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'deep'));
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
        test('deleteFolder empty folder (recursive)', () => {
            return testDeleteEmptyFolder(true);
        });
        test('deleteFolder empty folder (non recursive)', () => {
            return testDeleteEmptyFolder(false);
        });
        async function testDeleteEmptyFolder(recursive) {
            const { resource } = await service.createFolder(uri_1.URI.file((0, path_1.join)(testDir, 'deep', 'empty')));
            await service.del(resource, { recursive });
            assert.strictEqual(await service.exists(resource), false);
        }
        test('move', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            const sourceContents = (0, fs_1.readFileSync)(source.fsPath);
            const target = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), 'other.html'));
            assert.strictEqual(await service.canMove(source, target), true);
            const renamed = await service.move(source, target);
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
            const targetContents = (0, fs_1.readFileSync)(target.fsPath);
            assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
            assert.strictEqual(sourceContents.toString(), targetContents.toString());
        });
        test('move - across providers (buffered => buffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveAcrossProviders();
        });
        test('move - across providers (unbuffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveAcrossProviders();
        });
        test('move - across providers (buffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveAcrossProviders();
        });
        test('move - across providers (unbuffered => buffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveAcrossProviders();
        });
        test('move - across providers - large (buffered => buffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveAcrossProviders('lorem.txt');
        });
        test('move - across providers - large (unbuffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveAcrossProviders('lorem.txt');
        });
        test('move - across providers - large (buffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveAcrossProviders('lorem.txt');
        });
        test('move - across providers - large (unbuffered => buffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveAcrossProviders('lorem.txt');
        });
        async function testMoveAcrossProviders(sourceFile = 'index.html') {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = uri_1.URI.file((0, path_1.join)(testDir, sourceFile));
            const sourceContents = (0, fs_1.readFileSync)(source.fsPath);
            const target = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), 'other.html')).with({ scheme: testSchema });
            assert.strictEqual(await service.canMove(source, target), true);
            const renamed = await service.move(source, target);
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.fsPath);
            assert.strictEqual(event.operation, 3 /* FileOperation.COPY */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
            const targetContents = (0, fs_1.readFileSync)(target.fsPath);
            assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
            assert.strictEqual(sourceContents.toString(), targetContents.toString());
        }
        test('move - multi folder', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const multiFolderPaths = ['a', 'couple', 'of', 'folders'];
            const renameToPath = (0, path_1.join)(...multiFolderPaths, 'other.html');
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            assert.strictEqual(await service.canMove(source, uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), renameToPath))), true);
            const renamed = await service.move(source, uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), renameToPath)));
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
        });
        test('move - directory', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'deep'));
            assert.strictEqual(await service.canMove(source, uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), 'deeper'))), true);
            const renamed = await service.move(source, uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), 'deeper')));
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
        });
        test('move - directory - across providers (buffered => buffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveFolderAcrossProviders();
        });
        test('move - directory - across providers (unbuffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveFolderAcrossProviders();
        });
        test('move - directory - across providers (buffered => unbuffered)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            setCapabilities(testProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testMoveFolderAcrossProviders();
        });
        test('move - directory - across providers (unbuffered => buffered)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            setCapabilities(testProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testMoveFolderAcrossProviders();
        });
        async function testMoveFolderAcrossProviders() {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'deep'));
            const sourceChildren = (0, fs_1.readdirSync)(source.fsPath);
            const target = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.fsPath), 'deeper')).with({ scheme: testSchema });
            assert.strictEqual(await service.canMove(source, target), true);
            const renamed = await service.move(source, target);
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.fsPath), false);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.fsPath);
            assert.strictEqual(event.operation, 3 /* FileOperation.COPY */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
            const targetChildren = (0, fs_1.readdirSync)(target.fsPath);
            assert.strictEqual(sourceChildren.length, targetChildren.length);
            for (let i = 0; i < sourceChildren.length; i++) {
                assert.strictEqual(sourceChildren[i], targetChildren[i]);
            }
        }
        test('move - MIX CASE', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const renamedResource = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.resource.fsPath), 'INDEX.html'));
            assert.strictEqual(await service.canMove(source.resource, renamedResource), true);
            let renamed = await service.move(source.resource, renamedResource);
            assert.strictEqual((0, fs_1.existsSync)(renamedResource.fsPath), true);
            assert.strictEqual((0, path_1.basename)(renamedResource.fsPath), 'INDEX.html');
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamedResource.fsPath);
            renamed = await service.resolve(renamedResource, { resolveMetadata: true });
            assert.strictEqual(source.size, renamed.size);
        });
        test('move - same file', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            assert.strictEqual(await service.canMove(source.resource, uri_1.URI.file(source.resource.fsPath)), true);
            let renamed = await service.move(source.resource, uri_1.URI.file(source.resource.fsPath));
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, path_1.basename)(renamed.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
            renamed = await service.resolve(renamed.resource, { resolveMetadata: true });
            assert.strictEqual(source.size, renamed.size);
        });
        test('move - same file #2', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const targetParent = uri_1.URI.file(testDir);
            const target = targetParent.with({ path: path_1.posix.join(targetParent.path, path_1.posix.basename(source.resource.path)) });
            assert.strictEqual(await service.canMove(source.resource, target), true);
            let renamed = await service.move(source.resource, target);
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.strictEqual((0, path_1.basename)(renamed.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 2 /* FileOperation.MOVE */);
            assert.strictEqual(event.target.resource.fsPath, renamed.resource.fsPath);
            renamed = await service.resolve(renamed.resource, { resolveMetadata: true });
            assert.strictEqual(source.size, renamed.size);
        });
        test('move - source parent of target', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            let source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            assert.ok((await service.canMove(uri_1.URI.file(testDir), uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt'))) instanceof Error));
            let error;
            try {
                await service.move(uri_1.URI.file(testDir), uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt')));
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            assert.ok(!event);
            source = await service.resolve(source.resource, { resolveMetadata: true });
            assert.strictEqual(originalSize, source.size);
        });
        test('move - FILE_MOVE_CONFLICT', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            let source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            assert.ok((await service.canMove(source.resource, uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt'))) instanceof Error));
            let error;
            try {
                await service.move(source.resource, uri_1.URI.file((0, path_1.join)(testDir, 'binary.txt')));
            }
            catch (e) {
                error = e;
            }
            assert.strictEqual(error.fileOperationResult, 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
            assert.ok(!event);
            source = await service.resolve(source.resource, { resolveMetadata: true });
            assert.strictEqual(originalSize, source.size);
        });
        test('move - overwrite folder with file', async () => {
            let createEvent;
            let moveEvent;
            let deleteEvent;
            disposables.add(service.onDidRunOperation(e => {
                if (e.operation === 0 /* FileOperation.CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* FileOperation.DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 2 /* FileOperation.MOVE */) {
                    moveEvent = e;
                }
            }));
            const parent = await service.resolve(uri_1.URI.file(testDir));
            const folderResource = uri_1.URI.file((0, path_1.join)(parent.resource.fsPath, 'conway.js'));
            const f = await service.createFolder(folderResource);
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'deep', 'conway.js'));
            assert.strictEqual(await service.canMove(source, f.resource, true), true);
            const moved = await service.move(source, f.resource, true);
            assert.strictEqual((0, fs_1.existsSync)(moved.resource.fsPath), true);
            assert.ok((0, fs_1.statSync)(moved.resource.fsPath).isFile);
            assert.ok(createEvent);
            assert.ok(deleteEvent);
            assert.ok(moveEvent);
            assert.strictEqual(moveEvent.resource.fsPath, source.fsPath);
            assert.strictEqual(moveEvent.target.resource.fsPath, moved.resource.fsPath);
            assert.strictEqual(deleteEvent.resource.fsPath, folderResource.fsPath);
        });
        test('copy', async () => {
            await doTestCopy();
        });
        test('copy - unbuffered (FileSystemProviderCapabilities.FileReadWrite)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            await doTestCopy();
        });
        test('copy - unbuffered large (FileSystemProviderCapabilities.FileReadWrite)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            await doTestCopy('lorem.txt');
        });
        test('copy - buffered (FileSystemProviderCapabilities.FileOpenReadWriteClose)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            await doTestCopy();
        });
        test('copy - buffered large (FileSystemProviderCapabilities.FileOpenReadWriteClose)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            await doTestCopy('lorem.txt');
        });
        function setCapabilities(provider, capabilities) {
            provider.capabilities = capabilities;
            if (platform_1.isLinux) {
                provider.capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            }
        }
        async function doTestCopy(sourceName = 'index.html') {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, sourceName)));
            const target = uri_1.URI.file((0, path_1.join)(testDir, 'other.html'));
            assert.strictEqual(await service.canCopy(source.resource, target), true);
            const copied = await service.copy(source.resource, target);
            assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
            assert.strictEqual((0, fs_1.existsSync)(source.resource.fsPath), true);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 3 /* FileOperation.COPY */);
            assert.strictEqual(event.target.resource.fsPath, copied.resource.fsPath);
            const sourceContents = (0, fs_1.readFileSync)(source.resource.fsPath);
            const targetContents = (0, fs_1.readFileSync)(target.fsPath);
            assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
            assert.strictEqual(sourceContents.toString(), targetContents.toString());
        }
        test('copy - overwrite folder with file', async () => {
            let createEvent;
            let copyEvent;
            let deleteEvent;
            disposables.add(service.onDidRunOperation(e => {
                if (e.operation === 0 /* FileOperation.CREATE */) {
                    createEvent = e;
                }
                else if (e.operation === 1 /* FileOperation.DELETE */) {
                    deleteEvent = e;
                }
                else if (e.operation === 3 /* FileOperation.COPY */) {
                    copyEvent = e;
                }
            }));
            const parent = await service.resolve(uri_1.URI.file(testDir));
            const folderResource = uri_1.URI.file((0, path_1.join)(parent.resource.fsPath, 'conway.js'));
            const f = await service.createFolder(folderResource);
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'deep', 'conway.js'));
            assert.strictEqual(await service.canCopy(source, f.resource, true), true);
            const copied = await service.copy(source, f.resource, true);
            assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
            assert.ok((0, fs_1.statSync)(copied.resource.fsPath).isFile);
            assert.ok(createEvent);
            assert.ok(deleteEvent);
            assert.ok(copyEvent);
            assert.strictEqual(copyEvent.resource.fsPath, source.fsPath);
            assert.strictEqual(copyEvent.target.resource.fsPath, copied.resource.fsPath);
            assert.strictEqual(deleteEvent.resource.fsPath, folderResource.fsPath);
        });
        test('copy - MIX CASE same target - no overwrite', async () => {
            let source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            const target = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.resource.fsPath), 'INDEX.html'));
            const canCopy = await service.canCopy(source.resource, target);
            let error;
            let copied;
            try {
                copied = await service.copy(source.resource, target);
            }
            catch (e) {
                error = e;
            }
            if (platform_1.isLinux) {
                assert.ok(!error);
                assert.strictEqual(canCopy, true);
                assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
                assert.ok((0, fs_1.readdirSync)(testDir).some(f => f === 'INDEX.html'));
                assert.strictEqual(source.size, copied.size);
            }
            else {
                assert.ok(error);
                assert.ok(canCopy instanceof Error);
                source = await service.resolve(source.resource, { resolveMetadata: true });
                assert.strictEqual(originalSize, source.size);
            }
        });
        test('copy - MIX CASE same target - overwrite', async () => {
            let source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            const originalSize = source.size;
            assert.ok(originalSize > 0);
            const target = uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source.resource.fsPath), 'INDEX.html'));
            const canCopy = await service.canCopy(source.resource, target, true);
            let error;
            let copied;
            try {
                copied = await service.copy(source.resource, target, true);
            }
            catch (e) {
                error = e;
            }
            if (platform_1.isLinux) {
                assert.ok(!error);
                assert.strictEqual(canCopy, true);
                assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
                assert.ok((0, fs_1.readdirSync)(testDir).some(f => f === 'INDEX.html'));
                assert.strictEqual(source.size, copied.size);
            }
            else {
                assert.ok(error);
                assert.ok(canCopy instanceof Error);
                source = await service.resolve(source.resource, { resolveMetadata: true });
                assert.strictEqual(originalSize, source.size);
            }
        });
        test('copy - MIX CASE different target - overwrite', async () => {
            const source1 = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source1.size > 0);
            const renamed = await service.move(source1.resource, uri_1.URI.file((0, path_1.join)((0, path_1.dirname)(source1.resource.fsPath), 'CONWAY.js')));
            assert.strictEqual((0, fs_1.existsSync)(renamed.resource.fsPath), true);
            assert.ok((0, fs_1.readdirSync)(testDir).some(f => f === 'CONWAY.js'));
            assert.strictEqual(source1.size, renamed.size);
            const source2 = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'deep', 'conway.js')), { resolveMetadata: true });
            const target = uri_1.URI.file((0, path_1.join)(testDir, (0, path_1.basename)(source2.resource.path)));
            assert.strictEqual(await service.canCopy(source2.resource, target, true), true);
            const res = await service.copy(source2.resource, target, true);
            assert.strictEqual((0, fs_1.existsSync)(res.resource.fsPath), true);
            assert.ok((0, fs_1.readdirSync)(testDir).some(f => f === 'conway.js'));
            assert.strictEqual(source2.size, res.size);
        });
        test('copy - same file', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            assert.strictEqual(await service.canCopy(source.resource, uri_1.URI.file(source.resource.fsPath)), true);
            let copied = await service.copy(source.resource, uri_1.URI.file(source.resource.fsPath));
            assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
            assert.strictEqual((0, path_1.basename)(copied.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 3 /* FileOperation.COPY */);
            assert.strictEqual(event.target.resource.fsPath, copied.resource.fsPath);
            copied = await service.resolve(source.resource, { resolveMetadata: true });
            assert.strictEqual(source.size, copied.size);
        });
        test('copy - same file #2', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const source = await service.resolve(uri_1.URI.file((0, path_1.join)(testDir, 'index.html')), { resolveMetadata: true });
            assert.ok(source.size > 0);
            const targetParent = uri_1.URI.file(testDir);
            const target = targetParent.with({ path: path_1.posix.join(targetParent.path, path_1.posix.basename(source.resource.path)) });
            assert.strictEqual(await service.canCopy(source.resource, uri_1.URI.file(target.fsPath)), true);
            let copied = await service.copy(source.resource, uri_1.URI.file(target.fsPath));
            assert.strictEqual((0, fs_1.existsSync)(copied.resource.fsPath), true);
            assert.strictEqual((0, path_1.basename)(copied.resource.fsPath), 'index.html');
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, source.resource.fsPath);
            assert.strictEqual(event.operation, 3 /* FileOperation.COPY */);
            assert.strictEqual(event.target.resource.fsPath, copied.resource.fsPath);
            copied = await service.resolve(source.resource, { resolveMetadata: true });
            assert.strictEqual(source.size, copied.size);
        });
        test('cloneFile - basics', () => {
            return testCloneFile();
        });
        test('cloneFile - via copy capability', () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 8 /* FileSystemProviderCapabilities.FileFolderCopy */);
            return testCloneFile();
        });
        test('cloneFile - via pipe', () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testCloneFile();
        });
        async function testCloneFile() {
            const source1 = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            const source1Size = (await service.resolve(source1, { resolveMetadata: true })).size;
            const source2 = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const source2Size = (await service.resolve(source2, { resolveMetadata: true })).size;
            const targetParent = uri_1.URI.file(testDir);
            // same path is a no-op
            await service.cloneFile(source1, source1);
            // simple clone to existing parent folder path
            const target1 = targetParent.with({ path: path_1.posix.join(targetParent.path, `${path_1.posix.basename(source1.path)}-clone`) });
            await service.cloneFile(source1, uri_1.URI.file(target1.fsPath));
            assert.strictEqual((0, fs_1.existsSync)(target1.fsPath), true);
            assert.strictEqual((0, path_1.basename)(target1.fsPath), 'index.html-clone');
            let target1Size = (await service.resolve(target1, { resolveMetadata: true })).size;
            assert.strictEqual(source1Size, target1Size);
            // clone to same path overwrites
            await service.cloneFile(source2, uri_1.URI.file(target1.fsPath));
            target1Size = (await service.resolve(target1, { resolveMetadata: true })).size;
            assert.strictEqual(source2Size, target1Size);
            assert.notStrictEqual(source1Size, target1Size);
            // clone creates missing folders ad-hoc
            const target2 = targetParent.with({ path: path_1.posix.join(targetParent.path, 'foo', 'bar', `${path_1.posix.basename(source1.path)}-clone`) });
            await service.cloneFile(source1, uri_1.URI.file(target2.fsPath));
            assert.strictEqual((0, fs_1.existsSync)(target2.fsPath), true);
            assert.strictEqual((0, path_1.basename)(target2.fsPath), 'index.html-clone');
            const target2Size = (await service.resolve(target2, { resolveMetadata: true })).size;
            assert.strictEqual(source1Size, target2Size);
        }
        test('readFile - small file - default', () => {
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - buffered', () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - buffered / readonly', () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 2048 /* FileSystemProviderCapabilities.Readonly */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - unbuffered / readonly', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 2048 /* FileSystemProviderCapabilities.Readonly */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - small file - streamed / readonly', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */ | 2048 /* FileSystemProviderCapabilities.Readonly */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFile - large file - default', async () => {
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')));
        });
        test('readFile - large file - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')));
        });
        test('readFile - large file - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')));
        });
        test('readFile - large file - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')));
        });
        test('readFile - atomic (emulated on service level)', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')), { atomic: true });
        });
        test('readFile - atomic (natively supported)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ & 16384 /* FileSystemProviderCapabilities.FileAtomicRead */);
            return testReadFile(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')), { atomic: true });
        });
        async function testReadFile(resource, options) {
            const content = await service.readFile(resource, options);
            assert.strictEqual(content.value.toString(), (0, fs_1.readFileSync)(resource.fsPath).toString());
        }
        test('readFileStream - small file - default', () => {
            return testReadFileStream(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFileStream - small file - buffered', () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadFileStream(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFileStream - small file - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadFileStream(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        test('readFileStream - small file - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFileStream(uri_1.URI.file((0, path_1.join)(testDir, 'small.txt')));
        });
        async function testReadFileStream(resource) {
            const content = await service.readFileStream(resource);
            assert.strictEqual((await (0, buffer_1.streamToBuffer)(content.value)).toString(), (0, fs_1.readFileSync)(resource.fsPath).toString());
        }
        test('readFile - Files are intermingled #38331 - default', async () => {
            return testFilesNotIntermingled();
        });
        test('readFile - Files are intermingled #38331 - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testFilesNotIntermingled();
        });
        test('readFile - Files are intermingled #38331 - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testFilesNotIntermingled();
        });
        test('readFile - Files are intermingled #38331 - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testFilesNotIntermingled();
        });
        async function testFilesNotIntermingled() {
            const resource1 = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const resource2 = uri_1.URI.file((0, path_1.join)(testDir, 'some_utf16le.css'));
            // load in sequence and keep data
            const value1 = await service.readFile(resource1);
            const value2 = await service.readFile(resource2);
            // load in parallel in expect the same result
            const result = await Promise.all([
                service.readFile(resource1),
                service.readFile(resource2)
            ]);
            assert.strictEqual(result[0].value.toString(), value1.value.toString());
            assert.strictEqual(result[1].value.toString(), value2.value.toString());
        }
        test('readFile - from position (ASCII) - default', async () => {
            return testReadFileFromPositionAscii();
        });
        test('readFile - from position (ASCII) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadFileFromPositionAscii();
        });
        test('readFile - from position (ASCII) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadFileFromPositionAscii();
        });
        test('readFile - from position (ASCII) - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFileFromPositionAscii();
        });
        async function testReadFileFromPositionAscii() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const contents = await service.readFile(resource, { position: 6 });
            assert.strictEqual(contents.value.toString(), 'File');
        }
        test('readFile - from position (with umlaut) - default', async () => {
            return testReadFileFromPositionUmlaut();
        });
        test('readFile - from position (with umlaut) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadFileFromPositionUmlaut();
        });
        test('readFile - from position (with umlaut) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadFileFromPositionUmlaut();
        });
        test('readFile - from position (with umlaut) - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadFileFromPositionUmlaut();
        });
        async function testReadFileFromPositionUmlaut() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small_umlaut.txt'));
            const contents = await service.readFile(resource, { position: Buffer.from('Small File with Ü').length });
            assert.strictEqual(contents.value.toString(), 'mlaut');
        }
        test('readFile - 3 bytes (ASCII) - default', async () => {
            return testReadThreeBytesFromFile();
        });
        test('readFile - 3 bytes (ASCII) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testReadThreeBytesFromFile();
        });
        test('readFile - 3 bytes (ASCII) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testReadThreeBytesFromFile();
        });
        test('readFile - 3 bytes (ASCII) - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testReadThreeBytesFromFile();
        });
        async function testReadThreeBytesFromFile() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const contents = await service.readFile(resource, { length: 3 });
            assert.strictEqual(contents.value.toString(), 'Sma');
        }
        test('readFile - 20000 bytes (large) - default', async () => {
            return readLargeFileWithLength(20000);
        });
        test('readFile - 20000 bytes (large) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return readLargeFileWithLength(20000);
        });
        test('readFile - 20000 bytes (large) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return readLargeFileWithLength(20000);
        });
        test('readFile - 20000 bytes (large) - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return readLargeFileWithLength(20000);
        });
        test('readFile - 80000 bytes (large) - default', async () => {
            return readLargeFileWithLength(80000);
        });
        test('readFile - 80000 bytes (large) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return readLargeFileWithLength(80000);
        });
        test('readFile - 80000 bytes (large) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return readLargeFileWithLength(80000);
        });
        test('readFile - 80000 bytes (large) - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return readLargeFileWithLength(80000);
        });
        async function readLargeFileWithLength(length) {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const contents = await service.readFile(resource, { length });
            assert.strictEqual(contents.value.byteLength, length);
        }
        test('readFile - FILE_IS_DIRECTORY', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'deep'));
            let error = undefined;
            try {
                await service.readFile(resource);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.fileOperationResult, 0 /* FileOperationResult.FILE_IS_DIRECTORY */);
        });
        (platform_1.isWindows /* error code does not seem to be supported on windows */ ? test.skip : test)('readFile - FILE_NOT_DIRECTORY', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt', 'file.txt'));
            let error = undefined;
            try {
                await service.readFile(resource);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.fileOperationResult, 9 /* FileOperationResult.FILE_NOT_DIRECTORY */);
        });
        test('readFile - FILE_NOT_FOUND', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, '404.html'));
            let error = undefined;
            try {
                await service.readFile(resource);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.fileOperationResult, 1 /* FileOperationResult.FILE_NOT_FOUND */);
        });
        test('readFile - FILE_NOT_MODIFIED_SINCE - default', async () => {
            return testNotModifiedSince();
        });
        test('readFile - FILE_NOT_MODIFIED_SINCE - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testNotModifiedSince();
        });
        test('readFile - FILE_NOT_MODIFIED_SINCE - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testNotModifiedSince();
        });
        test('readFile - FILE_NOT_MODIFIED_SINCE - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testNotModifiedSince();
        });
        async function testNotModifiedSince() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            const contents = await service.readFile(resource);
            fileProvider.totalBytesRead = 0;
            let error = undefined;
            try {
                await service.readFile(resource, { etag: contents.etag });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.strictEqual(error.fileOperationResult, 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */);
            assert.ok(error instanceof files_1.NotModifiedSinceFileOperationError && error.stat);
            assert.strictEqual(fileProvider.totalBytesRead, 0);
        }
        test('readFile - FILE_NOT_MODIFIED_SINCE does not fire wrongly - https://github.com/microsoft/vscode/issues/72909', async () => {
            fileProvider.setInvalidStatSize(true);
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            await service.readFile(resource);
            let error = undefined;
            try {
                await service.readFile(resource, { etag: undefined });
            }
            catch (err) {
                error = err;
            }
            assert.ok(!error);
        });
        test('readFile - FILE_TOO_LARGE - default', async () => {
            return testFileTooLarge();
        });
        test('readFile - FILE_TOO_LARGE - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testFileTooLarge();
        });
        test('readFile - FILE_TOO_LARGE - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testFileTooLarge();
        });
        test('readFile - FILE_TOO_LARGE - streamed', async () => {
            setCapabilities(fileProvider, 16 /* FileSystemProviderCapabilities.FileReadStream */);
            return testFileTooLarge();
        });
        async function testFileTooLarge() {
            await doTestFileTooLarge(false);
            // Also test when the stat size is wrong
            fileProvider.setSmallStatSize(true);
            return doTestFileTooLarge(true);
        }
        async function doTestFileTooLarge(statSizeWrong) {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            let error = undefined;
            try {
                await service.readFile(resource, { limits: { size: 10 } });
            }
            catch (err) {
                error = err;
            }
            if (!statSizeWrong) {
                assert.ok(error instanceof files_1.TooLargeFileOperationError);
                assert.ok(typeof error.size === 'number');
            }
            assert.strictEqual(error.fileOperationResult, 7 /* FileOperationResult.FILE_TOO_LARGE */);
        }
        (platform_1.isWindows ? test.skip /* windows: cannot create file symbolic link without elevated context */ : test)('readFile - dangling symbolic link - https://github.com/microsoft/vscode/issues/116049', async () => {
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'small.js-link'));
            await pfs_1.Promises.symlink((0, path_1.join)(testDir, 'small.js'), link.fsPath);
            let error = undefined;
            try {
                await service.readFile(link);
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
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
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'test.txt'));
            assert.strictEqual(await service.canCreateFile(resource), true);
            const fileStat = await service.createFile(resource, converter(contents));
            assert.strictEqual(fileStat.name, 'test.txt');
            assert.strictEqual((0, fs_1.existsSync)(fileStat.resource.fsPath), true);
            assert.strictEqual((0, fs_1.readFileSync)(fileStat.resource.fsPath).toString(), contents);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.fsPath, resource.fsPath);
        }
        test('createFile (does not overwrite by default)', async () => {
            const contents = 'Hello World';
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'test.txt'));
            (0, fs_1.writeFileSync)(resource.fsPath, ''); // create file
            assert.ok((await service.canCreateFile(resource)) instanceof Error);
            let error;
            try {
                await service.createFile(resource, buffer_1.VSBuffer.fromString(contents));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        });
        test('createFile (allows to overwrite existing)', async () => {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const contents = 'Hello World';
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'test.txt'));
            (0, fs_1.writeFileSync)(resource.fsPath, ''); // create file
            assert.strictEqual(await service.canCreateFile(resource, { overwrite: true }), true);
            const fileStat = await service.createFile(resource, buffer_1.VSBuffer.fromString(contents), { overwrite: true });
            assert.strictEqual(fileStat.name, 'test.txt');
            assert.strictEqual((0, fs_1.existsSync)(fileStat.resource.fsPath), true);
            assert.strictEqual((0, fs_1.readFileSync)(fileStat.resource.fsPath).toString(), contents);
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 0 /* FileOperation.CREATE */);
            assert.strictEqual(event.target.resource.fsPath, resource.fsPath);
        });
        test('writeFile - default', async () => {
            return testWriteFile(false);
        });
        test('writeFile - flush on write', async () => {
            diskFileSystemProvider_1.DiskFileSystemProvider.configureFlushOnWrite(true);
            try {
                return await testWriteFile(false);
            }
            finally {
                diskFileSystemProvider_1.DiskFileSystemProvider.configureFlushOnWrite(false);
            }
        });
        test('writeFile - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFile(false);
        });
        test('writeFile - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFile(false);
        });
        test('writeFile - default (atomic)', async () => {
            return testWriteFile(true);
        });
        test('writeFile - flush on write (atomic)', async () => {
            diskFileSystemProvider_1.DiskFileSystemProvider.configureFlushOnWrite(true);
            try {
                return await testWriteFile(true);
            }
            finally {
                diskFileSystemProvider_1.DiskFileSystemProvider.configureFlushOnWrite(false);
            }
        });
        test('writeFile - buffered (atomic)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
            let e;
            try {
                await testWriteFile(true);
            }
            catch (error) {
                e = error;
            }
            assert.ok(e);
        });
        test('writeFile - unbuffered (atomic)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
            return testWriteFile(true);
        });
        (platform_1.isWindows ? test.skip /* windows: cannot create file symbolic link without elevated context */ : test)('writeFile - atomic writing does not break symlinks', async () => {
            const link = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt-linked'));
            await pfs_1.Promises.symlink((0, path_1.join)(testDir, 'lorem.txt'), link.fsPath);
            const content = 'Updates to the lorem file';
            await service.writeFile(link, buffer_1.VSBuffer.fromString(content), { atomic: { postfix: '.vsctmp' } });
            assert.strictEqual((0, fs_1.readFileSync)(link.fsPath).toString(), content);
            const resolved = await service.resolve(link);
            assert.strictEqual(resolved.isSymbolicLink, true);
        });
        async function testWriteFile(atomic) {
            let event;
            disposables.add(service.onDidRunOperation(e => event = e));
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = 'Updates to the small file';
            await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { atomic: atomic ? { postfix: '.vsctmp' } : false });
            assert.ok(event);
            assert.strictEqual(event.resource.fsPath, resource.fsPath);
            assert.strictEqual(event.operation, 4 /* FileOperation.WRITE */);
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), newContent);
        }
        test('writeFile (large file) - default', async () => {
            return testWriteFileLarge(false);
        });
        test('writeFile (large file) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFileLarge(false);
        });
        test('writeFile (large file) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFileLarge(false);
        });
        test('writeFile (large file) - default (atomic)', async () => {
            return testWriteFileLarge(true);
        });
        test('writeFile (large file) - buffered (atomic)', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
            let e;
            try {
                await testWriteFileLarge(true);
            }
            catch (error) {
                e = error;
            }
            assert.ok(e);
        });
        test('writeFile (large file) - unbuffered (atomic)', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
            return testWriteFileLarge(true);
        });
        async function testWriteFileLarge(atomic) {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { atomic: atomic ? { postfix: '.vsctmp' } : false });
            assert.strictEqual(fileStat.name, 'lorem.txt');
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), newContent);
        }
        test('writeFile (large file) - unbuffered (atomic) - concurrent writes with multiple services', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const promises = [];
            let suffix = 0;
            for (let i = 0; i < 10; i++) {
                const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
                disposables.add(service.registerProvider(network_1.Schemas.file, fileProvider));
                promises.push(service.writeFile(resource, buffer_1.VSBuffer.fromString(`${newContent}${++suffix}`), { atomic: { postfix: '.vsctmp' } }));
                await (0, async_1.timeout)(0);
            }
            await Promise.allSettled(promises);
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), `${newContent}${suffix}`);
        });
        test('writeFile - buffered - readonly throws', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 2048 /* FileSystemProviderCapabilities.Readonly */);
            return testWriteFileReadonlyThrows();
        });
        test('writeFile - unbuffered - readonly throws', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 2048 /* FileSystemProviderCapabilities.Readonly */);
            return testWriteFileReadonlyThrows();
        });
        async function testWriteFileReadonlyThrows() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = 'Updates to the small file';
            let error;
            try {
                await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        }
        test('writeFile (large file) - multiple parallel writes queue up and atomic read support (via file service)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const writePromises = Promise.all(['0', '00', '000', '0000', '00000'].map(async (offset) => {
                const fileStat = await service.writeFile(resource, buffer_1.VSBuffer.fromString(offset + newContent));
                assert.strictEqual(fileStat.name, 'lorem.txt');
            }));
            const readPromises = Promise.all(['0', '00', '000', '0000', '00000'].map(async () => {
                const fileContent = await service.readFile(resource, { atomic: true });
                assert.ok(fileContent.value.byteLength > 0); // `atomic: true` ensures we never read a truncated file
            }));
            await Promise.all([writePromises, readPromises]);
        });
        test('provider - write barrier prevents dirty writes', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const provider = service.getProvider(resource.scheme);
            assert.ok(provider);
            assert.ok((0, files_1.hasOpenReadWriteCloseCapability)(provider));
            const writePromises = Promise.all(['0', '00', '000', '0000', '00000'].map(async (offset) => {
                const content = offset + newContent;
                const contentBuffer = buffer_1.VSBuffer.fromString(content).buffer;
                const fd = await provider.open(resource, { create: true, unlock: false });
                try {
                    await provider.write(fd, 0, buffer_1.VSBuffer.fromString(content).buffer, 0, contentBuffer.byteLength);
                    // Here since `close` is not called, all other writes are
                    // waiting on the barrier to release, so doing a readFile
                    // should give us a consistent view of the file contents
                    assert.strictEqual((await pfs_1.Promises.readFile(resource.fsPath)).toString(), content);
                }
                finally {
                    await provider.close(fd);
                }
            }));
            await Promise.all([writePromises]);
        });
        test('provider - write barrier is partitioned per resource', async () => {
            const resource1 = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const resource2 = uri_1.URI.file((0, path_1.join)(testDir, 'test.txt'));
            const provider = service.getProvider(resource1.scheme);
            assert.ok(provider);
            assert.ok((0, files_1.hasOpenReadWriteCloseCapability)(provider));
            const fd1 = await provider.open(resource1, { create: true, unlock: false });
            const fd2 = await provider.open(resource2, { create: true, unlock: false });
            const newContent = 'Hello World';
            try {
                await provider.write(fd1, 0, buffer_1.VSBuffer.fromString(newContent).buffer, 0, buffer_1.VSBuffer.fromString(newContent).buffer.byteLength);
                assert.strictEqual((await pfs_1.Promises.readFile(resource1.fsPath)).toString(), newContent);
                await provider.write(fd2, 0, buffer_1.VSBuffer.fromString(newContent).buffer, 0, buffer_1.VSBuffer.fromString(newContent).buffer.byteLength);
                assert.strictEqual((await pfs_1.Promises.readFile(resource2.fsPath)).toString(), newContent);
            }
            finally {
                await Promise.allSettled([
                    await provider.close(fd1),
                    await provider.close(fd2)
                ]);
            }
        });
        test('provider - write barrier not becoming stale', async () => {
            const newFolder = (0, path_1.join)(testDir, 'new-folder');
            const newResource = uri_1.URI.file((0, path_1.join)(newFolder, 'lorem.txt'));
            const provider = service.getProvider(newResource.scheme);
            assert.ok(provider);
            assert.ok((0, files_1.hasOpenReadWriteCloseCapability)(provider));
            let error = undefined;
            try {
                await provider.open(newResource, { create: true, unlock: false });
            }
            catch (e) {
                error = e;
            }
            assert.ok(error); // expected because `new-folder` does not exist
            await pfs_1.Promises.mkdir(newFolder);
            const content = (0, fs_1.readFileSync)(uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt')).fsPath);
            const newContent = content.toString() + content.toString();
            const newContentBuffer = buffer_1.VSBuffer.fromString(newContent).buffer;
            const fd = await provider.open(newResource, { create: true, unlock: false });
            try {
                await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);
                assert.strictEqual((await pfs_1.Promises.readFile(newResource.fsPath)).toString(), newContent);
            }
            finally {
                await provider.close(fd);
            }
        });
        test('provider - atomic reads (write pending when read starts)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const newContentBuffer = buffer_1.VSBuffer.fromString(newContent).buffer;
            const provider = service.getProvider(resource.scheme);
            assert.ok(provider);
            assert.ok((0, files_1.hasOpenReadWriteCloseCapability)(provider));
            assert.ok((0, files_1.hasFileAtomicReadCapability)(provider));
            let atomicReadPromise = undefined;
            const fd = await provider.open(resource, { create: true, unlock: false });
            try {
                // Start reading while write is pending
                atomicReadPromise = provider.readFile(resource, { atomic: true });
                // Simulate a slow write, giving the read
                // a chance to succeed if it were not atomic
                await (0, async_1.timeout)(20);
                await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);
            }
            finally {
                await provider.close(fd);
            }
            assert.ok(atomicReadPromise);
            const atomicReadResult = await atomicReadPromise;
            assert.strictEqual(atomicReadResult.byteLength, newContentBuffer.byteLength);
        });
        test('provider - atomic reads (read pending when write starts)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const newContentBuffer = buffer_1.VSBuffer.fromString(newContent).buffer;
            const provider = service.getProvider(resource.scheme);
            assert.ok(provider);
            assert.ok((0, files_1.hasOpenReadWriteCloseCapability)(provider));
            assert.ok((0, files_1.hasFileAtomicReadCapability)(provider));
            let atomicReadPromise = provider.readFile(resource, { atomic: true });
            const fdPromise = provider.open(resource, { create: true, unlock: false }).then(async (fd) => {
                try {
                    return await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);
                }
                finally {
                    await provider.close(fd);
                }
            });
            let atomicReadResult = await atomicReadPromise;
            assert.strictEqual(atomicReadResult.byteLength, content.byteLength);
            await fdPromise;
            atomicReadPromise = provider.readFile(resource, { atomic: true });
            atomicReadResult = await atomicReadPromise;
            assert.strictEqual(atomicReadResult.byteLength, newContentBuffer.byteLength);
        });
        test('writeFile (readable) - default', async () => {
            return testWriteFileReadable();
        });
        test('writeFile (readable) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFileReadable();
        });
        test('writeFile (readable) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFileReadable();
        });
        async function testWriteFileReadable() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = 'Updates to the small file';
            await service.writeFile(resource, toLineByLineReadable(newContent));
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), newContent);
        }
        test('writeFile (large file - readable) - default', async () => {
            return testWriteFileLargeReadable();
        });
        test('writeFile (large file - readable) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFileLargeReadable();
        });
        test('writeFile (large file - readable) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFileLargeReadable();
        });
        async function testWriteFileLargeReadable() {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const content = (0, fs_1.readFileSync)(resource.fsPath);
            const newContent = content.toString() + content.toString();
            const fileStat = await service.writeFile(resource, toLineByLineReadable(newContent));
            assert.strictEqual(fileStat.name, 'lorem.txt');
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), newContent);
        }
        test('writeFile (stream) - default', async () => {
            return testWriteFileStream();
        });
        test('writeFile (stream) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFileStream();
        });
        test('writeFile (stream) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFileStream();
        });
        async function testWriteFileStream() {
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const target = uri_1.URI.file((0, path_1.join)(testDir, 'small-copy.txt'));
            const fileStat = await service.writeFile(target, (0, buffer_1.streamToBufferReadableStream)((0, fs_1.createReadStream)(source.fsPath)));
            assert.strictEqual(fileStat.name, 'small-copy.txt');
            const targetContents = (0, fs_1.readFileSync)(target.fsPath).toString();
            assert.strictEqual((0, fs_1.readFileSync)(source.fsPath).toString(), targetContents);
        }
        test('writeFile (large file - stream) - default', async () => {
            return testWriteFileLargeStream();
        });
        test('writeFile (large file - stream) - buffered', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testWriteFileLargeStream();
        });
        test('writeFile (large file - stream) - unbuffered', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testWriteFileLargeStream();
        });
        async function testWriteFileLargeStream() {
            const source = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const target = uri_1.URI.file((0, path_1.join)(testDir, 'lorem-copy.txt'));
            const fileStat = await service.writeFile(target, (0, buffer_1.streamToBufferReadableStream)((0, fs_1.createReadStream)(source.fsPath)));
            assert.strictEqual(fileStat.name, 'lorem-copy.txt');
            const targetContents = (0, fs_1.readFileSync)(target.fsPath).toString();
            assert.strictEqual((0, fs_1.readFileSync)(source.fsPath).toString(), targetContents);
        }
        test('writeFile (file is created including parents)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'other', 'newfile.txt'));
            const content = 'File is created including parent';
            const fileStat = await service.writeFile(resource, buffer_1.VSBuffer.fromString(content));
            assert.strictEqual(fileStat.name, 'newfile.txt');
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), content);
        });
        test('writeFile - locked files and unlocking', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 8192 /* FileSystemProviderCapabilities.FileWriteUnlock */);
            return testLockedFiles(false);
        });
        test('writeFile (stream) - locked files and unlocking', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ | 8192 /* FileSystemProviderCapabilities.FileWriteUnlock */);
            return testLockedFiles(false);
        });
        test('writeFile - locked files and unlocking throws error when missing capability', async () => {
            setCapabilities(fileProvider, 2 /* FileSystemProviderCapabilities.FileReadWrite */);
            return testLockedFiles(true);
        });
        test('writeFile (stream) - locked files and unlocking throws error when missing capability', async () => {
            setCapabilities(fileProvider, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
            return testLockedFiles(true);
        });
        async function testLockedFiles(expectError) {
            const lockedFile = uri_1.URI.file((0, path_1.join)(testDir, 'my-locked-file'));
            const content = await service.writeFile(lockedFile, buffer_1.VSBuffer.fromString('Locked File'));
            assert.strictEqual(content.locked, false);
            const stats = await pfs_1.Promises.stat(lockedFile.fsPath);
            await pfs_1.Promises.chmod(lockedFile.fsPath, stats.mode & ~0o200);
            let stat = await service.stat(lockedFile);
            assert.strictEqual(stat.locked, true);
            let error;
            const newContent = 'Updates to locked file';
            try {
                await service.writeFile(lockedFile, buffer_1.VSBuffer.fromString(newContent));
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
            error = undefined;
            if (expectError) {
                try {
                    await service.writeFile(lockedFile, buffer_1.VSBuffer.fromString(newContent), { unlock: true });
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
            }
            else {
                await service.writeFile(lockedFile, buffer_1.VSBuffer.fromString(newContent), { unlock: true });
                assert.strictEqual((0, fs_1.readFileSync)(lockedFile.fsPath).toString(), newContent);
                stat = await service.stat(lockedFile);
                assert.strictEqual(stat.locked, false);
            }
        }
        test('writeFile (error when folder is encountered)', async () => {
            const resource = uri_1.URI.file(testDir);
            let error = undefined;
            try {
                await service.writeFile(resource, buffer_1.VSBuffer.fromString('File is created including parent'));
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
        });
        test('writeFile (no error when providing up to date etag)', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const stat = await service.resolve(resource);
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = 'Updates to the small file';
            await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            assert.strictEqual((0, fs_1.readFileSync)(resource.fsPath).toString(), newContent);
        });
        test('writeFile - error when writing to file that has been updated meanwhile', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const stat = await service.resolve(resource);
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = 'Updates to the small file';
            await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            const newContentLeadingToError = newContent + newContent;
            const fakeMtime = 1000;
            const fakeSize = 1000;
            let error = undefined;
            try {
                await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContentLeadingToError), { etag: (0, files_1.etag)({ mtime: fakeMtime, size: fakeSize }), mtime: fakeMtime });
            }
            catch (err) {
                error = err;
            }
            assert.ok(error);
            assert.ok(error instanceof files_1.FileOperationError);
            assert.strictEqual(error.fileOperationResult, 3 /* FileOperationResult.FILE_MODIFIED_SINCE */);
        });
        test('writeFile - no error when writing to file where size is the same', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'small.txt'));
            const stat = await service.resolve(resource);
            const content = (0, fs_1.readFileSync)(resource.fsPath).toString();
            assert.strictEqual(content, 'Small File');
            const newContent = content; // same content
            await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });
            const newContentLeadingToNoError = newContent; // writing the same content should be OK
            const fakeMtime = 1000;
            const actualSize = newContent.length;
            let error = undefined;
            try {
                await service.writeFile(resource, buffer_1.VSBuffer.fromString(newContentLeadingToNoError), { etag: (0, files_1.etag)({ mtime: fakeMtime, size: actualSize }), mtime: fakeMtime });
            }
            catch (err) {
                error = err;
            }
            assert.ok(!error);
        });
        test('writeFile - no error when writing to same nonexistent folder multiple times different new files', async () => {
            const newFolder = uri_1.URI.file((0, path_1.join)(testDir, 'some', 'new', 'folder'));
            const file1 = (0, resources_1.joinPath)(newFolder, 'file-1');
            const file2 = (0, resources_1.joinPath)(newFolder, 'file-2');
            const file3 = (0, resources_1.joinPath)(newFolder, 'file-3');
            // this essentially verifies that the mkdirp logic implemented
            // in the file service is able to receive multiple requests for
            // the same folder and will not throw errors if another racing
            // call succeeded first.
            const newContent = 'Updates to the small file';
            await Promise.all([
                service.writeFile(file1, buffer_1.VSBuffer.fromString(newContent)),
                service.writeFile(file2, buffer_1.VSBuffer.fromString(newContent)),
                service.writeFile(file3, buffer_1.VSBuffer.fromString(newContent))
            ]);
            assert.ok(service.exists(file1));
            assert.ok(service.exists(file2));
            assert.ok(service.exists(file3));
        });
        test('writeFile - error when writing to folder that is a file', async () => {
            const existingFile = uri_1.URI.file((0, path_1.join)(testDir, 'my-file'));
            await service.createFile(existingFile);
            const newFile = (0, resources_1.joinPath)(existingFile, 'file-1');
            let error;
            const newContent = 'Updates to the small file';
            try {
                await service.writeFile(newFile, buffer_1.VSBuffer.fromString(newContent));
            }
            catch (e) {
                error = e;
            }
            assert.ok(error);
        });
        test('read - mixed positions', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            // read multiple times from position 0
            let buffer = buffer_1.VSBuffer.alloc(1024);
            let fd = await fileProvider.open(resource, { create: false });
            for (let i = 0; i < 3; i++) {
                await fileProvider.read(fd, 0, buffer.buffer, 0, 26);
                assert.strictEqual(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            }
            await fileProvider.close(fd);
            // read multiple times at various locations
            buffer = buffer_1.VSBuffer.alloc(1024);
            fd = await fileProvider.open(resource, { create: false });
            let posInFile = 0;
            await fileProvider.read(fd, posInFile, buffer.buffer, 0, 26);
            assert.strictEqual(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            posInFile += 26;
            await fileProvider.read(fd, posInFile, buffer.buffer, 0, 1);
            assert.strictEqual(buffer.slice(0, 1).toString(), ',');
            posInFile += 1;
            await fileProvider.read(fd, posInFile, buffer.buffer, 0, 12);
            assert.strictEqual(buffer.slice(0, 12).toString(), ' consectetur');
            posInFile += 12;
            await fileProvider.read(fd, 98 /* no longer in sequence of posInFile */, buffer.buffer, 0, 9);
            assert.strictEqual(buffer.slice(0, 9).toString(), 'fermentum');
            await fileProvider.read(fd, 27, buffer.buffer, 0, 12);
            assert.strictEqual(buffer.slice(0, 12).toString(), ' consectetur');
            await fileProvider.read(fd, 26, buffer.buffer, 0, 1);
            assert.strictEqual(buffer.slice(0, 1).toString(), ',');
            await fileProvider.read(fd, 0, buffer.buffer, 0, 26);
            assert.strictEqual(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            await fileProvider.read(fd, posInFile /* back in sequence */, buffer.buffer, 0, 11);
            assert.strictEqual(buffer.slice(0, 11).toString(), ' adipiscing');
            await fileProvider.close(fd);
        });
        test('write - mixed positions', async () => {
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'lorem.txt'));
            const buffer = buffer_1.VSBuffer.alloc(1024);
            const fdWrite = await fileProvider.open(resource, { create: true, unlock: false });
            const fdRead = await fileProvider.open(resource, { create: false });
            let posInFileWrite = 0;
            let posInFileRead = 0;
            const initialContents = buffer_1.VSBuffer.fromString('Lorem ipsum dolor sit amet');
            await fileProvider.write(fdWrite, posInFileWrite, initialContents.buffer, 0, initialContents.byteLength);
            posInFileWrite += initialContents.byteLength;
            await fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, 26);
            assert.strictEqual(buffer.slice(0, 26).toString(), 'Lorem ipsum dolor sit amet');
            posInFileRead += 26;
            const contents = buffer_1.VSBuffer.fromString('Hello World');
            await fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
            posInFileWrite += contents.byteLength;
            await fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, contents.byteLength);
            assert.strictEqual(buffer.slice(0, contents.byteLength).toString(), 'Hello World');
            posInFileRead += contents.byteLength;
            await fileProvider.write(fdWrite, 6, contents.buffer, 0, contents.byteLength);
            await fileProvider.read(fdRead, 0, buffer.buffer, 0, 11);
            assert.strictEqual(buffer.slice(0, 11).toString(), 'Lorem Hello');
            await fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
            posInFileWrite += contents.byteLength;
            await fileProvider.read(fdRead, posInFileWrite - contents.byteLength, buffer.buffer, 0, contents.byteLength);
            assert.strictEqual(buffer.slice(0, contents.byteLength).toString(), 'Hello World');
            await fileProvider.close(fdWrite);
            await fileProvider.close(fdRead);
        });
        test('readonly - is handled properly for a single resource', async () => {
            fileProvider.setReadonly(true);
            const resource = uri_1.URI.file((0, path_1.join)(testDir, 'index.html'));
            const resolveResult = await service.resolve(resource);
            assert.strictEqual(resolveResult.readonly, true);
            const readResult = await service.readFile(resource);
            assert.strictEqual(readResult.readonly, true);
            let writeFileError = undefined;
            try {
                await service.writeFile(resource, buffer_1.VSBuffer.fromString('Hello Test'));
            }
            catch (error) {
                writeFileError = error;
            }
            assert.ok(writeFileError);
            let deleteFileError = undefined;
            try {
                await service.del(resource);
            }
            catch (error) {
                deleteFileError = error;
            }
            assert.ok(deleteFileError);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTZXJ2aWNlLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvdGVzdC9ub2RlL2Rpc2tGaWxlU2VydmljZS5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyxTQUFTLFNBQVMsQ0FBQyxJQUFlLEVBQUUsSUFBWTtRQUMvQyxJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDakMsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLE9BQWU7UUFDNUMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNwQyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDakIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTztZQUNOLElBQUk7Z0JBQ0gsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUM3QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUMvQixPQUFPLGlCQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNuQyxD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