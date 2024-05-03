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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/languagePacks/common/languagePacks"], function (require, exports, lifecycle_1, languagePacks_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalizationsUpdater = void 0;
    let LocalizationsUpdater = class LocalizationsUpdater extends lifecycle_1.Disposable {
        constructor(localizationsService) {
            super();
            this.localizationsService = localizationsService;
            this.updateLocalizations();
        }
        updateLocalizations() {
            this.localizationsService.update();
        }
    };
    exports.LocalizationsUpdater = LocalizationsUpdater;
    exports.LocalizationsUpdater = LocalizationsUpdater = __decorate([
        __param(0, languagePacks_1.ILanguagePackService)
    ], LocalizationsUpdater);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxpemF0aW9uc1VwZGF0ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2NvZGUvbm9kZS9zaGFyZWRQcm9jZXNzL2NvbnRyaWIvbG9jYWxpemF0aW9uc1VwZGF0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBTXpGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVU7UUFFbkQsWUFDd0Msb0JBQStDO1lBRXRGLEtBQUssRUFBRSxDQUFDO1lBRitCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBMkI7WUFJdEYsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVPLG1CQUFtQjtZQUMxQixJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDcEMsQ0FBQztLQUNELENBQUE7SUFiWSxvREFBb0I7bUNBQXBCLG9CQUFvQjtRQUc5QixXQUFBLG9DQUFvQixDQUFBO09BSFYsb0JBQW9CLENBYWhDIn0=