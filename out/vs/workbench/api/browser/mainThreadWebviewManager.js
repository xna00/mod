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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/browser/mainThreadCustomEditors", "vs/workbench/api/browser/mainThreadWebviewPanels", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/browser/mainThreadWebviewViews", "vs/workbench/api/common/extHost.protocol", "../../services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, instantiation_1, mainThreadCustomEditors_1, mainThreadWebviewPanels_1, mainThreadWebviews_1, mainThreadWebviewViews_1, extHostProtocol, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewManager = void 0;
    let MainThreadWebviewManager = class MainThreadWebviewManager extends lifecycle_1.Disposable {
        constructor(context, instantiationService) {
            super();
            const webviews = this._register(instantiationService.createInstance(mainThreadWebviews_1.MainThreadWebviews, context));
            context.set(extHostProtocol.MainContext.MainThreadWebviews, webviews);
            const webviewPanels = this._register(instantiationService.createInstance(mainThreadWebviewPanels_1.MainThreadWebviewPanels, context, webviews));
            context.set(extHostProtocol.MainContext.MainThreadWebviewPanels, webviewPanels);
            const customEditors = this._register(instantiationService.createInstance(mainThreadCustomEditors_1.MainThreadCustomEditors, context, webviews, webviewPanels));
            context.set(extHostProtocol.MainContext.MainThreadCustomEditors, customEditors);
            const webviewViews = this._register(instantiationService.createInstance(mainThreadWebviewViews_1.MainThreadWebviewsViews, context, webviews));
            context.set(extHostProtocol.MainContext.MainThreadWebviewViews, webviewViews);
        }
    };
    exports.MainThreadWebviewManager = MainThreadWebviewManager;
    exports.MainThreadWebviewManager = MainThreadWebviewManager = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService)
    ], MainThreadWebviewManager);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFdlYnZpZXdNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZFdlYnZpZXdNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVl6RixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVO1FBQ3ZELFlBQ0MsT0FBd0IsRUFDRCxvQkFBMkM7WUFFbEUsS0FBSyxFQUFFLENBQUM7WUFFUixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyx1Q0FBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2xHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUV0RSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpREFBdUIsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUN0SCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsdUJBQXVCLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFFaEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsaURBQXVCLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3JJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUVoRixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxnREFBdUIsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNySCxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDL0UsQ0FBQztLQUNELENBQUE7SUFuQlksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFEcEMsa0NBQWU7UUFJYixXQUFBLHFDQUFxQixDQUFBO09BSFgsd0JBQXdCLENBbUJwQyJ9