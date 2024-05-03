/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModelSearch", "vs/workbench/contrib/codeEditor/browser/toggleWordWrap", "vs/workbench/contrib/notebook/browser/notebookBrowser"], function (require, exports, event_1, lifecycle_1, mime_1, range_1, selection_1, textModelSearch_1, toggleWordWrap_1, notebookBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseCellViewModel = void 0;
    class BaseCellViewModel extends lifecycle_1.Disposable {
        get handle() {
            return this.model.handle;
        }
        get uri() {
            return this.model.uri;
        }
        get lineCount() {
            return this.model.textBuffer.getLineCount();
        }
        get metadata() {
            return this.model.metadata;
        }
        get internalMetadata() {
            return this.model.internalMetadata;
        }
        get language() {
            return this.model.language;
        }
        get mime() {
            if (typeof this.model.mime === 'string') {
                return this.model.mime;
            }
            switch (this.language) {
                case 'markdown':
                    return mime_1.Mimes.markdown;
                default:
                    return mime_1.Mimes.text;
            }
        }
        get lineNumbers() {
            return this._lineNumbers;
        }
        set lineNumbers(lineNumbers) {
            if (lineNumbers === this._lineNumbers) {
                return;
            }
            this._lineNumbers = lineNumbers;
            this._onDidChangeState.fire({ cellLineNumberChanged: true });
        }
        get focusMode() {
            return this._focusMode;
        }
        set focusMode(newMode) {
            if (this._focusMode !== newMode) {
                this._focusMode = newMode;
                this._onDidChangeState.fire({ focusModeChanged: true });
            }
        }
        get editorAttached() {
            return !!this._textEditor;
        }
        get textModel() {
            return this.model.textModel;
        }
        hasModel() {
            return !!this.textModel;
        }
        get dragging() {
            return this._dragging;
        }
        set dragging(v) {
            this._dragging = v;
            this._onDidChangeState.fire({ dragStateChanged: true });
        }
        get isInputCollapsed() {
            return this._inputCollapsed;
        }
        set isInputCollapsed(v) {
            this._inputCollapsed = v;
            this._onDidChangeState.fire({ inputCollapsedChanged: true });
        }
        get isOutputCollapsed() {
            return this._outputCollapsed;
        }
        set isOutputCollapsed(v) {
            this._outputCollapsed = v;
            this._onDidChangeState.fire({ outputCollapsedChanged: true });
        }
        constructor(viewType, model, id, _viewContext, _configurationService, _modelService, _undoRedoService, _codeEditorService) {
            super();
            this.viewType = viewType;
            this.model = model;
            this.id = id;
            this._viewContext = _viewContext;
            this._configurationService = _configurationService;
            this._modelService = _modelService;
            this._undoRedoService = _undoRedoService;
            this._codeEditorService = _codeEditorService;
            this._onDidChangeEditorAttachState = this._register(new event_1.Emitter());
            // Do not merge this event with `onDidChangeState` as we are using `Event.once(onDidChangeEditorAttachState)` elsewhere.
            this.onDidChangeEditorAttachState = this._onDidChangeEditorAttachState.event;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._editState = notebookBrowser_1.CellEditState.Preview;
            this._lineNumbers = 'inherit';
            this._focusMode = notebookBrowser_1.CellFocusMode.Container;
            this._editorListeners = [];
            this._editorViewStates = null;
            this._editorTransientState = null;
            this._resolvedCellDecorations = new Map();
            this._textModelRefChangeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this._cellDecorationsChanged = this._register(new event_1.Emitter());
            this.onCellDecorationsChanged = this._cellDecorationsChanged.event;
            this._resolvedDecorations = new Map();
            this._lastDecorationId = 0;
            this._cellStatusBarItems = new Map();
            this._onDidChangeCellStatusBarItems = this._register(new event_1.Emitter());
            this.onDidChangeCellStatusBarItems = this._onDidChangeCellStatusBarItems.event;
            this._lastStatusBarId = 0;
            this._dragging = false;
            this._inputCollapsed = false;
            this._outputCollapsed = false;
            this._isDisposed = false;
            this._editStateSource = '';
            this._register(model.onDidChangeMetadata(() => {
                this._onDidChangeState.fire({ metadataChanged: true });
            }));
            this._register(model.onDidChangeInternalMetadata(e => {
                this._onDidChangeState.fire({ internalMetadataChanged: true });
                if (e.lastRunSuccessChanged) {
                    // Statusbar visibility may change
                    this.layoutChange({});
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('notebook.lineNumbers')) {
                    this.lineNumbers = 'inherit';
                }
            }));
            if (this.model.collapseState?.inputCollapsed) {
                this._inputCollapsed = true;
            }
            if (this.model.collapseState?.outputCollapsed) {
                this._outputCollapsed = true;
            }
        }
        assertTextModelAttached() {
            if (this.textModel && this._textEditor && this._textEditor.getModel() === this.textModel) {
                return true;
            }
            return false;
        }
        // private handleKeyDown(e: IKeyboardEvent) {
        // 	if (this.viewType === IPYNB_VIEW_TYPE && isWindows && e.ctrlKey && e.keyCode === KeyCode.Enter) {
        // 		this._keymapService.promptKeymapRecommendation();
        // 	}
        // }
        attachTextEditor(editor, estimatedHasHorizontalScrolling) {
            if (!editor.hasModel()) {
                throw new Error('Invalid editor: model is missing');
            }
            if (this._textEditor === editor) {
                if (this._editorListeners.length === 0) {
                    this._editorListeners.push(this._textEditor.onDidChangeCursorSelection(() => { this._onDidChangeState.fire({ selectionChanged: true }); }));
                    // this._editorListeners.push(this._textEditor.onKeyDown(e => this.handleKeyDown(e)));
                    this._onDidChangeState.fire({ selectionChanged: true });
                }
                return;
            }
            this._textEditor = editor;
            if (this._editorViewStates) {
                this._restoreViewState(this._editorViewStates);
            }
            else {
                // If no real editor view state was persisted, restore a default state.
                // This forces the editor to measure its content width immediately.
                if (estimatedHasHorizontalScrolling) {
                    this._restoreViewState({
                        contributionsState: {},
                        cursorState: [],
                        viewState: {
                            scrollLeft: 0,
                            firstPosition: { lineNumber: 1, column: 1 },
                            firstPositionDeltaTop: this._viewContext.notebookOptions.getLayoutConfiguration().editorTopPadding
                        }
                    });
                }
            }
            if (this._editorTransientState) {
                (0, toggleWordWrap_1.writeTransientState)(editor.getModel(), this._editorTransientState, this._codeEditorService);
            }
            this._textEditor?.changeDecorations((accessor) => {
                this._resolvedDecorations.forEach((value, key) => {
                    if (key.startsWith('_lazy_')) {
                        // lazy ones
                        const ret = accessor.addDecoration(value.options.range, value.options.options);
                        this._resolvedDecorations.get(key).id = ret;
                    }
                    else {
                        const ret = accessor.addDecoration(value.options.range, value.options.options);
                        this._resolvedDecorations.get(key).id = ret;
                    }
                });
            });
            this._editorListeners.push(this._textEditor.onDidChangeCursorSelection(() => { this._onDidChangeState.fire({ selectionChanged: true }); }));
            // this._editorListeners.push(this._textEditor.onKeyDown(e => this.handleKeyDown(e)));
            this._onDidChangeState.fire({ selectionChanged: true });
            this._onDidChangeEditorAttachState.fire();
        }
        detachTextEditor() {
            this.saveViewState();
            this.saveTransientState();
            // decorations need to be cleared first as editors can be resued.
            this._textEditor?.changeDecorations((accessor) => {
                this._resolvedDecorations.forEach(value => {
                    const resolvedid = value.id;
                    if (resolvedid) {
                        accessor.removeDecoration(resolvedid);
                    }
                });
            });
            this._textEditor = undefined;
            (0, lifecycle_1.dispose)(this._editorListeners);
            this._editorListeners = [];
            this._onDidChangeEditorAttachState.fire();
            if (this._textModelRef) {
                this._textModelRef.dispose();
                this._textModelRef = undefined;
            }
            this._textModelRefChangeDisposable.clear();
        }
        getText() {
            return this.model.getValue();
        }
        getTextLength() {
            return this.model.getTextLength();
        }
        saveViewState() {
            if (!this._textEditor) {
                return;
            }
            this._editorViewStates = this._textEditor.saveViewState();
        }
        saveTransientState() {
            if (!this._textEditor || !this._textEditor.hasModel()) {
                return;
            }
            this._editorTransientState = (0, toggleWordWrap_1.readTransientState)(this._textEditor.getModel(), this._codeEditorService);
        }
        saveEditorViewState() {
            if (this._textEditor) {
                this._editorViewStates = this._textEditor.saveViewState();
            }
            return this._editorViewStates;
        }
        restoreEditorViewState(editorViewStates, totalHeight) {
            this._editorViewStates = editorViewStates;
        }
        _restoreViewState(state) {
            if (state) {
                this._textEditor?.restoreViewState(state);
            }
        }
        addModelDecoration(decoration) {
            if (!this._textEditor) {
                const id = ++this._lastDecorationId;
                const decorationId = `_lazy_${this.id};${id}`;
                this._resolvedDecorations.set(decorationId, { options: decoration });
                return decorationId;
            }
            let id;
            this._textEditor.changeDecorations((accessor) => {
                id = accessor.addDecoration(decoration.range, decoration.options);
                this._resolvedDecorations.set(id, { id, options: decoration });
            });
            return id;
        }
        removeModelDecoration(decorationId) {
            const realDecorationId = this._resolvedDecorations.get(decorationId);
            if (this._textEditor && realDecorationId && realDecorationId.id !== undefined) {
                this._textEditor.changeDecorations((accessor) => {
                    accessor.removeDecoration(realDecorationId.id);
                });
            }
            // lastly, remove all the cache
            this._resolvedDecorations.delete(decorationId);
        }
        deltaModelDecorations(oldDecorations, newDecorations) {
            oldDecorations.forEach(id => {
                this.removeModelDecoration(id);
            });
            const ret = newDecorations.map(option => {
                return this.addModelDecoration(option);
            });
            return ret;
        }
        _removeCellDecoration(decorationId) {
            const options = this._resolvedCellDecorations.get(decorationId);
            this._resolvedCellDecorations.delete(decorationId);
            if (options) {
                for (const existingOptions of this._resolvedCellDecorations.values()) {
                    // don't remove decorations that are applied from other entries
                    if (options.className === existingOptions.className) {
                        options.className = undefined;
                    }
                    if (options.outputClassName === existingOptions.outputClassName) {
                        options.outputClassName = undefined;
                    }
                    if (options.gutterClassName === existingOptions.gutterClassName) {
                        options.gutterClassName = undefined;
                    }
                    if (options.topClassName === existingOptions.topClassName) {
                        options.topClassName = undefined;
                    }
                }
                this._cellDecorationsChanged.fire({ added: [], removed: [options] });
            }
        }
        _addCellDecoration(options) {
            const id = ++this._lastDecorationId;
            const decorationId = `_cell_${this.id};${id}`;
            this._resolvedCellDecorations.set(decorationId, options);
            this._cellDecorationsChanged.fire({ added: [options], removed: [] });
            return decorationId;
        }
        getCellDecorations() {
            return [...this._resolvedCellDecorations.values()];
        }
        getCellDecorationRange(decorationId) {
            if (this._textEditor) {
                // (this._textEditor as CodeEditorWidget).decora
                return this._textEditor.getModel()?.getDecorationRange(decorationId) ?? null;
            }
            return null;
        }
        deltaCellDecorations(oldDecorations, newDecorations) {
            oldDecorations.forEach(id => {
                this._removeCellDecoration(id);
            });
            const ret = newDecorations.map(option => {
                return this._addCellDecoration(option);
            });
            return ret;
        }
        deltaCellStatusBarItems(oldItems, newItems) {
            oldItems.forEach(id => {
                const item = this._cellStatusBarItems.get(id);
                if (item) {
                    this._cellStatusBarItems.delete(id);
                }
            });
            const newIds = newItems.map(item => {
                const id = ++this._lastStatusBarId;
                const itemId = `_cell_${this.id};${id}`;
                this._cellStatusBarItems.set(itemId, item);
                return itemId;
            });
            this._onDidChangeCellStatusBarItems.fire();
            return newIds;
        }
        getCellStatusBarItems() {
            return Array.from(this._cellStatusBarItems.values());
        }
        revealRangeInCenter(range) {
            this._textEditor?.revealRangeInCenter(range, 1 /* editorCommon.ScrollType.Immediate */);
        }
        setSelection(range) {
            this._textEditor?.setSelection(range);
        }
        setSelections(selections) {
            if (selections.length) {
                this._textEditor?.setSelections(selections);
            }
        }
        getSelections() {
            return this._textEditor?.getSelections() || [];
        }
        getSelectionsStartPosition() {
            if (this._textEditor) {
                const selections = this._textEditor.getSelections();
                return selections?.map(s => s.getStartPosition());
            }
            else {
                const selections = this._editorViewStates?.cursorState;
                return selections?.map(s => s.selectionStart);
            }
        }
        getLineScrollTopOffset(line) {
            if (!this._textEditor) {
                return 0;
            }
            const editorPadding = this._viewContext.notebookOptions.computeEditorPadding(this.internalMetadata, this.uri);
            return this._textEditor.getTopForLineNumber(line) + editorPadding.top;
        }
        getPositionScrollTopOffset(range) {
            if (!this._textEditor) {
                return 0;
            }
            const position = range instanceof selection_1.Selection ? range.getPosition() : range.getStartPosition();
            const editorPadding = this._viewContext.notebookOptions.computeEditorPadding(this.internalMetadata, this.uri);
            return this._textEditor.getTopForPosition(position.lineNumber, position.column) + editorPadding.top;
        }
        cursorAtLineBoundary() {
            if (!this._textEditor || !this.textModel || !this._textEditor.hasTextFocus()) {
                return notebookBrowser_1.CursorAtLineBoundary.None;
            }
            const selection = this._textEditor.getSelection();
            if (!selection || !selection.isEmpty()) {
                return notebookBrowser_1.CursorAtLineBoundary.None;
            }
            const currentLineLength = this.textModel.getLineLength(selection.startLineNumber);
            if (currentLineLength === 0) {
                return notebookBrowser_1.CursorAtLineBoundary.Both;
            }
            switch (selection.startColumn) {
                case 1:
                    return notebookBrowser_1.CursorAtLineBoundary.Start;
                case currentLineLength + 1:
                    return notebookBrowser_1.CursorAtLineBoundary.End;
                default:
                    return notebookBrowser_1.CursorAtLineBoundary.None;
            }
        }
        cursorAtBoundary() {
            if (!this._textEditor) {
                return notebookBrowser_1.CursorAtBoundary.None;
            }
            if (!this.textModel) {
                return notebookBrowser_1.CursorAtBoundary.None;
            }
            // only validate primary cursor
            const selection = this._textEditor.getSelection();
            // only validate empty cursor
            if (!selection || !selection.isEmpty()) {
                return notebookBrowser_1.CursorAtBoundary.None;
            }
            const firstViewLineTop = this._textEditor.getTopForPosition(1, 1);
            const lastViewLineTop = this._textEditor.getTopForPosition(this.textModel.getLineCount(), this.textModel.getLineLength(this.textModel.getLineCount()));
            const selectionTop = this._textEditor.getTopForPosition(selection.startLineNumber, selection.startColumn);
            if (selectionTop === lastViewLineTop) {
                if (selectionTop === firstViewLineTop) {
                    return notebookBrowser_1.CursorAtBoundary.Both;
                }
                else {
                    return notebookBrowser_1.CursorAtBoundary.Bottom;
                }
            }
            else {
                if (selectionTop === firstViewLineTop) {
                    return notebookBrowser_1.CursorAtBoundary.Top;
                }
                else {
                    return notebookBrowser_1.CursorAtBoundary.None;
                }
            }
        }
        get editStateSource() {
            return this._editStateSource;
        }
        updateEditState(newState, source) {
            this._editStateSource = source;
            if (newState === this._editState) {
                return;
            }
            this._editState = newState;
            this._onDidChangeState.fire({ editStateChanged: true });
            if (this._editState === notebookBrowser_1.CellEditState.Preview) {
                this.focusMode = notebookBrowser_1.CellFocusMode.Container;
            }
        }
        getEditState() {
            return this._editState;
        }
        get textBuffer() {
            return this.model.textBuffer;
        }
        /**
         * Text model is used for editing.
         */
        async resolveTextModel() {
            if (!this._textModelRef || !this.textModel) {
                this._textModelRef = await this._modelService.createModelReference(this.uri);
                if (this._isDisposed) {
                    return this.textModel;
                }
                if (!this._textModelRef) {
                    throw new Error(`Cannot resolve text model for ${this.uri}`);
                }
                this._textModelRefChangeDisposable.value = this.textModel.onDidChangeContent(() => this.onDidChangeTextModelContent());
            }
            return this.textModel;
        }
        cellStartFind(value, options) {
            let cellMatches = [];
            if (this.assertTextModelAttached()) {
                cellMatches = this.textModel.findMatches(value, false, options.regex || false, options.caseSensitive || false, options.wholeWord ? options.wordSeparators || null : null, options.regex || false);
            }
            else {
                const lineCount = this.textBuffer.getLineCount();
                const fullRange = new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
                const searchParams = new textModelSearch_1.SearchParams(value, options.regex || false, options.caseSensitive || false, options.wholeWord ? options.wordSeparators || null : null);
                const searchData = searchParams.parseSearchRequest();
                if (!searchData) {
                    return null;
                }
                cellMatches = this.textBuffer.findMatchesLineByLine(fullRange, searchData, options.regex || false, 1000);
            }
            return cellMatches;
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
            (0, lifecycle_1.dispose)(this._editorListeners);
            // Only remove the undo redo stack if we map this cell uri to itself
            // If we are not in perCell mode, it will map to the full NotebookDocument and
            // we don't want to remove that entire document undo / redo stack when a cell is deleted
            if (this._undoRedoService.getUriComparisonKey(this.uri) === this.uri.toString()) {
                this._undoRedoService.removeElements(this.uri);
            }
            this._textModelRef?.dispose();
        }
        toJSON() {
            return {
                handle: this.handle
            };
        }
    }
    exports.BaseCellViewModel = BaseCellViewModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUNlbGxWaWV3TW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL2Jhc2VDZWxsVmlld01vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsTUFBc0IsaUJBQWtCLFNBQVEsc0JBQVU7UUFRekQsSUFBSSxNQUFNO1lBQ1QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDO1FBQ0QsSUFBSSxHQUFHO1lBQ04sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUN2QixDQUFDO1FBQ0QsSUFBSSxTQUFTO1lBQ1osT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUM3QyxDQUFDO1FBQ0QsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUM1QixDQUFDO1FBQ0QsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1FBQ3BDLENBQUM7UUFDRCxJQUFJLFFBQVE7WUFDWCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQzVCLENBQUM7UUFFRCxJQUFJLElBQUk7WUFDUCxJQUFJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDeEIsQ0FBQztZQUVELFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN2QixLQUFLLFVBQVU7b0JBQ2QsT0FBTyxZQUFLLENBQUMsUUFBUSxDQUFDO2dC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