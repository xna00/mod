/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/snippets/browser/snippetCompletionProvider", "vs/editor/common/core/position", "vs/editor/test/common/testTextModel", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/base/common/lifecycle", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/core/editOperation", "vs/editor/common/languages/language", "vs/base/common/uuid", "vs/base/test/common/utils", "vs/editor/contrib/suggest/browser/completionModel", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/wordDistance", "vs/editor/common/config/editorOptions"], function (require, exports, assert, snippetCompletionProvider_1, position_1, testTextModel_1, snippetsFile_1, lifecycle_1, testLanguageConfigurationService_1, editOperation_1, language_1, uuid_1, utils_1, completionModel_1, suggest_1, wordDistance_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SimpleSnippetService {
        constructor(snippets) {
            this.snippets = snippets;
        }
        getSnippets() {
            return Promise.resolve(this.getSnippetsSync());
        }
        getSnippetsSync() {
            return this.snippets;
        }
        getSnippetFiles() {
            throw new Error();
        }
        isEnabled() {
            throw new Error();
        }
        updateEnablement() {
            throw new Error();
        }
        updateUsageTimestamp(snippet) {
            throw new Error();
        }
    }
    suite('SnippetsService', function () {
        const defaultCompletionContext = { triggerKind: 0 /* CompletionTriggerKind.Invoke */ };
        let disposables;
        let instantiationService;
        let languageService;
        let snippetService;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({
                id: 'fooLang',
                extensions: ['.fooLang',]
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'barTest', 'bar', '', 'barCodeSnippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'bazzTest', 'bazz', '', 'bazzCodeSnippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        async function asCompletionModel(model, position, provider, context = defaultCompletionContext) {
            const list = await provider.provideCompletionItems(model, position_1.Position.lift(position), context);
            const result = new completionModel_1.CompletionModel(list.suggestions.map(s => {
                return new suggest_1.CompletionItem(position, s, list, provider);
            }), position.column, { characterCountDelta: 0, leadingLineContent: model.getLineContent(position.lineNumber).substring(0, position.column - 1) }, wordDistance_1.WordDistance.None, editorOptions_1.EditorOptions.suggest.defaultValue, editorOptions_1.EditorOptions.snippetSuggestions.defaultValue, undefined);
            return result;
        }
        test('snippet completions - simple', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 2);
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 2);
        });
        test('snippet completions - simple 2', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'hello ', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 6) /* hello| */, defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 0);
            });
            await provider.provideCompletionItems(model, new position_1.Position(1, 7) /* hello |*/, defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 2);
            });
            const completions1 = await asCompletionModel(model, new position_1.Position(1, 6) /* hello| */, provider);
            assert.strictEqual(completions1.items.length, 0);
            const completions2 = await asCompletionModel(model, new position_1.Position(1, 7) /* hello |*/, provider);
            assert.strictEqual(completions2.items.length, 2);
        });
        test('snippet completions - with prefix', async function () {
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'bar', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.incomplete, undefined);
                assert.strictEqual(result.suggestions.length, 1);
                assert.deepStrictEqual(result.suggestions[0].label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 1);
                assert.strictEqual(result.suggestions[0].insertText, 'barCodeSnippet');
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.deepStrictEqual(completions.items[0].completion.label, {
                label: 'bar',
                description: 'barTest'
            });
            assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
            assert.strictEqual(completions.items[0].completion.insertText, 'barCodeSnippet');
        });
        test('snippet completions - with different prefixes', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'barTest', 'bar', '', 's1', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'name', 'bar-bar', '', 's2', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'bar-bar', 'fooLang'));
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    assert.deepStrictEqual(result.suggestions[0].label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(result.suggestions[0].insertText, 's1');
                    assert.strictEqual(result.suggestions[0].range.insert.startColumn, 1);
                    assert.deepStrictEqual(result.suggestions[1].label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(result.suggestions[1].insertText, 's2');
                    assert.strictEqual(result.suggestions[1].range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
                assert.strictEqual(completions.items.length, 2);
                assert.deepStrictEqual(completions.items[0].completion.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(completions.items[0].completion.insertText, 's1');
                assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
                assert.deepStrictEqual(completions.items[1].completion.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(completions.items[1].completion.insertText, 's2');
                assert.strictEqual(completions.items[1].completion.range.insert.startColumn, 1);
            }
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 5), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    const [first, second] = result.suggestions;
                    assert.deepStrictEqual(first.label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(first.insertText, 's1');
                    assert.strictEqual(first.range.insert.startColumn, 5);
                    assert.deepStrictEqual(second.label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(second.insertText, 's2');
                    assert.strictEqual(second.range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider);
                assert.strictEqual(completions.items.length, 2);
                const [first, second] = completions.items.map(i => i.completion);
                assert.deepStrictEqual(first.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(first.insertText, 's2');
                assert.strictEqual(first.range.insert.startColumn, 1);
                assert.deepStrictEqual(second.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(second.insertText, 's1');
                assert.strictEqual(second.range.insert.startColumn, 5);
            }
            {
                await provider.provideCompletionItems(model, new position_1.Position(1, 6), defaultCompletionContext).then(result => {
                    assert.strictEqual(result.incomplete, undefined);
                    assert.strictEqual(result.suggestions.length, 2);
                    assert.deepStrictEqual(result.suggestions[0].label, {
                        label: 'bar',
                        description: 'barTest'
                    });
                    assert.strictEqual(result.suggestions[0].insertText, 's1');
                    assert.strictEqual(result.suggestions[0].range.insert.startColumn, 5);
                    assert.deepStrictEqual(result.suggestions[1].label, {
                        label: 'bar-bar',
                        description: 'name'
                    });
                    assert.strictEqual(result.suggestions[1].insertText, 's2');
                    assert.strictEqual(result.suggestions[1].range.insert.startColumn, 1);
                });
                const completions = await asCompletionModel(model, new position_1.Position(1, 6), provider);
                assert.strictEqual(completions.items.length, 2);
                assert.deepStrictEqual(completions.items[0].completion.label, {
                    label: 'bar-bar',
                    description: 'name'
                });
                assert.strictEqual(completions.items[0].completion.insertText, 's2');
                assert.strictEqual(completions.items[0].completion.range.insert.startColumn, 1);
                assert.deepStrictEqual(completions.items[1].completion.label, {
                    label: 'bar',
                    description: 'barTest'
                });
                assert.strictEqual(completions.items[1].completion.insertText, 's1');
                assert.strictEqual(completions.items[1].completion.range.insert.startColumn, 5);
            }
        });
        test('Cannot use "<?php" as user snippet prefix anymore, #26275', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], '', '<?php', '', 'insert me', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\t<?php', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 7), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions1 = await asCompletionModel(model, new position_1.Position(1, 7), provider);
            assert.strictEqual(completions1.items.length, 1);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\t<?', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 2);
            });
            const completions2 = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions2.items.length, 1);
            assert.strictEqual(completions2.items[0].completion.range.insert.startColumn, 2);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'a<?', 'fooLang');
            await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
                assert.strictEqual(result.suggestions[0].range.insert.startColumn, 2);
            });
            const completions3 = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(completions3.items.length, 1);
            assert.strictEqual(completions3.items[0].completion.range.insert.startColumn, 2);
            model.dispose();
        });
        test('No user snippets in suggestions, when inside the code, #30508', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], '', 'foo', '', '<foo>$0</foo>', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '<head>\n\t\n>/head>', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 1);
            await provider.provideCompletionItems(model, new position_1.Position(2, 2), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 1);
            });
            const completions2 = await asCompletionModel(model, new position_1.Position(2, 2), provider);
            assert.strictEqual(completions2.items.length, 1);
        });
        test('SnippetSuggest - ensure extension snippets come last ', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'second', 'second', '', 'second', '', 3 /* SnippetSource.Extension */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'first', 'first', '', 'first', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext).then(result => {
                assert.strictEqual(result.suggestions.length, 2);
                const [first, second] = result.suggestions;
                assert.deepStrictEqual(first.label, {
                    label: 'first',
                    description: 'first'
                });
                assert.deepStrictEqual(second.label, {
                    label: 'second',
                    description: 'second'
                });
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 2);
            const [first, second] = completions.items;
            assert.deepStrictEqual(first.completion.label, {
                label: 'first',
                description: 'first'
            });
            assert.deepStrictEqual(second.completion.label, {
                label: 'second',
                description: 'second'
            });
        });
        test('Dash in snippets prefix broken #53945', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'p-a', 'p-a', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'p-', 'fooLang'));
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            let completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
        });
        test('No snippets suggestion on long lines beyond character 100 #58807', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 158), provider);
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(completions.items.length, 1);
        });
        test('Type colon will trigger snippet #60746', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, ':', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 0);
            const completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(completions.items.length, 0);
        });
        test('substring of prefix can\'t trigger snippet #60737', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'mytemplate', 'mytemplate', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'template', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 9), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            assert.deepStrictEqual(result.suggestions[0].label, {
                label: 'mytemplate',
                description: 'mytemplate'
            });
            const completions = await asCompletionModel(model, new position_1.Position(1, 9), provider);
            assert.strictEqual(completions.items.length, 0);
        });
        test('No snippets suggestion beyond character 100 if not at end of line #60247', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea Thisisaverylonglinegoingwithmore100bcharactersandthismakesintellisensebecomea b text_after_b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 158), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 158), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('issue #61296: VS code freezes when editing CSS file with emoji', async function () {
            const languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            disposables.add(languageConfigurationService.register('fooLang', {
                wordPattern: /(#?-?\d*\.\d\w*%?)|(::?[\w-]*(?=[^,{;]*[,{]))|(([@#.!])?[\w-?]+%?|[@#!.])/g
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', '-a-bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, languageConfigurationService);
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '.🐷-a-b', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('No snippets shown when triggering completions at whitespace on line that already has text #62335', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'bug', 'bug', '', 'second', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'a ', 'fooLang'));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
        });
        test('Snippet prefix with special chars and numbers does not work #62906', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'noblockwdelay', '<<', '', '<= #dly"', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()), new snippetsFile_1.Snippet(false, ['fooLang'], 'noblockwdelay', '11', '', 'eleven', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ' <', 'fooLang');
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            let [first] = result.suggestions;
            assert.strictEqual(first.range.insert.startColumn, 2);
            let completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 2);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '1', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), defaultCompletionContext);
            completions = await asCompletionModel(model, new position_1.Position(1, 2), provider);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.startColumn, 1);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 1);
            model.dispose();
        });
        test('Snippet replace range', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'notWordTest', 'not word', '', 'not word snippet', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            let model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not wordFoo bar', 'fooLang');
            let result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            let [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 3);
            assert.strictEqual(first.range.replace.endColumn, 9);
            let completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 3);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not woFoo bar', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 3);
            assert.strictEqual(first.range.replace.endColumn, 3);
            completions = await asCompletionModel(model, new position_1.Position(1, 3), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 3);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 3);
            model.dispose();
            model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'not word', 'fooLang');
            result = await provider.provideCompletionItems(model, new position_1.Position(1, 1), defaultCompletionContext);
            assert.strictEqual(result.suggestions.length, 1);
            [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 1);
            assert.strictEqual(first.range.replace.endColumn, 9);
            completions = await asCompletionModel(model, new position_1.Position(1, 1), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 1);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
        });
        test('Snippet replace-range incorrect #108894', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'eng', 'eng', '', '<span></span>', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'filler e KEEP ng filler', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 9), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 9), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 9);
            assert.strictEqual(first.range.replace.endColumn, 9);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 9);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 9);
            model.dispose();
        });
        test('Snippet will replace auto-closing pair if specified in prefix', async function () {
            const languageConfigurationService = disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            disposables.add(languageConfigurationService.register('fooLang', {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'PSCustomObject', '[PSCustomObject]', '', '[PSCustomObject] @{ Key = Value }', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, languageConfigurationService);
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '[psc]', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 5), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.range.insert.endColumn, 5);
            // This is 6 because it should eat the `]` at the end of the text even if cursor is before it
            assert.strictEqual(first.range.replace.endColumn, 6);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editInsertEnd.column, 5);
            assert.strictEqual(completions.items[0].editReplaceEnd.column, 6);
            model.dispose();
        });
        test('Leading whitespace in snippet prefix #123860', async function () {
            snippetService = new SimpleSnippetService([new snippetsFile_1.Snippet(false, ['fooLang'], 'cite-name', ' cite', '', '~\\cite{$CLIPBOARD}', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ' ci', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 4), defaultCompletionContext);
            const completions = await asCompletionModel(model, new position_1.Position(1, 4), provider);
            assert.strictEqual(result.suggestions.length, 1);
            const [first] = result.suggestions;
            assert.strictEqual(first.label.label, ' cite');
            assert.strictEqual(first.range.insert.startColumn, 1);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, ' cite');
            assert.strictEqual(completions.items[0].editStart.column, 1);
            model.dispose();
        });
        test('still show suggestions in string when disable string suggestion #136611', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'aaa', 'aaa', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'bbb', 'bbb', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                // new Snippet(['fooLang'], '\'ccc', '\'ccc', '', 'value', '', SnippetSource.User, generateUuid())
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(result.suggestions.length, 0);
            model.dispose();
        });
        test('still show suggestions in string when disable string suggestion #136611 (part 2)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'aaa', 'aaa', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'bbb', 'bbb', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '\'ccc', '\'ccc', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)())
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(result.suggestions.length, 1);
            const completions = await asCompletionModel(model, new position_1.Position(1, 2), provider, { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '\'' });
            assert.strictEqual(completions.items.length, 1);
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'tys', 'tys', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'hell_or_tell', 'hell_or_tell', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '^y', '^y', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, '\'hellot\'', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, 'hell_or_tell');
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, 'hell_or_tell');
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (no word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'tys', 'tys', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 't', 't', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '^y', '^y', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, ')*&^', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 5), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, '^y');
            const completions = await asCompletionModel(model, new position_1.Position(1, 5), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, '^y');
            model.dispose();
        });
        test('Snippet suggestions are too eager #138707 (word/word)', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'async arrow function', 'async arrow function', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'foobarrrrrr', 'foobarrrrrr', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'foobar', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 7), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            assert.strictEqual(result.suggestions[0].label.label, 'foobarrrrrr');
            const completions = await asCompletionModel(model, new position_1.Position(1, 7), provider, { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].textLabel, 'foobarrrrrr');
            model.dispose();
        });
        test('Strange and useless autosuggestion #region/#endregion PHP #140039', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'reg', '#region', '', 'value', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'function abc(w)', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 15), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 0);
            model.dispose();
        });
        test.skip('Snippets disappear with . key #145960', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div', 'div', '', 'div', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div.', 'div.', '', 'div.', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], 'div#', 'div#', '', 'div#', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = (0, testTextModel_1.instantiateTextModel)(instantiationService, 'di', 'fooLang');
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 3), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 3);
            model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(1, 3), '.')]);
            assert.strictEqual(model.getValue(), 'di.');
            const result2 = await provider.provideCompletionItems(model, new position_1.Position(1, 4), { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: '.' });
            assert.strictEqual(result2.suggestions.length, 1);
            assert.strictEqual(result2.suggestions[0].insertText, 'div.');
            model.dispose();
        });
        test('Hyphen in snippet prefix de-indents snippet #139016', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], 'foo', 'Foo- Bar', '', 'Foo', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '    bar', 'fooLang'));
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const result = await provider.provideCompletionItems(model, new position_1.Position(1, 8), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
            assert.strictEqual(result.suggestions.length, 1);
            const first = result.suggestions[0];
            assert.strictEqual(first.range.insert.startColumn, 5);
            const completions = await asCompletionModel(model, new position_1.Position(1, 8), provider);
            assert.strictEqual(completions.items.length, 1);
            assert.strictEqual(completions.items[0].editStart.column, 5);
        });
        test('Autocomplete suggests based on the last letter of a word and it depends on the typing speed #191070', async function () {
            snippetService = new SimpleSnippetService([
                new snippetsFile_1.Snippet(false, ['fooLang'], '/whiletrue', '/whiletrue', '', 'one', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
                new snippetsFile_1.Snippet(false, ['fooLang'], '/sc not expanding', '/sc not expanding', '', 'two', '', 1 /* SnippetSource.User */, (0, uuid_1.generateUuid)()),
            ]);
            const provider = new snippetCompletionProvider_1.SnippetCompletionProvider(languageService, snippetService, disposables.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, '', 'fooLang'));
            { // PREFIX: w
                model.setValue('w');
                const result1 = await provider.provideCompletionItems(model, new position_1.Position(1, 2), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
                assert.strictEqual(result1.suggestions[0].insertText, 'one');
                assert.strictEqual(result1.suggestions.length, 1);
            }
            { // PREFIX: where
                model.setValue('where');
                const result2 = await provider.provideCompletionItems(model, new position_1.Position(1, 6), { triggerKind: 0 /* CompletionTriggerKind.Invoke */ });
                assert.strictEqual(result2.suggestions[0].insertText, 'one'); // /whiletrue matches where (WHilEtRuE)
                assert.strictEqual(result2.suggestions.length, 1);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NuaXBwZXRzL3Rlc3QvYnJvd3Nlci9zbmlwcGV0c1NlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsTUFBTSxvQkFBb0I7UUFFekIsWUFBcUIsUUFBbUI7WUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUFJLENBQUM7UUFDN0MsV0FBVztZQUNWLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0QsZUFBZTtZQUNkLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QixDQUFDO1FBQ0QsZUFBZTtZQUNkLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0QsU0FBUztZQUNSLE1BQU0sSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUNuQixDQUFDO1FBQ0QsZ0JBQWdCO1lBQ2YsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ25CLENBQUM7UUFDRCxvQkFBb0IsQ0FBQyxPQUFnQjtZQUNwQyxNQUFNLElBQUksS0FBSyxFQUFFLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQ3hCLE1BQU0sd0JBQXdCLEdBQXNCLEVBQUUsV0FBVyxzQ0FBOEIsRUFBRSxDQUFDO1FBRWxHLElBQUksV0FBNEIsQ0FBQztRQUNqQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksZUFBaUMsQ0FBQztRQUN0QyxJQUFJLGNBQWdDLENBQUM7UUFFckMsS0FBSyxDQUFDO1lBQ0wsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFv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