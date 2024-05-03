/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, contextkey_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOTEBOOK_HAS_OUTPUTS = exports.NOTEBOOK_MISSING_KERNEL_EXTENSION = exports.NOTEBOOK_INTERRUPTIBLE_KERNEL = exports.NOTEBOOK_KERNEL_SELECTED = exports.NOTEBOOK_KERNEL_SOURCE_COUNT = exports.NOTEBOOK_KERNEL_COUNT = exports.NOTEBOOK_KERNEL = exports.NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS = exports.NOTEBOOK_CELL_GENERATED_BY_CHAT = exports.NOTEBOOK_CELL_RESOURCE = exports.NOTEBOOK_CELL_OUTPUT_COLLAPSED = exports.NOTEBOOK_CELL_INPUT_COLLAPSED = exports.NOTEBOOK_CELL_HAS_OUTPUTS = exports.NOTEBOOK_CELL_EXECUTING = exports.NOTEBOOK_CELL_EXECUTION_STATE = exports.NOTEBOOK_CELL_LINE_NUMBERS = exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = exports.NOTEBOOK_CELL_EDITOR_FOCUSED = exports.NOTEBOOK_CELL_FOCUSED = exports.NOTEBOOK_CELL_EDITABLE = exports.NOTEBOOK_CELL_TYPE = exports.NOTEBOOK_VIEW_TYPE = exports.NOTEBOOK_LAST_CELL_FAILED = exports.NOTEBOOK_CURSOR_NAVIGATION_MODE = exports.NOTEBOOK_CELL_TOOLBAR_LOCATION = exports.NOTEBOOK_BREAKPOINT_MARGIN_ACTIVE = exports.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON = exports.NOTEBOOK_HAS_SOMETHING_RUNNING = exports.NOTEBOOK_HAS_RUNNING_CELL = exports.NOTEBOOK_EDITOR_EDITABLE = exports.NOTEBOOK_OUPTUT_INPUT_FOCUSED = exports.NOTEBOOK_OUTPUT_FOCUSED = exports.NOTEBOOK_CELL_LIST_FOCUSED = exports.NOTEBOOK_EDITOR_FOCUSED = exports.INTERACTIVE_WINDOW_IS_ACTIVE_EDITOR = exports.NOTEBOOK_IS_ACTIVE_EDITOR = exports.InteractiveWindowOpen = exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = exports.HAS_OPENED_NOTEBOOK = void 0;
    //#region Context Keys
    exports.HAS_OPENED_NOTEBOOK = new contextkey_1.RawContextKey('userHasOpenedNotebook', false);
    exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('notebookFindWidgetFocused', false);
    exports.InteractiveWindowOpen = new contextkey_1.RawContextKey('interactiveWindowOpen', false);
    // Is Notebook
    exports.NOTEBOOK_IS_ACTIVE_EDITOR = contextkey_1.ContextKeyExpr.equals('activeEditor', notebookCommon_1.NOTEBOOK_EDITOR_ID);
    exports.INTERACTIVE_WINDOW_IS_ACTIVE_EDITOR = contextkey_1.ContextKeyExpr.equals('activeEditor', notebookCommon_1.INTERACTIVE_WINDOW_EDITOR_ID);
    // Editor keys
    exports.NOTEBOOK_EDITOR_FOCUSED = new contextkey_1.RawContextKey('notebookEditorFocused', false);
    exports.NOTEBOOK_CELL_LIST_FOCUSED = new contextkey_1.RawContextKey('notebookCellListFocused', false);
    exports.NOTEBOOK_OUTPUT_FOCUSED = new contextkey_1.RawContextKey('notebookOutputFocused', false);
    exports.NOTEBOOK_OUPTUT_INPUT_FOCUSED = new contextkey_1.RawContextKey('notebookOutputInputFocused', false);
    exports.NOTEBOOK_EDITOR_EDITABLE = new contextkey_1.RawContextKey('notebookEditable', true);
    exports.NOTEBOOK_HAS_RUNNING_CELL = new contextkey_1.RawContextKey('notebookHasRunningCell', false);
    exports.NOTEBOOK_HAS_SOMETHING_RUNNING = new contextkey_1.RawContextKey('notebookHasSomethingRunning', false);
    exports.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON = new contextkey_1.RawContextKey('notebookUseConsolidatedOutputButton', false);
    exports.NOTEBOOK_BREAKPOINT_MARGIN_ACTIVE = new contextkey_1.RawContextKey('notebookBreakpointMargin', false);
    exports.NOTEBOOK_CELL_TOOLBAR_LOCATION = new contextkey_1.RawContextKey('notebookCellToolbarLocation', 'left');
    exports.NOTEBOOK_CURSOR_NAVIGATION_MODE = new contextkey_1.RawContextKey('notebookCursorNavigationMode', false);
    exports.NOTEBOOK_LAST_CELL_FAILED = new contextkey_1.RawContextKey('notebookLastCellFailed', false);
    // Cell keys
    exports.NOTEBOOK_VIEW_TYPE = new contextkey_1.RawContextKey('notebookType', undefined);
    exports.NOTEBOOK_CELL_TYPE = new contextkey_1.RawContextKey('notebookCellType', undefined);
    exports.NOTEBOOK_CELL_EDITABLE = new contextkey_1.RawContextKey('notebookCellEditable', false);
    exports.NOTEBOOK_CELL_FOCUSED = new contextkey_1.RawContextKey('notebookCellFocused', false);
    exports.NOTEBOOK_CELL_EDITOR_FOCUSED = new contextkey_1.RawContextKey('notebookCellEditorFocused', false);
    exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = new contextkey_1.RawContextKey('notebookCellMarkdownEditMode', false);
    exports.NOTEBOOK_CELL_LINE_NUMBERS = new contextkey_1.RawContextKey('notebookCellLineNumbers', 'inherit');
    exports.NOTEBOOK_CELL_EXECUTION_STATE = new contextkey_1.RawContextKey('notebookCellExecutionState', undefined);
    exports.NOTEBOOK_CELL_EXECUTING = new contextkey_1.RawContextKey('notebookCellExecuting', false); // This only exists to simplify a context key expression, see #129625
    exports.NOTEBOOK_CELL_HAS_OUTPUTS = new contextkey_1.RawContextKey('notebookCellHasOutputs', false);
    exports.NOTEBOOK_CELL_INPUT_COLLAPSED = new contextkey_1.RawContextKey('notebookCellInputIsCollapsed', false);
    exports.NOTEBOOK_CELL_OUTPUT_COLLAPSED = new contextkey_1.RawContextKey('notebookCellOutputIsCollapsed', false);
    exports.NOTEBOOK_CELL_RESOURCE = new contextkey_1.RawContextKey('notebookCellResource', '');
    exports.NOTEBOOK_CELL_GENERATED_BY_CHAT = new contextkey_1.RawContextKey('notebookCellGenerateByChat', false);
    exports.NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS = new contextkey_1.RawContextKey('notebookCellHasErrorDiagnostics', false);
    // Kernels
    exports.NOTEBOOK_KERNEL = new contextkey_1.RawContextKey('notebookKernel', undefined);
    exports.NOTEBOOK_KERNEL_COUNT = new contextkey_1.RawContextKey('notebookKernelCount', 0);
    exports.NOTEBOOK_KERNEL_SOURCE_COUNT = new contextkey_1.RawContextKey('notebookKernelSourceCount', 0);
    exports.NOTEBOOK_KERNEL_SELECTED = new contextkey_1.RawContextKey('notebookKernelSelected', false);
    exports.NOTEBOOK_INTERRUPTIBLE_KERNEL = new contextkey_1.RawContextKey('notebookInterruptibleKernel', false);
    exports.NOTEBOOK_MISSING_KERNEL_EXTENSION = new contextkey_1.RawContextKey('notebookMissingKernelExtension', false);
    exports.NOTEBOOK_HAS_OUTPUTS = new contextkey_1.RawContextKey('notebookHasOutputs', false);
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDb250ZXh0S2V5cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svY29tbW9uL25vdGVib29rQ29udGV4dEtleXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLHNCQUFzQjtJQUNULFFBQUEsbUJBQW1CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pGLFFBQUEsK0NBQStDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pILFFBQUEscUJBQXFCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRWhHLGNBQWM7SUFDRCxRQUFBLHlCQUF5QixHQUFHLDJCQUFjLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxtQ0FBa0IsQ0FBQyxDQUFDO0lBQ3RGLFFBQUEsbUNBQW1DLEdBQUcsMkJBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLDZDQUE0QixDQUFDLENBQUM7SUFFdkgsY0FBYztJQUNELFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JGLFFBQUEsMEJBQTBCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFGLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JGLFFBQUEsNkJBQTZCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hHLFFBQUEsd0JBQXdCLEdBQUcsSUFBSSwwQkFB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