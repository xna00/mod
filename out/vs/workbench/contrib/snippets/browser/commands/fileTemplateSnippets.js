/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetController2", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/snippets/browser/commands/abstractSnippetsActions", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, strings_1, editorBrowser_1, language_1, snippetController2_1, nls_1, quickInput_1, abstractSnippetsActions_1, snippets_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplyFileSnippetAction = void 0;
    class ApplyFileSnippetAction extends abstractSnippetsActions_1.SnippetsAction {
        static { this.Id = 'workbench.action.populateFileFromSnippet'; }
        constructor() {
            super({
                id: ApplyFileSnippetAction.Id,
                title: (0, nls_1.localize2)('label', "Fill File with Snippet"),
                f1: true,
            });
        }
        async run(accessor) {
            const snippetService = accessor.get(snippets_1.ISnippetsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const langService = accessor.get(language_1.ILanguageService);
            const editor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            if (!editor || !editor.hasModel()) {
                return;
            }
            const snippets = await snippetService.getSnippets(undefined, { fileTemplateSnippets: true, noRecencySort: true, includeNoPrefixSnippets: true });
            if (snippets.length === 0) {
                return;
            }
            const selection = await this._pick(quickInputService, langService, snippets);
            if (!selection) {
                return;
            }
            if (editor.hasModel()) {
                // apply snippet edit -> replaces everything
                snippetController2_1.SnippetController2.get(editor)?.apply([{
                        range: editor.getModel().getFullModelRange(),
                        template: selection.snippet.body
                    }]);
                // set language if possible
                editor.getModel().setLanguage(langService.createById(selection.langId), ApplyFileSnippetAction.Id);
                editor.focus();
            }
        }
        async _pick(quickInputService, langService, snippets) {
            const all = [];
            for (const snippet of snippets) {
                if ((0, arrays_1.isFalsyOrEmpty)(snippet.scopes)) {
                    all.push({ langId: '', snippet });
                }
                else {
                    for (const langId of snippet.scopes) {
                        all.push({ langId, snippet });
                    }
                }
            }
            const picks = [];
            const groups = (0, arrays_1.groupBy)(all, (a, b) => (0, strings_1.compare)(a.langId, b.langId));
            for (const group of groups) {
                let first = true;
                for (const item of group) {
                    if (first) {
                        picks.push({
                            type: 'separator',
                            label: langService.getLanguageName(item.langId) ?? item.langId
                        });
                        first = false;
                    }
                    picks.push({
                        snippet: item,
                        label: item.snippet.prefix || item.snippet.name,
                        detail: item.snippet.description
                    });
                }
            }
            const pick = await quickInputService.pick(picks, {
                placeHolder: (0, nls_1.localize)('placeholder', 'Select a snippet'),
                matchOnDetail: true,
            });
            return pick?.snippet;
        }
    }
    exports.ApplyFileSnippetAction = ApplyFileSnippetAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVRlbXBsYXRlU25pcHBldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL2Jyb3dzZXIvY29tbWFuZHMvZmlsZVRlbXBsYXRlU25pcHBldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZWhHLE1BQWEsc0JBQXVCLFNBQVEsd0NBQWM7aUJBRXpDLE9BQUUsR0FBRywwQ0FBMEMsQ0FBQztRQUVoRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsc0JBQXNCLENBQUMsRUFBRTtnQkFDN0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsQ0FBQztnQkFDbkQsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDdEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLCtCQUFrQixDQUFDLENBQUM7WUFDM0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyw4QkFBYyxDQUFDLENBQUM7WUFDbkQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1lBRW5ELE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQWEsRUFBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ25DLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENB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