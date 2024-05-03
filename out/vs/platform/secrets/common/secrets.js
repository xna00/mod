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
define(["require", "exports", "vs/base/common/async", "vs/platform/encryption/common/encryptionService", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/base/common/lazy"], function (require, exports, async_1, encryptionService_1, instantiation_1, storage_1, event_1, log_1, lifecycle_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseSecretStorageService = exports.ISecretStorageService = void 0;
    exports.ISecretStorageService = (0, instantiation_1.createDecorator)('secretStorageService');
    let BaseSecretStorageService = class BaseSecretStorageService extends lifecycle_1.Disposable {
        constructor(_useInMemoryStorage, _storageService, _encryptionService, _logService) {
            super();
            this._useInMemoryStorage = _useInMemoryStorage;
            this._storageService = _storageService;
            this._encryptionService = _encryptionService;
            this._logService = _logService;
            this._storagePrefix = 'secret://';
            this.onDidChangeSecretEmitter = this._register(new event_1.Emitter());
            this.onDidChangeSecret = this.onDidChangeSecretEmitter.event;
            this._sequencer = new async_1.SequencerByKey();
            this._type = 'unknown';
            this._onDidChangeValueDisposable = this._register(new lifecycle_1.DisposableStore());
            this._lazyStorageService = new lazy_1.Lazy(() => this.initialize());
        }
        /**
         * @Note initialize must be called first so that this can be resolved properly
         * otherwise it will return 'unknown'.
         */
        get type() {
            return this._type;
        }
        get resolvedStorageService() {
            return this._lazyStorageService.value;
        }
        get(key) {
            return this._sequencer.queue(key, async () => {
                const storageService = await this.resolvedStorageService;
                const fullKey = this.getKey(key);
                this._logService.trace('[secrets] getting secret for key:', fullKey);
                const encrypted = storageService.get(fullKey, -1 /* StorageScope.APPLICATION */);
                if (!encrypted) {
                    this._logService.trace('[secrets] no secret found for key:', fullKey);
                    return undefined;
                }
                try {
                    this._logService.trace('[secrets] decrypting gotten secret for key:', fullKey);
                    // If the storage service is in-memory, we don't need to decrypt
                    const result = this._type === 'in-memory'
                        ? encrypted
                        : await this._encryptionService.decrypt(encrypted);
                    this._logService.trace('[secrets] decrypted secret for key:', fullKey);
                    return result;
                }
                catch (e) {
                    this._logService.error(e);
                    this.delete(key);
                    return undefined;
                }
            });
        }
        set(key, value) {
            return this._sequencer.queue(key, async () => {
                const storageService = await this.resolvedStorageService;
                this._logService.trace('[secrets] encrypting secret for key:', key);
                let encrypted;
                try {
                    // If the storage service is in-memory, we don't need to encrypt
                    encrypted = this._type === 'in-memory'
                        ? value
                        : await this._encryptionService.encrypt(value);
                }
                catch (e) {
                    this._logService.error(e);
                    throw e;
                }
                const fullKey = this.getKey(key);
                this._logService.trace('[secrets] storing encrypted secret for key:', fullKey);
                storageService.store(fullKey, encrypted, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this._logService.trace('[secrets] stored encrypted secret for key:', fullKey);
            });
        }
        delete(key) {
            return this._sequencer.queue(key, async () => {
                const storageService = await this.resolvedStorageService;
                const fullKey = this.getKey(key);
                this._logService.trace('[secrets] deleting secret for key:', fullKey);
                storageService.remove(fullKey, -1 /* StorageScope.APPLICATION */);
                this._logService.trace('[secrets] deleted secret for key:', fullKey);
            });
        }
        async initialize() {
            let storageService;
            if (!this._useInMemoryStorage && await this._encryptionService.isEncryptionAvailable()) {
                this._logService.trace(`[SecretStorageService] Encryption is available, using persisted storage`);
                this._type = 'persisted';
                storageService = this._storageService;
            }
            else {
                // If we already have an in-memory storage service, we don't need to recreate it
                if (this._type === 'in-memory') {
                    return this._storageService;
                }
                this._logService.trace('[SecretStorageService] Encryption is not available, falling back to in-memory storage');
                this._type = 'in-memory';
                storageService = this._register(new storage_1.InMemoryStorageService());
            }
            this._onDidChangeValueDisposable.clear();
            this._onDidChangeValueDisposable.add(storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, undefined, this._onDidChangeValueDisposable)(e => {
                this.onDidChangeValue(e.key);
            }));
            return storageService;
        }
        reinitialize() {
            this._lazyStorageService = new lazy_1.Lazy(() => this.initialize());
        }
        onDidChangeValue(key) {
            if (!key.startsWith(this._storagePrefix)) {
                return;
            }
            const secretKey = key.slice(this._storagePrefix.length);
            this._logService.trace(`[SecretStorageService] Notifying change in value for secret: ${secretKey}`);
            this.onDidChangeSecretEmitter.fire(secretKey);
        }
        getKey(key) {
            return `${this._storagePrefix}${key}`;
        }
    };
    exports.BaseSecretStorageService = BaseSecretStorageService;
    exports.BaseSecretStorageService = BaseSecretStorageService = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, encryptionService_1.IEncryptionService),
        __param(3, log_1.ILogService)
    ], BaseSecretStorageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc2VjcmV0cy9jb21tb24vc2VjcmV0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFXbkYsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFjN0YsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBVTtRQWN2RCxZQUNrQixtQkFBNEIsRUFDNUIsZUFBd0MsRUFDckMsa0JBQWdELEVBQ3ZELFdBQTJDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBTFMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFTO1lBQ3BCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUMzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBZnhDLG1CQUFjLEdBQUcsV0FBVyxDQUFDO1lBRTNCLDZCQUF3QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVUsQ0FBQyxDQUFDO1lBQ3BGLHNCQUFpQixHQUFrQixJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBRXBELGVBQVUsR0FBRyxJQUFJLHNCQUFjLEVBQVUsQ0FBQztZQUVyRCxVQUFLLEdBQTBDLFNBQVMsQ0FBQztZQUVoRCxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFtQjdFLHdCQUFtQixHQUFtQyxJQUFJLFdBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQVZoRyxDQUFDO1FBRUQ7OztXQUdHO1FBQ0gsSUFBSSxJQUFJO1lBQ1AsT0FB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