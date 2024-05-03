define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/config/editorOptions", "vs/editor/contrib/suggest/browser/completionModel", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/wordDistance"], function (require, exports, assert, utils_1, editorOptions_1, completionModel_1, suggest_1, wordDistance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSuggestItem = createSuggestItem;
    function createSuggestItem(label, overwriteBefore, kind = 9 /* languages.CompletionItemKind.Property */, incomplete = false, position = { lineNumber: 1, column: 1 }, sortText, filterText) {
        const suggestion = {
            label,
            sortText,
            filterText,
            range: { startLineNumber: position.lineNumber, startColumn: position.column - overwriteBefore, endLineNumber: position.lineNumber, endColumn: position.column },
            insertText: typeof label === 'string' ? label : label.label,
            kind
        };
        const container = {
            incomplete,
            suggestions: [suggestion]
        };
        const provider = {
            _debugDisplayName: 'test',
            provideCompletionItems() {
                return;
            }
        };
        return new suggest_1.CompletionItem(position, suggestion, container, provider);
    }
    suite('CompletionModel', function () {
        const defaultOptions = {
            insertMode: 'insert',
            snippetsPreventQuickSuggestions: true,
            filterGraceful: true,
            localityBonus: false,
            shareSuggestSelections: false,
            showIcons: true,
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showDeprecated: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
        };
        let model;
        setup(function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('foo', 3),
                createSuggestItem('Foo', 3),
                createSuggestItem('foo', 2),
            ], 1, {
                leadingLineContent: 'foo',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('filtering - cached', function () {
            const itemsNow = model.items;
            let itemsThen = model.items;
            assert.ok(itemsNow === itemsThen);
            // still the same context
            model.lineContext = { leadingLineContent: 'foo', characterCountDelta: 0 };
            itemsThen = model.items;
            assert.ok(itemsNow === itemsThen);
            // different context, refilter
            model.lineContext = { leadingLineContent: 'foo1', characterCountDelta: 1 };
            itemsThen = model.items;
            assert.ok(itemsNow !== itemsThen);
        });
        test('complete/incomplete', () => {
            assert.strictEqual(model.getIncompleteProvider().size, 0);
            const incompleteModel = new completionModel_1.CompletionModel([
                createSuggestItem('foo', 3, undefined, true),
                createSuggestItem('foo', 2),
            ], 1, {
                leadingLineContent: 'foo',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(incompleteModel.getIncompleteProvider().size, 1);
        });
        test('Fuzzy matching of snippets stopped working with inline snippet suggestions #49895', function () {
            const completeItem1 = createSuggestItem('foobar1', 1, undefined, false, { lineNumber: 1, column: 2 });
            const completeItem2 = createSuggestItem('foobar2', 1, undefined, false, { lineNumber: 1, column: 2 });
            const completeItem3 = createSuggestItem('foobar3', 1, undefined, false, { lineNumber: 1, column: 2 });
            const completeItem4 = createSuggestItem('foobar4', 1, undefined, false, { lineNumber: 1, column: 2 });
            const completeItem5 = createSuggestItem('foobar5', 1, undefined, false, { lineNumber: 1, column: 2 });
            const incompleteItem1 = createSuggestItem('foofoo1', 1, undefined, true, { lineNumber: 1, column: 2 });
            const model = new completionModel_1.CompletionModel([
                completeItem1,
                completeItem2,
                completeItem3,
                completeItem4,
                completeItem5,
                incompleteItem1,
            ], 2, { leadingLineContent: 'f', characterCountDelta: 0 }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(model.getIncompleteProvider().size, 1);
            assert.strictEqual(model.items.length, 6);
        });
        test('proper current word when length=0, #16380', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('    </div', 4),
                createSuggestItem('a', 0),
                createSuggestItem('p', 0),
                createSuggestItem('    </tag', 4),
                createSuggestItem('    XYZ', 4),
            ], 1, {
                leadingLineContent: '   <',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(model.items.length, 4);
            const [a, b, c, d] = model.items;
            assert.strictEqual(a.completion.label, '    </div');
            assert.strictEqual(b.completion.label, '    </tag');
            assert.strictEqual(c.completion.label, 'a');
            assert.strictEqual(d.completion.label, 'p');
        });
        test('keep snippet sorting with prefix: top, #25495', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('Snippet1', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('tnippet2', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('semver', 1, 9 /* languages.CompletionItemKind.Property */),
            ], 1, {
                leadingLineContent: 's',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, defaultOptions, 'top', undefined);
            assert.strictEqual(model.items.length, 2);
            const [a, b] = model.items;
            assert.strictEqual(a.completion.label, 'Snippet1');
            assert.strictEqual(b.completion.label, 'semver');
            assert.ok(a.score < b.score); // snippet really promoted
        });
        test('keep snippet sorting with prefix: bottom, #25495', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('snippet1', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('tnippet2', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('Semver', 1, 9 /* languages.CompletionItemKind.Property */),
            ], 1, {
                leadingLineContent: 's',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, defaultOptions, 'bottom', undefined);
            assert.strictEqual(model.items.length, 2);
            const [a, b] = model.items;
            assert.strictEqual(a.completion.label, 'Semver');
            assert.strictEqual(b.completion.label, 'snippet1');
            assert.ok(a.score < b.score); // snippet really demoted
        });
        test('keep snippet sorting with prefix: inline, #25495', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('snippet1', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('tnippet2', 1, 27 /* languages.CompletionItemKind.Snippet */),
                createSuggestItem('Semver', 1),
            ], 1, {
                leadingLineContent: 's',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, defaultOptions, 'inline', undefined);
            assert.strictEqual(model.items.length, 2);
            const [a, b] = model.items;
            assert.strictEqual(a.completion.label, 'snippet1');
            assert.strictEqual(b.completion.label, 'Semver');
            assert.ok(a.score > b.score); // snippet really demoted
        });
        test('filterText seems ignored in autocompletion, #26874', function () {
            const item1 = createSuggestItem('Map - java.util', 1, undefined, undefined, undefined, undefined, 'Map');
            const item2 = createSuggestItem('Map - java.util', 1);
            model = new completionModel_1.CompletionModel([item1, item2], 1, {
                leadingLineContent: 'M',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(model.items.length, 2);
            model.lineContext = {
                leadingLineContent: 'Map ',
                characterCountDelta: 3
            };
            assert.strictEqual(model.items.length, 1);
        });
        test('Vscode 1.12 no longer obeys \'sortText\' in completion items (from language server), #26096', function () {
            const item1 = createSuggestItem('<- groups', 2, 9 /* languages.CompletionItemKind.Property */, false, { lineNumber: 1, column: 3 }, '00002', '  groups');
            const item2 = createSuggestItem('source', 0, 9 /* languages.CompletionItemKind.Property */, false, { lineNumber: 1, column: 3 }, '00001', 'source');
            const items = [item1, item2].sort((0, suggest_1.getSuggestionComparator)(1 /* SnippetSortOrder.Inline */));
            model = new completionModel_1.CompletionModel(items, 3, {
                leadingLineContent: '  ',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(model.items.length, 2);
            const [first, second] = model.items;
            assert.strictEqual(first.completion.label, 'source');
            assert.strictEqual(second.completion.label, '<- groups');
        });
        test('Completion item sorting broken when using label details #153026', function () {
            const itemZZZ = createSuggestItem({ label: 'ZZZ' }, 0, 11 /* languages.CompletionItemKind.Operator */, false);
            const itemAAA = createSuggestItem({ label: 'AAA' }, 0, 11 /* languages.CompletionItemKind.Operator */, false);
            const itemIII = createSuggestItem('III', 0, 11 /* languages.CompletionItemKind.Operator */, false);
            const cmp = (0, suggest_1.getSuggestionComparator)(1 /* SnippetSortOrder.Inline */);
            const actual = [itemZZZ, itemAAA, itemIII].sort(cmp);
            assert.deepStrictEqual(actual, [itemAAA, itemIII, itemZZZ]);
        });
        test('Score only filtered items when typing more, score all when typing less', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('console', 0),
                createSuggestItem('co_new', 0),
                createSuggestItem('bar', 0),
                createSuggestItem('car', 0),
                createSuggestItem('foo', 0),
            ], 1, {
                leadingLineContent: '',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            assert.strictEqual(model.items.length, 5);
            // narrow down once
            model.lineContext = { leadingLineContent: 'c', characterCountDelta: 1 };
            assert.strictEqual(model.items.length, 3);
            // query gets longer, narrow down the narrow-down'ed-set from before
            model.lineContext = { leadingLineContent: 'cn', characterCountDelta: 2 };
            assert.strictEqual(model.items.length, 2);
            // query gets shorter, refilter everything
            model.lineContext = { leadingLineContent: '', characterCountDelta: 0 };
            assert.strictEqual(model.items.length, 5);
        });
        test('Have more relaxed suggest matching algorithm #15419', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('result', 0),
                createSuggestItem('replyToUser', 0),
                createSuggestItem('randomLolut', 0),
                createSuggestItem('car', 0),
                createSuggestItem('foo', 0),
            ], 1, {
                leadingLineContent: '',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            // query gets longer, narrow down the narrow-down'ed-set from before
            model.lineContext = { leadingLineContent: 'rlut', characterCountDelta: 4 };
            assert.strictEqual(model.items.length, 3);
            const [first, second, third] = model.items;
            assert.strictEqual(first.completion.label, 'result'); // best with `rult`
            assert.strictEqual(second.completion.label, 'replyToUser'); // best with `rltu`
            assert.strictEqual(third.completion.label, 'randomLolut'); // best with `rlut`
        });
        test('Emmet suggestion not appearing at the top of the list in jsx files, #39518', function () {
            model = new completionModel_1.CompletionModel([
                createSuggestItem('from', 0),
                createSuggestItem('form', 0),
                createSuggestItem('form:get', 0),
                createSuggestItem('testForeignMeasure', 0),
                createSuggestItem('fooRoom', 0),
            ], 1, {
                leadingLineContent: '',
                characterCountDelta: 0
            }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            model.lineContext = { leadingLineContent: 'form', characterCountDelta: 4 };
            assert.strictEqual(model.items.length, 5);
            const [first, second, third] = model.items;
            assert.strictEqual(first.completion.label, 'form'); // best with `form`
            assert.strictEqual(second.completion.label, 'form:get'); // best with `form`
            assert.strictEqual(third.completion.label, 'from'); // best with `from`
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbk1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvdGVzdC9icm93c2VyL2NvbXBsZXRpb25Nb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQWFBLDhDQXFCQztJQXJCRCxTQUFnQixpQkFBaUIsQ0FBQyxLQUE2QyxFQUFFLGVBQXVCLEVBQUUsSUFBSSxnREFBd0MsRUFBRSxhQUFzQixLQUFLLEVBQUUsV0FBc0IsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxRQUFpQixFQUFFLFVBQW1CO1FBQzlRLE1BQU0sVUFBVSxHQUE2QjtZQUM1QyxLQUFLO1lBQ0wsUUFBUTtZQUNSLFVBQVU7WUFDVixLQUFLLEVBQUUsRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxlQUFlLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUU7WUFDL0osVUFBVSxFQUFFLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSztZQUMzRCxJQUFJO1NBQ0osQ0FBQztRQUNGLE1BQU0sU0FBUyxHQUE2QjtZQUMzQyxVQUFVO1lBQ1YsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDO1NBQ3pCLENBQUM7UUFDRixNQUFNLFFBQVEsR0FBcUM7WUFDbEQsaUJBQWlCLEVBQUUsTUFBTTtZQUN6QixzQkFBc0I7Z0JBQ3JCLE9BQU87WUFDUixDQUFDO1NBQ0QsQ0FBQztRQUVGLE9BQU8sSUFBSSx3QkFBYyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVB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