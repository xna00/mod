/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/editor/contrib/snippet/browser/snippetController2", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippetPicker", "../snippets", "vs/nls"], function (require, exports, editorContextKeys_1, snippetController2_1, clipboardService_1, contextkey_1, instantiation_1, abstractSnippetsActions_1, snippetPicker_1, snippets_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SurroundWithSnippetEditorAction = void 0;
    exports.getSurroundableSnippets = getSurroundableSnippets;
    async function getSurroundableSnippets(snippetsService, model, position, includeDisabledSnippets) {
        const { lineNumber, column } = position;
        model.tokenization.tokenizeIfCheap(lineNumber);
        const languageId = model.getLanguageIdAtPosition(lineNumber, column);
        const allSnippets = await snippetsService.getSnippets(languageId, { includeNoPrefixSnippets: true, includeDisabledSnippets });
        return allSnippets.filter(snippet => snippet.usesSelection);
    }
    class SurroundWithSnippetEditorAction extends abstractSnippetsActions_1.SnippetEditorAction {
        static { this.options = {
            id: 'editor.action.surroundWithSnippet',
            title: (0, nls_1.localize2)('label', "Surround with Snippet...")
        }; }
        constructor() {
            super({
                ...SurroundWithSnippetEditorAction.options,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                f1: true,
            });
        }
        async runEditorCommand(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const snippetsService = accessor.get(snippets_1.ISnippetsService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const snippets = await getSurroundableSnippets(snippetsService, editor.getModel(), editor.getPosition(), true);
            if (!snippets.length) {
                return;
            }
            const snippet = await instaService.invokeFunction(snippetPicker_1.pickSnippet, snippets);
            if (!snippet) {
                return;
            }
            let clipboardText;
            if (snippet.needsClipboard) {
                clipboardText = await clipboardService.readText();
            }
            editor.focus();
            snippetController2_1.SnippetController2.get(editor)?.insert(snippet.codeSnippet, { clipboardText });
            snippetsService.updateUsageTimestamp(snippet);
        }
    }
    exports.SurroundWithSnippetEditorAction = SurroundWithSnippetEditorAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vycm91bmRXaXRoU25pcHBldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9jb21tYW5kcy9zdXJyb3VuZFdpdGhTbmlwcGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCaEcsMERBUUM7SUFSTSxLQUFLLFVBQVUsdUJBQXVCLENBQUMsZUFBaUMsRUFBRSxLQUFpQixFQUFFLFFBQWtCLEVBQUUsdUJBQWdDO1FBRXZKLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDO1FBQ3hDLEtBQUssQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFckUsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFlLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxFQUFFLHVCQUF1QixFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7UUFDOUgsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxNQUFhLCtCQUFnQyxTQUFRLDZDQUFtQjtpQkFFdkQsWUFBTyxHQUFHO1lBQ3pCLEVBQUUsRUFBRSxtQ0FBbUM7WUFDdkMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLE9BQU8sRUFBRSwwQkFBMEIsQ0FBQztTQUNyRCxDQUFDO1FBRUY7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsR0FBRywrQkFBK0IsQ0FBQyxPQUFPO2dCQUMxQyxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQy9CLHFDQUFpQixDQUFDLFFBQVEsRUFDMUIscUNBQWlCLENBQUMsb0JBQW9CLENBQ3RDO2dCQUNELEVBQUUsRUFBRSxJQUFJO2FBQ1IsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUEwQixFQUFFLE1BQW1CO1lBQ3JFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDekQsTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO1lBRXpELE1BQU0sUUFBUSxHQUFHLE1BQU0sdUJBQXVCLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDL0csSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLFlBQVksQ0FBQyxjQUFjLENBQUMsMkJBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUN6RSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLGFBQWlDLENBQUM7WUFDdEMsSUFBSSxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVCLGFBQWEsR0FBRyxNQUFNLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25ELENBQUM7WUFFRCxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDZix1Q0FBa0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQy9FLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvQyxDQUFDOztJQTdDRiwwRUE4Q0MifQ==