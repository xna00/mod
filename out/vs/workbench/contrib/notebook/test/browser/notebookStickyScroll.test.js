/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/snapshot", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/viewParts/notebookEditorStickyScroll", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, event_1, lifecycle_1, mock_1, snapshot_1, utils_1, notebookOutline_1, notebookEditorStickyScroll_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookEditorStickyScroll', () => {
        let disposables;
        let instantiationService;
        const domNode = document.createElement('div');
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
        });
        function getOutline(editor) {
            if (!editor.hasModel()) {
                assert.ok(false, 'MUST have active text editor');
            }
            const outline = instantiationService.createInstance(notebookOutline_1.NotebookCellOutline, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeModel = event_1.Event.None;
                }
                getControl() {
                    return editor;
                }
            }, 4 /* OutlineTarget.QuickPick */);
            return outline;
        }
        function nbStickyTestHelper(domNode, notebookEditor, notebookCellList, notebookOutlineEntries, disposables) {
            const output = (0, notebookEditorStickyScroll_1.computeContent)(notebookEditor, notebookCellList, notebookOutlineEntries, 0);
            for (const stickyLine of output.values()) {
                disposables.add(stickyLine.line);
            }
            return createStickyTestElement(output.values());
        }
        function createStickyTestElement(stickyLines) {
            const outputElements = [];
            for (const stickyLine of stickyLines) {
                if (stickyLine.rendered) {
                    outputElements.unshift(stickyLine.line.element.innerText);
                }
            }
            return outputElements;
        }
        test('test0: should render empty, 	scrollTop at 0', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 8 }, () => false),
                    editorViewStates: Array.from({ length: 8 }, () => null),
                    cellTotalHeights: Array.from({ length: 8 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = disposables.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, disposables));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(0);
                editor.visibleRanges = [{ start: 0, end: 8 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, disposables);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test1: should render 0->1, 	visible range 3->8', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 0
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 50
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 100
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 150
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 200
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 250
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 300
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}] // 350
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 8 }, () => false),
                    editorViewStates: Array.from({ length: 8 }, () => null),
                    cellTotalHeights: Array.from({ length: 8 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(175);
                editor.visibleRanges = [{ start: 3, end: 8 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test2: should render 0, 		visible range 6->9 so collapsing next 2 against following section', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 0
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 50
                ['### header aaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 100
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 150
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 200
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 250
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 300
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 350
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}] // 400
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 9 }, () => false),
                    editorViewStates: Array.from({ length: 9 }, () => null),
                    cellTotalHeights: Array.from({ length: 9 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(325); // room for a single header
                editor.visibleRanges = [{ start: 6, end: 9 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test3: should render 0->2, 	collapsing against equivalent level header', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 0
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 50
                ['### header aaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 100
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 150
                ['### header aab', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 200
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 250
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 300
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], // 350
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], // 400
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}] // 450
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 10 }, () => false),
                    editorViewStates: Array.from({ length: 10 }, () => null),
                    cellTotalHeights: Array.from({ length: 10 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(175); // room for a single header
                editor.visibleRanges = [{ start: 3, end: 10 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        // outdated/improper behavior
        test('test4: should render 0, 		scrolltop halfway through cell 0', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 8 }, () => false),
                    editorViewStates: Array.from({ length: 8 }, () => null),
                    cellTotalHeights: Array.from({ length: 8 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(50);
                editor.visibleRanges = [{ start: 0, end: 8 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test5: should render 0->2, 	scrolltop halfway through cell 2', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['### header aaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['#### header aaaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 10 }, () => false),
                    editorViewStates: Array.from({ length: 10 }, () => null),
                    cellTotalHeights: Array.from({ length: 10 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(125);
                editor.visibleRanges = [{ start: 2, end: 10 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test6: should render 6->7, 	scrolltop halfway through cell 7', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['## header bb', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['### header bbb', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 10 }, () => false),
                    editorViewStates: Array.from({ length: 10 }, () => null),
                    cellTotalHeights: Array.from({ length: 10 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(375);
                editor.visibleRanges = [{ start: 7, end: 10 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
        test('test7: should render 0->1, 	collapsing against next section', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //0
                ['## header aa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //50
                ['### header aaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //100
                ['#### header aaaa', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //150
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], //200
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], //250
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], //300
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}], //350
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //400
                ['## header bb', 'markdown', notebookCommon_1.CellKind.Markup, [], {}], //450
                ['### header bbb', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var c = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}]
            ], async (editor, viewModel, ds) => {
                viewModel.restoreEditorViewState({
                    editingCells: Array.from({ length: 12 }, () => false),
                    editorViewStates: Array.from({ length: 12 }, () => null),
                    cellTotalHeights: Array.from({ length: 12 }, () => 50),
                    cellLineNumberStates: {},
                    collapsedInputCells: {},
                    collapsedOutputCells: {},
                });
                const cellList = ds.add((0, testNotebookEditor_1.createNotebookCellList)(instantiationService, ds));
                cellList.attachViewModel(viewModel);
                cellList.layout(400, 100);
                editor.setScrollTop(350);
                editor.visibleRanges = [{ start: 7, end: 12 }];
                const outline = getOutline(editor);
                const notebookOutlineEntries = outline.entries;
                const resultingMap = nbStickyTestHelper(domNode, editor, cellList, notebookOutlineEntries, ds);
                await (0, snapshot_1.assertSnapshot)(resultingMap);
                outline.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTdGlja3lTY3JvbGwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rU3RpY2t5U2Nyb2xsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFFbkQsTUFBTSxPQUFPLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFM0QsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFvQixHQUFHLElBQUEsOENBQXlCLEVBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxTQUFTLFVBQVUsQ0FBQyxNQUFXO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsOEJBQThCLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQ0QsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFDQUFtQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUF1QjtnQkFBekM7O29CQUluRSxxQkFBZ0IsR0FBZ0IsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFDckQsQ0FBQztnQkFKUyxVQUFVO29CQUNsQixPQUFPLE1BQU0sQ0FBQztnQkFDZixDQUFDO2FBRUQsa0NBQTBCLENBQUM7WUFDNUIsT0FBTyxPQUFPLENBQUM7UUFDaEIsQ0FBQztRQUVELFNBQVMsa0JBQWtCLENBQUMsT0FBb0IsRUFBRSxjQUErQixFQUFFLGdCQUFtQyxFQUFFLHNCQUFzQyxFQUFFLFdBQXlDO1lBQ3hNLE1BQU0sTUFBTSxHQUFHLElBQUEsMkNBQWMsRUFBQyxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDM0YsS0FBSyxNQUFNLFVBQVUsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDMUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsQ0FBQztZQUNELE9BQU8sdUJBQXVCLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELFNBQVMsdUJBQXVCLENBQUMsV0FBOEU7WUFDOUcsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO1lBQzFCLEtBQUssTUFBTSxVQUFVLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ3RDLElBQUksVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN6QixjQUFjLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMzRCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sY0FBYyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLENBQUMsNkNBQTZDLEVBQUUsS0FBSztZQUN4RCxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDckQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDbkQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQzthQUNuRCxFQUNELEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQzNCLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQztvQkFDaEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNwRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDdkQsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3JELG9CQUFvQixFQUFFLEVBQUU7b0JBQ3hCLG1CQUFtQixFQUFFLEVBQUU7b0JBQ3ZCLG9CQUFvQixFQUFFLEVBQUU7aUJBQ3hCLENBQUMsQ0FBQztnQkFFSCxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsMkNBQXNCLEVBQUMsb0JBQW9CLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDNUYsUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRTFCLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUMvQyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDeEcsTUFBTSxJQUFBLHlCQUFjLEVBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGdEQUFnRCxFQUFFLEtBQUs7WUFDM0QsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUk7Z0JBQ3pELENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSztnQkFDNUQsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNO2dCQUMzRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU07Z0JBQzNELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNO2dCQUMzRCxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU07Z0JBQzNELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUUsTUFBTTthQUMzRCxFQUNELEtBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUMvQixTQUFTLENBQUMsc0JBQXNCLENBQUM7b0JBQ2hDLFlBQVksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDcEQsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUM7b0JBQ3ZELGdCQUFnQixFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO29CQUNyRCxvQkFBb0IsRUFBRSxFQUFFO29CQUN4QixtQkFBbUIsRUFBRSxFQUFFO29CQUN2QixvQkFBb0IsRUFBRSxFQUFFO2lCQUN4QixDQUFDLENBQUM7Z0JBRUgsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFBLDJDQUFzQixFQUFDLG9CQUFvQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3BDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUUxQixNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN6QixNQUFNLENBQUMsYUFBYSxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUU5QyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDL0MsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsc0JBQXNCLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRS9GLE1BQU0sSUFBQSx5QkFBYyxFQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNuQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw2RkFBNkYsRUFBRSxLQUFLO1lBQ3hHLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJO2dCQUN6RCxDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUs7Z0JBQzVELENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBQyxNQUFNO2dCQUM5RCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU07Z0JBQzNELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNO2dCQUMzRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU07Z0JBQzNELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBRSxNQUFNO2FBQzNELEVBQ0QsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQy9CLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQztvQkFDaEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNwRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztvQkFDdkQsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ3JELG9CQUFvQixFQUFFLEVBQUU7b0JBQ3hCLG1CQUFtQixFQUFFLEVBQUU7b0JBQ3ZCLG9CQUFvQixFQUFFLEVBQUU7aUJBQ3hCLENBQUMsQ0FBQztnQkFFSCxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUEsMkNBQXNCLEVBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDcEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBRTFCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQywyQkFBMkI7Z0JBQ3JELE1BQU0sQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUMvQyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxzQkFBc0IsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFFL0YsTUFBTSxJQUFBLHlCQUFjLEVBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHdFQUF3RSxFQUFFLEtBQUs7WUFDbkYsTUFBTSxJQUFBLHFDQUFnQixFQUNyQjtnQkFDQyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUk7Z0JBQ3pELENBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSztnQkFDNUQsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFDLE1BQU07Z0JBQzlELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFDLE1BQU07Z0JBQzlELENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxNQUFNO2dCQUMzRCxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU07Z0JBQzNELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTTtnQkFDM0QsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBRSxNQUFNO2FBQzNELEVBQ0QsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQy9CLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQztvQkFDaEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO29CQUNyRCxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxF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