/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, lifecycle_1, utils_1, range_1, selection_1, language_1, languageConfigurationRegistry_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CodeEditorWidget', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('onDidChangeModelDecorations', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelDecorations((e) => {
                    invoked = true;
                }));
                viewModel.model.deltaDecorations([], [{ range: new range_1.Range(1, 1, 1, 1), options: { description: 'test' } }]);
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelLanguage', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel, instantiationService) => {
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                let invoked = false;
                disposables.add(editor.onDidChangeModelLanguage((e) => {
                    invoked = true;
                }));
                viewModel.model.setLanguage('testMode');
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelLanguageConfiguration', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel, instantiationService) => {
                const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
                const languageService = instantiationService.get(language_1.ILanguageService);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(languageService.registerLanguage({ id: 'testMode' }));
                viewModel.model.setLanguage('testMode');
                let invoked = false;
                disposables.add(editor.onDidChangeModelLanguageConfiguration((e) => {
                    invoked = true;
                }));
                disposables.add(languageConfigurationService.register('testMode', {
                    brackets: [['(', ')']]
                }));
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelContent', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelContent((e) => {
                    invoked = true;
                }));
                viewModel.type('hello', 'test');
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('onDidChangeModelOptions', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let invoked = false;
                disposables.add(editor.onDidChangeModelOptions((e) => {
                    invoked = true;
                }));
                viewModel.model.updateOptions({
                    tabSize: 3
                });
                assert.deepStrictEqual(invoked, true);
                disposables.dispose();
            });
        });
        test('issue #145872 - Model change events are emitted before the selection updates', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                let observedSelection = null;
                disposables.add(editor.onDidChangeModelContent((e) => {
                    observedSelection = editor.getSelection();
                }));
                viewModel.type('hello', 'test');
                assert.deepStrictEqual(observedSelection, new selection_1.Selection(1, 6, 1, 6));
                disposables.dispose();
            });
        });
        test('monaco-editor issue #2774 - Wrong order of events onDidChangeModelContent and onDidChangeCursorSelection on redo', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                viewModel.model.undo();
                viewModel.model.redo();
                assert.deepStrictEqual(calls, [
                    'contentchange(a, 0, 0)',
                    'cursorchange(1, 2)',
                    'contentchange(, 0, 1)',
                    'cursorchange(1, 1)',
                    'contentchange(a, 0, 0)',
                    'cursorchange(1, 2)'
                ]);
                disposables.dispose();
            });
        });
        test('issue #146174: Events delivered out of order when adding decorations in content change listener (1 of 2)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener1 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener1 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener2 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener2 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                assert.deepStrictEqual(calls, ([
                    'listener1 - contentchange(a, 0, 0)',
                    'listener2 - contentchange(a, 0, 0)',
                    'listener1 - cursorchange(1, 2)',
                    'listener2 - cursorchange(1, 2)',
                ]));
                disposables.dispose();
            });
        });
        test('issue #146174: Events delivered out of order when adding decorations in content change listener (2 of 2)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor, viewModel) => {
                const disposables = new lifecycle_1.DisposableStore();
                const calls = [];
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener1 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                    editor.changeDecorations((changeAccessor) => {
                        changeAccessor.deltaDecorations([], [{ range: new range_1.Range(1, 1, 1, 1), options: { description: 'test' } }]);
                    });
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener1 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                disposables.add(editor.onDidChangeModelContent((e) => {
                    calls.push(`listener2 - contentchange(${e.changes.reduce((aggr, c) => [...aggr, c.text, c.rangeOffset, c.rangeLength], []).join(', ')})`);
                }));
                disposables.add(editor.onDidChangeCursorSelection((e) => {
                    calls.push(`listener2 - cursorchange(${e.selection.positionLineNumber}, ${e.selection.positionColumn})`);
                }));
                viewModel.type('a', 'test');
                assert.deepStrictEqual(calls, ([
                    'listener1 - contentchange(a, 0, 0)',
                    'listener2 - contentchange(a, 0, 0)',
                    'listener1 - cursorchange(1, 2)',
                    'listener2 - cursorchange(1, 2)',
                ]));
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZUVkaXRvcldpZGdldC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3dpZGdldC9jb2RlRWRpdG9yV2lkZ2V0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtRQUU5QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtZQUN4QyxJQUFBLG1DQUFrQixFQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7Z0JBQ2hELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUUxQyxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUM7Z0JBQ3BCLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7b0JBQ3hELE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosU0FBUyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRTNHLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUV0QyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFD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