/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/contributedStatusBarItemController", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, event_1, lifecycle_1, utils_1, contributedStatusBarItemController_1, notebookCellStatusBarService_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Statusbar', () => {
        const testDisposables = new lifecycle_1.DisposableStore();
        teardown(() => {
            testDisposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Calls item provider', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, _ds, accessor) => {
                const cellStatusbarSvc = accessor.get(notebookCellStatusBarService_1.INotebookCellStatusBarService);
                testDisposables.add(accessor.createInstance(contributedStatusBarItemController_1.ContributedStatusBarItemController, editor));
                const provider = testDisposables.add(new class extends lifecycle_1.Disposable {
                    constructor() {
                        super(...arguments);
                        this.provideCalls = 0;
                        this._onProvideCalled = this._register(new event_1.Emitter());
                        this.onProvideCalled = this._onProvideCalled.event;
                        this._onDidChangeStatusBarItems = this._register(new event_1.Emitter());
                        this.onDidChangeStatusBarItems = this._onDidChangeStatusBarItems.event;
                        this.viewType = editor.textModel.viewType;
                    }
                    async provideCellStatusBarItems(_uri, index, _token) {
                        if (index === 0) {
                            this.provideCalls++;
                            this._onProvideCalled.fire(this.provideCalls);
                        }
                        return { items: [] };
                    }
                });
                const providePromise1 = asPromise(provider.onProvideCalled, 'registering provider');
                testDisposables.add(cellStatusbarSvc.registerCellStatusBarItemProvider(provider));
                assert.strictEqual(await providePromise1, 1, 'should call provider on registration');
                const providePromise2 = asPromise(provider.onProvideCalled, 'updating metadata');
                const cell0 = editor.textModel.cells[0];
                cell0.metadata = { ...cell0.metadata, ...{ newMetadata: true } };
                assert.strictEqual(await providePromise2, 2, 'should call provider on updating metadata');
                const providePromise3 = asPromise(provider.onProvideCalled, 'changing cell language');
                cell0.language = 'newlanguage';
                assert.strictEqual(await providePromise3, 3, 'should call provider on changing language');
                const providePromise4 = asPromise(provider.onProvideCalled, 'manually firing change event');
                provider._onDidChangeStatusBarItems.fire();
                assert.strictEqual(await providePromise4, 4, 'should call provider on manually firing change event');
            });
        });
    });
    async function asPromise(event, message) {
        const error = new Error('asPromise TIMEOUT reached: ' + message);
        return new Promise((resolve, reject) => {
            const handle = setTimeout(() => {
                sub.dispose();
                reject(error);
            }, 1000);
            const sub = event(e => {
                clearTimeout(handle);
                sub.dispose();
                resolve(e);
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRTdGF0dXNCYXJJdGVtQ29udHJvbGxlci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY29udHJpYi9jb250cmlidXRlZFN0YXR1c0Jhckl0ZW1Db250cm9sbGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFhaEcsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtRQUNoQyxNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUU5QyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxLQUFLO1lBQ2hDLE1BQU0sSUFBQSxxQ0FBZ0IsRUFDckI7Z0JBQ0MsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ25ELENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ25ELEVBQ0QsS0FBSyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUMxQyxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsNERBQTZCLENBQUMsQ0FBQztnQkFDckUsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLHVFQUFrQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBRXpGLE1BQU0sUUFBUSxH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