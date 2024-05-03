/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/stream", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/files/test/common/nullFileSystemProvider", "vs/platform/log/common/log"], function (require, exports, assert, async_1, buffer_1, cancellation_1, event_1, lifecycle_1, resources_1, stream_1, uri_1, utils_1, files_1, fileService_1, nullFileSystemProvider_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('File Service', () => {
        const disposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            disposables.clear();
        });
        test('provider registration', async () => {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const resource = uri_1.URI.parse('test://foo/bar');
            const provider = new nullFileSystemProvider_1.NullFileSystemProvider();
            assert.strictEqual(await service.canHandleResource(resource), false);
            assert.strictEqual(service.hasProvider(resource), false);
            assert.strictEqual(service.getProvider(resource.scheme), undefined);
            const registrations = [];
            disposables.add(service.onDidChangeFileSystemProviderRegistrations(e => {
                registrations.push(e);
            }));
            const capabilityChanges = [];
            disposables.add(service.onDidChangeFileSystemProviderCapabilities(e => {
                capabilityChanges.push(e);
            }));
            let registrationDisposable;
            let callCount = 0;
            disposables.add(service.onWillActivateFileSystemProvider(e => {
                callCount++;
                if (e.scheme === 'test' && callCount === 1) {
                    e.join(new Promise(resolve => {
                        registrationDisposable = service.registerProvider('test', provider);
                        resolve();
                    }));
                }
            }));
            assert.strictEqual(await service.canHandleResource(resource), true);
            assert.strictEqual(service.hasProvider(resource), true);
            assert.strictEqual(service.getProvider(resource.scheme), provider);
            assert.strictEqual(registrations.length, 1);
            assert.strictEqual(registrations[0].scheme, 'test');
            assert.strictEqual(registrations[0].added, true);
            assert.ok(registrationDisposable);
            assert.strictEqual(capabilityChanges.length, 0);
            provider.setCapabilities(8 /* FileSystemProviderCapabilities.FileFolderCopy */);
            assert.strictEqual(capabilityChanges.length, 1);
            provider.setCapabilities(2048 /* FileSystemProviderCapabilities.Readonly */);
            assert.strictEqual(capabilityChanges.length, 2);
            await service.activateProvider('test');
            assert.strictEqual(callCount, 2); // activation is called again
            assert.strictEqual(service.hasCapability(resource, 2048 /* FileSystemProviderCapabilities.Readonly */), true);
            assert.strictEqual(service.hasCapability(resource, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */), false);
            registrationDisposable.dispose();
            assert.strictEqual(await service.canHandleResource(resource), false);
            assert.strictEqual(service.hasProvider(resource), false);
            assert.strictEqual(registrations.length, 2);
            assert.strictEqual(registrations[1].scheme, 'test');
            assert.strictEqual(registrations[1].added, false);
        });
        test('watch', async () => {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            let disposeCounter = 0;
            disposables.add(service.registerProvider('test', new nullFileSystemProvider_1.NullFileSystemProvider(() => {
                return (0, lifecycle_1.toDisposable)(() => {
                    disposeCounter++;
                });
            })));
            await service.activateProvider('test');
            const resource1 = uri_1.URI.parse('test://foo/bar1');
            const watcher1Disposable = service.watch(resource1);
            await (0, async_1.timeout)(0); // service.watch() is async
            assert.strictEqual(disposeCounter, 0);
            watcher1Disposable.dispose();
            assert.strictEqual(disposeCounter, 1);
            disposeCounter = 0;
            const resource2 = uri_1.URI.parse('test://foo/bar2');
            const watcher2Disposable1 = service.watch(resource2);
            const watcher2Disposable2 = service.watch(resource2);
            const watcher2Disposable3 = service.watch(resource2);
            await (0, async_1.timeout)(0); // service.watch() is async
            assert.strictEqual(disposeCounter, 0);
            watcher2Disposable1.dispose();
            assert.strictEqual(disposeCounter, 0);
            watcher2Disposable2.dispose();
            assert.strictEqual(disposeCounter, 0);
            watcher2Disposable3.dispose();
            assert.strictEqual(disposeCounter, 1);
            disposeCounter = 0;
            const resource3 = uri_1.URI.parse('test://foo/bar3');
            const watcher3Disposable1 = service.watch(resource3);
            const watcher3Disposable2 = service.watch(resource3, { recursive: true, excludes: [] });
            const watcher3Disposable3 = service.watch(resource3, { recursive: false, excludes: [], includes: [] });
            await (0, async_1.timeout)(0); // service.watch() is async
            assert.strictEqual(disposeCounter, 0);
            watcher3Disposable1.dispose();
            assert.strictEqual(disposeCounter, 1);
            watcher3Disposable2.dispose();
            assert.strictEqual(disposeCounter, 2);
            watcher3Disposable3.dispose();
            assert.strictEqual(disposeCounter, 3);
            service.dispose();
        });
        test('watch - with corelation', async () => {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const provider = new class extends nullFileSystemProvider_1.NullFileSystemProvider {
                constructor() {
                    super(...arguments);
                    this._testOnDidChangeFile = new event_1.Emitter();
                    this.onDidChangeFile = this._testOnDidChangeFile.event;
                }
                fireFileChange(changes) {
                    this._testOnDidChangeFile.fire(changes);
                }
            };
            disposables.add(service.registerProvider('test', provider));
            await service.activateProvider('test');
            const globalEvents = [];
            disposables.add(service.onDidFilesChange(e => {
                globalEvents.push(e);
            }));
            const watcher0 = disposables.add(service.watch(uri_1.URI.parse('test://watch/folder1'), { recursive: true, excludes: [], includes: [] }));
            assert.strictEqual((0, files_1.isFileSystemWatcher)(watcher0), false);
            const watcher1 = disposables.add(service.watch(uri_1.URI.parse('test://watch/folder2'), { recursive: true, excludes: [], includes: [], correlationId: 100 }));
            assert.strictEqual((0, files_1.isFileSystemWatcher)(watcher1), true);
            const watcher2 = disposables.add(service.watch(uri_1.URI.parse('test://watch/folder3'), { recursive: true, excludes: [], includes: [], correlationId: 200 }));
            assert.strictEqual((0, files_1.isFileSystemWatcher)(watcher2), true);
            const watcher1Events = [];
            disposables.add(watcher1.onDidChange(e => {
                watcher1Events.push(e);
            }));
            const watcher2Events = [];
            disposables.add(watcher2.onDidChange(e => {
                watcher2Events.push(e);
            }));
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder1'), type: 1 /* FileChangeType.ADDED */ }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder2'), type: 1 /* FileChangeType.ADDED */, cId: 100 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder2'), type: 1 /* FileChangeType.ADDED */, cId: 100 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder3/file'), type: 0 /* FileChangeType.UPDATED */, cId: 200 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder3'), type: 0 /* FileChangeType.UPDATED */, cId: 200 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder4'), type: 1 /* FileChangeType.ADDED */, cId: 50 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder4'), type: 1 /* FileChangeType.ADDED */, cId: 60 }]);
            provider.fireFileChange([{ resource: uri_1.URI.parse('test://watch/folder4'), type: 1 /* FileChangeType.ADDED */, cId: 70 }]);
            assert.strictEqual(globalEvents.length, 1);
            assert.strictEqual(watcher1Events.length, 2);
            assert.strictEqual(watcher2Events.length, 2);
        });
        test('error from readFile bubbles through (https://github.com/microsoft/vscode/issues/118060) - async', async () => {
            testReadErrorBubbles(true);
        });
        test('error from readFile bubbles through (https://github.com/microsoft/vscode/issues/118060)', async () => {
            testReadErrorBubbles(false);
        });
        async function testReadErrorBubbles(async) {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const provider = new class extends nullFileSystemProvider_1.NullFileSystemProvider {
                async stat(resource) {
                    return {
                        mtime: Date.now(),
                        ctime: Date.now(),
                        size: 100,
                        type: files_1.FileType.File
                    };
                }
                readFile(resource) {
                    if (async) {
                        return (0, async_1.timeout)(5, cancellation_1.CancellationToken.None).then(() => { throw new Error('failed'); });
                    }
                    throw new Error('failed');
                }
                open(resource, opts) {
                    if (async) {
                        return (0, async_1.timeout)(5, cancellation_1.CancellationToken.None).then(() => { throw new Error('failed'); });
                    }
                    throw new Error('failed');
                }
                readFileStream(resource, opts, token) {
                    if (async) {
                        const stream = (0, stream_1.newWriteableStream)(chunk => chunk[0]);
                        (0, async_1.timeout)(5, cancellation_1.CancellationToken.None).then(() => stream.error(new Error('failed')));
                        return stream;
                    }
                    throw new Error('failed');
                }
            };
            disposables.add(service.registerProvider('test', provider));
            for (const capabilities of [2 /* FileSystemProviderCapabilities.FileReadWrite */, 16 /* FileSystemProviderCapabilities.FileReadStream */, 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */]) {
                provider.setCapabilities(capabilities);
                let e1;
                try {
                    await service.readFile(uri_1.URI.parse('test://foo/bar'));
                }
                catch (error) {
                    e1 = error;
                }
                assert.ok(e1);
                let e2;
                try {
                    const stream = await service.readFileStream(uri_1.URI.parse('test://foo/bar'));
                    await (0, stream_1.consumeStream)(stream.value, chunk => chunk[0]);
                }
                catch (error) {
                    e2 = error;
                }
                assert.ok(e2);
            }
        }
        test('readFile/readFileStream supports cancellation (https://github.com/microsoft/vscode/issues/138805)', async () => {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            let readFileStreamReady = undefined;
            const provider = new class extends nullFileSystemProvider_1.NullFileSystemProvider {
                async stat(resource) {
                    return {
                        mtime: Date.now(),
                        ctime: Date.now(),
                        size: 100,
                        type: files_1.FileType.File
                    };
                }
                readFileStream(resource, opts, token) {
                    const stream = (0, stream_1.newWriteableStream)(chunk => chunk[0]);
                    disposables.add(token.onCancellationRequested(() => {
                        stream.error(new Error('Expected cancellation'));
                        stream.end();
                    }));
                    readFileStreamReady.complete();
                    return stream;
                }
            };
            disposables.add(service.registerProvider('test', provider));
            provider.setCapabilities(16 /* FileSystemProviderCapabilities.FileReadStream */);
            let e1;
            try {
                const cts = new cancellation_1.CancellationTokenSource();
                readFileStreamReady = new async_1.DeferredPromise();
                const promise = service.readFile(uri_1.URI.parse('test://foo/bar'), undefined, cts.token);
                await Promise.all([readFileStreamReady.p.then(() => cts.cancel()), promise]);
            }
            catch (error) {
                e1 = error;
            }
            assert.ok(e1);
            let e2;
            try {
                const cts = new cancellation_1.CancellationTokenSource();
                readFileStreamReady = new async_1.DeferredPromise();
                const stream = await service.readFileStream(uri_1.URI.parse('test://foo/bar'), undefined, cts.token);
                await Promise.all([readFileStreamReady.p.then(() => cts.cancel()), (0, stream_1.consumeStream)(stream.value, chunk => chunk[0])]);
            }
            catch (error) {
                e2 = error;
            }
            assert.ok(e2);
        });
        test('enforced atomic read/write/delete', async () => {
            const service = disposables.add(new fileService_1.FileService(new log_1.NullLogService()));
            const atomicResource = uri_1.URI.parse('test://foo/bar/atomic');
            const nonAtomicResource = uri_1.URI.parse('test://foo/nonatomic');
            let atomicReadCounter = 0;
            let atomicWriteCounter = 0;
            let atomicDeleteCounter = 0;
            const provider = new class extends nullFileSystemProvider_1.NullFileSystemProvider {
                async stat(resource) {
                    return {
                        type: files_1.FileType.File,
                        ctime: Date.now(),
                        mtime: Date.now(),
                        size: 0
                    };
                }
                async readFile(resource, opts) {
                    if (opts?.atomic) {
                        atomicReadCounter++;
                    }
                    return new Uint8Array();
                }
                readFileStream(resource, opts, token) {
                    return (0, stream_1.newWriteableStream)(chunk => chunk[0]);
                }
                enforceAtomicReadFile(resource) {
                    return (0, resources_1.isEqual)(resource, atomicResource);
                }
                async writeFile(resource, content, opts) {
                    if (opts.atomic) {
                        atomicWriteCounter++;
                    }
                }
                enforceAtomicWriteFile(resource) {
                    return (0, resources_1.isEqual)(resource, atomicResource) ? { postfix: '.tmp' } : false;
                }
                async delete(resource, opts) {
                    if (opts.atomic) {
                        atomicDeleteCounter++;
                    }
                }
                enforceAtomicDelete(resource) {
                    return (0, resources_1.isEqual)(resource, atomicResource) ? { postfix: '.tmp' } : false;
                }
            };
            provider.setCapabilities(2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                16 /* FileSystemProviderCapabilities.FileReadStream */ |
                16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                65536 /* FileSystemProviderCapabilities.FileAtomicDelete */);
            disposables.add(service.registerProvider('test', provider));
            await service.readFile(atomicResource);
            await service.readFile(nonAtomicResource);
            await service.readFileStream(atomicResource);
            await service.readFileStream(nonAtomicResource);
            await service.writeFile(atomicResource, buffer_1.VSBuffer.fromString(''));
            await service.writeFile(nonAtomicResource, buffer_1.VSBuffer.fromString(''));
            await service.writeFile(atomicResource, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('')));
            await service.writeFile(nonAtomicResource, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('')));
            await service.writeFile(atomicResource, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('')));
            await service.writeFile(nonAtomicResource, (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString('')));
            await service.del(atomicResource);
            await service.del(nonAtomicResource);
            assert.strictEqual(atomicReadCounter, 2);
            assert.strictEqual(atomicWriteCounter, 3);
            assert.strictEqual(atomicDeleteCounter, 1);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvdGVzdC9icm93c2VyL2ZpbGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFpQmhHLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBRTFCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDYixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUJBQXVCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEMsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlCQUFXLENBQUMsSUFBSSxvQkFBYyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sUUFBUSxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM3QyxNQUFNLFFBQVEsR0FBRyxJQUFJLCtDQUFzQixFQUFFLENBQUM7WUFFOUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVwRSxNQUFNLGFBQWEsR0FBMkMsRUFBRSxDQUFDO1lBQ2pFLFdBQVcsQ0FBQyxH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