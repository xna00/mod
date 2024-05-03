/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/services/model", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/workbench/contrib/search/browser/searchActionsRemoveReplace", "vs/workbench/contrib/search/browser/searchModel", "vs/workbench/contrib/search/test/browser/mockSearchTree", "vs/platform/label/common/label", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/search/test/browser/searchTestCommon", "vs/base/test/common/utils"], function (require, exports, assert, platform_1, uri_1, model_1, instantiationServiceMock_1, keybinding_1, usLayoutResolvedKeybinding_1, searchActionsRemoveReplace_1, searchModel_1, mockSearchTree_1, label_1, notebookEditorService_1, searchTestCommon_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Search Actions', () => {
        let instantiationService;
        let counter;
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(model_1.IModelService, (0, searchTestCommon_1.stubModelService)(instantiationService, (e) => store.add(e)));
            instantiationService.stub(notebookEditorService_1.INotebookEditorService, (0, searchTestCommon_1.stubNotebookEditorService)(instantiationService, (e) => store.add(e)));
            instantiationService.stub(keybinding_1.IKeybindingService, {});
            instantiationService.stub(label_1.ILabelService, { getUriBasenameLabel: (uri) => '' });
            instantiationService.stub(keybinding_1.IKeybindingService, 'resolveKeybinding', (keybinding) => usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveKeybinding(keybinding, platform_1.OS));
            instantiationService.stub(keybinding_1.IKeybindingService, 'lookupKeybinding', (id) => null);
            instantiationService.stub(keybinding_1.IKeybindingService, 'lookupKeybinding', (id) => null);
            counter = 0;
        });
        teardown(() => {
            instantiationService.dispose();
        });
        test('get next element to focus after removing a match when it has next sibling file', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), aMatch(fileMatch2)];
            const tree = aTree(data);
            const target = data[2];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, [target]);
            assert.strictEqual(data[4], actual);
        });
        test('get next element to focus after removing a match when it is the only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[1];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, [target]);
            assert.strictEqual(undefined, actual);
        });
        test('get next element to focus after removing a file match when it has next sibling', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const target = data[2];
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, []);
            assert.strictEqual(data[4], actual);
        });
        test('Find last FileMatch in Tree', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const actual = (0, searchActionsRemoveReplace_1.getLastNodeFromSameType)(tree, fileMatch1);
            assert.strictEqual(fileMatch3, actual);
        });
        test('Find last Match in Tree', function () {
            const fileMatch1 = aFileMatch();
            const fileMatch2 = aFileMatch();
            const fileMatch3 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1), fileMatch2, aMatch(fileMatch2), fileMatch3, aMatch(fileMatch3)];
            const tree = aTree(data);
            const actual = (0, searchActionsRemoveReplace_1.getLastNodeFromSameType)(tree, aMatch(fileMatch1));
            assert.strictEqual(data[5], actual);
        });
        test('get next element to focus after removing a file match when it is only match', function () {
            const fileMatch1 = aFileMatch();
            const data = [fileMatch1, aMatch(fileMatch1)];
            const tree = aTree(data);
            const target = data[0];
            // const testObject: ReplaceAction = instantiationService.createInstance(ReplaceAction, tree, target, null);
            const actual = (0, searchActionsRemoveReplace_1.getElementToFocusAfterRemoved)(tree, target, []);
            assert.strictEqual(undefined, actual);
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
            store.add(folderMatch);
            const fileMatch = instantiationService.createInstance(searchModel_1.FileMatch, {
                pattern: ''
            }, undefined, undefined, folderMatch, rawMatch, null, '');
            fileMatch.createMatches(false);
            store.add(fileMatch);
            return fileMatch;
        }
        function aMatch(fileMatch) {
            const line = ++counter;
            const match = new searchModel_1.Match(fileMatch, ['some match'], {
                startLineNumber: 0,
                startColumn: 0,
                endLineNumber: 0,
                endColumn: 2
            }, {
                startLineNumber: line,
                startColumn: 0,
                endLineNumber: line,
                endColumn: 2
            }, false);
            fileMatch.add(match);
            return match;
        }
        function aTree(elements) {
            return new mockSearchTree_1.MockObjectTree(elements);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoQWN0aW9ucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvdGVzdC9icm93c2VyL3NlYXJjaEFjdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQW1CaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksT0FBZSxDQUFDO1FBQ3BCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1Ysb0JBQW9CLEdBQUcsSUFBSSxtREFBd0IsRUFBRSxDQUFDO1lBQ3RELG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBYSxFQUFFLElBQUEsbUNBQWdCLEVBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RHLG9CQUFvQixDQUFDLElBQUksQ0FBQyw4Q0FBc0IsRUFBRSxJQUFBLDRDQUF5QixFQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4SCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsK0JBQWtCLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDbEQsb0JBQW9CLENBQUMsSUFBSSxDQUFDLHFCQUFhLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEdBQVEsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwRixvQkFBb0IsQ0FBQyxJQUFJLENBQUMsK0JBQWtCLEVBQUUsbUJB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