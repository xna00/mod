/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/base/common/types", "vs/base/common/arrays"], function (require, exports, objects_1, configuration_1, configurationModels_1, types_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Configuration = exports.StandaloneConfigurationModelParser = exports.WorkspaceConfigurationModelParser = void 0;
    class WorkspaceConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name) {
            super(name);
            this._folders = [];
            this._transient = false;
            this._settingsModelParser = new configurationModels_1.ConfigurationModelParser(name);
            this._launchModel = new configurationModels_1.ConfigurationModel();
            this._tasksModel = new configurationModels_1.ConfigurationModel();
        }
        get folders() {
            return this._folders;
        }
        get transient() {
            return this._transient;
        }
        get settingsModel() {
            return this._settingsModelParser.configurationModel;
        }
        get launchModel() {
            return this._launchModel;
        }
        get tasksModel() {
            return this._tasksModel;
        }
        reparseWorkspaceSettings(configurationParseOptions) {
            this._settingsModelParser.reparse(configurationParseOptions);
        }
        getRestrictedWorkspaceSettings() {
            return this._settingsModelParser.restrictedConfigurations;
        }
        doParseRaw(raw, configurationParseOptions) {
            this._folders = (raw['folders'] || []);
            this._transient = (0, types_1.isBoolean)(raw['transient']) && raw['transient'];
            this._settingsModelParser.parseRaw(raw['settings'], configurationParseOptions);
            this._launchModel = this.createConfigurationModelFrom(raw, 'launch');
            this._tasksModel = this.createConfigurationModelFrom(raw, 'tasks');
            return super.doParseRaw(raw, configurationParseOptions);
        }
        createConfigurationModelFrom(raw, key) {
            const data = raw[key];
            if (data) {
                const contents = (0, configuration_1.toValuesTree)(data, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
                const scopedContents = Object.create(null);
                scopedContents[key] = contents;
                const keys = Object.keys(data).map(k => `${key}.${k}`);
                return new configurationModels_1.ConfigurationModel(scopedContents, keys, []);
            }
            return new configurationModels_1.ConfigurationModel();
        }
    }
    exports.WorkspaceConfigurationModelParser = WorkspaceConfigurationModelParser;
    class StandaloneConfigurationModelParser extends configurationModels_1.ConfigurationModelParser {
        constructor(name, scope) {
            super(name);
            this.scope = scope;
        }
        doParseRaw(raw, configurationParseOptions) {
            const contents = (0, configuration_1.toValuesTree)(raw, message => console.error(`Conflict in settings file ${this._name}: ${message}`));
            const scopedContents = Object.create(null);
            scopedContents[this.scope] = contents;
            const keys = Object.keys(raw).map(key => `${this.scope}.${key}`);
            return { contents: scopedContents, keys, overrides: [] };
        }
    }
    exports.StandaloneConfigurationModelParser = StandaloneConfigurationModelParser;
    class Configuration extends configurationModels_1.Configuration {
        constructor(defaults, policy, application, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource, _workspace) {
            super(defaults, policy, application, localUser, remoteUser, workspaceConfiguration, folders, memoryConfiguration, memoryConfigurationByResource);
            this._workspace = _workspace;
        }
        getValue(key, overrides = {}) {
            return super.getValue(key, overrides, this._workspace);
        }
        inspect(key, overrides = {}) {
            return super.inspect(key, overrides, this._workspace);
        }
        keys() {
            return super.keys(this._workspace);
        }
        compareAndDeleteFolderConfiguration(folder) {
            if (this._workspace && this._workspace.folders.length > 0 && this._workspace.folders[0].uri.toString() === folder.toString()) {
                // Do not remove workspace configuration
                return { keys: [], overrides: [] };
            }
            return super.compareAndDeleteFolderConfiguration(folder);
        }
        compare(other) {
            const compare = (fromKeys, toKeys, overrideIdentifier) => {
                const keys = [];
                keys.push(...toKeys.filter(key => fromKeys.indexOf(key) === -1));
                keys.push(...fromKeys.filter(key => toKeys.indexOf(key) === -1));
                keys.push(...fromKeys.filter(key => {
                    // Ignore if the key does not exist in both models
                    if (toKeys.indexOf(key) === -1) {
                        return false;
                    }
                    // Compare workspace value
                    if (!(0, objects_1.equals)(this.getValue(key, { overrideIdentifier }), other.getValue(key, { overrideIdentifier }))) {
                        return true;
                    }
                    // Compare workspace folder value
                    return this._workspace && this._workspace.folders.some(folder => !(0, objects_1.equals)(this.getValue(key, { resource: folder.uri, overrideIdentifier }), other.getValue(key, { resource: folder.uri, overrideIdentifier })));
                }));
                return keys;
            };
            const keys = compare(this.allKeys(), other.allKeys());
            const overrides = [];
            const allOverrideIdentifiers = (0, arrays_1.distinct)([...this.allOverrideIdentifiers(), ...other.allOverrideIdentifiers()]);
            for (const overrideIdentifier of allOverrideIdentifiers) {
                const keys = compare(this.getAllKeysForOverrideIdentifier(overrideIdentifier), other.getAllKeysForOverrideIdentifier(overrideIdentifier), overrideIdentifier);
                if (keys.length) {
                    overrides.push([overrideIdentifier, keys]);
                }
            }
            return { keys, overrides };
        }
    }
    exports.Configuration = Configuration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbk1vZGVscy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2NvbmZpZ3VyYXRpb24vY29tbW9uL2NvbmZpZ3VyYXRpb25Nb2RlbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsaUNBQWtDLFNBQVEsOENBQXdCO1FBUTlFLFlBQVksSUFBWTtZQUN2QixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFQTCxhQUFRLEdBQTZCLEVBQUUsQ0FBQztZQUN4QyxlQUFVLEdBQVksS0FBSyxDQUFDO1lBT25DLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLDhDQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSx3Q0FBa0IsRUFBRSxDQUFDO1lBQzdDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSx3Q0FBa0IsRUFBRSxDQUFDO1FBQzdDLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDdEIsQ0FBQztRQUVELElBQUksU0FBUztZQUNaLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUN4QixDQUFDO1FBRUQsSUFBSSxhQUFhO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFJLFdBQVc7WUFDZCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsd0JBQXdCLENBQUMseUJBQW9EO1lBQzVFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENB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