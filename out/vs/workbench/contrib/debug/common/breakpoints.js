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
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Breakpoints = void 0;
    let Breakpoints = class Breakpoints {
        constructor(breakpointContribution, contextKeyService) {
            this.breakpointContribution = breakpointContribution;
            this.contextKeyService = contextKeyService;
            this.breakpointsWhen = typeof breakpointContribution.when === 'string' ? contextkey_1.ContextKeyExpr.deserialize(breakpointContribution.when) : undefined;
        }
        get language() {
            return this.breakpointContribution.language;
        }
        get enabled() {
            return !this.breakpointsWhen || this.contextKeyService.contextMatchesRules(this.breakpointsWhen);
        }
    };
    exports.Breakpoints = Breakpoints;
    exports.Breakpoints = Breakpoints = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], Breakpoints);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJlYWtwb2ludHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL2NvbW1vbi9icmVha3BvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFLekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBVztRQUl2QixZQUNrQixzQkFBK0MsRUFDM0IsaUJBQXFDO1lBRHpELDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDM0Isc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUUxRSxJQUFJLENBQUMsZUFBZSxHQUFHLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsMkJBQWMsQ0FBQyxXQUFXLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUM5SSxDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDO1FBQzdDLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2xHLENBQUM7S0FDRCxDQUFBO0lBbEJZLGtDQUFXOzBCQUFYLFdBQVc7UUFNckIsV0FBQSwrQkFBa0IsQ0FBQTtPQU5SLFdBQVcsQ0FrQnZCIn0=