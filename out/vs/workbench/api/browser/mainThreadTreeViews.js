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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/arrays", "vs/platform/notification/common/notification", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/dataTransfer", "vs/workbench/api/common/shared/dataTransferCache", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/services/views/common/viewsService"], function (require, exports, lifecycle_1, extHost_protocol_1, views_1, extHostCustomers_1, arrays_1, notification_1, types_1, platform_1, extensions_1, log_1, dataTransfer_1, dataTransferCache_1, typeConvert, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTreeViews = void 0;
    let MainThreadTreeViews = class MainThreadTreeViews extends lifecycle_1.Disposable {
        constructor(extHostContext, viewsService, notificationService, extensionService, logService) {
            super();
            this.viewsService = viewsService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.logService = logService;
            this._dataProviders = this._register(new lifecycle_1.DisposableMap());
            this._dndControllers = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTreeViews);
        }
        async $registerTreeViewDataProvider(treeViewId, options) {
            this.logService.trace('MainThreadTreeViews#$registerTreeViewDataProvider', treeViewId, options);
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                const dataProvider = new TreeViewDataProvider(treeViewId, this._proxy, this.notificationService);
                const disposables = new lifecycle_1.DisposableStore();
                this._dataProviders.set(treeViewId, { dataProvider, dispose: () => disposables.dispose() });
                const dndController = (options.hasHandleDrag || options.hasHandleDrop)
                    ? new TreeViewDragAndDropController(treeViewId, options.dropMimeTypes, options.dragMimeTypes, options.hasHandleDrag, this._proxy) : undefined;
                const viewer = this.getTreeView(treeViewId);
                if (viewer) {
                    // Order is important here. The internal tree isn't created until the dataProvider is set.
                    // Set all other properties first!
                    viewer.showCollapseAllAction = options.showCollapseAll;
                    viewer.canSelectMany = options.canSelectMany;
                    viewer.manuallyManageCheckboxes = options.manuallyManageCheckboxes;
                    viewer.dragAndDropController = dndController;
                    if (dndController) {
                        this._dndControllers.set(treeViewId, dndController);
                    }
                    viewer.dataProvider = dataProvider;
                    this.registerListeners(treeViewId, viewer, disposables);
                    this._proxy.$setVisible(treeViewId, viewer.visible);
                }
                else {
                    this.notificationService.error('No view is registered with id: ' + treeViewId);
                }
            });
        }
        $reveal(treeViewId, itemInfo, options) {
            this.logService.trace('MainThreadTreeViews#$reveal', treeViewId, itemInfo?.item, itemInfo?.parentChain, options);
            return this.viewsService.openView(treeViewId, options.focus)
                .then(() => {
                const viewer = this.getTreeView(treeViewId);
                if (viewer && itemInfo) {
                    return this.reveal(viewer, this._dataProviders.get(treeViewId).dataProvider, itemInfo.item, itemInfo.parentChain, options);
                }
                return undefined;
            });
        }
        $refresh(treeViewId, itemsToRefreshByHandle) {
            this.logService.trace('MainThreadTreeViews#$refresh', treeViewId, itemsToRefreshByHandle);
            const viewer = this.getTreeView(treeViewId);
            const dataProvider = this._dataProviders.get(treeViewId);
            if (viewer && dataProvider) {
                const itemsToRefresh = dataProvider.dataProvider.getItemsToRefresh(itemsToRefreshByHandle);
                return viewer.refresh(itemsToRefresh.length ? itemsToRefresh : undefined);
            }
            return Promise.resolve();
        }
        $setMessage(treeViewId, message) {
            this.logService.trace('MainThreadTreeViews#$setMessage', treeViewId, message.toString());
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.message = message;
            }
        }
        $setTitle(treeViewId, title, description) {
            this.logService.trace('MainThreadTreeViews#$setTitle', treeViewId, title, description);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.title = title;
                viewer.description = description;
            }
        }
        $setBadge(treeViewId, badge) {
            this.logService.trace('MainThreadTreeViews#$setBadge', treeViewId, badge?.value, badge?.tooltip);
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.badge = badge;
            }
        }
        $resolveDropFileData(destinationViewId, requestId, dataItemId) {
            const controller = this._dndControllers.get(destinationViewId);
            if (!controller) {
                throw new Error('Unknown tree');
            }
            return controller.resolveDropFileData(requestId, dataItemId);
        }
        async $disposeTree(treeViewId) {
            const viewer = this.getTreeView(treeViewId);
            if (viewer) {
                viewer.dataProvider = undefined;
            }
            this._dataProviders.deleteAndDispose(treeViewId);
        }
        async reveal(treeView, dataProvider, itemIn, parentChain, options) {
            options = options ? options : { select: false, focus: false };
            const select = (0, types_1.isUndefinedOrNull)(options.select) ? false : options.select;
            const focus = (0, types_1.isUndefinedOrNull)(options.focus) ? false : options.focus;
            let expand = Math.min((0, types_1.isNumber)(options.expand) ? options.expand : options.expand === true ? 1 : 0, 3);
            if (dataProvider.isEmpty()) {
                // Refresh if empty
                await treeView.refresh();
            }
            for (const parent of parentChain) {
                const parentItem = dataProvider.getItem(parent.handle);
                if (parentItem) {
                    await treeView.expand(parentItem);
                }
            }
            const item = dataProvider.getItem(itemIn.handle);
            if (item) {
                await treeView.reveal(item);
                if (select) {
                    treeView.setSelection([item]);
                }
                if (focus === false) {
                    treeView.setFocus();
                }
                else if (focus) {
                    treeView.setFocus(item);
                }
                let itemsToExpand = [item];
                for (; itemsToExpand.length > 0 && expand > 0; expand--) {
                    await treeView.expand(itemsToExpand);
                    itemsToExpand = itemsToExpand.reduce((result, itemValue) => {
                        const item = dataProvider.getItem(itemValue.handle);
                        if (item && item.children && item.children.length) {
                            result.push(...item.children);
                        }
                        return result;
                    }, []);
                }
            }
        }
        registerListeners(treeViewId, treeView, disposables) {
            disposables.add(treeView.onDidExpandItem(item => this._proxy.$setExpanded(treeViewId, item.handle, true)));
            disposables.add(treeView.onDidCollapseItem(item => this._proxy.$setExpanded(treeViewId, item.handle, false)));
            disposables.add(treeView.onDidChangeSelectionAndFocus(items => this._proxy.$setSelectionAndFocus(treeViewId, items.selection.map(({ handle }) => handle), items.focus.handle)));
            disposables.add(treeView.onDidChangeVisibility(isVisible => this._proxy.$setVisible(treeViewId, isVisible)));
            disposables.add(treeView.onDidChangeCheckboxState(items => {
                this._proxy.$changeCheckboxState(treeViewId, items.map(item => {
                    return { treeItemHandle: item.handle, newState: item.checkbox?.isChecked ?? false };
                }));
            }));
        }
        getTreeView(treeViewId) {
            const viewDescriptor = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(treeViewId);
            return viewDescriptor ? viewDescriptor.treeView : null;
        }
        dispose() {
            for (const dataprovider of this._dataProviders) {
                const treeView = this.getTreeView(dataprovider[0]);
                if (treeView) {
                    treeView.dataProvider = undefined;
                }
            }
            this._dataProviders.dispose();
            this._dndControllers.clear();
            super.dispose();
        }
    };
    exports.MainThreadTreeViews = MainThreadTreeViews;
    exports.MainThreadTreeViews = MainThreadTreeViews = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTreeViews),
        __param(1, viewsService_1.IViewsService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_1.IExtensionService),
        __param(4, log_1.ILogService)
    ], MainThreadTreeViews);
    class TreeViewDragAndDropController {
        constructor(treeViewId, dropMimeTypes, dragMimeTypes, hasWillDrop, _proxy) {
            this.treeViewId = treeViewId;
            this.dropMimeTypes = dropMimeTypes;
            this.dragMimeTypes = dragMimeTypes;
            this.hasWillDrop = hasWillDrop;
            this._proxy = _proxy;
            this.dataTransfersCache = new dataTransferCache_1.DataTransferFileCache();
        }
        async handleDrop(dataTransfer, targetTreeItem, token, operationUuid, sourceTreeId, sourceTreeItemHandles) {
            const request = this.dataTransfersCache.add(dataTransfer);
            try {
                const dataTransferDto = await typeConvert.DataTransfer.from(dataTransfer);
                if (token.isCancellationRequested) {
                    return;
                }
                return await this._proxy.$handleDrop(this.treeViewId, request.id, dataTransferDto, targetTreeItem?.handle, token, operationUuid, sourceTreeId, sourceTreeItemHandles);
            }
            finally {
                request.dispose();
            }
        }
        async handleDrag(sourceTreeItemHandles, operationUuid, token) {
            if (!this.hasWillDrop) {
                return;
            }
            const additionalDataTransferDTO = await this._proxy.$handleDrag(this.treeViewId, sourceTreeItemHandles, operationUuid, token);
            if (!additionalDataTransferDTO) {
                return;
            }
            const additionalDataTransfer = new dataTransfer_1.VSDataTransfer();
            additionalDataTransferDTO.items.forEach(([type, item]) => {
                additionalDataTransfer.replace(type, (0, dataTransfer_1.createStringDataTransferItem)(item.asString));
            });
            return additionalDataTransfer;
        }
        resolveDropFileData(requestId, dataItemId) {
            return this.dataTransfersCache.resolveFileData(requestId, dataItemId);
        }
    }
    class TreeViewDataProvider {
        constructor(treeViewId, _proxy, notificationService) {
            this.treeViewId = treeViewId;
            this._proxy = _proxy;
            this.notificationService = notificationService;
            this.itemsMap = new Map();
            this.hasResolve = this._proxy.$hasResolve(this.treeViewId);
        }
        getChildren(treeItem) {
            if (!treeItem) {
                this.itemsMap.clear();
            }
            return this._proxy.$getChildren(this.treeViewId, treeItem ? treeItem.handle : undefined)
                .then(children => this.postGetChildren(children), err => {
                // It can happen that a tree view is disposed right as `getChildren` is called. This results in an error because the data provider gets removed.
                // The tree will shortly get cleaned up in this case. We just need to handle the error here.
                if (!views_1.NoTreeViewError.is(err)) {
                    this.notificationService.error(err);
                }
                return [];
            });
        }
        getItemsToRefresh(itemsToRefreshByHandle) {
            const itemsToRefresh = [];
            if (itemsToRefreshByHandle) {
                for (const treeItemHandle of Object.keys(itemsToRefreshByHandle)) {
                    const currentTreeItem = this.getItem(treeItemHandle);
                    if (currentTreeItem) { // Refresh only if the item exists
                        const treeItem = itemsToRefreshByHandle[treeItemHandle];
                        // Update the current item with refreshed item
                        this.updateTreeItem(currentTreeItem, treeItem);
                        if (treeItemHandle === treeItem.handle) {
                            itemsToRefresh.push(currentTreeItem);
                        }
                        else {
                            // Update maps when handle is changed and refresh parent
                            this.itemsMap.delete(treeItemHandle);
                            this.itemsMap.set(currentTreeItem.handle, currentTreeItem);
                            const parent = treeItem.parentHandle ? this.itemsMap.get(treeItem.parentHandle) : null;
                            if (parent) {
                                itemsToRefresh.push(parent);
                            }
                        }
                    }
                }
            }
            return itemsToRefresh;
        }
        getItem(treeItemHandle) {
            return this.itemsMap.get(treeItemHandle);
        }
        isEmpty() {
            return this.itemsMap.size === 0;
        }
        async postGetChildren(elements) {
            if (elements === undefined) {
                return undefined;
            }
            const result = [];
            const hasResolve = await this.hasResolve;
            if (elements) {
                for (const element of elements) {
                    const resolvable = new views_1.ResolvableTreeItem(element, hasResolve ? (token) => {
                        return this._proxy.$resolve(this.treeViewId, element.handle, token);
                    } : undefined);
                    this.itemsMap.set(element.handle, resolvable);
                    result.push(resolvable);
                }
            }
            return result;
        }
        updateTreeItem(current, treeItem) {
            treeItem.children = treeItem.children ? treeItem.children : undefined;
            if (current) {
                const properties = (0, arrays_1.distinct)([...Object.keys(current instanceof views_1.ResolvableTreeItem ? current.asTreeItem() : current),
                    ...Object.keys(treeItem)]);
                for (const property of properties) {
                    current[property] = treeItem[property];
                }
                if (current instanceof views_1.ResolvableTreeItem) {
                    current.resetResolve();
                }
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRyZWVWaWV3cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRUcmVlVmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJ6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBTWxELFlBQ0MsY0FBK0IsRUFDaEIsWUFBNEMsRUFDckMsbUJBQTBELEVBQzdELGdCQUFvRCxFQUMxRCxVQUF3QztZQUVyRCxLQUFLLEVBQUUsQ0FBQztZQUx3QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNwQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDekMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQVJyQyxtQkFBYyxHQUF1RixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBdUUsQ0FBQyxDQUFDO1lBQzlNLG9CQUFlLEdBQUcsSUFBSSxHQUFHLEVBQXlDLENBQUM7WUFVbkYsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxDQUFDO1FBRUQsS0FBSyxDQUFDLDZCQUE2QixDQUFDLFVBQWtCLEVBQUUsT0FBa007WUFDelAsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsbURBQW1ELEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWhHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQ25FLE1BQU0sWUFBWSxHQUFHLElBQUksb0JBQW9CLENBQUMsVUFBVSxFQUFF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