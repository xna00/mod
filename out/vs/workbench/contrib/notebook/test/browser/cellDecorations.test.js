/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/test/common/utils", "vs/base/common/event"], function (require, exports, assert, notebookCommon_1, testNotebookEditor_1, utils_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CellDecorations', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Add and remove a cell decoration', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel) => {
                const cell = viewModel.cellAt(0);
                assert.ok(cell);
                let added = false;
                event_1.Event.once(cell.onCellDecorationsChanged)(e => added = !!e.added.find(decoration => decoration.className === 'style1'));
                const decorationIds = cell.deltaCellDecorations([], [{ className: 'style1' }]);
                assert.ok(cell.getCellDecorations().find(dec => dec.className === 'style1'));
                let removed = false;
                event_1.Event.once(cell.onCellDecorationsChanged)(e => removed = !!e.removed.find(decoration => decoration.className === 'style1'));
                cell.deltaCellDecorations(decorationIds, []);
                assert.ok(!cell.getCellDecorations().find(dec => dec.className === 'style1'));
                assert.ok(added);
                assert.ok(removed);
            });
        });
        test('Removing one cell decoration should not remove all', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel) => {
                const cell = viewModel.cellAt(0);
                assert.ok(cell);
                const decorationIds = cell.deltaCellDecorations([], [{ className: 'style1', outputClassName: 'style1' }]);
                cell.deltaCellDecorations([], [{ className: 'style1' }]);
                let styleRemoved = false;
                let outputStyleRemoved = false;
                event_1.Event.once(cell.onCellDecorationsChanged)(e => {
                    styleRemoved = !!e.removed.find(decoration => decoration.className === 'style1');
                    outputStyleRemoved = !!e.removed.find(decoration => decoration.outputClassName === 'style1');
                });
                // remove the first style added, which should only remove the output class
                cell.deltaCellDecorations(decorationIds, []);
                assert.ok(!cell.getCellDecorations().find(dec => dec.outputClassName === 'style1'));
                assert.ok(cell.getCellDecorations().find(dec => dec.className === 'style1'));
                assert.ok(!styleRemoved);
                assert.ok(outputStyleRemoved);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbERlY29yYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9jZWxsRGVjb3JhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQzdCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsa0NBQWtDLEVBQUUsS0FBSztZQUM3QyxNQUFNLElBQUEscUNBQWdCLEVBQ3JCO2dCQUNDLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRTtnQkFDM0IsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFaEIsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO2dCQUNsQixhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFFeEgsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDL0UsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBRTdFLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztnQkFDcEIsYUFBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVILElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzlFLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvREFBb0QsRUFBRSxLQUFLO1lBQy9ELE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLHlCQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDbkQsRUFDRCxLQUFLLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUMzQixNQUFNLElBQUksR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVoQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLGVBQWUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRXpELElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQztnQkFDekIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7Z0JBQy9CLGFBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxDQUFDO29CQUNqRixrQkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsZUFBZSxLQUFLLFFBQVEsQ0FBQyxDQUFDO2dCQUM5RixDQUFDLENBQUMsQ0FBQztnQkFDSCwwRUFBMEU7Z0JBQzFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTdDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsZUFBZSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BGLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFNBQVMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3pCLE1BQU0sQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUMvQixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==