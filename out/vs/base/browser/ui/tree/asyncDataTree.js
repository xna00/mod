/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/list/listView", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/indexTreeModel", "vs/base/browser/ui/tree/objectTree", "vs/base/browser/ui/tree/tree", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, listView_1, abstractTree_1, indexTreeModel_1, objectTree_1, tree_1, async_1, codicons_1, themables_1, errors_1, event_1, iterator_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompressibleAsyncDataTree = exports.AsyncDataTree = void 0;
    function createAsyncDataTreeNode(props) {
        return {
            ...props,
            children: [],
            refreshPromise: undefined,
            stale: true,
            slow: false,
            forceExpanded: false
        };
    }
    function isAncestor(ancestor, descendant) {
        if (!descendant.parent) {
            return false;
        }
        else if (descendant.parent === ancestor) {
            return true;
        }
        else {
            return isAncestor(ancestor, descendant.parent);
        }
    }
    function intersects(node, other) {
        return node === other || isAncestor(node, other) || isAncestor(other, node);
    }
    class AsyncDataTreeNodeWrapper {
        get element() { return this.node.element.element; }
        get children() { return this.node.children.map(node => new AsyncDataTreeNodeWrapper(node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
        constructor(node) {
            this.node = node;
        }
    }
    class AsyncDataTreeRenderer {
        constructor(renderer, nodeMapper, onDidChangeTwistieState) {
            this.renderer = renderer;
            this.nodeMapper = nodeMapper;
            this.onDidChangeTwistieState = onDidChangeTwistieState;
            this.renderedNodes = new Map();
            this.templateId = renderer.templateId;
        }
        renderTemplate(container) {
            const templateData = this.renderer.renderTemplate(container);
            return { templateData };
        }
        renderElement(node, index, templateData, height) {
            this.renderer.renderElement(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        renderTwistie(element, twistieElement) {
            if (element.slow) {
                twistieElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemLoading));
                return true;
            }
            else {
                twistieElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemLoading));
                return false;
            }
        }
        disposeElement(node, index, templateData, height) {
            this.renderer.disposeElement?.(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        dispose() {
            this.renderedNodes.clear();
        }
    }
    function asTreeEvent(e) {
        return {
            browserEvent: e.browserEvent,
            elements: e.elements.map(e => e.element)
        };
    }
    function asTreeMouseEvent(e) {
        return {
            browserEvent: e.browserEvent,
            element: e.element && e.element.element,
            target: e.target
        };
    }
    function asTreeContextMenuEvent(e) {
        return {
            browserEvent: e.browserEvent,
            element: e.element && e.element.element,
            anchor: e.anchor,
            isStickyScroll: e.isStickyScroll
        };
    }
    class AsyncDataTreeElementsDragAndDropData extends listView_1.ElementsDragAndDropData {
        set context(context) {
            this.data.context = context;
        }
        get context() {
            return this.data.context;
        }
        constructor(data) {
            super(data.elements.map(node => node.element));
            this.data = data;
        }
    }
    function asAsyncDataTreeDragAndDropData(data) {
        if (data instanceof listView_1.ElementsDragAndDropData) {
            return new AsyncDataTreeElementsDragAndDropData(data);
        }
        return data;
    }
    class AsyncDataTreeNodeListDragAndDrop {
        constructor(dnd) {
            this.dnd = dnd;
        }
        getDragURI(node) {
            return this.dnd.getDragURI(node.element);
        }
        getDragLabel(nodes, originalEvent) {
            if (this.dnd.getDragLabel) {
                return this.dnd.getDragLabel(nodes.map(node => node.element), originalEvent);
            }
            return undefined;
        }
        onDragStart(data, originalEvent) {
            this.dnd.onDragStart?.(asAsyncDataTreeDragAndDropData(data), originalEvent);
        }
        onDragOver(data, targetNode, targetIndex, targetSector, originalEvent, raw = true) {
            return this.dnd.onDragOver(asAsyncDataTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, targetSector, originalEvent);
        }
        drop(data, targetNode, targetIndex, targetSector, originalEvent) {
            this.dnd.drop(asAsyncDataTreeDragAndDropData(data), targetNode && targetNode.element, targetIndex, targetSector, originalEvent);
        }
        onDragEnd(originalEvent) {
            this.dnd.onDragEnd?.(originalEvent);
        }
        dispose() {
            this.dnd.dispose();
        }
    }
    function asObjectTreeOptions(options) {
        return options && {
            ...options,
            collapseByDefault: true,
            identityProvider: options.identityProvider && {
                getId(el) {
                    return options.identityProvider.getId(el.element);
                }
            },
            dnd: options.dnd && new AsyncDataTreeNodeListDragAndDrop(options.dnd),
            multipleSelectionController: options.multipleSelectionController && {
                isSelectionSingleChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionSingleChangeEvent({ ...e, element: e.element });
                },
                isSelectionRangeChangeEvent(e) {
                    return options.multipleSelectionController.isSelectionRangeChangeEvent({ ...e, element: e.element });
                }
            },
            accessibilityProvider: options.accessibilityProvider && {
                ...options.accessibilityProvider,
                getPosInSet: undefined,
                getSetSize: undefined,
                getRole: options.accessibilityProvider.getRole ? (el) => {
                    return options.accessibilityProvider.getRole(el.element);
                } : () => 'treeitem',
                isChecked: options.accessibilityProvider.isChecked ? (e) => {
                    return !!(options.accessibilityProvider?.isChecked(e.element));
                } : undefined,
                getAriaLabel(e) {
                    return options.accessibilityProvider.getAriaLabel(e.element);
                },
                getWidgetAriaLabel() {
                    return options.accessibilityProvider.getWidgetAriaLabel();
                },
                getWidgetRole: options.accessibilityProvider.getWidgetRole ? () => options.accessibilityProvider.getWidgetRole() : () => 'tree',
                getAriaLevel: options.accessibilityProvider.getAriaLevel && (node => {
                    return options.accessibilityProvider.getAriaLevel(node.element);
                }),
                getActiveDescendantId: options.accessibilityProvider.getActiveDescendantId && (node => {
                    return options.accessibilityProvider.getActiveDescendantId(node.element);
                })
            },
            filter: options.filter && {
                filter(e, parentVisibility) {
                    return options.filter.filter(e.element, parentVisibility);
                }
            },
            keyboardNavigationLabelProvider: options.keyboardNavigationLabelProvider && {
                ...options.keyboardNavigationLabelProvider,
                getKeyboardNavigationLabel(e) {
                    return options.keyboardNavigationLabelProvider.getKeyboardNavigationLabel(e.element);
                }
            },
            sorter: undefined,
            expandOnlyOnTwistieClick: typeof options.expandOnlyOnTwistieClick === 'undefined' ? undefined : (typeof options.expandOnlyOnTwistieClick !== 'function' ? options.expandOnlyOnTwistieClick : (e => options.expandOnlyOnTwistieClick(e.element))),
            defaultFindVisibility: e => {
                if (e.hasChildren && e.stale) {
                    return 1 /* TreeVisibility.Visible */;
                }
                else if (typeof options.defaultFindVisibility === 'number') {
                    return options.defaultFindVisibility;
                }
                else if (typeof options.defaultFindVisibility === 'undefined') {
                    return 2 /* TreeVisibility.Recurse */;
                }
                else {
                    return options.defaultFindVisibility(e.element);
                }
            }
        };
    }
    function dfs(node, fn) {
        fn(node);
        node.children.forEach(child => dfs(child, fn));
    }
    class AsyncDataTree {
        get onDidScroll() { return this.tree.onDidScroll; }
        get onDidChangeFocus() { return event_1.Event.map(this.tree.onDidChangeFocus, asTreeEvent); }
        get onDidChangeSelection() { return event_1.Event.map(this.tree.onDidChangeSelection, asTreeEvent); }
        get onKeyDown() { return this.tree.onKeyDown; }
        get onMouseClick() { return event_1.Event.map(this.tree.onMouseClick, asTreeMouseEvent); }
        get onMouseDblClick() { return event_1.Event.map(this.tree.onMouseDblClick, asTreeMouseEvent); }
        get onContextMenu() { return event_1.Event.map(this.tree.onContextMenu, asTreeContextMenuEvent); }
        get onTap() { return event_1.Event.map(this.tree.onTap, asTreeMouseEvent); }
        get onPointer() { return event_1.Event.map(this.tree.onPointer, asTreeMouseEvent); }
        get onDidFocus() { return this.tree.onDidFocus; }
        get onDidBlur() { return this.tree.onDidBlur; }
        /**
         * To be used internally only!
         * @deprecated
         */
        get onDidChangeModel() { return this.tree.onDidChangeModel; }
        get onDidChangeCollapseState() { return this.tree.onDidChangeCollapseState; }
        get onDidUpdateOptions() { return this.tree.onDidUpdateOptions; }
        get onDidChangeFindOpenState() { return this.tree.onDidChangeFindOpenState; }
        get onDidChangeStickyScrollFocused() { return this.tree.onDidChangeStickyScrollFocused; }
        get findMode() { return this.tree.findMode; }
        set findMode(mode) { this.tree.findMode = mode; }
        get findMatchType() { return this.tree.findMatchType; }
        set findMatchType(matchType) { this.tree.findMatchType = matchType; }
        get expandOnlyOnTwistieClick() {
            if (typeof this.tree.expandOnlyOnTwistieClick === 'boolean') {
                return this.tree.expandOnlyOnTwistieClick;
            }
            const fn = this.tree.expandOnlyOnTwistieClick;
            return element => fn(this.nodes.get((element === this.root.element ? null : element)) || null);
        }
        get onDidDispose() { return this.tree.onDidDispose; }
        constructor(user, container, delegate, renderers, dataSource, options = {}) {
            this.user = user;
            this.dataSource = dataSource;
            this.nodes = new Map();
            this.subTreeRefreshPromises = new Map();
            this.refreshPromises = new Map();
            this._onDidRender = new event_1.Emitter();
            this._onDidChangeNodeSlowState = new event_1.Emitter();
            this.nodeMapper = new tree_1.WeakMapper(node => new AsyncDataTreeNodeWrapper(node));
            this.disposables = new lifecycle_1.DisposableStore();
            this.identityProvider = options.identityProvider;
            this.autoExpandSingleChildren = typeof options.autoExpandSingleChildren === 'undefined' ? false : options.autoExpandSingleChildren;
            this.sorter = options.sorter;
            this.getDefaultCollapseState = e => options.collapseByDefault ? (options.collapseByDefault(e) ? tree_1.ObjectTreeElementCollapseState.PreserveOrCollapsed : tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) : undefined;
            this.tree = this.createTree(user, container, delegate, renderers, options);
            this.onDidChangeFindMode = this.tree.onDidChangeFindMode;
            this.onDidChangeFindMatchType = this.tree.onDidChangeFindMatchType;
            this.root = createAsyncDataTreeNode({
                element: undefined,
                parent: null,
                hasChildren: true,
                defaultCollapseState: undefined
            });
            if (this.identityProvider) {
                this.root = {
                    ...this.root,
                    id: null
                };
            }
            this.nodes.set(null, this.root);
            this.tree.onDidChangeCollapseState(this._onDidChangeCollapseState, this, this.disposables);
        }
        createTree(user, container, delegate, renderers, options) {
            const objectTreeDelegate = new abstractTree_1.ComposedTreeDelegate(delegate);
            const objectTreeRenderers = renderers.map(r => new AsyncDataTreeRenderer(r, this.nodeMapper, this._onDidChangeNodeSlowState.event));
            const objectTreeOptions = asObjectTreeOptions(options) || {};
            return new objectTree_1.ObjectTree(user, container, objectTreeDelegate, objectTreeRenderers, objectTreeOptions);
        }
        updateOptions(options = {}) {
            this.tree.updateOptions(options);
        }
        get options() {
            return this.tree.options;
        }
        // Widget
        getHTMLElement() {
            return this.tree.getHTMLElement();
        }
        get contentHeight() {
            return this.tree.contentHeight;
        }
        get contentWidth() {
            return this.tree.contentWidth;
        }
        get onDidChangeContentHeight() {
            return this.tree.onDidChangeContentHeight;
        }
        get onDidChangeContentWidth() {
            return this.tree.onDidChangeContentWidth;
        }
        get scrollTop() {
            return this.tree.scrollTop;
        }
        set scrollTop(scrollTop) {
            this.tree.scrollTop = scrollTop;
        }
        get scrollLeft() {
            return this.tree.scrollLeft;
        }
        set scrollLeft(scrollLeft) {
            this.tree.scrollLeft = scrollLeft;
        }
        get scrollHeight() {
            return this.tree.scrollHeight;
        }
        get renderHeight() {
            return this.tree.renderHeight;
        }
        get lastVisibleElement() {
            return this.tree.lastVisibleElement.element;
        }
        get ariaLabel() {
            return this.tree.ariaLabel;
        }
        set ariaLabel(value) {
            this.tree.ariaLabel = value;
        }
        domFocus() {
            this.tree.domFocus();
        }
        layout(height, width) {
            this.tree.layout(height, width);
        }
        style(styles) {
            this.tree.style(styles);
        }
        // Model
        getInput() {
            return this.root.element;
        }
        async setInput(input, viewState) {
            this.refreshPromises.forEach(promise => promise.cancel());
            this.refreshPromises.clear();
            this.root.element = input;
            const viewStateContext = viewState && { viewState, focus: [], selection: [] };
            await this._updateChildren(input, true, false, viewStateContext);
            if (viewStateContext) {
                this.tree.setFocus(viewStateContext.focus);
                this.tree.setSelection(viewStateContext.selection);
            }
            if (viewState && typeof viewState.scrollTop === 'number') {
                this.scrollTop = viewState.scrollTop;
            }
        }
        async updateChildren(element = this.root.element, recursive = true, rerender = false, options) {
            await this._updateChildren(element, recursive, rerender, undefined, options);
        }
        async _updateChildren(element = this.root.element, recursive = true, rerender = false, viewStateContext, options) {
            if (typeof this.root.element === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            if (this.root.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            const node = this.getDataNode(element);
            await this.refreshAndRenderNode(node, recursive, viewStateContext, options);
            if (rerender) {
                try {
                    this.tree.rerender(node);
                }
                catch {
                    // missing nodes are fine, this could've resulted from
                    // parallel refresh calls, removing `node` altogether
                }
            }
        }
        resort(element = this.root.element, recursive = true) {
            this.tree.resort(this.getDataNode(element), recursive);
        }
        hasElement(element) {
            return this.tree.hasElement(this.getDataNode(element));
        }
        hasNode(element) {
            return element === this.root.element || this.nodes.has(element);
        }
        // View
        rerender(element) {
            if (element === undefined || element === this.root.element) {
                this.tree.rerender();
                return;
            }
            const node = this.getDataNode(element);
            this.tree.rerender(node);
        }
        updateElementHeight(element, height) {
            const node = this.getDataNode(element);
            this.tree.updateElementHeight(node, height);
        }
        updateWidth(element) {
            const node = this.getDataNode(element);
            this.tree.updateWidth(node);
        }
        // Tree
        getNode(element = this.root.element) {
            const dataNode = this.getDataNode(element);
            const node = this.tree.getNode(dataNode === this.root ? null : dataNode);
            return this.nodeMapper.map(node);
        }
        collapse(element, recursive = false) {
            const node = this.getDataNode(element);
            return this.tree.collapse(node === this.root ? null : node, recursive);
        }
        async expand(element, recursive = false) {
            if (typeof this.root.element === 'undefined') {
                throw new tree_1.TreeError(this.user, 'Tree input not set');
            }
            if (this.root.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            const node = this.getDataNode(element);
            if (this.tree.hasElement(node) && !this.tree.isCollapsible(node)) {
                return false;
            }
            if (node.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            if (node !== this.root && !node.refreshPromise && !this.tree.isCollapsed(node)) {
                return false;
            }
            const result = this.tree.expand(node === this.root ? null : node, recursive);
            if (node.refreshPromise) {
                await this.root.refreshPromise;
                await event_1.Event.toPromise(this._onDidRender.event);
            }
            return result;
        }
        toggleCollapsed(element, recursive = false) {
            return this.tree.toggleCollapsed(this.getDataNode(element), recursive);
        }
        expandAll() {
            this.tree.expandAll();
        }
        async expandTo(element) {
            if (!this.dataSource.getParent) {
                throw new Error('Can\'t expand to element without getParent method');
            }
            const elements = [];
            while (!this.hasNode(element)) {
                element = this.dataSource.getParent(element);
                if (element !== this.root.element) {
                    elements.push(element);
                }
            }
            for (const element of iterator_1.Iterable.reverse(elements)) {
                await this.expand(element);
            }
            this.tree.expandTo(this.getDataNode(element));
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        isCollapsible(element) {
            return this.tree.isCollapsible(this.getDataNode(element));
        }
        isCollapsed(element) {
            return this.tree.isCollapsed(this.getDataNode(element));
        }
        triggerTypeNavigation() {
            this.tree.triggerTypeNavigation();
        }
        openFind() {
            this.tree.openFind();
        }
        closeFind() {
            this.tree.closeFind();
        }
        refilter() {
            this.tree.refilter();
        }
        setAnchor(element) {
            this.tree.setAnchor(typeof element === 'undefined' ? undefined : this.getDataNode(element));
        }
        getAnchor() {
            const node = this.tree.getAnchor();
            return node?.element;
        }
        setSelection(elements, browserEvent) {
            const nodes = elements.map(e => this.getDataNode(e));
            this.tree.setSelection(nodes, browserEvent);
        }
        getSelection() {
            const nodes = this.tree.getSelection();
            return nodes.map(n => n.element);
        }
        setFocus(elements, browserEvent) {
            const nodes = elements.map(e => this.getDataNode(e));
            this.tree.setFocus(nodes, browserEvent);
        }
        focusNext(n = 1, loop = false, browserEvent) {
            this.tree.focusNext(n, loop, browserEvent);
        }
        focusPrevious(n = 1, loop = false, browserEvent) {
            this.tree.focusPrevious(n, loop, browserEvent);
        }
        focusNextPage(browserEvent) {
            return this.tree.focusNextPage(browserEvent);
        }
        focusPreviousPage(browserEvent) {
            return this.tree.focusPreviousPage(browserEvent);
        }
        focusLast(browserEvent) {
            this.tree.focusLast(browserEvent);
        }
        focusFirst(browserEvent) {
            this.tree.focusFirst(browserEvent);
        }
        getFocus() {
            const nodes = this.tree.getFocus();
            return nodes.map(n => n.element);
        }
        getStickyScrollFocus() {
            const nodes = this.tree.getStickyScrollFocus();
            return nodes.map(n => n.element);
        }
        getFocusedPart() {
            return this.tree.getFocusedPart();
        }
        reveal(element, relativeTop) {
            this.tree.reveal(this.getDataNode(element), relativeTop);
        }
        getRelativeTop(element) {
            return this.tree.getRelativeTop(this.getDataNode(element));
        }
        // Tree navigation
        getParentElement(element) {
            const node = this.tree.getParentElement(this.getDataNode(element));
            return (node && node.element);
        }
        getFirstElementChild(element = this.root.element) {
            const dataNode = this.getDataNode(element);
            const node = this.tree.getFirstElementChild(dataNode === this.root ? null : dataNode);
            return (node && node.element);
        }
        // Implementation
        getDataNode(element) {
            const node = this.nodes.get((element === this.root.element ? null : element));
            if (!node) {
                throw new tree_1.TreeError(this.user, `Data tree node not found: ${element}`);
            }
            return node;
        }
        async refreshAndRenderNode(node, recursive, viewStateContext, options) {
            await this.refreshNode(node, recursive, viewStateContext);
            if (this.disposables.isDisposed) {
                return; // tree disposed during refresh (#199264)
            }
            this.render(node, viewStateContext, options);
        }
        async refreshNode(node, recursive, viewStateContext) {
            let result;
            this.subTreeRefreshPromises.forEach((refreshPromise, refreshNode) => {
                if (!result && intersects(refreshNode, node)) {
                    result = refreshPromise.then(() => this.refreshNode(node, recursive, viewStateContext));
                }
            });
            if (result) {
                return result;
            }
            if (node !== this.root) {
                const treeNode = this.tree.getNode(node);
                if (treeNode.collapsed) {
                    node.hasChildren = !!this.dataSource.hasChildren(node.element);
                    node.stale = true;
                    this.setChildren(node, [], recursive, viewStateContext);
                    return;
                }
            }
            return this.doRefreshSubTree(node, recursive, viewStateContext);
        }
        async doRefreshSubTree(node, recursive, viewStateContext) {
            let done;
            node.refreshPromise = new Promise(c => done = c);
            this.subTreeRefreshPromises.set(node, node.refreshPromise);
            node.refreshPromise.finally(() => {
                node.refreshPromise = undefined;
                this.subTreeRefreshPromises.delete(node);
            });
            try {
                const childrenToRefresh = await this.doRefreshNode(node, recursive, viewStateContext);
                node.stale = false;
                await async_1.Promises.settled(childrenToRefresh.map(child => this.doRefreshSubTree(child, recursive, viewStateContext)));
            }
            finally {
                done();
            }
        }
        async doRefreshNode(node, recursive, viewStateContext) {
            node.hasChildren = !!this.dataSource.hasChildren(node.element);
            let childrenPromise;
            if (!node.hasChildren) {
                childrenPromise = Promise.resolve(iterator_1.Iterable.empty());
            }
            else {
                const children = this.doGetChildren(node);
                if ((0, types_1.isIterable)(children)) {
                    childrenPromise = Promise.resolve(children);
                }
                else {
                    const slowTimeout = (0, async_1.timeout)(800);
                    slowTimeout.then(() => {
                        node.slow = true;
                        this._onDidChangeNodeSlowState.fire(node);
                    }, _ => null);
                    childrenPromise = children.finally(() => slowTimeout.cancel());
                }
            }
            try {
                const children = await childrenPromise;
                return this.setChildren(node, children, recursive, viewStateContext);
            }
            catch (err) {
                if (node !== this.root && this.tree.hasElement(node)) {
                    this.tree.collapse(node);
                }
                if ((0, errors_1.isCancellationError)(err)) {
                    return [];
                }
                throw err;
            }
            finally {
                if (node.slow) {
                    node.slow = false;
                    this._onDidChangeNodeSlowState.fire(node);
                }
            }
        }
        doGetChildren(node) {
            let result = this.refreshPromises.get(node);
            if (result) {
                return result;
            }
            const children = this.dataSource.getChildren(node.element);
            if ((0, types_1.isIterable)(children)) {
                return this.processChildren(children);
            }
            else {
                result = (0, async_1.createCancelablePromise)(async () => this.processChildren(await children));
                this.refreshPromises.set(node, result);
                return result.finally(() => { this.refreshPromises.delete(node); });
            }
        }
        _onDidChangeCollapseState({ node, deep }) {
            if (node.element === null) {
                return;
            }
            if (!node.collapsed && node.element.stale) {
                if (deep) {
                    this.collapse(node.element.element);
                }
                else {
                    this.refreshAndRenderNode(node.element, false)
                        .catch(errors_1.onUnexpectedError);
                }
            }
        }
        setChildren(node, childrenElementsIterable, recursive, viewStateContext) {
            const childrenElements = [...childrenElementsIterable];
            // perf: if the node was and still is a leaf, avoid all this hassle
            if (node.children.length === 0 && childrenElements.length === 0) {
                return [];
            }
            const nodesToForget = new Map();
            const childrenTreeNodesById = new Map();
            for (const child of node.children) {
                nodesToForget.set(child.element, child);
                if (this.identityProvider) {
                    childrenTreeNodesById.set(child.id, { node: child, collapsed: this.tree.hasElement(child) && this.tree.isCollapsed(child) });
                }
            }
            const childrenToRefresh = [];
            const children = childrenElements.map(element => {
                const hasChildren = !!this.dataSource.hasChildren(element);
                if (!this.identityProvider) {
                    const asyncDataTreeNode = createAsyncDataTreeNode({ element, parent: node, hasChildren, defaultCollapseState: this.getDefaultCollapseState(element) });
                    if (hasChildren && asyncDataTreeNode.defaultCollapseState === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                        childrenToRefresh.push(asyncDataTreeNode);
                    }
                    return asyncDataTreeNode;
                }
                const id = this.identityProvider.getId(element).toString();
                const result = childrenTreeNodesById.get(id);
                if (result) {
                    const asyncDataTreeNode = result.node;
                    nodesToForget.delete(asyncDataTreeNode.element);
                    this.nodes.delete(asyncDataTreeNode.element);
                    this.nodes.set(element, asyncDataTreeNode);
                    asyncDataTreeNode.element = element;
                    asyncDataTreeNode.hasChildren = hasChildren;
                    if (recursive) {
                        if (result.collapsed) {
                            asyncDataTreeNode.children.forEach(node => dfs(node, node => this.nodes.delete(node.element)));
                            asyncDataTreeNode.children.splice(0, asyncDataTreeNode.children.length);
                            asyncDataTreeNode.stale = true;
                        }
                        else {
                            childrenToRefresh.push(asyncDataTreeNode);
                        }
                    }
                    else if (hasChildren && !result.collapsed) {
                        childrenToRefresh.push(asyncDataTreeNode);
                    }
                    return asyncDataTreeNode;
                }
                const childAsyncDataTreeNode = createAsyncDataTreeNode({ element, parent: node, id, hasChildren, defaultCollapseState: this.getDefaultCollapseState(element) });
                if (viewStateContext && viewStateContext.viewState.focus && viewStateContext.viewState.focus.indexOf(id) > -1) {
                    viewStateContext.focus.push(childAsyncDataTreeNode);
                }
                if (viewStateContext && viewStateContext.viewState.selection && viewStateContext.viewState.selection.indexOf(id) > -1) {
                    viewStateContext.selection.push(childAsyncDataTreeNode);
                }
                if (viewStateContext && viewStateContext.viewState.expanded && viewStateContext.viewState.expanded.indexOf(id) > -1) {
                    childrenToRefresh.push(childAsyncDataTreeNode);
                }
                else if (hasChildren && childAsyncDataTreeNode.defaultCollapseState === tree_1.ObjectTreeElementCollapseState.PreserveOrExpanded) {
                    childrenToRefresh.push(childAsyncDataTreeNode);
                }
                return childAsyncDataTreeNode;
            });
            for (const node of nodesToForget.values()) {
                dfs(node, node => this.nodes.delete(node.element));
            }
            for (const child of children) {
                this.nodes.set(child.element, child);
            }
            node.children.splice(0, node.children.length, ...children);
            // TODO@joao this doesn't take filter into account
            if (node !== this.root && this.autoExpandSingleChildren && children.length === 1 && childrenToRefresh.length === 0) {
                children[0].forceExpanded = true;
                childrenToRefresh.push(children[0]);
            }
            return childrenToRefresh;
        }
        render(node, viewStateContext, options) {
            const children = node.children.map(node => this.asTreeElement(node, viewStateContext));
            const objectTreeOptions = options && {
                ...options,
                diffIdentityProvider: options.diffIdentityProvider && {
                    getId(node) {
                        return options.diffIdentityProvider.getId(node.element);
                    }
                }
            };
            this.tree.setChildren(node === this.root ? null : node, children, objectTreeOptions);
            if (node !== this.root) {
                this.tree.setCollapsible(node, node.hasChildren);
            }
            this._onDidRender.fire();
        }
        asTreeElement(node, viewStateContext) {
            if (node.stale) {
                return {
                    element: node,
                    collapsible: node.hasChildren,
                    collapsed: true
                };
            }
            let collapsed;
            if (viewStateContext && viewStateContext.viewState.expanded && node.id && viewStateContext.viewState.expanded.indexOf(node.id) > -1) {
                collapsed = false;
            }
            else if (node.forceExpanded) {
                collapsed = false;
                node.forceExpanded = false;
            }
            else {
                collapsed = node.defaultCollapseState;
            }
            return {
                element: node,
                children: node.hasChildren ? iterator_1.Iterable.map(node.children, child => this.asTreeElement(child, viewStateContext)) : [],
                collapsible: node.hasChildren,
                collapsed
            };
        }
        processChildren(children) {
            if (this.sorter) {
                children = [...children].sort(this.sorter.compare.bind(this.sorter));
            }
            return children;
        }
        // view state
        getViewState() {
            if (!this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t get tree view state without an identity provider');
            }
            const getId = (element) => this.identityProvider.getId(element).toString();
            const focus = this.getFocus().map(getId);
            const selection = this.getSelection().map(getId);
            const expanded = [];
            const root = this.tree.getNode();
            const stack = [root];
            while (stack.length > 0) {
                const node = stack.pop();
                if (node !== root && node.collapsible && !node.collapsed) {
                    expanded.push(getId(node.element.element));
                }
                stack.push(...node.children);
            }
            return { focus, selection, expanded, scrollTop: this.scrollTop };
        }
        dispose() {
            this.disposables.dispose();
            this.tree.dispose();
        }
    }
    exports.AsyncDataTree = AsyncDataTree;
    class CompressibleAsyncDataTreeNodeWrapper {
        get element() {
            return {
                elements: this.node.element.elements.map(e => e.element),
                incompressible: this.node.element.incompressible
            };
        }
        get children() { return this.node.children.map(node => new CompressibleAsyncDataTreeNodeWrapper(node)); }
        get depth() { return this.node.depth; }
        get visibleChildrenCount() { return this.node.visibleChildrenCount; }
        get visibleChildIndex() { return this.node.visibleChildIndex; }
        get collapsible() { return this.node.collapsible; }
        get collapsed() { return this.node.collapsed; }
        get visible() { return this.node.visible; }
        get filterData() { return this.node.filterData; }
        constructor(node) {
            this.node = node;
        }
    }
    class CompressibleAsyncDataTreeRenderer {
        constructor(renderer, nodeMapper, compressibleNodeMapperProvider, onDidChangeTwistieState) {
            this.renderer = renderer;
            this.nodeMapper = nodeMapper;
            this.compressibleNodeMapperProvider = compressibleNodeMapperProvider;
            this.onDidChangeTwistieState = onDidChangeTwistieState;
            this.renderedNodes = new Map();
            this.disposables = [];
            this.templateId = renderer.templateId;
        }
        renderTemplate(container) {
            const templateData = this.renderer.renderTemplate(container);
            return { templateData };
        }
        renderElement(node, index, templateData, height) {
            this.renderer.renderElement(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        renderCompressedElements(node, index, templateData, height) {
            this.renderer.renderCompressedElements(this.compressibleNodeMapperProvider().map(node), index, templateData.templateData, height);
        }
        renderTwistie(element, twistieElement) {
            if (element.slow) {
                twistieElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemLoading));
                return true;
            }
            else {
                twistieElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.treeItemLoading));
                return false;
            }
        }
        disposeElement(node, index, templateData, height) {
            this.renderer.disposeElement?.(this.nodeMapper.map(node), index, templateData.templateData, height);
        }
        disposeCompressedElements(node, index, templateData, height) {
            this.renderer.disposeCompressedElements?.(this.compressibleNodeMapperProvider().map(node), index, templateData.templateData, height);
        }
        disposeTemplate(templateData) {
            this.renderer.disposeTemplate(templateData.templateData);
        }
        dispose() {
            this.renderedNodes.clear();
            this.disposables = (0, lifecycle_1.dispose)(this.disposables);
        }
    }
    function asCompressibleObjectTreeOptions(options) {
        const objectTreeOptions = options && asObjectTreeOptions(options);
        return objectTreeOptions && {
            ...objectTreeOptions,
            keyboardNavigationLabelProvider: objectTreeOptions.keyboardNavigationLabelProvider && {
                ...objectTreeOptions.keyboardNavigationLabelProvider,
                getCompressedNodeKeyboardNavigationLabel(els) {
                    return options.keyboardNavigationLabelProvider.getCompressedNodeKeyboardNavigationLabel(els.map(e => e.element));
                }
            }
        };
    }
    class CompressibleAsyncDataTree extends AsyncDataTree {
        constructor(user, container, virtualDelegate, compressionDelegate, renderers, dataSource, options = {}) {
            super(user, container, virtualDelegate, renderers, dataSource, options);
            this.compressionDelegate = compressionDelegate;
            this.compressibleNodeMapper = new tree_1.WeakMapper(node => new CompressibleAsyncDataTreeNodeWrapper(node));
            this.filter = options.filter;
        }
        createTree(user, container, delegate, renderers, options) {
            const objectTreeDelegate = new abstractTree_1.ComposedTreeDelegate(delegate);
            const objectTreeRenderers = renderers.map(r => new CompressibleAsyncDataTreeRenderer(r, this.nodeMapper, () => this.compressibleNodeMapper, this._onDidChangeNodeSlowState.event));
            const objectTreeOptions = asCompressibleObjectTreeOptions(options) || {};
            return new objectTree_1.CompressibleObjectTree(user, container, objectTreeDelegate, objectTreeRenderers, objectTreeOptions);
        }
        asTreeElement(node, viewStateContext) {
            return {
                incompressible: this.compressionDelegate.isIncompressible(node.element),
                ...super.asTreeElement(node, viewStateContext)
            };
        }
        updateOptions(options = {}) {
            this.tree.updateOptions(options);
        }
        getViewState() {
            if (!this.identityProvider) {
                throw new tree_1.TreeError(this.user, 'Can\'t get tree view state without an identity provider');
            }
            const getId = (element) => this.identityProvider.getId(element).toString();
            const focus = this.getFocus().map(getId);
            const selection = this.getSelection().map(getId);
            const expanded = [];
            const root = this.tree.getCompressedTreeNode();
            const stack = [root];
            while (stack.length > 0) {
                const node = stack.pop();
                if (node !== root && node.collapsible && !node.collapsed) {
                    for (const asyncNode of node.element.elements) {
                        expanded.push(getId(asyncNode.element));
                    }
                }
                stack.push(...node.children);
            }
            return { focus, selection, expanded, scrollTop: this.scrollTop };
        }
        render(node, viewStateContext, options) {
            if (!this.identityProvider) {
                return super.render(node, viewStateContext);
            }
            // Preserve traits across compressions. Hacky but does the trick.
            // This is hard to fix properly since it requires rewriting the traits
            // across trees and lists. Let's just keep it this way for now.
            const getId = (element) => this.identityProvider.getId(element).toString();
            const getUncompressedIds = (nodes) => {
                const result = new Set();
                for (const node of nodes) {
                    const compressedNode = this.tree.getCompressedTreeNode(node === this.root ? null : node);
                    if (!compressedNode.element) {
                        continue;
                    }
                    for (const node of compressedNode.element.elements) {
                        result.add(getId(node.element));
                    }
                }
                return result;
            };
            const oldSelection = getUncompressedIds(this.tree.getSelection());
            const oldFocus = getUncompressedIds(this.tree.getFocus());
            super.render(node, viewStateContext, options);
            const selection = this.getSelection();
            let didChangeSelection = false;
            const focus = this.getFocus();
            let didChangeFocus = false;
            const visit = (node) => {
                const compressedNode = node.element;
                if (compressedNode) {
                    for (let i = 0; i < compressedNode.elements.length; i++) {
                        const id = getId(compressedNode.elements[i].element);
                        const element = compressedNode.elements[compressedNode.elements.length - 1].element;
                        // github.com/microsoft/vscode/issues/85938
                        if (oldSelection.has(id) && selection.indexOf(element) === -1) {
                            selection.push(element);
                            didChangeSelection = true;
                        }
                        if (oldFocus.has(id) && focus.indexOf(element) === -1) {
                            focus.push(element);
                            didChangeFocus = true;
                        }
                    }
                }
                node.children.forEach(visit);
            };
            visit(this.tree.getCompressedTreeNode(node === this.root ? null : node));
            if (didChangeSelection) {
                this.setSelection(selection);
            }
            if (didChangeFocus) {
                this.setFocus(focus);
            }
        }
        // For compressed async data trees, `TreeVisibility.Recurse` doesn't currently work
        // and we have to filter everything beforehand
        // Related to #85193 and #85835
        processChildren(children) {
            if (this.filter) {
                children = iterator_1.Iterable.filter(children, e => {
                    const result = this.filter.filter(e, 1 /* TreeVisibility.Visible */);
                    const visibility = getVisibility(result);
                    if (visibility === 2 /* TreeVisibility.Recurse */) {
                        throw new Error('Recursive tree visibility not supported in async data compressed trees');
                    }
                    return visibility === 1 /* TreeVisibility.Visible */;
                });
            }
            return super.processChildren(children);
        }
    }
    exports.CompressibleAsyncDataTree = CompressibleAsyncDataTree;
    function getVisibility(filterResult) {
        if (typeof filterResult === 'boolean') {
            return filterResult ? 1 /* TreeVisibility.Visible */ : 0 /* TreeVisibility.Hidden */;
        }
        else if ((0, indexTreeModel_1.isFilterResult)(filterResult)) {
            return (0, indexTreeModel_1.getVisibleState)(filterResult.visibility);
        }
        else {
            return (0, indexTreeModel_1.getVisibleState)(filterResult);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXN5bmNEYXRhVHJlZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3RyZWUvYXN5bmNEYXRhVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5Q2hHLFNBQVMsdUJBQXVCLENBQVksS0FBaUQ7UUFDNUYsT0FBTztZQUNOLEdBQUcsS0FBSztZQUNSLFFBQVEsRUFBRSxFQUFFO1lBQ1osY0FBYyxFQUFFLFNBQVM7WUFDekIsS0FBSyxFQUFFLElBQUk7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLGFBQWEsRUFBRSxLQUFLO1NBQ3BCLENBQUM7SUFDSCxDQUFDO0lBRUQsU0FBUyxVQUFVLENBQVksUUFBdUMsRUFBRSxVQUF5QztRQUNoSCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3hCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQzthQUFNLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMzQyxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7YUFBTSxDQUFDO1lBQ1AsT0FBTyxVQUFVLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFZLElBQW1DLEVBQUUsS0FBb0M7UUFDdkcsT0FBTyxJQUFJLEtBQUssS0FBSyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBUUQsTUFBTSx3QkFBd0I7UUFFN0IsSUFBSSxPQUFPLEtBQVEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQVEsQ0FBQyxPQUFZLENBQUMsQ0FBQyxDQUFDO1FB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