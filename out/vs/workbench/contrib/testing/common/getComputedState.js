/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/workbench/contrib/testing/common/testingStates"], function (require, exports, iterator_1, testingStates_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.refreshComputedState = void 0;
    const isDurationAccessor = (accessor) => 'getOwnDuration' in accessor;
    /**
     * Gets the computed state for the node.
     * @param force whether to refresh the computed state for this node, even
     * if it was previously set.
     */
    const getComputedState = (accessor, node, force = false) => {
        let computed = accessor.getCurrentComputedState(node);
        if (computed === undefined || force) {
            computed = accessor.getOwnState(node) ?? 0 /* TestResultState.Unset */;
            let childrenCount = 0;
            const stateMap = (0, testingStates_1.makeEmptyCounts)();
            for (const child of accessor.getChildren(node)) {
                const childComputed = getComputedState(accessor, child);
                childrenCount++;
                stateMap[childComputed]++;
                // If all children are skipped, make the current state skipped too if unset (#131537)
                computed = childComputed === 5 /* TestResultState.Skipped */ && computed === 0 /* TestResultState.Unset */
                    ? 5 /* TestResultState.Skipped */ : (0, testingStates_1.maxPriority)(computed, childComputed);
            }
            if (childrenCount > LARGE_NODE_THRESHOLD) {
                largeNodeChildrenStates.set(node, stateMap);
            }
            accessor.setComputedState(node, computed);
        }
        return computed;
    };
    const getComputedDuration = (accessor, node, force = false) => {
        let computed = accessor.getCurrentComputedDuration(node);
        if (computed === undefined || force) {
            const own = accessor.getOwnDuration(node);
            if (own !== undefined) {
                computed = own;
            }
            else {
                computed = undefined;
                for (const child of accessor.getChildren(node)) {
                    const d = getComputedDuration(accessor, child);
                    if (d !== undefined) {
                        computed = (computed || 0) + d;
                    }
                }
            }
            accessor.setComputedDuration(node, computed);
        }
        return computed;
    };
    const LARGE_NODE_THRESHOLD = 64;
    /**
     * Map of how many nodes have in each state. This is used to optimize state
     * computation in large nodes with children above the `LARGE_NODE_THRESHOLD`.
     */
    const largeNodeChildrenStates = new WeakMap();
    /**
     * Refreshes the computed state for the node and its parents. Any changes
     * elements cause `addUpdated` to be called.
     */
    const refreshComputedState = (accessor, node, explicitNewComputedState, refreshDuration = true) => {
        const oldState = accessor.getCurrentComputedState(node);
        const oldPriority = testingStates_1.statePriority[oldState];
        const newState = explicitNewComputedState ?? getComputedState(accessor, node, true);
        const newPriority = testingStates_1.statePriority[newState];
        const toUpdate = new Set();
        if (newPriority !== oldPriority) {
            accessor.setComputedState(node, newState);
            toUpdate.add(node);
            let moveFromState = oldState;
            let moveToState = newState;
            for (const parent of accessor.getParents(node)) {
                const lnm = largeNodeChildrenStates.get(parent);
                if (lnm) {
                    lnm[moveFromState]--;
                    lnm[moveToState]++;
                }
                const prev = accessor.getCurrentComputedState(parent);
                if (newPriority > oldPriority) {
                    // Update all parents to ensure they're at least this priority.
                    if (prev !== undefined && testingStates_1.statePriority[prev] >= newPriority) {
                        break;
                    }
                    if (lnm && lnm[moveToState] > 1) {
                        break;
                    }
                    // moveToState remains the same, the new higher priority node state
                    accessor.setComputedState(parent, newState);
                    toUpdate.add(parent);
                }
                else /* newProirity < oldPriority */ {
                    // Update all parts whose statese might have been based on this one
                    if (prev === undefined || testingStates_1.statePriority[prev] > oldPriority) {
                        break;
                    }
                    if (lnm && lnm[moveFromState] > 0) {
                        break;
                    }
                    moveToState = getComputedState(accessor, parent, true);
                    accessor.setComputedState(parent, moveToState);
                    toUpdate.add(parent);
                }
                moveFromState = prev;
            }
        }
        if (isDurationAccessor(accessor) && refreshDuration) {
            for (const parent of iterator_1.Iterable.concat(iterator_1.Iterable.single(node), accessor.getParents(node))) {
                const oldDuration = accessor.getCurrentComputedDuration(parent);
                const newDuration = getComputedDuration(accessor, parent, true);
                if (oldDuration === newDuration) {
                    break;
                }
                accessor.setComputedDuration(parent, newDuration);
                toUpdate.add(parent);
            }
        }
        return toUpdate;
    };
    exports.refreshComputedState = refreshComputedState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q29tcHV0ZWRTdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVzdGluZy9jb21tb24vZ2V0Q29tcHV0ZWRTdGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQU0sa0JBQWtCLEdBQUcsQ0FBSSxRQUFtQyxFQUFvRCxFQUFFLENBQUMsZ0JBQWdCLElBQUksUUFBUSxDQUFDO0lBRXRKOzs7O09BSUc7SUFFSCxNQUFNLGdCQUFnQixHQUFHLENBQW1CLFFBQW1DLEVBQUUsSUFBTyxFQUFFLEtBQUssR0FBRyxLQUFLLEVBQUUsRUFBRTtRQUMxRyxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEQsSUFBSSxRQUFRLEtBQUssU0FBUyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3JDLFFBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQ0FBeUIsQ0FBQztZQUUvRCxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDdEIsTUFBTSxRQUFRLEdBQUcsSUFBQSwrQkFBZSxHQUFFLENBQUM7WUFFbkMsS0FBSyxNQUFNLEtBQUssSUFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDeEQsYUFBYSxFQUFFLENBQUM7Z0JBQ2hCLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO2dCQUUxQixxRkFBcUY7Z0JBQ3JGLFFBQVEsR0FBRyxhQUFhLG9DQUE0QixJQUFJLFFBQVEsa0NBQTBCO29CQUN6RixDQUFDLGlDQUF5QixDQUFDLENBQUMsSUFBQSwy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