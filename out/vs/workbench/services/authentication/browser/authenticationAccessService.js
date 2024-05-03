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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, extensions_1, instantiation_1, productService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationAccessService = exports.IAuthenticationAccessService = void 0;
    exports.IAuthenticationAccessService = (0, instantiation_1.createDecorator)('IAuthenticationAccessService');
    // TODO@TylerLeonhardt: Move this class to MainThreadAuthentication
    let AuthenticationAccessService = class AuthenticationAccessService extends lifecycle_1.Disposable {
        constructor(_storageService, _productService) {
            super();
            this._storageService = _storageService;
            this._productService = _productService;
            this._onDidChangeExtensionSessionAccess = this._register(new event_1.Emitter());
            this.onDidChangeExtensionSessionAccess = this._onDidChangeExtensionSessionAccess.event;
        }
        isAccessAllowed(providerId, accountName, extensionId) {
            const trustedExtensionAuthAccess = this._productService.trustedExtensionAuthAccess;
            if (Array.isArray(trustedExtensionAuthAccess)) {
                if (trustedExtensionAuthAccess.includes(extensionId)) {
                    return true;
                }
            }
            else if (trustedExtensionAuthAccess?.[providerId]?.includes(extensionId)) {
                return true;
            }
            const allowList = this.readAllowedExtensions(providerId, accountName);
            const extensionData = allowList.find(extension => extension.id === extensionId);
            if (!extensionData) {
                return undefined;
            }
            // This property didn't exist on this data previously, inclusion in the list at all indicates allowance
            return extensionData.allowed !== undefined
                ? extensionData.allowed
                : true;
        }
        readAllowedExtensions(providerId, accountName) {
            let trustedExtensions = [];
            try {
                const trustedExtensionSrc = this._storageService.get(`${providerId}-${accountName}`, -1 /* StorageScope.APPLICATION */);
                if (trustedExtensionSrc) {
                    trustedExtensions = JSON.parse(trustedExtensionSrc);
                }
            }
            catch (err) { }
            return trustedExtensions;
        }
        updateAllowedExtensions(providerId, accountName, extensions) {
            const allowList = this.readAllowedExtensions(providerId, accountName);
            for (const extension of extensions) {
                const index = allowList.findIndex(e => e.id === extension.id);
                if (index === -1) {
                    allowList.push(extension);
                }
                else {
                    allowList[index].allowed = extension.allowed;
                }
            }
            this._storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
            this._onDidChangeExtensionSessionAccess.fire({ providerId, accountName });
        }
        removeAllowedExtensions(providerId, accountName) {
            this._storageService.remove(`${providerId}-${accountName}`, -1 /* StorageScope.APPLICATION */);
            this._onDidChangeExtensionSessionAccess.fire({ providerId, accountName });
        }
    };
    exports.AuthenticationAccessService = AuthenticationAccessService;
    exports.AuthenticationAccessService = AuthenticationAccessService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, productService_1.IProductService)
    ], AuthenticationAccessService);
    (0, extensions_1.registerSingleton)(exports.IAuthenticationAccessService, AuthenticationAccessService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25BY2Nlc3NTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvYXV0aGVudGljYXRpb24vYnJvd3Nlci9hdXRoZW50aWNhdGlvbkFjY2Vzc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVW5GLFFBQUEsNEJBQTRCLEdBQUcsSUFBQSwrQkFBZSxFQUErQiw4QkFBOEIsQ0FBQyxDQUFDO0lBb0IxSCxtRUFBbUU7SUFDNUQsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBNEIsU0FBUSxzQkFBVTtRQU0xRCxZQUNrQixlQUFpRCxFQUNqRCxlQUFpRDtZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUgwQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBTDNELHVDQUFrQyxHQUF5RCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUErQyxDQUFDLENBQUM7WUFDckssc0NBQWlDLEdBQXVELElBQUksQ0FBQyxrQ0FBa0MsQ0FBQyxLQUFLLENBQUM7UUFPL0ksQ0FBQztRQUVELGVBQWUsQ0FBQyxVQUFrQixFQUFFLFdBQW1CLEVBQUUsV0FBbUI7WUFDM0UsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLDBCQUEwQixDQUFDO1lBQ25GLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLElBQUksMEJBQTBCLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7b0JBQ3RELE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO2lCQUFNLElBQUksMEJBQTBCLEVBQUUsQ0FBQyxVQUFVLENB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