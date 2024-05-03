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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/log/common/log", "vs/base/common/async", "vs/platform/secrets/common/secrets", "vs/workbench/services/environment/browser/environmentService"], function (require, exports, lifecycle_1, extHostCustomers_1, extHost_protocol_1, log_1, async_1, secrets_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSecretState = void 0;
    let MainThreadSecretState = class MainThreadSecretState extends lifecycle_1.Disposable {
        constructor(extHostContext, secretStorageService, logService, environmentService) {
            super();
            this.secretStorageService = secretStorageService;
            this.logService = logService;
            this._sequencer = new async_1.SequencerByKey();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSecretState);
            this._register(this.secretStorageService.onDidChangeSecret((e) => {
                try {
                    const { extensionId, key } = this.parseKey(e);
                    if (extensionId && key) {
                        this._proxy.$onDidChangePassword({ extensionId, key });
                    }
                }
                catch (e) {
                    // Core can use non-JSON values as keys, so we may not be able to parse them.
                }
            }));
        }
        $getPassword(extensionId, key) {
            this.logService.trace(`[mainThreadSecretState] Getting password for ${extensionId} extension: `, key);
            return this._sequencer.queue(extensionId, () => this.doGetPassword(extensionId, key));
        }
        async doGetPassword(extensionId, key) {
            const fullKey = this.getKey(extensionId, key);
            const password = await this.secretStorageService.get(fullKey);
            this.logService.trace(`[mainThreadSecretState] ${password ? 'P' : 'No p'}assword found for: `, extensionId, key);
            return password;
        }
        $setPassword(extensionId, key, value) {
            this.logService.trace(`[mainThreadSecretState] Setting password for ${extensionId} extension: `, key);
            return this._sequencer.queue(extensionId, () => this.doSetPassword(extensionId, key, value));
        }
        async doSetPassword(extensionId, key, value) {
            const fullKey = this.getKey(extensionId, key);
            await this.secretStorageService.set(fullKey, value);
            this.logService.trace('[mainThreadSecretState] Password set for: ', extensionId, key);
        }
        $deletePassword(extensionId, key) {
            this.logService.trace(`[mainThreadSecretState] Deleting password for ${extensionId} extension: `, key);
            return this._sequencer.queue(extensionId, () => this.doDeletePassword(extensionId, key));
        }
        async doDeletePassword(extensionId, key) {
            const fullKey = this.getKey(extensionId, key);
            await this.secretStorageService.delete(fullKey);
            this.logService.trace('[mainThreadSecretState] Password deleted for: ', extensionId, key);
        }
        getKey(extensionId, key) {
            return JSON.stringify({ extensionId, key });
        }
        parseKey(key) {
            return JSON.parse(key);
        }
    };
    exports.MainThreadSecretState = MainThreadSecretState;
    exports.MainThreadSecretState = MainThreadSecretState = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadSecretState),
        __param(1, secrets_1.ISecretStorageService),
        __param(2, log_1.ILogService),
        __param(3, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], MainThreadSecretState);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNlY3JldFN0YXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFNlY3JldFN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVd6RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLHNCQUFVO1FBS3BELFlBQ0MsY0FBK0IsRUFDUixvQkFBNEQsRUFDdEUsVUFBd0MsRUFDaEIsa0JBQXVEO1lBRTVGLEtBQUssRUFBRSxDQUFDO1lBSmdDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUxyQyxlQUFVLEdBQUcsSUFBSSxzQkFBYyxFQUFVLENBQUM7WUFVMUQsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV6RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQVMsRUFBRSxFQUFFO2dCQUN4RSxJQUFJLENBQUM7b0JBQ0osTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5QyxJQUFJLFdBQVcsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUN4RCxDQUFDO2dCQUNGLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDWiw2RUFBNkU7Z0JBQzlFLENBQUM7WUFDRixDQUFDLENBQUMsQ0FB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