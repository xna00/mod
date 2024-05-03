/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/base/common/async", "vs/workbench/api/common/extHostTypes", "vs/base/common/types", "vs/base/common/arrays", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/htmlContent", "vs/base/common/cancellation", "vs/editor/common/services/treeViewsDnd", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, resources_1, uri_1, event_1, lifecycle_1, views_1, async_1, extHostTypes, types_1, arrays_1, extHostTypeConverters_1, htmlContent_1, cancellation_1, treeViewsDnd_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTreeViews = void 0;
    function toTreeItemLabel(label, extension) {
        if ((0, types_1.isString)(label)) {
            return { label };
        }
        if (label
            && typeof label === 'object'
            && typeof label.label === 'string') {
            let highlights = undefined;
            if (Array.isArray(label.highlights)) {
                highlights = label.highlights.filter((highlight => highlight.length === 2 && typeof highlight[0] === 'number' && typeof highlight[1] === 'number'));
                highlights = highlights.length ? highlights : undefined;
            }
            return { label: label.label, highlights };
        }
        return undefined;
    }
    class ExtHostTreeViews extends lifecycle_1.Disposable {
        constructor(_proxy, commands, logService) {
            super();
            this._proxy = _proxy;
            this.commands = commands;
            this.logService = logService;
            this.treeViews = new Map();
            this.treeDragAndDropService = new treeViewsDnd_1.TreeViewsDnDService();
            function isTreeViewConvertableItem(arg) {
                return arg && arg.$treeViewId && (arg.$treeItemHandle || arg.$selectedTreeItems || arg.$focusedTreeItem);
            }
            commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (isTreeViewConvertableItem(arg)) {
                        return this.convertArgument(arg);
                    }
                    else if (Array.isArray(arg) && (arg.length > 0)) {
                        return arg.map(item => {
                            if (isTreeViewConvertableItem(item)) {
                                return this.convertArgument(item);
                            }
                            return item;
                        });
                    }
                    return arg;
                }
            });
        }
        registerTreeDataProvider(id, treeDataProvider, extension) {
            const treeView = this.createTreeView(id, { treeDataProvider }, extension);
            return { dispose: () => treeView.dispose() };
        }
        createTreeView(viewId, options, extension) {
            if (!options || !options.treeDataProvider) {
                throw new Error('Options with treeDataProvider is mandatory');
            }
            const dropMimeTypes = options.dragAndDropController?.dropMimeTypes ?? [];
            const dragMimeTypes = options.dragAndDropController?.dragMimeTypes ?? [];
            const hasHandleDrag = !!options.dragAndDropController?.handleDrag;
            const hasHandleDrop = !!options.dragAndDropController?.handleDrop;
            const treeView = this.createExtHostTreeView(viewId, options, extension);
            const proxyOptions = { showCollapseAll: !!options.showCollapseAll, canSelectMany: !!options.canSelectMany, dropMimeTypes, dragMimeTypes, hasHandleDrag, hasHandleDrop, manuallyManageCheckboxes: !!options.manageCheckboxStateManually };
            const registerPromise = this._proxy.$registerTreeViewDataProvider(viewId, proxyOptions);
            const view = {
                get onDidCollapseElement() { return treeView.onDidCollapseElement; },
                get onDidExpandElement() { return treeView.onDidExpandElement; },
                get selection() { return treeView.selectedElements; },
                get onDidChangeSelection() { return treeView.onDidChangeSelection; },
                get activeItem() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewActiveItem');
                    return treeView.focusedElement;
                },
                get onDidChangeActiveItem() {
                    (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewActiveItem');
                    return treeView.onDidChangeActiveItem;
                },
                get visible() { return treeView.visible; },
                get onDidChangeVisibility() { return treeView.onDidChangeVisibility; },
                get onDidChangeCheckboxState() {
                    return treeView.onDidChangeCheckboxState;
                },
                get message() { return treeView.message; },
                set message(message) {
                    if ((0, htmlContent_1.isMarkdownString)(message)) {
                        (0, extensions_1.checkProposedApiEnabled)(extension, 'treeViewMarkdownMessage');
                    }
                    treeView.message = message;
                },
                get title() { return treeView.title; },
                set title(title) {
                    treeView.title = title;
                },
                get description() {
                    return treeView.description;
                },
                set description(description) {
                    treeView.description = description;
                },
                get badge() {
                    return treeView.badge;
                },
                set badge(badge) {
                    if ((badge !== undefined) && extHostTypes.ViewBadge.isViewBadge(badge)) {
                        treeView.badge = {
                            value: Math.floor(Math.abs(badge.value)),
                            tooltip: badge.tooltip
                        };
                    }
                    else if (badge === undefined) {
                        treeView.badge = undefined;
                    }
                },
                reveal: (element, options) => {
                    return treeView.reveal(element, options);
                },
                dispose: async () => {
                    // Wait for the registration promise to finish before doing the dispose.
                    await registerPromise;
                    this.treeViews.delete(viewId);
                    treeView.dispose();
                }
            };
            this._register(view);
            return view;
        }
        $getChildren(treeViewId, treeItemHandle) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(treeViewId));
            }
            return treeView.getChildren(treeItemHandle);
        }
        async $handleDrop(destinationViewId, requestId, treeDataTransferDTO, targetItemHandle, token, operationUuid, sourceViewId, sourceTreeItemHandles) {
            const treeView = this.treeViews.get(destinationViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(destinationViewId));
            }
            const treeDataTransfer = extHostTypeConverters_1.DataTransfer.toDataTransfer(treeDataTransferDTO, async (dataItemIndex) => {
                return (await this._proxy.$resolveDropFileData(destinationViewId, requestId, dataItemIndex)).buffer;
            });
            if ((sourceViewId === destinationViewId) && sourceTreeItemHandles) {
                await this.addAdditionalTransferItems(treeDataTransfer, treeView, sourceTreeItemHandles, token, operationUuid);
            }
            return treeView.onDrop(treeDataTransfer, targetItemHandle, token);
        }
        async addAdditionalTransferItems(treeDataTransfer, treeView, sourceTreeItemHandles, token, operationUuid) {
            const existingTransferOperation = this.treeDragAndDropService.removeDragOperationTransfer(operationUuid);
            if (existingTransferOperation) {
                (await existingTransferOperation)?.forEach((value, key) => {
                    if (value) {
                        treeDataTransfer.set(key, value);
                    }
                });
            }
            else if (operationUuid && treeView.handleDrag) {
                const willDropPromise = treeView.handleDrag(sourceTreeItemHandles, treeDataTransfer, token);
                this.treeDragAndDropService.addDragOperationTransfer(operationUuid, willDropPromise);
                await willDropPromise;
            }
            return treeDataTransfer;
        }
        async $handleDrag(sourceViewId, sourceTreeItemHandles, operationUuid, token) {
            const treeView = this.treeViews.get(sourceViewId);
            if (!treeView) {
                return Promise.reject(new views_1.NoTreeViewError(sourceViewId));
            }
            const treeDataTransfer = await this.addAdditionalTransferItems(new extHostTypes.DataTransfer(), treeView, sourceTreeItemHandles, token, operationUuid);
            if (!treeDataTransfer || token.isCancellationRequested) {
                return;
            }
            return extHostTypeConverters_1.DataTransfer.from(treeDataTransfer);
        }
        async $hasResolve(treeViewId) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            return treeView.hasResolve;
        }
        $resolve(treeViewId, treeItemHandle, token) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            return treeView.resolveTreeItem(treeItemHandle, token);
        }
        $setExpanded(treeViewId, treeItemHandle, expanded) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setExpanded(treeItemHandle, expanded);
        }
        $setSelectionAndFocus(treeViewId, selectedHandles, focusedHandle) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setSelectionAndFocus(selectedHandles, focusedHandle);
        }
        $setVisible(treeViewId, isVisible) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                if (!isVisible) {
                    return;
                }
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setVisible(isVisible);
        }
        $changeCheckboxState(treeViewId, checkboxUpdate) {
            const treeView = this.treeViews.get(treeViewId);
            if (!treeView) {
                throw new views_1.NoTreeViewError(treeViewId);
            }
            treeView.setCheckboxState(checkboxUpdate);
        }
        createExtHostTreeView(id, options, extension) {
            const treeView = this._register(new ExtHostTreeView(id, options, this._proxy, this.commands.converter, this.logService, extension));
            this.treeViews.set(id, treeView);
            return treeView;
        }
        convertArgument(arg) {
            const treeView = this.treeViews.get(arg.$treeViewId);
            if (treeView && '$treeItemHandle' in arg) {
                return treeView.getExtensionElement(arg.$treeItemHandle);
            }
            if (treeView && '$focusedTreeItem' in arg && arg.$focusedTreeItem) {
                return treeView.focusedElement;
            }
            return null;
        }
    }
    exports.ExtHostTreeViews = ExtHostTreeViews;
    class ExtHostTreeView extends lifecycle_1.Disposable {
        static { this.LABEL_HANDLE_PREFIX = '0'; }
        static { this.ID_HANDLE_PREFIX = '1'; }
        get visible() { return this._visible; }
        get selectedElements() { return this._selectedHandles.map(handle => this.getExtensionElement(handle)).filter(element => !(0, types_1.isUndefinedOrNull)(element)); }
        get focusedElement() { return (this._focusedHandle ? this.getExtensionElement(this._focusedHandle) : undefined); }
        constructor(viewId, options, proxy, commands, logService, extension) {
            super();
            this.viewId = viewId;
            this.proxy = proxy;
            this.commands = commands;
            this.logService = logService;
            this.extension = extension;
            this.roots = undefined;
            this.elements = new Map();
            this.nodes = new Map();
            this._visible = false;
            this._selectedHandles = [];
            this._focusedHandle = undefined;
            this._onDidExpandElement = this._register(new event_1.Emitter());
            this.onDidExpandElement = this._onDidExpandElement.event;
            this._onDidCollapseElement = this._register(new event_1.Emitter());
            this.onDidCollapseElement = this._onDidCollapseElement.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeActiveItem = this._register(new event_1.Emitter());
            this.onDidChangeActiveItem = this._onDidChangeActiveItem.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeCheckboxState = this._register(new event_1.Emitter());
            this.onDidChangeCheckboxState = this._onDidChangeCheckboxState.event;
            this._onDidChangeData = this._register(new event_1.Emitter());
            this.refreshPromise = Promise.resolve();
            this.refreshQueue = Promise.resolve();
            this._message = '';
            this._title = '';
            this._refreshCancellationSource = new cancellation_1.CancellationTokenSource();
            if (extension.contributes && extension.contributes.views) {
                for (const location in extension.contributes.views) {
                    for (const view of extension.contributes.views[location]) {
                        if (view.id === viewId) {
                            this._title = view.name;
                        }
                    }
                }
            }
            this.dataProvider = options.treeDataProvider;
            this.dndController = options.dragAndDropController;
            if (this.dataProvider.onDidChangeTreeData) {
                this._register(this.dataProvider.onDidChangeTreeData(elementOrElements => this._onDidChangeData.fire({ message: false, element: elementOrElements })));
            }
            let refreshingPromise;
            let promiseCallback;
            const onDidChangeData = event_1.Event.debounce(this._onDidChangeData.event, (result, current) => {
                if (!result) {
                    result = { message: false, elements: [] };
                }
                if (current.element !== false) {
                    if (!refreshingPromise) {
                        // New refresh has started
                        refreshingPromise = new Promise(c => promiseCallback = c);
                        this.refreshPromise = this.refreshPromise.then(() => refreshingPromise);
                    }
                    if (Array.isArray(current.element)) {
                        result.elements.push(...current.element);
                    }
                    else {
                        result.elements.push(current.element);
                    }
                }
                if (current.message) {
                    result.message = true;
                }
                return result;
            }, 200, true);
            this._register(onDidChangeData(({ message, elements }) => {
                if (elements.length) {
                    this.refreshQueue = this.refreshQueue.then(() => {
                        const _promiseCallback = promiseCallback;
                        refreshingPromise = null;
                        return this.refresh(elements).then(() => _promiseCallback());
                    });
                }
                if (message) {
                    this.proxy.$setMessage(this.viewId, extHostTypeConverters_1.MarkdownString.fromStrict(this._message) ?? '');
                }
            }));
        }
        async getChildren(parentHandle) {
            const parentElement = parentHandle ? this.getExtensionElement(parentHandle) : undefined;
            if (parentHandle && !parentElement) {
                this.logService.error(`No tree item with id \'${parentHandle}\' found.`);
                return Promise.resolve([]);
            }
            let childrenNodes = this.getChildrenNodes(parentHandle); // Get it from cache
            if (!childrenNodes) {
                childrenNodes = await this.fetchChildrenNodes(parentElement);
            }
            return childrenNodes ? childrenNodes.map(n => n.item) : undefined;
        }
        getExtensionElement(treeItemHandle) {
            return this.elements.get(treeItemHandle);
        }
        reveal(element, options) {
            options = options ? options : { select: true, focus: false };
            const select = (0, types_1.isUndefinedOrNull)(options.select) ? true : options.select;
            const focus = (0, types_1.isUndefinedOrNull)(options.focus) ? false : options.focus;
            const expand = (0, types_1.isUndefinedOrNull)(options.expand) ? false : options.expand;
            if (typeof this.dataProvider.getParent !== 'function') {
                return Promise.reject(new Error(`Required registered TreeDataProvider to implement 'getParent' method to access 'reveal' method`));
            }
            if (element) {
                return this.refreshPromise
                    .then(() => this.resolveUnknownParentChain(element))
                    .then(parentChain => this.resolveTreeNode(element, parentChain[parentChain.length - 1])
                    .then(treeNode => this.proxy.$reveal(this.viewId, { item: treeNode.item, parentChain: parentChain.map(p => p.item) }, { select, focus, expand })), error => this.logService.error(error));
            }
            else {
                return this.proxy.$reveal(this.viewId, undefined, { select, focus, expand });
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this._onDidChangeData.fire({ message: true, element: false });
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.proxy.$setTitle(this.viewId, title, this._description);
        }
        get description() {
            return this._description;
        }
        set description(description) {
            this._description = description;
            this.proxy.$setTitle(this.viewId, this._title, description);
        }
        get badge() {
            return this._badge;
        }
        set badge(badge) {
            if (this._badge?.value === badge?.value &&
                this._badge?.tooltip === badge?.tooltip) {
                return;
            }
            this._badge = extHostTypeConverters_1.ViewBadge.from(badge);
            this.proxy.$setBadge(this.viewId, badge);
        }
        setExpanded(treeItemHandle, expanded) {
            const element = this.getExtensionElement(treeItemHandle);
            if (element) {
                if (expanded) {
                    this._onDidExpandElement.fire(Object.freeze({ element }));
                }
                else {
                    this._onDidCollapseElement.fire(Object.freeze({ element }));
                }
            }
        }
        setSelectionAndFocus(selectedHandles, focusedHandle) {
            const changedSelection = !(0, arrays_1.equals)(this._selectedHandles, selectedHandles);
            this._selectedHandles = selectedHandles;
            const changedFocus = this._focusedHandle !== focusedHandle;
            this._focusedHandle = focusedHandle;
            if (changedSelection) {
                this._onDidChangeSelection.fire(Object.freeze({ selection: this.selectedElements }));
            }
            if (changedFocus) {
                this._onDidChangeActiveItem.fire(Object.freeze({ activeItem: this.focusedElement }));
            }
        }
        setVisible(visible) {
            if (visible !== this._visible) {
                this._visible = visible;
                this._onDidChangeVisibility.fire(Object.freeze({ visible: this._visible }));
            }
        }
        async setCheckboxState(checkboxUpdates) {
            const items = (await Promise.all(checkboxUpdates.map(async (checkboxUpdate) => {
                const extensionItem = this.getExtensionElement(checkboxUpdate.treeItemHandle);
                if (extensionItem) {
                    return {
                        extensionItem: extensionItem,
                        treeItem: await this.dataProvider.getTreeItem(extensionItem),
                        newState: checkboxUpdate.newState ? extHostTypes.TreeItemCheckboxState.Checked : extHostTypes.TreeItemCheckboxState.Unchecked
                    };
                }
                return Promise.resolve(undefined);
            }))).filter((item) => item !== undefined);
            items.forEach(item => {
                item.treeItem.checkboxState = item.newState ? extHostTypes.TreeItemCheckboxState.Checked : extHostTypes.TreeItemCheckboxState.Unchecked;
            });
            this._onDidChangeCheckboxState.fire({ items: items.map(item => [item.extensionItem, item.newState]) });
        }
        async handleDrag(sourceTreeItemHandles, treeDataTransfer, token) {
            const extensionTreeItems = [];
            for (const sourceHandle of sourceTreeItemHandles) {
                const extensionItem = this.getExtensionElement(sourceHandle);
                if (extensionItem) {
                    extensionTreeItems.push(extensionItem);
                }
            }
            if (!this.dndController?.handleDrag || (extensionTreeItems.length === 0)) {
                return;
            }
            await this.dndController.handleDrag(extensionTreeItems, treeDataTransfer, token);
            return treeDataTransfer;
        }
        get hasHandleDrag() {
            return !!this.dndController?.handleDrag;
        }
        async onDrop(treeDataTransfer, targetHandleOrNode, token) {
            const target = targetHandleOrNode ? this.getExtensionElement(targetHandleOrNode) : undefined;
            if ((!target && targetHandleOrNode) || !this.dndController?.handleDrop) {
                return;
            }
            return (0, async_1.asPromise)(() => this.dndController?.handleDrop
                ? this.dndController.handleDrop(target, treeDataTransfer, token)
                : undefined);
        }
        get hasResolve() {
            return !!this.dataProvider.resolveTreeItem;
        }
        async resolveTreeItem(treeItemHandle, token) {
            if (!this.dataProvider.resolveTreeItem) {
                return;
            }
            const element = this.elements.get(treeItemHandle);
            if (element) {
                const node = this.nodes.get(element);
                if (node) {
                    const resolve = await this.dataProvider.resolveTreeItem(node.extensionItem, element, token) ?? node.extensionItem;
                    this.validateTreeItem(resolve);
                    // Resolvable elements. Currently only tooltip and command.
                    node.item.tooltip = this.getTooltip(resolve.tooltip);
                    node.item.command = this.getCommand(node.disposableStore, resolve.command);
                    return node.item;
                }
            }
            return;
        }
        resolveUnknownParentChain(element) {
            return this.resolveParent(element)
                .then((parent) => {
                if (!parent) {
                    return Promise.resolve([]);
                }
                return this.resolveUnknownParentChain(parent)
                    .then(result => this.resolveTreeNode(parent, result[result.length - 1])
                    .then(parentNode => {
                    result.push(parentNode);
                    return result;
                }));
            });
        }
        resolveParent(element) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node.parent ? this.elements.get(node.parent.item.handle) : undefined);
            }
            return (0, async_1.asPromise)(() => this.dataProvider.getParent(element));
        }
        resolveTreeNode(element, parent) {
            const node = this.nodes.get(element);
            if (node) {
                return Promise.resolve(node);
            }
            return (0, async_1.asPromise)(() => this.dataProvider.getTreeItem(element))
                .then(extTreeItem => this.createHandle(element, extTreeItem, parent, true))
                .then(handle => this.getChildren(parent ? parent.item.handle : undefined)
                .then(() => {
                const cachedElement = this.getExtensionElement(handle);
                if (cachedElement) {
                    const node = this.nodes.get(cachedElement);
                    if (node) {
                        return Promise.resolve(node);
                    }
                }
                throw new Error(`Cannot resolve tree item for element ${handle} from extension ${this.extension.identifier.value}`);
            }));
        }
        getChildrenNodes(parentNodeOrHandle) {
            if (parentNodeOrHandle) {
                let parentNode;
                if (typeof parentNodeOrHandle === 'string') {
                    const parentElement = this.getExtensionElement(parentNodeOrHandle);
                    parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                }
                else {
                    parentNode = parentNodeOrHandle;
                }
                return parentNode ? parentNode.children || undefined : undefined;
            }
            return this.roots;
        }
        async fetchChildrenNodes(parentElement) {
            // clear children cache
            this.clearChildren(parentElement);
            const cts = new cancellation_1.CancellationTokenSource(this._refreshCancellationSource.token);
            try {
                const parentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                const elements = await this.dataProvider.getChildren(parentElement);
                if (cts.token.isCancellationRequested) {
                    return undefined;
                }
                const coalescedElements = (0, arrays_1.coalesce)(elements || []);
                const treeItems = await Promise.all((0, arrays_1.coalesce)(coalescedElements).map(element => {
                    return this.dataProvider.getTreeItem(element);
                }));
                if (cts.token.isCancellationRequested) {
                    return undefined;
                }
                // createAndRegisterTreeNodes adds the nodes to a cache. This must be done sync so that they get added in the correct order.
                const items = treeItems.map((item, index) => item ? this.createAndRegisterTreeNode(coalescedElements[index], item, parentNode) : null);
                return (0, arrays_1.coalesce)(items);
            }
            finally {
                cts.dispose();
            }
        }
        refresh(elements) {
            const hasRoot = elements.some(element => !element);
            if (hasRoot) {
                // Cancel any pending children fetches
                this._refreshCancellationSource.dispose(true);
                this._refreshCancellationSource = new cancellation_1.CancellationTokenSource();
                this.clearAll(); // clear cache
                return this.proxy.$refresh(this.viewId);
            }
            else {
                const handlesToRefresh = this.getHandlesToRefresh(elements);
                if (handlesToRefresh.length) {
                    return this.refreshHandles(handlesToRefresh);
                }
            }
            return Promise.resolve(undefined);
        }
        getHandlesToRefresh(elements) {
            const elementsToUpdate = new Set();
            const elementNodes = elements.map(element => this.nodes.get(element));
            for (const elementNode of elementNodes) {
                if (elementNode && !elementsToUpdate.has(elementNode.item.handle)) {
                    // check if an ancestor of extElement is already in the elements list
                    let currentNode = elementNode;
                    while (currentNode && currentNode.parent && elementNodes.findIndex(node => currentNode && currentNode.parent && node && node.item.handle === currentNode.parent.item.handle) === -1) {
                        const parentElement = this.elements.get(currentNode.parent.item.handle);
                        currentNode = parentElement ? this.nodes.get(parentElement) : undefined;
                    }
                    if (currentNode && !currentNode.parent) {
                        elementsToUpdate.add(elementNode.item.handle);
                    }
                }
            }
            const handlesToUpdate = [];
            // Take only top level elements
            elementsToUpdate.forEach((handle) => {
                const element = this.elements.get(handle);
                if (element) {
                    const node = this.nodes.get(element);
                    if (node && (!node.parent || !elementsToUpdate.has(node.parent.item.handle))) {
                        handlesToUpdate.push(handle);
                    }
                }
            });
            return handlesToUpdate;
        }
        refreshHandles(itemHandles) {
            const itemsToRefresh = {};
            return Promise.all(itemHandles.map(treeItemHandle => this.refreshNode(treeItemHandle)
                .then(node => {
                if (node) {
                    itemsToRefresh[treeItemHandle] = node.item;
                }
            })))
                .then(() => Object.keys(itemsToRefresh).length ? this.proxy.$refresh(this.viewId, itemsToRefresh) : undefined);
        }
        refreshNode(treeItemHandle) {
            const extElement = this.getExtensionElement(treeItemHandle);
            if (extElement) {
                const existing = this.nodes.get(extElement);
                if (existing) {
                    this.clearChildren(extElement); // clear children cache
                    return (0, async_1.asPromise)(() => this.dataProvider.getTreeItem(extElement))
                        .then(extTreeItem => {
                        if (extTreeItem) {
                            const newNode = this.createTreeNode(extElement, extTreeItem, existing.parent);
                            this.updateNodeCache(extElement, newNode, existing, existing.parent);
                            existing.dispose();
                            return newNode;
                        }
                        return null;
                    });
                }
            }
            return Promise.resolve(null);
        }
        createAndRegisterTreeNode(element, extTreeItem, parentNode) {
            const node = this.createTreeNode(element, extTreeItem, parentNode);
            if (extTreeItem.id && this.elements.has(node.item.handle)) {
                throw new Error((0, nls_1.localize)('treeView.duplicateElement', 'Element with id {0} is already registered', extTreeItem.id));
            }
            this.addNodeToCache(element, node);
            this.addNodeToParentCache(node, parentNode);
            return node;
        }
        getTooltip(tooltip) {
            if (extHostTypes.MarkdownString.isMarkdownString(tooltip)) {
                return extHostTypeConverters_1.MarkdownString.from(tooltip);
            }
            return tooltip;
        }
        getCommand(disposable, command) {
            return command ? { ...this.commands.toInternal(command, disposable), originalId: command.command } : undefined;
        }
        getCheckbox(extensionTreeItem) {
            if (extensionTreeItem.checkboxState === undefined) {
                return undefined;
            }
            let checkboxState;
            let tooltip = undefined;
            let accessibilityInformation = undefined;
            if (typeof extensionTreeItem.checkboxState === 'number') {
                checkboxState = extensionTreeItem.checkboxState;
            }
            else {
                checkboxState = extensionTreeItem.checkboxState.state;
                tooltip = extensionTreeItem.checkboxState.tooltip;
                accessibilityInformation = extensionTreeItem.checkboxState.accessibilityInformation;
            }
            return { isChecked: checkboxState === extHostTypes.TreeItemCheckboxState.Checked, tooltip, accessibilityInformation };
        }
        validateTreeItem(extensionTreeItem) {
            if (!extHostTypes.TreeItem.isTreeItem(extensionTreeItem, this.extension)) {
                throw new Error(`Extension ${this.extension.identifier.value} has provided an invalid tree item.`);
            }
        }
        createTreeNode(element, extensionTreeItem, parent) {
            this.validateTreeItem(extensionTreeItem);
            const disposableStore = this._register(new lifecycle_1.DisposableStore());
            const handle = this.createHandle(element, extensionTreeItem, parent);
            const icon = this.getLightIconPath(extensionTreeItem);
            const item = {
                handle,
                parentHandle: parent ? parent.item.handle : undefined,
                label: toTreeItemLabel(extensionTreeItem.label, this.extension),
                description: extensionTreeItem.description,
                resourceUri: extensionTreeItem.resourceUri,
                tooltip: this.getTooltip(extensionTreeItem.tooltip),
                command: this.getCommand(disposableStore, extensionTreeItem.command),
                contextValue: extensionTreeItem.contextValue,
                icon,
                iconDark: this.getDarkIconPath(extensionTreeItem) || icon,
                themeIcon: this.getThemeIcon(extensionTreeItem),
                collapsibleState: (0, types_1.isUndefinedOrNull)(extensionTreeItem.collapsibleState) ? extHostTypes.TreeItemCollapsibleState.None : extensionTreeItem.collapsibleState,
                accessibilityInformation: extensionTreeItem.accessibilityInformation,
                checkbox: this.getCheckbox(extensionTreeItem),
            };
            return {
                item,
                extensionItem: extensionTreeItem,
                parent,
                children: undefined,
                disposableStore,
                dispose() { disposableStore.dispose(); }
            };
        }
        getThemeIcon(extensionTreeItem) {
            return extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon ? extensionTreeItem.iconPath : undefined;
        }
        createHandle(element, { id, label, resourceUri }, parent, returnFirst) {
            if (id) {
                return `${ExtHostTreeView.ID_HANDLE_PREFIX}/${id}`;
            }
            const treeItemLabel = toTreeItemLabel(label, this.extension);
            const prefix = parent ? parent.item.handle : ExtHostTreeView.LABEL_HANDLE_PREFIX;
            let elementId = treeItemLabel ? treeItemLabel.label : resourceUri ? (0, resources_1.basename)(resourceUri) : '';
            elementId = elementId.indexOf('/') !== -1 ? elementId.replace('/', '//') : elementId;
            const existingHandle = this.nodes.has(element) ? this.nodes.get(element).item.handle : undefined;
            const childrenNodes = (this.getChildrenNodes(parent) || []);
            let handle;
            let counter = 0;
            do {
                handle = `${prefix}/${counter}:${elementId}`;
                if (returnFirst || !this.elements.has(handle) || existingHandle === handle) {
                    // Return first if asked for or
                    // Return if handle does not exist or
                    // Return if handle is being reused
                    break;
                }
                counter++;
            } while (counter <= childrenNodes.length);
            return handle;
        }
        getLightIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon)) {
                if (typeof extensionTreeItem.iconPath === 'string'
                    || uri_1.URI.isUri(extensionTreeItem.iconPath)) {
                    return this.getIconPath(extensionTreeItem.iconPath);
                }
                return this.getIconPath(extensionTreeItem.iconPath.light);
            }
            return undefined;
        }
        getDarkIconPath(extensionTreeItem) {
            if (extensionTreeItem.iconPath && !(extensionTreeItem.iconPath instanceof extHostTypes.ThemeIcon) && extensionTreeItem.iconPath.dark) {
                return this.getIconPath(extensionTreeItem.iconPath.dark);
            }
            return undefined;
        }
        getIconPath(iconPath) {
            if (uri_1.URI.isUri(iconPath)) {
                return iconPath;
            }
            return uri_1.URI.file(iconPath);
        }
        addNodeToCache(element, node) {
            this.elements.set(node.item.handle, element);
            this.nodes.set(element, node);
        }
        updateNodeCache(element, newNode, existing, parentNode) {
            // Remove from the cache
            this.elements.delete(newNode.item.handle);
            this.nodes.delete(element);
            if (newNode.item.handle !== existing.item.handle) {
                this.elements.delete(existing.item.handle);
            }
            // Add the new node to the cache
            this.addNodeToCache(element, newNode);
            // Replace the node in parent's children nodes
            const childrenNodes = (this.getChildrenNodes(parentNode) || []);
            const childNode = childrenNodes.filter(c => c.item.handle === existing.item.handle)[0];
            if (childNode) {
                childrenNodes.splice(childrenNodes.indexOf(childNode), 1, newNode);
            }
        }
        addNodeToParentCache(node, parentNode) {
            if (parentNode) {
                if (!parentNode.children) {
                    parentNode.children = [];
                }
                parentNode.children.push(node);
            }
            else {
                if (!this.roots) {
                    this.roots = [];
                }
                this.roots.push(node);
            }
        }
        clearChildren(parentElement) {
            if (parentElement) {
                const node = this.nodes.get(parentElement);
                if (node) {
                    if (node.children) {
                        for (const child of node.children) {
                            const childElement = this.elements.get(child.item.handle);
                            if (childElement) {
                                this.clear(childElement);
                            }
                        }
                    }
                    node.children = undefined;
                }
            }
            else {
                this.clearAll();
            }
        }
        clear(element) {
            const node = this.nodes.get(element);
            if (node) {
                if (node.children) {
                    for (const child of node.children) {
                        const childElement = this.elements.get(child.item.handle);
                        if (childElement) {
                            this.clear(childElement);
                        }
                    }
                }
                this.nodes.delete(element);
                this.elements.delete(node.item.handle);
                node.dispose();
            }
        }
        clearAll() {
            this.roots = undefined;
            this.elements.clear();
            this.nodes.forEach(node => node.dispose());
            this.nodes.clear();
        }
        dispose() {
            super.dispose();
            this._refreshCancellationSource.dispose();
            this.clearAll();
            this.proxy.$disposeTree(this.viewId);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRyZWVWaWV3cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRyZWVWaWV3cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHLFNBQVMsZUFBZSxDQUFDLEtBQVUsRUFBRSxTQUFnQztRQUNwRSxJQUFJLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3JCLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBRUQsSUFBSSxLQUFLO2VBQ0wsT0FBTyxLQUFLLEtBQUssUUFBUTtlQUN6QixPQUFPLEtBQUssQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDckMsSUFBSSxVQUFVLEdBQW1DLFNBQVMsQ0FBQztZQUMzRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLFVBQVUsR0FBd0IsS0FBSyxDQUFDLFVBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsSUFBSSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUMxSyxVQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDekQsQ0FBQztZQUNELE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsQ0FBQztRQUMzQyxDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FB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