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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/editor/editorModel", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferencesValidation"], function (require, exports, arrays_1, event_1, json_1, lifecycle_1, range_1, selection_1, nls, configuration_1, configurationRegistry_1, keybinding_1, platform_1, editorModel_1, preferences_1, configuration_2, preferencesValidation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefaultKeybindingsEditorModel = exports.DefaultRawSettingsEditorModel = exports.DefaultSettingsEditorModel = exports.DefaultSettings = exports.WorkspaceConfigurationEditorModel = exports.Settings2EditorModel = exports.SettingsEditorModel = exports.nullRange = void 0;
    exports.defaultKeybindingsContents = defaultKeybindingsContents;
    exports.nullRange = { startLineNumber: -1, startColumn: -1, endLineNumber: -1, endColumn: -1 };
    function isNullRange(range) { return range.startLineNumber === -1 && range.startColumn === -1 && range.endLineNumber === -1 && range.endColumn === -1; }
    class AbstractSettingsModel extends editorModel_1.EditorModel {
        constructor() {
            super(...arguments);
            this._currentResultGroups = new Map();
        }
        updateResultGroup(id, resultGroup) {
            if (resultGroup) {
                this._currentResultGroups.set(id, resultGroup);
            }
            else {
                this._currentResultGroups.delete(id);
            }
            this.removeDuplicateResults();
            return this.update();
        }
        /**
         * Remove duplicates between result groups, preferring results in earlier groups
         */
        removeDuplicateResults() {
            const settingKeys = new Set();
            [...this._currentResultGroups.keys()]
                .sort((a, b) => this._currentResultGroups.get(a).order - this._currentResultGroups.get(b).order)
                .forEach(groupId => {
                const group = this._currentResultGroups.get(groupId);
                group.result.filterMatches = group.result.filterMatches.filter(s => !settingKeys.has(s.setting.key));
                group.result.filterMatches.forEach(s => settingKeys.add(s.setting.key));
            });
        }
        filterSettings(filter, groupFilter, settingMatcher) {
            const allGroups = this.filterGroups;
            const filterMatches = [];
            for (const group of allGroups) {
                const groupMatched = groupFilter(group);
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        const settingMatchResult = settingMatcher(setting, group);
                        if (groupMatched || settingMatchResult) {
                            filterMatches.push({
                                setting,
                                matches: settingMatchResult && settingMatchResult.matches,
                                matchType: settingMatchResult?.matchType ?? preferences_1.SettingMatchType.None,
                                score: settingMatchResult?.score ?? 0
                            });
                        }
                    }
                }
            }
            return filterMatches;
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (key === setting.key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        collectMetadata(groups) {
            const metadata = Object.create(null);
            let hasMetadata = false;
            groups.forEach(g => {
                if (g.result.metadata) {
                    metadata[g.id] = g.result.metadata;
                    hasMetadata = true;
                }
            });
            return hasMetadata ? metadata : null;
        }
        get filterGroups() {
            return this.settingsGroups;
        }
    }
    class SettingsEditorModel extends AbstractSettingsModel {
        constructor(reference, _configurationTarget) {
            super();
            this._configurationTarget = _configurationTarget;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.settingsModel = reference.object.textEditorModel;
            this._register(this.onWillDispose(() => reference.dispose()));
            this._register(this.settingsModel.onDidChangeContent(() => {
                this._settingsGroups = undefined;
                this._onDidChangeGroups.fire();
            }));
        }
        get uri() {
            return this.settingsModel.uri;
        }
        get configurationTarget() {
            return this._configurationTarget;
        }
        get settingsGroups() {
            if (!this._settingsGroups) {
                this.parse();
            }
            return this._settingsGroups;
        }
        get content() {
            return this.settingsModel.getValue();
        }
        findValueMatches(filter, setting) {
            return this.settingsModel.findMatches(filter, setting.valueRange, false, false, null, false).map(match => match.range);
        }
        isSettingsProperty(property, previousParents) {
            return previousParents.length === 0; // Settings is root
        }
        parse() {
            this._settingsGroups = parse(this.settingsModel, (property, previousParents) => this.isSettingsProperty(property, previousParents));
        }
        update() {
            const resultGroups = [...this._currentResultGroups.values()];
            if (!resultGroups.length) {
                return undefined;
            }
            // Transform resultGroups into IFilterResult - ISetting ranges are already correct here
            const filteredSettings = [];
            const matches = [];
            resultGroups.forEach(group => {
                group.result.filterMatches.forEach(filterMatch => {
                    filteredSettings.push(filterMatch.setting);
                    if (filterMatch.matches) {
                        matches.push(...filterMatch.matches);
                    }
                });
            });
            let filteredGroup;
            const modelGroup = this.settingsGroups[0]; // Editable model has one or zero groups
            if (modelGroup) {
                filteredGroup = {
                    id: modelGroup.id,
                    range: modelGroup.range,
                    sections: [{
                            settings: filteredSettings
                        }],
                    title: modelGroup.title,
                    titleRange: modelGroup.titleRange,
                    order: modelGroup.order,
                    extensionInfo: modelGroup.extensionInfo
                };
            }
            const metadata = this.collectMetadata(resultGroups);
            return {
                allGroups: this.settingsGroups,
                filteredGroups: filteredGroup ? [filteredGroup] : [],
                matches,
                metadata
            };
        }
    }
    exports.SettingsEditorModel = SettingsEditorModel;
    let Settings2EditorModel = class Settings2EditorModel extends AbstractSettingsModel {
        constructor(_defaultSettings, configurationService) {
            super();
            this._defaultSettings = _defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this.dirty = false;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.source === 7 /* ConfigurationTarget.DEFAULT */) {
                    this.dirty = true;
                    this._onDidChangeGroups.fire();
                }
            }));
            this._register(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).onDidSchemaChange(e => {
                this.dirty = true;
                this._onDidChangeGroups.fire();
            }));
        }
        /** Doesn't include the "Commonly Used" group */
        get filterGroups() {
            return this.settingsGroups.slice(1);
        }
        get settingsGroups() {
            const groups = this._defaultSettings.getSettingsGroups(this.dirty);
            if (this.additionalGroups?.length) {
                groups.push(...this.additionalGroups);
            }
            this.dirty = false;
            return groups;
        }
        /** For programmatically added groups outside of registered configurations */
        setAdditionalGroups(groups) {
            this.additionalGroups = groups;
        }
        findValueMatches(filter, setting) {
            // TODO @roblou
            return [];
        }
        update() {
            throw new Error('Not supported');
        }
    };
    exports.Settings2EditorModel = Settings2EditorModel;
    exports.Settings2EditorModel = Settings2EditorModel = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], Settings2EditorModel);
    function parse(model, isSettingsProperty) {
        const settings = [];
        let overrideSetting = null;
        let currentProperty = null;
        let currentParent = [];
        const previousParents = [];
        let settingsPropertyIndex = -1;
        const range = {
            startLineNumber: 0,
            startColumn: 0,
            endLineNumber: 0,
            endColumn: 0
        };
        function onValue(value, offset, length) {
            if (Array.isArray(currentParent)) {
                currentParent.push(value);
            }
            else if (currentProperty) {
                currentParent[currentProperty] = value;
            }
            if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                // settings value started
                const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                if (setting) {
                    const valueStartPosition = model.getPositionAt(offset);
                    const valueEndPosition = model.getPositionAt(offset + length);
                    setting.value = value;
                    setting.valueRange = {
                        startLineNumber: valueStartPosition.lineNumber,
                        startColumn: valueStartPosition.column,
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    };
                    setting.range = Object.assign(setting.range, {
                        endLineNumber: valueEndPosition.lineNumber,
                        endColumn: valueEndPosition.column
                    });
                }
            }
        }
        const visitor = {
            onObjectBegin: (offset, length) => {
                if (isSettingsProperty(currentProperty, previousParents)) {
                    // Settings started
                    settingsPropertyIndex = previousParents.length;
                    const position = model.getPositionAt(offset);
                    range.startLineNumber = position.lineNumber;
                    range.startColumn = position.column;
                }
                const object = {};
                onValue(object, offset, length);
                currentParent = object;
                currentProperty = null;
                previousParents.push(currentParent);
            },
            onObjectProperty: (name, offset, length) => {
                currentProperty = name;
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting started
                    const settingStartPosition = model.getPositionAt(offset);
                    const setting = {
                        description: [],
                        descriptionIsMarkdown: false,
                        key: name,
                        keyRange: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column + 1,
                            endLineNumber: settingStartPosition.lineNumber,
                            endColumn: settingStartPosition.column + length
                        },
                        range: {
                            startLineNumber: settingStartPosition.lineNumber,
                            startColumn: settingStartPosition.column,
                            endLineNumber: 0,
                            endColumn: 0
                        },
                        value: null,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides: [],
                        overrideOf: overrideSetting ?? undefined,
                    };
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        settings.push(setting);
                        if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(name)) {
                            overrideSetting = setting;
                        }
                    }
                    else {
                        overrideSetting.overrides.push(setting);
                    }
                }
            },
            onObjectEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (settingsPropertyIndex !== -1 && (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null))) {
                    // setting ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = Object.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = Object.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                    if (previousParents.length === settingsPropertyIndex + 1) {
                        overrideSetting = null;
                    }
                }
                if (previousParents.length === settingsPropertyIndex) {
                    // settings ended
                    const position = model.getPositionAt(offset);
                    range.endLineNumber = position.lineNumber;
                    range.endColumn = position.column;
                    settingsPropertyIndex = -1;
                }
            },
            onArrayBegin: (offset, length) => {
                const array = [];
                onValue(array, offset, length);
                previousParents.push(currentParent);
                currentParent = array;
                currentProperty = null;
            },
            onArrayEnd: (offset, length) => {
                currentParent = previousParents.pop();
                if (previousParents.length === settingsPropertyIndex + 1 || (previousParents.length === settingsPropertyIndex + 2 && overrideSetting !== null)) {
                    // setting value ended
                    const setting = previousParents.length === settingsPropertyIndex + 1 ? settings[settings.length - 1] : overrideSetting.overrides[overrideSetting.overrides.length - 1];
                    if (setting) {
                        const valueEndPosition = model.getPositionAt(offset + length);
                        setting.valueRange = Object.assign(setting.valueRange, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                        setting.range = Object.assign(setting.range, {
                            endLineNumber: valueEndPosition.lineNumber,
                            endColumn: valueEndPosition.column
                        });
                    }
                }
            },
            onLiteralValue: onValue,
            onError: (error) => {
                const setting = settings[settings.length - 1];
                if (setting && (isNullRange(setting.range) || isNullRange(setting.keyRange) || isNullRange(setting.valueRange))) {
                    settings.pop();
                }
            }
        };
        if (!model.isDisposed()) {
            (0, json_1.visit)(model.getValue(), visitor);
        }
        return settings.length > 0 ? [{
                sections: [
                    {
                        settings
                    }
                ],
                title: '',
                titleRange: exports.nullRange,
                range
            }] : [];
    }
    class WorkspaceConfigurationEditorModel extends SettingsEditorModel {
        constructor() {
            super(...arguments);
            this._configurationGroups = [];
        }
        get configurationGroups() {
            return this._configurationGroups;
        }
        parse() {
            super.parse();
            this._configurationGroups = parse(this.settingsModel, (property, previousParents) => previousParents.length === 0);
        }
        isSettingsProperty(property, previousParents) {
            return property === 'settings' && previousParents.length === 1;
        }
    }
    exports.WorkspaceConfigurationEditorModel = WorkspaceConfigurationEditorModel;
    class DefaultSettings extends lifecycle_1.Disposable {
        constructor(_mostCommonlyUsedSettingsKeys, target) {
            super();
            this._mostCommonlyUsedSettingsKeys = _mostCommonlyUsedSettingsKeys;
            this.target = target;
            this._settingsByName = new Map();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
        }
        getContent(forceUpdate = false) {
            if (!this._content || forceUpdate) {
                this.initialize();
            }
            return this._content;
        }
        getContentWithoutMostCommonlyUsed(forceUpdate = false) {
            if (!this._contentWithoutMostCommonlyUsed || forceUpdate) {
                this.initialize();
            }
            return this._contentWithoutMostCommonlyUsed;
        }
        getSettingsGroups(forceUpdate = false) {
            if (!this._allSettingsGroups || forceUpdate) {
                this.initialize();
            }
            return this._allSettingsGroups;
        }
        initialize() {
            this._allSettingsGroups = this.parse();
            this._content = this.toContent(this._allSettingsGroups, 0);
            this._contentWithoutMostCommonlyUsed = this.toContent(this._allSettingsGroups, 1);
        }
        parse() {
            const settingsGroups = this.getRegisteredGroups();
            this.initAllSettingsMap(settingsGroups);
            const mostCommonlyUsed = this.getMostCommonlyUsedSettings(settingsGroups);
            return [mostCommonlyUsed, ...settingsGroups];
        }
        getRegisteredGroups() {
            const configurations = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurations().slice();
            const groups = this.removeEmptySettingsGroups(configurations.sort(this.compareConfigurationNodes)
                .reduce((result, config, index, array) => this.parseConfig(config, result, array), []));
            return this.sortGroups(groups);
        }
        sortGroups(groups) {
            groups.forEach(group => {
                group.sections.forEach(section => {
                    section.settings.sort((a, b) => a.key.localeCompare(b.key));
                });
            });
            return groups;
        }
        initAllSettingsMap(allSettingsGroups) {
            this._settingsByName = new Map();
            for (const group of allSettingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        this._settingsByName.set(setting.key, setting);
                    }
                }
            }
        }
        getMostCommonlyUsedSettings(allSettingsGroups) {
            const settings = (0, arrays_1.coalesce)(this._mostCommonlyUsedSettingsKeys.map(key => {
                const setting = this._settingsByName.get(key);
                if (setting) {
                    return {
                        description: setting.description,
                        key: setting.key,
                        value: setting.value,
                        keyRange: exports.nullRange,
                        range: exports.nullRange,
                        valueRange: exports.nullRange,
                        overrides: [],
                        scope: 4 /* ConfigurationScope.RESOURCE */,
                        type: setting.type,
                        enum: setting.enum,
                        enumDescriptions: setting.enumDescriptions,
                        descriptionRanges: []
                    };
                }
                return null;
            }));
            return {
                id: 'mostCommonlyUsed',
                range: exports.nullRange,
                title: nls.localize('commonlyUsed', "Commonly Used"),
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings
                    }
                ]
            };
        }
        parseConfig(config, result, configurations, settingsGroup, seenSettings) {
            seenSettings = seenSettings ? seenSettings : {};
            let title = config.title;
            if (!title) {
                const configWithTitleAndSameId = configurations.find(c => (c.id === config.id) && c.title);
                if (configWithTitleAndSameId) {
                    title = configWithTitleAndSameId.title;
                }
            }
            if (title) {
                if (!settingsGroup) {
                    settingsGroup = result.find(g => g.title === title && g.extensionInfo?.id === config.extensionInfo?.id);
                    if (!settingsGroup) {
                        settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: title || '', titleRange: exports.nullRange, order: config.order, range: exports.nullRange, extensionInfo: config.extensionInfo };
                        result.push(settingsGroup);
                    }
                }
                else {
                    settingsGroup.sections[settingsGroup.sections.length - 1].title = title;
                }
            }
            if (config.properties) {
                if (!settingsGroup) {
                    settingsGroup = { sections: [{ settings: [] }], id: config.id || '', title: config.id || '', titleRange: exports.nullRange, order: config.order, range: exports.nullRange, extensionInfo: config.extensionInfo };
                    result.push(settingsGroup);
                }
                const configurationSettings = [];
                for (const setting of [...settingsGroup.sections[settingsGroup.sections.length - 1].settings, ...this.parseSettings(config)]) {
                    if (!seenSettings[setting.key]) {
                        configurationSettings.push(setting);
                        seenSettings[setting.key] = true;
                    }
                }
                if (configurationSettings.length) {
                    settingsGroup.sections[settingsGroup.sections.length - 1].settings = configurationSettings;
                }
            }
            config.allOf?.forEach(c => this.parseConfig(c, result, configurations, settingsGroup, seenSettings));
            return result;
        }
        removeEmptySettingsGroups(settingsGroups) {
            const result = [];
            for (const settingsGroup of settingsGroups) {
                settingsGroup.sections = settingsGroup.sections.filter(section => section.settings.length > 0);
                if (settingsGroup.sections.length) {
                    result.push(settingsGroup);
                }
            }
            return result;
        }
        parseSettings(config) {
            const result = [];
            const settingsObject = config.properties;
            const extensionInfo = config.extensionInfo;
            // Try using the title if the category id wasn't given
            // (in which case the category id is the same as the extension id)
            const categoryLabel = config.extensionInfo?.id === config.id ? config.title : config.id;
            for (const key in settingsObject) {
                const prop = settingsObject[key];
                if (this.matchesScope(prop)) {
                    const value = prop.default;
                    let description = (prop.markdownDescription || prop.description || '');
                    if (typeof description !== 'string') {
                        description = '';
                    }
                    const descriptionLines = description.split('\n');
                    const overrides = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) ? this.parseOverrideSettings(prop.default) : [];
                    let listItemType;
                    if (prop.type === 'array' && prop.items && !Array.isArray(prop.items) && prop.items.type) {
                        if (prop.items.enum) {
                            listItemType = 'enum';
                        }
                        else if (!Array.isArray(prop.items.type)) {
                            listItemType = prop.items.type;
                        }
                    }
                    const objectProperties = prop.type === 'object' ? prop.properties : undefined;
                    const objectPatternProperties = prop.type === 'object' ? prop.patternProperties : undefined;
                    const objectAdditionalProperties = prop.type === 'object' ? prop.additionalProperties : undefined;
                    let enumToUse = prop.enum;
                    let enumDescriptions = prop.markdownEnumDescriptions ?? prop.enumDescriptions;
                    let enumDescriptionsAreMarkdown = !!prop.markdownEnumDescriptions;
                    if (listItemType === 'enum' && !Array.isArray(prop.items)) {
                        enumToUse = prop.items.enum;
                        enumDescriptions = prop.items.markdownEnumDescriptions ?? prop.items.enumDescriptions;
                        enumDescriptionsAreMarkdown = !!prop.items.markdownEnumDescriptions;
                    }
                    let allKeysAreBoolean = false;
                    if (prop.type === 'object' && !prop.additionalProperties && prop.properties && Object.keys(prop.properties).length) {
                        allKeysAreBoolean = Object.keys(prop.properties).every(key => {
                            return prop.properties[key].type === 'boolean';
                        });
                    }
                    let isLanguageTagSetting = false;
                    if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        isLanguageTagSetting = true;
                    }
                    let defaultValueSource;
                    if (!isLanguageTagSetting) {
                        const registeredConfigurationProp = prop;
                        if (registeredConfigurationProp && registeredConfigurationProp.defaultValueSource) {
                            defaultValueSource = registeredConfigurationProp.defaultValueSource;
                        }
                    }
                    if (!enumToUse && (prop.enumItemLabels || enumDescriptions || enumDescriptionsAreMarkdown)) {
                        console.error(`The setting ${key} has enum-related fields, but doesn't have an enum field. This setting may render improperly in the Settings editor.`);
                    }
                    result.push({
                        key,
                        value,
                        description: descriptionLines,
                        descriptionIsMarkdown: !!prop.markdownDescription,
                        range: exports.nullRange,
                        keyRange: exports.nullRange,
                        valueRange: exports.nullRange,
                        descriptionRanges: [],
                        overrides,
                        scope: prop.scope,
                        type: prop.type,
                        arrayItemType: listItemType,
                        objectProperties,
                        objectPatternProperties,
                        objectAdditionalProperties,
                        enum: enumToUse,
                        enumDescriptions: enumDescriptions,
                        enumDescriptionsAreMarkdown: enumDescriptionsAreMarkdown,
                        enumItemLabels: prop.enumItemLabels,
                        uniqueItems: prop.uniqueItems,
                        tags: prop.tags,
                        disallowSyncIgnore: prop.disallowSyncIgnore,
                        restricted: prop.restricted,
                        extensionInfo: extensionInfo,
                        deprecationMessage: prop.markdownDeprecationMessage || prop.deprecationMessage,
                        deprecationMessageIsMarkdown: !!prop.markdownDeprecationMessage,
                        validator: (0, preferencesValidation_1.createValidator)(prop),
                        allKeysAreBoolean,
                        editPresentation: prop.editPresentation,
                        order: prop.order,
                        nonLanguageSpecificDefaultValueSource: defaultValueSource,
                        isLanguageTagSetting,
                        categoryLabel
                    });
                }
            }
            return result;
        }
        parseOverrideSettings(overrideSettings) {
            return Object.keys(overrideSettings).map((key) => ({
                key,
                value: overrideSettings[key],
                description: [],
                descriptionIsMarkdown: false,
                range: exports.nullRange,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionRanges: [],
                overrides: []
            }));
        }
        matchesScope(property) {
            if (!property.scope) {
                return true;
            }
            if (this.target === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return configuration_2.FOLDER_SCOPES.indexOf(property.scope) !== -1;
            }
            if (this.target === 5 /* ConfigurationTarget.WORKSPACE */) {
                return configuration_2.WORKSPACE_SCOPES.indexOf(property.scope) !== -1;
            }
            return true;
        }
        compareConfigurationNodes(c1, c2) {
            if (typeof c1.order !== 'number') {
                return 1;
            }
            if (typeof c2.order !== 'number') {
                return -1;
            }
            if (c1.order === c2.order) {
                const title1 = c1.title || '';
                const title2 = c2.title || '';
                return title1.localeCompare(title2);
            }
            return c1.order - c2.order;
        }
        toContent(settingsGroups, startIndex) {
            const builder = new SettingsContentBuilder();
            for (let i = startIndex; i < settingsGroups.length; i++) {
                builder.pushGroup(settingsGroups[i], i === startIndex, i === settingsGroups.length - 1);
            }
            return builder.getContent();
        }
    }
    exports.DefaultSettings = DefaultSettings;
    class DefaultSettingsEditorModel extends AbstractSettingsModel {
        constructor(_uri, reference, defaultSettings) {
            super();
            this._uri = _uri;
            this.defaultSettings = defaultSettings;
            this._onDidChangeGroups = this._register(new event_1.Emitter());
            this.onDidChangeGroups = this._onDidChangeGroups.event;
            this._register(defaultSettings.onDidChange(() => this._onDidChangeGroups.fire()));
            this._model = reference.object.textEditorModel;
            this._register(this.onWillDispose(() => reference.dispose()));
        }
        get uri() {
            return this._uri;
        }
        get target() {
            return this.defaultSettings.target;
        }
        get settingsGroups() {
            return this.defaultSettings.getSettingsGroups();
        }
        get filterGroups() {
            // Don't look at "commonly used" for filter
            return this.settingsGroups.slice(1);
        }
        update() {
            if (this._model.isDisposed()) {
                return undefined;
            }
            // Grab current result groups, only render non-empty groups
            const resultGroups = [...this._currentResultGroups.values()]
                .sort((a, b) => a.order - b.order);
            const nonEmptyResultGroups = resultGroups.filter(group => group.result.filterMatches.length);
            const startLine = (0, arrays_1.tail)(this.settingsGroups).range.endLineNumber + 2;
            const { settingsGroups: filteredGroups, matches } = this.writeResultGroups(nonEmptyResultGroups, startLine);
            const metadata = this.collectMetadata(resultGroups);
            return resultGroups.length ?
                {
                    allGroups: this.settingsGroups,
                    filteredGroups,
                    matches,
                    metadata
                } :
                undefined;
        }
        /**
         * Translate the ISearchResultGroups to text, and write it to the editor model
         */
        writeResultGroups(groups, startLine) {
            const contentBuilderOffset = startLine - 1;
            const builder = new SettingsContentBuilder(contentBuilderOffset);
            const settingsGroups = [];
            const matches = [];
            if (groups.length) {
                builder.pushLine(',');
                groups.forEach(resultGroup => {
                    const settingsGroup = this.getGroup(resultGroup);
                    settingsGroups.push(settingsGroup);
                    matches.push(...this.writeSettingsGroupToBuilder(builder, settingsGroup, resultGroup.result.filterMatches));
                });
            }
            // note: 1-indexed line numbers here
            const groupContent = builder.getContent() + '\n';
            const groupEndLine = this._model.getLineCount();
            const cursorPosition = new selection_1.Selection(startLine, 1, startLine, 1);
            const edit = {
                text: groupContent,
                forceMoveMarkers: true,
                range: new range_1.Range(startLine, 1, groupEndLine, 1)
            };
            this._model.pushEditOperations([cursorPosition], [edit], () => [cursorPosition]);
            // Force tokenization now - otherwise it may be slightly delayed, causing a flash of white text
            const tokenizeTo = Math.min(startLine + 60, this._model.getLineCount());
            this._model.tokenization.forceTokenization(tokenizeTo);
            return { matches, settingsGroups };
        }
        writeSettingsGroupToBuilder(builder, settingsGroup, filterMatches) {
            filterMatches = filterMatches
                .map(filteredMatch => {
                // Fix match ranges to offset from setting start line
                return {
                    setting: filteredMatch.setting,
                    score: filteredMatch.score,
                    matches: filteredMatch.matches && filteredMatch.matches.map(match => {
                        return new range_1.Range(match.startLineNumber - filteredMatch.setting.range.startLineNumber, match.startColumn, match.endLineNumber - filteredMatch.setting.range.startLineNumber, match.endColumn);
                    })
                };
            });
            builder.pushGroup(settingsGroup);
            // builder has rewritten settings ranges, fix match ranges
            const fixedMatches = (0, arrays_1.flatten)(filterMatches
                .map(m => m.matches || [])
                .map((settingMatches, i) => {
                const setting = settingsGroup.sections[0].settings[i];
                return settingMatches.map(range => {
                    return new range_1.Range(range.startLineNumber + setting.range.startLineNumber, range.startColumn, range.endLineNumber + setting.range.startLineNumber, range.endColumn);
                });
            }));
            return fixedMatches;
        }
        copySetting(setting) {
            return {
                description: setting.description,
                scope: setting.scope,
                type: setting.type,
                enum: setting.enum,
                enumDescriptions: setting.enumDescriptions,
                key: setting.key,
                value: setting.value,
                range: setting.range,
                overrides: [],
                overrideOf: setting.overrideOf,
                tags: setting.tags,
                deprecationMessage: setting.deprecationMessage,
                keyRange: exports.nullRange,
                valueRange: exports.nullRange,
                descriptionIsMarkdown: undefined,
                descriptionRanges: []
            };
        }
        findValueMatches(filter, setting) {
            return [];
        }
        getPreference(key) {
            for (const group of this.settingsGroups) {
                for (const section of group.sections) {
                    for (const setting of section.settings) {
                        if (setting.key === key) {
                            return setting;
                        }
                    }
                }
            }
            return undefined;
        }
        getGroup(resultGroup) {
            return {
                id: resultGroup.id,
                range: exports.nullRange,
                title: resultGroup.label,
                titleRange: exports.nullRange,
                sections: [
                    {
                        settings: resultGroup.result.filterMatches.map(m => this.copySetting(m.setting))
                    }
                ]
            };
        }
    }
    exports.DefaultSettingsEditorModel = DefaultSettingsEditorModel;
    class SettingsContentBuilder {
        get lineCountWithOffset() {
            return this._contentByLines.length + this._rangeOffset;
        }
        get lastLine() {
            return this._contentByLines[this._contentByLines.length - 1] || '';
        }
        constructor(_rangeOffset = 0) {
            this._rangeOffset = _rangeOffset;
            this._contentByLines = [];
        }
        pushLine(...lineText) {
            this._contentByLines.push(...lineText);
        }
        pushGroup(settingsGroups, isFirst, isLast) {
            this._contentByLines.push(isFirst ? '[{' : '{');
            const lastSetting = this._pushGroup(settingsGroups, '  ');
            if (lastSetting) {
                // Strip the comma from the last setting
                const lineIdx = lastSetting.range.endLineNumber - this._rangeOffset;
                const content = this._contentByLines[lineIdx - 2];
                this._contentByLines[lineIdx - 2] = content.substring(0, content.length - 1);
            }
            this._contentByLines.push(isLast ? '}]' : '},');
        }
        _pushGroup(group, indent) {
            let lastSetting = null;
            const groupStart = this.lineCountWithOffset + 1;
            for (const section of group.sections) {
                if (section.title) {
                    const sectionTitleStart = this.lineCountWithOffset + 1;
                    this.addDescription([section.title], indent, this._contentByLines);
                    section.titleRange = { startLineNumber: sectionTitleStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
                }
                if (section.settings.length) {
                    for (const setting of section.settings) {
                        this.pushSetting(setting, indent);
                        lastSetting = setting;
                    }
                }
            }
            group.range = { startLineNumber: groupStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
            return lastSetting;
        }
        getContent() {
            return this._contentByLines.join('\n');
        }
        pushSetting(setting, indent) {
            const settingStart = this.lineCountWithOffset + 1;
            this.pushSettingDescription(setting, indent);
            let preValueContent = indent;
            const keyString = JSON.stringify(setting.key);
            preValueContent += keyString;
            setting.keyRange = { startLineNumber: this.lineCountWithOffset + 1, startColumn: preValueContent.indexOf(setting.key) + 1, endLineNumber: this.lineCountWithOffset + 1, endColumn: setting.key.length };
            preValueContent += ': ';
            const valueStart = this.lineCountWithOffset + 1;
            this.pushValue(setting, preValueContent, indent);
            setting.valueRange = { startLineNumber: valueStart, startColumn: preValueContent.length + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length + 1 };
            this._contentByLines[this._contentByLines.length - 1] += ',';
            this._contentByLines.push('');
            setting.range = { startLineNumber: settingStart, startColumn: 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length };
        }
        pushSettingDescription(setting, indent) {
            const fixSettingLink = (line) => line.replace(/`#(.*)#`/g, (match, settingName) => `\`${settingName}\``);
            setting.descriptionRanges = [];
            const descriptionPreValue = indent + '// ';
            const deprecationMessageLines = setting.deprecationMessage?.split(/\n/g) ?? [];
            for (let line of [...deprecationMessageLines, ...setting.description]) {
                line = fixSettingLink(line);
                this._contentByLines.push(descriptionPreValue + line);
                setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
            }
            if (setting.enum && setting.enumDescriptions?.some(desc => !!desc)) {
                setting.enumDescriptions.forEach((desc, i) => {
                    const displayEnum = escapeInvisibleChars(String(setting.enum[i]));
                    const line = desc ?
                        `${displayEnum}: ${fixSettingLink(desc)}` :
                        displayEnum;
                    const lines = line.split(/\n/g);
                    lines[0] = ' - ' + lines[0];
                    this._contentByLines.push(...lines.map(l => `${indent}// ${l}`));
                    setting.descriptionRanges.push({ startLineNumber: this.lineCountWithOffset, startColumn: this.lastLine.indexOf(line) + 1, endLineNumber: this.lineCountWithOffset, endColumn: this.lastLine.length });
                });
            }
        }
        pushValue(setting, preValueConent, indent) {
            const valueString = JSON.stringify(setting.value, null, indent);
            if (valueString && (typeof setting.value === 'object')) {
                if (setting.overrides && setting.overrides.length) {
                    this._contentByLines.push(preValueConent + ' {');
                    for (const subSetting of setting.overrides) {
                        this.pushSetting(subSetting, indent + indent);
                        this._contentByLines.pop();
                    }
                    const lastSetting = setting.overrides[setting.overrides.length - 1];
                    const content = this._contentByLines[lastSetting.range.endLineNumber - 2];
                    this._contentByLines[lastSetting.range.endLineNumber - 2] = content.substring(0, content.length - 1);
                    this._contentByLines.push(indent + '}');
                }
                else {
                    const mulitLineValue = valueString.split('\n');
                    this._contentByLines.push(preValueConent + mulitLineValue[0]);
                    for (let i = 1; i < mulitLineValue.length; i++) {
                        this._contentByLines.push(indent + mulitLineValue[i]);
                    }
                }
            }
            else {
                this._contentByLines.push(preValueConent + valueString);
            }
        }
        addDescription(description, indent, result) {
            for (const line of description) {
                result.push(indent + '// ' + line);
            }
        }
    }
    class RawSettingsContentBuilder extends SettingsContentBuilder {
        constructor(indent = '\t') {
            super(0);
            this.indent = indent;
        }
        pushGroup(settingsGroups) {
            this._pushGroup(settingsGroups, this.indent);
        }
    }
    class DefaultRawSettingsEditorModel extends lifecycle_1.Disposable {
        constructor(defaultSettings) {
            super();
            this.defaultSettings = defaultSettings;
            this._content = null;
            this._register(defaultSettings.onDidChange(() => this._content = null));
        }
        get content() {
            if (this._content === null) {
                const builder = new RawSettingsContentBuilder();
                builder.pushLine('{');
                for (const settingsGroup of this.defaultSettings.getRegisteredGroups()) {
                    builder.pushGroup(settingsGroup);
                }
                builder.pushLine('}');
                this._content = builder.getContent();
            }
            return this._content;
        }
    }
    exports.DefaultRawSettingsEditorModel = DefaultRawSettingsEditorModel;
    function escapeInvisibleChars(enumValue) {
        return enumValue && enumValue
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    function defaultKeybindingsContents(keybindingService) {
        const defaultsHeader = '// ' + nls.localize('defaultKeybindingsHeader', "Override key bindings by placing them into your key bindings file.");
        return defaultsHeader + '\n' + keybindingService.getDefaultKeybindingsContent();
    }
    let DefaultKeybindingsEditorModel = class DefaultKeybindingsEditorModel {
        constructor(_uri, keybindingService) {
            this._uri = _uri;
            this.keybindingService = keybindingService;
        }
        get uri() {
            return this._uri;
        }
        get content() {
            if (!this._content) {
                this._content = defaultKeybindingsContents(this.keybindingService);
            }
            return this._content;
        }
        getPreference() {
            return null;
        }
        dispose() {
            // Not disposable
        }
    };
    exports.DefaultKeybindingsEditorModel = DefaultKeybindingsEditorModel;
    exports.DefaultKeybindingsEditorModel = DefaultKeybindingsEditorModel = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], DefaultKeybindingsEditorModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXNNb2RlbHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9wcmVmZXJlbmNlcy9jb21tb24vcHJlZmVyZW5jZXNNb2RlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOG5DaEcsZ0VBR0M7SUExbUNZLFFBQUEsU0FBUyxHQUFXLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDNUcsU0FBUyxXQUFXLENBQUMsS0FBYSxJQUFhLE9BQU8sS0FBSyxDQUFDLGVBQWUsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFekssTUFBZSxxQkFBc0IsU0FBUSx5QkFBVztRQUF4RDs7WUFFVyx5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztRQXlGeEUsQ0FBQztRQXZGQSxpQkFBaUIsQ0FBQyxFQUFVLEVBQUUsV0FBMkM7WUFDeEUsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDakIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDaEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEMsQ0FBQztZQUVELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFD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