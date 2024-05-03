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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/opener/common/opener", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/workbench/services/host/browser/host", "vs/workbench/services/userActivity/common/userActivityService"], function (require, exports, event_1, lifecycle_1, uri_1, opener_1, extHostCustomers_1, extHost_protocol_1, host_1, userActivityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWindow = void 0;
    let MainThreadWindow = class MainThreadWindow {
        constructor(extHostContext, hostService, openerService, userActivityService) {
            this.hostService = hostService;
            this.openerService = openerService;
            this.userActivityService = userActivityService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostWindow);
            event_1.Event.latch(hostService.onDidChangeFocus)(this.proxy.$onDidChangeWindowFocus, this.proxy, this.disposables);
            userActivityService.onDidChangeIsActive(this.proxy.$onDidChangeWindowActive, this.proxy, this.disposables);
        }
        dispose() {
            this.disposables.dispose();
        }
        $getInitialState() {
            return Promise.resolve({
                isFocused: this.hostService.hasFocus,
                isActive: this.userActivityService.isActive,
            });
        }
        async $openUri(uriComponents, uriString, options) {
            const uri = uri_1.URI.from(uriComponents);
            let target;
            if (uriString && uri_1.URI.parse(uriString).toString() === uri.toString()) {
                // called with string and no transformation happened -> keep string
                target = uriString;
            }
            else {
                // called with URI or transformed -> use uri
                target = uri;
            }
            return this.openerService.open(target, {
                openExternal: true,
                allowTunneling: options.allowTunneling,
                allowContributedOpeners: options.allowContributedOpeners,
            });
        }
        async $asExternalUri(uriComponents, options) {
            const result = await this.openerService.resolveExternalUri(uri_1.URI.revive(uriComponents), options);
            return result.resolved;
        }
    };
    exports.MainThreadWindow = MainThreadWindow;
    exports.MainThreadWindow = MainThreadWindow = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadWindow),
        __param(1, host_1.IHostService),
        __param(2, opener_1.IOpenerService),
        __param(3, userActivityService_1.IUserActivityService)
    ], MainThreadWindow);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdpbmRvdy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRXaW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWdCO1FBSzVCLFlBQ0MsY0FBK0IsRUFDakIsV0FBMEMsRUFDeEMsYUFBOEMsRUFDeEMsbUJBQTBEO1lBRmpELGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3ZCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN2Qix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBTmhFLGdCQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFRcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFbkUsYUFBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FDdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNwRSxtQkFBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVHLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRUQsZ0JBQWdCO1lBQ2YsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRO2dCQUNwQyxRQUFRLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVE7YUFDM0MsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBNEIsRUFBRSxTQUE2QixFQUFFLE9BQXdCO1lBQ25HLE1BQU0sR0FBRyxHQUFHLFNBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDcEMsSUFBSSxNQUFvQixDQUFDO1lBQ3pCLElBQUksU0FBUyxJQUFJLFNBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxFQUFFLEtBQUssR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUM7Z0JBQ3JFLG1FQUFtRTtnQkFDbkUsTUFBTSxHQUFHLFNBQVMsQ0FBQztZQUNwQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsNENBQTRDO2dCQUM1QyxNQUFNLEdBQUcsR0FBRyxDQUFDO1lBQ2QsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUN0QyxZQUFZLEVBQUUsSUFBSTtnQkFDbEIsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO2dCQUN0Qyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsdUJBQXVCO2FBQ3hELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLGFBQTRCLEVBQUUsT0FBd0I7WUFDMUUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLFNBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDL0YsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ3hCLENBQUM7S0FDRCxDQUFBO0lBbERZLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBRDVCLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxnQkFBZ0IsQ0FBQztRQVFoRCxXQUFBLG1CQUFZLENBQUE7UUFDWixXQUFBLHVCQUFjLENBQUE7UUFDZCxXQUFBLDBDQUFvQixDQUFBO09BVFYsZ0JBQWdCLENBa0Q1QiJ9