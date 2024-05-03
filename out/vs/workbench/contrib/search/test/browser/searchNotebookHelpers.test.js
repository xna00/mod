/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/model", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/search/browser/searchModel", "vs/base/common/uri", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/editor/common/services/model", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/base/test/common/utils"], function (require, exports, assert, range_1, model_1, notebookCommon_1, searchNotebookHelpers_1, findModel_1, searchModel_1, uri_1, instantiationServiceMock_1, searchTestCommon_1, model_2, notebookEditorService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('searchNotebookHelpers', () => {
        let instantiationService;
        let mdCellFindMatch;
        let codeCellFindMatch;
        let mdInputCell;
        let codeCell;
        let markdownContentResults;
        let codeContentResults;
        let codeWebviewResults;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let counter = 0;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            store.add(instantiationService);
            const modelService = (0, searchTestCommon_1.stubModelService)(instantiationService, (e) => store.add(e));
            const notebookEditorService = (0, searchTestCommon_1.stubNotebookEditorService)(instantiationService, (e) => store.add(e));
            instantiationService.stub(model_2.IModelService, modelService);
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, notebookEditorService);
            mdInputCell = {
                id: 'mdCell',
                cellKind: notebookCommon_1.CellKind.Markup, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return '# Hello World Test';
                        }
                        else {
                            return '';
                        }
                    }
                }
            };
            const findMatchMds = [new model_1.FindMatch(new range_1.Range(1, 15, 1, 19), ['Test'])];
            codeCell = {
                id: 'codeCell',
                cellKind: notebookCommon_1.CellKind.Code, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return 'print("test! testing!!")';
                        }
                        else if (lineNumber === 2) {
                            return 'print("this is a Test")';
                        }
                        else {
                            return '';
                        }
                    }
                }
            };
            const findMatchCodeCells = [new model_1.FindMatch(new range_1.Range(1, 8, 1, 12), ['test']),
                new model_1.FindMatch(new range_1.Range(1, 14, 1, 18), ['test']),
                new model_1.FindMatch(new range_1.Range(2, 18, 2, 22), ['Test'])
            ];
            const webviewMatches = [{
                    index: 0,
                    searchPreviewInfo: {
                        line: 'test! testing!!',
                        range: {
                            start: 1,
                            end: 5
                        }
                    }
                },
                {
                    index: 1,
                    searchPreviewInfo: {
                        line: 'test! testing!!',
                        range: {
                            start: 7,
                            end: 11
                        }
                    }
                },
                {
                    index: 3,
                    searchPreviewInfo: {
                        line: 'this is a Test',
                        range: {
                            start: 11,
                            end: 15
                        }
                    }
                }
            ];
            mdCellFindMatch = new findModel_1.CellFindMatchModel(mdInputCell, 0, findMatchMds, []);
            codeCellFindMatch = new findModel_1.CellFindMatchModel(codeCell, 5, findMatchCodeCells, webviewMatches);
        });
        teardown(() => {
            instantiationService.dispose();
        });
        suite('notebookEditorMatchesToTextSearchResults', () => {
            function assertRangesEqual(actual, expected) {
                if (!Array.isArray(actual)) {
                    actual = [actual];
                }
                assert.strictEqual(actual.length, expected.length);
                actual.forEach((r, i) => {
                    const expectedRange = expected[i];
                    assert.deepStrictEqual({ startLineNumber: r.startLineNumber, startColumn: r.startColumn, endLineNumber: r.endLineNumber, endColumn: r.endColumn }, { startLineNumber: expectedRange.startLineNumber, startColumn: expectedRange.startColumn, endLineNumber: expectedRange.endLineNumber, endColumn: expectedRange.endColumn });
                });
            }
            test('convert CellFindMatchModel to ITextSearchMatch and check results', () => {
                markdownContentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(mdCellFindMatch.contentMatches, mdInputCell);
                codeContentResults = (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(codeCellFindMatch.contentMatches, codeCell);
                codeWebviewResults = (0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(codeCellFindMatch.webviewMatches);
                assert.strictEqual(markdownContentResults.length, 1);
                assert.strictEqual(markdownContentResults[0].preview.text, '# Hello World Test\n');
                assertRangesEqual(markdownContentResults[0].preview.matches, [new range_1.Range(0, 14, 0, 18)]);
                assertRangesEqual(markdownContentResults[0].ranges, [new range_1.Range(0, 14, 0, 18)]);
                assert.strictEqual(codeContentResults.length, 2);
                assert.strictEqual(codeContentResults[0].preview.text, 'print("test! testing!!")\n');
                assert.strictEqual(codeContentResults[1].preview.text, 'print("this is a Test")\n');
                assertRangesEqual(codeContentResults[0].preview.matches, [new range_1.Range(0, 7, 0, 11), new range_1.Range(0, 13, 0, 17)]);
                assertRangesEqual(codeContentResults[0].ranges, [new range_1.Range(0, 7, 0, 11), new range_1.Range(0, 13, 0, 17)]);
                assert.strictEqual(codeWebviewResults.length, 3);
                assert.strictEqual(codeWebviewResults[0].preview.text, 'test! testing!!');
                assert.strictEqual(codeWebviewResults[1].preview.text, 'test! testing!!');
                assert.strictEqual(codeWebviewResults[2].preview.text, 'this is a Test');
                assertRangesEqual(codeWebviewResults[0].preview.matches, [new range_1.Range(0, 1, 0, 5)]);
                assertRangesEqual(codeWebviewResults[1].preview.matches, [new range_1.Range(0, 7, 0, 11)]);
                assertRangesEqual(codeWebviewResults[2].preview.matches, [new range_1.Range(0, 11, 0, 15)]);
                assertRangesEqual(codeWebviewResults[0].ranges, [new range_1.Range(0, 1, 0, 5)]);
                assertRangesEqual(codeWebviewResults[1].ranges, [new range_1.Range(0, 7, 0, 11)]);
                assertRangesEqual(codeWebviewResults[2].ranges, [new range_1.Range(0, 11, 0, 15)]);
            });
            test('convert ITextSearchMatch to MatchInNotebook', () => {
                const mdCellMatch = new searchModel_1.CellMatch(aFileMatch(), mdInputCell, 0);
                const markdownCellContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(markdownContentResults, mdCellMatch);
                const codeCellMatch = new searchModel_1.CellMatch(aFileMatch(), codeCell, 0);
                const codeCellContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(codeContentResults, codeCellMatch);
                const codeWebviewContentMatchObjs = (0, searchModel_1.textSearchMatchesToNotebookMatches)(codeWebviewResults, codeCellMatch);
                assert.strictEqual(markdownCellContentMatchObjs[0].cell?.id, mdCellMatch.id);
                assertRangesEqual(markdownCellContentMatchObjs[0].range(), [new range_1.Range(1, 15, 1, 19)]);
                assert.strictEqual(codeCellContentMatchObjs[0].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeCellContentMatchObjs[1].cell?.id, codeCellMatch.id);
                assertRangesEqual(codeCellContentMatchObjs[0].range(), [new range_1.Range(1, 8, 1, 12)]);
                assertRangesEqual(codeCellContentMatchObjs[1].range(), [new range_1.Range(1, 14, 1, 18)]);
                assertRangesEqual(codeCellContentMatchObjs[2].range(), [new range_1.Range(2, 18, 2, 22)]);
                assert.strictEqual(codeWebviewContentMatchObjs[0].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeWebviewContentMatchObjs[1].cell?.id, codeCellMatch.id);
                assert.strictEqual(codeWebviewContentMatchObjs[2].cell?.id, codeCellMatch.id);
                assertRangesEqual(codeWebviewContentMatchObjs[0].range(), [new range_1.Range(1, 2, 1, 6)]);
                assertRangesEqual(codeWebviewContentMatchObjs[1].range(), [new range_1.Range(1, 8, 1, 12)]);
                assertRangesEqual(codeWebviewContentMatchObjs[2].range(), [new range_1.Range(1, 12, 1, 16)]);
            });
            function aFileMatch() {
                const rawMatch = {
                    resource: uri_1.URI.file('somepath' + ++counter),
                    results: []
                };
                const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
                store.add(searchModel);
                const folderMatch = instantiationService.createInstance(searchModel_1.FolderMatch, uri_1.URI.file('somepath'), '', 0, {
                    type: 2 /* QueryType.Text */, folderQueries: [{ folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }], contentPattern: {
                        pattern: ''
                    }
                }, searchModel.searchResult, searchModel.searchResult, null);
                const fileMatch = instantiationService.createInstance(searchModel_1.FileMatch, {
                    pattern: ''
                }, undefined, undefined, folderMatch, rawMatch, null, '');
                fileMatch.createMatches(false);
                store.add(folderMatch);
                store.add(fileMatch);
                return fileMatch;
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTm90ZWJvb2tIZWxwZXJzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC90ZXN0L2Jyb3dzZXIvc2VhcmNoTm90ZWJvb2tIZWxwZXJzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFrQmhHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDbkMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGVBQW1DLENBQUM7UUFDeEMsSUFBSSxpQkFBcUMsQ0FBQztRQUMxQyxJQUFJLFdBQTJCLENBQUM7UUFDaEMsSUFBSSxRQUF3QixDQUFDO1FBRTdCLElBQUksc0JBQTBDLENBQUM7UUFDL0MsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxJQUFJLGtCQUFzQyxDQUFDO1FBQzNDLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUN4RCxJQUFJLE9BQU8sR0FBVyxDQUFDLENBQUM7UUFDeEIsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUVWLG9CQUFvQixHQUFHLElBQUksbURBQXdCLEVBQUUsQ0FBQztZQUN0RCxLQUFLLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDaEMsTUFBTSxZQUFZLEdBQUcsSUFBQSxtQ0FBZ0IsRUFBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0scUJBQXFCLEdBQUcsSUFBQSw0Q0FBeUIsRUFBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25HLG9CQUFvQixDQUFD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