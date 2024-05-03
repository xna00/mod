/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/editorOptions", "vs/editor/common/services/editorBaseApi", "vs/editor/standalone/browser/standaloneEditor", "vs/editor/standalone/browser/standaloneLanguages", "vs/editor/contrib/format/browser/format"], function (require, exports, editorOptions_1, editorBaseApi_1, standaloneEditor_1, standaloneLanguages_1, format_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.languages = exports.editor = exports.Token = exports.Uri = exports.MarkerTag = exports.MarkerSeverity = exports.SelectionDirection = exports.Selection = exports.Range = exports.Position = exports.KeyMod = exports.KeyCode = exports.Emitter = exports.CancellationTokenSource = void 0;
    // Set defaults for standalone editor
    editorOptions_1.EditorOptions.wrappingIndent.defaultValue = 0 /* WrappingIndent.None */;
    editorOptions_1.EditorOptions.glyphMargin.defaultValue = false;
    editorOptions_1.EditorOptions.autoIndent.defaultValue = 3 /* EditorAutoIndentStrategy.Advanced */;
    editorOptions_1.EditorOptions.overviewRulerLanes.defaultValue = 2;
    // We need to register a formatter selector which simply picks the first available formatter.
    // See https://github.com/microsoft/monaco-editor/issues/2327
    format_1.FormattingConflicts.setFormatterSelector((formatter, document, mode) => Promise.resolve(formatter[0]));
    const api = (0, editorBaseApi_1.createMonacoBaseAPI)();
    api.editor = (0, standaloneEditor_1.createMonacoEditorAPI)();
    api.languages = (0, standaloneLanguages_1.createMonacoLanguagesAPI)();
    exports.CancellationTokenSource = api.CancellationTokenSource;
    exports.Emitter = api.Emitter;
    exports.KeyCode = api.KeyCode;
    exports.KeyMod = api.KeyMod;
    exports.Position = api.Position;
    exports.Range = api.Range;
    exports.Selection = api.Selection;
    exports.SelectionDirection = api.SelectionDirection;
    exports.MarkerSeverity = api.MarkerSeverity;
    exports.MarkerTag = api.MarkerTag;
    exports.Uri = api.Uri;
    exports.Token = api.Token;
    exports.editor = api.editor;
    exports.languages = api.languages;
    const monacoEnvironment = globalThis.MonacoEnvironment;
    if (monacoEnvironment?.globalAPI || (typeof define === 'function' && define.amd)) {
        globalThis.monaco = api;
    }
    if (typeof globalThis.require !== 'undefined' && typeof globalThis.require.config === 'function') {
        globalThis.require.config({
            ignoreDuplicateModules: [
                'vscode-languageserver-types',
                'vscode-languageserver-types/main',
                'vscode-languageserver-textdocument',
                'vscode-languageserver-textdocument/main',
                'vscode-nls',
                'vscode-nls/vscode-nls',
                'jsonc-parser',
                'jsonc-parser/main',
                'vscode-uri',
                'vscode-uri/index',
                'vs/basic-languages/typescript/typescript'
            ]
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yLmFwaS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2VkaXRvci5hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLHFDQUFxQztJQUNyQyw2QkFBYSxDQUFDLGNBQWMsQ0FBQyxZQUFZLDhCQUFzQixDQUFDO0lBQ2hFLDZCQUFhLENBQUMsV0FBVyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7SUFDL0MsNkJBQWEsQ0FBQyxVQUFVLENBQUMsWUFBWSw0Q0FBb0MsQ0FBQztJQUMxRSw2QkFBYSxDQUFDLGtCQUFrQixDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7SUFFbEQsNkZBQTZGO0lBQzdGLDZEQUE2RDtJQUM3RCw0QkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdkcsTUFBTSxHQUFHLEdBQUcsSUFBQSxtQ0FBbUIsR0FBRSxDQUFDO0lBQ2xDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBQSx3Q0FBcUIsR0FBRSxDQUFDO0lBQ3JDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBQSw4Q0FBd0IsR0FBRSxDQUFDO0lBQzlCLFFBQUEsdUJBQXVCLEdBQUcsR0FBRyxDQUFDLHVCQUF1QixDQUFDO0lBQ3RELFFBQUEsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7SUFDdEIsUUFBQSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUN0QixRQUFBLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQ3BCLFFBQUEsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDeEIsUUFBQSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUNsQixRQUFBLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO0lBQzFCLFFBQUEsa0JBQWtCLEdBQUcsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0lBQzVDLFFBQUEsY0FBYyxHQUFHLEdBQUcsQ0FBQyxjQUFjLENBQUM7SUFDcEMsUUFBQSxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztJQUMxQixRQUFBLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO0lBQ2QsUUFBQSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUNsQixRQUFBLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0lBQ3BCLFFBQUEsU0FBUyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7SUFLdkMsTUFBTSxpQkFBaUIsR0FBb0MsVUFBa0IsQ0FBQyxpQkFBaUIsQ0FBQztJQUNoRyxJQUFJLGlCQUFpQixFQUFFLFNBQVMsSUFBSSxDQUFDLE9BQU8sTUFBTSxLQUFLLFVBQVUsSUFBVSxNQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN6RixVQUFVLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUN6QixDQUFDO0lBRUQsSUFBSSxPQUFPLFVBQVUsQ0FBQyxPQUFPLEtBQUssV0FBVyxJQUFJLE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFLENBQUM7UUFDbEcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7WUFDekIsc0JBQXNCLEVBQUU7Z0JBQ3ZCLDZCQUE2QjtnQkFDN0Isa0NBQWtDO2dCQUNsQyxvQ0FBb0M7Z0JBQ3BDLHlDQUF5QztnQkFDekMsWUFBWTtnQkFDWix1QkFBdUI7Z0JBQ3ZCLGNBQWM7Z0JBQ2QsbUJBQW1CO2dCQUNuQixZQUFZO2dCQUNaLGtCQUFrQjtnQkFDbEIsMENBQTBDO2FBQzFDO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9