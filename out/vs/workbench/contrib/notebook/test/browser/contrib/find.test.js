/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/language", "vs/editor/contrib/find/browser/findState", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/test/common/utils"], function (require, exports, assert, range_1, model_1, wordHelper_1, language_1, findState_1, configuration_1, testConfigurationService_1, findModel_1, notebookCommon_1, testNotebookEditor_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Find', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const configurationValue = {
            value: wordHelper_1.USUAL_WORD_SEPARATORS
        };
        const configurationService = new class extends testConfigurationService_1.TestConfigurationService {
            inspect() {
                return configurationValue;
            }
        }();
        const setupEditorForTest = (editor, viewModel) => {
            editor.changeModelDecorations = (callback) => {
                return callback({
                    deltaDecorations: (oldDecorations, newDecorations) => {
                        const ret = [];
                        newDecorations.forEach(dec => {
                            const cell = viewModel.viewCells.find(cell => cell.handle === dec.ownerId);
                            const decorations = cell?.deltaModelDecorations([], dec.decorations) ?? [];
                            if (decorations.length > 0) {
                                ret.push({ ownerId: dec.ownerId, decorations: decorations });
                            }
                        });
                        return ret;
                    }
                });
            };
        };
        test('Update find matches basics', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = disposables.add(new findState_1.FindReplaceState());
                const model = disposables.add(new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService)));
                const found = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                assert.strictEqual(model.findMatches.length, 2);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                assert.strictEqual(editor.textModel.length, 3);
                const found2 = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 3, count: 0, cells: [
                            disposables.add(new testNotebookEditor_1.TestCell(viewModel.viewType, 3, '# next paragraph 1', 'markdown', notebookCommon_1.CellKind.Code, [], accessor.get(language_1.ILanguageService))),
                        ]
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(editor.textModel.length, 4);
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 1);
            });
        });
        test('Update find matches basics 2', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = disposables.add(new findState_1.FindReplaceState());
                const model = disposables.add(new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService)));
                const found = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 2);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 3);
                const found2 = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 2, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 3);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 2);
            });
        });
        test('Update find matches basics 3', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = disposables.add(new findState_1.FindReplaceState());
                const model = disposables.add(new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService)));
                const found = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 4);
                const found2 = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 2, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 3);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 2);
            });
        });
        test('Update find matches, #112748', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = disposables.add(new findState_1.FindReplaceState());
                const model = disposables.add(new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService)));
                const found = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                model.find({ previous: false });
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 3);
                const found2 = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                viewModel.viewCells[1].textBuffer.applyEdits([
                    new model_1.ValidAnnotatedEditOperation(null, new range_1.Range(1, 1, 1, 14), '', false, false, false)
                ], false, true);
                // cell content updates, recompute
                model.research();
                await found2;
                assert.strictEqual(model.currentMatch, 1);
            });
        });
        test('Reset when match not found, #127198', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = disposables.add(new findState_1.FindReplaceState());
                const model = disposables.add(new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService)));
                const found = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                assert.strictEqual(model.findMatches.length, 2);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                assert.strictEqual(editor.textModel.length, 3);
                const found2 = new Promise(resolve => disposables.add(state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                })));
                state.change({ searchString: '3' }, true);
                await found2;
                assert.strictEqual(model.currentMatch, -1);
                assert.strictEqual(model.findMatches.length, 0);
            });
        });
        test('CellFindMatchModel', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['print(1)', 'typescript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (editor) => {
                const mdCell = editor.cellAt(0);
                const mdModel = new findModel_1.CellFindMatchModel(mdCell, 0, [], []);
                assert.strictEqual(mdModel.length, 0);
                mdModel.contentMatches.push(new model_1.FindMatch(new range_1.Range(1, 1, 1, 2), []));
                assert.strictEqual(mdModel.length, 1);
                mdModel.webviewMatches.push({
                    index: 0,
                    searchPreviewInfo: {
                        line: '',
                        range: {
                            start: 0,
                            end: 0,
                        }
                    }
                }, {
                    index: 1,
                    searchPreviewInfo: {
                        line: '',
                        range: {
                            start: 0,
                            end: 0,
                        }
                    }
                });
                assert.strictEqual(mdModel.length, 3);
                assert.strictEqual(mdModel.getMatch(0), mdModel.contentMatches[0]);
                assert.strictEqual(mdModel.getMatch(1), mdModel.webviewMatches[0]);
                assert.strictEqual(mdModel.getMatch(2), mdModel.webviewMatches[1]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY29udHJpYi9maW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzNCLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxNQUFNLGtCQUFrQixHQUE2QjtZQUNwRCxLQUFLLEVBQUUsa0NBQXFCO1NBQzVCLENBQUM7UUFDRixNQUFNLG9CQUFvQixHQUFHLElBQUksS0FBTSxTQUFRLG1EQUF3QjtZQUM3RCxPQUFPO2dCQUNmLE9BQU8sa0JBQWtCLENBQUM7WUFDM0IsQ0FBQztTQUNELEVBQUUsQ0FBQztRQUVKLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxNQUE2QixFQUFFLFNBQTRCLEVBQUUsRUFBRTtZQUMxRixNQUFNLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtnQkFDNUMsT0FBTyxRQUFRLENBQUM7b0JBQ2YsZ0JBQWdCLEVBQUUsQ0FBQyxjQUF1QyxFQUFFLGNBQTRDLEVBQUUsRUFBRTt3QkFDM0csTUFBTSxHQUFHLEdBQTRCLEVBQUUsQ0FBQzt3QkFDeEMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTs0QkFDNUIsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQzs0QkFDM0UsTUFBTSxXQUFXLEdBQUcsSUFBSSxFQUFFLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsV0FB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