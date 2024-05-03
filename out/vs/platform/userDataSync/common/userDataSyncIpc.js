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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSyncStoreService"], function (require, exports, event_1, lifecycle_1, uri_1, configuration_1, productService_1, storage_1, userDataSyncStoreService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreManagementServiceChannelClient = exports.UserDataSyncStoreManagementServiceChannel = exports.UserDataSyncAccountServiceChannelClient = exports.UserDataSyncAccountServiceChannel = void 0;
    class UserDataSyncAccountServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeAccount': return this.service.onDidChangeAccount;
                case 'onTokenFailed': return this.service.onTokenFailed;
            }
            throw new Error(`[UserDataSyncAccountServiceChannel] Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialData': return Promise.resolve(this.service.account);
                case 'updateAccount': return this.service.updateAccount(args);
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncAccountServiceChannel = UserDataSyncAccountServiceChannel;
    class UserDataSyncAccountServiceChannelClient extends lifecycle_1.Disposable {
        get account() { return this._account; }
        get onTokenFailed() { return this.channel.listen('onTokenFailed'); }
        constructor(channel) {
            super();
            this.channel = channel;
            this._onDidChangeAccount = this._register(new event_1.Emitter());
            this.onDidChangeAccount = this._onDidChangeAccount.event;
            this.channel.call('_getInitialData').then(account => {
                this._account = account;
                this._register(this.channel.listen('onDidChangeAccount')(account => {
                    this._account = account;
                    this._onDidChangeAccount.fire(account);
                }));
            });
        }
        updateAccount(account) {
            return this.channel.call('updateAccount', account);
        }
    }
    exports.UserDataSyncAccountServiceChannelClient = UserDataSyncAccountServiceChannelClient;
    class UserDataSyncStoreManagementServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeUserDataSyncStore': return this.service.onDidChangeUserDataSyncStore;
            }
            throw new Error(`[UserDataSyncStoreManagementServiceChannel] Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'switch': return this.service.switch(args[0]);
                case 'getPreviousUserDataSyncStore': return this.service.getPreviousUserDataSyncStore();
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncStoreManagementServiceChannel = UserDataSyncStoreManagementServiceChannel;
    let UserDataSyncStoreManagementServiceChannelClient = class UserDataSyncStoreManagementServiceChannelClient extends userDataSyncStoreService_1.AbstractUserDataSyncStoreManagementService {
        constructor(channel, productService, configurationService, storageService) {
            super(productService, configurationService, storageService);
            this.channel = channel;
            this._register(this.channel.listen('onDidChangeUserDataSyncStore')(() => this.updateUserDataSyncStore()));
        }
        async switch(type) {
            return this.channel.call('switch', [type]);
        }
        async getPreviousUserDataSyncStore() {
            const userDataSyncStore = await this.channel.call('getPreviousUserDataSyncStore');
            return this.revive(userDataSyncStore);
        }
        revive(userDataSyncStore) {
            return {
                url: uri_1.URI.revive(userDataSyncStore.url),
                type: userDataSyncStore.type,
                defaultUrl: uri_1.URI.revive(userDataSyncStore.defaultUrl),
                insidersUrl: uri_1.URI.revive(userDataSyncStore.insidersUrl),
                stableUrl: uri_1.URI.revive(userDataSyncStore.stableUrl),
                canSwitch: userDataSyncStore.canSwitch,
                authenticationProviders: userDataSyncStore.authenticationProviders,
            };
        }
    };
    exports.UserDataSyncStoreManagementServiceChannelClient = UserDataSyncStoreManagementServiceChannelClient;
    exports.UserDataSyncStoreManagementServiceChannelClient = UserDataSyncStoreManagementServiceChannelClient = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService)
    ], UserDataSyncStoreManagementServiceChannelClient);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3VzZXJEYXRhU3luY0lwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhaEcsTUFBYSxpQ0FBaUM7UUFDN0MsWUFBNkIsT0FBb0M7WUFBcEMsWUFBTyxHQUFQLE9BQU8sQ0FBNkI7UUFBSSxDQUFDO1FBRXRFLE1BQU0sQ0FBQyxDQUFVLEVBQUUsS0FBYTtZQUMvQixRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssb0JBQW9CLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUM7Z0JBQ2xFLEtBQUssZUFBZSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3REFBd0QsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBRUQsSUFBSSxDQUFDLE9BQVksRUFBRSxPQUFlLEVBQUUsSUFBVTtZQUM3QyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLGlCQUFpQixDQUFDLENBQUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JFLEtBQUssZUFBZSxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvRCxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNqQyxDQUFDO0tBQ0Q7SUFsQkQsOEVBa0JDO0lBRUQsTUFBYSx1Q0FBd0MsU0FBUSxzQkFBVTtR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