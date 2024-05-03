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
    exports.KeymapRecommendations = void 0;
    let KeymapRecommendations = class KeymapRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        constructor(productService) {
            super();
            this.productService = productService;
            this._recommendations = [];
        }
        async doActivate() {
            if (this.productService.keymapExtensionTips) {
                this._recommendations = this.productService.keymapExtensionTips.map(extensionId => ({
                    extension: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: ''
                    }
                }));
            }
        }
    };
    exports.KeymapRecommendations = KeymapRecommendations;
    exports.KeymapRecommendations = KeymapRecommendations = __decorate([
        __param(0, productService_1.IProductService)
    ], KeymapRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5bWFwUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIva2V5bWFwUmVjb21tZW5kYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU16RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLG1EQUF3QjtRQUdsRSxJQUFJLGVBQWUsS0FBNkMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRS9GLFlBQ2tCLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBRjBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUoxRCxxQkFBZ0IsR0FBOEIsRUFBRSxDQUFDO1FBT3pELENBQUM7UUFFUyxLQUFLLENBQUMsVUFBVTtZQUN6QixJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBMEI7b0JBQzVHLFNBQVMsRUFBRSxXQUFXLENBQUMsV0FBVyxFQUFFO29CQUNwQyxNQUFNLEVBQUU7d0JBQ1AsUUFBUSxtREFBMkM7d0JBQ25ELFVBQVUsRUFBRSxFQUFFO3FCQUNkO2lCQUNBLENBQUEsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztRQUNGLENBQUM7S0FFRCxDQUFBO0lBdkJZLHNEQUFxQjtvQ0FBckIscUJBQXFCO1FBTS9CLFdBQUEsZ0NBQWUsQ0FBQTtPQU5MLHFCQUFxQixDQXVCakMifQ==