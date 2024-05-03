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
define(["require", "exports", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/log/common/log", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/ipc/common/mainProcessService"], function (require, exports, userDataProfileStorageService_1, extensions_1, storage_1, log_1, userDataProfile_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeUserDataProfileStorageService = void 0;
    let NativeUserDataProfileStorageService = class NativeUserDataProfileStorageService extends userDataProfileStorageService_1.RemoteUserDataProfileStorageService {
        constructor(mainProcessService, userDataProfilesService, storageService, logService) {
            super(mainProcessService, userDataProfilesService, storageService, logService);
        }
    };
    exports.NativeUserDataProfileStorageService = NativeUserDataProfileStorageService;
    exports.NativeUserDataProfileStorageService = NativeUserDataProfileStorageService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, storage_1.IStorageService),
        __param(3, log_1.ILogService)
    ], NativeUserDataProfileStorageService);
    (0, extensions_1.registerSingleton)(userDataProfileStorageService_1.IUserDataProfileStorageService, NativeUserDataProfileStorageService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhUHJvZmlsZS9lbGVjdHJvbi1zYW5kYm94L3VzZXJEYXRhUHJvZmlsZVN0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLG1DQUFtQyxHQUF6QyxNQUFNLG1DQUFvQyxTQUFRLG1FQUFtQztRQUUzRixZQUNzQixrQkFBdUMsRUFDbEMsdUJBQWlELEVBQzFELGNBQStCLEVBQ25DLFVBQXVCO1lBRXBDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSx1QkFBdUIsRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDaEYsQ0FBQztLQUNELENBQUE7SUFWWSxrRkFBbUM7a0RBQW5DLG1DQUFtQztRQUc3QyxXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxpQkFBVyxDQUFBO09BTkQsbUNBQW1DLENBVS9DO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyw4REFBOEIsRUFBRSxtQ0FBbUMsb0NBQTRCLENBQUMifQ==