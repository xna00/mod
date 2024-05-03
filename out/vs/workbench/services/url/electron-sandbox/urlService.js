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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/ipc/common/mainProcessService", "vs/platform/url/common/urlIpc", "vs/platform/opener/common/opener", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions", "vs/base/parts/ipc/common/ipc", "vs/platform/native/common/native", "vs/platform/url/common/urlService", "vs/platform/log/common/log"], function (require, exports, url_1, uri_1, mainProcessService_1, urlIpc_1, opener_1, network_1, productService_1, extensions_1, ipc_1, native_1, urlService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RelayURLService = void 0;
    let RelayURLService = class RelayURLService extends urlService_1.NativeURLService {
        constructor(mainProcessService, openerService, nativeHostService, productService, logService) {
            super(productService);
            this.nativeHostService = nativeHostService;
            this.logService = logService;
            this.urlService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('url'));
            mainProcessService.registerChannel('urlHandler', new urlIpc_1.URLHandlerChannel(this));
            openerService.registerOpener(this);
        }
        create(options) {
            const uri = super.create(options);
            let query = uri.query;
            if (!query) {
                query = `windowId=${encodeURIComponent(this.nativeHostService.windowId)}`;
            }
            else {
                query += `&windowId=${encodeURIComponent(this.nativeHostService.windowId)}`;
            }
            return uri.with({ query });
        }
        async open(resource, options) {
            if (!(0, network_1.matchesScheme)(resource, this.productService.urlProtocol)) {
                return false;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            return await this.urlService.open(resource, options);
        }
        async handleURL(uri, options) {
            const result = await super.open(uri, options);
            if (result) {
                this.logService.trace('URLService#handleURL(): handled', uri.toString(true));
                await this.nativeHostService.focusWindow({ force: true /* Application may not be active */, targetWindowId: this.nativeHostService.windowId });
            }
            else {
                this.logService.trace('URLService#handleURL(): not handled', uri.toString(true));
            }
            return result;
        }
    };
    exports.RelayURLService = RelayURLService;
    exports.RelayURLService = RelayURLService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService),
        __param(1, opener_1.IOpenerService),
        __param(2, native_1.INativeHostService),
        __param(3, productService_1.IProductService),
        __param(4, log_1.ILogService)
    ], RelayURLService);
    (0, extensions_1.registerSingleton)(url_1.IURLService, RelayURLService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VybC9lbGVjdHJvbi1zYW5kYm94L3VybFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFnQixTQUFRLDZCQUFnQjtRQUlwRCxZQUNzQixrQkFBdUMsRUFDNUMsYUFBNkIsRUFDUixpQkFBcUMsRUFDekQsY0FBK0IsRUFDbEIsVUFBdUI7WUFFckQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBSmUsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUU1QyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBSXJELElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQVksQ0FBQyxTQUFTLENBQWMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFFNUYsa0JBQWtCLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxJQUFJLDBCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUUsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRVEsTUFBTSxDQUFDLE9BQWdDO1lBQy9DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEMsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztZQUN0QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osS0FBSyxHQUFHLFlBQVksa0JBQWtCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDM0UsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLEtBQUssSUFBSSxhQUFhLGtCQUFrQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQzdFLENBQUM7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFUSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQXNCLEVBQUUsT0FBOEI7WUFFekUsSUFBSSxDQUFDLElBQUEsdUJBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUMvRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNsQyxRQUFRLEdBQUcsU0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsT0FBTyxNQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFRLEVBQUUsT0FBeUI7WUFDbEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUU5QyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFN0UsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDaEosQ0FBQztpQkFBTSxDQUFDO2dCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNsRixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0QsQ0FBQTtJQXpEWSwwQ0FBZTs4QkFBZixlQUFlO1FBS3pCLFdBQUEsd0NBQW1CLENBQUE7UUFDbkIsV0FBQSx1QkFBYyxDQUFBO1FBQ2QsV0FBQSwyQkFBa0IsQ0FBQTtRQUNsQixXQUFBLGdDQUFlLENBQUE7UUFDZixXQUFBLGlCQUFXLENBQUE7T0FURCxlQUFlLENBeUQzQjtJQUVELElBQUEsOEJBQWlCLEVBQUMsaUJBQVcsRUFBRSxlQUFlLGtDQUEwQixDQUFDIn0=