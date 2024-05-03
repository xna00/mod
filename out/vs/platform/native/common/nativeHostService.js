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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/ipc/common/mainProcessService"], function (require, exports, ipc_1, mainProcessService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostService = void 0;
    // @ts-ignore: interface is implemented via proxy
    let NativeHostService = class NativeHostService {
        constructor(windowId, mainProcessService) {
            this.windowId = windowId;
            return ipc_1.ProxyChannel.toService(mainProcessService.getChannel('nativeHost'), {
                context: windowId,
                properties: (() => {
                    const properties = new Map();
                    properties.set('windowId', windowId);
                    return properties;
                })()
            });
        }
    };
    exports.NativeHostService = NativeHostService;
    exports.NativeHostService = NativeHostService = __decorate([
        __param(1, mainProcessService_1.IMainProcessService)
    ], NativeHostService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlSG9zdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL25hdGl2ZS9jb21tb24vbmF0aXZlSG9zdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBTWhHLGlEQUFpRDtJQUMxQyxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFpQjtRQUk3QixZQUNVLFFBQWdCLEVBQ0osa0JBQXVDO1lBRG5ELGFBQVEsR0FBUixRQUFRLENBQVE7WUFHekIsT0FBTyxrQkFBWSxDQUFDLFNBQVMsQ0FBcUIsa0JBQWtCLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUM5RixPQUFPLEVBQUUsUUFBUTtnQkFDakIsVUFBVSxFQUFFLENBQUMsR0FBRyxFQUFFO29CQUNqQixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBbUIsQ0FBQztvQkFDOUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBRXJDLE9BQU8sVUFBVSxDQUFDO2dCQUNuQixDQUFDLENBQUMsRUFBRTthQUNKLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBbEJZLDhDQUFpQjtnQ0FBakIsaUJBQWlCO1FBTTNCLFdBQUEsd0NBQW1CLENBQUE7T0FOVCxpQkFBaUIsQ0FrQjdCIn0=