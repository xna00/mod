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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService"], function (require, exports, extensionRecommendations_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageRecommendations = void 0;
    let LanguageRecommendations = class LanguageRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        constructor(productService) {
            super();
            this.productService = productService;
            this._recommendations = [];
        }
        async doActivate() {
            if (this.productService.languageExtensionTips) {
                this._recommendations = this.productService.languageExtensionTips.map(extensionId => ({
                    extension: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: ''
                    }
                }));
            }
        }
    };
    exports.LanguageRecommendations = LanguageRecommendations;
    exports.LanguageRecommendations = LanguageRecommendations = __decorate([
        __param(0, productService_1.IProductService)
    ], LanguageRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VSZWNvbW1lbmRhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvYnJvd3Nlci9sYW5ndWFnZVJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFNekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxtREFBd0I7UUFHcEUsSUFBSSxlQUFlLEtBQTZDLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztRQUUvRixZQUNrQixjQUFnRDtZQUVqRSxLQUFLLEVBQUUsQ0FBQztZQUYwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFKMUQscUJBQWdCLEdBQThCLEVBQUUsQ0FBQztRQU96RCxDQUFDO1FBRVMsS0FBSyxDQUFDLFVBQVU7WUFDekIsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQTBCO29CQUM5RyxTQUFTLEVBQUUsV0FBVyxDQUFDLFdBQVcsRUFBRTtvQkFDcEMsTUFBTSxFQUFFO3dCQUNQLFFBQVEsbURBQTJDO3dCQUNuRCxVQUFVLEVBQUUsRUFBRTtxQkFDZDtpQkFDQSxDQUFBLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO0tBRUQsQ0FBQTtJQXZCWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQU1qQyxXQUFBLGdDQUFlLENBQUE7T0FOTCx1QkFBdUIsQ0F1Qm5DIn0=