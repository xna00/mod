/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/ternarySearchTree", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform"], function (require, exports, event_1, ternarySearchTree_1, configuration_1, configurationRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestConfigurationService = void 0;
    class TestConfigurationService {
        constructor(configuration) {
            this.onDidChangeConfigurationEmitter = new event_1.Emitter();
            this.onDidChangeConfiguration = this.onDidChangeConfigurationEmitter.event;
            this.configurationByRoot = ternarySearchTree_1.TernarySearchTree.forPaths();
            this.overrideIdentifiers = new Map();
            this.configuration = configuration || Object.create(null);
        }
        reloadConfiguration() {
            return Promise.resolve(this.getValue());
        }
        getValue(arg1, arg2) {
            let configuration;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            if (overrides) {
                if (overrides.resource) {
                    configuration = this.configurationByRoot.findSubstr(overrides.resource.fsPath);
                }
            }
            configuration = configuration ? configuration : this.configuration;
            if (arg1 && typeof arg1 === 'string') {
                return configuration[arg1] ?? (0, configuration_1.getConfigurationValue)(configuration, arg1);
            }
            return configuration;
        }
        updateValue(key, value) {
            return Promise.resolve(undefined);
        }
        setUserConfiguration(key, value, root) {
            if (root) {
                const configForRoot = this.configurationByRoot.get(root.fsPath) || Object.create(null);
                configForRoot[key] = value;
                this.configurationByRoot.set(root.fsPath, configForRoot);
            }
            else {
                this.configuration[key] = value;
            }
            return Promise.resolve(undefined);
        }
        setOverrideIdentifiers(key, identifiers) {
            this.overrideIdentifiers.set(key, identifiers);
        }
        inspect(key, overrides) {
            const config = this.getValue(undefined, overrides);
            return {
                value: (0, configuration_1.getConfigurationValue)(config, key),
                defaultValue: (0, configuration_1.getConfigurationValue)(config, key),
                userValue: (0, configuration_1.getConfigurationValue)(config, key),
                overrideIdentifiers: this.overrideIdentifiers.get(key)
            };
        }
        keys() {
            return {
                default: Object.keys(platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()),
                user: Object.keys(this.configuration),
                workspace: [],
                workspaceFolder: []
            };
        }
        getConfigurationData() {
            return null;
        }
    }
    exports.TestConfigurationService = TestConfigurationService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdENvbmZpZ3VyYXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb25maWd1cmF0aW9uL3Rlc3QvY29tbW9uL3Rlc3RDb25maWd1cmF0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSx3QkFBd0I7UUFPcEMsWUFBWSxhQUFtQjtZQUh0QixvQ0FBK0IsR0FBRyxJQUFJLGVBQU8sRUFBNkIsQ0FBQztZQUMzRSw2QkFBd0IsR0FBRyxJQUFJLENBQUMsK0JBQStCLENBQUMsS0FBSyxDQUFDO1lBTXZFLHdCQUFtQixHQUFtQyxxQ0FBaUIsQ0FBQyxRQUFRLEVBQU8sQ0FBQztZQXFDeEYsd0JBQW1CLEdBQTBCLElBQUksR0FBRyxFQUFFLENBQUM7WUF4QzlELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUlNLG1CQUFtQjtZQUN6QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVNLFFBQVEsQ0FBQyxJQUFVLEVBQUUsSUFBVTtZQUNyQyxJQUFJLGFBQWEsQ0FBQztZQUNsQixNQUFNLFNBQVMsR0FBRyxJQUFBLHdDQUF3QixFQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUEsd0NBQXdCLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzVHLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQ3hCLGFBQWEs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