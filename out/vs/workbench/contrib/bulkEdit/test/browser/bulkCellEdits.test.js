/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, cancellation_1, uri_1, mock_1, utils_1, undoRedo_1, bulkCellEdits_1, notebookCommon_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BulkCellEdits', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function runTest(inputUri, resolveUri) {
            const progress = { report: _ => { } };
            const editorService = store.add(new workbenchTestServices_1.TestEditorService());
            const notebook = (0, mock_1.mockObject)()();
            notebook.uri.returns(uri_1.URI.file('/project/notebook.ipynb'));
            const notebookEditorModel = (0, mock_1.mockObject)()({ notebook: notebook });
            notebookEditorModel.isReadonly.returns(false);
            const notebookService = (0, mock_1.mockObject)()();
            notebookService.resolve.returns({ object: notebookEditorModel, dispose: () => { } });
            const edits = [
                new bulkCellEdits_1.ResourceNotebookCellEdit(inputUri, { index: 0, count: 1, editType: 1 /* CellEditType.Replace */, cells: [] })
            ];
            const bce = new bulkCellEdits_1.BulkCellEdits(new undoRedo_1.UndoRedoGroup(), new undoRedo_1.UndoRedoSource(), progress, cancellation_1.CancellationToken.None, edits, editorService, notebookService);
            await bce.apply();
            const resolveArgs = notebookService.resolve.args[0];
            assert.strictEqual(resolveArgs[0].toString(), resolveUri.toString());
        }
        const notebookUri = uri_1.URI.file('/foo/bar.ipynb');
        test('works with notebook URI', async () => {
            await runTest(notebookUri, notebookUri);
        });
        test('maps cell URI to notebook URI', async () => {
            await runTest(notebookCommon_1.CellUri.generate(notebookUri, 5), notebookUri);
        });
        test('throws for invalid cell URI', async () => {
            const badCellUri = notebookCommon_1.CellUri.generate(notebookUri, 5).with({ fragment: '' });
            await assert.rejects(async () => await runTest(badCellUri, notebookUri));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0NlbGxFZGl0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9idWxrRWRpdC90ZXN0L2Jyb3dzZXIvYnVsa0NlbGxFZGl0cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZWhHLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELEtBQUssVUFBVSxPQUFPLENBQUMsUUFBYSxFQUFFLFVBQWU7WUFDcEQsTUFBTSxRQUFRLEdBQW9CLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdkQsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHlDQUFpQixFQUFFLENBQUMsQ0FBQztZQUV6RCxNQUFNLFFBQVEsR0FBRyxJQUFBLGlCQUFVLEdBQXFCLEVBQUUsQ0FBQztZQUNuRCxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFHLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUMsQ0FBQztZQUUxRCxNQUFNLG1CQUFtQixHQUFHLElBQUEsaUJBQVUsR0FBZ0MsQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ3RHLG1CQUFtQixDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFOUMsTUFBTSxlQUFlLEdBQUcsSUFBQSxpQkFBVSxHQUF1QyxFQUFFLENBQUM7WUFDNUUsZUFBZSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFFckYsTUFBTSxLQUFLLEdBQUc7Z0JBQ2IsSUFBSSx3Q0FBd0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsUUFBUSw4QkFBc0IsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDekcsQ0FBQztZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksNkJBQWEsQ0FBQyxJQUFJLHdCQUFhLEVBQUUsRUFBRSxJQUFJLHlCQUFjLEVBQUUsRUFBRSxRQUFRLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsZUFBc0IsQ0FBQyxDQUFDO1lBQ3pKLE1BQU0sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRWxCLE1BQU0sV0FBVyxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxNQUFNLFdBQVcsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLHlCQUF5QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFDLE1BQU0sT0FBTyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrQkFBK0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLE9BQU8sQ0FBQyx3QkFBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDOUMsTUFBTSxVQUFVLEdBQUcsd0JBQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sT0FBTyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQzFFLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==