/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/map", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, map_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTestCollection = void 0;
    class MainThreadTestCollection extends testTypes_1.AbstractIncrementalTestCollection {
        /**
         * @inheritdoc
         */
        get busyProviders() {
            return this.busyControllerCount;
        }
        /**
         * @inheritdoc
         */
        get rootItems() {
            return this.roots;
        }
        /**
         * @inheritdoc
         */
        get all() {
            return this.getIterator();
        }
        get rootIds() {
            return iterator_1.Iterable.map(this.roots.values(), r => r.item.extId);
        }
        constructor(uriIdentityService, expandActual) {
            super(uriIdentityService);
            this.expandActual = expandActual;
            this.testsByUrl = new map_1.ResourceMap();
            this.busyProvidersChangeEmitter = new event_1.Emitter();
            this.expandPromises = new WeakMap();
            this.onBusyProvidersChange = this.busyProvidersChangeEmitter.event;
            this.changeCollector = {
                add: node => {
                    if (!node.item.uri) {
                        return;
                    }
                    const s = this.testsByUrl.get(node.item.uri);
                    if (!s) {
                        this.testsByUrl.set(node.item.uri, new Set([node]));
                    }
                    else {
                        s.add(node);
                    }
                },
                remove: node => {
                    if (!node.item.uri) {
                        return;
                    }
                    const s = this.testsByUrl.get(node.item.uri);
                    if (!s) {
                        return;
                    }
                    s.delete(node);
                    if (s.size === 0) {
                        this.testsByUrl.delete(node.item.uri);
                    }
                },
            };
        }
        /**
         * @inheritdoc
         */
        expand(testId, levels) {
            const test = this.items.get(testId);
            if (!test) {
                return Promise.resolve();
            }
            // simple cache to avoid duplicate/unnecessary expansion calls
            const existing = this.expandPromises.get(test);
            if (existing && existing.pendingLvl >= levels) {
                return existing.prom;
            }
            const prom = this.expandActual(test.item.extId, levels);
            const record = { doneLvl: existing ? existing.doneLvl : -1, pendingLvl: levels, prom };
            this.expandPromises.set(test, record);
            return prom.then(() => {
                record.doneLvl = levels;
            });
        }
        /**
         * @inheritdoc
         */
        getNodeById(id) {
            return this.items.get(id);
        }
        /**
         * @inheritdoc
         */
        getNodeByUrl(uri) {
            return this.testsByUrl.get(uri) || iterator_1.Iterable.empty();
        }
        /**
         * @inheritdoc
         */
        getReviverDiff() {
            const ops = [{ op: 4 /* TestDiffOpType.IncrementPendingExtHosts */, amount: this.pendingRootCount }];
            const queue = [this.rootIds];
            while (queue.length) {
                for (const child of queue.pop()) {
                    const item = this.items.get(child);
                    ops.push({
                        op: 0 /* TestDiffOpType.Add */,
                        item: {
                            controllerId: item.controllerId,
                            expand: item.expand,
                            item: item.item,
                        }
                    });
                    queue.push(item.children);
                }
            }
            return ops;
        }
        /**
         * Applies the diff to the collection.
         */
        apply(diff) {
            const prevBusy = this.busyControllerCount;
            super.apply(diff);
            if (prevBusy !== this.busyControllerCount) {
                this.busyProvidersChangeEmitter.fire(this.busyControllerCount);
            }
        }
        /**
         * Clears everything from the collection, and returns a diff that applies
         * that action.
         */
        clear() {
            const ops = [];
            for (const root of this.roots) {
                ops.push({ op: 3 /* TestDiffOpType.Remove */, itemId: root.item.extId });
            }
            this.roots.clear();
            this.items.clear();
            return ops;
        }
        /**
         * @override
         */
        createItem(internal) {
            return { ...internal, children: new Set() };
        }
        createChangeCollector() {
            return this.changeCollector;
        }
        *getIterator() {
            const queue = [this.rootIds];
            while (queue.length) {
                for (const id of queue.pop()) {
                    const node = this.getNodeById(id);
                    yield node;
                    queue.push(node.children);
                }
            }
        }
    }
    exports.MainThreadTestCollection = MainThreadTestCollection;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRlc3RDb2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi9tYWluVGhyZWFkVGVzdENvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBU2hHLE1BQWEsd0JBQXlCLFNBQVEsNkNBQWdFO1FBVTdHOztXQUVHO1FBQ0gsSUFBVyxhQUFhO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDO1FBQ2pDLENBQUM7UUFFRDs7V0FFRztRQUNILElBQVcsU0FBUztZQUNuQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVEOztXQUVHO1FBQ0gsSUFBVyxHQUFHO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQVcsT0FBTztZQUNqQixPQUFPLG1CQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFJRCxZQUFZLGtCQUF5QyxFQUFtQixZQUEyRDtZQUNsSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUQ2QyxpQkFBWSxHQUFaLFlBQVksQ0FBK0M7WUFwQzNILGVBQVUsR0FBRyxJQUFJLGlCQUFXLEVBQXNDLENBQUM7WUFFbkUsK0JBQTBCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztZQUNuRCxtQkFBYyxHQUFHLElBQUksT0FBTyxFQUloQyxDQUFDO1lBMkJXLDBCQUFxQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLENBQUM7WUF3RzdELG9CQUFlLEdB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