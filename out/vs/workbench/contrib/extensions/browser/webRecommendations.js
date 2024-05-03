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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensionRecommendations_1, productService_1, nls_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebRecommendations = void 0;
    let WebRecommendations = class WebRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        constructor(productService, extensionManagementServerService) {
            super();
            this.productService = productService;
            this.extensionManagementServerService = extensionManagementServerService;
            this._recommendations = [];
        }
        async doActivate() {
            const isOnlyWeb = this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer;
            if (isOnlyWeb && Array.isArray(this.productService.webExtensionTips)) {
                this._recommendations = this.productService.webExtensionTips.map(extensionId => ({
                    extension: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: (0, nls_1.localize)('reason', "This extension is recommended for {0} for the Web", this.productService.nameLong)
                    }
                }));
            }
        }
    };
    exports.WebRecommendations = WebRecommendations;
    exports.WebRecommendations = WebRecommendations = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, extensionManagement_1.IExtensionManagementServerService)
    ], WebRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvd2ViUmVjb21tZW5kYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVF6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLG1EQUF3QjtRQUcvRCxJQUFJLGVBQWUsS0FBNkMsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRS9GLFlBQ2tCLGNBQWdELEVBQzlCLGdDQUFvRjtZQUV2SCxLQUFLLEVBQUUsQ0FBQztZQUgwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDYixxQ0FBZ0MsR0FBaEMsZ0NBQWdDLENBQW1DO1lBTGhILHFCQUFnQixHQUE4QixFQUFFLENBQUM7UUFRekQsQ0FBQztRQUVTLEtBQUssQ0FBQyxVQUFVO1lBQ3pCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw0QkFBNEIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyw4QkFBOEIsSUFBSSxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQywrQkFBK0IsQ0FBQztZQUN4TyxJQUFJLFNBQVMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO2dCQUN0RSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUEwQjtvQkFDekcsU0FBUyxFQUFFLFdBQVcsQ0FBQyxXQUFXLEVBQUU7b0JBQ3BDLE1BQU0sRUFBRTt3QkFDUCxRQUFRLG1EQUEyQzt3QkFDbkQsVUFBVSxFQUFFLElBQUEsY0FBUSxFQUFDLFFBQVEsRUFBRSxtREFBbUQsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQztxQkFDakg7aUJBQ0EsQ0FBQSxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0YsQ0FBQztLQUVELENBQUE7SUF6QlksZ0RBQWtCO2lDQUFsQixrQkFBa0I7UUFNNUIsV0FBQSxnQ0FBZSxDQUFBO1FBQ2YsV0FBQSx1REFBaUMsQ0FBQTtPQVB2QixrQkFBa0IsQ0F5QjlCIn0=