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
define(["require", "exports", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/path", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, date_1, decorators_1, network_1, path_1, process_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractNativeEnvironmentService = exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX = void 0;
    exports.parseExtensionHostDebugPort = parseExtensionHostDebugPort;
    exports.parseDebugParams = parseDebugParams;
    exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX = /^([^.]+\..+)[:=](.+)$/;
    class AbstractNativeEnvironmentService {
        get appRoot() { return (0, path_1.dirname)(network_1.FileAccess.asFileUri('').fsPath); }
        get userHome() { return uri_1.URI.file(this.paths.homeDir); }
        get userDataPath() { return this.paths.userDataDir; }
        get appSettingsHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'User')); }
        get tmpDir() { return uri_1.URI.file(this.paths.tmpDir); }
        get cacheHome() { return uri_1.URI.file(this.userDataPath); }
        get stateResource() { return (0, resources_1.joinPath)(this.appSettingsHome, 'globalStorage', 'storage.json'); }
        get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'sync'); }
        get logsHome() {
            if (!this.args.logsPath) {
                const key = (0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '');
                this.args.logsPath = (0, path_1.join)(this.userDataPath, 'logs', key);
            }
            return uri_1.URI.file(this.args.logsPath);
        }
        get sync() { return this.args.sync; }
        get machineSettingsResource() { return (0, resources_1.joinPath)(uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Machine')), 'settings.json'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'History'); }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get argvResource() {
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return uri_1.URI.file((0, path_1.join)(vscodePortable, 'argv.json'));
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'argv.json');
        }
        get isExtensionDevelopment() { return !!this.args.extensionDevelopmentPath; }
        get untitledWorkspacesHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Workspaces')); }
        get builtinExtensionsPath() {
            const cliBuiltinExtensionsDir = this.args['builtin-extensions-dir'];
            if (cliBuiltinExtensionsDir) {
                return (0, path_1.resolve)(cliBuiltinExtensionsDir);
            }
            return (0, path_1.normalize)((0, path_1.join)(network_1.FileAccess.asFileUri('').fsPath, '..', 'extensions'));
        }
        get extensionsDownloadLocation() {
            const cliExtensionsDownloadDir = this.args['extensions-download-dir'];
            if (cliExtensionsDownloadDir) {
                return uri_1.URI.file((0, path_1.resolve)(cliExtensionsDownloadDir));
            }
            return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'CachedExtensionVSIXs'));
        }
        get extensionsPath() {
            const cliExtensionsDir = this.args['extensions-dir'];
            if (cliExtensionsDir) {
                return (0, path_1.resolve)(cliExtensionsDir);
            }
            const vscodeExtensions = process_1.env['VSCODE_EXTENSIONS'];
            if (vscodeExtensions) {
                return vscodeExtensions;
            }
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return (0, path_1.join)(vscodePortable, 'extensions');
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'extensions').fsPath;
        }
        get extensionDevelopmentLocationURI() {
            const extensionDevelopmentPaths = this.args.extensionDevelopmentPath;
            if (Array.isArray(extensionDevelopmentPaths)) {
                return extensionDevelopmentPaths.map(extensionDevelopmentPath => {
                    if (/^[^:/?#]+?:\/\//.test(extensionDevelopmentPath)) {
                        return uri_1.URI.parse(extensionDevelopmentPath);
                    }
                    return uri_1.URI.file((0, path_1.normalize)(extensionDevelopmentPath));
                });
            }
            return undefined;
        }
        get extensionDevelopmentKind() {
            return this.args.extensionDevelopmentKind?.map(kind => kind === 'ui' || kind === 'workspace' || kind === 'web' ? kind : 'workspace');
        }
        get extensionTestsLocationURI() {
            const extensionTestsPath = this.args.extensionTestsPath;
            if (extensionTestsPath) {
                if (/^[^:/?#]+?:\/\//.test(extensionTestsPath)) {
                    return uri_1.URI.parse(extensionTestsPath);
                }
                return uri_1.URI.file((0, path_1.normalize)(extensionTestsPath));
            }
            return undefined;
        }
        get disableExtensions() {
            if (this.args['disable-extensions']) {
                return true;
            }
            const disableExtensions = this.args['disable-extension'];
            if (disableExtensions) {
                if (typeof disableExtensions === 'string') {
                    return [disableExtensions];
                }
                if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
                    return disableExtensions;
                }
            }
            return false;
        }
        get debugExtensionHost() { return parseExtensionHostDebugPort(this.args, this.isBuilt); }
        get debugRenderer() { return !!this.args.debugRenderer; }
        get isBuilt() { return !process_1.env['VSCODE_DEV']; }
        get verbose() { return !!this.args.verbose; }
        get logLevel() { return this.args.log?.find(entry => !exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.test(entry)); }
        get extensionLogLevel() {
            const result = [];
            for (const entry of this.args.log || []) {
                const matches = exports.EXTENSION_IDENTIFIER_WITH_LOG_REGEX.exec(entry);
                if (matches && matches[1] && matches[2]) {
                    result.push([matches[1], matches[2]]);
                }
            }
            return result.length ? result : undefined;
        }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(uri_1.URI.file(this.userDataPath), 'machineid'); }
        get crashReporterId() { return this.args['crash-reporter-id']; }
        get crashReporterDirectory() { return this.args['crash-reporter-directory']; }
        get disableTelemetry() { return !!this.args['disable-telemetry']; }
        get disableWorkspaceTrust() { return !!this.args['disable-workspace-trust']; }
        get useInMemorySecretStorage() { return !!this.args['use-inmemory-secretstorage']; }
        get policyFile() {
            if (this.args['__enable-file-policy']) {
                const vscodePortable = process_1.env['VSCODE_PORTABLE'];
                if (vscodePortable) {
                    return uri_1.URI.file((0, path_1.join)(vscodePortable, 'policy.json'));
                }
                return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'policy.json');
            }
            return undefined;
        }
        get continueOn() {
            return this.args['continueOn'];
        }
        set continueOn(value) {
            this.args['continueOn'] = value;
        }
        get args() { return this._args; }
        constructor(_args, paths, productService) {
            this._args = _args;
            this.paths = paths;
            this.productService = productService;
            this.editSessionId = this.args['editSessionId'];
        }
    }
    exports.AbstractNativeEnvironmentService = AbstractNativeEnvironmentService;
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appRoot", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "tmpDir", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "stateResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "machineSettingsResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "builtinExtensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentKind", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "logLevel", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionLogLevel", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "disableTelemetry", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "disableWorkspaceTrust", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "useInMemorySecretStorage", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "policyFile", null);
    function parseExtensionHostDebugPort(args, isBuilt) {
        return parseDebugParams(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuilt, args.debugId, args.extensionEnvironment);
    }
    function parseDebugParams(debugArg, debugBrkArg, defaultBuildPort, isBuilt, debugId, environmentString) {
        const portStr = debugBrkArg || debugArg;
        const port = Number(portStr) || (!isBuilt ? defaultBuildPort : null);
        const brk = port ? Boolean(!!debugBrkArg) : false;
        let env;
        if (environmentString) {
            try {
                env = JSON.parse(environmentString);
            }
            catch {
                // ignore
            }
        }
        return { port, break: brk, debugId, env };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbnZpcm9ubWVudC9jb21tb24vZW52aXJvbm1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQThRaEcsa0VBRUM7SUFFRCw0Q0FjQztJQW5SWSxRQUFBLG1DQUFtQyxHQUFHLHVCQUF1QixDQUFDO0lBeUIzRSxNQUFzQixnQ0FBZ0M7UUFLckQsSUFBSSxPQUFPLEtBQWEsT0FBTyxJQUFBLGNBQU8sRUFBQyxvQkFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFHMUUsSUFBSSxRQUFRLEtBQVUsT0FBTyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRzVELElBQUksWUFBWSxLQUFhLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRzdELElBQUksZUFBZSxLQUFVLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFBLFdBQUksRUFBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBR2hGLElBQUksTUFBTSxLQUFVLE9BQU8sU0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUd6RCxJQUFJLFNBQVMsS0FBVSxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUc1RCxJQUFJLGFBQWEsS0FBVSxPQUFPLElBQUEsb0JBQVEsRUFBQyxJQUFJLENB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