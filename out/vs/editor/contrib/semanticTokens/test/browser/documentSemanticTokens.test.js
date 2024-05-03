/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageService", "vs/editor/common/services/modelService", "vs/editor/common/services/semanticTokensStylingService", "vs/editor/contrib/semanticTokens/browser/documentSemanticTokens", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/log/common/log", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/common/theme", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedoService"], function (require, exports, assert, async_1, cancellation_1, event_1, lifecycle_1, mock_1, timeTravelScheduler_1, utils_1, range_1, languageFeatureDebounce_1, languageFeaturesService_1, languageService_1, modelService_1, semanticTokensStylingService_1, documentSemanticTokens_1, getSemanticTokens_1, testLanguageConfigurationService_1, testTextResourcePropertiesService_1, testConfigurationService_1, testDialogService_1, log_1, testNotificationService_1, theme_1, testThemeService_1, undoRedoService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ModelSemanticColoring', () => {
        const disposables = new lifecycle_1.DisposableStore();
        let modelService;
        let languageService;
        let languageFeaturesService;
        setup(() => {
            const configService = new testConfigurationService_1.TestConfigurationService({ editor: { semanticHighlighting: true } });
            const themeService = new testThemeService_1.TestThemeService();
            themeService.setTheme(new testThemeService_1.TestColorTheme({}, theme_1.ColorScheme.DARK, true));
            const logService = new log_1.NullLogService();
            languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
            languageService = disposables.add(new languageService_1.LanguageService(false));
            const semanticTokensStylingService = disposables.add(new semanticTokensStylingService_1.SemanticTokensStylingService(themeService, logService, languageService));
            modelService = disposables.add(new modelService_1.ModelService(configService, new testTextResourcePropertiesService_1.TestTextResourcePropertiesService(configService), new undoRedoService_1.UndoRedoService(new testDialogService_1.TestDialogService(), new testNotificationService_1.TestNotificationService()), languageService, new testLanguageConfigurationService_1.TestLanguageConfigurationService()));
            const envService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            };
            disposables.add(new documentSemanticTokens_1.DocumentSemanticTokensFeature(semanticTokensStylingService, modelService, themeService, configService, new languageFeatureDebounce_1.LanguageFeatureDebounceService(logService, envService), languageFeaturesService));
        });
        teardown(() => {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('DocumentSemanticTokens should be fetched when the result is empty if there are pending changes', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                const inFirstCall = new async_1.Barrier();
                const delayFirstResult = new async_1.Barrier();
                const secondResultProvided = new async_1.Barrier();
                let callCount = 0;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        if (callCount === 1) {
                            assert.ok('called once');
                            inFirstCall.open();
                            await delayFirstResult.wait();
                            await (0, async_1.timeout)(0); // wait for the simple scheduler to fire to check that we do actually get rescheduled
                            return null;
                        }
                        if (callCount === 2) {
                            assert.ok('called twice');
                            secondResultProvided.open();
                            return null;
                        }
                        assert.fail('Unexpected call');
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('Hello world', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                // wait for the provider to be called
                await inFirstCall.wait();
                // the provider is now in the provide call
                // change the text buffer while the provider is running
                textModel.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: 'x' }]);
                // let the provider finish its first result
                delayFirstResult.open();
                // we need to check that the provider is called again, even if it returns null
                await secondResultProvided.wait();
                // assert that it got called twice
                assert.strictEqual(callCount, 2);
            });
        });
        test('issue #149412: VS Code hangs when bad semantic token data is received', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                let lastResult = null;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        if (!lastResultId) {
                            // this is the first call
                            lastResult = {
                                resultId: '1',
                                data: new Uint32Array([4294967293, 0, 7, 16, 0, 1, 4, 3, 11, 1])
                            };
                        }
                        else {
                            // this is the second call
                            lastResult = {
                                resultId: '2',
                                edits: [{
                                        start: 4294967276,
                                        deleteCount: 0,
                                        data: new Uint32Array([2, 0, 3, 11, 0])
                                    }]
                            };
                        }
                        return lastResult;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                // wait for the semantic tokens to be fetched
                await event_1.Event.toPromise(textModel.onDidChangeTokens);
                assert.strictEqual(lastResult.resultId, '1');
                // edit the text
                textModel.applyEdits([{ range: new range_1.Range(1, 1, 1, 1), text: 'foo' }]);
                // wait for the semantic tokens to be fetched again
                await event_1.Event.toPromise(textModel.onDidChangeTokens);
                assert.strictEqual(lastResult.resultId, '2');
            });
        });
        test('issue #161573: onDidChangeSemanticTokens doesn\'t consistently trigger provideDocumentSemanticTokens', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                const emitter = new event_1.Emitter();
                let requestCount = 0;
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode', new class {
                    constructor() {
                        this.onDidChange = emitter.event;
                    }
                    getLegend() {
                        return { tokenTypes: ['class'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        requestCount++;
                        if (requestCount === 1) {
                            await (0, async_1.timeout)(1000);
                            // send a change event
                            emitter.fire();
                            await (0, async_1.timeout)(1000);
                            return null;
                        }
                        return null;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                const textModel = disposables.add(modelService.createModel('', languageService.createById('testMode')));
                // pretend the text model is attached to an editor (so that semantic tokens are computed)
                textModel.onBeforeAttached();
                await (0, async_1.timeout)(5000);
                assert.deepStrictEqual(requestCount, 2);
            });
        });
        test('DocumentSemanticTokens should be pick the token provider with actual items', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                let callCount = 0;
                disposables.add(languageService.registerLanguage({ id: 'testMode2' }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class1'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        // For a secondary request return a different value
                        if (lastResultId) {
                            return {
                                data: new Uint32Array([2, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                            };
                        }
                        return {
                            resultId: '1',
                            data: new Uint32Array([0, 1, 1, 1, 1, 0, 2, 1, 1, 1])
                        };
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                disposables.add(languageFeaturesService.documentSemanticTokensProvider.register('testMode2', new class {
                    getLegend() {
                        return { tokenTypes: ['class2'], tokenModifiers: [] };
                    }
                    async provideDocumentSemanticTokens(model, lastResultId, token) {
                        callCount++;
                        return null;
                    }
                    releaseDocumentSemanticTokens(resultId) {
                    }
                }));
                function toArr(arr) {
                    const result = [];
                    for (let i = 0; i < arr.length; i++) {
                        result[i] = arr[i];
                    }
                    return result;
                }
                const textModel = modelService.createModel('Hello world 2', languageService.createById('testMode2'));
                try {
                    let result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, null, null, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (1)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (1)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (1)`);
                    assert.ok(result.tokens.resultId, `Token result id found from multiple providers (1)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [0, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (1)`);
                    assert.deepStrictEqual(callCount, 2, `Called both token providers (1)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (1)`);
                    // Make a second request. Make sure we get the secondary value
                    result = await (0, getSemanticTokens_1.getDocumentSemanticTokens)(languageFeaturesService.documentSemanticTokensProvider, textModel, result.provider, result.tokens.resultId, cancellation_1.CancellationToken.None);
                    assert.ok(result, `We should have tokens (2)`);
                    assert.ok(result.tokens, `Tokens are found from multiple providers (2)`);
                    assert.ok((0, getSemanticTokens_1.isSemanticTokens)(result.tokens), `Tokens are full (2)`);
                    assert.ok(!result.tokens.resultId, `Token result id found from multiple providers (2)`);
                    assert.deepStrictEqual(toArr(result.tokens.data), [2, 1, 1, 1, 1, 0, 2, 1, 1, 1], `Token data returned for multiple providers (2)`);
                    assert.deepStrictEqual(callCount, 4, `Called both token providers (2)`);
                    assert.deepStrictEqual(result.provider.getLegend(), { tokenTypes: ['class1'], tokenModifiers: [] }, `Legend matches the tokens (2)`);
                }
                finally {
                    disposables.clear();
                    // Wait for scheduler to finish
                    await (0, async_1.timeout)(0);
                    // Now dispose the text model
                    textModel.dispose();
                }
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zZW1hbnRpY1Rva2Vucy90ZXN0L2Jyb3dzZXIvZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBa0NoRyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBRW5DLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzFDLElBQUksWUFBMkIsQ0FBQztRQUNoQyxJQUFJLGVBQWlDLENBQUM7UUFDdEMsSUFBSSx1QkFBaUQsQ0FBQztRQUV0RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsTUFBTSxhQUFhLEdBQUcsSUFBSSxtREFBd0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMvRixNQUFNLFlBQVksR0FBRyxJQUFJLG1DQUFnQixFQUFFLENBQUM7WUFDNUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLGlDQUFjLENBQUMsRUFBRSxFQUFFLG1CQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEUsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBYyxFQUFFLENBQUM7WUFDeEMsdUJBQXVCLEdBQUcsSUFBSSxpREFBdUIsRUFBRSxDQUFDO1lBQ3hELGVBQWUsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksaUNBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzlELE1BQU0sNEJBQTRCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLDJEQUE0QixDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsZUFBZSxD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