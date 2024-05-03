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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/menubar/electron-main/menubar"], function (require, exports, instantiation_1, lifecycleMainService_1, log_1, menubar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenubarMainService = exports.IMenubarMainService = void 0;
    exports.IMenubarMainService = (0, instantiation_1.createDecorator)('menubarMainService');
    let MenubarMainService = class MenubarMainService {
        constructor(instantiationService, lifecycleMainService, logService) {
            this.instantiationService = instantiationService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.menubar = this.installMenuBarAfterWindowOpen();
        }
        async installMenuBarAfterWindowOpen() {
            await this.lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */);
            return this.instantiationService.createInstance(menubar_1.Menubar);
        }
        async updateMenubar(windowId, menus) {
            this.logService.trace('menubarService#updateMenubar', windowId);
            const menubar = await this.menubar;
            menubar.updateMenu(menus, windowId);
        }
    };
    exports.MenubarMainService = MenubarMainService;
    exports.MenubarMainService = MenubarMainService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, lifecycleMainService_1.ILifecycleMainService),
        __param(2, log_1.ILogService)
    ], MenubarMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhck1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9tZW51YmFyL2VsZWN0cm9uLW1haW4vbWVudWJhck1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVFuRixRQUFBLG1CQUFtQixHQUFHLElBQUEsK0JBQWUsRUFBc0Isb0JBQW9CLENBQUMsQ0FBQztJQU12RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQU05QixZQUN5QyxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQ3JELFVBQXVCO1lBRmIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFFckQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNyRCxDQUFDO1FBRU8sS0FBSyxDQUFDLDZCQUE2QjtZQUMxQyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLDRDQUFvQyxDQUFDO1lBRXpFLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxpQkFBTyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsUUFBZ0IsRUFBRSxLQUFtQjtZQUN4RCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUVoRSxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDbkMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDckMsQ0FBQztLQUNELENBQUE7SUExQlksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFPNUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDRDQUFxQixDQUFBO1FBQ3JCLFdBQUEsaUJBQVcsQ0FBQTtPQVRELGtCQUFrQixDQTBCOUIifQ==