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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService", "vs/base/common/platform"], function (require, exports, extensionRecommendations_1, productService_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteRecommendations = void 0;
    let RemoteRecommendations = class RemoteRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() { return this._recommendations; }
        constructor(productService) {
            super();
            this.productService = productService;
            this._recommendations = [];
        }
        async doActivate() {
            const extensionTips = { ...this.productService.remoteExtensionTips, ...this.productService.virtualWorkspaceExtensionTips };
            const currentPlatform = (0, platform_1.PlatformToString)(platform_1.platform);
            this._recommendations = Object.values(extensionTips).filter(({ supportedPlatforms }) => !supportedPlatforms || supportedPlatforms.includes(currentPlatform)).map(extension => ({
                extension: extension.extensionId.toLowerCase(),
                reason: {
                    reasonId: 6 /* ExtensionRecommendationReason.Application */,
                    reasonText: ''
                }
            }));
        }
    };
    exports.RemoteRecommendations = RemoteRecommendations;
    exports.RemoteRecommendations = RemoteRecommendations = __decorate([
        __param(0, productService_1.IProductService)
    ], RemoteRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvcmVtb3RlUmVjb21tZW5kYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU96RixJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFzQixTQUFRLG1EQUF3QjtRQUdsRSxJQUFJLGVBQWUsS0FBb0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBRXRHLFlBQ2tCLGNBQWdEO1lBRWpFLEtBQUssRUFBRSxDQUFDO1lBRjBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUoxRCxxQkFBZ0IsR0FBcUMsRUFBRSxDQUFDO1FBT2hFLENBQUM7UUFFUyxLQUFLLENBQUMsVUFBVTtZQUN6QixNQUFNLGFBQWEsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUMzSCxNQUFNLGVBQWUsR0FBRyxJQUFBLDJCQUFnQixFQUFDLG1CQUFRLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsa0JBQWtCLElBQUksa0JBQWtCLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUssU0FBUyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFO2dCQUM5QyxNQUFNLEVBQUU7b0JBQ1AsUUFBUSxtREFBMkM7b0JBQ25ELFVBQVUsRUFBRSxFQUFFO2lCQUNkO2FBQ0QsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0QsQ0FBQTtJQXRCWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQU0vQixXQUFBLGdDQUFlLENBQUE7T0FOTCxxQkFBcUIsQ0FzQmpDIn0=