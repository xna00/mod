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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/ports", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/native/common/native", "vs/platform/product/common/productService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/extensions/common/extensions"], function (require, exports, actions_1, ports_1, nls, dialogs_1, native_1, productService_1, debug_1, extensions_1) {
    "use strict";
    var DebugExtensionHostAction_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugExtensionHostAction = void 0;
    let DebugExtensionHostAction = class DebugExtensionHostAction extends actions_1.Action {
        static { DebugExtensionHostAction_1 = this; }
        static { this.ID = 'workbench.extensions.action.debugExtensionHost'; }
        static { this.LABEL = nls.localize('debugExtensionHost', "Start Debugging Extension Host"); }
        static { this.CSS_CLASS = 'debug-extension-host'; }
        constructor(_debugService, _nativeHostService, _dialogService, _extensionService, productService) {
            super(DebugExtensionHostAction_1.ID, DebugExtensionHostAction_1.LABEL, DebugExtensionHostAction_1.CSS_CLASS);
            this._debugService = _debugService;
            this._nativeHostService = _nativeHostService;
            this._dialogService = _dialogService;
            this._extensionService = _extensionService;
            this.productService = productService;
        }
        async run() {
            const inspectPorts = await this._extensionService.getInspectPorts(1 /* ExtensionHostKind.LocalProcess */, false);
            if (inspectPorts.length === 0) {
                const res = await this._dialogService.confirm({
                    message: nls.localize('restart1', "Profile Extensions"),
                    detail: nls.localize('restart2', "In order to profile extensions a restart is required. Do you want to restart '{0}' now?", this.productService.nameLong),
                    primaryButton: nls.localize({ key: 'restart3', comment: ['&& denotes a mnemonic'] }, "&&Restart")
                });
                if (res.confirmed) {
                    await this._nativeHostService.relaunch({ addArgs: [`--inspect-extensions=${(0, ports_1.randomPort)()}`] });
                }
                return;
            }
            if (inspectPorts.length > 1) {
                // TODO
                console.warn(`There are multiple extension hosts available for debugging. Picking the first one...`);
            }
            return this._debugService.startDebugging(undefined, {
                type: 'node',
                name: nls.localize('debugExtensionHost.launch.name', "Attach Extension Host"),
                request: 'attach',
                port: inspectPorts[0]
            });
        }
    };
    exports.DebugExtensionHostAction = DebugExtensionHostAction;
    exports.DebugExtensionHostAction = DebugExtensionHostAction = DebugExtensionHostAction_1 = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, native_1.INativeHostService),
        __param(2, dialogs_1.IDialogService),
        __param(3, extensions_1.IExtensionService),
        __param(4, productService_1.IProductService)
    ], DebugExtensionHostAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdFeHRlbnNpb25Ib3N0QWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2VsZWN0cm9uLXNhbmRib3gvZGVidWdFeHRlbnNpb25Ib3N0QWN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxnQkFBTTs7aUJBQ25DLE9BQUUsR0FBRyxnREFBZ0QsQUFBbkQsQ0FBb0Q7aUJBQ3RELFVBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLGdDQUFnQyxDQUFDLEFBQXZFLENBQXdFO2lCQUM3RSxjQUFTLEdBQUcsc0JBQXNCLEFBQXpCLENBQTBCO1FBRW5ELFlBQ2lDLGFBQTRCLEVBQ3ZCLGtCQUFzQyxFQUMxQyxjQUE4QixFQUMzQixpQkFBb0MsRUFDdEMsY0FBK0I7WUFFakUsS0FBSyxDQUFDLDBCQUF3QixDQUFDLEVBQUUsRUFBRSwwQkFBd0IsQ0FBQyxLQUFLLEVBQUUsMEJBQXdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFOdkUsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUMxQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUN0QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFHbEUsQ0FBQztRQUVRLEtBQUssQ0FBQyxHQUFHO1lBRWpCLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUseUNBQWlDLEtBQUssQ0FBQyxDQUFDO1lBQ3pHLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQztvQkFDN0MsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLG9CQUFvQixDQUFDO29CQUN2RCxNQUFNLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUseUZBQXlGLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUM7b0JBQ3pKLGFBQWEsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDO2lCQUNqRyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ25CLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLHdCQUF3QixJQUFBLGtCQUFVLEdBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRixDQUFDO2dCQUVELE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM3QixPQUFPO2dCQUNQLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0ZBQXNGLENBQUMsQ0FBQztZQUN0RyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUU7Z0JBQ25ELElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLHVCQUF1QixDQUFDO2dCQUM3RSxPQUFPLEVBQUUsUUFBUTtnQkFDakIsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7YUFDckIsQ0FBQyxDQUFDO1FBQ0osQ0FBQzs7SUExQ1csNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFNbEMsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSwyQkFBa0IsQ0FBQTtRQUNsQixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLDhCQUFpQixDQUFBO1FBQ2pCLFdBQUEsZ0NBQWUsQ0FBQTtPQVZMLHdCQUF3QixDQTJDcEMifQ==