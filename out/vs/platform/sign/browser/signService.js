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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/decorators", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/sign/common/abstractSignService"], function (require, exports, dom_1, window_1, decorators_1, network_1, productService_1, abstractSignService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    const KEY_SIZE = 32;
    const IV_SIZE = 16;
    const STEP_SIZE = KEY_SIZE + IV_SIZE;
    let SignService = class SignService extends abstractSignService_1.AbstractSignService {
        constructor(productService) {
            super();
            this.productService = productService;
        }
        getValidator() {
            return this.vsda().then(vsda => {
                const v = new vsda.validator();
                return {
                    createNewMessage: arg => v.createNewMessage(arg),
                    validate: arg => v.validate(arg),
                    dispose: () => v.free(),
                };
            });
        }
        signValue(arg) {
            return this.vsda().then(vsda => vsda.sign(arg));
        }
        async vsda() {
            const checkInterval = new dom_1.WindowIntervalTimer();
            let [wasm] = await Promise.all([
                this.getWasmBytes(),
                new Promise((resolve, reject) => {
                    require(['vsda'], resolve, reject);
                    // todo@connor4312: there seems to be a bug(?) in vscode-loader with
                    // require() not resolving in web once the script loads, so check manually
                    checkInterval.cancelAndSet(() => {
                        if (typeof vsda_web !== 'undefined') {
                            resolve();
                        }
                    }, 50, window_1.mainWindow);
                }).finally(() => checkInterval.dispose()),
            ]);
            const keyBytes = new TextEncoder().encode(this.productService.serverLicense?.join('\n') || '');
            for (let i = 0; i + STEP_SIZE < keyBytes.length; i += STEP_SIZE) {
                const key = await crypto.subtle.importKey('raw', keyBytes.slice(i + IV_SIZE, i + IV_SIZE + KEY_SIZE), { name: 'AES-CBC' }, false, ['decrypt']);
                wasm = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: keyBytes.slice(i, i + IV_SIZE) }, key, wasm);
            }
            await vsda_web.default(wasm);
            return vsda_web;
        }
        async getWasmBytes() {
            const response = await fetch(network_1.FileAccess.asBrowserUri('vsda/../vsda_bg.wasm').toString(true));
            if (!response.ok) {
                throw new Error('error loading vsda');
            }
            return response.arrayBuffer();
        }
    };
    exports.SignService = SignService;
    __decorate([
        decorators_1.memoize
    ], SignService.prototype, "vsda", null);
    exports.SignService = SignService = __decorate([
        __param(0, productService_1.IProductService)
    ], SignService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3NpZ24vYnJvd3Nlci9zaWduU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNwQixNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDbkIsTUFBTSxTQUFTLEdBQUcsUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUU5QixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEseUNBQW1CO1FBQ25ELFlBQThDLGNBQStCO1lBQzVFLEtBQUssRUFBRSxDQUFDO1lBRHFDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUU3RSxDQUFDO1FBQ2tCLFlBQVk7WUFDOUIsT0FBTyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUM5QixNQUFNLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztvQkFDTixnQkFBZ0IsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7b0JBQ2hELFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO29CQUNoQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtpQkFDdkIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVrQixTQUFTLENBQUMsR0FBVztZQUN2QyxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENB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