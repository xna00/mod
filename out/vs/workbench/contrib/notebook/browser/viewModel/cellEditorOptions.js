/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects"], function (require, exports, event_1, lifecycle_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseCellEditorOptions = void 0;
    class BaseCellEditorOptions extends lifecycle_1.Disposable {
        static { this.fixedEditorOptions = {
            scrollBeyondLastLine: false,
            scrollbar: {
                verticalScrollbarSize: 14,
                horizontal: 'auto',
                useShadows: true,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                alwaysConsumeMouseWheel: false
            },
            renderLineHighlightOnlyWhenFocus: true,
            overviewRulerLanes: 0,
            lineDecorationsWidth: 0,
            folding: true,
            fixedOverflowWidgets: true,
            minimap: { enabled: false },
            renderValidationDecorations: 'on',
            lineNumbersMinChars: 3
        }; }
        get value() {
            return this._value;
        }
        constructor(notebookEditor, notebookOptions, configurationService, language) {
            super();
            this.notebookEditor = notebookEditor;
            this.notebookOptions = notebookOptions;
            this.configurationService = configurationService;
            this.language = language;
            this._localDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('editor') || e.affectsConfiguration('notebook')) {
                    this._recomputeOptions();
                }
            }));
            this._register(notebookOptions.onDidChangeOptions(e => {
                if (e.cellStatusBarVisibility || e.editorTopPadding || e.editorOptionsCustomizations) {
                    this._recomputeOptions();
                }
            }));
            this._register(this.notebookEditor.onDidChangeModel(() => {
                this._localDisposableStore.clear();
                if (this.notebookEditor.hasModel()) {
                    this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
                        this._recomputeOptions();
                    }));
                    this._recomputeOptions();
                }
            }));
            if (this.notebookEditor.hasModel()) {
                this._localDisposableStore.add(this.notebookEditor.onDidChangeOptions(() => {
                    this._recomputeOptions();
                }));
            }
            this._value = this._computeEditorOptions();
        }
        _recomputeOptions() {
            this._value = this._computeEditorOptions();
            this._onDidChange.fire();
        }
        _computeEditorOptions() {
            const editorOptions = (0, objects_1.deepClone)(this.configurationService.getValue('editor', { overrideIdentifier: this.language }));
            const editorOptionsOverrideRaw = this.notebookOptions.getDisplayOptions().editorOptionsCustomizations ?? {};
            const editorOptionsOverride = {};
            for (const key in editorOptionsOverrideRaw) {
                if (key.indexOf('editor.') === 0) {
                    editorOptionsOverride[key.substring(7)] = editorOptionsOverrideRaw[key];
                }
            }
            const computed = Object.freeze({
                ...editorOptions,
                ...BaseCellEditorOptions.fixedEditorOptions,
                ...editorOptionsOverride,
                ...{ padding: { top: 12, bottom: 12 } },
                readOnly: this.notebookEditor.isReadOnly
            });
            return computed;
        }
    }
    exports.BaseCellEditorOptions = BaseCellEditorOptions;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEVkaXRvck9wdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlld01vZGVsL2NlbGxFZGl0b3JPcHRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVVoRyxNQUFhLHFCQUFzQixTQUFRLHNCQUFVO2lCQUNyQyx1QkFBa0IsR0FBbUI7WUFDbkQsb0JBQW9CLEVBQUUsS0FBSztZQUMzQixTQUFTLEVBQUU7Z0JBQ1YscUJBQXFCLEVBQUUsRUFBRTtnQkFDekIsVUFBVSxFQUFFLE1BQU07Z0JBQ2xCLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixpQkFBaUIsRUFBRSxLQUFLO2dCQUN4QixtQkFBbUIsRUFBRSxLQUFLO2dCQUMxQix1QkFBdUIsRUFBRSxLQUFLO2FBQzlCO1lBQ0QsZ0NBQWdDLEVBQUUsSUFBSTtZQUN0QyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLG9CQUFvQixFQUFFLENBQUM7WUFDdkIsT0FBTyxFQUFFLElBQUk7WUFDYixvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLE9BQU8sRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7WUFDM0IsMkJBQTJCLEVBQUUsSUFBSTtZQUNqQyxtQkFBbUIsRUFBRSxDQUFDO1NBQ3RCLEFBbEJnQyxDQWtCL0I7UUFPRixJQUFJLEtBQUs7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVELFlBQXFCLGNBQXVDLEVBQVcsZUFBZ0MsRUFBVyxvQkFBMkMsRUFBVyxRQUFnQjtZQUN2TCxLQUFLLEVBQUUsQ0FBQztZQURZLG1CQUFjLEdBQWQsY0FBYyxDQUF5QjtZQUFXLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUFXLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FB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