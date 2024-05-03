/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/contrib/testing/browser/explorerProjections/listProjection", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/test/browser/testObjectTree", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, assert, event_1, utils_1, listProjection_1, testId_1, testObjectTree_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Testing Explorer Hierarchal by Name Projection', () => {
        let harness;
        let onTestChanged;
        let resultsService;
        teardown(() => {
            harness.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            onTestChanged = new event_1.Emitter();
            resultsService = {
                onResultsChanged: () => undefined,
                onTestChanged: onTestChanged.event,
                getStateById: () => ({ state: { state: 0 }, computedState: 0 }),
            };
            harness = new testObjectTree_1.TestTreeTestHarness(l => new listProjection_1.ListProjection({}, l, resultsService));
        });
        test('renders initial tree', () => {
            harness.flush();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'aa' }, { e: 'ab' }, { e: 'b' }
            ]);
        });
        test('updates render if second test provider appears', async () => {
            harness.flush();
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', expand: 3 /* TestItemExpandState.Expanded */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrl2']), 'root2').toTestItem() },
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem(new testId_1.TestId(['ctrl2', 'id-c']), 'c', undefined).toTestItem() },
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'root', children: [{ e: 'aa' }, { e: 'ab' }, { e: 'b' }] },
                { e: 'root2', children: [{ e: 'c' }] },
            ]);
        });
        test('updates nodes if they add children', async () => {
            harness.flush();
            harness.c.root.children.get('id-a').children.add(new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'id-a', 'id-ac']), 'ac'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'ab' },
                { e: 'ac' },
                { e: 'b' }
            ]);
        });
        test('updates nodes if they remove children', async () => {
            harness.flush();
            harness.c.root.children.get('id-a').children.delete('id-ab');
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'b' }
            ]);
        });
        test('swaps when node is no longer leaf', async () => {
            harness.flush();
            harness.c.root.children.get('id-b').children.add(new testStubs_1.TestTestItem(new testId_1.TestId(['ctrlId', 'id-b', 'id-ba']), 'ba'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'ab' },
                { e: 'ba' },
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZVByb2plY3Rpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy90ZXN0L2Jyb3dzZXIvZXhwbG9yZXJQcm9qZWN0aW9ucy9uYW1lUHJvamVjdGlvbi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLEtBQUssQ0FBQyw0REFBNEQsRUFBRSxHQUFHLEVBQUU7UUFDeEUsSUFBSSxPQUE0QyxDQUFDO1FBQ2pELElBQUksYUFBNEMsQ0FBQztRQUNqRCxJQUFJLGNBQW1CLENBQUM7UUFFeEIsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNuQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsYUFBYSxHQUFHLElBQUksZUFBTyxFQUFFLENBQUM7WUFDOUIsY0FBYyxHQUFHO2dCQUNoQixnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2dCQUNqQyxhQUFhLEVBQUUsYUFBYSxDQUFDLEtBQUs7Z0JBQ2xDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUMvRCxDQUFDO1lBRUYsT0FBTyxHQUFHLElBQUksb0NBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLCtCQUFjLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxjQUFxQixDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7WUFD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