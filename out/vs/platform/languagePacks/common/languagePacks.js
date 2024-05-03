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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation"], function (require, exports, cancellation_1, lifecycle_1, platform_1, nls_1, extensionManagement_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackBaseService = exports.ILanguagePackService = void 0;
    exports.getLocale = getLocale;
    function getLocale(extension) {
        return extension.tags.find(t => t.startsWith('lp-'))?.split('lp-')[1];
    }
    exports.ILanguagePackService = (0, instantiation_1.createDecorator)('languagePackService');
    let LanguagePackBaseService = class LanguagePackBaseService extends lifecycle_1.Disposable {
        constructor(extensionGalleryService) {
            super();
            this.extensionGalleryService = extensionGalleryService;
        }
        async getAvailableLanguages() {
            const timeout = new cancellation_1.CancellationTokenSource();
            setTimeout(() => timeout.cancel(), 1000);
            let result;
            try {
                result = await this.extensionGalleryService.query({
                    text: 'category:"language packs"',
                    pageSize: 20
                }, timeout.token);
            }
            catch (_) {
                // This method is best effort. So, we ignore any errors.
                return [];
            }
            const languagePackExtensions = result.firstPage.filter(e => e.properties.localizedLanguages?.length && e.tags.some(t => t.startsWith('lp-')));
            const allFromMarketplace = languagePackExtensions.map(lp => {
                const languageName = lp.properties.localizedLanguages?.[0];
                const locale = getLocale(lp);
                const baseQuickPick = this.createQuickPickItem(locale, languageName, lp);
                return {
                    ...baseQuickPick,
                    extensionId: lp.identifier.id,
                    galleryExtension: lp
                };
            });
            allFromMarketplace.push(this.createQuickPickItem('en', 'English'));
            return allFromMarketplace;
        }
        createQuickPickItem(locale, languageName, languagePack) {
            const label = languageName ?? locale;
            let description;
            if (label !== locale) {
                description = `(${locale})`;
            }
            if (locale.toLowerCase() === platform_1.language.toLowerCase()) {
                description ??= '';
                description += (0, nls_1.localize)('currentDisplayLanguage', " (Current)");
            }
            if (languagePack?.installCount) {
                description ??= '';
                const count = languagePack.installCount;
                let countLabel;
                if (count > 1000000) {
                    countLabel = `${Math.floor(count / 100000) / 10}M`;
                }
                else if (count > 1000) {
                    countLabel = `${Math.floor(count / 1000)}K`;
                }
                else {
                    countLabel = String(count);
                }
                description += ` $(cloud-download) ${countLabel}`;
            }
            return {
                id: locale,
                label,
                description
            };
        }
    };
    exports.LanguagePackBaseService = LanguagePackBaseService;
    exports.LanguagePackBaseService = LanguagePackBaseService = __decorate([
        __param(0, extensionManagement_1.IExtensionGalleryService)
    ], LanguagePackBaseService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbGFuZ3VhZ2VQYWNrcy9jb21tb24vbGFuZ3VhZ2VQYWNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXaEcsOEJBRUM7SUFGRCxTQUFnQixTQUFTLENBQUMsU0FBNEI7UUFDckQsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVZLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixxQkFBcUIsQ0FBQyxDQUFDO0lBYzFGLElBQWUsdUJBQXVCLEdBQXRDLE1BQWUsdUJBQXdCLFNBQVEsc0JBQVU7UUFHL0QsWUFBeUQsdUJBQWlEO1lBQ3pHLEtBQUssRUFBRSxDQUFDO1lBRGdELDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7UUFFMUcsQ0FBQztRQU1ELEtBQUssQ0FBQyxxQkFBcUI7WUFDMUIsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQ0FBdUIsRUFBRSxDQUFDO1lBQzlDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFekMsSUFBSSxNQUFNLENBQUM7WUFDWCxJQUFJLENBQUM7Z0JBQ0osTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQztvQkFDakQsSUFBSSxFQUFFLDJCQUEyQjtvQkFDakMsUUFBUSxFQUFFLEVBQUU7aUJBQ1osRUFBRSxPQUFPLENBQUMsS0FBSyxD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