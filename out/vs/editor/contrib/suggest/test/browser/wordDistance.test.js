/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/editorSimpleWorker", "vs/editor/browser/services/editorWorkerService", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/wordDistance", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/testTextModel", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/log/common/log", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/languages/language", "vs/base/test/common/utils"], function (require, exports, assert, event_1, lifecycle_1, uri_1, mock_1, wordHelper_1, languageConfigurationRegistry_1, editorSimpleWorker_1, editorWorkerService_1, suggest_1, wordDistance_1, testCodeEditor_1, testTextModel_1, testLanguageConfigurationService_1, log_1, languageFeaturesService_1, language_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('suggest, word distance', function () {
        let distance;
        const disposables = new lifecycle_1.DisposableStore();
        setup(async function () {
            const languageId = 'bracketMode';
            disposables.clear();
            const instantiationService = (0, testCodeEditor_1.createCodeEditorServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'function abc(aa, ab){\na\n}', languageId, undefined, uri_1.URI.parse('test:///some.path')));
            const editor = disposables.add((0, testCodeEditor_1.instantiateTestCodeEditor)(instantiationService, model));
            editor.updateOptions({ suggest: { localityBonus: true } });
            editor.setPosition({ lineNumber: 2, column: 2 });
            const modelService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onModelRemoved = event_1.Event.None;
                }
                getModel(uri) {
                    return uri.toString() === model.uri.toString() ? model : null;
                }
            };
            const service = new class extends editorWorkerService_1.EditorWorkerService {
                constructor() {
                    super(modelService, new class extends (0, mock_1.mock)() {
                    }, new log_1.NullLogService(), new testLanguageConfigurationService_1.TestLanguageConfigurationService(), new languageFeaturesService_1.LanguageFeaturesService());
                    this._worker = new editorSimpleWorker_1.EditorSimpleWorker(new class extends (0, mock_1.mock)() {
                    }, null);
                    this._worker.acceptNewModel({
                        url: model.uri.toString(),
                        lines: model.getLinesContent(),
                        EOL: model.getEOL(),
                        versionId: model.getVersionId()
                    });
                    model.onDidChangeContent(e => this._worker.acceptModelChanged(model.uri.toString(), e));
                }
                computeWordRanges(resource, range) {
                    return this._worker.computeWordRanges(resource.toString(), range, wordHelper_1.DEFAULT_WORD_REGEXP.source, wordHelper_1.DEFAULT_WORD_REGEXP.flags);
                }
            };
            distance = await wordDistance_1.WordDistance.create(service, editor);
            disposables.add(service);
        });
        teardown(function () {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createSuggestItem(label, overwriteBefore, position) {
            const suggestion = {
                label,
                range: { startLineNumber: position.lineNumber, startColumn: position.column - overwriteBefore, endLineNumber: position.lineNumber, endColumn: position.column },
                insertText: label,
                kind: 0
            };
            const container = {
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
        test('Suggest locality bonus can boost current word #90515', function () {
            const pos = { lineNumber: 2, column: 2 };
            const d1 = distance.distance(pos, createSuggestItem('a', 1, pos).completion);
            const d2 = distance.distance(pos, createSuggestItem('aa', 1, pos).completion);
            const d3 = distance.distance(pos, createSuggestItem('ab', 1, pos).completion);
            assert.ok(d1 > d2);
            assert.ok(d2 === d3);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZERpc3RhbmNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3N1Z2dlc3QvdGVzdC9icm93c2VyL3dvcmREaXN0YW5jZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBMkJoRyxLQUFLLENBQUMsd0JBQXdCLEVBQUU7UUFFL0IsSUFBSSxRQUFzQixDQUFDO1FBQzNCLE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxLQUFLO1lBQ1YsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDO1lBRWpDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixNQUFNLG9CQUFvQixHQUFHLElBQUEseUNBQXdCLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDbkUsTUFBTSw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsNkRBQTZCLENBQUMsQ0FBQztZQUM3RixNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUNuRSxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFO2dCQUNqRSxRQUFRLEVBQUU7b0JBQ1QsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7aUJBQ1Y7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENB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