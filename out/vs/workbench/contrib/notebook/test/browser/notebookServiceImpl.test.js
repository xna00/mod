/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/services/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/services/editor/browser/editorResolverService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, event_1, uri_1, mock_1, utils_1, testConfigurationService_1, notebookServiceImpl_1, notebookProvider_1, editorResolverService_1, editorResolverService_2, extensions_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookProviderInfoStore', function () {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Can\'t open untitled notebooks in test #119363', function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const store = new notebookServiceImpl_1.NotebookProviderInfoStore(new class extends (0, mock_1.mock)() {
                get() { return ''; }
                store() { }
                getObject() { return {}; }
            }, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRegisterExtensions = event_1.Event.None;
                }
            }, disposables.add(instantiationService.createInstance(editorResolverService_1.EditorResolverService)), new testConfigurationService_1.TestConfigurationService(), new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidChangeScreenReaderOptimized = event_1.Event.None;
                }
            }, instantiationService, new class extends (0, mock_1.mock)() {
                hasProvider() { return true; }
            }, new class extends (0, mock_1.mock)() {
            }, new class extends (0, mock_1.mock)() {
            });
            disposables.add(store);
            const fooInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'foo',
                displayName: 'foo',
                selectors: [{ filenamePattern: '*.foo' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'foo',
            });
            const barInfo = new notebookProvider_1.NotebookProviderInfo({
                extension: extensions_1.nullExtensionDescription.identifier,
                id: 'bar',
                displayName: 'bar',
                selectors: [{ filenamePattern: '*.bar' }],
                priority: editorResolverService_2.RegisteredEditorPriority.default,
                exclusive: false,
                providerDisplayName: 'bar',
            });
            store.add(fooInfo);
            store.add(barInfo);
            assert.ok(store.get('foo'));
            assert.ok(store.get('bar'));
            assert.ok(!store.get('barfoo'));
            let providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.foo'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === fooInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('file:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///Untitled-1'));
            assert.strictEqual(providers.length, 2);
            assert.strictEqual(providers[0] === fooInfo, true);
            assert.strictEqual(providers[1] === barInfo, true);
            providers = store.getContributedNotebook(uri_1.URI.parse('untitled:///test/nb.bar'));
            assert.strictEqual(providers.length, 1);
            assert.strictEqual(providers[0] === barInfo, true);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tTZXJ2aWNlSW1wbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvbm90ZWJvb2tTZXJ2aWNlSW1wbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBcUJoRyxLQUFLLENBQUMsMkJBQTJCLEVBQUU7UUFDbEMsTUFBTSxXQUFXLEdBQUcsSUFBQSwrQ0FBdUMsR0FBa0MsQ0FBQztRQUU5RixJQUFJLENBQUMsZ0RBQWdELEVBQUU7WUFDdEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLHFEQUE2QixFQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNuRixNQUFNLEtBQUssR0FBRyxJQUFJLCtDQUF5QixDQUMxQyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBbUI7Z0JBQy9CLEdBQUcsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BCLEtBQUssS0FBSyxDQUFDO2dCQUNYLFNBQVMsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDbkMsRUFDRCxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBcUI7Z0JBQXZDOztvQkFDTSw0QkFBdUIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUMvQyxDQUFDO2FBQUEsRUFDRCxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyw2Q0FBcUIsQ0FBQyxDQUFDLEVBQzNFLElBQUksbURBQXdCLEVBQUUsRUFDOUIsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXlCO2dCQUEzQzs7b0JBQ00scUNBQWdDLEdBQWdCLGFBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3JFLENBQUM7YUFBQSxFQUNELG9CQUFvQixFQUNwQixJ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