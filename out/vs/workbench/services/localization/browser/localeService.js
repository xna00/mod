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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/localization/common/locale", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/log/common/log"], function (require, exports, nls_1, platform_1, dialogs_1, locale_1, host_1, productService_1, extensions_1, cancellation_1, extensionManagement_1, log_1) {
    "use strict";
    var WebLocaleService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebLocaleService = void 0;
    let WebLocaleService = class WebLocaleService {
        static { WebLocaleService_1 = this; }
        static { this._LOCAL_STORAGE_EXTENSION_ID_KEY = 'vscode.nls.languagePackExtensionId'; }
        static { this._LOCAL_STORAGE_LOCALE_KEY = 'vscode.nls.locale'; }
        constructor(dialogService, hostService, productService) {
            this.dialogService = dialogService;
            this.hostService = hostService;
            this.productService = productService;
        }
        async setLocale(languagePackItem, _skipDialog = false) {
            const locale = languagePackItem.id;
            if (locale === platform_1.Language.value() || (!locale && platform_1.Language.value() === navigator.language.toLowerCase())) {
                return;
            }
            if (locale) {
                localStorage.setItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY, locale);
                if (languagePackItem.extensionId) {
                    localStorage.setItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY, languagePackItem.extensionId);
                }
            }
            else {
                localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY);
                localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY);
            }
            const restartDialog = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('relaunchDisplayLanguageMessage', "To change the display language, {0} needs to reload", this.productService.nameLong),
                detail: (0, nls_1.localize)('relaunchDisplayLanguageDetail', "Press the reload button to refresh the page and set the display language to {0}.", languagePackItem.label),
                primaryButton: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, "&&Reload"),
            });
            if (restartDialog.confirmed) {
                this.hostService.restart();
            }
        }
        async clearLocalePreference() {
            localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_LOCALE_KEY);
            localStorage.removeItem(WebLocaleService_1._LOCAL_STORAGE_EXTENSION_ID_KEY);
            if (platform_1.Language.value() === navigator.language.toLowerCase()) {
                return;
            }
            const restartDialog = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('clearDisplayLanguageMessage', "To change the display language, {0} needs to reload", this.productService.nameLong),
                detail: (0, nls_1.localize)('clearDisplayLanguageDetail', "Press the reload button to refresh the page and use your browser's language."),
                primaryButton: (0, nls_1.localize)({ key: 'reload', comment: ['&& denotes a mnemonic character'] }, "&&Reload"),
            });
            if (restartDialog.confirmed) {
                this.hostService.restart();
            }
        }
    };
    exports.WebLocaleService = WebLocaleService;
    exports.WebLocaleService = WebLocaleService = WebLocaleService_1 = __decorate([
        __param(0, dialogs_1.IDialogService),
        __param(1, host_1.IHostService),
        __param(2, productService_1.IProductService)
    ], WebLocaleService);
    let WebActiveLanguagePackService = class WebActiveLanguagePackService {
        constructor(galleryService, logService) {
            this.galleryService = galleryService;
            this.logService = logService;
        }
        async getExtensionIdProvidingCurrentLocale() {
            const language = platform_1.Language.value();
            if (language === platform_1.LANGUAGE_DEFAULT) {
                return undefined;
            }
            const extensionId = localStorage.getItem(WebLocaleService._LOCAL_STORAGE_EXTENSION_ID_KEY);
            if (extensionId) {
                return extensionId;
            }
            if (!this.galleryService.isEnabled()) {
                return undefined;
            }
            try {
                const tagResult = await this.galleryService.query({ text: `tag:lp-${language}` }, cancellation_1.CancellationToken.None);
                // Only install extensions that are published by Microsoft and start with vscode-language-pack for extra certainty
                const extensionToInstall = tagResult.firstPage.find(e => e.publisher === 'MS-CEINTL' && e.name.startsWith('vscode-language-pack'));
                if (extensionToInstall) {
                    localStorage.setItem(WebLocaleService._LOCAL_STORAGE_EXTENSION_ID_KEY, extensionToInstall.identifier.id);
                    return extensionToInstall.identifier.id;
                }
                // TODO: If a non-Microsoft language pack is installed, we should prompt the user asking if they want to install that.
                // Since no such language packs exist yet, we can wait until that happens to implement this.
            }
            catch (e) {
                // Best effort
                this.logService.error(e);
            }
            return undefined;
        }
    };
    WebActiveLanguagePackService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService),
        __param(1, log_1.ILogService)
    ], WebActiveLanguagePackService);
    (0, extensions_1.registerSingleton)(locale_1.ILocaleService, WebLocaleService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(locale_1.IActiveLanguagePackService, WebActiveLanguagePackService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxlU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xvY2FsaXphdGlvbi9icm93c2VyL2xvY2FsZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWN6RixJQUFNLGdCQUFnQixHQUF0QixNQUFNLGdCQUFnQjs7aUJBRVosb0NBQStCLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO2lCQUN2RSw4QkFBeUIsR0FBRyxtQkFBbUIsQUFBdEIsQ0FBdUI7UUFFaEUsWUFDa0MsYUFBNkIsRUFDL0IsV0FBeUIsRUFDdEIsY0FBK0I7WUFGaEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQy9CLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3RCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUM5RCxDQUFDO1FBRUwsS0FBSyxDQUFDLFNBQVMsQ0FBQyxnQkFBbUMsRUFBRSxXQUFXLEdBQUcsS0FBSztZQUN2RSxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDbkMsSUFBSSxNQUFNLEtBQUssbUJBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLG1CQUFRLENBQUMsS0FBSyxFQUFFLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZHLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFnQixDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN6RSxJQUFJLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQyxZQUFZLENBQUMsT0FBTyxDQUFDLGtCQUFn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