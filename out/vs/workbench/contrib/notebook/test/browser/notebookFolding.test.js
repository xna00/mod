/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "vs/base/common/lifecycle", "vs/base/test/common/utils"], function (require, exports, assert, notebookCommon_1, testNotebookEditor_1, undoRedo_1, foldingModel_1, lifecycle_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Folding', () => {
        let disposables;
        let instantiationService;
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.spy(undoRedo_1.IUndoRedoService, 'pushElement');
        });
        test('Folding based on markdown cells', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingController = ds.add(new foldingModel_1.FoldingModel());
                foldingController.attachViewModel(viewModel);
                assert.strictEqual(foldingController.regions.findRange(1), 0);
                assert.strictEqual(foldingController.regions.findRange(2), 0);
                assert.strictEqual(foldingController.regions.findRange(3), 1);
                assert.strictEqual(foldingController.regions.findRange(4), 1);
                assert.strictEqual(foldingController.regions.findRange(5), 1);
                assert.strictEqual(foldingController.regions.findRange(6), 2);
                assert.strictEqual(foldingController.regions.findRange(7), 2);
            });
        });
        test('Folding not based on code cells', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# comment 1', 'python', notebookCommon_1.CellKind.Code, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3\n```\n## comment 2\n```', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 4', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'python', notebookCommon_1.CellKind.Code, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingController = ds.add(new foldingModel_1.FoldingModel());
                foldingController.attachViewModel(viewModel);
                assert.strictEqual(foldingController.regions.findRange(1), 0);
                assert.strictEqual(foldingController.regions.findRange(2), 0);
                assert.strictEqual(foldingController.regions.findRange(3), 0);
                assert.strictEqual(foldingController.regions.findRange(4), 0);
                assert.strictEqual(foldingController.regions.findRange(5), 0);
                assert.strictEqual(foldingController.regions.findRange(6), 0);
                assert.strictEqual(foldingController.regions.findRange(7), 1);
                assert.strictEqual(foldingController.regions.findRange(8), 1);
            });
        });
        test('Top level header in a cell wins', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.1\n# header3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingController = ds.add(new foldingModel_1.FoldingModel());
                foldingController.attachViewModel(viewModel);
                assert.strictEqual(foldingController.regions.findRange(1), 0);
                assert.strictEqual(foldingController.regions.findRange(2), 0);
                assert.strictEqual(foldingController.regions.getEndLineNumber(0), 2);
                assert.strictEqual(foldingController.regions.findRange(3), 1);
                assert.strictEqual(foldingController.regions.findRange(4), 1);
                assert.strictEqual(foldingController.regions.findRange(5), 1);
                assert.strictEqual(foldingController.regions.getEndLineNumber(1), 7);
                assert.strictEqual(foldingController.regions.findRange(6), 2);
                assert.strictEqual(foldingController.regions.findRange(7), 2);
                assert.strictEqual(foldingController.regions.getEndLineNumber(2), 7);
            });
        });
        test('Folding', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 0, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 1, end: 6 }
                ]);
            });
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 3, end: 4 }
                ]);
            });
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 3, end: 6 }
                ]);
            });
        });
        test('Nested Folding', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 0, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 1, end: 1 }
                ]);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 5, true);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 1, end: 1 },
                    { start: 3, end: 6 }
                ]);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, false);
                viewModel.updateFoldingRanges(foldingModel.regions);
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 1, end: 1 },
                    { start: 6, end: 6 }
                ]);
                // viewModel.insertCell(7, new TestCell(viewModel.viewType, 7, ['var c = 8;'], 'markdown', CellKind.Code, []), true);
                // assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                // 	{ start: 1, end: 1 },
                // 	{ start: 6, end: 7 }
                // ]);
                // viewModel.insertCell(1, new TestCell(viewModel.viewType, 8, ['var c = 9;'], 'markdown', CellKind.Code, []), true);
                // assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                // 	// the first collapsed range is now expanded as we insert content into it.
                // 	// { start: 1,},
                // 	{ start: 7, end: 8 }
                // ]);
            });
        });
        test('Folding Memento', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                foldingModel.applyMemento([{ start: 2, end: 6 }]);
                viewModel.updateFoldingRanges(foldingModel.regions);
                // Note that hidden ranges !== folding ranges
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 3, end: 6 }
                ]);
            });
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                foldingModel.applyMemento([
                    { start: 5, end: 6 },
                    { start: 10, end: 11 },
                ]);
                viewModel.updateFoldingRanges(foldingModel.regions);
                // Note that hidden ranges !== folding ranges
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 6, end: 6 },
                    { start: 11, end: 11 }
                ]);
            });
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                foldingModel.applyMemento([
                    { start: 5, end: 6 },
                    { start: 7, end: 11 },
                ]);
                viewModel.updateFoldingRanges(foldingModel.regions);
                // Note that hidden ranges !== folding ranges
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 6, end: 6 },
                    { start: 8, end: 11 }
                ]);
            });
        });
        test('View Index', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                foldingModel.applyMemento([{ start: 2, end: 6 }]);
                viewModel.updateFoldingRanges(foldingModel.regions);
                // Note that hidden ranges !== folding ranges
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 3, end: 6 }
                ]);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(1), 2);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(2), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(3), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(4), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(5), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(6), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(7), 8);
            });
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header 2.1\n', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['body 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header 2.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 7;', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], (editor, viewModel, ds) => {
                const foldingModel = ds.add(new foldingModel_1.FoldingModel());
                foldingModel.attachViewModel(viewModel);
                foldingModel.applyMemento([
                    { start: 5, end: 6 },
                    { start: 10, end: 11 },
                ]);
                viewModel.updateFoldingRanges(foldingModel.regions);
                // Note that hidden ranges !== folding ranges
                assert.deepStrictEqual(viewModel.getHiddenRanges(), [
                    { start: 6, end: 6 },
                    { start: 11, end: 11 }
                ]);
                // folding ranges
                // [5, 6]
                // [10, 11]
                assert.strictEqual(viewModel.getNextVisibleCellIndex(4), 5);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(5), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(6), 7);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(9), 10);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(10), 12);
                assert.strictEqual(viewModel.getNextVisibleCellIndex(11), 12);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tGb2xkaW5nLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0ZvbGRpbmcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBRW5ELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUV0QyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELG9CQUFvQixDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLO1lBQzVDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRCxpQkFBaUIsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFDNUMsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoRCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxnQ0FBZ0MsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdkUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUMvQyxFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMkJBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3JELGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0QsQ0FBQyxDQUNELENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLO1lBQzVDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxDQUFDLDBCQUEwQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNqRSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMkJBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ3JELGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRSxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFckUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RCxNQUFNLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUs7WUFDcEIsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxJQUFBLHdDQUF5QixFQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFO29CQUNuRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtpQkFDcEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUNELENBQUM7WUFFRixNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDN0MsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDeEQsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQkFBWSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsSUFBQSx3Q0FBeUIsRUFBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxTQUFTLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVwRCxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRTtvQkFDbkQsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FDRCxDQUFDO1lBRUYsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUN6QixNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMkJBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ2hELFlBQVksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3hDLElBQUEsd0NBQXlCLEVBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDakQsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLEVBQUU7b0JBQ25ELEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO2lCQUNwQixDQUFDLENBQUM7WUFDSixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUs7WUFDM0IsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUN6QixNQUFNLFlBQVksR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksMkJBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ2hELFlBQVksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3hDLElBQUEsd0NBQXlCLEVBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDakQsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLEVBQUU7b0JBQ25ELEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO2lCQUNwQixDQUFDLENBQUM7Z0JBRUgsSUFBQSx3Q0FBeUIsRUFBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNqRCxJQUFBLHdDQUF5QixFQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2pELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRXBELE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFO29CQUNuRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtvQkFDcEIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQztnQkFFSCxJQUFBLHdDQUF5QixFQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFO29CQUNuRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtvQkFDcEIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQztnQkFFSCxxSEFBcUg7Z0JBRXJILHdEQUF3RDtnQkFDeEQseUJBQXlCO2dCQUN6Qix3QkFBd0I7Z0JBQ3hCLE1BQU07Z0JBRU4scUhBQXFIO2dCQUNySCx3REFBd0Q7Z0JBQ3hELDhFQUE4RTtnQkFDOUUsb0JBQW9CO2dCQUNwQix3QkFBd0I7Z0JBQ3hCLE1BQU07WUFDUCxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEtBQUs7WUFDNUIsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRXBELDZDQUE2QztnQkFDN0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLEVBQUU7b0JBQ25ELEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO2lCQUNwQixDQUFDLENBQUM7WUFDSixDQUFDLENBQ0QsQ0FBQztZQUVGLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQkFBWSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFlBQVksQ0FBQztvQkFDekIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3BCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO2lCQUN0QixDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFcEQsNkNBQTZDO2dCQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRTtvQkFDbkQsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3BCLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO2lCQUN0QixDQUFDLENBQUM7WUFDSixDQUFDLENBQ0QsQ0FBQztZQUVGLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQkFBWSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFlBQVksQ0FBQztvQkFDekIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3BCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO2lCQUNyQixDQUFDLENBQUM7Z0JBQ0gsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFcEQsNkNBQTZDO2dCQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsRUFBRTtvQkFDbkQsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3BCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO2lCQUNyQixDQUFDLENBQUM7WUFDSixDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLO1lBQ3ZCLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUM3QyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLGVBQWUsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDdEQsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQ3pCLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSwyQkFBWSxFQUFFLENBQUMsQ0FBQztnQkFDaEQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDeEMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRCxTQUFTLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVwRCw2Q0FBNkM7Z0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFO29CQUNuRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtpQkFDcEIsQ0FBQyxDQUFDO2dCQUVILE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzdELENBQUMsQ0FDRCxDQUFDO1lBRUYsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQzdDLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZELENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxlQUFlLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ3RELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLGdCQUFnQixFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN2RCxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQy9DLENBQUMsZUFBZSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUN0RCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDekIsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJCQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN4QyxZQUFZLENBQUMsWUFBWSxDQUFDO29CQUN6QixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtvQkFDcEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7aUJBQ3RCLENBQUMsQ0FBQztnQkFFSCxTQUFTLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVwRCw2Q0FBNkM7Z0JBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxFQUFFO29CQUNuRCxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtvQkFDcEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7aUJBQ3RCLENBQUMsQ0FBQztnQkFFSCxpQkFBaUI7Z0JBQ2pCLFNBQVM7Z0JBQ1QsV0FBVztnQkFDWCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUU1RCxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDN0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQzlELE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQy9ELENBQUMsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9