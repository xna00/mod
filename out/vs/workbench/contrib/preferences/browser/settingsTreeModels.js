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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/workbench/contrib/preferences/browser/settingsLayout", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/configuration/common/configurationRegistry", "vs/editor/common/languages/language", "vs/platform/registry/common/platform", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/platform/product/common/productService"], function (require, exports, arrays, strings_1, types_1, uri_1, settingsLayout_1, preferences_1, preferences_2, environmentService_1, configuration_1, lifecycle_1, event_1, configurationRegistry_1, language_1, platform_1, userDataProfile_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchResultModel = exports.SearchResultIdx = exports.SettingsTreeModel = exports.SettingsTreeSettingElement = exports.SettingsTreeNewExtensionsElement = exports.SettingsTreeGroupElement = exports.SettingsTreeElement = exports.ONLINE_SERVICES_SETTING_TAG = void 0;
    exports.inspectSetting = inspectSetting;
    exports.settingKeyToDisplayFormat = settingKeyToDisplayFormat;
    exports.parseQuery = parseQuery;
    exports.ONLINE_SERVICES_SETTING_TAG = 'usesOnlineServices';
    class SettingsTreeElement extends lifecycle_1.Disposable {
        constructor(_id) {
            super();
            this._tabbable = false;
            this._onDidChangeTabbable = new event_1.Emitter();
            this.onDidChangeTabbable = this._onDidChangeTabbable.event;
            this.id = _id;
        }
        get tabbable() {
            return this._tabbable;
        }
        set tabbable(value) {
            this._tabbable = value;
            this._onDidChangeTabbable.fire();
        }
    }
    exports.SettingsTreeElement = SettingsTreeElement;
    class SettingsTreeGroupElement extends SettingsTreeElement {
        get children() {
            return this._children;
        }
        set children(newChildren) {
            this._children = newChildren;
            this._childSettingKeys = new Set();
            this._children.forEach(child => {
                if (child instanceof SettingsTreeSettingElement) {
                    this._childSettingKeys.add(child.setting.key);
                }
            });
        }
        constructor(_id, count, label, level, isFirstGroup) {
            super(_id);
            this._childSettingKeys = new Set();
            this._children = [];
            this.count = count;
            this.label = label;
            this.level = level;
            this.isFirstGroup = isFirstGroup;
        }
        /**
         * Returns whether this group contains the given child key (to a depth of 1 only)
         */
        containsSetting(key) {
            return this._childSettingKeys.has(key);
        }
    }
    exports.SettingsTreeGroupElement = SettingsTreeGroupElement;
    class SettingsTreeNewExtensionsElement extends SettingsTreeElement {
        constructor(_id, extensionIds) {
            super(_id);
            this.extensionIds = extensionIds;
        }
    }
    exports.SettingsTreeNewExtensionsElement = SettingsTreeNewExtensionsElement;
    class SettingsTreeSettingElement extends SettingsTreeElement {
        static { this.MAX_DESC_LINES = 20; }
        constructor(setting, parent, settingsTarget, isWorkspaceTrusted, languageFilter, languageService, productService, userDataProfileService, configurationService) {
            super(sanitizeId(parent.id + '_' + setting.key));
            this.settingsTarget = settingsTarget;
            this.isWorkspaceTrusted = isWorkspaceTrusted;
            this.languageFilter = languageFilter;
            this.languageService = languageService;
            this.productService = productService;
            this.userDataProfileService = userDataProfileService;
            this.configurationService = configurationService;
            this._displayCategory = null;
            this._displayLabel = null;
            /**
             * Whether the setting is configured in the selected scope.
             */
            this.isConfigured = false;
            /**
             * Whether the setting requires trusted target
             */
            this.isUntrusted = false;
            /**
             * Whether the setting is under a policy that blocks all changes.
             */
            this.hasPolicyValue = false;
            this.overriddenScopeList = [];
            this.overriddenDefaultsLanguageList = [];
            /**
             * For each language that contributes setting values or default overrides, we can see those values here.
             */
            this.languageOverrideValues = new Map();
            this.setting = setting;
            this.parent = parent;
            // Make sure description and valueType are initialized
            this.initSettingDescription();
            this.initSettingValueType();
        }
        get displayCategory() {
            if (!this._displayCategory) {
                this.initLabels();
            }
            return this._displayCategory;
        }
        get displayLabel() {
            if (!this._displayLabel) {
                this.initLabels();
            }
            return this._displayLabel;
        }
        initLabels() {
            if (this.setting.title) {
                this._displayLabel = this.setting.title;
                this._displayCategory = '';
                return;
            }
            const displayKeyFormat = settingKeyToDisplayFormat(this.setting.key, this.parent.id, this.setting.isLanguageTagSetting);
            this._displayLabel = displayKeyFormat.label;
            this._displayCategory = displayKeyFormat.category;
        }
        initSettingDescription() {
            if (this.setting.description.length > SettingsTreeSettingElement.MAX_DESC_LINES) {
                const truncatedDescLines = this.setting.description.slice(0, SettingsTreeSettingElement.MAX_DESC_LINES);
                truncatedDescLines.push('[...]');
                this.description = truncatedDescLines.join('\n');
            }
            else {
                this.description = this.setting.description.join('\n');
            }
        }
        initSettingValueType() {
            if (isExtensionToggleSetting(this.setting, this.productService)) {
                this.valueType = preferences_2.SettingValueType.ExtensionToggle;
            }
            else if (this.setting.enum && (!this.setting.type || settingTypeEnumRenderable(this.setting.type))) {
                this.valueType = preferences_2.SettingValueType.Enum;
            }
            else if (this.setting.type === 'string') {
                if (this.setting.editPresentation === configurationRegistry_1.EditPresentationTypes.Multiline) {
                    this.valueType = preferences_2.SettingValueType.MultilineString;
                }
                else {
                    this.valueType = preferences_2.SettingValueType.String;
                }
            }
            else if (isExcludeSetting(this.setting)) {
                this.valueType = preferences_2.SettingValueType.Exclude;
            }
            else if (isIncludeSetting(this.setting)) {
                this.valueType = preferences_2.SettingValueType.Include;
            }
            else if (this.setting.type === 'integer') {
                this.valueType = preferences_2.SettingValueType.Integer;
            }
            else if (this.setting.type === 'number') {
                this.valueType = preferences_2.SettingValueType.Number;
            }
            else if (this.setting.type === 'boolean') {
                this.valueType = preferences_2.SettingValueType.Boolean;
            }
            else if (this.setting.type === 'array' && this.setting.arrayItemType &&
                ['string', 'enum', 'number', 'integer'].includes(this.setting.arrayItemType)) {
                this.valueType = preferences_2.SettingValueType.Array;
            }
            else if (Array.isArray(this.setting.type) && this.setting.type.includes(preferences_2.SettingValueType.Null) && this.setting.type.length === 2) {
                if (this.setting.type.includes(preferences_2.SettingValueType.Integer)) {
                    this.valueType = preferences_2.SettingValueType.NullableInteger;
                }
                else if (this.setting.type.includes(preferences_2.SettingValueType.Number)) {
                    this.valueType = preferences_2.SettingValueType.NullableNumber;
                }
                else {
                    this.valueType = preferences_2.SettingValueType.Complex;
                }
            }
            else if (isObjectSetting(this.setting)) {
                if (this.setting.allKeysAreBoolean) {
                    this.valueType = preferences_2.SettingValueType.BooleanObject;
                }
                else {
                    this.valueType = preferences_2.SettingValueType.Object;
                }
            }
            else if (this.setting.isLanguageTagSetting) {
                this.valueType = preferences_2.SettingValueType.LanguageTag;
            }
            else {
                this.valueType = preferences_2.SettingValueType.Complex;
            }
        }
        inspectSelf() {
            const targetToInspect = this.getTargetToInspect(this.setting);
            const inspectResult = inspectSetting(this.setting.key, targetToInspect, this.languageFilter, this.configurationService);
            this.update(inspectResult, this.isWorkspaceTrusted);
        }
        getTargetToInspect(setting) {
            if (!this.userDataProfileService.currentProfile.isDefault && !this.userDataProfileService.currentProfile.useDefaultFlags?.settings) {
                if (setting.scope === 1 /* ConfigurationScope.APPLICATION */) {
                    return 1 /* ConfigurationTarget.APPLICATION */;
                }
                if (this.configurationService.isSettingAppliedForAllProfiles(setting.key) && this.settingsTarget === 3 /* ConfigurationTarget.USER_LOCAL */) {
                    return 1 /* ConfigurationTarget.APPLICATION */;
                }
            }
            return this.settingsTarget;
        }
        update(inspectResult, isWorkspaceTrusted) {
            let { isConfigured, inspected, targetSelector, inspectedLanguageOverrides, languageSelector } = inspectResult;
            switch (targetSelector) {
                case 'workspaceFolderValue':
                case 'workspaceValue':
                    this.isUntrusted = !!this.setting.restricted && !isWorkspaceTrusted;
                    break;
            }
            let displayValue = isConfigured ? inspected[targetSelector] : inspected.defaultValue;
            const overriddenScopeList = [];
            const overriddenDefaultsLanguageList = [];
            if ((languageSelector || targetSelector !== 'workspaceValue') && typeof inspected.workspaceValue !== 'undefined') {
                overriddenScopeList.push('workspace:');
            }
            if ((languageSelector || targetSelector !== 'userRemoteValue') && typeof inspected.userRemoteValue !== 'undefined') {
                overriddenScopeList.push('remote:');
            }
            if ((languageSelector || targetSelector !== 'userLocalValue') && typeof inspected.userLocalValue !== 'undefined') {
                overriddenScopeList.push('user:');
            }
            if (inspected.overrideIdentifiers) {
                for (const overrideIdentifier of inspected.overrideIdentifiers) {
                    const inspectedOverride = inspectedLanguageOverrides.get(overrideIdentifier);
                    if (inspectedOverride) {
                        if (this.languageService.isRegisteredLanguageId(overrideIdentifier)) {
                            if (languageSelector !== overrideIdentifier && typeof inspectedOverride.default?.override !== 'undefined') {
                                overriddenDefaultsLanguageList.push(overrideIdentifier);
                            }
                            if ((languageSelector !== overrideIdentifier || targetSelector !== 'workspaceValue') && typeof inspectedOverride.workspace?.override !== 'undefined') {
                                overriddenScopeList.push(`workspace:${overrideIdentifier}`);
                            }
                            if ((languageSelector !== overrideIdentifier || targetSelector !== 'userRemoteValue') && typeof inspectedOverride.userRemote?.override !== 'undefined') {
                                overriddenScopeList.push(`remote:${overrideIdentifier}`);
                            }
                            if ((languageSelector !== overrideIdentifier || targetSelector !== 'userLocalValue') && typeof inspectedOverride.userLocal?.override !== 'undefined') {
                                overriddenScopeList.push(`user:${overrideIdentifier}`);
                            }
                        }
                        this.languageOverrideValues.set(overrideIdentifier, inspectedOverride);
                    }
                }
            }
            this.overriddenScopeList = overriddenScopeList;
            this.overriddenDefaultsLanguageList = overriddenDefaultsLanguageList;
            // The user might have added, removed, or modified a language filter,
            // so we reset the default value source to the non-language-specific default value source for now.
            this.defaultValueSource = this.setting.nonLanguageSpecificDefaultValueSource;
            if (inspected.policyValue) {
                this.hasPolicyValue = true;
                isConfigured = false; // The user did not manually configure the setting themselves.
                displayValue = inspected.policyValue;
                this.scopeValue = inspected.policyValue;
                this.defaultValue = inspected.defaultValue;
            }
            else if (languageSelector && this.languageOverrideValues.has(languageSelector)) {
                const overrideValues = this.languageOverrideValues.get(languageSelector);
                // In the worst case, go back to using the previous display value.
                // Also, sometimes the override is in the form of a default value override, so consider that second.
                displayValue = (isConfigured ? overrideValues[targetSelector] : overrideValues.defaultValue) ?? displayValue;
                this.scopeValue = isConfigured && overrideValues[targetSelector];
                this.defaultValue = overrideValues.defaultValue ?? inspected.defaultValue;
                const registryValues = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationDefaultsOverrides();
                const overrideValueSource = registryValues.get(`[${languageSelector}]`)?.valuesSources?.get(this.setting.key);
                if (overrideValueSource) {
                    this.defaultValueSource = overrideValueSource;
                }
            }
            else {
                this.scopeValue = isConfigured && inspected[targetSelector];
                this.defaultValue = inspected.defaultValue;
            }
            this.value = displayValue;
            this.isConfigured = isConfigured;
            if (isConfigured || this.setting.tags || this.tags || this.setting.restricted || this.hasPolicyValue) {
                // Don't create an empty Set for all 1000 settings, only if needed
                this.tags = new Set();
                if (isConfigured) {
                    this.tags.add(preferences_1.MODIFIED_SETTING_TAG);
                }
                this.setting.tags?.forEach(tag => this.tags.add(tag));
                if (this.setting.restricted) {
                    this.tags.add(preferences_1.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG);
                }
                if (this.hasPolicyValue) {
                    this.tags.add(preferences_1.POLICY_SETTING_TAG);
                }
            }
        }
        matchesAllTags(tagFilters) {
            if (!tagFilters?.size) {
                // This setting, which may have tags,
                // matches against a query with no tags.
                return true;
            }
            if (!this.tags) {
                // The setting must inspect itself to get tag information
                // including for the hasPolicy tag.
                this.inspectSelf();
            }
            // Check that the filter tags are a subset of this setting's tags
            return !!this.tags?.size &&
                Array.from(tagFilters).every(tag => this.tags.has(tag));
        }
        matchesScope(scope, isRemote) {
            const configTarget = uri_1.URI.isUri(scope) ? 6 /* ConfigurationTarget.WORKSPACE_FOLDER */ : scope;
            if (!this.setting.scope) {
                return true;
            }
            if (configTarget === 1 /* ConfigurationTarget.APPLICATION */) {
                return configuration_1.APPLICATION_SCOPES.includes(this.setting.scope);
            }
            if (configTarget === 6 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return configuration_1.FOLDER_SCOPES.includes(this.setting.scope);
            }
            if (configTarget === 5 /* ConfigurationTarget.WORKSPACE */) {
                return configuration_1.WORKSPACE_SCOPES.includes(this.setting.scope);
            }
            if (configTarget === 4 /* ConfigurationTarget.USER_REMOTE */) {
                return configuration_1.REMOTE_MACHINE_SCOPES.includes(this.setting.scope);
            }
            if (configTarget === 3 /* ConfigurationTarget.USER_LOCAL */) {
                if (isRemote) {
                    return configuration_1.LOCAL_MACHINE_SCOPES.includes(this.setting.scope);
                }
            }
            return true;
        }
        matchesAnyExtension(extensionFilters) {
            if (!extensionFilters || !extensionFilters.size) {
                return true;
            }
            if (!this.setting.extensionInfo) {
                return false;
            }
            return Array.from(extensionFilters).some(extensionId => extensionId.toLowerCase() === this.setting.extensionInfo.id.toLowerCase());
        }
        matchesAnyFeature(featureFilters) {
            if (!featureFilters || !featureFilters.size) {
                return true;
            }
            const features = settingsLayout_1.tocData.children.find(child => child.id === 'features');
            return Array.from(featureFilters).some(filter => {
                if (features && features.children) {
                    const feature = features.children.find(feature => 'features/' + filter === feature.id);
                    if (feature) {
                        const patterns = feature.settings?.map(setting => createSettingMatchRegExp(setting));
                        return patterns && !this.setting.extensionInfo && patterns.some(pattern => pattern.test(this.setting.key.toLowerCase()));
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            });
        }
        matchesAnyId(idFilters) {
            if (!idFilters || !idFilters.size) {
                return true;
            }
            return idFilters.has(this.setting.key);
        }
        matchesAllLanguages(languageFilter) {
            if (!languageFilter) {
                // We're not filtering by language.
                return true;
            }
            if (!this.languageService.isRegisteredLanguageId(languageFilter)) {
                // We're trying to filter by an invalid language.
                return false;
            }
            // We have a language filter in the search widget at this point.
            // We decide to show all language overridable settings to make the
            // lang filter act more like a scope filter,
            // rather than adding on an implicit @modified as well.
            if (this.setting.scope === 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */) {
                return true;
            }
            return false;
        }
    }
    exports.SettingsTreeSettingElement = SettingsTreeSettingElement;
    function createSettingMatchRegExp(pattern) {
        pattern = (0, strings_1.escapeRegExpCharacters)(pattern)
            .replace(/\\\*/g, '.*');
        return new RegExp(`^${pattern}$`, 'i');
    }
    let SettingsTreeModel = class SettingsTreeModel {
        constructor(_viewState, _isWorkspaceTrusted, _configurationService, _languageService, _userDataProfileService, _productService) {
            this._viewState = _viewState;
            this._isWorkspaceTrusted = _isWorkspaceTrusted;
            this._configurationService = _configurationService;
            this._languageService = _languageService;
            this._userDataProfileService = _userDataProfileService;
            this._productService = _productService;
            this._treeElementsBySettingName = new Map();
        }
        get root() {
            return this._root;
        }
        update(newTocRoot = this._tocRoot) {
            this._treeElementsBySettingName.clear();
            const newRoot = this.createSettingsTreeGroupElement(newTocRoot);
            if (newRoot.children[0] instanceof SettingsTreeGroupElement) {
                newRoot.children[0].isFirstGroup = true;
            }
            if (this._root) {
                this.disposeChildren(this._root.children);
                this._root.children = newRoot.children;
            }
            else {
                this._root = newRoot;
            }
        }
        updateWorkspaceTrust(workspaceTrusted) {
            this._isWorkspaceTrusted = workspaceTrusted;
            this.updateRequireTrustedTargetElements();
        }
        disposeChildren(children) {
            for (const child of children) {
                this.recursiveDispose(child);
            }
        }
        recursiveDispose(element) {
            if (element instanceof SettingsTreeGroupElement) {
                this.disposeChildren(element.children);
            }
            element.dispose();
        }
        getElementsByName(name) {
            return this._treeElementsBySettingName.get(name) ?? null;
        }
        updateElementsByName(name) {
            if (!this._treeElementsBySettingName.has(name)) {
                return;
            }
            this.reinspectSettings(this._treeElementsBySettingName.get(name));
        }
        updateRequireTrustedTargetElements() {
            this.reinspectSettings([...this._treeElementsBySettingName.values()].flat().filter(s => s.isUntrusted));
        }
        reinspectSettings(settings) {
            for (const element of settings) {
                element.inspectSelf();
            }
        }
        createSettingsTreeGroupElement(tocEntry, parent) {
            const depth = parent ? this.getDepth(parent) + 1 : 0;
            const element = new SettingsTreeGroupElement(tocEntry.id, undefined, tocEntry.label, depth, false);
            element.parent = parent;
            const children = [];
            if (tocEntry.settings) {
                const settingChildren = tocEntry.settings.map(s => this.createSettingsTreeSettingElement(s, element))
                    .filter(el => el.setting.deprecationMessage ? el.isConfigured : true);
                children.push(...settingChildren);
            }
            if (tocEntry.children) {
                const groupChildren = tocEntry.children.map(child => this.createSettingsTreeGroupElement(child, element));
                children.push(...groupChildren);
            }
            element.children = children;
            return element;
        }
        getDepth(element) {
            if (element.parent) {
                return 1 + this.getDepth(element.parent);
            }
            else {
                return 0;
            }
        }
        createSettingsTreeSettingElement(setting, parent) {
            const element = new SettingsTreeSettingElement(setting, parent, this._viewState.settingsTarget, this._isWorkspaceTrusted, this._viewState.languageFilter, this._languageService, this._productService, this._userDataProfileService, this._configurationService);
            const nameElements = this._treeElementsBySettingName.get(setting.key) || [];
            nameElements.push(element);
            this._treeElementsBySettingName.set(setting.key, nameElements);
            return element;
        }
    };
    exports.SettingsTreeModel = SettingsTreeModel;
    exports.SettingsTreeModel = SettingsTreeModel = __decorate([
        __param(2, configuration_1.IWorkbenchConfigurationService),
        __param(3, language_1.ILanguageService),
        __param(4, userDataProfile_1.IUserDataProfileService),
        __param(5, productService_1.IProductService)
    ], SettingsTreeModel);
    function inspectSetting(key, target, languageFilter, configurationService) {
        const inspectOverrides = uri_1.URI.isUri(target) ? { resource: target } : undefined;
        const inspected = configurationService.inspect(key, inspectOverrides);
        const targetSelector = target === 1 /* ConfigurationTarget.APPLICATION */ ? 'applicationValue' :
            target === 3 /* ConfigurationTarget.USER_LOCAL */ ? 'userLocalValue' :
                target === 4 /* ConfigurationTarget.USER_REMOTE */ ? 'userRemoteValue' :
                    target === 5 /* ConfigurationTarget.WORKSPACE */ ? 'workspaceValue' :
                        'workspaceFolderValue';
        const targetOverrideSelector = target === 1 /* ConfigurationTarget.APPLICATION */ ? 'application' :
            target === 3 /* ConfigurationTarget.USER_LOCAL */ ? 'userLocal' :
                target === 4 /* ConfigurationTarget.USER_REMOTE */ ? 'userRemote' :
                    target === 5 /* ConfigurationTarget.WORKSPACE */ ? 'workspace' :
                        'workspaceFolder';
        let isConfigured = typeof inspected[targetSelector] !== 'undefined';
        const overrideIdentifiers = inspected.overrideIdentifiers;
        const inspectedLanguageOverrides = new Map();
        // We must reset isConfigured to be false if languageFilter is set, and manually
        // determine whether it can be set to true later.
        if (languageFilter) {
            isConfigured = false;
        }
        if (overrideIdentifiers) {
            // The setting we're looking at has language overrides.
            for (const overrideIdentifier of overrideIdentifiers) {
                inspectedLanguageOverrides.set(overrideIdentifier, configurationService.inspect(key, { overrideIdentifier }));
            }
            // For all language filters, see if there's an override for that filter.
            if (languageFilter) {
                if (inspectedLanguageOverrides.has(languageFilter)) {
                    const overrideValue = inspectedLanguageOverrides.get(languageFilter)[targetOverrideSelector]?.override;
                    if (typeof overrideValue !== 'undefined') {
                        isConfigured = true;
                    }
                }
            }
        }
        return { isConfigured, inspected, targetSelector, inspectedLanguageOverrides, languageSelector: languageFilter };
    }
    function sanitizeId(id) {
        return id.replace(/[\.\/]/, '_');
    }
    function settingKeyToDisplayFormat(key, groupId = '', isLanguageTagSetting = false) {
        const lastDotIdx = key.lastIndexOf('.');
        let category = '';
        if (lastDotIdx >= 0) {
            category = key.substring(0, lastDotIdx);
            key = key.substring(lastDotIdx + 1);
        }
        groupId = groupId.replace(/\//g, '.');
        category = trimCategoryForGroup(category, groupId);
        category = wordifyKey(category);
        if (isLanguageTagSetting) {
            key = key.replace(/[\[\]]/g, '');
            key = '$(bracket) ' + key;
        }
        const label = wordifyKey(key);
        return { category, label };
    }
    function wordifyKey(key) {
        key = key
            .replace(/\.([a-z0-9])/g, (_, p1) => ` \u203A ${p1.toUpperCase()}`) // Replace dot with spaced '>'
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Camel case to spacing, fooBar => foo Bar
            .replace(/^[a-z]/g, match => match.toUpperCase()) // Upper casing all first letters, foo => Foo
            .replace(/\b\w+\b/g, match => {
            return settingsLayout_1.knownAcronyms.has(match.toLowerCase()) ?
                match.toUpperCase() :
                match;
        });
        for (const [k, v] of settingsLayout_1.knownTermMappings) {
            key = key.replace(new RegExp(`\\b${k}\\b`, 'gi'), v);
        }
        return key;
    }
    /**
     * Removes redundant sections of the category label.
     * A redundant section is a section already reflected in the groupId.
     *
     * @param category The category of the specific setting.
     * @param groupId The author + extension ID.
     * @returns The new category label to use.
     */
    function trimCategoryForGroup(category, groupId) {
        const doTrim = (forward) => {
            // Remove the Insiders portion if the category doesn't use it.
            if (!/insiders$/i.test(category)) {
                groupId = groupId.replace(/-?insiders$/i, '');
            }
            const parts = groupId.split('.')
                .map(part => {
                // Remove hyphens, but only if that results in a match with the category.
                if (part.replace(/-/g, '').toLowerCase() === category.toLowerCase()) {
                    return part.replace(/-/g, '');
                }
                else {
                    return part;
                }
            });
            while (parts.length) {
                const reg = new RegExp(`^${parts.join('\\.')}(\\.|$)`, 'i');
                if (reg.test(category)) {
                    return category.replace(reg, '');
                }
                if (forward) {
                    parts.pop();
                }
                else {
                    parts.shift();
                }
            }
            return null;
        };
        let trimmed = doTrim(true);
        if (trimmed === null) {
            trimmed = doTrim(false);
        }
        if (trimmed === null) {
            trimmed = category;
        }
        return trimmed;
    }
    function isExtensionToggleSetting(setting, productService) {
        return preferences_1.ENABLE_EXTENSION_TOGGLE_SETTINGS &&
            !!productService.extensionRecommendations &&
            !!setting.displayExtensionId;
    }
    function isExcludeSetting(setting) {
        return setting.key === 'files.exclude' ||
            setting.key === 'search.exclude' ||
            setting.key === 'workbench.localHistory.exclude' ||
            setting.key === 'explorer.autoRevealExclude' ||
            setting.key === 'files.readonlyExclude' ||
            setting.key === 'files.watcherExclude';
    }
    function isIncludeSetting(setting) {
        return setting.key === 'files.readonlyInclude';
    }
    function isObjectRenderableSchema({ type }) {
        return type === 'string' || type === 'boolean' || type === 'integer' || type === 'number';
    }
    function isObjectSetting({ type, objectProperties, objectPatternProperties, objectAdditionalProperties }) {
        if (type !== 'object') {
            return false;
        }
        // object can have any shape
        if ((0, types_1.isUndefinedOrNull)(objectProperties) &&
            (0, types_1.isUndefinedOrNull)(objectPatternProperties) &&
            (0, types_1.isUndefinedOrNull)(objectAdditionalProperties)) {
            return false;
        }
        // objectAdditionalProperties allow the setting to have any shape,
        // but if there's a pattern property that handles everything, then every
        // property will match that patternProperty, so we don't need to look at
        // the value of objectAdditionalProperties in that case.
        if ((objectAdditionalProperties === true || objectAdditionalProperties === undefined)
            && !Object.keys(objectPatternProperties ?? {}).includes('.*')) {
            return false;
        }
        const schemas = [...Object.values(objectProperties ?? {}), ...Object.values(objectPatternProperties ?? {})];
        if (objectAdditionalProperties && typeof objectAdditionalProperties === 'object') {
            schemas.push(objectAdditionalProperties);
        }
        // Flatten anyof schemas
        const flatSchemas = schemas.map((schema) => {
            if (Array.isArray(schema.anyOf)) {
                return schema.anyOf;
            }
            return [schema];
        }).flat();
        return flatSchemas.every(isObjectRenderableSchema);
    }
    function settingTypeEnumRenderable(_type) {
        const enumRenderableSettingTypes = ['string', 'boolean', 'null', 'integer', 'number'];
        const type = Array.isArray(_type) ? _type : [_type];
        return type.every(type => enumRenderableSettingTypes.includes(type));
    }
    var SearchResultIdx;
    (function (SearchResultIdx) {
        SearchResultIdx[SearchResultIdx["Local"] = 0] = "Local";
        SearchResultIdx[SearchResultIdx["Remote"] = 1] = "Remote";
        SearchResultIdx[SearchResultIdx["NewExtensions"] = 2] = "NewExtensions";
    })(SearchResultIdx || (exports.SearchResultIdx = SearchResultIdx = {}));
    let SearchResultModel = class SearchResultModel extends SettingsTreeModel {
        constructor(viewState, settingsOrderByTocIndex, isWorkspaceTrusted, configurationService, environmentService, languageService, userDataProfileService, productService) {
            super(viewState, isWorkspaceTrusted, configurationService, languageService, userDataProfileService, productService);
            this.environmentService = environmentService;
            this.rawSearchResults = null;
            this.cachedUniqueSearchResults = null;
            this.newExtensionSearchResults = null;
            this.searchResultCount = null;
            this.id = 'searchResultModel';
            this.settingsOrderByTocIndex = settingsOrderByTocIndex;
            this.update({ id: 'searchResultModel', label: '' });
        }
        sortResults(filterMatches) {
            if (this.settingsOrderByTocIndex) {
                for (const match of filterMatches) {
                    match.setting.internalOrder = this.settingsOrderByTocIndex.get(match.setting.key);
                }
            }
            // The search only has filters, so we can sort by the order in the TOC.
            if (!this._viewState.query) {
                return filterMatches.sort((a, b) => (0, preferences_1.compareTwoNullableNumbers)(a.setting.internalOrder, b.setting.internalOrder));
            }
            // Sort the settings according to their relevancy.
            // https://github.com/microsoft/vscode/issues/197773
            filterMatches.sort((a, b) => {
                if (a.matchType !== b.matchType) {
                    // Sort by match type if the match types are not the same.
                    // The priority of the match type is given by the SettingMatchType enum.
                    return b.matchType - a.matchType;
                }
                else if (a.matchType === preferences_2.SettingMatchType.RemoteMatch) {
                    // The match types are the same and are RemoteMatch.
                    // Sort by score.
                    return b.score - a.score;
                }
                else {
                    // The match types are the same but are not RemoteMatch.
                    // Sort by their order in the table of contents.
                    return (0, preferences_1.compareTwoNullableNumbers)(a.setting.internalOrder, b.setting.internalOrder);
                }
            });
            // Remove duplicates, which sometimes occur with settings
            // such as the experimental toggle setting.
            return arrays.distinct(filterMatches, (match) => match.setting.key);
        }
        getUniqueResults() {
            if (this.cachedUniqueSearchResults) {
                return this.cachedUniqueSearchResults;
            }
            if (!this.rawSearchResults) {
                return null;
            }
            let combinedFilterMatches = [];
            const localMatchKeys = new Set();
            const localResult = this.rawSearchResults[0 /* SearchResultIdx.Local */];
            if (localResult) {
                localResult.filterMatches.forEach(m => localMatchKeys.add(m.setting.key));
                combinedFilterMatches = localResult.filterMatches;
            }
            const remoteResult = this.rawSearchResults[1 /* SearchResultIdx.Remote */];
            if (remoteResult) {
                remoteResult.filterMatches = remoteResult.filterMatches.filter(m => !localMatchKeys.has(m.setting.key));
                combinedFilterMatches = combinedFilterMatches.concat(remoteResult.filterMatches);
                this.newExtensionSearchResults = this.rawSearchResults[2 /* SearchResultIdx.NewExtensions */];
            }
            combinedFilterMatches = this.sortResults(combinedFilterMatches);
            this.cachedUniqueSearchResults = {
                filterMatches: combinedFilterMatches,
                exactMatch: localResult?.exactMatch || remoteResult?.exactMatch
            };
            return this.cachedUniqueSearchResults;
        }
        getRawResults() {
            return this.rawSearchResults || [];
        }
        setResult(order, result) {
            this.cachedUniqueSearchResults = null;
            this.newExtensionSearchResults = null;
            this.rawSearchResults = this.rawSearchResults || [];
            if (!result) {
                delete this.rawSearchResults[order];
                return;
            }
            if (result.exactMatch) {
                this.rawSearchResults = [];
            }
            this.rawSearchResults[order] = result;
            this.updateChildren();
        }
        updateChildren() {
            this.update({
                id: 'searchResultModel',
                label: 'searchResultModel',
                settings: this.getFlatSettings()
            });
            // Save time, filter children in the search model instead of relying on the tree filter, which still requires heights to be calculated.
            const isRemote = !!this.environmentService.remoteAuthority;
            this.root.children = this.root.children
                .filter(child => child instanceof SettingsTreeSettingElement && child.matchesAllTags(this._viewState.tagFilters) && child.matchesScope(this._viewState.settingsTarget, isRemote) && child.matchesAnyExtension(this._viewState.extensionFilters) && child.matchesAnyId(this._viewState.idFilters) && child.matchesAnyFeature(this._viewState.featureFilters) && child.matchesAllLanguages(this._viewState.languageFilter));
            this.searchResultCount = this.root.children.length;
            if (this.newExtensionSearchResults?.filterMatches.length) {
                let resultExtensionIds = this.newExtensionSearchResults.filterMatches
                    .map(result => result.setting)
                    .filter(setting => setting.extensionName && setting.extensionPublisher)
                    .map(setting => `${setting.extensionPublisher}.${setting.extensionName}`);
                resultExtensionIds = arrays.distinct(resultExtensionIds);
                if (resultExtensionIds.length) {
                    const newExtElement = new SettingsTreeNewExtensionsElement('newExtensions', resultExtensionIds);
                    newExtElement.parent = this._root;
                    this._root.children.push(newExtElement);
                }
            }
        }
        getUniqueResultsCount() {
            return this.searchResultCount ?? 0;
        }
        getFlatSettings() {
            return this.getUniqueResults()?.filterMatches.map(m => m.setting) ?? [];
        }
    };
    exports.SearchResultModel = SearchResultModel;
    exports.SearchResultModel = SearchResultModel = __decorate([
        __param(3, configuration_1.IWorkbenchConfigurationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, language_1.ILanguageService),
        __param(6, userDataProfile_1.IUserDataProfileService),
        __param(7, productService_1.IProductService)
    ], SearchResultModel);
    const tagRegex = /(^|\s)@tag:("([^"]*)"|[^"]\S*)/g;
    const extensionRegex = /(^|\s)@ext:("([^"]*)"|[^"]\S*)?/g;
    const featureRegex = /(^|\s)@feature:("([^"]*)"|[^"]\S*)?/g;
    const idRegex = /(^|\s)@id:("([^"]*)"|[^"]\S*)?/g;
    const languageRegex = /(^|\s)@lang:("([^"]*)"|[^"]\S*)?/g;
    function parseQuery(query) {
        /**
         * A helper function to parse the query on one type of regex.
         *
         * @param query The search query
         * @param filterRegex The regex to use on the query
         * @param parsedParts The parts that the regex parses out will be appended to the array passed in here.
         * @returns The query with the parsed parts removed
         */
        function getTagsForType(query, filterRegex, parsedParts) {
            return query.replace(filterRegex, (_, __, quotedParsedElement, unquotedParsedElement) => {
                const parsedElement = unquotedParsedElement || quotedParsedElement;
                if (parsedElement) {
                    parsedParts.push(...parsedElement.split(',').map(s => s.trim()).filter(s => !(0, strings_1.isFalsyOrWhitespace)(s)));
                }
                return '';
            });
        }
        const tags = [];
        query = query.replace(tagRegex, (_, __, quotedTag, tag) => {
            tags.push(tag || quotedTag);
            return '';
        });
        query = query.replace(`@${preferences_1.MODIFIED_SETTING_TAG}`, () => {
            tags.push(preferences_1.MODIFIED_SETTING_TAG);
            return '';
        });
        query = query.replace(`@${preferences_1.POLICY_SETTING_TAG}`, () => {
            tags.push(preferences_1.POLICY_SETTING_TAG);
            return '';
        });
        const extensions = [];
        const features = [];
        const ids = [];
        const langs = [];
        query = getTagsForType(query, extensionRegex, extensions);
        query = getTagsForType(query, featureRegex, features);
        query = getTagsForType(query, idRegex, ids);
        if (preferences_1.ENABLE_LANGUAGE_FILTER) {
            query = getTagsForType(query, languageRegex, langs);
        }
        query = query.trim();
        // For now, only return the first found language filter
        return {
            tags,
            extensionFilters: extensions,
            featureFilters: features,
            idFilters: ids,
            languageFilter: langs.length ? langs[0] : undefined,
            query,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NUcmVlTW9kZWxzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3NldHRpbmdzVHJlZU1vZGVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEybkJoRyx3Q0F5Q0M7SUFNRCw4REFtQkM7SUFpVUQsZ0NBMERDO0lBbGlDWSxRQUFBLDJCQUEyQixHQUFHLG9CQUFvQixDQUFDO0lBYWhFLE1BQXNCLG1CQUFvQixTQUFRLHNCQUFVO1FBUTNELFlBQVksR0FBVztZQUN0QixLQUFLLEVBQUUsQ0FBQztZQUxELGNBQVMsR0FBRyxLQUFLLENBQUM7WUFDUCx5QkFBb0IsR0FBRyxJQUFJLGVBQU8sRUFBUSxDQUFDO1lBQ3JELHdCQUFtQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFJOUQsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7UUFDZixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxLQUFjO1lBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQ0Q7SUFyQkQsa0RBcUJDO0lBSUQsTUFBYSx3QkFBeUIsU0FBUSxtQkFBbUI7UUFTaEUsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxXQUFxQztZQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUU3QixJQUFJLENBQUMsaUJB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