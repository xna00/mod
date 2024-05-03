/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, types_1, nls_1, configurationRegistry_1, extensionManagement_1, instantiation_1, jsonContributionRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PREVIEW_DIR_NAME = exports.USER_DATA_SYNC_SCHEME = exports.USER_DATA_SYNC_LOG_ID = exports.IUserDataSyncLogService = exports.IUserDataSyncUtilService = exports.IUserDataAutoSyncService = exports.IUserDataSyncResourceProviderService = exports.IUserDataSyncService = exports.IUserDataSyncEnablementService = exports.SYNC_SERVICE_URL_TYPE = exports.MergeState = exports.Change = exports.SyncStatus = exports.UserDataAutoSyncError = exports.UserDataSyncStoreError = exports.UserDataSyncError = exports.UserDataSyncErrorCode = exports.HEADER_EXECUTION_ID = exports.HEADER_OPERATION_ID = exports.IUserDataSyncLocalStoreService = exports.IUserDataSyncStoreService = exports.IUserDataSyncStoreManagementService = exports.ALL_SYNC_RESOURCES = exports.SyncResource = exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM = exports.USER_DATA_SYNC_CONFIGURATION_SCOPE = void 0;
    exports.getDisallowedIgnoredSettings = getDisallowedIgnoredSettings;
    exports.getDefaultIgnoredSettings = getDefaultIgnoredSettings;
    exports.registerConfiguration = registerConfiguration;
    exports.isAuthenticationProvider = isAuthenticationProvider;
    exports.getPathSegments = getPathSegments;
    exports.getLastSyncResourceUri = getLastSyncResourceUri;
    exports.createSyncHeaders = createSyncHeaders;
    exports.getEnablementKey = getEnablementKey;
    function getDisallowedIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        return Object.keys(allSettings).filter(setting => !!allSettings[setting].disallowSyncIgnore);
    }
    function getDefaultIgnoredSettings() {
        const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
        const ignoreSyncSettings = Object.keys(allSettings).filter(setting => !!allSettings[setting].ignoreSync);
        const machineSettings = Object.keys(allSettings).filter(setting => allSettings[setting].scope === 2 /* ConfigurationScope.MACHINE */ || allSettings[setting].scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */);
        const disallowedSettings = getDisallowedIgnoredSettings();
        return (0, arrays_1.distinct)([...ignoreSyncSettings, ...machineSettings, ...disallowedSettings]);
    }
    exports.USER_DATA_SYNC_CONFIGURATION_SCOPE = 'settingsSync';
    exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM = 'settingsSync.keybindingsPerPlatform';
    function registerConfiguration() {
        const ignoredSettingsSchemaId = 'vscode://schemas/ignoredSettings';
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        configurationRegistry.registerConfiguration({
            id: 'settingsSync',
            order: 30,
            title: (0, nls_1.localize)('settings sync', "Settings Sync"),
            type: 'object',
            properties: {
                [exports.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM]: {
                    type: 'boolean',
                    description: (0, nls_1.localize)('settingsSync.keybindingsPerPlatform', "Synchronize keybindings for each platform."),
                    default: true,
                    scope: 1 /* ConfigurationScope.APPLICATION */,
                    tags: ['sync', 'usesOnlineServices']
                },
                'settingsSync.ignoredExtensions': {
                    'type': 'array',
                    markdownDescription: (0, nls_1.localize)('settingsSync.ignoredExtensions', "List of extensions to be ignored while synchronizing. The identifier of an extension is always `${publisher}.${name}`. For example: `vscode.csharp`."),
                    items: [{
                            type: 'string',
                            pattern: extensionManagement_1.EXTENSION_IDENTIFIER_PATTERN,
                            errorMessage: (0, nls_1.localize)('app.extension.identifier.errorMessage', "Expected format '${publisher}.${name}'. Example: 'vscode.csharp'.")
                        }],
                    'default': [],
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                },
                'settingsSync.ignoredSettings': {
                    'type': 'array',
                    description: (0, nls_1.localize)('settingsSync.ignoredSettings', "Configure settings to be ignored while synchronizing."),
                    'default': [],
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    $ref: ignoredSettingsSchemaId,
                    additionalProperties: true,
                    uniqueItems: true,
                    disallowSyncIgnore: true,
                    tags: ['sync', 'usesOnlineServices']
                }
            }
        });
        const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
        const registerIgnoredSettingsSchema = () => {
            const disallowedIgnoredSettings = getDisallowedIgnoredSettings();
            const defaultIgnoredSettings = getDefaultIgnoredSettings();
            const settings = Object.keys(configurationRegistry_1.allSettings.properties).filter(setting => !defaultIgnoredSettings.includes(setting));
            const ignoredSettings = defaultIgnoredSettings.filter(setting => !disallowedIgnoredSettings.includes(setting));
            const ignoredSettingsSchema = {
                items: {
                    type: 'string',
                    enum: [...settings, ...ignoredSettings.map(setting => `-${setting}`)]
                },
            };
            jsonRegistry.registerSchema(ignoredSettingsSchemaId, ignoredSettingsSchema);
        };
        return configurationRegistry.onDidUpdateConfiguration(() => registerIgnoredSettingsSchema());
    }
    function isAuthenticationProvider(thing) {
        return thing
            && (0, types_1.isObject)(thing)
            && (0, types_1.isString)(thing.id)
            && Array.isArray(thing.scopes);
    }
    var SyncResource;
    (function (SyncResource) {
        SyncResource["Settings"] = "settings";
        SyncResource["Keybindings"] = "keybindings";
        SyncResource["Snippets"] = "snippets";
        SyncResource["Tasks"] = "tasks";
        SyncResource["Extensions"] = "extensions";
        SyncResource["GlobalState"] = "globalState";
        SyncResource["Profiles"] = "profiles";
        SyncResource["WorkspaceState"] = "workspaceState";
    })(SyncResource || (exports.SyncResource = SyncResource = {}));
    exports.ALL_SYNC_RESOURCES = ["settings" /* SyncResource.Settings */, "keybindings" /* SyncResource.Keybindings */, "snippets" /* SyncResource.Snippets */, "tasks" /* SyncResource.Tasks */, "extensions" /* SyncResource.Extensions */, "globalState" /* SyncResource.GlobalState */, "profiles" /* SyncResource.Profiles */];
    function getPathSegments(collection, ...paths) {
        return collection ? [collection, ...paths] : paths;
    }
    function getLastSyncResourceUri(collection, syncResource, environmentService, extUri) {
        return extUri.joinPath(environmentService.userDataSyncHome, ...getPathSegments(collection, syncResource, `lastSync${syncResource}.json`));
    }
    exports.IUserDataSyncStoreManagementService = (0, instantiation_1.createDecorator)('IUserDataSyncStoreManagementService');
    exports.IUserDataSyncStoreService = (0, instantiation_1.createDecorator)('IUserDataSyncStoreService');
    exports.IUserDataSyncLocalStoreService = (0, instantiation_1.createDecorator)('IUserDataSyncLocalStoreService');
    //#endregion
    // #region User Data Sync Headers
    exports.HEADER_OPERATION_ID = 'x-operation-id';
    exports.HEADER_EXECUTION_ID = 'X-Execution-Id';
    function createSyncHeaders(executionId) {
        const headers = {};
        headers[exports.HEADER_EXECUTION_ID] = executionId;
        return headers;
    }
    //#endregion
    // #region User Data Sync Error
    var UserDataSyncErrorCode;
    (function (UserDataSyncErrorCode) {
        // Client Errors (>= 400 )
        UserDataSyncErrorCode["Unauthorized"] = "Unauthorized";
        UserDataSyncErrorCode["Forbidden"] = "Forbidden";
        UserDataSyncErrorCode["NotFound"] = "NotFound";
        UserDataSyncErrorCode["MethodNotFound"] = "MethodNotFound";
        UserDataSyncErrorCode["Conflict"] = "Conflict";
        UserDataSyncErrorCode["Gone"] = "Gone";
        UserDataSyncErrorCode["PreconditionFailed"] = "PreconditionFailed";
        UserDataSyncErrorCode["TooLarge"] = "TooLarge";
        UserDataSyncErrorCode["UpgradeRequired"] = "UpgradeRequired";
        UserDataSyncErrorCode["PreconditionRequired"] = "PreconditionRequired";
        UserDataSyncErrorCode["TooManyRequests"] = "RemoteTooManyRequests";
        UserDataSyncErrorCode["TooManyRequestsAndRetryAfter"] = "TooManyRequestsAndRetryAfter";
        // Local Errors
        UserDataSyncErrorCode["RequestFailed"] = "RequestFailed";
        UserDataSyncErrorCode["RequestCanceled"] = "RequestCanceled";
        UserDataSyncErrorCode["RequestTimeout"] = "RequestTimeout";
        UserDataSyncErrorCode["RequestProtocolNotSupported"] = "RequestProtocolNotSupported";
        UserDataSyncErrorCode["RequestPathNotEscaped"] = "RequestPathNotEscaped";
        UserDataSyncErrorCode["RequestHeadersNotObject"] = "RequestHeadersNotObject";
        UserDataSyncErrorCode["NoCollection"] = "NoCollection";
        UserDataSyncErrorCode["NoRef"] = "NoRef";
        UserDataSyncErrorCode["EmptyResponse"] = "EmptyResponse";
        UserDataSyncErrorCode["TurnedOff"] = "TurnedOff";
        UserDataSyncErrorCode["SessionExpired"] = "SessionExpired";
        UserDataSyncErrorCode["ServiceChanged"] = "ServiceChanged";
        UserDataSyncErrorCode["DefaultServiceChanged"] = "DefaultServiceChanged";
        UserDataSyncErrorCode["LocalTooManyProfiles"] = "LocalTooManyProfiles";
        UserDataSyncErrorCode["LocalTooManyRequests"] = "LocalTooManyRequests";
        UserDataSyncErrorCode["LocalPreconditionFailed"] = "LocalPreconditionFailed";
        UserDataSyncErrorCode["LocalInvalidContent"] = "LocalInvalidContent";
        UserDataSyncErrorCode["LocalError"] = "LocalError";
        UserDataSyncErrorCode["IncompatibleLocalContent"] = "IncompatibleLocalContent";
        UserDataSyncErrorCode["IncompatibleRemoteContent"] = "IncompatibleRemoteContent";
        UserDataSyncErrorCode["Unknown"] = "Unknown";
    })(UserDataSyncErrorCode || (exports.UserDataSyncErrorCode = UserDataSyncErrorCode = {}));
    class UserDataSyncError extends Error {
        constructor(message, code, resource, operationId) {
            super(message);
            this.code = code;
            this.resource = resource;
            this.operationId = operationId;
            this.name = `${this.code} (UserDataSyncError) syncResource:${this.resource || 'unknown'} operationId:${this.operationId || 'unknown'}`;
        }
    }
    exports.UserDataSyncError = UserDataSyncError;
    class UserDataSyncStoreError extends UserDataSyncError {
        constructor(message, url, code, serverCode, operationId) {
            super(message, code, undefined, operationId);
            this.url = url;
            this.serverCode = serverCode;
        }
    }
    exports.UserDataSyncStoreError = UserDataSyncStoreError;
    class UserDataAutoSyncError extends UserDataSyncError {
        constructor(message, code) {
            super(message, code);
        }
    }
    exports.UserDataAutoSyncError = UserDataAutoSyncError;
    (function (UserDataSyncError) {
        function toUserDataSyncError(error) {
            if (error instanceof UserDataSyncError) {
                return error;
            }
            const match = /^(.+) \(UserDataSyncError\) syncResource:(.+) operationId:(.+)$/.exec(error.name);
            if (match && match[1]) {
                const syncResource = match[2] === 'unknown' ? undefined : match[2];
                const operationId = match[3] === 'unknown' ? undefined : match[3];
                return new UserDataSyncError(error.message, match[1], syncResource, operationId);
            }
            return new UserDataSyncError(error.message, "Unknown" /* UserDataSyncErrorCode.Unknown */);
        }
        UserDataSyncError.toUserDataSyncError = toUserDataSyncError;
    })(UserDataSyncError || (exports.UserDataSyncError = UserDataSyncError = {}));
    var SyncStatus;
    (function (SyncStatus) {
        SyncStatus["Uninitialized"] = "uninitialized";
        SyncStatus["Idle"] = "idle";
        SyncStatus["Syncing"] = "syncing";
        SyncStatus["HasConflicts"] = "hasConflicts";
    })(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
    var Change;
    (function (Change) {
        Change[Change["None"] = 0] = "None";
        Change[Change["Added"] = 1] = "Added";
        Change[Change["Modified"] = 2] = "Modified";
        Change[Change["Deleted"] = 3] = "Deleted";
    })(Change || (exports.Change = Change = {}));
    var MergeState;
    (function (MergeState) {
        MergeState["Preview"] = "preview";
        MergeState["Conflict"] = "conflict";
        MergeState["Accepted"] = "accepted";
    })(MergeState || (exports.MergeState = MergeState = {}));
    //#endregion
    // #region keys synced only in web
    exports.SYNC_SERVICE_URL_TYPE = 'sync.store.url.type';
    function getEnablementKey(resource) { return `sync.enable.${resource}`; }
    // #endregion
    // #region User Data Sync Services
    exports.IUserDataSyncEnablementService = (0, instantiation_1.createDecorator)('IUserDataSyncEnablementService');
    exports.IUserDataSyncService = (0, instantiation_1.createDecorator)('IUserDataSyncService');
    exports.IUserDataSyncResourceProviderService = (0, instantiation_1.createDecorator)('IUserDataSyncResourceProviderService');
    exports.IUserDataAutoSyncService = (0, instantiation_1.createDecorator)('IUserDataAutoSyncService');
    exports.IUserDataSyncUtilService = (0, instantiation_1.createDecorator)('IUserDataSyncUtilService');
    exports.IUserDataSyncLogService = (0, instantiation_1.createDecorator)('IUserDataSyncLogService');
    //#endregion
    exports.USER_DATA_SYNC_LOG_ID = 'userDataSync';
    exports.USER_DATA_SYNC_SCHEME = 'vscode-userdata-sync';
    exports.PREVIEW_DIR_NAME = 'preview';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3VzZXJEYXRhU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF3QmhHLG9FQUdDO0lBRUQsOERBTUM7SUFZRCxzREEwREM7SUFxQkQsNERBS0M7SUFjRCwwQ0FFQztJQUVELHdEQUVDO0lBd0ZELDhDQUlDO0lBd1BELDRDQUE4RjtJQW5kOUYsU0FBZ0IsNEJBQTRCO1FBQzNDLE1BQU0sV0FBVyxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQzVILE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDOUYsQ0FBQztJQUVELFNBQWdCLHlCQUF5QjtRQUN4QyxNQUFNLFdBQVcsR0FBRyxtQkFBUSxDQUFDLEVBQUUsQ0FBeUIsa0NBQXVCLENBQUMsYUFBYSxDQUFDLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUM1SCxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6RyxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENB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