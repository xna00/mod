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
define(["require", "exports", "vs/workbench/services/preferences/common/preferences", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/filters", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/workbench/services/aiRelatedInformation/common/aiRelatedInformation", "vs/base/common/tfIdf", "vs/workbench/services/preferences/common/preferencesModels"], function (require, exports, preferences_1, arrays_1, strings, filters_1, instantiation_1, lifecycle_1, preferences_2, extensionManagement_1, extensionManagement_2, cancellation_1, configuration_1, extensions_1, aiRelatedInformation_1, tfIdf_1, preferencesModels_1) {
    "use strict";
    var LocalSearchProvider_1, AiRelatedInformationSearchProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingMatches = exports.LocalSearchProvider = exports.PreferencesSearchService = void 0;
    let PreferencesSearchService = class PreferencesSearchService extends lifecycle_1.Disposable {
        constructor(instantiationService, configurationService, extensionManagementService, extensionEnablementService) {
            super();
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            // This request goes to the shared process but results won't change during a window's lifetime, so cache the results.
            this._installedExtensions = this.extensionManagementService.getInstalled(1 /* ExtensionType.User */).then(exts => {
                // Filter to enabled extensions that have settings
                return exts
                    .filter(ext => this.extensionEnablementService.isEnabled(ext))
                    .filter(ext => ext.manifest && ext.manifest.contributes && ext.manifest.contributes.configuration)
                    .filter(ext => !!ext.identifier.uuid);
            });
        }
        get remoteSearchAllowed() {
            const workbenchSettings = this.configurationService.getValue().workbench.settings;
            return workbenchSettings.enableNaturalLanguageSearch;
        }
        getRemoteSearchProvider(filter, newExtensionsOnly = false) {
            if (!this.remoteSearchAllowed) {
                return undefined;
            }
            this._remoteSearchProvider ??= this.instantiationService.createInstance(RemoteSearchProvider);
            this._remoteSearchProvider.setFilter(filter);
            return this._remoteSearchProvider;
        }
        getLocalSearchProvider(filter) {
            return this.instantiationService.createInstance(LocalSearchProvider, filter);
        }
    };
    exports.PreferencesSearchService = PreferencesSearchService;
    exports.PreferencesSearchService = PreferencesSearchService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_2.IWorkbenchExtensionEnablementService)
    ], PreferencesSearchService);
    function cleanFilter(filter) {
        // Remove " and : which are likely to be copypasted as part of a setting name.
        // Leave other special characters which the user might want to search for.
        return filter
            .replace(/[":]/g, ' ')
            .replace(/  /g, ' ')
            .trim();
    }
    let LocalSearchProvider = class LocalSearchProvider {
        static { LocalSearchProvider_1 = this; }
        static { this.EXACT_MATCH_SCORE = 10000; }
        static { this.START_SCORE = 1000; }
        constructor(_filter, configurationService) {
            this._filter = _filter;
            this.configurationService = configurationService;
            this._filter = cleanFilter(this._filter);
        }
        searchModel(preferencesModel, token) {
            if (!this._filter) {
                return Promise.resolve(null);
            }
            let orderedScore = LocalSearchProvider_1.START_SCORE; // Sort is not stable
            const settingMatcher = (setting) => {
                const { matches, matchType } = new SettingMatches(this._filter, setting, true, true, (filter, setting) => preferencesModel.findValueMatches(filter, setting), this.configurationService);
                const score = this._filter === setting.key ?
                    LocalSearchProvider_1.EXACT_MATCH_SCORE :
                    orderedScore--;
                return matches.length ?
                    {
                        matches,
                        matchType,
                        score
                    } :
                    null;
            };
            const filterMatches = preferencesModel.filterSettings(this._filter, this.getGroupFilter(this._filter), settingMatcher);
            const exactMatch = filterMatches.find(m => m.score === LocalSearchProvider_1.EXACT_MATCH_SCORE);
            if (exactMatch) {
                return Promise.resolve({
                    filterMatches: [exactMatch],
                    exactMatch: true
                });
            }
            else {
                return Promise.resolve({
                    filterMatches
                });
            }
        }
        getGroupFilter(filter) {
            const regex = strings.createRegExp(filter, false, { global: true });
            return (group) => {
                return group.id !== 'defaultOverrides' && regex.test(group.title);
            };
        }
    };
    exports.LocalSearchProvider = LocalSearchProvider;
    exports.LocalSearchProvider = LocalSearchProvider = LocalSearchProvider_1 = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], LocalSearchProvider);
    let SettingMatches = class SettingMatches {
        constructor(searchString, setting, requireFullQueryMatch, searchDescription, valuesMatcher, configurationService) {
            this.searchDescription = searchDescription;
            this.configurationService = configurationService;
            this.matchType = preferences_1.SettingMatchType.None;
            this.matches = (0, arrays_1.distinct)(this._findMatchesInSetting(searchString, setting), (match) => `${match.startLineNumber}_${match.startColumn}_${match.endLineNumber}_${match.endColumn}_`);
        }
        _findMatchesInSetting(searchString, setting) {
            const result = this._doFindMatchesInSetting(searchString, setting);
            return result;
        }
        _keyToLabel(settingId) {
            const label = settingId
                .replace(/[-._]/g, ' ')
                .replace(/([a-z]+)([A-Z])/g, '$1 $2')
                .replace(/([A-Za-z]+)(\d+)/g, '$1 $2')
                .replace(/(\d+)([A-Za-z]+)/g, '$1 $2')
                .toLowerCase();
            return label;
        }
        _doFindMatchesInSetting(searchString, setting) {
            const descriptionMatchingWords = new Map();
            const keyMatchingWords = new Map();
            const valueMatchingWords = new Map();
            const words = new Set(searchString.split(' '));
            // Key search
            const settingKeyAsWords = this._keyToLabel(setting.key);
            for (const word of words) {
                // Check if the key contains the word.
                const keyMatches = (0, filters_1.matchesWords)(word, settingKeyAsWords, true);
                if (keyMatches?.length) {
                    keyMatchingWords.set(word, keyMatches.map(match => this.toKeyRange(setting, match)));
                }
            }
            // For now, only allow a match if all words match in the key.
            if (keyMatchingWords.size === words.size) {
                this.matchType |= preferences_1.SettingMatchType.KeyMatch;
            }
            else {
                keyMatchingWords.clear();
            }
            // Also check if the user tried searching by id.
            const keyIdMatches = (0, filters_1.matchesContiguousSubString)(searchString, setting.key);
            if (keyIdMatches?.length) {
                keyMatchingWords.set(setting.key, keyIdMatches.map(match => this.toKeyRange(setting, match)));
                this.matchType |= preferences_1.SettingMatchType.KeyMatch;
            }
            // Check if the match was for a language tag group setting such as [markdown].
            // In such a case, move that setting to be last.
            if (setting.overrides?.length && (this.matchType & preferences_1.SettingMatchType.KeyMatch)) {
                this.matchType = preferences_1.SettingMatchType.LanguageTagSettingMatch;
                const keyRanges = keyMatchingWords.size ?
                    Array.from(keyMatchingWords.values()).flat() : [];
                return [...keyRanges];
            }
            // Description search
            if (this.searchDescription) {
                for (const word of words) {
                    // Search the description lines.
                    for (let lineIndex = 0; lineIndex < setting.description.length; lineIndex++) {
                        const descriptionMatches = (0, filters_1.matchesContiguousSubString)(word, setting.description[lineIndex]);
                        if (descriptionMatches?.length) {
                            descriptionMatchingWords.set(word, descriptionMatches.map(match => this.toDescriptionRange(setting, match, lineIndex)));
                        }
                    }
                }
                if (descriptionMatchingWords.size === words.size) {
                    this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                }
                else {
                    // Clear out the match for now. We want to require all words to match in the description.
                    descriptionMatchingWords.clear();
                }
            }
            // Value search
            // Check if the value contains all the words.
            if (setting.enum?.length) {
                // Search all string values of enums.
                for (const option of setting.enum) {
                    if (typeof option !== 'string') {
                        continue;
                    }
                    valueMatchingWords.clear();
                    for (const word of words) {
                        const valueMatches = (0, filters_1.matchesContiguousSubString)(word, option);
                        if (valueMatches?.length) {
                            valueMatchingWords.set(word, valueMatches.map(match => this.toValueRange(setting, match)));
                        }
                    }
                    if (valueMatchingWords.size === words.size) {
                        this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                        break;
                    }
                    else {
                        // Clear out the match for now. We want to require all words to match in the value.
                        valueMatchingWords.clear();
                    }
                }
            }
            else {
                // Search single string value.
                const settingValue = this.configurationService.getValue(setting.key);
                if (typeof settingValue === 'string') {
                    for (const word of words) {
                        const valueMatches = (0, filters_1.matchesContiguousSubString)(word, settingValue);
                        if (valueMatches?.length) {
                            valueMatchingWords.set(word, valueMatches.map(match => this.toValueRange(setting, match)));
                        }
                    }
                    if (valueMatchingWords.size === words.size) {
                        this.matchType |= preferences_1.SettingMatchType.DescriptionOrValueMatch;
                    }
                    else {
                        // Clear out the match for now. We want to require all words to match in the value.
                        valueMatchingWords.clear();
                    }
                }
            }
            const descriptionRanges = descriptionMatchingWords.size ?
                Array.from(descriptionMatchingWords.values()).flat() : [];
            const keyRanges = keyMatchingWords.size ?
                Array.from(keyMatchingWords.values()).flat() : [];
            const valueRanges = valueMatchingWords.size ?
                Array.from(valueMatchingWords.values()).flat() : [];
            return [...descriptionRanges, ...keyRanges, ...valueRanges];
        }
        toKeyRange(setting, match) {
            return {
                startLineNumber: setting.keyRange.startLineNumber,
                startColumn: setting.keyRange.startColumn + match.start,
                endLineNumber: setting.keyRange.startLineNumber,
                endColumn: setting.keyRange.startColumn + match.end
            };
        }
        toDescriptionRange(setting, match, lineIndex) {
            const descriptionRange = setting.descriptionRanges[lineIndex];
            if (!descriptionRange) {
                // This case occurs with added settings such as the
                // manage extension setting.
                return preferencesModels_1.nullRange;
            }
            return {
                startLineNumber: descriptionRange.startLineNumber,
                startColumn: descriptionRange.startColumn + match.start,
                endLineNumber: descriptionRange.endLineNumber,
                endColumn: descriptionRange.startColumn + match.end
            };
        }
        toValueRange(setting, match) {
            return {
                startLineNumber: setting.valueRange.startLineNumber,
                startColumn: setting.valueRange.startColumn + match.start + 1,
                endLineNumber: setting.valueRange.startLineNumber,
                endColumn: setting.valueRange.startColumn + match.end + 1
            };
        }
    };
    exports.SettingMatches = SettingMatches;
    exports.SettingMatches = SettingMatches = __decorate([
        __param(5, configuration_1.IConfigurationService)
    ], SettingMatches);
    class AiRelatedInformationSearchKeysProvider {
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this.settingKeys = [];
            this.settingsRecord = {};
        }
        updateModel(preferencesModel) {
            if (preferencesModel === this.currentPreferencesModel) {
                return;
            }
            this.currentPreferencesModel = preferencesModel;
            this.refresh();
        }
        refresh() {
            this.settingKeys = [];
            this.settingsRecord = {};
            if (!this.currentPreferencesModel ||
                !this.aiRelatedInformationService.isEnabled()) {
                return;
            }
            for (const group of this.currentPreferencesModel.settingsGroups) {
                if (group.id === 'mostCommonlyUsed') {
                    continue;
                }
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        this.settingKeys.push(setting.key);
                        this.settingsRecord[setting.key] = setting;
                    }
                }
            }
        }
        getSettingKeys() {
            return this.settingKeys;
        }
        getSettingsRecord() {
            return this.settingsRecord;
        }
    }
    let AiRelatedInformationSearchProvider = class AiRelatedInformationSearchProvider {
        static { AiRelatedInformationSearchProvider_1 = this; }
        static { this.AI_RELATED_INFORMATION_THRESHOLD = 0.73; }
        static { this.AI_RELATED_INFORMATION_MAX_PICKS = 5; }
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this._filter = '';
            this._keysProvider = new AiRelatedInformationSearchKeysProvider(aiRelatedInformationService);
        }
        setFilter(filter) {
            this._filter = cleanFilter(filter);
        }
        async searchModel(preferencesModel, token) {
            if (!this._filter ||
                !this.aiRelatedInformationService.isEnabled()) {
                return null;
            }
            this._keysProvider.updateModel(preferencesModel);
            return {
                filterMatches: await this.getAiRelatedInformationItems(token)
            };
        }
        async getAiRelatedInformationItems(token) {
            const settingsRecord = this._keysProvider.getSettingsRecord();
            const filterMatches = [];
            const relatedInformation = await this.aiRelatedInformationService.getRelatedInformation(this._filter, [aiRelatedInformation_1.RelatedInformationType.SettingInformation], token ?? cancellation_1.CancellationToken.None);
            relatedInformation.sort((a, b) => b.weight - a.weight);
            for (const info of relatedInformation) {
                if (info.weight < AiRelatedInformationSearchProvider_1.AI_RELATED_INFORMATION_THRESHOLD || filterMatches.length === AiRelatedInformationSearchProvider_1.AI_RELATED_INFORMATION_MAX_PICKS) {
                    break;
                }
                const pick = info.setting;
                filterMatches.push({
                    setting: settingsRecord[pick],
                    matches: [settingsRecord[pick].range],
                    matchType: preferences_1.SettingMatchType.RemoteMatch,
                    score: info.weight
                });
            }
            return filterMatches;
        }
    };
    AiRelatedInformationSearchProvider = AiRelatedInformationSearchProvider_1 = __decorate([
        __param(0, aiRelatedInformation_1.IAiRelatedInformationService)
    ], AiRelatedInformationSearchProvider);
    class TfIdfSearchProvider {
        static { this.TF_IDF_PRE_NORMALIZE_THRESHOLD = 50; }
        static { this.TF_IDF_POST_NORMALIZE_THRESHOLD = 0.7; }
        static { this.TF_IDF_MAX_PICKS = 5; }
        constructor() {
            this._filter = '';
            this._documents = [];
            this._settingsRecord = {};
        }
        setFilter(filter) {
            this._filter = cleanFilter(filter);
        }
        keyToLabel(settingId) {
            const label = settingId
                .replace(/[-._]/g, ' ')
                .replace(/([a-z]+)([A-Z])/g, '$1 $2')
                .replace(/([A-Za-z]+)(\d+)/g, '$1 $2')
                .replace(/(\d+)([A-Za-z]+)/g, '$1 $2')
                .toLowerCase();
            return label;
        }
        settingItemToEmbeddingString(item) {
            let result = `Setting Id: ${item.key}\n`;
            result += `Label: ${this.keyToLabel(item.key)}\n`;
            result += `Description: ${item.description}\n`;
            return result;
        }
        async searchModel(preferencesModel, token) {
            if (!this._filter) {
                return null;
            }
            if (this._currentPreferencesModel !== preferencesModel) {
                // Refresh the documents and settings record
                this._currentPreferencesModel = preferencesModel;
                this._documents = [];
                this._settingsRecord = {};
                for (const group of preferencesModel.settingsGroups) {
                    if (group.id === 'mostCommonlyUsed') {
                        continue;
                    }
                    for (const section of group.sections) {
                        for (const setting of section.settings) {
                            this._documents.push({
                                key: setting.key,
                                textChunks: [this.settingItemToEmbeddingString(setting)]
                            });
                            this._settingsRecord[setting.key] = setting;
                        }
                    }
                }
            }
            return {
                filterMatches: await this.getTfIdfItems(token)
            };
        }
        async getTfIdfItems(token) {
            const filterMatches = [];
            const tfIdfCalculator = new tfIdf_1.TfIdfCalculator();
            tfIdfCalculator.updateDocuments(this._documents);
            const tfIdfRankings = tfIdfCalculator.calculateScores(this._filter, token ?? cancellation_1.CancellationToken.None);
            tfIdfRankings.sort((a, b) => b.score - a.score);
            const maxScore = tfIdfRankings[0].score;
            if (maxScore < TfIdfSearchProvider.TF_IDF_PRE_NORMALIZE_THRESHOLD) {
                // Reject all the matches.
                return [];
            }
            for (const info of tfIdfRankings) {
                if (info.score / maxScore < TfIdfSearchProvider.TF_IDF_POST_NORMALIZE_THRESHOLD || filterMatches.length === TfIdfSearchProvider.TF_IDF_MAX_PICKS) {
                    break;
                }
                const pick = info.key;
                filterMatches.push({
                    setting: this._settingsRecord[pick],
                    matches: [this._settingsRecord[pick].range],
                    matchType: preferences_1.SettingMatchType.RemoteMatch,
                    score: info.score
                });
            }
            return filterMatches;
        }
    }
    let RemoteSearchProvider = class RemoteSearchProvider {
        constructor(aiRelatedInformationService) {
            this.aiRelatedInformationService = aiRelatedInformationService;
            this.filter = '';
        }
        initializeSearchProviders() {
            if (this.aiRelatedInformationService.isEnabled()) {
                this.adaSearchProvider ??= new AiRelatedInformationSearchProvider(this.aiRelatedInformationService);
            }
            else {
                this.tfIdfSearchProvider ??= new TfIdfSearchProvider();
            }
        }
        setFilter(filter) {
            this.initializeSearchProviders();
            this.filter = filter;
            if (this.adaSearchProvider) {
                this.adaSearchProvider.setFilter(filter);
            }
            else {
                this.tfIdfSearchProvider.setFilter(filter);
            }
        }
        searchModel(preferencesModel, token) {
            if (!this.filter) {
                return Promise.resolve(null);
            }
            if (this.adaSearchProvider) {
                return this.adaSearchProvider.searchModel(preferencesModel, token);
            }
            else {
                return this.tfIdfSearchProvider.searchModel(preferencesModel, token);
            }
        }
    };
    RemoteSearchProvider = __decorate([
        __param(0, aiRelatedInformation_1.IAiRelatedInformationService)
    ], RemoteSearchProvider);
    (0, extensions_1.registerSingleton)(preferences_2.IPreferencesSearchService, PreferencesSearchService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNTZWFyY2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIvcHJlZmVyZW5jZXNTZWFyY2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTBCekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQU92RCxZQUN5QyxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQ3JDLDBCQUF1RCxFQUM5QywwQkFBZ0U7WUFFdkgsS0FBSyxFQUFFLENBQUM7WUFMZ0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JDLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDOUMsK0JBQTBCLEdBQTFCLDBCQUEwQixDQUFzQztZQUl2SCxxSEFBcUg7WUFDckgsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxZQUFZLDRCQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDeEcsa0RBQWtEO2dCQUNsRCxPQUFPLElBQUk7cUJBQ1QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDN0QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUM7cUJBQ2pHLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQVksbUJBQW1CO1lBQzlCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBbUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1lBQ25ILE9BQU8saUJBQWlCLENBQUMsMkJBQTJCLENBQUM7UUFDdEQsQ0FBQztRQUVELHVCQUF1QixDQUFDLE1BQWMsRUFBRSxpQkFBaUIsR0FBRyxLQUFLO1lBQ2hFLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDL0IsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELElBQUksQ0FBQyxxQkFBcUIsS0FBSyxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztRQUNuQyxDQUFDO1FBRUQsc0JBQXNCLENBQUMsTUFBYztZQUNwQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDOUUsQ0FBQztLQUNELENBQUE7SUEzQ1ksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFRbEMsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaURBQTJCLENBQUE7UUFDM0IsV0FBQSwwREFBb0MsQ0FBQTtPQVgxQix3QkFBd0IsQ0EyQ3BDO0lBRUQsU0FBUyxXQUFXLENBQUMsTUFBYztRQUNsQyw4RUFBOEU7UUFDOUUsMEVBQTBFO1FBQzFFLE9BQU8sTUFBTTthQUNYLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDO2FBQ3JCLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDO2FBQ25CLElBQUksRUFBRSxDQUFDO0lBQ1YsQ0FBQztJQUVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1COztpQkFDZixzQkFBaUIsR0FBRyxLQUFLLEFBQVIsQ0FBUztpQkFDMUIsZ0JBQVcsR0FBRyxJQUFJLEFBQVAsQ0FBUTtRQUVuQyxZQUNTLE9BQWUsRUFDaUIsb0JBQTJDO1lBRDNFLFlBQU8sR0FBUCxPQUFPLENBQVE7WUFDaUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUVuRixJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUMsQ0FBQztRQUVELFdBQVcsQ0FBQyxnQkFBc0MsRUFBRSxLQUF5QjtZQUM1RSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksWUFBWSxHQUFHLHFCQUFtQixDQUFDLFdBQVcsQ0FBQyxDQUFDLHFCQUFxQjtZQUN6RSxNQUFNLGNBQWMsR0FBRyxDQUFDLE9BQWlCLEVBQUUsRUFBRTtnQkFDNUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUN6TCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0MscUJBQW1CLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDdkMsWUFBWSxFQUFFLENBQUM7Z0JBRWhCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUN0Qjt3QkFDQyxPQUFPO3dCQUNQLFNBQVM7d0JBQ1QsS0FBSztxQkFDTCxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDO1lBQ1AsQ0FBQyxDQUFDO1lBRUYsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDdkgsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUsscUJBQW1CLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUM5RixJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7b0JBQ3RCLGFBQWEsRUFBRSxDQUFDLFVBQVUsQ0FBQztvQkFDM0IsVUFBVSxFQUFFLElBQUk7aUJBQ2hCLENBQUMsQ0FBQztZQUNKLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7b0JBQ3RCLGFBQWE7aUJBQ2IsQ0FBQyxDQUFDO1lBQ0osQ0FBQztRQUNGLENBQUM7UUFFTyxjQUFjLENBQUMsTUFBYztZQUNwQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNwRSxPQUFPLENBQUMsS0FBcUIsRUFBRSxFQUFFO2dCQUNoQyxPQUFPLEtBQUssQ0FBQyxFQUFFLEtBQUssa0JBQWtCLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkUsQ0FBQyxDQUFDO1FBQ0gsQ0FBQzs7SUFuRFcsa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFNN0IsV0FBQSxxQ0FBcUIsQ0FBQTtPQU5YLG1CQUFtQixDQW9EL0I7SUFFTSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFjO1FBSTFCLFlBQ0MsWUFBb0IsRUFDcEIsT0FBaUIsRUFDakIscUJBQThCLEVBQ3RCLGlCQUEwQixFQUNsQyxhQUE4RCxFQUN2QyxvQkFBNEQ7WUFGM0Usc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFTO1lBRU0seUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQVJwRixjQUFTLEdBQXFCLDhCQUFnQixDQUFDLElBQUksQ0FBQztZQVVuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsaUJBQVEsRUFBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25MLENBQUM7UUFFTyxxQkFBcUIsQ0FBQyxZQUFvQixFQUFFLE9BQWlCO1lBQ3BFLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDbkUsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRU8sV0FBVyxDQUFDLFNBQWlCO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLFNBQVM7aUJBQ3JCLE9BQU8sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDO2lCQUN0QixPQUFPLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDO2lCQUNwQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDO2lCQUNyQyxPQUFPLENBQUMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDO2lCQUNyQyxXQUFXLEVBQUUsQ0FBQztZQUNoQixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyx1QkFBdUIsQ0FBQyxZQUFvQixFQUFFLE9BQWlCO1lBQ3RFLE1BQU0sd0JBQXdCLEdBQTBCLElBQUksR0FBRyxFQUFvQixDQUFDO1lBQ3BGLE1BQU0sZ0JBQWdCLEdBQTBCLElBQUksR0FBRyxFQUFvQixDQUFDO1lBQzVFLE1BQU0sa0JBQWtCLEdBQTBCLElBQUksR0FBRyxFQUFvQixDQUFDO1lBRTlFLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFTLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUV2RCxhQUFhO1lBQ2IsTUFBTSxpQkFBaUIsR0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoRSxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixzQ0FBc0M7Z0JBQ3RDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0JBQVksRUFBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELElBQUksVUFBVSxFQUFFLE1BQU0sRUFBRSxDQUFDO29CQUN4QixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RGLENBQUM7WUFDRixDQUFDO1lBQ0QsNkRBQTZEO1lBQzdELElBQUksZ0JBQWdCLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLFNBQVMsSUFBSSw4QkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDN0MsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFCLENBQUM7WUFFRCxnREFBZ0Q7WUFDaEQsTUFBTSxZQUFZLEdBQUcsSUFBQSxvQ0FBMEIsRUFBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNFLElBQUksWUFBWSxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RixJQUFJLENBQUMsU0FBUyxJQUFJLDhCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUM3QyxDQUFDO1lBRUQsOEVBQThFO1lBQzlFLGdEQUFnRDtZQUNoRCxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyw4QkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMvRSxJQUFJLENBQUMsU0FBUyxHQUFHLDhCQUFnQixDQUFDLHVCQUF1QixDQUFDO2dCQUMxRCxNQUFNLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDeEMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFFRCxxQkFBcUI7WUFDckIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDMUIsZ0NBQWdDO29CQUNoQyxLQUFLLElBQUksU0FBUyxHQUFHLENBQUMsRUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQzt3QkFDN0UsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLG9DQUEwQixFQUFDLElBQUksRUFBRSxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7d0JBQzVGLElBQUksa0JBQWtCLEVBQUUsTUFBTSxFQUFFLENBQUM7NEJBQ2hDLHdCQUF3QixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN6SCxDQUFDO29CQUNGLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLHdCQUF3QixDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2xELElBQUksQ0FBQyxTQUFTLElBQUksOEJBQWdCLENBQUMsdUJBQXVCLENBQUM7Z0JBQzVELENBQUM7cUJBQU0sQ0FBQztvQkFDUCx5RkFBeUY7b0JBQ3pGLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNsQyxDQUFDO1lBQ0YsQ0FBQztZQUVELGVBQWU7WUFDZiw2Q0FBNkM7WUFDN0MsSUFBSSxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUMxQixxQ0FBcUM7Z0JBQ3JDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNuQyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRSxDQUFDO3dCQUNoQyxTQUFTO29CQUNWLENBQUM7b0JBQ0Qsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQzNCLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLENBQUM7d0JBQzFCLE1BQU0sWUFBWSxHQUFHLElBQUEsb0NBQTBCLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO3dCQUM5RCxJQUFJLFlBQVksRUFBRSxNQUFNLEVBQUUsQ0FBQzs0QkFDMUIsa0JBQWtCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUM1RixDQUFDO29CQUNGLENBQUM7b0JBQ0QsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUM1QyxJQUFJLENBQUMsU0FBUyxJQUFJLDhCQUFnQixDQUFDLHVCQUF1QixDQUFDO3dCQUMzRCxNQUFNO29CQUNQLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxtRkFBbUY7d0JBQ25GLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM1QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsOEJBQThCO2dCQUM5QixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckUsSUFBSSxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDdEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDMUIsTUFBTSxZQUFZLEdBQUcsSUFBQSxvQ0FBMEIsRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7d0JBQ3BFLElBQUksWUFBWSxFQUFFLE1BQU0sRUFBRSxDQUFDOzRCQUMxQixrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzVGLENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxJQUFJLGtCQUFrQixDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQzVDLElBQUksQ0FBQyxTQUFTLElBQUksOEJBQWdCLENBQUMsdUJBQXVCLENBQUM7b0JBQzVELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxtRkFBbUY7d0JBQ25GLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDO29CQUM1QixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsTUFBTSxpQkFBaUIsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsS0FBSyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDM0QsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3hDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ25ELE1BQU0sV0FBVyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxLQUFLLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNyRCxPQUFPLENBQUMsR0FBRyxpQkFBaUIsRUFBRSxHQUFHLFNBQVMsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1FBQzdELENBQUM7UUFFTyxVQUFVLENBQUMsT0FBaUIsRUFBRSxLQUFhO1lBQ2xELE9BQU87Z0JBQ04sZUFBZSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsZUFBZTtnQkFDakQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLO2dCQUN2RCxhQUFhLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlO2dCQUMvQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUc7YUFDbkQsQ0FBQztRQUNILENBQUM7UUFFTyxrQkFBa0IsQ0FBQyxPQUFpQixFQUFFLEtBQWEsRUFBRSxTQUFpQjtZQUM3RSxNQUFNLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdkIsbURBQW1EO2dCQUNuRCw0QkFBNEI7Z0JBQzVCLE9BQU8sNkJBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTztnQkFDTixlQUFlLEVBQUUsZ0JBQWdCLENBQUMsZUFBZTtnQkFDakQsV0FBVyxFQUFFLGdCQUFnQixDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBSztnQkFDdkQsYUFBYSxFQUFFLGdCQUFnQixDQUFDLGFBQWE7Z0JBQzdDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDLEdBQUc7YUFDbkQsQ0FBQztRQUNILENBQUM7UUFFTyxZQUFZLENBQUMsT0FBaUIsRUFBRSxLQUFhO1lBQ3BELE9BQU87Z0JBQ04sZUFBZSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZTtnQkFDbkQsV0FBVyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQztnQkFDN0QsYUFBYSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsZUFBZTtnQkFDakQsU0FBUyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQzthQUN6RCxDQUFDO1FBQ0gsQ0FBQztLQUNELENBQUE7SUEzS1ksd0NBQWM7NkJBQWQsY0FBYztRQVV4QixXQUFBLHFDQUFxQixDQUFBO09BVlgsY0FBYyxDQTJLMUI7SUFFRCxNQUFNLHNDQUFzQztRQUszQyxZQUNrQiwyQkFBeUQ7WUFBekQsZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE4QjtZQUxuRSxnQkFBVyxHQUFhLEVBQUUsQ0FBQztZQUMzQixtQkFBYyxHQUFnQyxFQUFFLENBQUM7UUFLckQsQ0FBQztRQUVMLFdBQVcsQ0FBQyxnQkFBc0M7WUFDakQsSUFBSSxnQkFBZ0IsS0FBSyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDdkQsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsdUJBQXVCLEdBQUcsZ0JBQWdCLENBQUM7WUFDaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2hCLENBQUM7UUFFTyxPQUFPO1lBQ2QsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUM7WUFFekIsSUFDQyxDQUFDLElBQUksQ0FBQyx1QkFBdUI7Z0JBQzdCLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxFQUM1QyxDQUFDO2dCQUNGLE9BQU87WUFDUixDQUFDO1lBRUQsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ2pFLElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO29CQUNyQyxTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3RDLEtBQUssTUFBTSxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUN4QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ25DLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQztvQkFDNUMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxjQUFjO1lBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQzVCLENBQUM7S0FDRDtJQUVELElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQWtDOztpQkFDZixxQ0FBZ0MsR0FBRyxJQUFJLEFBQVAsQ0FBUTtpQkFDeEMscUNBQWdDLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFLN0QsWUFDK0IsMkJBQTBFO1lBQXpELGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFIakcsWUFBTyxHQUFXLEVBQUUsQ0FBQztZQUs1QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksc0NBQXNDLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUM5RixDQUFDO1FBRUQsU0FBUyxDQUFDLE1BQWM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQXNDLEVBQUUsS0FBcUM7WUFDOUYsSUFDQyxDQUFDLElBQUksQ0FBQyxPQUFPO2dCQUNiLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxFQUM1QyxDQUFDO2dCQUNGLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFakQsT0FBTztnQkFDTixhQUFhLEVBQUUsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsS0FBSyxDQUFDO2FBQzdELENBQUM7UUFDSCxDQUFDO1FBRU8sS0FBSyxDQUFDLDRCQUE0QixDQUFDLEtBQXFDO1lBQy9FLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUU5RCxNQUFNLGFBQWEsR0FBb0IsRUFBRSxDQUFDO1lBQzFDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxJQUFJLENBQUMsMkJBQTJCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLDZDQUFzQixDQUFDLGtCQUFrQixDQUFDLEVBQUUsS0FBSyxJQUFJLGdDQUFpQixDQUFDLElBQUksQ0FBK0IsQ0FBQztZQUNsTixrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUV2RCxLQUFLLE1BQU0sSUFBSSxJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3ZDLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxvQ0FBa0MsQ0FBQyxnQ0FBZ0MsSUFBSSxhQUFhLENBQUMsTUFBTSxLQUFLLG9DQUFrQyxDQUFDLGdDQUFnQyxFQUFFLENBQUM7b0JBQ3ZMLE1BQU07Z0JBQ1AsQ0FBQztnQkFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUMxQixhQUFhLENBQUMsSUFBSSxDQUFDO29CQUNsQixPQUFPLEVBQUUsY0FBYyxDQUFDLElBQUksQ0FBQztvQkFDN0IsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDckMsU0FBUyxFQUFFLDhCQUFnQixDQUFDLFdBQVc7b0JBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTTtpQkFDbEIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sYUFBYSxDQUFDO1FBQ3RCLENBQUM7O0lBckRJLGtDQUFrQztRQVFyQyxXQUFBLG1EQUE0QixDQUFBO09BUnpCLGtDQUFrQyxDQXNEdkM7SUFFRCxNQUFNLG1CQUFtQjtpQkFDQSxtQ0FBOEIsR0FBRyxFQUFFLEFBQUwsQ0FBTTtpQkFDcEMsb0NBQStCLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBQ3RDLHFCQUFnQixHQUFHLENBQUMsQUFBSixDQUFLO1FBTzdDO1lBSlEsWUFBTyxHQUFXLEVBQUUsQ0FBQztZQUNyQixlQUFVLEdBQW9CLEVBQUUsQ0FBQztZQUNqQyxvQkFBZSxHQUFnQyxFQUFFLENBQUM7UUFHMUQsQ0FBQztRQUVELFNBQVMsQ0FBQyxNQUFjO1lBQ3ZCLElBQUksQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxVQUFVLENBQUMsU0FBaUI7WUFDM0IsTUFBTSxLQUFLLEdBQUcsU0FBUztpQkFDckIsT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUM7aUJBQ3RCLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUM7aUJBQ3BDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUM7aUJBQ3JDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLENBQUM7aUJBQ3JDLFdBQVcsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVELDRCQUE0QixDQUFDLElBQWM7WUFDMUMsSUFBSSxNQUFNLEdBQUcsZUFBZSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7WUFDekMsTUFBTSxJQUFJLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNsRCxNQUFNLElBQUksZ0JBQWdCLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQztZQUMvQyxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUFzQyxFQUFFLEtBQXFDO1lBQzlGLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLHdCQUF3QixLQUFLLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3hELDRDQUE0QztnQkFDNUMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLGdCQUFnQixDQUFDO2dCQUNqRCxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7Z0JBQzFCLEtBQUssTUFBTSxLQUFLLElBQUksZ0JBQWdCLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3JELElBQUksS0FBSyxDQUFDLEVBQUUsS0FBSyxrQkFBa0IsRUFBRSxDQUFDO3dCQUNyQyxTQUFTO29CQUNWLENBQUM7b0JBQ0QsS0FBSyxNQUFNLE9BQU8sSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7d0JBQ3RDLEtBQUssTUFBTSxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDOzRCQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztnQ0FDcEIsR0FBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHO2dDQUNoQixVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsT0FBTyxDQUFDLENBQUM7NkJBQ3hELENBQUMsQ0FBQzs0QkFDSCxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7d0JBQzdDLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU87Z0JBQ04sYUFBYSxFQUFFLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7YUFDOUMsQ0FBQztRQUNILENBQUM7UUFFTyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQXFDO1lBQ2hFLE1BQU0sYUFBYSxHQUFvQixFQUFFLENBQUM7WUFDMUMsTUFBTSxlQUFlLEdBQUcsSUFBSSx1QkFBZSxFQUFFLENBQUM7WUFDOUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakQsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDaEQsTUFBTSxRQUFRLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUV4QyxJQUFJLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO2dCQUNuRSwwQkFBMEI7Z0JBQzFCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELEtBQUssTUFBTSxJQUFJLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLEdBQUcsbUJBQW1CLENBQUMsK0JBQStCLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUNsSixNQUFNO2dCQUNQLENBQUM7Z0JBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDdEIsYUFBYSxDQUFDLElBQUksQ0FBQztvQkFDbEIsT0FBTyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO29CQUNuQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDM0MsU0FBUyxFQUFFLDhCQUFnQixDQUFDLFdBQVc7b0JBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztpQkFDakIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE9BQU8sYUFBYSxDQUFDO1FBQ3RCLENBQUM7O0lBR0YsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBb0I7UUFLekIsWUFDK0IsMkJBQTBFO1lBQXpELGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFIakcsV0FBTSxHQUFXLEVBQUUsQ0FBQztRQUs1QixDQUFDO1FBRU8seUJBQXlCO1lBQ2hDLElBQUksSUFBSSxDQUFDLDJCQUEyQixDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxpQkFBaUIsS0FBSyxJQUFJLGtDQUFrQyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1lBQ3JHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsbUJBQW1CLEtBQUssSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1lBQ3hELENBQUM7UUFDRixDQUFDO1FBRUQsU0FBUyxDQUFDLE1BQWM7WUFDdkIsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMxQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLG1CQUFvQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUVELFdBQVcsQ0FBQyxnQkFBc0MsRUFBRSxLQUF5QjtZQUM1RSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNsQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzVCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUMsbUJBQW9CLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQTtJQXZDSyxvQkFBb0I7UUFNdkIsV0FBQSxtREFBNEIsQ0FBQTtPQU56QixvQkFBb0IsQ0F1Q3pCO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyx1Q0FBeUIsRUFBRSx3QkFBd0Isb0NBQTRCLENBQUMifQ==