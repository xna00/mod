/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/stream", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/workbench/services/workingCopy/test/browser/untitledFileWorkingCopy.test", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, buffer_1, cancellation_1, lifecycle_1, network_1, resources_1, stream_1, uri_1, utils_1, untitledFileWorkingCopy_1, untitledFileWorkingCopy_test_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestUntitledFileWorkingCopyModelFactory = void 0;
    class TestUntitledFileWorkingCopyModelFactory {
        async createModel(resource, contents, token) {
            return new untitledFileWorkingCopy_test_1.TestUntitledFileWorkingCopyModel(resource, (await (0, buffer_1.streamToBuffer)(contents)).toString());
        }
    }
    exports.TestUntitledFileWorkingCopyModelFactory = TestUntitledFileWorkingCopyModelFactory;
    suite('UntitledScratchpadWorkingCopy', () => {
        const factory = new TestUntitledFileWorkingCopyModelFactory();
        const disposables = new lifecycle_1.DisposableStore();
        const resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: 'Untitled-1' });
        let instantiationService;
        let accessor;
        let workingCopy;
        function createWorkingCopy(uri = resource, hasAssociatedFilePath = false, initialValue = '') {
            return disposables.add(new untitledFileWorkingCopy_1.UntitledFileWorkingCopy('testUntitledWorkingCopyType', uri, (0, resources_1.basename)(uri), hasAssociatedFilePath, true, initialValue.length > 0 ? { value: (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(initialValue)) } : undefined, factory, async (workingCopy) => { await workingCopy.revert(); return true; }, accessor.workingCopyService, accessor.workingCopyBackupService, accessor.logService));
        }
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            workingCopy = disposables.add(createWorkingCopy());
        });
        teardown(() => {
            disposables.clear();
        });
        test('registers with working copy service', async () => {
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 1);
            workingCopy.dispose();
            assert.strictEqual(accessor.workingCopyService.workingCopies.length, 0);
        });
        test('modified - not dirty', async () => {
            assert.strictEqual(workingCopy.isDirty(), false);
            let changeDirtyCounter = 0;
            disposables.add(workingCopy.onDidChangeDirty(() => {
                changeDirtyCounter++;
            }));
            let contentChangeCounter = 0;
            disposables.add(workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            }));
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isResolved(), true);
            // Modified from: Model content change
            workingCopy.model?.updateContents('hello modified');
            assert.strictEqual(contentChangeCounter, 1);
            assert.strictEqual(workingCopy.isDirty(), false);
            assert.strictEqual(workingCopy.isModified(), true);
            assert.strictEqual(changeDirtyCounter, 0);
            await workingCopy.save();
            assert.strictEqual(workingCopy.isDirty(), false);
            assert.strictEqual(changeDirtyCounter, 0);
        });
        test('modified - cleared when content event signals isEmpty', async () => {
            assert.strictEqual(workingCopy.isModified(), false);
            await workingCopy.resolve();
            workingCopy.model?.updateContents('hello modified');
            assert.strictEqual(workingCopy.isModified(), true);
            workingCopy.model?.fireContentChangeEvent({ isInitial: true });
            assert.strictEqual(workingCopy.isModified(), false);
        });
        test('modified - not cleared when content event signals isEmpty when associated resource', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, true);
            await workingCopy.resolve();
            workingCopy.model?.updateContents('hello modified');
            assert.strictEqual(workingCopy.isModified(), true);
            workingCopy.model?.fireContentChangeEvent({ isInitial: true });
            assert.strictEqual(workingCopy.isModified(), true);
        });
        test('revert', async () => {
            let revertCounter = 0;
            disposables.add(workingCopy.onDidRevert(() => {
                revertCounter++;
            }));
            let disposeCounter = 0;
            disposables.add(workingCopy.onWillDispose(() => {
                disposeCounter++;
            }));
            await workingCopy.resolve();
            workingCopy.model?.updateContents('hello modified');
            assert.strictEqual(workingCopy.isModified(), true);
            await workingCopy.revert();
            assert.strictEqual(revertCounter, 1);
            assert.strictEqual(disposeCounter, 1);
            assert.strictEqual(workingCopy.isModified(), false);
        });
        test('dispose', async () => {
            let disposeCounter = 0;
            disposables.add(workingCopy.onWillDispose(() => {
                disposeCounter++;
            }));
            await workingCopy.resolve();
            workingCopy.dispose();
            assert.strictEqual(disposeCounter, 1);
        });
        test('backup', async () => {
            assert.strictEqual((await workingCopy.backup(cancellation_1.CancellationToken.None)).content, undefined);
            await workingCopy.resolve();
            workingCopy.model?.updateContents('Hello Backup');
            const backup = await workingCopy.backup(cancellation_1.CancellationToken.None);
            let backupContents = undefined;
            if ((0, stream_1.isReadableStream)(backup.content)) {
                backupContents = (await (0, stream_1.consumeStream)(backup.content, chunks => buffer_1.VSBuffer.concat(chunks))).toString();
            }
            else if (backup.content) {
                backupContents = (0, stream_1.consumeReadable)(backup.content, chunks => buffer_1.VSBuffer.concat(chunks)).toString();
            }
            assert.strictEqual(backupContents, 'Hello Backup');
        });
        test('resolve - without contents', async () => {
            assert.strictEqual(workingCopy.isResolved(), false);
            assert.strictEqual(workingCopy.hasAssociatedFilePath, false);
            assert.strictEqual(workingCopy.model, undefined);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isResolved(), true);
            assert.ok(workingCopy.model);
        });
        test('resolve - with initial contents', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, false, 'Hello Initial');
            let contentChangeCounter = 0;
            disposables.add(workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            }));
            assert.strictEqual(workingCopy.isModified(), true);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isModified(), true);
            assert.strictEqual(workingCopy.model?.contents, 'Hello Initial');
            assert.strictEqual(contentChangeCounter, 1);
            workingCopy.model.updateContents('Changed contents');
            await workingCopy.resolve(); // second resolve should be ignored
            assert.strictEqual(workingCopy.model?.contents, 'Changed contents');
        });
        test('backup - with initial contents uses those even if unresolved', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, false, 'Hello Initial');
            assert.strictEqual(workingCopy.isModified(), true);
            const backup = (await workingCopy.backup(cancellation_1.CancellationToken.None)).content;
            if ((0, stream_1.isReadableStream)(backup)) {
                const value = await (0, buffer_1.streamToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello Initial');
            }
            else if ((0, stream_1.isReadable)(backup)) {
                const value = (0, buffer_1.readableToBuffer)(backup);
                assert.strictEqual(value.toString(), 'Hello Initial');
            }
            else {
                assert.fail('Missing untitled backup');
            }
        });
        test('resolve - with associated resource', async () => {
            workingCopy.dispose();
            workingCopy = createWorkingCopy(resource, true);
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isModified(), true);
            assert.strictEqual(workingCopy.hasAssociatedFilePath, true);
        });
        test('resolve - with backup', async () => {
            await workingCopy.resolve();
            workingCopy.model?.updateContents('Hello Backup');
            const backup = await workingCopy.backup(cancellation_1.CancellationToken.None);
            await accessor.workingCopyBackupService.backup(workingCopy, backup.content, undefined, backup.meta);
            assert.strictEqual(accessor.workingCopyBackupService.hasBackupSync(workingCopy), true);
            workingCopy.dispose();
            workingCopy = createWorkingCopy();
            let contentChangeCounter = 0;
            disposables.add(workingCopy.onDidChangeContent(() => {
                contentChangeCounter++;
            }));
            await workingCopy.resolve();
            assert.strictEqual(workingCopy.isModified(), true);
            assert.strictEqual(workingCopy.model?.contents, 'Hello Backup');
            assert.strictEqual(contentChangeCounter, 1);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRTY3JhdGNocGFkV29ya2luZ0NvcHkudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L3Rlc3QvYnJvd3Nlci91bnRpdGxlZFNjcmF0Y2hwYWRXb3JraW5nQ29weS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsTUFBYSx1Q0FBdUM7UUFFbkQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFhLEVBQUUsUUFBZ0MsRUFBRSxLQUF3QjtZQUMxRixPQUFPLElBQUksK0RBQWdDLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxJQUFBLHVCQUFjLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3BHLENBQUM7S0FDRDtJQUxELDBGQUtDO0lBRUQsS0FBSyxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtRQUUzQyxNQUFNLE9BQU8sR0FBRyxJQUFJLHVDQUF1QyxFQUFFLENBQUM7UUFFOUQsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxRQUFRLEdBQUcsU0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxpQkFBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM1RSxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUNsQyxJQUFJLFdBQXNFLENBQUM7UUFFM0UsU0FBUyxpQkFBaUIsQ0FBQyxNQUFXLFFBQVEsRUFBRSxxQkFBcUIsR0FBRyxLQUFLLEVBQUUsWUFBWSxHQUFHLEVBQUU7WUFDL0YsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaURBQXVCLENBQ2pELDZCQUE2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