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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/platform/clipboard/common/clipboardService"], function (require, exports, extHostCustomers_1, extHost_protocol_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadClipboard = void 0;
    let MainThreadClipboard = class MainThreadClipboard {
        constructor(_context, _clipboardService) {
            this._clipboardService = _clipboardService;
        }
        dispose() {
            // nothing
        }
        $readText() {
            return this._clipboardService.readText();
        }
        $writeText(value) {
            return this._clipboardService.writeText(value);
        }
    };
    exports.MainThreadClipboard = MainThreadClipboard;
    exports.MainThreadClipboard = MainThreadClipboard = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadClipboard),
        __param(1, clipboardService_1.IClipboardService)
    ], MainThreadClipboard);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENsaXBib2FyZC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWRDbGlwYm9hcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBT3pGLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBRS9CLFlBQ0MsUUFBYSxFQUN1QixpQkFBb0M7WUFBcEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUNyRSxDQUFDO1FBRUwsT0FBTztZQUNOLFVBQVU7UUFDWCxDQUFDO1FBRUQsU0FBUztZQUNSLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzFDLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsQ0FBQztLQUNELENBQUE7SUFsQlksa0RBQW1CO2tDQUFuQixtQkFBbUI7UUFEL0IsSUFBQSx1Q0FBb0IsRUFBQyw4QkFBVyxDQUFDLG1CQUFtQixDQUFDO1FBS25ELFdBQUEsb0NBQWlCLENBQUE7T0FKUCxtQkFBbUIsQ0FrQi9CIn0=