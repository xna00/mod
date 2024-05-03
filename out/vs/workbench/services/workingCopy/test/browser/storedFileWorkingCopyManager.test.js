/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/workingCopy/common/storedFileWorkingCopyManager", "vs/base/common/buffer", "vs/platform/files/common/files", "vs/base/common/async", "vs/workbench/services/workingCopy/test/browser/storedFileWorkingCopy.test", "vs/base/common/cancellation", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, workbenchTestServices_1, storedFileWorkingCopyManager_1, buffer_1, files_1, async_1, storedFileWorkingCopy_test_1, cancellation_1, inMemoryFilesystemProvider_1, lifecycle_1, platform_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StoredFileWorkingCopyManager', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        let manager;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            manager = disposables.add(new storedFileWorkingCopyManager_1.StoredFileWorkingCopyManager('testStoredFileWorkingCopyType', new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService));
        });
        teardown(() => {
            for (const workingCopy of manager.workingCopies) {
                workingCopy.dispose();
            }
            disposables.clear();
        });
        test('resolve', async () => {
            const resource = uri_1.URI.file('/test.html');
            const events = [];
            const listener = manager.onDidCreate(workingCopy => {
                events.push(workingCopy);
            });
            const resolvePromise = manager.resolve(resource);
            assert.ok(manager.get(resource)); // working copy known even before resolved()
            assert.strictEqual(manager.workingCopies.length, 1);
            const workingCopy1 = await resolvePromise;
            assert.ok(workingCopy1);
            assert.ok(workingCopy1.model);
            assert.strictEqual(workingCopy1.typeId, 'testStoredFileWorkingCopyType');
            assert.strictEqual(workingCopy1.resource.toString(), resource.toString());
            assert.strictEqual(manager.get(resource), workingCopy1);
            const workingCopy2 = await manager.resolve(resource);
            assert.strictEqual(workingCopy2, workingCopy1);
            assert.strictEqual(manager.workingCopies.length, 1);
            workingCopy1.dispose();
            const workingCopy3 = await manager.resolve(resource);
            assert.notStrictEqual(workingCopy3, workingCopy2);
            assert.strictEqual(manager.workingCopies.length, 1);
            assert.strictEqual(manager.get(resource), workingCopy3);
            workingCopy3.dispose();
            assert.strictEqual(manager.workingCopies.length, 0);
            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].resource.toString(), workingCopy1.resource.toString());
            assert.strictEqual(events[1].resource.toString(), workingCopy2.resource.toString());
            listener.dispose();
            workingCopy1.dispose();
            workingCopy2.dispose();
            workingCopy3.dispose();
        });
        test('resolve (async)', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            disposables.add(await manager.resolve(resource));
            let didResolve = false;
            let onDidResolve = new Promise(resolve => {
                disposables.add(manager.onDidResolve(({ model }) => {
                    if (model?.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                }));
            });
            const resolve = manager.resolve(resource, { reload: { async: true } });
            await onDidResolve;
            assert.strictEqual(didResolve, true);
            didResolve = false;
            onDidResolve = new Promise(resolve => {
                disposables.add(manager.onDidResolve(({ model }) => {
                    if (model?.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                }));
            });
            manager.resolve(resource, { reload: { async: true, force: true } });
            await onDidResolve;
            assert.strictEqual(didResolve, true);
            disposables.add(await resolve);
        });
        test('resolve (sync)', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            let didResolve = false;
            disposables.add(manager.onDidResolve(({ model }) => {
                if (model?.resource.toString() === resource.toString()) {
                    didResolve = true;
                }
            }));
            disposables.add(await manager.resolve(resource, { reload: { async: false } }));
            assert.strictEqual(didResolve, true);
            didResolve = false;
            disposables.add(await manager.resolve(resource, { reload: { async: false, force: true } }));
            assert.strictEqual(didResolve, true);
        });
        test('resolve (sync) - model disposed when error and first call to resolve', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            accessor.fileService.readShouldThrowError = new files_1.FileOperationError('fail', 10 /* FileOperationResult.FILE_OTHER_ERROR */);
            try {
                let error = undefined;
                try {
                    await manager.resolve(resource);
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
                assert.strictEqual(manager.workingCopies.length, 0);
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
        });
        test('resolve (sync) - model not disposed when error and model existed before', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            disposables.add(await manager.resolve(resource));
            accessor.fileService.readShouldThrowError = new files_1.FileOperationError('fail', 10 /* FileOperationResult.FILE_OTHER_ERROR */);
            try {
                let error = undefined;
                try {
                    await manager.resolve(resource, { reload: { async: false } });
                }
                catch (e) {
                    error = e;
                }
                assert.ok(error);
                assert.strictEqual(manager.workingCopies.length, 1);
            }
            finally {
                accessor.fileService.readShouldThrowError = undefined;
            }
        });
        test('resolve with initial contents', async () => {
            const resource = uri_1.URI.file('/test.html');
            const workingCopy = await manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')) });
            assert.strictEqual(workingCopy.model?.contents, 'Hello World');
            assert.strictEqual(workingCopy.isDirty(), true);
            await manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('More Changes')) });
            assert.strictEqual(workingCopy.model?.contents, 'More Changes');
            assert.strictEqual(workingCopy.isDirty(), true);
            workingCopy.dispose();
        });
        test('multiple resolves execute in sequence (same resources)', async () => {
            const resource = uri_1.URI.file('/test.html');
            const firstPromise = manager.resolve(resource);
            const secondPromise = manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')) });
            const thirdPromise = manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('More Changes')) });
            await firstPromise;
            await secondPromise;
            const workingCopy = await thirdPromise;
            assert.strictEqual(workingCopy.model?.contents, 'More Changes');
            assert.strictEqual(workingCopy.isDirty(), true);
            workingCopy.dispose();
        });
        test('multiple resolves execute in parallel (different resources)', async () => {
            const resource1 = uri_1.URI.file('/test1.html');
            const resource2 = uri_1.URI.file('/test2.html');
            const resource3 = uri_1.URI.file('/test3.html');
            const firstPromise = manager.resolve(resource1);
            const secondPromise = manager.resolve(resource2);
            const thirdPromise = manager.resolve(resource3);
            const [workingCopy1, workingCopy2, workingCopy3] = await Promise.all([firstPromise, secondPromise, thirdPromise]);
            assert.strictEqual(manager.workingCopies.length, 3);
            assert.strictEqual(workingCopy1.resource.toString(), resource1.toString());
            assert.strictEqual(workingCopy2.resource.toString(), resource2.toString());
            assert.strictEqual(workingCopy3.resource.toString(), resource3.toString());
            workingCopy1.dispose();
            workingCopy2.dispose();
            workingCopy3.dispose();
        });
        test('removed from cache when working copy or model gets disposed', async () => {
            const resource = uri_1.URI.file('/test.html');
            let workingCopy = await manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')) });
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), workingCopy);
            workingCopy.dispose();
            assert(!manager.get(uri_1.URI.file('/test.html')));
            workingCopy = await manager.resolve(resource, { contents: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello World')) });
            assert.strictEqual(manager.get(uri_1.URI.file('/test.html')), workingCopy);
            workingCopy.model?.dispose();
            assert(!manager.get(uri_1.URI.file('/test.html')));
        });
        test('events', async () => {
            const resource1 = uri_1.URI.file('/path/index.txt');
            const resource2 = uri_1.URI.file('/path/other.txt');
            let createdCounter = 0;
            let resolvedCounter = 0;
            let removedCounter = 0;
            let gotDirtyCounter = 0;
            let gotNonDirtyCounter = 0;
            let revertedCounter = 0;
            let savedCounter = 0;
            let saveErrorCounter = 0;
            disposables.add(manager.onDidCreate(() => {
                createdCounter++;
            }));
            disposables.add(manager.onDidRemove(resource => {
                if (resource.toString() === resource1.toString() || resource.toString() === resource2.toString()) {
                    removedCounter++;
                }
            }));
            disposables.add(manager.onDidResolve(workingCopy => {
                if (workingCopy.resource.toString() === resource1.toString()) {
                    resolvedCounter++;
                }
            }));
            disposables.add(manager.onDidChangeDirty(workingCopy => {
                if (workingCopy.resource.toString() === resource1.toString()) {
                    if (workingCopy.isDirty()) {
                        gotDirtyCounter++;
                    }
                    else {
                        gotNonDirtyCounter++;
                    }
                }
            }));
            disposables.add(manager.onDidRevert(workingCopy => {
                if (workingCopy.resource.toString() === resource1.toString()) {
                    revertedCounter++;
                }
            }));
            let lastSaveEvent = undefined;
            disposables.add(manager.onDidSave((e) => {
                if (e.workingCopy.resource.toString() === resource1.toString()) {
                    lastSaveEvent = e;
                    savedCounter++;
                }
            }));
            disposables.add(manager.onDidSaveError(workingCopy => {
                if (workingCopy.resource.toString() === resource1.toString()) {
                    saveErrorCounter++;
                }
            }));
            const workingCopy1 = disposables.add(await manager.resolve(resource1));
            assert.strictEqual(resolvedCounter, 1);
            assert.strictEqual(createdCounter, 1);
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 2 /* FileChangeType.DELETED */ }], false));
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource: resource1, type: 1 /* FileChangeType.ADDED */ }], false));
            const workingCopy2 = disposables.add(await manager.resolve(resource2));
            assert.strictEqual(resolvedCounter, 2);
            assert.strictEqual(createdCounter, 2);
            workingCopy1.model?.updateContents('changed');
            await workingCopy1.revert();
            workingCopy1.model?.updateContents('changed again');
            await workingCopy1.save();
            try {
                accessor.fileService.writeShouldThrowError = new files_1.FileOperationError('write error', 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
                await workingCopy1.save({ force: true });
            }
            finally {
                accessor.fileService.writeShouldThrowError = undefined;
            }
            workingCopy1.dispose();
            workingCopy2.dispose();
            await workingCopy1.revert();
            assert.strictEqual(removedCounter, 2);
            assert.strictEqual(gotDirtyCounter, 3);
            assert.strictEqual(gotNonDirtyCounter, 2);
            assert.strictEqual(revertedCounter, 1);
            assert.strictEqual(savedCounter, 1);
            assert.strictEqual(lastSaveEvent.workingCopy, workingCopy1);
            assert.ok(lastSaveEvent.stat);
            assert.strictEqual(saveErrorCounter, 1);
            assert.strictEqual(createdCounter, 2);
            workingCopy1.dispose();
            workingCopy2.dispose();
        });
        test('resolve registers as working copy and dispose clears', async () => {
            const resource1 = uri_1.URI.file('/test1.html');
            const resource2 = uri_1.URI.file('/test2.html');
            const resource3 = uri_1.URI.file('/test3.html');
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            const firstPromise = manager.resolve(resource1);
            const secondPromise = manager.resolve(resource2);
            const thirdPromise = manager.resolve(resource3);
            await Promise.all([firstPromise, secondPromise, thirdPromise]);
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 3);
            assert.strictEqual(manager.workingCopies.length, 3);
            manager.dispose();
            assert.strictEqual(manager.workingCopies.length, 0);
            // dispose does not remove from working copy service, only `destroy` should
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 3);
            disposables.add(await firstPromise);
            disposables.add(await secondPromise);
            disposables.add(await thirdPromise);
        });
        test('destroy', async () => {
            const resource1 = uri_1.URI.file('/test1.html');
            const resource2 = uri_1.URI.file('/test2.html');
            const resource3 = uri_1.URI.file('/test3.html');
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            const firstPromise = manager.resolve(resource1);
            const secondPromise = manager.resolve(resource2);
            const thirdPromise = manager.resolve(resource3);
            await Promise.all([firstPromise, secondPromise, thirdPromise]);
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 3);
            assert.strictEqual(manager.workingCopies.length, 3);
            await manager.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.workingCopies.length, 0);
        });
        test('destroy saves dirty working copies', async () => {
            const resource = uri_1.URI.file('/path/source.txt');
            const workingCopy = await manager.resolve(resource);
            let saved = false;
            disposables.add(workingCopy.onDidSave(() => {
                saved = true;
            }));
            workingCopy.model?.updateContents('hello create');
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 1);
            assert.strictEqual(manager.workingCopies.length, 1);
            await manager.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.workingCopies.length, 0);
            assert.strictEqual(saved, true);
        });
        test('destroy falls back to using backup when save fails', async () => {
            const resource = uri_1.URI.file('/path/source.txt');
            const workingCopy = await manager.resolve(resource);
            workingCopy.model?.setThrowOnSnapshot();
            let unexpectedSave = false;
            disposables.add(workingCopy.onDidSave(() => {
                unexpectedSave = true;
            }));
            workingCopy.model?.updateContents('hello create');
            assert.strictEqual(workingCopy.isDirty(), true);
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 1);
            assert.strictEqual(manager.workingCopies.length, 1);
            assert.strictEqual(accessor.workingCopyBackupService.resolved.has(workingCopy), true);
            await manager.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.workingCopies.length, 0);
            assert.strictEqual(unexpectedSave, false);
        });
        test('file change event triggers working copy resolve', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            await manager.resolve(resource);
            let didResolve = false;
            const onDidResolve = new Promise(resolve => {
                disposables.add(manager.onDidResolve(({ model }) => {
                    if (model?.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                }));
            });
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
        test('file change event triggers working copy resolve (when working copy is pending to resolve)', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            manager.resolve(resource);
            let didResolve = false;
            let resolvedCounter = 0;
            const onDidResolve = new Promise(resolve => {
                disposables.add(manager.onDidResolve(({ model }) => {
                    if (model?.resource.toString() === resource.toString()) {
                        resolvedCounter++;
                        if (resolvedCounter === 2) {
                            didResolve = true;
                            resolve();
                        }
                    }
                }));
            });
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
        test('file system provider change triggers working copy resolve', async () => {
            const resource = uri_1.URI.file('/path/index.txt');
            disposables.add(await manager.resolve(resource));
            let didResolve = false;
            const onDidResolve = new Promise(resolve => {
                disposables.add(manager.onDidResolve(({ model }) => {
                    if (model?.resource.toString() === resource.toString()) {
                        didResolve = true;
                        resolve();
                    }
                }));
            });
            accessor.fileService.fireFileSystemProviderCapabilitiesChangeEvent({ provider: disposables.add(new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider()), scheme: resource.scheme });
            await onDidResolve;
            assert.strictEqual(didResolve, true);
        });
        test('working copy file event handling: create', async () => {
            const resource = uri_1.URI.file('/path/source.txt');
            const workingCopy = await manager.resolve(resource);
            workingCopy.model?.updateContents('hello create');
            assert.strictEqual(workingCopy.isDirty(), true);
            await accessor.workingCopyFileService.create([{ resource }], cancellation_1.CancellationToken.None);
            assert.strictEqual(workingCopy.isDirty(), false);
        });
        test('working copy file event handling: move', () => {
            return testMoveCopyFileWorkingCopy(true);
        });
        test('working copy file event handling: copy', () => {
            return testMoveCopyFileWorkingCopy(false);
        });
        async function testMoveCopyFileWorkingCopy(move) {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/other.txt');
            const sourceWorkingCopy = await manager.resolve(source);
            sourceWorkingCopy.model?.updateContents('hello move or copy');
            assert.strictEqual(sourceWorkingCopy.isDirty(), true);
            if (move) {
                await accessor.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
            }
            else {
                await accessor.workingCopyFileService.copy([{ file: { source, target } }], cancellation_1.CancellationToken.None);
            }
            const targetWorkingCopy = await manager.resolve(target);
            assert.strictEqual(targetWorkingCopy.isDirty(), true);
            assert.strictEqual(targetWorkingCopy.model?.contents, 'hello move or copy');
        }
        test('working copy file event handling: delete', async () => {
            const resource = uri_1.URI.file('/path/source.txt');
            const workingCopy = await manager.resolve(resource);
            workingCopy.model?.updateContents('hello delete');
            assert.strictEqual(workingCopy.isDirty(), true);
            await accessor.workingCopyFileService.delete([{ resource }], cancellation_1.CancellationToken.None);
            assert.strictEqual(workingCopy.isDirty(), false);
        });
        test('working copy file event handling: move to same resource', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const sourceWorkingCopy = await manager.resolve(source);
            sourceWorkingCopy.model?.updateContents('hello move');
            assert.strictEqual(sourceWorkingCopy.isDirty(), true);
            await accessor.workingCopyFileService.move([{ file: { source, target: source } }], cancellation_1.CancellationToken.None);
            assert.strictEqual(sourceWorkingCopy.isDirty(), true);
            assert.strictEqual(sourceWorkingCopy.model?.contents, 'hello move');
        });
        test('canDispose with dirty working copy', async () => {
            const resource = uri_1.URI.file('/path/index_something.txt');
            const workingCopy = await manager.resolve(resource);
            workingCopy.model?.updateContents('make dirty');
            const canDisposePromise = manager.canDispose(workingCopy);
            assert.ok(canDisposePromise instanceof Promise);
            let canDispose = false;
            (async () => {
                canDispose = await canDisposePromise;
            })();
            assert.strictEqual(canDispose, false);
            workingCopy.revert({ soft: true });
            await (0, async_1.timeout)(0);
            assert.strictEqual(canDispose, true);
            const canDispose2 = manager.canDispose(workingCopy);
            assert.strictEqual(canDispose2, true);
        });
        (platform_1.isWeb ? test.skip : test)('pending saves join on shutdown', async () => {
            const resource1 = uri_1.URI.file('/path/index_something1.txt');
            const resource2 = uri_1.URI.file('/path/index_something2.txt');
            const workingCopy1 = disposables.add(await manager.resolve(resource1));
            workingCopy1.model?.updateContents('make dirty');
            const workingCopy2 = disposables.add(await manager.resolve(resource2));
            workingCopy2.model?.updateContents('make dirty');
            let saved1 = false;
            workingCopy1.save().then(() => {
                saved1 = true;
            });
            let saved2 = false;
            workingCopy2.save().then(() => {
                saved2 = true;
            });
            const event = new workbenchTestServices_1.TestWillShutdownEvent();
            accessor.lifecycleService.fireWillShutdown(event);
            assert.ok(event.value.length > 0);
            await Promise.all(event.value);
            assert.strictEqual(saved1, true);
            assert.strictEqual(saved2, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmVkRmlsZVdvcmtpbmdDb3B5TWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9icm93c2VyL3N0b3JlZEZpbGVXb3JraW5nQ29weU1hbmFnZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtRQUUxQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxJQUFJLE9BQXNFLENBQUM7UUFFM0UsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztZQUVwRSxPQUFPLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJEQUE0QixDQUN6RCwrQkFBK0IsRUFDL0IsSUFBSSxrRUFBcUMsRUFBRSxFQUMzQyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQzNGLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsd0JBQXdCLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUMvRixRQUFRLENBQUMseUJBQXlCLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxtQkFBbUIsRUFDN0YsUUFBUSxDQUFDLHdCQUF3QixFQUFFLFFBQVEsQ0FBQyxhQUFh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