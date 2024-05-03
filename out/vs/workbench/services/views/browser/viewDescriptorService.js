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
define(["require", "exports", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/base/common/uuid", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/views/common/viewContainerModel", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/log/common/log"], function (require, exports, views_1, contextkey_1, storage_1, extensions_1, platform_1, lifecycle_1, viewPaneContainer_1, descriptors_1, extensions_2, event_1, telemetry_1, uuid_1, instantiation_1, viewContainerModel_1, actions_1, nls_1, log_1) {
    "use strict";
    var ViewDescriptorService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewDescriptorService = void 0;
    function getViewContainerStorageId(viewContainerId) { return `${viewContainerId}.state`; }
    let ViewDescriptorService = class ViewDescriptorService extends lifecycle_1.Disposable {
        static { ViewDescriptorService_1 = this; }
        static { this.VIEWS_CUSTOMIZATIONS = 'views.customizations'; }
        static { this.COMMON_CONTAINER_ID_PREFIX = 'workbench.views.service'; }
        get viewContainers() { return this.viewContainersRegistry.all; }
        constructor(instantiationService, contextKeyService, storageService, extensionService, telemetryService, loggerService) {
            super();
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this._onDidChangeContainer = this._register(new event_1.Emitter());
            this.onDidChangeContainer = this._onDidChangeContainer.event;
            this._onDidChangeLocation = this._register(new event_1.Emitter());
            this.onDidChangeLocation = this._onDidChangeLocation.event;
            this._onDidChangeContainerLocation = this._register(new event_1.Emitter());
            this.onDidChangeContainerLocation = this._onDidChangeContainerLocation.event;
            this.viewContainerModels = this._register(new lifecycle_1.DisposableMap());
            this.viewsVisibilityActionDisposables = this._register(new lifecycle_1.DisposableMap());
            this.canRegisterViewsVisibilityActions = false;
            this._onDidChangeViewContainers = this._register(new event_1.Emitter());
            this.onDidChangeViewContainers = this._onDidChangeViewContainers.event;
            this.logger = loggerService.createLogger(views_1.VIEWS_LOG_ID, { name: views_1.VIEWS_LOG_NAME, hidden: true });
            this.activeViewContextKeys = new Map();
            this.movableViewContextKeys = new Map();
            this.defaultViewLocationContextKeys = new Map();
            this.defaultViewContainerLocationContextKeys = new Map();
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.migrateToViewsCustomizationsStorage();
            this.viewContainersCustomLocations = new Map(Object.entries(this.viewCustomizations.viewContainerLocations));
            this.viewDescriptorsCustomLocations = new Map(Object.entries(this.viewCustomizations.viewLocations));
            this.viewContainerBadgeEnablementStates = new Map(Object.entries(this.viewCustomizations.viewContainerBadgeEnablementStates));
            // Register all containers that were registered before this ctor
            this.viewContainers.forEach(viewContainer => this.onDidRegisterViewContainer(viewContainer));
            this._register(this.viewsRegistry.onViewsRegistered(views => this.onDidRegisterViews(views)));
            this._register(this.viewsRegistry.onViewsDeregistered(({ views, viewContainer }) => this.onDidDeregisterViews(views, viewContainer)));
            this._register(this.viewsRegistry.onDidChangeContainer(({ views, from, to }) => this.onDidChangeDefaultContainer(views, from, to)));
            this._register(this.viewContainersRegistry.onDidRegister(({ viewContainer }) => {
                this.onDidRegisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ added: [{ container: viewContainer, location: this.getViewContainerLocation(viewContainer) }], removed: [] });
            }));
            this._register(this.viewContainersRegistry.onDidDeregister(({ viewContainer, viewContainerLocation }) => {
                this.onDidDeregisterViewContainer(viewContainer);
                this._onDidChangeViewContainers.fire({ removed: [{ container: viewContainer, location: viewContainerLocation }], added: [] });
            }));
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, this._register(new lifecycle_1.DisposableStore()))(() => this.onDidStorageChange()));
            this.extensionService.whenInstalledExtensionsRegistered().then(() => this.whenExtensionsRegistered());
        }
        migrateToViewsCustomizationsStorage() {
            if (this.storageService.get(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, 0 /* StorageScope.PROFILE */)) {
                return;
            }
            const viewContainerLocationsValue = this.storageService.get('views.cachedViewContainerLocations', 0 /* StorageScope.PROFILE */);
            const viewDescriptorLocationsValue = this.storageService.get('views.cachedViewPositions', 0 /* StorageScope.PROFILE */);
            if (!viewContainerLocationsValue && !viewDescriptorLocationsValue) {
                return;
            }
            const viewContainerLocations = viewContainerLocationsValue ? JSON.parse(viewContainerLocationsValue) : [];
            const viewDescriptorLocations = viewDescriptorLocationsValue ? JSON.parse(viewDescriptorLocationsValue) : [];
            const viewsCustomizations = {
                viewContainerLocations: viewContainerLocations.reduce((result, [id, location]) => { result[id] = location; return result; }, {}),
                viewLocations: viewDescriptorLocations.reduce((result, [id, { containerId }]) => { result[id] = containerId; return result; }, {}),
                viewContainerBadgeEnablementStates: {}
            };
            this.storageService.store(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, JSON.stringify(viewsCustomizations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
            this.storageService.remove('views.cachedViewContainerLocations', 0 /* StorageScope.PROFILE */);
            this.storageService.remove('views.cachedViewPositions', 0 /* StorageScope.PROFILE */);
        }
        registerGroupedViews(groupedViews) {
            for (const [containerId, views] of groupedViews.entries()) {
                const viewContainer = this.viewContainersRegistry.get(containerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    // Register if the container is a genarated container
                    if (this.isGeneratedContainerId(containerId)) {
                        const viewContainerLocation = this.viewContainersCustomLocations.get(containerId);
                        if (viewContainerLocation !== undefined) {
                            this.registerGeneratedViewContainer(viewContainerLocation, containerId);
                        }
                    }
                    // Registration of the container handles registration of its views
                    continue;
                }
                // Filter out views that have already been added to the view container model
                // This is needed when statically-registered views are moved to
                // other statically registered containers as they will both try to add on startup
                const viewsToAdd = views.filter(view => this.getViewContainerModel(viewContainer).allViewDescriptors.filter(vd => vd.id === view.id).length === 0);
                this.addViews(viewContainer, viewsToAdd);
            }
        }
        deregisterGroupedViews(groupedViews) {
            for (const [viewContainerId, views] of groupedViews.entries()) {
                const viewContainer = this.viewContainersRegistry.get(viewContainerId);
                // The container has not been registered yet
                if (!viewContainer || !this.viewContainerModels.has(viewContainer)) {
                    continue;
                }
                this.removeViews(viewContainer, views);
            }
        }
        moveOrphanViewsToDefaultLocation() {
            for (const [viewId, containerId] of this.viewDescriptorsCustomLocations.entries()) {
                // check if the view container exists
                if (this.viewContainersRegistry.get(containerId)) {
                    continue;
                }
                // check if view has been registered to default location
                const viewContainer = this.viewsRegistry.getViewContainer(viewId);
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewContainer && viewDescriptor) {
                    this.addViews(viewContainer, [viewDescriptor]);
                }
            }
        }
        whenExtensionsRegistered() {
            // Handle those views whose custom parent view container does not exist anymore
            // May be the extension contributing this view container is no longer installed
            // Or the parent view container is generated and no longer available.
            this.moveOrphanViewsToDefaultLocation();
            // Clean up empty generated view containers
            for (const viewContainerId of [...this.viewContainersCustomLocations.keys()]) {
                this.cleanUpGeneratedViewContainer(viewContainerId);
            }
            // Save updated view customizations after cleanup
            this.saveViewCustomizations();
            // Register visibility actions for all views
            for (const [key, value] of this.viewContainerModels) {
                this.registerViewsVisibilityActions(key, value);
            }
            this.canRegisterViewsVisibilityActions = true;
        }
        onDidRegisterViews(views) {
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(({ views, viewContainer }) => {
                    // When views are registered, we need to regroup them based on the customizations
                    const regroupedViews = this.regroupViews(viewContainer.id, views);
                    // Once they are grouped, try registering them which occurs
                    // if the container has already been registered within this service
                    // or we can generate the container from the source view id
                    this.registerGroupedViews(regroupedViews);
                    views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
                });
            });
        }
        isGeneratedContainerId(id) {
            return id.startsWith(ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX);
        }
        onDidDeregisterViews(views, viewContainer) {
            // When views are registered, we need to regroup them based on the customizations
            const regroupedViews = this.regroupViews(viewContainer.id, views);
            this.deregisterGroupedViews(regroupedViews);
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(false));
            });
        }
        regroupViews(containerId, views) {
            const viewsByContainer = new Map();
            for (const viewDescriptor of views) {
                const correctContainerId = this.viewDescriptorsCustomLocations.get(viewDescriptor.id) ?? containerId;
                let containerViews = viewsByContainer.get(correctContainerId);
                if (!containerViews) {
                    viewsByContainer.set(correctContainerId, containerViews = []);
                }
                containerViews.push(viewDescriptor);
            }
            return viewsByContainer;
        }
        getViewDescriptorById(viewId) {
            return this.viewsRegistry.getView(viewId);
        }
        getViewLocationById(viewId) {
            const container = this.getViewContainerByViewId(viewId);
            if (container === null) {
                return null;
            }
            return this.getViewContainerLocation(container);
        }
        getViewContainerByViewId(viewId) {
            const containerId = this.viewDescriptorsCustomLocations.get(viewId);
            return containerId ?
                this.viewContainersRegistry.get(containerId) ?? null :
                this.getDefaultContainerById(viewId);
        }
        getViewContainerLocation(viewContainer) {
            return this.viewContainersCustomLocations.get(viewContainer.id) ?? this.getDefaultViewContainerLocation(viewContainer);
        }
        getDefaultViewContainerLocation(viewContainer) {
            return this.viewContainersRegistry.getViewContainerLocation(viewContainer);
        }
        getDefaultContainerById(viewId) {
            return this.viewsRegistry.getViewContainer(viewId) ?? null;
        }
        getViewContainerModel(container) {
            return this.getOrRegisterViewContainerModel(container);
        }
        getViewContainerById(id) {
            return this.viewContainersRegistry.get(id) || null;
        }
        getViewContainersByLocation(location) {
            return this.viewContainers.filter(v => this.getViewContainerLocation(v) === location);
        }
        getDefaultViewContainer(location) {
            return this.viewContainersRegistry.getDefaultViewContainer(location);
        }
        moveViewContainerToLocation(viewContainer, location, requestedIndex, reason) {
            this.logger.info(`moveViewContainerToLocation: viewContainer:${viewContainer.id} location:${location} reason:${reason}`);
            this.moveViewContainerToLocationWithoutSaving(viewContainer, location, requestedIndex);
            this.saveViewCustomizations();
        }
        getViewContainerBadgeEnablementState(id) {
            return this.viewContainerBadgeEnablementStates.get(id) ?? true;
        }
        setViewContainerBadgeEnablementState(id, badgesEnabled) {
            this.viewContainerBadgeEnablementStates.set(id, badgesEnabled);
            this.saveViewCustomizations();
        }
        moveViewToLocation(view, location, reason) {
            this.logger.info(`moveViewToLocation: view:${view.id} location:${location} reason:${reason}`);
            const container = this.registerGeneratedViewContainer(location);
            this.moveViewsToContainer([view], container);
        }
        moveViewsToContainer(views, viewContainer, visibilityState, reason) {
            if (!views.length) {
                return;
            }
            this.logger.info(`moveViewsToContainer: views:${views.map(view => view.id).join(',')} viewContainer:${viewContainer.id} reason:${reason}`);
            const from = this.getViewContainerByViewId(views[0].id);
            const to = viewContainer;
            if (from && to && from !== to) {
                // Move views
                this.moveViewsWithoutSaving(views, from, to, visibilityState);
                this.cleanUpGeneratedViewContainer(from.id);
                // Save new locations
                this.saveViewCustomizations();
                // Log to telemetry
                this.reportMovedViews(views, from, to);
            }
        }
        reset() {
            for (const viewContainer of this.viewContainers) {
                const viewContainerModel = this.getViewContainerModel(viewContainer);
                for (const viewDescriptor of viewContainerModel.allViewDescriptors) {
                    const defaultContainer = this.getDefaultContainerById(viewDescriptor.id);
                    const currentContainer = this.getViewContainerByViewId(viewDescriptor.id);
                    if (currentContainer && defaultContainer && currentContainer !== defaultContainer) {
                        this.moveViewsWithoutSaving([viewDescriptor], currentContainer, defaultContainer);
                    }
                }
                const defaultContainerLocation = this.getDefaultViewContainerLocation(viewContainer);
                const currentContainerLocation = this.getViewContainerLocation(viewContainer);
                if (defaultContainerLocation !== null && currentContainerLocation !== defaultContainerLocation) {
                    this.moveViewContainerToLocationWithoutSaving(viewContainer, defaultContainerLocation);
                }
                this.cleanUpGeneratedViewContainer(viewContainer.id);
            }
            this.viewContainersCustomLocations.clear();
            this.viewDescriptorsCustomLocations.clear();
            this.saveViewCustomizations();
        }
        isViewContainerRemovedPermanently(viewContainerId) {
            return this.isGeneratedContainerId(viewContainerId) && !this.viewContainersCustomLocations.has(viewContainerId);
        }
        onDidChangeDefaultContainer(views, from, to) {
            const viewsToMove = views.filter(view => !this.viewDescriptorsCustomLocations.has(view.id) // Move views which are not already moved
                || (!this.viewContainers.includes(from) && this.viewDescriptorsCustomLocations.get(view.id) === from.id) // Move views which are moved from a removed container
            );
            if (viewsToMove.length) {
                this.moveViewsWithoutSaving(viewsToMove, from, to);
            }
        }
        reportMovedViews(views, from, to) {
            const containerToString = (container) => {
                if (container.id.startsWith(ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX)) {
                    return 'custom';
                }
                if (!container.extensionId) {
                    return container.id;
                }
                return 'extension';
            };
            const oldLocation = this.getViewContainerLocation(from);
            const newLocation = this.getViewContainerLocation(to);
            const viewCount = views.length;
            const fromContainer = containerToString(from);
            const toContainer = containerToString(to);
            const fromLocation = oldLocation === 1 /* ViewContainerLocation.Panel */ ? 'panel' : 'sidebar';
            const toLocation = newLocation === 1 /* ViewContainerLocation.Panel */ ? 'panel' : 'sidebar';
            this.telemetryService.publicLog2('viewDescriptorService.moveViews', { viewCount, fromContainer, toContainer, fromLocation, toLocation });
        }
        moveViewsWithoutSaving(views, from, to, visibilityState = views_1.ViewVisibilityState.Expand) {
            this.removeViews(from, views);
            this.addViews(to, views, visibilityState);
            const oldLocation = this.getViewContainerLocation(from);
            const newLocation = this.getViewContainerLocation(to);
            if (oldLocation !== newLocation) {
                this._onDidChangeLocation.fire({ views, from: oldLocation, to: newLocation });
            }
            this._onDidChangeContainer.fire({ views, from, to });
        }
        moveViewContainerToLocationWithoutSaving(viewContainer, location, requestedIndex) {
            const from = this.getViewContainerLocation(viewContainer);
            const to = location;
            if (from !== to) {
                const isGeneratedViewContainer = this.isGeneratedContainerId(viewContainer.id);
                const isDefaultViewContainerLocation = to === this.getDefaultViewContainerLocation(viewContainer);
                if (isGeneratedViewContainer || !isDefaultViewContainerLocation) {
                    this.viewContainersCustomLocations.set(viewContainer.id, to);
                }
                else {
                    this.viewContainersCustomLocations.delete(viewContainer.id);
                }
                this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(isGeneratedViewContainer || isDefaultViewContainerLocation);
                viewContainer.requestedIndex = requestedIndex;
                this._onDidChangeContainerLocation.fire({ viewContainer, from, to });
                const views = this.getViewsByContainer(viewContainer);
                this._onDidChangeLocation.fire({ views, from, to });
            }
        }
        cleanUpGeneratedViewContainer(viewContainerId) {
            // Skip if container is not generated
            if (!this.isGeneratedContainerId(viewContainerId)) {
                return;
            }
            // Skip if container has views registered
            const viewContainer = this.getViewContainerById(viewContainerId);
            if (viewContainer && this.getViewContainerModel(viewContainer)?.allViewDescriptors.length) {
                return;
            }
            // Skip if container has moved views
            if ([...this.viewDescriptorsCustomLocations.values()].includes(viewContainerId)) {
                return;
            }
            // Deregister the container
            if (viewContainer) {
                this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            }
            this.viewContainersCustomLocations.delete(viewContainerId);
            this.viewContainerBadgeEnablementStates.delete(viewContainerId);
            // Clean up caches of container
            this.storageService.remove((0, viewContainerModel_1.getViewsStateStorageId)(viewContainer?.storageId || getViewContainerStorageId(viewContainerId)), 0 /* StorageScope.PROFILE */);
        }
        registerGeneratedViewContainer(location, existingId) {
            const id = existingId || this.generateContainerId(location);
            const container = this.viewContainersRegistry.registerViewContainer({
                id,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [id, { mergeViewWithContainerWhenSingleView: true }]),
                title: { value: id, original: id }, // we don't want to see this so using id
                icon: location === 0 /* ViewContainerLocation.Sidebar */ ? views_1.defaultViewIcon : undefined,
                storageId: getViewContainerStorageId(id),
                hideIfEmpty: true
            }, location, { doNotRegisterOpenCommand: true });
            if (this.viewContainersCustomLocations.get(container.id) !== location) {
                this.viewContainersCustomLocations.set(container.id, location);
            }
            this.getOrCreateDefaultViewContainerLocationContextKey(container).set(true);
            return container;
        }
        onDidStorageChange() {
            if (JSON.stringify(this.viewCustomizations) !== this.getStoredViewCustomizationsValue() /* This checks if current window changed the value or not */) {
                this.onDidViewCustomizationsStorageChange();
            }
        }
        onDidViewCustomizationsStorageChange() {
            this._viewCustomizations = undefined;
            const newViewContainerCustomizations = new Map(Object.entries(this.viewCustomizations.viewContainerLocations));
            const newViewDescriptorCustomizations = new Map(Object.entries(this.viewCustomizations.viewLocations));
            const viewContainersToMove = [];
            const viewsToMove = [];
            for (const [containerId, location] of newViewContainerCustomizations.entries()) {
                const container = this.getViewContainerById(containerId);
                if (container) {
                    if (location !== this.getViewContainerLocation(container)) {
                        viewContainersToMove.push([container, location]);
                    }
                }
                // If the container is generated and not registered, we register it now
                else if (this.isGeneratedContainerId(containerId)) {
                    this.registerGeneratedViewContainer(location, containerId);
                }
            }
            for (const viewContainer of this.viewContainers) {
                if (!newViewContainerCustomizations.has(viewContainer.id)) {
                    const currentLocation = this.getViewContainerLocation(viewContainer);
                    const defaultLocation = this.getDefaultViewContainerLocation(viewContainer);
                    if (currentLocation !== defaultLocation) {
                        viewContainersToMove.push([viewContainer, defaultLocation]);
                    }
                }
            }
            for (const [viewId, viewContainerId] of newViewDescriptorCustomizations.entries()) {
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewDescriptor) {
                    const prevViewContainer = this.getViewContainerByViewId(viewId);
                    const newViewContainer = this.viewContainersRegistry.get(viewContainerId);
                    if (prevViewContainer && newViewContainer && newViewContainer !== prevViewContainer) {
                        viewsToMove.push({ views: [viewDescriptor], from: prevViewContainer, to: newViewContainer });
                    }
                }
            }
            // If a value is not present in the cache, it must be reset to default
            for (const viewContainer of this.viewContainers) {
                const viewContainerModel = this.getViewContainerModel(viewContainer);
                for (const viewDescriptor of viewContainerModel.allViewDescriptors) {
                    if (!newViewDescriptorCustomizations.has(viewDescriptor.id)) {
                        const currentContainer = this.getViewContainerByViewId(viewDescriptor.id);
                        const defaultContainer = this.getDefaultContainerById(viewDescriptor.id);
                        if (currentContainer && defaultContainer && currentContainer !== defaultContainer) {
                            viewsToMove.push({ views: [viewDescriptor], from: currentContainer, to: defaultContainer });
                        }
                    }
                }
            }
            // Execute View Container Movements
            for (const [container, location] of viewContainersToMove) {
                this.moveViewContainerToLocationWithoutSaving(container, location);
            }
            // Execute View Movements
            for (const { views, from, to } of viewsToMove) {
                this.moveViewsWithoutSaving(views, from, to, views_1.ViewVisibilityState.Default);
            }
            this.viewContainersCustomLocations = newViewContainerCustomizations;
            this.viewDescriptorsCustomLocations = newViewDescriptorCustomizations;
        }
        // Generated Container Id Format
        // {Common Prefix}.{Location}.{Uniqueness Id}
        // Old Format (deprecated)
        // {Common Prefix}.{Uniqueness Id}.{Source View Id}
        generateContainerId(location) {
            return `${ViewDescriptorService_1.COMMON_CONTAINER_ID_PREFIX}.${(0, views_1.ViewContainerLocationToString)(location)}.${(0, uuid_1.generateUuid)()}`;
        }
        saveViewCustomizations() {
            const viewCustomizations = { viewContainerLocations: {}, viewLocations: {}, viewContainerBadgeEnablementStates: {} };
            for (const [containerId, location] of this.viewContainersCustomLocations) {
                const container = this.getViewContainerById(containerId);
                // Skip if the view container is not a generated container and in default location
                if (container && !this.isGeneratedContainerId(containerId) && location === this.getDefaultViewContainerLocation(container)) {
                    continue;
                }
                viewCustomizations.viewContainerLocations[containerId] = location;
            }
            for (const [viewId, viewContainerId] of this.viewDescriptorsCustomLocations) {
                const viewContainer = this.getViewContainerById(viewContainerId);
                if (viewContainer) {
                    const defaultContainer = this.getDefaultContainerById(viewId);
                    // Skip if the view is at default location
                    // https://github.com/microsoft/vscode/issues/90414
                    if (defaultContainer?.id === viewContainer.id) {
                        continue;
                    }
                }
                viewCustomizations.viewLocations[viewId] = viewContainerId;
            }
            // Loop through viewContainerBadgeEnablementStates and save only the ones that are disabled
            for (const [viewContainerId, badgeEnablementState] of this.viewContainerBadgeEnablementStates) {
                if (badgeEnablementState === false) {
                    viewCustomizations.viewContainerBadgeEnablementStates[viewContainerId] = badgeEnablementState;
                }
            }
            this.viewCustomizations = viewCustomizations;
        }
        get viewCustomizations() {
            if (!this._viewCustomizations) {
                this._viewCustomizations = JSON.parse(this.getStoredViewCustomizationsValue());
                this._viewCustomizations.viewContainerLocations = this._viewCustomizations.viewContainerLocations ?? {};
                this._viewCustomizations.viewLocations = this._viewCustomizations.viewLocations ?? {};
                this._viewCustomizations.viewContainerBadgeEnablementStates = this._viewCustomizations.viewContainerBadgeEnablementStates ?? {};
            }
            return this._viewCustomizations;
        }
        set viewCustomizations(viewCustomizations) {
            const value = JSON.stringify(viewCustomizations);
            if (JSON.stringify(this.viewCustomizations) !== value) {
                this._viewCustomizations = viewCustomizations;
                this.setStoredViewCustomizationsValue(value);
            }
        }
        getStoredViewCustomizationsValue() {
            return this.storageService.get(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, 0 /* StorageScope.PROFILE */, '{}');
        }
        setStoredViewCustomizationsValue(value) {
            this.storageService.store(ViewDescriptorService_1.VIEWS_CUSTOMIZATIONS, value, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        getViewsByContainer(viewContainer) {
            const result = this.viewsRegistry.getViews(viewContainer).filter(viewDescriptor => {
                const viewDescriptorViewContainerId = this.viewDescriptorsCustomLocations.get(viewDescriptor.id) ?? viewContainer.id;
                return viewDescriptorViewContainerId === viewContainer.id;
            });
            for (const [viewId, viewContainerId] of this.viewDescriptorsCustomLocations.entries()) {
                if (viewContainerId !== viewContainer.id) {
                    continue;
                }
                if (this.viewsRegistry.getViewContainer(viewId) === viewContainer) {
                    continue;
                }
                const viewDescriptor = this.getViewDescriptorById(viewId);
                if (viewDescriptor) {
                    result.push(viewDescriptor);
                }
            }
            return result;
        }
        onDidRegisterViewContainer(viewContainer) {
            const defaultLocation = this.isGeneratedContainerId(viewContainer.id) ? true : this.getViewContainerLocation(viewContainer) === this.getDefaultViewContainerLocation(viewContainer);
            this.getOrCreateDefaultViewContainerLocationContextKey(viewContainer).set(defaultLocation);
            this.getOrRegisterViewContainerModel(viewContainer);
        }
        getOrRegisterViewContainerModel(viewContainer) {
            let viewContainerModel = this.viewContainerModels.get(viewContainer)?.viewContainerModel;
            if (!viewContainerModel) {
                const disposables = new lifecycle_1.DisposableStore();
                viewContainerModel = disposables.add(this.instantiationService.createInstance(viewContainerModel_1.ViewContainerModel, viewContainer));
                this.onDidChangeActiveViews({ added: viewContainerModel.activeViewDescriptors, removed: [] });
                viewContainerModel.onDidChangeActiveViewDescriptors(changed => this.onDidChangeActiveViews(changed), this, disposables);
                this.onDidChangeVisibleViews({ added: [...viewContainerModel.visibleViewDescriptors], removed: [] });
                viewContainerModel.onDidAddVisibleViewDescriptors(added => this.onDidChangeVisibleViews({ added: added.map(({ viewDescriptor }) => viewDescriptor), removed: [] }), this, disposables);
                viewContainerModel.onDidRemoveVisibleViewDescriptors(removed => this.onDidChangeVisibleViews({ added: [], removed: removed.map(({ viewDescriptor }) => viewDescriptor) }), this, disposables);
                disposables.add((0, lifecycle_1.toDisposable)(() => this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer)));
                disposables.add(this.registerResetViewContainerAction(viewContainer));
                const value = { viewContainerModel: viewContainerModel, disposables, dispose: () => disposables.dispose() };
                this.viewContainerModels.set(viewContainer, value);
                // Register all views that were statically registered to this container
                // Potentially, this is registering something that was handled by another container
                // addViews() handles this by filtering views that are already registered
                this.onDidRegisterViews([{ views: this.viewsRegistry.getViews(viewContainer), viewContainer }]);
                // Add views that were registered prior to this view container
                const viewsToRegister = this.getViewsByContainer(viewContainer).filter(view => this.getDefaultContainerById(view.id) !== viewContainer);
                if (viewsToRegister.length) {
                    this.addViews(viewContainer, viewsToRegister);
                    this.contextKeyService.bufferChangeEvents(() => {
                        viewsToRegister.forEach(viewDescriptor => this.getOrCreateMovableViewContextKey(viewDescriptor).set(!!viewDescriptor.canMoveView));
                    });
                }
                if (this.canRegisterViewsVisibilityActions) {
                    this.registerViewsVisibilityActions(viewContainer, value);
                }
            }
            return viewContainerModel;
        }
        onDidDeregisterViewContainer(viewContainer) {
            this.viewContainerModels.deleteAndDispose(viewContainer);
            this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
        }
        onDidChangeActiveViews({ added, removed }) {
            this.contextKeyService.bufferChangeEvents(() => {
                added.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(true));
                removed.forEach(viewDescriptor => this.getOrCreateActiveViewContextKey(viewDescriptor).set(false));
            });
        }
        onDidChangeVisibleViews({ added, removed }) {
            this.contextKeyService.bufferChangeEvents(() => {
                added.forEach(viewDescriptor => this.getOrCreateVisibleViewContextKey(viewDescriptor).set(true));
                removed.forEach(viewDescriptor => this.getOrCreateVisibleViewContextKey(viewDescriptor).set(false));
            });
        }
        registerViewsVisibilityActions(viewContainer, { viewContainerModel, disposables }) {
            this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
            this.viewsVisibilityActionDisposables.set(viewContainer, this.registerViewsVisibilityActionsForContainer(viewContainerModel));
            disposables.add(event_1.Event.any(viewContainerModel.onDidChangeActiveViewDescriptors, viewContainerModel.onDidAddVisibleViewDescriptors, viewContainerModel.onDidRemoveVisibleViewDescriptors, viewContainerModel.onDidMoveVisibleViewDescriptors)(e => {
                this.viewsVisibilityActionDisposables.deleteAndDispose(viewContainer);
                this.viewsVisibilityActionDisposables.set(viewContainer, this.registerViewsVisibilityActionsForContainer(viewContainerModel));
            }));
        }
        registerViewsVisibilityActionsForContainer(viewContainerModel) {
            const disposables = new lifecycle_1.DisposableStore();
            viewContainerModel.activeViewDescriptors.forEach((viewDescriptor, index) => {
                if (!viewDescriptor.remoteAuthority) {
                    disposables.add((0, actions_1.registerAction2)(class extends viewPaneContainer_1.ViewPaneContainerAction {
                        constructor() {
                            super({
                                id: `${viewDescriptor.id}.toggleVisibility`,
                                viewPaneContainerId: viewContainerModel.viewContainer.id,
                                precondition: viewDescriptor.canToggleVisibility && (!viewContainerModel.isVisible(viewDescriptor.id) || viewContainerModel.visibleViewDescriptors.length > 1) ? contextkey_1.ContextKeyExpr.true() : contextkey_1.ContextKeyExpr.false(),
                                toggled: contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.visible`),
                                title: viewDescriptor.name,
                                menu: [{
                                        id: viewPaneContainer_1.ViewsSubMenu,
                                        when: contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainerModel.viewContainer.id),
                                        order: index,
                                    }, {
                                        id: actions_1.MenuId.ViewContainerTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainerModel.viewContainer.id)),
                                        order: index,
                                        group: '1_toggleVisibility'
                                    }, {
                                        id: actions_1.MenuId.ViewTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(...viewContainerModel.visibleViewDescriptors.map(v => contextkey_1.ContextKeyExpr.equals('view', v.id)))),
                                        order: index,
                                        group: '2_toggleVisibility'
                                    }]
                            });
                        }
                        async runInViewPaneContainer(serviceAccessor, viewPaneContainer) {
                            viewPaneContainer.toggleViewVisibility(viewDescriptor.id);
                        }
                    }));
                    disposables.add((0, actions_1.registerAction2)(class extends viewPaneContainer_1.ViewPaneContainerAction {
                        constructor() {
                            super({
                                id: `${viewDescriptor.id}.removeView`,
                                viewPaneContainerId: viewContainerModel.viewContainer.id,
                                title: (0, nls_1.localize)('hideView', "Hide '{0}'", viewDescriptor.name.value),
                                precondition: viewDescriptor.canToggleVisibility && (!viewContainerModel.isVisible(viewDescriptor.id) || viewContainerModel.visibleViewDescriptors.length > 1) ? contextkey_1.ContextKeyExpr.true() : contextkey_1.ContextKeyExpr.false(),
                                menu: [{
                                        id: actions_1.MenuId.ViewTitleContext,
                                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', viewDescriptor.id), contextkey_1.ContextKeyExpr.has(`${viewDescriptor.id}.visible`)),
                                        group: '1_hide',
                                        order: 1
                                    }]
                            });
                        }
                        async runInViewPaneContainer(serviceAccessor, viewPaneContainer) {
                            viewPaneContainer.toggleViewVisibility(viewDescriptor.id);
                        }
                    }));
                }
            });
            return disposables;
        }
        registerResetViewContainerAction(viewContainer) {
            const that = this;
            return (0, actions_1.registerAction2)(class ResetViewLocationAction extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `${viewContainer.id}.resetViewContainerLocation`,
                        title: (0, nls_1.localize2)('resetViewLocation', "Reset Location"),
                        menu: [{
                                id: actions_1.MenuId.ViewContainerTitleContext,
                                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', viewContainer.id), contextkey_1.ContextKeyExpr.equals(`${viewContainer.id}.defaultViewContainerLocation`, false)))
                            }],
                    });
                }
                run() {
                    that.moveViewContainerToLocation(viewContainer, that.getDefaultViewContainerLocation(viewContainer), undefined, this.desc.id);
                }
            });
        }
        addViews(container, views, visibilityState = views_1.ViewVisibilityState.Default) {
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(view => {
                    const isDefaultContainer = this.getDefaultContainerById(view.id) === container;
                    this.getOrCreateDefaultViewLocationContextKey(view).set(isDefaultContainer);
                    if (isDefaultContainer) {
                        this.viewDescriptorsCustomLocations.delete(view.id);
                    }
                    else {
                        this.viewDescriptorsCustomLocations.set(view.id, container.id);
                    }
                });
            });
            this.getViewContainerModel(container).add(views.map(view => {
                return {
                    viewDescriptor: view,
                    collapsed: visibilityState === views_1.ViewVisibilityState.Default ? undefined : false,
                    visible: visibilityState === views_1.ViewVisibilityState.Default ? undefined : true
                };
            }));
        }
        removeViews(container, views) {
            // Set view default location keys to false
            this.contextKeyService.bufferChangeEvents(() => {
                views.forEach(view => {
                    if (this.viewDescriptorsCustomLocations.get(view.id) === container.id) {
                        this.viewDescriptorsCustomLocations.delete(view.id);
                    }
                    this.getOrCreateDefaultViewLocationContextKey(view).set(false);
                });
            });
            // Remove the views
            this.getViewContainerModel(container).remove(views);
        }
        getOrCreateActiveViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.active`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateVisibleViewContextKey(viewDescriptor) {
            const activeContextKeyId = `${viewDescriptor.id}.visible`;
            let contextKey = this.activeViewContextKeys.get(activeContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(activeContextKeyId, false).bindTo(this.contextKeyService);
                this.activeViewContextKeys.set(activeContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateMovableViewContextKey(viewDescriptor) {
            const movableViewContextKeyId = `${viewDescriptor.id}.canMove`;
            let contextKey = this.movableViewContextKeys.get(movableViewContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(movableViewContextKeyId, false).bindTo(this.contextKeyService);
                this.movableViewContextKeys.set(movableViewContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewLocationContextKey(viewDescriptor) {
            const defaultViewLocationContextKeyId = `${viewDescriptor.id}.defaultViewLocation`;
            let contextKey = this.defaultViewLocationContextKeys.get(defaultViewLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewLocationContextKeys.set(defaultViewLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
        getOrCreateDefaultViewContainerLocationContextKey(viewContainer) {
            const defaultViewContainerLocationContextKeyId = `${viewContainer.id}.defaultViewContainerLocation`;
            let contextKey = this.defaultViewContainerLocationContextKeys.get(defaultViewContainerLocationContextKeyId);
            if (!contextKey) {
                contextKey = new contextkey_1.RawContextKey(defaultViewContainerLocationContextKeyId, false).bindTo(this.contextKeyService);
                this.defaultViewContainerLocationContextKeys.set(defaultViewContainerLocationContextKeyId, contextKey);
            }
            return contextKey;
        }
    };
    exports.ViewDescriptorService = ViewDescriptorService;
    exports.ViewDescriptorService = ViewDescriptorService = ViewDescriptorService_1 = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, extensions_1.IExtensionService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, log_1.ILoggerService)
    ], ViewDescriptorService);
    (0, extensions_2.registerSingleton)(views_1.IViewDescriptorService, ViewDescriptorService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0Rlc2NyaXB0b3JTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvdmlld3MvYnJvd3Nlci92aWV3RGVzY3JpcHRvclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJCaEcsU0FBUyx5QkFBeUIsQ0FBQyxlQUF1QixJQUFZLE9BQU8sR0FBRyxlQUFlLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFFbkcsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTs7aUJBSTVCLHlCQUFvQixHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtpQkFDOUMsK0JBQTBCLEdBQUcseUJBQXlCLEFBQTVCLENBQTZCO1FBNEIvRSxJQUFJLGNBQWMsS0FBbUMsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUk5RixZQUN3QixvQkFBNEQsRUFDL0QsaUJBQXNELEVBQ3pELGNBQWdELEVBQzlDLGdCQUFvRCxFQUNwRCxnQkFBb0QsRUFDdkQsYUFBNkI7WUFFN0MsS0FBSyxFQUFFLENBQUM7WUFQZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM5QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3hDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUM3QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ25DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFuQ3ZELDBCQUFxQixHQUFrRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUF3RSxDQUFDLENBQUM7WUFDbk4seUJBQW9CLEdBQWdGLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7WUFFN0gseUJBQW9CLEdB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