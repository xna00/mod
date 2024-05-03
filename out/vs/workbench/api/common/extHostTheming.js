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
define(["require", "exports", "./extHostTypes", "vs/workbench/api/common/extHostRpcService", "vs/base/common/event"], function (require, exports, extHostTypes_1, extHostRpcService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTheming = void 0;
    let ExtHostTheming = class ExtHostTheming {
        constructor(_extHostRpc) {
            this._actual = new extHostTypes_1.ColorTheme(extHostTypes_1.ColorThemeKind.Dark);
            this._onDidChangeActiveColorTheme = new event_1.Emitter();
        }
        get activeColorTheme() {
            return this._actual;
        }
        $onColorThemeChange(type) {
            let kind;
            switch (type) {
                case 'light':
                    kind = extHostTypes_1.ColorThemeKind.Light;
                    break;
                case 'hcDark':
                    kind = extHostTypes_1.ColorThemeKind.HighContrast;
                    break;
                case 'hcLight':
                    kind = extHostTypes_1.ColorThemeKind.HighContrastLight;
                    break;
                default:
                    kind = extHostTypes_1.ColorThemeKind.Dark;
            }
            this._actual = new extHostTypes_1.ColorTheme(kind);
            this._onDidChangeActiveColorTheme.fire(this._actual);
        }
        get onDidChangeActiveColorTheme() {
            return this._onDidChangeActiveColorTheme.event;
        }
    };
    exports.ExtHostTheming = ExtHostTheming;
    exports.ExtHostTheming = ExtHostTheming = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostTheming);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRoZW1pbmcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUaGVtaW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFjO1FBTzFCLFlBQ3FCLFdBQStCO1lBRW5ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSx5QkFBVSxDQUFDLDZCQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkQsSUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksZUFBTyxFQUFjLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQVcsZ0JBQWdCO1lBQzFCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRUQsbUJBQW1CLENBQUMsSUFBWTtZQUMvQixJQUFJLElBQUksQ0FBQztZQUNULFFBQVEsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsS0FBSyxPQUFPO29CQUFFLElBQUksR0FBRyw2QkFBYyxDQUFDLEtBQUssQ0FBQztvQkFBQyxNQUFNO2dCQUNqRCxLQUFLLFFBQVE7b0JBQUUsSUFBSSxHQUFHLDZCQUFjLENBQUMsWUFBWSxDQUFDO29CQUFDLE1BQU07Z0JBQ3pELEtBQUssU0FBUztvQkFBRSxJQUFJLEdBQUcsNkJBQWMsQ0FBQyxpQkFBaUIsQ0FBQztvQkFBQyxNQUFNO2dCQUMvRDtvQkFDQyxJQUFJLEdBQUcsNkJBQWMsQ0FBQyxJQUFJLENBQUM7WUFDN0IsQ0FBQztZQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSx5QkFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFRCxJQUFXLDJCQUEyQjtZQUNyQyxPQUFPLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxLQUFLLENBQUM7UUFDaEQsQ0FBQztLQUNELENBQUE7SUFsQ1ksd0NBQWM7NkJBQWQsY0FBYztRQVF4QixXQUFBLHNDQUFrQixDQUFBO09BUlIsY0FBYyxDQWtDMUIifQ==