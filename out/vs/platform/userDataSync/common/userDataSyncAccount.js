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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, instantiation_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncAccountService = exports.IUserDataSyncAccountService = void 0;
    exports.IUserDataSyncAccountService = (0, instantiation_1.createDecorator)('IUserDataSyncAccountService');
    let UserDataSyncAccountService = class UserDataSyncAccountService extends lifecycle_1.Disposable {
        get account() { return this._account; }
        constructor(userDataSyncStoreService, logService) {
            super();
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.logService = logService;
            this._onDidChangeAccount = this._register(new event_1.Emitter());
            this.onDidChangeAccount = this._onDidChangeAccount.event;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this.wasTokenFailed = false;
            this._register(userDataSyncStoreService.onTokenFailed(code => {
                this.logService.info('Settings Sync auth token failed', this.account?.authenticationProviderId, this.wasTokenFailed, code);
                this.updateAccount(undefined);
                if (code === "Forbidden" /* UserDataSyncErrorCode.Forbidden */) {
                    this._onTokenFailed.fire(true /*bail out immediately*/);
                }
                else {
                    this._onTokenFailed.fire(this.wasTokenFailed /* bail out if token failed before */);
                }
                this.wasTokenFailed = true;
            }));
            this._register(userDataSyncStoreService.onTokenSucceed(() => this.wasTokenFailed = false));
        }
        async updateAccount(account) {
            if (account && this._account ? account.token !== this._account.token || account.authenticationProviderId !== this._account.authenticationProviderId : account !== this._account) {
                this._account = account;
                if (this._account) {
                    this.userDataSyncStoreService.setAuthToken(this._account.token, this._account.authenticationProviderId);
                }
                this._onDidChangeAccount.fire(account);
            }
        }
    };
    exports.UserDataSyncAccountService = UserDataSyncAccountService;
    exports.UserDataSyncAccountService = UserDataSyncAccountService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncLogService)
    ], UserDataSyncAccountService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jQWNjb3VudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNBY2NvdW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVluRixRQUFBLDJCQUEyQixHQUFHLElBQUEsK0JBQWUsRUFBOEIsNkJBQTZCLENBQUMsQ0FBQztJQVdoSCxJQUFNLDBCQUEwQixHQUFoQyxNQUFNLDBCQUEyQixTQUFRLHNCQUFVO1FBS3pELElBQUksT0FBTyxLQUF1QyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBU3pFLFlBQzRCLHdCQUFvRSxFQUN0RSxVQUFvRDtZQUU3RSxLQUFLLEVBQUUsQ0FBQztZQUhvQyw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTJCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQXlCO1lBVnRFLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQW9DLENBQUMsQ0FBQztZQUNyRix1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRXJELG1CQUFjLEdBQXFCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQ3pFLGtCQUFhLEdBQW1CLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBRTNELG1CQUFjLEdBQVksS0FBSyxDQUFDO1lBT3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM1RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzNILElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzlCLElBQUksSUFBSSxzREFBb0MsRUFBRSxDQUFDO29CQUM5QyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDekQsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMscUNBQXFDLENBQUMsQ0FBQztnQkFDckYsQ0FBQztnQkFDRCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzVGLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQXlDO1lBQzVELElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLHdCQUF3QixLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2pMLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO2dCQUN4QixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLENBQUM7Z0JBQ3pHLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0YsQ0FBQztLQUVELENBQUE7SUExQ1ksZ0VBQTBCO3lDQUExQiwwQkFBMEI7UUFlcEMsV0FBQSx3Q0FBeUIsQ0FBQTtRQUN6QixXQUFBLHNDQUF1QixDQUFBO09BaEJiLDBCQUEwQixDQTBDdEMifQ==