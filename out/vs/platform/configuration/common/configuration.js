/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation"], function (require, exports, types, uri_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationTarget = exports.IConfigurationService = void 0;
    exports.isConfigurationOverrides = isConfigurationOverrides;
    exports.isConfigurationUpdateOverrides = isConfigurationUpdateOverrides;
    exports.ConfigurationTargetToString = ConfigurationTargetToString;
    exports.isConfigured = isConfigured;
    exports.toValuesTree = toValuesTree;
    exports.addToValueTree = addToValueTree;
    exports.removeFromValueTree = removeFromValueTree;
    exports.getConfigurationValue = getConfigurationValue;
    exports.merge = merge;
    exports.getLanguageTagSettingPlainKey = getLanguageTagSettingPlainKey;
    exports.IConfigurationService = (0, instantiation_1.createDecorator)('configurationService');
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    function isConfigurationUpdateOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifiers || Array.isArray(thing.overrideIdentifiers))
            && !thing.overrideIdentifier
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["APPLICATION"] = 1] = "APPLICATION";
        ConfigurationTarget[ConfigurationTarget["USER"] = 2] = "USER";
        ConfigurationTarget[ConfigurationTarget["USER_LOCAL"] = 3] = "USER_LOCAL";
        ConfigurationTarget[ConfigurationTarget["USER_REMOTE"] = 4] = "USER_REMOTE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 5] = "WORKSPACE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 6] = "WORKSPACE_FOLDER";
        ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 7] = "DEFAULT";
        ConfigurationTarget[ConfigurationTarget["MEMORY"] = 8] = "MEMORY";
    })(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
    function ConfigurationTargetToString(configurationTarget) {
        switch (configurationTarget) {
            case 1 /* ConfigurationTarget.APPLICATION */: return 'APPLICATION';
            case 2 /* ConfigurationTarget.USER */: return 'USER';
            case 3 /* ConfigurationTarget.USER_LOCAL */: return 'USER_LOCAL';
            case 4 /* ConfigurationTarget.USER_REMOTE */: return 'USER_REMOTE';
            case 5 /* ConfigurationTarget.WORKSPACE */: return 'WORKSPACE';
            case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */: return 'WORKSPACE_FOLDER';
            case 7 /* ConfigurationTarget.DEFAULT */: return 'DEFAULT';
            case 8 /* ConfigurationTarget.MEMORY */: return 'MEMORY';
        }
    }
    function isConfigured(configValue) {
        return configValue.applicationValue !== undefined ||
            configValue.userValue !== undefined ||
            configValue.userLocalValue !== undefined ||
            configValue.userRemoteValue !== undefined ||
            configValue.workspaceValue !== undefined ||
            configValue.workspaceFolderValue !== undefined;
    }
    function toValuesTree(properties, conflictReporter) {
        const root = Object.create(null);
        for (const key in properties) {
            addToValueTree(root, key, properties[key], conflictReporter);
        }
        return root;
    }
    function addToValueTree(settingsTreeRoot, key, value, conflictReporter) {
        const segments = key.split('.');
        const last = segments.pop();
        let curr = settingsTreeRoot;
        for (let i = 0; i < segments.length; i++) {
            const s = segments[i];
            let obj = curr[s];
            switch (typeof obj) {
                case 'undefined':
                    obj = curr[s] = Object.create(null);
                    break;
                case 'object':
                    break;
                default:
                    conflictReporter(`Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is ${JSON.stringify(obj)}`);
                    return;
            }
            curr = obj;
        }
        if (typeof curr === 'object' && curr !== null) {
            try {
                curr[last] = value; // workaround https://github.com/microsoft/vscode/issues/13606
            }
            catch (e) {
                conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
            }
        }
        else {
            conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
        }
    }
    function removeFromValueTree(valueTree, key) {
        const segments = key.split('.');
        doRemoveFromValueTree(valueTree, segments);
    }
    function doRemoveFromValueTree(valueTree, segments) {
        const first = segments.shift();
        if (segments.length === 0) {
            // Reached last segment
            delete valueTree[first];
            return;
        }
        if (Object.keys(valueTree).indexOf(first) !== -1) {
            const value = valueTree[first];
            if (typeof value === 'object' && !Array.isArray(value)) {
                doRemoveFromValueTree(value, segments);
                if (Object.keys(value).length === 0) {
                    delete valueTree[first];
                }
            }
        }
    }
    /**
     * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
     */
    function getConfigurationValue(config, settingPath, defaultValue) {
        function accessSetting(config, path) {
            let current = config;
            for (const component of path) {
                if (typeof current !== 'object' || current === null) {
                    return undefined;
                }
                current = current[component];
            }
            return current;
        }
        const path = settingPath.split('.');
        const result = accessSetting(config, path);
        return typeof result === 'undefined' ? defaultValue : result;
    }
    function merge(base, add, overwrite) {
        Object.keys(add).forEach(key => {
            if (key !== '__proto__') {
                if (key in base) {
                    if (types.isObject(base[key]) && types.isObject(add[key])) {
                        merge(base[key], add[key], overwrite);
                    }
                    else if (overwrite) {
                        base[key] = add[key];
                    }
                }
                else {
                    base[key] = add[key];
                }
            }
        });
    }
    function getLanguageTagSettingPlainKey(settingKey) {
        return settingKey.replace(/[\[\]]/g, '');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vY29uZmlndXJhdGlvbi9jb21tb24vY29uZmlndXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsNERBS0M7SUFPRCx3RUFNQztJQWNELGtFQVdDO0lBZ0RELG9DQU9DO0lBaUdELG9DQVFDO0lBRUQsd0NBOEJDO0lBRUQsa0RBR0M7SUF3QkQsc0RBZ0JDO0lBRUQsc0JBY0M7SUFFRCxzRUFFQztJQTlTWSxRQUFBLHFCQUFxQixHQUFHLElBQUEsK0JBQWUsRUFBd0Isc0JBQXNCLENBQUMsQ0FBQztJQUVwRyxTQUFnQix3QkFBd0IsQ0FBQyxLQUFVO1FBQ2xELE9BQU8sS0FBSztlQUNSLE9BQU8sS0FBSyxLQUFLLFFBQVE7ZUFDekIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsS0FBSyxRQUFRLENBQUM7ZUFDM0UsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsWUFBWSxTQUFHLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBT0QsU0FBZ0IsOEJBQThCLENBQUMsS0FBVTtRQUN4RCxPQUFPLEtBQUs7ZUFDUixPQUFPLEtBQUssS0FBSyxRQUFRO2VBQ3pCLENBQUMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQztlQUN4RSxDQUFDLEtBQUssQ0FBQyxrQkFBa0I7ZUFDekIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsWUFBWSxTQUFHLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBSUQsSUFBa0IsbUJBU2pCO0lB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