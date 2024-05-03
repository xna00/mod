define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/test/common/testTextModel", "vs/editor/common/languageFeatureRegistry", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, position_1, range_1, suggest_1, testTextModel_1, languageFeatureRegistry_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest', function () {
        let model;
        let registration;
        let registry;
        setup(function () {
            registry = new languageFeatureRegistry_1.LanguageFeatureRegistry();
            model = (0, testTextModel_1.createTextModel)('FOO\nbar\BAR\nfoo', undefined, undefined, uri_1.URI.parse('foo:bar/path'));
            registration = registry.register({ pattern: 'bar/path', scheme: 'foo' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(_doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'aaa',
                                kind: 27 /* CompletionItemKind.Snippet */,
                                insertText: 'aaa',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                label: 'zzz',
                                kind: 27 /* CompletionItemKind.Snippet */,
                                insertText: 'zzz',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                label: 'fff',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'fff',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                }
            });
        });
        teardown(() => {
            registration.dispose();
            model.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('sort - snippet inline', async function () {
            const { items, disposable } = await (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(1 /* SnippetSortOrder.Inline */));
            assert.strictEqual(items.length, 3);
            assert.strictEqual(items[0].completion.label, 'aaa');
            assert.strictEqual(items[1].completion.label, 'fff');
            assert.strictEqual(items[2].completion.label, 'zzz');
            disposable.dispose();
        });
        test('sort - snippet top', async function () {
            const { items, disposable } = await (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(0 /* SnippetSortOrder.Top */));
            assert.strictEqual(items.length, 3);
            assert.strictEqual(items[0].completion.label, 'aaa');
            assert.strictEqual(items[1].completion.label, 'zzz');
            assert.strictEqual(items[2].completion.label, 'fff');
            disposable.dispose();
        });
        test('sort - snippet bottom', async function () {
            const { items, disposable } = await (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(2 /* SnippetSortOrder.Bottom */));
            assert.strictEqual(items.length, 3);
            assert.strictEqual(items[0].completion.label, 'fff');
            assert.strictEqual(items[1].completion.label, 'aaa');
            assert.strictEqual(items[2].completion.label, 'zzz');
            disposable.dispose();
        });
        test('sort - snippet none', async function () {
            const { items, disposable } = await (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(27 /* CompletionItemKind.Snippet */)));
            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].completion.label, 'fff');
            disposable.dispose();
        });
        test('only from', function (callback) {
            const foo = {
                triggerCharacters: [],
                provideCompletionItems() {
                    return {
                        currentWord: '',
                        incomplete: false,
                        suggestions: [{
                                label: 'jjj',
                                type: 'property',
                                insertText: 'jjj'
                            }]
                    };
                }
            };
            const registration = registry.register({ pattern: 'bar/path', scheme: 'foo' }, foo);
            (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, undefined, new Set().add(foo))).then(({ items, disposable }) => {
                registration.dispose();
                assert.strictEqual(items.length, 1);
                assert.ok(items[0].provider === foo);
                disposable.dispose();
                callback();
            });
        });
        test('Ctrl+space completions stopped working with the latest Insiders, #97650', async function () {
            const foo = new class {
                constructor() {
                    this._debugDisplayName = 'test';
                    this.triggerCharacters = [];
                }
                provideCompletionItems() {
                    return {
                        suggestions: [{
                                label: 'one',
                                kind: 5 /* CompletionItemKind.Class */,
                                insertText: 'one',
                                range: {
                                    insert: new range_1.Range(0, 0, 0, 0),
                                    replace: new range_1.Range(0, 0, 0, 10)
                                }
                            }, {
                                label: 'two',
                                kind: 5 /* CompletionItemKind.Class */,
                                insertText: 'two',
                                range: {
                                    insert: new range_1.Range(0, 0, 0, 0),
                                    replace: new range_1.Range(0, 1, 0, 10)
                                }
                            }]
                    };
                }
            };
            const registration = registry.register({ pattern: 'bar/path', scheme: 'foo' }, foo);
            const { items, disposable } = await (0, suggest_1.provideSuggestionItems)(registry, model, new position_1.Position(0, 0), new suggest_1.CompletionOptions(undefined, undefined, new Set().add(foo)));
            registration.dispose();
            assert.strictEqual(items.length, 2);
            const [a, b] = items;
            assert.strictEqual(a.completion.label, 'one');
            assert.strictEqual(a.isInvalid, false);
            assert.strictEqual(b.completion.label, 'two');
            assert.strictEqual(b.isInvalid, true);
            disposable.dispose();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L3Rlc3QvYnJvd3Nlci9zdWdnZXN0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBaUJBLEtBQUssQ0FBQyxTQUFTLEVBQUU7UUFDaEIsSUFBSSxLQUFnQixDQUFDO1FBQ3JCLElBQUksWUFBeUIsQ0FBQztRQUM5QixJQUFJLFFBQXlELENBQUM7UUFFOUQsS0FBSyxDQUFDO1lBQ0wsUUFBUSxHQUFHLElBQUksaURBQXVCLEVBQUUsQ0FBQztZQUN6QyxLQUFLLEdBQUcsSUFBQSwrQkFBZSxFQUFDLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQzlGLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3hFLGlCQUFpQixFQUFFLE1BQU07Z0JBQ3pCLHNCQUFzQixDQUFDLElBQUksRUFBRSxHQUFHO29CQUMvQixPQUFPO3dCQUNOLFVBQVUsRUFBRSxLQUFLO3dCQUNqQixXQUFXLEVBQUUsQ0FBQztnQ0FDYixLQUFLLEVBQUUsS0FBSztnQ0FDWixJQUFJLHFDQUE0QjtnQ0FDaEMsVUFBVSxFQUFFLEtBQUs7Z0NBQ2pCLEtBQUssRUFBRSxhQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQzs2QkFDL0IsRUFBRTtnQ0FDRixLQUFLLEVBQUUsS0FBSztnQ0FDWixJQUFJLHFDQUE0QjtnQ0FDaEMsVUFBVSxFQUFFLEtBQUs7Z0NBQ2pCLEtBQUssRUFBRSxhQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQzs2QkFDL0IsRUFBRTtnQ0FDRixL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