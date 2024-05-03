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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/markdownRenderer", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/list/list", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/selectBox/selectBox", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/tree/abstractTree", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/codicons", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types", "vs/editor/common/languages/language", "vs/editor/browser/widget/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/browser/defaultStyles", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/workbench/contrib/preferences/browser/settingsEditorSettingIndicators", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/browser/settingsWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesValidation", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, canIUse_1, DOM, keyboardEvent_1, markdownRenderer_1, aria, button_1, simpleIconLabel_1, inputBox_1, list_1, listWidget_1, selectBox_1, toggle_1, toolbar_1, abstractTree_1, objectTreeModel_1, actions_1, arrays_1, codicons_1, errors_1, event_1, lifecycle_1, platform_1, strings_1, types_1, language_1, markdownRenderer_2, nls_1, clipboardService_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, opener_1, productService_1, telemetry_1, defaultStyles_1, colorRegistry_1, themeService_1, userDataProfile_1, settingsMerge_1, userDataSync_1, extensions_1, preferencesIcons_1, settingsEditorSettingIndicators_1, settingsTreeModels_1, settingsWidgets_1, preferences_1, settingsEditorColorRegistry_1, configuration_2, environmentService_1, extensions_2, preferences_2, preferencesValidation_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    var AbstractSettingRenderer_1, CopySettingIdAction_1, CopySettingAsJSONAction_1, SyncSettingAction_1, ApplySettingToAllProfilesAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsTree = exports.NonCollapsibleObjectTreeModel = exports.SettingsTreeFilter = exports.SettingTreeRenderers = exports.SettingsExtensionToggleRenderer = exports.SettingBoolRenderer = exports.SettingNumberRenderer = exports.SettingEnumRenderer = exports.SettingIncludeRenderer = exports.SettingExcludeRenderer = exports.SettingComplexRenderer = exports.SettingNewExtensionsRenderer = exports.SettingGroupRenderer = exports.AbstractSettingRenderer = void 0;
    exports.resolveSettingsTree = resolveSettingsTree;
    exports.resolveConfiguredUntrustedSettings = resolveConfiguredUntrustedSettings;
    exports.createTocTreeForExtensionSettings = createTocTreeForExtensionSettings;
    exports.createSettingMatchRegExp = createSettingMatchRegExp;
    const $ = DOM.$;
    function getIncludeExcludeDisplayValue(element) {
        const data = element.isConfigured ?
            { ...element.defaultValue, ...element.scopeValue } :
            element.defaultValue;
        return Object.keys(data)
            .filter(key => !!data[key])
            .map(key => {
            const value = data[key];
            const sibling = typeof value === 'boolean' ? undefined : value.when;
            return {
                value: {
                    type: 'string',
                    data: key
                },
                sibling,
                elementType: element.valueType
            };
        });
    }
    function areAllPropertiesDefined(properties, itemsToDisplay) {
        const staticProperties = new Set(properties);
        itemsToDisplay.forEach(({ key }) => staticProperties.delete(key.data));
        return staticProperties.size === 0;
    }
    function getEnumOptionsFromSchema(schema) {
        if (schema.anyOf) {
            return schema.anyOf.map(getEnumOptionsFromSchema).flat();
        }
        const enumDescriptions = schema.enumDescriptions ?? [];
        return (schema.enum ?? []).map((value, idx) => {
            const description = idx < enumDescriptions.length
                ? enumDescriptions[idx]
                : undefined;
            return { value, description };
        });
    }
    function getObjectValueType(schema) {
        if (schema.anyOf) {
            const subTypes = schema.anyOf.map(getObjectValueType);
            if (subTypes.some(type => type === 'enum')) {
                return 'enum';
            }
            return 'string';
        }
        if (schema.type === 'boolean') {
            return 'boolean';
        }
        else if (schema.type === 'string' && (0, types_1.isDefined)(schema.enum) && schema.enum.length > 0) {
            return 'enum';
        }
        else {
            return 'string';
        }
    }
    function getObjectDisplayValue(element) {
        const elementDefaultValue = typeof element.defaultValue === 'object'
            ? element.defaultValue ?? {}
            : {};
        const elementScopeValue = typeof element.scopeValue === 'object'
            ? element.scopeValue ?? {}
            : {};
        const data = element.isConfigured ?
            { ...elementDefaultValue, ...elementScopeValue } :
            elementDefaultValue;
        const { objectProperties, objectPatternProperties, objectAdditionalProperties } = element.setting;
        const patternsAndSchemas = Object
            .entries(objectPatternProperties ?? {})
            .map(([pattern, schema]) => ({
            pattern: new RegExp(pattern),
            schema
        }));
        const wellDefinedKeyEnumOptions = Object.entries(objectProperties ?? {}).map(([key, schema]) => ({ value: key, description: schema.description }));
        return Object.keys(data).map(key => {
            const defaultValue = elementDefaultValue[key];
            if ((0, types_1.isDefined)(objectProperties) && key in objectProperties) {
                if (element.setting.allKeysAreBoolean) {
                    return {
                        key: {
                            type: 'string',
                            data: key
                        },
                        value: {
                            type: 'boolean',
                            data: data[key]
                        },
                        keyDescription: objectProperties[key].description,
                        removable: false
                    };
                }
                const valueEnumOptions = getEnumOptionsFromSchema(objectProperties[key]);
                return {
                    key: {
                        type: 'enum',
                        data: key,
                        options: wellDefinedKeyEnumOptions,
                    },
                    value: {
                        type: getObjectValueType(objectProperties[key]),
                        data: data[key],
                        options: valueEnumOptions,
                    },
                    keyDescription: objectProperties[key].description,
                    removable: (0, types_1.isUndefinedOrNull)(defaultValue),
                };
            }
            // The row is removable if it doesn't have a default value assigned.
            // Otherwise, it is not removable, but its value can be reset to the default.
            const removable = !defaultValue;
            const schema = patternsAndSchemas.find(({ pattern }) => pattern.test(key))?.schema;
            if (schema) {
                const valueEnumOptions = getEnumOptionsFromSchema(schema);
                return {
                    key: { type: 'string', data: key },
                    value: {
                        type: getObjectValueType(schema),
                        data: data[key],
                        options: valueEnumOptions,
                    },
                    keyDescription: schema.description,
                    removable,
                };
            }
            const additionalValueEnums = getEnumOptionsFromSchema(typeof objectAdditionalProperties === 'boolean'
                ? {}
                : objectAdditionalProperties ?? {});
            return {
                key: { type: 'string', data: key },
                value: {
                    type: typeof objectAdditionalProperties === 'object' ? getObjectValueType(objectAdditionalProperties) : 'string',
                    data: data[key],
                    options: additionalValueEnums,
                },
                keyDescription: typeof objectAdditionalProperties === 'object' ? objectAdditionalProperties.description : undefined,
                removable,
            };
        }).filter(item => !(0, types_1.isUndefinedOrNull)(item.value.data));
    }
    function createArraySuggester(element) {
        return (keys, idx) => {
            const enumOptions = [];
            if (element.setting.enum) {
                element.setting.enum.forEach((key, i) => {
                    // include the currently selected value, even if uniqueItems is true
                    if (!element.setting.uniqueItems || (idx !== undefined && key === keys[idx]) || !keys.includes(key)) {
                        const description = element.setting.enumDescriptions?.[i];
                        enumOptions.push({ value: key, description });
                    }
                });
            }
            return enumOptions.length > 0
                ? { type: 'enum', data: enumOptions[0].value, options: enumOptions }
                : undefined;
        };
    }
    function createObjectKeySuggester(element) {
        const { objectProperties } = element.setting;
        const allStaticKeys = Object.keys(objectProperties ?? {});
        return keys => {
            const existingKeys = new Set(keys);
            const enumOptions = [];
            allStaticKeys.forEach(staticKey => {
                if (!existingKeys.has(staticKey)) {
                    enumOptions.push({ value: staticKey, description: objectProperties[staticKey].description });
                }
            });
            return enumOptions.length > 0
                ? { type: 'enum', data: enumOptions[0].value, options: enumOptions }
                : undefined;
        };
    }
    function createObjectValueSuggester(element) {
        const { objectProperties, objectPatternProperties, objectAdditionalProperties } = element.setting;
        const patternsAndSchemas = Object
            .entries(objectPatternProperties ?? {})
            .map(([pattern, schema]) => ({
            pattern: new RegExp(pattern),
            schema
        }));
        return (key) => {
            let suggestedSchema;
            if ((0, types_1.isDefined)(objectProperties) && key in objectProperties) {
                suggestedSchema = objectProperties[key];
            }
            const patternSchema = suggestedSchema ?? patternsAndSchemas.find(({ pattern }) => pattern.test(key))?.schema;
            if ((0, types_1.isDefined)(patternSchema)) {
                suggestedSchema = patternSchema;
            }
            else if ((0, types_1.isDefined)(objectAdditionalProperties) && typeof objectAdditionalProperties === 'object') {
                suggestedSchema = objectAdditionalProperties;
            }
            if ((0, types_1.isDefined)(suggestedSchema)) {
                const type = getObjectValueType(suggestedSchema);
                if (type === 'boolean') {
                    return { type, data: suggestedSchema.default ?? true };
                }
                else if (type === 'enum') {
                    const options = getEnumOptionsFromSchema(suggestedSchema);
                    return { type, data: suggestedSchema.default ?? options[0].value, options };
                }
                else {
                    return { type, data: suggestedSchema.default ?? '' };
                }
            }
            return;
        };
    }
    function isNonNullableNumericType(type) {
        return type === 'number' || type === 'integer';
    }
    function parseNumericObjectValues(dataElement, v) {
        const newRecord = {};
        for (const key in v) {
            // Set to true/false once we're sure of the answer
            let keyMatchesNumericProperty;
            const patternProperties = dataElement.setting.objectPatternProperties;
            const properties = dataElement.setting.objectProperties;
            const additionalProperties = dataElement.setting.objectAdditionalProperties;
            // Match the current record key against the properties of the object
            if (properties) {
                for (const propKey in properties) {
                    if (propKey === key) {
                        keyMatchesNumericProperty = isNonNullableNumericType(properties[propKey].type);
                        break;
                    }
                }
            }
            if (keyMatchesNumericProperty === undefined && patternProperties) {
                for (const patternKey in patternProperties) {
                    if (key.match(patternKey)) {
                        keyMatchesNumericProperty = isNonNullableNumericType(patternProperties[patternKey].type);
                        break;
                    }
                }
            }
            if (keyMatchesNumericProperty === undefined && additionalProperties && typeof additionalProperties !== 'boolean') {
                if (isNonNullableNumericType(additionalProperties.type)) {
                    keyMatchesNumericProperty = true;
                }
            }
            newRecord[key] = keyMatchesNumericProperty ? Number(v[key]) : v[key];
        }
        return newRecord;
    }
    function getListDisplayValue(element) {
        if (!element.value || !Array.isArray(element.value)) {
            return [];
        }
        if (element.setting.arrayItemType === 'enum') {
            let enumOptions = [];
            if (element.setting.enum) {
                enumOptions = element.setting.enum.map((setting, i) => {
                    return {
                        value: setting,
                        description: element.setting.enumDescriptions?.[i]
                    };
                });
            }
            return element.value.map((key) => {
                return {
                    value: {
                        type: 'enum',
                        data: key,
                        options: enumOptions
                    }
                };
            });
        }
        else {
            return element.value.map((key) => {
                return {
                    value: {
                        type: 'string',
                        data: key
                    }
                };
            });
        }
    }
    function getShowAddButtonList(dataElement, listDisplayValue) {
        if (dataElement.setting.enum && dataElement.setting.uniqueItems) {
            return dataElement.setting.enum.length - listDisplayValue.length > 0;
        }
        else {
            return true;
        }
    }
    function resolveSettingsTree(tocData, coreSettingsGroups, logService) {
        const allSettings = getFlatSettings(coreSettingsGroups);
        return {
            tree: _resolveSettingsTree(tocData, allSettings, logService),
            leftoverSettings: allSettings
        };
    }
    function resolveConfiguredUntrustedSettings(groups, target, languageFilter, configurationService) {
        const allSettings = getFlatSettings(groups);
        return [...allSettings].filter(setting => setting.restricted && (0, settingsTreeModels_1.inspectSetting)(setting.key, target, languageFilter, configurationService).isConfigured);
    }
    async function createTocTreeForExtensionSettings(extensionService, groups) {
        const extGroupTree = new Map();
        const addEntryToTree = (extensionId, extensionName, childEntry) => {
            if (!extGroupTree.has(extensionId)) {
                const rootEntry = {
                    id: extensionId,
                    label: extensionName,
                    children: []
                };
                extGroupTree.set(extensionId, rootEntry);
            }
            extGroupTree.get(extensionId).children.push(childEntry);
        };
        const processGroupEntry = async (group) => {
            const flatSettings = group.sections.map(section => section.settings).flat();
            const extensionId = group.extensionInfo.id;
            const extension = await extensionService.getExtension(extensionId);
            const extensionName = extension?.displayName ?? extension?.name ?? extensionId;
            // Each group represents a single category of settings.
            // If the extension author forgets to specify an id for the group,
            // fall back to the title given to the group.
            const childEntry = {
                id: group.id || group.title,
                label: group.title,
                order: group.order,
                settings: flatSettings
            };
            addEntryToTree(extensionId, extensionName, childEntry);
        };
        const processPromises = groups.map(g => processGroupEntry(g));
        return Promise.all(processPromises).then(() => {
            const extGroups = [];
            for (const extensionRootEntry of extGroupTree.values()) {
                for (const child of extensionRootEntry.children) {
                    // Sort the individual settings of the child by order.
                    // Leave the undefined order settings untouched.
                    child.settings?.sort((a, b) => {
                        return (0, preferences_1.compareTwoNullableNumbers)(a.order, b.order);
                    });
                }
                if (extensionRootEntry.children.length === 1) {
                    // There is a single category for this extension.
                    // Push a flattened setting.
                    extGroups.push({
                        id: extensionRootEntry.id,
                        label: extensionRootEntry.children[0].label,
                        settings: extensionRootEntry.children[0].settings
                    });
                }
                else {
                    // Sort the categories.
                    // Leave the undefined order categories untouched.
                    extensionRootEntry.children.sort((a, b) => {
                        return (0, preferences_1.compareTwoNullableNumbers)(a.order, b.order);
                    });
                    // If there is a category that matches the setting name,
                    // add the settings in manually as "ungrouped" settings.
                    // https://github.com/microsoft/vscode/issues/137259
                    const ungroupedChild = extensionRootEntry.children.find(child => child.label === extensionRootEntry.label);
                    if (ungroupedChild && !ungroupedChild.children) {
                        const groupedChildren = extensionRootEntry.children.filter(child => child !== ungroupedChild);
                        extGroups.push({
                            id: extensionRootEntry.id,
                            label: extensionRootEntry.label,
                            settings: ungroupedChild.settings,
                            children: groupedChildren
                        });
                    }
                    else {
                        // Push all the groups as-is.
                        extGroups.push(extensionRootEntry);
                    }
                }
            }
            // Sort the outermost settings.
            extGroups.sort((a, b) => a.label.localeCompare(b.label));
            return {
                id: 'extensions',
                label: (0, nls_1.localize)('extensions', "Extensions"),
                children: extGroups
            };
        });
    }
    function _resolveSettingsTree(tocData, allSettings, logService) {
        let children;
        if (tocData.children) {
            children = tocData.children
                .map(child => _resolveSettingsTree(child, allSettings, logService))
                .filter(child => child.children?.length || child.settings?.length);
        }
        let settings;
        if (tocData.settings) {
            settings = tocData.settings.map(pattern => getMatchingSettings(allSettings, pattern, logService)).flat();
        }
        if (!children && !settings) {
            throw new Error(`TOC node has no child groups or settings: ${tocData.id}`);
        }
        return {
            id: tocData.id,
            label: tocData.label,
            children,
            settings
        };
    }
    const knownDynamicSettingGroups = [
        /^settingsSync\..*/,
        /^sync\..*/,
        /^workbench.fontAliasing$/,
    ];
    function getMatchingSettings(allSettings, pattern, logService) {
        const result = [];
        allSettings.forEach(s => {
            if (settingMatches(s, pattern)) {
                result.push(s);
                allSettings.delete(s);
            }
        });
        if (!result.length && !knownDynamicSettingGroups.some(r => r.test(pattern))) {
            logService.warn(`Settings pattern "${pattern}" doesn't match any settings`);
        }
        return result.sort((a, b) => a.key.localeCompare(b.key));
    }
    const settingPatternCache = new Map();
    function createSettingMatchRegExp(pattern) {
        pattern = (0, strings_1.escapeRegExpCharacters)(pattern)
            .replace(/\\\*/g, '.*');
        return new RegExp(`^${pattern}$`, 'i');
    }
    function settingMatches(s, pattern) {
        let regExp = settingPatternCache.get(pattern);
        if (!regExp) {
            regExp = createSettingMatchRegExp(pattern);
            settingPatternCache.set(pattern, regExp);
        }
        return regExp.test(s.key);
    }
    function getFlatSettings(settingsGroups) {
        const result = new Set();
        for (const group of settingsGroups) {
            for (const section of group.sections) {
                for (const s of section.settings) {
                    if (!s.overrides || !s.overrides.length) {
                        result.add(s);
                    }
                }
            }
        }
        return result;
    }
    const SETTINGS_TEXT_TEMPLATE_ID = 'settings.text.template';
    const SETTINGS_MULTILINE_TEXT_TEMPLATE_ID = 'settings.multilineText.template';
    const SETTINGS_NUMBER_TEMPLATE_ID = 'settings.number.template';
    const SETTINGS_ENUM_TEMPLATE_ID = 'settings.enum.template';
    const SETTINGS_BOOL_TEMPLATE_ID = 'settings.bool.template';
    const SETTINGS_ARRAY_TEMPLATE_ID = 'settings.array.template';
    const SETTINGS_EXCLUDE_TEMPLATE_ID = 'settings.exclude.template';
    const SETTINGS_INCLUDE_TEMPLATE_ID = 'settings.include.template';
    const SETTINGS_OBJECT_TEMPLATE_ID = 'settings.object.template';
    const SETTINGS_BOOL_OBJECT_TEMPLATE_ID = 'settings.boolObject.template';
    const SETTINGS_COMPLEX_TEMPLATE_ID = 'settings.complex.template';
    const SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID = 'settings.newExtensions.template';
    const SETTINGS_ELEMENT_TEMPLATE_ID = 'settings.group.template';
    const SETTINGS_EXTENSION_TOGGLE_TEMPLATE_ID = 'settings.extensionToggle.template';
    function removeChildrenFromTabOrder(node) {
        const focusableElements = node.querySelectorAll(`
		[tabindex="0"],
		input:not([tabindex="-1"]),
		select:not([tabindex="-1"]),
		textarea:not([tabindex="-1"]),
		a:not([tabindex="-1"]),
		button:not([tabindex="-1"]),
		area:not([tabindex="-1"])
	`);
        focusableElements.forEach(element => {
            element.setAttribute(AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR, 'true');
            element.setAttribute('tabindex', '-1');
        });
    }
    function addChildrenToTabOrder(node) {
        const focusableElements = node.querySelectorAll(`[${AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR}="true"]`);
        focusableElements.forEach(element => {
            element.removeAttribute(AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR);
            element.setAttribute('tabindex', '0');
        });
    }
    let AbstractSettingRenderer = class AbstractSettingRenderer extends lifecycle_1.Disposable {
        static { AbstractSettingRenderer_1 = this; }
        static { this.CONTROL_CLASS = 'setting-control-focus-target'; }
        static { this.CONTROL_SELECTOR = '.' + AbstractSettingRenderer_1.CONTROL_CLASS; }
        static { this.CONTENTS_CLASS = 'setting-item-contents'; }
        static { this.CONTENTS_SELECTOR = '.' + AbstractSettingRenderer_1.CONTENTS_CLASS; }
        static { this.ALL_ROWS_SELECTOR = '.monaco-list-row'; }
        static { this.SETTING_KEY_ATTR = 'data-key'; }
        static { this.SETTING_ID_ATTR = 'data-id'; }
        static { this.ELEMENT_FOCUSABLE_ATTR = 'data-focusable'; }
        constructor(settingActions, disposableActionFactory, _themeService, _contextViewService, _openerService, _instantiationService, _commandService, _contextMenuService, _keybindingService, _configService, _extensionsService, _extensionsWorkbenchService, _productService, _telemetryService) {
            super();
            this.settingActions = settingActions;
            this.disposableActionFactory = disposableActionFactory;
            this._themeService = _themeService;
            this._contextViewService = _contextViewService;
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._configService = _configService;
            this._extensionsService = _extensionsService;
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._productService = _productService;
            this._telemetryService = _telemetryService;
            this._onDidClickOverrideElement = this._register(new event_1.Emitter());
            this.onDidClickOverrideElement = this._onDidClickOverrideElement.event;
            this._onDidChangeSetting = this._register(new event_1.Emitter());
            this.onDidChangeSetting = this._onDidChangeSetting.event;
            this._onDidOpenSettings = this._register(new event_1.Emitter());
            this.onDidOpenSettings = this._onDidOpenSettings.event;
            this._onDidClickSettingLink = this._register(new event_1.Emitter());
            this.onDidClickSettingLink = this._onDidClickSettingLink.event;
            this._onDidFocusSetting = this._register(new event_1.Emitter());
            this.onDidFocusSetting = this._onDidFocusSetting.event;
            this._onDidChangeIgnoredSettings = this._register(new event_1.Emitter());
            this.onDidChangeIgnoredSettings = this._onDidChangeIgnoredSettings.event;
            this._onDidChangeSettingHeight = this._register(new event_1.Emitter());
            this.onDidChangeSettingHeight = this._onDidChangeSettingHeight.event;
            this._onApplyFilter = this._register(new event_1.Emitter());
            this.onApplyFilter = this._onApplyFilter.event;
            this.markdownRenderer = this._register(_instantiationService.createInstance(markdownRenderer_2.MarkdownRenderer, {}));
            this.ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this._configService);
            this._register(this._configService.onDidChangeConfiguration(e => {
                this.ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this._configService);
                this._onDidChangeIgnoredSettings.fire();
            }));
        }
        renderCommonTemplate(tree, _container, typeClass) {
            _container.classList.add('setting-item');
            _container.classList.add('setting-item-' + typeClass);
            const toDispose = new lifecycle_1.DisposableStore();
            const container = DOM.append(_container, $(AbstractSettingRenderer_1.CONTENTS_SELECTOR));
            container.classList.add('settings-row-inner-container');
            const titleElement = DOM.append(container, $('.setting-item-title'));
            const labelCategoryContainer = DOM.append(titleElement, $('.setting-item-cat-label-container'));
            const categoryElement = DOM.append(labelCategoryContainer, $('span.setting-item-category'));
            const labelElementContainer = DOM.append(labelCategoryContainer, $('span.setting-item-label'));
            const labelElement = toDispose.add(new simpleIconLabel_1.SimpleIconLabel(labelElementContainer));
            const indicatorsLabel = this._instantiationService.createInstance(settingsEditorSettingIndicators_1.SettingsTreeIndicatorsLabel, titleElement);
            toDispose.add(indicatorsLabel);
            const descriptionElement = DOM.append(container, $('.setting-item-description'));
            const modifiedIndicatorElement = DOM.append(container, $('.setting-item-modified-indicator'));
            toDispose.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), modifiedIndicatorElement, () => (0, nls_1.localize)('modified', "The setting has been configured in the current scope.")));
            const valueElement = DOM.append(container, $('.setting-item-value'));
            const controlElement = DOM.append(valueElement, $('div.setting-item-control'));
            const deprecationWarningElement = DOM.append(container, $('.setting-item-deprecation-message'));
            const toolbarContainer = DOM.append(container, $('.setting-toolbar-container'));
            const toolbar = this.renderSettingToolbar(toolbarContainer);
            const template = {
                toDispose,
                elementDisposables: toDispose.add(new lifecycle_1.DisposableStore()),
                containerElement: container,
                categoryElement,
                labelElement,
                descriptionElement,
                controlElement,
                deprecationWarningElement,
                indicatorsLabel,
                toolbar
            };
            // Prevent clicks from being handled by list
            toDispose.add(DOM.addDisposableListener(controlElement, DOM.EventType.MOUSE_DOWN, e => e.stopPropagation()));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_ENTER, e => container.classList.add('mouseover')));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_LEAVE, e => container.classList.remove('mouseover')));
            return template;
        }
        addSettingElementFocusHandler(template) {
            const focusTracker = DOM.trackFocus(template.containerElement);
            template.toDispose.add(focusTracker);
            focusTracker.onDidBlur(() => {
                if (template.containerElement.classList.contains('focused')) {
                    template.containerElement.classList.remove('focused');
                }
            });
            focusTracker.onDidFocus(() => {
                template.containerElement.classList.add('focused');
                if (template.context) {
                    this._onDidFocusSetting.fire(template.context);
                }
            });
        }
        renderSettingToolbar(container) {
            const toggleMenuKeybinding = this._keybindingService.lookupKeybinding(preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU);
            let toggleMenuTitle = (0, nls_1.localize)('settingsContextMenuTitle', "More Actions... ");
            if (toggleMenuKeybinding) {
                toggleMenuTitle += ` (${toggleMenuKeybinding && toggleMenuKeybinding.getLabel()})`;
            }
            const toolbar = new toolbar_1.ToolBar(container, this._contextMenuService, {
                toggleMenuTitle,
                renderDropdownAsChildElement: !platform_1.isIOS,
                moreIcon: preferencesIcons_1.settingsMoreActionIcon
            });
            return toolbar;
        }
        renderSettingElement(node, index, template) {
            const element = node.element;
            // The element must inspect itself to get information for
            // the modified indicator and the overridden Settings indicators.
            element.inspectSelf();
            template.context = element;
            template.toolbar.context = element;
            const actions = this.disposableActionFactory(element.setting, element.settingsTarget);
            actions.forEach(a => (0, lifecycle_1.isDisposable)(a) && template.elementDisposables.add(a));
            template.toolbar.setActions([], [...this.settingActions, ...actions]);
            const setting = element.setting;
            template.containerElement.classList.toggle('is-configured', element.isConfigured);
            template.containerElement.setAttribute(AbstractSettingRenderer_1.SETTING_KEY_ATTR, element.setting.key);
            template.containerElement.setAttribute(AbstractSettingRenderer_1.SETTING_ID_ATTR, element.id);
            const titleTooltip = setting.key + (element.isConfigured ? ' - Modified' : '');
            template.categoryElement.textContent = element.displayCategory ? (element.displayCategory + ': ') : '';
            template.elementDisposables.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), template.categoryElement, titleTooltip));
            template.labelElement.text = element.displayLabel;
            template.labelElement.title = titleTooltip;
            template.descriptionElement.innerText = '';
            if (element.setting.descriptionIsMarkdown) {
                const renderedDescription = this.renderSettingMarkdown(element, template.containerElement, element.description, template.elementDisposables);
                template.descriptionElement.appendChild(renderedDescription);
            }
            else {
                template.descriptionElement.innerText = element.description;
            }
            template.indicatorsLabel.updateScopeOverrides(element, this._onDidClickOverrideElement, this._onApplyFilter);
            template.elementDisposables.add(this._configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(configuration_2.APPLY_ALL_PROFILES_SETTING)) {
                    template.indicatorsLabel.updateScopeOverrides(element, this._onDidClickOverrideElement, this._onApplyFilter);
                }
            }));
            const onChange = (value) => this._onDidChangeSetting.fire({
                key: element.setting.key,
                value,
                type: template.context.valueType,
                manualReset: false,
                scope: element.setting.scope
            });
            const deprecationText = element.setting.deprecationMessage || '';
            if (deprecationText && element.setting.deprecationMessageIsMarkdown) {
                template.deprecationWarningElement.innerText = '';
                template.deprecationWarningElement.appendChild(this.renderSettingMarkdown(element, template.containerElement, element.setting.deprecationMessage, template.elementDisposables));
            }
            else {
                template.deprecationWarningElement.innerText = deprecationText;
            }
            template.deprecationWarningElement.prepend($('.codicon.codicon-error'));
            template.containerElement.classList.toggle('is-deprecated', !!deprecationText);
            this.renderValue(element, template, onChange);
            template.indicatorsLabel.updateWorkspaceTrust(element);
            template.indicatorsLabel.updateSyncIgnored(element, this.ignoredSettings);
            template.indicatorsLabel.updateDefaultOverrideIndicator(element);
            template.elementDisposables.add(this.onDidChangeIgnoredSettings(() => {
                template.indicatorsLabel.updateSyncIgnored(element, this.ignoredSettings);
            }));
            this.updateSettingTabbable(element, template);
            template.elementDisposables.add(element.onDidChangeTabbable(() => {
                this.updateSettingTabbable(element, template);
            }));
        }
        updateSettingTabbable(element, template) {
            if (element.tabbable) {
                addChildrenToTabOrder(template.containerElement);
            }
            else {
                removeChildrenFromTabOrder(template.containerElement);
            }
        }
        renderSettingMarkdown(element, container, text, disposables) {
            // Rewrite `#editor.fontSize#` to link format
            text = fixSettingLinks(text);
            const renderedMarkdown = this.markdownRenderer.render({ value: text, isTrusted: true }, {
                actionHandler: {
                    callback: (content) => {
                        if (content.startsWith('#')) {
                            const e = {
                                source: element,
                                targetKey: content.substring(1)
                            };
                            this._onDidClickSettingLink.fire(e);
                        }
                        else {
                            this._openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                        }
                    },
                    disposables
                },
                asyncRenderCallback: () => {
                    const height = container.clientHeight;
                    if (height) {
                        this._onDidChangeSettingHeight.fire({ element, height });
                    }
                },
            });
            disposables.add(renderedMarkdown);
            renderedMarkdown.element.classList.add('setting-item-markdown');
            cleanRenderedMarkdown(renderedMarkdown.element);
            return renderedMarkdown.element;
        }
        disposeTemplate(template) {
            template.toDispose.dispose();
        }
        disposeElement(_element, _index, template, _height) {
            template.elementDisposables?.clear();
        }
    };
    exports.AbstractSettingRenderer = AbstractSettingRenderer;
    exports.AbstractSettingRenderer = AbstractSettingRenderer = AbstractSettingRenderer_1 = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService),
        __param(4, opener_1.IOpenerService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, commands_1.ICommandService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, extensions_2.IExtensionService),
        __param(11, extensions_1.IExtensionsWorkbenchService),
        __param(12, productService_1.IProductService),
        __param(13, telemetry_1.ITelemetryService)
    ], AbstractSettingRenderer);
    class SettingGroupRenderer {
        constructor() {
            this.templateId = SETTINGS_ELEMENT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            container.classList.add('group-title');
            const template = {
                parent: container,
                toDispose: new lifecycle_1.DisposableStore()
            };
            return template;
        }
        renderElement(element, index, templateData) {
            templateData.parent.innerText = '';
            const labelElement = DOM.append(templateData.parent, $('div.settings-group-title-label.settings-row-inner-container'));
            labelElement.classList.add(`settings-group-level-${element.element.level}`);
            labelElement.textContent = element.element.label;
            if (element.element.isFirstGroup) {
                labelElement.classList.add('settings-group-first');
            }
        }
        disposeTemplate(templateData) {
        }
    }
    exports.SettingGroupRenderer = SettingGroupRenderer;
    let SettingNewExtensionsRenderer = class SettingNewExtensionsRenderer {
        constructor(_commandService) {
            this._commandService = _commandService;
            this.templateId = SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const toDispose = new lifecycle_1.DisposableStore();
            container.classList.add('setting-item-new-extensions');
            const button = new button_1.Button(container, { title: true, ...defaultStyles_1.defaultButtonStyles });
            toDispose.add(button);
            toDispose.add(button.onDidClick(() => {
                if (template.context) {
                    this._commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', template.context.extensionIds);
                }
            }));
            button.label = (0, nls_1.localize)('newExtensionsButtonLabel', "Show matching extensions");
            button.element.classList.add('settings-new-extensions-button');
            const template = {
                button,
                toDispose
            };
            return template;
        }
        renderElement(element, index, templateData) {
            templateData.context = element.element;
        }
        disposeTemplate(template) {
            (0, lifecycle_1.dispose)(template.toDispose);
        }
    };
    exports.SettingNewExtensionsRenderer = SettingNewExtensionsRenderer;
    exports.SettingNewExtensionsRenderer = SettingNewExtensionsRenderer = __decorate([
        __param(0, commands_1.ICommandService)
    ], SettingNewExtensionsRenderer);
    class SettingComplexRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_COMPLEX_TEMPLATE_ID;
        }
        static { this.EDIT_IN_JSON_LABEL = (0, nls_1.localize)('editInSettingsJson', "Edit in settings.json"); }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'complex');
            const openSettingsButton = DOM.append(common.controlElement, $('a.edit-in-settings-button'));
            openSettingsButton.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            openSettingsButton.role = 'button';
            const validationErrorMessageElement = $('.setting-item-validation-message');
            common.containerElement.appendChild(validationErrorMessageElement);
            const template = {
                ...common,
                button: openSettingsButton,
                validationErrorMessageElement
            };
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const plainKey = (0, configuration_1.getLanguageTagSettingPlainKey)(dataElement.setting.key);
            const editLanguageSettingLabel = (0, nls_1.localize)('editLanguageSettingLabel', "Edit settings for {0}", plainKey);
            const isLanguageTagSetting = dataElement.setting.isLanguageTagSetting;
            template.button.textContent = isLanguageTagSetting
                ? editLanguageSettingLabel
                : SettingComplexRenderer.EDIT_IN_JSON_LABEL;
            const onClickOrKeydown = (e) => {
                if (isLanguageTagSetting) {
                    this._onApplyFilter.fire(`@${preferences_1.LANGUAGE_SETTING_TAG}${plainKey}`);
                }
                else {
                    this._onDidOpenSettings.fire(dataElement.setting.key);
                }
                e.preventDefault();
                e.stopPropagation();
            };
            template.elementDisposables.add(DOM.addDisposableListener(template.button, DOM.EventType.CLICK, (e) => {
                onClickOrKeydown(e);
            }));
            template.elementDisposables.add(DOM.addDisposableListener(template.button, DOM.EventType.KEY_DOWN, (e) => {
                const ev = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (ev.equals(10 /* KeyCode.Space */) || ev.equals(3 /* KeyCode.Enter */)) {
                    onClickOrKeydown(e);
                }
            }));
            this.renderValidations(dataElement, template);
            if (isLanguageTagSetting) {
                template.button.setAttribute('aria-label', editLanguageSettingLabel);
            }
            else {
                template.button.setAttribute('aria-label', `${SettingComplexRenderer.EDIT_IN_JSON_LABEL}: ${dataElement.setting.key}`);
            }
        }
        renderValidations(dataElement, template) {
            const errMsg = dataElement.isConfigured && (0, preferencesValidation_1.getInvalidTypeError)(dataElement.value, dataElement.setting.type);
            if (errMsg) {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                return;
            }
            template.containerElement.classList.remove('invalid-input');
        }
    }
    exports.SettingComplexRenderer = SettingComplexRenderer;
    class SettingArrayRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_ARRAY_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const descriptionElement = common.containerElement.querySelector('.setting-item-description');
            const validationErrorMessageElement = $('.setting-item-validation-message');
            descriptionElement.after(validationErrorMessageElement);
            const listWidget = this._instantiationService.createInstance(settingsWidgets_1.ListSettingWidget, common.controlElement);
            listWidget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(listWidget);
            const template = {
                ...common,
                listWidget,
                validationErrorMessageElement
            };
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(listWidget.onDidChangeList(e => {
                const newList = this.computeNewList(template, e);
                template.onChange?.(newList);
            }));
            return template;
        }
        computeNewList(template, e) {
            if (template.context) {
                let newValue = [];
                if (Array.isArray(template.context.scopeValue)) {
                    newValue = [...template.context.scopeValue];
                }
                else if (Array.isArray(template.context.value)) {
                    newValue = [...template.context.value];
                }
                if (e.sourceIndex !== undefined) {
                    // A drag and drop occurred
                    const sourceIndex = e.sourceIndex;
                    const targetIndex = e.targetIndex;
                    const splicedElem = newValue.splice(sourceIndex, 1)[0];
                    newValue.splice(targetIndex, 0, splicedElem);
                }
                else if (e.targetIndex !== undefined) {
                    const itemValueData = e.item?.value.data.toString() ?? '';
                    // Delete value
                    if (!e.item?.value.data && e.originalItem.value.data && e.targetIndex > -1) {
                        newValue.splice(e.targetIndex, 1);
                    }
                    // Update value
                    else if (e.item?.value.data && e.originalItem.value.data) {
                        if (e.targetIndex > -1) {
                            newValue[e.targetIndex] = itemValueData;
                        }
                        // For some reason, we are updating and cannot find original value
                        // Just append the value in this case
                        else {
                            newValue.push(itemValueData);
                        }
                    }
                    // Add value
                    else if (e.item?.value.data && !e.originalItem.value.data && e.targetIndex >= newValue.length) {
                        newValue.push(itemValueData);
                    }
                }
                if (template.context.defaultValue &&
                    Array.isArray(template.context.defaultValue) &&
                    template.context.defaultValue.length === newValue.length &&
                    template.context.defaultValue.join() === newValue.join()) {
                    return undefined;
                }
                return newValue;
            }
            return undefined;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const value = getListDisplayValue(dataElement);
            const keySuggester = dataElement.setting.enum ? createArraySuggester(dataElement) : undefined;
            template.listWidget.setValue(value, {
                showAddButton: getShowAddButtonList(dataElement, value),
                keySuggester
            });
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.listWidget.cancelEdit();
            }));
            template.onChange = (v) => {
                if (v && !renderArrayValidations(dataElement, template, v, false)) {
                    const itemType = dataElement.setting.arrayItemType;
                    const arrToSave = isNonNullableNumericType(itemType) ? v.map(a => +a) : v;
                    onChange(arrToSave);
                }
                else {
                    // Save the setting unparsed and containing the errors.
                    // renderArrayValidations will render relevant error messages.
                    onChange(v);
                }
            };
            renderArrayValidations(dataElement, template, value.map(v => v.value.data.toString()), true);
        }
    }
    class AbstractSettingObjectRenderer extends AbstractSettingRenderer {
        renderTemplateWithWidget(common, widget) {
            widget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(widget);
            const descriptionElement = common.containerElement.querySelector('.setting-item-description');
            const validationErrorMessageElement = $('.setting-item-validation-message');
            descriptionElement.after(validationErrorMessageElement);
            const template = {
                ...common,
                validationErrorMessageElement
            };
            if (widget instanceof settingsWidgets_1.ObjectSettingCheckboxWidget) {
                template.objectCheckboxWidget = widget;
            }
            else {
                template.objectDropdownWidget = widget;
            }
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(widget.onDidChangeList(e => {
                this.onDidChangeObject(template, e);
            }));
            return template;
        }
        onDidChangeObject(template, e) {
            const widget = (template.objectCheckboxWidget ?? template.objectDropdownWidget);
            if (template.context) {
                const defaultValue = typeof template.context.defaultValue === 'object'
                    ? template.context.defaultValue ?? {}
                    : {};
                const scopeValue = typeof template.context.scopeValue === 'object'
                    ? template.context.scopeValue ?? {}
                    : {};
                const newValue = {};
                const newItems = [];
                widget.items.forEach((item, idx) => {
                    // Item was updated
                    if ((0, types_1.isDefined)(e.item) && e.targetIndex === idx) {
                        newValue[e.item.key.data] = e.item.value.data;
                        newItems.push(e.item);
                    }
                    // All remaining items, but skip the one that we just updated
                    else if ((0, types_1.isUndefinedOrNull)(e.item) || e.item.key.data !== item.key.data) {
                        newValue[item.key.data] = item.value.data;
                        newItems.push(item);
                    }
                });
                // Item was deleted
                if ((0, types_1.isUndefinedOrNull)(e.item)) {
                    delete newValue[e.originalItem.key.data];
                    const itemToDelete = newItems.findIndex(item => item.key.data === e.originalItem.key.data);
                    const defaultItemValue = defaultValue[e.originalItem.key.data];
                    // Item does not have a default
                    if ((0, types_1.isUndefinedOrNull)(defaultValue[e.originalItem.key.data]) && itemToDelete > -1) {
                        newItems.splice(itemToDelete, 1);
                    }
                    else if (itemToDelete > -1) {
                        newItems[itemToDelete].value.data = defaultItemValue;
                    }
                }
                // New item was added
                else if (widget.isItemNew(e.originalItem) && e.item.key.data !== '') {
                    newValue[e.item.key.data] = e.item.value.data;
                    newItems.push(e.item);
                }
                Object.entries(newValue).forEach(([key, value]) => {
                    // value from the scope has changed back to the default
                    if (scopeValue[key] !== value && defaultValue[key] === value) {
                        delete newValue[key];
                    }
                });
                const newObject = Object.keys(newValue).length === 0 ? undefined : newValue;
                if (template.objectCheckboxWidget) {
                    template.objectCheckboxWidget.setValue(newItems);
                }
                else {
                    template.objectDropdownWidget.setValue(newItems);
                }
                template.onChange?.(newObject);
            }
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
    }
    class SettingObjectRenderer extends AbstractSettingObjectRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_OBJECT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const widget = this._instantiationService.createInstance(settingsWidgets_1.ObjectSettingDropdownWidget, common.controlElement);
            return this.renderTemplateWithWidget(common, widget);
        }
        renderValue(dataElement, template, onChange) {
            const items = getObjectDisplayValue(dataElement);
            const { key, objectProperties, objectPatternProperties, objectAdditionalProperties } = dataElement.setting;
            template.objectDropdownWidget.setValue(items, {
                settingKey: key,
                showAddButton: objectAdditionalProperties === false
                    ? (!areAllPropertiesDefined(Object.keys(objectProperties ?? {}), items) ||
                        (0, types_1.isDefined)(objectPatternProperties))
                    : true,
                keySuggester: createObjectKeySuggester(dataElement),
                valueSuggester: createObjectValueSuggester(dataElement)
            });
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.objectDropdownWidget.cancelEdit();
            }));
            template.onChange = (v) => {
                if (v && !renderArrayValidations(dataElement, template, v, false)) {
                    const parsedRecord = parseNumericObjectValues(dataElement, v);
                    onChange(parsedRecord);
                }
                else {
                    // Save the setting unparsed and containing the errors.
                    // renderArrayValidations will render relevant error messages.
                    onChange(v);
                }
            };
            renderArrayValidations(dataElement, template, dataElement.value, true);
        }
    }
    class SettingBoolObjectRenderer extends AbstractSettingObjectRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_BOOL_OBJECT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const widget = this._instantiationService.createInstance(settingsWidgets_1.ObjectSettingCheckboxWidget, common.controlElement);
            return this.renderTemplateWithWidget(common, widget);
        }
        onDidChangeObject(template, e) {
            if (template.context) {
                super.onDidChangeObject(template, e);
                // Focus this setting explicitly, in case we were previously
                // focused on another setting and clicked a checkbox/value container
                // for this setting.
                this._onDidFocusSetting.fire(template.context);
            }
        }
        renderValue(dataElement, template, onChange) {
            const items = getObjectDisplayValue(dataElement);
            const { key } = dataElement.setting;
            template.objectCheckboxWidget.setValue(items, {
                settingKey: key
            });
            template.context = dataElement;
            template.onChange = (v) => {
                onChange(v);
            };
        }
    }
    class SettingIncludeExcludeRenderer extends AbstractSettingRenderer {
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const includeExcludeWidget = this._instantiationService.createInstance(this.isExclude() ? settingsWidgets_1.ExcludeSettingWidget : settingsWidgets_1.IncludeSettingWidget, common.controlElement);
            includeExcludeWidget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(includeExcludeWidget);
            const template = {
                ...common,
                includeExcludeWidget
            };
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(includeExcludeWidget.onDidChangeList(e => this.onDidChangeIncludeExclude(template, e)));
            return template;
        }
        onDidChangeIncludeExclude(template, e) {
            if (template.context) {
                const newValue = { ...template.context.scopeValue };
                // first delete the existing entry, if present
                if (e.originalItem.value.data.toString() in template.context.defaultValue) {
                    // delete a default by overriding it
                    newValue[e.originalItem.value.data.toString()] = false;
                }
                else {
                    delete newValue[e.originalItem.value.data.toString()];
                }
                // then add the new or updated entry, if present
                if (e.item?.value) {
                    if (e.item.value.data.toString() in template.context.defaultValue && !e.item.sibling) {
                        // add a default by deleting its override
                        delete newValue[e.item.value.data.toString()];
                    }
                    else {
                        newValue[e.item.value.data.toString()] = e.item.sibling ? { when: e.item.sibling } : true;
                    }
                }
                function sortKeys(obj) {
                    const sortedKeys = Object.keys(obj)
                        .sort((a, b) => a.localeCompare(b));
                    const retVal = {};
                    for (const key of sortedKeys) {
                        retVal[key] = obj[key];
                    }
                    return retVal;
                }
                this._onDidChangeSetting.fire({
                    key: template.context.setting.key,
                    value: Object.keys(newValue).length === 0 ? undefined : sortKeys(newValue),
                    type: template.context.valueType,
                    manualReset: false,
                    scope: template.context.setting.scope
                });
            }
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const value = getIncludeExcludeDisplayValue(dataElement);
            template.includeExcludeWidget.setValue(value);
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.includeExcludeWidget.cancelEdit();
            }));
        }
    }
    class SettingExcludeRenderer extends SettingIncludeExcludeRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_EXCLUDE_TEMPLATE_ID;
        }
        isExclude() {
            return true;
        }
    }
    exports.SettingExcludeRenderer = SettingExcludeRenderer;
    class SettingIncludeRenderer extends SettingIncludeExcludeRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_INCLUDE_TEMPLATE_ID;
        }
        isExclude() {
            return false;
        }
    }
    exports.SettingIncludeRenderer = SettingIncludeRenderer;
    const settingsInputBoxStyles = (0, defaultStyles_1.getInputBoxStyle)({
        inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
        inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
        inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
    });
    class AbstractSettingTextRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.MULTILINE_MAX_HEIGHT = 150;
        }
        renderTemplate(_container, useMultiline) {
            const common = this.renderCommonTemplate(null, _container, 'text');
            const validationErrorMessageElement = DOM.append(common.containerElement, $('.setting-item-validation-message'));
            const inputBoxOptions = {
                flexibleHeight: useMultiline,
                flexibleWidth: false,
                flexibleMaxHeight: this.MULTILINE_MAX_HEIGHT,
                inputBoxStyles: settingsInputBoxStyles
            };
            const inputBox = new inputBox_1.InputBox(common.controlElement, this._contextViewService, inputBoxOptions);
            common.toDispose.add(inputBox);
            common.toDispose.add(inputBox.onDidChange(e => {
                template.onChange?.(e);
            }));
            common.toDispose.add(inputBox);
            inputBox.inputElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            inputBox.inputElement.tabIndex = 0;
            const template = {
                ...common,
                inputBox,
                validationErrorMessageElement
            };
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            template.onChange = undefined;
            template.inputBox.value = dataElement.value;
            template.inputBox.setAriaLabel(dataElement.setting.key);
            template.onChange = value => {
                if (!renderValidations(dataElement, template, false)) {
                    onChange(value);
                }
            };
            renderValidations(dataElement, template, true);
        }
    }
    class SettingTextRenderer extends AbstractSettingTextRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_TEXT_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            const template = super.renderTemplate(_container, false);
            // TODO@9at8: listWidget filters out all key events from input boxes, so we need to come up with a better way
            // Disable ArrowUp and ArrowDown behaviour in favor of list navigation
            template.toDispose.add(DOM.addStandardDisposableListener(template.inputBox.inputElement, DOM.EventType.KEY_DOWN, e => {
                if (e.equals(16 /* KeyCode.UpArrow */) || e.equals(18 /* KeyCode.DownArrow */)) {
                    e.preventDefault();
                }
            }));
            return template;
        }
    }
    class SettingMultilineTextRenderer extends AbstractSettingTextRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_MULTILINE_TEXT_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            return super.renderTemplate(_container, true);
        }
        renderValue(dataElement, template, onChange) {
            const onChangeOverride = (value) => {
                // Ensure the model is up to date since a different value will be rendered as different height when probing the height.
                dataElement.value = value;
                onChange(value);
            };
            super.renderValue(dataElement, template, onChangeOverride);
            template.elementDisposables.add(template.inputBox.onDidHeightChange(e => {
                const height = template.containerElement.clientHeight;
                // Don't fire event if height is reported as 0,
                // which sometimes happens when clicking onto a new setting.
                if (height) {
                    this._onDidChangeSettingHeight.fire({
                        element: dataElement,
                        height: template.containerElement.clientHeight
                    });
                }
            }));
            template.inputBox.layout();
        }
    }
    class SettingEnumRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_ENUM_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'enum');
            const styles = (0, defaultStyles_1.getSelectBoxStyles)({
                selectBackground: settingsEditorColorRegistry_1.settingsSelectBackground,
                selectForeground: settingsEditorColorRegistry_1.settingsSelectForeground,
                selectBorder: settingsEditorColorRegistry_1.settingsSelectBorder,
                selectListBorder: settingsEditorColorRegistry_1.settingsSelectListBorder
            });
            const selectBox = new selectBox_1.SelectBox([], 0, this._contextViewService, styles, {
                useCustomDrawn: !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)
            });
            common.toDispose.add(selectBox);
            selectBox.render(common.controlElement);
            const selectElement = common.controlElement.querySelector('select');
            if (selectElement) {
                selectElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
                selectElement.tabIndex = 0;
            }
            common.toDispose.add(selectBox.onDidSelect(e => {
                template.onChange?.(e.index);
            }));
            const enumDescriptionElement = common.containerElement.insertBefore($('.setting-item-enumDescription'), common.descriptionElement.nextSibling);
            const template = {
                ...common,
                selectBox,
                selectElement,
                enumDescriptionElement
            };
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            // Make shallow copies here so that we don't modify the actual dataElement later
            const enumItemLabels = dataElement.setting.enumItemLabels ? [...dataElement.setting.enumItemLabels] : [];
            const enumDescriptions = dataElement.setting.enumDescriptions ? [...dataElement.setting.enumDescriptions] : [];
            const settingEnum = [...dataElement.setting.enum];
            const enumDescriptionsAreMarkdown = dataElement.setting.enumDescriptionsAreMarkdown;
            const disposables = new lifecycle_1.DisposableStore();
            template.toDispose.add(disposables);
            let createdDefault = false;
            if (!settingEnum.includes(dataElement.defaultValue)) {
                // Add a new potentially blank default setting
                settingEnum.unshift(dataElement.defaultValue);
                enumDescriptions.unshift('');
                enumItemLabels.unshift('');
                createdDefault = true;
            }
            // Use String constructor in case of null or undefined values
            const stringifiedDefaultValue = escapeInvisibleChars(String(dataElement.defaultValue));
            const displayOptions = settingEnum
                .map(String)
                .map(escapeInvisibleChars)
                .map((data, index) => {
                const description = (enumDescriptions[index] && (enumDescriptionsAreMarkdown ? fixSettingLinks(enumDescriptions[index], false) : enumDescriptions[index]));
                return {
                    text: enumItemLabels[index] ? enumItemLabels[index] : data,
                    detail: enumItemLabels[index] ? data : '',
                    description,
                    descriptionIsMarkdown: enumDescriptionsAreMarkdown,
                    descriptionMarkdownActionHandler: {
                        callback: (content) => {
                            this._openerService.open(content).catch(errors_1.onUnexpectedError);
                        },
                        disposables: disposables
                    },
                    decoratorRight: (((data === stringifiedDefaultValue) || (createdDefault && index === 0)) ? (0, nls_1.localize)('settings.Default', "default") : '')
                };
            });
            template.selectBox.setOptions(displayOptions);
            template.selectBox.setAriaLabel(dataElement.setting.key);
            let idx = settingEnum.indexOf(dataElement.value);
            if (idx === -1) {
                idx = 0;
            }
            template.onChange = undefined;
            template.selectBox.select(idx);
            template.onChange = (idx) => {
                if (createdDefault && idx === 0) {
                    onChange(dataElement.defaultValue);
                }
                else {
                    onChange(settingEnum[idx]);
                }
            };
            template.enumDescriptionElement.innerText = '';
        }
    }
    exports.SettingEnumRenderer = SettingEnumRenderer;
    const settingsNumberInputBoxStyles = (0, defaultStyles_1.getInputBoxStyle)({
        inputBackground: settingsEditorColorRegistry_1.settingsNumberInputBackground,
        inputForeground: settingsEditorColorRegistry_1.settingsNumberInputForeground,
        inputBorder: settingsEditorColorRegistry_1.settingsNumberInputBorder
    });
    class SettingNumberRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_NUMBER_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            const common = super.renderCommonTemplate(null, _container, 'number');
            const validationErrorMessageElement = DOM.append(common.containerElement, $('.setting-item-validation-message'));
            const inputBox = new inputBox_1.InputBox(common.controlElement, this._contextViewService, { type: 'number', inputBoxStyles: settingsNumberInputBoxStyles });
            common.toDispose.add(inputBox);
            common.toDispose.add(inputBox.onDidChange(e => {
                template.onChange?.(e);
            }));
            common.toDispose.add(inputBox);
            inputBox.inputElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            inputBox.inputElement.tabIndex = 0;
            const template = {
                ...common,
                inputBox,
                validationErrorMessageElement
            };
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const numParseFn = (dataElement.valueType === 'integer' || dataElement.valueType === 'nullable-integer')
                ? parseInt : parseFloat;
            const nullNumParseFn = (dataElement.valueType === 'nullable-integer' || dataElement.valueType === 'nullable-number')
                ? ((v) => v === '' ? null : numParseFn(v)) : numParseFn;
            template.onChange = undefined;
            template.inputBox.value = typeof dataElement.value === 'number' ?
                dataElement.value.toString() : '';
            template.inputBox.step = dataElement.valueType.includes('integer') ? '1' : 'any';
            template.inputBox.setAriaLabel(dataElement.setting.key);
            template.onChange = value => {
                if (!renderValidations(dataElement, template, false)) {
                    onChange(nullNumParseFn(value));
                }
            };
            renderValidations(dataElement, template, true);
        }
    }
    exports.SettingNumberRenderer = SettingNumberRenderer;
    class SettingBoolRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_BOOL_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            _container.classList.add('setting-item');
            _container.classList.add('setting-item-bool');
            const toDispose = new lifecycle_1.DisposableStore();
            const container = DOM.append(_container, $(AbstractSettingRenderer.CONTENTS_SELECTOR));
            container.classList.add('settings-row-inner-container');
            const titleElement = DOM.append(container, $('.setting-item-title'));
            const categoryElement = DOM.append(titleElement, $('span.setting-item-category'));
            const labelElementContainer = DOM.append(titleElement, $('span.setting-item-label'));
            const labelElement = toDispose.add(new simpleIconLabel_1.SimpleIconLabel(labelElementContainer));
            const indicatorsLabel = this._instantiationService.createInstance(settingsEditorSettingIndicators_1.SettingsTreeIndicatorsLabel, titleElement);
            const descriptionAndValueElement = DOM.append(container, $('.setting-item-value-description'));
            const controlElement = DOM.append(descriptionAndValueElement, $('.setting-item-bool-control'));
            const descriptionElement = DOM.append(descriptionAndValueElement, $('.setting-item-description'));
            const modifiedIndicatorElement = DOM.append(container, $('.setting-item-modified-indicator'));
            toDispose.add((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), modifiedIndicatorElement, (0, nls_1.localize)('modified', "The setting has been configured in the current scope.")));
            const deprecationWarningElement = DOM.append(container, $('.setting-item-deprecation-message'));
            const checkbox = new toggle_1.Toggle({ icon: codicons_1.Codicon.check, actionClassName: 'setting-value-checkbox', isChecked: true, title: '', ...toggle_1.unthemedToggleStyles });
            controlElement.appendChild(checkbox.domNode);
            toDispose.add(checkbox);
            toDispose.add(checkbox.onChange(() => {
                template.onChange(checkbox.checked);
            }));
            // Need to listen for mouse clicks on description and toggle checkbox - use target ID for safety
            // Also have to ignore embedded links - too buried to stop propagation
            toDispose.add(DOM.addDisposableListener(descriptionElement, DOM.EventType.MOUSE_DOWN, (e) => {
                const targetElement = e.target;
                // Toggle target checkbox
                if (targetElement.tagName.toLowerCase() !== 'a') {
                    template.checkbox.checked = !template.checkbox.checked;
                    template.onChange(checkbox.checked);
                }
                DOM.EventHelper.stop(e);
            }));
            checkbox.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            const toolbarContainer = DOM.append(container, $('.setting-toolbar-container'));
            const toolbar = this.renderSettingToolbar(toolbarContainer);
            toDispose.add(toolbar);
            const template = {
                toDispose,
                elementDisposables: toDispose.add(new lifecycle_1.DisposableStore()),
                containerElement: container,
                categoryElement,
                labelElement,
                controlElement,
                checkbox,
                descriptionElement,
                deprecationWarningElement,
                indicatorsLabel,
                toolbar
            };
            this.addSettingElementFocusHandler(template);
            // Prevent clicks from being handled by list
            toDispose.add(DOM.addDisposableListener(controlElement, 'mousedown', (e) => e.stopPropagation()));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_ENTER, e => container.classList.add('mouseover')));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_LEAVE, e => container.classList.remove('mouseover')));
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            template.onChange = undefined;
            template.checkbox.checked = dataElement.value;
            template.checkbox.setTitle(dataElement.setting.key);
            template.onChange = onChange;
        }
    }
    exports.SettingBoolRenderer = SettingBoolRenderer;
    class SettingsExtensionToggleRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_EXTENSION_TOGGLE_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            const common = super.renderCommonTemplate(null, _container, 'extension-toggle');
            const actionButton = new button_1.Button(common.containerElement, {
                title: false,
                ...defaultStyles_1.defaultButtonStyles
            });
            actionButton.element.classList.add('setting-item-extension-toggle-button');
            actionButton.label = (0, nls_1.localize)('showExtension', "Show Extension");
            const template = {
                ...common,
                actionButton
            };
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            template.elementDisposables.clear();
            const extensionId = dataElement.setting.displayExtensionId;
            template.elementDisposables.add(template.actionButton.onDidClick(async () => {
                this._telemetryService.publicLog2('ManageExtensionClick', { extensionId });
                this._commandService.executeCommand('extension.open', extensionId);
            }));
        }
    }
    exports.SettingsExtensionToggleRenderer = SettingsExtensionToggleRenderer;
    let SettingTreeRenderers = class SettingTreeRenderers {
        constructor(_instantiationService, _contextMenuService, _contextViewService, _userDataProfilesService, _userDataSyncEnablementService) {
            this._instantiationService = _instantiationService;
            this._contextMenuService = _contextMenuService;
            this._contextViewService = _contextViewService;
            this._userDataProfilesService = _userDataProfilesService;
            this._userDataSyncEnablementService = _userDataSyncEnablementService;
            this._onDidChangeSetting = new event_1.Emitter();
            this.settingActions = [
                new actions_1.Action('settings.resetSetting', (0, nls_1.localize)('resetSettingLabel', "Reset Setting"), undefined, undefined, async (context) => {
                    if (context instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                        if (!context.isUntrusted) {
                            this._onDidChangeSetting.fire({
                                key: context.setting.key,
                                value: undefined,
                                type: context.setting.type,
                                manualReset: true,
                                scope: context.setting.scope
                            });
                        }
                    }
                }),
                new actions_1.Separator(),
                this._instantiationService.createInstance(CopySettingIdAction),
                this._instantiationService.createInstance(CopySettingAsJSONAction),
            ];
            const actionFactory = (setting, settingTarget) => this.getActionsForSetting(setting, settingTarget);
            const emptyActionFactory = (_) => [];
            const settingRenderers = [
                this._instantiationService.createInstance(SettingBoolRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingNumberRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingArrayRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingComplexRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingTextRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingMultilineTextRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingExcludeRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingIncludeRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingEnumRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingObjectRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingBoolObjectRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingsExtensionToggleRenderer, [], emptyActionFactory)
            ];
            this.onDidClickOverrideElement = event_1.Event.any(...settingRenderers.map(r => r.onDidClickOverrideElement));
            this.onDidChangeSetting = event_1.Event.any(...settingRenderers.map(r => r.onDidChangeSetting), this._onDidChangeSetting.event);
            this.onDidOpenSettings = event_1.Event.any(...settingRenderers.map(r => r.onDidOpenSettings));
            this.onDidClickSettingLink = event_1.Event.any(...settingRenderers.map(r => r.onDidClickSettingLink));
            this.onDidFocusSetting = event_1.Event.any(...settingRenderers.map(r => r.onDidFocusSetting));
            this.onDidChangeSettingHeight = event_1.Event.any(...settingRenderers.map(r => r.onDidChangeSettingHeight));
            this.onApplyFilter = event_1.Event.any(...settingRenderers.map(r => r.onApplyFilter));
            this.allRenderers = [
                ...settingRenderers,
                this._instantiationService.createInstance(SettingGroupRenderer),
                this._instantiationService.createInstance(SettingNewExtensionsRenderer),
            ];
        }
        getActionsForSetting(setting, settingTarget) {
            const actions = [];
            if (this._userDataProfilesService.isEnabled() && setting.scope !== 1 /* ConfigurationScope.APPLICATION */ && settingTarget === 3 /* ConfigurationTarget.USER_LOCAL */) {
                actions.push(this._instantiationService.createInstance(ApplySettingToAllProfilesAction, setting));
            }
            if (this._userDataSyncEnablementService.isEnabled() && !setting.disallowSyncIgnore) {
                actions.push(this._instantiationService.createInstance(SyncSettingAction, setting));
            }
            if (actions.length) {
                actions.splice(0, 0, new actions_1.Separator());
            }
            return actions;
        }
        cancelSuggesters() {
            this._contextViewService.hideContextView();
        }
        showContextMenu(element, settingDOMElement) {
            const toolbarElement = settingDOMElement.querySelector('.monaco-toolbar');
            if (toolbarElement) {
                this._contextMenuService.showContextMenu({
                    getActions: () => this.settingActions,
                    getAnchor: () => toolbarElement,
                    getActionsContext: () => element
                });
            }
        }
        getSettingDOMElementForDOMElement(domElement) {
            const parent = DOM.findParentWithClass(domElement, AbstractSettingRenderer.CONTENTS_CLASS);
            if (parent) {
                return parent;
            }
            return null;
        }
        getDOMElementsForSettingKey(treeContainer, key) {
            return treeContainer.querySelectorAll(`[${AbstractSettingRenderer.SETTING_KEY_ATTR}="${key}"]`);
        }
        getKeyForDOMElementInSetting(element) {
            const settingElement = this.getSettingDOMElementForDOMElement(element);
            return settingElement && settingElement.getAttribute(AbstractSettingRenderer.SETTING_KEY_ATTR);
        }
        getIdForDOMElementInSetting(element) {
            const settingElement = this.getSettingDOMElementForDOMElement(element);
            return settingElement && settingElement.getAttribute(AbstractSettingRenderer.SETTING_ID_ATTR);
        }
    };
    exports.SettingTreeRenderers = SettingTreeRenderers;
    exports.SettingTreeRenderers = SettingTreeRenderers = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, contextView_1.IContextViewService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, userDataSync_1.IUserDataSyncEnablementService)
    ], SettingTreeRenderers);
    /**
     * Validate and render any error message. Returns true if the value is invalid.
     */
    function renderValidations(dataElement, template, calledOnStartup) {
        if (dataElement.setting.validator) {
            const errMsg = dataElement.setting.validator(template.inputBox.value);
            if (errMsg) {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                const validationError = (0, nls_1.localize)('validationError', "Validation Error.");
                template.inputBox.inputElement.parentElement.setAttribute('aria-label', [validationError, errMsg].join(' '));
                if (!calledOnStartup) {
                    aria.status(validationError + ' ' + errMsg);
                }
                return true;
            }
            else {
                template.inputBox.inputElement.parentElement.removeAttribute('aria-label');
            }
        }
        template.containerElement.classList.remove('invalid-input');
        return false;
    }
    /**
     * Validate and render any error message for arrays. Returns true if the value is invalid.
     */
    function renderArrayValidations(dataElement, template, value, calledOnStartup) {
        template.containerElement.classList.add('invalid-input');
        if (dataElement.setting.validator) {
            const errMsg = dataElement.setting.validator(value);
            if (errMsg && errMsg !== '') {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                const validationError = (0, nls_1.localize)('validationError', "Validation Error.");
                template.containerElement.setAttribute('aria-label', [dataElement.setting.key, validationError, errMsg].join(' '));
                if (!calledOnStartup) {
                    aria.status(validationError + ' ' + errMsg);
                }
                return true;
            }
            else {
                template.containerElement.setAttribute('aria-label', dataElement.setting.key);
                template.containerElement.classList.remove('invalid-input');
            }
        }
        return false;
    }
    function cleanRenderedMarkdown(element) {
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes.item(i);
            const tagName = child.tagName && child.tagName.toLowerCase();
            if (tagName === 'img') {
                element.removeChild(child);
            }
            else {
                cleanRenderedMarkdown(child);
            }
        }
    }
    function fixSettingLinks(text, linkify = true) {
        return text.replace(/`#([^#\s`]+)#`|'#([^#\s']+)#'/g, (match, backticksGroup, quotesGroup) => {
            const settingKey = backticksGroup ?? quotesGroup;
            const targetDisplayFormat = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingKey);
            const targetName = `${targetDisplayFormat.category}: ${targetDisplayFormat.label}`;
            return linkify ?
                `[${targetName}](#${settingKey} "${settingKey}")` :
                `"${targetName}"`;
        });
    }
    function escapeInvisibleChars(enumValue) {
        return enumValue && enumValue
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    let SettingsTreeFilter = class SettingsTreeFilter {
        constructor(viewState, environmentService) {
            this.viewState = viewState;
            this.environmentService = environmentService;
        }
        filter(element, parentVisibility) {
            // Filter during search
            if (this.viewState.filterToCategory && element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                if (!this.settingContainedInGroup(element.setting, this.viewState.filterToCategory)) {
                    return false;
                }
            }
            // Non-user scope selected
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement && this.viewState.settingsTarget !== 3 /* ConfigurationTarget.USER_LOCAL */) {
                const isRemote = !!this.environmentService.remoteAuthority;
                if (!element.matchesScope(this.viewState.settingsTarget, isRemote)) {
                    return false;
                }
            }
            // Group with no visible children
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                if (typeof element.count === 'number') {
                    return element.count > 0;
                }
                return 2 /* TreeVisibility.Recurse */;
            }
            // Filtered "new extensions" button
            if (element instanceof settingsTreeModels_1.SettingsTreeNewExtensionsElement) {
                if (this.viewState.tagFilters?.size || this.viewState.filterToCategory) {
                    return false;
                }
            }
            return true;
        }
        settingContainedInGroup(setting, group) {
            return group.children.some(child => {
                if (child instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                    return this.settingContainedInGroup(setting, child);
                }
                else if (child instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                    return child.setting.key === setting.key;
                }
                else {
                    return false;
                }
            });
        }
    };
    exports.SettingsTreeFilter = SettingsTreeFilter;
    exports.SettingsTreeFilter = SettingsTreeFilter = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], SettingsTreeFilter);
    class SettingsTreeDelegate extends list_1.CachedListVirtualDelegate {
        getTemplateId(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return SETTINGS_ELEMENT_TEMPLATE_ID;
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                if (element.valueType === preferences_2.SettingValueType.ExtensionToggle) {
                    return SETTINGS_EXTENSION_TOGGLE_TEMPLATE_ID;
                }
                const invalidTypeError = element.isConfigured && (0, preferencesValidation_1.getInvalidTypeError)(element.value, element.setting.type);
                if (invalidTypeError) {
                    return SETTINGS_COMPLEX_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Boolean) {
                    return SETTINGS_BOOL_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Integer ||
                    element.valueType === preferences_2.SettingValueType.Number ||
                    element.valueType === preferences_2.SettingValueType.NullableInteger ||
                    element.valueType === preferences_2.SettingValueType.NullableNumber) {
                    return SETTINGS_NUMBER_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.MultilineString) {
                    return SETTINGS_MULTILINE_TEXT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.String) {
                    return SETTINGS_TEXT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Enum) {
                    return SETTINGS_ENUM_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Array) {
                    return SETTINGS_ARRAY_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Exclude) {
                    return SETTINGS_EXCLUDE_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Include) {
                    return SETTINGS_INCLUDE_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Object) {
                    return SETTINGS_OBJECT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.BooleanObject) {
                    return SETTINGS_BOOL_OBJECT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.LanguageTag) {
                    return SETTINGS_COMPLEX_TEMPLATE_ID;
                }
                return SETTINGS_COMPLEX_TEMPLATE_ID;
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeNewExtensionsElement) {
                return SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID;
            }
            throw new Error('unknown element type: ' + element);
        }
        hasDynamicHeight(element) {
            return !(element instanceof settingsTreeModels_1.SettingsTreeGroupElement);
        }
        estimateHeight(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return 42;
            }
            return element instanceof settingsTreeModels_1.SettingsTreeSettingElement && element.valueType === preferences_2.SettingValueType.Boolean ? 78 : 104;
        }
    }
    class NonCollapsibleObjectTreeModel extends objectTreeModel_1.ObjectTreeModel {
        isCollapsible(element) {
            return false;
        }
        setCollapsed(element, collapsed, recursive) {
            return false;
        }
    }
    exports.NonCollapsibleObjectTreeModel = NonCollapsibleObjectTreeModel;
    class SettingsTreeAccessibilityProvider {
        constructor(configurationService, languageService, userDataProfilesService) {
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.userDataProfilesService = userDataProfilesService;
        }
        getAriaLabel(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                const ariaLabelSections = [];
                ariaLabelSections.push(`${element.displayCategory} ${element.displayLabel}.`);
                if (element.isConfigured) {
                    const modifiedText = (0, nls_1.localize)('settings.Modified', 'Modified.');
                    ariaLabelSections.push(modifiedText);
                }
                const indicatorsLabelAriaLabel = (0, settingsEditorSettingIndicators_1.getIndicatorsLabelAriaLabel)(element, this.configurationService, this.userDataProfilesService, this.languageService);
                if (indicatorsLabelAriaLabel.length) {
                    ariaLabelSections.push(`${indicatorsLabelAriaLabel}.`);
                }
                const descriptionWithoutSettingLinks = (0, markdownRenderer_1.renderMarkdownAsPlaintext)({ value: fixSettingLinks(element.description, false) });
                if (descriptionWithoutSettingLinks.length) {
                    ariaLabelSections.push(descriptionWithoutSettingLinks);
                }
                return ariaLabelSections.join(' ');
            }
            else if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return element.label;
            }
            else {
                return element.id;
            }
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('settings', "Settings");
        }
    }
    let SettingsTree = class SettingsTree extends listService_1.WorkbenchObjectTree {
        constructor(container, viewState, renderers, contextKeyService, listService, configurationService, instantiationService, languageService, userDataProfilesService) {
            super('SettingsTree', container, new SettingsTreeDelegate(), renderers, {
                horizontalScrolling: false,
                supportDynamicHeights: true,
                identityProvider: {
                    getId(e) {
                        return e.id;
                    }
                },
                accessibilityProvider: new SettingsTreeAccessibilityProvider(configurationService, languageService, userDataProfilesService),
                styleController: id => new listWidget_1.DefaultStyleController(DOM.createStyleSheet(container), id),
                filter: instantiationService.createInstance(SettingsTreeFilter, viewState),
                smoothScrolling: configurationService.getValue('workbench.list.smoothScrolling'),
                multipleSelectionSupport: false,
                findWidgetEnabled: false,
                renderIndentGuides: abstractTree_1.RenderIndentGuides.None,
                transformOptimization: false // Disable transform optimization #177470
            }, instantiationService, contextKeyService, listService, configurationService);
            this.getHTMLElement().classList.add('settings-editor-tree');
            this.style((0, defaultStyles_1.getListStyles)({
                listBackground: colorRegistry_1.editorBackground,
                listActiveSelectionBackground: colorRegistry_1.editorBackground,
                listActiveSelectionForeground: colorRegistry_1.foreground,
                listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                listFocusAndSelectionForeground: colorRegistry_1.foreground,
                listFocusBackground: colorRegistry_1.editorBackground,
                listFocusForeground: colorRegistry_1.foreground,
                listHoverForeground: colorRegistry_1.foreground,
                listHoverBackground: colorRegistry_1.editorBackground,
                listHoverOutline: colorRegistry_1.editorBackground,
                listFocusOutline: colorRegistry_1.editorBackground,
                listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionForeground: colorRegistry_1.foreground,
                listInactiveFocusBackground: colorRegistry_1.editorBackground,
                listInactiveFocusOutline: colorRegistry_1.editorBackground,
                treeIndentGuidesStroke: undefined,
                treeInactiveIndentGuidesStroke: undefined,
            }));
            this.disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.list.smoothScrolling')) {
                    this.updateOptions({
                        smoothScrolling: configurationService.getValue('workbench.list.smoothScrolling')
                    });
                }
            }));
        }
        createModel(user, view, options) {
            return new NonCollapsibleObjectTreeModel(user, view, options);
        }
    };
    exports.SettingsTree = SettingsTree;
    exports.SettingsTree = SettingsTree = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, configuration_2.IWorkbenchConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, language_1.ILanguageService),
        __param(8, userDataProfile_1.IUserDataProfilesService)
    ], SettingsTree);
    let CopySettingIdAction = class CopySettingIdAction extends actions_1.Action {
        static { CopySettingIdAction_1 = this; }
        static { this.ID = 'settings.copySettingId'; }
        static { this.LABEL = (0, nls_1.localize)('copySettingIdLabel', "Copy Setting ID"); }
        constructor(clipboardService) {
            super(CopySettingIdAction_1.ID, CopySettingIdAction_1.LABEL);
            this.clipboardService = clipboardService;
        }
        async run(context) {
            if (context) {
                await this.clipboardService.writeText(context.setting.key);
            }
            return Promise.resolve(undefined);
        }
    };
    CopySettingIdAction = CopySettingIdAction_1 = __decorate([
        __param(0, clipboardService_1.IClipboardService)
    ], CopySettingIdAction);
    let CopySettingAsJSONAction = class CopySettingAsJSONAction extends actions_1.Action {
        static { CopySettingAsJSONAction_1 = this; }
        static { this.ID = 'settings.copySettingAsJSON'; }
        static { this.LABEL = (0, nls_1.localize)('copySettingAsJSONLabel', "Copy Setting as JSON"); }
        constructor(clipboardService) {
            super(CopySettingAsJSONAction_1.ID, CopySettingAsJSONAction_1.LABEL);
            this.clipboardService = clipboardService;
        }
        async run(context) {
            if (context) {
                const jsonResult = `"${context.setting.key}": ${JSON.stringify(context.value, undefined, '  ')}`;
                await this.clipboardService.writeText(jsonResult);
            }
            return Promise.resolve(undefined);
        }
    };
    CopySettingAsJSONAction = CopySettingAsJSONAction_1 = __decorate([
        __param(0, clipboardService_1.IClipboardService)
    ], CopySettingAsJSONAction);
    let SyncSettingAction = class SyncSettingAction extends actions_1.Action {
        static { SyncSettingAction_1 = this; }
        static { this.ID = 'settings.stopSyncingSetting'; }
        static { this.LABEL = (0, nls_1.localize)('stopSyncingSetting', "Sync This Setting"); }
        constructor(setting, configService) {
            super(SyncSettingAction_1.ID, SyncSettingAction_1.LABEL);
            this.setting = setting;
            this.configService = configService;
            this._register(event_1.Event.filter(configService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.ignoredSettings'))(() => this.update()));
            this.update();
        }
        async update() {
            const ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this.configService);
            this.checked = !ignoredSettings.includes(this.setting.key);
        }
        async run() {
            // first remove the current setting completely from ignored settings
            let currentValue = [...this.configService.getValue('settingsSync.ignoredSettings')];
            currentValue = currentValue.filter(v => v !== this.setting.key && v !== `-${this.setting.key}`);
            const defaultIgnoredSettings = (0, userDataSync_1.getDefaultIgnoredSettings)();
            const isDefaultIgnored = defaultIgnoredSettings.includes(this.setting.key);
            const askedToSync = !this.checked;
            // If asked to sync, then add only if it is ignored by default
            if (askedToSync && isDefaultIgnored) {
                currentValue.push(`-${this.setting.key}`);
            }
            // If asked not to sync, then add only if it is not ignored by default
            if (!askedToSync && !isDefaultIgnored) {
                currentValue.push(this.setting.key);
            }
            this.configService.updateValue('settingsSync.ignoredSettings', currentValue.length ? currentValue : undefined, 2 /* ConfigurationTarget.USER */);
            return Promise.resolve(undefined);
        }
    };
    SyncSettingAction = SyncSettingAction_1 = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], SyncSettingAction);
    let ApplySettingToAllProfilesAction = class ApplySettingToAllProfilesAction extends actions_1.Action {
        static { ApplySettingToAllProfilesAction_1 = this; }
        static { this.ID = 'settings.applyToAllProfiles'; }
        static { this.LABEL = (0, nls_1.localize)('applyToAllProfiles', "Apply Setting to all Profiles"); }
        constructor(setting, configService) {
            super(ApplySettingToAllProfilesAction_1.ID, ApplySettingToAllProfilesAction_1.LABEL);
            this.setting = setting;
            this.configService = configService;
            this._register(event_1.Event.filter(configService.onDidChangeConfiguration, e => e.affectsConfiguration(configuration_2.APPLY_ALL_PROFILES_SETTING))(() => this.update()));
            this.update();
        }
        update() {
            const allProfilesSettings = this.configService.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING);
            this.checked = allProfilesSettings.includes(this.setting.key);
        }
        async run() {
            // first remove the current setting completely from ignored settings
            const value = this.configService.getValue(configuration_2.APPLY_ALL_PROFILES_SETTING) ?? [];
            if (this.checked) {
                value.splice(value.indexOf(this.setting.key), 1);
            }
            else {
                value.push(this.setting.key);
            }
            const newValue = (0, arrays_1.distinct)(value);
            if (this.checked) {
                await this.configService.updateValue(this.setting.key, this.configService.inspect(this.setting.key).application?.value, 3 /* ConfigurationTarget.USER_LOCAL */);
                await this.configService.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, newValue.length ? newValue : undefined, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
            else {
                await this.configService.updateValue(configuration_2.APPLY_ALL_PROFILES_SETTING, newValue.length ? newValue : undefined, 3 /* ConfigurationTarget.USER_LOCAL */);
                await this.configService.updateValue(this.setting.key, this.configService.inspect(this.setting.key).userLocal?.value, 3 /* ConfigurationTarget.USER_LOCAL */);
            }
        }
    };
    ApplySettingToAllProfilesAction = ApplySettingToAllProfilesAction_1 = __decorate([
        __param(1, configuration_2.IWorkbenchConfigurationService)
    ], ApplySettingToAllProfilesAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3NUcmVlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9wcmVmZXJlbmNlcy9icm93c2VyL3NldHRpbmdzVHJlZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBNlloRyxrREFNQztJQUVELGdGQUdDO0lBRUQsOEVBdUZDO0lBb0RELDREQUtDO0lBbmVELE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFaEIsU0FBUyw2QkFBNkIsQ0FBQyxPQUFtQztRQUN6RSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbEMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUNwRCxPQUFPLENBQUMsWUFBWSxDQUFDO1FBRXRCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDdEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMxQixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDVixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDeEIsTUFBTSxPQUFPLEdBQUcsT0FBTyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDcEUsT0FBTztnQkFDTixLQUFLLEVBQUU7b0JBQ04sSUFBSSxFQUFFLFFBQVE7b0JBQ2QsSUFBSSxFQUFFLEdBQUc7aUJBQ1Q7Z0JBQ0QsT0FBTztnQkFDUCxXQUFXLEVBQUUsT0FBTyxDQUFDLFNBQVM7YUFDOUIs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