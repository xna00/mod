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
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/contrib/testing/browser/explorerProjections/display", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/testingViewState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/contrib/testing/common/testTypes"], function (require, exports, event_1, iterator_1, lifecycle_1, display_1, index_1, testingViewState_1, testId_1, testResultService_1, testService_1, testTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListProjection = void 0;
    /**
     * Test tree element element that groups be hierarchy.
     */
    class ListTestItemElement extends index_1.TestItemTreeElement {
        get description() {
            return this.chain.map(c => c.item.label).join(display_1.flatTestItemDelimiter);
        }
        constructor(test, parent, chain) {
            super({ ...test, item: { ...test.item } }, parent);
            this.chain = chain;
            this.descriptionParts = [];
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
                this.children.delete(this.errorChild);
                this.errorChild = undefined;
            }
            if (this.test.item.error && !this.errorChild) {
                this.errorChild = new index_1.TestTreeErrorMessage(this.test.item.error, this);
                this.children.add(this.errorChild);
            }
        }
    }
    /**
     * Projection that lists tests in their traditional tree view.
     */
    let ListProjection = class ListProjection extends lifecycle_1.Disposable {
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
                for (const inTree of this.items.values()) {
                    // Simple logic here, because we know in this projection states
                    // are never inherited.
                    const lookup = this.results.getStateById(inTree.test.item.extId)?.[1];
                    inTree.duration = lookup?.ownDuration;
                    inTree.state = lookup?.ownComputedState || 0 /* TestResultState.Unset */;
                    inTree.fireChange();
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
                item.retired = !!result.retired;
                item.state = result.computedState;
                item.duration = result.ownDuration;
                item.fireChange();
            }));
            for (const test of testService.collection.all) {
                this.storeItem(test);
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
                        this.storeItem(op.item);
                        break;
                    }
                    case 1 /* TestDiffOpType.Update */: {
                        this.items.get(op.item.extId)?.update(op.item);
                        break;
                    }
                    case 3 /* TestDiffOpType.Remove */: {
                        for (const [id, item] of this.items) {
                            if (id === op.itemId || testId_1.TestId.isChild(op.itemId, id)) {
                                this.unstoreItem(item);
                            }
                        }
                        break;
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
            // We don't bother doing a very specific update like we do in the TreeProjection.
            // It's a flat list, so chances are we need to render everything anyway.
            // Let the diffIdentityProvider handle that.
            tree.setChildren(null, (0, index_1.getChildrenForParent)(this.lastState, this.rootsWithChildren, null), {
                diffIdentityProvider: index_1.testIdentityProvider,
                diffDepth: Infinity
            });
        }
        /**
         * @inheritdoc
         */
        expandElement(element, depth) {
            if (!(element instanceof ListTestItemElement)) {
                return;
            }
            if (element.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                return;
            }
            this.testService.collection.expand(element.test.item.extId, depth);
        }
        unstoreItem(treeElement) {
            this.items.delete(treeElement.test.item.extId);
            treeElement.parent?.children.delete(treeElement);
            const parentId = testId_1.TestId.fromString(treeElement.test.item.extId).parentId;
            if (!parentId) {
                return;
            }
            // create the parent if it's now its own leaf
            for (const id of parentId.idsToRoot()) {
                const parentTest = this.testService.collection.getNodeById(id.toString());
                if (parentTest) {
                    if (parentTest.children.size === 0 && !this.items.has(id.toString())) {
                        this._storeItem(parentId, parentTest);
                    }
                    break;
                }
            }
        }
        _storeItem(testId, item) {
            const displayedParent = testId.isRoot ? null : this.items.get(item.controllerId);
            const chain = [...testId.idsFromRoot()].slice(1, -1).map(id => this.testService.collection.getNodeById(id.toString()));
            const treeElement = new ListTestItemElement(item, displayedParent, chain);
            displayedParent?.children.add(treeElement);
            this.items.set(treeElement.test.item.extId, treeElement);
            if (treeElement.depth === 0 || (0, testingViewState_1.isCollapsedInSerializedTestTree)(this.lastState, treeElement.test.item.extId) === false) {
                this.expandElement(treeElement, Infinity);
            }
            const prevState = this.results.getStateById(treeElement.test.item.extId)?.[1];
            if (prevState) {
                treeElement.retired = !!prevState.retired;
                treeElement.state = prevState.computedState;
                treeElement.duration = prevState.ownDuration;
            }
        }
        storeItem(item) {
            const testId = testId_1.TestId.fromString(item.item.extId);
            // Remove any non-root parent of this item which is no longer a leaf.
            for (const parentId of testId.idsToRoot()) {
                if (!parentId.isRoot) {
                    const prevParent = this.items.get(parentId.toString());
                    if (prevParent) {
                        this.unstoreItem(prevParent);
                        break;
                    }
                }
            }
            this._storeItem(testId, item);
        }
    };
    exports.ListProjection = ListProjection;
    exports.ListProjection = ListProjection = __decorate([
        __param(1, testService_1.ITestService),
        __param(2, testResultService_1.ITestResultService)
    ], ListProjection);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFByb2plY3Rpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlc3RpbmcvYnJvd3Nlci9leHBsb3JlclByb2plY3Rpb25zL2xpc3RQcm9qZWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCaEc7O09BRUc7SUFDSCxNQUFNLG1CQUFvQixTQUFRLDJCQUFtQjtRQUtwRCxJQUFvQixXQUFXO1lBQzlCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQywrQkFBcUIsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxZQUNDLElBQXNCLEVBQ3RCLE1BQWtDLEVBQ2pCLEtBQXlCO1lBRTFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFGbEMsVUFBSyxHQUFMLEtBQUssQ0FBb0I7WUFUcEMscUJBQWdCLEdBQWEsRUFBRSxDQUFDO1lBWXRDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQzlCLENBQUM7UUFFTSxNQUFNLENBQUMsS0FBc0I7WUFDbkMsSUFBQSwrQkFBbUIsRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbkIsQ0FBQztRQUVNLFVBQVU7WUFDaEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMzQixDQUFDO1FBRU8scUJBQXFCLENBQUMsS0FBdUI7WUFDcEQsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO1lBQzdCLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLDRCQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdkUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUFHRDs7T0FFRztJQUNJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBVTtRQUk3Qzs7V0FFRztRQUNILElBQVksaUJBQWlCO1lBQzVCLE1BQU0sT0FBTyxHQUFHLG1CQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN2RyxPQUFPLG1CQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFPRCxZQUNRLFNBQTJDLEVBQ3BDLFdBQTBDLEVBQ3BDLE9BQTRDO1lBRWhFLEtBQUssRUFBRSxDQUFDO1lBSkQsY0FBUyxHQUFULFNBQVMsQ0FBa0M7WUFDbkIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbkIsWUFBTyxHQUFQLE9BQU8sQ0FBb0I7WUFuQmhELGtCQUFhLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUNwQyxVQUFLLEdBQUcsSUFBSSxHQUFHLEVBQStCLENBQUM7WUFVaEU7O2VBRUc7WUFDYSxhQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFRbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdFLHVEQUF1RDtZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUMvQyxJQUFJLENBQUMsQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDekIsT0FBTztnQkFDUixDQUFDO2dCQUVELEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUMxQywrREFBK0Q7b0JBQy9ELHVCQUF1QjtvQkFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEUsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNLEVBQUUsV0FBVyxDQUFDO29CQUN0QyxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxnQkFBZ0IsaUNBQXlCLENBQUM7b0JBQ2pFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFSiwrQ0FBK0M7WUFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxJQUFJLEVBQUUsQ0FBQyxNQUFNLGtEQUEwQyxFQUFFLENBQUM7b0JBQ3pELE9BQU8sQ0FBQyx3QkFBd0I7Z0JBQ2pDLENBQUM7Z0JBRUQsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQztnQkFDckIscUVBQXFFO2dCQUNyRSxrRUFBa0U7Z0JBQ2xFLG9FQUFvRTtnQkFDcEUsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLGtDQUEwQixJQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUMzRixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3pELElBQUksUUFBUSxFQUFFLENBQUM7d0JBQ2QsTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEIsQ0FBQztnQkFDRixDQUFDO2dCQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDWCxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO2dCQUNsQyxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7Z0JBQ25DLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxrQkFBa0IsQ0FBQyxNQUFjO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0IsQ0FBQztRQUVEOztXQUVHO1FBQ0ssU0FBUyxDQUFDLElBQWU7WUFDaEMsS0FBSyxNQUFNLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDdkIsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ2YsK0JBQXVCLENBQUMsQ0FBQyxDQUFDO3dCQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDeEIsTUFBTTtvQkFDUCxDQUFDO29CQUVELGtDQUEwQixDQUFDLENBQUMsQ0FBQzt3QkFDNUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMvQyxNQUFNO29CQUNQLENBQUM7b0JBRUQsa0NBQTBCLENBQUMsQ0FBQyxDQUFDO3dCQUM1QixLQUFLLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDOzRCQUNyQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsTUFBTSxJQUFJLGVBQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dDQUN2RCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUN4QixDQUFDO3dCQUNGLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxPQUFPLENBQUMsSUFBcUQ7WUFDbkUsaUZBQWlGO1lBQ2pGLHdFQUF3RTtZQUN4RSw0Q0FBNEM7WUFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBQSw0QkFBb0IsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDMUYsb0JBQW9CLEVBQUUsNEJBQW9CO2dCQUMxQyxTQUFTLEVBQUUsUUFBUTthQUNuQixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQ7O1dBRUc7UUFDSSxhQUFhLENBQUMsT0FBNEIsRUFBRSxLQUFhO1lBQy9ELElBQUksQ0FBQyxDQUFDLE9BQU8sWUFBWSxtQkFBbUIsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sOENBQXNDLEVBQUUsQ0FBQztnQkFDL0QsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFTyxXQUFXLENBQUMsV0FBZ0M7WUFDbkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0MsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sUUFBUSxHQUFHLGVBQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQ3pFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUVELDZDQUE2QztZQUM3QyxLQUFLLE1BQU0sRUFBRSxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzFFLElBQUksVUFBVSxFQUFFLENBQUM7b0JBQ2hCLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQzt3QkFDdEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3ZDLENBQUM7b0JBQ0QsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFTyxVQUFVLENBQUMsTUFBYyxFQUFFLElBQXNCO1lBQ3hELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBRSxDQUFDO1lBQ2xGLE1BQU0sS0FBSyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDLENBQUM7WUFDeEgsTUFBTSxXQUFXLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFFLGVBQWUsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztZQUV6RCxJQUFJLFdBQVcsQ0FBQyxLQUFLLEtBQUssQ0FBQyxJQUFJLElBQUEsa0RBQStCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDdkgsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDM0MsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDZixXQUFXLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDO2dCQUMxQyxXQUFXLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUM7Z0JBQzVDLFdBQVcsQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQztZQUM5QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLFNBQVMsQ0FBQyxJQUFzQjtZQUN2QyxNQUFNLE1BQU0sR0FBRyxlQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFbEQscUVBQXFFO1lBQ3JFLEtBQUssTUFBTSxRQUFRLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3RCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLFVBQVUsRUFBRSxDQUFDO3dCQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM3QixNQUFNO29CQUNQLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO0tBQ0QsQ0FBQTtJQXJNWSx3Q0FBYzs2QkFBZCxjQUFjO1FBbUJ4QixXQUFBLDBCQUFZLENBQUE7UUFDWixXQUFBLHNDQUFrQixDQUFBO09BcEJSLGNBQWMsQ0FxTTFCIn0=