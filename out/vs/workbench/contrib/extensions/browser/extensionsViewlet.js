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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "../common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/contrib/extensions/browser/extensionsViews", "vs/platform/progress/common/progress", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/severity", "vs/workbench/services/activity/common/activity", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/base/browser/ui/aria/aria", "vs/platform/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/platform/label/common/label", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/preferences/common/preferences", "vs/workbench/common/theme", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contextkeys", "vs/platform/commands/common/commands", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/actions/common/actions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/arrays", "vs/platform/dnd/browser/dnd", "vs/base/common/resources", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/browser/actions/widgetNavigationCommands", "vs/platform/actions/browser/toolbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/extensionsViewlet"], function (require, exports, nls_1, async_1, errors_1, errorMessage_1, lifecycle_1, event_1, actions_1, dom_1, telemetry_1, instantiation_1, extensions_1, extensions_2, extensionsActions_1, extensionManagement_1, extensionManagement_2, extensionsInput_1, extensionsViews_1, progress_1, editorGroupsService_1, severity_1, activity_1, themeService_1, configuration_1, views_1, storage_1, workspace_1, contextkey_1, contextView_1, log_1, notification_1, host_1, layoutService_1, viewPaneContainer_1, extensionQuery_1, suggestEnabledInput_1, aria_1, extensions_3, platform_1, label_1, descriptors_1, preferences_1, theme_1, environmentService_1, contextkeys_1, commands_1, extensionsIcons_1, actions_2, panecomposite_1, arrays_1, dnd_1, resources_1, extensionManagementUtil_1, widgetNavigationCommands_1, toolbar_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MaliciousExtensionChecker = exports.StatusUpdater = exports.ExtensionsViewPaneContainer = exports.ExtensionsViewletViewsContribution = exports.RecommendedExtensionsContext = exports.BuiltInExtensionsContext = exports.SearchHasTextContext = exports.SearchMarketplaceExtensionsContext = exports.ExtensionsSortByContext = exports.DefaultViewsContext = void 0;
    exports.DefaultViewsContext = new contextkey_1.RawContextKey('defaultExtensionViews', true);
    exports.ExtensionsSortByContext = new contextkey_1.RawContextKey('extensionsSortByValue', '');
    exports.SearchMarketplaceExtensionsContext = new contextkey_1.RawContextKey('searchMarketplaceExtensions', false);
    exports.SearchHasTextContext = new contextkey_1.RawContextKey('extensionSearchHasText', false);
    const InstalledExtensionsContext = new contextkey_1.RawContextKey('installedExtensions', false);
    const SearchInstalledExtensionsContext = new contextkey_1.RawContextKey('searchInstalledExtensions', false);
    const SearchRecentlyUpdatedExtensionsContext = new contextkey_1.RawContextKey('searchRecentlyUpdatedExtensions', false);
    const SearchExtensionUpdatesContext = new contextkey_1.RawContextKey('searchExtensionUpdates', false);
    const SearchOutdatedExtensionsContext = new contextkey_1.RawContextKey('searchOutdatedExtensions', false);
    const SearchEnabledExtensionsContext = new contextkey_1.RawContextKey('searchEnabledExtensions', false);
    const SearchDisabledExtensionsContext = new contextkey_1.RawContextKey('searchDisabledExtensions', false);
    const HasInstalledExtensionsContext = new contextkey_1.RawContextKey('hasInstalledExtensions', true);
    exports.BuiltInExtensionsContext = new contextkey_1.RawContextKey('builtInExtensions', false);
    const SearchBuiltInExtensionsContext = new contextkey_1.RawContextKey('searchBuiltInExtensions', false);
    const SearchUnsupportedWorkspaceExtensionsContext = new contextkey_1.RawContextKey('searchUnsupportedWorkspaceExtensions', false);
    const SearchDeprecatedExtensionsContext = new contextkey_1.RawContextKey('searchDeprecatedExtensions', false);
    exports.RecommendedExtensionsContext = new contextkey_1.RawContextKey('recommendedExtensions', false);
    const SortByUpdateDateContext = new contextkey_1.RawContextKey('sortByUpdateDate', false);
    const REMOTE_CATEGORY = (0, nls_1.localize2)({ key: 'remote', comment: ['Remote as in remote machine'] }, "Remote");
    let ExtensionsViewletViewsContribution = class ExtensionsViewletViewsContribution extends lifecycle_1.Disposable {
        constructor(extensionManagementServerService, labelService, viewDescriptorService, contextKeyService) {
            super();
            this.extensionManagementServerService = extensionManagementServerService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.container = viewDescriptorService.getViewContainerById(extensions_2.VIEWLET_ID);
            this.registerViews();
        }
        registerViews() {
            const viewDescriptors = [];
            /* Default views */
            viewDescriptors.push(...this.createDefaultExtensionsViewDescriptors());
            /* Search views */
            viewDescriptors.push(...this.createSearchExtensionsViewDescriptors());
            /* Recommendations views */
            viewDescriptors.push(...this.createRecommendedExtensionsViewDescriptors());
            /* Built-in extensions views */
            viewDescriptors.push(...this.createBuiltinExtensionsViewDescriptors());
            /* Trust Required extensions views */
            viewDescriptors.push(...this.createUnsupportedWorkspaceExtensionsViewDescriptors());
            /* Other Local Filtered extensions views */
            viewDescriptors.push(...this.createOtherLocalFilteredExtensionsViewDescriptors());
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews(viewDescriptors, this.container);
        }
        createDefaultExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * Default installed extensions views - Shows all user installed extensions.
             */
            const servers = [];
            if (this.extensionManagementServerService.localExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.localExtensionManagementServer);
            }
            if (this.extensionManagementServerService.remoteExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.remoteExtensionManagementServer);
            }
            if (this.extensionManagementServerService.webExtensionManagementServer) {
                servers.push(this.extensionManagementServerService.webExtensionManagementServer);
            }
            const getViewName = (viewTitle, server) => {
                return servers.length > 1 ? `${server.label} - ${viewTitle}` : viewTitle;
            };
            let installedWebExtensionsContextChangeEvent = event_1.Event.None;
            if (this.extensionManagementServerService.webExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                const interestingContextKeys = new Set();
                interestingContextKeys.add('hasInstalledWebExtensions');
                installedWebExtensionsContextChangeEvent = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(interestingContextKeys));
            }
            const serverLabelChangeEvent = event_1.Event.any(this.labelService.onDidChangeFormatters, installedWebExtensionsContextChangeEvent);
            for (const server of servers) {
                const getInstalledViewName = () => getViewName((0, nls_1.localize)('installed', "Installed"), server);
                const onDidChangeTitle = event_1.Event.map(serverLabelChangeEvent, () => getInstalledViewName());
                const id = servers.length > 1 ? `workbench.views.extensions.${server.id}.installed` : `workbench.views.extensions.installed`;
                /* Installed extensions view */
                viewDescriptors.push({
                    id,
                    get name() {
                        return {
                            value: getInstalledViewName(),
                            original: getViewName('Installed', server)
                        };
                    },
                    weight: 100,
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ServerInstalledExtensionsView, [{ server, flexibleHeight: true, onDidChangeTitle }]),
                    /* Installed extensions views shall not be allowed to hidden when there are more than one server */
                    canToggleVisibility: servers.length === 1
                });
                if (server === this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManagementServerService.localExtensionManagementServer) {
                    this._register((0, actions_2.registerAction2)(class InstallLocalExtensionsInRemoteAction2 extends actions_2.Action2 {
                        constructor() {
                            super({
                                id: 'workbench.extensions.installLocalExtensions',
                                get title() {
                                    return (0, nls_1.localize2)('select and install local extensions', "Install Local Extensions in '{0}'...", server.label);
                                },
                                category: REMOTE_CATEGORY,
                                icon: extensionsIcons_1.installLocalInRemoteIcon,
                                f1: true,
                                menu: {
                                    id: actions_2.MenuId.ViewTitle,
                                    when: contextkey_1.ContextKeyExpr.equals('view', id),
                                    group: 'navigation',
                                }
                            });
                        }
                        run(accessor) {
                            return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallLocalExtensionsInRemoteAction).run();
                        }
                    }));
                }
            }
            if (this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) {
                this._register((0, actions_2.registerAction2)(class InstallRemoteExtensionsInLocalAction2 extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.extensions.actions.installLocalExtensionsInRemote',
                            title: (0, nls_1.localize2)('install remote in local', 'Install Remote Extensions Locally...'),
                            category: REMOTE_CATEGORY,
                            f1: true
                        });
                    }
                    run(accessor) {
                        return accessor.get(instantiation_1.IInstantiationService).createInstance(extensionsActions_1.InstallRemoteExtensionsInLocalAction, 'workbench.extensions.actions.installLocalExtensionsInRemote').run();
                    }
                }));
            }
            /*
             * Default popular extensions view
             * Separate view for popular extensions required as we need to show popular and recommended sections
             * in the default view when there is no search text, and user has no installed extensions.
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.popular',
                name: (0, nls_1.localize2)('popularExtensions', "Popular"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultPopularExtensionsView, [{ hideBadge: true }]),
                when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.not('hasInstalledExtensions'), extensions_2.CONTEXT_HAS_GALLERY),
                weight: 60,
                order: 2,
                canToggleVisibility: false
            });
            /*
             * Default recommended extensions view
             * When user has installed extensions, this is shown along with the views for enabled & disabled extensions
             * When user has no installed extensions, this is shown along with the view for popular extensions
             */
            viewDescriptors.push({
                id: 'extensions.recommendedList',
                name: (0, nls_1.localize2)('recommendedExtensions', "Recommended"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DefaultRecommendedExtensionsView, [{ flexibleHeight: true }]),
                when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, SortByUpdateDateContext.negate(), contextkey_1.ContextKeyExpr.not('config.extensions.showRecommendationsOnlyOnDemand'), extensions_2.CONTEXT_HAS_GALLERY),
                weight: 40,
                order: 3,
                canToggleVisibility: true
            });
            /* Installed views shall be default in multi server window  */
            if (servers.length === 1) {
                /*
                 * Default enabled extensions view - Shows all user installed enabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.enabled',
                    name: (0, nls_1.localize2)('enabledExtensions', "Enabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.EnabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 40,
                    order: 4,
                    canToggleVisibility: true
                });
                /*
                 * Default disabled extensions view - Shows all disabled extensions.
                 * Hidden by default
                 */
                viewDescriptors.push({
                    id: 'workbench.views.extensions.disabled',
                    name: (0, nls_1.localize2)('disabledExtensions', "Disabled"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DisabledExtensionsView, [{}]),
                    when: contextkey_1.ContextKeyExpr.and(exports.DefaultViewsContext, contextkey_1.ContextKeyExpr.has('hasInstalledExtensions')),
                    hideByDefault: true,
                    weight: 10,
                    order: 5,
                    canToggleVisibility: true
                });
            }
            return viewDescriptors;
        }
        createSearchExtensionsViewDescriptors() {
            const viewDescriptors = [];
            /*
             * View used for searching Marketplace
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.marketplace',
                name: (0, nls_1.localize2)('marketPlace', "Marketplace"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.SearchMarketplaceExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchMarketplaceExtensions')),
            });
            /*
             * View used for searching all installed extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchInstalled',
                name: (0, nls_1.localize2)('installed', "Installed"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.has('searchInstalledExtensions'), contextkey_1.ContextKeyExpr.has('installedExtensions')),
            });
            /*
             * View used for searching recently updated extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchRecentlyUpdated',
                name: (0, nls_1.localize2)('recently updated', "Recently Updated"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.RecentlyUpdatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(SearchExtensionUpdatesContext, contextkey_1.ContextKeyExpr.has('searchRecentlyUpdatedExtensions')),
                order: 2,
            });
            /*
             * View used for searching enabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchEnabled',
                name: (0, nls_1.localize2)('enabled', "Enabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchEnabledExtensions')),
            });
            /*
             * View used for searching disabled extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchDisabled',
                name: (0, nls_1.localize2)('disabled', "Disabled"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchDisabledExtensions')),
            });
            /*
             * View used for searching outdated extensions
             */
            viewDescriptors.push({
                id: extensions_2.OUTDATED_EXTENSIONS_VIEW_ID,
                name: (0, nls_1.localize2)('availableUpdates', "Available Updates"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.OutdatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.or(SearchExtensionUpdatesContext, contextkey_1.ContextKeyExpr.has('searchOutdatedExtensions')),
                order: 1,
            });
            /*
             * View used for searching builtin extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchBuiltin',
                name: (0, nls_1.localize2)('builtin', "Builtin"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchBuiltInExtensions')),
            });
            /*
             * View used for searching workspace unsupported extensions
             */
            viewDescriptors.push({
                id: 'workbench.views.extensions.searchWorkspaceUnsupported',
                name: (0, nls_1.localize2)('workspaceUnsupported', "Workspace Unsupported"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.ExtensionsListView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('searchWorkspaceUnsupportedExtensions')),
            });
            return viewDescriptors;
        }
        createRecommendedExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: extensions_2.WORKSPACE_RECOMMENDATIONS_VIEW_ID,
                name: (0, nls_1.localize2)('workspaceRecommendedExtensions', "Workspace Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.WorkspaceRecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has('recommendedExtensions'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')),
                order: 1
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.otherRecommendations',
                name: (0, nls_1.localize2)('otherRecommendedExtensions', "Other Recommendations"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.RecommendedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.has('recommendedExtensions'),
                order: 2
            });
            return viewDescriptors;
        }
        createBuiltinExtensionsViewDescriptors() {
            const viewDescriptors = [];
            const configuredCategories = ['themes', 'programming languages'];
            const otherCategories = extensions_3.EXTENSION_CATEGORIES.filter(c => !configuredCategories.includes(c.toLowerCase()));
            otherCategories.push(extensionsViews_1.NONE_CATEGORY);
            const otherCategoriesQuery = `${otherCategories.map(c => `category:"${c}"`).join(' ')} ${configuredCategories.map(c => `category:"-${c}"`).join(' ')}`;
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinFeatureExtensions',
                name: (0, nls_1.localize2)('builtinFeatureExtensions', "Features"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin ${otherCategoriesQuery}` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinThemeExtensions',
                name: (0, nls_1.localize2)('builtInThemesExtensions', "Themes"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin category:themes` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.builtinProgrammingLanguageExtensions',
                name: (0, nls_1.localize2)('builtinProgrammingLanguageExtensions', "Programming Languages"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.StaticQueryExtensionsView, [{ query: `@builtin category:"programming languages"` }]),
                when: contextkey_1.ContextKeyExpr.has('builtInExtensions'),
            });
            return viewDescriptors;
        }
        createUnsupportedWorkspaceExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedUnsupportedExtensions',
                name: (0, nls_1.localize2)('untrustedUnsupportedExtensions', "Disabled in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.untrustedPartiallySupportedExtensions',
                name: (0, nls_1.localize2)('untrustedPartiallySupportedExtensions', "Limited in Restricted Mode"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.UntrustedWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualUnsupportedExtensions',
                name: (0, nls_1.localize2)('virtualUnsupportedExtensions', "Disabled in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspaceUnsupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            viewDescriptors.push({
                id: 'workbench.views.extensions.virtualPartiallySupportedExtensions',
                name: (0, nls_1.localize2)('virtualPartiallySupportedExtensions', "Limited in Virtual Workspaces"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.VirtualWorkspacePartiallySupportedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.VirtualWorkspaceContext, SearchUnsupportedWorkspaceExtensionsContext),
            });
            return viewDescriptors;
        }
        createOtherLocalFilteredExtensionsViewDescriptors() {
            const viewDescriptors = [];
            viewDescriptors.push({
                id: 'workbench.views.extensions.deprecatedExtensions',
                name: (0, nls_1.localize2)('deprecated', "Deprecated"),
                ctorDescriptor: new descriptors_1.SyncDescriptor(extensionsViews_1.DeprecatedExtensionsView, [{}]),
                when: contextkey_1.ContextKeyExpr.and(SearchDeprecatedExtensionsContext),
            });
            return viewDescriptors;
        }
    };
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution;
    exports.ExtensionsViewletViewsContribution = ExtensionsViewletViewsContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, label_1.ILabelService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextkey_1.IContextKeyService)
    ], ExtensionsViewletViewsContribution);
    let ExtensionsViewPaneContainer = class ExtensionsViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, instantiationService, editorGroupService, extensionsWorkbenchService, extensionManagementServerService, notificationService, paneCompositeService, themeService, configurationService, storageService, contextService, contextKeyService, contextMenuService, extensionService, viewDescriptorService, preferencesService, commandService) {
            super(extensions_2.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.editorGroupService = editorGroupService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.notificationService = notificationService;
            this.paneCompositeService = paneCompositeService;
            this.contextKeyService = contextKeyService;
            this.preferencesService = preferencesService;
            this.commandService = commandService;
            this.searchDelayer = new async_1.Delayer(500);
            this.defaultViewsContextKey = exports.DefaultViewsContext.bindTo(contextKeyService);
            this.sortByContextKey = exports.ExtensionsSortByContext.bindTo(contextKeyService);
            this.searchMarketplaceExtensionsContextKey = exports.SearchMarketplaceExtensionsContext.bindTo(contextKeyService);
            this.searchHasTextContextKey = exports.SearchHasTextContext.bindTo(contextKeyService);
            this.sortByUpdateDateContextKey = SortByUpdateDateContext.bindTo(contextKeyService);
            this.installedExtensionsContextKey = InstalledExtensionsContext.bindTo(contextKeyService);
            this.searchInstalledExtensionsContextKey = SearchInstalledExtensionsContext.bindTo(contextKeyService);
            this.searchRecentlyUpdatedExtensionsContextKey = SearchRecentlyUpdatedExtensionsContext.bindTo(contextKeyService);
            this.searchExtensionUpdatesContextKey = SearchExtensionUpdatesContext.bindTo(contextKeyService);
            this.searchWorkspaceUnsupportedExtensionsContextKey = SearchUnsupportedWorkspaceExtensionsContext.bindTo(contextKeyService);
            this.searchDeprecatedExtensionsContextKey = SearchDeprecatedExtensionsContext.bindTo(contextKeyService);
            this.searchOutdatedExtensionsContextKey = SearchOutdatedExtensionsContext.bindTo(contextKeyService);
            this.searchEnabledExtensionsContextKey = SearchEnabledExtensionsContext.bindTo(contextKeyService);
            this.searchDisabledExtensionsContextKey = SearchDisabledExtensionsContext.bindTo(contextKeyService);
            this.hasInstalledExtensionsContextKey = HasInstalledExtensionsContext.bindTo(contextKeyService);
            this.builtInExtensionsContextKey = exports.BuiltInExtensionsContext.bindTo(contextKeyService);
            this.searchBuiltInExtensionsContextKey = SearchBuiltInExtensionsContext.bindTo(contextKeyService);
            this.recommendedExtensionsContextKey = exports.RecommendedExtensionsContext.bindTo(contextKeyService);
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(e => { if (e.viewContainerLocation === 0 /* ViewContainerLocation.Sidebar */) {
                this.onViewletOpen(e.composite);
            } }, this));
            this._register(extensionsWorkbenchService.onReset(() => this.refresh()));
            this.searchViewletState = this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        get searchValue() {
            return this.searchBox?.getValue();
        }
        create(parent) {
            parent.classList.add('extensions-viewlet');
            this.root = parent;
            const overlay = (0, dom_1.append)(this.root, (0, dom_1.$)('.overlay'));
            const overlayBackgroundColor = this.getColor(theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) ?? '';
            overlay.style.backgroundColor = overlayBackgroundColor;
            (0, dom_1.hide)(overlay);
            const header = (0, dom_1.append)(this.root, (0, dom_1.$)('.header'));
            const placeholder = (0, nls_1.localize)('searchExtensions', "Search Extensions in Marketplace");
            const searchValue = this.searchViewletState['query.value'] ? this.searchViewletState['query.value'] : '';
            const searchContainer = (0, dom_1.append)(header, (0, dom_1.$)('.extensions-search-container'));
            this.searchBox = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${extensions_2.VIEWLET_ID}.searchbox`, searchContainer, {
                triggerCharacters: ['@'],
                sortKey: (item) => {
                    if (item.indexOf(':') === -1) {
                        return 'a';
                    }
                    else if (/ext:/.test(item) || /id:/.test(item) || /tag:/.test(item)) {
                        return 'b';
                    }
                    else if (/sort:/.test(item)) {
                        return 'c';
                    }
                    else {
                        return 'd';
                    }
                },
                provideResults: (query) => extensionQuery_1.Query.suggestions(query)
            }, placeholder, 'extensions:searchinput', { placeholderText: placeholder, value: searchValue }));
            this.updateInstalledExtensionsContexts();
            if (this.searchBox.getValue()) {
                this.triggerSearch();
            }
            this._register(this.searchBox.onInputDidChange(() => {
                this.sortByContextKey.set(extensionQuery_1.Query.parse(this.searchBox?.getValue() ?? '').sortBy);
                this.triggerSearch();
            }, this));
            this._register(this.searchBox.onShouldFocusResults(() => this.focusListView(), this));
            const controlElement = (0, dom_1.append)(searchContainer, (0, dom_1.$)('.extensions-search-actions-container'));
            this._register(this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, controlElement, extensions_2.extensionsSearchActionsMenu, {
                toolbarOptions: {
                    primaryGroup: () => true,
                },
                actionViewItemProvider: (action, options) => (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options)
            }));
            // Register DragAndDrop support
            this._register(new dom_1.DragAndDropObserver(this.root, {
                onDragEnter: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.show)(overlay);
                    }
                },
                onDragLeave: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                    }
                },
                onDragOver: (e) => {
                    if (this.isSupportedDragElement(e)) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                },
                onDrop: async (e) => {
                    if (this.isSupportedDragElement(e)) {
                        (0, dom_1.hide)(overlay);
                        const vsixs = (0, arrays_1.coalesce)((await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractEditorsAndFilesDropData)(accessor, e)))
                            .map(editor => editor.resource && (0, resources_1.extname)(editor.resource) === '.vsix' ? editor.resource : undefined));
                        if (vsixs.length > 0) {
                            try {
                                // Attempt to install the extension(s)
                                await this.commandService.executeCommand(extensions_2.INSTALL_EXTENSION_FROM_VSIX_COMMAND_ID, vsixs);
                            }
                            catch (err) {
                                this.notificationService.error(err);
                            }
                        }
                    }
                }
            }));
            super.create((0, dom_1.append)(this.root, (0, dom_1.$)('.extensions')));
            const focusTracker = this._register((0, dom_1.trackFocus)(this.root));
            const isSearchBoxFocused = () => this.searchBox?.inputWidget.hasWidgetFocus();
            this._register((0, widgetNavigationCommands_1.registerNavigableContainer)({
                focusNotifiers: [focusTracker],
                focusNextWidget: () => {
                    if (isSearchBoxFocused()) {
                        this.focusListView();
                    }
                },
                focusPreviousWidget: () => {
                    if (!isSearchBoxFocused()) {
                        this.searchBox?.focus();
                    }
                }
            }));
        }
        focus() {
            super.focus();
            this.searchBox?.focus();
        }
        layout(dimension) {
            if (this.root) {
                this.root.classList.toggle('narrow', dimension.width <= 250);
                this.root.classList.toggle('mini', dimension.width <= 200);
            }
            this.searchBox?.layout(new dom_1.Dimension(dimension.width - 34 - /*padding*/ 8 - (24 * 2), 20));
            super.layout(new dom_1.Dimension(dimension.width, dimension.height - 41));
        }
        getOptimalWidth() {
            return 400;
        }
        search(value) {
            if (this.searchBox && this.searchBox.getValue() !== value) {
                this.searchBox.setValue(value);
            }
        }
        async refresh() {
            await this.updateInstalledExtensionsContexts();
            this.doSearch(true);
            if (this.configurationService.getValue(extensions_2.AutoCheckUpdatesConfigurationKey)) {
                this.extensionsWorkbenchService.checkForUpdates();
            }
        }
        async updateInstalledExtensionsContexts() {
            const result = await this.extensionsWorkbenchService.queryLocal();
            this.hasInstalledExtensionsContextKey.set(result.some(r => !r.isBuiltin));
        }
        triggerSearch() {
            this.searchDelayer.trigger(() => this.doSearch(), this.searchBox && this.searchBox.getValue() ? 500 : 0).then(undefined, err => this.onError(err));
        }
        normalizedQuery() {
            return this.searchBox
                ? this.searchBox.getValue()
                    .trim()
                    .replace(/@category/g, 'category')
                    .replace(/@tag:/g, 'tag:')
                    .replace(/@ext:/g, 'ext:')
                    .replace(/@featured/g, 'featured')
                    .replace(/@popular/g, this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer ? '@web' : '@popular')
                : '';
        }
        saveState() {
            const value = this.searchBox ? this.searchBox.getValue() : '';
            if (extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value)) {
                this.searchViewletState['query.value'] = value;
            }
            else {
                this.searchViewletState['query.value'] = '';
            }
            super.saveState();
        }
        doSearch(refresh) {
            const value = this.normalizedQuery();
            this.contextKeyService.bufferChangeEvents(() => {
                const isRecommendedExtensionsQuery = extensionsViews_1.ExtensionsListView.isRecommendedExtensionsQuery(value);
                this.searchHasTextContextKey.set(value.trim() !== '');
                this.installedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isInstalledExtensionsQuery(value));
                this.searchInstalledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchInstalledExtensionsQuery(value));
                this.searchRecentlyUpdatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchRecentlyUpdatedQuery(value) && !extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchOutdatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isOutdatedExtensionsQuery(value) && !extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchExtensionUpdatesContextKey.set(extensionsViews_1.ExtensionsListView.isSearchExtensionUpdatesQuery(value));
                this.searchEnabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isEnabledExtensionsQuery(value));
                this.searchDisabledExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isDisabledExtensionsQuery(value));
                this.searchBuiltInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchBuiltInExtensionsQuery(value));
                this.searchWorkspaceUnsupportedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchWorkspaceUnsupportedExtensionsQuery(value));
                this.searchDeprecatedExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isSearchDeprecatedExtensionsQuery(value));
                this.builtInExtensionsContextKey.set(extensionsViews_1.ExtensionsListView.isBuiltInExtensionsQuery(value));
                this.recommendedExtensionsContextKey.set(isRecommendedExtensionsQuery);
                this.searchMarketplaceExtensionsContextKey.set(!!value && !extensionsViews_1.ExtensionsListView.isLocalExtensionsQuery(value) && !isRecommendedExtensionsQuery);
                this.sortByUpdateDateContextKey.set(extensionsViews_1.ExtensionsListView.isSortUpdateDateQuery(value));
                this.defaultViewsContextKey.set(!value || extensionsViews_1.ExtensionsListView.isSortInstalledExtensionsQuery(value));
            });
            return this.progress(Promise.all(this.panes.map(view => view.show(this.normalizedQuery(), refresh)
                .then(model => this.alertSearchResult(model.length, view.id))))).then(() => undefined);
        }
        onDidAddViewDescriptors(added) {
            const addedViews = super.onDidAddViewDescriptors(added);
            this.progress(Promise.all(addedViews.map(addedView => addedView.show(this.normalizedQuery())
                .then(model => this.alertSearchResult(model.length, addedView.id)))));
            return addedViews;
        }
        alertSearchResult(count, viewId) {
            const view = this.viewContainerModel.visibleViewDescriptors.find(view => view.id === viewId);
            switch (count) {
                case 0:
                    break;
                case 1:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFoundInSection', "1 extension found in the {0} section.", view.name.value));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionFound', "1 extension found."));
                    }
                    break;
                default:
                    if (view) {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFoundInSection', "{0} extensions found in the {1} section.", count, view.name.value));
                    }
                    else {
                        (0, aria_1.alert)((0, nls_1.localize)('extensionsFound', "{0} extensions found.", count));
                    }
                    break;
            }
        }
        getFirstExpandedPane() {
            for (const pane of this.panes) {
                if (pane.isExpanded() && pane instanceof extensionsViews_1.ExtensionsListView) {
                    return pane;
                }
            }
            return undefined;
        }
        focusListView() {
            const pane = this.getFirstExpandedPane();
            if (pane && pane.count() > 0) {
                pane.focus();
            }
        }
        onViewletOpen(viewlet) {
            if (!viewlet || viewlet.getId() === extensions_2.VIEWLET_ID) {
                return;
            }
            if (this.configurationService.getValue(extensions_2.CloseExtensionDetailsOnViewChangeKey)) {
                const promises = this.editorGroupService.groups.map(group => {
                    const editors = group.editors.filter(input => input instanceof extensionsInput_1.ExtensionsInput);
                    return group.closeEditors(editors);
                });
                Promise.all(promises);
            }
        }
        progress(promise) {
            return this.progressService.withProgress({ location: 5 /* ProgressLocation.Extensions */ }, () => promise);
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
        isSupportedDragElement(e) {
            if (e.dataTransfer) {
                const typesLowerCase = e.dataTransfer.types.map(t => t.toLocaleLowerCase());
                return typesLowerCase.indexOf('files') !== -1;
            }
            return false;
        }
    };
    exports.ExtensionsViewPaneContainer = ExtensionsViewPaneContainer;
    exports.ExtensionsViewPaneContainer = ExtensionsViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, extensions_2.IExtensionsWorkbenchService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, notification_1.INotificationService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, themeService_1.IThemeService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, storage_1.IStorageService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, contextkey_1.IContextKeyService),
        __param(14, contextView_1.IContextMenuService),
        __param(15, extensions_1.IExtensionService),
        __param(16, views_1.IViewDescriptorService),
        __param(17, preferences_1.IPreferencesService),
        __param(18, commands_1.ICommandService)
    ], ExtensionsViewPaneContainer);
    let StatusUpdater = class StatusUpdater extends lifecycle_1.Disposable {
        constructor(activityService, extensionsWorkbenchService, extensionEnablementService) {
            super();
            this.activityService = activityService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionEnablementService = extensionEnablementService;
            this.badgeHandle = this._register(new lifecycle_1.MutableDisposable());
            this.onServiceChange();
            this._register(event_1.Event.debounce(extensionsWorkbenchService.onChange, () => undefined, 100, undefined, undefined, undefined, this._store)(this.onServiceChange, this));
        }
        onServiceChange() {
            this.badgeHandle.clear();
            const actionRequired = this.extensionsWorkbenchService.installed.filter(e => e.runtimeState !== undefined);
            const outdated = this.extensionsWorkbenchService.outdated.reduce((r, e) => r + (this.extensionEnablementService.isEnabled(e.local) && !actionRequired.includes(e) ? 1 : 0), 0);
            const newBadgeNumber = outdated + actionRequired.length;
            if (newBadgeNumber > 0) {
                let msg = '';
                if (outdated) {
                    msg += outdated === 1 ? (0, nls_1.localize)('extensionToUpdate', '{0} requires update', outdated) : (0, nls_1.localize)('extensionsToUpdate', '{0} require update', outdated);
                }
                if (outdated > 0 && actionRequired.length > 0) {
                    msg += ', ';
                }
                if (actionRequired.length) {
                    msg += actionRequired.length === 1 ? (0, nls_1.localize)('extensionToReload', '{0} requires restart', actionRequired.length) : (0, nls_1.localize)('extensionsToReload', '{0} require restart', actionRequired.length);
                }
                const badge = new activity_1.NumberBadge(newBadgeNumber, () => msg);
                this.badgeHandle.value = this.activityService.showViewContainerActivity(extensions_2.VIEWLET_ID, { badge });
            }
        }
    };
    exports.StatusUpdater = StatusUpdater;
    exports.StatusUpdater = StatusUpdater = __decorate([
        __param(0, activity_1.IActivityService),
        __param(1, extensions_2.IExtensionsWorkbenchService),
        __param(2, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], StatusUpdater);
    let MaliciousExtensionChecker = class MaliciousExtensionChecker {
        constructor(extensionsManagementService, hostService, logService, notificationService, environmentService) {
            this.extensionsManagementService = extensionsManagementService;
            this.hostService = hostService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.environmentService = environmentService;
            if (!this.environmentService.disableExtensions) {
                this.loopCheckForMaliciousExtensions();
            }
        }
        loopCheckForMaliciousExtensions() {
            this.checkForMaliciousExtensions()
                .then(() => (0, async_1.timeout)(1000 * 60 * 5)) // every five minutes
                .then(() => this.loopCheckForMaliciousExtensions());
        }
        checkForMaliciousExtensions() {
            return this.extensionsManagementService.getExtensionsControlManifest().then(extensionsControlManifest => {
                return this.extensionsManagementService.getInstalled(1 /* ExtensionType.User */).then(installed => {
                    const maliciousExtensions = installed
                        .filter(e => extensionsControlManifest.malicious.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier)));
                    if (maliciousExtensions.length) {
                        return async_1.Promises.settled(maliciousExtensions.map(e => this.extensionsManagementService.uninstall(e).then(() => {
                            this.notificationService.prompt(severity_1.default.Warning, (0, nls_1.localize)('malicious warning', "We have uninstalled '{0}' which was reported to be problematic.", e.identifier.id), [{
                                    label: (0, nls_1.localize)('reloadNow', "Reload Now"),
                                    run: () => this.hostService.reload()
                                }], {
                                sticky: true,
                                priority: notification_1.NotificationPriority.URGENT
                            });
                        })));
                    }
                    else {
                        return Promise.resolve(undefined);
                    }
                }).then(() => undefined);
            }, err => this.logService.error(err));
        }
    };
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker;
    exports.MaliciousExtensionChecker = MaliciousExtensionChecker = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, host_1.IHostService),
        __param(2, log_1.ILogService),
        __param(3, notification_1.INotificationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService)
    ], MaliciousExtensionChecker);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1ZpZXdsZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25zVmlld2xldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnRW5GLFFBQUEsbUJBQW1CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHVCQUF1QixFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hGLFFBQUEsdUJBQXVCLEdBQUcsSUFBSSwwQkFBYSxDQUFTLHVCQUF1QixFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2pGLFFBQUEsa0NBQWtDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RHLFFBQUEsb0JBQW9CLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2hHLE1BQU0sMEJBQTBCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVGLE1BQU0sZ0NBQWdDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hHLE1BQU0sc0NBQXNDLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BILE1BQU0sNkJBQTZCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xHLE1BQU0sK0JBQStCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sOEJBQThCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFD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