/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/getComputedState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, lifecycle_1, index_1, testingViewState_1, getComputedState_1, testId_1, testResultService_1, testService_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeProjection = void 0;
    const computedStateAccessor = {
        getOwnState: i => i instanceof index_1.TestItemTreeElement ? i.ownState : 0 /* TestResultState.Unset */,
        getCurrentComputedState: i => i.state,
        setComputedState: (i, s) => i.state = s,
        getCurrentComputedDuration: i => i.duration,
        getOwnDuration: i => i instanceof index_1.TestItemTreeElement ? i.ownDuration : undefined,
        setComputedDuration: (i, d) => i.duration = d,
        getChildren: i => iterator_1.Iterable.filter(i.children.values(), (t) => t instanceof TreeTestItemElement),
        *getParents(i) {
            for (let parent = i.parent; parent; parent = parent.parent) {
                yield parent;
            }
        },
    };
    /**
     * Test tree element element that groups be hierarchy.
     */
    class TreeTestItemElement extends index_1.TestItemTreeElement {
        get description() {
            return this.test.item.description;
        }
        constructor(test, parent, addedOrRemoved) {
            super({ ...test, item: { ...test.item } }, parent);
            this.addedOrRemoved = addedOrRemoved;
            /**
             * Own, non-computed state.
             * @internal
             */
            this.ownState = 0 /* TestResultState.Unset */;
            this.updateErrorVisibility();
        }
        update(patch) {
            (0, testTypes_1.applyTestItemUpdate)(this.test, patch);
            this.updateErrorVisibility(patch);
            this.fireChange();
        }
        fireChange() {
            this.changeEmitter.fire();
        }
        updateErrorVisibility(patch) {
            if (this.errorChild && (!this.test.item.error || patch?.item?.error)) {
                this.addedOrRemoved(this);
                this.children.delete(this.errorChild);
                this.errorChild = undefined;
            }
            if (this.test.item.error && !this.errorChild) {
                this.errorChild = new index_1.TestTreeErrorMessage(this.test.item.error, this);
                this.children.add(this.errorChild);
                this.addedOrRemoved(this);
            }
        }
    }
    /**
     * Projection that lists tests in their traditional tree view.
     */
    let TreeProjection = class TreeProjection extends lifecycle_1.Disposable {
        /**
         * Gets root elements of the tree.
         */
        get rootsWithChildren() {
            const rootsIt = iterator_1.Iterable.map(this.testService.collection.rootItems, r => this.items.get(r.item.extId));
            return iterator_1.Iterable.filter(rootsIt, (r) => !!r?.children.size);
        }
        constructor(lastState, testService, results) {
            super();
            this.lastState = lastState;
            this.testService = testService;
            this.results = results;
            this.updateEmitter = new event_1.Emitter();
            this.changedParents = new Set();
            this.resortedParents = new Set();
            this.items = new Map();
            /**
             * @inheritdoc
             */
            this.onUpdate = this.updateEmitter.event;
            this._register(testService.onDidProcessDiff((diff) => this.applyDiff(diff)));
            // when test results are cleared, recalculate all state
            this._register(results.onResultsChanged((evt) => {
                if (!('removed' in evt)) {
                    return;
                }
                for (const inTree of [...this.items.values()].sort((a, b) => b.depth - a.depth)) {
                    const lookup = this.results.getStateById(inTree.test.item.extId)?.[1];
                    inTree.ownDuration = lookup?.ownDuration;
                    (0, getComputedState_1.refreshComputedState)(computedStateAccessor, inTree, lookup?.ownComputedState ?? 0 /* TestResultState.Unset */).forEach(i => i.fireChange());
                }
            }));
            // when test states change, reflect in the tree
            this._register(results.onTestChanged(ev => {
                if (ev.reason === 2 /* TestResultItemChangeReason.NewMessage */) {
                    return; // no effect in the tree
                }
                let result = ev.item;
                // if the state is unset, or the latest run is not making the change,
                // double check that it's valid. Retire calls might cause previous
                // emit a state change for a test run that's already long completed.
                if (result.ownComputedState === 0 /* TestResultState.Unset */ || ev.result !== results.results[0]) {
                    const fallback = results.getStateById(result.item.extId);
                    if (fallback) {
                        result = fallback[1];
                    }
                }
                const item = this.items.get(result.item.extId);
                if (!item) {
                    return;
                }
                // Skip refreshing the duration if we can trivially tell it didn't change.
                const refreshDuration = ev.reason === 1 /* TestResultItemChangeReason.OwnStateChange */ && ev.previousOwnDuration !== result.ownDuration;
                // For items without children, always use the computed state. They are
                // either leaves (for which it's fine) or nodes where we haven't expanded
                // children and should trust whatever the result service gives us.
                const explicitComputed = item.children.size ? undefined : result.computedState;
                item.retired = !!result.retired;
                item.ownState = result.ownComputedState;
                item.ownDuration = result.ownDuration;
                item.fireChange();
                (0, getComputedState_1.refreshComputedState)(computedStateAccessor, item, explicitComputed, refreshDuration).forEach(i => i.fireChange());
            }));
            for (const test of testService.collection.all) {
                this.storeItem(this.createItem(test));
            }
        }
        /**
         * @inheritdoc
         */
        getElementByTestId(testId) {
            return this.items.get(testId);
        }
        /**
         * @inheritdoc
         */
        applyDiff(diff) {
            for (const op of diff) {
                switch (op.op) {
                    case 0 /* TestDiffOpType.Add */: {
                        const item = this.createItem(op.item);
                        this.storeItem(item);
                        break;
                    }
                    case 1 /* TestDiffOpType.Update */: {
                        const patch = op.item;
                        const existing = this.items.get(patch.extId);
                        if (!existing) {
                            break;
                        }
                        // parent needs to be re-rendered on an expand update, so that its
                        // children are rewritten.
                        const needsParentUpdate = existing.test.expand === 0 /* TestItemExpandState.NotExpandable */ && patch.expand;
                        existing.update(patch);
                        if (needsParentUpdate) {
                            this.changedParents.add(existing.parent);
                        }
                        else {
                            this.resortedParents.add(existing.parent);
                        }
                        break;
                    }
                    case 3 /* TestDiffOpType.Remove */: {
                        const toRemove = this.items.get(op.itemId);
                        if (!toRemove) {
                            break;
                        }
                        // The first element will cause the root to be hidden
                        const parent = toRemove.parent;
                        const affectsRootElement = toRemove.depth === 1 && parent?.children.size === 1;
                        this.changedParents.add(affectsRootElement ? null : parent);
                        const queue = [[toRemove]];
                        while (queue.length) {
                            for (const item of queue.pop()) {
                                if (item instanceof TreeTestItemElement) {
                                    queue.push(this.unstoreItem(item));
                                }
                            }
                        }
                        if (parent instanceof TreeTestItemElement) {
                            (0, getComputedState_1.refreshComputedState)(computedStateAccessor, parent, undefined, !!parent.duration).forEach(i => i.fireChange());
                        }
                    }
                }
            }
            if (diff.length !== 0) {
                this.updateEmitter.fire();
            }
        }
        /**
         * @inheritdoc
         */
        applyTo(tree) {
            for (const parent of this.changedParents) {
                if (!parent || tree.hasElement(parent)) {
                    tree.setChildren(parent, (0, index_1.getChildrenForParent)(this.lastState, this.rootsWithChildren, parent), { diffIdentityProvider: index_1.testIdentityProvider });
                }
            }
            for (const parent of this.resortedParents) {
                if (!parent || tree.hasElement(parent)) {
                    tree.resort(parent, false);
                }
            }
            this.changedParents.clear();
            this.resortedParents.clear();
        }
        /**
         * @inheritdoc
         */
        expandElement(element, depth) {
            if (!(element instanceof TreeTestItemElement)) {
                return;
            }
            if (element.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                return;
            }
            this.testService.collection.expand(element.test.item.extId, depth);
        }
        createItem(item) {
            const parentId = testId_1.TestId.parentId(item.item.extId);
            const parent = parentId ? this.items.get(parentId) : null;
            return new TreeTestItemElement(item, parent, n => this.changedParents.add(n));
        }
        unstoreItem(treeElement) {
            const parent = treeElement.parent;
            parent?.children.delete(treeElement);
            this.items.delete(treeElement.test.item.extId);
            return treeElement.children;
        }
        storeItem(treeElement) {
            treeElement.parent?.children.add(treeElement);
            this.items.set(treeElement.test.item.extId, treeElement);
            // The first element will cause the root to be shown. The first element of
            // a parent may need to re-render it for #204805.
            const affectsParent = treeElement.parent?.children.size === 1;
            const affectedParent = affectsParent ? treeElement.parent.parent : treeElement.parent;
            this.changedParents.add(affectedParent);
            if (affectedParent?.depth === 0) {
                this.changedParents.add(null);
            }
            if (treeElement.depth === 0 || (0, testingViewState_1.isCollapsedInSerializedTestTree)(this.lastState, treeElement.test.item.extId) === false) {
                this.expandElement(treeElement, 0);
            }
            const prevState = this.results.getStateById(treeElement.test.item.extId)?.[1];
            if (prevState) {
                treeElement.retired = !!prevState.retired;
                treeElement.ownState = prevState.computedState;
                treeElement.ownDuration = prevState.ownDuration;
                (0, getComputedState_1.refreshComputedState)(computedStateAccessor, treeElement, undefined, !!treeElement.ownDuration).forEach(i => i.fireChange());
            }
        }
    };
    exports.TreeProjection = TreeProjection;
    exports.TreeProjection = TreeProjection = __decorate([
        __param(1, testService_1.ITestService),
        __param(2, testResultService_1.ITestResultService)
    ], TreeProjection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJlZVByb2plY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9leHBsb3JlclByb2plY3Rpb25zL3RyZWVQcm9qZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCaEcsTUFBTSxxQkFBcUIsR0FBMkQ7UUFDckYsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLDJCQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsOEJBQXNCO1FBQ3ZGLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7UUFDckMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7UUFFdkMsMEJBQTBCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUMzQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFlBQVksMkJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFDakYsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUM7UUFFN0MsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsbUJBQVEsQ0FBQyxNQUFNLENBQ2hDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQ25CLENBQUMsQ0FBQyxFQUE0QixFQUFFLENBQUMsQ0FBQyxZQUFZLG1CQUFtQixDQUNqRTtRQUNELENBQUMsVUFBVSxD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