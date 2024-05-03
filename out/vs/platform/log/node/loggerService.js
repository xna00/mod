/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uuid", "vs/platform/log/common/log", "vs/platform/log/node/spdlogLog"], function (require, exports, uuid_1, log_1, spdlogLog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerService = void 0;
    class LoggerService extends log_1.AbstractLoggerService {
        doCreateLogger(resource, logLevel, options) {
            return new spdlogLog_1.SpdLogLogger((0, uuid_1.generateUuid)(), resource.fsPath, !options?.donotRotate, !!options?.donotUseFormatters, logLevel);
        }
    }
    exports.LoggerService = LoggerService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbG9nL25vZGUvbG9nZ2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFPaEcsTUFBYSxhQUFjLFNBQVEsMkJBQXFCO1FBRTdDLGNBQWMsQ0FBQyxRQUFhLEVBQUUsUUFBa0IsRUFBRSxPQUF3QjtZQUNuRixPQUFPLElBQUksd0JBQVksQ0FBQyxJQUFBLG1CQUFZLEdBQUUsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzFILENBQUM7S0FDRDtJQUxELHNDQUtDIn0=