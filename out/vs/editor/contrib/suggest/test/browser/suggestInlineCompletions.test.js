/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/suggestInlineCompletions", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/instantiation/common/serviceCollection"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, mock_1, utils_1, position_1, range_1, languages_1, languageFeatures_1, suggestInlineCompletions_1, suggestMemory_1, testCodeEditor_1, testTextModel_1, serviceCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest Inline Completions', function () {
        const disposables = new lifecycle_1.DisposableStore();
        const services = new serviceCollection_1.ServiceCollection([suggestMemory_1.ISuggestMemoryService, new class extends (0, mock_1.mock)() {
                select() {
                    return 0;
                }
            }]);
        let insta;
        let model;
        let editor;
        setup(function () {
            insta = (0, testCodeEditor_1.createCodeEditorServices)(disposables, services);
            model = (0, testTextModel_1.createTextModel)('he', undefined, undefined, uri_1.URI.from({ scheme: 'foo', path: 'foo.bar' }));
            editor = (0, testCodeEditor_1.instantiateTestCodeEditor)(insta, model);
            editor.updateOptions({ quickSuggestions: { comments: 'inline', strings: 'inline', other: 'inline' } });
            insta.invokeFunction(accessor => {
                disposables.add(accessor.get(languageFeatures_1.ILanguageFeaturesService).completionProvider.register({ pattern: '*.bar', scheme: 'foo' }, new class {
                    constructor() {
                        this._debugDisplayName = 'test';
                    }
                    provideCompletionItems(model, position, context, token) {
                        const word = model.getWordUntilPosition(position);
                        const range = new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
                        const suggestions = [];
                        suggestions.push({ insertText: 'hello', label: 'hello', range, kind: 5 /* CompletionItemKind.Class */ });
                        suggestions.push({ insertText: 'hell', label: 'hell', range, kind: 5 /* CompletionItemKind.Class */ });
                        suggestions.push({ insertText: 'hey', label: 'hey', range, kind: 27 /* CompletionItemKind.Snippet */ });
                        return { suggestions };
                    }
                }));
            });
        });
        teardown(function () {
            disposables.clear();
            model.dispose();
            editor.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Aggressive inline completions when typing within line #146948', async function () {
            const completions = disposables.add(insta.createInstance(suggestInlineCompletions_1.SuggestInlineCompletions));
            {
                // (1,3), end of word -> suggestions
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 3), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.strictEqual(result?.items.length, 3);
                completions.freeInlineCompletions(result);
            }
            {
                // (1,2), middle of word -> NO suggestions
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 2), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.ok(result === undefined);
            }
        });
        test('Snippets show in inline suggestions even though they are turned off #175190', async function () {
            const completions = disposables.add(insta.createInstance(suggestInlineCompletions_1.SuggestInlineCompletions));
            {
                // unfiltered
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 3), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.strictEqual(result?.items.length, 3);
                completions.freeInlineCompletions(result);
            }
            {
                // filtered
                editor.updateOptions({ suggest: { showSnippets: false } });
                const result = await completions.provideInlineCompletions(model, new position_1.Position(1, 3), { triggerKind: languages_1.InlineCompletionTriggerKind.Explicit, selectedSuggestionInfo: undefined }, cancellation_1.CancellationToken.None);
                assert.strictEqual(result?.items.length, 2);
                completions.freeInlineCompletions(result);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdElubGluZUNvbXBsZXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvdGVzdC9icm93c2VyL3N1Z2dlc3RJbmxpbmVDb21wbGV0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBc0JoRyxLQUFLLENBQUMsNEJBQTRCLEVBQUU7UUFFbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxxQ0FBaUIsQ0FBQyxDQUFDLHFDQUFxQixFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUF5QjtnQkFDcEcsTUFBTTtvQkFDZCxPQUFPLENBQUMsQ0FBQztnQkFDVixDQUFDO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLEtBQStCLENBQUM7UUFDcEMsSUFBSSxLQUFnQixDQUFDO1FBQ3JCLElBQUksTUFBdUIsQ0FBQztRQUU1QixLQUFLLENBQUM7WUFFTCxLQUFLLEdBQUcsSUFBQSx5Q0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDeEQsS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE1BQU0sR0FBRyxJQUFBLDBDQUF5QixFQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUs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