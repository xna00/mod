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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/product/common/productService"], function (require, exports, async_1, lifecycle_1, uri_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeURLService = exports.AbstractURLService = void 0;
    class AbstractURLService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.handlers = new Set();
        }
        open(uri, options) {
            const handlers = [...this.handlers.values()];
            return (0, async_1.first)(handlers.map(h => () => h.handleURL(uri, options)), undefined, false).then(val => val || false);
        }
        registerHandler(handler) {
            this.handlers.add(handler);
            return (0, lifecycle_1.toDisposable)(() => this.handlers.delete(handler));
        }
    }
    exports.AbstractURLService = AbstractURLService;
    let NativeURLService = class NativeURLService extends AbstractURLService {
        constructor(productService) {
            super();
            this.productService = productService;
        }
        create(options) {
            let { authority, path, query, fragment } = options ? options : { authority: undefined, path: undefined, query: undefined, fragment: undefined };
            if (authority && path && path.indexOf('/') !== 0) {
                path = `/${path}`; // URI validation requires a path if there is an authority
            }
            return uri_1.URI.from({ scheme: this.productService.urlProtocol, authority, path, query, fragment });
        }
    };
    exports.NativeURLService = NativeURLService;
    exports.NativeURLService = NativeURLService = __decorate([
        __param(0, productService_1.IProductService)
    ], NativeURLService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXJsL2NvbW1vbi91cmxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVFoRyxNQUFzQixrQkFBbUIsU0FBUSxzQkFBVTtRQUEzRDs7WUFJUyxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQWUsQ0FBQztRQWEzQyxDQUFDO1FBVEEsSUFBSSxDQUFDLEdBQVEsRUFBRSxPQUF5QjtZQUN2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE9BQU8sSUFBQSxhQUFLLEVBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQztRQUM5RyxDQUFDO1FBRUQsZUFBZSxDQUFDLE9BQW9CO1lBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNCLE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztLQUNEO0lBakJELGdEQWlCQztJQUVNLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsa0JBQWtCO1FBRXZELFlBQ3FDLGNBQStCO1lBRW5FLEtBQUssRUFBRSxDQUFDO1lBRjRCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUdwRSxDQUFDO1FBRUQsTUFBTSxDQUFDLE9BQWdDO1lBQ3RDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFFaEosSUFBSSxTQUFTLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2xELElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsMERBQTBEO1lBQzlFLENBQUM7WUFFRCxPQUFPLFNBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNoRyxDQUFDO0tBQ0QsQ0FBQTtJQWpCWSw0Q0FBZ0I7K0JBQWhCLGdCQUFnQjtRQUcxQixXQUFBLGdDQUFlLENBQUE7T0FITCxnQkFBZ0IsQ0FpQjVCIn0=