define(["require", "exports", "assert", "sinon", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/contrib/search/browser/searchModel", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/label/common/label", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/workbench/contrib/search/browser/notebookSearch/searchNotebookHelpers", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/editor/common/model", "vs/base/common/map", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/search/common/notebookSearch", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/services/editor/common/editorService", "vs/base/test/common/utils"], function (require, exports, assert, sinon, arrays, async_1, cancellation_1, uri_1, range_1, model_1, modelService_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, search_1, telemetry_1, telemetryUtils_1, searchModel_1, themeService_1, testThemeService_1, fileService_1, log_1, uriIdentity_1, uriIdentityService_1, label_1, notebookEditorService_1, editorGroupsService_1, workbenchTestServices_1, notebookEditorServiceImpl_1, searchTestCommon_1, searchNotebookHelpers_1, notebookCommon_1, model_2, map_1, notebookService_1, notebookSearch_1, contextkey_1, mockKeybindingService_1, editorService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const nullEvent = new class {
        constructor() {
            this.id = -1;
        }
        stop() {
            return;
        }
        timeTaken() {
            return -1;
        }
    };
    const lineOneRange = new search_1.OneLineRange(1, 0, 1);
    suite('SearchModel', () => {
        let instantiationService;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const testSearchStats = {
            fromCache: false,
            resultCount: 1,
            type: 'searchProcess',
            detailStats: {
                fileWalkTime: 0,
                cmdTime: 0,
                cmdResultCount: 0,
                directoriesWalked: 2,
                filesWalked: 3
            }
        };
        const folderQueries = [
            { folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }
        ];
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(label_1.ILabelService, { getUriBasenameLabel: (uri) => '' });
            instantiationService.stub(notebookService_1.INotebookService, { getNotebookTextModels: () => [] });
            instantiationService.stub(model_1.IModelService, stubModelService(instantiationService));
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, stubNotebookEditorService(instantiationService));
            instantiationService.stub(search_1.ISearchService, {});
            instantiationService.stub(search_1.ISearchService, 'textSearch', Promise.resolve({ results: [] }));
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            store.add(fileService);
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            store.add(uriIdentityService);
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        });
        teardown(() => sinon.restore());
        function searchServiceWithResults(results, complete = null) {
            return {
                textSearch(query, token, onProgress, notebookURIs) {
                    return new Promise(resolve => {
                        queueMicrotask(() => {
                            results.forEach(onProgress);
                            resolve(complete);
                        });
                    });
                },
                fileSearch(query, token) {
                    return new Promise(resolve => {
                        queueMicrotask(() => {
                            resolve({ results: results, messages: [] });
                        });
                    });
                },
                aiTextSearch(query, token, onProgress, notebookURIs) {
                    return new Promise(resolve => {
                        queueMicrotask(() => {
                            results.forEach(onProgress);
                            resolve(complete);
                        });
                    });
                },
                textSearchSplitSyncAsync(query, token, onProgress) {
                    return {
                        syncResults: {
                            results: [],
                            messages: []
                        },
                        asyncResults: new Promise(resolve => {
                            queueMicrotask(() => {
                                results.forEach(onProgress);
                                resolve(complete);
                            });
                        })
                    };
                }
            };
        }
        function searchServiceWithError(error) {
            return {
                textSearch(query, token, onProgress) {
                    return new Promise((resolve, reject) => {
                        reject(error);
                    });
                },
                fileSearch(query, token) {
                    return new Promise((resolve, reject) => {
                        queueMicrotask(() => {
                            reject(error);
                        });
                    });
                },
                aiTextSearch(query, token, onProgress, notebookURIs) {
                    return new Promise((resolve, reject) => {
                        reject(error);
                    });
                },
                textSearchSplitSyncAsync(query, token, onProgress) {
                    return {
                        syncResults: {
                            results: [],
                            messages: []
                        },
                        asyncResults: new Promise((resolve, reject) => {
                            reject(error);
                        })
                    };
                }
            };
        }
        function canceleableSearchService(tokenSource) {
            return {
                textSearch(query, token, onProgress) {
                    const disposable = token?.onCancellationRequested(() => tokenSource.cancel());
                    if (disposable) {
                        store.add(disposable);
                    }
                    return this.textSearchSplitSyncAsync(query, token, onProgress).asyncResults;
                },
                fileSearch(query, token) {
                    const disposable = token?.onCancellationRequested(() => tokenSource.cancel());
                    if (disposable) {
                        store.add(disposable);
                    }
                    return new Promise(resolve => {
                        queueMicrotask(() => {
                            resolve({});
                        });
                    });
                },
                aiTextSearch(query, token, onProgress, notebookURIs) {
                    const disposable = token?.onCancellationRequested(() => tokenSource.cancel());
                    if (disposable) {
                        store.add(disposable);
                    }
                    return Promise.resolve({
                        results: [],
                        messages: []
                    });
                },
                textSearchSplitSyncAsync(query, token, onProgress) {
                    const disposable = token?.onCancellationRequested(() => tokenSource.cancel());
                    if (disposable) {
                        store.add(disposable);
                    }
                    return {
                        syncResults: {
                            results: [],
                            messages: []
                        },
                        asyncResults: new Promise(resolve => {
                            queueMicrotask(() => {
                                resolve({
                                    results: [],
                                    messages: []
                                });
                            });
                        })
                    };
                }
            };
        }
        function searchServiceWithDeferredPromise(p) {
            return {
                textSearchSplitSyncAsync(query, token, onProgress) {
                    return {
                        syncResults: {
                            results: [],
                            messages: []
                        },
                        asyncResults: p,
                    };
                }
            };
        }
        function notebookSearchServiceWithInfo(results, tokenSource) {
            return {
                _serviceBrand: undefined,
                notebookSearch(query, token, searchInstanceID, onProgress) {
                    const disposable = token?.onCancellationRequested(() => tokenSource?.cancel());
                    if (disposable) {
                        store.add(disposable);
                    }
                    const localResults = new map_1.ResourceMap(uri => uri.path);
                    results.forEach(r => {
                        localResults.set(r.resource, r);
                    });
                    if (onProgress) {
                        arrays.coalesce([...localResults.values()]).forEach(onProgress);
                    }
                    return {
                        openFilesToScan: new map_1.ResourceSet([...localResults.keys()]),
                        completeData: Promise.resolve({
                            messages: [],
                            results: arrays.coalesce([...localResults.values()]),
                            limitHit: false
                        }),
                        allScannedFiles: Promise.resolve(new map_1.ResourceSet()),
                    };
                }
            };
        }
        test('Search Model: Search adds to results', async () => {
            const results = [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results, { limitHit: false, messages: [], results }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            const actual = testObject.searchResult.matches();
            assert.strictEqual(2, actual.length);
            assert.strictEqual(uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/1`).toString(), actual[0].resource.toString());
            let actuaMatches = actual[0].matches();
            assert.strictEqual(2, actuaMatches.length);
            assert.strictEqual('preview 1', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 2, 2, 5).equalsRange(actuaMatches[0].range()));
            assert.strictEqual('preview 1', actuaMatches[1].text());
            assert.ok(new range_1.Range(2, 5, 2, 12).equalsRange(actuaMatches[1].range()));
            actuaMatches = actual[1].matches();
            assert.strictEqual(1, actuaMatches.length);
            assert.strictEqual('preview 2', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 1, 2, 2).equalsRange(actuaMatches[0].range()));
        });
        test('Search Model: Search can return notebook results', async () => {
            const results = [
                aRawMatch('/2', new search_1.TextSearchMatch('test', new search_1.OneLineRange(1, 1, 5)), new search_1.TextSearchMatch('this is a test', new search_1.OneLineRange(1, 11, 15))),
                aRawMatch('/3', new search_1.TextSearchMatch('test', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results, { limitHit: false, messages: [], results }));
            sinon.stub(searchModel_1.CellMatch.prototype, 'addContext');
            const mdInputCell = {
                cellKind: notebookCommon_1.CellKind.Markup, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return '# Test';
                        }
                        else {
                            return '';
                        }
                    }
                },
                id: 'mdInputCell'
            };
            const findMatchMds = [new model_2.FindMatch(new range_1.Range(1, 3, 1, 7), ['Test'])];
            const codeCell = {
                cellKind: notebookCommon_1.CellKind.Code, textBuffer: {
                    getLineContent(lineNumber) {
                        if (lineNumber === 1) {
                            return 'print("test! testing!!")';
                        }
                        else {
                            return '';
                        }
                    }
                },
                id: 'codeCell'
            };
            const findMatchCodeCells = [new model_2.FindMatch(new range_1.Range(1, 8, 1, 12), ['test']),
                new model_2.FindMatch(new range_1.Range(1, 14, 1, 18), ['test']),
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
                }
            ];
            const cellMatchMd = {
                cell: mdInputCell,
                index: 0,
                contentResults: (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(findMatchMds, mdInputCell),
                webviewResults: []
            };
            const cellMatchCode = {
                cell: codeCell,
                index: 1,
                contentResults: (0, searchNotebookHelpers_1.contentMatchesToTextSearchMatches)(findMatchCodeCells, codeCell),
                webviewResults: (0, searchNotebookHelpers_1.webviewMatchesToTextSearchMatches)(webviewMatches),
            };
            const notebookSearchService = instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([aRawMatchWithCells('/1', cellMatchMd, cellMatchCode)], undefined));
            const notebookSearch = sinon.spy(notebookSearchService, "notebookSearch");
            const model = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(model);
            await model.search({ contentPattern: { pattern: 'test' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            const actual = model.searchResult.matches();
            assert(notebookSearch.calledOnce);
            assert.strictEqual(3, actual.length);
            assert.strictEqual(uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/1`).toString(), actual[0].resource.toString());
            const notebookFileMatches = actual[0].matches();
            assert.ok(notebookFileMatches[0].range().equalsRange(new range_1.Range(1, 3, 1, 7)));
            assert.ok(notebookFileMatches[1].range().equalsRange(new range_1.Range(1, 8, 1, 12)));
            assert.ok(notebookFileMatches[2].range().equalsRange(new range_1.Range(1, 14, 1, 18)));
            assert.ok(notebookFileMatches[3].range().equalsRange(new range_1.Range(1, 2, 1, 6)));
            assert.ok(notebookFileMatches[4].range().equalsRange(new range_1.Range(1, 8, 1, 12)));
            notebookFileMatches.forEach(match => match instanceof searchModel_1.MatchInNotebook);
            assert(notebookFileMatches[0].cell?.id === 'mdInputCell');
            assert(notebookFileMatches[1].cell?.id === 'codeCell');
            assert(notebookFileMatches[2].cell?.id === 'codeCell');
            assert(notebookFileMatches[3].cell?.id === 'codeCell');
            assert(notebookFileMatches[4].cell?.id === 'codeCell');
            const mdCellMatchProcessed = notebookFileMatches[0].cellParent;
            const codeCellMatchProcessed = notebookFileMatches[1].cellParent;
            assert(mdCellMatchProcessed.contentMatches.length === 1);
            assert(codeCellMatchProcessed.contentMatches.length === 2);
            assert(codeCellMatchProcessed.webviewMatches.length === 2);
            assert(mdCellMatchProcessed.contentMatches[0] === notebookFileMatches[0]);
            assert(codeCellMatchProcessed.contentMatches[0] === notebookFileMatches[1]);
            assert(codeCellMatchProcessed.contentMatches[1] === notebookFileMatches[2]);
            assert(codeCellMatchProcessed.webviewMatches[0] === notebookFileMatches[3]);
            assert(codeCellMatchProcessed.webviewMatches[1] === notebookFileMatches[4]);
            assert.strictEqual(uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/2`).toString(), actual[1].resource.toString());
            assert.strictEqual(uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/3`).toString(), actual[2].resource.toString());
        });
        test('Search Model: Search reports telemetry on search completed', async () => {
            const target = instantiationService.spy(telemetry_1.ITelemetryService, 'publicLog');
            const results = [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results, { limitHit: false, messages: [], results }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            assert.ok(target.calledThrice);
            assert.ok(target.calledWith('searchResultsFirstRender'));
            assert.ok(target.calledWith('searchResultsFinished'));
        });
        test('Search Model: Search reports timed telemetry on search when progress is not called', () => {
            const target2 = sinon.spy();
            sinon.stub(nullEvent, 'stop').callsFake(target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([], { limitHit: false, messages: [], results: [] }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            return result.then(() => {
                return (0, async_1.timeout)(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when progress is called', () => {
            const target2 = sinon.spy();
            sinon.stub(nullEvent, 'stop').callsFake(target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([aRawMatch('/1', new search_1.TextSearchMatch('some preview', lineOneRange))], { results: [], stats: testSearchStats, messages: [] }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            return result.then(() => {
                return (0, async_1.timeout)(1).then(() => {
                    // timeout because promise handlers may run in a different order. We only care that these
                    // are fired at some point.
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                    // assert.strictEqual(1, target2.callCount);
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when error is called', () => {
            const target2 = sinon.spy();
            sinon.stub(nullEvent, 'stop').callsFake(target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            instantiationService.stub(search_1.ISearchService, searchServiceWithError(new Error('This error should be thrown by this test.')));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            return result.then(() => { }, () => {
                return (0, async_1.timeout)(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                });
            });
        });
        test('Search Model: Search reports timed telemetry on search when error is cancelled error', () => {
            const target2 = sinon.spy();
            sinon.stub(nullEvent, 'stop').callsFake(target2);
            const target1 = sinon.stub().returns(nullEvent);
            instantiationService.stub(telemetry_1.ITelemetryService, 'publicLog', target1);
            const deferredPromise = new async_1.DeferredPromise();
            instantiationService.stub(search_1.ISearchService, searchServiceWithDeferredPromise(deferredPromise.p));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            const result = testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            deferredPromise.cancel();
            return result.then(() => { }, async () => {
                return (0, async_1.timeout)(1).then(() => {
                    assert.ok(target1.calledWith('searchResultsFirstRender'));
                    assert.ok(target1.calledWith('searchResultsFinished'));
                    // assert.ok(target2.calledOnce);
                });
            });
        });
        test('Search Model: Search results are cleared during search', async () => {
            const results = [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results, { limitHit: false, messages: [], results: [] }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            await testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            assert.ok(!testObject.searchResult.isEmpty());
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([]));
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries });
            assert.ok(testObject.searchResult.isEmpty());
        });
        test('Search Model: Previous search is cancelled when new search is called', async () => {
            const tokenSource = new cancellation_1.CancellationTokenSource();
            store.add(tokenSource);
            instantiationService.stub(search_1.ISearchService, canceleableSearchService(tokenSource));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], tokenSource));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries });
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults([]));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            testObject.search({ contentPattern: { pattern: 'somestring' }, type: 2 /* QueryType.Text */, folderQueries });
            assert.ok(tokenSource.token.isCancellationRequested);
        });
        test('getReplaceString returns proper replace string for regExpressions', async () => {
            const results = [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)))
            ];
            instantiationService.stub(search_1.ISearchService, searchServiceWithResults(results, { limitHit: false, messages: [], results }));
            instantiationService.stub(notebookSearch_1.INotebookSearchService, notebookSearchServiceWithInfo([], undefined));
            const testObject = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(testObject);
            await testObject.search({ contentPattern: { pattern: 're' }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            testObject.replaceString = 'hello';
            let match = testObject.searchResult.matches()[0].matches()[0];
            assert.strictEqual('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 're', isRegExp: true }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.strictEqual('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 're(?:vi)', isRegExp: true }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.strictEqual('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 'r(e)(?:vi)', isRegExp: true }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.strictEqual('hello', match.replaceString);
            await testObject.search({ contentPattern: { pattern: 'r(e)(?:vi)', isRegExp: true }, type: 2 /* QueryType.Text */, folderQueries }).asyncResults;
            testObject.replaceString = 'hello$1';
            match = testObject.searchResult.matches()[0].matches()[0];
            assert.strictEqual('helloe', match.replaceString);
        });
        function aRawMatch(resource, ...results) {
            return { resource: (0, searchTestCommon_1.createFileUriFromPathFromRoot)(resource), results };
        }
        function aRawMatchWithCells(resource, ...cells) {
            return { resource: (0, searchTestCommon_1.createFileUriFromPathFromRoot)(resource), cellResults: cells };
        }
        function stubModelService(instantiationService) {
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            const config = new testConfigurationService_1.TestConfigurationService();
            config.setUserConfiguration('search', { searchOnType: true });
            instantiationService.stub(configuration_1.IConfigurationService, config);
            const modelService = instantiationService.createInstance(modelService_1.ModelService);
            store.add(modelService);
            return modelService;
        }
        function stubNotebookEditorService(instantiationService) {
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(editorService_1.IEditorService, store.add(new workbenchTestServices_1.TestEditorService()));
            const notebookEditorWidgetService = instantiationService.createInstance(notebookEditorServiceImpl_1.NotebookEditorWidgetService);
            store.add(notebookEditorWidgetService);
            return notebookEditorWidgetService;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoTW9kZWwudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc2VhcmNoL3Rlc3QvYnJvd3Nlci9zZWFyY2hNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQTRDQSxNQUFNLFNBQVMsR0FBRyxJQUFJO1FBQUE7WUFDckIsT0FBRSxHQUFXLENBQUMsQ0FBQyxDQUFDO1FBZ0JqQixDQUFDO1FBUEEsSUFBSTtZQUNILE9BQU87UUFDUixDQUFDO1FBRUQsU0FBUztZQUNSLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDO0tBQ0QsQ0FBQztJQUVGLE1BQU0sWUFBWSxHQUFHLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRS9DLEtBQUssQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1FBRXpCLElBQUksb0JBQThDLENBQUM7UUFDbkQsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELE1BQU0sZUFBZSxHQUFxQjtZQUN6QyxTQUFTLEVBQUUsS0FBSztZQUNoQixXQUFXLEVBQUUsQ0FBQztZQUNkLElBQUksRUFBRSxlQUFlO1lBQ3JCLFdBQVcsRUFBRTtnQkFDWixZQUFZLEVBQUUsQ0FBQztnQkFDZixPQUFPLEVBQUUsQ0FBQztnQkFDVixjQUFjLEVBQUUsQ0FBQztnQkFDakIsaUJBQWlCLEVBQUUsQ0FBQztnQkFDcEIsV0FBVyxFQUFFLENBQUM7YUFDZDtTQUNELENBQUM7UUFFRixNQUFNLGFBQWEsR0FBbUI7WUFDckMsRUFBRSxNQUFNLEVBQUUsSUFBQSxnREFBNkIsR0FBRSxFQUFFO1NBQzNDLENBQUM7UUFFRixLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBSSxtREFBd0Is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