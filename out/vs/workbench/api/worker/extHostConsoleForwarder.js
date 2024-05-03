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
define(["require", "exports", "vs/workbench/api/common/extHostConsoleForwarder", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService"], function (require, exports, extHostConsoleForwarder_1, extHostInitDataService_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostConsoleForwarder = void 0;
    let ExtHostConsoleForwarder = class ExtHostConsoleForwarder extends extHostConsoleForwarder_1.AbstractExtHostConsoleForwarder {
        constructor(extHostRpc, initData) {
            super(extHostRpc, initData);
        }
        _nativeConsoleLogMessage(_method, original, args) {
            original.apply(console, args);
        }
    };
    exports.ExtHostConsoleForwarder = ExtHostConsoleForwarder;
    exports.ExtHostConsoleForwarder = ExtHostConsoleForwarder = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostConsoleForwarder);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENvbnNvbGVGb3J3YXJkZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvd29ya2VyL2V4dEhvc3RDb25zb2xlRm9yd2FyZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQU16RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHlEQUErQjtRQUUzRSxZQUNxQixVQUE4QixFQUN6QixRQUFpQztZQUUxRCxLQUFLLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFa0Isd0JBQXdCLENBQUMsT0FBZ0IsRUFBRSxRQUFrQyxFQUFFLElBQWdCO1lBQ2pILFFBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQVcsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7S0FDRCxDQUFBO0lBWlksMERBQXVCO3NDQUF2Qix1QkFBdUI7UUFHakMsV0FBQSxzQ0FBa0IsQ0FBQTtRQUNsQixXQUFBLGdEQUF1QixDQUFBO09BSmIsdUJBQXVCLENBWW5DIn0=