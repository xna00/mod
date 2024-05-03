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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/browser/requestService", "vs/platform/instantiation/common/extensions", "vs/platform/request/common/request", "vs/platform/native/common/native"], function (require, exports, configuration_1, log_1, requestService_1, extensions_1, request_1, native_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeRequestService = void 0;
    let NativeRequestService = class NativeRequestService extends requestService_1.RequestService {
        constructor(configurationService, loggerService, nativeHostService) {
            super(configurationService, loggerService);
            this.nativeHostService = nativeHostService;
        }
        async resolveProxy(url) {
            return this.nativeHostService.resolveProxy(url);
        }
        async loadCertificates() {
            return this.nativeHostService.loadCertificates();
        }
    };
    exports.NativeRequestService = NativeRequestService;
    exports.NativeRequestService = NativeRequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILoggerService),
        __param(2, native_1.INativeHostService)
    ], NativeRequestService);
    (0, extensions_1.registerSingleton)(request_1.IRequestService, NativeRequestService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZXF1ZXN0L2VsZWN0cm9uLXNhbmRib3gvcmVxdWVzdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBU3pGLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsK0JBQWM7UUFFdkQsWUFDd0Isb0JBQTJDLEVBQ2xELGFBQTZCLEVBQ2pCLGlCQUFxQztZQUVqRSxLQUFLLENBQUMsb0JBQW9CLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFGZixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1FBR2xFLENBQUM7UUFFUSxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQVc7WUFDdEMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFUSxLQUFLLENBQUMsZ0JBQWdCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDbEQsQ0FBQztLQUNELENBQUE7SUFqQlksb0RBQW9CO21DQUFwQixvQkFBb0I7UUFHOUIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9CQUFjLENBQUE7UUFDZCxXQUFBLDJCQUFrQixDQUFBO09BTFIsb0JBQW9CLENBaUJoQztJQUVELElBQUEsOEJBQWlCLEVBQUMseUJBQWUsRUFBRSxvQkFBb0Isb0NBQTRCLENBQUMifQ==