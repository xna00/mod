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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/strings", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/base/common/themables", "vs/workbench/browser/panecomposite", "vs/workbench/browser/parts/views/treeView", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/remote/browser/remoteExplorer", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/webviewView/browser/webviewViewPane", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/keyCodes", "vs/platform/list/browser/listService", "vs/platform/hover/browser/hover", "vs/base/common/cancellation", "vs/base/browser/ui/tree/asyncDataTree", "vs/workbench/services/views/browser/treeViewsService", "vs/platform/log/common/log", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/lifecycle"], function (require, exports, resources, strings_1, nls_1, contextkey_1, extensions_1, descriptors_1, instantiation_1, platform_1, themables_1, panecomposite_1, treeView_1, viewPaneContainer_1, contributions_1, views_1, debug_1, files_1, remoteExplorer_1, scm_1, webviewViewPane_1, extensions_2, extensionsRegistry_1, keybindingsRegistry_1, keyCodes_1, listService_1, hover_1, cancellation_1, asyncDataTree_1, treeViewsService_1, log_1, extensionFeatures_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.viewsContainersContribution = void 0;
    const viewsContainerSchema = {
        type: 'object',
        properties: {
            id: {
                description: (0, nls_1.localize)({ key: 'vscode.extension.contributes.views.containers.id', comment: ['Contribution refers to those that an extension contributes to VS Code through an extension/contribution point. '] }, "Unique id used to identify the container in which views can be contributed using 'views' contribution point"),
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$'
            },
            title: {
                description: (0, nls_1.localize)('vscode.extension.contributes.views.containers.title', 'Human readable string used to render the container'),
                type: 'string'
            },
            icon: {
                description: (0, nls_1.localize)('vscode.extension.contributes.views.containers.icon', "Path to the container icon. Icons are 24x24 centered on a 50x40 block and have a fill color of 'rgb(215, 218, 224)' or '#d7dae0'. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            }
        },
        required: ['id', 'title', 'icon']
    };
    exports.viewsContainersContribution = {
        description: (0, nls_1.localize)('vscode.extension.contributes.viewsContainers', 'Contributes views containers to the editor'),
        type: 'object',
        properties: {
            'activitybar': {
                description: (0, nls_1.localize)('views.container.activitybar', "Contribute views containers to Activity Bar"),
                type: 'array',
                items: viewsContainerSchema
            },
            'panel': {
                description: (0, nls_1.localize)('views.container.panel', "Contribute views containers to Panel"),
                type: 'array',
                items: viewsContainerSchema
            }
        }
    };
    var ViewType;
    (function (ViewType) {
        ViewType["Tree"] = "tree";
        ViewType["Webview"] = "webview";
    })(ViewType || (ViewType = {}));
    var InitialVisibility;
    (function (InitialVisibility) {
        InitialVisibility["Visible"] = "visible";
        InitialVisibility["Hidden"] = "hidden";
        InitialVisibility["Collapsed"] = "collapsed";
    })(InitialVisibility || (InitialVisibility = {}));
    const viewDescriptor = {
        type: 'object',
        required: ['id', 'name'],
        defaultSnippets: [{ body: { id: '${1:id}', name: '${2:name}' } }],
        properties: {
            type: {
                markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.view.type', "Type of the view. This can either be `tree` for a tree view based view or `webview` for a webview based view. The default is `tree`."),
                type: 'string',
                enum: [
                    'tree',
                    'webview',
                ],
                markdownEnumDescriptions: [
                    (0, nls_1.localize)('vscode.extension.contributes.view.tree', "The view is backed by a `TreeView` created by `createTreeView`."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.webview', "The view is backed by a `WebviewView` registered by `registerWebviewViewProvider`."),
                ]
            },
            id: {
                markdownDescription: (0, nls_1.localize)('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            icon: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.icon', "Path to the view icon. View icons are displayed when the name of the view cannot be shown. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            },
            contextualTitle: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.contextualTitle', "Human-readable context for when the view is moved out of its original location. By default, the view's container name will be used."),
                type: 'string'
            },
            visibility: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.initialState', "Initial state of the view when the extension is first installed. Once the user has changed the view state by collapsing, moving, or hiding the view, the initial state will not be used again."),
                type: 'string',
                enum: [
                    'visible',
                    'hidden',
                    'collapsed'
                ],
                default: 'visible',
                enumDescriptions: [
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.visible', "The default initial state for the view. In most containers the view will be expanded, however; some built-in containers (explorer, scm, and debug) show all contributed views collapsed regardless of the `visibility`."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.hidden', "The view will not be shown in the view container, but will be discoverable through the views menu and other view entry points and can be un-hidden by the user."),
                    (0, nls_1.localize)('vscode.extension.contributes.view.initialState.collapsed', "The view will show in the view container, but will be collapsed.")
                ]
            },
            initialSize: {
                type: 'number',
                description: (0, nls_1.localize)('vscode.extension.contributs.view.size', "The initial size of the view. The size will behave like the css 'flex' property, and will set the initial size when the view is first shown. In the side bar, this is the height of the view. This value is only respected when the same extension owns both the view and the view container."),
            }
        }
    };
    const remoteViewDescriptor = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
            id: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.id', 'Identifier of the view. This should be unique across all views. It is recommended to include your extension id as part of the view id. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            group: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.group', 'Nested group in the viewlet'),
                type: 'string'
            },
            remoteName: {
                description: (0, nls_1.localize)('vscode.extension.contributes.view.remoteName', 'The name of the remote type associated with this view'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            }
        }
    };
    const viewsContribution = {
        description: (0, nls_1.localize)('vscode.extension.contributes.views', "Contributes views to the editor"),
        type: 'object',
        properties: {
            'explorer': {
                description: (0, nls_1.localize)('views.explorer', "Contributes views to Explorer container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'debug': {
                description: (0, nls_1.localize)('views.debug', "Contributes views to Debug container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'scm': {
                description: (0, nls_1.localize)('views.scm', "Contributes views to SCM container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'test': {
                description: (0, nls_1.localize)('views.test', "Contributes views to Test container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'remote': {
                description: (0, nls_1.localize)('views.remote', "Contributes views to Remote container in the Activity bar. To contribute to this container, enableProposedApi needs to be turned on"),
                type: 'array',
                items: remoteViewDescriptor,
                default: []
            }
        },
        additionalProperties: {
            description: (0, nls_1.localize)('views.contributed', "Contributes views to contributed views container"),
            type: 'array',
            items: viewDescriptor,
            default: []
        }
    };
    const viewsContainersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'viewsContainers',
        jsonSchema: exports.viewsContainersContribution
    });
    const viewsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'views',
        deps: [viewsContainersExtensionPoint],
        jsonSchema: viewsContribution,
        activationEventsGenerator: (viewExtensionPointTypeArray, result) => {
            for (const viewExtensionPointType of viewExtensionPointTypeArray) {
                for (const viewDescriptors of Object.values(viewExtensionPointType)) {
                    for (const viewDescriptor of viewDescriptors) {
                        if (viewDescriptor.id) {
                            result.push(`onView:${viewDescriptor.id}`);
                        }
                    }
                }
            }
        }
    });
    const CUSTOM_VIEWS_START_ORDER = 7;
    let ViewsExtensionHandler = class ViewsExtensionHandler {
        static { this.ID = 'workbench.contrib.viewsExtensionHandler'; }
        constructor(instantiationService, logService) {
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.handleAndRegisterCustomViewContainers();
            this.handleAndRegisterCustomViews();
            let showTreeHoverCancellation = new cancellation_1.CancellationTokenSource();
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: 'workbench.action.showTreeHover',
                handler: async (accessor, ...args) => {
                    showTreeHoverCancellation.cancel();
                    showTreeHoverCancellation = new cancellation_1.CancellationTokenSource();
                    const listService = accessor.get(listService_1.IListService);
                    const treeViewsService = accessor.get(treeViewsService_1.ITreeViewsService);
                    const hoverService = accessor.get(hover_1.IHoverService);
                    const lastFocusedList = listService.lastFocusedList;
                    if (!(lastFocusedList instanceof asyncDataTree_1.AsyncDataTree)) {
                        return;
                    }
                    const focus = lastFocusedList.getFocus();
                    if (!focus || (focus.length === 0)) {
                        return;
                    }
                    const treeItem = focus[0];
                    if (treeItem instanceof views_1.ResolvableTreeItem) {
                        await treeItem.resolve(showTreeHoverCancellation.token);
                    }
                    if (!treeItem.tooltip) {
                        return;
                    }
                    const element = treeViewsService.getRenderedTreeElement(('handle' in treeItem) ? treeItem.handle : treeItem);
                    if (!element) {
                        return;
                    }
                    hoverService.showHover({
                        content: treeItem.tooltip,
                        target: element,
                        position: {
                            hoverPosition: 2 /* HoverPosition.BELOW */,
                        },
                        persistence: {
                            hideOnHover: false
                        }
                    }, true);
                },
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                when: contextkey_1.ContextKeyExpr.and(treeView_1.RawCustomTreeViewContextKey, listService_1.WorkbenchListFocusContextKey)
            });
        }
        handleAndRegisterCustomViewContainers() {
            viewsContainersExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeCustomViewContainers(removed);
                }
                if (added.length) {
                    this.addCustomViewContainers(added, this.viewContainersRegistry.all);
                }
            });
        }
        addCustomViewContainers(extensionPoints, existingViewContainers) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            let activityBarOrder = CUSTOM_VIEWS_START_ORDER + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === 0 /* ViewContainerLocation.Sidebar */).length;
            let panelOrder = 5 + viewContainersRegistry.all.filter(v => !!v.extensionId && viewContainersRegistry.getViewContainerLocation(v) === 1 /* ViewContainerLocation.Panel */).length + 1;
            for (const { value, collector, description } of extensionPoints) {
                Object.entries(value).forEach(([key, value]) => {
                    if (!this.isValidViewsContainer(value, collector)) {
                        return;
                    }
                    switch (key) {
                        case 'activitybar':
                            activityBarOrder = this.registerCustomViewContainers(value, description, activityBarOrder, existingViewContainers, 0 /* ViewContainerLocation.Sidebar */);
                            break;
                        case 'panel':
                            panelOrder = this.registerCustomViewContainers(value, description, panelOrder, existingViewContainers, 1 /* ViewContainerLocation.Panel */);
                            break;
                    }
                });
            }
        }
        removeCustomViewContainers(extensionPoints) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            const removedExtensions = extensionPoints.reduce((result, e) => { result.add(e.description.identifier); return result; }, new extensions_1.ExtensionIdentifierSet());
            for (const viewContainer of viewContainersRegistry.all) {
                if (viewContainer.extensionId && removedExtensions.has(viewContainer.extensionId)) {
                    // move all views in this container into default view container
                    const views = this.viewsRegistry.getViews(viewContainer);
                    if (views.length) {
                        this.viewsRegistry.moveViews(views, this.getDefaultViewContainer());
                    }
                    this.deregisterCustomViewContainer(viewContainer);
                }
            }
        }
        isValidViewsContainer(viewsContainersDescriptors, collector) {
            if (!Array.isArray(viewsContainersDescriptors)) {
                collector.error((0, nls_1.localize)('viewcontainer requirearray', "views containers must be an array"));
                return false;
            }
            for (const descriptor of viewsContainersDescriptors) {
                if (typeof descriptor.id !== 'string' && (0, strings_1.isFalsyOrWhitespace)(descriptor.id)) {
                    collector.error((0, nls_1.localize)('requireidstring', "property `{0}` is mandatory and must be of type `string` with non-empty value. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (!(/^[a-z0-9_-]+$/i.test(descriptor.id))) {
                    collector.error((0, nls_1.localize)('requireidstring', "property `{0}` is mandatory and must be of type `string` with non-empty value. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (typeof descriptor.title !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'title'));
                    return false;
                }
                if (typeof descriptor.icon !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'icon'));
                    return false;
                }
                if ((0, strings_1.isFalsyOrWhitespace)(descriptor.title)) {
                    collector.warn((0, nls_1.localize)('requirenonemptystring', "property `{0}` is mandatory and must be of type `string` with non-empty value", 'title'));
                    return true;
                }
            }
            return true;
        }
        registerCustomViewContainers(containers, extension, order, existingViewContainers, location) {
            containers.forEach(descriptor => {
                const themeIcon = themables_1.ThemeIcon.fromString(descriptor.icon);
                const icon = themeIcon || resources.joinPath(extension.extensionLocation, descriptor.icon);
                const id = `workbench.view.extension.${descriptor.id}`;
                const title = descriptor.title || id;
                const viewContainer = this.registerCustomViewContainer(id, title, icon, order++, extension.identifier, location);
                // Move those views that belongs to this container
                if (existingViewContainers.length) {
                    const viewsToMove = [];
                    for (const existingViewContainer of existingViewContainers) {
                        if (viewContainer !== existingViewContainer) {
                            viewsToMove.push(...this.viewsRegistry.getViews(existingViewContainer).filter(view => view.originalContainerId === descriptor.id));
                        }
                    }
                    if (viewsToMove.length) {
                        this.viewsRegistry.moveViews(viewsToMove, viewContainer);
                    }
                }
            });
            return order;
        }
        registerCustomViewContainer(id, title, icon, order, extensionId, location) {
            let viewContainer = this.viewContainersRegistry.get(id);
            if (!viewContainer) {
                viewContainer = this.viewContainersRegistry.registerViewContainer({
                    id,
                    title: { value: title, original: title },
                    extensionId,
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true }]),
                    hideIfEmpty: true,
                    order,
                    icon,
                }, location);
            }
            return viewContainer;
        }
        deregisterCustomViewContainer(viewContainer) {
            this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            platform_1.Registry.as(panecomposite_1.Extensions.Viewlets).deregisterPaneComposite(viewContainer.id);
        }
        handleAndRegisterCustomViews() {
            viewsExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeViews(removed);
                }
                if (added.length) {
                    this.addViews(added);
                }
            });
        }
        addViews(extensions) {
            const viewIds = new Set();
            const allViewDescriptors = [];
            for (const extension of extensions) {
                const { value, collector } = extension;
                Object.entries(value).forEach(([key, value]) => {
                    if (!this.isValidViewDescriptors(value, collector)) {
                        return;
                    }
                    if (key === 'remote' && !(0, extensions_2.isProposedApiEnabled)(extension.description, 'contribViewsRemote')) {
                        collector.warn((0, nls_1.localize)('ViewContainerRequiresProposedAPI', "View container '{0}' requires 'enabledApiProposals: [\"contribViewsRemote\"]' to be added to 'Remote'.", key));
                        return;
                    }
                    const viewContainer = this.getViewContainer(key);
                    if (!viewContainer) {
                        collector.warn((0, nls_1.localize)('ViewContainerDoesnotExist', "View container '{0}' does not exist and all views registered to it will be added to 'Explorer'.", key));
                    }
                    const container = viewContainer || this.getDefaultViewContainer();
                    const viewDescriptors = [];
                    for (let index = 0; index < value.length; index++) {
                        const item = value[index];
                        // validate
                        if (viewIds.has(item.id)) {
                            collector.error((0, nls_1.localize)('duplicateView1', "Cannot register multiple views with same id `{0}`", item.id));
                            continue;
                        }
                        if (this.viewsRegistry.getView(item.id) !== null) {
                            collector.error((0, nls_1.localize)('duplicateView2', "A view with id `{0}` is already registered.", item.id));
                            continue;
                        }
                        const order = extensions_1.ExtensionIdentifier.equals(extension.description.identifier, container.extensionId)
                            ? index + 1
                            : container.viewOrderDelegate
                                ? container.viewOrderDelegate.getOrder(item.group)
                                : undefined;
                        let icon;
                        if (typeof item.icon === 'string') {
                            icon = themables_1.ThemeIcon.fromString(item.icon) || resources.joinPath(extension.description.extensionLocation, item.icon);
                        }
                        const initialVisibility = this.convertInitialVisibility(item.visibility);
                        const type = this.getViewType(item.type);
                        if (!type) {
                            collector.error((0, nls_1.localize)('unknownViewType', "Unknown view type `{0}`.", item.type));
                            continue;
                        }
                        let weight = undefined;
                        if (typeof item.initialSize === 'number') {
                            if (container.extensionId?.value === extension.description.identifier.value) {
                                weight = item.initialSize;
                            }
                            else {
                                this.logService.warn(`${extension.description.identifier.value} tried to set the view size of ${item.id} but it was ignored because the view container does not belong to it.`);
                            }
                        }
                        const viewDescriptor = {
                            type: type,
                            ctorDescriptor: type === ViewType.Tree ? new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane) : new descriptors_1.SyncDescriptor(webviewViewPane_1.WebviewViewPane),
                            id: item.id,
                            name: { value: item.name, original: item.name },
                            when: contextkey_1.ContextKeyExpr.deserialize(item.when),
                            containerIcon: icon || viewContainer?.icon,
                            containerTitle: item.contextualTitle || (viewContainer && (typeof viewContainer.title === 'string' ? viewContainer.title : viewContainer.title.value)),
                            canToggleVisibility: true,
                            canMoveView: viewContainer?.id !== remoteExplorer_1.VIEWLET_ID,
                            treeView: type === ViewType.Tree ? this.instantiationService.createInstance(treeView_1.CustomTreeView, item.id, item.name, extension.description.identifier.value) : undefined,
                            collapsed: this.showCollapsed(container) || initialVisibility === InitialVisibility.Collapsed,
                            order: order,
                            extensionId: extension.description.identifier,
                            originalContainerId: key,
                            group: item.group,
                            remoteAuthority: item.remoteName || item.remoteAuthority, // TODO@roblou - delete after remote extensions are updated
                            virtualWorkspace: item.virtualWorkspace,
                            hideByDefault: initialVisibility === InitialVisibility.Hidden,
                            workspace: viewContainer?.id === remoteExplorer_1.VIEWLET_ID ? true : undefined,
                            weight
                        };
                        viewIds.add(viewDescriptor.id);
                        viewDescriptors.push(viewDescriptor);
                    }
                    allViewDescriptors.push({ viewContainer: container, views: viewDescriptors });
                });
            }
            this.viewsRegistry.registerViews2(allViewDescriptors);
        }
        getViewType(type) {
            if (type === ViewType.Webview) {
                return ViewType.Webview;
            }
            if (!type || type === ViewType.Tree) {
                return ViewType.Tree;
            }
            return undefined;
        }
        getDefaultViewContainer() {
            return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
        }
        removeViews(extensions) {
            const removedExtensions = extensions.reduce((result, e) => { result.add(e.description.identifier); return result; }, new extensions_1.ExtensionIdentifierSet());
            for (const viewContainer of this.viewContainersRegistry.all) {
                const removedViews = this.viewsRegistry.getViews(viewContainer).filter(v => v.extensionId && removedExtensions.has(v.extensionId));
                if (removedViews.length) {
                    this.viewsRegistry.deregisterViews(removedViews, viewContainer);
                    for (const view of removedViews) {
                        const anyView = view;
                        if (anyView.treeView) {
                            anyView.treeView.dispose();
                        }
                    }
                }
            }
        }
        convertInitialVisibility(value) {
            if (Object.values(InitialVisibility).includes(value)) {
                return value;
            }
            return undefined;
        }
        isValidViewDescriptors(viewDescriptors, collector) {
            if (!Array.isArray(viewDescriptors)) {
                collector.error((0, nls_1.localize)('requirearray', "views must be an array"));
                return false;
            }
            for (const descriptor of viewDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                    return false;
                }
                if (typeof descriptor.name !== 'string') {
                    collector.error((0, nls_1.localize)('requirestring', "property `{0}` is mandatory and must be of type `string`", 'name'));
                    return false;
                }
                if (descriptor.when && typeof descriptor.when !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                    return false;
                }
                if (descriptor.icon && typeof descriptor.icon !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'icon'));
                    return false;
                }
                if (descriptor.contextualTitle && typeof descriptor.contextualTitle !== 'string') {
                    collector.error((0, nls_1.localize)('optstring', "property `{0}` can be omitted or must be of type `string`", 'contextualTitle'));
                    return false;
                }
                if (descriptor.visibility && !this.convertInitialVisibility(descriptor.visibility)) {
                    collector.error((0, nls_1.localize)('optenum', "property `{0}` can be omitted or must be one of {1}", 'visibility', Object.values(InitialVisibility).join(', ')));
                    return false;
                }
            }
            return true;
        }
        getViewContainer(value) {
            switch (value) {
                case 'explorer': return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
                case 'debug': return this.viewContainersRegistry.get(debug_1.VIEWLET_ID);
                case 'scm': return this.viewContainersRegistry.get(scm_1.VIEWLET_ID);
                case 'remote': return this.viewContainersRegistry.get(remoteExplorer_1.VIEWLET_ID);
                default: return this.viewContainersRegistry.get(`workbench.view.extension.${value}`);
            }
        }
        showCollapsed(container) {
            switch (container.id) {
                case files_1.VIEWLET_ID:
                case scm_1.VIEWLET_ID:
                case debug_1.VIEWLET_ID:
                    return true;
            }
            return false;
        }
    };
    ViewsExtensionHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, log_1.ILogService)
    ], ViewsExtensionHandler);
    class ViewContainersDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.viewsContainers;
        }
        render(manifest) {
            const contrib = manifest.contributes?.viewsContainers || {};
            const viewContainers = Object.keys(contrib).reduce((result, location) => {
                const viewContainersForLocation = contrib[location];
                result.push(...viewContainersForLocation.map(viewContainer => ({ ...viewContainer, location })));
                return result;
            }, []);
            if (!viewContainers.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('view container id', "ID"),
                (0, nls_1.localize)('view container title', "Title"),
                (0, nls_1.localize)('view container location', "Where"),
            ];
            const rows = viewContainers
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(viewContainer => {
                return [
                    viewContainer.id,
                    viewContainer.title,
                    viewContainer.location
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    class ViewsDataRenderer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.type = 'table';
        }
        shouldRender(manifest) {
            return !!manifest.contributes?.views;
        }
        render(manifest) {
            const contrib = manifest.contributes?.views || {};
            const views = Object.keys(contrib).reduce((result, location) => {
                const viewsForLocation = contrib[location];
                result.push(...viewsForLocation.map(view => ({ ...view, location })));
                return result;
            }, []);
            if (!views.length) {
                return { data: { headers: [], rows: [] }, dispose: () => { } };
            }
            const headers = [
                (0, nls_1.localize)('view id', "ID"),
                (0, nls_1.localize)('view name title', "Name"),
                (0, nls_1.localize)('view container location', "Where"),
            ];
            const rows = views
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(view => {
                return [
                    view.id,
                    view.name,
                    view.location
                ];
            });
            return {
                data: {
                    headers,
                    rows
                },
                dispose: () => { }
            };
        }
    }
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'viewsContainers',
        label: (0, nls_1.localize)('viewsContainers', "View Containers"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ViewContainersDataRenderer),
    });
    platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).registerExtensionFeature({
        id: 'views',
        label: (0, nls_1.localize)('views', "Views"),
        access: {
            canToggle: false
        },
        renderer: new descriptors_1.SyncDescriptor(ViewsDataRenderer),
    });
    (0, contributions_1.registerWorkbenchContribution2)(ViewsExtensionHandler.ID, ViewsExtensionHandler, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3NFeHRlbnNpb25Qb2ludC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL3ZpZXdzRXh0ZW5zaW9uUG9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkNoRyxNQUFNLG9CQUFvQixHQUFnQjtRQUN6QyxJQUFJLEVBQUUsUUFBUTtRQUNkLFVBQVUsRUFBRTtZQUNYLEVBQUUsRUFBRTtnQkFDSCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsa0RBQWtELEVBQUUsT0FBTyxFQUFFLENBQUMsaUhBQWlILENBQUMsRUFBRSxFQUFFLDZHQUE2RyxDQUFDO2dCQUMvVCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxPQUFPLEVBQUUsa0JBQWtCO2FBQzNCO1lBQ0QsS0FBSyxFQUFFO2dCQUNOLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxREFBcUQsRUFBRSxvREFBb0QsQ0FBQztnQkFDbEksSUFBSSxFQUFFLFFBQVE7YUFDZDtZQUNELElBQUksRUFBRTtnQkFDTCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0RBQW9ELEVBQUUsbU5BQW1OLENBQUM7Z0JBQ2hTLElBQUksRUFBRSxRQUFRO2FBQ2Q7U0FDRDtRQUNELFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDO0tBQ2pDLENBQUM7SUFFVyxRQUFBLDJCQUEyQixHQUFnQjtRQUN2RCxXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsOENBQThDLEVBQUUsNENBQTRDLENBQUM7UUFDbkgsSUFBSSxFQUFFLFFBQVE7UUFDZCxVQUFVLEVBQUU7WUFDWCxhQUFhLEVBQUU7Z0JBQ2QsV0FBVyxFQUFFLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLDZDQUE2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