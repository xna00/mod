/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/contrib/testing/browser/explorerProjections/treeProjection", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/test/browser/testObjectTree", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, assert, event_1, lifecycle_1, utils_1, treeProjection_1, testId_1, testObjectTree_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestHierarchicalByLocationProjection extends treeProjection_1.TreeProjection {
    }
    suite('Workbench - Testing Explorer Hierarchal by Location Projection', () => {
        let harness;
        let onTestChanged;
        let resultsService;
        let ds;
        teardown(() => {
            ds.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            ds = new lifecycle_1.DisposableStore();
            onTestChanged = ds.add(new event_1.Emitter());
            resultsService = {
                results: [],
                onResultsChanged: () => undefined,
                onTestChanged: onTestChanged.event,
                getStateById: () => ({ state: { state: 0 }, computedState: 0 }),
            };
            harness = ds.add(new testObjectTree_1.TestTreeTestHarness(l => new TestHierarchicalByLocationProjection({}, l, resultsService)));
        });
        test('renders initial tree', async () => {
            harness.flush();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'a' }, { e: 'b' }
            ]);
        });
        test('expands children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] }, { e: 'b' }
            ]);
        });
        test('updates render if second test provider appears', async () => {
            harness.flush();
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', expand: 3 /* TestItemExpandState.Expanded */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId2']), 'c').toTestItem() },
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId2', 'id-c']), 'ca').toTestItem() },
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'c', children: [{ e: 'ca' }] },
                { e: 'root', children: [{ e: 'a' }, { e: 'b' }] }
            ]);
        });
        test('updates nodes if they add children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] },
                { e: 'b' }
            ]);
            harness.c.root.children.get('id-a').children.add(new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'id-a', 'id-ac']), 'ac'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }, { e: 'ac' }] },
                { e: 'b' }
            ]);
        });
        test('updates nodes if they remove children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] },
                { e: 'b' }
            ]);
            harness.c.root.children.get('id-a').children.delete('id-ab');
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }] },
                { e: 'b' }
            ]);
        });
        test('applies state changes', async () => {
            harness.flush();
            const resultInState = (state) => ({
                item: {
                    extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(),
                    busy: false,
                    description: null,
                    error: null,
                    label: 'a',
                    range: null,
                    sortText: null,
                    tags: [],
                    uri: undefined,
                },
                tasks: [],
                ownComputedState: state,
                computedState: state,
                expand: 0,
                controllerId: 'ctrl',
            });
            // Applies the change:
            resultsService.getStateById = () => [undefined, resultInState(1 /* TestResultState.Queued */)];
            onTestChanged.fire({
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                result: null,
                previousState: 0 /* TestResultState.Unset */,
                item: resultInState(1 /* TestResultState.Queued */),
                previousOwnDuration: undefined,
            });
            harness.projection.applyTo(harness.tree);
            assert.deepStrictEqual(harness.tree.getRendered('state'), [
                { e: 'a', data: String(1 /* TestResultState.Queued */) },
                { e: 'b', data: String(0 /* TestResultState.Unset */) }
            ]);
            // Falls back if moved into unset state:
            resultsService.getStateById = () => [undefined, resultInState(4 /* TestResultState.Failed */)];
            onTestChanged.fire({
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                result: null,
                previousState: 1 /* TestResultState.Queued */,
                item: resultInState(0 /* TestResultState.Unset */),
                previousOwnDuration: undefined,
            });
            harness.projection.applyTo(harness.tree);
            assert.deepStrictEqual(harness.tree.getRendered('state'), [
                { e: 'a', data: String(4 /* TestResultState.Failed */) },
                { e: 'b', data: String(0 /* TestResultState.Unset */) }
            ]);
        });
        test('applies test changes (resort)', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] }, { e: 'b' }
            ]);
            // sortText causes order to change
            harness.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), item: { sortText: "z" } }
            }, {
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']).toString(), item: { sortText: "a" } }
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'ab' }, { e: 'aa' }] }, { e: 'b' }
            ]);
            // label causes order to change
            harness.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), item: { sortText: undefined, label: "z" } }
            }, {
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']).toString(), item: { sortText: undefined, label: "a" } }
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'a' }, { e: 'z' }] }, { e: 'b' }
            ]);
            harness.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), item: { label: "a2" } }
            }, {
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a', 'id-ab']).toString(), item: { label: "z2" } }
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'a2' }, { e: 'z2' }] }, { e: 'b' }
            ]);
        });
        test('applies test changes (error)', async () => {
            harness.flush();
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a' }, { e: 'b' }
            ]);
            // sortText causes order to change
            harness.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), item: { error: "bad" } }
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a' }, { e: 'b' }
            ]);
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'bad' }, { e: 'aa' }, { e: 'ab' }] }, { e: 'b' }
            ]);
            harness.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(), item: { error: "badder" } }
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'badder' }, { e: 'aa' }, { e: 'ab' }] }, { e: 'b' }
            ]);
        });
        test('fixes #204805', async () => {
            harness.flush();
            harness.pushDiff({
                op: 3 /* TestDiffOpType.Remove */,
                itemId: 'ctrlId',
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId']), 'ctrl').toTestItem() },
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'a']), 'a').toTestItem() },
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a' }
            ]);
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'a', 'b']), 'b').toTestItem() },
            });
            harness.flush();
            harness.tree.expandAll();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'a', children: [{ e: 'b' }] }
            ]);
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrlId', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'a', 'b', 'c']), 'c').toTestItem() },
            });
            harness.flush();
            harness.tree.expandAll();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'a', children: [{ e: 'b', children: [{ e: 'c' }] }] }
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVByb2plY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy90ZXN0L2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy90cmVlUHJvamVjdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBYWhHLE1BQU0sb0NBQXFDLFNBQVEsK0JBQWM7S0FDaEU7SUFFRCxLQUFLLENBQUMsZ0VBQWdFLEVBQUUsR0FBRyxFQUFFO1FBQzVFLElBQUksT0FBa0UsQ0FBQztRQUN2RSxJQUFJLGFBQTRDLENBQUM7UUFDakQsSUFBSSxjQUFtQixDQUFDO1FBQ3hCLElBQUksRUFBbUIsQ0FBQztRQUV4QixRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEVBQUUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMzQixhQUFhLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLGVBQU8sRUFBRSxDQUFDLENBQUM7WUFDdEMsY0FBYyxHQUFHO2dCQUNoQixPQUFPLEVBQUUsRUFBRTtnQkFDWCxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2dCQUNqQyxhQUFhLEVBQUUsYUFBYSxDQUFDLEtBQUs7Z0JBQ2xDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUMvRCxDQUFDO1lBRUYsT0FBTyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENB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