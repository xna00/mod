/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, notebookCommon_1, notebookEditorInput_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFoldingState = exports.CursorAtLineBoundary = exports.CursorAtBoundary = exports.CellFocusMode = exports.CellEditState = exports.CellRevealRangeType = exports.CellRevealType = exports.NotebookOverviewRulerLane = exports.CellLayoutContext = exports.CellLayoutState = exports.ScrollToRevealBehavior = exports.RenderOutputType = exports.KERNEL_RECOMMENDATIONS = exports.KERNEL_EXTENSIONS = exports.JUPYTER_EXTENSION_ID = exports.IPYNB_VIEW_TYPE = exports.EXPAND_CELL_OUTPUT_COMMAND_ID = exports.QUIT_EDIT_CELL_COMMAND_ID = exports.CHANGE_CELL_LANGUAGE = exports.DETECT_CELL_LANGUAGE = exports.EXECUTE_CELL_COMMAND_ID = exports.EXPAND_CELL_INPUT_COMMAND_ID = void 0;
    exports.getNotebookEditorFromEditorPane = getNotebookEditorFromEditorPane;
    exports.expandCellRangesWithHiddenCells = expandCellRangesWithHiddenCells;
    exports.cellRangeToViewCells = cellRangeToViewCells;
    //#region Shared commands
    exports.EXPAND_CELL_INPUT_COMMAND_ID = 'notebook.cell.expandCellInput';
    exports.EXECUTE_CELL_COMMAND_ID = 'notebook.cell.execute';
    exports.DETECT_CELL_LANGUAGE = 'notebook.cell.detectLanguage';
    exports.CHANGE_CELL_LANGUAGE = 'notebook.cell.changeLanguage';
    exports.QUIT_EDIT_CELL_COMMAND_ID = 'notebook.cell.quitEdit';
    exports.EXPAND_CELL_OUTPUT_COMMAND_ID = 'notebook.cell.expandCellOutput';
    //#endregion
    //#region Notebook extensions
    // Hardcoding viewType/extension ID for now. TODO these should be replaced once we can
    // look them up in the marketplace dynamically.
    exports.IPYNB_VIEW_TYPE = 'jupyter-notebook';
    exports.JUPYTER_EXTENSION_ID = 'ms-toolsai.jupyter';
    /** @deprecated use the notebookKernel<Type> "keyword" instead */
    exports.KERNEL_EXTENSIONS = new Map([
        [exports.IPYNB_VIEW_TYPE, exports.JUPYTER_EXTENSION_ID],
    ]);
    // @TODO lramos15, place this in a similar spot to our normal recommendations.
    exports.KERNEL_RECOMMENDATIONS = new Map();
    exports.KERNEL_RECOMMENDATIONS.set(exports.IPYNB_VIEW_TYPE, new Map());
    exports.KERNEL_RECOMMENDATIONS.get(exports.IPYNB_VIEW_TYPE)?.set('python', {
        extensionIds: [
            'ms-python.python',
            exports.JUPYTER_EXTENSION_ID
        ],
        displayName: 'Python + Jupyter',
    });
    //#endregion
    //#region  Output related types
    // !! IMPORTANT !! ----------------------------------------------------------------------------------
    // NOTE that you MUST update vs/workbench/contrib/notebook/browser/view/renderers/webviewPreloads.ts#L1986
    // whenever changing the values of this const enum. The webviewPreloads-files manually inlines these values
    // because it cannot have dependencies.
    // !! IMPORTANT !! ----------------------------------------------------------------------------------
    var RenderOutputType;
    (function (RenderOutputType) {
        RenderOutputType[RenderOutputType["Html"] = 0] = "Html";
        RenderOutputType[RenderOutputType["Extension"] = 1] = "Extension";
    })(RenderOutputType || (exports.RenderOutputType = RenderOutputType = {}));
    var ScrollToRevealBehavior;
    (function (ScrollToRevealBehavior) {
        ScrollToRevealBehavior[ScrollToRevealBehavior["fullCell"] = 0] = "fullCell";
        ScrollToRevealBehavior[ScrollToRevealBehavior["firstLine"] = 1] = "firstLine";
    })(ScrollToRevealBehavior || (exports.ScrollToRevealBehavior = ScrollToRevealBehavior = {}));
    //#endregion
    var CellLayoutState;
    (function (CellLayoutState) {
        CellLayoutState[CellLayoutState["Uninitialized"] = 0] = "Uninitialized";
        CellLayoutState[CellLayoutState["Estimated"] = 1] = "Estimated";
        CellLayoutState[CellLayoutState["FromCache"] = 2] = "FromCache";
        CellLayoutState[CellLayoutState["Measured"] = 3] = "Measured";
    })(CellLayoutState || (exports.CellLayoutState = CellLayoutState = {}));
    var CellLayoutContext;
    (function (CellLayoutContext) {
        CellLayoutContext[CellLayoutContext["Fold"] = 0] = "Fold";
    })(CellLayoutContext || (exports.CellLayoutContext = CellLayoutContext = {}));
    /**
     * Vertical Lane in the overview ruler of the notebook editor.
     */
    var NotebookOverviewRulerLane;
    (function (NotebookOverviewRulerLane) {
        NotebookOverviewRulerLane[NotebookOverviewRulerLane["Left"] = 1] = "Left";
        NotebookOverviewRulerLane[NotebookOverviewRulerLane["Center"] = 2] = "Center";
        NotebookOverviewRulerLane[NotebookOverviewRulerLane["Right"] = 4] = "Right";
        NotebookOverviewRulerLane[NotebookOverviewRulerLane["Full"] = 7] = "Full";
    })(NotebookOverviewRulerLane || (exports.NotebookOverviewRulerLane = NotebookOverviewRulerLane = {}));
    var CellRevealType;
    (function (CellRevealType) {
        CellRevealType[CellRevealType["Default"] = 1] = "Default";
        CellRevealType[CellRevealType["Top"] = 2] = "Top";
        CellRevealType[CellRevealType["Center"] = 3] = "Center";
        CellRevealType[CellRevealType["CenterIfOutsideViewport"] = 4] = "CenterIfOutsideViewport";
        CellRevealType[CellRevealType["NearTopIfOutsideViewport"] = 5] = "NearTopIfOutsideViewport";
        CellRevealType[CellRevealType["FirstLineIfOutsideViewport"] = 6] = "FirstLineIfOutsideViewport";
    })(CellRevealType || (exports.CellRevealType = CellRevealType = {}));
    var CellRevealRangeType;
    (function (CellRevealRangeType) {
        CellRevealRangeType[CellRevealRangeType["Default"] = 1] = "Default";
        CellRevealRangeType[CellRevealRangeType["Center"] = 2] = "Center";
        CellRevealRangeType[CellRevealRangeType["CenterIfOutsideViewport"] = 3] = "CenterIfOutsideViewport";
    })(CellRevealRangeType || (exports.CellRevealRangeType = CellRevealRangeType = {}));
    var CellEditState;
    (function (CellEditState) {
        /**
         * Default state.
         * For markup cells, this is the renderer version of the markup.
         * For code cell, the browser focus should be on the container instead of the editor
         */
        CellEditState[CellEditState["Preview"] = 0] = "Preview";
        /**
         * Editing mode. Source for markup or code is rendered in editors and the state will be persistent.
         */
        CellEditState[CellEditState["Editing"] = 1] = "Editing";
    })(CellEditState || (exports.CellEditState = CellEditState = {}));
    var CellFocusMode;
    (function (CellFocusMode) {
        CellFocusMode[CellFocusMode["Container"] = 0] = "Container";
        CellFocusMode[CellFocusMode["Editor"] = 1] = "Editor";
        CellFocusMode[CellFocusMode["Output"] = 2] = "Output";
        CellFocusMode[CellFocusMode["ChatInput"] = 3] = "ChatInput";
    })(CellFocusMode || (exports.CellFocusMode = CellFocusMode = {}));
    var CursorAtBoundary;
    (function (CursorAtBoundary) {
        CursorAtBoundary[CursorAtBoundary["None"] = 0] = "None";
        CursorAtBoundary[CursorAtBoundary["Top"] = 1] = "Top";
        CursorAtBoundary[CursorAtBoundary["Bottom"] = 2] = "Bottom";
        CursorAtBoundary[CursorAtBoundary["Both"] = 3] = "Both";
    })(CursorAtBoundary || (exports.CursorAtBoundary = CursorAtBoundary = {}));
    var CursorAtLineBoundary;
    (function (CursorAtLineBoundary) {
        CursorAtLineBoundary[CursorAtLineBoundary["None"] = 0] = "None";
        CursorAtLineBoundary[CursorAtLineBoundary["Start"] = 1] = "Start";
        CursorAtLineBoundary[CursorAtLineBoundary["End"] = 2] = "End";
        CursorAtLineBoundary[CursorAtLineBoundary["Both"] = 3] = "Both";
    })(CursorAtLineBoundary || (exports.CursorAtLineBoundary = CursorAtLineBoundary = {}));
    function getNotebookEditorFromEditorPane(editorPane) {
        if (!editorPane) {
            return;
        }
        if (editorPane.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
            return editorPane.getControl();
        }
        const input = editorPane.input;
        if (input && (0, notebookEditorInput_1.isCompositeNotebookEditorInput)(input)) {
            return editorPane.getControl()?.notebookEditor;
        }
        return undefined;
    }
    /**
     * ranges: model selections
     * this will convert model selections to view indexes first, and then include the hidden ranges in the list view
     */
    function expandCellRangesWithHiddenCells(editor, ranges) {
        // assuming ranges are sorted and no overlap
        const indexes = (0, notebookRange_1.cellRangesToIndexes)(ranges);
        const modelRanges = [];
        indexes.forEach(index => {
            const viewCell = editor.cellAt(index);
            if (!viewCell) {
                return;
            }
            const viewIndex = editor.getViewIndexByModelIndex(index);
            if (viewIndex < 0) {
                return;
            }
            const nextViewIndex = viewIndex + 1;
            const range = editor.getCellRangeFromViewRange(viewIndex, nextViewIndex);
            if (range) {
                modelRanges.push(range);
            }
        });
        return (0, notebookRange_1.reduceCellRanges)(modelRanges);
    }
    function cellRangeToViewCells(editor, ranges) {
        const cells = [];
        (0, notebookRange_1.reduceCellRanges)(ranges).forEach(range => {
            cells.push(...editor.getCellsInRange(range));
        });
        return cells;
    }
    //#region Cell Folding
    var CellFoldingState;
    (function (CellFoldingState) {
        CellFoldingState[CellFoldingState["None"] = 0] = "None";
        CellFoldingState[CellFoldingState["Expanded"] = 1] = "Expanded";
        CellFoldingState[CellFoldingState["Collapsed"] = 2] = "Collapsed";
    })(CellFoldingState || (exports.CellFoldingState = CellFoldingState = {}));
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tCcm93c2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL25vdGVib29rQnJvd3Nlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnMkJoRywwRUFnQkM7SUFNRCwwRUF5QkM7SUFFRCxvREFPQztJQXozQkQseUJBQXlCO0lBQ1osUUFBQSw0QkFBNEIsR0FBRywrQkFBK0IsQ0FBQztJQUMvRCxRQUFBLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDO0lBQ2xELFFBQUEsb0JBQW9CLEdBQUcsOEJBQThCLENBQUM7SUFDdEQsUUFBQSxvQkFBb0IsR0FBRyw4QkFBOEIsQ0FBQztJQUN0RCxRQUFBLHlCQUF5QixHQUFHLHdCQUF3QixDQUFDO0lBQ3JELFFBQUEsNkJBQTZCLEdBQUcsZ0NBQWdDLENBQUM7SUFHOUUsWUFBWTtJQUVaLDZCQUE2QjtJQUU3QixzRkFBc0Y7SUFDdEYsK0NBQStDO0lBQ2xDLFFBQUEsZUFBZSxHQUFHLGtCQUFrQixDQUFDO0lBQ3JDLFFBQUEsb0JBQW9CLEdBQUcsb0JBQW9CLENBQUM7SUFDekQsaUVBQWlFO0lBQ3BELFFBQUEsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLENBQWlCO1FBQ3hELENBQUMsdUJBQWUsRUFBRSw0QkFBb0IsQ0FBQztLQUN2QyxDQUFDLENBQUM7SUFDSCw4RUFBOEU7SUFDakUsUUFBQSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBeUQsQ0FBQztJQUN2Ryw4QkFBc0IsQ0FBQyxHQUFHLENBQUMsdUJBQWUsRUFBRSxJQUFJLEdBQUcsRUFBNEMsQ0FBQyxDQUFDO0lBQ2pHLDhCQUFzQixDQUFDLEdBQUcsQ0FBQyx1QkFBZSxDQUFDLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRTtRQUMxRCxZQUFZ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