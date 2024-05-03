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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/languagePacks/common/languagePacks", "vs/platform/log/common/log"], function (require, exports, cancellation_1, uri_1, extensionManagement_1, extensionResourceLoader_1, languagePacks_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebLanguagePacksService = void 0;
    let WebLanguagePacksService = class WebLanguagePacksService extends languagePacks_1.LanguagePackBaseService {
        constructor(extensionResourceLoaderService, extensionGalleryService, logService) {
            super(extensionGalleryService);
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.logService = logService;
        }
        async getBuiltInExtensionTranslationsUri(id, language) {
            const queryTimeout = new cancellation_1.CancellationTokenSource();
            setTimeout(() => queryTimeout.cancel(), 1000);
            // First get the extensions that supports the language (there should only be one but just in case let's include more results)
            let result;
            try {
                result = await this.extensionGalleryService.query({
                    text: `tag:"lp-${language}"`,
                    pageSize: 5
                }, queryTimeout.token);
            }
            catch (err) {
                this.logService.error(err);
                return undefined;
            }
            const languagePackExtensions = result.firstPage.find(e => e.properties.localizedLanguages?.length);
            if (!languagePackExtensions) {
                this.logService.trace(`No language pack found for language ${language}`);
                return undefined;
            }
            // Then get the manifest for that extension
            const manifestTimeout = new cancellation_1.CancellationTokenSource();
            setTimeout(() => queryTimeout.cancel(), 1000);
            const manifest = await this.extensionGalleryService.getManifest(languagePackExtensions, manifestTimeout.token);
            // Find the translation from the language pack
            const localization = manifest?.contributes?.localizations?.find(l => l.languageId === language);
            const translation = localization?.translations.find(t => t.id === id);
            if (!translation) {
                this.logService.trace(`No translation found for id '${id}, in ${manifest?.name}`);
                return undefined;
            }
            // get the resource uri and return it
            const uri = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({
                // If translation is defined then manifest should have been defined.
                name: manifest.name,
                publisher: manifest.publisher,
                version: manifest.version
            });
            if (!uri) {
                this.logService.trace('Gallery does not provide extension resources.');
                return undefined;
            }
            return uri_1.URI.joinPath(uri, translation.path);
        }
        // Web doesn't have a concept of language packs, so we just return an empty array
        getInstalledLanguages() {
            return Promise.resolve([]);
        }
    };
    exports.WebLanguagePacksService = WebLanguagePacksService;
    exports.WebLanguagePacksService = WebLanguagePacksService = __decorate([
        __param(0, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, log_1.ILogService)
    ], WebLanguagePacksService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbGFuZ3VhZ2VQYWNrcy9icm93c2VyL2xhbmd1YWdlUGFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsdUNBQXVCO1FBQ25FLFlBQ21ELDhCQUErRCxFQUN2Rix1QkFBaUQsRUFDN0MsVUFBdUI7WUFFckQsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFKbUIsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFpQztZQUVuRixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBR3RELENBQUM7UUFFRCxLQUFLLENBQUMsa0NBQWtDLENBQUMsRUFBVSxFQUFFLFFBQWdCO1lBRXBFLE1BQU0sWUFBWSxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUNuRCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTlDLDZIQUE2SDtZQUM3SCxJQUFJLE1BQU0sQ0FBQztZQUNYLElBQUksQ0FBQztnQkFDSixNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDO29CQUNqRCxJQUFJLEVBQUUsV0FBVyxRQUFRLEdBQUc7b0JBQzVCLFFBQVEsRUFBRSxDQUFDO2lCQUNYLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hCLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDbkcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RSxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsMkNBQTJDO1lBQzNDLE1BQU0sZUFBZSxHQUFHLElBQUksc0NBQXVCLEVBQUUsQ0FBQztZQUN0RCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzlDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0csOENBQThDO1lBQzlDLE1BQU0sWUFBWSxHQUFHLFFBQVEsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDaEcsTUFBTSxXQUFXLEdBQUcsWUFBWSxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsUUFBUSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbEYsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELHFDQUFxQztZQUNyQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsOEJBQThCLENBQUMsOEJBQThCLENBQUM7Z0JBQzlFLG9FQUFvRTtnQkFDcEUsSUFBSSxFQUFFLFFBQVMsQ0FBQyxJQUFJO2dCQUNwQixTQUFTLEVBQUUsUUFBUyxDQUFDLFNBQVM7Z0JBQzlCLE9BQU8sRUFBRSxRQUFTLENBQUMsT0FBTzthQUMxQixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQztnQkFDdkUsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELE9BQU8sU0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxpRkFBaUY7UUFDakYscUJBQXFCO1lBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQTtJQWhFWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQUVqQyxXQUFBLHlEQUErQixDQUFBO1FBQy9CLFdBQUEsOENBQXdCLENBQUE7UUFDeEIsV0FBQSxpQkFBVyxDQUFBO09BSkQsdUJBQXVCLENBZ0VuQyJ9