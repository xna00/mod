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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/extpath", "vs/platform/log/common/log", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environmentService"], function (require, exports, network_1, resources_1, uri_1, environment_1, decorators_1, errors_1, extpath_1, log_1, types_1, instantiation_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkbenchEnvironmentService = exports.IBrowserWorkbenchEnvironmentService = void 0;
    exports.IBrowserWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class BrowserWorkbenchEnvironmentService {
        get remoteAuthority() { return this.options.remoteAuthority; }
        get expectsResolverExtension() {
            return !!this.options.remoteAuthority?.includes('+') && !this.options.webSocketFactory;
        }
        get isBuilt() { return !!this.productService.commit; }
        get logLevel() {
            const logLevelFromPayload = this.payload?.get('logLevel');
            if (logLevelFromPayload) {
                return logLevelFromPayload.split(',').find(entry => !environmentService_1.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.test(entry));
            }
            return this.options.developmentOptions?.logLevel !== undefined ? (0, log_1.LogLevelToString)(this.options.developmentOptions?.logLevel) : undefined;
        }
        get extensionLogLevel() {
            const logLevelFromPayload = this.payload?.get('logLevel');
            if (logLevelFromPayload) {
                const result = [];
                for (const entry of logLevelFromPayload.split(',')) {
                    const matches = environmentService_1.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(entry);
                    if (matches && matches[1] && matches[2]) {
                        result.push([matches[1], matches[2]]);
                    }
                }
                return result.length ? result : undefined;
            }
            return this.options.developmentOptions?.extensionLogLevel !== undefined ? this.options.developmentOptions?.extensionLogLevel.map(([extension, logLevel]) => ([extension, (0, log_1.LogLevelToString)(logLevel)])) : undefined;
        }
        get profDurationMarkers() {
            const profDurationMarkersFromPayload = this.payload?.get('profDurationMarkers');
            if (profDurationMarkersFromPayload) {
                const result = [];
                for (const entry of profDurationMarkersFromPayload.split(',')) {
                    result.push(entry);
                }
                return result.length === 2 ? result : undefined;
            }
            return undefined;
        }
        get windowLogsPath() { return this.logsHome; }
        get logFile() { return (0, resources_1.joinPath)(this.windowLogsPath, 'window.log'); }
        get userRoamingDataHome() { return uri_1.URI.file('/User').with({ scheme: network_1.Schemas.vscodeUserData }); }
        get argvResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'argv.json'); }
        get cacheHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'caches'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'History'); }
        get stateResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'State', 'storage.json'); }
        /**
         * In Web every workspace can potentially have scoped user-data
         * and/or extensions and if Sync state is shared then it can make
         * Sync error prone - say removing extensions from another workspace.
         * Hence scope Sync state per workspace. Sync scoped to a workspace
         * is capable of handling opening same workspace in multiple windows.
         */
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'sync', this.workspaceId); }
        get sync() { return undefined; }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get untitledWorkspacesHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'Workspaces'); }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'machineid'); }
        get extHostLogsPath() { return (0, resources_1.joinPath)(this.logsHome, 'exthost'); }
        get extHostTelemetryLogFile() {
            return (0, resources_1.joinPath)(this.extHostLogsPath, 'extensionTelemetry.log');
        }
        get debugExtensionHost() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.params;
        }
        get isExtensionDevelopment() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.isExtensionDevelopment;
        }
        get extensionDevelopmentLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentLocationURI;
        }
        get extensionDevelopmentLocationKind() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentKind;
        }
        get extensionTestsLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionTestsLocationURI;
        }
        get extensionEnabledProposedApi() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionEnabledProposedApi;
        }
        get debugRenderer() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.debugRenderer;
        }
        get enableSmokeTestDriver() { return this.options.developmentOptions?.enableSmokeTestDriver; }
        get disableExtensions() { return this.payload?.get('disableExtensions') === 'true'; }
        get enableExtensions() { return this.options.enabledExtensions; }
        get webviewExternalEndpoint() {
            const endpoint = this.options.webviewEndpoint
                || this.productService.webviewContentExternalBaseUrlTemplate
                || 'https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}/out/vs/workbench/contrib/webview/browser/pre/';
            const webviewExternalEndpointCommit = this.payload?.get('webviewExternalEndpointCommit');
            return endpoint
                .replace('{{commit}}', webviewExternalEndpointCommit ?? this.productService.commit ?? 'ef65ac1ba57f57f2a3961bfe94aa20481caca4c6')
                .replace('{{quality}}', (webviewExternalEndpointCommit ? 'insider' : this.productService.quality) ?? 'insider');
        }
        get extensionTelemetryLogResource() { return (0, resources_1.joinPath)(this.logsHome, 'extensionTelemetry.log'); }
        get disableTelemetry() { return false; }
        get verbose() { return this.payload?.get('verbose') === 'true'; }
        get logExtensionHostCommunication() { return this.payload?.get('logExtensionHostCommunication') === 'true'; }
        get skipReleaseNotes() { return this.payload?.get('skipReleaseNotes') === 'true'; }
        get skipWelcome() { return this.payload?.get('skipWelcome') === 'true'; }
        get disableWorkspaceTrust() { return !this.options.enableWorkspaceTrust; }
        get lastActiveProfile() { return this.payload?.get('lastActiveProfile'); }
        constructor(workspaceId, logsHome, options, productService) {
            this.workspaceId = workspaceId;
            this.logsHome = logsHome;
            this.options = options;
            this.productService = productService;
            this.extensionHostDebugEnvironment = undefined;
            this.editSessionId = this.options.editSessionId;
            if (options.workspaceProvider && Array.isArray(options.workspaceProvider.payload)) {
                try {
                    this.payload = new Map(options.workspaceProvider.payload);
                }
                catch (error) {
                    (0, errors_1.onUnexpectedError)(error); // possible invalid payload for map
                }
            }
        }
        resolveExtensionHostDebugEnvironment() {
            const extensionHostDebugEnvironment = {
                params: {
                    port: null,
                    break: false
                },
                debugRenderer: false,
                isExtensionDevelopment: false,
                extensionDevelopmentLocationURI: undefined,
                extensionDevelopmentKind: undefined
            };
            // Fill in selected extra environmental properties
            if (this.payload) {
                for (const [key, value] of this.payload) {
                    switch (key) {
                        case 'extensionDevelopmentPath':
                            if (!extensionHostDebugEnvironment.extensionDevelopmentLocationURI) {
                                extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [];
                            }
                            extensionHostDebugEnvironment.extensionDevelopmentLocationURI.push(uri_1.URI.parse(value));
                            extensionHostDebugEnvironment.isExtensionDevelopment = true;
                            break;
                        case 'extensionDevelopmentKind':
                            extensionHostDebugEnvironment.extensionDevelopmentKind = [value];
                            break;
                        case 'extensionTestsPath':
                            extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.parse(value);
                            break;
                        case 'debugRenderer':
                            extensionHostDebugEnvironment.debugRenderer = value === 'true';
                            break;
                        case 'debugId':
                            extensionHostDebugEnvironment.params.debugId = value;
                            break;
                        case 'inspect-brk-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            extensionHostDebugEnvironment.params.break = true;
                            break;
                        case 'inspect-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            break;
                        case 'enableProposedApi':
                            extensionHostDebugEnvironment.extensionEnabledProposedApi = [];
                            break;
                    }
                }
            }
            const developmentOptions = this.options.developmentOptions;
            if (developmentOptions && !extensionHostDebugEnvironment.isExtensionDevelopment) {
                if (developmentOptions.extensions?.length) {
                    extensionHostDebugEnvironment.extensionDevelopmentLocationURI = developmentOptions.extensions.map(e => uri_1.URI.revive(e));
                    extensionHostDebugEnvironment.isExtensionDevelopment = true;
                }
                if (developmentOptions.extensionTestsPath) {
                    extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.revive(developmentOptions.extensionTestsPath);
                }
            }
            return extensionHostDebugEnvironment;
        }
        get filesToOpenOrCreate() {
            if (this.payload) {
                const fileToOpen = this.payload.get('openFile');
                if (fileToOpen) {
                    const fileUri = uri_1.URI.parse(fileToOpen);
                    // Support: --goto parameter to open on line/col
                    if (this.payload.has('gotoLineMode')) {
                        const pathColumnAware = (0, extpath_1.parseLineAndColumnAware)(fileUri.path);
                        return [{
                                fileUri: fileUri.with({ path: pathColumnAware.path }),
                                options: {
                                    selection: !(0, types_1.isUndefined)(pathColumnAware.line) ? { startLineNumber: pathColumnAware.line, startColumn: pathColumnAware.column || 1 } : undefined
                                }
                            }];
                    }
                    return [{ fileUri }];
                }
            }
            return undefined;
        }
        get filesToDiff() {
            if (this.payload) {
                const fileToDiffPrimary = this.payload.get('diffFilePrimary');
                const fileToDiffSecondary = this.payload.get('diffFileSecondary');
                if (fileToDiffPrimary && fileToDiffSecondary) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToDiffSecondary) },
                        { fileUri: uri_1.URI.parse(fileToDiffPrimary) }
                    ];
                }
            }
            return undefined;
        }
        get filesToMerge() {
            if (this.payload) {
                const fileToMerge1 = this.payload.get('mergeFile1');
                const fileToMerge2 = this.payload.get('mergeFile2');
                const fileToMergeBase = this.payload.get('mergeFileBase');
                const fileToMergeResult = this.payload.get('mergeFileResult');
                if (fileToMerge1 && fileToMerge2 && fileToMergeBase && fileToMergeResult) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToMerge1) },
                        { fileUri: uri_1.URI.parse(fileToMerge2) },
                        { fileUri: uri_1.URI.parse(fileToMergeBase) },
                        { fileUri: uri_1.URI.parse(fileToMergeResult) }
                    ];
                }
            }
            return undefined;
        }
    }
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "expectsResolverExtension", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isBuilt", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logLevel", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "windowLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "stateResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extHostTelemetryLogFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationKind", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugRenderer", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionTelemetryLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableTelemetry", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "verbose", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableWorkspaceTrust", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "lastActiveProfile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToMerge", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZW52aXJvbm1lbnQvYnJvd3Nlci9lbnZpcm9ubWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBbUJuRixRQUFBLG1DQUFtQyxHQUFHLElBQUEsc0NBQXNCLEVBQTJELGlDQUFtQixDQUFDLENBQUM7SUFtQnpKLE1BQWEsa0NBQWtDO1FBSzlDLElBQUksZUFBZSxLQUF5QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUdsRixJQUFJLHdCQUF3QjtZQUMzQixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO1FBQ3hGLENBQUM7UUFHRCxJQUFJLE9BQU8sS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFHL0QsSUFBSSxRQUFRO1lBQ1gsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxRCxJQUFJLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3pCLE9BQU8sbUJBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsd0RBQW1DLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkcsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLEtB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