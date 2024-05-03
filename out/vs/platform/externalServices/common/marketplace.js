/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, serviceMachineId_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMarketplaceHeaders = resolveMarketplaceHeaders;
    async function resolveMarketplaceHeaders(version, productService, environmentService, configurationService, fileService, storageService, telemetryService) {
        const headers = {
            'X-Market-Client-Id': `VSCode ${version}`,
            'User-Agent': `VSCode ${version} (${productService.nameShort})`
        };
        if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(configurationService) === 3 /* TelemetryLevel.USAGE */) {
            const serviceMachineId = await (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
            headers['X-Market-User-Id'] = serviceMachineId;
            // Send machineId as VSCode-SessionId so we can correlate telemetry events across different services
            // machineId can be undefined sometimes (eg: when launching from CLI), so send serviceMachineId instead otherwise
            // Marketplace will reject the request if there is no VSCode-SessionId header
            headers['VSCode-SessionId'] = telemetryService.machineId || serviceMachineId;
        }
        return headers;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2V0cGxhY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVybmFsU2VydmljZXMvY29tbW9uL21hcmtldHBsYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBWWhHLDhEQXVCQztJQXZCTSxLQUFLLFVBQVUseUJBQXlCLENBQUMsT0FBZSxFQUM5RCxjQUErQixFQUMvQixrQkFBdUMsRUFDdkMsb0JBQTJDLEVBQzNDLFdBQXlCLEVBQ3pCLGNBQTJDLEVBQzNDLGdCQUFtQztRQUVuQyxNQUFNLE9BQU8sR0FBYTtZQUN6QixvQkFBb0IsRUFBRSxVQUFVLE9BQU8sRUFBRTtZQUN6QyxZQUFZLEVBQUUsVUFBVSxPQUFPLEtBQUssY0FBYyxDQUFDLFNBQVMsR0FBRztTQUMvRCxDQUFDO1FBRUYsSUFBSSxJQUFBLGtDQUFpQixFQUFDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxJQUFJLElBQUEsa0NBQWlCLEVBQUMsb0JBQW9CLENBQUMsaUNBQXlCLEVBQUUsQ0FBQztZQUMvSCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBQSxzQ0FBbUIsRUFBQyxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDcEcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsZ0JBQWdCLENBQUM7WUFDL0Msb0dBQW9HO1lBQ3BHLGlIQUFpSDtZQUNqSCw2RUFBNkU7WUFDN0UsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxJQUFJLGdCQUFnQixDQUFDO1FBQzlFLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDIn0=