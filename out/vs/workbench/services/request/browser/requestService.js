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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/common/requestIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/request/browser/requestService", "vs/platform/commands/common/commands"], function (require, exports, configuration_1, log_1, requestIpc_1, remoteAgentService_1, requestService_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserRequestService = void 0;
    let BrowserRequestService = class BrowserRequestService extends requestService_1.RequestService {
        constructor(remoteAgentService, configurationService, loggerService) {
            super(configurationService, loggerService);
            this.remoteAgentService = remoteAgentService;
        }
        async request(options, token) {
            try {
                const context = await super.request(options, token);
                const connection = this.remoteAgentService.getConnection();
                if (connection && context.res.statusCode === 405) {
                    return this._makeRemoteRequest(connection, options, token);
                }
                return context;
            }
            catch (error) {
                const connection = this.remoteAgentService.getConnection();
                if (connection) {
                    return this._makeRemoteRequest(connection, options, token);
                }
                throw error;
            }
        }
        _makeRemoteRequest(connection, options, token) {
            return connection.withChannel('request', channel => new requestIpc_1.RequestChannelClient(channel).request(options, token));
        }
    };
    exports.BrowserRequestService = BrowserRequestService;
    exports.BrowserRequestService = BrowserRequestService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILoggerService)
    ], BrowserRequestService);
    // --- Internal commands to help authentication for extensions
    commands_1.CommandsRegistry.registerCommand('_workbench.fetchJSON', async function (accessor, url, method) {
        const result = await fetch(url, { method, headers: { Accept: 'application/json' } });
        if (result.ok) {
            return result.json();
        }
        else {
            throw new Error(result.statusText);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZXF1ZXN0L2Jyb3dzZXIvcmVxdWVzdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBWXpGLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsK0JBQWM7UUFFeEQsWUFDdUMsa0JBQXVDLEVBQ3RELG9CQUEyQyxFQUNsRCxhQUE2QjtZQUU3QyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFKTCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1FBSzlFLENBQUM7UUFFUSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQXdCLEVBQUUsS0FBd0I7WUFDeEUsSUFBSSxDQUFDO2dCQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDM0QsSUFBSSxVQUFVLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFLENBQUM7b0JBQ2xELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzVELENBQUM7Z0JBQ0QsT0FBTyxPQUFPLENBQUM7WUFDaEIsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDM0QsSUFBSSxVQUFVLEVBQUUsQ0FBQztvQkFDaEIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDNUQsQ0FBQztnQkFDRCxNQUFNLEtBQUssQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRU8sa0JBQWtCLENBQUMsVUFBa0MsRUFBRSxPQUF3QixFQUFFLEtBQXdCO1lBQ2hILE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGlDQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoSCxDQUFDO0tBQ0QsQ0FBQTtJQTlCWSxzREFBcUI7b0NBQXJCLHFCQUFxQjtRQUcvQixXQUFBLHdDQUFtQixDQUFBO1FBQ25CLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxvQkFBYyxDQUFBO09BTEoscUJBQXFCLENBOEJqQztJQUVELDhEQUE4RDtJQUU5RCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxXQUFXLFFBQTBCLEVBQUUsR0FBVyxFQUFFLE1BQWM7UUFDL0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVyRixJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNmLE9BQU8sTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsQ0FBQztJQUNGLENBQUMsQ0FBQyxDQUFDIn0=