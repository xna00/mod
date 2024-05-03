/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/tree", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/symbols", "vs/base/common/diff/diff", "vs/base/common/event", "vs/base/common/iterator"], function (require, exports, tree_1, arrays_1, async_1, symbols_1, diff_1, event_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexTreeModel = void 0;
    exports.isFilterResult = isFilterResult;
    exports.getVisibleState = getVisibleState;
    function isFilterResult(obj) {
        return typeof obj === 'object' && 'visibility' in obj && 'data' in obj;
    }
    function getVisibleState(visibility) {
        switch (visibility) {
            case true: return 1 /* TreeVisibility.Visible */;
            case false: return 0 /* TreeVisibility.Hidden */;
            default: return visibility;
        }
    }
    function isCollapsibleStateUpdate(update) {
        return typeof update.collapsible === 'boolean';
    }
    class IndexTreeModel {
        constructor(user, list, rootElement, options = {}) {
            this.user = user;
            this.list = list;
            this.rootRef = [];
            this.eventBufferer = new event_1.EventBufferer();
            this._onDidChangeCollapseState = new event_1.Emitter();
            this.onDidChangeCollapseState = this.eventBufferer.wrapEvent(this._onDidChangeCollapseState.event);
            this._onDidChangeRenderNodeCount = new event_1.Emitter();
            this.onDidChangeRenderNodeCount = this.eventBufferer.wrapEvent(this._onDidChangeRenderNodeCount.event);
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this.refilterDelayer = new async_1.Delayer(symbols_1.MicrotaskDelay);
            this.collapseByDefault = typeof options.collapseByDefault === 'undefined' ? false : options.collapseByDefault;
            this.allowNonCollapsibleParents = options.allowNonCollapsibleParents ?? false;
            this.filter = options.filter;
            this.autoExpandSingleChildren = typeof options.autoExpandSingleChildren === 'undefined' ? false : options.autoExpandSingleChildren;
            this.root = {
                parent: undefined,
                element: rootElement,
                children: [],
                depth: 0,
                visibleChildrenCount: 0,
                visibleChildIndex: -1,
                collapsible: false,
                collapsed: false,
                renderNodeCount: 0,
                visibility: 1 /* TreeVisibility.Visible */,
                visible: true,
                filterData: undefined
            };
        }
        splice(location, deleteCount, toInsert = iterator_1.Iterable.empty(), options = {}) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            if (options.diffIdentityProvider) {
                this.spliceSmart(options.diffIdentityProvider, location, deleteCount, toInsert, options);
            }
            else {
                this.spliceSimple(location, deleteCount, toInsert, options);
            }
        }
        spliceSmart(identity, location, deleteCount, toInsertIterable = iterator_1.Iterable.empty(), options, recurseLevels = options.diffDepth ?? 0) {
            const { parentNode } = this.getParentNodeWithListIndex(location);
            if (!parentNode.lastDiffIds) {
                return this.spliceSimple(location, deleteCount, toInsertIterable, options);
            }
            const toInsert = [...toInsertIterable];
            const index = location[location.length - 1];
            const diff = new diff_1.LcsDiff({ getElements: () => parentNode.lastDiffIds }, {
                getElements: () => [
                    ...parentNode.children.slice(0, index),
                    ...toInsert,
                    ...parentNode.children.slice(index + deleteCount),
                ].map(e => identity.getId(e.element).toString())
            }).ComputeDiff(false);
            // if we were given a 'best effort' diff, use default behavior
            if (diff.quitEarly) {
                parentNode.lastDiffIds = undefined;
                return this.spliceSimple(location, deleteCount, toInsert, options);
            }
            const locationPrefix = location.slice(0, -1);
            const recurseSplice = (fromOriginal, fromModified, count) => {
                if (recurseLevels > 0) {
                    for (let i = 0; i < count; i++) {
                        fromOriginal--;
                        fromModified--;
                        this.spliceSmart(identity, [...locationPrefix, fromOriginal, 0], Number.MAX_SAFE_INTEGER, toInsert[fromModified].children, options, recurseLevels - 1);
                    }
                }
            };
            let lastStartO = Math.min(parentNode.children.length, index + deleteCount);
            let lastStartM = toInsert.length;
            for (const change of diff.changes.sort((a, b) => b.originalStart - a.originalStart)) {
                recurseSplice(lastStartO, lastStartM, lastStartO - (change.originalStart + change.originalLength));
                lastStartO = change.originalStart;
                lastStartM = change.modifiedStart - index;
                this.spliceSimple([...locationPrefix, lastStartO], change.originalLength, iterator_1.Iterable.slice(toInsert, lastStartM, lastStartM + change.modifiedLength), options);
            }
            // at this point, startO === startM === count since any remaining prefix should match
            recurseSplice(lastStartO, lastStartM, lastStartO);
        }
        spliceSimple(location, deleteCount, toInsert = iterator_1.Iterable.empty(), { onDidCreateNode, onDidDeleteNode, diffIdentityProvider }) {
            const { parentNode, listIndex, revealed, visible } = this.getParentNodeWithListIndex(location);
            const treeListElementsToInsert = [];
            const nodesToInsertIterator = iterator_1.Iterable.map(toInsert, el => this.createTreeNode(el, parentNode, parentNode.visible ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */, revealed, treeListElementsToInsert, onDidCreateNode));
            const lastIndex = location[location.length - 1];
            // figure out what's the visible child start index right before the
            // splice point
            let visibleChildStartIndex = 0;
            for (let i = lastIndex; i >= 0 && i < parentNode.children.length; i--) {
                const child = parentNode.children[i];
                if (child.visible) {
                    visibleChildStartIndex = child.visibleChildIndex;
                    break;
                }
            }
            const nodesToInsert = [];
            let insertedVisibleChildrenCount = 0;
            let renderNodeCount = 0;
            for (const child of nodesToInsertIterator) {
                nodesToInsert.push(child);
                renderNodeCount += child.renderNodeCount;
                if (child.visible) {
                    child.visibleChildIndex = visibleChildStartIndex + insertedVisibleChildrenCount++;
                }
            }
            const deletedNodes = (0, arrays_1.splice)(parentNode.children, lastIndex, deleteCount, nodesToInsert);
            if (!diffIdentityProvider) {
                parentNode.lastDiffIds = undefined;
            }
            else if (parentNode.lastDiffIds) {
                (0, arrays_1.splice)(parentNode.lastDiffIds, lastIndex, deleteCount, nodesToInsert.map(n => diffIdentityProvider.getId(n.element).toString()));
            }
            else {
                parentNode.lastDiffIds = parentNode.children.map(n => diffIdentityProvider.getId(n.element).toString());
            }
            // figure out what is the count of deleted visible children
            let deletedVisibleChildrenCount = 0;
            for (const child of deletedNodes) {
                if (child.visible) {
                    deletedVisibleChildrenCount++;
                }
            }
            // and adjust for all visible children after the splice point
            if (deletedVisibleChildrenCount !== 0) {
                for (let i = lastIndex + nodesToInsert.length; i < parentNode.children.length; i++) {
                    const child = parentNode.children[i];
                    if (child.visible) {
                        child.visibleChildIndex -= deletedVisibleChildrenCount;
                    }
                }
            }
            // update parent's visible children count
            parentNode.visibleChildrenCount += insertedVisibleChildrenCount - deletedVisibleChildrenCount;
            if (revealed && visible) {
                const visibleDeleteCount = deletedNodes.reduce((r, node) => r + (node.visible ? node.renderNodeCount : 0), 0);
                this._updateAncestorsRenderNodeCount(parentNode, renderNodeCount - visibleDeleteCount);
                this.list.splice(listIndex, visibleDeleteCount, treeListElementsToInsert);
            }
            if (deletedNodes.length > 0 && onDidDeleteNode) {
                const visit = (node) => {
                    onDidDeleteNode(node);
                    node.children.forEach(visit);
                };
                deletedNodes.forEach(visit);
            }
            this._onDidSplice.fire({ insertedNodes: nodesToInsert, deletedNodes });
            let node = parentNode;
            while (node) {
                if (node.visibility === 2 /* TreeVisibility.Recurse */) {
                    // delayed to avoid excessive refiltering, see #135941
                    this.refilterDelayer.trigger(() => this.refilter());
                    break;
                }
                node = node.parent;
            }
        }
        rerender(location) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const { node, listIndex, revealed } = this.getTreeNodeWithListIndex(location);
            if (node.visible && revealed) {
                this.list.splice(listIndex, 1, [node]);
            }
        }
        updateElementHeight(location, height) {
            if (location.length === 0) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const { listIndex } = this.getTreeNodeWithListIndex(location);
            this.list.updateElementHeight(listIndex, height);
        }
        has(location) {
            return this.hasTreeNode(location);
        }
        getListIndex(location) {
            const { listIndex, visible, revealed } = this.getTreeNodeWithListIndex(location);
            return visible && revealed ? listIndex : -1;
        }
        getListRenderCount(location) {
            return this.getTreeNode(location).renderNodeCount;
        }
        isCollapsible(location) {
            return this.getTreeNode(location).collapsible;
        }
        setCollapsible(location, collapsible) {
            const node = this.getTreeNode(location);
            if (typeof collapsible === 'undefined') {
                collapsible = !node.collapsible;
            }
            const update = { collapsible };
            return this.eventBufferer.bufferEvents(() => this._setCollapseState(location, update));
        }
        isCollapsed(location) {
            return this.getTreeNode(location).collapsed;
        }
        setCollapsed(location, collapsed, recursive) {
            const node = this.getTreeNode(location);
            if (typeof collapsed === 'undefined') {
                collapsed = !node.collapsed;
            }
            const update = { collapsed, recursive: recursive || false };
            return this.eventBufferer.bufferEvents(() => this._setCollapseState(location, update));
        }
        _setCollapseState(location, update) {
            const { node, listIndex, revealed } = this.getTreeNodeWithListIndex(location);
            const result = this._setListNodeCollapseState(node, listIndex, revealed, update);
            if (node !== this.root && this.autoExpandSingleChildren && result && !isCollapsibleStateUpdate(update) && node.collapsible && !node.collapsed && !update.recursive) {
                let onlyVisibleChildIndex = -1;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (child.visible) {
                        if (onlyVisibleChildIndex > -1) {
                            onlyVisibleChildIndex = -1;
                            break;
                        }
                        else {
                            onlyVisibleChildIndex = i;
                        }
                    }
                }
                if (onlyVisibleChildIndex > -1) {
                    this._setCollapseState([...location, onlyVisibleChildIndex], update);
                }
            }
            return result;
        }
        _setListNodeCollapseState(node, listIndex, revealed, update) {
            const result = this._setNodeCollapseState(node, update, false);
            if (!revealed || !node.visible || !result) {
                return result;
            }
            const previousRenderNodeCount = node.renderNodeCount;
            const toInsert = this.updateNodeAfterCollapseChange(node);
            const deleteCount = previousRenderNodeCount - (listIndex === -1 ? 0 : 1);
            this.list.splice(listIndex + 1, deleteCount, toInsert.slice(1));
            return result;
        }
        _setNodeCollapseState(node, update, deep) {
            let result;
            if (node === this.root) {
                result = false;
            }
            else {
                if (isCollapsibleStateUpdate(update)) {
                    result = node.collapsible !== update.collapsible;
                    node.collapsible = update.collapsible;
                }
                else if (!node.collapsible) {
                    result = false;
                }
                else {
                    result = node.collapsed !== update.collapsed;
                    node.collapsed = update.collapsed;
                }
                if (result) {
                    this._onDidChangeCollapseState.fire({ node, deep });
                }
            }
            if (!isCollapsibleStateUpdate(update) && update.recursive) {
                for (const child of node.children) {
                    result = this._setNodeCollapseState(child, update, true) || result;
                }
            }
            return result;
        }
        expandTo(location) {
            this.eventBufferer.bufferEvents(() => {
                let node = this.getTreeNode(location);
                while (node.parent) {
                    node = node.parent;
                    location = location.slice(0, location.length - 1);
                    if (node.collapsed) {
                        this._setCollapseState(location, { collapsed: false, recursive: false });
                    }
                }
            });
        }
        refilter() {
            const previousRenderNodeCount = this.root.renderNodeCount;
            const toInsert = this.updateNodeAfterFilterChange(this.root);
            this.list.splice(0, previousRenderNodeCount, toInsert);
            this.refilterDelayer.cancel();
        }
        createTreeNode(treeElement, parent, parentVisibility, revealed, treeListElements, onDidCreateNode) {
            const node = {
                parent,
                element: treeElement.element,
                children: [],
                depth: parent.depth + 1,
                visibleChildrenCount: 0,
                visibleChildIndex: -1,
                collapsible: typeof treeElement.collapsible === 'boolean' ? treeElement.collapsible : (typeof treeElement.collapsed !== 'undefined'),
                collapsed: typeof treeElement.collapsed === 'undefined' ? this.collapseByDefault : treeElement.collapsed,
                renderNodeCount: 1,
                visibility: 1 /* TreeVisibility.Visible */,
                visible: true,
                filterData: undefined
            };
            const visibility = this._filterNode(node, parentVisibility);
            node.visibility = visibility;
            if (revealed) {
                treeListElements.push(node);
            }
            const childElements = treeElement.children || iterator_1.Iterable.empty();
            const childRevealed = revealed && visibility !== 0 /* TreeVisibility.Hidden */ && !node.collapsed;
            let visibleChildrenCount = 0;
            let renderNodeCount = 1;
            for (const el of childElements) {
                const child = this.createTreeNode(el, node, visibility, childRevealed, treeListElements, onDidCreateNode);
                node.children.push(child);
                renderNodeCount += child.renderNodeCount;
                if (child.visible) {
                    child.visibleChildIndex = visibleChildrenCount++;
                }
            }
            if (!this.allowNonCollapsibleParents) {
                node.collapsible = node.collapsible || node.children.length > 0;
            }
            node.visibleChildrenCount = visibleChildrenCount;
            node.visible = visibility === 2 /* TreeVisibility.Recurse */ ? visibleChildrenCount > 0 : (visibility === 1 /* TreeVisibility.Visible */);
            if (!node.visible) {
                node.renderNodeCount = 0;
                if (revealed) {
                    treeListElements.pop();
                }
            }
            else if (!node.collapsed) {
                node.renderNodeCount = renderNodeCount;
            }
            onDidCreateNode?.(node);
            return node;
        }
        updateNodeAfterCollapseChange(node) {
            const previousRenderNodeCount = node.renderNodeCount;
            const result = [];
            this._updateNodeAfterCollapseChange(node, result);
            this._updateAncestorsRenderNodeCount(node.parent, result.length - previousRenderNodeCount);
            return result;
        }
        _updateNodeAfterCollapseChange(node, result) {
            if (node.visible === false) {
                return 0;
            }
            result.push(node);
            node.renderNodeCount = 1;
            if (!node.collapsed) {
                for (const child of node.children) {
                    node.renderNodeCount += this._updateNodeAfterCollapseChange(child, result);
                }
            }
            this._onDidChangeRenderNodeCount.fire(node);
            return node.renderNodeCount;
        }
        updateNodeAfterFilterChange(node) {
            const previousRenderNodeCount = node.renderNodeCount;
            const result = [];
            this._updateNodeAfterFilterChange(node, node.visible ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */, result);
            this._updateAncestorsRenderNodeCount(node.parent, result.length - previousRenderNodeCount);
            return result;
        }
        _updateNodeAfterFilterChange(node, parentVisibility, result, revealed = true) {
            let visibility;
            if (node !== this.root) {
                visibility = this._filterNode(node, parentVisibility);
                if (visibility === 0 /* TreeVisibility.Hidden */) {
                    node.visible = false;
                    node.renderNodeCount = 0;
                    return false;
                }
                if (revealed) {
                    result.push(node);
                }
            }
            const resultStartLength = result.length;
            node.renderNodeCount = node === this.root ? 0 : 1;
            let hasVisibleDescendants = false;
            if (!node.collapsed || visibility !== 0 /* TreeVisibility.Hidden */) {
                let visibleChildIndex = 0;
                for (const child of node.children) {
                    hasVisibleDescendants = this._updateNodeAfterFilterChange(child, visibility, result, revealed && !node.collapsed) || hasVisibleDescendants;
                    if (child.visible) {
                        child.visibleChildIndex = visibleChildIndex++;
                    }
                }
                node.visibleChildrenCount = visibleChildIndex;
            }
            else {
                node.visibleChildrenCount = 0;
            }
            if (node !== this.root) {
                node.visible = visibility === 2 /* TreeVisibility.Recurse */ ? hasVisibleDescendants : (visibility === 1 /* TreeVisibility.Visible */);
                node.visibility = visibility;
            }
            if (!node.visible) {
                node.renderNodeCount = 0;
                if (revealed) {
                    result.pop();
                }
            }
            else if (!node.collapsed) {
                node.renderNodeCount += result.length - resultStartLength;
            }
            this._onDidChangeRenderNodeCount.fire(node);
            return node.visible;
        }
        _updateAncestorsRenderNodeCount(node, diff) {
            if (diff === 0) {
                return;
            }
            while (node) {
                node.renderNodeCount += diff;
                this._onDidChangeRenderNodeCount.fire(node);
                node = node.parent;
            }
        }
        _filterNode(node, parentVisibility) {
            const result = this.filter ? this.filter.filter(node.element, parentVisibility) : 1 /* TreeVisibility.Visible */;
            if (typeof result === 'boolean') {
                node.filterData = undefined;
                return result ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
            }
            else if (isFilterResult(result)) {
                node.filterData = result.data;
                return getVisibleState(result.visibility);
            }
            else {
                node.filterData = undefined;
                return getVisibleState(result);
            }
        }
        // cheap
        hasTreeNode(location, node = this.root) {
            if (!location || location.length === 0) {
                return true;
            }
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                return false;
            }
            return this.hasTreeNode(rest, node.children[index]);
        }
        // cheap
        getTreeNode(location, node = this.root) {
            if (!location || location.length === 0) {
                return node;
            }
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            return this.getTreeNode(rest, node.children[index]);
        }
        // expensive
        getTreeNodeWithListIndex(location) {
            if (location.length === 0) {
                return { node: this.root, listIndex: -1, revealed: true, visible: false };
            }
            const { parentNode, listIndex, revealed, visible } = this.getParentNodeWithListIndex(location);
            const index = location[location.length - 1];
            if (index < 0 || index > parentNode.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            const node = parentNode.children[index];
            return { node, listIndex, revealed, visible: visible && node.visible };
        }
        getParentNodeWithListIndex(location, node = this.root, listIndex = 0, revealed = true, visible = true) {
            const [index, ...rest] = location;
            if (index < 0 || index > node.children.length) {
                throw new tree_1.TreeError(this.user, 'Invalid tree location');
            }
            // TODO@joao perf!
            for (let i = 0; i < index; i++) {
                listIndex += node.children[i].renderNodeCount;
            }
            revealed = revealed && !node.collapsed;
            visible = visible && node.visible;
            if (rest.length === 0) {
                return { parentNode: node, listIndex, revealed, visible };
            }
            return this.getParentNodeWithListIndex(rest, node.children[index], listIndex + 1, revealed, visible);
        }
        getNode(location = []) {
            return this.getTreeNode(location);
        }
        // TODO@joao perf!
        getNodeLocation(node) {
            const location = [];
            let indexTreeNode = node; // typing woes
            while (indexTreeNode.parent) {
                location.push(indexTreeNode.parent.children.indexOf(indexTreeNode));
                indexTreeNode = indexTreeNode.parent;
            }
            return location.reverse();
        }
        getParentNodeLocation(location) {
            if (location.length === 0) {
                return undefined;
            }
            else if (location.length === 1) {
                return [];
            }
            else {
                return (0, arrays_1.tail2)(location)[0];
            }
        }
        getFirstElementChild(location) {
            const node = this.getTreeNode(location);
            if (node.children.length === 0) {
                return undefined;
            }
            return node.children[0].element;
        }
        getLastElementAncestor(location = []) {
            const node = this.getTreeNode(location);
            if (node.children.length === 0) {
                return undefined;
            }
            return this._getLastElementAncestor(node);
        }
        _getLastElementAncestor(node) {
            if (node.children.length === 0) {
                return node.element;
            }
            return this._getLastElementAncestor(node.children[node.children.length - 1]);
        }
    }
    exports.IndexTreeModel = IndexTreeModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhUcmVlTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS90cmVlL2luZGV4VHJlZU1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEcsd0NBRUM7SUFFRCwwQ0FNQztJQVZELFNBQWdCLGNBQWMsQ0FBSSxHQUFRO1FBQ3pDLE9BQU8sT0FBTyxHQUFHLEtBQUssUUFBUSxJQUFJLFlBQVksSUFBSSxHQUFHLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQztJQUN4RSxDQUFDO0lBRUQsU0FBZ0IsZUFBZSxDQUFDLFVBQW9DO1FBQ25FLFFBQVEsVUFBVSxFQUFFLENBQUM7WUFDcEIsS0FBSyxJQUFJLENBQUMsQ0FBQyxzQ0FBOEI7WUFDekMsS0FBSyxLQUFLLENBQUMsQ0FBQyxxQ0FBNkI7WUFDekMsT0FBTyxDQUFDLENBQUMsT0FBTyxVQUFVLENBQUM7UUFDNUIsQ0FBQztJQUNGLENBQUM7SUFnREQsU0FBUyx3QkFBd0IsQ0FBQyxNQUEyQjtRQUM1RCxPQUFPLE9BQVEsTUFBYyxDQUFDLFdBQVcsS0FBSyxTQUFTLENBQUM7SUFDekQsQ0FBQztJQU1ELE1BQWEsY0FBYztRQXVCMUIsWUFDUyxJQUFZLEVBQ1osSUFBc0MsRUFDOUMsV0FBYyxFQUNkLFVBQWtELEVBQUU7WUFINUMsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUNaLFNBQUksR0FBSixJQUFJLENBQWtDO1lBdkJ0QyxZQUFPLEdBQUcsRUFBRSxDQUFDO1lBR2Qsa0JBQWEsR0FBRyxJQUFJLHFCQUFhLEVBQUUsQ0FBQztZQUUzQiw4QkFBeUIsR0FBRyxJQUFJLGVBQU8sRUFBNkMsQ0FBQztZQUM3Riw2QkFBd0IsR0FBcUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHlCQUF5QixD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