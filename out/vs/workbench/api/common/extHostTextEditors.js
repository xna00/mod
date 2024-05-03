/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, arrays, event_1, extHost_protocol_1, extHostTextEditor_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditors = void 0;
    class ExtHostEditors {
        constructor(mainContext, _extHostDocumentsAndEditors) {
            this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
            this._onDidChangeTextEditorSelection = new event_1.Emitter();
            this._onDidChangeTextEditorOptions = new event_1.Emitter();
            this._onDidChangeTextEditorVisibleRanges = new event_1.Emitter();
            this._onDidChangeTextEditorViewColumn = new event_1.Emitter();
            this._onDidChangeActiveTextEditor = new event_1.Emitter();
            this._onDidChangeVisibleTextEditors = new event_1.Emitter();
            this.onDidChangeTextEditorSelection = this._onDidChangeTextEditorSelection.event;
            this.onDidChangeTextEditorOptions = this._onDidChangeTextEditorOptions.event;
            this.onDidChangeTextEditorVisibleRanges = this._onDidChangeTextEditorVisibleRanges.event;
            this.onDidChangeTextEditorViewColumn = this._onDidChangeTextEditorViewColumn.event;
            this.onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;
            this.onDidChangeVisibleTextEditors = this._onDidChangeVisibleTextEditors.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors);
            this._extHostDocumentsAndEditors.onDidChangeVisibleTextEditors(e => this._onDidChangeVisibleTextEditors.fire(e));
            this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(e => this._onDidChangeActiveTextEditor.fire(e));
        }
        getActiveTextEditor() {
            return this._extHostDocumentsAndEditors.activeEditor();
        }
        getVisibleTextEditors(internal) {
            const editors = this._extHostDocumentsAndEditors.allEditors();
            return internal
                ? editors
                : editors.map(editor => editor.value);
        }
        async showTextDocument(document, columnOrOptions, preserveFocus) {
            let options;
            if (typeof columnOrOptions === 'number') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions),
                    preserveFocus
                };
            }
            else if (typeof columnOrOptions === 'object') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions.viewColumn),
                    preserveFocus: columnOrOptions.preserveFocus,
                    selection: typeof columnOrOptions.selection === 'object' ? TypeConverters.Range.from(columnOrOptions.selection) : undefined,
                    pinned: typeof columnOrOptions.preview === 'boolean' ? !columnOrOptions.preview : undefined
                };
            }
            else {
                options = {
                    preserveFocus: false
                };
            }
            const editorId = await this._proxy.$tryShowTextDocument(document.uri, options);
            const editor = editorId && this._extHostDocumentsAndEditors.getEditor(editorId);
            if (editor) {
                return editor.value;
            }
            // we have no editor... having an id means that we had an editor
            // on the main side and that it isn't the current editor anymore...
            if (editorId) {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}".`);
            }
        }
        createTextEditorDecorationType(extension, options) {
            return new extHostTextEditor_1.TextEditorDecorationType(this._proxy, extension, options).value;
        }
        // --- called from main thread
        $acceptEditorPropertiesChanged(id, data) {
            const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
            if (!textEditor) {
                throw new Error('unknown text editor');
            }
            // (1) set all properties
            if (data.options) {
                textEditor._acceptOptions(data.options);
            }
            if (data.selections) {
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                textEditor._acceptSelections(selections);
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                textEditor._acceptVisibleRanges(visibleRanges);
            }
            // (2) fire change events
            if (data.options) {
                this._onDidChangeTextEditorOptions.fire({
                    textEditor: textEditor.value,
                    options: { ...data.options, lineNumbers: TypeConverters.TextEditorLineNumbersStyle.to(data.options.lineNumbers) }
                });
            }
            if (data.selections) {
                const kind = extHostTypes_1.TextEditorSelectionChangeKind.fromValue(data.selections.source);
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                this._onDidChangeTextEditorSelection.fire({
                    textEditor: textEditor.value,
                    selections,
                    kind
                });
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                this._onDidChangeTextEditorVisibleRanges.fire({
                    textEditor: textEditor.value,
                    visibleRanges
                });
            }
        }
        $acceptEditorPositionData(data) {
            for (const id in data) {
                const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
                if (!textEditor) {
                    throw new Error('Unknown text editor');
                }
                const viewColumn = TypeConverters.ViewColumn.to(data[id]);
                if (textEditor.value.viewColumn !== viewColumn) {
                    textEditor._acceptViewColumn(viewColumn);
                    this._onDidChangeTextEditorViewColumn.fire({ textEditor: textEditor.value, viewColumn });
                }
            }
        }
        getDiffInformation(id) {
            return Promise.resolve(this._proxy.$getDiffInformation(id));
        }
    }
    exports.ExtHostEditors = ExtHostEditors;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRleHRFZGl0b3JzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0VGV4dEVkaXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsY0FBYztRQWtCMUIsWUFDQyxXQUF5QixFQUNSLDJCQUF1RDtZQUF2RCxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTRCO1lBbEJ4RCxvQ0FBK0IsR0FBRyxJQUFJLGVBQU8sRUFBeUMsQ0FBQztZQUN2RixrQ0FBNkIsR0FBRyxJQUFJLGVBQU8sRUFBdUMsQ0FBQztZQUNuRix3Q0FBbUMsR0FBRyxJQUFJLGVBQU8sRUFBNkMsQ0FBQztZQUMvRixxQ0FBZ0MsR0FBRyxJQUFJLGVBQU8sRUFBMEMsQ0FBQztZQUN6RixpQ0FBNEIsR0FBRyxJQUFJLGVBQU8sRUFBaUMsQ0FBQztZQUM1RSxtQ0FBOEIsR0FBRyxJQUFJLGVBQU8sRUFBZ0MsQ0FBQztZQUVyRixtQ0FBOEIsR0FBaUQsSUFBSSxDQUFDLCtCQUErQixDQUFDLEtBQUssQ0FBQztZQUMxSCxpQ0FBNEIsR0FBK0MsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQztZQUNwSCx1Q0FBa0MsR0FBcUQsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLEtBQUssQ0FBQztZQUN0SSxvQ0FBK0IsR0FBa0QsSUFBSSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQztZQUM3SCxnQ0FBMkIsR0FBeUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQztZQUM1RyxrQ0FBNkIsR0FBd0MsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQztZQVF2SCxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxxQkFBcUIs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