/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/contrib/clipboard/browser/clipboard", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/editor/browser/editorExtensions", "vs/platform/action/common/actionCommonCategories", "vs/platform/log/common/log", "vs/platform/commands/common/commands", "vs/workbench/services/log/common/logConstants", "vs/base/browser/dom"], function (require, exports, nls_1, lifecycle_1, contributions_1, editorService_1, notebookContextKeys_1, notebookBrowser_1, clipboard_1, clipboardService_1, notebookCellTextModel_1, notebookCommon_1, notebookService_1, platform, actions_1, coreActions_1, contextkey_1, contextkeys_1, editorExtensions_1, actionCommonCategories_1, log_1, commands_1, logConstants_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookClipboardContribution = void 0;
    exports.runPasteCells = runPasteCells;
    exports.runCopyCells = runCopyCells;
    exports.runCutCells = runCutCells;
    let _logging = false;
    function toggleLogging() {
        _logging = !_logging;
    }
    function _log(loggerService, str) {
        if (_logging) {
            loggerService.info(`[NotebookClipboard]: ${str}`);
        }
    }
    function getFocusedEditor(accessor) {
        const loggerService = accessor.get(log_1.ILogService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            _log(loggerService, '[Revive Webview] No notebook editor found for active editor pane, bypass');
            return;
        }
        if (!editor.hasEditorFocus()) {
            _log(loggerService, '[Revive Webview] Notebook editor is not focused, bypass');
            return;
        }
        if (!editor.hasWebviewFocus()) {
            _log(loggerService, '[Revive Webview] Notebook editor backlayer webview is not focused, bypass');
            return;
        }
        // If none of the outputs have focus, then webview is not focused
        const view = editor.getViewModel();
        if (view && view.viewCells.every(cell => !cell.outputIsFocused && !cell.outputIsHovered)) {
            return;
        }
        return { editor, loggerService };
    }
    function getFocusedWebviewDelegate(accessor) {
        const result = getFocusedEditor(accessor);
        if (!result) {
            return;
        }
        const webview = result.editor.getInnerWebview();
        _log(result.loggerService, '[Revive Webview] Notebook editor backlayer webview is focused');
        return webview;
    }
    function withWebview(accessor, f) {
        const webview = getFocusedWebviewDelegate(accessor);
        if (webview) {
            f(webview);
            return true;
        }
        return false;
    }
    function withEditor(accessor, f) {
        const result = getFocusedEditor(accessor);
        return result ? f(result.editor) : false;
    }
    const PRIORITY = 105;
    editorExtensions_1.UndoCommand.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.undo());
    });
    editorExtensions_1.RedoCommand.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.redo());
    });
    clipboard_1.CopyAction?.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.copy());
    });
    clipboard_1.PasteAction?.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.paste());
    });
    clipboard_1.CutAction?.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.cut());
    });
    function runPasteCells(editor, activeCell, pasteCells) {
        if (!editor.hasModel()) {
            return false;
        }
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return false;
        }
        const originalState = {
            kind: notebookCommon_1.SelectionStateType.Index,
            focus: editor.getFocus(),
            selections: editor.getSelections()
        };
        if (activeCell) {
            const currCellIndex = editor.getCellIndex(activeCell);
            const newFocusIndex = typeof currCellIndex === 'number' ? currCellIndex + 1 : 0;
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: newFocusIndex,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusIndex, end: newFocusIndex + 1 },
                selections: [{ start: newFocusIndex, end: newFocusIndex + pasteCells.items.length }]
            }), undefined, true);
        }
        else {
            if (editor.getLength() !== 0) {
                return false;
            }
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: 0,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: 0, end: 1 },
                selections: [{ start: 1, end: pasteCells.items.length + 1 }]
            }), undefined, true);
        }
        return true;
    }
    function runCopyCells(accessor, editor, targetCell) {
        if (!editor.hasModel()) {
            return false;
        }
        if (editor.hasOutputTextSelection()) {
            (0, dom_1.getWindow)(editor.getDomNode()).document.execCommand('copy');
            return true;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const selections = editor.getSelections();
        if (targetCell) {
            const targetCellIndex = editor.getCellIndex(targetCell);
            const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
            if (!containingSelection) {
                clipboardService.writeText(targetCell.getText());
                notebookService.setToCopy([targetCell.model], true);
                return true;
            }
        }
        const selectionRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, editor.getSelections());
        const selectedCells = (0, notebookBrowser_1.cellRangeToViewCells)(editor, selectionRanges);
        if (!selectedCells.length) {
            return false;
        }
        clipboardService.writeText(selectedCells.map(cell => cell.getText()).join('\n'));
        notebookService.setToCopy(selectedCells.map(cell => cell.model), true);
        return true;
    }
    function runCutCells(accessor, editor, targetCell) {
        if (!editor.hasModel() || editor.isReadOnly) {
            return false;
        }
        const textModel = editor.textModel;
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const selections = editor.getSelections();
        if (targetCell) {
            // from ui
            const targetCellIndex = editor.getCellIndex(targetCell);
            const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
            if (!containingSelection) {
                clipboardService.writeText(targetCell.getText());
                // delete cell
                const focus = editor.getFocus();
                const newFocus = focus.end <= targetCellIndex ? focus : { start: focus.start - 1, end: focus.end - 1 };
                const newSelections = selections.map(selection => (selection.end <= targetCellIndex ? selection : { start: selection.start - 1, end: selection.end - 1 }));
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: targetCellIndex, count: 1, cells: [] }
                ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selections }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
                notebookService.setToCopy([targetCell.model], false);
                return true;
            }
        }
        const focus = editor.getFocus();
        const containingSelection = selections.find(selection => selection.start <= focus.start && focus.end <= selection.end);
        if (!containingSelection) {
            // focus is out of any selection, we should only cut this cell
            const targetCell = editor.cellAt(focus.start);
            clipboardService.writeText(targetCell.getText());
            const newFocus = focus.end === editor.getLength() ? { start: focus.start - 1, end: focus.end - 1 } : focus;
            const newSelections = selections.map(selection => (selection.end <= focus.start ? selection : { start: selection.start - 1, end: selection.end - 1 }));
            textModel.applyEdits([
                { editType: 1 /* CellEditType.Replace */, index: focus.start, count: 1, cells: [] }
            ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selections }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
            notebookService.setToCopy([targetCell.model], false);
            return true;
        }
        const selectionRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, editor.getSelections());
        const selectedCells = (0, notebookBrowser_1.cellRangeToViewCells)(editor, selectionRanges);
        if (!selectedCells.length) {
            return false;
        }
        clipboardService.writeText(selectedCells.map(cell => cell.getText()).join('\n'));
        const edits = selectionRanges.map(range => ({ editType: 1 /* CellEditType.Replace */, index: range.start, count: range.end - range.start, cells: [] }));
        const firstSelectIndex = selectionRanges[0].start;
        /**
         * If we have cells, 0, 1, 2, 3, 4, 5, 6
         * and cells 1, 2 are selected, and then we delete cells 1 and 2
         * the new focused cell should still be at index 1
         */
        const newFocusedCellIndex = firstSelectIndex < textModel.cells.length - 1
            ? firstSelectIndex
            : Math.max(textModel.cells.length - 2, 0);
        textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selectionRanges }, () => {
            return {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusedCellIndex, end: newFocusedCellIndex + 1 },
                selections: [{ start: newFocusedCellIndex, end: newFocusedCellIndex + 1 }]
            };
        }, undefined, true);
        notebookService.setToCopy(selectedCells.map(cell => cell.model), false);
        return true;
    }
    let NotebookClipboardContribution = class NotebookClipboardContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.notebookClipboard'; }
        constructor(_editorService) {
            super();
            this._editorService = _editorService;
            const PRIORITY = 105;
            if (clipboard_1.CopyAction) {
                this._register(clipboard_1.CopyAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runCopyAction(accessor);
                }));
            }
            if (clipboard_1.PasteAction) {
                this._register(clipboard_1.PasteAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runPasteAction(accessor);
                }));
            }
            if (clipboard_1.CutAction) {
                this._register(clipboard_1.CutAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runCutAction(accessor);
                }));
            }
        }
        _getContext() {
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            const activeCell = editor?.getActiveCell();
            return {
                editor,
                activeCell
            };
        }
        _focusInsideEmebedMonaco(editor) {
            const windowSelection = (0, dom_1.getWindow)(editor.getDomNode()).getSelection();
            if (windowSelection?.rangeCount !== 1) {
                return false;
            }
            const activeSelection = windowSelection.getRangeAt(0);
            if (activeSelection.startContainer === activeSelection.endContainer && activeSelection.endOffset - activeSelection.startOffset === 0) {
                return false;
            }
            let container = activeSelection.commonAncestorContainer;
            const body = editor.getDomNode();
            if (!body.contains(container)) {
                return false;
            }
            while (container
                &&
                    container !== body) {
                if (container.classList && container.classList.contains('monaco-editor')) {
                    return true;
                }
                container = container.parentNode;
            }
            return false;
        }
        runCopyAction(accessor) {
            const loggerService = accessor.get(log_1.ILogService);
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement instanceof HTMLElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                _log(loggerService, '[NotebookEditor] focus is on input or textarea element, bypass');
                return false;
            }
            const { editor } = this._getContext();
            if (!editor) {
                _log(loggerService, '[NotebookEditor] no active notebook editor, bypass');
                return false;
            }
            if (!(0, dom_1.isAncestor)(activeElement, editor.getDomNode())) {
                _log(loggerService, '[NotebookEditor] focus is outside of the notebook editor, bypass');
                return false;
            }
            if (this._focusInsideEmebedMonaco(editor)) {
                _log(loggerService, '[NotebookEditor] focus is on embed monaco editor, bypass');
                return false;
            }
            _log(loggerService, '[NotebookEditor] run copy actions on notebook model');
            return runCopyCells(accessor, editor, undefined);
        }
        runPasteAction(accessor) {
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                return false;
            }
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            if (!pasteCells) {
                return false;
            }
            const { editor, activeCell } = this._getContext();
            if (!editor) {
                return false;
            }
            return runPasteCells(editor, activeCell, pasteCells);
        }
        runCutAction(accessor) {
            const activeElement = (0, dom_1.getActiveElement)();
            if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                return false;
            }
            const { editor } = this._getContext();
            if (!editor) {
                return false;
            }
            return runCutCells(accessor, editor, undefined);
        }
    };
    exports.NotebookClipboardContribution = NotebookClipboardContribution;
    exports.NotebookClipboardContribution = NotebookClipboardContribution = __decorate([
        __param(0, editorService_1.IEditorService)
    ], NotebookClipboardContribution);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookClipboardContribution.ID, NotebookClipboardContribution, 2 /* WorkbenchPhase.BlockRestore */);
    const COPY_CELL_COMMAND_ID = 'notebook.cell.copy';
    const CUT_CELL_COMMAND_ID = 'notebook.cell.cut';
    const PASTE_CELL_COMMAND_ID = 'notebook.cell.paste';
    const PASTE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.pasteAbove';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.copy', "Copy Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                    order: 2,
                },
                keybinding: platform.isNative ? undefined : {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, secondary: [2048 /* KeyMod.CtrlCmd */ | 19 /* KeyCode.Insert */] },
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            runCopyCells(accessor, context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: CUT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.cut', "Cut Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                    order: 1,
                },
                keybinding: platform.isNative ? undefined : {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */, secondary: [1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */] },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            runCutCells(accessor, context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: PASTE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.paste', "Paste Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                    order: 3,
                },
                keybinding: platform.isNative ? undefined : {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            if (!pasteCells) {
                return;
            }
            runPasteCells(context.notebookEditor, context.cell, pasteCells);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: PASTE_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.pasteAbove', "Paste Cell Above"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            const editor = context.notebookEditor;
            const textModel = editor.textModel;
            if (editor.isReadOnly) {
                return;
            }
            if (!pasteCells) {
                return;
            }
            const originalState = {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            };
            const currCellIndex = context.notebookEditor.getCellIndex(context.cell);
            const newFocusIndex = currCellIndex;
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: currCellIndex,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusIndex, end: newFocusIndex + 1 },
                selections: [{ start: newFocusIndex, end: newFocusIndex + pasteCells.items.length }]
            }), undefined, true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleNotebookClipboardLog',
                title: (0, nls_1.localize2)('toggleNotebookClipboardLog', 'Toggle Notebook Clipboard Troubleshooting'),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            toggleLogging();
            if (_logging) {
                const commandService = accessor.get(commands_1.ICommandService);
                commandService.executeCommand(logConstants_1.showWindowLogActionId);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.output.selectAll',
                title: (0, nls_1.localize)('notebook.cell.output.selectAll', "Select All"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                    weight: coreActions_1.NOTEBOOK_OUTPUT_WEBVIEW_ACTION_WEIGHT
                }
            });
        }
        async runWithContext(accessor, _context) {
            withEditor(accessor, editor => {
                if (!editor.hasEditorFocus()) {
                    return false;
                }
                if (editor.hasEditorFocus() && !editor.hasWebviewFocus()) {
                    return true;
                }
                const cell = editor.getActiveCell();
                if (!cell || !cell.outputIsFocused || !editor.hasWebviewFocus()) {
                    return true;
                }
                if (cell.inputInOutputIsFocused) {
                    editor.selectInputContents(cell);
                }
                else {
                    editor.selectOutputContent(cell);
                }
                return true;
            });
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tDbGlwYm9hcmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9jbGlwYm9hcmQvbm90ZWJvb2tDbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0hoRyxzQ0FzREM7SUFFRCxvQ0FvQ0M7SUFDRCxrQ0E4RUM7SUE5UEQsSUFBSSxRQUFRLEdBQVksS0FBSyxDQUFDO0lBQzlCLFNBQVMsYUFBYTtRQUNyQixRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELFNBQVMsSUFBSSxDQUFDLGFBQTBCLEVBQUUsR0FBVztRQUNwRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2QsYUFBYSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsZ0JBQWdCLENBQUMsUUFBMEI7UUFDbkQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUM7UUFDaEQsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7UUFDbkQsTUFBTSxNQUFNLEdBQUcsSUFBQSxpREFBK0IsRUFBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsYUFBYSxFQUFFLDBFQUEwRSxDQUFDLENBQUM7WUFDaEcsT0FBTztRQUNSLENBQUM7UUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLGFBQWEsRUFBRSx5REFBeUQsQ0FB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