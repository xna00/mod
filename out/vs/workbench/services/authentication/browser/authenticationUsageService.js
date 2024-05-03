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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, extensions_1, instantiation_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationUsageService = exports.IAuthenticationUsageService = void 0;
    exports.IAuthenticationUsageService = (0, instantiation_1.createDecorator)('IAuthenticationUsageService');
    let AuthenticationUsageService = class AuthenticationUsageService {
        constructor(_storageService) {
            this._storageService = _storageService;
        }
        readAccountUsages(providerId, accountName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            const storedUsages = this._storageService.get(accountKey, -1 /* StorageScope.APPLICATION */);
            let usages = [];
            if (storedUsages) {
                try {
                    usages = JSON.parse(storedUsages);
                }
                catch (e) {
                    // ignore
                }
            }
            return usages;
        }
        removeAccountUsage(providerId, accountName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            this._storageService.remove(accountKey, -1 /* StorageScope.APPLICATION */);
        }
        addAccountUsage(providerId, accountName, extensionId, extensionName) {
            const accountKey = `${providerId}-${accountName}-usages`;
            const usages = this.readAccountUsages(providerId, accountName);
            const existingUsageIndex = usages.findIndex(usage => usage.extensionId === extensionId);
            if (existingUsageIndex > -1) {
                usages.splice(existingUsageIndex, 1, {
                    extensionId,
                    extensionName,
                    lastUsed: Date.now()
                });
            }
            else {
                usages.push({
                    extensionId,
                    extensionName,
                    lastUsed: Date.now()
                });
            }
            this._storageService.store(accountKey, JSON.stringify(usages), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.AuthenticationUsageService = AuthenticationUsageService;
    exports.AuthenticationUsageService = AuthenticationUsageService = __decorate([
        __param(0, storage_1.IStorageService)
    ], AuthenticationUsageService);
    (0, extensions_1.registerSingleton)(exports.IAuthenticationUsageService, AuthenticationUsageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb25Vc2FnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9hdXRoZW50aWNhdGlvbi9icm93c2VyL2F1dGhlbnRpY2F0aW9uVXNhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNkJBQTZCLENBQUMsQ0FBQztJQVFoSCxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEwQjtRQUd0QyxZQUE4QyxlQUFnQztZQUFoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFBSSxDQUFDO1FBRW5GLGlCQUFpQixDQUFDLFVBQWtCLEVBQUUsV0FBbUI7WUFDeEQsTUFBTSxVQUFVLEdBQUcsR0FBRyxVQUFVLElBQUksV0FBVyxTQUFTLENBQUM7WUFDekQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsVUFBVSxvQ0FBMkIsQ0FBQztZQUNwRixJQUFJLE1BQU0sR0FBb0IsRUFBRSxDQUFDO1lBQ2pDLElBQUksWUFBWSxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQztvQkFDSixNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNaLFNBQVM7Z0JBQ1YsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFDRCxrQkFBa0IsQ0FBQyxVQUFrQixFQUFFLFdBQW1CO1lBQ3pELE1BQU0sVUFBVSxHQUFHLEdBQUcsVUFBVSxJQUFJLFdBQVcsU0FBUyxDQUFDO1lBQ3pELElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFVBQVUsb0NBQTJCLENBQUM7UUFDbkUsQ0FBQztRQUNELGVBQWUsQ0FBQyxVQUFrQixFQUFFLFdBQW1CLEVBQUUsV0FBbUIsRUFBRSxhQUFxQjtZQUNsRyxNQUFNLFVBQVUsR0FBRyxHQUFHLFVBQVUsSUFBSSxXQUFXLFNBQVMsQ0FBQztZQUN6RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRS9ELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssV0FBVyxDQUFDLENBQUM7WUFDeEYsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3QixNQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRTtvQkFDcEMsV0FBVztvQkFDWCxhQUFhO29CQUNiLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO2lCQUNwQixDQUFDLENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDWCxXQUFXO29CQUNYLGFBQWE7b0JBQ2IsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUU7aUJBQ3BCLENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsbUVBQWtELENBQUM7UUFDakgsQ0FBQztLQUNELENBQUE7SUE1Q1ksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFHekIsV0FBQSx5QkFBZSxDQUFBO09BSGhCLDBCQUEwQixDQTRDdEM7SUFFRCxJQUFBLDhCQUFpQixFQUFDLG1DQUEyQixFQUFFLDBCQUEwQixvQ0FBNEIsQ0FBQyJ9