/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, mock_1, foldingModel_1, notebookBrowser_1, notebookCommon_1, testNotebookEditor_1, notebookCellList_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ListViewInfoAccessor', () => {
        let disposables;
        let instantiationService;
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
        });
        test('basics', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                const listViewInfoAccessor = ds.add(new notebookCellList_1.ListViewInfoAccessor(cellList));
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(0)), 0);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(1)), 1);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(2)), 2);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(3)), 3);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(4)), 4);
                assert.deepStrictEqual(listViewInfoAccessor.getCellRangeFromViewRange(0, 1), { start: 0, end: 1 });
                assert.deepStrictEqual(listViewInfoAccessor.getCellRangeFromViewRange(1, 2), { start: 1, end: 2 });
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 0, true);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                cellList.setHiddenAreas(viewModel.getHiddenRanges(), true);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(0)), 0);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(1)), -1);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(2)), 1);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(3)), -1);
                assert.strictEqual(listViewInfoAccessor.getViewIndex(viewModel.cellAt(4)), -1);
                assert.deepStrictEqual(listViewInfoAccessor.getCellRangeFromViewRange(0, 1), { start: 0, end: 2 });
                assert.deepStrictEqual(listViewInfoAccessor.getCellRangeFromViewRange(1, 2), { start: 2, end: 5 });
                assert.deepStrictEqual(listViewInfoAccessor.getCellsFromViewRange(0, 1), viewModel.getCellsInRange({ start: 0, end: 2 }));
                assert.deepStrictEqual(listViewInfoAccessor.getCellsFromViewRange(1, 2), viewModel.getCellsInRange({ start: 2, end: 5 }));
                const notebookEditor = new class extends (0, mock_1.mock)() {
                    getViewIndexByModelIndex(index) { return listViewInfoAccessor.getViewIndex(viewModel.viewCells[index]); }
                    getCellRangeFromViewRange(startIndex, endIndex) { return listViewInfoAccessor.getCellRangeFromViewRange(startIndex, endIndex); }
                    cellAt(index) { return viewModel.cellAt(index); }
                };
                assert.deepStrictEqual((0, notebookBrowser_1.expandCellRangesWithHiddenCells)(notebookEditor, [{ start: 0, end: 1 }]), [{ start: 0, end: 2 }]);
                assert.deepStrictEqual((0, notebookBrowser_1.expandCellRangesWithHiddenCells)(notebookEditor, [{ start: 2, end: 3 }]), [{ start: 2, end: 5 }]);
                assert.deepStrictEqual((0, notebookBrowser_1.expandCellRangesWithHiddenCells)(notebookEditor, [{ start: 0, end: 1 }, { start: 2, end: 3 }]), [{ start: 0, end: 5 }]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3IudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rRWRpdG9yLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtRQUNsQyxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUVuRCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDcEMsb0JBQW9CLEdBQUcsSUFBQSw4Q0FBeUIsRUFBQyxXQUFXLENBQUMsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSztZQUNuQixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFB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