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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/event", "vs/workbench/api/common/extHostWorkspace", "./extHost.protocol", "./extHostTypes", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/uri"], function (require, exports, objects_1, event_1, extHostWorkspace_1, extHost_protocol_1, extHostTypes_1, configurationModels_1, configurationRegistry_1, types_1, async_1, instantiation_1, extHostRpcService_1, log_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConfiguration = exports.ExtHostConfigProvider = exports.ExtHostConfiguration = void 0;
    function lookUp(tree, key) {
        if (key) {
            const parts = key.split('.');
            let node = tree;
            for (let i = 0; node && i < parts.length; i++) {
                node = node[parts[i]];
            }
            return node;
        }
    }
    function isUri(thing) {
        return thing instanceof uri_1.URI;
    }
    function isResourceLanguage(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isLanguage(thing) {
        return thing
            && !thing.uri
            && (thing.languageId && typeof thing.languageId === 'string');
    }
    function isWorkspaceFolder(thing) {
        return thing
            && thing.uri instanceof uri_1.URI
            && (!thing.name || typeof thing.name === 'string')
            && (!thing.index || typeof thing.index === 'number');
    }
    function scopeToOverrides(scope) {
        if (isUri(scope)) {
            return { resource: scope };
        }
        if (isResourceLanguage(scope)) {
            return { resource: scope.uri, overrideIdentifier: scope.languageId };
        }
        if (isLanguage(scope)) {
            return { overrideIdentifier: scope.languageId };
        }
        if (isWorkspaceFolder(scope)) {
            return { resource: scope.uri };
        }
        if (scope === null) {
            return { resource: null };
        }
        return undefined;
    }
    let ExtHostConfiguration = class ExtHostConfiguration {
        constructor(extHostRpc, extHostWorkspace, logService) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadConfiguration);
            this._extHostWorkspace = extHostWorkspace;
            this._logService = logService;
            this._barrier = new async_1.Barrier();
            this._actual = null;
        }
        getConfigProvider() {
            return this._barrier.wait().then(_ => this._actual);
        }
        $initializeConfiguration(data) {
            this._actual = new ExtHostConfigProvider(this._proxy, this._extHostWorkspace, data, this._logService);
            this._barrier.open();
        }
        $acceptConfigurationChanged(data, change) {
            this.getConfigProvider().then(provider => provider.$acceptConfigurationChanged(data, change));
        }
    };
    exports.ExtHostConfiguration = ExtHostConfiguration;
    exports.ExtHostConfiguration = ExtHostConfiguration = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, log_1.ILogService)
    ], ExtHostConfiguration);
    class ExtHostConfigProvider {
        constructor(proxy, extHostWorkspace, data, logService) {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this._proxy = proxy;
            this._logService = logService;
            this._extHostWorkspace = extHostWorkspace;
            this._configuration = configurationModels_1.Configuration.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
        }
        get onDidChangeConfiguration() {
            return this._onDidChangeConfiguration && this._onDidChangeConfiguration.event;
        }
        $acceptConfigurationChanged(data, change) {
            const previous = { data: this._configuration.toData(), workspace: this._extHostWorkspace.workspace };
            this._configuration = configurationModels_1.Configuration.parse(data);
            this._configurationScopes = this._toMap(data.configurationScopes);
            this._onDidChangeConfiguration.fire(this._toConfigurationChangeEvent(change, previous));
        }
        getConfiguration(section, scope, extensionDescription) {
            const overrides = scopeToOverrides(scope) || {};
            const config = this._toReadonlyValue(section
                ? lookUp(this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace), section)
                : this._configuration.getValue(undefined, overrides, this._extHostWorkspace.workspace));
            if (section) {
                this._validateConfigurationAccess(section, overrides, extensionDescription?.identifier);
            }
            function parseConfigurationTarget(arg) {
                if (arg === undefined || arg === null) {
                    return null;
                }
                if (typeof arg === 'boolean') {
                    return arg ? 2 /* ConfigurationTarget.USER */ : 5 /* ConfigurationTarget.WORKSPACE */;
                }
                switch (arg) {
                    case extHostTypes_1.ConfigurationTarget.Global: return 2 /* ConfigurationTarget.USER */;
                    case extHostTypes_1.ConfigurationTarget.Workspace: return 5 /* ConfigurationTarget.WORKSPACE */;
                    case extHostTypes_1.ConfigurationTarget.WorkspaceFolder: return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            const result = {
                has(key) {
                    return typeof lookUp(config, key) !== 'undefined';
                },
                get: (key, defaultValue) => {
                    this._validateConfigurationAccess(section ? `${section}.${key}` : key, overrides, extensionDescription?.identifier);
                    let result = lookUp(config, key);
                    if (typeof result === 'undefined') {
                        result = defaultValue;
                    }
                    else {
                        let clonedConfig = undefined;
                        const cloneOnWriteProxy = (target, accessor) => {
                            if ((0, types_1.isObject)(target)) {
                                let clonedTarget = undefined;
                                const cloneTarget = () => {
                                    clonedConfig = clonedConfig ? clonedConfig : (0, objects_1.deepClone)(config);
                                    clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                };
                                return new Proxy(target, {
                                    get: (target, property) => {
                                        if (typeof property === 'string' && property.toLowerCase() === 'tojson') {
                                            cloneTarget();
                                            return () => clonedTarget;
                                        }
                                        if (clonedConfig) {
                                            clonedTarget = clonedTarget ? clonedTarget : lookUp(clonedConfig, accessor);
                                            return clonedTarget[property];
                                        }
                                        const result = target[property];
                                        if (typeof property === 'string') {
                                            return cloneOnWriteProxy(result, `${accessor}.${property}`);
                                        }
                                        return result;
                                    },
                                    set: (_target, property, value) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            clonedTarget[property] = value;
                                        }
                                        return true;
                                    },
                                    deleteProperty: (_target, property) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            delete clonedTarget[property];
                                        }
                                        return true;
                                    },
                                    defineProperty: (_target, property, descriptor) => {
                                        cloneTarget();
                                        if (clonedTarget) {
                                            Object.defineProperty(clonedTarget, property, descriptor);
                                        }
                                        return true;
                                    }
                                });
                            }
                            if (Array.isArray(target)) {
                                return (0, objects_1.deepClone)(target);
                            }
                            return target;
                        };
                        result = cloneOnWriteProxy(result, key);
                    }
                    return result;
                },
                update: (key, value, extHostConfigurationTarget, scopeToLanguage) => {
                    key = section ? `${section}.${key}` : key;
                    const target = parseConfigurationTarget(extHostConfigurationTarget);
                    if (value !== undefined) {
                        return this._proxy.$updateConfigurationOption(target, key, value, overrides, scopeToLanguage);
                    }
                    else {
                        return this._proxy.$removeConfigurationOption(target, key, overrides, scopeToLanguage);
                    }
                },
                inspect: (key) => {
                    key = section ? `${section}.${key}` : key;
                    const config = this._configuration.inspect(key, overrides, this._extHostWorkspace.workspace);
                    if (config) {
                        return {
                            key,
                            defaultValue: (0, objects_1.deepClone)(config.policy?.value ?? config.default?.value),
                            globalValue: (0, objects_1.deepClone)(config.user?.value ?? config.application?.value),
                            workspaceValue: (0, objects_1.deepClone)(config.workspace?.value),
                            workspaceFolderValue: (0, objects_1.deepClone)(config.workspaceFolder?.value),
                            defaultLanguageValue: (0, objects_1.deepClone)(config.default?.override),
                            globalLanguageValue: (0, objects_1.deepClone)(config.user?.override ?? config.application?.override),
                            workspaceLanguageValue: (0, objects_1.deepClone)(config.workspace?.override),
                            workspaceFolderLanguageValue: (0, objects_1.deepClone)(config.workspaceFolder?.override),
                            languageIds: (0, objects_1.deepClone)(config.overrideIdentifiers)
                        };
                    }
                    return undefined;
                }
            };
            if (typeof config === 'object') {
                (0, objects_1.mixin)(result, config, false);
            }
            return Object.freeze(result);
        }
        _toReadonlyValue(result) {
            const readonlyProxy = (target) => {
                return (0, types_1.isObject)(target) ?
                    new Proxy(target, {
                        get: (target, property) => readonlyProxy(target[property]),
                        set: (_target, property, _value) => { throw new Error(`TypeError: Cannot assign to read only property '${String(property)}' of object`); },
                        deleteProperty: (_target, property) => { throw new Error(`TypeError: Cannot delete read only property '${String(property)}' of object`); },
                        defineProperty: (_target, property) => { throw new Error(`TypeError: Cannot define property '${String(property)}' for a readonly object`); },
                        setPrototypeOf: (_target) => { throw new Error(`TypeError: Cannot set prototype for a readonly object`); },
                        isExtensible: () => false,
                        preventExtensions: () => true
                    }) : target;
            };
            return readonlyProxy(result);
        }
        _validateConfigurationAccess(key, overrides, extensionId) {
            const scope = configurationRegistry_1.OVERRIDE_PROPERTY_REGEX.test(key) ? 4 /* ConfigurationScope.RESOURCE */ : this._configurationScopes.get(key);
            const extensionIdText = extensionId ? `[${extensionId.value}] ` : '';
            if (4 /* ConfigurationScope.RESOURCE */ === scope) {
                if (typeof overrides?.resource === 'undefined') {
                    this._logService.warn(`${extensionIdText}Accessing a resource scoped configuration without providing a resource is not expected. To get the effective value for '${key}', provide the URI of a resource or 'null' for any resource.`);
                }
                return;
            }
            if (3 /* ConfigurationScope.WINDOW */ === scope) {
                if (overrides?.resource) {
                    this._logService.warn(`${extensionIdText}Accessing a window scoped configuration for a resource is not expected. To associate '${key}' to a resource, define its scope to 'resource' in configuration contributions in 'package.json'.`);
                }
                return;
            }
        }
        _toConfigurationChangeEvent(change, previous) {
            const event = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this._extHostWorkspace.workspace);
            return Object.freeze({
                affectsConfiguration: (section, scope) => event.affectsConfiguration(section, scopeToOverrides(scope))
            });
        }
        _toMap(scopes) {
            return scopes.reduce((result, scope) => { result.set(scope[0], scope[1]); return result; }, new Map());
        }
    }
    exports.ExtHostConfigProvider = ExtHostConfigProvider;
    exports.IExtHostConfiguration = (0, instantiation_1.createDecorator)('IExtHostConfiguration');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbmZpZ3VyYXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW9CaEcsU0FBUyxNQUFNLENBQUMsSUFBUyxFQUFFLEdBQVc7UUFDckMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNULE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7SUFDRixDQUFDO0lBa0JELFNBQVMsS0FBSyxDQUFDLEtBQVU7UUFDeEIsT0FBTyxLQUFLLFlBQVksU0FBRyxDQUFDO0lBQzdCLENBQUM7SUFFRCxTQUFTLGtCQUFrQixDQUFDLEtBQVU7UUFDckMsT0FBTyxLQUFLO2VBQ1IsS0FBSyxDQUFDLEdBQUcsWUFBWSxTQUFHO2VBQ3hCLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxPQUFPLEtBQUssQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLEtBQVU7UUFDN0IsT0FBTyxLQUFLO2VBQ1IsQ0FBQyxLQUFLLENBQUMsR0FBRztlQUNWLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFB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