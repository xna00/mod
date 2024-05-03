define(["require", "exports", "assert", "vs/editor/test/browser/testCodeEditor", "vs/editor/contrib/stickyScroll/browser/stickyScrollController", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/services/languageFeatures", "vs/editor/test/common/testTextModel", "vs/editor/common/services/languageFeaturesService", "vs/editor/contrib/stickyScroll/browser/stickyScrollProvider", "vs/platform/log/common/log", "vs/platform/contextview/browser/contextView", "vs/base/test/common/mock", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/instantiation/common/descriptors", "vs/base/test/common/timeTravelScheduler", "vs/platform/environment/common/environment", "vs/base/test/common/utils", "vs/base/common/lifecycle"], function (require, exports, assert, testCodeEditor_1, stickyScrollController_1, serviceCollection_1, languageFeatures_1, testTextModel_1, languageFeaturesService_1, stickyScrollProvider_1, log_1, contextView_1, mock_1, languageConfigurationRegistry_1, languageFeatureDebounce_1, testLanguageConfigurationService_1, descriptors_1, timeTravelScheduler_1, environment_1, utils_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Sticky Scroll Tests', () => {
        const disposables = new lifecycle_1.DisposableStore();
        const serviceCollection = new serviceCollection_1.ServiceCollection([languageFeatures_1.ILanguageFeaturesService, new languageFeaturesService_1.LanguageFeaturesService()], [log_1.ILogService, new log_1.NullLogService()], [contextView_1.IContextMenuService, new class extends (0, mock_1.mock)() {
            }], [languageConfigurationRegistry_1.ILanguageConfigurationService, new testLanguageConfigurationService_1.TestLanguageConfigurationService()], [environment_1.IEnvironmentService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            }], [languageFeatureDebounce_1.ILanguageFeatureDebounceService, new descriptors_1.SyncDescriptor(languageFeatureDebounce_1.LanguageFeatureDebounceService)]);
        const text = [
            'function foo() {',
            '',
            '}',
            '/* comment related to TestClass',
            ' end of the comment */',
            '@classDecorator',
            'class TestClass {',
            '// comment related to the function functionOfClass',
            'functionOfClass(){',
            'function function1(){',
            '}',
            '}}',
            'function bar() { function insideBar() {}',
            '}'
        ].join('\n');
        setup(() => {
            disposables.clear();
        });
        teardown(() => {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function documentSymbolProviderForTestModel() {
            return {
                provideDocumentSymbols() {
                    return [
                        {
                            name: 'foo',
                            detail: 'foo',
                            kind: 11 /* SymbolKind.Function */,
                            tags: [],
                            range: { startLineNumber: 1, endLineNumber: 3, startColumn: 1, endColumn: 1 },
                            selectionRange: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 }
                        },
                        {
                            name: 'TestClass',
                            detail: 'TestClass',
                            kind: 4 /* SymbolKind.Class */,
                            tags: [],
                            range: { startLineNumber: 4, endLineNumber: 12, startColumn: 1, endColumn: 1 },
                            selectionRange: { startLineNumber: 7, endLineNumber: 7, startColumn: 1, endColumn: 1 },
                            children: [
                                {
                                    name: 'functionOfClass',
                                    detail: 'functionOfClass',
                                    kind: 11 /* SymbolKind.Function */,
                                    tags: [],
                                    range: { startLineNumber: 8, endLineNumber: 12, startColumn: 1, endColumn: 1 },
                                    selectionRange: { startLineNumber: 9, endLineNumber: 9, startColumn: 1, endColumn: 1 },
                                    children: [
                                        {
                                            name: 'function1',
                                            detail: 'function1',
                                            kind: 11 /* SymbolKind.Function */,
                                            tags: [],
                                            range: { startLineNumber: 10, endLineNumber: 11, startColumn: 1, endColumn: 1 },
                                            selectionRange: { startLineNumber: 10, endLineNumber: 10, startColumn: 1, endColumn: 1 },
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'bar',
                            detail: 'bar',
                            kind: 11 /* SymbolKind.Function */,
                            tags: [],
                            range: { startLineNumber: 13, endLineNumber: 14, startColumn: 1, endColumn: 1 },
                            selectionRange: { startLineNumber: 13, endLineNumber: 13, startColumn: 1, endColumn: 1 },
                            children: [
                                {
                                    name: 'insideBar',
                                    detail: 'insideBar',
                                    kind: 11 /* SymbolKind.Function */,
                                    tags: [],
                                    range: { startLineNumber: 13, endLineNumber: 13, startColumn: 1, endColumn: 1 },
                                    selectionRange: { startLineNumber: 13, endLineNumber: 13, startColumn: 1, endColumn: 1 },
                                }
                            ]
                        }
                    ];
                }
            };
        }
        test('Testing the function getCandidateStickyLinesIntersecting', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const model = (0, testTextModel_1.createTextModel)(text);
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(model, {
                    stickyScroll: {
                        enabled: true,
                        maxLineCount: 5,
                        defaultModel: 'outlineModel'
                    },
                    envConfig: {
                        outerHeight: 500
                    },
                    serviceCollection: serviceCollection
                }, async (editor, _viewModel, instantiationService) => {
                    const languageService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
                    const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
                    disposables.add(languageService.documentSymbolProvider.register('*', documentSymbolProviderForTestModel()));
                    const provider = new stickyScrollProvider_1.StickyLineCandidateProvider(editor, languageService, languageConfigurationService);
                    await provider.update();
                    assert.deepStrictEqual(provider.getCandidateStickyLinesIntersecting({ startLineNumber: 1, endLineNumber: 4 }), [new stickyScrollProvider_1.StickyLineCandidate(1, 2, 1)]);
                    assert.deepStrictEqual(provider.getCandidateStickyLinesIntersecting({ startLineNumber: 8, endLineNumber: 10 }), [new stickyScrollProvider_1.StickyLineCandidate(7, 11, 1), new stickyScrollProvider_1.StickyLineCandidate(9, 11, 2), new stickyScrollProvider_1.StickyLineCandidate(10, 10, 3)]);
                    assert.deepStrictEqual(provider.getCandidateStickyLinesIntersecting({ startLineNumber: 10, endLineNumber: 13 }), [new stickyScrollProvider_1.StickyLineCandidate(7, 11, 1), new stickyScrollProvider_1.StickyLineCandidate(9, 11, 2), new stickyScrollProvider_1.StickyLineCandidate(10, 10, 3)]);
                    provider.dispose();
                    model.dispose();
                });
            });
        });
        test('issue #157180: Render the correct line corresponding to the scope definition', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const model = (0, testTextModel_1.createTextModel)(text);
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(model, {
                    stickyScroll: {
                        enabled: true,
                        maxLineCount: 5,
                        defaultModel: 'outlineModel'
                    },
                    envConfig: {
                        outerHeight: 500
                    },
                    serviceCollection
                }, async (editor, _viewModel, instantiationService) => {
                    const stickyScrollController = editor.registerAndInstantiateContribution(stickyScrollController_1.StickyScrollController.ID, stickyScrollController_1.StickyScrollController);
                    const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
                    const languageService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
                    disposables.add(languageService.documentSymbolProvider.register('*', documentSymbolProviderForTestModel()));
                    await stickyScrollController.stickyScrollCandidateProvider.update();
                    let state;
                    editor.setScrollTop(1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1]);
                    editor.setScrollTop(lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1]);
                    editor.setScrollTop(4 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, []);
                    editor.setScrollTop(8 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [7, 9]);
                    editor.setScrollTop(9 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [7, 9]);
                    editor.setScrollTop(10 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [7]);
                    stickyScrollController.dispose();
                    stickyScrollController.stickyScrollCandidateProvider.dispose();
                    model.dispose();
                });
            });
        });
        test('issue #156268 : Do not reveal sticky lines when they are in a folded region ', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const model = (0, testTextModel_1.createTextModel)(text);
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(model, {
                    stickyScroll: {
                        enabled: true,
                        maxLineCount: 5,
                        defaultModel: 'outlineModel'
                    },
                    envConfig: {
                        outerHeight: 500
                    },
                    serviceCollection
                }, async (editor, viewModel, instantiationService) => {
                    const stickyScrollController = editor.registerAndInstantiateContribution(stickyScrollController_1.StickyScrollController.ID, stickyScrollController_1.StickyScrollController);
                    const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
                    const languageService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
                    disposables.add(languageService.documentSymbolProvider.register('*', documentSymbolProviderForTestModel()));
                    await stickyScrollController.stickyScrollCandidateProvider.update();
                    editor.setHiddenAreas([{ startLineNumber: 2, endLineNumber: 2, startColumn: 1, endColumn: 1 }, { startLineNumber: 10, endLineNumber: 11, startColumn: 1, endColumn: 1 }]);
                    let state;
                    editor.setScrollTop(1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1]);
                    editor.setScrollTop(lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, []);
                    editor.setScrollTop(6 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [7, 9]);
                    editor.setScrollTop(7 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [7]);
                    editor.setScrollTop(10 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, []);
                    stickyScrollController.dispose();
                    stickyScrollController.stickyScrollCandidateProvider.dispose();
                    model.dispose();
                });
            });
        });
        const textWithScopesWithSameStartingLines = [
            'class TestClass { foo() {',
            'function bar(){',
            '',
            '}}',
            '}',
            ''
        ].join('\n');
        function documentSymbolProviderForSecondTestModel() {
            return {
                provideDocumentSymbols() {
                    return [
                        {
                            name: 'TestClass',
                            detail: 'TestClass',
                            kind: 4 /* SymbolKind.Class */,
                            tags: [],
                            range: { startLineNumber: 1, endLineNumber: 5, startColumn: 1, endColumn: 1 },
                            selectionRange: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 },
                            children: [
                                {
                                    name: 'foo',
                                    detail: 'foo',
                                    kind: 11 /* SymbolKind.Function */,
                                    tags: [],
                                    range: { startLineNumber: 1, endLineNumber: 4, startColumn: 1, endColumn: 1 },
                                    selectionRange: { startLineNumber: 1, endLineNumber: 1, startColumn: 1, endColumn: 1 },
                                    children: [
                                        {
                                            name: 'bar',
                                            detail: 'bar',
                                            kind: 11 /* SymbolKind.Function */,
                                            tags: [],
                                            range: { startLineNumber: 2, endLineNumber: 4, startColumn: 1, endColumn: 1 },
                                            selectionRange: { startLineNumber: 2, endLineNumber: 2, startColumn: 1, endColumn: 1 },
                                            children: []
                                        }
                                    ]
                                },
                            ]
                        }
                    ];
                }
            };
        }
        test('issue #159271 : render the correct widget state when the child scope starts on the same line as the parent scope', () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const model = (0, testTextModel_1.createTextModel)(textWithScopesWithSameStartingLines);
                await (0, testCodeEditor_1.withAsyncTestCodeEditor)(model, {
                    stickyScroll: {
                        enabled: true,
                        maxLineCount: 5,
                        defaultModel: 'outlineModel'
                    },
                    envConfig: {
                        outerHeight: 500
                    },
                    serviceCollection
                }, async (editor, _viewModel, instantiationService) => {
                    const stickyScrollController = editor.registerAndInstantiateContribution(stickyScrollController_1.StickyScrollController.ID, stickyScrollController_1.StickyScrollController);
                    await stickyScrollController.stickyScrollCandidateProvider.update();
                    const lineHeight = editor.getOption(67 /* EditorOption.lineHeight */);
                    const languageService = instantiationService.get(languageFeatures_1.ILanguageFeaturesService);
                    disposables.add(languageService.documentSymbolProvider.register('*', documentSymbolProviderForSecondTestModel()));
                    await stickyScrollController.stickyScrollCandidateProvider.update();
                    let state;
                    editor.setScrollTop(1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1, 2]);
                    editor.setScrollTop(lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1, 2]);
                    editor.setScrollTop(2 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1]);
                    editor.setScrollTop(3 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, [1]);
                    editor.setScrollTop(4 * lineHeight + 1);
                    state = stickyScrollController.findScrollWidgetState();
                    assert.deepStrictEqual(state.startLineNumbers, []);
                    stickyScrollController.dispose();
                    stickyScrollController.stickyScrollCandidateProvider.dispose();
                    model.dispose();
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N0aWNreVNjcm9sbC90ZXN0L2Jyb3dzZXIvc3RpY2t5U2Nyb2xsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBMEJBLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7UUFFakMsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHFDQUFpQixDQUM5QyxDQUFDLDJDQUF3QixFQUFFLElBQUksaURBQXVCLEVBQUUsQ0FBQyxFQUN6RCxDQUFDLGlCQUFXLEVBQUUsSUFBSSxvQkFBYyxFQUFFLENBQUMsRUFDbkMsQ0FBQyxpQ0FBbUIsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBdUI7YUFBSSxDQUFDLEVBQ3hFLENBQUMsNkRBQTZCLEVBQUUsSUFBSSxtRUFBZ0MsRUFBRSxDQUFDLEVBQ3ZFLENBQUMsaUNBQW1CLEVBQUUsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXVCO2dCQUF6Qzs7b0JBQ2hCLFlBQU8sR0FBWSxJQUFJLENBQUM7b0JBQ3hCLDJCQUFzQixHQUFZLEtBQUssQ0FBQztnQkFDbEQsQ0FBQzthQUFBLENBQUMsRUFDRixDQUFDLHlEQUErQixFQUFFLElBQUksNEJBQWMsQ0FBQyx3REFBOEIsQ0FBQyxDQUFDLENBQ3JGLENBQUM7UUFFRixNQUFNLElBQUksR0FBRztZQUNaLGtCQUFrQjtZQUNsQixFQUFFO1lBQ0YsR0FBRztZQUNILGlDQUFpQztZQUNqQyx3QkFBd0I7WUFDeEIsaUJBQWlCO1lBQ2pCLG1CQUFtQjtZQUNuQixvREFBb0Q7WUFDcEQsb0JBQW9CO1lBQ3BCLHVCQUF1QjtZQUN2QixHQUFHO1lBQ0gsSUFB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