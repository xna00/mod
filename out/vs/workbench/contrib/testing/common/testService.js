/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/testing/common/testId"], function (require, exports, cancellation_1, iterator_1, instantiation_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testsUnderUri = exports.testsInFile = exports.expandAndGetTestById = exports.getContextForTestItem = exports.testCollectionIsEmpty = exports.ITestService = void 0;
    exports.ITestService = (0, instantiation_1.createDecorator)('testService');
    const testCollectionIsEmpty = (collection) => !iterator_1.Iterable.some(collection.rootItems, r => r.children.size > 0);
    exports.testCollectionIsEmpty = testCollectionIsEmpty;
    const getContextForTestItem = (collection, id) => {
        if (typeof id === 'string') {
            id = testId_1.TestId.fromString(id);
        }
        if (id.isRoot) {
            return { controller: id.toString() };
        }
        const context = { $mid: 16 /* MarshalledId.TestItemContext */, tests: [] };
        for (const i of id.idsFromRoot()) {
            if (!i.isRoot) {
                const test = collection.getNodeById(i.toString());
                if (test) {
                    context.tests.push(test);
                }
            }
        }
        return context;
    };
    exports.getContextForTestItem = getContextForTestItem;
    /**
     * Ensures the test with the given ID exists in the collection, if possible.
     * If cancellation is requested, or the test cannot be found, it will return
     * undefined.
     */
    const expandAndGetTestById = async (collection, id, ct = cancellation_1.CancellationToken.None) => {
        const idPath = [...testId_1.TestId.fromString(id).idsFromRoot()];
        let expandToLevel = 0;
        for (let i = idPath.length - 1; !ct.isCancellationRequested && i >= expandToLevel;) {
            const id = idPath[i].toString();
            const existing = collection.getNodeById(id);
            if (!existing) {
                i--;
                continue;
            }
            if (i === idPath.length - 1) {
                return existing;
            }
            // expand children only if it looks like it's necessary
            if (!existing.children.has(idPath[i + 1].toString())) {
                await collection.expand(id, 0);
            }
            expandToLevel = i + 1; // avoid an infinite loop if the test does not exist
            i = idPath.length - 1;
        }
        return undefined;
    };
    exports.expandAndGetTestById = expandAndGetTestById;
    /**
     * Waits for the test to no longer be in the "busy" state.
     */
    const waitForTestToBeIdle = (testService, test) => {
        if (!test.item.busy) {
            return;
        }
        return new Promise(resolve => {
            const l = testService.onDidProcessDiff(() => {
                if (testService.collection.getNodeById(test.item.extId)?.item.busy !== true) {
                    resolve(); // removed, or no longer busy
                    l.dispose();
                }
            });
        });
    };
    /**
     * Iterator that expands to and iterates through tests in the file. Iterates
     * in strictly descending order.
     */
    const testsInFile = async function* (testService, ident, uri, waitForIdle = true) {
        for (const test of testService.collection.all) {
            if (!test.item.uri) {
                continue;
            }
            if (ident.extUri.isEqual(uri, test.item.uri)) {
                yield test;
            }
            if (ident.extUri.isEqualOrParent(uri, test.item.uri)) {
                if (test.expand === 1 /* TestItemExpandState.Expandable */) {
                    await testService.collection.expand(test.item.extId, 1);
                }
                if (waitForIdle) {
                    await waitForTestToBeIdle(testService, test);
                }
            }
        }
    };
    exports.testsInFile = testsInFile;
    /**
     * Iterator that iterates to the top-level children of tests under the given
     * the URI.
     */
    const testsUnderUri = async function* (testService, ident, uri, waitForIdle = true) {
        const queue = [testService.collection.rootIds];
        while (queue.length) {
            for (const testId of queue.pop()) {
                const test = testService.collection.getNodeById(testId);
                // Expand tests with URIs that are parent of the item, add tests
                // that are within the URI. Don't add their children, since those
                // tests already encompass their children.
                if (!test) {
                    // no-op
                }
                else if (!test.item.uri) {
                    queue.push(test.children.values());
                    continue;
                }
                else if (ident.extUri.isEqualOrParent(uri, test.item.uri)) {
                    if (test.expand === 1 /* TestItemExpandState.Expandable */) {
                        await testService.collection.expand(test.item.extId, 1);
                    }
                    if (waitForIdle) {
                        await waitForTestToBeIdle(testService, test);
                    }
                    queue.push(test.children.values());
                }
                else if (ident.extUri.isEqualOrParent(test.item.uri, uri)) {
                    yield test;
                }
            }
        }
    };
    exports.testsUnderUri = testsUnderUri;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvY29tbW9uL3Rlc3RTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWdCbkYsUUFBQSxZQUFZLEdBQUcsSUFBQSwrQkFBZSxFQUFlLGFBQWEsQ0FBQyxDQUFDO0lBOERsRSxNQUFNLHFCQUFxQixHQUFHLENBQUMsVUFBcUMsRUFBRSxFQUFFLENBQzlFLENBQUMsbUJBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRG5ELFFBQUEscUJBQXFCLHlCQUM4QjtJQUV6RCxNQUFNLHFCQUFxQixHQUFHLENBQUMsVUFBcUMsRUFBRSxFQUFtQixFQUFFLEVBQUU7UUFDbkcsSUFBSSxPQUFPLEVBQUUsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM1QixFQUFFLEdBQUcsZUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRUQsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZixPQUFPLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQ3RDLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBcUIsRUFBRSxJQUFJLHVDQUE4QixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUNwRixLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxJQUFJLEdBQUcs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