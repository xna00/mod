/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/textfile/common/textFileEditorModel", "vs/workbench/test/browser/workbenchTestServices", "vs/base/test/common/utils", "vs/editor/common/model/textModel", "vs/base/common/cancellation", "vs/base/common/buffer", "vs/base/common/lifecycle"], function (require, exports, assert, textFileEditorModel_1, workbenchTestServices_1, utils_1, textModel_1, cancellation_1, buffer_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileEditorModel (integration)', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        let content;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            content = accessor.fileService.getContent();
            disposables.add((0, lifecycle_1.toDisposable)(() => accessor.fileService.setContent(content)));
            disposables.add(accessor.textFileService.files);
        });
        teardown(() => {
            disposables.clear();
        });
        test('backup and restore (simple)', async function () {
            return testBackupAndRestore(utils_1.toResource.call(this, '/path/index_async.txt'), utils_1.toResource.call(this, '/path/index_async2.txt'), 'Some very small file text content.');
        });
        test('backup and restore (large, #121347)', async function () {
            const largeContent = '국어한\n'.repeat(100000);
            return testBackupAndRestore(utils_1.toResource.call(this, '/path/index_async.txt'), utils_1.toResource.call(this, '/path/index_async2.txt'), largeContent);
        });
        async function testBackupAndRestore(resourceA, resourceB, contents) {
            const originalModel = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, resourceA, 'utf8', undefined));
            await originalModel.resolve({
                contents: await (0, textModel_1.createTextBufferFactoryFromStream)(await accessor.textFileService.getDecodedStream(resourceA, (0, buffer_1.bufferToStream)(buffer_1.VSBuffer.fromString(contents))))
            });
            assert.strictEqual(originalModel.textEditorModel?.getValue(), contents);
            const backup = await originalModel.backup(cancellation_1.CancellationToken.None);
            const modelRestoredIdentifier = { typeId: originalModel.typeId, resource: resourceB };
            await accessor.workingCopyBackupService.backup(modelRestoredIdentifier, backup.content);
            const modelRestored = disposables.add(instantiationService.createInstance(textFileEditorModel_1.TextFileEditorModel, modelRestoredIdentifier.resource, 'utf8', undefined));
            await modelRestored.resolve();
            assert.strictEqual(modelRestored.textEditorModel?.getValue(), contents);
            assert.strictEqual(modelRestored.isDirty(), true);
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dEZpbGVFZGl0b3JNb2RlbC5pbnRlZ3JhdGlvblRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy90ZXh0ZmlsZS90ZXN0L2Jyb3dzZXIvdGV4dEZpbGVFZGl0b3JNb2RlbC5pbnRlZ3JhdGlvblRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFjaEcsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtRQUV2RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxJQUFJLG9CQUEyQyxDQUFDO1FBQ2hELElBQUksUUFBNkIsQ0FBQztRQUNsQyxJQUFJLE9BQWUsQ0FBQztRQUVwQixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDN0UsUUFBUSxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQywyQ0FBbUIsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzVDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RSxXQUFXLENBQUMsR0FBRyxDQUE2QixRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdFLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBQ3hDLE9BQU8sb0JBQW9CLENBQUMsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLEVBQUUsa0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLHdCQUF3QixDQUFDLEVBQUUsb0NBQW9DLENBQUMsQ0FBQztRQUNwSyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLO1lBQ2hELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsT0FBTyxvQkFBb0IsQ0FBQyxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsRUFBRSxrQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUM1SSxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxTQUFjLEVBQUUsU0FBYyxFQUFFLFFBQWdCO1lBQ25GLE1BQU0sYUFBYSxHQUF3QixXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx5Q0FBbUIsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDbkosTUFBTSxhQUFhLENBQUMsT0FBTyxDQUFDO2dCQUMzQixRQUFRLEVBQUUsTUFBTSxJQUFBLDZDQUFpQyxFQUFDLE1BQU0sUUFBUSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBQSx1QkFBYyxFQUFDLGlCQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM1SixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFeEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsTUFBTSxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xFLE1BQU0sdUJBQXVCLEdBQUcsRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFDdEYsTUFBTSxRQUFRLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV4RixNQUFNLGFBQWEsR0FBd0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMseUNBQW1CLEVBQUUsdUJBQXVCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzFLLE1BQU0sYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRTlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=