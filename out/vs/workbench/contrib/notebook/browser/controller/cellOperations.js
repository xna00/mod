/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange", "vs/nls"], function (require, exports, bulkEditService_1, position_1, range_1, modesRegistry_1, bulkCellEdits_1, notebookBrowser_1, notebookCellTextModel_1, notebookCommon_1, notebookRange_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.changeCellToKind = changeCellToKind;
    exports.runDeleteAction = runDeleteAction;
    exports.moveCellRange = moveCellRange;
    exports.copyCellRange = copyCellRange;
    exports.joinSelectedCells = joinSelectedCells;
    exports.joinNotebookCells = joinNotebookCells;
    exports.joinCellsWithSurrounds = joinCellsWithSurrounds;
    exports.computeCellLinesContents = computeCellLinesContents;
    exports.insertCell = insertCell;
    exports.insertCellAtIndex = insertCellAtIndex;
    async function changeCellToKind(kind, context, language, mime) {
        const { notebookEditor } = context;
        if (!notebookEditor.hasModel()) {
            return;
        }
        if (notebookEditor.isReadOnly) {
            return;
        }
        if (context.ui && context.cell) {
            // action from UI
            const { cell } = context;
            if (cell.cellKind === kind) {
                return;
            }
            const text = cell.getText();
            const idx = notebookEditor.getCellIndex(cell);
            if (language === undefined) {
                const availableLanguages = notebookEditor.activeKernel?.supportedLanguages ?? [];
                language = availableLanguages[0] ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            }
            notebookEditor.textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: idx,
                    count: 1,
                    cells: [{
                            cellKind: kind,
                            source: text,
                            language: language,
                            mime: mime ?? cell.mime,
                            outputs: cell.model.outputs,
                            metadata: cell.metadata,
                        }]
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: notebookEditor.getFocus(),
                selections: notebookEditor.getSelections()
            }, () => {
                return {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: notebookEditor.getFocus(),
                    selections: notebookEditor.getSelections()
                };
            }, undefined, true);
            const newCell = notebookEditor.cellAt(idx);
            await notebookEditor.focusNotebookCell(newCell, cell.getEditState() === notebookBrowser_1.CellEditState.Editing ? 'editor' : 'container');
        }
        else if (context.selectedCells) {
            const selectedCells = context.selectedCells;
            const rawEdits = [];
            selectedCells.forEach(cell => {
                if (cell.cellKind === kind) {
                    return;
                }
                const text = cell.getText();
                const idx = notebookEditor.getCellIndex(cell);
                if (language === undefined) {
                    const availableLanguages = notebookEditor.activeKernel?.supportedLanguages ?? [];
                    language = availableLanguages[0] ?? modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                }
                rawEdits.push({
                    editType: 1 /* CellEditType.Replace */,
                    index: idx,
                    count: 1,
                    cells: [{
                            cellKind: kind,
                            source: text,
                            language: language,
                            mime: mime ?? cell.mime,
                            outputs: cell.model.outputs,
                            metadata: cell.metadata,
                        }]
                });
            });
            notebookEditor.textModel.applyEdits(rawEdits, true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: notebookEditor.getFocus(),
                selections: notebookEditor.getSelections()
            }, () => {
                return {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: notebookEditor.getFocus(),
                    selections: notebookEditor.getSelections()
                };
            }, undefined, true);
        }
    }
    function runDeleteAction(editor, cell) {
        const textModel = editor.textModel;
        const selections = editor.getSelections();
        const targetCellIndex = editor.getCellIndex(cell);
        const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
        const computeUndoRedo = !editor.isReadOnly || textModel.viewType === 'interactive';
        if (containingSelection) {
            const edits = selections.reverse().map(selection => ({
                editType: 1 /* CellEditType.Replace */, index: selection.start, count: selection.end - selection.start, cells: []
            }));
            const nextCellAfterContainingSelection = containingSelection.end >= editor.getLength() ? undefined : editor.cellAt(containingSelection.end);
            textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => {
                if (nextCellAfterContainingSelection) {
                    const cellIndex = textModel.cells.findIndex(cell => cell.handle === nextCellAfterContainingSelection.handle);
                    return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: cellIndex, end: cellIndex + 1 }, selections: [{ start: cellIndex, end: cellIndex + 1 }] };
                }
                else {
                    if (textModel.length) {
                        const lastCellIndex = textModel.length - 1;
                        return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: lastCellIndex, end: lastCellIndex + 1 }, selections: [{ start: lastCellIndex, end: lastCellIndex + 1 }] };
                    }
                    else {
                        return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 0 }, selections: [{ start: 0, end: 0 }] };
                    }
                }
            }, undefined, computeUndoRedo);
        }
        else {
            const focus = editor.getFocus();
            const edits = [{
                    editType: 1 /* CellEditType.Replace */, index: targetCellIndex, count: 1, cells: []
                }];
            const finalSelections = [];
            for (let i = 0; i < selections.length; i++) {
                const selection = selections[i];
                if (selection.end <= targetCellIndex) {
                    finalSelections.push(selection);
                }
                else if (selection.start > targetCellIndex) {
                    finalSelections.push({ start: selection.start - 1, end: selection.end - 1 });
                }
                else {
                    finalSelections.push({ start: targetCellIndex, end: targetCellIndex + 1 });
                }
            }
            if (editor.cellAt(focus.start) === cell) {
                // focus is the target, focus is also not part of any selection
                const newFocus = focus.end === textModel.length ? { start: focus.start - 1, end: focus.end - 1 } : focus;
                textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({
                    kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: finalSelections
                }), undefined, computeUndoRedo);
            }
            else {
                // users decide to delete a cell out of current focus/selection
                const newFocus = focus.start > targetCellIndex ? { start: focus.start - 1, end: focus.end - 1 } : focus;
                textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({
                    kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: finalSelections
                }), undefined, computeUndoRedo);
            }
        }
    }
    async function moveCellRange(context, direction) {
        if (!context.notebookEditor.hasModel()) {
            return;
        }
        const editor = context.notebookEditor;
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return;
        }
        const selections = editor.getSelections();
        const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, selections);
        const range = modelRanges[0];
        if (!range || range.start === range.end) {
            return;
        }
        if (direction === 'up') {
            if (range.start === 0) {
                return;
            }
            const indexAbove = range.start - 1;
            const finalSelection = { start: range.start - 1, end: range.end - 1 };
            const focus = context.notebookEditor.getFocus();
            const newFocus = (0, notebookRange_1.cellRangeContains)(range, focus) ? { start: focus.start - 1, end: focus.end - 1 } : { start: range.start - 1, end: range.start };
            textModel.applyEdits([
                {
                    editType: 6 /* CellEditType.Move */,
                    index: indexAbove,
                    length: 1,
                    newIdx: range.end - 1
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: [finalSelection] }), undefined, true);
            const focusRange = editor.getSelections()[0] ?? editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
        else {
            if (range.end >= textModel.length) {
                return;
            }
            const indexBelow = range.end;
            const finalSelection = { start: range.start + 1, end: range.end + 1 };
            const focus = editor.getFocus();
            const newFocus = (0, notebookRange_1.cellRangeContains)(range, focus) ? { start: focus.start + 1, end: focus.end + 1 } : { start: range.start + 1, end: range.start + 2 };
            textModel.applyEdits([
                {
                    editType: 6 /* CellEditType.Move */,
                    index: indexBelow,
                    length: 1,
                    newIdx: range.start
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: [finalSelection] }), undefined, true);
            const focusRange = editor.getSelections()[0] ?? editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
    }
    async function copyCellRange(context, direction) {
        const editor = context.notebookEditor;
        if (!editor.hasModel()) {
            return;
        }
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return;
        }
        let range = undefined;
        if (context.ui) {
            const targetCell = context.cell;
            const targetCellIndex = editor.getCellIndex(targetCell);
            range = { start: targetCellIndex, end: targetCellIndex + 1 };
        }
        else {
            const selections = editor.getSelections();
            const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, selections);
            range = modelRanges[0];
        }
        if (!range || range.start === range.end) {
            return;
        }
        if (direction === 'up') {
            // insert up, without changing focus and selections
            const focus = editor.getFocus();
            const selections = editor.getSelections();
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: range.end,
                    count: 0,
                    cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model))
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: focus, selections: selections }), undefined, true);
        }
        else {
            // insert down, move selections
            const focus = editor.getFocus();
            const selections = editor.getSelections();
            const newCells = (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model));
            const countDelta = newCells.length;
            const newFocus = context.ui ? focus : { start: focus.start + countDelta, end: focus.end + countDelta };
            const newSelections = context.ui ? selections : [{ start: range.start + countDelta, end: range.end + countDelta }];
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: range.end,
                    count: 0,
                    cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model))
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
            const focusRange = editor.getSelections()[0] ?? editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
    }
    async function joinSelectedCells(bulkEditService, notificationService, context) {
        const editor = context.notebookEditor;
        if (editor.isReadOnly) {
            return;
        }
        const edits = [];
        const cells = [];
        for (const selection of editor.getSelections()) {
            cells.push(...editor.getCellsInRange(selection));
        }
        if (cells.length <= 1) {
            return;
        }
        // check if all cells are of the same kind
        const cellKind = cells[0].cellKind;
        const isSameKind = cells.every(cell => cell.cellKind === cellKind);
        if (!isSameKind) {
            // cannot join cells of different kinds
            // show warning and quit
            const message = (0, nls_1.localize)('notebookActions.joinSelectedCells', "Cannot join cells of different kinds");
            return notificationService.warn(message);
        }
        // merge all cells content into first cell
        const firstCell = cells[0];
        const insertContent = cells.map(cell => cell.getText()).join(firstCell.textBuffer.getEOL());
        const firstSelection = editor.getSelections()[0];
        edits.push(new bulkCellEdits_1.ResourceNotebookCellEdit(editor.textModel.uri, {
            editType: 1 /* CellEditType.Replace */,
            index: firstSelection.start,
            count: firstSelection.end - firstSelection.start,
            cells: [{
                    cellKind: firstCell.cellKind,
                    source: insertContent,
                    language: firstCell.language,
                    mime: firstCell.mime,
                    outputs: firstCell.model.outputs,
                    metadata: firstCell.metadata,
                }]
        }));
        for (const selection of editor.getSelections().slice(1)) {
            edits.push(new bulkCellEdits_1.ResourceNotebookCellEdit(editor.textModel.uri, {
                editType: 1 /* CellEditType.Replace */,
                index: selection.start,
                count: selection.end - selection.start,
                cells: []
            }));
        }
        if (edits.length) {
            await bulkEditService.apply(edits, { quotableLabel: (0, nls_1.localize)('notebookActions.joinSelectedCells.label', "Join Notebook Cells") });
        }
    }
    async function joinNotebookCells(editor, range, direction, constraint) {
        if (editor.isReadOnly) {
            return null;
        }
        const textModel = editor.textModel;
        const cells = editor.getCellsInRange(range);
        if (!cells.length) {
            return null;
        }
        if (range.start === 0 && direction === 'above') {
            return null;
        }
        if (range.end === textModel.length && direction === 'below') {
            return null;
        }
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (constraint && cell.cellKind !== constraint) {
                return null;
            }
        }
        if (direction === 'above') {
            const above = editor.cellAt(range.start - 1);
            if (constraint && above.cellKind !== constraint) {
                return null;
            }
            const insertContent = cells.map(cell => (cell.textBuffer.getEOL() ?? '') + cell.getText()).join('');
            const aboveCellLineCount = above.textBuffer.getLineCount();
            const aboveCellLastLineEndColumn = above.textBuffer.getLineLength(aboveCellLineCount);
            return {
                edits: [
                    new bulkEditService_1.ResourceTextEdit(above.uri, { range: new range_1.Range(aboveCellLineCount, aboveCellLastLineEndColumn + 1, aboveCellLineCount, aboveCellLastLineEndColumn + 1), text: insertContent }),
                    new bulkCellEdits_1.ResourceNotebookCellEdit(textModel.uri, {
                        editType: 1 /* CellEditType.Replace */,
                        index: range.start,
                        count: range.end - range.start,
                        cells: []
                    })
                ],
                cell: above,
                endFocus: { start: range.start - 1, end: range.start },
                endSelections: [{ start: range.start - 1, end: range.start }]
            };
        }
        else {
            const below = editor.cellAt(range.end);
            if (constraint && below.cellKind !== constraint) {
                return null;
            }
            const cell = cells[0];
            const restCells = [...cells.slice(1), below];
            const insertContent = restCells.map(cl => (cl.textBuffer.getEOL() ?? '') + cl.getText()).join('');
            const cellLineCount = cell.textBuffer.getLineCount();
            const cellLastLineEndColumn = cell.textBuffer.getLineLength(cellLineCount);
            return {
                edits: [
                    new bulkEditService_1.ResourceTextEdit(cell.uri, { range: new range_1.Range(cellLineCount, cellLastLineEndColumn + 1, cellLineCount, cellLastLineEndColumn + 1), text: insertContent }),
                    new bulkCellEdits_1.ResourceNotebookCellEdit(textModel.uri, {
                        editType: 1 /* CellEditType.Replace */,
                        index: range.start + 1,
                        count: range.end - range.start,
                        cells: []
                    })
                ],
                cell,
                endFocus: { start: range.start, end: range.start + 1 },
                endSelections: [{ start: range.start, end: range.start + 1 }]
            };
        }
    }
    async function joinCellsWithSurrounds(bulkEditService, context, direction) {
        const editor = context.notebookEditor;
        const textModel = editor.textModel;
        const viewModel = editor.getViewModel();
        let ret = null;
        if (context.ui) {
            const focusMode = context.cell.focusMode;
            const cellIndex = editor.getCellIndex(context.cell);
            ret = await joinNotebookCells(editor, { start: cellIndex, end: cellIndex + 1 }, direction);
            if (!ret) {
                return;
            }
            await bulkEditService.apply(ret?.edits, { quotableLabel: 'Join Notebook Cells' });
            viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: ret.endFocus, selections: ret.endSelections });
            ret.cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'joinCellsWithSurrounds');
            editor.revealCellRangeInView(editor.getFocus());
            if (focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                ret.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
        else {
            const selections = editor.getSelections();
            if (!selections.length) {
                return;
            }
            const focus = editor.getFocus();
            const focusMode = editor.cellAt(focus.start)?.focusMode;
            const edits = [];
            let cell = null;
            const cells = [];
            for (let i = selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                const containFocus = (0, notebookRange_1.cellRangeContains)(selection, focus);
                if (selection.end >= textModel.length && direction === 'below'
                    || selection.start === 0 && direction === 'above') {
                    if (containFocus) {
                        cell = editor.cellAt(focus.start);
                    }
                    cells.push(...editor.getCellsInRange(selection));
                    continue;
                }
                const singleRet = await joinNotebookCells(editor, selection, direction);
                if (!singleRet) {
                    return;
                }
                edits.push(...singleRet.edits);
                cells.push(singleRet.cell);
                if (containFocus) {
                    cell = singleRet.cell;
                }
            }
            if (!edits.length) {
                return;
            }
            if (!cell || !cells.length) {
                return;
            }
            await bulkEditService.apply(edits, { quotableLabel: 'Join Notebook Cells' });
            cells.forEach(cell => {
                cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'joinCellsWithSurrounds');
            });
            viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Handle, primary: cell.handle, selections: cells.map(cell => cell.handle) });
            editor.revealCellRangeInView(editor.getFocus());
            const newFocusedCell = editor.cellAt(editor.getFocus().start);
            if (focusMode === notebookBrowser_1.CellFocusMode.Editor && newFocusedCell) {
                newFocusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
    }
    function _splitPointsToBoundaries(splitPoints, textBuffer) {
        const boundaries = [];
        const lineCnt = textBuffer.getLineCount();
        const getLineLen = (lineNumber) => {
            return textBuffer.getLineLength(lineNumber);
        };
        // split points need to be sorted
        splitPoints = splitPoints.sort((l, r) => {
            const lineDiff = l.lineNumber - r.lineNumber;
            const columnDiff = l.column - r.column;
            return lineDiff !== 0 ? lineDiff : columnDiff;
        });
        for (let sp of splitPoints) {
            if (getLineLen(sp.lineNumber) + 1 === sp.column && sp.column !== 1 /** empty line */ && sp.lineNumber < lineCnt) {
                sp = new position_1.Position(sp.lineNumber + 1, 1);
            }
            _pushIfAbsent(boundaries, sp);
        }
        if (boundaries.length === 0) {
            return null;
        }
        // boundaries already sorted and not empty
        const modelStart = new position_1.Position(1, 1);
        const modelEnd = new position_1.Position(lineCnt, getLineLen(lineCnt) + 1);
        return [modelStart, ...boundaries, modelEnd];
    }
    function _pushIfAbsent(positions, p) {
        const last = positions.length > 0 ? positions[positions.length - 1] : undefined;
        if (!last || last.lineNumber !== p.lineNumber || last.column !== p.column) {
            positions.push(p);
        }
    }
    function computeCellLinesContents(cell, splitPoints) {
        const rangeBoundaries = _splitPointsToBoundaries(splitPoints, cell.textBuffer);
        if (!rangeBoundaries) {
            return null;
        }
        const newLineModels = [];
        for (let i = 1; i < rangeBoundaries.length; i++) {
            const start = rangeBoundaries[i - 1];
            const end = rangeBoundaries[i];
            newLineModels.push(cell.textBuffer.getValueInRange(new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column), 0 /* EndOfLinePreference.TextDefined */));
        }
        return newLineModels;
    }
    function insertCell(languageService, editor, index, type, direction = 'above', initialText = '', ui = false) {
        const viewModel = editor.getViewModel();
        const activeKernel = editor.activeKernel;
        if (viewModel.options.isReadOnly) {
            return null;
        }
        const cell = editor.cellAt(index);
        const nextIndex = ui ? viewModel.getNextVisibleCellIndex(index) : index + 1;
        let language;
        if (type === notebookCommon_1.CellKind.Code) {
            const supportedLanguages = activeKernel?.supportedLanguages ?? languageService.getRegisteredLanguageIds();
            const defaultLanguage = supportedLanguages[0] || modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            if (cell?.cellKind === notebookCommon_1.CellKind.Code) {
                language = cell.language;
            }
            else if (cell?.cellKind === notebookCommon_1.CellKind.Markup) {
                const nearestCodeCellIndex = viewModel.nearestCodeCellIndex(index);
                if (nearestCodeCellIndex > -1) {
                    language = viewModel.cellAt(nearestCodeCellIndex).language;
                }
                else {
                    language = defaultLanguage;
                }
            }
            else {
                if (cell === undefined && direction === 'above') {
                    // insert cell at the very top
                    language = viewModel.viewCells.find(cell => cell.cellKind === notebookCommon_1.CellKind.Code)?.language || defaultLanguage;
                }
                else {
                    language = defaultLanguage;
                }
            }
            if (!supportedLanguages.includes(language)) {
                // the language no longer exists
                language = defaultLanguage;
            }
        }
        else {
            language = 'markdown';
        }
        const insertIndex = cell ?
            (direction === 'above' ? index : nextIndex) :
            index;
        return insertCellAtIndex(viewModel, insertIndex, initialText, language, type, undefined, [], true, true);
    }
    function insertCellAtIndex(viewModel, index, source, language, type, metadata, outputs, synchronous, pushUndoStop) {
        const endSelections = { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: index, end: index + 1 }, selections: [{ start: index, end: index + 1 }] };
        viewModel.notebookDocument.applyEdits([
            {
                editType: 1 /* CellEditType.Replace */,
                index,
                count: 0,
                cells: [
                    {
                        cellKind: type,
                        language: language,
                        mime: undefined,
                        outputs: outputs,
                        metadata: metadata,
                        source: source
                    }
                ]
            }
        ], synchronous, { kind: notebookCommon_1.SelectionStateType.Index, focus: viewModel.getFocus(), selections: viewModel.getSelections() }, () => endSelections, undefined, pushUndoStop && !viewModel.options.isReadOnly);
        return viewModel.cellAt(index);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbE9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9jZWxsT3BlcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtCaEcsNENBa0dDO0lBRUQsMENBK0RDO0lBRUQsc0NBNkVDO0lBRUQsc0NBOEVDO0lBRUQsOENBZ0VDO0lBRUQsOENBb0ZDO0lBRUQsd0RBZ0dDO0lBd0NELDREQWNDO0lBRUQsZ0NBbURDO0lBRUQsOENBb0JDO0lBN3JCTSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsSUFBYyxFQUFFLE9BQStCLEVBQUUsUUFBaUIsRUFBRSxJQUFhO1FBQ3ZILE1BQU0sRUFBRSxjQUFjLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDbkMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1lBQ2hDLE9BQU87UUFDUixDQUFDO1FBRUQsSUFBSSxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDL0IsT0FBTztRQUNSLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hDLGlCQUFpQjtZQUNqQixNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBRXpCLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDNUIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDNUIsTUFBTSxHQUFHLEdBQUcsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU5QyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztn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