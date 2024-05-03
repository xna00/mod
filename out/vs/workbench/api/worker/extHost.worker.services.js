/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostLogService", "vs/workbench/api/common/extHostStoragePaths", "vs/workbench/api/worker/extHostExtensionService"], function (require, exports, descriptors_1, extensions_1, log_1, extHostExtensionService_1, extHostLogService_1, extHostStoragePaths_1, extHostExtensionService_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // #########################################################################
    // ###                                                                   ###
    // ### !!! PLEASE ADD COMMON IMPORTS INTO extHost.common.services.ts !!! ###
    // ###                                                                   ###
    // #########################################################################
    (0, extensions_1.registerSingleton)(log_1.ILogService, new descriptors_1.SyncDescriptor(extHostLogService_1.ExtHostLogService, [true], true));
    (0, extensions_1.registerSingleton)(extHostExtensionService_1.IExtHostExtensionService, extHostExtensionService_2.ExtHostExtensionService, 0 /* InstantiationType.Eager */);
    (0, extensions_1.registerSingleton)(extHostStoragePaths_1.IExtensionStoragePaths, extHostStoragePaths_1.ExtensionStoragePaths, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdC53b3JrZXIuc2VydmljZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvd29ya2VyL2V4dEhvc3Qud29ya2VyLnNlcnZpY2VzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBVWhHLDRFQUE0RTtJQUM1RSw0RUFBNEU7SUFDNUUsNEVBQTRFO0lBQzVFLDRFQUE0RTtJQUM1RSw0RUFBNEU7SUFFNUUsSUFBQSw4QkFBaUIsRUFBQyxpQkFBVyxFQUFFLElBQUksNEJBQWMsQ0FBQyxxQ0FBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDcEYsSUFBQSw4QkFBaUIsRUFBQyxrREFBd0IsRUFBRSxpREFBdUIsa0NBQTBCLENBQUM7SUFDOUYsSUFBQSw4QkFBaUIsRUFBQyw0Q0FBc0IsRUFBRSwyQ0FBcUIsa0NBQTBCLENBQUMifQ==