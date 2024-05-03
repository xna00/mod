/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/notebookCellAnchor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/test/common/utils"], function (require, exports, assert, testConfigurationService_1, notebookBrowser_1, notebookCellAnchor_1, event_1, notebookCommon_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookCellAnchor', () => {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let focusedCell;
        let config;
        let scrollEvent;
        let onDidStopExecution;
        let resizingCell;
        let cellAnchor;
        setup(() => {
            config = new testConfigurationService_1.TestConfigurationService();
            scrollEvent = new event_1.Emitter();
            onDidStopExecution = new event_1.Emitter();
            const executionService = {
                getCellExecution: () => { return { state: notebookCommon_1.NotebookCellExecutionState.Executing }; },
            };
            resizingCell = {
                cellKind: notebookCommon_1.CellKind.Code,
                onDidStopExecution: onDidStopExecution.event
            };
            focusedCell = {
                focusMode: notebookBrowser_1.CellFocusMode.Container
            };
            cellAnchor = store.add(new notebookCellAnchor_1.NotebookCellAnchor(executionService, config, scrollEvent.event));
        });
        // for the current implementation the code under test only cares about the focused cell
        // initial setup with focused cell at the bottom of the view
        class MockListView {
            constructor() {
                this.focusedCellTop = 100;
                this.focusedCellHeight = 50;
                this.renderTop = 0;
                this.renderHeight = 150;
            }
            element(_index) { return focusedCell; }
            elementTop(_index) { return this.focusedCellTop; }
            elementHeight(_index) { return this.focusedCellHeight; }
            getScrollTop() { return this.renderTop; }
        }
        test('Basic anchoring', async function () {
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            const listView = new MockListView();
            assert(cellAnchor.shouldAnchor(listView, 1, -10, resizingCell), 'should anchor if cell editor is focused');
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell editor is focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'none');
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell editor is focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'fullCell');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Container;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell is growing');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Output;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should anchor if cell is growing');
            assert(!cellAnchor.shouldAnchor(listView, 1, -10, resizingCell), 'should not anchor if not growing and editor not focused');
            config.setUserConfiguration(notebookCommon_1.NotebookSetting.scrollToRevealCell, 'none');
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should not anchor if scroll on execute is disabled');
        });
        test('Anchor during execution until user scrolls up', async function () {
            const listView = new MockListView();
            const scrollDown = { oldScrollTop: 100, scrollTop: 150 };
            const scrollUp = { oldScrollTop: 200, scrollTop: 150 };
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell));
            scrollEvent.fire(scrollDown);
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should still be anchored after scrolling down');
            scrollEvent.fire(scrollUp);
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should not be anchored after scrolling up');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should anchor again if the editor is focused');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Container;
            onDidStopExecution.fire();
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should anchor for new execution');
        });
        test('Only anchor during when the focused cell will be pushed out of view', async function () {
            const mockListView = new MockListView();
            mockListView.focusedCellTop = 50;
            const listView = mockListView;
            assert(!cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'should not anchor if focused cell will still be fully visible after resize');
            focusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should always anchor if the editor is focused');
            // fully visible focused cell would be pushed partially out of view
            assert(cellAnchor.shouldAnchor(listView, 1, 150, resizingCell), 'cell should be anchored if focused cell will be pushed out of view');
            mockListView.focusedCellTop = 110;
            // partially visible focused cell would be pushed further out of view
            assert(cellAnchor.shouldAnchor(listView, 1, 10, resizingCell), 'cell should be anchored if focused cell will be pushed out of view');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDZWxsQW5jaG9yLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0NlbGxBbmNob3IudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWVoRyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBRWhDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUN4RCxJQUFJLFdBQThCLENBQUM7UUFDbkMsSUFBSSxNQUFnQyxDQUFDO1FBQ3JDLElBQUksV0FBaUMsQ0FBQztRQUN0QyxJQUFJLGtCQUFpQyxDQUFDO1FBQ3RDLElBQUksWUFBK0IsQ0FBQztRQUVwQyxJQUFJLFVBQThCLENBQUM7UUFFbkMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLE1BQU0sR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDeEMsV0FBVyxHQUFHLElBQUksZUFBTyxFQUFlLENBQUM7WUFDekMsa0JBQWtCLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUV6QyxNQUFNLGdCQUFnQixHQUFHO2dCQUN4QixnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsR0FBRyxPQUFPLEVBQUUsS0FBSyxFQUFFLDJDQUEwQixDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUN0QyxDQUFDO1lBRS9DLFlBQVksR0FBRztnQkFDZCxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJO2dCQUN2QixrQkFBa0IsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLO2FBQ1osQ0FBQztZQUVsQyxXQUFXLEdBQUc7Z0JBQ2IsU0FBUyxFQUFFLCtCQUFhLENBQUMsU0FBUzthQUNiLENBQUM7WUFFdkIsVUFBVSxHQUFHLEtBQUssQ0FBQyxH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