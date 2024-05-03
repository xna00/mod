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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/base/common/severity", "vs/platform/storage/common/storage", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/localization/electron-sandbox/minimalTranslations", "vs/platform/telemetry/common/telemetry", "vs/base/common/cancellation", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/localization/common/locale", "vs/platform/product/common/productService", "vs/workbench/contrib/localization/common/localization.contribution"], function (require, exports, nls_1, platform_1, contributions_1, platform, extensionManagement_1, notification_1, severity_1, storage_1, extensions_1, minimalTranslations_1, telemetry_1, cancellation_1, panecomposite_1, locale_1, productService_1, localization_contribution_1) {
    "use strict";
    var NativeLocalizationWorkbenchContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeLocalizationWorkbenchContribution = class NativeLocalizationWorkbenchContribution extends localization_contribution_1.BaseLocalizationWorkbenchContribution {
        static { NativeLocalizationWorkbenchContribution_1 = this; }
        static { this.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY = 'extensionsAssistant/languagePackSuggestionIgnore'; }
        constructor(notificationService, localeService, productService, storageService, extensionManagementService, galleryService, paneCompositeService, telemetryService) {
            super();
            this.notificationService = notificationService;
            this.localeService = localeService;
            this.productService = productService;
            this.storageService = storageService;
            this.extensionManagementService = extensionManagementService;
            this.galleryService = galleryService;
            this.paneCompositeService = paneCompositeService;
            this.telemetryService = telemetryService;
            this.checkAndInstall();
            this._register(this.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(this.extensionManagementService.onDidUninstallExtension(e => this.onDidUninstallExtension(e)));
        }
        async onDidInstallExtensions(results) {
            for (const result of results) {
                if (result.operation === 2 /* InstallOperation.Install */ && result.local) {
                    await this.onDidInstallExtension(result.local, !!result.context?.extensionsSync);
                }
            }
        }
        async onDidInstallExtension(localExtension, fromSettingsSync) {
            const localization = localExtension.manifest.contributes?.localizations?.[0];
            if (!localization || platform.language === localization.languageId) {
                return;
            }
            const { languageId, languageName } = localization;
            this.notificationService.prompt(severity_1.default.Info, (0, nls_1.localize)('updateLocale', "Would you like to change {0}'s display language to {1} and restart?", this.productService.nameLong, languageName || languageId), [{
                    label: (0, nls_1.localize)('changeAndRestart', "Change Language and Restart"),
                    run: async () => {
                        await this.localeService.setLocale({
                            id: languageId,
                            label: languageName ?? languageId,
                            extensionId: localExtension.identifier.id,
                            // If settings sync installs the language pack, then we would have just shown the notification so no
                            // need to show the dialog.
                        }, true);
                    }
                }], {
                sticky: true,
                neverShowAgain: { id: 'langugage.update.donotask', isSecondary: true, scope: notification_1.NeverShowAgainScope.APPLICATION }
            });
        }
        async onDidUninstallExtension(_event) {
            if (!await this.isLocaleInstalled(platform.language)) {
                this.localeService.setLocale({
                    id: 'en',
                    label: 'English'
                });
            }
        }
        async checkAndInstall() {
            const language = platform.language;
            let locale = platform.locale ?? '';
            const languagePackSuggestionIgnoreList = JSON.parse(this.storageService.get(NativeLocalizationWorkbenchContribution_1.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY, -1 /* StorageScope.APPLICATION */, '[]'));
            if (!this.galleryService.isEnabled()) {
                return;
            }
            if (!language || !locale || locale === 'en' || locale.indexOf('en-') === 0) {
                return;
            }
            if (locale.startsWith(language) || languagePackSuggestionIgnoreList.includes(locale)) {
                return;
            }
            const installed = await this.isLocaleInstalled(locale);
            if (installed) {
                return;
            }
            const fullLocale = locale;
            let tagResult = await this.galleryService.query({ text: `tag:lp-${locale}` }, cancellation_1.CancellationToken.None);
            if (tagResult.total === 0) {
                // Trim the locale and try again.
                locale = locale.split('-')[0];
                tagResult = await this.galleryService.query({ text: `tag:lp-${locale}` }, cancellation_1.CancellationToken.None);
                if (tagResult.total === 0) {
                    return;
                }
            }
            const extensionToInstall = tagResult.total === 1 ? tagResult.firstPage[0] : tagResult.firstPage.find(e => e.publisher === 'MS-CEINTL' && e.name.startsWith('vscode-language-pack'));
            const extensionToFetchTranslationsFrom = extensionToInstall ?? tagResult.firstPage[0];
            if (!extensionToFetchTranslationsFrom.assets.manifest) {
                return;
            }
            const [manifest, translation] = await Promise.all([
                this.galleryService.getManifest(extensionToFetchTranslationsFrom, cancellation_1.CancellationToken.None),
                this.galleryService.getCoreTranslation(extensionToFetchTranslationsFrom, locale)
            ]);
            const loc = manifest?.contributes?.localizations?.find(x => locale.startsWith(x.languageId.toLowerCase()));
            const languageName = loc ? (loc.languageName || locale) : locale;
            const languageDisplayName = loc ? (loc.localizedLanguageName || loc.languageName || locale) : locale;
            const translationsFromPack = translation?.contents?.['vs/workbench/contrib/localization/electron-sandbox/minimalTranslations'] ?? {};
            const promptMessageKey = extensionToInstall ? 'installAndRestartMessage' : 'showLanguagePackExtensions';
            const useEnglish = !translationsFromPack[promptMessageKey];
            const translations = {};
            Object.keys(minimalTranslations_1.minimumTranslatedStrings).forEach(key => {
                if (!translationsFromPack[key] || useEnglish) {
                    translations[key] = minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', () => languageName);
                }
                else {
                    translations[key] = `${translationsFromPack[key].replace('{0}', () => languageDisplayName)} (${minimalTranslations_1.minimumTranslatedStrings[key].replace('{0}', () => languageName)})`;
                }
            });
            const logUserReaction = (userReaction) => {
                /* __GDPR__
                    "languagePackSuggestion:popup" : {
                        "owner": "TylerLeonhardt",
                        "userReaction" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "language": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('languagePackSuggestion:popup', { userReaction, language: locale });
            };
            const searchAction = {
                label: translations['searchMarketplace'],
                run: async () => {
                    logUserReaction('search');
                    const viewlet = await this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                    if (!viewlet) {
                        return;
                    }
                    const container = viewlet.getViewPaneContainer();
                    if (!container) {
                        return;
                    }
                    container.search(`tag:lp-${locale}`);
                    container.focus();
                }
            };
            const installAndRestartAction = {
                label: translations['installAndRestart'],
                run: async () => {
                    logUserReaction('installAndRestart');
                    await this.localeService.setLocale({
                        id: locale,
                        label: languageName,
                        extensionId: extensionToInstall?.identifier.id,
                        galleryExtension: extensionToInstall
                        // The user will be prompted if they want to install the language pack before this.
                    }, true);
                }
            };
            const promptMessage = translations[promptMessageKey];
            this.notificationService.prompt(severity_1.default.Info, promptMessage, [extensionToInstall ? installAndRestartAction : searchAction,
                {
                    label: (0, nls_1.localize)('neverAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        languagePackSuggestionIgnoreList.push(fullLocale);
                        this.storageService.store(NativeLocalizationWorkbenchContribution_1.LANGUAGEPACK_SUGGESTION_IGNORE_STORAGE_KEY, JSON.stringify(languagePackSuggestionIgnoreList), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
                        logUserReaction('neverShowAgain');
                    }
                }], {
                onCancel: () => {
                    logUserReaction('cancelled');
                }
            });
        }
        async isLocaleInstalled(locale) {
            const installed = await this.extensionManagementService.getInstalled();
            return installed.some(i => !!i.manifest.contributes?.localizations?.length
                && i.manifest.contributes.localizations.some(l => locale.startsWith(l.languageId.toLowerCase())));
        }
    };
    NativeLocalizationWorkbenchContribution = NativeLocalizationWorkbenchContribution_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, locale_1.ILocaleService),
        __param(2, productService_1.IProductService),
        __param(3, storage_1.IStorageService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, panecomposite_1.IPaneCompositePartService),
        __param(7, telemetry_1.ITelemetryService)
    ], NativeLocalizationWorkbenchContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(NativeLocalizationWorkbenchContribution, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbG9jYWxpemF0aW9uL2VsZWN0cm9uLXNhbmRib3gvbG9jYWxpemF0aW9uLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLElBQU0sdUNBQXVDLEdBQTdDLE1BQU0sdUNBQXdDLFNBQVEsaUVBQXFDOztpQkFDM0UsK0NBQTBDLEdBQUcsa0RBQWtELEFBQXJELENBQXNEO1FBRS9HLFlBQ3dDLG1CQUF5QyxFQUMvQyxhQUE2QixFQUM1QixjQUErQixFQUMvQixjQUErQixFQUNuQiwwQkFBdUQsRUFDMUQsY0FBd0MsRUFDdkMsb0JBQStDLEVBQ3ZELGdCQUFtQztZQUV2RSxLQUFLLEVBQUUsQ0FBQztZQVQrQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQy9DLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25CLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDMUQsbUJBQWMsR0FBZCxjQUFjLENBQTBCO1lBQ3ZDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFDdkQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUl2RSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzVHLElBQUksQ0FBQyxTQUFT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