/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/api/common/extHost.protocol", "vs/base/common/arrays", "vs/editor/contrib/editorState/browser/editorState", "vs/editor/contrib/snippet/browser/snippetParser"], function (require, exports, event_1, lifecycle_1, editorOptions_1, range_1, selection_1, snippetController2_1, extHost_protocol_1, arrays_1, editorState_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTextEditor = exports.MainThreadTextEditorProperties = void 0;
    class MainThreadTextEditorProperties {
        static readFromEditor(previousProperties, model, codeEditor) {
            const selections = MainThreadTextEditorProperties._readSelectionsFromCodeEditor(previousProperties, codeEditor);
            const options = MainThreadTextEditorProperties._readOptionsFromCodeEditor(previousProperties, model, codeEditor);
            const visibleRanges = MainThreadTextEditorProperties._readVisibleRangesFromCodeEditor(previousProperties, codeEditor);
            return new MainThreadTextEditorProperties(selections, options, visibleRanges);
        }
        static _readSelectionsFromCodeEditor(previousProperties, codeEditor) {
            let result = null;
            if (codeEditor) {
                result = codeEditor.getSelections();
            }
            if (!result && previousProperties) {
                result = previousProperties.selections;
            }
            if (!result) {
                result = [new selection_1.Selection(1, 1, 1, 1)];
            }
            return result;
        }
        static _readOptionsFromCodeEditor(previousProperties, model, codeEditor) {
            if (model.isDisposed()) {
                if (previousProperties) {
                    // shutdown time
                    return previousProperties.options;
                }
                else {
                    throw new Error('No valid properties');
                }
            }
            let cursorStyle;
            let lineNumbers;
            if (codeEditor) {
                const options = codeEditor.getOptions();
                const lineNumbersOpts = options.get(68 /* EditorOption.lineNumbers */);
                cursorStyle = options.get(28 /* EditorOption.cursorStyle */);
                lineNumbers = lineNumbersOpts.renderType;
            }
            else if (previousProperties) {
                cursorStyle = previousProperties.options.cursorStyle;
                lineNumbers = previousProperties.options.lineNumbers;
            }
            else {
                cursorStyle = editorOptions_1.TextEditorCursorStyle.Line;
                lineNumbers = 1 /* RenderLineNumbersType.On */;
            }
            const modelOptions = model.getOptions();
            return {
                insertSpaces: modelOptions.insertSpaces,
                tabSize: modelOptions.tabSize,
                indentSize: modelOptions.indentSize,
                originalIndentSize: modelOptions.originalIndentSize,
                cursorStyle: cursorStyle,
                lineNumbers: lineNumbers
            };
        }
        static _readVisibleRangesFromCodeEditor(previousProperties, codeEditor) {
            if (codeEditor) {
                return codeEditor.getVisibleRanges();
            }
            return [];
        }
        constructor(selections, options, visibleRanges) {
            this.selections = selections;
            this.options = options;
            this.visibleRanges = visibleRanges;
        }
        generateDelta(oldProps, selectionChangeSource) {
            const delta = {
                options: null,
                selections: null,
                visibleRanges: null
            };
            if (!oldProps || !MainThreadTextEditorProperties._selectionsEqual(oldProps.selections, this.selections)) {
                delta.selections = {
                    selections: this.selections,
                    source: selectionChangeSource ?? undefined,
                };
            }
            if (!oldProps || !MainThreadTextEditorProperties._optionsEqual(oldProps.options, this.options)) {
                delta.options = this.options;
            }
            if (!oldProps || !MainThreadTextEditorProperties._rangesEqual(oldProps.visibleRanges, this.visibleRanges)) {
                delta.visibleRanges = this.visibleRanges;
            }
            if (delta.selections || delta.options || delta.visibleRanges) {
                // something changed
                return delta;
            }
            // nothing changed
            return null;
        }
        static _selectionsEqual(a, b) {
            return (0, arrays_1.equals)(a, b, (aValue, bValue) => aValue.equalsSelection(bValue));
        }
        static _rangesEqual(a, b) {
            return (0, arrays_1.equals)(a, b, (aValue, bValue) => aValue.equalsRange(bValue));
        }
        static _optionsEqual(a, b) {
            if (a && !b || !a && b) {
                return false;
            }
            if (!a && !b) {
                return true;
            }
            return (a.tabSize === b.tabSize
                && a.indentSize === b.indentSize
                && a.insertSpaces === b.insertSpaces
                && a.cursorStyle === b.cursorStyle
                && a.lineNumbers === b.lineNumbers);
        }
    }
    exports.MainThreadTextEditorProperties = MainThreadTextEditorProperties;
    /**
     * Text Editor that is permanently bound to the same model.
     * It can be bound or not to a CodeEditor.
     */
    class MainThreadTextEditor {
        constructor(id, model, codeEditor, focusTracker, mainThreadDocuments, modelService, clipboardService) {
            this._modelListeners = new lifecycle_1.DisposableStore();
            this._codeEditorListeners = new lifecycle_1.DisposableStore();
            this._id = id;
            this._model = model;
            this._codeEditor = null;
            this._properties = null;
            this._focusTracker = focusTracker;
            this._mainThreadDocuments = mainThreadDocuments;
            this._modelService = modelService;
            this._clipboardService = clipboardService;
            this._onPropertiesChanged = new event_1.Emitter();
            this._modelListeners.add(this._model.onDidChangeOptions((e) => {
                this._updatePropertiesNow(null);
            }));
            this.setCodeEditor(codeEditor);
            this._updatePropertiesNow(null);
        }
        dispose() {
            this._modelListeners.dispose();
            this._codeEditor = null;
            this._codeEditorListeners.dispose();
        }
        _updatePropertiesNow(selectionChangeSource) {
            this._setProperties(MainThreadTextEditorProperties.readFromEditor(this._properties, this._model, this._codeEditor), selectionChangeSource);
        }
        _setProperties(newProperties, selectionChangeSource) {
            const delta = newProperties.generateDelta(this._properties, selectionChangeSource);
            this._properties = newProperties;
            if (delta) {
                this._onPropertiesChanged.fire(delta);
            }
        }
        getId() {
            return this._id;
        }
        getModel() {
            return this._model;
        }
        getCodeEditor() {
            return this._codeEditor;
        }
        hasCodeEditor(codeEditor) {
            return (this._codeEditor === codeEditor);
        }
        setCodeEditor(codeEditor) {
            if (this.hasCodeEditor(codeEditor)) {
                // Nothing to do...
                return;
            }
            this._codeEditorListeners.clear();
            this._codeEditor = codeEditor;
            if (this._codeEditor) {
                // Catch early the case that this code editor gets a different model set and disassociate from this model
                this._codeEditorListeners.add(this._codeEditor.onDidChangeModel(() => {
                    this.setCodeEditor(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidFocusEditorWidget(() => {
                    this._focusTracker.onGainedFocus();
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidBlurEditorWidget(() => {
                    this._focusTracker.onLostFocus();
                }));
                let nextSelectionChangeSource = null;
                this._codeEditorListeners.add(this._mainThreadDocuments.onIsCaughtUpWithContentChanges((uri) => {
                    if (uri.toString() === this._model.uri.toString()) {
                        const selectionChangeSource = nextSelectionChangeSource;
                        nextSelectionChangeSource = null;
                        this._updatePropertiesNow(selectionChangeSource);
                    }
                }));
                const isValidCodeEditor = () => {
                    // Due to event timings, it is possible that there is a model change event not yet delivered to us.
                    // > e.g. a model change event is emitted to a listener which then decides to update editor options
                    // > In this case the editor configuration change event reaches us first.
                    // So simply check that the model is still attached to this code editor
                    return (this._codeEditor && this._codeEditor.getModel() === this._model);
                };
                const updateProperties = (selectionChangeSource) => {
                    // Some editor events get delivered faster than model content changes. This is
                    // problematic, as this leads to editor properties reaching the extension host
                    // too soon, before the model content change that was the root cause.
                    //
                    // If this case is identified, then let's update editor properties on the next model
                    // content change instead.
                    if (this._mainThreadDocuments.isCaughtUpWithContentChanges(this._model.uri)) {
                        nextSelectionChangeSource = null;
                        this._updatePropertiesNow(selectionChangeSource);
                    }
                    else {
                        // update editor properties on the next model content change
                        nextSelectionChangeSource = selectionChangeSource;
                    }
                };
                this._codeEditorListeners.add(this._codeEditor.onDidChangeCursorSelection((e) => {
                    // selection
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(e.source);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidChangeConfiguration((e) => {
                    // options
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidLayoutChange(() => {
                    // visibleRanges
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidScrollChange(() => {
                    // visibleRanges
                    if (!isValidCodeEditor()) {
                        return;
                    }
                    updateProperties(null);
                }));
                this._updatePropertiesNow(null);
            }
        }
        isVisible() {
            return !!this._codeEditor;
        }
        getProperties() {
            return this._properties;
        }
        get onPropertiesChanged() {
            return this._onPropertiesChanged.event;
        }
        setSelections(selections) {
            if (this._codeEditor) {
                this._codeEditor.setSelections(selections);
                return;
            }
            const newSelections = selections.map(selection_1.Selection.liftSelection);
            this._setProperties(new MainThreadTextEditorProperties(newSelections, this._properties.options, this._properties.visibleRanges), null);
        }
        _setIndentConfiguration(newConfiguration) {
            const creationOpts = this._modelService.getCreationOptions(this._model.getLanguageId(), this._model.uri, this._model.isForSimpleWidget);
            if (newConfiguration.tabSize === 'auto' || newConfiguration.insertSpaces === 'auto') {
                // one of the options was set to 'auto' => detect indentation
                let insertSpaces = creationOpts.insertSpaces;
                let tabSize = creationOpts.tabSize;
                if (newConfiguration.insertSpaces !== 'auto' && typeof newConfiguration.insertSpaces !== 'undefined') {
                    insertSpaces = newConfiguration.insertSpaces;
                }
                if (newConfiguration.tabSize !== 'auto' && typeof newConfiguration.tabSize !== 'undefined') {
                    tabSize = newConfiguration.tabSize;
                }
                this._model.detectIndentation(insertSpaces, tabSize);
                return;
            }
            const newOpts = {};
            if (typeof newConfiguration.insertSpaces !== 'undefined') {
                newOpts.insertSpaces = newConfiguration.insertSpaces;
            }
            if (typeof newConfiguration.tabSize !== 'undefined') {
                newOpts.tabSize = newConfiguration.tabSize;
            }
            if (typeof newConfiguration.indentSize !== 'undefined') {
                newOpts.indentSize = newConfiguration.indentSize;
            }
            this._model.updateOptions(newOpts);
        }
        setConfiguration(newConfiguration) {
            this._setIndentConfiguration(newConfiguration);
            if (!this._codeEditor) {
                return;
            }
            if (newConfiguration.cursorStyle) {
                const newCursorStyle = (0, editorOptions_1.cursorStyleToString)(newConfiguration.cursorStyle);
                this._codeEditor.updateOptions({
                    cursorStyle: newCursorStyle
                });
            }
            if (typeof newConfiguration.lineNumbers !== 'undefined') {
                let lineNumbers;
                switch (newConfiguration.lineNumbers) {
                    case 1 /* RenderLineNumbersType.On */:
                        lineNumbers = 'on';
                        break;
                    case 2 /* RenderLineNumbersType.Relative */:
                        lineNumbers = 'relative';
                        break;
                    case 3 /* RenderLineNumbersType.Interval */:
                        lineNumbers = 'interval';
                        break;
                    default:
                        lineNumbers = 'off';
                }
                this._codeEditor.updateOptions({
                    lineNumbers: lineNumbers
                });
            }
        }
        setDecorations(key, ranges) {
            if (!this._codeEditor) {
                return;
            }
            this._codeEditor.setDecorationsByType('exthost-api', key, ranges);
        }
        setDecorationsFast(key, _ranges) {
            if (!this._codeEditor) {
                return;
            }
            const ranges = [];
            for (let i = 0, len = Math.floor(_ranges.length / 4); i < len; i++) {
                ranges[i] = new range_1.Range(_ranges[4 * i], _ranges[4 * i + 1], _ranges[4 * i + 2], _ranges[4 * i + 3]);
            }
            this._codeEditor.setDecorationsByTypeFast(key, ranges);
        }
        revealRange(range, revealType) {
            if (!this._codeEditor) {
                return;
            }
            switch (revealType) {
                case extHost_protocol_1.TextEditorRevealType.Default:
                    this._codeEditor.revealRange(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenter:
                    this._codeEditor.revealRangeInCenter(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenterIfOutsideViewport:
                    this._codeEditor.revealRangeInCenterIfOutsideViewport(range, 0 /* ScrollType.Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.AtTop:
                    this._codeEditor.revealRangeAtTop(range, 0 /* ScrollType.Smooth */);
                    break;
                default:
                    console.warn(`Unknown revealType: ${revealType}`);
                    break;
            }
        }
        isFocused() {
            if (this._codeEditor) {
                return this._codeEditor.hasTextFocus();
            }
            return false;
        }
        matches(editor) {
            if (!editor) {
                return false;
            }
            return editor.getControl() === this._codeEditor;
        }
        applyEdits(versionIdCheck, edits, opts) {
            if (this._model.getVersionId() !== versionIdCheck) {
                // throw new Error('Model has changed in the meantime!');
                // model changed in the meantime
                return false;
            }
            if (!this._codeEditor) {
                // console.warn('applyEdits on invisible editor');
                return false;
            }
            if (typeof opts.setEndOfLine !== 'undefined') {
                this._model.pushEOL(opts.setEndOfLine);
            }
            const transformedEdits = edits.map((edit) => {
                return {
                    range: range_1.Range.lift(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            if (opts.undoStopBefore) {
                this._codeEditor.pushUndoStop();
            }
            this._codeEditor.executeEdits('MainThreadTextEditor', transformedEdits);
            if (opts.undoStopAfter) {
                this._codeEditor.pushUndoStop();
            }
            return true;
        }
        async insertSnippet(modelVersionId, template, ranges, opts) {
            if (!this._codeEditor || !this._codeEditor.hasModel()) {
                return false;
            }
            // check if clipboard is required and only iff read it (async)
            let clipboardText;
            const needsTemplate = snippetParser_1.SnippetParser.guessNeedsClipboard(template);
            if (needsTemplate) {
                const state = new editorState_1.EditorState(this._codeEditor, 1 /* CodeEditorStateFlag.Value */ | 4 /* CodeEditorStateFlag.Position */);
                clipboardText = await this._clipboardService.readText();
                if (!state.validate(this._codeEditor)) {
                    return false;
                }
            }
            if (this._codeEditor.getModel().getVersionId() !== modelVersionId) {
                return false;
            }
            const snippetController = snippetController2_1.SnippetController2.get(this._codeEditor);
            if (!snippetController) {
                return false;
            }
            this._codeEditor.focus();
            // make modifications as snippet edit
            const edits = ranges.map(range => ({ range: range_1.Range.lift(range), template }));
            snippetController.apply(edits, {
                overwriteBefore: 0, overwriteAfter: 0,
                undoStopBefore: opts.undoStopBefore, undoStopAfter: opts.undoStopAfter,
                clipboardText
            });
            return true;
        }
    }
    exports.MainThreadTextEditor = MainThreadTextEditor;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZEVkaXRvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRFZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxNQUFhLDhCQUE4QjtRQUVuQyxNQUFNLENBQUMsY0FBYyxDQUFDLGtCQUF5RCxFQUFFLEtBQWlCLEVBQUUsVUFBOEI7WUFDeEksTUFBTSxVQUFVLEdBQUcsOEJBQThCLENBQUMsNkJBQTZCLENBQUMsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDaEgsTUFBTSxPQUFPLEdBQUcsOEJBQThCLENBQUMsMEJBQTBCLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ2pILE1BQU0sYUFBYSxHQUFHLDhCQUE4QixDQUFDLGdDQUFnQyxDQUFDLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RILE9BQU8sSUFBSSw4QkFBOEIsQ0FBQyxVQUFVLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFTyxNQUFNLENBQUMsNkJBQTZCLENBQUMsa0JBQXlELEVBQUUsVUFBOEI7WUFDckksSUFBSSxNQUFNLEdBQXVCLElBQUksQ0FBQztZQUN0QyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixNQUFNLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JDLENBQUM7WUFDRCxJQUFJLENBQUMsTUFBTSxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7WUFDeEMsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixNQUFNLEdBQUcsQ0FBQyxJQUFJLHFCQUFTLENB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