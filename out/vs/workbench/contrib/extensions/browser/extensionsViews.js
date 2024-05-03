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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/base/common/paging", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsList", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/services/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/views/viewPane", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/base/browser/ui/aria/aria", "vs/base/common/cancellation", "vs/base/common/actions", "vs/platform/extensions/common/extensions", "vs/base/common/async", "vs/platform/product/common/productService", "vs/platform/severityIcon/browser/severityIcon", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/services/preferences/common/preferences", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/layout/browser/layoutService", "vs/platform/log/common/log", "vs/base/parts/request/common/request", "vs/platform/theme/browser/defaultStyles", "vs/platform/registry/common/platform", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/base/common/types", "vs/platform/uriIdentity/common/uriIdentity"], function (require, exports, nls_1, lifecycle_1, event_1, errors_1, errorMessage_1, paging_1, extensionManagement_1, extensionRecommendations_1, extensionManagementUtil_1, keybinding_1, contextView_1, dom_1, instantiation_1, extensionsList_1, extensions_1, extensionQuery_1, extensions_2, themeService_1, telemetry_1, countBadge_1, extensionsActions_1, listService_1, configuration_1, notification_1, viewPane_1, workspace_1, arrays_1, aria_1, cancellation_1, actions_1, extensions_3, async_1, productService_1, severityIcon_1, contextkey_1, theme_1, views_1, opener_1, preferences_1, storage_1, extensionManifestPropertiesService_1, virtualWorkspace_1, workspaceTrust_1, layoutService_1, log_1, request_1, defaultStyles_1, platform_1, extensionFeatures_1, types_1, uriIdentity_1) {
    "use strict";
    var ExtensionsListView_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendedExtensionsView = exports.RecommendedExtensionsView = exports.DefaultRecommendedExtensionsView = exports.SearchMarketplaceExtensionsView = exports.DeprecatedExtensionsView = exports.VirtualWorkspacePartiallySupportedExtensionsView = exports.VirtualWorkspaceUnsupportedExtensionsView = exports.UntrustedWorkspacePartiallySupportedExtensionsView = exports.UntrustedWorkspaceUnsupportedExtensionsView = exports.StaticQueryExtensionsView = exports.RecentlyUpdatedExtensionsView = exports.OutdatedExtensionsView = exports.DisabledExtensionsView = exports.EnabledExtensionsView = exports.ServerInstalledExtensionsView = exports.DefaultPopularExtensionsView = exports.ExtensionsListView = exports.NONE_CATEGORY = void 0;
    exports.getAriaLabelForExtension = getAriaLabelForExtension;
    exports.NONE_CATEGORY = 'none';
    class ExtensionsViewState extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onFocus = this._register(new event_1.Emitter());
            this.onFocus = this._onFocus.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this.currentlyFocusedItems = [];
        }
        onFocusChange(extensions) {
            this.currentlyFocusedItems.forEach(extension => this._onBlur.fire(extension));
            this.currentlyFocusedItems = extensions;
            this.currentlyFocusedItems.forEach(extension => this._onFocus.fire(extension));
        }
    }
    var LocalSortBy;
    (function (LocalSortBy) {
        LocalSortBy["UpdateDate"] = "UpdateDate";
    })(LocalSortBy || (LocalSortBy = {}));
    function isLocalSortBy(value) {
        switch (value) {
            case "UpdateDate" /* LocalSortBy.UpdateDate */: return true;
        }
    }
    let ExtensionsListView = class ExtensionsListView extends viewPane_1.ViewPane {
        static { ExtensionsListView_1 = this; }
        static { this.RECENT_UPDATE_DURATION = 7 * 24 * 60 * 60 * 1000; } // 7 days
        constructor(options, viewletViewOptions, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, extensionRecommendationsService, telemetryService, configurationService, contextService, extensionManagementServerService, extensionManifestPropertiesService, extensionManagementService, workspaceService, productService, contextKeyService, viewDescriptorService, openerService, preferencesService, storageService, workspaceTrustManagementService, extensionEnablementService, layoutService, extensionFeaturesManagementService, uriIdentityService, logService) {
            super({
                ...viewletViewOptions,
                showActions: viewPane_1.ViewPaneShowActions.Always,
                maximumBodySize: options.flexibleHeight ? (storageService.getNumber(`${viewletViewOptions.id}.size`, 0 /* StorageScope.PROFILE */, 0) ? undefined : 0) : undefined
            }, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.options = options;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.contextService = contextService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this.extensionManagementService = extensionManagementService;
            this.workspaceService = workspaceService;
            this.productService = productService;
            this.preferencesService = preferencesService;
            this.storageService = storageService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.layoutService = layoutService;
            this.extensionFeaturesManagementService = extensionFeaturesManagementService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.list = null;
            this.queryRequest = null;
            this.contextMenuActionRunner = this._register(new actions_1.ActionRunner());
            if (this.options.onDidChangeTitle) {
                this._register(this.options.onDidChangeTitle(title => this.updateTitle(title)));
            }
            this._register(this.contextMenuActionRunner.onDidRun(({ error }) => error && this.notificationService.error(error)));
            this.registerActions();
        }
        registerActions() { }
        renderHeader(container) {
            container.classList.add('extension-view-header');
            super.renderHeader(container);
            if (!this.options.hideBadge) {
                this.badge = new countBadge_1.CountBadge((0, dom_1.append)(container, (0, dom_1.$)('.count-badge-wrapper')), {}, defaultStyles_1.defaultCountBadgeStyles);
            }
        }
        renderBody(container) {
            super.renderBody(container);
            const extensionsList = (0, dom_1.append)(container, (0, dom_1.$)('.extensions-list'));
            const messageContainer = (0, dom_1.append)(container, (0, dom_1.$)('.message-container'));
            const messageSeverityIcon = (0, dom_1.append)(messageContainer, (0, dom_1.$)(''));
            const messageBox = (0, dom_1.append)(messageContainer, (0, dom_1.$)('.message'));
            const delegate = new extensionsList_1.Delegate();
            const extensionsViewState = new ExtensionsViewState();
            const renderer = this.instantiationService.createInstance(extensionsList_1.Renderer, extensionsViewState, {
                hoverOptions: {
                    position: () => {
                        const viewLocation = this.viewDescriptorService.getViewLocationById(this.id);
                        if (viewLocation === 0 /* ViewContainerLocation.Sidebar */) {
                            return this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? 1 /* HoverPosition.RIGHT */ : 0 /* HoverPosition.LEFT */;
                        }
                        if (viewLocation === 2 /* ViewContainerLocation.AuxiliaryBar */) {
                            return this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? 0 /* HoverPosition.LEFT */ : 1 /* HoverPosition.RIGHT */;
                        }
                        return 1 /* HoverPosition.RIGHT */;
                    }
                }
            });
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchPagedList, 'Extensions', extensionsList, delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                accessibilityProvider: {
                    getAriaLabel(extension) {
                        return getAriaLabelForExtension(extension);
                    },
                    getWidgetAriaLabel() {
                        return (0, nls_1.localize)('extensions', "Extensions");
                    }
                },
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                },
                openOnSingleClick: true
            });
            this._register(this.list.onContextMenu(e => this.onContextMenu(e), this));
            this._register(this.list.onDidChangeFocus(e => extensionsViewState.onFocusChange((0, arrays_1.coalesce)(e.elements)), this));
            this._register(this.list);
            this._register(extensionsViewState);
            this._register(event_1.Event.debounce(event_1.Event.filter(this.list.onDidOpen, e => e.element !== null), (_, event) => event, 75, true)(options => {
                this.openExtension(options.element, { sideByside: options.sideBySide, ...options.editorOptions });
            }));
            this.bodyTemplate = {
                extensionsList,
                messageBox,
                messageContainer,
                messageSeverityIcon
            };
            if (this.queryResult) {
                this.setModel(this.queryResult.model);
            }
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            if (this.bodyTemplate) {
                this.bodyTemplate.extensionsList.style.height = height + 'px';
            }
            this.list?.layout(height, width);
        }
        async show(query, refresh) {
            if (this.queryRequest) {
                if (!refresh && this.queryRequest.query === query) {
                    return this.queryRequest.request;
                }
                this.queryRequest.request.cancel();
                this.queryRequest = null;
            }
            if (this.queryResult) {
                this.queryResult.disposables.dispose();
                this.queryResult = undefined;
            }
            const parsedQuery = extensionQuery_1.Query.parse(query);
            const options = {
                sortOrder: 0 /* SortOrder.Default */
            };
            switch (parsedQuery.sortBy) {
                case 'installs':
                    options.sortBy = 4 /* GallerySortBy.InstallCount */;
                    break;
                case 'rating':
                    options.sortBy = 12 /* GallerySortBy.WeightedRating */;
                    break;
                case 'name':
                    options.sortBy = 2 /* GallerySortBy.Title */;
                    break;
                case 'publishedDate':
                    options.sortBy = 10 /* GallerySortBy.PublishedDate */;
                    break;
                case 'updateDate':
                    options.sortBy = "UpdateDate" /* LocalSortBy.UpdateDate */;
                    break;
            }
            const request = (0, async_1.createCancelablePromise)(async (token) => {
                try {
                    this.queryResult = await this.query(parsedQuery, options, token);
                    const model = this.queryResult.model;
                    this.setModel(model);
                    if (this.queryResult.onDidChangeModel) {
                        this.queryResult.disposables.add(this.queryResult.onDidChangeModel(model => {
                            if (this.queryResult) {
                                this.queryResult.model = model;
                                this.updateModel(model);
                            }
                        }));
                    }
                    return model;
                }
                catch (e) {
                    const model = new paging_1.PagedModel([]);
                    if (!(0, errors_1.isCancellationError)(e)) {
                        this.logService.error(e);
                        this.setModel(model, e);
                    }
                    return this.list ? this.list.model : model;
                }
            });
            request.finally(() => this.queryRequest = null);
            this.queryRequest = { query, request };
            return request;
        }
        count() {
            return this.queryResult?.model.length ?? 0;
        }
        showEmptyModel() {
            const emptyModel = new paging_1.PagedModel([]);
            this.setModel(emptyModel);
            return Promise.resolve(emptyModel);
        }
        async onContextMenu(e) {
            if (e.element) {
                const disposables = new lifecycle_1.DisposableStore();
                const manageExtensionAction = disposables.add(this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction));
                const extension = e.element ? this.extensionsWorkbenchService.local.find(local => (0, extensionManagementUtil_1.areSameExtensions)(local.identifier, e.element.identifier) && (!e.element.server || e.element.server === local.server)) || e.element
                    : e.element;
                manageExtensionAction.extension = extension;
                let groups = [];
                if (manageExtensionAction.enabled) {
                    groups = await manageExtensionAction.getActionGroups();
                }
                else if (extension) {
                    groups = await (0, extensionsActions_1.getContextMenuActions)(extension, this.contextKeyService, this.instantiationService);
                    groups.forEach(group => group.forEach(extensionAction => {
                        if (extensionAction instanceof extensionsActions_1.ExtensionAction) {
                            extensionAction.extension = extension;
                        }
                    }));
                }
                let actions = [];
                for (const menuActions of groups) {
                    actions = [...actions, ...menuActions, new actions_1.Separator()];
                }
                actions.pop();
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions,
                    actionRunner: this.contextMenuActionRunner,
                    onHide: () => disposables.dispose()
                });
            }
        }
        async query(query, options, token) {
            const idRegex = /@id:(([a-z0-9A-Z][a-z0-9\-A-Z]*)\.([a-z0-9A-Z][a-z0-9\-A-Z]*))/g;
            const ids = [];
            let idMatch;
            while ((idMatch = idRegex.exec(query.value)) !== null) {
                const name = idMatch[1];
                ids.push(name);
            }
            if (ids.length) {
                const model = await this.queryByIds(ids, options, token);
                return { model, disposables: new lifecycle_1.DisposableStore() };
            }
            if (ExtensionsListView_1.isLocalExtensionsQuery(query.value, query.sortBy)) {
                return this.queryLocal(query, options);
            }
            if (ExtensionsListView_1.isSearchPopularQuery(query.value)) {
                query.value = query.value.replace('@popular', '');
                options.sortBy = !options.sortBy ? 4 /* GallerySortBy.InstallCount */ : options.sortBy;
            }
            else if (ExtensionsListView_1.isSearchRecentlyPublishedQuery(query.value)) {
                query.value = query.value.replace('@recentlyPublished', '');
                options.sortBy = !options.sortBy ? 10 /* GallerySortBy.PublishedDate */ : options.sortBy;
            }
            const galleryQueryOptions = { ...options, sortBy: isLocalSortBy(options.sortBy) ? undefined : options.sortBy };
            const model = await this.queryGallery(query, galleryQueryOptions, token);
            return { model, disposables: new lifecycle_1.DisposableStore() };
        }
        async queryByIds(ids, options, token) {
            const idsSet = ids.reduce((result, id) => { result.add(id.toLowerCase()); return result; }, new Set());
            const result = (await this.extensionsWorkbenchService.queryLocal(this.options.server))
                .filter(e => idsSet.has(e.identifier.id.toLowerCase()));
            const galleryIds = result.length ? ids.filter(id => result.every(r => !(0, extensionManagementUtil_1.areSameExtensions)(r.identifier, { id }))) : ids;
            if (galleryIds.length) {
                const galleryResult = await this.extensionsWorkbenchService.getExtensions(galleryIds.map(id => ({ id })), { source: 'queryById' }, token);
                result.push(...galleryResult);
            }
            return this.getPagedModel(result);
        }
        async queryLocal(query, options) {
            const local = await this.extensionsWorkbenchService.queryLocal(this.options.server);
            let { extensions, canIncludeInstalledExtensions } = await this.filterLocal(local, this.extensionService.extensions, query, options);
            const disposables = new lifecycle_1.DisposableStore();
            const onDidChangeModel = disposables.add(new event_1.Emitter());
            if (canIncludeInstalledExtensions) {
                let isDisposed = false;
                disposables.add((0, lifecycle_1.toDisposable)(() => isDisposed = true));
                disposables.add(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.extensionsWorkbenchService.onChange, e => e?.state === 1 /* ExtensionState.Installed */), this.extensionService.onDidChangeExtensions), () => undefined)(async () => {
                    const local = this.options.server ? this.extensionsWorkbenchService.installed.filter(e => e.server === this.options.server) : this.extensionsWorkbenchService.local;
                    const { extensions: newExtensions } = await this.filterLocal(local, this.extensionService.extensions, query, options);
                    if (!isDisposed) {
                        const mergedExtensions = this.mergeAddedExtensions(extensions, newExtensions);
                        if (mergedExtensions) {
                            extensions = mergedExtensions;
                            onDidChangeModel.fire(new paging_1.PagedModel(extensions));
                        }
                    }
                }));
            }
            return {
                model: new paging_1.PagedModel(extensions),
                onDidChangeModel: onDidChangeModel.event,
                disposables
            };
        }
        async filterLocal(local, runningExtensions, query, options) {
            const value = query.value;
            let extensions = [];
            let canIncludeInstalledExtensions = true;
            if (/@builtin/i.test(value)) {
                extensions = this.filterBuiltinExtensions(local, query, options);
                canIncludeInstalledExtensions = false;
            }
            else if (/@installed/i.test(value)) {
                extensions = this.filterInstalledExtensions(local, runningExtensions, query, options);
            }
            else if (/@outdated/i.test(value)) {
                extensions = this.filterOutdatedExtensions(local, query, options);
            }
            else if (/@disabled/i.test(value)) {
                extensions = this.filterDisabledExtensions(local, runningExtensions, query, options);
            }
            else if (/@enabled/i.test(value)) {
                extensions = this.filterEnabledExtensions(local, runningExtensions, query, options);
            }
            else if (/@workspaceUnsupported/i.test(value)) {
                extensions = this.filterWorkspaceUnsupportedExtensions(local, query, options);
            }
            else if (/@deprecated/i.test(query.value)) {
                extensions = await this.filterDeprecatedExtensions(local, query, options);
            }
            else if (/@recentlyUpdated/i.test(query.value)) {
                extensions = this.filterRecentlyUpdatedExtensions(local, query, options);
            }
            else if (/@feature:/i.test(query.value)) {
                extensions = this.filterExtensionsByFeature(local, query, options);
            }
            return { extensions, canIncludeInstalledExtensions };
        }
        filterBuiltinExtensions(local, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            value = value.replace(/@builtin/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const result = local
                .filter(e => e.isBuiltin && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(e, includedCategories, excludedCategories));
            return this.sortExtensions(result, options);
        }
        filterExtensionByCategory(e, includedCategories, excludedCategories) {
            if (!includedCategories.length && !excludedCategories.length) {
                return true;
            }
            if (e.categories.length) {
                if (excludedCategories.length && e.categories.some(category => excludedCategories.includes(category.toLowerCase()))) {
                    return false;
                }
                return e.categories.some(category => includedCategories.includes(category.toLowerCase()));
            }
            else {
                return includedCategories.includes(exports.NONE_CATEGORY);
            }
        }
        parseCategories(value) {
            const includedCategories = [];
            const excludedCategories = [];
            value = value.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                const entry = (category || quotedCategory || '').toLowerCase();
                if (entry.startsWith('-')) {
                    if (excludedCategories.indexOf(entry) === -1) {
                        excludedCategories.push(entry);
                    }
                }
                else {
                    if (includedCategories.indexOf(entry) === -1) {
                        includedCategories.push(entry);
                    }
                }
                return '';
            });
            return { value, includedCategories, excludedCategories };
        }
        filterInstalledExtensions(local, runningExtensions, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            value = value.replace(/@installed/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const matchingText = (e) => (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1 || e.description.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(e, includedCategories, excludedCategories);
            let result;
            if (options.sortBy !== undefined) {
                result = local.filter(e => !e.isBuiltin && matchingText(e));
                result = this.sortExtensions(result, options);
            }
            else {
                result = local.filter(e => (!e.isBuiltin || e.outdated || e.runtimeState !== undefined) && matchingText(e));
                const runningExtensionsById = runningExtensions.reduce((result, e) => { result.set(e.identifier.value, e); return result; }, new extensions_3.ExtensionIdentifierMap());
                const defaultSort = (e1, e2) => {
                    const running1 = runningExtensionsById.get(e1.identifier.id);
                    const isE1Running = !!running1 && this.extensionManagementServerService.getExtensionManagementServer((0, extensions_2.toExtension)(running1)) === e1.server;
                    const running2 = runningExtensionsById.get(e2.identifier.id);
                    const isE2Running = running2 && this.extensionManagementServerService.getExtensionManagementServer((0, extensions_2.toExtension)(running2)) === e2.server;
                    if ((isE1Running && isE2Running)) {
                        return e1.displayName.localeCompare(e2.displayName);
                    }
                    const isE1LanguagePackExtension = e1.local && (0, extensions_3.isLanguagePackExtension)(e1.local.manifest);
                    const isE2LanguagePackExtension = e2.local && (0, extensions_3.isLanguagePackExtension)(e2.local.manifest);
                    if (!isE1Running && !isE2Running) {
                        if (isE1LanguagePackExtension) {
                            return -1;
                        }
                        if (isE2LanguagePackExtension) {
                            return 1;
                        }
                        return e1.displayName.localeCompare(e2.displayName);
                    }
                    if ((isE1Running && isE2LanguagePackExtension) || (isE2Running && isE1LanguagePackExtension)) {
                        return e1.displayName.localeCompare(e2.displayName);
                    }
                    return isE1Running ? -1 : 1;
                };
                const outdated = [];
                const actionRequired = [];
                const noActionRequired = [];
                result.forEach(e => {
                    if (e.outdated) {
                        outdated.push(e);
                    }
                    else if (e.runtimeState) {
                        actionRequired.push(e);
                    }
                    else {
                        noActionRequired.push(e);
                    }
                });
                result = [...outdated.sort(defaultSort), ...actionRequired.sort(defaultSort), ...noActionRequired.sort(defaultSort)];
            }
            return result;
        }
        filterOutdatedExtensions(local, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            value = value.replace(/@outdated/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const result = local
                .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                .filter(extension => extension.outdated
                && (extension.name.toLowerCase().indexOf(value) > -1 || extension.displayName.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(extension, includedCategories, excludedCategories));
            return this.sortExtensions(result, options);
        }
        filterDisabledExtensions(local, runningExtensions, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            value = value.replace(/@disabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const result = local
                .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                .filter(e => runningExtensions.every(r => !(0, extensionManagementUtil_1.areSameExtensions)({ id: r.identifier.value, uuid: r.uuid }, e.identifier))
                && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(e, includedCategories, excludedCategories));
            return this.sortExtensions(result, options);
        }
        filterEnabledExtensions(local, runningExtensions, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            value = value ? value.replace(/@enabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase() : '';
            local = local.filter(e => !e.isBuiltin);
            const result = local
                .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                .filter(e => runningExtensions.some(r => (0, extensionManagementUtil_1.areSameExtensions)({ id: r.identifier.value, uuid: r.uuid }, e.identifier))
                && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(e, includedCategories, excludedCategories));
            return this.sortExtensions(result, options);
        }
        filterWorkspaceUnsupportedExtensions(local, query, options) {
            // shows local extensions which are restricted or disabled in the current workspace because of the extension's capability
            const queryString = query.value; // @sortby is already filtered out
            const match = queryString.match(/^\s*@workspaceUnsupported(?::(untrusted|virtual)(Partial)?)?(?:\s+([^\s]*))?/i);
            if (!match) {
                return [];
            }
            const type = match[1]?.toLowerCase();
            const partial = !!match[2];
            const nameFilter = match[3]?.toLowerCase();
            if (nameFilter) {
                local = local.filter(extension => extension.name.toLowerCase().indexOf(nameFilter) > -1 || extension.displayName.toLowerCase().indexOf(nameFilter) > -1);
            }
            const hasVirtualSupportType = (extension, supportType) => {
                return extension.local && this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(extension.local.manifest) === supportType;
            };
            const hasRestrictedSupportType = (extension, supportType) => {
                if (!extension.local) {
                    return false;
                }
                const enablementState = this.extensionEnablementService.getEnablementState(extension.local);
                if (enablementState !== 8 /* EnablementState.EnabledGlobally */ && enablementState !== 9 /* EnablementState.EnabledWorkspace */ &&
                    enablementState !== 0 /* EnablementState.DisabledByTrustRequirement */ && enablementState !== 5 /* EnablementState.DisabledByExtensionDependency */) {
                    return false;
                }
                if (this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(extension.local.manifest) === supportType) {
                    return true;
                }
                if (supportType === false) {
                    const dependencies = (0, extensionManagementUtil_1.getExtensionDependencies)(local.map(ext => ext.local), extension.local);
                    return dependencies.some(ext => this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(ext.manifest) === supportType);
                }
                return false;
            };
            const inVirtualWorkspace = (0, virtualWorkspace_1.isVirtualWorkspace)(this.workspaceService.getWorkspace());
            const inRestrictedWorkspace = !this.workspaceTrustManagementService.isWorkspaceTrusted();
            if (type === 'virtual') {
                // show limited and disabled extensions unless disabled because of a untrusted workspace
                local = local.filter(extension => inVirtualWorkspace && hasVirtualSupportType(extension, partial ? 'limited' : false) && !(inRestrictedWorkspace && hasRestrictedSupportType(extension, false)));
            }
            else if (type === 'untrusted') {
                // show limited and disabled extensions unless disabled because of a virtual workspace
                local = local.filter(extension => hasRestrictedSupportType(extension, partial ? 'limited' : false) && !(inVirtualWorkspace && hasVirtualSupportType(extension, false)));
            }
            else {
                // show extensions that are restricted or disabled in the current workspace
                local = local.filter(extension => inVirtualWorkspace && !hasVirtualSupportType(extension, true) || inRestrictedWorkspace && !hasRestrictedSupportType(extension, true));
            }
            return this.sortExtensions(local, options);
        }
        async filterDeprecatedExtensions(local, query, options) {
            const value = query.value.replace(/@deprecated/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const extensionsControlManifest = await this.extensionManagementService.getExtensionsControlManifest();
            const deprecatedExtensionIds = Object.keys(extensionsControlManifest.deprecated);
            local = local.filter(e => deprecatedExtensionIds.includes(e.identifier.id) && (!value || e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1));
            return this.sortExtensions(local, options);
        }
        filterRecentlyUpdatedExtensions(local, query, options) {
            let { value, includedCategories, excludedCategories } = this.parseCategories(query.value);
            const currentTime = Date.now();
            local = local.filter(e => !e.isBuiltin && !e.outdated && e.local?.updated && e.local?.installedTimestamp !== undefined && currentTime - e.local.installedTimestamp < ExtensionsListView_1.RECENT_UPDATE_DURATION);
            value = value.replace(/@recentlyUpdated/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
            const result = local.filter(e => (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                && this.filterExtensionByCategory(e, includedCategories, excludedCategories));
            options.sortBy = options.sortBy ?? "UpdateDate" /* LocalSortBy.UpdateDate */;
            return this.sortExtensions(result, options);
        }
        filterExtensionsByFeature(local, query, options) {
            const value = query.value.replace(/@feature:/g, '').trim().toLowerCase();
            const featureId = value.split(' ')[0];
            const feature = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry).getExtensionFeature(featureId);
            if (!feature) {
                return [];
            }
            const renderer = feature.renderer ? this.instantiationService.createInstance(feature.renderer) : undefined;
            const result = local.filter(e => {
                if (!e.local) {
                    return false;
                }
                return renderer?.shouldRender(e.local.manifest) || this.extensionFeaturesManagementService.getAccessData(new extensions_3.ExtensionIdentifier(e.identifier.id), featureId);
            });
            return this.sortExtensions(result, options);
        }
        mergeAddedExtensions(extensions, newExtensions) {
            const oldExtensions = [...extensions];
            const findPreviousExtensionIndex = (from) => {
                let index = -1;
                const previousExtensionInNew = newExtensions[from];
                if (previousExtensionInNew) {
                    index = oldExtensions.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, previousExtensionInNew.identifier));
                    if (index === -1) {
                        return findPreviousExtensionIndex(from - 1);
                    }
                }
                return index;
            };
            let hasChanged = false;
            for (let index = 0; index < newExtensions.length; index++) {
                const extension = newExtensions[index];
                if (extensions.every(r => !(0, extensionManagementUtil_1.areSameExtensions)(r.identifier, extension.identifier))) {
                    hasChanged = true;
                    extensions.splice(findPreviousExtensionIndex(index - 1) + 1, 0, extension);
                }
            }
            return hasChanged ? extensions : undefined;
        }
        async queryGallery(query, options, token) {
            const hasUserDefinedSortOrder = options.sortBy !== undefined;
            if (!hasUserDefinedSortOrder && !query.value.trim()) {
                options.sortBy = 4 /* GallerySortBy.InstallCount */;
            }
            if (this.isRecommendationsQuery(query)) {
                return this.queryRecommendations(query, options, token);
            }
            const text = query.value;
            if (/\bext:([^\s]+)\b/g.test(text)) {
                options.text = text;
                options.source = 'file-extension-tags';
                return this.extensionsWorkbenchService.queryGallery(options, token).then(pager => this.getPagedModel(pager));
            }
            let preferredResults = [];
            if (text) {
                options.text = text.substring(0, 350);
                options.source = 'searchText';
                if (!hasUserDefinedSortOrder) {
                    const manifest = await this.extensionManagementService.getExtensionsControlManifest();
                    const search = manifest.search;
                    if (Array.isArray(search)) {
                        for (const s of search) {
                            if (s.query && s.query.toLowerCase() === text.toLowerCase() && Array.isArray(s.preferredResults)) {
                                preferredResults = s.preferredResults;
                                break;
                            }
                        }
                    }
                }
            }
            else {
                options.source = 'viewlet';
            }
            const pager = await this.extensionsWorkbenchService.queryGallery(options, token);
            let positionToUpdate = 0;
            for (const preferredResult of preferredResults) {
                for (let j = positionToUpdate; j < pager.firstPage.length; j++) {
                    if ((0, extensionManagementUtil_1.areSameExtensions)(pager.firstPage[j].identifier, { id: preferredResult })) {
                        if (positionToUpdate !== j) {
                            const preferredExtension = pager.firstPage.splice(j, 1)[0];
                            pager.firstPage.splice(positionToUpdate, 0, preferredExtension);
                            positionToUpdate++;
                        }
                        break;
                    }
                }
            }
            return this.getPagedModel(pager);
        }
        sortExtensions(extensions, options) {
            switch (options.sortBy) {
                case 4 /* GallerySortBy.InstallCount */:
                    extensions = extensions.sort((e1, e2) => typeof e2.installCount === 'number' && typeof e1.installCount === 'number' ? e2.installCount - e1.installCount : NaN);
                    break;
                case "UpdateDate" /* LocalSortBy.UpdateDate */:
                    extensions = extensions.sort((e1, e2) => typeof e2.local?.installedTimestamp === 'number' && typeof e1.local?.installedTimestamp === 'number' ? e2.local.installedTimestamp - e1.local.installedTimestamp :
                        typeof e2.local?.installedTimestamp === 'number' ? 1 :
                            typeof e1.local?.installedTimestamp === 'number' ? -1 : NaN);
                    break;
                case 6 /* GallerySortBy.AverageRating */:
                case 12 /* GallerySortBy.WeightedRating */:
                    extensions = extensions.sort((e1, e2) => typeof e2.rating === 'number' && typeof e1.rating === 'number' ? e2.rating - e1.rating : NaN);
                    break;
                default:
                    extensions = extensions.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                    break;
            }
            if (options.sortOrder === 2 /* SortOrder.Descending */) {
                extensions = extensions.reverse();
            }
            return extensions;
        }
        isRecommendationsQuery(query) {
            return ExtensionsListView_1.isWorkspaceRecommendedExtensionsQuery(query.value)
                || ExtensionsListView_1.isKeymapsRecommendedExtensionsQuery(query.value)
                || ExtensionsListView_1.isLanguageRecommendedExtensionsQuery(query.value)
                || ExtensionsListView_1.isExeRecommendedExtensionsQuery(query.value)
                || ExtensionsListView_1.isRemoteRecommendedExtensionsQuery(query.value)
                || /@recommended:all/i.test(query.value)
                || ExtensionsListView_1.isSearchRecommendedExtensionsQuery(query.value)
                || ExtensionsListView_1.isRecommendedExtensionsQuery(query.value);
        }
        async queryRecommendations(query, options, token) {
            // Workspace recommendations
            if (ExtensionsListView_1.isWorkspaceRecommendedExtensionsQuery(query.value)) {
                return this.getWorkspaceRecommendationsModel(query, options, token);
            }
            // Keymap recommendations
            if (ExtensionsListView_1.isKeymapsRecommendedExtensionsQuery(query.value)) {
                return this.getKeymapRecommendationsModel(query, options, token);
            }
            // Language recommendations
            if (ExtensionsListView_1.isLanguageRecommendedExtensionsQuery(query.value)) {
                return this.getLanguageRecommendationsModel(query, options, token);
            }
            // Exe recommendations
            if (ExtensionsListView_1.isExeRecommendedExtensionsQuery(query.value)) {
                return this.getExeRecommendationsModel(query, options, token);
            }
            // Remote recommendations
            if (ExtensionsListView_1.isRemoteRecommendedExtensionsQuery(query.value)) {
                return this.getRemoteRecommendationsModel(query, options, token);
            }
            // All recommendations
            if (/@recommended:all/i.test(query.value)) {
                return this.getAllRecommendationsModel(options, token);
            }
            // Search recommendations
            if (ExtensionsListView_1.isSearchRecommendedExtensionsQuery(query.value) ||
                (ExtensionsListView_1.isRecommendedExtensionsQuery(query.value) && options.sortBy !== undefined)) {
                return this.searchRecommendations(query, options, token);
            }
            // Other recommendations
            if (ExtensionsListView_1.isRecommendedExtensionsQuery(query.value)) {
                return this.getOtherRecommendationsModel(query, options, token);
            }
            return new paging_1.PagedModel([]);
        }
        async getInstallableRecommendations(recommendations, options, token) {
            const result = [];
            if (recommendations.length) {
                const galleryExtensions = [];
                const resourceExtensions = [];
                for (const recommendation of recommendations) {
                    if (typeof recommendation === 'string') {
                        galleryExtensions.push(recommendation);
                    }
                    else {
                        resourceExtensions.push(recommendation);
                    }
                }
                if (galleryExtensions.length) {
                    const extensions = await this.extensionsWorkbenchService.getExtensions(galleryExtensions.map(id => ({ id })), { source: options.source }, token);
                    for (const extension of extensions) {
                        if (extension.gallery && !extension.deprecationInfo && (await this.extensionManagementService.canInstall(extension.gallery))) {
                            result.push(extension);
                        }
                    }
                }
                if (resourceExtensions.length) {
                    const extensions = await this.extensionsWorkbenchService.getResourceExtensions(resourceExtensions, true);
                    result.push(...extensions);
                }
            }
            return result;
        }
        async getWorkspaceRecommendations() {
            const recommendations = await this.extensionRecommendationsService.getWorkspaceRecommendations();
            const { important } = await this.extensionRecommendationsService.getConfigBasedRecommendations();
            for (const configBasedRecommendation of important) {
                if (!recommendations.find(extensionId => extensionId === configBasedRecommendation)) {
                    recommendations.push(configBasedRecommendation);
                }
            }
            return recommendations;
        }
        async getWorkspaceRecommendationsModel(query, options, token) {
            const recommendations = await this.getWorkspaceRecommendations();
            const installableRecommendations = (await this.getInstallableRecommendations(recommendations, { ...options, source: 'recommendations-workspace' }, token));
            return new paging_1.PagedModel(installableRecommendations);
        }
        async getKeymapRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:keymaps/g, '').trim().toLowerCase();
            const recommendations = this.extensionRecommendationsService.getKeymapRecommendations();
            const installableRecommendations = (await this.getInstallableRecommendations(recommendations, { ...options, source: 'recommendations-keymaps' }, token))
                .filter(extension => extension.identifier.id.toLowerCase().indexOf(value) > -1);
            return new paging_1.PagedModel(installableRecommendations);
        }
        async getLanguageRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:languages/g, '').trim().toLowerCase();
            const recommendations = this.extensionRecommendationsService.getLanguageRecommendations();
            const installableRecommendations = (await this.getInstallableRecommendations(recommendations, { ...options, source: 'recommendations-languages' }, token))
                .filter(extension => extension.identifier.id.toLowerCase().indexOf(value) > -1);
            return new paging_1.PagedModel(installableRecommendations);
        }
        async getRemoteRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:remotes/g, '').trim().toLowerCase();
            const recommendations = this.extensionRecommendationsService.getRemoteRecommendations();
            const installableRecommendations = (await this.getInstallableRecommendations(recommendations, { ...options, source: 'recommendations-remotes' }, token))
                .filter(extension => extension.identifier.id.toLowerCase().indexOf(value) > -1);
            return new paging_1.PagedModel(installableRecommendations);
        }
        async getExeRecommendationsModel(query, options, token) {
            const exe = query.value.replace(/@exe:/g, '').trim().toLowerCase();
            const { important, others } = await this.extensionRecommendationsService.getExeBasedRecommendations(exe.startsWith('"') ? exe.substring(1, exe.length - 1) : exe);
            const installableRecommendations = await this.getInstallableRecommendations([...important, ...others], { ...options, source: 'recommendations-exe' }, token);
            return new paging_1.PagedModel(installableRecommendations);
        }
        async getOtherRecommendationsModel(query, options, token) {
            const otherRecommendations = await this.getOtherRecommendations();
            const installableRecommendations = await this.getInstallableRecommendations(otherRecommendations, { ...options, source: 'recommendations-other', sortBy: undefined }, token);
            const result = (0, arrays_1.coalesce)(otherRecommendations.map(id => installableRecommendations.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id }))));
            return new paging_1.PagedModel(result);
        }
        async getOtherRecommendations() {
            const local = (await this.extensionsWorkbenchService.queryLocal(this.options.server))
                .map(e => e.identifier.id.toLowerCase());
            const workspaceRecommendations = (await this.getWorkspaceRecommendations())
                .map(extensionId => (0, types_1.isString)(extensionId) ? extensionId.toLowerCase() : extensionId);
            return (0, arrays_1.distinct)((0, arrays_1.flatten)(await Promise.all([
                // Order is important
                this.extensionRecommendationsService.getImportantRecommendations(),
                this.extensionRecommendationsService.getFileBasedRecommendations(),
                this.extensionRecommendationsService.getOtherRecommendations()
            ])).filter(extensionId => !local.includes(extensionId.toLowerCase()) && !workspaceRecommendations.includes(extensionId.toLowerCase())), extensionId => extensionId.toLowerCase());
        }
        // Get All types of recommendations, trimmed to show a max of 8 at any given time
        async getAllRecommendationsModel(options, token) {
            const local = (await this.extensionsWorkbenchService.queryLocal(this.options.server)).map(e => e.identifier.id.toLowerCase());
            const allRecommendations = (0, arrays_1.distinct)((0, arrays_1.flatten)(await Promise.all([
                // Order is important
                this.getWorkspaceRecommendations(),
                this.extensionRecommendationsService.getImportantRecommendations(),
                this.extensionRecommendationsService.getFileBasedRecommendations(),
                this.extensionRecommendationsService.getOtherRecommendations()
            ])).filter(extensionId => !(0, types_1.isString)(extensionId) || !local.includes(extensionId.toLowerCase())));
            const installableRecommendations = await this.getInstallableRecommendations(allRecommendations, { ...options, source: 'recommendations-all', sortBy: undefined }, token);
            return new paging_1.PagedModel(installableRecommendations.slice(0, 8));
        }
        async searchRecommendations(query, options, token) {
            const value = query.value.replace(/@recommended/g, '').trim().toLowerCase();
            const recommendations = (0, arrays_1.distinct)([...await this.getWorkspaceRecommendations(), ...await this.getOtherRecommendations()]);
            const installableRecommendations = (await this.getInstallableRecommendations(recommendations, { ...options, source: 'recommendations', sortBy: undefined }, token))
                .filter(extension => extension.identifier.id.toLowerCase().indexOf(value) > -1);
            return new paging_1.PagedModel(this.sortExtensions(installableRecommendations, options));
        }
        setModel(model, error, donotResetScrollTop) {
            if (this.list) {
                this.list.model = new paging_1.DelayedPagedModel(model);
                if (!donotResetScrollTop) {
                    this.list.scrollTop = 0;
                }
                this.updateBody(error);
            }
            if (this.badge) {
                this.badge.setCount(this.count());
            }
        }
        updateModel(model) {
            if (this.list) {
                this.list.model = new paging_1.DelayedPagedModel(model);
                this.updateBody();
            }
            if (this.badge) {
                this.badge.setCount(this.count());
            }
        }
        updateBody(error) {
            if (this.bodyTemplate) {
                const count = this.count();
                this.bodyTemplate.extensionsList.classList.toggle('hidden', count === 0);
                this.bodyTemplate.messageContainer.classList.toggle('hidden', count > 0);
                if (count === 0 && this.isBodyVisible()) {
                    if (error) {
                        if ((0, request_1.isOfflineError)(error)) {
                            this.bodyTemplate.messageSeverityIcon.className = severityIcon_1.SeverityIcon.className(notification_1.Severity.Warning);
                            this.bodyTemplate.messageBox.textContent = (0, nls_1.localize)('offline error', "Unable to search the Marketplace when offline, please check your network connection.");
                        }
                        else {
                            this.bodyTemplate.messageSeverityIcon.className = severityIcon_1.SeverityIcon.className(notification_1.Severity.Error);
                            this.bodyTemplate.messageBox.textContent = (0, nls_1.localize)('error', "Error while fetching extensions. {0}", (0, errors_1.getErrorMessage)(error));
                        }
                    }
                    else {
                        this.bodyTemplate.messageSeverityIcon.className = '';
                        this.bodyTemplate.messageBox.textContent = (0, nls_1.localize)('no extensions found', "No extensions found.");
                    }
                    (0, aria_1.alert)(this.bodyTemplate.messageBox.textContent);
                }
            }
            this.updateSize();
        }
        updateSize() {
            if (this.options.flexibleHeight) {
                this.maximumBodySize = this.list?.model.length ? Number.POSITIVE_INFINITY : 0;
                this.storageService.store(`${this.id}.size`, this.list?.model.length || 0, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        openExtension(extension, options) {
            extension = this.extensionsWorkbenchService.local.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, extension.identifier))[0] || extension;
            this.extensionsWorkbenchService.open(extension, options).then(undefined, err => this.onError(err));
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/ECONNREFUSED/.test(message)) {
                const error = (0, errorMessage_1.createErrorWithActions)((0, nls_1.localize)('suggestProxyError', "Marketplace returned 'ECONNREFUSED'. Please check the 'http.proxy' setting."), [
                    new actions_1.Action('open user settings', (0, nls_1.localize)('open user settings', "Open User Settings"), undefined, true, () => this.preferencesService.openUserSettings())
                ]);
                this.notificationService.error(error);
                return;
            }
            this.notificationService.error(err);
        }
        getPagedModel(arg) {
            if (Array.isArray(arg)) {
                return new paging_1.PagedModel(arg);
            }
            const pager = {
                total: arg.total,
                pageSize: arg.pageSize,
                firstPage: arg.firstPage,
                getPage: (pageIndex, cancellationToken) => arg.getPage(pageIndex, cancellationToken)
            };
            return new paging_1.PagedModel(pager);
        }
        dispose() {
            super.dispose();
            if (this.queryRequest) {
                this.queryRequest.request.cancel();
                this.queryRequest = null;
            }
            if (this.queryResult) {
                this.queryResult.disposables.dispose();
                this.queryResult = undefined;
            }
            this.list = null;
        }
        static isLocalExtensionsQuery(query, sortBy) {
            return this.isInstalledExtensionsQuery(query)
                || this.isSearchInstalledExtensionsQuery(query)
                || this.isOutdatedExtensionsQuery(query)
                || this.isEnabledExtensionsQuery(query)
                || this.isDisabledExtensionsQuery(query)
                || this.isBuiltInExtensionsQuery(query)
                || this.isSearchBuiltInExtensionsQuery(query)
                || this.isBuiltInGroupExtensionsQuery(query)
                || this.isSearchDeprecatedExtensionsQuery(query)
                || this.isSearchWorkspaceUnsupportedExtensionsQuery(query)
                || this.isSearchRecentlyUpdatedQuery(query)
                || this.isSearchExtensionUpdatesQuery(query)
                || this.isSortInstalledExtensionsQuery(query, sortBy)
                || this.isFeatureExtensionsQuery(query);
        }
        static isSearchBuiltInExtensionsQuery(query) {
            return /@builtin\s.+/i.test(query);
        }
        static isBuiltInExtensionsQuery(query) {
            return /^\s*@builtin$/i.test(query.trim());
        }
        static isBuiltInGroupExtensionsQuery(query) {
            return /^\s*@builtin:.+$/i.test(query.trim());
        }
        static isSearchWorkspaceUnsupportedExtensionsQuery(query) {
            return /^\s*@workspaceUnsupported(:(untrusted|virtual)(Partial)?)?(\s|$)/i.test(query);
        }
        static isInstalledExtensionsQuery(query) {
            return /@installed$/i.test(query);
        }
        static isSearchInstalledExtensionsQuery(query) {
            return /@installed\s./i.test(query) || this.isFeatureExtensionsQuery(query);
        }
        static isOutdatedExtensionsQuery(query) {
            return /@outdated/i.test(query);
        }
        static isEnabledExtensionsQuery(query) {
            return /@enabled/i.test(query);
        }
        static isDisabledExtensionsQuery(query) {
            return /@disabled/i.test(query);
        }
        static isSearchDeprecatedExtensionsQuery(query) {
            return /@deprecated\s?.*/i.test(query);
        }
        static isRecommendedExtensionsQuery(query) {
            return /^@recommended$/i.test(query.trim());
        }
        static isSearchRecommendedExtensionsQuery(query) {
            return /@recommended\s.+/i.test(query);
        }
        static isWorkspaceRecommendedExtensionsQuery(query) {
            return /@recommended:workspace/i.test(query);
        }
        static isExeRecommendedExtensionsQuery(query) {
            return /@exe:.+/i.test(query);
        }
        static isRemoteRecommendedExtensionsQuery(query) {
            return /@recommended:remotes/i.test(query);
        }
        static isKeymapsRecommendedExtensionsQuery(query) {
            return /@recommended:keymaps/i.test(query);
        }
        static isLanguageRecommendedExtensionsQuery(query) {
            return /@recommended:languages/i.test(query);
        }
        static isSortInstalledExtensionsQuery(query, sortBy) {
            return (sortBy !== undefined && sortBy !== '' && query === '') || (!sortBy && /^@sort:\S*$/i.test(query));
        }
        static isSearchPopularQuery(query) {
            return /@popular/i.test(query);
        }
        static isSearchRecentlyPublishedQuery(query) {
            return /@recentlyPublished/i.test(query);
        }
        static isSearchRecentlyUpdatedQuery(query) {
            return /@recentlyUpdated/i.test(query);
        }
        static isSearchExtensionUpdatesQuery(query) {
            return /@updates/i.test(query);
        }
        static isSortUpdateDateQuery(query) {
            return /@sort:updateDate/i.test(query);
        }
        static isFeatureExtensionsQuery(query) {
            return /@feature:/i.test(query);
        }
        focus() {
            super.focus();
            if (!this.list) {
                return;
            }
            if (!(this.list.getFocus().length || this.list.getSelection().length)) {
                this.list.focusNext();
            }
            this.list.domFocus();
        }
    };
    exports.ExtensionsListView = ExtensionsListView;
    exports.ExtensionsListView = ExtensionsListView = ExtensionsListView_1 = __decorate([
        __param(2, notification_1.INotificationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, extensions_2.IExtensionService),
        __param(8, extensions_1.IExtensionsWorkbenchService),
        __param(9, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, extensionManagement_1.IExtensionManagementServerService),
        __param(14, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(15, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, productService_1.IProductService),
        __param(18, contextkey_1.IContextKeyService),
        __param(19, views_1.IViewDescriptorService),
        __param(20, opener_1.IOpenerService),
        __param(21, preferences_1.IPreferencesService),
        __param(22, storage_1.IStorageService),
        __param(23, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(24, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(25, layoutService_1.IWorkbenchLayoutService),
        __param(26, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(27, uriIdentity_1.IUriIdentityService),
        __param(28, log_1.ILogService)
    ], ExtensionsListView);
    class DefaultPopularExtensionsView extends ExtensionsListView {
        async show() {
            const query = this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer ? '@web' : '';
            return super.show(query);
        }
    }
    exports.DefaultPopularExtensionsView = DefaultPopularExtensionsView;
    class ServerInstalledExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query ? query : '@installed';
            if (!ExtensionsListView.isLocalExtensionsQuery(query) || ExtensionsListView.isSortInstalledExtensionsQuery(query)) {
                query = query += ' @installed';
            }
            return super.show(query.trim());
        }
    }
    exports.ServerInstalledExtensionsView = ServerInstalledExtensionsView;
    class EnabledExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query || '@enabled';
            return ExtensionsListView.isEnabledExtensionsQuery(query) ? super.show(query) :
                ExtensionsListView.isSortInstalledExtensionsQuery(query) ? super.show('@enabled ' + query) : this.showEmptyModel();
        }
    }
    exports.EnabledExtensionsView = EnabledExtensionsView;
    class DisabledExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query || '@disabled';
            return ExtensionsListView.isDisabledExtensionsQuery(query) ? super.show(query) :
                ExtensionsListView.isSortInstalledExtensionsQuery(query) ? super.show('@disabled ' + query) : this.showEmptyModel();
        }
    }
    exports.DisabledExtensionsView = DisabledExtensionsView;
    class OutdatedExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query ? query : '@outdated';
            if (ExtensionsListView.isSearchExtensionUpdatesQuery(query)) {
                query = query.replace('@updates', '@outdated');
            }
            return super.show(query.trim());
        }
        updateSize() {
            super.updateSize();
            this.setExpanded(this.count() > 0);
        }
    }
    exports.OutdatedExtensionsView = OutdatedExtensionsView;
    class RecentlyUpdatedExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query ? query : '@recentlyUpdated';
            if (ExtensionsListView.isSearchExtensionUpdatesQuery(query)) {
                query = query.replace('@updates', '@recentlyUpdated');
            }
            return super.show(query.trim());
        }
    }
    exports.RecentlyUpdatedExtensionsView = RecentlyUpdatedExtensionsView;
    let StaticQueryExtensionsView = class StaticQueryExtensionsView extends ExtensionsListView {
        constructor(options, viewletViewOptions, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, extensionRecommendationsService, telemetryService, configurationService, contextService, extensionManagementServerService, extensionManifestPropertiesService, extensionManagementService, workspaceService, productService, contextKeyService, viewDescriptorService, openerService, preferencesService, storageService, workspaceTrustManagementService, extensionEnablementService, layoutService, extensionFeaturesManagementService, uriIdentityService, logService) {
            super(options, viewletViewOptions, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, extensionRecommendationsService, telemetryService, configurationService, contextService, extensionManagementServerService, extensionManifestPropertiesService, extensionManagementService, workspaceService, productService, contextKeyService, viewDescriptorService, openerService, preferencesService, storageService, workspaceTrustManagementService, extensionEnablementService, layoutService, extensionFeaturesManagementService, uriIdentityService, logService);
            this.options = options;
        }
        show() {
            return super.show(this.options.query);
        }
    };
    exports.StaticQueryExtensionsView = StaticQueryExtensionsView;
    exports.StaticQueryExtensionsView = StaticQueryExtensionsView = __decorate([
        __param(2, notification_1.INotificationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, extensions_2.IExtensionService),
        __param(8, extensions_1.IExtensionsWorkbenchService),
        __param(9, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, extensionManagement_1.IExtensionManagementServerService),
        __param(14, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(15, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, productService_1.IProductService),
        __param(18, contextkey_1.IContextKeyService),
        __param(19, views_1.IViewDescriptorService),
        __param(20, opener_1.IOpenerService),
        __param(21, preferences_1.IPreferencesService),
        __param(22, storage_1.IStorageService),
        __param(23, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(24, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(25, layoutService_1.IWorkbenchLayoutService),
        __param(26, extensionFeatures_1.IExtensionFeaturesManagementService),
        __param(27, uriIdentity_1.IUriIdentityService),
        __param(28, log_1.ILogService)
    ], StaticQueryExtensionsView);
    function toSpecificWorkspaceUnsupportedQuery(query, qualifier) {
        if (!query) {
            return '@workspaceUnsupported:' + qualifier;
        }
        const match = query.match(new RegExp(`@workspaceUnsupported(:${qualifier})?(\\s|$)`, 'i'));
        if (match) {
            if (!match[1]) {
                return query.replace(/@workspaceUnsupported/gi, '@workspaceUnsupported:' + qualifier);
            }
            return query;
        }
        return undefined;
    }
    class UntrustedWorkspaceUnsupportedExtensionsView extends ExtensionsListView {
        async show(query) {
            const updatedQuery = toSpecificWorkspaceUnsupportedQuery(query, 'untrusted');
            return updatedQuery ? super.show(updatedQuery) : this.showEmptyModel();
        }
    }
    exports.UntrustedWorkspaceUnsupportedExtensionsView = UntrustedWorkspaceUnsupportedExtensionsView;
    class UntrustedWorkspacePartiallySupportedExtensionsView extends ExtensionsListView {
        async show(query) {
            const updatedQuery = toSpecificWorkspaceUnsupportedQuery(query, 'untrustedPartial');
            return updatedQuery ? super.show(updatedQuery) : this.showEmptyModel();
        }
    }
    exports.UntrustedWorkspacePartiallySupportedExtensionsView = UntrustedWorkspacePartiallySupportedExtensionsView;
    class VirtualWorkspaceUnsupportedExtensionsView extends ExtensionsListView {
        async show(query) {
            const updatedQuery = toSpecificWorkspaceUnsupportedQuery(query, 'virtual');
            return updatedQuery ? super.show(updatedQuery) : this.showEmptyModel();
        }
    }
    exports.VirtualWorkspaceUnsupportedExtensionsView = VirtualWorkspaceUnsupportedExtensionsView;
    class VirtualWorkspacePartiallySupportedExtensionsView extends ExtensionsListView {
        async show(query) {
            const updatedQuery = toSpecificWorkspaceUnsupportedQuery(query, 'virtualPartial');
            return updatedQuery ? super.show(updatedQuery) : this.showEmptyModel();
        }
    }
    exports.VirtualWorkspacePartiallySupportedExtensionsView = VirtualWorkspacePartiallySupportedExtensionsView;
    class DeprecatedExtensionsView extends ExtensionsListView {
        async show(query) {
            return ExtensionsListView.isSearchDeprecatedExtensionsQuery(query) ? super.show(query) : this.showEmptyModel();
        }
    }
    exports.DeprecatedExtensionsView = DeprecatedExtensionsView;
    class SearchMarketplaceExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.reportSearchFinishedDelayer = this._register(new async_1.ThrottledDelayer(2000));
            this.searchWaitPromise = Promise.resolve();
        }
        async show(query) {
            const queryPromise = super.show(query);
            this.reportSearchFinishedDelayer.trigger(() => this.reportSearchFinished());
            this.searchWaitPromise = queryPromise.then(null, null);
            return queryPromise;
        }
        async reportSearchFinished() {
            await this.searchWaitPromise;
            this.telemetryService.publicLog2('extensionsView:MarketplaceSearchFinished');
        }
    }
    exports.SearchMarketplaceExtensionsView = SearchMarketplaceExtensionsView;
    class DefaultRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:all';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => {
                this.show('');
            }));
        }
        async show(query) {
            if (query && query.trim() !== this.recommendedExtensionsQuery) {
                return this.showEmptyModel();
            }
            const model = await super.show(this.recommendedExtensionsQuery);
            if (!this.extensionsWorkbenchService.local.some(e => !e.isBuiltin)) {
                // This is part of popular extensions view. Collapse if no installed extensions.
                this.setExpanded(model.length > 0);
            }
            return model;
        }
    }
    exports.DefaultRecommendedExtensionsView = DefaultRecommendedExtensionsView;
    class RecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => {
                this.show('');
            }));
        }
        async show(query) {
            return (query && query.trim() !== this.recommendedExtensionsQuery) ? this.showEmptyModel() : super.show(this.recommendedExtensionsQuery);
        }
    }
    exports.RecommendedExtensionsView = RecommendedExtensionsView;
    class WorkspaceRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:workspace';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => this.show(this.recommendedExtensionsQuery)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.show(this.recommendedExtensionsQuery)));
        }
        async show(query) {
            const shouldShowEmptyView = query && query.trim() !== '@recommended' && query.trim() !== '@recommended:workspace';
            const model = await (shouldShowEmptyView ? this.showEmptyModel() : super.show(this.recommendedExtensionsQuery));
            this.setExpanded(model.length > 0);
            return model;
        }
        async getInstallableWorkspaceRecommendations() {
            const installed = (await this.extensionsWorkbenchService.queryLocal())
                .filter(l => l.enablementState !== 1 /* EnablementState.DisabledByExtensionKind */); // Filter extensions disabled by kind
            const recommendations = (await this.getWorkspaceRecommendations())
                .filter(recommendation => installed.every(local => (0, types_1.isString)(recommendation) ? !(0, extensionManagementUtil_1.areSameExtensions)({ id: recommendation }, local.identifier) : !this.uriIdentityService.extUri.isEqual(recommendation, local.local?.location)));
            return this.getInstallableRecommendations(recommendations, { source: 'install-all-workspace-recommendations' }, cancellation_1.CancellationToken.None);
        }
        async installWorkspaceRecommendations() {
            const installableRecommendations = await this.getInstallableWorkspaceRecommendations();
            if (installableRecommendations.length) {
                const galleryExtensions = [];
                const resourceExtensions = [];
                for (const recommendation of installableRecommendations) {
                    if (recommendation.gallery) {
                        galleryExtensions.push({ extension: recommendation.gallery, options: {} });
                    }
                    else {
                        resourceExtensions.push(recommendation);
                    }
                }
                await Promise.all([
                    this.extensionManagementService.installGalleryExtensions(galleryExtensions),
                    ...resourceExtensions.map(extension => this.extensionsWorkbenchService.install(extension))
                ]);
            }
            else {
                this.notificationService.notify({
                    severity: notification_1.Severity.Info,
                    message: (0, nls_1.localize)('no local extensions', "There are no extensions to install.")
                });
            }
        }
    }
    exports.WorkspaceRecommendedExtensionsView = WorkspaceRecommendedExtensionsView;
    function getAriaLabelForExtension(extension) {
        if (!extension) {
            return '';
        }
        const publisher = extension.publisherDomain?.verified ? (0, nls_1.localize)('extension.arialabel.verifiedPublisher', "Verified Publisher {0}", extension.publisherDisplayName) : (0, nls_1.localize)('extension.arialabel.publisher', "Publisher {0}", extension.publisherDisplayName);
        const deprecated = extension?.deprecationInfo ? (0, nls_1.localize)('extension.arialabel.deprecated', "Deprecated") : '';
        const rating = extension?.rating ? (0, nls_1.localize)('extension.arialabel.rating', "Rated {0} out of 5 stars by {1} users", extension.rating.toFixed(2), extension.ratingCount) : '';
        return `${extension.displayName}, ${deprecated ? `${deprecated}, ` : ''}${extension.version}, ${publisher}, ${extension.description} ${rating ? `, ${rating}` : ''}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1ZpZXdzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uc1ZpZXdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEwK0NoRyw0REFRQztJQXQ3Q1ksUUFBQSxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBRXBDLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFBNUM7O1lBRWtCLGFBQVEsR0FBd0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBYyxDQUFDLENBQUM7WUFDbEYsWUFBTyxHQUFzQixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUV6QyxZQUFPLEdBQXdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWMsQ0FBQyxDQUFDO1lBQ2pGLFdBQU0sR0FBc0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7WUFFaEQsMEJBQXFCLEdBQWlCLEVBQUUsQ0FBQztRQU9sRCxDQUFDO1FBTEEsYUFBYSxDQUFDLFVBQXdCO1lBQ3JDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQzlFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxVQUFVLENBQUM7WUFDeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQztLQUNEO0lBZUQsSUFBVyxXQUVWO0lBRkQsV0FBVyxXQUFXO1FB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