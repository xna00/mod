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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/platform", "vs/base/common/objects", "vs/base/common/async"], function (require, exports, nls_1, configurationRegistry_1, platform_1, workspace_1, configuration_1, lifecycle_1, event_1, remoteAgentService_1, platform_2, objects_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicWorkbenchSecurityConfiguration = exports.ConfigurationMigrationWorkbenchContribution = exports.Extensions = exports.problemsConfigurationNodeBase = exports.securityConfigurationNodeBase = exports.workbenchConfigurationNodeBase = exports.applicationConfigurationNodeBase = void 0;
    exports.applicationConfigurationNodeBase = Object.freeze({
        'id': 'application',
        'order': 100,
        'title': (0, nls_1.localize)('applicationConfigurationTitle', "Application"),
        'type': 'object'
    });
    exports.workbenchConfigurationNodeBase = Object.freeze({
        'id': 'workbench',
        'order': 7,
        'title': (0, nls_1.localize)('workbenchConfigurationTitle', "Workbench"),
        'type': 'object',
    });
    exports.securityConfigurationNodeBase = Object.freeze({
        'id': 'security',
        'scope': 1 /* ConfigurationScope.APPLICATION */,
        'title': (0, nls_1.localize)('securityConfigurationTitle', "Security"),
        'type': 'object',
        'order': 7
    });
    exports.problemsConfigurationNodeBase = Object.freeze({
        'id': 'problems',
        'title': (0, nls_1.localize)('problemsConfigurationTitle', "Problems"),
        'type': 'object',
        'order': 101
    });
    exports.Extensions = {
        ConfigurationMigration: 'base.contributions.configuration.migration'
    };
    class ConfigurationMigrationRegistry {
        constructor() {
            this.migrations = [];
            this._onDidRegisterConfigurationMigrations = new event_1.Emitter();
            this.onDidRegisterConfigurationMigration = this._onDidRegisterConfigurationMigrations.event;
        }
        registerConfigurationMigrations(configurationMigrations) {
            this.migrations.push(...configurationMigrations);
        }
    }
    const configurationMigrationRegistry = new ConfigurationMigrationRegistry();
    platform_1.Registry.add(exports.Extensions.ConfigurationMigration, configurationMigrationRegistry);
    let ConfigurationMigrationWorkbenchContribution = class ConfigurationMigrationWorkbenchContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.configurationMigration'; }
        constructor(configurationService, workspaceService) {
            super();
            this.configurationService = configurationService;
            this.workspaceService = workspaceService;
            this._register(this.workspaceService.onDidChangeWorkspaceFolders(async (e) => {
                for (const folder of e.added) {
                    await this.migrateConfigurationsForFolder(folder, configurationMigrationRegistry.migrations);
                }
            }));
            this.migrateConfigurations(configurationMigrationRegistry.migrations);
            this._register(configurationMigrationRegistry.onDidRegisterConfigurationMigration(migration => this.migrateConfigurations(migration)));
        }
        async migrateConfigurations(migrations) {
            await this.migrateConfigurationsForFolder(undefined, migrations);
            for (const folder of this.workspaceService.getWorkspace().folders) {
                await this.migrateConfigurationsForFolder(folder, migrations);
            }
        }
        async migrateConfigurationsForFolder(folder, migrations) {
            await Promise.all([migrations.map(migration => this.migrateConfigurationsForFolderAndOverride(migration, folder?.uri))]);
        }
        async migrateConfigurationsForFolderAndOverride(migration, resource) {
            const inspectData = this.configurationService.inspect(migration.key, { resource });
            const targetPairs = this.workspaceService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? [
                ['user', 2 /* ConfigurationTarget.USER */],
                ['userLocal', 3 /* ConfigurationTarget.USER_LOCAL */],
                ['userRemote', 4 /* ConfigurationTarget.USER_REMOTE */],
                ['workspace', 5 /* ConfigurationTarget.WORKSPACE */],
                ['workspaceFolder', 6 /* ConfigurationTarget.WORKSPACE_FOLDER */],
            ] : [
                ['user', 2 /* ConfigurationTarget.USER */],
                ['userLocal', 3 /* ConfigurationTarget.USER_LOCAL */],
                ['userRemote', 4 /* ConfigurationTarget.USER_REMOTE */],
                ['workspace', 5 /* ConfigurationTarget.WORKSPACE */],
            ];
            for (const [dataKey, target] of targetPairs) {
                const inspectValue = inspectData[dataKey];
                if (!inspectValue) {
                    continue;
                }
                const migrationValues = [];
                if (inspectValue.value !== undefined) {
                    const keyValuePairs = await this.runMigration(migration, dataKey, inspectValue.value, resource, undefined);
                    for (const keyValuePair of keyValuePairs ?? []) {
                        migrationValues.push([keyValuePair, []]);
                    }
                }
                for (const { identifiers, value } of inspectValue.overrides ?? []) {
                    if (value !== undefined) {
                        const keyValuePairs = await this.runMigration(migration, dataKey, value, resource, identifiers);
                        for (const keyValuePair of keyValuePairs ?? []) {
                            migrationValues.push([keyValuePair, identifiers]);
                        }
                    }
                }
                if (migrationValues.length) {
                    // apply migrations
                    await Promise.allSettled(migrationValues.map(async ([[key, value], overrideIdentifiers]) => this.configurationService.updateValue(key, value.value, { resource, overrideIdentifiers }, target)));
                }
            }
        }
        async runMigration(migration, dataKey, value, resource, overrideIdentifiers) {
            const valueAccessor = (key) => {
                const inspectData = this.configurationService.inspect(key, { resource });
                const inspectValue = inspectData[dataKey];
                if (!inspectValue) {
                    return undefined;
                }
                if (!overrideIdentifiers) {
                    return inspectValue.value;
                }
                return inspectValue.overrides?.find(({ identifiers }) => (0, objects_1.equals)(identifiers, overrideIdentifiers))?.value;
            };
            const result = await migration.migrateFn(value, valueAccessor);
            return Array.isArray(result) ? result : [[migration.key, result]];
        }
    };
    exports.ConfigurationMigrationWorkbenchContribution = ConfigurationMigrationWorkbenchContribution;
    exports.ConfigurationMigrationWorkbenchContribution = ConfigurationMigrationWorkbenchContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, workspace_1.IWorkspaceContextService)
    ], ConfigurationMigrationWorkbenchContribution);
    let DynamicWorkbenchSecurityConfiguration = class DynamicWorkbenchSecurityConfiguration extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.dynamicWorkbenchSecurityConfiguration'; }
        constructor(remoteAgentService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this._ready = new async_1.DeferredPromise();
            this.ready = this._ready.p;
            this.create();
        }
        async create() {
            try {
                await this.doCreate();
            }
            finally {
                this._ready.complete();
            }
        }
        async doCreate() {
            if (!platform_2.isWindows) {
                const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                if (remoteEnvironment?.os !== 1 /* OperatingSystem.Windows */) {
                    return;
                }
            }
            // Windows: UNC allow list security configuration
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...exports.securityConfigurationNodeBase,
                'properties': {
                    'security.allowedUNCHosts': {
                        'type': 'array',
                        'items': {
                            'type': 'string',
                            'pattern': '^[^\\\\]+$',
                            'patternErrorMessage': (0, nls_1.localize)('security.allowedUNCHosts.patternErrorMessage', 'UNC host names must not contain backslashes.')
                        },
                        'default': [],
                        'markdownDescription': (0, nls_1.localize)('security.allowedUNCHosts', 'A set of UNC host names (without leading or trailing backslash, for example `192.168.0.1` or `my-server`) to allow without user confirmation. If a UNC host is being accessed that is not allowed via this setting or has not been acknowledged via user confirmation, an error will occur and the operation stopped. A restart is required when changing this setting. Find out more about this setting at https://aka.ms/vscode-windows-unc.'),
                        'scope': 2 /* ConfigurationScope.MACHINE */
                    },
                    'security.restrictUNCAccess': {
                        'type': 'boolean',
                        'default': true,
                        'markdownDescription': (0, nls_1.localize)('security.restrictUNCAccess', 'If enabled, only allows access to UNC host names that are allowed by the `#security.allowedUNCHosts#` setting or after user confirmation. Find out more about this setting at https://aka.ms/vscode-windows-unc.'),
                        'scope': 2 /* ConfigurationScope.MACHINE */
                    }
                }
            });
        }
    };
    exports.DynamicWorkbenchSecurityConfiguration = DynamicWorkbenchSecurityConfiguration;
    exports.DynamicWorkbenchSecurityConfiguration = DynamicWorkbenchSecurityConfiguration = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService)
    ], DynamicWorkbenchSecurityConfiguration);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbW1vbi9jb25maWd1cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCbkYsUUFBQSxnQ0FBZ0MsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUNqRixJQUFJLEVBQUUsYUFBYTtRQUNuQixPQUFPLEVBQUUsR0FBRztRQUNaLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQywrQkFBK0IsRUFBRSxhQUFhLENBQUM7UUFDakUsTUFBTSxFQUFFLFFBQVE7S0FDaEIsQ0FBQyxDQUFDO0lBRVUsUUFBQSw4QkFBOEIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUMvRSxJQUFJLEVBQUUsV0FBVztRQUNqQixPQUFPLEVBQUUsQ0FBQztRQUNWLE9BQU8sRUFBRSxJQUFBLGNBQVEsRUFBQyw2QkFBNkIsRUFBRSxXQUFXLENBQUM7UUFDN0QsTUFBTSxFQUFFLFFBQVE7S0FDaEIsQ0FBQyxDQUFDO0lBRVUsUUFBQSw2QkFBNkIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUM5RSxJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLHdDQUFnQztRQUN2QyxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDO1FBQzNELE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE9BQU8sRUFBRSxDQUFDO0tBQ1YsQ0FBQyxDQUFDO0lBRVUsUUFBQSw2QkFBNkIsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFxQjtRQUM5RSxJQUFJLEVBQUUsVUFBVTtRQUNoQixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUsVUFBVSxDQUFDO1FBQzNELE1BQU0sRUFBRSxRQUFRO1FBQ2hCLE9B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