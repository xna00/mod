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
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/extensionManagement/common/extensionsScannerService", "vs/platform/log/common/log", "vs/base/common/severity", "vs/nls", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/base/common/async", "vs/workbench/services/userDataProfile/common/userDataProfile", "vs/base/common/errors", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensions"], function (require, exports, path, platform, uri_1, extensionsUtil_1, extensionsScannerService_1, log_1, severity_1, nls_1, notification_1, host_1, async_1, userDataProfile_1, errors_1, extensionManagement_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CachedExtensionScanner = void 0;
    let CachedExtensionScanner = class CachedExtensionScanner {
        constructor(_notificationService, _hostService, _extensionsScannerService, _userDataProfileService, _extensionManagementService, _logService) {
            this._notificationService = _notificationService;
            this._hostService = _hostService;
            this._extensionsScannerService = _extensionsScannerService;
            this._userDataProfileService = _userDataProfileService;
            this._extensionManagementService = _extensionManagementService;
            this._logService = _logService;
            this.scannedExtensions = new Promise((resolve, reject) => {
                this._scannedExtensionsResolve = resolve;
                this._scannedExtensionsReject = reject;
            });
        }
        async scanSingleExtension(extensionPath, isBuiltin) {
            const scannedExtension = await this._extensionsScannerService.scanExistingExtension(uri_1.URI.file(path.resolve(extensionPath)), isBuiltin ? 0 /* ExtensionType.System */ : 1 /* ExtensionType.User */, { language: platform.language });
            return scannedExtension ? (0, extensionsScannerService_1.toExtensionDescription)(scannedExtension, false) : null;
        }
        async startScanningExtensions() {
            try {
                const extensions = await this._scanInstalledExtensions();
                this._scannedExtensionsResolve(extensions);
            }
            catch (err) {
                this._scannedExtensionsReject(err);
            }
        }
        async _scanInstalledExtensions() {
            try {
                const language = platform.language;
                const result = await Promise.allSettled([
                    this._extensionsScannerService.scanSystemExtensions({ language, useCache: true, checkControlFile: true }),
                    this._extensionsScannerService.scanUserExtensions({ language, profileLocation: this._userDataProfileService.currentProfile.extensionsResource, useCache: true }),
                    this._extensionManagementService.getInstalledWorkspaceExtensions(false)
                ]);
                let scannedSystemExtensions = [], scannedUserExtensions = [], workspaceExtensions = [], scannedDevelopedExtensions = [], hasErrors = false;
                if (result[0].status === 'fulfilled') {
                    scannedSystemExtensions = result[0].value;
                }
                else {
                    hasErrors = true;
                    this._logService.error(`Error scanning system extensions:`, (0, errors_1.getErrorMessage)(result[0].reason));
                }
                if (result[1].status === 'fulfilled') {
                    scannedUserExtensions = result[1].value;
                }
                else {
                    hasErrors = true;
                    this._logService.error(`Error scanning user extensions:`, (0, errors_1.getErrorMessage)(result[1].reason));
                }
                if (result[2].status === 'fulfilled') {
                    workspaceExtensions = result[2].value;
                }
                else {
                    hasErrors = true;
                    this._logService.error(`Error scanning workspace extensions:`, (0, errors_1.getErrorMessage)(result[2].reason));
                }
                try {
                    scannedDevelopedExtensions = await this._extensionsScannerService.scanExtensionsUnderDevelopment({ language }, [...scannedSystemExtensions, ...scannedUserExtensions]);
                }
                catch (error) {
                    this._logService.error(error);
                }
                const system = scannedSystemExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
                const userGlobal = scannedUserExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, false));
                const userWorkspace = workspaceExtensions.map(e => (0, extensions_1.toExtensionDescription)(e, false));
                const development = scannedDevelopedExtensions.map(e => (0, extensionsScannerService_1.toExtensionDescription)(e, true));
                const r = (0, extensionsUtil_1.dedupExtensions)(system, [...userGlobal, ...userWorkspace], development, this._logService);
                if (!hasErrors) {
                    const disposable = this._extensionsScannerService.onDidChangeCache(() => {
                        disposable.dispose();
                        this._notificationService.prompt(severity_1.default.Error, (0, nls_1.localize)('extensionCache.invalid', "Extensions have been modified on disk. Please reload the window."), [{
                                label: (0, nls_1.localize)('reloadWindow', "Reload Window"),
                                run: () => this._hostService.reload()
                            }]);
                    });
                    (0, async_1.timeout)(5000).then(() => disposable.dispose());
                }
                return r;
            }
            catch (err) {
                this._logService.error(`Error scanning installed extensions:`);
                this._logService.error(err);
                return [];
            }
        }
    };
    exports.CachedExtensionScanner = CachedExtensionScanner;
    exports.CachedExtensionScanner = CachedExtensionScanner = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, host_1.IHostService),
        __param(2, extensionsScannerService_1.IExtensionsScannerService),
        __param(3, userDataProfile_1.IUserDataProfileService),
        __param(4, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(5, log_1.ILogService)
    ], CachedExtensionScanner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVkRXh0ZW5zaW9uU2Nhbm5lci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9jYWNoZWRFeHRlbnNpb25TY2FubmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CekYsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBc0I7UUFNbEMsWUFDd0Msb0JBQTBDLEVBQ2xELFlBQTBCLEVBQ2IseUJBQW9ELEVBQ3RELHVCQUFnRCxFQUNuQywyQkFBaUUsRUFDMUYsV0FBd0I7WUFMZix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2xELGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ2IsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUN0RCw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQXlCO1lBQ25DLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBc0M7WUFDMUYsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFFdEQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksT0FBTyxDQUEwQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDakYsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE9BQU8sQ0FBQztnQkFDekMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLE1BQU0sQ0FBQztZQUN4QyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTSxLQUFLLENBQUMsbUJBQW1CLENBQUMsYUFBcUIsRUFBRSxTQUFrQjtZQUN6RSxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLHFCQUFxQixDQUFDLFNBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FB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