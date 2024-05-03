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
define(["require", "exports", "electron", "vs/base/common/platform", "vs/platform/log/common/log"], function (require, exports, electron_1, platform_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptionMainService = void 0;
    const safeStorage = electron_1.safeStorage;
    let EncryptionMainService = class EncryptionMainService {
        constructor(logService) {
            this.logService = logService;
            // if this commandLine switch is set, the user has opted in to using basic text encryption
            if (electron_1.app.commandLine.getSwitchValue('password-store') === "basic" /* PasswordStoreCLIOption.basic */) {
                safeStorage.setUsePlainTextEncryption?.(true);
            }
        }
        async encrypt(value) {
            this.logService.trace('[EncryptionMainService] Encrypting value.');
            try {
                const result = JSON.stringify(safeStorage.encryptString(value));
                this.logService.trace('[EncryptionMainService] Encrypted value.');
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        async decrypt(value) {
            let parsedValue;
            try {
                parsedValue = JSON.parse(value);
                if (!parsedValue.data) {
                    throw new Error(`[EncryptionMainService] Invalid encrypted value: ${value}`);
                }
                const bufferToDecrypt = Buffer.from(parsedValue.data);
                this.logService.trace('[EncryptionMainService] Decrypting value.');
                const result = safeStorage.decryptString(bufferToDecrypt);
                this.logService.trace('[EncryptionMainService] Decrypted value.');
                return result;
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        isEncryptionAvailable() {
            return Promise.resolve(safeStorage.isEncryptionAvailable());
        }
        getKeyStorageProvider() {
            if (platform_1.isWindows) {
                return Promise.resolve("dpapi" /* KnownStorageProvider.dplib */);
            }
            if (platform_1.isMacintosh) {
                return Promise.resolve("keychain_access" /* KnownStorageProvider.keychainAccess */);
            }
            if (safeStorage.getSelectedStorageBackend) {
                try {
                    const result = safeStorage.getSelectedStorageBackend();
                    return Promise.resolve(result);
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            return Promise.resolve("unknown" /* KnownStorageProvider.unknown */);
        }
        async setUsePlainTextEncryption() {
            if (platform_1.isWindows) {
                throw new Error('Setting plain text encryption is not supported on Windows.');
            }
            if (platform_1.isMacintosh) {
                throw new Error('Setting plain text encryption is not supported on macOS.');
            }
            if (!safeStorage.setUsePlainTextEncryption) {
                throw new Error('Setting plain text encryption is not supported.');
            }
            safeStorage.setUsePlainTextEncryption(true);
        }
    };
    exports.EncryptionMainService = EncryptionMainService;
    exports.EncryptionMainService = EncryptionMainService = __decorate([
        __param(0, log_1.ILogService)
    ], EncryptionMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5jcnlwdGlvbk1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9lbmNyeXB0aW9uL2VsZWN0cm9uLW1haW4vZW5jcnlwdGlvbk1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWNoRyxNQUFNLFdBQVcsR0FBZ0Ysc0JBQW1CLENBQUM7SUFFOUcsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBcUI7UUFHakMsWUFDK0IsVUFBdUI7WUFBdkIsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUVyRCwwRkFBMEY7WUFDMUYsSUFBSSxjQUFHLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQywrQ0FBaUMsRUFBRSxDQUFDO2dCQUN2RixXQUFXLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBYTtZQUMxQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQztnQkFDSixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsMENBQTBDLENBQUMsQ0FBQztnQkFDbEUsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekIsTUFBTSxDQUFDLENBQUM7WUFDVCxDQUFDO1FBQ0YsQ0FBQztRQUVE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