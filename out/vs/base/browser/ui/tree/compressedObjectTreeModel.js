/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/browser/ui/tree/tree", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/iterator"], function (require, exports, objectTreeModel_1, tree_1, arrays_1, event_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompressibleObjectTreeModel = exports.DefaultElementMapper = exports.CompressedObjectTreeModel = void 0;
    exports.compress = compress;
    exports.decompress = decompress;
    function noCompress(element) {
        const elements = [element.element];
        const incompressible = element.incompressible || false;
        return {
            element: { elements, incompressible },
            children: iterator_1.Iterable.map(iterator_1.Iterable.from(element.children), noCompress),
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    // Exported only for test reasons, do not use directly
    function compress(element) {
        const elements = [element.element];
        const incompressible = element.incompressible || false;
        let childrenIterator;
        let children;
        while (true) {
            [children, childrenIterator] = iterator_1.Iterable.consume(iterator_1.Iterable.from(element.children), 2);
            if (children.length !== 1) {
                break;
            }
            if (children[0].incompressible) {
                break;
            }
            element = children[0];
            elements.push(element.element);
        }
        return {
            element: { elements, incompressible },
            children: iterator_1.Iterable.map(iterator_1.Iterable.concat(children, childrenIterator), compress),
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    function _decompress(element, index = 0) {
        let children;
        if (index < element.element.elements.length - 1) {
            children = [_decompress(element, index + 1)];
        }
        else {
            children = iterator_1.Iterable.map(iterator_1.Iterable.from(element.children), el => _decompress(el, 0));
        }
        if (index === 0 && element.element.incompressible) {
            return {
                element: element.element.elements[index],
                children,
                incompressible: true,
                collapsible: element.collapsible,
                collapsed: element.collapsed
            };
        }
        return {
            element: element.element.elements[index],
            children,
            collapsible: element.collapsible,
            collapsed: element.collapsed
        };
    }
    // Exported only for test reasons, do not use directly
    function decompress(element) {
        return _decompress(element, 0);
    }
    function splice(treeElement, element, children) {
        if (treeElement.element === element) {
            return { ...treeElement, children };
        }
        return { ...treeElement, children: iterator_1.Iterable.map(iterator_1.Iterable.from(treeElement.children), e => splice(e, element, children)) };
    }
    const wrapIdentityProvider = (base) => ({
        getId(node) {
            return node.elements.map(e => base.getId(e).toString()).join('\0');
        }
    });
    // Exported only for test reasons, do not use directly
    class CompressedObjectTreeModel {
        get onDidSplice() { return this.model.onDidSplice; }
        get onDidChangeCollapseState() { return this.model.onDidChangeCollapseState; }
        get onDidChangeRenderNodeCount() { return this.model.onDidChangeRenderNodeCount; }
        get size() { return this.nodes.size; }
        constructor(user, list, options = {}) {
            this.user = user;
            this.rootRef = null;
            this.nodes = new Map();
            this.model = new objectTreeModel_1.ObjectTreeModel(user, list, options);
            this.enabled = typeof options.compressionEnabled === 'undefined' ? true : options.compressionEnabled;
            this.identityProvider = options.identityProvider;
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options) {
            // Diffs must be deep, since the compression can affect nested elements.
            // @see https://github.com/microsoft/vscode/pull/114237#issuecomment-759425034
            const diffIdentityProvider = options.diffIdentityProvider && wrapIdentityProvider(options.diffIdentityProvider);
            if (element === null) {
                const compressedChildren = iterator_1.Iterable.map(children, this.enabled ? compress : noCompress);
                this._setChildren(null, compressedChildren, { diffIdentityProvider, diffDepth: Infinity });
                return;
            }
            const compressedNode = this.nodes.get(element);
            if (!compressedNode) {
                throw new tree_1.TreeError(this.user, 'Unknown compressed tree node');
            }
            const node = this.model.getNode(compressedNode);
            const compressedParentNode = this.model.getParentNodeLocation(compressedNode);
            const parent = this.model.getNode(compressedParentNode);
            const decompressedElement = decompress(node);
            const splicedElement = splice(decompressedElement, element, children);
            const recompressedElement = (this.enabled ? compress : noCompress)(splicedElement);
            // If the recompressed node is identical to the original, just set its children.
            // Saves work and churn diffing the parent element.
            const elementComparator = options.diffIdentityProvider
                ? ((a, b) => options.diffIdentityProvider.getId(a) === options.diffIdentityProvider.getId(b))
                : undefined;
            if ((0, arrays_1.equals)(recompressedElement.element.elements, node.element.elements, elementComparator)) {
                this._setChildren(compressedNode, recompressedElement.children || iterator_1.Iterable.empty(), { diffIdentityProvider, diffDepth: 1 });
                return;
            }
            const parentChildren = parent.children
                .map(child => child === node ? recompressedElement : child);
            this._setChildren(parent.element, parentChildren, {
                diffIdentityProvider,
                diffDepth: node.depth - parent.depth,
            });
        }
        isCompressionEnabled() {
            return this.enabled;
        }
        setCompressionEnabled(enabled) {
            if (enabled === this.enabled) {
                return;
            }
            this.enabled = enabled;
            const root = this.model.getNode();
            const rootChildren = root.children;
            const decompressedRootChildren = iterator_1.Iterable.map(rootChildren, decompress);
            const recompressedRootChildren = iterator_1.Iterable.map(decompressedRootChildren, enabled ? compress : noCompress);
            // it should be safe to always use deep diff mode here if an identity
            // provider is available, since we know the raw nodes are unchanged.
            this._setChildren(null, recompressedRootChildren, {
                diffIdentityProvider: this.identityProvider,
                diffDepth: Infinity,
            });
        }
        _setChildren(node, children, options) {
            const insertedElements = new Set();
            const onDidCreateNode = (node) => {
                for (const element of node.element.elements) {
                    insertedElements.add(element);
                    this.nodes.set(element, node.element);
                }
            };
            const onDidDeleteNode = (node) => {
                for (const element of node.element.elements) {
                    if (!insertedElements.has(element)) {
                        this.nodes.delete(element);
                    }
                }
            };
            this.model.setChildren(node, children, { ...options, onDidCreateNode, onDidDeleteNode });
        }
        has(element) {
            return this.nodes.has(element);
        }
        getListIndex(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListIndex(node);
        }
        getListRenderCount(location) {
            const node = this.getCompressedNode(location);
            return this.model.getListRenderCount(node);
        }
        getNode(location) {
            if (typeof location === 'undefined') {
                return this.model.getNode();
            }
            const node = this.getCompressedNode(location);
            return this.model.getNode(node);
        }
        // TODO: review this
        getNodeLocation(node) {
            const compressedNode = this.model.getNodeLocation(node);
            if (compressedNode === null) {
                return null;
            }
            return compressedNode.elements[compressedNode.elements.length - 1];
        }
        // TODO: review this
        getParentNodeLocation(location) {
            const compressedNode = this.getCompressedNode(location);
            const parentNode = this.model.getParentNodeLocation(compressedNode);
            if (parentNode === null) {
                return null;
            }
            return parentNode.elements[parentNode.elements.length - 1];
        }
        getFirstElementChild(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.getFirstElementChild(compressedNode);
        }
        getLastElementAncestor(location) {
            const compressedNode = typeof location === 'undefined' ? undefined : this.getCompressedNode(location);
            return this.model.getLastElementAncestor(compressedNode);
        }
        isCollapsible(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsible(compressedNode);
        }
        setCollapsible(location, collapsible) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.setCollapsible(compressedNode, collapsible);
        }
        isCollapsed(location) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.isCollapsed(compressedNode);
        }
        setCollapsed(location, collapsed, recursive) {
            const compressedNode = this.getCompressedNode(location);
            return this.model.setCollapsed(compressedNode, collapsed, recursive);
        }
        expandTo(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.expandTo(compressedNode);
        }
        rerender(location) {
            const compressedNode = this.getCompressedNode(location);
            this.model.rerender(compressedNode);
        }
        updateElementHeight(element, height) {
            const compressedNode = this.getCompressedNode(element);
            if (!compressedNode) {
                return;
            }
            this.model.updateElementHeight(compressedNode, height);
        }
        refilter() {
            this.model.refilter();
        }
        resort(location = null, recursive = true) {
            const compressedNode = this.getCompressedNode(location);
            this.model.resort(compressedNode, recursive);
        }
        getCompressedNode(element) {
            if (element === null) {
                return null;
            }
            const node = this.nodes.get(element);
            if (!node) {
                throw new tree_1.TreeError(this.user, `Tree element not found: ${element}`);
            }
            return node;
        }
    }
    exports.CompressedObjectTreeModel = CompressedObjectTreeModel;
    const DefaultElementMapper = elements => elements[elements.length - 1];
    exports.DefaultElementMapper = DefaultElementMapper;
    class CompressedTreeNodeWrapper {
        get element() { return this.node.element === null ? null : this.unwrapper(this.node.element); }
        get children() { return this.node.children.map(node => new CompressedTreeNodeWrapper(this.unwrapper, node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
        constructor(unwrapper, node) {
            this.unwrapper = unwrapper;
            this.node = node;
        }
    }
    function mapList(nodeMapper, list) {
        return {
            splice(start, deleteCount, toInsert) {
                list.splice(start, deleteCount, toInsert.map(node => nodeMapper.map(node)));
            },
            updateElementHeight(index, height) {
                list.updateElementHeight(index, height);
            }
        };
    }
    function mapOptions(compressedNodeUnwrapper, options) {
        return {
            ...options,
            identityProvider: options.identityProvider && {
                getId(node) {
                    return options.identityProvider.getId(compressedNodeUnwrapper(node));
                }
            },
            sorter: options.sorter && {
                compare(node, otherNode) {
                    return options.sorter.compare(node.elements[0], otherNode.elements[0]);
                }
            },
            filter: options.filter && {
                filter(node, parentVisibility) {
                    return options.filter.filter(compressedNodeUnwrapper(node), parentVisibility);
                }
            }
        };
    }
    class CompressibleObjectTreeModel {
        get onDidSplice() {
            return event_1.Event.map(this.model.onDidSplice, ({ insertedNodes, deletedNodes }) => ({
                insertedNodes: insertedNodes.map(node => this.nodeMapper.map(node)),
                deletedNodes: deletedNodes.map(node => this.nodeMapper.map(node)),
            }));
        }
        get onDidChangeCollapseState() {
            return event_1.Event.map(this.model.onDidChangeCollapseState, ({ node, deep }) => ({
                node: this.nodeMapper.map(node),
                deep
            }));
        }
        get onDidChangeRenderNodeCount() {
            return event_1.Event.map(this.model.onDidChangeRenderNodeCount, node => this.nodeMapper.map(node));
        }
        constructor(user, list, options = {}) {
            this.rootRef = null;
            this.elementMapper = options.elementMapper || exports.DefaultElementMapper;
            const compressedNodeUnwrapper = node => this.elementMapper(node.elements);
            this.nodeMapper = new tree_1.WeakMapper(node => new CompressedTreeNodeWrapper(compressedNodeUnwrapper, node));
            this.model = new CompressedObjectTreeModel(user, mapList(this.nodeMapper, list), mapOptions(compressedNodeUnwrapper, options));
        }
        setChildren(element, children = iterator_1.Iterable.empty(), options = {}) {
            this.model.setChildren(element, children, options);
        }
        isCompressionEnabled() {
            return this.model.isCompressionEnabled();
        }
        setCompressionEnabled(enabled) {
            this.model.setCompressionEnabled(enabled);
        }
        has(location) {
            return this.model.has(location);
        }
        getListIndex(location) {
            return this.model.getListIndex(location);
        }
        getListRenderCount(location) {
            return this.model.getListRenderCount(location);
        }
        getNode(location) {
            return this.nodeMapper.map(this.model.getNode(location));
        }
        getNodeLocation(node) {
            return node.element;
        }
        getParentNodeLocation(location) {
            return this.model.getParentNodeLocation(location);
        }
        getFirstElementChild(location) {
            const result = this.model.getFirstElementChild(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.elementMapper(result.elements);
        }
        getLastElementAncestor(location) {
            const result = this.model.getLastElementAncestor(location);
            if (result === null || typeof result === 'undefined') {
                return result;
            }
            return this.elementMapper(result.elements);
        }
        isCollapsible(location) {
            return this.model.isCollapsible(location);
        }
        setCollapsible(location, collapsed) {
            return this.model.setCollapsible(location, collapsed);
        }
        isCollapsed(location) {
            return this.model.isCollapsed(location);
        }
        setCollapsed(location, collapsed, recursive) {
            return this.model.setCollapsed(location, collapsed, recursive);
        }
        expandTo(location) {
            return this.model.expandTo(location);
        }
        rerender(location) {
            return this.model.rerender(location);
        }
        updateElementHeight(element, height) {
            this.model.updateElementHeight(element, height);
        }
        refilter() {
            return this.model.refilter();
        }
        resort(element = null, recursive = true) {
            return this.model.resort(element, recursive);
        }
        getCompressedTreeNode(location = null) {
            return this.model.getNode(location);
        }
    }
    exports.CompressibleObjectTreeModel = CompressibleObjectTreeModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHJlc3NlZE9iamVjdFRyZWVNb2RlbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3RyZWUvY29tcHJlc3NlZE9iamVjdFRyZWVNb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQ2hHLDRCQTRCQztJQThCRCxnQ0FFQztJQXpFRCxTQUFTLFVBQVUsQ0FBSSxPQUFrQztRQUN4RCxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQztRQUV2RCxPQUFPO1lBQ04sT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRTtZQUNyQyxRQUFRLEVBQUUsbUJBQVEsQ0FBQyxHQUFHLENBQUMsbUJBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsQ0FBQztZQUNuRSxXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVc7WUFDaEMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxTQUFTO1NBQzVCLENBQUM7SUFDSCxDQUFDO0lBRUQsc0RBQXNEO0lBQ3RELFNBQWdCLFFBQVEsQ0FBSSxPQUFrQztRQUM3RCxNQUFNLFFBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxJQUFJLEtBQUssQ0FBQztRQUV2RCxJQUFJLGdCQUFxRCxDQUFDO1FBQzFELElBQUksUUFBcUMsQ0FBQztRQUUxQyxPQUFPLElBQUksRUFBRSxDQUFDO1lBQ2IsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxtQkFBUSxDQUFDLE9BQU8sQ0FBQyxtQkFBUSxDQUFDLElBQUks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