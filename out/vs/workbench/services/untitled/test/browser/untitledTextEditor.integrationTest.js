/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, workbenchTestServices_1, untitledTextEditorInput_1, cancellation_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Untitled text editors', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let instantiationService;
        let accessor;
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.untitledTextEditorService);
        });
        teardown(() => {
            disposables.clear();
        });
        test('backup and restore (simple)', async function () {
            return testBackupAndRestore('Some very small file text content.');
        });
        test('backup and restore (large, #121347)', async function () {
            const largeContent = '국어한\n'.repeat(100000);
            return testBackupAndRestore(largeContent);
        });
        async function testBackupAndRestore(content) {
            const service = accessor.untitledTextEditorService;
            const originalInput = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            const restoredInput = disposables.add(instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create()));
            const originalModel = disposables.add(await originalInput.resolve());
            originalModel.textEditorModel?.setValue(content);
            const backup = await originalModel.backup(cancellation_1.CancellationToken.None);
            const modelRestoredIdentifier = { typeId: originalModel.typeId, resource: restoredInput.resource };
            await accessor.workingCopyBackupService.backup(modelRestoredIdentifier, backup.content);
            const restoredModel = disposables.add(await restoredInput.resolve());
            assert.strictEqual(restoredModel.textEditorModel?.getValue(), content);
            assert.strictEqual(restoredModel.isDirty(), true);
        }
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW50aXRsZWRUZXh0RWRpdG9yLmludGVncmF0aW9uVGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VudGl0bGVkL3Rlc3QvYnJvd3Nlci91bnRpdGxlZFRleHRFZGl0b3IuaW50ZWdyYXRpb25UZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFFbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsSUFBSSxvQkFBMkMsQ0FBQztRQUNoRCxJQUFJLFFBQTZCLENBQUM7UUFFbEMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLG9CQUFvQixHQUFHLElBQUEscURBQTZCLEVBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzdFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsMkNBQW1CLENBQUMsQ0FBQztZQUNwRSxXQUFXLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBQ3hDLE9BQU8sb0JBQW9CLENBQUMsb0NBQW9DLENBQUMsQ0FBQztRQUNuRSxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLO1lBQ2hELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUMsT0FBTyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxPQUFlO1lBQ2xELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQztZQUNuRCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpREFBdUIsRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RILE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLGlEQUF1QixFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEgsTUFBTSxhQUFhLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ3JFLGFBQWEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpELE1BQU0sTUFBTSxHQUFHLE1BQU0sYUFBYSxDQUFDLE1BQU0sQ0FBQyxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRSxNQUFNLHVCQUF1QixHQUFHLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuRyxNQUFNLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXhGLE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUVyRSxNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9