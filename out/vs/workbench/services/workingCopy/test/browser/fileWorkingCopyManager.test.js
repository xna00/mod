/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/base/common/buffer", "vs/workbench/services/workingCopy/test/browser/storedFileWorkingCopy.test", "vs/base/common/network", "vs/workbench/services/workingCopy/common/fileWorkingCopyManager", "vs/workbench/services/workingCopy/test/browser/untitledFileWorkingCopy.test", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, workbenchTestServices_1, storedFileWorkingCopy_1, buffer_1, storedFileWorkingCopy_test_1, network_1, fileWorkingCopyManager_1, untitledFileWorkingCopy_test_1, untitledFileWorkingCopy_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FileWorkingCopyManager', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        let manager;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            accessor.fileService.registerProvider(network_1.Schemas.file, new workbenchTestServices_1.TestInMemoryFileSystemProvider());
            accessor.fileService.registerProvider(network_1.Schemas.vscodeRemote, new workbenchTestServices_1.TestInMemoryFileSystemProvider());
            manager = disposables.add(new fileWorkingCopyManager_1.FileWorkingCopyManager('testFileWorkingCopyType', new storedFileWorkingCopy_test_1.TestStoredFileWorkingCopyModelFactory(), new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModelFactory(), accessor.fileService, accessor.lifecycleService, accessor.labelService, accessor.logService, accessor.workingCopyFileService, accessor.workingCopyBackupService, accessor.uriIdentityService, accessor.fileDialogService, accessor.filesConfigurationService, accessor.workingCopyService, accessor.notificationService, accessor.workingCopyEditorService, accessor.editorService, accessor.elevatedFileService, accessor.pathService, accessor.environmentService, accessor.dialogService, accessor.decorationsService));
        });
        teardown(() => {
            disposables.clear();
        });
        test('onDidCreate, get, workingCopies', async () => {
            let createCounter = 0;
            disposables.add(manager.onDidCreate(e => {
                createCounter++;
            }));
            const fileUri = uri_1.URI.file('/test.html');
            assert.strictEqual(manager.workingCopies.length, 0);
            assert.strictEqual(manager.get(fileUri), undefined);
            const fileWorkingCopy = await manager.resolve(fileUri);
            const untitledFileWorkingCopy = await manager.resolve();
            assert.strictEqual(manager.workingCopies.length, 2);
            assert.strictEqual(createCounter, 2);
            assert.strictEqual(manager.get(fileWorkingCopy.resource), fileWorkingCopy);
            assert.strictEqual(manager.get(untitledFileWorkingCopy.resource), untitledFileWorkingCopy);
            const sameFileWorkingCopy = disposables.add(await manager.resolve(fileUri));
            const sameUntitledFileWorkingCopy = disposables.add(await manager.resolve({ untitledResource: untitledFileWorkingCopy.resource }));
            assert.strictEqual(sameFileWorkingCopy, fileWorkingCopy);
            assert.strictEqual(sameUntitledFileWorkingCopy, untitledFileWorkingCopy);
            assert.strictEqual(manager.workingCopies.length, 2);
            assert.strictEqual(createCounter, 2);
        });
        test('resolve', async () => {
            const fileWorkingCopy = disposables.add(await manager.resolve(uri_1.URI.file('/test.html')));
            assert.ok(fileWorkingCopy instanceof storedFileWorkingCopy_1.StoredFileWorkingCopy);
            assert.strictEqual(await manager.stored.resolve(fileWorkingCopy.resource), fileWorkingCopy);
            const untitledFileWorkingCopy = disposables.add(await manager.resolve());
            assert.ok(untitledFileWorkingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy);
            assert.strictEqual(await manager.untitled.resolve({ untitledResource: untitledFileWorkingCopy.resource }), untitledFileWorkingCopy);
            assert.strictEqual(await manager.resolve(untitledFileWorkingCopy.resource), untitledFileWorkingCopy);
        });
        test('destroy', async () => {
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            await manager.resolve(uri_1.URI.file('/test.html'));
            await manager.resolve({ contents: { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString('Hello Untitled')) } });
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 2);
            assert.strictEqual(manager.stored.workingCopies.length, 1);
            assert.strictEqual(manager.untitled.workingCopies.length, 1);
            await manager.destroy();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
            assert.strictEqual(manager.stored.workingCopies.length, 0);
            assert.strictEqual(manager.untitled.workingCopies.length, 0);
        });
        test('saveAs - file (same target, unresolved source, unresolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, false, false);
        });
        test('saveAs - file (same target, different case, unresolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, false, false);
        });
        test('saveAs - file (different target, unresolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, false, false);
        });
        test('saveAs - file (same target, resolved source, unresolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, true, false);
        });
        test('saveAs - file (same target, different case, resolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, true, false);
        });
        test('saveAs - file (different target, resolved source, unresolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, true, false);
        });
        test('saveAs - file (same target, unresolved source, resolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, false, true);
        });
        test('saveAs - file (same target, different case, unresolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/SOURCE.txt');
            return testSaveAsFile(source, target, false, true);
        });
        test('saveAs - file (different target, unresolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, false, true);
        });
        test('saveAs - file (same target, resolved source, resolved target)', () => {
            const source = uri_1.URI.file('/path/source.txt');
            return testSaveAsFile(source, source, true, true);
        });
        test('saveAs - file (different target, resolved source, resolved target)', async () => {
            const source = uri_1.URI.file('/path/source.txt');
            const target = uri_1.URI.file('/path/target.txt');
            return testSaveAsFile(source, target, true, true);
        });
        async function testSaveAsFile(source, target, resolveSource, resolveTarget) {
            let sourceWorkingCopy = undefined;
            if (resolveSource) {
                sourceWorkingCopy = disposables.add(await manager.resolve(source));
                sourceWorkingCopy.model?.updateContents('hello world');
                assert.ok(sourceWorkingCopy.isDirty());
            }
            let targetWorkingCopy = undefined;
            if (resolveTarget) {
                targetWorkingCopy = disposables.add(await manager.resolve(target));
                targetWorkingCopy.model?.updateContents('hello world');
                assert.ok(targetWorkingCopy.isDirty());
            }
            const result = await manager.saveAs(source, target);
            if (accessor.uriIdentityService.extUri.isEqual(source, target) && resolveSource) {
                // if the uris are considered equal (different case on macOS/Windows)
                // and the source is to be resolved, the resulting working copy resource
                // will be the source resource because we consider file working copies
                // the same in that case
                assert.strictEqual(source.toString(), result?.resource.toString());
            }
            else {
                if (resolveSource || resolveTarget) {
                    assert.strictEqual(target.toString(), result?.resource.toString());
                }
                else {
                    if (accessor.uriIdentityService.extUri.isEqual(source, target)) {
                        assert.strictEqual(undefined, result);
                    }
                    else {
                        assert.strictEqual(target.toString(), result?.resource.toString());
                    }
                }
            }
            if (resolveSource) {
                assert.strictEqual(sourceWorkingCopy?.isDirty(), false);
            }
            if (resolveTarget) {
                assert.strictEqual(targetWorkingCopy?.isDirty(), false);
            }
            result?.dispose();
        }
        test('saveAs - untitled (without associated resource)', async () => {
            const workingCopy = disposables.add(await manager.resolve());
            workingCopy.model?.updateContents('Simple Save As');
            const target = uri_1.URI.file('simple/file.txt');
            accessor.fileDialogService.setPickFileToSave(target);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result?.resource.toString(), target.toString());
            assert.strictEqual((result?.model).contents, 'Simple Save As');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            result?.dispose();
        });
        test('saveAs - untitled (with associated resource)', async () => {
            const workingCopy = disposables.add(await manager.resolve({ associatedResource: { path: '/some/associated.txt' } }));
            workingCopy.model?.updateContents('Simple Save As with associated resource');
            const target = uri_1.URI.from({ scheme: network_1.Schemas.file, path: '/some/associated.txt' });
            accessor.fileService.notExistsSet.set(target, true);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result?.resource.toString(), target.toString());
            assert.strictEqual((result?.model).contents, 'Simple Save As with associated resource');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            result?.dispose();
        });
        test('saveAs - untitled (target exists and is resolved)', async () => {
            const workingCopy = disposables.add(await manager.resolve());
            workingCopy.model?.updateContents('Simple Save As');
            const target = uri_1.URI.file('simple/file.txt');
            const targetFileWorkingCopy = await manager.resolve(target);
            accessor.fileDialogService.setPickFileToSave(target);
            const result = await manager.saveAs(workingCopy.resource, undefined);
            assert.strictEqual(result, targetFileWorkingCopy);
            assert.strictEqual((result?.model).contents, 'Simple Save As');
            assert.strictEqual(manager.untitled.get(workingCopy.resource), undefined);
            result?.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVdvcmtpbmdDb3B5TWFuYWdlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvdGVzdC9icm93c2VyL2ZpbGVXb3JraW5nQ29weU1hbmFnZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtRQUVwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUMxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUVsQyxJQUFJLE9BQWtHLENBQUM7UUFFdkcsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztZQUVwRSxRQUFRLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLGlCQUFPLENBQUMsSUFBSSxFQUFFLElBQUksc0RBQThCLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLFFBQVEsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsaUJBQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxzREFBOEIsRUFBRSxDQUFDLENBQUM7WUFFbEcsT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSwrQ0FBc0IsQ0FDbkQseUJBQXlCLEVBQ3pCLElBQUksa0VBQXFDLEVBQUUsRUFDM0MsSUFBSSxzRUFBdUMsRUFBRSxFQUM3QyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQzNGLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLENBQUMsd0JBQXdCLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsRUFDM0gsUUFBUSxDQUFDLHlCQUF5QixFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsbUJBQW1CLEVBQzdGLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxRQUFRLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUM3RyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQ2hGLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNsRCxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdEIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN2QyxhQUFhLEVBQUUsQ0FBQztZQUNqQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxPQUFPLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUV2QyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUVwRCxNQUFNLGVBQWUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkQsTUFBTSx1QkFBdUIsR0FBRyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUV4RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFFM0YsTUFBTSxtQkFBbUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzVFLE1BQU0sMkJBQTJCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkksTUFBTSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsV0FBVyxDQUFDLDJCQUEyQixFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRCxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUIsTUFBTSxlQUFlLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkYsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLFlBQVksNkNBQXFCLENBQUMsQ0FBQztZQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1lBRTVGLE1BQU0sdUJBQXVCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxFQUFFLENBQUMsdUJBQXVCLFlBQVksaURBQXVCLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDcEksTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUN0RyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV4RSxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFBLHVCQUFjLEVBQUMsaUJBQVEsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXRHLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFN0QsTUFBTSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFeEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtRUFBbUUsRUFBRSxHQUFHLEVBQUU7WUFDOUUsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTVDLE9BQU8sY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1GQUFtRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BHLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFNUMsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0VBQXdFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekYsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUU1QyxPQUFPLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7WUFDNUUsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTVDLE9BQU8sY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlGQUFpRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xHLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFNUMsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0VBQXNFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkYsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUU1QyxPQUFPLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpRUFBaUUsRUFBRSxHQUFHLEVBQUU7WUFDNUUsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTVDLE9BQU8sY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlGQUFpRixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xHLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFNUMsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsc0VBQXNFLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkYsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUU1QyxPQUFPLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrREFBK0QsRUFBRSxHQUFHLEVBQUU7WUFDMUUsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBRTVDLE9BQU8sY0FBYyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9FQUFvRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JGLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM1QyxNQUFNLE1BQU0sR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFNUMsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxLQUFLLFVBQVUsY0FBYyxDQUFDLE1BQVcsRUFBRSxNQUFXLEVBQUUsYUFBc0IsRUFBRSxhQUFzQjtZQUNyRyxJQUFJLGlCQUFpQixHQUF1RSxTQUFTLENBQUM7WUFDdEcsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxJQUFJLGlCQUFpQixHQUF1RSxTQUFTLENBQUM7WUFDdEcsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsaUJBQWlCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BELElBQUksUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNqRixxRUFBcUU7Z0JBQ3JFLHdFQUF3RTtnQkFDeEUsc0VBQXNFO2dCQUN0RSx3QkFBd0I7Z0JBQ3hCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxhQUFhLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFDcEUsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUM7d0JBQ2hFLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUN2QyxDQUFDO3lCQUFNLENBQUM7d0JBQ1AsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUNwRSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsSUFBSSxhQUFhLEVBQUUsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFFRCxJQUFJLENBQUMsaURBQWlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEUsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFcEQsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzNDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUF3QyxDQUFBLENBQUMsUUFBUSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFFakcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFMUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9ELE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsa0JBQWtCLEVBQUUsRUFBRSxJQUFJLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNySCxXQUFXLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyx5Q0FBeUMsQ0FBQyxDQUFDO1lBRTdFLE1BQU0sTUFBTSxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLENBQUMsQ0FBQztZQUVoRixRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXBELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUVuRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQXdDLENBQUEsQ0FBQyxRQUFRLEVBQUUseUNBQXlDLENBQUMsQ0FBQztZQUUxSCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUUxRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDcEUsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFcEQsTUFBTSxNQUFNLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQzNDLE1BQU0scUJBQXFCLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVELFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUVyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBd0MsQ0FBQSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBRWpHLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRTFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9