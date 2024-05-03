/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry"], function (require, exports, event_1, nls_1, instantiation_1, lifecycle_1, map_1, platform_1, arrays_1, objects_1, codicons_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoTreeViewError = exports.ResolvableTreeItem = exports.TreeItemCollapsibleState = exports.ViewVisibilityState = exports.IViewDescriptorService = exports.ViewContentGroups = exports.ViewContainerLocations = exports.ViewContainerLocation = exports.Extensions = exports.defaultViewIcon = exports.VIEWS_LOG_NAME = exports.VIEWS_LOG_ID = void 0;
    exports.ViewContainerLocationToString = ViewContainerLocationToString;
    exports.VIEWS_LOG_ID = 'views';
    exports.VIEWS_LOG_NAME = (0, nls_1.localize)('views log', "Views");
    exports.defaultViewIcon = (0, iconRegistry_1.registerIcon)('default-view-icon', codicons_1.Codicon.window, (0, nls_1.localize)('defaultViewIcon', 'Default view icon.'));
    var Extensions;
    (function (Extensions) {
        Extensions.ViewContainersRegistry = 'workbench.registry.view.containers';
        Extensions.ViewsRegistry = 'workbench.registry.view';
    })(Extensions || (exports.Extensions = Extensions = {}));
    var ViewContainerLocation;
    (function (ViewContainerLocation) {
        ViewContainerLocation[ViewContainerLocation["Sidebar"] = 0] = "Sidebar";
        ViewContainerLocation[ViewContainerLocation["Panel"] = 1] = "Panel";
        ViewContainerLocation[ViewContainerLocation["AuxiliaryBar"] = 2] = "AuxiliaryBar";
    })(ViewContainerLocation || (exports.ViewContainerLocation = ViewContainerLocation = {}));
    exports.ViewContainerLocations = [0 /* ViewContainerLocation.Sidebar */, 1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */];
    function ViewContainerLocationToString(viewContainerLocation) {
        switch (viewContainerLocation) {
            case 0 /* ViewContainerLocation.Sidebar */: return 'sidebar';
            case 1 /* ViewContainerLocation.Panel */: return 'panel';
            case 2 /* ViewContainerLocation.AuxiliaryBar */: return 'auxiliarybar';
        }
    }
    class ViewContainersRegistryImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this._onDidDeregister = this._register(new event_1.Emitter());
            this.onDidDeregister = this._onDidDeregister.event;
            this.viewContainers = new Map();
            this.defaultViewContainers = [];
        }
        get all() {
            return (0, arrays_1.flatten)([...this.viewContainers.values()]);
        }
        registerViewContainer(viewContainerDescriptor, viewContainerLocation, options) {
            const existing = this.get(viewContainerDescriptor.id);
            if (existing) {
                return existing;
            }
            const viewContainer = viewContainerDescriptor;
            viewContainer.openCommandActionDescriptor = options?.doNotRegisterOpenCommand ? undefined : (viewContainer.openCommandActionDescriptor ?? { id: viewContainer.id });
            const viewContainers = (0, map_1.getOrSet)(this.viewContainers, viewContainerLocation, []);
            viewContainers.push(viewContainer);
            if (options?.isDefault) {
                this.defaultViewContainers.push(viewContainer);
            }
            this._onDidRegister.fire({ viewContainer, viewContainerLocation });
            return viewContainer;
        }
        deregisterViewContainer(viewContainer) {
            for (const viewContainerLocation of this.viewContainers.keys()) {
                const viewContainers = this.viewContainers.get(viewContainerLocation);
                const index = viewContainers?.indexOf(viewContainer);
                if (index !== -1) {
                    viewContainers?.splice(index, 1);
                    if (viewContainers.length === 0) {
                        this.viewContainers.delete(viewContainerLocation);
                    }
                    this._onDidDeregister.fire({ viewContainer, viewContainerLocation });
                    return;
                }
            }
        }
        get(id) {
            return this.all.filter(viewContainer => viewContainer.id === id)[0];
        }
        getViewContainers(location) {
            return [...(this.viewContainers.get(location) || [])];
        }
        getViewContainerLocation(container) {
            return [...this.viewContainers.keys()].filter(location => this.getViewContainers(location).filter(viewContainer => viewContainer?.id === container.id).length > 0)[0];
        }
        getDefaultViewContainer(location) {
            return this.defaultViewContainers.find(viewContainer => this.getViewContainerLocation(viewContainer) === location);
        }
    }
    platform_1.Registry.add(Extensions.ViewContainersRegistry, new ViewContainersRegistryImpl());
    var ViewContentGroups;
    (function (ViewContentGroups) {
        ViewContentGroups["Open"] = "2_open";
        ViewContentGroups["Debug"] = "4_debug";
        ViewContentGroups["SCM"] = "5_scm";
        ViewContentGroups["More"] = "9_more";
    })(ViewContentGroups || (exports.ViewContentGroups = ViewContentGroups = {}));
    function compareViewContentDescriptors(a, b) {
        const aGroup = a.group ?? ViewContentGroups.More;
        const bGroup = b.group ?? ViewContentGroups.More;
        if (aGroup !== bGroup) {
            return aGroup.localeCompare(bGroup);
        }
        return (a.order ?? 5) - (b.order ?? 5);
    }
    class ViewsRegistry extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onViewsRegistered = this._register(new event_1.Emitter());
            this.onViewsRegistered = this._onViewsRegistered.event;
            this._onViewsDeregistered = this._register(new event_1.Emitter());
            this.onViewsDeregistered = this._onViewsDeregistered.event;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeViewWelcomeContent = this._register(new event_1.Emitter());
            this.onDidChangeViewWelcomeContent = this._onDidChangeViewWelcomeContent.event;
            this._viewContainers = [];
            this._views = new Map();
            this._viewWelcomeContents = new map_1.SetMap();
        }
        registerViews(views, viewContainer) {
            this.registerViews2([{ views, viewContainer }]);
        }
        registerViews2(views) {
            views.forEach(({ views, viewContainer }) => this.addViews(views, viewContainer));
            this._onViewsRegistered.fire(views);
        }
        deregisterViews(viewDescriptors, viewContainer) {
            const views = this.removeViews(viewDescriptors, viewContainer);
            if (views.length) {
                this._onViewsDeregistered.fire({ views, viewContainer });
            }
        }
        moveViews(viewsToMove, viewContainer) {
            for (const container of this._views.keys()) {
                if (container !== viewContainer) {
                    const views = this.removeViews(viewsToMove, container);
                    if (views.length) {
                        this.addViews(views, viewContainer);
                        this._onDidChangeContainer.fire({ views, from: container, to: viewContainer });
                    }
                }
            }
        }
        getViews(loc) {
            return this._views.get(loc) || [];
        }
        getView(id) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === id)[0];
                if (viewDescriptor) {
                    return viewDescriptor;
                }
            }
            return null;
        }
        getViewContainer(viewId) {
            for (const viewContainer of this._viewContainers) {
                const viewDescriptor = (this._views.get(viewContainer) || []).filter(v => v.id === viewId)[0];
                if (viewDescriptor) {
                    return viewContainer;
                }
            }
            return null;
        }
        registerViewWelcomeContent(id, viewContent) {
            this._viewWelcomeContents.add(id, viewContent);
            this._onDidChangeViewWelcomeContent.fire(id);
            return (0, lifecycle_1.toDisposable)(() => {
                this._viewWelcomeContents.delete(id, viewContent);
                this._onDidChangeViewWelcomeContent.fire(id);
            });
        }
        registerViewWelcomeContent2(id, viewContentMap) {
            const disposables = new Map();
            for (const [key, content] of viewContentMap) {
                this._viewWelcomeContents.add(id, content);
                disposables.set(key, (0, lifecycle_1.toDisposable)(() => {
                    this._viewWelcomeContents.delete(id, content);
                    this._onDidChangeViewWelcomeContent.fire(id);
                }));
            }
            this._onDidChangeViewWelcomeContent.fire(id);
            return disposables;
        }
        getViewWelcomeContent(id) {
            const result = [];
            this._viewWelcomeContents.forEach(id, descriptor => result.push(descriptor));
            return result.sort(compareViewContentDescriptors);
        }
        addViews(viewDescriptors, viewContainer) {
            let views = this._views.get(viewContainer);
            if (!views) {
                views = [];
                this._views.set(viewContainer, views);
                this._viewContainers.push(viewContainer);
            }
            for (const viewDescriptor of viewDescriptors) {
                if (this.getView(viewDescriptor.id) !== null) {
                    throw new Error((0, nls_1.localize)('duplicateId', "A view with id '{0}' is already registered", viewDescriptor.id));
                }
                views.push(viewDescriptor);
            }
        }
        removeViews(viewDescriptors, viewContainer) {
            const views = this._views.get(viewContainer);
            if (!views) {
                return [];
            }
            const viewsToDeregister = [];
            const remaningViews = [];
            for (const view of views) {
                if (!viewDescriptors.includes(view)) {
                    remaningViews.push(view);
                }
                else {
                    viewsToDeregister.push(view);
                }
            }
            if (viewsToDeregister.length) {
                if (remaningViews.length) {
                    this._views.set(viewContainer, remaningViews);
                }
                else {
                    this._views.delete(viewContainer);
                    this._viewContainers.splice(this._viewContainers.indexOf(viewContainer), 1);
                }
            }
            return viewsToDeregister;
        }
    }
    platform_1.Registry.add(Extensions.ViewsRegistry, new ViewsRegistry());
    exports.IViewDescriptorService = (0, instantiation_1.createDecorator)('viewDescriptorService');
    var ViewVisibilityState;
    (function (ViewVisibilityState) {
        ViewVisibilityState[ViewVisibilityState["Default"] = 0] = "Default";
        ViewVisibilityState[ViewVisibilityState["Expand"] = 1] = "Expand";
    })(ViewVisibilityState || (exports.ViewVisibilityState = ViewVisibilityState = {}));
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = TreeItemCollapsibleState = {}));
    class ResolvableTreeItem {
        constructor(treeItem, resolve) {
            this.resolved = false;
            this._hasResolve = false;
            (0, objects_1.mixin)(this, treeItem);
            this._hasResolve = !!resolve;
            this.resolve = async (token) => {
                if (resolve && !this.resolved) {
                    const resolvedItem = await resolve(token);
                    if (resolvedItem) {
                        // Resolvable elements. Currently tooltip and command.
                        this.tooltip = this.tooltip ?? resolvedItem.tooltip;
                        this.command = this.command ?? resolvedItem.command;
                    }
                }
                if (!token.isCancellationRequested) {
                    this.resolved = true;
                }
            };
        }
        get hasResolve() {
            return this._hasResolve;
        }
        resetResolve() {
            this.resolved = false;
        }
        asTreeItem() {
            return {
                handle: this.handle,
                parentHandle: this.parentHandle,
                collapsibleState: this.collapsibleState,
                label: this.label,
                description: this.description,
                icon: this.icon,
                iconDark: this.iconDark,
                themeIcon: this.themeIcon,
                resourceUri: this.resourceUri,
                tooltip: this.tooltip,
                contextValue: this.contextValue,
                command: this.command,
                children: this.children,
                accessibilityInformation: this.accessibilityInformation
            };
        }
    }
    exports.ResolvableTreeItem = ResolvableTreeItem;
    class NoTreeViewError extends Error {
        constructor(treeViewId) {
            super((0, nls_1.localize)('treeView.notRegistered', 'No tree view with id \'{0}\' registered.', treeViewId));
            this.name = 'NoTreeViewError';
        }
        static is(err) {
            return err.name === 'NoTreeViewError';
        }
    }
    exports.NoTreeViewError = NoTreeViewError;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb21tb24vdmlld3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNENoRyxzRUFNQztJQXZCWSxRQUFBLFlBQVksR0FBRyxPQUFPLENBQUM7SUFDdkIsUUFBQSxjQUFjLEdBQUcsSUFBQSxjQUFRLEVBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELFFBQUEsZUFBZSxHQUFHLElBQUEsMkJBQVksRUFBQyxtQkFBbUIsRUFBRSxrQkFBTyxDQUFDLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFFcEksSUFBaUIsVUFBVSxDQUcxQjtJQUhELFdBQWlCLFVBQVU7UUFDYixpQ0FBc0IsR0FBRyxvQ0FBb0MsQ0FBQztRQUM5RCx3QkFBYSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hELENBQUMsRUFIZ0IsVUFBVSwwQkFBVixVQUFVLFFBRzFCO0lBRUQsSUFBa0IscUJBSWpCO0lBSkQsV0FBa0IscUJBQXFCO1FBQ3RDLHVFQUFPLENBQUE7UUFDUCxtRUFBSyxDQUFBO1FBQ0wsaUZBQVksQ0FBQTtJQUNiLENBQUMsRUFKaUIscUJBQXFCLHFDQUFyQixxQkFBcUIsUUFJdEM7SUFFWSxRQUFBLHNCQUFzQixHQUFHLHdIQUFnRyxDQUFDO0lBRXZJLFNBQWdCLDZCQUE2QixDQUFDLHFCQUE0QztRQUN6RixRQUFRLHFCQUFxQixFQUFFLENBQUM7WUFDL0IsMENBQWtDLENBQUMsQ0FBQyxPQUFPLFNBQVMsQ0FBQztZQUNyRCx3Q0FBZ0MsQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDO1lBQ2pELCtDQUF1QyxDQUFDLENBQUMsT0FBTyxjQUFjLENBQUM7UUFDaEUsQ0FBQztJQUNGLENB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