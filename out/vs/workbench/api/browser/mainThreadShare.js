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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/share/common/share", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, cancellation_1, lifecycle_1, uri_1, extHost_protocol_1, share_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadShare = void 0;
    let MainThreadShare = class MainThreadShare {
        constructor(extHostContext, shareService) {
            this.shareService = shareService;
            this.providers = new Map();
            this.providerDisposables = new Map();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostShare);
        }
        $registerShareProvider(handle, selector, id, label, priority) {
            const provider = {
                id,
                label,
                selector,
                priority,
                provideShare: async (item) => {
                    const result = await this.proxy.$provideShare(handle, item, cancellation_1.CancellationToken.None);
                    return typeof result === 'string' ? result : uri_1.URI.revive(result);
                }
            };
            this.providers.set(handle, provider);
            const disposable = this.shareService.registerShareProvider(provider);
            this.providerDisposables.set(handle, disposable);
        }
        $unregisterShareProvider(handle) {
            if (this.providers.has(handle)) {
                this.providers.delete(handle);
            }
            if (this.providerDisposables.has(handle)) {
                this.providerDisposables.delete(handle);
            }
        }
        dispose() {
            this.providers.clear();
            (0, lifecycle_1.dispose)(this.providerDisposables.values());
            this.providerDisposables.clear();
        }
    };
    exports.MainThreadShare = MainThreadShare;
    exports.MainThreadShare = MainThreadShare = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadShare),
        __param(1, share_1.IShareService)
    ], MainThreadShare);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFNoYXJlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFNoYXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVV6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBTTNCLFlBQ0MsY0FBK0IsRUFDaEIsWUFBNEM7WUFBM0IsaUJBQVksR0FBWixZQUFZLENBQWU7WUFMcEQsY0FBUyxHQUFHLElBQUksR0FBRyxFQUEwQixDQUFDO1lBQzlDLHdCQUFtQixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBTTVELElBQUksQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25FLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxNQUFjLEVBQUUsUUFBOEIsRUFBRSxFQUFVLEVBQUUsS0FBYSxFQUFFLFFBQWdCO1lBQ2pILE1BQU0sUUFBUSxHQUFtQjtnQkFDaEMsRUFBRTtnQkFDRixLQUFLO2dCQUNMLFFBQVE7Z0JBQ1IsUUFBUTtnQkFDUixZQUFZLEVBQUUsS0FBSyxFQUFFLElBQW9CLEVBQUUsRUFBRTtvQkFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNwRixPQUFPLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRSxDQUFDO2FBQ0QsQ0FBQztZQUNGLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNyQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFRCx3QkFBd0IsQ0FBQyxNQUFjO1lBQ3RDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO2dCQUMxQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pDLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTztZQUNOLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsSUFBQSxtQkFBTyxFQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsQyxDQUFDO0tBQ0QsQ0FBQTtJQTNDWSwwQ0FBZTs4QkFBZixlQUFlO1FBRDNCLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxlQUFlLENBQUM7UUFTL0MsV0FBQSxxQkFBYSxDQUFBO09BUkgsZUFBZSxDQTJDM0IifQ==