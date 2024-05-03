/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/editorWorker", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures", "vs/platform/environment/common/environment", "vs/editor/contrib/linesOperations/browser/linesOperations"], function (require, exports, assert, async_1, event_1, lifecycle_1, uri_1, mock_1, range_1, selection_1, editorWorker_1, snippetController2_1, suggestController_1, suggestMemory_1, testCodeEditor_1, testTextModel_1, actions_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, label_1, log_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, languageFeaturesService_1, languageFeatures_1, environment_1, linesOperations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SuggestController', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let controller;
        let editor;
        let model;
        const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
        teardown(function () {
            disposables.clear();
        });
        // ensureNoDisposablesAreLeakedInTestSuite();
        setup(function () {
            const serviceCollection = new serviceCollection_1.ServiceCollection([languageFeatures_1.ILanguageFeaturesService, languageFeaturesService], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [log_1.ILogService, new log_1.NullLogService()], [storage_1.IStorageService, disposables.add(new storage_1.InMemoryStorageService())], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
                    computeWordRanges() {
                        return Promise.resolve({});
                    }
                }], [suggestMemory_1.ISuggestMemoryService, new class extends (0, mock_1.mock)() {
                    memorize() { }
                    select() { return 0; }
                }], [actions_1.IMenuService, new class extends (0, mock_1.mock)() {
                    createMenu() {
                        return new class extends (0, mock_1.mock)() {
                            constructor() {
                                super(...arguments);
                                this.onDidChange = event_1.Event.None;
                            }
                            dispose() { }
                        };
                    }
                }], [label_1.ILabelService, new class extends (0, mock_1.mock)() {
                }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                }], [environment_1.IEnvironmentService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.isBuilt = true;
                        this.isExtensionDevelopment = false;
                    }
                }]);
            model = disposables.add((0, testTextModel_1.createTextModel)('', undefined, undefined, uri_1.URI.from({ scheme: 'test-ctrl', path: '/path.tst' })));
            editor = disposables.add((0, testCodeEditor_1.createTestCodeEditor)(model, { serviceCollection }));
            editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
            controller = editor.registerAndInstantiateContribution(suggestController_1.SuggestController.ID, suggestController_1.SuggestController);
        });
        test('postfix completion reports incorrect position #86984', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'let ${1:name} = foo$0',
                                insertTextRules: 4 /* CompletionItemInsertTextRule.InsertAsSnippet */,
                                range: { startLineNumber: 1, startColumn: 9, endLineNumber: 1, endColumn: 11 },
                                additionalTextEdits: [{
                                        text: '',
                                        range: { startLineNumber: 1, startColumn: 5, endLineNumber: 1, endColumn: 9 }
                                    }]
                            }]
                    };
                }
            }));
            editor.setValue('    foo.le');
            editor.setSelection(new selection_1.Selection(1, 11, 1, 11));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            assert.strictEqual(editor.getValue(), '    let name = foo');
        });
        test('use additionalTextEdits sync when possible', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos),
                                additionalTextEdits: [{
                                        text: 'I came sync',
                                        range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                                    }]
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'I came synchello\nhallohello');
        });
        test('resolve additionalTextEdits async when needed', async function () {
            let resolveCallCount = 0;
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await (0, async_1.timeout)(10);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            await (0, async_1.timeout)(20);
            assert.strictEqual(editor.getValue(), 'I came latehello\nhallohello');
            // single undo stop
            editor.getModel()?.undo();
            assert.strictEqual(editor.getValue(), 'hello\nhallo');
        });
        test('resolve additionalTextEdits async when needed (typing)', async function () {
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            assert.ok(editor.getSelection()?.equalsSelection(new selection_1.Selection(2, 11, 2, 11)));
            editor.trigger('test', 'type', { text: 'TYPING' });
            assert.strictEqual(editor.getValue(), 'hello\nhallohelloTYPING');
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'I came latehello\nhallohelloTYPING');
            assert.ok(editor.getSelection()?.equalsSelection(new selection_1.Selection(2, 17, 2, 17)));
        });
        // additional edit come late and are AFTER the selection -> cancel
        test('resolve additionalTextEdits async when needed (simple conflict)', async function () {
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 6, endLineNumber: 1, endColumn: 6 }
                        }];
                    return item;
                }
            }));
            editor.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello');
            assert.strictEqual(resolveCallCount, 1);
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'hello');
        });
        // additional edit come late and are AFTER the position at which the user typed -> cancelled
        test('resolve additionalTextEdits async when needed (conflict)', async function () {
            let resolveCallCount = 0;
            let resolve = () => { };
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    resolveCallCount += 1;
                    await new Promise(_resolve => resolve = _resolve);
                    item.additionalTextEdits = [{
                            text: 'I came late',
                            range: { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }
                        }];
                    return item;
                }
            }));
            editor.setValue('hello\nhallo');
            editor.setSelection(new selection_1.Selection(2, 6, 2, 6));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(false, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'hello\nhallohello');
            assert.strictEqual(resolveCallCount, 1);
            // additional edits happened after a litte wait
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            editor.trigger('test', 'type', { text: 'TYPING' });
            assert.strictEqual(editor.getValue(), 'TYPINGhello\nhallohello');
            resolve();
            await (0, async_1.timeout)(10);
            assert.strictEqual(editor.getValue(), 'TYPINGhello\nhallohello');
            assert.ok(editor.getSelection()?.equalsSelection(new selection_1.Selection(1, 7, 1, 7)));
        });
        test('resolve additionalTextEdits async when needed (cancel)', async function () {
            const resolve = [];
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hello',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'let',
                                insertText: 'hallo',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                },
                async resolveCompletionItem(item) {
                    await new Promise(_resolve => resolve.push(_resolve));
                    item.additionalTextEdits = [{
                            text: 'additionalTextEdits',
                            range: { startLineNumber: 1, startColumn: 2, endLineNumber: 1, endColumn: 2 }
                        }];
                    return item;
                }
            }));
            editor.setValue('abc');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(true, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'helloabc');
            // next
            controller.acceptNextSuggestion();
            // resolve additional edits (MUST be cancelled)
            resolve.forEach(fn => fn);
            resolve.length = 0;
            await (0, async_1.timeout)(10);
            // next suggestion used
            assert.strictEqual(editor.getValue(), 'halloabc');
        });
        test('Completion edits are applied inconsistently when additionalTextEdits and textEdit start at the same offset #143888', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'MyClassName',
                                insertText: 'MyClassName',
                                range: range_1.Range.fromPositions(pos),
                                additionalTextEdits: [{
                                        range: range_1.Range.fromPositions(pos),
                                        text: 'import "my_class.txt";\n'
                                    }]
                            }]
                    };
                }
            }));
            editor.setValue('');
            editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
            // trigger
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            //
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            controller.acceptSelectedSuggestion(true, false);
            await p2;
            // insertText happens sync!
            assert.strictEqual(editor.getValue(), 'import "my_class.txt";\nMyClassName');
        });
        test('Pressing enter on autocomplete should always apply the selected dropdown completion, not a different, hidden one #161883', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    const word = doc.getWordUntilPosition(pos);
                    const range = new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn);
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'filterBankSize',
                                insertText: 'filterBankSize',
                                sortText: 'a',
                                range
                            }, {
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'filter',
                                insertText: 'filter',
                                sortText: 'b',
                                range
                            }]
                    };
                }
            }));
            editor.setValue('filte');
            editor.setSelection(new selection_1.Selection(1, 6, 1, 6));
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            const { completionModel } = await p1;
            assert.strictEqual(completionModel.items.length, 2);
            const [first, second] = completionModel.items;
            assert.strictEqual(first.textLabel, 'filterBankSize');
            assert.strictEqual(second.textLabel, 'filter');
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 6, 1, 6));
            editor.trigger('keyboard', 'type', { text: 'r' }); // now filter "overtakes" filterBankSize because it is fully matched
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 7, 1, 7));
            controller.acceptSelectedSuggestion(false, false);
            assert.strictEqual(editor.getValue(), 'filter');
        });
        test('Fast autocomple typing selects the previous autocomplete suggestion, #71795', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    const word = doc.getWordUntilPosition(pos);
                    const range = new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn);
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'false',
                                insertText: 'false',
                                range
                            }, {
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'float',
                                insertText: 'float',
                                range
                            }, {
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'for',
                                insertText: 'for',
                                range
                            }, {
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'foreach',
                                insertText: 'foreach',
                                range
                            }]
                    };
                }
            }));
            editor.setValue('f');
            editor.setSelection(new selection_1.Selection(1, 2, 1, 2));
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            const { completionModel } = await p1;
            assert.strictEqual(completionModel.items.length, 4);
            const [first, second, third, fourth] = completionModel.items;
            assert.strictEqual(first.textLabel, 'false');
            assert.strictEqual(second.textLabel, 'float');
            assert.strictEqual(third.textLabel, 'for');
            assert.strictEqual(fourth.textLabel, 'foreach');
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 2, 1, 2));
            editor.trigger('keyboard', 'type', { text: 'o' }); // filters`false` and `float`
            assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 3, 1, 3));
            controller.acceptSelectedSuggestion(false, false);
            assert.strictEqual(editor.getValue(), 'for');
        });
        test.skip('Suggest widget gets orphaned in editor #187779', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    const word = doc.getLineContent(pos.lineNumber);
                    const range = new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column);
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: word,
                                insertText: word,
                                range
                            }]
                    };
                }
            }));
            editor.setValue(`console.log(example.)\nconsole.log(EXAMPLE.not)`);
            editor.setSelection(new selection_1.Selection(1, 21, 1, 21));
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            await p1;
            const p2 = event_1.Event.toPromise(controller.model.onDidCancel);
            new linesOperations_1.DeleteLinesAction().run(null, editor);
            await p2;
        });
        test('Ranges where additionalTextEdits are applied are not appropriate when characters are typed #177591', async function () {
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 27 /* CompletionItemKind.Snippet */,
                                label: 'aaa',
                                insertText: 'aaa',
                                range: range_1.Range.fromPositions(pos),
                                additionalTextEdits: [{
                                        range: range_1.Range.fromPositions(pos.delta(0, 10)),
                                        text: 'aaa'
                                    }]
                            }]
                    };
                }
            }));
            { // PART1 - no typing
                editor.setValue(`123456789123456789`);
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
                controller.triggerSuggest();
                const e = await p1;
                assert.strictEqual(e.completionModel.items.length, 1);
                assert.strictEqual(e.completionModel.items[0].textLabel, 'aaa');
                controller.acceptSelectedSuggestion(false, false);
                assert.strictEqual(editor.getValue(), 'aaa1234567891aaa23456789');
            }
            { // PART2 - typing
                editor.setValue(`123456789123456789`);
                editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
                controller.triggerSuggest();
                const e = await p1;
                assert.strictEqual(e.completionModel.items.length, 1);
                assert.strictEqual(e.completionModel.items[0].textLabel, 'aaa');
                editor.trigger('keyboard', 'type', { text: 'aa' });
                controller.acceptSelectedSuggestion(false, false);
                assert.strictEqual(editor.getValue(), 'aaa1234567891aaa23456789');
            }
        });
        test.skip('[Bug] "No suggestions" persists while typing if the completion helper is set to return an empty list for empty content#3557', async function () {
            let requestCount = 0;
            disposables.add(languageFeaturesService.completionProvider.register({ scheme: 'test-ctrl' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    requestCount += 1;
                    if (requestCount === 1) {
                        return undefined;
                    }
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'foo',
                                insertText: 'foo',
                                range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            const p1 = event_1.Event.toPromise(controller.model.onDidSuggest);
            controller.triggerSuggest();
            const e1 = await p1;
            assert.strictEqual(e1.completionModel.items.length, 0);
            assert.strictEqual(requestCount, 1);
            const p2 = event_1.Event.toPromise(controller.model.onDidSuggest);
            editor.trigger('keyboard', 'type', { text: 'f' });
            const e2 = await p2;
            assert.strictEqual(e2.completionModel.items.length, 1);
            assert.strictEqual(requestCount, 2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdENvbnRyb2xsZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC90ZXN0L2Jyb3dzZXIvc3VnZ2VzdENvbnRyb2xsZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWlDaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFO1FBRTFCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLElBQUksVUFBNkIsQ0FBQztRQUNsQyxJQUFJLE1BQXVCLENBQUM7UUFDNUIsSUFBSSxLQUFnQixDQUFDO1FBQ3JCLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxpREFBdUIsRUFBRSxDQUFDO1FBRTlELFFBQVEsQ0FBQztZQUVSLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILDZDQUE2QztRQUU3QyxLQUFLLENBQUM7WUFFTCxNQUFNLGlCQUFpQixHQUFHLElBQUkscUNBQWlCLENBQzlDLENBQUMsMkNBQXdCLEVBQUUsdUJBQXVCLENBQUMsRUFDbkQsQ0FBQyw2QkFBaUIsRUFBRSxxQ0FBb0IsQ0FBQyxFQUN6QyxDQUFDLGlCQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsRUFDbkMsQ0FBQyx5QkFBZSxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxnQ0FBc0IsRUFBRSxDQUFDLENBQUMsRUFDaEUsQ0FBQywrQkFBa0IsRUFBRSxJQUFJLDZDQUFxQixFQUFFLENBQUMsRUFDakQsQ0FBQyxtQ0FBb0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBd0I7b0JBQzNELGlCQUFpQjt3QkFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM1QixD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