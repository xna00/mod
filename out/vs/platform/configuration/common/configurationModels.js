/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/types", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays, event_1, json, lifecycle_1, map_1, objects, types, uri_1, configuration_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationChangeEvent = exports.Configuration = exports.UserSettings = exports.ConfigurationModelParser = exports.ConfigurationModel = void 0;
    exports.mergeChanges = mergeChanges;
    function freeze(data) {
        return Object.isFrozen(data) ? data : objects.deepFreeze(data);
    }
    class ConfigurationModel {
        constructor(_contents = {}, _keys = [], _overrides = [], raw) {
            this._contents = _contents;
            this._keys = _keys;
            this._overrides = _overrides;
            this.raw = raw;
            this.overrideConfigurations = new Map();
        }
        get rawConfiguration() {
            if (!this._rawConfiguration) {
                if (this.raw?.length) {
                    const rawConfigurationModels = this.raw.map(raw => {
                        if (raw instanceof ConfigurationModel) {
                            return raw;
                        }
                        const parser = new ConfigurationModelParser('');
                        parser.parseRaw(raw);
                        return parser.configurationModel;
                    });
                    this._rawConfiguration = rawConfigurationModels.reduce((previous, current) => current === previous ? current : previous.merge(current), rawConfigurationModels[0]);
                }
                else {
                    // raw is same as current
                    this._rawConfiguration = this;
                }
            }
            return this._rawConfiguration;
        }
        get contents() {
            return this._contents;
        }
        get overrides() {
            return this._overrides;
        }
        get keys() {
            return this._keys;
        }
        isEmpty() {
            return this._keys.length === 0 && Object.keys(this._contents).length === 0 && this._overrides.length === 0;
        }
        getValue(section) {
            return section ? (0, configuration_1.getConfigurationValue)(this.contents, section) : this.contents;
        }
        inspect(section, overrideIdentifier) {
            const that = this;
            return {
                get value() {
                    return freeze(that.rawConfiguration.getValue(section));
                },
                get override() {
                    return overrideIdentifier ? freeze(that.rawConfiguration.getOverrideValue(section, overrideIdentifier)) : undefined;
                },
                get merged() {
                    return freeze(overrideIdentifier ? that.rawConfiguration.override(overrideIdentifier).getValue(section) : that.rawConfiguration.getValue(section));
                },
                get overrides() {
                    const overrides = [];
                    for (const { contents, identifiers, keys } of that.rawConfiguration.overrides) {
                        const value = new ConfigurationModel(contents, keys).getValue(section);
                        if (value !== undefined) {
                            overrides.push({ identifiers, value });
                        }
                    }
                    return overrides.length ? freeze(overrides) : undefined;
                }
            };
        }
        getOverrideValue(section, overrideIdentifier) {
            const overrideContents = this.getContentsForOverrideIdentifer(overrideIdentifier);
            return overrideContents
                ? section ? (0, configuration_1.getConfigurationValue)(overrideContents, section) : overrideContents
                : undefined;
        }
        getKeysForOverrideIdentifier(identifier) {
            const keys = [];
            for (const override of this.overrides) {
                if (override.identifiers.includes(identifier)) {
                    keys.push(...override.keys);
                }
            }
            return arrays.distinct(keys);
        }
        getAllOverrideIdentifiers() {
            const result = [];
            for (const override of this.overrides) {
                result.push(...override.identifiers);
            }
            return arrays.distinct(result);
        }
        override(identifier) {
            let overrideConfigurationModel = this.overrideConfigurations.get(identifier);
            if (!overrideConfigurationModel) {
                overrideConfigurationModel = this.createOverrideConfigurationModel(identifier);
                this.overrideConfigurations.set(identifier, overrideConfigurationModel);
            }
            return overrideConfigurationModel;
        }
        merge(...others) {
            const contents = objects.deepClone(this.contents);
            const overrides = objects.deepClone(this.overrides);
            const keys = [...this.keys];
            const raws = this.raw?.length ? [...this.raw] : [this];
            for (const other of others) {
                raws.push(...(other.raw?.length ? other.raw : [other]));
                if (other.isEmpty()) {
                    continue;
                }
                this.mergeContents(contents, other.contents);
                for (const otherOverride of other.overrides) {
                    const [override] = overrides.filter(o => arrays.equals(o.identifiers, otherOverride.identifiers));
                    if (override) {
                        this.mergeContents(override.contents, otherOverride.contents);
                        override.keys.push(...otherOverride.keys);
                        override.keys = arrays.distinct(override.keys);
                    }
                    else {
                        overrides.push(objects.deepClone(otherOverride));
                    }
                }
                for (const key of other.keys) {
                    if (keys.indexOf(key) === -1) {
                        keys.push(key);
                    }
                }
            }
            return new ConfigurationModel(contents, keys, overrides, raws.every(raw => raw instanceof ConfigurationModel) ? undefined : raws);
        }
        createOverrideConfigurationModel(identifier) {
            const overrideContents = this.getContentsForOverrideIdentifer(identifier);
            if (!overrideContents || typeof overrideContents !== 'object' || !Object.keys(overrideContents).length) {
                // If there are no valid overrides, return self
                return this;
            }
            const contents = {};
            for (const key of arrays.distinct([...Object.keys(this.contents), ...Object.keys(overrideContents)])) {
                let contentsForKey = this.contents[key];
                const overrideContentsForKey = overrideContents[key];
                // If there are override contents for the key, clone and merge otherwise use base contents
                if (overrideContentsForKey) {
                    // Clone and merge only if base contents and override contents are of type object otherwise just override
                    if (typeof contentsForKey === 'object' && typeof overrideContentsForKey === 'object') {
                        contentsForKey = objects.deepClone(contentsForKey);
                        this.mergeContents(contentsForKey, overrideContentsForKey);
                    }
                    else {
                        contentsForKey = overrideContentsForKey;
                    }
                }
                contents[key] = contentsForKey;
            }
            return new ConfigurationModel(contents, this.keys, this.overrides);
        }
        mergeContents(source, target) {
            for (const key of Object.keys(target)) {
                if (key in source) {
                    if (types.isObject(source[key]) && types.isObject(target[key])) {
                        this.mergeContents(source[key], target[key]);
                        continue;
                    }
                }
                source[key] = objects.deepClone(target[key]);
            }
        }
        getContentsForOverrideIdentifer(identifier) {
            let contentsForIdentifierOnly = null;
            let contents = null;
            const mergeContents = (contentsToMerge) => {
                if (contentsToMerge) {
                    if (contents) {
                        this.mergeContents(contents, contentsToMerge);
                    }
                    else {
                        contents = objects.deepClone(contentsToMerge);
                    }
                }
            };
            for (const override of this.overrides) {
                if (override.identifiers.length === 1 && override.identifiers[0] === identifier) {
                    contentsForIdentifierOnly = override.contents;
                }
                else if (override.identifiers.includes(identifier)) {
                    mergeContents(override.contents);
                }
            }
            // Merge contents of the identifier only at the end to take precedence.
            mergeContents(contentsForIdentifierOnly);
            return contents;
        }
        toJSON() {
            return {
                contents: this.contents,
                overrides: this.overrides,
                keys: this.keys
            };
        }
        // Update methods
        addValue(key, value) {
            this.updateValue(key, value, true);
        }
        setValue(key, value) {
            this.updateValue(key, value, false);
        }
        removeValue(key) {
            const index = this.keys.indexOf(key);
            if (index === -1) {
                return;
            }
            this.keys.splice(index, 1);
            (0, configuration_1.removeFromValueTree)(this.contents, key);
            if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                this.overrides.splice(this.overrides.findIndex(o => arrays.equals(o.identifiers, (0, configurationRegistry_1.overrideIdentifiersFromKey)(key))), 1);
            }
        }
        updateValue(key, value, add) {
            (0, configuration_1.addToValueTree)(this.contents, key, value, e => console.error(e));
            add = add || this.keys.indexOf(key) === -1;
            if (add) {
                this.keys.push(key);
            }
            if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                this.overrides.push({
                    identifiers: (0, configurationRegistry_1.overrideIdentifiersFromKey)(key),
                    keys: Object.keys(this.contents[key]),
                    contents: (0, configuration_1.toValuesTree)(this.contents[key], message => console.error(message)),
                });
            }
        }
    }
    exports.ConfigurationModel = ConfigurationModel;
    class ConfigurationModelParser {
        constructor(_name) {
            this._name = _name;
            this._raw = null;
            this._configurationModel = null;
            this._restrictedConfigurations = [];
            this._parseErrors = [];
        }
        get configurationModel() {
            return this._configurationModel || new ConfigurationModel();
        }
        get restrictedConfigurations() {
            return this._restrictedConfigurations;
        }
        get errors() {
            return this._parseErrors;
        }
        parse(content, options) {
            if (!types.isUndefinedOrNull(content)) {
                const raw = this.doParseContent(content);
                this.parseRaw(raw, options);
            }
        }
        reparse(options) {
            if (this._raw) {
                this.parseRaw(this._raw, options);
            }
        }
        parseRaw(raw, options) {
            this._raw = raw;
            const { contents, keys, overrides, restricted, hasExcludedProperties } = this.doParseRaw(raw, options);
            this._configurationModel = new ConfigurationModel(contents, keys, overrides, hasExcludedProperties ? [raw] : undefined /* raw has not changed */);
            this._restrictedConfigurations = restricted || [];
        }
        doParseContent(content) {
            let raw = {};
            let currentProperty = null;
            let currentParent = [];
            const previousParents = [];
            const parseErrors = [];
            function onValue(value) {
                if (Array.isArray(currentParent)) {
                    currentParent.push(value);
                }
                else if (currentProperty !== null) {
                    currentParent[currentProperty] = value;
                }
            }
            const visitor = {
                onObjectBegin: () => {
                    const object = {};
                    onValue(object);
                    previousParents.push(currentParent);
                    currentParent = object;
                    currentProperty = null;
                },
                onObjectProperty: (name) => {
                    currentProperty = name;
                },
                onObjectEnd: () => {
                    currentParent = previousParents.pop();
                },
                onArrayBegin: () => {
                    const array = [];
                    onValue(array);
                    previousParents.push(currentParent);
                    currentParent = array;
                    currentProperty = null;
                },
                onArrayEnd: () => {
                    currentParent = previousParents.pop();
                },
                onLiteralValue: onValue,
                onError: (error, offset, length) => {
                    parseErrors.push({ error, offset, length });
                }
            };
            if (content) {
                try {
                    json.visit(content, visitor);
                    raw = currentParent[0] || {};
                }
                catch (e) {
                    console.error(`Error while parsing settings file ${this._name}: ${e}`);
                    this._parseErrors = [e];
                }
            }
            return raw;
        }
        doParseRaw(raw, options) {
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const filtered = this.filter(raw, configurationProperties, true, options);
            raw = filtered.raw;
            const contents = (0, configuration_1.toValuesTree)(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const keys = Object.keys(raw);
            const overrides = this.toOverrides(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            return { contents, keys, overrides, restricted: filtered.restricted, hasExcludedProperties: filtered.hasExcludedProperties };
        }
        filter(properties, configurationProperties, filterOverriddenProperties, options) {
            let hasExcludedProperties = false;
            if (!options?.scopes && !options?.skipRestricted && !options?.exclude?.length) {
                return { raw: properties, restricted: [], hasExcludedProperties };
            }
            const raw = {};
            const restricted = [];
            for (const key in properties) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) && filterOverriddenProperties) {
                    const result = this.filter(properties[key], configurationProperties, false, options);
                    raw[key] = result.raw;
                    hasExcludedProperties = hasExcludedProperties || result.hasExcludedProperties;
                    restricted.push(...result.restricted);
                }
                else {
                    const propertySchema = configurationProperties[key];
                    const scope = propertySchema ? typeof propertySchema.scope !== 'undefined' ? propertySchema.scope : 3 /* ConfigurationScope.WINDOW */ : undefined;
                    if (propertySchema?.restricted) {
                        restricted.push(key);
                    }
                    if (!options.exclude?.includes(key) /* Check exclude */
                        && (options.include?.includes(key) /* Check include */
                            || ((scope === undefined || options.scopes === undefined || options.scopes.includes(scope)) /* Check scopes */
                                && !(options.skipRestricted && propertySchema?.restricted)))) /* Check restricted */ {
                        raw[key] = properties[key];
                    }
                    else {
                        hasExcludedProperties = true;
                    }
                }
            }
            return { raw, restricted, hasExcludedProperties };
        }
        toOverrides(raw, conflictReporter) {
            const overrides = [];
            for (const key of Object.keys(raw)) {
                if (configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key)) {
                    const overrideRaw = {};
                    for (const keyInOverrideRaw in raw[key]) {
                        overrideRaw[keyInOverrideRaw] = raw[key][keyInOverrideRaw];
                    }
                    overrides.push({
                        identifiers: (0, configurationRegistry_1.overrideIdentifiersFromKey)(key),
                        keys: Object.keys(overrideRaw),
                        contents: (0, configuration_1.toValuesTree)(overrideRaw, conflictReporter)
                    });
                }
            }
            return overrides;
        }
    }
    exports.ConfigurationModelParser = ConfigurationModelParser;
    class UserSettings extends lifecycle_1.Disposable {
        constructor(userSettingsResource, parseOptions, extUri, fileService) {
            super();
            this.userSettingsResource = userSettingsResource;
            this.parseOptions = parseOptions;
            this.fileService = fileService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.parser = new ConfigurationModelParser(this.userSettingsResource.toString());
            this._register(this.fileService.watch(extUri.dirname(this.userSettingsResource)));
            // Also listen to the resource incase the resource is a symlink - https://github.com/microsoft/vscode/issues/118134
            this._register(this.fileService.watch(this.userSettingsResource));
            this._register(event_1.Event.any(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.userSettingsResource)), event_1.Event.filter(this.fileService.onDidRunOperation, e => (e.isOperation(0 /* FileOperation.CREATE */) || e.isOperation(3 /* FileOperation.COPY */) || e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(4 /* FileOperation.WRITE */)) && extUri.isEqual(e.resource, userSettingsResource)))(() => this._onDidChange.fire()));
        }
        async loadConfiguration() {
            try {
                const content = await this.fileService.readFile(this.userSettingsResource);
                this.parser.parse(content.value.toString() || '{}', this.parseOptions);
                return this.parser.configurationModel;
            }
            catch (e) {
                return new ConfigurationModel();
            }
        }
        reparse(parseOptions) {
            if (parseOptions) {
                this.parseOptions = parseOptions;
            }
            this.parser.reparse(this.parseOptions);
            return this.parser.configurationModel;
        }
        getRestrictedSettings() {
            return this.parser.restrictedConfigurations;
        }
    }
    exports.UserSettings = UserSettings;
    class ConfigurationInspectValue {
        constructor(key, overrides, _value, overrideIdentifiers, defaultConfiguration, policyConfiguration, applicationConfiguration, userConfiguration, localUserConfiguration, remoteUserConfiguration, workspaceConfiguration, folderConfigurationModel, memoryConfigurationModel) {
            this.key = key;
            this.overrides = overrides;
            this._value = _value;
            this.overrideIdentifiers = overrideIdentifiers;
            this.defaultConfiguration = defaultConfiguration;
            this.policyConfiguration = policyConfiguration;
            this.applicationConfiguration = applicationConfiguration;
            this.userConfiguration = userConfiguration;
            this.localUserConfiguration = localUserConfiguration;
            this.remoteUserConfiguration = remoteUserConfiguration;
            this.workspaceConfiguration = workspaceConfiguration;
            this.folderConfigurationModel = folderConfigurationModel;
            this.memoryConfigurationModel = memoryConfigurationModel;
        }
        get value() {
            return freeze(this._value);
        }
        toInspectValue(inspectValue) {
            return inspectValue?.value !== undefined || inspectValue?.override !== undefined || inspectValue?.overrides !== undefined ? inspectValue : undefined;
        }
        get defaultInspectValue() {
            if (!this._defaultInspectValue) {
                this._defaultInspectValue = this.defaultConfiguration.inspect(this.key, this.overrides.overrideIdentifier);
            }
            return this._defaultInspectValue;
        }
        get defaultValue() {
            return this.defaultInspectValue.merged;
        }
        get default() {
            return this.toInspectValue(this.defaultInspectValue);
        }
        get policyInspectValue() {
            if (this._policyInspectValue === undefined) {
                this._policyInspectValue = this.policyConfiguration ? this.policyConfiguration.inspect(this.key) : null;
            }
            return this._policyInspectValue;
        }
        get policyValue() {
            return this.policyInspectValue?.merged;
        }
        get policy() {
            return this.policyInspectValue?.value !== undefined ? { value: this.policyInspectValue.value } : undefined;
        }
        get applicationInspectValue() {
            if (this._applicationInspectValue === undefined) {
                this._applicationInspectValue = this.applicationConfiguration ? this.applicationConfiguration.inspect(this.key) : null;
            }
            return this._applicationInspectValue;
        }
        get applicationValue() {
            return this.applicationInspectValue?.merged;
        }
        get application() {
            return this.toInspectValue(this.applicationInspectValue);
        }
        get userInspectValue() {
            if (!this._userInspectValue) {
                this._userInspectValue = this.userConfiguration.inspect(this.key, this.overrides.overrideIdentifier);
            }
            return this._userInspectValue;
        }
        get userValue() {
            return this.userInspectValue.merged;
        }
        get user() {
            return this.toInspectValue(this.userInspectValue);
        }
        get userLocalInspectValue() {
            if (!this._userLocalInspectValue) {
                this._userLocalInspectValue = this.localUserConfiguration.inspect(this.key, this.overrides.overrideIdentifier);
            }
            return this._userLocalInspectValue;
        }
        get userLocalValue() {
            return this.userLocalInspectValue.merged;
        }
        get userLocal() {
            return this.toInspectValue(this.userLocalInspectValue);
        }
        get userRemoteInspectValue() {
            if (!this._userRemoteInspectValue) {
                this._userRemoteInspectValue = this.remoteUserConfiguration.inspect(this.key, this.overrides.overrideIdentifier);
            }
            return this._userRemoteInspectValue;
        }
        get userRemoteValue() {
            return this.userRemoteInspectValue.merged;
        }
        get userRemote() {
            return this.toInspectValue(this.userRemoteInspectValue);
        }
        get workspaceInspectValue() {
            if (this._workspaceInspectValue === undefined) {
                this._workspaceInspectValue = this.workspaceConfiguration ? this.workspaceConfiguration.inspect(this.key, this.overrides.overrideIdentifier) : null;
            }
            return this._workspaceInspectValue;
        }
        get workspaceValue() {
            return this.workspaceInspectValue?.merged;
        }
        get workspace() {
            return this.toInspectValue(this.workspaceInspectValue);
        }
        get workspaceFolderInspectValue() {
            if (this._workspaceFolderInspectValue === undefined) {
                this._workspaceFolderInspectValue = this.folderConfigurationModel ? this.folderConfigurationModel.inspect(this.key, this.overrides.overrideIdentifier) : null;
            }
            return this._workspaceFolderInspectValue;
        }
        get workspaceFolderValue() {
            return this.workspaceFolderInspectValue?.merged;
        }
        get workspaceFolder() {
            return this.toInspectValue(this.workspaceFolderInspectValue);
        }
        get memoryInspectValue() {
            if (this._memoryInspectValue === undefined) {
                this._memoryInspectValue = this.memoryConfigurationModel.inspect(this.key, this.overrides.overrideIdentifier);
            }
            return this._memoryInspectValue;
        }
        get memoryValue() {
            return this.memoryInspectValue.merged;
        }
        get memory() {
            return this.toInspectValue(this.memoryInspectValue);
        }
    }
    class Configuration {
        constructor(_defaultConfiguration, _policyConfiguration, _applicationConfiguration, _localUserConfiguration, _remoteUserConfiguration = new ConfigurationModel(), _workspaceConfiguration = new ConfigurationModel(), _folderConfigurations = new map_1.ResourceMap(), _memoryConfiguration = new ConfigurationModel(), _memoryConfigurationByResource = new map_1.ResourceMap()) {
            this._defaultConfiguration = _defaultConfiguration;
            this._policyConfiguration = _policyConfiguration;
            this._applicationConfiguration = _applicationConfiguration;
            this._localUserConfiguration = _localUserConfiguration;
            this._remoteUserConfiguration = _remoteUserConfiguration;
            this._workspaceConfiguration = _workspaceConfiguration;
            this._folderConfigurations = _folderConfigurations;
            this._memoryConfiguration = _memoryConfiguration;
            this._memoryConfigurationByResource = _memoryConfigurationByResource;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations = new map_1.ResourceMap();
            this._userConfiguration = null;
        }
        getValue(section, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidatedConfigurationModel(section, overrides, workspace);
            return consolidateConfigurationModel.getValue(section);
        }
        updateValue(key, value, overrides = {}) {
            let memoryConfiguration;
            if (overrides.resource) {
                memoryConfiguration = this._memoryConfigurationByResource.get(overrides.resource);
                if (!memoryConfiguration) {
                    memoryConfiguration = new ConfigurationModel();
                    this._memoryConfigurationByResource.set(overrides.resource, memoryConfiguration);
                }
            }
            else {
                memoryConfiguration = this._memoryConfiguration;
            }
            if (value === undefined) {
                memoryConfiguration.removeValue(key);
            }
            else {
                memoryConfiguration.setValue(key, value);
            }
            if (!overrides.resource) {
                this._workspaceConsolidatedConfiguration = null;
            }
        }
        inspect(key, overrides, workspace) {
            const consolidateConfigurationModel = this.getConsolidatedConfigurationModel(key, overrides, workspace);
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(overrides.resource, workspace);
            const memoryConfigurationModel = overrides.resource ? this._memoryConfigurationByResource.get(overrides.resource) || this._memoryConfiguration : this._memoryConfiguration;
            const overrideIdentifiers = new Set();
            for (const override of consolidateConfigurationModel.overrides) {
                for (const overrideIdentifier of override.identifiers) {
                    if (consolidateConfigurationModel.getOverrideValue(key, overrideIdentifier) !== undefined) {
                        overrideIdentifiers.add(overrideIdentifier);
                    }
                }
            }
            return new ConfigurationInspectValue(key, overrides, consolidateConfigurationModel.getValue(key), overrideIdentifiers.size ? [...overrideIdentifiers] : undefined, this._defaultConfiguration, this._policyConfiguration.isEmpty() ? undefined : this._policyConfiguration, this.applicationConfiguration.isEmpty() ? undefined : this.applicationConfiguration, this.userConfiguration, this.localUserConfiguration, this.remoteUserConfiguration, workspace ? this._workspaceConfiguration : undefined, folderConfigurationModel ? folderConfigurationModel : undefined, memoryConfigurationModel);
        }
        keys(workspace) {
            const folderConfigurationModel = this.getFolderConfigurationModelForResource(undefined, workspace);
            return {
                default: this._defaultConfiguration.keys.slice(0),
                user: this.userConfiguration.keys.slice(0),
                workspace: this._workspaceConfiguration.keys.slice(0),
                workspaceFolder: folderConfigurationModel ? folderConfigurationModel.keys.slice(0) : []
            };
        }
        updateDefaultConfiguration(defaultConfiguration) {
            this._defaultConfiguration = defaultConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updatePolicyConfiguration(policyConfiguration) {
            this._policyConfiguration = policyConfiguration;
        }
        updateApplicationConfiguration(applicationConfiguration) {
            this._applicationConfiguration = applicationConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateLocalUserConfiguration(localUserConfiguration) {
            this._localUserConfiguration = localUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateRemoteUserConfiguration(remoteUserConfiguration) {
            this._remoteUserConfiguration = remoteUserConfiguration;
            this._userConfiguration = null;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateWorkspaceConfiguration(workspaceConfiguration) {
            this._workspaceConfiguration = workspaceConfiguration;
            this._workspaceConsolidatedConfiguration = null;
            this._foldersConsolidatedConfigurations.clear();
        }
        updateFolderConfiguration(resource, configuration) {
            this._folderConfigurations.set(resource, configuration);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        deleteFolderConfiguration(resource) {
            this.folderConfigurations.delete(resource);
            this._foldersConsolidatedConfigurations.delete(resource);
        }
        compareAndUpdateDefaultConfiguration(defaults, keys) {
            const overrides = [];
            if (!keys) {
                const { added, updated, removed } = compare(this._defaultConfiguration, defaults);
                keys = [...added, ...updated, ...removed];
            }
            for (const key of keys) {
                for (const overrideIdentifier of (0, configurationRegistry_1.overrideIdentifiersFromKey)(key)) {
                    const fromKeys = this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier);
                    const toKeys = defaults.getKeysForOverrideIdentifier(overrideIdentifier);
                    const keys = [
                        ...toKeys.filter(key => fromKeys.indexOf(key) === -1),
                        ...fromKeys.filter(key => toKeys.indexOf(key) === -1),
                        ...fromKeys.filter(key => !objects.equals(this._defaultConfiguration.override(overrideIdentifier).getValue(key), defaults.override(overrideIdentifier).getValue(key)))
                    ];
                    overrides.push([overrideIdentifier, keys]);
                }
            }
            this.updateDefaultConfiguration(defaults);
            return { keys, overrides };
        }
        compareAndUpdatePolicyConfiguration(policyConfiguration) {
            const { added, updated, removed } = compare(this._policyConfiguration, policyConfiguration);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updatePolicyConfiguration(policyConfiguration);
            }
            return { keys, overrides: [] };
        }
        compareAndUpdateApplicationConfiguration(application) {
            const { added, updated, removed, overrides } = compare(this.applicationConfiguration, application);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateApplicationConfiguration(application);
            }
            return { keys, overrides };
        }
        compareAndUpdateLocalUserConfiguration(user) {
            const { added, updated, removed, overrides } = compare(this.localUserConfiguration, user);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateLocalUserConfiguration(user);
            }
            return { keys, overrides };
        }
        compareAndUpdateRemoteUserConfiguration(user) {
            const { added, updated, removed, overrides } = compare(this.remoteUserConfiguration, user);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateRemoteUserConfiguration(user);
            }
            return { keys, overrides };
        }
        compareAndUpdateWorkspaceConfiguration(workspaceConfiguration) {
            const { added, updated, removed, overrides } = compare(this.workspaceConfiguration, workspaceConfiguration);
            const keys = [...added, ...updated, ...removed];
            if (keys.length) {
                this.updateWorkspaceConfiguration(workspaceConfiguration);
            }
            return { keys, overrides };
        }
        compareAndUpdateFolderConfiguration(resource, folderConfiguration) {
            const currentFolderConfiguration = this.folderConfigurations.get(resource);
            const { added, updated, removed, overrides } = compare(currentFolderConfiguration, folderConfiguration);
            const keys = [...added, ...updated, ...removed];
            if (keys.length || !currentFolderConfiguration) {
                this.updateFolderConfiguration(resource, folderConfiguration);
            }
            return { keys, overrides };
        }
        compareAndDeleteFolderConfiguration(folder) {
            const folderConfig = this.folderConfigurations.get(folder);
            if (!folderConfig) {
                throw new Error('Unknown folder');
            }
            this.deleteFolderConfiguration(folder);
            const { added, updated, removed, overrides } = compare(folderConfig, undefined);
            return { keys: [...added, ...updated, ...removed], overrides };
        }
        get defaults() {
            return this._defaultConfiguration;
        }
        get applicationConfiguration() {
            return this._applicationConfiguration;
        }
        get userConfiguration() {
            if (!this._userConfiguration) {
                this._userConfiguration = this._remoteUserConfiguration.isEmpty() ? this._localUserConfiguration : this._localUserConfiguration.merge(this._remoteUserConfiguration);
            }
            return this._userConfiguration;
        }
        get localUserConfiguration() {
            return this._localUserConfiguration;
        }
        get remoteUserConfiguration() {
            return this._remoteUserConfiguration;
        }
        get workspaceConfiguration() {
            return this._workspaceConfiguration;
        }
        get folderConfigurations() {
            return this._folderConfigurations;
        }
        getConsolidatedConfigurationModel(section, overrides, workspace) {
            let configurationModel = this.getConsolidatedConfigurationModelForResource(overrides, workspace);
            if (overrides.overrideIdentifier) {
                configurationModel = configurationModel.override(overrides.overrideIdentifier);
            }
            if (!this._policyConfiguration.isEmpty() && this._policyConfiguration.getValue(section) !== undefined) {
                configurationModel = configurationModel.merge(this._policyConfiguration);
            }
            return configurationModel;
        }
        getConsolidatedConfigurationModelForResource({ resource }, workspace) {
            let consolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    consolidateConfiguration = this.getFolderConsolidatedConfiguration(root.uri) || consolidateConfiguration;
                }
                const memoryConfigurationForResource = this._memoryConfigurationByResource.get(resource);
                if (memoryConfigurationForResource) {
                    consolidateConfiguration = consolidateConfiguration.merge(memoryConfigurationForResource);
                }
            }
            return consolidateConfiguration;
        }
        getWorkspaceConsolidatedConfiguration() {
            if (!this._workspaceConsolidatedConfiguration) {
                this._workspaceConsolidatedConfiguration = this._defaultConfiguration.merge(this.applicationConfiguration, this.userConfiguration, this._workspaceConfiguration, this._memoryConfiguration);
            }
            return this._workspaceConsolidatedConfiguration;
        }
        getFolderConsolidatedConfiguration(folder) {
            let folderConsolidatedConfiguration = this._foldersConsolidatedConfigurations.get(folder);
            if (!folderConsolidatedConfiguration) {
                const workspaceConsolidateConfiguration = this.getWorkspaceConsolidatedConfiguration();
                const folderConfiguration = this._folderConfigurations.get(folder);
                if (folderConfiguration) {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration.merge(folderConfiguration);
                    this._foldersConsolidatedConfigurations.set(folder, folderConsolidatedConfiguration);
                }
                else {
                    folderConsolidatedConfiguration = workspaceConsolidateConfiguration;
                }
            }
            return folderConsolidatedConfiguration;
        }
        getFolderConfigurationModelForResource(resource, workspace) {
            if (workspace && resource) {
                const root = workspace.getFolder(resource);
                if (root) {
                    return this._folderConfigurations.get(root.uri);
                }
            }
            return undefined;
        }
        toData() {
            return {
                defaults: {
                    contents: this._defaultConfiguration.contents,
                    overrides: this._defaultConfiguration.overrides,
                    keys: this._defaultConfiguration.keys
                },
                policy: {
                    contents: this._policyConfiguration.contents,
                    overrides: this._policyConfiguration.overrides,
                    keys: this._policyConfiguration.keys
                },
                application: {
                    contents: this.applicationConfiguration.contents,
                    overrides: this.applicationConfiguration.overrides,
                    keys: this.applicationConfiguration.keys
                },
                user: {
                    contents: this.userConfiguration.contents,
                    overrides: this.userConfiguration.overrides,
                    keys: this.userConfiguration.keys
                },
                workspace: {
                    contents: this._workspaceConfiguration.contents,
                    overrides: this._workspaceConfiguration.overrides,
                    keys: this._workspaceConfiguration.keys
                },
                folders: [...this._folderConfigurations.keys()].reduce((result, folder) => {
                    const { contents, overrides, keys } = this._folderConfigurations.get(folder);
                    result.push([folder, { contents, overrides, keys }]);
                    return result;
                }, [])
            };
        }
        allKeys() {
            const keys = new Set();
            this._defaultConfiguration.keys.forEach(key => keys.add(key));
            this.userConfiguration.keys.forEach(key => keys.add(key));
            this._workspaceConfiguration.keys.forEach(key => keys.add(key));
            this._folderConfigurations.forEach(folderConfiguration => folderConfiguration.keys.forEach(key => keys.add(key)));
            return [...keys.values()];
        }
        allOverrideIdentifiers() {
            const keys = new Set();
            this._defaultConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
            this.userConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
            this._workspaceConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key));
            this._folderConfigurations.forEach(folderConfiguration => folderConfiguration.getAllOverrideIdentifiers().forEach(key => keys.add(key)));
            return [...keys.values()];
        }
        getAllKeysForOverrideIdentifier(overrideIdentifier) {
            const keys = new Set();
            this._defaultConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this.userConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this._workspaceConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key));
            this._folderConfigurations.forEach(folderConfiguration => folderConfiguration.getKeysForOverrideIdentifier(overrideIdentifier).forEach(key => keys.add(key)));
            return [...keys.values()];
        }
        static parse(data) {
            const defaultConfiguration = this.parseConfigurationModel(data.defaults);
            const policyConfiguration = this.parseConfigurationModel(data.policy);
            const applicationConfiguration = this.parseConfigurationModel(data.application);
            const userConfiguration = this.parseConfigurationModel(data.user);
            const workspaceConfiguration = this.parseConfigurationModel(data.workspace);
            const folders = data.folders.reduce((result, value) => {
                result.set(uri_1.URI.revive(value[0]), this.parseConfigurationModel(value[1]));
                return result;
            }, new map_1.ResourceMap());
            return new Configuration(defaultConfiguration, policyConfiguration, applicationConfiguration, userConfiguration, new ConfigurationModel(), workspaceConfiguration, folders, new ConfigurationModel(), new map_1.ResourceMap());
        }
        static parseConfigurationModel(model) {
            return new ConfigurationModel(model.contents, model.keys, model.overrides);
        }
    }
    exports.Configuration = Configuration;
    function mergeChanges(...changes) {
        if (changes.length === 0) {
            return { keys: [], overrides: [] };
        }
        if (changes.length === 1) {
            return changes[0];
        }
        const keysSet = new Set();
        const overridesMap = new Map();
        for (const change of changes) {
            change.keys.forEach(key => keysSet.add(key));
            change.overrides.forEach(([identifier, keys]) => {
                const result = (0, map_1.getOrSet)(overridesMap, identifier, new Set());
                keys.forEach(key => result.add(key));
            });
        }
        const overrides = [];
        overridesMap.forEach((keys, identifier) => overrides.push([identifier, [...keys.values()]]));
        return { keys: [...keysSet.values()], overrides };
    }
    class ConfigurationChangeEvent {
        constructor(change, previous, currentConfiguraiton, currentWorkspace) {
            this.change = change;
            this.previous = previous;
            this.currentConfiguraiton = currentConfiguraiton;
            this.currentWorkspace = currentWorkspace;
            this._marker = '\n';
            this._markerCode1 = this._marker.charCodeAt(0);
            this._markerCode2 = '.'.charCodeAt(0);
            this.affectedKeys = new Set();
            this._previousConfiguration = undefined;
            for (const key of change.keys) {
                this.affectedKeys.add(key);
            }
            for (const [, keys] of change.overrides) {
                for (const key of keys) {
                    this.affectedKeys.add(key);
                }
            }
            // Example: '\nfoo.bar\nabc.def\n'
            this._affectsConfigStr = this._marker;
            for (const key of this.affectedKeys) {
                this._affectsConfigStr += key + this._marker;
            }
        }
        get previousConfiguration() {
            if (!this._previousConfiguration && this.previous) {
                this._previousConfiguration = Configuration.parse(this.previous.data);
            }
            return this._previousConfiguration;
        }
        affectsConfiguration(section, overrides) {
            // we have one large string with all keys that have changed. we pad (marker) the section
            // and check that either find it padded or before a segment character
            const needle = this._marker + section;
            const idx = this._affectsConfigStr.indexOf(needle);
            if (idx < 0) {
                // NOT: (marker + section)
                return false;
            }
            const pos = idx + needle.length;
            if (pos >= this._affectsConfigStr.length) {
                return false;
            }
            const code = this._affectsConfigStr.charCodeAt(pos);
            if (code !== this._markerCode1 && code !== this._markerCode2) {
                // NOT: section + (marker | segment)
                return false;
            }
            if (overrides) {
                const value1 = this.previousConfiguration ? this.previousConfiguration.getValue(section, overrides, this.previous?.workspace) : undefined;
                const value2 = this.currentConfiguraiton.getValue(section, overrides, this.currentWorkspace);
                return !objects.equals(value1, value2);
            }
            return true;
        }
    }
    exports.ConfigurationChangeEvent = ConfigurationChangeEvent;
    function compare(from, to) {
        const { added, removed, updated } = compareConfigurationContents(to?.rawConfiguration, from?.rawConfiguration);
        const overrides = [];
        const fromOverrideIdentifiers = from?.getAllOverrideIdentifiers() || [];
        const toOverrideIdentifiers = to?.getAllOverrideIdentifiers() || [];
        if (to) {
            const addedOverrideIdentifiers = toOverrideIdentifiers.filter(key => !fromOverrideIdentifiers.includes(key));
            for (const identifier of addedOverrideIdentifiers) {
                overrides.push([identifier, to.getKeysForOverrideIdentifier(identifier)]);
            }
        }
        if (from) {
            const removedOverrideIdentifiers = fromOverrideIdentifiers.filter(key => !toOverrideIdentifiers.includes(key));
            for (const identifier of removedOverrideIdentifiers) {
                overrides.push([identifier, from.getKeysForOverrideIdentifier(identifier)]);
            }
        }
        if (to && from) {
            for (const identifier of fromOverrideIdentifiers) {
                if (toOverrideIdentifiers.includes(identifier)) {
                    const result = compareConfigurationContents({ contents: from.getOverrideValue(undefined, identifier) || {}, keys: from.getKeysForOverrideIdentifier(identifier) }, { contents: to.getOverrideValue(undefined, identifier) || {}, keys: to.getKeysForOverrideIdentifier(identifier) });
                    overrides.push([identifier, [...result.added, ...result.removed, ...result.updated]]);
                }
            }
        }
        return { added, removed, updated, overrides };
    }
    function compareConfigurationContents(to, from) {
        const added = to
            ? from ? to.keys.filter(key => from.keys.indexOf(key) === -1) : [...to.keys]
            : [];
        const removed = from
            ? to ? from.keys.filter(key => to.keys.indexOf(key) === -1) : [...from.keys]
            : [];
        const updated = [];
        if (to && from) {
            for (const key of from.keys) {
                if (to.keys.indexOf(key) !== -1) {
                    const value1 = (0, configuration_1.getConfigurationValue)(from.contents, key);
                    const value2 = (0, configuration_1.getConfigurationValue)(to.contents, key);
                    if (!objects.equals(value1, value2)) {
                        updated.push(key);
                    }
                }
            }
        }
        return { added, removed, updated };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbk1vZGVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi9jb21tb24vY29uZmlndXJhdGlvbk1vZGVscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5aUNoRyxvQ0FtQkM7SUExaUNELFNBQVMsTUFBTSxDQUFJLElBQU87UUFDekIsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUlELE1BQWEsa0JBQWtCO1FBSTlCLFlBQ2tCLFlBQWlCLEVBQUUsRUFDbkIsUUFBa0IsRUFBRSxFQUNwQixhQUEyQixFQUFFLEVBQ3JDLEdBQWdFO1lBSHhELGNBQVMsR0FBVCxTQUFTLENBQVU7WUFDbkIsVUFBSyxHQUFMLEtBQUssQ0FBZTtZQUNwQixlQUFVLEdBQVYsVUFBVSxDQUFtQjtZQUNyQyxRQUFHLEdBQUgsR0FBRyxDQUE2RDtZQU56RCwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBOEIsQ0FBQztRQVFoRixDQUFDO1FBR0QsSUFBSSxnQkFBZ0I7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3QixJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUM7b0JBQ3RCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7d0JBQ2pELElBQUksR0FBRyxZQUFZLGtCQUFrQixFQUFFLENBQUM7NEJBQ3ZDLE9BQU8sR0FBRyxDQUFDO3dCQUNaLENBQUM7d0JBQ0QsTUFBTSxNQUFNLEdB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