var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/browser/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/contrib/suggest/browser/suggestModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/suggest/browser/suggest", "vs/platform/environment/common/environment", "vs/base/test/common/utils"], function (require, exports, assert, lifecycle_1, uri_1, mock_1, coreCommands_1, editOperation_1, range_1, selection_1, languages_1, languageConfigurationRegistry_1, nullTokenize_1, language_1, snippetController2_1, suggestController_1, suggestMemory_1, suggestModel_1, testCodeEditor_1, testTextModel_1, serviceCollection_1, keybinding_1, mockKeybindingService_1, label_1, storage_1, telemetry_1, telemetryUtils_1, workspace_1, languageFeaturesService_1, languageFeatures_1, instantiation_1, suggest_1, environment_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createMockEditor(model, languageFeaturesService) {
        const storeService = new storage_1.InMemoryStorageService();
        const editor = (0, testCodeEditor_1.createTestCodeEditor)(model, {
            serviceCollection: new serviceCollection_1.ServiceCollection([languageFeatures_1.ILanguageFeaturesService, languageFeaturesService], [telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [storage_1.IStorageService, storeService], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [suggestMemory_1.ISuggestMemoryService, new class {
                    memorize() {
                    }
                    select() {
                        return -1;
                    }
                }], [label_1.ILabelService, new class extends (0, mock_1.mock)() {
                }], [workspace_1.IWorkspaceContextService, new class extends (0, mock_1.mock)() {
                }], [environment_1.IEnvironmentService, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.isBuilt = true;
                        this.isExtensionDevelopment = false;
                    }
                }]),
        });
        const ctrl = editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
        editor.hasWidgetFocus = () => true;
        editor.registerDisposable(ctrl);
        editor.registerDisposable(storeService);
        return editor;
    }
    suite('SuggestModel - Context', function () {
        const OUTER_LANGUAGE_ID = 'outerMode';
        const INNER_LANGUAGE_ID = 'innerMode';
        let OuterMode = class OuterMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = OUTER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
                this._register(languages_1.TokenizationRegistry.register(this.languageId, {
                    getInitialState: () => nullTokenize_1.NullState,
                    tokenize: undefined,
                    tokenizeEncoded: (line, hasEOL, state) => {
                        const tokensArr = [];
                        let prevLanguageId = undefined;
                        for (let i = 0; i < line.length; i++) {
                            const languageId = (line.charAt(i) === 'x' ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                            const encodedLanguageId = languageService.languageIdCodec.encodeLanguageId(languageId);
                            if (prevLanguageId !== languageId) {
                                tokensArr.push(i);
                                tokensArr.push((encodedLanguageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */));
                            }
                            prevLanguageId = languageId;
                        }
                        const tokens = new Uint32Array(tokensArr.length);
                        for (let i = 0; i < tokens.length; i++) {
                            tokens[i] = tokensArr[i];
                        }
                        return new languages_1.EncodedTokenizationResult(tokens, state);
                    }
                }));
            }
        };
        OuterMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], OuterMode);
        let InnerMode = class InnerMode extends lifecycle_1.Disposable {
            constructor(languageService, languageConfigurationService) {
                super();
                this.languageId = INNER_LANGUAGE_ID;
                this._register(languageService.registerLanguage({ id: this.languageId }));
                this._register(languageConfigurationService.register(this.languageId, {}));
            }
        };
        InnerMode = __decorate([
            __param(0, language_1.ILanguageService),
            __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
        ], InnerMode);
        const assertAutoTrigger = (model, offset, expected, message) => {
            const pos = model.getPositionAt(offset);
            const editor = createMockEditor(model, new languageFeaturesService_1.LanguageFeaturesService());
            editor.setPosition(pos);
            assert.strictEqual(suggestModel_1.LineContext.shouldAutoTrigger(editor), expected, message);
            editor.dispose();
        };
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(function () {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Context - shouldAutoTrigger', function () {
            const model = (0, testTextModel_1.createTextModel)('Das Pferd frisst keinen Gurkensalat - Philipp Reis 1861.\nWer hat\'s erfunden?');
            disposables.add(model);
            assertAutoTrigger(model, 3, true, 'end of word, Das|');
            assertAutoTrigger(model, 4, false, 'no word Das |');
            assertAutoTrigger(model, 1, true, 'typing a single character before a word: D|as');
            assertAutoTrigger(model, 55, false, 'number, 1861|');
            model.dispose();
        });
        test('shouldAutoTrigger at embedded language boundaries', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const outerMode = disposables.add(instantiationService.createInstance(OuterMode));
            disposables.add(instantiationService.createInstance(InnerMode));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'a<xx>a<x>', outerMode.languageId));
            assertAutoTrigger(model, 1, true, 'a|<x — should trigger at end of word');
            assertAutoTrigger(model, 2, false, 'a<|x — should NOT trigger at start of word');
            assertAutoTrigger(model, 3, true, 'a<x|x —  should trigger after typing a single character before a word');
            assertAutoTrigger(model, 4, true, 'a<xx|> — should trigger at boundary between languages');
            assertAutoTrigger(model, 5, false, 'a<xx>|a — should NOT trigger at start of word');
            assertAutoTrigger(model, 6, true, 'a<xx>a|< — should trigger at end of word');
            assertAutoTrigger(model, 8, true, 'a<xx>a<x|> — should trigger at end of word at boundary');
            disposables.dispose();
        });
    });
    suite('SuggestModel - TriggerAndCancelOracle', function () {
        function getDefaultSuggestRange(model, position) {
            const wordUntil = model.getWordUntilPosition(position);
            return new range_1.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
        }
        const alwaysEmptySupport = {
            _debugDisplayName: 'test',
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: []
                };
            }
        };
        const alwaysSomethingSupport = {
            _debugDisplayName: 'test',
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: [{
                            label: doc.getWordUntilPosition(pos).word,
                            kind: 9 /* CompletionItemKind.Property */,
                            insertText: 'foofoo',
                            range: getDefaultSuggestRange(doc, pos)
                        }]
                };
            }
        };
        let disposables;
        let model;
        const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
        const registry = languageFeaturesService.completionProvider;
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            model = (0, testTextModel_1.createTextModel)('abc def', undefined, undefined, uri_1.URI.parse('test:somefile.ttt'));
            disposables.add(model);
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function withOracle(callback) {
            return new Promise((resolve, reject) => {
                const editor = createMockEditor(model, languageFeaturesService);
                const oracle = editor.invokeWithinContext(accessor => accessor.get(instantiation_1.IInstantiationService).createInstance(suggestModel_1.SuggestModel, editor));
                disposables.add(oracle);
                disposables.add(editor);
                try {
                    resolve(callback(oracle, editor));
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        function assertEvent(event, action, assert) {
            return new Promise((resolve, reject) => {
                const sub = event(e => {
                    sub.dispose();
                    try {
                        resolve(assert(e));
                    }
                    catch (err) {
                        reject(err);
                    }
                });
                try {
                    action();
                }
                catch (err) {
                    sub.dispose();
                    reject(err);
                }
            });
        }
        test('events - cancel/trigger', function () {
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true });
                    }, function (event) {
                        assert.strictEqual(event.auto, true);
                        return assertEvent(model.onDidCancel, function () {
                            model.cancel();
                        }, function (event) {
                            assert.strictEqual(event.retrigger, false);
                        });
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true });
                    }, function (event) {
                        assert.strictEqual(event.auto, true);
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: false });
                    }, function (event) {
                        assert.strictEqual(event.auto, false);
                    })
                ]);
            });
        });
        test('events - suggest/empty', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysEmptySupport));
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidCancel, function () {
                        model.trigger({ auto: true });
                    }, function (event) {
                        assert.strictEqual(event.retrigger, false);
                    }),
                    assertEvent(model.onDidSuggest, function () {
                        model.trigger({ auto: false });
                    }, function (event) {
                        assert.strictEqual(event.triggerOptions.auto, false);
                        assert.strictEqual(event.isFrozen, false);
                        assert.strictEqual(event.completionModel.items.length, 0);
                    })
                ]);
            });
        });
        test('trigger - on type', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'd' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('#17400: Keep filtering suggestModel.ts after space', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'My Table',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'My Table',
                                range: getDefaultSuggestRange(doc, pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    // make sure completionModel starts here!
                    model.trigger({ auto: true });
                }, event => {
                    return assertEvent(model.onDidSuggest, () => {
                        editor.setPosition({ lineNumber: 1, column: 1 });
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'My' });
                    }, event => {
                        assert.strictEqual(event.triggerOptions.auto, true);
                        assert.strictEqual(event.completionModel.items.length, 1);
                        const [first] = event.completionModel.items;
                        assert.strictEqual(first.completion.label, 'My Table');
                        return assertEvent(model.onDidSuggest, () => {
                            editor.setPosition({ lineNumber: 1, column: 3 });
                            editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
                        }, event => {
                            assert.strictEqual(event.triggerOptions.auto, true);
                            assert.strictEqual(event.completionModel.items.length, 1);
                            const [first] = event.completionModel.items;
                            assert.strictEqual(first.completion.label, 'My Table');
                        });
                    });
                });
            });
        });
        test('#21484: Trigger character always force a new completion session', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'foo.bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'boom',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'boom',
                                range: range_1.Range.fromPositions(pos.delta(0, doc.getLineContent(pos.lineNumber)[pos.column - 2] === '.' ? 0 : -1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'foo' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'foo.bar');
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                }, event => {
                    // SYNC
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'foo.bar');
                });
                await assertEvent(model.onDidSuggest, () => {
                    // nothing -> triggered by the trigger character typing (see above)
                }, event => {
                    // ASYNC
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    const [first, second] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'foo.bar');
                    assert.strictEqual(second.completion.label, 'boom');
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [1/2]', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, false);
                    assert.strictEqual(event.isFrozen, false);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: '+' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [2/2]', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, false);
                    assert.strictEqual(event.isFrozen, false);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' ' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (1/2)', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, false);
                    assert.strictEqual(event.completionModel.getIncompleteProvider().size, 1);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ';' });
                    }, event => {
                        assert.strictEqual(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (2/2)', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo;',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, false);
                    assert.strictEqual(event.completionModel.getIncompleteProvider().size, 1);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidSuggest, () => {
                        // while we cancel incrementally enriching the set of
                        // completions we still filter against those that we have
                        // until now
                        editor.trigger('keyboard', "type" /* Handler.Type */, { text: ';' });
                    }, event => {
                        assert.strictEqual(event.triggerOptions.auto, false);
                        assert.strictEqual(event.completionModel.getIncompleteProvider().size, 1);
                        assert.strictEqual(event.completionModel.items.length, 1);
                    });
                });
            });
        });
        test('Trigger character is provided in suggest context', function () {
            let triggerCharacter = '';
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos, context) {
                    assert.strictEqual(context.triggerKind, 1 /* CompletionTriggerKind.TriggerCharacter */);
                    triggerCharacter = context.triggerCharacter;
                    return {
                        incomplete: false,
                        suggestions: [
                            {
                                label: 'foo.bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }
                        ]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'foo.' });
                }, event => {
                    assert.strictEqual(triggerCharacter, '.');
                });
            });
        });
        test('Mac press and hold accent character insertion does not update suggestions, #35269', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'abc',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'abc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }, {
                                label: 'äbc',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'äbc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'a' });
                }, event => {
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].completion.label, 'abc');
                    return assertEvent(model.onDidSuggest, () => {
                        editor.executeEdits('test', [editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 2), 'ä')]);
                    }, event => {
                        // suggest model changed to äbc
                        assert.strictEqual(event.completionModel.items.length, 1);
                        assert.strictEqual(event.completionModel.items[0].completion.label, 'äbc');
                    });
                });
            });
        });
        test('Backspace should not always cancel code completion, #36491', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'd' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
                await assertEvent(model.onDidSuggest, () => {
                    coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Text changes for completion CodeAction are affected by the completion #39893', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'bar',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'bar',
                                range: range_1.Range.fromPositions(pos.delta(0, -2), pos),
                                additionalTextEdits: [{
                                        text: ', bar',
                                        range: { startLineNumber: 1, endLineNumber: 1, startColumn: 17, endColumn: 17 }
                                    }]
                            }]
                    };
                }
            }));
            model.setValue('ba; import { foo } from "./b"');
            return withOracle(async (sugget, editor) => {
                class TestCtrl extends suggestController_1.SuggestController {
                    _insertSuggestion_publicForTest(item, flags = 0) {
                        super._insertSuggestion(item, flags);
                    }
                }
                const ctrl = editor.registerAndInstantiateContribution(TestCtrl.ID, TestCtrl);
                editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
                await assertEvent(sugget.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 3 });
                    sugget.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.completion.label, 'bar');
                    ctrl._insertSuggestion_publicForTest({ item: first, index: 0, model: event.completionModel });
                });
                assert.strictEqual(model.getValue(), 'bar; import { foo, bar } from "./b"');
            });
        });
        test('Completion unexpectedly triggers on second keypress of an edit group in a snippet #43523', function () {
            disposables.add(registry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setValue('d');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 2));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'e' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.strictEqual(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Fails to render completion details #47988', function () {
            let disposeA = 0;
            let disposeB = 0;
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'CompleteNot',
                                insertText: 'Incomplete',
                                sortText: 'a',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeA += 1; }
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'Complete',
                                insertText: 'Complete',
                                sortText: 'z',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeB += 1; }
                    };
                },
                resolveCompletionItem(item) {
                    return item;
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'c' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(disposeA, 0);
                    assert.strictEqual(disposeB, 0);
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'o' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    // clean up
                    model.clear();
                    assert.strictEqual(disposeA, 2); // provide got called two times!
                    assert.strictEqual(disposeB, 1);
                });
            });
        });
        test('Trigger (full) completions when (incomplete) completions are already active #99504', function () {
            let countA = 0;
            let countB = 0;
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    countA += 1;
                    return {
                        incomplete: false, // doesn't matter if incomplete or not
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'Z aaa',
                                insertText: 'Z aaa',
                                range: new range_1.Range(1, 1, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    countB += 1;
                    if (!doc.getWordUntilPosition(pos).word.startsWith('a')) {
                        return;
                    }
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 23 /* CompletionItemKind.Folder */,
                                label: 'aaa',
                                insertText: 'aaa',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                    };
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'Z' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'Z aaa');
                });
                await assertEvent(model.onDidSuggest, () => {
                    // started another word: Z a|
                    // item should be: Z aaa, aaa
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: ' a' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'Z aaa');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'aaa');
                    assert.strictEqual(countA, 1); // should we keep the suggestions from the "active" provider?, Yes! See: #106573
                    assert.strictEqual(countB, 2);
                });
            });
        });
        test('registerCompletionItemProvider with letters as trigger characters block other completion items to show up #127815', async function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'AAAA',
                                insertText: 'WordTriggerA',
                                range: new range_1.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['a', '.'],
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'AAAA',
                                insertText: 'AutoTriggerA',
                                range: new range_1.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column)
                            }],
                    };
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                });
                editor.getModel().setValue('');
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'a' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                });
            });
        });
        test('Unexpected suggest scoring #167242', async function () {
            disposables.add(registry.register('*', {
                // word-based
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    const word = doc.getWordUntilPosition(pos);
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'pull',
                                insertText: 'pull',
                                range: new range_1.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                // JSON-based
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'git.pull',
                                insertText: 'git.pull',
                                range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)
                            }],
                    };
                },
            }));
            return withOracle(async function (model, editor) {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('gi');
                    editor.setSelection(new selection_1.Selection(1, 3, 1, 3));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 't' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'git.pull');
                });
                editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'p' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 1);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'git.pull');
                });
            });
        });
        test('Completion list closes unexpectedly when typing a digit after a word separator #169390', function () {
            const requestCounts = [0, 0];
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos) {
                    requestCounts[0] += 1;
                    return {
                        suggestions: [{
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'foo-20',
                                insertText: 'foo-20',
                                range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)
                            }, {
                                kind: 18 /* CompletionItemKind.Text */,
                                label: 'foo-hello',
                                insertText: 'foo-hello',
                                range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)
                            }],
                    };
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['2'],
                provideCompletionItems(doc, pos, ctx) {
                    requestCounts[1] += 1;
                    if (ctx.triggerKind !== 1 /* CompletionTriggerKind.TriggerCharacter */) {
                        return;
                    }
                    return {
                        suggestions: [{
                                kind: 5 /* CompletionItemKind.Class */,
                                label: 'foo-210',
                                insertText: 'foo-210',
                                range: new range_1.Range(pos.lineNumber, 1, pos.lineNumber, pos.column)
                            }],
                    };
                },
            }));
            return withOracle(async function (model, editor) {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('foo');
                    editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                    model.trigger({ auto: false });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, false);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'foo-20');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'foo-hello');
                });
                editor.trigger('keyboard', "type" /* Handler.Type */, { text: '-' });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: '2' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'foo-20');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'foo-210');
                    assert.deepStrictEqual(requestCounts, [1, 2]);
                });
            });
        });
        test('Set refilter-flag, keep triggerKind', function () {
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos, ctx) {
                    return {
                        suggestions: [{
                                label: doc.getWordUntilPosition(pos).word || 'hello',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'foofoo',
                                range: getDefaultSuggestRange(doc, pos)
                            }]
                    };
                },
            }));
            return withOracle(async function (model, editor) {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('foo');
                    editor.setSelection(new selection_1.Selection(1, 4, 1, 4));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'o' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.triggerOptions.triggerCharacter, undefined);
                    assert.strictEqual(event.triggerOptions.triggerKind, undefined);
                    assert.strictEqual(event.completionModel.items.length, 1);
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: '.' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.triggerOptions.refilter, undefined);
                    assert.strictEqual(event.triggerOptions.triggerCharacter, '.');
                    assert.strictEqual(event.triggerOptions.triggerKind, 1 /* CompletionTriggerKind.TriggerCharacter */);
                    assert.strictEqual(event.completionModel.items.length, 1);
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'h' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.triggerOptions.refilter, true);
                    assert.strictEqual(event.triggerOptions.triggerCharacter, '.');
                    assert.strictEqual(event.triggerOptions.triggerKind, 1 /* CompletionTriggerKind.TriggerCharacter */);
                    assert.strictEqual(event.completionModel.items.length, 1);
                });
            });
        });
        test('Snippets gone from IntelliSense #173244', function () {
            const snippetProvider = {
                _debugDisplayName: 'test',
                provideCompletionItems(doc, pos, ctx) {
                    return {
                        suggestions: [{
                                label: 'log',
                                kind: 27 /* CompletionItemKind.Snippet */,
                                insertText: 'log',
                                range: getDefaultSuggestRange(doc, pos)
                            }]
                    };
                }
            };
            const old = (0, suggest_1.setSnippetSuggestSupport)(snippetProvider);
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                if ((0, suggest_1.getSnippetSuggestSupport)() === snippetProvider) {
                    (0, suggest_1.setSnippetSuggestSupport)(old);
                }
            }));
            disposables.add(registry.register({ scheme: 'test' }, {
                _debugDisplayName: 'test',
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos, ctx) {
                    return {
                        suggestions: [{
                                label: 'locals',
                                kind: 9 /* CompletionItemKind.Property */,
                                insertText: 'locals',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        incomplete: true
                    };
                },
            }));
            return withOracle(async function (model, editor) {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'l' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.triggerOptions.triggerCharacter, undefined);
                    assert.strictEqual(event.triggerOptions.triggerKind, undefined);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'locals');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'log');
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', "type" /* Handler.Type */, { text: 'o' });
                }, event => {
                    assert.strictEqual(event.triggerOptions.triggerKind, 2 /* CompletionTriggerKind.TriggerForIncompleteCompletions */);
                    assert.strictEqual(event.triggerOptions.auto, true);
                    assert.strictEqual(event.completionModel.items.length, 2);
                    assert.strictEqual(event.completionModel.items[0].textLabel, 'locals');
                    assert.strictEqual(event.completionModel.items[1].textLabel, 'log');
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdE1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvdGVzdC9icm93c2VyL3N1Z2dlc3RNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQTZDQSxTQUFTLGdCQUFnQixDQUFDLEtBQWdCLEVBQUUsdUJBQWlEO1FBRTVGLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQXNCLEVBQUUsQ0FBQztRQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFBLHFDQUFvQixFQUFDLEtBQUssRUFBRTtZQUMxQyxpQkFBaUIsRUFBRSxJQUFJLHFDQUFpQixDQUN2QyxDQUFDLDJDQUF3QixFQUFFLHVCQUF1QixDQUFDLEVBQ25ELENBQUMsNkJBQWlCLEVBQUUscUNBQW9CLENBQUMsRUFDekMsQ0FBQyx5QkFBZSxFQUFFLFlBQVksQ0FBQyxFQUMvQixDQUFDLCtCQUFrQixFQUFFLElBQUksNkNBQXFCLEVBQUUsQ0FBQyxFQUNqRCxDQUFDLHFDQUFxQixFQUFFLElBQUk7b0JBRTNCLFFBQVE7b0JBQ1IsQ0FBQztvQkFDRCxNQUFNO3dCQUNMLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ1gsQ0FBQztpQkFDRCxDQUFDLEVBQ0YsQ0FBQyxxQkFBYSxFQUFFLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUFpQjtpQkFBSSxDQUFDLEVBQzVELENBQUMsb0NBQXdCLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQTRCO2lCQUFJLENBQUMsRUFDbEYsQ0FBQyxpQ0FBbUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBdUI7b0JBQXpDOzt3QkFDaEIsWUFBTyxHQUFZLElBQUksQ0FBQzt3QkFDeEIsMkJBQXNCLEdBQVksS0FBSyxDQUFDO29CQUNsRCxDQUFD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