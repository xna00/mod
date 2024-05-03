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
define(["require", "exports", "crypto", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/platform/languagePacks/common/languagePacks", "vs/base/common/uri"], function (require, exports, crypto_1, arrays_1, async_1, lifecycle_1, network_1, path_1, pfs_1, environment_1, extensionManagement_1, extensionManagementUtil_1, log_1, languagePacks_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLanguagePackService = void 0;
    let NativeLanguagePackService = class NativeLanguagePackService extends languagePacks_1.LanguagePackBaseService {
        constructor(extensionManagementService, environmentService, extensionGalleryService, logService) {
            super(extensionGalleryService);
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
            this.cache = this._register(new LanguagePacksCache(environmentService, logService));
            this.extensionManagementService.registerParticipant({
                postInstall: async (extension) => {
                    return this.postInstallExtension(extension);
                },
                postUninstall: async (extension) => {
                    return this.postUninstallExtension(extension);
                }
            });
        }
        async getBuiltInExtensionTranslationsUri(id, language) {
            const packs = await this.cache.getLanguagePacks();
            const pack = packs[language];
            if (!pack) {
                this.logService.warn(`No language pack found for ${language}`);
                return undefined;
            }
            const translation = pack.translations[id];
            return translation ? uri_1.URI.file(translation) : undefined;
        }
        async getInstalledLanguages() {
            const languagePacks = await this.cache.getLanguagePacks();
            const languages = Object.keys(languagePacks).map(locale => {
                const languagePack = languagePacks[locale];
                const baseQuickPick = this.createQuickPickItem(locale, languagePack.label);
                return {
                    ...baseQuickPick,
                    extensionId: languagePack.extensions[0].extensionIdentifier.id,
                };
            });
            languages.push(this.createQuickPickItem('en', 'English'));
            languages.sort((a, b) => a.label.localeCompare(b.label));
            return languages;
        }
        async postInstallExtension(extension) {
            if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                this.logService.info('Adding language packs from the extension', extension.identifier.id);
                await this.update();
            }
        }
        async postUninstallExtension(extension) {
            const languagePacks = await this.cache.getLanguagePacks();
            if (Object.keys(languagePacks).some(language => languagePacks[language] && languagePacks[language].extensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e.extensionIdentifier, extension.identifier)))) {
                this.logService.info('Removing language packs from the extension', extension.identifier.id);
                await this.update();
            }
        }
        async update() {
            const [current, installed] = await Promise.all([this.cache.getLanguagePacks(), this.extensionManagementService.getInstalled()]);
            const updated = await this.cache.update(installed);
            return !(0, arrays_1.equals)(Object.keys(current), Object.keys(updated));
        }
    };
    exports.NativeLanguagePackService = NativeLanguagePackService;
    exports.NativeLanguagePackService = NativeLanguagePackService = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, log_1.ILogService)
    ], NativeLanguagePackService);
    let LanguagePacksCache = class LanguagePacksCache extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.logService = logService;
            this.languagePacks = {};
            this.languagePacksFilePath = (0, path_1.join)(environmentService.userDataPath, 'languagepacks.json');
            this.languagePacksFileLimiter = new async_1.Queue();
        }
        getLanguagePacks() {
            // if queue is not empty, fetch from disk
            if (this.languagePacksFileLimiter.size || !this.initializedCache) {
                return this.withLanguagePacks()
                    .then(() => this.languagePacks);
            }
            return Promise.resolve(this.languagePacks);
        }
        update(extensions) {
            return this.withLanguagePacks(languagePacks => {
                Object.keys(languagePacks).forEach(language => delete languagePacks[language]);
                this.createLanguagePacksFromExtensions(languagePacks, ...extensions);
            }).then(() => this.languagePacks);
        }
        createLanguagePacksFromExtensions(languagePacks, ...extensions) {
            for (const extension of extensions) {
                if (extension && extension.manifest && extension.manifest.contributes && extension.manifest.contributes.localizations && extension.manifest.contributes.localizations.length) {
                    this.createLanguagePacksFromExtension(languagePacks, extension);
                }
            }
            Object.keys(languagePacks).forEach(languageId => this.updateHash(languagePacks[languageId]));
        }
        createLanguagePacksFromExtension(languagePacks, extension) {
            const extensionIdentifier = extension.identifier;
            const localizations = extension.manifest.contributes && extension.manifest.contributes.localizations ? extension.manifest.contributes.localizations : [];
            for (const localizationContribution of localizations) {
                if (extension.location.scheme === network_1.Schemas.file && isValidLocalization(localizationContribution)) {
                    let languagePack = languagePacks[localizationContribution.languageId];
                    if (!languagePack) {
                        languagePack = {
                            hash: '',
                            extensions: [],
                            translations: {},
                            label: localizationContribution.localizedLanguageName ?? localizationContribution.languageName
                        };
                        languagePacks[localizationContribution.languageId] = languagePack;
                    }
                    const extensionInLanguagePack = languagePack.extensions.filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e.extensionIdentifier, extensionIdentifier))[0];
                    if (extensionInLanguagePack) {
                        extensionInLanguagePack.version = extension.manifest.version;
                    }
                    else {
                        languagePack.extensions.push({ extensionIdentifier, version: extension.manifest.version });
                    }
                    for (const translation of localizationContribution.translations) {
                        languagePack.translations[translation.id] = (0, path_1.join)(extension.location.fsPath, translation.path);
                    }
                }
            }
        }
        updateHash(languagePack) {
            if (languagePack) {
                const md5 = (0, crypto_1.createHash)('md5'); // CodeQL [SM04514] Used to create an hash for language pack extension version, which is not a security issue
                for (const extension of languagePack.extensions) {
                    md5.update(extension.extensionIdentifier.uuid || extension.extensionIdentifier.id).update(extension.version); // CodeQL [SM01510] The extension UUID is not sensitive info and is not manually created by a user
                }
                languagePack.hash = md5.digest('hex');
            }
        }
        withLanguagePacks(fn = () => null) {
            return this.languagePacksFileLimiter.queue(() => {
                let result = null;
                return pfs_1.Promises.readFile(this.languagePacksFilePath, 'utf8')
                    .then(undefined, err => err.code === 'ENOENT' ? Promise.resolve('{}') : Promise.reject(err))
                    .then(raw => { try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    return {};
                } })
                    .then(languagePacks => { result = fn(languagePacks); return languagePacks; })
                    .then(languagePacks => {
                    for (const language of Object.keys(languagePacks)) {
                        if (!languagePacks[language]) {
                            delete languagePacks[language];
                        }
                    }
                    this.languagePacks = languagePacks;
                    this.initializedCache = true;
                    const raw = JSON.stringify(this.languagePacks);
                    this.logService.debug('Writing language packs', raw);
                    return pfs_1.Promises.writeFile(this.languagePacksFilePath, raw);
                })
                    .then(() => result, error => this.logService.error(error));
            });
        }
    };
    LanguagePacksCache = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService)
    ], LanguagePacksCache);
    function isValidLocalization(localization) {
        if (typeof localization.languageId !== 'string') {
            return false;
        }
        if (!Array.isArray(localization.translations) || localization.translations.length === 0) {
            return false;
        }
        for (const translation of localization.translations) {
            if (typeof translation.id !== 'string') {
                return false;
            }
            if (typeof translation.path !== 'string') {
                return false;
            }
        }
        if (localization.languageName && typeof localization.languageName !== 'string') {
            return false;
        }
        if (localization.localizedLanguageName && typeof localization.localizedLanguageName !== 'string') {
            return false;
        }
        return true;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VQYWNrcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbGFuZ3VhZ2VQYWNrcy9ub2RlL2xhbmd1YWdlUGFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLHlCQUF5QixHQUEvQixNQUFNLHlCQUEwQixTQUFRLHVDQUF1QjtRQUdyRSxZQUMrQywwQkFBdUQsRUFDMUUsa0JBQTZDLEVBQzlDLHVCQUFpRCxFQUM3QyxVQUF1QjtZQUVyRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUxlLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFHdkUsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUdyRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxtQkFBbUIsQ0FBQztnQkFDbkQsV0FBVyxFQUFFLEtBQUssRUFBRSxTQUEwQixFQUFpQixFQUFFO29CQUNoRSxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDN0MsQ0FBQztnQkFDRCxhQUFhLEVBQUUsS0FBSyxFQUFFLFNBQTBCLEVBQWlCLEVBQUU7b0JBQ2xFLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxFQUFVLEVBQUUsUUFBZ0I7WUFDcEUsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDbEQs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