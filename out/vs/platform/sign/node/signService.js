/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/sign/common/abstractSignService"], function (require, exports, abstractSignService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    class SignService extends abstractSignService_1.AbstractSignService {
        getValidator() {
            return this.vsda().then(vsda => new vsda.validator());
        }
        signValue(arg) {
            return this.vsda().then(vsda => new vsda.signer().sign(arg));
        }
        vsda() {
            return new Promise((resolve, reject) => require(['vsda'], resolve, reject));
        }
    }
    exports.SignService = SignService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3NpZ24vbm9kZS9zaWduU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQmhHLE1BQWEsV0FBWSxTQUFRLHlDQUFtQjtRQUNoQyxZQUFZO1lBQzlCLE9BQU8sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUNrQixTQUFTLENBQUMsR0FBVztZQUN2QyxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRU8sSUFBSTtZQUNYLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDO0tBQ0Q7SUFYRCxrQ0FXQyJ9