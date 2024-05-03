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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/url/common/urlService", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/product/common/productService"], function (require, exports, url_1, uri_1, extensions_1, urlService_1, environmentService_1, opener_1, network_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserURLService = void 0;
    class BrowserURLOpener {
        constructor(urlService, productService) {
            this.urlService = urlService;
            this.productService = productService;
        }
        async open(resource, options) {
            if (options?.openExternal) {
                return false;
            }
            if (!(0, network_1.matchesScheme)(resource, this.productService.urlProtocol)) {
                return false;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            return this.urlService.open(resource, { trusted: true });
        }
    }
    let BrowserURLService = class BrowserURLService extends urlService_1.AbstractURLService {
        constructor(environmentService, openerService, productService) {
            super();
            this.provider = environmentService.options?.urlCallbackProvider;
            if (this.provider) {
                this._register(this.provider.onCallback(uri => this.open(uri, { trusted: true })));
            }
            this._register(openerService.registerOpener(new BrowserURLOpener(this, productService)));
        }
        create(options) {
            if (this.provider) {
                return this.provider.create(options);
            }
            return uri_1.URI.parse('unsupported://');
        }
    };
    exports.BrowserURLService = BrowserURLService;
    exports.BrowserURLService = BrowserURLService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], BrowserURLService);
    (0, extensions_1.registerSingleton)(url_1.IURLService, BrowserURLService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VybC9icm93c2VyL3VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0NoRyxNQUFNLGdCQUFnQjtRQUVyQixZQUNTLFVBQXVCLEVBQ3ZCLGNBQStCO1lBRC9CLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQ3BDLENBQUM7UUFFTCxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQXNCLEVBQUUsT0FBbUQ7WUFDckYsSUFBSyxPQUEyQyxFQUFFLFlBQVksRUFBRSxDQUFDO2dCQUNoRSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLENBQUMsSUFBQSx1QkFBYSxFQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQy9ELE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ2xDLFFBQVEsR0FBRyxTQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFELENBQUM7S0FDRDtJQUVNLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsK0JBQWtCO1FBSXhELFlBQ3NDLGtCQUF1RCxFQUM1RSxhQUE2QixFQUM1QixjQUErQjtZQUVoRCxLQUFLLEVBQUUsQ0FBQztZQUVSLElBQUksQ0FBQyxRQUFRLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDO1lBRWhFLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUYsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUFnQztZQUN0QyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDcEMsQ0FBQztLQUNELENBQUE7SUEzQlksOENBQWlCO2dDQUFqQixpQkFBaUI7UUFLM0IsV0FBQSx3REFBbUMsQ0FBQTtRQUNuQyxXQUFBLHVCQUFjLENBQUE7UUFDZCxXQUFBLGdDQUFlLENBQUE7T0FQTCxpQkFBaUIsQ0EyQjdCO0lBRUQsSUFBQSw4QkFBaUIsRUFBQyxpQkFBVyxFQUFFLGlCQUFpQixvQ0FBNEIsQ0FBQyJ9