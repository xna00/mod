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
define(["require", "exports", "vs/base/parts/request/browser/request", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/common/request"], function (require, exports, request_1, configuration_1, log_1, request_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestService = void 0;
    /**
     * This service exposes the `request` API, while using the global
     * or configured proxy settings.
     */
    let RequestService = class RequestService extends request_2.AbstractRequestService {
        constructor(configurationService, loggerService) {
            super(loggerService);
            this.configurationService = configurationService;
        }
        async request(options, token) {
            if (!options.proxyAuthorization) {
                options.proxyAuthorization = this.configurationService.getValue('http.proxyAuthorization');
            }
            return this.logAndRequest('browser', options, () => (0, request_1.request)(options, token));
        }
        async resolveProxy(url) {
            return undefined; // not implemented in the web
        }
        async loadCertificates() {
            return []; // not implemented in the web
        }
    };
    exports.RequestService = RequestService;
    exports.RequestService = RequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILoggerService)
    ], RequestService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3JlcXVlc3QvYnJvd3Nlci9yZXF1ZXN0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTaEc7OztPQUdHO0lBQ0ksSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLGdDQUFzQjtRQUl6RCxZQUN5QyxvQkFBMkMsRUFDbkUsYUFBNkI7WUFFN0MsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBSG1CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFJcEYsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBd0IsRUFBRSxLQUF3QjtZQUMvRCxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ2pDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFTLHlCQUF5QixDQUFDLENBQUM7WUFDcEcsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUEsaUJBQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFXO1lBQzdCLE9BQU8sU0FBUyxDQUFDLENBQUMsNkJBQTZCO1FBQ2hELENBQUM7UUFFRCxLQUFLLENBQUMsZ0JBQWdCO1lBQ3JCLE9BQU8sRUFBRSxDQUFDLENBQUMsNkJBQTZCO1FBQ3pDLENBQUM7S0FDRCxDQUFBO0lBekJZLHdDQUFjOzZCQUFkLGNBQWM7UUFLeEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLG9CQUFjLENBQUE7T0FOSixjQUFjLENBeUIxQiJ9