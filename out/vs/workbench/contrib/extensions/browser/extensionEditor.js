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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/browser/ui/toggle/toggle", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/cache", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/semver/semver", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/extensions/browser/extensionFeaturesTab", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/browser/extensionsList", "vs/workbench/contrib/extensions/browser/extensionsViewer", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/workbench/contrib/update/common/update", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/files/common/files", "vs/platform/uriIdentity/common/uriIdentity", "vs/css!./media/extensionEditor"], function (require, exports, dom_1, actionbar_1, hoverDelegateFactory_1, updatableHoverWidget_1, scrollableElement_1, toggle_1, actions_1, arrays, cache_1, cancellation_1, errors_1, event_1, lifecycle_1, network_1, platform_1, semver, types_1, uri_1, uuid_1, editorContextKeys_1, languages_1, language_1, tokenization_1, nls_1, actions_2, contextkey_1, contextView_1, extensionManagement_1, extensionManagementUtil_1, instantiation_1, notification_1, opener_1, storage_1, telemetry_1, defaultStyles_1, colorRegistry_1, themeService_1, workspace_1, editorPane_1, extensionFeaturesTab_1, extensionsActions_1, extensionsList_1, extensionsViewer_1, extensionsWidgets_1, extensions_1, files_1, markdownDocumentRenderer_1, update_1, webview_1, editorService_1, extensionRecommendations_1, extensions_2, panecomposite_1, viewsService_1, files_2, uriIdentity_1) {
    "use strict";
    var ExtensionEditor_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEditor = void 0;
    class NavBar extends lifecycle_1.Disposable {
        get onChange() { return this._onChange.event; }
        get currentId() { return this._currentId; }
        constructor(container) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this._currentId = null;
            const element = (0, dom_1.append)(container, (0, dom_1.$)('.navbar'));
            this.actions = [];
            this.actionbar = this._register(new actionbar_1.ActionBar(element));
        }
        push(id, label, tooltip) {
            const action = new actions_1.Action(id, label, undefined, true, () => this.update(id, true));
            action.tooltip = tooltip;
            this.actions.push(action);
            this.actionbar.push(action);
            if (this.actions.length === 1) {
                this.update(id);
            }
        }
        clear() {
            this.actions = (0, lifecycle_1.dispose)(this.actions);
            this.actionbar.clear();
        }
        switch(id) {
            const action = this.actions.find(action => action.id === id);
            if (action) {
                action.run();
                return true;
            }
            return false;
        }
        update(id, focus) {
            this._currentId = id;
            this._onChange.fire({ id, focus: !!focus });
            this.actions.forEach(a => a.checked = a.id === id);
        }
    }
    var WebviewIndex;
    (function (WebviewIndex) {
        WebviewIndex[WebviewIndex["Readme"] = 0] = "Readme";
        WebviewIndex[WebviewIndex["Changelog"] = 1] = "Changelog";
    })(WebviewIndex || (WebviewIndex = {}));
    const CONTEXT_SHOW_PRE_RELEASE_VERSION = new contextkey_1.RawContextKey('showPreReleaseVersion', false);
    class ExtensionWithDifferentGalleryVersionWidget extends extensionsWidgets_1.ExtensionWidget {
        constructor() {
            super(...arguments);
            this._gallery = null;
        }
        get gallery() { return this._gallery; }
        set gallery(gallery) {
            if (this.extension && gallery && !(0, extensionManagementUtil_1.areSameExtensions)(this.extension.identifier, gallery.identifier)) {
                return;
            }
            this._gallery = gallery;
            this.update();
        }
    }
    class VersionWidget extends ExtensionWithDifferentGalleryVersionWidget {
        constructor(container) {
            super();
            this.element = (0, dom_1.append)(container, (0, dom_1.$)('code.version'));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.element, (0, nls_1.localize)('extension version', "Extension Version")));
            this.render();
        }
        render() {
            if (!this.extension || !semver.valid(this.extension.version)) {
                return;
            }
            this.element.textContent = `v${this.gallery?.version ?? this.extension.version}${this.extension.isPreReleaseVersion ? ' (pre-release)' : ''}`;
        }
    }
    let ExtensionEditor = class ExtensionEditor extends editorPane_1.EditorPane {
        static { ExtensionEditor_1 = this; }
        static { this.ID = 'workbench.editor.extension'; }
        constructor(group, telemetryService, instantiationService, paneCompositeService, extensionsWorkbenchService, extensionGalleryService, themeService, notificationService, openerService, extensionRecommendationsService, storageService, extensionService, webviewService, languageService, contextMenuService, contextKeyService, contextService, explorerService, viewsService, uriIdentityService) {
            super(ExtensionEditor_1.ID, group, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.paneCompositeService = paneCompositeService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionGalleryService = extensionGalleryService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.extensionService = extensionService;
            this.webviewService = webviewService;
            this.languageService = languageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.explorerService = explorerService;
            this.viewsService = viewsService;
            this.uriIdentityService = uriIdentityService;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            // Some action bar items use a webview whose vertical scroll position we track in this map
            this.initialScrollProgress = new Map();
            // Spot when an ExtensionEditor instance gets reused for a different extension, in which case the vertical scroll positions must be zeroed
            this.currentIdentifier = '';
            this.layoutParticipants = [];
            this.contentDisposables = this._register(new lifecycle_1.DisposableStore());
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.activeElement = null;
            this.extensionReadme = null;
            this.extensionChangelog = null;
            this.extensionManifest = null;
        }
        get scopedContextKeyService() {
            return this._scopedContextKeyService.value;
        }
        createEditor(parent) {
            const root = (0, dom_1.append)(parent, (0, dom_1.$)('.extension-editor'));
            this._scopedContextKeyService.value = this.contextKeyService.createScoped(root);
            this._scopedContextKeyService.value.createKey('inExtensionEditor', true);
            this.showPreReleaseVersionContextKey = CONTEXT_SHOW_PRE_RELEASE_VERSION.bindTo(this._scopedContextKeyService.value);
            root.tabIndex = 0; // this is required for the focus tracker on the editor
            root.style.outline = 'none';
            root.setAttribute('role', 'document');
            const header = (0, dom_1.append)(root, (0, dom_1.$)('.header'));
            const iconContainer = (0, dom_1.append)(header, (0, dom_1.$)('.icon-container'));
            const icon = (0, dom_1.append)(iconContainer, (0, dom_1.$)('img.icon', { draggable: false, alt: '' }));
            const remoteBadge = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer, true);
            const details = (0, dom_1.append)(header, (0, dom_1.$)('.details'));
            const title = (0, dom_1.append)(details, (0, dom_1.$)('.title'));
            const name = (0, dom_1.append)(title, (0, dom_1.$)('span.name.clickable', { role: 'heading', tabIndex: 0 }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), name, (0, nls_1.localize)('name', "Extension name")));
            const versionWidget = new VersionWidget(title);
            const preview = (0, dom_1.append)(title, (0, dom_1.$)('span.preview'));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), preview, (0, nls_1.localize)('preview', "Preview")));
            preview.textContent = (0, nls_1.localize)('preview', "Preview");
            const builtin = (0, dom_1.append)(title, (0, dom_1.$)('span.builtin'));
            builtin.textContent = (0, nls_1.localize)('builtin', "Built-in");
            const subtitle = (0, dom_1.append)(details, (0, dom_1.$)('.subtitle'));
            const publisher = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('.publisher.clickable', { tabIndex: 0 }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), publisher, (0, nls_1.localize)('publisher', "Publisher")));
            publisher.setAttribute('role', 'button');
            const publisherDisplayName = (0, dom_1.append)(publisher, (0, dom_1.$)('.publisher-name'));
            const verifiedPublisherWidget = this.instantiationService.createInstance(extensionsWidgets_1.VerifiedPublisherWidget, (0, dom_1.append)(publisher, (0, dom_1.$)('.verified-publisher')), false);
            const resource = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry.resource')), (0, dom_1.$)('', { tabIndex: 0 }));
            resource.setAttribute('role', 'button');
            const installCount = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('span.install', { tabIndex: 0 }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), installCount, (0, nls_1.localize)('install count', "Install count")));
            const installCountWidget = this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, false);
            const rating = (0, dom_1.append)((0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')), (0, dom_1.$)('span.rating.clickable', { tabIndex: 0 }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), rating, (0, nls_1.localize)('rating', "Rating")));
            rating.setAttribute('role', 'link'); // #132645
            const ratingsWidget = this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, rating, false);
            const sponsorWidget = this.instantiationService.createInstance(extensionsWidgets_1.SponsorWidget, (0, dom_1.append)(subtitle, (0, dom_1.$)('.subtitle-entry')));
            const widgets = [
                remoteBadge,
                versionWidget,
                verifiedPublisherWidget,
                installCountWidget,
                ratingsWidget,
                sponsorWidget,
            ];
            const description = (0, dom_1.append)(details, (0, dom_1.$)('.description'));
            const installAction = this.instantiationService.createInstance(extensionsActions_1.InstallDropdownAction);
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.ExtensionRuntimeStateAction),
                this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.ActionWithDropDownAction, 'extensions.updateActions', '', [[this.instantiationService.createInstance(extensionsActions_1.UpdateAction, true)], [this.instantiationService.createInstance(extensionsActions_1.ToggleAutoUpdateForExtensionAction, true, [true, 'onlyEnabledExtensions'])]]),
                this.instantiationService.createInstance(extensionsActions_1.SetColorThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.SetProductIconThemeAction),
                this.instantiationService.createInstance(extensionsActions_1.SetLanguageAction),
                this.instantiationService.createInstance(extensionsActions_1.ClearLanguageAction),
                this.instantiationService.createInstance(extensionsActions_1.EnableDropDownAction),
                this.instantiationService.createInstance(extensionsActions_1.DisableDropDownAction),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                this.instantiationService.createInstance(extensionsActions_1.WebInstallAction),
                installAction,
                this.instantiationService.createInstance(extensionsActions_1.InstallingLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.ActionWithDropDownAction, 'extensions.uninstall', extensionsActions_1.UninstallAction.UninstallLabel, [
                    [
                        this.instantiationService.createInstance(extensionsActions_1.MigrateDeprecatedExtensionAction, false),
                        this.instantiationService.createInstance(extensionsActions_1.UninstallAction),
                        this.instantiationService.createInstance(extensionsActions_1.InstallAnotherVersionAction),
                    ]
                ]),
                this.instantiationService.createInstance(extensionsActions_1.TogglePreReleaseExtensionAction),
                this.instantiationService.createInstance(extensionsActions_1.ToggleAutoUpdateForExtensionAction, false, [false, 'onlySelectedExtensions']),
                new extensionsActions_1.ExtensionEditorManageExtensionAction(this.scopedContextKeyService || this.contextKeyService, this.instantiationService),
            ];
            const actionsAndStatusContainer = (0, dom_1.append)(details, (0, dom_1.$)('.actions-status-container'));
            const extensionActionBar = this._register(new actionbar_1.ActionBar(actionsAndStatusContainer, {
                actionViewItemProvider: (action, options) => {
                    if (action instanceof extensionsActions_1.ExtensionDropDownAction) {
                        return action.createActionViewItem(options);
                    }
                    if (action instanceof extensionsActions_1.ActionWithDropDownAction) {
                        return new extensionsActions_1.ExtensionActionWithDropdownActionViewItem(action, { ...options, icon: true, label: true, menuActionsOrProvider: { getActions: () => action.menuActions }, menuActionClassNames: (action.class || '').split(' ') }, this.contextMenuService);
                    }
                    if (action instanceof extensionsActions_1.ToggleAutoUpdateForExtensionAction) {
                        return new toggle_1.CheckboxActionViewItem(undefined, action, { ...options, icon: true, label: true, checkboxStyles: defaultStyles_1.defaultCheckboxStyles });
                    }
                    return undefined;
                },
                focusOnlyEnabledItems: true
            }));
            extensionActionBar.push(actions, { icon: true, label: true });
            extensionActionBar.setFocusable(true);
            // update focusable elements when the enablement of an action changes
            this._register(event_1.Event.any(...actions.map(a => event_1.Event.filter(a.onDidChange, e => e.enabled !== undefined)))(() => {
                extensionActionBar.setFocusable(false);
                extensionActionBar.setFocusable(true);
            }));
            const otherExtensionContainers = [];
            const extensionStatusAction = this.instantiationService.createInstance(extensionsActions_1.ExtensionStatusAction);
            const extensionStatusWidget = this._register(this.instantiationService.createInstance(extensionsWidgets_1.ExtensionStatusWidget, (0, dom_1.append)(actionsAndStatusContainer, (0, dom_1.$)('.status')), extensionStatusAction));
            otherExtensionContainers.push(extensionStatusAction, new class extends extensionsWidgets_1.ExtensionWidget {
                render() {
                    actionsAndStatusContainer.classList.toggle('list-layout', this.extension?.state === 1 /* ExtensionState.Installed */);
                }
            }());
            const recommendationWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionRecommendationWidget, (0, dom_1.append)(details, (0, dom_1.$)('.recommendation')));
            widgets.push(recommendationWidget);
            this._register(event_1.Event.any(extensionStatusWidget.onDidRender, recommendationWidget.onDidRender)(() => {
                if (this.dimension) {
                    this.layout(this.dimension);
                }
            }));
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets, ...otherExtensionContainers]);
            for (const disposable of [...actions, ...widgets, ...otherExtensionContainers, extensionContainers]) {
                this._register(disposable);
            }
            const onError = event_1.Event.chain(extensionActionBar.onDidRun, $ => $.map(({ error }) => error)
                .filter(error => !!error));
            this._register(onError(this.onError, this));
            const body = (0, dom_1.append)(root, (0, dom_1.$)('.body'));
            const navbar = new NavBar(body);
            const content = (0, dom_1.append)(body, (0, dom_1.$)('.content'));
            content.id = (0, uuid_1.generateUuid)(); // An id is needed for the webview parent flow to
            this.template = {
                builtin,
                content,
                description,
                header,
                icon,
                iconContainer,
                installCount,
                name,
                navbar,
                preview,
                publisher,
                publisherDisplayName,
                resource,
                rating,
                actionsAndStatusContainer,
                extensionActionBar,
                set extension(extension) {
                    extensionContainers.extension = extension;
                },
                set gallery(gallery) {
                    versionWidget.gallery = gallery;
                },
                set manifest(manifest) {
                    installAction.manifest = manifest;
                }
            };
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            this.updatePreReleaseVersionContext();
            if (this.template) {
                await this.render(input.extension, this.template, !!options?.preserveFocus);
            }
        }
        setOptions(options) {
            const currentOptions = this.options;
            super.setOptions(options);
            this.updatePreReleaseVersionContext();
            if (this.input && this.template && currentOptions?.showPreReleaseVersion !== options?.showPreReleaseVersion) {
                this.render(this.input.extension, this.template, !!options?.preserveFocus);
            }
        }
        updatePreReleaseVersionContext() {
            let showPreReleaseVersion = this.options?.showPreReleaseVersion;
            if ((0, types_1.isUndefined)(showPreReleaseVersion)) {
                showPreReleaseVersion = !!this.input.extension.gallery?.properties.isPreReleaseVersion;
            }
            this.showPreReleaseVersionContextKey?.set(showPreReleaseVersion);
        }
        async openTab(tab) {
            if (!this.input || !this.template) {
                return;
            }
            if (this.template.navbar.switch(tab)) {
                return;
            }
            // Fallback to Readme tab if ExtensionPack tab does not exist
            if (tab === "extensionPack" /* ExtensionEditorTab.ExtensionPack */) {
                this.template.navbar.switch("readme" /* ExtensionEditorTab.Readme */);
            }
        }
        async getGalleryVersionToShow(extension, preRelease) {
            if (extension.resourceExtension) {
                return null;
            }
            if (extension.local?.source === 'resource') {
                return null;
            }
            if ((0, types_1.isUndefined)(preRelease)) {
                return null;
            }
            if (preRelease === extension.gallery?.properties.isPreReleaseVersion) {
                return null;
            }
            if (preRelease && !extension.hasPreReleaseVersion) {
                return null;
            }
            if (!preRelease && !extension.hasReleaseVersion) {
                return null;
            }
            return (await this.extensionGalleryService.getExtensions([{ ...extension.identifier, preRelease, hasPreRelease: extension.hasPreReleaseVersion }], cancellation_1.CancellationToken.None))[0] || null;
        }
        async render(extension, template, preserveFocus) {
            this.activeElement = null;
            this.transientDisposables.clear();
            const token = this.transientDisposables.add(new cancellation_1.CancellationTokenSource()).token;
            const gallery = await this.getGalleryVersionToShow(extension, this.options?.showPreReleaseVersion);
            if (token.isCancellationRequested) {
                return;
            }
            this.extensionReadme = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getReadme(gallery, token) : extension.getReadme(token));
            this.extensionChangelog = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getChangelog(gallery, token) : extension.getChangelog(token));
            this.extensionManifest = new cache_1.Cache(() => gallery ? this.extensionGalleryService.getManifest(gallery, token) : extension.getManifest(token));
            template.extension = extension;
            template.gallery = gallery;
            template.manifest = null;
            this.transientDisposables.add((0, dom_1.addDisposableListener)(template.icon, 'error', () => template.icon.src = extension.iconUrlFallback, { once: true }));
            template.icon.src = extension.iconUrl;
            template.name.textContent = extension.displayName;
            template.name.classList.toggle('clickable', !!extension.url);
            template.name.classList.toggle('deprecated', !!extension.deprecationInfo);
            template.preview.style.display = extension.preview ? 'inherit' : 'none';
            template.builtin.style.display = extension.isBuiltin ? 'inherit' : 'none';
            template.description.textContent = extension.description;
            // subtitle
            template.publisher.classList.toggle('clickable', !!extension.url);
            template.publisherDisplayName.textContent = extension.publisherDisplayName;
            template.publisher.parentElement?.classList.toggle('hide', !!extension.resourceExtension || extension.local?.source === 'resource');
            const location = extension.resourceExtension?.location ?? (extension.local?.source === 'resource' ? extension.local?.location : undefined);
            template.resource.parentElement?.classList.toggle('hide', !location);
            if (location) {
                const workspaceFolder = this.contextService.getWorkspaceFolder(location);
                if (workspaceFolder && extension.isWorkspaceScoped) {
                    template.resource.parentElement?.classList.add('clickable');
                    this.transientDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), template.resource, this.uriIdentityService.extUri.relativePath(workspaceFolder.uri, location)));
                    template.resource.textContent = (0, nls_1.localize)('workspace extension', "Workspace Extension");
                    this.transientDisposables.add((0, extensionsWidgets_1.onClick)(template.resource, () => {
                        this.viewsService.openView(files_2.VIEW_ID, true).then(() => this.explorerService.select(location, true));
                    }));
                }
                else {
                    template.resource.parentElement?.classList.remove('clickable');
                    this.transientDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), template.resource, location.path));
                    template.resource.textContent = (0, nls_1.localize)('local extension', "Local Extension");
                }
            }
            template.installCount.parentElement?.classList.toggle('hide', !extension.url);
            template.rating.parentElement?.classList.toggle('hide', !extension.url);
            template.rating.classList.toggle('clickable', !!extension.url);
            if (extension.url) {
                this.transientDisposables.add((0, extensionsWidgets_1.onClick)(template.name, () => this.openerService.open(uri_1.URI.parse(extension.url))));
                this.transientDisposables.add((0, extensionsWidgets_1.onClick)(template.rating, () => this.openerService.open(uri_1.URI.parse(`${extension.url}&ssr=false#review-details`))));
                this.transientDisposables.add((0, extensionsWidgets_1.onClick)(template.publisher, () => {
                    this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                        .then(viewlet => viewlet?.getViewPaneContainer())
                        .then(viewlet => viewlet.search(`publisher:"${extension.publisherDisplayName}"`));
                }));
            }
            const manifest = await this.extensionManifest.get().promise;
            if (token.isCancellationRequested) {
                return;
            }
            if (manifest) {
                template.manifest = manifest;
            }
            this.renderNavbar(extension, manifest, template, preserveFocus);
            // report telemetry
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            let recommendationsData = {};
            if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                recommendationsData = { recommendationReason: extRecommendations[extension.identifier.id.toLowerCase()].reasonId };
            }
            /* __GDPR__
            "extensionGallery:openExtension" : {
                "owner": "sandy081",
                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
            */
            this.telemetryService.publicLog('extensionGallery:openExtension', { ...extension.telemetryData, ...recommendationsData });
        }
        renderNavbar(extension, manifest, template, preserveFocus) {
            template.content.innerText = '';
            template.navbar.clear();
            if (this.currentIdentifier !== extension.identifier.id) {
                this.initialScrollProgress.clear();
                this.currentIdentifier = extension.identifier.id;
            }
            template.navbar.push("readme" /* ExtensionEditorTab.Readme */, (0, nls_1.localize)('details', "Details"), (0, nls_1.localize)('detailstooltip', "Extension details, rendered from the extension's 'README.md' file"));
            if (manifest) {
                template.navbar.push("features" /* ExtensionEditorTab.Features */, (0, nls_1.localize)('features', "Features"), (0, nls_1.localize)('featurestooltip', "Lists features contributed by this extension"));
            }
            if (extension.hasChangelog()) {
                template.navbar.push("changelog" /* ExtensionEditorTab.Changelog */, (0, nls_1.localize)('changelog', "Changelog"), (0, nls_1.localize)('changelogtooltip', "Extension update history, rendered from the extension's 'CHANGELOG.md' file"));
            }
            if (extension.dependencies.length) {
                template.navbar.push("dependencies" /* ExtensionEditorTab.Dependencies */, (0, nls_1.localize)('dependencies', "Dependencies"), (0, nls_1.localize)('dependenciestooltip', "Lists extensions this extension depends on"));
            }
            if (manifest && manifest.extensionPack?.length && !this.shallRenderAsExtensionPack(manifest)) {
                template.navbar.push("extensionPack" /* ExtensionEditorTab.ExtensionPack */, (0, nls_1.localize)('extensionpack', "Extension Pack"), (0, nls_1.localize)('extensionpacktooltip', "Lists extensions those will be installed together with this extension"));
            }
            if (this.options?.tab) {
                template.navbar.switch(this.options.tab);
            }
            if (template.navbar.currentId) {
                this.onNavbarChange(extension, { id: template.navbar.currentId, focus: !preserveFocus }, template);
            }
            template.navbar.onChange(e => this.onNavbarChange(extension, e, template), this, this.transientDisposables);
        }
        clearInput() {
            this.contentDisposables.clear();
            this.transientDisposables.clear();
            super.clearInput();
        }
        focus() {
            super.focus();
            this.activeElement?.focus();
        }
        showFind() {
            this.activeWebview?.showFind();
        }
        runFindAction(previous) {
            this.activeWebview?.runFindAction(previous);
        }
        get activeWebview() {
            if (!this.activeElement || !this.activeElement.runFindAction) {
                return undefined;
            }
            return this.activeElement;
        }
        onNavbarChange(extension, { id, focus }, template) {
            this.contentDisposables.clear();
            template.content.innerText = '';
            this.activeElement = null;
            if (id) {
                const cts = new cancellation_1.CancellationTokenSource();
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                this.open(id, extension, template, cts.token)
                    .then(activeElement => {
                    if (cts.token.isCancellationRequested) {
                        return;
                    }
                    this.activeElement = activeElement;
                    if (focus) {
                        this.focus();
                    }
                });
            }
        }
        open(id, extension, template, token) {
            switch (id) {
                case "readme" /* ExtensionEditorTab.Readme */: return this.openDetails(extension, template, token);
                case "features" /* ExtensionEditorTab.Features */: return this.openFeatures(template, token);
                case "changelog" /* ExtensionEditorTab.Changelog */: return this.openChangelog(template, token);
                case "dependencies" /* ExtensionEditorTab.Dependencies */: return this.openExtensionDependencies(extension, template, token);
                case "extensionPack" /* ExtensionEditorTab.ExtensionPack */: return this.openExtensionPack(extension, template, token);
            }
            return Promise.resolve(null);
        }
        async openMarkdown(cacheResult, noContentCopy, container, webviewIndex, title, token) {
            try {
                const body = await this.renderMarkdown(cacheResult, container, token);
                if (token.isCancellationRequested) {
                    return Promise.resolve(null);
                }
                const webview = this.contentDisposables.add(this.webviewService.createWebviewOverlay({
                    title,
                    options: {
                        enableFindWidget: true,
                        tryRestoreScrollPosition: true,
                        disableServiceWorker: true,
                    },
                    contentOptions: {},
                    extension: undefined,
                }));
                webview.initialScrollProgress = this.initialScrollProgress.get(webviewIndex) || 0;
                webview.claim(this, this.window, this.scopedContextKeyService);
                (0, dom_1.setParentFlowTo)(webview.container, container);
                webview.layoutWebviewOverElement(container);
                webview.setHtml(body);
                webview.claim(this, this.window, undefined);
                this.contentDisposables.add(webview.onDidFocus(() => this._onDidFocus?.fire()));
                this.contentDisposables.add(webview.onDidScroll(() => this.initialScrollProgress.set(webviewIndex, webview.initialScrollProgress)));
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, {
                    layout: () => {
                        webview.layoutWebviewOverElement(container);
                    }
                });
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
                let isDisposed = false;
                this.contentDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.contentDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since syntax highlighting of code blocks may have changed
                    const body = await this.renderMarkdown(cacheResult, container);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        webview.setHtml(body);
                    }
                }));
                this.contentDisposables.add(webview.onDidClickLink(link => {
                    if (!link) {
                        return;
                    }
                    // Only allow links with specific schemes
                    if ((0, network_1.matchesScheme)(link, network_1.Schemas.http) || (0, network_1.matchesScheme)(link, network_1.Schemas.https) || (0, network_1.matchesScheme)(link, network_1.Schemas.mailto)) {
                        this.openerService.open(link);
                    }
                    if ((0, network_1.matchesScheme)(link, network_1.Schemas.command) && uri_1.URI.parse(link).path === update_1.ShowCurrentReleaseNotesActionId) {
                        this.openerService.open(link, { allowCommands: true }); // TODO@sandy081 use commands service
                    }
                }));
                return webview;
            }
            catch (e) {
                const p = (0, dom_1.append)(container, (0, dom_1.$)('p.nocontent'));
                p.textContent = noContentCopy;
                return p;
            }
        }
        async renderMarkdown(cacheResult, container, token) {
            const contents = await this.loadContents(() => cacheResult, container);
            if (token?.isCancellationRequested) {
                return '';
            }
            const content = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(contents, this.extensionService, this.languageService, true, false, token);
            if (token?.isCancellationRequested) {
                return '';
            }
            return this.renderBody(content);
        }
        renderBody(body) {
            const nonce = (0, uuid_1.generateUuid)();
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}

					/* prevent scroll-to-top button from blocking the body text */
					body {
						padding-bottom: 75px;
					}

					#scroll-to-top {
						position: fixed;
						width: 32px;
						height: 32px;
						right: 25px;
						bottom: 25px;
						background-color: var(--vscode-button-secondaryBackground);
						border-color: var(--vscode-button-border);
						border-radius: 50%;
						cursor: pointer;
						box-shadow: 1px 1px 1px rgba(0,0,0,.25);
						outline: none;
						display: flex;
						justify-content: center;
						align-items: center;
					}

					#scroll-to-top:hover {
						background-color: var(--vscode-button-secondaryHoverBackground);
						box-shadow: 2px 2px 2px rgba(0,0,0,.25);
					}

					body.vscode-high-contrast #scroll-to-top {
						border-width: 2px;
						border-style: solid;
						box-shadow: none;
					}

					#scroll-to-top span.icon::before {
						content: "";
						display: block;
						background: var(--vscode-button-secondaryForeground);
						/* Chevron up icon */
						webkit-mask-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7ZmlsbDpub25lO30KPC9zdHlsZT4KPHRpdGxlPnVwY2hldnJvbjwvdGl0bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik04LDUuMWwtNy4zLDcuM0wwLDExLjZsOC04bDgsOGwtMC43LDAuN0w4LDUuMXoiLz4KPHJlY3QgY2xhc3M9InN0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=');
						-webkit-mask-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7ZmlsbDpub25lO30KPC9zdHlsZT4KPHRpdGxlPnVwY2hldnJvbjwvdGl0bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik04LDUuMWwtNy4zLDcuM0wwLDExLjZsOC04bDgsOGwtMC43LDAuN0w4LDUuMXoiLz4KPHJlY3QgY2xhc3M9InN0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=');
						width: 16px;
						height: 16px;
					}
					${css}
				</style>
			</head>
			<body>
				<a id="scroll-to-top" role="button" aria-label="scroll to top" href="#"><span class="icon"></span></a>
				${body}
			</body>
		</html>`;
        }
        async openDetails(extension, template, token) {
            const details = (0, dom_1.append)(template.content, (0, dom_1.$)('.details'));
            const readmeContainer = (0, dom_1.append)(details, (0, dom_1.$)('.readme-container'));
            const additionalDetailsContainer = (0, dom_1.append)(details, (0, dom_1.$)('.additional-details-container'));
            const layout = () => details.classList.toggle('narrow', this.dimension && this.dimension.width < 500);
            layout();
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(arrays.insert(this.layoutParticipants, { layout })));
            let activeElement = null;
            const manifest = await this.extensionManifest.get().promise;
            if (manifest && manifest.extensionPack?.length && this.shallRenderAsExtensionPack(manifest)) {
                activeElement = await this.openExtensionPackReadme(manifest, readmeContainer, token);
            }
            else {
                activeElement = await this.openMarkdown(this.extensionReadme.get(), (0, nls_1.localize)('noReadme', "No README available."), readmeContainer, 0 /* WebviewIndex.Readme */, (0, nls_1.localize)('Readme title', "Readme"), token);
            }
            this.renderAdditionalDetails(additionalDetailsContainer, extension);
            return activeElement;
        }
        shallRenderAsExtensionPack(manifest) {
            return !!(manifest.categories?.some(category => category.toLowerCase() === 'extension packs'));
        }
        async openExtensionPackReadme(manifest, container, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            const extensionPackReadme = (0, dom_1.append)(container, (0, dom_1.$)('div', { class: 'extension-pack-readme' }));
            extensionPackReadme.style.margin = '0 auto';
            extensionPackReadme.style.maxWidth = '882px';
            const extensionPack = (0, dom_1.append)(extensionPackReadme, (0, dom_1.$)('div', { class: 'extension-pack' }));
            if (manifest.extensionPack.length <= 3) {
                extensionPackReadme.classList.add('one-row');
            }
            else if (manifest.extensionPack.length <= 6) {
                extensionPackReadme.classList.add('two-rows');
            }
            else if (manifest.extensionPack.length <= 9) {
                extensionPackReadme.classList.add('three-rows');
            }
            else {
                extensionPackReadme.classList.add('more-rows');
            }
            const extensionPackHeader = (0, dom_1.append)(extensionPack, (0, dom_1.$)('div.header'));
            extensionPackHeader.textContent = (0, nls_1.localize)('extension pack', "Extension Pack ({0})", manifest.extensionPack.length);
            const extensionPackContent = (0, dom_1.append)(extensionPack, (0, dom_1.$)('div', { class: 'extension-pack-content' }));
            extensionPackContent.setAttribute('tabindex', '0');
            (0, dom_1.append)(extensionPack, (0, dom_1.$)('div.footer'));
            const readmeContent = (0, dom_1.append)(extensionPackReadme, (0, dom_1.$)('div.readme-content'));
            await Promise.all([
                this.renderExtensionPack(manifest, extensionPackContent, token),
                this.openMarkdown(this.extensionReadme.get(), (0, nls_1.localize)('noReadme', "No README available."), readmeContent, 0 /* WebviewIndex.Readme */, (0, nls_1.localize)('Readme title', "Readme"), token),
            ]);
            return { focus: () => extensionPackContent.focus() };
        }
        renderAdditionalDetails(container, extension) {
            const content = (0, dom_1.$)('div', { class: 'additional-details-content', tabindex: '0' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            const layout = () => scrollableContent.scanDomNode();
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            this.contentDisposables.add(scrollableContent);
            this.renderCategories(content, extension);
            this.renderExtensionResources(content, extension);
            this.renderMoreInfo(content, extension);
            (0, dom_1.append)(container, scrollableContent.getDomNode());
            scrollableContent.scanDomNode();
        }
        renderCategories(container, extension) {
            if (extension.categories.length) {
                const categoriesContainer = (0, dom_1.append)(container, (0, dom_1.$)('.categories-container.additional-details-element'));
                (0, dom_1.append)(categoriesContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('categories', "Categories")));
                const categoriesElement = (0, dom_1.append)(categoriesContainer, (0, dom_1.$)('.categories'));
                for (const category of extension.categories) {
                    this.transientDisposables.add((0, extensionsWidgets_1.onClick)((0, dom_1.append)(categoriesElement, (0, dom_1.$)('span.category', { tabindex: '0' }, category)), () => {
                        this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                            .then(viewlet => viewlet?.getViewPaneContainer())
                            .then(viewlet => viewlet.search(`@category:"${category}"`));
                    }));
                }
            }
        }
        renderExtensionResources(container, extension) {
            const resources = [];
            if (extension.url) {
                resources.push([(0, nls_1.localize)('Marketplace', "Marketplace"), uri_1.URI.parse(extension.url)]);
            }
            if (extension.url && extension.supportUrl) {
                try {
                    resources.push([(0, nls_1.localize)('issues', "Issues"), uri_1.URI.parse(extension.supportUrl)]);
                }
                catch (error) { /* Ignore */ }
            }
            if (extension.repository) {
                try {
                    resources.push([(0, nls_1.localize)('repository', "Repository"), uri_1.URI.parse(extension.repository)]);
                }
                catch (error) { /* Ignore */ }
            }
            if (extension.url && extension.licenseUrl) {
                try {
                    resources.push([(0, nls_1.localize)('license', "License"), uri_1.URI.parse(extension.licenseUrl)]);
                }
                catch (error) { /* Ignore */ }
            }
            if (extension.publisherUrl) {
                resources.push([extension.publisherDisplayName, extension.publisherUrl]);
            }
            if (resources.length || extension.publisherSponsorLink) {
                const extensionResourcesContainer = (0, dom_1.append)(container, (0, dom_1.$)('.resources-container.additional-details-element'));
                (0, dom_1.append)(extensionResourcesContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('resources', "Resources")));
                const resourcesElement = (0, dom_1.append)(extensionResourcesContainer, (0, dom_1.$)('.resources'));
                for (const [label, uri] of resources) {
                    const resource = (0, dom_1.append)(resourcesElement, (0, dom_1.$)('a.resource', { tabindex: '0' }, label));
                    this.transientDisposables.add((0, extensionsWidgets_1.onClick)(resource, () => this.openerService.open(uri)));
                    this.transientDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), resource, uri.toString()));
                }
            }
        }
        renderMoreInfo(container, extension) {
            const gallery = extension.gallery;
            const moreInfoContainer = (0, dom_1.append)(container, (0, dom_1.$)('.more-info-container.additional-details-element'));
            (0, dom_1.append)(moreInfoContainer, (0, dom_1.$)('.additional-details-title', undefined, (0, nls_1.localize)('Marketplace Info', "More Info")));
            const moreInfo = (0, dom_1.append)(moreInfoContainer, (0, dom_1.$)('.more-info'));
            const toDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}, ${date.toLocaleTimeString(platform_1.language, { hourCycle: 'h23' })}`;
            if (gallery) {
                (0, dom_1.append)(moreInfo, (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('published', "Published")), (0, dom_1.$)('div', undefined, toDateString(new Date(gallery.releaseDate)))), (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('last released', "Last released")), (0, dom_1.$)('div', undefined, toDateString(new Date(gallery.lastUpdated)))));
            }
            if (extension.local && extension.local.installedTimestamp) {
                (0, dom_1.append)(moreInfo, (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('last updated', "Last updated")), (0, dom_1.$)('div', undefined, toDateString(new Date(extension.local.installedTimestamp)))));
            }
            (0, dom_1.append)(moreInfo, (0, dom_1.$)('.more-info-entry', undefined, (0, dom_1.$)('div', undefined, (0, nls_1.localize)('id', "Identifier")), (0, dom_1.$)('code', undefined, extension.identifier.id)));
        }
        openChangelog(template, token) {
            return this.openMarkdown(this.extensionChangelog.get(), (0, nls_1.localize)('noChangelog', "No Changelog available."), template.content, 1 /* WebviewIndex.Changelog */, (0, nls_1.localize)('Changelog title', "Changelog"), token);
        }
        async openFeatures(template, token) {
            const manifest = await this.loadContents(() => this.extensionManifest.get(), template.content);
            if (token.isCancellationRequested) {
                return null;
            }
            if (!manifest) {
                return null;
            }
            const extensionFeaturesTab = this.contentDisposables.add(this.instantiationService.createInstance(extensionFeaturesTab_1.ExtensionFeaturesTab, manifest, this.options?.feature));
            const layout = () => extensionFeaturesTab.layout(template.content.clientHeight, template.content.clientWidth);
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            (0, dom_1.append)(template.content, extensionFeaturesTab.domNode);
            layout();
            return extensionFeaturesTab.domNode;
        }
        openExtensionDependencies(extension, template, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            if (arrays.isFalsyOrEmpty(extension.dependencies)) {
                (0, dom_1.append)(template.content, (0, dom_1.$)('p.nocontent')).textContent = (0, nls_1.localize)('noDependencies', "No Dependencies");
                return Promise.resolve(template.content);
            }
            const content = (0, dom_1.$)('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            (0, dom_1.append)(template.content, scrollableContent.getDomNode());
            this.contentDisposables.add(scrollableContent);
            const dependenciesTree = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsTree, new extensionsViewer_1.ExtensionData(extension, null, extension => extension.dependencies || [], this.extensionsWorkbenchService), content, {
                listBackground: colorRegistry_1.editorBackground
            });
            const layout = () => {
                scrollableContent.scanDomNode();
                const scrollDimensions = scrollableContent.getScrollDimensions();
                dependenciesTree.layout(scrollDimensions.height);
            };
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(removeLayoutParticipant));
            this.contentDisposables.add(dependenciesTree);
            scrollableContent.scanDomNode();
            return Promise.resolve({ focus() { dependenciesTree.domFocus(); } });
        }
        async openExtensionPack(extension, template, token) {
            if (token.isCancellationRequested) {
                return Promise.resolve(null);
            }
            const manifest = await this.loadContents(() => this.extensionManifest.get(), template.content);
            if (token.isCancellationRequested) {
                return null;
            }
            if (!manifest) {
                return null;
            }
            return this.renderExtensionPack(manifest, template.content, token);
        }
        async renderExtensionPack(manifest, parent, token) {
            if (token.isCancellationRequested) {
                return null;
            }
            const content = (0, dom_1.$)('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, { useShadows: false });
            (0, dom_1.append)(parent, scrollableContent.getDomNode());
            const extensionsGridView = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsGridView, content, new extensionsList_1.Delegate());
            const extensions = await (0, extensionsViewer_1.getExtensions)(manifest.extensionPack, this.extensionsWorkbenchService);
            extensionsGridView.setExtensions(extensions);
            scrollableContent.scanDomNode();
            this.contentDisposables.add(scrollableContent);
            this.contentDisposables.add(extensionsGridView);
            this.contentDisposables.add((0, lifecycle_1.toDisposable)(arrays.insert(this.layoutParticipants, { layout: () => scrollableContent.scanDomNode() })));
            return content;
        }
        loadContents(loadingTask, container) {
            container.classList.add('loading');
            const result = this.contentDisposables.add(loadingTask());
            const onDone = () => container.classList.remove('loading');
            result.promise.then(onDone, onDone);
            return result.promise;
        }
        layout(dimension) {
            this.dimension = dimension;
            this.layoutParticipants.forEach(p => p.layout());
        }
        onError(err) {
            if ((0, errors_1.isCancellationError)(err)) {
                return;
            }
            this.notificationService.error(err);
        }
    };
    exports.ExtensionEditor = ExtensionEditor;
    exports.ExtensionEditor = ExtensionEditor = ExtensionEditor_1 = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, extensions_1.IExtensionsWorkbenchService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, themeService_1.IThemeService),
        __param(7, notification_1.INotificationService),
        __param(8, opener_1.IOpenerService),
        __param(9, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(10, storage_1.IStorageService),
        __param(11, extensions_2.IExtensionService),
        __param(12, webview_1.IWebviewService),
        __param(13, language_1.ILanguageService),
        __param(14, contextView_1.IContextMenuService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, workspace_1.IWorkspaceContextService),
        __param(17, files_1.IExplorerService),
        __param(18, viewsService_1.IViewsService),
        __param(19, uriIdentity_1.IUriIdentityService)
    ], ExtensionEditor);
    const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', ExtensionEditor.ID), editorContextKeys_1.EditorContextKeys.focus.toNegated());
    (0, actions_2.registerAction2)(class ShowExtensionEditorFindAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.showfind',
                title: (0, nls_1.localize)('find', "Find"),
                keybinding: {
                    when: contextKeyExpr,
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            extensionEditor?.showFind();
        }
    });
    (0, actions_2.registerAction2)(class StartExtensionEditorFindNextAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findNext',
                title: (0, nls_1.localize)('find next', "Find Next"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            extensionEditor?.runFindAction(false);
        }
    });
    (0, actions_2.registerAction2)(class StartExtensionEditorFindPreviousAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findPrevious',
                title: (0, nls_1.localize)('find previous', "Find Previous"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            extensionEditor?.runFindAction(true);
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a.resource { color: ${link}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content .feature-contributions a { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a.resource:hover,
			.monaco-workbench .extension-editor .content .details .additional-details-container .resources-container a.resource:active { color: ${activeLink}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content .feature-contributions a:hover,
			.monaco-workbench .extension-editor .content .feature-contributions a:active { color: ${activeLink}; }`);
        }
        const buttonHoverBackgroundColor = theme.getColor(colorRegistry_1.buttonHoverBackground);
        if (buttonHoverBackgroundColor) {
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .categories-container > .categories > .category:hover { background-color: ${buttonHoverBackgroundColor}; border-color: ${buttonHoverBackgroundColor}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .tags-container > .tags > .tag:hover { background-color: ${buttonHoverBackgroundColor}; border-color: ${buttonHoverBackgroundColor}; }`);
        }
        const buttonForegroundColor = theme.getColor(colorRegistry_1.buttonForeground);
        if (buttonForegroundColor) {
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .categories-container > .categories > .category:hover { color: ${buttonForegroundColor}; }`);
            collector.addRule(`.monaco-workbench .extension-editor .content > .details > .additional-details-container .tags-container > .tags > .tag:hover { color: ${buttonForegroundColor}; }`);
        }
    });
    function getExtensionEditor(accessor) {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof ExtensionEditor) {
            return activeEditorPane;
        }
        return null;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRWRpdG9yLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZXh0ZW5zaW9uRWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUEyRmhHLE1BQU0sTUFBTyxTQUFRLHNCQUFVO1FBRzlCLElBQUksUUFBUSxLQUFtRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUc3RixJQUFJLFNBQVMsS0FBb0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUsxRCxZQUFZLFNBQXNCO1lBQ2pDLEtBQUssRUFBRSxDQUFDO1lBVkQsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXlDLENBQUMsQ0FBQztZQUdqRixlQUFVLEdBQWtCLElBQUksQ0FBQztZQVF4QyxNQUFNLE9BQU8sR0FBRyxJQUFBLFlBQU0sRUFBQyxTQUFTLEVBQUUsSUFBQSxPQUFDLEVBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNoRCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxxQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFVLEVBQUUsS0FBYSxFQUFFLE9BQWU7WUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FB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