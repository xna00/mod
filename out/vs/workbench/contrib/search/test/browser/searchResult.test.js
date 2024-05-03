define(["require", "exports", "assert", "sinon", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/search/browser/searchModel", "vs/base/common/uri", "vs/workbench/services/search/common/search", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/editor/common/core/range", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/common/services/model", "vs/workbench/contrib/search/browser/replace", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/uriIdentity/common/uriIdentityService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/label/common/label", "vs/workbench/services/label/test/common/mockLabelService", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/notebook/browser/services/notebookEditorServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/services/editor/common/editorService", "vs/base/test/common/utils"], function (require, exports, assert, sinon, instantiationServiceMock_1, searchModel_1, uri_1, search_1, telemetry_1, telemetryUtils_1, range_1, configuration_1, testConfigurationService_1, modelService_1, model_1, replace_1, themeService_1, testThemeService_1, uriIdentity_1, uriIdentityService_1, fileService_1, log_1, label_1, mockLabelService_1, notebookEditorService_1, editorGroupsService_1, workbenchTestServices_1, notebookEditorServiceImpl_1, notebookCommon_1, searchTestCommon_1, contextkey_1, mockKeybindingService_1, editorService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const lineOneRange = new search_1.OneLineRange(1, 0, 1);
    suite('SearchResult', () => {
        let instantiationService;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(model_1.IModelService, stubModelService(instantiationService));
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, stubNotebookEditorService(instantiationService));
            const fileService = new fileService_1.FileService(new log_1.NullLogService());
            store.add(fileService);
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            store.add(uriIdentityService);
            instantiationService.stub(uriIdentity_1.IUriIdentityService, uriIdentityService);
            instantiationService.stubPromise(replace_1.IReplaceService, {});
            instantiationService.stub(replace_1.IReplaceService, 'replace', () => Promise.resolve(null));
            instantiationService.stub(label_1.ILabelService, new mockLabelService_1.MockLabelService());
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('Line Match', function () {
            const fileMatch = aFileMatch('folder/file.txt', null);
            const lineMatch = new searchModel_1.Match(fileMatch, ['0 foo bar'], new search_1.OneLineRange(0, 2, 5), new search_1.OneLineRange(1, 0, 5), false);
            assert.strictEqual(lineMatch.text(), '0 foo bar');
            assert.strictEqual(lineMatch.range().startLineNumber, 2);
            assert.strictEqual(lineMatch.range().endLineNumber, 2);
            assert.strictEqual(lineMatch.range().startColumn, 1);
            assert.strictEqual(lineMatch.range().endColumn, 6);
            assert.strictEqual(lineMatch.id(), 'file:///folder/file.txt>[2,1 -> 2,6]foo');
            assert.strictEqual(lineMatch.fullMatchText(), 'foo');
            assert.strictEqual(lineMatch.fullMatchText(true), '0 foo bar');
        });
        test('Line Match - Remove', function () {
            const fileMatch = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo bar', new search_1.OneLineRange(1, 0, 3)));
            const lineMatch = fileMatch.matches()[0];
            fileMatch.remove(lineMatch);
            assert.strictEqual(fileMatch.matches().length, 0);
        });
        test('File Match', function () {
            let fileMatch = aFileMatch('folder/file.txt', aSearchResult());
            assert.strictEqual(fileMatch.matches().length, 0);
            assert.strictEqual(fileMatch.resource.toString(), 'file:///folder/file.txt');
            assert.strictEqual(fileMatch.name(), 'file.txt');
            fileMatch = aFileMatch('file.txt', aSearchResult());
            assert.strictEqual(fileMatch.matches().length, 0);
            assert.strictEqual(fileMatch.resource.toString(), 'file:///file.txt');
            assert.strictEqual(fileMatch.name(), 'file.txt');
        });
        test('File Match: Select an existing match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            assert.strictEqual(testObject.matches()[0], testObject.getSelectedMatch());
        });
        test('File Match: Select non existing match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            const target = testObject.matches()[0];
            testObject.remove(target);
            testObject.setSelectedMatch(target);
            assert.strictEqual(testObject.getSelectedMatch(), null);
        });
        test('File Match: isSelected return true for selected match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            const target = testObject.matches()[0];
            testObject.setSelectedMatch(target);
            assert.ok(testObject.isMatchSelected(target));
        });
        test('File Match: isSelected return false for un-selected match', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            assert.ok(!testObject.isMatchSelected(testObject.matches()[1]));
        });
        test('File Match: unselect', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(testObject.matches()[0]);
            testObject.setSelectedMatch(null);
            assert.strictEqual(null, testObject.getSelectedMatch());
        });
        test('File Match: unselect when not selected', function () {
            const testObject = aFileMatch('folder/file.txt', aSearchResult(), new search_1.TextSearchMatch('foo', new search_1.OneLineRange(1, 0, 3)), new search_1.TextSearchMatch('bar', new search_1.OneLineRange(1, 5, 3)));
            testObject.setSelectedMatch(null);
            assert.strictEqual(null, testObject.getSelectedMatch());
        });
        test('Match -> FileMatch -> SearchResult hierarchy exists', function () {
            const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(searchModel);
            const searchResult = instantiationService.createInstance(searchModel_1.SearchResult, searchModel);
            store.add(searchResult);
            const fileMatch = aFileMatch('far/boo', searchResult);
            const lineMatch = new searchModel_1.Match(fileMatch, ['foo bar'], new search_1.OneLineRange(0, 0, 3), new search_1.OneLineRange(1, 0, 3), false);
            assert(lineMatch.parent() === fileMatch);
            assert(fileMatch.parent() === searchResult.folderMatches()[0]);
        });
        test('Adding a raw match will add a file match with line matches', function () {
            const testObject = aSearchResult();
            const target = [aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)), new search_1.TextSearchMatch('preview 2', lineOneRange))];
            (0, searchTestCommon_1.addToSearchResult)(testObject, target);
            assert.strictEqual(3, testObject.count());
            const actual = testObject.matches();
            assert.strictEqual(1, actual.length);
            assert.strictEqual(uri_1.URI.file(`${(0, searchTestCommon_1.getRootName)()}/1`).toString(), actual[0].resource.toString());
            const actuaMatches = actual[0].matches();
            assert.strictEqual(3, actuaMatches.length);
            assert.strictEqual('preview 1', actuaMatches[0].text());
            assert.ok(new range_1.Range(2, 2, 2, 5).equalsRange(actuaMatches[0].range()));
            assert.strictEqual('preview 1', actuaMatches[1].text());
            assert.ok(new range_1.Range(2, 5, 2, 12).equalsRange(actuaMatches[1].range()));
            assert.strictEqual('preview 2', actuaMatches[2].text());
            assert.ok(new range_1.Range(2, 1, 2, 2).equalsRange(actuaMatches[2].range()));
        });
        test('Adding multiple raw matches', function () {
            const testObject = aSearchResult();
            const target = [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)), new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11))),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ];
            (0, searchTestCommon_1.addToSearchResult)(testObject, target);
            assert.strictEqual(3, testObject.count());
            const actual = testObject.matches();
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
        test('Test that notebook matches get added correctly', function () {
            const testObject = aSearchResult();
            const cell1 = { cellKind: notebookCommon_1.CellKind.Code };
            const cell2 = { cellKind: notebookCommon_1.CellKind.Code };
            sinon.stub(searchModel_1.CellMatch.prototype, 'addContext');
            const addFileMatch = sinon.spy(searchModel_1.FolderMatch.prototype, "addFileMatch");
            const fileMatch1 = aRawFileMatchWithCells('/1', {
                cell: cell1,
                index: 0,
                contentResults: [
                    new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)),
                ],
                webviewResults: [
                    new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)),
                    new search_1.TextSearchMatch('preview 2', lineOneRange)
                ]
            });
            const fileMatch2 = aRawFileMatchWithCells('/2', {
                cell: cell2,
                index: 0,
                contentResults: [
                    new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 1, 4)),
                ],
                webviewResults: [
                    new search_1.TextSearchMatch('preview 1', new search_1.OneLineRange(1, 4, 11)),
                    new search_1.TextSearchMatch('preview 2', lineOneRange)
                ]
            });
            const target = [fileMatch1, fileMatch2];
            (0, searchTestCommon_1.addToSearchResult)(testObject, target);
            assert.strictEqual(6, testObject.count());
            assert.deepStrictEqual(fileMatch1.cellResults[0].contentResults, addFileMatch.getCall(0).args[0][0].cellResults[0].contentResults);
            assert.deepStrictEqual(fileMatch1.cellResults[0].webviewResults, addFileMatch.getCall(0).args[0][0].cellResults[0].webviewResults);
            assert.deepStrictEqual(fileMatch2.cellResults[0].contentResults, addFileMatch.getCall(0).args[0][1].cellResults[0].contentResults);
            assert.deepStrictEqual(fileMatch2.cellResults[0].webviewResults, addFileMatch.getCall(0).args[0][1].cellResults[0].webviewResults);
        });
        test('Dispose disposes matches', function () {
            const target1 = sinon.spy();
            const target2 = sinon.spy();
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            store.add(testObject.matches()[0].onDispose(target1));
            store.add(testObject.matches()[1].onDispose(target2));
            testObject.dispose();
            assert.ok(testObject.isEmpty());
            assert.ok(target1.calledOnce);
            assert.ok(target2.calledOnce);
        });
        test('remove triggers change event', function () {
            const target = sinon.spy();
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            const objectToRemove = testObject.matches()[0];
            store.add(testObject.onChange(target));
            testObject.remove(objectToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: [objectToRemove], removed: true }], target.args[0]);
        });
        test('remove array triggers change event', function () {
            const target = sinon.spy();
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            const arrayToRemove = testObject.matches();
            store.add(testObject.onChange(target));
            testObject.remove(arrayToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: arrayToRemove, removed: true }], target.args[0]);
        });
        test('Removing all line matches and adding back will add file back to result', function () {
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            const target = testObject.matches()[0];
            const matchToRemove = target.matches()[0];
            target.remove(matchToRemove);
            assert.ok(testObject.isEmpty());
            target.add(matchToRemove, true);
            assert.strictEqual(1, testObject.fileCount());
            assert.strictEqual(target, testObject.matches()[0]);
        });
        test('replace should remove the file match', function () {
            const voidPromise = Promise.resolve(null);
            instantiationService.stub(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            testObject.replace(testObject.matches()[0]);
            return voidPromise.then(() => assert.ok(testObject.isEmpty()));
        });
        test('replace should trigger the change event', function () {
            const target = sinon.spy();
            const voidPromise = Promise.resolve(null);
            instantiationService.stub(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange))
            ]);
            store.add(testObject.onChange(target));
            const objectToRemove = testObject.matches()[0];
            testObject.replace(objectToRemove);
            return voidPromise.then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual([{ elements: [objectToRemove], removed: true }], target.args[0]);
            });
        });
        test('replaceAll should remove all file matches', function () {
            const voidPromise = Promise.resolve(null);
            instantiationService.stubPromise(replace_1.IReplaceService, 'replace', voidPromise);
            const testObject = aSearchResult();
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/1', new search_1.TextSearchMatch('preview 1', lineOneRange)),
                aRawMatch('/2', new search_1.TextSearchMatch('preview 2', lineOneRange))
            ]);
            testObject.replaceAll(null);
            return voidPromise.then(() => assert.ok(testObject.isEmpty()));
        });
        test('batchRemove should trigger the onChange event correctly', function () {
            const target = sinon.spy();
            const testObject = getPopulatedSearchResult();
            const folderMatch = testObject.folderMatches()[0];
            const fileMatch = testObject.folderMatches()[1].allDownstreamFileMatches()[0];
            const match = testObject.folderMatches()[1].allDownstreamFileMatches()[1].matches()[0];
            const arrayToRemove = [folderMatch, fileMatch, match];
            const expectedArrayResult = folderMatch.allDownstreamFileMatches().concat([fileMatch, match.parent()]);
            store.add(testObject.onChange(target));
            testObject.batchRemove(arrayToRemove);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: expectedArrayResult, removed: true, added: false }], target.args[0]);
        });
        test('batchReplace should trigger the onChange event correctly', async function () {
            const replaceSpy = sinon.spy();
            instantiationService.stub(replace_1.IReplaceService, 'replace', (arg) => {
                if (Array.isArray(arg)) {
                    replaceSpy(arg[0]);
                }
                else {
                    replaceSpy(arg);
                }
                return Promise.resolve();
            });
            const target = sinon.spy();
            const testObject = getPopulatedSearchResult();
            const folderMatch = testObject.folderMatches()[0];
            const fileMatch = testObject.folderMatches()[1].allDownstreamFileMatches()[0];
            const match = testObject.folderMatches()[1].allDownstreamFileMatches()[1].matches()[0];
            const firstExpectedMatch = folderMatch.allDownstreamFileMatches()[0];
            const arrayToRemove = [folderMatch, fileMatch, match];
            store.add(testObject.onChange(target));
            await testObject.batchReplace(arrayToRemove);
            assert.ok(target.calledOnce);
            sinon.assert.calledThrice(replaceSpy);
            sinon.assert.calledWith(replaceSpy.firstCall, firstExpectedMatch);
            sinon.assert.calledWith(replaceSpy.secondCall, fileMatch);
            sinon.assert.calledWith(replaceSpy.thirdCall, match);
        });
        test('Creating a model with nested folders should create the correct structure', function () {
            const testObject = getPopulatedSearchResultForTreeTesting();
            const root0 = testObject.folderMatches()[0];
            const root1 = testObject.folderMatches()[1];
            const root2 = testObject.folderMatches()[2];
            const root3 = testObject.folderMatches()[3];
            const root0DownstreamFiles = root0.allDownstreamFileMatches();
            assert.deepStrictEqual(root0DownstreamFiles, [...root0.fileMatchesIterator(), ...getFolderMatchAtIndex(root0, 0).fileMatchesIterator()]);
            assert.deepStrictEqual(getFolderMatchAtIndex(root0, 0).allDownstreamFileMatches(), Array.from(getFolderMatchAtIndex(root0, 0).fileMatchesIterator()));
            assert.deepStrictEqual(getFileMatchAtIndex(getFolderMatchAtIndex(root0, 0), 0).parent(), getFolderMatchAtIndex(root0, 0));
            assert.deepStrictEqual(getFolderMatchAtIndex(root0, 0).parent(), root0);
            assert.deepStrictEqual(getFolderMatchAtIndex(root0, 0).closestRoot, root0);
            root0DownstreamFiles.forEach((e) => {
                assert.deepStrictEqual(e.closestRoot, root0);
            });
            const root1DownstreamFiles = root1.allDownstreamFileMatches();
            assert.deepStrictEqual(root1.allDownstreamFileMatches(), [...root1.fileMatchesIterator(), ...getFolderMatchAtIndex(root1, 0).fileMatchesIterator()]); // excludes the matches from nested root
            assert.deepStrictEqual(getFileMatchAtIndex(getFolderMatchAtIndex(root1, 0), 0).parent(), getFolderMatchAtIndex(root1, 0));
            root1DownstreamFiles.forEach((e) => {
                assert.deepStrictEqual(e.closestRoot, root1);
            });
            const root2DownstreamFiles = root2.allDownstreamFileMatches();
            assert.deepStrictEqual(root2DownstreamFiles, Array.from(root2.fileMatchesIterator()));
            assert.deepStrictEqual(getFileMatchAtIndex(root2, 0).parent(), root2);
            assert.deepStrictEqual(getFileMatchAtIndex(root2, 0).closestRoot, root2);
            const root3DownstreamFiles = root3.allDownstreamFileMatches();
            const root3Level3Folder = getFolderMatchAtIndex(getFolderMatchAtIndex(root3, 0), 0);
            assert.deepStrictEqual(root3DownstreamFiles, [...root3.fileMatchesIterator(), ...getFolderMatchAtIndex(root3Level3Folder, 0).fileMatchesIterator(), ...getFolderMatchAtIndex(root3Level3Folder, 1).fileMatchesIterator()].flat());
            assert.deepStrictEqual(root3Level3Folder.allDownstreamFileMatches(), getFolderMatchAtIndex(root3, 0).allDownstreamFileMatches());
            assert.deepStrictEqual(getFileMatchAtIndex(getFolderMatchAtIndex(root3Level3Folder, 1), 0).parent(), getFolderMatchAtIndex(root3Level3Folder, 1));
            assert.deepStrictEqual(getFolderMatchAtIndex(root3Level3Folder, 1).parent(), root3Level3Folder);
            assert.deepStrictEqual(root3Level3Folder.parent(), getFolderMatchAtIndex(root3, 0));
            root3DownstreamFiles.forEach((e) => {
                assert.deepStrictEqual(e.closestRoot, root3);
            });
        });
        test('Removing an intermediate folder should call OnChange() on all downstream file matches', function () {
            const target = sinon.spy();
            const testObject = getPopulatedSearchResultForTreeTesting();
            const folderMatch = getFolderMatchAtIndex(getFolderMatchAtIndex(getFolderMatchAtIndex(testObject.folderMatches()[3], 0), 0), 0);
            const expectedArrayResult = folderMatch.allDownstreamFileMatches();
            store.add(testObject.onChange(target));
            testObject.remove(folderMatch);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual([{ elements: expectedArrayResult, removed: true, added: false, clearingAll: false }], target.args[0]);
        });
        test('Replacing an intermediate folder should remove all downstream folders and file matches', async function () {
            const target = sinon.spy();
            const testObject = getPopulatedSearchResultForTreeTesting();
            const folderMatch = getFolderMatchAtIndex(testObject.folderMatches()[3], 0);
            const expectedArrayResult = folderMatch.allDownstreamFileMatches();
            store.add(testObject.onChange(target));
            await testObject.batchReplace([folderMatch]);
            assert.deepStrictEqual([{ elements: expectedArrayResult, removed: true, added: false }], target.args[0]);
        });
        function aFileMatch(path, searchResult, ...lineMatches) {
            if (!searchResult) {
                searchResult = aSearchResult();
            }
            const rawMatch = {
                resource: uri_1.URI.file('/' + path),
                results: lineMatches
            };
            const root = searchResult?.folderMatches()[0];
            const fileMatch = instantiationService.createInstance(searchModel_1.FileMatch, {
                pattern: ''
            }, undefined, undefined, root, rawMatch, null, '');
            fileMatch.createMatches(false);
            store.add(fileMatch);
            return fileMatch;
        }
        function aSearchResult() {
            const searchModel = instantiationService.createInstance(searchModel_1.SearchModel);
            store.add(searchModel);
            searchModel.searchResult.query = {
                type: 2 /* QueryType.Text */, folderQueries: [{ folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)() }], contentPattern: {
                    pattern: ''
                }
            };
            return searchModel.searchResult;
        }
        function aRawMatch(resource, ...results) {
            return { resource: (0, searchTestCommon_1.createFileUriFromPathFromRoot)(resource), results };
        }
        function aRawFileMatchWithCells(resource, ...cellMatches) {
            return {
                resource: (0, searchTestCommon_1.createFileUriFromPathFromRoot)(resource),
                cellResults: cellMatches
            };
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
        function getPopulatedSearchResult() {
            const testObject = aSearchResult();
            testObject.query = {
                type: 2 /* QueryType.Text */,
                contentPattern: { pattern: 'foo' },
                folderQueries: [{
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/voo')
                    },
                    { folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/with') },
                ]
            };
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/voo/foo.a', new search_1.TextSearchMatch('preview 1', lineOneRange), new search_1.TextSearchMatch('preview 2', lineOneRange)),
                aRawMatch('/with/path/bar.b', new search_1.TextSearchMatch('preview 3', lineOneRange)),
                aRawMatch('/with/path.c', new search_1.TextSearchMatch('preview 4', lineOneRange), new search_1.TextSearchMatch('preview 5', lineOneRange)),
            ]);
            return testObject;
        }
        function getPopulatedSearchResultForTreeTesting() {
            const testObject = aSearchResult();
            testObject.query = {
                type: 2 /* QueryType.Text */,
                contentPattern: { pattern: 'foo' },
                folderQueries: [{
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/voo')
                    },
                    {
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/with')
                    },
                    {
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/with/test')
                    },
                    {
                        folder: (0, searchTestCommon_1.createFileUriFromPathFromRoot)('/eep')
                    },
                ]
            };
            /***
             * file structure looks like:
             * *voo/
             * |- foo.a
             * |- beep
             *    |- foo.c
             * 	  |- boop.c
             * *with/
             * |- path
             *    |- bar.b
             * |- path.c
             * |- *test/
             *    |- woo.c
             * eep/
             *    |- bar
             *       |- goo
             *           |- foo
             *              |- here.txt
             * 			 |- ooo
             *              |- there.txt
             *    |- eyy.y
             */
            (0, searchTestCommon_1.addToSearchResult)(testObject, [
                aRawMatch('/voo/foo.a', new search_1.TextSearchMatch('preview 1', lineOneRange), new search_1.TextSearchMatch('preview 2', lineOneRange)),
                aRawMatch('/voo/beep/foo.c', new search_1.TextSearchMatch('preview 1', lineOneRange), new search_1.TextSearchMatch('preview 2', lineOneRange)),
                aRawMatch('/voo/beep/boop.c', new search_1.TextSearchMatch('preview 3', lineOneRange)),
                aRawMatch('/with/path.c', new search_1.TextSearchMatch('preview 4', lineOneRange), new search_1.TextSearchMatch('preview 5', lineOneRange)),
                aRawMatch('/with/path/bar.b', new search_1.TextSearchMatch('preview 3', lineOneRange)),
                aRawMatch('/with/test/woo.c', new search_1.TextSearchMatch('preview 3', lineOneRange)),
                aRawMatch('/eep/bar/goo/foo/here.txt', new search_1.TextSearchMatch('preview 6', lineOneRange), new search_1.TextSearchMatch('preview 7', lineOneRange)),
                aRawMatch('/eep/bar/goo/ooo/there.txt', new search_1.TextSearchMatch('preview 6', lineOneRange), new search_1.TextSearchMatch('preview 7', lineOneRange)),
                aRawMatch('/eep/eyy.y', new search_1.TextSearchMatch('preview 6', lineOneRange), new search_1.TextSearchMatch('preview 7', lineOneRange))
            ]);
            return testObject;
        }
        function getFolderMatchAtIndex(parent, index) {
            return Array.from(parent.folderMatchesIterator())[index];
        }
        function getFileMatchAtIndex(parent, index) {
            return Array.from(parent.fileMatchesIterator())[index];
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoUmVzdWx0LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3NlYXJjaC90ZXN0L2Jyb3dzZXIvc2VhcmNoUmVzdWx0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBdUNBLE1BQU0sWUFBWSxHQUFHLElBQUkscUJBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRS9DLEtBQUssQ0FBQyxjQUFjLEVBQUUsR0FBRyxFQUFFO1FBRTFCLElBQUksb0JBQThDLENBQUM7UUFDbkQsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRXhELEtBQUssQ0FBQyxHQUFHLEVBQUU7WUFDVixvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7WUFDdEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLDZCQUFpQixFQUFFLHFDQUFvQixDQUFDLENBQUM7WUFDbkUsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFhLEVBQUUsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBc0IsRUFBRSx5QkFBeUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDbkcsTUFBTSxXQUFXLEdBQUcsSUFBSSx5QkFBVyxDQUFDLElBQUksb0JBQWMsRUFBRSxDQUFDLENBQUM7WUFDMUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN2QixNQUFNLGtCQUFrQixHQUFHLElBQUksdUNBQWtCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzlCLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQ0FBbUIsRUFB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RUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0RSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN4RCxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXZFLFlBQVksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0RBQWdELEVBQUU7WUFDdEQsTUFBTSxVQUFVLEdBQUcsYUFBYSxFQUFFLENBQUM7WUFDbkMsTUFBTSxLQUFLLEdBQUcsRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQW9CLENBQUM7WUFDNUQsTUFBTSxLQUFLLEdBQUcsRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxJQUFJLEVBQW9CLENBQUM7WUFFNUQsS0FBSyxDQUFDLElBQUksQ0FBQyx1QkFBUyxDQUFDLFNB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