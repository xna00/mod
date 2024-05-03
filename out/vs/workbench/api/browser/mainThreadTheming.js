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
define(["require", "exports", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/theme/common/themeService"], function (require, exports, extHost_protocol_1, extHostCustomers_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTheming = void 0;
    let MainThreadTheming = class MainThreadTheming {
        constructor(extHostContext, themeService) {
            this._themeService = themeService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTheming);
            this._themeChangeListener = this._themeService.onDidColorThemeChange(e => {
                this._proxy.$onColorThemeChange(this._themeService.getColorTheme().type);
            });
            this._proxy.$onColorThemeChange(this._themeService.getColorTheme().type);
        }
        dispose() {
            this._themeChangeListener.dispose();
        }
    };
    exports.MainThreadTheming = MainThreadTheming;
    exports.MainThreadTheming = MainThreadTheming = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTheming),
        __param(1, themeService_1.IThemeService)
    ], MainThreadTheming);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRoZW1pbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVGhlbWluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFRekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFNN0IsWUFDQyxjQUErQixFQUNoQixZQUEyQjtZQUUxQyxJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVyRSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDeEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzFFLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxPQUFPO1lBQ04sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3JDLENBQUM7S0FDRCxDQUFBO0lBdEJZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBRDdCLElBQUEsdUNBQW9CLEVBQUMsOEJBQVcsQ0FBQyxpQkFBaUIsQ0FBQztRQVNqRCxXQUFBLDRCQUFhLENBQUE7T0FSSCxpQkFBaUIsQ0FzQjdCIn0=