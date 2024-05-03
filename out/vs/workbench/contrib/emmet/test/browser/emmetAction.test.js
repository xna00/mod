/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/emmet/browser/emmetActions", "vs/editor/test/browser/testCodeEditor", "assert", "vs/base/common/lifecycle", "vs/editor/common/languages/language", "vs/base/test/common/utils"], function (require, exports, emmetActions_1, testCodeEditor_1, assert, lifecycle_1, language_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MockGrammarContributions {
        constructor(scopeName) {
            this.scopeName = scopeName;
        }
        getGrammar(mode) {
            return this.scopeName;
        }
    }
    suite('Emmet', () => {
        test('Get language mode and parent mode for emmet', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([], {}, (editor, viewModel, instantiationService) => {
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'markdown' }));
                disposables.add(languageService.registerLanguage({ id: 'handlebars' }));
                disposables.add(languageService.registerLanguage({ id: 'nunjucks' }));
                disposables.add(languageService.registerLanguage({ id: 'laravel-blade' }));
                function testIsEnabled(mode, scopeName, expectedLanguage, expectedParentLanguage) {
                    const model = editor.getModel();
                    if (!model) {
                        assert.fail('Editor model not found');
                    }
                    model.setLanguage(mode);
                    const langOutput = emmetActions_1.EmmetEditorAction.getLanguage(editor, new MockGrammarContributions(scopeName));
                    if (!langOutput) {
                        assert.fail('langOutput not found');
                    }
                    assert.strictEqual(langOutput.language, expectedLanguage);
                    assert.strictEqual(langOutput.parentMode, expectedParentLanguage);
                }
                // syntaxes mapped using the scope name of the grammar
                testIsEnabled('markdown', 'text.html.markdown', 'markdown', 'html');
                testIsEnabled('handlebars', 'text.html.handlebars', 'handlebars', 'html');
                testIsEnabled('nunjucks', 'text.html.nunjucks', 'nunjucks', 'html');
                testIsEnabled('laravel-blade', 'text.html.php.laravel-blade', 'laravel-blade', 'html');
                // languages that have different Language Id and scopeName
                // testIsEnabled('razor', 'text.html.cshtml', 'razor', 'html');
                // testIsEnabled('HTML (Eex)', 'text.html.elixir', 'boo', 'html');
                disposables.dispose();
            });
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1tZXRBY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZW1tZXQvdGVzdC9icm93c2VyL2VtbWV0QWN0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSx3QkFBd0I7UUFHN0IsWUFBWSxTQUFpQjtZQUM1QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUM1QixDQUFDO1FBRU0sVUFBVSxDQUFDLElBQVk7WUFDN0IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7S0FDRDtJQUVELEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1FBQ25CLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7WUFDeEQsSUFBQSxtQ0FBa0IsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxvQkFBb0IsRUFBRSxFQUFFO2dCQUN0RSxNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztnQkFFbkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7Z0JBQzFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RSxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RFLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFM0UsU0FBUyxhQUFhLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsZ0JBQXlCLEVBQUUsc0JBQStCO29CQUNqSCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ2hDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDWixNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7b0JBQ3ZDLENBQUM7b0JBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEIsTUFBTSxVQUFVLEdBQUcsZ0NBQWlCLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxJQUFJLHdCQUF3QixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzt3QkFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO29CQUNyQyxDQUFDO29CQUVELE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUMxRCxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztnQkFDbkUsQ0FBQztnQkFFRCxzREFBc0Q7Z0JBQ3RELGFBQWEsQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRSxhQUFhLENBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDMUUsYUFBYSxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3BFLGFBQWEsQ0FBQyxlQUFlLEVBQUUsNkJBQTZCLEVBQUUsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUV2RiwwREFBMEQ7Z0JBQzFELCtEQUErRDtnQkFDL0Qsa0VBQWtFO2dCQUVsRSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdkIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztJQUMzQyxDQUFDLENBQUMsQ0FBQyJ9