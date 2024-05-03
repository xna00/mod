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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environmentService", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/resources"], function (require, exports, environment_1, instantiation_1, environmentService_1, decorators_1, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkbenchEnvironmentService = exports.INativeWorkbenchEnvironmentService = void 0;
    exports.INativeWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class NativeWorkbenchEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        get mainPid() { return this.configuration.mainPid; }
        get machineId() { return this.configuration.machineId; }
        get sqmId() { return this.configuration.sqmId; }
        get remoteAuthority() { return this.configuration.remoteAuthority; }
        get expectsResolverExtension() { return !!this.configuration.remoteAuthority?.includes('+'); }
        get execPath() { return this.configuration.execPath; }
        get backupPath() { return this.configuration.backupPath; }
        get window() {
            return {
                id: this.configuration.windowId,
                colorScheme: this.configuration.colorScheme,
                maximized: this.configuration.maximized,
                accessibilitySupport: this.configuration.accessibilitySupport,
                perfMarks: this.configuration.perfMarks,
                isInitialStartup: this.configuration.isInitialStartup,
                isCodeCaching: typeof this.configuration.codeCachePath === 'string'
            };
        }
        get windowLogsPath() { return (0, resources_1.joinPath)(this.logsHome, `window${this.configuration.windowId}`); }
        get logFile() { return (0, resources_1.joinPath)(this.windowLogsPath, `renderer.log`); }
        get extHostLogsPath() { return (0, resources_1.joinPath)(this.windowLogsPath, 'exthost'); }
        get extHostTelemetryLogFile() {
            return (0, resources_1.joinPath)(this.extHostLogsPath, 'extensionTelemetry.log');
        }
        get webviewExternalEndpoint() { return `${network_1.Schemas.vscodeWebview}://{{uuid}}`; }
        get skipReleaseNotes() { return !!this.args['skip-release-notes']; }
        get skipWelcome() { return !!this.args['skip-welcome']; }
        get logExtensionHostCommunication() { return !!this.args.logExtensionHostCommunication; }
        get enableSmokeTestDriver() { return !!this.args['enable-smoke-test-driver']; }
        get extensionEnabledProposedApi() {
            if (Array.isArray(this.args['enable-proposed-api'])) {
                return this.args['enable-proposed-api'];
            }
            if ('enable-proposed-api' in this.args) {
                return [];
            }
            return undefined;
        }
        get os() { return this.configuration.os; }
        get filesToOpenOrCreate() { return this.configuration.filesToOpenOrCreate; }
        get filesToDiff() { return this.configuration.filesToDiff; }
        get filesToMerge() { return this.configuration.filesToMerge; }
        get filesToWait() { return this.configuration.filesToWait; }
        constructor(configuration, productService) {
            super(configuration, { homeDir: configuration.homeDir, tmpDir: configuration.tmpDir, userDataDir: configuration.userDataDir }, productService);
            this.configuration = configuration;
        }
    }
    exports.NativeWorkbenchEnvironmentService = NativeWorkbenchEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "mainPid", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "machineId", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "sqmId", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "expectsResolverExtension", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "execPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "backupPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "window", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "windowLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extHostTelemetryLogFile", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "os", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToMerge", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToWait", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZW52aXJvbm1lbnQvZWxlY3Ryb24tc2FuZGJveC9lbnZpcm9ubWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7O0lBY25GLFFBQUEsa0NBQWtDLEdBQUcsSUFBQSxzQ0FBc0IsRUFBMEQsaUNBQW1CLENBQUMsQ0FBQztJQXFDdkosTUFBYSxpQ0FBa0MsU0FBUSxxREFBZ0M7UUFHdEYsSUFBSSxPQUFPLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFHcEQsSUFBSSxTQUFTLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFHeEQsSUFBSSxLQUFLLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHaEQsSUFBSSxlQUFlLEtBQUssT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFHcEUsSUFBSSx3QkFBd0IsS0FBSyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzlGLElBQUksUUFBUSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBR3RELElBQUksVUFBVSxLQUFLLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBRzFELElBQUksTUFBTTtZQUNULE9BQU87Z0JBQ04sRUFBRSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMs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