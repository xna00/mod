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
define(["require", "exports", "vs/workbench/common/contributions", "vs/workbench/contrib/splash/browser/splash", "vs/platform/native/common/native", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/splash/browser/partsSplash"], function (require, exports, contributions_1, splash_1, native_1, extensions_1, partsSplash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SplashStorageService = class SplashStorageService {
        constructor(nativeHostService) {
            this.saveWindowSplash = nativeHostService.saveWindowSplash.bind(nativeHostService);
        }
    };
    SplashStorageService = __decorate([
        __param(0, native_1.INativeHostService)
    ], SplashStorageService);
    (0, extensions_1.registerSingleton)(splash_1.ISplashStorageService, SplashStorageService, 1 /* InstantiationType.Delayed */);
    (0, contributions_1.registerWorkbenchContribution2)(partsSplash_1.PartsSplash.ID, partsSplash_1.PartsSplash, 1 /* WorkbenchPhase.BlockStartup */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3BsYXNoLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc3BsYXNoL2VsZWN0cm9uLXNhbmRib3gvc3BsYXNoLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7OztJQVNoRyxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQUl6QixZQUFnQyxpQkFBcUM7WUFDcEUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BGLENBQUM7S0FDRCxDQUFBO0lBUEssb0JBQW9CO1FBSVosV0FBQSwyQkFBa0IsQ0FBQTtPQUoxQixvQkFBb0IsQ0FPekI7SUFFRCxJQUFBLDhCQUFpQixFQUFDLDhCQUFxQixFQUFFLG9CQUFvQixvQ0FBNEIsQ0FBQztJQUUxRixJQUFBLDhDQUE4QixFQUM3Qix5QkFBVyxDQUFDLEVBQUUsRUFDZCx5QkFBVyxzQ0FFWCxDQUFDIn0=