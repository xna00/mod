/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/assert", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testId"], function (require, exports, async_1, event_1, lifecycle_1, assert_1, testTypes_1, testId_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createTestItemChildren = exports.MixedTestItemController = exports.InvalidTestItemError = exports.DuplicateTestItemError = exports.TestItemCollection = exports.TestItemEventOp = void 0;
    var TestItemEventOp;
    (function (TestItemEventOp) {
        TestItemEventOp[TestItemEventOp["Upsert"] = 0] = "Upsert";
        TestItemEventOp[TestItemEventOp["SetTags"] = 1] = "SetTags";
        TestItemEventOp[TestItemEventOp["UpdateCanResolveChildren"] = 2] = "UpdateCanResolveChildren";
        TestItemEventOp[TestItemEventOp["RemoveChild"] = 3] = "RemoveChild";
        TestItemEventOp[TestItemEventOp["SetProp"] = 4] = "SetProp";
        TestItemEventOp[TestItemEventOp["Bulk"] = 5] = "Bulk";
        TestItemEventOp[TestItemEventOp["DocumentSynced"] = 6] = "DocumentSynced";
    })(TestItemEventOp || (exports.TestItemEventOp = TestItemEventOp = {}));
    const strictEqualComparator = (a, b) => a === b;
    const diffableProps = {
        range: (a, b) => {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.equalsRange(b);
        },
        busy: strictEqualComparator,
        label: strictEqualComparator,
        description: strictEqualComparator,
        error: strictEqualComparator,
        sortText: strictEqualComparator,
        tags: (a, b) => {
            if (a.length !== b.length) {
                return false;
            }
            if (a.some(t1 => !b.includes(t1))) {
                return false;
            }
            return true;
        },
    };
    const diffableEntries = Object.entries(diffableProps);
    const diffTestItems = (a, b) => {
        let output;
        for (const [key, cmp] of diffableEntries) {
            if (!cmp(a[key], b[key])) {
                if (output) {
                    output[key] = b[key];
                }
                else {
                    output = { [key]: b[key] };
                }
            }
        }
        return output;
    };
    /**
     * Maintains a collection of test items for a single controller.
     */
    class TestItemCollection extends lifecycle_1.Disposable {
        get root() {
            return this.options.root;
        }
        constructor(options) {
            super();
            this.options = options;
            this.debounceSendDiff = this._register(new async_1.RunOnceScheduler(() => this.flushDiff(), 200));
            this.diffOpEmitter = this._register(new event_1.Emitter());
            this.tree = new Map();
            this.tags = new Map();
            this.diff = [];
            /**
             * Fires when an operation happens that should result in a diff.
             */
            this.onDidGenerateDiff = this.diffOpEmitter.event;
            this.root.canResolveChildren = true;
            this.upsertItem(this.root, undefined);
        }
        /**
         * Handler used for expanding test items.
         */
        set resolveHandler(handler) {
            this._resolveHandler = handler;
            for (const test of this.tree.values()) {
                this.updateExpandability(test);
            }
        }
        get resolveHandler() {
            return this._resolveHandler;
        }
        /**
         * Gets a diff of all changes that have been made, and clears the diff queue.
         */
        collectDiff() {
            const diff = this.diff;
            this.diff = [];
            return diff;
        }
        /**
         * Pushes a new diff entry onto the collected diff list.
         */
        pushDiff(diff) {
            switch (diff.op) {
                case 2 /* TestDiffOpType.DocumentSynced */: {
                    for (const existing of this.diff) {
                        if (existing.op === 2 /* TestDiffOpType.DocumentSynced */ && existing.uri === diff.uri) {
                            existing.docv = diff.docv;
                            return;
                        }
                    }
                    break;
                }
                case 1 /* TestDiffOpType.Update */: {
                    // Try to merge updates, since they're invoked per-property
                    const last = this.diff[this.diff.length - 1];
                    if (last) {
                        if (last.op === 1 /* TestDiffOpType.Update */ && last.item.extId === diff.item.extId) {
                            (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                            return;
                        }
                        if (last.op === 0 /* TestDiffOpType.Add */ && last.item.item.extId === diff.item.extId) {
                            (0, testTypes_1.applyTestItemUpdate)(last.item, diff.item);
                            return;
                        }
                    }
                    break;
                }
            }
            this.diff.push(diff);
            if (!this.debounceSendDiff.isScheduled()) {
                this.debounceSendDiff.schedule();
            }
        }
        /**
         * Expands the test and the given number of `levels` of children. If levels
         * is < 0, then all children will be expanded. If it's 0, then only this
         * item will be expanded.
         */
        expand(testId, levels) {
            const internal = this.tree.get(testId);
            if (!internal) {
                return;
            }
            if (internal.expandLevels === undefined || levels > internal.expandLevels) {
                internal.expandLevels = levels;
            }
            // try to avoid awaiting things if the provider returns synchronously in
            // order to keep everything in a single diff and DOM update.
            if (internal.expand === 1 /* TestItemExpandState.Expandable */) {
                const r = this.resolveChildren(internal);
                return !r.isOpen()
                    ? r.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
            else if (internal.expand === 3 /* TestItemExpandState.Expanded */) {
                return internal.resolveBarrier?.isOpen() === false
                    ? internal.resolveBarrier.wait().then(() => this.expandChildren(internal, levels - 1))
                    : this.expandChildren(internal, levels - 1);
            }
        }
        dispose() {
            for (const item of this.tree.values()) {
                this.options.getApiFor(item.actual).listener = undefined;
            }
            this.tree.clear();
            this.diff = [];
            super.dispose();
        }
        onTestItemEvent(internal, evt) {
            switch (evt.op) {
                case 3 /* TestItemEventOp.RemoveChild */:
                    this.removeItem(testId_1.TestId.joinToString(internal.fullId, evt.id));
                    break;
                case 0 /* TestItemEventOp.Upsert */:
                    this.upsertItem(evt.item, internal);
                    break;
                case 5 /* TestItemEventOp.Bulk */:
                    for (const op of evt.ops) {
                        this.onTestItemEvent(internal, op);
                    }
                    break;
                case 1 /* TestItemEventOp.SetTags */:
                    this.diffTagRefs(evt.new, evt.old, internal.fullId.toString());
                    break;
                case 2 /* TestItemEventOp.UpdateCanResolveChildren */:
                    this.updateExpandability(internal);
                    break;
                case 4 /* TestItemEventOp.SetProp */:
                    this.pushDiff({
                        op: 1 /* TestDiffOpType.Update */,
                        item: {
                            extId: internal.fullId.toString(),
                            item: evt.update,
                        }
                    });
                    break;
                case 6 /* TestItemEventOp.DocumentSynced */:
                    this.documentSynced(internal.actual.uri);
                    break;
                default:
                    (0, assert_1.assertNever)(evt);
            }
        }
        documentSynced(uri) {
            if (uri) {
                this.pushDiff({
                    op: 2 /* TestDiffOpType.DocumentSynced */,
                    uri,
                    docv: this.options.getDocumentVersion(uri)
                });
            }
        }
        upsertItem(actual, parent) {
            const fullId = testId_1.TestId.fromExtHostTestItem(actual, this.root.id, parent?.actual);
            // If this test item exists elsewhere in the tree already (exists at an
            // old ID with an existing parent), remove that old item.
            const privateApi = this.options.getApiFor(actual);
            if (privateApi.parent && privateApi.parent !== parent?.actual) {
                this.options.getChildren(privateApi.parent).delete(actual.id);
            }
            let internal = this.tree.get(fullId.toString());
            // Case 1: a brand new item
            if (!internal) {
                internal = {
                    fullId,
                    actual,
                    expandLevels: parent?.expandLevels /* intentionally undefined or 0 */ ? parent.expandLevels - 1 : undefined,
                    expand: 0 /* TestItemExpandState.NotExpandable */, // updated by `connectItemAndChildren`
                };
                actual.tags.forEach(this.incrementTagRefs, this);
                this.tree.set(internal.fullId.toString(), internal);
                this.setItemParent(actual, parent);
                this.pushDiff({
                    op: 0 /* TestDiffOpType.Add */,
                    item: {
                        controllerId: this.options.controllerId,
                        expand: internal.expand,
                        item: this.options.toITestItem(actual),
                    },
                });
                this.connectItemAndChildren(actual, internal, parent);
                return;
            }
            // Case 2: re-insertion of an existing item, no-op
            if (internal.actual === actual) {
                this.connectItem(actual, internal, parent); // re-connect in case the parent changed
                return; // no-op
            }
            // Case 3: upsert of an existing item by ID, with a new instance
            if (internal.actual.uri?.toString() !== actual.uri?.toString()) {
                // If the item has a new URI, re-insert it; we don't support updating
                // URIs on existing test items.
                this.removeItem(fullId.toString());
                return this.upsertItem(actual, parent);
            }
            const oldChildren = this.options.getChildren(internal.actual);
            const oldActual = internal.actual;
            const update = diffTestItems(this.options.toITestItem(oldActual), this.options.toITestItem(actual));
            this.options.getApiFor(oldActual).listener = undefined;
            internal.actual = actual;
            internal.expand = 0 /* TestItemExpandState.NotExpandable */; // updated by `connectItemAndChildren`
            if (update) {
                // tags are handled in a special way
                if (update.hasOwnProperty('tags')) {
                    this.diffTagRefs(actual.tags, oldActual.tags, fullId.toString());
                    delete update.tags;
                }
                this.onTestItemEvent(internal, { op: 4 /* TestItemEventOp.SetProp */, update });
            }
            this.connectItemAndChildren(actual, internal, parent);
            // Remove any orphaned children.
            for (const [_, child] of oldChildren) {
                if (!this.options.getChildren(actual).get(child.id)) {
                    this.removeItem(testId_1.TestId.joinToString(fullId, child.id));
                }
            }
            // Mark ranges in the document as synced (#161320)
            this.documentSynced(internal.actual.uri);
        }
        diffTagRefs(newTags, oldTags, extId) {
            const toDelete = new Set(oldTags.map(t => t.id));
            for (const tag of newTags) {
                if (!toDelete.delete(tag.id)) {
                    this.incrementTagRefs(tag);
                }
            }
            this.pushDiff({
                op: 1 /* TestDiffOpType.Update */,
                item: { extId, item: { tags: newTags.map(v => (0, testTypes_1.namespaceTestTag)(this.options.controllerId, v.id)) } }
            });
            toDelete.forEach(this.decrementTagRefs, this);
        }
        incrementTagRefs(tag) {
            const existing = this.tags.get(tag.id);
            if (existing) {
                existing.refCount++;
            }
            else {
                this.tags.set(tag.id, { refCount: 1 });
                this.pushDiff({
                    op: 6 /* TestDiffOpType.AddTag */, tag: {
                        id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tag.id),
                    }
                });
            }
        }
        decrementTagRefs(tagId) {
            const existing = this.tags.get(tagId);
            if (existing && !--existing.refCount) {
                this.tags.delete(tagId);
                this.pushDiff({ op: 7 /* TestDiffOpType.RemoveTag */, id: (0, testTypes_1.namespaceTestTag)(this.options.controllerId, tagId) });
            }
        }
        setItemParent(actual, parent) {
            this.options.getApiFor(actual).parent = parent && parent.actual !== this.root ? parent.actual : undefined;
        }
        connectItem(actual, internal, parent) {
            this.setItemParent(actual, parent);
            const api = this.options.getApiFor(actual);
            api.parent = parent?.actual;
            api.listener = evt => this.onTestItemEvent(internal, evt);
            this.updateExpandability(internal);
        }
        connectItemAndChildren(actual, internal, parent) {
            this.connectItem(actual, internal, parent);
            // Discover any existing children that might have already been added
            for (const [_, child] of this.options.getChildren(actual)) {
                this.upsertItem(child, internal);
            }
        }
        /**
         * Updates the `expand` state of the item. Should be called whenever the
         * resolved state of the item changes. Can automatically expand the item
         * if requested by a consumer.
         */
        updateExpandability(internal) {
            let newState;
            if (!this._resolveHandler) {
                newState = 0 /* TestItemExpandState.NotExpandable */;
            }
            else if (internal.resolveBarrier) {
                newState = internal.resolveBarrier.isOpen()
                    ? 3 /* TestItemExpandState.Expanded */
                    : 2 /* TestItemExpandState.BusyExpanding */;
            }
            else {
                newState = internal.actual.canResolveChildren
                    ? 1 /* TestItemExpandState.Expandable */
                    : 0 /* TestItemExpandState.NotExpandable */;
            }
            if (newState === internal.expand) {
                return;
            }
            internal.expand = newState;
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: newState } });
            if (newState === 1 /* TestItemExpandState.Expandable */ && internal.expandLevels !== undefined) {
                this.resolveChildren(internal);
            }
        }
        /**
         * Expands all children of the item, "levels" deep. If levels is 0, only
         * the children will be expanded. If it's 1, the children and their children
         * will be expanded. If it's <0, it's a no-op.
         */
        expandChildren(internal, levels) {
            if (levels < 0) {
                return;
            }
            const expandRequests = [];
            for (const [_, child] of this.options.getChildren(internal.actual)) {
                const promise = this.expand(testId_1.TestId.joinToString(internal.fullId, child.id), levels);
                if ((0, async_1.isThenable)(promise)) {
                    expandRequests.push(promise);
                }
            }
            if (expandRequests.length) {
                return Promise.all(expandRequests).then(() => { });
            }
        }
        /**
         * Calls `discoverChildren` on the item, refreshing all its tests.
         */
        resolveChildren(internal) {
            if (internal.resolveBarrier) {
                return internal.resolveBarrier;
            }
            if (!this._resolveHandler) {
                const b = new async_1.Barrier();
                b.open();
                return b;
            }
            internal.expand = 2 /* TestItemExpandState.BusyExpanding */;
            this.pushExpandStateUpdate(internal);
            const barrier = internal.resolveBarrier = new async_1.Barrier();
            const applyError = (err) => {
                console.error(`Unhandled error in resolveHandler of test controller "${this.options.controllerId}"`, err);
            };
            let r;
            try {
                r = this._resolveHandler(internal.actual === this.root ? undefined : internal.actual);
            }
            catch (err) {
                applyError(err);
            }
            if ((0, async_1.isThenable)(r)) {
                r.catch(applyError).then(() => {
                    barrier.open();
                    this.updateExpandability(internal);
                });
            }
            else {
                barrier.open();
                this.updateExpandability(internal);
            }
            return internal.resolveBarrier;
        }
        pushExpandStateUpdate(internal) {
            this.pushDiff({ op: 1 /* TestDiffOpType.Update */, item: { extId: internal.fullId.toString(), expand: internal.expand } });
        }
        removeItem(childId) {
            const childItem = this.tree.get(childId);
            if (!childItem) {
                throw new Error('attempting to remove non-existent child');
            }
            this.pushDiff({ op: 3 /* TestDiffOpType.Remove */, itemId: childId });
            const queue = [childItem];
            while (queue.length) {
                const item = queue.pop();
                if (!item) {
                    continue;
                }
                this.options.getApiFor(item.actual).listener = undefined;
                for (const tag of item.actual.tags) {
                    this.decrementTagRefs(tag.id);
                }
                this.tree.delete(item.fullId.toString());
                for (const [_, child] of this.options.getChildren(item.actual)) {
                    queue.push(this.tree.get(testId_1.TestId.joinToString(item.fullId, child.id)));
                }
            }
        }
        /**
         * Immediately emits any pending diffs on the collection.
         */
        flushDiff() {
            const diff = this.collectDiff();
            if (diff.length) {
                this.diffOpEmitter.fire(diff);
            }
        }
    }
    exports.TestItemCollection = TestItemCollection;
    class DuplicateTestItemError extends Error {
        constructor(id) {
            super(`Attempted to insert a duplicate test item ID ${id}`);
        }
    }
    exports.DuplicateTestItemError = DuplicateTestItemError;
    class InvalidTestItemError extends Error {
        constructor(id) {
            super(`TestItem with ID "${id}" is invalid. Make sure to create it from the createTestItem method.`);
        }
    }
    exports.InvalidTestItemError = InvalidTestItemError;
    class MixedTestItemController extends Error {
        constructor(id, ctrlA, ctrlB) {
            super(`TestItem with ID "${id}" is from controller "${ctrlA}" and cannot be added as a child of an item from controller "${ctrlB}".`);
        }
    }
    exports.MixedTestItemController = MixedTestItemController;
    const createTestItemChildren = (api, getApi, checkCtor) => {
        let mapped = new Map();
        return {
            /** @inheritdoc */
            get size() {
                return mapped.size;
            },
            /** @inheritdoc */
            forEach(callback, thisArg) {
                for (const item of mapped.values()) {
                    callback.call(thisArg, item, this);
                }
            },
            /** @inheritdoc */
            [Symbol.iterator]() {
                return mapped.entries();
            },
            /** @inheritdoc */
            replace(items) {
                const newMapped = new Map();
                const toDelete = new Set(mapped.keys());
                const bulk = { op: 5 /* TestItemEventOp.Bulk */, ops: [] };
                for (const item of items) {
                    if (!(item instanceof checkCtor)) {
                        throw new InvalidTestItemError(item.id);
                    }
                    const itemController = getApi(item).controllerId;
                    if (itemController !== api.controllerId) {
                        throw new MixedTestItemController(item.id, itemController, api.controllerId);
                    }
                    if (newMapped.has(item.id)) {
                        throw new DuplicateTestItemError(item.id);
                    }
                    newMapped.set(item.id, item);
                    toDelete.delete(item.id);
                    bulk.ops.push({ op: 0 /* TestItemEventOp.Upsert */, item });
                }
                for (const id of toDelete.keys()) {
                    bulk.ops.push({ op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
                api.listener?.(bulk);
                // important mutations come after firing, so if an error happens no
                // changes will be "saved":
                mapped = newMapped;
            },
            /** @inheritdoc */
            add(item) {
                if (!(item instanceof checkCtor)) {
                    throw new InvalidTestItemError(item.id);
                }
                mapped.set(item.id, item);
                api.listener?.({ op: 0 /* TestItemEventOp.Upsert */, item });
            },
            /** @inheritdoc */
            delete(id) {
                if (mapped.delete(id)) {
                    api.listener?.({ op: 3 /* TestItemEventOp.RemoveChild */, id });
                }
            },
            /** @inheritdoc */
            get(itemId) {
                return mapped.get(itemId);
            },
            /** JSON serialization function. */
            toJSON() {
                return Array.from(mapped.values());
            },
        };
    };
    exports.createTestItemChildren = createTestItemChildren;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdEl0ZW1Db2xsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXN0aW5nL2NvbW1vbi90ZXN0SXRlbUNvbGxlY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyxJQUFrQixlQVFqQjtJQVJELFdBQWtCLGVBQWU7UUFDaEMseURBQU0sQ0FBQTtRQUNOLDJEQUFPLENBQUE7UUFDUCw2RkFBd0IsQ0FBQTtRQUN4QixtRUFBVyxDQUFBO1FBQ1gsMkRBQU8sQ0FBQTtRQUNQLHFEQUFJLENBQUE7UUFDSix5RUFBYyxDQUFBO0lBQ2YsQ0FBQyxFQVJpQixlQUFlLCtCQUFmLGVBQWUsUUFRaEM7SUF1RUQsTUFBTSxxQkFBcUIsR0FBRyxDQUFJLENBQUksRUFBRSxDQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekQsTUFBTSxhQUFhLEdBQStFO1FBQ2pHLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNmLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUFDLE9BQU8sSUFBSSxDQUFDO1lBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQUMsT0FBTyxLQUFLLENBQUM7WUFBQyxDQUFDO1lBQy9CLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQ0QsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixLQUFLLEVBQUUscUJBQXFCO1FBQzVCLFdBQVcsRUFBRSxxQkFBcUI7UUFDbEMsS0FBSyxFQUFFLHFCQUFxQjtRQUM1QixRQUFRLEVBQUUscUJBQXFCO1FBQy9CLElBQUksRUFBRSxDQUFDLENB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