/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/iterator"], function (require, exports, indexTreeModel_1, tree_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ObjectTreeModel = void 0;
    class ObjectTreeModel {
        get size() { return this.nodes.size; }
        constructor(user, list, options = {}) {
            this.user = user;
            this.rootRef = null;
            this.nodes = new Map();
            this.nodesByIdentity = new Map();
            this.model = new indexTreeModel_1.IndexTreeModel(user, list, null, options);
            this.onDidSplice = this.model.onDidSplice;
            this.onDidChangeCollapseState = this.model.onDidChangeCollapseState;
            this.onDidChangeRenderNodeCount = this.model.onDidChangeRenderNodeCount;
            if (options.sorter) {
                this.sorter = {
                    compare(a, b) {
                        return options.sorter.compare(a.element, b.element);
                    }
                };
            }
            this.identityProvider = options.identityProvider;
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options = {}) {
            const location = this.getElementLocation(element);
            this._setChildren(location, this.preserveCollapseState(children), options);
        }
        _setChildren(location, children = iterator_1.Iterable.empty(), options) {
            const insertedElements = new Set();
            const insertedElementIds = new Set();
            const onDidCreateNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                insertedElements.add(tnode.element);
                this.nodes.set(tnode.element, tnode);
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    insertedElementIds.add(id);
                    this.nodesByIdentity.set(id, tnode);
                }
                options.onDidCreateNode?.(tnode);
            };
            const onDidDeleteNode = (node) => {
                if (node.element === null) {
                    return;
                }
                const tnode = node;
                if (!insertedElements.has(tnode.element)) {
                    this.nodes.delete(tnode.element);
                }
                if (this.identityProvider) {
                    const id = this.identityProvider.getId(tnode.element).toString();
                    if (!insertedElementIds.has(id)) {
                        this.nodesByIdentity.delete(id);
                    }
                }
                options.onDidDeleteNode?.(tnode);
            };
            this.model.splice([...location, 0], Number.MAX_VALUE, children, { ...options, onDidCreateNode, onDidDeleteNode });
        }
        preserveCollapseState(elements = iterator_1.Iterable.empty()) {
            if (this.sorter) {
                elements = [...elements].sort(this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(elements, treeElement => {
                let node = this.nodes.get(treeElement.element);
                if (!node && this.identityProvider) {
                    const id = this.identityProvider.getId(treeElement.element).toString();
                    node = this.nodesByIdentity.get(id);
                }
                if (!node) {
                    let collapsed;
                    if (typeof treeElement.collapsed === 'undefined') {
                        collapsed = undefined;
                    }
                    else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Collapsed || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed) {
                        collapsed = true;
                    }
                    else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Expanded || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                        collapsed = false;
                    }
                    else {
                        collapsed = Boolean(treeElement.collapsed);
                    }
                    return {
                        ...treeElement,
                        children: this.preserveCollapseState(treeElement.children),
                        collapsed
                    };
                }
                const collapsible = typeof treeElement.collapsible === 'boolean' ? treeElement.collapsible : node.collapsible;
                let collapsed;
                if (typeof treeElement.collapsed === 'undefined' || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed || treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                    collapsed = node.collapsed;
                }
                else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Collapsed) {
                    collapsed = true;
                }
                else if (treeElement.collapsed === tree_1.ObjectTreeElementCollapseState.Expanded) {
                    collapsed = false;
                }
                else {
                    collapsed = Boolean(treeElement.collapsed);
                }
                return {
                    ...treeElement,
                    collapsible,
                    collapsed,
                    children: this.preserveCollapseState(treeElement.children)
                };
            });
        }
        rerender(element) {
            const location = this.getElementLocation(element);
            this.model.rerender(location);
        }
        updateElementHeight(element, height) {
            const location = this.getElementLocation(element);
            this.model.updateElementHeight(location, height);
        }
        resort(element = null, recursive = true) {
            if (!this.sorter) {
                return;
            }
            const location = this.getElementLocation(element);
            const node = this.model.getNode(location);
            this._setChildren(location, this.resortChildren(node, recursive), {});
        }
        resortChildren(node, recursive, first = true) {
            let childrenNodes = [...node.children];
            if (recursive || first) {
                childrenNodes = childrenNodes.sort(this.sorter.compare.bind(this.sorter));
            }
            return iterator_1.Iterable.map(childrenNodes, node => ({
                element: node.element,
                collapsible: node.collapsible,
                collapsed: node.collapsed,
                children: this.resortChildren(node, recursive, false)
            }));
        }
        getFirstElementChild(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getFirstElementChild(location);
        }
        getLastElementAncestor(ref = null) {
            const location = this.getElementLocation(ref);
            return this.model.getLastElementAncestor(location);
        }
        has(element) {
            return this.nodes.has(element);
        }
        getListIndex(element) {
            const location = this.getElementLocation(element);
            return this.model.getListIndex(location);
        }
        getListRenderCount(element) {
            const location = this.getElementLocation(element);
            return this.model.getListRenderCount(location);
        }
        isCollapsible(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsible(location);
        }
        setCollapsible(element, collapsible) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsible(location, collapsible);
        }
        isCollapsed(element) {
            const location = this.getElementLocation(element);
            return this.model.isCollapsed(location);
        }
        setCollapsed(element, collapsed, recursive) {
            const location = this.getElementLocation(element);
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(element) {
            const location = this.getElementLocation(element);
            this.model.expandTo(location);
        }
        refilter() {
            this.model.refilter();
        }
        getNode(element = null) {
            if (element === null) {
                return this.model.getNode(this.model.rootRef);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return node;
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(element) {
            if (element === null) {
                throw new tree_1.TreeError(this.user, `Invalid getParentNodeLocation call`);
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            const location = this.model.getNodeLocation(node);
            const parentLocation = this.model.getParentNodeLocation(location);
            const parent = this.model.getNode(parentLocation);
            return parent.element;
        }
        getElementLocation(element) {
            if (element === null) {
                return [];
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return this.model.getNodeLocation(node);
        }
    }
    exports.ObjectTreeModel = ObjectTreeModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0VHJlZU1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdHJlZS9vYmplY3RUcmVlTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBd0JoRyxNQUFhLGVBQWU7UUFjM0IsSUFBSSxJQUFJLEtBQWEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFOUMsWUFDUyxJQUFZLEVBQ3BCLElBQXNDLEVBQ3RDLFVBQW1ELEVBQUU7WUFGN0MsU0FBSSxHQUFKLElBQUksQ0FBUTtZQWZaLFlBQU8sR0FBRyxJQUFJLENBQUM7WUFHaEIsVUFBSyxHQUFHLElBQUksR0FBRyxFQUF1QyxDQUFDO1lBQzlDLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7WUFlL0UsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLCtCQUFjLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUMxQyxJQUFJLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBNEUsQ0FBQztZQUN4SCxJQUFJLENBQUMsMEJBQTBCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywwQkFBOEQsQ0FBQztZQUU1RyxJQUFJLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLE1BQU0sR0FBRztvQkFDYixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ1gsT0FBTyxPQUFPLENBQUMsTUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENB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