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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions"], function (require, exports, contextkey_1, contributions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ListContext = void 0;
    let ListContext = class ListContext {
        static { this.ID = 'workbench.contrib.listContext'; }
        constructor(contextKeyService) {
            contextKeyService.createKey('listSupportsTypeNavigation', true);
            // @deprecated in favor of listSupportsTypeNavigation
            contextKeyService.createKey('listSupportsKeyboardNavigation', true);
        }
    };
    exports.ListContext = ListContext;
    exports.ListContext = ListContext = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ListContext);
    (0, contributions_1.registerWorkbenchContribution2)(ListContext.ID, ListContext, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2xpc3QvYnJvd3Nlci9saXN0LmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFLekYsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBVztpQkFFUCxPQUFFLEdBQUcsK0JBQStCLEFBQWxDLENBQW1DO1FBRXJELFlBQ3FCLGlCQUFxQztZQUV6RCxpQkFBaUIsQ0FBQyxTQUFTLENBQVUsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFekUscURBQXFEO1lBQ3JELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyRSxDQUFDOztJQVhXLGtDQUFXOzBCQUFYLFdBQVc7UUFLckIsV0FBQSwrQkFBa0IsQ0FBQTtPQUxSLFdBQVcsQ0FZdkI7SUFFRCxJQUFBLDhDQUE4QixFQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsV0FBVyxzQ0FBOEIsQ0FBQyJ9