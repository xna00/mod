/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/view/cellParts/cellDnd", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "assert", "vs/base/test/common/utils"], function (require, exports, cellDnd_1, notebookCommon_1, testNotebookEditor_1, assert, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function testCellDnd(beginning, dragAction, end) {
        await (0, testNotebookEditor_1.withTestNotebook)(beginning.startOrder.map(text => [text, 'plaintext', notebookCommon_1.CellKind.Code, []]), (editor, viewModel) => {
            editor.setSelections(beginning.selections);
            editor.setFocus({ start: beginning.focus, end: beginning.focus + 1 });
            (0, cellDnd_1.performCellDropEdits)(editor, viewModel.cellAt(dragAction.dragIdx), dragAction.direction, viewModel.cellAt(dragAction.dragOverIdx));
            for (const i in end.endOrder) {
                assert.equal(viewModel.viewCells[i].getText(), end.endOrder[i]);
            }
            assert.equal(editor.getSelections().length, 1);
            assert.deepStrictEqual(editor.getSelections()[0], end.selection);
            assert.deepStrictEqual(editor.getFocus(), { start: end.focus, end: end.focus + 1 });
        });
    }
    suite('cellDND', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('drag 1 cell', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 0, end: 1 }],
                focus: 0
            }, {
                dragIdx: 0,
                dragOverIdx: 1,
                direction: 'below'
            }, {
                endOrder: ['1', '0', '2', '3'],
                selection: { start: 1, end: 2 },
                focus: 1
            });
        });
        test('drag multiple contiguous cells down', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 1, end: 3 }],
                focus: 1
            }, {
                dragIdx: 1,
                dragOverIdx: 3,
                direction: 'below'
            }, {
                endOrder: ['0', '3', '1', '2'],
                selection: { start: 2, end: 4 },
                focus: 2
            });
        });
        test('drag multiple contiguous cells up', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 2, end: 4 }],
                focus: 2
            }, {
                dragIdx: 3,
                dragOverIdx: 0,
                direction: 'above'
            }, {
                endOrder: ['2', '3', '0', '1'],
                selection: { start: 0, end: 2 },
                focus: 0
            });
        });
        test('drag ranges down', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 0, end: 1 }, { start: 2, end: 3 }],
                focus: 0
            }, {
                dragIdx: 0,
                dragOverIdx: 3,
                direction: 'below'
            }, {
                endOrder: ['1', '3', '0', '2'],
                selection: { start: 2, end: 4 },
                focus: 2
            });
        });
        test('drag ranges up', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 1, end: 2 }, { start: 3, end: 4 }],
                focus: 1
            }, {
                dragIdx: 1,
                dragOverIdx: 0,
                direction: 'above'
            }, {
                endOrder: ['1', '3', '0', '2'],
                selection: { start: 0, end: 2 },
                focus: 0
            });
        });
        test('drag ranges between ranges', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 0, end: 1 }, { start: 3, end: 4 }],
                focus: 0
            }, {
                dragIdx: 0,
                dragOverIdx: 1,
                direction: 'below'
            }, {
                endOrder: ['1', '0', '3', '2'],
                selection: { start: 1, end: 3 },
                focus: 1
            });
        });
        test('drag ranges just above a range', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 1, end: 2 }, { start: 3, end: 4 }],
                focus: 1
            }, {
                dragIdx: 1,
                dragOverIdx: 1,
                direction: 'above'
            }, {
                endOrder: ['0', '1', '3', '2'],
                selection: { start: 1, end: 3 },
                focus: 1
            });
        });
        test('drag ranges inside a range', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 0, end: 2 }, { start: 3, end: 4 }],
                focus: 0
            }, {
                dragIdx: 0,
                dragOverIdx: 0,
                direction: 'below'
            }, {
                endOrder: ['0', '1', '3', '2'],
                selection: { start: 0, end: 3 },
                focus: 0
            });
        });
        test('dragged cell is not focused or selected', async () => {
            await testCellDnd({
                startOrder: ['0', '1', '2', '3'],
                selections: [{ start: 1, end: 2 }],
                focus: 1
            }, {
                dragIdx: 2,
                dragOverIdx: 3,
                direction: 'below'
            }, {
                endOrder: ['0', '1', '3', '2'],
                selection: { start: 3, end: 4 },
                focus: 3
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERuZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY2VsbERuZC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMkJoRyxLQUFLLFVBQVUsV0FBVyxDQUFDLFNBQTBCLEVBQUUsVUFBdUIsRUFBRSxHQUFjO1FBQzdGLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckIsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFDeEUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7WUFDckIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEUsSUFBQSw4QkFBb0IsRUFBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFFLEVBQUUsVUFBVSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUUsQ0FBQyxDQUFDO1lBRXJJLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxDQUFD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