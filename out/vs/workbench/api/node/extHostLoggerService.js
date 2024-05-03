/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostLoggerService", "vs/base/common/network", "vs/platform/log/node/spdlogLog", "vs/base/common/uuid"], function (require, exports, extHostLoggerService_1, network_1, spdlogLog_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    class ExtHostLoggerService extends extHostLoggerService_1.ExtHostLoggerService {
        doCreateLogger(resource, logLevel, options) {
            if (resource.scheme === network_1.Schemas.file) {
                /* Create the logger in the Extension Host process to prevent loggers (log, output channels...) traffic  over IPC */
                return new spdlogLog_1.SpdLogLogger(options?.name || (0, uuid_1.generateUuid)(), resource.fsPath, !options?.donotRotate, !!options?.donotUseFormatters, logLevel);
            }
            return super.doCreateLogger(resource, logLevel, options);
        }
        registerLogger(resource) {
            super.registerLogger(resource);
            this._proxy.$registerLogger(resource);
        }
        deregisterLogger(resource) {
            super.deregisterLogger(resource);
            this._proxy.$deregisterLogger(resource);
        }
    }
    exports.ExtHostLoggerService = ExtHostLoggerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdExvZ2dlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvbm9kZS9leHRIb3N0TG9nZ2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBYSxvQkFBcUIsU0FBUSwyQ0FBd0I7UUFFOUMsY0FBYyxDQUFDLFFBQWEsRUFBRSxRQUFrQixFQUFFLE9BQXdCO1lBQzVGLElBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxpQkFBTyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN0QyxvSEFBb0g7Z0JBQ3BILE9BQU8sSUFBSSx3QkFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksSUFBQSxtQkFBWSxHQUFFLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMzSSxDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDMUQsQ0FBQztRQUVRLGNBQWMsQ0FBQyxRQUF5QjtZQUNoRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFUSxnQkFBZ0IsQ0FBQyxRQUFhO1lBQ3RDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FFRDtJQXBCRCxvREFvQkMifQ==