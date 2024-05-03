/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/common/services/languagesAssociations", "vs/editor/common/languages/modesRegistry", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, event_1, lifecycle_1, strings_1, languagesAssociations_1, modesRegistry_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagesRegistry = exports.LanguageIdCodec = void 0;
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const NULL_LANGUAGE_ID = 'vs.editor.nullLanguage';
    class LanguageIdCodec {
        constructor() {
            this._languageIdToLanguage = [];
            this._languageToLanguageId = new Map();
            this._register(NULL_LANGUAGE_ID, 0 /* LanguageId.Null */);
            this._register(modesRegistry_1.PLAINTEXT_LANGUAGE_ID, 1 /* LanguageId.PlainText */);
            this._nextLanguageId = 2;
        }
        _register(language, languageId) {
            this._languageIdToLanguage[languageId] = language;
            this._languageToLanguageId.set(language, languageId);
        }
        register(language) {
            if (this._languageToLanguageId.has(language)) {
                return;
            }
            const languageId = this._nextLanguageId++;
            this._register(language, languageId);
        }
        encodeLanguageId(languageId) {
            return this._languageToLanguageId.get(languageId) || 0 /* LanguageId.Null */;
        }
        decodeLanguageId(languageId) {
            return this._languageIdToLanguage[languageId] || NULL_LANGUAGE_ID;
        }
    }
    exports.LanguageIdCodec = LanguageIdCodec;
    class LanguagesRegistry extends lifecycle_1.Disposable {
        static { this.instanceCount = 0; }
        constructor(useModesRegistry = true, warnOnOverwrite = false) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            LanguagesRegistry.instanceCount++;
            this._warnOnOverwrite = warnOnOverwrite;
            this.languageIdCodec = new LanguageIdCodec();
            this._dynamicLanguages = [];
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            if (useModesRegistry) {
                this._initializeFromRegistry();
                this._register(modesRegistry_1.ModesRegistry.onDidChangeLanguages((m) => {
                    this._initializeFromRegistry();
                }));
            }
        }
        dispose() {
            LanguagesRegistry.instanceCount--;
            super.dispose();
        }
        setDynamicLanguages(def) {
            this._dynamicLanguages = def;
            this._initializeFromRegistry();
        }
        _initializeFromRegistry() {
            this._languages = {};
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            (0, languagesAssociations_1.clearPlatformLanguageAssociations)();
            const desc = [].concat(modesRegistry_1.ModesRegistry.getLanguages()).concat(this._dynamicLanguages);
            this._registerLanguages(desc);
        }
        registerLanguage(desc) {
            return modesRegistry_1.ModesRegistry.registerLanguage(desc);
        }
        _registerLanguages(desc) {
            for (const d of desc) {
                this._registerLanguage(d);
            }
            // Rebuild fast path maps
            this._mimeTypesMap = {};
            this._nameMap = {};
            this._lowercaseNameMap = {};
            Object.keys(this._languages).forEach((langId) => {
                const language = this._languages[langId];
                if (language.name) {
                    this._nameMap[language.name] = language.identifier;
                }
                language.aliases.forEach((alias) => {
                    this._lowercaseNameMap[alias.toLowerCase()] = language.identifier;
                });
                language.mimetypes.forEach((mimetype) => {
                    this._mimeTypesMap[mimetype] = language.identifier;
                });
            });
            platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerOverrideIdentifiers(this.getRegisteredLanguageIds());
            this._onDidChange.fire();
        }
        _registerLanguage(lang) {
            const langId = lang.id;
            let resolvedLanguage;
            if (hasOwnProperty.call(this._languages, langId)) {
                resolvedLanguage = this._languages[langId];
            }
            else {
                this.languageIdCodec.register(langId);
                resolvedLanguage = {
                    identifier: langId,
                    name: null,
                    mimetypes: [],
                    aliases: [],
                    extensions: [],
                    filenames: [],
                    configurationFiles: [],
                    icons: []
                };
                this._languages[langId] = resolvedLanguage;
            }
            this._mergeLanguage(resolvedLanguage, lang);
        }
        _mergeLanguage(resolvedLanguage, lang) {
            const langId = lang.id;
            let primaryMime = null;
            if (Array.isArray(lang.mimetypes) && lang.mimetypes.length > 0) {
                resolvedLanguage.mimetypes.push(...lang.mimetypes);
                primaryMime = lang.mimetypes[0];
            }
            if (!primaryMime) {
                primaryMime = `text/x-${langId}`;
                resolvedLanguage.mimetypes.push(primaryMime);
            }
            if (Array.isArray(lang.extensions)) {
                if (lang.configuration) {
                    // insert first as this appears to be the 'primary' language definition
                    resolvedLanguage.extensions = lang.extensions.concat(resolvedLanguage.extensions);
                }
                else {
                    resolvedLanguage.extensions = resolvedLanguage.extensions.concat(lang.extensions);
                }
                for (const extension of lang.extensions) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, extension: extension }, this._warnOnOverwrite);
                }
            }
            if (Array.isArray(lang.filenames)) {
                for (const filename of lang.filenames) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filename: filename }, this._warnOnOverwrite);
                    resolvedLanguage.filenames.push(filename);
                }
            }
            if (Array.isArray(lang.filenamePatterns)) {
                for (const filenamePattern of lang.filenamePatterns) {
                    (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, filepattern: filenamePattern }, this._warnOnOverwrite);
                }
            }
            if (typeof lang.firstLine === 'string' && lang.firstLine.length > 0) {
                let firstLineRegexStr = lang.firstLine;
                if (firstLineRegexStr.charAt(0) !== '^') {
                    firstLineRegexStr = '^' + firstLineRegexStr;
                }
                try {
                    const firstLineRegex = new RegExp(firstLineRegexStr);
                    if (!(0, strings_1.regExpLeadsToEndlessLoop)(firstLineRegex)) {
                        (0, languagesAssociations_1.registerPlatformLanguageAssociation)({ id: langId, mime: primaryMime, firstline: firstLineRegex }, this._warnOnOverwrite);
                    }
                }
                catch (err) {
                    // Most likely, the regex was bad
                    console.warn(`[${lang.id}]: Invalid regular expression \`${firstLineRegexStr}\`: `, err);
                }
            }
            resolvedLanguage.aliases.push(langId);
            let langAliases = null;
            if (typeof lang.aliases !== 'undefined' && Array.isArray(lang.aliases)) {
                if (lang.aliases.length === 0) {
                    // signal that this language should not get a name
                    langAliases = [null];
                }
                else {
                    langAliases = lang.aliases;
                }
            }
            if (langAliases !== null) {
                for (const langAlias of langAliases) {
                    if (!langAlias || langAlias.length === 0) {
                        continue;
                    }
                    resolvedLanguage.aliases.push(langAlias);
                }
            }
            const containsAliases = (langAliases !== null && langAliases.length > 0);
            if (containsAliases && langAliases[0] === null) {
                // signal that this language should not get a name
            }
            else {
                const bestName = (containsAliases ? langAliases[0] : null) || langId;
                if (containsAliases || !resolvedLanguage.name) {
                    resolvedLanguage.name = bestName;
                }
            }
            if (lang.configuration) {
                resolvedLanguage.configurationFiles.push(lang.configuration);
            }
            if (lang.icon) {
                resolvedLanguage.icons.push(lang.icon);
            }
        }
        isRegisteredLanguageId(languageId) {
            if (!languageId) {
                return false;
            }
            return hasOwnProperty.call(this._languages, languageId);
        }
        getRegisteredLanguageIds() {
            return Object.keys(this._languages);
        }
        getSortedRegisteredLanguageNames() {
            const result = [];
            for (const languageName in this._nameMap) {
                if (hasOwnProperty.call(this._nameMap, languageName)) {
                    result.push({
                        languageName: languageName,
                        languageId: this._nameMap[languageName]
                    });
                }
            }
            result.sort((a, b) => (0, strings_1.compareIgnoreCase)(a.languageName, b.languageName));
            return result;
        }
        getLanguageName(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            return this._languages[languageId].name;
        }
        getMimeType(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.mimetypes[0] || null);
        }
        getExtensions(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].extensions;
        }
        getFilenames(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].filenames;
        }
        getIcon(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return null;
            }
            const language = this._languages[languageId];
            return (language.icons[0] || null);
        }
        getConfigurationFiles(languageId) {
            if (!hasOwnProperty.call(this._languages, languageId)) {
                return [];
            }
            return this._languages[languageId].configurationFiles || [];
        }
        getLanguageIdByLanguageName(languageName) {
            const languageNameLower = languageName.toLowerCase();
            if (!hasOwnProperty.call(this._lowercaseNameMap, languageNameLower)) {
                return null;
            }
            return this._lowercaseNameMap[languageNameLower];
        }
        getLanguageIdByMimeType(mimeType) {
            if (!mimeType) {
                return null;
            }
            if (hasOwnProperty.call(this._mimeTypesMap, mimeType)) {
                return this._mimeTypesMap[mimeType];
            }
            return null;
        }
        guessLanguageIdByFilepathOrFirstLine(resource, firstLine) {
            if (!resource && !firstLine) {
                return [];
            }
            return (0, languagesAssociations_1.getLanguageIds)(resource, firstLine);
        }
    }
    exports.LanguagesRegistry = LanguagesRegistry;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VzUmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vc2VydmljZXMvbGFuZ3VhZ2VzUmVnaXN0cnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBY2hHLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ3ZELE1BQU0sZ0JBQWdCLEdBQUcsd0JBQXdCLENBQUM7SUFhbEQsTUFBYSxlQUFlO1FBTTNCO1lBSGlCLDBCQUFxQixHQUFhLEVBQUUsQ0FBQztZQUNyQywwQkFBcUIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUdsRSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQiwwQkFBa0IsQ0FBQztZQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLHFDQUFxQiwrQkFBdUIsQ0FBQztZQUM1RCxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRU8sU0FBUyxDQUFDLFFBQWdCLEVBQUUsVUFBc0I7WUFDekQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztZQUNsRCxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU0sUUFBUSxDQUFDLFFBQWdCO1lBQy9CLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN0QyxDQUFD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