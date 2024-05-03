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
define(["require", "exports", "vs/base/common/semver/semver", "vs/base/common/lifecycle", "vs/workbench/contrib/extensions/common/extensions", "vs/base/browser/dom", "vs/base/common/platform", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/label/common/label", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/common/theme", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/platform/theme/common/colorRegistry", "vs/platform/hover/browser/hover", "vs/base/common/htmlContent", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/severity", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/color", "vs/base/browser/markdownRenderer", "vs/platform/opener/common/opener", "vs/base/common/errors", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/browser/keyboardEvent", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/platform/workspace/common/workspace", "vs/css!./media/extensionsWidgets"], function (require, exports, semver, lifecycle_1, extensions_1, dom_1, platform, nls_1, extensionManagement_1, extensionRecommendations_1, label_1, extensionsActions_1, themeService_1, themables_1, theme_1, event_1, instantiation_1, countBadge_1, configuration_1, userDataSync_1, extensionsIcons_1, colorRegistry_1, hover_1, htmlContent_1, uri_1, extensions_2, extensionManagementUtil_1, severity_1, updatableHoverWidget_1, color_1, markdownRenderer_1, opener_1, errors_1, iconLabels_1, keyboardEvent_1, telemetry_1, defaultStyles_1, hoverDelegateFactory_1, workspace_1) {
    "use strict";
    var ExtensionHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extensionSponsorIconColor = exports.extensionPreReleaseIconColor = exports.extensionVerifiedPublisherIconColor = exports.extensionRatingIconColor = exports.ExtensionRecommendationWidget = exports.ExtensionStatusWidget = exports.ExtensionHoverWidget = exports.ExtensionActivationStatusWidget = exports.SyncIgnoredWidget = exports.ExtensionPackCountWidget = exports.RemoteBadgeWidget = exports.PreReleaseBookmarkWidget = exports.RecommendationWidget = exports.SponsorWidget = exports.VerifiedPublisherWidget = exports.RatingsWidget = exports.InstallCountWidget = exports.ExtensionWidget = void 0;
    exports.onClick = onClick;
    class ExtensionWidget extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._extension = null;
        }
        get extension() { return this._extension; }
        set extension(extension) { this._extension = extension; this.update(); }
        update() { this.render(); }
    }
    exports.ExtensionWidget = ExtensionWidget;
    function onClick(element, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        disposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, (0, dom_1.finalHandler)(callback)));
        disposables.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.KEY_UP, e => {
            const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
            if (keyboardEvent.equals(10 /* KeyCode.Space */) || keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                e.preventDefault();
                e.stopPropagation();
                callback();
            }
        }));
        return disposables;
    }
    class InstallCountWidget extends ExtensionWidget {
        constructor(container, small) {
            super();
            this.container = container;
            this.small = small;
            container.classList.add('extension-install-count');
            this.render();
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            if (this.small && this.extension.state !== 3 /* ExtensionState.Uninstalled */) {
                return;
            }
            const installLabel = InstallCountWidget.getInstallLabel(this.extension, this.small);
            if (!installLabel) {
                return;
            }
            (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.installCountIcon)));
            const count = (0, dom_1.append)(this.container, (0, dom_1.$)('span.count'));
            count.textContent = installLabel;
        }
        static getInstallLabel(extension, small) {
            const installCount = extension.installCount;
            if (installCount === undefined) {
                return undefined;
            }
            let installLabel;
            if (small) {
                if (installCount > 1000000) {
                    installLabel = `${Math.floor(installCount / 100000) / 10}M`;
                }
                else if (installCount > 1000) {
                    installLabel = `${Math.floor(installCount / 1000)}K`;
                }
                else {
                    installLabel = String(installCount);
                }
            }
            else {
                installLabel = installCount.toLocaleString(platform.language);
            }
            return installLabel;
        }
    }
    exports.InstallCountWidget = InstallCountWidget;
    class RatingsWidget extends ExtensionWidget {
        constructor(container, small) {
            super();
            this.container = container;
            this.small = small;
            container.classList.add('extension-ratings');
            if (this.small) {
                container.classList.add('small');
            }
            this.containerHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), container, ''));
            this.render();
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            if (this.small && this.extension.state !== 3 /* ExtensionState.Uninstalled */) {
                return;
            }
            if (this.extension.rating === undefined) {
                return;
            }
            if (this.small && !this.extension.ratingCount) {
                return;
            }
            const rating = Math.round(this.extension.rating * 2) / 2;
            this.containerHover.update((0, nls_1.localize)('ratedLabel', "Average rating: {0} out of 5", rating));
            if (this.small) {
                (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starFullIcon)));
                const count = (0, dom_1.append)(this.container, (0, dom_1.$)('span.count'));
                count.textContent = String(rating);
            }
            else {
                for (let i = 1; i <= 5; i++) {
                    if (rating >= i) {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starFullIcon)));
                    }
                    else if (rating >= i - 0.5) {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starHalfIcon)));
                    }
                    else {
                        (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starEmptyIcon)));
                    }
                }
                if (this.extension.ratingCount) {
                    const ratingCountElemet = (0, dom_1.append)(this.container, (0, dom_1.$)('span', undefined, ` (${this.extension.ratingCount})`));
                    ratingCountElemet.style.paddingLeft = '1px';
                }
            }
        }
    }
    exports.RatingsWidget = RatingsWidget;
    let VerifiedPublisherWidget = class VerifiedPublisherWidget extends ExtensionWidget {
        constructor(container, small, openerService) {
            super();
            this.container = container;
            this.small = small;
            this.openerService = openerService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.containerHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), container, ''));
            this.render();
        }
        render() {
            (0, dom_1.reset)(this.container);
            this.disposables.clear();
            if (!this.extension?.publisherDomain?.verified) {
                return;
            }
            if (this.extension.resourceExtension) {
                return;
            }
            if (this.extension.local?.source === 'resource') {
                return;
            }
            const publisherDomainLink = uri_1.URI.parse(this.extension.publisherDomain.link);
            const verifiedPublisher = (0, dom_1.append)(this.container, (0, dom_1.$)('span.extension-verified-publisher.clickable'));
            (0, dom_1.append)(verifiedPublisher, (0, iconLabels_1.renderIcon)(extensionsIcons_1.verifiedPublisherIcon));
            if (!this.small) {
                verifiedPublisher.tabIndex = 0;
                this.containerHover.update(`Verified Domain: ${this.extension.publisherDomain.link}`);
                verifiedPublisher.setAttribute('role', 'link');
                (0, dom_1.append)(verifiedPublisher, (0, dom_1.$)('span.extension-verified-publisher-domain', undefined, publisherDomainLink.authority.startsWith('www.') ? publisherDomainLink.authority.substring(4) : publisherDomainLink.authority));
                this.disposables.add(onClick(verifiedPublisher, () => this.openerService.open(publisherDomainLink)));
            }
        }
    };
    exports.VerifiedPublisherWidget = VerifiedPublisherWidget;
    exports.VerifiedPublisherWidget = VerifiedPublisherWidget = __decorate([
        __param(2, opener_1.IOpenerService)
    ], VerifiedPublisherWidget);
    let SponsorWidget = class SponsorWidget extends ExtensionWidget {
        constructor(container, openerService, telemetryService) {
            super();
            this.container = container;
            this.openerService = openerService;
            this.telemetryService = telemetryService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.render();
        }
        render() {
            (0, dom_1.reset)(this.container);
            this.disposables.clear();
            if (!this.extension?.publisherSponsorLink) {
                return;
            }
            const sponsor = (0, dom_1.append)(this.container, (0, dom_1.$)('span.sponsor.clickable', { tabIndex: 0 }));
            this.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), sponsor, this.extension?.publisherSponsorLink.toString() ?? ''));
            sponsor.setAttribute('role', 'link'); // #132645
            const sponsorIconElement = (0, iconLabels_1.renderIcon)(extensionsIcons_1.sponsorIcon);
            const label = (0, dom_1.$)('span', undefined, (0, nls_1.localize)('sponsor', "Sponsor"));
            (0, dom_1.append)(sponsor, sponsorIconElement, label);
            this.disposables.add(onClick(sponsor, () => {
                this.telemetryService.publicLog2('extensionsAction.sponsorExtension', { extensionId: this.extension.identifier.id });
                this.openerService.open(this.extension.publisherSponsorLink);
            }));
        }
    };
    exports.SponsorWidget = SponsorWidget;
    exports.SponsorWidget = SponsorWidget = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, telemetry_1.ITelemetryService)
    ], SponsorWidget);
    let RecommendationWidget = class RecommendationWidget extends ExtensionWidget {
        constructor(parent, extensionRecommendationsService) {
            super();
            this.parent = parent;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => this.render()));
        }
        clear() {
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = undefined;
            this.disposables.clear();
        }
        render() {
            this.clear();
            if (!this.extension || this.extension.state === 1 /* ExtensionState.Installed */ || this.extension.deprecationInfo) {
                return;
            }
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            if (extRecommendations[this.extension.identifier.id.toLowerCase()]) {
                this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('div.extension-bookmark'));
                const recommendation = (0, dom_1.append)(this.element, (0, dom_1.$)('.recommendation'));
                (0, dom_1.append)(recommendation, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.ratingIcon)));
            }
        }
    };
    exports.RecommendationWidget = RecommendationWidget;
    exports.RecommendationWidget = RecommendationWidget = __decorate([
        __param(1, extensionRecommendations_1.IExtensionRecommendationsService)
    ], RecommendationWidget);
    class PreReleaseBookmarkWidget extends ExtensionWidget {
        constructor(parent) {
            super();
            this.parent = parent;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            if (this.element) {
                this.parent.removeChild(this.element);
            }
            this.element = undefined;
            this.disposables.clear();
        }
        render() {
            this.clear();
            if (this.extension?.state === 1 /* ExtensionState.Installed */ ? this.extension.preRelease : this.extension?.hasPreReleaseVersion) {
                this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('div.extension-bookmark'));
                const preRelease = (0, dom_1.append)(this.element, (0, dom_1.$)('.pre-release'));
                (0, dom_1.append)(preRelease, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.preReleaseIcon)));
            }
        }
    }
    exports.PreReleaseBookmarkWidget = PreReleaseBookmarkWidget;
    let RemoteBadgeWidget = class RemoteBadgeWidget extends ExtensionWidget {
        constructor(parent, tooltip, extensionManagementServerService, instantiationService) {
            super();
            this.tooltip = tooltip;
            this.extensionManagementServerService = extensionManagementServerService;
            this.instantiationService = instantiationService;
            this.remoteBadge = this._register(new lifecycle_1.MutableDisposable());
            this.element = (0, dom_1.append)(parent, (0, dom_1.$)('.extension-remote-badge-container'));
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            if (this.remoteBadge.value) {
                this.element.removeChild(this.remoteBadge.value.element);
            }
            this.remoteBadge.clear();
        }
        render() {
            this.clear();
            if (!this.extension || !this.extension.local || !this.extension.server || !(this.extensionManagementServerService.localExtensionManagementServer && this.extensionManagementServerService.remoteExtensionManagementServer) || this.extension.server !== this.extensionManagementServerService.remoteExtensionManagementServer) {
                return;
            }
            this.remoteBadge.value = this.instantiationService.createInstance(RemoteBadge, this.tooltip);
            (0, dom_1.append)(this.element, this.remoteBadge.value.element);
        }
    };
    exports.RemoteBadgeWidget = RemoteBadgeWidget;
    exports.RemoteBadgeWidget = RemoteBadgeWidget = __decorate([
        __param(2, extensionManagement_1.IExtensionManagementServerService),
        __param(3, instantiation_1.IInstantiationService)
    ], RemoteBadgeWidget);
    let RemoteBadge = class RemoteBadge extends lifecycle_1.Disposable {
        constructor(tooltip, labelService, themeService, extensionManagementServerService) {
            super();
            this.tooltip = tooltip;
            this.labelService = labelService;
            this.themeService = themeService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.element = (0, dom_1.$)('div.extension-badge.extension-remote-badge');
            this.elementHover = this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.element, ''));
            this.render();
        }
        render() {
            (0, dom_1.append)(this.element, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.remoteIcon)));
            const applyBadgeStyle = () => {
                if (!this.element) {
                    return;
                }
                const bgColor = this.themeService.getColorTheme().getColor(theme_1.EXTENSION_BADGE_REMOTE_BACKGROUND);
                const fgColor = this.themeService.getColorTheme().getColor(theme_1.EXTENSION_BADGE_REMOTE_FOREGROUND);
                this.element.style.backgroundColor = bgColor ? bgColor.toString() : '';
                this.element.style.color = fgColor ? fgColor.toString() : '';
            };
            applyBadgeStyle();
            this._register(this.themeService.onDidColorThemeChange(() => applyBadgeStyle()));
            if (this.tooltip) {
                const updateTitle = () => {
                    if (this.element && this.extensionManagementServerService.remoteExtensionManagementServer) {
                        this.elementHover.update((0, nls_1.localize)('remote extension title', "Extension in {0}", this.extensionManagementServerService.remoteExtensionManagementServer.label));
                    }
                };
                this._register(this.labelService.onDidChangeFormatters(() => updateTitle()));
                updateTitle();
            }
        }
    };
    RemoteBadge = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, themeService_1.IThemeService),
        __param(3, extensionManagement_1.IExtensionManagementServerService)
    ], RemoteBadge);
    class ExtensionPackCountWidget extends ExtensionWidget {
        constructor(parent) {
            super();
            this.parent = parent;
            this.render();
            this._register((0, lifecycle_1.toDisposable)(() => this.clear()));
        }
        clear() {
            this.element?.remove();
        }
        render() {
            this.clear();
            if (!this.extension || !(this.extension.categories?.some(category => category.toLowerCase() === 'extension packs')) || !this.extension.extensionPack.length) {
                return;
            }
            this.element = (0, dom_1.append)(this.parent, (0, dom_1.$)('.extension-badge.extension-pack-badge'));
            const countBadge = new countBadge_1.CountBadge(this.element, {}, defaultStyles_1.defaultCountBadgeStyles);
            countBadge.setCount(this.extension.extensionPack.length);
        }
    }
    exports.ExtensionPackCountWidget = ExtensionPackCountWidget;
    let SyncIgnoredWidget = class SyncIgnoredWidget extends ExtensionWidget {
        constructor(container, configurationService, extensionsWorkbenchService, userDataSyncEnablementService) {
            super();
            this.container = container;
            this.configurationService = configurationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.ignoredExtensions'))(() => this.render()));
            this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.update()));
            this.render();
        }
        render() {
            this.disposables.clear();
            this.container.innerText = '';
            if (this.extension && this.extension.state === 1 /* ExtensionState.Installed */ && this.userDataSyncEnablementService.isEnabled() && this.extensionsWorkbenchService.isExtensionIgnoredToSync(this.extension)) {
                const element = (0, dom_1.append)(this.container, (0, dom_1.$)('span.extension-sync-ignored' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.syncIgnoredIcon)));
                this.disposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), element, (0, nls_1.localize)('syncingore.label', "This extension is ignored during sync.")));
                element.classList.add(...themables_1.ThemeIcon.asClassNameArray(extensionsIcons_1.syncIgnoredIcon));
            }
        }
    };
    exports.SyncIgnoredWidget = SyncIgnoredWidget;
    exports.SyncIgnoredWidget = SyncIgnoredWidget = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService)
    ], SyncIgnoredWidget);
    let ExtensionActivationStatusWidget = class ExtensionActivationStatusWidget extends ExtensionWidget {
        constructor(container, small, extensionService, extensionsWorkbenchService) {
            super();
            this.container = container;
            this.small = small;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this._register(extensionService.onDidChangeExtensionsStatus(extensions => {
                if (this.extension && extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)({ id: e.value }, this.extension.identifier))) {
                    this.update();
                }
            }));
        }
        render() {
            this.container.innerText = '';
            if (!this.extension) {
                return;
            }
            const extensionStatus = this.extensionsWorkbenchService.getExtensionStatus(this.extension);
            if (!extensionStatus || !extensionStatus.activationTimes) {
                return;
            }
            const activationTime = extensionStatus.activationTimes.codeLoadingTime + extensionStatus.activationTimes.activateCallTime;
            if (this.small) {
                (0, dom_1.append)(this.container, (0, dom_1.$)('span' + themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.activationTimeIcon)));
                const activationTimeElement = (0, dom_1.append)(this.container, (0, dom_1.$)('span.activationTime'));
                activationTimeElement.textContent = `${activationTime}ms`;
            }
            else {
                const activationTimeElement = (0, dom_1.append)(this.container, (0, dom_1.$)('span.activationTime'));
                activationTimeElement.textContent = `${(0, nls_1.localize)('activation', "Activation time")}${extensionStatus.activationTimes.activationReason.startup ? ` (${(0, nls_1.localize)('startup', "Startup")})` : ''} : ${activationTime}ms`;
            }
        }
    };
    exports.ExtensionActivationStatusWidget = ExtensionActivationStatusWidget;
    exports.ExtensionActivationStatusWidget = ExtensionActivationStatusWidget = __decorate([
        __param(2, extensions_2.IExtensionService),
        __param(3, extensions_1.IExtensionsWorkbenchService)
    ], ExtensionActivationStatusWidget);
    let ExtensionHoverWidget = ExtensionHoverWidget_1 = class ExtensionHoverWidget extends ExtensionWidget {
        constructor(options, extensionStatusAction, extensionsWorkbenchService, hoverService, configurationService, extensionRecommendationsService, themeService, contextService) {
            super();
            this.options = options;
            this.extensionStatusAction = extensionStatusAction;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.hoverService = hoverService;
            this.configurationService = configurationService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.themeService = themeService;
            this.contextService = contextService;
            this.hover = this._register(new lifecycle_1.MutableDisposable());
        }
        render() {
            this.hover.value = undefined;
            if (this.extension) {
                this.hover.value = (0, updatableHoverWidget_1.setupCustomHover)({
                    delay: this.configurationService.getValue('workbench.hover.delay'),
                    showHover: (options) => {
                        return this.hoverService.showHover({
                            ...options,
                            additionalClasses: ['extension-hover'],
                            position: {
                                hoverPosition: this.options.position(),
                                forcePosition: true,
                            },
                        });
                    },
                    placement: 'element'
                }, this.options.target, { markdown: () => Promise.resolve(this.getHoverMarkdown()), markdownNotSupportedFallback: undefined });
            }
        }
        getHoverMarkdown() {
            if (!this.extension) {
                return undefined;
            }
            const markdown = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
            markdown.appendMarkdown(`**${this.extension.displayName}**`);
            if (semver.valid(this.extension.version)) {
                markdown.appendMarkdown(`&nbsp;<span style="background-color:#8080802B;">**&nbsp;_v${this.extension.version}${(this.extension.isPreReleaseVersion ? ' (pre-release)' : '')}_**&nbsp;</span>`);
            }
            markdown.appendText(`\n`);
            if (this.extension.state === 1 /* ExtensionState.Installed */) {
                let addSeparator = false;
                const installLabel = InstallCountWidget.getInstallLabel(this.extension, true);
                if (installLabel) {
                    if (addSeparator) {
                        markdown.appendText(`  |  `);
                    }
                    markdown.appendMarkdown(`$(${extensionsIcons_1.installCountIcon.id}) ${installLabel}`);
                    addSeparator = true;
                }
                if (this.extension.rating) {
                    if (addSeparator) {
                        markdown.appendText(`  |  `);
                    }
                    const rating = Math.round(this.extension.rating * 2) / 2;
                    markdown.appendMarkdown(`$(${extensionsIcons_1.starFullIcon.id}) [${rating}](${this.extension.url}&ssr=false#review-details)`);
                    addSeparator = true;
                }
                if (this.extension.publisherSponsorLink) {
                    if (addSeparator) {
                        markdown.appendText(`  |  `);
                    }
                    markdown.appendMarkdown(`$(${extensionsIcons_1.sponsorIcon.id}) [${(0, nls_1.localize)('sponsor', "Sponsor")}](${this.extension.publisherSponsorLink})`);
                    addSeparator = true;
                }
                if (addSeparator) {
                    markdown.appendText(`\n`);
                }
            }
            const location = this.extension.resourceExtension?.location ?? (this.extension.local?.source === 'resource' ? this.extension.local?.location : undefined);
            if (location) {
                if (this.extension.isWorkspaceScoped && this.contextService.isInsideWorkspace(location)) {
                    markdown.appendMarkdown((0, nls_1.localize)('workspace extension', "Workspace Extension"));
                }
                else {
                    markdown.appendMarkdown((0, nls_1.localize)('local extension', "Local Extension"));
                }
                markdown.appendText(`\n`);
            }
            if (this.extension.description) {
                markdown.appendMarkdown(`${this.extension.description}`);
                markdown.appendText(`\n`);
            }
            if (this.extension.publisherDomain?.verified) {
                const bgColor = this.themeService.getColorTheme().getColor(exports.extensionVerifiedPublisherIconColor);
                const publisherVerifiedTooltip = (0, nls_1.localize)('publisher verified tooltip', "This publisher has verified ownership of {0}", `[${uri_1.URI.parse(this.extension.publisherDomain.link).authority}](${this.extension.publisherDomain.link})`);
                markdown.appendMarkdown(`<span style="color:${bgColor ? color_1.Color.Format.CSS.formatHex(bgColor) : '#ffffff'};">$(${extensionsIcons_1.verifiedPublisherIcon.id})</span>&nbsp;${publisherVerifiedTooltip}`);
                markdown.appendText(`\n`);
            }
            if (this.extension.outdated) {
                markdown.appendMarkdown((0, nls_1.localize)('updateRequired', "Latest version:"));
                markdown.appendMarkdown(`&nbsp;<span style="background-color:#8080802B;">**&nbsp;_v${this.extension.latestVersion}_**&nbsp;</span>`);
                markdown.appendText(`\n`);
            }
            const preReleaseMessage = ExtensionHoverWidget_1.getPreReleaseMessage(this.extension);
            const extensionRuntimeStatus = this.extensionsWorkbenchService.getExtensionStatus(this.extension);
            const extensionStatus = this.extensionStatusAction.status;
            const runtimeState = this.extension.runtimeState;
            const recommendationMessage = this.getRecommendationMessage(this.extension);
            if (extensionRuntimeStatus || extensionStatus || runtimeState || recommendationMessage || preReleaseMessage) {
                markdown.appendMarkdown(`---`);
                markdown.appendText(`\n`);
                if (extensionRuntimeStatus) {
                    if (extensionRuntimeStatus.activationTimes) {
                        const activationTime = extensionRuntimeStatus.activationTimes.codeLoadingTime + extensionRuntimeStatus.activationTimes.activateCallTime;
                        markdown.appendMarkdown(`${(0, nls_1.localize)('activation', "Activation time")}${extensionRuntimeStatus.activationTimes.activationReason.startup ? ` (${(0, nls_1.localize)('startup', "Startup")})` : ''}: \`${activationTime}ms\``);
                        markdown.appendText(`\n`);
                    }
                    if (extensionRuntimeStatus.runtimeErrors.length || extensionRuntimeStatus.messages.length) {
                        const hasErrors = extensionRuntimeStatus.runtimeErrors.length || extensionRuntimeStatus.messages.some(message => message.type === severity_1.default.Error);
                        const hasWarnings = extensionRuntimeStatus.messages.some(message => message.type === severity_1.default.Warning);
                        const errorsLink = extensionRuntimeStatus.runtimeErrors.length ? `[${extensionRuntimeStatus.runtimeErrors.length === 1 ? (0, nls_1.localize)('uncaught error', '1 uncaught error') : (0, nls_1.localize)('uncaught errors', '{0} uncaught errors', extensionRuntimeStatus.runtimeErrors.length)}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "features" /* ExtensionEditorTab.Features */]))}`)})` : undefined;
                        const messageLink = extensionRuntimeStatus.messages.length ? `[${extensionRuntimeStatus.messages.length === 1 ? (0, nls_1.localize)('message', '1 message') : (0, nls_1.localize)('messages', '{0} messages', extensionRuntimeStatus.messages.length)}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "features" /* ExtensionEditorTab.Features */]))}`)})` : undefined;
                        markdown.appendMarkdown(`$(${hasErrors ? extensionsIcons_1.errorIcon.id : hasWarnings ? extensionsIcons_1.warningIcon.id : extensionsIcons_1.infoIcon.id}) This extension has reported `);
                        if (errorsLink && messageLink) {
                            markdown.appendMarkdown(`${errorsLink} and ${messageLink}`);
                        }
                        else {
                            markdown.appendMarkdown(`${errorsLink || messageLink}`);
                        }
                        markdown.appendText(`\n`);
                    }
                }
                if (extensionStatus) {
                    if (extensionStatus.icon) {
                        markdown.appendMarkdown(`$(${extensionStatus.icon.id})&nbsp;`);
                    }
                    markdown.appendMarkdown(extensionStatus.message.value);
                    if (this.extension.enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.extension.local) {
                        markdown.appendMarkdown(`&nbsp;[${(0, nls_1.localize)('dependencies', "Show Dependencies")}](${uri_1.URI.parse(`command:extension.open?${encodeURIComponent(JSON.stringify([this.extension.identifier.id, "dependencies" /* ExtensionEditorTab.Dependencies */]))}`)})`);
                    }
                    markdown.appendText(`\n`);
                }
                if (runtimeState) {
                    markdown.appendMarkdown(`$(${extensionsIcons_1.infoIcon.id})&nbsp;`);
                    markdown.appendMarkdown(`${runtimeState.reason}`);
                    markdown.appendText(`\n`);
                }
                if (preReleaseMessage) {
                    const extensionPreReleaseIcon = this.themeService.getColorTheme().getColor(exports.extensionPreReleaseIconColor);
                    markdown.appendMarkdown(`<span style="color:${extensionPreReleaseIcon ? color_1.Color.Format.CSS.formatHex(extensionPreReleaseIcon) : '#ffffff'};">$(${extensionsIcons_1.preReleaseIcon.id})</span>&nbsp;${preReleaseMessage}`);
                    markdown.appendText(`\n`);
                }
                if (recommendationMessage) {
                    markdown.appendMarkdown(recommendationMessage);
                    markdown.appendText(`\n`);
                }
            }
            return markdown;
        }
        getRecommendationMessage(extension) {
            if (extension.state === 1 /* ExtensionState.Installed */) {
                return undefined;
            }
            if (extension.deprecationInfo) {
                return undefined;
            }
            const recommendation = this.extensionRecommendationsService.getAllRecommendationsWithReason()[extension.identifier.id.toLowerCase()];
            if (!recommendation?.reasonText) {
                return undefined;
            }
            const bgColor = this.themeService.getColorTheme().getColor(extensionsActions_1.extensionButtonProminentBackground);
            return `<span style="color:${bgColor ? color_1.Color.Format.CSS.formatHex(bgColor) : '#ffffff'};">$(${extensionsIcons_1.starEmptyIcon.id})</span>&nbsp;${recommendation.reasonText}`;
        }
        static getPreReleaseMessage(extension) {
            if (!extension.hasPreReleaseVersion) {
                return undefined;
            }
            if (extension.isBuiltin) {
                return undefined;
            }
            if (extension.isPreReleaseVersion) {
                return undefined;
            }
            if (extension.preRelease) {
                return undefined;
            }
            const preReleaseVersionLink = `[${(0, nls_1.localize)('Show prerelease version', "Pre-Release version")}](${uri_1.URI.parse(`command:workbench.extensions.action.showPreReleaseVersion?${encodeURIComponent(JSON.stringify([extension.identifier.id]))}`)})`;
            return (0, nls_1.localize)('has prerelease', "This extension has a {0} available", preReleaseVersionLink);
        }
    };
    exports.ExtensionHoverWidget = ExtensionHoverWidget;
    exports.ExtensionHoverWidget = ExtensionHoverWidget = ExtensionHoverWidget_1 = __decorate([
        __param(2, extensions_1.IExtensionsWorkbenchService),
        __param(3, hover_1.IHoverService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(6, themeService_1.IThemeService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], ExtensionHoverWidget);
    let ExtensionStatusWidget = class ExtensionStatusWidget extends ExtensionWidget {
        constructor(container, extensionStatusAction, openerService) {
            super();
            this.container = container;
            this.extensionStatusAction = extensionStatusAction;
            this.openerService = openerService;
            this.renderDisposables = this._register(new lifecycle_1.MutableDisposable());
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.render();
            this._register(extensionStatusAction.onDidChangeStatus(() => this.render()));
        }
        render() {
            (0, dom_1.reset)(this.container);
            this.renderDisposables.value = undefined;
            const disposables = new lifecycle_1.DisposableStore();
            this.renderDisposables.value = disposables;
            const extensionStatus = this.extensionStatusAction.status;
            if (extensionStatus) {
                const markdown = new htmlContent_1.MarkdownString('', { isTrusted: true, supportThemeIcons: true });
                if (extensionStatus.icon) {
                    markdown.appendMarkdown(`$(${extensionStatus.icon.id})&nbsp;`);
                }
                markdown.appendMarkdown(extensionStatus.message.value);
                const rendered = disposables.add((0, markdownRenderer_1.renderMarkdown)(markdown, {
                    actionHandler: {
                        callback: (content) => {
                            this.openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                        },
                        disposables
                    }
                }));
                (0, dom_1.append)(this.container, rendered.element);
            }
            this._onDidRender.fire();
        }
    };
    exports.ExtensionStatusWidget = ExtensionStatusWidget;
    exports.ExtensionStatusWidget = ExtensionStatusWidget = __decorate([
        __param(2, opener_1.IOpenerService)
    ], ExtensionStatusWidget);
    let ExtensionRecommendationWidget = class ExtensionRecommendationWidget extends ExtensionWidget {
        constructor(container, extensionRecommendationsService, extensionIgnoredRecommendationsService) {
            super();
            this.container = container;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this._onDidRender = this._register(new event_1.Emitter());
            this.onDidRender = this._onDidRender.event;
            this.render();
            this._register(this.extensionRecommendationsService.onDidChangeRecommendations(() => this.render()));
        }
        render() {
            (0, dom_1.reset)(this.container);
            const recommendationStatus = this.getRecommendationStatus();
            if (recommendationStatus) {
                if (recommendationStatus.icon) {
                    (0, dom_1.append)(this.container, (0, dom_1.$)(`div${themables_1.ThemeIcon.asCSSSelector(recommendationStatus.icon)}`));
                }
                (0, dom_1.append)(this.container, (0, dom_1.$)(`div.recommendation-text`, undefined, recommendationStatus.message));
            }
            this._onDidRender.fire();
        }
        getRecommendationStatus() {
            if (!this.extension
                || this.extension.deprecationInfo
                || this.extension.state === 1 /* ExtensionState.Installed */) {
                return undefined;
            }
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            if (extRecommendations[this.extension.identifier.id.toLowerCase()]) {
                const reasonText = extRecommendations[this.extension.identifier.id.toLowerCase()].reasonText;
                if (reasonText) {
                    return { icon: extensionsIcons_1.starEmptyIcon, message: reasonText };
                }
            }
            else if (this.extensionIgnoredRecommendationsService.globalIgnoredRecommendations.indexOf(this.extension.identifier.id.toLowerCase()) !== -1) {
                return { icon: undefined, message: (0, nls_1.localize)('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.") };
            }
            return undefined;
        }
    };
    exports.ExtensionRecommendationWidget = ExtensionRecommendationWidget;
    exports.ExtensionRecommendationWidget = ExtensionRecommendationWidget = __decorate([
        __param(1, extensionRecommendations_1.IExtensionRecommendationsService),
        __param(2, extensionRecommendations_1.IExtensionIgnoredRecommendationsService)
    ], ExtensionRecommendationWidget);
    exports.extensionRatingIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.starForeground', { light: '#DF6100', dark: '#FF8E00', hcDark: '#FF8E00', hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionIconStarForeground', "The icon color for extension ratings."), true);
    exports.extensionVerifiedPublisherIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.verifiedForeground', { dark: colorRegistry_1.textLinkForeground, light: colorRegistry_1.textLinkForeground, hcDark: colorRegistry_1.textLinkForeground, hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionIconVerifiedForeground', "The icon color for extension verified publisher."), true);
    exports.extensionPreReleaseIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.preReleaseForeground', { dark: '#1d9271', light: '#1d9271', hcDark: '#1d9271', hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('extensionPreReleaseForeground', "The icon color for pre-release extension."), true);
    exports.extensionSponsorIconColor = (0, colorRegistry_1.registerColor)('extensionIcon.sponsorForeground', { light: '#B51E78', dark: '#D758B3', hcDark: null, hcLight: '#B51E78' }, (0, nls_1.localize)('extensionIcon.sponsorForeground', "The icon color for extension sponsor."), true);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const extensionRatingIcon = theme.getColor(exports.extensionRatingIconColor);
        if (extensionRatingIcon) {
            collector.addRule(`.extension-ratings .codicon-extensions-star-full, .extension-ratings .codicon-extensions-star-half { color: ${extensionRatingIcon}; }`);
            collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.starFullIcon)} { color: ${extensionRatingIcon}; }`);
        }
        const extensionVerifiedPublisherIcon = theme.getColor(exports.extensionVerifiedPublisherIconColor);
        if (extensionVerifiedPublisherIcon) {
            collector.addRule(`${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.verifiedPublisherIcon)} { color: ${extensionVerifiedPublisherIcon}; }`);
        }
        collector.addRule(`.monaco-hover.extension-hover .markdown-hover .hover-contents ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.sponsorIcon)} { color: var(--vscode-extensionIcon-sponsorForeground); }`);
        collector.addRule(`.extension-editor > .header > .details > .subtitle .sponsor ${themables_1.ThemeIcon.asCSSSelector(extensionsIcons_1.sponsorIcon)} { color: var(--vscode-extensionIcon-sponsorForeground); }`);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uc1dpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9leHRlbnNpb25zV2lkZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbURoRywwQkFZQztJQXBCRCxNQUFzQixlQUFnQixTQUFRLHNCQUFVO1FBQXhEOztZQUNTLGVBQVUsR0FBc0IsSUFBSSxDQUFDO1FBSzlDLENBQUM7UUFKQSxJQUFJLFNBQVMsS0FBd0IsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUM5RCxJQUFJLFNBQVMsQ0FBQyxTQUE0QixJQUFJLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRixNQUFNLEtBQVcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztLQUVqQztJQU5ELDBDQU1DO0lBRUQsU0FBZ0IsT0FBTyxDQUFDLE9BQW9CLEVBQUUsUUFBb0I7UUFDakUsTUFBTSxXQUFXLEdBQW9CLElBQUksMkJBQWUsRUFBRSxDQUFDO1FBQzNELFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxPQUFPLEVBQUUsZUFBUyxDQUFDLEtBQUssRUFBRSxJQUFBLGtCQUFZLEVBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3pGLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSwyQkFBcUIsRUFBQyxPQUFPLEVBQUUsZUFBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRTtZQUNwRSxNQUFNLGFBQWEsR0FBRyxJQUFJLHFDQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQUks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