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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "../../services/extensions/common/extHostCustomers", "vs/platform/url/common/url", "vs/workbench/services/extensions/browser/extensionUrlHandler", "vs/platform/extensions/common/extensions"], function (require, exports, extHost_protocol_1, extHostCustomers_1, url_1, extensionUrlHandler_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadUrls = void 0;
    class ExtensionUrlHandler {
        constructor(proxy, handle, extensionId, extensionDisplayName) {
            this.proxy = proxy;
            this.handle = handle;
            this.extensionId = extensionId;
            this.extensionDisplayName = extensionDisplayName;
        }
        handleURL(uri, options) {
            if (!extensions_1.ExtensionIdentifier.equals(this.extensionId, uri.authority)) {
                return Promise.resolve(false);
            }
            return Promise.resolve(this.proxy.$handleExternalUri(this.handle, uri)).then(() => true);
        }
    }
    let MainThreadUrls = class MainThreadUrls {
        constructor(context, urlService, extensionUrlHandler) {
            this.urlService = urlService;
            this.extensionUrlHandler = extensionUrlHandler;
            this.handlers = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUrls);
        }
        $registerUriHandler(handle, extensionId, extensionDisplayName) {
            const handler = new ExtensionUrlHandler(this.proxy, handle, extensionId, extensionDisplayName);
            const disposable = this.urlService.registerHandler(handler);
            this.handlers.set(handle, { extensionId, disposable });
            this.extensionUrlHandler.registerExtensionHandler(extensionId, handler);
            return Promise.resolve(undefined);
        }
        $unregisterUriHandler(handle) {
            const tuple = this.handlers.get(handle);
            if (!tuple) {
                return Promise.resolve(undefined);
            }
            const { extensionId, disposable } = tuple;
            this.extensionUrlHandler.unregisterExtensionHandler(extensionId);
            this.handlers.delete(handle);
            disposable.dispose();
            return Promise.resolve(undefined);
        }
        async $createAppUri(uri) {
            return this.urlService.create(uri);
        }
        dispose() {
            this.handlers.forEach(({ disposable }) => disposable.dispose());
            this.handlers.clear();
        }
    };
    exports.MainThreadUrls = MainThreadUrls;
    exports.MainThreadUrls = MainThreadUrls = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadUrls),
        __param(1, url_1.IURLService),
        __param(2, extensionUrlHandler_1.IExtensionUrlHandler)
    ], MainThreadUrls);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFVybHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVXJscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsTUFBTSxtQkFBbUI7UUFFeEIsWUFDa0IsS0FBdUIsRUFDdkIsTUFBYyxFQUN0QixXQUFnQyxFQUNoQyxvQkFBNEI7WUFIcEIsVUFBSyxHQUFMLEtBQUssQ0FBa0I7WUFDdkIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUN0QixnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7WUFDaEMseUJBQW9CLEdBQXBCLG9CQUFvQixDQUFRO1FBQ2xDLENBQUM7UUFFTCxTQUFTLENBQUMsR0FBUSxFQUFFLE9BQXlCO1lBQzVDLElBQUksQ0FBQyxnQ0FBbUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztnQkFDbEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFGLENBQUM7S0FDRDtJQUdNLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWM7UUFLMUIsWUFDQyxPQUF3QixFQUNYLFVBQXdDLEVBQy9CLG1CQUEwRDtZQURsRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2Qsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUx6RSxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQXlFLENBQUM7WUFPbkcsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELG1CQUFtQixDQUFDLE1BQWMsRUFBRSxXQUFnQyxFQUFFLG9CQUE0QjtZQUNqRyxNQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQy9GLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTVELElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQyxtQkFBbUIsQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFeEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxNQUFjO1lBQ25DLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXhDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDbkMsQ0FBQztZQUVELE1BQU0sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEdBQUcsS0FBSyxDQUFDO1lBRTFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QixVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFckIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQWtCO1lBQ3JDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELE9BQU87WUFDTixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDdkIsQ0FBQztLQUNELENBQUE7SUEvQ1ksd0NBQWM7NkJBQWQsY0FBYztRQUQxQixJQUFBLHVDQUFvQixFQUFDLDhCQUFXLENBQUMsY0FBYyxDQUFDO1FBUTlDLFdBQUEsaUJBQVcsQ0FBQTtRQUNYLFdBQUEsMENBQW9CLENBQUE7T0FSVixjQUFjLENBK0MxQiJ9