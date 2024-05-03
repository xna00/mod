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
define(["require", "exports", "vs/base/common/functional", "vs/base/common/platform", "vs/base/common/severity", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/encryption/common/encryptionService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/secrets/common/secrets", "vs/platform/storage/common/storage", "vs/workbench/services/configuration/common/jsonEditing"], function (require, exports, functional_1, platform_1, severity_1, nls_1, dialogs_1, encryptionService_1, environment_1, extensions_1, log_1, notification_1, opener_1, secrets_1, storage_1, jsonEditing_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeSecretStorageService = void 0;
    let NativeSecretStorageService = class NativeSecretStorageService extends secrets_1.BaseSecretStorageService {
        constructor(_notificationService, _dialogService, _openerService, _jsonEditingService, _environmentService, storageService, encryptionService, logService) {
            super(!!_environmentService.useInMemorySecretStorage, storageService, encryptionService, logService);
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._openerService = _openerService;
            this._jsonEditingService = _jsonEditingService;
            this._environmentService = _environmentService;
            this.notifyOfNoEncryptionOnce = (0, functional_1.createSingleCallFunction)(() => this.notifyOfNoEncryption());
        }
        set(key, value) {
            this._sequencer.queue(key, async () => {
                await this.resolvedStorageService;
                if (this.type !== 'persisted' && !this._environmentService.useInMemorySecretStorage) {
                    this._logService.trace('[NativeSecretStorageService] Notifying user that secrets are not being stored on disk.');
                    await this.notifyOfNoEncryptionOnce();
                }
            });
            return super.set(key, value);
        }
        async notifyOfNoEncryption() {
            const buttons = [];
            const troubleshootingButton = {
                label: (0, nls_1.localize)('troubleshootingButton', "Open troubleshooting guide"),
                run: () => this._openerService.open('https://go.microsoft.com/fwlink/?linkid=2239490'),
                // doesn't close dialogs
                keepOpen: true
            };
            buttons.push(troubleshootingButton);
            let errorMessage = (0, nls_1.localize)('encryptionNotAvailableJustTroubleshootingGuide', "An OS keyring couldn't be identified for storing the encryption related data in your current desktop environment.");
            if (!platform_1.isLinux) {
                this._notificationService.prompt(severity_1.default.Error, errorMessage, buttons);
                return;
            }
            const provider = await this._encryptionService.getKeyStorageProvider();
            if (provider === "basic_text" /* KnownStorageProvider.basicText */) {
                const detail = (0, nls_1.localize)('usePlainTextExtraSentence', "Open the troubleshooting guide to address this or you can use weaker encryption that doesn't use the OS keyring.");
                const usePlainTextButton = {
                    label: (0, nls_1.localize)('usePlainText', "Use weaker encryption"),
                    run: async () => {
                        await this._encryptionService.setUsePlainTextEncryption();
                        await this._jsonEditingService.write(this._environmentService.argvResource, [{ path: ['password-store'], value: "basic" /* PasswordStoreCLIOption.basic */ }], true);
                        this.reinitialize();
                    }
                };
                buttons.unshift(usePlainTextButton);
                await this._dialogService.prompt({
                    type: 'error',
                    buttons,
                    message: errorMessage,
                    detail
                });
                return;
            }
            if ((0, encryptionService_1.isGnome)(provider)) {
                errorMessage = (0, nls_1.localize)('isGnome', "You're running in a GNOME environment but the OS keyring is not available for encryption. Ensure you have gnome-keyring or another libsecret compatible implementation installed and running.");
            }
            else if ((0, encryptionService_1.isKwallet)(provider)) {
                errorMessage = (0, nls_1.localize)('isKwallet', "You're running in a KDE environment but the OS keyring is not available for encryption. Ensure you have kwallet running.");
            }
            this._notificationService.prompt(severity_1.default.Error, errorMessage, buttons);
        }
    };
    exports.NativeSecretStorageService = NativeSecretStorageService;
    exports.NativeSecretStorageService = NativeSecretStorageService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, dialogs_1.IDialogService),
        __param(2, opener_1.IOpenerService),
        __param(3, jsonEditing_1.IJSONEditingService),
        __param(4, environment_1.INativeEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, encryptionService_1.IEncryptionService),
        __param(7, log_1.ILogService)
    ], NativeSecretStorageService);
    (0, extensions_1.registerSingleton)(secrets_1.ISecretStorageService, NativeSecretStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0U3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zZWNyZXRzL2VsZWN0cm9uLXNhbmRib3gvc2VjcmV0U3RvcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLGtDQUF3QjtRQUV2RSxZQUN1QixvQkFBMkQsRUFDakUsY0FBK0MsRUFDL0MsY0FBK0MsRUFDMUMsbUJBQXlELEVBQ25ELG1CQUErRCxFQUN6RSxjQUErQixFQUM1QixpQkFBcUMsRUFDNUMsVUFBdUI7WUFFcEMsS0FBSyxDQUNKLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsRUFDOUMsY0FBYyxFQUNkLGlCQUFpQixFQUNqQixVQUFVLENBQ1YsQ0FBQztZQWRxQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXNCO1lBQ2hELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUM5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDekIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUNsQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQTJCO1lBMkJuRiw2QkFBd0IsR0FBRyxJQUFBLHFDQUF3QixFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7UUFoQi9GLENBQUM7UUFFUSxHQUFHLENBQUMsR0FBVyxFQUFFLEtBQWE7WUFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUNyQyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztnQkFFbEMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFL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